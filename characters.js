import * as THREE from './three.module.js';
export async function loadCharacters(scene,camera){
 const definitions=globalThis.KUCHA_ASSETS?.characters || await fetch('./characters.json', {signal:AbortSignal.timeout(10000)}).then(r=>{if(!r.ok)throw Error('Не удалось загрузить список персонажей');return r.json()});
 const loader=new THREE.TextureLoader();let warnings=[],completed=0;
 const loadTexture=file=>new Promise((resolve,reject)=>{let settled=false;const timer=setTimeout(()=>{settled=true;reject(Error('Не загрузился рисунок: '+file))},10000);loader.load(globalThis.KUCHA_ASSETS?.images[file]||file,t=>{if(settled){t.dispose();return}settled=true;clearTimeout(timer);resolve(t)},undefined,e=>{if(settled)return;settled=true;clearTimeout(timer);reject(e)})});
 const items=await Promise.all(definitions.map(async(d,i)=>{
 let texture,aspect=1,portrait;
 try{texture=await loadTexture(d.file);const img=texture.image,[x,y,x2,y2]=d.bounds;aspect=(x2-x)/(y2-y);texture.colorSpace=THREE.SRGBColorSpace;texture.offset.set(x/img.width,1-y2/img.height);texture.repeat.set((x2-x)/img.width,(y2-y)/img.height);texture.needsUpdate=true;
 const cv=document.createElement('canvas');cv.width=(x2-x);cv.height=(y2-y);cv.getContext('2d').drawImage(img,x,y,x2-x,y2-y,0,0,x2-x,y2-y);portrait=cv.toDataURL('image/png');
 }catch{warnings.push(d.name);const cv=document.createElement('canvas');cv.width=256;cv.height=320;const ctx=cv.getContext('2d');ctx.fillStyle='#fff9e7';ctx.fillRect(20,20,216,280);ctx.fillStyle='#40594a';ctx.textAlign='center';ctx.font='22px Arial';ctx.fillText(d.name,128,150,210);ctx.font='16px Arial';ctx.fillText('Рисунок не загрузился',128,190,210);texture=new THREE.CanvasTexture(cv);portrait=cv.toDataURL();aspect=.8;}
 const root=new THREE.Group(),pivot=new THREE.Group();root.add(pivot);
 const material=new THREE.MeshBasicMaterial({map:texture,transparent:true,alphaTest:.12,side:THREE.DoubleSide,depthWrite:true});
 const plane=new THREE.Mesh(new THREE.PlaneGeometry(aspect*2.5,2.5),material);pivot.add(plane);root.position.set(-4.6,1.3,2.1);root.visible=i===0;scene.add(root);
 const label=document.createElement('div');label.className='name-label'+(i===0?' hero':'');label.textContent=d.name;document.querySelector('#labels').append(label);
 const shadow=new THREE.Mesh(new THREE.CircleGeometry(.64,24),new THREE.MeshBasicMaterial({color:'#6c6753',transparent:true,opacity:.13,depthWrite:false}));shadow.rotation.x=-Math.PI/2;shadow.position.y=.04;scene.add(shadow);
 globalThis.kuchaBoot?.progress(++completed,definitions.length);
 return {...d,root,pivot,plane,label,shadow,portrait,height:2.5,aspect};
 }));
 const vec=new THREE.Vector3();
 function updateLabels(){const w=innerWidth,h=innerHeight,used=[];for(const a of items){a.root.quaternion.copy(camera.quaternion);a.label.hidden=!a.root.visible;a.shadow.visible=a.root.visible;if(!a.root.visible)continue;a.shadow.position.x=a.root.position.x;a.shadow.position.z=a.root.position.z;a.shadow.scale.setScalar(a.root.scale.x);a.shadow.material.opacity=Math.max(.01,.14-a.root.position.y*.012);vec.copy(a.root.position);vec.y+=1.5*a.root.scale.y;vec.project(camera);let x=(vec.x*.5+.5)*w,y=(-vec.y*.5+.5)*h;let width=a.label.offsetWidth||80,height=a.label.offsetHeight||28;x=Math.min(w-width/2-5,Math.max(width/2+5,x));for(let j=0;j<14;j++){if(used.some(b=>Math.abs(b.x-x)<(b.w+width)/2+4&&Math.abs(b.y-y)<Math.max(b.h,height)+5))y-=height+5;else break}used.push({x,y,w:width,h:height});a.label.style.left=x+'px';a.label.style.top=y+'px';a.label.style.opacity=a.root.visible?'1':'0'}}
 return {items,hero:items[0],warnings,updateLabels};
}
export const greetings={
 dede:'Бабане, желаю путешествий длиннее хорошего сериала! Я пока рассмотрю архитектуру, а ты постарайся не обойти весь город без меня.',
 sasha:'Мама, пусть жизнь подбрасывает только приятные сюрпризы! А если сюрприз лежит в куче — три сальто, и он наш!',
 masha:'Желаю чемодан, который сам собирается, и музеи, которые специально для тебя работают ещё пять минуточек!',
 kolya:'Бабане, желаю суперсилу: быть первой в музее и последней, у кого разрядился телефон!',
 misha:'Пусть приключения никогда не заканчиваются! И пусть у каждого приключения будет карман для странного сувенира.',
 lesha:'Мама, желаю здоровья, радости и бесконечной памяти в телефоне! Для твоих фотографий обычный интернет уже тесноват.',
 tanya:'Бабане, пусть билеты находятся сами, очереди расступаются, а самый необычный сувенир всегда ждёт именно тебя!',
 ira:'Бабане, я бы подарила тебе целую планету для путешествий. Но сначала давай проверим, что лежит в этой бумажке!',
 tonya:'Желаю десять тортов, сто улыбок и миллион фотографий! Только торт сначала сфотографируй, потом ешь!',
 olya:'Доченька, пусть сердце радуется каждому дню! А счастья будет столько, чтобы даже в самую большую кучу не поместилось.',
 antanes:'Желаю крепкого здоровья и отличного настроения! Вперёд к приключениям — и обязательно мягкой посадки после третьего сальто!',
 nina:'Бабане, пусть каждый день будет добрым! А твой запас сил остаётся загадкой даже для самых серьёзных музеев науки.',
 katya:'Сестрёнка, желаю новых дорог и сумасшедше прекрасных открытий! Я — к вершинам, ты — к экспонатам. Встречаемся у торта!',
 galya:'Бабане, пусть каждый новый маршрут приводит к радости! А навигатор смирится: иногда ты и сама лучше знаешь, где интересно.'
};
