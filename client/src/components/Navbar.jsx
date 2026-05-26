import React, { useContext } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { LogOut, Layout, Sun, Moon } from 'lucide-react';
import { AuthContext } from '../context/AuthContext';
import { ThemeContext } from '../context/ThemeContext';

const Navbar = () => {
  const { user, logout } = useContext(AuthContext);
  const { theme, toggleTheme } = useContext(ThemeContext);
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <nav className="navbar">
      <div className="container flex items-center justify-between">
        <Link to="/" className="logo">
          <Layout className="w-6 h-6 text-indigo-500" />
          <span>WorkflowManager</span>
        </Link>
        
        <div className="nav-links flex items-center" style={{ gap: '1rem' }}>
          <button onClick={toggleTheme} className="icon-btn" title="Toggle Theme" style={{ marginRight: '0.5rem' }}>
            {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
          </button>
          
          {user ? (
            <>
              {(user.roles?.includes('admin') || user.role === 'admin') && (
                <>
                  <Link to="/inventory" style={{ fontSize: '0.875rem', fontWeight: 500, marginRight: '0.5rem' }}>Inventory</Link>
                  <Link to="/admin/tasks" style={{ fontSize: '0.875rem', fontWeight: 500, marginRight: '0.5rem' }}>Tasks</Link>
                  <Link to="/admin/batches" style={{ fontSize: '0.875rem', fontWeight: 500, marginRight: '0.5rem' }}>Batches</Link>
                  <Link to="/admin/users" style={{ fontSize: '0.875rem', fontWeight: 500, marginRight: '0.5rem' }}>Team</Link>
                  <Link to="/analytics" style={{ fontSize: '0.875rem', fontWeight: 500, marginRight: '0.5rem' }}>Analytics</Link>
                </>
              )}
              <Link to="/dashboard" style={{ fontSize: '0.875rem', fontWeight: 500, marginRight: '1rem' }}>Dashboard</Link>
              <Link to="/profile" style={{ color: 'var(--text-secondary)', marginRight: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.25rem', fontSize: '0.875rem' }} title="Account Settings">
                Welcome, <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{user.name}</span>
              </Link>
              <button onClick={handleLogout} className="icon-btn" title="Logout">
                <LogOut size={20} />
              </button>
            </>
          ) : (
            <Link to="/login" className="btn-primary">Login</Link>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
