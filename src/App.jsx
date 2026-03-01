// src/App.jsx
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './lib/AuthContext';
import Navbar from './components/Navbar';
import HomePage from './pages/HomePage';
import ReportPage from './pages/ReportPage';
import AdminPage from './pages/AdminPage';
import AdminLoginPage from './pages/AdminLoginPage';
import ToastProvider from './components/ToastProvider';

function ProtectedRoute({ children }) {
  const { user, loading, isAdmin } = useAuth();
  if (loading) return <div style={{ display:'flex', justifyContent:'center', marginTop:80 }}><div className="spinner" /></div>;
  if (!user || !isAdmin) return <Navigate to="/admin/login" replace />;
  return children;
}

export default function App() {
  return (
    // HashRouter 讓 GitHub Pages 的 SPA 路由正常運作（網址會變成 /#/report 等）
    <HashRouter>
      <ToastProvider>
        <Navbar />
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/report" element={<ReportPage />} />
          <Route path="/admin/login" element={<AdminLoginPage />} />
          <Route path="/admin" element={<ProtectedRoute><AdminPage /></ProtectedRoute>} />
        </Routes>
      </ToastProvider>
    </HashRouter>
  );
}
