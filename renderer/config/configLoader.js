
const { ipcRenderer } = require("electron");
const path = require("path");
const fs = require("fs");

let configCache = {};

/**
 * Load config.json từ folder template
 * @param {string} folderPath - Đường dẫn đến folder (VD: "D:/TheWord/templates/HĐ chuyển nhượng")
 * @returns {Object} Config object hoặc null nếu không tìm thấy
 */
async function loadFolderConfig(folderPath) {
  try {
    if (configCache[folderPath]) {
      console.log(`📦 Using cached config for: ${folderPath}`);
      return configCache[folderPath];
    }
    
    const configPath = path.join(folderPath, 'config.json');
    
    if (!fs.existsSync(configPath)) {
      console.warn(`⚠️ No config.json found in: ${folderPath}`);
      return null;
    }
    
    const configContent = fs.readFileSync(configPath, 'utf-8');
    const config = JSON.parse(configContent);
    console.log(`✅ Loaded config from: ${configPath}`);
    
    configCache[folderPath] = config;
    
    return config;
  } catch (error) {
    console.error(`❌ Error loading config from ${folderPath}:`, error);
    return null;
  }
}

/**
 * Build placeholder mapping từ config JSON mới
 * @param {Object} config - Config object từ config.json
 * @param {Array} actualPlaceholders - Danh sách placeholders thực tế từ template Word file
 * @returns {Object} Placeholder mapping
 */
