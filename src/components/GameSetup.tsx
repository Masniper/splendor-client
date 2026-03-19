import React, { useState, useEffect } from 'react';

interface GameSetupProps {
  onCreateRoom: (name: string, isPublic?: boolean) => void;
  onJoinRoom: (name: string, roomCode: string) => void;
  theme: 'light' | 'dark';
  onThemeToggle: () => void;
  isLoadingPublicRooms?: boolean;
  onLogout?: () => void;
  publicRooms?: Array<{
    id: string;
    hostName: string;
    playerCount: number;
    status?: string;
    canJoin?: boolean;
  }>;
  onListPublicRooms?: () => void;
  onJoinPublicRoom?: (roomId: string) => void;
}

export const GameSetup = ({ 
  onCreateRoom, 
  onJoinRoom, 
  theme, 
  onThemeToggle,
  isLoadingPublicRooms = false,
  onLogout,
  publicRooms = [],
  onListPublicRooms = () => {},
  onJoinPublicRoom = () => {}
}: GameSetupProps) => {
  const [roomCode, setRoomCode] = useState<string>('');
  const [isPublic, setIsPublic] = useState<boolean>(false);
  const [isConnecting, setIsConnecting] = useState(false);
  
  const isDark = theme === 'dark';

  // Auto-refresh public rooms on setup page
  useEffect(() => {
    onListPublicRooms();
    const id = window.setInterval(() => onListPublicRooms(), 8000);
    return () => window.clearInterval(id);
  }, [onListPublicRooms]);

  const handleCreate = () => {
    if (isConnecting) return;
    
    setIsConnecting(true);
    onCreateRoom("", isPublic); 
    
    setTimeout(() => setIsConnecting(false), 3000);
  };

  const handleJoin = () => {
    if (!roomCode.trim() || isConnecting) return;
    
    setIsConnecting(true);
    onJoinRoom("", roomCode.trim().toUpperCase());
    
    setTimeout(() => setIsConnecting(false), 3000);
  };

  const LoadingSpinner = () => (
    <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
    </svg>
  );

  const getStatusBadge = (status?: string) => {
    if (status === 'playing') {
      return (
        <span className="px-2 py-1 text-xs font-bold rounded-full bg-blue-500/20 text-blue-400 border border-blue-500/30">
          In Progress
        </span>
      );
    }
    return (
      <span className="px-2 py-1 text-xs font-bold rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
        Waiting
      </span>
    );
  };

  // فیلتر کردن اتاق‌های بسته شده
  const activePublicRooms = publicRooms.filter(room => room.status !== 'finished');

  return (
    <div
      className={`min-h-screen flex items-center justify-center p-4 font-sans relative overflow-hidden transition-colors duration-500 bg-cover bg-center bg-fixed ${isDark ? 'text-stone-100' : 'text-gray-800'}`}
      style={{
        backgroundImage: `linear-gradient(${isDark ? "rgba(0,0,0,0.6)" : "rgba(255,255,255,0.4)"}, ${isDark ? "rgba(0,0,0,0.6)" : "rgba(255,255,255,0.4)"}), url('/images/startup-bg.jpg')`,
      }}
    >
      <div className="absolute top-4 right-4 z-50">
         <div className="flex items-center gap-2">
           {onLogout && (
             <button
               onClick={onLogout}
               className={`px-3 py-2 rounded-lg transition-colors shadow-md font-bold ${
                 isDark
                   ? 'bg-zinc-800 text-red-300 hover:bg-zinc-700 border border-zinc-700'
                   : 'bg-gray-100 text-red-600 hover:bg-gray-200 border border-gray-200'
               }`}
             >
               Logout
             </button>
           )}
           <button onClick={onThemeToggle} className={`p-2 rounded-lg transition-colors shadow-md ${isDark ? 'bg-zinc-800 text-amber-400 hover:bg-zinc-700' : 'bg-gray-100 text-amber-600 hover:bg-gray-200'}`}>
              {theme === 'dark' ? '☀️' : '🌙'}
           </button>
         </div>
      </div>

      <div
        className={`p-8 sm:p-10 rounded-3xl border-2 shadow-2xl max-w-5xl w-full relative z-10 transition-colors backdrop-blur-sm
          ${isDark ? 'bg-zinc-900/90 border-zinc-700/70' : 'bg-white/95 border-gray-200/80'}
        `}
      >
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-6">
          <div>
            <h1 className="lg:text-6xl text-4xl font-bold text-amber-500 tracking-wider uppercase drop-shadow-lg font-serif mb-2">
              Splendor
            </h1>
            <p className={`font-sans text-lg ${isDark ? 'text-stone-400' : 'text-gray-600'}`}>
              Online Multiplayer Edition
            </p>
          </div>

          <div className="flex items-center gap-3 justify-end">
            <button
              type="button"
              onClick={() => onListPublicRooms()}
              className={`px-4 py-2 rounded-lg font-bold transition-all active:scale-95 ${
                isDark ? 'bg-zinc-800 text-stone-300 hover:bg-zinc-700 border border-zinc-700' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              {isLoadingPublicRooms ? 'Refreshing...' : 'Refresh'}
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left: Join/Create */}
          <div className="lg:col-span-1 space-y-5">
            <div className={`p-5 rounded-2xl border-2 ${isDark ? 'bg-zinc-800/60 border-zinc-700' : 'bg-gray-50 border-gray-200'}`}>
              <h2 className={`text-xl font-bold font-serif mb-3 ${isDark ? 'text-stone-200' : 'text-gray-800'}`}>
                Join Lobby
              </h2>

              <label className={`text-xs font-semibold uppercase tracking-wide ${isDark ? 'text-stone-400' : 'text-gray-500'}`}>
                Room Code
              </label>
              <input
                type="text"
                placeholder="e.g. ABCD12"
                value={roomCode}
                onChange={(e) => setRoomCode(e.target.value)}
                maxLength={8}
                disabled={isConnecting}
                className={`mt-2 w-full px-4 py-3 rounded-xl border-2 transition-all outline-none font-sans text-lg shadow-inner uppercase tracking-widest text-center disabled:opacity-50 ${
                  isDark ? 'bg-zinc-900 border-zinc-700 text-white focus:border-sky-500' : 'bg-white border-gray-300 text-gray-900 focus:border-sky-500'
                }`}
              />
              <button
                type="button"
                onClick={handleJoin}
                disabled={!roomCode.trim() || isConnecting}
                className="mt-4 w-full py-3 bg-sky-600 text-white rounded-xl font-bold font-sans hover:bg-sky-500 shadow-lg transition-all active:scale-95 disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {isConnecting ? (
                  <>
                    <LoadingSpinner />
                    <span>Joining...</span>
                  </>
                ) : (
                  'Join'
                )}
              </button>
            </div>

            <div className={`p-5 rounded-2xl border-2 ${isDark ? 'bg-zinc-800/60 border-zinc-700' : 'bg-gray-50 border-gray-200'}`}>
              <h2 className={`text-xl font-bold font-serif mb-3 ${isDark ? 'text-stone-200' : 'text-gray-800'}`}>
                Create Room
              </h2>

              <div className="flex items-center justify-between gap-3">
                <span className={`font-semibold ${isDark ? 'text-stone-300' : 'text-gray-700'}`}>
                  {isPublic ? '🌍 Public' : '🔒 Private'}
                </span>
                <button
                  type="button"
                  onClick={() => setIsPublic(!isPublic)}
                  className={`px-4 py-2 rounded-lg transition-all font-bold ${
                    isPublic ? 'bg-emerald-600 text-white hover:bg-emerald-500' : 'bg-blue-600 text-white hover:bg-blue-500'
                  }`}
                >
                  {isPublic ? 'Public' : 'Private'}
                </button>
              </div>

              <button
                type="button"
                onClick={handleCreate}
                disabled={isConnecting}
                className="mt-4 w-full py-3 bg-amber-600 text-white rounded-xl font-bold font-sans hover:bg-amber-500 shadow-lg transition-all active:scale-95 disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {isConnecting ? (
                  <>
                    <LoadingSpinner />
                    <span>Creating...</span>
                  </>
                ) : (
                  'Create'
                )}
              </button>
            </div>

            {/* {onLogout && (
              <button
                type="button"
                onClick={() => {
                  const ok = window.confirm('Are you sure you want to logout?');
                  if (ok) onLogout();
                }}
                className={`w-full py-3 rounded-xl font-bold transition-all ${
                  isDark
                    ? 'bg-zinc-800 text-red-300 hover:bg-zinc-700 border border-zinc-700'
                    : 'bg-gray-100 text-red-600 hover:bg-gray-200 border border-gray-200'
                }`}
              >
                Logout
              </button>
            )} */}
          </div>

          {/* Right: Public rooms table */}
          <div className="lg:col-span-2">
            <div className={`p-5 rounded-2xl border-2 ${isDark ? 'bg-zinc-800/60 border-zinc-700' : 'bg-gray-50 border-gray-200'}`}>
              <div className="flex items-center justify-between mb-4">
                <h2 className={`text-xl font-bold font-serif ${isDark ? 'text-stone-200' : 'text-gray-800'}`}>
                  Public Rooms
                </h2>
                <span className={`text-sm ${isDark ? 'text-stone-400' : 'text-gray-500'}`}>
                  {activePublicRooms.length} rooms
                </span>
              </div>

              {isLoadingPublicRooms ? (
                <div className={`p-6 rounded-xl text-center ${isDark ? 'bg-zinc-900/40 border border-zinc-700' : 'bg-white border border-gray-200'}`}>
                  <p className={`${isDark ? 'text-stone-400' : 'text-gray-600'}`}>Loading rooms...</p>
                </div>
              ) : activePublicRooms.length === 0 ? (
                <div className={`p-6 rounded-xl text-center ${isDark ? 'bg-zinc-900/40 border border-zinc-700' : 'bg-white border border-gray-200'}`}>
                  <p className={`${isDark ? 'text-stone-400' : 'text-gray-600'}`}>No public rooms available</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left">
                    <thead>
                      <tr className={`${isDark ? 'text-stone-400' : 'text-gray-500'} text-xs uppercase tracking-wider`}>
                        <th className="py-2">Room</th>
                        <th className="py-2">Status</th>
                        <th className="py-2">Players</th>
                        <th className="py-2 text-right">Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {activePublicRooms.map((room) => (
                        <tr
                          key={room.id}
                          className={`border-t ${isDark ? 'border-zinc-700' : 'border-gray-200'}`}
                        >
                          <td className="py-3">
                            <div className={`font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                              {room.hostName}'s Room
                            </div>
                            <div className={`text-xs ${isDark ? 'text-stone-500' : 'text-gray-500'}`}>
                              {room.id}
                            </div>
                          </td>
                          <td className="py-3">{getStatusBadge(room.status)}</td>
                          <td className={`py-3 ${isDark ? 'text-stone-300' : 'text-gray-700'}`}>
                            {room.playerCount}/4
                          </td>
                          <td className="py-3 text-right">
                            <button
                              onClick={() => {
                                if (room.canJoin !== false) {
                                  onJoinPublicRoom(room.id);
                                  onJoinRoom("", room.id);
                                }
                              }}
                              disabled={room.canJoin === false}
                              className={`px-4 py-2 rounded-lg font-bold transition-all active:scale-95 ${
                                room.canJoin === false
                                  ? 'bg-gray-500 text-gray-300 cursor-not-allowed'
                                  : room.status === 'playing'
                                    ? 'bg-blue-600 text-white hover:bg-blue-500'
                                    : 'bg-emerald-600 text-white hover:bg-emerald-500'
                              }`}
                            >
                              {room.canJoin === false ? 'Full' : 'Join'}
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
