/* ========================================
   Invoice App - Backup/Restore Utility
   ======================================== */

/**
 * Backup Manager - Handle data export/import and auto-save
 */
const Backup = {
  folderHandle: null,

  /**
   * Auto-save data to backup folder (stub for now)
   * This will be fully implemented in Phase 6
   */
  async autoSave() {
    // Stub implementation - will be completed in Phase 6
    // For now, just return to prevent errors
    return Promise.resolve();
  },

  /**
   * Export all data to JSON
   * @returns {Promise<string>}
   */
  async exportData() {
    const data = await Database.exportAll();
    return JSON.stringify(data, null, 2);
  },

  /**
   * Import data from JSON
   * @param {string} jsonString - JSON data string
   * @param {boolean} clearExisting - Clear existing data first
   * @returns {Promise<void>}
   */
  async importData(jsonString, clearExisting = true) {
    const data = JSON.parse(jsonString);
    await Database.importAll(data, clearExisting);
  },

  /**
   * Download backup as file
   */
  async downloadBackup() {
    const jsonData = await this.exportData();
    const timestamp = getISOTimestamp().replace(/[:.]/g, '-');
    const filename = `backup-${timestamp}.json`;

    const blob = new Blob([jsonData], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);

    await SettingsStore.set('lastBackupTime', getISOTimestamp());
  },

  /**
   * Upload and restore from backup file
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
};
