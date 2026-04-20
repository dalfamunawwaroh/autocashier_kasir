import React from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Scan, LogOut, User, LayoutDashboard, ShoppingCart, Sun, Moon } from 'lucide-react';
import { motion } from 'motion/react';
import { useTheme } from 'next-themes';
import Logo from '../UI/Logo';

interface NavbarProps {
  user: { name: string; role: string } | null;
  onLogout: () => void;
}

export default function Navbar({ user, onLogout }: NavbarProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const { theme, setTheme } = useTheme();

  const isActive = (path: string) => location.pathname === path;

  const NavLink = ({ to, children }: { to: string; children: React.ReactNode }) => (
    <Link 
      to={to} 
      className={`relative text-sm font-bold transition-colors ${
        isActive(to) ? 'text-cobalt-600 dark:text-blue-400' : 'text-slate-900 dark:text-slate-400 hover:text-cobalt-600 dark:hover:text-blue-400'
      }`}
    >
      {children}
      {isActive(to) && (
        <motion.div 
          layoutId="activeTab"
          className="absolute -bottom-1 left-0 right-0 h-0.5 bg-cobalt-600 dark:bg-blue-400 rounded-full"
        />
      )}
    </Link>
  );

  return (
    <nav className="fixed top-0 left-0 right-0 h-16 bg-white/80 dark:bg-navy-900/80 backdrop-blur-md border-b border-slate-200 dark:border-white/10 z-50 px-6 flex items-center justify-between">
      <Link to="/" className="flex items-center gap-4">
        <Logo />
      </Link>

      <div className="flex items-center gap-6">
        <button
          onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
          className="p-2 rounded-full hover:bg-slate-100 dark:hover:bg-white/10 transition-colors text-slate-900 dark:text-slate-400"
          title="Toggle Dark Mode"
        >
          {theme === 'dark' ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
        </button>

        {!user ? (
          <>
            <NavLink to="/">Home</NavLink>
            <NavLink to="/login">Login</NavLink>
            <Link to="/register" className="bg-cobalt-600 text-white px-5 py-2 rounded-full text-sm font-bold hover:bg-blue-700 transition-all shadow-lg shadow-blue-500/20">
              Register
            </Link>
          </>
        ) : (
          <>
            {user.role === 'afa_kasir' && (
              <NavLink to="/pos">
                <div className="flex items-center gap-2">
                  <ShoppingCart className="w-4 h-4" />
                  POS Interface
                </div>
              </NavLink>
            )}
            {user.role === 'inaya_admin' && (
              <NavLink to="/dashboard">
                <div className="flex items-center gap-2">
                  <LayoutDashboard className="w-4 h-4" />
                  Admin Dashboard
                </div>
              </NavLink>
            )}
            
            <div className="h-8 w-px bg-slate-200 dark:bg-white/10" />
            
            <div className="flex items-center gap-3">
              <div className="text-right hidden sm:block">
                <p className="text-xs font-bold text-slate-800 dark:text-slate-200">{user.name}</p>
                <p className="text-[10px] text-slate-400 uppercase font-bold tracking-widest">{user.role.replace('_', ' ')}</p>
              </div>
              <div className="w-8 h-8 rounded-full bg-slate-100 dark:bg-white/10 border border-slate-200 dark:border-white/10 flex items-center justify-center">
                <User className="w-4 h-4 text-slate-400" />
              </div>
              <button 
                onClick={() => {
                  onLogout();
                  navigate('/');
                }}
                className="p-2 text-slate-400 hover:text-red-500 transition-colors"
                title="Logout"
              >
                <LogOut className="w-5 h-5" />
              </button>
            </div>
          </>
        )}
      </div>
    </nav>
  );
}
