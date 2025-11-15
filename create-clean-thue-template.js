const fs = require('fs');
const PizZip = require('pizzip');
const Docxtemplater = require('docxtemplater');

console.log('🔧 Creating clean Thuế template...');

// Use HĐ chuyển nhượng as base
const baseTemplate = 'templates/HĐ chuyển nhượng/HĐ chuyển nhượng(1).docx';
const outputPath = 'templates/Thuế/Thuế-clean.docx';

// Read base template
const content = fs.readFileSync(baseTemplate);
const zip = new PizZip(content);

// Get XML
let xml = zip.files['word/document.xml'].asText();

// Replace all placeholders with Thuế placeholders
// This is a simple approach - just clear the content and add basic structure

const thuePlaceholders = [
  'MST1', 'Name1', 'CCCD1', 'Address1', 'SDT1', 'Email1',
  'Thua_dat_so', 'Ban_do_so', 'AddressD', 'VTTD', 'Loai_Dat_F', 'S',
  'Name2', 'MST2', 'CCCD2', 'AddressQS', 'Money', 'MoneyText',
  'Ngay_Cap2', 'Noi_Cap2', 'Address2', 'SDT2',
  'Ngay_Cap1', 'Noi_Cap1', 'TTGLVD'
];

// Create simple document with all placeholders
const simpleDoc = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
  <w:body>
    <w:p><w:r><w:t>GIẤY TỜ THUẾ</w:t></w:r></w:p>
    <w:p><w:r><w:t></w:t></w:r></w:p>
    <w:p><w:r><w:t>Người nộp thuế:</w:t></w:r></w:p>
    <w:p><w:r><w:t>MST: {{MST1}}</w:t></w:r></w:p>
    <w:p><w:r><w:t>Họ tên: {{Name1}}</w:t></w:r></w:p>
    <w:p><w:r><w:t>CCCD: {{CCCD1}}</w:t></w:r></w:p>
    <w:p><w:r><w:t>Địa chỉ: {{Address1}}</w:t></w:r></w:p>
    <w:p><w:r><w:t>SĐT: {{SDT1}}</w:t></w:r></w:p>
    <w:p><w:r><w:t>Email: {{Email1}}</w:t></w:r></w:p>
    <w:p><w:r><w:t>Ngày cấp: {{Ngay_Cap1}}</w:t></w:r></w:p>
    <w:p><w:r><w:t>Nơi cấp: {{Noi_Cap1}}</w:t></w:r></w:p>
    <w:p><w:r><w:t></w:t></w:r></w:p>
    <w:p><w:r><w:t>Người chuyển giao:</w:t></w:r></w:p>
    <w:p><w:r><w:t>MST: {{MST2}}</w:t></w:r></w:p>
    <w:p><w:r><w:t>Họ tên: {{Name2}}</w:t></w:r></w:p>
    <w:p><w:r><w:t>CCCD: {{CCCD2}}</w:t></w:r></w:p>
    <w:p><w:r><w:t>Địa chỉ: {{Address2}}</w:t></w:r></w:p>
    <w:p><w:r><w:t>SĐT: {{SDT2}}</w:t></w:r></w:p>
    <w:p><w:r><w:t>Ngày cấp: {{Ngay_Cap2}}</w:t></w:r></w:p>
    <w:p><w:r><w:t>Nơi cấp: {{Noi_Cap2}}</w:t></w:r></w:p>
    <w:p><w:r><w:t></w:t></w:r></w:p>
    <w:p><w:r><w:t>Thông tin đất:</w:t></w:r></w:p>
    <w:p><w:r><w:t>Thửa đất số: {{Thua_dat_so}}</w:t></w:r></w:p>
    <w:p><w:r><w:t>Bản đồ số: {{Ban_do_so}}</w:t></w:r></w:p>
    <w:p><w:r><w:t>Địa chỉ: {{AddressD}}</w:t></w:r></w:p>
    <w:p><w:r><w:t>Vị trí: {{VTTD}}</w:t></w:r></w:p>
    <w:p><w:r><w:t>Loại đất: {{Loai_Dat_F}}</w:t></w:r></w:p>
    <w:p><w:r><w:t>Diện tích: {{S}} m²</w:t></w:r></w:p>
    <w:p><w:r><w:t>Địa chỉ quyền sử dụng: {{AddressQS}}</w:t></w:r></w:p>
    <w:p><w:r><w:t>Tài sản gắn liền: {{TTGLVD}}</w:t></w:r></w:p>
    <w:p><w:r><w:t></w:t></w:r></w:p>
    <w:p><w:r><w:t>Giá trị:</w:t></w:r></w:p>
    <w:p><w:r><w:t>Số tiền: {{Money}}</w:t></w:r></w:p>
    <w:p><w:r><w:t>Bằng chữ: {{MoneyText}}</w:t></w:r></w:p>
  </w:body>
</w:document>`;

// Save new document
zip.file('word/document.xml', simpleDoc);
const buffer = zip.generate({ type: 'nodebuffer', compression: 'DEFLATE' });
fs.writeFileSync(outputPath, buffer);

console.log('✅ Created:', outputPath);
console.log('\nPlease:');
console.log('1. Open the file in Word');
console.log('2. Format it as needed');
console.log('3. Save and replace Thuế.docx');
