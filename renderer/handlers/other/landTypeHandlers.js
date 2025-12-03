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
  const loaiDatDInput = document.querySelector('input[data-ph="Loai_Dat_D"]');
  const loaiDatFContainer = document.querySelector('.land-type-size-container[data-ph="Loai_Dat_F"]');
  const loaiDatInput = document.querySelector('input[data-ph="Loai_Dat"]');
  
  const sourceHasD = groupData.Loai_Dat_D && groupData.Loai_Dat_D.trim();
  const sourceHasF = groupData.Loai_Dat_F && groupData.Loai_Dat_F.trim();
  const sourceHasBasic = groupData.Loai_Dat && groupData.Loai_Dat.trim();
  
  // Xác định nguồn dữ liệu ưu tiên: D > F > Basic
  let sourceValue = null;
  let sourceType = null;
  
  if (sourceHasD) {
    sourceValue = groupData.Loai_Dat_D;
    sourceType = 'D';
  } else if (sourceHasF) {
    sourceValue = groupData.Loai_Dat_F;
    sourceType = 'F';
  } else if (sourceHasBasic) {
    sourceValue = groupData.Loai_Dat;
    sourceType = 'basic';
  }
  
  if (!sourceValue) {
    return;
  }
  
  // Điền Loai_Dat_D nếu template có
  if (loaiDatDInput) {
    if (sourceType === 'D') {
      fillLandTypeDetailField('Loai_Dat_D', sourceValue);
    } else if (sourceType === 'F') {
      const convertedD = convertLoaiDatFtoD(sourceValue);
      fillLandTypeDetailField('Loai_Dat_D', convertedD);
    } else if (sourceType === 'basic') {
      const convertedD = convertLoaiDatBasicToD(sourceValue);
      fillLandTypeDetailField('Loai_Dat_D', convertedD);
    }
  }
  
  // Điền Loai_Dat_F nếu template có
  if (loaiDatFContainer) {
    if (sourceType === 'F') {
      fillLandTypeSizeField('Loai_Dat_F', sourceValue);
    } else if (sourceType === 'D') {
      const convertedF = convertLoaiDatDtoF(sourceValue);
      fillLandTypeSizeField('Loai_Dat_F', convertedF);
    } else if (sourceType === 'basic') {
      const convertedF = convertLoaiDatBasicToF(sourceValue);
      fillLandTypeSizeField('Loai_Dat_F', convertedF);
    }
  }
  
  // Điền Loai_Dat nếu template có
  if (loaiDatInput) {
    if (sourceType === 'basic') {
      loaiDatInput.value = sourceValue;
      loaiDatInput.dispatchEvent(new Event('change', { bubbles: true }));
    } else if (sourceType === 'D') {
      const convertedBasic = convertLoaiDatDtoBasic(sourceValue);
      loaiDatInput.value = convertedBasic;
      loaiDatInput.dispatchEvent(new Event('change', { bubbles: true }));
    } else if (sourceType === 'F') {
      const convertedBasic = convertLoaiDatFtoBasic(sourceValue);
      loaiDatInput.value = convertedBasic;
      loaiDatInput.dispatchEvent(new Event('change', { bubbles: true }));
    }
  }
}

// Hàm chuyển đổi giữa các định dạng
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
  
  // Kiểm tra xem có dữ liệu chi tiết (địa điểm/diện tích) không
  const hasDetailInD = loaiDatD && loaiDatD.includes('|') && loaiDatD.split(';').some(e => {
    const parts = e.split('|');
    return (parts[1] && parts[1].trim()) || (parts[2] && parts[2].trim());
  });
  
  const hasDetailInF = loaiDatF && loaiDatF.match(/\d+(?:\.\d+)?/);
  
  // Xác định nguồn dữ liệu ưu tiên: D (có chi tiết) > F (có chi tiết) > D > F > Basic
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
  
  // Luôn sinh đủ 3 định dạng để lưu vào session
  // Nhưng ưu tiên giữ dữ liệu có chi tiết
  if (!loaiDat || !loaiDat.trim()) {
    if (sourceType === 'D') {
      data['Loai_Dat'] = convertLoaiDatDtoBasic(sourceValue);
    } else if (sourceType === 'F') {
      data['Loai_Dat'] = convertLoaiDatFtoBasic(sourceValue);
    }
  }
  
  if (!loaiDatF || !loaiDatF.trim()) {
    if (sourceType === 'D') {
      data['Loai_Dat_F'] = convertLoaiDatDtoF(sourceValue);
    } else if (sourceType === 'basic') {
      data['Loai_Dat_F'] = convertLoaiDatBasicToF(sourceValue);
    }
  }
  
  if (!loaiDatD || !loaiDatD.trim()) {
    if (sourceType === 'F') {
      data['Loai_Dat_D'] = convertLoaiDatFtoD(sourceValue);
    } else if (sourceType === 'basic') {
      data['Loai_Dat_D'] = convertLoaiDatBasicToD(sourceValue);
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
  convertLoaiDatDtoF,
  convertLoaiDatDtoBasic,
  convertLoaiDatFtoD,
  convertLoaiDatFtoBasic,
  convertLoaiDatBasicToD,
  convertLoaiDatBasicToF,
};