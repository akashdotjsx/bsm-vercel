# Google Drive Integration Setup Guide

This guide explains how to set up the Google Drive integration for the Knowledge Base feature.

## Overview

The Google Drive integration allows users to:
- Connect their Google Drive account
- Browse folders and files hierarchically
- Select documents to import into the knowledge base
- Automatically parse and process documents with AI enhancement

## Architecture

### Components

1. **Backend API Routes** (`/app/api/google-drive/`)
   - `token/route.ts` - Generates Pipedream connect tokens
   - `files/route.ts` - Fetches files and folders from Google Drive
   - `download/route.ts` - Downloads files from Google Drive

2. **Frontend Component** (`/components/knowledge-base/google-drive-browser.tsx`)
   - File browser with folder navigation
   - Breadcrumb navigation
   - File selection with multi-select support
   - Filters unsupported file types

3. **Integration Point** (`/app/(dashboard)/knowledge-base/new/page.tsx`)
   - New "Google Drive" tab in article creation
   - Seamless integration with existing document parser
   - Reuses AI enhancement pipeline

### Data Flow

```
User clicks "Connect Google Drive"
    ↓
Frontend creates Pipedream client
    ↓
Request connect token from /api/google-drive/token
    ↓
Pipedream OAuth flow (popup)
    ↓
Store connection in localStorage
    ↓
Fetch files from /api/google-drive/files
    ↓
User browses folders and selects files
    ↓
Click "Ingest" button
    ↓
Download files via /api/google-drive/download
    ↓
Convert to File objects
    ↓
Send to /api/knowledge/import (existing parser)
    ↓
AI processes and extracts content
    ↓
Populate form with extracted data
    ↓
User reviews and saves article
```

## Setup Instructions

### 1. Create Pipedream Account

1. Go to [https://pipedream.com/](https://pipedream.com/)
2. Sign up for a free account
3. Create a new project

### 2. Configure Pipedream Project

1. In your Pipedream dashboard, go to **Projects**
2. Create or select a project
3. Go to **Settings** → **Connect**
4. Enable **Google Drive** app
5. Copy the following credentials:
   - Project ID
   - Client ID
   - Client Secret

### 3. Add Environment Variables

Add these to your `.env.local` file:

```env
# Pipedream Configuration
PIPEDREAM_PROJECT_ID=proj_abc123
PIPEDREAM_ENVIRONMENT=development
PIPEDREAM_CLIENT_ID=your_client_id
PIPEDREAM_CLIENT_SECRET=your_client_secret
```

### 4. Install Dependencies

The required dependency is already installed:
```bash
npm install @pipedream/sdk
```

### 5. Test the Integration

1. Start the development server:
   ```bash
   npm run dev
   ```

2. Navigate to **Knowledge Base** → **New Article**
3. Click the **Google Drive** tab
4. Click **Connect Google Drive**
5. Authorize the app in the popup
6. Browse your folders and files
7. Select a document and click **Ingest**

## Supported File Formats

The integration supports the same formats as the file upload feature:

- **Google Docs** (automatically exported to .docx)
- **Microsoft Word** (.docx, .doc)
- **Text files** (.txt)
- **Markdown** (.md)
- **HTML** (.html, .htm)

Unsupported files are shown but disabled in the file browser.

## Features

### Folder Navigation

- Browse folders hierarchically
- Breadcrumb navigation for easy back-tracking
- Home icon to return to root
- Folders shown separately from files

### File Selection

- Multi-file selection with checkboxes
- Visual indication of selected files
- Badge showing selection count
- Only supported formats are selectable

### Persistent Connection

- Connection stored in localStorage
- Auto-reconnect on page refresh
- Manual disconnect option
- Per-user connection management

### Smart File Processing

For Google Drive native formats (Docs, Sheets, Slides):
- Automatically exported to compatible formats
- Google Docs → .docx
- Other formats → plain text fallback

### Progress Feedback

- Loading indicators during file fetching
- Progress bar during document processing
- Success/error toast notifications
- Quality score after AI processing

## API Reference

### POST /api/google-drive/token

Creates a Pipedream connect token for the current user.

**Response:**
```json
{
  "token": "pd_connect_...",
  "expires_at": "2024-01-01T00:00:00Z",
  "connectLinkUrl": "https://..."
}
```

### POST /api/google-drive/files

Fetches files and folders from Google Drive.

**Request:**
```json
{
  "accountId": "acc_123",
  "folderId": "folder_id_or_null",
  "pageSize": 20
}
```

**Response:**
```json
{
  "files": [...],
  "folders": [...],
  "nextPageToken": "token_or_null"
}
```

### POST /api/google-drive/download

Downloads a file from Google Drive.

**Request:**
```json
{
  "accountId": "acc_123",
  "fileId": "file_123",
  "fileName": "document.docx",
  "mimeType": "application/vnd.google-apps.document"
}
```

**Response:**
```json
{
  "success": true,
  "fileName": "document.docx",
  "content": "base64_encoded_content",
  "mimeType": "application/..."
}
```

## Limitations

1. **Page Size**: Currently limited to 20 files/folders per view
2. **Single File Processing**: Processes one file at a time (can be enhanced for batch)
3. **No Search**: Browse-only, no search functionality yet
4. **File Size**: Large files may timeout (consider size limits)

## Future Enhancements

- [ ] Batch file processing
- [ ] Search functionality
- [ ] File preview before import
- [ ] Automatic folder sync
- [ ] Support for more file formats
- [ ] Export back to Google Drive
- [ ] Team shared drives support
- [ ] File caching to reduce API calls

## Troubleshooting

### "Failed to create token"
- Check Pipedream credentials in `.env.local`
- Verify project ID is correct
- Check Pipedream project is active

### "Failed to fetch files"
- Ensure Google Drive app is enabled in Pipedream
- Check user has Google Drive access
- Verify OAuth permissions granted

### "Failed to download file"
- Check file permissions in Google Drive
- Verify file exists and is not trashed
- For Google Docs, ensure export format is supported

### Connection not persisting
- Check browser localStorage is enabled
- Verify user ID is consistent
- Clear localStorage and reconnect

## Security Considerations

1. **User Isolation**: Each user has separate connection
2. **Token Management**: Tokens managed by Pipedream
3. **RLS**: User authentication checked on all API routes
4. **No Storage**: Files not stored on server, processed in memory
5. **Secure Transmission**: All API calls over HTTPS

## Cost Considerations

Pipedream offers:
- Free tier with limited API calls
- Pay-as-you-go for additional usage
- Monitor usage in Pipedream dashboard

## Support

For issues:
1. Check Pipedream dashboard for API errors
2. Review browser console for client errors
3. Check server logs for backend errors
4. Refer to [Pipedream docs](https://pipedream.com/docs)
