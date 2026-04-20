import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { Toaster } from 'sonner';
import Navbar from './components/Layout/Navbar';
import LandingPage from './pages/Landing/LandingPage';
import LoginPage from './pages/Auth/LoginPage';
import ForgotPasswordPage from './pages/Auth/ForgotPasswordPage';
import DashboardPage from './pages/Dashboard/DashboardPage';
import AnalyticsPage from './pages/Analytics/AnalyticsPage';
import ProfilePage from './pages/Profile/ProfilePage';
import { useAppStore } from './store/useAppStore';

// Deep Dark POS Vision Pages
import CameraScannerPage from './pages/POS/CameraScannerPage';
import IdentityCheckPage from './pages/POS/IdentityCheckPage';
import CartSummaryPage from './pages/POS/CartSummaryPage';
import PaymentQRISPage from './pages/POS/PaymentQRISPage';
import ReceiptVerificationPage from './pages/POS/ReceiptVerificationPage';

const ProtectedRoute = ({ 
  children, 
  user, 
  allowedRole 
}: { 
  children: React.ReactNode; 
  user: { name: string; role: string } | null;
  allowedRole?: string;
}) => {
  if (!user) return <Navigate to="/login" replace />;
  if (allowedRole && user.role !== allowedRole) return <Navigate to="/" replace />;
  return <>{children}</>;
};

function App() {
  const [isAuthReady, setIsAuthReady] = useState(false);
  const { user } = useAppStore(); // Migrated to Zustand from local useState

  useEffect(() => {
    setIsAuthReady(true);
  }, []);

  // Backwards compatibility for Admin Dashboards
  const handleLogin = (userData: { name: string; role: string }) => {
    useAppStore.setState({ user: userData });
  };

  const handleLogout = () => {
    useAppStore.getState().clearSession();
  };

  if (!isAuthReady) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-deep-dark">
        <div className="w-12 h-12 border-4 border-neon-cobalt border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <Router>
      <div className="min-h-screen bg-deep-dark transition-colors duration-300">
        <Toaster position="top-right" richColors theme="dark" />
        <NavbarWrapper user={user} onLogout={handleLogout} />
        
        <Routes>
          {/* Main Terminal Entry */}
          <Route path="/" element={<LandingPage />} />
          
          {/* Hidden Admin Login */}
          <Route 
            path="/login" 
            element={user ? <Navigate to={user.role === 'admin' ? '/dashboard' : '/scan'} replace /> : <LoginPage onLogin={handleLogin} />} 
          />
          <Route path="/forgot-password" element={user ? <Navigate to="/" replace /> : <ForgotPasswordPage />} />
          
          {/* VISION-FIRST KIOSK FLOW (No auth required to enter) */}
          <Route path="/scan" element={<CameraScannerPage />} />
          <Route path="/identity-check" element={<IdentityCheckPage />} />
          <Route path="/cart" element={<CartSummaryPage />} />
          <Route path="/payment" element={<PaymentQRISPage />} />
          <Route path="/verify-receipt" element={<ReceiptVerificationPage />} />
          
          {/* Admin / Settings Routes */}
          <Route 
            path="/dashboard" 
            element={
              <ProtectedRoute user={user} allowedRole="admin">
                <DashboardPage user={user} />
              </ProtectedRoute>
            } 
          />
          
          <Route 
            path="/analytics" 
            element={
              <ProtectedRoute user={user} allowedRole="kasir">
                <AnalyticsPage user={user} />
              </ProtectedRoute>
            } 
          />
          
          <Route 
            path="/profile" 
            element={
              <ProtectedRoute user={user} allowedRole="kasir">
                <ProfilePage user={user} onUpdate={handleLogin} />
              </ProtectedRoute>
            } 
          />
          
          {/* Fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </div>
    </Router>
  );
}

// Helper to hide navbar on Kiosk routes
const NavbarWrapper = ({ user, onLogout }: { user: any; onLogout: () => void }) => {
  const { pathname } = useLocation();
  const kioskRoutes = ['/', '/scan', '/identity-check', '/cart', '/payment', '/verify-receipt', '/kasir', '/dashboard', '/analytics', '/profile'];
  const hideNavbar = kioskRoutes.includes(pathname);
  
  if (hideNavbar) return null;
  return <Navbar user={user} onLogout={onLogout} />;
};

export default App;


