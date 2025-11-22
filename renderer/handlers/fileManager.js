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
            alert(
              '❌ Lỗi: Định dạng file không hợp lệ\n\n' +
              'Chỉ chấp nhận file Word định dạng .docx\n\n' +
              `File được chọn: ${file.name}`
            );
            return;
          }

          const maxSize = 10 * 1024 * 1024; 
          if (file.size > maxSize) {
            alert(
              '❌ Lỗi: File quá lớn\n\n' +
              `File "${file.name}" có kích thước ${(file.size / 1024 / 1024).toFixed(2)}MB\n\n` +
              'Kích thước tối đa cho phép: 10MB'
            );
            return;
          }

          try {
            const arrayBuffer = await file.arrayBuffer();
            const buffer = Array.from(new Uint8Array(arrayBuffer));
            let tempPath = null;
            try {
              tempPath = await window.ipcRenderer.invoke('save-temp-file', {
                buffer: buffer,
                fileName: file.name
              });
            } catch (tempError) {
              console.error('Failed to save temp file:', tempError);
              throw new Error(`Không thể lưu file tạm: ${tempError.message}`);
            }

            if (!tempPath) {
              throw new Error('Không nhận được đường dẫn file tạm từ hệ thống');
            }
            
            await this.showConfigWizard(file.name, tempPath);
          } catch (error) {
            console.error('Error adding file:', error);
            alert(
              '❌ Không thể thêm file\n\n' +
              `${error.message}\n\n` +
              'Vui lòng thử lại.'
            );
          }
        };

        input.click();
      } catch (error) {
        console.error('Error in handleAddFile:', error);
        alert(
          '❌ Đã xảy ra lỗi\n\n' +
          `${error.message}\n\n` +
          'Vui lòng thử lại.'
        );
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

    async showConfigWizard(fileName, tempFilePath) {
      try {
        if (!this.selectedFolder) {
          alert('❌ Không có folder nào được chọn');
          return;
        }

        const templatesRoot = await window.ipcRenderer.invoke("get-templates-root");
        const folderPath = `${templatesRoot}\\${this.selectedFolder.path.replace(/\//g, '\\')}`;
        const filePath = tempFilePath;
        if (!tempFilePath) {
          throw new Error('Temp file path is missing');
        }

        const analyzer = new window.PlaceholderAnalyzer();
        const analysis = await analyzer.analyzePlaceholders(filePath);
        if (!analysis.placeholders || analysis.placeholders.length === 0) {
          const proceed = confirm(
            `⚠️ Cảnh báo: File không có placeholder\n\n` +
            `File "${fileName}" không chứa placeholder nào.\n\n` +
            `Bạn có muốn tiếp tục tạo cấu hình không?\n\n` +
            `(Nhấn OK để tiếp tục, Cancel để hủy)`
          );
          
          if (!proceed) {
            alert('ℹ️ Đã hủy thêm file');
            return;
          }
        }

        const configManager = window.configManager;
        let existingConfig = null;
        
        try {
          existingConfig = await configManager.readConfig(folderPath);
        } catch (error) {
          console.error('Error reading config:', error);
          alert(
            `❌ Lỗi: Không tìm thấy config.json\n\n` +
            `Không tìm thấy file config.json trong folder "${this.selectedFolder.name}".\n\n` +
            `Vui lòng tạo config.json trước khi thêm file Word.\n\n` +
            `Chi tiết lỗi: ${error.message}`
          );
          return;
        }

        if (!existingConfig) {
          alert(
            `❌ Lỗi: Config không hợp lệ\n\n` +
            `File config.json trong folder "${this.selectedFolder.name}" không hợp lệ hoặc rỗng.\n\n` +
            `Vui lòng kiểm tra lại file config.json.`
          );
          return;
        }

        if (!existingConfig.groups || !Array.isArray(existingConfig.groups)) {
          alert(
            `❌ Lỗi: Config không đầy đủ\n\n` +
            `File config.json thiếu thông tin "groups".\n\n` +
            `Vui lòng kiểm tra lại cấu trúc file config.json.`
          );
          return;
        }

        const existingTemplate = existingConfig.templates?.find(t => t.filename === fileName);
        if (existingTemplate) {
          const overwrite = confirm(
            `⚠️ Cảnh báo: File đã tồn tại\n\n` +
            `File "${fileName}" đã có cấu hình trong config.json.\n\n` +
            `Bạn có muốn cập nhật cấu hình hiện tại không?\n\n` +
            `(Nhấn OK để cập nhật, Cancel để giữ nguyên cấu hình cũ)`
          );
          
          if (!overwrite) {
            alert('ℹ️ Đã giữ nguyên cấu hình cũ');
            this.files = await this.loadFilesInFolder(this.selectedFolder.path);
            this.renderFileList();
            return;
          }
        }

        const generator = new window.ConfigGenerator();
        
        if (!analysis || typeof analysis !== 'object') {
          throw new Error('Invalid analysis result from PlaceholderAnalyzer');
        }
        
        const templateEntry = generator.generateTemplateEntry(
          fileName,
          analysis,
          existingConfig
        );

        if (!templateEntry || typeof templateEntry !== 'object') {
          throw new Error('Failed to generate template entry');
        }

        const autoCreatedSubgroups = templateEntry._metadata?.autoCreatedSubgroups || []; 
        const wizard = window.configWizard;
        const result = await wizard.open(
          fileName,
          templateEntry,
          autoCreatedSubgroups,
          folderPath,
          existingConfig
        );

        if (result) {
          const { templateEntry: updatedTemplateEntry, updatedFieldMappings, newGroups } = result;
          
          try {
            const targetFolder = `${templatesRoot}\\${this.selectedFolder.path.replace(/\//g, '\\')}`;
            
            let finalFileName = null;
            try {
              finalFileName = await window.ipcRenderer.invoke('copy-file-to-folder', {
                sourcePath: tempFilePath,
                targetFolder: targetFolder,
                fileName: fileName
              });
            } catch (copyError) {
              console.error('Failed to copy file:', copyError);
              throw new Error(`Không thể copy file vào folder: ${copyError.message}`);
            }

            if (!finalFileName) {
              throw new Error('Copy file thất bại: Không nhận được tên file từ hệ thống');
            }

            const existingTemplateIndex = existingConfig.templates.findIndex(
              t => t.filename === fileName
            );

            if (existingTemplateIndex !== -1) {
              existingConfig.templates[existingTemplateIndex] = updatedTemplateEntry;
            } else {
              existingConfig.templates.push(updatedTemplateEntry);
            }

            if (updatedFieldMappings && updatedFieldMappings.length > 0) {
              for (const updatedMapping of updatedFieldMappings) {
                const existingMappingIndex = existingConfig.fieldMappings.findIndex(
                  fm => fm.group === updatedMapping.group
                );

                if (existingMappingIndex !== -1) {
                  const existingMapping = existingConfig.fieldMappings[existingMappingIndex];
                  const existingSubgroupIds = existingMapping.subgroups.map(sg => sg.id);
                  const newSubgroups = updatedMapping.subgroups.filter(
                    sg => !existingSubgroupIds.includes(sg.id)
                  );

                  if (newSubgroups.length > 0) {
                    existingMapping.subgroups.push(...newSubgroups);
                    if (updatedMapping.suffixes) {
                      existingMapping.suffixes = updatedMapping.suffixes;
                    }
                  }
                } else {
                  existingConfig.fieldMappings.push(updatedMapping);
                }
              }
            }

            if (newGroups && Object.keys(newGroups).length > 0) {
              for (const [groupId, groupInfo] of Object.entries(newGroups)) {
                const groupExists = existingConfig.groups.find(g => g.id === groupId);
                
                if (!groupExists) {
                  existingConfig.groups.push(groupInfo);
                }
              }
            }

            await configManager.writeConfig(folderPath, existingConfig);
            this.files = await this.loadFilesInFolder(this.selectedFolder.path);
            this.renderFileList();
            
            // Notify mainApp to refresh
            if (window.mainAppInstance) {
              // Refresh files in folder
              if (typeof window.mainAppInstance.loadFilesInFolder === 'function') {
                await window.mainAppInstance.loadFilesInFolder(this.selectedFolder.name);
              }
              
              // Reload all templates
              if (typeof window.mainAppInstance.loadTemplates === 'function') {
                await window.mainAppInstance.loadTemplates();
              }
              
              // Re-render UI
              if (typeof window.mainAppInstance.renderFiles === 'function') {
                window.mainAppInstance.renderFiles();
              }
            } else {
              // Fallback: dispatch custom event
              window.dispatchEvent(new CustomEvent('templates-updated', { 
                detail: { folderName: this.selectedFolder.name } 
              }));
            }
            
            alert(`✅ File "${fileName}" đã được thêm và cấu hình thành công!`);
          } catch (error) {
            console.error('Failed to copy file or save config:', error);
            let errorMessage = '❌ Lỗi: Không thể lưu file\n\n';
            
            if (error.message.includes('copy file')) {
              errorMessage += `Không thể copy file "${fileName}" vào folder.\n\n`;
              errorMessage += 'Nguyên nhân có thể:\n';
              errorMessage += '- File đang được mở bởi ứng dụng khác\n';
              errorMessage += '- Không có quyền ghi vào folder\n';
              errorMessage += '- Không đủ dung lượng đĩa\n\n';
            } else if (error.message.includes('config')) {
              errorMessage += `Không thể lưu cấu hình vào config.json.\n\n`;
              errorMessage += 'File đã được copy nhưng cấu hình chưa được lưu.\n\n';
            } else {
              errorMessage += `${error.message}\n\n`;
            }
            
            errorMessage += 'Cấu hình không được lưu. Vui lòng thử lại.';
            
            alert(errorMessage);
          }
        } else {
          this.files = await this.loadFilesInFolder(this.selectedFolder.path);
          this.renderFileList();
          
          // Notify mainApp to refresh (in case file was copied before cancel)
          if (window.mainAppInstance && typeof window.mainAppInstance.loadFilesInFolder === 'function') {
            await window.mainAppInstance.loadFilesInFolder(this.selectedFolder.name);
          }
          
          alert(`ℹ️ Đã hủy thêm file "${fileName}"`);
        }
      } catch (error) {
        console.error('Error in showConfigWizard:', error);
        
        let errorMessage = '❌ Đã xảy ra lỗi\n\n';
        
        if (error.message.includes('config.json')) {
          errorMessage += 'Lỗi liên quan đến file config.json.\n';
          errorMessage += 'Vui lòng kiểm tra file config.json có tồn tại và hợp lệ.\n\n';
        } else if (error.message.includes('placeholder')) {
          errorMessage += 'Lỗi khi phân tích placeholders trong file Word.\n';
          errorMessage += 'Vui lòng kiểm tra file Word có đúng định dạng.\n\n';
        } else if (error.message.includes('temp')) {
          errorMessage += 'Lỗi khi xử lý file tạm.\n';
          errorMessage += 'Vui lòng thử lại.\n\n';
        } else {
          errorMessage += `${error.message}\n\n`;
        }
        
        errorMessage += 'Chi tiết lỗi đã được ghi vào console.';
        
        alert(errorMessage);
        
        try {
          this.files = await this.loadFilesInFolder(this.selectedFolder.path);
          this.renderFileList();
        } catch (reloadError) {
          console.error('Error reloading file list:', reloadError);
        }
      }
    }

    async handleDeleteFile(fileName) {
      if (!this.selectedFolder) {
        alert('❌ Không có folder nào được chọn');
        return;
      }

      const confirmed = confirm(
        `⚠️ Bạn có chắc muốn xóa file "${fileName}"?\n\n` +
        `File sẽ bị xóa vĩnh viễn và không thể khôi phục.\n` +
        `Cấu hình trong config.json cũng sẽ bị xóa.`
      );
      
      if (!confirmed) return;

      try {
        const templatesRoot = await window.ipcRenderer.invoke("get-templates-root");
        const folderPath = `${templatesRoot}\\${this.selectedFolder.path.replace(/\//g, '\\')}`;
        const filePath = `${folderPath}\\${fileName}`;
        const deleteResult = await window.ipcRenderer.invoke('delete-file-path', filePath);
        
        if (!deleteResult.success) {
          alert(`❌ Không thể xóa file: ${deleteResult.error || 'Lỗi không xác định'}`);
          return;
        }

        try {
          const configManager = window.configManager;
          const config = await configManager.readConfig(folderPath);
          
          if (config && config.templates) {
            config.templates = config.templates.filter(t => t.filename !== fileName);
            await configManager.writeConfig(folderPath, config);
            alert('✅ Đã xóa file và cấu hình thành công');
          } else {
            alert('✅ Đã xóa file thành công');
          }
        } catch (configError) {
          console.warn('Error updating config after file deletion:', configError);
          alert(
            `✅ File đã được xóa thành công.\n\n` +
            `⚠️ Nhưng không thể cập nhật config.json.\n` +
            `Bạn có thể cần xóa cấu hình thủ công.`
          );
        }
        this.files = await this.loadFilesInFolder(this.selectedFolder.path);
        this.renderFileList();
      } catch (error) {
        console.error('Error deleting file:', error);
        alert(`❌ Không thể xóa file: ${error.message || 'Lỗi không xác định'}`);
      }
    }
  }

  if (typeof window !== 'undefined') {
    window.fileManager = new FileManager();
  }
})();
