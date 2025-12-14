import React from 'react';
import { GameConfig } from '../types';
import { ArrowUpRight } from 'lucide-react';

interface GameCardProps {
  game: GameConfig;
  onClick: () => void;
}

const GameCard: React.FC<GameCardProps> = ({ game, onClick }) => {
  return (
    <button
      onClick={onClick}
      className="group relative w-full h-full text-left transition-all duration-300 outline-none"
    >
      {/* Background with Gradient */}
      <div 
        className="absolute inset-0 rounded-[24px] opacity-20 transition-opacity group-hover:opacity-30"
        style={{ backgroundColor: game.color }}
      />
      
      {/* Main Content Container */}
      <div className="relative h-full p-5 rounded-[24px] border border-black/5 bg-white/50 backdrop-blur-sm hover:bg-white/80 transition-all shadow-sm group-hover:shadow-md flex flex-col justify-between overflow-hidden">
        
        {/* Decorative Circle */}
        <div 
          className="absolute -right-4 -top-4 w-20 h-20 rounded-full opacity-10 transition-transform group-hover:scale-150 duration-500 ease-out"
          style={{ backgroundColor: game.color }}
        />

        <div>
          <div className="flex justify-between items-start mb-3">
            <div 
              className="w-10 h-10 rounded-2xl flex items-center justify-center text-xl shadow-sm border border-black/5 bg-white group-hover:scale-110 transition-transform duration-300"
            >
              {game.icon}
            </div>
            
            <div className="w-7 h-7 rounded-full bg-black/5 flex items-center justify-center group-hover:bg-black group-hover:text-white transition-colors duration-300">
              <ArrowUpRight size={16} />
            </div>
          </div>
          
          <h3 className="text-lg font-bold text-gray-900 game-font leading-tight mb-1 tracking-tight group-hover:text-black">
            {game.name}
          </h3>
          
          <p className="text-gray-500 font-medium text-[11px] leading-relaxed line-clamp-2">
            {game.description}
          </p>
        </div>
        
        {/* Bottom meta info */}
        <div className="mt-3 pt-3 border-t border-black/5 flex items-center gap-2">
           <div className="flex -space-x-1.5">
               <div className="w-5 h-5 rounded-full bg-gray-100 border border-white flex items-center justify-center text-[8px] font-bold text-gray-600">A</div>
               <div className="w-5 h-5 rounded-full bg-gray-200 border border-white flex items-center justify-center text-[8px] font-bold text-gray-600">B</div>
           </div>
           <span className="text-[9px] font-bold text-gray-400 uppercase tracking-wider">Multiplayer</span>
        </div>
      </div>
    </button>
  );
};

export default GameCard;