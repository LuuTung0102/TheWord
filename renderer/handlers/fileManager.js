(function() {
  class FileManager {
    constructor() {
      this.modal = null;
      this.isInitialized = false;
      this.folders = [];
      this.selectedFolder = null;
      this.files = [];
    }

    /**
     * Initialize và show modal
     */
    async init() {
      if (!this.isInitialized) {
        this.createModal();
        this.isInitialized = true;
      }

      // Load folders
      await this.loadFolders();

      // Render
      this.renderFolderList();

      // Show modal
      this.show();
    }

    /**
     * Load folders từ config
     */
    async loadFolders() {
      try {
        const config = await window.ipcRenderer.invoke("load-main-config");
        if (config && config.folders) {
          this.folders = config.folders;
        } else {
          this.folders = [];
        }
      } catch (error) {
        console.error('❌ Error loading folders:', error);
        this.folders = [];
      }
    }

    /**
     * Load files trong folder
     */
    async loadFilesInFolder(folderPath) {
      try {
        const templatesRoot = await window.ipcRenderer.invoke("get-templates-root");
        const fullPath = `${templatesRoot}\\${folderPath.replace(/\//g, '\\')}`;
        const files = await window.ipcRenderer.invoke("get-files-in-folder", fullPath);
        return files;
      } catch (error) {
        console.error('❌ Error loading files:', error);
        return [];
      }
    }

    /**
     * Tạo modal HTML structure
     */
    createModal() {
      const modalHtml = `
        <div id="fileManagerModal" class="file-manager-modal" style="display: none;">
          <div class="file-manager-overlay"></div>
          <div class="file-manager-container">
            <div class="file-manager-header">
              <h2>📄 Quản lý File Word</h2>
              <button class="file-manager-close" onclick="window.fileManager.hide()">✕</button>
            </div>
            <div class="file-manager-body">
              <div class="file-manager-content">
                <div class="file-manager-sidebar">
                  <div class="file-manager-sidebar-header">
                    <h3>Folders</h3>
                  </div>
                  <div id="folderListContainer" class="folder-list-container">
                    <!-- Folder list will be rendered here -->
                  </div>
                </div>
                <div class="file-manager-main">
                  <div class="file-manager-main-header">
                    <h3 id="currentFolderName">Chọn folder</h3>
                    <button id="addFileBtn" class="file-add-btn" onclick="window.fileManager.handleAddFile()" disabled>
                      ➕ Thêm file
                    </button>
                  </div>
                  <div id="fileListContainer" class="file-list-container">
                    <div class="file-empty-state">
                      <div class="file-empty-state-icon">📁</div>
                      <p>Chọn folder từ danh sách bên trái</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      `;

      document.body.insertAdjacentHTML('beforeend', modalHtml);
      this.modal = document.getElementById('fileManagerModal');
    }

    /**
     * Show modal
     */
    show() {
      if (this.modal) {
        this.modal.style.display = 'block';
      }
    }

    /**
     * Hide modal
     */
    hide() {
      if (this.modal) {
        this.modal.style.display = 'none';
      }
      this.selectedFolder = null;
      this.files = [];
    }

    /**
     * Render folder list
     */
    renderFolderList() {
      const container = document.getElementById('folderListContainer');
      if (!container) return;

      if (this.folders.length === 0) {
        container.innerHTML = `
          <div class="folder-empty-state">
            <p>Không có folder nào</p>
          </div>
        `;
        return;
      }

      const html = this.folders.map(folder => {
        const isSelected = this.selectedFolder && this.selectedFolder.name === folder.name;
        return `
          <div class="folder-list-item ${isSelected ? 'selected' : ''}" onclick="window.fileManager.selectFolder('${folder.name}')">
            <div class="folder-list-icon">${folder.icon || '📁'}</div>
            <div class="folder-list-info">
              <div class="folder-list-name">${folder.name}</div>
              <div class="folder-list-desc">${folder.description || ''}</div>
            </div>
          </div>
        `;
      }).join('');

      container.innerHTML = html;
    }

    /**
     * Select folder
     */
    async selectFolder(folderName) {
      const folder = this.folders.find(f => f.name === folderName);
      if (!folder) return;

      this.selectedFolder = folder;
      this.files = await this.loadFilesInFolder(folder.path);

      // Update UI
      this.renderFolderList();
      this.renderFileList();
      
      // Enable add button
      const addBtn = document.getElementById('addFileBtn');
      if (addBtn) addBtn.disabled = false;

      // Update header
      const headerName = document.getElementById('currentFolderName');
      if (headerName) headerName.textContent = folder.name;
    }

    /**
     * Render file list
     */
    renderFileList() {
      const container = document.getElementById('fileListContainer');
      if (!container) return;

      if (!this.selectedFolder) {
        container.innerHTML = `
          <div class="file-empty-state">
            <div class="file-empty-state-icon">📁</div>
            <p>Chọn folder từ danh sách bên trái</p>
          </div>
        `;
        return;
      }

      if (this.files.length === 0) {
        container.innerHTML = `
          <div class="file-empty-state">
            <div class="file-empty-state-icon">📄</div>
            <p>Chưa có file nào trong folder này</p>
            <p class="file-empty-hint">Nhấn "Thêm file" để thêm file Word</p>
          </div>
        `;
        return;
      }

      const html = this.files.map(fileName => {
        return `
          <div class="file-item-card">
            <div class="file-item-icon">📄</div>
            <div class="file-item-info">
              <div class="file-item-name">${fileName}</div>
            </div>
            <div class="file-item-actions">
              <button class="file-item-btn file-open-btn" onclick="window.fileManager.handleOpenFile('${fileName}')" title="Mở file">
                👁️
              </button>
              <button class="file-item-btn file-delete-btn" onclick="window.fileManager.handleDeleteFile('${fileName}')" title="Xóa file">
                🗑️
              </button>
            </div>
          </div>
        `;
      }).join('');

      container.innerHTML = html;
    }

    /**
     * Handle add file
     */
    async handleAddFile() {
      if (!this.selectedFolder) {
        alert('❌ Vui lòng chọn folder trước');
        return;
      }

      try {
        // Tạo input file element
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = '.docx';
        input.multiple = false;

        input.onchange = async (e) => {
          const file = e.target.files[0];
          if (!file) return;

          // Validate file type
          if (!file.name.endsWith('.docx')) {
            alert('❌ Chỉ chấp nhận file .docx');
            return;
          }

          try {
            // Read file as buffer
            const arrayBuffer = await file.arrayBuffer();
            const buffer = Array.from(new Uint8Array(arrayBuffer));

            // Save to temp
            const tempPath = await window.ipcRenderer.invoke('save-temp-file', {
              buffer: buffer,
              fileName: file.name
            });

            // Upload to templates folder
            const templatesRoot = await window.ipcRenderer.invoke("get-templates-root");
            const targetFolder = `${templatesRoot}\\${this.selectedFolder.path.replace(/\//g, '\\')}`;
            
            // Copy file
            const finalFileName = await window.ipcRenderer.invoke('copy-file-to-folder', {
              sourcePath: tempPath,
              targetFolder: targetFolder,
              fileName: file.name
            });

            if (finalFileName) {
              alert(`✅ Đã thêm file: ${finalFileName}`);
              // Reload files
              this.files = await this.loadFilesInFolder(this.selectedFolder.path);
              this.renderFileList();
            }
          } catch (error) {
            console.error('❌ Error adding file:', error);
            alert('❌ Không thể thêm file. Vui lòng thử lại.');
          }
        };

        input.click();
      } catch (error) {
        console.error('❌ Error in handleAddFile:', error);
        alert('❌ Đã xảy ra lỗi');
      }
    }

    /**
     * Handle open file
     */
    async handleOpenFile(fileName) {
      if (!this.selectedFolder) return;

      try {
        const templatesRoot = await window.ipcRenderer.invoke("get-templates-root");
        const filePath = `${templatesRoot}\\${this.selectedFolder.path.replace(/\//g, '\\')}\\${fileName}`;
        
        await window.ipcRenderer.invoke('open-file-path', filePath);
      } catch (error) {
        console.error('❌ Error opening file:', error);
        alert('❌ Không thể mở file');
      }
    }

    /**
     * Handle delete file
     */
    async handleDeleteFile(fileName) {
      if (!this.selectedFolder) return;

      const confirmed = confirm(`⚠️ Bạn có chắc muốn xóa file "${fileName}"?\n\nFile sẽ bị xóa vĩnh viễn và không thể khôi phục.`);
      
      if (!confirmed) return;

      try {
        const templatesRoot = await window.ipcRenderer.invoke("get-templates-root");
        const filePath = `${templatesRoot}\\${this.selectedFolder.path.replace(/\//g, '\\')}\\${fileName}`;
        
        const result = await window.ipcRenderer.invoke('delete-file-path', filePath);
        
        if (result.success) {
          alert('✅ Đã xóa file thành công');
          // Reload files
          this.files = await this.loadFilesInFolder(this.selectedFolder.path);
          this.renderFileList();
        } else {
          alert('❌ Không thể xóa file');
        }
      } catch (error) {
        console.error('❌ Error deleting file:', error);
        alert('❌ Không thể xóa file');
      }
    }
  }

  // Initialize và attach vào window
  if (typeof window !== 'undefined') {
    window.fileManager = new FileManager();
    console.log('✅ FileManager initialized');
  }
})();
