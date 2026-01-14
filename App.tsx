
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { AACTile, AACBoard, LayoutMode } from './types';
import { speakText } from './services/geminiService';
import { get, set } from 'idb-keyval';
const BOARD_ICONS: Record<string, React.ReactNode> = {
  'board-core': (
    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z" /></svg>
  ),
  'board-emotions': (
    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M11.99 2C6.47 2 2 6.48 2 12s4.47 10 9.99 10C17.52 22 22 17.52 22 12S17.52 2 11.99 2zM12 20c-4.42 0-8-3.58-8-8s3.58-8 8-8 8 3.58 8 8-3.58 8-8 8zm3.5-9c.83 0 1.5-.67 1.5-1.5S16.33 8 15.5 8 14 8.67 14 9.5s.67 1.5 1.5 1.5zm-7 0c.83 0 1.5-.67 1.5-1.5S9.33 8 8.5 8 7 8.67 7 9.5s.67 1.5 1.5 1.5zm3.5 6.5c2.33 0 4.31-1.46 5.11-3.5H6.89c.8 2.04 2.78 3.5 5.11 3.5z" /></svg>
  ),
  'board-daily': (
    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M11.99 2C6.47 2 2 6.48 2 12s4.47 10 9.99 10C17.52 22 22 17.52 22 12S17.52 2 11.99 2zM12 20c-4.42 0-8-3.58-8-8s3.58-8 8-8 8 3.58 8 8-3.58 8-8 8zm.5-13H11v6l5.25 3.15.75-1.23-4.5-2.67z" /></svg>
  ),
};

