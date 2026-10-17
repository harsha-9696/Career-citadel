import * as pdfjsLib from 'pdfjs-dist';

// Configure the worker from cdnjs matching pdfjs-dist version 3.11.174
pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js`;

/**
 * Extracts complete plain text content from an uploaded PDF File
 */
export async function extractTextFromPDF(file: File): Promise<string> {
  try {
    const arrayBuffer = await file.arrayBuffer();
    const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
    const pdf = await loadingTask.promise;

    let fullText = '';
    const numPages = pdf.numPages;

    for (let pageNum = 1; pageNum <= numPages; pageNum++) {
      const page = await pdf.getPage(pageNum);
      const textContent = await page.getTextContent();
      
      const pageText = textContent.items
        .map((item: any) => ('str' in item ? item.str : ''))
        .join(' ');

      fullText += `--- Page ${pageNum} ---\n${pageText}\n\n`;
    }

    return fullText.trim();
  } catch (err: any) {
    console.error('PDF text extraction error:', err);
    throw new Error(`Failed to extract text from PDF: ${err.message || 'Unknown error'}`);
  }
}
