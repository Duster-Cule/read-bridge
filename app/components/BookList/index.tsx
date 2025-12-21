'use client';

import { Book, Resource } from '@/types/book';
import { App, Button, Checkbox, List, Typography } from 'antd';
import { InfoCircleOutlined } from '@ant-design/icons';
import { useRouter } from 'next/navigation';
import { useSiderStore } from '@/store/useSiderStore';
import { useState } from 'react';
import BookUploader from '@/app/components/BookUploader';
import BookDetailsModal from '@/app/components/BookDetailsModal';
import { useTranslation } from '@/i18n/useTranslation';

const { Text } = Typography;

interface BookListProps {
  books: Book[];
  selectionMode?: boolean;
  selectedIds?: Set<string>;
  onToggleSelect?: (bookId: string) => void;
}

export default function BookList({ books, selectionMode = false, selectedIds, onToggleSelect }: BookListProps) {
  const { message } = App.useApp();
  const { t } = useTranslation();
  const router = useRouter();
  const { setReadingId } = useSiderStore();

  const [detailsModalOpen, setDetailsModalOpen] = useState(false);
  const [selectedBookId, setSelectedBookId] = useState<string>('');

  const onBookClick = (id: string) => {
    if (selectionMode) {
      onToggleSelect?.(id);
      return;
    }
    setReadingId(id);
    router.push('/read');
  };

  const showDetailsModal = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!id) {
      message.error(t('common.templates.loadFailed', { entity: t('common.entities.bookDetails') }));
      return;
    }
    setSelectedBookId(id);
    setDetailsModalOpen(true);
  };

  const closeDetailsModal = () => {
    setDetailsModalOpen(false);
  };

  return (
    <div className="w-full">
      <List
        itemLayout="horizontal"
        dataSource={books}
        split
        renderItem={(book) => {
          const uploadTime = book.uploadTime ?? book.createTime;
          const uploadTimeText = uploadTime ? new Date(uploadTime).toLocaleString() : '-';
          return (
            <List.Item
              key={book.id}
              className={selectionMode ? 'cursor-pointer select-none' : 'cursor-pointer'}
              onClick={() => onBookClick(book.id)}
              actions={[
                <Button
                  key="details"
                  type="text"
                  size="small"
                  icon={<InfoCircleOutlined />}
                  onClick={(e) => showDetailsModal(book.id, e)}
                />,
              ]}
            >
              <List.Item.Meta
                avatar={
                  <div className="flex items-center gap-2">
                    {selectionMode && (
                      <Checkbox
                        checked={selectedIds?.has(book.id) ?? false}
                        onClick={(e) => e.stopPropagation()}
                        onChange={() => onToggleSelect?.(book.id)}
                      />
                    )}
                    <BookCoverSmall cover={book.metadata?.cover} title={book.title} />
                  </div>
                }
                title={
                  <div className="flex flex-col">
                    <span className="font-medium">{book.title}</span>
                    {book.author && <Text type="secondary">{t('bookDetails.author')}: {book.author}</Text>}
                  </div>
                }
                description={
                  <div className="flex flex-col gap-1">
                    {book.metadata?.language && <Text type="secondary">{t('bookDetails.language')}: {book.metadata.language}</Text>}
                    {book.metadata?.publisher && <Text type="secondary">{t('bookDetails.publisher')}: {book.metadata.publisher}</Text>}
                    <Text type="secondary">{t('bookDetails.added')}: {uploadTimeText}</Text>
                  </div>
                }
              />
            </List.Item>
          );
        }}
      />

      <div className="mt-3">
        <div className="w-full h-[120px]">
          <BookUploader />
        </div>
      </div>

      <BookDetailsModal open={detailsModalOpen} onClose={closeDetailsModal} bookId={selectedBookId} />
    </div>
  );
}

function handleBase64(base64: string) {
  return `data:image/jpeg;base64,${base64}`;
}

function BookCoverSmall({ cover, title }: { cover: Resource | undefined; title: string }) {
  const containerCSS = `
    w-[48px]
    h-[64px]
    overflow-hidden
    rounded
    border
    border-[var(--ant-color-border)]
    bg-[var(--ant-color-bg-elevated)]
    dark:bg-[var(--ant-color-bg-elevated)]
    flex
    items-center
    justify-center
  `;

  if (!cover) {
    return <div className={containerCSS}><span className="text-[10px] text-[var(--ant-color-text-tertiary)]">No Cover</span></div>;
  }

  // eslint-disable-next-line @next/next/no-img-element
  return <img className="w-full h-full object-cover" src={handleBase64(cover.data)} alt={title} />;
}
