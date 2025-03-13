import { Row, Col } from 'antd';
import { BookPreview } from '@/types/book';
import BookUploader from '@/components/BookUploader';
import { useEffect, useState } from 'react';

interface BookGridProps {
  books: BookPreview[];
}

// function handleBase64(base64: string) {
//   return `data:image/jpeg;base64,${base64}`
// }

export default function BookGrid({ books }: BookGridProps) {
  const [itemsPerRow, setItemsPerRow] = useState(12);
  const [gutterX, setGutterX] = useState(16);
  const [gutterY, setGutterY] = useState(16);

  useEffect(() => {
    // make eslint happy
    setItemsPerRow(12)
    setGutterX(16)
    setGutterY(24)
  }, [])

  const onBookClick = (id: string) => {
    console.log(id)
  }

  return (
    <div className="w-full">
      <Row gutter={[gutterX, gutterY]}>
        {books.map((book) => (
          <Col key={book.id} span={24 / itemsPerRow}>
            <div className="cursor-pointer" onClick={() => onBookClick(book.id)}>
              <div className="aspect-[3/4] w-full bg-gray-100 rounded-lg overflow-hidden">
                {book.cover ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  // TODO 先不显示封面
                  // <img
                  //   src={handleBase64(book.cover.data)}
                  //   alt={book.title}
                  //   className="w-full h-full object-cover"
                  // />
                  <div className="w-full h-full flex items-center justify-center text-gray-400">
                    No Cover
                  </div>
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-gray-400">
                    No Cover
                  </div>
                )}
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