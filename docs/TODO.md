# Invoice App

## Data backup/restore

- save file dual name system
  - one name for auto-save / one for manual save + download (include `invoice-app` in filename not just backup)
    - test auto-save and restore with new naming convention
  - keep xx versions of each
- Use UUID's and hashes to determine if restored data from Google drive differs from current IndexedDB data
  - Merge data smartly
  - Auto load google drive data upon connection / page load

## Email Generation

Modify HTML version of invoice page

- Show client email address
- email subject w/ InvNo
- email body template filled out ready for copy paste
- Possibly generate email with default client, PDF still needs to be attached though.
  - Use an IMAP/SMTP library with a Node backend
    - IMAP should allow for drafts and visibility of emails in inbox
    - SMPT I could use BCC to blind copy myself to keep a copy of the email
    - libraries:
      - imapflow
      - emailjs-imap-client
      - nodmailer (SMTP)

