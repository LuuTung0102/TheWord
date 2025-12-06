function fillFormWithMenData(groupData, targetSuffix) {
  setTimeout(() => {
    if (window.LandTypeHandlers && window.LandTypeHandlers.fillLandTypeFields) {
      window.LandTypeHandlers.fillLandTypeFields(groupData);
    }
    
    if (window.LandTypeHandlers && window.LandTypeHandlers.populateDynamicOptions) {
      window.LandTypeHandlers.populateDynamicOptions(groupData, targetSuffix);
    }
  }, 50);
  
  Object.keys(groupData).forEach(fieldName => {
    const value = groupData[fieldName];
    const placeholder = targetSuffix ? `${fieldName}${targetSuffix}` : fieldName;
    
    if (fieldName.includes('Address') && value && typeof value === 'string') {
      fillAddressField(placeholder, value);
      return;
    }
    
    const fieldInput = document.querySelector(`[data-ph="${fieldName}"]`);
    const fieldType = fieldInput?.getAttribute('data-type');
    if (fieldType === 'land_type_detail' || fieldType === 'land_type_size' || fieldType === 'land_type') {
      return;
    }
    
    const element = document.querySelector(`[data-ph="${placeholder}"]`);
    
    if (element) {
      let cleanValue = value;
      if (fieldName.includes('MST') && typeof value === 'string') {
        cleanValue = value.replace(/\./g, '');
      } else if (fieldName.includes('SDT') && typeof value === 'string') {
        cleanValue = value.replace(/\./g, '');
      }
      
      element.value = cleanValue;
      element.dispatchEvent(new Event('change', { bubbles: true }));
      element.dispatchEvent(new Event('blur', { bubbles: true }));
    }
  });
}

function fillAddressField(placeholder, addressString) {
  const provinceInput = document.querySelector(`input[data-main*="${placeholder}"][data-level="province"]`);
  if (!provinceInput) return;
  
  const addressGroup = provinceInput.closest('.address-group');
  if (!addressGroup) return;
  
  const parts = addressString.split(',').map(p => p.trim());
  if (parts.length < 2) return;
  
  const wardInput = addressGroup.querySelector('input[data-level="ward"]');
  const villageInput = addressGroup.querySelector('input[data-level="village"]');
  
  if (!window.addressData) return;
  
  const provinceName = parts[parts.length - 1];
  const cleanProvinceName = provinceName.replace(/^(T\.|TP\.|Tỉnh|Thành phố)\s*/i, '').trim();
  const province = window.addressData.find(p => {
    const cleanPName = p.name.replace(/^(T\.|TP\.|Tỉnh|Thành phố)\s*/i, '').trim();
    return cleanPName.toLowerCase().includes(cleanProvinceName.toLowerCase()) ||
           cleanProvinceName.toLowerCase().includes(cleanPName.toLowerCase());
  });
  
  if (!province) {
    console.warn('Province not found:', provinceName);
    return;
  }
  
  if (!provinceInput._addressSetup) {
    console.warn('Address setup not initialized for province input');
  }
  
  provinceInput.value = province.name;
  
  if (provinceInput._addressSetup) {
    provinceInput._addressSetup.selectedProvince = province;
  }
  
  if (wardInput) {
    wardInput.disabled = false;
  }
  
  setTimeout(() => {
    if (parts.length < 2) return;
    
    const wardName = parts[parts.length - 2];
    const cleanWardName = wardName.replace(/^(Xã|Phường|TT\.|Thị trấn|P\.|X\.)\s*/i, '').trim();
    const ward = province.wards?.find(w => {
      const cleanWName = w.name.replace(/^(Xã|Phường|TT\.|Thị trấn|P\.|X\.)\s*/i, '').trim();
      return cleanWName.toLowerCase().includes(cleanWardName.toLowerCase()) ||
             cleanWardName.toLowerCase().includes(cleanWName.toLowerCase());
    });
    
    if (!ward) {
      console.warn('Ward not found:', wardName, 'in province:', province.name);
      return;
    }
    
    if (!wardInput) return;
    
    wardInput.value = ward.name;
    
    if (wardInput._addressSetup) {
      wardInput._addressSetup.selectedWard = ward;
    }
    
    if (villageInput) {
      villageInput.disabled = !ward.villages || ward.villages.length === 0;
    }
    
    if (parts.length >= 3 && villageInput && ward.villages && ward.villages.length > 0) {
      setTimeout(() => {
        const villageName = parts[0];
        const cleanVillageName = villageName.replace(/^(Thôn|Buôn|Xóm)\s*/i, '').trim();
        const village = ward.villages.find(v => {
          const cleanVName = v.replace(/^(Thôn|Buôn|Xóm)\s*/i, '').trim();
          return cleanVName.toLowerCase().includes(cleanVillageName.toLowerCase()) ||
                 cleanVillageName.toLowerCase().includes(cleanVName.toLowerCase());
        });
        
        if (village) {
          villageInput.value = village;
        } else {
          console.warn('Village not found:', villageName, 'in ward:', ward.name);
        }
      }, 100);
    }
  }, 100);
}

window.DataFiller = {
   fillFormWithMenData,
   fillAddressField
};