function buildPlaceholderMapping(config, actualPlaceholders = null) {
  if (!config) return {};
  const mapping = {};
  const basePlaceholders = window.BASE_PLACEHOLDERS || {};
  const actualPhSet = actualPlaceholders ? new Set(actualPlaceholders) : null;
  const schemaFields = {};
  if (config.fieldSchemas) {
    Object.keys(config.fieldSchemas).forEach(schemaName => {
      const schema = config.fieldSchemas[schemaName];
      if (schema.fields && Array.isArray(schema.fields)) {
        schema.fields.forEach(field => {
          schemaFields[field.name] = field;
        });
      }
    });
  }
  console.log(`📋 Extracted ${Object.keys(schemaFields).length} schema fields for direct reference`);
  
  if (config.fieldMappings) {
    config.fieldMappings.forEach(mappingDef => {
      const { group, subgroups, schema, suffixes, defaultGenders } = mappingDef;
      const schemaDef = config.fieldSchemas[schema];
      
      if (!schemaDef) return;
      
      subgroups.forEach((subgroupDef, subIndex) => {
        const subgroupId = typeof subgroupDef === 'string' ? subgroupDef : subgroupDef.id;
        const subgroupLabel = typeof subgroupDef === 'object' ? subgroupDef.label : subgroupDef;
        
        const suffix = (suffixes && suffixes[subIndex]) ? suffixes[subIndex] : '';
        schemaDef.fields.forEach(fieldDef => {
          const placeholder = `${fieldDef.name}${suffix}`;
          if (actualPhSet && !actualPhSet.has(placeholder)) {
            console.log(`⏭️ Skip mapping ${placeholder}: not in template Word file`);
            return;
          }
          
          const baseFieldName = fieldDef.name;
          const baseField = basePlaceholders[baseFieldName] || {};
          if (!fieldDef.label) {
            let autoLabel = placeholder;
            autoLabel = autoLabel.replace(/[0-9_]+$/, '');
            autoLabel = autoLabel.replace(/([A-Z])/g, ' $1').trim();
            autoLabel = autoLabel.charAt(0).toUpperCase() + autoLabel.slice(1);
            fieldDef.label = autoLabel;
            console.log(`🏷️ Created auto label for ${placeholder}: "${autoLabel}"`);
          }
          
          const fieldConfig = {
            ...baseField,
            ...fieldDef,
            group: group,
            subgroup: subgroupId,
            subgroupLabel: subgroupLabel
          };
          
          // Ensure required is set from fieldDef (may be true, false, or undefined)
          if (fieldDef.hasOwnProperty('required')) {
            fieldConfig.required = fieldDef.required;
          } else if (!fieldConfig.hasOwnProperty('required')) {
            // Default to false if not specified
            fieldConfig.required = false;
          }
          
          if (fieldDef.label) {
            fieldConfig.label = fieldDef.label;
            console.log(`🏷️ Using label from config.json for ${placeholder}: "${fieldDef.label}"`);
          }
          
          if (baseFieldName === 'Gender' && defaultGenders && defaultGenders[subIndex]) {
            fieldConfig.defaultValue = defaultGenders[subIndex];
            console.log(`👤 Setting default gender for ${placeholder}: "${defaultGenders[subIndex]}"`);
          }
          
          if (placeholder.includes("Address")) {
            console.log(`🏠 Creating address field: ${placeholder} from base ${baseFieldName}, type: ${fieldConfig.type}`);
            if (fieldConfig.type !== "address-select") {
              console.warn(`⚠️ Address field ${placeholder} has incorrect type: ${fieldConfig.type}. Fixing to address-select.`);
              fieldConfig.type = "address-select";
            }
          }
          
          mapping[placeholder] = fieldConfig;
        });
      });
    });
  }
  
  // Match placeholders from Word file with fieldMappings to determine group/subgroup
  // This runs after fieldMappings processing, so we only handle placeholders not yet mapped
  if (actualPlaceholders && actualPlaceholders.length > 0) {
    actualPlaceholders.forEach(placeholder => {
      // Skip if already mapped
      if (mapping[placeholder]) return;
      
      // Try to find this placeholder in fieldMappings
      let foundMatch = false;
      
      if (config.fieldMappings) {
        config.fieldMappings.forEach(mappingDef => {
          if (foundMatch) return;
          
          const { group, subgroups, schema, suffixes } = mappingDef;
          const schemaDef = config.fieldSchemas?.[schema];
          if (!schemaDef || !schemaDef.fields) return;
          
          // Try to match placeholder by pattern: fieldName + suffix
          subgroups.forEach((subgroupDef, subIndex) => {
            if (foundMatch) return;
            
            const subgroupId = typeof subgroupDef === 'string' ? subgroupDef : subgroupDef.id;
            const subgroupLabel = typeof subgroupDef === 'object' ? subgroupDef.label : subgroupDef;
            const suffix = (suffixes && suffixes[subIndex]) ? suffixes[subIndex] : '';
            
            // Check if placeholder matches any field in schema with this suffix
            schemaDef.fields.forEach(fieldDef => {
              if (foundMatch) return;
              
              const expectedPlaceholder = `${fieldDef.name}${suffix}`;
              if (placeholder === expectedPlaceholder) {
                // Found match! Create mapping
                const baseFieldName = fieldDef.name;
                const baseField = basePlaceholders[baseFieldName] || {};
                
                const fieldConfig = {
                  ...baseField,
                  ...fieldDef,
                  group: group,
                  subgroup: subgroupId,
                  subgroupLabel: subgroupLabel
                };
                
                // Ensure required is set from fieldDef (may be true, false, or undefined)
                if (fieldDef.hasOwnProperty('required')) {
                  fieldConfig.required = fieldDef.required;
                } else if (!fieldConfig.hasOwnProperty('required')) {
                  // Default to false if not specified
                  fieldConfig.required = false;
                }
                
                if (fieldDef.label) {
                  fieldConfig.label = fieldDef.label;
                } else if (!fieldConfig.label) {
                  // Auto-generate label
                  let autoLabel = placeholder;
                  autoLabel = autoLabel.replace(/[0-9_]+$/, '');
                  autoLabel = autoLabel.replace(/([A-Z])/g, ' $1').trim();
                  autoLabel = autoLabel.charAt(0).toUpperCase() + autoLabel.slice(1);
                  fieldConfig.label = autoLabel;
                }
                
                if (placeholder.includes("Address")) {
                  fieldConfig.type = "address-select";
                }
                
                mapping[placeholder] = fieldConfig;
                foundMatch = true;
                console.log(`✅ Matched placeholder ${placeholder} to group ${group}, subgroup ${subgroupId} from fieldMappings (required: ${fieldConfig.required})`);
              }
            });
          });
        });
      }
      
      if (!foundMatch) {
        const fieldName = placeholder.replace(/\d+$/, '');
        const schemaField = schemaFields[fieldName];
        
        if (schemaField) {
          console.log(`🔍 Found field ${fieldName} in schemas for placeholder ${placeholder}`);
          mapping[placeholder] = {
            ...schemaField,
            group: 'UNKNOWN',
            subgroup: 'INFO'
          };
          
          // Ensure required is preserved from schemaField
          if (schemaField.hasOwnProperty('required')) {
            mapping[placeholder].required = schemaField.required;
          } else {
            mapping[placeholder].required = false;
          }
          
          if (placeholder.includes("Address")) {
            mapping[placeholder].type = "address-select";
          }
        } else {
          const baseField = basePlaceholders[fieldName];
          if (baseField) {
            let autoLabel = placeholder;
            autoLabel = autoLabel.replace(/[0-9_]+$/, '');
            autoLabel = autoLabel.replace(/([A-Z])/g, ' $1').trim();
            autoLabel = autoLabel.charAt(0).toUpperCase() + autoLabel.slice(1);
            
            mapping[placeholder] = {
              ...baseField,
              label: autoLabel,
              group: 'UNKNOWN',
              subgroup: 'INFO',
              required: baseField.hasOwnProperty('required') ? baseField.required : false
            };
            
            if (placeholder.includes("Address")) {
              mapping[placeholder].type = "address-select";
            }
            
            console.log(`🏷️ Created auto mapping for ${placeholder} (not in fieldMappings)`);
          } else {
            // Fallback: create default mapping
            let autoLabel = placeholder;
            autoLabel = autoLabel.replace(/[0-9_]+$/, '');
            autoLabel = autoLabel.replace(/([A-Z])/g, ' $1').trim();
            autoLabel = autoLabel.charAt(0).toUpperCase() + autoLabel.slice(1);
            
            mapping[placeholder] = {
              type: placeholder.includes("Address") ? "address-select" : "text",
              label: autoLabel,
              group: 'UNKNOWN',
              subgroup: 'INFO',
              required: false
            };
            
            console.warn(`⚠️ Placeholder ${placeholder} not found in config, created default mapping`);
          }
        }
      }
    });
  }
  
  if (config.customPlaceholders) {
    Object.keys(config.customPlaceholders).forEach(placeholder => {
      const customConfig = config.customPlaceholders[placeholder];
      
      if (mapping[placeholder]) {
        mapping[placeholder] = {
          ...mapping[placeholder],
          ...customConfig
        };
        console.log(`🔄 Overriding ${placeholder} with custom config`);
      } else {
        mapping[placeholder] = {
          type: "text", 
          ...customConfig
        };
        console.log(`➕ Adding custom placeholder: ${placeholder}`);
      }
    });
  }
  
  console.log(`🔧 Built placeholder mapping with ${Object.keys(mapping).length} placeholders`);
  
  return mapping;
}

