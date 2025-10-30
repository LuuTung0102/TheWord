
const { ipcRenderer } = require("electron");
const path = require("path");
const fs = require("fs");

// Cache configs đã load
let configCache = {};

/**
 * Load config.json từ folder template
 * @param {string} folderPath - Đường dẫn đến folder (VD: "D:/TheWord/templates/HĐ chuyển nhượng")
 * @returns {Object} Config object hoặc null nếu không tìm thấy
 */
async function loadFolderConfig(folderPath) {
  try {
    // Check cache
    if (configCache[folderPath]) {
      console.log(`📦 Using cached config for: ${folderPath}`);
      return configCache[folderPath];
    }
    
    const configPath = path.join(folderPath, 'config.json');
    
    // Check if config.json exists
    if (!fs.existsSync(configPath)) {
      console.warn(`⚠️ No config.json found in: ${folderPath}`);
      return null;
    }
    
    // Read and parse config
    const configContent = fs.readFileSync(configPath, 'utf-8');
    const config = JSON.parse(configContent);
    
    console.log(`✅ Loaded config from: ${configPath}`);
    
    // Cache it
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
  
  // ✅ Convert actualPlaceholders to Set for fast lookup
  const actualPhSet = actualPlaceholders ? new Set(actualPlaceholders) : null;
  
  // 0. Đầu tiên, lấy tất cả các field từ fieldSchemas để có thể tham chiếu trực tiếp
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
  
  // 1. Process fieldMappings để tạo placeholder mapping
  if (config.fieldMappings) {
    config.fieldMappings.forEach(mappingDef => {
      const { group, subgroups, schema, suffixes, defaultGenders } = mappingDef;
      const schemaDef = config.fieldSchemas[schema];
      
      if (!schemaDef) return;
      
      // Process each subgroup
      subgroups.forEach((subgroupDef, subIndex) => {
        // ✅ Hỗ trợ cả subgroup string cũ và object mới {id, label}
        const subgroupId = typeof subgroupDef === 'string' ? subgroupDef : subgroupDef.id;
        const subgroupLabel = typeof subgroupDef === 'object' ? subgroupDef.label : subgroupDef;
        
        const suffix = (suffixes && suffixes[subIndex]) ? suffixes[subIndex] : '';
        
        // Process each field in schema
        schemaDef.fields.forEach(fieldDef => {
          const placeholder = `${fieldDef.name}${suffix}`;
          
          // ✅ CRITICAL: Skip if placeholder not in actual template
          if (actualPhSet && !actualPhSet.has(placeholder)) {
            console.log(`⏭️ Skip mapping ${placeholder}: not in template Word file`);
            return;
          }
          
          const baseFieldName = fieldDef.name;
          const baseField = basePlaceholders[baseFieldName] || {};
          
          // Tạo label mặc định nếu không có trong config.json
          if (!fieldDef.label) {
            // Tạo label tự động từ placeholder
            let autoLabel = placeholder;
            
            // Loại bỏ số và ký tự đặc biệt ở cuối
            autoLabel = autoLabel.replace(/[0-9_]+$/, '');
            
            // Thêm khoảng trắng giữa các từ (camelCase -> Camel Case)
            autoLabel = autoLabel.replace(/([A-Z])/g, ' $1').trim();
            
            // Viết hoa chữ đầu tiên
            autoLabel = autoLabel.charAt(0).toUpperCase() + autoLabel.slice(1);
            
            fieldDef.label = autoLabel;
            console.log(`🏷️ Created auto label for ${placeholder}: "${autoLabel}"`);
          }
          
          // Merge base field với field từ config
          const fieldConfig = {
            // Lấy từ baseConstants.js (type, validation, order, placeholder...)
            ...baseField,
            
            // GHI ĐÈ bằng config.json trong folder template
            ...fieldDef,
            
            // Thêm thông tin nhóm
            group: group,
            subgroup: subgroupId,
            subgroupLabel: subgroupLabel
          };
          
          // Đảm bảo label từ config.json được ưu tiên
          if (fieldDef.label) {
            fieldConfig.label = fieldDef.label;
            console.log(`🏷️ Using label from config.json for ${placeholder}: "${fieldDef.label}"`);
          }
          
          // ✅ Set default gender for Gender fields
          if (baseFieldName === 'Gender' && defaultGenders && defaultGenders[subIndex]) {
            fieldConfig.defaultValue = defaultGenders[subIndex];
            console.log(`👤 Setting default gender for ${placeholder}: "${defaultGenders[subIndex]}"`);
          }
          
          // Debug log cho address fields
          if (placeholder.includes("Address")) {
            console.log(`🏠 Creating address field: ${placeholder} from base ${baseFieldName}, type: ${fieldConfig.type}`);
            
            // Đảm bảo tất cả address fields đều dùng address-select
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
  
  // 2. Process templates để add additional placeholders
  if (config.templates) {
    config.templates.forEach(template => {
      if (template.placeholders) {
        Object.keys(template.placeholders).forEach(groupKey => {
          const placeholders = template.placeholders[groupKey];
          
          placeholders.forEach(placeholder => {
            // Nếu placeholder chưa có trong mapping, thêm từ base
            if (!mapping[placeholder]) {
              const fieldName = placeholder.replace(/\d+$/, ''); // Bỏ suffix số
              
              // Kiểm tra xem có trong schemaFields không (từ fieldSchemas)
              const schemaField = schemaFields[fieldName];
              if (schemaField) {
                console.log(`🔍 Found field ${fieldName} in schemas with label: "${schemaField.label}"`);
                
                // Tạo placeholder với thông tin từ schema
                mapping[placeholder] = {
                  ...schemaField,
                  group: groupKey,
                  subgroup: 'INFO'
                };
                
                // Debug log cho address fields
                if (placeholder.includes("Address")) {
                  console.log(`🏠 Creating address field from schema: ${placeholder}, type: ${mapping[placeholder].type}`);
                  if (mapping[placeholder].type !== "address-select") {
                    console.warn(`⚠️ Address field ${placeholder} has incorrect type: ${mapping[placeholder].type}. Fixing to address-select.`);
                    mapping[placeholder].type = "address-select";
                  }
                }
              }
              // Nếu không có trong schemaFields, kiểm tra baseConstants
              else {
                const baseField = basePlaceholders[fieldName];
                
                // Nếu có trong baseConstants.js
                if (baseField) {
                  // Tạo label tự động từ placeholder
                  let autoLabel = placeholder;
                  
                  // Loại bỏ số và ký tự đặc biệt ở cuối
                  autoLabel = autoLabel.replace(/[0-9_]+$/, '');
                  
                  // Thêm khoảng trắng giữa các từ (camelCase -> Camel Case)
                  autoLabel = autoLabel.replace(/([A-Z])/g, ' $1').trim();
                  
                  // Viết hoa chữ đầu tiên
                  autoLabel = autoLabel.charAt(0).toUpperCase() + autoLabel.slice(1);
                  
                  // Debug log cho address fields
                  if (placeholder.includes("Address")) {
                    console.log(`🏠 Creating address field: ${placeholder} from base ${fieldName}, type: ${baseField.type}`);
                    
                    // Đảm bảo tất cả address fields đều dùng address-select
                    if (baseField.type !== "address-select") {
                      console.warn(`⚠️ Address field ${placeholder} has incorrect type: ${baseField.type}. Fixing to address-select.`);
                      baseField.type = "address-select";
                    }
                  }
                  
                  mapping[placeholder] = {
                    ...baseField,
                    label: autoLabel, // Thêm label tự động
                    group: groupKey,
                    subgroup: 'INFO'
                  };
                  
                  console.log(`🏷️ Created auto label for ${placeholder}: "${autoLabel}"`);
                } 
                // Nếu không có trong baseConstants.js, tạo mới với type mặc định là text
                else {
                  // Tạo label tự động từ placeholder
                  let autoLabel = placeholder;
                  
                  // Loại bỏ số và ký tự đặc biệt ở cuối
                  autoLabel = autoLabel.replace(/[0-9_]+$/, '');
                  
                  // Thêm khoảng trắng giữa các từ (camelCase -> Camel Case)
                  autoLabel = autoLabel.replace(/([A-Z])/g, ' $1').trim();
                  
                  // Viết hoa chữ đầu tiên
                  autoLabel = autoLabel.charAt(0).toUpperCase() + autoLabel.slice(1);
                  
                  console.warn(`⚠️ Field ${placeholder} not found in baseConstants.js. Creating with default type "text"`);
                  mapping[placeholder] = {
                    type: "text",
                    label: autoLabel,
                    group: groupKey,
                    subgroup: 'INFO'
                  };
                  
                  console.log(`🏷️ Created auto label for ${placeholder}: "${autoLabel}"`);
                  
                  // Nếu là trường Address, đảm bảo type là address-select
                  if (placeholder.includes("Address")) {
                    mapping[placeholder].type = "address-select";
                    console.log(`🏠 Created new address field: ${placeholder} with type address-select`);
                  }
                }
              }
            }
          });
        });
      }
    });
  }
  
  // 3. Nếu config có customPlaceholders, ghi đè lên mapping
  if (config.customPlaceholders) {
    Object.keys(config.customPlaceholders).forEach(placeholder => {
      const customConfig = config.customPlaceholders[placeholder];
      
      if (mapping[placeholder]) {
        // Ghi đè lên mapping hiện có
        mapping[placeholder] = {
          ...mapping[placeholder],
          ...customConfig
        };
        console.log(`🔄 Overriding ${placeholder} with custom config`);
      } else {
        // Thêm mới nếu chưa có
        mapping[placeholder] = {
          type: "text", // Default type
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
  
  // Xử lý config.groups dạng array
  if (Array.isArray(config.groups)) {
    config.groups.forEach(group => {
      if (group.id && group.label) {
        labels[group.id] = group.label;
      }
    });
  } 
  // Xử lý config.groups dạng object (legacy)
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
  
  // ✅ Xử lý subgroups từ fieldMappings (hỗ trợ cả string và object {id, label})
  if (config.fieldMappings) {
    config.fieldMappings.forEach(mapping => {
      const { subgroups } = mapping;
      
      if (Array.isArray(subgroups)) {
        subgroups.forEach(subgroupDef => {
          // Hỗ trợ cả dạng string và object
          if (typeof subgroupDef === 'string') {
            // Dạng cũ: ["MEN1", "MEN2"]
            labels[subgroupDef] = subgroupDef === 'INFO' ? 'Thông tin' : subgroupDef;
          } else if (typeof subgroupDef === 'object' && subgroupDef.id && subgroupDef.label) {
            // ✅ Dạng mới: [{id: "MEN1", label: "Thông tin cá nhân"}, ...]
            labels[subgroupDef.id] = subgroupDef.label;
            console.log(`🏷️ Subgroup label from fieldMappings: ${subgroupDef.id} -> "${subgroupDef.label}"`);
          }
        });
      }
    });
  }
  
  // Override với custom subgroup labels nếu có
  if (config.subgroupLabels) {
    Object.keys(config.subgroupLabels).forEach(subgroupId => {
      labels[subgroupId] = config.subgroupLabels[subgroupId];
    });
  }
  
  return labels;
}

// Export
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