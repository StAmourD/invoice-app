/* ========================================
   Invoice App - Google Drive Integration
   ======================================== */

/**
 * Google Drive API Client - OAuth 2.0 Client-Side Integration
 *
 * Uses drive.file scope for app-specific folder access.
 * Supports separate folders for dev/prod environments.
 * Folders are visible in user's Drive (not hidden).
 */
const GoogleDrive = {
  // OAuth 2.0 Configuration - Must be set before use
  clientId: null,

  // Environment detection
  environment: null,

  // OAuth token and state
  accessToken: null,
  tokenExpiry: null,
  tokenClient: null,
  isInitialized: false,
  isAuthorized: false,

  // App folder IDs (cached)
  appFolderId: null,

  // Folder names
  DEV_FOLDER_NAME: 'InvoiceApp-dev',
  PROD_FOLDER_NAME: 'InvoiceApp',

  /**
   * Initialize Google Drive API
   * @param {string} clientId - OAuth 2.0 Client ID from Google Cloud Console
   */
  async init(clientId) {
    if (this.isInitialized) {
      return;
    }

    if (!clientId) {
      throw new Error('Google OAuth Client ID is required');
    }

    this.clientId = clientId;

    // Detect environment
    this.environment = this.detectEnvironment();
    console.log(`Google Drive initialized for ${this.environment} environment`);

    // Wait for Google Identity Services library to load (max 10 seconds)
    const maxWait = 10000;
    const startTime = Date.now();

    while (!window.google || !window.google.accounts) {
      if (Date.now() - startTime > maxWait) {
        console.warn(
          'Google Identity Services library not loaded after 10 seconds. Google Drive features will be unavailable.',
        );
        this.isInitialized = true;
        return;
      }
      await new Promise((resolve) => setTimeout(resolve, 100));
    }

    console.log('Google Identity Services library loaded');

    // Try to load saved token
    const savedToken = await SettingsStore.get('googleDriveAccessToken');
    const tokenExpiry = await SettingsStore.get('googleDriveTokenExpiry');

    if (savedToken && tokenExpiry) {
      const expiryDate = new Date(tokenExpiry);
      if (expiryDate > new Date()) {
        // Token is still valid
        this.accessToken = savedToken;
        this.tokenExpiry = expiryDate;
        this.isAuthorized = true;
        this.initTokenClient();
        console.log('Loaded existing Google Drive token');
      } else {
        // Token expired, clear it
        await this.clearToken();
      }
    }

    this.isInitialized = true;
  },

  /**
   * Detect environment (dev vs prod)
   * @returns {string} 'dev' or 'prod'
   */
  detectEnvironment() {
    const hostname = window.location.hostname;

    // Local development
    if (
      hostname === 'localhost' ||
      hostname === '127.0.0.1' ||
      hostname.startsWith('192.168.')
    ) {
      return 'dev';
    }

    // Production (GitLab Pages, custom domain, etc.)
    return 'prod';
  },

  /**
   * Initialize the OAuth token client (can be called multiple times safely)
   */
  initTokenClient() {
    if (!window.google || !window.google.accounts || !this.clientId) return;
    this.tokenClient = google.accounts.oauth2.initTokenClient({
      client_id: this.clientId,
      scope: 'https://www.googleapis.com/auth/drive.file',
      callback: () => {}, // overwritten per-request
    });
  },

  /**
   * Check if the current token is expiring within the next 5 minutes
   * @returns {boolean}
   */
  isTokenExpiringSoon() {
    if (!this.tokenExpiry) return true;
    return this.tokenExpiry <= new Date(Date.now() + 5 * 60 * 1000);
  },

  /**
   * Attempt a silent token refresh using the user's existing Google session.
   * Uses prompt:'' so no popup is shown when the session is still active.
   * @returns {Promise<boolean>} true if refresh succeeded
   */
  async refreshTokenSilently() {
    if (!this.tokenClient) {
      this.initTokenClient();
    }
    if (!this.tokenClient) return false;

    return new Promise((resolve) => {
      this.tokenClient.callback = async (response) => {
        if (response.error) {
          console.warn('Silent token refresh failed:', response.error);
          resolve(false);
          return;
        }

        this.accessToken = response.access_token;
        this.isAuthorized = true;

        const expiryDate = new Date();
        expiryDate.setSeconds(
          expiryDate.getSeconds() + (response.expires_in || 3600),
        );
        this.tokenExpiry = expiryDate;

        await SettingsStore.set('googleDriveAccessToken', this.accessToken);
        await SettingsStore.set(
          'googleDriveTokenExpiry',
          expiryDate.toISOString(),
        );

        console.log('Google Drive token silently refreshed');
        resolve(true);
      };

      // Empty prompt = silent refresh — no popup shown
      this.tokenClient.requestAccessToken({ prompt: '' });
    });
  },

  /**
   * Get folder name for current environment
   * @returns {string}
   */
  getFolderName() {
    return this.environment === 'dev'
      ? this.DEV_FOLDER_NAME
      : this.PROD_FOLDER_NAME;
  },

  /**
   * Request authorization from user
   * Shows Google Sign-In popup
   *
   * NOTE: Google OAuth will fail with "This browser or app may not be secure"
   * if Chrome is launched with remote debugging (VS Code debugger).
   * To test OAuth:
   * - Open http://localhost:8080 in a regular browser window
   * - Use Firefox or another browser
   * - Or disable the VS Code debugger
   *
   * @returns {Promise<boolean>} Success status
   */
  async authorize() {
    // Check if Google Identity Services library is loaded
    if (!window.google || !window.google.accounts) {
      throw new Error(
        'Google Identity Services library not loaded yet. Please try again in a moment.',
      );
    }

    return new Promise((resolve, reject) => {
      try {
        // Initialize token client
        this.tokenClient = google.accounts.oauth2.initTokenClient({
          client_id: this.clientId,
          scope: 'https://www.googleapis.com/auth/drive.file',
          callback: async (response) => {
            if (response.error) {
              console.error('OAuth error:', response);
              reject(new Error(response.error));
              return;
            }

            // Save token
            this.accessToken = response.access_token;
            this.isAuthorized = true;

            // Calculate expiry (tokens typically last 1 hour)
            const expiryDate = new Date();
            expiryDate.setSeconds(
              expiryDate.getSeconds() + (response.expires_in || 3600),
            );
            this.tokenExpiry = expiryDate;

            await SettingsStore.set('googleDriveAccessToken', this.accessToken);
            await SettingsStore.set(
              'googleDriveTokenExpiry',
              expiryDate.toISOString(),
            );

            console.log('Google Drive authorization successful');
            resolve(true);
          },
        });

        // Request access token.
        // Use empty prompt for returning users (silent if session active),
        // fall back to 'consent' only on first authorization.
        const prompt = this.isAuthorized ? '' : 'consent';
        this.tokenClient.requestAccessToken({ prompt });
      } catch (error) {
        console.error('Authorization failed:', error);
        reject(error);
      }
    });
  },

  /**
   * Sign out and clear token
   */
  async signOut() {
    this.accessToken = null;
    this.tokenExpiry = null;
    this.isAuthorized = false;
    this.appFolderId = null;

    await SettingsStore.delete('googleDriveAccessToken');
    await SettingsStore.delete('googleDriveTokenExpiry');
    await SettingsStore.delete('googleDriveFolderId');

    console.log('Signed out from Google Drive');
  },

  /**
   * Clear expired token
   */
  async clearToken() {
    await this.signOut();
  },

  /**
   * Make authenticated API request to Google Drive
   * @param {string} url - API endpoint URL
   * @param {object} options - Fetch options
   * @returns {Promise<Response>}
   */
  async makeRequest(url, options = {}) {
    // Proactively refresh if token is expiring within 5 minutes
    if (this.isAuthorized && this.isTokenExpiringSoon()) {
      console.log('Token expiring soon, attempting silent refresh...');
      await this.refreshTokenSilently();
    }

    if (!this.isAuthorized || !this.accessToken) {
      throw new Error('Not authorized. Please sign in to Google Drive.');
    }

    const buildHeaders = () => ({
      Authorization: `Bearer ${this.accessToken}`,
      ...options.headers,
    });

    const response = await fetch(url, {
      ...options,
      headers: buildHeaders(),
    });

    // Check for auth errors
    if (response.status === 401) {
      // Token expired — try one silent refresh then retry the request
      console.warn('Received 401, attempting silent token refresh...');
      const refreshed = await this.refreshTokenSilently();
      if (refreshed) {
        const retryResponse = await fetch(url, {
          ...options,
          headers: buildHeaders(),
        });
        if (retryResponse.ok || retryResponse.status !== 401) {
          if (!retryResponse.ok) {
            const errorData = await retryResponse.json().catch(() => ({}));
            throw new Error(
              errorData.error?.message ||
                `API request failed: ${retryResponse.statusText}`,
            );
          }
          return retryResponse;
        }
      }
      await this.clearToken();
      throw new Error('Authorization expired. Please sign in again.');
    }

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(
        errorData.error?.message ||
          `API request failed: ${response.statusText}`,
      );
    }

    return response;
  },

  /**
   * Find or create app folder for current environment
   * @returns {Promise<string>} Folder ID
   */
  async ensureAppFolder() {
    // Return cached folder ID if available
    if (this.appFolderId) {
      return this.appFolderId;
    }

    // Try to load from settings
    const savedFolderId = await SettingsStore.get('googleDriveFolderId');
    if (savedFolderId) {
      // Verify folder still exists
      try {
        await this.makeRequest(
          `https://www.googleapis.com/drive/v3/files/${savedFolderId}?fields=id,name`,
        );
        this.appFolderId = savedFolderId;
        return savedFolderId;
      } catch (error) {
        console.log('Saved folder not found, will create new one');
        await SettingsStore.delete('googleDriveFolderId');
      }
    }

    const folderName = this.getFolderName();

    // Search for existing folder
    const searchUrl =
      `https://www.googleapis.com/drive/v3/files?` +
      `q=name='${folderName}' and mimeType='application/vnd.google-apps.folder' and trashed=false` +
      `&fields=files(id,name)`;

    const searchResponse = await this.makeRequest(searchUrl);
    const searchData = await searchResponse.json();

    if (searchData.files && searchData.files.length > 0) {
      // Folder exists
      this.appFolderId = searchData.files[0].id;
      await SettingsStore.set('googleDriveFolderId', this.appFolderId);
      console.log(`Found existing folder: ${folderName}`);
      return this.appFolderId;
    }

    // Create new folder
    const createResponse = await this.makeRequest(
      'https://www.googleapis.com/drive/v3/files',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: folderName,
          mimeType: 'application/vnd.google-apps.folder',
        }),
      },
    );

    const folderData = await createResponse.json();
    this.appFolderId = folderData.id;
    await SettingsStore.set('googleDriveFolderId', this.appFolderId);
    console.log(`Created new folder: ${folderName}`);

    return this.appFolderId;
  },

  /**
   * Upload file to app folder
   * @param {string} filename - Name of file
   * @param {string} content - File content
   * @param {string} mimeType - MIME type (default: application/json)
   * @returns {Promise<string>} File ID
   */
  async uploadFile(filename, content, mimeType = 'application/json') {
    const folderId = await this.ensureAppFolder();

    // Create metadata
    const metadata = {
      name: filename,
      parents: [folderId],
    };

    // Create multipart upload
    const boundary = '-------314159265358979323846';
    const delimiter = `\r\n--${boundary}\r\n`;
    const closeDelimiter = `\r\n--${boundary}--`;

    const multipartBody =
      delimiter +
      'Content-Type: application/json; charset=UTF-8\r\n\r\n' +
      JSON.stringify(metadata) +
      delimiter +
      `Content-Type: ${mimeType}\r\n\r\n` +
      content +
      closeDelimiter;

    const response = await this.makeRequest(
      'https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart',
      {
        method: 'POST',
        headers: {
          'Content-Type': `multipart/related; boundary=${boundary}`,
        },
        body: multipartBody,
      },
    );

    const fileData = await response.json();
    console.log(`Uploaded file: ${filename}`);
    return fileData.id;
  },

  /**
   * List files in app folder
   * @returns {Promise<Array>} Array of file objects
   */
  async listFiles() {
    const folderId = await this.ensureAppFolder();

    const url =
      `https://www.googleapis.com/drive/v3/files?` +
      `q='${folderId}' in parents and trashed=false` +
      `&fields=files(id,name,createdTime,modifiedTime,size)` +
      `&orderBy=modifiedTime desc`;

    const response = await this.makeRequest(url);
    const data = await response.json();

    return data.files || [];
  },

  /**
   * Download file content
   * @param {string} fileId - File ID
   * @returns {Promise<string>} File content
   */
  async downloadFile(fileId) {
    const response = await this.makeRequest(
      `https://www.googleapis.com/drive/v3/files/${fileId}?alt=media`,
    );

    return await response.text();
  },

  /**
   * Delete file
   * @param {string} fileId - File ID
   */
  async deleteFile(fileId) {
    await this.makeRequest(
      `https://www.googleapis.com/drive/v3/files/${fileId}`,
      {
        method: 'DELETE',
      },
    );

    console.log(`Deleted file: ${fileId}`);
  },

  /**
   * Get authorization status
   * @returns {object} Status information
   */
  getStatus() {
    return {
      isInitialized: this.isInitialized,
      isAuthorized: this.isAuthorized,
      environment: this.environment,
      folderName: this.getFolderName(),
    };
  },
};
