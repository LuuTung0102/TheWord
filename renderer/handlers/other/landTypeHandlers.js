function setupLandTypeSync() {
  const skipLandFields = window.stateManager.getRenderDataStructures()?.skipLandFields || new Set();
  const phMapping = window.stateManager.getRenderDataStructures()?.phMapping || {};
  const allLoaiDatDInputs = document.querySelectorAll('input[data-type="land_type_detail"]');
  allLoaiDatDInputs.forEach(loaiDatDInput => {
    const detailPh = loaiDatDInput.getAttribute('data-ph');
    const suffix = detailPh.replace('Loai_Dat_D', '');
    const sizePh = suffix ? `Loai_Dat_F${suffix}` : 'Loai_Dat_F';
    const basicPh = suffix ? `Loai_Dat${suffix}` : 'Loai_Dat';
    
    let loaiDatFInput = document.querySelector(`[data-ph="${sizePh}"]`);
    let loaiDatInput = document.querySelector(`[data-ph="${basicPh}"]`);
    
    if (!loaiDatFInput && skipLandFields.has(sizePh)) {
      loaiDatFInput = document.createElement('input');
      loaiDatFInput.type = 'hidden';
      loaiDatFInput.setAttribute('data-ph', sizePh);
      loaiDatFInput.setAttribute('data-type', 'land_type_size');
      loaiDatFInput.id = `hidden-${sizePh}`;
      document.body.appendChild(loaiDatFInput);
    }
    
    if (!loaiDatInput && skipLandFields.has(basicPh)) {
      loaiDatInput = document.createElement('input');
      loaiDatInput.type = 'hidden';
      loaiDatInput.setAttribute('data-ph', basicPh);
      loaiDatInput.setAttribute('data-type', 'land_type');
      loaiDatInput.id = `hidden-${basicPh}`;
      document.body.appendChild(loaiDatInput);
    }
    
    if (loaiDatFInput) {
      const syncDtoF = () => {
        const value = loaiDatDInput.value;
        if (!value) return;
        
        const entries = value.split(';').map(e => e.trim()).filter(Boolean);
        const converted = entries.map(entry => {
          const parts = entry.split('|');
          const code = parts[0] ? parts[0].trim() : '';
          const area = parts[2] ? parts[2].trim() : '';
          return code && area ? `${code} ${area}` : code;
        }).filter(Boolean);
        
        loaiDatFInput.value = converted.join('; ');
        loaiDatFInput.dispatchEvent(new Event('change', { bubbles: true }));
        loaiDatFInput.dispatchEvent(new Event('input', { bubbles: true }));
      };
      
      loaiDatDInput.addEventListener('input', syncDtoF);
      loaiDatDInput.addEventListener('change', syncDtoF);
    }
    
    if (loaiDatFInput && loaiDatInput) {
      const syncFtoBasic = () => {
        const value = loaiDatFInput.value;
        if (!value) return;
        
        const entries = value.split(';').map(e => e.trim()).filter(Boolean);
        const codes = entries.map(entry => {
          const match = entry.match(/^([A-Z]+)/);
          return match ? match[1] : '';
        }).filter(Boolean);
        
        loaiDatInput.value = codes.join('+');
        loaiDatInput.dispatchEvent(new Event('change', { bubbles: true }));
      };
      
      loaiDatFInput.addEventListener('input', syncFtoBasic);
      loaiDatFInput.addEventListener('change', syncFtoBasic);
    }
  });
}

