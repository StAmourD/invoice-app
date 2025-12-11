# Invoice App - Task List

## Project Summary

A single-user, browser-based Invoice App built with Vanilla JS + HTML + CSS. Data is stored locally in IndexedDB with automatic backup on every save. The app supports CRUD operations for Clients, Services, Time Entries, and Invoices, plus reports, a dashboard with paid/unpaid toggle, and PDF invoice generation.

## Assumptions (Based on User Answers)

| Question           | Answer                                                          |
| ------------------ | --------------------------------------------------------------- |
| Frontend Stack     | Vanilla JS + HTML/CSS                                           |
| Architecture       | Single-user local app (IndexedDB, no auth)                      |
| Taxes & Discounts  | Out of scope                                                    |
| Currency/Locale    | Single currency (USD), single locale (en-US)                    |
| PDF Branding       | Use provided sample template                                    |
| Autosave           | On every data save to IndexedDB                                 |
| File Export/Import | File System Access API (Chrome/Edge)                            |
| Browser Support    | Modern browsers only                                            |
| PWA                | No                                                              |
| Primary Platform   | Desktop browser                                                 |
| Email Integration  | Deferred (out of scope)                                         |
| Data Privacy       | No special encryption                                           |
| Filename Structure | `{company-name}-{number}-{date}.pdf`, `backup-{timestamp}.json` |
| Integrations       | None                                                            |
| Tests & CI         | No                                                              |

---

## Sample Data

### Clients

```json
[
  {
    "id": "client-001",
    "name": "Acme Corporation",
    "address": "123 Main St, Springfield, IL 62701",
    "email": "billing@acme.com",
    "daysToPay": 30
  },
  {
    "id": "client-002",
    "name": "TechStart Inc",
    "address": "456 Innovation Blvd, Austin, TX 78701",
    "email": "accounts@techstart.io",
    "daysToPay": 15
  }
]
```

### Services

```json
[
  {
    "id": "svc-001",
    "name": "Web Development",
    "rate": 150.0,
    "billable": true
  },
  {
    "id": "svc-002",
    "name": "UI/UX Design",
    "rate": 125.0,
    "billable": true
  },
  {
    "id": "svc-003",
    "name": "Project Management",
    "rate": 100.0,
    "billable": true
  }
]
```

### Time Entries

```json
[
  {
    "id": "te-001",
    "clientId": "client-001",
    "serviceId": "svc-001",
    "description": "Homepage redesign implementation",
    "startTime": "2025-12-01T09:00:00",
    "endTime": "2025-12-01T12:00:00",
    "billable": true,
    "invoiceId": null
  },
  {
    "id": "te-002",
    "clientId": "client-001",
    "serviceId": "svc-002",
    "description": "Logo concepts and mockups",
    "startTime": "2025-12-02T10:00:00",
    "endTime": "2025-12-02T14:00:00",
    "billable": true,
    "invoiceId": null
  },
  {
    "id": "te-003",
    "clientId": "client-002",
    "serviceId": "svc-001",
    "description": "API integration work",
    "startTime": "2025-12-03T08:00:00",
    "endTime": "2025-12-03T11:30:00",
    "billable": true,
    "invoiceId": null
  },
  {
    "id": "te-004",
    "clientId": "client-002",
    "serviceId": "svc-003",
    "description": "Sprint planning meeting",
    "startTime": "2025-12-04T14:00:00",
    "endTime": "2025-12-04T15:00:00",
    "billable": false,
    "invoiceId": null
  }
]
```

### Sample Invoice

```json
{
  "id": "inv-001",
  "invoiceNumber": "INV-2025-001",
  "clientId": "client-001",
  "issueDate": "2025-12-05",
  "dueDate": "2025-01-04",
  "paid": false,
  "timeEntryIds": ["te-001", "te-002"],
  "total": 950.0
}
```

---

## IndexedDB Schema

**Database Name:** `InvoiceAppDB`  
**Version:** 1

### Object Stores

| Store Name    | Key Path | Indexes                                           |
| ------------- | -------- | ------------------------------------------------- |
| `clients`     | `id`     | `name`, `email`                                   |
| `services`    | `id`     | `name`                                            |
| `timeEntries` | `id`     | `clientId`, `serviceId`, `invoiceId`, `startTime` |
| `invoices`    | `id`     | `clientId`, `invoiceNumber`, `issueDate`, `paid`  |
| `settings`    | `key`    | —                                                 |

