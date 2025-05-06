import { Tooltip } from "antd";
import nlp from "compromise";
import { useCallback, useMemo } from "react";
import { useTranslation } from "@/i18n/useTranslation";
import { useTheme } from "next-themes";

export default function CurrentSentence({ sentence, handleWord }: { sentence: string, handleWord: (word: string) => void }) {
  const { t } = useTranslation()
  const { theme: currentTheme } = useTheme();
  const wordTypeColors = useMemo(() => ({
    'Verb': 'text-[var(--ant-green-6)]',
    'Adjective': 'text-[var(--ant-purple-7)]',
    'Pivot': 'text-[var(--ant-gold-6)]',
    'Noun': 'text-[var(--ant-color-text)]',
  }), [])
  const getChunkColor = useCallback((chunk: string) => {
    return wordTypeColors[chunk] || 'text-[var(--ant-color-text)]';
  }, [wordTypeColors]);
  const terms = useMemo(() => {
    if (sentence && sentence.length > 0) {
      const doc = nlp(sentence)
      return doc.terms().json()
    }
    return []
  }, [sentence])
  return (
    <div className="w-full h-[136px] p-4 ">
      <Tooltip
        color={currentTheme === 'dark' ? '' : 'white'}
        title={
          <>
            <div className={getChunkColor('Verb')}>{t('sider.verb')}</div>
            <div className={getChunkColor('Adjective')}>{t('sider.adjective')}</div>
            <div className={getChunkColor('Pivot')}>{t('sider.pivot')}</div>
            <div className={getChunkColor('Noun')}>{t('sider.noun')}</div>
          </>
        }
      >
        <div className="text-lg font-semibold text-[var(--ant-color-text)] cursor-help">
          {t('sider.selectSentence')}
        </div>
      </Tooltip>
      <div className="space-y-1 overflow-y-auto h-[76px]">
        {terms.map((term, i) => (
          <span
            key={i}
            className={`${getChunkColor(term.terms[0].chunk)} hover:underline cursor-pointer text-base`}
            onClick={() => {
              handleWord(term.text)
            }}
          >
            {term.text}{' '}
          </span>
        ))}
      </div>
    </div>
  )
}
