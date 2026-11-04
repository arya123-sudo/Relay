/* Relay engine tests — run with: node tests/engine.test.js (or npm test)
   Loads the real browser modules exactly as the browser does (one shared
   scope, in page order) with a minimal DOM stub, then asserts the
   behaviours the demo depends on: deterministic scoring, gap detection,
   confidence labels, Q&A refusal, and planner ranking. */
const fs = require('fs');
const path = require('path');
const root = path.join(__dirname, '..');

function el() {
  return { style: {}, classList: { add() {}, remove() {}, toggle() {} },
    setAttribute() {}, value: '', checked: false, textContent: '',
    innerHTML: '', options: [{ text: '' }], selectedIndex: 0, offsetTop: 0 };
}
const els = {};
global.document = { getElementById: id => els[id] || (els[id] = el()), querySelectorAll: () => [] };
global.window = { scrollTo() {} };
global.alert = () => {};
global.fetch = () => Promise.reject(new Error('network disabled in tests'));
global.__els = els;

const driver = `
;(function(){
  let failures = 0;
  const strip = s => String(s).replace(/<[^>]+>/g, '');
  function check(name, cond){ console.log((cond ? 'PASS' : 'FAIL') + '  ' + name); if (!cond) failures++; }

  DB = sampleDB();
  check('sample has 20 evidence records', DB.evidence.length === 20);
  const full = score();
  check('full-source completeness score is 91', full.total === 91);
  check('score is deterministic', score().total === full.total);
  check('4 named gaps with full sources', gaps().length === 4);
  check('SMS vendor decision is a no-reason gap', gaps().some(g => g.text.includes('SMS vendor')));
  check('Razorpay decision is Verified', labelFor(DB.decisions[0]) === 'verified');
  check('web-first decision is Inferred (2 sources)', labelFor(DB.decisions[3]) === 'inferred');
  check('planner ranks the blocking migration first', planItems()[0].title === 'Token-service migration');

  ask('Why did the team switch to Razorpay?');
  check('Razorpay question answered with evidence', strip(global.__els.answerBox.innerHTML).includes('UPI'));
  ask('Why was that SMS vendor chosen?');
  check('SMS vendor question refused (reason never recorded)', strip(global.__els.answerBox.innerHTML).includes("can't answer"));

  halfMode = true;
  check('half-source score drops to 68', score().total === 68);
  check('gaps grow to 10', gaps().length === 10);
  ask('Why did the team switch to Razorpay?');
  check('Razorpay question refused after its evidence is removed', strip(global.__els.answerBox.innerHTML).includes("can't answer"));

  console.log(failures ? '\\n' + failures + ' test(s) FAILED' : '\\nAll tests passed');
  global.__failures = failures;
})();`;

const code = ['js/sample-data.js', 'js/engine.js', 'js/github.js', 'js/app.js']
  .map(f => fs.readFileSync(path.join(root, f), 'utf8')).join('\n') + driver;
eval(code);
process.exit(global.__failures ? 1 : 0);
