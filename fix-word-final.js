const fs = require('fs');
const PizZip = require('pizzip');

const templatePath = 'templates/Thuế/Thuế.docx';

console.log('🔍 Fixing:', templatePath);

const content = fs.readFileSync(templatePath);
const zip = new PizZip(content);
let xml = zip.files['word/document.xml'].asText();

console.log('Original length:', xml.length);

// Strategy: Replace all occurrences of {{{ with {{
let count = 0;
while (xml.includes('{{{')) {
  xml = xml.replace('{{{', '{{');
  count++;
  if (count > 1000) break; // Safety limit
}
console.log('Replaced {{{ -> {{:', count, 'times');

// Replace all occurrences of }}} with }}
count = 0;
while (xml.includes('}}}')) {
  xml = xml.replace('}}}', '}}');
  count++;
  if (count > 1000) break;
}
console.log('Replaced }}} -> }}:', count, 'times');

console.log('New length:', xml.length);

// Verify
const triple = (xml.match(/\{\{\{/g) || []).length;
console.log('\nRemaining {{{:', triple);

// Save
const backupPath = templatePath.replace('.docx', '.backup-final.docx');
fs.writeFileSync(backupPath, fs.readFileSync(templatePath));

zip.file('word/document.xml', xml);
const buffer = zip.generate({ type: 'nodebuffer', compression: 'DEFLATE' });
fs.writeFileSync(templatePath, buffer);

console.log('\n✅ Done! File saved.');
