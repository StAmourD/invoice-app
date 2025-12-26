# Environment Variables with dotenv

## Summary

Added dotenv support to manage Google OAuth Client ID via environment variables while maintaining backward compatibility with simple HTML usage.

## Implementation

### Two Configuration Methods

1. **Environment Variables (via .env file and build process)**
   - Recommended for development and production deployments
   - OAuth Client ID injected at build time
   - More secure - no credentials in source code

2. **Manual Configuration (in Settings page)**
   - For simple HTML usage without build process
   - Useful for quick testing
   - OAuth Client ID stored in IndexedDB

### Files Added/Modified

#### New Files

1. **`.env.example`** - Template for environment variables
   ```
   GOOGLE_OAUTH_CLIENT_ID=your-client-id-here.apps.googleusercontent.com
   ```

2. **`js/config.template.js`** - Template for generated config
   - Contains placeholders replaced during build
   - Placeholders: `__GOOGLE_OAUTH_CLIENT_ID__`, `__BUILD_DATE__`, `__ENVIRONMENT__`

#### Modified Files

1. **`package.json`**
   - Added `dotenv` as dev dependency

2. **`scripts/build.js`**
   - Added `generateConfigFile()` function
   - Reads `.env` file using dotenv
   - Generates `js/config.js` from template
   - Excludes `.env` files and `config.template.js` from build output

3. **`index.html`**
   - Added inline script to create empty `AppConfig` object if config.js doesn't exist
   - Added config.js script tag with error handler
   - Ensures app works even without built config

4. **`js/utils/backup.js`**
   - Updated `init()` to check `window.AppConfig` first, then fall back to settings
   - Updated `connectGoogleDrive()` to support both config sources
   - Updated `getStatus()` to return config source information

5. **`js/views/settingsView.js`**
   - Displays config source badge (Environment vs Manual)
   - Makes Client ID field read-only when from environment
   - Hides "Save OAuth Config" button when from environment
   - Shows appropriate help text based on config source

6. **`.gitignore`**
   - Added `.env` and `.env.local` to prevent committing secrets
   - Added `js/config.js` since it's generated

7. **`README.md`**
   - Added two installation options (Simple HTML vs Build Process)
   - Documented environment variable setup
   - Added GitLab CI/CD instructions
   - Updated deployment section

## How It Works

### Development Workflow

1. Developer creates `.env` file from `.env.example`
2. Adds OAuth Client ID to `.env`
3. Runs `npm run dev`
4. Build script reads `.env` and generates `js/config.js`
5. App uses OAuth Client ID from `window.AppConfig`

### Production Deployment (GitLab Pages)

1. Set `GOOGLE_OAUTH_CLIENT_ID` in GitLab CI/CD Variables
2. Build script reads from `process.env.GOOGLE_OAUTH_CLIENT_ID`
3. Generates `js/config.js` with production credentials
4. Deployed app uses OAuth Client ID from config

### Simple HTML Usage

1. User opens `index.html` directly in browser
2. No `config.js` exists, so `window.AppConfig` is empty object
3. App checks for config, doesn't find OAuth Client ID
4. User manually configures OAuth Client ID in Settings page
5. OAuth Client ID stored in IndexedDB
6. App uses OAuth Client ID from IndexedDB

## Priority Order

The app checks for OAuth Client ID in this order:

1. **`window.AppConfig.googleOAuthClientId`** (from environment via build)
2. **IndexedDB Settings** (`googleOAuthClientId` key)

Environment variables always take precedence when present.

## Security Benefits

1. **No secrets in source code** - .env file not committed to git
2. **CI/CD integration** - Secrets managed in GitLab/GitHub
3. **Backward compatibility** - Still works without build process
4. **User visibility** - Settings page shows config source

## Settings Page Behavior

### When OAuth Client ID from Environment

- Field is **read-only and disabled**
- Badge shows: **"From Environment"** (green)
- No "Save OAuth Config" button
- Help text: "Configured via environment variable (read-only)"

### When OAuth Client ID from Manual Config

- Field is **editable**
- Badge shows: **"Manual Configuration"** (blue)
- "Save OAuth Config" button visible
- Help text: "Required for Google Drive backup. See README for setup instructions."

### When Not Configured

- Shows appropriate message based on mode:
  - Environment: "Set GOOGLE_OAUTH_CLIENT_ID environment variable and rebuild"
  - Manual: "Configure your Google OAuth Client ID to enable Google Drive backups"

## Benefits

1. **Flexibility** - Works with or without build process
2. **Security** - Secrets not in source code for deployments
3. **Developer Experience** - Easy local development with .env
4. **Production Ready** - Integrates with CI/CD pipelines
5. **User Friendly** - Clear indication of config source
6. **Backward Compatible** - Existing manual config still works

## Testing Checklist

- [ ] Build script generates config.js correctly
- [ ] App loads config from window.AppConfig
- [ ] App falls back to IndexedDB when no config.js
- [ ] Settings page shows correct config source
- [ ] Settings page makes field read-only for env config
- [ ] Manual config still saves to IndexedDB
- [ ] Simple HTML mode works without config.js
- [ ] GitLab CI can inject environment variables
- [ ] .env file not included in git
- [ ] config.js not included in git
