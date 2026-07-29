import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Home from './pages/user/Home';
import Pricing from './pages/user/Pricing';
import Payment from './pages/user/Payment';
import Studio from './pages/user/Studio';
import Editor from './pages/user/Editor';
import AdminLogin from './pages/admin/Login';
import AdminDashboard from './pages/admin/Dashboard';
import ManagePackages from './pages/admin/ManagePackages';
import ManageFrames from './pages/admin/ManageFrames';
import ManageStickers from './pages/admin/ManageStickers';
import ManageSessions from './pages/admin/ManageSessions';

const ProtectedAdminRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const isAuth = localStorage.getItem('admin_auth') === 'true';
  if (!isAuth) {
    return <Navigate to="/admin/login" replace />;
  }
  return <>{children}</>;
};

const App: React.FC = () => {
  return (
    <Router>
      <Routes>
        {/* Rute Pengguna */}
        <Route path="/" element={<Home />} />
        <Route path="/pricing" element={<Pricing />} />
        <Route path="/payment/:packageId" element={<Payment />} />
        <Route path="/studio/:sessionId" element={<Studio />} />
        <Route path="/editor/:sessionId" element={<Editor />} />

        {/* Rute Admin */}
        <Route path="/admin/login" element={<AdminLogin />} />
        <Route 
          path="/admin" 
          element={<ProtectedAdminRoute><AdminDashboard /></ProtectedAdminRoute>} 
        />
        <Route 
          path="/admin/packages" 
          element={<ProtectedAdminRoute><ManagePackages /></ProtectedAdminRoute>} 
        />
        <Route 
          path="/admin/frames" 
          element={<ProtectedAdminRoute><ManageFrames /></ProtectedAdminRoute>} 
        />
        <Route 
          path="/admin/stickers" 
          element={<ProtectedAdminRoute><ManageStickers /></ProtectedAdminRoute>} 
        />
        <Route 
          path="/admin/sessions" 
          element={<ProtectedAdminRoute><ManageSessions /></ProtectedAdminRoute>} 
        />
      </Routes>
    </Router>
  );
};

export default App;
