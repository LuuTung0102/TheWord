
let idToPhGeneric = {};

function renderGenericInputField(ph, fieldDef, group, subgroup) {
  const inputId = `input-${ph}-${Date.now()}-${Math.random()}`;
  idToPhGeneric[inputId] = ph;

  let inputHtml = "";
  const label = fieldDef.label || ph;
  const type = fieldDef.type || "text";
  const safeId = inputId.replace(/[^a-zA-Z0-9-_]/g, '_');
  const placeholder = fieldDef.placeholder || `Nhập ${label.toLowerCase()}`;
  const isHidden = fieldDef.hidden === true;
  
  const isRequired = fieldDef.required === true;
  const requiredClass = isRequired ? ' class="required"' : '';
  
  const hiddenStyle = isHidden ? 'style="display: none;"' : '';
  const isFullWidth = type === 'land_type_detail';
  const fullWidthClass = isFullWidth ? ' full-width' : '';
  
  const wrapperStart = `<div class="field-wrapper${fullWidthClass}" ${hiddenStyle}>`;
  const wrapperEnd = `</div>`;

  if (type === "select") {
    const options = fieldDef.options || [];
    const defaultValue = fieldDef.defaultValue || '';
    inputHtml = `
      ${wrapperStart}
      <label for="${safeId}"${requiredClass}><b>${label}</b></label>
      <select id="${safeId}" data-ph="${ph}" class="input-field" data-default="${defaultValue}">
        <option value="">-- Chọn --</option>
        ${options.map((opt) => `<option value="${opt}" ${opt === defaultValue ? 'selected' : ''}>${opt}</option>`).join("")}
      </select>
      ${wrapperEnd}
    `;
  } else if (type === "date") {
    inputHtml = `
      ${wrapperStart}
      <label for="${safeId}"${requiredClass}><b>${label}</b></label>
      <input type="text" id="${safeId}" data-ph="${ph}" class="date-picker input-field" placeholder="dd/mm/yyyy" />
      ${wrapperEnd}
    `;
  } else if (type === "address-select") {
    inputHtml = `
      ${wrapperStart}
      <label for="${safeId}"${requiredClass}><b>${label}</b></label>
      <div class="address-group">
        <select id="${safeId}_province" data-main="${safeId}" data-level="province" class="address-select input-field">
          <option value="">-- Chọn tỉnh/thành --</option>
          ${window.addressData ? window.addressData.map(p => `<option value="${p.name}">${p.name}</option>`).join('') : ''}
        </select>
        <select id="${safeId}_district" data-main="${safeId}" data-level="district" class="address-select input-field">
          <option value="">-- Chọn quận/huyện --</option>
        </select>
        <select id="${safeId}_ward" data-main="${safeId}" data-level="ward" class="address-select input-field">
          <option value="">-- Chọn phường/xã --</option>
        </select>
        <select id="${safeId}_village" data-main="${safeId}" data-level="village" class="address-select input-field">
          <option value="">-- Chọn thôn/buôn --</option>
        </select>
  
      </div>
      ${wrapperEnd}
    `;
  }  else if (type === "number") {
    const maxLength = fieldDef.maxLength || '';
    const isCCCD = fieldDef.name === 'CCCD';
    const inputClass = isCCCD ? 'input-field cccd-input' : 'input-field';
    const inputMaxLength = isCCCD ? '12' : maxLength;
    inputHtml = `
      ${wrapperStart}
      <label for="${safeId}"${requiredClass}><b>${label}</b></label>
      <input type="text" id="${safeId}" data-ph="${ph}" class="${inputClass}" placeholder="${placeholder}" ${inputMaxLength ? `maxlength="${inputMaxLength}"` : ''} />
      ${wrapperEnd}
    `;
  } else if (type === "land-type" || type === "land_type") {
    inputHtml = `
      ${wrapperStart}
      <label for="${safeId}"${requiredClass}><b>${label}</b></label>
      <div style="position: relative;">
        <input type="text" id="${safeId}" data-ph="${ph}" class="input-field land-type-input" placeholder="${placeholder}">
        <div id="${safeId}_dropdown" class="land-type-dropdown"></div>
      </div>
      ${wrapperEnd}
    `;
  } else if (type === "land_type_size") {
    inputHtml = `
      ${wrapperStart}
      <label for="${safeId}"${requiredClass}><b>${label}</b></label>
      <div class="land-type-size-container" id="${safeId}_container" data-ph="${ph}">
        <div class="tags-wrapper" id="${safeId}_tags"></div>
        <div class="tag-input-wrapper">
          <input type="text" id="${safeId}" class="tag-input" data-ph="${ph}" placeholder="Chọn loại đất..." autocomplete="off">
          <div id="${safeId}_dropdown" class="land-type-dropdown"></div>
        </div>
        <button type="button" class="tag-add-btn" id="${safeId}_addBtn" title="Thêm loại đất">
          <span>+</span>
        </button>
      </div>
      ${wrapperEnd}
    `;
  } else if (type === "options") {
    const options = fieldDef.options || [];
    inputHtml = `
      ${wrapperStart}
      <label for="${safeId}"${requiredClass}><b>${label}</b></label>
      <select id="${safeId}" data-ph="${ph}" class="input-field dynamic-options-field">
        <option value="">-- Chọn --</option>
        ${options.map((opt) => `<option value="${opt}">${opt}</option>`).join("")}
      </select>
      ${wrapperEnd}
    `;
  } else if (type === "editable-select") {
    const options = fieldDef.options || [];
    inputHtml = `
      ${wrapperStart}
      <label for="${safeId}"${requiredClass}><b>${label}</b></label>
      <div class="editable-select-container">
        <input 
          type="text" 
          id="${safeId}" 
          data-ph="${ph}" 
          class="input-field editable-select-input dynamic-options-field" 
          placeholder="${placeholder}"
          autocomplete="off"
          data-options='${JSON.stringify(options)}'
        />
        <div class="editable-select-dropdown" id="dropdown-${safeId}"></div>
      </div>
      ${wrapperEnd}
    `;
  } else if (type === "land_type_detail") {
    inputHtml = `
      ${wrapperStart}
      <label for="${safeId}"${requiredClass}><b>${label}</b></label>
      <input type="hidden" id="${safeId}" data-ph="${ph}" class="tag-input" />
      <div class="land-type-size-container" id="${safeId}_container" data-ph="${ph}">
        <div class="tags-wrapper" id="${safeId}_tags"></div>
        <div class="tag-input-wrapper show" id="${safeId}_input_wrapper">
          <input type="text" id="${safeId}_type" class="tag-input" placeholder="Chọn loại đất..." autocomplete="off">
          <div id="${safeId}_dropdown" class="land-type-dropdown"></div>
        </div>
        <div class="tag-input-wrapper" id="${safeId}_location_wrapper" style="display: none;">
          <input type="text" id="${safeId}_location" class="tag-input" placeholder="Vị trí..." autocomplete="off">
        </div>
        <div class="tag-input-wrapper" id="${safeId}_area_wrapper" style="display: none;">
          <input type="text" id="${safeId}_area" class="tag-input" placeholder="Diện tích (m²)..." autocomplete="off">
        </div>
        <button type="button" class="tag-add-btn" id="${safeId}_addBtn" title="Thêm" style="display: none;">
          <span>+</span>
        </button>
      </div>
      ${wrapperEnd}
    `;
  } else if (type === "money" || type === "currency") {
    inputHtml = `
      ${wrapperStart}
      <label for="${safeId}"${requiredClass}><b>${label}</b></label>
      <input type="text" id="${safeId}" data-ph="${ph}" class="input-field money-input" placeholder="${placeholder}" />
      ${wrapperEnd}
    `;
  } else if (type === "textarea") {
    const rows = fieldDef.rows || 3;
    inputHtml = `
      ${wrapperStart}
      <label for="${safeId}"${requiredClass}><b>${label}</b></label>
      <textarea id="${safeId}" data-ph="${ph}" rows="${rows}" class="input-field" placeholder="${placeholder}"></textarea>
      ${wrapperEnd}
    `;
  } else if (type === "tel") {
    inputHtml = `
      ${wrapperStart}
      <label for="${safeId}"${requiredClass}><b>${label}</b></label>
      <input type="tel" id="${safeId}" data-ph="${ph}" class="input-field phone-input" placeholder="${placeholder}" maxlength="10" />
      ${wrapperEnd}
    `;
  } else if (type === "email") {
    inputHtml = `
      ${wrapperStart}
      <label for="${safeId}"${requiredClass}><b>${label}</b></label>
      <input type="email" id="${safeId}" data-ph="${ph}" class="input-field" placeholder="${placeholder}" />
      ${wrapperEnd}
    `;
  } else if (type === "text-or-dots") {
    const dotPlaceholder = fieldDef.dotPlaceholder || "...........";
    inputHtml = `
      ${wrapperStart}
      <label for="${safeId}"${requiredClass}><b>${label}</b></label>
      <input type="text" id="${safeId}" data-ph="${ph}" data-dot-placeholder="${dotPlaceholder}" class="input-field text-or-dots-input" placeholder="${placeholder}" />
      ${wrapperEnd}
    `;
  } else {
    inputHtml = `
      ${wrapperStart}
      <label for="${safeId}"${requiredClass}><b>${label}</b></label>
      <input type="text" id="${safeId}" data-ph="${ph}" class="input-field" placeholder="${placeholder}" />
      ${wrapperEnd}
    `;
  }

  return { inputHtml, inputId };
}

