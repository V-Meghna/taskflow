import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Sun, Moon, ArrowRight, Eye, EyeOff, AlertCircle, Zap, Globe } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';

const EMAIL_REGEX = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

// Demo credentials for judges
const DEMO_ACCOUNTS = [
  { label: 'Admin Account', email: 'admin@taskflow.demo', password: 'admin123', role: 'admin', color: 'var(--purple)' },
  { label: 'Member Account', email: 'member@taskflow.demo', password: 'member123', role: 'member', color: 'var(--accent)' },
];

export default function Login() {
  const [form, setForm]             = useState({ email:'', password:'' });
  const [showPassword, setShowPassword] = useState(false);
  const [emailError, setEmailError] = useState('');
  const [error, setError]           = useState('');
  const [loading, setLoading]       = useState(false);
  const [mode, setMode]             = useState(() => localStorage.getItem('tf_mode') || 'demo');
  const { login }                   = useAuth();
  const { theme, toggleTheme }      = useTheme();
  const navigate                    = useNavigate();

  const handleModeSwitch = (m) => {
    setMode(m);
    localStorage.setItem('tf_mode', m);
    setForm({ email:'', password:'' });
    setEmailError('');
    setError('');
  };

  const handleEmailBlur = () => {
    if (mode === 'real' && form.email && !EMAIL_REGEX.test(form.email)) {
      setEmailError('Please enter a valid email address (e.g. name@company.com)');
    } else {
      setEmailError('');
    }
  };

  const handleEmailChange = (e) => {
    setForm({ ...form, email: e.target.value });
    if (emailError) setEmailError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (mode === 'real' && !EMAIL_REGEX.test(form.email)) {
      setEmailError('Please enter a valid email address');
      return;
    }
    setError(''); setLoading(true);
    try {
      await login(form.email, form.password);
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.error || 'Invalid credentials');
    } finally {
      setLoading(false);
    }
  };

  const fillDemo = (account) => {
    setForm({ email: account.email, password: account.password });
    setEmailError('');
    setError('');
  };

  return (
    <div className="auth-page">
      <div className="auth-bg" />
      <div className="auth-card">
        <button className="auth-theme-btn" onClick={toggleTheme} title="Toggle theme">
          {theme === 'dark' ? <Sun size={14}/> : <Moon size={14}/>}
        </button>

        {/* Logo */}
        <div className="auth-header">
          <div className="auth-logo">
            <div className="topnav-logo-mark" style={{ width:32, height:32 }}>TF</div>
            <span style={{ fontWeight:700, fontSize:18, letterSpacing:'-0.03em', color:'var(--text-primary)' }}>TaskFlow</span>
          </div>
          <div className="auth-title">Sign in to your account</div>
          <div className="auth-subtitle">Welcome back — enter your credentials to continue</div>
        </div>

        {/* Mode switcher */}
        <div style={{ display:'flex', gap:0, background:'var(--bg-elevated)', border:'1px solid var(--border)', borderRadius:8, padding:4, marginBottom:20 }}>
          {[
            { key:'demo', label:'Demo Mode', icon:<Zap size={13}/>, desc:'For judges & presentations' },
            { key:'real', label:'Real World', icon:<Globe size={13}/>, desc:'For actual use' },
          ].map(m => (
            <button
              key={m.key}
              type="button"
              onClick={() => handleModeSwitch(m.key)}
              style={{
                flex:1, display:'flex', flexDirection:'column', alignItems:'center',
                gap:2, padding:'8px 10px', borderRadius:6, border:'none',
                cursor:'pointer', transition:'all 0.15s', fontFamily:'inherit',
                background: mode===m.key ? 'var(--bg-card)' : 'transparent',
                boxShadow: mode===m.key ? 'var(--shadow-sm)' : 'none',
                borderColor: mode===m.key ? 'var(--border)' : 'transparent',
              }}
            >
              <div style={{ display:'flex', alignItems:'center', gap:5, fontSize:12, fontWeight:600,
                color: mode===m.key ? (m.key==='demo' ? 'var(--yellow)' : 'var(--accent-hover)') : 'var(--text-muted)' }}>
                {m.icon} {m.label}
              </div>
              <div style={{ fontSize:10, color:'var(--text-muted)' }}>{m.desc}</div>
            </button>
          ))}
        </div>

        {/* Demo quick-fill buttons */}
        {mode === 'demo' && (
          <div style={{ marginBottom:16 }}>
            <div style={{ fontSize:11, fontWeight:600, color:'var(--text-muted)', textTransform:'uppercase', letterSpacing:'0.05em', marginBottom:8 }}>
              Quick fill credentials
            </div>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:8 }}>
              {DEMO_ACCOUNTS.map(acc => (
                <button
                  key={acc.email}
                  type="button"
                  onClick={() => fillDemo(acc)}
                  style={{
                    padding:'10px 12px', borderRadius:8,
                    border:`1px solid ${form.email===acc.email ? acc.color : 'var(--border)'}`,
                    background: form.email===acc.email ? `${acc.color}15` : 'var(--bg-elevated)',
                    cursor:'pointer', transition:'all 0.15s', fontFamily:'inherit',
                    textAlign:'left',
                  }}
                >
                  <div style={{ fontSize:12, fontWeight:700, color: acc.color, marginBottom:3 }}>{acc.label}</div>
                  <div style={{ fontSize:10, color:'var(--text-muted)', fontFamily:'monospace' }}>{acc.email}</div>
                  <div style={{ fontSize:10, color:'var(--text-muted)', fontFamily:'monospace' }}>pw: {acc.password}</div>
                </button>
              ))}
            </div>
            <div style={{ fontSize:11, color:'var(--text-muted)', marginTop:8, padding:'6px 10px', background:'var(--yellow-subtle)', borderRadius:6, border:'1px solid var(--yellow-border)' }}>
              💡 Click a card above to auto-fill credentials, then click Sign in
            </div>
          </div>
        )}

        {error && (
          <div className="alert alert-error">
            <AlertCircle size={14} style={{ flexShrink:0 }}/> {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Email address</label>
            <input
              className="form-input"
              type="text"
              placeholder={mode==='demo' ? 'admin@taskflow.demo' : 'you@company.com'}
              value={form.email}
              onChange={handleEmailChange}
              onBlur={handleEmailBlur}
              style={{ borderColor: emailError ? 'var(--red)' : undefined }}
              required
            />
            {emailError && (
              <div style={{ display:'flex', alignItems:'center', gap:5, marginTop:5, fontSize:12, color:'var(--red)' }}>
                <AlertCircle size={12}/> {emailError}
              </div>
            )}
          </div>

          <div className="form-group">
            <label className="form-label">Password</label>
            <div style={{ position:'relative' }}>
              <input
                className="form-input"
                type={showPassword ? 'text' : 'password'}
                placeholder={mode==='demo' ? 'admin123' : '••••••••'}
                value={form.password}
                onChange={e => setForm({...form, password:e.target.value})}
                style={{ paddingRight:40 }}
                required
              />
              <button type="button" onClick={() => setShowPassword(!showPassword)}
                style={{ position:'absolute', right:10, top:'50%', transform:'translateY(-50%)', background:'none', border:'none', cursor:'pointer', padding:4, color:'var(--text-muted)', display:'flex', alignItems:'center' }}>
                {showPassword ? <EyeOff size={15}/> : <Eye size={15}/>}
              </button>
            </div>
          </div>

          <button className="btn btn-primary w-full" type="submit" disabled={loading || !!emailError}
            style={{ justifyContent:'center', height:38, marginTop:4 }}>
            {loading ? <span className="spinner"/> : <><span>Sign in</span><ArrowRight size={14}/></>}
          </button>
        </form>

        <div className="auth-footer">
          Don't have an account? <Link to="/signup">Create one</Link>
        </div>
      </div>
    </div>
  );
}
