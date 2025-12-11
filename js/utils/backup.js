/* ========================================
   Invoice App - Backup/Restore Utility
   ======================================== */

/**
 * Backup Manager - Handle data export/import and auto-save
 */
const Backup = {
  folderHandle: null,
  isAutoSaveEnabled: false,
  autoSaveTimeout: null,
  autoSaveDebounceMs: 2000, // Wait 2 seconds after last change before backing up
  isDirty: false, // Flag to track if data has changed since last backup

  /**
   * Check if File System Access API is supported
   * @returns {boolean}
   */
  isFileSystemAccessSupported() {
    return 'showDirectoryPicker' in window;
  },

  /**
   * Initialize backup system
   * Load saved folder handle if available
   */
  async init() {
    if (!this.isFileSystemAccessSupported()) {
      console.log('File System Access API not supported, using fallback');
      return;
    }

    try {
      // Try to load saved folder handle from IndexedDB
      // Note: FileSystemDirectoryHandle can be stored directly in IndexedDB
      const savedHandleData = await SettingsStore.get('backupFolderHandle');

      if (savedHandleData) {
        this.folderHandle = savedHandleData;

        // Verify we still have permission
        const permission = await this.folderHandle.queryPermission({
          mode: 'readwrite',
        });
        if (permission === 'granted') {
          this.isAutoSaveEnabled = true;
          console.log('Auto-backup enabled with existing folder');
        } else {
          // Try to request permission again
          const newPermission = await this.folderHandle.requestPermission({
            mode: 'readwrite',
          });
          if (newPermission === 'granted') {
            this.isAutoSaveEnabled = true;
            console.log('Auto-backup re-enabled after permission request');
          } else {
            // Permission was revoked, clear the handle
            this.folderHandle = null;
            await SettingsStore.delete('backupFolderHandle');
            await SettingsStore.delete('backupFolderPath');
          }
        }
      }
    } catch (error) {
      console.error('Failed to initialize backup system:', error);
      this.folderHandle = null;
      this.isAutoSaveEnabled = false;
    }
  },

  /**
   * Select backup folder
   * @returns {Promise<boolean>} Success status
   */
  async selectBackupFolder() {
    if (!this.isFileSystemAccessSupported()) {
      Toast.warning(
        'Not Supported',
        'File System Access API is not supported in this browser'
      );
      return false;
    }

    try {
      // Prompt user to select folder
      this.folderHandle = await window.showDirectoryPicker({
        mode: 'readwrite',
        startIn: 'documents',
      });

      // Request permission
      const permission = await this.folderHandle.requestPermission({
        mode: 'readwrite',
      });

      if (permission !== 'granted') {
        Toast.error(
          'Permission Denied',
          'Cannot save backups without folder access'
        );
        this.folderHandle = null;
        return false;
      }

      // Save folder handle
      await SettingsStore.set('backupFolderHandle', this.folderHandle);
      await SettingsStore.set('backupFolderPath', this.folderHandle.name);
      this.isAutoSaveEnabled = true;

      Toast.success(
        'Folder Selected',
        `Auto-backup enabled to: ${this.folderHandle.name}`
      );
      return true;
    } catch (error) {
      if (error.name === 'AbortError') {
        // User cancelled
        return false;
      }
      console.error('Failed to select backup folder:', error);
      Toast.error('Selection Failed', error.message);
      return false;
    }
  },

  /**
   * Auto-save data to backup folder (debounced)
   * Called automatically after every data change
   * Waits for 2 seconds of inactivity before actually saving
   */
  async autoSave() {
    if (!this.isAutoSaveEnabled || !this.folderHandle) {
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

    try {
      // Export data
      const data = await Database.exportAll();
      const jsonString = JSON.stringify(data, null, 2);

      // Generate filename with timestamp
      const timestamp = getISOTimestamp().replace(/[:.]/g, '-');
      const filename = `backup-${timestamp}.json`;

      // Write to file
      const fileHandle = await this.folderHandle.getFileHandle(filename, {
        create: true,
      });
      const writable = await fileHandle.createWritable();
      await writable.write(jsonString);
      await writable.close();

      // Update last backup time and clear dirty flag
      await SettingsStore.set('lastBackupTime', getISOTimestamp());
      this.isDirty = false;

      console.log(`Auto-backup saved: ${filename}`);

      // Clean up old backups based on retention setting
      await this.cleanupOldBackups();
    } catch (error) {
      console.error('Auto-backup failed:', error);

      // If permission error, disable auto-save
      if (error.name === 'NotAllowedError') {
        this.isAutoSaveEnabled = false;
        this.folderHandle = null;
        await SettingsStore.delete('backupFolderHandle');
        Toast.warning(
          'Auto-Backup Disabled',
          'Permission to backup folder was revoked'
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

      // Get all backup files from the folder
      const backupFiles = [];
      for await (const entry of this.folderHandle.values()) {
        if (entry.kind === 'file') {
          const name = entry.name;
          // Check if it matches backup file pattern: backup-YYYY-MM-DDTHH-MM-SS-sssZ.json
          if (
            /^backup-\d{4}-\d{2}-\d{2}T\d{2}-\d{2}-\d{2}-\d{3}Z\.json$/.test(
              name
            )
          ) {
            backupFiles.push({
              name: name,
              handle: entry,
            });
          }
        }
      }

      // Sort by filename (which includes timestamp) - oldest first
      backupFiles.sort((a, b) => a.name.localeCompare(b.name));

      // Delete oldest files if we exceed the limit
      const filesToDelete = backupFiles.length - maxBackups;
      if (filesToDelete > 0) {
        for (let i = 0; i < filesToDelete; i++) {
          await this.folderHandle.removeEntry(backupFiles[i].name);
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
    this.folderHandle = null;
    this.isAutoSaveEnabled = false;
    await SettingsStore.delete('backupFolderHandle');
    await SettingsStore.delete('backupFolderPath');
    Toast.info(
      'Auto-Backup Disabled',
      'Automatic backups have been turned off'
    );
  },

  /**
   * Get backup status information
   * @returns {Promise<object>}
   */
  async getStatus() {
    const lastBackupTime = await SettingsStore.get('lastBackupTime');
    const folderPath = await SettingsStore.get('backupFolderPath');

    return {
      isSupported: this.isFileSystemAccessSupported(),
      isEnabled: this.isAutoSaveEnabled,
      folderPath: folderPath || null,
      lastBackupTime: lastBackupTime || null,
    };
  },
};
