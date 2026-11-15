import pdfplumber
with pdfplumber.open('output/Prevora_Cinematico.pdf') as p:
 for i in [0,6,8]:
  page=p.pages[i]
  print(i+1,page.width,page.height,[(w['text'],round(w['x0'],1),round(w['x1'],1)) for w in page.extract_words() if w['top']>750 and w['x0']>1200])
