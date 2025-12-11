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
