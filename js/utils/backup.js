/* ========================================
   Invoice App - Backup/Restore Utility
   ======================================== */

/**
 * Backup Manager - Handle data export/import and auto-save
 * Uses Google Drive API for cloud backup
 */
const Backup = {
  isAutoSaveEnabled: false,
  autoSaveTimeout: null,
  autoSaveDebounceMs: 2000, // Wait 2 seconds after last change before backing up
  isDirty: false, // Flag to track if data has changed since last backup


  /**
   * Initialize backup system
   * Load Google Drive OAuth Client ID from config or settings
   */
  async init() {
    try {
      // First, try to get OAuth Client ID from AppConfig (environment variable via build)
      let clientId = null;
      
      if (window.AppConfig && window.AppConfig.googleOAuthClientId) {
        clientId = window.AppConfig.googleOAuthClientId;
        console.log('Using Google OAuth Client ID from environment configuration');
      } else {
        // Fall back to manual configuration from settings
        clientId = await SettingsStore.get('googleOAuthClientId');
        if (clientId) {
          console.log('Using Google OAuth Client ID from manual configuration');
        }
      }
      
      if (!clientId) {
        console.log('Google OAuth Client ID not configured');
        return;
      }
      
      // Initialize Google Drive
      await GoogleDrive.init(clientId);
      
      // Check if already authorized
      if (GoogleDrive.isAuthorized) {
        this.isAutoSaveEnabled = true;
        console.log('Auto-backup enabled with Google Drive');
      }
    } catch (error) {
      console.error('Failed to initialize backup system:', error);
      this.isAutoSaveEnabled = false;
    }
  },


  /**
   * Connect to Google Drive
   * Shows OAuth sign-in flow
   * @returns {Promise<boolean>} Success status
   */
  async connectGoogleDrive() {
    try {
      // First check for environment config
      let clientId = null;
      
      if (window.AppConfig && window.AppConfig.googleOAuthClientId) {
        clientId = window.AppConfig.googleOAuthClientId;
      } else {
        // Get OAuth Client ID from settings
        clientId = await SettingsStore.get('googleOAuthClientId');
        
        if (!clientId) {
          Toast.error(
            'Configuration Required',
            'Please configure Google OAuth Client ID in Settings first'
          );
          return false;
        }
      }
      
      // Initialize if not already done
      if (!GoogleDrive.isInitialized) {
        await GoogleDrive.init(clientId);
      }
      
      // Request authorization
      await GoogleDrive.authorize();
      
      // Ensure app folder exists
      await GoogleDrive.ensureAppFolder();
      
      this.isAutoSaveEnabled = true;
      
      Toast.success(
        'Connected',
        `Auto-backup enabled to Google Drive (${GoogleDrive.getFolderName()})`
      );
      return true;
    } catch (error) {
      console.error('Failed to connect to Google Drive:', error);
      Toast.error('Connection Failed', error.message);
      return false;
    }
  },

  /**
   * Auto-save data to backup folder (debounced)
   * Called automatically after every data change
   * Waits for 2 seconds of inactivity before actually saving
   */
  async autoSave() {
    if (!this.isAutoSaveEnabled || !GoogleDrive.isAuthorized) {
      return;
    }

    // Mark data as dirty (changed)
    this.isDirty = true;

    // Clear existing timeout
    if (this.autoSaveTimeout) {
      clearTimeout(this.autoSaveTimeout);
    }

    // Set new timeout to perform backup after debounce period
    this.autoSaveTimeout = setTimeout(async () => {
      await this.performAutoSave();
    }, this.autoSaveDebounceMs);
  },

  /**
   * Actually perform the auto-save operation
   * This is called after the debounce period
   */
  async performAutoSave() {
    // Only backup if data has actually changed
    if (!this.isDirty) {
      console.log('Auto-backup skipped: no changes since last backup');
      return;
    }

    // Check if authorized
    if (!GoogleDrive.isAuthorized) {
      console.log('Auto-backup skipped: not authorized');
      return;
    }

    try {
      // Export data
      const data = await Database.exportAll();
      const jsonString = JSON.stringify(data, null, 2);

      // Generate filename with timestamp
      const timestamp = getISOTimestamp().replace(/[:.]/g, '-');
      const filename = `backup-${timestamp}.json`;

      // Upload to Google Drive
      await GoogleDrive.uploadFile(filename, jsonString, 'application/json');

      // Update last backup time and clear dirty flag
      await SettingsStore.set('lastBackupTime', getISOTimestamp());
      this.isDirty = false;

      console.log(`Auto-backup saved: ${filename}`);

      // Clean up old backups based on retention setting
      await this.cleanupOldBackups();
    } catch (error) {
      console.error('Auto-backup failed:', error);

      // If authorization error, disable auto-save
      if (error.message.includes('Authorization') || error.message.includes('sign in')) {
        this.isAutoSaveEnabled = false;
        Toast.warning(
          'Auto-Backup Disabled',
          'Google Drive authorization expired. Please sign in again.'
        );
      }
    }
  },

  /**
   * Clean up old backup files based on retention setting
   */
  async cleanupOldBackups() {
    try {
      // Get retention setting (default to 10)
      const maxBackups = (await SettingsStore.get('maxBackups')) || 10;

      // If 0, keep infinite backups
      if (maxBackups === 0) {
        return;
      }

      // Get all backup files from Google Drive
      const files = await GoogleDrive.listFiles();
      
      // Filter backup files by pattern: backup-YYYY-MM-DDTHH-MM-SS-sssZ.json
      const backupFiles = files.filter(file => 
        /^backup-\d{4}-\d{2}-\d{2}T\d{2}-\d{2}-\d{2}-\d{3}Z\.json$/.test(file.name)
      );

      // Sort by name (which includes timestamp) - oldest first
      backupFiles.sort((a, b) => a.name.localeCompare(b.name));

      // Delete oldest files if we exceed the limit
      const filesToDelete = backupFiles.length - maxBackups;
      if (filesToDelete > 0) {
        for (let i = 0; i < filesToDelete; i++) {
          await GoogleDrive.deleteFile(backupFiles[i].id);
          console.log(`Deleted old backup: ${backupFiles[i].name}`);
        }
      }
    } catch (error) {
      console.error('Failed to cleanup old backups:', error);
      // Don't throw - this is not critical to the backup process
    }
  },

  /**
   * Export all data to JSON
   * @returns {Promise<string>}
   */
  async exportData() {
    try {
      const data = await Database.exportAll();
      return JSON.stringify(data, null, 2);
    } catch (error) {
      console.error('Failed to export data:', error);
      throw error;
    }
  },

  /**
   * Import data from JSON with validation
   * @param {string} jsonString - JSON data string
   * @param {boolean} clearExisting - Clear existing data first
   * @returns {Promise<void>}
   */
  async importData(jsonString, clearExisting = true) {
    try {
      // Parse and validate JSON
      const data = JSON.parse(jsonString);

      // Basic validation
      if (!data || typeof data !== 'object') {
        throw new Error('Invalid backup format: data must be an object');
      }

      // Check for required properties
      const requiredProps = [
        'clients',
        'services',
        'timeEntries',
        'invoices',
        'settings',
      ];
      const missingProps = requiredProps.filter(
        (prop) => !Array.isArray(data[prop])
      );

      if (missingProps.length > 0) {
        throw new Error(
          `Invalid backup format: missing ${missingProps.join(', ')}`
        );
      }

      // Import data
      await Database.importAll(data, clearExisting);

      Toast.success('Import Complete', 'Data has been restored successfully');
    } catch (error) {
      console.error('Failed to import data:', error);
      if (error instanceof SyntaxError) {
        throw new Error('Invalid JSON format');
      }
      throw error;
    }
  },

  /**
   * Manual backup - download as file
   */
  async downloadBackup() {
    try {
      const jsonData = await this.exportData();
      const timestamp = getISOTimestamp().replace(/[:.]/g, '-');
      const filename = `backup-${timestamp}.json`;

      const blob = new Blob([jsonData], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      a.style.visibility = 'hidden';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      await SettingsStore.set('lastBackupTime', getISOTimestamp());
      Toast.success('Backup Downloaded', filename);
    } catch (error) {
      console.error('Failed to download backup:', error);
      Toast.error('Backup Failed', error.message);
    }
  },

  /**
   * Manual restore - upload from file
   * @returns {Promise<void>}
   */
  async uploadBackup() {
    return new Promise((resolve, reject) => {
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = 'application/json,.json';

      input.onchange = async (e) => {
        try {
          const file = e.target.files[0];
          if (!file) {
            reject(new Error('No file selected'));
            return;
          }

          const text = await file.text();
          await this.importData(text, true);
          resolve();
        } catch (error) {
          reject(error);
        }
      };

      input.click();
    });
  },

  /**
   * Clear auto-backup settings
   */
  async disableAutoBackup() {
    this.isAutoSaveEnabled = false;
    await GoogleDrive.signOut();
    Toast.info(
      'Auto-Backup Disabled',
      'Disconnected from Google Drive'
    );
  },

  /**
   * Get backup status information
   * @returns {Promise<object>}
   */
  async getStatus() {
    const lastBackupTime = await SettingsStore.get('lastBackupTime');
    const driveStatus = GoogleDrive.getStatus();
    
    // Check if client ID is from environment or manual config
    const hasEnvConfig = !!(window.AppConfig && window.AppConfig.googleOAuthClientId);
    const manualClientId = await SettingsStore.get('googleOAuthClientId');
    const clientId = hasEnvConfig ? window.AppConfig.googleOAuthClientId : manualClientId;

    return {
      isConfigured: !!clientId,
      configSource: hasEnvConfig ? 'environment' : 'manual',
      clientId: clientId || null,
      isAuthorized: driveStatus.isAuthorized,
      isEnabled: this.isAutoSaveEnabled,
      environment: driveStatus.environment,
      folderName: driveStatus.folderName,
      lastBackupTime: lastBackupTime || null,
    };
  },

  /**
   * Load the latest backup from Google Drive
   * @returns {Promise<boolean>} True if backup was loaded, false if none found
   */
  async loadLatestBackup() {
    if (!GoogleDrive.isAuthorized) {
      throw new Error('Not authorized to access Google Drive');
    }

    try {
      // Get all backup files from Google Drive
      const files = await GoogleDrive.listFiles();
      
      // Filter backup files by pattern: backup-YYYY-MM-DDTHH-MM-SS-sssZ.json
      const backupFiles = files.filter(file => 
        /^backup-\d{4}-\d{2}-\d{2}T\d{2}-\d{2}-\d{2}-\d{3}Z\.json$/.test(file.name)
      );

      if (backupFiles.length === 0) {
        console.log('No backup files found in Google Drive');
        return false;
      }

      // Sort by name (which includes timestamp) - newest first
      backupFiles.sort((a, b) => b.name.localeCompare(a.name));
      const latestBackup = backupFiles[0];

      console.log(`Loading latest backup: ${latestBackup.name}`);

      // Download and import the backup
      const content = await GoogleDrive.downloadFile(latestBackup.id);
      await this.importData(content, true);

      console.log('Successfully loaded backup from Google Drive');
      return true;
    } catch (error) {
      console.error('Failed to load backup from Google Drive:', error);
      throw error;
    }
  },

  /**
   * Check if there are any backups in Google Drive
   * @returns {Promise<boolean>} True if backups exist, false otherwise
   */
  async hasBackups() {
    if (!GoogleDrive.isAuthorized) {
      return false;
    }

    try {
      // Get all backup files from Google Drive
      const files = await GoogleDrive.listFiles();
      
      // Filter backup files by pattern: backup-YYYY-MM-DDTHH-MM-SS-sssZ.json
      const backupFiles = files.filter(file => 
        /^backup-\d{4}-\d{2}-\d{2}T\d{2}-\d{2}-\d{2}-\d{3}Z\.json$/.test(file.name)
      );

      return backupFiles.length > 0;
    } catch (error) {
      console.error('Failed to check for backups:', error);
      return false;
    }
  },
};
