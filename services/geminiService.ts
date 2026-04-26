
import { GoogleGenAI, GenerateContentResponse } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });

/**
 * 強化版發聲：優先嘗試本機，失敗自動切換雙重雲端救援 (針對華為平板深度優化)
 */
export const speakText = (text: string) => {
  if (!text) return;

  // 1. 強制清除所有正在排隊的語音
  window.speechSynthesis.cancel();

  // 2. 建立原生語音物件 (設定稍微放慢一點，提升成功率)
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = 'zh-TW';
  utterance.rate = 0.7; 

  // 3. 準備雲端音源 (這是不依賴平板 TTS 引擎的「純音檔」方式)
  const cloudUrl = `https://dict.youdao.com/dictvoice?audio=${encodeURIComponent(text)}&le=zh`;
  const backupAudio = new Audio(cloudUrl);

  let nativeStarted = false;

  // 如果原生 TTS 成功啟動，標記為 true
  utterance.onstart = () => {
    nativeStarted = true;
    console.log("原生 TTS 成功啟動");
  };

  // 4. 關鍵保險絲：縮短判定時間至 300ms
  // 如果華為引擎 0.3 秒內沒反應，立刻強行播放雲端音檔，不等了！
  setTimeout(() => {
    if (!nativeStarted) {
      window.speechSynthesis.cancel(); // 掐斷那個卡住的原生引擎
      backupAudio.play().catch(err => console.error("連雲端救援都失敗，請檢查網路:", err));
      console.log("TTS 引擎卡死，已強行切換至雲端播放");
    }
  }, 300);

  // 啟動原生嘗試
  window.speechSynthesis.speak(utterance);
};

/**
 * Uses Gemini 2.5 Flash Image to edit an existing tile image based on a prompt.
 * It sends the current image as base64 and the instruction text.
 */
export const editImageWithAI = async (currentBase64: string, prompt: string): Promise<string | null> => {
  try {
    // Extract actual base64 data if it includes data URI prefix
    const base64Data = currentBase64.split(',')[1] || currentBase64;
    const mimeType = currentBase64.match(/data:(.*?);/)?.[1] || 'image/png';

    const response: GenerateContentResponse = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: {
        parts: [
          {
            inlineData: {
              data: base64Data,
              mimeType: mimeType,
            },
          },
          {
            text: `Please modify the image based on this instruction: "${prompt}". Maintain the same context but apply the changes requested. Return the modified image.`,
          },
        ],
      },
    });

    for (const part of response.candidates?.[0]?.content.parts || []) {
      if (part.inlineData) {
        return `data:image/png;base64,${part.inlineData.data}`;
      }
    }
    return null;
  } catch (error) {
    console.error("AI Image Editing Error:", error);
    return null;
  }
};
