import {createRequire} from 'node:module';
import {pathToFileURL} from 'node:url';
import fs from 'node:fs/promises';
import path from 'node:path';
const require=createRequire(import.meta.url);
const {chromium}=require('C:/Program Files/WindowsApps/OpenAI.CodexPrimaryRuntime.v26-1112-737-0_26.1112.737.0_x64__3k8sg7r9htsxt/dependencies/node/node_modules/playwright');
const root=process.cwd(),out=path.join(root,'work/prevora_html/screenshots');await fs.mkdir(out,{recursive:true});
const browser=await chromium.launch({executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe',headless:true,args:['--no-sandbox','--disable-gpu','--disable-dev-shm-usage']});
const context=await browser.newContext({viewport:{width:1920,height:1080},deviceScaleFactor:1,offline:true,reducedMotion:'reduce'});
const page=await context.newPage();const errors=[];const failed=[];page.on('pageerror',e=>errors.push(e.message));page.on('requestfailed',r=>failed.push({url:r.url(),failure:r.failure()?.errorText}));
await page.goto(pathToFileURL(path.join(root,'prevora-pitch/index.html')).href);await page.evaluate(()=>window.prevoraReady);
await page.evaluate(()=>document.body.classList.add('ui-hidden'));
const initial=await page.evaluate(()=>({count:window.prevoraDeck.count,images:[...document.images].filter(i=>!i.complete||!i.naturalWidth).map(i=>i.src),font:document.fonts.check('24px Michroma'),loadedFont:[...document.fonts].map(f=>({family:f.family,status:f.status}))}));
const layouts=[];
for(let i=0;i<9;i++){await page.evaluate(n=>window.prevoraDeck.goTo(n),i);await page.waitForTimeout(80);layouts.push(await page.evaluate(()=>{
const slide=document.querySelector('.slide.is-active'),frame=slide.getBoundingClientRect(),issues=[],textNodes=[];
const walker=document.createTreeWalker(slide,NodeFilter.SHOW_TEXT);let node;
while(node=walker.nextNode()){if(!node.textContent.trim()||node.parentElement.closest('svg')||getComputedStyle(node.parentElement).visibility==='hidden')continue;const range=document.createRange();range.selectNodeContents(node);const rects=[...range.getClientRects()].map(r=>({x:r.x,y:r.y,w:r.width,h:r.height}));for(const r of rects){if(r.x<frame.x-2||r.y<frame.y-2||r.x+r.w>frame.right+2||r.y+r.h>frame.bottom+2)issues.push({text:node.textContent.trim(),rect:r});}textNodes.push({text:node.textContent.trim(),rects});}
return {slide:Number(slide.dataset.slide),issues,textNodes};
}));await page.screenshot({path:path.join(out,'slide-'+String(i+1).padStart(2,'0')+'.png')});}
const result={initial,errors,failed,slides:layouts};await fs.writeFile(path.join(root,'work/prevora_html/qa-layout.json'),JSON.stringify(result,null,2));
console.log(JSON.stringify({initial,errors,failed,overflow:layouts.map(s=>({slide:s.slide,issues:s.issues}))},null,2));
await browser.close();
