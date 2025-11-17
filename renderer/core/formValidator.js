
function validateForm() {
  const currentTemplate = window.currentTemplate;
  if (!currentTemplate || !currentTemplate.config) {
    return true; 
  }

  const config = currentTemplate.config;
  const { fieldMappings, fieldSchemas, groups } = config;
  
  if (!fieldMappings || !fieldSchemas) {
    return true;
  }

  const selectedFile = window.currentTemplate.selectedFile;
  if (!selectedFile || !selectedFile.groups) {
    return true;
  }
  

  const formData = window.collectGenericFormData ? window.collectGenericFormData() : {};
  const errors = validateFormData(formData, fieldMappings, fieldSchemas, selectedFile.groups);
  
  if (errors.length > 0) {
    displayValidationErrors(errors);
    return false;
  }
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
  const phMapping = window.__renderDataStructures?.phMapping || {};
  const allPlaceholders = new Set(Object.keys(phMapping));

  for (const mapping of fieldMappings) {
    if (!templateGroups.includes(mapping.group)) {
      continue;
    }

    const schema = fieldSchemas[mapping.schema];
    if (!schema || !schema.fields) {
      continue;
    }

    for (let i = 0; i < mapping.subgroups.length; i++) {
      const subgroup = mapping.subgroups[i];
      const subgroupId = typeof subgroup === 'string' ? subgroup : subgroup.id;
      const subgroupLabel = typeof subgroup === 'string' ? subgroup : subgroup.label;
      if (!visibleSubgroups.has(subgroupId)) {
        continue;
      }

      const suffix = mapping.suffixes ? mapping.suffixes[i] : '';

      for (const field of schema.fields) {
        if (field.hidden) continue;
        
        if (!field.required) continue;

        const fieldName = suffix ? `${field.name}${suffix}` : field.name;
        
        if (!allPlaceholders.has(fieldName)) {
          continue;
        }
        
        
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
        } else if (field.type === 'number' && field.name === 'CCCD' && fieldValue) {
          const cccdValue = fieldValue.toString().trim().replace(/\D/g, '');
          if (!/^\d{9}$|^\d{12}$/.test(cccdValue)) {
            errors.push({
              subgroup: subgroupId,
              subgroupLabel: subgroupLabel,
              group: mapping.group,
              field: fieldName,
              fieldLabel: field.label,
              message: `"${field.label}" phải là 9 hoặc 12 số (${subgroupLabel || subgroupId})`
            });
          }
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
  scrollToFirstError(errors);
}

/**
 * Scroll to the first error field
 * @param {Array} errors - Array of error objects
 */
function scrollToFirstError(errors) {
  if (errors.length === 0) return;

  errors.forEach(error => {
    const fieldName = error.field;
    const inputElement = document.querySelector(`[data-ph="${fieldName}"]`);
    
    if (inputElement) {
      inputElement.style.borderColor = '#dc3545';
      inputElement.style.borderWidth = '2px';
      inputElement.style.backgroundColor = '#fff5f5';
      inputElement.classList.add('validation-error');
      
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

if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    validateForm,
    validateFormData,
    validateField
  };
}

