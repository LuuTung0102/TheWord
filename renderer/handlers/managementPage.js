(function() {
  const BaseModal = window.BaseModal;
  
  if (!BaseModal) {
    return;
  }

  class ManagementPage extends BaseModal {
    constructor() {
      super({
        modalId: 'managementPageModal',
        modalClass: 'management-page-modal',
        title: '⚙️ Quản lý'
      });
    }

    getModalBodyHTML() {
      return `
        <div class="management-cards">
          <div class="management-card" data-action="file-management">
            <div class="management-card-icon">📄</div>
            <h3 class="management-card-title">Quản lý File Word</h3>
            <p class="management-card-description">Xem, thêm, xóa và chỉnh sửa các file Word template</p>
          </div>
          
          <div class="management-card" data-action="data-management">
            <div class="management-card-icon">👥</div>
            <h3 class="management-card-title">Quản lý Dữ liệu</h3>
            <p class="management-card-description">Quản lý dữ liệu PERSON đã lưu</p>
          </div>
        </div>
      `;
    }

    setupCustomEventListeners() {
      const cardsContainer = this.querySelector('.management-cards');
      if (cardsContainer) {
        this.addDelegatedListener(cardsContainer, '.management-card', 'click', function(e) {
          const action = this.getAttribute('data-action');
          if (action === 'file-management') {
            window.managementPage.openFileManagement();
          } else if (action === 'data-management') {
            window.managementPage.openDataManagement();
          }
        });
      }
    }

    async openFileManagement() {
      this.hide();
      if (window.fileManager) {
        await window.fileManager.init();
      }
    }

    async openDataManagement() {
      this.hide();
      if (window.personManager) {
        await window.personManager.init(async () => {
          const personButtonsContainers = document.querySelectorAll('[id^="person-buttons-"]');
          for (const container of personButtonsContainers) {
            const groupKey = container.getAttribute('data-group');
            if (groupKey && typeof window.refreshPersonButtons === 'function') {
              await window.refreshPersonButtons(groupKey);
            }
          }
        });
      }
    }
  }

  if (typeof window !== 'undefined') {
    window.managementPage = new ManagementPage();
  }
})();
