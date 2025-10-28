
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
  // ✅ Khi đang gõ - chỉ cho phép nhập số và giới hạn 12 số
  el.addEventListener("input", (e) => {
    let value = e.target.value.replace(/\D/g, ""); // Chỉ giữ số
    value = value.slice(0, 12); // Giới hạn 12 số
    e.target.value = value; // Không format, chỉ hiển thị số thuần
  });
  
  // ✅ Khi focus - xóa dấu chấm để dễ chỉnh sửa
  el.addEventListener("focus", (e) => {
    let value = e.target.value.replace(/\D/g, ""); // Loại bỏ dấu chấm
    e.target.value = value;
  });
  
  // ✅ Khi blur (mất focus) - format với dấu chấm sử dụng utils.js
  el.addEventListener("blur", (e) => {
    let value = e.target.value.replace(/\D/g, "");
    value = value.slice(0, 12);
    
    if (value.length === 0) return; // Không format nếu rỗng
    
    // ✅ Sử dụng hàm formatCCCD từ utils.js
    if (value.length === 12 && window.formatCCCD) {
      const formatted = window.formatCCCD(value);
      // Nếu formatCCCD trả về chuỗi rỗng, giữ nguyên value
      e.target.value = formatted || value;
      console.log(`🆔 CCCD formatted: ${value} -> ${formatted || value}`);
    } else {
      // Nếu chưa đủ 12 số, giữ nguyên
      e.target.value = value;
    }
  });
  
  // ✅ Khi paste - giữ số thuần, không format
  el.addEventListener("paste", (e) => {
    e.preventDefault();
    let text = (e.clipboardData || window.clipboardData)
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
      // Hiển thị cảnh báo nhẹ nhưng không chặn form
      e.target.style.borderColor = "#ffa500";
      setTimeout(() => {
        e.target.style.borderColor = "";
      }, 2000);
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
  // Prevent duplicate setup
  if (el.dataset.landTypeSetup === 'true') {
    console.log('⚠️ setupLandTypeInput already done for', id);
    return;
  }
  
  const dropdown = document.getElementById(`${id}_dropdown`);
  
  // ✅ NULL CHECK: If dropdown doesn't exist, retry after DOM render
  if (!dropdown) {
    console.warn(`⚠️ Dropdown not found for ${id}, will retry...`);
    requestAnimationFrame(() => {
      setTimeout(() => {
        const retryDropdown = document.getElementById(`${id}_dropdown`);
        if (retryDropdown && !el.dataset.landTypeSetup) {
          console.log(`✅ Retry successful for ${id}`);
          setupLandTypeInput(el, id); // Retry
        }
      }, 50);
    });
    return;
  }
  
  // Mark as setup
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
    // ✅ NULL CHECK
    if (!dropdown || !el) return;
    
    // Show all when no query (e.g., user presses ArrowDown)
    const selected = getSelectedCodes(el.value);
    const filtered = landKeys.filter(
      (key) => !selected.includes(key) && (!query || key.toUpperCase().includes(query))
    );
    dropdown.innerHTML = filtered
      .map((key) => {
        const desc = window.landTypeMap ? window.landTypeMap[key] : key;
        return `<div class="suggestion-item" data-key="${key}">${key}: ${desc}</div>`;
      })
      .join("");
    dropdown.style.display = filtered.length ? "block" : "none";
    dropdown.style.left = el.offsetLeft + "px";
    dropdown.style.top = el.offsetTop + el.offsetHeight + "px";
  }


  el.addEventListener("input", (e) => {
    const cursorPos = e.target.selectionStart;
    const query = getCurrentQuery(e.target.value, cursorPos);
    updateDropdown(query);
  });

  el.addEventListener("focus", (e) => {
    // Khi focus, hiện TẤT CẢ options
    const cursorPos = e.target.selectionStart;
    const query = getCurrentQuery(e.target.value, cursorPos);
    updateDropdown(query);
  });

  el.addEventListener("keydown", (e) => {
    if (e.key === "+" && !el.value.endsWith("+")) {
      e.preventDefault();
      const cursorPos = e.target.selectionStart;
      const newValue = el.value.slice(0, cursorPos) + "+" + el.value.slice(cursorPos);
      el.value = newValue;
      e.target.selectionStart = e.target.selectionEnd = cursorPos + 1;
      const query = "";
      updateDropdown(query);
    } else if (e.key === "ArrowDown") {
      // Open dropdown with all options when pressing ArrowDown
      e.preventDefault();
      updateDropdown("");
    } else if (e.key === "Escape") {
      if (dropdown) dropdown.style.display = "none";
    }
  });

  // Click outside to hide dropdown - Use named function for cleanup
  const handleClickOutside = (e) => {
    // ✅ NULL CHECK
    if (!el || !dropdown) return;
    if (!el.contains(e.target) && !dropdown.contains(e.target)) {
      dropdown.style.display = "none";
    }
  };
  document.addEventListener("click", handleClickOutside);
  
  // Store for cleanup
  if (!el._cleanupFunctions) el._cleanupFunctions = [];
  el._cleanupFunctions.push(() => {
    document.removeEventListener("click", handleClickOutside);
  });

  // Delegate click on suggestions
  dropdown.addEventListener("click", (e) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (e.target.classList.contains("suggestion-item")) {
      const key = e.target.dataset.key;
      const currentValue = el.value.trim();
      
      if (!currentValue) {
        // Trống: Chỉ thêm key
        el.value = key;
      } else {
        // Có giá trị: Kiểm tra xem có dấu "+" không
        const lastPlusIndex = currentValue.lastIndexOf('+');
        
        if (lastPlusIndex >= 0) {
          // Có "+": Replace phần sau dấu "+" cuối cùng
          el.value = currentValue.substring(0, lastPlusIndex + 1) + key;
        } else {
          // Không có "+": Replace toàn bộ (vì đang là query)
          el.value = key;
        }
      }
      
      // Đóng dropdown
      dropdown.style.display = "none";
    }
  });
}