const YES_TILE: AACTile = { id: 'fixed-yes', text: '是', imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/a/ac/Approve_icon.svg/512px-Approve_icon.svg.png' };
const NO_TILE: AACTile = { id: 'fixed-no', text: '不是', imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/c/cc/Cross_red_circle.svg/512px-Cross_red_circle.svg.png' };

const INITIAL_BOARDS: AACBoard[] = [
  {
    id: 'board-core',
    name: '核心詞彙',
    tiles: [
      { id: '11', text: '我', imageUrl: '/icons/我.png' },
      { id: '12', text: '你', imageUrl: '/icons/你.png' },
      { id: '2', text: '要', imageUrl: '/icons/還要.png' },
      { id: '14', text: '翻頁', imageUrl: '/icons/翻頁.png' }, 
      { id: '10', text: '放', imageUrl: '/icons/放.png' },
      { id: '4', text: '再一次', imageUrl: '/icons/再一次.png' },
      { id: '7', text: '玩', imageUrl: '/icons/玩.png' },
      { id: '1', text: '打開', imageUrl: '/icons/打開.png' },
      { id: '3', text: '給我', imageUrl: '/icons/給我.png' },
      { id: '15', text: '完成', imageUrl: '/icons/完成.png' },
     { id: '6', text: '幫忙', imageUrl: '/icons/幫忙.png' },
      { id: '8', text: '關起來', imageUrl: '/icons/關起來.png' },
      { id: '9', text: '換', imageUrl: '/icons/換.png' },
      { id: '5', text: '請', imageUrl: '/icons/請.png' },
      { id: '13', text: '去', imageUrl: '/icons/去.png' }
    ]
  },

  {
    id: 'board-emotions',
    name: '情緒表達',
    tiles: [
      { id: 'e1', text: '開心', imageUrl: '/icons/開心.png' },
      { id: 'e2', text: '生氣', imageUrl: '/icons/生氣.png' },
      { id: 'e3', text: '難過', imageUrl: '/icons/傷心.png' },
      { id: 'e4', text: '害怕', imageUrl: '/icons/怕.png' },
      { id: 'e5', text: '累了', imageUrl: '/icons/累.png' },
      { id: 'e6', text: '痛痛', imageUrl: '/icons/痛.png' }
    ]
  },

  {
    id: 'board-daily',
    name: '日常活動',
    tiles: [
      { id: 'd1', text: '吃', imageUrl: '/icons/吃.png' },
      { id: 'd2', text: '喝', imageUrl: '/icons/喝.png' },
      { id: 'd3', text: '睡覺', imageUrl: '/icons/睡覺.png' },
      { id: 'd4', text: '洗澡', imageUrl: '/icons/洗澡.png' },
      { id: 'd5', text: '上廁所', imageUrl: '/icons/上廁所.png' },
      { id: 'd6', text: '穿衣服', imageUrl: '/icons/穿衣服.png' }
    ]
  },

  {
    id: 'board-food',
    name: '食物',
    tiles: [
      { id: 'f1', text: '水', imageUrl: '/icons/水.png' },
      { id: 'f2', text: '飯', imageUrl: '/icons/飯.png' },
      { id: 'f3', text: '餅乾', imageUrl: '/icons/餅乾.png' }
    ]
  },

  {
    id: 'board-places',
    name: '地點',
    tiles: [
      { id: 'p1', text: '學校', imageUrl: '/icons/學校.png' },
      { id: 'p2', text: '家', imageUrl: '/icons/家.png' },
      { id: 'p3', text: '公園', imageUrl: '/icons/公園.png' },
      { id: 'p4', text: '健身房', imageUrl: '/icons/健身房.png' },
      { id: 'p5', text: '出去玩', imageUrl: '/icons/出去玩.png' },
      { id: 'p6', text: '醫院', imageUrl: '/icons/醫院.png' }
    ]
  }
];

const BOARDS_KEY = 'gemini-aac-boards-v1';
const UI_KEY = 'gemini-aac-ui-v2';
const UI_VERSION = 2;

const TILES_PER_PAGE = 9;
type UIState = {
  version: number;
  activeBoardId: string;
  currentPage: number;
  mode: LayoutMode;
  keyboardText: string;
};

const DEFAULT_UI: UIState = {
  version: UI_VERSION,
  activeBoardId: 'board-core',
  currentPage: 0,
  mode: 'standard',
  keyboardText: '',
};

const loadUI = (): UIState => {
  try {
    const raw = localStorage.getItem(UI_KEY);
    if (!raw) return DEFAULT_UI;
    const parsed = JSON.parse(raw) as UIState;
    if (parsed?.version !== UI_VERSION) return DEFAULT_UI;
    return { ...DEFAULT_UI, ...parsed, version: UI_VERSION };
  } catch {
    return DEFAULT_UI;
  }
};

const useIsMobile = () => {
  const [isMobile, setIsMobile] = React.useState(false);

  React.useEffect(() => {
    const mq = window.matchMedia("(max-width: 767px)");
    const onChange = () => setIsMobile(mq.matches);
    onChange();
    mq.addEventListener?.("change", onChange);
    return () => mq.removeEventListener?.("change", onChange);
  }, []);

  return isMobile;
};

const App: React.FC = () => {
  const isMobile = useIsMobile();

  // 設定初始狀態
  const [boards, setBoards] = useState<AACBoard[]>(INITIAL_BOARDS);
  const [isLoaded, setIsLoaded] = useState(false); //用來確認資料拿到沒

  // 1. APP 啟動時，去大倉庫 (IndexedDB) 拿資料
  useEffect(() => {
    get(BOARDS_KEY).then((val) => {
      if (val) setBoards(val);
      setIsLoaded(true);
    });
  }, []);

  // 2. 當資料有變動，存回大倉庫
  useEffect(() => {
    if (isLoaded) {
      set(BOARDS_KEY, boards).catch(err => console.error('儲存失敗', err));
    }
  }, [boards, isLoaded]);

const ui = loadUI();

const [activeBoardId, setActiveBoardId] = useState<string>(ui.activeBoardId || 'board-core');

const [currentPage, setCurrentPage] = useState<number>(ui.currentPage ?? 0);
const [mode, setMode] = useState<LayoutMode>(ui.mode ?? 'standard');
const [sentence, setSentence] = useState<AACTile[]>([]);
const [keyboardText, setKeyboardText] = useState<string>(ui.keyboardText ?? '');
const [editingTileId, setEditingTileId] = useState<string | null>(null);
const [draggingTileId, setDraggingTileId] = useState<string | null>(null);
const [dragOverTileId, setDragOverTileId] = useState<string | null>(null);
const lastClickTimeRef = useRef<number>(0);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const activeBoard = useMemo(() => boards.find(b => b.id === activeBoardId) || boards[0], [boards, activeBoardId]);
  const activeBoardIndex = useMemo(() => boards.findIndex(b => b.id === activeBoardId), [boards, activeBoardId]);
  const totalPages = Math.ceil(activeBoard.tiles.length / TILES_PER_PAGE) || 1;
  const visibleTiles = useMemo(() => {
    const start = currentPage * TILES_PER_PAGE;
    return activeBoard.tiles.slice(start, start + TILES_PER_PAGE);
  }, [activeBoard, currentPage]);

 useEffect(() => {
  const nextUI: UIState = {
    version: UI_VERSION,
    activeBoardId,
    currentPage,
    mode,
    keyboardText,
  };
  localStorage.setItem(UI_KEY, JSON.stringify(nextUI));
}, [activeBoardId, currentPage, mode, keyboardText]);


  const handleTileClick = (tile: AACTile) => {
    // 🔥 加入這段防手抖邏輯 (Debounce)
    const now = Date.now();
    if (now - lastClickTimeRef.current < 1000) { // 1000 毫秒 = 1 秒
      return; // 如果距離上次點擊不到 1 秒，直接忽略，不執行動作
    }
    lastClickTimeRef.current = now; // 更新點擊時間
    
    if (mode === 'standard') {
      setSentence(prev => [...prev, tile]);
      speakText(tile.text);
    } else if (tile.id !== YES_TILE.id && tile.id !== NO_TILE.id) {
      setEditingTileId(tile.id);
      fileInputRef.current?.click();
    }
  };

  const handleTextChange = (id: string, newText: string) => {
    setBoards(prev => prev.map(b => ({
      ...b,
      tiles: b.tiles.map(t => t.id === id ? { ...t, text: newText } : t)
    })));
  };

  const deleteTile = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (window.confirm('確定要刪除此詞彙嗎？')) {
      setBoards(prev => prev.map(b => b.id === activeBoardId ? { ...b, tiles: b.tiles.filter(t => t.id !== id) } : b));
      speakText('已刪除詞彙');
    }
  };
const moveTile = (fromId: string, toId: string) => {
  if (fromId === toId) return;

  setBoards(prev =>
    prev.map(board => {
      if (board.id !== activeBoardId) return board;

      const tiles = [...board.tiles];
      const fromIndex = tiles.findIndex(t => t.id === fromId);
      const toIndex = tiles.findIndex(t => t.id === toId);

      if (fromIndex === -1 || toIndex === -1) return board;

      const [moved] = tiles.splice(fromIndex, 1);
      tiles.splice(toIndex, 0, moved);

      return { ...board, tiles };
    })
  );
};
  const moveTileByStep = (tileId: string, step: -1 | 1) => {
  setBoards(prev =>
    prev.map(board => {
      if (board.id !== activeBoardId) return board;

      const tiles = [...board.tiles];
      const idx = tiles.findIndex(t => t.id === tileId);
      if (idx === -1) return board;

      const newIdx = idx + step;
      if (newIdx < 0 || newIdx >= tiles.length) return board;

      [tiles[idx], tiles[newIdx]] = [tiles[newIdx], tiles[idx]];

      return { ...board, tiles };
    })
  );
};


const handleFullSpeak = () => {
    // 1. 先把所有詞彙的文字拿出來，檢查裡面有沒有「問句關鍵字」
    const rawText = sentence.map(t => t.text).join('');
    
    // 定義問句關鍵字：如果有這些字，通常是在問問題
    const isQuestion = ['嗎', '呢', '什麼', '哪裡', '幾', '誰', '怎麼', '好不好'].some(keyword => rawText.includes(keyword));
    
    // 定義感嘆關鍵字：如果有這些字，通常語氣比較強烈
    const isExclamation = ['不', '痛', '生氣', '開心', '棒', '救命'].some(keyword => rawText.includes(keyword));

    // 2. 決定最後面的標點符號
    let endPunctuation = '。'; // 預設是用句號（平平的語調）
    if (isQuestion) {
      endPunctuation = '？'; // 變成問號（語調上揚 ⤴️）
    } else if (isExclamation) {
      endPunctuation = '！'; // 變成驚嘆號（語氣加重 😤）
    }

    // 3. 組合句子：
    //    - 每個詞彙中間加「全形逗號 ，」讓語速變慢、有頓點
    //    - 最後加上我們判斷好的「標點符號」來改變語調
    const sentenceText = sentence.map(t => t.text).join('，') + endPunctuation;
    
    const fullText = sentenceText + keyboardText;
    
    if (fullText) speakText(fullText);
  };
  const changeBoard = (dir: 'next' | 'prev') => {
    const newIdx = dir === 'next' ? (activeBoardIndex + 1) % boards.length : (activeBoardIndex - 1 + boards.length) % boards.length;
    setActiveBoardId(boards[newIdx].id);
    setCurrentPage(0);
    speakText(boards[newIdx].name);
  };

  const exportSettings = () => {
    const dataStr = JSON.stringify(boards);
    const blob = new Blob([dataStr], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `AAC_Backup_${new Date().toLocaleDateString()}.json`;
    link.click();
    speakText('設定已匯出');
  };

  const importSettings = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = (e: any) => {
      const file = e.target.files[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = (event) => {
        try {
          const imported = JSON.parse(event.target?.result as string);
          if (Array.isArray(imported)) {
            setBoards(imported);
            setActiveBoardId(imported[0]?.id || 'board-core');
            speakText('匯入完成');
          } else {
            alert('檔案格式不符，請上傳正確的 AAC 備份檔。');
          }
        } catch (err) {
          alert('匯入失敗，檔案讀取錯誤。');
        }
      };
      reader.readAsText(file);
    };
    input.click();
  };

  const addNewBoard = () => {
    const name = window.prompt('請輸入新版面的名稱：', '新版面');
    if (name && name.trim()) {
      const newId = `custom-board-${Date.now()}`;
      setBoards(prev => [...prev, { id: newId, name: name.trim(), tiles: [] }]);
      setActiveBoardId(newId);
      setCurrentPage(0);
      speakText(`已新增版面 ${name}`);
    }
  };

  const deleteCurrentBoard = () => {
    if (boards.length <= 1) {
      alert('至少需要保留一個版面，無法刪除。');
      return;
    }
    if (window.confirm(`確定要刪除「${activeBoard.name}」整個版面嗎？此動作無法復原。`)) {
      const remainingBoards = boards.filter(b => b.id !== activeBoardId);
      setBoards(remainingBoards);
      setActiveBoardId(remainingBoards[0].id);
      setCurrentPage(0);
      speakText('版面已刪除');
    }
  };

  const addNewTile = () => {
    const newId = `custom-tile-${Date.now()}`;
    const newTile: AACTile = { id: newId, text: '新詞彙', imageUrl: '' };
    setBoards(prev => prev.map(b => b.id === activeBoardId ? { ...b, tiles: [...b.tiles, newTile] } : b));
    
    const newTotalTiles = activeBoard.tiles.length + 1;
    const newTotalPages = Math.ceil(newTotalTiles / TILES_PER_PAGE);
    setCurrentPage(newTotalPages - 1);
    
    speakText('已新增詞彙');
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && editingTileId) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const img = new Image();
        img.src = reader.result as string;
        img.onload = () => {
          const canvas = document.createElement('canvas');
          const MAX_SIZE = 300; 
          let width = img.width;
          let height = img.height;
          if (width > height) {
            if (width > MAX_SIZE) { height *= MAX_SIZE / width; width = MAX_SIZE; }
          } else {
            if (height > MAX_SIZE) { width *= MAX_SIZE / height; height = MAX_SIZE; }
          }
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          if (ctx) {
            ctx.drawImage(img, 0, 0, width, height);
            const compressedBase64 = canvas.toDataURL('image/jpeg', 0.6);
            setBoards(prev => prev.map(b => ({
              ...b,
              tiles: b.tiles.map(t => t.id === editingTileId ? { ...t, imageUrl: compressedBase64 } : t)
            })));
          }
          setEditingTileId(null);
          speakText('圖片更換完成');
          if (fileInputRef.current) fileInputRef.current.value = "";
        };
      };
      reader.readAsDataURL(file);
    }
  };
