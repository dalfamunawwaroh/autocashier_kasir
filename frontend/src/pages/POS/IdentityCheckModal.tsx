import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Phone, ArrowRight, SkipForward, AlertCircle, X, Loader2, User } from 'lucide-react';
import { useAppStore, translations } from '../../store/useAppStore';
import type { CartItem } from './CameraScannerPage';

interface IdentityCheckModalProps {
  onClose: () => void;
  cartItems: CartItem[];
}

/**
 * Modal overlay for member identity verification via WhatsApp number.
 * On success → navigates to /cart with member data attached.
 * On skip → proceeds as guest.
 */
export default function IdentityCheckModal({ onClose, cartItems }: IdentityCheckModalProps) {
  const navigate = useNavigate();
  const { language, setMemberIdentity } = useAppStore();
  const t = translations[language];

  const [phone, setPhone] = useState('');
  const [errorStatus, setErrorStatus] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleCheckMember = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!phone) return;
    setIsLoading(true);
    setErrorStatus(null);

    try {
      const response = await fetch('/api/members/check', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone })
      });
      const data = await response.json();

      if (data.success && data.isMember) {
        setMemberIdentity(data.user, true);
        navigate('/cart', { state: { items: cartItems } });
      } else {
        setErrorStatus(t.WA_NOT_FOUND);
        setMemberIdentity({ name: 'Guest' }, false);
        setTimeout(() => navigate('/cart', { state: { items: cartItems } }), 2000);
      }
    } catch (err) {
      console.error('[IdentityCheckModal] Check member error:', err);
      setErrorStatus('Gagal terhubung ke server');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSkip = () => {
    setMemberIdentity({ name: 'Guest' }, false);
    navigate('/cart', { state: { items: cartItems } });
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
      <motion.div
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        onClick={onClose}
        className="absolute inset-0 bg-black/80 backdrop-blur-md"
      />
      <motion.div
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.9, y: 20 }}
        className="w-full max-w-md bg-[#020617] border border-white/10 p-10 rounded-[3.5rem] shadow-2xl relative z-10 text-center"
      >
        <button onClick={onClose} className="absolute top-8 right-8 text-slate-500 hover:text-white transition-colors">
          <X className="w-6 h-6" />
        </button>

        <div className="w-16 h-16 bg-white/5 border border-white/10 rounded-2xl flex items-center justify-center mx-auto mb-6 text-[#0047FF]">
          <User className="w-8 h-8 animate-pulse" />
        </div>
        <h1 className="text-3xl font-black text-white mb-2 italic uppercase tracking-tighter">{t.IDENTITY_TITLE}</h1>
        <p className="text-slate-400 font-medium text-sm mb-8">{t.IDENTITY_SUB}</p>

        {errorStatus && (
          <div className="mb-6 p-4 rounded-2xl bg-red-500/10 border border-red-500/30 flex gap-3 items-start text-left text-red-400 text-xs font-bold">
            <AlertCircle className="w-4 h-4 flex-shrink-0" /> {errorStatus}
          </div>
        )}

        <form onSubmit={handleCheckMember} className="space-y-6">
          <div className="space-y-2 text-left">
            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest px-1">{t.WA_LABEL}</label>
            <div className="relative group">
              <Phone className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-500 group-focus-within:text-[#0047FF] transition-colors" />
              <input
                type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} autoFocus
                className="block w-full pl-12 pr-4 py-5 bg-white/5 border border-white/10 rounded-2xl text-white font-bold text-lg outline-none focus:ring-2 focus:ring-[#0047FF]/50 transition-all"
                placeholder="0812..."
              />
            </div>
          </div>
          <button
            type="submit" disabled={isLoading || !phone}
            className="w-full bg-[#0047FF] text-white py-5 rounded-2xl font-black uppercase tracking-[0.2em] flex items-center justify-center gap-3 shadow-xl disabled:opacity-50 transition-all active:scale-95"
          >
            {isLoading ? <Loader2 className="w-6 h-6 animate-spin" /> : <>{t.CEK_MEMBER} <ArrowRight className="w-5 h-5" /></>}
          </button>
        </form>

        <button onClick={handleSkip} className="w-full mt-4 text-slate-500 hover:text-white py-4 rounded-2xl font-bold tracking-widest flex items-center justify-center gap-2 transition-all">
          {t.LEWATI} <SkipForward className="w-4 h-4" />
        </button>
      </motion.div>
    </div>
  );
}
