(function() {
  class PersonManager {
    constructor() {
      this.modal = null;
      this.isInitialized = false;
      this.currentEditId = null;
      this.onCloseCallback = null;
    }

    /**
     * Initialize và show modal
     */
    async init(onCloseCallback) {
      this.onCloseCallback = onCloseCallback;
      
      if (!this.isInitialized) {
        this.createModal();
        this.isInitialized = true;
      }

      // Load data (labels sẽ được load cùng với people)
      await window.personDataService.loadPeople();

      // Render list
      this.renderPersonList();

      // Show modal
      this.show();
    }

    /**
     * Tạo modal HTML structure
     */
    createModal() {
      const modalHtml = `
        <div id="personManagerModal" class="person-manager-modal" style="display: none;">
          <div class="person-manager-overlay"></div>
          <div class="person-manager-container">
            <div class="person-manager-header">
              <h2>⚙️ Quản lý dữ liệu PERSON</h2>
              <button class="person-manager-close" onclick="window.personManager.hide()">✕</button>
            </div>
            <div class="person-manager-body">
              <div class="person-manager-actions">
                <button class="person-add-btn" onclick="window.personManager.handleAddPerson()">
                  ➕ Thêm PERSON mới
                </button>
              </div>
              <div id="personListContainer" class="person-list-container">
                <!-- Person list will be rendered here -->
              </div>
            </div>
          </div>
        </div>
      `;

      // CSS đã được chuyển vào style.css
      document.body.insertAdjacentHTML('beforeend', modalHtml);
      this.modal = document.getElementById('personManagerModal');
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
      
      // Call callback để refresh person-buttons
      if (this.onCloseCallback && typeof this.onCloseCallback === 'function') {
        this.onCloseCallback();
      }
    }

    /**
     * Render danh sách PERSON
     */
    renderPersonList() {
      const container = document.getElementById('personListContainer');
      if (!container) return;

      const people = window.personDataService.people;

      if (people.length === 0) {
        container.innerHTML = `
          <div class="person-empty-state">
            <div class="person-empty-state-icon">👤</div>
            <h3>Chưa có PERSON nào</h3>
            <p>Nhấn "Thêm PERSON mới" để bắt đầu</p>
          </div>
        `;
        return;
      }

      const html = people.map(person => {
        const nameLabel = window.personDataService.getLabel('Name');
        const cccdLabel = window.personDataService.getLabel('CCCD');
        
        return `
          <div class="person-item">
            <div class="person-item-header">
              <div class="person-item-title">${person.id} - ${person.name}</div>
              <div class="person-item-actions">
                <button class="person-edit-btn" onclick="window.personManager.handleEditPerson('${person.id}')">
                  ✏️ Sửa
                </button>
                <button class="person-delete-btn" onclick="window.personManager.handleDeletePerson('${person.id}')">
                  🗑️ Xóa
                </button>
              </div>
            </div>
            <div class="person-item-details">
              <div class="person-detail-row">
                <span class="person-detail-label">${nameLabel}:</span>
                <span>${person.data.Name || '(trống)'}</span>
              </div>
              <div class="person-detail-row">
                <span class="person-detail-label">${cccdLabel}:</span>
                <span>${person.data.CCCD || '(trống)'}</span>
              </div>
            </div>
          </div>
        `;
      }).join('');

      container.innerHTML = html;
    }

    /**
     * Handle edit PERSON
     */
    handleEditPerson(id) {
      const person = window.personDataService.getPerson(id);
      if (!person) {
        alert('❌ Không tìm thấy PERSON này');
        return;
      }

      this.currentEditId = id;
      this.showEditForm(person);
    }

    /**
     * Show edit form
     */
    showEditForm(person) {
      const container = document.getElementById('personListContainer');
      if (!container) return;

      const genderLabel = window.personDataService.getLabel('Gender');
      const nameLabel = window.personDataService.getLabel('Name');
      const dateLabel = window.personDataService.getLabel('Date');
      const cccdLabel = window.personDataService.getLabel('CCCD');
      const noiCapLabel = window.personDataService.getLabel('Noi_Cap');
      const ngayCapLabel = window.personDataService.getLabel('Ngay_Cap');
      const addressLabel = window.personDataService.getLabel('Address');

      const formHtml = `
        <div class="person-form-container">
          <div class="person-form-title">✏️ Sửa ${person.id} - ${person.name}</div>
          <div id="personFormError" class="person-error-message" style="display: none;"></div>
          <div class="person-form-grid">
            <div class="person-form-field">
              <label class="person-form-label">${genderLabel} *</label>
              <select id="editGender" class="person-form-select">
                <option value="Ông" ${person.data.Gender === 'Ông' ? 'selected' : ''}>Ông</option>
                <option value="Bà" ${person.data.Gender === 'Bà' ? 'selected' : ''}>Bà</option>
              </select>
            </div>
            <div class="person-form-field">
              <label class="person-form-label">${nameLabel} *</label>
              <input type="text" id="editName" class="person-form-input" value="${person.data.Name || ''}" placeholder="Nhập họ và tên">
            </div>
            <div class="person-form-field">
              <label class="person-form-label">${dateLabel} *</label>
              <input type="text" id="editDate" class="person-form-input" value="${person.data.Date || ''}" placeholder="dd/mm/yyyy">
            </div>
            <div class="person-form-field">
              <label class="person-form-label">${cccdLabel} *</label>
              <input type="text" id="editCCCD" class="person-form-input" value="${person.data.CCCD || ''}" placeholder="Nhập số CCCD">
            </div>
            <div class="person-form-field">
              <label class="person-form-label">${noiCapLabel} *</label>
              <select id="editNoiCap" class="person-form-select">
                <option value="Cục Cảnh sát QLHC về TTXH" ${person.data.Noi_Cap === 'Cục Cảnh sát QLHC về TTXH' ? 'selected' : ''}>Cục Cảnh sát QLHC về TTXH</option>
                <option value="Công an T. Đắk Lắk" ${person.data.Noi_Cap === 'Công an T. Đắk Lắk' ? 'selected' : ''}>Công an T. Đắk Lắk</option>
              </select>
            </div>
            <div class="person-form-field">
              <label class="person-form-label">${ngayCapLabel} *</label>
              <input type="text" id="editNgayCap" class="person-form-input" value="${person.data.Ngay_Cap || ''}" placeholder="dd/mm/yyyy">
            </div>
            <div class="person-form-field full-width">
              <label class="person-form-label">${addressLabel} *</label>
              <input type="text" id="editAddress" class="person-form-input" value="${person.data.Address || ''}" placeholder="Nhập địa chỉ thường trú">
            </div>
          </div>
          <div class="person-form-actions">
            <button class="person-form-cancel" onclick="window.personManager.cancelEdit()">Hủy</button>
            <button class="person-form-save" onclick="window.personManager.saveEdit()">💾 Lưu</button>
          </div>
        </div>
      `;

      // Insert form at top
      container.insertAdjacentHTML('afterbegin', formHtml);

      // Scroll to form
      container.scrollTop = 0;
    }

    /**
     * Cancel edit
     */
    cancelEdit() {
      this.currentEditId = null;
      const formContainer = document.querySelector('.person-form-container');
      if (formContainer) {
        formContainer.remove();
      }
    }

    /**
     * Save edit
     */
    saveEdit() {
      if (!this.currentEditId) return;

      // Collect form data
      const newData = {
        Gender: document.getElementById('editGender').value,
        Name: document.getElementById('editName').value.trim(),
        Date: document.getElementById('editDate').value.trim(),
        CCCD: document.getElementById('editCCCD').value.trim(),
        Noi_Cap: document.getElementById('editNoiCap').value,
        Ngay_Cap: document.getElementById('editNgayCap').value.trim(),
        Address: document.getElementById('editAddress').value.trim()
      };

      // Validate
      const validation = window.personDataService.validatePersonData(newData);
      if (!validation.isValid) {
        this.showFormError(validation.errors.join('<br>'));
        return;
      }

      // Update
      const success = window.personDataService.updatePerson(this.currentEditId, newData);
      
      if (success) {
        alert('✅ Đã cập nhật thành công!');
        this.currentEditId = null;
        this.renderPersonList();
      } else {
        this.showFormError('Không thể lưu dữ liệu. Vui lòng thử lại.');
      }
    }

    /**
     * Show form error
     */
    showFormError(message) {
      const errorDiv = document.getElementById('personFormError');
      if (errorDiv) {
        errorDiv.innerHTML = message;
        errorDiv.style.display = 'block';
      }
    }

    /**
     * Handle delete PERSON
     */
    handleDeletePerson(id) {
      const person = window.personDataService.getPerson(id);
      if (!person) {
        alert('❌ Không tìm thấy PERSON này');
        return;
      }

      // Confirmation dialog
      const confirmed = confirm(`⚠️ Bạn có chắc muốn xóa "${person.name}"?\n\nDữ liệu sẽ bị xóa vĩnh viễn và không thể khôi phục.`);
      
      if (!confirmed) {
        return;
      }

      // Delete
      const success = window.personDataService.deletePerson(id);
      
      if (success) {
        alert('✅ Đã xóa thành công!');
        this.renderPersonList();
      } else {
        alert('❌ Không thể xóa. Vui lòng thử lại.');
      }
    }

    /**
     * Handle add PERSON
     */
    handleAddPerson() {
      this.currentEditId = null; // Reset edit mode
      this.showAddForm();
    }

    /**
     * Show add form
     */
    showAddForm() {
      const container = document.getElementById('personListContainer');
      if (!container) return;

      const genderLabel = window.personDataService.getLabel('Gender');
      const nameLabel = window.personDataService.getLabel('Name');
      const dateLabel = window.personDataService.getLabel('Date');
      const cccdLabel = window.personDataService.getLabel('CCCD');
      const noiCapLabel = window.personDataService.getLabel('Noi_Cap');
      const ngayCapLabel = window.personDataService.getLabel('Ngay_Cap');
      const addressLabel = window.personDataService.getLabel('Address');

      const formHtml = `
        <div class="person-form-container">
          <div class="person-form-title">➕ Thêm PERSON mới</div>
          <div id="personFormError" class="person-error-message" style="display: none;"></div>
          <div class="person-form-grid">
            <div class="person-form-field">
              <label class="person-form-label">${genderLabel} *</label>
              <select id="addGender" class="person-form-select">
                <option value="Ông" selected>Ông</option>
                <option value="Bà">Bà</option>
              </select>
            </div>
            <div class="person-form-field">
              <label class="person-form-label">${nameLabel} *</label>
              <input type="text" id="addName" class="person-form-input" placeholder="Nhập họ và tên">
            </div>
            <div class="person-form-field">
              <label class="person-form-label">${dateLabel} *</label>
              <input type="text" id="addDate" class="person-form-input" placeholder="dd/mm/yyyy">
            </div>
            <div class="person-form-field">
              <label class="person-form-label">${cccdLabel} *</label>
              <input type="text" id="addCCCD" class="person-form-input" placeholder="Nhập số CCCD">
            </div>
            <div class="person-form-field">
              <label class="person-form-label">${noiCapLabel} *</label>
              <select id="addNoiCap" class="person-form-select">
                <option value="Cục Cảnh sát QLHC về TTXH" selected>Cục Cảnh sát QLHC về TTXH</option>
                <option value="Công an T. Đắk Lắk">Công an T. Đắk Lắk</option>
              </select>
            </div>
            <div class="person-form-field">
              <label class="person-form-label">${ngayCapLabel} *</label>
              <input type="text" id="addNgayCap" class="person-form-input" placeholder="dd/mm/yyyy">
            </div>
            <div class="person-form-field full-width">
              <label class="person-form-label">${addressLabel} *</label>
              <input type="text" id="addAddress" class="person-form-input" placeholder="Nhập địa chỉ thường trú">
            </div>
          </div>
          <div class="person-form-actions">
            <button class="person-form-cancel" onclick="window.personManager.cancelAdd()">Hủy</button>
            <button class="person-form-save" onclick="window.personManager.saveAdd()">💾 Lưu</button>
          </div>
        </div>
      `;

      // Insert form at top
      container.insertAdjacentHTML('afterbegin', formHtml);

      // Scroll to form
      container.scrollTop = 0;
    }

    /**
     * Cancel add
     */
    cancelAdd() {
      const formContainer = document.querySelector('.person-form-container');
      if (formContainer) {
        formContainer.remove();
      }
    }

    /**
     * Save add
     */
    saveAdd() {
      // Collect form data
      const newData = {
        Gender: document.getElementById('addGender').value,
        Name: document.getElementById('addName').value.trim(),
        Date: document.getElementById('addDate').value.trim(),
        CCCD: document.getElementById('addCCCD').value.trim(),
        Noi_Cap: document.getElementById('addNoiCap').value,
        Ngay_Cap: document.getElementById('addNgayCap').value.trim(),
        Address: document.getElementById('addAddress').value.trim()
      };

      // Validate
      const validation = window.personDataService.validatePersonData(newData);
      if (!validation.isValid) {
        this.showFormError(validation.errors.join('<br>'));
        return;
      }

      // Add
      const newPerson = window.personDataService.addPerson(newData);
      
      if (newPerson) {
        alert(`✅ Đã thêm thành công: ${newPerson.id} - ${newPerson.name}`);
        this.renderPersonList();
      } else {
        this.showFormError('Không thể lưu dữ liệu. Vui lòng thử lại.');
      }
    }
  }

  // Initialize và attach vào window
  if (typeof window !== 'undefined') {
    window.personManager = new PersonManager();
    console.log('✅ PersonManager initialized');
  }
})();
