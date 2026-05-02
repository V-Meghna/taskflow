import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Sun, Moon, ArrowRight } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';

export default function Login() {
  const [form, setForm] = useState({ email:'', password:'' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault(); setError(''); setLoading(true);
    try { await login(form.email, form.password); navigate('/dashboard'); }
    catch (err) { setError(err.response?.data?.error || 'Invalid credentials'); }
    finally { setLoading(false); }
  };

  return (
    <div className="auth-page">
      <div className="auth-bg" />
      <div className="auth-card">
        <button className="auth-theme-btn" onClick={toggleTheme} title="Toggle theme">
          {theme === 'dark' ? <Sun size={14}/> : <Moon size={14}/>}
        </button>

        <div className="auth-header">
          <div className="auth-logo">
            <div className="topnav-logo-mark" style={{ width:32, height:32 }}>TF</div>
            <span style={{ fontWeight:700, fontSize:18, letterSpacing:'-0.03em', color:'var(--text-primary)' }}>TaskFlow</span>
          </div>
          <div className="auth-title">Sign in to your account</div>
          <div className="auth-subtitle">Welcome back — enter your credentials to continue</div>
        </div>

        {error && <div className="alert alert-error">{error}</div>}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Email address</label>
            <input className="form-input" type="email" placeholder="you@company.com"
              value={form.email} onChange={e => setForm({...form, email:e.target.value})} required />
          </div>
          <div className="form-group">
            <label className="form-label">Password</label>
            <input className="form-input" type="password" placeholder="••••••••"
              value={form.password} onChange={e => setForm({...form, password:e.target.value})} required />
          </div>
          <button className="btn btn-primary w-full" type="submit" disabled={loading}
            style={{ justifyContent:'center', height:38, marginTop:4 }}>
            {loading ? <span className="spinner"/> : <><span>Sign in</span><ArrowRight size={14}/></>}
          </button>
        </form>

        <div className="auth-footer">
          Don't have an account? <Link to="/signup">Create one</Link>
        </div>

        <div style={{ marginTop:20, padding:12, background:'var(--bg-elevated)', borderRadius:6, border:'1px solid var(--border)' }}>
          <div style={{ fontSize:11, fontWeight:600, color:'var(--text-muted)', textTransform:'uppercase', letterSpacing:'0.05em', marginBottom:4 }}>Demo hint</div>
          <div style={{ fontSize:12, color:'var(--text-secondary)', lineHeight:1.5 }}>
            Register with role <strong style={{ color:'var(--accent-hover)' }}>Admin</strong> to access team management, project controls, and all features.
          </div>
        </div>
      </div>
    </div>
  );
}
