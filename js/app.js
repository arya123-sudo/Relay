/* ---------- rendering ---------- */

function srcBtn(id){ const e=evById(id); if(!e) return ''; return `<span class="src" onclick="showSrc('${id}')">${e.ref}</span>`; }
function showSrc(id){ const e=evById(id); if(!e) return; $('srcTitle').textContent=e.ref+' — '+e.title; $('srcMeta').textContent=`${e.type.toUpperCase()} · by ${e.author} · ${e.date}`; $('srcBody').textContent=e.body; const l=$('srcLink'); if(e.url&&e.url!=='#'){l.href=e.url;l.style.display='inline';} else l.style.display='none'; $('srcModal').classList.add('open'); }
function badge(l){ return `<span class="badge b-${l}">${l}</span>`; }
function render(){ if(!DB) return; const s=score();
 $('app').style.display='block';
 $('scoreNum').textContent=s.total; $('ringArc').style.strokeDashoffset=402-(402*s.total/100);
 $('ringArc').style.stroke=s.total>=70?'#2fbf71':s.total>=45?'#f5a524':'#f31260';
 $('dims').innerHTML=Object.keys(s.dims).map(k=>`<div class="dim"><div class="lab"><span style="text-transform:capitalize">${k} <span style="color:var(--mut)">(weight ${s.W[k]}%)</span></span><b>${Math.round(s.dims[k])}</b></div><div class="bar"><i style="width:${s.dims[k]}%"></i></div></div>`).join('');
 const evCount=DB.evidence.filter(e=>!(halfMode&&e.batch==='B')).length;
 $('kpis').innerHTML=`<div class="kpi"><b>${evCount}</b><small>evidence records</small></div><div class="kpi"><b>${claims().filter(c=>c.label==='verified').length}</b><small>verified claims</small></div><div class="kpi"><b>${gaps().length}</b><small>named gaps</small></div><div class="kpi"><b>${DB.work.filter(w=>w.state==='blocked').length}</b><small>blocked items</small></div>`;
 renderReport(); renderGraph(); renderPlan(); renderReview(); renderPresets(); }
function renderReport(){ const g=gaps();
 const workRows=DB.work.map(w=>`<tr><td>${w.title}</td><td><span class="state st-${w.state}">${w.state==='inprogress'?'in progress':w.state}</span></td><td>${w.owner||'<span style="color:var(--amb)">— none —</span>'}</td><td>${w.component}</td><td>${liveRefs(w.refs).map(srcBtn).join(' ')||'<span class="badge b-unknown">no evidence</span>'}</td></tr>`).join('');
 $('tab-report').innerHTML=`
 <div class="card"><h2>Handover report — ${DB.project}</h2>
 <p class="sub">Departing member: <b style="color:var(--txt)">${DB.departingName||DB.departing}</b> · Status: ${approved?'<span class="badge b-published">Published — approved by reviewer</span>':'<span class="badge b-draft">Draft — awaiting review</span>'} · Every claim below is labelled and linked to its source. Click any source chip to trace it.</p></div>
 <div class="grid">
 <div class="card"><h3>Key claims (confidence-labelled)</h3>${claims().map(c=>`<div class="claim"><div class="row" style="justify-content:space-between"><span class="txt">${c.text}</span>${badge(c.label)}</div>${c.reason&&c.label==='inferred'?`<div class="reason">Inference: ${c.reason}</div>`:''}<div class="srcs">${c.refs.map(srcBtn).join('')}</div></div>`).join('')}</div>
 <div class="card"><h3>Knowledge gaps — what Relay does <i>not</i> know</h3><p class="sub" style="margin-bottom:10px">Unknowns are named, never filled in by invention.</p>${g.length?g.map(x=>`<div class="gapitem">${x.text}</div>`).join(''):'<p class="sub">No gaps detected in the current evidence.</p>'}</div>
 </div>
 <div class="card"><h3>Work state — everything the departing member touched</h3><table><tr><th>Work item</th><th>State</th><th>Owner</th><th>Component</th><th>Evidence</th></tr>${workRows}</table></div>`; }
