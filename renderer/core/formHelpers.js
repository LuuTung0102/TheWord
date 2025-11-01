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
window.reSetupAllInputs = reSetupAllInputs;
window.formatInputValue = formatInputValue;

