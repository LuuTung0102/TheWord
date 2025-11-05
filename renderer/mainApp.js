
class MainApp {
  constructor() {
    this.selectedFolder = null;
    this.selectedFile = null;
    this.expandedFolder = null;
    this.templates = [];
    this.files = [];
    this.formData = {};
    this.isLoading = false;
    this.lastExportedPath = null;
  }

  async init() {
    console.log('🚀 MainApp: Initializing...');
    
    try {
      await this.loadTemplates();
      this.setupEventListeners();
      this.updateUI();
      console.log('✅ MainApp: Initialized successfully');
    } catch (error) {
      console.error('❌ MainApp: Initialization failed:', error);
      this.showError('Không thể khởi tạo ứng dụng');
    }
  }

  async loadTemplates() {
    try {
      console.log('📁 MainApp: Loading templates from config...');
    
      const config = await this.loadMainConfig();
      
      if (config && config.folders) {
        this.templates = await Promise.all(config.folders.map(async (folderConfig) => {
          try {
            const templatesRoot = await window.ipcRenderer.invoke("get-templates-root");
            const folderPath = `${templatesRoot}\\${folderConfig.path.replace(/\//g, '\\')}`;
            console.log(`🔍 MainApp: Checking folder path: ${folderPath}`);
            const folderExists = await window.ipcRenderer.invoke("check-folder-exists", folderPath);
            if (!folderExists) {
              console.warn(`⚠️ MainApp: Folder not found: ${folderConfig.path}`);
              return null;
            }
            
            const files = await window.ipcRenderer.invoke("get-files-in-folder", folderPath);
            
            return {
              name: folderConfig.name,
              displayName: folderConfig.name,
              description: folderConfig.description,
              icon: this.getFolderIcon(folderConfig),
              fileCount: files.length,
              files: files,
              path: folderConfig.path
            };
          } catch (error) {
            console.warn(`⚠️ MainApp: Could not load folder ${folderConfig.name}:`, error);
            return null;
          }
        }));
        
        this.templates = this.templates.filter(template => template !== null);
        
        console.log('📁 MainApp: Templates loaded from config:', this.templates);
      } else {
        console.warn('⚠️ MainApp: No folders found in config');
        this.templates = [];
      }
    } catch (error) {
      console.error('❌ MainApp: Error loading templates from config:', error);
      throw error;
    }
  }

  async loadMainConfig() {
    try {
      if (window.ipcRenderer) {
        return await window.ipcRenderer.invoke("load-main-config");
      } else {
        return {
          folders: [
            {
              name: "HĐ chuyển nhượng",
              path: "templates/HĐ chuyển nhượng",
              description: "Hợp đồng chuyển nhượng quyền sử dụng đất"
            }
          ]
        };
      }
    } catch (error) {
      console.error('❌ MainApp: Error loading main config:', error);
      return null;
    }
  }

  getFolderIcon(folderConfig) {
    if (folderConfig.icon) {
      return folderConfig.icon;
    }
    return '📁';
  }

  setupEventListeners() {
    // Export button
    const exportBtn = document.getElementById('exportBtn');
    if (exportBtn) {
      exportBtn.addEventListener('click', () => this.handleExport());
    }

    this.setupTemplateListeners();
  }

  setupTemplateListeners() {
    const templateList = document.getElementById('templateList');
    if (!templateList) return;

    templateList.removeEventListener('click', this.handleTemplateClick);
    
    this.handleTemplateClick = (event) => {
      const folderItem = event.target.closest('.folder-item');
      if (!folderItem) return;

      const templateName = folderItem.dataset.templateName;
      this.selectFolder(templateName);
    };

    templateList.addEventListener('click', this.handleTemplateClick);
  }

