import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Phone, ArrowRight, UserCircle } from 'lucide-react';
import { motion } from 'motion/react';
import { useAppStore } from '../../store/useAppStore';
import { toast } from 'sonner';

interface LoginPageProps {
  onLogin: (user: { name: string; role: string; phone?: string; branch_id?: string; branch_code?: string; branch_name?: string }) => void;
}

export default function LoginPage({ onLogin }: LoginPageProps) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const { language, user } = useAppStore();
  
  React.useEffect(() => {
    if (user) {
      if (user.role === 'admin') {
        navigate('/dashboard');
      } else {
        navigate('/scan');
      }
    }
  }, [user, navigate]);

  const t = language === 'id' ? {
    TITLE: 'Identifikasi Sistem',
    SUBTITLE: 'Masukkan kredensial Admin atau Nomor WA.',
    PHONE_LABEL: 'Username / Nomor WA',
    PHONE_PLACEHOLDER: 'Contoh: superadmin / 0812...',
    PASSWORD_LABEL: 'Password (Khusus Admin)',
    PASSWORD_PLACEHOLDER: 'Masukkan password',
    LOGIN_BTN: 'Masuk Sekarang',
    OR: 'atau',
    GUEST_BTN: 'Lanjut Sebagai Tamu',
    ERR_EMPTY: 'Username / Nomor WA tidak boleh kosong'
  } : {
    TITLE: 'System Identification',
    SUBTITLE: 'Enter Admin credentials or WA Number.',
    PHONE_LABEL: 'Username / WA Number',
    PHONE_PLACEHOLDER: 'Example: superadmin / 0812...',
    PASSWORD_LABEL: 'Password (Admin Only)',
    PASSWORD_PLACEHOLDER: 'Enter password',
    LOGIN_BTN: 'Login Now',
    OR: 'or',
    GUEST_BTN: 'Continue as Guest',
    ERR_EMPTY: 'Username / WA Number cannot be empty'
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanUsername = username.trim();
    if (!cleanUsername) {
      toast.error(t.ERR_EMPTY);
      return;
    }

    setIsLoading(true);
    try {
      if (password) {
        // Authenticate via database
        const res = await fetch('/api/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ username: cleanUsername, password })
        });
        const data = await res.json();
        
        if (res.ok && data.success) {
          // Pass the authenticated user data to the store
          const role = data.user.role || 'admin';
          
          if (data.user.branch_id) {
            localStorage.setItem('autocashier_branch_id', data.user.branch_id);
            localStorage.setItem('autocashier_branch_code', data.user.branch_code || 'BDG');
            localStorage.setItem('autocashier_branch_name', data.user.branch_name || 'Bandung');
            console.log(`[Login] Selected user branch: ${data.user.branch_code}`);
          }
          
          onLogin({ 
            name: data.user.name || cleanUsername, 
            role, 
            phone: cleanUsername,
            branch_id: data.user.branch_id,
            branch_code: data.user.branch_code,
            branch_name: data.user.branch_name
          });
        } else {
          toast.error(data.error || 'Login gagal, periksa username/password');
        }
      } else {
        // Fallback Kasir
        const role = (cleanUsername === 'admin' || cleanUsername === 'admin_utama' || cleanUsername === 'superadmin') ? 'admin' : 'kasir';
        onLogin({ name: cleanUsername, role, phone: cleanUsername });
      }
    } catch (err) {
      toast.error('Koneksi ke server gagal');
    } finally {
      setIsLoading(false);
    }
  };

  const handleGuest = () => {
    onLogin({ name: 'Guest', role: 'kasir' });
  };

  return (
    <div className="min-h-screen bg-mesh flex items-center justify-center p-4">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }} 
        animate={{ opacity: 1, scale: 1 }} 
        transition={{ duration: 0.5, ease: 'easeOut' }}
        className="w-full max-w-md glass-card p-8 rounded-3xl relative overflow-hidden"
      >
        {/* Brand accent glows */}
        <div className="absolute -top-24 -left-24 w-48 h-48 bg-brand-primary opacity-10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -right-24 w-48 h-48 bg-brand-accent opacity-10 rounded-full blur-3xl pointer-events-none" />
        
        <div className="relative z-10 text-center mb-8">
          <h1 className="text-3xl font-black text-slate-900 dark:text-white mb-2 font-heading tracking-tight">{t.TITLE}</h1>
          <p className="text-slate-600 dark:text-slate-400 font-medium">{t.SUBTITLE}</p>
        </div>

        <form onSubmit={handleSubmit} className="relative z-10 space-y-6">
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest px-1">
                {t.PHONE_LABEL}
              </label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <UserCircle className="h-5 w-5 text-slate-400 group-focus-within:text-brand-primary transition-colors" />
                </div>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="block w-full pl-12 pr-4 py-4 bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-2xl text-slate-900 dark:text-white font-bold focus:ring-2 focus:ring-brand-primary/50 focus:border-brand-primary outline-none transition-all placeholder:text-slate-500"
                  placeholder={t.PHONE_PLACEHOLDER}
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest px-1">
                {t.PASSWORD_LABEL}
              </label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <Phone className="h-5 w-5 text-slate-400 group-focus-within:text-brand-primary transition-colors opacity-0" />
                  <div className="absolute left-4">🔒</div>
                </div>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="block w-full pl-12 pr-4 py-4 bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-2xl text-slate-900 dark:text-white font-bold focus:ring-2 focus:ring-brand-primary/50 focus:border-brand-primary outline-none transition-all placeholder:text-slate-500"
                  placeholder={t.PASSWORD_PLACEHOLDER}
                />
              </div>
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-brand-primary hover:bg-brand-primary/90 text-white py-4 rounded-2xl font-black uppercase tracking-widest flex items-center justify-center gap-2 shadow-[0_10px_30px_rgba(37,99,235,0.3)] transition-all active:scale-[0.98] disabled:opacity-50"
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
            <span className="px-2 bg-transparent text-slate-500 font-bold uppercase tracking-widest text-[10px]">{t.OR}</span>
          </div>
          <button
            onClick={handleGuest}
            type="button"
            className="mt-4 w-full bg-slate-50 dark:bg-white/5 hover:bg-slate-100 dark:hover:bg-white/10 border border-slate-200 dark:border-white/10 text-slate-900 dark:text-white py-4 rounded-2xl font-black uppercase tracking-widest flex items-center justify-center gap-2 transition-all active:scale-[0.98]"
          >
            <UserCircle className="w-5 h-5 text-slate-500" />
            {t.GUEST_BTN}
          </button>
        </div>
      </motion.div>
    </div>
  );
}

