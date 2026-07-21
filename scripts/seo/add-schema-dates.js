/* Injects datePublished/dateModified into each tool page's
   SoftwareApplication/WebApplication JSON-LD block, derived from real git
   history for that file (first commit = published, latest commit =
   modified). A missing publish/modified date is a freshness signal every
   search engine and AI answer engine (Google, Bing, ChatGPT, Perplexity,
   Claude) uses when deciding whether content is current — this was
   entirely absent across the site. Idempotent: safe to run on every
   deploy, since it always re-derives from the file's real git history. */
const fs = require('fs');
const path = require('path');
const { ROOT, gitLastModDate, gitFirstCommitDate } = require('./lib');

const TARGET_TYPES = ['SoftwareApplication', 'WebApplication'];

/* @type may be a single string or an array of types (e.g.
   "@type": ["WebApplication", "SoftwareApplication"]) — schema.org allows
   both, so check both shapes. */
function hasTargetType(type) {
  if (Array.isArray(type)) return type.some((t) => TARGET_TYPES.indexOf(t) !== -1);
  return TARGET_TYPES.indexOf(type) !== -1;
}

function patchNode(node, dates) {
  node.datePublished = dates.published;
  node.dateModified = dates.modified;
}

function processFile(relPath) {
  const filePath = path.join(ROOT, relPath);
  let html = fs.readFileSync(filePath, 'utf8');
  const re = /<script type="application\/ld\+json">([\s\S]*?)<\/script>/g;
  let m;
  let changed = false;
  let patchedOne = false;

  while ((m = re.exec(html))) {
    const raw = m[1];
    if (raw.indexOf('${') !== -1) continue; // JS template-literal false positive, not a real block
    let data;
    try {
      data = JSON.parse(raw);
    } catch (e) {
      continue;
    }

    let target = null;
    if (hasTargetType(data['@type'])) {
      target = data;
    } else if (Array.isArray(data['@graph'])) {
      target = data['@graph'].find((n) => n && hasTargetType(n['@type']));
    }
    if (!target || patchedOne) continue; // only patch the first match per page

    const dates = { published: gitFirstCommitDate(relPath), modified: gitLastModDate(relPath) };
    patchNode(target, dates);
    const newRaw = JSON.stringify(data);
    if (newRaw !== raw) {
      html = html.slice(0, m.index) + '<script type="application/ld+json">' + newRaw + '</script>' + html.slice(m.index + m[0].length);
      changed = true;
    }
    patchedOne = true;
  }

  if (changed) fs.writeFileSync(filePath, html);
  return patchedOne;
}

if (require.main === module) {
  const dir = path.join(ROOT, 'tools');
  const files = fs.readdirSync(dir).filter((f) => f.endsWith('.html'));
  let patched = 0;
  let skipped = 0;
  files.forEach((f) => {
    if (processFile("tools/" + f)) patched++;
    else skipped++;
  });
  console.log(`Schema dates: patched ${patched} page(s), ${skipped} page(s) had no SoftwareApplication/WebApplication block to date.`);
}

module.exports = { processFile };
