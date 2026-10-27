'use strict';

const $ = id => document.getElementById(id);
const SAVE_KEY = 'imperio-industrial-2-v02';
const state = Object.assign({ money: 100, cardboard: 0, carrying: '', quantity: 0, tableInput: 0, tableOutput: 0, stock: 0, sold: 0, made: 0, progress: 0, x: -3, z: 2 }, load());
const keys = {};
let interactPressed = false, running = false, last = performance.now(), toastTimer = 0;

function load(){ try{return JSON.parse(localStorage.getItem(SAVE_KEY)||'{}')}catch(e){return{}} }
function save(){ try{localStorage.setItem(SAVE_KEY,JSON.stringify(state))}catch(e){} }
function money(v){return v.toLocaleString('pt-BR',{style:'currency',currency:'BRL'})}

const renderer = new THREE.WebGLRenderer({antialias:true});
renderer.setPixelRatio(Math.min(devicePixelRatio||1,1.5));
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
$('game').appendChild(renderer.domElement);
const scene = new THREE.Scene();
scene.background = new THREE.Color('#9ad5dd');
scene.fog = new THREE.Fog('#9ad5dd',38,78);
const camera = new THREE.PerspectiveCamera(45,1,.1,160);
let cameraAngle = Math.PI*.22, cameraDistance = 34;

scene.add(new THREE.HemisphereLight('#e9fbff','#41636a',1.05));
const sun = new THREE.DirectionalLight('#fff1cf',1.15); sun.position.set(-18,30,16); sun.castShadow=true; sun.shadow.mapSize.set(2048,2048); Object.assign(sun.shadow.camera,{left:-35,right:35,top:35,bottom:-35}); scene.add(sun);

const cube = new THREE.BoxGeometry(1,1,1), materials={};
function mat(color,rough=.75,metal=.04){const k=color+rough+metal;return materials[k]||(materials[k]=new THREE.MeshStandardMaterial({color,roughness:rough,metalness:metal}))}
function box(w,h,d,color,x,y,z,parent=scene){const m=new THREE.Mesh(cube,mat(color));m.scale.set(w,h,d);m.position.set(x,y+h/2,z);m.castShadow=m.receiveShadow=true;parent.add(m);return m}
function cylinder(rt,rb,h,color,x,y,z,parent=scene,segments=12){const m=new THREE.Mesh(new THREE.CylinderGeometry(rt,rb,h,segments),mat(color));m.position.set(x,y+h/2,z);m.castShadow=m.receiveShadow=true;parent.add(m);return m}

// Distrito Aurora: rua, calçadas, lotes, prédios e a oficina inicial.
const ground=new THREE.Mesh(new THREE.PlaneGeometry(70,56),mat('#6f9a72'));ground.rotation.x=-Math.PI/2;ground.receiveShadow=true;scene.add(ground);
box(70,.08,12,'#3d4850',0,-.05,17);
box(70,.1,2.4,'#b8b4a6',0,0,10.1); box(70,.1,2.4,'#b8b4a6',0,0,23.9);
for(let x=-32;x<34;x+=5)box(2.6,.02,.18,'#f2d061',x,.04,17);
for(let x=-31;x<34;x+=8){box(3.5,.02,.12,'#f7f7ec',x,.04,14);box(3.5,.02,.12,'#f7f7ec',x,.04,20)}

function building(x,z,w,d,h,color,sign){
  const g=new THREE.Group();g.position.set(x,0,z);scene.add(g);box(w,h,d,color,0,0,0,g);box(w*.72,.18,.2,'#172b33',0,h*.62,d/2+.03,g);
  for(let wx=-w*.3;wx<=w*.3;wx+=w*.3)box(w*.16,1.2,.08,'#87cfdd',wx,h*.55,d/2+.12,g);
  if(sign)label(x,h+1,z,sign);
}
building(-22,-8,12,11,7,'#46636d','METALÚRGICA AURORA');building(22,-8,13,12,8,'#725d58','GRÁFICA CENTRAL');building(-22,3,10,8,5,'#4e7280','FORNECEDOR DISTRITAL');building(22,3,11,8,5,'#7c674a','LOJA BOM PRESENTE');

// Oficina aberta e claramente diferente do galpão do primeiro jogo.
box(18,.15,14,'#b9b1a2',0,0,0);box(18,4,.35,'#e7e0cf',0,0,-7);box(.35,4,14,'#d8d0bf',-9,0,0);box(.35,4,5,'#d8d0bf',9,0,-4.5);box(.35,4,4,'#d8d0bf',9,0,5);
box(7,.12,.3,'#ef8f36',0,.02,6.8);box(18,.22,.4,'#263b42',0,4,-7);
for(const x of [-5,0,5])box(3.4,1.4,.08,'#87cfdd',x,2,-6.79);
label(0,5.1,-6.8,'OFICINA AURORA · LOTE 01');

