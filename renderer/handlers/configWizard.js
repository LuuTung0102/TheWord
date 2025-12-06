(function() {
  const BaseModal = window.BaseModal;
  if (!BaseModal) {
    return;
  }

  class ConfigWizard extends BaseModal {
    constructor() {
      super({
        modalId: 'configWizardModal',
        modalClass: 'config-wizard-modal',
        title: '⚙️ Cấu hình Template'
      });
      
      this.fileName = null;
      this.templateEntry = null;
      this.autoCreatedSubgroups = null;
      this.folderPath = null;
      this.existingConfig = null;
      this.resolveCallback = null;
      this.rejectCallback = null;
    }

    async open(fileName, templateEntry, autoCreatedSubgroups, folderPath, existingConfig) {
      this.fileName = fileName;
      if (!templateEntry || typeof templateEntry !== 'object') {
        throw new Error('Template entry must be a valid object');
      }
      
      this.templateEntry = JSON.parse(JSON.stringify(templateEntry));
      this.autoCreatedSubgroups = autoCreatedSubgroups || [];
      this.folderPath = folderPath;
      this.existingConfig = existingConfig;
      this.originalGroupIds = new Set(existingConfig?.groups?.map(g => g.id) || []);

      return new Promise((resolve, reject) => {
        this.resolveCallback = resolve;
        this.rejectCallback = reject;
        this.init(() => {
          if (this.resolveCallback) {
            this.resolveCallback(null);
            this.resolveCallback = null;
          }
        });
      });
    }

    getModalBodyHTML() {
      return `
        <div class="config-wizard-content">
          <div class="config-wizard-section">
            <h3 class="config-wizard-section-title">📄 Thông tin</h3>
            <div class="config-wizard-form">
              <div class="config-wizard-field">
                <label for="templateName">Tên:</label>
                <input type="text" id="templateName" class="config-wizard-input" placeholder="Nhập tên" value="${this.templateEntry?.name || ''}"/>
              </div>
            </div>
          </div>

          <div class="config-wizard-section">
            <h3 class="config-wizard-section-title">🔖 Subgroups phát hiện</h3>
            <div id="autoCreatedSubgroupsList" class="auto-created-subgroups-list"></div>
          </div>

          <div class="config-wizard-section">
            <div class="config-wizard-section-header">
              <h3 class="config-wizard-section-title">📋 Chọn Groups</h3>
          
            </div>
            <div id="groupsList" class="group-selector"></div>
          </div>

          <div class="config-wizard-actions">
            <button id="cancelBtn" class="config-wizard-btn config-wizard-btn-cancel">❌ Hủy</button>
            <button id="saveBtn" class="config-wizard-btn config-wizard-btn-save">✅ Lưu</button>
          </div>
        </div>
      `;
    }

    async onInit() {
      this.renderForm();
    }

    setupCustomEventListeners() {
      const saveBtn = this.querySelector('#saveBtn');
      if (saveBtn) {
        this.addEventListener(saveBtn, 'click', () => this.handleSave());
      }

      const cancelBtn = this.querySelector('#cancelBtn');
      if (cancelBtn) {
        this.addEventListener(cancelBtn, 'click', () => this.handleCancel());
      }

      const groupsList = this.querySelector('#groupsList');
      if (groupsList) {
        this.addDelegatedListener(groupsList, '.group-checkbox', 'change', function() {
          const groupId = this.getAttribute('data-group-id');
          window.configWizard.handleGroupToggle(groupId, this.checked);
        });

        this.addDelegatedListener(groupsList, '.subgroup-visibility-toggle', 'change', function() {
          const groupId = this.getAttribute('data-group-id');
          const subgroupId = this.getAttribute('data-subgroup-id');
          window.configWizard.handleSubgroupVisibilityToggle(groupId, subgroupId, this.checked);
        });
      }
    }

    renderForm() {
      this.renderAutoCreatedSubgroups();
      this.renderGroupsList();
    }

    renderAutoCreatedSubgroups() {
      const container = this.querySelector('#autoCreatedSubgroupsList');
      if (!container) return;
      
      const subgroupsMap = new Map();
      
      if (this.templateEntry._metadata?.placeholderToSubgroup) {
        for (const [placeholder, info] of Object.entries(this.templateEntry._metadata.placeholderToSubgroup)) {
          const sgId = info.subgroup;
          if (!subgroupsMap.has(sgId)) {
            subgroupsMap.set(sgId, { id: sgId, count: 0, groupId: info.group });
          }
          subgroupsMap.get(sgId).count++;
        }
      }

      if (subgroupsMap.size === 0 && this.autoCreatedSubgroups?.length > 0) {
        this.autoCreatedSubgroups.forEach(sg => {
          const sgId = sg.subgroupId || sg.id;
          subgroupsMap.set(sgId, { id: sgId, count: 0, groupId: sg.groupId });
        });
      }

      if (subgroupsMap.size === 0) {
        container.innerHTML = '<div class="auto-created-subgroups-empty"><p>ℹ️ Không phát hiện subgroup</p></div>';
        return;
      }

      container.innerHTML = `
        <div class="auto-created-subgroups-items">
          ${Array.from(subgroupsMap.values()).map(sg => 
            `<div class="auto-created-subgroup-item">
              <span class="subgroup-badge">${sg.id}</span>
              <span class="subgroup-count">${sg.count} field${sg.count !== 1 ? 's' : ''}</span>
            </div>`
          ).join('')}
        </div>
      `;
    }

    renderGroupsList() {
      const container = this.querySelector('#groupsList');
      if (!container) return;

      const availableGroups = this._getAvailableGroups();
      const selectedGroups = this.templateEntry.groups || [];

      if (availableGroups.length === 0) {
        container.innerHTML = '<div class="group-empty"><p>Không có group nào</p></div>';
        return;
      }

      const suggestedGroups = this.templateEntry._metadata?.suggestedGroups || [];
      
      const html = availableGroups.map(group => {
        const isSelected = selectedGroups.includes(group.id);
        const isSuggested = suggestedGroups.includes(group.id);
        const assignedSubgroupIds = this.templateEntry.placeholders[group.id] || [];
        const availableSubgroups = this._getAvailableSubgroupsForGroup(group.id);

        return `
          <div class="group-item ${isSelected ? 'selected' : ''} ${isSuggested && !isSelected ? 'suggested' : ''}">
            <div class="group-header">
              <label class="group-label">
                <input type="checkbox" class="group-checkbox" data-group-id="${group.id}" ${isSelected ? 'checked' : ''}/>
                <span class="group-name">${group.label} (${group.id})${isSuggested && !isSelected ? ' 💡' : ''}</span>
              </label>
            </div>
            ${isSelected ? `
              <div class="subgroup-management">
                <div class="subgroup-add-section">
                  <select class="subgroup-dropdown" data-group-id="${group.id}" ${availableSubgroups.length === 0 ? 'disabled' : ''}>
                    <option value="">-- Chọn subgroup --</option>
                    ${availableSubgroups.map(sg => `<option value="${sg.id}">${sg.id}</option>`).join('')}
                  </select>
                  <button class="subgroup-add-btn" data-group-id="${group.id}" ${availableSubgroups.length === 0 ? 'disabled' : ''}>➕</button>
                </div>
                ${assignedSubgroupIds.length > 0 ? `
                  <div class="subgroup-list">
                    ${assignedSubgroupIds.map(subgroupId => {
                      const info = this._getSubgroupInfo(group.id, subgroupId);
                      return `
                        <div class="subgroup-item">
                          <span class="subgroup-id-badge">${subgroupId}</span>
                          <input type="text" class="subgroup-label-input" value="${info.label || 'Thông tin'}" data-group-id="${group.id}" data-subgroup-id="${subgroupId}" style="display:none;"/>
                          <span class="subgroup-label-text">${info.label || 'Thông tin'}</span>
                          <div class="subgroup-actions">
                            <button class="subgroup-action-btn subgroup-edit-btn" data-group-id="${group.id}" data-subgroup-id="${subgroupId}" title="Sửa">✏️</button>
                            <button class="subgroup-action-btn subgroup-visibility-btn" data-group-id="${group.id}" data-subgroup-id="${subgroupId}" data-visible="${info.visible}" title="${info.visible ? 'Ẩn' : 'Hiện'}">${info.visible ? '👁️' : '🙈'}</button>
                            <button class="subgroup-action-btn subgroup-remove-btn" data-group-id="${group.id}" data-subgroup-id="${subgroupId}" title="Xóa">🗑️</button>
                          </div>
                        </div>
                      `;
                    }).join('')}
                  </div>
                ` : '<p class="no-subgroups-message">Chưa có subgroup. Chọn từ dropdown bên trên.</p>'}
              </div>
            ` : ''}
          </div>
        `;
      }).join('');

      container.innerHTML = html;
      this._setupGroupsListEventListeners();
    }

    handleGroupToggle(groupId, isChecked) {
      if (isChecked) {
        if (!this.templateEntry.groups.includes(groupId)) {
          this.templateEntry.groups.push(groupId);
          if (!this.templateEntry.placeholders[groupId]) {
            this.templateEntry.placeholders[groupId] = [];
          }
        }
      } else {
        const index = this.templateEntry.groups.indexOf(groupId);
        if (index > -1) {
          this.templateEntry.groups.splice(index, 1);
          delete this.templateEntry.placeholders[groupId];
        }
      }
      this.renderGroupsList();
    }

    handleSubgroupVisibilityToggle(groupId, subgroupId, isVisible) {
      const label = this.querySelector(
        `.subgroup-visibility-toggle[data-group-id="${groupId}"][data-subgroup-id="${subgroupId}"]`
      )?.parentElement?.querySelector('span');
      
      if (label) {
        label.textContent = isVisible ? 'Hiển thị' : 'Ẩn';
      }
    }

    validateForm() {
      const errors = [];
      const warnings = [];
      const templateName = this.querySelector('#templateName')?.value?.trim();
      if (!templateName) {
        errors.push('Tên template không được để trống');
      } else if (templateName.length < 3) {
        errors.push('Tên template phải có ít nhất 3 ký tự');
      } else if (templateName.length > 100) {
        errors.push('Tên template không được vượt quá 100 ký tự');
      }

      if (templateName && /<[^>]*>/g.test(templateName)) {
        errors.push('Tên template không được chứa HTML tags');
      }

      if (!this.templateEntry.groups || this.templateEntry.groups.length === 0) {
        errors.push('Phải chọn ít nhất một group');
      }

      if (this.templateEntry.groups && this.templateEntry.placeholders) {
        this.templateEntry.groups.forEach(groupId => {
          const groupSubgroups = this.templateEntry.placeholders[groupId];
          if (!groupSubgroups || groupSubgroups.length === 0) {
            errors.push(`Group "${groupId}" phải có ít nhất một subgroup`);
          }
        });
      }

      const allPlaceholders = this._getAllPlaceholders();
      if (allPlaceholders.length === 0) {
        warnings.push('Template không có placeholder nào. Bạn có chắc muốn tiếp tục?');
      }



      return {
        valid: errors.length === 0,
        errors,
        warnings
      };
    }

    collectFormData() {
      try {
        const templateName = this.querySelector('#templateName')?.value?.trim();
        const templateDescription = '';

        if (!templateName) {
          throw new Error('Template name is required');
        }

        const visibilityStates = {};
        this.templateEntry.groups.forEach(groupId => {
          const subgroups = this._getSubgroupsForGroup(groupId);
          subgroups.forEach(subgroup => {
            const checkbox = this.querySelector(
              `.subgroup-visibility-toggle[data-group-id="${groupId}"][data-subgroup-id="${subgroup.id}"]`
            );
            if (checkbox) {
              if (!visibilityStates[groupId]) {
                visibilityStates[groupId] = {};
              }
              visibilityStates[groupId][subgroup.id] = checkbox.checked;
            }
          });
        });

        return {
          ...this.templateEntry,
          name: templateName,
          description: templateDescription || '',
          visibilityStates
        };
      } catch (error) {
        throw new Error(`Failed to collect form data: ${error.message}`);
      }
    }

    collectFormDataWithFieldMappings(existingConfig) {
      try {
        const templateName = this.querySelector('#templateName')?.value?.trim();
        const templateDescription = '';

        if (!templateName) {
          throw new Error('Template name is required');
        }

        const templateEntry = {
          id: this.templateEntry.id,
          filename: this.templateEntry.filename,
          name: templateName,
          description: templateDescription || '',
          groups: [...this.templateEntry.groups],
          placeholders: JSON.parse(JSON.stringify(this.templateEntry.placeholders))
        };

        const subgroupMetadata = {};
        this.templateEntry.groups.forEach(groupId => {
          const assignedSubgroupIds = this.templateEntry.placeholders[groupId] || [];
          
          assignedSubgroupIds.forEach(subgroupId => {
            const subgroupInfo = this.autoCreatedSubgroups?.find(sg => 
              (sg.subgroupId || sg.id) === subgroupId && sg.groupId === groupId
            );
            
            if (subgroupInfo) {
              if (!subgroupMetadata[groupId]) {
                subgroupMetadata[groupId] = {};
              }
              subgroupMetadata[groupId][subgroupId] = {
                label: subgroupInfo.label || 'Thông tin',
                visible: subgroupInfo.visible !== undefined ? subgroupInfo.visible : false
              };
            }
          });
        });

        const updatedFieldMappings = [];
        const newGroups = {};

        this.templateEntry.groups.forEach(groupId => {
          const assignedSubgroupIds = this.templateEntry.placeholders[groupId] || [];
          
          if (assignedSubgroupIds.length === 0) {
            return;
          }
          const fieldMapping = this._checkAndUpdateFieldMapping(
            groupId,
            assignedSubgroupIds,
            subgroupMetadata,
            existingConfig
          );
          
          if (fieldMapping) {
            updatedFieldMappings.push(fieldMapping);
          }
          if (!this._isOriginalGroup(groupId)) {
            const groupInfo = existingConfig?.groups?.find(g => g.id === groupId);
            if (groupInfo) {
              newGroups[groupId] = groupInfo;
            }
          }
        });

        return {
          templateEntry,
          updatedFieldMappings,
          newGroups
        };
      } catch (error) {
        throw new Error(`Failed to collect form data: ${error.message}`);
      }
    }

    async handleSave() {
      try {
        const validation = this.validateForm();
        if (!validation.valid) {
          this._showErrorMessage('❌ Lỗi xác thực', validation.errors);
          return;
        }
        if (validation.warnings && validation.warnings.length > 0) {
          const proceed = confirm(
            `⚠️ Cảnh báo\n\n${validation.warnings.join('\n\n')}\n\nBạn có muốn tiếp tục không?`
          );
          
          if (!proceed) {
            return;
          }
        }

        const result = this.collectFormDataWithFieldMappings(this.existingConfig);
        if (!result || typeof result !== 'object') {
          this._showErrorMessage('❌ Lỗi', ['Không thể thu thập dữ liệu từ form']);
          return;
        }

        if (this.resolveCallback) {
          this.resolveCallback(result);
          this.resolveCallback = null;
        }

        this.hide();
      } catch (error) {
        this._showErrorMessage('❌ Lỗi không mong đợi', [error.message || 'Đã xảy ra lỗi khi lưu cấu hình']);
      }
    }

    handleCancel() {
      if (this.resolveCallback) {
        this.resolveCallback(null);
        this.resolveCallback = null;
      }

      this.hide();
    }

    _setupGroupsListEventListeners() {
      const groupsList = this.querySelector('#groupsList');
      if (!groupsList) return;

      this.addDelegatedListener(groupsList, '.subgroup-add-btn', 'click', function() {
        const groupId = this.getAttribute('data-group-id');
        const dropdown = groupsList.querySelector(`.subgroup-dropdown[data-group-id="${groupId}"]`);
        const subgroupId = dropdown?.value;
        
        if (subgroupId) {
          window.configWizard.handleAddSubgroupToGroup(groupId, subgroupId);
        }
      });

      this.addDelegatedListener(groupsList, '.subgroup-edit-btn', 'click', function() {
        const groupId = this.getAttribute('data-group-id');
        const subgroupId = this.getAttribute('data-subgroup-id');
        window.configWizard.handleEditSubgroupLabel(groupId, subgroupId, this);
      });

      this.addDelegatedListener(groupsList, '.subgroup-visibility-btn', 'click', function() {
        const groupId = this.getAttribute('data-group-id');
        const subgroupId = this.getAttribute('data-subgroup-id');
        window.configWizard.handleToggleSubgroupVisibility(groupId, subgroupId);
      });

      this.addDelegatedListener(groupsList, '.subgroup-remove-btn', 'click', function() {
        const groupId = this.getAttribute('data-group-id');
        const subgroupId = this.getAttribute('data-subgroup-id');
        window.configWizard.handleRemoveSubgroupFromGroup(groupId, subgroupId);
      });

      this.addDelegatedListener(groupsList, '.subgroup-label-input', 'blur', function() {
        const groupId = this.getAttribute('data-group-id');
        const subgroupId = this.getAttribute('data-subgroup-id');
        const newLabel = this.value.trim();
        window.configWizard.handleUpdateSubgroupLabel(groupId, subgroupId, newLabel);
      });

      this.addDelegatedListener(groupsList, '.subgroup-label-input', 'keydown', function(e) {
        if (e.key === 'Enter') {
          this.blur();
        } else if (e.key === 'Escape') {
          window.configWizard.renderGroupsList();
        }
      });
    }

    _getAvailableSubgroupsForGroup(groupId) {
      const allSubgroupsSet = new Set();
      
      if (this.templateEntry._metadata?.placeholderToSubgroup) {
        for (const [placeholder, info] of Object.entries(this.templateEntry._metadata.placeholderToSubgroup)) {
          if (info.group === groupId) {
            allSubgroupsSet.add(info.subgroup);
          }
        }
      }
      
      if (this.autoCreatedSubgroups?.length > 0) {
        this.autoCreatedSubgroups.forEach(sg => {
          if (sg.groupId === groupId) {
            allSubgroupsSet.add(sg.subgroupId || sg.id);
          }
        });
      }
      
      const assignedSubgroupIds = this.templateEntry.placeholders[groupId] || [];
      const availableSubgroups = Array.from(allSubgroupsSet)
        .filter(sgId => !assignedSubgroupIds.includes(sgId))
        .map(sgId => ({
          id: sgId,
          label: this._getSubgroupInfo(groupId, sgId).label || 'Thông tin',
          visible: false
        }));
      
      return availableSubgroups;
    }

    _getSubgroupInfo(groupId, subgroupId) {
      const autoCreated = this.autoCreatedSubgroups?.find(sg => 
        (sg.subgroupId || sg.id) === subgroupId && sg.groupId === groupId
      );
      
      if (autoCreated) {
        return {
          label: autoCreated.label || 'Thông tin',
          visible: autoCreated.visible !== undefined ? autoCreated.visible : false
        };
      }

      const fieldMapping = this.existingConfig?.fieldMappings?.find(fm => fm.group === groupId);
      const subgroup = fieldMapping?.subgroups?.find(sg => sg.id === subgroupId);
      
      if (subgroup) {
        return {
          label: subgroup.label || 'Thông tin',
          visible: subgroup.visible !== undefined ? subgroup.visible : false
        };
      }

      return {
        label: 'Thông tin',
        visible: false
      };
    }

    handleAddSubgroupToGroup(groupId, subgroupId) {
      if (!groupId || !subgroupId) {
        return false;
      }

      const assignedSubgroups = this.templateEntry.placeholders[groupId] || [];
      if (assignedSubgroups.includes(subgroupId)) {
        showError(`Lỗi trùng lặp\n\nSubgroup "${subgroupId}" đã tồn tại trong group "${groupId}".\n\nMỗi subgroup chỉ có thể được thêm vào một group một lần.`);
        return false;
      }

      assignedSubgroups.push(subgroupId);
      this.templateEntry.placeholders[groupId] = assignedSubgroups;
      this.renderGroupsList();
      return true;
    }

    handleRemoveSubgroupFromGroup(groupId, subgroupId) {
      if (!groupId || !subgroupId) return;

      const assignedSubgroups = this.templateEntry.placeholders[groupId] || [];
      const index = assignedSubgroups.indexOf(subgroupId);
      
      if (index > -1) {
        assignedSubgroups.splice(index, 1);
        this.templateEntry.placeholders[groupId] = assignedSubgroups;
        this.renderGroupsList();
      }
    }

    handleEditSubgroupLabel(groupId, subgroupId, buttonElement) {
      const subgroupItem = buttonElement.closest('.subgroup-item');
      if (!subgroupItem) return;

      const labelInput = subgroupItem.querySelector('.subgroup-label-input');
      const labelText = subgroupItem.querySelector('.subgroup-label-text');
      
      if (labelInput && labelText) {
        labelInput.style.display = 'inline-block';
        labelText.style.display = 'none';
        labelInput.focus();
        labelInput.select();
      }
    }

    handleUpdateSubgroupLabel(groupId, subgroupId, newLabel) {
      if (!newLabel) {
        this.renderGroupsList();
        return;
      }
      const subgroup = this.autoCreatedSubgroups?.find(sg => 
        (sg.subgroupId || sg.id) === subgroupId && sg.groupId === groupId
      );
      
      if (subgroup) {
        subgroup.label = newLabel;
      }
      this.renderGroupsList();
    }

    handleToggleSubgroupVisibility(groupId, subgroupId) {
      const subgroup = this.autoCreatedSubgroups?.find(sg => 
        (sg.subgroupId || sg.id) === subgroupId && sg.groupId === groupId
      );
      
      if (subgroup) {
        subgroup.visible = !subgroup.visible;
        const button = this.querySelector(
          `.subgroup-visibility-btn[data-group-id="${groupId}"][data-subgroup-id="${subgroupId}"]`
        );
        
        if (button) {
          button.textContent = subgroup.visible ? '👁️' : '🙈';
          button.setAttribute('data-visible', subgroup.visible);
          button.title = subgroup.visible ? 'Hiển thị' : 'Ẩn';
        }
      } else {
      }
    }

    onCleanup() {
      this.fileName = null;
      this.templateEntry = null;
      this.autoCreatedSubgroups = null;
      this.folderPath = null;
      this.existingConfig = null;
      this.originalGroupIds = null;
      
      if (this.resolveCallback) {
        this.resolveCallback(null);
        this.resolveCallback = null;
      }
      this.rejectCallback = null;
    }
    _getAllPlaceholders() {
      const placeholders = [];
      
      if (this.templateEntry && this.templateEntry.placeholders) {
        for (const group in this.templateEntry.placeholders) {
          const groupPlaceholders = this.templateEntry.placeholders[group];
          if (Array.isArray(groupPlaceholders)) {
            placeholders.push(...groupPlaceholders);
          }
        }
      }

      return [...new Set(placeholders)];
    }

    _getAvailableGroups() {
      if (!this.existingConfig || !this.existingConfig.groups) {
        return [];
      }

      return this.existingConfig.groups.sort((a, b) => (a.order || 0) - (b.order || 0));
    }

    _getSubgroupsForGroup(groupId) {
      try {
        if (!this.existingConfig || !this.existingConfig.fieldMappings) {
          return [];
        }

        const fieldMapping = this.existingConfig.fieldMappings.find(fm => fm.group === groupId);
        
        if (!fieldMapping || !fieldMapping.subgroups) {
          return [];
        }

        return fieldMapping.subgroups;
      } catch (error) {
        return [];
      }
    }

    _showErrorMessage(title, errors) {
      const errorList = Array.isArray(errors) ? errors : [errors];
      const message = `${title}\n\n${errorList.map((err, i) => `${i + 1}. ${err}`).join('\n')}`;
      showError(message);
    }

    _showValidationErrors(container, errors) {
      if (!container) return;
      const errorHtml = `
        <div class="validation-errors">
          <div class="validation-errors-title">⚠️ Vui lòng sửa các lỗi sau:</div>
          <ul class="validation-errors-list">
            ${errors.map(err => `<li>${err}</li>`).join('')}
          </ul>
        </div>
      `;

      const existingErrors = container.querySelector('.validation-errors');
      if (existingErrors) {
        existingErrors.remove();
      }
      container.insertAdjacentHTML('afterbegin', errorHtml);
    }

    _isOriginalGroup(groupId) {
      return this.originalGroupIds && this.originalGroupIds.has(groupId);
    }

    _checkAndUpdateFieldMapping(groupId, assignedSubgroupIds, subgroupMetadata, existingConfig) {
      if (!groupId || !assignedSubgroupIds || assignedSubgroupIds.length === 0) {
        return null;
      }

      const existingMapping = existingConfig?.fieldMappings?.find(fm => fm.group === groupId);
      
      if (existingMapping) {
        const existingSubgroupIds = existingMapping.subgroups.map(sg => sg.id);
        const newSubgroupIds = assignedSubgroupIds.filter(sgId => !existingSubgroupIds.includes(sgId));
        
        if (newSubgroupIds.length === 0) {
          return null;
        }
        
        return this._createUpdatedFieldMapping(
          groupId,
          existingMapping,
          newSubgroupIds,
          subgroupMetadata
        );
      } else {
        return this._createNewFieldMapping(
          groupId,
          assignedSubgroupIds,
          subgroupMetadata
        );
      }
    }

    _createUpdatedFieldMapping(groupId, existingMapping, newSubgroupIds, subgroupMetadata) {
      const updatedSubgroups = [...existingMapping.subgroups];
      const updatedSuffixes = [...(existingMapping.suffixes || [])];
      
      newSubgroupIds.forEach(sgId => {
        const metadata = subgroupMetadata[groupId]?.[sgId];
        updatedSubgroups.push({
          id: sgId,
          label: metadata?.label || 'Thông tin',
          visible: metadata?.visible !== undefined ? metadata.visible : false
        });
        
        const suffixMatch = sgId.match(/^[A-Z]+(\d+)$/);
        if (suffixMatch && !updatedSuffixes.includes(suffixMatch[1])) {
          updatedSuffixes.push(suffixMatch[1]);
        }
      });
      
      updatedSuffixes.sort((a, b) => parseInt(a) - parseInt(b));
      
      return {
        group: groupId,
        schema: existingMapping.schema,
        subgroups: updatedSubgroups,
        suffixes: updatedSuffixes.length > 0 ? updatedSuffixes : existingMapping.suffixes,
        defaultGenders: existingMapping.defaultGenders
      };
    }

    _createNewFieldMapping(groupId, assignedSubgroupIds, subgroupMetadata) {
      const subgroups = [];
      const suffixes = [];
      
      assignedSubgroupIds.forEach(sgId => {
        const metadata = subgroupMetadata[groupId]?.[sgId];
        subgroups.push({
          id: sgId,
          label: metadata?.label || 'Thông tin',
          visible: metadata?.visible !== undefined ? metadata.visible : false
        });
        
        const suffixMatch = sgId.match(/^[A-Z]+(\d+)$/);
        if (suffixMatch && !suffixes.includes(suffixMatch[1])) {
          suffixes.push(suffixMatch[1]);
        }
      });
      
      suffixes.sort((a, b) => parseInt(a) - parseInt(b));
      let schema = 'PersonalInfo';
      const schemaMapping = {
        'LAND': 'LandInfo',
        'HN': 'HonNhanInfo',
        'CT': 'CongTrinhInfo'
      };
      schema = schemaMapping[groupId] || schema;
      
      return {
        group: groupId,
        schema: schema,
        subgroups: subgroups,
        suffixes: suffixes.length > 0 ? suffixes : undefined,
        defaultGenders: ['Ông', 'Bà']
      };
    }
  }

  if (typeof window !== 'undefined') {
    window.ConfigWizard = ConfigWizard;
    window.configWizard = new ConfigWizard();
  }
})();
