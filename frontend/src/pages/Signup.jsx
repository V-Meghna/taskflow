import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Sun, Moon, ArrowRight, Shield, User, Eye, EyeOff, AlertCircle, CheckCircle2, Zap, Globe } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';

const EMAIL_REGEX = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

export default function Signup() {
  const [form, setForm]               = useState({ name:'', email:'', password:'', role:'member' });
  const [showPassword, setShowPassword] = useState(false);
  const [emailError, setEmailError]   = useState('');
  const [passwordStrength, setPasswordStrength] = useState(0);
  const [error, setError]             = useState('');
  const [loading, setLoading]         = useState(false);
  const [mode, setMode]               = useState(() => localStorage.getItem('tf_mode') || 'demo');
  const { signup }                    = useAuth();
  const { theme, toggleTheme }        = useTheme();
  const navigate                      = useNavigate();

  const handleModeSwitch = (m) => {
    setMode(m);
    localStorage.setItem('tf_mode', m);
    setForm({ name:'', email:'', password:'', role:'member' });
    setEmailError('');
    setError('');
    setPasswordStrength(0);
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

  const handlePasswordChange = (e) => {
    const val = e.target.value;
    setForm({ ...form, password: val });
    if (mode === 'real') {
      let s = 0;
      if (val.length >= 6)  s++;
      if (val.length >= 10) s++;
      if (/[A-Z]/.test(val)) s++;
      if (/[0-9]/.test(val)) s++;
      if (/[^A-Za-z0-9]/.test(val)) s++;
      setPasswordStrength(s);
    }
  };

  const getStrengthLabel = () => {
    if (!form.password || mode === 'demo') return null;
    if (passwordStrength <= 1) return { label:'Weak', color:'var(--red)' };
    if (passwordStrength <= 3) return { label:'Medium', color:'var(--yellow)' };
    return { label:'Strong', color:'var(--green)' };
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (mode === 'real' && !EMAIL_REGEX.test(form.email)) {
      setEmailError('Please enter a valid email address');
      return;
    }
    setError(''); setLoading(true);
    try {
      await signup(form.name, form.email, form.password, form.role);
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.errors?.[0]?.msg || err.response?.data?.error || 'Signup failed');
    } finally {
      setLoading(false);
    }
  };

  const strength = getStrengthLabel();

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

        {/* Mode switcher */}
        <div style={{ display:'flex', gap:0, background:'var(--bg-elevated)', border:'1px solid var(--border)', borderRadius:8, padding:4, marginBottom:20 }}>
          {[
            { key:'demo', label:'Demo Mode', icon:<Zap size={13}/>, desc:'For judges & presentations' },
            { key:'real', label:'Real World', icon:<Globe size={13}/>, desc:'For actual use' },
          ].map(m => (
            <button key={m.key} type="button" onClick={() => handleModeSwitch(m.key)}
              style={{
                flex:1, display:'flex', flexDirection:'column', alignItems:'center',
                gap:2, padding:'8px 10px', borderRadius:6, border:'none',
                cursor:'pointer', transition:'all 0.15s', fontFamily:'inherit',
                background: mode===m.key ? 'var(--bg-card)' : 'transparent',
                boxShadow: mode===m.key ? 'var(--shadow-sm)' : 'none',
              }}>
              <div style={{ display:'flex', alignItems:'center', gap:5, fontSize:12, fontWeight:600,
                color: mode===m.key ? (m.key==='demo' ? 'var(--yellow)' : 'var(--accent-hover)') : 'var(--text-muted)' }}>
                {m.icon} {m.label}
              </div>
              <div style={{ fontSize:10, color:'var(--text-muted)' }}>{m.desc}</div>
            </button>
          ))}
        </div>

        {/* Demo mode info */}
        {mode === 'demo' && (
          <div style={{ marginBottom:16, padding:'10px 12px', background:'var(--yellow-subtle)', borderRadius:8, border:'1px solid var(--yellow-border)' }}>
            <div style={{ fontSize:12, fontWeight:600, color:'var(--yellow)', marginBottom:4 }}>⚡ Demo Mode Active</div>
            <div style={{ fontSize:11, color:'var(--text-secondary)', lineHeight:1.6 }}>
              Simple passwords like <code style={{ background:'var(--bg-elevated)', padding:'1px 5px', borderRadius:3, fontSize:11 }}>12345</code> or <code style={{ background:'var(--bg-elevated)', padding:'1px 5px', borderRadius:3, fontSize:11 }}>demo</code> are allowed. Email validation is relaxed for easy demonstrations.
            </div>
          </div>
        )}

        {/* Real mode info */}
        {mode === 'real' && (
          <div style={{ marginBottom:16, padding:'10px 12px', background:'var(--accent-subtle)', borderRadius:8, border:'1px solid var(--accent-border)' }}>
            <div style={{ fontSize:12, fontWeight:600, color:'var(--accent-hover)', marginBottom:4 }}>🌐 Real World Mode</div>
            <div style={{ fontSize:11, color:'var(--text-secondary)', lineHeight:1.6 }}>
              Strict email validation is enabled. Use a real email address and a strong password for security.
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
            <label className="form-label">Full Name</label>
            <input className="form-input" type="text" placeholder="Jane Smith"
              value={form.name} onChange={e => setForm({...form, name:e.target.value})} required />
          </div>

          <div className="form-group">
            <label className="form-label">Email address</label>
            <input
              className="form-input" type="text"
              placeholder={mode==='demo' ? 'any@email or judge@demo' : 'you@company.com'}
              value={form.email}
              onChange={handleEmailChange}
              onBlur={handleEmailBlur}
              style={{ borderColor: emailError ? 'var(--red)' : form.email && !emailError && (mode==='demo' || EMAIL_REGEX.test(form.email)) ? 'var(--green)' : undefined }}
              required
            />
            {emailError && (
              <div style={{ display:'flex', alignItems:'center', gap:5, marginTop:5, fontSize:12, color:'var(--red)' }}>
                <AlertCircle size={12}/> {emailError}
              </div>
            )}
            {form.email && !emailError && mode==='real' && EMAIL_REGEX.test(form.email) && (
              <div style={{ display:'flex', alignItems:'center', gap:5, marginTop:5, fontSize:12, color:'var(--green)' }}>
                <CheckCircle2 size={12}/> Valid email address
              </div>
            )}
          </div>

          <div className="form-group">
            <label className="form-label">Password
              {mode==='demo' && <span style={{ marginLeft:6, fontSize:10, color:'var(--yellow)', fontWeight:600, background:'var(--yellow-subtle)', padding:'1px 6px', borderRadius:3 }}>Simple passwords OK</span>}
            </label>
            <div style={{ position:'relative' }}>
              <input
                className="form-input"
                type={showPassword ? 'text' : 'password'}
                placeholder={mode==='demo' ? 'e.g. 12345 or demo' : 'Min 6 characters'}
                value={form.password}
                onChange={handlePasswordChange}
                style={{ paddingRight:40 }}
                required
                minLength={mode==='demo' ? 1 : 6}
              />
              <button type="button" onClick={() => setShowPassword(!showPassword)}
                style={{ position:'absolute', right:10, top:'50%', transform:'translateY(-50%)', background:'none', border:'none', cursor:'pointer', padding:4, color:'var(--text-muted)', display:'flex', alignItems:'center' }}>
                {showPassword ? <EyeOff size={15}/> : <Eye size={15}/>}
              </button>
            </div>
            {/* Strength bar - only in real mode */}
            {mode==='real' && form.password && (
              <div style={{ marginTop:8 }}>
                <div style={{ display:'flex', gap:4, marginBottom:4 }}>
                  {[1,2,3,4,5].map(i => (
                    <div key={i} style={{ flex:1, height:3, borderRadius:99, background: i<=passwordStrength ? strength?.color : 'var(--border)', transition:'background 0.2s' }}/>
                  ))}
                </div>
                {strength && <div style={{ fontSize:11, color:strength.color, fontWeight:600 }}>{strength.label} password</div>}
              </div>
            )}
          </div>

          {/* Role selector */}
          <div className="form-group">
            <label className="form-label">Account Role</label>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:8 }}>
              {[
                {
                  value:'member', icon:<User size={15}/>, label:'Member',
                  color:'var(--accent)',
                  desc:'Collaborate on tasks and projects',
                  permissions:['View assigned projects','Create & manage own tasks','Add comments & updates','Change task status'],
                  cannotDo:['Cannot delete projects','Cannot manage team'],
                },
                {
                  value:'admin', icon:<Shield size={15}/>, label:'Admin',
                  color:'var(--purple)',
                  desc:'Full control of workspace',
                  permissions:['Everything Members can do','Add/remove team members','Delete any project or task','View all workspace analytics'],
                  cannotDo:[],
                },
              ].map(r => (
                <div key={r.value} onClick={() => setForm({...form, role:r.value})}
                  style={{
                    padding:'12px 14px', borderRadius:8, cursor:'pointer',
                    border:`1px solid ${form.role===r.value ? r.color : 'var(--border)'}`,
                    background: form.role===r.value ? `${r.color}12` : 'var(--bg-elevated)',
                    transition:'all 0.15s', position:'relative',
                  }}>
                  {form.role===r.value && (
                    <div style={{ position:'absolute', top:8, right:8, width:16, height:16, borderRadius:'50%', background:r.color, display:'flex', alignItems:'center', justifyContent:'center' }}>
                      <CheckCircle2 size={10} color="white"/>
                    </div>
                  )}
                  <div style={{ display:'flex', alignItems:'center', gap:6, fontWeight:700, fontSize:13, color:form.role===r.value?r.color:'var(--text-primary)', marginBottom:3 }}>
                    {r.icon} {r.label}
                  </div>
                  <div style={{ fontSize:11, color:'var(--text-muted)', marginBottom:8, lineHeight:1.4 }}>{r.desc}</div>
                  <div style={{ display:'flex', flexDirection:'column', gap:3 }}>
                    {r.permissions.map((p,i) => (
                      <div key={i} style={{ display:'flex', alignItems:'center', gap:5, fontSize:10, color:'var(--text-secondary)' }}>
                        <CheckCircle2 size={9} style={{ color:r.color, flexShrink:0 }}/> {p}
                      </div>
                    ))}
                    {r.cannotDo.map((p,i) => (
                      <div key={i} style={{ display:'flex', alignItems:'center', gap:5, fontSize:10, color:'var(--text-muted)' }}>
                        <div style={{ width:9, height:9, borderRadius:'50%', border:'1px solid var(--border)', flexShrink:0 }}/> {p}
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <button className="btn btn-primary w-full" type="submit" disabled={loading || !!emailError}
            style={{ justifyContent:'center', height:38, marginTop:4 }}>
            {loading ? <span className="spinner"/> : <><span>Create account</span><ArrowRight size={14}/></>}
          </button>
        </form>

        <div className="auth-footer">Already have an account? <Link to="/login">Sign in</Link></div>
      </div>
    </div>
  );
}
