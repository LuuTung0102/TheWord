function setupLandTypeSync() {
  const loaiDatDInput = document.querySelector('input[data-ph="Loai_Dat_D"]');
  let loaiDatFInput = document.querySelector('input[data-ph="Loai_Dat_F"]');
  let loaiDatInput = document.querySelector('input[data-ph="Loai_Dat"]');
  
  const skipLandFields = window.stateManager.getRenderDataStructures()?.skipLandFields || new Set();
  
  if (loaiDatDInput && !loaiDatFInput && skipLandFields.has('Loai_Dat_F')) {
    loaiDatFInput = document.createElement('input');
    loaiDatFInput.type = 'hidden';
    loaiDatFInput.setAttribute('data-ph', 'Loai_Dat_F');
    loaiDatFInput.id = 'hidden-Loai_Dat_F';
    document.body.appendChild(loaiDatFInput);
  }
  
  if ((loaiDatDInput || loaiDatFInput) && !loaiDatInput && skipLandFields.has('Loai_Dat')) {
    loaiDatInput = document.createElement('input');
    loaiDatInput.type = 'hidden';
    loaiDatInput.setAttribute('data-ph', 'Loai_Dat');
    loaiDatInput.id = 'hidden-Loai_Dat';
    document.body.appendChild(loaiDatInput);
  }
  
  if (loaiDatDInput && loaiDatFInput) {
    const syncDtoF = () => {
      const value = loaiDatDInput.value;
      if (!value) {
        loaiDatFInput.value = '';
        loaiDatFInput.dispatchEvent(new Event('change', { bubbles: true }));
        return;
      }
      
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
      
      if (typeof populateDynamicOptions === 'function') {
        populateDynamicOptions();
      }
    };
    
    loaiDatDInput.addEventListener('input', syncDtoF);
    loaiDatDInput.addEventListener('change', syncDtoF);
  }
  
  if (loaiDatFInput && loaiDatInput) {
    const syncFtoD = () => {
      const value = loaiDatFInput.value;
      if (!value) {
        loaiDatInput.value = '';
        loaiDatInput.dispatchEvent(new Event('change', { bubbles: true }));
        return;
      }
      
      const entries = value.split(';').map(e => e.trim()).filter(Boolean);
      const codes = entries.map(entry => {
        const match = entry.match(/^([A-Z]+)/);
        return match ? match[1] : '';
      }).filter(Boolean);
      
      loaiDatInput.value = codes.join('+');
      loaiDatInput.dispatchEvent(new Event('change', { bubbles: true }));    
      if (typeof populateDynamicOptions === 'function') {
        populateDynamicOptions();
      }
    };
    
    loaiDatFInput.addEventListener('input', syncFtoD);
    loaiDatFInput.addEventListener('change', syncFtoD);
  }
}

