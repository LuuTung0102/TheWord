// ==========================================
// FORM INPUT HELPER FUNCTIONS
// Extracted from formHandler.js for better organization
// ==========================================

// Generic numeric input setup function (DRY principle)
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
  setupNumericInput(el, 12);
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
  const dropdown = document.getElementById(`${id}_dropdown`);
  const landKeys = window.landTypeMap ? Object.keys(window.landTypeMap).sort() : [];

  function getSelectedCodes(value) {
    return value
      .split("")
      .map((s) => s.trim().toUpperCase())
      .filter(Boolean);
  }

  function getCurrentQuery(value, cursorPos) {
    const beforeCursor = value.slice(0, cursorPos);
    const afterLastPlus = beforeCursor.split("+").pop() || "";
    return afterLastPlus.toUpperCase();
  }

  function updateDropdown(query) {
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
      dropdown.style.display = "none";
    }
  });

  // Click outside to hide dropdown
  document.addEventListener("click", (e) => {
    if (!el.contains(e.target) && !dropdown.contains(e.target)) {
      dropdown.style.display = "none";
    }
  });

  // Delegate click on suggestions
  dropdown.addEventListener("click", (e) => {
    if (e.target.classList.contains("suggestion-item")) {
      const key = e.target.dataset.key;
      const cursorPos = el.selectionStart;
      const beforeCursor = el.value.slice(0, cursorPos);
      const afterCursor = el.value.slice(cursorPos);
      // Find the position after the last + before cursor
      const lastPlusIndex = beforeCursor.lastIndexOf("+");
      const insertPos = lastPlusIndex >= 0 ? lastPlusIndex + 1 : 0;
      const newValue =
        el.value.slice(0, insertPos) +
        key +
        (afterCursor || beforeCursor.endsWith("+") ? "" : "+") +
        el.value.slice(insertPos + (beforeCursor.length - insertPos));
      el.value = newValue;
      el.selectionStart = el.selectionEnd =
        insertPos +
        key.length +
        (afterCursor || beforeCursor.endsWith("+") ? 0 : 1);
      updateDropdown("");
    }
  });
}

function setupMoneyInput(el) {
  el.addEventListener("input", (e) => {
    const input = e.target;
    const rawBefore = input.getAttribute("data-raw") || "";
    const displayed = input.value;
    const caret = input.selectionStart;
    let digitsBefore = 0;
    for (let i = 0; i < Math.min(caret, displayed.length); i++)
      if (/\d/.test(displayed[i])) digitsBefore++;
    const newRaw = displayed.replace(/\D/g, "");
    const formatted = window.formatWithCommas ? window.formatWithCommas(newRaw) : newRaw;
    input.value = formatted;
    input.setAttribute("data-raw", newRaw);
    if (newRaw.length === 0) {
      input.selectionStart = input.selectionEnd = 0;
      return;
    }
    let digitCount = 0;
    let newPos = formatted.length;
    for (let i = 0; i < formatted.length; i++) {
      if (/\d/.test(formatted[i])) digitCount++;
      if (digitCount >= digitsBefore) {
        newPos = i + 1;
        break;
      }
    }
    if (digitsBefore > newRaw.length) newPos = formatted.length;
    input.selectionStart = input.selectionEnd = newPos;
  });
  el.addEventListener("blur", (e) => {
    const raw = e.target.value.replace(/[^0-9]/g, "");
    e.target.value = window.formatWithCommas ? window.formatWithCommas(raw) : raw;
    e.target.setAttribute("data-raw", raw);
  });

  el.addEventListener("focus", (e) => {
    const raw =
      e.target.getAttribute("data-raw") ||
      e.target.value.replace(/[^0-9]/g, "");
    e.target.value = raw;
    e.target.selectionStart = e.target.selectionEnd = e.target.value.length;
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
    document.querySelectorAll(".date-input").forEach((input) => {
      if (typeof flatpickr === "undefined") return;
      flatpickr(input, {
        dateFormat: "d/m/Y",
        allowInput: true,
        altInput: false,
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

