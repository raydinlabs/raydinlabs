import {readFile,writeFile,mkdir,cp,rm,access} from 'node:fs/promises';
import {spawnSync} from 'node:child_process';
import {homedir} from 'node:os';
import {pages,document} from '../src/pages.mjs';
const site=JSON.parse(await readFile('src/site.json','utf8'));
if(site.email && !/^[^\s@<>"&]+@[^\s@<>"&]+\.[^\s@<>"&]+$/.test(site.email))throw Error('Invalid public email');
const rust=process.env.RUSTC || `${homedir()}/.cargo/bin/rustc`;
await mkdir('.tmp',{recursive:true});
const compile=spawnSync(rust,['-O','rust/galaxy.rs','-o','.tmp/galaxy'],{encoding:'utf8'});
if(compile.status===0){const gen=spawnSync('.tmp/galaxy',['assets/galaxy.bin'],{encoding:'utf8'});if(gen.status!==0)throw Error(gen.stderr);console.log('Generated galaxy with Rust.');}
else {await access('assets/galaxy.bin').catch(()=>{throw Error('Install Rust to generate assets/galaxy.bin for the first build.');});console.log('Using committed Rust-generated galaxy data.');}
for(const [key,page] of Object.entries(pages(site)))await writeFile(`${key}.html`,document(page,key,site));
await writeFile('assets/site.json',JSON.stringify(site,null,2)+'\n');
await rm('dist',{recursive:true,force:true});await mkdir('dist');
for(const file of [...Object.keys(pages(site)).map(k=>`${k}.html`),'assets','logo.png','hh-45.jpg','favicon.ico']) await cp(file,`dist/${file}`,{recursive:true});
await writeFile('dist/.nojekyll','');
try{await cp('CNAME','dist/CNAME');}catch(e){if(e.code!=='ENOENT')throw e;}
console.log('Built 8 pages into dist/. Existing root URLs are preserved.');
