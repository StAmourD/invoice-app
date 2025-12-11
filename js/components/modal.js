/* ========================================
   Invoice App - Modal Component
   ======================================== */

/**
 * Modal Component - Reusable modal dialog
 */
const Modal = {
  overlay: null,
  container: null,
  titleEl: null,
  contentEl: null,

  /**
   * Initialize modal references
   */
  init() {
    this.overlay = document.getElementById('modal-overlay');
    this.container = document.getElementById('modal-container');
    this.titleEl = document.getElementById('modal-title');
    this.contentEl = document.getElementById('modal-content');
  },

  /**
   * Open modal with content
   * @param {object} options - Modal options
   * @param {string} options.title - Modal title
   * @param {string} options.content - Modal HTML content
   * @param {string} options.size - Modal size: 'default', 'lg', 'xl'
   * @param {Function} options.onClose - Callback when modal closes
   */
  open({ title, content, size = 'default', onClose = null }) {
    this.init();

    this.titleEl.textContent = title;
    this.contentEl.innerHTML = content;

    // Set size
    this.container.classList.remove('modal-lg', 'modal-xl');
    if (size === 'lg') {
      this.container.classList.add('modal-lg');
    } else if (size === 'xl') {
      this.container.classList.add('modal-xl');
    }

    // Store close callback
    this._onClose = onClose;

    // Show modal
    this.overlay.classList.remove('hidden');
    document.body.style.overflow = 'hidden';

    // Add keyboard event listener for ESC key
    this._keydownHandler = (e) => {
      if (e.key === 'Escape') {
        this.close();
      }
    };
    document.addEventListener('keydown', this._keydownHandler);

    // Focus first input
    setTimeout(() => {
      const firstInput = this.contentEl.querySelector(
        'input, select, textarea'
      );
      if (firstInput) {
        firstInput.focus();
      }
    }, 100);
  },

  /**
   * Close the modal
   */
  close() {
    this.init();

    this.overlay.classList.add('hidden');
    document.body.style.overflow = '';

    // Remove keyboard event listener
    if (this._keydownHandler) {
      document.removeEventListener('keydown', this._keydownHandler);
      this._keydownHandler = null;
    }

    // Call close callback
    if (this._onClose) {
      this._onClose();
      this._onClose = null;
    }
  },

  /**
   * Update modal content
   * @param {string} content - New HTML content
   */
  updateContent(content) {
    this.init();
    this.contentEl.innerHTML = content;
  },

  /**
   * Show a confirmation dialog
   * @param {object} options - Confirmation options
   * @param {string} options.title - Dialog title
   * @param {string} options.message - Confirmation message
   * @param {string} options.icon - Emoji icon
   * @param {string} options.confirmText - Confirm button text
   * @param {string} options.confirmClass - Confirm button class
   * @param {Function} options.onConfirm - Callback when confirmed
   */
  confirm({
    title = 'Confirm',
    message = 'Are you sure?',
    icon = '⚠️',
    confirmText = 'Confirm',
    confirmClass = 'btn-danger',
    onConfirm,
  }) {
    const content = `
            <div class="confirm-dialog">
                <div class="confirm-icon">${icon}</div>
                <h4 class="confirm-title">${escapeHtml(title)}</h4>
                <p class="confirm-message">${escapeHtml(message)}</p>
                <div class="confirm-actions">
                    <button type="button" class="btn btn-secondary" id="confirm-cancel">Cancel</button>
                    <button type="button" class="btn ${confirmClass}" id="confirm-ok">${escapeHtml(
      confirmText
    )}</button>
                </div>
            </div>
        `;

    this.open({ title: '', content });

    // Hide the header for confirm dialogs
    document.querySelector('.modal-header').style.display = 'none';

    // Setup event listeners
    document.getElementById('confirm-cancel').addEventListener('click', () => {
      document.querySelector('.modal-header').style.display = '';
      this.close();
    });

    document.getElementById('confirm-ok').addEventListener('click', () => {
      document.querySelector('.modal-header').style.display = '';
      this.close();
      if (onConfirm) {
        onConfirm();
      }
    });
  },
};
