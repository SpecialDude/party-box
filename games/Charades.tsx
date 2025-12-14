
import React, { useState, useEffect, useRef } from 'react';
import { ChevronLeft, Timer, ThumbsUp, ThumbsDown, RefreshCw, Play, Settings2, Users, CreditCard, Share2, Copy, Trophy } from 'lucide-react';
import { generateCharadesWords } from '../services/geminiService';
import { syncService } from '../services/syncService';
import { CharadesGameState, CharadesTeam, CharadesCard, GamePhase } from '../types';

// --- Configuration Constants ---
const CATEGORIES = ["Movies", "Animals", "Jobs", "Actions", "Famous People", "Objects", "Emotions", "Cartoon Characters"];
const TEAM_COLORS = ["#EC4899", "#3B82F6", "#10B981", "#F59E0B"]; // Pink, Blue, Green, Orange

// --- Sub-Components ---

const SpectatorView: React.FC<{ gameState: CharadesGameState }> = ({ gameState }) => {
  const activeTeam = gameState.teams[gameState.currentTeamIndex];
  const activeCard = gameState.cards.find(c => c.id === gameState.activeCardId);

  return (
    <div className="flex flex-col h-full bg-slate-900 text-white p-6 justify-center items-center text-center">
      <div className="mb-8">
        <h2 className="text-gray-400 text-sm font-bold uppercase tracking-[0.2em] mb-2">Spectating Room</h2>
        <h1 className="text-3xl font-mono text-white">{gameState.roomId}</h1>
      </div>

      {gameState.phase === 'board' && (
        <div className="animate-in fade-in">
          <h2 className="text-2xl font-bold mb-4">Waiting for next turn...</h2>
          <div className="flex items-center gap-2 justify-center">
            <div className="w-3 h-3 bg-white rounded-full animate-bounce"></div>
            <div className="w-3 h-3 bg-white rounded-full animate-bounce delay-100"></div>
            <div className="w-3 h-3 bg-white rounded-full animate-bounce delay-200"></div>
          </div>
          <div className="mt-8 p-4 bg-white/10 rounded-xl">
            <p className="text-gray-300">Up Next:</p>
            <p className="text-2xl font-bold" style={{ color: activeTeam.color }}>{activeTeam.name}</p>
          </div>
        </div>
      )}

      {gameState.phase === 'acting' && (
        <div className="w-full max-w-md animate-in zoom-in duration-300">
           <div className="p-8 rounded-[40px] border-4 bg-black" style={{ borderColor: activeTeam.color }}>
              <p className="text-gray-400 font-bold uppercase mb-4">Acting Now</p>
              <h2 className="text-4xl font-black mb-8" style={{ color: activeTeam.color }}>{activeTeam.name}</h2>
              <div className="text-8xl font-mono font-bold mb-4">{gameState.timeLeft}s</div>
              <p className="text-sm text-gray-500">Guessing...</p>
           </div>
        </div>
      )}

      {gameState.phase === 'result' && (
        <div className="w-full max-w-md animate-in slide-in-from-bottom-10">
          <div className={`p-8 rounded-[40px] ${gameState.lastResult === 'guessed' ? 'bg-emerald-500' : 'bg-rose-500'}`}>
             <h2 className="text-4xl font-black mb-4">{gameState.lastResult === 'guessed' ? 'CORRECT!' : 'SKIPPED'}</h2>
             <div className="bg-black/20 p-6 rounded-2xl">
               <p className="text-white/60 text-sm font-bold uppercase mb-2">The word was</p>
               <p className="text-3xl font-bold text-white">{activeCard?.word}</p>
             </div>
          </div>
        </div>
      )}

      {gameState.phase === 'summary' && (
         <div className="w-full max-w-md">
            <Trophy className="w-20 h-20 text-yellow-400 mx-auto mb-6" />
            <h2 className="text-3xl font-bold mb-6">Final Scores</h2>
            <div className="space-y-3">
              {[...gameState.teams].sort((a,b) => b.score - a.score).map((team, idx) => (
                <div key={team.id} className="bg-white/10 p-4 rounded-xl flex justify-between items-center">
                   <div className="flex items-center gap-3">
                      <span className="font-mono text-gray-400">#{idx + 1}</span>
                      <span className="font-bold" style={{ color: team.color }}>{team.name}</span>
                   </div>
                   <span className="text-2xl font-bold">{team.score}</span>
                </div>
              ))}
            </div>
         </div>
      )}
    </div>
  );
};


