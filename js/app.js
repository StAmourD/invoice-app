/* ========================================
   Invoice App - Main Application Entry
   ======================================== */

/**
 * Main Application Controller
 */
const App = {
  currentView: 'dashboard',
  db: null,

  /**
   * Initialize the application
   */
  async init() {
    console.log('Invoice App initializing...');

    try {
      // Initialize database
      await Database.init();
      console.log('Database initialized');

      // Seed sample data if empty
      await this.seedDataIfEmpty();

      // Initialize router
      this.initRouter();

      // Setup global event listeners
      this.setupEventListeners();

      // Navigate to initial route
      this.handleRouteChange();

      console.log('App initialized successfully');
    } catch (error) {
      console.error('Failed to initialize app:', error);
      Toast.error('Failed to initialize application', error.message);
    }
  },

  /**
   * Initialize hash-based router
   */
  initRouter() {
    window.addEventListener('hashchange', () => this.handleRouteChange());

    // Set default route if none
    if (!window.location.hash) {
      window.location.hash = '#/dashboard';
    }
  },

  /**
   * Handle route changes
   */
  handleRouteChange() {
    const hash = window.location.hash || '#/dashboard';
    const route = hash.replace('#/', '') || 'dashboard';

    // Parse route and params
    const [view, ...params] = route.split('/');

    this.navigateTo(view, params);
  },

  /**
   * Navigate to a view
   * @param {string} view - View name
   * @param {array} params - Route parameters
   */
  navigateTo(view, params = []) {
    this.currentView = view;

    // Update active nav link
    document.querySelectorAll('.nav-link').forEach((link) => {
      link.classList.remove('active');
      if (link.dataset.view === view) {
        link.classList.add('active');
      }
    });

    // Render the view
    this.renderView(view, params);
  },

  /**
   * Render a view
   * @param {string} view - View name
   * @param {array} params - Route parameters
   */
  async renderView(view, params = []) {
    const mainView = document.getElementById('main-view');
    const pageTitle = document.getElementById('page-title');
    const headerActions = document.getElementById('header-actions');

    // Show loading state
    mainView.innerHTML = `
            <div class="loading-container">
                <div class="spinner spinner-lg"></div>
                <p>Loading...</p>
            </div>
        `;
    headerActions.innerHTML = '';

    try {
      switch (view) {
        case 'dashboard':
          pageTitle.textContent = 'Dashboard';
          await DashboardView.render(mainView, headerActions);
          break;

        case 'clients':
          pageTitle.textContent = 'Clients';
          await ClientsView.render(mainView, headerActions);
          break;

        case 'services':
          pageTitle.textContent = 'Services';
          await ServicesView.render(mainView, headerActions);
          break;

        case 'time-entries':
          pageTitle.textContent = 'Time Entries';
          await TimeEntriesView.render(mainView, headerActions);
          break;

        case 'invoices':
          if (params[0] === 'new') {
            pageTitle.textContent = 'Create Invoice';
            await InvoicesView.renderCreate(mainView, headerActions);
          } else if (params[0]) {
            pageTitle.textContent = 'Invoice Details';
            await InvoicesView.renderDetail(mainView, headerActions, params[0]);
          } else {
            pageTitle.textContent = 'Invoices';
            await InvoicesView.render(mainView, headerActions);
          }
          break;

        case 'reports':
          pageTitle.textContent = 'Reports';
          await ReportsView.render(mainView, headerActions);
          break;

        case 'settings':
          pageTitle.textContent = 'Settings';
          await SettingsView.render(mainView, headerActions);
          break;

        default:
          pageTitle.textContent = 'Not Found';
          mainView.innerHTML = `
                        <div class="empty-state">
                            <div class="empty-state-icon">🔍</div>
                            <h3 class="empty-state-title">Page Not Found</h3>
                            <p class="empty-state-description">The page you're looking for doesn't exist.</p>
                            <a href="#/dashboard" class="btn btn-primary">Go to Dashboard</a>
                        </div>
                    `;
      }
    } catch (error) {
      console.error('Failed to render view:', error);
      mainView.innerHTML = `
                <div class="empty-state">
                    <div class="empty-state-icon">⚠️</div>
                    <h3 class="empty-state-title">Error Loading View</h3>
                    <p class="empty-state-description">${escapeHtml(
                      error.message
                    )}</p>
                    <button class="btn btn-primary" onclick="App.renderView('${view}', ${JSON.stringify(
        params
      )})">
                        Try Again
                    </button>
                </div>
            `;
    }
  },

  /**
   * Setup global event listeners
   */
  setupEventListeners() {
    // Close modal on overlay click
    document.getElementById('modal-overlay').addEventListener('click', (e) => {
      if (e.target.id === 'modal-overlay') {
        Modal.close();
      }
    });

    // Close modal on close button
    document.getElementById('modal-close').addEventListener('click', () => {
      Modal.close();
    });

    // Close modal on Escape key
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        Modal.close();
      }
    });
  },

  /**
   * Seed sample data if database is empty
   */
  async seedDataIfEmpty() {
    const clients = await ClientStore.getAll();

    if (clients.length === 0) {
      console.log('Seeding sample data...');

      // Sample clients
      const sampleClients = [
        {
          id: generateUUID(),
          name: 'Acme Corporation',
          address: '123 Main St, Springfield, IL 62701',
          email: 'billing@acme.com',
          daysToPay: 30,
          createdAt: getISOTimestamp(),
        },
        {
          id: generateUUID(),
          name: 'TechStart Inc',
          address: '456 Innovation Blvd, Austin, TX 78701',
          email: 'accounts@techstart.io',
          daysToPay: 15,
          createdAt: getISOTimestamp(),
        },
      ];

      // Sample services
      const sampleServices = [
        {
          id: generateUUID(),
          name: 'Web Development',
          rate: 150.0,
          billable: true,
          createdAt: getISOTimestamp(),
        },
        {
          id: generateUUID(),
          name: 'UI/UX Design',
          rate: 125.0,
          billable: true,
          createdAt: getISOTimestamp(),
        },
        {
          id: generateUUID(),
          name: 'Project Management',
          rate: 100.0,
          billable: true,
          createdAt: getISOTimestamp(),
        },
      ];

      // Insert sample data
      for (const client of sampleClients) {
        await ClientStore.add(client);
      }

      for (const service of sampleServices) {
        await ServiceStore.add(service);
      }

      // Sample time entries
      const sampleTimeEntries = [
        {
          id: generateUUID(),
          clientId: sampleClients[0].id,
          serviceId: sampleServices[0].id,
          description: 'Homepage redesign implementation',
          startTime: '2025-12-01T09:00:00',
          endTime: '2025-12-01T12:00:00',
          billable: true,
          invoiceId: null,
          createdAt: getISOTimestamp(),
        },
        {
          id: generateUUID(),
          clientId: sampleClients[0].id,
          serviceId: sampleServices[1].id,
          description: 'Logo concepts and mockups',
          startTime: '2025-12-02T10:00:00',
          endTime: '2025-12-02T14:00:00',
          billable: true,
          invoiceId: null,
          createdAt: getISOTimestamp(),
        },
        {
          id: generateUUID(),
          clientId: sampleClients[1].id,
          serviceId: sampleServices[0].id,
          description: 'API integration work',
          startTime: '2025-12-03T08:00:00',
          endTime: '2025-12-03T11:30:00',
          billable: true,
          invoiceId: null,
          createdAt: getISOTimestamp(),
        },
        {
          id: generateUUID(),
          clientId: sampleClients[1].id,
          serviceId: sampleServices[2].id,
          description: 'Sprint planning meeting',
          startTime: '2025-12-04T14:00:00',
          endTime: '2025-12-04T15:00:00',
          billable: false,
          invoiceId: null,
          createdAt: getISOTimestamp(),
        },
      ];

      for (const entry of sampleTimeEntries) {
        await TimeEntryStore.add(entry);
      }

      // Sample company settings
      await SettingsStore.set('companyName', 'My Company');
      await SettingsStore.set(
        'companyAddress',
        '789 Business Ave, New York, NY 10001'
      );
      await SettingsStore.set('companyEmail', 'invoices@mycompany.com');

      console.log('Sample data seeded successfully');
    }
  },

  /**
   * Refresh current view
   */
  refresh() {
    this.handleRouteChange();
  },
};

// Initialize app when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  App.init();
});
