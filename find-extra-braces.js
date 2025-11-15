const fs = require('fs');
const PizZip = require('pizzip');

const content = fs.readFileSync('templates/Thuế/Thuế.docx');
const zip = new PizZip(content);
let xml = zip.files['word/document.xml'].asText();

console.log('Searching for extra braces...\n');

// Remove all valid {{XXX}} patterns
let cleaned = xml.replace(/\{\{[^}]+\}\}/g, '___VALID___');

// Find remaining { and }
const leftBraces = (cleaned.match(/\{/g) || []).length;
const rightBraces = (cleaned.match(/\}/g) || []).length;

console.log('After removing valid {{XXX}}:');
console.log('  Remaining { :', leftBraces);
console.log('  Remaining } :', rightBraces);

if (leftBraces > 0 || rightBraces > 0) {
  // Find first occurrence
  const leftIdx = cleaned.indexOf('{');
  const rightIdx = cleaned.indexOf('}');
  
  if (leftIdx >= 0) {
    console.log('\nFirst { at position:', leftIdx);
    console.log('Context:', xml.substring(leftIdx-50, leftIdx+50));
  }
  
  if (rightIdx >= 0) {
    console.log('\nFirst } at position:', rightIdx);
    console.log('Context:', xml.substring(rightIdx-50, rightIdx+50));
  }
  
  // Fix: remove all extra braces
  console.log('\n🔧 Removing extra braces...');
  xml = xml.replace(/\{\{([^}]+)\}\}/g, '___TEMP_$1___');
  xml = xml.replace(/[{}]/g, '');
  xml = xml.replace(/___TEMP_([^_]+)___/g, '{{$1}}');
  
  // Save
  const backupPath = 'templates/Thuế/Thuế.backup-extra.docx';
  fs.writeFileSync(backupPath, fs.readFileSync('templates/Thuế/Thuế.docx'));
  
  zip.file('word/document.xml', xml);
  const buffer = zip.generate({ type: 'nodebuffer', compression: 'DEFLATE' });
  fs.writeFileSync('templates/Thuế/Thuế.docx', buffer);
  
  console.log('✅ Fixed and saved!');
}
