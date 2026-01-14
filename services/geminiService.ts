
import { GoogleGenAI, GenerateContentResponse } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });

/**
 * Text-to-speech using browser's SpeechSynthesis (fallback/primary for quick response)
 */
export const speakText = (text: string) => {
  if (!text) return;
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = 'zh-TW';
  utterance.rate = 0.5;
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
