import { Row, Col } from 'antd';
import { BookPreview, Resource } from '@/types/book';
import BookUploader from '@/components/BookUploader';
import { useStyleStore } from '@/store/useStyleStore';
import { useRouter } from 'next/navigation';
import { useSiderStore } from '@/store/useSiderStore';

interface BookGridProps {
  books: BookPreview[];
}

export default function BookGrid({ books }: BookGridProps) {
  const { itemsPerRow, gutterX, gutterY } = useStyleStore()
  const router = useRouter();
  const { setReadingId } = useSiderStore()

  const onBookClick = (id: string) => {
    setReadingId(id)
    router.push(`/read`);
  }

  return (
    <div className="w-full">
      <Row gutter={[gutterX, gutterY]}>
        {books.map((book) => (
          <Col key={book.id} span={24 / itemsPerRow}>
            <div className="cursor-pointer" onClick={() => onBookClick(book.id)}>
              <div className="aspect-[3/4] w-full overflow-hidden">
                <BookCover cover={book.cover} title={book.title} />
              </div>
              <div className="mt-2 text-center">
                <div className="font-medium truncate">{book.title}</div>
                {book.author && (
                  <div className="text-sm text-gray-500 truncate">{book.author}</div>
                )}
              </div>
            </div>
          </Col>
        ))}
        <Col span={24 / itemsPerRow}>
          <div className="aspect-[3/4] w-full">
            <BookUploader />
          </div>
        </Col>
      </Row>
    </div>
  );
}

// function handleBase64(base64: string) {
//   return `data:image/jpeg;base64,${base64}`
// }

const BookCover = ({ cover, title }: { cover: Resource | undefined, title: string }) => {
  console.log(title)
  // eslint-disable-next-line
  const imageCSS = `
    w-full
    h-full
    object-cover
    rounded-lg
  `
  const noCoverCSS = `
    w-full
    h-full
    flex
    items-center
    justify-center
    border
    border-[var(--ant-color-border)]
    rounded-lg
    bg-[var(--ant-color-bg-elevated)]
    dark:bg-[var(--ant-color-bg-elevated)]
  `
  return (
    cover ? (
      // TODO: 暂时不放封面
      // // eslint-disable-next-line @next/next/no-img-element
      // <img className={imageCSS} src={handleBase64(cover.data)} alt={title} />
      <div className={noCoverCSS}>
        No Cover
      </div>
    ) : (
      <div className={noCoverCSS}>
        No Cover
      </div>
    )
  )
}
