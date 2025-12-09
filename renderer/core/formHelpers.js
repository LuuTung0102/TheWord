
function setupNumericInput(el, maxLength) {
  el.addEventListener("input", (e) => {
    const v = window.REGEX_HELPERS.removeNonDigits(e.target.value).slice(0, maxLength);
    if (e.target.value !== v) {
      const pos = e.target.selectionStart - (e.target.value.length - v.length);
      e.target.value = v;
      e.target.selectionStart = e.target.selectionEnd = Math.max(0, pos);
    }
  });
  el.addEventListener("paste", (e) => {
    e.preventDefault();
    const text = window.REGEX_HELPERS.removeNonDigits(
      (e.clipboardData || window.clipboardData).getData("text")
    ).slice(0, maxLength);
    document.execCommand("insertText", false, text);
  });
}

function setupCCCDInput(el) {
  el.addEventListener("input", (e) => {
    let value = window.REGEX_HELPERS.removeNonDigits(e.target.value).slice(0, 12);
    e.target.value = value;
    
    if (value.length > 0 && !window.REGEX.CCCD_PATTERN.test(value)) {
      e.target.style.borderColor = '#ffa500';
      e.target.title = 'CCCD phải là 9 hoặc 12 số';
    } else {
      e.target.style.borderColor = '';
      e.target.title = '';
    }
  });
  
  el.addEventListener("focus", (e) => {
    e.target.value = window.REGEX_HELPERS.removeNonDigits(e.target.value);
  });
  
  el.addEventListener("blur", (e) => {
    let value = window.REGEX_HELPERS.removeNonDigits(e.target.value).slice(0, 12);
    if (value.length === 0) return;
    
    if (!window.REGEX.CCCD_PATTERN.test(value)) {
      e.target.style.borderColor = '#dc3545';
      e.target.style.borderWidth = '2px';
      e.target.title = 'CCCD phải là 9 hoặc 12 số';
      return;
    }
    
    if (window.REGEX.CCCD_PATTERN.test(value) && window.formatCCCD) {
      e.target.value = window.formatCCCD(value) || value;
    } else {
      e.target.value = value;
    }
    
    e.target.style.borderColor = '';
    e.target.style.borderWidth = '';
    e.target.title = '';
  });
  
  el.addEventListener("paste", (e) => {
    e.preventDefault();
    const text = window.REGEX_HELPERS.removeNonDigits(
      (e.clipboardData || window.clipboardData).getData("text")
    ).slice(0, 12);
    document.execCommand("insertText", false, text);
  });
}

function setupPhoneInput(el) {
  el.addEventListener("input", (e) => {
    let value = window.REGEX_HELPERS.removeNonDigits(e.target.value).slice(0, 10);
    e.target.value = value;
  });
  
  el.addEventListener("focus", (e) => {
    e.target.value = window.REGEX_HELPERS.removeNonDigits(e.target.value);
  });
  
  el.addEventListener("blur", (e) => {
    let value = window.REGEX_HELPERS.removeNonDigits(e.target.value).slice(0, 10);
    if (value.length === 0) return;
    if (window.REGEX.PHONE_PATTERN.test(value) && window.formatPhoneNumber) {
      e.target.value = window.formatPhoneNumber(value) || value;
    } else {
      e.target.value = value;
    }
  });
  
  el.addEventListener("paste", (e) => {
    e.preventDefault();
    const text = window.REGEX_HELPERS.removeNonDigits(
      (e.clipboardData || window.clipboardData).getData("text")
    ).slice(0, 10);
    document.execCommand("insertText", false, text);
  });
}