function nodeName(id){ if(DB.members.includes(id)) return id; const w=DB.work.find(x=>x.id===id); if(w) return w.title; const c=DB.components.find(x=>x.id===id); if(c) return c.name; const d=DB.decisions.find(x=>x.id===id); if(d) return d.text; return id; }
function nodeKind(id){ if(DB.members.includes(id)) return 'person'; if(DB.work.find(x=>x.id===id)) return 'work'; if(DB.components.find(x=>x.id===id)) return 'comp'; return 'dec'; }
function renderGraph(){ const svg=$('graph'); const cols={person:90,comp:330,work:600,dec:920}; const kinds={person:DB.members,comp:DB.components.map(c=>c.id),work:DB.work.map(w=>w.id),dec:DB.decisions.map(d=>d.id)};
 const pos={}; for(const k in kinds){ kinds[k].forEach((id,i)=>{ pos[id]={x:cols[k],y:34+i*(400/Math.max(kinds[k].length,1))}; }); }
 const colr={person:'#6c7bff',comp:'#2fbf71',work:'#38bdf8',dec:'#f5a524'};
 let h='';
 DB.edges.forEach(e=>{ const a=pos[e.from],b=pos[e.to]; if(!a||!b) return; const blocked=e.rel.includes('blocked'); h+=`<line x1="${a.x}" y1="${a.y}" x2="${b.x}" y2="${b.y}" stroke="${blocked?'#f31260':'#4a4f7d'}" stroke-width="${blocked?2:1.2}" stroke-dasharray="${blocked?'5 3':''}"><title>${e.rel}</title></line>`; });
 for(const id in pos){ const p=pos[id]; const name=nodeName(id); const short=name.length>26?name.slice(0,25)+'…':name; h+=`<circle cx="${p.x}" cy="${p.y}" r="7" fill="${colr[nodeKind(id)]}"><title>${name}</title></circle><text x="${p.x+12}" y="${p.y+4}" fill="#c9cdf2" font-size="11.5">${short}</text>`; }
 svg.setAttribute('viewBox','0 0 1120 430'); svg.innerHTML=h; }

function renderPlan(){ const items=planItems(); const days=['Monday','Tuesday','Wednesday','Thursday','Friday']; const per=Math.max(1,Math.ceil(items.length/5));
 let cards=''; for(let d=0;d<5;d++){ const slice=items.slice(d*per,(d+1)*per); cards+=`<div class="day"><h4>${days[d]}</h4>${slice.length?slice.map(w=>`<p><b>${w.title}</b><br><span style="color:var(--mut)">${w.state==='blocked'?'Blocked — chase the blocker first; it unblocks other work.':w.state==='unassigned'?'Unassigned — pick this up and own it.':'Continue and finish.'} (${w.component})</span></p>`).join(''):'<p style="color:var(--mut)">Buffer / documentation catch-up.</p>'}</div>`; }
 $('tab-plan').innerHTML=`<div class="card"><h2>First-week action plan for the successor</h2><p class="sub">Ranked by Relay's planner: blocked work that unblocks other work first, then in-progress work, then unassigned quick wins.</p><div class="grid" style="margin-top:12px;grid-template-columns:repeat(auto-fit,minmax(200px,1fr))">${cards}</div></div>`; }
