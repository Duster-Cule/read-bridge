import { FormattedBook } from "@/types/book";
import { detectLanguage } from "@/utils/franc";

export function initTXTBook(buffer: Buffer, name: string): FormattedBook {
  const textContent = buffer.toString('utf-8');
  const paragraphs = textContent.split(/\r?\n/);
  const language = detectLanguage(textContent.slice(0, 500))
  const book: FormattedBook = {
    metadata: {
      title: name,
      language: language,
    },
    chapterList: [
      {
        title: name,
        paragraphs: paragraphs,
      }
    ]
  }
  return book
}



