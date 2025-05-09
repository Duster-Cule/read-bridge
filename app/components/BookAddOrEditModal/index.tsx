import { Book } from "@/types/book";
import { Modal } from "antd";
import { useEffect, useState } from "react";
import { useTranslation } from "@/i18n/useTranslation";

interface BookAddOrEditModalProps {
  open: boolean;
  onCancel: () => void;
  onOk: (book: Book) => void;
  getInitialData: () => Book;
  type: 'add' | 'edit';
}

export default function BookAddOrEditModal({ open, onCancel, onOk, getInitialData, type }: BookAddOrEditModalProps) {
  const { t } = useTranslation();
  const [book, setBook] = useState<Book>();
  useEffect(() => {
    if (!open) return
    const initialData = getInitialData();
    setBook(initialData);
  }, [open, getInitialData, setBook]);
  return <Modal
    className="h-[700px]"
    width={800}
    open={open}
    onCancel={onCancel}
    onOk={() => onOk(book as Book)}
    okText={t('common.ok')}
    cancelText={t('common.cancel')}
  >
    <div className="w-full h-[600px] overflow-y-auto">
      <h1>{type === 'add' ? t('bookDetails.addBook') : t('bookDetails.editBook')}</h1>
      <div>

      </div>
    </div>
  </Modal>;
}