// Estações do primeiro ciclo jogável.
const stations={
  supplier:{x:-6.8,z:-4.7,w:2.8,d:1.5,name:'FORNECEDOR',action:'Comprar 10 papelões · R$ 20'},
  pallet:{x:-6.7,z:-1.2,w:2.5,d:2,name:'PALETE',action:'Pegar papelão'},
  table:{x:-1,z:-3.9,w:4.2,d:1.5,name:'BANCADA',action:'Produzir caixa'},
  stock:{x:5.7,z:-4.2,w:3.2,d:1.4,name:'ESTOQUE',action:'Guardar caixas'},
  client:{x:6.8,z:3.9,w:2.5,d:2,name:'CLIENTE',action:'Entregar caixas'}
};
box(2.8,1,1.5,'#e18b3c',-6.8,0,-4.7);box(.8,.65,.08,'#1d343b',-7.3,1,-4);box(.65,.45,.05,'#44c8d3',-7.3,1.08,-3.94);
box(2.5,.28,2,'#765a3f',-6.7,0,-1.2);for(let i=0;i<7;i++)box(2.2,.06,1.7,i%2?'#c79a55':'#b88949',-6.7,.28+i*.07,-1.2);
box(4.2,.18,1.5,'#d19b58',-1,1,-3.9);for(const dx of [-1.85,1.85])for(const dz of [-.6,.6])box(.15,1,.15,'#684a35',-1+dx,0,-3.9+dz);
box(3.2,3.1,1.4,'#596a6e',5.7,0,-4.2);for(let y=.4;y<3;y+=1)box(3.1,.1,1.45,'#9fb0b2',5.7,y,-4.2);
box(2.5,.35,2,'#ef8f36',6.8,0,3.9);box(1.5,1.6,.12,'#184853',6.8,.35,3.05);box(1.25,1.3,.05,'#54c9c0',6.8,.48,2.98);
for(const s of Object.values(stations))label(s.x,2.4,s.z,s.name,s===stations.client?'client':'');

// Decoração do novo cenário.
function tree(x,z,s=1){cylinder(.18,.23,1.8*s,'#6c4a32',x,0,z);for(const [dx,dy,dz,c] of [[0,2,0,'#3c8b5a'],[-.5,1.7,.1,'#52a968'],[.5,1.8,-.1,'#67b96e']]){const m=new THREE.Mesh(new THREE.SphereGeometry(.75*s,10,8),mat(c));m.position.set(x+dx*s,dy*s,z+dz*s);m.castShadow=true;scene.add(m)}}
for(const [x,z] of [[-14,8],[-6,8],[4,8],[14,8],[-15,-14],[14,-14]])tree(x,z,.85);
box(2,.7,.65,'#49636a',-2,0,4.5);box(2,.12,1.5,'#9d7045',-2,.7,4.5);cylinder(.28,.35,.45,'#b65e3c',-1.7,.82,4.5);cylinder(.05,.06,.55,'#4f8f55',-1.7,1.25,4.5);
const bike=new THREE.Group();bike.position.set(-6,0,5);scene.add(bike);for(const x of [-.65,.65]){const w=new THREE.Mesh(new THREE.TorusGeometry(.42,.07,8,16),mat('#22292c'));w.rotation.y=Math.PI/2;w.position.set(x,.48,0);bike.add(w)}box(1.3,.08,.08,'#ef8f36',0,.72,0,bike);box(.08,.7,.08,'#ef8f36',-.25,.4,0,bike);box(.6,.5,.55,'#b88949',.95,.35,0,bike);

function label(x,y,z,text,kind=''){const el=document.createElement('div');el.className='world-label '+kind;el.textContent=text;$('labels').appendChild(el);return{el,pos:new THREE.Vector3(x,y,z)}}
const labels=[];document.querySelectorAll('.world-label').forEach(el=>{});
// As chamadas anteriores ocorreram antes da lista; recolhemos posições por uma função substituta abaixo.

// Jogador.
const player={x:state.x,z:state.z,dir:0,group:new THREE.Group(),legs:[]};scene.add(player.group);
box(.65,.75,.42,'#247d92',0,.65,0,player.group);box(.48,.46,.45,'#e5ad82',0,1.4,0,player.group);box(.55,.14,.5,'#ef8f36',0,1.82,0,player.group);
for(const x of [-.2,.2]){const leg=box(.18,.6,.22,'#233b52',x,0,0,player.group);player.legs.push(leg)}
box(.17,.65,.18,'#e5ad82',-.44,.72,0,player.group);box(.17,.65,.18,'#e5ad82',.44,.72,0,player.group);

