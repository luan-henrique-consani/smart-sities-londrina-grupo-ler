from pathlib import Path
import json, shutil, zipfile
from pypdf import PdfReader

root=Path.cwd()
project=root/'prevora-pitch'
out=root/'output'
out.mkdir(exist_ok=True)
(project/'previews').mkdir(exist_ok=True)
for image in sorted((root/'work/prevora_html/screenshots').glob('slide-*.png')):
    shutil.copy2(image,project/'previews'/image.name)
assert len(list((project/'previews').glob('slide-*.png')))==9
shutil.copy2(project/'ROTEIRO.md',out/'Prevora_Roteiro.md')
pdf=PdfReader(out/'Prevora_Cinematico.pdf')
assert len(pdf.pages)==9
assert all(abs(float(p.mediabox.width)/float(p.mediabox.height)-16/9)<0.001 for p in pdf.pages)
assert all(len(p.extract_text())>100 for p in pdf.pages)
qa=json.loads((root/'work/prevora_html/qa-layout.json').read_text(encoding='utf-8'))
assert not qa['errors'] and not qa['failed']
assert all(not s['issues'] for s in qa['slides'])
checks=json.loads((root/'work/prevora_html/interaction-checks.json').read_text(encoding='utf-8'))
assert all(c['passed'] for c in checks['checks'])
archive=out/'Prevora_Projeto_Completo.zip'
with zipfile.ZipFile(archive,'w',zipfile.ZIP_DEFLATED,compresslevel=6) as z:
    for p in sorted(project.rglob('*')):
        if p.is_file() and not any(s in p.parts for s in ['node_modules','.git']):
            z.write(p,p.relative_to(root).as_posix())
with zipfile.ZipFile(archive) as z:
    assert z.testzip() is None
    assert 'prevora-pitch/index.html' in z.namelist()
    assert len([n for n in z.namelist() if n.startswith('prevora-pitch/previews/')])==9
    count=len(z.infolist())
names=['Prevora_Apresentacao.html','Prevora_Cinematico.pdf','Prevora_Projeto_Completo.zip','Prevora_Roteiro.md']
uploads=[{'local_path':str(out/n),'purpose':'create_library_file','library_artifact_type':'slides' if n.endswith(('.html','.pdf')) else 'report' if n.endswith('.md') else 'other'} for n in names]
(root/'work/prevora_html/upload-request.json').write_text(json.dumps({'uploads':uploads}),encoding='utf-8')
print(json.dumps({'files':[{'name':n,'bytes':(out/n).stat().st_size} for n in names],'archive_entries':count,'pdf_pages':9,'checks':len(checks['checks'])}))
