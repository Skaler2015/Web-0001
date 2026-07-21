/* Flags meta descriptions that are too short to be useful in a search
   snippet ("thin"), and pairs of tool pages whose descriptions are near-
   identical (word-overlap based — no ML/embedding dependency). Both are
   real ranking risks: thin descriptions get Google-rewritten anyway, and
   near-duplicate descriptions across different tools can read as
   template spam rather than distinct pages. Advisory only, not a CI gate
   — these need a human rewrite, not an automatic one. */
const fs = require('fs');
const path = require('path');
const { ROOT } = require('./lib');

const THIN_THRESHOLD = 70; // chars — well under Google's ~155-160 char snippet display
const DUPLICATE_THRESHOLD = 0.75; // Jaccard word-overlap

function readDescriptions() {
  const dir = path.join(ROOT, 'tools');
  const files = fs.readdirSync(dir).filter((f) => f.endsWith('.html'));
  const out = [];
  files.forEach((f) => {
    const html = fs.readFileSync(path.join(dir, f), 'utf8');
    /* The closing quote must match the opening quote type — otherwise an
       apostrophe inside a double-quoted attribute (e.g. "password's weak")
       truncates the match early. */
    const m = html.match(/<meta\s+name=["']description["']\s+content=(["'])(.*?)\1/i);
    if (m) out.push({ file: 'tools/' + f, description: m[2] });
  });
  return out;
}

function wordSet(text) {
  return new Set(text.toLowerCase().replace(/[^a-z0-9\s]/g, ' ').split(/\s+/).filter(Boolean));
}

function jaccard(a, b) {
  const setA = wordSet(a);
  const setB = wordSet(b);
  let intersection = 0;
  setA.forEach((w) => { if (setB.has(w)) intersection++; });
  const union = new Set([...setA, ...setB]).size;
  return union ? intersection / union : 0;
}

function check() {
  const entries = readDescriptions();
  const thin = entries.filter((e) => e.description.length < THIN_THRESHOLD);
  const duplicates = [];
  for (let i = 0; i < entries.length; i++) {
    for (let j = i + 1; j < entries.length; j++) {
      const score = jaccard(entries[i].description, entries[j].description);
      if (score >= DUPLICATE_THRESHOLD) {
        duplicates.push({ a: entries[i].file, b: entries[j].file, score: Math.round(score * 100) });
      }
    }
  }
  return { thin, duplicates, checked: entries.length };
}

if (require.main === module) {
  const { thin, duplicates, checked } = check();
  console.log(`Checked ${checked} tool meta descriptions.`);
  console.log(`\n${thin.length} thin description(s) (< ${THIN_THRESHOLD} chars, advisory):`);
  thin.forEach((e) => console.log(`  - ${e.file} (${e.description.length} chars): "${e.description}"`));
  console.log(`\n${duplicates.length} near-duplicate pair(s) (>= ${Math.round(DUPLICATE_THRESHOLD * 100)}% word overlap, advisory):`);
  duplicates.forEach((d) => console.log(`  - ${d.a} <-> ${d.b} (${d.score}% overlap)`));
}

module.exports = { check };
