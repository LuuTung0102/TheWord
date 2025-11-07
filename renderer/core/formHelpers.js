function setupNumericInput(el, maxLength) {
  el.addEventListener("input", (e) => {
    const v = e.target.value.replace(/\D/g, "").slice(0, maxLength);
    if (e.target.value !== v) {
      const pos = e.target.selectionStart - (e.target.value.length - v.length);
      e.target.value = v;
      e.target.selectionStart = e.target.selectionEnd = Math.max(0, pos);
    }
  });
  el.addEventListener("paste", (e) => {
    e.preventDefault();
    const text = (e.clipboardData || window.clipboardData)
      .getData("text")
      .replace(/\D/g, "")
      .slice(0, maxLength);
    document.execCommand("insertText", false, text);
  });
}

function setupCCCDInput(el) {
  el.addEventListener("input", (e) => {
    let value = e.target.value.replace(/\D/g, "").slice(0, 12);
    e.target.value = value;
  });
  
  el.addEventListener("focus", (e) => {
    e.target.value = e.target.value.replace(/\D/g, "");
  });
  
  el.addEventListener("blur", (e) => {
    let value = e.target.value.replace(/\D/g, "").slice(0, 12);
    if (value.length === 0) return;
    
    if (value.length === 12 && window.formatCCCD) {
      e.target.value = window.formatCCCD(value) || value;
    } else {
      e.target.value = value;
    }
  });
  
  el.addEventListener("paste", (e) => {
    e.preventDefault();
    const text = (e.clipboardData || window.clipboardData)
      .getData("text")
      .replace(/\D/g, "")
      .slice(0, 12);
    document.execCommand("insertText", false, text);
  });
}

function setupPhoneInput(el) {
  setupNumericInput(el, 10);
}

function setupMSTInput(el) {
  setupNumericInput(el, 10);
}

function setupEmailInput(el) {
  el.addEventListener("blur", (e) => {
    const email = e.target.value.trim();
    if (email && !isValidEmail(email)) {
      e.target.style.borderColor = "#ffa500";
      setTimeout(() => e.target.style.borderColor = "", 2000);
    }
  });
}

function isValidEmail(email) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

function setupNameInput(el) {
  const ph = el.getAttribute('data-ph');
  
  // Original logic: Auto uppercase
  el.addEventListener("input", (e) => {
    const input = e.target;
    const start = input.selectionStart;
    const end = input.selectionEnd;
    const upper = input.value.toUpperCase();
    if (input.value !== upper) {
      input.value = upper;
      try {
        input.selectionStart = start;
        input.selectionEnd = end;
      } catch (err) {}
    }
  });
  
  // Auto-generate NameT from Name (similar to MoneyText from Money)
  if (ph) {
    const nameMatch = ph.match(/^Name(\d+)$/);
    if (nameMatch) {
      const number = nameMatch[1];
      const nameTKey = `NameT${number}`;
      
      // Update NameT when Name changes
      el.addEventListener('input', (e) => {
        const value = e.target.value.trim();
        if (value && window.toTitleCase) {
          const nameT = window.toTitleCase(value);
          const nameTField = document.querySelector(`[data-ph="${nameTKey}"]`);
          if (nameTField) {
            nameTField.value = nameT;
            console.log(`📝 Name: ${value} -> NameT: "${nameT}"`);
          }
        } else {
          // Clear NameT if Name is empty
          const nameTField = document.querySelector(`[data-ph="${nameTKey}"]`);
          if (nameTField) {
            nameTField.value = '';
          }
        }
      });
      
      el.addEventListener('blur', (e) => {
        const value = e.target.value.trim();
        if (value && window.toTitleCase) {
          const nameT = window.toTitleCase(value);
          const nameTField = document.querySelector(`[data-ph="${nameTKey}"]`);
          if (nameTField) {
            nameTField.value = nameT;
          }
        }
      });
    }
  }
}

