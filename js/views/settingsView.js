/* ========================================
   Invoice App - Settings View
   ======================================== */

/**
 * Settings View - Company info, backup/restore, data management
 */
const SettingsView = {
  backupStatus: null,
  companySettings: {},

  /**
   * Render the settings view
   */
  async render(container, headerActions) {
    // Clear header actions
    headerActions.innerHTML = '';

    // Show loading state
    Spinner.show(container, 'Loading settings...');

    // Load data
    await this.loadData();

    // Hide loading state
    Spinner.hide(container);

    // Render settings
    this.renderSettings(container);

    // Setup event listeners
    this.setupEventListeners(container);
  },

  /**
   * Load settings data
   */
  async loadData() {
    try {
      this.companySettings = await SettingsStore.getMultiple([
        'companyName',
        'companyAddress',
        'companyEmail',
        'companyLogo',
        'maxBackups',
        'googleOAuthClientId',
      ]);

      this.backupStatus = await Backup.getStatus();
    } catch (error) {
      console.error('Failed to load settings:', error);
      Toast.error('Failed to load settings', error.message);
    }
  },

  /**
   * Render settings UI
   */
  renderSettings(container) {
    const lastBackupFormatted = this.backupStatus.lastBackupTime
      ? formatDate(this.backupStatus.lastBackupTime) +
        ' at ' +
        new Date(this.backupStatus.lastBackupTime).toLocaleTimeString()
      : 'Never';

    container.innerHTML = `
      <div class="settings-container">
        <!-- Company Information -->
        <div class="card">
          <div class="card-header">
            <h3>Company Information</h3>
          </div>
          <div class="card-body">
            <form id="company-form">
              <div class="form-group">
                <label class="form-label" for="company-name">Company Name</label>
                <input
                  type="text"
                  id="company-name"
                  class="form-control"
                  placeholder="My Consulting LLC"
                  value="${escapeHtml(this.companySettings.companyName || '')}"
                  required
                />
              </div>

              <div class="form-group">
                <label class="form-label" for="company-address">Address</label>
                <textarea
                  id="company-address"
                  class="form-control"
                  rows="3"
                  placeholder="123 Main St, City, State ZIP"
                >${escapeHtml(
                  this.companySettings.companyAddress || '',
                )}</textarea>
              </div>

              <div class="form-group">
                <label class="form-label" for="company-email">Email</label>
                <input
                  type="email"
                  id="company-email"
                  class="form-control"
                  placeholder="contact@company.com"
                  value="${escapeHtml(this.companySettings.companyEmail || '')}"
                />
              </div>

              <div class="form-group">
                <label class="form-label" for="company-logo">Company Logo</label>
                <input
                  type="file"
                  id="company-logo"
                  class="form-control"
                  accept="image/jpeg,image/png,image/gif"
                />
                <div class="form-hint">
                  Upload a logo image (JPEG, PNG, or GIF) to display on invoices. Max 2MB.
                </div>
                ${
                  this.companySettings.companyLogo
                    ? `
                  <div style="margin-top: 0.5rem;">
                    <img id="logo-preview" src="${this.companySettings.companyLogo}" alt="Current logo" style="max-width: 200px; max-height: 100px; border: 1px solid #ddd; padding: 0.25rem;">
                    <button type="button" class="btn btn-sm btn-danger" id="remove-logo-btn" style="margin-left: 0.5rem;">Remove Logo</button>
                  </div>
                `
                    : ''
                }
              </div>

              <button type="submit" class="btn btn-primary">Save Company Info</button>
            </form>
          </div>
        </div>

        <!-- Backup & Restore -->
        <div class="card">
          <div class="card-header">
            <h3>Backup & Restore</h3>
          </div>
          <div class="card-body">
            ${this.renderBackupSection()}
          </div>
        </div>

        <!-- Danger Zone -->
        <div class="card card-danger">
          <div class="card-header">
            <h3>Danger Zone</h3>
          </div>
          <div class="card-body">
            <p class="text-muted">
              <strong>Warning:</strong> These actions cannot be undone. Make sure you have a backup before proceeding.
            </p>
            <button class="btn btn-danger" id="clear-data-btn">Clear All Data</button>
          </div>
        </div>
      </div>
    `;
  },

  /**
   * Render backup section based on browser support
   */
  renderBackupSection() {
    const lastBackupFormatted = this.backupStatus.lastBackupTime
      ? formatDate(this.backupStatus.lastBackupTime) +
        ' at ' +
        new Date(this.backupStatus.lastBackupTime).toLocaleTimeString()
      : 'Never';

    // Determine if Client ID is from environment or manual config
    const isEnvConfig = this.backupStatus.configSource === 'environment';
    const configSourceLabel = isEnvConfig
      ? '<span class="badge badge-success">From Environment</span>'
      : '<span class="badge badge-info">Manual Configuration</span>';

    // Google Drive OAuth Configuration Section
    const configSection = `
      <div class="form-group">
        <label class="form-label" for="google-oauth-client-id">
          Google OAuth Client ID ${configSourceLabel}
        </label>
        <input
          type="text"
          id="google-oauth-client-id"
          class="form-control"
          placeholder="your-client-id.apps.googleusercontent.com"
          value="${escapeHtml(this.backupStatus.clientId || this.companySettings.googleOAuthClientId || '')}"
          ${isEnvConfig ? 'readonly disabled' : ''}
        />
        <small class="form-text">
          ${
            isEnvConfig
              ? 'Configured via environment variable (read-only). '
              : 'Required for Google Drive backup. See README for setup instructions. '
          }
          Environment: <strong>${this.backupStatus.environment || 'unknown'}</strong>
        </small>
      </div>
      ${isEnvConfig ? '' : '<button class="btn btn-primary" id="save-oauth-config-btn" style="margin-bottom: 1.5rem;">Save OAuth Config</button>'}
    `;

    if (!this.backupStatus.isConfigured) {
      // OAuth Client ID not configured
      return `
        <div class="alert alert-warning">
          <strong>Configuration Required</strong>
          <p>${
            isEnvConfig
              ? 'Set GOOGLE_OAUTH_CLIENT_ID environment variable and rebuild to enable Google Drive backups.'
              : 'Configure your Google OAuth Client ID to enable Google Drive backups.'
          }</p>
        </div>

        ${configSection}

        <div class="backup-info">
          <p><strong>Last Backup:</strong> ${lastBackupFormatted}</p>
        </div>

        <div class="backup-actions">
          <button class="btn btn-primary" id="manual-backup-btn">Download Backup</button>
          <button class="btn btn-secondary" id="manual-restore-btn">Restore from Backup</button>
        </div>
      `;
    }

    // OAuth configured - show connection status
    if (this.backupStatus.isAuthorized) {
      return `
        <div class="alert alert-success">
          <strong>Connected to Google Drive</strong>
          <p>Automatic backups enabled to folder: <strong>${escapeHtml(
            this.backupStatus.folderName,
          )}</strong></p>
          <p style="margin-bottom: 0;">Environment: <strong>${this.backupStatus.environment}</strong></p>
        </div>

        ${configSection}

        <div class="backup-info">
          <p><strong>Last Backup:</strong> ${lastBackupFormatted}</p>
        </div>

        <div class="form-group">
          <label class="form-label" for="max-backups">Maximum Backups to Keep</label>
          <input
            type="number"
            id="max-backups"
            class="form-control"
            min="0"
            max="1000"
            value="${this.companySettings.maxBackups || 10}"
            style="max-width: 150px;"
          />
          <small class="form-text">Set to 0 for unlimited backups. Older backups will be deleted automatically.</small>
        </div>

        <div class="backup-actions">
          <button class="btn btn-primary" id="save-backup-settings-btn">Save Settings</button>          <button class="btn btn-success" id="save-now-btn">Save Now to Google Drive</button>          <button class="btn btn-success" id="load-drive-backup-btn">Load from Google Drive</button>
          <button class="btn btn-danger" id="disconnect-drive-btn">Sign Out & Disconnect</button>
          <button class="btn btn-primary" id="manual-backup-btn">Download Backup</button>
          <button class="btn btn-secondary" id="manual-restore-btn">Restore from Backup</button>
        </div>
      `;
    } else {
      // OAuth configured but not authorized
      return `
        <div class="alert alert-info">
          <strong>Google Drive Not Connected</strong>
          <p>Sign in with Google to enable automatic backups.</p>
          <p style="margin-bottom: 0;">Environment: <strong>${this.backupStatus.environment}</strong></p>
        </div>

        ${configSection}

        <div class="backup-info">
          <p><strong>Last Backup:</strong> ${lastBackupFormatted}</p>
        </div>

        <div class="backup-actions">
          <button class="btn btn-success" id="connect-drive-btn">
            <svg width="18" height="18" viewBox="0 0 24 24" style="vertical-align: middle; margin-right: 0.5rem;">
              <path fill="currentColor" d="M21.35 11.1h-9.17v2.73h6.51c-.33 3.81-3.5 5.44-6.5 5.44C8.36 19.27 5 16.25 5 12c0-4.1 3.2-7.27 7.2-7.27 3.09 0 4.9 1.97 4.9 1.97L19 4.72S16.56 2 12.1 2C6.42 2 2.03 6.8 2.03 12c0 5.05 4.13 10 10.22 10 5.35 0 9.25-3.67 9.25-9.09 0-1.15-.15-1.81-.15-1.81z"/>
            </svg>
            Sign in with Google
          </button>
          <button class="btn btn-primary" id="manual-backup-btn">Download Backup</button>
          <button class="btn btn-secondary" id="manual-restore-btn">Restore from Backup</button>
        </div>
      `;
    }
  },

  /**
   * Setup event listeners
   */
  setupEventListeners(container) {
    // Company form submission
    container
      .querySelector('#company-form')
      .addEventListener('submit', async (e) => {
        e.preventDefault();
        await this.saveCompanyInfo();
      });

    // Logo upload
    const logoInput = container.querySelector('#company-logo');
    if (logoInput) {
      logoInput.addEventListener('change', async (e) => {
        await this.handleLogoUpload(e.target.files[0]);
      });
    }

    // Remove logo button
    const removeLogoBtn = container.querySelector('#remove-logo-btn');
    if (removeLogoBtn) {
      removeLogoBtn.addEventListener('click', async () => {
        await this.removeLogo();
      });
    }

    // OAuth config buttons
    const saveOAuthConfigBtn = container.querySelector(
      '#save-oauth-config-btn',
    );
    if (saveOAuthConfigBtn) {
      saveOAuthConfigBtn.addEventListener('click', async () => {
        await this.saveOAuthConfig();
      });
    }

    // Google Drive connection buttons
    const connectDriveBtn = container.querySelector('#connect-drive-btn');
    if (connectDriveBtn) {
      connectDriveBtn.addEventListener('click', async () => {
        await this.connectGoogleDrive();
      });
    }

    const disconnectDriveBtn = container.querySelector('#disconnect-drive-btn');
    if (disconnectDriveBtn) {
      disconnectDriveBtn.addEventListener('click', async () => {
        await this.disconnectGoogleDrive();
      });
    }

    // Load from Google Drive button
    const saveNowBtn = container.querySelector('#save-now-btn');
    if (saveNowBtn) {
      saveNowBtn.addEventListener('click', async () => {
        saveNowBtn.disabled = true;
        saveNowBtn.textContent = 'Saving…';
        try {
          await Backup.saveNow();
        } finally {
          saveNowBtn.disabled = false;
          saveNowBtn.textContent = 'Save Now to Google Drive';
        }
      });
    }

    const loadDriveBackupBtn = container.querySelector(
      '#load-drive-backup-btn',
    );
    if (loadDriveBackupBtn) {
      loadDriveBackupBtn.addEventListener('click', async () => {
        await this.loadFromGoogleDrive();
      });
    }

    // Save backup settings button
    const saveBackupSettingsBtn = container.querySelector(
      '#save-backup-settings-btn',
    );
    if (saveBackupSettingsBtn) {
      saveBackupSettingsBtn.addEventListener('click', async () => {
        await this.saveBackupSettings();
      });
    }

    // Manual backup/restore buttons
    container
      .querySelector('#manual-backup-btn')
      .addEventListener('click', async () => {
        await this.downloadBackup();
      });

    container
      .querySelector('#manual-restore-btn')
      .addEventListener('click', async () => {
        await this.restoreBackup();
      });

    // Clear data button
    container
      .querySelector('#clear-data-btn')
      .addEventListener('click', async () => {
        await this.clearAllData();
      });
  },

  /**
   * Save company information
   */
  async saveCompanyInfo() {
    try {
      const companyName = document.getElementById('company-name').value.trim();
      const companyAddress = document
        .getElementById('company-address')
        .value.trim();
      const companyEmail = document
        .getElementById('company-email')
        .value.trim();

      if (!companyName) {
        Toast.error('Validation Error', 'Company name is required');
        return;
      }

      await SettingsStore.set('companyName', companyName);
      await SettingsStore.set('companyAddress', companyAddress);
      await SettingsStore.set('companyEmail', companyEmail);

      Toast.success(
        'Settings Saved',
        'Company information updated successfully',
      );
    } catch (error) {
      console.error('Failed to save company info:', error);
      Toast.error('Save Failed', error.message);
    }
  },

  /**
   * Handle logo file upload
   */
  async handleLogoUpload(file) {
    if (!file) return;

    // Validate file type (only JPEG, PNG, GIF supported by jsPDF)
    const supportedTypes = ['image/jpeg', 'image/png', 'image/gif'];
    if (!supportedTypes.includes(file.type)) {
      Toast.error(
        'Invalid File',
        'Please select a JPEG, PNG, or GIF image file',
      );
      return;
    }

    // Validate file size (2MB max)
    if (file.size > 2 * 1024 * 1024) {
      Toast.error('File Too Large', 'Please select an image smaller than 2MB');
      return;
    }

    try {
      // Convert file to base64 data URL
      const reader = new FileReader();
      reader.onload = async (e) => {
        const dataUrl = e.target.result;
        await SettingsStore.set('companyLogo', dataUrl);
        this.companySettings.companyLogo = dataUrl;
        Toast.success('Logo Uploaded', 'Company logo updated successfully');
        // Refresh the view to show the new logo
        this.renderSettings(document.querySelector('#main-view'));
        this.setupEventListeners(document.querySelector('#main-view'));
      };
      reader.readAsDataURL(file);
    } catch (error) {
      console.error('Failed to upload logo:', error);
      Toast.error('Upload Failed', error.message);
    }
  },

  /**
   * Remove company logo
   */
  async removeLogo() {
    try {
      await SettingsStore.set('companyLogo', null);
      this.companySettings.companyLogo = null;
      Toast.success('Logo Removed', 'Company logo removed successfully');
      // Refresh the view to hide the logo
      this.renderSettings(document.querySelector('#main-view'));
      this.setupEventListeners(document.querySelector('#main-view'));
    } catch (error) {
      console.error('Failed to remove logo:', error);
      Toast.error('Remove Failed', error.message);
    }
  },

  /**
   * Save OAuth configuration
   */
  async saveOAuthConfig() {
    try {
      const clientId = document
        .getElementById('google-oauth-client-id')
        .value.trim();

      if (!clientId) {
        Toast.error('Validation Error', 'OAuth Client ID is required');
        return;
      }

      await SettingsStore.set('googleOAuthClientId', clientId);

      Toast.success(
        'Configuration Saved',
        'Google OAuth Client ID saved. You can now connect to Google Drive.',
      );

      // Refresh view
      App.refresh();
    } catch (error) {
      console.error('Failed to save OAuth config:', error);
      Toast.error('Save Failed', error.message);
    }
  },

  /**
   * Connect to Google Drive
   */
  async connectGoogleDrive() {
    try {
      App.showLoadingScreen('Connecting to Google Drive...');
      const success = await Backup.connectGoogleDrive();
      App.hideLoadingScreen();
      if (success) {
        // Refresh view to show new status
        App.refresh();
      }
    } catch (error) {
      console.error('Failed to connect to Google Drive:', error);
      App.hideLoadingScreen();
      Toast.error('Connection Failed', error.message);
    }
  },

  /**
   * Disconnect from Google Drive
   */
  async disconnectGoogleDrive() {
    Modal.confirm({
      title: 'Disconnect Google Drive',
      message:
        'Are you sure you want to disconnect from Google Drive? Automatic backups will be disabled. You can still use manual backup.',
      icon: '⚠️',
      confirmText: 'Disconnect',
      confirmClass: 'btn-warning',
      onConfirm: async () => {
        await Backup.disableAutoBackup();
        App.refresh();
      },
    });
  },

  /**
   * Save backup settings
   */
  async saveBackupSettings() {
    try {
      const maxBackupsInput = document.getElementById('max-backups');
      if (!maxBackupsInput) return;

      const maxBackups = parseInt(maxBackupsInput.value, 10);

      if (isNaN(maxBackups) || maxBackups < 0) {
        Toast.error('Invalid Value', 'Maximum backups must be 0 or greater');
        return;
      }

      await SettingsStore.set('maxBackups', maxBackups);
      Toast.success(
        'Settings Saved',
        `Maximum backups set to ${maxBackups === 0 ? 'unlimited' : maxBackups}`,
      );
    } catch (error) {
      console.error('Failed to save backup settings:', error);
      Toast.error('Save Failed', error.message);
    }
  },

  /**
   * Download manual backup
   */
  async downloadBackup() {
    try {
      await Backup.downloadBackup();
      App.refresh();
    } catch (error) {
      console.error('Failed to download backup:', error);
      Toast.error('Backup Failed', error.message);
    }
  },

  /**
   * Restore from backup file
   */
  async restoreBackup() {
    Modal.confirm({
      title: 'Restore from Backup',
      message:
        'This will replace all current data with the backup. Make sure you have a recent backup before proceeding.',
      icon: '⚠️',
      confirmText: 'Restore',
      confirmClass: 'btn-danger',
      onConfirm: async () => {
        try {
          App.showLoadingScreen('Restoring data from backup...');
          await Backup.uploadBackup();
          App.hideLoadingScreen();
          Toast.success(
            'Restore Complete',
            'Data has been restored. Refreshing app...',
          );

          // Refresh the app after short delay
          setTimeout(() => {
            window.location.reload();
          }, 1500);
        } catch (error) {
          console.error('Failed to restore backup:', error);
          App.hideLoadingScreen();
          Toast.error('Restore Failed', error.message);
        }
      },
    });
  },

  /**
   * Clear all data
   */
  async clearAllData() {
    Modal.confirm({
      title: 'Clear All Data',
      message:
        'This will permanently delete ALL data including clients, services, time entries, and invoices. This action cannot be undone!',
      icon: '🗑️',
      confirmText: 'Delete Everything',
      confirmClass: 'btn-danger',
      onConfirm: async () => {
        try {
          await Database.clearAll();
          Toast.success(
            'Data Cleared',
            'All data has been deleted. Refreshing app...',
          );

          // Refresh the app after short delay
          setTimeout(() => {
            window.location.reload();
          }, 1500);
        } catch (error) {
          console.error('Failed to clear data:', error);
          Toast.error('Clear Failed', error.message);
        }
      },
    });
  },

  /**
   * Load latest backup from Google Drive
   */
  async loadFromGoogleDrive() {
    Modal.confirm({
      title: 'Load from Google Drive',
      message:
        'This will replace all current data with the latest backup from Google Drive. Make sure you have saved any changes you want to keep.',
      icon: '☁️',
      confirmText: 'Load Backup',
      confirmClass: 'btn-primary',
      onConfirm: async () => {
        try {
          App.showLoadingScreen('Loading backup from Google Drive...');
          const loaded = await Backup.loadLatestBackup();
          App.hideLoadingScreen();

          if (loaded) {
            Toast.success(
              'Backup Loaded',
              'Data has been restored. Refreshing app...',
            );

            // Refresh the app after short delay
            setTimeout(() => {
              window.location.reload();
            }, 1500);
          } else {
            Toast.info(
              'No Backup Found',
              'No backup files found in Google Drive',
            );
          }
        } catch (error) {
          console.error('Failed to load backup from Google Drive:', error);
          App.hideLoadingScreen();
          Toast.error('Load Failed', error.message);
        }
      },
    });
  },
};

