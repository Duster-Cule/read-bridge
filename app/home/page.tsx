'use client';

import db from '@/services/DB';
import { useLiveQuery } from 'dexie-react-hooks';
import BookGrid from '@/app/components/BookGrid';
import { useEffect } from 'react';

export default function Home() {
  const bookPreviews = useLiveQuery(() => db.getAllBooksPreview(), []) || []
  useEffect(() => {
    // 检查Chrome版本
    const detectChromeVersion = () => {
      const userAgent = navigator.userAgent;
      const chromeRegex = /Chrome\/([0-9.]+)/;
      const match = userAgent.match(chromeRegex);

      if (match && match[1]) {
        console.log('chrome version', match[1])
      } else {
        console.log('not chrome')
      }
    };

    detectChromeVersion();
  }, []);
  return (
    <div className='p-2 w-full h-full'>
      <BookGrid books={bookPreviews} />
    </div>
  );
}