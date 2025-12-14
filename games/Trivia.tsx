import React, { useState } from 'react';
import { ChevronLeft, Brain, Eye, EyeOff, ArrowRight, RefreshCw, HelpCircle } from 'lucide-react';
import { generateTrivia } from '../services/geminiService';
import { TriviaQuestion } from '../types';

const TOPICS = ["General Knowledge", "90s Music", "Science & Nature", "Movies", "History", "Pop Culture"];

const Trivia: React.FC<{ onBack: () => void }> = ({ onBack }) => {
  const [gameState, setGameState] = useState<'setup' | 'loading' | 'playing'>('setup');
  const [topic, setTopic] = useState("General Knowledge");
  const [questions, setQuestions] = useState<TriviaQuestion[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [showAnswer, setShowAnswer] = useState(false);

  const startGame = async () => {
    setGameState('loading');
    const qs = await generateTrivia(topic);
    setQuestions(qs);
    setCurrentIndex(0);
    setShowAnswer(false);
    setGameState('playing');
  };

  const nextQuestion = () => {
    if (currentIndex < questions.length - 1) {
      setCurrentIndex(prev => prev + 1);
      setShowAnswer(false);
    } else {
      setGameState('setup');
    }
  };

  if (gameState === 'setup') {
    return (
      <div className="flex flex-col h-full bg-[#3B82F6] text-white overflow-hidden">
        <div className="flex items-center p-6 pb-2">
          <button onClick={onBack} className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center hover:bg-white/30 transition-colors">
            <ChevronLeft size={24} />
          </button>
          <h1 className="text-2xl font-bold ml-4 game-font tracking-tight">Party Trivia</h1>
        </div>

        <div className="flex-1 p-6 flex flex-col justify-center max-w-md mx-auto w-full">
           <div className="text-center mb-8">
             <div className="w-20 h-20 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-4 backdrop-blur-sm">
                <Brain size={40} className="text-white" />
             </div>
             <h2 className="text-3xl font-bold game-font mb-2">Master of Minds</h2>
             <p className="text-blue-100">Select a topic. One person reads, everyone else answers!</p>
           </div>

           <div className="grid grid-cols-2 gap-3 mb-8">
             {TOPICS.map(t => (
               <button
                 key={t}
                 onClick={() => setTopic(t)}
                 className={`p-4 rounded-2xl font-bold text-sm transition-all ${
                   topic === t
                   ? 'bg-white text-blue-600 shadow-xl scale-105 ring-2 ring-white' 
                   : 'bg-blue-700/50 text-blue-100 hover:bg-blue-600/50'
                 }`}
               >
                 {t}
               </button>
             ))}
           </div>

           <button 
            onClick={startGame}
            className="w-full py-5 bg-white text-blue-600 rounded-2xl font-bold text-xl shadow-xl active:scale-95 transition-all"
          >
            Start Round
          </button>
        </div>
      </div>
    );
  }

  if (gameState === 'loading') {
    return (
      <div className="flex flex-col h-full bg-[#3B82F6] items-center justify-center p-8 text-white">
        <RefreshCw size={48} className="animate-spin mb-6 text-blue-200" />
        <h2 className="text-2xl font-bold game-font text-center mb-2">Preparing Quiz...</h2>
      </div>
    );
  }

  const currentQ = questions[currentIndex];

  return (
    <div className="flex flex-col h-full bg-slate-900 text-white relative overflow-hidden">
       {/* Progress Bar */}
       <div className="h-2 bg-slate-800 w-full">
          <div 
            className="h-full bg-blue-500 transition-all duration-300"
            style={{ width: `${((currentIndex + 1) / questions.length) * 100}%` }}
          />
       </div>

       <div className="flex items-center justify-between p-6">
          <button onClick={() => setGameState('setup')} className="text-gray-400 font-bold text-sm">EXIT</button>
          <span className="font-mono font-bold text-blue-400">Q {currentIndex + 1} / {questions.length}</span>
       </div>

       <div className="flex-1 flex flex-col items-center justify-center p-6 relative z-10">
          {/* Question Card */}
          <div className="w-full max-w-md bg-white text-slate-900 rounded-[32px] p-8 shadow-2xl min-h-[300px] flex flex-col justify-between relative overflow-hidden">
             
             <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-blue-500 to-cyan-400"></div>

             <div className="flex-1 flex items-center justify-center text-center">
               <h3 className="text-2xl sm:text-3xl font-bold leading-tight">
                 {currentQ.question}
               </h3>
             </div>

             {showAnswer && (
               <div className="mt-8 pt-6 border-t border-gray-100 text-center animate-in fade-in slide-in-from-bottom-4">
                  <span className="text-xs font-bold text-gray-400 uppercase tracking-widest block mb-2">Answer</span>
                  <p className="text-xl font-bold text-blue-600">{currentQ.answer}</p>
               </div>
             )}
          </div>
       </div>

       {/* Controls */}
       <div className="p-6 pb-8 grid grid-cols-1 gap-4 max-w-md mx-auto w-full">
          <button 
            onClick={() => setShowAnswer(!showAnswer)}
            className={`w-full py-4 rounded-2xl font-bold text-lg flex items-center justify-center gap-2 transition-all ${
              showAnswer 
              ? 'bg-slate-800 text-gray-300 hover:bg-slate-700' 
              : 'bg-blue-600 text-white hover:bg-blue-500 shadow-lg shadow-blue-900/50'
            }`}
          >
            {showAnswer ? <><EyeOff size={20} /> Hide Answer</> : <><Eye size={20} /> Show Answer</>}
          </button>

          {showAnswer && (
            <button 
              onClick={nextQuestion}
              className="w-full py-4 bg-white text-slate-900 rounded-2xl font-bold text-lg hover:bg-gray-100 transition-all shadow-lg flex items-center justify-center gap-2 animate-in fade-in"
            >
              Next Question <ArrowRight size={20} />
            </button>
          )}
       </div>
    </div>
  );
};

export default Trivia;
