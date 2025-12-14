
import React, { useState, useEffect, useRef, useMemo } from 'react';
import { ChevronLeft, ThumbsUp, ThumbsDown, RefreshCw, Play, Settings2, Users, CreditCard, Share2, Trophy, Clock, ShieldCheck, Monitor, EyeOff } from 'lucide-react';
import { generateCharadesWords } from '../services/geminiService';
import { syncService } from '../services/syncService';
import { CharadesGameState, CharadesTeam, CharadesCard, GamePhase, GameNotification } from '../types';

// --- Configuration Constants ---
const CATEGORIES = ["Movies", "Animals", "Jobs", "Actions", "Famous People", "Objects", "Emotions", "Cartoon Characters"];
const TEAM_COLORS = ["#EC4899", "#3B82F6", "#10B981", "#F59E0B"]; // Pink, Blue, Green, Orange

// --- Helper Components ---

const NotificationToast: React.FC<{ notifications: GameNotification[] }> = ({ notifications }) => (
  <div className="fixed top-4 left-1/2 -translate-x-1/2 z-[100] flex flex-col gap-2 w-full max-w-sm px-4 pointer-events-none">
    {notifications.map(n => (
      <div key={n.id} className={`p-4 rounded-xl shadow-xl flex items-center justify-center font-bold text-white animate-in slide-in-from-top-2 fade-in ${
        n.type === 'success' ? 'bg-emerald-500' : n.type === 'error' ? 'bg-rose-500' : 'bg-blue-600'
      }`}>
        {n.message}
      </div>
    ))}
  </div>
);

// --- View Components ---

/**
 * Host View: Controls the timer validation and game flow.
 */
const HostView: React.FC<{ gameState: CharadesGameState; onValidate: (result: 'guessed' | 'skipped') => void }> = ({ gameState, onValidate }) => {
  const activeCard = gameState.cards.find(c => c.id === gameState.activeCardId);
  const activeTeam = gameState.teams[gameState.currentTeamIndex];

  return (
    <div className="flex flex-col h-full bg-slate-900 text-white p-4 sm:p-6">
      <div className="flex items-center justify-between mb-4 border-b border-white/10 pb-4">
        <div className="flex items-center gap-2">
            <ShieldCheck className="text-emerald-400" size={20} />
            <h1 className="font-bold uppercase tracking-widest text-xs sm:text-sm text-gray-400">Host Control</h1>
        </div>
        <div className="font-mono text-lg font-bold bg-white/10 px-3 py-1 rounded-lg">Code: {gameState.roomId}</div>
      </div>

      {gameState.phase === 'board' && (
         <div className="flex-1 flex flex-col items-center justify-center text-center opacity-50">
            <p className="text-xl">Waiting for actor to select a card...</p>
         </div>
      )}

      {(gameState.phase === 'acting' || gameState.phase === 'waiting_for_host') && (
        <div className="flex-1 flex flex-col">
           <div className="text-center mb-6 flex-1 flex flex-col justify-center">
              <span className="text-gray-400 text-sm font-bold uppercase block mb-4">Current Word</span>
              <h2 className="text-4xl sm:text-6xl font-black text-white mb-6 leading-tight">{activeCard?.word}</h2>
              <div>
                <div className="inline-block px-4 py-2 rounded-full bg-white/10 text-sm font-bold" style={{ color: activeTeam.color }}>
                    {activeTeam.name} Acting
                </div>
              </div>
           </div>

           <div className="bg-black/30 rounded-3xl p-6 mb-6 flex flex-col items-center justify-center border border-white/10 shrink-0">
              <Clock className={`mb-2 ${gameState.timeLeft === 0 ? 'text-rose-500 animate-pulse' : 'text-blue-400'}`} />
              <div className={`text-6xl font-mono font-bold ${gameState.timeLeft === 0 ? 'text-rose-500' : 'text-white'}`}>
                {gameState.timeLeft}s
              </div>
              {gameState.timeLeft === 0 && (
                <p className="text-rose-400 font-bold uppercase tracking-widest text-xs mt-2 animate-pulse">Waiting for Ruling</p>
              )}
           </div>

           <div className="grid grid-cols-2 gap-4 mt-auto shrink-0 h-24">
              <button 
                onClick={() => onValidate('skipped')}
                className="bg-rose-500/20 border-2 border-rose-500 text-rose-500 rounded-2xl font-bold flex flex-col items-center justify-center gap-1 active:bg-rose-500 active:text-white transition-all hover:bg-rose-500/30"
              >
                <ThumbsDown /> Missed
              </button>
              <button 
                onClick={() => onValidate('guessed')}
                className="bg-emerald-500/20 border-2 border-emerald-500 text-emerald-500 rounded-2xl font-bold flex flex-col items-center justify-center gap-1 active:bg-emerald-500 active:text-white transition-all hover:bg-emerald-500/30"
              >
                <ThumbsUp /> Guessed
              </button>
           </div>
        </div>
      )}

      {gameState.phase === 'result' && (
        <div className="flex-1 flex items-center justify-center">
            <h2 className="text-3xl font-bold animate-pulse">Result Saved...</h2>
        </div>
      )}
    </div>
  );
};

