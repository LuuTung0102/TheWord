const fs = require('fs');
const PizZip = require('pizzip');

const content = fs.readFileSync('templates/Thuế/Thuế.docx');
const zip = new PizZip(content);
const xml = zip.files['word/document.xml'].asText();

// Better approach: find patterns that are NOT {{XXX}}
// First remove all valid {{XXX}} patterns
let cleanXml = xml;
cleanXml = cleanXml.replace(/\{\{[^}]+\}\}/g, '');

// Now find any remaining { or }
const remainingBraces = cleanXml.match(/[{}]/g) || [];
console.log('Remaining single braces:', remainingBraces.length);

if (remainingBraces.length > 0) {
  console.log('First 20:', remainingBraces.slice(0, 20).join(''));
  
  // Find context
  const idx = cleanXml.indexOf('{');
  if (idx >= 0) {
    console.log('\nContext around first {:', cleanXml.substring(idx-50, idx+50));
  }
} else {
  console.log('✅ No broken patterns found!');
}