function renderDropdownOptions(dropdown, options, filterText) {
  const filtered = options.filter(opt => 
    opt.toLowerCase().includes(filterText.toLowerCase())
  );
  
  if (filtered.length === 0) {
    dropdown.innerHTML = '<div class="dropdown-empty">Không có kết quả</div>';
    return;
  }
  
  dropdown.innerHTML = filtered.map(opt => 
    `<div class="dropdown-option" data-value="${opt}">${opt}</div>`
  ).join('');
  
  dropdown.querySelectorAll('.dropdown-option').forEach(optEl => {
    optEl.addEventListener('click', () => {
      const input = window.stateManager.getElement(dropdown.id.replace('dropdown-', ''));
      if (input) {
        input.value = optEl.getAttribute('data-value');
        input.dispatchEvent(new Event('change', { bubbles: true }));
        dropdown.style.display = 'none';
      }
    });
  });
}

function setupEditableSelectInput(input) {
  const dropdown = window.stateManager.getElement(`dropdown-${input.id}`);
  
  if (!dropdown) {
    return;
  }
  
  const getCurrentOptions = () => {
    try {
      return JSON.parse(input.getAttribute('data-options') || '[]');
    } catch (e) {
      return [];
    }
  };
  
  input.addEventListener('focus', () => {
    const options = getCurrentOptions();
    if (options.length > 0) {
      renderDropdownOptions(dropdown, options, '');
      dropdown.style.display = 'block';
    }
  });
  
  input.addEventListener('input', (e) => {
    const options = getCurrentOptions();
    if (options.length > 0) {
      const filterText = e.target.value.toLowerCase();
      renderDropdownOptions(dropdown, options, filterText);
      dropdown.style.display = 'block';
    }
  });
  
  input.addEventListener('blur', () => {
    setTimeout(() => {
      dropdown.style.display = 'none';
    }, 200);
  });
}



