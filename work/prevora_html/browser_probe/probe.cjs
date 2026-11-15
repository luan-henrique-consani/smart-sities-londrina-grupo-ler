const fs = require('node:fs');
const path = require('node:path');
const {chromium}=require('C:/Program Files/WindowsApps/OpenAI.CodexPrimaryRuntime.v26-1112-737-0_26.1112.737.0_x64__3k8sg7r9htsxt/dependencies/node/node_modules/playwright');
const root=path.join(process.cwd(),'work/prevora_html/browser_probe');
(async()=>{
 const attempts=[
 {name:'chrome-stable',executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe',args:['--no-sandbox','--disable-gpu','--disable-dev-shm-usage']},
 {name:'headless-shell',executablePath:'C:/Users/consa/AppData/Local/ms-playwright/chromium_headless_shell-1228/chrome-headless-shell-win64/chrome-headless-shell.exe',args:['--no-sandbox','--disable-gpu','--disable-dev-shm-usage']}
 ];
 for (const a of attempts){
  const started=Date.now();
  let browser;
  try{
   browser=await chromium.launch({executablePath:a.executablePath,headless:true,timeout:12000,args:a.args});
   const page=await browser.newPage({viewport:{width:1920,height:1080}});
   await page.goto('about:blank');
   await page.setContent('<!doctype html><title>Prevora headless probe</title><body style="background:#08090b;color:white"><h1>Browser probe</h1></body>');
   await page.screenshot({path:path.join(root,a.name+'.png')});
   await page.pdf({path:path.join(root,a.name+'.pdf'),width:'1920px',height:'1080px',printBackground:true});
   const r={...a,success:true,elapsedMs:Date.now()-started,version:browser.version()};
   fs.writeFileSync(path.join(root,a.name+'.json'),JSON.stringify(r,null,2));console.log(JSON.stringify(r));
  }catch(e){
   const r={name:a.name,success:false,elapsedMs:Date.now()-started,error:String(e).slice(0,7000)};
   fs.writeFileSync(path.join(root,a.name+'.json'),JSON.stringify(r,null,2));console.log(JSON.stringify(r));
  }finally{if(browser)await browser.close().catch(()=>{});}
 }
})();

