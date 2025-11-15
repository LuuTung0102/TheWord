const fs = require('fs');
const PizZip = require('pizzip');
const path = require('path');

const templatePath = process.argv[2] || 'templates/Thuế/Thuế.docx';

console.log('🔍 Analyzing:', templatePath);

try {
  const content = fs.readFileSync(templatePath);
  const zip = new PizZip(content);
  
  if (!zip.files['word/document.xml']) {
    console.error('❌ No document.xml found');
    process.exit(1);
  }
  
  let xml = zip.files['word/document.xml'].asText();
  const originalXml = xml;
  
  console.log('\n📊 Before fix:');
  const validBefore = (xml.match(/\{\{[^}]+\}\}/g) || []).length;
  console.log('  Valid placeholders:', validBefore);
  
  // Find broken placeholders
  const allBraces = xml.match(/\{[^{]*?\}/g) || [];
  const broken = allBraces.filter(b => !b.match(/^\{\{[^}]+\}\}$/));
  console.log('  Broken tags:', broken.length);
  if (broken.length > 0) {
    console.log('  Examples:', broken.slice(0, 5).map(b => b.substring(0, 50)));
  }
  
  console.log('\n🔧 Fixing...');
  
  // Strategy: Find all {XXX} patterns and convert to {{XXX}}
  // First, protect valid {{XXX}} patterns
  xml = xml.replace(/\{\{([^}]+)\}\}/g, '___PLACEHOLDER_$1___');
  
  // Now fix broken single-brace patterns
  // Pattern: {XXX} where XXX is a valid placeholder name
  xml = xml.replace(/\{([A-Za-z_][A-Za-z0-9_]*)\}/g, '{{$1}}');
  
  // Restore protected placeholders
  xml = xml.replace(/___PLACEHOLDER_([^_]+)___/g, '{{$1}}');
  
  // Now do aggressive merging for any remaining broken patterns
  let changed = true;
  let iterations = 0;
  while (changed && iterations < 20) {
    const before = xml;
    
    // Merge {{ across tags
    xml = xml.replace(/\{<\/w:t>([^<]*)<w:t[^>]*>\{/g, '{{');
    xml = xml.replace(/\{<\/w:t><\/w:r>([^<]*)<w:r[^>]*><w:t[^>]*>\{/g, '{{');
    
    // Merge }} across tags
    xml = xml.replace(/\}<\/w:t>([^<]*)<w:t[^>]*>\}/g, '}}');
    xml = xml.replace(/\}<\/w:t><\/w:r>([^<]*)<w:r[^>]*><w:t[^>]*>\}/g, '}}');
    
    // Merge content inside {{ }}
    xml = xml.replace(/\{\{([^}]*)<\/w:t>([^<]*)<w:t[^>]*>([^}]*)\}\}/g, '{{$1$3}}');
    xml = xml.replace(/\{\{([^}]*)<\/w:t><\/w:r>([^<]*)<w:r[^>]*><w:t[^>]*>([^}]*)\}\}/g, '{{$1$3}}');
    
    changed = (before !== xml);
    iterations++;
  }
  
  console.log('  Iterations:', iterations);
  
  console.log('\n📊 After fix:');
  const validAfter = (xml.match(/\{\{[^}]+\}\}/g) || []).length;
  console.log('  Valid placeholders:', validAfter);
  
  const allBracesAfter = xml.match(/\{[^{]*?\}/g) || [];
  const brokenAfter = allBracesAfter.filter(b => !b.match(/^\{\{[^}]+\}\}$/));
  console.log('  Broken tags:', brokenAfter.length);
  if (brokenAfter.length > 0) {
    console.log('  Examples:', brokenAfter.slice(0, 5).map(b => b.substring(0, 50)));
  }
  
  // List all valid placeholders
  const placeholders = (xml.match(/\{\{([^}]+)\}\}/g) || []).map(p => p.replace(/[{}]/g, ''));
  console.log('\n✅ Valid placeholders found:');
  placeholders.forEach(p => console.log('  -', p));
  
  if (xml !== originalXml) {
    // Save fixed version
    zip.file('word/document.xml', xml);
    const buffer = zip.generate({ type: 'nodebuffer', compression: 'DEFLATE' });
    
    const backupPath = templatePath.replace('.docx', '.backup.docx');
    fs.writeFileSync(backupPath, fs.readFileSync(templatePath));
    console.log('\n💾 Backup saved:', backupPath);
    
    fs.writeFileSync(templatePath, buffer);
    console.log('✅ Fixed file saved:', templatePath);
    console.log('\n🎉 Done! Please test the template now.');
  } else {
    console.log('\n✅ No changes needed - file is already clean!');
  }
  
} catch (error) {
  console.error('❌ Error:', error.message);
  process.exit(1);
}
