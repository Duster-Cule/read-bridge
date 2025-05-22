import { Menu } from "antd";
import { Card } from "../index";
import useTranslation from "@/i18n/useTranslation";
import { useCallback, useState } from "react";
import { useTTSStore } from "@/store/useTTSStore";
export default function TTSSection() {
  const { t } = useTranslation()
  const { ttsProvider, setTTSProvider } = useTTSStore()
  const [selectedProviderId, setSelectedProviderId] = useState<string>(ttsProvider)
  const menuItems = [
    {
      key: 'system',
      label: t('settings.systemTTS'),
    },
    {
      key: 'volcengine',
      label: t('settings.volcengineTTS'),
    },
  ]
  const handleMenuSelect = useCallback(({ key }: { key: string }) => {
    setSelectedProviderId(key)
    setTTSProvider(key)
  }, [])
  return <Card className='h-[50vh] flex justify-between overflow-hidden'>
    <div className='w-[20%] h-full flex flex-col overflow-y-auto'>
      <Menu
        mode="vertical"
        selectedKeys={[selectedProviderId]}
        className="w-full h-full"
        items={menuItems}
        onClick={handleMenuSelect}
      />
    </div>

    <div className="p-4 flex-1 overflow-y-auto">

    </div>
  </Card>
}

