(function() {
  class NotificationManager {
    constructor() {
      this.container = null;
      this.init();
    }

    init() {
      if (!this.container) {
        this.container = document.createElement('div');
        this.container.id = 'notificationContainer';
        this.container.className = 'notification-container';
        document.body.appendChild(this.container);
      }
    }

    show(message, type = 'info', duration = 1500) {
      const notification = document.createElement('div');
      notification.className = `notification notification-${type}`;
      
      const icon = this.getIcon(type);
      const content = `
        <div class="notification-icon">${icon}</div>
        <div class="notification-content">
          <div class="notification-message">${this.escapeHtml(message)}</div>
        </div>
        <button class="notification-close" onclick="this.parentElement.remove()">×</button>
      `;
      
      notification.innerHTML = content;
      this.container.appendChild(notification);
      
      setTimeout(() => notification.classList.add('show'), 10);
      
      if (duration > 0) {
        setTimeout(() => {
          notification.classList.remove('show');
          setTimeout(() => notification.remove(), 300);
        }, duration);
      }
      
      return notification;
    }

    success(message, duration = 1000) {
      return this.show(message, 'success', duration);
    }

    error(message, duration = 1500) {
      return this.show(message, 'error', duration);
    }

    warning(message, duration = 1500) {
      return this.show(message, 'warning', duration);
    }

    info(message, duration = 1000) {
      return this.show(message, 'info', duration);
    }

    confirm(message, onConfirm, onCancel) {
      const modal = document.createElement('div');
      modal.className = 'notification-modal';
      modal.innerHTML = `
        <div class="notification-modal-overlay"></div>
        <div class="notification-modal-content">
          <div class="notification-modal-icon">⚠️</div>
          <div class="notification-modal-message">${this.escapeHtml(message)}</div>
          <div class="notification-modal-actions">
            <button class="notification-btn notification-btn-cancel">Hủy</button>
            <button class="notification-btn notification-btn-confirm">Xác nhận</button>
          </div>
        </div>
      `;
      
      document.body.appendChild(modal);
      setTimeout(() => modal.classList.add('show'), 10);
      
      const close = () => {
        modal.classList.remove('show');
        setTimeout(() => modal.remove(), 300);
      };
      
      modal.querySelector('.notification-btn-cancel').onclick = () => {
        close();
        if (onCancel) onCancel();
      };
      
      modal.querySelector('.notification-btn-confirm').onclick = () => {
        close();
        if (onConfirm) onConfirm();
      };
      
      modal.querySelector('.notification-modal-overlay').onclick = () => {
        close();
        if (onCancel) onCancel();
      };
    }

    getIcon(type) {
      const icons = {
        success: '✅',
        error: '❌',
        warning: '⚠️',
        info: 'ℹ️'
      };
      return icons[type] || icons.info;
    }

    escapeHtml(text) {
      const div = document.createElement('div');
      div.textContent = text;
      return div.innerHTML;
    }

    clear() {
      if (this.container) {
        this.container.innerHTML = '';
      }
    }
  }

  if (typeof window !== 'undefined') {
    window.notificationManager = new NotificationManager();
    
    window.showNotification = (message, type, duration) => {
      return window.notificationManager.show(message, type, duration);
    };
    
    window.showSuccess = (message, duration) => {
      return window.notificationManager.success(message, duration);
    };
    
    window.showError = (message, duration) => {
      return window.notificationManager.error(message, duration);
    };
    
    window.showWarning = (message, duration) => {
      return window.notificationManager.warning(message, duration);
    };
    
    window.showInfo = (message, duration) => {
      return window.notificationManager.info(message, duration);
    };
    
    window.showConfirm = (message, onConfirm, onCancel) => {
      return window.notificationManager.confirm(message, onConfirm, onCancel);
    };
  }
})();
