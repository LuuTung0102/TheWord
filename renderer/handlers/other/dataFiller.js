function fillFormWithMenData(groupData, targetSuffix) {
  const hasLandTypeSize = Object.keys(groupData).some(key => {
    const input = document.querySelector(`[data-ph="${key}"]`);
    return input && input.getAttribute('data-type') === 'land_type_size';
  });
  populateDynamicOptions(groupData, targetSuffix);
  fillLandTypeFields(groupData, true);
  
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
  const provinceSelect = document.querySelector(`select[data-main*="${placeholder}"][data-level="province"]`);
  if (!provinceSelect) return;
  
  const addressGroup = provinceSelect.closest('.address-group');
  if (!addressGroup) return;
  
  const parts = addressString.split(',').map(p => p.trim());
  if (parts.length < 3) return;
  
  const districtSelect = addressGroup.querySelector('select[data-level="district"]');
  const wardSelect = addressGroup.querySelector('select[data-level="ward"]');
  const villageElement = addressGroup.querySelector('select[data-level="village"], input[data-level="village"]');
  
  const provinceName = parts[parts.length - 1];
  const provinceOption = Array.from(provinceSelect.options).find(opt => 
    opt.text.includes(provinceName.replace('T. ', '').replace('TP. ', ''))
  );
  if (provinceOption) {
    provinceSelect.value = provinceOption.value;
    provinceSelect.dispatchEvent(new Event('change', { bubbles: true }));
  }
  
  setTimeout(() => {
    const districtName = parts[parts.length - 2];
    const districtOption = Array.from(districtSelect.options).find(opt => 
      opt.text.includes(districtName.replace('H. ', '').replace('Q. ', '').replace('TX. ', '').replace('TP. ', ''))
    );
    if (districtOption) {
      districtSelect.value = districtOption.value;
      districtSelect.dispatchEvent(new Event('change', { bubbles: true }));
    }
    
    setTimeout(() => {
      const wardIndex = parts.length === 4 ? 1 : 0;
      const villageIndex = 0;
      
      const wardName = parts[wardIndex];
      const wardOption = Array.from(wardSelect.options).find(opt => 
        opt.text.includes(wardName.replace('Xã ', '').replace('Phường ', '').replace('TT. ', ''))
      );
      if (wardOption) {
        wardSelect.value = wardOption.value;
        wardSelect.dispatchEvent(new Event('change', { bubbles: true }));
      }
      
      if (parts.length === 4 && villageElement) {
        setTimeout(() => {
          const villageName = parts[villageIndex];
          
          if (villageElement.tagName === 'SELECT') {
            const villageOption = Array.from(villageElement.options).find(opt => 
              opt.text.includes(villageName.replace('Thôn ', '').replace('Buôn ', ''))
            );
            if (villageOption) {
              villageElement.value = villageOption.value;
              villageElement.dispatchEvent(new Event('change', { bubbles: true }));
            }
          } else {
            villageElement.value = villageName;
            villageElement.dispatchEvent(new Event('input', { bubbles: true }));
          }
        }, 100);
      }
    }, 100);
  }, 100);
}

window.DataFiller = {
   fillFormWithMenData,
   fillAddressField
};
