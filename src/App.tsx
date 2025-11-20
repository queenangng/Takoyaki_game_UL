import React, { useState, useEffect, useCallback, useRef } from 'react';
// 移除導致錯誤的 lucide-react 引用
// import { Timer, Trophy, RotateCw, Utensils, Flame, CircleDashed, ShoppingBag } from 'lucide-react'; 

// --- 內建圖標組件 (免安裝 lucide-react) ---
// 為了確保複製即用，這裡直接內建圖標 SVG
const IconBase = ({ size = 24, className = "", children }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>{children}</svg>
);
const TrophyIcon = (p) => <IconBase {...p}><path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6"/><path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18"/><path d="M4 22h16"/><path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22"/><path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22"/><path d="M18 2H6v7a6 6 0 0 0 12 0V2Z"/></IconBase>;
const TimerIcon = (p) => <IconBase {...p}><line x1="10" x2="14" y1="2" y2="2"/><line x1="12" x2="15" y1="14" y2="11"/><circle cx="12" cy="14" r="8"/></IconBase>;
const FlameIcon = (p) => <IconBase {...p}><path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.1.2-2.2.5-3 .5.3 1 .8 1 1.5z"/></IconBase>;
const UtensilsIcon = (p) => <IconBase {...p}><path d="M3 2v7c0 1.1.9 2 2 2h4a2 2 0 0 0 2-2V2"/><path d="M7 2v20"/><path d="M21 15V2v0a5 5 0 0 0-5 5v6c0 1.1.9 2 2 2h3Zm0 0v7"/></IconBase>;
const CircleDashedIcon = (p) => <IconBase {...p}><path d="M10.1 2.182a10 10 0 0 1 3.8 0"/><path d="M17.609 3.694a10 10 0 0 1 2.696 2.695"/><path d="M21.818 10.1a10 10 0 0 1 0 3.8"/><path d="M20.306 17.609a10 10 0 0 1-2.695 2.696"/><path d="M13.9 21.818a10 10 0 0 1-3.8 0"/><path d="M6.391 20.306a10 10 0 0 1-2.696-2.695"/><path d="M2.182 13.9a10 10 0 0 1 0-3.8"/><path d="M3.694 6.391a10 10 0 0 1 2.695-2.696"/></IconBase>;
const RotateCwIcon = (p) => <IconBase {...p}><path d="M21 12a9 9 0 1 1-9-9c2.52 0 4.93 1 6.74 2.74L21 8"/><path d="M21 3v5h-5"/></IconBase>;
const ShoppingBagIcon = (p) => <IconBase {...p}><path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z"/><path d="M3 6h18"/><path d="M16 10a4 4 0 0 1-8 0"/></IconBase>;

// 遊戲常數
const GAME_DURATION = 60;
const COOK_SPEED = 0.8;
const BURNT_THRESHOLD = 100;
const PERFECT_MIN = 75; 

// 狀態定義
const STATE_EMPTY = 'empty';
const STATE_BATTER = 'batter';
const STATE_TAKO = 'tako';
const STATE_COOKING = 'cooking';
const STATE_BURNT = 'burnt';

