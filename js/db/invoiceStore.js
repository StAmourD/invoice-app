/* ========================================
   Invoice App - Invoice Store
   ======================================== */

/**
 * Invoice Store - CRUD operations for invoices
 */
const InvoiceStore = {
  STORE_NAME: 'invoices',

  /**
   * Add a new invoice
   * @param {object} invoice - Invoice data
   * @returns {Promise<object>}
   */
  add(invoice) {
    return new Promise((resolve, reject) => {
      const db = Database.getDB();
      const transaction = db.transaction([this.STORE_NAME], 'readwrite');
      const store = transaction.objectStore(this.STORE_NAME);

      const newInvoice = {
        ...invoice,
        id: invoice.id || generateUUID(),
        paid: invoice.paid || false,
        version: invoice.version || null,
        timeEntryIds: invoice.timeEntryIds || [],
        createdAt: invoice.createdAt || getISOTimestamp(),
        updatedAt: getISOTimestamp(),
      };

      const request = store.add(newInvoice);

      request.onsuccess = () => {
        Backup.autoSave().catch(console.error);
        resolve(newInvoice);
      };

      request.onerror = (event) => {
        reject(event.target.error);
      };
    });
  },

  /**
   * Update an existing invoice
   * @param {object} invoice - Invoice data with id
   * @returns {Promise<object>}
   */
  update(invoice) {
    return new Promise((resolve, reject) => {
      const db = Database.getDB();
      const transaction = db.transaction([this.STORE_NAME], 'readwrite');
      const store = transaction.objectStore(this.STORE_NAME);

      const updatedInvoice = {
        ...invoice,
        updatedAt: getISOTimestamp(),
      };

      const request = store.put(updatedInvoice);

      request.onsuccess = () => {
        Backup.autoSave().catch(console.error);
        resolve(updatedInvoice);
      };

      request.onerror = (event) => {
        reject(event.target.error);
      };
    });
  },

  /**
   * Delete an invoice by id
   * @param {string} id - Invoice id
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
   * Get an invoice by id
   * @param {string} id - Invoice id
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
   * Convenience alias for getById
   * @param {string} id - Invoice id
   * @returns {Promise<object|null>}
   */
  get(id) {
    return this.getById(id);
  },

  /**
   * Get all invoices
   * @returns {Promise<array>}
   */
  getAll() {
    return new Promise((resolve, reject) => {
      const db = Database.getDB();
      const transaction = db.transaction([this.STORE_NAME], 'readonly');
      const store = transaction.objectStore(this.STORE_NAME);
      const request = store.getAll();

      request.onsuccess = () => {
        // Sort by issue date descending
        const invoices = request.result.sort(
          (a, b) => new Date(b.issueDate) - new Date(a.issueDate)
        );
        resolve(invoices);
      };

      request.onerror = (event) => {
        reject(event.target.error);
      };
    });
  },

  /**
   * Get invoices by client
   * @param {string} clientId - Client id
   * @returns {Promise<array>}
   */
  async getByClient(clientId) {
    const invoices = await this.getAll();
    return invoices.filter((i) => i.clientId === clientId);
  },

  /**
   * Get invoices by paid status
   * @param {boolean} paid - Paid status
   * @returns {Promise<array>}
   */
  async getByPaidStatus(paid) {
    const invoices = await this.getAll();
    return invoices.filter((i) => i.paid === paid);
  },

  /**
   * Get overdue invoices
   * @returns {Promise<array>}
   */
  async getOverdue() {
    const invoices = await this.getAll();
    return invoices.filter((i) => !i.paid && isOverdue(i.dueDate));
  },

  /**
   * Get invoices within a date range
   * @param {string} startDate - Start date (YYYY-MM-DD)
   * @param {string} endDate - End date (YYYY-MM-DD)
   * @returns {Promise<array>}
   */
  async getByDateRange(startDate, endDate) {
    const invoices = await this.getAll();
    const start = new Date(startDate);
    const end = new Date(endDate);
    end.setHours(23, 59, 59, 999);

    return invoices.filter((i) => {
      const issueDate = new Date(i.issueDate);
      return issueDate >= start && issueDate <= end;
    });
  },

  /**
   * Toggle paid status
   * @param {string} id - Invoice id
   * @returns {Promise<object>}
   */
  async togglePaid(id) {
    const invoice = await this.getById(id);
    if (!invoice) {
      throw new Error('Invoice not found');
    }
    invoice.paid = !invoice.paid;
    if (invoice.paid) {
      invoice.paidDate = getTodayISO();
    } else {
      invoice.paidDate = null;
    }
    return this.update(invoice);
  },

  /**
   * Get the next invoice number
   * @returns {Promise<string>}
   */
  async getNextInvoiceNumber() {
    const invoices = await this.getAll();
    const year = new Date().getFullYear();

    // Find highest number for current year
    let maxNum = 0;
    const yearPrefix = `INV-${year}-`;

    for (const inv of invoices) {
      if (inv.invoiceNumber && inv.invoiceNumber.startsWith(yearPrefix)) {
        const numPart = parseInt(inv.invoiceNumber.replace(yearPrefix, ''), 10);
        if (numPart > maxNum) {
          maxNum = numPart;
        }
      }
    }

    return generateInvoiceNumber(maxNum + 1);
  },

  /**
   * Increment invoice version letter (null -> A -> B -> C, etc.)
   * @param {string} currentVersion - Current version letter (or null/empty for first version)
   * @returns {string} Next version letter
   */
  incrementVersion(currentVersion = null) {
    if (!currentVersion || currentVersion === '') {
      return 'A';
    }
    const charCode = currentVersion.charCodeAt(0);
    if (charCode >= 90) {
      // Z is 90, wrap around or extend
      return 'A';
    }
    return String.fromCharCode(charCode + 1);
  },

  /**
   * Add time entries to an invoice
   * @param {string} invoiceId - Invoice id
   * @param {array} timeEntryIds - Array of time entry ids to add
   * @returns {Promise<object>} Updated invoice
   */
  async addTimeEntries(invoiceId, timeEntryIds) {
    const invoice = await this.getById(invoiceId);
    if (!invoice) {
      throw new Error('Invoice not found');
    }

    // Merge new entries with existing ones (avoid duplicates)
    const existingIds = new Set(invoice.timeEntryIds || []);
    const newIds = timeEntryIds.filter((id) => !existingIds.has(id));

    if (newIds.length === 0) {
      return invoice; // No new entries to add
    }

    // Update version
    const updatedInvoice = await this.update({
      ...invoice,
      timeEntryIds: [...(invoice.timeEntryIds || []), ...newIds],
      version: this.incrementVersion(invoice.version),
    });

    // Link time entries to invoice
    await TimeEntryStore.linkToInvoice(newIds, invoiceId);

    return updatedInvoice;
  },

  /**
   * Remove time entries from an invoice
   * @param {string} invoiceId - Invoice id
   * @param {array} timeEntryIds - Array of time entry ids to remove
   * @returns {Promise<object>} Updated invoice
   */
  async removeTimeEntries(invoiceId, timeEntryIds) {
    const invoice = await this.getById(invoiceId);
    if (!invoice) {
      throw new Error('Invoice not found');
    }

    const idsToRemove = new Set(timeEntryIds);
    const remainingIds = (invoice.timeEntryIds || []).filter(
      (id) => !idsToRemove.has(id)
    );

    // Unlink time entries from invoice
    for (const id of timeEntryIds) {
      await TimeEntryStore.unlinkEntry(id);
    }

    // Update invoice
    const updatedInvoice = await this.update({
      ...invoice,
      timeEntryIds: remainingIds,
      version: this.incrementVersion(invoice.version),
    });

    return updatedInvoice;
  },

  /**
   * Calculate totals for dashboard
   * @returns {Promise<object>}
   */
  async calculateTotals() {
    const invoices = await this.getAll();

    let totalRevenue = 0;
    let totalPaid = 0;
    let totalOutstanding = 0;
    let totalOverdue = 0;

    for (const invoice of invoices) {
      totalRevenue += invoice.total || 0;
      if (invoice.paid) {
        totalPaid += invoice.total || 0;
      } else {
        totalOutstanding += invoice.total || 0;
        if (isOverdue(invoice.dueDate)) {
          totalOverdue += invoice.total || 0;
        }
      }
    }

    return {
      totalRevenue,
      totalPaid,
      totalOutstanding,
      totalOverdue,
      invoiceCount: invoices.length,
      paidCount: invoices.filter((i) => i.paid).length,
      unpaidCount: invoices.filter((i) => !i.paid).length,
      overdueCount: invoices.filter((i) => !i.paid && isOverdue(i.dueDate))
        .length,
    };
  },
};
