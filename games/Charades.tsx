
import React, { useState, useEffect, useRef } from 'react';
import { ChevronLeft, ThumbsUp, ThumbsDown, RefreshCw, Play, Settings2, Users, CreditCard, Share2, Trophy, Clock, ShieldCheck, Monitor, EyeOff, XCircle, User, Zap, Check } from 'lucide-react';
import { generateCharadesWords } from '../services/geminiService';
import { syncService } from '../services/syncService';
import { CharadesGameState, CharadesTeam, CharadesCard, GameNotification } from '../types';

// --- Constants ---
const CATEGORIES = ["Movies", "Animals", "Jobs", "Actions", "Famous People", "Objects", "Emotions", "Cartoon Characters"];
const TEAM_COLORS = ["#EC4899", "#3B82F6", "#10B981", "#F59E0B"]; 

// --- Hooks ---
const useGameTimer = (roundEndsAt: number | null) => {
  const [timeLeft, setTimeLeft] = useState(0);

  useEffect(() => {
    if (!roundEndsAt) {
      setTimeLeft(0);
      return;
    }
    const tick = () => {
      const now = Date.now();
      const diff = Math.ceil((roundEndsAt - now) / 1000);
      setTimeLeft(diff > 0 ? diff : 0);
    };
    tick();
    const interval = setInterval(tick, 200);
    return () => clearInterval(interval);
  }, [roundEndsAt]);

  return timeLeft;
};

// --- Sub Components ---

const NotificationToast: React.FC<{ notifications: GameNotification[] }> = ({ notifications }) => (
  <div className="fixed top-16 left-1/2 -translate-x-1/2 z-[100] flex flex-col gap-2 w-full max-w-xs px-4 pointer-events-none">
    {notifications.map(n => (
      <div key={n.id} className={`p-3 rounded-lg shadow-lg flex items-center justify-center font-bold text-white text-sm animate-in slide-in-from-top-2 fade-in ${
        n.type === 'success' ? 'bg-emerald-500' : n.type === 'error' ? 'bg-rose-500' : 'bg-slate-800'
      }`}>
        {n.message}
      </div>
    ))}
  </div>
);

