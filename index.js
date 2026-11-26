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
 const k=r.kind||'daily',L=SETS[k];
 const type={daily:'Daily log',weekly:'Weekly jobs',monthly:'Monthly deep cleaning'}[k];
 const when=k==='weekly'?'Week starting: '+r.date:k==='daily'?'Date: '+r.date+' ('+r.shift+' shift)':'Date: '+r.date;
 const jobs=L.filter(t=>r.tasks[t.id]).map(t=>{
  const d=r.tasks[t.id],parts=t.fields.map(f=>d[f.k]?f.l+': '+d[f.k]:'').filter(Boolean);
  return '- '+t.label+(parts.length?' ('+parts.join('; ')+')':'');
 });
 return 'New housekeeping record waiting for approval\nType: '+type+'\nStaff: '+r.staff+'\n'+when+'\n\nJobs done:\n'+(jobs.join('\n')||'- none')+(r.challenges?'\n\nChallenges: '+r.challenges:'');
}
function notifyHTML(r){
 const m=msgFor(r),n=NOTIFY.whatsapp.replace(/\D/g,'');
 return `<div class="notify"><div class="meta">Send a quick alert so your supervisor knows to check it.</div><div class="acts"><a class="btn" target="_blank" rel="noopener" href="https://wa.me/${n}?text=${encodeURIComponent(m)}">Send on WhatsApp</a><a class="btn alt" target="_blank" rel="noopener" href="mailto:${esc(NOTIFY.email)}?subject=${encodeURIComponent('Housekeeping record waiting for approval')}&amp;body=${encodeURIComponent(m)}">Send by email</a></div></div>`;
}
// Firebase settings. Paste the values from Firebase console > Project settings > Your apps > Web app.
// While projectId is empty the log keeps working the old way: records stay on this device only.
const FIREBASE_CONFIG={apiKey:'',authDomain:'',projectId:'',appId:''};
const ONLINE=!!(FIREBASE_CONFIG.projectId&&window.firebase);
const KEY='housekeeping-log-v1',MINE_KEY='housekeeping-mine-v1';
let recs=[],role='staff',kind='daily',filter='pending',lastRec=null,note={t:'',c:''};
let user=null,db=null,auth=null,banner='';
const load=(k,d)=>{try{return JSON.parse(localStorage.getItem(k))||d}catch(e){return d}};
const store=(k,v)=>{try{localStorage.setItem(k,JSON.stringify(v))}catch(e){}};
let mine=load(MINE_KEY,[]);
if(!ONLINE)recs=load(KEY,[]);
const save=()=>{if(!ONLINE)store(KEY,recs)};
const myRecs=()=>ONLINE?recs.filter(r=>mine.includes(r.id)):recs;
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
function mineHTML(){
 const mine=myRecs().slice().reverse();
 return `<h2 style="margin:22px 0 12px">Submitted records</h2>${mine.length?mine.map(r=>recHTML(r,false)).join(''):'<div class="panel empty">Nothing submitted yet. Your records appear here with their approval status.</div>'}`;
}
function staffView(){
 const wk=kind==='weekly',mo=kind==='monthly';
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
 <section id="mine">${mineHTML()}</section>`;
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
function loginHTML(){
 return `<section class="panel"><h2>Supervisor sign-in</h2><p class="sub">Only supervisors can approve or return records.</p>
 <form id="login" novalidate><div class="row">
  <label class="f"><span>Email</span><input type="email" name="email" autocomplete="username"></label>
  <label class="f"><span>Password</span><input type="password" name="password" autocomplete="current-password"></label>
 </div><div class="acts"><button class="btn" type="submit">Sign in</button></div><p class="msg" role="status"></p></form></section>`;
}
function supView(){
 if(ONLINE&&!user)return loginHTML();
 const cnt=s=>recs.filter(r=>r.status===s).length;
 const list=recs.filter(r=>r.status===filter).reverse();
 const chip=(s,l)=>`<button type="button" data-filter="${s}" aria-pressed="${filter===s}">${l} (${cnt(s)})</button>`;
 return `${ONLINE?`<div class="who"><span>Signed in as ${esc(user.email)}</span><button type="button" class="btn alt sm" data-signout>Sign out</button></div>`:''}<section><h2 style="margin-bottom:4px">Records to check</h2><p class="sub">Review each record, add your inspection remarks, then approve it or send it back.</p>
 <div class="chips">${chip('pending','Waiting')}${chip('approved','Approved')}${chip('returned','Returned')}</div>
 ${list.length?list.map(r=>recHTML(r,true)).join(''):`<div class="panel empty">${filter==='pending'?'No records waiting. New submissions from staff show up here.':'No records in this list yet.'}</div>`}</section>`;
}
function bannerHTML(){return banner?`<div class="panel banner" role="alert">${esc(banner)}</div>`:''}
function render(){
 document.querySelectorAll('[data-role]').forEach(b=>b.setAttribute('aria-pressed',b.dataset.role===role));
 app.innerHTML=bannerHTML()+(role==='staff'?staffView():supView());
}
// New data arrived: refresh the lists without wiping anything being typed.
function refresh(){
 if(role==='staff'){
  const m=$('#mine');if(m)m.innerHTML=mineHTML();else render();
  const bn=$('.banner');if(!banner&&bn)bn.remove();else if(banner&&!bn)app.insertAdjacentHTML('afterbegin',bannerHTML());
  return;
 }
 const typed={};document.querySelectorAll('[data-rid] [data-rem]').forEach(t=>{if(t.value)typed[t.closest('[data-rid]').dataset.rid]=t.value});
 const focusId=document.activeElement&&document.activeElement.matches('[data-rem]')?document.activeElement.closest('[data-rid]').dataset.rid:null;
 if($('#login'))return; // never wipe the sign-in form
 render();
 Object.keys(typed).forEach(id=>{const t=$(`[data-rid="${id}"] [data-rem]`);if(t)t.value=typed[id]});
 if(focusId){const t=$(`[data-rid="${focusId}"] [data-rem]`);if(t)t.focus()}
}
function friendly(err){
 const c=(err&&err.code)||'';
 if(/wrong-password|invalid-credential|user-not-found|invalid-email|invalid-login/.test(c))return 'That email or password is not right.';
 if(/too-many-requests/.test(c))return 'Too many tries. Wait a few minutes and try again.';
 if(/permission-denied/.test(c))return 'This account is not allowed to approve records.';
 if(/unavailable|network/.test(c))return 'No internet connection. Check your data or Wi-Fi and try again.';
 return 'Something went wrong. Please try again.';
}
function setMsg(form,text,cls){const m=$('.msg',form);if(m){m.className='msg '+(cls||'');m.textContent=text}}

document.addEventListener('click',e=>{
 const b=e.target.closest('button');if(!b)return;
 if(b.dataset.role){role=b.dataset.role;note={t:'',c:''};render();}
 else if(b.dataset.kind){kind=b.dataset.kind;note={t:'',c:''};render();}
 else if(b.dataset.filter){filter=b.dataset.filter;render();}
 else if(b.hasAttribute('data-signout')){auth.signOut();}
 else if(b.dataset.act){
  const card=b.closest('[data-rid]'),id=card.dataset.rid,status=b.dataset.act,remarks=$('[data-rem]',card).value.trim();
  if(!ONLINE){const r=recs.find(x=>x.id===id);r.status=status;r.remarks=remarks;save();render();return;}
  card.querySelectorAll('button').forEach(x=>x.disabled=true);
  db.collection('records').doc(id).update({status,remarks,reviewedBy:user.email,reviewedAt:firebase.firestore.FieldValue.serverTimestamp()})
   .catch(err=>{card.querySelectorAll('button').forEach(x=>x.disabled=false);alert(friendly(err));});
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
 setMsg(form,text,'err');
 const n=$('.notify',form);if(n)n.remove();
 if(focusName){const el=form.elements[focusName];if(el)el.focus();}
}
document.addEventListener('submit',e=>{
 e.preventDefault();
 const form=e.target;
 if(form.id==='login'){
  const em=form.elements.email.value.trim(),pw=form.elements.password.value;
  if(!em||!pw){setMsg(form,'Enter your email and password.','err');return;}
  const btn=$('button[type=submit]',form);btn.disabled=true;setMsg(form,'Signing in…');
  auth.signInWithEmailAndPassword(em,pw).catch(err=>{btn.disabled=false;setMsg(form,friendly(err),'err')});
  return;
 }
 const fd=new FormData(form),tasks={};
 SETS[kind].forEach(t=>{if(fd.get('done-'+t.id)){tasks[t.id]={};t.fields.forEach(f=>tasks[t.id][f.k]=fd.get(t.id+'.'+f.k)||'')}});
 const staff=(fd.get('staff')||'').trim(),ch=(fd.get('challenges')||'').trim();
 if(!staff){showErr(form,'Enter your name before you submit.','staff');return;}
 if(!Object.keys(tasks).length&&!ch){showErr(form,'Tick at least one job or describe a challenge.');return;}
 const rec={staff,date:fd.get('date')||today(),kind,shift:fd.get('shift')||(kind==='weekly'?'Weekly':'Monthly'),tasks,challenges:ch,status:'pending',remarks:''};
 const done=r=>{lastRec=r;note={t:'Submitted. Now alert your supervisor so they can check it.',c:'good'};render();};
 if(!ONLINE){rec.id=Date.now().toString(36);recs.push(rec);save();done(rec);return;}
 const btn=$('button[type=submit]',form);btn.disabled=true;setMsg(form,'Sending…');
 const ref=db.collection('records').doc();
 mine.push(ref.id);store(MINE_KEY,mine);
 ref.set(Object.assign({},rec,{createdAt:firebase.firestore.FieldValue.serverTimestamp()}))
  .then(()=>done(Object.assign({id:ref.id},rec)))
  .catch(err=>{mine=mine.filter(x=>x!==ref.id);store(MINE_KEY,mine);btn.disabled=false;showErr(form,friendly(err));});
});

// Move records that were still waiting on this device into the shared list, once.
function migrateLocal(){
 const old=load(KEY,[]).filter(r=>r.status==='pending'&&!r.moved);
 if(!old.length)return;
 old.forEach(r=>{
  const ref=db.collection('records').doc(),data=Object.assign({},r,{createdAt:firebase.firestore.FieldValue.serverTimestamp()});delete data.id;delete data.moved;
  ref.set(data).then(()=>{
   mine.push(ref.id);store(MINE_KEY,mine);
   const all=load(KEY,[]),x=all.find(y=>y.id===r.id);if(x){x.moved=true;store(KEY,all)}
  }).catch(()=>{});
 });
}

if(ONLINE){
 firebase.initializeApp(FIREBASE_CONFIG);
 db=firebase.firestore();auth=firebase.auth();
 db.collection('records').orderBy('createdAt','desc').limit(500).onSnapshot(snap=>{
  recs=snap.docs.map(d=>Object.assign({id:d.id},d.data({serverTimestamps:'estimate'}))).reverse();
  banner='';refresh();
 },err=>{banner='Could not load records: '+friendly(err);refresh();});
 auth.onAuthStateChanged(u=>{user=u;if(role==='supervisor')render();});
 migrateLocal();
}
render();
