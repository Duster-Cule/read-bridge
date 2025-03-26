'use client';

import db from '@/src/services/DB';
import { useLiveQuery } from 'dexie-react-hooks';
import BookGrid from '@/src/components/BookGrid';

export default function Home() {
  const bookPreviews = useLiveQuery(() => db.getAllBooksPreview(), []) || []

  return (
    <div className='p-2 w-full h-full'>
      <BookGrid books={bookPreviews} />
    </div>
  );
}