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

// Helper function to render template items (folders)
function renderTemplateItem(folder, actionType) {
  const actionConfig = {
    add: { class: 'add', icon: '+', title: 'Chọn folder' },
    remove: { class: 'remove', icon: '🗑️', title: 'Bỏ chọn' }
  };
  
  const config = actionConfig[actionType] || actionConfig.add;
  const item = document.createElement("div");
  item.className = "template-item";
  
  // Folder có thể là string (tên) hoặc object {name, fileCount, files}
  const folderName = typeof folder === 'string' ? folder : folder.name;
  const fileCount = typeof folder === 'object' ? folder.fileCount : 0;
  
  item.innerHTML = `
    <div class="template-icon">
      <span class="icon">📁</span>
    </div>
    <div class="template-info">
      <h4 class="template-name">${folderName}</h4>
      <p class="template-meta">${fileCount} file${fileCount !== 1 ? 's' : ''} Word</p>
    </div>
    <div class="template-actions">
      <button class="action-btn ${config.class}" data-file="${folderName}" title="${config.title}">
        <span class="icon">${config.icon}</span>
      </button>
    </div>
  `;
  return item;
}

function renderLeftTable(templates) {
  const container = document.querySelector("#leftTable");
  if (!container) {
    console.error("❌ TemplateManager: #leftTable not found");
    return;
  }
  container.innerHTML = "";
 
  templates.forEach((file) => {
    container.appendChild(renderTemplateItem(file, 'add'));
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
    container.appendChild(renderTemplateItem(file, 'remove'));
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
  
  // Lấy placeholders từ folder (thay vì từ files)
  for (const folderName of selectedTemplates) {
    console.log(`📋 Loading placeholders from folder: ${folderName}`);
    const ph = await window.ipcRenderer.invoke("get-folder-placeholders", folderName);
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

  console.log(`✅ Total placeholders: ${phSet.size}`);
  
  // 🆕 TRY LOAD CONFIG.JSON FIRST
  let folderConfig = null;
  let folderPath = null;
  
  if (selectedTemplates.length > 0) {
    // Get folder path
    const templatesRoot = await window.ipcRenderer.invoke("get-templates-root");
    folderPath = `${templatesRoot}\\${selectedTemplates[0]}`;
    
    console.log(`🔍 Trying to load config from: ${folderPath}`);
    
    if (typeof window.loadFolderConfig === 'function') {
      folderConfig = await window.loadFolderConfig(folderPath);
    }
  }
  
  // 🎨 RENDER FORM
  if (folderConfig && typeof window.renderGenericForm === 'function') {
    // Check if has BD or UQ groups → Use old system (has special logic)
    // For new JSON format, check if any group has BD/UQ in the name
    const hasBDorUQ = folderConfig.groups && folderConfig.groups.some(group => 
      group.id === 'BD' || group.id === 'UQ' || 
      group.label.toLowerCase().includes('biến động') || 
      group.label.toLowerCase().includes('ủy quyền')
    );
    
    if (hasBDorUQ) {
      // ⚠️ FALLBACK: BD/UQ need old system for source selection
      console.log("⚠️ Config has BD/UQ - Using OLD system for advanced features");
      renderForm([...phSet]);
    } else {
      // ✅ NEW SYSTEM: Use config-based generic form
      console.log("🆕 Using NEW config-based system");
      await window.renderGenericForm([...phSet], folderConfig, folderPath);
    }
  } else if (typeof renderForm === 'function') {
    // ⚠️ OLD SYSTEM: Fallback to legacy form
    console.log("⚠️ Using OLD legacy system (no config.json found)");
    renderForm([...phSet]);
  }
  
  // ⚡ Setup lại TẤT CẢ event listeners sau khi render form
  setTimeout(() => {
    if (typeof window.reSetupAllInputs === 'function') {
      window.reSetupAllInputs();
    }
  }, 500);
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
