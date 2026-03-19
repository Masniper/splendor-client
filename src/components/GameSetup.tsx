import React, { useState, useEffect } from 'react';

interface GameSetupProps {
  onCreateRoom: (name: string) => void;
  onJoinRoom: (name: string, roomCode: string) => void;
  theme: 'light' | 'dark';
  onThemeToggle: () => void;
}

export const GameSetup = ({ onCreateRoom, onJoinRoom, theme, onThemeToggle }: GameSetupProps) => {
  const [mode, setMode] = useState<'select' | 'create' | 'join'>('select');
  const [roomCode, setRoomCode] = useState<string>('');
  const [isConnecting, setIsConnecting] = useState(false);
  
  const isDark = theme === 'dark';

  useEffect(() => {
    setIsConnecting(false);
  }, [mode]);

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isConnecting) return;
    
    setIsConnecting(true);
    onCreateRoom(""); 
    
    // Safety fallback: re-enable button if connection takes too long or fails silently
    setTimeout(() => setIsConnecting(false), 3000);
  };

  const handleJoinSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!roomCode.trim() || isConnecting) return;
    
    setIsConnecting(true);
    onJoinRoom("", roomCode.trim().toUpperCase());
    
    // Safety fallback
    setTimeout(() => setIsConnecting(false), 3000);
  };

  // آیکون لودینگ (Spinner)
  const LoadingSpinner = () => (
    <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
    </svg>
  );

  return (
    <div
      className={`min-h-screen flex items-center justify-center p-4 font-sans relative overflow-hidden transition-colors duration-500 bg-cover bg-center bg-fixed ${isDark ? 'text-stone-100' : 'text-gray-800'}`}
      style={{
        backgroundImage: `linear-gradient(${isDark ? "rgba(0,0,0,0.6)" : "rgba(255,255,255,0.4)"}, ${isDark ? "rgba(0,0,0,0.6)" : "rgba(255,255,255,0.4)"}), url('/images/startup-bg.jpg')`,
      }}
    >
      {/* Theme Toggle in top corner to match AuthScreen */}
      <div className="absolute top-4 right-4 z-50">
         <button onClick={onThemeToggle} className={`p-2 rounded-lg transition-colors shadow-md ${isDark ? 'bg-zinc-800 text-amber-400 hover:bg-zinc-700' : 'bg-gray-100 text-amber-600 hover:bg-gray-200'}`}>
            {theme === 'dark' ? '☀️' : '🌙'}
         </button>
      </div>

      <div
        className={`p-10 rounded-3xl border-2 shadow-2xl max-w-xl w-full text-center relative z-10 transition-colors backdrop-blur-sm
          ${isDark ? 'bg-zinc-900/90 border-zinc-700/70' : 'bg-white/95 border-gray-200/80'}
        `}
      >
        <h1 className="lg:text-6xl text-4xl font-bold text-amber-500 tracking-wider uppercase drop-shadow-lg font-serif mb-2">Splendor</h1>
        <p className={`mb-8 font-sans text-lg ${isDark ? 'text-stone-400' : 'text-gray-600'}`}>Online Multiplayer Edition</p>
        
        {/* Step 1: Select Action */}
        {mode === 'select' && (
          <div className="flex flex-col gap-4 mt-6">
            <button 
              onClick={() => setMode('create')}
              className={`w-full py-5 rounded-xl border-2 transition-all shadow-lg flex justify-center items-center px-8 group ${isDark ? 'bg-gradient-to-r from-zinc-800 to-zinc-900 hover:from-amber-800 hover:to-amber-900 border-zinc-700 hover:border-amber-500 text-stone-200 hover:text-white' : 'bg-white hover:bg-amber-50 border-gray-200 hover:border-amber-400 text-gray-800 hover:text-amber-800'}`}
            >
              <span className="text-2xl font-bold font-serif">Create New Room</span>
            </button>

            <button 
              onClick={() => setMode('join')}
              className={`w-full py-5 rounded-xl border-2 transition-all shadow-lg flex justify-center items-center px-8 group ${isDark ? 'bg-gradient-to-r from-zinc-800 to-zinc-900 hover:from-sky-800 hover:to-sky-900 border-zinc-700 hover:border-sky-500 text-stone-200 hover:text-white' : 'bg-white hover:bg-sky-50 border-gray-200 hover:border-sky-400 text-gray-800 hover:text-sky-800'}`}
            >
              <span className="text-2xl font-bold font-serif">Join Existing Room</span>
            </button>
          </div>
        )}

        {/* Step 2A: Create Room */}
        {mode === 'create' && (
          <form onSubmit={handleCreateSubmit} className="space-y-6 animate-in fade-in slide-in-from-bottom-4">
            <h2 className={`text-2xl font-bold font-serif ${isDark ? 'text-stone-200' : 'text-gray-800'}`}>Create Room</h2>
            <p className={`text-sm ${isDark ? 'text-stone-400' : 'text-gray-500'}`}>
              You are about to create a new game room. You will be the host.
            </p>
            
            <div className="flex gap-4 pt-4">
              <button 
                type="button"
                onClick={() => setMode('select')}
                disabled={isConnecting}
                className={`flex-1 py-4 rounded-xl font-bold font-sans transition-all disabled:opacity-50 ${isDark ? 'bg-zinc-800 text-stone-300 hover:bg-zinc-700 border border-zinc-700' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}
              >
                Back
              </button>
              <button 
                type="submit"
                disabled={isConnecting}
                className="flex-[2] py-4 bg-amber-600 text-white rounded-xl font-bold font-sans hover:bg-amber-500 shadow-lg transition-all active:scale-95 disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {isConnecting ? (
                  <>
                    <LoadingSpinner />
                    <span>Creating...</span>
                  </>
                ) : (
                  "Create Room"
                )}
              </button>
            </div>
          </form>
        )}

        {/* Step 2B: Join Room */}
        {mode === 'join' && (
          <form onSubmit={handleJoinSubmit} className="space-y-6 animate-in fade-in slide-in-from-bottom-4">
            <h2 className={`text-2xl font-bold font-serif ${isDark ? 'text-stone-200' : 'text-gray-800'}`}>Join Room</h2>

            <div className="flex flex-col gap-4 text-left">
              <label className={`text-sm font-semibold uppercase tracking-wide ${isDark ? 'text-stone-400' : 'text-gray-500'}`}>Room Code</label>
              <input 
                type="text"
                placeholder="e.g. ABCD12"
                value={roomCode}
                onChange={(e) => setRoomCode(e.target.value)}
                maxLength={8}
                required
                disabled={isConnecting}
                className={`px-4 py-4 rounded-xl border-2 transition-all outline-none font-sans text-lg shadow-inner uppercase tracking-widest text-center disabled:opacity-50 ${isDark ? 'bg-zinc-800 border-zinc-700 text-white focus:border-sky-500' : 'bg-gray-50 border-gray-300 text-gray-900 focus:border-sky-500'}`}
              />
            </div>

            <div className="flex gap-4 pt-4">
              <button 
                type="button"
                onClick={() => setMode('select')}
                disabled={isConnecting}
                className={`flex-1 py-4 rounded-xl font-bold font-sans transition-all disabled:opacity-50 ${isDark ? 'bg-zinc-800 text-stone-300 hover:bg-zinc-700 border border-zinc-700' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}
              >
                Back
              </button>
              <button 
                type="submit"
                disabled={!roomCode.trim() || isConnecting}
                className="flex-[2] py-4 bg-sky-600 text-white rounded-xl font-bold font-sans hover:bg-sky-500 shadow-lg transition-all active:scale-95 disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {isConnecting ? (
                  <>
                    <LoadingSpinner />
                    <span>Joining...</span>
                  </>
                ) : (
                  "Join Room"
                )}
              </button>
            </div>
          </form>
        )}

      </div>
    </div>
  );
};
