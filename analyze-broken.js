const fs = require('fs');
const PizZip = require('pizzip');

const content = fs.readFileSync('templates/Thuế/Thuế.docx');
const zip = new PizZip(content);
const xml = zip.files['word/document.xml'].asText();

// Find first {MST1} with more context
const idx = xml.indexOf('{MST1}');
if (idx >= 0) {
  const context = xml.substring(Math.max(0, idx - 200), Math.min(xml.length, idx + 200));
  console.log('Context around first {MST1}:');
  console.log(context);
  console.log('\n---\n');
}

// Check if it's actually {{MST1}} split across tags
const idx2 = xml.indexOf('{{MST1}}');
if (idx2 >= 0) {
  console.log('Found {{MST1}} at position:', idx2);
  const context2 = xml.substring(Math.max(0, idx2 - 100), Math.min(xml.length, idx2 + 100));
  console.log(context2);
}
