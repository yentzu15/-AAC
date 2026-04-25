
import { GoogleGenAI, GenerateContentResponse } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });

/**
 * 強化版發聲：優先嘗試本機，失敗自動切換雙重雲端救援 (針對華為平板深度優化)
 */
export const speakText = (text: string) => {
  if (!text) return;

  // 1. 強制清除之前的阻塞，確保連點時聲音不會卡死
  window.speechSynthesis.cancel();

  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = 'zh-TW';
  utterance.rate = 0.8; 

  // 2. 準備雙重雲端後援：有道語音 (大陸免翻牆) 與 Google 語音
  const cloudUrl1 = `https://dict.youdao.com/dictvoice?audio=${encodeURIComponent(text)}&le=zh`;
  const cloudUrl2 = `https://translate.google.com/translate_tts?ie=UTF-8&q=${encodeURIComponent(text)}&tl=zh-TW&client=tw-ob`;
  
  const audio1 = new Audio(cloudUrl1);
  const audio2 = new Audio(cloudUrl2);

  let hasStarted = false;
  utterance.onstart = () => {
    hasStarted = true;
  };

  // 3. 延長檢查哨時間至 0.8 秒：給華為系統足夠的時間初始化語音引擎
  setTimeout(() => {
    if (!hasStarted) {
      window.speechSynthesis.cancel(); 
      // 嘗試第一後援：有道
      audio1.play().catch(() => {
        // 若失敗，嘗試第二後援：Google
        audio2.play().catch(err => console.error("所有雲端發聲管道皆失敗：", err));
      });
      console.log("偵測到本機發聲失效，已啟用雙重雲端救援模式");
    }
  }, 800); // 👈 這裡是針對華為反應慢的關鍵修正

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
