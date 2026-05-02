import { useState, useEffect } from 'react';
import { Shield, UserCheck, Copy, Check, Users } from 'lucide-react';
import api from '../utils/api';
import { useAuth } from '../context/AuthContext';
import { Avatar } from '../components/Avatar';

export default function Team() {
  const { user } = useAuth();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  useEffect(() => { api.get('/auth/users').then(r => setUsers(r.data.users)).finally(() => setLoading(false)); }, []);

  const copyLink = () => {
    navigator.clipboard.writeText(`${window.location.origin}/signup`);
    setCopied(true); setTimeout(() => setCopied(false), 2000);
  };

  if (loading) return <div className="loading-page"><div className="spinner"/></div>;

  const admins  = users.filter(u => u.role==='admin');
  const members = users.filter(u => u.role==='member');

  return (
    <div>
      <div className="page-header">
        <div>
          <div className="page-title">Team Members</div>
          <div className="page-subtitle">{users.length} members in your workspace</div>
        </div>
      </div>

      {/* Stats */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:12, marginBottom:24 }}>
        {[
          { label:'Total', value:users.length, icon:<Users size={16}/>, color:'blue' },
          { label:'Admins', value:admins.length, icon:<Shield size={16}/>, color:'purple' },
          { label:'Members', value:members.length, icon:<UserCheck size={16}/>, color:'green' },
        ].map((s,i) => (
          <div key={i} className="stat-card">
            <div className="stat-card-top">
              <div className={`stat-icon ${s.color}`}>{s.icon}</div>
              <div className="stat-value" style={{ fontSize:24 }}>{s.value}</div>
            </div>
            <div className="stat-label">{s.label}</div>
          </div>
        ))}
      </div>

      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:16, marginBottom:20 }}>
        <div className="card">
          <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:16 }}>
            <div className="stat-icon purple" style={{ width:28, height:28 }}><Shield size={14}/></div>
            <div className="section-title">Administrators</div>
            <span style={{ marginLeft:'auto' }} className="role-badge admin">{admins.length}</span>
          </div>
          {admins.map(u => (
            <div key={u.id} className="member-row">
              <Avatar avatarData={u.avatar} name={u.name} size="avatar-lg"/>
              <div style={{ flex:1 }}>
                <div style={{ fontWeight:600, fontSize:14 }}>
                  {u.name}{u.id===user.id && <span style={{ color:'var(--accent-hover)', fontSize:11, marginLeft:6 }}>you</span>}
                </div>
                <div style={{ fontSize:12, color:'var(--text-muted)' }}>{u.email}</div>
              </div>
              <span className="role-badge admin">Admin</span>
            </div>
          ))}
          {admins.length===0 && <div style={{ fontSize:13, color:'var(--text-muted)', padding:'12px 0' }}>No admins</div>}
        </div>

        <div className="card">
          <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:16 }}>
            <div className="stat-icon green" style={{ width:28, height:28 }}><UserCheck size={14}/></div>
            <div className="section-title">Members</div>
            <span style={{ marginLeft:'auto' }} className="role-badge member">{members.length}</span>
          </div>
          {members.map(u => (
            <div key={u.id} className="member-row">
              <Avatar avatarData={u.avatar} name={u.name} size="avatar-lg"/>
              <div style={{ flex:1 }}>
                <div style={{ fontWeight:600, fontSize:14 }}>
                  {u.name}{u.id===user.id && <span style={{ color:'var(--green)', fontSize:11, marginLeft:6 }}>you</span>}
                </div>
                <div style={{ fontSize:12, color:'var(--text-muted)' }}>{u.email}</div>
              </div>
              <span className="role-badge member">Member</span>
            </div>
          ))}
          {members.length===0 && <div style={{ fontSize:13, color:'var(--text-muted)', padding:'12px 0' }}>No members yet</div>}
        </div>
      </div>

      {/* Invite */}
      <div className="card">
        <div className="section-title" style={{ marginBottom:6 }}>Invite people to TaskFlow</div>
        <div style={{ fontSize:13, color:'var(--text-secondary)', marginBottom:14, lineHeight:1.6 }}>
          Share this signup link with your teammates. After they register, you can add them to any project by email.
        </div>
        <div style={{ display:'flex', gap:8, alignItems:'center' }}>
          <div style={{ flex:1, background:'var(--bg-elevated)', border:'1px solid var(--border)', borderRadius:6, padding:'8px 12px', fontFamily:"'JetBrains Mono', monospace", fontSize:12, color:'var(--text-link)' }}>
            {window.location.origin}/signup
          </div>
          <button className="btn btn-secondary btn-sm" onClick={copyLink}>
            {copied ? <><Check size={13} style={{ color:'var(--green)' }}/> Copied!</> : <><Copy size={13}/> Copy link</>}
          </button>
        </div>
      </div>
    </div>
  );
}