/**
 * Spectator / Non-Actor View
 */
const PassiveView: React.FC<{ gameState: CharadesGameState; isSpectator: boolean }> = ({ gameState, isSpectator }) => {
  const activeTeam = gameState.teams[gameState.currentTeamIndex];

  return (
    <div className="flex flex-col h-full bg-slate-900 text-white p-6 justify-center items-center text-center">
      <div className="mb-8 absolute top-6">
        <h2 className="text-gray-400 text-xs font-bold uppercase tracking-[0.2em] mb-2 flex items-center justify-center gap-2">
            {isSpectator ? <Monitor size={14} /> : <Users size={14} />} {isSpectator ? 'Spectator Mode' : 'Player View'}
        </h2>
        {isSpectator && (
            <div className="inline-block px-3 py-1 bg-white/10 rounded-full font-mono text-xs">
            Room: {gameState.roomId}
            </div>
        )}
      </div>

      {gameState.phase === 'board' && (
        <div className="animate-in fade-in">
          <h2 className="text-2xl font-bold mb-4">Waiting for {activeTeam.name}...</h2>
          <div className="mt-8 p-6 bg-white/10 rounded-2xl border border-white/5">
            <p className="text-gray-300 text-sm mb-2 uppercase tracking-wider">Up Next</p>
            <p className="text-4xl font-black" style={{ color: activeTeam.color }}>{activeTeam.name}</p>
          </div>
        </div>
      )}

      {(gameState.phase === 'acting' || gameState.phase === 'waiting_for_host') && (
        <div className="w-full max-w-md animate-in zoom-in duration-300">
           <div className="p-8 rounded-[40px] border-4 bg-black relative overflow-hidden shadow-2xl" style={{ borderColor: activeTeam.color }}>
              <div className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm"></div>
              <div className="relative z-10">
                <p className="text-gray-400 font-bold uppercase mb-4">Acting Now</p>
                <h2 className="text-4xl font-black mb-8" style={{ color: activeTeam.color }}>{activeTeam.name}</h2>
                
                <div className="bg-slate-800 rounded-2xl p-4 mb-4">
                    <EyeOff size={32} className="mx-auto text-gray-500 mb-2" />
                    <p className="text-xl font-bold text-white">Guessing...</p>
                </div>

                <div className={`text-6xl font-mono font-bold ${gameState.timeLeft < 10 ? 'text-rose-500 animate-pulse' : 'text-white'}`}>
                    {gameState.timeLeft}s
                </div>
              </div>
           </div>
        </div>
      )}

      {gameState.phase === 'result' && (
        <div className="w-full max-w-md animate-in slide-in-from-bottom-10">
          <div className={`p-8 rounded-[40px] ${gameState.lastResult === 'guessed' ? 'bg-emerald-500' : 'bg-rose-500'}`}>
             <h2 className="text-4xl font-black mb-4 text-white">{gameState.lastResult === 'guessed' ? 'CORRECT!' : 'MISSED'}</h2>
          </div>
        </div>
      )}
    </div>
  );
};


