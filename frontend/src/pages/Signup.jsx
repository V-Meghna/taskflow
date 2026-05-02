import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Sun, Moon, ArrowRight, Shield, User } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';

export default function Signup() {
  const [form, setForm] = useState({ name:'', email:'', password:'', role:'member' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { signup } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault(); setError(''); setLoading(true);
    try { await signup(form.name, form.email, form.password, form.role); navigate('/dashboard'); }
    catch (err) { setError(err.response?.data?.errors?.[0]?.msg || err.response?.data?.error || 'Signup failed'); }
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
          <div className="auth-title">Create your account</div>
          <div className="auth-subtitle">Start managing projects with your team</div>
        </div>

        {error && <div className="alert alert-error">{error}</div>}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Full Name</label>
            <input className="form-input" type="text" placeholder="Jane Smith"
              value={form.name} onChange={e => setForm({...form, name:e.target.value})} required />
          </div>
          <div className="form-group">
            <label className="form-label">Email address</label>
            <input className="form-input" type="email" placeholder="you@company.com"
              value={form.email} onChange={e => setForm({...form, email:e.target.value})} required />
          </div>
          <div className="form-group">
            <label className="form-label">Password</label>
            <input className="form-input" type="password" placeholder="Minimum 6 characters"
              value={form.password} onChange={e => setForm({...form, password:e.target.value})} required minLength={6} />
          </div>
          <div className="form-group">
            <label className="form-label">Account Role</label>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:8 }}>
              {[
                { value:'member', icon:<User size={14}/>, label:'Member', desc:'Work on assigned tasks' },
                { value:'admin',  icon:<Shield size={14}/>, label:'Admin', desc:'Manage everything' },
              ].map(r => (
                <div key={r.value} onClick={() => setForm({...form, role:r.value})}
                  style={{ padding:'10px 12px', borderRadius:6, cursor:'pointer',
                    border:`1px solid ${form.role===r.value ? 'var(--accent-border)' : 'var(--border)'}`,
                    background: form.role===r.value ? 'var(--accent-subtle)' : 'var(--bg-elevated)',
                    transition:'all 0.12s' }}>
                  <div style={{ display:'flex', alignItems:'center', gap:6, fontWeight:600, fontSize:13,
                    color: form.role===r.value ? 'var(--accent-hover)' : 'var(--text-primary)', marginBottom:2 }}>
                    {r.icon} {r.label}
                  </div>
                  <div style={{ fontSize:11, color:'var(--text-muted)' }}>{r.desc}</div>
                </div>
              ))}
            </div>
          </div>
          <button className="btn btn-primary w-full" type="submit" disabled={loading}
            style={{ justifyContent:'center', height:38, marginTop:4 }}>
            {loading ? <span className="spinner"/> : <><span>Create account</span><ArrowRight size={14}/></>}
          </button>
        </form>

        <div className="auth-footer">Already have an account? <Link to="/login">Sign in</Link></div>
      </div>
    </div>
  );
}
