import React, { useState, useEffect, useRef } from 'react';
import { Settings, Play, Square, RefreshCw, AlertTriangle, Wand2, Music, Check, ChevronLeft, Volume2, AlignLeft } from 'lucide-react';
import { generateChallenge } from '../services/geminiService';
import { PassTheHatSettings, ChallengeResponse } from '../types';

// Default royalty-free upbeat track
const DEFAULT_MUSIC = "https://cdn.pixabay.com/download/audio/2022/03/10/audio_c8c8a73467.mp3?filename=fun-life-112188.mp3";
const MAX_REGENERATIONS = 5;
const STORAGE_KEY = 'partybox_pass_the_hat_settings';

interface SettingsModalProps {
  settings: PassTheHatSettings;
  onSettingsChange: (newSettings: PassTheHatSettings) => void;
  onClose: () => void;
}

const SettingsModal: React.FC<SettingsModalProps> = ({ settings, onSettingsChange, onClose }) => (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-md z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="bg-white w-full max-w-md rounded-[32px] p-6 shadow-2xl border border-gray-100 max-h-[90vh] overflow-y-auto">
        
        <div className="flex items-center justify-between mb-6">
           <h2 className="text-2xl font-bold game-font text-gray-900 tracking-tight">Game Settings</h2>
           <button onClick={onClose} className="text-gray-400 hover:text-black transition-colors">Close</button>
        </div>
        
        <div className="space-y-6">
          {/* Music URL */}
          <div className="group">
             <label className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2 block">Music URL</label>
             <div className="flex items-center bg-gray-50 rounded-xl px-4 py-3 border border-gray-200 focus-within:border-black focus-within:ring-1 focus-within:ring-black transition-all">
                <Music size={18} className="text-gray-400 mr-3" />
                <input 
                  type="text" 
                  value={settings.musicUrl}
                  onChange={(e) => onSettingsChange({...settings, musicUrl: e.target.value})}
                  placeholder="https://..."
                  className="bg-transparent w-full text-sm font-medium text-gray-900 outline-none placeholder:text-gray-300"
                />
             </div>
          </div>

          {/* Timer */}
          <div>
            <label className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2 block">Duration Range (Sec)</label>
            <div className="flex items-center gap-4">
               <div className="flex-1 bg-gray-50 rounded-xl p-3 border border-gray-200 text-center">
                  <input 
                    type="number" 
                    value={settings.minDuration}
                    onChange={(e) => onSettingsChange({...settings, minDuration: Number(e.target.value)})}
                    className="bg-transparent w-full text-xl font-bold text-gray-900 text-center outline-none"
                  />
                  <span className="text-[10px] text-gray-400 font-bold uppercase">Min</span>
               </div>
               <span className="text-gray-300 font-light text-2xl">/</span>
               <div className="flex-1 bg-gray-50 rounded-xl p-3 border border-gray-200 text-center">
                  <input 
                    type="number" 
                    value={settings.maxDuration}
                    onChange={(e) => onSettingsChange({...settings, maxDuration: Number(e.target.value)})}
                    className="bg-transparent w-full text-xl font-bold text-gray-900 text-center outline-none"
                  />
                  <span className="text-[10px] text-gray-400 font-bold uppercase">Max</span>
               </div>
            </div>
          </div>

          {/* Context */}
          <div>
            <div className="flex items-center justify-between mb-2">
                <label className="text-xs font-bold text-gray-400 uppercase tracking-wider block">Context / Vibe</label>
                <AlignLeft size={14} className="text-gray-400" />
            </div>
            
            <textarea 
              value={settings.theme}
              onChange={(e) => onSettingsChange({...settings, theme: e.target.value})}
              placeholder="e.g. We are a group of college students at a park, make it spicy but safe..."
              rows={4}
              className="w-full bg-gray-50 text-gray-900 font-medium p-4 rounded-2xl border border-gray-200 focus:border-black outline-none transition-all resize-none text-sm leading-relaxed"
            />
          </div>

          {/* Toggle */}
          <div className="flex items-center justify-between py-2 border-t border-gray-100 pt-4">
             <span className="text-sm font-bold text-gray-700">Use AI Generation</span>
             <label className="relative inline-flex items-center cursor-pointer">
                <input 
                  type="checkbox" 
                  checked={settings.useAI}
                  onChange={(e) => onSettingsChange({...settings, useAI: e.target.checked})}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-black"></div>
             </label>
          </div>
        </div>

        <button 
          onClick={onClose}
          className="w-full mt-8 bg-black hover:bg-gray-800 text-white font-bold py-4 rounded-2xl transition-all active:scale-[0.98] shadow-lg shadow-black/20"
        >
          Save Changes
        </button>
      </div>
    </div>
);

