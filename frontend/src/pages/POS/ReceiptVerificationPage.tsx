import React, { useEffect, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle2, ScanFace, FileSearch } from 'lucide-react';
import { useAppStore, translations } from '../../store/useAppStore';

export default function ReceiptVerificationPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const { language, clearSession } = useAppStore();
  const t = translations[language];
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const boxRef = useRef<HTMLDivElement>(null);

  const [step, setStep] = useState<'scan' | 'verifying' | 'success' | 'error'>('scan');
  const [countdown, setCountdown] = useState(5);
  const [errorMessage, setErrorMessage] = useState('');

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

  // 2. Fungsi Capture Struk (Hanya area kotak)
  const captureReceipt = (): string | null => {
    if (videoRef.current && canvasRef.current && boxRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      const boxRect = boxRef.current.getBoundingClientRect();
      
      const vw = video.videoWidth;
      const vh = video.videoHeight;
      const sw = window.innerWidth;
      const sh = window.innerHeight;
      
      if (vw === 0 || vh === 0) return null;

      // Hitung skala object-cover
      const scale = Math.max(sw / vw, sh / vh);
      
      const drawWidth = vw * scale;
      const drawHeight = vh * scale;
      
      const offsetX = (sw - drawWidth) / 2;
      const offsetY = (sh - drawHeight) / 2;

      // Ambil posisi kotak scan secara akurat dari DOM
      const boxSize = boxRect.width; // 320px
      const boxX = boxRect.left;
      const boxY = boxRect.top;

      // Posisi kotak relatif terhadap video yang dirender
      const videoBoxX = boxX - offsetX;
      const videoBoxY = boxY - offsetY;

      // Posisi sumber crop pada resolusi asli video
      const sourceX = videoBoxX / scale;
      const sourceY = videoBoxY / scale;
      const sourceSize = boxSize / scale;

      canvas.width = boxSize;
      canvas.height = boxSize;
      
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(video, sourceX, sourceY, sourceSize, sourceSize, 0, 0, boxSize, boxSize);
        return canvas.toDataURL('image/jpeg', 0.8);
      }
    }
    return null;
  };

  // 4. Proses Verifikasi
  useEffect(() => {
    if (step === 'verifying') {
      const processCheckout = async () => {
        try {
          const receiptBase64 = captureReceipt();
          const stateData = location.state || {};
          
          // Data yang akan dikirim ke backend
          const payload = {
            header: {
              invoice_number: `INV-BDG-${Date.now()}`,
              total_price: stateData.total || 0,
              payment_method: 'QRIS',
              cash_received: stateData.total || 0,
              cash_return: 0,
              cashier_name: 'AutoCashier',
              member_id: stateData.memberId || null,
              promo_id: stateData.promoId || null,
              points_used: stateData.pointsUsed || 0,
              branch: 'Cabang Bandung'
            },
            items: stateData.items || [],
            receiptBase64: receiptBase64
          };

          const res = await fetch('/api/checkout', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
          });

          const data = await res.json();
          if (data.success) {
            setStep('success');
            clearSession();
          } else {
            setErrorMessage(data.message || 'Gagal memproses pembayaran');
            setStep('error');
          }
        } catch (error) {
          console.error("Checkout error:", error);
          setErrorMessage('Terjadi kesalahan koneksi');
          setStep('error');
        }
      };

      processCheckout();
    }
  }, [step, location.state, clearSession]);

  // 4. Hitung Mundur Detik (Countdown) saat sukses
  useEffect(() => {
    if (step === 'success') {
      const interval = setInterval(() => {
        setCountdown((prev) => prev - 1);
      }, 1000);

      const timerNav = setTimeout(() => {
        navigate('/scan');
      }, 5000);

      return () => {
        clearInterval(interval);
        clearTimeout(timerNav);
      };
    }
  }, [step, navigate]);

  return (
    <div className="relative w-screen h-screen overflow-hidden bg-slate-900 flex items-center justify-center">
      {/* Hidden Canvas for Image Capture */}
      <canvas ref={canvasRef} className="hidden" />

      {/* Background Video */}
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted
        className={`absolute inset-0 w-full h-full object-cover z-0 transition-opacity duration-1000 ${(step === 'success' || step === 'error') ? 'opacity-10 blur-xl' : 'opacity-60'}`}
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
              {step === 'error' && 'GAGAL VERIFIKASI'}
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
            className="relative z-10 flex flex-col items-center gap-8"
          >
            <div ref={boxRef} className="relative w-80 h-80 border-4 border-dashed border-slate-400 dark:border-white/80 rounded-[3rem] flex flex-col items-center justify-center p-8 bg-transparent">
              <motion.div
                animate={{ y: [-150, 150, -150] }}
                transition={{ duration: 3, repeat: Infinity, ease: 'linear' }}
                className="absolute left-0 right-0 h-1 bg-brand-primary shadow-[0_0_20px_rgba(37,99,235,1)]"
              />
              <ScanFace className="w-16 h-16 text-slate-600 dark:text-white/50 mb-4 animate-pulse" />
              <p className="text-center text-slate-800 dark:text-white/80 font-bold uppercase tracking-widest">Arahkan struk/HP</p>
            </div>
            
            <button
              onClick={() => setStep('verifying')}
              className="bg-brand-primary hover:bg-blue-600 text-white font-black text-xl px-12 py-5 rounded-full shadow-[0_0_30px_rgba(37,99,235,0.5)] transform hover:scale-105 transition-all duration-300 uppercase tracking-widest"
            >
              PROSES VERIFIKASI
            </button>
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
            <p className="text-slate-600 dark:text-slate-400 mt-2">Menyimpan bukti transaksi...</p>
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

            <p className="text-slate-600 dark:text-slate-400 font-medium">Transaksi dan bukti pembayaran telah disimpan.</p>

            <p className="text-brand-primary mt-4 font-bold text-sm bg-brand-primary/10 px-6 py-2 rounded-full border border-brand-primary/20">
              Sistem mengulang otomatis dalam <span className="text-brand-primary font-black text-lg mx-1">{countdown}</span> detik
            </p>
          </motion.div>
        )}

        {step === 'error' && (
          <motion.div
            key="error-ui"
            initial={{ opacity: 0, scale: 0.5, y: 50 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            className="relative z-10 w-full max-w-lg glass-card rounded-[3rem] border-pink-500/20 shadow-2xl flex flex-col justify-center items-center text-center p-12"
          >
            <div className="bg-pink-500/10 p-6 rounded-full border border-pink-500/30 mb-8">
              <span className="text-4xl">❌</span>
            </div>
            <h2 className="text-3xl md:text-4xl font-black uppercase tracking-widest text-slate-900 dark:text-white mb-4">
              GAGAL
            </h2>
            <p className="text-slate-600 dark:text-slate-400 font-medium">{errorMessage}</p>
            <button 
              onClick={() => navigate('/scan')}
              className="mt-8 bg-brand-primary text-white font-bold py-3 px-8 rounded-full"
            >
              Kembali ke Awal
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}