import { useState } from 'react';
import { Search, Sun, Moon, Bell, Plus, ChevronDown } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { Avatar } from './Avatar';

export default function TopNav() {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const [showUser, setShowUser] = useState(false);
  const navigate = useNavigate();

  const handleLogout = () => { logout(); navigate('/login'); };

  return (
    <header className="topnav">
      <Link to="/" className="topnav-logo">
        <div className="topnav-logo-mark">TF</div>
        <span className="topnav-logo-text">TaskFlow</span>
      </Link>

      <div className="topnav-divider" />

      <div className="topnav-search">
        <Search size={13} />
        <input placeholder="Search tasks, projects…" />
        <span style={{ fontSize:10, color:'var(--text-muted)', background:'var(--bg-hover)', border:'1px solid var(--border)', padding:'1px 5px', borderRadius:4, whiteSpace:'nowrap' }}>⌘K</span>
      </div>

      <div className="topnav-actions">
        {/* Theme Toggle */}
        <button className="theme-toggle" onClick={toggleTheme} title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}>
          {theme === 'dark' ? <Sun size={15} /> : <Moon size={15} />}
        </button>

        {/* Create button */}
        <button className="btn btn-primary btn-sm" onClick={() => navigate('/projects')} style={{ gap:4 }}>
          <Plus size={13} /> Create
        </button>

        <div className="topnav-divider" />

        {/* User menu */}
        <div className="dropdown">
          <div style={{ display:'flex', alignItems:'center', gap:6, cursor:'pointer', padding:'4px 6px', borderRadius:6, transition:'background 0.12s' }}
            onClick={() => setShowUser(!showUser)}
            onMouseEnter={e => e.currentTarget.style.background='var(--bg-hover)'}
            onMouseLeave={e => e.currentTarget.style.background='transparent'}>
            <Avatar avatarData={user?.avatar} name={user?.name} size="avatar-sm" />
            <span style={{ fontSize:12, fontWeight:500, color:'var(--text-primary)', maxWidth:100, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{user?.name?.split(' ')[0]}</span>
            <ChevronDown size={12} style={{ color:'var(--text-muted)' }} />
          </div>

          {showUser && (
            <>
              <div style={{ position:'fixed', inset:0, zIndex:199 }} onClick={() => setShowUser(false)} />
              <div className="dropdown-menu" style={{ zIndex:200 }}>
                <div style={{ padding:'10px 14px', borderBottom:'1px solid var(--border-muted)' }}>
                  <div style={{ fontSize:13, fontWeight:600, color:'var(--text-primary)' }}>{user?.name}</div>
                  <div style={{ fontSize:11, color:'var(--text-muted)' }}>{user?.email}</div>
                </div>
                <button className="dropdown-item danger" onClick={handleLogout}>Sign out</button>
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