### Settings Store Keys

- `companyName` — User's company name for invoices
- `companyAddress` — User's company address
- `companyEmail` — User's company email
- `backupFolderHandle` — Serialized folder handle for File System Access API
- `lastBackupTime` — ISO timestamp of last backup

---

## PDF Invoice Template (HTML Structure)

```html
<div class="invoice-pdf">
  <header class="invoice-header">
    <div class="company-info">
      <img src="logo.png" alt="Company Logo" class="logo" />
      <h1>{Company Name}</h1>
      <p>{Company Address}</p>
      <p>{Company Email}</p>
    </div>
    <div class="invoice-meta">
      <h2>INVOICE</h2>
      <p><strong>Invoice #:</strong> {Invoice Number}</p>
      <p><strong>Date:</strong> {Issue Date}</p>
      <p><strong>Due Date:</strong> {Due Date}</p>
    </div>
  </header>

  <section class="client-info">
    <h3>Bill To:</h3>
    <p><strong>{Client Name}</strong></p>
    <p>{Client Address}</p>
    <p>{Client Email}</p>
  </section>

  <table class="line-items">
    <thead>
      <tr>
        <th>Description</th>
        <th>Service</th>
        <th>Hours</th>
        <th>Rate</th>
        <th>Amount</th>
      </tr>
    </thead>
    <tbody>
      <!-- Line items generated here -->
    </tbody>
    <tfoot>
      <tr>
        <td colspan="4"><strong>Total</strong></td>
        <td><strong>${Total}</strong></td>
      </tr>
    </tfoot>
  </table>

  <footer class="invoice-footer">
    <p>Payment due within {Days to Pay} days.</p>
    <p>Page {n} of {total}</p>
  </footer>
</div>
```

---

## Manual QA Checklist

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

---

## Task List

### Phase 0 — Project Setup & Scaffolding

- [x] **0.1 Create project folder structure** — _Complexity: Low_ — completed by agent: 2025-12-10T21:30:00-06:00 — notes: created css/, js/, js/db/, js/views/, js/utils/, js/components/, assets/ folders

  - Create folders: `css/`, `js/`, `js/db/`, `js/views/`, `js/utils/`, `assets/`
  - **Acceptance:** Folder structure exists

- [x] **0.2 Create `index.html`** — _Complexity: Low_ — completed by agent: 2025-12-10T21:30:00-06:00 — notes: created main HTML with navigation, modal, and toast containers

  - Create main HTML file with navigation, main content area, and modal container
  - Link CSS and JS files
  - **Acceptance:** HTML loads in browser without errors

- [x] **0.3 Create `css/styles.css`** — _Complexity: Low_ — completed by agent: 2025-12-10T21:30:00-06:00 — notes: created base styles with CSS variables and responsive layout

  - Base styles, CSS variables, layout grid, navigation styles
  - **Acceptance:** Page has consistent styling

- [x] **0.4 Create `js/app.js`** — _Complexity: Low_ — completed by agent: 2025-12-10T21:30:00-06:00 — notes: created main entry point with router and sample data seeding

  - Main entry point, router initialization, app bootstrap
  - **Acceptance:** Console shows "App initialized" on load

- [x] **0.5 Create `js/utils/helpers.js`** — _Complexity: Low_ — completed by agent: 2025-12-10T21:30:00-06:00 — notes: created utility functions for UUID, dates, currency, etc.
  - Utility functions: UUID generation, date formatting, currency formatting
  - **Acceptance:** Helper functions are importable and work correctly

---

### Phase 1 — Data Model & Local Persistence (IndexedDB)

- [x] **1.1 Create `js/db/database.js`** — _Complexity: Medium_ — completed by agent: 2025-12-10T21:30:00-06:00 — notes: created IndexedDB initialization with all stores and indexes

  - IndexedDB initialization, schema creation, version management
  - Create all object stores with indexes
  - **Acceptance:** Database opens without errors, stores exist

- [x] **1.2 Create `js/db/clientStore.js`** — _Complexity: Low_ — completed by agent: 2025-12-10T21:30:00-06:00 — notes: implemented full CRUD for clients

  - CRUD operations for clients: `add`, `update`, `delete`, `getAll`, `getById`
  - **Acceptance:** Can perform all CRUD operations on clients