function setupMSTInput(el) {
  const getRawValue = (value) => {
    return window.REGEX_HELPERS.removeNonDigits(value).slice(0, 13);
  };
  
  el.addEventListener("input", (e) => {
    let rawValue = getRawValue(e.target.value);
    e.target.value = rawValue;
    if (rawValue.length > 0 && !window.REGEX.MST_PATTERN.test(rawValue)) {
      e.target.style.borderColor = '#ffa500';
      e.target.title = 'MST phải là 10 hoặc 13 số';
    } else {
      e.target.style.borderColor = '';
      e.target.title = '';
    }
  });
  
  el.addEventListener("focus", (e) => {
    e.target.value = getRawValue(e.target.value);
  });
  
  el.addEventListener("blur", (e) => {
    let rawValue = getRawValue(e.target.value);
    
    if (rawValue.length === 0) return;
    if (!window.REGEX.MST_PATTERN.test(rawValue)) {
      e.target.style.borderColor = '#dc3545';
      e.target.style.borderWidth = '2px';
      e.target.title = 'MST phải là 10 hoặc 13 số';
      e.target.value = rawValue;
      return;
    }
    if (window.REGEX.MST_PATTERN.test(rawValue) && window.formatMST) {
      e.target.value = window.formatMST(rawValue) || rawValue;
    } else {
      e.target.value = rawValue;
    }
    
    e.target.style.borderColor = '';
    e.target.style.borderWidth = '';
    e.target.title = '';
  });
  
  el.addEventListener("paste", (e) => {
    e.preventDefault();
    const text = getRawValue(
      (e.clipboardData || window.clipboardData).getData("text")
    );
    document.execCommand("insertText", false, text);
  });
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
  
  if (ph) {
    const nameMatch = ph.match(/^Name(\d+)$/);
    if (nameMatch) {
      const number = nameMatch[1];
      const nameTKey = `NameT${number}`;
      el.addEventListener('input', (e) => {
        const value = e.target.value.trim();
        if (value && window.toTitleCase) {
          const nameT = window.toTitleCase(value);
          const nameTField = document.querySelector(`[data-ph="${nameTKey}"]`);
          if (nameTField) {
            nameTField.value = nameT;
          }
        } else {
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
    let value = window.REGEX_HELPERS.removeNonDigits(e.target.value);
    e.target.value = value; 
  });
  el.addEventListener("focus", (e) => {
    let value = window.REGEX_HELPERS.removeNonDigits(e.target.value);
    e.target.value = value;
  });
  
  el.addEventListener("blur", (e) => {
    let value = window.REGEX_HELPERS.removeNonDigits(e.target.value);
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
    }
  });
}

function setupAreaInput(el) {
  function cleanValue(value) {
    if (!value || value === '') return '';
    let cleaned = value.replace(/[^\d.]/g, '');
    const parts = cleaned.split('.');
    if (parts.length > 2) {
      cleaned = parts[0] + '.' + parts.slice(1).join('');
    }
    return cleaned;
  }

  el.addEventListener("input", (e) => {
    const cleaned = cleanValue(e.target.value);
    e.target.value = cleaned;
  });

  el.addEventListener("focus", (e) => {
    const cleaned = cleanValue(e.target.value);
    e.target.value = cleaned;
  });

  el.addEventListener("blur", (e) => {
    let rawValue = cleanValue(e.target.value);
    
    if (rawValue.length === 0 || rawValue === '.') {
      e.target.value = '';
      const sTextField = document.querySelector('[data-ph="S_Text"]');
      if (sTextField) {
        sTextField.value = "";
      }
      return;
    }
    
    if (rawValue.endsWith('.')) {
      rawValue = rawValue.slice(0, -1);
    }
    
    e.target.value = rawValue;
    
    const numericValue = parseFloat(rawValue);
    if (!isNaN(numericValue)) {
      const sText = window.numberToAreaWords ? window.numberToAreaWords(rawValue) : "";
      const sTextField = document.querySelector('[data-ph="S_Text"]');
      if (sTextField && sText) {
        sTextField.value = sText;
      }
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

function setupHTSDInput(fieldWrapper, inputId) {
  if (fieldWrapper.dataset.htsdSetup === 'true') return;
  fieldWrapper.dataset.htsdSetup = 'true';
  
  const hiddenInput = fieldWrapper.querySelector('input[type="hidden"]');
  const loai1Toggle = fieldWrapper.querySelector('.htsd-toggle-loai1');
  const loai2Toggle = fieldWrapper.querySelector('.htsd-toggle-loai2');
  const loai1Content = fieldWrapper.querySelector('.htsd-loai1-content');
  const loai2Content = fieldWrapper.querySelector('.htsd-loai2-content');
  const selectInput = fieldWrapper.querySelector('.htsd-select');
  const commonInput = fieldWrapper.querySelector('input[data-htsd-type="common"]');
  const privateInput = fieldWrapper.querySelector('input[data-htsd-type="private"]');
  
  if (!hiddenInput || !loai1Toggle || !loai2Toggle || !loai1Content || !loai2Content || !selectInput || !commonInput || !privateInput) {
    console.error('[setupHTSDInput] Missing elements');
    return;
  }
  
  function updateHiddenValue() {
    const parts = [];
    
    const selectValue = selectInput.value;
    const commonValue = commonInput.value;
    const privateValue = privateInput.value;
    
    if (selectValue) parts.push(selectValue);
    if (commonValue) parts.push(commonValue);
    if (privateValue) parts.push(privateValue);
    
    hiddenInput.value = parts.join('|');
  }
  
  function toggleLoai1() {
    const isActive = loai1Toggle.classList.toggle('active');
    
    if (isActive) {
      loai1Content.classList.remove('hidden');
    } else {
      loai1Content.classList.add('hidden');
    }
    
    updateHiddenValue();
  }
  
  function toggleLoai2() {
    const isActive = loai2Toggle.classList.toggle('active');
    
    if (isActive) {
      loai2Content.classList.remove('hidden');
    } else {
      loai2Content.classList.add('hidden');
    }
    
    updateHiddenValue();
  }
  
  loai1Toggle.addEventListener('click', toggleLoai1);
  loai2Toggle.addEventListener('click', toggleLoai2);
  
  selectInput.addEventListener('change', updateHiddenValue);
  commonInput.addEventListener('input', updateHiddenValue);
  privateInput.addEventListener('input', updateHiddenValue);
}

function fillHTSDField(groupData, targetSuffix) {
  let htsdData = groupData['HTSD'];
  if (!htsdData) return;
  let value, printMode;
  if (typeof htsdData === 'object' && htsdData !== null) {
    value = htsdData.value;
    printMode = htsdData.printMode;
  } else if (typeof htsdData === 'string') {
    value = htsdData;
    printMode = null;
  } else {
    return;
  }
  
  if (!value) return;
  
  const fieldName = targetSuffix ? `HTSD${targetSuffix}` : 'HTSD';
  const htsdContainer = document.querySelector(`[data-field-name="${fieldName}"]`);
  if (!htsdContainer) return;
  
  const loai1Toggle = htsdContainer.querySelector('.htsd-toggle-loai1');
  const loai2Toggle = htsdContainer.querySelector('.htsd-toggle-loai2');
  const loai1Content = htsdContainer.querySelector('.htsd-loai1-content');
  const loai2Content = htsdContainer.querySelector('.htsd-loai2-content');
  const selectInput = htsdContainer.querySelector('select');
  const commonInput = htsdContainer.querySelector('input[data-htsd-type="common"]');
  const privateInput = htsdContainer.querySelector('input[data-htsd-type="private"]');
  
  if (!selectInput || !commonInput || !privateInput) return;
  
  const parts = value.split('|');
  const selectOptions = ['Sử dụng chung', 'Sử dụng riêng'];
  const selectValue = parts.find(p => selectOptions.includes(p));
  const numbers = parts.filter(p => !selectOptions.includes(p) && !isNaN(parseFloat(p)));
  
  if (selectValue) {
    selectInput.value = selectValue;
    selectInput.dispatchEvent(new Event('change', { bubbles: true }));
  }
  if (numbers[0]) {
    commonInput.value = numbers[0];
    commonInput.dispatchEvent(new Event('input', { bubbles: true }));
  }
  if (numbers[1]) {
    privateInput.value = numbers[1];
    privateInput.dispatchEvent(new Event('input', { bubbles: true }));
  }
  
  const hiddenInput = htsdContainer.querySelector('input[type="hidden"]');
  if (hiddenInput) {
    hiddenInput.value = value;
  }
  if (printMode === 'loai1') {
    loai1Toggle?.classList.add('active');
    loai1Content?.classList.remove('hidden');
    loai2Toggle?.classList.remove('active');
    loai2Content?.classList.add('hidden');
  } else if (printMode === 'loai2') {
    loai2Toggle?.classList.add('active');
    loai2Content?.classList.remove('hidden');
    loai1Toggle?.classList.remove('active');
    loai1Content?.classList.add('hidden');
  } else if (printMode === 'both') {
    loai1Toggle?.classList.add('active');
    loai2Toggle?.classList.add('active');
    loai1Content?.classList.remove('hidden');
    loai2Content?.classList.remove('hidden');
  } else {
    if (selectValue) {
      loai1Toggle?.classList.add('active');
      loai1Content?.classList.remove('hidden');
    }
    if (numbers.length > 0) {
      loai2Toggle?.classList.add('active');
      loai2Content?.classList.remove('hidden');
    }
  }
}

function setupDatePickers() {
  try {
    if (typeof flatpickr === "undefined") {
      return;
    }
    const dateInputs = document.querySelectorAll(".date-input, .date-picker");
    if (dateInputs.length === 0) {
      return;
    }
    
    dateInputs.forEach((input) => {
      if (input._flatpickr) {
        input._flatpickr.destroy();
      }
      
      const createFlatpickr = () => {
        return flatpickr(input, {
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
              shorthand: ['Th1', 'Th2', 'Th3', 'Th4', 'Th5', 'Th6', 'Th7', 'Th8', ' Th9', 'Th10', 'Th11', 'Th12'],
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
            
            const yearOnly = raw.match(/^(\d{4})$/);
            if (yearOnly) {
              instance.input.value = yearOnly[1];
              return;
            }
            
            const m = raw.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
            if (m) {
              const dd = m[1].padStart(2, "0");
              const mm = m[2].padStart(2, "0");
              const yyyy = m[3];
              instance.input.value = `${dd}/${mm}/${yyyy}`;
            }
          },
        });
      };
      
      createFlatpickr();
      
      input.addEventListener('input', function(e) {
        const val = e.target.value.trim();
        const isYearOnly = /^\d{4}$/.test(val);
        
        if (isYearOnly) {
          if (input._flatpickr) {
            input._flatpickr.destroy();
            delete input._flatpickr;
          }
        } else {
          if (!input._flatpickr) {
            createFlatpickr();
          }
        }
      });
    });
  } catch (err) {
  }
}

function setupAddressSelects() {
  document.querySelectorAll(".address-group").forEach((group) => {
    const groupId = group.id.replace('_address_group', '');
    const provinceInput = document.getElementById(`${groupId}_province`);
    const wardInput = document.getElementById(`${groupId}_ward`);
    const villageInput = document.getElementById(`${groupId}_village`);
    
    if (!provinceInput || !wardInput || !villageInput) return;
    
    setupAddressSearchInput(provinceInput, wardInput, villageInput, groupId);
  });
}

function findNextInput(currentInput) {
  const allInputs = Array.from(document.querySelectorAll('input:not([type="hidden"]):not([disabled]), select:not([disabled]), textarea:not([disabled])'));
  const currentIndex = allInputs.indexOf(currentInput);
  if (currentIndex >= 0 && currentIndex < allInputs.length - 1) {
    return allInputs[currentIndex + 1];
  }
  return null;
}

function setupAddressSearchInput(provinceInput, wardInput, villageInput, groupId) {
  const provinceDropdown = document.getElementById(`${groupId}_province_dropdown`);
  const wardDropdown = document.getElementById(`${groupId}_ward_dropdown`);
  const villageDropdown = document.getElementById(`${groupId}_village_dropdown`);
  
  const addressSetup = {
    selectedProvince: null,
    selectedWard: null
  };
  
  provinceInput._addressSetup = addressSetup;
  wardInput._addressSetup = addressSetup;
  villageInput._addressSetup = addressSetup;
  
  let selectedIndex = -1;
  
  function filterProvinces(query) {
    if (!window.addressData) return [];
    return window.addressData.filter(p => 
      p.name.toLowerCase().includes(query.toLowerCase())
    );
  }
  
  function filterWards(query) {
    if (!addressSetup.selectedProvince || !addressSetup.selectedProvince.wards) return [];
    return addressSetup.selectedProvince.wards.filter(w => 
      w.name.toLowerCase().includes(query.toLowerCase())
    );
  }
  
  function filterVillages(query) {
    if (!addressSetup.selectedWard || !addressSetup.selectedWard.villages) return [];
    return addressSetup.selectedWard.villages.filter(v => 
      v.toLowerCase().includes(query.toLowerCase())
    );
  }
  
  function showDropdown(dropdown, items, onSelect) {
    selectedIndex = -1;
    dropdown.innerHTML = items.map((item, idx) => 
      `<div class="suggestion-item" data-index="${idx}">${typeof item === 'string' ? item : item.name}</div>`
    ).join('');
    dropdown.style.display = items.length > 0 ? 'block' : 'none';
    
    dropdown.querySelectorAll('.suggestion-item').forEach((el, idx) => {
      el.onclick = () => onSelect(items[idx]);
    });
  }
  
  function hideDropdown(dropdown) {
    dropdown.style.display = 'none';
    selectedIndex = -1;
  }
  
  provinceInput.addEventListener('input', (e) => {
    const query = e.target.value.trim();
    const filtered = filterProvinces(query);
    
    showDropdown(provinceDropdown, filtered, (province) => {
      addressSetup.selectedProvince = province;
      provinceInput.value = province.name;
      wardInput.value = '';
      wardInput.disabled = false;
      villageInput.value = '';
      villageInput.disabled = false;
      hideDropdown(provinceDropdown);
      wardInput.focus();
    });
  });
  
  provinceInput.addEventListener('focus', () => {
    const query = provinceInput.value.trim();
    const filtered = filterProvinces(query);
    showDropdown(provinceDropdown, filtered, (province) => {
      addressSetup.selectedProvince = province;
      provinceInput.value = province.name;
      wardInput.value = '';
      wardInput.disabled = false;
      villageInput.value = '';
      villageInput.disabled = false;
      hideDropdown(provinceDropdown);
      wardInput.focus();
    });
  });
  
  provinceInput.addEventListener('keydown', (e) => {
    const items = provinceDropdown.querySelectorAll('.suggestion-item');
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
      } else if (provinceInput.value.trim()) {
        hideDropdown(provinceDropdown);
        wardInput.focus();
      }
    } else if (e.key === 'Escape') {
      hideDropdown(provinceDropdown);
    } else if (e.key === 'Tab') {
      hideDropdown(provinceDropdown);
    }
  });
  
  wardInput.addEventListener('input', (e) => {
    const query = e.target.value.trim();
    const filtered = filterWards(query);
    
    showDropdown(wardDropdown, filtered, (ward) => {
      addressSetup.selectedWard = ward;
      wardInput.value = ward.name;
      villageInput.value = '';
      villageInput.disabled = false;
      hideDropdown(wardDropdown);
      villageInput.focus();
    });
  });
  
  wardInput.addEventListener('focus', () => {
    if (!addressSetup.selectedProvince) return;
    const query = wardInput.value.trim();
    const filtered = filterWards(query);
    showDropdown(wardDropdown, filtered, (ward) => {
      addressSetup.selectedWard = ward;
      wardInput.value = ward.name;
      villageInput.value = '';
      villageInput.disabled = false;
      hideDropdown(wardDropdown);
      villageInput.focus();
    });
  });
  
  wardInput.addEventListener('click', () => {
    if (!addressSetup.selectedProvince) return;
    const query = wardInput.value.trim();
    const filtered = filterWards(query);
    showDropdown(wardDropdown, filtered, (ward) => {
      addressSetup.selectedWard = ward;
      wardInput.value = ward.name;
      villageInput.value = '';
      villageInput.disabled = false;
      hideDropdown(wardDropdown);
      villageInput.focus();
    });
  });
  
  wardInput.addEventListener('keydown', (e) => {
    const items = wardDropdown.querySelectorAll('.suggestion-item');
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
      }
    } else if (e.key === 'Escape') {
      hideDropdown(wardDropdown);
    }
  });
  
  villageInput.addEventListener('input', (e) => {
    const query = e.target.value.trim();
    const filtered = filterVillages(query);
    
    if (filtered.length > 0) {
      showDropdown(villageDropdown, filtered, (village) => {
        villageInput.value = village;
        hideDropdown(villageDropdown);
        
        const nextInput = findNextInput(villageInput);
        if (nextInput) nextInput.focus();
      });
    } else {
      hideDropdown(villageDropdown);
    }
  });
  
  villageInput.addEventListener('focus', () => {
    if (!addressSetup.selectedWard) return;
    const query = villageInput.value.trim();
    const filtered = filterVillages(query);
    if (filtered.length > 0) {
      showDropdown(villageDropdown, filtered, (village) => {
        villageInput.value = village;
        hideDropdown(villageDropdown);
      });
    }
  });
  
  villageInput.addEventListener('click', () => {
    if (!addressSetup.selectedWard) return;
    const query = villageInput.value.trim();
    const filtered = filterVillages(query);
    if (filtered.length > 0) {
      showDropdown(villageDropdown, filtered, (village) => {
        villageInput.value = village;
        hideDropdown(villageDropdown);
      });
    }
  });
  
  villageInput.addEventListener('keydown', (e) => {
    const items = villageDropdown.querySelectorAll('.suggestion-item');
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
      if (selectedIndex >= 0 && items[selectedIndex]) {
        e.preventDefault();
        items[selectedIndex].click();
      } else {
        hideDropdown(villageDropdown);
        const nextInput = findNextInput(villageInput);
        if (nextInput) {
          e.preventDefault();
          nextInput.focus();
        }
      }
    } else if (e.key === 'Escape') {
      hideDropdown(villageDropdown);
    } else if (e.key === 'Tab') {
      hideDropdown(villageDropdown);
    }
  });
  
  document.addEventListener('click', (e) => {
    if (!provinceInput.contains(e.target) && !provinceDropdown.contains(e.target)) {
      hideDropdown(provinceDropdown);
    }
    if (!wardInput.contains(e.target) && !wardDropdown.contains(e.target)) {
      hideDropdown(wardDropdown);
    }
    if (!villageInput.contains(e.target) && !villageDropdown.contains(e.target)) {
      hideDropdown(villageDropdown);
    }
  });
}

