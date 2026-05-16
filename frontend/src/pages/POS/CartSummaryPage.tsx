import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ShoppingCart, ArrowRight, Lock, CheckCircle2, Coins, Ticket, Trash2, 
  Tag, Loader2, User, Sparkles, Star 
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
  const { language, isMember, user } = useAppStore();
  const t = translations[language];

  const items: CartItem[] = location.state?.items || [];
  const totalQty = items.reduce((acc, item) => acc + item.qty, 0);
  const subtotal = items.reduce((acc, item) => acc + (item.price * item.qty), 0);

  // Member data state
  const [memberPromos, setMemberPromos] = useState<MemberPromo[]>([]);
  const [pointBalance, setPointBalance] = useState(0);
  const [isLoadingPromos, setIsLoadingPromos] = useState(false);
  const [isLoadingPoints, setIsLoadingPoints] = useState(false);

  // Voucher & points state
  const [activePromo, setActivePromo] = useState<MemberPromo | null>(null);
  const [usePoints, setUsePoints] = useState(false);
  const [voucherError, setVoucherError] = useState<string | null>(null);

  const memberId = user?.id;

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
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full bg-brand-primary/5 blur-[120px] pointer-events-none" />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-4xl grid grid-cols-1 lg:grid-cols-5 gap-6 z-10"
      >
        {/* --- LEFT: PRODUCT DETAIL --- */}
        <div className="lg:col-span-3 space-y-6">
          <div className="glass-card rounded-[2.5rem] p-8 flex flex-col h-[500px] md:h-[650px]">
            <div className="flex justify-between items-end mb-6">
              <h2 className="text-3xl font-black italic tracking-tighter uppercase leading-none text-slate-900 dark:text-white">Detail Belanja</h2>
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest bg-slate-100 dark:bg-white/5 px-3 py-1 rounded-full border border-slate-200 dark:border-white/10">{totalQty} ITEMS</span>
            </div>

            <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar space-y-4 text-left">
              {items.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center opacity-20 italic text-slate-500">
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
                    className="flex items-center gap-4 bg-slate-50/50 dark:bg-white/5 p-5 rounded-[2rem] border border-slate-200 dark:border-white/10 group hover:border-neon-blue transition-all"
                  >
                    <div className="w-14 h-14 bg-gradient-to-br from-neon-blue/10 to-accent-pink/10 rounded-2xl flex items-center justify-center border border-slate-200 dark:border-white/10 shadow-inner">
                      <span className="text-2xl">📦</span>
                    </div>
                    <div className="flex-1">
                      <h4 className="font-black text-sm tracking-tight leading-tight uppercase group-hover:text-neon-blue transition-colors text-slate-900 dark:text-white">{item.name}</h4>
                      <p className="text-[10px] text-slate-500 font-bold tracking-widest mt-1 italic leading-none">Rp{item.price.toLocaleString('id-ID')} / pcs</p>
                    </div>
                    <div className="text-right">
                      <p className="text-neon-blue font-black text-sm leading-none mb-1">x{item.qty}</p>
                      <p className="text-xs font-bold text-slate-500 dark:text-white/40 italic leading-none">Rp{(item.price * item.qty).toLocaleString('id-ID')}</p>
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
            {isMember && user ? (
              <div className="space-y-3">
                <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Member</p>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-emerald-500/10 rounded-xl border border-emerald-500/20 flex items-center justify-center">
                    <User className="text-emerald-500 w-5 h-5" />
                  </div>
                  <div>
                    <p className="font-black text-sm text-slate-900 dark:text-white leading-tight">{user.name}</p>
                    <p className="text-[10px] text-slate-500 font-bold">{user.phone || 'Member Aktif'}</p>
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