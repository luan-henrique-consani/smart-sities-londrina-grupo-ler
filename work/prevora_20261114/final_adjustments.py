from pathlib import Path
import json
r=Path.cwd(); p=r/"work/prevora_20261114/deck_data.json"; d=json.loads(p.read_text(encoding="utf-8"))
d["slides"][2]["screen"][4]="Risco de gastos com recuperação"
p.write_text(json.dumps(d,ensure_ascii=False,indent=2),encoding="utf-8")
p=r/"output/Prevora_Pesquisa_Estrutura_e_Roteiro.md";s=p.read_text(encoding="utf-8")
assert s.count("- Limpeza e reparos")==1
s=s.replace("- Limpeza e reparos","- Risco de gastos com recuperação")
needle=next(l for l in s.splitlines() if l.startswith("**Avan") and " comercial:**" in l)
s=s.replace(needle,"Para identificar condições não detectadas, programar vistorias independentes, inclusive nos pontos e horários sem alerta. Sem essa verificação, não é possível medir a sensibilidade apenas pelos avisos gerados.\n\n"+needle)
p.write_text(s,encoding="utf-8")
p=r/"work/prevora_20261114/build_deck.mjs";s=p.read_text(encoding="utf-8");s=s.replace("'Prevora_Pitch_3min.pptx'","'Prevora_Pitch_Final.pptx'");p.write_text(s,encoding="utf-8")
p=r/"work/prevora_20261114/build_pdfs.py";s=p.read_text(encoding="utf-8");s=s.replace('if part:story.append(PageBreak())','if part and not l.startswith("## PARTE C"):story.append(PageBreak())');s=s.replace('path=O/"Prevora_Pitch_3min.pdf"','path=O/"Prevora_Pitch_Final.pdf"');p.write_text(s,encoding="utf-8")
print("Final content adjustments applied")

