import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { QRCodeSVG } from 'qrcode.react';
import { CheckCircle2, ShieldCheck } from 'lucide-react';
import { useAppStore, translations } from '../../store/useAppStore';

export default function PaymentQRISPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const { language } = useAppStore();
  const t = translations[language];

  const total = location.state?.total || 0;

  const handleSimulatePayment = () => {
    // In this Vision-First flow, paying the QRIS brings you to a camera feed to show proof!
    navigate('/verify-receipt', { state: { total } });
  };

  return (
    <div className="min-h-screen bg-deep-dark flex justify-center items-center p-6 text-white overflow-hidden relative">
      {/* Background Ornaments */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-neon-cobalt opacity-20 rounded-full blur-[100px] pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-hot-pink opacity-10 rounded-full blur-[100px] pointer-events-none" />

      <AnimatePresence mode="wait">
        <motion.div 
          key="qris-card"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.9, y: 20 }}
          className="w-full max-w-md bg-[#020617]/80 backdrop-blur-[20px] rounded-3xl border border-white/10 shadow-2xl p-10 text-center relative z-10"
        >
          <ShieldCheck className="w-12 h-12 text-neon-cobalt mx-auto mb-4 opacity-80" />
          <h1 className="text-2xl font-black tracking-widest mb-2">{t.SCAN_QRIS}</h1>
          <p className="text-slate-400 mb-8 font-medium">Buka aplikasi m-banking atau e-wallet Anda.</p>

          <div 
            className="bg-white p-6 rounded-3xl inline-block shadow-[0_0_50px_rgba(0,71,255,0.3)] cursor-pointer hover:scale-105 transition-transform" 
            onClick={handleSimulatePayment}
            title="Klik disini simulasi sudah bayar"
          >
            <QRCodeSVG 
              value={`https://qris.id/mock?amount=${total}`}
              size={250}
              level="H"
              includeMargin={false}
            />
          </div>
          
          <div className="mt-8 pt-8 border-t border-white/10">
            <p className="text-slate-400 text-sm mb-1 uppercase tracking-widest">{t.TOTAL}</p>
            <p className="text-3xl font-black text-hot-pink">Rp {total.toLocaleString('id-ID')}</p>
          </div>

          <button
            onClick={handleSimulatePayment}
            className="mt-6 w-full bg-white/5 hover:bg-white/10 border border-white/10 text-slate-300 hover:text-white py-4 rounded-2xl font-bold uppercase tracking-widest transition-all"
          >
            {t.ALREADY_PAID}
          </button>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}

