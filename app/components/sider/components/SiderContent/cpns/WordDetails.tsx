import MarkdownViewer from '@/app/components/common/MarkdownViewer'

export default function WordDetails({ wordDetails }: { wordDetails: string }) {
  return <MarkdownViewer content={wordDetails} minHeight={578} className="h-[578px] overflow-y-auto" />
}

WordDetails.displayName = 'WordDetails';