function renderReview(){ $('tab-review').innerHTML=`<div class="card"><h2>Review &amp; approval gate</h2>
 <p class="sub">No handover reaches the successor unverified. The reviewer (team lead) checks claims against their sources, can fill a named gap with a note — which becomes new evidence and raises the score — and then approves or rejects.</p>
 <div class="row" style="margin-top:14px">
   <button class="btn green" onclick="approve()" ${approved?'disabled':''}>${approved?'✓ Approved &amp; published':'Approve &amp; publish handover'}</button>
   <button class="btn red" onclick="reject()">Reject — send back</button>
   <span class="sub" id="reviewMsg"></span>
 </div>
 <h3>Fill a gap (adds evidence, score recomputes)</h3>
 <div class="row"><select id="gapSel" style="flex:1;min-width:220px">${gaps().map((g,i)=>`<option value="${i}">${g.text.slice(0,90)}</option>`).join('')||'<option>No gaps</option>'}</select></div>
 <div class="row" style="margin-top:9px"><input type="text" id="gapNote" style="flex:1;min-width:240px" placeholder="Reviewer note that resolves this gap — e.g. the missing reason or owner"><button class="btn ghost" onclick="fillGap()">Add note as evidence</button></div>
 </div>`; }
function approve(){ approved=true; $('statusBadge').className='badge b-published'; $('statusBadge').textContent='Published — approved'; $('reviewMsg').textContent='Handover approved and published to the successor.'; render(); }
function reject(){ approved=false; $('statusBadge').className='badge b-draft'; $('statusBadge').textContent='Draft — sent back by reviewer'; const m=$('reviewMsg'); if(m) m.textContent='Sent back for corrections. The handover stays in Draft.'; }
function fillGap(){ const note=$('gapNote').value.trim(); if(!note){ alert('Write the note first.'); return; }
 const id='note'+Date.now(); DB.evidence.push({id,type:'note',ref:'Reviewer note',batch:'A',author:'reviewer (team lead)',date:'2026-11-04',title:'Reviewer correction',url:'#',body:note});
 const sel=$('gapSel'); const gtext=sel.options[sel.selectedIndex].text;
 const dec=DB.decisions.find(d=>gtext.includes(d.text.slice(0,25))&&!d.reason); if(dec){ dec.reason=note+' (supplied by reviewer at approval gate)'; dec.refs.push(id); dec.direct=true; }
 const w=DB.work.find(x=>gtext.includes(x.title.slice(0,25))&&!x.owner); if(w){ w.owner='successor (assigned at review)'; w.refs.push(id); if(w.state==='unassigned') w.state='pending'; }
 const comp=DB.components.find(c=>gtext.includes(c.name)&&!liveRefs(c.docRefs).length); if(comp){ comp.docRefs.push(id); }
 render(); showTab('review'); const m=$('reviewMsg'); if(m) m.textContent='Note added as evidence — claims and score updated.'; }

/* ---------- grounded Q&A ---------- */


