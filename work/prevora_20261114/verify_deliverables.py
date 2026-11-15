from pathlib import Path
from zipfile import ZipFile
from pypdf import PdfReader
import json,re,hashlib
r=Path.cwd();o=r/"output";d=json.loads((r/"work/prevora_20261114/deck_data.json").read_text(encoding="utf-8"))
p=o/"Prevora_Pitch_Final.pptx";z=ZipFile(p)
slides=[x for x in z.namelist() if re.fullmatch(r"ppt/slides/slide\d+\.xml",x)]
notes=[x for x in z.namelist() if re.fullmatch(r"ppt/notesSlides/notesSlide\d+\.xml",x)]
assert len(slides)==9 and len(notes)==9
assert len(PdfReader(o/"Prevora_Pitch_Final.pdf").pages)==9
assert sum(s["seconds"] for s in d["slides"])==180
assert all(n in z.read("ppt/slides/slide8.xml").decode() for n in ["Samuel Paulo","Luan Henrique","Eduardo Hoffmann","Rafael Tumiski"])
assert b"<a:tbl>" in z.read("ppt/slides/slide7.xml")
assert "Safio" not in (o/"Prevora_Pesquisa_Estrutura_e_Roteiro.md").read_text(encoding="utf-8")
assert z.testzip() is None
assert (r/"work/prevora_20261114/build/slide-03.png").is_file()
files=["Prevora_Pitch_Final.pptx","Prevora_Pitch_Final.pdf","Prevora_Pesquisa_Estrutura_e_Roteiro.pdf","Prevora_Pesquisa_Estrutura_e_Roteiro.md"]
manifest={"slide_count":len(slides),"notes_count":len(notes),"report_pages":len(PdfReader(o/files[2]).pages),"time_windows_seconds":180,"script_words":sum(len(s["notes"].split()) for s in d["slides"]),"files":[{"name":n,"bytes":(o/n).stat().st_size,"sha256":hashlib.sha256((o/n).read_bytes()).hexdigest()} for n in files]}
(r/"work/prevora_20261114/build/checks/delivery.json").write_text(json.dumps(manifest,indent=2),encoding="utf-8")
req={"uploads":[{"local_path":str(o/n),"purpose":"create_library_file","library_artifact_type":"slides" if i<2 else "report"} for i,n in enumerate(files)]}
(r/"work/prevora_20261114/upload_request.json").write_text(json.dumps(req),encoding="utf-8")
print(json.dumps(manifest))

