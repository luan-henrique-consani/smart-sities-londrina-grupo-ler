import http from "node:http";
import fs from "node:fs/promises";
import path from "node:path";
import {fileURLToPath} from "node:url";
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),"..");
const port=Number(process.env.PORT||4173);
if(!Number.isInteger(port)||port<1||port>65535)throw new Error("PORT inválida");
const types={".html":"text/html; charset=utf-8",".css":"text/css; charset=utf-8",".js":"text/javascript; charset=utf-8",".svg":"image/svg+xml",".png":"image/png",".jpg":"image/jpeg",".ttf":"font/ttf",".pdf":"application/pdf",".json":"application/json; charset=utf-8",".md":"text/plain; charset=utf-8"};
const server=http.createServer(async(req,res)=>{
  if(!["GET","HEAD"].includes(req.method)){res.writeHead(405);res.end();return;}
  try{
    const name=decodeURIComponent(new URL(req.url,"http://127.0.0.1").pathname);
    const target=path.resolve(root,"."+name);
    if(target!==root&&!target.startsWith(root+path.sep)){res.writeHead(403);res.end();return;}
    const stat=await fs.stat(target);const file=stat.isDirectory()?path.join(target,"index.html"):target;
    const bytes=await fs.readFile(file);res.writeHead(200,{"Content-Type":types[path.extname(file)]||"application/octet-stream","Content-Length":bytes.length,"Cache-Control":"no-store"});
    res.end(req.method==="HEAD"?undefined:bytes);
  }catch{res.writeHead(404,{"Content-Type":"text/plain; charset=utf-8"});res.end("Arquivo não encontrado.");}
});
server.listen(port,"127.0.0.1",()=>console.log("Prevora: http://127.0.0.1:"+port));
server.on("error",e=>{console.error(e.message);process.exitCode=1;});

