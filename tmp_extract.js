const fs = require('fs');
const c = fs.readFileSync('index.html', 'utf8');
const idx = c.indexOf('function renderDetail(r)');
const end = c.indexOf('function deleteRow', idx);
const section = c.substring(idx, end);
console.log('=== EXACT SECTION ===');
// Print each char code around the problem line
const lines = section.split('\n');
lines.forEach((l, i) => {
  console.log('LINE ' + i + ' (' + l.length + ' chars): ' + JSON.stringify(l));
});