  async selectFolder(folderName) {
    try {
      console.log('📁 MainApp: Toggling folder:', folderName);
      
      if (this.expandedFolder === folderName) {
        this.expandedFolder = null;
        this.selectedFolder = null;
        this.selectedFile = null;
        this.files = [];
      } else {
        this.expandedFolder = folderName;
        this.selectedFolder = folderName;
        this.selectedFile = null; 
        
        await this.loadFilesInFolder(folderName);
      }
      
      this.updateFolderSelection();
      this.updateFormStatus();
      this.renderTemplates(); 
      
      if (!this.expandedFolder) {
        this.clearFormArea();
      }
      
      this.updateExportButton();
      
    } catch (error) {
      console.error('❌ MainApp: Error toggling folder:', error);
      this.showError('Không thể tải files trong folder này');
    }
  }

  async selectFile(fileName) {
    try {
      console.log('📄 MainApp: Selecting file:', fileName);
      this.selectedFile = fileName;
      this.updateFileSelection();
      this.updateFormStatus();
      await this.loadFormForFile(fileName);
      this.updateExportButton();
      
    } catch (error) {
      console.error('❌ MainApp: Error selecting file:', error);
      this.showError('Không thể tải form cho file này');
    }
  }

  async loadFilesInFolder(folderName) {
    try {
      console.log('📁 MainApp: Loading files in folder:', folderName);
      
      const template = this.templates.find(t => t.name === folderName);
      if (template) {
        this.files = template.files.map(fileName => ({
          name: fileName,
          displayName: fileName.replace('.docx', ''),
          icon: '📄'
        }));
        console.log('📁 MainApp: Files loaded:', this.files);
      } else {
        this.files = [];
      }
    } catch (error) {
      console.error('❌ MainApp: Error loading files:', error);
      this.files = [];
    }
  }


  async loadFormForFile(fileName) {
    try {
      console.log('📝 MainApp: Loading form for file:', fileName);
      this.showFormLoading();
      const templatesRoot = window.ipcRenderer ? 
        await window.ipcRenderer.invoke("get-templates-root") : 
        'templates';
      const selectedTemplate = this.templates.find(t => t.name === this.selectedFolder);
      if (!selectedTemplate) {
        throw new Error(`Template not found: ${this.selectedFolder}`);
      }
      const folderPath = `${templatesRoot}\\${selectedTemplate.path.replace(/\//g, '\\')}`;
      console.log(`🔍 MainApp: Loading form for file in path: ${folderPath}`);
      const placeholders = await this.loadPlaceholdersForFile(folderPath, fileName);
      const folderConfig = await this.loadConfig(folderPath);
      this.currentConfig = folderConfig; 
      
      if (folderConfig && folderConfig.templates) {
        const matchedTemplate = this.findMatchingTemplate(placeholders, folderConfig.templates, fileName);
        
        if (matchedTemplate) {
          console.log('📝 MainApp: File matches template:', matchedTemplate.id);
          const filteredConfig = this.buildFilteredConfig(folderConfig, matchedTemplate);
          window.currentTemplate = {
            config: filteredConfig,
            selectedFile: matchedTemplate,
            fileName: fileName,
            folderPath: folderPath
          };
          console.log('✅ MainApp: Saved currentTemplate for validation:', window.currentTemplate);
          window.visibleSubgroups = new Set();
          window.defaultVisibleSubgroups = new Set();
          console.log('🔄 MainApp: Reset visibleSubgroups and defaultVisibleSubgroups for new file');
          if (window.renderGenericForm) {
            await window.renderGenericForm(placeholders, filteredConfig, folderPath);
          } else {
            throw new Error('renderGenericForm not available');
          }
        } else {
          console.warn('⚠️ MainApp: No template matches for file:', fileName);
          throw new Error(`No template matches found for file: ${fileName}`);
        }
      } else {
        throw new Error('No config.json found in folder');
      }
      
      console.log('✅ MainApp: Form loaded successfully');
      
    } catch (error) {
      console.error('❌ MainApp: Error loading form:', error);
      this.showFormError('Không thể tải form');
    }
  }

