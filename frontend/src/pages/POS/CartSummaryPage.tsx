import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ShoppingCart, ArrowRight, Lock, CheckCircle2, Coins, Ticket, Trash2, 
  Tag, Loader2, User, Sparkles, Star, Minus, Plus 
} from 'lucide-react';
import { useAppStore, translations } from '../../store/useAppStore';
import { CartItem } from './CameraScannerPage';

interface MemberPromo {
  id: string;
  code: string;
  discount_type: 'percent' | 'fixed';
  discount_value: number;
  min_purchase: number;
  expires_at: string | null;
}

export default function CartSummaryPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const { language, isMember, member } = useAppStore();
  const t = translations[language];

  const [items, setItems] = useState<CartItem[]>(location.state?.items || []);
  const totalQty = items.reduce((acc, item) => acc + item.qty, 0);
  const subtotal = items.reduce((acc, item) => acc + (item.price * item.qty), 0);

  // Helper functions to edit cart items manually
  const handleIncreaseQty = (index: number) => {
    setItems(prev => {
      const next = [...prev];
      next[index] = { ...next[index], qty: next[index].qty + 1 };
      return next;
    });
  };

  const handleDecreaseQty = (index: number) => {
    setItems(prev => {
      const next = [...prev];
      if (next[index].qty > 1) {
        next[index] = { ...next[index], qty: next[index].qty - 1 };
        return next;
      } else {
        return prev.filter((_, i) => i !== index);
      }
    });
  };

  const handleRemoveItem = (index: number) => {
    setItems(prev => prev.filter((_, i) => i !== index));
  };

  // Member data state
  const [memberPromos, setMemberPromos] = useState<MemberPromo[]>([]);
  const [pointBalance, setPointBalance] = useState(0);
  const [isLoadingPromos, setIsLoadingPromos] = useState(false);
  const [isLoadingPoints, setIsLoadingPoints] = useState(false);

  // Voucher & points state
  const [activePromo, setActivePromo] = useState<MemberPromo | null>(null);
  const [usePoints, setUsePoints] = useState(false);
  const [voucherError, setVoucherError] = useState<string | null>(null);

  const memberId = member?.id;

  // Fetch member promos & points when member is logged in
  useEffect(() => {
    if (!isMember || !memberId) return;

    const fetchMemberData = async () => {
      setIsLoadingPromos(true);
      setIsLoadingPoints(true);

      try {
        const [promosRes, pointsRes] = await Promise.all([
          fetch(`/api/members/promos?user_id=${memberId}`),
          fetch(`/api/members/points?user_id=${memberId}`)
        ]);
        const promosData = await promosRes.json();
        const pointsData = await pointsRes.json();

        if (promosData.success) setMemberPromos(promosData.promos);
        if (pointsData.success) setPointBalance(pointsData.balance);
      } catch (err) {
        console.error('Failed to fetch member data:', err);
      } finally {
        setIsLoadingPromos(false);
        setIsLoadingPoints(false);
      }
    };

    fetchMemberData();
  }, [isMember, memberId]);

  // Calculate discount from promo
  const promoDiscount = activePromo
    ? activePromo.discount_type === 'percent'
      ? Math.floor(subtotal * (activePromo.discount_value / 100))
      : activePromo.discount_value
    : 0;

  // Points deduction: 1 point = Rp 1
  const maxPointsUsable = Math.max(0, subtotal - promoDiscount);
  const pointDeduction = (isMember && usePoints) ? Math.min(pointBalance, maxPointsUsable) : 0;

  const total = Math.max(0, subtotal - promoDiscount - pointDeduction);
  const earnedPoints = Math.floor(total * 0.01);

  const handleApplyPromo = (promo: MemberPromo) => {
    setVoucherError(null);
    if (promo.min_purchase > 0 && subtotal < promo.min_purchase) {
      setVoucherError(`Min. belanja Rp${promo.min_purchase.toLocaleString('id-ID')} untuk promo ini`);
      return;
    }
    if (activePromo?.id === promo.id) {
      setActivePromo(null); // toggle off
    } else {
      setActivePromo(promo);
    }
  };

  const handleCheckout = () => {
    navigate('/payment', {
      state: {
        total,
        isMember,
        memberId: memberId || null,
        promoId: activePromo?.id || null,
        promoCode: activePromo?.code || null,
        promoDiscount,
        pointsUsed: pointDeduction,
        earnedPoints,
        items,
      }
    });
  };

  return (
    <div className="min-h-screen bg-surface-light dark:bg-surface-dark bg-mesh flex justify-center items-start md:items-center p-4 md:p-10 text-slate-900 dark:text-white relative overflow-x-hidden">
      {/* Dynamic and glowing ambient background */}
      <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-[#0047FF]/10 rounded-full blur-[150px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-pink-500/5 rounded-full blur-[150px] pointer-events-none" />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-4xl grid grid-cols-1 lg:grid-cols-5 gap-6 z-10"
      >
        {/* --- LEFT: PRODUCT DETAIL --- */}
        <div className="lg:col-span-3 space-y-6">
          <div className="glass-card rounded-[2.5rem] p-8 flex flex-col h-[500px] md:h-[650px] shadow-2xl">
            {/* Attractive stats bar header */}
            <div className="flex justify-between items-center mb-8 bg-slate-50/50 dark:bg-black/25 border border-slate-200 dark:border-white/5 rounded-3xl p-5 shadow-sm">
              <div className="text-left">
                <h2 className="text-3xl font-black italic tracking-tighter uppercase leading-none text-slate-900 dark:text-white">Detail Belanja</h2>
                <p className="text-[10px] text-slate-500 dark:text-slate-400 font-bold uppercase tracking-widest mt-1">Konfirmasi & Edit Item Belanja</p>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-[10px] font-black text-slate-600 dark:text-slate-400 uppercase tracking-widest bg-slate-100 dark:bg-white/10 px-4 py-2 rounded-2xl border border-slate-200 dark:border-white/10 shadow-sm">{totalQty} ITEMS</span>
                <span className="text-[10px] font-black text-emerald-500 uppercase tracking-widest bg-emerald-500/10 px-4 py-2 rounded-2xl border border-emerald-500/20 shadow-sm">Ready</span>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar space-y-4 text-left">
              {items.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center opacity-45 text-center py-10 space-y-6">
                  <div className="w-20 h-20 bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-full flex items-center justify-center text-4xl shadow-inner animate-bounce">🛒</div>
                  <div>
                    <p className="text-lg font-black uppercase tracking-wider text-slate-900 dark:text-white">Keranjang Kosong</p>
                    <p className="text-xs text-slate-500 mt-2 font-bold max-w-xs mx-auto">Semua item telah dihapus. Silakan kembali ke scanner untuk memindai belanjaan baru.</p>
                  </div>
                  <button 
                    onClick={() => navigate('/scan')}
                    className="px-8 py-3.5 bg-[#0047FF] hover:bg-[#0047FF]/80 text-white rounded-2xl font-black uppercase text-xs tracking-widest transition-all active:scale-95 shadow-lg cursor-pointer"
                  >
                    Kembali Ke Scanner
                  </button>
                </div>
              ) : (
                items.map((item, idx) => (
                  <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: idx * 0.1 }}
                    key={idx}
                    className="bg-slate-50/40 dark:bg-white/5 p-6 rounded-[2.5rem] border border-slate-200 dark:border-white/10 group hover:border-[#0047FF]/40 hover:bg-white/10 transition-all shadow-sm space-y-4"
                  >
                    {/* Top Row: Product Icon, Name, and Subtotal */}
                    <div className="flex items-center justify-between gap-4 w-full">
                      <div className="flex items-center gap-3.5 min-w-0 flex-1">
                        <div className="w-12 h-12 bg-gradient-to-br from-[#0047FF]/10 to-[#0047FF]/20 rounded-2xl flex items-center justify-center border border-[#0047FF]/20 shadow-inner flex-shrink-0 group-hover:scale-105 transition-transform duration-300">
                          <span className="text-xl">🛍️</span>
                        </div>
                        <div className="min-w-0 flex-1 text-left">
                          <h4 className="font-black text-base tracking-tight leading-tight uppercase group-hover:text-[#0047FF] transition-colors text-slate-900 dark:text-white break-words">
                            {item.name}
                          </h4>
                          <div className="flex items-center gap-2 mt-1">
                            <span className="bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 text-[9px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest px-2.5 py-0.5 rounded-md">
                              AI Verified
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Subtotal on the Right */}
                      <div className="text-right flex-shrink-0 pl-2">
                        <p className="text-[9px] font-black text-slate-400 dark:text-slate-500 leading-none mb-1 uppercase tracking-widest">Subtotal</p>
                        <p className="text-[#0047FF] font-black text-lg leading-none">Rp {(item.price * item.qty).toLocaleString('id-ID')}</p>
                      </div>
                    </div>

                    {/* Separator Line */}
                    <div className="h-px bg-slate-200 dark:bg-white/5 w-full" />

                    {/* Bottom Row: Price per Unit and Interactive Controls */}
                    <div className="flex items-center justify-between gap-4 w-full pt-1">
                      {/* Price per unit */}
                      <div className="text-left">
                        <p className="text-[9px] font-black text-slate-400 dark:text-slate-500 leading-none mb-1 uppercase tracking-widest">Harga Satuan</p>
                        <p className="text-xs font-black text-slate-700 dark:text-slate-300">
                          Rp {item.price.toLocaleString('id-ID')} <span className="text-[10px] text-slate-400 dark:text-slate-500 font-bold tracking-normal">/ pcs</span>
                        </p>
                      </div>

                      {/* Interactive Quantity Controls */}
                      <div className="flex items-center gap-2 bg-slate-100 dark:bg-black/25 border border-slate-200 dark:border-white/10 rounded-2xl px-3 py-1.5 shadow-inner">
                        <button 
                          onClick={() => handleDecreaseQty(idx)}
                          className="p-1.5 rounded-xl text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200 dark:hover:bg-white/10 transition-all cursor-pointer"
                          title="Kurangi Kuantitas"
                        >
                          <Minus className="w-3.5 h-3.5" />
                        </button>
                        
                        <span className="text-[#0047FF] font-black text-base min-w-[28px] text-center">{item.qty}</span>
                        
                        <button 
                          onClick={() => handleIncreaseQty(idx)}
                          className="p-1.5 rounded-xl text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200 dark:hover:bg-white/10 transition-all cursor-pointer"
                          title="Tambah Kuantitas"
                        >
                          <Plus className="w-3.5 h-3.5" />
                        </button>

                        <div className="h-5 w-px bg-slate-200 dark:bg-white/10 mx-1.5" />

                        <button 
                          onClick={() => handleRemoveItem(idx)}
                          className="p-1.5 rounded-xl text-rose-400 hover:text-rose-600 hover:bg-rose-500/10 transition-all cursor-pointer"
                          title="Hapus Barang"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </motion.div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* --- RIGHT: SUMMARY & PAYMENT --- */}
        <div className="lg:col-span-2 space-y-4">

          {/* MEMBER IDENTITY SECTION */}
          <div className="glass-card rounded-[2.5rem] p-6 text-left">
            {isMember && member ? (
              <div className="space-y-3">
                <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Member</p>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-emerald-500/10 rounded-xl border border-emerald-500/20 flex items-center justify-center">
                    <User className="text-emerald-500 w-5 h-5" />
                  </div>
                  <div>
                    <p className="font-black text-sm text-slate-900 dark:text-white leading-tight">{member.name}</p>
                    <p className="text-[10px] text-slate-500 font-bold">{member.phone || 'Member Aktif'}</p>
                  </div>
                  <div className="ml-auto">
                    <span className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 text-[9px] font-black uppercase tracking-widest px-2 py-1 rounded-full flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3" /> Aktif
                    </span>
                  </div>
                </div>

                {/* Points Balance */}
                <div className="bg-amber-500/10 border border-amber-500/20 rounded-2xl p-4 flex items-center justify-between">
                  <div className="flex items-center gap-3 text-left">
                    <Coins className="text-amber-500 w-5 h-5" />
                    <div>
                      <p className="text-[9px] font-black uppercase tracking-widest text-amber-500/70 leading-none mb-0.5">Saldo Poin</p>
                      {isLoadingPoints ? (
                        <Loader2 className="w-4 h-4 animate-spin text-amber-500" />
                      ) : (
                        <p className="text-sm font-black tracking-tighter text-slate-900 dark:text-white">{pointBalance.toLocaleString('id-ID')} <span className="text-[10px] text-amber-500">PTS</span></p>
                      )}
                    </div>
                  </div>
                  {pointBalance > 0 && (
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input type="checkbox" checked={usePoints} onChange={(e) => setUsePoints(e.target.checked)} className="sr-only peer" />
                      <div className="w-10 h-5 bg-slate-200 dark:bg-white/10 rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-amber-500 shadow-inner" />
                    </label>
                  )}
                </div>
                {usePoints && pointDeduction > 0 && (
                  <p className="text-[10px] text-amber-600 dark:text-amber-400 font-bold px-1">
                    Akan menggunakan {pointDeduction.toLocaleString('id-ID')} pts = -Rp{pointDeduction.toLocaleString('id-ID')}
                  </p>
                )}
              </div>
            ) : (
              <div className="text-center py-4 opacity-50 space-y-2">
                <Lock className="w-8 h-8 mx-auto text-slate-400" />
                <p className="text-xs font-bold text-slate-500">Tidak ada data member</p>
                <p className="text-[10px] text-slate-400">Kembali ke scanner untuk cek WA</p>
              </div>
            )}
          </div>

          {/* PROMO SECTION */}
          <div className="glass-card rounded-[2.5rem] p-6 space-y-3 text-left">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Promo Saya</span>
              {!isMember && (
                <span className="text-accent-pink flex items-center gap-1 text-[9px] font-black uppercase">
                  <Lock className="w-3 h-3" /> Member Only
                </span>
              )}
            </div>

            {!isMember ? (
              <div className="text-center py-6 opacity-40">
                <Tag className="w-8 h-8 mx-auto mb-2 text-slate-400" />
                <p className="text-xs font-bold text-slate-500">Login sebagai member untuk melihat promo</p>
              </div>
            ) : isLoadingPromos ? (
              <div className="flex items-center justify-center py-6">
                <Loader2 className="w-5 h-5 animate-spin text-neon-blue" />
              </div>
            ) : memberPromos.length === 0 ? (
              <div className="text-center py-6 opacity-40">
                <Sparkles className="w-8 h-8 mx-auto mb-2 text-slate-400" />
                <p className="text-xs font-bold text-slate-500">Belum ada promo untukmu</p>
              </div>
            ) : (
              <div className="space-y-2">
                {voucherError && (
                  <p className="text-pink-500 text-[10px] font-black uppercase italic px-1">{voucherError}</p>
                )}
                {memberPromos.map((promo) => {
                  const isActive = activePromo?.id === promo.id;
                  const discountLabel = promo.discount_type === 'percent'
                    ? `${promo.discount_value}% OFF`
                    : `Rp${promo.discount_value.toLocaleString('id-ID')} OFF`;
                  return (
                    <motion.button
                      key={promo.id}
                      whileTap={{ scale: 0.97 }}
                      onClick={() => handleApplyPromo(promo)}
                      className={`w-full flex items-center gap-3 p-4 rounded-2xl border text-left transition-all ${
                        isActive
                          ? 'bg-neon-blue/10 border-neon-blue text-neon-blue'
                          : 'bg-white/5 border-white/10 hover:border-neon-blue/40'
                      }`}
                    >
                      <div className={`w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 ${isActive ? 'bg-neon-blue' : 'bg-white/10'}`}>
                        <Ticket className={`w-4 h-4 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className={`font-black text-sm tracking-tight ${isActive ? 'text-neon-blue' : 'text-slate-900 dark:text-white'}`}>{promo.code}</p>
                        <p className="text-[9px] text-slate-500 font-bold">
                          {discountLabel}
                          {promo.min_purchase > 0 && ` · Min Rp${promo.min_purchase.toLocaleString('id-ID')}`}
                          {promo.expires_at && ` · s/d ${new Date(promo.expires_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })}`}
                        </p>
                      </div>
                      {isActive && <CheckCircle2 className="w-4 h-4 text-neon-blue flex-shrink-0" />}
                    </motion.button>
                  );
                })}
              </div>
            )}
          </div>

          {/* FINAL TOTAL BOX */}
          <div className="bg-[#0047FF] rounded-[2.5rem] p-8 shadow-[0_20px_50px_rgba(0,71,255,0.4)] relative overflow-hidden text-left">
            <div className="absolute top-[-20px] right-[-20px] w-32 h-32 bg-white/10 rounded-full blur-3xl" />

            <div className="space-y-3 relative z-10">
              <div className="flex justify-between text-white/60 text-[10px] font-black uppercase tracking-widest">
                <span>Subtotal</span>
                <span>Rp{subtotal.toLocaleString('id-ID')}</span>
              </div>

              <AnimatePresence>
                {promoDiscount > 0 && (
                  <motion.div initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0 }} className="flex justify-between text-yellow-400 text-[10px] font-black uppercase tracking-widest italic">
                    <span>Promo ({activePromo?.code})</span>
                    <span>-Rp{promoDiscount.toLocaleString('id-ID')}</span>
                  </motion.div>
                )}
              </AnimatePresence>

              <AnimatePresence>
                {pointDeduction > 0 && (
                  <motion.div initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0 }} className="flex justify-between text-amber-300 text-[10px] font-black uppercase tracking-widest">
                    <span>Redeem Poin ({pointDeduction.toLocaleString('id-ID')} pts)</span>
                    <span>-Rp{pointDeduction.toLocaleString('id-ID')}</span>
                  </motion.div>
                )}
              </AnimatePresence>

              <div className="pt-4 border-t border-white/20 flex justify-between items-end">
                <div>
                  <p className="text-[10px] font-black text-white/50 uppercase tracking-[0.2em] mb-1 leading-none">Total Payment</p>
                  <p className="text-4xl font-black italic tracking-tighter leading-none uppercase">Rp{total.toLocaleString('id-ID')}</p>
                </div>
                {isMember && earnedPoints > 0 && (
                  <div className="text-right">
                    <p className="text-[9px] font-black text-yellow-300 uppercase tracking-tighter leading-none mb-1 flex items-center gap-1 justify-end">
                      <Star className="w-3 h-3" /> + Poin
                    </p>
                    <p className="text-xl font-black italic tracking-tighter leading-none text-white">+{earnedPoints} pts</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* ACTION BUTTON */}
          <button
            onClick={handleCheckout}
            disabled={items.length === 0}
            className="w-full bg-white text-[#020617] py-6 rounded-[2.5rem] font-black text-xl uppercase tracking-[0.2em] shadow-2xl flex justify-center items-center gap-4 hover:bg-[#0047FF] hover:text-white transition-all transform active:scale-95 group disabled:opacity-30 disabled:cursor-not-allowed"
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