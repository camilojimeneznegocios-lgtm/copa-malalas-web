(function(){
"use strict";
var TOP='<title>Copa Malala\'s 2026</title>\n<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Big+Shoulders+Display:wght@600;800;900&family=Manrope:wght@400;500;600;700;800&display=swap">\n<script src="https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js"><\/script>\n';
var SHELL='<div id="app"><div class="hero"><div class="wrap"><div class="eyebrow">Supercopa de la No Violencia · Edición 2</div><h1>Copa <em>Malala\'s</em> 2026</h1><p class="motto">Cargando tablas…</p></div></div></div>';
var RESET=':root{color-scheme:light;padding-top:env(safe-area-inset-top,0px);padding-bottom:env(safe-area-inset-bottom,0px)}body{margin:0;font:14px system-ui,-apple-system,sans-serif}img{max-width:100%}[hidden]{display:none!important}';
var LOGO='assets/logo.png';
var JL_POS=[{k:'puntual',l:'Llegó puntual a la hora del partido',v:3},{k:'sinTarjetas',l:'Partido sin recibir tarjetas',v:3},{k:'sinFaltas',l:'Partido sin faltas antideportivas',v:1},{k:'ayuda',l:'Ayudó a la rival lesionada (tarjeta naranja)',v:1}];
var JL_NEG=[{k:'segAmarilla',l:'Segunda amarilla en el mismo partido',v:-1},{k:'espinilleras',l:'No uso de espinilleras',v:-1},{k:'taches',l:'Guayos con taches (solo fútbol 7)',v:-1},{k:'rojaDoble',l:'Roja por doble amarilla',v:-3},{k:'rojaDirecta',l:'Tarjeta roja directa',v:-5},{k:'expCT',l:'Expulsión de miembro del cuerpo técnico',v:-5},{k:'conducta',l:'Conducta antideportiva grave',v:-5},{k:'irrespetoJueza',l:'Irrespeto verbal a la jueza',v:-5},{k:'agrVerbalRival',l:'Agresión verbal a rivales',v:-5},{k:'agrVerbalOrg',l:'Agresión verbal a organización o staff',v:-5},{k:'agresion',l:'Agresión física o intento de agresión',v:-10},{k:'abandono',l:'Abandono injustificado del partido o W',v:-10}];
var VENUES=['Unidad Deportiva de Belén','María Luisa Calle','Campo Amor','La Floresta','Las Playas','Cristo Rey','Belén Rincón'];
var MONTHS=['ene','feb','mar','abr','may','jun','jul','ago','sep','oct','nov','dic'];
var ICON_DL='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 3v12M7 10l5 5 5-5M4 20h16"/></svg>';

var ORIG=window.TORNEO;
var S=clone(ORIG);
var changes=[];
var ui={cat:'f7',view:'pos',f2m:'draw',group:'all',gen:{sort:null,dir:-1,filter:'all'},m:{group:'all',round:'all',status:'all',q:''},sc:{q:'',team:''},edit:false};
var STANDALONE=!(window.claude&&window.claude.use),NUBE=STANDALONE?window.NUBE||null:null,ADMIN=STANDALONE&&(window.MODO_ADMIN===true||(!NUBE&&/[?&]admin\b/.test(location.search)));
var canWrite=false,artifactApi=null,dlApi=null,modal=null,draft=null,animate=true,expState=null;

try{var d=JSON.parse(sessionStorage.getItem('malalas-draft')||'null');if(d&&d.rev===(ORIG.rev||0)&&d.changes&&d.changes.length){S=d.state;changes=d.changes;ui.edit=true;}}catch(e){}
try{var u=JSON.parse(localStorage.getItem('malalas-ui')||'null');if(u){if(S.cats[u.cat])ui.cat=u.cat;ui.view=u.view||ui.view;}}catch(e){}
if(/^#(pos|gen|f2|ko|par|gol|val|jl|est|nov|doc)$/.test(location.hash))ui.view=location.hash.slice(1);
if(/^#(f7|f11|sub14)$/.test(location.hash))ui.cat=location.hash.slice(1);

function clone(o){return JSON.parse(JSON.stringify(o));}
function esc(s){return String(s==null?'':s).replace(/[&<>"']/g,function(c){return{'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c];});}
function cat(){return S.cats[ui.cat];}
function multi(c){return c.groups.length>1;}
function glabel(c,g){return (c.groupLabels&&c.groupLabels[g])||('Grupo '+g);}
function teamMap(c){var m={};c.teams.forEach(function(t){m[t.id]=t;});return m;}
function tname(c,id){var t=teamMap(c)[id];return t?t.name:id;}
function fmtDate(s){if(!s)return '';var p=s.split('-');return (+p[2])+' '+MONTHS[+p[1]-1];}
function fmtLong(s){if(!s)return '';var p=s.split('-');return (+p[2])+' de '+['enero','febrero','marzo','abril','mayo','junio','julio','agosto','septiembre','octubre','noviembre','diciembre'][+p[1]-1]+' de '+p[0];}
function saveUi(){try{localStorage.setItem('malalas-ui',JSON.stringify({cat:ui.cat,view:ui.view}));}catch(e){}}
function persistDraft(){try{if(changes.length)sessionStorage.setItem('malalas-draft',JSON.stringify({rev:ORIG.rev||0,state:S,changes:changes}));else sessionStorage.removeItem('malalas-draft');}catch(e){}}
function title(s){return String(s).toLowerCase().replace(/(^|\s|\.)(\S)/g,function(a,b,c){return b+c.toUpperCase();});}
function pct(a,b){return b?Math.round(a/b*100):0;}

function jlTotal(j){if(!j)return null;if(!j.items){return (j.manual==null||j.manual==='')?null:+j.manual;}var t=0;JL_POS.forEach(function(p){if(j.items[p.k])t+=p.v;});JL_NEG.forEach(function(n){t+=(+j.items[n.k]||0)*n.v;});return t+(+j.adj||0);}
function jlClass(v,pj){if(v==null)return '';var avg=pj?v/pj:v;if(avg<0)return 'neg';if(avg<6)return 'low';return '';}
function mKey(m){return (m.phase==='eliminatoria'?200:m.phase==='intergrupos'?100:0)+(+m.round||0);}
function hasInter(c){return !!c.interTotal&&multi(c);}
function roundKey(m){return (m.phase==='eliminatoria'?'E':m.phase==='intergrupos'?'I':'')+m.round;}
function roundLabel(k){return k.charAt(0)==='E'?KO_NAMES[+k.slice(1)-1]:k.charAt(0)==='I'?'Fase 2 · fecha '+k.slice(1):'Fecha '+k;}
function stageLabel(c,m){if(m.phase==='eliminatoria')return KO_NAMES[m.round-1]+(m.ko?' · '+m.ko:'');if(m.phase==='intergrupos')return 'Fase 2'+(m.interGroup?' · Grupo '+m.interGroup:'')+' · Fecha '+m.round;return glabel(c,m.group)+' · Fecha '+m.round;}
function today(){var n=new Date();return n.getFullYear()+'-'+String(n.getMonth()+1).padStart(2,'0')+'-'+String(n.getDate()).padStart(2,'0');}
/* Fase intergrupos: 4 bombos por reclasificación, 8 grupos de 4, sin repetir grupo de la fase 1 */
var P2=[['A1','B3','C5','D7'],['B2','D3','A5','C7'],['C1','A3','D5','B7'],['D2','C3','A6','B8'],['A2','D4','B5','C8'],['B1','A4','C6','D8'],['C2','B4','D6','A7'],['D1','C4','B6','A8']];
var METHODS={draw:'Propuesta 3 · sorteo en vivo',snake:'Propuesta 1 · reclasificación en serpentina',direct:'Propuesta 1 · reclasificación directa',pos:'Propuesta 2 · posición en el grupo'};
function interPlan(c,method){
  if(method==='pos'){
    var rk={};allRows(c).forEach(function(r,i){rk[r.id]=i+1;});var gr={};c.groups.forEach(function(g){gr[g]=groupRows(c,g);});
    var okp=true,gsp=P2.map(function(row,gi){return {id:gi+1,teams:row.map(function(code,p){var r=(gr[code.charAt(0)]||[])[+code.slice(1)-1];if(!r){okp=false;return null;}return {id:r.id,rank:rk[r.id],pot:p+1,orig:code.charAt(0),tag:code};})};});
    return {ok:okp,groups:okp?gsp:[],method:'pos'};
  }
  var rows=allRows(c),G=rows.length/4;if(G!==Math.floor(G)||G<2)return {ok:false,groups:[]};
  var gs=[];for(var i=0;i<G;i++)gs.push({id:i+1,teams:[]});
  var gpos={};c.groups.forEach(function(g){groupRows(c,g).forEach(function(r,i){gpos[r.id]=g+(i+1);});});
  var order=rows.map(function(r,i){var p=Math.floor(i/G),k=i%G;return {id:r.id,rank:i+1,pot:p+1,orig:r.group,tag:gpos[r.id],pref:(method==='direct'||p%2===0)?k:G-1-k};});
  function cands(t){var a=[];for(var d=0;d<G;d++){[t.pref-d,t.pref+d].forEach(function(x){if(x>=0&&x<G&&a.indexOf(x)<0)a.push(x);});}return a;}
  function place(i){if(i===order.length)return true;var t=order[i],cs=cands(t);for(var j=0;j<cs.length;j++){var g=gs[cs[j]];if(g.teams.length!==t.pot-1)continue;if(g.teams.some(function(x){return x.orig===t.orig;}))continue;g.teams.push(t);if(place(i+1))return true;g.teams.pop();}return false;}
  var ok=place(0);
  return {ok:ok,groups:gs,method:method};
}
var I_PAIRS=[[0,3,1],[1,2,1],[0,2,2],[3,1,2],[0,1,3],[2,3,3]];
function played(c){return c.matches.filter(function(m){return m.played;});}

function computeRows(c,ids,mf){
  var tm=teamMap(c),rows={};
  ids.forEach(function(id){rows[id]={id:id,name:tm[id].name,group:tm[id].group,pj:0,pg:0,pe:0,pp:0,gf:0,gc:0,dg:0,pts:0,jl:0,form:[],jls:[],cs:0,blank:0};});
  c.matches.filter(function(m){return m.played&&m.phase!=='eliminatoria'&&(!mf||mf(m));}).sort(function(a,b){return mKey(a)-mKey(b);}).forEach(function(m){
    [['h',m.home,m.away,m.hs,m.as],['a',m.away,m.home,m.as,m.hs]].forEach(function(x){
      var r=rows[x[1]];if(!r)return;var f=+x[3],g=+x[4];
      r.pj++;r.gf+=f;r.gc+=g;if(g===0)r.cs++;if(f===0)r.blank++;
      if(f>g){r.pg++;r.pts+=3;r.form.push('G');}else if(f===g){r.pe++;r.pts+=1;r.form.push('E');}else{r.pp++;r.form.push('P');}
      var j=jlTotal(m.jl&&m.jl[x[0]]);if(j!=null){r.jl+=j;r.jls.push({v:j,m:m.id});}
    });
  });
  var out=Object.keys(rows).map(function(k){var r=rows[k];r.dg=r.gf-r.gc;return r;});
  out.sort(cmpOfficial);return out;
}
function allRows(c){return computeRows(c,c.teams.map(function(t){return t.id;}));}
function cmpOfficial(a,b){return b.pts-a.pts||b.jl-a.jl||b.dg-a.dg||a.gc-b.gc||a.name.localeCompare(b.name);}
function decider(a,b){if(!a||!b||a.pts!==b.pts)return null;if(a.jl!==b.jl)return 'jl';if(a.dg!==b.dg)return 'dg';if(a.gc!==b.gc)return 'gc';return null;}
function groupRows(c,g){return computeRows(c,c.teams.filter(function(t){return t.group===g;}).map(function(t){return t.id;}),function(m){return m.phase==='grupos';});}
function p1Rows(c){return computeRows(c,c.teams.map(function(t){return t.id;}),function(m){return m.phase==='grupos';});}
function qualifiedSet(c){var s={};c.groups.forEach(function(g){groupRows(c,g).slice(0,c.qualify).forEach(function(r){s[r.id]=1;});});return s;}
function cmpValla(a,b){return a.gc-b.gc||b.pj-a.pj||a.name.localeCompare(b.name);}
function cmpJl(a,b){return b.jl-a.jl||(b.pj?b.jl/b.pj:0)-(a.pj?a.jl/a.pj:0)||a.name.localeCompare(b.name);}

function scorers(c){
  var map={};
  function add(p,t,g){var k=t+'|'+p.trim().toUpperCase();if(!map[k])map[k]={player:p.trim().toUpperCase(),team:t,g:0,base:0};map[k].g+=g;return map[k];}
  c.scorersBase.forEach(function(s,i){var e=add(s.player,s.team,+s.g);e.base+=+s.g;e.bi=i;});
  c.matches.forEach(function(m){if(m.imported||!m.played)return;(m.goals||[]).forEach(function(g){if(g.player&&g.player.trim()&&+g.n>0)add(g.player,g.team,+g.n);});});
  var arr=Object.keys(map).map(function(k){return map[k];}).filter(function(x){return x.g>0||ui.edit;});
  arr.sort(function(a,b){return b.g-a.g||a.player.localeCompare(b.player);});
  var pos=0,prev=null;arr.forEach(function(x,i){if(x.g!==prev){pos=i+1;prev=x.g;}x.pos=pos;});
  return arr;
}
function playersOf(c,team){var s={};c.scorersBase.forEach(function(x){if(x.team===team)s[x.player]=1;});c.matches.forEach(function(m){(m.goals||[]).forEach(function(g){if(g.team===team&&g.player)s[g.player.toUpperCase()]=1;});});return Object.keys(s).sort();}

/* ---------- render ---------- */
var app=document.getElementById('app');
function render(){
  if(NUBE&&ADMIN&&!canWrite){app.innerHTML=loginView();return;}
  var c=cat();
  if(!multi(c)&&ui.view==='gen')ui.view='pos';
  var h='<header class="hero"><div class="wrap"><div class="htop"><div class="brand"><img src="'+LOGO+'" alt="Supercopa de la No Violencia · Malala\'s · Edición 2" width="180" height="100"><div><div class="eyebrow">Supercopa de la No Violencia · Edición 2 · Medellín</div><h1>Copa <em>Malala\'s</em> 2026</h1>';
  h+='<p class="motto">“No solo gana quien más goles anota, sino quien más respeta y protege la esencia del juego y la dignidad de la mujer.”</p><div class="updated">Categoría Libre Femenina · Actualizado '+esc(fmtLong(S.updated))+'</div><div class="hquick"><button class="hq" data-go="doc"><svg viewBox="0 0 24 24"><path d="M14 3H6v18h12V7z"/><path d="M14 3v4h4M9 12h6M9 16h6"/></svg>Reglamento</button><button class="hq" data-go="nov"><svg viewBox="0 0 24 24"><path d="M4 5h13v14H6a2 2 0 0 1-2-2zM17 9h3v8a2 2 0 0 1-2 2"/><path d="M8 9h5M8 13h5"/></svg>Novedades</button></div></div></div>';
  if(canWrite)h+='<div class="adminbtns"><button class="editbtn" id="btn-edit" aria-pressed="'+ui.edit+'">'+(ui.edit?'Modo edición activo':'Editar resultados')+'</button>'+(NUBE?'<button class="editbtn" id="btn-logout">Cerrar sesión</button>':'')+'</div>';
  h+='</div>'+ticker(c)+'<div class="cats" role="tablist">';
  Object.keys(S.cats).forEach(function(k){var x=S.cats[k];h+='<button class="cat" role="tab" data-cat="'+k+'" aria-selected="'+(ui.cat===k)+'">'+esc(x.name)+(x.active?'':' <small>Pronto</small>')+'</button>';});
  h+='</div></div></header>';
  if(!c.active||!c.teams.length){h+='<main><div class="wrap">'+soon(c)+'</div></main>'+footer();app.innerHTML=h+saveBar();return;}
  h+='<div class="wrap">'+kpis(c)+'</div>';
  var tabs=[['pos',multi(c)?'Posiciones por grupo':'Tabla de posiciones']];
  if(multi(c)&&canWrite)tabs.push(['gen','Reclasificación']);else if(ui.view==='gen')ui.view='pos';
  if(hasInter(c))tabs.push(['f2','Fase 2']);else if(ui.view==='f2')ui.view='pos';
  if(hasKo(c))tabs.push(['ko','Eliminación directa']);else if(ui.view==='ko')ui.view='pos';
  tabs=tabs.concat([['par','Partidos'],['gol','Goleadoras'],['val','Valla menos vencida'],['jl','Juego limpio'],['est','Estadísticas']]);
  tabs.push(['nov','Novedades']);tabs.push(['doc','Reglamento y documentos']);
  if(canWrite)tabs.push(['int','Interna · W.O.']);else if(ui.view==='int')ui.view='pos';
  h+='<nav class="rail"><div class="wrap" role="tablist">';
  tabs.forEach(function(t){h+='<button class="tab'+(t[0]==='int'||t[0]==='gen'?' tint':'')+'" role="tab" data-view="'+t[0]+'" aria-selected="'+(ui.view===t[0])+'">'+t[1]+'</button>';});
  h+='</div></nav><main class="'+(animate?'anim':'')+'"><div class="wrap">';
  if(ui.edit)h+='<div class="editbanner"><b>Modo edición.</b> Toca un partido para cargar marcador, goleadoras, juego limpio y observaciones. Los cambios se acumulan abajo y quedan visibles para todos cuando los publicas.</div>';
  h+={nov:viewNov,doc:viewDoc,ko:viewKo,int:viewInt,pos:viewPos,gen:viewGen,f2:viewF2,par:viewPar,gol:viewGol,val:viewVal,jl:viewJl,est:viewEst}[ui.view](c);
  h+='</div></main>'+footer();
  app.innerHTML=h+saveBar();
  stagger();
  if(animate)countUp();
  animate=false;
}
function stagger(){var i=0;app.querySelectorAll('main .tw tbody tr, main .mcard, main .pod, main .scard, main .mini').forEach(function(el){el.style.setProperty('--i',i++);});app.querySelectorAll('.cols .c i').forEach(function(el,j){el.style.setProperty('--i',j);});}
function countUp(){
  try{if(window.matchMedia('(prefers-reduced-motion: reduce)').matches)return;}catch(e){}
  app.querySelectorAll('[data-count]').forEach(function(el){var raw=el.getAttribute('data-count'),to=+raw,dec=(raw.split('.')[1]||'').length,t0=null;
    function f(ts){if(!t0)t0=ts;var p=Math.min(1,(ts-t0)/700),e=1-Math.pow(1-p,3);el.textContent=(to*e).toFixed(dec);if(p<1)requestAnimationFrame(f);else el.textContent=to.toFixed(dec);}
    requestAnimationFrame(f);});
}
function ticker(c){
  if(!c.active||!c.matches)return '';
  var ms=played(c).slice().sort(function(a,b){return mKey(b)-mKey(a);}).slice(0,14);
  if(!ms.length)return '';
  var items=ms.map(function(m){return '<span>'+esc(tname(c,m.home))+' <b>'+m.hs+'–'+m.as+'</b> '+esc(tname(c,m.away))+'</span>';}).join('');
  return '<div class="ticker" aria-label="Últimos resultados"><span class="lbl">Resultados</span><div class="vp"><div class="tk" style="--dur:'+(ms.length*6)+'s">'+items+items+'</div></div></div>';
}
function soon(c){
  var info={f11:['10','equipos','Grupo único, todos contra todos. Clasifican las 8 primeras a la fase eliminatoria.'],sub14:['6','equipos','Grupo único, todos contra todos. Clasifican las 4 primeras a semifinales.']}[ui.cat]||['—','',''];
  return '<div class="card soon"><div class="sub">'+esc(c.name)+'</div><div class="big">'+info[0]+'</div><div class="sub">'+info[1]+'</div><p>'+info[2]+'</p><p>Las tablas de esta categoría aparecen aquí apenas se carguen equipos y calendario.</p></div>';
}
function leaders(c){
  var pl=played(c),goals=pl.reduce(function(s,m){return s+(+m.hs)+(+m.as);},0);
  var all=allRows(c),sc=scorers(c);
  var val=all.filter(function(r){return r.pj>0;}).sort(cmpValla);
  var jl=all.slice().sort(cmpJl);
  return {pl:pl,goals:goals,all:all,top:sc.filter(function(x){return x.pos===1;}),sc:sc,
    vb:val.length?val.filter(function(r){return r.gc===val[0].gc&&r.pj===val[0].pj;}):[],
    jb:jl.filter(function(r){return r.jl===jl[0].jl;})};
}
function names(arr,f){return arr.slice(0,2).map(f).join(' · ')+(arr.length>2?' +'+(arr.length-2):'');}
function kpis(c){
  var L=leaders(c);
  var h='<div class="kpis">';
  h+='<button class="kpi" data-go="par"><span class="k">Partidos jugados</span><span class="v"><span data-count="'+L.pl.length+'">'+L.pl.length+'</span><small> / '+c.matches.length+'</small></span><span class="d">'+(c.matches.length-L.pl.length)+' pendientes en calendario</span></button>';
  h+='<button class="kpi" data-go="est"><span class="k">Goles</span><span class="v" data-count="'+L.goals+'">'+L.goals+'</span><span class="d">'+(L.pl.length?(L.goals/L.pl.length).toFixed(2):'0')+' por partido</span></button>';
  if(L.top.length)h+='<button class="kpi star" data-go="gol"><span class="k">Goleadora</span><span class="v" data-count="'+L.top[0].g+'">'+L.top[0].g+'</span><span class="d"><b>'+esc(names(L.top,function(x){return title(x.player);}))+'</b></span></button>';
  if(L.vb.length)h+='<button class="kpi" data-go="val"><span class="k">Valla menos vencida</span><span class="v" data-count="'+L.vb[0].gc+'">'+L.vb[0].gc+'</span><span class="d"><b>'+esc(names(L.vb,function(x){return x.name;}))+'</b> · '+L.vb[0].pj+' PJ</span></button>';
  if(L.jb.length)h+='<button class="kpi" data-go="jl"><span class="k">Copa Sororidad · JL</span><span class="v" style="color:var(--good)" data-count="'+L.jb[0].jl+'">'+L.jb[0].jl+'</span><span class="d"><b>'+esc(names(L.jb,function(x){return x.name;}))+'</b></span></button>';
  return h+'</div>';
}
function gb(c,g){return multi(c)?'<span class="gbadge g-'+esc(g)+'">'+esc(g)+'</span>':'';}
function tl(id,name){return '<button class="tlink" data-team="'+esc(id)+'">'+esc(name)+'</button>';}
function jlCell(r){var cl=jlClass(r.jl,r.pj);return '<span class="jlv '+cl+'">'+r.jl+'</span><span class="jlavg">'+(r.pj?(r.jl/r.pj).toFixed(1):'–')+'/pj</span>';}
function formHtml(f){return '<span class="form">'+f.slice(-5).map(function(x){return '<span class="fd '+x+'" title="'+({G:'Ganó',E:'Empató',P:'Perdió'}[x])+'">'+x+'</span>';}).join('')+'</span>';}
function expBtn(){return '<button class="btn exp" data-export="'+ui.view+'">'+ICON_DL+'Exportar imagen</button>';}

function stdTable(c,rows,opts){
  opts=opts||{};var q=c.qualify;
  var h='<div class="tw"><table><thead><tr><th>#</th>'+(opts.general?'<th>Gr</th>':'')+'<th class="l">Equipo</th>';
  var cols=[['pj','PJ',''],['pg','PG','c-opt'],['pe','PE','c-opt'],['pp','PP','c-opt'],['gf','GF',''],['gc','GC',''],['dg','DG',''],['jl','JL','jl'],['pts','PTS','pts']];
  cols.forEach(function(col){var a;if(opts.sortable){a=' class="sortable '+col[2]+'" data-sort="'+col[0]+'"'+(ui.gen.sort===col[0]?' aria-sort="'+(ui.gen.dir<0?'descending':'ascending')+'"':'');}else a=' class="'+col[2]+'"';h+='<th'+a+(col[0]==='jl'?' title="Puntos de juego limpio acumulados (máx. 8 por partido)"':'')+'>'+col[1]+'</th>';});
  h+='<th class="c-opt">Últimos 5</th>'+(opts.general?'<th class="c-opt">Zona</th>':'')+'</tr></thead><tbody>';
  rows.forEach(function(r,i){
    var tb={};
    if(!opts.noTie){var d1=decider(rows[i-1],r),d2=decider(r,rows[i+1]);if(d1)tb[d1]=1;if(d2)tb[d2]=1;}
    var qual=opts.general?opts.qset[r.id]:i<q;
    var cls=(qual?'q':'')+(!opts.general&&i===q-1?' cut':'');
    h+='<tr class="'+cls+'"><td class="pos">'+(opts.posOf?opts.posOf(r,i):i+1)+'</td>'+(opts.general?'<td>'+gb(c,r.group)+'</td>':'')+'<td class="l">'+tl(r.id,r.name)+'</td>';
    h+='<td>'+r.pj+'</td><td class="c-opt">'+r.pg+'</td><td class="c-opt">'+r.pe+'</td><td class="c-opt">'+r.pp+'</td><td>'+r.gf+'</td>';
    h+='<td'+(tb.gc?' class="tb" title="Empate en puntos: define goles en contra"':'')+'>'+r.gc+'</td>';
    h+='<td class="'+(r.dg>0?'dgp':r.dg<0?'dgn':'')+(tb.dg?' tb':'')+'"'+(tb.dg?' title="Empate en puntos: define diferencia de gol"':'')+'>'+(r.dg>0?'+':'')+r.dg+'</td>';
    h+='<td class="jl'+(tb.jl?' tb':'')+'"'+(tb.jl?' title="Empate en puntos: define juego limpio"':'')+'>'+jlCell(r)+'</td>';
    h+='<td class="pts">'+r.pts+'</td><td class="c-opt">'+formHtml(r.form)+'</td>'+(opts.general?'<td class="c-opt">'+(qual?'<span class="zone">Octavos</span>':'')+'</td>':'')+'</tr>';
  });
  return h+'</tbody></table></div>';
}
function legend(c){return '<div class="legend">'+(c.qualify?'<span><i class="sw" style="background:var(--gold)"></i>Clasifica a la fase eliminatoria ('+(multi(c)?c.qualify+' primeras por grupo':'las '+c.qualify+' primeras')+')</span>':'')+'<span><i class="sw" style="box-shadow:inset 0 0 0 2px var(--gold)"></i>Criterio que define un empate en puntos</span><span><b style="color:var(--good)">JL</b> juego limpio acumulado · máx. 8 por partido</span><span>Orden: PTS → JL → DG → menos GC</span></div>';}

function viewPos(c){
  var h='<div class="sechead"><div><h2>'+(multi(c)?'Posiciones por grupo':'Tabla de posiciones')+'</h2><p>'+(hasInter(c)?'Fase 1 terminada: estas posiciones son el punto de partida del sorteo de la fase 2.':multi(c)?'Fase 1: todos contra todos en el grupo.':'Grupo único, todos contra todos. Clasifican las '+c.qualify+' primeras.')+' El juego limpio es el primer criterio de desempate.</p></div><div class="acts">';
  if(multi(c)){h+='<div class="chips"><button class="chip" data-grp="all" aria-pressed="'+(ui.group==='all')+'">Todos</button>';c.groups.forEach(function(g){h+='<button class="chip" data-grp="'+g+'" aria-pressed="'+(ui.group===g)+'">Grupo '+g+'</button>';});h+='</div>';}
  h+=(canWrite?'<button class="btn" data-form="cfg">Equipos y formato</button>':'')+expBtn()+'</div></div>';
  c.groups.filter(function(g){return ui.group==='all'||ui.group===g||!multi(c);}).forEach(function(g){
    h+='<section class="groupblock">'+(multi(c)?'<h3>'+gb(c,g)+' '+esc(glabel(c,g))+'</h3>':'')+stdTable(c,groupRows(c,g))+'</section>';
  });
  return h+legend(c);
}
function viewGen(c){
  var all=p1Rows(c);var qset=qualifiedSet(c);
  var official={};all.forEach(function(r,i){official[r.id]=i+1;});
  var rows=all.slice();
  if(ui.gen.filter==='q')rows=rows.filter(function(r){return qset[r.id];});
  if(ui.gen.filter==='out')rows=rows.filter(function(r){return !qset[r.id];});
  if(ui.gen.sort){var k=ui.gen.sort,d=ui.gen.dir;rows.sort(function(a,b){return (a[k]-b[k])*d||cmpOfficial(a,b);});}
  var h='<div class="sechead"><div><h2>Reclasificación general</h2><p><b>Vista solo para la organización.</b> Los '+c.teams.length+' equipos de la fase 1 en una sola tabla con los mismos criterios. Toca un encabezado para ordenar por esa columna; el número de la izquierda siempre es la posición oficial.</p></div><div class="acts"><div class="chips">';
  (c.qualify?[['all','Todos'],['q','En zona de octavos'],['out','Fuera de zona']]:[]).forEach(function(f){h+='<button class="chip" data-genf="'+f[0]+'" aria-pressed="'+(ui.gen.filter===f[0])+'">'+f[1]+'</button>';});
  if(ui.gen.sort)h+='<button class="chip" data-gensort="reset">Orden oficial</button>';
  h+='</div>'+expBtn()+'</div></div>';
  h+=stdTable(c,rows,{general:true,qset:qset,sortable:true,noTie:!!ui.gen.sort||ui.gen.filter!=='all',posOf:function(r){return official[r.id];}});
  return h+legend(c);
}
function matchFilter(c){
  var f=ui.m,tm=teamMap(c),q=f.q.trim().toUpperCase();
  return c.matches.filter(function(m){
    if(f.group==='inter'){if(m.phase!=='intergrupos')return false;}else if(f.group==='ko'){if(m.phase!=='eliminatoria')return false;}else if(f.group!=='all'&&(m.group!==f.group||m.phase!=='grupos'))return false;
    if(f.round!=='all'&&roundKey(m)!==f.round)return false;
    if(f.status==='played'&&!m.played)return false;if(f.status==='pend'&&m.played)return false;
    if(q&&(tm[m.home].name+' '+tm[m.away].name).toUpperCase().indexOf(q)<0)return false;
    return true;
  });
}
function viewPar(c){
  var f=ui.m,rounds=roundKeys(c);
  var h='<div class="sechead"><div><h2>Partidos</h2><p>Resultados, goleadoras, juego limpio y observaciones de cada encuentro. '+(ui.edit?'Toca un partido para abrir su planilla.':'Toca un partido para ver el detalle.')+'</p></div><div class="acts">';
  if(ui.edit)h+='<button class="btn pri" id="btn-add">+ Agregar partido</button>';
  h+=expBtn()+'</div></div>';
  if(hasInter(c)&&!c.fase2)h+='<div class="note">Los '+c.interTotal+' partidos de la fase 2 aparecen aquí cuando se haga el sorteo en la pestaña <b>Fase 2</b>.</div>';
  h+='<div class="filters">';
  if(multi(c)){h+='<div class="chips"><button class="chip" data-mg="all" aria-pressed="'+(f.group==='all')+'">Todos</button>';c.groups.forEach(function(g){h+='<button class="chip" data-mg="'+g+'" aria-pressed="'+(f.group===g)+'">Grupo '+g+'</button>';});if(c.interTotal)h+='<button class="chip" data-mg="inter" aria-pressed="'+(f.group==='inter')+'">Fase 2</button><button class="chip" data-mg="ko" aria-pressed="'+(f.group==='ko')+'">Eliminación</button>';h+='</div>';}
  h+='<select class="inp" id="f-round" aria-label="Fecha"><option value="all">Todas las fechas</option>'+rounds.map(function(r){return '<option value="'+r+'"'+(f.round===r?' selected':'')+'>'+roundLabel(r)+'</option>';}).join('')+'</select>';
  h+='<div class="seg" role="group" aria-label="Estado">'+[['all','Todos'],['played','Jugados'],['pend','Pendientes']].map(function(s){return '<button data-ms="'+s[0]+'" aria-pressed="'+(f.status===s[0])+'">'+s[1]+'</button>';}).join('')+'</div>';
  h+='<input class="inp" id="f-q" type="search" placeholder="Buscar equipo" value="'+esc(f.q)+'" style="flex:1;min-width:140px"></div>';
  h+='<div id="mlist">'+matchList(c)+'</div>';
  return h;
}
function matchList(c){
  var ms=matchFilter(c);if(!ms.length)return '<div class="empty card">No hay partidos con esos filtros.</div>';
  var by={};ms.forEach(function(m){var k=roundLabel(roundKey(m));(by[k]=by[k]||{k:mKey(m),r:m.round,inter:m.phase!=='grupos',list:[]}).list.push(m);});
  return Object.keys(by).sort(function(a,b){return by[a].k-by[b].k;}).map(function(k){
    var b=by[k],bye=(!b.inter&&c.byes&&c.byes[b.r])?'<span class="bye">Descansa: '+esc(tname(c,c.byes[b.r]))+'</span>':'';
    return '<section class="round"><h3>'+k+' '+bye+'</h3><div class="mgrid">'+b.list.sort(function(a,b){return (a.group||'').localeCompare(b.group||'');}).map(function(m){return mcard(c,m);}).join('')+'</div></section>';
  }).join('');
}
function mcard(c,m){
  var tm=teamMap(c),H=tm[m.home],A=tm[m.away];
  var meta=m.phase==='eliminatoria'?'<b>'+esc(KO_NAMES[m.round-1])+'</b>':multi(c)?(m.phase==='intergrupos'?(m.interGroup?'Fase 2 · G'+esc(m.interGroup)+' · ':'Fase 2 ')+gb(c,H.group)+' '+gb(c,A.group):gb(c,m.group)+' Grupo '+m.group):esc(glabel(c,m.group||'U'));
  if(m.notes)meta+=' <span class="notechip">Nota</span>';
  var right=[fmtDate(m.date),m.time,m.venue].filter(Boolean).join(' · ');
  var h='<button class="mcard" data-match="'+esc(m.id)+'"><div class="mmeta"><span>'+meta+'</span><span>'+esc(right)+'</span></div>';
  var hw=m.played&&+m.hs>+m.as,aw=m.played&&+m.as>+m.hs;
  h+='<div class="mrow"><span class="h '+(m.played&&aw?'lose':'')+'">'+esc(H.name)+'</span>';
  h+=m.played?'<span class="score">'+m.hs+' – '+m.as+(m.pens?'<small class="pen">'+m.pens.h+'–'+m.pens.a+' pen.</small>':'')+'</span>':'<span class="score pend">Pendiente</span>';
  h+='<span class="a '+(m.played&&hw?'lose':'')+'">'+esc(A.name)+'</span></div>';
  if(m.played){var jh=jlTotal(m.jl&&m.jl.h),ja=jlTotal(m.jl&&m.jl.a);
    h+='<div class="mjl"><span>'+(jh!=null?'<span class="jlchip '+jlClass(jh)+'">JL '+jh+'</span>':'')+'</span><span></span><span>'+(ja!=null?'<span class="jlchip '+jlClass(ja)+'">JL '+ja+'</span>':'')+'</span></div>';
    var gl=(m.goals||[]).filter(function(g){return g.player&&+g.n>0;});
    if(gl.length)h+='<div class="mgoals">⚽ '+gl.map(function(g){return esc(title(g.player))+(+g.n>1?' ×'+g.n:'');}).join(', ')+'</div>';
  }
  return h+'</button>';
}
function viewGol(c){
  var all=scorers(c);var tm=teamMap(c);var f=ui.sc,q=f.q.trim().toUpperCase();
  var rows=all.filter(function(x){return (!f.team||x.team===f.team)&&(!q||x.player.indexOf(q)>=0);});
  var mx=all.length?all[0].g:1;
  var h='<div class="sechead"><div><h2>Goleadoras</h2><p>Ranking oficial al '+fmtDate(c.scorersBaseDate)+' más los goles que se registren en las planillas de partidos cargados desde entonces. Premio de $500.000.</p></div><div class="acts">'+expBtn()+'</div></div>';
  h+='<div class="podium">'+all.filter(function(x){return x.pos<=3;}).slice(0,4).map(function(x){return '<div class="pod"><span class="n">'+x.pos+'</span><span class="who"><b>'+esc(title(x.player))+'</b><span>'+esc(tm[x.team]?tm[x.team].name:x.team)+'</span></span><span class="big">'+x.g+'<small>goles</small></span></div>';}).join('')+'</div>';
  h+='<div class="filters"><input class="inp" id="f-sq" type="search" placeholder="Buscar jugadora" value="'+esc(f.q)+'" style="flex:1;min-width:160px"><select class="inp" id="f-st" aria-label="Equipo"><option value="">Todos los equipos</option>'+c.teams.slice().sort(function(a,b){return a.name.localeCompare(b.name);}).map(function(t){return '<option value="'+t.id+'"'+(f.team===t.id?' selected':'')+'>'+esc(t.name)+'</option>';}).join('')+'</select></div>';
  h+='<div class="tw"><table><thead><tr><th>#</th><th class="l">Jugadora</th><th class="l">Equipo</th><th class="c-opt"></th><th>Goles</th></tr></thead><tbody>';
  rows.forEach(function(x){var t=tm[x.team];
    h+='<tr><td class="pos">'+x.pos+'</td><td class="l"><b>'+esc(title(x.player))+'</b></td><td class="l">'+(t?gb(c,t.group)+' '+tl(t.id,t.name):esc(x.team))+'</td><td class="c-opt" style="width:30%"><div class="bar gold"><i style="width:'+(x.g/mx*100)+'%"></i></div></td><td class="pts">'+x.g;
    if(ui.edit&&x.bi!=null)h+='<span class="adj"><button data-adj="'+x.bi+'" data-d="-1" aria-label="Restar gol">−</button><button data-adj="'+x.bi+'" data-d="1" aria-label="Sumar gol">+</button></span>';
    h+='</td></tr>';});
  if(!rows.length)h+='<tr><td colspan="5" class="empty">Sin resultados.</td></tr>';
  return h+'</tbody></table></div>'+(ui.edit?'<p class="note" style="margin-top:10px">Los botones − / + corrigen el ranking base. Los goles de partidos nuevos se suman solos desde la planilla de cada partido.</p>':'');
}
function viewVal(c){
  var all=allRows(c).filter(function(r){return r.pj>0;}).sort(cmpValla);
  var mx=Math.max.apply(null,all.map(function(r){return r.gc;}))||1;
  var h='<div class="sechead"><div><h2>Valla menos vencida</h2><p>Menos goles recibidos en la fase de grupos; a igual número de goles, va primero quien ha jugado más partidos. Premio de $500.000.</p></div><div class="acts">'+expBtn()+'</div></div>';
  h+='<div class="podium">'+all.slice(0,3).map(function(r,i){return '<div class="pod"><span class="n">'+(i+1)+'</span><span class="who"><b>'+tl(r.id,r.name)+'</b><span>'+(multi(c)?'Grupo '+r.group+' · ':'')+r.pj+' PJ · '+r.cs+' vallas invictas</span></span><span class="big">'+r.gc+'<small>GC</small></span></div>';}).join('')+'</div>';
  h+='<div class="tw"><table><thead><tr><th>#</th>'+(multi(c)?'<th>Gr</th>':'')+'<th class="l">Equipo</th><th>PJ</th><th>GC</th><th>Prom.</th><th title="Partidos sin recibir gol">Invicta</th><th class="c-opt" style="width:32%"></th></tr></thead><tbody>';
  all.forEach(function(r,i){h+='<tr><td class="pos">'+(i+1)+'</td>'+(multi(c)?'<td>'+gb(c,r.group)+'</td>':'')+'<td class="l">'+tl(r.id,r.name)+'</td><td>'+r.pj+'</td><td class="pts">'+r.gc+'</td><td>'+(r.gc/r.pj).toFixed(2)+'</td><td>'+r.cs+'</td><td class="c-opt"><div class="bar"><i style="width:'+(r.gc/mx*100)+'%"></i></div></td></tr>';});
  return h+'</tbody></table></div>';
}
function viewJl(c){
  var all=allRows(c).sort(cmpJl);
  var h='<div class="sechead"><div><h2>Juego limpio · Copa Sororidad</h2><p>Puntos acumulados en toda la fase de grupos. El equipo con más puntos al cierre recibe la Copa Sororidad. Cada casilla es un partido: 8 es el máximo posible.</p></div><div class="acts">'+expBtn()+'</div></div>';
  h+='<div class="podium">'+all.slice(0,3).map(function(r,i){return '<div class="pod"><span class="n" style="color:var(--good)">'+(i+1)+'</span><span class="who"><b>'+tl(r.id,r.name)+'</b><span>'+(multi(c)?'Grupo '+r.group+' · ':'')+r.pj+' PJ · '+(r.pj?(r.jl/r.pj).toFixed(1):'–')+' por partido</span></span><span class="big" style="color:var(--good)">'+r.jl+'<small>JL</small></span></div>';}).join('')+'</div>';
  h+='<div class="tw"><table><thead><tr><th>#</th>'+(multi(c)?'<th>Gr</th>':'')+'<th class="l">Equipo</th><th>PJ</th><th class="jl">JL</th><th>Prom.</th><th>Efic.</th><th class="l c-opt">Partido a partido</th></tr></thead><tbody>';
  all.forEach(function(r,i){var ef=pct(r.jl,8*r.pj);
    h+='<tr><td class="pos">'+(i+1)+'</td>'+(multi(c)?'<td>'+gb(c,r.group)+'</td>':'')+'<td class="l">'+tl(r.id,r.name)+'</td><td>'+r.pj+'</td><td class="jl"><span class="jlv '+jlClass(r.jl,r.pj)+'">'+r.jl+'</span></td><td>'+(r.pj?(r.jl/r.pj).toFixed(1):'–')+'</td><td>'+ef+'%</td><td class="l c-opt"><span class="strip">'+r.jls.map(function(x){return '<span class="'+jlClass(x.v)+'">'+x.v+'</span>';}).join('')+'</span></td></tr>';});
  h+='</tbody></table></div>';
  h+='<div class="rules"><div class="card" style="padding:14px"><h3 style="font-size:18px">Suma</h3><ul>'+JL_POS.map(function(p){return '<li><span>'+p.l+'</span><b class="pos-v">+'+p.v+'</b></li>';}).join('')+'</ul></div>';
  h+='<div class="card" style="padding:14px"><h3 style="font-size:18px">Resta</h3><ul>'+JL_NEG.map(function(p){return '<li><span>'+p.l+'</span><b class="neg-v">'+p.v+'</b></li>';}).join('')+'</ul></div></div>';
  return h;
}

function roundKeys(c){var r={};c.matches.forEach(function(m){r[roundKey(m)]=mKey(m);});return Object.keys(r).sort(function(a,b){return r[a]-r[b];});}
function f2Groups(c){
  if(c.fase2)return {groups:c.fase2.groups,ok:true,fixed:true,method:c.fase2.method};
  if(ui.f2m==='draw')return drawGroupsOut(c);
  if(ui.f2draft&&ui.f2draft.cat===ui.cat&&ui.f2draft.method===ui.f2m)return {groups:ui.f2draft.groups,ok:true,fixed:false,method:ui.f2m,edited:true};
  var p=interPlan(c,ui.f2m);p.fixed=false;return p;
}
function f2Conflicts(g){var seen={},bad={};g.teams.forEach(function(t){if(seen[t.orig])bad[t.orig]=1;seen[t.orig]=1;});return Object.keys(bad);}
function f2Matches(c,g){var T=g.teams.map(function(x){return x.id;});return I_PAIRS.map(function(p){return {id:'I'+g.id+'-'+p[2]+'-'+T[p[0]]+'-'+T[p[1]],phase:'intergrupos',group:'',interGroup:String(g.id),round:p[2],date:'',time:'',venue:'',home:T[p[0]],away:T[p[1]],hs:null,as:null,played:false,imported:false,goals:[],jl:{},notes:''};});}
function f2Swap(a,b){
  var c=cat(),P=f2Groups(c),ga=P.groups[a.g],gb2=P.groups[b.g];if(!ga||!gb2)return;
  if(P.fixed){
    var touched=[ga.id,gb2.id].map(String);
    if(c.matches.some(function(m){return m.interGroup&&touched.indexOf(String(m.interGroup))>=0&&m.played;})){toast('No se puede mover: uno de esos grupos ya tiene partidos jugados');return;}
  }else if(!ui.f2draft||ui.f2draft.method!==ui.f2m){ui.f2draft={cat:ui.cat,method:ui.f2m,groups:clone(P.groups)};P={groups:ui.f2draft.groups,fixed:false};ga=P.groups[a.g];gb2=P.groups[b.g];}
  var ta=ga.teams[a.i],tb=gb2.teams[b.i];
  var keepA={pot:ta.pot},keepB={pot:tb.pot};
  ga.teams[a.i]=Object.assign({},tb,keepA);gb2.teams[b.i]=Object.assign({},ta,keepB);
  if(P.fixed){
    var ids=[String(ga.id),String(gb2.id)];
    c.matches=c.matches.filter(function(m){return !(m.interGroup&&ids.indexOf(String(m.interGroup))>=0);});
    [ga,gb2].forEach(function(g){if(ga===gb2&&g!==ga)return;f2Matches(c,g).forEach(function(m){if(!c.matches.some(function(x){return x.id===m.id;}))c.matches.push(m);});});
    c.fase2.edited=true;note('Intergrupos: '+tname(c,ta.id)+' ⇄ '+tname(c,tb.id));
  }
  toast(tname(c,ta.id)+' ⇄ '+tname(c,tb.id));
}
function f2Table(c,g){
  var ids=g.teams.map(function(t){return t.id;});
  var rows=computeRows(c,ids,function(m){return String(m.interGroup)===String(g.id);});
  var hist={};allRows(c).forEach(function(r){hist[r.id]=r.jl;});
  var head={};g.teams.forEach(function(t){head[t.id]=t.pot===1?1:0;});
  rows.forEach(function(r){r.jlh=hist[r.id]||0;r.head=head[r.id];});
  rows.sort(function(a,b){return b.pts-a.pts||b.head-a.head||b.jlh-a.jlh||b.dg-a.dg||a.gc-b.gc||a.name.localeCompare(b.name);});
  return rows;
}
function f2Decider(a,b){if(!a||!b||a.pts!==b.pts)return null;if(a.head!==b.head)return 'head';if(a.jlh!==b.jlh)return 'jl';if(a.dg!==b.dg)return 'dg';if(a.gc!==b.gc)return 'gc';return null;}
function viewF2(c){
  var f2=c.fase2,G=c.teams.length/4;
  var h='<div class="sechead"><div><h2>Fase 2</h2><p>Los '+c.teams.length+' equipos se reparten por sorteo en '+G+' grupos de 4 y juegan 3 partidos. Todos arrancan de cero en puntos y goles; el juego limpio se sigue acumulando desde la fase 1. Clasifican las 2 primeras de cada grupo a octavos de final.</p></div><div class="acts">'+(f2?expBtn():'')+'</div></div>';
  h+='<div class="legend" style="margin:0 0 12px"><span><i class="sw" style="background:var(--gold)"></i>Clasifica a octavos (2 primeras)</span><span>Desempate: <b>cabeza de grupo</b> → juego limpio histórico → DG → menos GC</span></div>';
  if(!f2){
    if(canWrite)return h+drawView(c);
    return h+'<div class="card soon"><div class="big">Sorteo</div><p>Los grupos de la fase 2 se definen en un sorteo en vivo. Apenas se haga, aquí aparecen los grupos, el calendario y las tablas.</p></div>';
  }
  var pi=c.matches.filter(function(m){return m.interGroup;}),pl=pi.filter(function(m){return m.played;}).length;
  h+='<div class="f2bar"><span class="f2pill ok">Grupos sorteados</span><span>Sorteo del '+esc(fmtLong(f2.date))+(f2.edited?' · con ajustes manuales':'')+' · '+pl+' de '+pi.length+' partidos jugados</span>';
  if(ui.edit)h+='<button class="btn dng" id="f2-reset" style="margin-left:auto">Reiniciar fase 2</button>';
  h+='</div>';
  if(ui.edit)h+='<div class="note">'+(ui.f2sel?'<b>Equipo seleccionado:</b> '+esc(tname(c,f2.groups[ui.f2sel.g].teams[ui.f2sel.i].id))+'. Toca ⇄ en otro equipo para intercambiarlos, o en el mismo para cancelar.':'Para corregir el sorteo, toca <b>⇄</b> en un equipo y luego en otro. Los partidos de esos dos grupos se rehacen solos si aún no tienen partidos jugados.')+'</div>';
  h+='<div class="igrid">';
  f2.groups.forEach(function(g,gi){
    var rows=f2Table(c,g),seed={};g.teams.forEach(function(t){seed[t.id]=t;});
    h+='<section class="icard"><header><b>Grupo '+g.id+'</b><span>Fase 2</span></header><table><thead><tr>'+(ui.edit?'<th></th>':'')+'<th>#</th><th class="l">Equipo</th><th class="c-opt" title="Grupo de la fase 1">F1</th><th>PJ</th><th class="c-opt">GF</th><th class="c-opt">GC</th><th>DG</th><th class="jl" title="Juego limpio acumulado desde la fase 1">JL</th><th class="pts">PTS</th></tr></thead><tbody>';
    rows.forEach(function(r,i){var s=seed[r.id],idx=g.teams.indexOf(s);var sel=ui.f2sel&&ui.f2sel.g===gi&&ui.f2sel.i===idx;
      var tb={},live=rows.some(function(x){return x.pj>0;}),d1=live&&f2Decider(rows[i-1],r),d2=live&&f2Decider(r,rows[i+1]);if(d1)tb[d1]=1;if(d2)tb[d2]=1;
      h+='<tr class="'+(i<2?'q':'')+(i===1?' cut':'')+(sel?' sel':'')+'">'+(ui.edit?'<td><button class="swap" data-f2pick="'+gi+':'+idx+'" aria-pressed="'+!!sel+'" aria-label="Mover '+esc(r.name)+'">⇄</button></td>':'')+'<td class="pos">'+(i+1)+'</td>';
      h+='<td class="l'+(tb.head?' tb':'')+'"'+(tb.head?' title="Empate en puntos: define cabeza de grupo"':'')+'>'+tl(r.id,r.name)+(s.pot===1?' <span class="headchip">Cabeza</span>':'')+'</td><td class="c-opt">'+gb(c,s.orig)+'</td><td>'+r.pj+'</td><td class="c-opt">'+r.gf+'</td>';
      h+='<td class="c-opt'+(tb.gc?' tb':'')+'">'+r.gc+'</td><td class="'+(r.dg>0?'dgp':r.dg<0?'dgn':'')+(tb.dg?' tb':'')+'">'+(r.dg>0?'+':'')+r.dg+'</td><td class="jl'+(tb.jl?' tb':'')+'"><span class="jlv '+jlClass(r.jlh,10)+'">'+r.jlh+'</span></td><td class="pts">'+r.pts+'</td></tr>';});
    var gp=c.matches.filter(function(x){return String(x.interGroup)===String(g.id)&&x.played;}).length;
    h+='</tbody></table><details class="ifx"'+(ui.edit?' open':'')+'><summary>Partidos del grupo · '+gp+' de 6 jugados</summary><div class="ifix">';
    I_PAIRS.forEach(function(pr){
      var a=g.teams[pr[0]].id,b=g.teams[pr[1]].id,m=c.matches.filter(function(x){return String(x.interGroup)===String(g.id)&&((x.home===a&&x.away===b)||(x.home===b&&x.away===a));})[0];
      var sc=m&&m.played?'<b>'+m.hs+' – '+m.as+'</b>':'<i>vs</i>';
      var inner='<span class="fr">F'+pr[2]+'</span><span class="h">'+esc(tname(c,m?m.home:a))+'</span><span class="sc">'+sc+'</span><span class="a">'+esc(tname(c,m?m.away:b))+'</span>';
      h+=m?'<button class="fx" data-match="'+esc(m.id)+'">'+inner+'</button>':'<div class="fx">'+inner+'</div>';
    });
    h+='</div></details></section>';
  });
  return h+'</div>';
}
/* ---------- eliminación directa ---------- */
var KO_NAMES=['Octavos de final','Cuartos de final','Semifinales','Final','Tercer puesto'],KO_SHORT=['8vos','4tos','SF','Final','3er'];
var KO_T={id:'T',r:5,a:{l:'S1'},b:{l:'S2'}};
var KO_DEF=[{id:'O1',r:1,a:{p:1,g:1},b:{p:2,g:2}},{id:'O2',r:1,a:{p:1,g:3},b:{p:2,g:4}},{id:'O3',r:1,a:{p:1,g:5},b:{p:2,g:6}},{id:'O4',r:1,a:{p:1,g:7},b:{p:2,g:8}},{id:'O5',r:1,a:{p:1,g:2},b:{p:2,g:1}},{id:'O6',r:1,a:{p:1,g:4},b:{p:2,g:3}},{id:'O7',r:1,a:{p:1,g:6},b:{p:2,g:5}},{id:'O8',r:1,a:{p:1,g:8},b:{p:2,g:7}},
  {id:'C1',r:2,a:{w:'O1'},b:{w:'O2'}},{id:'C2',r:2,a:{w:'O3'},b:{w:'O4'}},{id:'C3',r:2,a:{w:'O5'},b:{w:'O6'}},{id:'C4',r:2,a:{w:'O7'},b:{w:'O8'}},
  {id:'S1',r:3,a:{w:'C1'},b:{w:'C2'}},{id:'S2',r:3,a:{w:'C3'},b:{w:'C4'}},{id:'F',r:4,a:{w:'S1'},b:{w:'S2'}}];
var KO_8=[{id:'Q1',r:2,a:{p:1},b:{p:8}},{id:'Q2',r:2,a:{p:4},b:{p:5}},{id:'Q3',r:2,a:{p:2},b:{p:7}},{id:'Q4',r:2,a:{p:3},b:{p:6}},{id:'S1',r:3,a:{w:'Q1'},b:{w:'Q2'}},{id:'S2',r:3,a:{w:'Q3'},b:{w:'Q4'}},{id:'F',r:4,a:{w:'S1'},b:{w:'S2'}}];
var KO_4=[{id:'S1',r:3,a:{p:1},b:{p:4}},{id:'S2',r:3,a:{p:2},b:{p:3}},{id:'F',r:4,a:{w:'S1'},b:{w:'S2'}}];
function koDefs(c){var d=hasInter(c)?KO_DEF:multi(c)?null:c.qualify===8?KO_8:c.qualify===4?KO_4:null;return d&&c.third?d.concat([KO_T]):d;}
function koLoser(m){var w=koWinner(m);return w?(w===m.home?m.away:m.home):null;}
function legs(c){return c.legs||1;}
function setLegs(c,n){var gm=c.matches.filter(function(m){return m.phase==='grupos';});
  if(n===2){var R=gm.reduce(function(a,m){return Math.max(a,+m.round||0);},0);c.legsBase=R;gm.forEach(function(m){var r=(+m.round)+R;c.matches.push({id:(m.group||'U')+r+'-'+m.away+'-'+m.home+'-v',phase:'grupos',group:m.group,round:r,date:'',time:'',venue:'',home:m.away,away:m.home,hs:null,as:null,played:false,imported:false,goals:[],jl:{},notes:''});});if(c.byes)Object.keys(c.byes).forEach(function(k){if(+k<=R)c.byes[+k+R]=c.byes[k];});c.legs=2;return '';}
  var B=c.legsBase||0;if(!B)return 'No se pudo identificar la segunda vuelta';var sec=gm.filter(function(m){return +m.round>B;});if(sec.some(function(m){return m.played;}))return 'La segunda vuelta ya tiene partidos jugados; no se puede quitar';
  c.matches=c.matches.filter(function(m){return sec.indexOf(m)<0;});if(c.byes)Object.keys(c.byes).forEach(function(k){if(+k>B)delete c.byes[k];});c.legs=1;delete c.legsBase;return '';}
function hasKo(c){return !!koDefs(c)&&c.teams.length>0;}
function koReady(c){if(hasInter(c))return !!c.fase2&&f2Done(c);var ms=c.matches.filter(function(m){return m.phase==='grupos';});return ms.length>0&&ms.every(function(m){return m.played;});}
function koMatch(c,id){return c.matches.filter(function(m){return m.id==='KO-'+id;})[0];}
function koWinner(m){if(!m||!m.played)return null;if(+m.hs>+m.as)return m.home;if(+m.as>+m.hs)return m.away;if(m.pens)return +m.pens.h>+m.pens.a?m.home:m.away;return null;}
function f2Done(c){var ms=c.matches.filter(function(m){return m.interGroup;});return ms.length>0&&ms.every(function(m){return m.played;});}
function koResolve(c){
  var tables=c.fase2?c.fase2.groups.map(function(g){return f2Table(c,g);}):null,one=multi(c)||!c.matches.some(function(m){return m.phase==='grupos'&&m.played;})?null:groupRows(c,c.groups[0]),out={};
  function slot(s){if(s.l){var y=out[s.l];return {id:y&&y.m&&y.m.played?koLoser(y.m):null,label:'Perdedora '+s.l};}if(s.w){var x=out[s.w];return {id:x?koWinner(x.m):null,label:'Ganadora '+s.w};}if(!s.g){var q=one&&one[s.p-1];return {id:q?q.id:null,label:s.p+'° de la tabla'};}var t=tables&&tables[s.g-1],r=t&&t[s.p-1];return {id:r?r.id:null,label:s.p+'° Grupo '+s.g};}
  (koDefs(c)||[]).forEach(function(d){var m=koMatch(c,d.id),a=slot(d.a),b=slot(d.b);out[d.id]={def:d,m:m,home:m&&m.played?m.home:a.id,away:m&&m.played?m.away:b.id,la:a.label,lb:b.label};});
  return out;
}
function koBox(c,x){
  var m=x.m,pl=m&&m.played,w=pl?koWinner(m):null;
  function row(id,lab,sc,pen){return '<span class="kt'+(w&&w===id?' w':'')+(w&&id&&w!==id?' l':'')+'"><i>'+esc(lab)+'</i><b>'+(id?esc(tname(c,id)):'Por definir')+'</b><em>'+(pl?sc+(m.pens?'<small>('+pen+')</small>':''):'')+'</em></span>';}
  var meta=m&&(m.date||m.venue)?'<span class="km">'+esc([fmtDate(m.date),m.time,m.venue].filter(Boolean).join(' · '))+'</span>':'';
  return '<button class="kob'+(pl?' done':'')+'" data-ko="'+x.def.id+'"><span class="kid">'+x.def.id+'</span>'+row(x.home,x.la,m?m.hs:'',m&&m.pens?m.pens.h:'')+row(x.away,x.lb,m?m.as:'',m&&m.pens?m.pens.a:'')+meta+'</button>';
}
function viewKo(c){
  var R=koResolve(c),fin=R.F,champ=fin.m&&fin.m.played?koWinner(fin.m):null;
  var D=koDefs(c),rs=[];D.forEach(function(d){if(d.r<5&&rs.indexOf(d.r)<0)rs.push(d.r);});
  var desc=hasInter(c)?'Clasifican las 2 primeras de cada grupo de la fase 2. Cada 1° enfrenta al 2° del grupo vecino, y los dos clasificados de un mismo grupo van por lados opuestos del cuadro, así solo podrían volver a verse en la final.':c.qualify===8?'Clasifican las 8 primeras de la tabla a cuartos de final: 1° vs 8°, 2° vs 7°, 3° vs 6° y 4° vs 5°. En semifinales se cruzan la ganadora de 1°–8° con la de 4°–5°, y la de 2°–7° con la de 3°–6°.':'Clasifican las 4 primeras de la tabla a semifinales: 1° vs 4° y 2° vs 3°. Las ganadoras juegan la final.';
  var h='<div class="sechead"><div><h2>Eliminación directa</h2><p>'+desc+(c.third?' Las perdedoras de semifinales juegan por el tercer puesto.':'')+' Si hay empate se define por penales, sin tiempo extra.</p></div><div class="acts">'+(canWrite?'<button class="btn" data-form="cfg">Equipos y formato</button>':'')+'</div></div>';
  var first=KO_NAMES[rs[0]-1].toLowerCase();
  if(hasInter(c)&&!c.fase2)h+='<div class="note">Los cruces se llenan cuando se haga el sorteo de la fase 2. Por ahora se ve la estructura del cuadro.</div>';
  else if(!koReady(c))h+='<div class="note"><b>Proyección:</b> '+(hasInter(c)?'los '+first+' se calculan con la tabla actual de la fase 2':'los cruces de '+first+' se calculan con la tabla actual')+' y se actualizan con cada resultado.'+(ui.edit?' Toca un cruce para cargar su planilla.':'')+'</div>';
  else if(ui.edit)h+='<div class="note">Toca un cruce para cargar su planilla: marcador, penales si hay empate, goleadoras y observaciones.</div>';
  h+='<div class="bwrap"><div class="bracket" style="grid-template-columns:repeat('+rs.length+',minmax(200px,1fr)) minmax(180px,.8fr);min-width:'+(rs.length*216+196)+'px">';
  rs.forEach(function(r){h+='<div class="bcol"><div class="bh">'+KO_NAMES[r-1]+'</div><div class="bms">'+D.filter(function(d){return d.r===r;}).map(function(d){return koBox(c,R[d.id]);}).join('')+(r===4&&R.T?'<div class="bh" style="margin-top:10px">Tercer puesto</div>'+koBox(c,R.T):'')+'</div></div>';});
  h+='<div class="bcol"><div class="bh">Campeonas</div><div class="bms"><div class="champ'+(champ?' on':'')+'"><span class="cup">🏆</span><b>'+(champ?esc(tname(c,champ)):'Por definir')+'</b><span>Campeonas Copa Malala\'s 2026 · '+esc(c.name)+'</span></div></div></div>';
  h+='</div></div>';
  return h;
}
function koOpen(id){
  var c=cat(),R=koResolve(c),x=R[id];if(!x)return;
  if(x.m&&(!ui.edit||!canWrite))return matchModal(x.m.id);
  if(!ui.edit||!canWrite){toast(x.home&&x.away?'Partido por jugar':'Este cruce aún no tiene equipos definidos');return;}
  if(!x.home||!x.away){toast('Este cruce aún no tiene equipos definidos');return;}
  var m=x.m?clone(x.m):{id:'KO-'+id,phase:'eliminatoria',group:'',ko:id,round:x.def.r,date:'',time:'',venue:'',hs:null,as:null,played:false,imported:false,goals:[],jl:{},notes:''};
  if(!m.played){m.home=x.home;m.away=x.away;}
  editor(m);
}

/* ---------- sorteo en vivo (Propuesta 3) ---------- */
function rnd(n){try{var a=new Uint32Array(1);crypto.getRandomValues(a);return a[0]%n;}catch(e){return Math.floor(Math.random()*n);}}
function drawSave(){try{sessionStorage.setItem('malalas-draw',JSON.stringify(ui.draw));}catch(e){}}
function drawLoad(){try{var d=JSON.parse(sessionStorage.getItem('malalas-draw')||'null');if(d&&d.cat===ui.cat)ui.draw=d;}catch(e){}}
function drawInit(c,base,heads){
  var rk={};p1Rows(c).forEach(function(r,i){rk[r.id]=i+1;});
  var gpos={};c.groups.forEach(function(g){groupRows(c,g).forEach(function(r,i){gpos[r.id]=g+(i+1);});});
  var pots=[[],[],[],[]];
  if(base==='pos'){P2.forEach(function(row){row.forEach(function(code,p){var r=groupRows(c,code.charAt(0))[+code.slice(1)-1];if(r)pots[p].push(r.id);});});}
  else{p1Rows(c).forEach(function(r,i){pots[Math.min(3,Math.floor(i/(c.teams.length/4)))].push(r.id);});}
  var tm=teamMap(c),info={};c.teams.forEach(function(t){info[t.id]={id:t.id,rank:rk[t.id],orig:t.group,tag:gpos[t.id]};});
  var G=c.teams.length/4,groups=[];for(var g=0;g<G;g++)groups.push([null,null,null,null]);
  ui.draw={cat:ui.cat,base:base,heads:heads,pots:pots,info:info,groups:groups,log:[],last:null};
  if(heads==='fixed'){pots[0].slice().sort(function(a,b){return info[a].rank-info[b].rank;}).forEach(function(id,i){groups[i][0]=id;ui.draw.log.push({id:id,g:i,p:0,fixed:true});});}
  drawSave();
}
function drawDrawn(D){var s={};D.groups.forEach(function(g){g.forEach(function(id){if(id)s[id]=1;});});return s;}
function drawPot(D){var s=drawDrawn(D);for(var p=0;p<4;p++){if(D.pots[p].some(function(id){return !s[id];}))return p;}return -1;}
function drawFeasible(D){
  var s=drawDrawn(D),rest=[];for(var p=0;p<4;p++)D.pots[p].forEach(function(id){if(!s[id])rest.push({id:id,p:p});});
  var G=D.groups.map(function(g){return g.slice();});
  function ok(g,id){return !G[g].some(function(x){return x&&D.info[x].orig===D.info[id].orig;});}
  function go(i){if(i===rest.length)return true;var t=rest[i];for(var g=0;g<G.length;g++){if(G[g][t.p]||!ok(g,t.id))continue;G[g][t.p]=t.id;if(go(i+1))return true;G[g][t.p]=null;}return false;}
  return go(0);
}
function drawPlace(D,id){
  var p=drawPot(D);
  for(var g=0;g<D.groups.length;g++){
    if(D.groups[g][p])continue;
    if(D.groups[g].some(function(x){return x&&D.info[x].orig===D.info[id].orig;}))continue;
    D.groups[g][p]=id;if(drawFeasible(D)){D.log.push({id:id,g:g,p:p});D.last={id:id,g:g,p:p,skipped:g};return g;}
    D.groups[g][p]=null;
  }
  return -1;
}
function drawPick(D){var p=drawPot(D),s=drawDrawn(D);var left=D.pots[p].filter(function(id){return !s[id];});return left[rnd(left.length)];}
function drawGroupsOut(c){
  var D=ui.draw;if(!D||D.cat!==ui.cat)return {ok:false,groups:[],method:'draw'};
  var done=drawPot(D)===-1;
  return {ok:done,method:'draw',groups:D.groups.map(function(g,gi){return {id:gi+1,teams:g.map(function(id,p){return id?{id:id,rank:D.info[id].rank,pot:p+1,orig:D.info[id].orig,tag:D.info[id].tag}:null;}).filter(Boolean)};})};
}
function drawView(c){
  if(!ui.draw||ui.draw.cat!==ui.cat)drawInit(c,ui.drawBase||'rank',ui.drawHeads||'draw');
  var D=ui.draw,s=drawDrawn(D),p=drawPot(D),total=c.teams.length,n=Object.keys(s).length,started=D.log.some(function(x){return !x.fixed;});
  var potNames=['Bombo 1 · cabezas','Bombo 2','Bombo 3','Bombo 4'];
  var h='';
  h+='<div class="f2bar"><span class="f2pill">Sorteo</span><span><b>'+n+' de '+total+'</b> equipos ubicados'+(p>=0?' · ahora sale el <b>'+potNames[p]+'</b>':' · <b>sorteo terminado</b>')+'</span>';
  if(!started){
    h+='<span class="seg" role="group" aria-label="Base de los bombos"><button data-drawbase="rank" aria-pressed="'+(D.base==='rank')+'">Bombos por reclasificación</button><button data-drawbase="pos" aria-pressed="'+(D.base==='pos')+'">Bombos por posición</button></span>';
    h+='<span class="seg" role="group" aria-label="Cabezas de grupo"><button data-drawheads="draw" aria-pressed="'+(D.heads==='draw')+'">Cabezas sorteadas</button><button data-drawheads="fixed" aria-pressed="'+(D.heads==='fixed')+'">Cabezas fijas (1° al G1…)</button></span>';
  }
  h+='<button class="btn" id="draw-reset" style="margin-left:auto">Reiniciar sorteo</button>';
  if(p===-1)h+='<button class="btn pri" id="f2-confirm">Usar este sorteo y crear los '+(D.groups.length*6)+' partidos</button>';
  h+='</div>';
  if(!started)h+='<div class="note">Antes de empezar pueden acomodar los bombos: toca <b>⇄</b> en un equipo y luego en otro (de cualquier bombo) para intercambiarlos. Cada bolita cae en el primer grupo libre, en orden, donde no tenga un rival de su mismo grupo de la fase 1 y sin trancar el resto del sorteo.</div>';
  /* escenario */
  var last=D.last&&D.last.id?D.info[D.last.id]:null;
  h+='<section class="drawstage" id="drawstage"><div class="dleft"><div class="eyebrow">Copa Malala\'s 2026 · Sorteo fase intergrupos</div>';
  h+='<button class="ball'+(last?' pop':'')+'" id="ball"'+(canWrite&&p>=0?' title="Toca la bolita para sacar el siguiente equipo"':' disabled')+'>'+(last?'<span class="bp">'+potNames[D.last.p]+'</span><b>'+esc(tname(c,last.id))+'</b><span class="bo">'+gb(c,last.orig)+' '+esc(last.tag||'')+'</span>':'<span class="bp">'+(p>=0?potNames[p]:'Listo')+'</span><b>'+(p>=0?'¿Quién sale?':'¡Sorteo completo!')+'</b>'+(canWrite&&p>=0&&!last?'<span class="bo">Toca para sacar</span>':''))+'</button>';
  h+='<div class="dest" id="dest">'+(last?'→ Grupo '+(D.last.g+1):'&nbsp;')+'</div>';
  if(canWrite){h+='<div class="dctl">'+(p>=0?'<button class="btn pri big" id="draw-next">Sacar bolita</button><button class="btn ghost" id="draw-pot">Sortear bombo completo</button>':'')+(D.log.some(function(x){return !x.fixed;})?'<button class="btn ghost" id="draw-undo">Deshacer última</button>':'')+'<button class="btn ghost" id="draw-full">Pantalla completa</button></div>';}
  h+='</div><div class="dgroups">';
  D.groups.forEach(function(g,gi){h+='<div class="dg'+(D.last&&D.last.g===gi?' hot':'')+'"><b>Grupo '+(gi+1)+'</b>'+g.map(function(id,pp){var isNew=D.last&&D.last.g===gi&&D.last.p===pp;return '<span class="slot'+(id?' on':'')+(isNew?' new':'')+'">'+(id?gb(c,D.info[id].orig)+'<i>'+esc(tname(c,id))+'</i>':'<i>Bombo '+(pp+1)+'</i>')+'</span>';}).join('')+'</div>';});
  h+='</div></section>';
  /* bombos */
  h+='<div class="pots" style="margin-top:14px">';
  D.pots.forEach(function(pt,pi){h+='<div class="pot'+(pi===p?' cur':'')+'"><h4>'+potNames[pi]+'<small>'+pt.filter(function(id){return !s[id];}).length+' por salir</small></h4><ol>'+pt.map(function(id,ii){var x=D.info[id],sel=ui.drawSel&&ui.drawSel.p===pi&&ui.drawSel.i===ii;var gi=-1;D.groups.forEach(function(g,k){if(g.indexOf(id)>=0)gi=k;});
    return '<li class="'+(s[id]?'out':'')+(sel?' sel':'')+'">'+(canWrite&&!started?'<button class="swap" data-drawpick="'+pi+':'+ii+'" aria-pressed="'+!!sel+'" aria-label="Mover '+esc(tname(c,id))+'">⇄</button>':'<span class="seed">'+x.rank+'</span>')+gb(c,x.orig)+'<span class="pn">'+esc(tname(c,id))+'</span><span class="pg">'+(gi>=0?'G'+(gi+1):esc(x.tag||''))+'</span></li>';}).join('')+'</ol></div>';});
  h+='</div>';
  if(D.log.length){h+='<div class="card dlog"><div class="sub">Orden de salida</div><ol>'+D.log.map(function(x){return '<li>'+esc(tname(c,x.id))+' <span>→ Grupo '+(x.g+1)+(x.fixed?' (cabeza fija)':'')+'</span></li>';}).join('')+'</ol></div>';}
  return h;
}
function drawAnimate(done){
  var c=cat(),D=ui.draw,p=drawPot(D),s=drawDrawn(D),left=D.pots[p].filter(function(id){return !s[id];});
  var ball=document.getElementById('ball'),dest=document.getElementById('dest');var reduce=false;try{reduce=window.matchMedia('(prefers-reduced-motion: reduce)').matches;}catch(e){}
  if(!ball||reduce||left.length<2){done();return;}
  ['draw-next','draw-pot','draw-undo'].forEach(function(id){var b=document.getElementById(id);if(b)b.disabled=true;});
  ball.className='ball roll';if(dest)dest.innerHTML='&nbsp;';
  var t0=Date.now(),k=0;(function tick(){var id=left[(k++)%left.length];ball.innerHTML='<span class="bp">Bombo '+(p+1)+'</span><b>'+esc(tname(c,id))+'</b>';var el=Date.now()-t0;if(el<1600)setTimeout(tick,60+el/18);else done();})();
}

/* ---------- información: novedades, documentos, redes, patrocinadores ---------- */
var NEWS_CATS=['Noticia','Comunicado','Informe','Nota','Programación','Resultados'];
var SOCIALS=[['instagram','Instagram'],['facebook','Facebook'],['tiktok','TikTok'],['youtube','YouTube'],['whatsapp','WhatsApp'],['web','Sitio web']];
function info(){if(!S.info)S.info={news:[],docs:[],social:{},sponsors:[]};['news','docs','sponsors'].forEach(function(k){if(!S.info[k])S.info[k]=[];});if(!S.info.social)S.info.social={};return S.info;}
function safeUrl(u){u=String(u||'').trim();if(!u)return '';if(/^(https?:)?\/\//i.test(u))return u.replace(/^\/\//,'https://');if(/^[\w.-]+\.[a-z]{2,}/i.test(u))return 'https://'+u;return '';}
function uid(){return Date.now().toString(36)+Math.random().toString(36).slice(2,6);}
function socialRow(cls){var s=info().social,list=SOCIALS.filter(function(x){return safeUrl(s[x[0]]);});if(!list.length)return '';return '<div class="'+cls+'">'+list.map(function(x){return '<a class="soc soc-'+x[0]+'" href="'+esc(safeUrl(s[x[0]]))+'" target="_blank" rel="noopener">'+x[1]+'</a>';}).join('')+'</div>';}
function viewNov(c){
  var I=info(),news=I.news.slice().sort(function(a,b){return (b.date||'').localeCompare(a.date||'')||(b.id>a.id?1:-1);});
  var h='<div class="sechead"><div><h2>Novedades</h2><p>Noticias, comunicados, informes y todo lo que pasa en la Copa Malala\'s.</p></div><div class="acts">'+(ui.edit?'<button class="btn" data-form="social">Editar redes sociales</button><button class="btn pri" data-form="news">+ Publicar novedad</button>':'')+'</div></div>';
  var sr=socialRow('socials');h+=sr?'<div class="card socbox"><span class="sub">Síguenos</span>'+sr+'</div>':(ui.edit?'<div class="note">Aún no hay redes sociales. Agrégalas con “Editar redes sociales”.</div>':'');
  if(!news.length)return h+'<div class="card empty">Todavía no hay novedades publicadas.'+(ui.edit?' Usa “Publicar novedad” para crear la primera.':'')+'</div>';
  h+='<div class="newsgrid">'+news.map(function(n){return '<article class="news card">'+(n.img?'<img src="'+esc(n.img)+'" alt="">':'')+'<div class="nb"><div class="nm"><span class="ncat">'+esc(n.cat||'Noticia')+'</span><span>'+esc(fmtLong(n.date))+'</span></div><h3>'+esc(n.title)+'</h3><p>'+esc(n.body||'')+'</p>'+(safeUrl(n.link)?'<a class="nlink" href="'+esc(safeUrl(n.link))+'" target="_blank" rel="noopener">Ver más →</a>':'')+(ui.edit?'<div class="nact"><button class="btn" data-form="news" data-fid="'+esc(n.id)+'">Editar</button><button class="btn dng" data-del="news" data-fid="'+esc(n.id)+'">Eliminar</button></div>':'')+'</div></article>';}).join('')+'</div>';
  return h;
}
function viewDoc(c){
  var I=info();
  var h='<div class="sechead"><div><h2>Reglamento y documentos</h2><p>Reglamento oficial, formatos, comunicados y demás documentos del torneo.</p></div><div class="acts">'+(canWrite?'<button class="btn pri" data-form="doc">+ Agregar documento</button>':'')+'</div></div>';
  var hasDoc=I.docs.some(function(d){return d.url||d.file||d.text;});
  if(canWrite&&!hasDoc)h+='<div class="docup"><b>Sube aquí el reglamento</b><p>Pega el enlace de Google Drive (recomendado para PDF pesados), adjunta un archivo pequeño o pega el texto.</p>'+(I.docs[0]?'<button class="btn pri" data-form="doc" data-fid="'+esc(I.docs[0].id)+'">Cargar reglamento</button>':'<button class="btn pri" data-form="doc">Cargar reglamento</button>')+'</div>';
  if(!I.docs.length)return h+'<div class="card empty">Todavía no hay documentos.</div>';
  h+='<div class="docs">'+I.docs.map(function(d){var u=safeUrl(d.url);return '<article class="doc card"><div class="dic">'+(d.file?esc((d.file.name.split('.').pop()||'').toUpperCase().slice(0,4)):u?'LINK':'TXT')+'</div><div class="db"><h3>'+esc(d.title)+'</h3>'+(d.desc?'<p>'+esc(d.desc)+'</p>':'')+'<div class="dact">'+(u?'<a class="btn exp" href="'+esc(u)+'" target="_blank" rel="noopener">Abrir documento</a>':'')+(d.file?'<button class="btn exp" data-dl="'+esc(d.id)+'">Descargar '+esc(d.file.name)+'</button>':'')+(!u&&!d.file&&!d.text?'<span style="font-size:12.5px;color:var(--muted)">Muy pronto disponible aquí.</span>':'')+(canWrite?'<button class="btn" data-form="doc" data-fid="'+esc(d.id)+'">Editar</button><button class="btn dng" data-del="docs" data-fid="'+esc(d.id)+'">Eliminar</button>':'')+'</div>'+(d.text?'<details'+(I.docs.length===1?' open':'')+'><summary>Ver contenido</summary><div class="dtext">'+esc(d.text)+'</div></details>':'')+'</div></article>';}).join('')+'</div>';
  return h;
}
function footer(){
  var I=info(),sp=I.sponsors;
  var h='<footer class="sitefoot"><div class="wrap"><div class="fhead"><h3>Patrocinadores</h3>'+(ui.edit?'<button class="btn" data-form="sponsor">+ Agregar patrocinador</button>':'')+'</div>';
  h+=sp.length?'<div class="sponsors">'+sp.map(function(s){var u=safeUrl(s.url),inner=(s.logo?'<img src="'+esc(s.logo)+'" alt="'+esc(s.name)+'">':'<b>'+esc(s.name)+'</b>')+(s.role?'<span>'+esc(s.role)+'</span>':'');return '<div class="spon">'+(u?'<a href="'+esc(u)+'" target="_blank" rel="noopener">'+inner+'</a>':inner)+(ui.edit?'<span class="sact"><button class="btn" data-form="sponsor" data-fid="'+esc(s.id)+'">Editar</button><button class="btn dng" data-del="sponsors" data-fid="'+esc(s.id)+'">×</button></span>':'')+'</div>';}).join('')+'</div>':'<p class="fnote">Espacio reservado para los patrocinadores de la Copa Malala\'s.</p>';
  h+=socialRow('socials foot')+'<p class="fnote">Copa Malala\'s 2026 · Supercopa de la No Violencia · Categoría Libre Femenina · Medellín</p></div></footer>';
  return h;
}
function openForm(kind,id){
  var I=info(),x=null,list={news:I.news,doc:I.docs,sponsor:I.sponsors}[kind];if(id&&list)x=list.filter(function(o){return o.id===id;})[0];
  ui.form={kind:kind,id:id||null,img:x&&(x.img||x.logo)||'',file:x&&x.file||null};
  var T={news:x?'Editar novedad':'Publicar novedad',doc:x?'Editar documento':'Agregar documento',sponsor:x?'Editar patrocinador':'Agregar patrocinador',social:'Redes sociales',cfg:'Equipos y formato · '+cat().name}[kind];
  var h='<div class="mhead"><div><div class="eyebrow">Copa Malala\'s 2026</div><h3 style="font-size:24px">'+T+'</h3></div><button class="x" data-close aria-label="Cerrar">×</button></div><div class="mbody">';
  if(kind==='news'){
    h+='<label class="f">Título<input class="inp" id="fm-title" value="'+esc(x?x.title:'')+'"></label><div class="fgrid"><label class="f">Tipo<select class="inp" id="fm-cat">'+NEWS_CATS.map(function(k){return '<option'+(x&&x.cat===k?' selected':'')+'>'+k+'</option>';}).join('')+'</select></label><label class="f">Fecha<input class="inp" id="fm-date" type="date" value="'+esc(x?x.date:today())+'"></label></div>';
    h+='<label class="f">Texto<textarea class="inp" id="fm-body" style="min-height:140px">'+esc(x?x.body:'')+'</textarea></label><label class="f">Enlace (opcional, por ejemplo la publicación en Instagram)<input class="inp" id="fm-link" value="'+esc(x?x.link||'':'')+'" placeholder="https://"></label>';
    h+='<label class="f">Imagen (opcional)<input class="inp" id="fm-img" type="file" accept="image/*"></label><div id="fm-prev">'+(ui.form.img?'<img class="fprev" src="'+esc(ui.form.img)+'" alt=""><button class="btn" id="fm-noimg">Quitar imagen</button>':'')+'</div>';
  }else if(kind==='doc'){
    h+='<label class="f">Título<input class="inp" id="fm-title" value="'+esc(x?x.title:'')+'"></label><label class="f">Descripción<input class="inp" id="fm-desc" value="'+esc(x?x.desc||'':'')+'"></label>';
    h+='<label class="f">Enlace al documento (Google Drive, Dropbox…)<input class="inp" id="fm-url" value="'+esc(x?x.url||'':'')+'" placeholder="https://"></label>';
    h+='<label class="f">O subir archivo (máximo 2 MB)<input class="inp" id="fm-file" type="file" accept=".pdf,.doc,.docx,.xlsx,.png,.jpg,.jpeg"></label><div id="fm-fileinfo" class="sub">'+(ui.form.file?'Archivo actual: '+esc(ui.form.file.name)+' <button class="btn" id="fm-nofile">Quitar</button>':'')+'</div>';
    h+='<label class="f">Texto (opcional, se muestra en la página)<textarea class="inp" id="fm-text" style="min-height:120px">'+esc(x?x.text||'':'')+'</textarea></label>';
    h+='<p class="note" style="margin:0">Para archivos pesados, como el reglamento en PDF de 8 MB, lo mejor es subirlo a Google Drive y pegar aquí el enlace compartido.</p>';
  }else if(kind==='sponsor'){
    h+='<div class="fgrid"><label class="f">Nombre<input class="inp" id="fm-title" value="'+esc(x?x.name:'')+'"></label><label class="f">Detalle (opcional)<input class="inp" id="fm-role" value="'+esc(x?x.role||'':'')+'" placeholder="Patrocinador oficial"></label></div><label class="f">Enlace (opcional)<input class="inp" id="fm-url" value="'+esc(x?x.url||'':'')+'" placeholder="https://"></label>';
    h+='<label class="f">Logo<input class="inp" id="fm-img" type="file" accept="image/*"></label><div id="fm-prev">'+(ui.form.img?'<img class="fprev logo" src="'+esc(ui.form.img)+'" alt=""><button class="btn" id="fm-noimg">Quitar logo</button>':'')+'</div>';
  }else if(kind==='cfg'){
    var c=cat();
    h+='<div class="sub">Nombres de los equipos</div><div class="fgrid">'+c.teams.map(function(t){return '<label class="f">'+(multi(c)?'Grupo '+esc(t.group):'Equipo')+'<input class="inp" data-tn="'+esc(t.id)+'" value="'+esc(t.name)+'"></label>';}).join('')+'</div><p class="note" style="margin:0">El cambio de nombre se aplica en tablas, partidos, goleadoras y cruces; los resultados no se tocan.</p>';
    if(!multi(c))h+='<div class="sub">Fase de grupos</div><label class="f">Formato<select class="inp" id="fm-legs"><option value="1"'+(legs(c)===1?' selected':'')+'>Una vuelta · todas contra todas una vez</option><option value="2"'+(legs(c)===2?' selected':'')+'>Dos vueltas · ida y vuelta</option></select></label><p class="note" style="margin:0">Con dos vueltas se agregan las fechas de vuelta al final del calendario, con local y visitante invertidos y el mismo equipo de descanso.</p>';
    if(hasKo(c))h+='<div class="sub">Eliminación directa</div><label class="ck" style="justify-content:flex-start;gap:10px;font-size:14px"><input type="checkbox" id="fm-third"'+(c.third?' checked':'')+'> Jugar partido por el tercer puesto (perdedoras de semifinales)</label>';
  }else if(kind==='social'){
    h+=SOCIALS.map(function(sx){return '<label class="f">'+sx[1]+'<input class="inp" data-soc="'+sx[0]+'" value="'+esc(I.social[sx[0]]||'')+'" placeholder="'+(sx[0]==='whatsapp'?'https://wa.me/57…':'https://')+'"></label>';}).join('');
  }
  h+='</div><div class="mfoot"><button class="btn" data-close>Cancelar</button><button class="btn pri" id="fm-save">Guardar</button></div>';
  openModal(h);
}
function readImg(file,maxW,type,q){return new Promise(function(res,rej){var fr=new FileReader();fr.onload=function(){var im=new Image();im.onload=function(){var s=Math.min(1,maxW/im.width),cv=document.createElement('canvas');cv.width=Math.max(1,Math.round(im.width*s));cv.height=Math.max(1,Math.round(im.height*s));var x=cv.getContext('2d');if(type==='image/jpeg'){x.fillStyle='#fff';x.fillRect(0,0,cv.width,cv.height);}x.drawImage(im,0,0,cv.width,cv.height);res(cv.toDataURL(type,q));};im.onerror=rej;im.src=fr.result;};fr.onerror=rej;fr.readAsDataURL(file);});}
function readFile(file){return new Promise(function(res,rej){var fr=new FileReader();fr.onload=function(){res(fr.result);};fr.onerror=rej;fr.readAsDataURL(file);});}
function dataBlob(u){var p=u.split(','),bin=atob(p[1]),a=new Uint8Array(bin.length);for(var i=0;i<bin.length;i++)a[i]=bin.charCodeAt(i);return new Blob([a]);}
function saveForm(){
  var f=ui.form,I=info(),v=function(id){var el=document.getElementById(id);return el?el.value.trim():'';};
  if(f.kind==='social'){modal.querySelectorAll('[data-soc]').forEach(function(el){var u=el.value.trim();if(u&&!safeUrl(u)){u='';}if(u)I.social[el.dataset.soc]=safeUrl(u);else delete I.social[el.dataset.soc];});note('Redes sociales actualizadas');closeModal();render();return;}
  if(f.kind==='cfg'){var c=cat(),ch=[],tm=teamMap(c);
    var lg=document.getElementById('fm-legs');if(lg&&+lg.value!==legs(c)){var er=setLegs(c,+lg.value);if(er){toast(er);return;}ch.push(+lg.value===2?'fase a dos vueltas':'fase a una vuelta');}
    var th=document.getElementById('fm-third');if(th&&th.checked!==!!c.third){var tm3=koMatch(c,'T');if(!th.checked&&tm3&&tm3.played){toast('El partido por el tercer puesto ya tiene resultado');return;}c.third=th.checked;if(!c.third)c.matches=c.matches.filter(function(m){return m.id!=='KO-T';});ch.push(c.third?'con tercer puesto':'sin tercer puesto');}
    modal.querySelectorAll('[data-tn]').forEach(function(el){var x=tm[el.dataset.tn],nv=el.value.trim().replace(/\s+/g,' ').toUpperCase();if(x&&nv&&nv!==x.name){ch.push(x.name+' → '+nv);x.name=nv;}});
    closeModal();if(ch.length){note(c.short+': '+ch.join(' · '));toast('Guardado. Publica para que lo vean todos.');}else toast('Sin cambios');render();return;}
  var title=v('fm-title');if(!title){toast('Escribe un '+(f.kind==='sponsor'?'nombre':'título'));return;}
  var list={news:I.news,doc:I.docs,sponsor:I.sponsors}[f.kind],x=f.id?list.filter(function(o){return o.id===f.id;})[0]:null;
  if(!x){x={id:uid()};list.push(x);}
  if(f.kind==='news'){x.title=title;x.cat=v('fm-cat');x.date=v('fm-date')||today();x.body=v('fm-body');x.link=safeUrl(v('fm-link'));x.img=f.img||'';}
  if(f.kind==='doc'){x.title=title;x.desc=v('fm-desc');x.url=safeUrl(v('fm-url'));x.text=v('fm-text');x.file=f.file||null;}
  if(f.kind==='sponsor'){x.name=title;x.role=v('fm-role');x.url=safeUrl(v('fm-url'));x.logo=f.img||'';}
  note({news:'Novedad: ',doc:'Documento: ',sponsor:'Patrocinador: '}[f.kind]+title);closeModal();render();toast('Guardado. Publica para que lo vean todos.');
}
function onFormFile(t){
  var file=t.files&&t.files[0];if(!file||!ui.form)return;
  if(t.id==='fm-img'){var logo=ui.form.kind==='sponsor';readImg(file,logo?480:1200,logo?'image/png':'image/jpeg',.82).then(function(d){if(d.length>900000){toast('La imagen es muy pesada; usa una más liviana');return;}ui.form.img=d;var pv=document.getElementById('fm-prev');if(pv)pv.innerHTML='<img class="fprev'+(logo?' logo':'')+'" src="'+d+'" alt=""><button class="btn" id="fm-noimg">Quitar</button>';}).catch(function(){toast('No se pudo leer la imagen');});}
  if(t.id==='fm-file'){if(file.size>2*1024*1024){toast('El archivo pesa más de 2 MB. Súbelo a Drive y pega el enlace.');t.value='';return;}readFile(file).then(function(d){ui.form.file={name:file.name,data:d,size:file.size};var fi=document.getElementById('fm-fileinfo');if(fi)fi.innerHTML='Archivo listo: '+esc(file.name)+' ('+Math.round(file.size/1024)+' KB)';}).catch(function(){toast('No se pudo leer el archivo');});}
}
function downloadDoc(id){
  var d=info().docs.filter(function(x){return x.id===id;})[0];if(!d||!d.file)return;
  if(!dlApi){toast('La descarga no está disponible en esta vista');return;}
  dlApi.save({filename:d.file.name,data:dataBlob(d.file.data)}).catch(function(e){if(e&&e.code==='rejected_extension')toast('Ese tipo de archivo no se puede descargar aquí; usa un enlace');else if(!(e&&e.code==='declined'))toast('No se pudo descargar');});
}

/* ---------- interno: W.O. ---------- */
var WO_RX=/\bW\.?\s?O\b/i;
function woSide(m){if(!m.played)return null;if(m.wo==='h'||m.wo==='a')return {s:m.wo,inferred:false};if(m.wo==='none')return null;if(!WO_RX.test(m.notes||''))return null;
  var jh=jlTotal(m.jl&&m.jl.h),ja=jlTotal(m.jl&&m.jl.a);
  if(jh!=null&&ja!=null&&jh!==ja)return {s:jh<ja?'h':'a',inferred:true};
  if(+m.hs!==+m.as)return {s:+m.hs<+m.as?'h':'a',inferred:true};return null;}
function woFee(c){return (c.refFee||(c.short==='F7'?45000:60000))+5000;}
function money(n){return '$'+String(Math.round(n)).replace(/\B(?=(\d{3})+(?!\d))/g,'.');}
function viewInt(c){
  if(!canWrite)return '<div class="empty card">Esta vista es solo para la organización.</div>';
  var list=[];c.matches.forEach(function(m){var w=woSide(m);if(w)list.push({m:m,team:w.s==='h'?m.home:m.away,rival:w.s==='h'?m.away:m.home,side:w.s,inferred:w.inferred});});
  var by={};list.forEach(function(x){(by[x.team]=by[x.team]||[]).push(x);});
  var teams=Object.keys(by).sort(function(a,b){return by[b].length-by[a].length||tname(c,a).localeCompare(tname(c,b));});
  var fee=woFee(c),owed=list.filter(function(x){return !x.m.woPaid;}).length*fee,paid=list.filter(function(x){return x.m.woPaid;}).length*fee;
  var h='<div class="sechead"><div><h2>Interna · W.O.</h2><p>Vista solo para la organización: aparece únicamente a quienes pueden editar la página. Reglamento: la inasistencia obliga a pagar el arbitraje completo ('+money(fee-5000)+') más $5.000 de multa, y el W descuenta 10 puntos de juego limpio.</p></div></div>';
  h+='<div class="minis"><div class="mini"><span>W.O. registrados</span><b>'+list.length+'</b><small>en '+teams.length+' equipos</small></div><div class="mini"><span>Por cobrar</span><b style="color:var(--bad)">'+money(owed)+'</b><small>'+list.filter(function(x){return !x.m.woPaid;}).length+' sin pagar · '+money(fee)+' cada uno</small></div><div class="mini"><span>Pagado</span><b style="color:var(--good)">'+money(paid)+'</b><small>'+list.filter(function(x){return x.m.woPaid;}).length+' W.O. saldados</small></div><div class="mini"><span>Reincidentes</span><b>'+teams.filter(function(t){return by[t].length>1;}).length+'</b><small>equipos con 2 o más W.O.</small></div></div>';
  if(!list.length)return h+'<div class="empty card">No hay W.O. registrados. Se marcan en la planilla del partido, en el campo “W.O.”.</div>';
  h+='<div class="tw"><table><thead><tr><th class="l">Equipo</th>'+(multi(c)?'<th>Gr</th>':'')+'<th>W.O.</th><th class="l">Partido</th><th>JL del partido</th><th>Multa</th><th>Pagado</th></tr></thead><tbody>';
  teams.forEach(function(tid){var t=teamMap(c)[tid];by[tid].forEach(function(x,i){var m=x.m,j=jlTotal(m.jl&&m.jl[x.side]);
    h+='<tr class="'+(i===0?'wofirst':'')+'">'+(i===0?'<td class="l" rowspan="'+by[tid].length+'">'+tl(tid,t.name)+(by[tid].length>1?' <span class="wochip">Reincidente</span>':'')+'</td>'+(multi(c)?'<td rowspan="'+by[tid].length+'">'+gb(c,t.group)+'</td>':'')+'<td rowspan="'+by[tid].length+'" class="pts">'+by[tid].length+'</td>':'');
    h+='<td class="l"><button class="tlink" data-match="'+esc(m.id)+'">'+(m.phase==='intergrupos'?'Inter. ':'F')+m.round+' · vs '+esc(tname(c,x.rival))+' ('+m.hs+'–'+m.as+')</button>'+(x.inferred?' <span class="wochip warn" title="Se dedujo de la nota W.O.; confírmalo en la planilla">Por confirmar</span>':'')+'</td>';
    h+='<td><span class="jlv '+(j!=null&&j<=-10?'':'low')+'">'+(j==null?'–':j)+'</span>'+(j!=null&&j>-10?'<span class="jlavg">reglamento: −10</span>':'')+'</td><td>'+money(fee)+'</td>';
    h+='<td><label class="paid"><input type="checkbox" data-wopaid="'+esc(m.id)+'"'+(m.woPaid?' checked':'')+'> '+(m.woPaid?'Sí':'No')+'</label></td></tr>';});});
  h+='</tbody></table></div>';
  h+='<p class="note" style="margin-top:10px">Para registrar o corregir un W.O., abre la planilla del partido en modo edición y elige quién no se presentó. Los marcados “Por confirmar” salen de la nota “W.O.” de la planilla: el sistema supone que no se presentó el equipo con menos juego limpio o el que perdió.</p>';
  return h;
}

/* ---------- stats ---------- */
function stats(c){
  var pl=played(c),rows=allRows(c),st={pl:pl,rows:rows};
  st.goals=pl.reduce(function(s,m){return s+(+m.hs)+(+m.as);},0);
  st.home=pl.filter(function(m){return +m.hs>+m.as;}).length;st.draw=pl.filter(function(m){return +m.hs===+m.as;}).length;st.away=pl.length-st.home-st.draw;
  var br={};pl.forEach(function(m){var k=roundKey(m);(br[k]=br[k]||{k:mKey(m),lab:m.phase==='eliminatoria'?KO_SHORT[m.round-1]:(m.phase==='intergrupos'?'F2·':'F')+m.round,g:0,n:0});br[k].g+=(+m.hs)+(+m.as);br[k].n++;});
  st.byRound=Object.keys(br).map(function(k){return br[k];}).sort(function(a,b){return a.k-b.k;});
  st.big=pl.slice().sort(function(a,b){return Math.abs(b.hs-b.as)-Math.abs(a.hs-a.as)||(b.hs+b.as)-(a.hs+a.as);}).slice(0,5);
  st.most=pl.slice().sort(function(a,b){return (+b.hs+ +b.as)-(+a.hs+ +a.as);}).slice(0,5);
  st.zeroZero=pl.filter(function(m){return +m.hs===0&&+m.as===0;}).length;
  var withPj=rows.filter(function(r){return r.pj>0;});
  st.attack=withPj.slice().sort(function(a,b){return b.gf/b.pj-a.gf/a.pj;}).slice(0,5);
  st.defense=withPj.slice().sort(function(a,b){return a.gc/a.pj-b.gc/b.pj||b.pj-a.pj;}).slice(0,5);
  st.clean=withPj.slice().sort(function(a,b){return b.cs-a.cs||a.gc-b.gc;}).slice(0,5);
  st.eff=withPj.slice().sort(function(a,b){return b.pts/(3*b.pj)-a.pts/(3*a.pj)||b.pj-a.pj;}).slice(0,5);
  withPj.forEach(function(r){var s=0;for(var i=r.form.length-1;i>=0&&r.form[i]!=='P';i--)s++;r.unb=s;var w=0,best=0;r.form.forEach(function(x){w=x==='G'?w+1:0;if(w>best)best=w;});r.bestWin=best;});
  st.streak=withPj.filter(function(r){return r.unb>0;}).sort(function(a,b){return b.unb-a.unb||b.pts-a.pts;}).slice(0,5);
  st.unbeaten=withPj.filter(function(r){return r.pp===0;});
  var tm=0,perfect=0,lost=0;pl.forEach(function(m){['h','a'].forEach(function(s){var v=jlTotal(m.jl&&m.jl[s]);if(v!=null){tm++;if(v>=8)perfect++;else lost+=8-v;}});});
  st.jlN=tm;st.jlPerfect=perfect;st.jlLost=lost;
  if(multi(c))st.groups=c.groups.map(function(g){var ms=pl.filter(function(m){return m.phase==='grupos'&&m.group===g;});var gg=ms.reduce(function(s,m){return s+(+m.hs)+(+m.as);},0);var r=groupRows(c,g);var jl=r.reduce(function(s,x){return s+x.jl;},0),pj=r.reduce(function(s,x){return s+x.pj;},0);return {g:g,n:ms.length,goals:gg,avg:ms.length?gg/ms.length:0,jl:pj?jl/pj:0};});
  return st;
}
function lrows(arr,fn){return arr.map(function(x,i){var r=fn(x);return '<div class="lrow"><span class="i">'+(i+1)+'</span><span>'+r[0]+'<span class="s">'+r[1]+'</span></span><span class="v">'+r[2]+'</span></div>';}).join('')||'<div class="empty">Sin datos todavía.</div>';}
function mline(c,m){return esc(tname(c,m.home))+' '+m.hs+'–'+m.as+' '+esc(tname(c,m.away));}
function viewEst(c){
  var s=stats(c),n=s.pl.length||1;
  var h='<div class="sechead"><div><h2>Estadísticas</h2><p>Todo se recalcula con cada resultado que se carga.</p></div><div class="acts">'+expBtn()+'</div></div>';
  h+='<div class="minis">';
  h+='<div class="mini"><span>Promedio de gol</span><b data-count="'+(s.goals/n).toFixed(2)+'">'+(s.goals/n).toFixed(2)+'</b><small>'+s.goals+' goles en '+s.pl.length+' partidos</small></div>';
  h+='<div class="mini"><span>Victorias locales</span><b>'+pct(s.home,n)+'%</b><small>'+s.home+' de '+s.pl.length+'</small></div>';
  h+='<div class="mini"><span>Empates</span><b>'+pct(s.draw,n)+'%</b><small>'+s.draw+' partidos · '+s.zeroZero+' sin goles</small></div>';
  h+='<div class="mini"><span>JL perfecto</span><b style="color:var(--good)">'+pct(s.jlPerfect,s.jlN)+'%</b><small>'+s.jlPerfect+' de '+s.jlN+' planillas con 8 puntos</small></div>';
  h+='<div class="mini"><span>Puntos JL perdidos</span><b style="color:var(--bad)">'+s.jlLost+'</b><small>por tarjetas, faltas y conducta</small></div>';
  h+='<div class="mini"><span>Invictos</span><b>'+s.unbeaten.length+'</b><small>'+esc(s.unbeaten.slice(0,3).map(function(r){return r.name;}).join(', ')||'ninguno')+'</small></div>';
  h+='</div><div class="sgrid">';
  var mx=Math.max.apply(null,s.byRound.map(function(r){return r.g;}))||1;
  h+='<div class="scard"><h3>Goles por fecha</h3><p class="hint">Total de goles anotados en cada fecha jugada.</p><div class="cols">'+s.byRound.map(function(r){return '<div class="c" title="'+r.n+' partidos · '+(r.g/r.n).toFixed(1)+' por partido"><b>'+r.g+'</b><i style="height:'+Math.max(4,r.g/mx*100)+'%"></i><span>'+r.lab+'</span></div>';}).join('')+'</div></div>';
  var ph=pct(s.home,n),pd=pct(s.draw,n),pa=s.pl.length?100-ph-pd:0;
  h+='<div class="scard"><h3>¿Quién gana?</h3><p class="hint">Resultado de los partidos jugados según quién figura como local.</p><div class="stack"><div class="h" style="width:'+ph+'%">'+(ph>8?ph+'%':'')+'</div><div class="d" style="width:'+pd+'%">'+(pd>8?pd+'%':'')+'</div><div class="a" style="width:'+pa+'%">'+(pa>8?pa+'%':'')+'</div></div><div class="slegend"><span><i class="sw" style="background:var(--plum)"></i> Local '+s.home+'</span><span><i class="sw" style="background:var(--muted)"></i> Empate '+s.draw+'</span><span><i class="sw" style="background:var(--gC)"></i> Visitante '+s.away+'</span></div>';
  if(s.groups){h+='<div class="sub" style="margin-top:6px">Por grupo</div><table><thead><tr><th class="l">Grupo</th><th>PJ</th><th>Goles</th><th>Prom.</th><th>JL/pj</th></tr></thead><tbody>'+s.groups.map(function(g){return '<tr><td class="l">'+gb(c,g.g)+' Grupo '+g.g+'</td><td>'+g.n+'</td><td>'+g.goals+'</td><td>'+g.avg.toFixed(2)+'</td><td>'+g.jl.toFixed(1)+'</td></tr>';}).join('')+'</tbody></table>';}
  h+='</div>';
  h+='<div class="scard"><h3>Goleadas</h3><p class="hint">Mayor diferencia en el marcador.</p>'+lrows(s.big,function(m){return [mline(c,m),'Fecha '+m.round,'+'+Math.abs(m.hs-m.as)];})+'</div>';
  h+='<div class="scard"><h3>Partidos con más goles</h3><p class="hint">Suma de goles de ambos equipos.</p>'+lrows(s.most,function(m){return [mline(c,m),'Fecha '+m.round,(+m.hs)+(+m.as)];})+'</div>';
  h+='<div class="scard"><h3>Mejor ataque</h3><p class="hint">Goles a favor por partido.</p>'+lrows(s.attack,function(r){return [tl(r.id,r.name),r.gf+' GF en '+r.pj+' PJ',(r.gf/r.pj).toFixed(2)];})+'</div>';
  h+='<div class="scard"><h3>Mejor defensa</h3><p class="hint">Goles recibidos por partido.</p>'+lrows(s.defense,function(r){return [tl(r.id,r.name),r.gc+' GC en '+r.pj+' PJ',(r.gc/r.pj).toFixed(2)];})+'</div>';
  h+='<div class="scard"><h3>Vallas invictas</h3><p class="hint">Partidos sin recibir gol.</p>'+lrows(s.clean,function(r){return [tl(r.id,r.name),r.pj+' PJ · '+r.gc+' GC',r.cs];})+'</div>';
  h+='<div class="scard"><h3>Efectividad</h3><p class="hint">Porcentaje de los puntos posibles que ha sumado.</p>'+lrows(s.eff,function(r){return [tl(r.id,r.name),r.pts+' de '+(3*r.pj)+' puntos',pct(r.pts,3*r.pj)+'%'];})+'</div>';
  h+='<div class="scard"><h3>Rachas sin perder</h3><p class="hint">Partidos seguidos sin derrota hasta hoy.</p>'+lrows(s.streak,function(r){return [tl(r.id,r.name),'Mejor racha de victorias: '+r.bestWin,r.unb];})+'</div>';
  return h+'</div>';
}
function saveBar(){
  if(!changes.length)return '';
  return '<div class="savebar"><div class="wrap"><span><b>'+changes.length+' cambio'+(changes.length>1?'s':'')+' sin publicar</b> · '+esc(changes.slice(-2).join(' · '))+'</span><span style="display:flex;gap:8px"><button class="btn" id="btn-discard">Descartar</button><button class="btn pri" id="btn-publish">'+(NUBE?'Publicar para todos':STANDALONE?'Descargar datos (torneo.js)':'Publicar para todos')+'</button></span></div></div>';
}

/* ---------- modals ---------- */
function openModal(html,wide){closeModal();modal=document.createElement('div');modal.className='ov';modal.innerHTML='<div class="modal'+(wide?' wide':'')+'" role="dialog" aria-modal="true">'+html+'</div>';document.body.appendChild(modal);var f=modal.querySelector('.x');if(f)f.focus();}
function closeModal(){if(modal){modal.remove();modal=null;draft=null;ui.form=null;}if(expState&&expState.url){try{URL.revokeObjectURL(expState.url);}catch(e){}}expState=null;}
function teamModal(id){
  var c=cat(),t=teamMap(c)[id];if(!t)return;
  var rows=groupRows(c,t.group),pos=0,r=null;rows.forEach(function(x,i){if(x.id===id){pos=i+1;r=x;}});
  var gen=allRows(c),gpos=0;gen.forEach(function(x,i){if(x.id===id)gpos=i+1;});
  var ms=c.matches.filter(function(m){return m.home===id||m.away===id;}).sort(function(a,b){return mKey(a)-mKey(b);});
  var sc=scorers(c).filter(function(x){return x.team===id;});
  var h='<div class="mhead"><div><div class="eyebrow">'+(multi(c)?'Grupo '+t.group+' · '+pos+'° del grupo · '+gpos+'° general':pos+'° en la tabla')+'</div><h3 style="font-size:28px">'+esc(t.name)+'</h3></div><button class="x" data-close aria-label="Cerrar">×</button></div><div class="mbody">';
  h+='<div class="statrow">'+[['PTS',r.pts],['PJ',r.pj],['PG',r.pg],['PE',r.pe],['PP',r.pp],['GF',r.gf],['GC',r.gc]].map(function(s){return '<div class="st"><b>'+s[1]+'</b><span>'+s[0]+'</span></div>';}).join('')+'<div class="st jl"><b>'+r.jl+'</b><span>Juego limpio</span></div></div>';
  h+='<div><div class="sub" style="margin-bottom:6px">Partidos</div><div class="mlist">'+ms.map(function(m){var home=m.home===id,op=home?m.away:m.home,f=home?m.hs:m.as,a=home?m.as:m.hs;var res=!m.played?'N':+f>+a?'G':+f<+a?'P':'E';var j=m.played?jlTotal(m.jl&&m.jl[home?'h':'a']):null;
    return '<button class="mli" data-match="'+esc(m.id)+'"><span class="res '+res+'">'+(res==='N'?'·':res)+'</span><span>'+(m.phase==='eliminatoria'?KO_SHORT[m.round-1]:(m.phase==='intergrupos'?'F2·':'F')+m.round)+' · '+(home?'vs ':'en ')+'<b>'+esc(tname(c,op))+'</b>'+(m.notes?' <span class="notechip">Nota</span>':'')+'</span><span style="font-weight:800">'+(m.played?f+' – '+a:'Pendiente')+'</span><span>'+(j!=null?'<span class="jlchip '+jlClass(j)+'">JL '+j+'</span>':'')+'</span></button>';}).join('')+'</div></div>';
  if(sc.length)h+='<div><div class="sub" style="margin-bottom:6px">Goleadoras</div>'+sc.map(function(x){return '<div class="ck"><span>'+esc(title(x.player))+'</span><b>'+x.g+'</b></div>';}).join('')+'</div>';
  openModal(h+'</div>');
}
function matchModal(id){
  var c=cat(),m=c.matches.filter(function(x){return x.id===id;})[0];if(!m)return;
  if(ui.edit)return editor(m);
  var H=tname(c,m.home),A=tname(c,m.away);
  var h='<div class="mhead"><div><div class="eyebrow">'+esc(stageLabel(c,m))+(m.date?' · '+fmtDate(m.date):'')+(m.time?' · '+esc(m.time):'')+(m.venue?' · '+esc(m.venue):'')+'</div><h3 style="font-size:24px">'+esc(H)+' vs '+esc(A)+'</h3></div><button class="x" data-close aria-label="Cerrar">×</button></div><div class="mbody">';
  h+='<div class="scorebox"><span class="tn h">'+esc(H)+'</span><span class="score">'+(m.played?m.hs+' – '+m.as+(m.pens?'<small class="pen">'+m.pens.h+'–'+m.pens.a+' penales</small>':''):'<span class="score pend">Pendiente</span>')+'</span><span class="tn">'+esc(A)+'</span></div>';
  if(m.played){h+='<div class="sides">';['h','a'].forEach(function(s){var t=s==='h'?m.home:m.away,j=m.jl&&m.jl[s],tot=jlTotal(j);
    h+='<div class="side"><h4>'+esc(tname(c,t))+'<span class="jltot '+(tot<0?'neg':'')+'">'+(tot==null?'–':tot)+'</span></h4>';
    var gl=(m.goals||[]).filter(function(g){return g.team===t&&g.player&&+g.n>0;});
    if(gl.length)h+='<div class="sub">Goles</div>'+gl.map(function(g){return '<div class="ck"><span>'+esc(title(g.player))+'</span><b>'+g.n+'</b></div>';}).join('');
    if(j&&j.items){h+='<div class="sub">Juego limpio</div>';JL_POS.forEach(function(p){if(j.items[p.k])h+='<div class="ck"><span>'+p.l+'</span><b class="pos-v">+'+p.v+'</b></div>';});JL_NEG.forEach(function(p){var n=+j.items[p.k]||0;if(n)h+='<div class="ck"><span>'+p.l+(n>1?' ×'+n:'')+'</span><b class="neg-v">'+(p.v*n)+'</b></div>';});if(+j.adj)h+='<div class="ck"><span>Ajuste del comité</span><b>'+j.adj+'</b></div>';}
    else if(tot!=null)h+='<div class="ck"><span>Juego limpio registrado en planilla</span></div>';
    h+='</div>';});h+='</div>';
    if(m.imported)h+='<p class="note" style="margin:0">Las goleadoras de los partidos jugados antes del ranking oficial ('+fmtDate(c.scorersBaseDate)+') ya están incluidas en la tabla de goleadoras.</p>';}
  if(m.notes)h+='<div><div class="sub" style="margin-bottom:6px">Observaciones de planilla</div><div class="obs">'+esc(m.notes)+'</div></div>';
  openModal(h+'</div>');
}
function newMatch(){var c=cat();return {id:'M'+Date.now().toString(36),phase:multi(c)?'intergrupos':'grupos',group:multi(c)?'':c.groups[0],round:1,date:'',time:'',venue:'',home:c.teams[0].id,away:c.teams[multi(c)?8:1].id,hs:null,as:null,played:false,imported:false,goals:[],jl:{},notes:'',isNew:true};}
function defaultJl(){var it={};JL_POS.forEach(function(p){it[p.k]=true;});return {items:it,adj:0};}
function editor(m){draft=clone(m);if(!draft.goals)draft.goals=[];if(!draft.jl)draft.jl={};if(draft.notes==null)draft.notes='';renderEditor();}
function renderEditor(){
  var c=cat(),d=draft;
  var opts=function(sel){return c.teams.map(function(t){return '<option value="'+t.id+'"'+(t.id===sel?' selected':'')+'>'+esc(t.name)+(multi(c)?' ('+t.group+')':'')+'</option>';}).join('');};
  var h='<div class="mhead"><div><div class="eyebrow">'+(d.isNew?'Nuevo partido':esc(stageLabel(c,d)))+' · Planilla</div><h3 style="font-size:24px">'+esc(tname(c,d.home))+' vs '+esc(tname(c,d.away))+'</h3></div><button class="x" data-close aria-label="Cerrar">×</button></div><div class="mbody">';
  h+='<div class="fgrid">';
  if(d.isNew){h+='<label class="f">Local<select class="inp" id="ed-home">'+opts(d.home)+'</select></label><label class="f">Visitante<select class="inp" id="ed-away">'+opts(d.away)+'</select></label>';}
  h+='<label class="f">Fecha N°<input class="inp" id="ed-round" type="number" min="1" max="30" value="'+esc(d.round)+'"></label>';
  h+='<label class="f">Día<input class="inp" id="ed-date" type="date" value="'+esc(d.date)+'"></label>';
  h+='<label class="f">Hora<input class="inp" id="ed-time" type="time" value="'+esc(d.time)+'"></label>';
  h+='<label class="f">Cancha<input class="inp" id="ed-venue" list="dl-venues" value="'+esc(d.venue)+'" placeholder="Escenario"></label><datalist id="dl-venues">'+VENUES.map(function(v){return '<option value="'+esc(v)+'">';}).join('')+'</datalist>';
  h+='</div>';
  h+='<div class="scorebox"><span class="tn h">'+esc(tname(c,d.home))+'</span><span style="display:flex;gap:8px;align-items:center"><input id="ed-hs" type="number" min="0" inputmode="numeric" aria-label="Goles local" value="'+(d.hs==null?'':d.hs)+'"><b>–</b><input id="ed-as" type="number" min="0" inputmode="numeric" aria-label="Goles visitante" value="'+(d.as==null?'':d.as)+'"></span><span class="tn">'+esc(tname(c,d.away))+'</span></div>';
  if(d.phase==='eliminatoria')h+='<div class="pens"><span class="sub">Penales · solo si empatan</span><input id="ed-ph" type="number" min="0" inputmode="numeric" aria-label="Penales local" value="'+(d.pens&&d.pens.h!=null?d.pens.h:'')+'"><b>–</b><input id="ed-pa" type="number" min="0" inputmode="numeric" aria-label="Penales visitante" value="'+(d.pens&&d.pens.a!=null?d.pens.a:'')+'"></div>';
  h+='<div class="sides">';
  ['h','a'].forEach(function(s){
    var t=s==='h'?d.home:d.away,j=d.jl[s];
    if(!j)j=d.jl[s]=defaultJl();
    var mode=j.items?'items':'manual',tot=jlTotal(j);
    h+='<div class="side"><h4>'+esc(tname(c,t))+'<span class="jltot '+(tot<0?'neg':'')+'" id="jt-'+s+'" title="Juego limpio del partido">'+(tot==null?'–':tot)+'</span></h4>';
    h+='<div class="sub">Goleadoras</div>';
    if(d.imported){h+='<p class="note" style="margin:0">Las goleadoras de este partido ya cuentan en el ranking oficial. Si necesitas corregir, hazlo en la pestaña Goleadoras.</p>';}
    else{
      var known=playersOf(c,t);
      h+='<datalist id="dl-'+t+'">'+known.map(function(p){return '<option value="'+esc(p)+'">';}).join('')+'</datalist>';
      d.goals.forEach(function(g,i){if(g.team!==t)return;h+='<div class="grow"><input class="inp p" list="dl-'+t+'" data-gp="'+i+'" value="'+esc(g.player)+'" placeholder="Escribe el nombre"><input class="inp n" type="number" min="1" data-gn="'+i+'" value="'+esc(g.n)+'" aria-label="Cantidad de goles"><button class="rm" data-grm="'+i+'" aria-label="Quitar">×</button></div>';});
      h+='<button class="btn" data-gadd="'+t+'">+ Agregar goleadora</button>';
      if(known.length)h+='<div class="sugg" aria-label="Goleadoras conocidas del equipo">'+known.slice(0,10).map(function(p){return '<button data-gquick="'+t+'" data-name="'+esc(p)+'">+ '+esc(title(p))+'</button>';}).join('')+'</div>';
      h+='<div class="warnline" id="gw-'+s+'"></div>';
    }
    h+='<div style="display:flex;justify-content:space-between;align-items:center;gap:8px;margin-top:4px"><span class="sub">Juego limpio</span><span class="seg"><button data-jlmode="'+s+'" data-v="items" aria-pressed="'+(mode==='items')+'">Por ítems</button><button data-jlmode="'+s+'" data-v="manual" aria-pressed="'+(mode==='manual')+'">Total directo</button></span></div>';
    if(mode==='manual'){h+='<label class="ck"><span>Total del partido</span><input type="number" id="jlm-'+s+'" data-jlman="'+s+'" value="'+(j.manual==null?'':j.manual)+'"></label>';}
    else{
      JL_POS.forEach(function(p){h+='<label class="ck"><input type="checkbox" data-jlpos="'+s+'" data-k="'+p.k+'"'+(j.items[p.k]?' checked':'')+'><span>'+p.l+'</span><b class="pos-v">+'+p.v+'</b></label>';});
      h+='<details'+(JL_NEG.some(function(n){return +j.items[n.k];})?' open':'')+'><summary class="sub" style="cursor:pointer;margin:4px 0">Descuentos</summary>';
      JL_NEG.forEach(function(p){h+='<label class="ck"><span>'+p.l+' <span class="neg-v">('+p.v+')</span></span><input type="number" min="0" max="20" data-jlneg="'+s+'" data-k="'+p.k+'" value="'+(+j.items[p.k]||'')+'" placeholder="0"></label>';});
      h+='<label class="ck"><span>Ajuste del comité (±)</span><input type="number" data-jladj="'+s+'" value="'+(+j.adj||'')+'" placeholder="0"></label></details>';
    }
    h+='</div>';
  });
  h+='</div>';
  var wsd=woSide(Object.assign({},d,{played:true}));
  h+='<label class="f">W.O. · equipo que no se presentó<select class="inp" id="ed-wo"><option value="none">Nadie, se jugó normal</option><option value="h"'+(wsd&&wsd.s==='h'?' selected':'')+'>'+esc(tname(c,d.home))+'</option><option value="a"'+(wsd&&wsd.s==='a'?' selected':'')+'>'+esc(tname(c,d.away))+'</option></select></label>';
  h+='<label class="f">Observaciones de planilla<textarea class="inp" id="ed-notes" placeholder="Ej.: partido detenido 5 minutos por lluvia; jugadora atendida por lesión; W por no presentación…">'+esc(d.notes)+'</textarea></label>';
  h+='</div><div class="mfoot" id="ed-foot">';
  if(!d.isNew&&!d.imported)h+='<button class="btn dng" id="ed-del" style="margin-right:auto">Eliminar partido</button>';
  else h+='<span style="margin-right:auto"></span>';
  if(!d.isNew&&d.played)h+='<button class="btn" id="ed-pend">Dejar pendiente</button>';
  h+='<button class="btn" data-close>Cancelar</button><button class="btn pri" id="ed-save">Guardar planilla</button></div>';
  if(modal){var sc=modal.scrollTop;modal.querySelector('.modal').innerHTML=h;modal.scrollTop=sc;}else{openModal(h);}
  goalWarn();
}
function refreshJl(s){var t=jlTotal(draft.jl[s]),el=document.getElementById('jt-'+s);if(el){el.textContent=t==null?'–':t;el.className='jltot '+(t<0?'neg':'');}}
function goalWarn(){if(!draft||draft.imported)return;['h','a'].forEach(function(s){var t=s==='h'?draft.home:draft.away,sc=s==='h'?draft.hs:draft.as,sum=draft.goals.filter(function(g){return g.team===t;}).reduce(function(a,g){return a+(+g.n||0);},0),el=document.getElementById('gw-'+s);if(!el)return;var has=sc!==''&&sc!=null;el.textContent=(has&&sum>+sc)?'Hay '+sum+' goles asignados y el marcador dice '+sc+'.':(has&&sum<+sc?'Faltan '+(+sc-sum)+' gol(es) por asignar.':'');});}
function saveDraft(){
  var c=cat(),d=draft;
  if(d.home===d.away){toast('Local y visitante deben ser equipos distintos');return;}
  var hs=d.hs===''||d.hs==null?null:+d.hs,as=d.as===''||d.as==null?null:+d.as;
  if((hs==null)!==(as==null)){toast('Completa los dos lados del marcador');return;}
  d.hs=hs;d.as=as;d.played=hs!=null;
  if(d.phase==='eliminatoria'){if(d.played&&hs===as){var ph=d.pens&&d.pens.h,pa=d.pens&&d.pens.a;if(ph==null||pa==null||ph===''||pa===''||+ph===+pa){toast('Empate: registra los penales para definir quién pasa');return;}d.pens={h:+ph,a:+pa};}else d.pens=null;}
  if(!d.played){d.imported=false;d.jl={};}
  d.notes=(d.notes||'').trim();
  d.goals=(d.goals||[]).filter(function(g){return g.player&&g.player.trim()&&+g.n>0&&(g.team===d.home||g.team===d.away);}).map(function(g){return {team:g.team,player:g.player.trim().toUpperCase().replace(/\s+/g,' '),n:+g.n};});
  var tm=teamMap(c);
  if(d.isNew){delete d.isNew;var gh=tm[d.home].group,ga=tm[d.away].group;if(gh===ga){d.phase='grupos';d.group=gh;}else{d.phase='intergrupos';d.group='';}c.matches.push(d);}
  else{var found=false;for(var i=0;i<c.matches.length;i++)if(c.matches[i].id===d.id){c.matches[i]=d;found=true;}if(!found)c.matches.push(d);}
  note(tm[d.home].name+' '+(d.played?d.hs+'-'+d.as:'vs')+' '+tm[d.away].name);
  closeModal();render();toast('Planilla guardada. Publica para que la vean todos.');
}
function note(s){changes.push(s);persistDraft();}
function toast(t){document.querySelectorAll('.toast').forEach(function(x){x.remove();});var el=document.createElement('div');el.className='toast';el.setAttribute('role','status');el.textContent=t;document.body.appendChild(el);setTimeout(function(){el.remove();},2800);}

/* ---------- image export ---------- */
function expOptions(view,c){
  if(view==='pos'&&multi(c))return [['all','Todos los grupos']].concat(c.groups.map(function(g){return [g,'Grupo '+g];}));
  if(view==='par'){var o=[['P:grupos',multi(c)?'Fase de grupos completa':'Fase de grupos completa']];
    if(multi(c))c.groups.forEach(function(g){o.push(['P:grupos:'+g,'Grupo '+g+' completo']);});
    if(c.matches.some(function(m){return m.phase==='intergrupos';}))o.push(['P:inter','Fase 2 completa']);
    if(c.matches.some(function(m){return m.phase==='eliminatoria';}))o.push(['P:ko','Eliminación directa completa']);
    return o.concat(roundKeys(c).map(function(x){return [x,roundLabel(x)];}));}
  if(view==='gol')return [['10','Top 10'],['20','Top 20'],['30','Top 30']];
  if(view==='val'||view==='jl')return [['10','Top 10'],['all','Todos']];
  if(view==='gen')return [['all','Todos'],['q','Solo zona de octavos']];
  return null;
}
function expDefault(view,c){
  if(view==='pos')return multi(c)?(ui.group==='all'?'A':ui.group):null;
  if(view==='par'){if(ui.m.round!=='all')return ui.m.round;var pl=played(c);return pl.length?roundKey(pl.slice().sort(function(a,b){return mKey(b)-mKey(a);})[0]):'1';}
  if(view==='gol'||view==='val'||view==='jl')return '10';if(view==='gen')return 'all';return null;
}
function pxStd(c,rows,qual){
  return '<table><thead><tr><th>#</th><th style="text-align:left">Equipo</th><th>PJ</th><th>G</th><th>E</th><th>P</th><th>GF</th><th>GC</th><th>DG</th><th class="jl">JL</th><th>PTS</th></tr></thead><tbody>'+rows.map(function(r,i){return '<tr class="'+(qual(r,i)?'q':'')+'"><td class="pos">'+(r._pos||i+1)+'</td><td class="nm">'+esc(r.name)+'</td><td>'+r.pj+'</td><td>'+r.pg+'</td><td>'+r.pe+'</td><td>'+r.pp+'</td><td>'+r.gf+'</td><td>'+r.gc+'</td><td>'+(r.dg>0?'+'+r.dg:r.dg<0?'−'+Math.abs(r.dg):'0')+'</td><td class="jl">'+r.jl+'</td><td class="pts">'+r.pts+'</td></tr>';}).join('')+'</tbody></table>';
}
function poster(view,c,opt){
  var T='',sub='',body='',file=ui.cat+'-'+view;
  if(view==='pos'){
    var gs=multi(c)?(opt==='all'?c.groups:[opt]):c.groups;
    T=multi(c)?(opt==='all'?'Tabla de posiciones':'Posiciones grupo '+opt):'Tabla de posiciones';sub=multi(c)?'Fase de grupos · clasifican 4 por grupo · PTS → JL → DG → GC':'Grupo único · clasifican las '+c.qualify+' primeras · PTS → JL → DG → GC';
    body=gs.map(function(g){return (gs.length>1?'<h4><span class="gbadge g-'+g+'">'+g+'</span> Grupo '+g+'</h4>':'')+pxStd(c,groupRows(c,g),function(r,i){return i<c.qualify;});}).join('');file+='-'+(opt||'unico');
  }else if(view==='gen'){
    var q=qualifiedSet(c),rows=p1Rows(c);rows.forEach(function(r,i){r._pos=i+1;});if(opt==='q')rows=rows.filter(function(r){return q[r.id];});
    T='Reclasificación general';sub='Los '+c.teams.length+' equipos · PTS → JL → DG → GC';body=pxStd(c,rows,function(r){return q[r.id];});
  }else if(view==='par'&&String(opt).indexOf('P:')===0){
    var pp=String(opt).split(':'),ph={grupos:'grupos',inter:'intergrupos',ko:'eliminatoria'}[pp[1]],gsel=pp[2];
    var all=c.matches.filter(function(m){return m.phase===ph&&(!gsel||m.group===gsel);}).sort(function(a,b){return mKey(a)-mKey(b)||String(a.group||a.interGroup||'').localeCompare(String(b.group||b.interGroup||''),undefined,{numeric:true});});
    T=ph==='grupos'?(gsel?'Grupo '+gsel+' · todos los partidos':'Fase de grupos'):ph==='intergrupos'?'Fase 2 · todos los partidos':'Eliminación directa';
    sub=all.filter(function(m){return m.played;}).length+' de '+all.length+' partidos jugados';
    var byk={},ord=[];all.forEach(function(m){var k=roundKey(m);if(!byk[k]){byk[k]=[];ord.push(k);}byk[k].push(m);});
    body=ord.map(function(k){var lab=roundLabel(k)+(ph==='grupos'&&c.byes&&c.byes[k.replace(/^\D/,'')]?' · Descansa: '+tname(c,c.byes[k.replace(/^\D/,'')]):'');
      return '<div><h4 style="font-size:24px;margin-bottom:8px">'+esc(lab)+'</h4><div class="px-cg">'+byk[k].map(function(m){var tag=m.phase==='intergrupos'&&m.interGroup?'G'+m.interGroup:m.phase==='grupos'&&multi(c)&&!gsel?m.group:m.phase==='eliminatoria'?(m.ko||''):'';
        return '<div class="px-c">'+(tag?'<i>'+esc(tag)+'</i>':'')+'<span class="h">'+esc(tname(c,m.home))+'</span><b class="'+(m.played?'':'p')+'">'+(m.played?m.hs+'–'+m.as+(m.pens?'<small>('+m.pens.h+'–'+m.pens.a+')</small>':''):'vs')+'</b><span class="a">'+esc(tname(c,m.away))+'</span></div>';}).join('')+'</div></div>';}).join('');
    file+='-'+pp.slice(1).join('-');
  }else if(view==='par'){
    var ms=c.matches.filter(function(m){return roundKey(m)===String(opt);}).sort(function(a,b){return (a.group||a.interGroup||'').localeCompare(b.group||b.interGroup||'');});
    T=String(opt).charAt(0)==='E'?KO_NAMES[+String(opt).slice(1)-1]:String(opt).charAt(0)==='I'?'Fase 2 · fecha '+String(opt).slice(1):'Resultados fecha '+opt;sub=ms.filter(function(m){return m.played;}).length+' de '+ms.length+' partidos jugados'+(c.byes&&c.byes[opt]?' · Descansa: '+tname(c,c.byes[opt]):'');
    body=ms.map(function(m){var gl=(m.goals||[]).filter(function(g){return +g.n>0;});var gh=gl.filter(function(g){return g.team===m.home;}).map(function(g){return title(g.player)+(g.n>1?' ×'+g.n:'');}).join(', '),ga=gl.filter(function(g){return g.team===m.away;}).map(function(g){return title(g.player)+(g.n>1?' ×'+g.n:'');}).join(', ');
      var jh=m.played?jlTotal(m.jl&&m.jl.h):null,ja=m.played?jlTotal(m.jl&&m.jl.a):null;
      return '<div class="px-m"><span class="h">'+esc(tname(c,m.home))+'</span><span class="sc'+(m.played?'':' p')+'">'+(m.played?m.hs+' – '+m.as:'PENDIENTE')+'</span><span class="a">'+esc(tname(c,m.away))+'</span>'+((gh||ga||jh!=null)?'<div class="gl"><span>'+(jh!=null?'JL '+jh+(gh?' · ':''):'')+esc(gh)+'</span><span style="text-align:right">'+esc(ga)+(ja!=null?(ga?' · ':'')+'JL '+ja:'')+'</span></div>':'')+'</div>';}).join('');
    file+='-fecha-'+opt;
  }else if(view==='gol'){
    var sc=scorers(c).slice(0,+opt),tm=teamMap(c);T='Goleadoras';sub='Top '+opt+' · premio $500.000 a la goleadora';
    body='<table><thead><tr><th>#</th><th style="text-align:left">Jugadora</th><th style="text-align:left">Equipo</th><th>Goles</th></tr></thead><tbody>'+sc.map(function(x){return '<tr class="'+(x.pos===1?'top':'')+'"><td class="pos">'+x.pos+'</td><td class="nm">'+esc(title(x.player))+'</td><td class="sm">'+esc(tm[x.team]?tm[x.team].name:x.team)+'</td><td class="pts">'+x.g+'</td></tr>';}).join('')+'</tbody></table>';file+='-top'+opt;
  }else if(view==='val'){
    var vr=allRows(c).filter(function(r){return r.pj>0;}).sort(cmpValla);if(opt!=='all')vr=vr.slice(0,+opt);T='Valla menos vencida';sub='Menos goles recibidos · premio $500.000';
    body='<table><thead><tr><th>#</th><th style="text-align:left">Equipo</th><th>PJ</th><th>Invicta</th><th>Prom.</th><th>GC</th></tr></thead><tbody>'+vr.map(function(r,i){return '<tr class="'+(i===0?'top':'')+'"><td class="pos">'+(i+1)+'</td><td class="nm">'+esc(r.name)+'</td><td>'+r.pj+'</td><td>'+r.cs+'</td><td>'+(r.gc/r.pj).toFixed(2)+'</td><td class="pts">'+r.gc+'</td></tr>';}).join('')+'</tbody></table>';
  }else if(view==='jl'){
    var jr=allRows(c).sort(cmpJl);if(opt!=='all')jr=jr.slice(0,+opt);T='Copa Sororidad';sub='Ranking de juego limpio · máximo 8 puntos por partido';
    body='<table><thead><tr><th>#</th><th style="text-align:left">Equipo</th><th>PJ</th><th>Prom.</th><th>Efic.</th><th class="jl">JL</th></tr></thead><tbody>'+jr.map(function(r,i){return '<tr class="'+(i===0?'top':'')+'"><td class="pos">'+(i+1)+'</td><td class="nm">'+esc(r.name)+'</td><td>'+r.pj+'</td><td>'+(r.pj?(r.jl/r.pj).toFixed(1):'–')+'</td><td>'+pct(r.jl,8*r.pj)+'%</td><td class="pts" style="color:#13804F">'+r.jl+'</td></tr>';}).join('')+'</tbody></table>';
  }else if(view==='f2'){
    var F=c.fase2;T='Fase 2';sub='Grupos sorteados · clasifican 2 por grupo · desempate: cabeza de grupo, JL, DG, GC';
    body=F?'<div class="px-ig">'+F.groups.map(function(g){var rr=f2Table(c,g),seed={};g.teams.forEach(function(t){seed[t.id]=t;});return '<div class="px-ic"><h5>Grupo '+g.id+'<span>PTS</span></h5>'+rr.map(function(r,i){var s=seed[r.id];return '<div class="px-ir'+(i<2?' hd':'')+'"><span class="rk">'+(i+1)+'</span><span class="nm">'+esc(r.name)+'</span><span class="gbadge g-'+s.orig+'">'+s.orig+'</span><span class="pt">'+r.pts+'</span></div>';}).join('')+'</div>';}).join('')+'</div>':'';
  }else if(view==='est'){
    var s=stats(c),Ld=leaders(c),n=s.pl.length||1;T='En números';sub=s.pl.length+' partidos jugados · '+s.goals+' goles';
    var tiles=[['Goles por partido',(s.goals/n).toFixed(2),s.goals+' goles en total'],['Goleadora',Ld.top.length?Ld.top[0].g:'–',Ld.top.length?names(Ld.top,function(x){return title(x.player);}):''],['Valla menos vencida',Ld.vb.length?Ld.vb[0].gc:'–',Ld.vb.length?names(Ld.vb,function(x){return x.name;}):''],['Copa Sororidad',Ld.jb.length?Ld.jb[0].jl:'–',Ld.jb.length?names(Ld.jb,function(x){return x.name;}):''],['JL perfecto',pct(s.jlPerfect,s.jlN)+'%',s.jlPerfect+' planillas con 8 puntos'],['Mejor ataque',s.attack.length?(s.attack[0].gf/s.attack[0].pj).toFixed(2):'–',s.attack.length?s.attack[0].name+' · goles por partido':''],['Mayor goleada',s.big.length?'+'+Math.abs(s.big[0].hs-s.big[0].as):'–',s.big.length?tname(c,s.big[0].home)+' '+s.big[0].hs+'–'+s.big[0].as+' '+tname(c,s.big[0].away):''],['Invictos',s.unbeaten.length,s.unbeaten.slice(0,2).map(function(r){return r.name;}).join(' · ')],['Racha sin perder',s.streak.length?s.streak[0].unb:'–',s.streak.length?s.streak[0].name:'']];
    body='<div class="px-tiles">'+tiles.map(function(t){return '<div class="px-tile"><span>'+esc(t[0])+'</span><b>'+esc(t[1])+'</b><small>'+esc(t[2])+'</small></div>';}).join('')+'</div>';
  }
  var head='<div class="px-head"><img src="'+LOGO+'" alt=""><div class="tx"><div class="px-k">Copa Malala\'s 2026 · '+esc(c.name)+'</div><div class="px-t">'+esc(T)+'</div><div class="px-s">'+esc(sub)+'</div></div></div>';
  var foot='<div class="px-foot"><span><b>Supercopa de la No Violencia</b> · Categoría Libre Femenina · Medellín</span><span>Actualizado '+esc(fmtLong(S.updated))+'</span></div>';
  return {html:'<div class="pxwrap px">'+head+'<div class="px-body">'+body+'</div>'+foot+'</div>',file:'copa-malalas-'+file+'.png'};
}
function openExport(view){
  var c=cat(),opts=expOptions(view,c);
  expState={view:view,opt:expDefault(view,c),url:null,blob:null,file:''};
  var h='<div class="mhead"><div><div class="eyebrow">'+esc(c.name)+' · Imagen para compartir</div><h3 style="font-size:24px">Exportar imagen</h3></div><button class="x" data-close aria-label="Cerrar">×</button></div><div class="mbody">';
  if(opts)h+='<div class="chips">'+opts.map(function(o){return '<button class="chip" data-expopt="'+esc(o[0])+'" aria-pressed="'+(String(expState.opt)===String(o[0]))+'">'+esc(o[1])+'</button>';}).join('')+'</div>';
  h+='<div id="exp-out"><div class="expwait">Preparando imagen…</div></div></div><div class="mfoot"><span class="sub" style="margin-right:auto" id="exp-hint">PNG · 1080 px de ancho, listo para redes</span><button class="btn" data-close>Cerrar</button><button class="btn pri" id="exp-save" disabled>Descargar PNG</button></div>';
  var st=expState;openModal(h,true);expState=st;makeImage();
}
function makeImage(){
  var c=cat(),st=expState;if(!st)return;
  var out=document.getElementById('exp-out'),sv=document.getElementById('exp-save');
  if(out)out.innerHTML='<div class="expwait">Preparando imagen…</div>';if(sv)sv.disabled=true;
  if(!window.html2canvas){if(out)out.innerHTML='<div class="expwait">No se pudo cargar el generador de imágenes en esta vista.</div>';return;}
  var p=poster(st.view,c,st.opt);st.file=p.file;
  var holder=document.createElement('div');holder.innerHTML=p.html;var el=holder.firstChild;document.body.appendChild(el);
  var img=el.querySelector('img');
  var ready=Promise.all([(document.fonts&&document.fonts.ready)||Promise.resolve(),new Promise(function(r){if(!img||img.complete)r();else{img.onload=r;img.onerror=r;}})]);
  ready.then(function(){return window.html2canvas(el,{scale:1,backgroundColor:'#FFFFFF',logging:false,useCORS:true,windowWidth:1200});}).then(function(canvas){
    el.remove();
    canvas.toBlob(function(blob){
      if(expState!==st||!blob)return;
      if(st.url)try{URL.revokeObjectURL(st.url);}catch(e){}
      st.blob=blob;st.url=URL.createObjectURL(blob);
      var o=document.getElementById('exp-out');if(o)o.innerHTML='<img class="expimg" src="'+st.url+'" alt="Vista previa de la imagen exportada">';
      var b=document.getElementById('exp-save'),hint=document.getElementById('exp-hint');
      if(dlApi){if(b)b.disabled=false;}else{if(b)b.hidden=true;if(hint)hint.textContent='Mantén presionada o haz clic derecho sobre la imagen para guardarla.';}
    },'image/png');
  }).catch(function(){el.remove();var o=document.getElementById('exp-out');if(o)o.innerHTML='<div class="expwait">No se pudo generar la imagen. Intenta de nuevo.</div>';});
}
function saveImage(){
  var st=expState;if(!st||!st.blob||!dlApi)return;
  dlApi.save({filename:st.file,data:st.blob}).then(function(){toast('Imagen descargada');}).catch(function(e){var code=e&&e.code;if(code==='declined')return;if(code==='unavailable'||code==='not_granted'||code==='capability_disabled'){dlApi=null;var b=document.getElementById('exp-save');if(b)b.hidden=true;var hint=document.getElementById('exp-hint');if(hint)hint.textContent='Mantén presionada o haz clic derecho sobre la imagen para guardarla.';return;}toast('No se pudo descargar ('+(code||'error')+')');});
}

/* ---------- publish ---------- */
function buildHtml(st){
  var style=document.getElementById('app-style').textContent;
  var code=document.getElementById('app-code').textContent;
  var json=JSON.stringify(st).replace(/</g,'\\u003c');
  return '<!doctype html><html><head><meta charset=utf8><meta name=viewport content="width=device-width,initial-scale=1,viewport-fit=cover"><style>'+RESET+'</style></head><body>'+TOP+'<style id="app-style">'+style+'</style>\n'+SHELL+'\n<script type="application/json" id="app-state">'+json+'<\/script>\n<script id="app-code">'+code+'<\/script>\n</body></html>';
}
function publishStandalone(){
  var st=clone(S);st.rev=(ORIG.rev||0)+1;var now=new Date();st.updated=now.getFullYear()+'-'+String(now.getMonth()+1).padStart(2,'0')+'-'+String(now.getDate()).padStart(2,'0');
  var txt='/* Datos de la Copa Malala\'s 2026. Generado desde el modo organizadora (?admin). */\nwindow.TORNEO='+JSON.stringify(st,null,1)+';\n';
  dlApi.save({filename:'torneo.js',data:new Blob([txt],{type:'text/javascript'})}).then(function(){
    ORIG=st;S=clone(st);changes=[];persistDraft();render();
    toast('Se descargó torneo.js. Reemplaza data/torneo.js en el proyecto y súbelo para que todos lo vean.');
  });
}
function publish(){
  if(NUBE){publishNube();return;}
  if(STANDALONE){publishStandalone();return;}
  if(!artifactApi){toast('Esta vista no puede publicar cambios');return;}
  var b=document.getElementById('btn-publish');if(b){b.disabled=true;b.textContent='Publicando…';}
  var st=clone(S);st.rev=(ORIG.rev||0)+1;var now=new Date();st.updated=now.getFullYear()+'-'+String(now.getMonth()+1).padStart(2,'0')+'-'+String(now.getDate()).padStart(2,'0');
  artifactApi.publish(buildHtml(st)).then(function(){try{sessionStorage.removeItem('malalas-draft');}catch(e){}}).catch(function(e){
    var code=e&&e.code;
    if(code==='conflict'){toast('Alguien publicó antes; se recarga la versión más reciente');return;}
    if(code==='not_writer'||code==='not_granted'||code==='not_declared'||code==='capability_disabled'){canWrite=false;ui.edit=false;toast('Esta vista es de solo lectura');render();return;}
    if(code==='rate_limited'){toast('Demasiadas publicaciones seguidas, espera un momento');}
    else toast('No se pudo publicar ('+(code||'error')+'). Intenta de nuevo.');
    if(b){b.disabled=false;b.textContent=(STANDALONE?'Descargar datos (torneo.js)':'Publicar para todos');}
  });
}

/* ---------- nube (Firebase): ingreso de administradores y publicación ---------- */
var loginMsg='',authReady=false;
function loginView(){
  var h='<header class="hero"><div class="wrap"><div class="htop"><div class="brand"><img src="'+LOGO+'" alt="Supercopa de la No Violencia" width="180" height="100"><div><div class="eyebrow">Copa Malala\'s 2026 · Administración</div><h1>Ingreso <em>organización</em></h1><p class="motto">Solo para quienes administran el torneo.</p></div></div></div></div></header>';
  h+='<main><div class="wrap">';
  if(!authReady)return h+'<div class="card empty">Verificando sesión…</div></div></main>';
  return h+'<form class="card loginbox" id="login-form"><label class="f">Usuario<input class="inp" id="lg-mail" type="text" autocomplete="username" autocapitalize="none" autocorrect="off" spellcheck="false" required></label><label class="f">Contraseña<input class="inp" id="lg-pass" type="password" autocomplete="current-password" required></label><div class="warnline" id="lg-msg" role="alert">'+esc(loginMsg)+'</div><button class="btn pri" type="submit" id="lg-go">Ingresar</button><a class="nlink" href="./">← Volver a la página pública</a></form></div></main>';
}
/* El ingreso es con usuario y contraseña; Firebase pide forma de correo, así que se completa con un dominio interno (no es un correo real). */
function usuarioACorreo(u){u=String(u||'').trim().toLowerCase().replace(/\s+/g,'');return u.indexOf('@')>=0?u:u+'@copamalalas.local';}
function applyPrivate(st,P){if(!st||!P||!P.woPaid)return;Object.keys(st.cats).forEach(function(k){st.cats[k].matches.forEach(function(m){if(P.woPaid[k+'|'+m.id])m.woPaid=true;});});}
function initNube(){
  NUBE.auth.onAuthStateChanged(function(u){
    authReady=true;
    if(!u){canWrite=false;ui.edit=false;render();return;}
    NUBE.db.collection('admins').doc(u.uid).get().then(function(a){
      if(!a.exists){loginMsg='Esta cuenta no tiene permiso de administración.';NUBE.auth.signOut();return;}
      return NUBE.db.collection('torneo').doc('privado').get().then(function(d){if(d.exists){applyPrivate(ORIG,d.data());applyPrivate(S,d.data());}},function(){}).then(function(){loginMsg='';canWrite=true;render();});
    }).catch(function(){loginMsg='No se pudo verificar la cuenta. Revisa tu conexión e intenta de nuevo.';NUBE.auth.signOut();});
  });
}
function publishNube(){
  var b=document.getElementById('btn-publish');
  function libre(){if(b){b.disabled=false;b.textContent='Publicar para todos';}}
  if(b){b.disabled=true;b.textContent='Publicando…';}
  var local=clone(S);local.rev=(ORIG.rev||0)+1;local.updated=today();
  var st=clone(local),priv={woPaid:{}};
  Object.keys(st.cats).forEach(function(k){st.cats[k].matches.forEach(function(m){if(m.woPaid)priv.woPaid[k+'|'+m.id]=true;delete m.woPaid;});});
  var json=JSON.stringify(st);
  if(json.length>900000){toast('Los datos pesan demasiado (por imágenes o archivos adjuntos). Usa enlaces en vez de subir archivos.');libre();return;}
  var ref=NUBE.db.collection('torneo').doc('datos'),pref=NUBE.db.collection('torneo').doc('privado');
  NUBE.db.runTransaction(function(tx){return tx.get(ref).then(function(snap){
    var remoto=snap.exists?(+snap.data().rev||0):(ORIG.rev||0);
    if(remoto!==(ORIG.rev||0))throw {code:'conflict'};
    tx.set(ref,{rev:local.rev,updated:local.updated,json:json});tx.set(pref,priv);
  });}).then(function(){
    ORIG=local;S=clone(local);changes=[];persistDraft();render();toast('Publicado. Ya lo ve todo el mundo.');
  }).catch(function(e){
    var code=e&&e.code;
    if(code==='conflict')toast('Otra persona publicó antes. Recarga la página para ver la versión más reciente y vuelve a cargar tu cambio.');
    else if(code==='permission-denied')toast('Tu cuenta no tiene permiso para publicar.');
    else toast('No se pudo publicar ('+(code||'error')+'). Intenta de nuevo.');
    libre();
  });
}
document.addEventListener('submit',function(e){
  if(e.target.id!=='login-form')return;
  e.preventDefault();
  var go=document.getElementById('lg-go'),msg=document.getElementById('lg-msg');
  go.disabled=true;go.textContent='Ingresando…';
  NUBE.auth.signInWithEmailAndPassword(usuarioACorreo(document.getElementById('lg-mail').value),document.getElementById('lg-pass').value).catch(function(err){
    var c=err&&err.code;
    loginMsg=(c==='auth/too-many-requests')?'Demasiados intentos. Espera unos minutos e inténtalo de nuevo.':(c==='auth/network-request-failed')?'Sin conexión. Intenta de nuevo.':'Usuario o contraseña incorrectos.';
    render();
  });
});

/* ---------- events ---------- */
document.addEventListener('click',function(e){
  var th=e.target.closest('th[data-sort]');
  if(th){var k=th.dataset.sort;if(ui.gen.sort===k)ui.gen.dir=-ui.gen.dir;else{ui.gen.sort=k;ui.gen.dir=(k==='gc'||k==='pp')?1:-1;}render();return;}
  if(modal&&e.target===modal){closeModal();return;}
  var t=e.target.closest('button,[data-close]');if(!t)return;
  if(t.hasAttribute('data-close')){closeModal();return;}
  var ds=t.dataset;
  if(ds.cat){ui.cat=ds.cat;ui.group='all';ui.m={group:'all',round:'all',status:'all',q:''};ui.sc={q:'',team:''};animate=true;saveUi();render();return;}
  if(ds.view){ui.view=ds.view;animate=true;saveUi();render();return;}
  if(ds.go){ui.view=ds.go;animate=true;saveUi();render();var r=document.querySelector('.rail');if(r)r.scrollIntoView({block:'start'});return;}
  if(ds.grp){ui.group=ds.grp;animate=true;render();return;}
  if(ds.genf){ui.gen.filter=ds.genf;render();return;}
  if(ds.gensort){ui.gen.sort=null;render();return;}
  if(ds.mg){ui.m.group=ds.mg;animate=true;render();return;}
  if(ds.f2m){if(ui.f2m!==ds.f2m){ui.f2m=ds.f2m;ui.f2draft=null;ui.f2sel=null;}animate=true;render();return;}
  if(ds.drawbase){drawInit(cat(),ds.drawbase,ui.draw.heads);ui.drawBase=ds.drawbase;render();return;}
  if(ds.drawheads){drawInit(cat(),ui.draw.base,ds.drawheads);ui.drawHeads=ds.drawheads;render();return;}
  if(ds.drawpick){var dp=ds.drawpick.split(':'),dk={p:+dp[0],i:+dp[1]};if(!ui.drawSel){ui.drawSel=dk;render();return;}var d0=ui.drawSel;ui.drawSel=null;
    if(d0.p!==dk.p||d0.i!==dk.i){var Dd=ui.draw,x1=Dd.pots[d0.p][d0.i],x2=Dd.pots[dk.p][dk.i];Dd.pots[d0.p][d0.i]=x2;Dd.pots[dk.p][dk.i]=x1;
      Dd.groups.forEach(function(g){g[0]=null;});Dd.log=[];Dd.last=null;
      if(Dd.heads==='fixed')Dd.pots[0].slice().sort(function(a,b){return Dd.info[a].rank-Dd.info[b].rank;}).forEach(function(id,i){Dd.groups[i][0]=id;Dd.log.push({id:id,g:i,p:0,fixed:true});});
      drawSave();toast(drawFeasible(Dd)?tname(cat(),x1)+' ⇄ '+tname(cat(),x2):'Ojo: con estos bombos no se pueden evitar rivales repetidos');}
    render();return;}
  if(ds.ko){koOpen(ds.ko);return;}
  if(ds.form){if(canWrite&&!ui.edit){ui.edit=true;render();}openForm(ds.form,ds.fid);return;}
  if(ds.dl){downloadDoc(ds.dl);return;}
  if(ds.del){if(!t.dataset.confirm){t.dataset.confirm='1';t.textContent='¿Eliminar?';return;}var I0=info(),L=I0[ds.del];var ix=L.findIndex(function(o){return o.id===ds.fid;});if(ix>=0){var nm=L[ix].title||L[ix].name;L.splice(ix,1);note('Eliminado: '+nm);}render();return;}
  if(ds.f2pick){var pp=ds.f2pick.split(':'),pk={g:+pp[0],i:+pp[1]};if(!ui.f2sel){ui.f2sel=pk;render();return;}var s0=ui.f2sel;ui.f2sel=null;if(s0.g!==pk.g||s0.i!==pk.i)f2Swap(s0,pk);render();return;}
  if(ds.ms){ui.m.status=ds.ms;animate=true;render();return;}
  if(ds.team){teamModal(ds.team);return;}
  if(ds.match){matchModal(ds.match);return;}
  if(ds.export){openExport(ds.export);return;}
  if(ds.expopt!=null&&expState){expState.opt=ds.expopt;modal.querySelectorAll('[data-expopt]').forEach(function(b){b.setAttribute('aria-pressed',String(b.dataset.expopt===ds.expopt));});makeImage();return;}
  if(ds.adj!=null){var c=cat(),s=c.scorersBase[+ds.adj];s.g=Math.max(0,+s.g+(+ds.d));note((+ds.d>0?'+1 gol ':'−1 gol ')+title(s.player));render();return;}
  if(ds.gadd){draft.goals.push({team:ds.gadd,player:'',n:1});renderEditor();var ins=modal.querySelectorAll('[data-gp]');if(ins.length)ins[ins.length-1].focus();return;}
  if(ds.gquick){var nm=ds.name,ex=draft.goals.filter(function(g){return g.team===ds.gquick&&g.player.toUpperCase()===nm;})[0];if(ex)ex.n=(+ex.n||0)+1;else draft.goals.push({team:ds.gquick,player:nm,n:1});renderEditor();return;}
  if(ds.grm!=null){draft.goals.splice(+ds.grm,1);renderEditor();return;}
  if(ds.jlmode){var s2=ds.jlmode,j=draft.jl[s2];if(ds.v==='manual'&&j.items){draft.jl[s2]={manual:jlTotal(j)};}else if(ds.v==='items'&&!j.items){draft.jl[s2]=defaultJl();}renderEditor();return;}
  switch(t.id){
    case 'btn-edit':ui.edit=!ui.edit;render();return;
    case 'btn-add':editor(newMatch());return;
    case 'ed-save':saveDraft();return;
    case 'ed-pend':draft.hs=null;draft.as=null;saveDraft();return;
    case 'exp-save':saveImage();return;
    case 'f2-confirm':
      if(!t.dataset.confirm){t.dataset.confirm='1';t.textContent='¿Fijar estos grupos? Confirmar';return;}
      (function(){var c=cat(),plan=f2Groups(c);if(!plan.ok){toast(ui.f2m==='draw'?'Termina el sorteo antes de crear los partidos':'No se pudieron armar los grupos');return;}plan.method=ui.f2m;
        c.fase2={method:plan.method,edited:!!plan.edited,date:today(),groups:plan.groups.map(function(g){return {id:g.id,teams:g.teams.map(function(x){return {id:x.id,rank:x.rank,pot:x.pot,orig:x.orig,tag:x.tag||''};})};})};ui.f2draft=null;ui.f2sel=null;
        c.fase2.groups.forEach(function(g){f2Matches(c,g).forEach(function(m){c.matches.push(m);});});if(plan.method==='draw'){c.fase2.drawLog=ui.draw.log.map(function(x){return {id:x.id,g:x.g+1,p:x.p+1,fixed:!!x.fixed};});try{sessionStorage.removeItem('malalas-draw');}catch(e){}ui.draw=null;}
        note('Fase intergrupos: '+plan.groups.length+' grupos confirmados');animate=true;render();toast('Grupos fijados y partidos creados. Publica para que los vean todos.');})();
      return;
    case 'ball':
    case 'draw-next':(function(){var D=ui.draw;if(!D||ui.drawBusy||drawPot(D)<0)return;ui.drawBusy=true;var id=drawPick(D);drawAnimate(function(){ui.drawBusy=false;if(drawPlace(D,id)<0)toast('No hay grupo válido para '+tname(cat(),id));drawSave();render();});})();return;
    case 'draw-pot':(function(){var D=ui.draw,p=drawPot(D);while(drawPot(D)===p){var id=drawPick(D);if(drawPlace(D,id)<0){toast('No hay grupo válido para '+tname(cat(),id));break;}}drawSave();render();})();return;
    case 'draw-undo':(function(){var D=ui.draw,x=D.log[D.log.length-1];if(!x||x.fixed)return;D.log.pop();D.groups[x.g][x.p]=null;var y=D.log[D.log.length-1];D.last=y&&!y.fixed?{id:y.id,g:y.g,p:y.p}:null;drawSave();render();})();return;
    case 'draw-reset':if(!t.dataset.confirm){t.dataset.confirm='1';t.textContent='¿Reiniciar? Confirmar';return;}drawInit(cat(),ui.draw.base,ui.draw.heads);render();return;
    case 'draw-full':(function(){var el=document.getElementById('drawstage');if(!el)return;try{if(document.fullscreenElement)document.exitFullscreen();else{var r=el.requestFullscreen&&el.requestFullscreen();if(r&&r.catch)r.catch(function(){toast('La pantalla completa no está disponible aquí');});}}catch(e){toast('La pantalla completa no está disponible aquí');}})();return;
    case 'draw-hide':(function(){var c=cat();c.hideDraw=true;ui.f2m='snake';note('Propuesta de sorteo oculta');render();})();return;
    case 'draw-show':(function(){var c=cat();delete c.hideDraw;ui.f2m='draw';note('Propuesta de sorteo visible');render();})();return;
    case 'fm-save':saveForm();return;
    case 'fm-noimg':ui.form.img='';var pv=document.getElementById('fm-prev');if(pv)pv.innerHTML='';return;
    case 'fm-nofile':ui.form.file=null;var fi=document.getElementById('fm-fileinfo');if(fi)fi.innerHTML='';return;
    case 'f2-undo':ui.f2draft=null;ui.f2sel=null;render();return;
    case 'f2-reset':
      if(!t.dataset.confirm){var n=cat().matches.filter(function(m){return m.interGroup&&m.played;}).length;t.dataset.confirm='1';t.textContent=n?'Se borran '+n+' resultados intergrupos. Confirmar':'Confirmar reinicio';return;}
      (function(){var c=cat();c.matches=c.matches.filter(function(m){return !m.interGroup;});ui.f2m=c.fase2&&c.fase2.method||ui.f2m;delete c.fase2;note('Fase intergrupos reiniciada');animate=true;render();toast('Fase intergrupos reiniciada. La fase 1 no cambió.');})();
      return;
    case 'ed-del':
      if(t.dataset.confirm){var c2=cat();c2.matches=c2.matches.filter(function(m){return m.id!==draft.id;});note('Eliminado '+tname(c2,draft.home)+' vs '+tname(c2,draft.away));closeModal();render();}
      else{t.dataset.confirm='1';t.textContent='Confirmar eliminación';}
      return;
    case 'btn-logout':NUBE.auth.signOut();return;
    case 'btn-publish':publish();return;
    case 'btn-discard':
      if(t.dataset.confirm){S=clone(ORIG);changes=[];persistDraft();render();toast('Cambios descartados');}
      else{t.dataset.confirm='1';t.textContent='¿Descartar todo?';}
      return;
  }
});
document.addEventListener('keydown',function(e){if(e.key==='Escape')closeModal();});
document.addEventListener('input',function(e){
  var t=e.target,ds=t.dataset;
  if(t.id==='f-q'){ui.m.q=t.value;document.getElementById('mlist').innerHTML=matchList(cat());return;}
  if(t.id==='f-sq'){ui.sc.q=t.value;var pos=t.selectionStart;render();var n=document.getElementById('f-sq');n.focus();try{n.setSelectionRange(pos,pos);}catch(x){}return;}
  if(!draft)return;
  if(t.id==='ed-round')draft.round=+t.value||1;
  else if(t.id==='ed-date')draft.date=t.value;
  else if(t.id==='ed-time')draft.time=t.value;
  else if(t.id==='ed-venue')draft.venue=t.value;
  else if(t.id==='ed-notes')draft.notes=t.value;
  else if(t.id==='ed-ph'||t.id==='ed-pa'){draft.pens=draft.pens||{};draft.pens[t.id==='ed-ph'?'h':'a']=t.value;}
  else if(t.id==='ed-hs'){draft.hs=t.value;goalWarn();}
  else if(t.id==='ed-as'){draft.as=t.value;goalWarn();}
  else if(ds.jlman){draft.jl[ds.jlman].manual=t.value===''?null:+t.value;refreshJl(ds.jlman);}
  else if(ds.jlpos){draft.jl[ds.jlpos].items[ds.k]=t.checked;refreshJl(ds.jlpos);}
  else if(ds.jlneg){draft.jl[ds.jlneg].items[ds.k]=Math.max(0,+t.value||0);refreshJl(ds.jlneg);}
  else if(ds.jladj){draft.jl[ds.jladj].adj=+t.value||0;refreshJl(ds.jladj);}
  else if(ds.gp!=null){draft.goals[+ds.gp].player=t.value;}
  else if(ds.gn!=null){draft.goals[+ds.gn].n=+t.value||0;goalWarn();}
});
document.addEventListener('change',function(e){
  var t=e.target;
  if(t.type==='file'){onFormFile(t);return;}
  if(t.id==='f-round'){ui.m.round=t.value;animate=true;render();return;}
  if(t.id==='f-st'){ui.sc.team=t.value;render();return;}
  if(t.dataset&&t.dataset.wopaid){var c3=cat(),mm=c3.matches.filter(function(x){return x.id===t.dataset.wopaid;})[0];if(mm){mm.woPaid=t.checked;var ws=woSide(mm);note('W.O. '+(t.checked?'pagado':'pendiente')+': '+tname(c3,ws&&ws.s==='h'?mm.home:mm.away));render();}return;}
  if(!draft)return;
  if(t.id==='ed-wo'){draft.wo=t.value;if(t.value!=='none'&&(draft.hs==null||draft.hs==='')&&(draft.as==null||draft.as==='')){draft.hs=t.value==='h'?0:3;draft.as=t.value==='h'?3:0;var a1=document.getElementById('ed-hs'),a2=document.getElementById('ed-as');if(a1)a1.value=draft.hs;if(a2)a2.value=draft.as;}return;}
  if(t.id==='ed-home'||t.id==='ed-away'){draft[t.id==='ed-home'?'home':'away']=t.value;draft.goals=[];draft.jl={};renderEditor();}
});

drawLoad();ui.f2m='draw';
render();
if(STANDALONE){
  dlApi={save:function(o){return new Promise(function(res){var u=URL.createObjectURL(o.data),a=document.createElement('a');a.href=u;a.download=o.filename;document.body.appendChild(a);a.click();a.remove();setTimeout(function(){URL.revokeObjectURL(u);},5000);res();});}};
  if(ADMIN&&!NUBE){canWrite=true;render();}
  if(ADMIN&&NUBE)initNube();
}
if(window.claude&&window.claude.use){
  window.claude.use('downloads').then(function(d){dlApi=d;}).catch(function(){});
  window.claude.use('artifact').then(function(a){
    artifactApi=a;if(!a){ui.edit=false;render();return;}
    return window.claude.use('user').then(function(u){
      var ok=null;try{ok=u&&u.canEdit?u.canEdit():null;}catch(x){ok=null;}
      return Promise.resolve(ok).then(function(v){canWrite=v!==false;if(!canWrite)ui.edit=false;render();});
    });
  }).catch(function(){});
}
})();
