/* ========================================
   Invoice App - Client Store
   ======================================== */

/**
 * Client Store - CRUD operations for clients
 */
const ClientStore = {
  STORE_NAME: 'clients',

  /**
   * Add a new client
   * @param {object} client - Client data
   * @returns {Promise<object>}
   */
  add(client) {
    return new Promise((resolve, reject) => {
      const db = Database.getDB();
      const transaction = db.transaction([this.STORE_NAME], 'readwrite');
      const store = transaction.objectStore(this.STORE_NAME);

      const newClient = {
        ...client,
        id: client.id || generateUUID(),
        createdAt: client.createdAt || getISOTimestamp(),
        updatedAt: getISOTimestamp(),
      };

      const request = store.add(newClient);

      request.onsuccess = () => {
        Backup.autoSave().catch(console.error);
        resolve(newClient);
      };

      request.onerror = (event) => {
        reject(event.target.error);
      };
    });
  },

  /**
   * Update an existing client
   * @param {object} client - Client data with id
   * @returns {Promise<object>}
   */
  update(client) {
    return new Promise((resolve, reject) => {
      const db = Database.getDB();
      const transaction = db.transaction([this.STORE_NAME], 'readwrite');
      const store = transaction.objectStore(this.STORE_NAME);

      const updatedClient = {
        ...client,
        updatedAt: getISOTimestamp(),
      };

      const request = store.put(updatedClient);

      request.onsuccess = () => {
        Backup.autoSave().catch(console.error);
        resolve(updatedClient);
      };

      request.onerror = (event) => {
        reject(event.target.error);
      };
    });
  },

  /**
   * Delete a client by id
   * @param {string} id - Client id
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
   * Get a client by id
   * @param {string} id - Client id
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
   * Get all clients
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
        const clients = request.result.sort((a, b) =>
          a.name.localeCompare(b.name)
        );
        resolve(clients);
      };

      request.onerror = (event) => {
        reject(event.target.error);
      };
    });
  },

  /**
   * Search clients by name
   * @param {string} query - Search query
   * @returns {Promise<array>}
   */
  async search(query) {
    const clients = await this.getAll();
    const lowerQuery = query.toLowerCase();
    return clients.filter(
      (client) =>
        client.name.toLowerCase().includes(lowerQuery) ||
        client.email.toLowerCase().includes(lowerQuery)
    );
  },
};
