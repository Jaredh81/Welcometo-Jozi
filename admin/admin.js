const $ = s => document.querySelector(s);
const pagesPane = $('#pagesPane');
const editorPane = $('#editorPane');
const preview = $('#preview');

let DATA = null;
let currentPageId = null;

async function loadInitial(){
  const d = localStorage.getItem('guideDraft');
  if(d){ try{ DATA = JSON.parse(d); }catch{} }
  if(!DATA){ DATA = await (await fetch('/data/guide.json',{cache:'no-store'})).json(); }
}
function saveDraft(){ localStorage.setItem('guideDraft', JSON.stringify(DATA)); refreshPreview(); }
function loadDraft(){ const d=localStorage.getItem('guideDraft'); if(!d) return alert('No draft'); DATA=JSON.parse(d); draw(); refreshPreview(); }

$('#saveDraft').addEventListener('click', saveDraft);
$('#loadDraft').addEventListener('click', loadDraft);
$('#previewBtn').addEventListener('click', ()=>{ refreshPreview(true); window.open('/?preview=1','_blank'); });
$('#downloadBtn').addEventListener('click', ()=>{
  const blob = new Blob([JSON.stringify(DATA,null,2)], {type:'application/json'});
  const a = document.createElement('a'); a.href=URL.createObjectURL(blob); a.download='guide.json'; a.click(); URL.revokeObjectURL(a.href);
});

function refreshPreview(forceReload=false){
  localStorage.setItem('guideDraft', JSON.stringify(DATA));
  if(forceReload) preview.contentWindow?.location?.reload();
}

function drawPagesPane(){
  pagesPane.innerHTML = '<div class="panel"><h3>Pages</h3><div id="pagesList"></div><button class="btn" id="addPage">+ Add Page</button></div>';
  const list = pagesPane.querySelector('#pagesList');
  (DATA.pages||[]).forEach(p=>{
    const div=document.createElement('div'); div.className='pageTile';
    div.innerHTML = `<div class="title"><span>${p.icon||'📄'}</span> <strong>${p.title||'Untitled'}</strong></div>
    <div class="actions">
      <label class="small">On</label><input type="checkbox" class="switch" ${p.enabled!==false?'checked':''} data-id="${p.id}">
      <button class="btn small edit" data-id="${p.id}">Edit</button>
    </div>`;
    list.appendChild(div);
  });
  list.querySelectorAll('.edit').forEach(b=> b.addEventListener('click', ()=>{ currentPageId=b.dataset.id; drawEditor(); }));
  list.querySelectorAll('.switch').forEach(sw=> sw.addEventListener('change', ()=>{
    const pg = DATA.pages.find(x=>x.id===sw.dataset.id); if(pg){ pg.enabled = sw.checked; saveDraft(); }
  }));
  pagesPane.querySelector('#addPage').addEventListener('click', ()=>{
    const id = prompt('New page id (e.g., amenities)'); if(!id) return;
    const title = prompt('Page title', id.replace(/-/g,' ').replace(/\b\w/g, s=>s.toUpperCase()));
    (DATA.pages ||= []).push({id, title, enabled:true, icon:'📄', sections:[{id:'section-1', title:'', blocks:[] }]});
    saveDraft(); drawPagesPane();
  });
}

function inputRow(label, el){ const wrap=document.createElement('div'); wrap.innerHTML=`<label>${label}</label>`; wrap.appendChild(el); return wrap; }
const field=(name,val='',attrs={})=>{const el=document.createElement('input'); el.value=val||''; Object.entries(attrs).forEach(([k,v])=>el.setAttribute(k,v)); el.dataset.name=name; return el;};
const area=(name,val='',attrs={})=>{const el=document.createElement('textarea'); el.value=val||''; Object.entries(attrs).forEach(([k,v])=>el.setAttribute(k,v)); el.dataset.name=name; return el;};
function select(name,value,opts){ const el=document.createElement('select'); el.dataset.name=name; (opts||[]).forEach(o=>{const op=document.createElement('option'); op.value=o.value; op.textContent=o.label; if(value===o.value) op.selected=true; el.appendChild(op);}); return el; }