// ===== Layout tuning (Desktop + Tablet) =====
const SIDEBAR_W = 150; // 左右側欄寬度(px) 先用 150
const BTN_H_VH = 15;   // YES/NO 高度(vh) 先用 15

  return (
    <div className="flex flex-col h-screen w-screen overflow-hidden bg-white select-none relative">
      <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleImageUpload} />
      
      {/* Top Nav */}
      <nav className="h-[8vh] flex items-center gap-2 px-4 border-b border-slate-100 flex-shrink-0 bg-white z-40">
        <div className="flex-grow flex items-center gap-2 overflow-x-auto no-scrollbar py-2">
          {boards.map(b => (
            <button 
              key={b.id} 
              onClick={() => {setActiveBoardId(b.id); setCurrentPage(0);}} 
              className={`flex items-center gap-2 px-4 py-2 rounded-xl font-bold text-sm border-2 whitespace-nowrap transition-all ${activeBoardId === b.id ? 'bg-indigo-600 text-white border-indigo-500 shadow-md' : 'bg-slate-50 text-slate-600 border-slate-50 hover:border-slate-200'}`}
            >
              {BOARD_ICONS[b.id] || (
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M4 6h16v2H4zm0 5h16v2H4zm0 5h16v2H4z" /></svg>
              )} 
              {b.name}
            </button>
          ))}
        </div>
        <label className="flex items-center gap-2 cursor-pointer bg-slate-100 px-3 py-2 rounded-xl border border-slate-200 shrink-0">
          <span className="text-xs font-black text-slate-500">編輯模式</span>
          <input type="checkbox" className="sr-only" checked={mode === 'edit'} onChange={() => setMode(m => m === 'standard' ? 'edit' : 'standard')} />
          <div className={`w-10 h-6 rounded-full relative transition-colors ${mode === 'edit' ? 'bg-amber-500' : 'bg-slate-300'}`}>
            <div className={`absolute left-1 top-1 bg-white w-4 h-4 rounded-full transition-transform ${mode === 'edit' ? 'translate-x-4' : ''}`}></div>
          </div>
        </label>
      </nav>

     {/* Sentence Bar */}
{isMobile ? (
  // ===== Mobile Sentence Bar (two rows) =====
  <div className="bg-slate-50 border-b border-slate-200 px-3 py-2 flex flex-col gap-2 flex-shrink-0 shadow-inner z-30">
    
    {/* Row 1：句條 */}
    <div className="flex items-center gap-2 overflow-x-auto no-scrollbar">
      {sentence.length === 0 && !keyboardText && (
        <span className="text-slate-400 font-bold italic text-sm">
          點選按鈕開始對話…
        </span>
      )}
      {sentence.map((t, i) => (
        <div
          key={i}
          onClick={() => setSentence(prev => prev.filter((_, idx) => idx !== i))}
          className="flex-shrink-0 flex flex-col items-center bg-white border border-slate-200 rounded-xl px-2 py-1 shadow-sm cursor-pointer"
        >
          {t.imageUrl && (
            <img src={t.imageUrl} className="h-8 object-contain pointer-events-none" />
          )}
          <span className="text-[10px] font-black text-slate-800">
            {t.text}
          </span>
        </div>
      ))}
    </div>

    {/* Row 2：打字＋按鈕 */}
    <div className="flex items-center gap-2">
      <input
        type="text"
        value={keyboardText}
        onChange={(e) => setKeyboardText(e.target.value)}
        onKeyDown={(e) => e.key === 'Enter' && handleFullSpeak()}
        placeholder="打字區…"
        className="flex-1 bg-white border border-slate-200 rounded-lg px-3 py-2 text-sm font-bold outline-none"
      />
      <button
        onClick={() => setSentence(prev => prev.slice(0, -1))}
        className="px-3 py-2 bg-amber-100 text-amber-700 rounded-lg font-black text-sm"
      >
        退格
      </button>
      <button
        onClick={handleFullSpeak}
        className="px-4 py-2 bg-indigo-600 text-white rounded-lg font-black text-sm"
      >
        發聲
      </button>
    </div>
  </div>
) : (
  // ===== Desktop / Tablet Sentence Bar（你原本那一整段 그대로放回來）=====
  <div className="h-[12vh] bg-slate-50 border-b border-slate-200 flex items-center gap-4 px-6 overflow-hidden flex-shrink-0 shadow-inner z-30">
    {/* ⚠️ 這裡放你原本的桌機版 Sentence Bar 內容，不用改 */}
  </div>
)}


 {/* Grid Area */}
{isMobile ? (
  // =====================
  // Mobile Layout
  // =====================
  <div className="flex-grow flex flex-col bg-slate-100 overflow-hidden">
    <main className="flex-1 p-3 grid grid-cols-2 gap-3 overflow-y-auto min-h-0">
      {activeBoard.tiles.map(tile => (
        <div
          key={tile.id}
          onClick={() => handleTileClick(tile)}
          className={`relative rounded-[1.75rem] shadow-lg border-4 flex flex-col items-center justify-center p-3 transition-all ${
            mode === 'edit'
              ? 'bg-amber-50 border-amber-300'
              : 'bg-white border-white active:scale-95 cursor-pointer'
          }`}
        >
          {mode === 'edit' && (
            <button
              onClick={(e) => deleteTile(tile.id, e)}
              className="absolute -top-2 -right-2 w-8 h-8 bg-red-500 text-white rounded-full flex items-center justify-center shadow-lg z-50 font-black"
            >
              ✕
            </button>
          )}
{mode === 'edit' && (
  <div className="absolute top-2 left-2 flex gap-1 z-50">
    <button
      onClick={(e) => {
        e.stopPropagation();
        moveTileByStep(tile.id, -1);
      }}
      className="px-2 py-1 rounded-md bg-slate-900/80 text-white text-xs font-black"
    >
      ◀
    </button>
    <button
      onClick={(e) => {
        e.stopPropagation();
        moveTileByStep(tile.id, 1);
      }}
      className="px-2 py-1 rounded-md bg-slate-900/80 text-white text-xs font-black"
    >
      ▶
    </button>
  </div>
)}

          <div className="w-full flex-1 min-h-0 flex items-center justify-center">
            {tile.imageUrl ? (
              <img src={tile.imageUrl} className="w-full h-full object-contain pointer-events-none" />
            ) : (
              <svg className="w-12 h-12 text-slate-200" fill="currentColor" viewBox="0 0 24 24">
                <path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z" />
              </svg>
            )}
          </div>

          {mode === 'edit' ? (
            <input
              type="text"
              value={tile.text}
              onClick={e => e.stopPropagation()}
              onChange={e => handleTextChange(tile.id, e.target.value)}
              className="font-black text-indigo-600 text-lg mt-2 w-full text-center bg-white/50 rounded-lg border-b-2 border-indigo-200 outline-none"
            />
          ) : (
            <span className="font-black text-xl mt-2 text-center leading-tight">
              {tile.text}
            </span>
          )}
        </div>
      ))}
    </main>

    <div className="h-[14vh] bg-white/70 border-t border-slate-200 p-2 flex items-stretch gap-2">
      <button
        onClick={() => changeBoard('prev')}
        className="w-[18%] bg-indigo-50 text-indigo-700 rounded-2xl border-4 border-indigo-200 flex items-center justify-center active:scale-95"
      >
        <span className="text-3xl font-black">&lt;</span>
      </button>

      <button
        onClick={() => handleTileClick(YES_TILE)}
        className="flex-1 bg-white rounded-2xl shadow-lg border-4 border-green-500 flex items-center justify-center gap-2 active:scale-95"
      >
        <img src={YES_TILE.imageUrl} className="h-[60%] object-contain pointer-events-none" />
        <span className="font-black text-green-600 text-2xl">是</span>
      </button>

      <button
        onClick={() => handleTileClick(NO_TILE)}
        className="flex-1 bg-white rounded-2xl shadow-lg border-4 border-red-500 flex items-center justify-center gap-2 active:scale-95"
      >
        <img src={NO_TILE.imageUrl} className="h-[60%] object-contain pointer-events-none" />
        <span className="font-black text-red-600 text-2xl">不</span>
      </button>

      <button
        onClick={() => changeBoard('next')}
        className="w-[18%] bg-indigo-50 text-indigo-700 rounded-2xl border-4 border-indigo-200 flex items-center justify-center active:scale-95"
      >
        <span className="text-3xl font-black">&gt;</span>
      </button>
    </div>
  </div>
) : (
  // =====================
  // Desktop + Tablet Layout (your existing one)
  // =====================
  <div className="flex-grow flex bg-slate-100 overflow-hidden">
    {/* Left Sidebar */}
    <aside
      className="flex-shrink-0 flex flex-col gap-4 p-4 border-r border-slate-200 bg-white/50"
      style={{ width: SIDEBAR_W }}
    >
      <button
        onClick={() => handleTileClick(YES_TILE)}
        className="w-full overflow-hidden bg-white rounded-[2rem] shadow-xl border-8 border-green-500 flex flex-col items-center justify-center active:scale-95 transition-all
                   h-[clamp(160px,22vh,280px)]"
      >
        <img
          src={YES_TILE.imageUrl}
          className="max-h-[56%] max-w-[80%] object-contain mb-2 pointer-events-none"
        />
        <span className="font-black text-green-600 text-3xl lg:text-4xl leading-none">是</span>
      </button>

      <div className="mt-1 flex flex-col items-center gap-1">
        <div className="text-[14px] md:text-[16px] text-slate-400 font-black text-center whitespace-nowrap leading-none">
          高高老師語你在一起
        </div>
        <img src="/icons/logo.png" alt="logo" className="w-[58px] opacity-90 pointer-events-none" />
      </div>

      <button
        onClick={() => changeBoard('prev')}
        className="h-[11vh] mt-auto bg-indigo-50 text-indigo-700 rounded-2xl border-4 border-indigo-200 flex items-center justify-center active:scale-95 hover:bg-indigo-100 transition-colors"
      >
        <span className="text-[32px] font-black">&lt;&lt;</span>
      </button>
    </aside>

    {/* Main Grid */}
<main className="flex-grow p-4 grid grid-cols-3 grid-rows-3 gap-4 min-w-0">
  {visibleTiles.map(tile => (
    <div
      key={tile.id}
      draggable={mode === 'edit'}
      onDragStart={() => {
        setDraggingTileId(tile.id);
        setDragOverTileId(null);
      }}
      onDragEnter={() => {
        if (mode === 'edit' && draggingTileId && draggingTileId !== tile.id) {
          setDragOverTileId(tile.id);
        }
      }}
      onDragOver={(e) => {
        if (mode === 'edit') e.preventDefault(); // 允許 drop
      }}
      onDragLeave={(e) => {
        // 避免在子元素移動就一直閃，只有真的離開才清
        if (!e.currentTarget.contains(e.relatedTarget as Node)) {
          setDragOverTileId((prev) => (prev === tile.id ? null : prev));
        }
      }}
      onDrop={() => {
        if (mode === 'edit' && draggingTileId && draggingTileId !== tile.id) {
          moveTile(draggingTileId, tile.id);
        }
        setDraggingTileId(null);
        setDragOverTileId(null);
      }}
      onDragEnd={() => {
        setDraggingTileId(null);
        setDragOverTileId(null);
      }}
      onClick={() => handleTileClick(tile)}
      className={`relative rounded-[2.5rem] shadow-lg border-4 flex flex-col items-center justify-center p-4 transition-all ${
        mode === 'edit'
          ? 'bg-amber-50 border-amber-300 cursor-move'
          : 'bg-white border-white active:scale-95 cursor-pointer hover:shadow-2xl'
      } ${
        mode === 'edit' && dragOverTileId === tile.id
          ? 'ring-8 ring-indigo-400 border-indigo-400 shadow-2xl'
          : ''
      }`}
    >
      {mode === 'edit' && (
        <button
          onClick={(e) => deleteTile(tile.id, e)}
          className="absolute -top-2 -right-2 w-8 h-8 bg-red-500 text-white rounded-full flex items-center justify-center shadow-lg z-50 font-black"
        >
          ✕
        </button>
      )}

      <div className="w-full flex-1 min-h-0 flex items-center justify-center">
        {tile.imageUrl ? (
          <img
            src={tile.imageUrl}
            className="w-full h-full object-contain pointer-events-none"
          />
        ) : (
          <svg className="w-16 h-16 text-slate-200" fill="currentColor" viewBox="0 0 24 24">
            <path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z" />
          </svg>
        )}
      </div>

      {mode === 'edit' ? (
        <input
          type="text"
          value={tile.text}
          onClick={e => e.stopPropagation()}
          onChange={e => handleTextChange(tile.id, e.target.value)}
          className="font-black text-indigo-600 text-xl mt-2 w-full text-center bg-white/50 rounded-lg border-b-2 border-indigo-200 outline-none"
        />
      ) : (
        <span className="font-black text-2xl mt-2 text-center">
          {tile.text}
        </span>
      )}
    </div>
  ))}

  {Array.from({ length: Math.max(0, TILES_PER_PAGE - visibleTiles.length) }).map((_, i) => (
    <div
      key={`empty-${i}`}
      className="rounded-[2.5rem] bg-slate-50/50 border-4 border-dashed border-slate-200"
    />
  ))}
</main>


    {/* Right Sidebar */}
    <aside
      className="flex-shrink-0 flex flex-col gap-4 p-4 border-l border-slate-200 bg-white/50"
      style={{ width: SIDEBAR_W }}
    >
      <button
        onClick={() => handleTileClick(NO_TILE)}
        className="w-full overflow-hidden bg-white rounded-[2rem] shadow-xl border-8 border-red-500 flex flex-col items-center justify-center active:scale-95 transition-all
                   h-[clamp(160px,22vh,280px)]"
      >
        <img
          src={NO_TILE.imageUrl}
          className="max-h-[56%] max-w-[80%] object-contain mb-2 pointer-events-none"
        />
        <span className="font-black text-red-600 text-3xl lg:text-4xl leading-none">不</span>
      </button>

      <div className="flex-grow flex flex-col gap-2">
        <button
          disabled={currentPage === 0}
          onClick={() => setCurrentPage(p => p - 1)}
          className="flex-1 bg-indigo-600 text-white rounded-2xl flex items-center justify-center disabled:opacity-20 shadow-lg active:scale-95 hover:bg-indigo-700 transition-all font-bold text-3xl"
        >
          ↑
        </button>
        <button
          disabled={currentPage >= totalPages - 1}
          onClick={() => setCurrentPage(p => p + 1)}
          className="flex-1 bg-indigo-600 text-white rounded-2xl flex items-center justify-center disabled:opacity-20 shadow-lg active:scale-95 hover:bg-indigo-700 transition-all font-bold text-3xl"
        >
          ↓
        </button>
      </div>

      <button
        onClick={() => changeBoard('next')}
        className="h-[11vh] bg-indigo-50 text-indigo-700 rounded-2xl border-4 border-indigo-200 flex items-center justify-center active:scale-95 hover:bg-indigo-100 transition-colors"
      >
        <span className="text-[32px] font-black">&gt;&gt;</span>
      </button>
    </aside>
  </div>
)}


      {/* Footer Area */}
      <footer className="h-[10vh] bg-white border-t border-slate-100 flex items-center justify-between px-12 z-40">
        <div className="text-sm font-black text-slate-400">
          目前版面：{activeBoard.name} (頁 {currentPage + 1}/{totalPages})
        </div>
        
        {mode === 'edit' ? (
          <div className="flex gap-2">
            <button onClick={deleteCurrentBoard} className="bg-rose-500 text-white px-4 py-2 rounded-xl text-xs font-bold hover:bg-rose-600 transition-colors shadow-sm">刪除此版面</button>
            <button onClick={addNewBoard} className="bg-emerald-500 text-white px-4 py-2 rounded-xl text-xs font-bold hover:bg-emerald-600 transition-colors shadow-sm">新增版面</button>
            <button onClick={addNewTile} className="bg-sky-500 text-white px-4 py-2 rounded-xl text-xs font-bold hover:bg-sky-600 transition-colors shadow-sm">新增詞彙</button>
            <button onClick={importSettings} className="bg-slate-800 text-white px-4 py-2 rounded-xl text-xs font-bold hover:bg-black transition-colors shadow-sm">匯入設定</button>
            <button onClick={exportSettings} className="bg-indigo-600 text-white px-4 py-2 rounded-xl text-xs font-bold hover:bg-indigo-700 transition-colors shadow-sm">匯出備份</button>
            <button onClick={() => setMode('standard')} className="bg-green-600 text-white px-8 py-2 rounded-xl text-xs font-bold hover:bg-green-700 transition-colors shadow-sm">完成儲存</button>
          </div>
        ) : (
          <div className="text-[10px] font-bold text-slate-300">
            邱彥慈 語言治療師 製作
          </div>
        )}
      </footer>
    </div>
  );
};

export default App;
