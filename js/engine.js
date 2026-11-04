/* Relay — shared state */
const $=id=>document.getElementById(id);
let DB=null;
let halfMode=false, approved=false;

/* ---------- confidence + scoring (deterministic) ---------- */
function liveRefs(refs){ if(!DB) return []; const gone=new Set(DB.evidence.filter(e=>halfMode&&e.batch==='B').map(e=>e.id)); return refs.filter(r=>!gone.has(r)); }
function labelFor(item){ const n=liveRefs(item.refs).length; if(n===0) return 'unknown'; if(item.direct&&n>=1) return 'verified'; if(n>=2) return 'inferred'; return item.direct?'verified':'inferred'; }
function claims(){ const c=[];
 DB.work.forEach(w=>{const l=labelFor(w); c.push({text:`"${w.title}" is ${w.state==='inprogress'?'in progress':w.state}${w.owner?` — owned by ${w.owner}`:' — no owner'}`,label:l,refs:liveRefs(w.refs),reason:l==='inferred'?'Derived from corroborating project records.':null});});
 DB.decisions.forEach(d=>{ if(d.reason&&liveRefs(d.refs).length){ const l=labelFor(d); c.push({text:`Decision: ${d.text}. Reason: ${d.reason}`,label:l,refs:liveRefs(d.refs),reason:l==='inferred'?'Corroborated by two independent sources (see citations).':null}); }});
 return c; }
function gaps(){ const g=[];
 DB.decisions.forEach(d=>{ if(d.placeholder) g.push({text:'No explicit decision records found in the fetched sources — the decision history of this project is a gap.',dim:'decisions'}); else if(!d.reason) g.push({text:`Decision with no recorded reason: "${d.text}" — the discussion happened off-record.`,dim:'decisions'}); else if(liveRefs(d.refs).length===0) g.push({text:`Decision evidence missing: "${d.text}" cannot be verified from the current sources.`,dim:'decisions'}); });
 DB.components.forEach(c=>{ if(!liveRefs(c.docRefs).length) g.push({text:`Component with no documentation: ${c.name}.`,dim:'documentation'}); if(!c.owner) g.push({text:`Component with no owner: ${c.name}.`,dim:'ownership'}); });
 DB.work.forEach(w=>{ if(!w.owner) g.push({text:`Work item with no owner: "${w.title}" (${w.state}).`,dim:'ownership'}); if(liveRefs(w.refs).length===0) g.push({text:`Work item with no surviving evidence: "${w.title}".`,dim:'work state'}); });
 const sole={}; DB.components.forEach(c=>{ if(c.owner){ (sole[c.owner]=sole[c.owner]||[]).push(c.name);} });
 return g; }
function score(){ const W={'work state':25,'decisions':20,'dependencies':20,'ownership':15,'documentation':10,'risks':10};
 const dims={};
 const tot=(arr,f)=>arr.length?arr.filter(f).length/arr.length*100:null;
 dims['work state']=tot(DB.work,w=>liveRefs(w.refs).length>0);
 dims['decisions']=DB.decisions.length?DB.decisions.filter(d=>d.reason&&liveRefs(d.refs).length>0).length/DB.decisions.length*100:null;
 dims['dependencies']=DB.edges.length?DB.edges.filter(e=>liveRefs(e.refs).length>0).length/DB.edges.length*100:null;
 const needOwn=[...DB.work,...DB.components];
 dims['ownership']=tot(needOwn,x=>!!x.owner);
 dims['documentation']=tot(DB.components,c=>liveRefs(c.docRefs).length>0);
 const risks=DB.work.filter(w=>w.state==='blocked'||w.state==='unassigned');
 dims['risks']=risks.length?risks.filter(w=>liveRefs(w.refs).length>0).length/risks.length*100:null;
 /* Dimensions with no items are excluded and the remaining weights are
    renormalised — an empty dimension must never silently score 100. */
 let num=0,den=0; for(const k in W){ if(dims[k]===null) continue; num+=dims[k]*W[k]; den+=W[k]; }
 for(const k in W) if(dims[k]===null) dims[k]=0;
 return {total:den?Math.round(num/den):0,dims,W}; }

/* ---------- retrieval helpers ---------- */
const STOP=new Set('the a an is are was were did do does what why how who whom which when where of to in on for and or it its this that with from by at as be been has have had'.split(' '));
function tokens(s){ return s.toLowerCase().replace(/[^a-z0-9 ]/g,' ').split(/\s+/).filter(t=>t.length>2&&!STOP.has(t)); }
function evById(id){ return DB.evidence.find(e=>e.id===id); }

/* ---------- first-week ranking ---------- */
function planItems(){ const blocks={}; DB.work.forEach(w=>{ if(w.blockedBy) blocks[w.blockedBy]=(blocks[w.blockedBy]||0)+1; });
 const open=DB.work.filter(w=>w.state!=='completed');
 const prio=w=>{ let p=50; if(w.state==='blocked') p-=30; p-=(blocks[w.id]||0)*15; if(w.state==='inprogress') p-=8; if(w.state==='unassigned') p-=4; return p; };
 return open.sort((a,b)=>prio(a)-prio(b)); }