function starterFor(type){
  switch(type){
    case 'heading': return {type, text:'Section Heading'};
    case 'text': return {type, text:'Write something helpful'};
    case 'icon': return {type, icon:'⭐', label:'', description:''};
    case 'image': return {type, url:'', caption:''};
    case 'list': return {type, items:['Item 1','Item 2']};
    case 'accordion': return {type, items:[{title:'Question 1', content:'Answer'},{title:'Question 2', content:'Answer'}]};
    case 'info': return {type, items:[{label:'Label', value:'Value'}]};
    case 'wifi': return {type, ssid: DATA?.property?.wifi?.ssid || '', password: DATA?.property?.wifi?.password || '', qr: true };
    case 'status': return {type, label:'Heads up!', state:'warning'};
  }
  return {type:'text', text:''};
}

function drawBlocks(sec, sIdx){
  const container = editorPane.querySelector(`#blocks-${sIdx}`);
  container.innerHTML='';
  sec.blocks.forEach((b, idx)=>{
    const card=document.createElement('div'); card.className='block';
    card.innerHTML = `<h4>${b.type.toUpperCase()}</h4>
      <div class="controls">
        <button class="btn small upB" data-i="${idx}" data-s="${sIdx}">↑</button>
        <button class="btn small downB" data-i="${idx}" data-s="${sIdx}">↓</button>
        <button class="btn small delB" data-i="${idx}" data-s="${sIdx}">Delete</button>
      </div>`;
    const fields=document.createElement('div'); fields.className='grid';
    if(b.type==='heading') fields.appendChild(inputRow('Text', field('text', b.text)));
    if(b.type==='text') fields.appendChild(inputRow('Text', area('text', b.text)));
    if(b.type==='icon'){ fields.appendChild(inputRow('Icon', field('icon', b.icon))); fields.appendChild(inputRow('Label', field('label', b.label))); fields.appendChild(inputRow('Description', area('description', b.description))); }
    if(b.type==='image'){ fields.appendChild(inputRow('Image URL', field('url', b.url))); fields.appendChild(inputRow('Caption', field('caption', b.caption))); }
    if(b.type==='list'){ const ta=area('items', (b.items||[]).join('\\n')); ta.placeholder='One item per line'; fields.appendChild(inputRow('Items', ta)); }
    if(b.type==='accordion'){ const ta=area('items', JSON.stringify(b.items||[],null,2)); ta.placeholder='[{"title":"","content":""}]'; fields.appendChild(inputRow('Items (JSON)', ta)); }
    if(b.type==='info'){ const ta=area('items', JSON.stringify(b.items||[],null,2)); ta.placeholder='[{"label":"","value":""}]'; fields.appendChild(inputRow('Items (JSON)', ta)); }
    if(b.type==='wifi'){ fields.appendChild(inputRow('SSID', field('ssid', b.ssid))); fields.appendChild(inputRow('Password', field('password', b.password))); }
    if(b.type==='status'){ fields.appendChild(inputRow('Label', field('label', b.label))); fields.appendChild(inputRow('State', select('state', b.state, [{value:'success',label:'Success'},{value:'warning',label:'Warning'},{value:'error',label:'Error'}]))); }
    card.appendChild(fields); container.appendChild(card);
    fields.querySelectorAll('input,textarea,select').forEach(inp=>{
      inp.addEventListener('input', ()=>{
        if(inp.dataset.name==='items' && b.type==='list') b.items = inp.value.split('\\n').filter(Boolean);
        else if(inp.dataset.name==='items'){ try{ b.items = JSON.parse(inp.value||'[]'); }catch{} }
        else b[inp.dataset.name]=inp.value;
        saveDraft();
      });
    });
  });
  container.querySelectorAll('.upB').forEach(btn=> btn.addEventListener('click', ()=>{ const i=+btn.dataset.i,s=+btn.dataset.s; if(i>0){ [sec.blocks[i-1],sec.blocks[i]]=[sec.blocks[i],sec.blocks[i-1]]; saveDraft(); drawBlocks(sec,s);} }));
  container.querySelectorAll('.downB').forEach(btn=> btn.addEventListener('click', ()=>{ const i=+btn.dataset.i,s=+btn.dataset.s; if(i<sec.blocks.length-1){ [sec.blocks[i+1],sec.blocks[i]]=[sec.blocks[i],sec.blocks[i+1]]; saveDraft(); drawBlocks(sec,s);} }));
  container.querySelectorAll('.delB').forEach(btn=> btn.addEventListener('click', ()=>{ const i=+btn.dataset.i; if(confirm('Delete block?')){ sec.blocks.splice(i,1); saveDraft(); drawBlocks(sec,sIdx);} }));
  refreshPreview();
}

