import { Book } from "@/types/book"
import { useEffect, useRef, useState } from "react"
import nlp from 'compromise'
import db from "@/services/DB"


export default function ReadArea({ book, currentChapter }: { book: Book, currentChapter: number }) {
  const title = book.chapterList[currentChapter].title
  const paragraphs = book.chapterList[currentChapter].paragraphs
  const containerRef = useRef<HTMLDivElement>(null)

  const [sentences, setSentences] = useState<string[]>([])
  const [currentLineIndex, setCurrentLineIndex] = useState<number>(0)

  useEffect(() => {
    const allSentences: string[] = []
    paragraphs.forEach(paragraph => {
      // 判断是否主要为中文文本
      const isChinese = /[\u4e00-\u9fa5]/.test(paragraph)
      let sentences: string[] = []
      if (isChinese) sentences = paragraph.match(/[^。！？]+[。！？]/g) || []
      else {
        // 处理英文句子
        const doc = nlp(paragraph)
        sentences = doc.sentences().out('array')
      }
      allSentences.push(...sentences, 'EOB')
    })

    setSentences(allSentences.reduce((acc, sentence) => {
      if (sentence === 'EOB') {
        acc.push('')
        return acc
      }
      acc.push(sentence)
      return acc
    }, [] as string[]))
    // 滚动条跳转最上方
    containerRef.current?.scrollTo({
      top: 0,
      behavior: 'smooth'
    })
  }, [paragraphs, setSentences])


  // 更新阅读数据
  useEffect(() => {
    db.updateCurrentLocation(book.id, { chapterIndex: currentChapter, lineIndex: currentLineIndex })
  }, [currentLineIndex])

  const handleLineClick = (index: number) => {
    console.log(`Clicked line ${index + 1}`)
    setCurrentLineIndex(index)
  }
  console.log(111)
  return (
    <div ref={containerRef} className="w-full h-full overflow-auto p-2">
      <div className="text-2xl font-bold mb-4 ml-10">{title}</div>
      <div className="text-lg">
        {sentences.map((sentence, index) => (
          <Line sentence={sentence} index={index} key={index} handleLineClick={handleLineClick} />
        ))}
      </div>
    </div>
  )
}


function Line({ sentence, index, handleLineClick }: { sentence: string, index: number, handleLineClick: (index: number) => void }) {

  return (
    <div className={`flex mb-1 group rounded-lg`}>
      <div className={`w-10 text-right pr-1 select-none cursor-pointer text-[var(--ant-color-primary)] hover:text-[var(--ant-color-primary-hover)]`}
        onClick={() => handleLineClick(index)}
      >
        {index + 1}
      </div>
      <div className={`mx-1 select-none text-[var(--ant-color-border)]`}>|</div>
      <div className="flex-1">{sentence}</div>
    </div>
  )
}


