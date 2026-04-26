import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });

// ─── 全域音軌 (徹底解決行動端阻擋問題) ───
const globalAudio = new Audio();
let _unlocked = false;

export const unlockAudio = () => {
  if (_unlocked) return;
  _unlocked = true;
  globalAudio.play().catch(() => {});
};

// ─── 華為專用：外接 API 救援機制 ───
const playWithAPI = async (text: string) => {
  console.log("偵測到無原生引擎，啟動 API 救援機制");
  
  // 第一道救援：Google 網頁翻譯 API (速度極快、每個人都免費)
  const safeText = encodeURIComponent(text.substring(0, 200).replace(/\n/g, '，'));
  const googleUrl = `https://translate.googleapis.com/translate_tts?ie=UTF-8&client=gtx&tl=zh-TW&q=${safeText}`;
  globalAudio.src = googleUrl;

  globalAudio.play().catch(async (err) => {
    console.warn("Google 翻譯 API 也被擋，啟動最後防線 Gemini API...", err);
    // 第二道救援：如果連 Google 網址都被網路封鎖，才動用你的 Gemini API
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
        globalAudio.play().catch(console.error);
      }
    } catch (geminiErr) {
      console.error("[TTS] 所有發聲方式皆失敗：", geminiErr);
    }
  });
};


// ─── API 對接口 (因為不快取了，保留空殼讓 App.tsx 不會報錯) ───
export const prewarmAudioCache = async () => {};
export const cacheNewWord = async () => {};


// ─── 智慧分配發聲引擎 ───
export const speakText = async (text: string): Promise<void> => {
  if (!text) return;

  // 1. 強制清除前一個講到一半的話
  window.speechSynthesis.cancel();
  
  // 2. 建立 Chrome / Safari / iOS 共用的原生發音系統 (免費零延遲)
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = 'zh-TW';
  utterance.rate = 0.8;
  
  let nativeStarted = false;
  utterance.onstart = () => {
    nativeStarted = true;
  };
  
  // 3. 嘗試原生發聲
  window.speechSynthesis.speak(utterance);

  // 4. 華為檢測機制：如果 300 毫秒內，原生引擎像死機一樣沒有觸發 onstart
  setTimeout(() => {
    if (!nativeStarted) {
      window.speechSynthesis.cancel(); // 關閉卡死的原生引擎
      playWithAPI(text); // 放出華為專用救援 API
    }
  }, 300);
};