function drawEditor(){
  const page = DATA.pages.find(p=>p.id===currentPageId) || DATA.pages[0];
  if(!page){ editorPane.innerHTML='<div class="panel">No pages</div>'; return; }
  currentPageId=page.id;
  const html=[`<div class="panel"><h3>${page.title||'Untitled'}</h3>`,
    `<div class="row"><div class="small">ID: ${page.id}</div><button class="btn small" id="addSection">+ Add Section</button></div>`];
  (page.sections||[]).forEach((sec,sIdx)=>{
    html.push(`<div class="section" data-idx="${sIdx}">
      <div class="row" style="justify-content:space-between;align-items:center">
        <input value="${sec.title||''}" placeholder="Section title" class="secTitle" style="flex:1;margin-right:8px">
        <div class="controls">
          <button class="btn small upS" data-i="${sIdx}">↑</button>
          <button class="btn small downS" data-i="${sIdx}">↓</button>
          <button class="btn small delS" data-i="${sIdx}">Delete</button>
        </div>
      </div>
      <div class="blocks" id="blocks-${sIdx}"></div>
      <div class="addLine">
        <select class="blkType">
          <option value="text">Text</option>
          <option value="heading">Heading</option>
          <option value="icon">Icon Box</option>
          <option value="image">Image</option>
          <option value="list">List</option>
          <option value="accordion">Accordion</option>
          <option value="info">Info Box</option>
          <option value="wifi">WiFi</option>
          <option value="status">Status Box</option>
        </select>
        <button class="btn small addBlock" data-i="${sIdx}">Add block</button>
      </div>
    </div>`);
  });
  html.push('</div>');
  editorPane.innerHTML=html.join('');
  editorPane.querySelectorAll('.secTitle').forEach((inp,idx)=> inp.addEventListener('input', ()=>{ page.sections[idx].title = inp.value; saveDraft(); }));
  editorPane.querySelectorAll('.upS').forEach(b=> b.addEventListener('click', ()=>{ const i=+b.dataset.i; if(i>0){ [page.sections[i-1],page.sections[i]]=[page.sections[i],page.sections[i-1]]; saveDraft(); drawEditor(); } }));
  editorPane.querySelectorAll('.downS').forEach(b=> b.addEventListener('click', ()=>{ const i=+b.dataset.i; if(i<page.sections.length-1){ [page.sections[i+1],page.sections[i]]=[page.sections[i],page.sections[i+1]]; saveDraft(); drawEditor(); } }));
  editorPane.querySelectorAll('.delS').forEach(b=> b.addEventListener('click', ()=>{ const i=+b.dataset.i; if(confirm('Delete section?')){ page.sections.splice(i,1); saveDraft(); drawEditor(); } }));
  editorPane.querySelector('#addSection').addEventListener('click', ()=>{ page.sections.push({id:`section-${Date.now()}`, title:'', blocks:[]}); saveDraft(); drawEditor(); });
  page.sections.forEach((sec,sIdx)=> drawBlocks(sec,sIdx));
  editorPane.querySelectorAll('.addBlock').forEach(btn=> btn.addEventListener('click', ()=>{
    const sIdx=+btn.dataset.i; const type=btn.parentElement.querySelector('.blkType').value; page.sections[sIdx].blocks.push(starterFor(type)); saveDraft(); drawBlocks(page.sections[sIdx], sIdx);
  }));
}

async function draw(){
  await loadInitial();
  if(!DATA.pages) DATA.pages=[];
  drawPagesPane();
  currentPageId = (DATA.pages[0] && DATA.pages[0].id) || null;
  drawEditor();
  refreshPreview();
}

draw();