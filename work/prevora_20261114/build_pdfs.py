from pathlib import Path
import re,json,html
from reportlab.pdfgen import canvas
from reportlab.lib import colors
from reportlab.lib.styles import ParagraphStyle
from reportlab.lib.enums import TA_LEFT
from reportlab.lib.pagesizes import A4
from reportlab.platypus import SimpleDocTemplate,Paragraph,Spacer,Table,TableStyle,PageBreak,KeepTogether
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from PIL import Image,ImageDraw
from pypdf import PdfReader
ROOT=Path.cwd();B=ROOT/"work/prevora_20261114/build";O=ROOT/"output"
pdfmetrics.registerFont(TTFont("Segoe",r"C:\Windows\Fonts\segoeui.ttf"))
pdfmetrics.registerFont(TTFont("SegoeBold",r"C:\Windows\Fonts\segoeuib.ttf"))
pdfmetrics.registerFont(TTFont("SegoeSymbol",r"C:\Windows\Fonts\seguisym.ttf"))
pdfmetrics.registerFontFamily("Segoe",normal="Segoe",bold="SegoeBold",italic="Segoe",boldItalic="SegoeBold")
R=colors.HexColor("#C62828");G=colors.HexColor("#008C45");INK=colors.HexColor("#17191D");MUTED=colors.HexColor("#59616D")
styles={
"body":ParagraphStyle("body",fontName="Segoe",fontSize=10.2,leading=14.2,textColor=INK,spaceAfter=7),
"h1":ParagraphStyle("h1",fontName="SegoeBold",fontSize=23,leading=28,textColor=R,spaceAfter=14),
"h2":ParagraphStyle("h2",fontName="SegoeBold",fontSize=16,leading=21,textColor=R,spaceBefore=14,spaceAfter=10,keepWithNext=True),
"h3":ParagraphStyle("h3",fontName="SegoeBold",fontSize=12.2,leading=17,textColor=INK,spaceBefore=11,spaceAfter=7,keepWithNext=True),
"cell":ParagraphStyle("cell",fontName="Segoe",fontSize=8.7,leading=11.7,textColor=INK,spaceAfter=0,wordWrap="CJK"),
"cellhead":ParagraphStyle("cellhead",fontName="SegoeBold",fontSize=9,leading=12,textColor=colors.white,spaceAfter=0),
"link":ParagraphStyle("link",fontName="Segoe",fontSize=8.8,leading=11.8,textColor=MUTED,spaceAfter=6,wordWrap="CJK")
}
def rich(t):
    t=html.escape(t)
    t=t.replace("✓",'<font name="SegoeSymbol">✓</font>')
    return re.sub(r"\*\*(.+?)\*\*",r"<b>\1</b>",t)
def para(t,style="body"):return Paragraph(rich(t),styles[style])
def report():
    md=(O/"Prevora_Pesquisa_Estrutura_e_Roteiro.md").read_text(encoding="utf-8")
    lines=md.splitlines();story=[];i=0;part=0
    while i<len(lines):
        l=lines[i].strip()
        if not l:i+=1;continue
        if l.startswith("|"):
            rows=[]
            while i<len(lines) and lines[i].strip().startswith("|"):
                vals=[x.strip() for x in lines[i].strip().strip("|").split("|")]
                if not all(re.fullmatch(r":?-+:?",v) for v in vals):rows.append(vals)
                i+=1
            n=len(rows[0]);width=499
            if n==5:ws=[147,88,88,88,88]
            elif n==4:ws=[100,159,155,85]
            elif n==3:ws=[125,190,184]
            elif n==2:ws=[176,323]
            else:ws=[width/n]*n
            cells=[[para(v,"cellhead" if ri==0 else "cell") for v in row] for ri,row in enumerate(rows)]
            t=Table(cells,colWidths=ws,repeatRows=1,hAlign="LEFT")
            commands=[("BACKGROUND",(0,0),(-1,0),R),("VALIGN",(0,0),(-1,-1),"TOP"),("LEFTPADDING",(0,0),(-1,-1),7),("RIGHTPADDING",(0,0),(-1,-1),7),("TOPPADDING",(0,0),(-1,-1),7),("BOTTOMPADDING",(0,0),(-1,-1),7),("GRID",(0,0),(-1,-1),0.4,colors.HexColor("#DDDFE4"))]
            for ri in range(1,len(rows)):
                if ri%2==0:commands.append(("BACKGROUND",(0,ri),(-1,ri),colors.HexColor("#F3F4F6")))
            t.setStyle(TableStyle(commands));story+=[t,Spacer(1,9)];continue
        if l.startswith("# "):story.append(para(l[2:],"h1"));i+=1;continue
        if l.startswith("## "):
            if l.startswith("## PARTE"):
                if part and not l.startswith("## PARTE C"):story.append(PageBreak())
                part+=1
            story.append(para(l[3:],"h2"));i+=1;continue
        if l.startswith("### "):story.append(para(l[4:],"h3"));i+=1;continue
        if l.startswith("https://"):
            u=l;story.append(Paragraph('<link href="'+html.escape(u,quote=True)+'" color="#59616D">'+html.escape(u)+'</link>',styles["link"]));i+=1;continue
        if l.startswith("- "):story.append(para("- "+l[2:]));i+=1;continue
        story.append(para(l));i+=1
    path=O/"Prevora_Pesquisa_Estrutura_e_Roteiro.pdf"
    def footer(c,doc):
        c.saveState();c.setStrokeColor(R);c.setLineWidth(0.6);c.line(48,39,547,39)
        c.setFillColor(MUTED);c.setFont("Segoe",8);c.drawString(48,25,"Prevora - preparação do pitch");c.drawRightString(547,25,str(doc.page));c.restoreState()
    doc=SimpleDocTemplate(str(path),pagesize=A4,rightMargin=48,leftMargin=48,topMargin=43,bottomMargin=52,title="Prevora - Pesquisa, estrutura e roteiro",author="Equipe Prevora")
    doc.build(story,onFirstPage=footer,onLaterPages=footer)
    return path
def deck():
    pages=sorted(B.glob("slide-*.png"));assert len(pages)==9,len(pages)
    path=O/"Prevora_Pitch_Final.pdf";c=canvas.Canvas(str(path),pagesize=(1200,675))
    c.setTitle("Prevora - Pitch de 3 minutos");c.setAuthor("Equipe Prevora")
    for p in pages:c.drawImage(str(p),0,0,width=1200,height=675);c.showPage()
    c.save()
    out=Image.new("RGB",(1500,900),"#d6d8dc")
    for i,p in enumerate(pages):
        im=Image.open(p).convert("RGB");im.thumbnail((480,270));out.paste(im,((i%3)*500+10,(i//3)*300+7));ImageDraw.Draw(out).text(((i%3)*500+15,(i//3)*300+279),str(i+1),fill="#17191D")
    out.save(B/"montage.jpg",quality=90)
    return path
if __name__=="__main__":
    r=report();p=deck()
    print(json.dumps({"report":str(r),"report_pages":len(PdfReader(r).pages),"deck":str(p),"deck_pages":len(PdfReader(p).pages)}))

