# AI Agent Handoff Document

## Project Overview

You are continuing development on an **Invoice App** — a single-user, browser-based application for freelancers/consultants to manage clients, services, time tracking, and invoice generation. The app is built with **Vanilla JavaScript, HTML5, and CSS3** (no frameworks), uses **IndexedDB** for local storage, and includes automatic backup functionality.

**Current Status:** 26 of 44 tasks complete (59% done). Phases 0-3 are complete. Currently starting Phase 4 (Reports & Dashboard).

---

## Tech Stack & Architecture

### Frontend

- **Vanilla JavaScript** (ES6+, no transpilation)
- **HTML5** + **CSS3** (CSS custom properties for theming)
- **Hash-based routing** (`#/clients`, `#/invoices`, etc.)
- **Single-page application** pattern

### Data Storage

- **IndexedDB** (`InvoiceAppDB` v1)
- 5 object stores: `clients`, `services`, `timeEntries`, `invoices`, `settings`
- No authentication (single-user, local-only)

### Key Libraries/APIs

- **jsPDF** (to be added in Phase 5 for PDF generation)
- **File System Access API** (Chrome/Edge, to be implemented in Phase 6 for auto-backup)
- **Intl.NumberFormat** / **Intl.DateTimeFormat** (native, already in use)

### Browser Support

- Modern browsers only (Chrome/Edge primary target)
- No PWA features required
- No mobile optimization required (desktop-focused)

---

## Project Structure

```
Invoice-App/
├── index.html                      # Main HTML (includes all scripts)
├── css/
│   ├── styles.css                  # Base styles, layout, navigation
│   ├── components.css              # Buttons, forms, tables, modals
│   └── print.css                   # Print-friendly invoice styles
├── js/
│   ├── app.js                      # Router, app initialization, sample data seeding
│   ├── db/
│   │   ├── database.js             # IndexedDB initialization
│   │   ├── clientStore.js          # CRUD for clients
│   │   ├── serviceStore.js         # CRUD for services
│   │   ├── timeEntryStore.js       # CRUD + queries for time entries
│   │   ├── invoiceStore.js         # CRUD + queries for invoices
│   │   └── settingsStore.js        # Key-value settings store
│   ├── views/
│   │   ├── clientsView.js          # ✅ Client management UI (complete)
│   │   ├── servicesView.js         # ✅ Service management UI (complete)
│   │   ├── timeEntriesView.js      # ✅ Time entry management UI (complete)
│   │   ├── invoicesView.js         # ✅ Invoice list/create/detail (complete)
│   │   ├── dashboardView.js        # ⏳ TODO: Summary cards + recent invoices
│   │   ├── reportsView.js          # ⏳ TODO: Time & invoice reports with filters
│   │   └── settingsView.js         # ⏳ TODO: Company info + backup settings
│   ├── components/
│   │   ├── modal.js                # ✅ Reusable modal (open/close/confirm)
│   │   ├── table.js                # ✅ Sortable table renderer
│   │   └── toast.js                # ✅ Notification system (success/error/warning)
│   └── utils/
│       ├── helpers.js              # ✅ UUID, date/currency formatting, calculations
│       ├── backup.js               # ⚠️ STUB: autoSave() exists, needs full implementation (Phase 6)
│       └── pdfGenerator.js         # ⚠️ STUB: placeholder, needs jsPDF integration (Phase 5)
├── assets/                         # (empty, reserved for logo/images)
├── invoice-app-tasks.md            # Master task list with progress tracking
└── Prompt - Create Invoice App - ChatGPT.md  # Original user requirements
```

---

## What's Been Completed

### ✅ Phase 0: Project Setup (5/5 tasks)

- Created folder structure
- Built `index.html` with navigation, modal container, toast container
- Created base CSS with variables and responsive layout
- Initialized `app.js` with router and sample data seeding
- Created utility helpers (UUID, date/currency formatting, duration calculations)

### ✅ Phase 1: Database Layer (7/7 tasks)

- IndexedDB initialization with all 5 stores and indexes
- Full CRUD operations for all stores (clients, services, timeEntries, invoices, settings)
- Query methods: `getByClient()`, `getByInvoice()`, `getUnbilledByClient()`, etc.
- Auto-backup integration: all mutations call `Backup.autoSave()` (stub currently)
- Sample data seeding: 2 clients, 3 services, 4 time entries

