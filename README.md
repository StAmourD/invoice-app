# 📄 Invoice App

A single-user, browser-based invoice management application built with vanilla JavaScript, HTML, and CSS. Perfect for freelancers and small businesses to track clients, services, time entries, and generate professional invoices.

## ✨ Features

### Core Functionality

- **Client Management** - Add, edit, and delete clients with contact information and payment terms
- **Service Catalog** - Manage your services with customizable rates and billable status
- **Time Tracking** - Track time entries with start dates, hours, descriptions, and client/service associations
- **Invoice Generation** - Create invoices from unbilled time entries with automatic calculations
- **PDF Export** - Generate professional PDF invoices with customizable company branding
- **Dashboard** - View key metrics including total revenue, outstanding balances, and overdue invoices

### Reports & Analytics

- **Time Entry Reports** - Filter by date range, client, billable status, and invoice status
- **Invoice Reports** - View paid vs unpaid invoices with filtering and totals
- **CSV Export** - Export reports to CSV for further analysis

### Data Management

- **Auto-Backup** - Automatic backup to a selected folder using File System Access API (Chrome/Edge)
- **Manual Backup/Restore** - Export and import all data as JSON
- **Backup Retention** - Configurable maximum number of backups to keep
- **Local Storage** - All data stored locally in browser using IndexedDB (no server required)

### User Experience

- **Responsive Design** - Clean, modern interface with consistent styling
- **Loading States** - Visual feedback during async operations
- **Empty States** - Helpful messages when no data exists
- **Keyboard Accessibility** - Full keyboard navigation (ESC to close modals, Enter to submit forms)
- **Toast Notifications** - Success/error feedback for all actions
- **Print Support** - Print-optimized invoice layout

## 🚀 Getting Started

### Prerequisites

- Modern web browser (Chrome, Edge, Firefox, Safari)
- For auto-backup feature: Chrome or Edge (uses File System Access API)

### Installation

1. **Clone or download this repository**

   ```bash
   git clone <repository-url>
   cd Invoice-App
   ```

2. **Open in browser**

   - Simply open `index.html` in your web browser
   - No build process or server required!

3. **Alternative: Use a local server** (optional, for development)

   ```bash
   # Using Python
   python -m http.server 8000

   # Using Node.js
   npx serve

   # Using PHP
   php -S localhost:8000
   ```

   Then navigate to `http://localhost:8000`

## 📖 Usage Guide

### First-Time Setup

1. **Configure Company Settings**

   - Navigate to Settings (⚙️)
   - Enter your company name, address, and email
   - These details will appear on your invoices

2. **Set Up Backup Folder** (Chrome/Edge only)

   - In Settings, click "Select Backup Folder"
   - Choose a folder on your computer
   - The app will automatically backup on every data change

3. **Add Clients**

   - Go to Clients (👥)
   - Click "New Client"
   - Enter client details including payment terms (days to pay)

4. **Add Services**
   - Go to Services (🛠️)
   - Click "New Service"
   - Enter service name, hourly rate, and billable status

### Creating Invoices

1. **Track Time Entries**

   - Go to Time Entries (⏱️)
   - Click "New Time Entry"
   - Select client, service, date/time range, and add description
   - Mark as billable if applicable

2. **Generate Invoice**

   - Go to Invoices (📃)
   - Click "New Invoice"
   - Select a client
   - Choose unbilled time entries to include
   - Review auto-calculated totals
   - Set issue and due dates
   - Click "Create Invoice"

3. **Download PDF**

   - View invoice details
   - Click "Download PDF"
   - PDF will download with filename: `{company-name}-{invoice-number}-{date}.pdf`

4. **Mark as Paid**
   - From invoice list or dashboard, toggle "Mark as Paid"
   - Or edit invoice and change status

### Reports

1. **Time Entry Report**

   - Go to Reports (📈)
   - Select "Time Entries" tab
   - Apply filters (date range, client, billable status, invoice status)
   - View totals and export to CSV

2. **Invoice Report**
   - Go to Reports (📈)
   - Select "Invoices" tab
   - Apply filters (date range, client, paid status)
   - View totals (total, paid, unpaid)
   - Export to CSV

### Data Management

**Backup Data**

