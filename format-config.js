const fs = require('fs');
const path = require('path');

// Function to format config with compact objects
function formatConfig(obj, indent = 0) {
  const spaces = '  '.repeat(indent);
  const nextSpaces = '  '.repeat(indent + 1);
  
  if (Array.isArray(obj)) {
    if (obj.length === 0) return '[]';
    
    // Check if array contains only primitives (strings, numbers, booleans)
    const isPrimitiveArray = obj.every(item => 
      typeof item === 'string' || typeof item === 'number' || typeof item === 'boolean' || item === null
    );
    
    if (isPrimitiveArray) {
      // Format primitive array on one line
      return JSON.stringify(obj);
    }
    
    // Check if array contains simple objects (should be on one line)
    const isCompactArray = obj.every(item => {
      if (typeof item !== 'object' || item === null || Array.isArray(item)) return false;
      
      // Check if object has nested arrays or objects
      const values = Object.values(item);
      const hasNestedStructure = values.some(v => 
        (typeof v === 'object' && v !== null && !Array.isArray(v)) ||
        (Array.isArray(v) && v.length > 0 && typeof v[0] === 'object')
      );
      
      return !hasNestedStructure;
    });
    
    if (isCompactArray) {
      // Format each object on one line
      const items = obj.map(item => {
        return nextSpaces + JSON.stringify(item);
      }).join(',\n');
      return '[\n' + items + '\n' + spaces + ']';
    } else {
      // Regular array formatting
      const items = obj.map(item => {
        return nextSpaces + formatConfig(item, indent + 1);
      }).join(',\n');
      return '[\n' + items + '\n' + spaces + ']';
    }
  } else if (typeof obj === 'object' && obj !== null) {
    const keys = Object.keys(obj);
    if (keys.length === 0) return '{}';
    
    const items = keys.map(key => {
      const value = obj[key];
      const formattedValue = formatConfig(value, indent + 1);
      return `${nextSpaces}"${key}": ${formattedValue}`;
    }).join(',\n');
    
    return '{\n' + items + '\n' + spaces + '}';
  } else {
    return JSON.stringify(obj);
  }
}

// Get config path from command line argument
const configPath = process.argv[2];

if (!configPath) {
  console.error('Usage: node format-config.js <path-to-config.json>');
  console.error('Example: node format-config.js "templates/Thuế/config.json"');
  process.exit(1);
}

try {
  // Read config file
  const fullPath = path.resolve(configPath);
  console.log('Reading:', fullPath);
  
  const configContent = fs.readFileSync(fullPath, 'utf8');
  const config = JSON.parse(configContent);
  
  // Format config
  const formatted = formatConfig(config);
  
  // Write back to file
  fs.writeFileSync(fullPath, formatted, 'utf8');
  
  console.log('✓ Successfully formatted:', fullPath);
} catch (error) {
  console.error('✗ Error:', error.message);
  process.exit(1);
}
