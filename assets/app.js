
const KEY='bowRemodelVaultDataV1';
const emptyData=()=>({settings:{projectName:"Mom's Home Remodel",propertyName:"Main House",budget:0,theme:"light",compact:false},rooms:[],tasks:[],expenses:[],shopping:[],photos:[],measurements:[],materials:[],tools:[],contractors:[],documents:[],timeline:[]});
let db=load();
function load(){try{return {...emptyData(),...JSON.parse(localStorage.getItem(KEY)||'{}')}}catch{return emptyData()}}
function save(){localStorage.setItem(KEY,JSON.stringify(db));renderPage()}
const $=(s,r=document)=>r.querySelector(s), $$=(s,r=document)=>[...r.querySelectorAll(s)];
const money=n=>new Intl.NumberFormat('en-US',{style:'currency',currency:'USD'}).format(Number(n)||0);
const id=()=>Date.now().toString(36)+Math.random().toString(36).slice(2,7);
const today=()=>new Date().toISOString().slice(0,10);
document.documentElement.dataset.theme=db.settings.theme||'light';
document.body.classList.toggle('compact',!!db.settings.compact);

function init(){
 setupMobileNavigation();
 $$('[data-action="theme-toggle"]').forEach(b=>b.onclick=()=>{db.settings.theme=db.settings.theme==='dark'?'light':'dark';document.documentElement.dataset.theme=db.settings.theme;save()});
 $$('[data-action="open-quick-add"]').forEach(b=>b.onclick=openModal);
 $$('[data-action="close-modal"]').forEach(b=>b.onclick=closeModal);
 $('#modalBackdrop')?.addEventListener('click',closeModal);
 $$('[data-action="quick-export"]').forEach(b=>b.onclick=exportData);
 $$('[data-toggle-form]').forEach(b=>b.onclick=()=>$('#'+b.dataset.toggleForm)?.classList.toggle('hidden'));
 $$('form[data-form]').forEach(form=>form.addEventListener('submit',handleForm));
 $$('[data-search]').forEach(el=>el.addEventListener('input',renderPage));
 $$('[data-filter-status]').forEach(el=>el.addEventListener('change',renderPage));
 $$('[data-quick]').forEach(b=>b.onclick=()=>{location.href=({room:'rooms.html',task:'tasks.html',expense:'budget.html',shopping:'shopping.html',timeline:'timeline.html',measurement:'measurements.html'})[b.dataset.quick]});
 $('#saveGlobalBudget')?.addEventListener('click',()=>{db.settings.budget=Number($('#globalBudgetInput').value)||0;save()});
 $('#settingsForm')?.addEventListener('submit',e=>{e.preventDefault();Object.assign(db.settings,Object.fromEntries(new FormData(e.target)));save();alert('Settings saved.')});
 $('#compactToggle')?.addEventListener('change',e=>{db.settings.compact=e.target.checked;document.body.classList.toggle('compact',e.target.checked);save()});
 $('#importFile')?.addEventListener('change',importData);
 $('#selectAllExports')?.addEventListener('click',()=>$$('#exportChoices input[type="checkbox"]').forEach(x=>x.checked=true));
 $('#clearAllExports')?.addEventListener('click',()=>$$('#exportChoices input[type="checkbox"]').forEach(x=>x.checked=false));
 $('#runCustomExport')?.addEventListener('click',runCustomExport);
 $('#printSelectedExport')?.addEventListener('click',()=>printSelected(false));
 $('#pdfSelectedExport')?.addEventListener('click',()=>printSelected(true));
 addPageDownloadButton();
 $('#resetAllData')?.addEventListener('click',()=>{if(confirm('Delete all Bow Remodel Vault data from this browser?')){db=emptyData();save();location.reload()}});
 fillSettings();
 renderPage();
}

