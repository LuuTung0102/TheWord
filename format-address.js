const fs = require('fs');

// Read address.json
const data = JSON.parse(fs.readFileSync('renderer/config/address.json', 'utf8'));

// Format function
function formatAddress(data) {
  let result = '[\n';
  
  data.forEach((province, pIndex) => {
    result += '  {\n';
    result += `    "name": "${province.name}",\n`;
    result += '    "wards": [\n';
    
    province.wards.forEach((ward, wIndex) => {
      const villagesStr = JSON.stringify(ward.villages);
      const comma = wIndex < province.wards.length - 1 ? ',' : '';
      result += `      {"name": "${ward.name}", "villages": ${villagesStr}}${comma}\n`;
    });
    
    result += '    ]\n';
    const comma = pIndex < data.length - 1 ? ',' : '';
    result += `  }${comma}\n`;
  });
  
  result += ']\n';
  return result;
}

// Format and write
const formatted = formatAddress(data);
fs.writeFileSync('renderer/config/address.json', formatted, 'utf8');

console.log('✓ Formatted address.json successfully!');
