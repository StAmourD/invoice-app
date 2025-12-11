/* ========================================
   Invoice App - Toast Component
   ======================================== */

/**
 * Toast Component - Notification toasts
 */
const Toast = {
  container: null,

  /**
   * Initialize toast container
   */
  init() {
    this.container = document.getElementById('toast-container');
  },

  /**
   * Show a toast notification
   * @param {object} options - Toast options
   * @param {string} options.type - Toast type: 'success', 'error', 'warning', 'info'
   * @param {string} options.title - Toast title
   * @param {string} options.message - Toast message
   * @param {number} options.duration - Duration in ms (0 for permanent)
   */
  show({ type = 'info', title, message, duration = 4000 }) {
    this.init();

    const icons = {
      success: '✓',
      error: '✕',
      warning: '⚠',
      info: 'ℹ',
    };

    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.innerHTML = `
            <span class="toast-icon">${icons[type]}</span>
            <div class="toast-content">
                <div class="toast-title">${escapeHtml(title)}</div>
                ${
                  message
                    ? `<div class="toast-message">${escapeHtml(message)}</div>`
                    : ''
                }
            </div>
            <button class="toast-close" aria-label="Close">&times;</button>
        `;

    // Add close handler
    toast.querySelector('.toast-close').addEventListener('click', () => {
      this.dismiss(toast);
    });

    this.container.appendChild(toast);

    // Auto dismiss
    if (duration > 0) {
      setTimeout(() => {
        this.dismiss(toast);
      }, duration);
    }

    return toast;
  },

  /**
   * Dismiss a toast
   * @param {HTMLElement} toast - Toast element
   */
  dismiss(toast) {
    toast.classList.add('toast-exit');
    setTimeout(() => {
      if (toast.parentNode) {
        toast.parentNode.removeChild(toast);
      }
    }, 300);
  },

  /**
   * Show success toast
   * @param {string} title - Toast title
   * @param {string} message - Toast message
   */
  success(title, message = '') {
    return this.show({ type: 'success', title, message });
  },

  /**
   * Show error toast
   * @param {string} title - Toast title
   * @param {string} message - Toast message
   */
  error(title, message = '') {
    return this.show({ type: 'error', title, message, duration: 6000 });
  },

  /**
   * Show warning toast
   * @param {string} title - Toast title
   * @param {string} message - Toast message
   */
  warning(title, message = '') {
    return this.show({ type: 'warning', title, message });
  },

  /**
   * Show info toast
   * @param {string} title - Toast title
   * @param {string} message - Toast message
   */
  info(title, message = '') {
    return this.show({ type: 'info', title, message });
  },
};