function setupMobileNavigation(){
 const sidebar=$('.sidebar');
 const menuBtn=$('#menuBtn');
 if(!sidebar||!menuBtn)return;

 let backdrop=$('.mobile-nav-backdrop');
 if(!backdrop){
   backdrop=document.createElement('div');
   backdrop.className='mobile-nav-backdrop';
   backdrop.setAttribute('aria-hidden','true');
   document.body.appendChild(backdrop);
 }

 let closeBtn=$('.mobile-nav-close',sidebar);
 if(!closeBtn){
   closeBtn=document.createElement('button');
   closeBtn.type='button';
   closeBtn.className='mobile-nav-close';
   closeBtn.setAttribute('aria-label','Close menu');
   closeBtn.innerHTML='&times;';
   sidebar.prepend(closeBtn);
 }

 function openNav(){
   sidebar.classList.add('open');
   backdrop.classList.add('show');
   document.body.classList.add('mobile-nav-open');
   menuBtn.setAttribute('aria-expanded','true');
   closeBtn.focus({preventScroll:true});
 }
 function closeNav(){
   sidebar.classList.remove('open');
   backdrop.classList.remove('show');
   document.body.classList.remove('mobile-nav-open');
   menuBtn.setAttribute('aria-expanded','false');
 }
 function toggleNav(){sidebar.classList.contains('open')?closeNav():openNav()}

 menuBtn.setAttribute('aria-controls','mobileSidebar');
 menuBtn.setAttribute('aria-expanded','false');
 sidebar.id=sidebar.id||'mobileSidebar';
 menuBtn.addEventListener('click',toggleNav);
 closeBtn.addEventListener('click',closeNav);
 backdrop.addEventListener('click',closeNav);
 sidebar.querySelectorAll('nav a').forEach(link=>link.addEventListener('click',closeNav));
 document.addEventListener('keydown',e=>{if(e.key==='Escape')closeNav()});
 window.addEventListener('resize',()=>{if(window.innerWidth>800)closeNav()});
}

