
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
 $('#menuBtn')?.addEventListener('click',()=>$('.sidebar').classList.toggle('open'));
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
 $('#resetAllData')?.addEventListener('click',()=>{if(confirm('Delete all Bow Remodel Vault data from this browser?')){db=emptyData();save();location.reload()}});
 fillSettings(); renderPage();
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
