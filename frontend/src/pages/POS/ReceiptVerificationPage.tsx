import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion'; // Pastikan import sesuai library kamu
import { CheckCircle2, ScanFace, FileSearch } from 'lucide-react';
import { useAppStore, translations } from '../../store/useAppStore';

export default function ReceiptVerificationPage() {
  const navigate = useNavigate();
  const { language, clearSession } = useAppStore();
  const t = translations[language];
  const videoRef = useRef<HTMLVideoElement>(null);

  const [step, setStep] = useState<'scan' | 'verifying' | 'success'>('scan');

  // STATE BARU: Untuk menyimpan angka hitung mundur
  const [countdown, setCountdown] = useState(5);

  // 1. Setup Kamera
  useEffect(() => {
    let stream: MediaStream | null = null;
    const startCamera = async () => {
      try {
        stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
        if (videoRef.current) videoRef.current.srcObject = stream;
      } catch (err) {
        console.error("Camera access denied", err);
      }
    };
    startCamera();
    return () => stream?.getTracks().forEach(track => track.stop());
  }, []);

  // 2. Simulasi Scan & Verifikasi
  useEffect(() => {
    if (step === 'scan') {
      const timerScan = setTimeout(() => setStep('verifying'), 2000);
      return () => clearTimeout(timerScan);
    }

    if (step === 'verifying') {
      const timerVerify = setTimeout(() => {
        setStep('success');
        clearSession(); // Bersihkan keranjang belanja
      }, 3000);
      return () => clearTimeout(timerVerify);
    }
  }, [step, clearSession]);

  // 3. LOGIC BARU: Hitung Mundur Detik (Countdown)
  useEffect(() => {
    if (step === 'success') {
      // Jalankan interval setiap 1 detik
      const interval = setInterval(() => {
        setCountdown((prev) => prev - 1);
      }, 1000);

      // Navigasi ke home saat sudah mencapai 0
      const timerNav = setTimeout(() => {
        navigate('/');
      }, 5000);

      return () => {
        clearInterval(interval);
        clearTimeout(timerNav);
      };
    }
  }, [step, navigate]);

  return (
    <div className="relative w-screen h-screen overflow-hidden bg-slate-900 flex items-center justify-center">
      {/* Background Video */}
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted
        className={`absolute inset-0 w-full h-full object-cover z-0 transition-opacity duration-1000 ${step === 'success' ? 'opacity-10 blur-xl' : 'opacity-60'}`}
      />

      {/* Decorative Ornaments */}
      {step === 'success' && (
        <>
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-pink-600 opacity-20 rounded-full blur-[120px] pointer-events-none z-0" />
          <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-[#0047FF] opacity-20 rounded-full blur-[100px] pointer-events-none z-0" />
        </>
      )}

      {/* Top Bar Status */}
      <div className="absolute top-0 inset-x-0 p-6 z-20">
        <div className="max-w-7xl mx-auto flex justify-center items-center">
          <div className="bg-white/80 dark:bg-slate-900/10 backdrop-blur-md border border-slate-200 dark:border-white/20 rounded-full px-8 py-3">
            <h2 className="text-slate-900 dark:text-white font-black text-xl tracking-widest uppercase">
              {step === 'scan' && (t.RECEIPT_SCAN || 'SCAN STRUK')}
              {step === 'verifying' && (t.VERIFYING || 'VERIFIKASI...')}
              {step === 'success' && (t.TRANS_SUCCESS || 'TRANSAKSI BERHASIL!')}
            </h2>
          </div>
        </div>
      </div>

      <AnimatePresence mode="wait">
        {step === 'scan' && (
          <motion.div
            key="scan-ui"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 1.2, filter: 'blur(10px)' }}
            className="relative z-10 w-80 h-80 border-4 border-dashed border-slate-400 dark:border-white/50 rounded-[3rem] flex flex-col items-center justify-center p-8 bg-white/20 dark:bg-black/20 backdrop-blur-sm"
          >
            <motion.div
              animate={{ y: [-150, 150, -150] }}
              transition={{ duration: 3, repeat: Infinity, ease: 'linear' }}
              className="absolute left-0 right-0 h-1 bg-brand-primary shadow-[0_0_20px_rgba(37,99,235,1)]"
            />
            <ScanFace className="w-16 h-16 text-slate-600 dark:text-white/50 mb-4 animate-pulse" />
            <p className="text-center text-slate-800 dark:text-white/80 font-bold uppercase tracking-widest">Arahkan struk/HP</p>
          </motion.div>
        )}

        {step === 'verifying' && (
          <motion.div
            key="verifying-ui"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            className="relative z-10 flex flex-col items-center justify-center bg-white/80 dark:bg-white/10 backdrop-blur-2xl p-12 rounded-[3rem] border border-slate-200 dark:border-white/20 shadow-2xl"
          >
            <div className="w-24 h-24 relative flex items-center justify-center mb-8">
              <div className="absolute inset-0 border-4 border-brand-primary/20 rounded-full" />
              <div className="absolute inset-0 border-4 border-brand-primary border-t-transparent rounded-full animate-spin" />
              <FileSearch className="w-10 h-10 text-brand-primary" />
            </div>
            <p className="text-brand-primary font-black uppercase tracking-widest text-xl animate-pulse">MEMPROSES...</p>
            <p className="text-slate-600 dark:text-slate-400 mt-2">Menganalisa bukti transaksi OCR...</p>
          </motion.div>
        )}

        {step === 'success' && (
          <motion.div
            key="success-ui"
            initial={{ opacity: 0, scale: 0.5, y: 50 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            className="relative z-10 w-full max-w-lg glass-card rounded-[3rem] border-brand-accent/20 shadow-2xl flex flex-col justify-center items-center text-center p-12"
          >
            <motion.div
              initial={{ scale: 0, rotate: -180 }}
              animate={{ scale: 1, rotate: 0 }}
              className="bg-emerald-500/10 p-6 rounded-full border border-emerald-500/30 mb-8"
            >
              <CheckCircle2 className="w-24 h-24 text-emerald-500" />
            </motion.div>

            <h2 className="text-4xl md:text-5xl font-black uppercase tracking-widest text-slate-900 dark:text-white mb-6">
              BERHASIL!
            </h2>

            <div className="w-full h-px bg-gradient-to-r from-transparent via-slate-300 dark:via-white/20 to-transparent mb-6" />

            <p className="text-slate-600 dark:text-slate-400 font-medium">Terima kasih atas kejujuran Anda!</p>

            <p className="text-brand-primary mt-4 font-bold text-sm bg-brand-primary/10 px-6 py-2 rounded-full border border-brand-primary/20">
              Sistem mengulang otomatis dalam <span className="text-brand-primary font-black text-lg mx-1">{countdown}</span> detik
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}