const HostController: React.FC<{ 
    gameState: CharadesGameState; 
    onValidate: (result: 'guessed' | 'skipped') => void;
    onCancel: () => void;
}> = ({ gameState, onValidate, onCancel }) => {
  const activeCard = gameState.cards.find(c => c.id === gameState.activeCardId);
  const activeTeam = gameState.teams[gameState.currentTeamIndex] || gameState.teams[0];
  const timeLeft = useGameTimer(gameState.roundEndsAt);

  return (
    <div className="flex flex-col h-full bg-slate-900 text-white p-4">
      <div className="flex items-center justify-between mb-4 border-b border-white/10 pb-4">
        <div className="flex items-center gap-2">
            <ShieldCheck className="text-emerald-400" size={20} />
            <h1 className="font-bold uppercase tracking-widest text-xs text-gray-400">Host Control</h1>
        </div>
        <div className="font-mono text-lg font-bold bg-white/10 px-3 py-1 rounded-lg tracking-wider">
           {gameState.roomId}
        </div>
      </div>

      {gameState.phase === 'board' && (
         <div className="flex-1 flex flex-col items-center justify-center text-center opacity-50 space-y-4">
            <div className="w-16 h-16 bg-white/10 rounded-full flex items-center justify-center">
                <Clock size={32} />
            </div>
            <p className="text-xl font-medium">Waiting for player to pick a card...</p>
            <div className="text-sm bg-white/10 px-4 py-2 rounded-full">
               Current Turn: <span style={{ color: activeTeam.color }}>{activeTeam.name}</span>
            </div>
         </div>
      )}

      {(gameState.phase === 'acting' || gameState.phase === 'waiting_for_host') && (
        <div className="flex-1 flex flex-col max-h-full">
           <div className="text-center mb-4 flex-1 flex flex-col justify-center bg-white/5 rounded-3xl p-4 border border-white/10 relative overflow-hidden">
              <span className="text-gray-400 text-xs font-bold uppercase block mb-2">The Word Is</span>
              <h2 className="text-3xl sm:text-5xl font-black text-white mb-4 leading-tight break-words">{activeCard?.word || '???'}</h2>
              
              <div className="flex items-center justify-center gap-2 mb-4 bg-black/30 w-fit mx-auto px-4 py-1 rounded-full">
                <div className="w-2 h-2 rounded-full" style={{ backgroundColor: activeTeam.color }}></div>
                <span className="text-xs font-bold opacity-80 uppercase tracking-wide">{activeTeam.name} Acting</span>
              </div>
              
              <button onClick={onCancel} className="absolute top-2 right-2 text-gray-600 hover:text-rose-500 p-2 bg-black/20 rounded-full">
                  <XCircle size={20} />
              </button>
           </div>

           <div className="flex items-center justify-center gap-3 mb-6">
              <Clock className={timeLeft <= 5 ? 'text-rose-500 animate-pulse' : 'text-blue-400'} size={24} />
              <div className={`text-6xl font-mono font-bold ${timeLeft <= 5 ? 'text-rose-500' : 'text-white'}`}>
                {timeLeft}
              </div>
           </div>

           <div className="grid grid-cols-2 gap-4 mt-auto h-24 shrink-0">
              <button 
                onClick={() => onValidate('skipped')}
                className="bg-rose-500/10 border-2 border-rose-500 text-rose-500 rounded-2xl font-bold flex flex-col items-center justify-center gap-1 active:bg-rose-500 active:text-white transition-all"
              >
                <ThumbsDown size={28} />
                <span className="text-sm">Skip</span>
              </button>
              <button 
                onClick={() => onValidate('guessed')}
                className="bg-emerald-500/10 border-2 border-emerald-500 text-emerald-500 rounded-2xl font-bold flex flex-col items-center justify-center gap-1 active:bg-emerald-500 active:text-white transition-all"
              >
                <ThumbsUp size={28} />
                <span className="text-sm">Correct</span>
              </button>
           </div>
        </div>
      )}

      {gameState.phase === 'result' && (
        <div className="flex-1 flex flex-col items-center justify-center animate-pulse">
            <h2 className={`text-5xl font-black ${gameState.lastResult === 'guessed' ? 'text-emerald-400' : 'text-rose-400'}`}>
                {gameState.lastResult === 'guessed' ? 'SCORED!' : 'MISSED'}
            </h2>
        </div>
      )}
    </div>
  );
};

const SpectatorStage: React.FC<{ gameState: CharadesGameState }> = ({ gameState }) => {
  const activeTeam = gameState.teams[gameState.currentTeamIndex] || gameState.teams[0];
  const timeLeft = useGameTimer(gameState.roundEndsAt);

  return (
    <div className="flex flex-col h-full bg-slate-900 text-white p-6 justify-center items-center text-center relative overflow-hidden">
      <div className="absolute top-0 left-0 w-full h-1" style={{ backgroundColor: activeTeam.color }}></div>
      
      {gameState.phase === 'board' && (
        <div className="animate-in fade-in zoom-in duration-500">
          <p className="text-gray-400 font-bold uppercase tracking-[0.2em] mb-4 text-xs">Waiting for action</p>
          <h2 className="text-4xl sm:text-6xl font-black mb-8" style={{ color: activeTeam.color }}>{activeTeam.name}</h2>
          <div className="inline-block px-6 py-2 rounded-full bg-white/10 text-sm animate-bounce">
              Player is selecting a card...
          </div>
        </div>
      )}

      {(gameState.phase === 'acting' || gameState.phase === 'waiting_for_host') && (
        <div className="w-full max-w-lg animate-in zoom-in duration-300 relative z-10">
           <div className="p-8 sm:p-12 rounded-[32px] border-4 bg-black relative overflow-hidden shadow-2xl" style={{ borderColor: activeTeam.color }}>
              <p className="text-gray-400 font-bold uppercase mb-4 text-xs tracking-widest">Acting Now</p>
              <h2 className="text-4xl sm:text-5xl font-black mb-10 leading-tight" style={{ color: activeTeam.color }}>{activeTeam.name}</h2>
              <div className="flex flex-col items-center justify-center mb-6">
                 <div className="w-16 h-16 bg-slate-800 rounded-full flex items-center justify-center mb-4 animate-pulse">
                    <EyeOff size={32} className="text-gray-500" />
                 </div>
                 <p className="text-xl font-bold text-white">GUESS THE WORD!</p>
              </div>
              <div className={`text-7xl font-mono font-bold ${timeLeft <= 10 ? 'text-rose-500 animate-pulse' : 'text-white'}`}>
                  {timeLeft}
              </div>
           </div>
        </div>
      )}

      {gameState.phase === 'result' && (
        <div className="w-full max-w-md animate-in slide-in-from-bottom-10">
          <div className={`p-10 rounded-[40px] shadow-2xl ${gameState.lastResult === 'guessed' ? 'bg-emerald-500' : 'bg-rose-500'}`}>
             <h2 className="text-6xl font-black text-white">{gameState.lastResult === 'guessed' ? 'YES!' : 'NO!'}</h2>
          </div>
        </div>
      )}
    </div>
  );
};

