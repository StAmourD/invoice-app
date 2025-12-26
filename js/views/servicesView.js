/* ========================================
   Invoice App - Services View
   ======================================== */

/**
 * Services View - Manage services
 */
const ServicesView = {
  currentServices: [],
  sortColumn: 'name',
  sortDirection: 'asc',

  /**
   * Render the services view
   */
  async render(container, headerActions) {
    // Add "New Service" button to header
    headerActions.innerHTML = `
            <button class="btn btn-primary" id="add-service-btn">
                <span>+</span> New Service
            </button>
        `;

    // Show loading state
    Spinner.show(container, 'Loading services...');

    // Load services
    await this.loadServices();

    // Hide loading state
    Spinner.hide(container);

    // Render table
    this.renderTable(container);

    // Setup event listeners
    this.setupEventListeners(container);

    document.getElementById('add-service-btn').addEventListener('click', () => {
      this.showServiceModal();
    });
  },

  /**
   * Load services from database
   */
  async loadServices() {
    try {
      this.currentServices = await ServiceStore.getAll();
    } catch (error) {
      console.error('Failed to load services:', error);
      Toast.error('Failed to load services', error.message);
    }
  },

  /**
   * Render services table
   */
  renderTable(container) {
    const columns = [
      { key: 'name', label: 'Service Name', sortable: true },
      {
        key: 'rate',
        label: 'Hourly Rate',
        sortable: true,
        className: 'number',
        render: (service) => formatCurrency(service.rate),
      },
      {
        key: 'billable',
        label: 'Billable',
        sortable: true,
        render: (service) =>
          service.billable
            ? '<span class="badge badge-success">Yes</span>'
            : '<span class="badge badge-secondary">No</span>',
      },
      {
        key: 'actions',
        label: 'Actions',
        className: 'actions',
        render: (service) => `
                    <button class="btn btn-sm btn-secondary edit-btn" data-id="${service.id}">Edit</button>
                    <button class="btn btn-sm btn-danger delete-btn" data-id="${service.id}">Delete</button>
                `,
      },
    ];

    // Sort data
    const sortedData = Table.sortData(
      this.currentServices,
      this.sortColumn,
      this.sortDirection
    );

    const tableHtml = Table.render({
      columns,
      data: sortedData,
      emptyMessage: 'No services found. Click "New Service" to add one.',
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
        const service = await ServiceStore.getById(id);
        if (service) {
          this.showServiceModal(service);
        }
      });
    });

    // Delete buttons
    container.querySelectorAll('.delete-btn').forEach((btn) => {
      btn.addEventListener('click', async (e) => {
        const id = e.target.dataset.id;
        const service = await ServiceStore.getById(id);
        if (service) {
          this.confirmDelete(service);
        }
      });
    });
  },

  /**
   * Show service modal (add/edit)
   */
  showServiceModal(service = null) {
    const isEdit = !!service;
    const title = isEdit ? 'Edit Service' : 'New Service';

    const content = `
            <form id="service-form">
                <div class="form-group">
                    <label for="service-name" class="form-label required">Service Name</label>
                    <input 
                        type="text" 
                        id="service-name" 
                        class="form-input" 
                        value="${service ? escapeHtml(service.name) : ''}"
                        required
                    >
                </div>

                <div class="form-group">
                    <label for="service-rate" class="form-label required">Hourly Rate ($)</label>
                    <input 
                        type="number" 
                        id="service-rate" 
                        class="form-input" 
                        value="${service ? service.rate : ''}"
                        step="0.01"
                        min="0"
                        required
                    >
                </div>

                <div class="form-group">
                    <label class="form-checkbox">
                        <input 
                            type="checkbox" 
                            id="service-billable"
                            ${
                              service && service.billable !== false
                                ? 'checked'
                                : ''
                            }
                        >
                        <span>Billable (include in client invoices)</span>
                    </label>
                </div>

                <div class="form-actions">
                    <button type="button" class="btn btn-secondary" id="cancel-btn">Cancel</button>
                    <button type="submit" class="btn btn-primary">${
                      isEdit ? 'Save Changes' : 'Create Service'
                    }</button>
                </div>
            </form>
        `;

    Modal.open({ title, content });

    // Setup form submission
    const form = document.getElementById('service-form');
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      await this.saveService(service);
    });

    // Cancel button
    document.getElementById('cancel-btn').addEventListener('click', () => {
      Modal.close();
    });
  },

  /**
   * Save service (create or update)
   */
  async saveService(existingService) {
    const formData = {
      name: document.getElementById('service-name').value.trim(),
      rate: parseFloat(document.getElementById('service-rate').value),
      billable: document.getElementById('service-billable').checked,
    };

    // Validation
    if (!formData.name || isNaN(formData.rate) || formData.rate < 0) {
      Toast.error(
        'Validation Error',
        'Please fill in all required fields correctly'
      );
      return;
    }

    try {
      if (existingService) {
        // Update
        const updated = await ServiceStore.update({
          ...existingService,
          ...formData,
        });
        Toast.success(
          'Service Updated',
          `${updated.name} has been updated successfully`
        );
      } else {
        // Create
        const created = await ServiceStore.add(formData);
        Toast.success(
          'Service Created',
          `${created.name} has been added successfully`
        );
      }

      Modal.close();
      App.refresh();
    } catch (error) {
      console.error('Failed to save service:', error);
      Toast.error('Save Failed', error.message);
    }
  },

  /**
   * Confirm and delete service
   */
  confirmDelete(service) {
    Modal.confirm({
      title: 'Delete Service',
      message: `Are you sure you want to delete "${service.name}"? This action cannot be undone.`,
      icon: '🗑️',
      confirmText: 'Delete',
      confirmClass: 'btn-danger',
      onConfirm: async () => {
        try {
          await ServiceStore.delete(service.id);
          Toast.success('Service Deleted', `${service.name} has been deleted`);
          App.refresh();
        } catch (error) {
          console.error('Failed to delete service:', error);
          Toast.error('Delete Failed', error.message);
        }
      },
    });
  },
};
