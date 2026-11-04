function tryRepo(r){ $('repoInput').value='https://github.com/'+r; loadGitHub(); }
/* ---------- GitHub ingestion (public repos, read-only REST) ----------
   Extraction tuned against a measured evaluation on real repositories
   (see submission pack, LIVE_REPO_EVAL.md): decisions are scanned in
   commits as well as PRs/issues, matches must sit in a title or the
   opening of a body, bot/chore noise is excluded, corroboration ignores
   generic tokens, and empty dimensions are excluded from the score
   instead of defaulting to 100. */
async function gh(path){ const r=await fetch('https://api.github.com'+path,{headers:{'Accept':'application/vnd.github+json'}}); if(!r.ok) throw new Error('GitHub API '+r.status+' on '+path); return r.json(); }
const BOT=/bot\]|dependabot|github-actions/i;
const CHORE=/^(build\(deps|chore|docs|ci|test|style)(\(|:)/i;
const KEY=/decid|decision|switch|migrat|chose|chosen|adopt|replace|revert|instead of|because|moved to|upgrad|deprecat|drop support|breaking change|rfc|proposal|remov|requir|no longer|introduc|add support/i;
const GENERIC=new Set(['fix','fixes','docs','deps','bump','update','updates','test','tests','add','adds','use','using','change','changes','support','work','issue','pull','request']);
async function loadGitHub(){ const raw=$('repoInput').value.trim(); const m=raw.match(/github\.com\/([^\/\s]+)\/([^\/\s#?]+)/)||raw.match(/^([^\/\s]+)\/([^\/\s]+)$/);
 if(!m){ $('ingestMsg').textContent='Paste a public GitHub repository URL (owner/repo).'; return; }
 const owner=m[1],repo=m[2].replace(/\.git$/,''); const btn=$('ghBtn'); btn.disabled=true; $('ingestMsg').textContent='Ingesting '+owner+'/'+repo+' — commits, pull requests, issues, contributors…';
 try{
  const [meta,commits,pulls,issues,contributors,contents]=await Promise.all([gh(`/repos/${owner}/${repo}`),gh(`/repos/${owner}/${repo}/commits?per_page=30`),gh(`/repos/${owner}/${repo}/pulls?state=all&per_page=30`),gh(`/repos/${owner}/${repo}/issues?state=all&per_page=40`),gh(`/repos/${owner}/${repo}/contributors?per_page=10`),gh(`/repos/${owner}/${repo}/contents`).catch(()=>[])]);
  const E=[]; let n=0; const nid=()=>'g'+(++n);
  commits.forEach(c=>E.push({id:nid(),type:'commit',ref:'Commit '+(c.sha||'').slice(0,6),batch:n%2?'B':'A',author:(c.author&&c.author.login)||(c.commit.author&&c.commit.author.name)||'unknown',date:(c.commit.author&&c.commit.author.date||'').slice(0,10),title:(c.commit.message||'').split('\n')[0],url:c.html_url,body:c.commit.message||''}));
  pulls.forEach(p=>E.push({id:nid(),type:'pr',ref:'PR #'+p.number,batch:p.number%2?'B':'A',author:p.user.login,date:(p.created_at||'').slice(0,10),title:p.title,url:p.html_url,body:(p.body||'')+'\nState: '+(p.merged_at?'merged':p.state)+'.'}));
  issues.filter(i=>!i.pull_request).forEach(i=>E.push({id:nid(),type:'issue',ref:'Issue #'+i.number,batch:i.number%2?'B':'A',author:i.user.login,date:(i.created_at||'').slice(0,10),title:i.title,url:i.html_url,body:(i.body||'')+'\nState: '+i.state+'.'}));
  /* documentation evidence: Markdown files in the repo root are real docs */
  const rootFiles=Array.isArray(contents)?contents.filter(c=>c.type==='file'):[];
  const docIds=[];
  rootFiles.filter(f=>/\.md$/i.test(f.name)).slice(0,6).forEach(f=>{ const id=nid(); docIds.push(id); E.push({id,type:'doc',ref:'Doc: '+f.name,batch:'A',author:owner,date:(meta.updated_at||'').slice(0,10),title:f.name+' (repository documentation)',url:f.html_url,body:'Documentation file present in the repository root: '+f.name+'. Its existence evidences documentation coverage for this project.'}); });
  /* departing member: the most frequent author in the fetched evidence */
  const freq={}; E.forEach(e=>{ if(!BOT.test(e.author)) freq[e.author]=(freq[e.author]||0)+1; });
  const departing=Object.keys(freq).sort((a,b)=>freq[b]-freq[a])[0]||(contributors.length?contributors[0].login:'unknown');
  /* components: real top-level dirs, excluding dot-dirs and vendor folders */
  const dirs=Array.isArray(contents)?contents.filter(c=>c.type==='dir'&&!/^\.|node_modules|dist|build/.test(c.name)).slice(0,6):[];
  const components=(dirs.length?dirs:[{name:meta.language?meta.language+' codebase':'Main codebase'}]).map((d,i)=>({id:'c'+i,name:d.name,owner:departing,docRefs:docIds.slice(0,3)}));
  const compFor=title=>{ const t=(title||'').toLowerCase(); const hit=components.find(c=>t.includes(c.name.toLowerCase())); return hit?hit.name:components[0].name; };
  /* work items: issues, merged/open PRs (closed-unmerged PRs are abandoned, not continuity work) */
  const work=[];
  issues.filter(i=>!i.pull_request).forEach(i=>{ const body=(i.body||'').toLowerCase(); work.push({id:'w'+i.number,title:i.title,state:i.state==='closed'?'completed':(body.includes('blocked')?'blocked':(i.assignees&&i.assignees.length?'inprogress':'unassigned')),owner:i.assignees&&i.assignees.length?i.assignees[0].login:(i.state==='closed'?i.user.login:null),refs:[E.find(e=>e.ref==='Issue #'+i.number).id],component:compFor(i.title)}); });
  pulls.filter(p=>p.merged_at||p.state==='open').forEach(p=>{ work.push({id:'wp'+p.number,title:p.title,state:p.merged_at?'completed':'inprogress',owner:p.user.login,refs:[E.find(e=>e.ref==='PR #'+p.number).id],component:compFor(p.title)}); });
  /* commit-only repositories: commits ARE the completed work — derive work items from them */
  if(work.length<5){ const seen=new Set(); commits.slice(0,30).forEach(c=>{ const title=(c.commit.message||'').split('\n')[0]; const sig=title.toLowerCase().replace(/[^a-z0-9 ]/g,'').split(/\s+/).slice(0,5).join(' '); if(!title||seen.has(sig)||/merge (pull|branch)/i.test(title)) return; seen.add(sig); const ev=E.find(e=>e.type==='commit'&&e.title===title); work.push({id:'wc'+work.length,title,state:'completed',owner:(c.author&&c.author.login)||departing,refs:ev?[ev.id]:[],component:compFor(title)}); }); }
  /* decisions: gated by match location, bot/chore excluded, ranked, deduped */
  const cand=E.filter(e=>!BOT.test(e.author)&&!CHORE.test(e.title)&&(KEY.test(e.title)||KEY.test((e.body||'').slice(0,200))));
  cand.sort((a,b)=>(KEY.test(b.title)?1:0)-(KEY.test(a.title)?1:0));
  const decisions=[]; const sigs=new Set();
  for(const e of cand){ if(decisions.length>=8) break; const sig=tokens(e.title).slice(0,4).join(' '); if(sigs.has(sig)) continue; sigs.add(sig);
    const reasoned=/because|reason|so that|due to|in order/i.test(e.body);
    const myToks=tokens(e.title).filter(t=>!GENERIC.has(t));
    const corr=E.find(x=>x.id!==e.id&&myToks.length&&myToks.some(t=>tokens(x.title).includes(t)));
    decisions.push({id:'d'+decisions.length,text:e.title,reason:reasoned?e.body.split(/(?<=[.!])\s+/).find(s=>/because|reason|so that|due to|in order/i.test(s))||'Reason stated in the source record.':null,refs:corr?[e.id,corr.id]:[e.id],direct:reasoned}); }
  if(!decisions.length) decisions.push({id:'d0',text:'Decision records in this repository',reason:null,refs:[],direct:false,placeholder:true});
  const edges=[]; work.filter(w=>w.state==='blocked').slice(0,4).forEach(w=>edges.push({from:w.id,to:components[0].id,rel:'blocked in',refs:w.refs}));
  if(components.length>1) edges.push({from:components[0].id,to:components[1].id,rel:'depends on',refs:E.slice(0,1).map(e=>e.id)});
  edges.push({from:departing,to:components[0].id,rel:'owns',refs:E.filter(e=>e.author===departing).slice(0,1).map(e=>e.id)});
  const members=[...new Set([...E.map(e=>e.author),...contributors.map(c=>c.login)])].filter(a=>!BOT.test(a)).slice(0,8);
  DB={project:meta.full_name+' — '+(meta.description||'GitHub repository'),departing,departingName:departing+' (most active author in the evidence)',evidence:E,work,decisions,components,edges,members};
  halfMode=false; $('halfToggle').checked=false; approved=false;
  $('ingestMsg').innerHTML=`Ingested <b>${E.length} evidence records</b> from ${meta.full_name}. Departing member detected: <b>${departing}</b>.`; render(); showTab('report');
 }catch(err){ $('ingestMsg').textContent='Ingestion failed: '+err.message+'. Check the repo is public, or use the sample project.'; }
 btn.disabled=false; }
