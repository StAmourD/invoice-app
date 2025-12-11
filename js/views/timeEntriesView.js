/* ========================================
   Invoice App - Time Entries View
   ======================================== */

/**
 * Time Entries View - Manage time entries
 */
const TimeEntriesView = {
  currentEntries: [],
  clients: [],
  services: [],
  sortColumn: 'startDate',
  sortDirection: 'desc',
  filters: {
    clientId: '',
    startDate: '',
    endDate: '',
    billableOnly: false,
  },

  /**
   * Render the time entries view
   */
  async render(container, headerActions) {
    // Add "New Time Entry" button to header
    headerActions.innerHTML = `
            <button class="btn btn-primary" id="add-entry-btn">
                <span>+</span> New Time Entry
            </button>
        `;

    // Show loading state
    Spinner.show(container, 'Loading time entries...');

    // Load data
    await this.loadData();

    // Hide loading state
    Spinner.hide(container);

    // Render filters and table
    this.renderView(container);

    // Setup event listeners
    this.setupEventListeners(container);

    document.getElementById('add-entry-btn').addEventListener('click', () => {
      this.showEntryModal();
    });
  },

  /**
   * Load all required data
   */
  async loadData() {
    try {
      this.currentEntries = await TimeEntryStore.getAll();
      this.clients = await ClientStore.getAll();
      this.services = await ServiceStore.getAll();
    } catch (error) {
      console.error('Failed to load data:', error);
      Toast.error('Failed to load data', error.message);
    }
  },

  /**
   * Render complete view with filters and table
   */
  renderView(container) {
    const filteredEntries = this.applyFilters();

    container.innerHTML = `
            <div class="filters-bar">
                <div class="filter-group">
                    <label>Client</label>
                    <select id="filter-client" class="form-select">
                        <option value="">All Clients</option>
                        ${this.clients
                          .map(
                            (c) => `
                            <option value="${c.id}" ${
                              this.filters.clientId === c.id ? 'selected' : ''
                            }>
                                ${escapeHtml(c.name)}
                            </option>
                        `
                          )
                          .join('')}
                    </select>
                </div>

                <div class="filter-group">
                    <label>Start Date</label>
                    <input type="date" id="filter-start-date" class="form-input" value="${
                      this.filters.startDate
                    }">
                </div>

                <div class="filter-group">
                    <label>End Date</label>
                    <input type="date" id="filter-end-date" class="form-input" value="${
                      this.filters.endDate
                    }">
                </div>

                <div class="filter-group">
                    <label class="form-checkbox" style="margin-top: 20px;">
                        <input type="checkbox" id="filter-billable" ${
                          this.filters.billableOnly ? 'checked' : ''
                        }>
                        <span>Billable only</span>
                    </label>
                </div>

                <div class="filter-actions">
                    <button type="button" class="btn btn-secondary" id="clear-filters-btn">Clear</button>
                </div>
            </div>

            <div class="card">
                ${this.renderTable(filteredEntries)}
            </div>
        `;

    this.setupFilterListeners(container);
  },

  /**
   * Apply current filters to entries
   */
  applyFilters() {
    let filtered = [...this.currentEntries];

    if (this.filters.clientId) {
      filtered = filtered.filter((e) => e.clientId === this.filters.clientId);
    }

    if (this.filters.startDate) {
      const start = new Date(this.filters.startDate);
      filtered = filtered.filter((e) => new Date(e.startDate) >= start);
    }

    if (this.filters.endDate) {
      const end = new Date(this.filters.endDate);
      end.setHours(23, 59, 59, 999);
      filtered = filtered.filter((e) => new Date(e.startDate) <= end);
    }

    if (this.filters.billableOnly) {
      filtered = filtered.filter((e) => e.billable);
    }

    return filtered;
  },

  /**
   * Render time entries table
   */
  renderTable(entries) {
    const columns = [
      {
        key: 'startDate',
        label: 'Date',
        sortable: true,
        render: (entry) => formatDate(entry.startDate),
      },
      {
        key: 'clientId',
        label: 'Client',
        sortable: true,
        render: (entry) => {
          const client = this.clients.find((c) => c.id === entry.clientId);
          return client ? escapeHtml(client.name) : 'Unknown';
        },
      },
      {
        key: 'serviceId',
        label: 'Service',
        sortable: true,
        render: (entry) => {
          const service = this.services.find((s) => s.id === entry.serviceId);
          return service ? escapeHtml(service.name) : 'Unknown';
        },
      },
      {
        key: 'description',
        label: 'Description',
        sortable: false,
        render: (entry) => escapeHtml(entry.description || ''),
      },
      {
        key: 'hours',
        label: 'Hours',
        sortable: false,
        className: 'number',
        render: (entry) => {
          return formatHours(entry.hours);
        },
      },
      {
        key: 'amount',
        label: 'Amount',
        sortable: false,
        className: 'number',
        render: (entry) => {
          const service = this.services.find((s) => s.id === entry.serviceId);
          const amount = service ? entry.hours * service.rate : 0;
          return formatCurrency(amount);
        },
      },
      {
        key: 'billable',
        label: 'Status',
        sortable: true,
        render: (entry) => {
          if (entry.invoiceId) {
            return '<span class="badge badge-success">Invoiced</span>';
          } else if (entry.billable) {
            return '<span class="badge badge-warning">Unbilled</span>';
          } else {
            return '<span class="badge badge-secondary">Non-billable</span>';
          }
        },
      },
      {
        key: 'actions',
        label: 'Actions',
        className: 'actions',
        render: (entry) => `
                    <button class="btn btn-sm btn-secondary edit-btn" data-id="${
                      entry.id
                    }" ${entry.invoiceId ? 'disabled' : ''}>Edit</button>
                    <button class="btn btn-sm btn-danger delete-btn" data-id="${
                      entry.id
                    }" ${entry.invoiceId ? 'disabled' : ''}>Delete</button>
                `,
      },
    ];

    // Sort data
    const sortedData = Table.sortData(
      entries,
      this.sortColumn,
      this.sortDirection
    );

    // Calculate totals
    let totalHours = 0;
    let totalAmount = 0;
    sortedData.forEach((entry) => {
      totalHours += entry.hours;
      const service = this.services.find((s) => s.id === entry.serviceId);
      if (service) {
        totalAmount += entry.hours * service.rate;
      }
    });

    const tableHtml = Table.render({
      columns,
      data: sortedData,
      emptyMessage: 'No time entries found. Click "New Time Entry" to add one.',
      sortColumn: this.sortColumn,
      sortDirection: this.sortDirection,
    });

    return `
            ${tableHtml}
            ${
              sortedData.length > 0
                ? `
                <div style="padding: 1rem; background: var(--color-gray-50); border-top: 1px solid var(--color-gray-200); display: flex; justify-content: flex-end; gap: 2rem; font-weight: 600;">
                    <div>Total Hours: ${formatHours(totalHours)}</div>
                    <div>Total Amount: ${formatCurrency(totalAmount)}</div>
                </div>
            `
                : ''
            }
        `;
  },

  /**
   * Setup filter event listeners
   */
  setupFilterListeners(container) {
    document.getElementById('filter-client').addEventListener('change', (e) => {
      this.filters.clientId = e.target.value;
      this.renderView(container);
    });

    document
      .getElementById('filter-start-date')
      .addEventListener('change', (e) => {
        this.filters.startDate = e.target.value;
        this.renderView(container);
      });

    document
      .getElementById('filter-end-date')
      .addEventListener('change', (e) => {
        this.filters.endDate = e.target.value;
        this.renderView(container);
      });

    document
      .getElementById('filter-billable')
      .addEventListener('change', (e) => {
        this.filters.billableOnly = e.target.checked;
        this.renderView(container);
      });

    document
      .getElementById('clear-filters-btn')
      .addEventListener('click', () => {
        this.filters = {
          clientId: '',
          startDate: '',
          endDate: '',
          billableOnly: false,
        };
        this.renderView(container);
      });
  },

  /**
   * Setup table event listeners
   */
  setupEventListeners(container) {
    // Sort handlers
    Table.setupSortHandlers(
      container,
      (column, direction) => {
        this.sortColumn = column;
        this.sortDirection = direction;
        this.renderView(container);
      },
      this.sortColumn,
      this.sortDirection
    );

    // Edit buttons
    container.querySelectorAll('.edit-btn').forEach((btn) => {
      btn.addEventListener('click', async (e) => {
        const id = e.target.dataset.id;
        const entry = await TimeEntryStore.getById(id);
        if (entry) {
          this.showEntryModal(entry);
        }
      });
    });

    // Delete buttons
    container.querySelectorAll('.delete-btn').forEach((btn) => {
      btn.addEventListener('click', async (e) => {
        const id = e.target.dataset.id;
        const entry = await TimeEntryStore.getById(id);
        if (entry) {
          this.confirmDelete(entry);
        }
      });
    });
  },

  /**
   * Show time entry modal (add/edit)
   */
  showEntryModal(entry = null) {
    const isEdit = !!entry;
    const title = isEdit ? 'Edit Time Entry' : 'New Time Entry';

    const content = `
            <form id="entry-form">
                <div class="form-group">
                    <label for="entry-client" class="form-label required">Client</label>
                    <select id="entry-client" class="form-select" required>
                        <option value="">Select a client</option>
                        ${this.clients
                          .map(
                            (c) => `
                            <option value="${c.id}" ${
                              entry && entry.clientId === c.id ? 'selected' : ''
                            }>
                                ${escapeHtml(c.name)}
                            </option>
                        `
                          )
                          .join('')}
                    </select>
                </div>

                <div class="form-group">
                    <label for="entry-service" class="form-label required">Service</label>
                    <select id="entry-service" class="form-select" required>
                        <option value="">Select a service</option>
                        ${this.services
                          .map(
                            (s) => `
                            <option value="${s.id}" ${
                              entry && entry.serviceId === s.id
                                ? 'selected'
                                : ''
                            }>
                                ${escapeHtml(s.name)} - ${formatCurrency(
                              s.rate
                            )}/hr
                            </option>
                        `
                          )
                          .join('')}
                    </select>
                </div>

                <div class="form-row">
                    <div class="form-group">
                        <label for="entry-start-date" class="form-label required">Start Date</label>
                        <input 
                            type="date" 
                            id="entry-start-date" 
                            class="form-input" 
                            value="${
                              entry ? formatDateForInput(entry.startDate) : ''
                            }"
                            required
                        >
                    </div>

                    <div class="form-group">
                        <label for="entry-hours" class="form-label required">Hours</label>
                        <input 
                            type="number" 
                            id="entry-hours" 
                            class="form-input" 
                            placeholder="0.00"
                            min="0"
                            step="0.01"
                            value="${entry ? entry.hours.toFixed(2) : ''}"
                            required
                        >
                    </div>
                </div>

                <div class="form-group">
                    <label for="entry-description" class="form-label">Description</label>
                    <textarea 
                        id="entry-description" 
                        class="form-textarea" 
                        rows="3"
                    >${
                      entry ? escapeHtml(entry.description || '') : ''
                    }</textarea>
                </div>

                <div class="form-group">
                    <label class="form-checkbox">
                        <input 
                            type="checkbox" 
                            id="entry-billable"
                            ${
                              entry && entry.billable !== false
                                ? 'checked'
                                : 'checked'
                            }
                        >
                        <span>Billable</span>
                    </label>
                </div>

                <div class="form-actions">
                    <button type="button" class="btn btn-secondary" id="cancel-btn">Cancel</button>
                    <button type="submit" class="btn btn-primary">${
                      isEdit ? 'Save Changes' : 'Create Entry'
                    }</button>
                </div>
            </form>
        `;

    Modal.open({ title, content, size: 'lg' });

    // Setup form submission
    const form = document.getElementById('entry-form');
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      await this.saveEntry(entry);
    });

    // Cancel button
    document.getElementById('cancel-btn').addEventListener('click', () => {
      Modal.close();
    });
  },

  /**
   * Save time entry (create or update)
   */
  async saveEntry(existingEntry) {
    const hoursValue = parseFloat(document.getElementById('entry-hours').value);
    const formData = {
      clientId: document.getElementById('entry-client').value,
      serviceId: document.getElementById('entry-service').value,
      startDate: document.getElementById('entry-start-date').value,
      hours: hoursValue,
      description: document.getElementById('entry-description').value.trim(),
      billable: document.getElementById('entry-billable').checked,
    };

    // Validation
    if (
      !formData.clientId ||
      !formData.serviceId ||
      !formData.startDate ||
      !formData.hours
    ) {
      Toast.error('Validation Error', 'Please fill in all required fields');
      return;
    }

    if (formData.hours <= 0) {
      Toast.error('Validation Error', 'Hours must be greater than 0');
      return;
    }

    if (!/^\d+(\.\d{1,2})?$/.test(formData.hours.toFixed(2))) {
      Toast.error('Validation Error', 'Hours must be in format #.##');
      return;
    }

    try {
      if (existingEntry) {
        // Update
        const updated = await TimeEntryStore.update({
          ...existingEntry,
          ...formData,
        });
        Toast.success(
          'Time Entry Updated',
          'Time entry has been updated successfully'
        );
      } else {
        // Create
        const created = await TimeEntryStore.add(formData);
        Toast.success(
          'Time Entry Created',
          'Time entry has been added successfully'
        );
      }

      Modal.close();
      App.refresh();
    } catch (error) {
      console.error('Failed to save time entry:', error);
      Toast.error('Save Failed', error.message);
    }
  },

  /**
   * Confirm and delete time entry
   */
  confirmDelete(entry) {
    if (entry.invoiceId) {
      Toast.error('Cannot Delete', 'This time entry is already invoiced');
      return;
    }

    Modal.confirm({
      title: 'Delete Time Entry',
      message:
        'Are you sure you want to delete this time entry? This action cannot be undone.',
      icon: '🗑️',
      confirmText: 'Delete',
      confirmClass: 'btn-danger',
      onConfirm: async () => {
        try {
          await TimeEntryStore.delete(entry.id);
          Toast.success('Time Entry Deleted', 'Time entry has been deleted');
          App.refresh();
        } catch (error) {
          console.error('Failed to delete time entry:', error);
          Toast.error('Delete Failed', error.message);
        }
      },
    });
  },
};
