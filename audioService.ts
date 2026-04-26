import { GoogleGenAI } from "@google/genai";

// 這裡抓取你原本環境變數的 API_KEY
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });

// ─── IndexedDB 快取層 ───────────────────────────────────────────────
const DB_NAME = 'aac-tts-cache';
const STORE = 'audio';

const openDB = (): Promise<IDBDatabase> =>
  new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, 1);
    req.onupgradeneeded = (e) => {
      const db = (e.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(STORE)) {
        db.createObjectStore(STORE);
      }
    };
    req.onsuccess = e => resolve((e.target as IDBOpenDBRequest).result);
    req.onerror = () => reject(req.error);
  });

const dbGet = async (key: string): Promise<string | null> => {
  const db = await openDB();
  return new Promise(resolve => {
    const req = db.transaction(STORE).objectStore(STORE).get(key);
    req.onsuccess = () => resolve(req.result ?? null);
    req.onerror = () => resolve(null);
  });
};

const dbSet = async (key: string, value: string): Promise<void> => {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, 'readwrite');
    tx.objectStore(STORE).put(value, key);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
};

// ─── Gemini TTS 生成 ────────────────────────────────────────────────
const generateAudio = async (text: string): Promise<string | null> => {
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-preview-tts',
      contents: [{ parts: [{ text }] }],
      config: {
        responseModalities: ['AUDIO'],
        speechConfig: {
          voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Kore' } },
        },
      } as any,
    });

    const part = response.candidates?.[0]?.content?.parts?.find(p => p.inlineData);
    if (!part?.inlineData) return null;

    const dataUrl = `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
    await dbSet(text, dataUrl);
    return dataUrl;
  } catch (err) {
    console.error('[TTS] 生成失敗：', err);
    return null;
  }
};

// ─── 自動播放解鎖（針對華為與行動裝置設計）──
let _unlocked = false;
export const unlockAudio = () => {
  if (_unlocked) return;
  _unlocked = true;
  const a = new Audio();
  a.play().catch(() => {});
};

// ─── 公開 API ───────────────────────────────────────────────────────
export const prewarmAudioCache = async (allTexts: string[]): Promise<void> => {
  for (const text of allTexts) {
    if (!text) continue;
    const cached = await dbGet(text);
    if (!cached) await generateAudio(text);
  }
};

export const cacheNewWord = async (text: string): Promise<void> => {
  if (!text || await dbGet(text)) return;
  await generateAudio(text);
};

export const speakText = async (text: string): Promise<void> => {
  if (!text) return;
  let dataUrl = await dbGet(text);
  if (!dataUrl) {
    dataUrl = await generateAudio(text);
  }
  if (dataUrl) {
    const audio = new Audio(dataUrl);
    audio.play().catch(err => console.error('[TTS] 播放失敗：', err));
  }
};
