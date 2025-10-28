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
  
  
  const hiddenStyle = isHidden ? 'style="display: none;"' : '';
  
  const wrapperStart = `<div class="field-wrapper" ${hiddenStyle}>`;
  const wrapperEnd = `</div>`;

  if (type === "select") {
    const options = fieldDef.options || [];
    const defaultValue = fieldDef.defaultValue || '';
    inputHtml = `
      ${wrapperStart}
      <label for="${safeId}"><b>${label}</b></label>
      <select id="${safeId}" data-ph="${ph}" class="input-field" data-default="${defaultValue}">
        <option value="">-- Chọn --</option>
        ${options.map((opt) => `<option value="${opt}" ${opt === defaultValue ? 'selected' : ''}>${opt}</option>`).join("")}
      </select>
      ${wrapperEnd}
    `;
  } else if (type === "date") {
    inputHtml = `
      ${wrapperStart}
      <label for="${safeId}"><b>${label}</b></label>
      <input type="text" id="${safeId}" data-ph="${ph}" class="date-picker input-field" placeholder="dd/mm/yyyy" />
      ${wrapperEnd}
    `;
  } else if (type === "address-select") {
    // Address with province/district/ward/village dropdowns
    inputHtml = `
      ${wrapperStart}
      <label for="${safeId}"><b>${label}</b></label>
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
      <label for="${safeId}"><b>${label}</b></label>
      <input type="text" id="${safeId}" data-ph="${ph}" class="input-field" placeholder="${placeholder}" ${maxLength ? `maxlength="${maxLength}"` : ''} />
      ${wrapperEnd}
    `;
  } else if (type === "land-type" || type === "land_type") {
    inputHtml = `
      ${wrapperStart}
      <label for="${safeId}"><b>${label}</b></label>
      <input type="text" id="${safeId}" data-ph="${ph}" class="input-field land-type-input" placeholder="${placeholder}">
      <div id="${safeId}_dropdown" class="land-type-dropdown" style="display:none; position:absolute; background:white; border:1px solid #ccc; max-height:200px; overflow-y:auto; z-index:1000; width:300px;"></div>
      ${wrapperEnd}
    `;
  } else if (type === "money" || type === "currency") {
    inputHtml = `
      ${wrapperStart}
      <label for="${safeId}"><b>${label}</b></label>
      <input type="text" id="${safeId}" data-ph="${ph}" class="input-field money-input" placeholder="${placeholder}" />
      ${wrapperEnd}
    `;
  } else if (type === "textarea") {
    const rows = fieldDef.rows || 3;
    inputHtml = `
      ${wrapperStart}
      <label for="${safeId}"><b>${label}</b></label>
      <textarea id="${safeId}" data-ph="${ph}" rows="${rows}" class="input-field" placeholder="${placeholder}"></textarea>
      ${wrapperEnd}
    `;
  } else if (type === "tel") {
    inputHtml = `
      ${wrapperStart}
      <label for="${safeId}"><b>${label}</b></label>
      <input type="tel" id="${safeId}" data-ph="${ph}" class="input-field" placeholder="${placeholder}" />
      ${wrapperEnd}
    `;
  } else if (type === "email") {
    inputHtml = `
      ${wrapperStart}
      <label for="${safeId}"><b>${label}</b></label>
      <input type="email" id="${safeId}" data-ph="${ph}" class="input-field" placeholder="${placeholder}" />
      ${wrapperEnd}
    `;
  } else {
    inputHtml = `
      ${wrapperStart}
      <label for="${safeId}"><b>${label}</b></label>
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
  const phMapping = window.buildPlaceholderMapping(config);
  const groupLabels = window.getGroupLabels(config);
  const subgroupLabels = window.getSubgroupLabels(config);

  // Group placeholders
  const grouped = {};
  placeholders.forEach(ph => {
    const def = phMapping[ph];
    if (!def) return;
    
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
    groupDiv.innerHTML = `<h3>${groupLabels[groupKey] || groupKey}</h3>`;

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
      // Normal form rendering
      
      // Subgroups
      const subgroupKeys = Object.keys(grouped[groupKey]).sort();
      
      subgroupKeys.forEach(subKey => {
        const subgroupDiv = document.createElement("div");
        subgroupDiv.className = "form-subgroup";
        subgroupDiv.innerHTML = `<h4>${subgroupLabels[subKey] || subKey}</h4>`;
        
        // ✅ Thêm dropdown "Tái sử dụng dữ liệu" cho từng subgroup
        const reuseDropdownHtml = renderReuseDataDropdown(groupKey, subKey, config);
        if (reuseDropdownHtml) {
          subgroupDiv.innerHTML += reuseDropdownHtml;
        }

        const items = grouped[groupKey][subKey];
        
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
  // - Nếu là LAND/INFO (không có suffix) → chỉ hiển thị LAND/INFO
  // - Nếu là MEN (có suffix) → chỉ hiển thị MEN groups
  const availableGroups = allGroups.filter(group => {
    if (targetSuffix) {
      // Subgroup này có suffix → chỉ lấy MEN groups
      return group.groupKey.startsWith('MEN');
    } else {
      // Subgroup này không có suffix → chỉ lấy LAND/OTHER
      return !group.groupKey.startsWith('MEN');
    }
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
            ${group.displayName} - ${new Date(group.timestamp).toLocaleString('vi-VN')}
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
      const targetSuffix = e.target.getAttribute('data-target-suffix');
      
      console.log(`🔄 Reuse data selected: ${value} for group ${targetGroup} (suffix ${targetSuffix})`);
      
      if (!value) {
        // User chọn "Nhập mới" → Không làm gì
        return;
      }
      
      // Parse value: "fileName|menKey"
      const [fileName, menKey] = value.split('|');
      
      if (!fileName || !menKey) {
        console.error('❌ Invalid reuse data value:', value);
        return;
      }
      
      // Lấy dữ liệu từ session storage
      const menData = window.sessionStorageManager.getMenGroupData(fileName, menKey);
      
      if (!menData) {
        console.error(`❌ No data found for ${fileName} - ${menKey}`);
        return;
      }
      
      console.log(`✅ Loading data from ${fileName} - ${menKey}:`, menData);
      
      // Fill form với dữ liệu
      fillFormWithMenData(menData, targetSuffix);
    });
  });
}

/**
 * Fill form với dữ liệu group (MEN hoặc LAND/INFO...)
 * @param {object} groupData - {Name: "A", CCCD: "123"} hoặc {QSH: "AA", S: "100"}
 * @param {string} targetSuffix - "1", "2", "7"... (hoặc "" cho LAND/INFO)
 */
function fillFormWithMenData(groupData, targetSuffix) {
  Object.keys(groupData).forEach(fieldName => {
    const value = groupData[fieldName];
    
    // Nếu có targetSuffix → thêm suffix (vd: Name + "1" = "Name1")
    // Nếu không có → dùng trực tiếp (vd: "QSH", "AddressD")
    const placeholder = targetSuffix ? `${fieldName}${targetSuffix}` : fieldName;
    
    // Tìm input/select/textarea có data-ph
    const element = document.querySelector(`[data-ph="${placeholder}"]`);
    
    if (element) {
      element.value = value;
      console.log(`✅ Filled ${placeholder} = ${value}`);
      
      // Trigger change event để re-format (nếu có)
      element.dispatchEvent(new Event('change', { bubbles: true }));
      
      // Trigger blur event để apply formatting (CCCD, Money...)
      element.dispatchEvent(new Event('blur', { bubbles: true }));
    } else {
      console.warn(`⚠️ Element not found for placeholder: ${placeholder}`);
    }
  });
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
  
  // ✅ Thu thập dữ liệu từ localStorage buttons trước
  const personButtonContainers = document.querySelectorAll('.person-buttons');
  console.log(`🔍 Found ${personButtonContainers.length} person-buttons containers`);
  
  personButtonContainers.forEach(buttonContainer => {
    const groupKey = buttonContainer.getAttribute('data-group');
    const suffix = buttonContainer.getAttribute('data-suffix');
    
    console.log(`🔍 Checking group ${groupKey} with suffix ${suffix}`);
    
    // Tìm button đang active
    const activeButton = buttonContainer.querySelector('.person-btn.active');
    console.log(`🔍 Active button found: ${!!activeButton}`);
    
    if (activeButton && groupKey) {
      const personId = activeButton.getAttribute('data-person-id');
      console.log(`🔍 Person ID: ${personId}`);
      
      const person = window.getPersonById ? window.getPersonById(personId) : null;
      console.log(`🔍 Person data:`, person);
      
      if (person && person.data) {
        // Map person data to placeholders với suffix
        // Ví dụ: Gender2, Name2, Date2 (với suffix = "2")
        Object.keys(person.data).forEach(key => {
          // Tạo placeholder với suffix: Gender + 2 = Gender2
          const placeholder = suffix ? `${key}${suffix}` : key;
          data[placeholder] = person.data[key];
          console.log(`📂 From localStorage: ${placeholder} = ${person.data[key]}`);
        });
      }
    }
  });
  
  // Thu thập dữ liệu từ các input/select/textarea có data-ph
  document.querySelectorAll('input[data-ph], select[data-ph], textarea[data-ph]').forEach(el => {
    const ph = el.getAttribute('data-ph');
    if (!ph) return;
    
    let value = el.value.trim();
    
    // ✅ Xử lý đặc biệt cho Money: đảm bảo có format và tạo MoneyText
    if (ph === 'Money' && value) {
      // Nếu chưa có dấu phẩy (user chưa blur), format ngay
      const rawMoney = value.replace(/\D/g, '');
      if (rawMoney) {
        if (!value.includes(',')) {
          // Chưa format, format ngay
          value = window.formatWithCommas ? window.formatWithCommas(rawMoney) : rawMoney;
          el.value = value; // Cập nhật lại UI
        }
        
        // Tự động tạo MoneyText từ raw number
        const moneyText = window.numberToVietnameseWords ? window.numberToVietnameseWords(rawMoney) : "";
        if (moneyText) {
          data['MoneyText'] = moneyText;
          console.log(`💰 Money collected: ${value} -> Text: "${moneyText}"`);
        }
      }
    }
    
    // ✅ CCCD và Money đã được format bởi setupCCCDInput/setupMoneyInput, không cần format lại
    // Chỉ format date fields
    if (window.formatInputValue && typeof window.formatInputValue === 'function') {
      const isDate = el.classList.contains('date-picker');
      
      if (isDate) {
        value = window.formatInputValue(value, ph, { type: 'date' });
      }
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
    
    // Gộp các giá trị địa chỉ theo format: xxx, xxx, xxx (dấu phẩy)
    const parts = [];
    if (villageSelect && villageSelect.value) parts.push(villageSelect.value);
    if (wardSelect && wardSelect.value) parts.push(wardSelect.value);
    if (districtSelect && districtSelect.value) parts.push(districtSelect.value);
    if (provinceSelect && provinceSelect.value) parts.push(provinceSelect.value);
    
    const addressString = parts.join(', ');
    data[ph] = addressString;
    
    console.log(`📍 Address collected for ${ph}: "${addressString}"`);
  });
  
  console.log("📦 Collected generic data:", data);
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