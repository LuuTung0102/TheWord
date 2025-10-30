/**
 * ✅ SINGLE SOURCE OF TRUTH ARCHITECTURE
 * 
 * Hệ thống sử dụng config.json làm nguồn dữ liệu duy nhất cho:
 * 1. UI rendering (hiển thị dấu * cho required fields)
 * 2. Form validation (kiểm tra fields trước khi xuất)
 * 
 * Khi thêm/sửa field:
 * - Chỉnh config.json: "required": true/false
 * - UI tự động cập nhật (có/không dấu *)
 * - Validator tự động sync (validate/skip)
 * 
 * Không cần hard-code required fields trong UI hay validator!
 */

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
  
  // ✅ Single source of truth: Read required from config.json
  // This is used to add class="required" to labels → CSS shows red asterisk (*)
  // Validator (formValidator.js) reads the SAME config.json to check validation
  const isRequired = fieldDef.required === true;
  const requiredClass = isRequired ? ' class="required"' : '';
  
  const hiddenStyle = isHidden ? 'style="display: none;"' : '';
  
  const wrapperStart = `<div class="field-wrapper" ${hiddenStyle}>`;
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
    // Address with province/district/ward/village dropdowns
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
    inputHtml = `
      ${wrapperStart}
      <label for="${safeId}"${requiredClass}><b>${label}</b></label>
      <input type="text" id="${safeId}" data-ph="${ph}" class="input-field" placeholder="${placeholder}" ${maxLength ? `maxlength="${maxLength}"` : ''} />
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
      <input type="tel" id="${safeId}" data-ph="${ph}" class="input-field" placeholder="${placeholder}" />
      ${wrapperEnd}
    `;
  } else if (type === "email") {
    inputHtml = `
      ${wrapperStart}
      <label for="${safeId}"${requiredClass}><b>${label}</b></label>
      <input type="email" id="${safeId}" data-ph="${ph}" class="input-field" placeholder="${placeholder}" />
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

/**
 * Render form từ config
 */
async function renderGenericForm(placeholders, config, folderPath) {
  console.log("🎨 Rendering GENERIC form", { placeholders, config });
  window.__formDataReused = false;
  window.__reusedGroups = new Set(); // Track các group đã reuse
  window.__reusedGroupSources = new Map(); // Track source của các group đã reuse
  
  document.querySelectorAll('input[data-ph], select[data-ph], textarea[data-ph]').forEach(el => {
    el.value = '';
  });
  
  // 🗑️ CLEANUP old event listeners FIRST
  if (typeof window.cleanupAllEventListeners === 'function') {
    window.cleanupAllEventListeners();
  }
  
  // 🗑️ HIDE OLD TASKBAR (from formHandler.js)
  const oldTaskbar = document.getElementById('taskbarContainer');
  if (oldTaskbar) {
    oldTaskbar.style.display = 'none';
  }
  
  const area = document.getElementById("formArea");
  area.innerHTML = "";
  idToPhGeneric = {};
  window.idToPhGeneric = idToPhGeneric;

  if (!config || !config.groups) {
    console.error("❌ Invalid config - missing groups");
    return;
  }

  // Build placeholder mapping
  // ✅ CRITICAL: Pass actual placeholders to only map existing ones
  const phMapping = window.buildPlaceholderMapping(config, placeholders);
  const groupLabels = window.getGroupLabels(config);
  const subgroupLabels = window.getSubgroupLabels(config);

  // Group placeholders
  const grouped = {};
  placeholders.forEach(ph => {
    const def = phMapping[ph];
    if (!def) {
      console.warn(`⚠️ Placeholder ${ph} not in mapping (not in schema or filtered out)`);
      return;
    }
    
    const groupKey = def.group;
    const subKey = def.subgroup;
    
    if (!grouped[groupKey]) grouped[groupKey] = {};
    if (!grouped[groupKey][subKey]) grouped[groupKey][subKey] = [];
    
    grouped[groupKey][subKey].push({ ph, def });
  });

  console.log("📊 Grouped placeholders:", grouped);

  // Get group order từ config (new JSON format)
  const groupOrder = config.groups
    .sort((a, b) => (a.order || 999) - (b.order || 999))
    .map(group => group.id);
  
  // ✅ Track visible state of subgroups
  // ⚠️ CRITICAL: Reset visibleSubgroups when rendering new form
  // Only reset visibleSubgroups when loading a NEW file (not when re-rendering)
  // When re-rendering after clicking "Thêm" button, preserve existing visibleSubgroups
  if (!window.visibleSubgroups || window.visibleSubgroups.size === 0) {
    window.visibleSubgroups = new Set();
    console.log('🔄 Initialize visibleSubgroups for new form');
    
    // Initialize visible subgroups from fieldMappings
    if (config.fieldMappings) {
      config.fieldMappings.forEach(mapping => {
        if (mapping.subgroups && mapping.subgroups.length > 0) {
          mapping.subgroups.forEach((subgroup, index) => {
            const subgroupId = typeof subgroup === 'string' ? subgroup : subgroup.id;
            
            // Check explicit visible property
            const hasExplicitVisible = typeof subgroup === 'object' && subgroup.hasOwnProperty('visible');
            
            if (hasExplicitVisible) {
              // Use explicit visible value from config
              if (subgroup.visible === true) {
                window.visibleSubgroups.add(subgroupId);
              }
            } else {
              // Default: Only first subgroup is visible
              if (index === 0) {
                window.visibleSubgroups.add(subgroupId);
                console.log(`✅ Default visible (first): ${subgroupId}`);
              } else {
                console.log(`⏭️ Default hidden (not first): ${subgroupId}`);
              }
            }
          });
        }
      });
    }
  } else {
    console.log('♻️ Re-rendering with existing visibleSubgroups:', Array.from(window.visibleSubgroups));
  }
  
  console.log('✅ Current visibleSubgroups:', Array.from(window.visibleSubgroups));

  // 🎨 RENDER TASKBAR
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

  // Check if any group has localStorage source
  const groupSources = {};
  if (config.fieldMappings) {
    config.fieldMappings.forEach(mapping => {
      if (mapping.source === "localStorage") {
        groupSources[mapping.group] = "localStorage";
      }
    });
  }


  // Render each group
  for (let index = 0; index < groupOrder.length; index++) {
    const groupKey = groupOrder[index];
    if (!grouped[groupKey]) continue;

    const sectionDiv = document.createElement("div");
    sectionDiv.className = `form-section ${index === 0 ? 'active' : ''}`;
    sectionDiv.id = `section-${groupKey}`;

    const groupDiv = document.createElement("div");
    groupDiv.className = "form-group";
    
    // ✅ Header với nút "Thêm" (nếu có subgroups ẩn)
    const groupMapping = config.fieldMappings ? config.fieldMappings.find(m => m.group === groupKey) : null;
    const hiddenSubgroups = groupMapping && groupMapping.subgroups ? groupMapping.subgroups.filter(sg => {
      const subId = typeof sg === 'string' ? sg : sg.id;
      // ✅ Chỉ check visible status từ window.visibleSubgroups
      // Không check grouped vì subgroup có thể không có placeholders nhưng vẫn cần button "Thêm"
      return !window.visibleSubgroups.has(subId);
    }) : [];
    
    if (hiddenSubgroups.length > 0) {
      const firstHidden = hiddenSubgroups[0];
      const subLabel = typeof firstHidden === 'string' ? firstHidden : (firstHidden.label || firstHidden.id);
      
      groupDiv.innerHTML = `
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 15px;">
          <h3 style="margin: 0;">${groupLabels[groupKey] || groupKey}</h3>
          <button class="add-subgroup-btn" data-group="${groupKey}" style="
            padding: 8px 16px;
            background: #2196F3;
            color: white;
            border: none;
            border-radius: 6px;
            cursor: pointer;
            font-size: 13px;
            font-weight: 500;
          ">
            ➕ Thêm ${subLabel}
          </button>
        </div>
      `;
    } else {
      groupDiv.innerHTML = `<h3>${groupLabels[groupKey] || groupKey}</h3>`;
    }

    // ✅ Check if this group uses localStorage
    if (groupSources[groupKey] === "localStorage") {
      console.log(`📂 Group ${groupKey} uses localStorage`);
      
      // Get suffix for this group from fieldMappings
      let suffix = '';
      if (config.fieldMappings) {
        const mapping = config.fieldMappings.find(m => m.group === groupKey && m.source === "localStorage");
        if (mapping && mapping.suffixes && mapping.suffixes.length > 0) {
          suffix = mapping.suffixes[0];
        }
      }
      
      // Render buttons to select from saved people
      console.log(`🔍 Loading saved people for group ${groupKey}...`);
      console.log(`🔍 window.loadSavedPeople exists? ${!!window.loadSavedPeople}`);
      
      // ✅ loadSavedPeople is now async, so we await it
      const savedPeople = window.loadSavedPeople ? await window.loadSavedPeople() : [];
      console.log(`🔍 Loaded ${savedPeople.length} saved people:`, savedPeople);
      
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
                  style="
                    padding: 15px 20px;
                    margin: 10px 10px 10px 0;
                    font-size: 16px;
                    font-weight: normal;
                    border: 2px solid #ddd;
                    border-radius: 8px;
                    background: white;
                    color: #333;
                    cursor: pointer;
                    transition: all 0.3s ease;
                    min-width: 150px;
                  "
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
      // Normal form rendering - Subgroups only render visible ones
      // ✅ Lấy từ config thay vì grouped để bao gồm cả subgroups không có placeholders
      const allSubgroups = groupMapping && groupMapping.subgroups ? groupMapping.subgroups : [];
      const subgroupKeys = allSubgroups.map(sg => typeof sg === 'string' ? sg : sg.id);
      
      subgroupKeys.forEach(subKey => {
        // ✅ Skip if subgroup is not visible
        if (!window.visibleSubgroups.has(subKey)) return;
        
        const subgroupDiv = document.createElement("div");
        subgroupDiv.className = "form-subgroup";
        subgroupDiv.style.cssText = `
          border: 2px solid #2196F3;
          border-radius: 8px;
          padding: 15px;
          margin-bottom: 20px;
          background: #f8fbff;
        `;
        subgroupDiv.innerHTML = `<h4 style="margin-top: 0; color: #1976D2;">${subgroupLabels[subKey] || subKey}</h4>`;
        
        // ✅ Thêm dropdown "Tái sử dụng dữ liệu" cho từng subgroup
        const reuseDropdownHtml = renderReuseDataDropdown(groupKey, subKey, config);
        if (reuseDropdownHtml) {
          subgroupDiv.innerHTML += reuseDropdownHtml;
        }

        // ✅ Lấy items từ grouped (có thể rỗng nếu subgroup không có placeholders trong template)
        const items = (grouped[groupKey] && grouped[groupKey][subKey]) ? grouped[groupKey][subKey] : [];
        
        // Sort fields
        const sortedItems = sortGenericFields(items);

      // Render 3 cột
      for (let i = 0; i < sortedItems.length; i += 3) {
        const rowDiv = document.createElement("div");
        rowDiv.className = "form-row";
        
        for (let j = i; j < i + 3 && j < sortedItems.length; j++) {
          const { ph, def } = sortedItems[j];
          const { inputHtml } = renderGenericInputField(ph, def, groupKey, subKey);
          const cellDiv = document.createElement("div");
          cellDiv.className = "form-cell form-field";
          cellDiv.innerHTML = inputHtml;
          rowDiv.appendChild(cellDiv);
        }
        
        subgroupDiv.appendChild(rowDiv);
      }

        groupDiv.appendChild(subgroupDiv);
      });
    } // End of else (normal form rendering)

    sectionDiv.appendChild(groupDiv);
    area.appendChild(sectionDiv);
  } // End of for loop

  // ✅ Setup "Add Subgroup" buttons
  document.querySelectorAll('.add-subgroup-btn').forEach(btn => {
    btn.addEventListener('click', async () => {
      const groupKey = btn.dataset.group;
      
      // Tìm groupMapping để lấy danh sách subgroups
      const groupMapping = config.fieldMappings ? config.fieldMappings.find(m => m.group === groupKey) : null;
      
      if (groupMapping && groupMapping.subgroups) {
        // Tìm subgroup ẩn TIẾP THEO
        const nextHidden = groupMapping.subgroups.find(sg => {
          const subId = typeof sg === 'string' ? sg : sg.id;
          // ✅ Chỉ check visible status, không cần check grouped
          return !window.visibleSubgroups.has(subId);
        });
        
        if (nextHidden) {
          const subgroupId = typeof nextHidden === 'string' ? nextHidden : nextHidden.id;
          window.visibleSubgroups.add(subgroupId);
          
          // Re-render toàn bộ form để subgroup mới xuất hiện
          await renderGenericForm(placeholders, config, folderPath);
          
          // Auto scroll to the new subgroup
          setTimeout(() => {
            const newSubgroup = document.querySelector(`[data-subgroup-id="${subgroupId}"]`);
            if (newSubgroup) {
              newSubgroup.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }
          }, 100);
        }
      }
    });
  });

  // Setup taskbar navigation
  document.querySelectorAll('.taskbar-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const targetSection = btn.dataset.section;
      
      // Update active button
      document.querySelectorAll('.taskbar-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      
      // Show target section, hide others
      document.querySelectorAll('.form-section').forEach(section => {
        if (section.id === `section-${targetSection}`) {
          section.classList.add('active');
        } else {
          section.classList.remove('active');
        }
      });
    });
  });

  // Setup event listeners
  // ✅ Use requestAnimationFrame + setTimeout for proper DOM rendering
  requestAnimationFrame(() => {
    setTimeout(() => {
      if (typeof window.setupFormEventListeners === 'function') {
        window.setupFormEventListeners();
      }
      if (typeof window.reSetupAllInputs === 'function') {
        console.log('🔧 Setting up all inputs for generic form...');
        window.reSetupAllInputs();
      }
      
      // ✅ Setup person selection dropdowns
      setupPersonSelectionListeners(groupSources, grouped);
      
      // ✅ Setup reuse data dropdowns
      setupReuseDataListeners();
    }, 100); // Reduced from 500ms since we have requestAnimationFrame
  });
  
  console.log("✅ Generic form rendered");
}

/**
 * Render dropdown để tái sử dụng dữ liệu đã điền
 * @param {string} groupKey - BCN, NCN, LAND...
 * @param {string} subKey - MEN1, MEN2, INFO...
 * @param {object} config - Config object
 */
function renderReuseDataDropdown(groupKey, subKey, config) {
  // Lấy suffix của subgroup này (nếu có)
  let targetSuffix = '';
  if (config.fieldMappings) {
    const mapping = config.fieldMappings.find(m => m.group === groupKey);
    if (mapping && mapping.suffixes && mapping.suffixes.length > 0) {
      // Tìm index của subKey trong subgroups
      const subgroupIndex = mapping.subgroups ? 
        mapping.subgroups.findIndex(sg => (typeof sg === 'string' ? sg : sg.id) === subKey) : -1;
      
      if (subgroupIndex >= 0 && subgroupIndex < mapping.suffixes.length) {
        targetSuffix = mapping.suffixes[subgroupIndex];
      }
    }
  }
  
  // Lấy tất cả groups đã lưu
  const allGroups = window.sessionStorageManager ? 
    window.sessionStorageManager.getAvailableMenGroups() : [];
  
  if (allGroups.length === 0) return null;
  
  // ✅ Lọc groups phù hợp:
  // - Nếu là MEN (có suffix) → chỉ hiển thị MEN groups
  // - Nếu là LAND/INFO (không có suffix) → chỉ hiển thị groups khác (không bao gồm MEN và OTHER)
  const availableGroups = allGroups.filter(group => {
    // ❌ Luôn loại bỏ group "OTHER"
    if (group.groupKey === 'OTHER') return false;
    
    if (targetSuffix) {
      // Subgroup này có suffix → chỉ lấy MEN groups
      return group.groupKey.startsWith('MEN');
    } else {
      // Subgroup này không có suffix → chỉ lấy groups khác (trừ MEN và OTHER)
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
  
  // Tạo unique ID cho dropdown này
  const dropdownId = `reuse-${groupKey}-${subKey}-${Date.now()}`;
  
  return `
    <div class="reuse-data-section" style="margin-bottom: 15px; padding: 12px; background: #e8f5e9; border-radius: 6px; border-left: 4px solid #4CAF50;">
      <label style="display: block; margin-bottom: 8px; font-weight: bold; color: #2e7d32;">
        🔄 Tái sử dụng dữ liệu:
      </label>
      <select 
        id="${dropdownId}"
        class="reuse-data-select" 
        data-target-group="${groupKey}"
        data-target-subgroup="${subKey}"
        data-target-suffix="${targetSuffix}"
        style="width: 100%; padding: 10px; font-size: 14px; border: 2px solid #4CAF50; border-radius: 4px; background: white; cursor: pointer;"
      >
        <option value="">-- Nhập mới --</option>
        ${availableGroups.map(group => `
          <option value="${group.fileName}|${group.menKey}">
            ${group.displayName}
          </option>
        `).join('')}
      </select>
    </div>
  `;
}

/**
 * Setup event listeners for person selection buttons
 */
function setupPersonSelectionListeners(groupSources, grouped) {
  Object.keys(groupSources).forEach(groupKey => {
    if (groupSources[groupKey] !== "localStorage") return;
    
    // Get all person buttons for this group
    const buttonsContainer = document.getElementById(`person-buttons-${groupKey}`);
    if (!buttonsContainer) return;
    
    const buttons = buttonsContainer.querySelectorAll('.person-btn');
    
    buttons.forEach(button => {
      button.addEventListener('click', (e) => {
        const clickedButton = e.currentTarget;
        const personId = clickedButton.getAttribute('data-person-id');
        const previewDiv = document.getElementById(`preview-${groupKey}`);
        const previewContent = document.getElementById(`preview-content-${groupKey}`);
        
        // Reset all buttons in this group
        buttons.forEach(btn => {
          btn.classList.remove('active');
          btn.style.fontWeight = 'normal';
          btn.style.borderColor = '#ddd';
          btn.style.background = 'white';
          btn.style.color = '#333';
        });
        
        // Highlight selected button
        clickedButton.classList.add('active');
        clickedButton.style.fontWeight = 'bold';
        clickedButton.style.borderColor = '#4CAF50';
        clickedButton.style.background = '#4CAF50';
        clickedButton.style.color = 'white';
        
        // Set flag: group này được reuse từ localStorage
        if (!window.__reusedGroups) window.__reusedGroups = new Set();
        window.__reusedGroups.add(`localStorage:${groupKey}`); // Prefix để phân biệt
        
        // Get person data
        const person = window.getPersonById ? window.getPersonById(personId) : null;
        
        if (!person) {
          previewDiv.style.display = 'none';
          return;
        }
        
        // Display preview
        let html = `<p style="margin-bottom: 10px; font-size: 16px;"><strong>📋 ${person.name}</strong></p>`;
        html += '<div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 10px;">';
        
        Object.keys(person.data).forEach(key => {
          const value = person.data[key];
          if (value) {
            html += `<div style="padding: 8px; background: white; border-radius: 4px;"><strong>${key}:</strong> ${value}</div>`;
          }
        });
        
        html += '</div>';
        previewContent.innerHTML = html;
        previewDiv.style.display = 'block';
        
        console.log(`✅ Selected person: ${person.name} for group ${groupKey}`);
      });
    });
  });
}

/**
 * Setup event listeners for reuse data dropdowns
 */
function setupReuseDataListeners() {
  document.querySelectorAll('.reuse-data-select').forEach(select => {
    select.addEventListener('change', (e) => {
      const value = e.target.value;
      const targetGroup = e.target.getAttribute('data-target-group');
      const targetSubgroup = e.target.getAttribute('data-target-subgroup'); // MEN1, MEN2, LAND...
      const targetSuffix = e.target.getAttribute('data-target-suffix');
      
      console.log(`🔄 Reuse data selected: ${value} for ${targetSubgroup} (suffix ${targetSuffix})`);
      
      if (!value) {
        // User chọn "Nhập mới" → Xóa flag
        window.__formDataReused = false;
        return;
      }
      
      // Parse value: "fileName|sourceGroupKey"
      const [fileName, sourceGroupKey] = value.split('|');
      
      if (!fileName || !sourceGroupKey) {
        console.error('❌ Invalid reuse data value:', value);
        return;
      }
      
      // Lấy dữ liệu từ session storage
      const sourceData = window.sessionStorageManager.getMenGroupData(fileName, sourceGroupKey);
      
      if (!sourceData) {
        console.error(`❌ No data found for ${fileName} - ${sourceGroupKey}`);
        return;
      }
      
      console.log(`✅ Loading data: ${sourceGroupKey} (${fileName}) → ${targetSubgroup}`);
      console.log(`   Source data:`, sourceData);
      
      // Set flag: targetSubgroup được reuse từ session storage
      if (!window.__reusedGroups) window.__reusedGroups = new Set();
      window.__reusedGroups.add(targetSubgroup); // Track TARGET groupKey (MEN1, MEN2, LAND...)
      
      // Track source: targetGroupKey → {sourceFileName, sourceGroupKey, sourceData}
      if (!window.__reusedGroupSources) window.__reusedGroupSources = new Map();
      window.__reusedGroupSources.set(targetSubgroup, { 
        sourceFileName: fileName, 
        sourceGroupKey: sourceGroupKey,  // MEN7, MEN2, LAND...
        sourceData: sourceData 
      });
      
      // Fill form với dữ liệu
      fillFormWithMenData(sourceData, targetSuffix);
    });
  });
}

/**
 * Fill form với dữ liệu group (MEN hoặc LAND/INFO...)
 * @param {object} groupData - {Name: "A", CCCD: "123", Address: "Xã ABC, H. XYZ, T. DEF"}
 * @param {string} targetSuffix - "1", "2", "7"... (hoặc "" cho LAND/INFO)
 */
function fillFormWithMenData(groupData, targetSuffix) {
  Object.keys(groupData).forEach(fieldName => {
    const value = groupData[fieldName];
    const placeholder = targetSuffix ? `${fieldName}${targetSuffix}` : fieldName;
    
    // Xử lý đặc biệt cho Address (address-select với 4 dropdowns)
    if (fieldName.includes('Address') && value && typeof value === 'string') {
      fillAddressField(placeholder, value);
      return;
    }
    
    // Tìm input/select/textarea có data-ph
    const element = document.querySelector(`[data-ph="${placeholder}"]`);
    
    if (element) {
      element.value = value;
      element.dispatchEvent(new Event('change', { bubbles: true }));
      element.dispatchEvent(new Event('blur', { bubbles: true }));
    }
  });
}

/**
 * Fill address field (4 dropdowns: province, district, ward, village)
 * @param {string} placeholder - "Address1", "Address7", "AddressD"
 * @param {string} addressString - "Xã Ea Bông, H. Krông A Na, T. Đắk Lắk"
 */
function fillAddressField(placeholder, addressString) {
  const provinceSelect = document.querySelector(`select[data-main*="${placeholder}"][data-level="province"]`);
  if (!provinceSelect) return;
  
  const addressGroup = provinceSelect.closest('.address-group');
  if (!addressGroup) return;
  
  const parts = addressString.split(',').map(p => p.trim());
  if (parts.length < 3) return;
  
  const districtSelect = addressGroup.querySelector('select[data-level="district"]');
  const wardSelect = addressGroup.querySelector('select[data-level="ward"]');
  const villageInput = addressGroup.querySelector('input[data-level="village"]');
  
  // Set province
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
      const wardName = parts[0];
      const wardOption = Array.from(wardSelect.options).find(opt => 
        opt.text.includes(wardName.replace('Xã ', '').replace('Phường ', '').replace('TT. ', ''))
      );
      if (wardOption) {
        wardSelect.value = wardOption.value;
        wardSelect.dispatchEvent(new Event('change', { bubbles: true }));
      }
      
      if (parts.length === 4 && villageInput) {
        villageInput.value = parts[0];
      }
    }, 100);
  }, 100);
}

/**
 * Sort fields theo field order
 */
function sortGenericFields(items) {
  return items.sort((a, b) => {
    // ✅ Chỉ dùng order từ fieldDef (đã được load từ config.json)
    const aOrder = a.def?.order || 999;
    const bOrder = b.def?.order || 999;
    
    return aOrder - bOrder;
  });
}

/**
 * Collect data từ generic form
 */
function collectGenericFormData() {
  const data = {};
  
  // Thu thập dữ liệu từ localStorage buttons
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
        });
      }
    }
  });
  
  // Thu thập dữ liệu từ các input/select/textarea có data-ph
  document.querySelectorAll('input[data-ph], select[data-ph], textarea[data-ph]').forEach(el => {
    const ph = el.getAttribute('data-ph');
    if (!ph) return;
    
    let value = el.value.trim();
    
    if (ph === 'Money' && value) {
      const rawMoney = value.replace(/\D/g, '');
      if (rawMoney) {
        if (!value.includes(',')) {
          value = window.formatWithCommas ? window.formatWithCommas(rawMoney) : rawMoney;
          el.value = value;
        }
        const moneyText = window.numberToVietnameseWords ? window.numberToVietnameseWords(rawMoney) : "";
        if (moneyText) data['MoneyText'] = moneyText;
      }
    }
    
    if (el.classList.contains('date-picker') && window.formatInputValue) {
      value = window.formatInputValue(value, ph, { type: 'date' });
    }
    
    data[ph] = value;
  });
  
  // ✅ Thu thập dữ liệu địa chỉ từ các address-group
  document.querySelectorAll('.address-group').forEach(addressGroup => {
    // Tìm tất cả các select trong group này
    const provinceSelect = addressGroup.querySelector('select[data-level="province"]');
    const districtSelect = addressGroup.querySelector('select[data-level="district"]');
    const wardSelect = addressGroup.querySelector('select[data-level="ward"]');
    const villageSelect = addressGroup.querySelector('select[data-level="village"]');
    
    if (!provinceSelect) return;
    
    // Lấy data-main từ province select (đây là placeholder ID)
    const mainId = provinceSelect.getAttribute('data-main');
    if (!mainId) return;
    
    // Tìm placeholder tương ứng từ mainId (vd: input-Address1-xxx => Address1)
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
  
  return data;
}

// Export
if (typeof window !== 'undefined') {
  window.renderGenericForm = renderGenericForm;
  window.collectGenericFormData = collectGenericFormData;
  window.idToPhGeneric = idToPhGeneric;
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    renderGenericForm,
    collectGenericFormData
  };
}