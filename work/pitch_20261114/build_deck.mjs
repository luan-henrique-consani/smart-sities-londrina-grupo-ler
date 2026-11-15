import fs from 'node:fs/promises';
import path from 'node:path';
import {pathToFileURL} from 'node:url';
const workspaceDir=process.cwd();
const deps='C:/Program Files/WindowsApps/OpenAI.CodexPrimaryRuntime.v26-1112-737-0_26.1112.737.0_x64__3k8sg7r9htsxt/dependencies';
const SKILL_DIR='C:/Users/consa/.codex/plugins/cache/openai-primary-runtime/presentations/26.1112.11217/skills/presentations';
process.env.RUNTIME_NODE_MODULES=deps+'/node/node_modules';
process.env.CODEX_PRIMARY_RUNTIME_NODE_MODULES=process.env.RUNTIME_NODE_MODULES;
const RUNTIME_PYTHON=deps+'/python/python.exe';
const {Presentation,PresentationFile}=await import(pathToFileURL(deps+'/node/node_modules/@oai/artifact-tool/dist/artifact_tool.mjs').href);
const {finalizePresentation}=await import(pathToFileURL(SKILL_DIR+'/container_tools/artifact_tool_utils.mjs').href);
const tmp=path.join(workspaceDir,'work/pitch_20261114/build');
const output=path.join(workspaceDir,'output');
await fs.mkdir(tmp,{recursive:true});await fs.mkdir(output,{recursive:true});
const data=JSON.parse(await fs.readFile(path.join(workspaceDir,'work/pitch_20261114/deck_data.json'),'utf8'));
const p=Presentation.create({slideSize:{width:1600,height:900}});
const C={ink:'#112C35',muted:'#506872',green:'#087F72',mint:'#E1F2EC',paper:'#F7FAF8',line:'#C6D9D5',blue:'#25638A',white:'#FFFFFF',gold:'#C16A29'};
let serial=0;
function text(sl,str,x,y,w,h,size=32,opt={}){
 const q=sl.shapes.add({name:'text-'+(++serial),geometry:'textbox',position:{left:x,top:y,width:w,height:h},fill:'none',line:{fill:'none',width:0}});
 q.text=String(str);
 q.text.style={fontFamily:'Arial',fontSize:size,color:opt.color??C.ink,bold:opt.bold??false,...opt};
 return q;
}
function line(sl,x,y,w,color=C.line){sl.shapes.add({geometry:'line',position:{left:x,top:y,width:w,height:0},fill:'none',line:{fill:color,width:1.5}});}
function rect(sl,x,y,w,h,fill){return sl.shapes.add({geometry:'rect',position:{left:x,top:y,width:w,height:h},fill,line:{fill:'none',width:0}});}
function footer(sl,s,i){
 if(s.foot)text(sl,s.foot,80,790,1420,62,20,{color:C.muted});
 text(sl,(i+1<=9?'PITCH':'ANEXO')+'  '+String(i+1).padStart(2,'0'),80,863,700,24,16,{color:C.muted});
 text(sl,'Safio · Smart Cities 2026',1160,863,360,24,16,{color:C.muted});
}
function heading(sl,s,i){
 sl.background.fill=C.paper;
 text(sl,s.title,80,66,1440,100,51,{bold:true});
 if(s.subtitle)text(sl,s.subtitle,82,174,1410,66,29,{color:C.muted});
 footer(sl,s,i);
}
function lines(sl,arr,x,y,w,size=32,gap=97){
 arr.forEach((v,i)=>{text(sl,v,x,y+i*gap,w,gap-12,size);});
}
function table(sl,headers,rows,x,y,w,h,font=28,widths){
 const t=sl.tables.add({rows:rows.length+1,columns:headers.length,left:x,top:y,width:w,height:h,values:[headers,...rows],...(widths?{columnWidths:widths}:{})});
 t.borders.assign({fill:C.line,width:1,style:'solid'});
 const rh=h/(rows.length+1);
 for(let r=0;r<rows.length+1;r++){
  t.rows[r].height=rh;
  for(let c=0;c<headers.length;c++){
   const cell=t.getCell(r,c);cell.fill=r===0?C.ink:(r%2?C.white:C.mint);
   cell.text.style={fontFamily:'Arial',fontSize:font,bold:r===0,color:r===0?C.white:C.ink};
  }
 }
 return t;
}
for(let i=0;i<data.slides.length;i++){
 const s=data.slides[i],sl=p.slides.add();
 if(s.type!=='cover')heading(sl,s,i);
 if(s.type==='cover'){
  sl.background.fill=C.ink;
  text(sl,'Safio',95,116,1350,150,114,{color:C.white,bold:true});
  text(sl,s.subtitle,100,325,1310,145,55,{color:'#7EE2C7',bold:true});
  text(sl,s.lines[0],103,570,1320,58,31,{color:'#D9E9E8'});
  text(sl,s.lines[1],103,653,1320,66,28,{color:'#D9E9E8'});
 }else if(s.type==='flow'){
  s.steps.forEach((a,j)=>{
   const x=80+j*373;
   rect(sl,x,310,318,120,C.mint);
   text(sl,a[0],x+18,338,280,62,34,{bold:true,color:C.green});
   text(sl,a[1],x,459,325,112,29);
   if(j<3){const ar=sl.shapes.add({geometry:'rightArrow',position:{left:x+327,top:353,width:34,height:28},fill:C.green,line:{fill:'none',width:0}});}
  });
  lines(sl,s.lines,80,631,1420,27,68);
 }else if(s.type==='pain'){
  text(sl,s.big,80,195,920,125,98,{bold:true,color:C.green});
  text(sl,s.bigLabel,83,329,1395,57,29,{color:C.muted});
  lines(sl,s.lines,84,436,1400,32,106);
 }else if(s.type==='validation'){
  text(sl,s.big,80,178,220,155,142,{bold:true,color:C.green});
  text(sl,s.bigLabel,315,224,1165,100,40,{bold:true});
  text(sl,s.leftTitle,82,431,650,62,33,{bold:true,color:C.green});
  text(sl,s.rightTitle,828,431,680,62,33,{bold:true,color:C.blue});
  lines(sl,s.left,82,516,655,29,104);
  lines(sl,s.right,828,516,680,29,78);
 }else if(s.type==='business'){
  s.columns.forEach((a,j)=>{
   const x=j===0?80:830;
   text(sl,a[0],x,202,620,70,50,{bold:true,color:C.green});
   text(sl,a[1],x,301,650,100,32);
   text(sl,a[2],x,420,650,96,27,{color:C.muted});
  });
  line(sl,80,550,1440);
  lines(sl,s.lines,85,584,1420,29,65);
 }else if(s.type==='market'){
  table(sl,s.headers,s.rows,80,232,1440,430,30,[360,510,570]);
  text(sl,'Em número de organizações ou unidades, sem projeção de receita nesta fase.',84,708,1410,58,29,{color:C.green,bold:true});
 }else if(s.type==='competition'){
  table(sl,s.headers,s.rows,80,215,1440,375,29,[510,930]);
  lines(sl,s.lines,82,638,1420,29,66);
 }else if(s.type==='team'){
  s.lines.forEach((v,j)=>{
   text(sl,String(j+1).padStart(2,'0'),84,303+j*105,100,76,46,{color:C.green,bold:true});
   text(sl,v,225,306+j*105,1230,76,36);
   if(j<3)line(sl,225,390+j*105,1210);
  });
 }else if(s.type==='roadmap'){
  s.steps.forEach((a,j)=>{
   let x=80+j*500;
   text(sl,'0'+(j+1),x,245,410,83,57,{bold:true,color:C.green});
   text(sl,a[0],x,355,425,68,39,{bold:true});
   text(sl,a[1],x,455,420,126,32);
  });
  lines(sl,s.lines,80,649,1420,29,65);
 }else if(s.type==='appendix_table'){
  const hasLines=!!s.lines?.length;
  let h=hasLines?365:490;let top=219;
  const font=s.rows.length>=5?26:28;
  const widths=s.headers.length===2?[365,1075]:[420,580,440];
  table(sl,s.headers,s.rows,80,top,1440,h,font,widths);
  if(hasLines)lines(sl,s.lines,82,632,1415,28,67);
 }else if(s.type==='sources'){
  lines(sl,s.lines,84,224,1415,32,105);
 }
 const ss=s.refs.map(id=>data.sources.find(x=>x.id===id)).filter(Boolean);
 sl.speakerNotes.text=s.notes+'\n\nFONTES\n'+ss.map(x=>x.id+' — '+x.title+'\n'+x.url).join('\n\n');
}
console.log('Exportando '+p.slides.items.length+' slides');
for(let i=0;i<p.slides.items.length;i++){
 const sl=p.slides.items[i];
 const png=await p.export({slide:sl,format:'png',scale:1});
 await fs.writeFile(path.join(tmp,'slide-'+String(i+1).padStart(2,'0')+'.png'),new Uint8Array(await png.arrayBuffer()));
 const lo=await sl.export({format:'layout'});
 await fs.writeFile(path.join(tmp,'slide-'+String(i+1).padStart(2,'0')+'.layout.json'),await lo.text());
 console.log('Render '+(i+1));
}
const candidatePath=path.join(tmp,'Safio_Pitch_candidato.pptx');
await (await PresentationFile.exportPptx(p)).save(candidatePath);
const finalPath=path.join(output,'Safio_Pitch_B2G_B2B.pptx');
await fs.mkdir(path.join(tmp,'checks'),{recursive:true});
const result=await finalizePresentation({
 workspaceDir,candidatePath,finalPath,pythonExecutable:RUNTIME_PYTHON,
 integrityValidatorPath:SKILL_DIR+'/container_tools/inspect_presentation_package_integrity.py',
 layoutValidatorPath:SKILL_DIR+'/container_tools/inspect_presentation_layout_geometry.py',
 layoutArgs:['--expected-slide-size-emu','15240000,8572500','--validate-bullet-geometry','--validate-heading-fit',...[6,7,10,11,12,13,14,15].flatMap(n=>['--require-native-table-slide',String(n)])],
 explicitTotalSlideCount:data.slides.length,
 requiredNativeTableOwnerSlides:[6,7,10,11,12,13,14,15],
 fontPolicy:{basis:'design',families:['Arial']},
 verifyArtifactToolImport:true,
 receiptPath:path.join(tmp,'checks','validation.json')
});
await fs.writeFile(path.join(tmp,'finalizer_result.json'),JSON.stringify(result,null,2));
console.log('PPTX final: '+finalPath);

