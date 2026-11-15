import fs from "node:fs/promises";
import path from "node:path";
import {fileURLToPath,pathToFileURL} from "node:url";
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),"..");
export async function exportDeck({chromium,browserPath,outFile}={}){
  if(!chromium)({chromium}=await import("playwright"));
  if(!browserPath&&process.env.BROWSER_PATH)browserPath=process.env.BROWSER_PATH;
  if(!browserPath&&process.platform==="win32"){
    for(const p of ["C:/Program Files/Google/Chrome/Application/chrome.exe","C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe"]){try{await fs.access(p);browserPath=p;break;}catch{}}
  }
  const browser=await chromium.launch({headless:true,...(browserPath?{executablePath:browserPath}:{}),args:["--disable-gpu","--disable-dev-shm-usage"]});
  try{
    const context=await browser.newContext({viewport:{width:1920,height:1080},deviceScaleFactor:1,offline:true,reducedMotion:"reduce"});
    const page=await context.newPage();await page.goto(pathToFileURL(path.join(root,"index.html")).href);
    await page.evaluate(()=>window.prevoraReady);
    const failed=await page.evaluate(()=>[...document.images].filter(i=>!i.naturalWidth&&!i.classList.contains('cover-print-background')).map(i=>i.src));
    if(failed.length)throw new Error("Assets ausentes: "+failed.join(", "));
    // Flatten only the cover's photographic treatment. Some PDF viewers
    // render nested CSS filter/transparency groups with a magenta cast.
    // The title and all other text remain vector and selectable.
    await page.evaluate(()=>window.prevoraDeck.goTo(0));
    const mask=await page.addStyleTag({content:'.slide-cover > :not(.cover-photo){visibility:hidden!important}.controls{visibility:hidden!important}'});
    const cover=await page.locator('.cover-photo').screenshot({type:'png',animations:'disabled'});
    await fs.writeFile(path.join(root,'assets/images/cover-print.png'),cover);
    await mask.evaluate(el=>el.remove());
    await page.evaluate(src=>{const img=document.querySelector('.cover-print-background');img.src=src;return img.decode();},'data:image/png;base64,'+cover.toString('base64'));
    const output=outFile?path.resolve(outFile):path.join(root,"exports/Prevora_Cinematico.pdf");
    await fs.mkdir(path.dirname(output),{recursive:true});
    await page.pdf({path:output,printBackground:true,preferCSSPageSize:true,displayHeaderFooter:false,tagged:true});
    return output;
  }finally{await browser.close();}
}
if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url)){
  exportDeck({outFile:process.argv[2]}).then(p=>console.log("PDF: "+p)).catch(e=>{console.error(e.message);process.exitCode=1;});
}

