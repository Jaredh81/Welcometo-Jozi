const $=s=>document.querySelector(s);
const q=(n)=>new URL(location.href).searchParams.get(n);
async function loadData(){
  if(q('preview')==='1'){
    const d=localStorage.getItem('guideDraft');
    if(d){ try{return JSON.parse(d);}catch(e){} }
  }
  const r=await fetch('/data/guide.json',{cache:'no-store'});
  return r.json();
}
function h(tag,a={},c=[]){const el=document.createElement(tag);for(const k in a){if(k==='class')el.className=a[k];else el.setAttribute(k,a[k]);}(Array.isArray(c)?c:[c]).forEach(x=>{if(x==null)return;typeof x==='string'?el.appendChild(document.createTextNode(x)):el.appendChild(x)});return el;}
function block(b){
  if(b.type==='heading') return h('div',{class:'card'},h('h3',{},b.text||''));
  if(b.type==='text') return h('div',{class:'card'},h('p',{},b.text||''));
  if(b.type==='icon') return h('div',{class:'card'},[h('strong',{},b.label||''),h('p',{},b.description||'')]);
  if(b.type==='image') return h('div',{class:'card'},[h('img',{src:b.url||'',class:'cover'}),b.caption?h('small',{},b.caption):null]);
  if(b.type==='list'){const ul=h('ul',{class:'card list'});(b.items||[]).forEach(i=>ul.appendChild(h('li',{},i)));return ul;}
  if(b.type==='accordion'){const wrap=h('div',{class:'card'});(b.items||[]).forEach((it,i)=>wrap.appendChild(h('details',{},[h('summary',{},it.title||('Item '+(i+1))),h('div',{},it.content||'')])));return wrap;}
  if(b.type==='info'){const ul=h('ul',{class:'card info'});(b.items||[]).forEach(i=>ul.appendChild(h('li',{},`${i.label||''}: ${i.value||''}`)));return ul;}
  if(b.type==='wifi'){return h('div',{class:'card'},[`WiFi SSID: ${b.ssid||''}`,h('br'),`Password: ${b.password||''}`]);}
  if(b.type==='status') return h('div',{class:`card status ${b.state||'success'}`},b.label||'Status');
  return h('div',{class:'card'},'[Unknown block]');
}
function page(p){
  if(p.enabled===false) return null;
  const wrap=h('section',{class:'page'});
  wrap.appendChild(h('div',{class:'ph'},[h('h2',{},p.title||'') ]));
  if(p.cover_image) wrap.appendChild(h('img',{src:p.cover_image,class:'cover'}));
  (p.sections||[]).forEach(sec=>{
    if(sec.title) wrap.appendChild(h('div',{class:'card'},h('h3',{},sec.title)));
    (sec.blocks||[]).forEach(b=>wrap.appendChild(block(b)));
  });
  return wrap;
}
(async()=>{
  const data=await loadData();
  document.title=(data.property?.name||'Guide')+' – Welcome';
  $('#title').textContent=data.property?.name||'Guide';
  $('#footerNote').textContent=data.brand?.footer||'';
  const c=$('#content'); c.innerHTML='';
  (data.pages||[]).forEach(p=>{const el=page(p); if(el) c.appendChild(el);});
})();