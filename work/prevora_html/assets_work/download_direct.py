from pathlib import Path
from concurrent.futures import ThreadPoolExecutor,as_completed
import urllib.request,json
from PIL import Image
r=Path.cwd();a=r/"prevora-pitch/assets"
rows=[
("garage.jpg","https://images.unsplash.com/photo-1771931108145-f961735d24dc","Haberdoedas","https://unsplash.com/photos/dark-underground-parking-garage-with-a-car-T2JP5EPciHg","Garagem seca subterrânea, imagem ilustrativa"),
("city-rain.jpg","https://images.unsplash.com/photo-1782811559676-8ee18bc9312c","Hanna Lazar","https://unsplash.com/photos/rainy-city-street-and-apartment-buildings-at-twilight-T-lposALNsg","Chuva e ambiente urbano ilustrativos"),
("condominium.jpg","https://images.unsplash.com/photo-1773741106710-0ad118f18933","Hongjin Wang","https://unsplash.com/photos/row-of-modern-apartment-buildings-along-a-street-GlT5ZcIlofc","Arquitetura residencial ilustrativa"),
("flood-night.jpg","https://images.unsplash.com/photo-1576749288264-207936efb479","Ulvi Safari","https://unsplash.com/photos/a-city-street-is-flooded-with-water-at-night-fYcCFUzLEIQ","Rua alagada noturna ilustrativa, não é o caso de Londrina"),
("technician.jpg","https://images.unsplash.com/photo-1748347084012-075796185d56","TECNIC Bioprocess Solutions","https://unsplash.com/photos/a-man-inspects-equipment-in-a-modern-factory--Wt8AyCr9i4","Técnico de manutenção ilustrativo; não é integrante da equipe Prevora"),
("pump-room.jpg","https://upload.wikimedia.org/wikipedia/commons/9/90/Tumon-Maui_Well_10.jpg","David Franzen","https://commons.wikimedia.org/wiki/File:Tumon-Maui_Well_10.jpg","Sala de bombas ilustrativa em Guam; não é instalação do Prevora")
]
def run(row):
 name,url,author,page,use=row
 if "unsplash" in url:url+="?auto=format&fit=max&w=2600&q=88"
 req=urllib.request.Request(url,headers={"User-Agent":"Mozilla/5.0"})
 data=urllib.request.urlopen(req,timeout=45).read();p=a/"images"/name;p.write_bytes(data);im=Image.open(p)
 item={"file":"images/"+name,"author":author,"source_page":page,"original_url":url,"license":"Unsplash License" if "unsplash" in url else "Public domain (U.S. federal government/DOI work)","license_url":"https://unsplash.com/license" if "unsplash" in url else "https://commons.wikimedia.org/wiki/File:Tumon-Maui_Well_10.jpg#Licensing","use":use,"dimensions":im.size,"bytes":len(data)}
 print(name,im.size,len(data),flush=True);return item
out=[]
with ThreadPoolExecutor(max_workers=6) as ex:
 for f in as_completed([ex.submit(run,row) for row in rows]):
  try:out.append(f.result())
  except Exception as e:print("ERROR",str(e),flush=True)
fontbase="https://raw.githubusercontent.com/google/fonts/main/ofl/"
fonts=[{"file":"fonts/Michroma-Regular.ttf","family":"Michroma","author":"Vernon Adams / Michroma Project Authors","source":fontbase+"michroma/Michroma-Regular.ttf","license":"SIL Open Font License 1.1","license_file":"fonts/Michroma-OFL.txt"},{"file":"fonts/SpaceGrotesk-Variable.ttf","family":"Space Grotesk","author":"Florian Karsten","source":fontbase+"spacegrotesk/SpaceGrotesk%5Bwght%5D.ttf","license":"SIL Open Font License 1.1","license_file":"fonts/SpaceGrotesk-OFL.txt"}]
(a/"assets.json").write_text(json.dumps({"images":out,"fonts":fonts,"notice":"Fotografias de banco ilustrativas. Não representam o caso de Londrina, o MVP ou os integrantes do Prevora. Tratamentos cromáticos e recortes são de apresentação, via CSS."},ensure_ascii=False,indent=2),encoding="utf-8")

