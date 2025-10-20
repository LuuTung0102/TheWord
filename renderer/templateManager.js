let allTemplates = window.allTemplates || [];
let selectedTemplates = window.selectedTemplates || [];

async function loadTemplates() {
  try {
    console.log('🔍 TemplateManager: Loading templates...');
    allTemplates = await window.ipcRenderer.invoke("get-templates");
    console.log('🔍 TemplateManager: Templates loaded:', allTemplates);
    window.allTemplates = allTemplates;
    renderLeftTable(allTemplates);
    selectedTemplates = [];
    window.selectedTemplates = selectedTemplates;
    renderRightTable([]);
    document.getElementById("formArea").innerHTML = "";
    updateTemplateCounts();
    setupTemplateEventListeners();
  } catch (err) {
    console.error('❌ TemplateManager: Error loading templates:', err);
  }
}

function renderLeftTable(templates) {
  const container = document.querySelector("#leftTable");
  if (!container) {
    console.error("❌ TemplateManager: #leftTable not found");
    return;
  }
  container.innerHTML = "";
 
  templates.forEach((file) => {
    const item = document.createElement("div");
    item.className = "template-item";
    item.innerHTML = `
      <div class="template-icon">
        <i class="fas fa-file-word"></i>
      </div>
      <div class="template-info">
        <h4 class="template-name">${file}</h4>
        <p class="template-meta">File Word</p>
      </div>
      <div class="template-actions">
        <button class="action-btn add" data-file="${file}" title="Thêm">
          <i class="fas fa-plus"></i>
        </button>
      </div>
    `;
    container.appendChild(item);
  });
}

function renderRightTable(templates) {
  const container = document.querySelector("#rightTable");
  if (!container) {
    console.error("❌ TemplateManager: #rightTable not found");
    return;
  }
  container.innerHTML = "";
 
  templates.forEach((file) => {
    const item = document.createElement("div");
    item.className = "template-item";
    item.innerHTML = `
      <div class="template-icon">
        <i class="fas fa-file-word"></i>
      </div>
      <div class="template-info">
        <h4 class="template-name">${file}</h4>
        <p class="template-meta">File Word</p>
      </div>
      <div class="template-actions">
        <button class="action-btn remove" data-file="${file}" title="Xóa">
          <i class="fas fa-trash"></i>
        </button>
      </div>
    `;
    container.appendChild(item);
  });
  updateTemplateCounts();
}

window.selectTemplate = (file) => {
  if (!selectedTemplates.includes(file)) {
    selectedTemplates.push(file);
    window.selectedTemplates = selectedTemplates;
    const newAll = allTemplates.filter((t) => t !== file);
    allTemplates = newAll;
    window.allTemplates = allTemplates;
    renderLeftTable(allTemplates);
    renderRightTable(selectedTemplates);
    updateForm();
    updateTemplateCounts();
    
    // Update export button state
    if (typeof updateExportButtonState === 'function') {
      updateExportButtonState();
    }
  }
};

window.removeTemplate = (file) => {
  selectedTemplates = selectedTemplates.filter((t) => t !== file);
  window.selectedTemplates = selectedTemplates;
  allTemplates.push(file);
  window.allTemplates = allTemplates;
  renderLeftTable(allTemplates);
  renderRightTable(selectedTemplates);
  updateForm();
  updateTemplateCounts();
  
  // Update export button state
  if (typeof updateExportButtonState === 'function') {
    updateExportButtonState();
  }
};

// Setup event listeners for new button structure
function setupTemplateEventListeners() {
  // Add event listeners for add buttons
  document.addEventListener('click', (e) => {
    if (e.target.closest('.action-btn.add')) {
      const button = e.target.closest('.action-btn.add');
      const file = button.dataset.file;
      if (file) {
        selectTemplate(file);
      }
    }
    
    if (e.target.closest('.action-btn.remove')) {
      const button = e.target.closest('.action-btn.remove');
      const file = button.dataset.file;
      if (file) {
        removeTemplate(file);
      }
    }
  });
}

