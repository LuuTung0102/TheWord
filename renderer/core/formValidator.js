/**
 * Form Validation System
 * Validates form data based on visible subgroups only
 * 
 * ✅ Only validates subgroups with visible = true
 * ✅ Respects required fields from schema
 * ✅ Shows user-friendly error messages
 * 
 * PROBLEM (Before v4.0):
 * - All MEN (MEN1, MEN2, MEN3...) were required to fill
 * - Even if user didn't enable MEN2, MEN3 on UI
 * - Caused frustration when only 1 heir needed
 * 
 * SOLUTION (v4.0):
 * - Only validate subgroups that are VISIBLE (visible = true)
 * - Hidden subgroups are skipped in validation
 * - When user adds person → visible: true → validate
 * - When user removes person → visible: false → skip validation
 * 
 * USAGE:
 * 1. User clicks "Tạo văn bản" (Export button)
 * 2. exportHandler.js calls validateForm()
 * 3. validateForm() checks window.visibleSubgroups
 * 4. Only validates fields in visible subgroups
 * 5. If errors → show alert + highlight fields + scroll to first error
 * 6. If valid → proceed to export
 * 
 * EXAMPLE:
 * User has only 1 heir:
 *   → Only MEN1 visible
 *   → Only validate MEN1 fields
 *   → MEN2, MEN3... are hidden → NOT validated ✅
 * 
 * User adds 2nd heir:
 *   → Click "Thêm người" → MEN2 becomes visible
 *   → Now validate both MEN1 AND MEN2 ✅
 */

/**
 * Validate form data based on current template config and visible subgroups
 * @returns {boolean} - true if valid, false if errors
 */
