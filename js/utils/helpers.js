/* ========================================
   Invoice App - Helper Utilities
   ======================================== */

/**
 * Generate a unique UUID v4
 * @returns {string} UUID string
 */
function generateUUID() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

/**
 * Format a date to locale string (en-US)
 * @param {string|Date} date - Date to format
 * @param {object} options - Intl.DateTimeFormat options
 * @returns {string} Formatted date string
 */
function formatDate(date, options = {}) {
  if (!date) return '';
  const d = typeof date === 'string' ? new Date(date) : date;
  const defaultOptions = {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  };
  return d.toLocaleDateString('en-US', { ...defaultOptions, ...options });
}

/**
 * Format a date for input[type="date"]
 * @param {string|Date} date - Date to format
 * @returns {string} YYYY-MM-DD format
 */
function formatDateForInput(date) {
  if (!date) return '';
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toISOString().split('T')[0];
}

/**
 * Format a datetime for input[type="datetime-local"]
 * @param {string|Date} date - Date to format
 * @returns {string} YYYY-MM-DDTHH:MM format
 */
function formatDateTimeForInput(date) {
  if (!date) return '';
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toISOString().slice(0, 16);
}

/**
 * Format currency (USD)
 * @param {number} amount - Amount to format
 * @returns {string} Formatted currency string
 */
function formatCurrency(amount) {
  if (amount === null || amount === undefined) return '$0.00';
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(amount);
}

/**
 * Calculate duration in hours between two dates
 * @param {string|Date} start - Start datetime
 * @param {string|Date} end - End datetime
 * @returns {number} Duration in hours (decimal)
 */
function calculateDuration(start, end) {
  const startDate = typeof start === 'string' ? new Date(start) : start;
  const endDate = typeof end === 'string' ? new Date(end) : end;
  const diffMs = endDate - startDate;
  return diffMs / (1000 * 60 * 60); // Convert to hours
}

/**
 * Format hours to display string (e.g., "2.5 hrs")
 * @param {number} hours - Hours as decimal
 * @returns {string} Formatted hours string
 */
function formatHours(hours) {
  if (hours === null || hours === undefined) return '0 hrs';
  const rounded = Math.round(hours * 100) / 100;
  return `${rounded} ${rounded === 1 ? 'hr' : 'hrs'}`;
}

/**
 * Generate invoice number
 * @param {number} sequence - Sequence number
 * @returns {string} Invoice number (INV-YYYY-NNN)
 */
function generateInvoiceNumber(sequence) {
  const year = new Date().getFullYear();
  const paddedSeq = String(sequence).padStart(3, '0');
  return `INV-${year}-${paddedSeq}`;
}

/**
 * Add days to a date
 * @param {Date} date - Starting date
 * @param {number} days - Days to add
 * @returns {Date} New date
 */
function addDays(date, days) {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}

/**
 * Check if a date is overdue
 * @param {string|Date} dueDate - Due date to check
 * @returns {boolean} True if overdue
 */
function isOverdue(dueDate) {
  if (!dueDate) return false;
  const due = typeof dueDate === 'string' ? new Date(dueDate) : dueDate;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return due < today;
}

/**
 * Get today's date as ISO string (date only)
 * @returns {string} YYYY-MM-DD format
 */
function getTodayISO() {
  return new Date().toISOString().split('T')[0];
}

/**
 * Get current ISO timestamp
 * @returns {string} ISO 8601 timestamp
 */
function getISOTimestamp() {
  return new Date().toISOString();
}

/**
 * Sanitize filename by removing invalid characters
 * @param {string} filename - Original filename
 * @returns {string} Sanitized filename
 */
function sanitizeFilename(filename) {
  return filename
    .replace(/[<>:"/\\|?*]/g, '-')
    .replace(/\s+/g, '-')
    .toLowerCase();
}

/**
 * Debounce function
 * @param {Function} func - Function to debounce
 * @param {number} wait - Wait time in ms
 * @returns {Function} Debounced function
 */
function debounce(func, wait) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

/**
 * Deep clone an object
 * @param {object} obj - Object to clone
 * @returns {object} Cloned object
 */
function deepClone(obj) {
  return JSON.parse(JSON.stringify(obj));
}

/**
 * Escape HTML to prevent XSS
 * @param {string} text - Text to escape
 * @returns {string} Escaped text
 */
function escapeHtml(text) {
  if (!text) return '';
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

/**
 * Parse query string to object
 * @param {string} queryString - Query string
 * @returns {object} Parsed parameters
 */
function parseQueryString(queryString) {
  const params = {};
  const pairs = queryString.replace(/^\?/, '').split('&');
  for (const pair of pairs) {
    const [key, value] = pair.split('=');
    if (key) {
      params[decodeURIComponent(key)] = decodeURIComponent(value || '');
    }
  }
  return params;
}

// Export for use in other modules (if using ES modules in future)
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    generateUUID,
    formatDate,
    formatDateForInput,
    formatDateTimeForInput,
    formatCurrency,
    calculateDuration,
    formatHours,
    generateInvoiceNumber,
    addDays,
    isOverdue,
    getTodayISO,
    getISOTimestamp,
    sanitizeFilename,
    debounce,
    deepClone,
    escapeHtml,
    parseQueryString,
  };
}
