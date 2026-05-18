import React from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { ShoppingCart, Sun, Moon, MapPin, LogOut } from 'lucide-react';
import { motion } from 'motion/react';
import { useTheme } from 'next-themes';
import Logo from '../UI/Logo';

interface NavbarProps {
  user: { name: string; role: string; branch_code?: string } | null;
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
      className={`relative text-sm font-bold transition-all duration-300 ${
        isActive(to) ? 'text-brand-primary' : 'text-slate-600 dark:text-slate-400 hover:text-brand-primary'
      }`}
    >
      {children}
      {isActive(to) && (
        <motion.div 
          layoutId="activeTab"
          className="absolute -bottom-1.5 left-0 right-0 h-0.5 bg-brand-primary rounded-full shadow-[0_0_10px_rgba(37,99,235,0.4)]"
        />
      )}
    </Link>
  );

  const handleLogoutClick = () => {
    localStorage.removeItem('autocashier_branch_id');
    localStorage.removeItem('autocashier_branch_code');
    onLogout();
    navigate('/login');
  };

  return (
    <nav className="fixed top-0 left-0 right-0 h-16 bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl border-b border-slate-200 dark:border-white/5 z-50 px-6 flex items-center justify-between transition-colors duration-300">
      <Link to="/" className="flex items-center gap-4">
        <Logo />
      </Link>

      <div className="flex items-center gap-6">
        {/* Branch Identifier and Cashier Info */}
        {user && (
          <div className="hidden md:flex items-center gap-3 bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 px-4 py-1.5 rounded-2xl">
            <div className="flex items-center gap-1.5 text-xs font-black text-brand-primary bg-brand-primary/10 px-2 py-0.5 rounded-lg border border-brand-primary/20">
              <MapPin className="w-3.5 h-3.5" />
              <span>{user.branch_code || localStorage.getItem('autocashier_branch_code') || 'BDG'}</span>
            </div>
            <div className="h-4 w-px bg-slate-200 dark:bg-white/10" />
            <div className="text-left">
              <p className="text-xs font-bold leading-none text-slate-800 dark:text-white">{user.name}</p>
              <p className="text-[10px] font-medium leading-none text-slate-400 capitalize mt-0.5">{user.role}</p>
            </div>
          </div>
        )}

        <button 
          onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
          className="p-2 rounded-xl bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 text-slate-600 dark:text-slate-400 hover:text-brand-primary transition-all"
        >
          {theme === 'dark' ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
        </button>

        <div className="flex items-center gap-6">
          <NavLink to="/">Home</NavLink>
          {user ? (
            <>
              <NavLink to="/scan">
                <div className="flex items-center gap-2">
                  <ShoppingCart className="w-4 h-4" />
                  POS
                </div>
              </NavLink>
              
              <button
                onClick={handleLogoutClick}
                className="flex items-center gap-2 text-sm font-bold text-hot-pink hover:text-hot-pink/80 transition-colors"
                title="Logout"
              >
                <LogOut className="w-4 h-4" />
                <span className="hidden sm:inline">Logout</span>
              </button>
            </>
          ) : (
            <NavLink to="/login">Login</NavLink>
          )}
        </div>
      </div>
    </nav>
  );
}
