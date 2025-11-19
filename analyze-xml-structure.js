const fs = require('fs');
const PizZip = require('pizzip');

const content = fs.readFileSync('templates/Thuế/Thuế.docx');
const zip = new PizZip(content);
const xml = zip.files['word/document.xml'].asText();

// Find {Name1} and show surrounding structure
const idx = xml.indexOf('{Name1}');
if (idx >= 0) {
  const start = Math.max(0, idx - 300);
  const end = Math.min(xml.length, idx + 300);
  const context = xml.substring(start, end);
  
  console.log('Context around {Name1}:');
  console.log(context);
  console.log('\n---\n');
  
  // Check if it's in a textbox
  if (context.includes('txbx') || context.includes('textbox')) {
    console.log('⚠️ Found in textbox/shape - these are harder to fix');
  }
}

// Count textboxes
const textboxCount = (xml.match(/<w:txbxContent>/g) || []).length;
console.log('Textboxes in document:', textboxCount);
