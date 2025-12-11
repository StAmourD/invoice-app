/* ========================================
   Invoice App - Invoices View (Stub)
   ======================================== */

/**
 * Invoices View - Stub implementation
 */
const InvoicesView = {
  async render(container, headerActions) {
    container.innerHTML = `
            <div class="empty-state">
                <div class="empty-state-icon">📃</div>
                <h3 class="empty-state-title">Invoices</h3>
                <p class="empty-state-description">Invoices view will be implemented in Phase 3</p>
            </div>
        `;
  },

  async renderCreate(container, headerActions) {
    container.innerHTML = `
            <div class="empty-state">
                <div class="empty-state-icon">📃</div>
                <h3 class="empty-state-title">Create Invoice</h3>
                <p class="empty-state-description">Invoice creation will be implemented in Phase 3</p>
            </div>
        `;
  },

  async renderDetail(container, headerActions, invoiceId) {
    container.innerHTML = `
            <div class="empty-state">
                <div class="empty-state-icon">📃</div>
                <h3 class="empty-state-title">Invoice Detail</h3>
                <p class="empty-state-description">Invoice detail view will be implemented in Phase 3</p>
            </div>
        `;
  },
};
