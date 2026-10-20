// Deterministic, artistic M31 model: inclined stellar disk, central bulge,
// spiral/ring structure, dust-lane attenuation, halo and satellite companions.
// It is a visual interpretation, not an astronomical catalogue.
import {writeFile} from 'node:fs/promises';
let seed=42042;const random=()=>((seed=(Math.imul(seed,1664525)+1013904223)>>>0)>>>8)/16777216;
const normal=()=>Math.sqrt(-2*Math.log(Math.max(random(),1e-8)))*Math.cos(2*Math.PI*random());
const count=82000,values=new Float32Array(count*7);
for(let i=0;i<count;i++){
 let x,y,z,r,warm,size=.7+random()**5*1.8,brightness=1;
 const group=random();
 if(group<.22){r=random()**1.7*1.7;const theta=random()*Math.PI*2,phi=Math.acos(2*random()-1);x=r*Math.sin(phi)*Math.cos(theta);z=r*Math.sin(phi)*Math.sin(theta);y=r*Math.cos(phi)*.55;warm=.95;size*=1.15;}
 else if(group<.94){r=Math.sqrt(random())*5.5;const arm=random()<.5?0:Math.PI;const angle=arm+r*1.35+normal()*.25;const ring=random()<.3;if(ring)r=3.6+normal()*.24;const a=ring?random()*Math.PI*2:angle;x=r*Math.cos(a);z=r*Math.sin(a);y=normal()*(.035+.018*r);warm=Math.exp(-r*.65);brightness=(Math.sin(a-r*1.35+.25)>0.65)?.22:1;}
 else if(group<.985){r=2+random()*4;const a=random()*Math.PI*2;x=r*Math.cos(a);z=r*Math.sin(a);y=normal()*.7;warm=.5;brightness=.32;}
 else{const side=random()<.55?1:-1;r=random()**1.8*.4;const a=random()*Math.PI*2;x=side*4.2+r*Math.cos(a);z=side*2+r*Math.sin(a);y=.45+normal()*.12;warm=.85;}
 values.set([x,y,z,(.47+warm*.48)*brightness,(.64+warm*.21)*brightness,(.87-warm*.2)*brightness,size],i*7);
}
await writeFile('assets/galaxy.bin',Buffer.from(values.buffer));
console.log(`Generated ${count.toLocaleString()} Andromeda-inspired stars.`);
