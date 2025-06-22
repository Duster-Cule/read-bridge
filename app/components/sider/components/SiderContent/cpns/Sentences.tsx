import CardComponent from "@/app/components/common/CardComponent"
import { OUTPUT_TYPE } from "@/constants/prompt"
import { Collapse } from "antd"
import { LoadingOutlined } from "@ant-design/icons"
import { useCallback, useEffect, useRef, useState } from "react"
import MarkdownViewer from "@/app/components/common/MarkdownViewer"
import { CacheItemValue, SentenceProcessing } from "@/types/cache"

import { cacheService } from "@/services/CacheService"
import { useSiderStore } from "@/store/useSiderStore"

// 自定义hook抽取think处理逻辑
function useThinkGenerator(SentenceProcessing: SentenceProcessing, outputType: 'text' | 'list') {
  const generator = SentenceProcessing.generator
  const [text, setText] = useState<string>("")
  const [list, setList] = useState<string[]>([])
  const [thinkContext, setThinkContext] = useState<string>('')
  const key = useRef(0)
  const { readingId } = useSiderStore()
  useEffect(() => {
    setText("");
    setList([]);
    setThinkContext('')

    handleThinkAndResult(generator,
      outputType === 'text' ? (value) => setText((prev) => prev + value) : (value) => setList((prev) => [...prev, value]),
      (value) => setThinkContext((prev) => prev + value),
    ).then(() => key.current += 1)
  }, [generator, outputType])


  useEffect(() => {
    const { id, type, text: sentence } = SentenceProcessing
    cacheService.set(
      {
        bookId: readingId || '',
        sentence,
        ruleId: id
      },
      {
        type: type,
        ...(thinkContext.length > 0 ? { thinkContext } : {}),
        ...(text.length > 0
          ? { result: text }
          : { resultArray: list })
      } as CacheItemValue
    )
  }, [text, list, thinkContext, SentenceProcessing, readingId])
  return { text, list, thinkContext }
}

export default function Sentences({ sentenceProcessingList }: {
  sentenceProcessingList:
  SentenceProcessing[]
}) {
  return (
    <div className="w-full h-[578px] p-4 overflow-y-auto">
      {
        sentenceProcessingList.map((item) => {
          return (
            item.type === OUTPUT_TYPE.MD ? <MDGenerator className="mb-2" SentenceProcessing={item} key={item.id} /> :
              <CardComponent className="mb-2" key={item.id} title={item.name} loading={!item}>
                {
                  item.type === OUTPUT_TYPE.TEXT ? <TextGenerator SentenceProcessing={item} /> :
                    item.type === OUTPUT_TYPE.SIMPLE_LIST ? <SimpleListGenerator SentenceProcessing={item} /> :
                      item.type === OUTPUT_TYPE.KEY_VALUE_LIST ? <KeyValueListGenerator SentenceProcessing={item} /> :
                        null
                }
              </CardComponent>
          )
        })
      }
    </div>
  )
}

function TextGenerator({ SentenceProcessing }: { SentenceProcessing: SentenceProcessing }) {
  const { text, thinkContext } = useThinkGenerator(SentenceProcessing, 'text')

  return <div>
    <ThinkCollapse thinkContext={thinkContext} />
    {text.length === 0 && <LoadingOutlined />}
    <div>{text}</div>
  </div>
}

function ListGenerator({ SentenceProcessing, type }: { SentenceProcessing: SentenceProcessing, type: string }) {
  const handleWordAnalysis = useCallback((analysis: string, index: number) => {
    const [keyWord, ...rest] = analysis.split(':')
    return <div className="text-[var(--ant-color-text)] mb-2" key={index}><span className=" font-semibold">{keyWord}</span>:{rest}</div>
  }, [])

  const { list, thinkContext } = useThinkGenerator(SentenceProcessing, 'list')

  return (
    <div>
      <ThinkCollapse thinkContext={thinkContext} />
      {list.length === 0 && <LoadingOutlined />}
      {type === OUTPUT_TYPE.KEY_VALUE_LIST
        ? list.map((item, index) => handleWordAnalysis(item, index))
        : list.map((item) => <div key={item}>{item}</div>)
      }
    </div>
  )
}

async function handleThinkAndResult(
  generator: AsyncGenerator<string, void, unknown>,
  onValue: (value: string) => void,
  onThinkContext: (value: string) => void,
) {
  let thinking: boolean = false;
  (async () => {
    for await (const chunk of generator) {
      if (chunk === '<think>') {
        thinking = true
        continue
      }
      if (thinking) {
        if (chunk === '</think>') {
          thinking = false
          continue
        }
        onThinkContext(chunk)
      } else {
        onValue(chunk)
      }
    }
  })()
}

function SimpleListGenerator({ SentenceProcessing }: { SentenceProcessing: SentenceProcessing }) {
  return <ListGenerator SentenceProcessing={SentenceProcessing} type={OUTPUT_TYPE.SIMPLE_LIST} />
}

function KeyValueListGenerator({ SentenceProcessing }: { SentenceProcessing: SentenceProcessing }) {
  return <ListGenerator SentenceProcessing={SentenceProcessing} type={OUTPUT_TYPE.KEY_VALUE_LIST} />
}

function ThinkCollapse({ thinkContext }: { thinkContext: string }) {
  if (!thinkContext) return null;
  return (
    <Collapse
      size="small"
      ghost
      className="[&_.ant-collapse-header]{padding:0}"
      items={[{ key: '1', label: 'think', children: <p>{thinkContext}</p> }]}
    />
  );
}

function MDGenerator({ SentenceProcessing, className }: { SentenceProcessing: SentenceProcessing, className?: string }) {
  const { text, thinkContext } = useThinkGenerator(SentenceProcessing, 'text')
  return <div className={className}>
    <ThinkCollapse thinkContext={thinkContext} />
    <MarkdownViewer content={text} minHeight={380} />
  </div>
}

