import {spawn} from 'node:child_process';
import fs from 'node:fs/promises';
const server=spawn(process.execPath,['prevora-pitch/scripts/serve.mjs'],{env:{...process.env,PORT:'4189'},stdio:['ignore','pipe','pipe']});
try{
  await new Promise((resolve,reject)=>{server.stdout.once('data',resolve);server.once('error',reject);server.once('exit',code=>reject(new Error('Server exited '+code)));});
  const results=[];
  for(const name of ['/','/data/content.js','/assets/fonts/Michroma-Regular.ttf']){
    const response=await fetch('http://127.0.0.1:4189'+name);
    results.push({path:name,status:response.status,size:(await response.arrayBuffer()).byteLength});
  }
  if(results.some(r=>r.status!==200))throw new Error('HTTP check failed');
  await fs.writeFile('work/prevora_html/server-check.json',JSON.stringify(results,null,2));
  console.log(JSON.stringify(results));
}finally{server.kill();}
