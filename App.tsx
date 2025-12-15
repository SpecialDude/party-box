
import React, { useState, useEffect } from 'react';
import { GameScreen, GameConfig } from './types';
import GameCard from './components/GameCard';
import PassTheHat from './games/PassTheHat';
import Charades from './games/Charades';
import ScavengerHunt from './games/ScavengerHunt';
import Trivia from './games/Trivia';
import ConversationStarters from './games/ConversationStarters';
import { Sparkles, ArrowRight } from 'lucide-react';
import { syncService } from './services/syncService';

const GAMES: GameConfig[] = [
  {
    id: 'pass-the-hat',
    name: 'Pass The Hat',
    description: 'The music stops, you freeze. Don\'t get caught with the bomb!',
    icon: '🎩',
    color: '#F43F5E', // Rose
    screen: GameScreen.PASS_THE_HAT
  },
  {
    id: 'charades',
    name: 'AI Team Charades',
    description: 'Team vs Team. Create a deck, sync with friends, act it out!',
    icon: '🎭',
    color: '#8B5CF6', // Violet
    screen: GameScreen.CHARADES
  },
  {
    id: 'conversation',
    name: 'Ice Breakers',
    description: 'Deep questions and fun debate topics to get the group talking.',
    icon: '💬',
    color: '#F59E0B', // Amber
    screen: GameScreen.CONVERSATION
  },
  {
    id: 'scavenger',
    name: 'Picnic Hunt',
    description: 'Real-world scavenger hunt tailored to your spot.',
    icon: '📸',
    color: '#10B981', // Emerald
    screen: GameScreen.SCAVENGER 
  },
  {
    id: 'trivia',
    name: 'Party Trivia',
    description: 'Who knows the most? Fast-paced group questions.',
    icon: '🧠',
    color: '#3B82F6', // Blue
    screen: GameScreen.TRIVIA
  }
];

