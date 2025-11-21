(function() {
  const BaseModal = window.BaseModal;
  if (!BaseModal) {
    return;
  }

  class FileManager extends BaseModal {
    constructor() {
      super({
        modalId: 'fileManagerModal',
        modalClass: 'file-manager-modal',
        title: '📄 Quản lý File Word'
      });
      this.folders = [];
      this.selectedFolder = null;
      this.files = [];
    }

    async onInit() {
      await this.loadFolders();
      this.renderFolderList();
    }

    async loadFolders() {
      try {
        const config = await window.ipcRenderer.invoke("load-main-config");
        if (config && config.folders) {
          this.folders = config.folders;
        } else {
          this.folders = [];
        }
      } catch (error) {
        this.folders = [];
      }
    }

    async loadFilesInFolder(folderPath) {
      try {
        const templatesRoot = await window.ipcRenderer.invoke("get-templates-root");
        const fullPath = `${templatesRoot}\\${folderPath.replace(/\//g, '\\')}`;
        const files = await window.ipcRenderer.invoke("get-files-in-folder", fullPath);
        return files;
      } catch (error) {
        return [];
      }
    }

    getModalBodyHTML() {
      return `
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
              <button id="addFileBtn" class="file-add-btn" disabled>
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
      `;
    }

    setupCustomEventListeners() {
      const addFileBtn = this.querySelector('#addFileBtn');
      if (addFileBtn) {
        this.addEventListener(addFileBtn, 'click', () => this.handleAddFile());
      }

      const folderContainer = this.querySelector('#folderListContainer');
      if (folderContainer) {
        this.addDelegatedListener(folderContainer, '.folder-list-item', 'click', function(e) {
          const folderName = this.getAttribute('data-folder-name');
          if (folderName) {
            window.fileManager.selectFolder(folderName);
          }
        });
      }

      const fileContainer = this.querySelector('#fileListContainer');
      if (fileContainer) {
        this.addDelegatedListener(fileContainer, '.file-open-btn', 'click', function(e) {
          const fileName = this.getAttribute('data-file-name');
          if (fileName) {
            window.fileManager.handleOpenFile(fileName);
          }
        });

        this.addDelegatedListener(fileContainer, '.file-delete-btn', 'click', function(e) {
          const fileName = this.getAttribute('data-file-name');
          if (fileName) {
            window.fileManager.handleDeleteFile(fileName);
          }
        });
      }
    }

    onCleanup() {
      this.selectedFolder = null;
      this.files = [];
    }

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
          <div class="folder-list-item ${isSelected ? 'selected' : ''}" data-folder-name="${folder.name}">
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

    async selectFolder(folderName) {
      const folder = this.folders.find(f => f.name === folderName);
      if (!folder) return;

      this.selectedFolder = folder;
      this.files = await this.loadFilesInFolder(folder.path);

      this.renderFolderList();
      this.renderFileList();
      
      const addBtn = document.getElementById('addFileBtn');
      if (addBtn) addBtn.disabled = false;

      const headerName = document.getElementById('currentFolderName');
      if (headerName) headerName.textContent = folder.name;
    }

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
              <button class="file-item-btn file-open-btn" data-file-name="${fileName}" title="Mở file">
                👁️
              </button>
              <button class="file-item-btn file-delete-btn" data-file-name="${fileName}" title="Xóa file">
                🗑️
              </button>
            </div>
          </div>
        `;
      }).join('');

      container.innerHTML = html;
    }

    async handleAddFile() {
      if (!this.selectedFolder) {
        alert('❌ Vui lòng chọn folder trước');
        return;
      }

      try {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = '.docx';
        input.multiple = false;

        input.onchange = async (e) => {
          const file = e.target.files[0];
          if (!file) return;

          if (!file.name.endsWith('.docx')) {
            alert('❌ Chỉ chấp nhận file .docx');
            return;
          }

          try {
            const arrayBuffer = await file.arrayBuffer();
            const buffer = Array.from(new Uint8Array(arrayBuffer));

            const tempPath = await window.ipcRenderer.invoke('save-temp-file', {
              buffer: buffer,
              fileName: file.name
            });

            const templatesRoot = await window.ipcRenderer.invoke("get-templates-root");
            const targetFolder = `${templatesRoot}\\${this.selectedFolder.path.replace(/\//g, '\\')}`;
            
            const finalFileName = await window.ipcRenderer.invoke('copy-file-to-folder', {
              sourcePath: tempPath,
              targetFolder: targetFolder,
              fileName: file.name
            });

            if (finalFileName) {
              await this.showConfigWizard(finalFileName);
              
              this.files = await this.loadFilesInFolder(this.selectedFolder.path);
              this.renderFileList();
            }
          } catch (error) {
            alert('❌ Không thể thêm file. Vui lòng thử lại.');
          }
        };

        input.click();
      } catch (error) {
        alert('❌ Đã xảy ra lỗi');
      }
    }

    async handleOpenFile(fileName) {
      if (!this.selectedFolder) return;

      try {
        const templatesRoot = await window.ipcRenderer.invoke("get-templates-root");
        const filePath = `${templatesRoot}\\${this.selectedFolder.path.replace(/\//g, '\\')}\\${fileName}`;
        
        await window.ipcRenderer.invoke('open-file-path', filePath);
      } catch (error) {
        alert('❌ Không thể mở file');
      }
    }

    async showConfigWizard(fileName) {
      alert(`✅ File "${fileName}" đã được thêm thành công!\n\nBạn có thể cấu hình template này sau.`);
      return Promise.resolve();
    }

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
          this.files = await this.loadFilesInFolder(this.selectedFolder.path);
          this.renderFileList();
        } else {
          alert('❌ Không thể xóa file');
        }
      } catch (error) {
        alert('❌ Không thể xóa file');
      }
    }
  }

  if (typeof window !== 'undefined') {
    window.fileManager = new FileManager();
  }
})();