function setupLandTypeInput(el, id) {
  if (el.dataset.landTypeSetup === 'true') return;
  const dropdown = document.getElementById(`${id}_dropdown`);
  if (!dropdown) {
    requestAnimationFrame(() => {
      setTimeout(() => {
        const retryDropdown = document.getElementById(`${id}_dropdown`);
        if (retryDropdown && !el.dataset.landTypeSetup) {
          setupLandTypeInput(el, id);
        }
      }, 50);
    });
    return;
  }
  
  el.dataset.landTypeSetup = 'true';
  const landKeys = window.landTypeMap ? Object.keys(window.landTypeMap).sort() : [];
  function getSelectedCodes(value) {
    return value
      .split("+")
      .map((s) => s.trim().toUpperCase())
      .filter(Boolean);
  }

  function getCurrentQuery(value, cursorPos) {
    const beforeCursor = value.slice(0, cursorPos);
    const afterLastPlus = beforeCursor.split("+").pop() || "";
    return afterLastPlus.toUpperCase();
  }

  function updateDropdown(query) {
    if (!dropdown || !el) return;
    selectedIndex = -1;
    const selected = getSelectedCodes(el.value);
    const filtered = landKeys.filter(key => !selected.includes(key) && (!query || key.toUpperCase().includes(query)));
    
    dropdown.innerHTML = filtered
      .map(key => {
        const desc = window.landTypeMap ? window.landTypeMap[key] : key;
        return `<div class="suggestion-item" data-key="${key}">${key}: ${desc}</div>`;
      })
      .join("");
    dropdown.style.display = filtered.length ? "block" : "none";
  }


  el.addEventListener("input", (e) => {
    const cursorPos = e.target.selectionStart;
    const query = getCurrentQuery(e.target.value, cursorPos);
    updateDropdown(query);
  });

  el.addEventListener("focus", (e) => {
    const cursorPos = e.target.selectionStart;
    const query = getCurrentQuery(e.target.value, cursorPos);
    updateDropdown(query);
  });

  let selectedIndex = -1;
  el.addEventListener("keydown", (e) => {
    const items = dropdown.querySelectorAll('.suggestion-item');
    if (e.key === "+" && !el.value.endsWith("+")) {
      e.preventDefault();
      const cursorPos = e.target.selectionStart;
      const newValue = el.value.slice(0, cursorPos) + "+" + el.value.slice(cursorPos);
      el.value = newValue;
      e.target.selectionStart = e.target.selectionEnd = cursorPos + 1;
      const query = "";
      updateDropdown(query);
      selectedIndex = -1;
    } else if (e.key === "ArrowDown") {
      e.preventDefault();
      if (dropdown.style.display === "none") {
        updateDropdown("");
        selectedIndex = -1;
      } else if (items.length > 0) {
        selectedIndex = (selectedIndex + 1) % items.length;
        updateSelection(items, selectedIndex);
      }
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      if (items.length > 0 && dropdown.style.display !== "none") {
        selectedIndex = selectedIndex <= 0 ? items.length - 1 : selectedIndex - 1;
        updateSelection(items, selectedIndex);
      }
    } else if (e.key === "Enter") {
      if (selectedIndex >= 0 && items[selectedIndex]) {
        e.preventDefault();
        items[selectedIndex].click();
        selectedIndex = -1;
      }
    } else if (e.key === "Escape") {
      if (dropdown) dropdown.style.display = "none";
      selectedIndex = -1;
    }
  });
  
  function updateSelection(items, index) {
    items.forEach((item, i) => {
      if (i === index) {
        item.classList.add('selected');
        item.scrollIntoView({ block: 'nearest' });
      } else {
        item.classList.remove('selected');
      }
    });
  }

  const handleClickOutside = (e) => {
    if (!el || !dropdown) return;
    if (!el.contains(e.target) && !dropdown.contains(e.target)) {
      dropdown.style.display = "none";
    }
  };
  document.addEventListener("click", handleClickOutside);
  
  if (!el._cleanupFunctions) el._cleanupFunctions = [];
  el._cleanupFunctions.push(() => {
    document.removeEventListener("click", handleClickOutside);
  });

  dropdown.addEventListener("click", (e) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (e.target.classList.contains("suggestion-item")) {
      const key = e.target.dataset.key;
      const currentValue = el.value.trim();
      if (!currentValue) {
        el.value = key;
      } else {
        const lastPlusIndex = currentValue.lastIndexOf('+');      
        if (lastPlusIndex >= 0) {
          el.value = currentValue.substring(0, lastPlusIndex + 1) + key;
        } else {
          el.value = key;
        }
      }
      dropdown.style.display = "none";
    }
  });
}

