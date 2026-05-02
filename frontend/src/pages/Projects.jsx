import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Plus, Search, Layers, CheckCircle2, Users, Calendar } from 'lucide-react';
import api from '../utils/api';
import { formatDateShort } from '../components/Avatar';

const EMOJIS = ['🚀','⚡','🎯','💡','🔥','🌊','🎨','🛠️','📊','🎪','🔮','🦋'];

export default function Projects() {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const navigate = useNavigate();

  useEffect(() => { api.get('/projects').then(r => setProjects(r.data.projects)).finally(() => setLoading(false)); }, []);

  const filtered = projects.filter(p => p.name.toLowerCase().includes(search.toLowerCase()));

  if (loading) return <div className="loading-page"><div className="spinner"/></div>;

  return (
    <div>
      <div className="page-header">
        <div>
          <div className="page-title">Projects</div>
          <div className="page-subtitle">{projects.length} project{projects.length !== 1 ? 's' : ''} in your workspace</div>
        </div>
        <div style={{ display:'flex', gap:8, alignItems:'center' }}>
          <div className="search-wrap">
            <Search size={13}/>
            <input placeholder="Search projects…" value={search} onChange={e => setSearch(e.target.value)}/>
          </div>
          <button className="btn btn-primary" onClick={() => setShowModal(true)}>
            <Plus size={14}/> New project
          </button>
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon"><Layers size={24}/></div>
          <div className="empty-title">{search ? 'No projects found' : 'Create your first project'}</div>
          <div className="empty-text">{search ? 'Try a different search term' : 'Projects help you organize work and collaborate with your team'}</div>
          {!search && <button className="btn btn-primary" style={{ margin:'0 auto', display:'inline-flex' }} onClick={() => setShowModal(true)}><Plus size={14}/> New project</button>}
        </div>
      ) : (
        <div className="projects-grid">
          {filtered.map((p, i) => {
            const progress = p.task_count > 0 ? Math.round((p.done_count / p.task_count) * 100) : 0;
            return (
              <Link key={p.id} to={`/projects/${p.id}`} className="project-card"
                style={{ animation:`fadeIn 0.25s ease ${i*0.04}s both` }}>
                <div className="project-card-header">
                  <div className="project-avatar">{EMOJIS[p.id % EMOJIS.length]}</div>
                  <div style={{ flex:1, minWidth:0 }}>
                    <div style={{ display:'flex', alignItems:'center', gap:8, flexWrap:'wrap' }}>
                      <div className="project-name">{p.name}</div>
                      <span className={`project-status-badge status-${p.status}`}>{p.status}</span>
                    </div>
                    {p.description && <div className="project-desc">{p.description}</div>}
                  </div>
                </div>

                <div>
                  <div style={{ display:'flex', justifyContent:'space-between', fontSize:11, color:'var(--text-muted)', marginBottom:6 }}>
                    <span>{p.done_count} / {p.task_count} tasks</span>
                    <span style={{ fontWeight:700, color: progress===100?'var(--green)': 'var(--text-secondary)' }}>{progress}%</span>
                  </div>
                  <div className="progress-bar">
                    <div className="progress-fill" style={{ width:`${progress}%` }}/>
                  </div>
                </div>

                <div className="project-meta">
                  <span style={{ display:'flex', alignItems:'center', gap:4 }}><Users size={11}/> {p.member_count}</span>
                  <span style={{ display:'flex', alignItems:'center', gap:4 }}><CheckCircle2 size={11}/> {p.done_count} done</span>
                  {p.deadline && <span style={{ display:'flex', alignItems:'center', gap:4 }}><Calendar size={11}/> {formatDateShort(p.deadline)}</span>}
                  <span style={{ marginLeft:'auto', fontSize:11 }}>by {p.owner_name}</span>
                </div>
              </Link>
            );
          })}
        </div>
      )}

      {showModal && (
        <NewProjectModal
          onClose={() => setShowModal(false)}
          onCreated={p => { setProjects([p,...projects]); setShowModal(false); navigate(`/projects/${p.id}`); }}
        />
      )}
    </div>
  );
}

function NewProjectModal({ onClose, onCreated }) {
  const [form, setForm] = useState({ name:'', description:'', deadline:'' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault(); setLoading(true); setError('');
    try { const r = await api.post('/projects', form); onCreated(r.data.project); }
    catch (err) { setError(err.response?.data?.error || 'Failed to create project'); }
    finally { setLoading(false); }
  };

  return (
    <div className="modal-overlay" onClick={e => e.target===e.currentTarget && onClose()}>
      <div className="modal">
        <div className="modal-header">
          <div className="modal-title">Create project</div>
          <button className="btn btn-ghost btn-icon" onClick={onClose} style={{ color:'var(--text-muted)' }}>✕</button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            {error && <div className="alert alert-error">{error}</div>}
            <div className="form-group">
              <label className="form-label">Project name *</label>
              <input className="form-input" placeholder="e.g. Website Redesign" value={form.name}
                onChange={e => setForm({...form,name:e.target.value})} required autoFocus/>
            </div>
            <div className="form-group">
              <label className="form-label">Description</label>
              <textarea className="form-textarea" placeholder="What's this project about?" value={form.description}
                onChange={e => setForm({...form,description:e.target.value})}/>
            </div>
            <div className="form-group">
              <label className="form-label">Deadline</label>
              <input className="form-input" type="date" value={form.deadline}
                onChange={e => setForm({...form,deadline:e.target.value})}/>
            </div>
          </div>
          <div className="modal-footer">
            <button type="button" className="btn btn-ghost" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? <span className="spinner"/> : 'Create project'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
