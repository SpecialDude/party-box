
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { ChevronLeft, ThumbsUp, ThumbsDown, RefreshCw, Play, Settings2, Users, CreditCard, Share2, Trophy, Clock, ShieldCheck, Monitor, EyeOff, XCircle } from 'lucide-react';
import { generateCharadesWords } from '../services/geminiService';
import { syncService } from '../services/syncService';
import { CharadesGameState, CharadesTeam, CharadesCard, GameNotification } from '../types';

// --- Constants ---
const CATEGORIES = ["Movies", "Animals", "Jobs", "Actions", "Famous People", "Objects", "Emotions", "Cartoon Characters"];
const TEAM_COLORS = ["#EC4899", "#3B82F6", "#10B981", "#F59E0B"]; // Pink, Blue, Green, Orange

// --- Custom Hooks ---

/**
 * Handles the countdown logic based on a server timestamp.
 * Returns the seconds remaining.
 */
const useGameTimer = (roundEndsAt: number | null, onExpire?: () => void) => {
  const [timeLeft, setTimeLeft] = useState(0);

  useEffect(() => {
    if (!roundEndsAt) {
      setTimeLeft(0);
      return;
    }

    const interval = setInterval(() => {
      const now = Date.now();
      const diff = Math.ceil((roundEndsAt - now) / 1000);
      
      if (diff <= 0) {
        setTimeLeft(0);
        if (onExpire) onExpire();
      } else {
        setTimeLeft(diff);
      }
    }, 200); // Check frequently for smooth UI, though only update seconds

    return () => clearInterval(interval);
  }, [roundEndsAt, onExpire]);

  return timeLeft;
};

// --- View Components ---

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

/**
 * Host View: The "Remote Control" for the game.
 */
const HostController: React.FC<{ 
    gameState: CharadesGameState; 
    onValidate: (result: 'guessed' | 'skipped') => void;
    onCancel: () => void;
}> = ({ gameState, onValidate, onCancel }) => {
  const activeCard = gameState.cards.find(c => c.id === gameState.activeCardId);
  const activeTeam = gameState.teams[gameState.currentTeamIndex];
  const timeLeft = useGameTimer(gameState.roundEndsAt);

  return (
    <div className="flex flex-col h-full bg-slate-900 text-white p-4">
      {/* Host Header */}
      <div className="flex items-center justify-between mb-4 border-b border-white/10 pb-4">
        <div className="flex items-center gap-2">
            <ShieldCheck className="text-emerald-400" size={20} />
            <h1 className="font-bold uppercase tracking-widest text-xs text-gray-400">Host</h1>
        </div>
        <div className="font-mono text-lg font-bold bg-white/10 px-3 py-1 rounded-lg tracking-wider">
           {gameState.roomId}
        </div>
      </div>

      {/* Board Phase: Host Waiting */}
      {gameState.phase === 'board' && (
         <div className="flex-1 flex flex-col items-center justify-center text-center opacity-50 space-y-4">
            <Clock size={48} />
            <p className="text-xl font-medium">Waiting for player selection...</p>
            <div className="text-sm bg-white/10 px-4 py-2 rounded-full">
               Current Turn: <span style={{ color: activeTeam.color }}>{activeTeam.name}</span>
            </div>
         </div>
      )}

      {/* Active Phase: Host Controls */}
      {(gameState.phase === 'acting' || gameState.phase === 'waiting_for_host') && (
        <div className="flex-1 flex flex-col">
           {/* Info Display */}
           <div className="text-center mb-6 flex-1 flex flex-col justify-center bg-white/5 rounded-3xl p-4 border border-white/10 relative overflow-hidden">
              <span className="text-gray-400 text-xs font-bold uppercase block mb-4">Target Word</span>
              <h2 className="text-4xl font-black text-white mb-4 leading-tight break-words">{activeCard?.word}</h2>
              <div className="flex items-center justify-center gap-2 mb-4">
                <div className="w-2 h-2 rounded-full" style={{ color: activeTeam.color, backgroundColor: activeTeam.color }}></div>
                <span className="text-sm font-bold opacity-80">{activeTeam.name}</span>
              </div>
              
              {/* Cancel Button */}
              <button 
                 onClick={onCancel}
                 className="absolute top-4 right-4 text-gray-600 hover:text-rose-500 transition-colors p-2"
              >
                  <XCircle size={20} />
              </button>
           </div>

           {/* Timer Display */}
           <div className="flex items-center justify-center gap-3 mb-6">
              <Clock className={timeLeft <= 5 ? 'text-rose-500 animate-pulse' : 'text-blue-400'} size={24} />
              <div className={`text-5xl font-mono font-bold ${timeLeft <= 5 ? 'text-rose-500' : 'text-white'}`}>
                {timeLeft}s
              </div>
           </div>

           {/* Controls */}
           <div className="grid grid-cols-2 gap-4 mt-auto h-32">
              <button 
                onClick={() => onValidate('skipped')}
                className="bg-rose-500/10 border-2 border-rose-500 text-rose-500 rounded-2xl font-bold flex flex-col items-center justify-center gap-2 active:bg-rose-500 active:text-white transition-all"
              >
                <ThumbsDown size={32} />
                <span>Missed / Skip</span>
              </button>
              <button 
                onClick={() => onValidate('guessed')}
                className="bg-emerald-500/10 border-2 border-emerald-500 text-emerald-500 rounded-2xl font-bold flex flex-col items-center justify-center gap-2 active:bg-emerald-500 active:text-white transition-all"
              >
                <ThumbsUp size={32} />
                <span>Correct!</span>
              </button>
           </div>
        </div>
      )}

      {gameState.phase === 'result' && (
        <div className="flex-1 flex flex-col items-center justify-center animate-pulse">
            <h2 className={`text-4xl font-black ${gameState.lastResult === 'guessed' ? 'text-emerald-400' : 'text-rose-400'}`}>
                {gameState.lastResult === 'guessed' ? 'SCORED!' : 'MISSED'}
            </h2>
        </div>
      )}
    </div>
  );
};

