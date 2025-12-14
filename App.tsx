import React, { useState } from 'react';
import { GameScreen, GameConfig } from './types';
import GameCard from './components/GameCard';
import PassTheHat from './games/PassTheHat';
import { Sparkles } from 'lucide-react';

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
    name: 'AI Charades',
    description: 'Endless AI-generated prompts for your acting skills.',
    icon: '🎭',
    color: '#8B5CF6', // Violet
    screen: GameScreen.CHARADES
  },
  {
    id: 'scavenger',
    name: 'Picnic Hunt',
    description: 'Real-world scavenger hunt tailored to your spot.',
    icon: '📸',
    color: '#10B981', // Emerald
    screen: GameScreen.HOME 
  },
  {
    id: 'trivia',
    name: 'Party Trivia',
    description: 'Who knows the most? Fast-paced group questions.',
    icon: '🧠',
    color: '#3B82F6', // Blue
    screen: GameScreen.HOME
  }
];

const App: React.FC = () => {
  const [currentScreen, setCurrentScreen] = useState<GameScreen>(GameScreen.HOME);

  const renderScreen = () => {
    switch (currentScreen) {
      case GameScreen.PASS_THE_HAT:
        return <PassTheHat onBack={() => setCurrentScreen(GameScreen.HOME)} />;
      case GameScreen.CHARADES:
        return (
          <div className="flex flex-col h-full items-center justify-center p-8 text-center bg-white/50 backdrop-blur-xl rounded-[32px] border border-white/20 shadow-sm">
             <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mb-6 animate-bounce shadow-inner">
                <span className="text-4xl">🚧</span>
             </div>
             <h2 className="text-3xl font-bold text-gray-900 mb-3 game-font tracking-tight">Coming Soon</h2>
             <p className="mb-8 text-gray-500 font-medium max-w-xs mx-auto leading-relaxed">
               We are crafting this experience. Check back later!
             </p>
             <button 
               onClick={() => setCurrentScreen(GameScreen.HOME)}
               className="bg-black text-white px-8 py-3 rounded-full font-bold text-sm tracking-wide hover:scale-105 transition-transform shadow-lg shadow-black/20"
             >
               BACK TO GAMES
             </button>
          </div>
        );
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
                      onClick={() => {
                        if (game.screen === GameScreen.HOME && game.id !== 'pass-the-hat') {
                           setCurrentScreen(GameScreen.CHARADES);
                        } else {
                          setCurrentScreen(game.screen);
                        }
                      }} 
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
               <span className="text-[10px] font-bold text-gray-500 uppercase tracking-[0.25em]">Powered by LovenotesAI</span>
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