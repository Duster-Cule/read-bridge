import { Menu, Switch } from "antd";
import { Card } from "../index";
import useTranslation from "@/i18n/useTranslation";
import { useCallback, useMemo, useState } from "react";
import { useTTSStore } from "@/store/useTTSStore";
import { getSystemTTS, getVolcengineTTS } from "@/services/tts";
import { TTSForm } from "./cpns";

export default function TTSSection() {
  const { t } = useTranslation()
  const {
    ttsProvider,
    setTTSProvider,
    ttsConfig,
    setTTSConfig,
    ttsGlobalConfig,
    setTTSGlobalConfig
  } = useTTSStore()
  const [selectedProviderId, setSelectedProviderId] = useState<string>(ttsProvider)

  const systemTTS = useMemo(() => getSystemTTS(), [])
  const volcengineTTS = useMemo(() => getVolcengineTTS(ttsConfig.volcengine.token, ttsConfig.volcengine.appid), [ttsConfig.volcengine.token, ttsConfig.volcengine.appid])
  const menuItems = [
    {
      key: 'system',
      label: t('settings.systemTTS'),
    },
    // {
    //   key: 'volcengine',
    //   label: t('settings.volcengineTTS'),
    // },
  ]

  const handleMenuSelect = useCallback(({ key }: { key: string }) => {
    setSelectedProviderId(key)
    setTTSProvider(key)
  }, [setTTSProvider])

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
      {selectedProviderId === 'system' && (
        <TTSForm
          ttsConfig={ttsConfig.system}
          providerId="system"
          setTTSConfig={setTTSConfig}
          TTS={systemTTS}
        />
      )}
      {selectedProviderId === 'volcengine' && (
        <TTSForm
          ttsConfig={ttsConfig.volcengine}
          providerId="volcengine"
          setTTSConfig={setTTSConfig}
          TTS={volcengineTTS}
        />
      )}
    </div>
    <div className="w-[25%] flex flex-col overflow-y-auto border-l border-[var(--ant-color-border)]">
      <div className="p-4">
        <h3 className="mb-4 font-medium">{t('settings.globalTTSSettings')}</h3>
        <div className="flex flex-col gap-4">
          <div className="flex justify-between items-center">
            <span>{t('settings.autoSentenceTTS')}</span>
            <Switch
              checked={ttsGlobalConfig.autoSentenceTTS}
              onChange={(checked) => setTTSGlobalConfig({ autoSentenceTTS: checked })}
            />
          </div>
          <div className="flex justify-between items-center">
            <span>{t('settings.autoWordTTS')}</span>
            <Switch
              checked={ttsGlobalConfig.autoWordTTS}
              onChange={(checked) => setTTSGlobalConfig({ autoWordTTS: checked })}
            />
          </div>
        </div>
      </div>
    </div>
  </Card>
}

