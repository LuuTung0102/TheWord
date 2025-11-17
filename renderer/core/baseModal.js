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
      this.eventListeners = [];
    }

    async init(onCloseCallback) {
      this.onCloseCallback = onCloseCallback;
      
      if (!this.isInitialized) {
        this.createModal();
        this.setupEventListeners();
        this.isInitialized = true;
      }
      await this.onInit();
      this.show();
    }

    async onInit() {}

    getModalBodyHTML() {
      return '<div>Override getModalBodyHTML() in subclass</div>';
    }

    createModal() {
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
      this.setupCustomEventListeners();
    }

    setupCustomEventListeners() {}

    addEventListener(element, event, handler, options) {
      if (!element) return;
      
      element.addEventListener(event, handler, options);
      this.eventListeners.push({ element, event, handler, options });
    }

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
    show() {
      if (this.modal) {
        this.modal.style.display = 'block';
        logger.debug(`Modal ${this.modalId} shown`);
      }
    }
    hide() {
      if (this.modal) {
        this.modal.style.display = 'none';
        logger.debug(`Modal ${this.modalId} hidden`);
      }
      this.onCleanup();
      if (this.onCloseCallback && typeof this.onCloseCallback === 'function') {
        this.onCloseCallback();
      }
    }

    cleanup() {
      this.eventListeners.forEach(({ element, event, handler, options }) => {
        if (element) {
          element.removeEventListener(event, handler, options);
        }
      });
      this.eventListeners = [];
      this.onCleanup();
    }

    destroy() {
      this.cleanup();
      
      if (this.modal && this.modal.parentNode) {
        this.modal.parentNode.removeChild(this.modal);
      }
      
      this.modal = null;
      this.isInitialized = false;
    }

    onCleanup() {
    }

    updateBody(html) {
      if (!this.modal) return;

      const baseClass = this.modalClass.replace(/-modal$/, '');
      const body = this.modal.querySelector(`.${baseClass}-body`);
      if (body) {
        body.innerHTML = html;
      }
    }

    querySelector(selector) {
      return this.modal ? this.modal.querySelector(selector) : null;
    }

    querySelectorAll(selector) {
      return this.modal ? this.modal.querySelectorAll(selector) : [];
    }
  }

  if (typeof window !== 'undefined') {
    window.BaseModal = BaseModal;
    console.log('✅ BaseModal initialized');
  }

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = { BaseModal };
  }
})();
