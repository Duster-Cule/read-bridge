import MarkdownViewer from '@/app/components/common/MarkdownViewer'

export default function WordDetails({ wordDetails }: { wordDetails: string }) {
  return <MarkdownViewer content={wordDetails} />
}

WordDetails.displayName = 'WordDetails';