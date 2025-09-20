const express = require('express');
const multer = require('multer');
const { DocumentProcessorServiceClient } = require('@google-cloud/documentai').v1;
const fs = require('fs');
const path = require('path');

// Config
const PORT = 5000;
require('dotenv').config();
const PROJECT_ID = process.env.GOOGLE_PROJECT_ID;
const LOCATION = process.env.GOOGLE_LOCATION || 'us';
const PROCESSOR_ID = process.env.GOOGLE_PROCESSOR_ID;
const SERVICE_ACCOUNT_PATH = path.join(__dirname, 'service-account.json');

// Multer setup
const upload = multer({ dest: 'uploads/' });

// Express app
const app = express();

// Document AI client
const client = new DocumentProcessorServiceClient({
	keyFilename: SERVICE_ACCOUNT_PATH,
});

app.post('/api/process', upload.single('file'), async (req, res) => {
	try {
		if (!req.file) {
			return res.status(400).json({ error: 'No file uploaded' });
		}
		const filePath = req.file.path;
		const mimeType = req.file.mimetype;
		const fileBuffer = fs.readFileSync(filePath);

		// Prepare request
		const name = `projects/${PROJECT_ID}/locations/${LOCATION}/processors/${PROCESSOR_ID}`;
		const request = {
			name,
			rawDocument: {
				content: fileBuffer,
				mimeType,
			},
		};

		// Call Document AI
		const [result] = await client.processDocument(request);
		const document = result.document;
		const extractedText = document.text || '';

		// Clean up uploaded file
		fs.unlinkSync(filePath);

		res.json({ extractedText });
	} catch (err) {
		console.error('Document AI error:', err);
		res.status(500).json({ error: err.message || 'Failed to process document' });
	}
});

app.listen(PORT, () => {
	console.log(`✅ Server running at http://localhost:${PORT}`);
});
