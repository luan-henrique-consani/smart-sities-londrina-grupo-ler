import fs from 'node:fs/promises';
let check=await fs.readFile('work/prevora_html/export-and-check.mjs','utf8');
check=check.split('\n').filter(l=>!l.startsWith('console.log(await exportDeck')&&!l.startsWith('await fs.copyFile')).join('\n');
await fs.writeFile('work/prevora_html/standalone-only.mjs',check);
await fs.appendFile('prevora-pitch/README.md','\n## Revisão da apresentação\nO encerramento agora é um convite à colaboração. B2B e B2G aparecem no modelo comercial. A matriz usa ✓¹ para planejado, ✓² para demonstrativo e ? para capacidade não confirmada no concorrente; LLM e acionamento de bombas são propostas. A exportação inclui um fundo de capa opaco para evitar alterações de cor em leitores de PDF, preservando os textos vetoriais.\n');
let roteiro=await fs.readFile('prevora-pitch/ROTEIRO.md','utf8');
roteiro=roteiro.replace('9. O próximo passo é testar em um condomínio','9. Vamos agir juntos').replace(/## 9\.[^\n]+/,'## 9. Vamos agir juntos - 15 segundos');
await fs.writeFile('prevora-pitch/ROTEIRO.md',roteiro);
await fs.appendFile('prevora-pitch/VERIFICACAO.md','\nRevisão: capa com fotografia de fundo opaca no PDF; slides 3, 5, 7 e 9 atualizados. Símbolos de planejamento e demonstração preservam a distinção entre proposta e implementação.\n');
