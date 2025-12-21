'use client';

import db from '@/services/DB';
import BookGrid from '@/app/components/BookGrid';
import BookList from '@/app/components/BookList';
import { useRSSStore } from '@/store/useRSSStore';
import { fetchRSS } from '@/services/RSS';
import { App, Button, Dropdown, Popconfirm } from 'antd';
import { AppstoreOutlined, ReloadOutlined, AlignLeftOutlined, UnorderedListOutlined } from '@ant-design/icons';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useTranslation } from '@/i18n/useTranslation';
import { DB_CHANGED_EVENT } from '@/services/DB'
import type { Book, BookPreview } from '@/types/book'


export default function Home() {
  const { message } = App.useApp();
  const { t } = useTranslation();
  const [bookPreviews, setBookPreviews] = useState<BookPreview[]>([])
  const [books, setBooks] = useState<Book[]>([])
  const { rssUrlsText } = useRSSStore();
  const [loading, setLoading] = useState(false);

  const [viewMode, setViewMode] = useState<'grid' | 'list'>('list');
  const [sortMode, setSortMode] = useState<'recentOpen' | 'uploadTime'>('uploadTime');

  const [batchMode, setBatchMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  const rssUrls = Array.from(
    new Set(
      rssUrlsText
        .split(/\r?\n/)
        .map((line) => line.trim())
        .filter(Boolean)
    )
  );

  const loadBooks = useCallback(async () => {
    try {
      const [previews, full] = await Promise.all([
        db.getAllBooksPreview(),
        db.getAllBooks(),
      ])
      setBookPreviews(previews)
      setBooks(full)
    } catch (e) {
      console.error(e)
      message.error(t('common.templates.loadFailed', { entity: t('common.entities.bookGeneric') }))
    }
  }, [message, t])

  useEffect(() => {
    void loadBooks()
  }, [loadBooks])

  useEffect(() => {
    const handler = () => void loadBooks()
    window.addEventListener(DB_CHANGED_EVENT, handler)
    return () => window.removeEventListener(DB_CHANGED_EVENT, handler)
  }, [loadBooks])

  const handleRefresh = async () => {
    if (rssUrls.length === 0) return;
    setLoading(true);
    try {
      let addedCount = 0;
      let failedCount = 0;

      for (const url of rssUrls) {
        try {
          const books = await fetchRSS(url);
          for (const book of books) {
            try {
              await db.addBook(book);
              addedCount++;
            } catch {
              // Ignore duplicates
            }
          }
        } catch {
          failedCount++;
        }
      }

      if (addedCount > 0) {
        message.success(`Added ${addedCount} new articles`);
      } else {
        message.info('No new articles found');
      }

      if (failedCount > 0) {
        message.warning(`Failed to fetch ${failedCount} feed(s)`);
      }

      await loadBooks()
    } catch (error) {
      console.error(error);
      message.error('Failed to fetch RSS');
    } finally {
      setLoading(false);
    }
  };

  const toggleSelect = (bookId: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(bookId)) next.delete(bookId);
      else next.add(bookId);
      return next;
    });
  };

  const enterBatchMode = () => {
    setBatchMode(true);
    setSelectedIds(new Set());
  };

  const exitBatchMode = () => {
    setBatchMode(false);
    setSelectedIds(new Set());
  };

  const handleBatchDelete = async () => {
    if (selectedIds.size === 0) return;
    const ids = Array.from(selectedIds);
    try {
      for (const id of ids) {
        await db.deleteBook(id);
      }
      message.success(t('common.templates.deleteSuccess', { entity: t('common.entities.bookGeneric') }));
      exitBatchMode();
      await loadBooks()
    } catch (e) {
      console.error(e);
      message.error(t('common.templates.deleteFailed', { entity: t('common.entities.bookGeneric') }));
    }
  };

  const sortedBookPreviews = useMemo(() => {
    if (sortMode === 'recentOpen') return bookPreviews;
    return [...bookPreviews].sort((a, b) => {
      const timeA = a.uploadTime ?? a.createTime ?? 0;
      const timeB = b.uploadTime ?? b.createTime ?? 0;
      return timeB - timeA;
    });
  }, [bookPreviews, sortMode]);

  const sortedBooks = useMemo(() => {
    if (sortMode === 'recentOpen') return books;
    return [...books].sort((a, b) => {
      const timeA = a.uploadTime ?? a.createTime ?? 0;
      const timeB = b.uploadTime ?? b.createTime ?? 0;
      return timeB - timeA;
    });
  }, [books, sortMode]);

  return (
    <div className='p-2 w-full h-full relative'>
      <div className="flex justify-end gap-2 mb-2">
        <Dropdown
          trigger={['click']}
          menu={{
            selectable: true,
            selectedKeys: [sortMode],
            items: [
              { key: 'sortTitle', label: t('home.sort'), disabled: true },
              { type: 'divider' },
              { key: 'recentOpen', label: t('home.sortRecentOpen') },
              { key: 'uploadTime', label: t('home.sortUploadTime') },
            ],
            onClick: ({ key }) => setSortMode(key as 'recentOpen' | 'uploadTime'),
          }}
        >
          <Button
            icon={<AlignLeftOutlined />}
            aria-label={t('home.sort')}
            title={`${t('home.sort')}: ${sortMode === 'recentOpen' ? t('home.sortRecentOpen') : t('home.sortUploadTime')}`}
          />
        </Dropdown>

        <Button
          icon={viewMode === 'grid' ? <UnorderedListOutlined /> : <AppstoreOutlined />}
          aria-label={viewMode === 'grid' ? t('home.switchToListLayout') : t('home.switchToGridLayout')}
          title={viewMode === 'grid' ? t('home.switchToListLayout') : t('home.switchToGridLayout')}
          onClick={() => setViewMode((prev) => (prev === 'grid' ? 'list' : 'grid'))}
        />

        {!batchMode ? (
          <Button onClick={enterBatchMode}>{t('home.batchActions')}</Button>
        ) : (
          <>
            <Popconfirm
              title={t('common.templates.confirmDeleteWithUndoWarning', { entity: t('common.entities.bookAsObject') })}
              onConfirm={handleBatchDelete}
              okText={t('common.ok')}
              cancelText={t('common.cancel')}
              placement="bottomRight"
              disabled={selectedIds.size === 0}
            >
              <Button danger disabled={selectedIds.size === 0}>{t('common.delete')} ({selectedIds.size})</Button>
            </Popconfirm>
            <Button onClick={exitBatchMode}>{t('home.cancel')}</Button>
          </>
        )}
      </div>

      {rssUrls.length > 0 && (
        <div className="fixed bottom-8 right-8 z-50">
           <Button 
             icon={<ReloadOutlined />} 
             loading={loading} 
             onClick={handleRefresh}
             type="primary"
             shape="circle"
             size="large"
           />
        </div>
      )}
      {viewMode === 'grid' ? (
        <BookGrid
          books={sortedBookPreviews}
          selectionMode={batchMode}
          selectedIds={selectedIds}
          onToggleSelect={toggleSelect}
        />
      ) : (
        <BookList
          books={sortedBooks}
          selectionMode={batchMode}
          selectedIds={selectedIds}
          onToggleSelect={toggleSelect}
        />
      )}
    </div>
  );
}