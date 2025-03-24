import { useEffect, useState } from 'react';
import { Menu, Typography, theme, Button } from 'antd';
import { Provider } from '@/src/types/llm';
import { useLLMStore } from '@/src/store/useLLMStore';



export default function AiSection() {
  const { providers: defaultProviders, addProvider } = useLLMStore()
  const [providers, setProviders] = useState<Provider[]>([])
  const [selectedProviderId, setSelectedProviderId] = useState<string>('');
  const [selectedProvider, setSelectedProvider] = useState<Provider | null>(null);
  const { token } = theme.useToken();
  useEffect(() => {
    setProviders([...defaultProviders])
    setSelectedProviderId(defaultProviders[0].id)
    setSelectedProvider(defaultProviders[0])
  }, [defaultProviders])


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
    setSelectedProviderId(key);
    setSelectedProvider(providers.find(p => p.id === key) || null)
  };


  return (
    <div className="h-[50vh] flex justify-between border rounded-lg overflow-hidden" style={{ borderColor: token.colorBorder }}>

      <div className='w-[20%] flex flex-col overflow-y-auto'>
        <Menu
          mode="inline"
          selectedKeys={[selectedProviderId]}
          className="w-full"
          items={menuItems}
          onClick={handleMenuSelect}
        />
        <Button className='h-[10%] mb-2' type="text" onClick={addProvider}>+</Button>
      </div>

      <div className="p-4 flex-1">
        <Typography.Text>Selected: {selectedProvider?.name}</Typography.Text>
      </div>
    </div>
  );
}

