import fs from 'node:fs/promises';import vm from 'node:vm';
const file='prevora-pitch/data/content.js',s={window:{}};vm.runInNewContext(await fs.readFile(file,'utf8'),s);const c=s.window.PREVORA_CONTENT;
c.copy.competition.legendItems=[{symbol:'✓',label:'Ofertado pela empresa',style:''},{symbol:'P',label:'Planejado',style:'red-text'},{symbol:'D',label:'Demonstrado no protótipo',style:'green-text'},{symbol:'?',label:'Sem confirmação',style:'muted'}];
c.copy.competition.legendNote='LLM e acionamento de bombas estão planejados: ainda serão desenvolvidos.';
await fs.writeFile(file,'window.PREVORA_CONTENT = '+JSON.stringify(c,null,2)+';\n');
let js=await fs.readFile('prevora-pitch/scripts/deck.js','utf8');
js=js.replace(`'<p class="pos competition-legend">'+br(c.legend)+'</p>'+`, `'<div class="pos competition-legend"><div class="legend-items">'+c.legendItems.map(v=>'<span class="legend-item"><b class="legend-mark '+esc(v.style)+'">'+esc(v.symbol)+'</b><span>'+esc(v.label)+'</span></span>').join('')+'</div><p class="legend-note">'+esc(c.legendNote)+'</p></div>'+`);
await fs.writeFile('prevora-pitch/scripts/deck.js',js);
await fs.appendFile('prevora-pitch/styles/deck.css','\n.legend-items{display:flex;align-items:center;gap:36px}.legend-item{display:inline-flex;align-items:center;gap:12px;font-size:22px;white-space:nowrap}.legend-mark{display:inline-flex;width:40px;height:40px;align-items:center;justify-content:center;border:1px solid currentColor;border-radius:5px;font-size:25px;font-weight:500}.legend-note{font-size:20px;margin-top:13px!important}\n');