### ✅ Phase 2: CRUD Views (6/6 tasks)

- **clientsView.js**: Full CRUD with table, modal forms, validation (284 lines)
- **servicesView.js**: Full CRUD with rate display, billable toggle (233 lines)
- **timeEntriesView.js**: Full CRUD with filters (client, date range, billable), totals footer (429 lines)
- **components.css**: Polished styles for all UI elements
- **modal.js**: Reusable modal with `open()`, `close()`, `confirm()` methods
- **table.js**: Sortable table renderer with column definitions

### ✅ Phase 3: Invoices (5/5 tasks) — JUST COMPLETED

- **invoicesView.js**: Complete invoice management (900+ lines)
  - **List view**: Filters by client, date range, paid status; status badges (Paid/Unpaid/Overdue); totals footer
  - **Create flow**: Select client → select unbilled time entries (multi-select) → auto-calculate total → set dates → generate invoice number
  - **Edit functionality**: Edit due date with validation (line items read-only)
  - **Detail view**: Full invoice preview with print button, PDF download button, mark paid/unpaid toggle
  - **Time entry linking**: Auto-links on creation, unlinks on deletion

### ✅ Partial Progress

- **Phase 5**: `print.css` created (1/4 tasks)
- **Phase 7**: Router + toast notifications working (2/6 tasks)

---

## What Needs to Be Done Next

### 🔜 Phase 4: Reports & Dashboard (0/4 tasks) — IMMEDIATE PRIORITY

#### Task 4.1: Create `dashboardView.js`

**Complexity:** Medium  
**Requirements:**

- Summary cards showing:
  - Total revenue (sum of all paid invoices)
  - Outstanding amount (sum of all unpaid invoices)
  - Overdue amount (sum of unpaid invoices past due date)
- Recent invoices list (last 10):
  - Show invoice number, client name, due date, amount, status badge
  - Quick toggle button to mark paid/unpaid
  - Click invoice number to navigate to detail view
- Empty state if no invoices exist
- Auto-refresh on data changes

**Acceptance Criteria:**

- Dashboard shows accurate calculated totals
- Quick toggle updates invoice status without navigation
- Cards are visually distinct (use color coding)

#### Task 4.2: Create Time Entry Report in `reportsView.js`

**Complexity:** Medium  
**Requirements:**

- Filters:
  - Date range (start date, end date)
  - Client (dropdown)
  - Billable status (all/billable/non-billable)
  - Invoice status (all/invoiced/unbilled)
- Table columns: Date, Client, Service, Description, Hours, Rate, Amount, Status
- Totals footer: Total hours, Total amount
- Export button (triggers CSV export)

**Acceptance Criteria:**

- Filters work correctly and combine (AND logic)
- Totals calculate accurately based on filtered results
- Empty state when no entries match filters

#### Task 4.3: Create Invoice Report in `reportsView.js`

**Complexity:** Medium  
**Requirements:**

- Filters:
  - Date range (issue date)
  - Client (dropdown)
  - Paid status (all/paid/unpaid)
- Table columns: Invoice #, Client, Issue Date, Due Date, Amount, Status
- Totals footer: Total amount, Paid amount, Unpaid amount
- Export button (triggers CSV export)

**Acceptance Criteria:**

- Filters work correctly
- Totals calculate accurately
- Can switch between Time Entry Report and Invoice Report (tabs or dropdown)

#### Task 4.4: Add CSV Export Functionality

**Complexity:** Low  
**Requirements:**

- Add `exportToCSV()` function to `helpers.js`
- Takes array of objects and column definitions
- Generates CSV with proper escaping (quotes around fields with commas)
- Triggers download with filename: `{report-type}-{date}.csv`
- Works for both time entry and invoice reports

**Acceptance Criteria:**

- CSV downloads with correct data
- Opens correctly in Excel/Google Sheets
- Special characters are properly escaped

---

### 🔜 Phase 5: PDF Generation (3/4 remaining tasks)

#### Task 5.1: Add jsPDF Library

- Include via CDN in `index.html` (before closing `</body>`)
- CDN: `https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js`

