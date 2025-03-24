import { useEffect, useState } from 'react';
import { Layout, Menu, Typography, theme, Badge, Button } from 'antd';
import { defaultProviders } from '@/src/config/llm';
import { Provider } from '@/src/types/llm';
import { useLLMStore } from '@/src/store/useLLMStore';

const { Sider } = Layout;

export default function AiSection() {
  const { providers: defaultProviders, customProviders, addCustomProvider } = useLLMStore()
  const [providers, setProviders] = useState<Provider[]>([])
  const [selectedProvider, setSelectedProvider] = useState<string>('');
  const { token } = theme.useToken();
  useEffect(() => {
    setProviders([...defaultProviders, ...customProviders])
    setSelectedProvider(defaultProviders[0].id)
  }, [defaultProviders, customProviders])

  const menuItems = providers.map((provider: Provider) => ({
    key: provider.id,
    label: (
      <div className="flex flex-col justify-center">
        <span className="text-base font-medium">{provider.name}</span>
        <span className="text-sm text-gray-500">{provider.model.length} Models</span>
      </div>
    ),
  }));

  const handleMenuSelect = ({ key }: { key: string }) => {
    setSelectedProvider(key);
  };

  return (
    <div className="h-[50vh] flex justify-between border rounded-lg overflow-hidden" style={{ borderColor: token.colorBorder }}>

      <div className='w-[20%] flex flex-col overflow-y-auto'>
        <Menu
          mode="inline"
          selectedKeys={[selectedProvider]}
          className="w-full"
          items={menuItems}
          onClick={handleMenuSelect}
        />
        <Button className='h-[10%]' type="text" onClick={addCustomProvider}>+</Button>
      </div>

      <div className="p-4 flex-1">
        <Typography.Text>Selected: {selectedProvider}</Typography.Text>
      </div>
    </div>
  );
}

