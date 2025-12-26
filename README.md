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

- **Auto-Backup** - Automatic backup to Google Drive using OAuth 2.0 (works in all modern browsers)
- **Manual Backup/Restore** - Export and import all data as JSON
- **Backup Retention** - Configurable maximum number of backups to keep
- **Local Storage** - All data stored locally in browser using IndexedDB (no server required)
- **Environment Separation** - Separate Google Drive folders for local dev vs production

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
- Google account (for auto-backup feature)
- Google Cloud project with OAuth 2.0 credentials (see setup instructions below)

### Installation

#### Option 1: Simple HTML (No Build Required)

1. **Clone or download this repository**

   ```bash
   git clone <repository-url>
   cd Invoice-App
   ```

2. **Open in browser**

   - Simply open `index.html` in your web browser
   - No build process or server required!
   - To enable Google Drive backups, configure OAuth Client ID in Settings page

#### Option 2: With Build Process (Recommended for Development/Production)

1. **Clone repository and install dependencies**

   ```bash
   git clone <repository-url>
   cd Invoice-App
   npm install
   ```

2. **Configure environment variables**

   ```bash
   cp .env.example .env
   # Edit .env and add your Google OAuth Client ID
   ```

3. **Set up Google Cloud OAuth (for auto-backup)**

   See [Google Cloud Setup](#-google-cloud-setup-for-auto-backup) section below.

4. **Build and run**

   ```bash
   npm run build
   npm start
   # Or for development with auto-reload:
   npm run dev
   ```

   The app will be available at `http://localhost:8080`

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

- Automatic backup (if connected to Google Drive): Happens on every data change
- Manual backup: Settings → "Download Backup" → Save JSON file

**Restore Data**

- Settings → "Restore from Backup" → Select JSON file
- All existing data will be replaced

**Clear All Data**

- Settings → "Clear All Data" → Confirm
- Removes all clients, services, time entries, invoices, and settings
- Cannot be undone (make sure to backup first!)

## ☁️ Google Cloud Setup (for Auto-Backup)

The app uses Google Drive API for automatic cloud backups. Follow these steps to enable this feature:

### 1. Create a Google Cloud Project

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Click **"Select a project"** → **"New Project"**
3. Enter project name: `Invoice App` (or your preferred name)
4. Click **"Create"**

### 2. Enable Google Drive API

1. In your project, go to **"APIs & Services"** → **"Library"**
2. Search for **"Google Drive API"**
3. Click on it and press **"Enable"**

### 3. Configure OAuth Consent Screen

1. Go to **"APIs & Services"** → **"OAuth consent screen"**
2. Select **"External"** user type (unless you have Google Workspace)
3. Click **"Create"**
4. Fill in required fields:
   - **App name**: `Invoice App` (or your app name)
   - **User support email**: Your email
   - **Developer contact email**: Your email
5. Click **"Save and Continue"**
6. On **"Scopes"** screen, click **"Add or Remove Scopes"**
7. Search and select: `https://www.googleapis.com/auth/drive.file`
   - This allows the app to access only files it creates
8. Click **"Update"** → **"Save and Continue"**
9. On **"Test users"** screen, add your Google account email
10. Click **"Save and Continue"** → **"Back to Dashboard"**

### 4. Create OAuth 2.0 Credentials

#### For Local Development:

1. Go to **"APIs & Services"** → **"Credentials"**
2. Click **"Create Credentials"** → **"OAuth client ID"**
3. Select **"Web application"**
4. Name: `Invoice App - Dev`
5. Under **"Authorized JavaScript origins"**, add:
   - `http://localhost:8080` (or your dev server port)
   - `http://127.0.0.1:8080`
   - `http://localhost:5500` (if using VS Code Live Server)
6. Leave **"Authorized redirect URIs"** empty (not needed for client-side OAuth)
7. Click **"Create"**
8. **Copy the Client ID** (format: `xxx-xxx.apps.googleusercontent.com`)

#### For Production Deployment:

1. Create another OAuth client ID (or edit the existing one)
2. Name: `Invoice App - Production`
3. Under **"Authorized JavaScript origins"**, add:
   - `https://your-username.gitlab.io` (replace with your GitLab Pages URL)
   - Or your custom domain if using one
4. Click **"Create"** or **"Save"**
5. **Copy the Client ID**

**Important Notes:**

- You can use the **same Client ID** for both dev and prod by adding all origins to one credential
- Or create **separate credentials** for better security and tracking
- The app automatically detects the environment and uses the appropriate Google Drive folder

### 5. Configure the App

#### Option A: Using Environment Variables (Recommended)

1. Create a `.env` file in the project root:
   ```bash
   cp .env.example .env
   ```

2. Edit `.env` and add your Client ID:
   ```
   GOOGLE_OAUTH_CLIENT_ID=your-client-id-here.apps.googleusercontent.com
   ```

3. Build the app:
   ```bash
   npm run build
   ```

4. Open the built app in your browser (serve the `public/` folder)
5. Go to **Settings** (⚙️) and click **"Sign in with Google"**
6. Authorize the app
7. The app will create a folder in your Google Drive:
   - `InvoiceApp-dev` for localhost/development
   - `InvoiceApp` for production

#### Option B: Manual Configuration (Simple HTML)

1. Open `index.html` directly in your browser
2. Go to **Settings** (⚙️)
3. Scroll to **"Backup & Restore"** section
4. Paste your **OAuth Client ID** in the input field
5. Click **"Save OAuth Config"**
6. Click **"Sign in with Google"**
7. Authorize the app (you'll see a consent screen)
8. The app will create a folder in your Google Drive:
   - `InvoiceApp-dev` for localhost/development
   - `InvoiceApp` for production

### 6. Verify Setup

1. Check Settings page - should show "Connected to Google Drive"
2. Make a change (e.g., add a client)
3. Wait 2 seconds (auto-save debounce)
4. Go to your Google Drive and verify the folder exists with a backup file

### Troubleshooting

**"Origin mismatch" error:**
- Make sure the URL in your browser exactly matches an authorized origin in Google Cloud Console
- Check for `http` vs `https` and port numbers
- Changes in Google Cloud Console can take a few minutes to propagate

**"Access blocked: This app's request is invalid" error:**
- Make sure you enabled the Google Drive API
- Verify the OAuth consent screen is configured correctly
- Check that the scope `https://www.googleapis.com/auth/drive.file` is added

**Authorization expires after 1 hour:**
- This is normal for apps in "Testing" mode
- To extend: Go to OAuth consent screen → "Publish App" (requires verification for public apps)
- Or users can simply re-authorize when prompted

**Can't see backup files in Google Drive:**
- The app uses `drive.file` scope, so files ARE visible in your Drive
- Check the folder: `InvoiceApp` or `InvoiceApp-dev`
- If you don't see it, try searching for the folder name in Drive

**Different Client IDs for dev vs prod:**
- Not required - you can use one Client ID with multiple authorized origins
- Separate credentials are optional for better organization

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
│   │   ├── googleDrive.js    # Google Drive API client (OAuth 2.0)
│   │   ├── backup.js         # Backup/restore functionality with Google Drive
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

- **No server communication** - All data stays on your device (except Google Drive backups when enabled)
- **No tracking** - No analytics or tracking scripts
- **User-controlled cloud storage** - Google Drive backups only when you authorize
- **Local-first** - All data stored in IndexedDB; Google Drive is optional backup only

## 🌐 Browser Compatibility

| Browser | Support | Notes                                    |
| ------- | ------- | ---------------------------------------- |
| Chrome  | ✅ Full | All features including Google Drive      |
| Edge    | ✅ Full | All features including Google Drive      |
| Firefox | ✅ Full | All features including Google Drive      |
| Safari  | ✅ Full | All features including Google Drive      |

**Note:** Auto-backup requires Google account and OAuth setup. Manual backup/restore works in all browsers without configuration.

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
- **Google Drive API** - Cloud backup via OAuth 2.0
- **Google Identity Services** - Client-side OAuth 2.0 authentication
- **jsPDF** - PDF generation library (via CDN)

### Key Design Decisions

- **No build process** - Open HTML file and start working
- **No external dependencies** (except jsPDF via CDN)
- **Single-user application** - No authentication or multi-user support
- **Local-first** - All data stored and processed locally
- **Stateless views** - Each view loads fresh data on render

## 🐛 Troubleshooting

**Q: My data disappeared after clearing browser cache**  
A: IndexedDB data can be cleared with browser cache. Always maintain regular backups in Google Drive or download manual backups.

**Q: Auto-backup isn't working**  
A: Make sure you've configured Google OAuth Client ID in Settings and signed in with Google. Check the [Google Cloud Setup](#️-google-cloud-setup-for-auto-backup) section for detailed instructions.

**Q: "Authorization expired" message**  
A: Google OAuth tokens expire after 1 hour in "Testing" mode. Simply click "Sign in with Google" again. To extend token lifetime, publish your app in Google Cloud Console (requires verification).

**Q: PDF won't download**  
A: Check browser console for errors. Ensure popup blockers aren't preventing the download. Try using a different browser.

**Q: Backup file is too large**  
A: The backup file grows with your data. Consider archiving old invoices and starting fresh, or adjust backup retention settings.

**Q: Can I use this with multiple users?**  
A: No, this is designed as a single-user application. Each browser profile maintains its own separate database. However, each user can have their own Google account and backups.

**Q: Do I need separate Google Cloud projects for dev and prod?**  
A: No, you can use one project with one OAuth Client ID. Just add all authorized origins (localhost, production URL) to the same credential. The app automatically detects the environment and uses separate folders in Google Drive.

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

- **Regular Backups**: Connect to Google Drive for automatic backups, or use manual backup regularly
- **Environment Awareness**: The app automatically uses separate folders (InvoiceApp-dev vs InvoiceApp) for dev and prod
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
# Install dependencies
npm install

# Build for production
npm run build

# Serve the public folder for testing
npm start
```

What the build does:

- Reads environment variables from `.env` file (using `dotenv`)
- Generates `js/config.js` from `js/config.template.js` with environment variables injected
- Creates/cleans `public/` (output folder)
- Copies project files, renames JS/CSS/image files with an 8-character SHA-256 content hash appended (e.g. `app.abcdef01.js`)
- Rewrites references in `index.html`, CSS and JS files to the hashed names
- Minifies JS/CSS during the build (requires `esbuild`) for smaller bundles
- Supports a watch mode that rebuilds when files change (requires `chokidar`)

### Environment Variables

The build script injects environment variables into the app configuration:

- `GOOGLE_OAUTH_CLIENT_ID` - Your Google OAuth 2.0 Client ID
- `NODE_ENV` - Environment (development/production)

Create a `.env` file (use `.env.example` as template) to configure these values locally.

### Dev workflow (quick summary)

- Start the combined watcher + server with a single command: `npm run dev` (or press F5 in VS Code).
- What runs:
  - `npm run watch` — runs `node scripts/build.js --watch` which uses `chokidar` to watch `js/`, `css/`, `index.html` and `assets/` and rebuild the `public/` folder when files change.
  - `live-server public --no-browser --port=8080` — serves `public/` and automatically reloads the browser when files in `public/` are updated.
- How the flow works: edit source files → build script detects changes and rewrites/rehashes assets → `public/` is updated → `live-server` reloads the page → DevTools uses source maps (if enabled) to map code back to original files for debugging.
- Debugging: press F5 in VS Code to run the `npm: dev` task then launch Chrome. Sourcemaps are emitted if `esbuild` is installed and enabled.

**Environment Variables in Development:**

- Create `.env` file with your Google OAuth Client ID
- The build script automatically reads `.env` and generates `js/config.js`
- Changes to `.env` require rebuilding (restart `npm run dev`)

### Deployment to GitLab Pages

For GitLab Pages deployment, set environment variables in GitLab CI/CD:

1. Go to your GitLab project → **Settings** → **CI/CD** → **Variables**
2. Add variable:
   - Key: `GOOGLE_OAUTH_CLIENT_ID`
   - Value: Your OAuth Client ID
   - Protected: ✓ (if deploying from protected branches)
   - Masked: ✓ (recommended)
3. The build script will use this variable when building in CI

**GitLab CI Example** (`.gitlab-ci.yml`):

```yaml
pages:
  stage: deploy
  image: node:18
  script:
    - npm install
    - npm run build
    - mv public public-output  # GitLab Pages expects 'public' artifact
  artifacts:
    paths:
      - public-output
  only:
    - main
```

Notes:

- The script is minimal and intended for simple publishing and for adding cache-busting support; it intentionally excludes `node_modules`, `.git`, and `scripts/` from being copied
- If you need extra build features (minification, bundling), consider adopting a bundler like Rollup, esbuild, or Webpack and adding it to this script.
- The build script minifies JS/CSS with `esbuild` and emits external source maps for debugging; ensure `esbuild` is installed as a dev dependency to enable this feature.

Debugging with Source Maps (VS Code)

- F5 in VS Code will run the dev task and open Chrome using the workspace launch configuration (`.vscode/launch.json`).
- The build emits external source maps for JS and CSS. You can set breakpoints in original source files under `js/` directly in VS Code and they will map to the minified output.
- If you prefer to attach to a manually started server, set the `webRoot` in your launch configuration to `${workspaceFolder}/public` and enable `sourceMaps` in the debugger config.
