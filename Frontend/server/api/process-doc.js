import formidable from "formidable-serverless";
import fs from "fs";
import { DocumentProcessorServiceClient } from "@google-cloud/documentai";

export const config = {
  api: { bodyParser: false }, // Required for file uploads
};

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).end("Method Not Allowed");

  const form = new formidable.IncomingForm();

  form.parse(req, async (err, fields, files) => {
    if (err) return res.status(500).json({ error: err.message });

    try {
      // Read uploaded file
      const filePath = files.file.filepath;
      const buffer = fs.readFileSync(filePath);

      // Initialize Document AI client
      const client = new DocumentProcessorServiceClient({
        keyFilename: "service-account.json", // keep in backend only
      });

      // Pull values from .env
      const projectId = process.env.GOOGLE_CLOUD_PROJECT_ID;
      const location = process.env.GOOGLE_CLOUD_LOCATION || "us";
      const processorId = process.env.DOCUMENT_AI_PROCESSOR_ID;

      const name = `projects/${projectId}/locations/${location}/processors/${processorId}`;

      // Send request to Document AI
      const [result] = await client.processDocument({
        name,
        rawDocument: {
          content: buffer.toString("base64"),
          mimeType: files.file.mimetype, // e.g. application/pdf
        },
      });

      const doc = result.document;

      res.status(200).json({
        text: doc.text || "",
        entities: doc.entities || [],
        tables: doc.pages?.flatMap((p) => p.tables) || [],
      });
    } catch (error) {
      console.error("Document AI error:", error);
      res.status(500).json({ error: error.message });
    }
  });
}
