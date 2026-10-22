export function birthdayLanguage(count){const n=Math.floor(count/3)-1,group=((n%4)+4)%4;return group===0?(Math.floor(n/4)%2===0?'pt':'tr'):['pt','kk','ru','en'][group]}
export class BirthdayAudio{
 constructor(sound){this.sound=sound;this.cache={};this.status='idle';this.token=0;this.source=null;this.timer=null}
 prepare(){const c=this.sound.ctx;if(!c)return;for(const [lang,item] of Object.entries(globalThis.KUCHA_BIRTHDAYS||{})){if(this.cache[lang])continue;this.cache[lang]=new Promise(resolve=>{let settled=false;const finish=v=>{if(settled)return;settled=true;clearTimeout(timer);resolve(v)};const timer=setTimeout(()=>finish(null),8000);try{const bytes=Uint8Array.from(atob(item.base64),x=>x.charCodeAt(0));c.decodeAudioData(bytes.buffer).then(buffer=>finish({buffer,gain:item.gain}),()=>finish(null))}catch{finish(null)}})}}
 start(count){this.stop();const token=this.token,c=this.sound.ctx;this.status='loading';this.prepare();const lang=birthdayLanguage(count);if(!c||c.state!=='running'||!this.cache[lang]){this.status='failed';return}
 this.timer=setTimeout(()=>{if(token===this.token)this.stop('failed')},10000);
 this.cache[lang].then(item=>{if(token!==this.token)return;clearTimeout(this.timer);if(!item){this.status='failed';return}try{const source=c.createBufferSource(),gain=c.createGain();source.buffer=item.buffer;gain.gain.value=item.gain;source.connect(gain).connect(this.sound.master);this.source=source;this.gain=gain;this.status='playing';this.sound.speaking=true;source.onended=()=>{source.disconnect();gain.disconnect();if(token===this.token){this.status='done';this.source=null;this.gain=null;this.sound.speaking=false;clearTimeout(this.timer)}};source.start();this.timer=setTimeout(()=>{if(token===this.token)this.stop('failed')},(item.buffer.duration+12)*1000)}catch{this.stop('failed')}})
 }
 finished(){return this.status==='done'||this.status==='failed'}
 stop(status='idle'){this.token++;clearTimeout(this.timer);if(this.source){this.source.onended=null;try{this.source.stop()}catch{}this.source.disconnect();this.source=null}if(this.gain){this.gain.disconnect();this.gain=null}this.sound.speaking=false;this.status=status}
}