  findMatchingTemplate(placeholders, templates, fileName) {
    console.log('🔍 MainApp: Finding matching template for file:', fileName);
    
    // Chỉ match theo filename
    for (const template of templates) {
      if (template.filename === fileName) {
        console.log(`✅ MainApp: Template match found: ${template.id}`);
        console.log(`✅ MainApp: Template groups:`, template.groups);
        return template;
      }
    }
    
    console.log('❌ MainApp: No template matches found for file:', fileName);
    return null;
  }


  buildFilteredConfig(folderConfig, matchedTemplate) {
    try {
      const allowedGroups = new Set(matchedTemplate.groups || []);
      const filtered = JSON.parse(JSON.stringify(folderConfig));
      if (Array.isArray(filtered.groups)) {
        filtered.groups = filtered.groups.filter(g => allowedGroups.has(g.id));
      }
      if (Array.isArray(filtered.fieldMappings)) {
        filtered.fieldMappings = filtered.fieldMappings.filter(m => allowedGroups.has(m.group));
      }

      return filtered;
    } catch (e) {
      console.error('❌ MainApp: Error building filtered config:', e);
      return folderConfig;
    }
  }


  async loadPlaceholdersForFile(folderPath, fileName) {
    try {
      if (window.ipcRenderer) {
        return await window.ipcRenderer.invoke("get-file-placeholders", folderPath, fileName);
      } else {
        console.warn('⚠️ MainApp: ipcRenderer not available');
        return [];
      }
    } catch (error) {
      console.error('❌ MainApp: Error loading placeholders for file:', error);
      return [];
    }
  }


  async loadConfig(folderPath) {
    try {
      if (window.loadFolderConfig) {
        return await window.loadFolderConfig(folderPath);
      }
      return null;
    } catch (error) {
      console.error('❌ MainApp: Error loading config:', error);
      return null;
    }
  }


  async handleExport() {
    if (!this.selectedFolder || !this.selectedFile) {
      this.showError('Vui lòng chọn folder và file trước');
      return;
    }

    if (window.validateForm && typeof window.validateForm === 'function') {
      console.log('🔍 MainApp: Validating form before export...');
      const isValid = window.validateForm();
      if (!isValid) {
        console.log('❌ MainApp: Form validation failed, stopping export');
        return; 
      }
      console.log('✅ MainApp: Form validation passed, proceeding with export');
    } else {
      console.warn('⚠️ MainApp: validateForm not available, skipping validation');
    }

    try {
      console.log('📤 MainApp: Starting export...'); 
      this.showLoading();
      const formData = this.collectFormData();
      if (window.sessionStorageManager && this.selectedFile) {
        console.log(`🔍 Before saveFormData:`, {
          selectedFile: this.selectedFile,
          formData,
          reusedGroups: Array.from(window.__reusedGroups || []),
          reusedGroupSources: window.__reusedGroupSources
        });
        
        const saved = window.sessionStorageManager.saveFormData(
          this.selectedFile, 
          formData, 
          window.__reusedGroups,
          window.__reusedGroupSources,
          this.currentConfig 
        );
        
        console.log(`🔍 saveFormData returned:`, saved);
        
        if (saved) {
          console.log(`💾 Saved new session data for: ${this.selectedFile}`);
        }

        window.__formDataReused = false;
        if (window.__reusedGroups) window.__reusedGroups.clear();
        if (window.__reusedGroupSources) window.__reusedGroupSources.clear();
      }
      const selectedTemplate = this.templates.find(t => t.name === this.selectedFolder);
      if (!selectedTemplate) {
        throw new Error(`Template not found: ${this.selectedFolder}`);
      }
      
      if (window.ipcRenderer) {
        const phMapping = window.__renderDataStructures?.phMapping || {};
        const visibleSubgroups = window.visibleSubgroups ? Array.from(window.visibleSubgroups) : [];
        const result = await window.ipcRenderer.invoke("export-single-document", {
          folderPath: selectedTemplate.path,
          fileName: this.selectedFile,
          formData: formData,
          options: { phMapping, visibleSubgroups }
        });
        
        if (result.success) {
          this.lastExportedPath = result.outputPath;
          this.showSuccess('Văn bản đã được tạo thành công!');
        } else {
          throw new Error(result.error || 'Export failed');
        }
      } else {
        await new Promise(resolve => setTimeout(resolve, 2000));
        this.showSuccess('Văn bản đã được tạo thành công! (Demo)');
      }
      
    } catch (error) {
      console.error('❌ MainApp: Export failed:', error);
      this.showError('Không thể tạo văn bản: ' + error.message);
    } finally {
      this.hideLoading();
    }
  }