// --- MAIN COMPONENT ---

const Charades: React.FC<{ onBack: () => void; isSpectator?: boolean }> = ({ onBack, isSpectator = false }) => {
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
  
  // Persistent Player ID
  const [playerId] = useState(() => {
    let id = sessionStorage.getItem('ppb_player_id');
    if (!id) {
        id = 'player_' + Math.random().toString(36).substr(2, 9);
        sessionStorage.setItem('ppb_player_id', id);
    }
    return id;
  });

  const [gameState, setGameState] = useState<CharadesGameState | null>(null);

  const addNotification = (message: string, type: 'info' | 'success' | 'error' = 'info') => {
      const id = Date.now().toString();
      setNotifications(prev => [...prev, { id, message, type }]);
      setTimeout(() => setNotifications(prev => prev.filter(n => n.id !== id)), 2000);
  };

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const gameId = params.get('gameId');
    const roleParam = params.get('role');

    if (gameId) {
       console.log("Connecting to game:", gameId);
       const unsubscribe = syncService.subscribe(gameId, (newState) => {
          if (!newState) {
              addNotification("Game room closed", "error");
              setGameState(null);
              return;
          }
          setGameState(prev => {
              // Haptic feedback for state changes
              if (prev?.phase !== newState.phase && navigator.vibrate) {
                  if (newState.phase === 'result') navigator.vibrate(200);
                  if (newState.phase === 'acting') navigator.vibrate(100);
              }
              return newState;
          });
       });

       if (roleParam === 'host') setGameRole('host');
       else if (roleParam === 'spectator' || isSpectator) setGameRole('spectator');
       else setGameRole('player');
       
       return () => { if (unsubscribe) unsubscribe(); };
    }
  }, [isSpectator]);

  // Host timer check
  useEffect(() => {
    if (gameRole !== 'host' || !gameState || !gameState.roundEndsAt) return;
    if (gameState.phase !== 'acting') return;

    const interval = setInterval(() => {
        if (Date.now() > (gameState.roundEndsAt as number)) {
            syncService.updateState(gameState.roomId, { 
                phase: 'waiting_for_host',
                roundEndsAt: null 
            });
            clearInterval(interval);
        }
    }, 500);
    return () => clearInterval(interval);
  }, [gameRole, gameState?.phase, gameState?.roundEndsAt]);


  const handleCreateGame = async () => {
    setIsLoading(true);
    const cat = customCategory || category;
    const words = await generateCharadesWords(cat, numCards);
    const roomId = Math.random().toString(36).substring(2, 6).toUpperCase();
    
    const newCards: CharadesCard[] = words.map((w, i) => ({
      id: `c${i}`,
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
      roundEndsAt: null,
      lastResult: null,
      category: cat,
      roundDuration
    };

    const success = await syncService.createRoom(roomId, initialState);
    
    if (success) {
        setGameState(initialState);
        const newUrl = new URL(window.location.href);
        newUrl.searchParams.set('gameId', roomId);
        newUrl.searchParams.set('role', 'host');
        window.history.pushState({}, '', newUrl);
        setGameRole('host');
    } else {
        addNotification("Network Error", "error");
    }
    setIsLoading(false);
  };

  const handleCardClick = (cardId: string) => {
    if (!gameState || gameState.phase !== 'board') return;

    const endTime = Date.now() + (gameState.roundDuration * 1000);
    const updatedCards = gameState.cards.map(c => 
        c.id === cardId ? { ...c, status: 'active' as const } : c
    );

    // Optimistic Update
    setGameState(prev => prev ? ({ ...prev, phase: 'acting', activeCardId: cardId, actorId: playerId }) : null);

    syncService.updateState(gameState.roomId, {
      phase: 'acting',
      activeCardId: cardId,
      actorId: playerId, // IMPORTANT: Set Actor ID
      roundEndsAt: endTime,
      cards: updatedCards
    });
  };

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
      cards: updatedCards,
      roundEndsAt: null
    });

    setTimeout(() => {
        const allDone = updatedCards.every(c => c.status === 'guessed' || c.status === 'skipped');
        if (allDone) {
             syncService.updateState(gameState.roomId, { phase: 'summary' });
        } else {
            const nextIndex = (gameState.currentTeamIndex + 1) % gameState.teams.length;
            syncService.updateState(gameState.roomId, {
                phase: 'board',
                currentTeamIndex: nextIndex,
                activeCardId: null,
                roundEndsAt: null
            });
        }
    }, 2000);
  };

  const handleCancelRound = () => {
    if (!gameState) return;
    const updatedCards = gameState.cards.map(c => 
        c.id === gameState.activeCardId ? { ...c, status: 'hidden' as const } : c
    );
    syncService.updateState(gameState.roomId, {
        phase: 'board',
        activeCardId: null,
        roundEndsAt: null,
        cards: updatedCards
    });
  };

  const copyLink = (role: 'player' | 'spectator') => {
    const url = new URL(window.location.href);
    url.searchParams.set('role', role);
    url.searchParams.set('gameId', gameState?.roomId || ''); 
    navigator.clipboard.writeText(url.toString());
    addNotification(`Copied ${role === 'player' ? 'Player' : 'Screen'} Link`, "success");
  };

  // --- Renderers ---

  if (isLoading) {
    return (
      <div className="h-full flex flex-col items-center justify-center bg-[#8B5CF6] text-white">
        <RefreshCw className="animate-spin mb-4" size={40} />
        <h2 className="text-xl font-bold">Setting up...</h2>
      </div>
    );
  }

  // 1. SETUP
  if (gameRole === 'setup') {
    return (
      <div className="flex flex-col h-full bg-[#8B5CF6] text-white overflow-hidden">
        <div className="flex items-center p-6 pb-2">
           <button onClick={onBack} className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center hover:bg-white/30"><ChevronLeft /></button>
           <h1 className="text-2xl font-bold ml-4 game-font">New Game</h1>
        </div>
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
           <div className="bg-purple-800/40 p-5 rounded-2xl border border-purple-500/30">
              <h3 className="font-bold uppercase tracking-wider text-sm flex items-center gap-2 mb-4"><Users size={16}/> Teams</h3>
              <div className="space-y-3">
                 {teams.map((t, idx) => (
                    <div key={idx} className="flex gap-2">
                       <div className="w-4 rounded-full" style={{ backgroundColor: t.color }}></div>
                       <input value={t.name} onChange={(e) => { const newTeams = [...teams]; newTeams[idx].name = e.target.value; setTeams(newTeams); }} className="flex-1 bg-white/10 rounded-lg px-4 py-2 outline-none focus:bg-white/20" />
                    </div>
                 ))}
              </div>
           </div>
           <div className="bg-purple-800/40 p-5 rounded-2xl border border-purple-500/30">
               <h3 className="font-bold uppercase tracking-wider text-sm flex items-center gap-2 mb-4"><CreditCard size={16}/> Cards: {numCards}</h3>
               <input type="range" min="4" max="24" step="2" value={numCards} onChange={(e) => setNumCards(Number(e.target.value))} className="w-full h-2 bg-purple-900 rounded-lg appearance-none cursor-pointer accent-white" />
           </div>
           <div className="bg-purple-800/40 p-5 rounded-2xl border border-purple-500/30">
               <h3 className="font-bold uppercase tracking-wider text-sm flex items-center gap-2 mb-4"><Settings2 size={16}/> Topic</h3>
               <div className="flex flex-wrap gap-2 mb-4">
                   {CATEGORIES.map(cat => (
                       <button key={cat} onClick={() => {setCategory(cat); setCustomCategory("")}} className={`px-3 py-2 rounded-lg text-xs font-bold transition-all ${category === cat && !customCategory ? 'bg-white text-purple-600' : 'bg-purple-900/50'}`}>{cat}</button>
                   ))}
               </div>
               <input placeholder="Or type custom topic..." value={customCategory} onChange={(e) => setCustomCategory(e.target.value)} className="w-full bg-transparent border-b border-purple-400/50 py-2 outline-none font-bold placeholder:text-purple-300/50" />
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

  if (!gameState) return <div className="h-full flex flex-col items-center justify-center bg-slate-900 text-white p-6 text-center"><RefreshCw className="animate-spin mb-4" size={40} /><h2 className="text-xl font-bold">Loading...</h2></div>;

  // 2. ACTIVE GAME
  return (
    <div className="h-full relative overflow-hidden bg-slate-100 flex flex-col">
      <NotificationToast notifications={notifications} />

      {gameRole === 'spectator' && <SpectatorStage gameState={gameState} />}

      {gameRole === 'host' && (
        <>
           <HostController gameState={gameState} onValidate={handleHostValidation} onCancel={handleCancelRound} />
           {gameState.phase === 'board' && (
              <div className="bg-slate-800 p-4 border-t border-white/10 flex justify-center gap-4 shrink-0">
                  <button onClick={() => copyLink('player')} className="px-4 py-3 bg-white/10 rounded-full text-xs font-bold text-gray-300 flex items-center gap-2 hover:bg-white/20"><Share2 size={14} /> Link</button>
                  <button onClick={() => copyLink('spectator')} className="px-4 py-3 bg-white/10 rounded-full text-xs font-bold text-gray-300 flex items-center gap-2 hover:bg-white/20"><Monitor size={14} /> Screen</button>
              </div>
            )}
        </>
      )}

      {gameRole === 'player' && (
        <>
           {/* Top Info Bar */}
           <div className="h-14 shrink-0 flex items-center justify-between px-6 bg-[#8B5CF6] text-white shadow-md z-20 relative">
               <div className="flex items-center gap-2">
                   <div className="w-3 h-3 rounded-full shadow-sm" style={{ backgroundColor: gameState.teams[gameState.currentTeamIndex]?.color || '#fff' }}></div>
                   <span className="font-bold truncate max-w-[120px] text-sm">{gameState.teams[gameState.currentTeamIndex]?.name || 'Team'}'s Turn</span>
               </div>
               <div className="bg-white/20 px-3 py-1 rounded-full flex items-center gap-2">
                   <span className="text-xs font-bold opacity-80 uppercase tracking-wider">Score</span>
                   <span className="font-mono font-bold">{gameState.teams[gameState.currentTeamIndex]?.score || 0}</span>
               </div>
           </div>

           {/* Game Container */}
           <div className="flex-1 relative overflow-hidden">
              
              {/* BOARD PHASE - GRID */}
              {gameState.phase === 'board' && (
                 <div className="absolute inset-0 overflow-y-auto p-4 pb-20">
                    <div className="grid grid-cols-3 sm:grid-cols-4 gap-3 content-start">
                        {gameState.cards.map((card) => (
                          <button
                              key={card.id}
                              disabled={card.status !== 'hidden'}
                              onClick={() => handleCardClick(card.id)}
                              className={`aspect-[3/4] rounded-xl flex flex-col items-center justify-center relative shadow-sm transition-all active:scale-95 ${
                                  card.status === 'hidden' 
                                  ? 'bg-white text-[#8B5CF6] hover:shadow-md border-b-4 border-gray-200 hover:-translate-y-1' 
                                  : 'bg-gray-200 border-none opacity-40 grayscale'
                              }`}
                          >
                              {card.status === 'hidden' ? (
                                  <>
                                    <span className="text-xs font-bold uppercase text-gray-300 absolute top-2 left-2">Charades</span>
                                    <Zap size={28} className="opacity-20 mb-2" />
                                    <span className="font-black text-2xl opacity-10">?</span>
                                  </>
                              ) : (
                                  <div className={`absolute inset-0 rounded-xl flex items-center justify-center ${
                                      card.status === 'guessed' ? 'bg-emerald-500/80 text-white' : 'bg-rose-500/80 text-white'
                                  }`}>
                                      {card.status === 'guessed' ? <Check size={32} /> : <XCircle size={32} />}
                                  </div>
                              )}
                          </button>
                        ))}
                    </div>
                    
                    <div className="mt-8 text-center px-6 py-4 bg-white/50 rounded-2xl">
                        <p className="text-gray-500 text-sm font-medium">Tap a card to start your turn!</p>
                    </div>
                 </div>
              )}

              {/* ACTING PHASE */}
              {(gameState.phase === 'acting' || gameState.phase === 'waiting_for_host') && (
                 <>
                   {gameState.actorId === playerId ? (
                     <div className="absolute inset-0 bg-slate-900 text-white flex flex-col items-center justify-center p-6 animate-in slide-in-from-bottom z-30">
                        <div className="w-full max-w-md bg-white text-slate-900 rounded-[32px] aspect-[3/4] flex flex-col items-center justify-center p-8 text-center shadow-2xl relative overflow-hidden">
                            <div className="absolute top-0 w-full bg-slate-900 py-3 text-white font-mono font-bold text-xl flex items-center justify-center gap-2">
                                <Clock size={18} /> {useGameTimer(gameState.roundEndsAt)}s
                            </div>
                            
                            <p className="text-gray-400 font-bold uppercase tracking-widest text-xs mb-4 mt-8">Your Word</p>
                            <h2 className="text-4xl sm:text-5xl font-black break-words leading-tight">{gameState.cards.find(c => c.id === gameState.activeCardId)?.word || "..."}</h2>
                            
                            {gameState.phase === 'waiting_for_host' && (
                                <div className="absolute inset-0 bg-black/90 backdrop-blur-sm flex items-center justify-center p-6">
                                    <div className="text-white text-center">
                                        <div className="w-16 h-16 rounded-full border-4 border-rose-500 flex items-center justify-center mx-auto mb-4">
                                            <span className="text-2xl font-bold text-rose-500">0</span>
                                        </div>
                                        <h3 className="text-2xl font-bold">Time's Up!</h3>
                                        <p className="text-gray-400 mt-2">Waiting for host validation...</p>
                                    </div>
                                </div>
                            )}
                        </div>
                        <p className="mt-6 text-gray-400 text-sm font-medium animate-pulse">Shh! Act it out without speaking.</p>
                     </div>
                   ) : (
                     <div className="absolute inset-0 z-20">
                        <SpectatorStage gameState={gameState} />
                     </div>
                   )}
                 </>
              )}

               {gameState.phase === 'result' && (
                  <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm animate-in fade-in">
                      <div className="text-center">
                          <h1 className={`text-6xl font-black mb-4 ${gameState.lastResult === 'guessed' ? 'text-emerald-400' : 'text-rose-400'}`}>
                              {gameState.lastResult === 'guessed' ? 'NICE!' : 'MISSED'}
                          </h1>
                      </div>
                  </div>
              )}
           </div>
        </>
      )}

      {/* Summary */}
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
               <button onClick={() => { setGameState(null); setGameRole('setup'); window.history.pushState({}, '', window.location.pathname); }} className="px-8 py-4 bg-white text-purple-600 rounded-full font-bold shadow-xl active:scale-95 transition-transform">
                  New Game
               </button>
             )}
         </div>
      )}
    </div>
  );
};

export default Charades;
