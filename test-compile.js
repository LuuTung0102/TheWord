const fs = require('fs');
const PizZip = require('pizzip');
const Docxtemplater = require('docxtemplater');
const expressionParser = require('docxtemplater/expressions.js');

const templatePath = 'templates/Thuế/Thuế.docx';

try {
  const content = fs.readFileSync(templatePath);
  const zip = new PizZip(content);
  
  const doc = new Docxtemplater(zip, {
    parser: expressionParser,
    paragraphLoop: true,
    linebreaks: true,
    nullGetter: () => "",
    delimiters: { start: "{{", end: "}}" }
  });
  
  console.log('✅ Template compiled successfully!');
  
} catch (error) {
  console.log('❌ Error:', error.message);
  
  if (error.properties && error.properties.errors) {
    console.log('\nDetails:');
    error.properties.errors.forEach((e, i) => {
      console.log(`\n${i+1}. ${e.explanation || e.message}`);
      if (e.context) {
        console.log('   Context:', JSON.stringify(e.context));
      }
      if (e.xtag) {
        console.log('   Tag:', e.xtag);
      }
      if (e.offset !== undefined) {
        console.log('   Offset:', e.offset);
        
        // Show context around offset
        const xml = zip.files['word/document.xml'].asText();
        const start = Math.max(0, e.offset - 100);
        const end = Math.min(xml.length, e.offset + 100);
        console.log('   XML context:', xml.substring(start, end));
      }
    });
  }
}