- Automatic backup (if backup folder selected): Happens on every data change
- Manual backup: Settings → "Download Backup" → Save JSON file

**Restore Data**

- Settings → "Restore from Backup" → Select JSON file
- All existing data will be replaced

**Clear All Data**

- Settings → "Clear All Data" → Confirm
- Removes all clients, services, time entries, invoices, and settings
- Cannot be undone (make sure to backup first!)

## 🗂️ Project Structure

```
Invoice-App/
├── index.html                 # Main HTML file
├── README.md                  # This file
├── css/
│   ├── styles.css            # Base styles and layout
│   ├── components.css        # Component styles (buttons, forms, tables, etc.)
│   └── print.css             # Print-optimized styles for invoices
├── js/
│   ├── app.js                # Main application entry point and router
│   ├── components/
│   │   ├── modal.js          # Reusable modal dialog component
│   │   ├── table.js          # Table rendering with sorting
│   │   ├── toast.js          # Toast notification system
│   │   └── spinner.js        # Loading spinner component
│   ├── db/
│   │   ├── database.js       # IndexedDB initialization
│   │   ├── clientStore.js    # Client CRUD operations
│   │   ├── serviceStore.js   # Service CRUD operations
│   │   ├── timeEntryStore.js # Time entry CRUD operations
│   │   ├── invoiceStore.js   # Invoice CRUD operations
│   │   └── settingsStore.js  # Settings key-value store
│   ├── utils/
│   │   ├── helpers.js        # Utility functions (formatting, UUID, etc.)
│   │   ├── backup.js         # Backup/restore functionality
│   │   └── pdfGenerator.js   # PDF invoice generation with jsPDF
│   └── views/
│       ├── dashboardView.js  # Dashboard with metrics and recent invoices
│       ├── clientsView.js    # Client list and CRUD
│       ├── servicesView.js   # Service list and CRUD
│       ├── timeEntriesView.js # Time entry list and CRUD
│       ├── invoicesView.js   # Invoice list, creation, and detail view
│       ├── reportsView.js    # Time and invoice reports
│       └── settingsView.js   # Settings and data management
└── assets/                    # (Optional) Images, logos, etc.
```

## 🗄️ Data Storage

All data is stored locally in your browser using **IndexedDB**. The database schema includes:

- **clients** - Client information (name, email, address, payment terms)
- **services** - Service catalog (name, rate, billable status)
- **timeEntries** - Time tracking entries (client, service, date/time, description)
- **invoices** - Invoices with line items and payment status
- **settings** - App settings (company info, backup folder handle)

### Data Privacy

- **No server communication** - All data stays on your device
- **No tracking** - No analytics or tracking scripts
- **No cloud storage** - Data is not sent anywhere
- **Local backups only** - You control where backups are saved

## 🌐 Browser Compatibility

| Browser | Support    | Notes                                                 |
| ------- | ---------- | ----------------------------------------------------- |
| Chrome  | ✅ Full    | All features including auto-backup                    |
| Edge    | ✅ Full    | All features including auto-backup                    |
| Firefox | ⚠️ Partial | No auto-backup (File System Access API not supported) |
| Safari  | ⚠️ Partial | No auto-backup (File System Access API not supported) |

**Note:** Firefox and Safari users can still use manual backup/restore functionality.

## ⌨️ Keyboard Shortcuts

- **ESC** - Close modal dialogs
- **Enter** - Submit forms
- **Tab** - Navigate between form fields
- **Click links in sidebar** - Navigate between views

## 🛠️ Technical Details

### Technologies Used

- **Vanilla JavaScript (ES6+)** - No frameworks or dependencies
- **HTML5** - Semantic markup
- **CSS3** - Modern styling with CSS variables
- **IndexedDB** - Client-side database
- **File System Access API** - Auto-backup functionality (Chrome/Edge)
- **jsPDF** - PDF generation library (via CDN)

### Key Design Decisions

- **No build process** - Open HTML file and start working
- **No external dependencies** (except jsPDF via CDN)
- **Single-user application** - No authentication or multi-user support
- **Local-first** - All data stored and processed locally
- **Stateless views** - Each view loads fresh data on render

## 🐛 Troubleshooting

**Q: My data disappeared after clearing browser cache**  
A: IndexedDB data can be cleared with browser cache. Always maintain regular backups in a safe location.

