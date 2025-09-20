# Legal AI Backend Server

This server integrates with Google Cloud Document AI to process legal documents uploaded from the frontend.

## Setup Instructions

### 1. Install Dependencies
```bash
npm install
```

### 2. Google Cloud Setup

#### A. Create a Google Cloud Project
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Note down your Project ID

#### B. Enable Document AI API
1. In the Google Cloud Console, go to "APIs & Services" > "Library"
2. Search for "Document AI API"
3. Click on it and press "Enable"

#### C. Create a Service Account
1. Go to "IAM & Admin" > "Service Accounts"
2. Click "Create Service Account"
3. Name it "legal-ai-server"
4. Grant the following roles:
   - Document AI API User
   - Storage Object Viewer (if using Cloud Storage)
5. Create and download the JSON key file
6. Rename it to `service-account.json` and place it in the server directory

#### D. Create a Document AI Processor
1. Go to [Document AI Console](https://console.cloud.google.com/ai/document-ai)
2. Click "Create Processor"
3. Choose "Form Parser" or "OCR" based on your needs
4. Select your region (e.g., "us")
5. Note down the Processor ID from the processor details

### 3. Environment Configuration

Create a `.env` file in the server directory:

```env
# Server Configuration
PORT=3001
NODE_ENV=development

# Frontend URL (for CORS)
FRONTEND_URL=http://localhost:5173

# Google Cloud Configuration
GOOGLE_CLOUD_PROJECT_ID=your-actual-project-id
GOOGLE_CLOUD_LOCATION=us
DOCUMENT_AI_PROCESSOR_ID=your-actual-processor-id
```

### 4. Run the Server

#### Development Mode
```bash
npm run dev
```

#### Production Mode
```bash
npm start
```

The server will start on `http://localhost:3001`

## API Endpoints

### Health Check
```
GET /health
```

### Process Document
```
POST /api/process-document
Content-Type: multipart/form-data

Body:
- document: File (PDF, PNG, JPG, JPEG, TIFF, GIF)
- Max file size: 10MB

Response:
{
  "success": true,
  "filename": "document.pdf",
  "extractedText": "Extracted text content...",
  "entities": [...],
  "tables": [...],
  "pageCount": 1,
  "confidence": 0.95,
  "processedAt": "2024-01-01T00:00:00.000Z"
}
```

## File Structure

```
server/
├── index.js                 # Main server file
├── package.json            # Dependencies and scripts
├── service-account.json    # Google Cloud service account key
├── .env                    # Environment variables
├── uploads/                # Temporary file storage (auto-created)
└── README.md              # This file
```

## Security Notes

1. **Never commit `service-account.json`** to version control
2. Add `service-account.json` and `.env` to `.gitignore`
3. Use environment variables for sensitive configuration
4. The server automatically cleans up uploaded files after processing

## Troubleshooting

### Common Issues

1. **"Document AI not configured" error**
   - Check if `service-account.json` exists in the server directory
   - Verify the service account has proper permissions

2. **"Invalid file type" error**
   - Only PDF, PNG, JPG, JPEG, TIFF, and GIF files are supported
   - Check file extension and MIME type

3. **"File too large" error**
   - File size limit is 10MB
   - Compress or split larger files

4. **CORS errors**
   - Update `FRONTEND_URL` in environment variables
   - Ensure the frontend URL matches your development server

### Logs

The server provides detailed logging for debugging:
- File upload status
- Document AI processing status
- Error details (in development mode)

