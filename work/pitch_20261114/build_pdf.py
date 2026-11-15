from pathlib import Path
from reportlab.pdfgen import canvas
from reportlab.lib.utils import ImageReader
from PIL import Image, ImageOps, ImageDraw
import json
root=Path.cwd()
build=root/"work/pitch_20261114/build"
pages=sorted(build.glob("slide-*.png"))
assert len(pages)==16, len(pages)
target=root/"output/Safio_Pitch_B2G_B2B.pdf"
c=canvas.Canvas(str(target),pagesize=(1200,675))
c.setTitle("Safio - Pitch B2G e B2B")
c.setAuthor("Equipe Smart Cities 2026")
for p in pages:
    c.drawImage(str(p),0,0,width=1200,height=675)
    c.showPage()
c.save()
thumbs=[]
for i,p in enumerate(pages):
    im=Image.open(p).convert("RGB")
    im.thumbnail((480,270))
    tile=Image.new("RGB",(500,300),"#dce6e3")
    tile.paste(im,((500-im.width)//2,8))
    ImageDraw.Draw(tile).text((14,281),f"Slide {i+1}",fill="#112c35")
    thumbs.append(tile)
sheet=Image.new("RGB",(2000,1200),"#c7d9d3")
for i,im in enumerate(thumbs):
    sheet.paste(im,((i%4)*500,(i//4)*300))
sheet.save(build/"montage.jpg",quality=90)
print(json.dumps({"pdf":str(target),"pages":len(pages),"montage":str(build/"montage.jpg")}))

