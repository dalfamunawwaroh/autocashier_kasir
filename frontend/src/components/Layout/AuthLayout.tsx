import React from 'react';
import { motion } from 'motion/react';
import Logo from '../UI/Logo';

interface AuthLayoutProps {
  children: React.ReactNode;
  title: string;
  subtitle: string;
}

export default function AuthLayout({ children, title, subtitle }: AuthLayoutProps) {
  return (
    <div className="min-h-screen flex bg-slate-50 dark:bg-slate-900 transition-colors duration-300 auth-container">
      {/* Left Side: Aesthetic Image/Branding (Tetap sama) */}
      <div className="hidden lg:flex lg:w-1/2 bg-blue-50 dark:bg-cobalt-600 relative overflow-hidden items-center justify-center p-20">
        <div className="absolute inset-0 opacity-20" style={{ backgroundImage: 'radial-gradient(currentColor 1px, transparent 1px)', backgroundSize: '30px 30px' }} />
        
        <div className="relative z-10 text-center space-y-8">
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.8 }}
            className="w-24 h-24 bg-white/10 backdrop-blur-xl border border-white/20 rounded-[2rem] mx-auto flex items-center justify-center shadow-2xl"
          >
            <Logo />
          </motion.div>
          
          <div className="space-y-4">
            <h2 className="text-4xl font-black text-slate-900 dark:text-white uppercase tracking-tight leading-tight">
              Koperasi GIAT <br /> <span className="text-slate-600 dark:text-blue-200">Modern AI POS</span>
            </h2>
            <p className="text-slate-500 dark:text-blue-100 text-lg max-w-md mx-auto leading-relaxed">
              Ekosistem digital berbasis AI untuk transformasi retail modern.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4 pt-12">
            <div className="bg-white/50 dark:bg-white/5 backdrop-blur-md border border-slate-200 dark:border-white/10 p-6 rounded-3xl">
              <p className="text-2xl font-black text-slate-900 dark:text-white">90%</p>
              <p className="text-[10px] text-slate-500 dark:text-blue-200 font-bold uppercase tracking-widest">Accuracy</p>
            </div>
            <div className="bg-white/50 dark:bg-white/5 backdrop-blur-md border border-slate-200 dark:border-white/10 p-6 rounded-3xl">
              <p className="text-2xl font-black text-slate-900 dark:text-white">±15km</p>
              <p className="text-[10px] text-slate-500 dark:text-blue-200 font-bold uppercase tracking-widest">Range</p>
            </div>
          </div>
        </div>

        <div className="absolute -top-20 -left-20 w-64 h-64 bg-blue-500/20 blur-[100px] rounded-full" />
        <div className="absolute -bottom-20 -right-20 w-64 h-64 bg-indigo-500/20 blur-[100px] rounded-full" />
      </div>

      {/* Right Side: Auth Form (REVISED FOR CENTERING LOGO) */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-6 sm:p-12 lg:p-20">
        <motion.div 
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="w-full max-w-md bg-white dark:bg-slate-800 p-8 sm:p-10 rounded-3xl shadow-xl border border-slate-200 dark:border-slate-700 space-y-8 auth-card"
        >
          {/* Header Section with Logo inside the Card */}
          <div className="flex flex-col items-center justify-center text-center space-y-4">
            <div className="transform scale-110 mb-2">
              <Logo /> {/* Logo sekarang di atas judul */}
            </div>
            <div className="space-y-2">
              <h1 className="text-3xl font-black text-slate-900 dark:text-white uppercase tracking-tight">
                {title}
              </h1>
              <p className="text-sm text-slate-600 dark:text-slate-400 font-medium">
                {subtitle}
              </p>
            </div>
          </div>

          {children}
        </motion.div>
      </div>
    </div>
  );
}