async function renderGenericForm(placeholders, config, folderPath) {
  window._autoFilledLandFields = new Set();
  
  if (window.personDataService && !window.personDataService.labelsLoaded) {
    await window.personDataService.loadPeople();
  }
  
  window.stateManager.setRenderParams({ placeholders, config, folderPath });
  const phMapping = window.buildPlaceholderMapping(config, placeholders);
  const groupLabels = window.getGroupLabels(config);
  const subgroupLabels = window.getSubgroupLabels(config);
  const grouped = {};
  placeholders.forEach(ph => {
    const def = phMapping[ph];
    if (!def) {
      return;
    }
    
    const groupKey = def.group;
    const subKey = def.subgroup;
    
    if (!grouped[groupKey]) grouped[groupKey] = {};
    if (!grouped[groupKey][subKey]) grouped[groupKey][subKey] = [];
    
    grouped[groupKey][subKey].push({ ph, def });
  });
  
  const skipLandFields = getLandFieldsToSkip(placeholders);
  
  window.stateManager.setRenderDataStructures({ phMapping, grouped, groupLabels, subgroupLabels, skipLandFields });
  window.stateManager.resetReuse();
  
  window.stateManager.querySelectorAll('input[data-ph], select[data-ph], textarea[data-ph]').forEach(el => {
    el.value = '';
  });
  
  if (typeof window.cleanupAllEventListeners === 'function') {
    window.cleanupAllEventListeners();
  }
  
  const area = window.stateManager.getElement("formArea");
  area.innerHTML = "";
  window.stateManager.invalidateDOMCache();
  idToPhGeneric = {};
  window.idToPhGeneric = idToPhGeneric;

  if (!config || !config.groups) {
    return;
  }

  const groupOrder = config.groups
    .sort((a, b) => (a.order || 999) - (b.order || 999))
    .map(group => group.id);
  
  if (!window.defaultVisibleSubgroups) {
    window.defaultVisibleSubgroups = new Set();
  }
  
  if (!window.visibleSubgroups || window.visibleSubgroups.size === 0) {
    window.visibleSubgroups = new Set();
    if (config.fieldMappings) {
      config.fieldMappings.forEach(mapping => {
        if (mapping.subgroups && mapping.subgroups.length > 0) {
          mapping.subgroups.forEach((subgroup, index) => {
            const subgroupId = typeof subgroup === 'string' ? subgroup : subgroup.id;
            const hasExplicitVisible = typeof subgroup === 'object' && subgroup.hasOwnProperty('visible');          
            if (hasExplicitVisible) {
              if (subgroup.visible === true) {
                window.visibleSubgroups.add(subgroupId);
                window.defaultVisibleSubgroups.add(subgroupId); 
              }
            } else {
              if (index === 0) {
                window.visibleSubgroups.add(subgroupId);
                window.defaultVisibleSubgroups.add(subgroupId); 
              } else {
               
              }
            }
          });
        }
      });
    }
  } else {
    
  }
  

  const taskbarHtml = `
    <div class="form-taskbar">
      ${groupOrder.map((groupKey, index) => {
        if (!grouped[groupKey]) return '';
        return `<button class="taskbar-btn ${index === 0 ? 'active' : ''}" data-section="${groupKey}">
          ${groupLabels[groupKey] || groupKey}
        </button>`;
      }).join('')}
    </div>
  `;
  area.insertAdjacentHTML('beforeend', taskbarHtml);
  
  const footerActions = window.stateManager.querySelector('.footer-actions');
  if (footerActions) {
    const existingClearBtn = footerActions.querySelector('.clear-all-session-btn');
    if (existingClearBtn) {
      existingClearBtn.remove();
    }
    
    const hasSessionData = window.sessionStorageManager ? 
      (window.sessionStorageManager.getAvailableMenGroups() || []).length > 0 : false;
    
    if (hasSessionData) {
      const clearBtn = document.createElement('button');
      clearBtn.className = 'clear-all-session-btn';
      clearBtn.innerHTML = '<span class="btn-icon">🗑️</span> Làm mới';
      clearBtn.title = 'Xóa tất cả dữ liệu đã lưu trong session';
      footerActions.appendChild(clearBtn);
      
      clearBtn.addEventListener('click', async () => {
        const confirmed = await new Promise((resolve) => {
          showConfirm(
            'Xóa tất cả dữ liệu đã lưu?',
            () => resolve(true),
            () => resolve(false)
          );
        });
        
        if (!confirmed) return;
        
        if (window.sessionStorageManager && window.sessionStorageManager.clearAllSessionData) {
          window.sessionStorageManager.clearAllSessionData();
        } else {
          showError('Không thể xóa dữ liệu');
          return;
        }
        
        clearBtn.remove();
        await renderGenericForm(placeholders, config, folderPath);
        showSuccess('Đã xóa dữ liệu thành công');
      });
    }
  }

  const groupSources = {};
  if (config.fieldMappings) {
    config.fieldMappings.forEach(mapping => {
      if (mapping.source === "localStorage") {
        groupSources[mapping.group] = "localStorage";
      }
    });
  }

  for (let index = 0; index < groupOrder.length; index++) {
    const groupKey = groupOrder[index];
    if (!grouped[groupKey]) continue;
    const sectionDiv = document.createElement("div");
    sectionDiv.className = `form-section ${index === 0 ? 'active' : ''}`;
    sectionDiv.id = `section-${groupKey}`;
    const groupDiv = document.createElement("div");
    groupDiv.className = "form-group";
    
    const groupMapping = config.fieldMappings ? config.fieldMappings.find(m => m.group === groupKey) : null;
    const availableSubgroups = groupMapping && groupMapping.subgroups ? groupMapping.subgroups.filter(sg => {
      const subId = typeof sg === 'string' ? sg : sg.id;
      const subIndex = groupMapping.subgroups.findIndex(s => {
        const sId = typeof s === 'string' ? s : s.id;
        return sId === subId;
      });
      const suffix = groupMapping.suffixes && groupMapping.suffixes[subIndex] 
        ? groupMapping.suffixes[subIndex] 
        : '';
      const hasPlaceholder = Object.keys(phMapping).some(ph => {
        if (suffix) {
          return ph.endsWith(suffix);
        }
        return true;
      });
      
      return hasPlaceholder;
    }) : [];
    
    const hiddenSubgroups = availableSubgroups.filter(sg => {
      const subId = typeof sg === 'string' ? sg : sg.id;
      return !window.visibleSubgroups.has(subId);
    });
    
    if (hiddenSubgroups.length > 0) {
      const firstHidden = hiddenSubgroups[0];
      const subLabel = typeof firstHidden === 'string' ? firstHidden : (firstHidden.label || firstHidden.id);
      
      groupDiv.innerHTML = `
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 15px;">
          <h3 style="margin: 0;">${groupLabels[groupKey] || groupKey}</h3>
          <button class="add-subgroup-btn" data-group="${groupKey}">
            ➕ ${subLabel}
          </button>
        </div>
      `;
    } else {
      groupDiv.innerHTML = `<h3>${groupLabels[groupKey] || groupKey}</h3>`;
    }

    if (groupSources[groupKey] === "localStorage") {
      let suffix = '';
      if (config.fieldMappings) {
        const mapping = config.fieldMappings.find(m => m.group === groupKey && m.source === "localStorage");
        if (mapping && mapping.suffixes && mapping.suffixes.length > 0) {
          suffix = mapping.suffixes[0];
        }
      }
      const savedPeople = window.loadSavedPeople ? await window.loadSavedPeople() : [];
      const buttonsHtml = `
        <div class="form-subgroup">
          <h4>Chọn người từ danh sách đã lưu</h4>
          <div class="field-wrapper">
            <div class="person-buttons" id="person-buttons-${groupKey}" data-group="${groupKey}" data-suffix="${suffix}">
              ${savedPeople.map(person => `
                <button type="button" 
                  class="person-btn" 
                  data-person-id="${person.id}"
                  data-group="${groupKey}"
                  onmouseover="this.style.borderColor='#4CAF50'"
                  onmouseout="if(!this.classList.contains('active')) this.style.borderColor='#ddd'"
                >
                  ${person.name}
                </button>
              `).join('')}
            </div>
          </div>
          <div id="preview-${groupKey}" style="margin-top: 20px; padding: 15px; background: #f8f9fa; border-radius: 4px; display: none;">
            <h5 style="margin-top: 0;">Thông tin đã chọn:</h5>
            <div id="preview-content-${groupKey}"></div>
          </div>
        </div>
      `;
      
      groupDiv.innerHTML += buttonsHtml;
    } else {
      const allSubgroups = groupMapping && groupMapping.subgroups ? groupMapping.subgroups : [];
      const subgroupKeys = allSubgroups.map(sg => typeof sg === 'string' ? sg : sg.id);
      subgroupKeys.forEach(subKey => {
        if (!window.visibleSubgroups.has(subKey)) return;
        const subgroupDiv = document.createElement("div");
        subgroupDiv.className = "form-subgroup";
        subgroupDiv.setAttribute('data-subgroup-id', subKey);
    
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

        groupDiv.appendChild(subgroupDiv);
      });
    } 

    sectionDiv.appendChild(groupDiv);
    area.appendChild(sectionDiv);
  } 

  const addButtons = window.stateManager.querySelectorAll('.add-subgroup-btn');
  addButtons.forEach(btn => {
    btn.addEventListener('click', async () => {
      const groupKey = btn.dataset.group;
      
      const renderParams = window.stateManager.getRenderParams();
      const renderData = window.stateManager.getRenderDataStructures();
      if (!renderParams || !renderData) {
        return;
      }
      
      const { config } = renderParams;
      const { phMapping, grouped, groupLabels, subgroupLabels } = renderData;
      const groupMapping = config.fieldMappings ? config.fieldMappings.find(m => m.group === groupKey) : null;
      
      if (groupMapping && groupMapping.subgroups) {
        const availableSubgroups = groupMapping.subgroups.filter(sg => {
          const subId = typeof sg === 'string' ? sg : sg.id;
          const subIndex = groupMapping.subgroups.findIndex(s => {
            const sId = typeof s === 'string' ? s : s.id;
            return sId === subId;
          });
          const suffix = groupMapping.suffixes && groupMapping.suffixes[subIndex] 
            ? groupMapping.suffixes[subIndex] 
            : '';
          const hasPlaceholder = Object.keys(phMapping).some(ph => {
            if (suffix) {
              return ph.endsWith(suffix);
            }
            return true;
          });
          
          return hasPlaceholder;
        });
        
        const nextHidden = availableSubgroups.find(sg => {
          const subId = typeof sg === 'string' ? sg : sg.id;
          return !window.visibleSubgroups.has(subId);
        });
        
        if (nextHidden) {
          const subgroupId = typeof nextHidden === 'string' ? nextHidden : nextHidden.id;
          window.visibleSubgroups.add(subgroupId);
          const newSubgroupDiv = renderSingleSubgroup(groupKey, subgroupId, config, phMapping, grouped, groupLabels, subgroupLabels);
          const sectionDiv = window.stateManager.querySelector(`#section-${groupKey}`);
          if (sectionDiv) {
            const groupDiv = sectionDiv.querySelector('.form-group');
            if (groupDiv) {
              groupDiv.appendChild(newSubgroupDiv);
              const remainingHidden = availableSubgroups.filter(sg => {
                const subId = typeof sg === 'string' ? sg : sg.id;
                return !window.visibleSubgroups.has(subId);
              });
              if (remainingHidden.length === 0) {
                btn.style.display = 'none';
              }
              
              setTimeout(() => {
                const removeBtn = newSubgroupDiv.querySelector('.remove-subgroup-btn');
                if (removeBtn) {
                  removeBtn.addEventListener('click', async () => {
                    const subgroupIdToRemove = removeBtn.dataset.subgroup;
                    const subgroupLabel = removeBtn.getAttribute('title')?.replace('Xóa ', '') || subgroupIdToRemove;
                    
                    const confirmed = await new Promise((resolve) => {
                      showConfirm(
                        `Bạn có chắc muốn xóa "${subgroupLabel}"?\n\nDữ liệu đã nhập sẽ bị xóa.`,
                        () => resolve(true),
                        () => resolve(false)
                      );
                    });
                    
                    if (!confirmed) return;
                    
                    window.visibleSubgroups.delete(subgroupIdToRemove);
                    groupDiv.removeChild(newSubgroupDiv);
                    btn.style.display = '';
                  });
                }
                setupReuseDataListeners();
                if (typeof window.reSetupAllInputs === 'function') {
                  window.reSetupAllInputs();
                }
                newSubgroupDiv.querySelectorAll('.editable-select-input').forEach(input => {
                  setupEditableSelectInput(input);
                });
              }, 50);
              setTimeout(() => {
                newSubgroupDiv.scrollIntoView({ behavior: 'smooth', block: 'center' });
              }, 100);
            }
          }
        }
      }
    });
  });

  const removeButtons = window.stateManager.querySelectorAll('.remove-subgroup-btn');
  removeButtons.forEach(btn => {
    btn.addEventListener('click', async () => {
      const groupKey = btn.dataset.group;
      const subgroupId = btn.dataset.subgroup;
      
      if (!subgroupId) {
        return;
      }
      
      const subgroupLabel = btn.getAttribute('title')?.replace('Xóa ', '') || subgroupId;
      
      const confirmed = await new Promise((resolve) => {
        showConfirm(
          `Bạn có chắc muốn xóa "${subgroupLabel}"?\n\nDữ l
       sẽ bị xóa.`,
          () => resolve(true),
          () => resolve(false)
        );
      });
      
      if (!confirmed) return;
      
      window.visibleSubgroups.delete(subgroupId);
      const subgroupElement = window.stateManager.querySelector(`[data-subgroup-id="${subgroupId}"]`);
      if (subgroupElement && subgroupElement.parentNode) {
        subgroupElement.parentNode.removeChild(subgroupElement);
       
      } else {
        
      }
    });
  });


  window.stateManager.querySelectorAll('.taskbar-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const targetSection = btn.dataset.section;
      window.stateManager.querySelectorAll('.taskbar-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');  
      window.stateManager.querySelectorAll('.form-section').forEach(section => {
        if (section.id === `section-${targetSection}`) {
          section.classList.add('active');
        } else {
          section.classList.remove('active');
        }
      });
      
      setupReuseDataListeners();
    });
  });


  requestAnimationFrame(() => {
    setTimeout(() => {
      if (typeof window.setupFormEventListeners === 'function') {
        window.setupFormEventListeners();
      }
      if (typeof window.reSetupAllInputs === 'function') {
        window.reSetupAllInputs();
      }
      
      document.querySelectorAll('.editable-select-input').forEach(input => {
        setupEditableSelectInput(input);
      });
      
      setupLandTypeSync();
      
      setupPersonSelectionListeners(groupSources, grouped);
      setupReuseDataListeners();
    }, 100); 
  });
  
}

