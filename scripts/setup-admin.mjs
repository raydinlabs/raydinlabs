// Run interactively. Password is hidden, hashed locally, and piped to Wrangler.
import {randomBytes,webcrypto} from 'node:crypto';
import {spawn} from 'node:child_process';
if(!process.stdin.isTTY)throw Error('Run this command in your own interactive terminal.');
process.stdout.write('Choose an admin password (at least 16 characters): ');
let password='';process.stdin.setRawMode(true);process.stdin.resume();
process.stdin.on('data',async chunk=>{for(const char of chunk.toString()){
 if(char==='\u0003'){process.stdin.setRawMode(false);process.exit(1);}
 if(char==='\r'||char==='\n'){
 process.stdin.setRawMode(false);process.stdin.pause();process.stdout.write('\n');
 if(password.length<16)throw Error('Use at least 16 characters.');
 const salt=randomBytes(24).toString('hex'),enc=new TextEncoder();
 const key=await webcrypto.subtle.importKey('raw',enc.encode(password),'PBKDF2',false,['deriveBits']);
 const hash=Buffer.from(await webcrypto.subtle.deriveBits({name:'PBKDF2',salt:enc.encode(salt),iterations:100000,hash:'SHA-256'},key,256)).toString('hex');password='';
 const proc=spawn(process.execPath,['node_modules/wrangler/bin/wrangler.js','secret','put','ADMIN_PASSWORD_HASH'],{stdio:['pipe','inherit','inherit']});proc.stdin.end(salt+':'+hash);proc.on('exit',code=>process.exit(code||0));return;
 }else if(char==='\u007f')password=password.slice(0,-1);else password+=char;
}});
