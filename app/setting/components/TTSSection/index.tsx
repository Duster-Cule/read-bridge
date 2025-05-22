import { Menu } from "antd";
import { Card } from "../index";
import useTranslation from "@/i18n/useTranslation";
import { useCallback, useState, useEffect } from "react";
import { useTTSStore } from "@/store/useTTSStore";
import getSystemTTS from "@/services/tts/system";
import { SystemTTSForm } from "./cpns";

export default function TTSSection() {
  const { t } = useTranslation()
  const {
    ttsProvider,
    setTTSProvider,
    ttsConfig,
    setTTSConfig,
  } = useTTSStore()
  const [selectedProviderId, setSelectedProviderId] = useState<string>(ttsProvider)
  const [voiceOptions, setVoiceOptions] = useState<Array<{
    label: string;
    options: Array<{ label: string; value: string }>;
  }>>([])
  const [voiceLanguageMap, setVoiceLanguageMap] = useState<Record<string, string>>({})

  const systemTTS = getSystemTTS()

  // 获取系统可用的声音列表
  useEffect(() => {
    if (selectedProviderId === 'system') {
      const voices = systemTTS.getVoices()

      // 按语言分组
      const voicesByLang: Record<string, { label: string, value: string }[]> = {}
      const voiceLangMap: Record<string, string> = {}

      voices.forEach(voice => {
        const lang = voice.lang || 'Unknown'
        if (!voicesByLang[lang]) {
          voicesByLang[lang] = []
        }
        voicesByLang[lang].push({
          label: voice.name,
          value: voice.name
        })

        // 保存每个声音对应的语言
        voiceLangMap[voice.name] = lang
      })

      // 转换为分组后的选项
      setVoiceOptions(Object.entries(voicesByLang).map(([lang, voices]) => ({
        label: lang,
        options: voices
      })))

      // 保存声音到语言的映射
      setVoiceLanguageMap(voiceLangMap)
    }
  }, [selectedProviderId])

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
        <SystemTTSForm
          ttsConfig={ttsConfig.system}
          voiceOptions={voiceOptions}
          voiceLanguageMap={voiceLanguageMap}
          providerId="system"
          setTTSConfig={setTTSConfig}
          systemTTS={systemTTS}
        />
      )}
    </div>
    <div className="w-[20%] flex-1 flex flex-col overflow-y-auto">

    </div>
  </Card>
}