async function updateForm() {
  if (!selectedTemplates.length) {
    document.getElementById("formArea").innerHTML = "";
    // Ẩn tất cả taskbar buttons khi không có template nào được chọn
    if (typeof updateDynamicTaskbar === 'function') {
      updateDynamicTaskbar();
    }
    return;
  }

  const phSet = new Set();
  // Alias MENx_Ly -> concrete placeholders
  const menAliasMap = { 1: "Gender", 2: "Name", 3: "Date", 4: "CCCD", 5: "Noi_Cap", 6: "Ngay_Cap" };
  const ensureFullGroup = (groupIdx) => {
    Object.values(menAliasMap).forEach((base) => phSet.add(`${base}${groupIdx}`));
  };
  for (const f of selectedTemplates) {
    const ph = await window.ipcRenderer.invoke("get-placeholders", f);
    if (Array.isArray(ph)) {
      ph.forEach((p) => {
        phSet.add(p);
        const m = p && p.match && p.match(/^MEN([3-6])_L([1-6])$/);
        if (m) {
          const groupIdx = m[1];
          const fieldIdx = Number(m[2]);
          const base = menAliasMap[fieldIdx];
          if (base) phSet.add(`${base}${groupIdx}`);
          ensureFullGroup(groupIdx);
        }
      });
    }
  }

  if (typeof renderForm === 'function') {
    renderForm([...phSet]);
  } else {
 
  }
}

// Setup search functionality
function setupSearch() {
  document.getElementById("searchLeft").addEventListener("input", (e) => {
    const query = e.target.value.toLowerCase();
    const filtered = allTemplates.filter((t) => t.toLowerCase().includes(query));
    renderLeftTable(filtered);
  });

  document.getElementById("searchRight").addEventListener("input", (e) => {
    const query = e.target.value.toLowerCase();
    const filtered = selectedTemplates.filter((t) =>
      t.toLowerCase().includes(query)
    );
    renderRightTable(filtered);
  });
}

function setupTemplatePopovers() {
  const leftBtn = document.getElementById('btnOpenLeft');
  const rightBtn = document.getElementById('btnOpenRight');
  const leftPop = document.querySelector('.left-popover');
  const rightPop = document.querySelector('.right-popover');
  if (!leftBtn || !rightBtn || !leftPop || !rightPop) return;

  // Center popovers below the controls
  const placePopovers = () => {
    const controls = document.querySelector('.template-controls');
    if (!controls) return;
    const rect = controls.getBoundingClientRect();
    const baseLeft = rect.left + rect.width / 2;
    const offset = 190; // half width of popover
    leftPop.style.left = Math.max(12, baseLeft - offset - 190) + 'px';
    rightPop.style.left = Math.max(12, baseLeft - offset + 190) + 'px';
  };
  placePopovers();
  window.addEventListener('resize', placePopovers);
  window.addEventListener('scroll', placePopovers, true);

  const hideAll = () => {
    leftPop.style.display = 'none';
    rightPop.style.display = 'none';
  };

  leftBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    const willShow = leftPop.style.display === 'none';
    hideAll();
    leftPop.style.display = willShow ? 'block' : 'none';
  });

  rightBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    const willShow = rightPop.style.display === 'none';
    hideAll();
    rightPop.style.display = willShow ? 'block' : 'none';
  });

  document.addEventListener('click', (e) => {
    if (!e.target.closest('.template-popover') && !e.target.closest('.template-controls')) {
      hideAll();
    }
  });
}

window.setupTemplatePopovers = setupTemplatePopovers;

// Make template manager functions available globally
window.loadTemplates = loadTemplates;
window.renderLeftTable = renderLeftTable;
window.renderRightTable = renderRightTable;
window.updateForm = updateForm;
window.setupSearch = setupSearch;
window.getSelectedTemplates = () => selectedTemplates;
window.getAllTemplates = () => allTemplates;

function updateTemplateCounts() {
  try {
    const rightBtn = document.getElementById('btnOpenRight');
    const leftBtn = document.getElementById('btnOpenLeft');
    const selCount = (window.selectedTemplates || []).length;
    const allCount = (window.allTemplates || []).length;
    if (rightBtn) rightBtn.textContent = `✅ Đã chọn (${selCount})`;
    if (leftBtn) leftBtn.textContent = `📂 Mẫu có sẵn (${allCount})`;
  } catch (e) {}
}

window.updateTemplateCounts = updateTemplateCounts;
