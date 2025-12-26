# Conversation: Google Drive Storage for a GitLab Pages App

> **Note**: This document contains the *full, verbatim assistant
> responses* from the conversation, preserved for reference and
> documentation purposes.

------------------------------------------------------------------------

## User

I have an app hosted on gitlab pages, can I save/restore json data to a
users Google drive?

## Assistant

Yes --- **you can save and restore JSON data to a user's Google Drive
from an app hosted on GitLab Pages**, but there are **important
constraints** because GitLab Pages is **static hosting** (no backend).

### What works

You must use the **Google Drive API with OAuth 2.0**, entirely
client-side. The browser handles authentication, and your app
uploads/downloads JSON files directly to the user's Drive.

### High-level flow

1.  User signs in with Google
2.  App requests Drive permissions
3.  Google returns an access token
4.  App uploads/downloads JSON using Drive REST APIs

### Required setup

-   Google Cloud project
-   Google Drive API enabled
-   OAuth Client ID (Web)
-   Authorized JS origins including your GitLab Pages URL

### Recommended scope

    https://www.googleapis.com/auth/drive.file

This allows your app to read/write **only files it creates or the user
explicitly opens**.

### Key limitations

-   No backend secrets
-   No service accounts
-   No Firebase Admin SDK
-   All logic must run in the browser

### Conclusion

This approach is secure, supported by Google, and works perfectly for
static hosting like GitLab Pages.

------------------------------------------------------------------------

## User

Describe how to use a separate hidden app folder in Google drive for
local dev work vs production gitlab pages deploy

## Assistant

The correct approach is to create **separate Drive folders per
environment**, created via the Drive API and isolated by OAuth scope
behavior rather than naming tricks.

### Environment detection

``` js
const ENV =
  location.hostname === 'localhost' ? 'dev' : 'prod';
```

### Folder strategy

Create two folders: - `MyApp-dev` - `MyApp-prod`

Each folder: - Is created via the Drive API - Is only accessible to your
app - Prevents dev/prod data contamination

### Folder discovery

Your app searches for the environment-specific folder and creates it if
missing.

### Why this works

Using the `drive.file` scope: - Your app only sees files it created -
User-created files are invisible to your app - Drive UI does not surface
these folders by default

### Resulting structure

    Google Drive
    ├── MyApp-dev
    │   └── data.json
    └── MyApp-prod
        └── data.json

This provides clean separation, safe deployment, and easy debugging.

------------------------------------------------------------------------

## User

Are you sure a leading dot hides the folder on Google drive?

Explained that dot-prefixed names are fully visible in Drive and that
visibility depends on permissions and placement, not naming.

## Assistant

You're **100% correct**.

Google Drive **does not treat leading dots specially**. A folder named
`.secrets` or a file named `.env` is fully visible and searchable.

### What actually controls visibility

-   Permissions
-   Whether the item is in *My Drive*
-   Whether it is shared
-   Whether it is trashed

### The real "hidden app folder" mechanism

What people often call "hidden" is actually: - Files created via the
Drive API - Using limited scopes like `drive.file` - Not automatically
surfaced in the Drive UI

### Truly hidden option

Google provides one genuinely hidden storage location:

    appDataFolder

Files stored there: - Are invisible to users - Are not searchable - Are
intended for internal app state

### Conclusion

Dot prefixes do nothing in Google Drive. Visibility is controlled by
**API behavior and permissions**, not filenames.

------------------------------------------------------------------------

## User

Compare drive.file vs appDataFolder in depth

## Assistant

Below is a detailed, accurate comparison of **`drive.file`** vs
**`appDataFolder`**.

### Conceptual model

-   `drive.file`: User-owned files created by the app
-   `appDataFolder`: Private application storage namespace

### Visibility

  Feature               drive.file        appDataFolder
  --------------------- ----------------- ---------------
  Visible in My Drive   No (by default)   No
  Searchable by user    Sometimes         Never
  Discoverable via UI   Possible          Impossible

### Security

-   `drive.file`: Strong isolation but user-cooperative
-   `appDataFolder`: Maximum isolation, app-only access

### UX

  Scenario         drive.file   appDataFolder
  ---------------- ------------ ---------------
  User backups     Yes          No
  Manual restore   Yes          No
  Transparency     High         None

### Portability

-   `drive.file`: Exportable, migratable, long-lived
-   `appDataFolder`: App-bound, opaque, harder to recover

### Development experience

-   `drive.file`: Debuggable and inspectable
-   `appDataFolder`: Difficult to debug

### Use cases

**Use `drive.file` when:** - Data belongs to the user - Backups matter -
Transparency is important

**Use `appDataFolder` when:** - Data is internal only - State should be
invisible - Maximum isolation is required

### Hybrid model

Many apps use both:

    appDataFolder/state.json
    Drive/MyApp-backup.json

### Final recommendation

For GitLab Pages, JSON backups, dev/prod separation, and user ownership:
➡️ **`drive.file` is the correct primary choice**

------------------------------------------------------------------------

*End of verbatim conversation.*
