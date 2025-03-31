'use client';

import db from '@/services/DB';
import { useLiveQuery } from 'dexie-react-hooks';
import BookGrid from '@/app/components/BookGrid';

export default function Home() {
  const bookPreviews = useLiveQuery(() => db.getAllBooksPreview(), []) || []

  return (
    <div className='p-2 w-full h-full'>
      <BookGrid books={bookPreviews} />
    </div>
  );
}