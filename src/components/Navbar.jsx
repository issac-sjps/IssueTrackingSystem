// src/components/Navbar.jsx
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../lib/AuthContext';

export default function Navbar() {
  const { isAdmin, user, logout } = useAuth();
  const loc = useLocation();

  const isActive = (path) => loc.pathname === path;

  return (
    <nav style={{
      background: 'var(--bg2)',
      borderBottom: '1px solid var(--border)',
      position: 'sticky', top: 0, zIndex: 100,
    }}>
      <div style={{
        maxWidth: 1200, margin: '0 auto',
        padding: '0 24px',
        height: 58,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      }}>
        {/* Logo */}
        <Link to="/" style={{
          textDecoration: 'none',
          display: 'flex', alignItems: 'center', gap: 10,
        }}>
          <div style={{
            width: 30, height: 30,
            background: 'var(--accent)',
            borderRadius: 8,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 14,
          }}>📋</div>
          <span style={{
            fontFamily: 'var(--font-mono)',
            fontSize: 15, fontWeight: 700,
            color: 'var(--text)',
            letterSpacing: '0.5px',
          }}>回報系統</span>
        </Link>

        {/* Nav links */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <NavLink to="/" active={isActive('/')}>首頁</NavLink>
          <NavLink to="/report" active={isActive('/report')}>提交回報</NavLink>
          {isAdmin && (
            <>
              <NavLink to="/admin" active={isActive('/admin')}>後台管理</NavLink>
              <button className="btn btn-ghost" style={{ fontSize: 13, padding: '6px 12px' }} onClick={logout}>
                登出
              </button>
            </>
          )}
          {!user && (
            <Link to="/admin/login" style={{
              fontSize: 12, color: 'var(--text3)',
              textDecoration: 'none', marginLeft: 8,
            }}>管理員</Link>
          )}
        </div>
      </div>
    </nav>
  );
}

function NavLink({ to, active, children }) {
  return (
    <Link to={to} style={{
      padding: '6px 14px', borderRadius: 'var(--radius-sm)',
      textDecoration: 'none', fontSize: 14, fontWeight: 500,
      color: active ? 'var(--accent)' : 'var(--text2)',
      background: active ? 'rgba(79,140,255,0.1)' : 'transparent',
      transition: 'all 0.15s',
    }}>
      {children}
    </Link>
  );
}
