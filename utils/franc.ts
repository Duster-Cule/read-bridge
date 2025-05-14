import { franc } from "franc";

export function detectLanguage(origin: string): string {
  const find = franc(origin, { minLength: 0 });
  switch (find) {
    case 'cmn':
    case 'zho':
      return 'zh';
    case 'eng':
      return 'en';
    case 'jpn':
      return 'ja';
    case 'kor':
      return 'ko';
    case 'fra':
      return 'fr';
    case 'deu':
      return 'de';
    case 'spa':
      return 'es';
    case 'ita':
      return 'it';
    case 'rus':
      return 'ru';
    default:
      return find;
  }
}