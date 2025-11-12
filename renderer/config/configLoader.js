
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
      return configCache[folderPath];
    }
    
    const configPath = path.join(folderPath, 'config.json');
    
    if (!fs.existsSync(configPath)) {
      return null;
    }
    
    const configContent = fs.readFileSync(configPath, 'utf-8');
    const config = JSON.parse(configContent);
    
    configCache[folderPath] = config;
    
    return config;
  } catch (error) {
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
          }
          
          const fieldConfig = {
            ...baseField,
            ...fieldDef,
            group: group,
            subgroup: subgroupId,
            subgroupLabel: subgroupLabel
          };
          
          
          if (fieldDef.hasOwnProperty('required')) {
            fieldConfig.required = fieldDef.required;
          } else if (!fieldConfig.hasOwnProperty('required')) {
            
            fieldConfig.required = false;
          }
          
          if (fieldDef.label) {
            fieldConfig.label = fieldDef.label;
          }
          
          if (baseFieldName === 'Gender' && defaultGenders && defaultGenders[subIndex]) {
            fieldConfig.defaultValue = defaultGenders[subIndex];
          }
          
          if (placeholder.includes("Address")) {
            if (fieldConfig.type !== "address-select") {
              fieldConfig.type = "address-select";
            }
          }
          
          mapping[placeholder] = fieldConfig;
        });
      });
    });
  }
  
 
  if (actualPlaceholders && actualPlaceholders.length > 0) {
    actualPlaceholders.forEach(placeholder => {
      if (mapping[placeholder]) return;
      let foundMatch = false;
      
      if (config.fieldMappings) {
        config.fieldMappings.forEach(mappingDef => {
          if (foundMatch) return;
          
          const { group, subgroups, schema, suffixes } = mappingDef;
          const schemaDef = config.fieldSchemas?.[schema];
          if (!schemaDef || !schemaDef.fields) return;
          
          subgroups.forEach((subgroupDef, subIndex) => {
            if (foundMatch) return;
            
            const subgroupId = typeof subgroupDef === 'string' ? subgroupDef : subgroupDef.id;
            const subgroupLabel = typeof subgroupDef === 'object' ? subgroupDef.label : subgroupDef;
            const suffix = (suffixes && suffixes[subIndex]) ? suffixes[subIndex] : '';
            
            schemaDef.fields.forEach(fieldDef => {
              if (foundMatch) return;
              
              const expectedPlaceholder = `${fieldDef.name}${suffix}`;
              if (placeholder === expectedPlaceholder) {
                const baseFieldName = fieldDef.name;
                const baseField = basePlaceholders[baseFieldName] || {};
                
                const fieldConfig = {
                  ...baseField,
                  ...fieldDef,
                  group: group,
                  subgroup: subgroupId,
                  subgroupLabel: subgroupLabel
                };
                
                if (fieldDef.hasOwnProperty('required')) {
                  fieldConfig.required = fieldDef.required;
                } else if (!fieldConfig.hasOwnProperty('required')) {
                  fieldConfig.required = false;
                }
                
                if (fieldDef.label) {
                  fieldConfig.label = fieldDef.label;
                } else if (!fieldConfig.label) {
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
              }
            });
          });
        });
      }
      
      if (!foundMatch) {
        const fieldName = placeholder.replace(/\d+$/, '');
        const schemaField = schemaFields[fieldName];
        
        if (schemaField) {
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
            
          } else {
            const isAutoGenerated = /^NameT\d+$/.test(placeholder);
            
            if (isAutoGenerated) {
              mapping[placeholder] = {
                type: 'text',
                label: `Tên ${placeholder.replace('NameT', '')} (Title Case)`,
                group: 'UNKNOWN',
                subgroup: 'INFO',
                required: false,
                hidden: true 
              };
            } else {
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
              
            }
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
      } else {
        mapping[placeholder] = {
          type: "text", 
          ...customConfig
        };
      }
    });
  }
  
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