/**
 * FilePress Blog Tutorial - Build Script
 * Assembles _base.html + modules/*.html + _footer.html → index.html
 */

const fs = require('fs');
const path = require('path');

const ROOT = __dirname;

const base = fs.readFileSync(path.join(ROOT, '_base.html'), 'utf-8').trimEnd();
const footer = fs.readFileSync(path.join(ROOT, '_footer.html'), 'utf-8').trimStart();

const modulesDir = path.join(ROOT, 'modules');
const moduleFiles = fs.readdirSync(modulesDir)
  .filter(f => f.endsWith('.html'))
  .sort();

let modulesContent = '';
for (const file of moduleFiles) {
  modulesContent += fs.readFileSync(path.join(modulesDir, file), 'utf-8').trimEnd() + '\n';
}

const output = base + '\n' + modulesContent.trimEnd() + '\n' + footer;
fs.writeFileSync(path.join(ROOT, 'index.html'), output, 'utf-8');

console.log(`✓ Built index.html from ${moduleFiles.length} modules`);
console.log(`  Total: ${output.length} bytes`);
