const fs = require('fs');
const PizZip = require('pizzip');

const templatePath = 'templates/Thuế/Thuế.docx';

console.log('🔍 Analyzing:', templatePath);

const content = fs.readFileSync(templatePath);
const zip = new PizZip(content);
let xml = zip.files['word/document.xml'].asText();

console.log('\n📊 Before fix:');
const tripleBrace = (xml.match(/\{\{\{[^}]+\}\}\}/g) || []).length;
console.log('  Triple {{{braces}}}:', tripleBrace);

const validBefore = (xml.match(/\{\{[^}]+\}\}/g) || []).length;
console.log('  Valid {{placeholders}}:', validBefore);

console.log('\n🔧 Fixing triple braces to double braces...');

// Fix {{{XXX}}} to {{XXX}}
xml = xml.replace(/\{\{\{([^}]+)\}\}\}/g, '{{$1}}');

// Fix any remaining {XXX} to {{XXX}}
xml = xml.replace(/\{([A-Za-z_][A-Za-z0-9_]*)\}/g, '{{$1}}');

console.log('\n📊 After fix:');
const tripleAfter = (xml.match(/\{\{\{[^}]+\}\}\}/g) || []).length;
console.log('  Triple {{{braces}}}:', tripleAfter);

const validAfter = (xml.match(/\{\{[^}]+\}\}/g) || []).length;
console.log('  Valid {{placeholders}}:', validAfter);

// List all placeholders
const placeholders = (xml.match(/\{\{([^}]+)\}\}/g) || []).map(p => p.replace(/[{}]/g, ''));
const unique = [...new Set(placeholders)];
console.log('\n✅ Unique placeholders:', unique.length);
unique.forEach(p => console.log('  -', p));

// Save
const backupPath = templatePath.replace('.docx', '.backup3.docx');
fs.writeFileSync(backupPath, fs.readFileSync(templatePath));
console.log('\n💾 Backup saved:', backupPath);

zip.file('word/document.xml', xml);
const buffer = zip.generate({ type: 'nodebuffer', compression: 'DEFLATE' });
fs.writeFileSync(templatePath, buffer);

console.log('✅ Fixed file saved:', templatePath);
console.log('\n🎉 Done! Please test the template now.');
