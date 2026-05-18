import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { Toaster } from 'sonner';
import Navbar from './components/Layout/Navbar';
import LandingPage from './pages/Landing/LandingPage';
import { useAppStore } from './store/useAppStore';

// Deep Dark POS Vision Pages
import CameraScannerPage from './pages/POS/CameraScannerPage';
import IdentityCheckPage from './pages/POS/IdentityCheckPage';
import CartSummaryPage from './pages/POS/CartSummaryPage';
import PaymentQRISPage from './pages/POS/PaymentQRISPage';
import ReceiptVerificationPage from './pages/POS/ReceiptVerificationPage';



import LoginPage from './pages/Auth/LoginPage';

// Simple ProtectedRoute wrapper
const ProtectedRoute = ({ children, user }: { children: React.ReactNode; user: any }) => {
  if (!user) {
    return <Navigate to="/login" replace />;
  }
  return <>{children}</>;
};

function App() {
  const [isAuthReady, setIsAuthReady] = useState(false);
  const { user, setIdentity } = useAppStore();

  useEffect(() => {
    setIsAuthReady(true);
    
    // Auto-fetch branch globally if missing in localStorage
    if (!localStorage.getItem('autocashier_branch_id')) {
      fetch('/api/branches')
        .then(res => res.json())
        .then(data => {
          if (data.success && data.data.length > 0) {
            localStorage.setItem('autocashier_branch_id', data.data[0].id);
            localStorage.setItem('autocashier_branch_code', data.data[0].code);
            console.log(`[App] Auto-selected default branch: ${data.data[0].name} (${data.data[0].code})`);
          }
        })
        .catch(err => console.error('[App] Failed to auto-fetch branches:', err));
    }
  }, []);

  if (!isAuthReady) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-brand-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <Router>
      <div className="min-h-screen bg-mesh text-slate-900 dark:text-slate-200 transition-colors duration-500">
        <Toaster position="top-right" richColors />
        <NavbarWrapper user={user} onLogout={() => setIdentity(null as any, false)} />
        
        <Routes>
          {/* Main Terminal Entry */}
          <Route path="/" element={<LandingPage />} />
          
          {/* Public Login Route */}
          <Route path="/login" element={<LoginPage onLogin={(userData) => setIdentity(userData, false)} />} />
          
          {/* VISION-FIRST POS FLOW (PROTECTED) */}
          <Route path="/scan" element={<ProtectedRoute user={user}><CameraScannerPage /></ProtectedRoute>} />
          <Route path="/identity-check" element={<ProtectedRoute user={user}><IdentityCheckPage /></ProtectedRoute>} />
          <Route path="/cart" element={<ProtectedRoute user={user}><CartSummaryPage /></ProtectedRoute>} />
          <Route path="/payment" element={<ProtectedRoute user={user}><PaymentQRISPage /></ProtectedRoute>} />
          <Route path="/verify-receipt" element={<ProtectedRoute user={user}><ReceiptVerificationPage /></ProtectedRoute>} />
          
          {/* Fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </div>
    </Router>
  );
}

// Consistent Navbar across all pages
const NavbarWrapper = ({ user, onLogout }: { user: any; onLogout: () => void }) => {
  return <Navbar user={user} onLogout={onLogout} />;
};

export default App;


