import {readFile,writeFile,mkdir,cp,rm} from 'node:fs/promises';
import {pages,document} from '../src/pages.mjs';
const site=JSON.parse(await readFile('src/site.json','utf8'));
if(site.email && !/^[^\s@<>"&]+@[^\s@<>"&]+\.[^\s@<>"&]+$/.test(site.email))throw Error('Invalid public email');
for(const [key,page] of Object.entries(pages(site)))await writeFile(`${key}.html`,document(page,key,site));
await writeFile('assets/site.json',JSON.stringify(site,null,2)+'\n');
await rm('dist',{recursive:true,force:true});await mkdir('dist');
for(const file of [...Object.keys(pages(site)).map(k=>`${k}.html`),'assets','logo.png','favicon.ico']) await cp(file,`dist/${file}`,{recursive:true});
await writeFile('dist/.nojekyll','');
try{await cp('CNAME','dist/CNAME');}catch(e){if(e.code!=='ENOENT')throw e;}
console.log('Built website into dist/. Existing root URLs are preserved.');

await writeFile('dist/_redirects', '/blog /wiki#articles 301\n/blog.html /wiki#articles 301\n/content /wiki#videos 301\n/content.html /wiki#videos 301\n');