function setupMoneyInput(el) {
  el.addEventListener("input", (e) => {
    let value = e.target.value.replace(/\D/g, ""); 
    e.target.value = value; 
  });
  el.addEventListener("focus", (e) => {
    let value = e.target.value.replace(/\D/g, "");
    e.target.value = value;
  });
  
  el.addEventListener("blur", (e) => {
    let value = e.target.value.replace(/\D/g, "");
    if (value.length === 0) {
      const moneyTextField = document.querySelector('[data-ph="MoneyText"]');
      if (moneyTextField) {
        moneyTextField.value = "";
      }
      return;
    }
    const formatted = window.formatWithCommas ? window.formatWithCommas(value) : value;
    e.target.value = formatted;
    const moneyText = window.numberToVietnameseWords ? window.numberToVietnameseWords(value) : "";
    const moneyTextField = document.querySelector('[data-ph="MoneyText"]');
    if (moneyTextField && moneyText) {
      moneyTextField.value = moneyText;
      console.log(`💰 Money: ${formatted} -> Text: "${moneyText}"`);
    }
  });
}

function setupAreaInput(el) {
  el.addEventListener("input", (e) => {
    let value = e.target.value.replace(/\D/g, ""); 
    e.target.value = value; 
  });

  el.addEventListener("focus", (e) => {
    let value = e.target.value.replace(/\D/g, ""); 
    e.target.value = value;
  });

  el.addEventListener("blur", (e) => {
    let value = e.target.value.replace(/\D/g, "");
    
    if (value.length === 0) {
      const sTextField = document.querySelector('[data-ph="S_Text"]');
      if (sTextField) {
        sTextField.value = "";
      }
      return;
    }
    const formatted = window.formatWithCommas ? window.formatWithCommas(value) : value;
    e.target.value = formatted;
    const sText = window.numberToAreaWords ? window.numberToAreaWords(value) : "";
    const sTextField = document.querySelector('[data-ph="S_Text"]');
    if (sTextField && sText) {
      sTextField.value = sText;
      console.log(`📐 Area: ${formatted} -> Text: "${sText}"`);
    }
  });
}

function setupNoteTextarea(el) {
  const resizeTextarea = (ta) => {
    ta.style.height = "auto";
    ta.style.height = Math.min(Math.max(ta.scrollHeight, 80), 600) + "px";
  };
  el.addEventListener("input", (e) => resizeTextarea(e.target));
  resizeTextarea(el);
}

