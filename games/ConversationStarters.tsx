
import React, { useState } from 'react';
import { ChevronLeft, MessageCircle, Sparkles, RefreshCw, Layers } from 'lucide-react';
import { generateConversationStarters } from '../services/geminiService';

const VIBES = [
  { id: 'chill', label: 'Chill', emoji: '😌', color: '#10B981' },
  { id: 'deep', label: 'Deep', emoji: '🌌', color: '#8B5CF6' },
  { id: 'funny', label: 'Funny', emoji: '😂', color: '#F59E0B' },
  { id: 'spicy', label: 'Spicy', emoji: '🌶️', color: '#EF4444' },
  { id: 'debate', label: 'Debate', emoji: '⚖️', color: '#3B82F6' },
  { id: 'wyr', label: 'Would You Rather', emoji: '🤔', color: '#EC4899' }
];

const ConversationStarters: React.FC<{ onBack: () => void }> = ({ onBack }) => {
  const [gameState, setGameState] = useState<'setup' | 'loading' | 'playing'>('setup');
  const [vibe, setVibe] = useState(VIBES[0]);
  const [questions, setQuestions] = useState<string[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);

  const startGame = async () => {
    setGameState('loading');
    const qs = await generateConversationStarters(vibe.label);
    setQuestions(qs);
    setCurrentIndex(0);
    setGameState('playing');
  };

  const nextCard = () => {
    if (currentIndex < questions.length - 1) {
      setCurrentIndex(prev => prev + 1);
    } else {
      // Loop or finish? Let's loop for now with a visual cue or just restart
      // Better to just fetch more? Let's just go back to setup for now.
      setGameState('setup');
    }
  };

  if (gameState === 'setup') {
    return (
      <div className="flex flex-col h-full bg-[#F59E0B] text-white overflow-hidden transition-colors duration-500" style={{ backgroundColor: vibe.color }}>
        <div className="flex items-center p-6 pb-2">
          <button onClick={onBack} className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center hover:bg-white/30 transition-colors">
            <ChevronLeft size={24} />
          </button>
          <h1 className="text-2xl font-bold ml-4 game-font tracking-tight">Ice Breakers</h1>
        </div>

        <div className="flex-1 p-6 flex flex-col justify-center max-w-md mx-auto w-full">
           <div className="text-center mb-8">
             <div className="w-20 h-20 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-4 backdrop-blur-sm animate-float">
                <MessageCircle size={40} className="text-white" />
             </div>
             <h2 className="text-3xl font-bold game-font mb-2">Set the Vibe</h2>
             <p className="text-white/80 font-medium">Choose a mood, get talking.</p>
           </div>

           <div className="grid grid-cols-2 gap-3 mb-8">
             {VIBES.map(v => (
               <button
                 key={v.id}
                 onClick={() => setVibe(v)}
                 className={`p-4 rounded-2xl font-bold text-sm transition-all flex flex-col items-center gap-2 ${
                   vibe.id === v.id
                   ? 'bg-white shadow-xl scale-105 ring-4 ring-white/30' 
                   : 'bg-black/10 hover:bg-black/20 text-white'
                 }`}
                 style={{ color: vibe.id === v.id ? v.color : 'white' }}
               >
                 <span className="text-2xl">{v.emoji}</span>
                 {v.label}
               </button>
             ))}
           </div>

           <button 
            onClick={startGame}
            className="w-full py-5 bg-white text-gray-900 rounded-2xl font-bold text-xl shadow-xl active:scale-95 transition-all flex items-center justify-center gap-2"
          >
            <Sparkles size={20} className="text-yellow-500" /> Start
          </button>
        </div>
      </div>
    );
  }

  if (gameState === 'loading') {
    return (
      <div className="flex flex-col h-full items-center justify-center p-8 text-white" style={{ backgroundColor: vibe.color }}>
        <RefreshCw size={48} className="animate-spin mb-6 text-white/50" />
        <h2 className="text-2xl font-bold game-font text-center mb-2">Curating Questions...</h2>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-slate-900 text-white relative overflow-hidden">
       {/* Background */}
       <div className="absolute inset-0 opacity-20 pointer-events-none" style={{ background: `radial-gradient(circle at 50% 50%, ${vibe.color}, transparent 70%)` }}></div>

       <div className="flex items-center justify-between p-6 relative z-10">
          <button onClick={() => setGameState('setup')} className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20">
             <ChevronLeft size={24} />
          </button>
          <div className="flex items-center gap-2 bg-white/10 px-4 py-2 rounded-full">
             <span>{vibe.emoji}</span>
             <span className="font-bold text-sm uppercase tracking-wider">{vibe.label}</span>
          </div>
          <div className="w-10"></div>
       </div>

       <div className="flex-1 flex flex-col items-center justify-center p-6 relative z-10 w-full max-w-md mx-auto">
          {/* Card Stack Effect */}
          <div className="relative w-full aspect-[3/4]">
             {/* Back Card */}
             <div className="absolute top-4 inset-x-4 bottom-0 bg-white/5 rounded-[32px] border border-white/5 transform scale-95 translate-y-4"></div>
             
             {/* Main Card */}
             <button 
                onClick={nextCard}
                className="absolute inset-0 bg-white text-slate-900 rounded-[32px] p-8 shadow-2xl flex flex-col items-center justify-center text-center transition-all active:scale-[0.98] group"
             >
                <div className="mb-8 opacity-20 grayscale group-hover:grayscale-0 transition-all duration-500 transform group-hover:scale-110">
                    <span className="text-6xl">{vibe.emoji}</span>
                </div>
                
                <h3 className="text-2xl sm:text-4xl font-black leading-tight mb-8">
                   {questions[currentIndex]}
                </h3>
                
                <p className="text-gray-400 text-xs font-bold uppercase tracking-[0.2em] mt-auto">
                    Tap for next
                </p>
             </button>
          </div>
       </div>
       
       <div className="p-6 text-center text-gray-500 text-xs font-bold uppercase tracking-widest">
          {currentIndex + 1} / {questions.length}
       </div>
    </div>
  );
};

export default ConversationStarters;
