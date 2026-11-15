/* Buildless deck: open index.html directly, no remote requests. */
(() => {
  "use strict";
  const C=window.PREVORA_CONTENT;
  if(!C) throw new Error("O conteúdo da apresentação não foi carregado.");
  const deck=document.querySelector("#deck");
  const esc=value=>String(value??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
  const br=value=>esc(value).replace(/\n/g,"<br>");
  const paths={
    sensor:'<path d="M6 8h20v16H6zM10 5v3m6-3v3m6-3v3M10 24v3m6-3v3m6-3v3M3 12h3m-3 8h3m20-8h3m-3 8h3"/><path d="M11 16h10m-8-4v8m6-8v8"/>',
    signal:'<path d="M5 25h22M8 21v-4m7 4V9m7 12V5"/><path d="m4 11 5 2 6-7 7 3 6-6"/>',
    bell:'<path d="M8 22h16l-3-5v-5a5 5 0 0 0-10 0v5zM13 25a3 3 0 0 0 6 0M16 3v3"/>',
    check:'<path d="M7 5h18v23H7zM12 5V3h8v2M11 16l3 3 7-8M11 24h10"/>',
    install:'<path d="M5 15v13h22V15M2 15 16 4l14 11M12 28v-9h8v9M7 7V4h5"/>',
    cloud:'<path d="M8 23a6 6 0 0 1-1-12 9 9 0 0 1 17-2 7 7 0 0 1 0 14zM11 28h10M16 23v5"/>',
    tool:'<path d="m10 22 12-12M20 3a8 8 0 0 0-9 10L3 24a3 3 0 0 0 5 5l10-11a8 8 0 0 0 11-10l-6 5-5-5z"/>'
  };
  const icon=name=>'<svg viewBox="0 0 32 32" aria-hidden="true">'+paths[name]+'</svg>';
  const badge=()=>'<div class="brand-badge"><span class="brand-symbol"><img src="assets/brand/prevora-logo.png" alt=""></span><span>Prevora</span></div>';
  const footer=(text,n,extra="")=>'<p class="slide-foot '+extra+'">'+esc(text)+'</p><span class="slide-number">'+String(n).padStart(2,"0")+' / 09</span>';
  const photo=(src,cls,alt)=>'<figure class="photo '+cls+'"><img src="'+esc(src)+'" alt="'+esc(alt)+'" decoding="sync"></figure>';
  const tag=(text,cls)=>'<div class="tag '+cls+'"><span>'+br(text)+'</span></div>';
  const title=(text,cls)=>'<h2 class="title '+cls+'">'+br(text)+'</h2>';
  const section=(n,cls,html)=>'<section class="slide '+cls+'" id="slide-'+n+'" data-slide="'+n+'" role="group" aria-roledescription="slide" aria-label="'+n+' de 9 — '+esc(C.slides[n-1].title)+'" aria-hidden="true" inert>'+html+'</section>';
  function cover(){const c=C.copy.cover;return section(1,"slide-cover",
    photo(c.photo,"cover-photo","Rua alagada à noite, fotografia ilustrativa de banco de imagens")+'<img class="cover-print-background" src="assets/images/cover-print.png" alt="">'+
    '<p class="pos eyebrow cover-kicker reveal">'+esc(c.kicker)+'</p>'+
    '<h1 class="title cover-title reveal" style="--delay:70ms">'+esc(c.title)+'</h1>'+
    '<div class="pos rule cover-rule"></div><p class="pos cover-line reveal" style="--delay:140ms">'+br(c.headline)+'</p>'+
    '<p class="pos cover-temporal reveal" style="--delay:210ms">'+br(c.temporal)+'</p>'+
    tag(C.meta.event,"cover-stamp")+'<p class="photo-credit cover-credit">'+esc(c.photoCredit)+'</p>'+
    footer("B2B + B2G / MONITORAMENTO E APOIO À DECISÃO",1,"cover-foot"));}
  function solution(){const c=C.copy.solution;return section(2,"slide-solution",
    photo(c.photo,"solution-photo slant","Sala de bombas ilustrativa; não representa o protótipo Prevora")+
    tag(c.label,"solution-photo-label")+badge()+
    '<p class="pos eyebrow solution-intro">'+esc(c.eyebrow)+'</p>'+
    '<p class="pos solution-benefit reveal">'+br(c.benefit)+'</p>'+
    '<div class="solution-flow">'+c.steps.map((s,i)=>'<div class="flow-step reveal" style="--delay:'+i*65+'ms">'+icon(s.icon)+'<p class="flow-label">'+esc(s.title)+'</p><p class="flow-detail">'+esc(s.detail)+'</p></div>').join("")+'</div>'+
    '<div class="solution-status reveal" style="--delay:200ms"><div><b class="red-text">'+esc(c.currentTitle)+'</b><p>'+esc(c.current)+'</p></div><div><b class="green-text">'+esc(c.futureTitle)+'</b><p>'+esc(c.future)+'</p></div></div>'+
    '<p class="photo-credit solution-credit">'+esc(c.photoCredit)+'</p>'+
    title(c.title,"solution-title")+footer(c.foot,2,"solution-foot"));}
  function problem(){const c=C.copy.problem;return section(3,"slide-problem",
    photo(c.photo,"problem-photo slant","Foto ilustrativa de garagem alagada em Miami Beach em 2016, de B137. Não é o caso de Londrina.")+
    title(c.title,"problem-title")+badge()+
    '<p class="pos eyebrow problem-question reveal">'+esc(c.question)+'</p>'+
    '<p class="pos large-number problem-number reveal">'+esc(c.number)+'</p>'+
    '<p class="pos problem-number-label">'+br(c.numberLabel)+'</p>'+
    '<div class="pos problem-case reveal" style="--delay:90ms"><p>'+esc(c.case)+'</p><p class="muted">'+esc(c.consequence)+'</p></div>'+
    '<p class="photo-credit problem-credit">'+br(c.photoCredit)+'</p>'+
    '<p class="pos problem-cost red-text">'+esc(c.cost)+'</p>'+footer(c.foot,3,"problem-foot"));}
  function validation(){const c=C.copy.validation;return section(4,"slide-validation",
    title(c.title,"validation-title")+
    '<p class="pos large-number validation-number reveal">'+esc(c.number)+'</p><p class="pos validation-number-caption">'+br(c.numberLabel)+'</p>'+
    photo(c.photo,"validation-photo slant","Prédios residenciais ilustrativos; não são clientes da Prevora")+
    tag(c.label,"validation-priority")+
    '<p class="pos validation-evidence reveal" style="--delay:90ms">'+br(c.evidence)+'</p>'+
    '<div class="pos validation-tests reveal" style="--delay:140ms"><p class="eyebrow">'+esc(c.testTitle)+'</p><p>'+br(c.test)+'</p></div>'+
    '<p class="photo-credit validation-credit">'+esc(c.photoCredit)+'</p>'+footer(c.foot,4,"validation-foot"));}
  function subscriptionVisual(){return '<div class="photo slant commercial-image subscription-visual"><span class="subscription-note">REPRESENTAÇÃO CONCEITUAL</span><svg viewBox="0 0 400 260" role="img" aria-label="Diagrama conceitual de um ponto ligado ao responsável, sem medições"><g fill="none" stroke="#e5d6db" stroke-width="1.7"><rect x="60" y="45" width="280" height="158" rx="3"/><path d="M160 226h80M200 203v23M105 112h69m52 0h69"/></g><g fill="#c62828"><circle cx="100" cy="112" r="9"/><circle cx="200" cy="112" r="14"/></g><circle cx="300" cy="112" r="9" fill="#008c45"/><g fill="#ccc1c6" font-family="Space Grotesk,Arial" font-size="19" text-anchor="middle"><text x="102" y="156">Ponto</text><text x="298" y="156">Responsável</text></g></svg></div>';}
  function business(){const c=C.copy.business;return section(5,"slide-business",
    title(c.title,"business-title")+badge()+'<p class="pos business-lead">'+esc(c.lead)+'</p>'+
    c.cards.map((v,i)=>'<article class="commercial-card '+["card-install","card-subscription","card-maintenance"][i]+' reveal" style="--delay:'+i*75+'ms">'+
      (v.photo?photo(v.photo,"slant commercial-image",i===0?"Garagem seca ilustrativa":"Técnico ilustrativo, sem vínculo com a equipe Prevora"):subscriptionVisual())+
      '<div class="tag '+(i===1?"red-tag":"")+'"><span>'+icon(v.icon)+esc(v.title)+'</span></div>'+
      '<p class="description">'+br(v.description)+'</p></article>').join("")+
    footer(c.foot,5,"business-foot"));}
  function market(){const c=C.copy.market;return section(6,"slide-market",title(c.title,"market-title")+badge()+
    '<p class="pos market-subtitle reveal">'+br(c.subtitle)+'</p>'+
    '<div class="pos market-rules reveal" style="--delay:90ms">'+c.rules.map(v=>'<p>'+br(v)+'</p>').join("")+'</div>'+
    '<p class="pos market-formula">'+br(c.formula)+'</p>'+
    '<svg class="market-diagram" viewBox="0 0 720 720" role="img" aria-label="TAM, SAM e SOM aninhados. TAM: cerca de 327 mil condomínios no Brasil; SAM: até cerca de dois mil em Londrina, antes da qualificação; SOM: meta de cinco clientes em doze meses. Áreas sem escala.">'+
    '<circle class="market-ring" cx="360" cy="360" r="330"/><circle class="market-ring ring-mid" cx="360" cy="450" r="240"/><circle class="market-ring ring-inner" cx="360" cy="570" r="120"/>'+
    '<text class="market-label" x="360" y="86">'+esc(c.tam.label)+'</text><text class="market-value" x="360" y="152">'+esc(c.tam.value)+'</text><text class="market-detail" x="360" y="190">'+esc(c.tam.detail)+'</text>'+
    '<text class="market-label" x="360" y="267">'+esc(c.sam.label)+'</text><text class="market-value" x="360" y="328">'+esc(c.sam.value)+'</text><text class="market-detail" x="360" y="370">'+esc(c.sam.detail)+'</text>'+
    '<text class="market-label" x="360" y="516">'+esc(c.som.label)+'</text><text class="market-value" style="font-size:34px;letter-spacing:-2px" x="360" y="574">'+esc(c.som.value)+'</text><text class="market-detail" style="font-size:20px" x="360" y="616">'+esc(c.som.detail)+'</text></svg>'+
    footer(c.foot,6,"market-foot"));}
  function competition(){const c=C.copy.competition;const val=v=>v==='✓'?'<span class="check" aria-label="Oferta declarada">✓</span>':v==='Não verificado'?'<span class="nv" aria-label="Não confirmado nas fontes">?</span>':v==='Planejado'?'<span class="state-symbol planned" aria-label="Planejado">P</span>':v==='Demo'?'<span class="state-symbol demo" aria-label="Demonstrado no protótipo">D</span>':esc(v);
    return section(7,"slide-competition",badge()+'<p class="pos competition-kicker">'+esc(c.kicker)+'</p>'+
      '<div class="competition-table-frame"><table class="competition-table"><caption>Comparação entre Prevora e três alternativas existentes. Planejado não significa implementado.</caption><thead><tr>'+
      c.headers.map((v,i)=>'<th scope="col" class="'+(i===1?"prevora-col":"")+'">'+esc(v)+'</th>').join("")+'</tr></thead><tbody>'+
      c.rows.map(row=>'<tr>'+row.map((v,i)=>'<'+(i===0?"th scope=\"row\"":"td")+' class="'+(i===1?"prevora-col":"")+'">'+val(v)+'</'+(i===0?"th":"td")+'>').join("")+'</tr>').join("")+'</tbody></table></div>'+
      '<div class="pos competition-legend"><div class="legend-items">'+c.legendItems.map(v=>'<span class="legend-item"><b class="legend-mark '+esc(v.style)+'">'+esc(v.symbol)+'</b><span>'+esc(v.label)+'</span></span>').join('')+'</div><p class="legend-note">'+esc(c.legendNote)+'</p></div>'+title(c.title,"competition-title")+footer(c.foot,7,"competition-foot"));}
  function team(){const c=C.copy.team;return section(8,"slide-team",title(c.title,"team-title")+
    '<div class="team-grid">'+c.members.map(m=>'<article class="team-member"><div class="portrait-placeholder slant">'+
      (m.photo?'<img src="'+esc(m.photo)+'" alt="'+esc(m.name)+'">':'<span class="initials" aria-hidden="true">'+esc(m.initials)+'</span><span class="photo-placeholder-label">FOTO A INSERIR</span>')+
      '</div>'+tag(m.name,"")+'<div class="team-fields"><p>'+br(m.role)+'</p><p>'+br(m.bio)+'</p><p>'+br(m.contribution)+'</p></div></article>').join("")+'</div>'+footer(c.foot,8,"team-foot"));}
  function roadmap(){const c=C.copy.roadmap;return section(9,"slide-roadmap",photo(c.photo,"roadmap-photo slant","Cidade em dia de chuva, fotografia ilustrativa")+
    badge()+'<div class="pos closing-invitation"><p class="eyebrow green-text">CONSTRUA COM A PREVORA</p><h3>'+br(c.invitation)+'</h3><p class="closing-body">'+br(c.invitationBody)+'</p></div>'+
    tag(c.cta,"roadmap-cta")+'<p class="photo-credit roadmap-credit">'+esc(c.photoCredit)+'</p>'+
    title(c.title,"roadmap-title")+'<p class="pos roadmap-contact">'+esc(C.meta.contact||"Contato da equipe: a preencher")+'</p>'+footer(c.foot,9,"roadmap-foot"));}
  const renderers=[cover,solution,problem,validation,business,market,competition,team,roadmap];
  deck.innerHTML=renderers.map(fn=>fn()).join("");
  const slides=[...deck.querySelectorAll(".slide")];
  let current=0,skipClickUntil=0;
  const notes=document.querySelector("#notes"),help=document.querySelector("#help");
  function updateNotes(){
    const s=C.slides[current];
    document.querySelector("#notes-title").textContent=String(current+1).padStart(2,"0")+" — "+s.title;
    document.querySelector("#notes-time").textContent="Janela sugerida: "+s.seconds+" segundos, incluindo transição. Total do pitch: 180 segundos.";
    document.querySelector("#notes-script").textContent=s.notes;
    document.querySelector("#notes-sources").innerHTML=s.refs.length?s.refs.map(id=>{
      const r=C.sources.find(x=>x.id===id);return r?'<article class="source-entry"><b>'+esc(r.org)+" — "+esc(r.title)+'</b><p>'+esc(r.year)+'</p><a href="'+esc(r.url)+'" target="_blank" rel="noopener">'+esc(r.url)+'</a><p>'+esc(r.limit)+'</p></article>':"";
    }).join(""):'<p class="source-entry">Informações fornecidas pela equipe e planejamento proposto. Não há resultados operacionais comprovados nesta seção.</p>';
  }
  function goTo(index,{hash=true}={}){
    const nextIndex=Math.max(0,Math.min(slides.length-1,Number(index)||0));
    slides.forEach((el,i)=>{const active=i===nextIndex;el.classList.toggle("is-active",active);el.inert=!active;el.setAttribute("aria-hidden",String(!active));});
    current=nextIndex;
    document.querySelector("#counter").textContent=String(current+1).padStart(2,"0")+" / 09";
    document.querySelector("#previous").disabled=current===0;document.querySelector("#next").disabled=current===8;
    document.title="PREVORA — "+String(current+1)+"/9 — "+C.slides[current].title;
    document.querySelector("#announcement").textContent="Slide "+(current+1)+" de 9. "+C.slides[current].title;
    if(hash&&location.hash!=="#slide="+(current+1))history.replaceState(null,"","#slide="+(current+1));
    updateNotes();return current;
  }
  const next=()=>goTo(current+1),previous=()=>goTo(current-1);
  function resize(){document.documentElement.style.setProperty("--scale",Math.min(innerWidth/1920,innerHeight/1080));}
  function closeDialogs(){[notes,help].forEach(d=>{if(d.open)d.close();});}
  async function fullscreen(){
    try{if(document.fullscreenElement)await document.exitFullscreen();else await document.documentElement.requestFullscreen();}
    catch{document.querySelector("#announcement").textContent="Tela cheia indisponível. Use F11 no navegador.";}
  }
  function openNotes(){closeDialogs();updateNotes();notes.showModal();}
  function print(){closeDialogs();window.print();}
  document.querySelector("#previous").addEventListener("click",previous);document.querySelector("#next").addEventListener("click",next);
  document.querySelector("#fullscreen").addEventListener("click",fullscreen);document.querySelector("#notes-button").addEventListener("click",openNotes);
  document.querySelector("#print-button").addEventListener("click",print);document.querySelector("#help-button").addEventListener("click",()=>{closeDialogs();help.showModal();});
  document.querySelectorAll("[data-close]").forEach(b=>b.addEventListener("click",()=>document.getElementById(b.dataset.close).close()));
  document.addEventListener("keydown",event=>{
    if(notes.open||help.open||event.ctrlKey||event.metaKey||event.altKey)return;
    if(event.target.matches("input,textarea,select,[contenteditable]"))return;
    switch(event.key){
      case "ArrowRight":case "ArrowDown":case "PageDown":case " ":event.preventDefault();next();break;
      case "ArrowLeft":case "ArrowUp":case "PageUp":event.preventDefault();previous();break;
      case "Home":event.preventDefault();goTo(0);break;case "End":event.preventDefault();goTo(8);break;
      case "f":case "F":event.preventDefault();fullscreen();break;
      case "n":case "N":event.preventDefault();openNotes();break;
      case "p":case "P":event.preventDefault();print();break;
      case "h":case "H":document.body.classList.toggle("ui-hidden");break;
      case "?":event.preventDefault();closeDialogs();help.showModal();break;
    }
  });
  deck.addEventListener("click",event=>{
    if(performance.now()<skipClickUntil||event.target.closest("button,a,input"))return;
    const box=deck.getBoundingClientRect();event.clientX<box.left+box.width*.5?previous():next();
  });
  let startX=null;
  deck.addEventListener("touchstart",event=>{startX=event.touches.length===1?event.touches[0].clientX:null;},{passive:true});
  deck.addEventListener("touchend",event=>{if(startX===null)return;const dx=event.changedTouches[0].clientX-startX;startX=null;if(Math.abs(dx)>50){skipClickUntil=performance.now()+500;dx<0?next():previous();}},{passive:true});
  addEventListener("resize",resize);addEventListener("fullscreenchange",()=>{resize();document.querySelector("#fullscreen").textContent=document.fullscreenElement?"Sair da tela cheia":"Tela cheia";});
  addEventListener("hashchange",()=>{const m=location.hash.match(/slide=(\d+)/);if(m)goTo(Number(m[1])-1,{hash:false});});
  resize();const initial=location.hash.match(/slide=(\d+)/);goTo(initial?Number(initial[1])-1:0);
  window.prevoraDeck={goTo,next,previous,get current(){return current;},get count(){return slides.length;},content:C,print,fullscreen};
  window.prevoraReady=Promise.all([document.fonts.ready,...[...deck.querySelectorAll("img")].map(img=>img.complete?Promise.resolve():new Promise(resolve=>{img.addEventListener("load",resolve,{once:true});img.addEventListener("error",resolve,{once:true});}))]).then(()=>{document.documentElement.dataset.ready="true";});
})();