const Charades: React.FC<{ onBack: () => void; isSpectator?: boolean }> = ({ onBack, isSpectator = false }) => {
  // Local state for setup forms
  const [setupPhase, setSetupPhase] = useState(0); // 0: Settings, 1: Teams
  const [category, setCategory] = useState("Movies");
  const [customCategory, setCustomCategory] = useState("");
  const [numCards, setNumCards] = useState(12);
  const [roundDuration, setRoundDuration] = useState(60);
  const [teams, setTeams] = useState<CharadesTeam[]>([
    { id: '1', name: 'Team 1', score: 0, color: TEAM_COLORS[0] },
    { id: '2', name: 'Team 2', score: 0, color: TEAM_COLORS[1] }
  ]);
  const [isLoading, setIsLoading] = useState(false);

  // Sync State
  const [gameState, setGameState] = useState<CharadesGameState | null>(null);
  
  // Host Timer Ref
  const timerRef = useRef<number | null>(null);

  // --- Initialization & Sync ---

  useEffect(() => {
    // Check for game ID in URL
    const params = new URLSearchParams(window.location.search);
    const gameId = params.get('gameId');

    if (gameId) {
      // Subscribe to existing game
      const cleanup = syncService.subscribe(gameId, (newState) => {
        setGameState(newState);
      });
      return cleanup;
    }
  }, []);

  // Timer Logic (Host Only)
  useEffect(() => {
    if (!gameState || isSpectator) return;

    if (gameState.phase === 'acting' && gameState.timeLeft > 0) {
      timerRef.current = window.setTimeout(() => {
        syncService.updateState(gameState.roomId, { timeLeft: gameState.timeLeft - 1 });
      }, 1000);
    } else if (gameState.phase === 'acting' && gameState.timeLeft === 0) {
      handleResult('skipped');
    }

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [gameState, isSpectator]);


  // --- Host Functions ---

  const handleCreateGame = async () => {
    setIsLoading(true);
    const cat = customCategory || category;
    const words = await generateCharadesWords(cat, numCards);
    
    const roomId = Math.random().toString(36).substring(2, 7).toUpperCase();
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

    syncService.createRoom(roomId, initialState);
    setGameState(initialState);
    
    // Update URL without reload so host can copy it
    const newUrl = new URL(window.location.href);
    newUrl.searchParams.set('gameId', roomId);
    window.history.pushState({}, '', newUrl);
    
    setIsLoading(false);
  };

  const handleCardClick = (cardId: string) => {
    if (!gameState || isSpectator) return;
    
    syncService.updateState(gameState.roomId, {
      phase: 'acting',
      activeCardId: cardId,
      timeLeft: gameState.roundDuration,
      cards: gameState.cards.map(c => c.id === cardId ? { ...c, status: 'active' } : c)
    });
  };

  const handleResult = (result: 'guessed' | 'skipped') => {
    if (!gameState) return;

    const currentTeam = gameState.teams[gameState.currentTeamIndex];
    const updatedTeams = gameState.teams.map((t, i) => {
      if (i === gameState.currentTeamIndex && result === 'guessed') {
        return { ...t, score: t.score + 1 };
      }
      return t;
    });

    // Update card status
    const updatedCards = gameState.cards.map(c => 
      c.id === gameState.activeCardId ? { ...c, status: result } : c
    );

    // Show result briefly
    syncService.updateState(gameState.roomId, {
      phase: 'result',
      lastResult: result,
      teams: updatedTeams,
      cards: updatedCards
    });

    // Determine next state
    setTimeout(() => {
        // Check if all cards done
        const allDone = updatedCards.every(c => c.status === 'guessed' || c.status === 'skipped');
        if (allDone) {
             syncService.updateState(gameState.roomId, { phase: 'summary' });
        } else {
            // Next Team
            const nextIndex = (gameState.currentTeamIndex + 1) % gameState.teams.length;
            syncService.updateState(gameState.roomId, {
                phase: 'board',
                currentTeamIndex: nextIndex,
                activeCardId: null,
                timeLeft: gameState.roundDuration
            });
        }
    }, 3000); // Show result for 3 seconds
  };

  const copyLink = () => {
    navigator.clipboard.writeText(window.location.href);
    alert("Spectator Link Copied!");
  };

  // --- Renders ---

  // 1. Loading
  if (isLoading) {
    return (
      <div className="h-full flex flex-col items-center justify-center bg-[#8B5CF6] text-white">
        <RefreshCw className="animate-spin mb-4" size={40} />
        <h2 className="text-xl font-bold">Creating Game Room...</h2>
      </div>
    );
  }

  // 2. Setup (Host Only)
  if (!gameState && !isSpectator) {
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
                 type="range" min="4" max="30" step="2"
                 value={numCards}
                 onChange={(e) => setNumCards(Number(e.target.value))}
                 className="w-full h-2 bg-purple-900 rounded-lg appearance-none cursor-pointer accent-white"
               />
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
          <button onClick={handleCreateGame} className="w-full py-4 bg-white text-purple-600 rounded-2xl font-bold text-xl shadow-xl flex items-center justify-center gap-2">
            Generate Game <Play size={20} fill="currentColor" />
          </button>
        </div>
      </div>
    );
  }

  // 3. Spectator Wait Screen / Loading into existing game
  if (!gameState) {
    return (
        <div className="h-full flex flex-col items-center justify-center bg-slate-900 text-white p-6 text-center">
            <RefreshCw className="animate-spin mb-4" size={40} />
            <h2 className="text-xl font-bold">Connecting to Room...</h2>
            <p className="text-sm text-gray-400 mt-2">If this takes long, the room ID might be invalid.</p>
        </div>
    );
  }

  // 4. Spectator Active View
  if (isSpectator) {
    return <SpectatorView gameState={gameState} />;
  }

  // 5. Host Gameplay View
  const activeTeam = gameState.teams[gameState.currentTeamIndex];

  if (gameState.phase === 'board') {
    return (
       <div className="flex flex-col h-full bg-[#8B5CF6] text-white">
          {/* Header Bar */}
          <div className="px-6 py-4 flex items-center justify-between bg-black/10 backdrop-blur-md">
             <div>
                <h2 className="text-xs font-bold opacity-60 uppercase tracking-widest">Current Turn</h2>
                <div className="text-xl font-bold flex items-center gap-2">
                   <div className="w-3 h-3 rounded-full" style={{ backgroundColor: activeTeam.color }}></div>
                   {activeTeam.name}
                </div>
             </div>
             <button onClick={copyLink} className="p-2 bg-white/10 rounded-full hover:bg-white/20">
                <Share2 size={18} />
             </button>
          </div>

          {/* Scoreboard Strip */}
          <div className="flex items-center gap-4 px-6 py-2 overflow-x-auto no-scrollbar border-b border-white/10">
             {gameState.teams.map(t => (
                <div key={t.id} className={`flex items-center gap-2 px-3 py-1 rounded-full ${t.id === activeTeam.id ? 'bg-white/20' : ''}`}>
                   <div className="w-2 h-2 rounded-full" style={{ backgroundColor: t.color }}></div>
                   <span className="text-xs font-bold">{t.score}</span>
                </div>
             ))}
          </div>

          {/* Card Grid */}
          <div className="flex-1 overflow-y-auto p-6">
             <div className="grid grid-cols-3 gap-3">
                {gameState.cards.map((card) => (
                   <button
                     key={card.id}
                     disabled={card.status !== 'hidden'}
                     onClick={() => handleCardClick(card.id)}
                     className={`aspect-[3/4] rounded-xl flex items-center justify-center transition-all duration-500 relative transform ${
                        card.status === 'hidden' 
                        ? 'bg-white text-purple-600 shadow-lg hover:scale-105 cursor-pointer' 
                        : 'bg-black/20 opacity-50 cursor-default'
                     }`}
                   >
                      {card.status === 'hidden' ? (
                         <span className="text-2xl font-black opacity-20">?</span>
                      ) : (
                         <div className={`absolute inset-0 rounded-xl flex items-center justify-center ${
                             card.status === 'guessed' ? 'bg-emerald-500/80' : 'bg-rose-500/80'
                         }`}>
                             {card.status === 'guessed' ? <ThumbsUp className="text-white"/> : <ThumbsDown className="text-white"/>}
                         </div>
                      )}
                   </button>
                ))}
             </div>
          </div>
       </div>
    );
  }

  if (gameState.phase === 'acting' || gameState.phase === 'result') {
      const card = gameState.cards.find(c => c.id === gameState.activeCardId);
      return (
         <div className="flex flex-col h-full bg-slate-900 text-white relative">
            {/* Overlay Result */}
            {gameState.phase === 'result' && (
                <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm animate-in fade-in">
                    <div className="text-center">
                        <h1 className={`text-5xl font-black mb-4 ${gameState.lastResult === 'guessed' ? 'text-emerald-400' : 'text-rose-400'}`}>
                            {gameState.lastResult === 'guessed' ? 'NICE!' : 'MISSED'}
                        </h1>
                        <p className="text-white text-2xl font-bold">{card?.word}</p>
                    </div>
                </div>
            )}

            <div className="h-16 flex items-center justify-between px-6 bg-white/5">
                <div className="flex items-center gap-2">
                   <div className="w-3 h-3 rounded-full" style={{ backgroundColor: activeTeam.color }}></div>
                   <span className="font-bold">{activeTeam.name} Acting</span>
                </div>
                <div className={`font-mono text-2xl font-bold ${gameState.timeLeft < 10 ? 'text-rose-500 animate-pulse' : 'text-white'}`}>
                    {gameState.timeLeft}s
                </div>
            </div>

            <div className="flex-1 flex items-center justify-center p-8">
               <div className="w-full aspect-[3/4] max-h-[50vh] bg-white rounded-[40px] flex items-center justify-center p-6 text-center shadow-2xl animate-pop">
                  <span className="text-5xl font-black text-slate-900 break-words leading-tight">{card?.word}</span>
               </div>
            </div>

            <div className="p-6 grid grid-cols-2 gap-4">
               <button 
                 onClick={() => handleResult('skipped')}
                 className="py-6 bg-rose-500 rounded-3xl flex flex-col items-center justify-center gap-2 active:scale-95 transition-transform"
               >
                  <ThumbsDown size={32} />
                  <span className="font-bold uppercase tracking-widest">Pass</span>
               </button>
               <button 
                 onClick={() => handleResult('guessed')}
                 className="py-6 bg-emerald-500 rounded-3xl flex flex-col items-center justify-center gap-2 active:scale-95 transition-transform"
               >
                  <ThumbsUp size={32} />
                  <span className="font-bold uppercase tracking-widest">Got it!</span>
               </button>
            </div>
         </div>
      );
  }

  // Summary
  return (
    <div className="flex flex-col h-full bg-[#8B5CF6] text-white p-6 items-center justify-center text-center">
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

         <button 
           onClick={() => {
             // Reset by going back to setup
             setGameState(null);
             window.history.pushState({}, '', window.location.pathname); // Clear URL param
           }}
           className="px-8 py-4 bg-white text-purple-600 rounded-full font-bold shadow-xl"
         >
            Play New Game
         </button>
    </div>
  );
};

export default Charades;
