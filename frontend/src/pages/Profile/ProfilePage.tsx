import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { User, ShieldCheck, Save } from 'lucide-react';
import { toast } from 'sonner';

export default function ProfilePage({ user, onUpdate }: { user: any, onUpdate: (user: any) => void }) {
  const navigate = useNavigate();
  const [fullName, setFullName] = useState(user?.name || '');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const payload = {
        username: user.username,
        full_name: fullName,
        new_password: password ? password : undefined
      };

      const res = await fetch('/api/user/update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      
      if (data.success) {
        toast.success("Profile Updated Successfully!");
        onUpdate(data.user);
        setPassword('');
      } else {
        toast.error(data.message || "Failed to update profile.");
      }
    } catch (err) {
      toast.error("Network error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen pt-24 pb-12 px-6">
      <div className="max-w-3xl mx-auto w-full">
        <div className="mb-10">
          <h1 className="text-3xl font-black text-slate-900 dark:text-white uppercase tracking-tight font-heading flex items-center gap-4">
            <User className="w-8 h-8 text-neon-blue" />
            Pengaturan Profil
          </h1>
          <p className="text-slate-600 dark:text-slate-500 font-medium mt-2">Kelola informasi akun dan keamanan Anda.</p>
        </div>

        <div className="glass-card p-8 md:p-12 rounded-[3rem] relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-neon-blue/10 blur-3xl rounded-full" />
          
          <div className="flex flex-col md:flex-row items-center gap-8 mb-12 pb-12 border-b border-slate-200 dark:border-white/5">
            <div className="w-24 h-24 rounded-3xl bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 flex items-center justify-center shadow-premium">
              <User className="w-10 h-10 text-neon-blue" />
            </div>
            <div className="text-center md:text-left">
              <h2 className="text-2xl font-black text-slate-900 dark:text-white font-heading">{user?.name}</h2>
              <p className="text-neon-blue font-mono text-sm mt-1">@{user?.username}</p>
              <div className="flex items-center gap-2 mt-4 justify-center md:justify-start">
                <ShieldCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                <span className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-[10px] font-bold px-3 py-1 rounded-full border border-emerald-500/20 uppercase tracking-widest">
                  {user?.role?.replace('_', ' ')}
                </span>
              </div>
            </div>
          </div>

          <form onSubmit={handleUpdate} className="space-y-8">
            <div className="space-y-3">
              <label className="text-[10px] font-bold text-slate-600 dark:text-slate-500 uppercase tracking-[0.2em] ml-1">Nama Lengkap</label>
              <input 
                type="text" 
                value={fullName}
                onChange={e => setFullName(e.target.value)}
                required
                className="w-full bg-slate-100/50 dark:bg-white/5 border border-slate-200 dark:border-white/10 px-6 py-4 rounded-2xl text-slate-900 dark:text-white focus:outline-none focus:border-neon-blue transition-all"
              />
            </div>

            <div className="space-y-3">
              <label className="text-[10px] font-bold text-slate-600 dark:text-slate-500 uppercase tracking-[0.2em] ml-1">Kata Sandi Baru</label>
              <input 
                type="password" 
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="Kosongkan jika tidak ingin mengubah"
                className="w-full bg-slate-100/50 dark:bg-white/5 border border-slate-200 dark:border-white/10 px-6 py-4 rounded-2xl text-slate-900 dark:text-white placeholder:text-slate-500 dark:placeholder:text-slate-600 focus:outline-none focus:border-neon-blue transition-all"
              />
            </div>

            <div className="space-y-3">
              <label className="text-[10px] font-bold text-slate-600 dark:text-slate-500 uppercase tracking-[0.2em] ml-1">Cabang Aktif</label>
              <select
                value={localStorage.getItem('autocashier_branch') || 'Cabang Bandung'}
                onChange={(e) => {
                  localStorage.setItem('autocashier_branch', e.target.value);
                  toast.success(`Cabang aktif diubah menjadi ${e.target.value}`);
                  // Force a re-render by updating state (though not strictly necessary for this simple implementation)
                  setFullName(fullName); 
                }}
                className="w-full bg-slate-100/50 dark:bg-white/5 border border-slate-200 dark:border-white/10 px-6 py-4 rounded-2xl text-slate-900 dark:text-white focus:outline-none focus:border-neon-blue transition-all appearance-none"
              >
                <option value="Cabang Bandung">Cabang Bandung</option>
                <option value="Cabang Jakarta">Cabang Jakarta</option>
                <option value="Cabang Surabaya">Cabang Surabaya</option>
              </select>
            </div>

            <button 
              type="submit" 
              disabled={loading}
              className="w-full bg-neon-blue hover:shadow-glow text-white py-5 rounded-2xl font-bold flex items-center justify-center gap-3 transition-all active:scale-[0.98]"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  <Save className="w-5 h-5" />
                  SIMPAN PERUBAHAN
                </>
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