function setupDatePickers() {
  try {
    if (typeof flatpickr === "undefined") {
      console.warn("⚠️ Flatpickr not loaded");
      return;
    }
    const dateInputs = document.querySelectorAll(".date-input, .date-picker");
    if (dateInputs.length === 0) {
      console.warn("⚠️ No date inputs found");
      return;
    }
    console.log(`✅ Found ${dateInputs.length} date inputs`);
    
    dateInputs.forEach((input) => {
      if (input._flatpickr) {
        input._flatpickr.destroy();
      }
      
      flatpickr(input, {
        dateFormat: "d/m/Y",
        allowInput: true,
        altInput: false,
        locale: {
          firstDayOfWeek: 1,
          weekdays: {
            shorthand: ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'],
            longhand: ['Chủ nhật', 'Thứ hai', 'Thứ ba', 'Thứ tư', 'Thứ năm', 'Thứ sáu', 'Thứ bảy'],
          },
          months: {
            shorthand: ['Th1', 'Th2', 'Th3', 'Th4', 'Th5', 'Th6', 'Th7', 'Th8', 'Th9', 'Th10', 'Th11', 'Th12'],
            longhand: ['Tháng 1', 'Tháng 2', 'Tháng 3', 'Tháng 4', 'Tháng 5', 'Tháng 6', 'Tháng 7', 'Tháng 8', 'Tháng 9', 'Tháng 10', 'Tháng 11', 'Tháng 12'],
          },
        },
        onClose: function (selectedDates, dateStr, instance) {
          if (selectedDates && selectedDates.length) {
            instance.input.value = instance.formatDate(
              selectedDates[0],
              "d/m/Y"
            );
            return;
          }
          const raw = (instance.input.value || "").trim();
          const m = raw.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
          if (m) {
            const dd = m[1].padStart(2, "0");
            const mm = m[2].padStart(2, "0");
            const yyyy = m[3];
            instance.input.value = `${dd}/${mm}/${yyyy}`;
          }
        },
      });
    });
  } catch (err) {
    console.error("❌ Error setting up date pickers:", err);
  }
}

function setupAddressSelects() {
  document.querySelectorAll(".address-select").forEach((select) => {
    select.addEventListener("change", (e) => {
      const level = e.target.dataset.level;
      let mainId = e.target.dataset.main;
      if (!mainId) {
        const idParts = e.target.id.split("_");
        mainId = idParts.slice(0, -1).join("_");
      }
      const provinceSelect = document.getElementById(`${mainId}_province`);
      const districtSelect = document.getElementById(`${mainId}_district`);
      const wardSelect = document.getElementById(`${mainId}_ward`);
      const villageSelect = document.getElementById(`${mainId}_village`);

      if (level === "province") {
        districtSelect.innerHTML =
          '<option value="">-- Chọn quận/huyện --</option>';
        wardSelect.innerHTML = '<option value="">-- Chọn phường/xã --</option>';
        villageSelect.innerHTML = '<option value="">-- Chọn--</option>';

        const province = window.addressData.find((p) => p.name === e.target.value);
        if (province && province.districts) {
          districtSelect.innerHTML += province.districts
            .map((d) => `<option value="${d.name}">${d.name}</option>`)
            .join("");
        }
      } else if (level === "district") {
        wardSelect.innerHTML = '<option value="">-- Chọn phường/xã --</option>';
        villageSelect.innerHTML = '<option value="">-- Chọn--</option>';

        const province = window.addressData.find(
          (p) => p.name === provinceSelect.value
        );
        if (province) {
          const district = province.districts.find(
            (d) => d.name === e.target.value
          );
          if (district && district.wards) {
            wardSelect.innerHTML += district.wards
              .map((w) => `<option value="${w.name}">${w.name}</option>`)
              .join("");
          }
        }
      } else if (level === "ward") {
        villageSelect.innerHTML = '<option value="">-- Chọn --</option>';

        const province = window.addressData.find(
          (p) => p.name === provinceSelect.value
        );
        if (province) {
          const district = province.districts.find(
            (d) => d.name === districtSelect.value
          );
          if (district) {
            const ward = district.wards.find((w) => w.name === e.target.value);
            if (ward && ward.villages) {
              villageSelect.innerHTML += ward.villages
                .map((v) => `<option value="${v}">${v}</option>`)
                .join("");
            }
          }
        }
      }
    });
  });
}

