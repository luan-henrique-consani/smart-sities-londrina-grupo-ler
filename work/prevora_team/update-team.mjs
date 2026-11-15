import fs from 'node:fs/promises';
import vm from 'node:vm';
const file='prevora-pitch/data/content.js',sandbox={window:{}};
vm.runInNewContext(await fs.readFile(file,'utf8'),sandbox);
const c=sandbox.window.PREVORA_CONTENT;
c.copy.team.members=[
 {name:'Eduardo Hoffmann',initials:'EH',photo:'assets/images/team-eduardo.png',role:'DEV · PESQUISA',bio:'IC e láurea SENAI\nAux. de TI · G&P',contribution:'Pesquisa e protótipo'},
 {name:'Luan Henrique',initials:'LH',photo:'assets/images/team-luan.png',role:'DEV · APRESENTAÇÃO',bio:'IC e láurea SENAI\nEstágio · Koru',contribution:'Pesquisa, protótipo e pitch'},
 {name:'Samuel Paulo',initials:'SP',photo:'assets/images/team-samuel.png',role:'DEV · APRESENTAÇÃO',bio:'Sistemas para Vectra,\nPositivo e Ademicon',contribution:'Sistema e prompts'},
 {name:'Raphael Tumiski',initials:'RT',photo:'assets/images/team-raphael.png',role:'DEV · APRESENTAÇÃO',bio:'Fast Ariam, Temperlândia\ne Multibelt',contribution:'Pesquisa e QA'}
];
c.copy.team.foot='IC: iniciação científica · Perfis e fotografias fornecidos pela equipe.';
c.slides[7].notes='Eduardo e Luan trazem pesquisa e prototipação. Samuel contribui com o sistema e os prompts. Raphael atua na pesquisa e no QA. Juntos, construímos e apresentamos o Prevora.';
await fs.writeFile(file,'window.PREVORA_CONTENT = '+JSON.stringify(c,null,2)+';\n');
let js=await fs.readFile('prevora-pitch/scripts/deck.js','utf8');
for(const field of ['role','bio','contribution'])js=js.replace('esc(m.'+field+')','br(m.'+field+')');
await fs.writeFile('prevora-pitch/scripts/deck.js',js);
await fs.appendFile('prevora-pitch/styles/deck.css',`\n/* Equipe: fotos e síntese dos perfis fornecidos. */
.team-member:nth-child(1){left:145px;top:255px}.team-member:nth-child(2){left:590px;top:315px}.team-member:nth-child(3){left:1030px;top:255px}.team-member:nth-child(4){left:1470px;top:315px}
.portrait-placeholder{height:350px;overflow:hidden}
.portrait-placeholder img{position:absolute;top:0;width:122%;left:-11%;height:100%;object-fit:cover;transform:skewX(8deg) scale(1.02);filter:saturate(.55) contrast(1.06) brightness(.9)}
.team-member:nth-child(1) img{object-position:50% 33%}.team-member:nth-child(2) img{object-position:53% 35%}.team-member:nth-child(3) img{object-position:50% 42%}.team-member:nth-child(4) img{object-position:50% 40%}
.team-member .team-fields{margin-top:55px}
.team-fields p{font-size:23px;line-height:1.35;padding:12px 0}
.team-fields p:first-child{font-size:20px;letter-spacing:.045em;color:#ff918a;font-weight:500}
.team-fields p:last-child{color:#fff;font-size:23px}
.team-foot{font-size:18px;bottom:35px}
`);
let roteiro=await fs.readFile('prevora-pitch/ROTEIRO.md','utf8');
roteiro=roteiro.replace(/(## 8\.[^\n]*\n\n)[\s\S]*?(?=\n## |$)/,(_,h)=>h+c.slides[7].notes+'\n');
await fs.writeFile('prevora-pitch/ROTEIRO.md',roteiro);
let test=await fs.readFile('work/prevora_html/interaction-checks.mjs','utf8');test=test.replace('Rafael Tumiski','Raphael Tumiski');await fs.writeFile('work/prevora_html/interaction-checks.mjs',test);
const manifest=JSON.parse(await fs.readFile('prevora-pitch/assets/assets.json','utf8'));
for(const m of c.copy.team.members)manifest.images.push({file:m.photo.replace('assets/',''),author:m.name,source:'Fornecida pela equipe para esta apresentação',license:'Uso autorizado no projeto pela equipe'});
await fs.writeFile('prevora-pitch/assets/assets.json',JSON.stringify(manifest,null,2));
await fs.appendFile('prevora-pitch/assets/CREDITS.md','\n## Fotografias da equipe\nEduardo Hoffmann, Luan Henrique, Samuel Paulo e Raphael Tumiski: fotografias fornecidas pela equipe para uso nesta apresentação, na ordem indicada pelo usuário.\n');
console.log('Equipe atualizada na ordem Eduardo, Luan, Samuel e Raphael.');
