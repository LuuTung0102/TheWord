function renderSingleSubgroup(groupKey, subKey, config, phMapping, grouped, groupLabels, subgroupLabels) {
  const subgroupDiv = document.createElement("div");
  subgroupDiv.className = "form-subgroup";
  subgroupDiv.setAttribute('data-subgroup-id', subKey);
  
  const groupMapping = config.fieldMappings ? config.fieldMappings.find(m => m.group === groupKey) : null;
  const allSubgroups = groupMapping && groupMapping.subgroups ? groupMapping.subgroups : [];
  const subgroupKeys = allSubgroups.map(sg => typeof sg === 'string' ? sg : sg.id);
  
  const isDefaultVisible = window.defaultVisibleSubgroups && window.defaultVisibleSubgroups.has(subKey);
  const visibleSubgroupsInGroup = subgroupKeys.filter(sk => window.visibleSubgroups.has(sk));
  const canDelete = !isDefaultVisible && visibleSubgroupsInGroup.length > 1;
  
  const deleteButtonHtml = canDelete ? `
    <button class="remove-subgroup-btn" 
      data-group="${groupKey}" 
      data-subgroup="${subKey}"
      title="Xóa ${subgroupLabels[subKey] || subKey}">
      ❌ Xóa
    </button>
  ` : '';
  
  subgroupDiv.innerHTML = `
    <div style="display: flex; justify-content: space-between; align-items: center;">
      <h4 style="margin: 0; color: #1976D2;">${subgroupLabels[subKey] || subKey}</h4>
      ${deleteButtonHtml}
    </div>
  `;
  
  const reuseDropdownHtml = renderReuseDataDropdown(groupKey, subKey, config);
  if (reuseDropdownHtml) {
    subgroupDiv.innerHTML += reuseDropdownHtml;
  }

  const items = (grouped[groupKey] && grouped[groupKey][subKey]) ? grouped[groupKey][subKey] : [];
  const sortedItems = sortGenericFields(items);
  
  const skipLandFields = window.stateManager.getRenderDataStructures()?.skipLandFields || new Set();
  const filteredItems = sortedItems.filter(({ ph }) => !skipLandFields.has(ph));
  
  let i = 0;
  while (i < filteredItems.length) {
    const rowDiv = document.createElement("div");
    rowDiv.className = "form-row";
    
    const { ph, def } = filteredItems[i];
    const isFullWidth = def.type === 'land_type_detail';
    
    if (isFullWidth) {
      const { inputHtml } = renderGenericInputField(ph, def, groupKey, subKey);
      const cellDiv = document.createElement("div");
      cellDiv.className = "form-cell form-field";
      cellDiv.innerHTML = inputHtml;
      rowDiv.appendChild(cellDiv);
      i++;
    } else {
      for (let j = 0; j < 3 && i < filteredItems.length; j++, i++) {
        const { ph: currentPh, def: currentDef } = filteredItems[i];
        if (currentDef.type === 'land_type_detail') {
          break;
        }
        const { inputHtml } = renderGenericInputField(currentPh, currentDef, groupKey, subKey);
        const cellDiv = document.createElement("div");
        cellDiv.className = "form-cell form-field";
        cellDiv.innerHTML = inputHtml;
        rowDiv.appendChild(cellDiv);
      }
    }
    
    subgroupDiv.appendChild(rowDiv);
  }
  
  return subgroupDiv;
}

function renderReuseDataDropdown(groupKey, subKey, config) {
  let targetSuffix = '';
  if (config.fieldMappings) {
    const mapping = config.fieldMappings.find(m => m.group === groupKey);
    if (mapping && mapping.suffixes && mapping.suffixes.length > 0) {
      const subgroupIndex = mapping.subgroups ? 
        mapping.subgroups.findIndex(sg => (typeof sg === 'string' ? sg : sg.id) === subKey) : -1;
      
      if (subgroupIndex >= 0 && subgroupIndex < mapping.suffixes.length) {
        targetSuffix = mapping.suffixes[subgroupIndex];
      }
    }
  }
  
  const allGroups = window.sessionStorageManager ? 
    window.sessionStorageManager.getAvailableMenGroups() : [];
  
  if (allGroups.length === 0) return null;
  
  const isLandGroup = groupKey === 'LAND';
  
  const availableGroups = allGroups.filter(group => {
    if (group.groupKey === 'OTHER') return false;
    if (isLandGroup) {
      return group.groupKey.startsWith('INFO');
    } else {
      return group.groupKey.startsWith('MEN');
    }
  }).map(group => {
      let finalDisplayName = group.displayName;
      if (!group.groupKey.startsWith('MEN')) {
        let groupLabel = null;
        if (config.groups) {
          const groupDef = config.groups.find(g => g.id === group.groupKey);
          if (groupDef && groupDef.label) {
            groupLabel = groupDef.label;
          }
        }
        
        if (!groupLabel && config.fieldMappings) {
          const mapping = config.fieldMappings.find(m => 
            m.subgroups && m.subgroups.includes(group.groupKey)
          );
          if (mapping && mapping.label) {
            groupLabel = mapping.label;
          }
        }
        
        if (groupLabel) {
          finalDisplayName = group.displayName.replace(group.groupKey, groupLabel);
        }
      }
      
      return {
        ...group,
        displayName: finalDisplayName
      };
  });
  
  if (availableGroups.length === 0) return null;
  
  const dropdownId = `reuse-${groupKey}-${subKey}-${Date.now()}`;
  
  return `
    <div class="reuse-data-section">
      <label>🔄 Tái sử dụng:</label>
      <div class="custom-reuse-dropdown">
        <div class="reuse-dropdown-trigger" data-dropdown-id="${dropdownId}">
          <span class="selected-text">-- Nhập mới --</span>
          <span>▼</span>
        </div>
        <div 
          class="reuse-dropdown-menu" 
          id="${dropdownId}"
          data-target-group="${groupKey}"
          data-target-subgroup="${subKey}"
          data-target-suffix="${targetSuffix}"
        >
          <div class="reuse-option" data-value="">
            <span>-- Nhập mới --</span>
          </div>
          ${availableGroups.map(group => `
            <div 
              class="reuse-option" 
              data-value="${group.fileName}|${group.menKey}"
              data-file-name="${group.fileName}"
              data-group-key="${group.menKey}"
            >
              <span>${group.displayName}</span>
              <button 
                class="delete-reuse-btn"
                data-file-name="${group.fileName}"
                data-group-key="${group.menKey}"
                title="Xóa dữ liệu này"
                onclick="event.stopPropagation();"
              >
                🗑️
              </button>
            </div>
          `).join('')}
        </div>
      </div>
    </div>
  `;
}

function sortGenericFields(items) {
  return items.sort((a, b) => {
    const aOrder = a.def?.order || 999;
    const bOrder = b.def?.order || 999;
    return aOrder - bOrder;
  });
}

window.SubgroupRenderer = {
    renderSingleSubgroup,
    renderReuseDataDropdown,
    sortGenericFields
};