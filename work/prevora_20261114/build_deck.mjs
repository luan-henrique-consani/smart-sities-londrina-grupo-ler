import fs from 'node:fs/promises';
import {constants as FSC} from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import {pathToFileURL} from 'node:url';
const W=process.cwd(),B=path.join(W,'work/prevora_20261114/build'),O=path.join(W,'output');
const DEP='C:/Program Files/WindowsApps/OpenAI.CodexPrimaryRuntime.v26-1112-737-0_26.1112.737.0_x64__3k8sg7r9htsxt/dependencies';
const SK='C:/Users/consa/.codex/plugins/cache/openai-primary-runtime/presentations/26.1112.11217/skills/presentations';
process.env.CODEX_PRIMARY_RUNTIME_NODE_MODULES=DEP+'/node/node_modules';
process.env.RUNTIME_NODE_MODULES=DEP+'/node/node_modules';
const {Presentation,PresentationFile}=await import(pathToFileURL(DEP+'/node/node_modules/@oai/artifact-tool/dist/artifact_tool.mjs').href);
const {finalizePresentation}=await import(pathToFileURL(SK+'/container_tools/artifact_tool_utils.mjs').href);
const D=JSON.parse(await fs.readFile(path.join(W,'work/prevora_20261114/deck_data.json'),'utf8'));
const P=Presentation.create({slideSize:{width:1600,height:900}});
const C={r:'#C62828',rd:'#8E1B1B',g:'#008C45',w:'#FFFFFF',ink:'#17191D',gray:'#F3F4F6',muted:'#59616D',line:'#D7DAE0',pale:'#FBE9E9',gp:'#E7F4EC'};
let serial=0;
await fs.mkdir(B,{recursive:true});await fs.mkdir(O,{recursive:true});
function tx(sl,str,x,y,w,h,size=32,opt={}){const q=sl.shapes.add({name:'text-'+(++serial),geometry:'textbox',position:{left:x,top:y,width:w,height:h},fill:'none',line:{fill:'none',width:0}});q.text=String(str);q.text.style={fontFamily:'Arial',fontSize:size,color:opt.color??C.ink,bold:opt.bold??false,...opt};q.text.insets=0;return q;}
function shape(sl,geo,x,y,w,h,fill,stroke='none',lw=0){return sl.shapes.add({name:geo+'-'+(++serial),geometry:geo,position:{left:x,top:y,width:w,height:h},fill,line:{fill:stroke,width:lw}});}
function ln(sl,x,y,w,color=C.line){shape(sl,'line',x,y,w,0,'none',color,1.5);}
function footer(sl,s,dark=false){const c=dark?'#F2DADA':C.muted;if(s.foot)tx(sl,s.foot,80,798,1440,53,19,{color:c});tx(sl,String(s.n).padStart(2,'0')+' / 09',80,865,160,23,17,{color:c});tx(sl,'Prevora',1390,860,132,29,21,{bold:true,color:dark?C.w:C.r});}
function head(sl,s){sl.background.fill=C.w;tx(sl,s.title,80,67,1440,104,53,{bold:true});footer(sl,s);}
function word(sl,x,y,size,color=C.r){tx(sl,'Prevora',x,y,1350,size*1.35,size,{bold:true,color});}
function cellTable(sl,s){const t=sl.tables.add({rows:6,columns:5,left:80,top:220,width:1440,height:420,columnWidths:[410,260,255,255,260],values:[s.headers,...s.rows]});t.borders.assign({fill:'#D8D8DC',width:1,style:'solid'});for(let r=0;r<6;r++){t.rows[r].height=r===0?68:70.4;for(let c=0;c<5;c++){const ce=t.getCell(r,c);ce.fill=r===0?(c===1?C.r:C.ink):(c===1?C.pale:(r%2?C.w:C.gray));ce.text.style={fontFamily:'Arial',fontSize:r===0?29:26,bold:r===0,color:r===0?C.w:C.ink};}}return t;}
for(const s of D.slides){const sl=P.slides.add();
if(s.n!==1&&s.n!==9)head(sl,s);
if(s.n===1){sl.background.fill=C.w;word(sl,95,95,128);tx(sl,'Alerta para agir.',100,333,1380,110,76,{bold:true});tx(sl,'Histórico para prevenir.',100,442,1380,110,76,{bold:true,color:C.g});tx(sl,s.screen[3],105,666,1360,70,35,{color:C.muted});tx(sl,'Smart Cities Hackathon 2026',105,820,1100,40,25,{color:C.r});}
else if(s.n===2){tx(sl,s.screen[0],82,181,1430,62,34,{color:C.muted});const steps=[[s.screen[1],s.screen[2]],[s.screen[3],s.screen[4]],[s.screen[5],s.screen[6]],[s.screen[7],s.screen[8]]];steps.forEach((st,j)=>{const x=80+j*373;shape(sl,'rect',x,292,317,112,j===3?C.g:C.pale);tx(sl,st[0],x+18,313,281,73,32,{bold:true,color:j===3?C.w:C.r});tx(sl,st[1],x,438,321,96,29);if(j<3)shape(sl,'rightArrow',x+329,334,31,27,C.r);});
ln(sl,80,590,1440);tx(sl,s.screen[9],82,620,675,43,29,{bold:true,color:C.r});tx(sl,s.screen[10],82,674,655,84,29);tx(sl,s.screen[11],832,620,680,43,29,{bold:true,color:C.g});tx(sl,s.screen[12],832,674,675,84,29);tx(sl,s.screen[13],82,790,1430,51,25,{color:C.muted});}
else if(s.n===3){tx(sl,s.screen[0],82,194,1420,70,37,{color:C.muted});tx(sl,'76',80,300,440,182,167,{bold:true,color:C.r});tx(sl,'apartamentos',88,499,615,70,45,{bold:true});tx(sl,s.screen[2],90,593,560,112,31,{color:C.muted});tx(sl,s.screen[3],790,317,710,136,39,{bold:true});s.screen.slice(4).forEach((v,j)=>{ln(sl,790,492+j*82,708);tx(sl,v,790,505+j*82,710,62,31,{color:j===0?C.r:C.ink});});}
else if(s.n===4){tx(sl,'4',80,216,230,186,170,{bold:true,color:C.g});tx(sl,s.screen[1],300,265,1110,102,49,{bold:true});ln(sl,80,435,1440);tx(sl,s.screen[2],80,471,680,93,34,{bold:true});tx(sl,s.screen[3],80,590,655,77,29,{color:C.muted});tx(sl,s.screen[4],835,470,680,65,35,{bold:true,color:C.r});tx(sl,s.screen[5],835,554,670,100,31);tx(sl,s.screen[6],835,672,670,88,31);}
else if(s.n===5){[0,1,2].forEach(j=>{const x=80+j*500;tx(sl,['01','02','03'][j],x,236,425,83,59,{bold:true,color:j===1?C.g:C.r});tx(sl,s.screen[j*2],x,351,430,78,41,{bold:true});tx(sl,s.screen[j*2+1],x,452,425,115,33);});ln(sl,80,607,1440);tx(sl,s.screen[6],80,640,1440,50,31);tx(sl,s.screen[7],80,705,1440,47,27,{color:C.muted});tx(sl,s.screen[8],80,754,1440,43,27,{color:C.muted});}
else if(s.n===6){
shape(sl,'ellipse',80,199,590,590,'#FCEDED',C.r,2);shape(sl,'ellipse',164,370,420,420,'#F3CBCB',C.r,2);shape(sl,'ellipse',264,565,220,220,C.g);
tx(sl,'TAM',238,222,260,42,29,{bold:true,color:C.r});tx(sl,'≈327 mil',216,267,330,63,49,{bold:true,color:C.r});tx(sl,'condomínios no Brasil',163,330,430,38,27);
tx(sl,'SAM',282,395,220,40,29,{bold:true,color:C.rd});tx(sl,'até ≈2 mil',232,442,330,61,44,{bold:true,color:C.rd});tx(sl,'condomínios em Londrina',198,507,390,42,26);
tx(sl,'SOM',329,586,170,40,28,{bold:true,color:C.w});tx(sl,'5 clientes',284,631,220,58,39,{bold:true,color:C.w});tx(sl,'meta em 12 meses',279,699,200,47,22,{color:C.w});
tx(sl,s.screen[9],800,220,690,110,42,{bold:true});tx(sl,s.screen[10],800,374,680,104,33);tx(sl,s.screen[11],800,501,680,112,33);ln(sl,800,647,700);tx(sl,s.screen[12],800,680,695,105,31,{color:C.r,bold:true});
}
else if(s.n===7){cellTable(sl,s);tx(sl,s.screen[0],82,669,1430,58,31,{bold:true,color:C.r});tx(sl,s.screen[1],82,735,1435,35,23,{color:C.muted});tx(sl,s.screen[2],82,770,1435,36,23,{color:C.muted});}
else if(s.n===8){s.members.forEach((name,j)=>{const x=80+j*372;shape(sl,'rect',x,213,323,192,C.gray,C.line,1);tx(sl,'Foto',x+95,284,210,50,30,{color:C.muted});tx(sl,name,x,437,333,78,32,{bold:true,color:C.r});tx(sl,'Área de atuação',x,523,330,41,25,{bold:true});tx(sl,'A preencher',x,563,330,42,25,{color:C.muted});tx(sl,'Descrição profissional',x,619,332,42,24,{bold:true});tx(sl,'A preencher',x,657,330,40,25,{color:C.muted});tx(sl,'Contribuição ao projeto',x,711,335,40,24,{bold:true});tx(sl,'A preencher',x,749,330,38,25,{color:C.muted});});}
else if(s.n===9){sl.background.fill=C.rd;tx(sl,s.title,80,65,1440,110,53,{bold:true,color:C.w});[0,1,2].forEach(j=>{const x=80+j*500;tx(sl,['01','02','03'][j],x,240,420,80,61,{bold:true,color:C.w});tx(sl,s.screen[j*2],x,347,425,88,40,{bold:true,color:C.w});tx(sl,s.screen[j*2+1],x,451,425,124,31,{color:'#FCEEEE'});});tx(sl,s.screen[6],80,645,1420,106,43,{bold:true,color:C.w});tx(sl,s.screen[7],80,752,1430,47,28,{color:'#FCEEEE'});footer(sl,s,true);}
const refs=s.refs.map(id=>D.sources.find(x=>x.id===id)).filter(Boolean);sl.speakerNotes.text='JANELA DE TEMPO: '+s.seconds+' segundos, incluindo transição.\n\nROTEIRO\n'+s.notes+'\n\nFONTES E LIMITES\n'+refs.map(r=>r.id+' - '+r.org+'. '+r.title+'. '+r.year+'\n'+r.url+'\nLimite: '+r.limit).join('\n\n');
}
if(P.slides.items.length!==9)throw Error('Expected exactly 9 slides');
for(let i=0;i<9;i++){const sl=P.slides.items[i];const png=await P.export({slide:sl,format:'png',scale:1});await fs.writeFile(path.join(B,'slide-'+String(i+1).padStart(2,'0')+'.png'),new Uint8Array(await png.arrayBuffer()));const layout=await sl.export({format:'layout'});await fs.writeFile(path.join(B,'slide-'+String(i+1).padStart(2,'0')+'.layout.json'),await layout.text());console.log('Render '+(i+1));}
const candidate=path.join(B,'Prevora_candidato.pptx'),final=path.join(O,'Prevora_Pitch_Final.pptx');
await(await PresentationFile.exportPptx(P)).save(candidate);await fs.mkdir(path.join(B,'checks'),{recursive:true});
try{const receipt=await finalizePresentation({workspaceDir:W,candidatePath:candidate,finalPath:final,pythonExecutable:DEP+'/python/python.exe',integrityValidatorPath:SK+'/container_tools/inspect_presentation_package_integrity.py',layoutValidatorPath:SK+'/container_tools/inspect_presentation_layout_geometry.py',explicitTotalSlideCount:9,requiredNativeTableOwnerSlides:[7],fontPolicy:{basis:'design',families:['Arial']},verifyArtifactToolImport:true,layoutArgs:['--expected-slide-size-emu','15240000,8572500','--validate-bullet-geometry','--validate-heading-fit','--require-native-table-slide','7'],receiptPath:path.join(B,'checks','validation.json')});await fs.writeFile(path.join(B,'finalization_result.json'),JSON.stringify(receipt,null,2));}
catch(e){if(e.code!=='EPERM'||e.syscall!=='link'||path.resolve(e.dest??'')!==path.resolve(final))throw e;await fs.copyFile(candidate,final,FSC.COPYFILE_EXCL);const hash=async p=>crypto.createHash('sha256').update(await fs.readFile(p)).digest('hex');if(await hash(candidate)!==await hash(final))throw Error('Hash mismatch');await fs.writeFile(path.join(B,'checks','publication_fallback.json'),JSON.stringify({note:'Finalizer reached publication after validators; Windows hard-link unavailable. Published the unchanged candidate by exclusive copy.',sha256:await hash(final),slideCount:9},null,2));}
console.log('FINAL: '+final);

