import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });

// ─── 全域音軌 ───
const globalAudio = new Audio();
let _unlocked = false;

export const unlockAudio = () => {
  if (_unlocked) return;
  _unlocked = true;
  globalAudio.play().catch(() => {});
};

export const prewarmAudioCache = async () => {};
export const cacheNewWord = async () => {};

// ─── 華為專用 Gemini API 救援 ───
const playWithGemini = async (text: string) => {
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-preview-tts',
      contents: [{ parts: [{ text }] }],
      config: {
        responseModalities: ['AUDIO'],
        speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Kore' } } }
      } as any,
    });
    const part = response.candidates?.[0]?.content?.parts?.find(p => p.inlineData);
    if (part?.inlineData) {
      globalAudio.src = `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
      globalAudio.currentTime = 0;
      globalAudio.play().catch(console.error);
    }
  } catch (err) {
    console.error("[TTS] Gemini 也失敗了：", err);
  }
};

// ─── 主發聲函式 ───
export const speakText = async (text: string): Promise<void> => {
  if (!text) return;

  window.speechSynthesis.cancel();

  // 等待聲音列表載入（Chrome 需要這個）
  await new Promise<void>(resolve => {
    if (speechSynthesis.getVoices().length > 0) {
      resolve();
    } else {
      speechSynthesis.onvoiceschanged = () => resolve();
      setTimeout(resolve, 1000); // 最多等 1 秒
    }
  });

  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = 'zh-TW';
  utterance.rate = 0.8;

  let nativeStarted = false;
  utterance.onstart = () => { nativeStarted = true; };

  window.speechSynthesis.speak(utterance);

  // ⭐️ 關鍵修正：等 1000ms（不是 300ms）
  // Chrome 有時需要 500-800ms 才觸發 onstart，1 秒才是安全線
  // 同時檢查「有沒有開始」以及「有沒有正在說話」雙保險
  setTimeout(() => {
    if (!nativeStarted && !window.speechSynthesis.speaking) {
      console.log("[TTS] 原生引擎確認失敗，切換到 Gemini");
      window.speechSynthesis.cancel();
      playWithGemini(text);
    }
  }, 1000);
};
