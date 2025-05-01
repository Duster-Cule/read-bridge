'use client';

import { FC, useState, useEffect } from 'react';
import { Modal, Button, Typography, Divider, Popconfirm, message } from 'antd';
import { DeleteOutlined, InfoCircleOutlined } from '@ant-design/icons';
import { Book, Resource } from '@/types/book';
import db from '@/services/DB';
import { useRouter } from 'next/navigation';

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
          message.error('Failed to load book details');
        })
        .finally(() => {
          setLoading(false);
        });
    }
  }, [open, bookId]);

  // Helper function to handle base64 image data
  const handleBase64 = (cover: Resource) => {
    return `data:image/jpeg;base64,${cover.data}`;
  };

  const handleDelete = async () => {
    if (!bookId) return;

    try {
      setLoading(true);
      await db.deleteBook(bookId);

      message.success('书籍删除成功');
      onClose();
      // Force a refresh of the home page
      router.refresh();
    } catch (error) {
      console.error('Error deleting book:', error);
      message.error('书籍删除失败');
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
              alt={book?.title || 'Book cover'}
              className="w-full h-full object-cover"
            />
          </div>
        </div>
      )}

      <Title level={4}>{book?.title || 'Unknown Title'}</Title>
      {book?.author && <Text type="secondary">Author: {book.author}</Text>}

      <Divider />

      <div className="flex justify-end">
        <Popconfirm
          title="删除书籍"
          description="确定要删除这本书吗？这将无法恢复。"
          onConfirm={handleDelete}
          okText="确定"
          cancelText="取消"
          placement="topRight"
        >
          <Button
            type="primary"
            danger
            icon={<DeleteOutlined />}
            loading={loading}
          >
            删除书籍
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
              alt={book?.title || 'Book cover'}
              className="w-full h-full object-cover"
            />
          </div>
        )}

        <div className="flex-1">
          <Title level={3}>{book?.title || 'Unknown Title'}</Title>
          {book?.author && <Text type="secondary" className="block">Author: {book.author}</Text>}
          {book?.metadata?.language && <Text type="secondary" className="block">Language: {book.metadata.language}</Text>}
          {book?.metadata?.publisher && <Text type="secondary" className="block">Publisher: {book.metadata.publisher}</Text>}
          {book?.createTime && (
            <Text type="secondary" className="block">
              Added: {new Date(book.createTime).toLocaleDateString()}
            </Text>
          )}
        </div>
      </div>

      <Divider />

      {book?.metadata?.description && typeof book.metadata.description === 'string' && (
        <>
          <Title level={5}>Description</Title>
          <Text>{book.metadata.description}</Text>
          <Divider />
        </>
      )}

      <div className="flex justify-end">
        <Popconfirm
          title="Delete Book"
          description="Are you sure you want to delete this book? This cannot be undone."
          onConfirm={handleDelete}
          okText="Yes"
          cancelText="No"
          placement="topRight"
        >
          <Button
            type="primary"
            danger
            icon={<DeleteOutlined />}
            loading={loading}
          >
            Delete Book
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
          <span>书籍详情</span>
        </div>
      }
      open={open}
      onCancel={onClose}
      footer={null}
      width={type === 'detailed' ? 700 : 500}
      destroyOnClose
    >
      {loading ? (
        <div className="flex justify-center py-8">Loading...</div>
      ) : !book ? (
        <div className="text-center py-8">Book not found</div>
      ) : (
        type === 'detailed' ? renderDetailedView() : renderSimpleView()
      )}
    </Modal>
  );
};

export default BookDetailsModal; 