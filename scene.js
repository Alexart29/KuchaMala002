import * as T from './three.module.js';
import {clamp,ease} from './logic.js';
export {T};
export function crumpled(seed=1){
 // A folded, open sheet wrapped irregularly around itself. Not a sphere primitive.
 const n=8,vertices=[],indices=[],uv=[];let rand=()=>{seed=(seed*1664525+1013904223)>>>0;return seed/4294967296};
 const jitter=Array.from({length:(n+1)*(n+1)},()=>rand());
 for(let y=0;y<=n;y++)for(let x=0;x<=n;x++){
 const u=x/n,v=y/n,theta=(u*1.86+.04)*Math.PI,phi=(v*.89+.06)*Math.PI;
 const fold=(x%2?.11:-.10)+(y%2?.08:-.06),r=.55+jitter[y*(n+1)+x]*.21+fold;
 vertices.push(Math.sin(phi)*Math.cos(theta)*r,Math.cos(phi)*r*.82+Math.sin(u*19+v*11)*.085,Math.sin(phi)*Math.sin(theta)*r*.9);
 uv.push(u,v);
 if(x<n&&y<n){let a=y*(n+1)+x,b=a+1,c=a+n+1,d=c+1;if((x+y)%2)indices.push(a,c,b,b,c,d);else indices.push(a,c,d,a,d,b)}
 }
 let g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(vertices,3));g.setAttribute('uv',new T.Float32BufferAttribute(uv,2));g.setIndex(indices);g=g.toNonIndexed();g.computeVertexNormals();return g;
}
export function createWorld(canvas){
 const renderer=new T.WebGLRenderer({canvas,antialias:true,alpha:false,powerPreference:'high-performance'});renderer.setPixelRatio(Math.min(devicePixelRatio,1.6));renderer.shadowMap.enabled=true;renderer.shadowMap.type=T.PCFSoftShadowMap;renderer.outputColorSpace=T.SRGBColorSpace;renderer.toneMapping=T.ACESFilmicToneMapping;renderer.toneMappingExposure=1.18;
 const scene=new T.Scene();scene.background=new T.Color('#f0ede2');scene.fog=new T.Fog('#f0ede2',100,200);
 const camera=new T.PerspectiveCamera(37,innerWidth/innerHeight,.1,200),target=new T.Vector3(0,1.25,0);let basePosition=new T.Vector3();
 scene.add(new T.HemisphereLight('#fff5df','#849780',2.6));let sun=new T.DirectionalLight('#fff3d6',3.2);sun.position.set(-8,15,9);sun.castShadow=true;sun.shadow.mapSize.set(2048,2048);sun.shadow.camera.left=-17;sun.shadow.camera.right=17;sun.shadow.camera.top=14;sun.shadow.camera.bottom=-12;sun.shadow.normalBias=.035;sun.shadow.bias=-.0001;scene.add(sun);
 const mat=(color,extra={})=>new T.MeshStandardMaterial({color,roughness:1,flatShading:true,...extra});const cream=mat('#eee9d8'),mint=mat('#bfc9b2'),pink=mat('#ddb39b'),green=mat('#9baa8f');
 function mesh(g,m,x,y,z){const a=new T.Mesh(g,m);a.position.set(x,y,z);a.castShadow=true;a.receiveShadow=true;scene.add(a);return a}
 // Thick cut-paper stage, stacked irregular concentric contours.
 for(let i=0;i<4;i++){let stage=mesh(new T.CylinderGeometry(11.2-i*.14,11.35-i*.14,.18,80),i%2?cream:mint,0,-.65+i*.18,0);stage.scale.z=.73}
 const floor=mesh(new T.PlaneGeometry(200,200),mat('#ede8db'),0,-.85,0);floor.rotation.x=-Math.PI/2;
 // Paper hills behind the stage: thin folded semicircles.
 for(let i=0;i<7;i++){let x=-15+i*5,shape=new T.Shape();shape.moveTo(-5,0);shape.quadraticCurveTo(-3,4+(i%3),0,4.4+(i%2));shape.quadraticCurveTo(3,4.5,5,0);shape.lineTo(-5,0);const g=new T.ExtrudeGeometry(shape,{depth:.12,bevelEnabled:false,curveSegments:12});mesh(g,[mint,cream,pink][i%3],x,-.7,-9-(i%2)*2)}
 function tree(x,z,s){const stem=mesh(new T.BoxGeometry(.11,1.7,.14),mat('#b9a489'),x,.2,z);const crown=mesh(new T.ConeGeometry(.9,2.8,5),green,x,2*s,z);crown.scale.setScalar(s);crown.rotation.y=.5;mesh(new T.ConeGeometry(.72,1.6,5),mint,x,2.4*s,z+.05);}
 [[-8,-2,1],[-6,-5,.9],[7,-4,1.1],[9,-1,.8],[-9,3,.7],[9,4,.65]].forEach(a=>tree(...a));
 const cloudMat=mat('#fffdf3');const clouds=[];
 for(let k=0;k<5;k++){let group=new T.Group();for(let j=0;j<4;j++){const o=new T.Mesh(new T.SphereGeometry(.65+Math.sin(j*2)*.18,12,6),cloudMat);o.scale.z=.12;o.position.set(j*.66,Math.sin(j*2)*.15,0);group.add(o)}group.position.set(-13+k*6,6.2+k%2,-9-k%2);group.rotation.x=-.08;scene.add(group);clouds.push(group)}
 // Bunting: real cut triangles hung across the back of the diorama.
 for(let i=0;i<18;i++){let x=-9+i*1.03,y=5.5-Math.sin(i/17*Math.PI)*1.3,g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute([-.36,0,0,.36,0,0,0,-.57,.04],3));g.computeVertexNormals();mesh(g,mat(['#c9987b','#a0b6a4','#e0c477','#eee7d3'][i%4],{side:T.DoubleSide}),x,y,-5.8)}
 let rope=new T.BufferGeometry().setFromPoints(Array.from({length:50},(_,i)=>new T.Vector3(-9.4+i*.375,5.52-Math.sin(i/49*Math.PI)*1.3,-5.8)));scene.add(new T.Line(rope,new T.LineBasicMaterial({color:'#a38d72'})));
 // Six mesh variants, 480 individually transformed sheets, six draw calls.
 let papers=[],batches=[],dummy=new T.Object3D();
 for(let b=0;b<6;b++){let inst=new T.InstancedMesh(crumpled(112+b*773),mat(['#f7f4e9','#eeeadd','#fffdf5','#e8e6dc','#f5f0e2','#fffaf0'][b],{side:T.DoubleSide}),80);inst.castShadow=true;inst.receiveShadow=true;inst.instanceMatrix.setUsage(T.DynamicDrawUsage);scene.add(inst);batches.push(inst);
 for(let i=0;i<80;i++){let h=Math.random()*3.3,r=(3.4-h*.74)*Math.sqrt(Math.random()),a=Math.random()*Math.PI*2;let p={batch:b,index:i,x:Math.cos(a)*r,y:.43+h,z:Math.sin(a)*r*.78,rx:Math.random()*6,ry:Math.random()*6,rz:Math.random()*6,s:.68+Math.random()*.3,fly:i<5,vx:(Math.random()-.5)*7,vz:(Math.random()-.5)*6,vy:3+Math.random()*4};papers.push(p);dummy.position.set(p.x,p.y,p.z);dummy.rotation.set(p.rx,p.ry,p.rz);dummy.scale.setScalar(p.s);dummy.updateMatrix();inst.setMatrixAt(i,dummy.matrix)}inst.computeBoundingSphere();inst.frustumCulled=false}
 // Loose sheets around the foot of the mound.
 for(let i=0;i<24;i++){let a=Math.random()*Math.PI*2,r=3.6+Math.random()*1.1,p=mesh(crumpled(i+39),cream,Math.cos(a)*r,.19,Math.sin(a)*r*.73);p.scale.set(.44,.24,.44);p.rotation.y=a;}
 const hit=new T.Mesh(new T.ConeGeometry(3.9,4.8,20),new T.MeshBasicMaterial({visible:false}));hit.position.y=1.9;scene.add(hit);
 let impact=-1;function hitPile(){impact=0}
 function updatePile(dt){if(impact<0)return;impact+=dt;let t=impact,back=1-ease((t-1.05)/1.05);
 for(const p of papers){const lift=p.fly?Math.max(0,p.vy*t-4*t*t)*back:Math.sin(t*18+p.index)*Math.exp(-t*3)*.16;dummy.position.set(p.x+(p.fly?p.vx*t*back:Math.sin(t*20+p.index)*.075*Math.exp(-t*3)),p.y+lift,p.z+(p.fly?p.vz*t*back:0));dummy.rotation.set(p.rx+(p.fly?t*3*back:0),p.ry,p.rz+(p.fly?t*2*back:0));dummy.scale.setScalar(p.s);dummy.updateMatrix();batches[p.batch].setMatrixAt(p.index,dummy.matrix)}batches.forEach(b=>b.instanceMatrix.needsUpdate=true);if(t>2.15)impact=-1;}
 const ray=new T.Raycaster(),mouse=new T.Vector2();function isPile(e){let rect=canvas.getBoundingClientRect();mouse.set((e.clientX-rect.left)/rect.width*2-1,-(e.clientY-rect.top)/rect.height*2+1);ray.setFromCamera(mouse,camera);return ray.intersectObject(hit).length>0}
 function resize(){const w=innerWidth,h=innerHeight;renderer.setSize(w,h,false);camera.aspect=w/h;camera.updateProjectionMatrix();const distance=Math.max(22.5,17.5/camera.aspect);basePosition.set(0,distance*.48,distance);camera.position.copy(basePosition);camera.lookAt(target)}
 resize();window.addEventListener('resize',resize);
 function update(dt,time,shake=0,party=0){updatePile(dt);camera.position.copy(basePosition);const zoom=1+party*(Math.max(1.32,26/camera.aspect/basePosition.z*1.32)-1);camera.position.y*=zoom;camera.position.z*=zoom;if(shake){camera.position.x+=(Math.random()-.5)*shake;camera.position.y+=(Math.random()-.5)*shake}camera.lookAt(target);clouds.forEach((c,i)=>c.position.x+=Math.sin(time*.15+i)*dt*.045);renderer.render(scene,camera)}
 return{scene,camera,renderer,hitPile,isPile,update,mat,mesh};
}
