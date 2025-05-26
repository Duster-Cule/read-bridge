import CardComponent from "@/app/components/common/CardComponent"
import { OUTPUT_TYPE } from "@/constants/prompt"
import { Collapse } from "antd"
import { LoadingOutlined } from "@ant-design/icons"
import { useCallback, useEffect, useState } from "react"
import MarkdownViewer from "@/app/components/common/MarkdownViewer"

// 自定义hook抽取think处理逻辑
function useThinkGenerator(generator: AsyncGenerator<string, void, unknown>, outputType: 'text' | 'list') {
  const [text, setText] = useState<string>("")
  const [list, setList] = useState<string[]>([])
  const [thinkContext, setThinkContext] = useState<string>('')

  useEffect(() => {
    setText("");
    setList([]);
    setThinkContext('')

    if (outputType === 'text') {
      handleThink(generator,
        (value) => setText((prev) => prev + value),
        (value) => setThinkContext((prev) => prev + value)
      )
    } else {
      handleThink(generator,
        (value) => setList((prev) => [...prev, value]),
        (value) => setThinkContext((prev) => prev + value)
      )
    }
  }, [generator, outputType])

  return { text, list, thinkContext }
}

export default function Sentences({ sentenceProcessingList }: { sentenceProcessingList: { name: string, id: string, type: string, generator: AsyncGenerator<string, void, unknown> }[] }) {
  return (
    <div className="w-full h-[262px] overflow-y-auto p-4">
      {
        sentenceProcessingList.map((item) => {
          return (
            item.type === OUTPUT_TYPE.MD ? <MDGenerator className="mb-2" generator={item.generator} key={item.id} /> :
              <CardComponent className="mb-2" key={item.id} title={item.name} loading={!item.generator}>
                {
                  item.type === OUTPUT_TYPE.TEXT ? <TextGenerator generator={item.generator} /> :
                    item.type === OUTPUT_TYPE.SIMPLE_LIST ? <SimpleListGenerator generator={item.generator} /> :
                      item.type === OUTPUT_TYPE.KEY_VALUE_LIST ? <KeyValueListGenerator generator={item.generator} /> :
                        null
                }
              </CardComponent>
          )
        })
      }
    </div>
  )
}

function TextGenerator({ generator }: { generator: AsyncGenerator<string, void, unknown> }) {
  const { text, thinkContext } = useThinkGenerator(generator, 'text')

  return <div>
    <ThinkCollapse thinkContext={thinkContext} />
    {text.length === 0 && <LoadingOutlined />}
    <div>{text}</div>
  </div>
}

function ListGenerator({ generator, type }: { generator: AsyncGenerator<string, void, unknown>, type: string }) {
  const handleWordAnalysis = useCallback((analysis: string, index: number) => {
    const [keyWord, ...rest] = analysis.split(':')
    return <div className="text-[var(--ant-color-text)] mb-2" key={index}><span className=" font-semibold">{keyWord}</span>:{rest}</div>
  }, [])

  const { list, thinkContext } = useThinkGenerator(generator, 'list')

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

function handleThink(generator: AsyncGenerator<string, void, unknown>, onValue: (value: string) => void, onThinkContext: (value: string) => void) {
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

function SimpleListGenerator({ generator }: { generator: AsyncGenerator<string, void, unknown> }) {
  return <ListGenerator generator={generator} type={OUTPUT_TYPE.SIMPLE_LIST} />
}

function KeyValueListGenerator({ generator }: { generator: AsyncGenerator<string, void, unknown> }) {
  return <ListGenerator generator={generator} type={OUTPUT_TYPE.KEY_VALUE_LIST} />
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

function MDGenerator({ generator, className }: { generator: AsyncGenerator<string, void, unknown>, className?: string }) {
  const { text, thinkContext } = useThinkGenerator(generator, 'text')
  return <div className={className}>
    <ThinkCollapse thinkContext={thinkContext} />
    <MarkdownViewer content={text} />
  </div>
}

