const fs = require('fs');
const PizZip = require('pizzip');

const templatePath = 'templates/Thuế/Thuế.docx';

console.log('🔍 Analyzing:', templatePath);

const content = fs.readFileSync(templatePath);
const zip = new PizZip(content);
let xml = zip.files['word/document.xml'].asText();

console.log('\n📊 Before fix:');
const validBefore = (xml.match(/\{\{[^}]+\}\}/g) || []).length;
console.log('  Valid {{placeholders}}:', validBefore);

const singleBrace = xml.match(/\{([A-Za-z_][A-Za-z0-9_]*)\}/g) || [];
console.log('  Single {brace}:', singleBrace.length);
if (singleBrace.length > 0) {
  console.log('  Examples:', singleBrace.slice(0, 10));
}

console.log('\n🔧 Fixing single braces to double braces...');

// Fix all {XXX} to {{XXX}} where XXX is a valid placeholder name
xml = xml.replace(/\{([A-Za-z_][A-Za-z0-9_]*)\}/g, '{{$1}}');

console.log('\n📊 After fix:');
const validAfter = (xml.match(/\{\{[^}]+\}\}/g) || []).length;
console.log('  Valid {{placeholders}}:', validAfter);

const singleBraceAfter = xml.match(/\{([A-Za-z_][A-Za-z0-9_]*)\}/g) || [];
console.log('  Single {brace}:', singleBraceAfter.length);

// Save
const backupPath = templatePath.replace('.docx', '.backup2.docx');
fs.writeFileSync(backupPath, fs.readFileSync(templatePath));
console.log('\n💾 Backup saved:', backupPath);

zip.file('word/document.xml', xml);
const buffer = zip.generate({ type: 'nodebuffer', compression: 'DEFLATE' });
fs.writeFileSync(templatePath, buffer);

console.log('✅ Fixed file saved:', templatePath);
console.log('\n🎉 Done! Please test the template now.');
