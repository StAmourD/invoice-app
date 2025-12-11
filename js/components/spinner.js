/**
 * Spinner Component
 * Reusable loading spinner for async operations
 */

const Spinner = {
  /**
   * Show spinner in a container
   * @param {HTMLElement} container - Element to show spinner in
   * @param {string} message - Optional loading message
   */
  show(container, message = 'Loading...') {
    if (!container) return;

    const spinner = document.createElement('div');
    spinner.className = 'spinner-overlay';
    spinner.innerHTML = `
      <div class="spinner-container">
        <div class="spinner"></div>
        <p class="spinner-message">${message}</p>
      </div>
    `;

    container.style.position = 'relative';
    container.appendChild(spinner);
  },

  /**
   * Hide spinner from a container
   * @param {HTMLElement} container - Element to remove spinner from
   */
  hide(container) {
    if (!container) return;

    const spinner = container.querySelector('.spinner-overlay');
    if (spinner) {
      spinner.remove();
    }
  },

  /**
   * Show global spinner (full screen)
   * @param {string} message - Optional loading message
   */
  showGlobal(message = 'Loading...') {
    let overlay = document.querySelector('.spinner-overlay-global');

    if (!overlay) {
      overlay = document.createElement('div');
      overlay.className = 'spinner-overlay-global';
      overlay.innerHTML = `
        <div class="spinner-container">
          <div class="spinner"></div>
          <p class="spinner-message">${message}</p>
        </div>
      `;
      document.body.appendChild(overlay);
    }
  },

  /**
   * Hide global spinner
   */
  hideGlobal() {
    const overlay = document.querySelector('.spinner-overlay-global');
    if (overlay) {
      overlay.remove();
    }
  },

  /**
   * Wrap an async function with spinner
   * @param {Function} asyncFn - Async function to wrap
   * @param {HTMLElement} container - Container to show spinner in
   * @param {string} message - Loading message
   * @returns {Function} Wrapped function
   */
  wrap(asyncFn, container, message) {
    return async (...args) => {
      try {
        this.show(container, message);
        return await asyncFn(...args);
      } finally {
        this.hide(container);
      }
    };
  },
};