function reSetupAllInputs() {
  setupDatePickers();
  setupAddressSelects();
  const cccdInputs = document.querySelectorAll('input[data-ph*="CCCD"]');
  cccdInputs.forEach(input => {
    input.removeAttribute('maxlength');
    setupCCCDInput(input);
  });
  
  const phoneInputs = document.querySelectorAll('input[data-ph*="SDT"], input[data-ph*="Phone"]');
  phoneInputs.forEach(input => {
    setupPhoneInput(input);
  });
  
  const mstInputs = document.querySelectorAll('input[data-ph*="MST"]');
  mstInputs.forEach(input => {
    setupMSTInput(input);
  });
  
  const emailInputs = document.querySelectorAll('input[data-ph*="Email"], input[data-ph*="EMAIL"]');
  emailInputs.forEach(input => {
    setupEmailInput(input);
  });
  
  const nameInputs = document.querySelectorAll('input[data-ph*="Name"]');
  nameInputs.forEach(input => {
    setupNameInput(input);
  });
  
  document.querySelectorAll('input[data-ph="Money"]').forEach(input => {
    setupMoneyInput(input);
  });
  
  document.querySelectorAll('input[data-ph="S"]').forEach(input => {
    setupAreaInput(input);
  });
  
  document.querySelectorAll('textarea[data-ph="Note"]').forEach(textarea => {
    setupNoteTextarea(textarea);
  });
  
  document.querySelectorAll('input[data-ph="Loai_Dat"]').forEach(input => {
    const id = input.id;
    if (id) setupLandTypeInput(input, id);
  });
  
  document.querySelectorAll('.land-type-size-container').forEach(container => {
    const inputId = container.querySelector('.tag-input')?.id;
    if (inputId && !container.dataset.landTypeSizeSetup) {
      setupLandTypeSizeInput(container, inputId);
      container.dataset.landTypeSizeSetup = 'true';
    }
  });
}

function cleanupAllEventListeners() {
  console.log('🗑️ Cleaning up old event listeners...');
  document.querySelectorAll('input[data-ph="Loai_Dat"]').forEach(input => {
    if (input._cleanupFunctions) {
      input._cleanupFunctions.forEach(fn => fn());
      input._cleanupFunctions = [];
    }
    delete input.dataset.landTypeSetup;
  });
  
  document.querySelectorAll('.land-type-dropdown').forEach(dropdown => {
    dropdown.style.display = 'none';
  });
  
  console.log('✅ Cleanup completed');
}


if (typeof window !== 'undefined') {
  window.cleanupAllEventListeners = cleanupAllEventListeners;
}

function formatInputValue(value, ph, map) {
  if (!value || !map) return value || '';
  let formatted = value;
  if (map.type === "date") {
    const dmMatch = value.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
    const isoMatch = value.match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/);
    
    if (dmMatch) {
      const dd = dmMatch[1].padStart(2, "0");
      const mm = dmMatch[2].padStart(2, "0");
      const yyyy = dmMatch[3];
      formatted = `${dd}/${mm}/${yyyy}`;
    } else if (isoMatch) {
      const yyyy = isoMatch[1];
      const mm = isoMatch[2].padStart(2, "0");
      const dd = isoMatch[3].padStart(2, "0");
      formatted = `${dd}/${mm}/${yyyy}`;
    } else if (window.formatDate) {
      formatted = window.formatDate(value);
    }
  } else if (map.type === "number") {
    if (ph.includes('CCCD') && value) {
      const digits = value.replace(/\D/g, "");
      if (/^\d{12}$/.test(digits)) {
        formatted = window.formatCCCD ? window.formatCCCD(digits) : digits;
      } else {
        formatted = digits;
      }
    }
  }
  
  return formatted;
}


