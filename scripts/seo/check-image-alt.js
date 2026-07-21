/* Flags real <img> tags with a missing or empty alt attribute. Strips
   <script>/<style> contents first — JS/CSS source frequently contains
   text that looks like an <img> tag (template literals, generated
   example markup) but isn't a real static image, and would otherwise
   produce false positives. Advisory only (not wired as a CI gate): a
   missing alt is a real accessibility/SEO issue, but this site's icons
   are almost all emoji/text rather than <img> tags, so it's not
   something to block deploys over — it's a worklist to fix over time. */
const fs = require('fs');
const path = require('path');
const { ROOT } = require('./lib');

function findHtmlFiles() {
  const dir = path.join(ROOT, 'tools');
  return fs.readdirSync(dir).filter((f) => f.endsWith('.html')).map((f) => path.join('tools', f));
}

function stripScriptsAndStyles(html) {
  return html
    .replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, '')
    .replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi, '');
}

const IMG_RE = /<img\b([^>]*)>/gi;

function hasAlt(attrs) {
  const m = attrs.match(/\balt\s*=\s*(["'])(.*?)\1/i);
  return !!(m && m[2].trim());
}

function check() {
  const issues = [];
  let checked = 0;
  findHtmlFiles().forEach((rel) => {
    const html = stripScriptsAndStyles(fs.readFileSync(path.join(ROOT, rel), 'utf8'));
    let m;
    IMG_RE.lastIndex = 0;
    while ((m = IMG_RE.exec(html))) {
      checked++;
      if (!hasAlt(m[1])) issues.push(`${rel}: <img> missing alt text — ${m[0].slice(0, 90)}`);
    }
  });
  return { issues, checked };
}

if (require.main === module) {
  const { issues, checked } = check();
  console.log(`Checked ${checked} real <img> tag(s) across tool pages.`);
  if (issues.length) {
    console.log(`\n${issues.length} missing alt text (advisory, not blocking):`);
    issues.forEach((i) => console.log('  - ' + i));
  } else {
    console.log('Every <img> tag has alt text.');
  }
}

module.exports = { check };
