const fs = require('fs');
const vm = require('vm');
const assert = require('assert');
const THREE = require('./js/three.min.js');
// Run real scene construction and game rules; only the GPU and DOM are stubbed.
THREE.WebGLRenderer = class { constructor(){this.shadowMap={};this.domElement={}} setPixelRatio(){} setSize(){} render(){} };
const elements = new Map();
function element(){return {textContent:'',innerHTML:'',style:{},classList:{add(){},remove(){},toggle(){}},appendChild(){},addEventListener(){}}}
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

