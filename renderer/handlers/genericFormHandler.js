function setupLandTypeSync() {
  return window.LandTypeHandlers?.setupLandTypeSync?.();
}


function generateAllLandTypeFormats(...args) {
  return window.LandTypeHandlers?.generateAllLandTypeFormats?.(...args);
}

function renderSingleSubgroup(...args){
  return window.SubgroupRenderer?.renderSingleSubgroup?.(...args); 
}

function renderReuseDataDropdown(...args){
  return window.SubgroupRenderer?.renderReuseDataDropdown?.(...args);
}

function sortGenericFields(...args){
  return window.SubgroupRenderer?.sortGenericFields?.(...args);
}

function renderGenericInputField(...args){
  return window.InputFields?.renderGenericInputField?.(...args);
}

function renderDropdownOptions(...args){
  return window.InputFields?.renderDropdownOptions?.(...args);
}

function setupEditableSelectInput(...args){
  return window.InputFields?.setupEditableSelectInput?.(...args);
}

function fillFormWithMenData(...args){
  return window.DataFiller?.fillFormWithMenData?.(...args);
}


let idToPhGeneric = {};

async function renderGenericForm(placeholders, config, folderPath) {
  
  if (window.personDataService && !window.personDataService.labelsLoaded) {
    await window.personDataService.loadPeople();
  }
  
  const expandedPlaceholders = [];
  const nameTToRemove = new Set();
  
  placeholders.forEach(ph => {
    const nameTMatch = ph.match(/^NameT(\d+)$/);
    if (nameTMatch) {
      const number = nameTMatch[1];
      const namePlaceholder = `Name${number}`;
      
      if (placeholders.includes(namePlaceholder)) {
        nameTToRemove.add(ph);
      } else {
        if (!expandedPlaceholders.includes(namePlaceholder)) {
          expandedPlaceholders.push(namePlaceholder);
        }
        nameTToRemove.add(ph);
      }
    }
  });
  
  placeholders.forEach(ph => {
    if (!nameTToRemove.has(ph)) {
      expandedPlaceholders.push(ph);
    }
  });
  
  const allPlaceholders = [...new Set([...expandedPlaceholders, ...placeholders])];
  
  window.stateManager.setRenderParams({ placeholders: expandedPlaceholders, config, folderPath });
  const phMapping = window.buildPlaceholderMapping(config, allPlaceholders);
  const groupLabels = window.getGroupLabels(config);
  const subgroupLabels = window.getSubgroupLabels(config);
  const grouped = {};
  expandedPlaceholders.forEach(ph => {
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
  
  const skipLandFields = getLandFieldsToSkip(expandedPlaceholders);
  
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
      clearBtn.title = 'Xóa tất cả dữ liệu đã lưu';
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
        
        if (window.sessionStorageManager) {
          window.sessionStorageManager.clearAllSessionData();
          window.sessionStorageManager.clearPersistedSession();
        } else {
          showError('Không thể xóa dữ liệu');
          return;
        }
        
        clearBtn.remove();
        await renderGenericForm(placeholders, config, folderPath);
        showSuccess('Đã xóa tất cả dữ liệu');
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
        const phDef = phMapping[ph];
        if (!phDef) return false;
        if (phDef.group !== groupKey) return false;
        if (suffix && suffix !== '') {
          const match = ph.match(/^([A-Za-z_]+?)(\d+)$/);
          if (match) {
            const phSuffix = match[2];
            if (phSuffix === String(suffix) && phDef.subgroup === subId) {
              return true;
            }
          }
          return false;
        } else {
          const hasNumericSuffix = /\d+$/.test(ph);
          if (!hasNumericSuffix && phDef.subgroup === subId) {
            return true;
          }
          return false;
        }
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
          const isFullWidth = def.type === 'land_type_detail' || def.type === 'textarea';
          
          if (isFullWidth) {
            const { inputHtml } = renderGenericInputField(ph, def, groupKey, subKey);
            const cellDiv = document.createElement("div");
            cellDiv.className = "form-cell form-field";
            cellDiv.innerHTML = inputHtml;
            rowDiv.appendChild(cellDiv);
            i++;
          } else {
            for (let j = 0; j < 3 && i < filteredItems.length; j++) {
              const { ph: currentPh, def: currentDef } = filteredItems[i];
              if (currentDef.type === 'land_type_detail' || currentDef.type === 'textarea') {
                break;
              }
              const { inputHtml } = renderGenericInputField(currentPh, currentDef, groupKey, subKey);
              const cellDiv = document.createElement("div");
              cellDiv.className = "form-cell form-field";
              cellDiv.innerHTML = inputHtml;
              rowDiv.appendChild(cellDiv);
              i++;
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
            const phDef = phMapping[ph];
            if (!phDef) return false;
            if (phDef.group !== groupKey) return false;
            if (suffix && suffix !== '') {
              const match = ph.match(/^([A-Za-z_]+?)(\d+)$/);
              if (match) {
                const phSuffix = match[2];
                return phSuffix === String(suffix) && phDef.subgroup === subId;
              }
              return false;
            } else {
              const hasNumericSuffix = /\d+$/.test(ph);
              if (!hasNumericSuffix && phDef.subgroup === subId) {
                return true;
              }
              return false;
            }
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
  const skipFields = new Set();
  
  const suffixes = new Set(['']);
  allPlaceholders.forEach(ph => {
    const match = ph.match(/^Loai_Dat(_[FD])?(\d+)$/);
    if (match && match[2]) {
      suffixes.add(match[2]);
    }
  });
  
  suffixes.forEach(suffix => {
    const loaiDatKey = suffix ? `Loai_Dat${suffix}` : 'Loai_Dat';
    const loaiDatFKey = suffix ? `Loai_Dat_F${suffix}` : 'Loai_Dat_F';
    const loaiDatDKey = suffix ? `Loai_Dat_D${suffix}` : 'Loai_Dat_D';
    const hasLoaiDatD = allPlaceholders.some(ph => ph === loaiDatDKey);
    const hasLoaiDatF = allPlaceholders.some(ph => ph === loaiDatFKey);
    const hasLoaiDat = allPlaceholders.some(ph => ph === loaiDatKey);
  
    if (hasLoaiDatD) {
      if (hasLoaiDatF) skipFields.add(loaiDatFKey);
      if (hasLoaiDat) skipFields.add(loaiDatKey);
    } else if (hasLoaiDatF) {
      if (hasLoaiDat) skipFields.add(loaiDatKey);
    }
  });
  
  return skipFields;
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
          window.sessionStorageManager.persistSessionToLocalStorage();
        }
      }
      
      const renderParams = window.stateManager.getRenderParams();
      if (renderParams) {
        const { placeholders, config, folderPath } = renderParams;
        await renderGenericForm(placeholders, config, folderPath);
      }
      
      showSuccess('Đã xóa dữ liệu');
    };
    btn._clickHandler = handler;
    btn.addEventListener('click', handler);
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
    const moneyMatch = ph.match(/^Money(\d*)$/);
    if (moneyMatch && value) {
      const suffix = moneyMatch[1];
      const rawMoney = window.REGEX_HELPERS.removeNonDigits(value);
      if (rawMoney) {
        if (!value.includes(',')) {
          value = window.formatWithCommas ? window.formatWithCommas(rawMoney) : rawMoney;
          el.value = value;
        }
        const moneyTextKey = suffix ? `MoneyText${suffix}` : 'MoneyText';
        const moneyText = window.numberToVietnameseWords ? window.numberToVietnameseWords(rawMoney) : "";
        if (moneyText) data[moneyTextKey] = moneyText;
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
    const sMatch = ph.match(/^S(\d*)$/);
    if (sMatch && value) {
      const suffix = sMatch[1];
      const rawArea = value.replace(/,/g, '');
      if (rawArea) {
        data[ph] = rawArea;
        const sTextKey = suffix ? `S_Text${suffix}` : 'S_Text';
        const sText = window.numberToAreaWords ? window.numberToAreaWords(rawArea) : "";
        if (sText) data[sTextKey] = sText;
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
            const containerType = landTypeSizeContainer.getAttribute('data-type');
            
            tags.forEach(tagEl => {
              const codeSpan = tagEl.querySelector('.tag-code');
              const locationSpan = tagEl.querySelector('.tag-location');
              const areaSpan = tagEl.querySelector('.tag-area');
              
              if (codeSpan) {
                const code = codeSpan.textContent.trim();
                if (code) {
                  if (containerType === 'land_type_detail') {
                    let location = '';
                    let area = '';
                    
                    if (locationSpan) {
                      const locationText = locationSpan.textContent.trim();
                      location = locationText.replace(/^-\s*/, '').trim();
                    }
                    
                    if (areaSpan) {
                      const areaText = areaSpan.textContent.trim();
                      const areaMatch = areaText.match(/(\d+(?:\.\d+)?)/);
                      area = areaMatch ? areaMatch[1] : '';
                    }
                    
                    tagValues.push(`${code}|${location}|${area}`);
                  } else {
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
        const loaiDatFMatch = ph.match(/^Loai_Dat_F(\d*)$/);
        if (loaiDatFMatch) {
          const suffix = loaiDatFMatch[1];
          const loaiDatKey = suffix ? `Loai_Dat${suffix}` : 'Loai_Dat';
          
          if (!data[loaiDatKey]) {
            const codes = pairs.map(pair => {
              const match = pair.match(/^([A-Z]+)/);
              return match ? match[1] : '';
            }).filter(Boolean);
            if (codes.length > 0) {
              data[loaiDatKey] = codes.join('+');
            }
          }
        }
      }
    }
    if (el.classList.contains('date-picker') && window.formatInputValue) {
      value = window.formatInputValue(value, ph, { type: 'date' });
    }
    
    if (el.getAttribute('data-type') === 'htsd_custom' && ph) {
      const htsdContainer = el.closest('[data-field-type="htsd_custom"]');
      
      if (htsdContainer) {
        const loai1Active = htsdContainer.querySelector('.htsd-toggle-loai1')?.classList.contains('active') || false;
        const loai2Active = htsdContainer.querySelector('.htsd-toggle-loai2')?.classList.contains('active') || false;
        
        let printMode = null;
        if (loai1Active && !loai2Active) printMode = 'loai1';
        else if (loai2Active && !loai1Active) printMode = 'loai2';
        else if (loai1Active && loai2Active) printMode = 'both';
    
        data[ph] = {
          value: value || '',
          printMode: printMode
        };
        
        return;
      }
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
    if (value !== '') {
      data[ph] = value;
    }
  });
  document.querySelectorAll('.address-group').forEach(addressGroup => {
    const provinceInput = addressGroup.querySelector('input[data-level="province"]');
    const wardInput = addressGroup.querySelector('input[data-level="ward"]');
    const villageInput = addressGroup.querySelector('input[data-level="village"]');
    if (!provinceInput) return;
    const mainId = provinceInput.getAttribute('data-main');
    if (!mainId) return;
    const phMatch = mainId.match(/input-([^-]+)/);
    if (!phMatch) return;
    const ph = phMatch[1];
    const parts = [];
    if (villageInput && villageInput.value.trim()) parts.push(villageInput.value.trim());
    if (wardInput && wardInput.value.trim()) parts.push(wardInput.value.trim());
    if (provinceInput && provinceInput.value.trim()) parts.push(provinceInput.value.trim());
    data[ph] = parts.join(', ');
  });
  
  const reusedGroupSources = window.stateManager?.getReusedGroupSources?.();
  if (reusedGroupSources && reusedGroupSources.size > 0) {
    reusedGroupSources.forEach((sourceInfo) => {
      const sourceData = sourceInfo.sourceData;
      if (sourceData) {
        if (sourceData.Loai_Dat_D && !data.Loai_Dat_D) {
          data.Loai_Dat_D = sourceData.Loai_Dat_D;
        }
        if (sourceData.Loai_Dat_F && !data.Loai_Dat_F) {
          data.Loai_Dat_F = sourceData.Loai_Dat_F;
        }
        if (sourceData.Loai_Dat && !data.Loai_Dat) {
          data.Loai_Dat = sourceData.Loai_Dat;
        }
      }
    });
  }
  generateAllLandTypeFormats(data);
  
  const ndbdToHdbdMap = {
    "Nhận chuyển nhượng quyền sử dụng đất": "Hợp đồng chuyển nhượng quyền sử dụng đất",
    "Nhận tặng cho quyền sử dụng đất": "Hợp đồng tặng cho quyền sử dụng đất",
    "Nhận thừa kế quyền sử dụng đất": "Hợp đồng thừa kế quyền sử dụng đất",
    "Nhận cấp đổi giấy chứng nhận quyền sử dụng đất": "Giấy chứng nhận quyền sử dụng đất"
  };
  
  if (data.NDBD && ndbdToHdbdMap[data.NDBD]) {
    data.HDBD = ndbdToHdbdMap[data.NDBD];
  }
  
  // Auto-generate Ngay_Full from Dia_Chi + Ngay
  if (data.Dia_Chi && data.Ngay) {
    const diaChi = data.Dia_Chi.trim();
    const ngayStr = data.Ngay.trim();
    
    const dateParts = ngayStr.split('/');
    if (dateParts.length === 3) {
      const day = dateParts[0];
      const month = dateParts[1];
      const year = dateParts[2];
      
      data.Ngay_Full = `${diaChi}, ngày ${day} tháng ${month} năm ${year}`;
    }
  }
  
  return data;
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

