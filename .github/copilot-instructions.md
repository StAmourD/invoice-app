# Invoice App - AI Coding Assistant Instructions

## Project Architecture

This is a **single-user, browser-based invoice management app** built with **vanilla JavaScript** (no frameworks). All data is stored locally in IndexedDB with automatic backup to Google Drive. The app uses hash-based routing (`#/clients`, `#/invoices`) and follows a single-page application pattern.

**Tech Stack:**

- Vanilla JS (ES6+), HTML5, CSS3 (no transpilation/build process)
- IndexedDB for local storage (`InvoiceAppDB` v2)
- Google Drive API with OAuth 2.0 for cloud backup (all browsers)
- Google Identity Services for client-side authentication
- jsPDF for PDF generation (included via CDN)

**Key Files:**

- `js/app.js` - Router and app initialization
- `js/db/database.js` - IndexedDB setup with 5 stores: `clients`, `services`, `timeEntries`, `invoices`, `settings`
- `js/utils/googleDrive.js` - Google Drive API client with OAuth 2.0
- `js/utils/backup.js` - Backup/restore with Google Drive integration
- `js/views/*.js` - View modules for each page
- `js/components/*.js` - Reusable UI components (Modal, Toast, Table, Spinner)
- `js/utils/helpers.js` - UUID generation, date/currency formatting, calculations

## View Architecture Pattern

All views follow this structure (see `invoicesView.js`, `clientsView.js` for examples):

```javascript
const MyView = {
  currentData: [],
  filters: {},
  sortColumn: 'name',
  sortDirection: 'asc',

  async render(container, headerActions) {
    // 1. Add header buttons
    headerActions.innerHTML = `<button class="btn btn-primary">Action</button>`;

    // 2. Show loading state
    Spinner.show(container, 'Loading...');

    // 3. Load data
    await this.loadData();

    // 4. Hide loading and render view
    Spinner.hide(container);
    this.renderView(container);

    // 5. Setup event listeners
    this.setupEventListeners(container);
  },

  async loadData() {
    // Load from store, handle errors with Toast.error()
  },

  renderView(container) {
    // Render filters, table, and content
  },

  setupEventListeners(container) {
    // Add event listeners (use event delegation where possible)
  },
};
```

## Database Store Patterns

All store modules (`js/db/*Store.js`) implement:

- `add(item)` - Auto-generates UUID and timestamps, calls `Backup.autoSave()`
- `update(item)` - Updates `updatedAt` timestamp, calls `Backup.autoSave()`
- `delete(id)` - Calls `Backup.autoSave()` after deletion
- `getById(id)` - Returns single item or null
- `getAll()` - Returns all items as array

Store-specific query methods exist (e.g., `InvoiceStore.getOverdue()`, `TimeEntryStore.getUnbilledByClient(clientId)`).

## Component Usage

**Modal:**

```javascript
Modal.open({
  title: 'Add Client',
  content: `<form id="my-form">...</form>`,
  size: 'default', // or 'lg', 'xl'
  onClose: () => {
    /* optional cleanup */
  },
});
Modal.close(); // ESC key also works
```

**Toast Notifications:**

```javascript
Toast.success('Title', 'Message');
Toast.error('Title', 'Error details');
Toast.warning('Title', 'Warning message');
```

**Table Rendering:**

```javascript
const html = Table.render({
  columns: [
    { key: 'name', label: 'Name', sortable: true },
    { key: 'email', label: 'Email', sortable: false },
  ],
  data: items,
  sortColumn: this.sortColumn,
  sortDirection: this.sortDirection,
  onSort: (column) => {
    /* handle sort */
  },
  emptyMessage: 'No items found',
});
```

## Critical Conventions

1. **Date Handling:** Use `YYYY-MM-DD` format strings (not Date objects) in IndexedDB. Parse with `parseLocalDate(dateStr)` to avoid timezone issues. Format for display with `formatDate(dateStr)`.

2. **Currency:** All amounts are numbers (not strings). Format with `formatCurrency(amount)` which returns `$XX.XX`.

3. **UUID Generation:** Always use `generateUUID()` for new IDs. Never use auto-increment or timestamps.

4. **Form Validation:** Views handle their own validation inline. Show errors below inputs with `.error-message` class.

5. **Async Operations:** Always wrap IndexedDB operations in try/catch and show Toast errors on failure.

6. **Auto-Backup:** All CRUD methods in stores automatically call `Backup.autoSave()` after mutations. Don't call it manually.

7. **Routing:** Use `window.location.hash = '#/view/param'` for navigation. Router in `app.js` handles the rest.

8. **HTML Escaping:** Always use `escapeHtml(str)` from helpers.js when rendering user input to prevent XSS.

## CSS Class Reference

- Buttons: `.btn`, `.btn-primary`, `.btn-secondary`, `.btn-success`, `.btn-danger`, `.btn-outline`
- Forms: `.form-group`, `.form-label`, `.form-input`, `.form-select`, `.form-checkbox`
- Layout: `.card`, `.filters-bar`, `.filter-group`, `.content-body`
- Tables: `.data-table`, `.sortable` (use Table component instead of manual markup)
- Status badges: `.badge`, `.badge-success`, `.badge-warning`, `.badge-danger`

## Development Workflow

**No build process** - Simply open `index.html` in browser. For local dev server:

```bash
python -m http.server 8000
# or
npx serve
```

**Debugging:** Use browser DevTools. IndexedDB data visible in Application tab. Check `App.currentView` in console.

**Testing Changes:** Refresh browser. Use sample data seeded automatically on first run (see `app.js` seedDataIfEmpty()).

## Current Project Status

All phases complete. The app includes full CRUD operations for clients, services, time entries, and invoices, plus dashboard with metrics, comprehensive reports with CSV export, PDF invoice generation, and automatic backup/restore with Google Drive integration. 

**Backup System:**
- Uses Google Drive API with OAuth 2.0 (client-side)
- `drive.file` scope for app-specific folder access
- Separate folders for dev (`InvoiceApp-dev`) and prod (`InvoiceApp`)
- Folders are visible in user's Drive (not hidden)
- Environment automatically detected (localhost = dev, otherwise = prod)
- OAuth Client ID configured in Settings view
- Tokens stored in IndexedDB, expire after 1 hour (normal for apps in "Testing" mode)

Reference `invoice-app-tasks.md` for the complete task list.

When implementing new features, follow the exact patterns in `invoicesView.js` (most comprehensive example) or `clientsView.js` (simpler example).
