'use client'

import BookUploader from '@/components/BookUploader';
import db from '@/services/DB';
// import { BookPreview } from '@/types/book';
import { useLiveQuery } from 'dexie-react-hooks';

export default function Home() {
  const bookPreviews = useLiveQuery(() => db.getAllBooksPreview(), []) || []
  console.log(bookPreviews)
  return (
    <div className='p-2 w-full h-full'>
      <BookUploader />

    </div>
  );
}