const fs = require('fs');
const PizZip = require('pizzip');

const templatePath = 'templates/Thuế/Thuế.docx';
console.log('🔧 Fixing ALL braces in:', templatePath);

const content = fs.readFileSync(templatePath);
const zip = new PizZip(content);
let xml = zip.files['word/document.xml'].asText();

console.log('Original length:', xml.length);

// Get all valid placeholder names
const validNames = new Set();
const matches = xml.match(/\{\{([A-Za-z_][A-Za-z0-9_]*)\}\}/g) || [];
matches.forEach(m => {
  const name = m.replace(/[{}]/g, '');
  validNames.add(name);
});

console.log('Valid placeholder names:', validNames.size);
console.log('Names:', Array.from(validNames).slice(0, 10));

// Fix strategy: 
// 1. Protect valid {{NAME}} by replacing with placeholder
// 2. Replace all {NAME} with {{NAME}}
// 3. Restore protected placeholders

let totalFixed = 0;

// Step 1: Protect valid {{NAME}}
validNames.forEach(name => {
  xml = xml.replace(new RegExp(`\\{\\{${name}\\}\\}`, 'g'), `___PROTECTED_${name}___`);
});

// Step 2: Fix all {NAME} to {{NAME}}
validNames.forEach(name => {
  const pattern = new RegExp(`\\{${name}\\}`, 'g');
  const before = (xml.match(pattern) || []).length;
  if (before > 0) {
    xml = xml.replace(pattern, `{{${name}}}`);
    totalFixed += before;
    console.log(`Fixed {${name}} -> {{${name}}} (${before} times)`);
  }
});

// Step 3: Restore protected
validNames.forEach(name => {
  xml = xml.replace(new RegExp(`___PROTECTED_${name}___`, 'g'), `{{${name}}}`);
});

console.log('\nTotal fixed:', totalFixed);
console.log('New length:', xml.length);

// Backup and save
const backupPath = templatePath.replace('.docx', '.backup-all.docx');
fs.writeFileSync(backupPath, fs.readFileSync(templatePath));

zip.file('word/document.xml', xml);
const buffer = zip.generate({ type: 'nodebuffer', compression: 'DEFLATE' });
fs.writeFileSync(templatePath, buffer);

console.log('\n✅ Done! Backup:', backupPath);
