const { ipcRenderer } = require("electron");
const path = require("path");
const fs = require("fs");

let configCache = {};

async function loadFolderConfig(folderPath, forceReload = false) {
  try {
    if (forceReload && configCache[folderPath]) {
      delete configCache[folderPath];
    }
    
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

function clearConfigCache(folderPath = null) {
  if (folderPath) {
    delete configCache[folderPath];
  } else {
    configCache = {};
  }
}

function validateDotPlaceholder(fieldDef, placeholder) {
  if (fieldDef.type !== 'text-or-dots') {
    return undefined;
  }
  
  if (!fieldDef.hasOwnProperty('dotPlaceholder')) {
    return undefined;
  }
  
  if (typeof fieldDef.dotPlaceholder !== 'string') {
    return "...........";
  }
  
  return fieldDef.dotPlaceholder;
}

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
          
          const validatedDotPlaceholder = validateDotPlaceholder(fieldDef, placeholder);
          if (validatedDotPlaceholder !== undefined) {
            fieldConfig.dotPlaceholder = validatedDotPlaceholder;
          } else if (fieldConfig.type !== 'text-or-dots' && fieldConfig.dotPlaceholder) {
            delete fieldConfig.dotPlaceholder;
          }
          mapping[placeholder] = fieldConfig;
        });
      });
    });
  }
  
 
  if (actualPlaceholders && actualPlaceholders.length > 0) {
    const nameTPlaceholders = actualPlaceholders.filter(ph => /^NameT\d+$/.test(ph));
    nameTPlaceholders.forEach(nameTPlaceholder => {
      const number = nameTPlaceholder.match(/^NameT(\d+)$/)[1];
      const namePlaceholder = `Name${number}`;
      
      if (!actualPlaceholders.includes(namePlaceholder) && !mapping[namePlaceholder]) {
        const baseField = basePlaceholders['Name'] || {};
        mapping[namePlaceholder] = {
          ...baseField,
          type: 'text',
          label: `Họ và tên ${number}`,
          group: 'UNKNOWN',
          subgroup: 'INFO',
          required: false
        };
      }
    });
    
    const sortedPlaceholders = [...actualPlaceholders].sort((a, b) => {
      const aIsNameT = /^NameT\d+$/.test(a);
      const bIsNameT = /^NameT\d+$/.test(b);
      if (aIsNameT && !bIsNameT) return 1;
      if (!aIsNameT && bIsNameT) return -1;
      return 0;
    });
    
    sortedPlaceholders.forEach(placeholder => {
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
                
                const validatedDotPlaceholder = validateDotPlaceholder(fieldDef, placeholder);
                if (validatedDotPlaceholder !== undefined) {
                  fieldConfig.dotPlaceholder = validatedDotPlaceholder;
                } else if (fieldConfig.type !== 'text-or-dots' && fieldConfig.dotPlaceholder) {
                  delete fieldConfig.dotPlaceholder;
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
          
          if (schemaField.hasOwnProperty('required')) {
            mapping[placeholder].required = schemaField.required;
          } else {
            mapping[placeholder].required = false;
          }
          
          if (placeholder.includes("Address")) {
            mapping[placeholder].type = "address-select";
          }
          
          const validatedDotPlaceholder = validateDotPlaceholder(schemaField, placeholder);
          if (validatedDotPlaceholder !== undefined) {
            mapping[placeholder].dotPlaceholder = validatedDotPlaceholder;
          } else if (mapping[placeholder].type !== 'text-or-dots' && mapping[placeholder].dotPlaceholder) {
            delete mapping[placeholder].dotPlaceholder;
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
              const number = placeholder.match(/^NameT(\d+)$/)[1];
              const namePlaceholder = `Name${number}`;
              const nameMapping = mapping[namePlaceholder];
              
              mapping[placeholder] = {
                type: 'text',
                label: `Tên ${number} (Title Case)`,
                group: nameMapping ? nameMapping.group : 'UNKNOWN',
                subgroup: nameMapping ? nameMapping.subgroup : 'INFO',
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
      const validatedDotPlaceholder = validateDotPlaceholder(mapping[placeholder], placeholder);
      if (validatedDotPlaceholder !== undefined) {
        mapping[placeholder].dotPlaceholder = validatedDotPlaceholder;
      } else if (mapping[placeholder].type !== 'text-or-dots' && mapping[placeholder].dotPlaceholder) {
        delete mapping[placeholder].dotPlaceholder;
      }
    });
  }
  
  return mapping;
}

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
  window.clearConfigCache = clearConfigCache;
  window.buildPlaceholderMapping = buildPlaceholderMapping;
  window.getGroupLabels = getGroupLabels;
  window.getSubgroupLabels = getSubgroupLabels;
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    loadFolderConfig,
    clearConfigCache,
    buildPlaceholderMapping,
    getGroupLabels,
    getSubgroupLabels
  };
}