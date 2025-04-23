import React, { useState } from 'react';
import { Typography, Button } from 'antd';

const { Paragraph } = Typography;

interface ExpandableDescriptionProps {
  text: string;
  maxLength?: number;
}

const ExpandableDescription: React.FC<ExpandableDescriptionProps> = ({ text, maxLength = 100 }) => {
  const [expanded, setExpanded] = useState(false);

  const isTruncated = text.length > maxLength;

  const toggleExpanded = () => {
    setExpanded(!expanded);
  };

  return (
    <div>
      <Paragraph ellipsis={isTruncated && !expanded ? { rows: 1, expandable: false, symbol: '' } : false}>
        {text}
      </Paragraph>
      {isTruncated && (
        <Button type="link" onClick={toggleExpanded} style={{ padding: 0 }}>
          {expanded ? 'Collapse' : 'More'}
        </Button>
      )}
    </div>
  );
};

export default ExpandableDescription; 