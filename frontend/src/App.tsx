import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'sonner';
import Navbar from './components/Layout/Navbar';
import LandingPage from './pages/Landing/LandingPage';
import { useAppStore } from './store/useAppStore';
import type { AuthUser } from './store/useAppStore';

// POS Vision Flow Pages
import CameraScannerPage from './pages/POS/CameraScannerPage';
import IdentityCheckPage from './pages/POS/IdentityCheckPage';
import CartSummaryPage from './pages/POS/CartSummaryPage';
import PaymentQRISPage from './pages/POS/PaymentQRISPage';
import ReceiptVerificationPage from './pages/POS/ReceiptVerificationPage';

import LoginPage from './pages/Auth/LoginPage';

/** Redirects unauthenticated users to the login page. */
const ProtectedRoute = ({ children, user }: { children: React.ReactNode; user: any }) => {
  if (!user) {
    return <Navigate to="/login" replace />;
  }
  return <>{children}</>;
};

function App() {
  const { user, setIdentity } = useAppStore();

  useEffect(() => {
    // Auto-fetch default branch if not yet cached in localStorage
    if (!localStorage.getItem('autocashier_branch_id')) {
      fetch('/api/branches')
        .then(res => res.json())
        .then(data => {
          if (data.success && data.data.length > 0) {
            const branch = data.data[0];
            localStorage.setItem('autocashier_branch_id', branch.id);
            localStorage.setItem('autocashier_branch_code', branch.code);
            localStorage.setItem('autocashier_branch_name', branch.name);
          }
        })
        .catch(err => console.error('[App] Failed to auto-fetch branches:', err));
    }
  }, []);

  return (
    <Router>
      <div className="min-h-screen bg-mesh text-slate-900 dark:text-slate-200 transition-colors duration-500">
        <Toaster position="top-right" richColors />
        <Navbar user={user} onLogout={() => setIdentity(null as unknown as AuthUser, false)} />

        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/login" element={<LoginPage onLogin={(userData) => setIdentity(userData, false)} />} />

          {/* Protected POS Flow */}
          <Route path="/scan" element={<ProtectedRoute user={user}><CameraScannerPage /></ProtectedRoute>} />
          <Route path="/identity-check" element={<ProtectedRoute user={user}><IdentityCheckPage /></ProtectedRoute>} />
          <Route path="/cart" element={<ProtectedRoute user={user}><CartSummaryPage /></ProtectedRoute>} />
          <Route path="/payment" element={<ProtectedRoute user={user}><PaymentQRISPage /></ProtectedRoute>} />
          <Route path="/verify-receipt" element={<ProtectedRoute user={user}><ReceiptVerificationPage /></ProtectedRoute>} />

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
