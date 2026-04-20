import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Phone, ArrowRight, UserCircle } from 'lucide-react';
import { motion } from 'motion/react';
import { useAppStore } from '../../store/useAppStore';
import { toast } from 'sonner';

interface LoginPageProps {
  onLogin: (user: { name: string; role: string; phone?: string }) => void;
}

export default function LoginPage({ onLogin }: LoginPageProps) {
  const [phone, setPhone] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const { language } = useAppStore();
  const t = language === 'id' ? {
    TITLE: 'Identifikasi Member',
    SUBTITLE: 'Masukkan Nomor WhatsApp Anda untuk mulai transaksi.',
    PHONE_LABEL: 'Nomor WhatsApp',
    PHONE_PLACEHOLDER: 'Contoh: 081234567890',
    LOGIN_BTN: 'Masuk Sekarang',
    OR: 'atau',
    GUEST_BTN: 'Lanjut Sebagai Tamu',
    ERR_EMPTY: 'Nomor WA tidak boleh kosong'
  } : {
    TITLE: 'Member Identification',
    SUBTITLE: 'Enter your WhatsApp number to start transaction.',
    PHONE_LABEL: 'WhatsApp Number',
    PHONE_PLACEHOLDER: 'Example: 081234567890',
    LOGIN_BTN: 'Login Now',
    OR: 'or',
    GUEST_BTN: 'Continue as Guest',
    ERR_EMPTY: 'WA Number cannot be empty'
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!phone) {
      toast.error(t.ERR_EMPTY);
      return;
    }

    setIsLoading(true);
    try {
      // Simulate API call for phone login
      // Actually here we would call an endpoint to see if they are a valid member
      // For now, let's treat everyone as a generic 'kasir' / member and go to /scan
      // Admin dashboard users might use a different route, or if phone == admin phone
      
      const role = phone === 'admin' ? 'admin' : 'kasir';
      onLogin({ name: phone, role, phone });
      
      if (role === 'admin') {
        navigate('/dashboard');
      } else {
        navigate('/scan');
      }
    } catch (err) {
      toast.error('Connection failed');
    } finally {
      setIsLoading(false);
    }
  };

  const handleGuest = () => {
    onLogin({ name: 'Guest', role: 'kasir' });
    navigate('/scan');
  };

  return (
    <div className="min-h-screen bg-deep-dark flex items-center justify-center p-4">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }} 
        animate={{ opacity: 1, scale: 1 }} 
        transition={{ duration: 0.5, ease: 'easeOut' }}
        className="w-full max-w-md bg-white/5 backdrop-blur-[20px] border border-white/10 p-8 rounded-3xl shadow-2xl relative overflow-hidden"
      >
        {/* Neon accent glows */}
        <div className="absolute -top-24 -left-24 w-48 h-48 bg-neon-cobalt opacity-20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -right-24 w-48 h-48 bg-hot-pink opacity-20 rounded-full blur-3xl pointer-events-none" />
        
        <div className="relative z-10 text-center mb-8">
          <h1 className="text-3xl font-black text-white mb-2">{t.TITLE}</h1>
          <p className="text-slate-400">{t.SUBTITLE}</p>
        </div>

        <form onSubmit={handleSubmit} className="relative z-10 space-y-6">
          <div className="space-y-2">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">
              {t.PHONE_LABEL}
            </label>
            <div className="relative group">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <Phone className="h-5 w-5 text-slate-400 group-focus-within:text-neon-cobalt transition-colors" />
              </div>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="block w-full pl-12 pr-4 py-4 bg-white/5 border border-white/10 rounded-2xl text-white font-bold focus:ring-2 focus:ring-neon-cobalt/50 focus:border-neon-cobalt outline-none transition-all"
                placeholder={t.PHONE_PLACEHOLDER}
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-neon-cobalt bg-opacity-90 hover:bg-opacity-100 text-white py-4 rounded-2xl font-black uppercase tracking-widest flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(0,71,255,0.4)] transition-all active:scale-[0.98] disabled:opacity-50"
          >
            {isLoading ? (
              <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <>
                {t.LOGIN_BTN}
                <ArrowRight className="w-5 h-5" />
              </>
            )}
          </button>
        </form>

        <div className="relative z-10 mt-8">
          <div className="relative flex justify-center text-sm">
            <span className="px-2 bg-transparent text-slate-500 font-semibold">{t.OR}</span>
          </div>
          <button
            onClick={handleGuest}
            type="button"
            className="mt-4 w-full bg-white/5 hover:bg-white/10 border border-white/10 text-white py-4 rounded-2xl font-black uppercase tracking-widest flex items-center justify-center gap-2 transition-all active:scale-[0.98]"
          >
            <UserCircle className="w-5 h-5 text-slate-300" />
            {t.GUEST_BTN}
          </button>
        </div>
      </motion.div>
    </div>
  );
}

