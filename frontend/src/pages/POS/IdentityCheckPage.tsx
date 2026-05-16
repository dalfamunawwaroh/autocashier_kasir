import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';
import { Phone, ArrowRight, SkipForward, AlertCircle } from 'lucide-react';
import { useAppStore, translations } from '../../store/useAppStore';

export default function IdentityCheckPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { language, setIdentity } = useAppStore();
  const t = translations[language];

  // Receive the cart items forwarded from Scanner
  const cartItems = location.state?.items || [];
  
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

      if (data.success && data.isMember && data.user) {
        setIdentity(data.user, true); // true = valid member
        navigate('/cart', { state: { items: cartItems } });
      } else {
        // Not found -> Guests
        setErrorStatus(data.message || t.WA_NOT_FOUND);
        setIdentity({ name: 'Guest', role: 'kasir' }, false);
        
        // Auto-proceed to cart as guest after reading the error
        setTimeout(() => navigate('/cart', { state: { items: cartItems } }), 3000);
      }
    } catch (err) {
      console.error("Error checking member:", err);
      setErrorStatus("Terjadi kesalahan sistem. Melanjutkan sebagai Guest.");
      setIdentity({ name: 'Guest', role: 'kasir' }, false);
      setTimeout(() => navigate('/cart', { state: { items: cartItems } }), 3000);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSkip = () => {
    setIdentity({ name: 'Guest', role: 'kasir' }, false);
    navigate('/cart', { state: { items: cartItems } });
  };

  return (
    <div className="min-h-screen bg-surface-light dark:bg-surface-dark bg-mesh flex items-center justify-center p-4 relative overflow-hidden text-slate-900 dark:text-white">
      {/* Background aesthetics */}
      <div className="absolute top-1/4 -right-24 w-96 h-96 bg-neon-blue opacity-10 rounded-full blur-[100px] pointer-events-none" />
      <div className="absolute bottom-1/4 -left-24 w-96 h-96 bg-accent-pink opacity-5 rounded-full blur-[100px] pointer-events-none" />

      <motion.div 
        initial={{ opacity: 0, y: 30 }} 
        animate={{ opacity: 1, y: 0 }} 
        className="w-full max-w-md glass-card p-8 rounded-[2rem] shadow-2xl relative z-10"
      >
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-2xl flex items-center justify-center mx-auto mb-6 text-slate-900 dark:text-white">
            <span className="text-3xl">👋</span>
          </div>
          <h1 className="text-3xl font-black text-slate-900 dark:text-white mb-2">{t.IDENTITY_TITLE}</h1>
          <p className="text-slate-600 dark:text-slate-400 font-medium">{t.IDENTITY_SUB}</p>
        </div>

        {errorStatus && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="mb-6 p-4 rounded-2xl bg-hot-pink/10 border border-hot-pink/30 flex gap-3 items-start"
          >
            <AlertCircle className="w-5 h-5 text-hot-pink flex-shrink-0 mt-0.5" />
            <p className="text-sm font-bold text-hot-pink/90">{errorStatus}</p>
          </motion.div>
        )}

        <form onSubmit={handleCheckMember} className="space-y-6 relative">
          <div className="space-y-2">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">
              {t.WA_LABEL}
            </label>
            <div className="relative group">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <Phone className="h-5 w-5 text-slate-400 group-focus-within:text-neon-blue transition-colors" />
              </div>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                autoFocus
                className="block w-full pl-12 pr-4 py-4 bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-2xl text-slate-900 dark:text-white font-bold text-lg tracking-wider focus:ring-2 focus:ring-neon-blue/50 focus:border-neon-blue outline-none transition-all placeholder:text-slate-500"
                placeholder={t.WA_PLACEHOLDER}
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading || !phone}
            className="w-full bg-neon-blue hover:bg-neon-blue/90 text-white py-4 rounded-2xl font-black uppercase tracking-widest flex items-center justify-center gap-2 shadow-[0_10px_30px_rgba(0,102,255,0.3)] transition-all active:scale-[0.98] disabled:opacity-50"
          >
            {isLoading ? (
              <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <>
                {t.CEK_MEMBER}
                <ArrowRight className="w-5 h-5" />
              </>
            )}
          </button>
        </form>

        <div className="mt-6">
          <button
            onClick={handleSkip}
            type="button"
            className="w-full bg-transparent hover:bg-white/5 border border-transparent hover:border-white/10 text-slate-400 hover:text-white py-4 rounded-2xl font-bold tracking-widest flex items-center justify-center gap-2 transition-all"
          >
            {t.LEWATI}
            <SkipForward className="w-4 h-4" />
          </button>
        </div>
      </motion.div>
    </div>
  );
}
