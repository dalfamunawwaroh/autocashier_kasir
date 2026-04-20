import React from 'react';
import { motion } from 'motion/react';

export default function Logo() {
  return (
    <div className="flex items-center gap-4 group cursor-pointer justify-center">
      <div className="w-10 h-10 flex items-center justify-center shrink-0 rounded-full bg-gradient-to-br from-[#1e40af] to-[#60a5fa] shadow-lg group-hover:scale-110 transition-transform duration-300">
        
        {/* Lens Inner */}
        <div className="w-7 h-7 rounded-full bg-slate-900 flex items-center justify-center overflow-hidden border border-white/20">
          
          {/* Lens Center Pulse */}
          <motion.div 
            className="w-2 h-2 rounded-full bg-blue-400 shadow-[0_0_8px_rgba(96,165,250,0.8)]"
            animate={{ 
              scale: [1, 1.5, 1],
              opacity: [0.5, 1, 0.5]
            }}
            transition={{ 
              duration: 2, 
              repeat: Infinity,
              ease: "easeInOut"
            }}
          />
        </div>
      </div>
      
      <span className="text-xl font-bold text-slate-900 dark:text-white tracking-tight font-poppins group-hover:bg-gradient-to-r group-hover:from-[#1e40af] group-hover:to-[#60a5fa] group-hover:bg-clip-text group-hover:text-transparent transition-all duration-300">
        AutoCashier
      </span>
    </div>
  );
}
