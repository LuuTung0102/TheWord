// ========================================
// MAIN APP - Quản lý giao diện chính v4.0
// ========================================

class MainApp {
  constructor() {
    this.selectedFolder = null;
    this.selectedFile = null;
    this.expandedFolder = null; // Track which folder is expanded
    this.templates = [];
    this.files = [];
    this.formData = {};
    this.isLoading = false;
  }

  /**
   * Khởi tạo ứng dụng
   */
  async init() {
    console.log('🚀 MainApp: Initializing...');
    
    try {
      // Load templates
      await this.loadTemplates();
      
      // Setup event listeners
      this.setupEventListeners();
      
      // Update UI
      this.updateUI();
      
      console.log('✅ MainApp: Initialized successfully');
    } catch (error) {
      console.error('❌ MainApp: Initialization failed:', error);
      this.showError('Không thể khởi tạo ứng dụng');
    }
  }

  /**
   * Load templates từ config.json
   */
  async loadTemplates() {
    try {
      console.log('📁 MainApp: Loading templates from config...');
      
      // Load config from renderer/config/config.json
      const config = await this.loadMainConfig();
      
      if (config && config.folders) {
        // Load templates từ config.folders
        this.templates = await Promise.all(config.folders.map(async (folderConfig) => {
          try {
            const templatesRoot = await window.ipcRenderer.invoke("get-templates-root");
            // ✅ Sửa lại: Thêm dấu \ giữa templatesRoot và folderConfig.path
            const folderPath = `${templatesRoot}\\${folderConfig.path.replace(/\//g, '\\')}`;
            console.log(`🔍 MainApp: Checking folder path: ${folderPath}`);
            
            // Check if folder exists and get files
            const folderExists = await window.ipcRenderer.invoke("check-folder-exists", folderPath);
            if (!folderExists) {
              console.warn(`⚠️ MainApp: Folder not found: ${folderConfig.path}`);
              return null;
            }
            
            // Get files in folder
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
        
        // Filter out null results
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

  /**
   * Load main config from renderer/config/config.json
   */
  async loadMainConfig() {
    try {
      if (window.ipcRenderer) {
        return await window.ipcRenderer.invoke("load-main-config");
      } else {
        // Fallback for development
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

  /**
   * Get folder icon from config
   */
  getFolderIcon(folderConfig) {
    // Try to get icon from folder config first
    if (folderConfig.icon) {
      return folderConfig.icon;
    }
    
    // Fallback to default icon
    return '📁';
  }

  /**
   * Setup event listeners
   */
  setupEventListeners() {
    // Export button
    const exportBtn = document.getElementById('exportBtn');
    if (exportBtn) {
      exportBtn.addEventListener('click', () => this.handleExport());
    }

    // Template selection (will be added dynamically)
    this.setupTemplateListeners();
  }

  /**
   * Setup template selection listeners
   */
  setupTemplateListeners() {
    const templateList = document.getElementById('templateList');
    if (!templateList) return;

    // Remove existing listeners
    templateList.removeEventListener('click', this.handleTemplateClick);
    
    // Add new listener
    this.handleTemplateClick = (event) => {
      const folderItem = event.target.closest('.folder-item');
      if (!folderItem) return;

      const templateName = folderItem.dataset.templateName;
      this.selectFolder(templateName);
    };

    templateList.addEventListener('click', this.handleTemplateClick);
  }

  /**
   * Select folder (toggle expansion)
   */
  async selectFolder(folderName) {
    try {
      console.log('📁 MainApp: Toggling folder:', folderName);
      
      // Toggle expansion
      if (this.expandedFolder === folderName) {
        // Collapse folder
        this.expandedFolder = null;
        this.selectedFolder = null;
        this.selectedFile = null;
        this.files = [];
      } else {
        // Expand folder
        this.expandedFolder = folderName;
        this.selectedFolder = folderName;
        this.selectedFile = null; // Reset selected file
        
        // Load files in this folder
        await this.loadFilesInFolder(folderName);
      }
      
      // Update UI
      this.updateFolderSelection();
      this.updateFormStatus();
      this.renderTemplates(); // Re-render to show/hide files
      
      // Clear form area if collapsed
      if (!this.expandedFolder) {
        this.clearFormArea();
      }
      
      // Update export button
      this.updateExportButton();
      
    } catch (error) {
      console.error('❌ MainApp: Error toggling folder:', error);
      this.showError('Không thể tải files trong folder này');
    }
  }

  /**
   * Select file
   */
  async selectFile(fileName) {
    try {
      console.log('📄 MainApp: Selecting file:', fileName);
      
      // Update selected file
      this.selectedFile = fileName;
      
      // Update UI
      this.updateFileSelection();
      this.updateFormStatus();
      
      // Load form for this file
      await this.loadFormForFile(fileName);
      
      // Enable export button
      this.updateExportButton();
      
    } catch (error) {
      console.error('❌ MainApp: Error selecting file:', error);
      this.showError('Không thể tải form cho file này');
    }
  }

  /**
   * Load files in selected folder
   */
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

  /**
   * Load form for selected file
   */
  async loadFormForFile(fileName) {
    try {
      console.log('📝 MainApp: Loading form for file:', fileName);
      
      // Show loading state
      this.showFormLoading();
      
      // Get templates root path
      const templatesRoot = window.ipcRenderer ? 
        await window.ipcRenderer.invoke("get-templates-root") : 
        'templates';
      
      // ✅ Use path from template config instead of folder name
      const selectedTemplate = this.templates.find(t => t.name === this.selectedFolder);
      if (!selectedTemplate) {
        throw new Error(`Template not found: ${this.selectedFolder}`);
      }
      
      // ✅ Sửa lại: Thêm dấu \ giữa templatesRoot và selectedTemplate.path
      const folderPath = `${templatesRoot}\\${selectedTemplate.path.replace(/\//g, '\\')}`;
      console.log(`🔍 MainApp: Loading form for file in path: ${folderPath}`);
      
      // Load placeholders for this specific file
      const placeholders = await this.loadPlaceholdersForFile(folderPath, fileName);
      
      // Load folder config to determine which template/group this file belongs to
      const folderConfig = await this.loadConfig(folderPath);
      
      if (folderConfig && folderConfig.templates) {
        // Find which template this file belongs to based on placeholders
        const matchedTemplate = this.findMatchingTemplate(placeholders, folderConfig.templates, fileName);
        
        if (matchedTemplate) {
          console.log('📝 MainApp: File matches template:', matchedTemplate.id);
          
          // Build filtered config limited to matched template groups
          const filteredConfig = this.buildFilteredConfig(folderConfig, matchedTemplate);
          
          // Render form using the matched template's groups
          if (window.renderGenericForm) {
            await window.renderGenericForm(placeholders, filteredConfig, folderPath);
          } else if (window.renderForm) {
            window.renderForm(placeholders);
          } else {
            throw new Error('No form renderer available');
          }
        } else {
          console.warn('⚠️ MainApp: No template matches for file:', fileName);
          // Fallback to generic form
          if (window.renderForm) {
            window.renderForm(placeholders);
          } else {
            throw new Error('No form renderer available');
          }
        }
      } else {
        // Fallback if no config
        if (window.renderForm) {
          window.renderForm(placeholders);
        } else {
          throw new Error('No form renderer available');
        }
      }
      
      console.log('✅ MainApp: Form loaded successfully');
      
    } catch (error) {
      console.error('❌ MainApp: Error loading form:', error);
      this.showFormError('Không thể tải form');
    }
  }

  /**
   * Find matching template based on filename and placeholders
   */
  findMatchingTemplate(placeholders, templates, fileName) {
    console.log('🔍 MainApp: Finding matching template for file:', fileName);
    console.log('🔍 MainApp: File placeholders:', placeholders);
    
    // First try to match by filename
    for (const template of templates) {
      if (template.filename === fileName) {
        console.log(`✅ MainApp: Exact filename match found: ${template.id}`);
        console.log(`✅ MainApp: Template groups:`, template.groups);
        return template;
      }
    }
    
    // If no exact filename match, try placeholder matching
    console.log('⚠️ MainApp: No exact filename match, trying placeholder-based matching...');
    
    const filePlaceholdersSet = new Set(placeholders);
    let bestMatch = null;
    let bestScore = 0;
    
    for (const template of templates) {
      if (template.placeholders) {
        // Get all placeholders from this template
        const templatePlaceholders = new Set();
        Object.values(template.placeholders).forEach(groupPlaceholders => {
          groupPlaceholders.forEach(ph => templatePlaceholders.add(ph));
        });
        
        // Check if file placeholders match template placeholders
        const intersection = new Set([...filePlaceholdersSet].filter(ph => templatePlaceholders.has(ph)));
        
        // Calculate match percentage
        const matchPercentage = intersection.size / filePlaceholdersSet.size;
        
        console.log(`🔍 MainApp: Template ${template.id} (${template.filename})`);
        console.log(`   Groups: ${template.groups.join(', ')}`);
        console.log(`   Match: ${intersection.size}/${filePlaceholdersSet.size} (${(matchPercentage * 100).toFixed(1)}%)`);
        console.log(`   Missing:`, [...filePlaceholdersSet].filter(ph => !templatePlaceholders.has(ph)));
        
        if (matchPercentage > bestScore) {
          bestScore = matchPercentage;
          bestMatch = template;
        }
      }
    }
    
    // If match percentage is high enough (>70%), consider it a match
    if (bestMatch && bestScore > 0.7) {
      console.log(`✅ MainApp: Best match found: ${bestMatch.id} with score ${(bestScore * 100).toFixed(1)}%`);
      return bestMatch;
    }
    
    console.log('❌ MainApp: No template matches found (best score:', (bestScore * 100).toFixed(1), '%)');
    return null;
  }

  /**
   * Build filtered config with only matched template's groups
   */
  buildFilteredConfig(folderConfig, matchedTemplate) {
    try {
      const allowedGroups = new Set(matchedTemplate.groups || []);
      const filtered = JSON.parse(JSON.stringify(folderConfig));

      // Filter groups array to only include matched groups in correct order
      if (Array.isArray(filtered.groups)) {
        filtered.groups = filtered.groups.filter(g => allowedGroups.has(g.id));
      }

      // Optionally, could filter fieldMappings to only those referencing allowed groups
      if (Array.isArray(filtered.fieldMappings)) {
        filtered.fieldMappings = filtered.fieldMappings.filter(m => allowedGroups.has(m.group));
      }

      return filtered;
    } catch (e) {
      console.error('❌ MainApp: Error building filtered config:', e);
      return folderConfig;
    }
  }

  /**
   * Load placeholders for specific file
   */
  async loadPlaceholdersForFile(folderPath, fileName) {
    try {
      if (window.ipcRenderer) {
        return await window.ipcRenderer.invoke("get-file-placeholders", folderPath, fileName);
      } else {
        // Fallback for development
        return ['Name1', 'Name2', 'Name7', 'Date1', 'Date2', 'Date7', 'CCCD1', 'CCCD2', 'CCCD7'];
      }
    } catch (error) {
      console.error('❌ MainApp: Error loading placeholders for file:', error);
      return [];
    }
  }

  /**
   * Load placeholders for template
   */
  async loadPlaceholders(folderPath) {
    try {
      if (window.ipcRenderer) {
        return await window.ipcRenderer.invoke("get-template-placeholders", folderPath);
      } else {
        // Fallback for development
        return ['Name1', 'Name2', 'Name7', 'Date1', 'Date2', 'Date7', 'CCCD1', 'CCCD2', 'CCCD7'];
      }
    } catch (error) {
      console.error('❌ MainApp: Error loading placeholders:', error);
      return [];
    }
  }

  /**
   * Load config for template
   */
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

  /**
   * Handle export
   */
  async handleExport() {
    if (!this.selectedFolder || !this.selectedFile) {
      this.showError('Vui lòng chọn folder và file trước');
      return;
    }

    try {
      console.log('📤 MainApp: Starting export...');
      
      this.showLoading();
      
      // Collect form data
      const formData = this.collectFormData();
      
      // ✅ Save to session storage for reuse
      if (window.sessionStorageManager && this.selectedFile) {
        window.sessionStorageManager.saveFormData(this.selectedFile, formData);
        console.log(`💾 Saved session data for: ${this.selectedFile}`);
      }
      
      // ✅ Get folder path from template config
      const selectedTemplate = this.templates.find(t => t.name === this.selectedFolder);
      if (!selectedTemplate) {
        throw new Error(`Template not found: ${this.selectedFolder}`);
      }
      
      // Export
      if (window.ipcRenderer) {
        const result = await window.ipcRenderer.invoke("export-single-document", {
          folderPath: selectedTemplate.path,
          fileName: this.selectedFile,
          formData: formData
        });
        
        if (result.success) {
          this.showSuccess('Văn bản đã được tạo thành công!');
        } else {
          throw new Error(result.error || 'Export failed');
        }
      } else {
        // Fallback for development
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

  /**
   * Collect form data
   */
  collectFormData() {
    try {
      // Try generic form data collector first
      if (window.collectGenericFormData && window.idToPhGeneric && Object.keys(window.idToPhGeneric).length > 0) {
        return window.collectGenericFormData();
      }
      
      // Fallback to standard form data collector
      if (window.collectFormData) {
        return window.collectFormData();
      }
      
      // Manual collection
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

  /**
   * Update UI
   */
  updateUI() {
    this.renderTemplates();
    this.updateTemplateCount();
    this.updateFormStatus();
    this.updateExportButton();
  }

  /**
   * Render files list
   */
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

    // Setup file listeners
    this.setupFileListeners();
  }

  /**
   * Setup file click listeners
   */
  setupFileListeners() {
    const fileItems = document.querySelectorAll('.file-item[data-file-name]');
    fileItems.forEach(item => {
      item.addEventListener('click', (event) => {
        event.stopPropagation(); // Prevent folder click
        const fileName = item.dataset.fileName;
        this.selectFile(fileName);
      });
    });
  }

  /**
   * Render templates list
   */
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

    // Setup listeners
    this.setupTemplateListeners();
    this.setupFileListeners();
  }


  /**
   * Update template selection UI
   */
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

  /**
   * Update template count
   */
  updateTemplateCount() {
    const templateCount = document.getElementById('templateCount');
    if (templateCount) {
      templateCount.textContent = this.templates.length;
    }
  }

  /**
   * Update folder selection UI
   */
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

  /**
   * Update file selection UI
   */
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

  /**
   * Clear form area
   */
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

  /**
   * Update form status
   */
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

  /**
   * Update export button
   */
  updateExportButton() {
    const exportBtn = document.getElementById('exportBtn');
    if (exportBtn) {
      exportBtn.disabled = !this.selectedFolder || !this.selectedFile || this.isLoading;
    }
  }

  /**
   * Show form loading state
   */
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

  /**
   * Show form error
   */
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

  /**
   * Show loading overlay
   */
  showLoading() {
    this.isLoading = true;
    const loadingOverlay = document.getElementById('loadingOverlay');
    if (loadingOverlay) {
      loadingOverlay.style.display = 'flex';
    }
    this.updateExportButton();
  }

  /**
   * Hide loading overlay
   */
  hideLoading() {
    this.isLoading = false;
    const loadingOverlay = document.getElementById('loadingOverlay');
    if (loadingOverlay) {
      loadingOverlay.style.display = 'none';
    }
    this.updateExportButton();
  }

  /**
   * Show success modal
   */
  showSuccess(message) {
    const successModal = document.getElementById('successModal');
    if (successModal) {
      successModal.style.display = 'flex';
    }
  }

  /**
   * Show error modal
   */
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

// Export
if (typeof window !== 'undefined') {
  window.MainApp = MainApp;
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = MainApp;
}
