import {BirthdayAudio} from './birthday.js';
import {createWorld,T} from './scene.js';
import {loadCharacters,greetings} from './characters.js';
import {createEffects,createFind,icon} from './effects.js';
import {places,coupons,objects} from './cards.js';
import {createCake,createObjectViewer} from './objects.js';
import {Sound} from './audio.js';
import {Deck,shuffle,ease,clamp,jumpPose,jumpDuration,partyIds,partyTiming,photosDue,loadCount,saveCount} from './logic.js';
const $=s=>document.querySelector(s),sound=new Sound(),birthdayAudio=new BirthdayAudio(sound);let partyExit=null,voiceStarted=false;function currentPartyTiming(){const exit=partyExit??1e9;return {exit,end:exit+1.7}}
let world,chars,effects,find,state='loading',time=0,elapsed=0,count=0,selected=null,party=[],photoDone=0,photoAfter=false,shake=0,lastFlip=0,lastBoom=-1,lastStep=-1,speechUntil=0,lastFrame=0;
try{count=loadCount(localStorage)}catch{}
let turns=3,allParty=false,cake,viewer;const flipDeck=new Deck([1,2,3]);
const placeDeck=new Deck(places),objectDeck=new Deck(objects),couponDeck=new Deck(coupons);let familyDeck;
const typeDeck=new Deck(['place','place','place','place','place','place','postcard','postcard','postcard','object','object','coupon']);
const dig=$('#dig'),modal=$('#card');
function say(text,seconds=2){$('#speech').textContent=text;$('#speech').classList.add('show');speechUntil=elapsed+seconds}
function progress(){ $('#count').textContent=`Бабане раскопала: ${count} бумажек`;$('#dots').innerHTML=Array.from({length:3},(_,i)=>`<i class="${i<count%3?'on':''}"></i>`).join('');$('#until').textContent=`До семейного хоровода: ${3-count%3} находок`;}
function setState(next){state=next;time=0;dig.disabled=next!=='idle';$('#action').textContent=next==='idle'?'Нырнуть за сюрпризом':next==='party'?'Семья идёт обниматься!':next==='photo'?'Ещё один ракурс…':next==='intro'?'Бабане заметила кое-что…':`${turns} сальто — и в кучу!`;if(next==='idle'){$('#hint').textContent='Нажми на гору или на кнопку · мышкой и пальцем';dig.focus({preventScroll:true})}}
function nextFind(){let kind=typeDeck.next();if(kind==='place')return placeDeck.next();if(kind==='object')return objectDeck.next();if(kind==='coupon')return couponDeck.next();let a=familyDeck.next();return {type:'postcard',title:`От ${a.name==='Деде'?'Деде':a.name}`,sender:a.name,character:a,fact:'С днём рождения, любимая Бабане!',joke:greetings[a.id]};}
function startDig(){if(state!=='idle')return;sound.activate();birthdayAudio.prepare();selected=nextFind();turns=flipDeck.next();find.set(selected);lastFlip=0;$('#speech').classList.remove('show');setState('jump');sound.play('jump');}
dig.addEventListener('click',startDig);
$('#world').addEventListener('pointerup',e=>{if(state==='idle'&&world.isPile(e))startDig()});
$('#world').addEventListener('pointermove',e=>{$('#world').style.cursor=state==='idle'&&world.isPile(e)?'pointer':'default'});
$('#sound').addEventListener('click',()=>{let on=sound.toggle();$('#sound').textContent=on?'♫':'♪̸';$('#sound').setAttribute('aria-label',on?'Отключить звуки':'Включить звуки');$('#sound').title=on?'Звуки включены':'Звуки выключены';});
function showCard(){setState('card');find.group.visible=false;count++;try{saveCount(localStorage,count)}catch{}progress();modal.className=selected.type;$('#card-kind').textContent={place:'БИЛЕТ В НОВОЕ ПРИКЛЮЧЕНИЕ',postcard:'ПОЧТА ЛЮБИМОЙ СЕМЬИ',object:'БЮРО НЕОБЫЧНЫХ НАХОДОК',coupon:'МУЗЕЙНЫЙ СУПЕРБИЛЕТ'}[selected.type];$('#card-title').textContent=selected.type==='postcard'?selected.sender:selected.title;$('#card-fact').textContent=selected.fact||'Определённо не обычная бумажка.';$('#card-joke').textContent=selected.joke;$('#joke-label').textContent=selected.type==='postcard'?'ДОБРОЕ ИГРОВОЕ ПОЗДРАВЛЕНИЕ':selected.type==='coupon'?'ШУТОЧНАЯ АКЦИЯ БУМАЖНОГО МИРА':'ИЗ ВЫДУМАННОГО ДНЕВНИКА БАБАНЕ';$('#card-number').textContent=`НАХОДКА № ${String(count).padStart(3,'0')}`;
 const art=$('#card-art');art.className=selected.type==='postcard'?'family':'';art.replaceChildren();if(selected.character){const img=new Image();img.src=selected.character.portrait;img.alt=selected.sender;art.append(img)}else if(selected.type==='object')viewer.show(selected,art);else art.innerHTML=icon(selected.icon||'map');
 const source=$('#source');source.hidden=!selected.source;if(selected.source)source.href=selected.source;else source.removeAttribute('href');photoAfter=Math.random()<.13;modal.showModal();sound.play(selected.type==='postcard'?'gift':selected.type==='object'?'object':'card');$('#continue').focus();}