#### Task 5.2: Implement `pdfGenerator.js`

- Replace stub with full implementation
- Use jsPDF to generate invoice PDF matching the HTML template
- Include: company logo placeholder, header, client info, line items table, footer
- Handle multi-page invoices (page breaks)
- Return PDF as blob

#### Task 5.3: Connect PDF Download Button

- Update `invoicesView.js` detail view
- When "Download PDF" clicked, call `PDFGenerator.generateInvoicePDF(invoice)`
- Filename: `{companyName}-{invoiceNumber}-{date}.pdf`

---

### 🔜 Phase 6: Backup/Restore (4 tasks) — HIGH COMPLEXITY

#### Task 6.1: Complete `backup.js`

- Implement `exportData()`: serialize all IndexedDB data to JSON
- Implement `importData(json)`: validate and restore data (with confirmation)
- Keep `autoSave()` method for auto-backup trigger

#### Task 6.2: Implement File System Access API

- Prompt user to select backup folder (first time only)
- Save folder handle to `settings` store (`backupFolderHandle`)
- On every data change, write `backup-{timestamp}.json` to folder
- Handle permissions (re-request if revoked)

#### Task 6.3: Create `settingsView.js`

- Company info form: name, address, email (save to `settings` store)
- Backup section:
  - "Select Backup Folder" button
  - Show current folder path if selected
  - "Manual Backup" button
  - "Restore from Backup" button (file picker)
- Danger zone:
  - "Clear All Data" button (confirmation required)

#### Task 6.4: Fallback for Unsupported Browsers

- Detect if File System Access API unavailable
- Show warning message in settings
- Provide manual download/upload buttons instead

---

### 🔜 Phase 7: Polish (4 remaining tasks)

- **7.2**: Add loading spinners during async operations
- **7.4**: Add empty state messages (friendly prompts when no data)
- **7.5**: Keyboard accessibility (tab navigation, Escape to close modals)
- **7.6**: Final styling pass (consistent spacing, colors)

---

### 🔜 Phase 8: Deployment (3 tasks)

- **8.1**: Create comprehensive README.md
- **8.2**: Test in Chrome and Edge
- **8.3**: Document deployment steps for static hosting

---

## Key Code Patterns to Follow

### 1. View Structure

All views follow this pattern:

```javascript
const MyView = {
  currentData: [],
  filters: {},
  sortColumn: 'name',
  sortDirection: 'asc',

  async render(container, headerActions) {
    // Add header buttons
    headerActions.innerHTML = `<button class="btn btn-primary">Action</button>`;

    // Load data
    await this.loadData();

    // Render view
    this.renderView(container);

    // Setup listeners
    this.setupEventListeners(container);
  },

  async loadData() {
    this.currentData = await SomeStore.getAll();
  },

  renderView(container) {
    const filtered = this.applyFilters();
    container.innerHTML = `...`;
  },
};
```

### 2. Modal Usage

```javascript
// Form modal
Modal.open({
  title: 'Add Client',
  content: `<form id="my-form">...</form>`,
});

// Confirmation modal
Modal.confirm({
  title: 'Delete Client',
  message: 'Are you sure?',
  icon: '🗑️',
  confirmText: 'Delete',
  confirmClass: 'btn-danger',
  onConfirm: async () => {
    await ClientStore.delete(id);
    Toast.success('Deleted', 'Client removed');
    App.refresh();
  },
});
```

### 3. Toast Notifications

```javascript
Toast.success('Title', 'Description');
Toast.error('Title', 'Error message');
Toast.warning('Title', 'Warning');
Toast.info('Title', 'Info message');
```

### 4. Table Rendering

```javascript
const columns = [
  { key: 'name', label: 'Name', sortable: true },
  { key: 'email', label: 'Email', sortable: true },
  {
    key: 'actions',
    label: 'Actions',
    className: 'actions',
    render: (row) => `<button class="btn btn-sm">Edit</button>`,
  },
];

const html = Table.render({
  columns,
  data: sortedData,
  emptyMessage: 'No results found',
  sortColumn: this.sortColumn,
  sortDirection: this.sortDirection,
});
```

### 5. Date/Currency Formatting

