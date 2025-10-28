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

function expandPlaceholders(placeholders) {
  // Define all fields for each subgroup in order: Giới tính - Họ và tên - Ngày sinh - CCCD - Nơi cấp - Ngày cấp - Địa chỉ - Mã số thuế - Số điện thoại - Hộp thư điện tử
  const subgroupFields = {
    // BCN group
    'MEN1': ['Gender1', 'Name1', 'Date1', 'CCCD1', 'Noi_Cap1', 'Ngay_Cap1', 'Address1', 'MST1', 'SDT_MEN1', 'EMAIL_MEN1'],
    'MEN2': ['Gender2', 'Name2', 'Date2', 'CCCD2', 'Noi_Cap2', 'Ngay_Cap2'],
    'MEN3': ['Gender3', 'Name3', 'Date3', 'CCCD3', 'Noi_Cap3', 'Ngay_Cap3'],
    'MEN4': ['Gender4', 'Name4', 'Date4', 'CCCD4', 'Noi_Cap4', 'Ngay_Cap4'],
    'MEN5': ['Gender5', 'Name5', 'Date5', 'CCCD5', 'Noi_Cap5', 'Ngay_Cap5'],
    'MEN6': ['Gender6', 'Name6', 'Date6', 'CCCD6', 'Noi_Cap6', 'Ngay_Cap6'],
    
    // NCN group
    'MEN7': ['Gender7', 'Name7', 'Date7', 'CCCD7', 'Noi_Cap7', 'Ngay_Cap7', 'Address7', 'MST7', 'SDT_MEN7', 'EMAIL_MEN7'],
    
    // LAND group
    'LAND_INFO': ['QSH', 'So_so', 'Ngay_CapD', 'Thua_dat_so', 'Ban_do_so', 'S', 'Loai_Dat', 'VTTD', 'THSD', 'HTSD', 'AddressD', 'TTGLVD', 'Note', 'Money', 'Responsibility'],
    
    // BD group - Giới tính - Họ và tên - Ngày sinh - CCCD - Nơi cấp - Ngày cấp - Số điện thoại - Hộp thư điện tử
    'BD_INFO': ['BD_Gender', 'BD_Name', 'BD_Date', 'BD_CCCD', 'BD_Noi_Cap', 'BD_Ngay_Cap', 'BD_SDT', 'BD_Email'],
    
    // UQ group - Giới tính - Họ và tên - Ngày sinh - CCCD - Nơi cấp - Ngày cấp - Địa chỉ
    'UQ_BENA': ['UQA_Gender', 'UQA_Name', 'UQA_Date', 'UQA_CCCD', 'UQA_Noi_Cap', 'UQA_Ngay_Cap', 'UQA_Address'],
    'UQ_INFO': ['UQ_Gender', 'UQ_Name', 'UQ_Date', 'UQ_CCCD', 'UQ_Noi_Cap', 'UQ_Ngay_Cap', 'UQ_Address']
  };

  const expandedSet = new Set(placeholders);
  const detectedSubgroups = new Set();

  // Detect which subgroups are present
  placeholders.forEach(ph => {
    const map = window.phMapping && window.phMapping[ph];
    if (!map) return;

    const group = map.group;
    const subgroup = map.subgroup;
    
    // Create a key for the subgroup
    let subgroupKey = null;
    
    if (group === 'LAND' && subgroup === 'INFO') {
      subgroupKey = 'LAND_INFO';
    } else if (group === 'BD' && subgroup === 'INFO') {
      subgroupKey = 'BD_INFO';
    } else if (group === 'UQ' && subgroup === 'BENA') {
      subgroupKey = 'UQ_BENA';
    } else if (group === 'UQ' && subgroup === 'INFO') {
      subgroupKey = 'UQ_INFO';
    } else if (subgroup && subgroup.match(/^MEN\d+$/)) {
      subgroupKey = subgroup;
    }
    
    if (subgroupKey) {
      detectedSubgroups.add(subgroupKey);
    }
  });

  // Add all fields for detected subgroups
  detectedSubgroups.forEach(subgroupKey => {
    const fields = subgroupFields[subgroupKey];
    if (fields) {
      console.log(`🔍 Expanding subgroup ${subgroupKey}:`, fields);
      fields.forEach(field => expandedSet.add(field));
    }
  });

  const result = Array.from(expandedSet);
  console.log(`📋 Original placeholders count: ${placeholders.length}, Expanded count: ${result.length}`);
  
  return result;
}

