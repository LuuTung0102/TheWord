(function() {
  class ConfigManager {
    constructor() {
      this.configCache = new Map();
    }

    async readConfig(folderPath) {
      try {
        if (!folderPath || typeof folderPath !== 'string') {
          throw new Error('Invalid folder path');
        }

        if (!window.ipcRenderer) {
          throw new Error('IPC renderer not available');
        }

        const config = await window.ipcRenderer.invoke('read-folder-config', folderPath);
        
        if (config) {
          const validation = this.validateConfig(config);
          if (!validation.valid) {
          }
          this.configCache.set(folderPath, config);
        }
        
        return config;
      } catch (error) {
        throw new Error(`Failed to read config: ${error.message}`);
      }
    }

    async writeConfig(folderPath, config) {
      try {
        if (!folderPath || typeof folderPath !== 'string') {
          throw new Error('Invalid folder path');
        }

        if (!config || typeof config !== 'object') {
          throw new Error('Invalid config object');
        }

        if (!window.ipcRenderer) {
          throw new Error('IPC renderer not available');
        }

        const validation = this.validateConfig(config);
        if (!validation.valid) {
          throw new Error(`Invalid config structure: ${validation.errors.join(', ')}`);
        }

        const success = await window.ipcRenderer.invoke('write-folder-config', folderPath, config);
        
        if (!success) {
          throw new Error('Failed to write config file');
        }

        this.configCache.set(folderPath, config);
        
        return success;
      } catch (error) {
        throw new Error(`Failed to write config: ${error.message}`);
      }
    }

    async createBackup(folderPath) {
      try {
        if (!folderPath || typeof folderPath !== 'string') {
          throw new Error('Invalid folder path');
        }

        if (!window.ipcRenderer) {
          throw new Error('IPC renderer not available');
        }

        const backupPath = await window.ipcRenderer.invoke('backup-folder-config', folderPath);     
        return backupPath;
      } catch (error) {
        throw new Error(`Failed to create backup: ${error.message}`);
      }
    }

    async restoreFromBackup(backupPath, folderPath) {
      try {
        if (!backupPath || typeof backupPath !== 'string') {
          throw new Error('Invalid backup path');
        }

        if (!folderPath || typeof folderPath !== 'string') {
          throw new Error('Invalid folder path');
        }

        if (!window.ipcRenderer) {
          throw new Error('IPC renderer not available');
        }

        const success = await window.ipcRenderer.invoke('restore-folder-config', backupPath, folderPath);
        
        if (!success) {
          throw new Error('Failed to restore config from backup');
        }
        this.configCache.delete(folderPath);
        
        return success;
      } catch (error) {
        throw new Error(`Failed to restore from backup: ${error.message}`);
      }
    }

    validateConfig(config) {
      const errors = [];

      if (!config || typeof config !== 'object') {
        errors.push('Config must be an object');
        return { valid: false, errors };
      }

      if (config === null || Array.isArray(config)) {
        errors.push('Config must be a plain object, not null or array');
        return { valid: false, errors };
      }

      const requiredFields = ['templates', 'groups', 'fieldSchemas', 'fieldMappings'];
      requiredFields.forEach(field => {
        if (!(field in config)) {
          errors.push(`Missing required field: ${field}`);
        }
      });

      if (config.templates) {
        if (!Array.isArray(config.templates)) {
          errors.push('templates must be an array');
        } else {
          config.templates.forEach((template, index) => {
            const templateErrors = this._validateTemplateEntry(template);
            templateErrors.forEach(err => {
              errors.push(`Template ${index} (${template?.filename || 'unknown'}): ${err}`);
            });
          });

          const filenames = config.templates.map(t => t.filename).filter(Boolean);
          const duplicates = filenames.filter((item, index) => filenames.indexOf(item) !== index);
          if (duplicates.length > 0) {
            errors.push(`Duplicate template filenames found: ${duplicates.join(', ')}`);
          }

          const ids = config.templates.map(t => t.id).filter(Boolean);
          const duplicateIds = ids.filter((item, index) => ids.indexOf(item) !== index);
          if (duplicateIds.length > 0) {
            errors.push(`Duplicate template IDs found: ${duplicateIds.join(', ')}`);
          }
        }
      }

      if (config.groups) {
        if (!Array.isArray(config.groups)) {
          errors.push('groups must be an array');
        } else {
          config.groups.forEach((group, index) => {
            if (!group || typeof group !== 'object') {
              errors.push(`Group ${index}: must be an object`);
            } else {
              if (!group.id) {
                errors.push(`Group ${index}: missing required field "id"`);
              }
              if (!group.label) {
                errors.push(`Group ${index}: missing required field "label"`);
              }
            }
          });
        }
      }

      if (config.fieldSchemas) {
        if (typeof config.fieldSchemas !== 'object' || Array.isArray(config.fieldSchemas)) {
          errors.push('fieldSchemas must be a plain object');
        }
      }

      if (config.fieldMappings) {
        if (!Array.isArray(config.fieldMappings)) {
          errors.push('fieldMappings must be an array');
        } else {
          config.fieldMappings.forEach((mapping, index) => {
            if (!mapping || typeof mapping !== 'object') {
              errors.push(`FieldMapping ${index}: must be an object`);
            } else {
              if (!mapping.group) {
                errors.push(`FieldMapping ${index}: missing required field "group"`);
              }
              if (!mapping.schema) {
                errors.push(`FieldMapping ${index}: missing required field "schema"`);
              }
            }
          });
        }
      }

      return {
        valid: errors.length === 0,
        errors
      };
    }

    _validateTemplateEntry(template) {
      const errors = [];

      if (!template || typeof template !== 'object') {
        errors.push('Template must be an object');
        return errors;
      }

      const requiredFields = ['id', 'filename', 'name', 'groups', 'placeholders'];
      requiredFields.forEach(field => {
        if (!(field in template)) {
          errors.push(`Missing required field: ${field}`);
        }
      });

      if (template.id !== undefined) {
        if (typeof template.id !== 'string') {
          errors.push('id must be a string');
        } else if (template.id.trim() === '') {
          errors.push('id cannot be empty');
        }
      }

      if (template.filename !== undefined) {
        if (typeof template.filename !== 'string') {
          errors.push('filename must be a string');
        } else if (template.filename.trim() === '') {
          errors.push('filename cannot be empty');
        } else if (!template.filename.endsWith('.docx')) {
          errors.push('filename must end with .docx');
        }
      }

      if (template.name !== undefined) {
        if (typeof template.name !== 'string') {
          errors.push('name must be a string');
        } else if (template.name.trim() === '') {
          errors.push('name cannot be empty');
        }
      }

      if (template.groups !== undefined) {
        if (!Array.isArray(template.groups)) {
          errors.push('groups must be an array');
        } else if (template.groups.length === 0) {
          errors.push('groups array cannot be empty');
        } else {
          template.groups.forEach((group, index) => {
            if (typeof group !== 'string') {
              errors.push(`groups[${index}] must be a string`);
            }
          });
        }
      }

      if (template.placeholders !== undefined) {
        if (typeof template.placeholders !== 'object' || Array.isArray(template.placeholders)) {
          errors.push('placeholders must be a plain object');
        } else {
          for (const [groupKey, groupPlaceholders] of Object.entries(template.placeholders)) {
            if (!Array.isArray(groupPlaceholders)) {
              errors.push(`placeholders["${groupKey}"] must be an array`);
            } else {
              groupPlaceholders.forEach((ph, index) => {
                if (typeof ph !== 'string') {
                  errors.push(`placeholders["${groupKey}"][${index}] must be a string`);
                }
              });
            }
          }
        }
      }

      return errors;
    }

    async addTemplateEntry(folderPath, templateEntry) {
      try {
        if (!folderPath || typeof folderPath !== 'string') {
          throw new Error('Invalid folder path');
        }

        if (!templateEntry || typeof templateEntry !== 'object') {
          throw new Error('Invalid template entry');
        }

        const templateErrors = this._validateTemplateEntry(templateEntry);
        if (templateErrors.length > 0) {
          throw new Error(`Invalid template entry: ${templateErrors.join(', ')}`);
        }

        let config = await this.readConfig(folderPath);
        if (!config) {
          config = this._createDefaultConfig();
        }

        if (!config.templates) {
          config.templates = [];
        }

        const existingIndex = config.templates.findIndex(t => t.filename === templateEntry.filename);
        if (existingIndex !== -1) {
          throw new Error(`Template with filename "${templateEntry.filename}" already exists`);
        }

        const existingIdIndex = config.templates.findIndex(t => t.id === templateEntry.id);
        if (existingIdIndex !== -1) {
          throw new Error(`Template with ID "${templateEntry.id}" already exists`);
        }

        config.templates.push(templateEntry);
        await this.writeConfig(folderPath, config);

        return true;
      } catch (error) {
        throw new Error(`Failed to add template entry: ${error.message}`);
      }
    }

    async updateTemplateEntry(folderPath, templateId, templateEntry) {
      try {
        if (!folderPath || typeof folderPath !== 'string') {
          throw new Error('Invalid folder path');
        }

        if (!templateId || typeof templateId !== 'string') {
          throw new Error('Invalid template ID');
        }

        if (!templateEntry || typeof templateEntry !== 'object') {
          throw new Error('Invalid template entry');
        }

        const config = await this.readConfig(folderPath);
        
        if (!config) {
          throw new Error('Config not found');
        }

        if (!config.templates || !Array.isArray(config.templates)) {
          throw new Error('Invalid config: templates array not found');
        }

        const templateIndex = config.templates.findIndex(t => t.id === templateId);
        
        if (templateIndex === -1) {
          throw new Error(`Template with id "${templateId}" not found`);
        }

        const updatedTemplate = {
          ...config.templates[templateIndex],
          ...templateEntry,
          id: templateId 
        };

        const templateErrors = this._validateTemplateEntry(updatedTemplate);
        if (templateErrors.length > 0) {
          throw new Error(`Invalid template entry: ${templateErrors.join(', ')}`);
        }

        config.templates[templateIndex] = updatedTemplate;

        await this.writeConfig(folderPath, config);

        return true;
      } catch (error) {
        throw new Error(`Failed to update template entry: ${error.message}`);
      }
    }

    _createDefaultConfig() {
      return {
        templates: [],
        groups: [
          { id: "BCN", label: "Bên chuyển nhượng", order: 1, description: "Người chuyển nhượng" },
          { id: "BNCN", label: "Bên nhận chuyển nhượng", order: 2, description: "Người nhận chuyển nhượng" },
          { id: "LAND", label: "Thông tin đất đai", order: 3, description: "Thông tin đất" }
        ],
        fieldSchemas: {
          PersonalInfo: {
            description: "Thông tin cá nhân",
            applicableTo: ["BCN", "BNCN"],
            fields: [
              { name: "Name", label: "Họ và tên", type: "text", required: true },
              { name: "Gender", label: "Giới tính", type: "select", required: true },
              { name: "Date", label: "Ngày sinh", type: "date", required: true },
              { name: "CCCD", label: "Số CCCD", type: "text", required: true },
              { name: "Address", label: "Địa chỉ", type: "text", required: true }
            ]
          },
          LandInfo: {
            description: "Thông tin đất đai",
            applicableTo: ["LAND"],
            fields: [
              { name: "S", label: "Diện tích", type: "number", required: true },
              { name: "Money", label: "Giá trị", type: "number", required: true }
            ]
          }
        },
        fieldMappings: []
      };
    }

    clearCache(folderPath) {
      if (folderPath) {
        this.configCache.delete(folderPath);
      } else {
        this.configCache.clear();
      }
    }

    async safeConfigUpdate(folderPath, updateFn) {
      let backupPath = null;
      
      try {
        if (!folderPath || typeof folderPath !== 'string') {
          throw new Error('Invalid folder path');
        }
        if (typeof updateFn !== 'function') {
          throw new Error('Update function must be a function');
        }
        try {
          backupPath = await this.createBackup(folderPath);
        } catch (backupError) {
        }

        const config = await this.readConfig(folderPath);
        
        if (!config) {
          throw new Error('Config not found');
        }
        const updatedConfig = await updateFn(config);

        if (!updatedConfig || typeof updatedConfig !== 'object') {
          throw new Error('Update function must return a valid config object');
        }
        const validation = this.validateConfig(updatedConfig);
        if (!validation.valid) {
          throw new Error(`Invalid config structure: ${validation.errors.join(', ')}`);
        }
        await this.writeConfig(folderPath, updatedConfig);
        
        return { success: true, backupPath };
      } catch (error) {
        if (backupPath) {
          try {
            await this.restoreFromBackup(backupPath, folderPath);
          } catch (restoreError) {
            return {
              success: false,
              error: error.message,
              restoreError: restoreError.message
            };
          }
        }
        
        return { 
          success: false, 
          error: error.message 
        };
      }
    }
  }

  if (typeof window !== 'undefined') {
    window.configManager = new ConfigManager();
  }
})();
