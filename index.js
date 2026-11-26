const TASKS=[
 {id:'office',label:'Office cleaning',fields:[{k:'area',t:'text',l:'Area cleaned'},{k:'time',t:'time',l:'Time completed'}]},
 {id:'toilet',label:'Toilet cleaning',fields:[{k:'time',t:'time',l:'Time cleaned'},{k:'cond',t:'select',l:'Condition',o:['Clean','Fair','Needs repair']}]},
 {id:'waste',label:'Waste disposal',fields:[{k:'removed',t:'select',l:'Was waste removed?',o:['Yes','Partly','No']}]},
 {id:'dust',label:'Dusting',fields:[{k:'areas',t:'text',l:'Offices, furniture and surfaces'}]},
 {id:'mop',label:'Mopping',fields:[{k:'areas',t:'text',l:'Floors and corridors'}]},
 {id:'stock',label:'Restocking',fields:[{k:'items',t:'text',l:'Soap, tissue and other supplies'}]}
];
const W=(id,label,l)=>({id,label,fields:[{k:'areas',t:'text',l}]});
const WEEKLY=[
 {id:'ac',label:'Air conditioner cleaning',fields:[{k:'areas',t:'text',l:'Offices or units cleaned'},{k:'part',t:'select',l:'Work done',o:['Filters and vents','Full wipe-down','Needs servicing']}]},
 W('sweep','Sweeping outside','Compound, entrance and walkways'),
 {id:'disp',label:'Water dispenser cleaning',fields:[{k:'areas',t:'text',l:'Dispensers cleaned'},{k:'cond',t:'select',l:'Condition',o:['Clean','Needs repair']}]},
 W('window','Window frames','Windows and frames cleaned'),
 W('glass','Glass doors and partitions','Doors and partitions cleaned'),
 W('fans','Ceiling fans and vents','Fans and vents cleaned'),
 W('curtain','Curtains and blinds','Rooms covered'),
 W('fridge','Fridge and kitchenette','Items cleaned'),
 W('bins','Washing waste bins','Bins washed'),
 W('stairs','Stairs and railings','Stairs and railings cleaned'),
 W('other','Other weekly job','What was done')
];
const MONTHLY=[
 W('carpet','Carpets, rugs and upholstery','Items deep cleaned'),
 W('floor','Floor scrubbing and polishing','Floors and corridors covered'),
 W('walls','Walls and ceilings','Areas dusted or wiped, cobwebs removed'),
 W('lights','Light fittings','Fittings cleaned'),
 W('toilet','Toilet deep clean and descaling','Toilets covered'),
 W('drains','Drains and gutters','Drains and gutters cleared'),
 W('pest','Pest control check','Findings'),
 W('stock','Supplies and equipment stock-take','Items running low'),
 W('other','Other monthly job','What was done')
];
const SETS={daily:TASKS,weekly:WEEKLY,monthly:MONTHLY};
// Supervisor contacts for alerts. WhatsApp: international format, e.g. '2349123456789'.
const NOTIFY={whatsapp:'2347052340663',email:'abimbola@pertinencegroup.com'};
function msgFor(r){
 const L=SETS[r.kind||'daily'],jobs=L.filter(t=>r.tasks[t.id]).map(t=>t.label).join(', ')||'none';
 const type={daily:'Daily log',weekly:'Weekly jobs',monthly:'Monthly deep cleaning'}[r.kind||'daily'];
 return 'New housekeeping record waiting for approval\nType: '+type+'\nStaff: '+r.staff+'\nDate: '+r.date+'\nJobs done: '+jobs+(r.challenges?'\nChallenges: '+r.challenges:'');
}
function notifyHTML(r){
 const m=msgFor(r),n=NOTIFY.whatsapp.replace(/\D/g,'');
 return `<div class="notify"><div class="meta">Send a quick alert so your supervisor knows to check it.</div><div class="acts"><a class="btn" target="_blank" rel="noopener" href="https://wa.me/${n}?text=${encodeURIComponent(m)}">Send on WhatsApp</a><a class="btn alt" target="_blank" rel="noopener" href="mailto:${esc(NOTIFY.email)}?subject=${encodeURIComponent('Housekeeping record waiting for approval')}&amp;body=${encodeURIComponent(m)}">Send by email</a></div></div>`;
}
const KEY='housekeeping-log-v1';
let recs=[],role='staff',kind='daily',filter='pending',lastRec=null,note={t:'',c:''};
try{recs=JSON.parse(localStorage.getItem(KEY))||[]}catch(e){recs=[]}
const save=()=>{try{localStorage.setItem(KEY,JSON.stringify(recs))}catch(e){}};
const esc=s=>String(s==null?'':s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const today=()=>new Date().toLocaleDateString('en-CA');
const monday=()=>{const d=new Date();d.setDate(d.getDate()-((d.getDay()+6)%7));return d.toLocaleDateString('en-CA')};
const $=(s,r=document)=>r.querySelector(s);
const app=$('#app');

function fieldHTML(t,f){
 const n=t.id+'.'+f.k;
 const inp=f.t==='select'?`<select name="${n}"><option value="">Choose</option>${f.o.map(o=>`<option>${o}</option>`).join('')}</select>`:`<input type="${f.t}" name="${n}">`;
 return `<label class="f"><span>${f.l}</span>${inp}</label>`;
}
function staffView(){
 const mine=recs.slice().reverse(),wk=kind==='weekly',mo=kind==='monthly';
 return `<div class="chips"><button type="button" data-kind="daily" aria-pressed="${!wk&&!mo}">Daily log</button><button type="button" data-kind="weekly" aria-pressed="${wk}">Weekly jobs</button><button type="button" data-kind="monthly" aria-pressed="${mo}">Monthly deep cleaning</button></div>
 <section class="panel"><h2>${wk?'Record this week’s jobs':mo?'Record this month’s deep cleaning':'Record today’s work'}</h2>
 <p class="sub">${wk?'Tick each weekly job you finished and add the details.':mo?'Tick each deep-cleaning job you finished and add the details.':'Tick each job you did and add the details.'} Your supervisor will check it.</p>
 <form id="f" novalidate>
  <div class="row">
   <label class="f"><span>Your name</span><input type="text" name="staff" autocomplete="name"></label>
   <label class="f"><span>${wk?'Week starting (Monday)':mo?'Date completed':'Date'}</span><input type="date" name="date" value="${wk?monday():today()}"></label>
   ${wk||mo?'':'<label class="f"><span>Shift</span><select name="shift"><option>Morning</option><option>Afternoon</option><option>Night</option></select></label>'}
  </div>
  ${SETS[kind].map(t=>`<div class="task" data-id="${t.id}"><label class="tick"><input type="checkbox" name="done-${t.id}"><span>${t.label}</span></label><div class="fields" hidden>${t.fields.map(f=>fieldHTML(t,f)).join('')}</div></div>`).join('')}
  <label class="f" style="margin-top:14px"><span>${wk?'Challenges this week':mo?'Challenges this month':'Challenges during the shift'}</span><textarea name="challenges" placeholder="For example: no water in the second-floor toilet"></textarea></label>
  <div class="acts"><button class="btn" type="submit">Submit for approval</button></div>
  <p class="msg ${note.c}" role="status">${esc(note.t)}</p>
  ${note.c==='good'&&lastRec?notifyHTML(lastRec):''}
 </form></section>
 <section><h2 style="margin:22px 0 12px">Submitted records</h2>${mine.length?mine.map(r=>recHTML(r,false)).join(''):'<div class="panel empty">Nothing submitted yet. Your records appear here with their approval status.</div>'}</section>`;
}
function recHTML(r,sup){
 const done=SETS[r.kind||'daily'].filter(t=>r.tasks[t.id]);
 const line=t=>{const d=r.tasks[t.id];const parts=t.fields.map(f=>d[f.k]?`${f.l}: ${esc(d[f.k])}`:'').filter(Boolean);return `<dt>${t.label}</dt><dd>${parts.join('; ')||'Done'}</dd>`};
 return `<article class="panel rec" data-rid="${r.id}">
  <div class="top"><div><h3>${esc(r.staff)}</h3><div class="meta">${r.kind==='weekly'?'Weekly jobs · week of '+esc(r.date):r.kind==='monthly'?'Monthly deep cleaning · '+esc(r.date):esc(r.date)+' · '+esc(r.shift)+' shift'}</div></div><span class="badge b-${r.status}">${{pending:'Waiting for approval',approved:'Approved',returned:'Returned'}[r.status]}</span></div>
  <dl>${done.map(line).join('')||'<dt>Jobs</dt><dd>None ticked</dd>'}${r.challenges?`<dt>Challenges</dt><dd>${esc(r.challenges)}</dd>`:''}</dl>
  ${r.remarks?`<div class="note"><strong>Supervisor’s remarks:</strong> ${esc(r.remarks)}</div>`:''}
  ${sup&&r.status==='pending'?`<label class="f"><span>Inspection remarks</span><textarea data-rem placeholder="Add remarks from your inspection"></textarea></label><div class="acts"><button class="btn" data-act="approved">Approve record</button><button class="btn alt" data-act="returned">Return for correction</button></div>`:''}
 </article>`;
}
function supView(){
 const cnt=s=>recs.filter(r=>r.status===s).length;
 const list=recs.filter(r=>r.status===filter).reverse();
 const chip=(s,l)=>`<button type="button" data-filter="${s}" aria-pressed="${filter===s}">${l} (${cnt(s)})</button>`;
 return `<section><h2 style="margin-bottom:4px">Records to check</h2><p class="sub">Review each record, add your inspection remarks, then approve it or send it back.</p>
 <div class="chips">${chip('pending','Waiting')}${chip('approved','Approved')}${chip('returned','Returned')}</div>
 ${list.length?list.map(r=>recHTML(r,true)).join(''):`<div class="panel empty">${filter==='pending'?'No records waiting. New submissions from staff show up here.':'No records in this list yet.'}</div>`}</section>`;
}
function render(){
 document.querySelectorAll('[data-role]').forEach(b=>b.setAttribute('aria-pressed',b.dataset.role===role));
 app.innerHTML=role==='staff'?staffView():supView();
}
document.addEventListener('click',e=>{
 const b=e.target.closest('button');if(!b)return;
 if(b.dataset.role){role=b.dataset.role;note={t:'',c:''};render();}
 else if(b.dataset.kind){kind=b.dataset.kind;note={t:'',c:''};render();}
 else if(b.dataset.filter){filter=b.dataset.filter;render();}
 else if(b.dataset.act){
  const card=b.closest('[data-rid]');const r=recs.find(x=>x.id===card.dataset.rid);
  r.status=b.dataset.act;r.remarks=$('[data-rem]',card).value.trim();save();render();
 }
});
document.addEventListener('change',e=>{
 if(e.target.type==='checkbox'&&e.target.name.startsWith('done-')){
  const task=e.target.closest('.task');task.classList.toggle('on',e.target.checked);
  $('.fields',task).hidden=!e.target.checked;
 }
});
// Show a form error without re-rendering, so nothing the staff member entered is lost
function showErr(form,text,focusName){
 note={t:'',c:''};
 const m=$('.msg',form);m.className='msg err';m.textContent=text;
 const n=$('.notify',form);if(n)n.remove();
 if(focusName){const el=form.elements[focusName];if(el)el.focus();}
}
document.addEventListener('submit',e=>{
 e.preventDefault();
 const fd=new FormData(e.target),tasks={};
 SETS[kind].forEach(t=>{if(fd.get('done-'+t.id)){tasks[t.id]={};t.fields.forEach(f=>tasks[t.id][f.k]=fd.get(t.id+'.'+f.k)||'')}});
 const staff=(fd.get('staff')||'').trim(),ch=(fd.get('challenges')||'').trim();
 if(!staff){showErr(e.target,'Enter your name before you submit.','staff');return;}
 if(!Object.keys(tasks).length&&!ch){showErr(e.target,'Tick at least one job or describe a challenge.');return;}
 recs.push({id:Date.now().toString(36),staff,date:fd.get('date')||today(),kind,shift:fd.get('shift')||(kind==='weekly'?'Weekly':'Monthly'),tasks,challenges:ch,status:'pending',remarks:''});
 save();lastRec=recs[recs.length-1];note={t:'Submitted. Now alert your supervisor so they can check it.',c:'good'};render();
});
render();
