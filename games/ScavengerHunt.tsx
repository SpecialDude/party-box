import React, { useState } from 'react';
import { ChevronLeft, MapPin, Camera, RefreshCw, CheckCircle, Circle, Trophy } from 'lucide-react';
import { generateScavengerHunt } from '../services/geminiService';
import { ScavengerItem } from '../types';

const LOCATIONS = ["City Park", "Beach", "Backyard", "Living Room", "Forest Trail"];

const ScavengerHunt: React.FC<{ onBack: () => void }> = ({ onBack }) => {
  const [gameState, setGameState] = useState<'setup' | 'loading' | 'playing' | 'win'>('setup');
  const [location, setLocation] = useState("City Park");
  const [customLocation, setCustomLocation] = useState("");
  const [items, setItems] = useState<ScavengerItem[]>([]);
  const [startTime, setStartTime] = useState<number>(0);
  const [endTime, setEndTime] = useState<number>(0);

  const startGame = async () => {
    setGameState('loading');
    const loc = customLocation.trim() || location;
    const newItems = await generateScavengerHunt(loc);
    setItems(newItems);
    setStartTime(Date.now());
    setGameState('playing');
  };

  const toggleItem = (id: string) => {
    const newItems = items.map(item => 
      item.id === id ? { ...item, found: !item.found } : item
    );
    setItems(newItems);

    if (newItems.every(i => i.found)) {
      setEndTime(Date.now());
      setGameState('win');
    }
  };

  const formatTime = (ms: number) => {
    const seconds = Math.floor(ms / 1000);
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  if (gameState === 'setup') {
    return (
      <div className="flex flex-col h-full bg-[#10B981] text-white overflow-hidden">
        <div className="flex items-center p-6 pb-2">
          <button onClick={onBack} className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center hover:bg-white/30 transition-colors">
            <ChevronLeft size={24} />
          </button>
          <h1 className="text-2xl font-bold ml-4 game-font tracking-tight">Picnic Hunt</h1>
        </div>

        <div className="flex-1 p-6 flex flex-col justify-center max-w-md mx-auto w-full">
           <div className="bg-white/10 backdrop-blur-md rounded-3xl p-6 border border-white/20 mb-8">
              <MapPin className="w-12 h-12 mb-4 text-emerald-200" />
              <h2 className="text-3xl font-bold mb-2 game-font">Where are you?</h2>
              <p className="text-emerald-100 mb-6 text-sm">The AI will generate items based on your surroundings.</p>
              
              <div className="grid grid-cols-2 gap-3 mb-4">
                {LOCATIONS.map(loc => (
                  <button
                    key={loc}
                    onClick={() => { setLocation(loc); setCustomLocation(""); }}
                    className={`p-3 rounded-xl font-bold text-sm transition-all text-left ${
                      location === loc && !customLocation
                      ? 'bg-white text-emerald-600 shadow-lg' 
                      : 'bg-emerald-800/40 text-emerald-100 hover:bg-emerald-700/40'
                    }`}
                  >
                    {loc}
                  </button>
                ))}
              </div>
              
              <input 
                 type="text" 
                 value={customLocation}
                 onChange={(e) => setCustomLocation(e.target.value)}
                 placeholder="Other (e.g. Office, Mall)..."
                 className="w-full bg-emerald-900/40 p-4 rounded-xl text-white placeholder:text-emerald-300/50 outline-none border border-transparent focus:border-white/50 transition-all font-bold"
               />
           </div>

           <button 
            onClick={startGame}
            className="w-full py-5 bg-white text-emerald-600 rounded-2xl font-bold text-xl shadow-xl active:scale-95 transition-all flex items-center justify-center gap-2"
          >
            Start Hunt
          </button>
        </div>
      </div>
    );
  }

  if (gameState === 'loading') {
    return (
      <div className="flex flex-col h-full bg-[#10B981] items-center justify-center p-8 text-white">
        <RefreshCw size={48} className="animate-spin mb-6 text-emerald-200" />
        <h2 className="text-2xl font-bold game-font text-center mb-2">Scanning Area...</h2>
        <p className="text-emerald-100 text-center">Identifying hidden treasures in {customLocation || location}.</p>
      </div>
    );
  }

  if (gameState === 'win') {
    return (
       <div className="flex flex-col h-full bg-[#10B981] items-center justify-center p-8 text-white text-center animate-in fade-in zoom-in">
          <div className="w-24 h-24 bg-yellow-400 rounded-full flex items-center justify-center text-emerald-600 mb-6 shadow-2xl animate-bounce">
             <Trophy size={48} fill="currentColor" />
          </div>
          <h1 className="text-5xl font-black game-font mb-2">COMPLETE!</h1>
          <p className="text-emerald-100 text-lg mb-8">You found all items in {formatTime(endTime - startTime)}.</p>
          
          <button 
            onClick={() => setGameState('setup')}
            className="px-8 py-4 bg-white text-emerald-600 rounded-2xl font-bold shadow-xl active:scale-95"
          >
            Play Again
          </button>
       </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-gray-50 text-gray-900">
      <div className="bg-[#10B981] text-white p-6 pb-8 rounded-b-[40px] shadow-lg z-10">
        <div className="flex items-center justify-between mb-4">
           <button onClick={onBack} className="w-10 h-10 rounded-full bg-black/10 flex items-center justify-center">
             <ChevronLeft size={24} />
           </button>
           <div className="font-mono text-xl font-bold bg-black/20 px-4 py-1 rounded-full">
             {items.filter(i => i.found).length}/{items.length}
           </div>
        </div>
        <h2 className="text-2xl font-bold game-font leading-none">{customLocation || location} Hunt</h2>
        <p className="text-emerald-100 text-sm opacity-80 mt-1">Find these items and check them off!</p>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-3 no-scrollbar -mt-4 pt-8">
        {items.map((item) => (
          <button
            key={item.id}
            onClick={() => toggleItem(item.id)}
            className={`w-full p-4 rounded-2xl flex items-center gap-4 transition-all duration-300 border shadow-sm ${
              item.found 
              ? 'bg-emerald-50 border-emerald-200 opacity-60 scale-[0.98]' 
              : 'bg-white border-gray-100 hover:border-emerald-200 hover:shadow-md'
            }`}
          >
            <div className={`w-12 h-12 rounded-full flex items-center justify-center text-2xl shrink-0 transition-colors ${
              item.found ? 'bg-emerald-200 grayscale' : 'bg-gray-100'
            }`}>
              {item.emoji}
            </div>
            
            <div className="flex-1 text-left">
              <p className={`font-bold text-lg leading-tight ${item.found ? 'line-through text-gray-400' : 'text-gray-900'}`}>
                {item.description}
              </p>
              <span className="text-xs font-bold text-emerald-600 uppercase tracking-wider">{item.points} PTS</span>
            </div>

            <div className={`w-8 h-8 rounded-full border-2 flex items-center justify-center transition-colors ${
              item.found ? 'bg-emerald-500 border-emerald-500 text-white' : 'border-gray-200 text-transparent'
            }`}>
              <CheckCircle size={20} fill="currentColor" className={item.found ? 'block' : 'hidden'} />
            </div>
          </button>
        ))}
      </div>
    </div>
  );
};

export default ScavengerHunt;