function closeCard(){if(state!=='card')return;modal.close();viewer.hide();chars.hero.root.visible=true;chars.hero.root.position.set(0,1.3,2.1);setState('return');sound.play('paper')}
$('#continue').addEventListener('click',closeCard);$('#close').addEventListener('click',closeCard);modal.addEventListener('cancel',e=>{e.preventDefault();closeCard()});
function idle(){chars.hero.root.position.set(-4.6,1.3,2.1);chars.hero.root.scale.set(1,1,1);chars.hero.pivot.rotation.z=0;chars.hero.root.visible=true;setState('idle')}
function afterReturn(){if(count>0&&count%3===0)startParty();else if(photoAfter)startPhoto();else idle()}
const phone=new T.Group();let body=new T.Mesh(new T.BoxGeometry(.3,.51,.055),new T.MeshBasicMaterial({color:'#304a3a'}));phone.add(body);let screen=new T.Mesh(new T.PlaneGeometry(.23,.37),new T.MeshBasicMaterial({color:'#a9d4c0'}));screen.position.z=.031;phone.add(screen);phone.visible=false;
function startPhoto(){photoAfter=false;photoDone=0;phone.visible=true;setState('photo');say(['Подождите! Ещё один ракурс!','Музей закрывается? Тогда снимаем быстрее!','Красота не ждёт. Нажимаем десять раз!'][Math.floor(Math.random()*3)],3.4)}
function startParty(){birthdayAudio.stop();partyExit=null;voiceStarted=false;setState('party');lastBoom=-1;lastStep=-1;const ids=partyIds(count);allParty=ids.length===14;document.querySelector('#birthday').classList.toggle('grand',allParty);party=ids.map((id,i)=>{const a=chars.items.find(c=>c.id===id);a.root.visible=true;a.root.scale.setScalar(allParty?.67:.8);const side=i%2?-1:1;const startX=side*(14+i*.5),startZ=2+Math.random()*5;a.root.position.set(startX,1,startZ);return {a,angle:i/ids.length*Math.PI*2,delay:(i%4)*.08,startX,startZ,rad:allParty?6.8:4.8}});say(allParty?'Вся семья! И кое-кто принёс торт…':'Слышишь? Это свои!',1.5);}
let errorShown=false;
function fatal(error){if(errorShown)return;errorShown=true;console.error(error);globalThis.kuchaBoot?.stop();$('#loading').hidden=true;$('#error').hidden=false;$('#error-text').textContent=error.message?.includes('WebGL')?'Браузер не смог включить WebGL. Попробуйте аппаратное ускорение или другой браузер.':`Не удалось запустить игру: ${error.message}. Откройте её через веб-сервер по инструкции README.`;dig.disabled=true;}
function frame(stamp){try{const dt=Math.min(.05,Math.max(0,(stamp-lastFrame)/1000||.016));lastFrame=stamp;elapsed+=dt;time+=dt;const h=chars.hero;shake=Math.max(0,shake-dt*2);if(elapsed>speechUntil)$('#speech').classList.remove('show');
 switch(state){
 case'intro':{
 if(time<.75){h.root.position.set(-10+ease(time/.75)*3,1.3+Math.abs(Math.sin(time*14))*.12,2.1)}else if(time<1.4){h.root.position.x=-7;h.pivot.rotation.z=Math.sin(time*12)*.06;if(time-dt<.75)say('Ого! Сколько непрочитанных приключений!',2.4)}else{let t=clamp((time-1.4)/1.3);h.root.position.x=-7+ease(t)*2.4;h.root.position.y=1.3+Math.abs(Math.sin(time*15))*.14;h.pivot.rotation.z=Math.sin(time*12)*.05}if(time>3)idle();break}
 case'idle':h.root.position.y=1.3+Math.sin(elapsed*2.3)*.045;h.pivot.rotation.z=Math.sin(elapsed*1.7)*.025;break;
 case'jump':{
 const landing=.18+jumpDuration(turns);
 if(time<.18){const q=Math.sin(time/.18*Math.PI);h.root.scale.set(1+q*.13,1-q*.2,1);h.root.position.y=1.3-q*.18}else if(time<landing){h.root.scale.set(1,1,1);const p=jumpPose(time,turns);h.root.position.set(p.x,p.y,p.z);h.pivot.rotation.z=p.angle;let done=Math.min(turns,Math.floor(p.progress*turns));$('#flips').hidden=false;$('#flips').textContent=`${done} / ${turns} сальто`;if(done>lastFlip){lastFlip=done;sound.play('flip')}}else{
 if(time-dt<landing){lastFlip=turns;sound.play('flip');h.root.visible=false;h.pivot.rotation.z=0;world.hitPile();shake=.7;sound.play('impact');sound.play('paper');$('#flips').textContent=`${turns} / ${turns} — мягкая посадка!`}
 if(time>landing+.3){$('#flips').hidden=true;setState('emerge')}
 }break}
 case'emerge':find.update(time);if(time>1)showCard();break;
 case'card':if(selected.type==='object')viewer.update(time);break;
 case'return':{const q=ease(time/.8);h.root.position.set(-4.6*q,1.3+Math.sin(q*Math.PI)*.9,2.1);h.pivot.rotation.z=Math.sin(q*Math.PI)*.15;if(time>.8)afterReturn();break}
 case'photo':{
 h.pivot.rotation.z=-.09;phone.quaternion.copy(world.camera.quaternion);phone.position.copy(h.root.position).add(new T.Vector3(.72,.07,.1));let due=photosDue(time,photoDone);for(let i=0;i<due;i++){photoDone++;sound.play('camera');$('#flash').style.opacity='.52';}$('#flips').hidden=false;$('#flips').textContent=`Фото ${photoDone} / 10`;$('#flash').style.opacity=Math.max(0,Number($('#flash').style.opacity)-dt*4);if(time>3.2){phone.visible=false;$('#flash').style.opacity='0';$('#flips').hidden=true;idle();say('Всего десять фотографий? Это была разминка!',2.6)}break}
 case'party':{
 if(time>=1.65&&!voiceStarted){voiceStarted=true;birthdayAudio.start(count)}if(voiceStarted&&birthdayAudio.finished()&&partyExit===null)partyExit=Math.max(time+.25,partyTiming(allParty).exit);const timing=currentPartyTiming();let enter=ease(time/1.5),exit=ease((time-timing.exit)/1.5),dance=clamp(time-1.65,0,timing.exit-1.65);cake.update(time,allParty,exit);h.root.position.set(-4.6*(1-enter)*(1-exit)-4.6*exit,1.3+Math.abs(Math.sin(time*7))*.08*(1-exit),2.1+(7-2.1)*enter*(1-exit));h.pivot.rotation.z=Math.sin(time*6)*.09;
 for(const p of party){let q=ease((time-p.delay)/1.35),angle=p.angle+dance*.65,tx=Math.cos(angle)*p.rad,tz=7+Math.sin(angle)*(allParty?2.8:2.2);const a=p.a;let out=ease((time-timing.exit-p.delay*.4)/1.4);a.root.position.set(p.startX+(tx-p.startX)*q+(p.startX-tx)*out,.73+Math.abs(Math.sin(time*9+p.angle))*.13,tz+(p.startZ-tz)*(1-q)+(p.startZ-tz)*out);a.pivot.rotation.z=Math.sin(time*7+p.angle)*.09;if(out>=1)a.root.visible=false;}
 let step=Math.floor(time*5);if(step!==lastStep&&(time<1.7||time>timing.exit)){lastStep=step;sound.play('step')}
 if(time>1.65&&time<timing.exit){$('#birthday').hidden=false;let boom=Math.floor((time-1.65)/(allParty?.28:.62));if(boom!==lastBoom){lastBoom=boom;effects.firework((Math.random()-.5)*12,5.5+Math.random()*2.5,3);sound.play('firework')}}else $('#birthday').hidden=true;
 if(time>timing.end){party.forEach(p=>{p.a.root.visible=false;p.a.pivot.rotation.z=0});party=[];birthdayAudio.stop();cake.hide();$('#birthday').hidden=true;if(photoAfter)startPhoto();else idle()}break}
 }
 effects.update(dt);world.update(dt,elapsed,shake,state==='party'?ease(time/1.2)*(1-ease((time-currentPartyTiming().exit)/1.5)):0);chars.updateLabels();requestAnimationFrame(frame);
 }catch(e){fatal(e)}}
async function init(){try{globalThis.kuchaBoot?.progress(0,15);await new Promise(resolve=>setTimeout(resolve,0));world=createWorld($('#world'));chars=await loadCharacters(world.scene,world.camera);familyDeck=new Deck(chars.items.slice(1));effects=createEffects(world.scene);find=createFind(world.scene);cake=createCake(world.scene);viewer=createObjectViewer();world.scene.add(phone);progress();globalThis.kuchaBoot?.stop();$('#loading').hidden=true;setState('intro');chars.hero.root.position.x=-10;if(chars.warnings.length)say('Не загрузились рисунки: '+chars.warnings.join(', '),7);$('#world').addEventListener('webglcontextlost',e=>{e.preventDefault();fatal(new Error('WebGL-контекст потерян. Перезагрузите страницу; счётчик сохранён.'))});document.addEventListener('visibilitychange',()=>{lastFrame=performance.now()});lastFrame=performance.now();requestAnimationFrame(frame)}catch(e){fatal(e)}}
init();
