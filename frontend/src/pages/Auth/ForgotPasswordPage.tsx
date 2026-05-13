import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Mail, Lock, KeyRound, ArrowRight, AlertCircle, CheckCircle2 } from 'lucide-react';
import { motion } from 'motion/react';
import { toast } from 'sonner';
import AuthLayout from '../../components/Layout/AuthLayout';

export default function ForgotPasswordPage() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // State payloads
  const [email, setEmail] = useState('');
  const [token, setToken] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const handleSendResetLink = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      setError('Masukkan email Anda terlebih dahulu.');
      return;
    }
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      });
      const data = await res.json();
      if (data.success) {
        toast.success(`Link dikirim! (SIMULASI MOCK: Token: ${data.token})`);
        // We auto fill the token for dev testing since it's a mock
        setToken(data.token);
        setStep(2);
      } else {
        setError(data.message || 'Email tidak ditemukan.');
      }
    } catch (err) {
      setError('Gagal menghubungkan ke server.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token || !newPassword) {
      setError('Semua field wajib diisi.');
      return;
    }
    if (newPassword.length < 6) {
      setError('Password minimal 6 karakter.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setError('Konfirmasi password tidak cocok.');
      return;
    }

    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, new_password: newPassword })
      });
      const data = await res.json();
      
      if (data.success) {
        toast.success("Password Berhasil Direset! Silakan login.");
        setStep(3);
        setTimeout(() => navigate('/login'), 2000);
      } else {
        toast.error(data.message || "Token tidak valid.");
        setError(data.message || "Gagal mereset password.");
      }
    } catch (err) {
      setError('Gagal menghubungkan ke server.');
    } finally {
      setIsLoading(false);
    }
  };

  if (step === 3) {
    return (
      <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
        <AuthLayout 
          title="Pemulihan Berhasil" 
          subtitle="Password akun Anda telah berhasil diperbarui."
        >
          <div className="flex flex-col items-center justify-center py-10 space-y-6">
            <div className="w-20 h-20 bg-emerald-100 dark:bg-emerald-900/30 rounded-[2rem] flex items-center justify-center shadow-xl shadow-emerald-500/20">
              <CheckCircle2 className="w-10 h-10 text-emerald-600 dark:text-emerald-400" />
            </div>
            <p className="text-slate-500 dark:text-slate-400 font-bold text-center">Mengalihkan ke halaman login...</p>
          </div>
        </AuthLayout>
      </motion.div>
    );
  }

  return (
    <motion.div initial={{ opacity: 0, x: -15 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.4 }}>
      <AuthLayout 
        title="Lupa Password?" 
        subtitle={step === 1 ? "Masukkan email Anda untuk kami kirimkan link reset." : "Masukkan token reset dan password baru Anda."}
      >
        <form onSubmit={step === 1 ? handleSendResetLink : handleReset} className="space-y-6">
          {error && (
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-900/30 text-red-600 dark:text-red-400 p-4 rounded-2xl flex items-center gap-3 text-sm font-bold">
              <AlertCircle className="w-5 h-5 flex-shrink-0" />
              {error}
            </div>
          )}

          {step === 1 ? (
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest px-1">Email Anda</label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <Mail className="h-5 w-5 text-slate-400 group-focus-within:text-cobalt-600 transition-colors" />
                  </div>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="block w-full pl-12 pr-4 py-4 bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-2xl text-slate-900 dark:text-white font-bold focus:ring-2 focus:ring-cobalt-600/20 focus:border-cobalt-600 outline-none transition-all"
                    placeholder="Contoh: dalfa@gmail.com"
                    autoFocus
                  />
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-5">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest px-1">Token Reset</label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <KeyRound className="h-5 w-5 text-slate-400 group-focus-within:text-cobalt-600 transition-colors" />
                  </div>
                  <input
                    type="text"
                    value={token}
                    onChange={(e) => setToken(e.target.value)}
                    className="block w-full pl-12 pr-4 py-3 bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-2xl text-slate-900 dark:text-white font-bold focus:ring-2 focus:ring-cobalt-600/20 focus:border-cobalt-600 outline-none transition-all text-sm"
                    placeholder="Masukkan 6-digit token"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest px-1">Password Baru</label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <Lock className="h-5 w-5 text-slate-400 group-focus-within:text-cobalt-600 transition-colors" />
                  </div>
                  <input
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="block w-full pl-12 pr-4 py-3 bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-2xl text-slate-900 dark:text-white font-bold focus:ring-2 focus:ring-cobalt-600/20 focus:border-cobalt-600 outline-none transition-all text-sm"
                    placeholder="Minimal 6 karakter"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest px-1">Konfirmasi Password Baru</label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <Lock className="h-5 w-5 text-slate-400 group-focus-within:text-cobalt-600 transition-colors" />
                  </div>
                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="block w-full pl-12 pr-4 py-3 bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-2xl text-slate-900 dark:text-white font-bold focus:ring-2 focus:ring-cobalt-600/20 focus:border-cobalt-600 outline-none transition-all text-sm"
                    placeholder="Cocokkan dengan di atas"
                  />
                </div>
              </div>
            </div>
          )}

          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-slate-900 text-white dark:bg-cobalt-600 py-4 rounded-2xl font-black uppercase tracking-widest flex items-center justify-center gap-2 shadow-xl hover:bg-slate-800 dark:hover:bg-blue-700 transition-all active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed border border-slate-200 dark:border-transparent"
          >
            {isLoading ? (
              <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <>
                {step === 1 ? 'Kirim Link Reset' : 'Reset Password'}
                <ArrowRight className="w-5 h-5" />
              </>
            )}
          </button>

          <p className="text-center text-sm font-bold text-slate-500 dark:text-slate-400">
            Ingat password Anda?{' '}
            <Link to="/login" className="text-cobalt-600 dark:text-blue-400 hover:underline">Kembali ke Login</Link>
          </p>
        </form>
      </AuthLayout>
    </motion.div>
  );
}
