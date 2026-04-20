import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, User, ShieldCheck, Save } from 'lucide-react';
import { toast } from 'sonner';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { useTheme } from 'next-themes';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export default function ProfilePage({ user, onUpdate }: { user: any, onUpdate: (user: any) => void }) {
  const navigate = useNavigate();
  const [fullName, setFullName] = useState(user?.name || '');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const { theme } = useTheme();
  const isDark = theme === 'dark';

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
    <div className={cn(
      "min-h-screen flex flex-col font-sans transition-colors duration-300",
      isDark ? "bg-[#0f172a] text-[#f1f5f9]" : "bg-slate-50 text-slate-900"
    )}>
      {/* Header */}
      <div className={cn(
        "h-16 border-b flex items-center px-8 shrink-0 relative transition-colors duration-300",
        isDark ? "bg-[#1e293b] border-slate-700" : "bg-white border-slate-200"
      )}>
        <button 
          onClick={() => navigate('/kasir')}
          className={cn(
            "p-2 rounded-full mr-4 transition-colors",
            isDark ? "hover:bg-slate-800" : "hover:bg-slate-100"
          )}
        >
          <ArrowLeft className="w-5 h-5 text-slate-400" />
        </button>
        <h1 className="text-xl font-black uppercase tracking-widest flex items-center gap-3">
          <User className="w-6 h-6 text-blue-500" />
          Profile Settings
        </h1>
      </div>

      <div className="flex-1 p-8 max-w-3xl mx-auto w-full">
        <div className={cn(
          "p-8 rounded-3xl border transition-colors duration-300",
          isDark ? "bg-slate-900 border-slate-800" : "bg-white border-slate-200 shadow-sm"
        )}>
          
          <div className="flex items-center gap-6 mb-10 pb-10 border-b border-slate-800 border-dashed">
            <div className={cn(
              "w-24 h-24 rounded-full border-4 shadow-xl flex items-center justify-center",
              isDark ? "bg-slate-800 border-slate-700" : "bg-slate-100 border-slate-200"
            )}>
              <User className="w-10 h-10 text-slate-400" />
            </div>
            <div>
              <h2 className="text-2xl font-black">{user?.name}</h2>
              <p className="text-slate-500 font-mono text-sm mt-1">@{user?.username}</p>
              <div className="flex items-center gap-2 mt-3">
                <ShieldCheck className="w-4 h-4 text-emerald-500" />
                <span className="bg-emerald-500/10 text-emerald-500 text-[10px] font-bold px-2 py-1 rounded border border-emerald-500/20 uppercase tracking-widest">
                  {user?.role}
                </span>
              </div>
            </div>
          </div>

          <form onSubmit={handleUpdate} className="space-y-6">
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">Display Name</label>
              <input 
                type="text" 
                value={fullName}
                onChange={e => setFullName(e.target.value)}
                required
                className={cn(
                  "w-full px-4 py-3 rounded-xl border focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors",
                  isDark ? "bg-slate-800 border-slate-700 text-white" : "bg-slate-50 border-slate-200 text-slate-900"
                )}
              />
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">New Password</label>
              <input 
                type="password" 
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="Leave blank to keep current password"
                className={cn(
                  "w-full px-4 py-3 rounded-xl border focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors",
                  isDark ? "bg-slate-800 border-slate-700 text-white" : "bg-slate-50 border-slate-200 text-slate-900"
                )}
              />
            </div>

            <button 
              type="submit" 
              disabled={loading || (!fullName.trim() && !password)}
              className="w-full mt-6 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-700 disabled:opacity-50 text-white py-4 rounded-xl font-bold flex items-center justify-center gap-2 transition-all active:scale-[0.98]"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  <Save className="w-5 h-5" />
                  SAVE CHANGES
                </>
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