// Recria o sistema de rótulos a partir do DOM e das estações/prédios relevantes.
const worldLabels=[];
function addTrackedLabel(x,y,z,text,kind=''){const el=document.createElement('div');el.className='world-label '+kind;el.textContent=text;$('labels').appendChild(el);worldLabels.push({el,pos:new THREE.Vector3(x,y,z)})}
$('labels').innerHTML='';
addTrackedLabel(0,5.1,-6.8,'OFICINA AURORA · LOTE 01');
for(const s of Object.values(stations))addTrackedLabel(s.x,2.4,s.z,s.name,s===stations.client?'client':'');
addTrackedLabel(-22,8,-8,'METALÚRGICA AURORA');addTrackedLabel(22,9,-8,'GRÁFICA CENTRAL');addTrackedLabel(-22,6,3,'FORNECEDOR DISTRITAL');addTrackedLabel(22,6,3,'LOJA BOM PRESENTE');

function updateCamera(){camera.position.set(Math.sin(cameraAngle)*cameraDistance,24,Math.cos(cameraAngle)*cameraDistance);camera.lookAt(0,0,0)}
function resize(){renderer.setSize(innerWidth,innerHeight);camera.aspect=innerWidth/innerHeight;camera.updateProjectionMatrix()}addEventListener('resize',resize);resize();updateCamera();

function areaDistance(s){const dx=Math.max(Math.abs(player.x-s.x)-s.w/2,0),dz=Math.max(Math.abs(player.z-s.z)-s.d/2,0);return Math.hypot(dx,dz)}
function nearby(){let best=null,dist=1.1;for(const s of Object.values(stations)){const d=areaDistance(s);if(d<dist){best=s;dist=d}}return best}
function capacity(){return 5}
function notify(text){$('toast').textContent=text;$('toast').classList.remove('hidden');clearTimeout(toastTimer);toastTimer=setTimeout(()=>$('toast').classList.add('hidden'),2200)}

function actionText(s){
  if(s===stations.supplier)return state.money>=20?'E: comprar 10 papelões por R$ 20':'Dinheiro insuficiente';
  if(s===stations.pallet){if(state.carrying==='box')return'Mãos ocupadas com caixas';if(state.cardboard<=0)return'Palete vazio';return`E: pegar papelão (${state.cardboard})`}
  if(s===stations.table){if(state.carrying==='cardboard')return'E: colocar papelão na bancada';if(state.tableInput>0)return'Segure E para montar a caixa';if(state.tableOutput>0)return`E: pegar caixas prontas (${state.tableOutput})`;return'Traga papelão para a bancada'}
  if(s===stations.stock){if(state.carrying==='box')return'E: guardar caixas no estoque';return`Estoque: ${state.stock} caixas`}
  if(s===stations.client){if(state.carrying==='box')return`E: entregar ${state.quantity} caixa(s)`;if(state.stock>0)return`E: despachar estoque (${state.stock})`;return'O cliente espera por caixas'}
  return'';
}
function doAction(s,dt){
  if(s===stations.supplier&&interactPressed){if(state.money>=20){state.money-=20;state.cardboard+=10;notify('+10 papelões')}else notify('Dinheiro insuficiente')}
  else if(s===stations.pallet&&interactPressed&&state.carrying!=='box'){const q=Math.min(capacity()-state.quantity,state.cardboard);if(q>0){state.cardboard-=q;state.carrying='cardboard';state.quantity+=q;notify(`Pegou ${q} papelões`)}}
  else if(s===stations.table){
    if(interactPressed&&state.carrying==='cardboard'){state.tableInput+=state.quantity;state.quantity=0;state.carrying='';notify('Bancada abastecida')}
    else if(keys.KeyE&&state.carrying===''&&state.tableInput>0){state.progress+=dt*.65;if(state.progress>=1){state.progress=0;state.tableInput--;state.tableOutput++;state.made++;notify('Caixa pronta!')}}
    else if(interactPressed&&state.carrying===''&&state.tableOutput>0){const q=Math.min(capacity(),state.tableOutput);state.tableOutput-=q;state.carrying='box';state.quantity=q;notify(`Pegou ${q} caixa(s)`)}
  }
  else if(s===stations.stock&&interactPressed&&state.carrying==='box'){state.stock+=state.quantity;notify(`${state.quantity} caixa(s) no estoque`);state.quantity=0;state.carrying=''}
  else if(s===stations.client&&interactPressed){let q=0;if(state.carrying==='box'){q=state.quantity;state.quantity=0;state.carrying=''}else if(state.stock>0){q=state.stock;state.stock=0}if(q){state.money+=q*8;state.sold+=q;notify(`Venda concluída: +${money(q*8)}`)}}
  interactPressed=false;
}

