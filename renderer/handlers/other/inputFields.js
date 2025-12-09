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
  const isFullWidth = type === 'land_type_detail' || type === 'textarea';
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
      <div class="address-group" id="${safeId}_address_group">
        <div class="address-field-wrapper">
          <div class="editable-select-wrapper">
            <input type="text" id="${safeId}_province" data-main="${safeId}" data-level="province" class="editable-select-input input-field" placeholder="Chọn tỉnh/thành..." autocomplete="off"/>
            <span class="editable-select-arrow">▼</span>
          </div>
          <div id="${safeId}_province_dropdown" class="address-dropdown"></div>
        </div>
        <div class="address-field-wrapper">
          <div class="editable-select-wrapper">
            <input type="text" id="${safeId}_ward" data-main="${safeId}" data-level="ward" class="editable-select-input input-field" placeholder="Chọn xã/phường..." autocomplete="off" disabled/>
            <span class="editable-select-arrow">▼</span>
          </div>
          <div id="${safeId}_ward_dropdown" class="address-dropdown"></div>
        </div>
        <div class="address-field-wrapper">
          <div class="editable-select-wrapper">
            <input type="text" id="${safeId}_village" data-main="${safeId}" data-level="village" class="editable-select-input input-field" placeholder="Chọn hoặc nhập thôn/xóm..." autocomplete="off" disabled/>
            <span class="editable-select-arrow">▼</span>
          </div>
          <div id="${safeId}_village_dropdown" class="address-dropdown"></div>
        </div>
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
        <input type="text" id="${safeId}" data-ph="${ph}" data-type="land_type" class="input-field land-type-input" placeholder="${placeholder}">
        <div id="${safeId}_dropdown" class="land-type-dropdown"></div>
      </div>
      ${wrapperEnd}
    `;
  } else if (type === "land_type_size") {
    inputHtml = `
      ${wrapperStart}
      <label for="${safeId}"${requiredClass}><b>${label}</b></label>
      <div class="land-type-size-container" id="${safeId}_container" data-ph="${ph}" data-type="land_type_size">
        <div class="tags-wrapper" id="${safeId}_tags"></div>
        <div class="tag-input-wrapper">
          <input type="text" id="${safeId}" class="tag-input" data-ph="${ph}" data-type="land_type_size" placeholder="Chọn loại đất..." autocomplete="off">
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
      <input type="hidden" id="${safeId}" data-ph="${ph}" data-type="land_type_detail" class="tag-input" />
      <div class="land-type-size-container" id="${safeId}_container" data-ph="${ph}" data-type="land_type_detail">
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
  } else if (type === "htsd_custom") {
    inputHtml = `
      <div class="field-wrapper" data-field-name="${ph}" data-field-type="htsd_custom">
        <label for="${safeId}"${requiredClass}><b>${label}</b></label>
        <input type="hidden" id="${safeId}" data-ph="${ph}" data-type="htsd_custom" />
        <div class="htsd-controls">
          <button type="button" class="htsd-toggle-btn htsd-toggle-loai1">Loại 1</button>
          <button type="button" class="htsd-toggle-btn htsd-toggle-loai2">Loại 2</button>
        </div>
        <div class="htsd-loai1-content hidden">
          <select class="htsd-select input-field">
            <option value="">-- Chọn --</option>
            <option value="Sử dụng chung">Sử dụng chung</option>
            <option value="Sử dụng riêng">Sử dụng riêng</option>
          </select>
        </div>
        <div class="htsd-loai2-content hidden">
          <input type="number" data-htsd-type="common" class="htsd-area-input input-field" placeholder="Chung (m²)" />
          <input type="number" data-htsd-type="private" class="htsd-area-input input-field" placeholder="Riêng (m²)" />
        </div>
      </div>
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

window.InputFields = {
    renderGenericInputField,
    renderDropdownOptions,
    setupEditableSelectInput
};

