import CardComponent from "@/app/components/common/CardComponent"
import { OUTPUT_TYPE } from "@/constants/prompt"
import { useCallback, useEffect, useState } from "react"

export default function Sentences({ sentenceProcessingList }: { sentenceProcessingList: { name: string, type: string, generator: AsyncGenerator<string, void, unknown> }[] }) {
  return (
    <div className="w-full h-[350px] overflow-y-auto p-4">
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
  useEffect(() => {
    (async () => {
      for await (const chunk of generator) {
        setText((prev) => prev + chunk)
      }
    })()
  }, [generator])
  return <div>{text}</div>
}

function BulletListGenerator({ generator }: { generator: AsyncGenerator<string, void, unknown> }) {
  const [list, setList] = useState<string[]>([])
  useEffect(() => {
    (async () => {
      for await (const chunk of generator) {
        setList((prev) => [...prev, chunk])
      }
    })()
  }, [generator])
  return (
    <div>
      {list.map((item) => (
        <div key={item}>{item}</div>
      ))}
    </div>
  )
}

function KeyValueListGenerator({ generator }: { generator: AsyncGenerator<string, void, unknown> }) {
  const handleWordAnalysis = useCallback((analysis: string, index: number) => {
    const [keyWord, ...rest] = analysis.split(':')
    return <div className="text-[var(--ant-color-text)] mb-2" key={index}><span className=" font-semibold">{keyWord}</span>:{rest}</div>
  }, [])
  const [list, setList] = useState<string[]>([])
  useEffect(() => {
    (async () => {
      for await (const chunk of generator) {
        setList((prev) => [...prev, chunk])
      }
    })()
  }, [generator])
  return (
    <div>
      {list.map((item, index) => (
        handleWordAnalysis(item, index)
      ))}
    </div>
  )
}