window.setupNumericInput = setupNumericInput;
window.setupCCCDInput = setupCCCDInput;
window.setupPhoneInput = setupPhoneInput;
window.setupMSTInput = setupMSTInput;
window.setupEmailInput = setupEmailInput;
window.isValidEmail = isValidEmail;
window.setupNameInput = setupNameInput;
window.setupLandTypeInput = setupLandTypeInput;
window.setupMoneyInput = setupMoneyInput;
window.setupAreaInput = setupAreaInput;
window.setupNoteTextarea = setupNoteTextarea;
window.setupDatePickers = setupDatePickers;
window.setupAddressSelects = setupAddressSelects;
function setupLandTypeSizeInput(container, inputId) {
  const input = document.getElementById(inputId);
  const tagsWrapper = container.querySelector('.tags-wrapper');
  const dropdown = container.querySelector('.land-type-dropdown');
  const addBtn = container.querySelector('.tag-add-btn');
  const inputWrapper = container.querySelector('.tag-input-wrapper');
  const ph = container.dataset.ph;
  
  if (!input || !tagsWrapper || !dropdown || !addBtn || !inputWrapper) {
    console.warn('⚠️ Missing elements for land_type_size:', { input, tagsWrapper, dropdown, addBtn, inputWrapper });
    return;
  }
  
  const landKeys = window.landTypeMap ? Object.keys(window.landTypeMap).sort() : [];
  let tags = []; // Array of {code: "ONT", area: "440"}
  let selectedIndex = -1;
  let currentTagIndex = -1; // Index of tag being edited
  
  // Hàm hiển thị input
  function showInput() {
    inputWrapper.classList.add('show');
    input.value = '';
    input.focus();
    updateDropdown('');
  }
  
  // Hàm ẩn input
  function hideInput() {
    inputWrapper.classList.remove('show');
    dropdown.style.display = 'none';
    input.value = '';
    currentTagIndex = -1;
    // Remove editing highlight
    document.querySelectorAll('.land-type-tag').forEach(t => t.classList.remove('editing'));
  }
  
  // Load existing value if any
  function loadExistingValue() {
    const existingValue = input.value.trim();
    if (!existingValue) return;
    
    // Parse format: "ONT+CHN 440; 450" hoặc "ONT 440; CHN 450"
    const parts = existingValue.split(/\s+/);
    if (parts.length === 0) return;
    
    // Try format: "ONT+CHN 440; 450"
    if (parts.length === 2 && parts[1].includes(';')) {
      const codes = parts[0].split('+').map(c => c.trim().toUpperCase());
      const areas = parts[1].split(';').map(a => a.trim().replace(/m2/g, '').trim());
      
      codes.forEach((code, idx) => {
        if (code && areas[idx]) {
          tags.push({ code: code, area: areas[idx] });
        }
      });
    } else {
      // Try format: "ONT 440; CHN 450" hoặc "BCS 454; CCC 1111"
      const pairs = existingValue.split(';').map(p => p.trim());
      pairs.forEach(pair => {
        // Match format: "BCS 454" hoặc "BCS 454m2" hoặc "454m2 BCS"
        let match = pair.match(/^([A-Z]+)\s+(\d+(?:\.\d+)?)\s*m2?$/i);
        if (match) {
          tags.push({ code: match[1].toUpperCase(), area: match[2] });
        } else {
          // Try format: "454m2 BCS" hoặc "454 m2 BCS"
          match = pair.match(/^(\d+(?:\.\d+)?)\s*m2?\s*([A-Z]+)$/i);
          if (match) {
            tags.push({ code: match[2].toUpperCase(), area: match[1] });
          } else {
            // Try format: "BCS 454" (không có m2)
            match = pair.match(/^([A-Z]+)\s+(\d+(?:\.\d+)?)$/);
            if (match) {
              tags.push({ code: match[1].toUpperCase(), area: match[2] });
            }
          }
        }
      });
    }
    
    renderTags();
    
    // Ẩn input sau khi load giá trị có sẵn
    if (tags.length > 0) {
      hideInput();
    }
  }
  
  // Render all tags
  function renderTags() {
    tagsWrapper.innerHTML = '';
    
    tags.forEach((tag, idx) => {
      const tagEl = document.createElement('div');
      tagEl.className = 'land-type-tag';
      tagEl.dataset.tagIndex = idx;
      
      const codeSpan = document.createElement('span');
      codeSpan.className = 'tag-code';
      codeSpan.textContent = tag.code;
      codeSpan.contentEditable = 'false';
      
      const areaSpan = document.createElement('span');
      areaSpan.className = 'tag-area';
      areaSpan.textContent = ` - ${tag.area}m²`;
      areaSpan.contentEditable = 'true';
      areaSpan.dataset.tagIndex = idx;
      
      const deleteBtn = document.createElement('button');
      deleteBtn.className = 'tag-delete';
      deleteBtn.innerHTML = '×';
      deleteBtn.title = 'Xóa';
      deleteBtn.onclick = (e) => {
        e.stopPropagation();
        tags.splice(idx, 1);
        renderTags();
        updateHiddenValue();
      };
      
      tagEl.appendChild(codeSpan);
      tagEl.appendChild(areaSpan);
      tagEl.appendChild(deleteBtn);
      
      // Click to edit
      tagEl.onclick = (e) => {
        if (e.target === deleteBtn || e.target.parentElement === deleteBtn) return;
        
        currentTagIndex = idx;
        showInput();
        input.value = tag.code;
        updateDropdown(input.value);
        
        // Highlight tag being edited
        document.querySelectorAll('.land-type-tag').forEach(t => t.classList.remove('editing'));
        tagEl.classList.add('editing');
      };
      
      // Edit area inline
      areaSpan.addEventListener('blur', () => {
        const newArea = areaSpan.textContent.replace(/[^\d.]/g, '');
        if (newArea) {
          tag.area = newArea;
          areaSpan.textContent = ` - ${newArea}m²`;
          updateHiddenValue();
        } else {
          areaSpan.textContent = ` - ${tag.area}m²`;
        }
      });
      
      // Press Enter to save area
      areaSpan.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
          e.preventDefault();
          areaSpan.blur();
        }
      });
      
      tagsWrapper.appendChild(tagEl);
    });
    
    updateHiddenValue();
  }
  
  // Update hidden input value
  function updateHiddenValue() {
    if (tags.length === 0) {
      input.value = '';
      // Trigger change event even when empty (for validation)
      input.dispatchEvent(new Event('change', { bubbles: true }));
      input.dispatchEvent(new Event('input', { bubbles: true }));
      return;
    }
    
    // Format: "ONT 440; CHN 450"
    const value = tags.map(t => `${t.code} ${t.area}`).join('; ');
    input.value = value;
    
    // Trigger change event for form data collection and validation
    input.dispatchEvent(new Event('change', { bubbles: true }));
    input.dispatchEvent(new Event('input', { bubbles: true }));
  }
  
  // Update dropdown suggestions
  function updateDropdown(query) {
    if (!dropdown) return;
    selectedIndex = -1;
    
    const selectedCodes = tags.map(t => t.code);
    const filtered = landKeys.filter(key => 
      !selectedCodes.includes(key) && 
      (!query || key.toUpperCase().includes(query.toUpperCase()))
    );
    
    dropdown.innerHTML = filtered
      .map(key => {
        const desc = window.landTypeMap ? window.landTypeMap[key] : key;
        return `<div class="suggestion-item" data-key="${key}">${key}: ${desc}</div>`;
      })
      .join("");
    
    dropdown.style.display = filtered.length ? "block" : "none";
  }
  
  // Handle input
  input.addEventListener('input', (e) => {
    const query = e.target.value.trim().toUpperCase();
    updateDropdown(query);
    
    // Remove editing highlight if typing
    document.querySelectorAll('.land-type-tag').forEach(t => t.classList.remove('editing'));
    currentTagIndex = -1;
  });
  
  input.addEventListener('focus', () => {
    const query = input.value.trim().toUpperCase();
    updateDropdown(query);
  });
  
  // Keyboard navigation
  input.addEventListener('keydown', (e) => {
    const items = dropdown.querySelectorAll('.suggestion-item');
    
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (items.length > 0) {
        selectedIndex = (selectedIndex + 1) % items.length;
        items.forEach((item, i) => {
          item.classList.toggle('selected', i === selectedIndex);
          if (i === selectedIndex) item.scrollIntoView({ block: 'nearest' });
        });
      }
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (items.length > 0) {
        selectedIndex = selectedIndex <= 0 ? items.length - 1 : selectedIndex - 1;
        items.forEach((item, i) => {
          item.classList.toggle('selected', i === selectedIndex);
          if (i === selectedIndex) item.scrollIntoView({ block: 'nearest' });
        });
      }
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (selectedIndex >= 0 && items[selectedIndex]) {
        items[selectedIndex].click();
      } else if (input.value.trim()) {
        // Add as new tag if valid code
        const code = input.value.trim().toUpperCase();
        if (landKeys.includes(code) && !tags.find(t => t.code === code)) {
          addTag(code, '');
          input.value = '';
          input.focus();
        }
      }
    } else if (e.key === 'Escape') {
      hideInput();
    }
  });
  
  // Click on suggestion
  dropdown.addEventListener('click', (e) => {
    e.preventDefault();
    e.stopPropagation();
    
    const item = e.target.closest('.suggestion-item');
    if (item) {
      const code = item.dataset.key;
      addTag(code, '');
      input.value = '';
      dropdown.style.display = 'none';
      input.focus();
    }
  });
  
  // Add tag
  function addTag(code, area = '') {
    // If editing existing tag, update it
    if (currentTagIndex >= 0 && currentTagIndex < tags.length) {
      tags[currentTagIndex].code = code;
      if (area) tags[currentTagIndex].area = area;
      currentTagIndex = -1;
    } else {
      // Check if code already exists
      const existingIndex = tags.findIndex(t => t.code === code);
      if (existingIndex >= 0) {
        // Focus on existing tag
        const tagEl = tagsWrapper.querySelector(`[data-tag-index="${existingIndex}"]`);
        if (tagEl) tagEl.click();
        return;
      }
      
      tags.push({ code: code, area: area || '' });
    }
    
    renderTags();
    
    // Ẩn input sau khi thêm tag (trừ khi đang edit area)
    if (!area) {
      // Nếu chưa có diện tích, focus vào area input của tag mới
      const newTagIndex = tags.findIndex(t => t.code === code);
      if (newTagIndex >= 0) {
        setTimeout(() => {
          const tagEl = tagsWrapper.querySelector(`[data-tag-index="${newTagIndex}"]`);
          if (tagEl) {
            const areaSpan = tagEl.querySelector('.tag-area');
            if (areaSpan) {
              areaSpan.focus();
              // Select the number part
              const range = document.createRange();
              range.selectNodeContents(areaSpan);
              const sel = window.getSelection();
              sel.removeAllRanges();
              sel.addRange(range);
            }
          }
          // Ẩn input sau khi focus vào area
          hideInput();
        }, 50);
      } else {
        hideInput();
      }
    } else {
      // Nếu đã có diện tích, ẩn input ngay
      hideInput();
    }
  }
  
  // Add button click - toggle input visibility
  addBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    if (inputWrapper.classList.contains('show')) {
      // Nếu đang hiện, chỉ focus (không ẩn)
      input.focus();
    } else {
      // Nếu đang ẩn, hiện input
      showInput();
    }
  });
  
  // Click outside to close dropdown and hide input
  document.addEventListener('click', (e) => {
    if (!container.contains(e.target)) {
      hideInput();
    }
  });
  
  // Expose reload function để có thể gọi từ bên ngoài
  container.reloadLandTypeSizeValue = function() {
    tags = []; // Reset tags trước khi load lại
    loadExistingValue();
  };
  
  // Load existing value
  loadExistingValue();
}

window.reSetupAllInputs = reSetupAllInputs;
window.formatInputValue = formatInputValue;
window.setupLandTypeSizeInput = setupLandTypeSizeInput;

