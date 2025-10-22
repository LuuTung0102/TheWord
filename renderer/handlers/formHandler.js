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

  // Kiểm tra xem có placeholder BD không
  const hasBDPlaceholders = placeholders.some(ph => {
    const map = window.phMapping && window.phMapping[ph];
    return map && map.group === 'BD';
  });

  // Kiểm tra xem có placeholder UQ không
  const hasUQPlaceholders = placeholders.some(ph => {
    const map = window.phMapping && window.phMapping[ph];
    return map && map.group === 'UQ';
  });

  // Kiểm tra xem có placeholder khác BD và UQ không
  const hasOtherPlaceholders = placeholders.some(ph => {
    const map = window.phMapping && window.phMapping[ph];
    return map && map.group !== 'BD' && map.group !== 'UQ';
  });

  if (hasOtherPlaceholders) {
    // Render form thông thường trước (BCN, NCN, LAND)
    renderNormalForm(placeholders);
  }

  if (hasBDPlaceholders) {
    // Render form BD với logic đặc biệt
    renderBDForm(placeholders);
  }

  if (hasUQPlaceholders) {
    // Render form UQ với logic đặc biệt
    renderUQForm(placeholders);
  }

  // Đảm bảo luôn có ít nhất một section hiển thị
  const allSections = area.querySelectorAll('.form-section');
  const activeSection = area.querySelector('.form-section.active');
  if (allSections.length && !activeSection) {
    allSections[0].classList.add('active');
  }
}

function renderNormalForm(placeholders) {
  const area = document.getElementById("formArea");
  
  // Persist last placeholders and manage visibility of extra MEN groups
  window.lastPlaceholders = placeholders;
  if (!window.visibleExtraGroups) window.visibleExtraGroups = new Set();
  const menExtraGroups = window.MEN_EXTRA_GROUPS || ["MEN3", "MEN4", "MEN5", "MEN6"];
  const menExtraGroupToPhs = window.MEN_EXTRA_GROUP_PLACEHOLDERS || {};
  const hasPhSet = new Set(placeholders || []);
  const availableExtraGroups = menExtraGroups.filter((g) =>
    menExtraGroupToPhs[g] && menExtraGroupToPhs[g].some((ph) => hasPhSet.has(ph))
  );

  const grouped = {};
  placeholders.forEach((ph) => {
    if (ph === "MoneyText") return;
    const map = window.phMapping && window.phMapping[ph];
    if (!map) {
      return;
    }
    // Loại trừ BD và UQ placeholders khỏi renderNormalForm
    if (map.group === 'BD' || map.group === 'UQ') {
      return;
    }
    const groupKey = map.group;
    const subKey = map.subgroup;
    if (!grouped[groupKey]) grouped[groupKey] = {};
    if (!grouped[groupKey][subKey]) grouped[groupKey][subKey] = [];
    grouped[groupKey][subKey].push({ ph, map });
  });

  // Create sections for each group - đảm bảo chỉ BCN active mặc định
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
    const menMatch = subKey && subKey.match && subKey.match(/^MEN(\d+)$/);
    // Style as a bordered card for each person; remove subgroup title
    subgroupDiv.className = `form-subgroup${menMatch ? ' person-subgroup' : ''}`;
    if (!menMatch) {
      let subgroupTitle = (window.subgroupLabels && window.subgroupLabels[subKey]) || subKey;
      subgroupDiv.innerHTML = `<h4>${subgroupTitle}</h4>`;
    }
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
              <div class="address-row">
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
              if (ph === "SDT_MEN1" || ph === "SDT_MEN7") {
                inputType = "text";
                extraAttr +=
                  ' inputmode="numeric" pattern="\\d*" maxlength="10"';
              }
              if (ph === "MST1" || ph === "MST7") {
                inputType = "text";
                extraAttr +=
                  ' inputmode="numeric" pattern="\\d*" maxlength="10"';
              }
              inputHtml = `
                  <label for="${safeId}"><b>${map.label}</b></label>
                  <input type="${inputType}" id="${safeId}" class="input-field"${extraAttr}>
                `;
            }
          }
          const cellDiv = document.createElement("div");
          // Add both classes so existing and new CSS rules apply
          cellDiv.className = "form-cell form-field";
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

  // Nếu không có section nào đang active (ví dụ chỉ có NCN/LAND), kích hoạt section đầu tiên
  const anyActive = area.querySelector('.form-section.active');
  if (!anyActive) {
    const firstSection = area.querySelector('.form-section');
    if (firstSection) firstSection.classList.add('active');
  }

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
  updateDynamicTaskbar();
}

// Helper function to render a single input field (DRY principle)
function renderInputField(ph, map) {
  const safeId = ph.replace(/[^a-zA-Z0-9]/g, "_");
  idToPh[safeId] = ph;
  
  let inputHtml = "";
  
  if (map.type === "select") {
    const defaultAttr = map.defaultValue ? ` data-default="${map.defaultValue}"` : "";
    inputHtml = `
      <label for="${safeId}"><b>${map.label}</b></label>
      <select id="${safeId}" class="input-field"${defaultAttr}>
        <option value="">-- Chọn --</option>
        ${map.options.map((opt) => `<option value="${opt}">${opt}</option>`).join("")}
      </select>
    `;
  } else if (map.type === "date") {
    inputHtml = `
      <label for="${safeId}"><b>${map.label}</b></label>
      <input type="text" id="${safeId}" class="input-field date-input" placeholder="dd/mm/yyyy">
    `;
  } else if (map.type === "number" && (ph.includes("CCCD") || ph.includes("UQ_CCCD") || ph.includes("UQA_CCCD") || ph.includes("BD_CCCD"))) {
    inputHtml = `
      <label for="${safeId}"><b>${map.label}</b></label>
      <input type="text" id="${safeId}" class="input-field" inputmode="numeric" pattern="\\d*" maxlength="12">
    `;
  } else if (map.type === "address") {
    inputHtml = `
      <label for="${safeId}"><b>${map.label}</b></label>
      <div class="address-row">
        <select id="${safeId}_province" class="input-field address-select" data-level="province" data-main="${safeId}">
          <option value="">-- Chọn tỉnh/thành --</option>
          ${window.addressData && window.addressData.length ? window.addressData
            .map((p) => `<option value="${p.name}">${p.name}</option>`)
            .join("") : ""}
        </select>
        <select id="${safeId}_district" class="input-field address-select" data-level="district" data-main="${safeId}">
          <option value="">-- Chọn quận/huyện --</option>
        </select>
        <select id="${safeId}_ward" class="input-field address-select" data-level="ward" data-main="${safeId}">
          <option value="">-- Chọn phường/xã --</option>
        </select>
        <select id="${safeId}_village" class="input-field address-select" data-level="village" data-main="${safeId}">
          <option value="">-- Chọn thôn --</option>
        </select>
      </div>
    `;
  } else {
    let inputType = map.type === "number" ? "number" : "text";
    inputHtml = `
      <label for="${safeId}"><b>${map.label}</b></label>
      <input type="${inputType}" id="${safeId}" class="input-field">
    `;
  }
  
  return { safeId, inputHtml, isAddress: map.type === "address" };
}

