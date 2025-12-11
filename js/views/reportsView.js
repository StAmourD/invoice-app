/* ========================================
   Invoice App - Reports View
   ======================================== */

/**
 * Reports View - Time Entry and Invoice Reports
 */
const ReportsView = {
  currentReport: 'time-entries', // 'time-entries' or 'invoices'
  timeEntries: [],
  invoices: [],
  clients: [],
  services: [],

  // Time Entry Report Filters
  timeFilters: {
    startDate: '',
    endDate: '',
    clientId: '',
    billableStatus: 'all', // 'all', 'billable', 'non-billable'
    invoiceStatus: 'all', // 'all', 'invoiced', 'unbilled'
  },

  // Invoice Report Filters
  invoiceFilters: {
    startDate: '',
    endDate: '',
    clientId: '',
    paidStatus: 'all', // 'all', 'paid', 'unpaid'
  },

  /**
   * Render the reports view
   */
  async render(container, headerActions) {
    // Add report type selector to header
    headerActions.innerHTML = `
      <div class="report-type-selector">
        <button class="btn ${
          this.currentReport === 'time-entries'
            ? 'btn-primary'
            : 'btn-secondary'
        }" id="time-report-btn">
          Time Entries
        </button>
        <button class="btn ${
          this.currentReport === 'invoices' ? 'btn-primary' : 'btn-secondary'
        }" id="invoice-report-btn">
          Invoices
        </button>
      </div>
    `;

    // Load data
    await this.loadData();

    // Render current report
    this.renderReport(container);

    // Setup event listeners
    this.setupHeaderListeners(headerActions);
    this.setupEventListeners(container);
  },

  /**
   * Load all data needed for reports
   */
  async loadData() {
    try {
      this.timeEntries = await TimeEntryStore.getAll();
      this.invoices = await InvoiceStore.getAll();
      this.clients = await ClientStore.getAll();
      this.services = await ServiceStore.getAll();
    } catch (error) {
      console.error('Failed to load report data:', error);
      Toast.error('Failed to load reports', error.message);
    }
  },

  /**
   * Render the current report
   */
  renderReport(container) {
    if (this.currentReport === 'time-entries') {
      this.renderTimeEntryReport(container);
    } else {
      this.renderInvoiceReport(container);
    }
  },

  /**
   * Render Time Entry Report
   */
  renderTimeEntryReport(container) {
    const clientOptions = this.clients
      .map((c) => `<option value="${c.id}">${escapeHtml(c.name)}</option>`)
      .join('');

    container.innerHTML = `
      <div class="card">
        <div class="card-header">
          <h3>Time Entry Report</h3>
        </div>
        <div class="card-body">
          <!-- Filters -->
          <div class="report-filters">
            <div class="form-row">
              <div class="form-group">
                <label class="form-label">Start Date</label>
                <input type="date" id="time-start-date" class="form-control" value="${
                  this.timeFilters.startDate
                }">
              </div>
              <div class="form-group">
                <label class="form-label">End Date</label>
                <input type="date" id="time-end-date" class="form-control" value="${
                  this.timeFilters.endDate
                }">
              </div>
              <div class="form-group">
                <label class="form-label">Client</label>
                <select id="time-client" class="form-control">
                  <option value="">All Clients</option>
                  ${clientOptions}
                </select>
              </div>
              <div class="form-group">
                <label class="form-label">Billable</label>
                <select id="time-billable" class="form-control">
                  <option value="all">All</option>
                  <option value="billable">Billable Only</option>
                  <option value="non-billable">Non-Billable Only</option>
                </select>
              </div>
              <div class="form-group">
                <label class="form-label">Invoice Status</label>
                <select id="time-invoice-status" class="form-control">
                  <option value="all">All</option>
                  <option value="invoiced">Invoiced</option>
                  <option value="unbilled">Unbilled</option>
                </select>
              </div>
            </div>
            <div class="filter-actions">
              <button class="btn btn-primary" id="apply-time-filters-btn">Apply Filters</button>
              <button class="btn btn-secondary" id="reset-time-filters-btn">Reset</button>
              <button class="btn btn-success" id="export-time-csv-btn">Export CSV</button>
            </div>
          </div>

          <!-- Results Table -->
          <div id="time-report-results">
            ${this.renderTimeEntryResults()}
          </div>
        </div>
      </div>
    `;

    // Set filter values
    document.getElementById('time-client').value = this.timeFilters.clientId;
    document.getElementById('time-billable').value =
      this.timeFilters.billableStatus;
    document.getElementById('time-invoice-status').value =
      this.timeFilters.invoiceStatus;
  },

  /**
   * Render time entry results table
   */
  renderTimeEntryResults() {
    const filtered = this.applyTimeFilters();

    if (filtered.length === 0) {
      return '<div class="empty-state"><p>No time entries match the selected filters.</p></div>';
    }

    const clientMap = new Map(this.clients.map((c) => [c.id, c]));
    const serviceMap = new Map(this.services.map((s) => [s.id, s]));

    let totalHours = 0;
    let totalAmount = 0;

    const rows = filtered
      .map((entry) => {
        const client = clientMap.get(entry.clientId);
        const service = serviceMap.get(entry.serviceId);
        const hours = calculateDuration(entry.startTime, entry.endTime);
        const rate = service?.rate || 0;
        const amount = hours * rate;

        totalHours += hours;
        totalAmount += amount;

        const statusBadge = entry.invoiceId
          ? '<span class="badge badge-info">Invoiced</span>'
          : '<span class="badge badge-secondary">Unbilled</span>';

        return `
        <tr>
          <td>${formatDate(entry.startTime)}</td>
          <td>${escapeHtml(client?.name || 'Unknown')}</td>
          <td>${escapeHtml(service?.name || 'Unknown')}</td>
          <td>${escapeHtml(entry.description)}</td>
          <td>${formatHours(hours)}</td>
          <td>${formatCurrency(rate)}</td>
          <td>${formatCurrency(amount)}</td>
          <td>${statusBadge}</td>
        </tr>
      `;
      })
      .join('');

    return `
      <table class="table">
        <thead>
          <tr>
            <th>Date</th>
            <th>Client</th>
            <th>Service</th>
            <th>Description</th>
            <th>Hours</th>
            <th>Rate</th>
            <th>Amount</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody>
          ${rows}
        </tbody>
        <tfoot>
          <tr class="table-footer">
            <td colspan="4" class="text-right"><strong>Totals:</strong></td>
            <td><strong>${formatHours(totalHours)}</strong></td>
            <td></td>
            <td><strong>${formatCurrency(totalAmount)}</strong></td>
            <td></td>
          </tr>
        </tfoot>
      </table>
    `;
  },

  /**
   * Apply time entry filters
   */
  applyTimeFilters() {
    return this.timeEntries.filter((entry) => {
      // Date range filter
      if (this.timeFilters.startDate) {
        const entryDate = new Date(entry.startTime).toISOString().split('T')[0];
        if (entryDate < this.timeFilters.startDate) return false;
      }
      if (this.timeFilters.endDate) {
        const entryDate = new Date(entry.startTime).toISOString().split('T')[0];
        if (entryDate > this.timeFilters.endDate) return false;
      }

      // Client filter
      if (
        this.timeFilters.clientId &&
        entry.clientId !== this.timeFilters.clientId
      ) {
        return false;
      }

      // Billable status filter
      if (this.timeFilters.billableStatus === 'billable' && !entry.billable)
        return false;
      if (this.timeFilters.billableStatus === 'non-billable' && entry.billable)
        return false;

      // Invoice status filter
      if (this.timeFilters.invoiceStatus === 'invoiced' && !entry.invoiceId)
        return false;
      if (this.timeFilters.invoiceStatus === 'unbilled' && entry.invoiceId)
        return false;

      return true;
    });
  },

  /**
   * Render Invoice Report
   */
  renderInvoiceReport(container) {
    const clientOptions = this.clients
      .map((c) => `<option value="${c.id}">${escapeHtml(c.name)}</option>`)
      .join('');

    container.innerHTML = `
      <div class="card">
        <div class="card-header">
          <h3>Invoice Report</h3>
        </div>
        <div class="card-body">
          <!-- Filters -->
          <div class="report-filters">
            <div class="form-row">
              <div class="form-group">
                <label class="form-label">Start Date</label>
                <input type="date" id="invoice-start-date" class="form-control" value="${
                  this.invoiceFilters.startDate
                }">
              </div>
              <div class="form-group">
                <label class="form-label">End Date</label>
                <input type="date" id="invoice-end-date" class="form-control" value="${
                  this.invoiceFilters.endDate
                }">
              </div>
              <div class="form-group">
                <label class="form-label">Client</label>
                <select id="invoice-client" class="form-control">
                  <option value="">All Clients</option>
                  ${clientOptions}
                </select>
              </div>
              <div class="form-group">
                <label class="form-label">Payment Status</label>
                <select id="invoice-paid-status" class="form-control">
                  <option value="all">All</option>
                  <option value="paid">Paid Only</option>
                  <option value="unpaid">Unpaid Only</option>
                </select>
              </div>
            </div>
            <div class="filter-actions">
              <button class="btn btn-primary" id="apply-invoice-filters-btn">Apply Filters</button>
              <button class="btn btn-secondary" id="reset-invoice-filters-btn">Reset</button>
              <button class="btn btn-success" id="export-invoice-csv-btn">Export CSV</button>
            </div>
          </div>

          <!-- Results Table -->
          <div id="invoice-report-results">
            ${this.renderInvoiceResults()}
          </div>
        </div>
      </div>
    `;

    // Set filter values
    document.getElementById('invoice-client').value =
      this.invoiceFilters.clientId;
    document.getElementById('invoice-paid-status').value =
      this.invoiceFilters.paidStatus;
  },

  /**
   * Render invoice results table
   */
  renderInvoiceResults() {
    const filtered = this.applyInvoiceFilters();

    if (filtered.length === 0) {
      return '<div class="empty-state"><p>No invoices match the selected filters.</p></div>';
    }

    const clientMap = new Map(this.clients.map((c) => [c.id, c]));
    const today = getTodayISO();

    let totalAmount = 0;
    let paidAmount = 0;
    let unpaidAmount = 0;

    const rows = filtered
      .map((invoice) => {
        const client = clientMap.get(invoice.clientId);
        const isOverdue = !invoice.paid && invoice.dueDate < today;

        totalAmount += invoice.total;
        if (invoice.paid) {
          paidAmount += invoice.total;
        } else {
          unpaidAmount += invoice.total;
        }

        let statusBadge;
        if (invoice.paid) {
          statusBadge = '<span class="badge badge-success">Paid</span>';
        } else if (isOverdue) {
          statusBadge = '<span class="badge badge-danger">Overdue</span>';
        } else {
          statusBadge = '<span class="badge badge-warning">Unpaid</span>';
        }

        return `
        <tr>
          <td>
            <a href="#/invoices/${invoice.id}" class="invoice-link">
              ${escapeHtml(invoice.invoiceNumber)}
            </a>
          </td>
          <td>${escapeHtml(client?.name || 'Unknown')}</td>
          <td>${formatDate(invoice.issueDate)}</td>
          <td>${formatDate(invoice.dueDate)}</td>
          <td>${formatCurrency(invoice.total)}</td>
          <td>${statusBadge}</td>
        </tr>
      `;
      })
      .join('');

    return `
      <table class="table">
        <thead>
          <tr>
            <th>Invoice #</th>
            <th>Client</th>
            <th>Issue Date</th>
            <th>Due Date</th>
            <th>Amount</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody>
          ${rows}
        </tbody>
        <tfoot>
          <tr class="table-footer">
            <td colspan="4" class="text-right"><strong>Total:</strong></td>
            <td><strong>${formatCurrency(totalAmount)}</strong></td>
            <td></td>
          </tr>
          <tr class="table-footer">
            <td colspan="4" class="text-right"><strong>Paid:</strong></td>
            <td><strong>${formatCurrency(paidAmount)}</strong></td>
            <td></td>
          </tr>
          <tr class="table-footer">
            <td colspan="4" class="text-right"><strong>Unpaid:</strong></td>
            <td><strong>${formatCurrency(unpaidAmount)}</strong></td>
            <td></td>
          </tr>
        </tfoot>
      </table>
    `;
  },

  /**
   * Apply invoice filters
   */
  applyInvoiceFilters() {
    return this.invoices.filter((invoice) => {
      // Date range filter (by issue date)
      if (
        this.invoiceFilters.startDate &&
        invoice.issueDate < this.invoiceFilters.startDate
      ) {
        return false;
      }
      if (
        this.invoiceFilters.endDate &&
        invoice.issueDate > this.invoiceFilters.endDate
      ) {
        return false;
      }

      // Client filter
      if (
        this.invoiceFilters.clientId &&
        invoice.clientId !== this.invoiceFilters.clientId
      ) {
        return false;
      }

      // Paid status filter
      if (this.invoiceFilters.paidStatus === 'paid' && !invoice.paid)
        return false;
      if (this.invoiceFilters.paidStatus === 'unpaid' && invoice.paid)
        return false;

      return true;
    });
  },

  /**
   * Setup header event listeners
   */
  setupHeaderListeners(headerActions) {
    headerActions
      .querySelector('#time-report-btn')
      .addEventListener('click', () => {
        this.currentReport = 'time-entries';
        App.refresh();
      });

    headerActions
      .querySelector('#invoice-report-btn')
      .addEventListener('click', () => {
        this.currentReport = 'invoices';
        App.refresh();
      });
  },

  /**
   * Setup event listeners
   */
  setupEventListeners(container) {
    if (this.currentReport === 'time-entries') {
      this.setupTimeEntryListeners(container);
    } else {
      this.setupInvoiceListeners(container);
    }
  },

  /**
   * Setup time entry report listeners
   */
  setupTimeEntryListeners(container) {
    const applyBtn = container.querySelector('#apply-time-filters-btn');
    const resetBtn = container.querySelector('#reset-time-filters-btn');
    const exportBtn = container.querySelector('#export-time-csv-btn');

    applyBtn.addEventListener('click', () => {
      this.timeFilters.startDate =
        container.querySelector('#time-start-date').value;
      this.timeFilters.endDate =
        container.querySelector('#time-end-date').value;
      this.timeFilters.clientId = container.querySelector('#time-client').value;
      this.timeFilters.billableStatus =
        container.querySelector('#time-billable').value;
      this.timeFilters.invoiceStatus = container.querySelector(
        '#time-invoice-status'
      ).value;

      container.querySelector('#time-report-results').innerHTML =
        this.renderTimeEntryResults();
    });

    resetBtn.addEventListener('click', () => {
      this.timeFilters = {
        startDate: '',
        endDate: '',
        clientId: '',
        billableStatus: 'all',
        invoiceStatus: 'all',
      };
      App.refresh();
    });

    exportBtn.addEventListener('click', () => {
      this.exportTimeEntryCSV();
    });
  },

  /**
   * Setup invoice report listeners
   */
  setupInvoiceListeners(container) {
    const applyBtn = container.querySelector('#apply-invoice-filters-btn');
    const resetBtn = container.querySelector('#reset-invoice-filters-btn');
    const exportBtn = container.querySelector('#export-invoice-csv-btn');

    applyBtn.addEventListener('click', () => {
      this.invoiceFilters.startDate = container.querySelector(
        '#invoice-start-date'
      ).value;
      this.invoiceFilters.endDate =
        container.querySelector('#invoice-end-date').value;
      this.invoiceFilters.clientId =
        container.querySelector('#invoice-client').value;
      this.invoiceFilters.paidStatus = container.querySelector(
        '#invoice-paid-status'
      ).value;

      container.querySelector('#invoice-report-results').innerHTML =
        this.renderInvoiceResults();
    });

    resetBtn.addEventListener('click', () => {
      this.invoiceFilters = {
        startDate: '',
        endDate: '',
        clientId: '',
        paidStatus: 'all',
      };
      App.refresh();
    });

    exportBtn.addEventListener('click', () => {
      this.exportInvoiceCSV();
    });
  },

  /**
   * Export time entry report to CSV
   */
  exportTimeEntryCSV() {
    const filtered = this.applyTimeFilters();
    const clientMap = new Map(this.clients.map((c) => [c.id, c]));
    const serviceMap = new Map(this.services.map((s) => [s.id, s]));

    const exportData = filtered.map((entry) => {
      const client = clientMap.get(entry.clientId);
      const service = serviceMap.get(entry.serviceId);
      const hours = calculateDuration(entry.startTime, entry.endTime);
      const rate = service?.rate || 0;
      const amount = hours * rate;

      return {
        date: formatDate(entry.startTime),
        client: client?.name || 'Unknown',
        service: service?.name || 'Unknown',
        description: entry.description,
        hours: hours.toFixed(2),
        rate: rate.toFixed(2),
        amount: amount.toFixed(2),
        status: entry.invoiceId ? 'Invoiced' : 'Unbilled',
      };
    });

    const columns = [
      { key: 'date', label: 'Date' },
      { key: 'client', label: 'Client' },
      { key: 'service', label: 'Service' },
      { key: 'description', label: 'Description' },
      { key: 'hours', label: 'Hours' },
      { key: 'rate', label: 'Rate' },
      { key: 'amount', label: 'Amount' },
      { key: 'status', label: 'Status' },
    ];

    exportToCSV(exportData, columns, 'time-entry-report');
  },

  /**
   * Export invoice report to CSV
   */
  exportInvoiceCSV() {
    const filtered = this.applyInvoiceFilters();
    const clientMap = new Map(this.clients.map((c) => [c.id, c]));
    const today = getTodayISO();

    const exportData = filtered.map((invoice) => {
      const client = clientMap.get(invoice.clientId);
      const isOverdue = !invoice.paid && invoice.dueDate < today;

      let status;
      if (invoice.paid) {
        status = 'Paid';
      } else if (isOverdue) {
        status = 'Overdue';
      } else {
        status = 'Unpaid';
      }

      return {
        invoiceNumber: invoice.invoiceNumber,
        client: client?.name || 'Unknown',
        issueDate: formatDate(invoice.issueDate),
        dueDate: formatDate(invoice.dueDate),
        amount: invoice.total.toFixed(2),
        status: status,
      };
    });

    const columns = [
      { key: 'invoiceNumber', label: 'Invoice #' },
      { key: 'client', label: 'Client' },
      { key: 'issueDate', label: 'Issue Date' },
      { key: 'dueDate', label: 'Due Date' },
      { key: 'amount', label: 'Amount' },
      { key: 'status', label: 'Status' },
    ];

    exportToCSV(exportData, columns, 'invoice-report');
  },
};
