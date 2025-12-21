import type { FormattedBook } from '@/types/book';
import { detectLanguage } from '@/utils/franc';

let pdfjsLibPromise: Promise<any> | null = null;

async function loadPdfjs() {
  if (!pdfjsLibPromise) {
    pdfjsLibPromise = import('pdfjs-dist/legacy/build/pdf.mjs') as any;
  }

  const pdfjsLib = await pdfjsLibPromise;

  if (typeof window !== 'undefined') {
    try {
      if (!pdfjsLib.GlobalWorkerOptions?.workerSrc) {
        pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
          'pdfjs-dist/legacy/build/pdf.worker.mjs',
          import.meta.url
        ).toString();
      }
    } catch {
      // Ignore; pdf.js will throw a helpful error if workerSrc is truly required.
    }
  }

  return pdfjsLib;
}

export async function initPDFBook(buffer: Buffer, name: string): Promise<FormattedBook> {
  const pdfjsLib = await loadPdfjs();
  const data = new Uint8Array(buffer);

  const isServer = typeof window === 'undefined'
  // In Node (route handlers / import), avoid worker resolution issues.
  const loadingTask = pdfjsLib.getDocument({ data, ...(isServer ? { disableWorker: true } : {}) } as any);

  const pdf = await loadingTask.promise;

  const paragraphs: string[] = [];
  let sampleText = '';

  for (let pageIndex = 1; pageIndex <= pdf.numPages; pageIndex++) {
    const page = await pdf.getPage(pageIndex);
    const textContent = await page.getTextContent();

    const pageText = (textContent.items as Array<{ str?: string }>).
      map(item => (item?.str ? String(item.str) : ''))
      .filter(Boolean)
      .join(' ')
      .replace(/\s+/g, ' ')
      .trim();

    if (pageText) {
      paragraphs.push(pageText);
      if (sampleText.length < 600) {
        sampleText += (sampleText ? '\n' : '') + pageText;
      }
    }
  }

  const language = detectLanguage(sampleText.slice(0, 500));

  return {
    metadata: {
      title: name,
      language,
      sourceFile: {
        data: buffer.toString('base64'),
        mediaType: 'application/pdf',
      },
    },
    chapterList: [
      {
        title: name,
        paragraphs: paragraphs.length ? paragraphs : [''],
      },
    ],
  };
}
