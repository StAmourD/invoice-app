/* ========================================
   Invoice App - IndexedDB Database
   ======================================== */

const DB_NAME = 'InvoiceAppDB';
const DB_VERSION = 2;

/**
 * Database Manager
 */
const Database = {
  db: null,

  /**
   * Initialize the database
   * @returns {Promise<IDBDatabase>}
   */
  init() {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onerror = (event) => {
        console.error('Database error:', event.target.error);
        reject(event.target.error);
      };

      request.onsuccess = (event) => {
        this.db = event.target.result;
        console.log('Database opened successfully');
        resolve(this.db);
      };

      request.onupgradeneeded = (event) => {
        console.log('Database upgrade needed');
        const db = event.target.result;

        // Clients store
        if (!db.objectStoreNames.contains('clients')) {
          const clientStore = db.createObjectStore('clients', {
            keyPath: 'id',
          });
          clientStore.createIndex('name', 'name', { unique: false });
          clientStore.createIndex('email', 'email', { unique: false });
          console.log('Created clients store');
        }

        // Services store
        if (!db.objectStoreNames.contains('services')) {
          const serviceStore = db.createObjectStore('services', {
            keyPath: 'id',
          });
          serviceStore.createIndex('name', 'name', { unique: false });
          console.log('Created services store');
        }

        // Time entries store
        if (!db.objectStoreNames.contains('timeEntries')) {
          const timeEntryStore = db.createObjectStore('timeEntries', {
            keyPath: 'id',
          });
          timeEntryStore.createIndex('clientId', 'clientId', { unique: false });
          timeEntryStore.createIndex('serviceId', 'serviceId', {
            unique: false,
          });
          timeEntryStore.createIndex('invoiceId', 'invoiceId', {
            unique: false,
          });
          timeEntryStore.createIndex('startDate', 'startDate', {
            unique: false,
          });
          console.log('Created timeEntries store');
        } else if (event.oldVersion < 2) {
          // Migration: remove old startTime index and add startDate index
          if (db.objectStoreNames.contains('timeEntries')) {
            try {
              const timeEntryStore =
                event.target.transaction.objectStore('timeEntries');
              timeEntryStore.deleteIndex('startTime');
              timeEntryStore.createIndex('startDate', 'startDate', {
                unique: false,
              });
              console.log('Migrated timeEntries store to v2');
            } catch (e) {
              console.error('Error during migration:', e);
            }
          }
        }

        // Invoices store
        if (!db.objectStoreNames.contains('invoices')) {
          const invoiceStore = db.createObjectStore('invoices', {
            keyPath: 'id',
          });
          invoiceStore.createIndex('clientId', 'clientId', { unique: false });
          invoiceStore.createIndex('invoiceNumber', 'invoiceNumber', {
            unique: true,
          });
          invoiceStore.createIndex('issueDate', 'issueDate', { unique: false });
          invoiceStore.createIndex('paid', 'paid', { unique: false });
          console.log('Created invoices store');
        }

        // Settings store
        if (!db.objectStoreNames.contains('settings')) {
          db.createObjectStore('settings', { keyPath: 'key' });
          console.log('Created settings store');
        }
      };
    });
  },

  /**
   * Get the database instance
   * @returns {IDBDatabase}
   */
  getDB() {
    if (!this.db) {
      throw new Error('Database not initialized');
    }
    return this.db;
  },

  /**
   * Export all data from the database
   * @returns {Promise<object>}
   */
  async exportAll() {
    const data = {
      exportedAt: getISOTimestamp(),
      version: DB_VERSION,
      clients: await ClientStore.getAll(),
      services: await ServiceStore.getAll(),
      timeEntries: await TimeEntryStore.getAll(),
      invoices: await InvoiceStore.getAll(),
      settings: await SettingsStore.getAll(),
    };
    return data;
  },

  /**
   * Import data into the database
   * @param {object} data - Data to import
   * @param {boolean} clearExisting - Whether to clear existing data first
   * @returns {Promise<void>}
   */
  async importAll(data, clearExisting = true) {
    if (clearExisting) {
      await this.clearAll();
    }

    // Import in order to handle dependencies
    if (data.settings) {
      for (const setting of data.settings) {
        await SettingsStore.set(setting.key, setting.value);
      }
    }

    if (data.clients) {
      for (const client of data.clients) {
        await ClientStore.add(client);
      }
    }

    if (data.services) {
      for (const service of data.services) {
        await ServiceStore.add(service);
      }
    }

    if (data.timeEntries) {
      for (const entry of data.timeEntries) {
        await TimeEntryStore.add(entry);
      }
    }

    if (data.invoices) {
      for (const invoice of data.invoices) {
        await InvoiceStore.add(invoice);
      }
    }
  },

  /**
   * Clear all data from the database
   * @returns {Promise<void>}
   */
  async clearAll() {
    const stores = [
      'clients',
      'services',
      'timeEntries',
      'invoices',
      'settings',
    ];

    for (const storeName of stores) {
      await new Promise((resolve, reject) => {
        const transaction = this.db.transaction([storeName], 'readwrite');
        const store = transaction.objectStore(storeName);
        const request = store.clear();

        request.onsuccess = () => resolve();
        request.onerror = (e) => reject(e.target.error);
      });
    }
  },

  /**
   * Merge items from a Drive backup into a local store.
   * For each incoming item:
   *   - If not present locally → insert it (counted as added)
   *   - If present locally → replace only when the Drive record has a newer updatedAt (counted as updated)
   *   - Items that exist only locally are left untouched
   *
   * Uses store.put() directly to bypass store-level add/update helpers and
   * avoid triggering autoSave during the merge.
   *
   * @param {string} storeName - The IDB store name
   * @param {Array<object>} driveItems - Records from the Drive backup
   * @returns {Promise<{added: number, updated: number}>}
   */
  mergeStore(storeName, driveItems) {
    return new Promise((resolve, reject) => {
      const db = this.getDB();
      const transaction = db.transaction([storeName], 'readwrite');
      const store = transaction.objectStore(storeName);

      let added = 0;
      let updated = 0;

      transaction.oncomplete = () => resolve({ added, updated });
      transaction.onerror = (event) => reject(event.target.error);
      transaction.onabort = (event) => reject(event.target.error);

      const getAllRequest = store.getAll();

      getAllRequest.onsuccess = () => {
        const localMap = new Map(
          getAllRequest.result.map((item) => [item.id, item]),
        );

        for (const driveItem of driveItems) {
          const local = localMap.get(driveItem.id);

          if (!local) {
            // Record only exists on Drive → add to local
            store.put(driveItem);
            added++;
          } else {
            // Record exists locally → keep the newer version
            const driveTime = driveItem.updatedAt
              ? new Date(driveItem.updatedAt)
              : null;
            const localTime = local.updatedAt
              ? new Date(local.updatedAt)
              : null;

            if (driveTime && (!localTime || driveTime > localTime)) {
              store.put(driveItem);
              updated++;
            }
          }
        }
      };

      getAllRequest.onerror = (event) => reject(event.target.error);
    });
  },

  /**
   * Check if the database is empty (no clients, services, or invoices)
   * @returns {Promise<boolean>}
   */
  async isEmpty() {
    const clients = await ClientStore.getAll();
    const services = await ServiceStore.getAll();
    const invoices = await InvoiceStore.getAll();

    return (
      clients.length === 0 && services.length === 0 && invoices.length === 0
    );
  },
};