// --- Main Component ---

const Charades: React.FC<{ onBack: () => void; isSpectator?: boolean }> = ({ onBack, isSpectator = false }) => {
  // --- Local State ---
  const [category, setCategory] = useState("Movies");
  const [customCategory, setCustomCategory] = useState("");
  const [numCards, setNumCards] = useState(12);
  const [roundDuration, setRoundDuration] = useState(60);
  const [teams, setTeams] = useState<CharadesTeam[]>([
    { id: '1', name: 'Team 1', score: 0, color: TEAM_COLORS[0] },
    { id: '2', name: 'Team 2', score: 0, color: TEAM_COLORS[1] }
  ]);
  const [isLoading, setIsLoading] = useState(false);
  const [gameRole, setGameRole] = useState<'host' | 'player' | 'spectator' | 'setup'>('setup');
  const [notifications, setNotifications] = useState<GameNotification[]>([]);
  
  // Persistent Player ID for this session
  const [playerId] = useState(() => {
    const existing = sessionStorage.getItem('ppb_player_id');
    if (existing) return existing;
    const newId = Math.random().toString(36).substring(2) + Date.now().toString(36);
    sessionStorage.setItem('ppb_player_id', newId);
    return newId;
  });

  // --- Sync State ---
  const [gameState, setGameState] = useState<CharadesGameState | null>(null);
  const timerRef = useRef<number | null>(null);

  // --- Helpers ---
  const addNotification = (message: string, type: 'info' | 'success' | 'error' = 'info') => {
      const id = Date.now().toString();
      setNotifications(prev => [...prev, { id, message, type }]);
      setTimeout(() => {
          setNotifications(prev => prev.filter(n => n.id !== id));
      }, 3000);
  };

  // --- Initialization & Routing ---
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const gameId = params.get('gameId');
    const roleParam = params.get('role');

    if (gameId) {
       // Firebase Subscription
       const unsubscribe = syncService.subscribe(gameId, (newState) => {
          if (!newState) {
              addNotification("Game room closed or invalid", "error");
              return;
          }
          
          setGameState(prev => {
              // Notification Logic for State Transitions
              if (prev?.phase === 'acting' && newState.phase === 'result') {
                  if (newState.lastResult === 'guessed') {
                      addNotification("Correct!", "success");
                      if (navigator.vibrate) navigator.vibrate([100, 50, 100]);
                  }
                  else {
                      addNotification("Missed", "error");
                      if (navigator.vibrate) navigator.vibrate(200);
                  }
              }
              if (prev?.phase === 'board' && newState.phase === 'acting') {
                   // Vibrate start
                   if (navigator.vibrate) navigator.vibrate(200);
              }
              return newState;
          });
       });

       if (roleParam === 'host') setGameRole('host');
       else if (roleParam === 'spectator' || isSpectator) setGameRole('spectator');
       else setGameRole('player');
       
       return () => {
         if (unsubscribe) unsubscribe();
       };
    }
  }, [isSpectator]);

  // --- Host Logic: Timer Authority ---
  // Only the host machine updates the timer in Firebase
  useEffect(() => {
    if (gameRole !== 'host' || !gameState) return;

    if (gameState.phase === 'acting' && gameState.timeLeft > 0) {
      timerRef.current = window.setTimeout(() => {
        syncService.updateState(gameState.roomId, { timeLeft: gameState.timeLeft - 1 });
      }, 1000);
    } else if (gameState.phase === 'acting' && gameState.timeLeft === 0) {
      // Time is up! Move to Waiting for Host
      syncService.updateState(gameState.roomId, { phase: 'waiting_for_host' });
      addNotification("Time's Up! Waiting for validation.", "error");
    }

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [gameState?.phase, gameState?.timeLeft, gameRole]);


  // --- Actions ---

  const generateRoomCode = () => {
      const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ";
      let result = '';
      for (let i = 0; i < 4; i++) {
        result += chars.charAt(Math.floor(Math.random() * chars.length));
      }
      return result;
  };

  const handleCreateGame = async () => {
    setIsLoading(true);
    const cat = customCategory || category;
    const words = await generateCharadesWords(cat, numCards);
    
    const roomId = generateRoomCode();
    const newCards: CharadesCard[] = words.map((w, i) => ({
      id: `card-${i}`,
      word: w,
      status: 'hidden'
    }));

    const initialState: CharadesGameState = {
      roomId,
      phase: 'board',
      teams,
      currentTeamIndex: 0,
      cards: newCards,
      activeCardId: null,
      timeLeft: roundDuration,
      lastResult: null,
      category: cat,
      roundDuration
    };

    const success = await syncService.createRoom(roomId, initialState);
    
    if (success) {
        setGameState(initialState);
        // Set self as Host
        const newUrl = new URL(window.location.href);
        newUrl.searchParams.set('gameId', roomId);
        newUrl.searchParams.set('role', 'host');
        window.history.pushState({}, '', newUrl);
        setGameRole('host');
    } else {
        addNotification("Failed to create room. Check network.", "error");
    }
    
    setIsLoading(false);
  };

  const handleCardClick = (cardId: string) => {
    if (!gameState) return;
    // Only allow selection in board phase
    if (gameState.phase !== 'board') return;

    syncService.updateState(gameState.roomId, {
      phase: 'acting',
      activeCardId: cardId,
      actorId: playerId, // Claim actor role
      timeLeft: gameState.roundDuration,
      cards: gameState.cards.map(c => c.id === cardId ? { ...c, status: 'active' } : c)
    });
  };

  // Host Only
  const handleHostValidation = (result: 'guessed' | 'skipped') => {
    if (!gameState) return;

    const updatedTeams = gameState.teams.map((t, i) => {
      if (i === gameState.currentTeamIndex && result === 'guessed') {
        return { ...t, score: t.score + 1 };
      }
      return t;
    });

    const updatedCards = gameState.cards.map(c => 
      c.id === gameState.activeCardId ? { ...c, status: result } : c
    );

    syncService.updateState(gameState.roomId, {
      phase: 'result',
      lastResult: result,
      teams: updatedTeams,
      cards: updatedCards
    });

    // Auto transition after result
    setTimeout(() => {
        // Check if all cards done
        const allDone = updatedCards.every(c => c.status === 'guessed' || c.status === 'skipped');
        if (allDone) {
             syncService.updateState(gameState.roomId, { phase: 'summary' });
        } else {
            const nextIndex = (gameState.currentTeamIndex + 1) % gameState.teams.length;
            syncService.updateState(gameState.roomId, {
                phase: 'board',
                currentTeamIndex: nextIndex,
                activeCardId: null,
                timeLeft: gameState.roundDuration
            });
        }
    }, 3000);
  };

  const copyLink = (role: 'player' | 'spectator') => {
    const url = new URL(window.location.href);
    url.searchParams.set('role', role);
    url.searchParams.set('gameId', gameState?.roomId || ''); 
    navigator.clipboard.writeText(url.toString());
    addNotification(`${role === 'player' ? 'Player' : 'Spectator'} link copied!`, "success");
  };

  // --- Dynamic Grid Calculation ---
  const gridStyle = useMemo(() => {
    if (!gameState) return {};
    const count = gameState.cards.length;
    // Layout logic to ensure cards fit in view height
    // We subtract header height (~60px) and padding from 100vh
    let cols = 3;
    if (count <= 4) cols = 2;
    else if (count <= 9) cols = 3;
    else if (count <= 16) cols = 4;
    else cols = 5;

    return {
       display: 'grid',
       gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))`,
       gap: '0.75rem',
       height: 'calc(100vh - 140px)', // Fixed height container
       alignContent: 'stretch' 
    };
  }, [gameState?.cards.length]);


  // --- RENDERERS ---

  if (isLoading) {
    return (
      <div className="h-full flex flex-col items-center justify-center bg-[#8B5CF6] text-white">
        <RefreshCw className="animate-spin mb-4" size={40} />
        <h2 className="text-xl font-bold">Creating Game Room...</h2>
      </div>
    );
  }

  // 1. SETUP (New Game)
  if (gameRole === 'setup') {
    return (
      <div className="flex flex-col h-full bg-[#8B5CF6] text-white overflow-hidden">
        <div className="flex items-center p-6 pb-2">
           <button onClick={onBack} className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center hover:bg-white/30"><ChevronLeft /></button>
           <h1 className="text-2xl font-bold ml-4 game-font">New Game</h1>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-6">
           {/* Section 1: Teams */}
           <div className="bg-purple-800/40 p-5 rounded-2xl border border-purple-500/30">
              <div className="flex justify-between items-center mb-4">
                  <h3 className="font-bold uppercase tracking-wider text-sm flex items-center gap-2"><Users size={16}/> Teams</h3>
                  <div className="flex gap-2">
                     <button 
                        onClick={() => teams.length > 1 && setTeams(prev => prev.slice(0, -1))}
                        className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20"
                     >-</button>
                     <button 
                        onClick={() => teams.length < 4 && setTeams(prev => [...prev, { id: Date.now().toString(), name: `Team ${prev.length + 1}`, score: 0, color: TEAM_COLORS[prev.length] }])}
                        className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20"
                     >+</button>
                  </div>
              </div>
              <div className="space-y-3">
                 {teams.map((t, idx) => (
                    <div key={idx} className="flex gap-2">
                       <div className="w-4 rounded-full" style={{ backgroundColor: t.color }}></div>
                       <input 
                         value={t.name}
                         onChange={(e) => {
                            const newTeams = [...teams];
                            newTeams[idx].name = e.target.value;
                            setTeams(newTeams);
                         }}
                         className="flex-1 bg-white/10 rounded-lg px-4 py-2 outline-none focus:bg-white/20"
                       />
                    </div>
                 ))}
              </div>
           </div>

           {/* Section 2: Cards */}
           <div className="bg-purple-800/40 p-5 rounded-2xl border border-purple-500/30">
               <h3 className="font-bold uppercase tracking-wider text-sm flex items-center gap-2 mb-4"><CreditCard size={16}/> Deck Size: {numCards}</h3>
               <input 
                 type="range" min="4" max="24" step="2"
                 value={numCards}
                 onChange={(e) => setNumCards(Number(e.target.value))}
                 className="w-full h-2 bg-purple-900 rounded-lg appearance-none cursor-pointer accent-white"
               />
               <div className="flex justify-between text-xs text-purple-200 mt-2 font-mono">
                  <span>4 Cards</span>
                  <span>24 Cards</span>
               </div>
           </div>

           {/* Section 3: Topic */}
           <div className="bg-purple-800/40 p-5 rounded-2xl border border-purple-500/30">
               <h3 className="font-bold uppercase tracking-wider text-sm flex items-center gap-2 mb-4"><Settings2 size={16}/> Topic</h3>
               <div className="flex flex-wrap gap-2 mb-4">
                   {CATEGORIES.map(cat => (
                       <button 
                         key={cat}
                         onClick={() => {setCategory(cat); setCustomCategory("")}}
                         className={`px-3 py-2 rounded-lg text-xs font-bold transition-all ${category === cat && !customCategory ? 'bg-white text-purple-600' : 'bg-purple-900/50'}`}
                       >
                           {cat}
                       </button>
                   ))}
               </div>
               <input 
                 placeholder="Or type custom topic..."
                 value={customCategory}
                 onChange={(e) => setCustomCategory(e.target.value)}
                 className="w-full bg-transparent border-b border-purple-400/50 py-2 outline-none font-bold placeholder:text-purple-300/50"
               />
           </div>
        </div>

        <div className="p-6 bg-gradient-to-t from-[#8B5CF6] to-transparent">
          <button onClick={handleCreateGame} className="w-full py-4 bg-white text-purple-600 rounded-2xl font-bold text-xl shadow-xl flex items-center justify-center gap-2 active:scale-95 transition-transform">
            Generate Game <Play size={20} fill="currentColor" />
          </button>
        </div>
      </div>
    );
  }

  // Waiting for connection
  if (!gameState) {
    return (
        <div className="h-full flex flex-col items-center justify-center bg-slate-900 text-white p-6 text-center">
            <RefreshCw className="animate-spin mb-4" size={40} />
            <h2 className="text-xl font-bold">Connecting to Room...</h2>
        </div>
    );
  }

  // Common UI Wrapper
  return (
    <div className="h-full relative overflow-hidden">
      <NotificationToast notifications={notifications} />

      {/* 2. SPECTATOR MODE OR PASSIVE PLAYER */}
      {gameRole === 'spectator' && <PassiveView gameState={gameState} isSpectator={true} />}

      {/* 3. HOST MODE */}
      {gameRole === 'host' && (
        <div className="flex flex-col h-full">
            <HostView gameState={gameState} onValidate={handleHostValidation} />
            {/* Host Actions Footer */}
            {gameState.phase !== 'summary' && (
              <div className="bg-slate-800 p-4 border-t border-white/10 flex justify-center gap-4">
                  <button onClick={() => copyLink('player')} className="px-4 py-2 bg-white/10 rounded-full text-xs font-bold text-gray-300 flex items-center gap-2 hover:bg-white/20">
                      <Share2 size={12} /> Copy Player Link
                  </button>
                  <button onClick={() => copyLink('spectator')} className="px-4 py-2 bg-white/10 rounded-full text-xs font-bold text-gray-300 flex items-center gap-2 hover:bg-white/20">
                      <Monitor size={12} /> Copy Spectator Link
                  </button>
              </div>
            )}
        </div>
      )}

      {/* 4. PLAYER MODE (Board & Actor) */}
      {gameRole === 'player' && (
        <>
           {/* Header Bar */}
           <div className="h-14 flex items-center justify-between px-6 bg-[#8B5CF6] text-white shadow-sm z-10 relative">
               <div className="flex items-center gap-2">
                   <div className="w-3 h-3 rounded-full" style={{ backgroundColor: gameState.teams[gameState.currentTeamIndex].color }}></div>
                   <span className="font-bold truncate max-w-[120px]">{gameState.teams[gameState.currentTeamIndex].name} Turn</span>
               </div>
               <div className="font-mono font-bold bg-black/20 px-3 py-1 rounded-full text-sm">
                   Score: {gameState.teams[gameState.currentTeamIndex].score}
               </div>
           </div>

           {/* MAIN GAMEPLAY AREA */}
           <div className="flex-1 bg-slate-100 p-4 overflow-hidden relative">
              
              {/* BOARD PHASE */}
              {gameState.phase === 'board' && (
                  <div style={gridStyle} className="animate-in fade-in zoom-in duration-300 w-full max-w-lg mx-auto">
                      {gameState.cards.map((card) => (
                        <button
                            key={card.id}
                            disabled={card.status !== 'hidden'}
                            onClick={() => handleCardClick(card.id)}
                            className={`rounded-xl flex items-center justify-center relative shadow-sm transition-all active:scale-95 ${
                                card.status === 'hidden' 
                                ? 'bg-white text-[#8B5CF6] hover:shadow-md border-b-4 border-gray-200 hover:-translate-y-1' 
                                : 'bg-gray-200 border-none'
                            }`}
                        >
                            {card.status === 'hidden' ? (
                                <span className="text-xl font-black opacity-20">?</span>
                            ) : (
                                <div className={`absolute inset-0 rounded-xl flex items-center justify-center ${
                                    card.status === 'guessed' ? 'bg-emerald-500/80 text-white' : 'bg-rose-500/80 text-white'
                                }`}>
                                    {card.status === 'guessed' ? <ThumbsUp size={20} /> : <ThumbsDown size={20} />}
                                </div>
                            )}
                        </button>
                      ))}
                  </div>
              )}

              {/* ACTING PHASE (Actor View OR Passive View) */}
              {(gameState.phase === 'acting' || gameState.phase === 'waiting_for_host') && (
                 <>
                   {/* If I am the actor, I see the word */}
                   {gameState.actorId === playerId ? (
                     <div className="absolute inset-0 bg-slate-900 text-white flex flex-col items-center justify-center p-6 animate-in slide-in-from-bottom">
                        <div className="w-full max-w-md bg-white text-slate-900 rounded-[3rem] aspect-[4/5] flex flex-col items-center justify-center p-8 text-center shadow-2xl relative overflow-hidden">
                            {/* Timer Overlay */}
                            <div className="absolute top-0 w-full bg-slate-900 py-3 text-white font-mono font-bold text-xl">
                                {gameState.timeLeft}s
                            </div>
                            
                            <p className="text-gray-400 font-bold uppercase tracking-widest text-sm mb-4 mt-8">Your Word</p>
                            <h2 className="text-5xl font-black break-words leading-tight">{gameState.cards.find(c => c.id === gameState.activeCardId)?.word}</h2>
                            
                            {gameState.phase === 'waiting_for_host' && (
                                <div className="absolute inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-6">
                                    <div className="text-white text-center">
                                        <Clock size={48} className="mx-auto mb-4 text-rose-500 animate-pulse" />
                                        <h3 className="text-2xl font-bold">Time's Up!</h3>
                                        <p className="text-gray-400">Waiting for Host validation...</p>
                                    </div>
                                </div>
                            )}
                        </div>
                     </div>
                   ) : (
                     /* If I am NOT the actor, I see the passive view */
                     <div className="absolute inset-0">
                        <PassiveView gameState={gameState} isSpectator={false} />
                     </div>
                   )}
                 </>
              )}

               {/* RESULT OVERLAY */}
               {gameState.phase === 'result' && (
                  <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm animate-in fade-in">
                      <div className="text-center">
                          <h1 className={`text-5xl font-black mb-4 ${gameState.lastResult === 'guessed' ? 'text-emerald-400' : 'text-rose-400'}`}>
                              {gameState.lastResult === 'guessed' ? 'NICE!' : 'MISSED'}
                          </h1>
                          <p className="text-white text-xl font-bold opacity-60">Prepare for next round...</p>
                      </div>
                  </div>
              )}
           </div>
        </>
      )}

      {/* 5. SUMMARY SCREEN (Shared) */}
      {gameState.phase === 'summary' && (
         <div className="absolute inset-0 bg-[#8B5CF6] text-white flex flex-col items-center justify-center p-6 text-center z-[60]">
             <Trophy size={64} className="text-yellow-300 mb-6 animate-bounce" />
             <h1 className="text-4xl font-black mb-8 game-font">Game Over!</h1>
             
             <div className="w-full max-w-sm space-y-4 mb-8">
                 {[...gameState.teams].sort((a,b) => b.score - a.score).map((team, idx) => (
                     <div key={team.id} className="bg-white/10 p-4 rounded-2xl flex justify-between items-center border border-white/10">
                        <div className="flex items-center gap-3">
                             {idx === 0 && <span className="text-2xl">👑</span>}
                             <span className="font-bold text-lg" style={{ color: team.color }}>{team.name}</span>
                        </div>
                        <span className="text-3xl font-bold">{team.score}</span>
                     </div>
                 ))}
             </div>

             {gameRole === 'host' && (
               <button 
                 onClick={() => {
                   setGameState(null);
                   setGameRole('setup');
                   // Reset URL
                   window.history.pushState({}, '', window.location.pathname);
                 }}
                 className="px-8 py-4 bg-white text-purple-600 rounded-full font-bold shadow-xl active:scale-95 transition-transform"
               >
                  Play New Game
               </button>
             )}
         </div>
      )}
    </div>
  );
};

export default Charades;