function populateDynamicOptions(groupData, targetSuffix) {
  if (!groupData) {
    const loaiDatDInput = document.querySelector('input[data-ph="Loai_Dat_D"]');
    const loaiDatFInput = document.querySelector('input[data-ph="Loai_Dat_F"]');
    
    groupData = {};
    if (loaiDatDInput && loaiDatDInput.value) {
      groupData.Loai_Dat_D = loaiDatDInput.value;
    } else if (loaiDatFInput && loaiDatFInput.value) {
      groupData.Loai_Dat_F = loaiDatFInput.value;
    }
    
    if (!groupData.Loai_Dat_D && !groupData.Loai_Dat_F) {
      return;
    }
  }
  
  const areas = [];
  
  if (groupData.Loai_Dat_D) {
    const entries = groupData.Loai_Dat_D.split(';').map(e => e.trim()).filter(Boolean);
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
  
  if (areas.length === 0 && groupData.Loai_Dat_F) {
    const entries = groupData.Loai_Dat_F.split(';').map(e => e.trim()).filter(Boolean);
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

function fillLandTypeFields(groupData, isFromReuse = false) {
  if (!window._autoFilledLandFields) {
    window._autoFilledLandFields = new Set();
  }
  
  const loaiDatDInput = document.querySelector('input[data-ph="Loai_Dat_D"]');
  const loaiDatFContainer = document.querySelector('.land-type-size-container[data-ph="Loai_Dat_F"]');
  const loaiDatInput = document.querySelector('input[data-ph="Loai_Dat"]');
  const sourceHasD = groupData.Loai_Dat_D && groupData.Loai_Dat_D.trim();
  const sourceHasF = groupData.Loai_Dat_F && groupData.Loai_Dat_F.trim();
  const sourceHasBasic = groupData.Loai_Dat && groupData.Loai_Dat.trim();
  
  if (loaiDatDInput && sourceHasD) {
    fillLandTypeDetailField('Loai_Dat_D', groupData.Loai_Dat_D);
    if (isFromReuse && !sourceHasD) {
      window._autoFilledLandFields.add('Loai_Dat_D');
    }
  }
  
  if (loaiDatFContainer && sourceHasF) {
    fillLandTypeSizeField('Loai_Dat_F', groupData.Loai_Dat_F);
    if (isFromReuse && !sourceHasF) {
      window._autoFilledLandFields.add('Loai_Dat_F');
    }
  }
  
  if (loaiDatInput && sourceHasBasic) {
    loaiDatInput.value = groupData.Loai_Dat;
    loaiDatInput.dispatchEvent(new Event('change', { bubbles: true }));
    if (isFromReuse && !sourceHasBasic) {
      window._autoFilledLandFields.add('Loai_Dat');
    }
  }
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

function generateAllLandTypeFormats(data) {
  const hasLoaiDat = data.hasOwnProperty('Loai_Dat');
  const hasLoaiDatF = data.hasOwnProperty('Loai_Dat_F');
  const hasLoaiDatD = data.hasOwnProperty('Loai_Dat_D');
  
  if (!hasLoaiDat && !hasLoaiDatF && !hasLoaiDatD) {
    return;
  }
  
  const loaiDat = data['Loai_Dat'];
  const loaiDatF = data['Loai_Dat_F'];
  const loaiDatD = data['Loai_Dat_D'];
  const originalFields = [];
  if (loaiDat && loaiDat.trim()) originalFields.push('Loai_Dat');
  if (loaiDatF && loaiDatF.trim()) originalFields.push('Loai_Dat_F');
  if (loaiDatD && loaiDatD.trim()) originalFields.push('Loai_Dat_D');
  
  data._landOriginalFields = originalFields;
  
  let sourceValue = null;
  let sourceType = null;
  
  if (loaiDatD && loaiDatD.trim()) {
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
      const entries = sourceValue.split(';').map(e => e.trim()).filter(Boolean);
      const codes = entries.map(entry => {
        const parts = entry.split('|');
        return parts[0] ? parts[0].trim() : '';
      }).filter(Boolean);
      data['Loai_Dat'] = codes.join('+');
    } else if (sourceType === 'F') {
      const entries = sourceValue.split(';').map(e => e.trim()).filter(Boolean);
      const codes = entries.map(entry => {
        const match = entry.match(/^(?:\d+(?:\.\d+)?\s*m2?\s+)?([A-Z]+)/i);
        return match ? match[1] : '';
      }).filter(Boolean);
      data['Loai_Dat'] = codes.join('+');
    }
  }
  
  if (!loaiDatF || !loaiDatF.trim()) {
    if (sourceType === 'D') {
      const entries = sourceValue.split(';').map(e => e.trim()).filter(Boolean);
      const converted = entries.map(entry => {
        const parts = entry.split('|');
        const code = parts[0] ? parts[0].trim() : '';
        const area = parts[2] ? parts[2].trim() : '';
        return area ? `${code} ${area}` : code;
      }).filter(Boolean);
      data['Loai_Dat_F'] = converted.join('; ');
    } else if (sourceType === 'basic') {
      const codes = sourceValue.split('+').map(c => c.trim()).filter(Boolean);
      data['Loai_Dat_F'] = codes.join('; ');
    }
  }
  
  if (!loaiDatD || !loaiDatD.trim()) {
    if (sourceType === 'F') {
      const entries = sourceValue.split(';').map(e => e.trim()).filter(Boolean);
      const converted = entries.map(entry => {
        let match = entry.match(/^([A-Z]+)\s+(\d+(?:\.\d+)?)/i);
        if (match) return `${match[1]}||${match[2]}`;
        match = entry.match(/^(\d+(?:\.\d+)?)\s*m2?\s+([A-Z]+)/i);
        if (match) return `${match[2]}||${match[1]}`;
        match = entry.match(/^([A-Z]+)$/i);
        if (match) return `${match[1]}||`;
        return `${entry}||`;
      });
      data['Loai_Dat_D'] = converted.join(';');
    } else if (sourceType === 'basic') {
      const codes = sourceValue.split('+').map(c => c.trim()).filter(Boolean);
      data['Loai_Dat_D'] = codes.map(code => `${code}||`).join(';');
    }
  }
}

window.LandTypeHandlers = {
  setupLandTypeSync,
  populateDynamicOptions,
  fillLandTypeFields,
  fillLandTypeDetailField,
  fillLandTypeSizeField,
  generateAllLandTypeFormats,
};