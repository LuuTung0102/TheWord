// formHandler.js - Xử lý form và validation

// ipcRenderer sẽ được load từ electron-imports.js

// Sử dụng biến global
let idToPh = window.idToPh || {};
let addressData = window.addressData || [];

async function loadAddresses() {
  try {
    addressData = await window.ipcRenderer.invoke("load-addresses");
    window.addressData = addressData;
  } catch (err) {
    addressData = [];
    window.addressData = addressData;  
  }
}

function renderForm(placeholders) {
  const area = document.getElementById("formArea");
  area.innerHTML = "";
  idToPh = {};
  window.idToPh = idToPh;

  // Persist last placeholders and manage visibility of extra MEN groups
  window.lastPlaceholders = placeholders;
  if (!window.visibleExtraGroups) window.visibleExtraGroups = new Set();
  const menExtraGroups = ["MEN3", "MEN4", "MEN5", "MEN6"];
  const menExtraGroupToPhs = {
    MEN3: ["Gender3", "Name3", "CCCD3", "Date3", "Noi_Cap3", "Ngay_Cap3"],
    MEN4: ["Gender4", "Name4", "CCCD4", "Date4", "Noi_Cap4", "Ngay_Cap4"],
    MEN5: ["Gender5", "Name5", "CCCD5", "Date5", "Noi_Cap5", "Ngay_Cap5"],
    MEN6: ["Gender6", "Name6", "CCCD6", "Date6", "Noi_Cap6", "Ngay_Cap6"],
  };
  const hasPhSet = new Set(placeholders || []);
  const availableExtraGroups = menExtraGroups.filter((g) =>
    menExtraGroupToPhs[g].some((ph) => hasPhSet.has(ph))
  );

  const grouped = {};
  placeholders.forEach((ph) => {
    if (ph === "MoneyText") return;
    const map = window.phMapping && window.phMapping[ph];
    if (!map) {
      return;
    }
    const groupKey = map.group;
    const subKey = map.subgroup;
    if (!grouped[groupKey]) grouped[groupKey] = {};
    if (!grouped[groupKey][subKey]) grouped[groupKey][subKey] = [];
    grouped[groupKey][subKey].push({ ph, map });
  });

  // Create sections for each group
  Object.keys(grouped).forEach((groupKey) => {
    const sectionDiv = document.createElement("div");
    sectionDiv.className = `form-section ${groupKey === 'BCN' ? 'active' : ''}`;
    sectionDiv.id = `section-${groupKey}`;
    
    const groupDiv = document.createElement("div");
    groupDiv.className = "form-group";
    groupDiv.innerHTML = `<h3>${window.groupLabels && window.groupLabels[groupKey] || groupKey}</h3>`;

    // Controls to reveal extra MEN groups (only for BCN and when placeholders exist)
    if (groupKey === 'BCN' && availableExtraGroups.length > 0) {
      const controlsDiv = document.createElement('div');
      controlsDiv.style.display = 'flex';
      controlsDiv.style.justifyContent = 'flex-end';
      controlsDiv.style.marginBottom = '8px';

      const addBtn = document.createElement('button');
      addBtn.textContent = 'Thêm người thân';
      addBtn.className = 'add-relative-btn';
      addBtn.style.padding = '6px 10px';
      addBtn.style.borderRadius = '6px';
      addBtn.style.border = '1px solid #ccc';
      addBtn.style.cursor = 'pointer';

      const getNextHiddenGroup = () => {
        for (const g of availableExtraGroups) {
          if (!window.visibleExtraGroups.has(g)) return g;
        }
        return null;
      };

      const updateBtnState = () => {
        const next = getNextHiddenGroup();
        addBtn.disabled = !next;
        addBtn.style.opacity = addBtn.disabled ? '0.6' : '1';
      };

      addBtn.addEventListener('click', () => {
        const next = getNextHiddenGroup();
        if (!next) return;
        
        // Thêm section mới mà không cần render lại toàn bộ form
        addNewPersonSection(next);
        window.visibleExtraGroups.add(next);
        updateBtnState();
      });

      updateBtnState();
      controlsDiv.appendChild(addBtn);
      groupDiv.appendChild(controlsDiv);
    }

    Object.keys(grouped[groupKey]).forEach((subKey) => {
      // For extra MEN subgroups, render only when visible
      if (groupKey === 'BCN' && menExtraGroups.includes(subKey)) {
        // Skip if not present in template
        if (!availableExtraGroups.includes(subKey)) return;
        // Skip until user clicks to reveal
        if (!window.visibleExtraGroups.has(subKey)) return;
      }
      const subgroupDiv = document.createElement("div");
      subgroupDiv.className = "form-subgroup";
      let subgroupTitle = (window.subgroupLabels && window.subgroupLabels[subKey]) || subKey;
      const menMatch = subKey && subKey.match && subKey.match(/^MEN(\d+)$/);
      if (menMatch) {
        const num = menMatch[1];
        subgroupTitle = `Thông tin cá nhân ${num}`;
      }
      subgroupDiv.innerHTML = `<h4>${subgroupTitle}</h4>`;
      let items = grouped[groupKey][subKey];
      // Reorder LAND/INFO so TTGLVD and Note appear last
      if (groupKey === 'LAND' && subKey === 'INFO') {
        const weightOf = (ph) => {
          if (!ph) return 0;
          if (ph === 'TTGLVD') return 100;
          if (ph === 'Note') return 101;
          return 0;
        };
        items = items.slice().sort((a, b) => weightOf(a.ph) - weightOf(b.ph));
      }
      // Render 4 inputs per row for a balanced layout
      for (let i = 0; i < items.length; i += 4) {
        const rowDiv = document.createElement("div");
        rowDiv.className = "form-row";
        for (let j = i; j < i + 4 && j < items.length; j++) {
          const { ph, map } = items[j];
          const safeId = ph.replace(/[^a-zA-Z0-9]/g, "_");
          idToPh[safeId] = ph;
          let inputHtml = "";
          if (map.type === "select") {
            const defaultAttr = map.defaultValue ? ` data-default="${map.defaultValue}"` : "";
            inputHtml = `
              <label for="${safeId}"><b>${map.label}</b></label>
              <select id="${safeId}" class="input-field"${defaultAttr}>
                <option value="">-- Chọn --</option>
                ${map.options
                  .map((opt) => `<option value="${opt}">${opt}</option>`)
                  .join("")}
              </select>
            `;
          } else if (map.type === "date") {
            inputHtml = `
              <label for="${safeId}"><b>${map.label}</b></label>
              <input type="text" id="${safeId}" class="input-field date-input" placeholder="dd/mm/yyyy">
            `;
          } else if (ph === "Loai_Dat") {
            inputHtml = `
              <label for="${safeId}"><b>${map.label}</b></label>
              <input type="text" id="${safeId}" class="input-field land-type-input">
              <div id="${safeId}_dropdown" class="land-type-dropdown" style="display:none; position:absolute; background:white; border:1px solid #ccc; max-height:200px; overflow-y:auto; z-index:1000; width:300px;"></div>
            `;
          } else if (map.type === "address") {
            inputHtml = `
              <label for="${safeId}"><b>${map.label}</b></label>
              <div style="display:flex;flex-direction:row;gap:4px;align-items:center;">
                <select id="${safeId}_province" class="input-field address-select" data-level="province">
                  <option value="">-- Chọn tỉnh/thành --</option>
                  ${addressData && addressData.length ? addressData
                    .map((p) => `<option value="${p.name}">${p.name}</option>`)
                    .join("") : ""}
                </select>
                <select id="${safeId}_district" class="input-field address-select" data-level="district">
                  <option value="">-- Chọn quận/huyện --</option>
                </select>
                <select id="${safeId}_ward" class="input-field address-select" data-level="ward">
                  <option value="">-- Chọn phường/xã --</option>
                </select>
                <select id="${safeId}_village" class="input-field address-select" data-level="village" data-main="${safeId}">
                  <option value="">-- Chọn thôn --</option>
                </select>
              </div>
            `;
          } else {
            if (ph === "Note") {
              inputHtml = `
                <label for="${safeId}"><b>${map.label}</b></label>
                <textarea id="${safeId}" class="input-field" rows="4" style="min-height:80px; resize:vertical;"></textarea>
              `;
            } else {
              let inputType = map.type === "number" ? "number" : "text";
              let extraAttr =
                ph === "Money" ? ' inputmode="numeric" pattern="\\d*"' : "";
              if (ph && ph.startsWith && ph.startsWith("CCCD")) {
                inputType = "text";
                extraAttr +=
                  ' inputmode="numeric" pattern="\\d*" maxlength="12"';
              }
              inputHtml = `
                  <label for="${safeId}"><b>${map.label}</b></label>
                  <input type="${inputType}" id="${safeId}" class="input-field"${extraAttr}>
                `;
            }
          }
          const cellDiv = document.createElement("div");
          cellDiv.className = "form-cell";
          cellDiv.style.display = "flex";
          cellDiv.style.flexDirection = "column";
          cellDiv.style.alignItems = "flex-start";
          cellDiv.style.marginRight = "8px";
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

  setupFormEventListeners();
  // Apply default values for selects after render
  document.querySelectorAll('select.input-field[data-default]').forEach((sel) => {
    const def = sel.getAttribute('data-default');
    if (def && !sel.value) {
      sel.value = def;
      const id = sel.id.replace(/[^a-zA-Z0-9]/g, "_");
      const ph = idToPh[id];
      if (ph && ph.startsWith && ph.startsWith('Gender')) {
        // Keep the trailing colon logic consistent with data collection
      }
    }
  });
  setupDatePickers();
  setupAddressSelects();
  setupTaskbarNavigation();
  updateTaskbarCounts();
}

function setupFormEventListeners() {
  Object.keys(idToPh).forEach((id) => {
    const ph = idToPh[id];
    const el = document.getElementById(id);
    if (!el) return;

    // CCCD input handling
    if (ph && ph.startsWith && ph.startsWith("CCCD")) {
      setupCCCDInput(el);
    }

    // Name input handling (uppercase)
    if (ph && ph.startsWith && ph.startsWith("Name") && el.tagName.toLowerCase() === "input") {
      setupNameInput(el);
    }

    // Land type input handling
    if (ph === "Loai_Dat" && el.tagName.toLowerCase() === "input") {
      setupLandTypeInput(el, id);
    }

    // Money input handling
    if (ph === "Money") {
      setupMoneyInput(el);
    }

    // Note textarea handling
    if (ph === "Note" && el.tagName.toLowerCase() === "textarea") {
      setupNoteTextarea(el);
    }
  });
}

function setupCCCDInput(el) {
  el.addEventListener("input", (e) => {
    const v = e.target.value.replace(/\D/g, "").slice(0, 12);
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
      .slice(0, 12);
    document.execCommand("insertText", false, text);
  });
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
      const mainId = e.target.dataset.main || e.target.id.split("_")[0];
      const provinceSelect = document.getElementById(`${mainId}_province`);
      const districtSelect = document.getElementById(`${mainId}_district`);
      const wardSelect = document.getElementById(`${mainId}_ward`);
      const villageSelect = document.getElementById(`${mainId}_village`);

      if (level === "province") {
        districtSelect.innerHTML =
          '<option value="">-- Chọn quận/huyện --</option>';
        wardSelect.innerHTML = '<option value="">-- Chọn phường/xã --</option>';
        villageSelect.innerHTML = '<option value="">-- Chọn--</option>';

        const province = addressData.find((p) => p.name === e.target.value);
        if (province && province.districts) {
          districtSelect.innerHTML += province.districts
            .map((d) => `<option value="${d.name}">${d.name}</option>`)
            .join("");
        }
      } else if (level === "district") {
        wardSelect.innerHTML = '<option value="">-- Chọn phường/xã --</option>';
        villageSelect.innerHTML = '<option value="">-- Chọn--</option>';

        const province = addressData.find(
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

        const province = addressData.find(
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

function validateForm() {
  const inputs = document.querySelectorAll(".input-field");
  const invalidNodes = [];
  
  // Validate CCCD
  inputs.forEach((input) => {
    const ph = idToPh[input.id];
    if (ph && ph.startsWith && ph.startsWith("CCCD")) {
      const v = (input.value || "").toString().replace(/\D/g, "");
      if (v && v.length !== 12) {
        invalidNodes.push({ input, ph });
      }
    }
  });
  
  document
    .querySelectorAll(".invalid-input")
    .forEach((n) => n.classList.remove("invalid-input"));
    
  if (invalidNodes.length) {
    invalidNodes.forEach((n) => n.input.classList.add("invalid-input"));
    const first = invalidNodes[0].input;
    first.focus();
    alert(`Vui lòng kiểm tra ô CCCD.`);
    return false;
  }

  // Validate land information
  const landMissing = [];
  const landExceptions = new Set(["Note", "TTGLVD", "MoneyText", "Address3"]);
  if (window.phMapping) {
    Object.keys(window.phMapping).forEach((ph) => {
      const info = window.phMapping[ph];
    if (!info) return;
    if (
      info.group === "LAND" &&
      info.subgroup === "INFO" &&
      !landExceptions.has(ph)
    ) {
      const safeId = ph.replace(/[^a-zA-Z0-9]/g, "_");
      if (info.type === "address") {
        const prov = document.getElementById(`${safeId}_province`);
        const dist = document.getElementById(`${safeId}_district`);
        const ward = document.getElementById(`${safeId}_ward`);
        const vill = document.getElementById(`${safeId}_village`);
        const allPresent =
          prov &&
          dist &&
          ward &&
          vill &&
          prov.value &&
          dist.value &&
          ward.value &&
          vill.value;
        if (!allPresent) {
          const firstElem = prov || dist || ward || vill;
          if (firstElem) landMissing.push({ el: firstElem, ph });
        }
      } else {
        const el = document.getElementById(safeId);
        if (!el || !(el.value || "").toString().trim()) {
          if (el) landMissing.push({ el, ph });
        }
      }
    }
  });
  }
  
  if (landMissing.length) {
    landMissing.forEach((n) => n.el.classList.add("invalid-input"));
    landMissing[0].el.focus();
    alert("Vui lòng điền đầy đủ các thông tin thửa đất.");
    return false;
  }
  
  return true;
}

function collectFormData() {
  const inputs = document.querySelectorAll(".input-field");
  const data = {};
  let moneyDigits = "";

  // First pass: collect all data
  inputs.forEach((input) => {
    let safeId = input.id;
    let ph = idToPh[safeId];
    let value = input.value || "";
    const map = window.phMapping && window.phMapping[ph];
    
    if (input.dataset.level === "village") {
      const mainId = input.dataset.main;
      ph = mainId;
      const province = document.getElementById(`${mainId}_province`).value;
      const district = document.getElementById(`${mainId}_district`).value;
      const ward = document.getElementById(`${mainId}_ward`).value;
      const village = input.value;
      value = [village, ward, district, province].filter(Boolean).join(", ");
    } else if (ph && map && map.type === "select") {
      if (ph.startsWith("Gender") && value) {
        value = value + ":";
      }
    } else if (ph && map && map.type === "date") {
      // Normalize any date-like input into dd/MM/yyyy for consistent output
      let formatted = "";
      const dmMatch =
        value && value.toString().match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
      const isoMatch =
        value && value.toString().match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/);
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
      } else {
        formatted = window.formatDate ? window.formatDate(value) : value;
      }

      if (formatted) {
        if (ph && ph.startsWith && ph.startsWith("Date")) {
          value = `${formatted}`;
        } else if (ph && ph.indexOf && ph.indexOf("Ngay_Cap") !== -1) {
          value = `${formatted}`;
        } else {
          value = formatted;
        }
      }
    } else if (ph && map && map.type === "number") {
      if (ph.startsWith("CCCD") && value) {
        const digits = value.toString().replace(/\D/g, "");
        if (/^\d{12}$/.test(digits)) {
          value = window.formatCCCD ? `${window.formatCCCD(digits)}` : digits;
        } else {
          value = digits;
        }
      }
    }

    if (ph) {
      if (ph === "Money") {
        const digits = (value || "").toString().replace(/[^0-9]/g, "");
        moneyDigits = digits;
        data["MoneyRaw"] = digits;
        value = window.formatWithCommas ? window.formatWithCommas(digits) : digits;
      } else if (ph === "Loai_Dat") {
        value = window.expandLandType ? window.expandLandType(value) : value;
      }
      data[ph] = value || "";
    }
  });
  
  // Check MEN3-MEN6 groups and remove empty ones
  const menGroupsToCheck = ['MEN3', 'MEN4', 'MEN5', 'MEN6'];
  const menPlaceholders = {
    'MEN3': ['Gender3', 'Name3', 'CCCD3', 'Date3', 'Noi_Cap3', 'Ngay_Cap3'],
    'MEN4': ['Gender4', 'Name4', 'CCCD4', 'Date4', 'Noi_Cap4', 'Ngay_Cap4'],
    'MEN5': ['Gender5', 'Name5', 'CCCD5', 'Date5', 'Noi_Cap5', 'Ngay_Cap5'],
    'MEN6': ['Gender6', 'Name6', 'CCCD6', 'Date6', 'Noi_Cap6', 'Ngay_Cap6']
  };

  menGroupsToCheck.forEach(group => {
    const placeholders = menPlaceholders[group];
    const hasData = placeholders.some(ph => {
      const value = data[ph];
      return value && value.trim() !== "";
    });

    // If no data in this MEN group, remove all its placeholders
    if (!hasData) {
      placeholders.forEach(ph => {
        delete data[ph];
      });
    }
  });
  
  if (moneyDigits) {
    data["MoneyText"] = window.numberToVietnameseWords ? `(Bằng chữ: ${window.numberToVietnameseWords(moneyDigits)})` : `(Bằng chữ: ${moneyDigits})`;
  }

  // Duplicate standard MEN3–MEN6 keys to MENx_Ly aliases for export compatibility
  const menAliasFields = [
    ["Gender", 1],
    ["Name", 2],
    ["CCCD", 3],
    ["Date", 4],
    ["Noi_Cap", 5],
    ["Ngay_Cap", 6],
  ];
  ;
  [3, 4, 5, 6].forEach((idx) => {
    menAliasFields.forEach(([base, pos]) => {
      const key = `${base}${idx}`;
      const alias = `MEN${idx}_L${pos}`;
      if (data[key] != null && data[key] !== "") {
        data[alias] = data[key];
      }
    });
  });
  
  return data;
}

// Taskbar Navigation Functions
function setupTaskbarNavigation() {
  const taskbarBtns = document.querySelectorAll('.taskbar-btn');
  
  taskbarBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      const section = btn.dataset.section;
      
      // Remove active class from all buttons and sections
      taskbarBtns.forEach(b => b.classList.remove('active'));
      document.querySelectorAll('.form-section').forEach(s => s.classList.remove('active'));
      
    
      btn.classList.add('active');
      const targetSection = document.getElementById(`section-${section}`);
      if (targetSection) {
        targetSection.classList.add('active');
      }
    });
  });
}

function updateTaskbarCounts() {
  const sections = ['BCN', 'NCN', 'LAND'];
  
  sections.forEach(section => {
    const countElement = document.getElementById(`${section.toLowerCase()}-count`);
    if (!countElement) return;
    
    const sectionElement = document.getElementById(`section-${section}`);
    if (!sectionElement) {
      countElement.textContent = '0';
      return;
    }
    
    // Count filled fields in this section
    const inputs = sectionElement.querySelectorAll('.input-field');
    let filledCount = 0;
    
    inputs.forEach(input => {
      if (input.type === 'select-one') {
        if (input.value && input.value !== '') {
          filledCount++;
        }
      } else if (input.type === 'text' || input.type === 'number' || input.type === 'textarea') {
        if (input.value && input.value.trim() !== '') {
          filledCount++;
        }
      }
    });
    
    countElement.textContent = filledCount;
    
    // Update button style based on completion
    const btn = document.querySelector(`[data-section="${section}"]`);
    if (btn) {
      if (filledCount > 0) {
        btn.classList.add('has-data');
      } else {
        btn.classList.remove('has-data');
      }
    }
  });
}

function setupFormChangeListeners() {
  // Listen for changes in all form inputs
  document.addEventListener('input', () => {
    updateTaskbarCounts();
  });
  
  document.addEventListener('change', () => {
    updateTaskbarCounts();
  });
}

function addNewPersonSection(subKey) {
  // Tìm section BCN hiện tại
  const bcnSection = document.getElementById('section-BCN');
  if (!bcnSection) return;
  
  const groupDiv = bcnSection.querySelector('.form-group');
  if (!groupDiv) return;
  
  // Tạo subgroup mới
  const subgroupDiv = document.createElement("div");
  subgroupDiv.className = "form-subgroup";
  
  const menMatch = subKey && subKey.match && subKey.match(/^MEN(\d+)$/);
  let subgroupTitle = subKey;
  if (menMatch) {
    const num = menMatch[1];
    subgroupTitle = `Thông tin cá nhân ${num}`;
  }
  subgroupDiv.innerHTML = `<h4>${subgroupTitle}</h4>`;
  
  // Lấy placeholders cho subgroup này
  const menExtraGroupToPhs = {
    MEN3: ["Gender3", "Name3", "CCCD3", "Date3", "Noi_Cap3", "Ngay_Cap3"],
    MEN4: ["Gender4", "Name4", "CCCD4", "Date4", "Noi_Cap4", "Ngay_Cap4"],
    MEN5: ["Gender5", "Name5", "CCCD5", "Date5", "Noi_Cap5", "Ngay_Cap5"],
    MEN6: ["Gender6", "Name6", "CCCD6", "Date6", "Noi_Cap6", "Ngay_Cap6"],
  };
  
  const placeholders = menExtraGroupToPhs[subKey] || [];
  const items = placeholders.map(ph => {
    const map = window.phMapping && window.phMapping[ph];
    return map ? { ph, map } : null;
  }).filter(Boolean);
  
  // Render 4 inputs per row
  for (let i = 0; i < items.length; i += 4) {
    const rowDiv = document.createElement("div");
    rowDiv.className = "form-row";
    for (let j = i; j < i + 4 && j < items.length; j++) {
      const { ph, map } = items[j];
      const safeId = ph.replace(/[^a-zA-Z0-9]/g, "_");
      idToPh[safeId] = ph;
      
      let inputHtml = "";
      if (map.type === "select") {
        const defaultAttr = map.defaultValue ? ` data-default="${map.defaultValue}"` : "";
        inputHtml = `
          <label for="${safeId}"><b>${map.label}</b></label>
          <select id="${safeId}" class="input-field"${defaultAttr}>
            <option value="">-- Chọn --</option>
            ${map.options
              .map((opt) => `<option value="${opt}">${opt}</option>`)
              .join("")}
          </select>
        `;
      } else if (map.type === "date") {
        inputHtml = `
          <label for="${safeId}"><b>${map.label}</b></label>
          <input type="text" id="${safeId}" class="input-field date-input" placeholder="dd/mm/yyyy">
        `;
      } else if (map.type === "address") {
        inputHtml = `
          <label for="${safeId}"><b>${map.label}</b></label>
          <div style="display:flex;flex-direction:row;gap:4px;align-items:center;">
            <select id="${safeId}_province" class="input-field address-select" data-level="province">
              <option value="">-- Chọn tỉnh/thành --</option>
              ${window.addressData && window.addressData.length ? window.addressData
                .map((p) => `<option value="${p.name}">${p.name}</option>`)
                .join("") : ""}
            </select>
            <select id="${safeId}_district" class="input-field address-select" data-level="district">
              <option value="">-- Chọn quận/huyện --</option>
            </select>
            <select id="${safeId}_ward" class="input-field address-select" data-level="ward">
              <option value="">-- Chọn phường/xã --</option>
            </select>
            <select id="${safeId}_village" class="input-field address-select" data-level="village" data-main="${safeId}">
              <option value="">-- Chọn thôn --</option>
            </select>
          </div>
        `;
      } else {
        let inputType = map.type === "number" ? "number" : "text";
        let extraAttr = ph === "Money" ? ' inputmode="numeric" pattern="\\d*"' : "";
        if (ph && ph.startsWith && ph.startsWith("CCCD")) {
          inputType = "text";
          extraAttr += ' inputmode="numeric" pattern="\\d*" maxlength="12"';
        }
        inputHtml = `
            <label for="${safeId}"><b>${map.label}</b></label>
            <input type="${inputType}" id="${safeId}" class="input-field"${extraAttr}>
          `;
      }
      
      const cellDiv = document.createElement("div");
      cellDiv.className = "form-cell";
      cellDiv.style.display = "flex";
      cellDiv.style.flexDirection = "column";
      cellDiv.style.alignItems = "flex-start";
      cellDiv.style.marginRight = "8px";
      cellDiv.innerHTML = inputHtml;
      rowDiv.appendChild(cellDiv);
    }
    subgroupDiv.appendChild(rowDiv);
  }
  
  // Thêm subgroup vào group
  groupDiv.appendChild(subgroupDiv);
  
  // Setup event listeners cho các input mới
  setupFormEventListeners();
  setupDatePickers();
  setupAddressSelects();
  updateTaskbarCounts();
}

function restoreAddressField(safeId, addressValue) {
  const addressParts = addressValue.split(", ");
  if (addressParts.length < 4) return;
  
  const [village, ward, district, province] = addressParts;
  
  const provinceSelect = document.getElementById(`${safeId}_province`);
  const districtSelect = document.getElementById(`${safeId}_district`);
  const wardSelect = document.getElementById(`${safeId}_ward`);
  const villageSelect = document.getElementById(`${safeId}_village`);
  
  if (!provinceSelect || !province) return;
  
  // Set province value
  provinceSelect.value = province;
  
  // Tìm province trong addressData và load districts
  const provinceData = window.addressData.find(p => p.name === province);
  if (provinceData && provinceData.districts) {
    // Clear và load districts
    districtSelect.innerHTML = '<option value="">-- Chọn quận/huyện --</option>';
    districtSelect.innerHTML += provinceData.districts
      .map(d => `<option value="${d.name}">${d.name}</option>`)
      .join("");
    
    // Set district value
    if (district) {
      districtSelect.value = district;
      
      // Tìm district và load wards
      const districtData = provinceData.districts.find(d => d.name === district);
      if (districtData && districtData.wards) {
        // Clear và load wards
        wardSelect.innerHTML = '<option value="">-- Chọn phường/xã --</option>';
        wardSelect.innerHTML += districtData.wards
          .map(w => `<option value="${w.name}">${w.name}</option>`)
          .join("");
        
        // Set ward value
        if (ward) {
          wardSelect.value = ward;
          
          // Tìm ward và load villages
          const wardData = districtData.wards.find(w => w.name === ward);
          if (wardData && wardData.villages) {
            // Clear và load villages
            villageSelect.innerHTML = '<option value="">-- Chọn thôn --</option>';
            villageSelect.innerHTML += wardData.villages
              .map(v => `<option value="${v}">${v}</option>`)
              .join("");
            
            // Set village value
            if (village) {
              villageSelect.value = village;
            }
          }
        }
      }
    }
  }
}

function restoreFormData(data) {
  // Khôi phục dữ liệu cho các input thông thường (text, number, textarea)
  Object.keys(data).forEach(ph => {
    const safeId = ph.replace(/[^a-zA-Z0-9]/g, "_");
    const element = document.getElementById(safeId);
    const map = window.phMapping && window.phMapping[ph];
    
    if (element && data[ph] && map) {
      if (map.type === "select") {
        // Xử lý riêng cho select (Gender) - loại bỏ dấu ":" nếu có
        let value = data[ph];
        if (ph.startsWith("Gender") && value.endsWith(":")) {
          value = value.slice(0, -1);
        }
        element.value = value;
      } else if (map.type === "text" || map.type === "number" || map.type === "date") {
        // Xử lý cho text, number, date
        element.value = data[ph];
      } else if (ph === "Note") {
        // Xử lý riêng cho textarea
        element.value = data[ph];
      }
    }
  });

  // Khôi phục dữ liệu cho các trường address
  Object.keys(data).forEach(ph => {
    const safeId = ph.replace(/[^a-zA-Z0-9]/g, "_");
    const map = window.phMapping && window.phMapping[ph];
    if (map && map.type === "address" && data[ph]) {
      restoreAddressField(safeId, data[ph]);
    }
  });

  // Khôi phục dữ liệu cho trường Money (cần format lại)
  if (data.MoneyRaw) {
    const moneyElement = document.getElementById("Money".replace(/[^a-zA-Z0-9]/g, "_"));
    if (moneyElement) {
      moneyElement.value = window.formatWithCommas ? window.formatWithCommas(data.MoneyRaw) : data.MoneyRaw;
      moneyElement.setAttribute("data-raw", data.MoneyRaw);
    }
  }

  // Cập nhật taskbar counts sau khi khôi phục dữ liệu
  setTimeout(() => {
    updateTaskbarCounts();
  }, 300);
}

window.loadAddresses = loadAddresses;
window.renderForm = renderForm;
window.validateForm = validateForm;
window.collectFormData = collectFormData;
window.restoreFormData = restoreFormData;
window.restoreAddressField = restoreAddressField;
window.addNewPersonSection = addNewPersonSection;
window.getIdToPh = () => idToPh;
window.setupTaskbarNavigation = setupTaskbarNavigation;
window.updateTaskbarCounts = updateTaskbarCounts;
window.setupFormChangeListeners = setupFormChangeListeners;