function openModal(){$('#quickModal').classList.remove('hidden');$('#modalBackdrop').classList.remove('hidden')}
function closeModal(){$('#quickModal').classList.add('hidden');$('#modalBackdrop').classList.add('hidden')}
async function handleForm(e){
 e.preventDefault(); const form=e.target; const type=form.dataset.form; const fd=new FormData(form); let obj={id:id(),createdAt:new Date().toISOString()};
 for(const [k,v] of fd.entries()){if(k!=='file')obj[k]=v}
 const file=fd.get('file');
 if(file&&file.size){obj.fileName=file.name; if(file.type.startsWith('image/')&&file.size<2_000_000)obj.dataUrl=await toDataUrl(file)}
 const map={room:'rooms',task:'tasks',expense:'expenses',shopping:'shopping',photo:'photos',measurement:'measurements',material:'materials',tool:'tools',contractor:'contractors',document:'documents',timeline:'timeline'};
 db[map[type]].unshift(obj); form.reset(); form.closest('.panel')?.classList.add('hidden'); save();
}
function toDataUrl(file){return new Promise((res,rej)=>{const r=new FileReader();r.onload=()=>res(r.result);r.onerror=rej;r.readAsDataURL(file)})}
function renderPage(){
 const page=document.body.dataset.page;
 if(page==='dashboard')renderDashboard();
 else if(page==='reports')renderReports();
 else if(page==='settings')fillSettings();
 else {
  const map={rooms:'room',tasks:'task',budget:'expense',shopping:'shopping',photos:'photo',measurements:'measurement',materials:'material',tools:'tool',contractors:'contractor',documents:'document',timeline:'timeline'};
  const type=map[page]; if(type)renderList(type);
 }
 if(page==='budget'){ $('#globalBudgetInput').value=db.settings.budget||''; $('#budgetTotal').textContent=money(db.settings.budget)}
}
function getCollection(type){return db[{room:'rooms',task:'tasks',expense:'expenses',shopping:'shopping',photo:'photos',measurement:'measurements',material:'materials',tool:'tools',contractor:'contractors',document:'documents',timeline:'timeline'}[type]]}
function renderList(type){
 const list=$('#'+type+'List'); if(!list)return;
 const q=($(`[data-search="${type}"]`)?.value||'').toLowerCase();
 const status=$(`[data-filter-status="${type}"]`)?.value||'';
 const items=getCollection(type).filter(x=>JSON.stringify(x).toLowerCase().includes(q)&&(!status||x.status===status));
 list.innerHTML=items.length?items.map(x=>card(type,x)).join(''):'<div class="empty-state">Nothing added yet.</div>';
 $$('[data-delete]',list).forEach(b=>b.onclick=()=>remove(type,b.dataset.delete));
 $$('[data-complete]',list).forEach(b=>b.onclick=()=>complete(type,b.dataset.complete));
}
function card(type,x){
 const parts=[];
 if(x.room)parts.push(x.room); if(x.status)parts.push(x.status); if(x.priority)parts.push(x.priority); if(x.category)parts.push(x.category); if(x.date)parts.push(x.date);
 if(type==='expense')parts.push(money((+x.amount||0)+(+x.tax||0)));
 if(type==='room')parts.push((x.progress||0)+'%');
 if(type==='shopping'&&x.quantity)parts.push('Qty '+x.quantity);
 if(type==='material'&&x.quantity)parts.push(x.quantity+' '+(x.unit||''));
 const img=x.dataUrl?`<img class="photo-thumb" src="${x.dataUrl}" alt="">`:'';
 const note=x.notes?`<p>${escapeHtml(x.notes)}</p>`:'';
 const complete=(['task','room'].includes(type)&&x.status!=='Completed')?`<button class="complete" data-complete="${x.id}">Complete</button>`:'';
 const progress=type==='room'?`<div class="progress-line"><span style="width:${Math.min(100,+x.progress||0)}%"></span></div>`:'';
 return `<article class="entity-card">${img}<small>${label(type)}</small><h3>${escapeHtml(x.name||'Untitled')}</h3>${progress}<div class="entity-meta">${parts.filter(Boolean).map(p=>`<span class="chip ${String(p).toLowerCase()}">${escapeHtml(String(p))}</span>`).join('')}</div>${note}<div class="card-actions">${complete}<button class="delete" data-delete="${x.id}">Delete</button></div></article>`
}
function label(t){return ({room:'ROOM',task:'TASK',expense:'EXPENSE',shopping:'SHOPPING',photo:'PHOTO',measurement:'MEASUREMENT',material:'MATERIAL',tool:'TOOL',contractor:'CONTRACTOR',document:'DOCUMENT',timeline:'TIMELINE'})[t]}
function remove(type,i){if(confirm('Delete this item?')){const a=getCollection(type);db[a===db.rooms?'rooms':a===db.tasks?'tasks':a===db.expenses?'expenses':a===db.shopping?'shopping':a===db.photos?'photos':a===db.measurements?'measurements':a===db.materials?'materials':a===db.tools?'tools':a===db.contractors?'contractors':a===db.documents?'documents':'timeline']=a.filter(x=>x.id!==i);save()}}
function complete(type,i){const a=getCollection(type),x=a.find(x=>x.id===i);if(x){x.status='Completed';if(type==='room')x.progress=100;save()}}
function renderDashboard(){
 const spent=db.expenses.reduce((s,x)=>s+(+x.amount||0)+(+x.tax||0),0), budget=+db.settings.budget||0;
 const doneRooms=db.rooms.filter(x=>x.status==='Completed'||+x.progress===100).length,doneTasks=db.tasks.filter(x=>x.status==='Completed').length;
 const overall=db.rooms.length?Math.round(db.rooms.reduce((s,x)=>s+(+x.progress||0),0)/db.rooms.length):0;
 $('#overallProgress').textContent=overall+'%';$('#statRooms').textContent=db.rooms.length;$('#statRoomsDone').textContent=doneRooms+' completed';
 $('#statTasks').textContent=db.tasks.length;$('#statTasksDone').textContent=doneTasks+' completed';$('#statSpent').textContent=money(spent);$('#statRemaining').textContent=money(budget-spent);$('#statBudgetLabel').textContent=budget?'of '+money(budget):'No budget set';
 $('#dashboardRooms').innerHTML=db.rooms.length?db.rooms.slice(0,6).map(r=>`<div class="room-progress-item"><strong>${escapeHtml(r.name)}</strong><div class="progress-line"><span style="width:${+r.progress||0}%"></span></div><span>${+r.progress||0}%</span></div>`).join(''):'Add a room to begin tracking progress.';
 const tasks=db.tasks.filter(x=>x.status!=='Completed').sort((a,b)=>rank(b.priority)-rank(a.priority)).slice(0,5);
 $('#priorityTasks').innerHTML=tasks.length?tasks.map(x=>`<div><strong>${escapeHtml(x.name)}</strong><small>${escapeHtml(x.room||'No room')} · ${escapeHtml(x.priority||'Normal')}</small></div>`).join(''):'No active tasks yet.';
 $('#recentExpenses').innerHTML=db.expenses.length?db.expenses.slice(0,5).map(x=>`<div><strong>${escapeHtml(x.name)}</strong><small>${escapeHtml(x.vendor||'')} · ${money((+x.amount||0)+(+x.tax||0))}</small></div>`).join(''):'No expenses recorded.';
 $('#recentTimeline').innerHTML=db.timeline.length?db.timeline.slice(0,5).map(x=>`<div class="timeline-item"><strong>${escapeHtml(x.name)}</strong><p>${escapeHtml(x.date||'')} ${escapeHtml(x.room||'')}</p></div>`).join(''):'No timeline entries yet.';
}
function rank(p){return({Urgent:4,High:3,Normal:2,Low:1})[p]||0}
function renderReports(){
 const spent=db.expenses.reduce((s,x)=>s+(+x.amount||0)+(+x.tax||0),0), budget=+db.settings.budget||0, hours=db.timeline.reduce((s,x)=>s+(+x.hours||0),0)+db.tasks.reduce((s,x)=>s+(+x.actualHours||0),0);
 $('#reportBudget').textContent=money(budget);$('#reportSpent').textContent=money(spent);$('#reportRemaining').textContent=money(budget-spent);$('#reportHours').textContent=hours.toFixed(1);
 const cats={};db.expenses.forEach(x=>cats[x.category||'Uncategorized']=(cats[x.category||'Uncategorized']||0)+(+x.amount||0)+(+x.tax||0));const max=Math.max(1,...Object.values(cats));
 $('#categoryReport').innerHTML=Object.keys(cats).length?Object.entries(cats).sort((a,b)=>b[1]-a[1]).map(([k,v])=>`<div class="bar-row"><strong>${escapeHtml(k)}</strong><div class="bar"><span style="width:${v/max*100}%"></span></div><span>${money(v)}</span></div>`).join(''):'No expenses yet.';
 $('#roomReport').innerHTML=db.rooms.length?db.rooms.map(r=>`<div class="bar-row"><strong>${escapeHtml(r.name)}</strong><div class="bar"><span style="width:${+r.progress||0}%"></span></div><span>${+r.progress||0}%</span></div>`).join(''):'No rooms yet.';
 $('#summaryReport').innerHTML=`<p><strong>${db.rooms.length}</strong> rooms · <strong>${db.tasks.length}</strong> tasks · <strong>${db.tasks.filter(x=>x.status==='Completed').length}</strong> completed tasks · <strong>${db.shopping.filter(x=>!['Purchased','Delivered'].includes(x.status)).length}</strong> shopping items still needed · <strong>${db.materials.filter(x=>['Running Low','Out of Stock'].includes(x.status)).length}</strong> low-stock materials.</p>`;
}
function fillSettings(){
 const f=$('#settingsForm');if(f)Object.entries(db.settings).forEach(([k,v])=>{if(f.elements[k])f.elements[k].value=v||''});
 if($('#compactToggle'))$('#compactToggle').checked=!!db.settings.compact;
}
function exportData(){const blob=new Blob([JSON.stringify(db,null,2)],{type:'application/json'});const a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download='bow-remodel-vault-backup-'+today()+'.json';a.click();URL.revokeObjectURL(a.href)}
function importData(e){const file=e.target.files[0];if(!file)return;const r=new FileReader();r.onload=()=>{try{db={...emptyData(),...JSON.parse(r.result)};save();alert('Backup imported.')}catch{alert('That file is not a valid backup.')}};r.readAsText(file)}
function escapeHtml(v){return String(v??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]))}
document.addEventListener('DOMContentLoaded',init);


