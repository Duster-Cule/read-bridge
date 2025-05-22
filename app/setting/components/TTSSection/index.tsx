import { Menu, Select, Slider, Form, Row, Col, Button, Tooltip } from "antd";
import { Card } from "../index";
import useTranslation from "@/i18n/useTranslation";
import { useCallback, useState, useEffect } from "react";
import { useTTSStore } from "@/store/useTTSStore";
import getSystemTTS from "@/services/tts/system";
import { SoundOutlined } from "@ant-design/icons";

const { Option } = Select;

// 测试语音文本映射
const testTextByLanguage: Record<string, string> = {
  'zh-CN': '这是一个文字转语音的测试',
  'zh-TW': '這是一個文字轉語音的測試',
  'zh-HK': '這是一個文字轉語音的測試',
  'en-US': 'This is a test for text to speech',
  'en-GB': 'This is a test for text to speech',
  'ja-JP': 'これは音声合成のテストです',
  'ko-KR': '이것은 텍스트 음성 변환 테스트입니다',
  'fr-FR': 'Ceci est un test de synthèse vocale',
  'de-DE': 'Dies ist ein Test für Text-zu-Sprache',
  'es-ES': 'Esta es una prueba de texto a voz',
  'ru-RU': 'Это тест преобразования текста в речь',
};

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

  const handleVoiceChange = (value: string) => {
    setTTSConfig('system', {
      ...ttsConfig.system,
      voiceType: value
    })
  }

  const handleSpeedChange = (value: number) => {
    setTTSConfig('system', {
      ...ttsConfig.system,
      speedRatio: value.toString()
    })
  }

  // 测试TTS功能
  const testTTS = () => {
    const selectedVoice = ttsConfig.system.voiceType
    const voiceLanguage = voiceLanguageMap[selectedVoice] || 'en-US'

    // 获取对应语言的测试文本，如果没有则使用英文
    const testText = testTextByLanguage[voiceLanguage] || testTextByLanguage['en-US']

    systemTTS.speak(
      testText,
      selectedVoice,
      parseFloat(ttsConfig.system.speedRatio)
    )
  }

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
        <div className="space-y-6">
          <Form layout="horizontal" labelCol={{ span: 6 }} wrapperCol={{ span: 18 }}>
            <Form.Item label={t('settings.ttsVoice')}>
              <Row gutter={8} align="middle">
                <Col>
                  <Select
                    style={{ width: 240 }}
                    value={ttsConfig.system.voiceType}
                    onChange={handleVoiceChange}
                    placeholder={t('settings.ttsVoice')}
                  >
                    {voiceOptions.map(group => (
                      <Select.OptGroup key={group.label} label={group.label}>
                        {group.options.map(option => (
                          <Option key={option.value} value={option.value}>
                            {option.label}
                          </Option>
                        ))}
                      </Select.OptGroup>
                    ))}
                  </Select>
                </Col>
                <Col>
                  <Tooltip title={t('settings.testVoice')}>
                    <Button
                      icon={<SoundOutlined />}
                      onClick={testTTS}
                      type="text"
                      shape="circle"
                    />
                  </Tooltip>
                </Col>
              </Row>
            </Form.Item>

            <Form.Item label={t('settings.ttsSpeed')}>
              <Slider
                min={0.5}
                max={2}
                step={0.1}
                value={parseFloat(ttsConfig.system.speedRatio)}
                onChange={handleSpeedChange}
                tooltip={{ formatter: (value) => `${value}x` }}
                style={{ width: 240 }}
              />
            </Form.Item>
          </Form>
        </div>
      )}
    </div>
  </Card>
}