function renderForm(placeholders) {
  // 🗑️ CLEANUP old event listeners FIRST
  if (typeof window.cleanupAllEventListeners === 'function') {
    window.cleanupAllEventListeners();
  }
  
  // ✅ SHOW OLD TASKBAR (ẩn bởi genericFormHandler)
  const oldTaskbar = document.getElementById('taskbarContainer');
  if (oldTaskbar) {
    oldTaskbar.style.display = '';
  }
  
  const area = document.getElementById("formArea");
  area.innerHTML = "";
  idToPh = {};
  window.idToPh = idToPh;

  // 📄 VĂN BẢN CHUYỂN NHƯỢNG (Transfer)
  console.log("📄 Detected TRANSFER document - Using standard form handler");
  
  // Expand placeholders to show all fields for detected subgroups
  const expandedPlaceholders = expandPlaceholders(placeholders);
  
  const hasBDPlaceholders = expandedPlaceholders.some(ph => {
    const map = window.phMapping && window.phMapping[ph];
    return map && map.group === 'BD';
  });

  
  const hasUQPlaceholders = expandedPlaceholders.some(ph => {
    const map = window.phMapping && window.phMapping[ph];
    return map && map.group === 'UQ';
  });

  
  const hasOtherPlaceholders = expandedPlaceholders.some(ph => {
    const map = window.phMapping && window.phMapping[ph];
    return map && map.group !== 'BD' && map.group !== 'UQ';
  });

  if (hasOtherPlaceholders) {
    
    renderNormalForm(expandedPlaceholders);
  }

  if (hasBDPlaceholders) {
    
    renderBDForm(expandedPlaceholders);
  }

  if (hasUQPlaceholders) {
    
    renderUQForm(expandedPlaceholders);
  }

  
  const allSections = area.querySelectorAll('.form-section');
  const activeSection = area.querySelector('.form-section.active');
  if (allSections.length && !activeSection) {
    allSections[0].classList.add('active');
  }
}

