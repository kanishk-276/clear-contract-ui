require('dotenv').config();
const express = require('express');
const cors = require('cors');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { DocumentProcessorServiceClient } = require('@google-cloud/documentai');

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true
}));
app.use(express.json());

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = 'uploads/';
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['.pdf', '.png', '.jpg', '.jpeg', '.tiff', '.gif'];
    const ext = path.extname(file.originalname).toLowerCase();
    
    if (allowedTypes.includes(ext)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only PDF, PNG, JPG, JPEG, TIFF, and GIF files are allowed.'));
    }
  }
});

// Initialize Document AI client
let documentClient;
try {
  documentClient = new DocumentProcessorServiceClient({
    keyFilename: './service-account.json', // Path to your service account key
  });
} catch (error) {
  console.error('Error initializing Document AI client:', error);
  console.log('Make sure service-account.json is in the server directory');
}

// Document AI configuration
const PROJECT_ID = process.env.GOOGLE_CLOUD_PROJECT_ID || 'your-project-id';
const LOCATION = process.env.GOOGLE_CLOUD_LOCATION || 'us';
const PROCESSOR_ID = process.env.DOCUMENT_AI_PROCESSOR_ID || 'your-processor-id';

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    message: 'Document AI Server is running',
    timestamp: new Date().toISOString()
  });
});

// File upload and processing endpoint
app.post('/api/process-document', upload.single('document'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ 
        error: 'No file uploaded',
        message: 'Please upload a document file'
      });
    }

    if (!documentClient) {
      return res.status(500).json({ 
        error: 'Document AI not configured',
        message: 'Document AI client is not properly initialized'
      });
    }

    console.log(`Processing file: ${req.file.originalname}`);

    // Read the uploaded file
    const fileBuffer = fs.readFileSync(req.file.path);
    
    // Prepare the request for Document AI
    const request = {
      name: `projects/${PROJECT_ID}/locations/${LOCATION}/processors/${PROCESSOR_ID}`,
      rawDocument: {
        content: fileBuffer,
        mimeType: getMimeType(req.file.mimetype),
      },
    };

    console.log('Sending request to Document AI...');
    
    // Process the document
    const [result] = await documentClient.processDocument(request);
    const { document } = result;

    // Extract text from the document
    const extractedText = document.text || '';
    
    // Extract structured data if available
    const entities = extractEntities(document.entities);
    const tables = extractTables(document.pages);
    
    // Clean up uploaded file
    fs.unlinkSync(req.file.path);

    console.log(`Successfully processed document: ${req.file.originalname}`);

    // Send response with extracted data
    res.json({
      success: true,
      filename: req.file.originalname,
      extractedText: extractedText,
      entities: entities,
      tables: tables,
      pageCount: document.pages?.length || 1,
      confidence: calculateConfidence(document),
      processedAt: new Date().toISOString()
    });

  } catch (error) {
    console.error('Error processing document:', error);
    
    // Clean up file if it exists
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }

    res.status(500).json({ 
      error: 'Document processing failed',
      message: error.message || 'An error occurred while processing the document',
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

// Helper function to get proper MIME type
function getMimeType(multerMimeType) {
  const mimeTypeMap = {
    'application/pdf': 'application/pdf',
    'image/png': 'image/png',
    'image/jpeg': 'image/jpeg',
    'image/jpg': 'image/jpeg',
    'image/tiff': 'image/tiff',
    'image/gif': 'image/gif',
  };
  
  return mimeTypeMap[multerMimeType] || 'application/pdf';
}

// Helper function to extract entities from document
function extractEntities(entities) {
  if (!entities || entities.length === 0) return [];
  
  return entities.map(entity => ({
    type: entity.type,
    text: entity.textAnchor?.content || entity.mentionText || '',
    confidence: entity.confidence || 0,
    normalizedValue: entity.normalizedValue?.text || null
  }));
}

// Helper function to extract tables from document
function extractTables(pages) {
  if (!pages || pages.length === 0) return [];
  
  const tables = [];
  
  pages.forEach((page, pageIndex) => {
    if (page.tables) {
      page.tables.forEach((table, tableIndex) => {
        const tableData = {
          pageIndex: pageIndex + 1,
          tableIndex: tableIndex + 1,
          rows: [],
          confidence: table.confidence || 0
        };
        
        // Extract table cells
        if (table.bodyRows) {
          table.bodyRows.forEach(row => {
            const rowData = [];
            row.cells.forEach(cell => {
              const cellText = cell.layout?.textAnchor?.content || '';
              rowData.push(cellText.trim());
            });
            tableData.rows.push(rowData);
          });
        }
        
        tables.push(tableData);
      });
    }
  });
  
  return tables;
}

// Helper function to calculate overall confidence score
function calculateConfidence(document) {
  if (!document.pages || document.pages.length === 0) return 0;
  
  let totalConfidence = 0;
  let confidenceCount = 0;
  
  document.pages.forEach(page => {
    if (page.confidence) {
      totalConfidence += page.confidence;
      confidenceCount++;
    }
  });
  
  return confidenceCount > 0 ? (totalConfidence / confidenceCount) : 0;
}

// Error handling middleware
app.use((error, req, res, next) => {
  if (error instanceof multer.MulterError) {
    if (error.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({
        error: 'File too large',
        message: 'File size must be less than 10MB'
      });
    }
  }
  
  console.error('Server error:', error);
  res.status(500).json({
    error: 'Internal server error',
    message: 'Something went wrong on the server'
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Document AI Server running on port ${PORT}`);
  console.log(`📁 Upload directory: ./uploads/`);
  console.log(`🔧 Document AI configured for project: ${PROJECT_ID}`);
  console.log(`📍 Location: ${LOCATION}`);
  console.log(`⚙️  Processor ID: ${PROCESSOR_ID}`);
  console.log(`🌐 CORS enabled for: ${process.env.FRONTEND_URL || 'http://localhost:5173'}`);
});

module.exports = app;
