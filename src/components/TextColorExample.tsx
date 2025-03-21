'use client';

import { Typography } from 'antd';

const { Title, Paragraph } = Typography;

export default function TextColorExample() {
  return (
    <div className="p-4">
      <Title className="text-primary-color">
        This title uses the custom text color
      </Title>
      <Paragraph className="text-primary-color">
        This paragraph also uses the custom text color, which changes based on the selected color in the footer.
        You can switch between light and dark mode, and each mode will remember its own custom text color.
      </Paragraph>
      <div className="mt-4">
        <p style={{ color: 'var(--primary-text-color)' }}>
          You can also use the CSS variable directly in inline styles: <code>color: var(--primary-text-color)</code>
        </p>
      </div>
    </div>
  );
} 