function setupMoneyInput(el) {
  // ✅ Khi đang gõ - chỉ cho phép nhập số
  el.addEventListener("input", (e) => {
    let value = e.target.value.replace(/\D/g, ""); // Chỉ giữ số
    e.target.value = value; // Không format, chỉ hiển thị số thuần
  });
  
  // ✅ Khi focus - xóa dấu phẩy để dễ chỉnh sửa
  el.addEventListener("focus", (e) => {
    let value = e.target.value.replace(/\D/g, ""); // Loại bỏ dấu phẩy
    e.target.value = value;
  });
  
  // ✅ Khi blur (mất focus) - format với dấu phẩy và cập nhật MoneyText
  el.addEventListener("blur", (e) => {
    let value = e.target.value.replace(/\D/g, "");
    
    if (value.length === 0) {
      // Nếu rỗng, clear MoneyText
      const moneyTextField = document.querySelector('[data-ph="MoneyText"]');
      if (moneyTextField) {
        moneyTextField.value = "";
      }
      return;
    }
    
    // ✅ Sử dụng hàm formatWithCommas từ utils.js
    const formatted = window.formatWithCommas ? window.formatWithCommas(value) : value;
    e.target.value = formatted;
    
    // ✅ Sử dụng hàm numberToVietnameseWords từ utils.js
    const moneyText = window.numberToVietnameseWords ? window.numberToVietnameseWords(value) : "";
    const moneyTextField = document.querySelector('[data-ph="MoneyText"]');
    if (moneyTextField && moneyText) {
      moneyTextField.value = moneyText;
      console.log(`💰 Money: ${formatted} -> Text: "${moneyText}"`);
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
    
    // Tìm tất cả các trường date-input và date-picker
    const dateInputs = document.querySelectorAll(".date-input, .date-picker");
    if (dateInputs.length === 0) {
      console.warn("⚠️ No date inputs found");
      return;
    }
    console.log(`✅ Found ${dateInputs.length} date inputs`);
    
    dateInputs.forEach((input) => {
      // Destroy existing flatpickr instance if any
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
          // If user typed a value like d/m/yyyy, normalize it
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
      // Get mainId from data-main attribute or extract from id
      let mainId = e.target.dataset.main;
      if (!mainId) {
        // Extract mainId from id like "Address1_province" -> "Address1"
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

// Re-setup all form inputs (called after form is rendered)
function reSetupAllInputs() {
  // Setup date pickers and address selects first
  setupDatePickers();
  setupAddressSelects();
  
  // Setup CCCD inputs
  const cccdInputs = document.querySelectorAll('input[data-ph*="CCCD"]');
  cccdInputs.forEach(input => {
    // ✅ Remove maxlength attribute to allow formatted value (12 digits + 3 dots = 15 chars)
    input.removeAttribute('maxlength');
    setupCCCDInput(input);
  });
  
  // Setup phone inputs
  const phoneInputs = document.querySelectorAll('input[data-ph*="SDT"], input[data-ph*="Phone"]');
  phoneInputs.forEach(input => {
    setupPhoneInput(input);
  });
  
  // Setup MST inputs
  const mstInputs = document.querySelectorAll('input[data-ph*="MST"]');
  mstInputs.forEach(input => {
    setupMSTInput(input);
  });
  
  // Setup email inputs
  const emailInputs = document.querySelectorAll('input[data-ph*="Email"], input[data-ph*="EMAIL"]');
  emailInputs.forEach(input => {
    setupEmailInput(input);
  });
  
  // Setup name inputs
  const nameInputs = document.querySelectorAll('input[data-ph*="Name"]');
  nameInputs.forEach(input => {
    setupNameInput(input);
  });
  
  // Setup money inputs
  document.querySelectorAll('input[data-ph="Money"]').forEach(input => {
    setupMoneyInput(input);
  });
  
  // Setup note textareas
  document.querySelectorAll('textarea[data-ph="Note"]').forEach(textarea => {
    setupNoteTextarea(textarea);
  });
  
  // Setup land type inputs
  document.querySelectorAll('input[data-ph="Loai_Dat"]').forEach(input => {
    const id = input.id;
    if (id) setupLandTypeInput(input, id);
  });
}

// 🗑️ Cleanup all event listeners before rendering new form
function cleanupAllEventListeners() {
  console.log('🗑️ Cleaning up old event listeners...');
  
  // Cleanup land type inputs
  document.querySelectorAll('input[data-ph="Loai_Dat"]').forEach(input => {
    if (input._cleanupFunctions) {
      input._cleanupFunctions.forEach(fn => fn());
      input._cleanupFunctions = [];
    }
    // ✅ REMOVE flag, not just set to false
    delete input.dataset.landTypeSetup;
  });
  
  // Hide all dropdowns
  document.querySelectorAll('.land-type-dropdown').forEach(dropdown => {
    dropdown.style.display = 'none';
  });
  
  console.log('✅ Cleanup completed');
}

// Export to window
if (typeof window !== 'undefined') {
  window.cleanupAllEventListeners = cleanupAllEventListeners;
}

function formatInputValue(value, ph, map) {
  if (!value || !map) return value || '';
  
  let formatted = value;
  
  // Format based on type
  if (map.type === "date") {
    // Format date
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
    // Format CCCD
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

// Export to window for global access
window.setupNumericInput = setupNumericInput;
window.setupCCCDInput = setupCCCDInput;
window.setupPhoneInput = setupPhoneInput;
window.setupMSTInput = setupMSTInput;
window.setupEmailInput = setupEmailInput;
window.isValidEmail = isValidEmail;
window.setupNameInput = setupNameInput;
window.setupLandTypeInput = setupLandTypeInput;
window.setupMoneyInput = setupMoneyInput;
window.setupNoteTextarea = setupNoteTextarea;
window.setupDatePickers = setupDatePickers;
window.setupAddressSelects = setupAddressSelects;
window.reSetupAllInputs = reSetupAllInputs;
window.formatInputValue = formatInputValue;

