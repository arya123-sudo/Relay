function tryRepo(r){ $('repoInput').value='https://github.com/'+r; loadGitHub(); }
/* ---------- GitHub ingestion (public repos, read-only REST) ---------- */
async function gh(path){ const r=await fetch('https://api.github.com'+path,{headers:{'Accept':'application/vnd.github+json'}}); if(!r.ok) throw new Error('GitHub API '+r.status+' on '+path); return r.json(); }
async function loadGitHub(){ const raw=$('repoInput').value.trim(); const m=raw.match(/github\.com\/([^\/\s]+)\/([^\/\s#?]+)/)||raw.match(/^([^\/\s]+)\/([^\/\s]+)$/);
 if(!m){ $('ingestMsg').textContent='Paste a public GitHub repository URL (owner/repo).'; return; }
 const owner=m[1],repo=m[2].replace(/\.git$/,''); const btn=$('ghBtn'); btn.disabled=true; $('ingestMsg').textContent='Ingesting '+owner+'/'+repo+' — commits, pull requests, issues, contributors…';
 try{
  const [meta,commits,pulls,issues,contributors,contents]=await Promise.all([gh(`/repos/${owner}/${repo}`),gh(`/repos/${owner}/${repo}/commits?per_page=30`),gh(`/repos/${owner}/${repo}/pulls?state=all&per_page=30`),gh(`/repos/${owner}/${repo}/issues?state=all&per_page=40`),gh(`/repos/${owner}/${repo}/contributors?per_page=10`),gh(`/repos/${owner}/${repo}/contents`).catch(()=>[])]);
  const E=[]; let n=0; const nid=()=>'g'+(++n);
  commits.forEach(c=>E.push({id:nid(),type:'commit',ref:'Commit '+(c.sha||'').slice(0,6),batch:n%2?'B':'A',author:(c.author&&c.author.login)||(c.commit.author&&c.commit.author.name)||'unknown',date:(c.commit.author&&c.commit.author.date||'').slice(0,10),title:(c.commit.message||'').split('\n')[0],url:c.html_url,body:c.commit.message||''}));
  pulls.forEach(p=>E.push({id:nid(),type:'pr',ref:'PR #'+p.number,batch:p.number%2?'B':'A',author:p.user.login,date:(p.created_at||'').slice(0,10),title:p.title,url:p.html_url,body:(p.body||'')+'\nState: '+(p.merged_at?'merged':p.state)+'.'}));
  issues.filter(i=>!i.pull_request).forEach(i=>E.push({id:nid(),type:'issue',ref:'Issue #'+i.number,batch:i.number%2?'B':'A',author:i.user.login,date:(i.created_at||'').slice(0,10),title:i.title,url:i.html_url,body:(i.body||'')+'\nState: '+i.state+'.'}));
  const departing=contributors.length?contributors[0].login:(commits[0]&&commits[0].author?commits[0].author.login:'unknown');
  const work=[];
  issues.filter(i=>!i.pull_request).forEach(i=>{ const body=(i.body||'').toLowerCase(); work.push({id:'w'+i.number,title:i.title,state:i.state==='closed'?'completed':(body.includes('blocked')?'blocked':(i.assignees&&i.assignees.length?'inprogress':'unassigned')),owner:i.assignees&&i.assignees.length?i.assignees[0].login:(i.state==='closed'?i.user.login:null),refs:[E.find(e=>e.ref==='Issue #'+i.number).id],component:'General'}); });
  pulls.forEach(p=>{ work.push({id:'wp'+p.number,title:p.title,state:p.merged_at?'completed':(p.state==='open'?'inprogress':'pending'),owner:p.user.login,refs:[E.find(e=>e.ref==='PR #'+p.number).id],component:'General'}); });
  const KEY=/decid|decision|switch|migrat|chose|chosen|adopt|replace|revert|instead of|because|moved to|upgrad|deprecat|drop support|breaking change|rfc|proposal/i;
  const decisions=[]; E.filter(e=>(e.type==='pr'||e.type==='issue')&&KEY.test(e.title+' '+e.body)).slice(0,8).forEach((e,i)=>{ const reasoned=/because|reason|so that|in order/i.test(e.body); const corr=E.find(x=>x.id!==e.id&&tokens(x.title).some(t=>tokens(e.title).includes(t))); decisions.push({id:'d'+i,text:e.title,reason:reasoned?e.body.split(/(?<=[.!])\s+/).find(s=>/because|reason|so that|due to/i.test(s))||'Reason stated in the source record.':null,refs:corr?[e.id,corr.id]:[e.id],direct:reasoned}); });
  if(!decisions.length) decisions.push({id:'d0',text:'No explicit decision records found in this repository',reason:null,refs:[],direct:false});
  const dirs=Array.isArray(contents)?contents.filter(c=>c.type==='dir').slice(0,6):[];
  const components=(dirs.length?dirs:[{name:'Main codebase'}]).map((d,i)=>({id:'c'+i,name:d.name,owner:departing,docRefs:E.filter(e=>/readme|doc/i.test(e.title)).map(e=>e.id).slice(0,2)}));
  work.forEach(w=>{ if(components.length) w.component=components[0].name; });
  const edges=[]; work.filter(w=>w.state==='blocked').slice(0,4).forEach((w,i)=>edges.push({from:w.id,to:components[0].id,rel:'blocked in',refs:w.refs}));
  if(components.length>1) edges.push({from:components[0].id,to:components[1].id,rel:'depends on',refs:E.slice(0,1).map(e=>e.id)});
  edges.push({from:departing,to:components[0].id,rel:'owns',refs:E.filter(e=>e.author===departing).slice(0,1).map(e=>e.id)});
  const members=[...new Set([...contributors.map(c=>c.login),...E.map(e=>e.author)])].slice(0,8);
  DB={project:meta.full_name+' — '+(meta.description||'GitHub repository'),departing,departingName:departing+' (most active contributor)',evidence:E,work,decisions,components,edges,members};
  halfMode=false; $('halfToggle').checked=false; approved=false;
  $('ingestMsg').innerHTML=`Ingested <b>${E.length} evidence records</b> from ${meta.full_name}. Departing member detected: <b>${departing}</b>.`; render(); showTab('report');
 }catch(err){ $('ingestMsg').textContent='Ingestion failed: '+err.message+'. Check the repo is public, or use the sample project.'; }
 btn.disabled=false; }