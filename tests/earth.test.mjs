import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import vm from 'node:vm';
async function renderer() {
 const source=await readFile(new URL('../assets/earth.js',import.meta.url),'utf8');
 const frames=new Map(),events=new Map(),mediaEvents=new Map();
 const state={draws:0,angle:0,options:null};
 let next=0,intersection;
 const gl=new Proxy({
  getShaderParameter:()=>true,getProgramParameter:()=>true,
  getUniformLocation:(_program,name)=>name,
  uniform1f:(name,value)=>{if(name==='angle')state.angle=value;},
  drawArrays:()=>state.draws++
 },{get:(obj,key)=>obj[key]??(()=>({}))});
 const canvas={width:0,height:0,dataset:{},getContext:(_type,options)=>{state.options=options;return gl;},
  getBoundingClientRect:()=>({width:1250,height:1250}),addEventListener:()=>{}};
 const reduced={matches:false,addEventListener:(name,fn)=>mediaEvents.set(name,fn),removeEventListener:()=>{}};
 const document={hidden:false,querySelectorAll:()=>[canvas],querySelector:()=>null,
  addEventListener:(name,fn)=>events.set(name,fn),removeEventListener:()=>{}};
 vm.runInNewContext(source,{
  document,matchMedia:()=>reduced,devicePixelRatio:3,console,
  Image:class {width=4;height=2;decode(){return Promise.resolve();}},
  ResizeObserver:class {observe(){}disconnect(){}},
  IntersectionObserver:class {constructor(fn){intersection=fn;}observe(){}disconnect(){}},
  requestAnimationFrame:fn=>{frames.set(++next,fn);return next;},
  cancelAnimationFrame:id=>frames.delete(id)
 });
 await new Promise(resolve=>setImmediate(resolve));
 return {state,canvas,frames,
  step(time){const pending=[...frames.values()];frames.clear();pending.forEach(fn=>fn(time));},
  visibility(value){document.hidden=value;events.get('visibilitychange')();},
  intersection(value){intersection([{isIntersecting:value}]);},
  reduce(value){reduced.matches=value;mediaEvents.get('change')();}
 };
}
test('planet speed stays consistent at 60 and 144 Hz while rendering is capped',async()=>{
 const angles=[];
 for(const hz of [60,144]){
  const r=await renderer();r.state.draws=0;
  for(let i=0;i<=hz;i++)r.step(i*1000/hz);
  r.visibility(true);angles.push(r.state.angle);
  assert.ok(r.state.draws<=62);
 }
 assert.ok(Math.abs(angles[0]-angles[1])<1e-9);
 assert.ok(Math.abs(angles[0]-(-.08+.012))<1e-9);
});
test('planet pauses offscreen, in hidden tabs and for reduced motion without a resume jump',async()=>{
 const r=await renderer();r.step(0);r.step(20);
 r.visibility(true);const angle=r.state.angle;assert.equal(r.frames.size,0);
 r.visibility(false);r.step(100000);assert.equal(r.state.angle,angle);
 r.intersection(false);assert.equal(r.frames.size,0);
 r.intersection(true);assert.equal(r.frames.size,1);
 r.reduce(true);assert.equal(r.frames.size,0);
 r.reduce(false);assert.equal(r.frames.size,1);
});
test('planet bounds render resolution and clamps long active-frame delays',async()=>{
 const r=await renderer();assert.equal(r.canvas.width,1800);assert.equal(r.canvas.height,1800);
 assert.equal(r.state.options.premultipliedAlpha,true);
 r.step(0);r.step(60000);
 assert.ok(Math.abs(r.state.angle-(-.08+.0012))<1e-9);
});
