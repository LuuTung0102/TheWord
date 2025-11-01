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

function renderTemplateItem(folder, actionType) {
  const actionConfig = {
    add: { class: 'add', icon: '+', title: 'Chọn folder' },
    remove: { class: 'remove', icon: '🗑️', title: 'Bỏ chọn' }
  };
  
  const config = actionConfig[actionType] || actionConfig.add;
  const item = document.createElement("div");
  item.className = "template-item";
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
  
  if (typeof updateExportButtonState === 'function') {
    updateExportButtonState();
  }
};

function setupTemplateEventListeners() {
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
    if (typeof updateDynamicTaskbar === 'function') {
      updateDynamicTaskbar();
    }
    return;
  }

  const phSet = new Set();
  for (const folderName of selectedTemplates) {
    console.log(`📋 Loading placeholders from folder: ${folderName}`);
    const ph = await window.ipcRenderer.invoke("get-folder-placeholders", folderName);
    if (Array.isArray(ph)) {
      ph.forEach((p) => phSet.add(p));
    }
  }

  console.log(`✅ Total placeholders: ${phSet.size}`);
  let folderConfig = null;
  let folderPath = null;
  
  if (selectedTemplates.length > 0) {
    const templatesRoot = await window.ipcRenderer.invoke("get-templates-root");
    folderPath = `${templatesRoot}\\${selectedTemplates[0]}`;
    console.log(`🔍 Trying to load config from: ${folderPath}`);
    if (typeof window.loadFolderConfig === 'function') {
      folderConfig = await window.loadFolderConfig(folderPath);
    }
  }
  
  if (folderConfig && typeof window.renderGenericForm === 'function') {
    const hasBDorUQ = folderConfig.groups && folderConfig.groups.some(group => 
      group.id === 'BD' || group.id === 'UQ' || 
      group.label.toLowerCase().includes('biến động') || 
      group.label.toLowerCase().includes('ủy quyền')
    );
    
    if (hasBDorUQ) {
      console.log("⚠️ Config has BD/UQ - Using OLD system for advanced features");
      renderForm([...phSet]);
    } else {
      console.log("🆕 Using NEW config-based system");
      await window.renderGenericForm([...phSet], folderConfig, folderPath);
    }
  } else if (typeof renderForm === 'function') {
    console.log("⚠️ Using OLD legacy system (no config.json found)");
    renderForm([...phSet]);
  }
  
  setTimeout(() => {
    if (typeof window.reSetupAllInputs === 'function') {
      window.reSetupAllInputs();
    }
  }, 500);
}

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

  const placePopovers = () => {
    const controls = document.querySelector('.template-controls');
    if (!controls) return;
    const rect = controls.getBoundingClientRect();
    const baseLeft = rect.left + rect.width / 2;
    const offset = 190;
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
