'use strict';

const BUILD_CATALOG = {
  table: {name:'Mesa de apoio',price:20,w:2,d:1},
  shelf: {name:'Estante auxiliar',price:25,w:2,d:1},
  wall: {name:'Divisória',price:10,w:2,d:.25},
  door: {name:'Portal aberto',price:15,w:2,d:.25},
  plant: {name:'Vaso com planta',price:8,w:1,d:1},
  flowers: {name:'Floreira',price:12,w:2,d:1}
};
if(!Array.isArray(state.layout))state.layout=[];
state.layout=state.layout.filter(p=>p&&BUILD_CATALOG[p.type]&&Number.isFinite(p.x)&&Number.isFinite(p.z)&&Math.abs(p.x)<9&&Math.abs(p.z)<7).map(p=>({...p,rotation:p.rotation===1?1:0}));
const build={active:false,type:'plant',x:4,z:2,rotation:0,moving:-1};
const placedMeshes=[];
const raycaster=new THREE.Raycaster();
const buildPlane=new THREE.Plane(new THREE.Vector3(0,1,0),-.16);
const buildGrid=new THREE.GridHelper(18,18,'#ffb24e','#316f76');
buildGrid.position.y=.17;buildGrid.visible=false;scene.add(buildGrid);
const ghostMaterial=new THREE.MeshBasicMaterial({color:'#64e6a2',transparent:true,opacity:.45,depthWrite:false});
const ghost=new THREE.Mesh(cube,ghostMaterial);ghost.visible=false;scene.add(ghost);

