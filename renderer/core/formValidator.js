
function validateForm() {
  console.log('🔍 Validation: Starting form validation...');
  const currentTemplate = window.currentTemplate;
  if (!currentTemplate || !currentTemplate.config) {
    console.warn('⚠️ Validation: No template config found, skipping validation');
    return true; 
  }
  
  console.log('✅ Validation: Found currentTemplate:', {
    fileName: currentTemplate.fileName,
    hasConfig: !!currentTemplate.config,
    hasSelectedFile: !!currentTemplate.selectedFile
  });

  const config = currentTemplate.config;
  const { fieldMappings, fieldSchemas, groups } = config;
  
  if (!fieldMappings || !fieldSchemas) {
    console.warn('⚠️ Validation: Missing fieldMappings or fieldSchemas, skipping validation');
    return true;
  }

  const selectedFile = window.currentTemplate.selectedFile;
  if (!selectedFile || !selectedFile.groups) {
    console.warn('⚠️ Validation: No template file selected');
    return true;
  }
  
  console.log('✅ Validation: Template groups:', selectedFile.groups);
  const formData = window.collectGenericFormData ? window.collectGenericFormData() : {};
  console.log('✅ Validation: Collected form data:', Object.keys(formData).length, 'fields');
  const errors = validateFormData(formData, fieldMappings, fieldSchemas, selectedFile.groups);
  
  if (errors.length > 0) {
    console.error('❌ Validation: Found', errors.length, 'validation errors');
    displayValidationErrors(errors);
    return false;
  }

  console.log('✅ Validation: All fields valid!');
  return true;
}

/**
 * Validate form data against schema
 * @param {Object} formData - Collected form data
 * @param {Array} fieldMappings - Field mappings from config
 * @param {Object} fieldSchemas - Field schemas from config
 * @param {Array} templateGroups - Groups used in current template
 * @returns {Array} - Array of error objects
 */
function validateFormData(formData, fieldMappings, fieldSchemas, templateGroups) {
  const errors = [];
  const visibleSubgroups = window.visibleSubgroups || new Set();

  console.log('🔍 Validating form with visible subgroups:', Array.from(visibleSubgroups));
  
  // Get placeholders from phMapping (which contains all placeholders from Word file)
  const phMapping = window.__renderDataStructures?.phMapping || {};
  const allPlaceholders = new Set(Object.keys(phMapping));
  
  console.log('🔍 Getting placeholders from phMapping...');
  console.log('  Total placeholders from Word file:', allPlaceholders.size);
  console.log('  Template groups:', templateGroups);

  for (const mapping of fieldMappings) {
    if (!templateGroups.includes(mapping.group)) {
      continue;
    }

    const schema = fieldSchemas[mapping.schema];
    if (!schema || !schema.fields) {
      console.warn(`⚠️ Schema not found: ${mapping.schema}`);
      continue;
    }

    for (let i = 0; i < mapping.subgroups.length; i++) {
      const subgroup = mapping.subgroups[i];
      const subgroupId = typeof subgroup === 'string' ? subgroup : subgroup.id;
      const subgroupLabel = typeof subgroup === 'string' ? subgroup : subgroup.label;
      if (!visibleSubgroups.has(subgroupId)) {
        console.log(`⏭️ Skipping validation for hidden subgroup: ${subgroupId}`);
        continue;
      }

      const suffix = mapping.suffixes ? mapping.suffixes[i] : '';
      console.log(`✅ Validating visible subgroup: ${subgroupId} (suffix: ${suffix})`);

      for (const field of schema.fields) {
        if (field.hidden) continue;
        
        if (!field.required) continue;

        const fieldName = suffix ? `${field.name}${suffix}` : field.name;
        
        if (!allPlaceholders.has(fieldName)) {
          console.log(`⏭️ SKIP: ${fieldName} (field "${field.label}") not in template Word file`);
          continue;
        }
        
        console.log(`✅ Validating: ${fieldName} (${field.label}) - required: ${field.required}`);
        
        const fieldValue = formData[fieldName];
        const isEmpty = !fieldValue || (typeof fieldValue === 'string' && fieldValue.trim() === '') || 
                       (Array.isArray(fieldValue) && fieldValue.length === 0);
        
        if (isEmpty) {
          const groupInfo = mapping.group;
          errors.push({
            subgroup: subgroupId,
            subgroupLabel: subgroupLabel,
            group: groupInfo,
            field: fieldName,
            fieldLabel: field.label,
            message: `"${field.label}" là bắt buộc (${subgroupLabel || subgroupId})`
          });
          console.log(`❌ Validation error: ${fieldName} (${field.label}) is empty`);
        }
      }
    }
  }

  return errors;
}

/**
 * Display validation errors to user
 * @param {Array} errors - Array of error objects
 */
function displayValidationErrors(errors) {
  if (errors.length === 0) return;

  console.error('❌ Form validation errors:', errors);
  
  // Chỉ highlight và scroll, không hiển thị thông báo
  scrollToFirstError(errors);
}

/**
 * Scroll to the first error field
 * @param {Array} errors - Array of error objects
 */
function scrollToFirstError(errors) {
  if (errors.length === 0) return;

  // Highlight all error fields
  errors.forEach(error => {
    const fieldName = error.field;
    const inputElement = document.querySelector(`[data-ph="${fieldName}"]`);
    
    if (inputElement) {
      // Add error styling
      inputElement.style.borderColor = '#dc3545';
      inputElement.style.borderWidth = '2px';
      inputElement.style.backgroundColor = '#fff5f5';
      inputElement.classList.add('validation-error');
      
      // Remove error styling after user interacts
      const removeErrorStyle = () => {
        inputElement.style.borderColor = '';
        inputElement.style.borderWidth = '';
        inputElement.style.backgroundColor = '';
        inputElement.classList.remove('validation-error');
        inputElement.removeEventListener('input', removeErrorStyle);
        inputElement.removeEventListener('change', removeErrorStyle);
      };
      
      inputElement.addEventListener('input', removeErrorStyle);
      inputElement.addEventListener('change', removeErrorStyle);
    }
  });

  // Scroll to first error
  const firstError = errors[0];
  const fieldName = firstError.field;
  const inputElement = document.querySelector(`[data-ph="${fieldName}"]`);
  
  if (inputElement) {
    inputElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
    inputElement.focus();
  }
}

/**
 * Validate a single field (for real-time validation)
 * @param {string} fieldName - Field name/placeholder
 * @param {*} value - Field value
 * @returns {boolean} - true if valid
 */
function validateField(fieldName, value) {
  const currentTemplate = window.currentTemplate;
  if (!currentTemplate || !currentTemplate.config) return true;

  const { fieldMappings, fieldSchemas } = currentTemplate.config;
  
  for (const mapping of fieldMappings) {
    const schema = fieldSchemas[mapping.schema];
    if (!schema) continue;

    for (const field of schema.fields) {
      const suffixes = mapping.suffixes || [''];
      for (const suffix of suffixes) {
        const fullFieldName = suffix ? `${field.name}${suffix}` : field.name;
        
        if (fullFieldName === fieldName) {
          if (field.required && (!value || value.toString().trim() === '')) {
            return false;
          }
          return true;
        }
      }
    }
  }

  return true; 
}


if (typeof window !== 'undefined') {
  window.validateForm = validateForm;
  window.validateFormData = validateFormData;
  window.validateField = validateField;
}

// Export for Node.js (if needed)
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    validateForm,
    validateFormData,
    validateField
  };
}

