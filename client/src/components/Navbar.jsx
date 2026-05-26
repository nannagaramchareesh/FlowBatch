import React, { useContext, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { LogOut, Layout, Sun, Moon, Menu, X } from 'lucide-react';
import { AuthContext } from '../context/AuthContext';
import { ThemeContext } from '../context/ThemeContext';

const Navbar = () => {
  const { user, logout } = useContext(AuthContext);
  const { theme, toggleTheme } = useContext(ThemeContext);
  const [isOpen, setIsOpen] = useState(false);
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    setIsOpen(false);
    navigate('/login');
  };

  return (
    <nav className="navbar">
      <div className="container flex items-center justify-between" style={{ position: 'relative' }}>
        <Link to="/" className="logo" onClick={() => setIsOpen(false)}>
          <Layout className="w-6 h-6 text-indigo-500" />
          <span>FlowBatch</span>
        </Link>
        
        {/* Toggle & Hamburger buttons container */}
        <div className="flex items-center" style={{ gap: '0.5rem' }}>
          <button onClick={toggleTheme} className="icon-btn" title="Toggle Theme">
            {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
          </button>
          
          {user && (
            <button 
              onClick={() => setIsOpen(!isOpen)} 
              className="icon-btn mobile-menu-toggle" 
              style={{ display: 'none' }}
              title="Toggle Menu"
            >
              {isOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          )}
        </div>
        
        {/* Links container */}
        <div className={`nav-links flex items-center ${isOpen ? 'show' : ''}`} style={{ gap: '1rem' }}>
          {user ? (
            <>
              {(user.roles?.includes('admin') || user.role === 'admin') && (
                <>
                  <Link to="/inventory" onClick={() => setIsOpen(false)} style={{ fontSize: '0.875rem', fontWeight: 500, marginRight: '0.5rem' }}>Inventory</Link>
                  <Link to="/admin/tasks" onClick={() => setIsOpen(false)} style={{ fontSize: '0.875rem', fontWeight: 500, marginRight: '0.5rem' }}>Tasks</Link>
                  <Link to="/admin/batches" onClick={() => setIsOpen(false)} style={{ fontSize: '0.875rem', fontWeight: 500, marginRight: '0.5rem' }}>Batches</Link>
                  <Link to="/admin/users" onClick={() => setIsOpen(false)} style={{ fontSize: '0.875rem', fontWeight: 500, marginRight: '0.5rem' }}>Team</Link>
                  <Link to="/analytics" onClick={() => setIsOpen(false)} style={{ fontSize: '0.875rem', fontWeight: 500, marginRight: '0.5rem' }}>Analytics</Link>
                </>
              )}
              <Link to="/dashboard" onClick={() => setIsOpen(false)} style={{ fontSize: '0.875rem', fontWeight: 500, marginRight: '1rem' }}>Dashboard</Link>
              <Link to="/profile" onClick={() => setIsOpen(false)} style={{ color: 'var(--text-secondary)', marginRight: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.25rem', fontSize: '0.875rem' }} title="Account Settings">
                Welcome, <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{user.name}</span>
              </Link>
              <button onClick={handleLogout} className="icon-btn logout-btn" title="Logout">
                <LogOut size={20} />
                <span className="logout-text" style={{ display: 'none', marginLeft: '0.5rem' }}>Logout</span>
              </button>
            </>
          ) : (
            <Link to="/login" className="btn-primary" onClick={() => setIsOpen(false)}>Login</Link>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
