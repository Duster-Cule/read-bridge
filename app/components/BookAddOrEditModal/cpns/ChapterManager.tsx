import { useState, memo, useCallback, useMemo } from 'react';
import { Button, Typography, Empty, Popconfirm, Input } from 'antd';
import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd';
import { PlusOutlined, MenuOutlined, DeleteOutlined, CheckOutlined, CloseOutlined } from '@ant-design/icons';
import { Book, PlainTextChapter } from '@/types/book';
import { useTranslation } from '@/i18n/useTranslation';
import TextArea from 'antd/es/input/TextArea';

const { Text, Title } = Typography;

interface TocItem {
  title: string;
  index: number;
}

interface ChapterManagerProps {
  book: Book;
  onChange: (updatedBook: Book) => void;
}

const ChapterItem = memo(({
  item,
  index,
  isSelected,
  onClick
}: {
  item: TocItem;
  index: number;
  isSelected: boolean;
  onClick: () => void
}) => {
  return (
    <Draggable
      key={`chapter-${item.index}-${index}`}
      draggableId={`chapter-${item.index}-${index}`}
      index={index}
    >
      {(provided) => (
        <div
          ref={provided.innerRef}
          {...provided.draggableProps}
          className={`p-2 mb-1 rounded cursor-pointer ${isSelected ? 'bg-[var(--ant-color-bg-text-hover)]' : ''}`}
          style={{
            ...provided.draggableProps.style
          }}
          onClick={onClick}
        >
          <div className="flex items-center">
            <div {...provided.dragHandleProps} className="mr-2">
              <MenuOutlined className="text-gray-400" />
            </div>
            <Text ellipsis>{item.title}</Text>
          </div>
        </div>
      )}
    </Draggable>
  );
});

ChapterItem.displayName = 'ChapterItem';

