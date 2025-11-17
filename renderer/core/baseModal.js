/**
 * BaseModal - Base class cho tất cả modal components
 * Giảm code duplication và cung cấp common functionality
 */

(function() {
  const logger = window.logger || console;

  class BaseModal {
    constructor(config = {}) {
      this.modalId = config.modalId || 'baseModal';
      this.modalClass = config.modalClass || 'base-modal';
      this.title = config.title || 'Modal';
      this.modal = null;
      this.isInitialized = false;
      this.onCloseCallback = null;
      this.eventListeners = []; // Track listeners for cleanup
    }

    /**
     * Initialize modal
     */
    async init(onCloseCallback) {
      this.onCloseCallback = onCloseCallback;
      
      if (!this.isInitialized) {
        this.createModal();
        this.setupEventListeners();
        this.isInitialized = true;
      }

      // Always call onInit to refresh data
      await this.onInit();
      this.show();
    }

    /**
     * Hook method - override trong subclass
     */
    async onInit() {
      // Override in subclass
    }

    /**
     * Get modal body HTML - override trong subclass
     */
    getModalBodyHTML() {
      return '<div>Override getModalBodyHTML() in subclass</div>';
    }

    /**
     * Create modal structure
     */
    createModal() {
      // Extract base class name without '-modal' suffix for child elements
      // e.g., 'person-manager-modal' -> 'person-manager'
      const baseClass = this.modalClass.replace(/-modal$/, '');
      
      const modalHtml = `
        <div id="${this.modalId}" class="${this.modalClass}" style="display: none;">
          <div class="${baseClass}-overlay"></div>
          <div class="${baseClass}-container">
            <div class="${baseClass}-header">
              <h2>${this.title}</h2>
              <button class="${baseClass}-close">✕</button>
            </div>
            <div class="${baseClass}-body">
              ${this.getModalBodyHTML()}
            </div>
          </div>
        </div>
      `;

      document.body.insertAdjacentHTML('beforeend', modalHtml);
      this.modal = document.getElementById(this.modalId);
      
      if (!this.modal) {
        console.error(`❌ Failed to create modal: ${this.modalId}`);
      } else {
        console.log(`✅ Modal created: ${this.modalId}`);
      }
    }

    /**
     * Setup event listeners
     */
    setupEventListeners() {
      if (!this.modal) {
        console.error(`❌ Cannot setup listeners: modal not found for ${this.modalId}`);
        return;
      }

      const baseClass = this.modalClass.replace(/-modal$/, '');
      const closeBtn = this.modal.querySelector(`.${baseClass}-close`);
      if (closeBtn) {
        this.addEventListener(closeBtn, 'click', () => this.hide());
        console.log(`✅ Close button listener added for ${this.modalId}`);
      } else {
        console.warn(`⚠️ Close button not found for ${this.modalId}`);
      }

      // Hook for subclass to add more listeners
      this.setupCustomEventListeners();
    }

    /**
     * Hook method - override trong subclass để add custom listeners
     */
    setupCustomEventListeners() {
      // Override in subclass
    }

    /**
     * Add event listener và track để cleanup sau
     */
    addEventListener(element, event, handler, options) {
      if (!element) return;
      
      element.addEventListener(event, handler, options);
      this.eventListeners.push({ element, event, handler, options });
    }

    /**
     * Add delegated event listener
     */
    addDelegatedListener(parentElement, selector, event, handler) {
      if (!parentElement) return;

      const delegatedHandler = (e) => {
        const target = e.target.closest(selector);
        if (target && parentElement.contains(target)) {
          handler.call(target, e);
        }
      };

      this.addEventListener(parentElement, event, delegatedHandler);
    }

    /**
     * Show modal
     */
    show() {
      if (this.modal) {
        this.modal.style.display = 'block';
        logger.debug(`Modal ${this.modalId} shown`);
      }
    }

    /**
     * Hide modal
     */
    hide() {
      if (this.modal) {
        this.modal.style.display = 'none';
        logger.debug(`Modal ${this.modalId} hidden`);
      }

      // Hook for custom cleanup (không xóa event listeners)
      this.onCleanup();

      if (this.onCloseCallback && typeof this.onCloseCallback === 'function') {
        this.onCloseCallback();
      }
    }

    /**
     * Cleanup event listeners - chỉ gọi khi destroy modal
     */
    cleanup() {
      // Remove all tracked event listeners
      this.eventListeners.forEach(({ element, event, handler, options }) => {
        if (element) {
          element.removeEventListener(event, handler, options);
        }
      });
      this.eventListeners = [];

      // Hook for custom cleanup
      this.onCleanup();
    }

    /**
     * Destroy modal completely
     */
    destroy() {
      this.cleanup();
      
      if (this.modal && this.modal.parentNode) {
        this.modal.parentNode.removeChild(this.modal);
      }
      
      this.modal = null;
      this.isInitialized = false;
    }

    /**
     * Hook method - override trong subclass
     */
    onCleanup() {
      // Override in subclass
    }

    /**
     * Update modal body content
     */
    updateBody(html) {
      if (!this.modal) return;

      const baseClass = this.modalClass.replace(/-modal$/, '');
      const body = this.modal.querySelector(`.${baseClass}-body`);
      if (body) {
        body.innerHTML = html;
      }
    }

    /**
     * Get element trong modal
     */
    querySelector(selector) {
      return this.modal ? this.modal.querySelector(selector) : null;
    }

    /**
     * Get all elements trong modal
     */
    querySelectorAll(selector) {
      return this.modal ? this.modal.querySelectorAll(selector) : [];
    }
  }

  // Export
  if (typeof window !== 'undefined') {
    window.BaseModal = BaseModal;
    console.log('✅ BaseModal initialized');
  }

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = { BaseModal };
  }
})();