const PassTheHat: React.FC<{ onBack: () => void }> = ({ onBack }) => {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const timerRef = useRef<number | null>(null);
  
  // Ref to store ALL challenges generated in this session (across rounds)
  // This persists as long as the component is mounted (the "session")
  const sessionHistoryRef = useRef<string[]>([]);
  
  const [isPlaying, setIsPlaying] = useState(false);
  const [gameOver, setGameOver] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [isLoadingChallenge, setIsLoadingChallenge] = useState(false);

  // Challenge History State (for the current round's regeneration list)
  const [challengesHistory, setChallengesHistory] = useState<ChallengeResponse[]>([]);
  const [selectedChallengeId, setSelectedChallengeId] = useState<number>(0);

  // Settings state with LocalStorage persistence
  const [settings, setSettings] = useState<PassTheHatSettings>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        return {
            minDuration: 5,
            maxDuration: 20,
            theme: 'Funny & Active',
            useAI: true,
            musicUrl: DEFAULT_MUSIC,
            ...JSON.parse(saved)
        };
      }
    } catch (e) {
      console.error("Failed to parse settings from storage", e);
    }
    return {
      minDuration: 5,
      maxDuration: 20,
      theme: 'Funny & Active',
      useAI: true,
      musicUrl: DEFAULT_MUSIC
    };
  });
  
  // Track the last played URL to handle changes efficiently
  const lastMusicUrlRef = useRef<string>(settings.musicUrl);

  // Save settings whenever they change
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
  }, [settings]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopGame(false);
      // Note: sessionHistoryRef is automatically cleared when component unmounts
    };
  }, []);

  const startGame = () => {
    setGameOver(false);
    setChallengesHistory([]);
    setSelectedChallengeId(0);
    setIsPlaying(true);
    
    // Play Audio
    if (audioRef.current) {
      if (settings.musicUrl !== lastMusicUrlRef.current) {
        audioRef.current.currentTime = 0;
        lastMusicUrlRef.current = settings.musicUrl;
      }
      audioRef.current.play().catch(e => console.error("Audio playback failed", e));
    }

    const duration = Math.floor(Math.random() * (settings.maxDuration - settings.minDuration + 1) + settings.minDuration);
    
    timerRef.current = window.setTimeout(() => {
      stopGame(true);
    }, duration * 1000);
  };

  const stopGame = (naturalEnd: boolean) => {
    setIsPlaying(false);
    if (audioRef.current) audioRef.current.pause();
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }

    if (naturalEnd) {
      setGameOver(true);
      fetchChallenge();
      if (navigator.vibrate) navigator.vibrate([200, 100, 200]);
    }
  };

  const fetchChallenge = async () => {
    if (challengesHistory.length >= MAX_REGENERATIONS) return;

    setIsLoadingChallenge(true);
    let newChallenge: ChallengeResponse;

    if (!settings.useAI) {
      const offlineChallenges = [
        "Do 10 jumping jacks!",
        "Sing the chorus of your favorite song.",
        "Tell a joke.",
        "Act like a monkey for 15 seconds.",
        "Spin around 5 times."
      ];
      // Simple logic to avoid immediate repetition for offline mode if possible
      const available = offlineChallenges.filter(c => !sessionHistoryRef.current.includes(c));
      const source = available.length > 0 ? available : offlineChallenges;
      
      const randomText = source[Math.floor(Math.random() * source.length)];
      newChallenge = { challenge: randomText, category: "Classic" };
    } else {
      // Pass the entire session history to the AI service
      newChallenge = await generateChallenge(settings.theme, sessionHistoryRef.current);
    }

    // Add to session history to prevent future duplicates
    if (newChallenge.challenge) {
       sessionHistoryRef.current.push(newChallenge.challenge);
    }

    setChallengesHistory(prev => [newChallenge, ...prev]);
    setSelectedChallengeId(0);
    setIsLoadingChallenge(false);
  };

  return (
    <div className={`flex flex-col h-full relative overflow-hidden transition-all duration-700 ${isPlaying ? 'bg-[#111111]' : 'bg-transparent'}`}>
      <audio ref={audioRef} src={settings.musicUrl} loop onError={(e) => console.log('Audio error', e)} />

      {/* Visualizer Background */}
      {isPlaying && (
        <div className="absolute inset-0 pointer-events-none">
           <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-indigo-500/20 rounded-full blur-[100px] animate-pulse"></div>
           <div className="absolute top-1/4 left-1/4 w-[400px] h-[400px] bg-rose-500/20 rounded-full blur-[80px] animate-float"></div>
        </div>
      )}

      {/* Header */}
      <div className="relative z-10 flex items-center justify-between p-6">
        <button 
          onClick={onBack} 
          className={`w-12 h-12 rounded-full flex items-center justify-center transition-all ${
            isPlaying 
            ? 'bg-white/10 text-white hover:bg-white/20' 
            : 'bg-white text-black hover:bg-gray-50 border border-black/5 shadow-sm'
          }`}
        >
          <ChevronLeft size={24} />
        </button>
        <button 
          onClick={() => setShowSettings(true)} 
          className={`w-12 h-12 rounded-full flex items-center justify-center transition-all ${
            isPlaying 
            ? 'bg-white/10 text-white hover:bg-white/20' 
            : 'bg-white text-black hover:bg-gray-50 border border-black/5 shadow-sm'
          }`}
        >
          <Settings size={20} />
        </button>
      </div>

      <div className="relative z-10 flex-1 flex flex-col items-center justify-center px-4 w-full max-w-lg mx-auto h-full overflow-hidden">
        
        {!gameOver ? (
          <div className="flex flex-col items-center w-full">
            {/* Modern Player UI */}
            <div className="relative mb-12">
               {isPlaying && (
                 <div className="absolute -inset-4 bg-gradient-to-tr from-pink-500 to-violet-500 rounded-full blur-xl opacity-40 animate-pulse"></div>
               )}
               
               {/* Vinyl Record */}
               <div 
                  className="relative w-64 h-64 rounded-full flex items-center justify-center shadow-2xl bg-black"
                  // Use explicit inline styles for animation to ensure it works reliably
                  style={{ 
                    animation: 'spin 2s linear infinite',
                    animationPlayState: isPlaying ? 'running' : 'paused'
                  }}
               >
                   {/* Album Art Placeholder / Vinyl Look */}
                   <div className="absolute inset-0 rounded-full bg-black border-[6px] border-[#1a1a1a] shadow-inner overflow-hidden">
                      <div className="absolute inset-0 opacity-20" style={{ backgroundImage: 'repeating-radial-gradient(#333 0, #333 2px, transparent 3px, transparent 6px)' }}></div>
                   </div>
                   
                   {/* Center Label */}
                   <div className="relative w-24 h-24 rounded-full bg-gradient-to-br from-yellow-300 to-orange-400 flex items-center justify-center shadow-lg z-10">
                      <div className="w-3 h-3 bg-black rounded-full"></div>
                   </div>
               </div>

               {/* Vinyl Tracker / Tonearm */}
               <div className="absolute -top-10 -right-10 w-32 h-32 pointer-events-none z-20">
                   <svg 
                      viewBox="0 0 100 100" 
                      className="w-full h-full drop-shadow-xl transition-transform duration-700 ease-in-out origin-[80px_20px]"
                      style={{ transform: isPlaying ? 'rotate(28deg)' : 'rotate(0deg)' }}
                   >
                      {/* Pivot Base */}
                      <circle cx="80" cy="20" r="12" className="fill-gray-300 stroke-gray-400" strokeWidth="2" />
                      <circle cx="80" cy="20" r="4" className="fill-gray-600" />
                      
                      {/* Arm */}
                      <rect x="76" y="20" width="8" height="60" rx="4" className="fill-gray-300 stroke-gray-400" strokeWidth="1" transform="rotate(-15 80 20)" />
                      
                      {/* Headshell / Cartridge */}
                      <rect x="44" y="74" width="18" height="24" rx="2" className="fill-gray-900" transform="rotate(-15 54 87)" />
                      {/* Needle Indicator */}
                      <rect x="49" y="94" width="8" height="3" className="fill-yellow-500" transform="rotate(-15 54 87)" />
                   </svg>
               </div>
            </div>

            <div className="space-y-3 mb-12 text-center">
              <h2 className={`text-4xl font-bold game-font tracking-tight ${isPlaying ? 'text-white' : 'text-gray-900'}`}>
                {isPlaying ? "Don't Stop!" : "Pass The Hat"}
              </h2>
              <p className={`text-sm font-medium tracking-wide uppercase ${isPlaying ? 'text-gray-400' : 'text-gray-500'}`}>
                {isPlaying ? "Pass the device quickly" : "Press play to start"}
              </p>
            </div>

            <button 
              onClick={isPlaying ? () => stopGame(false) : startGame}
              className={`w-full py-5 rounded-full text-lg font-bold tracking-wide transition-all active:scale-95 flex items-center justify-center gap-3 shadow-lg ${
                isPlaying 
                ? 'bg-rose-500 hover:bg-rose-600 text-white shadow-rose-500/30' 
                : 'bg-black hover:bg-gray-900 text-white shadow-black/20'
              }`}
            >
              {isPlaying ? (
                <><Square fill="currentColor" size={18} /> STOP MUSIC</>
              ) : (
                <><Play fill="currentColor" size={18} /> START</>
              )}
            </button>
          </div>
        ) : (
          <div className="flex flex-col w-full h-full max-h-full animate-pop pb-6">
            
            <div className="text-center mb-6 shrink-0">
               <div className="inline-flex w-16 h-16 bg-red-100 rounded-full items-center justify-center mb-4 animate-bounce text-red-500">
                    <AlertTriangle size={32} />
                </div>
                <h2 className="text-4xl font-black text-gray-900 game-font tracking-tight leading-none mb-1">Caught!</h2>
                <p className="text-gray-400 font-medium text-sm">Choose your penalty below</p>
            </div>

            {/* Main Content Area - Scrollable List */}
            <div className="flex-1 overflow-y-auto no-scrollbar space-y-3 mb-4 px-1">
               {/* Loading State */}
               {isLoadingChallenge && (
                  <div className="p-6 rounded-3xl bg-gray-50 border-2 border-dashed border-gray-200 flex flex-col items-center justify-center text-center animate-pulse">
                      <RefreshCw className="animate-spin text-gray-400 mb-2" />
                      <span className="text-sm font-bold text-gray-400">Consulting the AI Oracle...</span>
                  </div>
               )}

               {/* Challenges List */}
               {challengesHistory.map((item, idx) => (
                  <button
                     key={idx}
                     onClick={() => setSelectedChallengeId(idx)}
                     className={`w-full p-5 rounded-3xl text-left transition-all duration-300 group relative overflow-hidden ${
                        selectedChallengeId === idx 
                        ? 'bg-black text-white shadow-xl shadow-black/20 scale-[1.02]' 
                        : 'bg-white text-gray-600 border border-gray-100 hover:border-gray-300 hover:bg-gray-50'
                     }`}
                  >
                     <div className="flex items-start justify-between gap-4 relative z-10">
                        <div>
                           <span className={`text-[10px] font-bold uppercase tracking-wider mb-1 block ${selectedChallengeId === idx ? 'text-gray-400' : 'text-gray-400'}`}>
                              Option {challengesHistory.length - idx}
                           </span>
                           <p className={`text-lg font-bold leading-snug ${selectedChallengeId === idx ? 'text-white' : 'text-gray-900'}`}>
                              {item.challenge}
                           </p>
                        </div>
                        
                        <div className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 border-2 transition-colors ${
                           selectedChallengeId === idx 
                           ? 'bg-white border-white text-black' 
                           : 'border-gray-200 text-transparent'
                        }`}>
                           <Check size={14} strokeWidth={4} />
                        </div>
                     </div>
                  </button>
               ))}
               
               {/* Empty State Fallback */}
               {!isLoadingChallenge && challengesHistory.length === 0 && (
                  <div className="p-8 text-center text-gray-400 text-sm">
                     Something went wrong. Try regenerating!
                  </div>
               )}
            </div>

            {/* Fixed Bottom Actions */}
            <div className="shrink-0 w-full grid grid-cols-3 gap-3 pt-2 border-t border-gray-100">
              <button 
                onClick={fetchChallenge}
                disabled={isLoadingChallenge || challengesHistory.length >= MAX_REGENERATIONS}
                className={`col-span-1 py-4 rounded-2xl font-bold transition-all flex flex-col items-center justify-center gap-1 border ${
                  challengesHistory.length >= MAX_REGENERATIONS 
                  ? 'bg-gray-50 border-gray-100 text-gray-300 cursor-not-allowed' 
                  : 'bg-white border-gray-200 text-gray-900 hover:bg-gray-50 hover:border-gray-300'
                }`}
              >
                 <span className={`text-[10px] font-black uppercase ${challengesHistory.length >= MAX_REGENERATIONS ? 'text-gray-300' : 'text-gray-400'}`}>
                    {challengesHistory.length >= MAX_REGENERATIONS ? 'Max Limit' : `${MAX_REGENERATIONS - challengesHistory.length} Left`}
                 </span>
                 <Wand2 size={20} className={isLoadingChallenge ? 'animate-spin' : ''} />
              </button>
              
              <button 
                onClick={startGame}
                className="col-span-2 bg-black hover:bg-gray-900 text-white py-4 rounded-2xl font-bold transition-all flex items-center justify-center gap-2 shadow-lg shadow-gray-200 active:scale-95"
              >
                <Play size={20} fill="currentColor"/>
                Play Again
              </button>
            </div>
          </div>
        )}
      </div>

      {showSettings && (
        <SettingsModal 
          settings={settings} 
          onSettingsChange={setSettings} 
          onClose={() => setShowSettings(false)} 
        />
      )}
    </div>
  );
};

export default PassTheHat;