function validateForm() {
  console.log('🔍 Validation: Starting form validation...');
  
  // Get current template config
  const currentTemplate = window.currentTemplate;
  if (!currentTemplate || !currentTemplate.config) {
    console.warn('⚠️ Validation: No template config found, skipping validation');
    return true; // Allow export if no config
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

  // Get currently selected template groups
  const selectedFile = window.currentTemplate.selectedFile;
  if (!selectedFile || !selectedFile.groups) {
    console.warn('⚠️ Validation: No template file selected');
    return true;
  }
  
  console.log('✅ Validation: Template groups:', selectedFile.groups);

  // Collect form data
  const formData = window.collectGenericFormData ? window.collectGenericFormData() : {};
  console.log('✅ Validation: Collected form data:', Object.keys(formData).length, 'fields');
  
  // Validate
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
  
  // ✅ Get actual placeholders from current template
  const actualPlaceholders = window.currentTemplate?.selectedFile?.placeholders || {};
  const allPlaceholders = new Set();
  
  console.log('🔍 Layer 3: Getting placeholders from template...');
  console.log('  actualPlaceholders object:', actualPlaceholders);
  console.log('  templateGroups:', templateGroups);
  
  // Collect all placeholders from all groups in template
  templateGroups.forEach(groupKey => {
    if (actualPlaceholders[groupKey]) {
      console.log(`  Group ${groupKey} has ${actualPlaceholders[groupKey].length} placeholders:`, actualPlaceholders[groupKey]);
      actualPlaceholders[groupKey].forEach(ph => allPlaceholders.add(ph));
    } else {
      console.warn(`  ⚠️ Group ${groupKey} has NO placeholders in template!`);
    }
  });
  
  console.log('✅ Layer 3: Template has', allPlaceholders.size, 'actual placeholders:', Array.from(allPlaceholders));

  for (const mapping of fieldMappings) {
    // Skip if this group is not in current template
    if (!templateGroups.includes(mapping.group)) {
      continue;
    }

    const schema = fieldSchemas[mapping.schema];
    if (!schema || !schema.fields) {
      console.warn(`⚠️ Schema not found: ${mapping.schema}`);
      continue;
    }

    // Validate each subgroup
    for (let i = 0; i < mapping.subgroups.length; i++) {
      const subgroup = mapping.subgroups[i];
      const subgroupId = typeof subgroup === 'string' ? subgroup : subgroup.id;
      const subgroupLabel = typeof subgroup === 'string' ? subgroup : subgroup.label;
      
      // ⚠️ CRITICAL: Skip if subgroup is not visible
      if (!visibleSubgroups.has(subgroupId)) {
        console.log(`⏭️ Skipping validation for hidden subgroup: ${subgroupId}`);
        continue;
      }

      const suffix = mapping.suffixes ? mapping.suffixes[i] : '';
      
      console.log(`✅ Validating visible subgroup: ${subgroupId} (suffix: ${suffix})`);

      // Validate required fields in this subgroup
      for (const field of schema.fields) {
        // Skip validation for hidden fields
        if (field.hidden) continue;
        
        // Skip validation for non-required fields
        if (!field.required) continue;

        const fieldName = suffix ? `${field.name}${suffix}` : field.name;
        
        // ✅ CRITICAL: Layer 3 - Only validate if placeholder exists in template
        if (!allPlaceholders.has(fieldName)) {
          console.log(`⏭️ Layer 3 SKIP: ${fieldName} (field "${field.label}") not in template placeholders`);
          continue;
        }
        
        console.log(`✅ Layer 3 PASS: ${fieldName} exists in template → will validate`);
        
        const fieldValue = formData[fieldName];
        
        // Check if field is empty
        if (!fieldValue || fieldValue.toString().trim() === '') {
          const groupInfo = mapping.group;
          errors.push({
            subgroup: subgroupId,
            subgroupLabel: subgroupLabel,
            group: groupInfo,
            field: fieldName,
            fieldLabel: field.label,
            message: `"${field.label}" là bắt buộc (${subgroupLabel || subgroupId})`
          });
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

  // Group errors by subgroup for better UX
  const errorsBySubgroup = {};
  errors.forEach(error => {
    if (!errorsBySubgroup[error.subgroupLabel]) {
      errorsBySubgroup[error.subgroupLabel] = [];
    }
    errorsBySubgroup[error.subgroupLabel].push(error.fieldLabel);
  });

  // Build error message
  let message = '❌ Vui lòng điền đầy đủ thông tin bắt buộc:\n\n';
  
  Object.keys(errorsBySubgroup).forEach(subgroupLabel => {
    const fields = errorsBySubgroup[subgroupLabel];
    message += `📝 ${subgroupLabel}:\n`;
    fields.forEach(fieldLabel => {
      message += `   • ${fieldLabel}\n`;
    });
    message += '\n';
  });

  // Show error modal or alert
  if (typeof window.showError === 'function') {
    window.showError(message);
  } else {
    alert(message);
  }

  // Optionally scroll to first error
  scrollToFirstError(errors);
}

/**
 * Scroll to the first error field
 * @param {Array} errors - Array of error objects
 */
function scrollToFirstError(errors) {
  if (errors.length === 0) return;

  const firstError = errors[0];
  const fieldName = firstError.field;
  
  // Try to find the input element
  const inputElement = document.querySelector(`[data-ph="${fieldName}"]`);
  
  if (inputElement) {
    inputElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
    inputElement.focus();
    
    // Add error highlight
    inputElement.classList.add('validation-error');
    setTimeout(() => {
      inputElement.classList.remove('validation-error');
    }, 3000);
  }
}

/**
 * Validate a single field (for real-time validation)
 * @param {string} fieldName - Field name/placeholder
 * @param {*} value - Field value
 * @returns {boolean} - true if valid
 */
function validateField(fieldName, value) {
  // Get field schema
  const currentTemplate = window.currentTemplate;
  if (!currentTemplate || !currentTemplate.config) return true;

  const { fieldMappings, fieldSchemas } = currentTemplate.config;
  
  // Find field in schema
  for (const mapping of fieldMappings) {
    const schema = fieldSchemas[mapping.schema];
    if (!schema) continue;

    for (const field of schema.fields) {
      // Check if this field matches
      const suffixes = mapping.suffixes || [''];
      for (const suffix of suffixes) {
        const fullFieldName = suffix ? `${field.name}${suffix}` : field.name;
        
        if (fullFieldName === fieldName) {
          // Found the field, validate it
          if (field.required && (!value || value.toString().trim() === '')) {
            return false;
          }
          return true;
        }
      }
    }
  }

  return true; // Field not found in schema, assume valid
}

// Export to window
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