- [x] **1.3 Create `js/db/serviceStore.js`** — _Complexity: Low_ — completed by agent: 2025-12-10T21:30:00-06:00 — notes: implemented full CRUD for services

  - CRUD operations for services
  - **Acceptance:** Can perform all CRUD operations on services

- [x] **1.4 Create `js/db/timeEntryStore.js`** — _Complexity: Low_ — completed by agent: 2025-12-10T21:30:00-06:00 — notes: implemented CRUD with query methods for time entries

  - CRUD operations for time entries
  - Query by client, by invoice, by date range
  - **Acceptance:** Can perform all CRUD operations and queries

- [x] **1.5 Create `js/db/invoiceStore.js`** — _Complexity: Medium_ — completed by agent: 2025-12-10T21:30:00-06:00 — notes: implemented CRUD with queries and calculations for invoices

  - CRUD operations for invoices
  - Query by client, by paid status, by date range
  - **Acceptance:** Can perform all CRUD operations and queries

- [x] **1.6 Create `js/db/settingsStore.js`** — _Complexity: Low_ — completed by agent: 2025-12-10T21:30:00-06:00 — notes: implemented key-value settings store

  - Get/set settings (company info, backup folder handle)
  - **Acceptance:** Settings persist across page reloads

- [x] **1.7 Seed sample data** — _Complexity: Low_ — completed by agent: 2025-12-10T21:30:00-06:00 — notes: added seeding function in app.js with sample clients, services, time entries
  - Add function to seed sample clients, services, time entries
  - Only seed if database is empty
  - **Acceptance:** Fresh install shows sample data

---

### Phase 2 — Core CRUD Views (Clients, Services, Time Entries)

- [x] **2.1 Create `js/views/clientsView.js`** — _Complexity: Medium_ — completed by agent: 2025-12-10T21:45:00-06:00 — notes: implemented full CRUD with table, modal forms, validation

  - List all clients in a table
  - Add/Edit client form (modal)
  - Delete client with confirmation
  - **Acceptance:** Full CRUD for clients works via UI

- [x] **2.2 Create `js/views/servicesView.js`** — _Complexity: Medium_ — completed by agent: 2025-12-10T21:45:00-06:00 — notes: implemented full CRUD with rate display and billable toggle

  - List all services in a table
  - Add/Edit service form (modal)
  - Delete service with confirmation
  - **Acceptance:** Full CRUD for services works via UI

- [x] **2.3 Create `js/views/timeEntriesView.js`** — _Complexity: Medium_ — completed by agent: 2025-12-10T21:45:00-06:00 — notes: implemented CRUD with filters, duration calculation, totals display

  - List time entries with filters (client, date range, billable)
  - Add/Edit time entry form (modal)
  - Delete time entry with confirmation
  - Show calculated duration and amount
  - **Acceptance:** Full CRUD for time entries works via UI

- [x] **2.4 Create `css/components.css`** — _Complexity: Low_ — completed by agent: 2025-12-10T21:30:00-06:00 — notes: created component styles for buttons, forms, tables, modals, toasts

  - Styles for tables, forms, modals, buttons
  - **Acceptance:** UI components look polished

- [x] **2.5 Create `js/components/modal.js`** — _Complexity: Low_ — completed by agent: 2025-12-10T21:30:00-06:00 — notes: created reusable modal with open/close/confirm functionality

  - Reusable modal open/close/render functions
  - **Acceptance:** Modals work for all CRUD forms

- [x] **2.6 Create `js/components/table.js`** — _Complexity: Low_ — completed by agent: 2025-12-10T21:30:00-06:00 — notes: created table component with sorting support
  - Reusable table rendering with sorting
  - **Acceptance:** Tables render correctly with data

---

### Phase 3 — Invoices: Creation, Editing, List, Mark Paid

- [x] **3.1 Create `js/views/invoicesView.js`** — _Complexity: High_ — completed by agent: 2025-12-10T22:00:00-06:00 — notes: implemented invoice list with filters, status badges, and paid/unpaid toggle

  - List all invoices with status badges (paid/unpaid/overdue)
  - Filter by client, date range, paid status
  - **Acceptance:** Invoice list displays correctly

