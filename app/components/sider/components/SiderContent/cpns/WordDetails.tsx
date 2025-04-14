import CardComponent from "@/app/components/common/CardComponent"
import { useMemo } from "react"

export default function WordDetails({ wordDetails }: { wordDetails: string }) {
  const isLoading = useMemo(() => {
    return !wordDetails
  }, [wordDetails])

  return (
    <div className="w-full h-[262px] overflow-y-auto p-4">
      <CardComponent loading={isLoading}>
        <div className="w-full" dangerouslySetInnerHTML={{ __html: wordDetails }} />
      </CardComponent>
    </div>
  )
}

WordDetails.displayName = 'WordDetails';