function renderNormalForm(placeholders) {
  const area = document.getElementById("formArea");
  
  
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
    
    if (map.group === 'BD' || map.group === 'UQ') {
      return;
    }
    const groupKey = map.group;
    const subKey = map.subgroup;
    if (!grouped[groupKey]) grouped[groupKey] = {};
    if (!grouped[groupKey][subKey]) grouped[groupKey][subKey] = [];
    grouped[groupKey][subKey].push({ ph, map });
  });

  
  Object.keys(grouped).forEach((groupKey) => {
    const sectionDiv = document.createElement("div");
    sectionDiv.className = `form-section ${groupKey === 'BCN' ? 'active' : ''}`;
    sectionDiv.id = `section-${groupKey}`;
    
    const groupDiv = document.createElement("div");
    groupDiv.className = "form-group";
    groupDiv.innerHTML = `<h3>${window.groupLabels && window.groupLabels[groupKey] || groupKey}</h3>`;

    
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
        
        
        addNewPersonSection(next);
        window.visibleExtraGroups.add(next);
        updateBtnState();
      });

      updateBtnState();
      controlsDiv.appendChild(addBtn);
      groupDiv.appendChild(controlsDiv);
    }

    Object.keys(grouped[groupKey]).forEach((subKey) => {
      
      if (groupKey === 'BCN' && menExtraGroups.includes(subKey)) {
        
        if (!availableExtraGroups.includes(subKey)) return;
        
        if (!window.visibleExtraGroups.has(subKey)) return;
      }
    const subgroupDiv = document.createElement("div");
    const menMatch = subKey && subKey.match && subKey.match(/^MEN(\d+)$/);
    
    subgroupDiv.className = `form-subgroup${menMatch ? ' person-subgroup' : ''}`;
    if (!menMatch) {
      let subgroupTitle = (window.subgroupLabels && window.subgroupLabels[subKey]) || subKey;
      subgroupDiv.innerHTML = `<h4>${subgroupTitle}</h4>`;
    }
      let items = grouped[groupKey][subKey];
      
      // Hàm định nghĩa thứ tự hiển thị các trường
      const getFieldOrder = (ph) => {
        // ===== LAND FIELDS: Check TRƯỚC (để tránh bị override bởi pattern matching) =====
        if (ph === 'QSH') return 20;
        if (ph === 'So_so') return 21;
        if (ph === 'Ngay_CapD') return 22;
        if (ph === 'Thua_dat_so') return 23;
        if (ph === 'Ban_do_so') return 24;
        if (ph === 'S') return 25;
        if (ph === 'Loai_Dat') return 26;
        if (ph === 'VTTD') return 27;
        if (ph === 'THSD') return 28;
        if (ph === 'HTSD') return 29;
        if (ph === 'Responsibility') return 30;
        if (ph === 'AddressD') return 31;  // ← Phải check TRƯỚC 'Address' pattern
        if (ph === 'Money') return 32;
        if (ph === 'TTGLVD') return 33;
        if (ph === 'Note') return 34;
        
        // ===== MEN FIELDS: Pattern matching =====
        // Thứ tự: Giới tính - Quan hệ - Họ và tên - Ngày sinh - CCCD - Nơi cấp - Ngày cấp - Địa chỉ - MST - SĐT - Email
        const fieldOrderMap = {
          'Gender': 1,
          'Relation': 2,     // MENx_Relation (cho HĐ phân chia tài sản)
          'Name': 3,
          'Date': 4,
          'CCCD': 5,
          'Noi_Cap': 6,
          'Ngay_Cap': 7,
          'Address': 8,      // Address1, Address7 (MEN)
          'MST': 9,
          'SDT_MEN': 10,
          'EMAIL_MEN': 11
        };
        
        // Kiểm tra từng pattern
        for (const [pattern, order] of Object.entries(fieldOrderMap)) {
          if (ph && ph.startsWith && ph.startsWith(pattern)) {
            return order;
          }
        }
        
        return 50; // Default order
      };
      
      // Sắp xếp items theo thứ tự định nghĩa
      if (subKey && subKey.match && subKey.match(/^MEN\d+$/)) {
        // Sắp xếp cho các subgroup MEN
        items = items.slice().sort((a, b) => getFieldOrder(a.ph) - getFieldOrder(b.ph));
      } else if (groupKey === 'LAND' && subKey === 'INFO') {
        // Sắp xếp cho LAND INFO
        items = items.slice().sort((a, b) => getFieldOrder(a.ph) - getFieldOrder(b.ph));
      }
      
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
              <select id="${safeId}" data-ph="${ph}" class="input-field"${defaultAttr}>
                <option value="">-- Chọn --</option>
                ${map.options
                  .map((opt) => `<option value="${opt}">${opt}</option>`)
                  .join("")}
              </select>
            `;
          } else if (map.type === "date") {
            inputHtml = `
              <label for="${safeId}"><b>${map.label}</b></label>
              <input type="text" id="${safeId}" data-ph="${ph}" class="input-field date-input" placeholder="dd/mm/yyyy">
            `;
          } else if (ph === "Loai_Dat") {
            inputHtml = `
              <label for="${safeId}"><b>${map.label}</b></label>
              <input type="text" id="${safeId}" data-ph="${ph}" class="input-field land-type-input" placeholder="Nhập hoặc click để chọn... (VD: ONT+LUK)">
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
                <textarea id="${safeId}" data-ph="${ph}" class="input-field" rows="4" style="min-height:80px; resize:vertical;"></textarea>
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
                  <input type="${inputType}" id="${safeId}" data-ph="${ph}" class="input-field"${extraAttr}>
                `;
            }
          }
          const cellDiv = document.createElement("div");
          
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

  
  const anyActive = area.querySelector('.form-section.active');
  if (!anyActive) {
    const firstSection = area.querySelector('.form-section');
    if (firstSection) firstSection.classList.add('active');
  }

  setupFormEventListeners();
  
  document.querySelectorAll('select.input-field[data-default]').forEach((sel) => {
    const def = sel.getAttribute('data-default');
    if (def && !sel.value) {
      sel.value = def;
      const id = sel.id.replace(/[^a-zA-Z0-9]/g, "_");
      const ph = idToPh[id];
      if (ph && ph.startsWith && ph.startsWith('Gender')) {
        
      }
    }
  });
  setupDatePickers();
  setupAddressSelects();
  setupTaskbarNavigation();
  updateTaskbarCounts();
  updateDynamicTaskbar();
}


function renderInputField(ph, map) {
  const safeId = ph.replace(/[^a-zA-Z0-9]/g, "_");
  idToPh[safeId] = ph;
  
  let inputHtml = "";
  
  if (map.type === "select") {
    const defaultAttr = map.defaultValue ? ` data-default="${map.defaultValue}"` : "";
    inputHtml = `
      <label for="${safeId}"><b>${map.label}</b></label>
      <select id="${safeId}" data-ph="${ph}" class="input-field"${defaultAttr}>
        <option value="">-- Chọn --</option>
        ${map.options.map((opt) => `<option value="${opt}">${opt}</option>`).join("")}
      </select>
    `;
  } else if (map.type === "date") {
    inputHtml = `
      <label for="${safeId}"><b>${map.label}</b></label>
      <input type="text" id="${safeId}" data-ph="${ph}" class="input-field date-input" placeholder="dd/mm/yyyy">
    `;
  } else if (map.type === "number" && (ph.includes("CCCD") || ph.includes("UQ_CCCD") || ph.includes("UQA_CCCD") || ph.includes("BD_CCCD"))) {
    inputHtml = `
      <label for="${safeId}"><b>${map.label}</b></label>
      <input type="text" id="${safeId}" data-ph="${ph}" class="input-field" inputmode="numeric" pattern="\\d*" maxlength="12">
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
      <input type="${inputType}" id="${safeId}" data-ph="${ph}" class="input-field">
    `;
  }
  
  return { safeId, inputHtml, isAddress: map.type === "address" };
}

function setupFormEventListeners() {
  Object.keys(idToPh).forEach((id) => {
    const ph = idToPh[id];
    const el = document.getElementById(id);
    if (!el) return;

    
    if (ph && ph.startsWith && (ph.startsWith("CCCD") || ph.startsWith("UQ_CCCD") || ph.startsWith("UQA_CCCD") || ph.startsWith("BD_CCCD"))) {
      setupCCCDInput(el);
    }

    
    if ((ph === "SDT_MEN1" || ph === "SDT_MEN7" || ph === "BD_SDT") && el.tagName.toLowerCase() === "input") {
      setupPhoneInput(el);
    }

    
    if ((ph === "MST1" || ph === "MST7") && el.tagName.toLowerCase() === "input") {
      setupMSTInput(el);
    }

    
    if ((ph === "EMAIL_MEN1" || ph === "EMAIL_MEN7" || ph === "BD_Email") && el.tagName.toLowerCase() === "input") {
      setupEmailInput(el);
    }

    
    if (ph && ph.startsWith && (ph.startsWith("Name") || ph.startsWith("UQ_Name") || ph.startsWith("UQA_Name") || ph.startsWith("BD_Name")) && el.tagName.toLowerCase() === "input") {
      setupNameInput(el);
    }

    
    if (ph === "Loai_Dat" && el.tagName.toLowerCase() === "input") {
      setupLandTypeInput(el, id);
    }

    
    if (ph === "Money") {
      setupMoneyInput(el);
    }

    
    if (ph === "Note" && el.tagName.toLowerCase() === "textarea") {
      setupNoteTextarea(el);
    }
  });
}








function validateForm() {
  const inputs = document.querySelectorAll(".input-field");
  const invalidNodes = [];
  
  
  inputs.forEach((input) => {
    const ph = idToPh[input.id];
    if (ph && ph.startsWith && (ph.startsWith("CCCD") || ph.startsWith("UQ_CCCD") || ph.startsWith("UQA_CCCD") || ph.startsWith("BD_CCCD"))) {
      const v = (input.value || "").toString().replace(/\D/g, "");
      if (v && v.length !== 12) {
        invalidNodes.push({ input, ph });
      }
    }
  });
  
          
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

  
  const hasBDPlaceholders = window.lastPlaceholders && window.lastPlaceholders.some(ph => {
    const map = window.phMapping && window.phMapping[ph];
    return map && map.group === 'BD';
  });

  
  if (hasBDPlaceholders && !window.selectedBDDataSource) {
    alert('Vui lòng chọn dữ liệu cho thông tin đăng ký biến động đất đai (Bên A hoặc Bên B)');
    
    const bdSection = document.getElementById('section-BD');
    if (bdSection) {
      bdSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
      
      const taskbarBtns = document.querySelectorAll('.taskbar-btn');
      taskbarBtns.forEach(btn => btn.classList.remove('active'));
      const bdTaskbarBtn = document.querySelector('.taskbar-btn[data-section="BD"]');
      if (bdTaskbarBtn) {
        bdTaskbarBtn.classList.add('active');
      }
      
      document.querySelectorAll('.form-section').forEach(s => s.classList.remove('active'));
      bdSection.classList.add('active');
    }
    return false;
  }

  
  const hasUQPlaceholders = window.lastPlaceholders && window.lastPlaceholders.some(ph => {
    const map = window.phMapping && window.phMapping[ph];
    return map && map.group === 'UQ';
  });

  
  if (hasUQPlaceholders && !window.selectedUQDataSource) {
    alert('Vui lòng chọn nguồn dữ liệu Bên A cho thông tin ủy quyền (Bên A hoặc Bên B)');
    
    const uqSection = document.getElementById('section-UQ');
    if (uqSection) {
      uqSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
      
      const taskbarBtns = document.querySelectorAll('.taskbar-btn');
      taskbarBtns.forEach(btn => btn.classList.remove('active'));
      const uqTaskbarBtn = document.querySelector('.taskbar-btn[data-section="UQ"]');
      if (uqTaskbarBtn) {
        uqTaskbarBtn.classList.add('active');
      }
      
      document.querySelectorAll('.form-section').forEach(s => s.classList.remove('active'));
      uqSection.classList.add('active');
            }
    return false;
  }

  
  const landMissing = [];
  const landExceptions = new Set(["Note", "TTGLVD", "MoneyText", "AddressD"]);
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
  // 🔍 Nếu đang dùng generic form (NEW SYSTEM), gọi hàm riêng
  if (typeof window.collectGenericFormData === 'function' && window.idToPhGeneric && Object.keys(window.idToPhGeneric).length > 0) {
    console.log("🆕 Using GENERIC form data collector (NEW SYSTEM)");
    return window.collectGenericFormData();
  }

  console.log("📄 Using standard form data collector (OLD - Transfer)");
  const inputs = document.querySelectorAll(".input-field");
  const data = {};
  let moneyDigits = "";

  
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
      // Gender KHÔNG tự động thêm ":" - chỉ MENx_Ly mới có
    } else if (ph && map && (map.type === "date" || (map.type === "number" && ph.includes("CCCD")))) {
      // ✅ SỬ DỤNG HELPER FUNCTION CHUNG để format date/CCCD
      if (window.formatInputValue) {
        value = window.formatInputValue(value, ph, map);
        }
            } else if ((ph === "SDT_MEN1" || ph === "SDT_MEN7" || ph === "BD_SDT") && value) {
      // Format phone number
              const digits = value.toString().replace(/\D/g, "");
              if (/^\d{10}$/.test(digits)) {
                value = window.formatPhoneNumber ? `${window.formatPhoneNumber(digits)}` : digits;
              } else {
                value = digits;
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
        
        value = value && value.trim() ? value.trim() : "……….";
      }
      data[ph] = value || "";
    }
  });
  
  
  const menGroupsToCheck = window.MEN_EXTRA_GROUPS || ['MEN3', 'MEN4', 'MEN5', 'MEN6'];
  const menPlaceholders = window.MEN_EXTRA_GROUP_PLACEHOLDERS || {};

  menGroupsToCheck.forEach(group => {
    const placeholders = menPlaceholders[group] || [];
    const hasData = placeholders.some(ph => {
      const value = data[ph];
      return value && value.trim() !== "";
    });

    
    if (!hasData) {
      placeholders.forEach(ph => {
        delete data[ph];
      });
    }
  });
  
  if (moneyDigits) {
    data["MoneyText"] = window.numberToVietnameseWords ? `(Bằng chữ: ${window.numberToVietnameseWords(moneyDigits)})` : `(Bằng chữ: ${moneyDigits})`;
  }

  
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
  
  
  if (window.selectedBDDataSource) {
    data.selectedBDDataSource = window.selectedBDDataSource;
    console.log("🔍 Added selectedBDDataSource to data:", window.selectedBDDataSource);
  }
  
  
  if (window.selectedUQDataSource) {
    data.selectedUQDataSource = window.selectedUQDataSource;
    console.log("🔍 Added selectedUQDataSource to data:", window.selectedUQDataSource);
  }
  
  
  if (window.selectedUQBenBDataSource) {
    data.selectedUQBenBDataSource = window.selectedUQBenBDataSource;
    console.log("🔍 Added selectedUQBenBDataSource to data:", window.selectedUQBenBDataSource);
    
    
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


function setupTaskbarNavigation() {
  const taskbarBtns = document.querySelectorAll('.taskbar-btn');
  
  taskbarBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      const section = btn.dataset.section;
      
      
      taskbarBtns.forEach(b => b.classList.remove('active'));
      document.querySelectorAll('.form-section').forEach(s => s.classList.remove('active'));
      
      
      btn.classList.add('active');
      
      
      const targetSection = document.getElementById(`section-${section}`);
      if (targetSection) {
        targetSection.classList.add('active');
        
        
        targetSection.scrollIntoView({
          behavior: 'smooth',
          block: 'start'
        });
        
        
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
  
  
  const placeholders = window.lastPlaceholders || [];
  
  
  const hasGroupPlaceholders = (group) => {
    return placeholders.some(ph => {
      const map = window.phMapping && window.phMapping[ph];
      return map && map.group === group;
    });
  };
  
  
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
  
  const bcnSection = document.getElementById('section-BCN');
  if (!bcnSection) return;
  
  const groupDiv = bcnSection.querySelector('.form-group');
  if (!groupDiv) return;
  
  
  const subgroupDiv = document.createElement("div");
  const menMatch = subKey && subKey.match && subKey.match(/^MEN(\d+)$/);
  subgroupDiv.className = `form-subgroup${menMatch ? ' person-subgroup' : ''}`;
  if (!menMatch) {
    let subgroupTitle = subKey;
    subgroupDiv.innerHTML = `<h4>${subgroupTitle}</h4>`;
  }
  
  
  const menExtraGroupToPhs = window.MEN_EXTRA_GROUP_PLACEHOLDERS || {};
  
  const placeholders = menExtraGroupToPhs[subKey] || [];
  let items = placeholders.map(ph => {
    const map = window.phMapping && window.phMapping[ph];
    return map ? { ph, map } : null;
  }).filter(Boolean);
  
  // Sắp xếp items theo thứ tự: Giới tính - Họ và tên - Ngày sinh - CCCD - Nơi cấp - Ngày cấp
  const getFieldOrder = (ph) => {
    const fieldOrderMap = {
      'Gender': 1,
      'Name': 2,
      'Date': 3,
      'CCCD': 4,
      'Noi_Cap': 5,
      'Ngay_Cap': 6,
      'Address': 7,
      'MST': 8,
      'SDT_MEN': 9,
      'EMAIL_MEN': 10
    };
    
    for (const [pattern, order] of Object.entries(fieldOrderMap)) {
      if (ph && ph.startsWith && ph.startsWith(pattern)) {
        return order;
      }
    }
    return 50;
  };
  
  items = items.slice().sort((a, b) => getFieldOrder(a.ph) - getFieldOrder(b.ph));
  
  
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
          <select id="${safeId}" data-ph="${ph}" class="input-field"${defaultAttr}>
            <option value="">-- Chọn --</option>
            ${map.options
              .map((opt) => `<option value="${opt}">${opt}</option>`)
              .join("")}
          </select>
        `;
      } else if (map.type === "date") {
        inputHtml = `
          <label for="${safeId}"><b>${map.label}</b></label>
          <input type="text" id="${safeId}" data-ph="${ph}" class="input-field date-input" placeholder="dd/mm/yyyy">
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
            <input type="${inputType}" id="${safeId}" data-ph="${ph}" class="input-field"${extraAttr}>
          `;
      }
      
          const cellDiv = document.createElement("div");
          cellDiv.className = "form-cell form-field";
          cellDiv.innerHTML = inputHtml;
      rowDiv.appendChild(cellDiv);
    }
    subgroupDiv.appendChild(rowDiv);
  }
  
  
  groupDiv.appendChild(subgroupDiv);
  
  
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
  
  
  provinceSelect.value = province;
  
  
  const provinceData = window.addressData.find(p => p.name === province);
  if (provinceData && provinceData.districts) {
    
    districtSelect.innerHTML = '<option value="">-- Chọn quận/huyện --</option>';
    districtSelect.innerHTML += provinceData.districts
      .map(d => `<option value="${d.name}">${d.name}</option>`)
      .join("");
    
    
    if (district) {
      districtSelect.value = district;
      
      
      const districtData = provinceData.districts.find(d => d.name === district);
      if (districtData && districtData.wards) {
        
        wardSelect.innerHTML = '<option value="">-- Chọn phường/xã --</option>';
        wardSelect.innerHTML += districtData.wards
          .map(w => `<option value="${w.name}">${w.name}</option>`)
          .join("");
        
        
        if (ward) {
          wardSelect.value = ward;
          
          
          const wardData = districtData.wards.find(w => w.name === ward);
          if (wardData && wardData.villages) {
            
            villageSelect.innerHTML = '<option value="">-- Chọn thôn --</option>';
            villageSelect.innerHTML += wardData.villages
              .map(v => `<option value="${v}">${v}</option>`)
              .join("");
            
            
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
  
  Object.keys(data).forEach(ph => {
    const safeId = ph.replace(/[^a-zA-Z0-9]/g, "_");
    const element = document.getElementById(safeId);
    const map = window.phMapping && window.phMapping[ph];
    
    if (element && data[ph] && map) {
      if (map.type === "select") {
        
        let value = data[ph];
        if ((ph.startsWith("Gender") || ph.startsWith("UQ_Gender") || ph.startsWith("UQA_Gender") || ph.startsWith("BD_Gender")) && value && value.endsWith(":")) {
          value = value.slice(0, -1);
        }
        element.value = value;
      } else if (map.type === "text" || map.type === "number" || map.type === "date") {
        
        element.value = data[ph];
      } else if (ph === "Note") {
        
        element.value = data[ph];
      }
    }
  });

  
  Object.keys(data).forEach(ph => {
    const safeId = ph.replace(/[^a-zA-Z0-9]/g, "_");
    const map = window.phMapping && window.phMapping[ph];
    if (map && map.type === "address" && data[ph]) {
      restoreAddressField(safeId, data[ph]);
    }
  });

  
  if (data.MoneyRaw) {
    const moneyElement = document.getElementById("Money".replace(/[^a-zA-Z0-9]/g, "_"));
    if (moneyElement) {
      moneyElement.value = window.formatWithCommas ? window.formatWithCommas(data.MoneyRaw) : data.MoneyRaw;
      moneyElement.setAttribute("data-raw", data.MoneyRaw);
    }
  }

  
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
  
  
  const placeholders = window.lastPlaceholders || [];
  
  
  if (!placeholders || placeholders.length === 0) {
    taskbarContainer.style.display = 'none';
    return;
  }
  
  
  const hasGroupPlaceholders = (group) => {
    return placeholders.some(ph => {
      const map = window.phMapping && window.phMapping[ph];
      return map && map.group === group;
    });
  };
  
  
  const allGroups = ['BCN', 'NCN', 'LAND', 'BD', 'UQ'];
  const activeGroups = allGroups.filter(group => hasGroupPlaceholders(group));
  
  console.log('🔍 Active groups based on placeholders:', activeGroups);
  if (activeGroups.length === 0) {
    taskbarContainer.style.display = 'none';
    return;
  }
  taskbar.innerHTML = '';
  const iconMap = {
    'BCN': '👤',
    'NCN': '👥',
    'LAND': '🏠',
    'BD': '📋',
    'UQ': '📝'
  }; 
  
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
  taskbarContainer.style.display = 'block';
  setupTaskbarNavigation();
}

function renderBDForm(placeholders) {
  console.log("🔍 renderBDForm called with placeholders:", placeholders);
  const area = document.getElementById("formArea");
  window.lastPlaceholders = placeholders;
  const bdSectionDiv = document.createElement("div");
  
  const hasActiveSection = document.querySelector('.form-section.active');
  bdSectionDiv.className = `form-section ${hasActiveSection ? '' : 'active'}`;
  bdSectionDiv.id = "section-BD";
  
  const bdGroupDiv = document.createElement("div");
  bdGroupDiv.className = "form-group";
  bdGroupDiv.innerHTML = `<h3>${window.groupLabels && window.groupLabels['BD'] || 'Thông tin đăng ký biến động đất đai'}</h3>`;
  
  const bdPlaceholders = placeholders.filter(ph => {
    const map = window.phMapping && window.phMapping[ph];
    return map && map.group === 'BD';
  });

  console.log("🔍 BD placeholders found:", bdPlaceholders);
  
  if (bdPlaceholders.length > 0) {
    console.log("🔍 Rendering BD form");
    {
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
    }
    
    bdSectionDiv.appendChild(bdGroupDiv);
    area.appendChild(bdSectionDiv);
    console.log("🔍 BD form appended to DOM");
  
      setupBDFormEventListeners();
    setupFormEventListeners(); // Setup CCCD, phone, email, name, etc.
      console.log("🔍 Event listeners setup complete");
    try {
      void bdSectionDiv.offsetHeight;
      setTimeout(() => {
        window.dispatchEvent(new Event('resize'));
      }, 0);
    } catch (e) {
      
    }
  }
  
  updateTaskbarCounts();
}

function setupBDFormEventListeners() {
  console.log("🔍 setupBDFormEventListeners called");
  
  const optionCards = document.querySelectorAll('.option-card');
  console.log("🔍 Found option cards:", optionCards.length);
  
  optionCards.forEach((card, index) => {
    console.log(`🔍 Setting up listener for card ${index}:`, card.dataset.source);
    card.addEventListener('click', () => {
      const source = card.dataset.source;
      const checkbox = card.querySelector('.option-checkbox');
      
      
      if (card.classList.contains('active')) {
        card.classList.remove('active');
        checkbox.classList.remove('checked');
        window.selectedBDDataSource = null;
        console.log('Đã hủy chọn nguồn dữ liệu');
      } else {
        
        optionCards.forEach(c => {
          c.classList.remove('active');
          c.querySelector('.option-checkbox').classList.remove('checked');
        });
        
        card.classList.add('active');
        checkbox.classList.add('checked');
        window.selectedBDDataSource = source;
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
  window.lastPlaceholders = placeholders;
  const uqSectionDiv = document.createElement("div");
  const hasActiveSection = document.querySelector('.form-section.active');
  uqSectionDiv.className = `form-section ${hasActiveSection ? '' : 'active'}`;
  uqSectionDiv.id = "section-UQ";
  const uqGroupDiv = document.createElement("div");
  uqGroupDiv.className = "form-group";
  uqGroupDiv.innerHTML = `<h3>${window.groupLabels && window.groupLabels['UQ'] || 'Thông tin ủy quyền'}</h3>`;
  
  const uqPlaceholders = placeholders.filter(ph => {
    const map = window.phMapping && window.phMapping[ph];
    return map && map.group === 'UQ';
  });

  console.log("🔍 UQ placeholders found:", uqPlaceholders);
  
  if (uqPlaceholders.length > 0) {
    console.log("🔍 Rendering UQ form");
    {
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
    }
    
    const benBCard = document.createElement("div");
    benBCard.className = "data-source-card"
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
    
      setupUQFormEventListeners();
    setupUQBenBEventListeners();
    setupFormEventListeners(); // Setup CCCD, phone, email, name, etc.
    console.log("🔍 UQ form setup complete");
    try {
      void uqSectionDiv.offsetHeight;
      setTimeout(() => {
        window.dispatchEvent(new Event('resize'));
      }, 0);
    } catch (e) {
      
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
      if (card.classList.contains('active')) {
        card.classList.remove('active');
        checkbox.classList.remove('checked');
        window.selectedUQDataSource = null;
        console.log('Đã hủy chọn nguồn dữ liệu UQ');
      } else {
        optionCards.forEach(c => {
          c.classList.remove('active');
          c.querySelector('.option-checkbox').classList.remove('checked');
        });
        card.classList.add('active');
        checkbox.classList.add('checked');
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
      if (card.classList.contains('active')) {
        card.classList.remove('active');
        checkbox.classList.remove('checked');
        window.selectedUQBenBDataSource = null;
        console.log('Đã hủy chọn người được ủy quyền');
      } else {
        
        optionCards.forEach(c => {
          c.classList.remove('active');
          c.querySelector('.option-checkbox').classList.remove('checked');
        });
        card.classList.add('active');
        checkbox.classList.add('checked');
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


function loadDefaultPeople() {
  try {
    const saved = localStorage.getItem('defaultPeople');
    if (saved) {
      return JSON.parse(saved);
    }
  } catch (error) {
    console.error('Error loading default people:', error);
  }
  return [
    { gender: '', name: '', cccd: '', date: '', noiCap: '', ngayCap: '', address: '' },
    { gender: '', name: '', cccd: '', date: '', noiCap: '', ngayCap: '', address: '' },
    { gender: '', name: '', cccd: '', date: '', noiCap: '', ngayCap: '', address: '' }
  ];
}


function saveDefaultPeople(people) {
  try {
    localStorage.setItem('defaultPeople', JSON.stringify(people));
    console.log('✅ Đã lưu danh sách 3 người mặc định');
  } catch (error) {
    console.error('Error saving default people:', error);
  }
}


function openDefaultPeopleManager() {
  const defaultPeople = loadDefaultPeople();
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
  
  const existingModal = document.getElementById('defaultPeopleModal');
  if (existingModal) {
    existingModal.remove();
  }
  document.body.insertAdjacentHTML('beforeend', modalHtml);  
  setTimeout(() => {
    if (typeof flatpickr !== 'undefined') {
      document.querySelectorAll('#defaultPeopleModal .date-input').forEach(input => {
        flatpickr(input, {
          dateFormat: "d/m/Y",
          allowInput: true
        });
      });
    }  
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
  
  const uqSection = document.getElementById('section-UQ');
  if (uqSection && window.lastPlaceholders) {
    
    renderUQForm(window.lastPlaceholders);
  }
  
  alert('✅ Đã lưu thông tin 3 người mặc định!');
}

window.loadDefaultPeople = loadDefaultPeople;
window.saveDefaultPeople = saveDefaultPeople;
window.openDefaultPeopleManager = openDefaultPeopleManager;
window.closeDefaultPeopleModal = closeDefaultPeopleModal;
window.saveDefaultPeopleFromModal = saveDefaultPeopleFromModal;
window.updateDynamicTaskbar = updateDynamicTaskbar;