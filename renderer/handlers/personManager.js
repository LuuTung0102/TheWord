(function() {
  const BaseModal = window.BaseModal;
  
  if (!BaseModal) {
    console.error('❌ BaseModal not found. PersonManager requires BaseModal.');
    return;
  }

  class PersonManager extends BaseModal {
    constructor() {
      super({
        modalId: 'personManagerModal',
        modalClass: 'person-manager-modal',
        title: '⚙️ Quản lý dữ liệu PERSON'
      });
      this.currentEditId = null;
    }

    getModalBodyHTML() {
      return `
        <div class="person-manager-actions">
          <button class="person-add-btn">
            ➕ Thêm PERSON mới
          </button>
        </div>
        <div id="personListContainer" class="person-list-container">
          <!-- Person list will be rendered here -->
        </div>
      `;
    }

    async onInit() {
      await window.personDataService.loadPeople();
      this.renderPersonList();
    }

    setupCustomEventListeners() {
      const addBtn = this.querySelector('.person-add-btn');
      if (addBtn) {
        this.addEventListener(addBtn, 'click', () => this.handleAddPerson());
      }

      const listContainer = this.querySelector('#personListContainer');
      if (listContainer) {
        this.addDelegatedListener(listContainer, '.person-edit-btn', 'click', function(e) {
          const personId = this.getAttribute('data-person-id');
          if (personId) {
            window.personManager.handleEditPerson(personId);
          }
        });

        this.addDelegatedListener(listContainer, '.person-delete-btn', 'click', function(e) {
          const personId = this.getAttribute('data-person-id');
          if (personId) {
            window.personManager.handleDeletePerson(personId);
          }
        });

        this.addDelegatedListener(listContainer, '.person-form-cancel', 'click', () => {
          if (this.currentEditId) {
            this.cancelEdit();
          } else {
            this.cancelAdd();
          }
        });

        this.addDelegatedListener(listContainer, '.person-form-save', 'click', () => {
          if (this.currentEditId) {
            this.saveEdit();
          } else {
            this.saveAdd();
          }
        });
      }
    }

    renderPersonList() {
      const container = this.querySelector('#personListContainer');
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
                <button class="person-edit-btn" data-person-id="${person.id}">
                  ✏️ Sửa
                </button>
                <button class="person-delete-btn" data-person-id="${person.id}">
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

    handleEditPerson(id) {
      const person = window.personDataService.getPerson(id);
      if (!person) {
        alert('❌ Không tìm thấy PERSON này');
        return;
      }

      this.currentEditId = id;
      this.showEditForm(person);
    }

    showEditForm(person) {
      const container = this.querySelector('#personListContainer');
      if (!container) return;
      const formHtml = window.FormBuilder.buildPersonForm('edit', person.data, person.id);
      container.insertAdjacentHTML('afterbegin', formHtml);
      container.scrollTop = 0;
    }

    cancelEdit() {
      this.currentEditId = null;
      const formContainer = document.querySelector('.person-form-container');
      if (formContainer) {
        formContainer.remove();
      }
    }

    saveEdit() {
      if (!this.currentEditId) return;
      const newData = window.FormBuilder.collectPersonFormData('edit');
      const validation = window.personDataService.validatePersonData(newData);
      if (!validation.isValid) {
        window.FormBuilder.showFormError(validation.errors.join('<br>'));
        return;
      }

      const success = window.personDataService.updatePerson(this.currentEditId, newData);
      
      if (success) {
        alert('✅ Đã cập nhật thành công!');
        this.currentEditId = null;
        this.renderPersonList();
      } else {
        window.FormBuilder.showFormError('Không thể lưu dữ liệu. Vui lòng thử lại.');
      }
    }

    handleDeletePerson(id) {
      const person = window.personDataService.getPerson(id);
      if (!person) {
        alert('❌ Không tìm thấy PERSON này');
        return;
      }
      const confirmed = confirm(`⚠️ Bạn có chắc muốn xóa "${person.name}"?\n\nDữ liệu sẽ bị xóa vĩnh viễn và không thể khôi phục.`);
      
      if (!confirmed) {
        return;
      }

      const success = window.personDataService.deletePerson(id);
      
      if (success) {
        alert('✅ Đã xóa thành công!');
        this.renderPersonList();
      } else {
        alert('❌ Không thể xóa. Vui lòng thử lại.');
      }
    }

    handleAddPerson() {
      this.currentEditId = null; 
      this.showAddForm();
    }

    showAddForm() {
      const container = this.querySelector('#personListContainer');
      if (!container) return;
      const formHtml = window.FormBuilder.buildPersonForm('add');
      container.insertAdjacentHTML('afterbegin', formHtml);
      container.scrollTop = 0;
    }

    cancelAdd() {
      const formContainer = document.querySelector('.person-form-container');
      if (formContainer) {
        formContainer.remove();
      }
    }

    saveAdd() {
      const newData = window.FormBuilder.collectPersonFormData('add');

      const validation = window.personDataService.validatePersonData(newData);
      if (!validation.isValid) {
        window.FormBuilder.showFormError(validation.errors.join('<br>'));
        return;
      }

      const newPerson = window.personDataService.addPerson(newData);
      
      if (newPerson) {
        alert(`✅ Đã thêm thành công: ${newPerson.id} - ${newPerson.name}`);
        this.renderPersonList();
      } else {
        window.FormBuilder.showFormError('Không thể lưu dữ liệu. Vui lòng thử lại.');
      }
    }
  }

  if (typeof window !== 'undefined') {
    window.personManager = new PersonManager();
  }
})();