function footprint(piece){const c=BUILD_CATALOG[piece.type];return{x:piece.x,z:piece.z,w:piece.rotation?c.d:c.w,d:piece.rotation?c.w:c.d}}
function overlaps(a,b,gap=0){return Math.abs(a.x-b.x)<(a.w+b.w)/2+gap&&Math.abs(a.z-b.z)<(a.d+b.d)/2+gap}
function constructionError(piece,ignore=-1){
  const a=footprint(piece);
  if(Math.abs(a.x)+a.w/2>8.4||Math.abs(a.z)+a.d/2>6.4)return'Fora da área da oficina.';
  if(Object.values(stations).some(s=>overlaps(a,s,.8)))return'Deixe espaço para acessar esta estação.';
  if(state.layout.some((p,i)=>i!==ignore&&overlaps(a,footprint(p),.12)))return'Já existe uma peça neste espaço.';
  if(overlaps(a,{x:player.x,z:player.z,w:.7,d:.7},.2))return'O personagem está neste espaço.';
  if(overlaps(a,{x:0,z:.5,w:16.8,d:1})||overlaps(a,{x:2.5,z:0,w:1,d:12.8}))return'Corredor reservado para circulação.';
  return'';
}
function previewPiece(){return{type:build.type,x:build.x,z:build.z,rotation:build.rotation}}
function newFurniture(piece){
  const g=new THREE.Group(),c=BUILD_CATALOG[piece.type];g.position.set(piece.x,.16,piece.z);g.rotation.y=piece.rotation*Math.PI/2;
  if(piece.type==='table'){
    box(2,.15,1,'#d4a66b',0,.9,0,g);
    for(const x of [-.82,.82])for(const z of [-.32,.32])box(.12,.9,.12,'#445e66',x,0,z,g);
  }else if(piece.type==='shelf'){
    for(const x of [-.9,.9])box(.1,2.3,.9,'#3c606d',x,0,0,g);
    for(const y of [.1,.85,1.6])box(2,.1,1,'#d5ae78',0,y,0,g);
  }else if(piece.type==='wall'){
    box(2,2.2,.25,'#c9d8d3',0,0,0,g);box(2,.12,.28,'#397e8a',0,2.2,0,g);
  }else if(piece.type==='door'){
    box(.2,2.4,.25,'#397e8a',-.9,0,0,g);box(.2,2.4,.25,'#397e8a',.9,0,0,g);box(2,.2,.25,'#ed9e4f',0,2.4,0,g);
  }else if(piece.type==='plant'){
    cylinder(.3,.23,.5,'#c2714d',0,0,0,g);cylinder(.04,.06,.8,'#538b4e',0,.45,0,g);
    for(const [x,y,z] of [[-.18,1,0],[.18,1.2,0],[0,1.4,.08]]){const leaf=new THREE.Mesh(new THREE.SphereGeometry(.3,8,6),mat('#54ad69'));leaf.scale.set(.75,1.3,.6);leaf.position.set(x,y,z);g.add(leaf)}
  }else if(piece.type==='flowers'){
    box(2,.4,1,'#b97950',0,0,0,g);box(1.8,.05,.8,'#574734',0,.4,0,g);
    for(let i=0;i<5;i++){const x=-.7+i*.35;cylinder(.025,.025,.4,'#498654',x,.45,0,g);const flower=new THREE.Mesh(new THREE.SphereGeometry(.14,8,6),mat(['#ed7899','#ffd16a','#b899e8'][i%3]));flower.position.set(x,.88,0);g.add(flower)}
  }
  scene.add(g);return g;
}
function furnitureObstacles(piece){
  if(piece.type!=='door')return[footprint(piece)];
  return[-.9,.9].map(offset=>({x:piece.x+(piece.rotation?0:offset),z:piece.z+(piece.rotation?-offset:0),w:piece.rotation?.25:.2,d:piece.rotation?.2:.25}));
}
const originalObstacleCount=obstacles.length;
function syncFurniture(){
  for(const g of placedMeshes){scene.remove(g);g.traverse(o=>{if(o.geometry&&o.geometry!==cube)o.geometry.dispose()})}
  placedMeshes.length=0;obstacles.splice(originalObstacleCount);
  for(const piece of state.layout){placedMeshes.push(newFurniture(piece));obstacles.push(...furnitureObstacles(piece))}
}
function updateBuildPanel(){
  const c=BUILD_CATALOG[build.type],error=constructionError(previewPiece(),build.moving);
  ghost.visible=build.active;ghost.scale.set(build.rotation?c.d:c.w,.16,build.rotation?c.w:c.d);ghost.position.set(build.x,.28,build.z);ghostMaterial.color.set(error?'#ff6666':'#64e6a2');
  $('build-status').textContent=`${c.name} · X ${build.x}, Z ${build.z} · ${error||'Espaço disponível'}`;
  $('build-place').disabled=!!error||(build.moving<0&&state.money-c.price<20);
  $('build-place').textContent=build.moving>=0?'Confirmar nova posição':state.money-c.price<20?'Reserve R$ 20 para papelão':`Colocar · ${money(c.price)}`;
  document.querySelectorAll('[data-build-type]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.buildType===build.type)));
  $('build-installed').innerHTML=state.layout.length?state.layout.map((p,i)=>`<div class="installed-piece"><span>${BUILD_CATALOG[p.type].name} (${p.x}, ${p.z})</span><button data-move-piece="${i}">Mover</button><button data-remove-piece="${i}">Remover</button></div>`).join(''):'<p>Sua primeira peça pode ser uma planta ou uma mesa de apoio.</p>';
}
function toggleBuild(force){
  if(!$('intro').classList.contains('hidden'))return;
  build.active=typeof force==='boolean'?force:!build.active;buildGrid.visible=build.active;ghost.visible=build.active;
  document.body.classList.toggle('building',build.active);$('build-panel').classList.toggle('hidden',!build.active);
  running=!build.active;interactPressed=false;Object.keys(keys).forEach(k=>keys[k]=false);
  if(!build.active){build.moving=-1;save()}else updateBuildPanel();
}
function placeFurniture(){
  const piece=previewPiece(),c=BUILD_CATALOG[piece.type],error=constructionError(piece,build.moving);
  if(error){notify(error);return false}
  if(build.moving>=0){state.layout[build.moving]=piece;build.moving=-1;notify('Peça reposicionada')}
  else{if(state.money-c.price<20){notify('Reserve R$ 20 para comprar papelão');return false}state.money-=c.price;state.layout.push(piece);notify(c.name+' instalada')}
  syncFurniture();save();updateBuildPanel();return true;
}
function removeFurniture(index){
  if(!Number.isInteger(index)||!state.layout[index])return false;
  const p=state.layout[index],refund=Math.floor(BUILD_CATALOG[p.type].price*.7);state.layout.splice(index,1);state.money+=refund;build.moving=-1;
  syncFurniture();save();updateBuildPanel();notify(`Peça removida · devolução ${money(refund)}`);return true;
}
$('build-catalog').innerHTML=Object.entries(BUILD_CATALOG).map(([type,c])=>`<button data-build-type="${type}" aria-pressed="false">${c.name}<small>${money(c.price)}</small></button>`).join('');
$('build-toggle').onclick=()=>toggleBuild();$('build-close').onclick=()=>toggleBuild(false);
$('build-rotate').onclick=()=>{build.rotation=1-build.rotation;updateBuildPanel()};$('build-place').onclick=placeFurniture;
document.querySelectorAll('[data-build-step]').forEach(b=>b.onclick=()=>{const d=b.dataset.buildStep;build.x=Math.max(-8,Math.min(8,build.x+(d==='right'?1:d==='left'?-1:0)));build.z=Math.max(-6,Math.min(6,build.z+(d==='down'?1:d==='up'?-1:0)));updateBuildPanel()});
$('build-catalog').addEventListener('click',e=>{const b=e.target.closest('[data-build-type]');if(b){build.type=b.dataset.buildType;build.moving=-1;updateBuildPanel()}});
$('build-installed').addEventListener('click',e=>{const move=e.target.closest('[data-move-piece]'),remove=e.target.closest('[data-remove-piece]');if(move){const i=Number(move.dataset.movePiece),p=state.layout[i];Object.assign(build,p,{moving:i});updateBuildPanel()}else if(remove)removeFurniture(Number(remove.dataset.removePiece))});
renderer.domElement.addEventListener('pointerdown',e=>{
  if(!build.active)return;
  const rect=renderer.domElement.getBoundingClientRect(),mouse=new THREE.Vector2((e.clientX-rect.left)/rect.width*2-1,-(e.clientY-rect.top)/rect.height*2+1);
  raycaster.setFromCamera(mouse,camera);const point=new THREE.Vector3();if(raycaster.ray.intersectPlane(buildPlane,point)){build.x=Math.round(point.x);build.z=Math.round(point.z);updateBuildPanel()}
});
addEventListener('keydown',e=>{if(e.code==='KeyB'&&!e.repeat){e.preventDefault();toggleBuild()}if(build.active&&e.code==='Escape')toggleBuild(false)});
syncFurniture();

