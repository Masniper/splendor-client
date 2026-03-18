import { useState } from 'react';

interface GameSetupProps {
  onStart: (names: string[]) => void;
  theme: 'light' | 'dark';
  onThemeToggle: () => void;
}

export const GameSetup = ({ onStart, theme, onThemeToggle }: GameSetupProps) => {
  const [step, setStep] = useState<1 | 2>(1);
  const [playerCount, setPlayerCount] = useState<number>(2);
  const [playerNames, setPlayerNames] = useState<string[]>(['', '', '', '']);
  const isDark = theme === 'dark';

  const handlePlayerCountSelect = (count: number) => {
    setPlayerCount(count);
    setStep(2);
  };

  const handleStart = () => {
    const names = playerNames.slice(0, playerCount).map((name, i) => name.trim() || `Player ${i + 1}`);
    onStart(names);
  };

  return (
    <div
      className={`min-h-screen flex items-center justify-center p-4 font-sans relative overflow-hidden transition-colors duration-500 bg-cover bg-center bg-fixed ${isDark ? 'text-stone-100' : 'text-gray-800'}`}
      style={{
        backgroundImage: `linear-gradient(${isDark ? "rgba(0,0,0,0.22)" : "rgba(255,255,255,0.14)"}, ${isDark ? "rgba(0,0,0,0.22)" : "rgba(255,255,255,0.14)"}), url('/images/startup-bg.jpg')`,
      }}
    >
      
      <div
        className={`p-10 rounded-3xl border-2 shadow-xl max-w-xl w-full text-center relative z-10 transition-colors
          ${isDark ? 'bg-zinc-900/80 border-zinc-700/70' : 'bg-white/90 border-gray-200/80'}
        `}
      >
        <div className="absolute top-4 right-4">
           <button onClick={onThemeToggle} className={`p-2 rounded-full transition-colors ${isDark ? 'bg-zinc-700 text-amber-400 hover:bg-zinc-600' : 'bg-gray-200 text-amber-600 hover:bg-gray-300'}`}>
              {theme === 'dark' ? '☀️' : '🌙'}
           </button>
        </div>
        <h1 className="lg:text-6xl text-4xl font-bold text-amber-500 tracking-wider uppercase drop-shadow-lg font-serif mb-2">Splendor</h1>
        <p className={`mb-8 font-sans text-lg ${isDark ? 'text-stone-400' : 'text-gray-600'}`}>A game of chip-collecting and card development.</p>
        
        {step === 1 && (
          <>
            <h2 className={`text-2xl font-bold font-serif mb-6 ${isDark ? 'text-stone-200' : 'text-gray-800'}`}>Select Player Count</h2>
            <div className="flex flex-col gap-4">
              {[2, 3, 4].map(count => (
                <button 
                  key={count}
                  onClick={() => handlePlayerCountSelect(count)}
                  className={`w-full py-4 rounded-xl border transition-all shadow-md flex justify-between items-center px-8 group ${isDark ? 'bg-gradient-to-r from-zinc-700 to-zinc-800 hover:from-amber-700 hover:to-amber-900 border-zinc-600 hover:border-amber-500 text-stone-200 hover:text-white hover:shadow-amber-900/50' : 'bg-white hover:bg-amber-50 border-gray-200 hover:border-amber-400 text-gray-700 hover:text-amber-700 hover:shadow-amber-500/20'}`}
                >
                  <span className="text-xl font-bold">{count} Players</span>
                  <span className={`text-sm font-normal group-hover:text-amber-500 ${isDark ? 'text-stone-400' : 'text-gray-500'}`}>
                    {count === 2 ? '4 tokens / 3 nobles' : count === 3 ? '5 tokens / 4 nobles' : '7 tokens / 5 nobles'}
                  </span>
                </button>
              ))}
            </div>
          </>
        )}

        {step === 2 && (
          <div className="space-y-6">
            <h2 className={`text-2xl font-bold font-serif ${isDark ? 'text-stone-200' : 'text-gray-800'}`}>Enter Player Names</h2>
            <div className="grid grid-cols-1 gap-4">
              {Array.from({ length: playerCount }).map((_, i) => (
                <input 
                  key={i}
                  type="text"
                  placeholder={`Player ${i + 1} Name`}
                  value={playerNames[i]}
                  onChange={(e) => {
                    const newNames = [...playerNames];
                    newNames[i] = e.target.value;
                    setPlayerNames(newNames);
                  }}
                  className={`px-4 py-3 rounded-lg border-2 transition-all outline-none font-sans ${isDark ? 'bg-zinc-700 border-zinc-600 text-white focus:border-amber-500' : 'bg-white border-gray-200 text-gray-800 focus:border-amber-500'}`}
                />
              ))}
            </div>
            <div className="flex gap-4 pt-4">
              <button 
                onClick={() => setStep(1)}
                className={`flex-1 py-3 rounded-xl font-bold font-sans transition-all ${isDark ? 'bg-zinc-700 text-stone-300 hover:bg-zinc-600' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}
              >
                Back
              </button>
              <button 
                onClick={handleStart}
                className="flex-2 py-3 bg-amber-600 text-white rounded-xl font-bold font-sans hover:bg-amber-500 shadow-lg transition-all active:scale-95"
              >
                Start Game
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