const obstacles=Object.values(stations).filter(s=>s!==stations.client);
function collide(nx,nz){const r=.34;if(nx<-8.55||nx>8.55||nz<-6.55||nz>6.55)return true;for(const o of obstacles){const cx=Math.max(o.x-o.w/2,Math.min(nx,o.x+o.w/2)),cz=Math.max(o.z-o.d/2,Math.min(nz,o.z+o.d/2));if(Math.hypot(nx-cx,nz-cz)<r)return true}return false}
function updatePlayer(dt,t){let h=(keys.KeyD||keys.ArrowRight?1:0)-(keys.KeyA||keys.ArrowLeft?1:0),v=(keys.KeyW||keys.ArrowUp?1:0)-(keys.KeyS||keys.ArrowDown?1:0);if(!h&&!v){player.legs.forEach(l=>l.rotation.x=0);return}const len=Math.hypot(h,v);h/=len;v/=len;const forward={x:-Math.sin(cameraAngle),z:-Math.cos(cameraAngle)},right={x:forward.z,z:-forward.x};const mx=right.x*h+forward.x*v,mz=right.z*h+forward.z*v;const nx=player.x+mx*4*dt,nz=player.z+mz*4*dt;if(!collide(nx,player.z))player.x=nx;if(!collide(player.x,nz))player.z=nz;player.dir=Math.atan2(mx,mz);player.legs[0].rotation.x=Math.sin(t*10)*.55;player.legs[1].rotation.x=-Math.sin(t*10)*.55}

function mission(){if(state.cardboard===0&&state.tableInput===0&&state.made===0)return'Compre papelão no fornecedor';if(state.made===0)return'Leve papelão à bancada e segure E';if(state.stock===0&&state.sold===0)return'Leve as caixas prontas ao estoque';if(state.sold===0)return'Entregue caixas ao cliente';if(state.sold<10)return`Venda 10 caixas · ${state.sold}/10`;return'Oficina funcionando! Próxima meta: comprar o terreno'}
function updateUI(){
  $('money').textContent=money(state.money);$('cardboard').textContent=`Papelão ${state.cardboard}`;$('stock').textContent=`Estoque ${state.stock}`;$('sold').textContent=`Vendas ${state.sold}`;$('carrying').textContent=state.quantity?`Carregando ${state.quantity} ${state.carrying==='box'?'caixa(s)':'papelão'}`:'Mãos livres';$('mission').textContent=mission();
  const s=nearby();$('hint').classList.toggle('hidden',!s);if(s)$('hint').textContent=actionText(s);
}
function updateLabels(){for(const l of worldLabels){const p=l.pos.clone().project(camera);l.el.style.left=((p.x+1)*.5*innerWidth)+'px';l.el.style.top=((1-p.y)*.5*innerHeight)+'px';l.el.style.display=p.z<1?'':'none'}}

function frame(now){const dt=Math.min(.05,(now-last)/1000);last=now;const t=now/1000;if(running){updatePlayer(dt,t);const s=nearby();if(s)doAction(s,dt);else interactPressed=false;state.x=player.x;state.z=player.z;if(Math.floor(t*2)%10===0)save()}player.group.position.set(player.x,0,player.z);player.group.rotation.y=player.dir;updateCamera();updateUI();updateLabels();renderer.render(scene,camera);requestAnimationFrame(frame)}requestAnimationFrame(frame);

addEventListener('keydown',e=>{if(['KeyW','KeyA','KeyS','KeyD','KeyE','ArrowUp','ArrowDown','ArrowLeft','ArrowRight'].includes(e.code))e.preventDefault();if(e.code==='KeyE'&&!keys.KeyE)interactPressed=true;keys[e.code]=true});addEventListener('keyup',e=>keys[e.code]=false);addEventListener('blur',()=>Object.keys(keys).forEach(k=>keys[k]=false));addEventListener('beforeunload',save);
$('start').onclick=()=>{$('intro').classList.add('hidden');running=true;last=performance.now()};
document.querySelectorAll('[data-camera]').forEach(b=>b.onclick=()=>{const a=b.dataset.camera;if(a==='left')cameraAngle-=Math.PI/8;if(a==='right')cameraAngle+=Math.PI/8;if(a==='in')cameraDistance=Math.max(22,cameraDistance-4);if(a==='out')cameraDistance=Math.min(48,cameraDistance+4)});
document.querySelectorAll('[data-key]').forEach(b=>{const k=b.dataset.key;const down=e=>{e.preventDefault();if(k==='KeyE'&&!keys[k])interactPressed=true;keys[k]=true};const up=e=>{e.preventDefault();keys[k]=false};b.addEventListener('pointerdown',down);b.addEventListener('pointerup',up);b.addEventListener('pointercancel',up);b.addEventListener('pointerleave',up)});

