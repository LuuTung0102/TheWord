
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

function validateFormData(formData, fieldMappings, fieldSchemas, templateGroups) {
  const errors = [];
  const visibleSubgroups = window.visibleSubgroups || new Set();
  const phMapping = window.stateManager.getRenderDataStructures()?.phMapping || {};
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
          errors.push({
            subgroupLabel: subgroupLabel || subgroupId,
            field: fieldName,
            fieldLabel: field.label
          });
        } else if (field.type === 'number' && field.name === 'CCCD' && fieldValue) {
          const cccdValue = window.REGEX_HELPERS.removeNonDigits(fieldValue.toString().trim());
          if (!window.REGEX.CCCD_PATTERN.test(cccdValue)) {
            errors.push({
              subgroupLabel: subgroupLabel || subgroupId,
              field: fieldName,
              fieldLabel: field.label
            });
          }
        }
      }
    }
  }

  return errors;
}

function displayValidationErrors(errors) {
  if (errors.length === 0) return;
  highlightErrorFields(errors);
  showValidationNotification(errors);
  scrollToFirstError(errors);
}

function highlightErrorFields(errors) {
  document.querySelectorAll('.validation-error').forEach(el => {
    el.style.borderColor = '';
    el.style.borderWidth = '';
    el.style.backgroundColor = '';
    el.classList.remove('validation-error');
  });
  
  errors.forEach(error => {
    const fieldName = error.field;
    let inputElement = document.querySelector(`[data-ph="${fieldName}"]`);
  
    if (!inputElement && fieldName.includes('Address')) {
      const allAddressGroups = document.querySelectorAll('.address-group');
      allAddressGroups.forEach(group => {
        const provinceSelect = group.querySelector('select[data-level="province"]');
        if (provinceSelect && provinceSelect.id && provinceSelect.id.includes(fieldName)) {
          highlightAddressGroup(group);
        }
      });
      return;
    }
    
    if (inputElement) {
      highlightElement(inputElement);
    }
  });
}

function highlightElement(element) {
  element.style.borderColor = '#dc3545';
  element.style.borderWidth = '2px';
  element.style.backgroundColor = '#fff5f5';
  element.classList.add('validation-error');
  
  const removeErrorStyle = () => {
    element.style.borderColor = '';
    element.style.borderWidth = '';
    element.style.backgroundColor = '';
    element.classList.remove('validation-error');
    element.removeEventListener('input', removeErrorStyle);
    element.removeEventListener('change', removeErrorStyle);
  };
  
  element.addEventListener('input', removeErrorStyle, { once: true });
  element.addEventListener('change', removeErrorStyle, { once: true });
}

function highlightAddressGroup(addressGroup) {
  const selects = addressGroup.querySelectorAll('select.address-select');
  selects.forEach(select => {
    select.style.borderColor = '#dc3545';
    select.style.borderWidth = '2px';
    select.style.backgroundColor = '#fff5f5';
    select.classList.add('validation-error');
  });
  
  const removeErrorStyle = () => {
    selects.forEach(s => {
      s.style.borderColor = '';
      s.style.borderWidth = '';
      s.style.backgroundColor = '';
      s.classList.remove('validation-error');
      s.removeEventListener('change', removeErrorStyle);
    });
  };
  
  selects.forEach(select => {
    select.addEventListener('change', removeErrorStyle, { once: true });
  });
}

function showValidationNotification(errors) {
  if (!window.showError) {
    alert(`Vui lòng điền đầy đủ thông tin:\n\n${errors.map(e => `• ${e.message}`).join('\n')}`);
    return;
  }
  
  const errorsBySubgroup = {};
  errors.forEach(error => {
    const key = error.subgroupLabel || error.subgroup;
    if (!errorsBySubgroup[key]) {
      errorsBySubgroup[key] = [];
    }
    errorsBySubgroup[key].push(error);
  });
  
  let message = '';
  
  Object.keys(errorsBySubgroup).forEach((subgroup, index) => {
    const subgroupErrors = errorsBySubgroup[subgroup];
    message += `${subgroup}:\n`;
    subgroupErrors.forEach(error => {
      message += `• ${error.fieldLabel}\n`;
    });
    if (index < Object.keys(errorsBySubgroup).length - 1) {
      message += `\n`;
    }
  });
  
  window.showError(message, 5000); 
}
function scrollToFirstError(errors) {
  if (errors.length === 0) return;
  const firstError = errors[0];
  const fieldName = firstError.field;
  let inputElement = document.querySelector(`[data-ph="${fieldName}"]`);
  
  if (!inputElement && fieldName.includes('Address')) {
    const allAddressGroups = document.querySelectorAll('.address-group');
    for (const group of allAddressGroups) {
      const provinceSelect = group.querySelector('select[data-level="province"]');
      if (provinceSelect && provinceSelect.id && provinceSelect.id.includes(fieldName)) {
        inputElement = provinceSelect;
        break;
      }
    }
  }
  
  if (inputElement) {
    const section = inputElement.closest('.form-section');
    if (section) {
      const sectionId = section.id;
      const groupKey = sectionId.replace('section-', '');
      switchToTab(groupKey);
    }
    
    setTimeout(() => {
      inputElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
      setTimeout(() => {
        inputElement.focus();
      }, 300);
    }, 100);
  }
}

function switchToTab(groupKey) {
  document.querySelectorAll('.taskbar-btn').forEach(btn => {
    btn.classList.remove('active');
  });
  
  const targetBtn = document.querySelector(`.taskbar-btn[data-section="${groupKey}"]`);
  if (targetBtn) {
    targetBtn.classList.add('active');
  }
  
  document.querySelectorAll('.form-section').forEach(section => {
    section.classList.remove('active');
  });
  
  const targetSection = document.getElementById(`section-${groupKey}`);
  if (targetSection) {
    targetSection.classList.add('active');
  }
}

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

