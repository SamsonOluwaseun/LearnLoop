// Regenerates the skill tables in docs/CURRICULUM.md from the question bank. Run: node scripts/gen-curriculum.js
const fs = require('fs'), path = require('path');
const C = require('../extension/curriculum.js');
const file = path.join(__dirname, '..', 'docs', 'CURRICULUM.md');
const doc = fs.readFileSync(file, 'utf8');
const head = doc.slice(0, doc.indexOf('\n## Reception Maths'));
const tail = doc.slice(doc.indexOf('\n## Reasoning (11+ practice)'));
let body = '';
for (const subject of ['maths', 'english', 'reasoning']) for (const y of C.YEARS) {
  const ids = C.skillsIn(subject, y); if (!ids.length) continue;
  body += `\n## ${C.YEAR_LABEL[y]} ${C.SUBJECT_LABEL[subject]}\n\n| Skill | ${subject === 'reasoning' ? 'What it practises' : 'Curriculum statement'} |\n|---|---|\n`;
  for (const id of ids) body += `| ${C.SKILLS[id].label} | ${C.SKILLS[id].nc.replace(/; /g, ', ')} |\n`;
}
const n = Object.keys(C.SKILLS).length;
fs.writeFileSync(file, head.replace(/\n\*\*\d+ skills[^\n]*\n/, '\n') + `\n**${n} skills in content version ${C.CONTENT_VERSION}.**\n` + body + tail);
console.log(`${n} skills written`);