function reSetupAllInputs() {
  setupDatePickers();
  setupAddressSelects();
  
  if (typeof window.setupEditableSelectInput === 'function') {
    document.querySelectorAll('.editable-select-input').forEach(input => {
      window.setupEditableSelectInput(input);
    });
  }
  
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
    input.removeAttribute('maxlength');
    setupMSTInput(input);
  });
  
  const emailInputs = document.querySelectorAll('input[data-ph*="Email"], input[data-ph*="EMAIL"]');
  emailInputs.forEach(input => {
    setupEmailInput(input);
  });
  
  const nameInputs = document.querySelectorAll('input[data-ph*="Name"]');
  nameInputs.forEach(input => {
    const ph = input.getAttribute('data-ph');
    // Skip NamePG - don't convert to uppercase
    if (ph && ph.includes('NamePG')) {
      return;
    }
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
  
  document.querySelectorAll('input[data-type="land_type"]').forEach(input => {
    delete input.dataset.landTypeSetup;
    const id = input.id;
    if (id) setupLandTypeInput(input, id);
  });
  
  document.querySelectorAll('.land-type-size-container').forEach(container => {
    const type = container.dataset.type;
    
    if (type === 'land_type_detail') {
      const containerId = container.id.replace('_container', '');
      if (!container.dataset.landTypeDetailSetup) {
        setupLandTypeDetailInput(container, containerId);
        container.dataset.landTypeDetailSetup = 'true';
      }
    } else if (type === 'land_type_size') {
      const inputId = container.querySelector('.tag-input')?.id;
      if (inputId && !container.dataset.landTypeSizeSetup) {
        setupLandTypeSizeInput(container, inputId);
        container.dataset.landTypeSizeSetup = 'true';
      }
    }
  });
  
  document.querySelectorAll('[data-field-type="htsd_custom"]').forEach(fieldWrapper => {
    if (!fieldWrapper.dataset.htsdSetup) {
      const hiddenInput = fieldWrapper.querySelector('input[type="hidden"]');
      const inputId = hiddenInput?.id;
      if (inputId) {
        setupHTSDInput(fieldWrapper, inputId);
      }
    }
  });
}

function cleanupAllEventListeners() {
  document.querySelectorAll('input[data-type="land_type"]').forEach(input => {
    if (input._cleanupFunctions) {
      input._cleanupFunctions.forEach(fn => fn());
      input._cleanupFunctions = [];
    }
    delete input.dataset.landTypeSetup;
  });
  
  document.querySelectorAll('.land-type-dropdown').forEach(dropdown => {
    dropdown.style.display = 'none';
  });
  
}


if (typeof window !== 'undefined') {
  window.cleanupAllEventListeners = cleanupAllEventListeners;
}

function formatInputValue(value, ph, map) {
  if (!value || !map) return value || '';
  let formatted = value;
  if (map.type === "date") {
    const yearOnly = value.match(/^(\d{4})$/);
    if (yearOnly) {
      return yearOnly[1];
    }
    
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
      const digits = window.REGEX_HELPERS.removeNonDigits(value);
      if (window.REGEX.CCCD_PATTERN.test(digits)) {
        formatted = window.formatCCCD ? window.formatCCCD(digits) : digits;
      } else {
        formatted = digits;
      }
    }
  }
  
  return formatted;
}


