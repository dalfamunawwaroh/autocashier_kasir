import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle2, Loader2, AlertTriangle } from 'lucide-react';
import { useAppStore, translations } from '../../store/useAppStore';

export default function ReceiptVerificationPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const { language, clearSession } = useAppStore();
  const t = translations[language];

  const [step, setStep] = useState<'verifying' | 'success' | 'error'>('verifying');
  const [countdown, setCountdown] = useState(5);
  const [errorMessage, setErrorMessage] = useState('');

  // Proses Checkout Langsung (Kantin Kejujuran - Tanpa Verifikasi Struk)
  useEffect(() => {
    if (step === 'verifying') {
      const processCheckout = async () => {
        try {
          const stateData = location.state || {};
          const branchId = localStorage.getItem('autocashier_branch_id') || null;
          const branchCode = localStorage.getItem('autocashier_branch_code') || 'BDG';
          
          // Data yang akan dikirim ke backend
          const payload = {
            header: {
              invoice_number: `INV-${branchCode}-${Date.now()}`,
              total_price: stateData.total || 0,
              payment_method: 'QRIS',
              cash_received: stateData.total || 0,
              cash_return: 0,
              cashier_name: 'Kantin Kejujuran',
              member_id: stateData.memberId || null,
              promo_id: stateData.promoId || null,
              points_used: stateData.pointsUsed || 0,
              branch_id: branchId
            },
            items: stateData.items || [],
            receiptBase64: null // Kantin Kejujuran - Tanpa Bukti Pembayaran
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

      // Beri sedikit delay visual loading 1.5 detik agar transisi terasa smooth & premium
      const timer = setTimeout(() => {
        processCheckout();
      }, 1500);

      return () => clearTimeout(timer);
    }
  }, [step, location.state, clearSession]);

  // Hitung Mundur Detik (Countdown) saat sukses
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
    <div className="relative w-screen h-screen overflow-hidden bg-slate-900 bg-mesh flex items-center justify-center p-6 text-white">
      {/* Decorative Ornaments */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-brand-primary opacity-20 rounded-full blur-[120px] pointer-events-none z-0" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-brand-accent opacity-20 rounded-full blur-[100px] pointer-events-none z-0" />

      <AnimatePresence mode="wait">
        {step === 'verifying' && (
          <motion.div
            key="verifying-ui"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="relative z-10 flex flex-col items-center justify-center glass-card p-12 rounded-[3rem] border border-white/10 shadow-2xl max-w-md w-full text-center"
          >
            <div className="w-24 h-24 relative flex items-center justify-center mb-8">
              <div className="absolute inset-0 border-4 border-brand-primary/20 rounded-full" />
              <div className="absolute inset-0 border-4 border-brand-primary border-t-transparent rounded-full animate-spin" />
              <Loader2 className="w-10 h-10 text-brand-primary animate-pulse" />
            </div>
            <p className="text-brand-primary font-black uppercase tracking-widest text-xl animate-pulse">MEMPROSES...</p>
            <p className="text-slate-400 mt-2">Menyimpan transaksi Kantin Kejujuran...</p>
          </motion.div>
        )}

        {step === 'success' && (
          <motion.div
            key="success-ui"
            initial={{ opacity: 0, scale: 0.8, y: 50 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            className="relative z-10 w-full max-w-lg glass-card rounded-[3rem] border-emerald-500/20 shadow-2xl flex flex-col justify-center items-center text-center p-12"
          >
            <motion.div
              initial={{ scale: 0, rotate: -180 }}
              animate={{ scale: 1, rotate: 0 }}
              className="bg-emerald-500/10 p-6 rounded-full border border-emerald-500/30 mb-8"
            >
              <CheckCircle2 className="w-24 h-24 text-emerald-500" />
            </motion.div>

            <h2 className="text-4xl md:text-5xl font-black uppercase tracking-widest text-white mb-6">
              BERHASIL!
            </h2>

            <div className="w-full h-px bg-gradient-to-r from-transparent via-white/20 to-transparent mb-6" />

            <p className="text-slate-300 font-bold text-lg mb-2">Terima kasih atas kejujuran Anda!</p>
            <p className="text-slate-400 text-sm">Pembayaran QRIS berhasil dicatat oleh sistem.</p>

            <p className="text-brand-primary mt-8 font-bold text-sm bg-brand-primary/10 px-6 py-2 rounded-full border border-brand-primary/20">
              Kembali ke scanner dalam <span className="text-brand-primary font-black text-lg mx-1">{countdown}</span> detik
            </p>
          </motion.div>
        )}

        {step === 'error' && (
          <motion.div
            key="error-ui"
            initial={{ opacity: 0, scale: 0.8, y: 50 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            className="relative z-10 w-full max-w-lg glass-card rounded-[3rem] border-pink-500/20 shadow-2xl flex flex-col justify-center items-center text-center p-12"
          >
            <div className="bg-pink-500/10 p-6 rounded-full border border-pink-500/30 mb-8">
              <AlertTriangle className="w-20 h-20 text-pink-500" />
            </div>
            <h2 className="text-3xl md:text-4xl font-black uppercase tracking-widest text-white mb-4">
              GAGAL
            </h2>
            <p className="text-slate-400 font-medium">{errorMessage}</p>
            <button 
              onClick={() => navigate('/scan')}
              className="mt-8 bg-brand-primary hover:bg-blue-600 text-white font-bold py-4 px-10 rounded-full shadow-[0_0_20px_rgba(37,99,235,0.3)] transition-all"
            >
              Kembali ke Awal
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}