import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ShoppingCart, ArrowRight, Tag, Lock, Phone, CheckCircle2, XCircle } from 'lucide-react';
import { useAppStore, translations } from '../../store/useAppStore';
import { CartItem } from './CameraScannerPage';

// DATA DUMMY DATABASE VOUCHER
const DUMMY_VOUCHERS: Record<string, { discount: number; status: 'active' | 'expired' }> = {
  'JAGO10': { discount: 0.1, status: 'active' },
  'PROMO5': { discount: 0.05, status: 'active' },
  'DISKONLAMA': { discount: 0.2, status: 'expired' }
};

export default function CartSummaryPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const { language, isMember, setIsMember } = useAppStore(); // Pastikan setIsMember ada di store
  const t = translations[language];

  const items: CartItem[] = location.state?.items || [];

  // Local States
  const [phoneNumber, setPhoneNumber] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);
  const [voucher, setVoucher] = useState('');
  const [voucherError, setVoucherError] = useState('');

  const subtotal = items.reduce((acc, item) => acc + (item.price * item.qty), 0);

  // LOGIKA CEK VOUCHER (Berdasarkan Database Dummy)
  let discount = 0;
  if (isMember && voucher) {
    const vData = DUMMY_VOUCHERS[voucher.toUpperCase()];
    if (vData) {
      if (vData.status === 'active') {
        discount = subtotal * vData.discount;
      }
    }
  }

  const total = subtotal - discount;

  // Simulasi Cek Nomor HP
  const handleVerifyPhone = () => {
    if (phoneNumber.length < 10) return;
    setIsVerifying(true);

    // Simulasi loading API 1.5 detik
    setTimeout(() => {
      setIsVerifying(false);
      setIsMember(true); // Sekarang user dianggap member dan voucher terbuka
    }, 1500);
  };

  const handleContinueAsGuest = () => {
    setIsMember(false);
    setPhoneNumber('');
    setVoucher('');
    // Langsung fokus ke total belanja
  };

  return (
    <div className="min-h-screen bg-[#020617] flex justify-center items-center p-6 text-white relative">
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[80vw] h-[80vh] bg-[#0047FF]/5 blur-[150px] rounded-full pointer-events-none" />

      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-2xl bg-white/5 backdrop-blur-[20px] rounded-3xl border border-white/10 shadow-2xl p-8 z-10"
      >
        {/* Header */}
        <div className="flex items-center gap-4 mb-8 border-b border-white/10 pb-6">
          <div className="w-12 h-12 bg-[#0047FF]/20 rounded-xl flex items-center justify-center border border-[#0047FF]/30">
            <ShoppingCart className="w-6 h-6 text-[#0047FF]" />
          </div>
          <div>
            <h1 className="text-2xl font-black tracking-widest uppercase">{t.CART_TITLE || 'Ringkasan'}</h1>
            <p className="text-slate-400 text-sm">{items.length} produk di keranjang</p>
          </div>
        </div>

        {/* 1. SEKSI MEMBER / NOMOR HP */}
        <div className="mb-8 p-6 bg-white/5 rounded-2xl border border-white/5">
          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-3">
            Status Keanggotaan
          </label>

          {!isMember ? (
            <div className="space-y-4">
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                  <input
                    type="number"
                    placeholder="Masukkan Nomor HP Member"
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                    className="w-full bg-black/20 border border-white/10 rounded-xl py-3 pl-11 pr-4 outline-none focus:border-[#0047FF] transition-all"
                  />
                </div>
                <button
                  onClick={handleVerifyPhone}
                  disabled={isVerifying || phoneNumber.length < 10}
                  className="bg-[#0047FF] px-6 rounded-xl font-bold text-sm hover:bg-blue-600 transition-all disabled:opacity-50"
                >
                  {isVerifying ? 'Mengecek...' : 'Periksa Nomor'}
                </button>
              </div>
              <button
                onClick={handleContinueAsGuest}
                className="text-xs text-slate-500 hover:text-white transition-colors underline"
              >
                Lanjut sebagai Tamu (Voucher Terkunci)
              </button>
            </div>
          ) : (
            <div className="flex items-center justify-between bg-green-500/10 border border-green-500/20 p-4 rounded-xl">
              <div className="flex items-center gap-3">
                <CheckCircle2 className="text-green-500 w-5 h-5" />
                <div>
                  <p className="text-sm font-bold text-green-500">Member Terverifikasi</p>
                  <p className="text-[10px] text-slate-400">Anda berhak menggunakan kode promo</p>
                </div>
              </div>
              <button onClick={() => setIsMember(false)} className="text-[10px] uppercase font-black text-slate-500 hover:text-white">Ganti</button>
            </div>
          )}
        </div>

        {/* 2. SEKSI VOUCHER */}
        <div className="mb-8">
          <label className="text-[10px] font-black text-slate-400 uppercase flex justify-between">
            <span>Kode Promo</span>
            {!isMember && <span className="text-pink-500 flex items-center gap-1"><Lock className="w-3 h-3" /> Masukkan Nomor HP Member Dahulu</span>}
          </label>
          <div className="relative mt-2">
            <Tag className={`absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 ${isMember ? 'text-[#0047FF]' : 'text-slate-600'}`} />
            <input
              type="text"
              value={voucher}
              onChange={(e) => {
                setVoucher(e.target.value);
                setVoucherError('');
              }}
              disabled={!isMember}
              placeholder={isMember ? "Masukkan Kode (JAGO10 / PROMO5)" : "Tersedia untuk Member"}
              className={`w-full bg-white/5 border border-white/10 rounded-2xl py-4 pl-12 pr-4 font-bold outline-none transition-all ${isMember ? 'focus:border-[#0047FF] hover:bg-white/10' : 'opacity-40 cursor-not-allowed italic'
                }`}
            />
          </div>

          {/* Feedback Voucher */}
          <AnimatePresence>
            {voucher && isMember && (
              <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="mt-3 px-2">
                {DUMMY_VOUCHERS[voucher.toUpperCase()] ? (
                  DUMMY_VOUCHERS[voucher.toUpperCase()].status === 'active' ? (
                    <p className="text-green-500 text-xs font-bold flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3" /> Voucher berhasil dipasang: Diskon {DUMMY_VOUCHERS[voucher.toUpperCase()].discount * 100}%
                    </p>
                  ) : (
                    <p className="text-orange-500 text-xs font-bold flex items-center gap-1">
                      <XCircle className="w-3 h-3" /> Voucher "{voucher.toUpperCase()}" sudah kedaluwarsa.
                    </p>
                  )
                ) : (
                  voucher.length > 3 && <p className="text-red-500 text-xs font-bold flex items-center gap-1"><XCircle className="w-3 h-3" /> Kode tidak ditemukan.</p>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* 3. TOTALS */}
        <div className="bg-white/5 rounded-2xl p-6 border border-white/10 mb-8">
          <div className="flex justify-between text-slate-400 mb-2"><span>Subtotal</span><span>Rp {subtotal.toLocaleString('id-ID')}</span></div>
          {discount > 0 && <div className="flex justify-between text-green-500 mb-2 font-bold"><span>Diskon Member</span><span>-Rp {discount.toLocaleString('id-ID')}</span></div>}
          <div className="flex justify-between text-2xl font-black mt-4 pt-4 border-t border-white/10">
            <span>TOTAL</span><span>Rp {total.toLocaleString('id-ID')}</span>
          </div>
        </div>

        <button
          onClick={() => navigate('/payment', { state: { total, isMember } })}
          disabled={items.length === 0 || isVerifying}
          className="w-full bg-[#0047FF] py-5 rounded-2xl font-black text-xl uppercase tracking-widest shadow-lg flex justify-center items-center gap-3 active:scale-95 transition-all disabled:opacity-50"
        >
          BAYAR SEKARANG <ArrowRight />
        </button>
      </motion.div>
    </div>
  );
}