  collectFormData() {
    try {
      // Chỉ sử dụng collectGenericFormData (hệ thống mới)
      if (window.collectGenericFormData) {
        return window.collectGenericFormData();
      }
      
      // Fallback: collect manually nếu không có collectGenericFormData
      const data = {};
      document.querySelectorAll('input[data-ph], select[data-ph], textarea[data-ph]').forEach(el => {
        const ph = el.getAttribute('data-ph');
        if (ph) {
          data[ph] = el.value.trim();
        }
      });
      
      return data;
    } catch (error) {
      console.error('❌ MainApp: Error collecting form data:', error);
      return {};
    }
  }


  updateUI() {
    this.renderTemplates();
    this.updateTemplateCount();
    this.updateFormStatus();
    this.updateExportButton();
  }


  renderFiles() {
    const fileList = document.getElementById('fileList');
    const fileCount = document.getElementById('fileCount');
    
    if (!fileList) return;
    
    if (this.files.length === 0) {
      fileList.innerHTML = `
        <div class="empty-state-small">
          <span class="icon">📄</span>
          <p>Chưa có file nào</p>
        </div>
      `;
      if (fileCount) fileCount.textContent = '0';
      return;
    }

    fileList.innerHTML = this.files.map(file => `
      <div class="template-item ${this.selectedFile === file.name ? 'selected' : ''}" data-file-name="${file.name}">
        <div class="template-header">
          <div class="template-icon">${file.icon}</div>
          <div class="template-name">${file.displayName}</div>
        </div>
      </div>
    `).join('');

    if (fileCount) fileCount.textContent = this.files.length;

    this.setupFileListeners();
  }


  setupFileListeners() {
    const fileItems = document.querySelectorAll('.file-item[data-file-name]');
    fileItems.forEach(item => {
      item.addEventListener('click', (event) => {
        event.stopPropagation(); 
        const fileName = item.dataset.fileName;
        this.selectFile(fileName);
      });
    });
  }


  renderTemplates() {
    const templateList = document.getElementById('templateList');
    if (!templateList) return;

    if (this.templates.length === 0) {
      templateList.innerHTML = `
        <div class="empty-state">
          <div class="empty-icon">📁</div>
          <h3>Không có folder</h3>
          <p>Không tìm thấy folder nào trong thư mục</p>
        </div>
      `;
      return;
    }

    templateList.innerHTML = this.templates.map(template => {
      const isExpanded = this.expandedFolder === template.name;
      const isSelected = this.selectedFolder === template.name;
      
      let filesHtml = '';
      if (isExpanded && this.files.length > 0) {
        filesHtml = `
          <div class="folder-files">
            ${this.files.map(file => `
              <div class="file-item ${this.selectedFile === file.name ? 'selected' : ''}" data-file-name="${file.name}">
                <div class="file-icon">${file.icon}</div>
                <div class="file-name">${file.displayName}</div>
              </div>
            `).join('')}
          </div>
        `;
      }
      
      return `
        <div class="folder-item ${isSelected ? 'selected' : ''} ${isExpanded ? 'expanded' : ''}" data-template-name="${template.name}">
          <div class="folder-header">
            <div class="folder-icon">${template.icon}</div>
            <div class="folder-name">${template.displayName}</div>
            <div class="folder-toggle">${isExpanded ? '▼' : '▶'}</div>
          </div>
          ${filesHtml}
        </div>
      `;
    }).join('');


    this.setupTemplateListeners();
    this.setupFileListeners();
  }