const App: React.FC = () => {
  const [currentScreen, setCurrentScreen] = useState<GameScreen>(GameScreen.HOME);
  const [isSpectator, setIsSpectator] = useState(false);
  const [joinCode, setJoinCode] = useState('');
  const [isJoining, setIsJoining] = useState(false);

  // Check for shared game links on load
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const gameId = params.get('gameId');
    
    // If we have a gameId, we assume it's a Charades game for now as that's the only one with sync
    if (gameId) {
       setCurrentScreen(GameScreen.CHARADES);
       // If coming from link without specific role, assume spectator or player logic handled in Charades.tsx
    }
  }, []);

  const handleJoinGame = async (e: React.FormEvent) => {
    e.preventDefault();
    if (joinCode.length < 4) return;
    
    setIsJoining(true);
    const code = joinCode.toUpperCase();
    const exists = await syncService.checkRoomExists(code);
    
    if (exists) {
      // Update URL without reloading
      const url = new URL(window.location.href);
      url.searchParams.set('gameId', code);
      url.searchParams.set('role', 'player'); // Default to player
      window.history.pushState({}, '', url);
      
      setCurrentScreen(GameScreen.CHARADES);
    } else {
      alert("Room not found! Check the code.");
    }
    setIsJoining(false);
  };

  const renderScreen = () => {
    switch (currentScreen) {
      case GameScreen.PASS_THE_HAT:
        return <PassTheHat onBack={() => setCurrentScreen(GameScreen.HOME)} />;
      case GameScreen.CHARADES:
        return <Charades onBack={() => {
            setCurrentScreen(GameScreen.HOME);
            // Clear URL param when going back home
            const newUrl = window.location.pathname;
            window.history.pushState({}, '', newUrl);
            setIsSpectator(false);
            setJoinCode('');
        }} isSpectator={isSpectator} />;
      case GameScreen.SCAVENGER:
        return <ScavengerHunt onBack={() => setCurrentScreen(GameScreen.HOME)} />;
      case GameScreen.TRIVIA:
        return <Trivia onBack={() => setCurrentScreen(GameScreen.HOME)} />;
      case GameScreen.CONVERSATION:
        return <ConversationStarters onBack={() => setCurrentScreen(GameScreen.HOME)} />;
      default:
        return (
          <div className="flex flex-col h-full relative z-10 overflow-hidden">
            {/* Header */}
            <div className="pt-8 pb-4 px-6 sm:px-8 flex flex-col items-start shrink-0">
              <div className="inline-flex items-center gap-2 mb-4 px-3 py-1 bg-white/60 backdrop-blur-md rounded-full border border-white/50 shadow-sm">
                 <div className="bg-gradient-to-r from-violet-500 to-fuchsia-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider flex items-center gap-1">
                    <Sparkles size={10} /> 
                    New
                 </div>
                 <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wide pr-1">V 1.0</span>
              </div>
              
              <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold text-gray-900 leading-none tracking-tighter game-font mb-3 drop-shadow-sm flex flex-wrap items-center gap-x-2">
                Party
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-violet-600 via-pink-500 to-orange-400">
                  Box.
                </span>
              </h1>
              <p className="text-gray-500 font-medium text-sm sm:text-base max-w-md leading-relaxed">
                The ultimate toolkit for your hangouts.
              </p>
            </div>

            {/* JOIN GAME SECTION */}
            <div className="px-6 sm:px-8 mb-4">
              <form onSubmit={handleJoinGame} className="flex gap-2 max-w-sm">
                 <input 
                    value={joinCode}
                    onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                    placeholder="Enter 4-Letter Room Code"
                    maxLength={5}
                    className="flex-1 bg-white border border-gray-200 rounded-xl px-4 py-3 font-mono font-bold uppercase placeholder:text-gray-300 outline-none focus:border-violet-500 transition-all"
                 />
                 <button 
                   type="submit"
                   disabled={isJoining || joinCode.length < 4}
                   className="bg-black text-white px-4 rounded-xl flex items-center justify-center hover:bg-gray-800 disabled:opacity-50 transition-colors"
                 >
                   {isJoining ? '...' : <ArrowRight />}
                 </button>
              </form>
            </div>

            {/* Horizontal Scroll Games - Fixed area */}
            <div className="flex-1 w-full min-h-0 flex flex-col justify-center relative">
              <div className="w-full overflow-x-auto no-scrollbar flex items-center px-6 sm:px-8 gap-4 snap-x snap-mandatory py-4">
                {GAMES.map((game) => (
                  <div 
                    key={game.id} 
                    className="relative shrink-0 snap-center transition-all duration-300 hover:-translate-y-2
                               w-[220px] sm:w-[240px] md:w-[260px] 
                               h-[280px] sm:h-[300px] md:h-[340px]"
                  >
                    <GameCard 
                      game={game} 
                      onClick={() => setCurrentScreen(game.screen)} 
                    />
                  </div>
                ))}
                {/* Spacer to prevent cut-off at the end of scroll */}
                <div className="w-4 shrink-0" />
              </div>
            </div>

            {/* Brand Footer - Static Flex Item */}
            <div className="shrink-0 pb-6 pt-2 flex justify-center items-center gap-3 opacity-60 z-20">
               <span className="h-px w-8 bg-gray-400"></span>
               <span className="text-[10px] font-bold text-gray-500 uppercase tracking-[0.25em]">Powered by Google Gemini</span>
               <span className="h-px w-8 bg-gray-400"></span>
            </div>
          </div>
        );
    }
  };

  return (
    <div className="h-screen w-full bg-[#F8F7FF] text-gray-900 font-sans overflow-hidden sm:p-4 md:p-6 lg:p-8 flex items-center justify-center">
      {/* Background Blobs */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
         <div className="absolute top-[-10%] right-[-5%] w-[600px] h-[600px] bg-purple-200/40 rounded-full blur-[100px] mix-blend-multiply animate-float"></div>
         <div className="absolute bottom-[-10%] left-[-10%] w-[500px] h-[500px] bg-pink-200/40 rounded-full blur-[100px] mix-blend-multiply animate-float" style={{ animationDelay: '2s' }}></div>
         <div className="absolute top-[40%] left-[30%] w-[400px] h-[400px] bg-blue-200/40 rounded-full blur-[80px] mix-blend-multiply animate-float" style={{ animationDelay: '4s' }}></div>
      </div>

      <div className="w-full h-full max-w-[1200px] bg-white/40 backdrop-blur-2xl sm:rounded-[48px] shadow-[0_20px_40px_rgba(0,0,0,0.05)] overflow-hidden relative border border-white/60 ring-1 ring-white/50 flex flex-col">
        {renderScreen()}
      </div>
    </div>
  );
};

export default App;