function getLandFieldsToSkip(allPlaceholders) {
  const hasLoaiDatD = allPlaceholders.some(ph => ph === 'Loai_Dat_D');
  const hasLoaiDatF = allPlaceholders.some(ph => ph === 'Loai_Dat_F');
  const hasLoaiDat = allPlaceholders.some(ph => ph === 'Loai_Dat');
  
  const skipFields = new Set();
  
  if (hasLoaiDatD) {
    if (hasLoaiDatF) skipFields.add('Loai_Dat_F');
    if (hasLoaiDat) skipFields.add('Loai_Dat');
  } else if (hasLoaiDatF) {
    if (hasLoaiDat) skipFields.add('Loai_Dat');
  }
  return skipFields;
}

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
  
  const availableGroups = allGroups.filter(group => {
    if (group.groupKey === 'OTHER') return false;
    if (targetSuffix) {
      return group.groupKey.startsWith('MEN');
    } else {
      return !group.groupKey.startsWith('MEN');
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

function handlePersonButtonClick(clickedButton, allButtons, groupKey) {
  const personId = clickedButton.getAttribute('data-person-id');
  const previewDiv = document.getElementById(`preview-${groupKey}`);
  const previewContent = document.getElementById(`preview-content-${groupKey}`);
  
  allButtons.forEach(btn => {
    btn.classList.remove('active');
    btn.style.fontWeight = 'normal';
    btn.style.borderColor = '#ddd';
    btn.style.background = 'white';
    btn.style.color = '#333';
  });
  
  clickedButton.classList.add('active');
  clickedButton.style.fontWeight = 'bold';
  clickedButton.style.borderColor = '#4CAF50';
  clickedButton.style.background = '#4CAF50';
  clickedButton.style.color = 'white';
  
  window.stateManager.addReusedGroup(`localStorage:${groupKey}`);
  
  const person = window.getPersonById ? window.getPersonById(personId) : null;
  
  if (!person) {
    if (previewDiv) previewDiv.style.display = 'none';
    return;
  }
  
  let html = `<p style="margin-bottom: 10px; font-size: 16px;"><strong>📋 ${person.name}</strong></p>`;
  html += '<div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 10px;">';
  
  Object.keys(person.data).forEach(key => {
    const value = person.data[key];
    if (value) {
      const label = window.personDataService ? window.personDataService.getLabel(key) : key;
      html += `<div style="padding: 8px; background: white; border-radius: 4px;"><strong>${label}:</strong> ${value}</div>`;
    }
  });
  
  html += '</div>';
  
  if (previewContent) previewContent.innerHTML = html;
  if (previewDiv) previewDiv.style.display = 'block';
}

function setupPersonButtonListeners(groupKey) {
  const buttonsContainer = document.getElementById(`person-buttons-${groupKey}`);
  if (!buttonsContainer) return;
  
  const buttons = buttonsContainer.querySelectorAll('.person-btn');
  
  buttons.forEach(button => {
    button.addEventListener('click', (e) => {
      handlePersonButtonClick(e.currentTarget, buttons, groupKey);
    });
  });
}

async function refreshPersonButtons(groupKey) {
  if (typeof window.savedPeopleCache !== 'undefined') {
    window.savedPeopleCache = null;
  }
  
  const savedPeople = window.loadSavedPeople ? await window.loadSavedPeople() : [];
  const buttonsContainer = document.getElementById(`person-buttons-${groupKey}`);
  if (!buttonsContainer) return;
  
  buttonsContainer.innerHTML = savedPeople.map(person => `
    <button type="button" 
      class="person-btn" 
      data-person-id="${person.id}"
      data-group="${groupKey}"
      onmouseover="this.style.borderColor='#4CAF50'"
      onmouseout="if(!this.classList.contains('active')) this.style.borderColor='#ddd'"
    >
      ${person.name}
    </button>
  `).join('');
  
  setupPersonButtonListeners(groupKey);
}

function setupPersonSelectionListeners(groupSources, grouped) {
  Object.keys(groupSources).forEach(groupKey => {
    if (groupSources[groupKey] !== "localStorage") return;
    setupPersonButtonListeners(groupKey);
  });
}

if (typeof window !== 'undefined') {
  window.refreshPersonButtons = refreshPersonButtons;
}


function setupReuseDataListeners() {
  if (window._reuseDataClickHandler) {
    document.removeEventListener('click', window._reuseDataClickHandler);
  }
  
  const activeSection = document.querySelector('.form-section.active');
  if (!activeSection) return;
  
  const triggers = activeSection.querySelectorAll('.reuse-dropdown-trigger');
  triggers.forEach(trigger => {
    const oldHandler = trigger._clickHandler;
    if (oldHandler) {
      trigger.removeEventListener('click', oldHandler);
    }
    const handler = (e) => {
      e.preventDefault();
      e.stopPropagation();
      
      const dropdownId = trigger.getAttribute('data-dropdown-id');
      const menu = document.getElementById(dropdownId);
      
      if (!menu) return;
      document.querySelectorAll('.reuse-dropdown-menu').forEach(m => {
        if (m.id !== dropdownId) {
          m.style.display = 'none';
        }
      });
      
      const isVisible = menu.style.display === 'block';
      menu.style.display = isVisible ? 'none' : 'block';
    };
    
    trigger._clickHandler = handler;
    trigger.addEventListener('click', handler);
  });
  
  window._reuseDataClickHandler = (e) => {
    if (!e.target.closest('.custom-reuse-dropdown')) {
      document.querySelectorAll('.reuse-dropdown-menu').forEach(menu => {
        menu.style.display = 'none';
      });
    }
  };
  document.addEventListener('click', window._reuseDataClickHandler);
  
  const options = activeSection.querySelectorAll('.reuse-option');
  options.forEach(option => {
    const oldHandler = option._clickHandler;
    if (oldHandler) {
      option.removeEventListener('click', oldHandler);
    }
    
    const handler = (e) => {
      e.stopPropagation();
      
      const value = option.getAttribute('data-value');
      const menu = option.closest('.reuse-dropdown-menu');
      const trigger = menu.previousElementSibling;
      const selectedText = trigger.querySelector('.selected-text');
      const targetGroup = menu.getAttribute('data-target-group');
      const targetSubgroup = menu.getAttribute('data-target-subgroup');
      const targetSuffix = menu.getAttribute('data-target-suffix');

      selectedText.textContent = option.querySelector('span').textContent;
      menu.style.display = 'none';
      
      if (!value) {
        window.stateManager.setFormDataReused(false);
        return;
      }
      
      const [fileName, sourceGroupKey] = value.split('|');
      
      if (!fileName || !sourceGroupKey) {
        return;
      }
      
      const sourceData = window.sessionStorageManager.getMenGroupData(fileName, sourceGroupKey);
      
      if (!sourceData) {
        return;
      }
      
      window.stateManager.addReusedGroup(targetSubgroup);
      window.stateManager.setReusedGroupSource(targetSubgroup, {
        sourceFileName: fileName,
        sourceGroupKey: sourceGroupKey,
        sourceData: sourceData
      });
      
      fillFormWithMenData(sourceData, targetSuffix);
    };
    
    option._clickHandler = handler;
    option.addEventListener('click', handler);
  });
  
  const deleteButtons = activeSection.querySelectorAll('.delete-reuse-btn');
  deleteButtons.forEach(btn => {
    const oldHandler = btn._clickHandler;
    if (oldHandler) {
      btn.removeEventListener('click', oldHandler);
    }
    
    const handler = async (e) => {
      e.stopPropagation();
      e.preventDefault();
      
      const fileName = btn.getAttribute('data-file-name');
      const groupKey = btn.getAttribute('data-group-key');
      
      const confirmed = await new Promise((resolve) => {
        showConfirm(
          'Xóa dữ liệu này khỏi danh sách tái sử dụng?',
          () => resolve(true),
          () => resolve(false)
        );
      });
      
      if (!confirmed) return;
      if (window.sessionStorageManager) {
        const allData = window.sessionStorageManager.getAllSessionData();
        if (allData[fileName] && allData[fileName].dataGroups) {
          delete allData[fileName].dataGroups[groupKey];
          if (Object.keys(allData[fileName].dataGroups).length === 0) {
            delete allData[fileName];
          }
          sessionStorage.setItem('theword_session_data', JSON.stringify(allData));
        }
      }
      const option = btn.closest('.reuse-option');
      option.remove();
      showSuccess('Đã xóa dữ liệu');
    };
    
    btn._clickHandler = handler;
    btn.addEventListener('click', handler);
  });
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

function fillFormWithMenData(groupData, targetSuffix) {
  const hasLoaiDatF = Object.keys(groupData).some(key => key === 'Loai_Dat_F');
  populateDynamicOptions(groupData, targetSuffix);
  fillLandTypeFields(groupData, true);
  
  Object.keys(groupData).forEach(fieldName => {
    const value = groupData[fieldName];
    const placeholder = targetSuffix ? `${fieldName}${targetSuffix}` : fieldName;
    
    if (fieldName.includes('Address') && value && typeof value === 'string') {
      fillAddressField(placeholder, value);
      return;
    }
    
    if (fieldName === 'Loai_Dat_D' || fieldName === 'Loai_Dat_F' || fieldName === 'Loai_Dat') {
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

function sortGenericFields(items) {
  return items.sort((a, b) => {
    const aOrder = a.def?.order || 999;
    const bOrder = b.def?.order || 999;
    return aOrder - bOrder;
  });
}

function collectGenericFormData() {
  const data = {};
  document.querySelectorAll('.person-buttons').forEach(buttonContainer => {
    const groupKey = buttonContainer.getAttribute('data-group');
    const suffix = buttonContainer.getAttribute('data-suffix');
    const activeButton = buttonContainer.querySelector('.person-btn.active');
    
    if (activeButton && groupKey) {
      const personId = activeButton.getAttribute('data-person-id');
      const person = window.getPersonById ? window.getPersonById(personId) : null;
      if (person && person.data) {
        Object.keys(person.data).forEach(key => {
          const placeholder = suffix ? `${key}${suffix}` : key;
          data[placeholder] = person.data[key];
          if (key === 'Gender' && person.data[key]) {
            const sexPh = suffix ? `Sex${suffix}` : 'Sex';
            if (person.data[key] === 'Ông') {
              data[sexPh] = 'Nam';
            } else if (person.data[key] === 'Bà') {
              data[sexPh] = 'Nữ';
            }
          }
        });
      }
    }
  });
  
  document.querySelectorAll('input[data-ph], select[data-ph], textarea[data-ph]').forEach(el => {
    const ph = el.getAttribute('data-ph');
    if (!ph) return;
    let value = el.value.trim();
    if (ph === 'Money' && value) {
      const rawMoney = window.REGEX_HELPERS.removeNonDigits(value);
      if (rawMoney) {
        if (!value.includes(',')) {
          value = window.formatWithCommas ? window.formatWithCommas(rawMoney) : rawMoney;
          el.value = value;
        }
        const moneyText = window.numberToVietnameseWords ? window.numberToVietnameseWords(rawMoney) : "";
        if (moneyText) data['MoneyText'] = moneyText;
      }
    }
    
    const nameMatch = ph.match(/^Name(\d+)$/);
    if (nameMatch && value) {
      const number = nameMatch[1];
      const nameTKey = `NameT${number}`;
      const nameT = window.toTitleCase ? window.toTitleCase(value.trim()) : value.trim();
      if (nameT) {
        data[nameTKey] = nameT;
        const nameTField = document.querySelector(`[data-ph="${nameTKey}"]`);
        if (nameTField) {
          nameTField.value = nameT;
        }
      }
    }
    
    if (ph === 'S' && value) {
      const rawArea = value.replace(/,/g, '');
      if (rawArea) {
        data[ph] = rawArea;
        const sText = window.numberToAreaWords ? window.numberToAreaWords(rawArea) : "";
        if (sText) data['S_Text'] = sText;
        value = rawArea;
      }
    }
    
    const landTypeSizeContainer = el.closest('.land-type-size-container');
    if (el.classList.contains('tag-input') && landTypeSizeContainer) {
      if (!value || value.trim() === '') {
        const tagsWrapper = landTypeSizeContainer.querySelector('.tags-wrapper');
        if (tagsWrapper) {
          const tags = tagsWrapper.querySelectorAll('.land-type-tag');
          if (tags.length > 0) {
            const tagValues = [];
            tags.forEach(tagEl => {
              const codeSpan = tagEl.querySelector('.tag-code');
              const areaSpan = tagEl.querySelector('.tag-area');
              if (codeSpan) {
                const code = codeSpan.textContent.trim();
                if (code) {
                  let area = '';
                  if (areaSpan) {
                    const areaText = areaSpan.textContent.trim();
                    const areaMatch = areaText.match(/(\d+(?:\.\d+)?)/);
                    area = areaMatch ? areaMatch[1] : '';
                  }
                  if (area) {
                    tagValues.push(`${code} ${area}`);
                  } else {
                    tagValues.push(code);
                  }
                }
              }
            });
            if (tagValues.length > 0) {
              value = tagValues.join('; ');
            }
          }
        }
      }
      
      if (value && value.trim()) {
        const pairs = value.split(';').map(p => p.trim()).filter(Boolean);
        const pairsWithArea = pairs.filter(p => /\d/.test(p));
        if (pairsWithArea.length === 0 && pairs.length > 0) {
          value = pairs.join('; ');
        } else {
          const formatted = pairsWithArea.map(pair => {
            const match = pair.match(/^([A-Z]+)\s+(\d+(?:\.\d+)?)/);
            if (match) {
              return `${match[2]}m2 ${match[1]}`;
            }
            return pair;
          }).join('; ');
          value = formatted || pairs.join('; '); 
        }
        
        if (ph === 'Loai_Dat_F' && !data['Loai_Dat']) {
          const codes = pairs.map(pair => {
            const match = pair.match(/^([A-Z]+)/);
            return match ? match[1] : '';
          }).filter(Boolean);
          if (codes.length > 0) {
            data['Loai_Dat'] = codes.join('+');
          }
        }
      }
    }
    
    if (el.classList.contains('date-picker') && window.formatInputValue) {
      value = window.formatInputValue(value, ph, { type: 'date' });
    }
    
    if (ph.includes('CCCD') && value) {
      const digits = window.REGEX_HELPERS.removeNonDigits(value);
      if (window.REGEX.CCCD_PATTERN.test(digits)) {
        value = window.formatCCCD ? window.formatCCCD(digits) : digits;
      }
    }
    
    if (ph.includes('SDT') && value) {
      const digits = window.REGEX_HELPERS.removeNonDigits(value);
      if (window.REGEX.PHONE_PATTERN.test(digits)) {
        value = window.formatPhoneNumber ? window.formatPhoneNumber(digits) : digits;
      }
    }
    
    if (ph.includes('MST') && value) {
      const digits = window.REGEX_HELPERS.removeNonDigits(value);
      value = digits;
    }
    
    if (ph.includes('Gender') && value) {
      const sexPh = ph.replace('Gender', 'Sex');
      if (value === 'Ông') {
        data[sexPh] = 'Nam';
      } else if (value === 'Bà') {
        data[sexPh] = 'Nữ';
      }
    }
    
    if (value !== '' && !window._autoFilledLandFields?.has(ph)) {
      data[ph] = value;
    }
  });
  
  document.querySelectorAll('.address-group').forEach(addressGroup => {
    const provinceSelect = addressGroup.querySelector('select[data-level="province"]');
    const districtSelect = addressGroup.querySelector('select[data-level="district"]');
    const wardSelect = addressGroup.querySelector('select[data-level="ward"]');
    const villageSelect = addressGroup.querySelector('select[data-level="village"]');
    
    if (!provinceSelect) return;
    const mainId = provinceSelect.getAttribute('data-main');
    if (!mainId) return;
    const phMatch = mainId.match(/input-([^-]+)/);
    if (!phMatch) return;
    const ph = phMatch[1];
    const parts = [];
    if (villageSelect && villageSelect.value) parts.push(villageSelect.value);
    if (wardSelect && wardSelect.value) parts.push(wardSelect.value);
    if (districtSelect && districtSelect.value) parts.push(districtSelect.value);
    if (provinceSelect && provinceSelect.value) parts.push(provinceSelect.value);
    data[ph] = parts.join(', ');
  });
  generateAllLandTypeFormats(data);
  
  return data;
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

if (typeof window !== 'undefined') {
  window.renderGenericForm = renderGenericForm;
  window.collectGenericFormData = collectGenericFormData;
  window.idToPhGeneric = idToPhGeneric;
  window.setupEditableSelectInput = setupEditableSelectInput;
  window.renderDropdownOptions = renderDropdownOptions;
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    renderGenericForm,
    collectGenericFormData
  };
}