export default function ChapterManager({ book, onChange }: ChapterManagerProps) {
  const { t } = useTranslation();
  const [selectedChapterIndex, setSelectedChapterIndex] = useState<number>(0);
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [editingTitle, setEditingTitle] = useState('');
  // Handle drag end to reorder chapters
  const handleDragEnd = async (result: DropResult) => {
    if (!result.destination) return;

    const sourceIndex = result.source.index;
    const destinationIndex = result.destination.index;

    if (sourceIndex === destinationIndex) return;

    // Create copies to avoid direct state mutation
    const newToc = [...book.toc];
    const newChapterList = [...book.chapterList];

    // Get the moving item
    const [movedTocItem] = newToc.splice(sourceIndex, 1);
    const [movedChapter] = newChapterList.splice(movedTocItem.index, 1);

    // Insert at new position
    newToc.splice(destinationIndex, 0, movedTocItem);

    // Recalculate indices for toc items
    const recalculatedToc = newToc.map((item, index) => ({
      ...item,
      index: index
    }));

    // Reorder chapter list to match toc
    const reorderedChapterList = recalculatedToc.map(tocItem => {
      if (tocItem.title === movedTocItem.title) {
        return movedChapter;
      }

      const originalChapter = book.chapterList.find((_, i) =>
        book.toc.find(t => t.index === i)?.title === tocItem.title
      );

      return originalChapter || { title: tocItem.title, paragraphs: [] };
    });

    const updatedBook = {
      ...book,
      toc: recalculatedToc,
      chapterList: reorderedChapterList
    };
    onChange(updatedBook);
    if (selectedChapterIndex === movedTocItem.index) {
      setSelectedChapterIndex(destinationIndex);
    }
  };

  const handleAddChapter = useCallback(() => {
    const newChapterIndex = book.chapterList.length;
    const newChapterTitle = `${t('book.chapter')} ${newChapterIndex + 1}`;

    const newChapter: PlainTextChapter = {
      title: newChapterTitle,
      paragraphs: []
    };

    const newTocItem: TocItem = {
      title: newChapterTitle,
      index: newChapterIndex
    };

    const updatedBook = {
      ...book,
      chapterList: [...book.chapterList, newChapter],
      toc: [...book.toc, newTocItem]
    };

    onChange(updatedBook);
    setSelectedChapterIndex(newChapterIndex);
  }, [book, onChange, t]);

  const handleDeleteChapter = useCallback(() => {
    const newChapterList = [...book.chapterList];
    newChapterList.splice(selectedChapterIndex, 1);

    const tocItemToDelete = book.toc.find(item => item.index === selectedChapterIndex);
    if (!tocItemToDelete) return;

    const newToc = book.toc.filter(item => item.index !== selectedChapterIndex);

    // 重新计算索引
    const recalculatedToc = newToc.map((item, idx) => ({
      ...item,
      index: idx
    }));

    setSelectedChapterIndex(0);
    onChange({ ...book, chapterList: newChapterList, toc: recalculatedToc });
  }, [book, onChange, selectedChapterIndex]);

  const handleEditChapterTitle = useCallback((title: string) => {
    const newChapterList = [...book.chapterList];
    newChapterList[selectedChapterIndex].title = title;

    // 更新toc中对应章节的标题
    const newToc = [...book.toc];
    const tocIndex = newToc.findIndex(item => item.index === selectedChapterIndex);
    if (tocIndex !== -1) {
      newToc[tocIndex].title = title;
    }

    onChange({ ...book, chapterList: newChapterList, toc: newToc });
  }, [book, onChange, selectedChapterIndex]);

  const startEditingTitle = useCallback(() => {
    setEditingTitle(book.chapterList[selectedChapterIndex].title);
    setIsEditingTitle(true);
  }, [book, selectedChapterIndex]);

  const confirmEditTitle = useCallback(() => {
    handleEditChapterTitle(editingTitle);
    setIsEditingTitle(false);
  }, [editingTitle, handleEditChapterTitle]);

  const cancelEditTitle = useCallback(() => {
    setIsEditingTitle(false);
  }, [setIsEditingTitle]);

  const selectedChapterText = useMemo(() => {
    if (!book || !book.chapterList[selectedChapterIndex]) return '';
    return book.chapterList[selectedChapterIndex].paragraphs.join('\n');
  }, [book, selectedChapterIndex]);

  const handleEditChapterText = useCallback(async (text: string) => {
    const newChapterList = [...book.chapterList];
    newChapterList[selectedChapterIndex].paragraphs = text.split('\n');
    onChange({ ...book, chapterList: newChapterList });
  }, [book, onChange, selectedChapterIndex]);

  if (!book) return null;
  return (
    <div className="flex h-[580px]">
      {/* 左侧：章节列表 */}
      <div className="w-1/3 pr-4">
        <div className="flex flex-col h-full">
          <Title level={5} className="mb-3">{t('book.chapterList')}</Title>
          <DragDropContext onDragEnd={handleDragEnd}>
            <Droppable droppableId="chapter-list">
              {(provided) => (
                <div
                  ref={provided.innerRef}
                  {...provided.droppableProps}
                  className="overflow-y-auto h-[528px]"
                >
                  {book.toc.map((item, index) => (
                    <ChapterItem
                      key={`chapter-item-${item.index}-${index}`}
                      item={item}
                      index={index}
                      isSelected={selectedChapterIndex === item.index}
                      onClick={() => setSelectedChapterIndex(item.index)}
                    />
                  ))}
                  {provided.placeholder}
                </div>
              )}
            </Droppable>
          </DragDropContext>

          <div className="mt-3 mb-2">
            <Button
              type="dashed"
              icon={<PlusOutlined />}
              block
              onClick={handleAddChapter}
            >
              {t('book.addChapter')}
            </Button>
          </div>
        </div>
      </div>

      {/* 右侧：章节展示 */}
      <div className="w-2/3 pl-4">
        {selectedChapterIndex !== null && book.chapterList[selectedChapterIndex] ? (
          <div>
            <div className="flex justify-between items-center mb-2">
              {isEditingTitle ? (
                <div className="flex items-center flex-1 mr-2">
                  <Input
                    value={editingTitle}
                    onChange={(e) => setEditingTitle(e.target.value)}
                    autoFocus
                  />
                  <Button
                    type="text"
                    icon={<CheckOutlined />}
                    onClick={confirmEditTitle}
                    className="ml-1"
                  />
                  <Button
                    type="text"
                    icon={<CloseOutlined />}
                    onClick={cancelEditTitle}
                    className="ml-1"
                  />
                </div>
              ) : (
                <Title level={5} onClick={startEditingTitle} className="cursor-pointer">
                  {book.chapterList[selectedChapterIndex].title}
                </Title>
              )}
              {!isEditingTitle && <Popconfirm
                title={t('book.deleteChapter')}
                description={t('common.templates.confirmDeleteWithUndoWarning', { entity: t('book.chapter') })}
                onConfirm={handleDeleteChapter}
                okText={t('common.ok')}
                cancelText={t('common.cancel')}
                placement="topRight"
              >
                <Button type="text" danger icon={<DeleteOutlined />} />
              </Popconfirm>}
            </div>
            <div className=" h-[534px]">
              <TextArea
                value={selectedChapterText}
                onChange={(e) => handleEditChapterText(e.target.value)}
                className="block mb-3"
                autoSize={{ minRows: 23, maxRows: 23 }}
              />
            </div>
          </div>
        ) : (
          <Empty description={t('book.noChapterSelected')} />
        )}
      </div>
    </div>
  );
} 