/**
 * Spectator View: Passive view for TV/Projector or non-active players.
 */
const SpectatorStage: React.FC<{ gameState: CharadesGameState }> = ({ gameState }) => {
  const activeTeam = gameState.teams[gameState.currentTeamIndex];
  const timeLeft = useGameTimer(gameState.roundEndsAt);

  return (
    <div className="flex flex-col h-full bg-slate-900 text-white p-6 justify-center items-center text-center relative overflow-hidden">
      {/* Background Decor */}
      <div className="absolute top-0 left-0 w-full h-2" style={{ backgroundColor: activeTeam.color }}></div>
      
      {gameState.phase === 'board' && (
        <div className="animate-in fade-in zoom-in duration-500">
          <p className="text-gray-400 font-bold uppercase tracking-[0.2em] mb-4">Up Next</p>
          <h2 className="text-6xl font-black mb-8" style={{ color: activeTeam.color }}>{activeTeam.name}</h2>
          <div className="inline-block px-6 py-2 rounded-full bg-white/10 text-sm animate-bounce">
              Waiting for player to start...
          </div>
        </div>
      )}

      {(gameState.phase === 'acting' || gameState.phase === 'waiting_for_host') && (
        <div className="w-full max-w-lg animate-in zoom-in duration-300 relative z-10">
           <div className="p-10 rounded-[40px] border-4 bg-black relative overflow-hidden shadow-2xl" style={{ borderColor: activeTeam.color }}>
              <p className="text-gray-400 font-bold uppercase mb-4">Currently Acting</p>
              <h2 className="text-5xl font-black mb-10" style={{ color: activeTeam.color }}>{activeTeam.name}</h2>
              
              <div className="flex flex-col items-center justify-center mb-4">
                 <div className="w-20 h-20 bg-slate-800 rounded-full flex items-center justify-center mb-4 animate-pulse">
                    <EyeOff size={40} className="text-gray-500" />
                 </div>
                 <p className="text-2xl font-bold text-white">GUESSING...</p>
              </div>

              <div className={`text-8xl font-mono font-bold ${timeLeft <= 10 ? 'text-rose-500 animate-pulse' : 'text-white'}`}>
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

// --- Main Game Component ---

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
  
  // Persistent Player ID
  const [playerId] = useState(() => {
    const existing = sessionStorage.getItem('ppb_player_id');
    if (existing) return existing;
    const newId = Math.random().toString(36).substring(2) + Date.now().toString(36);
    sessionStorage.setItem('ppb_player_id', newId);
    return newId;
  });

  // --- Sync State ---
  const [gameState, setGameState] = useState<CharadesGameState | null>(null);

  // --- Helpers ---
  const addNotification = (message: string, type: 'info' | 'success' | 'error' = 'info') => {
      const id = Date.now().toString();
      setNotifications(prev => [...prev, { id, message, type }]);
      setTimeout(() => {
          setNotifications(prev => prev.filter(n => n.id !== id));
      }, 3000);
  };

  // --- Initialization ---
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const gameId = params.get('gameId');
    const roleParam = params.get('role');

    if (gameId) {
       const unsubscribe = syncService.subscribe(gameId, (newState) => {
          if (!newState) {
              addNotification("Game room closed", "error");
              setGameState(null);
              return;
          }
          setGameState(prev => {
              // Vibrations for phase changes
              if (prev?.phase !== newState.phase) {
                 if (newState.phase === 'result' && navigator.vibrate) navigator.vibrate(200);
                 if (newState.phase === 'acting' && navigator.vibrate) navigator.vibrate(100);
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

  // --- Host Logic: Timer Check ---
  // The Host checks if the timestamp has passed.
  useEffect(() => {
    if (gameRole !== 'host' || !gameState) return;

    if (gameState.phase === 'acting' && gameState.roundEndsAt) {
      const interval = setInterval(() => {
        if (Date.now() > (gameState.roundEndsAt as number)) {
          // Time Expired
          syncService.updateState(gameState.roomId, { 
             phase: 'waiting_for_host',
             roundEndsAt: null // Stop timer
          });
          clearInterval(interval);
        }
      }, 500);
      return () => clearInterval(interval);
    }
  }, [gameRole, gameState?.phase, gameState?.roundEndsAt, gameState?.roomId]);


  // --- Actions ---

  const handleCreateGame = async () => {
    setIsLoading(true);
    const cat = customCategory || category;
    const words = await generateCharadesWords(cat, numCards);
    
    // Generate 4-letter code
    const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ";
    let roomId = '';
    for (let i = 0; i < 4; i++) roomId += chars.charAt(Math.floor(Math.random() * chars.length));

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
        addNotification("Connection failed.", "error");
    }
    setIsLoading(false);
  };

  const handleCardClick = (cardId: string) => {
    if (!gameState || gameState.phase !== 'board') return;

    // Calculate end time on the server side (logic pushed to DB)
    const endTime = Date.now() + (gameState.roundDuration * 1000);

    syncService.updateState(gameState.roomId, {
      phase: 'acting',
      activeCardId: cardId,
      actorId: playerId, // Important: Claim ownership
      roundEndsAt: endTime,
      cards: gameState.cards.map(c => c.id === cardId ? { ...c, status: 'active' } : c)
    });
  };

  const handleHostValidation = (result: 'guessed' | 'skipped') => {
    if (!gameState) return;

    // Update Score
    const updatedTeams = gameState.teams.map((t, i) => {
      if (i === gameState.currentTeamIndex && result === 'guessed') {
        return { ...t, score: t.score + 1 };
      }
      return t;
    });

    // Update Card Status
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

    // Transition Logic
    setTimeout(() => {
        const allDone = updatedCards.every(c => c.status === 'guessed' || c.status === 'skipped');
        if (allDone) {
             syncService.updateState(gameState.roomId, { phase: 'summary' });
        } else {
            // Move to next team
            const nextIndex = (gameState.currentTeamIndex + 1) % gameState.teams.length;
            syncService.updateState(gameState.roomId, {
                phase: 'board',
                currentTeamIndex: nextIndex,
                activeCardId: null,
                roundEndsAt: null
            });
        }
    }, 2500); // Show result for 2.5s
  };

  const handleCancelRound = () => {
    if (!gameState) return;
    // Reset the active card to hidden and go back to board
    const updatedCards = gameState.cards.map(c => 
        c.id === gameState.activeCardId ? { ...c, status: 'hidden' as const } : c
    );
    syncService.updateState(gameState.roomId, {
        phase: 'board',
        activeCardId: null,
        roundEndsAt: null,
        cards: updatedCards
    });
    addNotification("Round cancelled", "info");
  };

  const copyLink = (role: 'player' | 'spectator') => {
    const url = new URL(window.location.href);
    url.searchParams.set('role', role);
    url.searchParams.set('gameId', gameState?.roomId || ''); 
    navigator.clipboard.writeText(url.toString());
    addNotification("Link copied!", "success");
  };

  // --- Styles ---
  const gridStyle = useMemo(() => {
    if (!gameState) return {};
    const count = gameState.cards.length;
    let cols = 2;
    if (count > 4) cols = 2; 
    if (count > 8) cols = 3; 
    if (count > 15) cols = 4;

    return {
       display: 'grid',
       gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))`,
       gap: '0.75rem',
       // Ensure grid takes available space but doesn't overflow drastically
       height: 'calc(100vh - 180px)', 
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

  // 1. SETUP SCREEN
  if (gameRole === 'setup') {
    return (
      <div className="flex flex-col h-full bg-[#8B5CF6] text-white overflow-hidden">
        <div className="flex items-center p-6 pb-2">
           <button onClick={onBack} className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center hover:bg-white/30"><ChevronLeft /></button>
           <h1 className="text-2xl font-bold ml-4 game-font">New Game</h1>
        </div>
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
           <div className="bg-purple-800/40 p-5 rounded-2xl border border-purple-500/30">
              <div className="flex justify-between items-center mb-4">
                  <h3 className="font-bold uppercase tracking-wider text-sm flex items-center gap-2"><Users size={16}/> Teams</h3>
                  <div className="flex gap-2">
                     <button onClick={() => teams.length > 1 && setTeams(prev => prev.slice(0, -1))} className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20">-</button>
                     <button onClick={() => teams.length < 4 && setTeams(prev => [...prev, { id: Date.now().toString(), name: `Team ${prev.length + 1}`, score: 0, color: TEAM_COLORS[prev.length] }])} className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20">+</button>
                  </div>
              </div>
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
               <h3 className="font-bold uppercase tracking-wider text-sm flex items-center gap-2 mb-4"><CreditCard size={16}/> Deck Size: {numCards}</h3>
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

  if (!gameState) return <div className="h-full flex flex-col items-center justify-center bg-slate-900 text-white p-6 text-center"><RefreshCw className="animate-spin mb-4" size={40} /><h2 className="text-xl font-bold">Connecting...</h2></div>;

  // 2. MAIN ROUTING
  return (
    <div className="h-full relative overflow-hidden">
      <NotificationToast notifications={notifications} />

      {/* VIEW: SPECTATOR */}
      {gameRole === 'spectator' && <SpectatorStage gameState={gameState} />}

      {/* VIEW: HOST */}
      {gameRole === 'host' && (
        <div className="flex flex-col h-full">
            <HostController gameState={gameState} onValidate={handleHostValidation} onCancel={handleCancelRound} />
            {gameState.phase === 'board' && (
              <div className="bg-slate-800 p-4 border-t border-white/10 flex justify-center gap-4">
                  <button onClick={() => copyLink('player')} className="px-4 py-3 bg-white/10 rounded-full text-xs font-bold text-gray-300 flex items-center gap-2 hover:bg-white/20"><Share2 size={14} /> Player Link</button>
                  <button onClick={() => copyLink('spectator')} className="px-4 py-3 bg-white/10 rounded-full text-xs font-bold text-gray-300 flex items-center gap-2 hover:bg-white/20"><Monitor size={14} /> Screen Link</button>
              </div>
            )}
        </div>
      )}

      {/* VIEW: PLAYER */}
      {gameRole === 'player' && (
        <>
           {/* Top Bar */}
           <div className="h-14 flex items-center justify-between px-6 bg-[#8B5CF6] text-white shadow-sm z-10 relative">
               <div className="flex items-center gap-2">
                   <div className="w-3 h-3 rounded-full" style={{ backgroundColor: gameState.teams[gameState.currentTeamIndex].color }}></div>
                   <span className="font-bold truncate max-w-[120px]">{gameState.teams[gameState.currentTeamIndex].name} Turn</span>
               </div>
               <div className="font-mono font-bold bg-black/20 px-3 py-1 rounded-full text-sm">
                   Team Score: {gameState.teams[gameState.currentTeamIndex].score}
               </div>
           </div>

           {/* Game Area */}
           <div className="flex-1 bg-slate-100 p-4 overflow-hidden relative">
              
              {/* PHASE: BOARD */}
              {gameState.phase === 'board' && (
                  <div style={gridStyle} className="animate-in fade-in zoom-in duration-300 w-full max-w-lg mx-auto pb-safe">
                      {gameState.cards.map((card) => (
                        <button
                            key={card.id}
                            disabled={card.status !== 'hidden'}
                            onClick={() => handleCardClick(card.id)}
                            className={`rounded-xl flex items-center justify-center relative shadow-sm transition-all active:scale-95 ${
                                card.status === 'hidden' 
                                ? 'bg-white text-[#8B5CF6] hover:shadow-md border-b-4 border-gray-200 hover:-translate-y-1' 
                                : 'bg-gray-200 border-none opacity-50'
                            }`}
                        >
                            {card.status === 'hidden' ? (
                                <span className="text-xl font-black opacity-20">?</span>
                            ) : (
                                <div className={`absolute inset-0 rounded-xl flex items-center justify-center ${
                                    card.status === 'guessed' ? 'bg-emerald-500/80 text-white' : 'bg-rose-500/80 text-white'
                                }`}>
                                    {card.status === 'guessed' ? <ThumbsUp size={24} /> : <ThumbsDown size={24} />}
                                </div>
                            )}
                        </button>
                      ))}
                  </div>
              )}

              {/* PHASE: ACTING */}
              {(gameState.phase === 'acting' || gameState.phase === 'waiting_for_host') && (
                 <>
                   {/* Is THIS player the Actor? */}
                   {gameState.actorId === playerId ? (
                     <div className="absolute inset-0 bg-slate-900 text-white flex flex-col items-center justify-center p-6 animate-in slide-in-from-bottom">
                        <div className="w-full max-w-md bg-white text-slate-900 rounded-[3rem] aspect-[4/5] flex flex-col items-center justify-center p-8 text-center shadow-2xl relative overflow-hidden">
                            {/* Timer Bar */}
                            <div className="absolute top-0 w-full bg-slate-900 py-3 text-white font-mono font-bold text-xl">
                                <Clock className="inline mr-2 w-4 h-4"/>
                                {useGameTimer(gameState.roundEndsAt)}s
                            </div>
                            
                            <p className="text-gray-400 font-bold uppercase tracking-widest text-sm mb-4 mt-8">Your Word</p>
                            <h2 className="text-5xl font-black break-words leading-tight">{gameState.cards.find(c => c.id === gameState.activeCardId)?.word}</h2>
                            
                            {gameState.phase === 'waiting_for_host' && (
                                <div className="absolute inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-6">
                                    <div className="text-white text-center">
                                        <Clock size={48} className="mx-auto mb-4 text-rose-500 animate-pulse" />
                                        <h3 className="text-2xl font-bold">Time's Up!</h3>
                                    </div>
                                </div>
                            )}
                        </div>
                     </div>
                   ) : (
                     /* Not the Actor -> Show Passive View */
                     <div className="absolute inset-0">
                        <SpectatorStage gameState={gameState} />
                     </div>
                   )}
                 </>
              )}

               {/* PHASE: RESULT OVERLAY */}
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

      {/* SHARED: SUMMARY */}
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