- [x] **3.2 Create invoice creation flow** — _Complexity: High_ — completed by agent: 2025-12-10T22:00:00-06:00 — notes: implemented client selection, unbilled time entry selection, auto-calculation, and invoice number generation

  - Select client, then select unbilled time entries
  - Auto-calculate total
  - Set issue date (default today) and due date (default: today + client's days-to-pay)
  - Generate invoice number (INV-YYYY-NNN)
  - **Acceptance:** Can create invoice from unbilled entries

- [x] **3.3 Create invoice edit functionality** — _Complexity: Medium_ — completed by agent: 2025-12-10T22:00:00-06:00 — notes: implemented edit due date modal with validation

  - Edit due date
  - View line items (read-only after creation)
  - **Acceptance:** Can edit due date on existing invoice

- [x] **3.4 Create invoice detail view** — _Complexity: Medium_ — completed by agent: 2025-12-10T22:00:00-06:00 — notes: implemented full invoice preview with print support and PDF download button

  - Show full invoice with all line items
  - Print button, PDF download button
  - Mark paid/unpaid button
  - **Acceptance:** Invoice detail shows all information

- [x] **3.5 Link time entries to invoice** — _Complexity: Medium_ — completed by agent: 2025-12-10T22:00:00-06:00 — notes: time entries are linked on creation and unlinked on deletion via TimeEntryStore methods
  - When invoice created, update time entries with invoiceId
  - When invoice deleted, clear invoiceId from time entries
  - **Acceptance:** Time entries correctly linked/unlinked

---

### Phase 4 — Reports & Dashboard

- [x] **4.1 Create `js/views/dashboardView.js`** — _Complexity: Medium_ — completed by agent: 2025-12-10T22:30:00-06:00 — notes: implemented dashboard with summary cards (revenue, outstanding, overdue), recent invoices list with quick paid/unpaid toggle

  - Summary cards: total revenue, outstanding amount, overdue amount
  - Recent invoices list with quick paid/unpaid toggle
  - **Acceptance:** Dashboard shows accurate summaries

- [x] **4.2 Create `js/views/reportsView.js`** — _Complexity: Medium_ — completed by agent: 2025-12-10T22:30:00-06:00 — notes: implemented time entry report with filters (date range, client, billable, invoice status) and CSV export

  - Time Entry Report: filter by date range, client, billable
  - Show total hours and total amount
  - **Acceptance:** Time report generates correctly

- [x] **4.3 Add Invoice Report** — _Complexity: Medium_ — completed by agent: 2025-12-10T22:30:00-06:00 — notes: implemented invoice report with filters (date range, client, paid status), totals (total, paid, unpaid), and CSV export with tab switching between reports

  - Filter by date range, client, paid status
  - Show totals for filtered results
  - **Acceptance:** Invoice report generates correctly

- [x] **4.4 Add export to CSV** — _Complexity: Low_ — completed by agent: 2025-12-10T22:30:00-06:00 — notes: created exportToCSV() in helpers.js with proper CSV escaping and dynamic filenames
  - Export current report view to CSV file
  - **Acceptance:** CSV downloads with correct data

---

### Phase 5 — PDF Generation & Printing

- [x] **5.1 Add jsPDF library** — _Complexity: Low_ — completed by agent: 2025-12-10T22:45:00-06:00 — notes: included jsPDF 2.5.1 via CDN in index.html

  - Include jsPDF via CDN or local file
  - **Acceptance:** jsPDF is available globally

- [x] **5.2 Create `js/utils/pdfGenerator.js`** — _Complexity: High_ — completed by agent: 2025-12-10T22:45:00-06:00 — notes: implemented full PDF generation with jsPDF including company header, client info, line items table with alternating rows, totals, payment terms, page numbers, and multi-page support

  - Generate PDF from invoice data
  - Match template layout (header, client info, line items, footer)
  - Handle page breaks for long invoices
  - **Acceptance:** PDF generates with correct layout

- [x] **5.3 Implement PDF download** — _Complexity: Low_ — completed by agent: 2025-12-10T22:45:00-06:00 — notes: connected download button in invoicesView to call PDFGenerator with all required data (invoice, client, timeEntries, serviceMap, settings)

  - Download button triggers PDF generation
  - Filename: `{company-name}-{invoice-number}-{date}.pdf`
  - **Acceptance:** PDF downloads with correct filename

- [x] **5.4 Add print stylesheet** — _Complexity: Low_ — completed by agent: 2025-12-10T21:30:00-06:00 — notes: created print.css with invoice-friendly styles
  - Create `css/print.css` for browser print
  - **Acceptance:** Print preview shows clean invoice

---

### Phase 6 — Backup/Restore + File System Access

- [x] **6.1 Create `js/utils/backup.js`** — _Complexity: High_ — completed by agent: 2025-12-10T23:00:00-06:00 — notes: implemented full backup system with exportData(), importData() with validation, downloadBackup(), uploadBackup(), and status tracking

  - Export all data to JSON
  - Import data from JSON (with validation)
  - **Acceptance:** Can export and reimport data

- [x] **6.2 Implement File System Access API** — _Complexity: High_ — completed by agent: 2025-12-10T23:00:00-06:00 — notes: implemented File System Access API with selectBackupFolder(), autoSave() on data changes, permission handling, and folder handle persistence in settings

  - Prompt user to select backup folder
  - Save folder handle in IndexedDB
  - Auto-save backup file on every data change
  - Filename: `backup-{ISO-timestamp}.json`
  - **Acceptance:** Backup auto-saves to selected folder

- [x] **6.3 Create `js/views/settingsView.js`** — _Complexity: Medium_ — completed by agent: 2025-12-10T23:00:00-06:00 — notes: implemented full settings view with company info form (name, address, email), backup folder selection/management, manual backup/restore, clear all data with confirmation, and backup status display

  - Company info form (name, address, email)
  - Select backup folder button
  - Manual backup/restore buttons
  - Clear all data button (with confirmation)
  - **Acceptance:** Settings save and persist

- [x] **6.4 Add fallback for unsupported browsers** — _Complexity: Low_ — completed by agent: 2025-12-10T23:00:00-06:00 — notes: added browser detection for File System Access API, conditional UI rendering with fallback to manual download/upload, and warning messages for unsupported browsers
  - If File System Access API unavailable, use download/upload
  - Show warning message
  - **Acceptance:** App works in Firefox (with fallback)

---

### Phase 7 — Polish & Final Integration

- [x] **7.1 Add navigation router** — _Complexity: Medium_ — completed by agent: 2025-12-10T21:30:00-06:00 — notes: implemented hash-based router in app.js with active nav highlighting

  - Hash-based routing (#/clients, #/invoices, etc.)
  - Highlight active nav item
  - **Acceptance:** Navigation works, URL reflects current view

- [ ] **7.2 Add loading states** — _Complexity: Low_

  - Show spinner during async operations
  - **Acceptance:** User sees feedback during operations

- [x] **7.3 Add toast notifications** — _Complexity: Low_ — completed by agent: 2025-12-10T21:30:00-06:00 — notes: created toast component with success/error/warning/info types

  - Success/error messages for CRUD operations
  - **Acceptance:** User sees confirmation of actions

- [ ] **7.4 Add empty states** — _Complexity: Low_

  - Friendly messages when no data exists
  - **Acceptance:** Empty lists show helpful message

- [ ] **7.5 Keyboard accessibility** — _Complexity: Low_

  - Tab navigation, Enter to submit forms, Escape to close modals
  - **Acceptance:** App is keyboard navigable

- [ ] **7.6 Final styling pass** — _Complexity: Low_
  - Consistent spacing, colors, typography
  - **Acceptance:** App looks professional

---

### Phase 8 — Deployment / Packaging

- [ ] **8.1 Create README.md** — _Complexity: Low_

  - Project description, setup instructions, usage guide
  - **Acceptance:** README is complete and accurate

- [ ] **8.2 Test in Chrome and Edge** — _Complexity: Low_

  - Verify all features work
  - **Acceptance:** No console errors, all features functional

- [ ] **8.3 Create production build** — _Complexity: Low_
  - Minify CSS/JS (optional, since no build tool required)
  - Document deployment steps for static hosting
  - **Acceptance:** App can be deployed to any static host

---

## Progress Summary

| Phase     | Status          | Tasks Complete |
| --------- | --------------- | -------------- |
| Phase 0   | Complete        | 5/5            |
| Phase 1   | Complete        | 7/7            |
| Phase 2   | Complete        | 6/6            |
| Phase 3   | Complete        | 5/5            |
| Phase 4   | Complete        | 4/4            |
| Phase 5   | Complete        | 4/4            |
| Phase 6   | Complete        | 4/4            |
| Phase 7   | In Progress     | 2/6            |
| Phase 8   | Not Started     | 0/3            |
| **Total** | **In Progress** | **38/44**      |
