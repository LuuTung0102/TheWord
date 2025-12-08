
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
  const htsdErrors = validateHTSDFields(formData);
  errors.push(...htsdErrors);
  
  if (errors.length > 0) {
    displayValidationErrors(errors);
    return false;
  }
  return true;
}

function validateHTSDFields(formData) {
  const errors = [];
  Object.keys(formData).forEach(key => {
    if ((key === 'HTSD' || key.match(/^HTSD\d*$/))) {
      if (typeof formData[key] === 'object' && formData[key] !== null) {
        const htsdData = formData[key];
        if (htsdData.printMode === 'both') {
          errors.push({
            subgroupLabel: 'Thông tin thửa đất',
            field: key,
            fieldLabel: 'Hình thức sử dụng',
            customMessage: 'Không thể chọn cả Loại 1 và Loại 2 cùng lúc. Vui lòng tắt một trong hai nút.'
          });
        }
        if (!htsdData.printMode || htsdData.printMode === null) {
          errors.push({
            subgroupLabel: 'Thông tin thửa đất',
            field: key,
            fieldLabel: 'Hình thức sử dụng',
            customMessage: 'Vui lòng chọn Loại 1 hoặc Loại 2 để xuất dữ liệu.'
          });
        }
      }
    }
  });
  
  return errors;
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
    if (fieldName === 'HTSD' || fieldName.match(/^HTSD\d*$/)) {
      const htsdContainer = document.querySelector(`[data-field-name="${fieldName}"]`);
      if (htsdContainer) {
        highlightHTSDField(htsdContainer);
      }
      return;
    }
    
    let inputElement = document.querySelector(`[data-ph="${fieldName}"]`);
  
    if (!inputElement && fieldName.includes('Address')) {
      const allAddressGroups = document.querySelectorAll('.address-group');
      allAddressGroups.forEach(group => {
        const provinceInput = group.querySelector('input[data-level="province"]');
        if (provinceInput && provinceInput.id && provinceInput.id.includes(fieldName)) {
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
    element.removeEventListener('click', removeErrorStyle);
  };
  element.addEventListener('input', removeErrorStyle, { once: true });
  element.addEventListener('change', removeErrorStyle, { once: true });
  element.addEventListener('click', removeErrorStyle, { once: true });
}

function highlightHTSDField(htsdContainer) {
  const toggleButtons = htsdContainer.querySelectorAll('.htsd-toggle-btn');
  
  toggleButtons.forEach(btn => {
    highlightElement(btn);
  });
}

function highlightAddressGroup(addressGroup) {
  const inputs = addressGroup.querySelectorAll('input.editable-select-input');
  inputs.forEach(input => {
    highlightElement(input);
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
      if (error.customMessage) {
        message += `• ${error.customMessage}\n`;
      } else {
        message += `• ${error.fieldLabel}\n`;
      }
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
  
  if (fieldName === 'HTSD' || fieldName.match(/^HTSD\d*$/)) {
    const htsdContainer = document.querySelector(`[data-field-name="${fieldName}"]`);
    if (htsdContainer) {
      const section = htsdContainer.closest('.form-section');
      if (section) {
        const sectionId = section.id;
        const groupKey = sectionId.replace('section-', '');
        switchToTab(groupKey);
      }
      
      setTimeout(() => {
        htsdContainer.scrollIntoView({ behavior: 'smooth', block: 'center' });
        setTimeout(() => {
          const firstToggle = htsdContainer.querySelector('.htsd-toggle-btn');
          if (firstToggle) firstToggle.focus();
        }, 300);
      }, 100);
    }
    return;
  }
  
  let inputElement = document.querySelector(`[data-ph="${fieldName}"]`);
  
  if (!inputElement && fieldName.includes('Address')) {
    const allAddressGroups = document.querySelectorAll('.address-group');
    for (const group of allAddressGroups) {
      const provinceInput = group.querySelector('input[data-level="province"]');
      if (provinceInput && provinceInput.id && provinceInput.id.includes(fieldName)) {
        inputElement = provinceInput;
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

