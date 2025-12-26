# Google Drive Auto-Backup Migration

## Summary

Successfully migrated the auto-backup feature from File System Access API to Google Drive API with OAuth 2.0. This enables cloud backups across all modern browsers (not just Chrome/Edge).

## Changes Made

### New Files

1. **`js/utils/googleDrive.js`** - Google Drive API client
   - OAuth 2.0 client-side authentication using Google Identity Services
   - `drive.file` scope for app-specific folder access
   - Automatic environment detection (dev vs prod)
   - Folder management (create, find, list files)
   - File operations (upload, download, delete)
   - Token management with expiry handling

### Modified Files

1. **`js/utils/backup.js`**
   - Replaced File System Access API calls with Google Drive API
   - Updated `init()` to check for OAuth Client ID
   - Added `connectGoogleDrive()` for OAuth flow
   - Updated `performAutoSave()` to upload to Google Drive
   - Updated `cleanupOldBackups()` to use Drive file listing
   - Maintained same public interface for backward compatibility

2. **`js/views/settingsView.js`**
   - Added OAuth Client ID configuration input
   - Replaced folder picker button with "Sign in with Google" button
   - Updated status display to show Google Drive connection state
   - Added environment indicator (dev/prod)
   - New methods: `saveOAuthConfig()`, `connectGoogleDrive()`, `disconnectGoogleDrive()`

3. **`index.html`**
   - Added Google Identity Services library: `https://accounts.google.com/gsi/client`
   - Added `googleDrive.js` script before `backup.js`

4. **`README.md`**
   - Added comprehensive "Google Cloud Setup" section
   - Step-by-step instructions for creating OAuth credentials
   - Separate instructions for dev and production environments
   - Troubleshooting guide
   - Updated browser compatibility table (all browsers now fully supported)
   - Updated technical details and privacy sections

5. **`.github/copilot-instructions.md`**
   - Updated tech stack description
   - Added backup system details
   - Updated key files list

## Architecture

### OAuth 2.0 Flow

1. User configures OAuth Client ID in Settings
2. User clicks "Sign in with Google"
3. Google Identity Services shows consent dialog
4. User authorizes `drive.file` scope
5. App receives access token (valid for 1 hour)
6. Token stored in IndexedDB with expiry timestamp

### Environment Detection

```javascript
// Automatic detection based on hostname
const environment = 
  hostname === 'localhost' || hostname === '127.0.0.1' 
    ? 'dev' 
    : 'prod';
```

### Folder Strategy

- **Dev environment**: Creates/uses folder `InvoiceApp-dev`
- **Production**: Creates/uses folder `InvoiceApp`
- Folders are visible in user's Google Drive (not hidden)
- Using `drive.file` scope ensures app only sees its own files

### Security

- Client-side OAuth 2.0 (no backend required)
- Access tokens stored in IndexedDB
- Tokens expire after 1 hour (Google's default for "Testing" apps)
- Users can revoke access anytime via Google Account settings
- `drive.file` scope provides strong isolation

## Setup Requirements

### Google Cloud Console

1. Create project
2. Enable Google Drive API
3. Configure OAuth consent screen
4. Add scope: `https://www.googleapis.com/auth/drive.file`
5. Create OAuth 2.0 Web Client credentials
6. Add authorized JavaScript origins:
   - Dev: `http://localhost:8080`, etc.
   - Prod: `https://your-domain.com`

### App Configuration

1. Go to Settings in app
2. Paste OAuth Client ID
3. Click "Save OAuth Config"
4. Click "Sign in with Google"
5. Authorize the app

## Benefits

1. **Cross-browser support** - Works in Chrome, Edge, Firefox, Safari
2. **No manual folder selection** - Automatic folder creation
3. **Cloud accessibility** - Backups accessible from anywhere
4. **Environment separation** - Dev and prod data isolated
5. **User ownership** - Files visible in user's Drive
6. **No backend needed** - Pure client-side implementation

## Migration Notes

- **No data loss**: Existing IndexedDB data remains intact
- **Manual backups still work**: Download/upload JSON functionality unchanged
- **Gradual adoption**: Users can continue without Google Drive backup
- **Backward compatibility**: Auto-save only triggers when authorized

## Testing Checklist

- [ ] OAuth Client ID configuration saves correctly
- [ ] Sign-in with Google shows consent screen
- [ ] Token stored in IndexedDB
- [ ] Folder created in Google Drive (correct environment)
- [ ] Auto-backup triggers after data change
- [ ] Backup file appears in Drive folder
- [ ] Old backups cleaned up based on retention setting
- [ ] Token expiry handled gracefully
- [ ] Disconnect removes tokens from IndexedDB
- [ ] Manual backup/restore still works
- [ ] Environment detection works (localhost vs production)

## Future Enhancements

- [ ] Backup restoration directly from Google Drive
- [ ] List available backups in Settings
- [ ] Progress indicator for large backups
- [ ] Conflict resolution for concurrent edits
- [ ] Manual token refresh before expiry
- [ ] Publishing app to remove 1-hour token limit
