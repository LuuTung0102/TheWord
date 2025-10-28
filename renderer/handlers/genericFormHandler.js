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

  // Render each group
  groupOrder.forEach((groupKey, index) => {
    if (!grouped[groupKey]) return;

    const sectionDiv = document.createElement("div");
    sectionDiv.className = `form-section ${index === 0 ? 'active' : ''}`;
    sectionDiv.id = `section-${groupKey}`;

    const groupDiv = document.createElement("div");
    groupDiv.className = "form-group";
    groupDiv.innerHTML = `<h3>${groupLabels[groupKey] || groupKey}</h3>`;

    // Subgroups
    const subgroupKeys = Object.keys(grouped[groupKey]).sort();
    
    subgroupKeys.forEach(subKey => {
      const subgroupDiv = document.createElement("div");
      subgroupDiv.className = "form-subgroup";
      subgroupDiv.innerHTML = `<h4>${subgroupLabels[subKey] || subKey}</h4>`;

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

    sectionDiv.appendChild(groupDiv);
    area.appendChild(sectionDiv);
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
    }, 100); // Reduced from 500ms since we have requestAnimationFrame
  });
  
  console.log("✅ Generic form rendered");
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
  
  // Thu thập dữ liệu từ các input/select/textarea có data-ph
  document.querySelectorAll('input[data-ph], select[data-ph], textarea[data-ph]').forEach(el => {
    const ph = el.getAttribute('data-ph');
    if (!ph) return;
    
    let value = el.value.trim();
    
    // ✅ CCCD đã được format bởi setupCCCDInput (xxx.xxx.xxx.xxx), không cần format lại
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