function populateDynamicOptions(groupData, targetSuffix) {
  if (!groupData) {
    const loaiDatDPh = targetSuffix ? `Loai_Dat_D${targetSuffix}` : 'Loai_Dat_D';
    const loaiDatFPh = targetSuffix ? `Loai_Dat_F${targetSuffix}` : 'Loai_Dat_F';
    const loaiDatDInput = document.querySelector(`[data-ph="${loaiDatDPh}"]`);
    const loaiDatFInput = document.querySelector(`[data-ph="${loaiDatFPh}"]`);
    
    groupData = {};
    if (loaiDatDInput && loaiDatDInput.value) {
      groupData[loaiDatDPh] = loaiDatDInput.value;
    } else if (loaiDatFInput && loaiDatFInput.value) {
      groupData[loaiDatFPh] = loaiDatFInput.value;
    }
    
    if (Object.keys(groupData).length === 0) {
      return;
    }
  }
  
  const areas = [];
  const detailField = Object.keys(groupData).find(key => {
    const input = document.querySelector(`[data-ph="${key}"]`);
    return input && input.getAttribute('data-type') === 'land_type_detail';
  });
  
  if (detailField && groupData[detailField]) {
    const entries = groupData[detailField].split(';').map(e => e.trim()).filter(Boolean);
    entries.forEach(entry => {
      const parts = entry.split('|');
      if (parts[2] && parts[2].trim()) {
        const area = parts[2].trim();
        if (!areas.includes(area)) {
          areas.push(area);
        }
      }
    });
  }
  
  const sizeField = Object.keys(groupData).find(key => {
    const input = document.querySelector(`[data-ph="${key}"]`);
    return input && input.getAttribute('data-type') === 'land_type_size';
  });
  
  if (areas.length === 0 && sizeField && groupData[sizeField]) {
    const entries = groupData[sizeField].split(';').map(e => e.trim()).filter(Boolean);
    entries.forEach(entry => {
      let match = entry.match(/^[A-Z]+\s+(\d+(?:\.\d+)?)/i);
      if (match) {
        const area = match[1];
        if (!areas.includes(area)) {
          areas.push(area);
        }
        return;
      }
      match = entry.match(/^(\d+(?:\.\d+)?)\s*m2?\s+[A-Z]+/i);
      if (match) {
        const area = match[1];
        if (!areas.includes(area)) {
          areas.push(area);
        }
      }
    });
  }
  
  if (areas.length === 0) {
    return;
  }
  
  const svPlaceholder = targetSuffix ? `SV${targetSuffix}` : 'SV';
  const svSelect = document.querySelector(`select[data-ph="${svPlaceholder}"]`);
  const svInput = document.querySelector(`input[data-ph="${svPlaceholder}"]`);
  
  if (svSelect && svSelect.classList.contains('dynamic-options-field')) {
    const currentValue = svSelect.value;
    svSelect.innerHTML = '<option value="">-- Chọn --</option>';
    areas.forEach(area => {
      const option = document.createElement('option');
      option.value = area;
      option.textContent = `${area}m²`;
      if (area === currentValue) {
        option.selected = true;
      }
      svSelect.appendChild(option);
    });
    
  }
  
  if (svInput && svInput.classList.contains('editable-select-input')) {
    svInput.setAttribute('data-options', JSON.stringify(areas));
    
    const dropdown = document.getElementById(`dropdown-${svInput.id}`);
    if (dropdown && dropdown.style.display === 'block') {
      renderDropdownOptions(dropdown, areas, svInput.value);
    }
  }
}

function fillLandTypeFields(groupData, targetSuffix) {
  if (!groupData || Object.keys(groupData).length === 0) {
    return;
  }
  
  Object.keys(groupData).forEach(fieldName => {
    const value = groupData[fieldName];
    if (!value || typeof value !== 'string') return;
    const placeholder = targetSuffix ? `${fieldName}${targetSuffix}` : fieldName;
    const targetInput = document.querySelector(`[data-ph="${placeholder}"]`);
    if (!targetInput) return;
    const fieldType = targetInput.getAttribute('data-type');
    if (fieldType === 'land_type') {
      setTimeout(() => {
        const freshInput = document.querySelector(`[data-ph="${placeholder}"]`);
        if (freshInput) {
          freshInput.value = value;
          freshInput.setAttribute('value', value);
          freshInput.dispatchEvent(new Event('input', { bubbles: true }));
          freshInput.dispatchEvent(new Event('change', { bubbles: true }));
        }
      }, 100);
    } else if (fieldType === 'land_type_detail') {
      fillLandTypeDetailField(placeholder, value);
    } else if (fieldType === 'land_type_size') {
      fillLandTypeSizeField(placeholder, value);
    }
  });
}

function convertLoaiDatDtoF(loaiDatD) {
  const entries = loaiDatD.split(';').map(e => e.trim()).filter(Boolean);
  return entries.map(entry => {
    const parts = entry.split('|');
    const code = parts[0] ? parts[0].trim() : '';
    const area = parts[2] ? parts[2].trim() : '';
    return area ? `${code} ${area}` : code;
  }).filter(Boolean).join('; ');
}

function convertLoaiDatDtoBasic(loaiDatD) {
  const entries = loaiDatD.split(';').map(e => e.trim()).filter(Boolean);
  const codes = entries.map(entry => {
    const parts = entry.split('|');
    return parts[0] ? parts[0].trim() : '';
  }).filter(Boolean);
  return codes.join('+');
}

