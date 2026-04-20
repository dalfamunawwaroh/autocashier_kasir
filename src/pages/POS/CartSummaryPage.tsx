import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ShoppingCart, ArrowRight, Tag, Lock, Phone, CheckCircle2, XCircle, Coins } from 'lucide-react';
import { useAppStore, translations } from '../../store/useAppStore';
import { CartItem } from './CameraScannerPage';

const DUMMY_VOUCHERS: Record<string, { discount: number; status: 'active' | 'expired' }> = {
  'JAGO10': { discount: 0.1, status: 'active' },
  'PROMO5': { discount: 0.05, status: 'active' },
  'DISKONLAMA': { discount: 0.2, status: 'expired' }
};

// Asumsi 1 Poin = Rp 1
const DUMMY_MEMBER_POINTS = 5000;

export default function CartSummaryPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const { language, isMember, setIsMember } = useAppStore();
  const t = translations[language];

  const items: CartItem[] = location.state?.items || [];

  const [phoneNumber, setPhoneNumber] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);
  const [voucher, setVoucher] = useState('');
  const [usePoints, setUsePoints] = useState(false); // State untuk tukar poin

  const subtotal = items.reduce((acc, item) => acc + (item.price * item.qty), 0);

  // 1. Hitung Diskon Voucher
  let voucherDiscount = 0;
  if (isMember && voucher) {
    const vData = DUMMY_VOUCHERS[voucher.toUpperCase()];
    if (vData && vData.status === 'active') {
      voucherDiscount = subtotal * vData.discount;
    }
  }

  // 2. Hitung Potongan Poin
  // Poin yang digunakan tidak boleh melebihi (subtotal - voucherDiscount)
  const pointDeduction = (isMember && usePoints)
    ? Math.min(DUMMY_MEMBER_POINTS, subtotal - voucherDiscount)
    : 0;

  const total = subtotal - voucherDiscount - pointDeduction;

  const handleVerifyPhone = () => {
    if (phoneNumber.length < 10) return;
    setIsVerifying(true);
    setTimeout(() => {
      setIsVerifying(false);
      setIsMember(true);
    }, 1500);
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

        {/* 1. SEKSI MEMBER */}
        <div className="mb-6 p-6 bg-white/5 rounded-2xl border border-white/5">
          {!isMember ? (
            <div className="space-y-4">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">Identitas Member</label>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                  <input
                    type="number"
                    placeholder="Nomor HP Member"
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                    className="w-full bg-black/20 border border-white/10 rounded-xl py-3 pl-11 pr-4 outline-none focus:border-[#0047FF]"
                  />
                </div>
                <button onClick={handleVerifyPhone} disabled={isVerifying || phoneNumber.length < 10} className="bg-[#0047FF] px-6 rounded-xl font-bold text-sm disabled:opacity-50">
                  {isVerifying ? '...' : 'Cek'}
                </button>
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="bg-green-500/20 p-2 rounded-lg">
                  <CheckCircle2 className="text-green-500 w-5 h-5" />
                </div>
                <div>
                  <p className="text-sm font-bold text-white">Halo, Member JagoAI!</p>
                  <p className="text-xs text-slate-400">Nomor terverifikasi</p>
                </div>
              </div>
              <button onClick={() => { setIsMember(false); setUsePoints(false); }} className="text-[10px] font-black text-slate-500 hover:text-white uppercase">Ganti</button>
            </div>
          )}
        </div>

        {/* 2. SEKSI TUKAR POIN (Hanya muncul jika Member) */}
        <AnimatePresence>
          {isMember && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              className="mb-6 p-4 bg-gradient-to-r from-yellow-500/10 to-transparent border border-yellow-500/20 rounded-2xl flex items-center justify-between"
            >
              <div className="flex items-center gap-3">
                <Coins className="text-yellow-500 w-6 h-6" />
                <div>
                  <p className="text-sm font-bold text-yellow-500">Poin JagoAI</p>
                  <p className="text-[10px] text-slate-300">Tersedia: {DUMMY_MEMBER_POINTS.toLocaleString('id-ID')} Poin</p>
                </div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={usePoints}
                  onChange={(e) => setUsePoints(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-white/10 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-yellow-500"></div>
                <span className="ml-3 text-xs font-bold text-slate-300">{usePoints ? 'Digunakan' : 'Gunakan?'}</span>
              </label>
            </motion.div>
          )}
        </AnimatePresence>

        {/* 3. SEKSI VOUCHER */}
        <div className="mb-8">
          <label className="text-[10px] font-black text-slate-400 uppercase flex justify-between mb-2">
            <span>Kode Promo</span>
            {!isMember && <span className="text-pink-500 flex items-center gap-1"><Lock className="w-3 h-3" /> Login Member</span>}
          </label>
          <div className="relative">
            <Tag className={`absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 ${isMember ? 'text-[#0047FF]' : 'text-slate-600'}`} />
            <input
              type="text"
              value={voucher}
              onChange={(e) => setVoucher(e.target.value)}
              disabled={!isMember}
              placeholder={isMember ? "Masukkan Kode (JAGO10)" : "Tersedia untuk Member"}
              className={`w-full bg-white/5 border border-white/10 rounded-2xl py-4 pl-12 pr-4 font-bold outline-none transition-all ${isMember ? 'focus:border-[#0047FF]' : 'opacity-40 italic'}`}
            />
          </div>
        </div>

        {/* 4. TOTALS */}
        <div className="bg-white/5 rounded-2xl p-6 border border-white/10 mb-8 space-y-3">
          <div className="flex justify-between text-slate-400 text-sm">
            <span>Subtotal</span>
            <span>Rp {subtotal.toLocaleString('id-ID')}</span>
          </div>

          {voucherDiscount > 0 && (
            <div className="flex justify-between text-pink-500 text-sm font-bold">
              <span>Voucher Promo</span>
              <span>-Rp {voucherDiscount.toLocaleString('id-ID')}</span>
            </div>
          )}

          {pointDeduction > 0 && (
            <div className="flex justify-between text-yellow-500 text-sm font-bold">
              <span>Tukar Poin</span>
              <span>-Rp {pointDeduction.toLocaleString('id-ID')}</span>
            </div>
          )}

          <div className="flex justify-between text-2xl font-black mt-4 pt-4 border-t border-white/10 tracking-tighter">
            <span>TOTAL</span>
            <span className="text-[#0047FF]">Rp {total.toLocaleString('id-ID')}</span>
          </div>
        </div>

        <button
          onClick={() => navigate('/payment', { state: { total, isMember, pointsUsed: pointDeduction } })}
          disabled={items.length === 0 || isVerifying}
          className="w-full bg-[#0047FF] py-5 rounded-2xl font-black text-xl uppercase tracking-widest shadow-lg flex justify-center items-center gap-3 active:scale-95 transition-all disabled:opacity-50"
        >
          BAYAR SEKARANG <ArrowRight />
        </button>
      </motion.div>
    </div>
  );
}