```javascript
formatDate(date); // "Dec 10, 2025"
formatDateForInput(date); // "2025-12-10"
formatCurrency(amount); // "$1,234.56"
formatHours(hours); // "3.5 hrs"
calculateDuration(start, end); // hours as number
```

### 6. Refresh Pattern

After data changes, use:

```javascript
App.refresh(); // Re-renders current view
```

---

## Important Implementation Notes

### Database Operations

- **All mutations must call `Backup.autoSave()`** (already integrated in stores)
- Use transactions for multi-step operations
- Always handle errors with try/catch and show Toast.error()

### Form Validation

- Use `required` attribute on inputs
- Check dates (due date >= issue date)
- Escape user input with `escapeHtml()` before rendering
- Show validation errors via Toast.error()

### Invoice Business Rules

- Invoice number format: `INV-YYYY-NNN` (e.g., `INV-2025-001`)
- Time entries linked to invoice cannot be edited/deleted (prevent data corruption)
- Deleting invoice unlinks all time entries
- Overdue = unpaid && dueDate < today

### Status Badges

```html
<span class="badge badge-success">Paid</span>
<span class="badge badge-warning">Unpaid</span>
<span class="badge badge-danger">Overdue</span>
<span class="badge badge-info">Invoiced</span>
<span class="badge badge-secondary">Unbilled</span>
```

### Router Hash Format

- `#/dashboard` → dashboardView.render()
- `#/clients` → clientsView.render()
- `#/services` → servicesView.render()
- `#/time-entries` → timeEntriesView.render()
- `#/invoices` → invoicesView.render()
- `#/invoices/new` → invoicesView.renderCreate()
- `#/invoices/{id}` → invoicesView.renderDetail(container, headerActions, id)
- `#/reports` → reportsView.render()
- `#/settings` → settingsView.render()

---

## Sample Data Structure

### Client

```javascript
{
    id: "uuid",
    name: "Acme Corporation",
    address: "123 Main St, City, State ZIP",
    email: "billing@acme.com",
    daysToPay: 30
}
```

### Service

```javascript
{
    id: "uuid",
    name: "Web Development",
    rate: 150.00,
    billable: true
}
```

### Time Entry

```javascript
{
    id: "uuid",
    clientId: "uuid",
    serviceId: "uuid",
    description: "Homepage redesign",
    startTime: "2025-12-01T09:00:00",
    endTime: "2025-12-01T12:00:00",
    billable: true,
    invoiceId: "uuid" | null  // null = unbilled
}
```

### Invoice

```javascript
{
    id: "uuid",
    invoiceNumber: "INV-2025-001",
    clientId: "uuid",
    issueDate: "2025-12-05",
    dueDate: "2025-01-04",
    paid: false,
    timeEntryIds: ["uuid1", "uuid2"],
    total: 950.00
}
```

### Settings (Key-Value)

```javascript
{
    key: "companyName",
    value: "My Consulting LLC"
}
```

---

## Testing Instructions

### Manual QA Checklist (from tasks.md)

- [ ] Can create, edit, delete a Client
- [ ] Can create, edit, delete a Service
- [ ] Can create, edit, delete a Time Entry
- [ ] Can create an Invoice from unbilled time entries
- [ ] Can edit invoice due date
- [ ] Can mark invoice as paid/unpaid from dashboard
- [ ] Dashboard shows correct invoice totals and statuses
- [ ] Time Entry report filters by date range and client
- [ ] Invoice report filters by date range, client, and paid status
- [ ] PDF generates with correct data and formatting
- [ ] Backup exports to selected folder on data save
- [ ] Restore imports data correctly from JSON file
- [ ] App works after browser refresh (data persists)

### How to Test Locally

1. Open `index.html` in Chrome/Edge
2. Check browser console for errors
3. Navigate through all views via sidebar
4. Test CRUD operations in each view
5. Verify data persists after page refresh (IndexedDB)
6. Check that sample data seeds on first load

---

## Known Issues / Edge Cases

### Current Limitations

- **backup.js is a stub**: `autoSave()` returns `Promise.resolve()` — Phase 6 will implement
- **pdfGenerator.js is a stub**: Phase 5 will add jsPDF integration
- **No loading states**: Users don't see spinners during async operations (Phase 7)
- **No empty states**: Some views show empty tables instead of friendly messages (Phase 7)