function convertLoaiDatFtoD(loaiDatF) {
  const entries = loaiDatF.split(';').map(e => e.trim()).filter(Boolean);
  return entries.map(entry => {
    const match = entry.match(/^([A-Z]+)\s+(\d+(?:\.\d+)?)/i);
    if (match) {
      return `${match[1]}||${match[2]}`;
    }
    const codeMatch = entry.match(/^([A-Z]+)$/i);
    if (codeMatch) {
      return `${codeMatch[1]}||`;
    }
    return `${entry}||`;
  }).join(';');
}

function convertLoaiDatFtoBasic(loaiDatF) {
  const entries = loaiDatF.split(';').map(e => e.trim()).filter(Boolean);
  const codes = entries.map(entry => {
    const match = entry.match(/^([A-Z]+)/i);
    return match ? match[1] : '';
  }).filter(Boolean);
  return codes.join('+');
}

function convertLoaiDatBasicToD(loaiDat) {
  const codes = loaiDat.split('+').map(c => c.trim()).filter(Boolean);
  return codes.map(code => `${code}||`).join(';');
}

function convertLoaiDatBasicToF(loaiDat) {
  const codes = loaiDat.split('+').map(c => c.trim()).filter(Boolean);
  return codes.join('; ');
}

function fillLandTypeDetailField(placeholder, valueString) {
  if (!valueString || !valueString.trim()) return;
  const hiddenInput = document.querySelector(`input[data-ph="${placeholder}"]`);
  if (!hiddenInput) {
    return;
  }
  
  const container = document.querySelector(`.land-type-size-container[data-ph="${placeholder}"]`);
  if (!container) {
    return;
  }
  const isSetup = container.dataset.landTypeDetailSetup === 'true';
  
  if (!isSetup) {
    hiddenInput.value = valueString;
    
    if (window.setupLandTypeDetailInput && typeof window.setupLandTypeDetailInput === 'function') {
      const containerId = hiddenInput.id;
      if (containerId) {
        window.setupLandTypeDetailInput(container, containerId);
        container.dataset.landTypeDetailSetup = 'true';
      }
    }
  } else {
    hiddenInput.value = valueString;
    if (container.reloadLandTypeDetailValue && typeof container.reloadLandTypeDetailValue === 'function') {
      container.reloadLandTypeDetailValue();
    } else {
      hiddenInput.dispatchEvent(new Event('change', { bubbles: true }));
      hiddenInput.dispatchEvent(new Event('input', { bubbles: true }));
    }
  }
}

function fillLandTypeSizeField(placeholder, valueString) {
  if (!valueString || !valueString.trim()) return;
  
  const container = document.querySelector(`.land-type-size-container[data-ph="${placeholder}"]`);
  if (!container) {
    return;
  }
  
  const input = container.querySelector('.tag-input');
  if (!input) {
    return;
  }
  
  const pairs = valueString.split(';').map(p => p.trim()).filter(Boolean);
  const convertedPairs = [];
  
  pairs.forEach(pair => {

    const match = pair.match(/^(\d+(?:\.\d+)?)\s*m2?\s*([A-Z]+)$/i);
    if (match) {
      const area = match[1];
      const code = match[2].toUpperCase();
      convertedPairs.push(`${code} ${area}`);
    } else {
      const match2 = pair.match(/^([A-Z]+)\s+(\d+(?:\.\d+)?)\s*m2?$/i);
      if (match2) {
        const code = match2[1].toUpperCase();
        const area = match2[2];
        convertedPairs.push(`${code} ${area}`);
      } else {
        const codeMatch = pair.match(/^([A-Z]+)$/i);
        if (codeMatch) {
          const code = codeMatch[1].toUpperCase();
          convertedPairs.push(code);
        } else {
          convertedPairs.push(pair);
        }
      }
    }
  });
  
  if (convertedPairs.length === 0) {
    return;
  }
  
 
  const convertedValue = convertedPairs.join('; ');

  if (!container.dataset.landTypeSizeSetup && window.setupLandTypeSizeInput) {
    const inputId = input.id;
    if (inputId) {
      input.value = convertedValue;
      window.setupLandTypeSizeInput(container, inputId);
      container.dataset.landTypeSizeSetup = 'true';
      return;
    }
  }
  
  input.value = convertedValue;
  
  if (container.reloadLandTypeSizeValue && typeof container.reloadLandTypeSizeValue === 'function') {
    container.reloadLandTypeSizeValue();
  } else {
    setTimeout(() => {
      if (container.reloadLandTypeSizeValue && typeof container.reloadLandTypeSizeValue === 'function') {
        container.reloadLandTypeSizeValue();
      } else {
        input.dispatchEvent(new Event('input', { bubbles: true }));
        input.dispatchEvent(new Event('change', { bubbles: true }));
      }
    }, 200);
  }
}