function downloadBlob(content,fileName,type='text/plain;charset=utf-8'){
 const blob=content instanceof Blob?content:new Blob([content],{type});
 const a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download=fileName;document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(a.href),500);
}
function safeFileName(value){return String(value||'bow-remodel-vault').toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'')||'bow-remodel-vault'}
function selectedExportKeys(){return $$('#exportChoices input[type="checkbox"]:checked').map(x=>x.value)}
function runCustomExport(){
 const keys=selectedExportKeys();
 if(!keys.length){alert('Choose at least one section to export.');return}
 const format=$('#customExportFormat')?.value||'json';
 if(format==='pdf'){printSelected(true);return}
 if(format==='print'){printSelected(false);return}
 if(format==='json'){
   const selected={exportedAt:new Date().toISOString(),app:'Bow Remodel Vault'};
   keys.forEach(k=>selected[k]=db[k]);
   downloadBlob(JSON.stringify(selected,null,2),`bow-remodel-selected-${today()}.json`,'application/json');
   return;
 }
 const listKeys=keys.filter(k=>k!=='settings');
 if(keys.includes('settings')) downloadCollectionCsv('settings',[db.settings]);
 if(!listKeys.length&&!keys.includes('settings')){alert('Choose at least one list.');return}
 listKeys.forEach((k,index)=>setTimeout(()=>downloadCollectionCsv(k,db[k]||[]),index*180));
}
function csvEscape(value){
 if(value===null||value===undefined)return '';
 let text=typeof value==='object'?JSON.stringify(value):String(value);
 return /[",\n\r]/.test(text)?'"'+text.replace(/"/g,'""')+'"':text;
}
function collectionToCsv(items){
 if(!items.length)return 'No records\n';
 const ignored=new Set(['dataUrl']);
 const headers=[...new Set(items.flatMap(item=>Object.keys(item).filter(k=>!ignored.has(k))))];
 return [headers.map(csvEscape).join(','),...items.map(item=>headers.map(h=>csvEscape(item[h])).join(','))].join('\r\n');
}
function downloadCollectionCsv(name,items){downloadBlob('\ufeff'+collectionToCsv(items),`bow-remodel-${safeFileName(name)}-${today()}.csv`,'text/csv;charset=utf-8')}
function addPageDownloadButton(){
 const page=document.body.dataset.page;
 const map={rooms:'rooms',tasks:'tasks',budget:'expenses',shopping:'shopping',photos:'photos',measurements:'measurements',materials:'materials',tools:'tools',contractors:'contractors',documents:'documents',timeline:'timeline'};
 const key=map[page]; if(!key)return;
 const intro=$('.page-intro'); if(!intro)return;
 let actions=intro.querySelector('.page-intro-actions');
 if(!actions){actions=document.createElement('div');actions.className='page-intro-actions';const add=intro.querySelector('button[data-toggle-form]');if(add){add.replaceWith(actions);actions.appendChild(add)}}
 const button=document.createElement('button');button.type='button';button.className='ghost list-download';button.textContent='↓ Download CSV';button.onclick=()=>downloadCollectionCsv(key,db[key]||[]);actions.appendChild(button);
 const printButton=document.createElement('button');printButton.type='button';printButton.className='ghost';printButton.textContent='🖨 Print List';printButton.onclick=()=>printSections([key],false);actions.appendChild(printButton);
 const pdfButton=document.createElement('button');pdfButton.type='button';pdfButton.className='ghost';pdfButton.textContent='📄 Save PDF';pdfButton.onclick=()=>printSections([key],true);actions.appendChild(pdfButton);
}

const exportLabels={settings:'Project Settings',rooms:'Rooms',tasks:'Tasks',expenses:'Expenses',shopping:'Shopping List',photos:'Photo Records',measurements:'Measurements',materials:'Materials',tools:'Tools',contractors:'Contractors',documents:'Document Records',timeline:'Timeline'};
function printSelected(asPdf){
 const keys=selectedExportKeys();
 if(!keys.length){alert('Choose at least one section to print or save as PDF.');return}
 printSections(keys,asPdf);
}
function printableValue(value){
 if(value===null||value===undefined||value==='')return '—';
 if(typeof value==='object')return escapeHtml(JSON.stringify(value));
 return escapeHtml(String(value));
}
function printableSection(key){
 const label=exportLabels[key]||key;
 const items=key==='settings'?[db.settings]:(db[key]||[]);
 if(!items.length)return `<section><h2>${escapeHtml(label)}</h2><p class="empty">No records.</p></section>`;
 const ignored=new Set(['dataUrl','id','createdAt']);
 const headers=[...new Set(items.flatMap(item=>Object.keys(item).filter(k=>!ignored.has(k))))];
 const rows=items.map(item=>`<tr>${headers.map(h=>`<td>${printableValue(item[h])}</td>`).join('')}</tr>`).join('');
 return `<section><h2>${escapeHtml(label)}</h2><div class="table-wrap"><table><thead><tr>${headers.map(h=>`<th>${escapeHtml(h.replace(/([A-Z])/g,' $1').replace(/^./,c=>c.toUpperCase()))}</th>`).join('')}</tr></thead><tbody>${rows}</tbody></table></div></section>`;
}
function printSections(keys,asPdf=false){
 const project=escapeHtml(db.settings.projectName||'Bow Remodel Vault');
 const modeNote=asPdf?'In the print window, choose “Save as PDF” as the destination.':'Choose your printer and print settings in the window that opens.';
 const sections=keys.map(printableSection).join('');
 const reportHtml=`<!doctype html><html><head><meta charset="utf-8"><title>${project} Report</title><style>
 body{font-family:Arial,Helvetica,sans-serif;color:#17233a;margin:28px}header{border-bottom:3px solid #3157d5;padding-bottom:14px;margin-bottom:24px}h1{margin:0 0 5px;font-size:28px}header p{margin:4px 0;color:#596579}.notice{background:#eef3ff;border:1px solid #b9c7ff;padding:10px 12px;border-radius:8px;margin:14px 0 22px}section{margin:0 0 30px}h2{font-size:20px;border-left:5px solid #f6b73c;padding-left:10px}.table-wrap{overflow:visible}table{width:100%;border-collapse:collapse;font-size:11px;table-layout:auto}th,td{border:1px solid #cfd7e3;padding:7px;text-align:left;vertical-align:top;word-break:break-word}th{background:#edf2f8}tr:nth-child(even) td{background:#fafbfd}.empty{color:#667085}.footer{margin-top:35px;border-top:1px solid #ccd5e1;padding-top:10px;color:#667085;font-size:10px}@page{size:auto;margin:12mm}@media print{.notice{display:none}body{margin:0}section{break-inside:auto}thead{display:table-header-group}tr{break-inside:avoid}}
 </style></head><body><header><h1>${project}</h1><p>Bow Remodel Vault</p><p>Generated ${new Date().toLocaleString()}</p></header><div class="notice">${escapeHtml(modeNote)}</div>${sections}<div class="footer">Generated by Bow Remodel Vault · remodel.potterservice.com</div></body></html>`;
 let frame=document.getElementById('bowPrintFrame');
 if(frame)frame.remove();
 frame=document.createElement('iframe');
 frame.id='bowPrintFrame';
 frame.setAttribute('aria-hidden','true');
 frame.style.position='fixed';
 frame.style.right='0';
 frame.style.bottom='0';
 frame.style.width='1px';
 frame.style.height='1px';
 frame.style.border='0';
 frame.style.opacity='0';
 document.body.appendChild(frame);
 const doc=frame.contentWindow.document;
 doc.open();
 doc.write(reportHtml);
 doc.close();
 const launchPrint=()=>{
   try{
     frame.contentWindow.focus();
     frame.contentWindow.print();
   }catch(error){
     console.error('Print failed:',error);
     alert('The print window could not open. Please check your browser print or pop-up settings and try again.');
   }
   setTimeout(()=>frame.remove(),1500);
 };
 if(doc.readyState==='complete')setTimeout(launchPrint,200);
 else frame.onload=()=>setTimeout(launchPrint,200);
}

