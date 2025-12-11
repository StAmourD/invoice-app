/* ========================================
   Invoice App - Service Store
   ======================================== */

/**
 * Service Store - CRUD operations for services
 */
const ServiceStore = {
  STORE_NAME: 'services',

  /**
   * Add a new service
   * @param {object} service - Service data
   * @returns {Promise<object>}
   */
  add(service) {
    return new Promise((resolve, reject) => {
      const db = Database.getDB();
      const transaction = db.transaction([this.STORE_NAME], 'readwrite');
      const store = transaction.objectStore(this.STORE_NAME);

      const newService = {
        ...service,
        id: service.id || generateUUID(),
        createdAt: service.createdAt || getISOTimestamp(),
        updatedAt: getISOTimestamp(),
      };

      const request = store.add(newService);

      request.onsuccess = () => {
        Backup.autoSave().catch(console.error);
        resolve(newService);
      };

      request.onerror = (event) => {
        reject(event.target.error);
      };
    });
  },

  /**
   * Update an existing service
   * @param {object} service - Service data with id
   * @returns {Promise<object>}
   */
  update(service) {
    return new Promise((resolve, reject) => {
      const db = Database.getDB();
      const transaction = db.transaction([this.STORE_NAME], 'readwrite');
      const store = transaction.objectStore(this.STORE_NAME);

      const updatedService = {
        ...service,
        updatedAt: getISOTimestamp(),
      };

      const request = store.put(updatedService);

      request.onsuccess = () => {
        Backup.autoSave().catch(console.error);
        resolve(updatedService);
      };

      request.onerror = (event) => {
        reject(event.target.error);
      };
    });
  },

  /**
   * Delete a service by id
   * @param {string} id - Service id
   * @returns {Promise<void>}
   */
  delete(id) {
    return new Promise((resolve, reject) => {
      const db = Database.getDB();
      const transaction = db.transaction([this.STORE_NAME], 'readwrite');
      const store = transaction.objectStore(this.STORE_NAME);
      const request = store.delete(id);

      request.onsuccess = () => {
        Backup.autoSave().catch(console.error);
        resolve();
      };

      request.onerror = (event) => {
        reject(event.target.error);
      };
    });
  },

  /**
   * Get a service by id
   * @param {string} id - Service id
   * @returns {Promise<object|null>}
   */
  getById(id) {
    return new Promise((resolve, reject) => {
      const db = Database.getDB();
      const transaction = db.transaction([this.STORE_NAME], 'readonly');
      const store = transaction.objectStore(this.STORE_NAME);
      const request = store.get(id);

      request.onsuccess = () => {
        resolve(request.result || null);
      };

      request.onerror = (event) => {
        reject(event.target.error);
      };
    });
  },

  /**
   * Get all services
   * @returns {Promise<array>}
   */
  getAll() {
    return new Promise((resolve, reject) => {
      const db = Database.getDB();
      const transaction = db.transaction([this.STORE_NAME], 'readonly');
      const store = transaction.objectStore(this.STORE_NAME);
      const request = store.getAll();

      request.onsuccess = () => {
        // Sort by name
        const services = request.result.sort((a, b) =>
          a.name.localeCompare(b.name)
        );
        resolve(services);
      };

      request.onerror = (event) => {
        reject(event.target.error);
      };
    });
  },

  /**
   * Get billable services only
   * @returns {Promise<array>}
   */
  async getBillable() {
    const services = await this.getAll();
    return services.filter((s) => s.billable);
  },
};