export default function App() {
  const [gameState, setGameState] = useState('menu');
  const [score, setScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(GAME_DURATION);
  const [selectedTool, setSelectedTool] = useState('batter');
  const [boxedItems, setBoxedItems] = useState([]); 
  
  const initialHoles = Array(9).fill(null).map((_, i) => ({
    id: i,
    status: STATE_EMPTY,
    progress: 0,
    flipCount: 0,
  }));

  const [holes, setHoles] = useState(initialHoles);
  const scoreRef = useRef(0);

  const vibrate = useCallback((pattern = 50) => {
    if (typeof navigator !== 'undefined' && navigator.vibrate) {
      try { navigator.vibrate(pattern); } catch (e) {}
    }
  }, []);

  useEffect(() => {
    let timerInterval;
    let gameLoopInterval;

    if (gameState === 'playing') {
      timerInterval = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            setGameState('finished');
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      gameLoopInterval = setInterval(() => {
        setHoles((currentHoles) => 
          currentHoles.map((hole) => {
            if (hole.status === STATE_TAKO || hole.status === STATE_COOKING) {
              let newProgress = hole.progress + COOK_SPEED;
              if (newProgress >= BURNT_THRESHOLD) {
                return { ...hole, status: STATE_BURNT, progress: 100 };
              }
              return { ...hole, progress: newProgress };
            }
            return hole;
          })
        );
      }, 100);
    }

    return () => {
      clearInterval(timerInterval);
      clearInterval(gameLoopInterval);
    };
  }, [gameState]);

  const startGame = () => {
    setHoles(initialHoles);
    setScore(0);
    scoreRef.current = 0;
    setTimeLeft(GAME_DURATION);
    setGameState('playing');
    setSelectedTool('batter');
    setBoxedItems([]); 
  };

  const handleInteraction = (index, e) => {
    if (e) { e.preventDefault(); e.stopPropagation(); }
    if (gameState !== 'playing') return;

    setHoles((prevHoles) => {
      const newHoles = [...prevHoles];
      const hole = newHoles[index];
      let actionSuccess = false;
      let pointsToAdd = 0;

      switch (selectedTool) {
        case 'batter':
          if (hole.status === STATE_EMPTY) {
            newHoles[index] = { ...hole, status: STATE_BATTER, progress: 0 };
            actionSuccess = true;
          }
          break;
        case 'tako':
          if (hole.status === STATE_BATTER) {
            newHoles[index] = { ...hole, status: STATE_TAKO, progress: 10 };
            actionSuccess = true;
          }
          break;
        case 'pick':
          if (hole.status === STATE_BURNT) {
            newHoles[index] = { ...hole, status: STATE_EMPTY, progress: 0, flipCount: 0 };
            pointsToAdd = -50;
            actionSuccess = true;
          } 
          else if ((hole.status === STATE_TAKO || hole.status === STATE_COOKING)) {
            if (hole.progress > 15) {
              newHoles[index] = { 
                ...hole, 
                status: STATE_COOKING, 
                progress: Math.max(25, hole.progress - 10),
                flipCount: hole.flipCount + 1 
              };
              actionSuccess = true;
            }
          }
          break;
        case 'box':
          if (hole.status === STATE_COOKING || hole.status === STATE_TAKO) {
            if (hole.progress >= PERFECT_MIN && hole.progress < BURNT_THRESHOLD) {
              const isPerfect = hole.progress >= 85;
              pointsToAdd = isPerfect ? 150 : 100;
              
              setBoxedItems(prev => [...prev, { id: Date.now(), isPerfect }].slice(-8));

              newHoles[index] = { ...hole, status: STATE_EMPTY, progress: 0, flipCount: 0 };
              actionSuccess = true;
            }
          }
          break;
      }

      if (actionSuccess) {
        vibrate(15);
        if (pointsToAdd !== 0) setScore(s => Math.max(0, s + pointsToAdd));
      }
      return newHoles;
    });
  };

  const renderOctopusPiece = () => (
    <div className="absolute z-10 animate-drop-in-fast pointer-events-none flex items-center justify-center inset-0">
      <div className="w-8 h-8 bg-[#E63946] rounded-md border-2 border-[#9D0208] shadow-sm transform rotate-12 flex items-center justify-center">
         <div className="w-3 h-3 bg-white rounded-full opacity-90 border border-[#E63946]/50 shadow-inner" />
      </div>
    </div>
  );

  const renderSingleTakoyaki = (status, progress, flipCount, isPerfectOverride = null, isStatic = false) => {
    if (status === STATE_EMPTY && !isStatic) return null;

    if (status === STATE_BURNT) {
      return (
        <div className="relative w-full h-full rounded-full bg-[#2d2d2d] scale-90 shadow-inner border-2 border-[#1a1a1a] flex items-center justify-center overflow-hidden animate-shake">
          <span className="text-red-500 text-xl font-bold z-10">焦</span>
          {!isStatic && <div className="absolute -top-8 left-1/2 -translate-x-1/2 w-6 h-10 bg-gray-700/30 blur-md rounded-full animate-smoke-rise delay-100" />}
        </div>
      );
    }

    let borderColorClass = 'border-[#E6D0A0]';
    // 使用 style 變數來控制顏色，避免 Tailwind JIT 編譯遺漏
    let bgColorStyle = '#F8E3B6'; // 預設顏色

    const currentProgress = isStatic ? (isPerfectOverride ? 90 : 80) : progress;
    const isPerfect = isPerfectOverride !== null ? isPerfectOverride : (currentProgress >= PERFECT_MIN && currentProgress < BURNT_THRESHOLD);

    // 根據狀態設定 HEX 顏色
    if (status === STATE_BATTER) { 
        bgColorStyle = '#FFF8E1'; // 麵糊白
        borderColorClass = 'border-[#F5E6C8]';
    } else if (currentProgress < 40) { 
        bgColorStyle = '#F8E3B6'; // 生
    } else if (currentProgress < 60) { 
        bgColorStyle = '#F3D18A'; // 半熟
        borderColorClass = 'border-[#E0BE75]'; 
    } else if (currentProgress < PERFECT_MIN) { 
        bgColorStyle = '#E8B75F'; // 快熟了
        borderColorClass = 'border-[#D4A34B]'; 
    } else { 
        bgColorStyle = '#D98E2E'; // 完美金黃
        borderColorClass = 'border-[#C27A22]'; 
    }
    
    const animationClass = isStatic ? 'animate-drop-in-bounce shadow-md' : (isPerfect ? 'animate-bounce-gentle' : (currentProgress > 60 ? 'animate-pulse-slow' : ''));

    return (
      <div 
        className={`relative w-full h-full rounded-full border-2 ${borderColorClass} scale-[0.97] transition-colors duration-300 shadow-[inset_0_-4px_6px_rgba(0,0,0,0.1)] overflow-hidden flex items-center justify-center ${animationClass}`}
        style={{ backgroundColor: bgColorStyle }} // [關鍵修復] 強制使用 inline style 上色
      >
        
        {/* 麵糊反光 */}
        {status === STATE_BATTER && (
           <div className="absolute top-2 left-2 w-3 h-1.5 bg-white/60 rounded-full blur-[1px]" />
        )}

        {!isStatic && status === STATE_TAKO && renderOctopusPiece()}
        {!isStatic && status === STATE_COOKING && (<div className="absolute w-6 h-6 bg-[#D62828] rounded-md opacity-40 transform rotate-45 blur-[1px]" />)}
        
        {flipCount > 0 && <div className="absolute bottom-2 right-2 w-4 h-3 bg-[#A05A1C]/30 rounded-full blur-[1px] rotate-12" />}
        
        {isPerfect && (
          <>
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_120%,rgba(0,0,0,0.1),transparent_70%)]" />
            <div className="absolute top-3 left-4 w-1 h-1 bg-[#2E590B] rounded-full opacity-80" />
            <div className="absolute bottom-3 right-4 w-1 h-1 bg-[#2E590B] rounded-full opacity-80" />
            <div className="absolute top-0 left-0 w-full h-full overflow-hidden opacity-80" style={{ transform: 'rotate(-15deg)' }}><div className="w-[120%] h-2 bg-[#4A2511] absolute top-2 -left-2 blur-[1px] rounded-full" /></div>
            <div className="absolute top-0 left-0 w-full h-full overflow-hidden opacity-70" style={{ transform: 'rotate(15deg)' }}><div className="w-[120%] h-1 bg-[#FFFFE0] absolute top-4 -left-2 blur-[0.5px]" /></div>
          </>
        )}
      </div>
    );
  };

  const ToolButton = ({ id, icon: Icon, label, colorTheme }) => {
    const isSelected = selectedTool === id;
    const themes = {
        yellow: { bg: 'bg-amber-100', border: 'border-amber-600', text: 'text-amber-900', icon: 'text-amber-600' },
        red:    { bg: 'bg-red-100',   border: 'border-red-600',   text: 'text-red-900',   icon: 'text-red-600' },
        blue:   { bg: 'bg-blue-100',  border: 'border-blue-600',  text: 'text-blue-900',  icon: 'text-blue-600' },
        green:  { bg: 'bg-green-100', border: 'border-green-600', text: 'text-green-900', icon: 'text-green-600' },
    };
    const theme = themes[colorTheme];

    return (
      <button
        type="button"
        onPointerDown={(e) => { e.preventDefault(); setSelectedTool(id); vibrate(10); }}
        className={`flex flex-col items-center justify-center p-2 rounded-xl transition-all transform active:scale-90 relative overflow-hidden select-none ${
          isSelected 
            ? `${theme.bg} border-b-4 ${theme.border} ${theme.text} shadow-md scale-105 -translate-y-1` 
            : 'bg-[#FAF3E0] border-b-2 border-[#D4C4A8] text-gray-600'
        }`}
        style={{ touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent' }}
      >
        <Icon size={26} className={`mb-1 z-10 pointer-events-none ${isSelected ? theme.icon : 'text-gray-500'}`} />
        <span className="text-xs font-bold z-10 tracking-wide pointer-events-none">{label}</span>
      </button>
    );
  };

  const MatsuriLantern = ({ className }) => (
    <svg className={className} viewBox="0 0 100 140" width="60" height="84">
      <path d="M20 10 h60 v5 h-60 z" fill="#333" />
      <path d="M10 15 h80 v110 h-80 z" fill="#E63946" stroke="#B91C1C" strokeWidth="2" />
      <path d="M20 125 h60 v5 h-60 z" fill="#333" />
      <path d="M10 35 h80 M10 55 h80 M10 75 h80 M10 95 h80 M10 115 h80" stroke="#B91C1C" strokeWidth="1" opacity="0.5" />
      <text x="50" y="75" textAnchor="middle" fill="#FFF" fontSize="40" fontFamily="serif" fontWeight="bold">祭</text>
    </svg>
  );

  return (
    <div className="min-h-screen bg-[#FDF6E3] text-gray-800 font-sans select-none flex flex-col max-w-md mx-auto shadow-2xl overflow-hidden relative border-x-2 border-[#E6D0A0]">
      
      <div className="absolute inset-0 opacity-10 bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI0MCIgaGVpZ2h0PSI0MCIgdmlld0JveD0iMCAwIDQwIDQwIj48ZyBmaWxsPSIjQzQzRTMxIiBmaWxsLW9wYWNpdHk9IjAuNCI+PHBhdGggZD0iTTIwIDIwYzAgNS41Mi00LjQ4IDEwLTEwIDEwUzAgMjUuNTIgMCAyMGgxMGMwLTUuNTIgNC40OC0xMCAxMC0xMHMxMCA0LjQ4IDEwIDEwaDEweiIvPjwvZz48L3N2Zz4=')] pointer-events-none" />

      <header className="bg-gradient-to-b from-[#C43E31] to-[#A62B1F] text-white p-4 pt-6 rounded-b-2xl shadow-lg z-30 relative overflow-hidden border-b-4 border-[#8B2319]">
        <div className="flex justify-between items-center relative z-10">
          <div className="flex items-center space-x-2 bg-[#8B2319] px-3 py-1.5 rounded-full border border-[#C43E31] shadow-sm">
            <TrophyIcon size={20} className="text-yellow-400" />
            <p className="text-xl font-bold font-mono tracking-tighter">{score}</p>
          </div>
          <h1 className="text-2xl font-extrabold tracking-widest absolute left-1/2 transform -translate-x-1/2 text-transparent bg-clip-text bg-gradient-to-b from-yellow-200 to-yellow-500 drop-shadow-[0_2px_2px_rgba(0,0,0,0.5)]" style={{ fontFamily: '"Noto Serif JP", serif' }}>
            築地章魚燒
          </h1>
          <div className="flex items-center space-x-2 bg-[#8B2319] px-3 py-1.5 rounded-full border border-[#C43E31] shadow-sm">
            <TimerIcon size={20} className={`${timeLeft < 10 ? 'text-red-300 animate-pulse' : 'text-white'}`} />
            <p className={`text-xl font-bold font-mono ${timeLeft < 10 ? 'text-yellow-300' : ''}`}>
              {timeLeft}
            </p>
          </div>
        </div>
      </header>

      <main className="flex-1 flex flex-col items-center justify-start p-4 relative z-10 w-full space-y-4">
        
        {gameState === 'menu' && (
          <div className="absolute inset-0 z-50 flex flex-col items-center justify-center text-center bg-[#FFF8E1] overflow-hidden">
            <div className="absolute top-0 left-0 right-0 h-32">
               <div className="absolute top-[-10px] left-0 right-0 h-[40px] border-b-4 border-[#5D4037] rounded-[50%] scale-x-150"></div>
               <MatsuriLantern className="absolute top-2 left-4 animate-swing" />
               <MatsuriLantern className="absolute top-12 right-8 animate-swing-delay" />
               <MatsuriLantern className="absolute top-4 left-1/2 -translate-x-1/2 scale-75 opacity-80 blur-[1px]" />
            </div>
            
            <div className="relative z-10 p-8 border-4 border-[#8B2319] rounded-lg bg-white shadow-2xl max-w-xs mx-auto">
               <div className="bg-gradient-to-br from-orange-400 to-red-500 p-6 rounded-full mb-6 shadow-xl mx-auto w-24 h-24 flex items-center justify-center border-4 border-orange-200">
                 <FlameIcon size={48} className="text-yellow-100" />
               </div>
               <h2 className="text-4xl font-black text-[#8B2319] mb-2 tracking-widest" style={{ fontFamily: '"Noto Serif JP", serif' }}>夏祭開幕</h2>
               <div className="w-full h-0.5 bg-[#E6D0A0] my-4"></div>
               <p className="text-[#5D4037] mb-8 font-medium text-sm leading-relaxed">
                 傳說中的職人技藝！<br/>
                 用竹籤挑起金黃色的美味，<br/>
                 挑戰最高營業額！
               </p>
               <button type="button" onClick={startGame} className="bg-[#C43E31] text-white w-full py-4 rounded-md text-xl font-bold shadow-[0_4px_0_#8B2319] active:shadow-none active:translate-y-1 transition-all border-2 border-[#8B2319] flex items-center justify-center gap-2">
                 <UtensilsIcon size={20} /> 開始營業
               </button>
            </div>
            
            <div className="absolute bottom-0 left-0 right-0 h-24 opacity-20 bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI0MCIgaGVpZ2h0PSIyMCIgdmlld0JveD0iMCAwIDQwIDQwIj48ZyBmaWxsPSIjQzQzRTMxIiBmaWxsLW9wYWNpdHk9IjAuNCI+PHBhdGggZD0iTTIwIDIwYzAgNS41Mi00LjQ4IDEwLTEwIDEwUzAgMjUuNTIgMCAyMGgxMGMwLTUuNTIgNC40OC0xMCAxMC0xMHMxMCA0LjQ4IDEwIDEwaDEweiIvPjwvZz48L3N2Zz4=')]"></div>
          </div>
        )}

        {gameState === 'finished' && (
          <div className="absolute inset-0 bg-[#2A150D]/90 backdrop-blur-md z-50 flex flex-col items-center justify-center text-center p-8 animate-fade-in">
            <ShoppingBagIcon size={64} className="text-yellow-400 mb-4 animate-bounce-gentle" />
            <h2 className="text-3xl font-bold text-white mb-2 tracking-widest">本日完售！</h2>
            <div className="bg-[#FFF8E1] rounded-2xl p-6 w-full max-w-xs mb-8 shadow-lg border-4 border-[#E6D0A0]">
              <p className="text-[#7A4F31] text-sm font-bold uppercase tracking-wide">營業額 (分數)</p>
              <p className="text-6xl font-black text-red-600 my-3 drop-shadow-sm">{score}</p>
            </div>
            <button type="button" onClick={startGame} className="bg-gradient-to-r from-green-500 to-green-600 text-white px-8 py-3 rounded-full text-lg font-bold shadow-lg border-b-4 border-green-800 hover:-translate-y-1 active:translate-y-0 active:border-b-0 transition-all w-full max-w-xs flex items-center justify-center gap-2 cursor-pointer"><RotateCwIcon size={20} /> 再來一局</button>
          </div>
        )}

        <div 
          className="bg-[#222] p-5 rounded-[2rem] shadow-[0_10px_30px_rgba(0,0,0,0.5),inset_0_2px_5px_rgba(255,255,255,0.2)] border-[6px] border-[#444] relative mt-2 select-none w-full max-w-xs mx-auto"
          style={{ touchAction: 'none' }} 
        >
          <div className="absolute top-2 left-1/2 transform -translate-x-1/2 text-[#333] font-black text-xs tracking-[0.2em] pointer-events-none">TAKOYAKI</div>
          <div className="grid grid-cols-3 gap-4 relative z-10">
            {holes.map((hole, index) => (
              <div
                key={hole.id}
                onPointerDown={(e) => handleInteraction(index, e)}
                className={`
                  w-20 h-20 rounded-full relative 
                  ${hole.status === STATE_EMPTY ? 'bg-[#1a1a1a] shadow-[inset_0_4px_8px_rgba(0,0,0,0.8)]' : 'bg-[#1a1a1a]'}
                  flex items-center justify-center cursor-pointer active:scale-90 active:brightness-125 transition-transform duration-75
                `}
                style={{ WebkitTapHighlightColor: 'transparent' }}
              >
                <div className="absolute -inset-2 rounded-full z-20" />
                {(hole.status === STATE_TAKO || hole.status === STATE_COOKING) && hole.progress < BURNT_THRESHOLD && (
                  <div className="absolute -top-4 opacity-30 animate-pulse pointer-events-none"><FlameIcon size={20} className="text-orange-400 blur-[2px]" /></div>
                )}
                {renderSingleTakoyaki(hole.status, hole.progress, hole.flipCount, null, false)}
              </div>
            ))}
          </div>
        </div>
        
        <div className="w-full max-w-xs mx-auto relative mt-4 h-28">
           <div className="absolute inset-x-0 bottom-0 h-24 bg-[#C17F45] rounded-b-[3rem] rounded-t-md border-4 border-[#8B4513] shadow-lg overflow-hidden">
             <div className="absolute inset-0 opacity-20 bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyMCIgaGVpZ2h0PSIxMCI+PHBhdGggZD0iTTAgMGgyMHYxMEgwWiIgZmlsbD0iI2EwNTgxYyIgZmlsbC1vcGFjaXR5PSIwLjIiLz48L3N2Zz4=')]"></div>
           </div>
           
           <div className="absolute inset-x-4 bottom-3 flex justify-center items-end flex-wrap-reverse gap-2 h-20">
             {boxedItems.map((item) => (
               <div key={item.id} className="w-12 h-12 flex-shrink-0 animate-drop-in-bounce">
                 {renderSingleTakoyaki('cooked', 100, 0, item.isPerfect, true)}
               </div>
             ))}
             {boxedItems.length === 0 && (
               <div className="text-[#8B4513] opacity-50 text-xs font-bold mb-8 w-full text-center">等待裝盤...</div>
             )}
           </div>
        </div>
      </main>

      <footer className="bg-[#F5E6C8] p-4 pb-8 rounded-t-3xl shadow-[0_-4px_20px_rgba(0,0,0,0.1)] z-20 border-t-4 border-[#E6D0A0] relative select-none" style={{ touchAction: 'none' }}>
        <div className="grid grid-cols-4 gap-3 max-w-sm mx-auto relative z-10">
          <ToolButton id="batter" icon={UtensilsIcon} label="麵糊" colorTheme="yellow" />
          <ToolButton id="tako" icon={CircleDashedIcon} label="章魚" colorTheme="red" />
          <ToolButton id="pick" icon={RotateCwIcon} label="翻轉" colorTheme="blue" />
          <ToolButton id="box" icon={ShoppingBagIcon} label="裝盒" colorTheme="green" />
        </div>
      </footer>

      <style>{`
        @keyframes fade-in { from { opacity: 0; } to { opacity: 1; } }
        @keyframes shake { 0%, 100% { transform: translateX(0) scale(0.9); } 25% { transform: translateX(-2px) scale(0.9); } 75% { transform: translateX(2px) scale(0.9); } }
        @keyframes smoke-rise { 0% { transform: translate(-50%, 0) scale(1); opacity: 0.6; } 100% { transform: translate(-50%, -20px) scale(2); opacity: 0; } }
        @keyframes bounce-gentle { 0%, 100% { transform: translateY(0) scale(0.97); } 50% { transform: translateY(-3px) scale(0.97); } }
        @keyframes pulse-slow { 0%, 100% { transform: scale(0.97); opacity: 1; } 50% { transform: scale(0.95); opacity: 0.9; } }
        @keyframes drop-in-fast { 0% { transform: scale(2) translateY(-20px); opacity: 0; } 100% { transform: scale(1) translateY(0); opacity: 1; } }
        @keyframes drop-in-bounce { 
          0% { transform: translateY(-50px) scale(0.5); opacity: 0; } 
          60% { transform: translateY(5px) scale(1.1); opacity: 1; } 
          80% { transform: translateY(-2px) scale(0.95); } 
          100% { transform: translateY(0) scale(1); } 
        }
        .animate-fade-in { animation: fade-in 0.3s ease-out forwards; }
        .animate-shake { animation: shake 0.4s ease-in-out infinite; }
        .animate-smoke-rise { animation: smoke-rise 1.5s ease-out infinite; }
        .animate-bounce-gentle { animation: bounce-gentle 2s ease-in-out infinite; }
        .animate-pulse-slow { animation: pulse-slow 3s ease-in-out infinite; }
        .animate-drop-in-fast { animation: drop-in-fast 0.2s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards; }
        .animate-drop-in-bounce { animation: drop-in-bounce 0.5s cubic-bezier(0.34, 1.56, 0.64, 1) forwards; }
      `}</style>
    </div>
  );
};
