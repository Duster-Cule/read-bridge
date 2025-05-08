'use client';

import { FC, useState, useEffect } from 'react';
import { Modal, Button, Typography, Divider, Popconfirm, message } from 'antd';
import { DeleteOutlined, InfoCircleOutlined } from '@ant-design/icons';
import { Book, Resource } from '@/types/book';
import db from '@/services/DB';
import { useRouter } from 'next/navigation';
import { useTranslation } from '@/i18n/useTranslation';

const { Title, Text } = Typography;

interface BookDetailsModalProps {
  open: boolean;
  onClose: () => void;
  bookId: string;
  type?: 'simple' | 'detailed';
}

const BookDetailsModal: FC<BookDetailsModalProps> = ({
  open,
  onClose,
  bookId,
  type = 'simple'
}) => {
  const [book, setBook] = useState<Book | null>(null);
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const { t } = useTranslation();

  // Fetch book details when modal opens
  useEffect(() => {
    if (open && bookId) {
      setLoading(true);
      db.getBook(bookId)
        .then((fetchedBook) => {
          setBook(fetchedBook);
        })
        .catch((error) => {
          console.error('Error fetching book:', error);
          message.error(t('common.templates.loadFailed', { entity: t('common.entities.bookDetails') }));
        })
        .finally(() => {
          setLoading(false);
        });
    }
  }, [open, bookId, t]);

  // Helper function to handle base64 image data
  const handleBase64 = (cover: Resource) => {
    return `data:image/jpeg;base64,${cover.data}`;
  };

  const handleDelete = async () => {
    if (!bookId) return;

    try {
      setLoading(true);
      await db.deleteBook(bookId);

      message.success(t('common.templates.deleteSuccess', { entity: t('common.entities.bookGeneric') }));
      onClose();
      // Force a refresh of the home page
      router.refresh();
    } catch (error) {
      console.error('Error deleting book:', error);
      message.error(t('common.templates.deleteFailed', { entity: t('common.entities.bookGeneric') }));
    } finally {
      setLoading(false);
    }
  };

  const renderSimpleView = () => (
    <div className="space-y-4">
      {book?.metadata?.cover && (
        <div className="flex justify-center">
          <div className="w-1/3 aspect-[3/4] overflow-hidden rounded-lg">
            <img
              src={handleBase64(book.metadata.cover)}
              alt={book?.title || t('bookDetails.unknownTitle')}
              className="w-full h-full object-cover"
            />
          </div>
        </div>
      )}

      <Title level={4}>{book?.title || t('bookDetails.unknownTitle')}</Title>
      {book?.author && <Text type="secondary">{t('bookDetails.author')}: {book.author}</Text>}

      <Divider />

      <div className="flex justify-end">
        <Popconfirm
          title={t('bookDetails.deleteBook')}
          description={t('common.templates.confirmDeleteWithUndoWarning', { entity: t('common.entities.bookAsObject') })}
          onConfirm={handleDelete}
          okText={t('common.ok')}
          cancelText={t('common.cancel')}
          placement="topRight"
        >
          <Button
            type="primary"
            danger
            icon={<DeleteOutlined />}
            loading={loading}
          >
            {t('bookDetails.deleteBook')}
          </Button>
        </Popconfirm>
      </div>
    </div>
  );

  const renderDetailedView = () => (
    <div className="space-y-4">
      <div className="flex gap-4">
        {book?.metadata?.cover && (
          <div className="w-1/4 aspect-[3/4] overflow-hidden rounded-lg">
            <img
              src={handleBase64(book.metadata.cover)}
              alt={book?.title || t('bookDetails.unknownTitle')}
              className="w-full h-full object-cover"
            />
          </div>
        )}

        <div className="flex-1">
          <Title level={3}>{book?.title || t('bookDetails.unknownTitle')}</Title>
          {book?.author && <Text type="secondary" className="block">{t('bookDetails.author')}: {book.author}</Text>}
          {book?.metadata?.language && <Text type="secondary" className="block">{t('bookDetails.language')}: {book.metadata.language}</Text>}
          {book?.metadata?.publisher && <Text type="secondary" className="block">{t('bookDetails.publisher')}: {book.metadata.publisher}</Text>}
          {book?.createTime && (
            <Text type="secondary" className="block">
              {t('bookDetails.added')}: {new Date(book.createTime).toLocaleDateString()}
            </Text>
          )}
        </div>
      </div>

      <Divider />

      {book?.metadata?.description && typeof book.metadata.description === 'string' && (
        <>
          <Title level={5}>{t('bookDetails.description')}</Title>
          <Text>{book.metadata.description}</Text>
          <Divider />
        </>
      )}

      <div className="flex justify-end">
        <Popconfirm
          title={t('bookDetails.deleteBook')}
          description={t('common.templates.confirmDeleteWithUndoWarning', { entity: t('common.entities.bookAsObject') })}
          onConfirm={handleDelete}
          okText={t('common.ok')}
          cancelText={t('common.cancel')}
          placement="topRight"
        >
          <Button
            type="primary"
            danger
            icon={<DeleteOutlined />}
            loading={loading}
          >
            {t('bookDetails.deleteBook')}
          </Button>
        </Popconfirm>
      </div>
    </div>
  );

  return (
    <Modal
      title={
        <div className="flex items-center gap-2">
          <InfoCircleOutlined />
          <span>{t('bookDetails.title')}</span>
        </div>
      }
      open={open}
      onCancel={onClose}
      footer={null}
      width={type === 'detailed' ? 700 : 500}
      destroyOnClose
    >
      {loading ? (
        <div className="flex justify-center py-8">{t('bookDetails.loading')}</div>
      ) : !book ? (
        <div className="text-center py-8">{t('bookDetails.notFound')}</div>
      ) : (
        type === 'detailed' ? renderDetailedView() : renderSimpleView()
      )}
    </Modal>
  );
};

export default BookDetailsModal; 