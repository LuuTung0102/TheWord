const fs = require('fs');
const PizZip = require('pizzip');

const templatePath = 'templates/Thuế/Thuế.docx';

console.log('🔍 Fixing single braces:', templatePath);

const content = fs.readFileSync(templatePath);
const zip = new PizZip(content);
let xml = zip.files['word/document.xml'].asText();

// Find all single brace patterns
const singleBefore = (xml.match(/\{([A-Za-z_][A-Za-z0-9_]*)\}/g) || []);
console.log('Single {brace} patterns found:', singleBefore.length);
if (singleBefore.length > 0) {
  console.log('Examples:', singleBefore.slice(0, 10));
}

// Get list of valid placeholder names from double braces
const validPlaceholders = new Set();
const doubleBraces = xml.match(/\{\{([A-Za-z_][A-Za-z0-9_]*)\}\}/g) || [];
doubleBraces.forEach(p => {
  const name = p.replace(/[{}]/g, '');
  validPlaceholders.add(name);
});

console.log('\nValid placeholder names:', Array.from(validPlaceholders).slice(0, 10));

// Fix each single brace pattern if it matches a valid placeholder name
let fixed = 0;
validPlaceholders.forEach(name => {
  const pattern = new RegExp(`\\{${name}\\}`, 'g');
  const matches = (xml.match(pattern) || []).length;
  if (matches > 0) {
    xml = xml.replace(pattern, `{{${name}}}`);
    fixed += matches;
    console.log(`Fixed {${name}} -> {{${name}}} (${matches} times)`);
  }
});

console.log('\nTotal fixed:', fixed);

// Verify
const singleAfter = (xml.match(/\{([A-Za-z_][A-Za-z0-9_]*)\}/g) || []);
console.log('Remaining single {brace}:', singleAfter.length);

// Save
const backupPath = templatePath.replace('.docx', '.backup-single.docx');
fs.writeFileSync(backupPath, fs.readFileSync(templatePath));

zip.file('word/document.xml', xml);
const buffer = zip.generate({ type: 'nodebuffer', compression: 'DEFLATE' });
fs.writeFileSync(templatePath, buffer);

console.log('\n✅ Done! File saved.');
