/* ========================================
   Invoice App - Clients View
   ======================================== */

/**
 * Clients View - Manage clients
 */
const ClientsView = {
  currentClients: [],
  sortColumn: 'name',
  sortDirection: 'asc',

  /**
   * Render the clients view
   */
  async render(container, headerActions) {
    // Add "New Client" button to header
    headerActions.innerHTML = `
            <button class="btn btn-primary" id="add-client-btn">
                <span>+</span> New Client
            </button>
        `;

    // Show loading state
    Spinner.show(container, 'Loading clients...');

    // Load clients
    await this.loadClients();

    // Hide loading state
    Spinner.hide(container);

    // Render table
    this.renderTable(container);

    // Setup event listeners
    this.setupEventListeners(container);

    document.getElementById('add-client-btn').addEventListener('click', () => {
      this.showClientModal();
    });
  },

  /**
   * Load clients from database
   */
  async loadClients() {
    try {
      this.currentClients = await ClientStore.getAll();
    } catch (error) {
      console.error('Failed to load clients:', error);
      Toast.error('Failed to load clients', error.message);
    }
  },

  /**
   * Render clients table
   */
  renderTable(container) {
    const columns = [
      { key: 'name', label: 'Name', sortable: true },
      { key: 'email', label: 'Email', sortable: true },
      { key: 'address', label: 'Address', sortable: false },
      {
        key: 'daysToPay',
        label: 'Payment Terms',
        sortable: true,
        render: (client) => `${client.daysToPay} days`,
      },
      {
        key: 'actions',
        label: 'Actions',
        className: 'actions',
        render: (client) => `
                    <button class="btn btn-sm btn-secondary edit-btn" data-id="${client.id}">Edit</button>
                    <button class="btn btn-sm btn-danger delete-btn" data-id="${client.id}">Delete</button>
                `,
      },
    ];

    // Sort data
    const sortedData = Table.sortData(
      this.currentClients,
      this.sortColumn,
      this.sortDirection
    );

    const tableHtml = Table.render({
      columns,
      data: sortedData,
      emptyMessage: 'No clients found. Click "New Client" to add one.',
      sortColumn: this.sortColumn,
      sortDirection: this.sortDirection,
    });

    container.innerHTML = `
            <div class="card">
                ${tableHtml}
            </div>
        `;
  },

  /**
   * Setup event listeners
   */
  setupEventListeners(container) {
    // Sort handlers
    Table.setupSortHandlers(
      container,
      (column, direction) => {
        this.sortColumn = column;
        this.sortDirection = direction;
        this.renderTable(container);
        this.setupEventListeners(container);
      },
      this.sortColumn,
      this.sortDirection
    );

    // Edit buttons
    container.querySelectorAll('.edit-btn').forEach((btn) => {
      btn.addEventListener('click', async (e) => {
        const id = e.target.dataset.id;
        const client = await ClientStore.getById(id);
        if (client) {
          this.showClientModal(client);
        }
      });
    });

    // Delete buttons
    container.querySelectorAll('.delete-btn').forEach((btn) => {
      btn.addEventListener('click', async (e) => {
        const id = e.target.dataset.id;
        const client = await ClientStore.getById(id);
        if (client) {
          this.confirmDelete(client);
        }
      });
    });
  },

  /**
   * Show client modal (add/edit)
   */
  showClientModal(client = null) {
    const isEdit = !!client;
    const title = isEdit ? 'Edit Client' : 'New Client';

    const content = `
            <form id="client-form">
                <div class="form-group">
                    <label for="client-name" class="form-label required">Name</label>
                    <input 
                        type="text" 
                        id="client-name" 
                        class="form-input" 
                        value="${client ? escapeHtml(client.name) : ''}"
                        required
                    >
                </div>

                <div class="form-group">
                    <label for="client-email" class="form-label required">Email</label>
                    <input 
                        type="email" 
                        id="client-email" 
                        class="form-input" 
                        value="${client ? escapeHtml(client.email) : ''}"
                        required
                    >
                </div>

                <div class="form-group">
                    <label for="client-address" class="form-label">Address</label>
                    <textarea 
                        id="client-address" 
                        class="form-textarea" 
                        rows="3"
                    >${
                      client ? escapeHtml(client.address || '') : ''
                    }</textarea>
                </div>

                <div class="form-group">
                    <label for="client-days-to-pay" class="form-label required">Payment Terms (Days)</label>
                    <input 
                        type="number" 
                        id="client-days-to-pay" 
                        class="form-input" 
                        value="${client ? client.daysToPay : 30}"
                        min="1"
                        max="365"
                        required
                    >
                    <div class="form-hint">Number of days until payment is due</div>
                </div>

                <div class="form-actions">
                    <button type="button" class="btn btn-secondary" id="cancel-btn">Cancel</button>
                    <button type="submit" class="btn btn-primary">${
                      isEdit ? 'Save Changes' : 'Create Client'
                    }</button>
                </div>
            </form>
        `;

    Modal.open({ title, content });

    // Setup form submission
    const form = document.getElementById('client-form');
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      await this.saveClient(client);
    });

    // Cancel button
    document.getElementById('cancel-btn').addEventListener('click', () => {
      Modal.close();
    });
  },

  /**
   * Save client (create or update)
   */
  async saveClient(existingClient) {
    const formData = {
      name: document.getElementById('client-name').value.trim(),
      email: document.getElementById('client-email').value.trim(),
      address: document.getElementById('client-address').value.trim(),
      daysToPay: parseInt(
        document.getElementById('client-days-to-pay').value,
        10
      ),
    };

    // Validation
    if (!formData.name || !formData.email) {
      Toast.error('Validation Error', 'Name and email are required');
      return;
    }

    try {
      if (existingClient) {
        // Update
        const updated = await ClientStore.update({
          ...existingClient,
          ...formData,
        });
        Toast.success(
          'Client Updated',
          `${updated.name} has been updated successfully`
        );
      } else {
        // Create
        const created = await ClientStore.add(formData);
        Toast.success(
          'Client Created',
          `${created.name} has been added successfully`
        );
      }

      Modal.close();
      App.refresh();
    } catch (error) {
      console.error('Failed to save client:', error);
      Toast.error('Save Failed', error.message);
    }
  },

  /**
   * Confirm and delete client
   */
  confirmDelete(client) {
    Modal.confirm({
      title: 'Delete Client',
      message: `Are you sure you want to delete "${client.name}"? This action cannot be undone.`,
      icon: '🗑️',
      confirmText: 'Delete',
      confirmClass: 'btn-danger',
      onConfirm: async () => {
        try {
          await ClientStore.delete(client.id);
          Toast.success('Client Deleted', `${client.name} has been deleted`);
          App.refresh();
        } catch (error) {
          console.error('Failed to delete client:', error);
          Toast.error('Delete Failed', error.message);
        }
      },
    });
  },
};
