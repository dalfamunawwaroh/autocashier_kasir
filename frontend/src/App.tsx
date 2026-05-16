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



function App() {
  const [isAuthReady, setIsAuthReady] = useState(false);
  const { user } = useAppStore(); // Migrated to Zustand from local useState

  useEffect(() => {
    setIsAuthReady(true);
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
        <NavbarWrapper user={user} onLogout={() => {}} />
        
        <Routes>
          {/* Main Terminal Entry */}
          <Route path="/" element={<LandingPage />} />
          
          {/* VISION-FIRST POS FLOW */}
          <Route path="/scan" element={<CameraScannerPage />} />
          <Route path="/identity-check" element={<IdentityCheckPage />} />
          <Route path="/cart" element={<CartSummaryPage />} />
          <Route path="/payment" element={<PaymentQRISPage />} />
          <Route path="/verify-receipt" element={<ReceiptVerificationPage />} />
          
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


