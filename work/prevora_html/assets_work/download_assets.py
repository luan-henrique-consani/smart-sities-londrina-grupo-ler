from pathlib import Path
import urllib.request,html,re,json,concurrent.futures
from PIL import Image
root=Path.cwd();a=root/"prevora-pitch/assets";w=root/"work/prevora_html/assets_work"
pages=[
("garage.jpg","https://unsplash.com/photos/dark-underground-parking-garage-with-a-car-T2JP5EPciHg","Haberdoedas","Garagem subterrânea ilustrativa"),
("city-rain.jpg","https://unsplash.com/photos/rainy-city-street-and-apartment-buildings-at-twilight-T-lposALNsg","Hanna Lazar","Chuva e ambiente urbano ilustrativos"),
("condominium.jpg","https://unsplash.com/photos/row-of-modern-apartment-buildings-along-a-street-GlT5ZcIlofc","Hongjin Wang","Condomínios ilustrativos"),
("flood-night.jpg","https://unsplash.com/photos/a-city-street-is-flooded-with-water-at-night-fYcCFUzLEIQ",None,"Alagamento urbano ilustrativo; não atribuir a Londrina"),
("technician.jpg","https://unsplash.com/photos/a-man-inspects-equipment-in-a-modern-factory--Wt8AyCr9i4",None,"Manutenção industrial ilustrativa; não é equipe Prevora")
]
def get(url):return urllib.request.urlopen(urllib.request.Request(url,headers={"User-Agent":"Mozilla/5.0"}),timeout=40).read()
def photo(item):
 name,page,author,use=item
 raw=get(page).decode("utf-8");(w/(name+".html")).write_text(raw,encoding="utf-8")
 match=re.search(r'<meta[^>]+property="og:image"[^>]+content="([^"]+)"',raw)
 if not match:match=re.search(r'<meta[^>]+content="([^"]+)"[^>]+property="og:image"',raw)
 if not match:raise ValueError("No image URL "+page)
 url=html.unescape(match.group(1));url=url.split("?")[0]+"?auto=format&fit=max&w=2400&q=88"
 if not author:
  m=re.search(r'<meta[^>]+name="author"[^>]+content="([^"]+)"',raw)
  if not m:m=re.search(r'"display_name":"([^"]+)"',raw)
  if m:author=html.unescape(m.group(1))
 data=get(url);p=a/"images"/name;p.write_bytes(data)
 im=Image.open(p)
 return {"file":"images/"+name,"author":author,"source_page":page,"original_url":url,"license":"Unsplash License","license_url":"https://unsplash.com/license","use":use,"dimensions":im.size,"bytes":len(data),"verified_free":("Free to use under" in raw and "Unsplash License" in raw)}
results=[]
with concurrent.futures.ThreadPoolExecutor(max_workers=5) as ex:
 for f in concurrent.futures.as_completed([ex.submit(photo,x) for x in pages]):
  try:results.append(f.result());print(results[-1]["file"],results[-1]["dimensions"],flush=True)
  except Exception as e:print("ERROR",str(e),flush=True)
(a/"assets.json").write_text(json.dumps({"images":results,"notice":"Todas as fotografias são ilustrativas, não registros do caso local, protótipo ou equipe Prevora."},ensure_ascii=False,indent=2),encoding="utf-8")
fonts=[
("SpaceGrotesk-Variable.ttf","https://raw.githubusercontent.com/google/fonts/main/ofl/spacegrotesk/SpaceGrotesk%5Bwght%5D.ttf"),
("Michroma-OFL.txt","https://raw.githubusercontent.com/google/fonts/main/ofl/michroma/OFL.txt"),
("SpaceGrotesk-OFL.txt","https://raw.githubusercontent.com/google/fonts/main/ofl/spacegrotesk/OFL.txt")
]
for name,url in fonts:
 try:data=get(url);(a/"fonts"/name).write_bytes(data);print(name,len(data),flush=True)
 except Exception as e:print("FONT ERROR",name,str(e),flush=True)

