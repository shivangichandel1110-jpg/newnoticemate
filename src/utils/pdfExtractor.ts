/**
 * Client-side PDF Text Extractor
 * Extracts digital text directly in the browser to avoid sending large PDF binaries to Gemini.
 * If the PDF is scanned (no embedded text), flags hasEmbeddedText: false so OCR is used.
 */

export interface PdfExtractionResult {
  hasEmbeddedText: boolean;
  extractedText: string;
  pageCount: number;
}

export async function extractTextFromPdf(file: File): Promise<PdfExtractionResult> {
  try {
    const arrayBuffer = await file.arrayBuffer();

    // Dynamically import pdfjs-dist in the browser
    const pdfjsLib = await import('pdfjs-dist/build/pdf.mjs');

    // Configure worker if needed or disable worker for quick inline text extraction
    if (!pdfjsLib.GlobalWorkerOptions.workerSrc) {
      pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version || '4.0.379'}/pdf.worker.min.mjs`;
    }

    const loadingTask = pdfjsLib.getDocument({
      data: new Uint8Array(arrayBuffer),
      useWorkerFetch: false,
      isEvalSupported: false,
      useSystemFonts: true,
    });

    const pdf = await loadingTask.promise;
    const pageCount = pdf.numPages;
    let fullText = '';

    // Extract text page by page (limit to first 15 pages for speed and security)
    const pagesToExtract = Math.min(pageCount, 15);
    for (let pageNum = 1; pageNum <= pagesToExtract; pageNum++) {
      try {
        const page = await pdf.getPage(pageNum);
        const textContent = await page.getTextContent();
        const pageItems = textContent.items
          .map((item: any) => ('str' in item ? item.str : ''))
          .join(' ')
          .replace(/\s+/g, ' ')
          .trim();

        if (pageItems.length > 0) {
          fullText += `\n[Page ${pageNum}]\n${pageItems}\n`;
        }
      } catch (pageErr) {
        console.warn(`Error extracting text from page ${pageNum}:`, pageErr);
      }
    }

    const trimmed = fullText.trim();
    // A digital PDF notice will usually have at least 50 readable characters
    const hasEmbeddedText = trimmed.length >= 50;

    return {
      hasEmbeddedText,
      extractedText: trimmed,
      pageCount,
    };
  } catch (err) {
    console.warn('Local PDF extraction failed, falling back to Gemini multimodal:', err);
    return {
      hasEmbeddedText: false,
      extractedText: '',
      pageCount: 1,
    };
  }
}
