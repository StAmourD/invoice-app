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
                  this.companySettings.companyAddress || ''
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

    if (!this.backupStatus.isSupported) {
      // Fallback for unsupported browsers
      return `
        <div class="alert alert-warning">
          <strong>Auto-Backup Not Supported</strong>
          <p>Your browser doesn't support automatic backups. Use manual backup/restore instead.</p>
        </div>

        <div class="backup-info">
          <p><strong>Last Backup:</strong> ${lastBackupFormatted}</p>
        </div>

        <div class="backup-actions">
          <button class="btn btn-primary" id="manual-backup-btn">Download Backup</button>
          <button class="btn btn-secondary" id="manual-restore-btn">Restore from Backup</button>
        </div>
      `;
    }

    // File System Access API supported
    if (this.backupStatus.isEnabled) {
      return `
        <div class="alert alert-success">
          <strong>Auto-Backup Enabled</strong>
          <p>Your data is automatically backed up to: <strong>${escapeHtml(
            this.backupStatus.folderPath
          )}</strong></p>
        </div>

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
          <button class="btn btn-primary" id="save-backup-settings-btn">Save Settings</button>
          <button class="btn btn-secondary" id="change-folder-btn">Change Folder</button>
          <button class="btn btn-secondary" id="disable-auto-backup-btn">Disable Auto-Backup</button>
          <button class="btn btn-primary" id="manual-backup-btn">Download Backup</button>
          <button class="btn btn-secondary" id="manual-restore-btn">Restore from Backup</button>
        </div>
      `;
    } else {
      return `
        <div class="alert alert-info">
          <strong>Auto-Backup Disabled</strong>
          <p>Select a folder to enable automatic backups on every data change.</p>
        </div>

        <div class="backup-info">
          <p><strong>Last Backup:</strong> ${lastBackupFormatted}</p>
        </div>

        <div class="backup-actions">
          <button class="btn btn-primary" id="select-folder-btn">Select Backup Folder</button>
          <button class="btn btn-secondary" id="manual-backup-btn">Download Backup</button>
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

    // Auto-backup buttons
    const selectFolderBtn = container.querySelector('#select-folder-btn');
    if (selectFolderBtn) {
      selectFolderBtn.addEventListener('click', async () => {
        await this.selectBackupFolder();
      });
    }

    const changeFolderBtn = container.querySelector('#change-folder-btn');
    if (changeFolderBtn) {
      changeFolderBtn.addEventListener('click', async () => {
        await this.selectBackupFolder();
      });
    }

    const disableAutoBackupBtn = container.querySelector(
      '#disable-auto-backup-btn'
    );
    if (disableAutoBackupBtn) {
      disableAutoBackupBtn.addEventListener('click', async () => {
        await this.disableAutoBackup();
      });
    }

    // Save backup settings button
    const saveBackupSettingsBtn = container.querySelector(
      '#save-backup-settings-btn'
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
        'Company information updated successfully'
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
        'Please select a JPEG, PNG, or GIF image file'
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
   * Select backup folder
   */
  async selectBackupFolder() {
    try {
      const success = await Backup.selectBackupFolder();
      if (success) {
        // Refresh view to show new status
        App.refresh();
      }
    } catch (error) {
      console.error('Failed to select backup folder:', error);
      Toast.error('Selection Failed', error.message);
    }
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
        `Maximum backups set to ${maxBackups === 0 ? 'unlimited' : maxBackups}`
      );
    } catch (error) {
      console.error('Failed to save backup settings:', error);
      Toast.error('Save Failed', error.message);
    }
  },

  /**
   * Disable auto-backup
   */
  async disableAutoBackup() {
    Modal.confirm({
      title: 'Disable Auto-Backup',
      message:
        'Are you sure you want to disable automatic backups? You can still use manual backup.',
      icon: '⚠️',
      confirmText: 'Disable',
      confirmClass: 'btn-warning',
      onConfirm: async () => {
        await Backup.disableAutoBackup();
        App.refresh();
      },
    });
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
          await Backup.uploadBackup();
          Toast.success(
            'Restore Complete',
            'Data has been restored. Refreshing app...'
          );

          // Refresh the app after short delay
          setTimeout(() => {
            window.location.reload();
          }, 1500);
        } catch (error) {
          console.error('Failed to restore backup:', error);
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
            'All data has been deleted. Refreshing app...'
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
};
