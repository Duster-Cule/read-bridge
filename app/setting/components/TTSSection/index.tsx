import { Menu, Select, Slider, Form, Row, Col, Button, Tooltip } from "antd";
import { Card } from "../index";
import useTranslation from "@/i18n/useTranslation";
import { useCallback, useState, useEffect } from "react";
import { useTTSStore } from "@/store/useTTSStore";
import getSystemTTS from "@/services/tts/system";
import { SoundOutlined } from "@ant-design/icons";

const { Option } = Select;

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

  const systemTTS = getSystemTTS()

  // 获取系统可用的声音列表
  useEffect(() => {
    if (selectedProviderId === 'system') {
      const voices = systemTTS.getVoices()

      // 按语言分组
      const voicesByLang: Record<string, { label: string, value: string }[]> = {}

      voices.forEach(voice => {
        const lang = voice.lang || 'Unknown'
        if (!voicesByLang[lang]) {
          voicesByLang[lang] = []
        }
        voicesByLang[lang].push({
          label: voice.name,
          value: voice.name
        })
      })

      // 转换为分组后的选项
      setVoiceOptions(Object.entries(voicesByLang).map(([lang, voices]) => ({
        label: lang,
        options: voices
      })))
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
    systemTTS.speak(
      "This is a test for text to speech",
      ttsConfig.system.voiceType,
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

