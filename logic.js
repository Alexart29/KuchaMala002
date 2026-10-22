export const clamp=(n,a=0,b=1)=>Math.min(b,Math.max(a,n));
export const ease=n=>{n=clamp(n);return n*n*(3-2*n)};
export function shuffle(a,rng=Math.random){a=[...a];for(let i=a.length-1;i>0;i--){let j=Math.floor(rng()*(i+1));[a[i],a[j]]=[a[j],a[i]]}return a}
export class Deck{constructor(items,rng=Math.random){this.items=items;this.rng=rng;this.pool=[];this.last=null}next(){if(!this.pool.length){this.pool=shuffle(this.items,this.rng);if(this.pool.length>1&&this.pool.at(-1)===this.last)[this.pool[0],this.pool[this.pool.length-1]]=[this.pool.at(-1),this.pool[0]]}return this.last=this.pool.pop()}}
export const jumpDuration=turns=>.62+turns*.19;
export function jumpPose(t,turns=3){const q=clamp((t-.18)/jumpDuration(turns));return {x:-4.6+4.6*q,y:1.3+Math.sin(Math.PI*q)*4.3+q*1.3,z:2.1*(1-q),angle:-Math.PI*2*turns*q,progress:q}}
export const familyGroups=[['ira','tonya','lesha','tanya'],['masha','sasha','kolya','misha'],['galya','katya','nina','antanes','olya','dede']];
export function partyIds(count){const index=(Math.floor(count/3)-1)%4;return index===3?familyGroups.flat():familyGroups[index]||[]}
export function partyTiming(all){return {exit:all?9:4.3,end:all?10.7:6}}
export function photosDue(t,done){return Math.max(0,Math.min(10,Math.floor(Math.max(0,t-.5)/.19)+Number(t>=.5))-done)}
export function loadCount(store){try{let n=Number(store.getItem('kucha-mala-count'));return Number.isSafeInteger(n)&&n>=0?n:0}catch{return 0}}
export function saveCount(store,n){try{store.setItem('kucha-mala-count',String(n))}catch{}}