function setupLandTypeDetailInput(container, inputId) {
  const typeInput = document.getElementById(`${inputId}_type`);
  const locationInput = document.getElementById(`${inputId}_location`);
  const areaInput = document.getElementById(`${inputId}_area`);
  const dropdown = document.getElementById(`${inputId}_dropdown`);
  const addBtn = document.getElementById(`${inputId}_addBtn`);
  const tagsWrapper = document.getElementById(`${inputId}_tags`);
  const ph = container.dataset.ph;
  
  if (!typeInput || !locationInput || !areaInput || !dropdown || !addBtn || !tagsWrapper) {
    return;
  }
  
  const getLandKeys = () => {
    return window.landTypeMap ? Object.keys(window.landTypeMap).sort() : [];
  };  
  
  let tags = [];
  let selectedIndex = -1;
  let currentTagIndex = -1;
  
  function showAllInputs() {
    const inputWrapper = document.getElementById(`${inputId}_input_wrapper`);
    const locationWrapper = document.getElementById(`${inputId}_location_wrapper`);
    const areaWrapper = document.getElementById(`${inputId}_area_wrapper`);
    
    if (inputWrapper) inputWrapper.classList.add('show');
    if (locationWrapper) locationWrapper.style.display = 'block';
    if (areaWrapper) areaWrapper.style.display = 'block';
    addBtn.style.display = 'inline-flex';
  }
  
  function hideExtraInputs() {
    const inputWrapper = document.getElementById(`${inputId}_input_wrapper`);
    const locationWrapper = document.getElementById(`${inputId}_location_wrapper`);
    const areaWrapper = document.getElementById(`${inputId}_area_wrapper`);
    
    if (inputWrapper) inputWrapper.classList.add('show');
    if (locationWrapper) locationWrapper.style.display = 'none';
    if (areaWrapper) areaWrapper.style.display = 'none';
    addBtn.style.display = 'none';
    locationInput.value = '';
    areaInput.value = '';
    typeInput.value = '';
    currentTagIndex = -1;
    document.querySelectorAll('.land-type-tag').forEach(t => t.classList.remove('editing'));
  }
  
  function renderTags() {
    tagsWrapper.innerHTML = '';
    
    tags.forEach((tag, idx) => {
      const tagEl = document.createElement('div');
      tagEl.className = 'land-type-tag';
      tagEl.dataset.tagIndex = idx;
      
      const codeSpan = document.createElement('span');
      codeSpan.className = 'tag-code';
      codeSpan.textContent = tag.code;
      
      const locationSpan = document.createElement('span');
      locationSpan.className = 'tag-location';
      locationSpan.textContent = tag.location ? ` - ${tag.location}` : '';
      locationSpan.dataset.tagIndex = idx;
      
      const areaSpan = document.createElement('span');
      areaSpan.className = 'tag-area';
      areaSpan.textContent = tag.area ? ` - ${tag.area}m²` : '';
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
      tagEl.appendChild(locationSpan);
      tagEl.appendChild(areaSpan);
      tagEl.appendChild(deleteBtn);
      
      tagEl.onclick = (e) => {
        if (e.target === deleteBtn || e.target.parentElement === deleteBtn) return;
        
        currentTagIndex = idx;
        showAllInputs();
        typeInput.value = tag.code;
        locationInput.value = tag.location || '';
        areaInput.value = tag.area || '';
        typeInput.focus();
        updateDropdown(tag.code);
        document.querySelectorAll('.land-detail-tag').forEach(t => t.classList.remove('editing'));
        tagEl.classList.add('editing');
      };
      
      tagsWrapper.appendChild(tagEl);
    });
    
    updateHiddenValue();
  }
  
  function updateHiddenValue() {
    const hiddenInput = document.getElementById(inputId);
    if (!hiddenInput) {
      return;
    }
    
    if (tags.length === 0) {
      hiddenInput.value = '';
    } else {
      const value = tags.map(t => `${t.code}|${t.location || ''}|${t.area || ''}`).join(';');
      hiddenInput.value = value;
    }
    hiddenInput.dispatchEvent(new Event('change', { bubbles: true }));
    hiddenInput.dispatchEvent(new Event('input', { bubbles: true }));
  }
  
  function updateDropdown(query) {
    if (!dropdown) return;
    selectedIndex = -1;
    
    const landKeys = getLandKeys();
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
  
  typeInput.addEventListener('input', (e) => {
    const query = e.target.value.trim().toUpperCase();
    updateDropdown(query);
  });
  
  typeInput.addEventListener('focus', () => {
    const query = typeInput.value.trim().toUpperCase();
    updateDropdown(query);
  });
  
  typeInput.addEventListener('keydown', (e) => {
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
        const key = items[selectedIndex].dataset.key;
        typeInput.value = key;
        dropdown.style.display = 'none';
        selectedIndex = -1;
        showAllInputs();
        setTimeout(() => {
          locationInput.focus();
        }, 50);
      } else if (items.length === 1) {
        const key = items[0].dataset.key;
        typeInput.value = key;
        dropdown.style.display = 'none';
        selectedIndex = -1;
        showAllInputs();
        setTimeout(() => {
          locationInput.focus();
        }, 50);
      }
    } else if (e.key === 'Escape') {
      dropdown.style.display = 'none';
      selectedIndex = -1;
    } else if (e.key === 'Tab') {
      if (items.length === 1) {
        e.preventDefault();
        const key = items[0].dataset.key;
        typeInput.value = key;
        dropdown.style.display = 'none';
        selectedIndex = -1;
        showAllInputs();
        setTimeout(() => {
          locationInput.focus();
        }, 50);
      }
    }
  });
  
  dropdown.addEventListener('click', (e) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (e.target.classList.contains('suggestion-item')) {
      const key = e.target.dataset.key;
      typeInput.value = key;
      dropdown.style.display = 'none';
      selectedIndex = -1;
      showAllInputs();
      setTimeout(() => {
        locationInput.focus();
      }, 50);
    }
  });
  
  locationInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      areaInput.focus();
    }
  });
  
  areaInput.addEventListener('input', (e) => {
    let value = e.target.value.replace(/[^\d.]/g, '');
    const parts = value.split('.');
    if (parts.length > 2) {
      value = parts[0] + '.' + parts.slice(1).join('');
    }
    e.target.value = value;
  });
  
  areaInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      addBtn.click();
    }
  });
  
  addBtn.addEventListener('click', () => {
    const code = typeInput.value.trim().toUpperCase();
    const location = locationInput.value.trim();
    const area = areaInput.value.trim();
    
    if (!code) {
      typeInput.focus();
      return;
    }
    
    if (currentTagIndex >= 0) {
      tags[currentTagIndex] = { code, location, area };
      currentTagIndex = -1;
    } else {
      tags.push({ code, location, area });
    }
    
    renderTags();
    hideExtraInputs();
    dropdown.style.display = 'none';
  });
  
  const handleClickOutside = (e) => {
    if (!container.contains(e.target)) {
      dropdown.style.display = 'none';
    }
  };
  document.addEventListener('click', handleClickOutside);
  
  const hiddenInput = document.getElementById(inputId);
  if (hiddenInput && hiddenInput.value) {
    const existingValue = hiddenInput.value.trim();
    if (existingValue) {
      const parts = existingValue.split(';').map(p => p.trim()).filter(Boolean);
      parts.forEach(part => {
        const [code, location, area] = part.split('|');
        if (code) {
          tags.push({
            code: code.trim(),
            location: location ? location.trim() : '',
            area: area ? area.trim() : ''
          });
        }
      });
      renderTags();
    }
  }
  
  container.reloadLandTypeDetailValue = function() {
    tags.length = 0; 
    const currentValue = hiddenInput.value.trim();
    if (currentValue) {
      const parts = currentValue.split(';').map(p => p.trim()).filter(Boolean);
      parts.forEach(part => {
        const [code, location, area] = part.split('|');
        if (code) {
          tags.push({
            code: code.trim(),
            location: location ? location.trim() : '',
            area: area ? area.trim() : ''
          });
        }
      });
    }
    renderTags();
  
    locationInput.value = '';
    areaInput.value = '';
    typeInput.value = '';
    currentTagIndex = -1;
  };
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
window.setupLandTypeDetailInput = setupLandTypeDetailInput;
function setupLandTypeSizeInput(container, inputId) {
  const input = document.getElementById(inputId);
  const tagsWrapper = container.querySelector('.tags-wrapper');
  const dropdown = container.querySelector('.land-type-dropdown');
  const addBtn = container.querySelector('.tag-add-btn');
  const inputWrapper = container.querySelector('.tag-input-wrapper');
  const ph = container.dataset.ph;
  
  if (!input || !tagsWrapper || !dropdown || !addBtn || !inputWrapper) {
    return;
  }
  
  const landKeys = window.landTypeMap ? Object.keys(window.landTypeMap).sort() : [];
  let tags = []; 
  let selectedIndex = -1;
  let currentTagIndex = -1; 
  
  function showInput() {
    inputWrapper.classList.add('show');
    input.value = '';
    input.focus();
    updateDropdown('');
  }
  
  function hideInput() {
    inputWrapper.classList.remove('show');
    dropdown.style.display = 'none';
    input.value = '';
    currentTagIndex = -1;
    document.querySelectorAll('.land-type-tag').forEach(t => t.classList.remove('editing'));
  }
  
  function loadExistingValue() {
    const existingValue = input.value.trim();
    if (!existingValue) return;
    
    const parts = existingValue.split(/\s+/);
    if (parts.length === 0) return;
    
    if (parts.length === 2 && parts[1].includes(';')) {
      const codes = parts[0].split('+').map(c => c.trim().toUpperCase());
      const areas = parts[1].split(';').map(a => a.trim().replace(/m2/g, '').trim());
      
      codes.forEach((code, idx) => {
        if (code && areas[idx]) {
          tags.push({ code: code, area: areas[idx] });
        }
      });
    } else {
      const pairs = existingValue.split(';').map(p => p.trim());
      pairs.forEach(pair => {
        let match = pair.match(/^([A-Z]+)\s+(\d+(?:\.\d+)?)\s*m2?$/i);
        if (match) {
          tags.push({ code: match[1].toUpperCase(), area: match[2] });
        } else {
          match = pair.match(/^(\d+(?:\.\d+)?)\s*m2?\s*([A-Z]+)$/i);
          if (match) {
            tags.push({ code: match[2].toUpperCase(), area: match[1] });
          } else {
            match = pair.match(/^([A-Z]+)\s+(\d+(?:\.\d+)?)$/);
            if (match) {
              tags.push({ code: match[1].toUpperCase(), area: match[2] });
            } else {
              match = pair.match(/^([A-Z]+)$/i);
              if (match) {
                tags.push({ code: match[1].toUpperCase(), area: '' });
              }
            }
          }
        }
      });
    }
    
    renderTags();
    if (tags.length > 0) {
      hideInput();
    }
  }
  
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
      areaSpan.dataset.tagIndex = idx;
      
      const areaInput = document.createElement('input');
      areaInput.type = 'text';
      areaInput.className = 'tag-area-input';
      areaInput.value = tag.area || '';
      areaInput.dataset.tagIndex = idx;
      areaInput.style.display = 'none';
      areaInput.style.width = '60px';
      areaInput.style.padding = '2px 4px';
      areaInput.style.border = '1px solid rgba(255, 255, 255, 0.3)';
      areaInput.style.borderRadius = '3px';
      areaInput.style.background = 'rgba(255, 255, 255, 0.2)';
      areaInput.style.color = 'white';
      areaInput.style.fontSize = '0.875rem';
      areaInput.style.textAlign = 'center';
      areaInput.style.outline = 'none';
      
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
      tagEl.appendChild(areaInput);
      tagEl.appendChild(deleteBtn);
      
      tagEl.onclick = (e) => {
        if (e.target === deleteBtn || e.target.parentElement === deleteBtn) return;
        if (e.target === areaInput || e.target === areaSpan) {
          e.stopPropagation();
          areaSpan.style.display = 'none';
          areaInput.style.display = 'inline-block';
          areaInput.focus();
          areaInput.select();
          return;
        }
        
        currentTagIndex = idx;
        showInput();
        input.value = tag.code;
        updateDropdown(input.value);
        document.querySelectorAll('.land-type-tag[data-tag-index]').forEach(t => t.classList.remove('editing'));
        tagEl.classList.add('editing');
      };
      
      areaSpan.addEventListener('click', (e) => {
        e.stopPropagation();
        areaSpan.style.display = 'none';
        areaInput.style.display = 'inline-block';
        areaInput.focus();
        areaInput.select();
      });
      
      areaInput.addEventListener('input', (e) => {
        let value = e.target.value.replace(/[^\d.]/g, '');
        const parts = value.split('.');
        if (parts.length > 2) {
          value = parts[0] + '.' + parts.slice(1).join('');
        }
        e.target.value = value;
      });
      
      areaInput.addEventListener('blur', () => {
        const newArea = areaInput.value.trim();
        if (newArea && !isNaN(parseFloat(newArea)) && parseFloat(newArea) >= 0) {
          tag.area = newArea;
          areaSpan.textContent = ` - ${newArea}m²`;
          areaInput.style.display = 'none';
          areaSpan.style.display = 'inline';
          updateHiddenValue();
        } else if (newArea === '') {
          areaInput.value = tag.area || '';
          areaInput.style.display = 'none';
          areaSpan.style.display = 'inline';
        } else {
          areaInput.value = tag.area || '';
          areaInput.style.display = 'none';
          areaSpan.style.display = 'inline';
        }
      });
      
      areaInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
          e.preventDefault();
          areaInput.blur();
        } else if (e.key === 'Escape') {
          e.preventDefault();
          areaInput.value = tag.area || '';
          areaInput.blur();
        }
      });
      
      tagsWrapper.appendChild(tagEl);
    });
    
    updateHiddenValue();
  }
  
  function updateHiddenValue() {

    
    if (tags.length === 0) {
      input.value = '';
      input.dispatchEvent(new Event('change', { bubbles: true }));
      input.dispatchEvent(new Event('input', { bubbles: true }));
      return;
    }
    
    const value = tags.map(t => `${t.code} ${t.area}`).join('; ');
    input.value = value;
    input.dispatchEvent(new Event('change', { bubbles: true }));
    input.dispatchEvent(new Event('input', { bubbles: true }));
  }
  
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
  
  input.addEventListener('input', (e) => {
    const query = e.target.value.trim().toUpperCase();
    updateDropdown(query);
    document.querySelectorAll('.land-type-tag').forEach(t => t.classList.remove('editing'));
    currentTagIndex = -1;
  });
  
  input.addEventListener('focus', () => {
    const query = input.value.trim().toUpperCase();
    updateDropdown(query);
  });
  
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
  
  function addTag(code, area = '') {
    if (currentTagIndex >= 0 && currentTagIndex < tags.length) {
      tags[currentTagIndex].code = code;
      if (area) tags[currentTagIndex].area = area;
      currentTagIndex = -1;
    } else {
      const existingIndex = tags.findIndex(t => t.code === code);
      if (existingIndex >= 0) {
        const tagEl = tagsWrapper.querySelector(`[data-tag-index="${existingIndex}"]`);
        if (tagEl) tagEl.click();
        return;
      }
      
      tags.push({ code: code, area: area || '' });
    }
    
    renderTags();
    
    if (!area) {
      const newTagIndex = tags.findIndex(t => t.code === code);
      if (newTagIndex >= 0) {
        setTimeout(() => {
          const tagEl = tagsWrapper.querySelector(`[data-tag-index="${newTagIndex}"]`);
          if (tagEl) {
            const areaSpan = tagEl.querySelector('.tag-area');
            if (areaSpan) {
              areaSpan.focus();
              const range = document.createRange();
              range.selectNodeContents(areaSpan);
              const sel = window.getSelection();
              sel.removeAllRanges();
              sel.addRange(range);
            }
          }
          hideInput();
        }, 50);
      } else {
        hideInput();
      }
    } else {
      hideInput();
    }
  }
  
  addBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    if (inputWrapper.classList.contains('show')) {
      input.focus();
    } else {
      showInput();
    }
  });
  
  document.addEventListener('click', (e) => {
    if (!container.contains(e.target)) {
      hideInput();
    }
  });
  

  container.reloadLandTypeSizeValue = function() {
    tags = []; 
    loadExistingValue();
  };
  loadExistingValue();
}

window.reSetupAllInputs = reSetupAllInputs;
window.formatInputValue = formatInputValue;
window.setupLandTypeSizeInput = setupLandTypeSizeInput;
window.setupHTSDInput = setupHTSDInput;
window.fillHTSDField = fillHTSDField;
