import React from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { ShoppingCart, Sun, Moon } from 'lucide-react';
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

  return (
    <nav className="fixed top-0 left-0 right-0 h-16 bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl border-b border-slate-200 dark:border-white/5 z-50 px-6 flex items-center justify-between transition-colors duration-300">
      <Link to="/" className="flex items-center gap-4">
        <Logo />
      </Link>

      <div className="flex items-center gap-6">
        <button 
          onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
          className="p-2 rounded-xl bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 text-slate-600 dark:text-slate-400 hover:text-brand-primary transition-all"
        >
          {theme === 'dark' ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
        </button>

          <div className="flex items-center gap-6">
            <NavLink to="/">Home</NavLink>
            <NavLink to="/scan">
              <div className="flex items-center gap-2">
                <ShoppingCart className="w-4 h-4" />
                POS
              </div>
            </NavLink>
          </div>
      </div>
    </nav>
  );
}
