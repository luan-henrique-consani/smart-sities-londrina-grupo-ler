import {createRequire} from 'node:module';
import fs from 'node:fs/promises';
import path from 'node:path';
import {pathToFileURL} from 'node:url';
import {exportDeck} from '../../prevora-pitch/scripts/export-pdf.mjs';
const require=createRequire(import.meta.url);const {chromium}=require('C:/Program Files/WindowsApps/OpenAI.CodexPrimaryRuntime.v26-1112-737-0_26.1112.737.0_x64__3k8sg7r9htsxt/dependencies/node/node_modules/playwright');
const root=process.cwd();const executablePath='C:/Program Files/Google/Chrome/Application/chrome.exe';
console.log(await exportDeck({chromium,browserPath:executablePath,outFile:path.join(root,'output/Prevora_Cinematico.pdf')}));
await fs.copyFile(path.join(root,'output/Prevora_Cinematico.pdf'),path.join(root,'prevora-pitch/exports/Prevora_Cinematico.pdf'));
const browser=await chromium.launch({executablePath,headless:true,args:['--no-sandbox','--disable-gpu','--disable-dev-shm-usage']});const context=await browser.newContext({viewport:{width:1920,height:1080},offline:true,reducedMotion:'reduce'});const page=await context.newPage();
const requests=[],errors=[],failed=[];page.on('request',r=>requests.push(r.url().slice(0,120)));page.on('requestfailed',r=>failed.push(r.url().slice(0,120)));page.on('pageerror',e=>errors.push(e.message));
await page.goto(pathToFileURL(path.join(root,'output/Prevora_Apresentacao.html')).href);await page.evaluate(()=>window.prevoraReady);
const valid=await page.evaluate(()=>({slides:window.prevoraDeck.count,fonts:[...document.fonts].map(f=>({family:f.family,status:f.status})),images:[...document.images].every(i=>i.naturalWidth>0),remoteAssets:[...document.querySelectorAll('[src],[href]')].map(x=>x.getAttribute('src')||x.getAttribute('href')).filter(s=>/^(https?:)?\/\//i.test(s||""))}));
await page.keyboard.press('ArrowRight');valid.navigation=await page.evaluate(()=>window.prevoraDeck.current===1);
await fs.writeFile(path.join(root,'work/prevora_html/standalone-check.json'),JSON.stringify({valid,requests,errors,failed},null,2));console.log(JSON.stringify({valid,requests,errors,failed}));await browser.close();

