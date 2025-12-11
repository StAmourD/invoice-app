/* ========================================
   Invoice App - Dashboard View
   ======================================== */

/**
 * Dashboard View - Summary cards and recent invoices
 */
const DashboardView = {
  invoices: [],
  clients: [],
  recentInvoices: [],

  /**
   * Render the dashboard view
   */
  async render(container, headerActions) {
    // Add quick action buttons
    headerActions.innerHTML = `
      <button class="btn btn-primary" id="new-time-entry-btn">
        <span>+</span> New Time Entry
      </button>
      <button class="btn btn-secondary" id="new-invoice-btn">
        <span>+</span> New Invoice
      </button>
    `;

    // Show loading state
    Spinner.show(container, 'Loading dashboard...');

    // Load data
    await this.loadData();

    // Hide loading state
    Spinner.hide(container);

    // Render dashboard
    this.renderDashboard(container);

    // Setup event listeners
    this.setupEventListeners(container);
  },

  /**
   * Load all data needed for dashboard
   */
  async loadData() {
    try {
      this.invoices = await InvoiceStore.getAll();
      this.clients = await ClientStore.getAll();

      // Get recent invoices (last 10, sorted by issue date descending)
      this.recentInvoices = [...this.invoices]
        .sort(
          (a, b) => parseLocalDate(b.issueDate) - parseLocalDate(a.issueDate)
        )
        .slice(0, 10);
    } catch (error) {
      console.error('Failed to load dashboard data:', error);
      Toast.error('Failed to load dashboard', error.message);
    }
  },

  /**
   * Calculate summary statistics
   */
  calculateStats() {
    const today = getTodayISO();

    const totalRevenue = this.invoices
      .filter((inv) => inv.paid)
      .reduce((sum, inv) => sum + inv.total, 0);

    const outstanding = this.invoices
      .filter((inv) => !inv.paid)
      .reduce((sum, inv) => sum + inv.total, 0);

    const overdue = this.invoices
      .filter((inv) => !inv.paid && inv.dueDate < today)
      .reduce((sum, inv) => sum + inv.total, 0);

    return { totalRevenue, outstanding, overdue };
  },

  /**
   * Render dashboard UI
   */
  renderDashboard(container) {
    const { totalRevenue, outstanding, overdue } = this.calculateStats();

    if (this.invoices.length === 0) {
      container.innerHTML = `
        <div class="empty-state">
          <div class="empty-state-icon">📊</div>
          <h3 class="empty-state-title">Welcome to Your Dashboard</h3>
          <p class="empty-state-description">Create your first invoice to see statistics here.</p>
          <a href="#/invoices/new" class="btn btn-primary">Create Invoice</a>
        </div>
      `;
      return;
    }

    container.innerHTML = `
      <div class="dashboard-container">
        <!-- Summary Cards -->
        <div class="summary-cards">
          <div class="summary-card card-revenue">
            <div class="summary-card-icon">💰</div>
            <div class="summary-card-content">
              <div class="summary-card-label">Total Revenue</div>
              <div class="summary-card-value">${formatCurrency(
                totalRevenue
              )}</div>
              <div class="summary-card-subtitle">From paid invoices</div>
            </div>
          </div>
          
          <div class="summary-card card-outstanding">
            <div class="summary-card-icon">⏳</div>
            <div class="summary-card-content">
              <div class="summary-card-label">Outstanding</div>
              <div class="summary-card-value">${formatCurrency(
                outstanding
              )}</div>
              <div class="summary-card-subtitle">Awaiting payment</div>
            </div>
          </div>
          
          <div class="summary-card card-overdue">
            <div class="summary-card-icon">⚠️</div>
            <div class="summary-card-content">
              <div class="summary-card-label">Overdue</div>
              <div class="summary-card-value">${formatCurrency(overdue)}</div>
              <div class="summary-card-subtitle">Past due date</div>
            </div>
          </div>
        </div>

        <!-- Recent Invoices -->
        <div class="card">
          <div class="card-header">
            <h3>Recent Invoices</h3>
          </div>
          ${this.renderRecentInvoices()}
        </div>
      </div>
    `;
  },

  /**
   * Render recent invoices list
   */
  renderRecentInvoices() {
    if (this.recentInvoices.length === 0) {
      return '<div class="card-body"><p class="text-muted">No invoices yet.</p></div>';
    }

    const today = getTodayISO();
    const clientMap = new Map(this.clients.map((c) => [c.id, c]));

    const rows = this.recentInvoices
      .map((invoice) => {
        const client = clientMap.get(invoice.clientId);
        const isOverdue = !invoice.paid && invoice.dueDate < today;

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
          <td>${escapeHtml(client?.name || 'Unknown Client')}</td>
          <td>${formatDate(invoice.dueDate)}</td>
          <td>${formatCurrency(invoice.total)}</td>
          <td>${statusBadge}</td>
          <td class="actions">
            <button 
              class="btn btn-sm ${
                invoice.paid ? 'btn-secondary' : 'btn-primary'
              } toggle-paid-btn" 
              data-id="${invoice.id}"
              data-paid="${invoice.paid}"
            >
              ${invoice.paid ? 'Mark Unpaid' : 'Mark Paid'}
            </button>
          </td>
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
            <th>Due Date</th>
            <th>Amount</th>
            <th>Status</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          ${rows}
        </tbody>
      </table>
    `;
  },

  /**
   * Setup event listeners
   */
  setupEventListeners(container) {
    // New Time Entry button
    document
      .getElementById('new-time-entry-btn')
      .addEventListener('click', () => {
        window.location.hash = '#/time-entries/new';
      });

    // New Invoice button
    document.getElementById('new-invoice-btn').addEventListener('click', () => {
      window.location.hash = '#/invoices/new';
    });

    // Toggle paid status buttons
    container.querySelectorAll('.toggle-paid-btn').forEach((btn) => {
      btn.addEventListener('click', async (e) => {
        const invoiceId = e.target.dataset.id;
        const currentPaid = e.target.dataset.paid === 'true';
        await this.togglePaidStatus(invoiceId, !currentPaid);
      });
    });
  },

  /**
   * Toggle invoice paid status
   */
  async togglePaidStatus(invoiceId, newPaidStatus) {
    try {
      const invoice = await InvoiceStore.get(invoiceId);
      if (!invoice) {
        Toast.error('Error', 'Invoice not found');
        return;
      }

      invoice.paid = newPaidStatus;
      await InvoiceStore.update(invoice);

      Toast.success(
        'Status Updated',
        `Invoice marked as ${newPaidStatus ? 'paid' : 'unpaid'}`
      );

      // Refresh dashboard
      App.refresh();
    } catch (error) {
      console.error('Failed to toggle paid status:', error);
      Toast.error('Failed to update invoice', error.message);
    }
  },
};
