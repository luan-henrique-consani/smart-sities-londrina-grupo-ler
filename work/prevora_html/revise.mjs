import fs from 'node:fs/promises';
import vm from 'node:vm';
const file='prevora-pitch/data/content.js';
const sandbox={window:{}};vm.runInNewContext(await fs.readFile(file,'utf8'),sandbox);
const c=sandbox.window.PREVORA_CONTENT;
c.copy.business.lead='B2B para condomínios e empresas. B2G para a gestão pública.';
c.copy.business.foot='Compradores: condomínios, empresas e órgãos públicos. Operação: gestores e manutenção. Preços a definir. Fotos ilustrativas.';
c.copy.competition.kicker='Monitorar o ponto. Conectar o contexto. Apoiar a decisão.';
c.copy.competition.rows[4][1]='Planejado';
c.copy.competition.rows.push(['Apoio à análise com LLM','Planejado','Não verificado','Não verificado','Não verificado']);
c.copy.competition.legend='✓ Oferta declarada   ✓¹ Planejado   ✓² Demonstrativo   ? Não confirmado nas fontes\n¹ Inclui LLM e acionamento de bombas: evolução proposta, ainda não implementada.';
c.copy.competition.foot='LLM: proposta para organizar relatos e explicar prioridades, com revisão humana. ? não significa ausência no concorrente.';
c.copy.roadmap.title='VAMOS AGIR JUNTOS.';
c.copy.roadmap.steps=[];
c.copy.roadmap.invitation='SEU CONDOMÍNIO.\nSUA EMPRESA.\nSUA CIDADE.';
c.copy.roadmap.invitationBody='Traga um ponto de risco.\nVamos construir a resposta juntos.';
c.copy.roadmap.cta='Buscamos empresas, gestores e órgãos públicos\npara levar o Prevora a campo. Faça parte.';
c.copy.roadmap.foot='PREVORA · Dados para agir antes.';
c.slides[4].notes='Nosso modelo reúne implantação, assinatura da plataforma e manutenção. Começamos no B2B, com condomínios e empresas, e também queremos atender a gestão pública pelo modelo B2G. O comprador contrata o conjunto; gestores e equipes de manutenção usam as informações para orientar a resposta. Preços serão definidos com os custos e a validação comercial.';
c.slides[6].notes='Já existem alternativas como IOTIZA, GRS e PRO11. Nossa proposta é conectar o sinal ao histórico, ao responsável e à intervenção. Os símbolos distinguem demonstração e planejamento. Planejamos também apoio de LLM para organizar relatos e explicar prioridades, com revisão humana. A disponibilidade desses recursos nos concorrentes não foi confirmada.';
c.slides[8].title='Vamos agir juntos';
c.slides[8].notes='Seu condomínio, sua empresa ou sua cidade pode ser o próximo passo do Prevora. Buscamos gestores e parceiros dispostos a construir essa prevenção conosco. Traga um ponto de risco. Vamos transformar essa conversa em uma ação conjunta?';
await fs.writeFile(file,'window.PREVORA_CONTENT = '+JSON.stringify(c,null,2)+';\n');
let js=await fs.readFile('prevora-pitch/scripts/deck.js','utf8');
const start=js.indexOf('const val=v=>',js.indexOf('function competition()'));
const end=js.indexOf(';\n    return section',start);
js=js.slice(0,start)+`const val=v=>v==='✓'?'<span class="check" aria-label="Oferta declarada">✓</span>':v==='Não verificado'?'<span class="nv" aria-label="Não confirmado nas fontes">?</span>':v==='Planejado'?'<span class="check planned" aria-label="Planejado">✓<sup>1</sup></span>':v==='Demo'?'<span class="check demo" aria-label="Demonstrativo">✓<sup>2</sup></span>':esc(v)`+js.slice(end);
const a=js.indexOf("badge()+'<div class=\"pos roadmap-steps\">");
const b=js.indexOf('    tag(c.cta',a);
js=js.slice(0,a)+`badge()+'<div class="pos closing-invitation"><p class="eyebrow green-text">CONSTRUA COM A PREVORA</p><h3>'+br(c.invitation)+'</h3><p class="closing-body">'+br(c.invitationBody)+'</p></div>'+\n`+js.slice(b);
js=js.replace('PROPOSTA B2B / MONITORAMENTO','B2B + B2G / MONITORAMENTO');
await fs.writeFile('prevora-pitch/scripts/deck.js',js);
const css=`
/* Revisão: B2G, convite final, matriz por símbolos e enquadramento. */
.slide-foot{max-width:1540px}
.business-lead{font-size:30px}
.business-foot{max-width:1520px;font-size:19px;bottom:38px}
.problem-photo{left:1190px;top:65px;width:665px;height:620px;transform:skewX(-8deg)}
.problem-photo img{width:122%;left:-11%;transform:skewX(8deg) scale(1.02);object-position:51% 52%}
.problem-title{width:1050px;font-size:108px}
.problem-case{width:550px;top:570px}
.problem-case p{font-size:29px}
.problem-credit{left:1290px;top:728px;width:485px}
.problem-cost{width:1100px;top:821px}
.competition-table-frame{top:190px;padding:17px 30px 15px}
.competition-table th,.competition-table td{padding:12px 17px;height:72px}
.competition-table .check{font-size:37px;line-height:1}
.competition-table .planned{color:#ff938b}.competition-table .demo{color:#66d49a}
.competition-table sup{font-family:var(--body);font-size:17px;vertical-align:super;margin-left:3px}
.competition-table .nv{font-size:31px;color:#9f969b}
.competition-legend{top:765px;font-size:21px;line-height:1.55}
.competition-title{top:881px;font-size:85px}
.competition-foot{bottom:35px;max-width:1500px;font-size:18px}
.roadmap-photo{left:100px;top:55px;width:755px;height:600px}
.closing-invitation{left:990px;top:205px;width:810px}
.closing-invitation .eyebrow{font-size:21px;letter-spacing:.12em;margin-bottom:28px}
.closing-invitation h3{font-size:54px;line-height:1.15;font-weight:500;letter-spacing:-.025em}
.closing-body{font-size:29px;line-height:1.4;margin-top:32px!important;color:#c7bdc3}
.roadmap-cta{left:620px;top:665px;width:1170px;min-height:128px;font-size:31px;padding:20px 36px}
.roadmap-title{left:100px;top:848px;font-size:103px;letter-spacing:-.055em}
.roadmap-credit{left:112px;top:677px;font-size:17px;max-width:420px}
.roadmap-contact{top:1001px;left:113px;font-size:22px}
.roadmap-foot{left:1020px;right:auto;bottom:55px;max-width:570px;text-align:left;font-size:18px}
.slide-roadmap .slide-number{bottom:39px}
.cover-print-background{display:none}
@media print{.cover-print-background{display:block!important;position:absolute;inset:0;width:1920px;height:1080px;z-index:1}.slide-cover:has(.cover-print-background) .cover-photo{display:none!important}}
`;
await fs.appendFile('prevora-pitch/styles/deck.css',css);
await fs.appendFile('prevora-pitch/SOURCES.md','\n## Revisão de escopo\nB2G incluído como frente comercial proposta. LLM para organizar relatos e explicar prioridades, e acionamento de bombas, são planejados; não representam recursos implementados. Na matriz, ? significa não confirmado, sem afirmar ausência no concorrente. A paleta, a tipografia e a direção de marca Prevora permanecem preservadas.\n');
let roteiro=await fs.readFile('prevora-pitch/ROTEIRO.md','utf8');
for(const i of [4,6,8]){const heading=new RegExp('(## '+(i+1)+'\\.[^\\n]*\\n\\n)[\\s\\S]*?(?=\\n## |$)');roteiro=roteiro.replace(heading,(_,h)=>h+c.slides[i].notes+'\n');}
await fs.writeFile('prevora-pitch/ROTEIRO.md',roteiro);
console.log('Revisados slides 3, 5, 7 e 9; escopo e roteiro atualizados.');