  updateTemplateSelection() {
    const templateItems = document.querySelectorAll('.template-item');
    templateItems.forEach(item => {
      if (item.dataset.templateName === this.selectedTemplate) {
        item.classList.add('selected');
      } else {
        item.classList.remove('selected');
      }
    });
  }


  updateTemplateCount() {
    const templateCount = document.getElementById('templateCount');
    if (templateCount) {
      templateCount.textContent = this.templates.length;
    }
  }


  updateFolderSelection() {
    const folderItems = document.querySelectorAll('.folder-item[data-template-name]');
    folderItems.forEach(item => {
      const templateName = item.dataset.templateName;
      if (templateName === this.selectedFolder) {
        item.classList.add('selected');
      } else {
        item.classList.remove('selected');
      }
    });
  }


  updateFileSelection() {
    const fileItems = document.querySelectorAll('.file-item[data-file-name]');
    fileItems.forEach(item => {
      const fileName = item.dataset.fileName;
      if (fileName === this.selectedFile) {
        item.classList.add('selected');
      } else {
        item.classList.remove('selected');
      }
    });
  }


  clearFormArea() {
    const formArea = document.getElementById('formArea');
    if (formArea) {
      formArea.innerHTML = `
        <div class="empty-state">
          <div class="empty-icon">📋</div>
          <h3>Chưa chọn file</h3>
          <p>Vui lòng chọn file từ panel bên phải để bắt đầu nhập dữ liệu</p>
        </div>
      `;
    }
  }


  updateFormStatus() {
    const formStatus = document.getElementById('formStatus');
    if (formStatus) {
      if (this.selectedFolder && this.selectedFile) {
        formStatus.textContent = `Đã chọn: ${this.selectedFile}`;
        formStatus.classList.add('active');
      } else if (this.selectedFolder) {
        formStatus.textContent = 'Đã chọn folder, chọn file';
        formStatus.classList.remove('active');
      } else {
        formStatus.textContent = 'Chưa chọn folder';
        formStatus.classList.remove('active');
      }
    }
  }


  updateExportButton() {
    const exportBtn = document.getElementById('exportBtn');
    if (exportBtn) {
      exportBtn.disabled = !this.selectedFolder || !this.selectedFile || this.isLoading;
    }
  }


  showFormLoading() {
    const formArea = document.getElementById('formArea');
    if (formArea) {
      formArea.innerHTML = `
        <div class="empty-state">
          <div class="loading-spinner"></div>
          <h3>Đang tải form...</h3>
          <p>Vui lòng chờ trong giây lát</p>
        </div>
      `;
    }
  }


  showFormError(message) {
    const formArea = document.getElementById('formArea');
    if (formArea) {
      formArea.innerHTML = `
        <div class="empty-state">
          <div class="empty-icon">❌</div>
          <h3>Lỗi tải form</h3>
          <p>${message}</p>
        </div>
      `;
    }
  }


  showLoading() {
    this.isLoading = true;
    const loadingOverlay = document.getElementById('loadingOverlay');
    if (loadingOverlay) {
      loadingOverlay.style.display = 'flex';
    }
    this.updateExportButton();
  }


  hideLoading() {
    this.isLoading = false;
    const loadingOverlay = document.getElementById('loadingOverlay');
    if (loadingOverlay) {
      loadingOverlay.style.display = 'none';
    }
    this.updateExportButton();
  }


  showSuccess(message) {
    const successModal = document.getElementById('successModal');
    if (successModal) {
      successModal.style.display = 'flex';
    }
  }


  showError(message) {
    const errorModal = document.getElementById('errorModal');
    const errorMessage = document.getElementById('errorMessage');
    if (errorModal) {
      if (errorMessage) {
        errorMessage.textContent = message;
      }
      errorModal.style.display = 'flex';
    }
  }
}

if (typeof window !== 'undefined') {
  window.MainApp = MainApp;
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = MainApp;
}
