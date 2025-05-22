import { useTTSStore } from "@/store/useTTSStore"

function getSystemTTS() {
  // 检查浏览器是否支持语音合成API
  const isSpeechSynthesisSupported = typeof window !== 'undefined' &&
    'speechSynthesis' in window &&
    'SpeechSynthesisUtterance' in window;

  // 本地存储声音列表
  let voices: SpeechSynthesisVoice[] = [];

  // 当声音列表准备好时加载
  if (isSpeechSynthesisSupported) {
    voices = window.speechSynthesis.getVoices();

    if (voices.length === 0) {
      window.speechSynthesis.addEventListener('voiceschanged', () => {
        voices = window.speechSynthesis.getVoices();
      });
    }
  }

  // 判断是否正在播放语音
  let isSpeaking = false;
  // 判断是否暂停
  let isPaused = false;

  function getVoices(): SpeechSynthesisVoice[] {
    if (!isSpeechSynthesisSupported) {
      console.warn('Speech synthesis is not supported in this browser');
      return [];
    }

    // 获取最新的声音列表
    if (voices.length === 0) {
      voices = window.speechSynthesis.getVoices();
    }

    return voices;
  }

  function speak(text: string, voiceType: string, speedRatio: number): void {
    if (!isSpeechSynthesisSupported) {
      console.warn('Speech synthesis is not supported in this browser');
      return;
    }

    // 停止当前正在播放的语音
    window.speechSynthesis.cancel();
    isPaused = false;

    const utterance = new SpeechSynthesisUtterance(text);

    // 确保已获取最新的声音列表
    if (voices.length === 0) {
      voices = window.speechSynthesis.getVoices();
    }

    // 查找请求的声音类型
    const voice = voices.find(v => v.name === voiceType);

    if (voice) {
      utterance.voice = voice;
    } else {
      console.warn(`Voice "${voiceType}" not found, using default voice`);
    }

    // 设置语音速率
    utterance.rate = speedRatio;

    // 设置事件处理器
    utterance.onstart = () => {
      isSpeaking = true;
    };

    utterance.onend = () => {
      isSpeaking = false;
      isPaused = false;
    };

    utterance.onerror = (event) => {
      console.error('Speech synthesis error:', event);
      isSpeaking = false;
      isPaused = false;
    };

    // 开始播放语音
    window.speechSynthesis.speak(utterance);
  }

  // 暂停语音播放
  function pause(): void {
    if (!isSpeechSynthesisSupported || !isSpeaking || isPaused) {
      return;
    }

    window.speechSynthesis.pause();
    isPaused = true;
  }

  // 恢复语音播放
  function resume(): void {
    if (!isSpeechSynthesisSupported || !isSpeaking || !isPaused) {
      return;
    }

    window.speechSynthesis.resume();
    isPaused = false;
  }

  // 停止语音播放
  function stop(): void {
    if (!isSpeechSynthesisSupported) {
      return;
    }

    window.speechSynthesis.cancel();
    isSpeaking = false;
    isPaused = false;
  }

  // 获取当前状态
  function getStatus(): { isSpeaking: boolean; isPaused: boolean } {
    return { isSpeaking, isPaused };
  }

  return {
    getVoices,
    speak,
    pause,
    resume,
    stop,
    getStatus
  }
}

export default getSystemTTS

