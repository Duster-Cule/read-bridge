import CardComponent from "@/app/components/common/CardComponent"
import { useCallback } from "react"

export default function Sentences({ sentenceAnalysis, wordAnalysis, sentenceRewrite }: { sentenceAnalysis: string[], wordAnalysis: string[], sentenceRewrite: string }) {
  const handleWordAnalysis = useCallback((analysis: string, index: number) => {
    const [keyWord, ...rest] = analysis.split(':')
    return <div className="text-[var(--ant-color-text)] mb-2" key={index}><span className=" font-semibold">{keyWord}</span>:{rest}</div>
  }, [])
  return (
    <div className="w-full h-[350px] overflow-y-auto p-4">
      <CardComponent title="Sentence Analysis" loading={sentenceAnalysis.length === 0}>
        <div className="flex flex-row flex-wrap gap-4 gap-y-1">
          {sentenceAnalysis.map((analysis, index) => (
            <div key={index}>{analysis}</div>
          ))}
        </div>
      </CardComponent>
      <CardComponent title="Sentence Rewrite" loading={sentenceRewrite.length === 0} className="mt-4 min-h-[100px]">
        <div>{sentenceRewrite}</div>
      </CardComponent>
      <CardComponent title="Key Word Analysis" loading={wordAnalysis.length === 0} className="mt-4 min-h-[100px]">
        {wordAnalysis.map((analysis, index) => (
          handleWordAnalysis(analysis, index)
        ))}
      </CardComponent>
    </div>
  )
}
