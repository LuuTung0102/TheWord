(function() {
  class ManagementPage {
    constructor() {
      this.modal = null;
      this.isInitialized = false;
    }

    /**
     * Initialize và show modal
     */
    async init() {
      if (!this.isInitialized) {
        this.createModal();
        this.isInitialized = true;
      }

      // Show modal
      this.show();
    }

    /**
     * Tạo modal HTML structure
     */
    createModal() {
      const modalHtml = `
        <div id="managementPageModal" class="management-page-modal" style="display: none;">
          <div class="management-page-overlay"></div>
          <div class="management-page-container">
            <div class="management-page-header">
              <h2>⚙️ Quản lý</h2>
              <button class="management-page-close" onclick="window.managementPage.hide()">✕</button>
            </div>
            <div class="management-page-body">
              <div class="management-cards">
                <div class="management-card" onclick="window.managementPage.openFileManagement()">
                  <div class="management-card-icon">📄</div>
                  <h3 class="management-card-title">Quản lý File Word</h3>
                  <p class="management-card-description">Xem, thêm, xóa và chỉnh sửa các file Word template</p>
                </div>
                
                <div class="management-card" onclick="window.managementPage.openDataManagement()">
                  <div class="management-card-icon">👥</div>
                  <h3 class="management-card-title">Quản lý Dữ liệu</h3>
                  <p class="management-card-description">Quản lý dữ liệu PERSON đã lưu</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      `;

      document.body.insertAdjacentHTML('beforeend', modalHtml);
      this.modal = document.getElementById('managementPageModal');
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
    }

    /**
     * Open File Management
     */
    openFileManagement() {
      this.hide();
      // TODO: Implement file management page
      alert('🚧 Tính năng Quản lý File Word đang được phát triển');
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
