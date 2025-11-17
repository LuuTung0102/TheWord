(function() {
  // Extend BaseModal
  const BaseModal = window.BaseModal;
  
  if (!BaseModal) {
    console.error('❌ BaseModal not found. ManagementPage requires BaseModal.');
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

    /**
     * Override: Get modal body HTML
     */
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

    /**
     * Override: Setup custom event listeners
     */
    setupCustomEventListeners() {
      const cardsContainer = this.querySelector('.management-cards');
      if (cardsContainer) {
        // Use event delegation for cards
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

    /**
     * Open File Management
     */
    async openFileManagement() {
      this.hide();
      if (window.fileManager) {
        await window.fileManager.init();
      }
    }

    /**
     * Open Data Management (Person Manager)
     */
    async openDataManagement() {
      this.hide();
      if (window.personManager) {
        await window.personManager.init(async () => {
          // Callback để refresh person-buttons nếu có
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

  // Initialize và attach vào window
  if (typeof window !== 'undefined') {
    window.managementPage = new ManagementPage();
    console.log('✅ ManagementPage initialized');
  }
})();