function generateLandTypeFormatsForSuffix(data, suffix) {
  const loaiDatKey = suffix ? `Loai_Dat${suffix}` : 'Loai_Dat';
  const loaiDatFKey = suffix ? `Loai_Dat_F${suffix}` : 'Loai_Dat_F';
  const loaiDatDKey = suffix ? `Loai_Dat_D${suffix}` : 'Loai_Dat_D';
  
  const hasLoaiDat = data.hasOwnProperty(loaiDatKey);
  const hasLoaiDatF = data.hasOwnProperty(loaiDatFKey);
  const hasLoaiDatD = data.hasOwnProperty(loaiDatDKey);
  
  if (!hasLoaiDat && !hasLoaiDatF && !hasLoaiDatD) {
    return;
  }
  
  const loaiDat = data[loaiDatKey];
  const loaiDatF = data[loaiDatFKey];
  const loaiDatD = data[loaiDatDKey];
  
  const hasDetailInD = loaiDatD && loaiDatD.includes('|') && loaiDatD.split(';').some(e => {
    const parts = e.split('|');
    return (parts[1] && parts[1].trim()) || (parts[2] && parts[2].trim());
  });
  
  const hasDetailInF = loaiDatF && loaiDatF.match(/\d+(?:\.\d+)?/);
  let sourceValue = null;
  let sourceType = null;
  
  if (hasDetailInD) {
    sourceValue = loaiDatD;
    sourceType = 'D';
  } else if (hasDetailInF) {
    sourceValue = loaiDatF;
    sourceType = 'F';
  } else if (loaiDatD && loaiDatD.trim()) {
    sourceValue = loaiDatD;
    sourceType = 'D';
  } else if (loaiDatF && loaiDatF.trim()) {
    sourceValue = loaiDatF;
    sourceType = 'F';
  } else if (loaiDat && loaiDat.trim()) {
    sourceValue = loaiDat;
    sourceType = 'basic';
  }
  
  if (!sourceValue) return;
  
  if (!loaiDat || !loaiDat.trim()) {
    if (sourceType === 'D') {
      data[loaiDatKey] = convertLoaiDatDtoBasic(sourceValue);
    } else if (sourceType === 'F') {
      data[loaiDatKey] = convertLoaiDatFtoBasic(sourceValue);
    }
  }
  
  if (!loaiDatF || !loaiDatF.trim()) {
    if (sourceType === 'D') {
      data[loaiDatFKey] = convertLoaiDatDtoF(sourceValue);
    } else if (sourceType === 'basic') {
      data[loaiDatFKey] = convertLoaiDatBasicToF(sourceValue);
    }
  }
  
  if (!loaiDatD || !loaiDatD.trim()) {
    if (sourceType === 'F') {
      data[loaiDatDKey] = convertLoaiDatFtoD(sourceValue);
    } else if (sourceType === 'basic') {
      data[loaiDatDKey] = convertLoaiDatBasicToD(sourceValue);
    }
  }
}

function generateAllLandTypeFormats(data) {
  const suffixes = new Set(['']); 
  Object.keys(data).forEach(key => {
    const match = key.match(/^Loai_Dat(_[FD])?(\d+)$/);
    if (match && match[2]) {
      suffixes.add(match[2]);
    }
  });
  suffixes.forEach(suffix => {
    generateLandTypeFormatsForSuffix(data, suffix);
  });
}

window.LandTypeHandlers = {
  setupLandTypeSync,
  populateDynamicOptions,
  fillLandTypeFields,
  fillLandTypeDetailField,
  fillLandTypeSizeField,
  generateAllLandTypeFormats,
  convertLoaiDatDtoF,
  convertLoaiDatDtoBasic,
  convertLoaiDatFtoD,
  convertLoaiDatFtoBasic,
  convertLoaiDatBasicToD,
  convertLoaiDatBasicToF,
};