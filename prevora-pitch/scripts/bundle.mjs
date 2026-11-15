import fs from "node:fs/promises";
import path from "node:path";
import {fileURLToPath} from "node:url";
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),"..");
export async function bundle({outFile}={}){
  let html=await fs.readFile(path.join(root,"index.html"),"utf8");
  let css=await fs.readFile(path.join(root,"styles/deck.css"),"utf8");
  let data=await fs.readFile(path.join(root,"data/content.js"),"utf8");
  let js=await fs.readFile(path.join(root,"scripts/deck.js"),"utf8");
  const manifest=JSON.parse(await fs.readFile(path.join(root,"assets/assets.json"),"utf8"));
  const assetPaths=[...manifest.images.map(a=>"assets/"+a.file),...manifest.fonts.map(a=>"assets/"+a.file),"assets/brand/prevora-logo.png","assets/brand/favicon.svg","assets/images/cover-print.png"];
  const mime={".jpg":"image/jpeg",".png":"image/png",".svg":"image/svg+xml",".ttf":"font/ttf"};
  for(const relative of assetPaths){
    const bytes=await fs.readFile(path.join(root,relative));const uri="data:"+mime[path.extname(relative)]+";base64,"+bytes.toString("base64");
    css=css.split("../"+relative).join(uri);
    data=data.split(relative).join(uri);js=js.split(relative).join(uri);html=html.split(relative).join(uri);
  }
  html=html.replace('<link rel="stylesheet" href="styles/deck.css">',"<style>\n"+css+"\n</style>");
  html=html.replace('<script defer src="data/content.js"></script>',"<script>\n"+data.replace(/<\/script/gi,"<\\/script")+"\n</script>");
  html=html.replace('<script defer src="scripts/deck.js"></script>',"<script>\ndocument.addEventListener('DOMContentLoaded',()=>{\n"+js.replace(/<\/script/gi,"<\\/script")+"\n});\n</script>");
  const licenses=await Promise.all(manifest.fonts.map(a=>fs.readFile(path.join(root,"assets",a.license_file),"utf8")));
  const metadata='<script type="application/json" id="asset-credits">'+JSON.stringify(manifest).replace(/<\/script/gi,"<\\/script")+'</script>'+
    licenses.map((l,i)=>'<script type="text/plain" id="font-license-'+i+'">'+l.replace(/<\/script/gi,"<\\/script")+'</script>').join("");
  html=html.replace("</body>",metadata+"\n</body>");
  const output=outFile?path.resolve(outFile):path.join(root,"exports/Prevora_Apresentacao.html");await fs.mkdir(path.dirname(output),{recursive:true});await fs.writeFile(output,html,"utf8");return output;
}
if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url))bundle({outFile:process.argv[2]}).then(console.log).catch(e=>{console.error(e.message);process.exitCode=1;});

