import CardComponent from "@/app/components/common/CardComponent"
import { OUTPUT_TYPE } from "@/constants/prompt"
import { useCallback, useEffect, useState } from "react"

export default function Sentences({ sentenceProcessingList }: { sentenceProcessingList: { name: string, type: string, generator: AsyncGenerator<string, void, unknown> }[] }) {
  return (
    <div className="w-full h-[262px] overflow-y-auto p-4">
      {
        sentenceProcessingList.map((item) => (
          <CardComponent className="mb-2" key={item.name} title={item.name} loading={!item.generator}>
            {
              item.type === OUTPUT_TYPE.TEXT ? <TextGenerator generator={item.generator} /> :
                item.type === OUTPUT_TYPE.BULLET_LIST ? <BulletListGenerator generator={item.generator} /> :
                  item.type === OUTPUT_TYPE.KEY_VALUE_LIST ? <KeyValueListGenerator generator={item.generator} /> :
                    null
            }
          </CardComponent>
        ))
      }
    </div>
  )
}

function TextGenerator({ generator }: { generator: AsyncGenerator<string, void, unknown> }) {
  const [text, setText] = useState<string>("")
  const [thinkContext, setThinkContext] = useState<string>('')

  useEffect(() => {
    setText("");
    setThinkContext('')
    handleThink(generator,
      (value) => setText((prev) => prev + value),
      (value) => setThinkContext((prev) => prev + value)
    )
  }, [generator])
  return <div>{text}</div>
}

function ListGenerator({ generator, type }: { generator: AsyncGenerator<string, void, unknown>, type: string }) {
  const handleWordAnalysis = useCallback((analysis: string, index: number) => {
    const [keyWord, ...rest] = analysis.split(':')
    return <div className="text-[var(--ant-color-text)] mb-2" key={index}><span className=" font-semibold">{keyWord}</span>:{rest}</div>
  }, [])

  const [list, setList] = useState<string[]>([])
  const [thinkContext, setThinkContext] = useState<string>('')

  useEffect(() => {
    setList([])
    setThinkContext('')
    handleThink(generator,
      (value) => setList((prev) => [...prev, value]),
      (value) => setThinkContext((prev) => prev + value)
    )
  }, [generator, type])

  return (
    <div>
      {thinkContext && <div>{thinkContext}</div>}
      {type === OUTPUT_TYPE.KEY_VALUE_LIST
        ? list.map((item, index) => handleWordAnalysis(item, index))
        : list.map((item) => <div key={item}>{item}</div>)
      }
    </div>
  )
}

function handleThink(generator: AsyncGenerator<string, void, unknown>, onValue: (value: string) => void, onThinkContext: (value: string) => void) {
  let thinking = false
  let buffer = '';
  (async () => {
    for await (const chunk of generator) {
      buffer += chunk
      if (chunk === '<think>') {
        thinking = true
      }
      if (thinking) {
        onThinkContext(chunk)
        buffer = ''
      } else {
        onValue(chunk)
        buffer = ''
      }
      if (chunk === '</think>') {
        thinking = false
      }
    }
  })()
}
function BulletListGenerator({ generator }: { generator: AsyncGenerator<string, void, unknown> }) {
  return <ListGenerator generator={generator} type={OUTPUT_TYPE.BULLET_LIST} />
}

function KeyValueListGenerator({ generator }: { generator: AsyncGenerator<string, void, unknown> }) {
  return <ListGenerator generator={generator} type={OUTPUT_TYPE.KEY_VALUE_LIST} />
}
