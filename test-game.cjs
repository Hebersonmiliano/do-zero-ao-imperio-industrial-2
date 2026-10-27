const fs = require('fs');
const vm = require('vm');
const assert = require('assert');
const THREE = require('./js/three.min.js');
// Run real scene construction and game rules; only the GPU and DOM are stubbed.
THREE.WebGLRenderer = class { constructor(){this.shadowMap={};this.domElement={addEventListener(){}}} setPixelRatio(){} setSize(){} render(){} };
const elements = new Map();
function element(){return {textContent:'',innerHTML:'',style:{},classList:{add(){},remove(){},toggle(){},contains(){return true}},appendChild(){},addEventListener(){},setAttribute(){}}}
const storage = new Map();
const context = vm.createContext({THREE,console,performance:{now:()=>0},devicePixelRatio:1,innerWidth:1280,innerHeight:720,document:{getElementById(id){if(!elements.has(id))elements.set(id,element());return elements.get(id)},createElement:element,querySelectorAll:()=>[]},localStorage:{getItem:k=>storage.get(k),setItem:(k,v)=>storage.set(k,v)},addEventListener(){},requestAnimationFrame(){},setTimeout:()=>1,clearTimeout(){}});
vm.runInContext(fs.readFileSync('js/game.js','utf8'),context);
vm.runInContext(`
function pressAt(s){interactPressed=true;doAction(s,0)}
pressAt(stations.supplier);
if(state.money!==80||state.cardboard!==10)throw Error('Compra incorreta');
pressAt(stations.pallet);
if(state.quantity!==5||state.cardboard!==5)throw Error('Coleta incorreta');
pressAt(stations.table);
keys.KeyE=true;
for(let i=0;i<200;i++)doAction(stations.table,.05);
keys.KeyE=false;
if(state.tableOutput!==5||state.tableInput!==0)throw Error('Produção incorreta');
pressAt(stations.table);
pressAt(stations.stock);
if(state.stock!==5||state.quantity!==0)throw Error('Estoque incorreto');
pressAt(stations.client);
if(state.money!==120||state.sold!==5||state.stock!==0)throw Error('Venda incorreta');
save();
if(load().sold!==5)throw Error('Salvamento incorreto');
player.x=0;player.z=2;keys.KeyD=true;const before=player.x;updatePlayer(.1,1);keys.KeyD=false;
if(player.x<=before)throw Error('Direção direita invertida');
if(!collide(stations.table.x,stations.table.z))throw Error('Colisão ausente');
for(const s of Object.values(stations)){player.x=s.x+s.w/2+.4;player.z=s.z;if(areaDistance(s)>1.1)throw Error('Lateral inacessível')}
`,context);
assert(storage.size===1);
console.log('PASS: cena, compra, coleta, produção de 5 caixas, estoque, venda (R$ 120), salvamento, direção, colisão e alcance lateral.');
vm.runInContext(fs.readFileSync('js/construction.js','utf8'),context);
vm.runInContext(`
state.money=100;player.x=-3;player.z=2;
if(constructionError(previewPiece()))throw Error('Posição inicial inválida');
if(!placeFurniture()||state.layout.length!==1||state.money!==92)throw Error('Compra de peça incorreta');
if(!collide(4,2))throw Error('Peça sem colisão');
if(!constructionError(previewPiece()))throw Error('Sobreposição permitida');
build.moving=0;build.x=4;build.z=3;
if(!placeFurniture()||state.money!==92||state.layout[0].z!==3)throw Error('Movimentação incorreta');
if(load().layout[0].z!==3)throw Error('Layout não salvo');
if(!removeFurniture(0)||state.money!==97||state.layout.length!==0)throw Error('Remoção/reembolso incorreto');
if(constructionError({type:'wall',x:0,z:.5,rotation:0})==='')throw Error('Corredor bloqueável');
if(constructionError({type:'shelf',x:9,z:5,rotation:0})==='')throw Error('Construção fora da oficina');
if(constructionError({type:'plant',x:stations.table.x,z:stations.table.z,rotation:0})==='')throw Error('Estação bloqueável');
build.type='plant';build.x=4;build.z=2;state.money=20;
if(placeFurniture())throw Error('Reserva de matéria-prima não protegida');
if(furnitureObstacles({type:'door',x:0,z:0,rotation:0}).some(o=>Math.abs(o.x)<.5))throw Error('Porta bloqueada no centro');
`,context);
console.log('PASS: construção, colisão, sobreposição, mover sem cobrança, persistência, remoção com 70%, corredores, limites, estações e reserva de R$ 20.');

