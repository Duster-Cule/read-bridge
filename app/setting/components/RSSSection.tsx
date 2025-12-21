import React from 'react';
import { Input, Form } from 'antd';
import { useRSSStore } from '@/store/useRSSStore';
import Card from './Card';
import { useTranslation } from '@/i18n/useTranslation';

export default function RSSSection() {
  const { t } = useTranslation();
  const { rssUrlsText, setRssUrlsText } = useRSSStore();

  return (
    <Card>
      <Form layout="vertical">
        <Form.Item label={t('settings.rssUrl')}>
          <Input.TextArea
            value={rssUrlsText}
            onChange={(e) => setRssUrlsText(e.target.value)}
            placeholder={"https://example.com/feed.xml\nhttps://example.com/rss"}
            autoSize={{ minRows: 4, maxRows: 12 }}
          />
        </Form.Item>
      </Form>
    </Card>
  );
}
