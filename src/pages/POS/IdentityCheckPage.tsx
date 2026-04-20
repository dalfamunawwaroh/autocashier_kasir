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
    
    setTimeout(() => {
      // Mock logic: Only allow '081234' as a demo valid member
      if (phone === '081234') {
        const user = { name: 'Demo Member', role: 'kasir', phone };
        setIdentity(user, true); // true = valid member
        navigate('/cart', { state: { items: cartItems } });
      } else {
        // Not found -> Guests
        setErrorStatus(t.WA_NOT_FOUND);
        setIdentity({ name: 'Guest', role: 'kasir' }, false);
        
        // Auto-proceed to cart as guest after reading the error
        setTimeout(() => navigate('/cart', { state: { items: cartItems } }), 3000);
      }
      setIsLoading(false);
    }, 1000);
  };

  const handleSkip = () => {
    setIdentity({ name: 'Guest', role: 'kasir' }, false);
    navigate('/cart', { state: { items: cartItems } });
  };

  return (
    <div className="min-h-screen bg-deep-dark flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background aesthetics */}
      <div className="absolute top-1/4 -right-24 w-96 h-96 bg-neon-cobalt opacity-20 rounded-full blur-[100px] pointer-events-none" />
      <div className="absolute bottom-1/4 -left-24 w-96 h-96 bg-hot-pink opacity-10 rounded-full blur-[100px] pointer-events-none" />

      <motion.div 
        initial={{ opacity: 0, y: 30 }} 
        animate={{ opacity: 1, y: 0 }} 
        className="w-full max-w-md bg-[#020617]/80 backdrop-blur-[20px] border border-white/10 p-8 rounded-[2rem] shadow-2xl relative z-10"
      >
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-white/5 border border-white/10 rounded-2xl flex items-center justify-center mx-auto mb-6">
            <span className="text-3xl">👋</span>
          </div>
          <h1 className="text-3xl font-black text-white mb-2">{t.IDENTITY_TITLE}</h1>
          <p className="text-slate-400 font-medium">{t.IDENTITY_SUB}</p>
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
                <Phone className="h-5 w-5 text-slate-400 group-focus-within:text-neon-cobalt transition-colors" />
              </div>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                autoFocus
                className="block w-full pl-12 pr-4 py-4 bg-white/5 border border-white/10 rounded-2xl text-white font-bold text-lg tracking-wider focus:ring-2 focus:ring-neon-cobalt/50 focus:border-neon-cobalt outline-none transition-all placeholder:text-slate-600"
                placeholder={t.WA_PLACEHOLDER}
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading || !phone}
            className="w-full bg-neon-cobalt hover:bg-neon-cobalt/90 text-white py-4 rounded-2xl font-black uppercase tracking-widest flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(0,71,255,0.4)] transition-all active:scale-[0.98] disabled:opacity-50"
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
