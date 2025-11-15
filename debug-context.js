const fs = require('fs');
const PizZip = require('pizzip');

const content = fs.readFileSync('templates/Thuế/Thuế.docx');
const zip = new PizZip(content);
const xml = zip.files['word/document.xml'].asText();

// Find {MST1} with context
const pattern = /(.{100}\{MST1\}.{100})/g;
const matches = xml.match(pattern);

if (matches) {
  console.log('Found {MST1} patterns with context:');
  matches.slice(0, 3).forEach((m, i) => {
    console.log(`\n${i+1}. ${m}`);
  });
}
