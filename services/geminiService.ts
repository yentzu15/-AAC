
import { GoogleGenAI, GenerateContentResponse } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });

/**
 * 強化版發聲：優先嘗試本機，失敗自動切換雲端 (支援華為與各類平板)
 */
export const speakText = (text: string) => {
  if (!text) return;

  // 🔴 標記 A：強制清除之前的阻塞 (解決連點沒聲音)
  window.speechSynthesis.cancel();

  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = 'zh-TW';
  utterance.rate = 0.8; // 稍微加快，聽起來更像真人

    // 🔴 關鍵修改：改用有道語音 API，中國大陸免翻牆且華為可用
  const cloudUrl = `https://dict.youdao.com/dictvoice?audio=${encodeURIComponent(text)}&le=zh`;
  const audio = new Audio(cloudUrl);

  // 🔴 標記 C：設定監測開關
  let hasStarted = false;
  utterance.onstart = () => {
    hasStarted = true;
  };

  // 🔴 標記 D：0.5 秒檢查哨 (如果華為系統裝死沒反應，就改播雲端音檔)
  setTimeout(() => {
    if (!hasStarted) {
      window.speechSynthesis.cancel(); 
      audio.play().catch(err => console.error("雲端發聲失敗：", err));
      console.log("偵測到本機發聲失效，已切換雲端備援");
    }
  }, 500);

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
