import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile,readdir,stat} from 'node:fs/promises';
import {resolve,relative,join} from 'node:path';

test('Cloudflare uploads only built public assets within its size limit',async()=>{
 const config=JSON.parse(await readFile('wrangler.jsonc','utf8'));
 assert.equal(config.name,'raydinlabs');
 const root=resolve(config.assets.directory);
 assert.equal(relative(process.cwd(),root),'dist');
 async function walk(dir){for(const entry of await readdir(dir,{withFileTypes:true})){
   const file=join(dir,entry.name);
   assert.ok(!['node_modules','src','scripts','rust','.git','.tmp'].includes(entry.name),`Nonpublic build entry: ${file}`);
   if(entry.isDirectory())await walk(file);else assert.ok((await stat(file)).size<=25*1024*1024,`Oversized asset: ${file}`);
 }}
 await walk(root);
 assert.match(await readFile(join(root,'index.html'),'utf8'),/Building technology/);
});
