/* ---------- SAMPLE PROJECT: PayNest (hostel fee payment portal) ---------- */
function sampleDB(){
 const E=[
  {id:'e1',type:'issue',ref:'Issue #12',batch:'B',author:'sara-iqbal',date:'2026-08-14',title:'UPI payments failing on Stripe in India',url:'#',body:'Students paying hostel fees from UPI apps see failed checkouts on Stripe. UPI is how most of our students pay. We need a gateway with first-class UPI support and lower per-transaction fees for Indian payments.'},
  {id:'e2',type:'pr',ref:'PR #42',batch:'B',author:'arjun-mehta',date:'2026-09-02',title:'Switch payment gateway from Stripe to Razorpay',url:'#',body:'Switches checkout from Stripe to Razorpay. Reason: Razorpay supports UPI natively and charges lower fees on domestic transactions, which fixes the failed UPI checkouts reported by students. Stripe code is kept behind a flag for one release in case of rollback.'},
  {id:'e3',type:'commit',ref:'Commit a91f3c',batch:'B',author:'arjun-mehta',date:'2026-09-03',title:'feat(payments): Razorpay order creation + webhook verify',url:'#',body:'Adds Razorpay order creation, signature verification on the payment webhook, and idempotency keys so a retried webhook never double-credits a fee payment.'},
  {id:'e4',type:'pr',ref:'PR #38',batch:'A',author:'sara-iqbal',date:'2026-08-21',title:'Nightly fee-ledger reconciliation job',url:'#',body:'Adds a nightly reconciliation job comparing the fee ledger against gateway settlements. Chosen over real-time reconciliation because settlement files arrive once a day, so real-time checks would compare against incomplete data.'},
  {id:'e5',type:'doc',ref:'Doc: ADR-003',batch:'B',author:'arjun-mehta',date:'2026-08-22',title:'ADR-003 — Reconciliation strategy',url:'#',body:'Decision: reconcile nightly, not in real time. Settlement data from the gateway is published once daily; nightly reconciliation is simpler, cheaper, and matches the data that actually exists. Mismatches are written to a review queue for the accounts team.'},
  {id:'e6',type:'pr',ref:'PR #45',batch:'A',author:'arjun-mehta',date:'2026-09-18',title:'Auth refactor: rotating refresh tokens',url:'#',body:'Replaces long-lived refresh tokens with rotating refresh tokens and reuse detection. Work in progress: token issuance is done, but the migration of existing sessions is blocked until the token-service migration (Issue #18) lands.'},
  {id:'e7',type:'review',ref:'Review on PR #45',batch:'B',author:'meena-kulkarni',date:'2026-09-19',title:'Review: rotation chosen for session security',url:'#',body:'Approving the direction: rotating refresh tokens with reuse detection were chosen because a leaked token then invalidates the whole session family, which limits account-takeover damage for student accounts.'},
  {id:'e8',type:'issue',ref:'Issue #18',batch:'A',author:'arjun-mehta',date:'2026-09-10',title:'Token-service migration to new auth provider',url:'#',body:'Migrating the token service to the new auth provider. BLOCKED: waiting on the provider to enable our organisation workspace. This blocks the auth refactor (PR #45) and the login rate-limiting work. No workaround exists until the workspace is enabled.'},
  {id:'e9',type:'issue',ref:'Issue #21',batch:'A',author:'arjun-mehta',date:'2026-09-25',title:'SMS fallback when fee-reminder emails bounce',url:'#',body:'About 18% of fee-reminder emails bounce (full inboxes, wrong addresses). Adding an SMS fallback through the notification service so reminders still reach students before the late-fee date. In progress: templates done, vendor integration pending.'},
  {id:'e10',type:'issue',ref:'Issue #27',batch:'A',author:'sara-iqbal',date:'2026-10-01',title:'Refund webhook retries have no owner',url:'#',body:'When a refund webhook fails, nothing retries it and nobody is assigned. Two refunds needed manual fixing last month. Needs an owner, retry queue with backoff, and an alert. Currently unassigned.'},
  {id:'e11',type:'issue',ref:'Issue #24',batch:'B',author:'rohan-verma',date:'2026-09-28',title:'Admin dashboard: hostel-wise fee reports',url:'#',body:'Wardens need hostel-wise collection and defaulter reports from the admin dashboard. Not started: waiting on the fee-ledger export format to stabilise. Dashboard has no written documentation yet.'},
  {id:'e12',type:'commit',ref:'Commit c77d21',batch:'A',author:'arjun-mehta',date:'2026-08-30',title:'feat(receipts): PDF fee receipts with QR verification',url:'#',body:'Generates PDF fee receipts after successful payment, with a QR code the office can scan to verify the receipt against the ledger.'},
  {id:'e13',type:'doc',ref:'Doc: Runbook',batch:'A',author:'arjun-mehta',date:'2026-09-05',title:'Deployment runbook — PayNest production',url:'#',body:'Production deploys from the main branch via the hosting pipeline. Rollback: redeploy the previous release tag. Database migrations must run before the app deploy. The payment webhook secret lives in the hosting environment variables, never in the repo.'},
  {id:'e14',type:'issue',ref:'Issue #9',batch:'A',author:'meena-kulkarni',date:'2026-08-05',title:'Web-first: postpone the mobile app',url:'#',body:'Decision from planning: stay web-first this semester and postpone the mobile app. Most fee payments happen in the two weeks before term start, on shared family devices, so a responsive web app covers the real usage. Revisit after the payment flow is stable.'},
  {id:'e15',type:'commit',ref:'Commit e03b8a',batch:'B',author:'arjun-mehta',date:'2026-08-06',title:'chore: defer native app scaffolding',url:'#',body:'Removes the experimental native app scaffold. Per planning (Issue #9) the team stays web-first; the scaffold can be restored from history if the decision changes.'},
  {id:'e16',type:'issue',ref:'Issue #30',batch:'A',author:'arjun-mehta',date:'2026-10-03',title:'SMS vendor selection for notification fallback',url:'#',body:'We need an SMS vendor for the notification fallback (Issue #21). Two vendors were compared on price per SMS and delivery reports. The final selection and its reason were discussed on a call and are not recorded here.'},
  {id:'e17',type:'issue',ref:'Issue #31',batch:'A',author:'arjun-mehta',date:'2026-10-04',title:'Rate-limit the login endpoint',url:'#',body:'Login endpoint has no rate limiting. Add per-account and per-IP limits. Depends on the auth refactor (PR #45) landing first, because limits must key on the new session model.'},
  {id:'e18',type:'commit',ref:'Commit 5be912',batch:'B',author:'sara-iqbal',date:'2026-08-25',title:'feat(ledger): hostel-wise defaulter export (CSV)',url:'#',body:'Exports hostel-wise fee defaulters as CSV for wardens, generated from the reconciled ledger so figures match settlements.'},
  {id:'e19',type:'doc',ref:'Doc: API notes',batch:'B',author:'arjun-mehta',date:'2026-09-12',title:'API notes — payments and ledger',url:'#',body:'Payments API: create-order, verify-webhook, refund. Ledger API: entries, reconciliation status, exports. Auth tokens are bearer tokens issued by the token service. The notification service has no API documentation yet.'},
  {id:'e20',type:'pr',ref:'PR #47',batch:'B',author:'arjun-mehta',date:'2026-10-05',title:'WIP: notification service scaffolding',url:'#',body:'Scaffolding for the notification service (email + SMS channels behind one interface). Open and unfinished: channel interface merged, SMS channel not wired. Arjun is the only person who has worked on this service.'}
 ];
 const work=[
  {id:'w1',title:'Razorpay payment integration',state:'completed',owner:'arjun-mehta',refs:['e2','e3'],component:'Payment Gateway'},
  {id:'w2',title:'Auth refactor — rotating refresh tokens',state:'blocked',owner:'arjun-mehta',refs:['e6','e8'],component:'Auth Service',blockedBy:'w8'},
  {id:'w3',title:'Nightly fee-ledger reconciliation',state:'completed',owner:'sara-iqbal',refs:['e4'],component:'Fee Ledger'},
  {id:'w4',title:'SMS fallback for bounced fee reminders',state:'inprogress',owner:'arjun-mehta',refs:['e9'],component:'Notification Service'},
  {id:'w5',title:'PDF fee receipts with QR verification',state:'completed',owner:'arjun-mehta',refs:['e12'],component:'Payment Gateway'},
  {id:'w6',title:'Refund webhook retries',state:'unassigned',owner:null,refs:['e10'],component:'Payment Gateway'},
  {id:'w7',title:'Admin dashboard hostel-wise fee reports',state:'pending',owner:'rohan-verma',refs:['e11'],component:'Admin Dashboard'},
  {id:'w8',title:'Token-service migration',state:'blocked',owner:'arjun-mehta',refs:['e8'],component:'Auth Service'},
  {id:'w9',title:'Hostel-wise defaulter CSV export',state:'completed',owner:'sara-iqbal',refs:['e18'],component:'Fee Ledger'},
  {id:'w10',title:'Rate-limit the login endpoint',state:'inprogress',owner:'arjun-mehta',refs:['e17'],component:'Auth Service'}
 ];
 const decisions=[
  {id:'d1',text:'Switch the payment gateway from Stripe to Razorpay',reason:'Razorpay supports UPI natively and charges lower fees on domestic transactions; Stripe UPI checkouts were failing for students.',refs:['e2','e1'],direct:true},
  {id:'d2',text:'Use rotating refresh tokens with reuse detection',reason:'A leaked token invalidates the whole session family, limiting account-takeover damage.',refs:['e6','e7'],direct:false},
  {id:'d3',text:'Reconcile the fee ledger nightly, not in real time',reason:'Gateway settlement files are published once a day, so real-time checks would compare against incomplete data.',refs:['e5','e4'],direct:true},
  {id:'d4',text:'Stay web-first; postpone the mobile app',reason:'Most payments happen on shared family devices before term start, so responsive web covers real usage.',refs:['e14','e15'],direct:false},
  {id:'d5',text:'SMS vendor selection for the notification fallback',reason:null,refs:['e16'],direct:false}
 ];
 const components=[
  {id:'c1',name:'Payment Gateway',owner:'arjun-mehta',docRefs:['e19','e13']},
  {id:'c2',name:'Auth Service',owner:'arjun-mehta',docRefs:['e19']},
  {id:'c3',name:'Fee Ledger',owner:'sara-iqbal',docRefs:['e5','e19']},
  {id:'c4',name:'Notification Service',owner:'arjun-mehta',docRefs:[]},
  {id:'c5',name:'Admin Dashboard',owner:'rohan-verma',docRefs:[]}
 ];
 const edges=[
  {from:'w2',to:'w8',rel:'blocked by',refs:['e6','e8']},
  {from:'w10',to:'w2',rel:'depends on',refs:['e17']},
  {from:'c1',to:'c2',rel:'depends on',refs:['e19']},
  {from:'c3',to:'c1',rel:'depends on',refs:['e4']},
  {from:'w4',to:'c4',rel:'depends on',refs:['e9']},
  {from:'d1',to:'c1',rel:'changed',refs:['e2']},
  {from:'d2',to:'c2',rel:'changed',refs:['e6']},
  {from:'arjun-mehta',to:'c4',rel:'owns (sole contributor)',refs:['e20']}
 ];
 return {project:'PayNest — hostel fee payment portal',departing:'arjun-mehta',departingName:'Arjun Mehta (Backend Lead)',evidence:E,work,decisions,components,edges,
 members:['arjun-mehta','sara-iqbal','rohan-verma','meena-kulkarni']};
}
