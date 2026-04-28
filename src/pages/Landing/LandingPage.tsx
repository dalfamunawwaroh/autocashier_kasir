import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'motion/react';
import { ChevronRight, Camera } from 'lucide-react';
import { useAppStore, translations } from '../../store/useAppStore';

export default function LandingPage() {
  const { language } = useAppStore();
  const t = translations[language];

  return (
    <div className="min-h-screen bg-deep-dark flex justify-center items-center overflow-hidden relative">
      {/* Immersive background glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[120vw] h-[120vh] bg-neon-cobalt/10 blur-[150px] rounded-full pointer-events-none" />

      <div className="relative z-10 text-center max-w-4xl px-6">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
        >
          <div className="inline-flex items-center gap-2 bg-white/5 border border-white/10 px-6 py-2 rounded-full mb-8 backdrop-blur-md">
            <span className="w-2 h-2 rounded-full bg-hot-pink animate-pulse" />
            <span className="text-white text-sm font-bold tracking-widest uppercase">JagoAI Vision Kiosk</span>
          </div>

          <h1 className="text-6xl md:text-8xl font-black text-white mb-8 tracking-tighter leading-tight">
            CheckOut <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-neon-cobalt to-hot-pink">
              Tanpa Kasir
            </span>
          </h1>

          <p className="text-xl text-slate-400 font-medium mb-16 max-w-2xl mx-auto">
            Letakkan barang Anda di depan kamera, dan AutoCashier akan mengidentifikasi produk secara otomatis.
          </p>

          <Link to="/scan" className="group relative inline-flex items-center justify-center">
            {/* Massive Glowing Start Button */}
            <div className="absolute inset-0 bg-neon-cobalt rounded-3xl blur-xl opacity-50 group-hover:opacity-100 transition-opacity duration-500" />
            <motion.div
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="relative bg-white/10 backdrop-blur-[20px] border border-white/20 px-12 py-8 rounded-3xl shadow-2xl flex items-center justify-center gap-6 overflow-hidden"
            >
              <div className="w-16 h-16 bg-neon-cobalt rounded-2xl flex items-center justify-center">
                <Camera className="w-8 h-8 text-white" />
              </div>
              <div className="flex flex-col text-left">
                <span className="text-white font-black text-3xl uppercase tracking-widest leading-none">
                  {t.START_CHECKOUT}
                </span>
                <span className="text-neon-cobalt font-bold tracking-widest mt-2 uppercase text-sm">
                  {language === 'id' ? 'Mulai Pindai Barang' : 'Start Scanning Items'}
                </span>
              </div>
              <ChevronRight className="w-10 h-10 text-white ml-4 group-hover:translate-x-2 transition-transform" />
            </motion.div>
          </Link>
        </motion.div>
      </div>

      <div className="absolute bottom-8 text-center w-full text-slate-500 text-xs font-bold uppercase tracking-widest">
        Powered by JagoBOT Computer Vision
      </div>
    </div>
  );
}

