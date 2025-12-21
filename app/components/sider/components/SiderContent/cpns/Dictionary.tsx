import React from 'react';
import { WordDetail } from '@/types/dict';
import { Tag, Typography } from 'antd';

const { Title, Text, Paragraph } = Typography;

interface DictionaryProps {
  data: WordDetail | null;
  loading: boolean;
}

function parseExchange(exchange?: string): Array<{ type: string; value: string }> {
  if (!exchange) return [];
  return exchange
    .split('/')
    .map(part => part.trim())
    .filter(Boolean)
    .map(part => {
      const colonIndex = part.indexOf(':');
      if (colonIndex === -1) return { type: '', value: part };
      return {
        type: part.slice(0, colonIndex).trim(),
        value: part.slice(colonIndex + 1).trim()
      };
    })
    .filter(item => item.value);
}

const EXCHANGE_LABEL_ZH: Record<string, string> = {
  p: '过去式',
  d: '过去分词',
  i: '现在分词',
  3: '第三人称单数',
  r: '比较级',
  t: '最高级',
  s: '复数',
  0: 'Lemma（原型）',
  1: 'Lemma 变换'
};

const Dictionary: React.FC<DictionaryProps> = ({ data, loading }) => {
  if (loading) {
    return <div className="p-4 text-center">Loading...</div>;
  }

  if (!data) {
    return <div className="p-4 text-center text-gray-500">No definition found.</div>;
  }

  const normalizedTranslation = data.translation
    ? data.translation.replace(/\\r\\n|\\n/g, '\n')
    : ''

  const normalizedDefinition = data.definition
    ? data.definition.replace(/\\r\\n|\\n/g, '\n')
    : ''

  const exchangeItems = parseExchange(data.exchange)

  return (
    <div className="p-4 overflow-y-auto h-full">
      <div className="mb-4">
        <Title level={2} className="!mb-0">{data.word}</Title>
        {data.phonetic && <Text type="secondary" className="text-lg">/{data.phonetic}/</Text>}
      </div>

      {data.translation && (
        <div className="mb-4">
          <Paragraph className="text-lg font-medium" style={{ whiteSpace: 'pre-wrap' }}>
            {normalizedTranslation}
          </Paragraph>
        </div>
      )}

      {data.definition && (
        <div className="mb-4">
          <Title level={5}>English Definition</Title>
          <Paragraph style={{ whiteSpace: 'pre-wrap' }}>{normalizedDefinition}</Paragraph>
        </div>
      )}

      <div className="flex flex-wrap gap-2 mb-4">
        {data.pos && <Tag color="blue">{data.pos}</Tag>}
        {data.tag && data.tag.split(' ').map(t => <Tag key={t} color="cyan">{t}</Tag>)}
        {data.collins && <Tag color="gold">Collins: {data.collins}</Tag>}
        {data.oxford === 1 && <Tag color="purple">Oxford</Tag>}
      </div>

      {data.exchange && (
        <div className="mb-2">
          <Title level={5} className="!mb-2">Word Forms</Title>
          <div className="space-y-1">
            {exchangeItems.map((item, idx) => {
              const label = EXCHANGE_LABEL_ZH[item.type] || (item.type ? item.type : '形式')
              return (
                <Paragraph key={`${item.type}-${idx}`} className="!mb-0 text-sm">
                  <Text type="secondary">{label}：</Text>
                  <Text>{item.value}</Text>
                </Paragraph>
              )
            })}
          </div>
        </div>
      )}
    </div>
  );
};

export default Dictionary;