function setupFormEventListeners() {
  Object.keys(idToPh).forEach((id) => {
    const ph = idToPh[id];
    const el = document.getElementById(id);
    if (!el) return;

    // CCCD input handling
    if (ph && ph.startsWith && (ph.startsWith("CCCD") || ph.startsWith("UQ_CCCD") || ph.startsWith("UQA_CCCD") || ph.startsWith("BD_CCCD"))) {
      setupCCCDInput(el);
    }

    // Phone input handling
    if ((ph === "SDT_MEN1" || ph === "SDT_MEN7" || ph === "BD_SDT") && el.tagName.toLowerCase() === "input") {
      setupPhoneInput(el);
    }

    // MST input handling
    if ((ph === "MST1" || ph === "MST7") && el.tagName.toLowerCase() === "input") {
      setupMSTInput(el);
    }

    // Email input handling
    if ((ph === "EMAIL_MEN1" || ph === "EMAIL_MEN7" || ph === "BD_Email") && el.tagName.toLowerCase() === "input") {
      setupEmailInput(el);
    }

    // Name input handling (uppercase)
    if (ph && ph.startsWith && (ph.startsWith("Name") || ph.startsWith("UQ_Name") || ph.startsWith("UQA_Name") || ph.startsWith("BD_Name")) && el.tagName.toLowerCase() === "input") {
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

// ==========================================
// HELPER FUNCTIONS MOVED TO core/formHelpers.js
// setupNumericInput, setupCCCDInput, setupPhoneInput, setupMSTInput,
// setupEmailInput, isValidEmail, setupNameInput, setupLandTypeInput,
// setupMoneyInput, setupNoteTextarea, setupDatePickers, setupAddressSelects
// ==========================================

function validateForm() {
  const inputs = document.querySelectorAll(".input-field");
  const invalidNodes = [];
  
  // Validate CCCD (including UQ_CCCD, UQA_CCCD, BD_CCCD)
  inputs.forEach((input) => {
    const ph = idToPh[input.id];
    if (ph && ph.startsWith && (ph.startsWith("CCCD") || ph.startsWith("UQ_CCCD") || ph.startsWith("UQA_CCCD") || ph.startsWith("BD_CCCD"))) {
      const v = (input.value || "").toString().replace(/\D/g, "");
      if (v && v.length !== 12) {
        invalidNodes.push({ input, ph });
      }
    }
  });
  
          // Validate Phone Number
          inputs.forEach((input) => {
            const ph = idToPh[input.id];
            if (ph === "SDT_MEN1" || ph === "SDT_MEN7" || ph === "BD_SDT") {
              const v = (input.value || "").toString().replace(/\D/g, "");
              if (v && v.length !== 10) {
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
    const firstPh = idToPh[first.id];
    if (firstPh && (firstPh.startsWith("CCCD") || firstPh.startsWith("UQ_CCCD") || firstPh.startsWith("UQA_CCCD") || firstPh.startsWith("BD_CCCD"))) {
      alert(`Vui lòng kiểm tra ô CCCD (cần đúng 12 chữ số).`);
            } else if (firstPh === "SDT_MEN1" || firstPh === "SDT_MEN7" || firstPh === "BD_SDT") {
              alert(`Vui lòng kiểm tra ô số điện thoại (cần đúng 10 chữ số).`);
            }
    return false;
  }

  // Validate BD data source selection (chỉ khi có MEN1/MEN7)
  const hasBDPlaceholders = window.lastPlaceholders && window.lastPlaceholders.some(ph => {
    const map = window.phMapping && window.phMapping[ph];
    return map && map.group === 'BD';
  });

  // Kiểm tra xem có MEN1/MEN7 không
  const hasMEN1ForBDValidation = window.lastPlaceholders && window.lastPlaceholders.some(ph => {
    const map = window.phMapping && window.phMapping[ph];
    return map && map.group === 'BCN' && map.subgroup === 'MEN1';
  });
  const hasMEN7ForBDValidation = window.lastPlaceholders && window.lastPlaceholders.some(ph => {
    const map = window.phMapping && window.phMapping[ph];
    return map && map.group === 'NCN' && map.subgroup === 'MEN7';
  });
  const hasSourceDataForBDValidation = hasMEN1ForBDValidation || hasMEN7ForBDValidation;

  // Chỉ validate source selection nếu có MEN1/MEN7
  if (hasBDPlaceholders && hasSourceDataForBDValidation && !window.selectedBDDataSource) {
    alert('Vui lòng chọn dữ liệu cho thông tin đăng ký biến động đất đai (Bên A hoặc Bên B)');
    // Scroll to BD section
    const bdSection = document.getElementById('section-BD');
    if (bdSection) {
      bdSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
      // Activate BD section in taskbar
      const taskbarBtns = document.querySelectorAll('.taskbar-btn');
      taskbarBtns.forEach(btn => btn.classList.remove('active'));
      const bdTaskbarBtn = document.querySelector('.taskbar-btn[data-section="BD"]');
      if (bdTaskbarBtn) {
        bdTaskbarBtn.classList.add('active');
      }
      // Show BD section
      document.querySelectorAll('.form-section').forEach(s => s.classList.remove('active'));
      bdSection.classList.add('active');
    }
    return false;
  }

  // Validate UQ data source selection (chỉ khi có MEN1/MEN7)
  const hasUQPlaceholders = window.lastPlaceholders && window.lastPlaceholders.some(ph => {
    const map = window.phMapping && window.phMapping[ph];
    return map && map.group === 'UQ';
  });

  // Kiểm tra xem có MEN1/MEN7 không
  const hasMEN1ForValidation = window.lastPlaceholders && window.lastPlaceholders.some(ph => {
    const map = window.phMapping && window.phMapping[ph];
    return map && map.group === 'BCN' && map.subgroup === 'MEN1';
  });
  const hasMEN7ForValidation = window.lastPlaceholders && window.lastPlaceholders.some(ph => {
    const map = window.phMapping && window.phMapping[ph];
    return map && map.group === 'NCN' && map.subgroup === 'MEN7';
  });
  const hasSourceDataForValidation = hasMEN1ForValidation || hasMEN7ForValidation;

  // Chỉ validate source selection nếu có MEN1/MEN7
  if (hasUQPlaceholders && hasSourceDataForValidation && !window.selectedUQDataSource) {
    alert('Vui lòng chọn nguồn dữ liệu Bên A cho thông tin ủy quyền (Bên A hoặc Bên B)');
    // Scroll to UQ section
    const uqSection = document.getElementById('section-UQ');
    if (uqSection) {
      uqSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
      // Activate UQ section in taskbar
      const taskbarBtns = document.querySelectorAll('.taskbar-btn');
      taskbarBtns.forEach(btn => btn.classList.remove('active'));
      const uqTaskbarBtn = document.querySelector('.taskbar-btn[data-section="UQ"]');
      if (uqTaskbarBtn) {
        uqTaskbarBtn.classList.add('active');
      }
      // Show UQ section
      document.querySelectorAll('.form-section').forEach(s => s.classList.remove('active'));
      uqSection.classList.add('active');
            }
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
      if ((ph.startsWith("Gender") || ph.startsWith("UQ_Gender") || ph.startsWith("UQA_Gender") || ph.startsWith("BD_Gender")) && value) {
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
      if ((ph.startsWith("CCCD") || ph.startsWith("UQ_CCCD") || ph.startsWith("UQA_CCCD") || ph.startsWith("BD_CCCD")) && value) {
        const digits = value.toString().replace(/\D/g, "");
        if (/^\d{12}$/.test(digits)) {
          value = window.formatCCCD ? `${window.formatCCCD(digits)}` : digits;
        } else {
          value = digits;
        }
            } else if ((ph === "SDT_MEN1" || ph === "SDT_MEN7" || ph === "BD_SDT") && value) {
              const digits = value.toString().replace(/\D/g, "");
              if (/^\d{10}$/.test(digits)) {
                value = window.formatPhoneNumber ? `${window.formatPhoneNumber(digits)}` : digits;
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
      } else if (ph === "EMAIL_MEN1" || ph === "EMAIL_MEN7" || ph === "BD_Email") {
        // Nếu có email thì xuất, không có thì thay bằng "………."
        value = value && value.trim() ? value.trim() : "……….";
      }
      data[ph] = value || "";
    }
  });
  
  // Check MEN3-MEN6 groups and remove empty ones
  const menGroupsToCheck = window.MEN_EXTRA_GROUPS || ['MEN3', 'MEN4', 'MEN5', 'MEN6'];
  const menPlaceholders = window.MEN_EXTRA_GROUP_PLACEHOLDERS || {};

  menGroupsToCheck.forEach(group => {
    const placeholders = menPlaceholders[group] || [];
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
  
  // Thêm selectedBDDataSource vào data
  if (window.selectedBDDataSource) {
    data.selectedBDDataSource = window.selectedBDDataSource;
    console.log("🔍 Added selectedBDDataSource to data:", window.selectedBDDataSource);
  }
  
  // Thêm selectedUQDataSource vào data
  if (window.selectedUQDataSource) {
    data.selectedUQDataSource = window.selectedUQDataSource;
    console.log("🔍 Added selectedUQDataSource to data:", window.selectedUQDataSource);
  }
  
  // Thêm selectedUQBenBDataSource vào data
  if (window.selectedUQBenBDataSource) {
    data.selectedUQBenBDataSource = window.selectedUQBenBDataSource;
    console.log("🔍 Added selectedUQBenBDataSource to data:", window.selectedUQBenBDataSource);
    
    // Nếu chọn từ DEFAULT1/2/3, thêm dữ liệu của người đó
    if (window.selectedUQBenBDataSource.startsWith('DEFAULT')) {
      const defaultPeople = loadDefaultPeople();
      const index = parseInt(window.selectedUQBenBDataSource.replace('DEFAULT', '')) - 1;
      const person = defaultPeople[index];
      
      if (person) {
        data[`DEFAULT${index + 1}_gender`] = person.gender || '';
        data[`DEFAULT${index + 1}_name`] = person.name || '';
        data[`DEFAULT${index + 1}_cccd`] = person.cccd || '';
        data[`DEFAULT${index + 1}_date`] = person.date || '';
        data[`DEFAULT${index + 1}_noiCap`] = person.noiCap || '';
        data[`DEFAULT${index + 1}_ngayCap`] = person.ngayCap || '';
        data[`DEFAULT${index + 1}_address`] = person.address || '';
        
        console.log(`🔍 Added DEFAULT${index + 1} person data:`, person.name);
      }
    }
  }
  
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
      
      // Add active class to clicked button
      btn.classList.add('active');
      
      // Show target section with smooth scroll
      const targetSection = document.getElementById(`section-${section}`);
      if (targetSection) {
        targetSection.classList.add('active');
        
        // Smooth scroll to section
        targetSection.scrollIntoView({
          behavior: 'smooth',
          block: 'start'
        });
        
        // Add highlight effect
        targetSection.style.animation = 'highlight 0.5s ease-in-out';
        setTimeout(() => {
          targetSection.style.animation = '';
        }, 500);
      }
    });
  });
}

function updateTaskbarCounts() {
  const sections = ['BCN', 'NCN', 'LAND', 'BD'];
  
  // Lấy danh sách placeholder từ template hiện tại
  const placeholders = window.lastPlaceholders || [];
  
  // Kiểm tra xem có placeholder nào thuộc group không
  const hasGroupPlaceholders = (group) => {
    return placeholders.some(ph => {
      const map = window.phMapping && window.phMapping[ph];
      return map && map.group === group;
    });
  };
  
  // Bỏ đếm số: chỉ giữ lại cập nhật style nếu cần trong tương lai (hiện không dùng)
  sections.forEach(() => {});
}

function setupFormChangeListeners() {
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
  const menMatch = subKey && subKey.match && subKey.match(/^MEN(\d+)$/);
  subgroupDiv.className = `form-subgroup${menMatch ? ' person-subgroup' : ''}`;
  if (!menMatch) {
    let subgroupTitle = subKey;
    subgroupDiv.innerHTML = `<h4>${subgroupTitle}</h4>`;
  }
  
  // Lấy placeholders cho subgroup này
  const menExtraGroupToPhs = window.MEN_EXTRA_GROUP_PLACEHOLDERS || {};
  
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
          <div class="address-row">
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
        if (ph === "SDT_MEN1" || ph === "SDT_MEN7") {
          inputType = "text";
          extraAttr += ' inputmode="numeric" pattern="\\d*" maxlength="10"';
        }
        if (ph === "MST1" || ph === "MST7") {
          inputType = "text";
          extraAttr += ' inputmode="numeric" pattern="\\d*" maxlength="10"';
        }
        inputHtml = `
            <label for="${safeId}"><b>${map.label}</b></label>
            <input type="${inputType}" id="${safeId}" class="input-field"${extraAttr}>
          `;
      }
      
          const cellDiv = document.createElement("div");
          cellDiv.className = "form-cell form-field";
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
        if ((ph.startsWith("Gender") || ph.startsWith("UQ_Gender") || ph.startsWith("UQA_Gender") || ph.startsWith("BD_Gender")) && value && value.endsWith(":")) {
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

function updateDynamicTaskbar() {
  const taskbarContainer = document.getElementById('taskbarContainer');
  const taskbar = document.getElementById('taskbar');
  
  // Lấy danh sách placeholder từ template hiện tại
  const placeholders = window.lastPlaceholders || [];
  
  // Nếu không có placeholder nào, ẩn taskbar container
  if (!placeholders || placeholders.length === 0) {
    taskbarContainer.style.display = 'none';
    return;
  }
  
  // Kiểm tra xem có placeholder nào thuộc group không
  const hasGroupPlaceholders = (group) => {
    return placeholders.some(ph => {
      const map = window.phMapping && window.phMapping[ph];
      return map && map.group === group;
    });
  };
  
  // Tìm tất cả các groups có placeholders
  const allGroups = ['BCN', 'NCN', 'LAND', 'BD', 'UQ'];
  const activeGroups = allGroups.filter(group => hasGroupPlaceholders(group));
  
  console.log('🔍 Active groups based on placeholders:', activeGroups);
  
  // Nếu không có group nào có placeholders, ẩn taskbar
  if (activeGroups.length === 0) {
    taskbarContainer.style.display = 'none';
    return;
  }
  
  // Xóa tất cả taskbar buttons hiện tại
  taskbar.innerHTML = '';
  
  // Icon mapping
  const iconMap = {
    'BCN': '👤',
    'NCN': '👥',
    'LAND': '🏠',
    'BD': '📋',
    'UQ': '📝'
  };
  
  // Tạo taskbar buttons chỉ cho các group có placeholder
  activeGroups.forEach((section, index) => {
    const groupLabel = window.groupLabels && window.groupLabels[section] || section;
    const icon = iconMap[section] || '📄';
    
    const button = document.createElement('button');
    button.className = `taskbar-btn ${index === 0 ? 'active' : ''}`;
    button.dataset.section = section;
    button.innerHTML = `
      <span class="taskbar-icon">${icon}</span>
      <span class="taskbar-label">${groupLabel}</span>
    `;
    
    taskbar.appendChild(button);
  });
  
  // Hiển thị taskbar container
  taskbarContainer.style.display = 'block';
  
  // Setup navigation cho các buttons mới
  setupTaskbarNavigation();
}

function renderBDForm(placeholders) {
  console.log("🔍 renderBDForm called with placeholders:", placeholders);
  const area = document.getElementById("formArea");
  
  // Persist last placeholders
  window.lastPlaceholders = placeholders;
  
  // Tạo form BD với logic đặc biệt
  const bdSectionDiv = document.createElement("div");
  // Chỉ set active nếu hiện chưa có section nào active (trường hợp chỉ có BD)
  const hasActiveSection = document.querySelector('.form-section.active');
  bdSectionDiv.className = `form-section ${hasActiveSection ? '' : 'active'}`;
  bdSectionDiv.id = "section-BD";
  
  const bdGroupDiv = document.createElement("div");
  bdGroupDiv.className = "form-group";
  bdGroupDiv.innerHTML = `<h3>${window.groupLabels && window.groupLabels['BD'] || 'Thông tin đăng ký biến động đất đai'}</h3>`;

  // Lấy các placeholder BD
  const bdPlaceholders = placeholders.filter(ph => {
    const map = window.phMapping && window.phMapping[ph];
    return map && map.group === 'BD';
  });

  console.log("🔍 BD placeholders found:", bdPlaceholders);

  // Kiểm tra xem có placeholder thuộc MEN1 hoặc MEN7 không
  const hasMEN1Placeholders = placeholders.some(ph => {
    const map = window.phMapping && window.phMapping[ph];
    return map && map.group === 'BCN' && map.subgroup === 'MEN1';
  });

  const hasMEN7Placeholders = placeholders.some(ph => {
    const map = window.phMapping && window.phMapping[ph];
    return map && map.group === 'NCN' && map.subgroup === 'MEN7';
  });

  const hasSourceData = hasMEN1Placeholders || hasMEN7Placeholders;
  console.log("🔍 Has MEN1:", hasMEN1Placeholders, "Has MEN7:", hasMEN7Placeholders, "hasSourceData:", hasSourceData);

  // Hiển thị form BD khi có BD placeholders
  if (bdPlaceholders.length > 0) {
    console.log("🔍 Rendering BD form, hasSourceData:", hasSourceData);
    
    // Chỉ hiện card chọn nguồn nếu có MEN1 hoặc MEN7
    if (hasSourceData) {
      console.log("🔍 Rendering data source selection card");
      const dataSourceCard = document.createElement("div");
      dataSourceCard.className = "data-source-card";
      dataSourceCard.innerHTML = `
        <div class="data-source-header">
          <h4>📋 Chọn nguồn dữ liệu <span class="required-indicator">*</span></h4>
          <p>Chọn thông tin từ bên A hoặc bên B để điền vào đơn biến động</p>
        </div>
        <div class="data-source-options">
          <div class="option-card" data-source="MEN1">
            <div class="option-checkbox"></div>
            <div class="option-title">Thông tin bên A</div>
          </div>
          <div class="option-card" data-source="MEN7">
            <div class="option-checkbox"></div>
            <div class="option-title">Thông tin bên B</div>
          </div>
        </div>
      `;
      
      bdGroupDiv.appendChild(dataSourceCard);
    } else {
      // Không có MEN1/MEN7 → Render form nhập thủ công cho tất cả BD fields
      console.log("🔍 No source data, rendering manual BD form");
      const bdManualCard = document.createElement("div");
      bdManualCard.className = "uq-benb-card";
      bdManualCard.innerHTML = `
        <div class="uq-benb-header">
          <h4>📋 Thông tin đăng ký biến động đất đai</h4>
          <p>Điền đầy đủ thông tin người đăng ký</p>
        </div>
      `;
      
      // Tạo form inputs cho BD
      const formDivBD = document.createElement("div");
      formDivBD.className = "form-subgroup";
      
      const bdFields = [
        { ph: 'BD_Gender', map: window.phMapping['BD_Gender'] },
        { ph: 'BD_Name', map: window.phMapping['BD_Name'] },
        { ph: 'BD_Date', map: window.phMapping['BD_Date'] },
        { ph: 'BD_CCCD', map: window.phMapping['BD_CCCD'] },
        { ph: 'BD_Noi_Cap', map: window.phMapping['BD_Noi_Cap'] },
        { ph: 'BD_Ngay_Cap', map: window.phMapping['BD_Ngay_Cap'] },
        { ph: 'BD_SDT', map: window.phMapping['BD_SDT'] },
        { ph: 'BD_Email', map: window.phMapping['BD_Email'] }
      ];
      
      // Render 3 inputs per row
      for (let i = 0; i < bdFields.length; i += 3) {
        const rowDiv = document.createElement("div");
        rowDiv.className = "form-row";
        
        for (let j = i; j < i + 3 && j < bdFields.length; j++) {
          const { ph, map } = bdFields[j];
          if (!map) continue;
          
          const { inputHtml, isAddress } = renderInputField(ph, map);
          
          const cellDiv = document.createElement("div");
          cellDiv.className = "form-cell form-field";
          cellDiv.innerHTML = inputHtml;
          
          if (isAddress) {
            cellDiv.style.gridColumn = "1 / -1";
          }
          
          rowDiv.appendChild(cellDiv);
        }
        
        formDivBD.appendChild(rowDiv);
      }
      
      bdManualCard.appendChild(formDivBD);
      bdGroupDiv.appendChild(bdManualCard);
    }
    
    bdSectionDiv.appendChild(bdGroupDiv);
    area.appendChild(bdSectionDiv);

    console.log("🔍 BD form appended to DOM");

    // Setup event listeners (chỉ khi có source data)
    if (hasSourceData) {
      setupBDFormEventListeners();
      console.log("🔍 Event listeners setup complete");
    }

    // Force a reflow so elements (like the checkbox) appear without manual resize
    try {
      // Trigger layout
      void bdSectionDiv.offsetHeight;
      // Dispatch a resize to recalc responsive layouts
      setTimeout(() => {
        window.dispatchEvent(new Event('resize'));
      }, 0);
    } catch (e) {
      // no-op
    }
  }
  
  updateTaskbarCounts();
}

function setupBDFormEventListeners() {
  console.log("🔍 setupBDFormEventListeners called");
  // Setup event listeners cho data source selection
  const optionCards = document.querySelectorAll('.option-card');
  console.log("🔍 Found option cards:", optionCards.length);
  
  optionCards.forEach((card, index) => {
    console.log(`🔍 Setting up listener for card ${index}:`, card.dataset.source);
    card.addEventListener('click', () => {
      const source = card.dataset.source;
      const checkbox = card.querySelector('.option-checkbox');
      
      // Nếu card đã được chọn, hủy chọn
      if (card.classList.contains('active')) {
        card.classList.remove('active');
        checkbox.classList.remove('checked');
        window.selectedBDDataSource = null;
        console.log('Đã hủy chọn nguồn dữ liệu');
      } else {
        // Remove active class from all cards
        optionCards.forEach(c => {
          c.classList.remove('active');
          c.querySelector('.option-checkbox').classList.remove('checked');
        });
        
        // Add active class to clicked card
        card.classList.add('active');
        checkbox.classList.add('checked');
        
        // Lưu nguồn được chọn
        window.selectedBDDataSource = source;
        
        // Hiển thị thông báo xác nhận
        const sourceName = source === 'MEN1' ? 'Bên chuyển nhượng (MEN1)' : 'Bên nhận chuyển nhượng (MEN7)';
        console.log(`Đã chọn nguồn dữ liệu: ${sourceName}`);
      }
    });
  });
}

function fillBDFieldsFromSource(source) {
  const mappings = window.BD_FIELD_MAPPINGS || {};
  const mapping = mappings[source];
  if (!mapping) return;
  Object.entries(mapping).forEach(([bdField, sourceField]) => {
    const bdInput = document.getElementById(bdField.replace(/[^a-zA-Z0-9]/g, "_"));
    const sourceInput = document.getElementById(sourceField.replace(/[^a-zA-Z0-9]/g, "_"));

    if (bdInput && sourceInput) {
      bdInput.value = sourceInput.value;
    }
  });
}

function renderUQForm(placeholders) {
  console.log("🔍 renderUQForm called with placeholders:", placeholders);
  const area = document.getElementById("formArea");
  
  // Persist last placeholders
  window.lastPlaceholders = placeholders;
  
  // Tạo form UQ với logic đặc biệt
  const uqSectionDiv = document.createElement("div");
  // Chỉ set active nếu hiện chưa có section nào active
  const hasActiveSection = document.querySelector('.form-section.active');
  uqSectionDiv.className = `form-section ${hasActiveSection ? '' : 'active'}`;
  uqSectionDiv.id = "section-UQ";
  
  const uqGroupDiv = document.createElement("div");
  uqGroupDiv.className = "form-group";
  uqGroupDiv.innerHTML = `<h3>${window.groupLabels && window.groupLabels['UQ'] || 'Thông tin ủy quyền'}</h3>`;

  // Lấy các placeholder UQ
  const uqPlaceholders = placeholders.filter(ph => {
    const map = window.phMapping && window.phMapping[ph];
    return map && map.group === 'UQ';
  });

  console.log("🔍 UQ placeholders found:", uqPlaceholders);

  // Kiểm tra xem có placeholder MEN1 hoặc MEN7 không
  const hasMEN1Placeholders = placeholders.some(ph => {
    const map = window.phMapping && window.phMapping[ph];
    return map && map.group === 'BCN' && map.subgroup === 'MEN1';
  });

  const hasMEN7Placeholders = placeholders.some(ph => {
    const map = window.phMapping && window.phMapping[ph];
    return map && map.group === 'NCN' && map.subgroup === 'MEN7';
  });

  const hasSourceData = hasMEN1Placeholders || hasMEN7Placeholders;
  console.log("🔍 Has MEN1:", hasMEN1Placeholders, "Has MEN7:", hasMEN7Placeholders);

  // Hiển thị form UQ khi có UQ placeholders
  if (uqPlaceholders.length > 0) {
    console.log("🔍 Rendering UQ form, hasSourceData:", hasSourceData);
    
    // Chỉ hiện card chọn nguồn nếu có MEN1 hoặc MEN7
    if (hasSourceData) {
      const dataSourceCard = document.createElement("div");
      dataSourceCard.className = "data-source-card";
      dataSourceCard.innerHTML = `
        <div class="data-source-header">
          <h4>📝 Chọn nguồn dữ liệu Bên A <span class="required-indicator">*</span></h4>
          <p>Chọn thông tin từ bên A hoặc bên B để điền vào bên A của ủy quyền</p>
        </div>
        <div class="data-source-options">
          <div class="option-card uq-option" data-source="MEN1" data-type="UQ">
            <div class="option-checkbox"></div>
            <div class="option-title">Thông tin bên A</div>
          </div>
          <div class="option-card uq-option" data-source="MEN7" data-type="UQ">
            <div class="option-checkbox"></div>
            <div class="option-title">Thông tin bên B</div>
          </div>
        </div>
      `;
      
      uqGroupDiv.appendChild(dataSourceCard);
    } else {
      // Không có MEN1/MEN7 → Render form nhập thủ công cho UQA (Bên A)
      console.log("🔍 No source data, rendering manual UQA form");
      const benACard = document.createElement("div");
      benACard.className = "uq-benb-card";
      benACard.innerHTML = `
        <div class="uq-benb-header">
          <h4>👤 Thông tin bên A (Người ủy quyền)</h4>
          <p>Điền đầy đủ thông tin của người ủy quyền</p>
        </div>
      `;
      
      // Tạo form inputs cho Bên A
      const formDivA = document.createElement("div");
      formDivA.className = "form-subgroup";
      
      const uqaFields = [
        { ph: 'UQA_Gender', map: window.phMapping['UQA_Gender'] },
        { ph: 'UQA_Name', map: window.phMapping['UQA_Name'] },
        { ph: 'UQA_Date', map: window.phMapping['UQA_Date'] },
        { ph: 'UQA_CCCD', map: window.phMapping['UQA_CCCD'] },
        { ph: 'UQA_Noi_Cap', map: window.phMapping['UQA_Noi_Cap'] },
        { ph: 'UQA_Ngay_Cap', map: window.phMapping['UQA_Ngay_Cap'] },
        { ph: 'UQA_Address', map: window.phMapping['UQA_Address'] }
      ];
      
      // Render 3 inputs per row (except address which takes full row)
      for (let i = 0; i < uqaFields.length; i += 3) {
        const rowDiv = document.createElement("div");
        rowDiv.className = "form-row";
        
        for (let j = i; j < i + 3 && j < uqaFields.length; j++) {
          const { ph, map } = uqaFields[j];
          if (!map) continue;
          
          const { inputHtml, isAddress } = renderInputField(ph, map);
          
          const cellDiv = document.createElement("div");
          cellDiv.className = "form-cell form-field";
          cellDiv.innerHTML = inputHtml;
          
          // Address field takes full row
          if (isAddress) {
            cellDiv.style.gridColumn = "1 / -1";
          }
          
          rowDiv.appendChild(cellDiv);
        }
        
        formDivA.appendChild(rowDiv);
      }
      
      benACard.appendChild(formDivA);
      uqGroupDiv.appendChild(benACard);
    }
    
    // Card Bên B - Chọn người được ủy quyền
    const benBCard = document.createElement("div");
    benBCard.className = "data-source-card";
    
    // Load danh sách 3 người mặc định từ localStorage
    const defaultPeople = loadDefaultPeople();
    
    benBCard.innerHTML = `
      <div class="data-source-header">
        <h4>👤 Chọn người được ủy quyền (Bên B)</h4>
        <p>Chọn một trong 3 người mặc định hoặc nhập thủ công</p>
      </div>
      <div class="data-source-options">
        <div class="option-card uq-benb-option" data-source="DEFAULT1" data-type="UQ_BENB">
          <div class="option-checkbox"></div>
          <div class="option-content">
            <div class="option-title">${defaultPeople[0].name || 'Người 1 (Chưa nhập)'}</div>
            <div class="option-desc">${defaultPeople[0].cccd ? `CCCD: ${defaultPeople[0].cccd}` : 'Nhấn để thiết lập'}</div>
          </div>
        </div>
        <div class="option-card uq-benb-option" data-source="DEFAULT2" data-type="UQ_BENB">
          <div class="option-checkbox"></div>
          <div class="option-content">
            <div class="option-title">${defaultPeople[1].name || 'Người 2 (Chưa nhập)'}</div>
            <div class="option-desc">${defaultPeople[1].cccd ? `CCCD: ${defaultPeople[1].cccd}` : 'Nhấn để thiết lập'}</div>
          </div>
        </div>
        <div class="option-card uq-benb-option" data-source="DEFAULT3" data-type="UQ_BENB">
          <div class="option-checkbox"></div>
          <div class="option-content">
            <div class="option-title">${defaultPeople[2].name || 'Người 3 (Chưa nhập)'}</div>
            <div class="option-desc">${defaultPeople[2].cccd ? `CCCD: ${defaultPeople[2].cccd}` : 'Nhấn để thiết lập'}</div>
          </div>
        </div>
      </div>
      <div style="margin-top: 16px; text-align: right;">
        <button class="btn-secondary" onclick="window.openDefaultPeopleManager()" style="padding: 8px 16px; border-radius: 8px; border: 1px solid #e5e7eb; background: white; cursor: pointer;">
          <span class="icon">⚙️</span> Quản lý 3 người mặc định
        </button>
      </div>
    `;
    
    uqGroupDiv.appendChild(benBCard);
    
    uqSectionDiv.appendChild(uqGroupDiv);
    area.appendChild(uqSectionDiv);

    console.log("🔍 UQ form appended to DOM");

    // Setup event listeners
    if (hasSourceData) {
      setupUQFormEventListeners();
    }
    
    // Setup event listeners cho Bên B
    setupUQBenBEventListeners();
    
    // Setup input handlers
    setupFormEventListeners();
    setupDatePickers();
    setupAddressSelects();
    
    console.log("🔍 UQ form setup complete");

    // Force a reflow
    try {
      void uqSectionDiv.offsetHeight;
      setTimeout(() => {
        window.dispatchEvent(new Event('resize'));
      }, 0);
    } catch (e) {
      // no-op
    }
  }
  
  updateTaskbarCounts();
}

function setupUQFormEventListeners() {
  console.log("🔍 setupUQFormEventListeners called");
  const optionCards = document.querySelectorAll('.option-card.uq-option');
  console.log("🔍 Found UQ option cards:", optionCards.length);
  
  optionCards.forEach((card, index) => {
    console.log(`🔍 Setting up listener for UQ card ${index}:`, card.dataset.source);
    card.addEventListener('click', () => {
      const source = card.dataset.source;
      const checkbox = card.querySelector('.option-checkbox');
      
      // Nếu card đã được chọn, hủy chọn
      if (card.classList.contains('active')) {
        card.classList.remove('active');
        checkbox.classList.remove('checked');
        window.selectedUQDataSource = null;
        console.log('Đã hủy chọn nguồn dữ liệu UQ');
      } else {
        // Remove active class from all UQ cards
        optionCards.forEach(c => {
          c.classList.remove('active');
          c.querySelector('.option-checkbox').classList.remove('checked');
        });
        
        // Add active class to clicked card
        card.classList.add('active');
        checkbox.classList.add('checked');
        
        // Lưu nguồn được chọn
        window.selectedUQDataSource = source;
        
        const sourceName = source === 'MEN1' ? 'Thông tin bên A (MEN1)' : 'Thông tin bên B (MEN7)';
        console.log(`✅ Đã chọn nguồn dữ liệu UQ Bên A: ${sourceName}`);
        console.log(`✅ window.selectedUQDataSource =`, window.selectedUQDataSource);
      }
    });
  });
}

function setupUQBenBEventListeners() {
  console.log("🔍 setupUQBenBEventListeners called");
  const optionCards = document.querySelectorAll('.option-card.uq-benb-option');
  console.log("🔍 Found UQ Bên B option cards:", optionCards.length);
  
  optionCards.forEach((card, index) => {
    console.log(`🔍 Setting up listener for UQ Bên B card ${index}:`, card.dataset.source);
    
    card.addEventListener('click', () => {
      const source = card.dataset.source;
      const checkbox = card.querySelector('.option-checkbox');
      
      // Nếu card đã được chọn, hủy chọn
      if (card.classList.contains('active')) {
        card.classList.remove('active');
        checkbox.classList.remove('checked');
        window.selectedUQBenBDataSource = null;
        console.log('Đã hủy chọn người được ủy quyền');
      } else {
        // Remove active class from all UQ Bên B cards
        optionCards.forEach(c => {
          c.classList.remove('active');
          c.querySelector('.option-checkbox').classList.remove('checked');
        });
        
        // Add active class to clicked card
        card.classList.add('active');
        checkbox.classList.add('checked');
        
        // Lưu nguồn được chọn
        window.selectedUQBenBDataSource = source;
        
        const defaultPeople = loadDefaultPeople();
        const index = parseInt(source.replace('DEFAULT', '')) - 1;
        const personName = defaultPeople[index]?.name || `Người ${index + 1}`;
        
        console.log(`✅ Đã chọn người được ủy quyền (Bên B): ${personName}`);
        console.log(`✅ window.selectedUQBenBDataSource =`, window.selectedUQBenBDataSource);
      }
    });
  });
}

// Load danh sách 3 người mặc định từ localStorage
function loadDefaultPeople() {
  try {
    const saved = localStorage.getItem('defaultPeople');
    if (saved) {
      return JSON.parse(saved);
    }
  } catch (error) {
    console.error('Error loading default people:', error);
  }
  
  // Trả về 3 người rỗng nếu chưa có
  return [
    { gender: '', name: '', cccd: '', date: '', noiCap: '', ngayCap: '', address: '' },
    { gender: '', name: '', cccd: '', date: '', noiCap: '', ngayCap: '', address: '' },
    { gender: '', name: '', cccd: '', date: '', noiCap: '', ngayCap: '', address: '' }
  ];
}

// Lưu danh sách 3 người mặc định vào localStorage
function saveDefaultPeople(people) {
  try {
    localStorage.setItem('defaultPeople', JSON.stringify(people));
    console.log('✅ Đã lưu danh sách 3 người mặc định');
  } catch (error) {
    console.error('Error saving default people:', error);
  }
}

// Mở modal quản lý 3 người mặc định
function openDefaultPeopleManager() {
  const defaultPeople = loadDefaultPeople();
  
  // Tạo modal HTML
  const modalHtml = `
    <div class="modal-overlay" id="defaultPeopleModal" style="display: flex;">
      <div class="modal-content" style="max-width: 900px; max-height: 90vh; overflow-y: auto;">
        <div class="modal-header">
          <h3>⚙️ Quản lý 3 người mặc định cho ủy quyền</h3>
          <button class="close-btn" onclick="closeDefaultPeopleModal()">
            <span class="icon">✕</span>
          </button>
        </div>
        <div class="modal-body">
          <p style="margin-bottom: 20px; color: #6b7280;">Nhập thông tin 3 người thường xuyên được ủy quyền để sử dụng nhanh</p>
          
          ${[1, 2, 3].map(i => `
            <div class="uq-benb-card" style="margin-bottom: 20px;">
              <div class="uq-benb-header">
                <h4>👤 Người ${i}</h4>
              </div>
              <div class="form-subgroup">
                <div class="form-row">
                  <div class="form-cell form-field">
                    <label><b>Giới tính</b></label>
                    <select id="default${i}_gender" class="input-field">
                      <option value="">-- Chọn --</option>
                      <option value="Ông" ${defaultPeople[i-1].gender === 'Ông' ? 'selected' : ''}>Ông</option>
                      <option value="Bà" ${defaultPeople[i-1].gender === 'Bà' ? 'selected' : ''}>Bà</option>
                    </select>
                  </div>
                  <div class="form-cell form-field">
                    <label><b>Họ và tên</b></label>
                    <input type="text" id="default${i}_name" class="input-field" value="${defaultPeople[i-1].name || ''}">
                  </div>
                  <div class="form-cell form-field">
                    <label><b>Ngày sinh</b></label>
                    <input type="text" id="default${i}_date" class="input-field date-input" placeholder="dd/mm/yyyy" value="${defaultPeople[i-1].date || ''}">
                  </div>
                </div>
                <div class="form-row">
                  <div class="form-cell form-field">
                    <label><b>Số CCCD</b></label>
                    <input type="text" id="default${i}_cccd" class="input-field" maxlength="12" value="${defaultPeople[i-1].cccd || ''}">
                  </div>
                  <div class="form-cell form-field">
                    <label><b>Nơi cấp</b></label>
                    <select id="default${i}_noiCap" class="input-field">
                      <option value="">-- Chọn --</option>
                      <option value="Cục Cảnh sát QLHC về TTXH cấp" ${defaultPeople[i-1].noiCap === 'Cục Cảnh sát QLHC về TTXH cấp' ? 'selected' : ''}>Cục Cảnh sát QLHC về TTXH cấp</option>
                      <option value="Công an T. Đắk Lắk cấp" ${defaultPeople[i-1].noiCap === 'Công an T. Đắk Lắk cấp' ? 'selected' : ''}>Công an T. Đắk Lắk cấp</option>
                    </select>
                  </div>
                  <div class="form-cell form-field">
                    <label><b>Ngày cấp</b></label>
                    <input type="text" id="default${i}_ngayCap" class="input-field date-input" placeholder="dd/mm/yyyy" value="${defaultPeople[i-1].ngayCap || ''}">
                  </div>
                </div>
                <div class="form-row">
                  <div class="form-cell form-field" style="grid-column: 1 / -1;">
                    <label><b>Địa chỉ</b></label>
                    <input type="text" id="default${i}_address" class="input-field" value="${defaultPeople[i-1].address || ''}">
                  </div>
                </div>
              </div>
            </div>
          `).join('')}
          
        </div>
        <div class="modal-actions">
          <button class="btn-secondary" onclick="closeDefaultPeopleModal()">Hủy</button>
          <button class="btn-primary" onclick="saveDefaultPeopleFromModal()">
            <span class="icon">💾</span> Lưu
          </button>
        </div>
      </div>
    </div>
  `;
  
  // Thêm modal vào body
  const existingModal = document.getElementById('defaultPeopleModal');
  if (existingModal) {
    existingModal.remove();
  }
  document.body.insertAdjacentHTML('beforeend', modalHtml);
  
  // Setup date pickers cho modal
  setTimeout(() => {
    if (typeof flatpickr !== 'undefined') {
      document.querySelectorAll('#defaultPeopleModal .date-input').forEach(input => {
        flatpickr(input, {
          dateFormat: "d/m/Y",
          allowInput: true
        });
      });
    }
    
    // Setup CCCD inputs
    for (let i = 1; i <= 3; i++) {
      const cccdInput = document.getElementById(`default${i}_cccd`);
      if (cccdInput) {
        setupNumericInput(cccdInput, 12);
      }
    }
  }, 100);
}

function closeDefaultPeopleModal() {
  const modal = document.getElementById('defaultPeopleModal');
  if (modal) {
    modal.remove();
  }
}

function saveDefaultPeopleFromModal() {
  const people = [];
  
  for (let i = 1; i <= 3; i++) {
    people.push({
      gender: document.getElementById(`default${i}_gender`)?.value || '',
      name: document.getElementById(`default${i}_name`)?.value || '',
      cccd: document.getElementById(`default${i}_cccd`)?.value || '',
      date: document.getElementById(`default${i}_date`)?.value || '',
      noiCap: document.getElementById(`default${i}_noiCap`)?.value || '',
      ngayCap: document.getElementById(`default${i}_ngayCap`)?.value || '',
      address: document.getElementById(`default${i}_address`)?.value || ''
    });
  }
  
  saveDefaultPeople(people);
  closeDefaultPeopleModal();
  
  // Refresh form nếu đang ở section UQ
  const uqSection = document.getElementById('section-UQ');
  if (uqSection && window.lastPlaceholders) {
    // Re-render UQ form
    renderUQForm(window.lastPlaceholders);
  }
  
  alert('✅ Đã lưu thông tin 3 người mặc định!');
}

// Export functions
window.loadDefaultPeople = loadDefaultPeople;
window.saveDefaultPeople = saveDefaultPeople;
window.openDefaultPeopleManager = openDefaultPeopleManager;
window.closeDefaultPeopleModal = closeDefaultPeopleModal;
window.saveDefaultPeopleFromModal = saveDefaultPeopleFromModal;

window.updateDynamicTaskbar = updateDynamicTaskbar;