function ask(q){ q=q||$('qInput').value; const box=$('answerBox'); box.style.display='block'; if(!q.trim()){ box.className='answer refuse'; box.textContent='Ask a question about the project first.'; return; }
 const ql=q.toLowerCase(); const qt0=tokens(q);
 const gapDec=DB.decisions.find(d=>!d.reason&&qt0.filter(t=>tokens(d.text).includes(t)).length>=2);
 if(gapDec){ box.className='answer refuse'; box.innerHTML=`<b style="color:#fb7185">I can't answer that from the evidence.</b><br>“${gapDec.text}” is a recorded decision, but <b>its reason was never recorded</b> in any source — it is listed as a knowledge gap for the reviewer. Relay will not invent a reason.`; return; }
 if(/blocked/.test(ql)){ const bl=DB.work.filter(w=>w.state==='blocked'); box.className='answer'; box.innerHTML=bl.length?`Blocked right now: ${bl.map(w=>`<b>${w.title}</b>`).join('; ')}. The blocker evidence: ${[...new Set(bl.flatMap(w=>liveRefs(w.refs)))].map(srcBtn).join(' ')}`:'Nothing is marked blocked in the current evidence.'; return; }
 if(/complete|finished|done before|shipped/.test(ql)){ const done=DB.work.filter(w=>w.state==='completed'&&(!w.owner||w.owner===DB.departing)); box.className='answer'; box.innerHTML=done.length?`${DB.departingName||DB.departing} completed: ${done.map(w=>`<b>${w.title}</b>`).join('; ')}.<div class="srcs" style="margin-top:9px"><span style="font-size:12px;color:var(--mut)">Sources:</span> ${[...new Set(done.flatMap(w=>liveRefs(w.refs)))].map(srcBtn).join(' ')}</div>`:'No completed work by the departing member is evidenced.'; return; }
 if(/who owns|owner of|responsible for/.test(ql)){ const comp=DB.components.find(c=>ql.includes(c.name.toLowerCase().split(' ')[0])); box.className='answer'; box.innerHTML=comp?`<b>${comp.name}</b> is owned by <b>${comp.owner||'nobody — this is a named gap'}</b>.`:'Ownership: '+DB.components.map(c=>`${c.name} → ${c.owner||'NO OWNER (gap)'}`).join('; '); return; }
 const active=DB.evidence.filter(e=>!(halfMode&&e.batch==='B'));
 const qt=tokens(q); let best=null,bs=0;
 active.forEach(e=>{ const et=tokens(e.title+' '+e.body); const hit=qt.filter(t=>et.includes(t)).length; const sc=hit/Math.max(qt.length,1); if(sc>bs){bs=sc;best=e;} });
 if(!best||bs<0.34){ box.className='answer refuse'; box.innerHTML=`<b style="color:#fb7185">I can't answer that from the evidence.</b><br>No source in the current evidence store supports an answer to “${q}”. Relay will not guess — this is recorded as a knowledge gap for the reviewer.`; return; }
 const sentences=best.body.split(/(?<=[.!])\s+/); const rel=sentences.filter(s=>{ const st=tokens(s); return qt.some(t=>st.includes(t)); });
 const ans=(rel.length?rel:sentences.slice(0,2)).join(' ');
 box.className='answer'; box.innerHTML=`${ans}<div class="srcs" style="margin-top:9px"><span style="font-size:12px;color:var(--mut)">Source:</span> ${srcBtn(best.id)} <span class="badge b-verified">grounded</span></div>`; }
function renderPresets(){ const qs=['Why did the team switch to Razorpay?','What work is blocked, and why?','What did Arjun complete before leaving?','Why was that SMS vendor chosen?','How does deployment rollback work?'];
 $('presetQ').innerHTML=qs.map(q=>`<span class="chip" onclick="document.getElementById('qInput').value=this.textContent;ask()">${q}</span>`).join(''); }

/* ---------- source toggle / tabs ---------- */
function toggleHalf(){ halfMode=$('halfToggle').checked; approved=false; $('statusBadge').className='badge b-draft'; $('statusBadge').textContent='Draft — not yet approved'; render(); }
function showTab(t){ document.querySelectorAll('.tab').forEach(x=>x.classList.toggle('on',x.dataset.t===t)); ['report','graph','ask','plan','review'].forEach(x=>$('tab-'+x).style.display=x===t?'block':'none'); }
/* Deep link: ?demo=sample opens the app with the sample handover loaded —
   judges land inside the product, not on an empty connect screen. */
if(typeof location!=='undefined'&&new URLSearchParams(location.search).get('demo')==='sample'){ window.addEventListener('DOMContentLoaded',()=>loadSample()); }
function loadSample(){ DB=sampleDB(); halfMode=false; $('halfToggle').checked=false; approved=false; $('statusBadge').className='badge b-draft'; $('statusBadge').textContent='Draft — not yet approved'; $('ingestMsg').innerHTML=`Ingested <b>20 evidence records</b> for PayNest (commits, PRs, issues, reviews, documents). Handover reconstructed for departing member <b>Arjun Mehta</b>.`; render(); showTab('report'); window.scrollTo({top:document.getElementById('app').offsetTop-70,behavior:'smooth'}); }
