const fs = require('fs');
const PizZip = require('pizzip');

// Copy from a working template
const source = 'templates/HĐ chuyển nhượng/HĐ chuyển nhượng(1).docx';
const target = 'templates/Thuế/Thuế.docx';

console.log('Copying from working template...');
fs.copyFileSync(source, target);

// Now update placeholders
const content = fs.readFileSync(target);
const zip = new PizZip(content);
let xml = zip.files['word/document.xml'].asText();

// Replace all existing placeholders with Thuế ones
const replacements = {
  'Name': 'Name1',
  'CCCD': 'CCCD1', 
  'Address': 'Address1',
  'SDT': 'SDT1',
  'Email': 'Email1',
  'Ngay_Cap': 'Ngay_Cap1',
  'Noi_Cap': 'Noi_Cap1'
};

Object.keys(replacements).forEach(old => {
  const pattern = new RegExp(`\\{\\{${old}\\}\\}`, 'g');
  xml = xml.replace(pattern, `{{${replacements[old]}}}`);
});

zip.file('word/document.xml', xml);
const buffer = zip.generate({ type: 'nodebuffer', compression: 'DEFLATE' });
fs.writeFileSync(target, buffer);

console.log('✅ Done!');