/**
 * Get group labels từ config
 * @param {Object} config - Config object từ config.json
 * @returns {Object} Map của group ID -> label
 */
function getGroupLabels(config) {
  if (!config || !config.groups) return {};
  
  const labels = {};
  
  if (Array.isArray(config.groups)) {
    config.groups.forEach(group => {
      if (group.id && group.label) {
        labels[group.id] = group.label;
      }
    });
  } 
  else if (typeof config.groups === 'object') {
    Object.keys(config.groups).forEach(groupId => {
      labels[groupId] = config.groups[groupId].label || groupId;
    });
  }
  
  return labels;
}

/**
 * Get subgroup labels từ config
 * @param {Object} config - Config object từ config.json
 * @returns {Object} Map của subgroup ID -> label
 */
function getSubgroupLabels(config) {
  if (!config) return {};
  
  const labels = {};
  
  if (config.fieldMappings) {
    config.fieldMappings.forEach(mapping => {
      const { subgroups } = mapping;
      
      if (Array.isArray(subgroups)) {
        subgroups.forEach(subgroupDef => {
          if (typeof subgroupDef === 'string') {
            labels[subgroupDef] = subgroupDef === 'INFO' ? 'Thông tin' : subgroupDef;
          } else if (typeof subgroupDef === 'object' && subgroupDef.id && subgroupDef.label) {
            labels[subgroupDef.id] = subgroupDef.label;
            console.log(`🏷️ Subgroup label from fieldMappings: ${subgroupDef.id} -> "${subgroupDef.label}"`);
          }
        });
      }
    });
  }
  
  if (config.subgroupLabels) {
    Object.keys(config.subgroupLabels).forEach(subgroupId => {
      labels[subgroupId] = config.subgroupLabels[subgroupId];
    });
  }
  
  return labels;
}

if (typeof window !== 'undefined') {
  window.loadFolderConfig = loadFolderConfig;
  window.buildPlaceholderMapping = buildPlaceholderMapping;
  window.getGroupLabels = getGroupLabels;
  window.getSubgroupLabels = getSubgroupLabels;
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    loadFolderConfig,
    buildPlaceholderMapping,
    getGroupLabels,
    getSubgroupLabels
  };
}