/**
 * Summarizes legal document text using Google Gemini API.
 */
async function summarizeLegalDocument(
  extractedText: string
): Promise<{
  summary: string;
  highlightedClauses: { clause: string; explanation: string }[];
}> {
  const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY;
  const GEMINI_API_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_API_KEY}`;

  const prompt = `
You are a precise legal contract summarizer.

TASK:
1. Read DOCUMENT_TEXT.
2. At the top, provide a TL;DR in one plain-language sentence summarizing the contract.
3. Convert the contract into a human-readable summary with clearly labeled sections:
4. Dont add Bold Text(*)
   - PARTIES
   - PROJECT
   - PAYMENT
   - TERMINATION
   - INSURANCE AND INDEMNITY
   - AUDIT AND RECORDS
   - IP AND CONFIDENTIALITY
   - COMPLIANCE
   - INDEPENDENT CONTRACTOR STATUS
   - SAFETY
   - SUBCONTRACTING AND ASSIGNMENT
   - REBATES AND KICKBACKS
   - DISPUTE RESOLUTION
   - NOTICES
4. Present numeric values (days, $ amounts, percentages) clearly in tables or bullet points under each section.
5. If a clause is missing, write "Not specified" instead of null.
6. Make the summary visually easy to scan: use headings, bullets, and spacing. Highlight key information like names, dates, and amounts.

DOCUMENT_TEXT:
{{DOCUMENT_TEXT}}

  .  

${extractedText}
`;

  try {
    const response = await fetch(GEMINI_API_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
      }),
    });

    if (!response.ok) {
      throw new Error(`Gemini API error: ${response.statusText}`);
    }

    const data = await response.json();
    const aiText = data?.candidates?.[0]?.content?.parts?.[0]?.text || "";

    let result;
    try {
      result = JSON.parse(aiText);
    } catch {
      result = { summary: aiText, highlightedClauses: [] };
    }
    return result;
  } catch (err: any) {
    return {
      summary: "Error generating summary: " + (err.message || "Unknown error"),
      highlightedClauses: [],
    };
  }
}

import Tesseract from "tesseract.js";
import { getDocument, GlobalWorkerOptions, PDFDocumentProxy } from "pdfjs-dist";
import workerSrc from "pdfjs-dist/build/pdf.worker?url";

GlobalWorkerOptions.workerSrc = workerSrc;

/**
 * Extract text from image or PDF file using Tesseract.js (OCR fallback).
 */
async function extractTextFromFile(
  file: File,
  onProgress?: (progress: number) => void
): Promise<string> {
  try {
    const mimeType = file.type;
    if (!mimeType.startsWith("image/") && mimeType !== "application/pdf") {
      throw new Error("Unsupported file type. Please upload an image or PDF.");
    }

    const fileUrl = URL.createObjectURL(file);

    // Case 1: Image OCR
    if (mimeType.startsWith("image/")) {
      const result = await Tesseract.recognize(fileUrl, "eng", {
        logger: (m) => {
          if (onProgress && m.status === "recognizing text") {
            onProgress(m.progress);
          }
        },
      });
      URL.revokeObjectURL(fileUrl);
      return result.data.text;
    }

    // Case 2: PDF
    if (mimeType === "application/pdf") {
      const pdfData = await file.arrayBuffer();
      const pdf: PDFDocumentProxy = await getDocument({ data: pdfData }).promise;

      let fullText = "";

      for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
        const page = await pdf.getPage(pageNum);

        // Try direct text extraction
        const textContent = await page.getTextContent();
        let pageText = textContent.items.map((i: any) => i.str).join(" ");

        if (pageText.trim().length === 0) {
          // Fallback to OCR if no text
          const viewport = page.getViewport({ scale: 2 });
          const canvas = document.createElement("canvas");
          const context = canvas.getContext("2d")!;
          canvas.width = viewport.width;
          canvas.height = viewport.height;

          await page.render({ canvasContext: context, viewport }).promise;

          const { data } = await Tesseract.recognize(canvas, "eng", {
            logger: (m) => {
              if (onProgress && m.status === "recognizing text") {
                const pageProgress = (m.progress + pageNum - 1) / pdf.numPages;
                onProgress(pageProgress);
              }
            },
          });

          pageText = data.text;
        }

        fullText += pageText + "\n\n";
      }

      URL.revokeObjectURL(fileUrl);
      return fullText;
    }

    throw new Error("Unexpected error: file type not handled.");
  } catch (err: any) {
    return `Error extracting text: ${err.message || "Unknown error"}`;
  }
}

const DocumentService = { extractTextFromFile, summarizeLegalDocument };
export default DocumentService;
