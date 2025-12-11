/* ========================================
   Invoice App - Settings Store
   ======================================== */

/**
 * Settings Store - CRUD operations for app settings
 */
const SettingsStore = {
  STORE_NAME: 'settings',

  /**
   * Get a setting by key
   * @param {string} key - Setting key
   * @returns {Promise<any>}
   */
  get(key) {
    return new Promise((resolve, reject) => {
      const db = Database.getDB();
      const transaction = db.transaction([this.STORE_NAME], 'readonly');
      const store = transaction.objectStore(this.STORE_NAME);
      const request = store.get(key);

      request.onsuccess = () => {
        resolve(request.result ? request.result.value : null);
      };

      request.onerror = (event) => {
        reject(event.target.error);
      };
    });
  },

  /**
   * Set a setting value
   * @param {string} key - Setting key
   * @param {any} value - Setting value
   * @returns {Promise<void>}
   */
  set(key, value) {
    return new Promise((resolve, reject) => {
      const db = Database.getDB();
      const transaction = db.transaction([this.STORE_NAME], 'readwrite');
      const store = transaction.objectStore(this.STORE_NAME);
      const request = store.put({ key, value });

      request.onsuccess = () => {
        // Trigger backup on settings change
        Backup.autoSave().catch(console.error);
        resolve();
      };

      request.onerror = (event) => {
        reject(event.target.error);
      };
    });
  },

  /**
   * Delete a setting
   * @param {string} key - Setting key
   * @returns {Promise<void>}
   */
  delete(key) {
    return new Promise((resolve, reject) => {
      const db = Database.getDB();
      const transaction = db.transaction([this.STORE_NAME], 'readwrite');
      const store = transaction.objectStore(this.STORE_NAME);
      const request = store.delete(key);

      request.onsuccess = () => resolve();
      request.onerror = (event) => reject(event.target.error);
    });
  },

  /**
   * Get all settings
   * @returns {Promise<array>}
   */
  getAll() {
    return new Promise((resolve, reject) => {
      const db = Database.getDB();
      const transaction = db.transaction([this.STORE_NAME], 'readonly');
      const store = transaction.objectStore(this.STORE_NAME);
      const request = store.getAll();

      request.onsuccess = () => {
        resolve(request.result);
      };

      request.onerror = (event) => {
        reject(event.target.error);
      };
    });
  },

  /**
   * Get multiple settings as an object
   * @param {array} keys - Array of setting keys
   * @returns {Promise<object>}
   */
  async getMultiple(keys) {
    const result = {};
    for (const key of keys) {
      result[key] = await this.get(key);
    }
    return result;
  },
};
