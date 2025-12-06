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

// Find all config.json files in templates folder
function findConfigFiles(dir) {
  const configFiles = [];
  
  try {
    const items = fs.readdirSync(dir, { withFileTypes: true });
    
    for (const item of items) {
      const fullPath = path.join(dir, item.name);
      
      if (item.isDirectory()) {
        // Check if this directory has config.json
        const configPath = path.join(fullPath, 'config.json');
        if (fs.existsSync(configPath)) {
          configFiles.push(configPath);
        }
      }
    }
  } catch (error) {
    console.error('Error reading directory:', error.message);
  }
  
  return configFiles;
}

// Main execution
const templatesDir = path.resolve('templates');

if (!fs.existsSync(templatesDir)) {
  console.error('✗ Templates directory not found:', templatesDir);
  process.exit(1);
}

console.log('Searching for config.json files in:', templatesDir);
const configFiles = findConfigFiles(templatesDir);

if (configFiles.length === 0) {
  console.log('No config.json files found.');
  process.exit(0);
}

console.log(`Found ${configFiles.length} config file(s):\n`);

let successCount = 0;
let errorCount = 0;

for (const configPath of configFiles) {
  try {
    console.log('Processing:', configPath);
    
    const configContent = fs.readFileSync(configPath, 'utf8');
    const config = JSON.parse(configContent);
    
    const formatted = formatConfig(config);
    fs.writeFileSync(configPath, formatted, 'utf8');
    
    console.log('  ✓ Formatted successfully\n');
    successCount++;
  } catch (error) {
    console.error('  ✗ Error:', error.message, '\n');
    errorCount++;
  }
}

console.log('─────────────────────────────');
console.log(`Total: ${configFiles.length} files`);
console.log(`Success: ${successCount}`);
console.log(`Errors: ${errorCount}`);
