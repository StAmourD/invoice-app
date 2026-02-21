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
      // Show loading screen
      this.showLoadingScreen('Initializing application...');

      // Initialize database
      await Database.init();
      console.log('Database initialized');

      // Initialize backup system
      await Backup.init();
      console.log('Backup system initialized');

      // Update sidebar Google Drive status widget
      this.updateSidebarDriveStatus();

      // Check if database is empty
      const isEmpty = await Database.isEmpty();

      if (isEmpty) {
        console.log('Database is empty, checking for backup options...');
        await this.handleEmptyDatabase();
      } else {
        // Database has data - merge the latest Drive backup so any records
        // added while offline are preserved alongside Drive changes.
        if (GoogleDrive.isAuthorized) {
          console.log(
            'User is signed in, merging latest backup from Google Drive...',
          );
          this.showLoadingScreen('Syncing data from Google Drive...');
          try {
            const mergeResult = await Backup.mergeFromDrive();
            const total = mergeResult.added + mergeResult.updated;
            if (total > 0) {
              Toast.success(
                'Data Synced',
                `${total} record${total !== 1 ? 's' : ''} synced from Google Drive`,
              );
            }
          } catch (error) {
            console.error('Failed to merge from Google Drive:', error);
            // Non-fatal - user already has local data
          }
        }
      }

      // Hide loading screen
      this.hideLoadingScreen();

      // Initialize router
      this.initRouter();

      // Setup global event listeners
      this.setupEventListeners();

      // Navigate to initial route
      this.handleRouteChange();

      console.log('App initialized successfully');
    } catch (error) {
      console.error('Failed to initialize app:', error);
      this.hideLoadingScreen();
      Toast.error('Failed to initialize application', error.message);
    }
  },

  /**
   * Handle empty database - prompt user to load backup or sample data
   */
  async handleEmptyDatabase() {
    const backupStatus = await Backup.getStatus();

    // If Google Drive is configured and authorized, try to load backup
    if (backupStatus.isConfigured && backupStatus.isAuthorized) {
      this.showLoadingScreen('Loading backup from Google Drive...');
      try {
        const loaded = await Backup.loadLatestBackup();
        if (loaded) {
          Toast.success(
            'Welcome Back',
            'Your data has been restored from Google Drive',
          );
          return;
        }
        // No backup found, continue to prompt
        console.log('No backup found, will prompt for sample data');
      } catch (error) {
        console.error('Failed to load backup:', error);
        Toast.error('Backup Load Failed', error.message);
      }
    }

    // If Google Drive is configured but not authorized, prompt user
    if (backupStatus.isConfigured && !backupStatus.isAuthorized) {
      this.hideLoadingScreen(); // Hide loading screen before showing modal
      await this.showSignInPrompt();
      return;
    }

    // No Google Drive configured, just load sample data
    await this.seedDataIfEmpty();
  },

  /**
   * Show sign-in prompt modal
   */
  async showSignInPrompt() {
    return new Promise((resolve) => {
      Modal.open({
        title: 'Welcome to Invoice App',
        content: `
          <div style="padding: 1rem 0;">
            <p style="margin-bottom: 1.5rem;">Would you like to sign in with Google to restore your data from backup?</p>
            <div style="display: flex; gap: 1rem; flex-direction: column;">
              <button class="btn btn-success" id="modal-signin-btn" style="width: 100%;">
                <svg width="18" height="18" viewBox="0 0 24 24" style="vertical-align: middle; margin-right: 0.5rem;">
                  <path fill="currentColor" d="M21.35 11.1h-9.17v2.73h6.51c-.33 3.81-3.5 5.44-6.5 5.44C8.36 19.27 5 16.25 5 12c0-4.1 3.2-7.27 7.2-7.27 3.09 0 4.9 1.97 4.9 1.97L19 4.72S16.56 2 12.1 2C6.42 2 2.03 6.8 2.03 12c0 5.05 4.13 10 10.22 10 5.35 0 9.25-3.67 9.25-9.09 0-1.15-.15-1.81-.15-1.81z"/>
                </svg>
                Sign in with Google
              </button>
              <button class="btn btn-secondary" id="modal-sample-btn" style="width: 100%;">
                Continue with Sample Data
              </button>
              <button class="btn btn-outline" id="modal-empty-btn" style="width: 100%;">
                Continue with Empty Data
              </button>
            </div>
          </div>
        `,
        size: 'default',
      });

      // Handle sign-in button
      document
        .getElementById('modal-signin-btn')
        .addEventListener('click', async () => {
          Modal.close();
          this.showLoadingScreen('Connecting to Google Drive...');
          try {
            const connected = await Backup.connectGoogleDrive();
            if (connected) {
              // Check if there are existing backups in Google Drive
              this.showLoadingScreen('Checking for backups...');
              const hasBackups = await Backup.hasBackups();
              this.hideLoadingScreen();

              if (hasBackups) {
                // Ask user what to do
                await this.showRestoreOrUploadPrompt();
              } else {
                // No backups found, load sample data
                Toast.info('No Backup Found', 'Loading sample data instead');
                this.showLoadingScreen('Loading sample data...');
                await this.seedDataIfEmpty();
                this.hideLoadingScreen();
              }
            } else {
              // Connection failed, load sample data
              this.hideLoadingScreen();
              await this.seedDataIfEmpty();
            }
          } catch (error) {
            console.error('Sign-in error:', error);
            this.hideLoadingScreen();
            Toast.error('Sign-in Failed', error.message);
            await this.seedDataIfEmpty();
          }
          resolve();
        });

      // Handle sample data button
      document
        .getElementById('modal-sample-btn')
        .addEventListener('click', async () => {
          Modal.close();
          this.showLoadingScreen('Loading sample data...');
          await this.seedDataIfEmpty();
          this.hideLoadingScreen();
          resolve();
        });

      // Handle empty data button
      document
        .getElementById('modal-empty-btn')
        .addEventListener('click', async () => {
          Modal.close();
          Toast.info(
            'Ready to Go',
            'Start adding your clients, services, and invoices',
          );
          resolve();
        });
    });
  },

  /**
   * Show restore or upload prompt modal
   */
  async showRestoreOrUploadPrompt() {
    return new Promise((resolve) => {
      Modal.open({
        title: 'Backup Found on Google Drive',
        content: `
          <div style="padding: 1rem 0;">
            <p style="margin-bottom: 1.5rem;">We found existing backups in your Google Drive. What would you like to do?</p>
            <div style="display: flex; gap: 1rem; flex-direction: column;">
              <button class="btn btn-success" id="modal-restore-btn" style="width: 100%;">
                <span style="font-weight: 600;">Restore from Google Drive</span>
                <small style="display: block; margin-top: 0.25rem; opacity: 0.9;">Load your backed-up data</small>
              </button>
              <button class="btn btn-primary" id="modal-upload-btn" style="width: 100%;">
                <span style="font-weight: 600;">Start Fresh with Sample Data</span>
                <small style="display: block; margin-top: 0.25rem; opacity: 0.9;">Load sample data (your backup stays safe)</small>
              </button>
              <button class="btn btn-outline" id="modal-existing-btn" style="width: 100%;">
                <span style="font-weight: 600;">Continue with Empty Data</span>
                <small style="display: block; margin-top: 0.25rem; opacity: 0.9;">Start fresh and overwrite Google Drive backup</small>
              </button>
            </div>
          </div>
        `,
        size: 'default',
      });

      // Handle restore button
      document
        .getElementById('modal-restore-btn')
        .addEventListener('click', async () => {
          Modal.close();
          this.showLoadingScreen('Loading backup from Google Drive...');
          try {
            const loaded = await Backup.loadLatestBackup();
            this.hideLoadingScreen();
            if (loaded) {
              Toast.success(
                'Restore Complete',
                'Your data has been restored from Google Drive',
              );
            } else {
              Toast.info('No Backup Found', 'Loading sample data instead');
              await this.seedDataIfEmpty();
            }
          } catch (error) {
            console.error('Restore error:', error);
            this.hideLoadingScreen();
            Toast.error('Restore Failed', error.message);
            await this.seedDataIfEmpty();
          }
          resolve();
        });

      // Handle upload (start fresh) button
      document
        .getElementById('modal-upload-btn')
        .addEventListener('click', async () => {
          Modal.close();
          this.showLoadingScreen('Loading sample data...');
          await this.seedDataIfEmpty();
          this.hideLoadingScreen();
          Toast.info(
            'Sample Data Loaded',
            'Your Google Drive backup remains unchanged',
          );
          resolve();
        });

      // Handle existing/empty data button
      document
        .getElementById('modal-existing-btn')
        .addEventListener('click', async () => {
          Modal.close();
          Toast.info(
            'Ready to Go',
            'Start adding your data. Changes will be backed up to Google Drive automatically',
          );
          resolve();
        });
    });
  },

  /**
   * Show loading screen overlay
   */
  showLoadingScreen(message = 'Loading...') {
    let loadingScreen = document.getElementById('app-loading-screen');

    if (!loadingScreen) {
      loadingScreen = document.createElement('div');
      loadingScreen.id = 'app-loading-screen';
      loadingScreen.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: rgba(255, 255, 255, 0.95);
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        z-index: 10000;
        backdrop-filter: blur(4px);
      `;
      loadingScreen.innerHTML = `
        <div class="spinner" style="margin-bottom: 1.5rem;"></div>
        <p id="loading-message" style="font-size: 1.1rem; color: #666; font-weight: 500;"></p>
      `;
      document.body.appendChild(loadingScreen);
    }

    document.getElementById('loading-message').textContent = message;
    loadingScreen.style.display = 'flex';
  },

  /**
   * Hide loading screen overlay
   */
  hideLoadingScreen() {
    const loadingScreen = document.getElementById('app-loading-screen');
    if (loadingScreen) {
      loadingScreen.style.display = 'none';
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
          if (params[0] === 'new') {
            pageTitle.textContent = 'Time Entries';
            await TimeEntriesView.render(mainView, headerActions, true);
          } else {
            pageTitle.textContent = 'Time Entries';
            await TimeEntriesView.render(mainView, headerActions);
          }
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
                      error.message,
                    )}</p>
                    <button class="btn btn-primary" onclick="App.renderView('${view}', ${JSON.stringify(
                      params,
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
          rate: sampleServices[0].rate,
          description: 'Homepage redesign implementation',
          startDate: '2025-12-01',
          hours: 3.0,
          billable: true,
          invoiceId: null,
          createdAt: getISOTimestamp(),
        },
        {
          id: generateUUID(),
          clientId: sampleClients[0].id,
          serviceId: sampleServices[1].id,
          rate: sampleServices[1].rate,
          description: 'Logo concepts and mockups',
          startDate: '2025-12-02',
          hours: 4.0,
          billable: true,
          invoiceId: null,
          createdAt: getISOTimestamp(),
        },
        {
          id: generateUUID(),
          clientId: sampleClients[1].id,
          serviceId: sampleServices[0].id,
          rate: sampleServices[0].rate,
          description: 'API integration work',
          startDate: '2025-12-03',
          hours: 3.5,
          billable: true,
          invoiceId: null,
          createdAt: getISOTimestamp(),
        },
        {
          id: generateUUID(),
          clientId: sampleClients[1].id,
          serviceId: sampleServices[2].id,
          rate: sampleServices[2].rate,
          description: 'Sprint planning meeting',
          startDate: '2025-12-04',
          hours: 1.0,
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
        '789 Business Ave, New York, NY 10001',
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
    this.updateSidebarDriveStatus();
  },

  /**
   * Update the Google Drive status widget in the sidebar
   */
  async updateSidebarDriveStatus() {
    const container = document.getElementById('sidebar-drive-status');
    if (!container) return;

    const status = await Backup.getStatus();

    if (!status.isConfigured) {
      container.innerHTML = '';
      return;
    }

    const folderUrl = status.folderId
      ? `https://drive.google.com/drive/folders/${status.folderId}`
      : 'https://drive.google.com/drive/';

    const lastSavedHtml = status.lastBackupTime
      ? `<a href="${folderUrl}" target="_blank" rel="noopener noreferrer" class="sidebar-drive-last-saved" title="Open Google Drive folder">
           Last saved: ${formatDate(status.lastBackupTime)}<br>
           ${new Date(status.lastBackupTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
         </a>`
      : `<a href="${folderUrl}" target="_blank" rel="noopener noreferrer" class="sidebar-drive-last-saved" title="Open Google Drive folder">
           Never saved
         </a>`;

    if (status.isAuthorized) {
      container.innerHTML = `
        <div class="sidebar-drive-widget">
          <div class="sidebar-drive-header">☁ Google Drive</div>
          <div class="sidebar-drive-status-badge connected">Connected</div>
          ${lastSavedHtml}
        </div>
      `;
    } else {
      container.innerHTML = `
        <div class="sidebar-drive-widget">
          <div class="sidebar-drive-header">☁ Google Drive</div>
          <button class="sidebar-drive-signin-btn" id="sidebar-signin-btn">
            <svg width="14" height="14" viewBox="0 0 24 24" style="vertical-align:middle;margin-right:0.35rem;"><path fill="currentColor" d="M21.35 11.1h-9.17v2.73h6.51c-.33 3.81-3.5 5.44-6.5 5.44C8.36 19.27 5 16.25 5 12c0-4.1 3.2-7.27 7.2-7.27 3.09 0 4.9 1.97 4.9 1.97L19 4.72S16.56 2 12.1 2C6.42 2 2.03 6.8 2.03 12c0 5.05 4.13 10 10.22 10 5.35 0 9.25-3.67 9.25-9.09 0-1.15-.15-1.81-.15-1.81z"/></svg>
            Sign in with Google
          </button>
          ${status.lastBackupTime ? lastSavedHtml : ''}
        </div>
      `;
      document
        .getElementById('sidebar-signin-btn')
        .addEventListener('click', async () => {
          try {
            const success = await Backup.connectGoogleDrive();
            if (success) {
              this.updateSidebarDriveStatus();
            }
          } catch (error) {
            Toast.error('Sign-in Failed', error.message);
          }
        });
    }
  },
};

// Initialize app when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  App.init();
});

