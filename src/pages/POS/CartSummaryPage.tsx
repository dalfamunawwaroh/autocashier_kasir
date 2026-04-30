import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ShoppingCart, ArrowRight, Tag, Lock, Phone, CheckCircle2, Coins, Ticket, Trash2 } from 'lucide-react';
import { useAppStore, translations } from '../../store/useAppStore';
import { CartItem } from './CameraScannerPage';

const DUMMY_VOUCHERS: Record<string, { discount: number; status: 'active' | 'expired' }> = {
  'JAGO10': { discount: 0.1, status: 'active' },
  'PROMO5': { discount: 0.05, status: 'active' },
  'DISKONLAMA': { discount: 0.2, status: 'expired' }
};

const DUMMY_MEMBER_POINTS = 5000;

export default function CartSummaryPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const { language, isMember, setIsMember } = useAppStore();
  const t = translations[language];

  const items: CartItem[] = location.state?.items || [];
  const totalQty = items.reduce((acc, item) => acc + item.qty, 0);

  const [phoneNumber, setPhoneNumber] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);
  const [voucherInput, setVoucherInput] = useState('');
  const [activeVoucher, setActiveVoucher] = useState<{ code: string, discount: number } | null>(null);
  const [voucherError, setVoucherError] = useState<string | null>(null);
  const [usePoints, setUsePoints] = useState(false);

  const subtotal = items.reduce((acc, item) => acc + (item.price * item.qty), 0);

  // Logic Terapkan Voucher
  const handleApplyVoucher = () => {
    setVoucherError(null);
    const code = voucherInput.toUpperCase();
    const vData = DUMMY_VOUCHERS[code];

    if (!vData) {
      setVoucherError("Kode voucher tidak valid");
      setActiveVoucher(null);
    } else if (vData.status === 'expired') {
      setVoucherError("Voucher sudah kedaluwarsa");
      setActiveVoucher(null);
    } else {
      setActiveVoucher({ code, discount: subtotal * vData.discount });
      setVoucherError(null);
    }
  };

  // Logic Hapus Voucher
  const handleRemoveVoucher = () => {
    setActiveVoucher(null);
    setVoucherInput('');
    setVoucherError(null);
  };

  const voucherDiscount = activeVoucher ? activeVoucher.discount : 0;
  const pointDeduction = (isMember && usePoints) ? Math.min(DUMMY_MEMBER_POINTS, subtotal - voucherDiscount) : 0;

  const total = subtotal - voucherDiscount - pointDeduction;
  const earnedPoints = Math.floor(total * 0.01);

  const handleVerifyPhone = () => {
    if (phoneNumber.length < 10) return;
    setIsVerifying(true);
    setTimeout(() => {
      setIsVerifying(false);
      setIsMember(true);
    }, 1500);
  };

  return (
    <div className="min-h-screen bg-[#020617] flex justify-center items-start md:items-center p-4 md:p-10 text-white relative overflow-x-hidden">
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full bg-[#0047FF]/5 blur-[120px] pointer-events-none" />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-4xl grid grid-cols-1 lg:grid-cols-5 gap-6 z-10"
      >
        {/* --- LEFT: PRODUCT DETAIL --- */}
        <div className="lg:col-span-3 space-y-6">
          <div className="bg-white/5 backdrop-blur-xl rounded-[2.5rem] border border-white/10 p-8 flex flex-col h-[500px] md:h-[650px]">
            <div className="flex justify-between items-end mb-6">
              <h2 className="text-3xl font-black italic tracking-tighter uppercase leading-none text-transparent bg-clip-text bg-gradient-to-r from-white to-slate-500">Detail Belanja</h2>
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest bg-white/5 px-3 py-1 rounded-full border border-white/5">{totalQty} ITEMS</span>
            </div>

            <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar space-y-4 text-left">
              {items.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center opacity-20 italic">
                  <ShoppingCart className="w-16 h-16 mb-4" />
                  <p>Keranjang Kosong</p>
                </div>
              ) : (
                items.map((item, idx) => (
                  <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: idx * 0.1 }}
                    key={idx}
                    className="flex items-center gap-4 bg-white/5 p-5 rounded-[2rem] border border-white/5 group hover:bg-white/10 transition-all"
                  >
                    <div className="w-14 h-14 bg-gradient-to-br from-[#0047FF]/20 to-pink-500/10 rounded-2xl flex items-center justify-center border border-white/10 shadow-inner">
                      <span className="text-2xl">📦</span>
                    </div>
                    <div className="flex-1">
                      <h4 className="font-black text-sm tracking-tight leading-tight uppercase group-hover:text-[#0047FF] transition-colors">{item.name}</h4>
                      <p className="text-[10px] text-slate-500 font-bold tracking-widest mt-1 italic leading-none">ID: {item.id}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-[#0047FF] font-black text-sm leading-none mb-1">x{item.qty}</p>
                      <p className="text-xs font-bold text-white/40 italic leading-none">Rp{(item.price * item.qty).toLocaleString('id-ID')}</p>
                    </div>
                  </motion.div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* --- RIGHT: SUMMARY & PAYMENT --- */}
        <div className="lg:col-span-2 space-y-6">

          {/* MEMBER SECTION */}
          <div className="bg-white/5 backdrop-blur-xl rounded-[2.5rem] border border-white/10 p-6 text-left">
            {!isMember ? (
              <div className="space-y-4">
                <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest px-1">Identity Check</p>
                <div className="flex gap-2">
                  <div className="relative flex-1 group">
                    <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 group-focus-within:text-[#0047FF] transition-colors" />
                    <input
                      type="number"
                      placeholder="Nomor HP Member"
                      value={phoneNumber}
                      onChange={(e) => setPhoneNumber(e.target.value)}
                      className="w-full bg-black/40 border border-white/10 rounded-2xl py-4 pl-11 pr-4 outline-none focus:border-[#0047FF] transition-all font-bold text-sm"
                    />
                  </div>
                  <button onClick={handleVerifyPhone} disabled={isVerifying || phoneNumber.length < 10} className="bg-[#0047FF] px-6 rounded-2xl font-black uppercase text-xs shadow-lg active:scale-95 disabled:opacity-30 transition-all">
                    {isVerifying ? '...' : 'Cek'}
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="bg-green-500/20 p-2 rounded-xl border border-green-500/30">
                      <CheckCircle2 className="text-green-500 w-5 h-5" />
                    </div>
                    <span className="font-black text-[10px] uppercase tracking-tighter italic">Member JagoAI Active</span>
                  </div>
                  <button onClick={() => { setIsMember(false); setUsePoints(false); handleRemoveVoucher(); }} className="text-[9px] font-black text-slate-500 hover:text-pink-500 uppercase italic transition-colors">Ganti</button>
                </div>

                <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-2xl p-4 flex items-center justify-between">
                  <div className="flex items-center gap-3 text-left">
                    <Coins className="text-yellow-500 w-6 h-6" />
                    <div>
                      <p className="text-[10px] font-black uppercase tracking-widest text-yellow-500/60 leading-none mb-1">Point Balance</p>
                      <p className="text-sm font-black italic tracking-tighter leading-none">{DUMMY_MEMBER_POINTS.toLocaleString('id-ID')} PTS</p>
                    </div>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input type="checkbox" checked={usePoints} onChange={(e) => setUsePoints(e.target.checked)} className="sr-only peer" />
                    <div className="w-10 h-5 bg-white/10 rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-yellow-500 shadow-inner"></div>
                  </label>
                </div>
              </div>
            )}
          </div>

          {/* VOUCHER SECTION (Updated with Remove Feature) */}
          <div className="bg-white/5 backdrop-blur-xl rounded-[2.5rem] border border-white/10 p-6 space-y-4 text-left relative overflow-hidden">
            <label className="text-[10px] font-black text-slate-500 uppercase flex justify-between px-1 tracking-widest">
              <span>Promo Code</span>
              {!isMember && <span className="text-pink-500 flex items-center gap-1"><Lock className="w-3 h-3" /> Member Only</span>}
            </label>

            <div className="flex gap-2">
              <div className="relative flex-1 group">
                <Ticket className={`absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 ${isMember ? 'text-[#0047FF]' : 'text-slate-700'}`} />
                <input
                  type="text"
                  value={voucherInput}
                  onChange={(e) => setVoucherInput(e.target.value)}
                  disabled={!isMember || !!activeVoucher}
                  placeholder="EX: JAGO10"
                  className={`w-full bg-black/40 border border-white/10 rounded-2xl py-4 pl-11 pr-4 font-black uppercase outline-none transition-all text-sm ${isMember ? 'focus:border-[#0047FF]' : 'opacity-20 italic'} ${activeVoucher ? 'text-green-500 border-green-500/50' : 'text-white'}`}
                />
              </div>

              {!activeVoucher ? (
                <button
                  onClick={handleApplyVoucher}
                  disabled={!isMember || !voucherInput}
                  className="bg-white/5 border border-white/10 px-5 rounded-2xl text-[10px] font-black uppercase hover:bg-[#0047FF] transition-all disabled:opacity-20"
                >
                  Apply
                </button>
              ) : (
                <button
                  onClick={handleRemoveVoucher}
                  className="bg-pink-500/10 border border-pink-500/20 px-5 rounded-2xl text-pink-500 hover:bg-pink-500 hover:text-white transition-all group"
                  title="Batalkan Voucher"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
            </div>

            <AnimatePresence mode='wait'>
              {voucherError && (
                <motion.p initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="text-pink-500 text-[10px] font-black uppercase italic px-1">
                  {voucherError}
                </motion.p>
              )}
              {activeVoucher && (
                <motion.p initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="text-green-500 text-[10px] font-black uppercase italic px-1 flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3" /> Voucher Applied!
                </motion.p>
              )}
            </AnimatePresence>
          </div>

          {/* FINAL TOTAL BOX */}
          <div className="bg-[#0047FF] rounded-[2.5rem] p-8 shadow-[0_20px_50px_rgba(0,71,255,0.4)] relative overflow-hidden group text-left">
            <div className="absolute top-[-20px] right-[-20px] w-32 h-32 bg-white/10 rounded-full blur-3xl" />

            <div className="space-y-3 relative z-10">
              <div className="flex justify-between text-white/60 text-[10px] font-black uppercase tracking-widest">
                <span>Subtotal</span>
                <span>Rp{subtotal.toLocaleString('id-ID')}</span>
              </div>

              {voucherDiscount > 0 && (
                <motion.div initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} className="flex justify-between text-yellow-400 text-[10px] font-black uppercase tracking-widest italic">
                  <span>Voucher Diskon ({activeVoucher?.code})</span>
                  <span>-Rp{voucherDiscount.toLocaleString('id-ID')}</span>
                </motion.div>
              )}

              {pointDeduction > 0 && (
                <motion.div initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} className="flex justify-between text-white text-[10px] font-black uppercase tracking-widest underline decoration-dashed underline-offset-4">
                  <span>Poin Digunakan</span>
                  <span>-Rp{pointDeduction.toLocaleString('id-ID')}</span>
                </motion.div>
              )}

              <div className="pt-4 border-t border-white/20 flex justify-between items-end">
                <div>
                  <p className="text-[10px] font-black text-white/50 uppercase tracking-[0.2em] mb-1 leading-none">Total Payment</p>
                  <p className="text-4xl font-black italic tracking-tighter leading-none uppercase">Rp{total.toLocaleString('id-ID')}</p>
                </div>
                <div className="text-right">
                  <p className="text-[9px] font-black text-yellow-300 uppercase tracking-tighter leading-none mb-1">+ New Points</p>
                  <p className="text-xl font-black italic tracking-tighter leading-none text-white">{earnedPoints}</p>
                </div>
              </div>
            </div>
          </div>

          {/* ACTION BUTTON */}
          <button
            onClick={() => navigate('/payment', { state: { total, isMember, pointsUsed: pointDeduction, earnedPoints } })}
            disabled={items.length === 0 || isVerifying}
            className="w-full bg-white text-[#020617] py-6 rounded-[2.5rem] font-black text-xl uppercase tracking-[0.2em] shadow-2xl flex justify-center items-center gap-4 hover:bg-[#0047FF] hover:text-white transition-all transform active:scale-95 group"
          >
            CHECKOUT <ArrowRight className="group-hover:translate-x-2 transition-transform" />
          </button>
        </div>
      </motion.div>

      <style>{`
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(255, 255, 255, 0.1); border-radius: 20px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: rgba(0, 71, 255, 0.5); }
      `}</style>
    </div>
  );
}