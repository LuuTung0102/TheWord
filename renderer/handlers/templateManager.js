let allTemplates = window.allTemplates || [];
let selectedTemplates = window.selectedTemplates || [];

async function loadTemplates() {
  try {
    allTemplates = await window.ipcRenderer.invoke("get-templates");
    window.allTemplates = allTemplates;
    renderLeftTable(allTemplates);
    selectedTemplates = [];
    window.selectedTemplates = selectedTemplates;
    renderRightTable([]);
    window.stateManager.getElement("formArea").innerHTML = "";
    updateTemplateCounts();
    setupTemplateEventListeners();
  } catch (err) {
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
  const container = window.stateManager.querySelector("#leftTable");
  if (!container) {
    return;
  }
  container.innerHTML = "";
 
  templates.forEach((file) => {
    container.appendChild(renderTemplateItem(file, 'add'));
  });
}

function renderRightTable(templates) {
  const container = window.stateManager.querySelector("#rightTable");
  if (!container) {
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
    window.stateManager.getElement("formArea").innerHTML = "";
    return;
  }

  const phSet = new Set();
  for (const folderName of selectedTemplates) {
    const ph = await window.ipcRenderer.invoke("get-folder-placeholders", folderName);
    if (Array.isArray(ph)) {
      ph.forEach((p) => phSet.add(p));
    }
  }

  let folderConfig = null;
  let folderPath = null;
  
  if (selectedTemplates.length > 0) {
    const templatesRoot = await window.ipcRenderer.invoke("get-templates-root");
    folderPath = `${templatesRoot}\\${selectedTemplates[0]}`;
    if (typeof window.loadFolderConfig === 'function') {
      folderConfig = await window.loadFolderConfig(folderPath);
    }
  }
  
  if (folderConfig && typeof window.renderGenericForm === 'function') {
    await window.renderGenericForm([...phSet], folderConfig, folderPath);
  } else {
    window.stateManager.getElement("formArea").innerHTML = "<p style='padding: 20px; color: #dc3545;'>⚠️ Vui lòng thêm config.json vào folder template</p>";
  }
}

function setupSearch() {
  window.stateManager.getElement("searchLeft").addEventListener("input", (e) => {
    const query = e.target.value.toLowerCase();
    const filtered = allTemplates.filter((t) => t.toLowerCase().includes(query));
    renderLeftTable(filtered);
  });

  window.stateManager.getElement("searchRight").addEventListener("input", (e) => {
    const query = e.target.value.toLowerCase();
    const filtered = selectedTemplates.filter((t) =>
      t.toLowerCase().includes(query)
    );
    renderRightTable(filtered);
  });
}

function setupTemplatePopovers() {
  const leftBtn = window.stateManager.getElement('btnOpenLeft');
  const rightBtn = window.stateManager.getElement('btnOpenRight');
  const leftPop = window.stateManager.querySelector('.left-popover');
  const rightPop = window.stateManager.querySelector('.right-popover');
  if (!leftBtn || !rightBtn || !leftPop || !rightPop) return;

  const placePopovers = () => {
    const controls = window.stateManager.querySelector('.template-controls');
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
    const rightBtn = window.stateManager.getElement('btnOpenRight');
    const leftBtn = window.stateManager.getElement('btnOpenLeft');
    const selCount = (window.selectedTemplates || []).length;
    const allCount = (window.allTemplates || []).length;
    if (rightBtn) rightBtn.textContent = `✅ Đã chọn (${selCount})`;
    if (leftBtn) leftBtn.textContent = `📂 Mẫu có sẵn (${allCount})`;
  } catch (e) {}
}

window.updateTemplateCounts = updateTemplateCounts;