### Edge Cases to Handle

- **Creating invoice with no unbilled time entries**: Show friendly message, link to time entries view
- **Deleting client with time entries**: Should prevent or show warning (not yet implemented)
- **Deleting service used in time entries**: Should prevent or show warning (not yet implemented)
- **Editing time entry after invoiced**: UI prevents this, but add validation in store as well
- **Browser refresh during modal open**: Modal state doesn't persist (acceptable limitation)

---

## File System Access API Reference

For Phase 6 backup implementation:

```javascript
// Request folder
const handle = await window.showDirectoryPicker();

// Save handle to IndexedDB (serialize)
const handleJSON = await handle.requestPermission({ mode: 'readwrite' });

// Write file
const fileHandle = await handle.getFileHandle('backup.json', { create: true });
const writable = await fileHandle.createWritable();
await writable.write(jsonString);
await writable.close();

// Check browser support
if ('showDirectoryPicker' in window) {
  // Use File System Access API
} else {
  // Fallback to download/upload
}
```

---

## Development Workflow

### When Completing Tasks

1. **Read the task requirements** from `invoice-app-tasks.md`
2. **Implement the feature** following existing code patterns
3. **Test manually** in the browser
4. **Mark the task complete** in `invoice-app-tasks.md`:
   - Change `[ ]` to `[x]`
   - Add completion timestamp: `completed by agent: 2025-12-10T22:00:00-06:00`
   - Add implementation notes: `notes: brief description of what was done`
5. **Update the progress table** at the bottom of `invoice-app-tasks.md`
6. **Check for errors** using browser DevTools console

### Code Style Guidelines

- Use ES6+ features (arrow functions, async/await, template literals)
- Use `const` by default, `let` when reassignment needed
- Use descriptive variable names (`invoices` not `inv`)
- Keep functions focused and small
- Add comments for complex logic
- Use 2-space indentation (existing codebase convention)

### When You Encounter Issues

- Check `invoice-app-tasks.md` for context and requirements
- Look at existing view implementations for patterns
- Review `helpers.js` for utility functions
- Check IndexedDB stores for available query methods
- Use `Toast.error()` to show user-friendly error messages

---

## User's Expectations

The user wants:

- **Phased approach**: User types "phase4", "phase5", etc. to trigger each phase
- **Task tracking**: Mark tasks complete as you finish them (update `invoice-app-tasks.md`)
- **Working code**: Implement features, don't just provide suggestions
- **Consistent patterns**: Follow existing code style and structure
- **Error handling**: Show Toast notifications for all errors
- **No build tools**: Keep everything vanilla (no webpack, no npm)

---

## Next Steps for New Agent

**IMMEDIATE ACTION:**

1. Read this handoff document completely
2. Review `invoice-app-tasks.md` Phase 4 tasks
3. Wait for user to type **"phase4"** (or other command)
4. Implement Phase 4 tasks one by one, marking them complete
5. Test each feature after implementation
6. Report completion and wait for next phase trigger

**Remember:**

- The user controls pacing with phase keywords
- Mark tasks complete immediately after finishing them
- Update the progress table after each phase
- Test in browser and check console for errors
- Follow existing code patterns exactly

---

## Questions to Ask if Unclear

If the user's request is ambiguous, you can ask:

- "Should the dashboard auto-refresh when invoices are toggled?"
- "Do you want separate tabs for Time Entry Report and Invoice Report, or a dropdown?"
- "Should CSV export include all columns or just visible ones?"

But generally, **infer reasonable defaults** and proceed rather than asking too many questions.

---

## Contact Points in Codebase

| What You Need              | Where to Find It                                            |
| -------------------------- | ----------------------------------------------------------- |
| Add new route              | `app.js` → `routes` object                                  |
| Format data                | `utils/helpers.js`                                          |
| Query database             | `db/*Store.js` files                                        |
| Show notification          | `components/toast.js` → `Toast.success()` / `Toast.error()` |
| Open modal                 | `components/modal.js` → `Modal.open()`                      |
| Render table               | `components/table.js` → `Table.render()`                    |
| See existing view patterns | `views/clientsView.js`, `views/invoicesView.js`             |

---

**Good luck! The codebase is well-structured and consistent. You've got this! 🚀**
