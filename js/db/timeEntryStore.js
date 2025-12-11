/* ========================================
   Invoice App - Time Entry Store
   ======================================== */

/**
 * Time Entry Store - CRUD operations for time entries
 */
const TimeEntryStore = {
  STORE_NAME: 'timeEntries',

  /**
   * Add a new time entry
   * @param {object} entry - Time entry data
   * @returns {Promise<object>}
   */
  add(entry) {
    return new Promise((resolve, reject) => {
      const db = Database.getDB();
      const transaction = db.transaction([this.STORE_NAME], 'readwrite');
      const store = transaction.objectStore(this.STORE_NAME);

      const newEntry = {
        ...entry,
        id: entry.id || generateUUID(),
        invoiceId: entry.invoiceId || null,
        createdAt: entry.createdAt || getISOTimestamp(),
        updatedAt: getISOTimestamp(),
      };

      const request = store.add(newEntry);

      request.onsuccess = () => {
        Backup.autoSave().catch(console.error);
        resolve(newEntry);
      };

      request.onerror = (event) => {
        reject(event.target.error);
      };
    });
  },

  /**
   * Update an existing time entry
   * @param {object} entry - Time entry data with id
   * @returns {Promise<object>}
   */
  update(entry) {
    return new Promise((resolve, reject) => {
      const db = Database.getDB();
      const transaction = db.transaction([this.STORE_NAME], 'readwrite');
      const store = transaction.objectStore(this.STORE_NAME);

      const updatedEntry = {
        ...entry,
        updatedAt: getISOTimestamp(),
      };

      const request = store.put(updatedEntry);

      request.onsuccess = () => {
        Backup.autoSave().catch(console.error);
        resolve(updatedEntry);
      };

      request.onerror = (event) => {
        reject(event.target.error);
      };
    });
  },

  /**
   * Delete a time entry by id
   * @param {string} id - Time entry id
   * @returns {Promise<void>}
   */
  delete(id) {
    return new Promise((resolve, reject) => {
      const db = Database.getDB();
      const transaction = db.transaction([this.STORE_NAME], 'readwrite');
      const store = transaction.objectStore(this.STORE_NAME);
      const request = store.delete(id);

      request.onsuccess = () => {
        Backup.autoSave().catch(console.error);
        resolve();
      };

      request.onerror = (event) => {
        reject(event.target.error);
      };
    });
  },

  /**
   * Get a time entry by id
   * @param {string} id - Time entry id
   * @returns {Promise<object|null>}
   */
  getById(id) {
    return new Promise((resolve, reject) => {
      const db = Database.getDB();
      const transaction = db.transaction([this.STORE_NAME], 'readonly');
      const store = transaction.objectStore(this.STORE_NAME);
      const request = store.get(id);

      request.onsuccess = () => {
        resolve(request.result || null);
      };

      request.onerror = (event) => {
        reject(event.target.error);
      };
    });
  },

  /**
   * Get all time entries
   * @returns {Promise<array>}
   */
  getAll() {
    return new Promise((resolve, reject) => {
      const db = Database.getDB();
      const transaction = db.transaction([this.STORE_NAME], 'readonly');
      const store = transaction.objectStore(this.STORE_NAME);
      const request = store.getAll();

      request.onsuccess = () => {
        // Sort by start time descending
        const entries = request.result.sort(
          (a, b) => new Date(b.startTime) - new Date(a.startTime)
        );
        resolve(entries);
      };

      request.onerror = (event) => {
        reject(event.target.error);
      };
    });
  },

  /**
   * Get time entries by client
   * @param {string} clientId - Client id
   * @returns {Promise<array>}
   */
  async getByClient(clientId) {
    const entries = await this.getAll();
    return entries.filter((e) => e.clientId === clientId);
  },

  /**
   * Get time entries by invoice
   * @param {string} invoiceId - Invoice id
   * @returns {Promise<array>}
   */
  async getByInvoice(invoiceId) {
    const entries = await this.getAll();
    return entries.filter((e) => e.invoiceId === invoiceId);
  },

  /**
   * Get unbilled time entries for a client
   * @param {string} clientId - Client id
   * @returns {Promise<array>}
   */
  async getUnbilledByClient(clientId) {
    const entries = await this.getAll();
    return entries.filter(
      (e) => e.clientId === clientId && e.billable && !e.invoiceId
    );
  },

  /**
   * Get time entries within a date range
   * @param {string} startDate - Start date (YYYY-MM-DD)
   * @param {string} endDate - End date (YYYY-MM-DD)
   * @returns {Promise<array>}
   */
  async getByDateRange(startDate, endDate) {
    const entries = await this.getAll();
    const start = new Date(startDate);
    const end = new Date(endDate);
    end.setHours(23, 59, 59, 999);

    return entries.filter((e) => {
      const entryDate = new Date(e.startTime);
      return entryDate >= start && entryDate <= end;
    });
  },

  /**
   * Link time entries to an invoice
   * @param {array} entryIds - Array of time entry ids
   * @param {string} invoiceId - Invoice id
   * @returns {Promise<void>}
   */
  async linkToInvoice(entryIds, invoiceId) {
    for (const id of entryIds) {
      const entry = await this.getById(id);
      if (entry) {
        entry.invoiceId = invoiceId;
        await this.update(entry);
      }
    }
  },

  /**
   * Unlink time entries from an invoice
   * @param {string} invoiceId - Invoice id
   * @returns {Promise<void>}
   */
  async unlinkFromInvoice(invoiceId) {
    const entries = await this.getByInvoice(invoiceId);
    for (const entry of entries) {
      entry.invoiceId = null;
      await this.update(entry);
    }
  },
};