**Q: Auto-backup isn't working**  
A: Make sure you're using Chrome or Edge, and have selected a backup folder in Settings. Check browser permissions for file system access.

**Q: PDF won't download**  
A: Check browser console for errors. Ensure popup blockers aren't preventing the download. Try using a different browser.

**Q: Backup file is too large**  
A: The backup file grows with your data. Consider archiving old invoices and starting fresh, or adjust backup retention settings.

**Q: Can I use this with multiple users?**  
A: No, this is designed as a single-user application. Each browser profile maintains its own separate database.

## 📝 Sample Data

The app includes sample data on first load to help you explore features:

- 2 sample clients
- 3 sample services
- 4 sample time entries
- 1 sample invoice

You can delete this data from Settings → "Clear All Data"

## 🔮 Future Enhancements (Not Implemented)

- Email integration for sending invoices
- Recurring invoices
- Expense tracking
- Tax calculations
- Multi-currency support
- Payment gateway integration
- Client portal
- Mobile app (PWA)

## 📄 License

This project is provided as-is for personal or commercial use.

## 🤝 Contributing

This is a standalone project. Feel free to fork and modify for your needs.

## 💡 Tips

- **Regular Backups**: Set up auto-backup folder to protect your data
- **Archive Old Data**: Export and clear old invoices to keep the app fast
- **Descriptive Time Entries**: Add detailed descriptions for better invoice line items
- **Consistent Rates**: Keep service rates up-to-date in the Services view
- **Payment Terms**: Set accurate payment terms per client for correct due dates
- **Browser Bookmarks**: Bookmark specific views like `index.html#/time-entries` for quick access

---

**Made with ❤️ using Vanilla JavaScript**

For questions or issues, please refer to the project documentation or source code comments.

## 🏗️ Build / Publish

This repository includes a simple Node-based build script which copies the app into a `public/` folder and applies cache-busting to CSS/JS/image files.

Usage:

```bash
# Install Node.js (if necessary) and run build
npm install   # optional - this project doesn't rely on direct npm packages
npm run build

# Serve the public folder for testing
npx http-server public -p 8080
```

What the build does:

- Creates/cleans `public/` (output folder)
- Copies project files, renames JS/CSS/image files with an 8-character SHA-256 content hash appended (e.g. `app.abcdef01.js`)
- Rewrites references in `index.html`, CSS and JS files to the hashed names
- Minifies JS/CSS during the build (requires `esbuild`) for smaller bundles
- Supports a watch mode that rebuilds when files change (requires `chokidar`)

Dev workflow (quick summary)

- Start the combined watcher + server with a single command: `npm run dev` (or press F5 in VS Code).
- What runs:
  - `npm run watch` — runs `node scripts/build.js --watch` which uses `chokidar` to watch `js/`, `css/`, `index.html` and `assets/` and rebuild the `public/` folder when files change.
  - `live-server public --no-browser --port=8080` — serves `public/` and automatically reloads the browser when files in `public/` are updated.
- How the flow works: edit source files → build script detects changes and rewrites/rehashes assets → `public/` is updated → `live-server` reloads the page → DevTools uses source maps (if enabled) to map code back to original files for debugging.
- Debugging: press F5 in VS Code to run the `npm: dev` task then launch Chrome. Sourcemaps are emitted if `esbuild` is installed and enabled.

Notes:

- The script is minimal and intended for simple publishing and for adding cache-busting support; it intentionally excludes `node_modules`, `.git`, and `scripts/` from being copied
- If you need extra build features (minification, bundling), consider adopting a bundler like Rollup, esbuild, or Webpack and adding it to this script.
- The build script minifies JS/CSS with `esbuild` and emits external source maps for debugging; ensure `esbuild` is installed as a dev dependency to enable this feature.

Debugging with Source Maps (VS Code)

- F5 in VS Code will run the dev task and open Chrome using the workspace launch configuration (`.vscode/launch.json`).
- The build emits external source maps for JS and CSS. You can set breakpoints in original source files under `js/` directly in VS Code and they will map to the minified output.
- If you prefer to attach to a manually started server, set the `webRoot` in your launch configuration to `${workspaceFolder}/public` and enable `sourceMaps` in the debugger config.
