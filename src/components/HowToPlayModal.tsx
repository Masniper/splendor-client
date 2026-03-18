import React from 'react';
import { motion } from 'framer-motion';

interface HowToPlayModalProps {
  onClose: () => void;
  isDark: boolean;
}

export const HowToPlayModal = ({ onClose, isDark }: HowToPlayModalProps) => {
  const Section = ({ title, children }: { title: string, children: React.ReactNode }) => (
    <div className="mb-8">
      <h3 className="text-xl font-bold text-amber-500 font-serif mb-3 uppercase tracking-wider border-b border-amber-500/20 pb-1">{title}</h3>
      <div className={`text-sm sm:text-base leading-relaxed font-sans ${isDark ? 'text-stone-300' : 'text-gray-700'}`}>
        {children}
      </div>
    </div>
  );

  return (
    <div className="fixed inset-0 bg-black/80 z-[100] flex items-center justify-center backdrop-blur-sm p-4 overflow-y-auto">
      <motion.div 
        initial={{ opacity: 0, y: 50 }}
        animate={{ opacity: 1, y: 0 }}
        className={`max-w-2xl w-full rounded-3xl border-2 shadow-2xl p-6 sm:p-10 relative flex flex-col max-h-[90vh] ${isDark ? 'bg-zinc-900 border-zinc-700' : 'bg-white border-gray-200'}`}
      >
        <button 
          onClick={onClose}
          className={`absolute top-4 right-4 w-10 h-10 rounded-full flex items-center justify-center transition-colors ${isDark ? 'bg-zinc-800 text-stone-400 hover:bg-zinc-700' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'}`}
        >
          ✕
        </button>

        <h2 className="text-4xl font-black text-amber-500 mb-8 font-serif uppercase tracking-tighter text-center">How to Play</h2>

        <div className="overflow-y-auto pr-4 custom-scrollbar">
          <Section title="Objective">
            Be the first player to reach <span className="font-bold text-amber-500">15 Prestige Points</span>. Once a player hits this target, the current round is completed so all players have had an equal number of turns. The player with the most points wins.
          </Section>

          <Section title="On Your Turn">
            Choose <span className="font-bold italic text-amber-500">exactly ONE</span> of the following actions:
            <ul className="list-disc ml-5 mt-3 space-y-2">
              <li><span className="font-bold">Take 3 Tokens:</span> Take 3 gem tokens of different colors from the bank.</li>
              <li><span className="font-bold">Take 2 Tokens:</span> Take 2 gem tokens of the same color (only if there are at least 4 tokens of that color in the pile).</li>
              <li><span className="font-bold">Reserve a Card:</span> Take 1 Development Card from the board (or draw blindly from a deck) and add it to your hand. You also receive 1 <span className="text-yellow-500 font-bold">Gold Joker</span> token. You can hold a maximum of 3 reserved cards.</li>
              <li><span className="font-bold">Purchase a Card:</span> Buy a face-up card from the board or one of your reserved cards by paying its cost in tokens.</li>
            </ul>
          </Section>

          <Section title="Bonuses & Engine">
            Every Development Card you purchase grants a permanent <span className="font-bold">Gem Bonus</span>. These bonuses act as permanent tokens that never go away, reducing the cost of all future card purchases. Building a strong "engine" of bonuses is key to winning!
          </Section>

          <Section title="Noble Visitors">
            Nobles are worth <span className="font-bold text-amber-500">3 Prestige Points</span>. At the end of your turn, if your permanent card bonuses match a Noble's requirements, they automatically visit you. You can only acquire one Noble per turn.
          </Section>

          <Section title="Token Limit">
            You can hold a maximum of <span className="font-bold text-amber-500">10 tokens</span> at the end of your turn. If you have more, you must discard down to 10.
          </Section>
        </div>

        <button 
          onClick={onClose}
          className="mt-8 w-full py-4 bg-amber-600 text-white rounded-2xl font-bold text-lg hover:bg-amber-500 transition-all active:scale-95 shadow-lg"
        >
          Got it!
        </button>
      </motion.div>
    </div>
  );
};
