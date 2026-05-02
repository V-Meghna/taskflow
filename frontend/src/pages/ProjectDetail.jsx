import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Plus, UserPlus, ArrowLeft, Trash2, LayoutGrid, List, Users, X, ChevronDown, Settings } from 'lucide-react';
import api from '../utils/api';
import { useAuth } from '../context/AuthContext';
import { Avatar, formatDate, formatDateShort } from '../components/Avatar';
import TaskModal from '../components/TaskModal';

const COLS = [
  { key:'todo',        label:'To Do',      cls:'col-todo' },
  { key:'in_progress', label:'In Progress', cls:'col-progress' },
  { key:'review',      label:'In Review',   cls:'col-review' },
  { key:'done',        label:'Done',        cls:'col-done' },
];

const PRIORITY_ICONS = { critical:'🔴', high:'🟠', medium:'🟡', low:'🟢' };

export default function ProjectDetail() {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [project, setProject] = useState(null);
  const [members, setMembers] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('board');
  const [selectedTask, setSelectedTask] = useState(null);
  const [showNewTask, setShowNewTask] = useState(false);
  const [showAddMember, setShowAddMember] = useState(false);
  const [newTaskStatus, setNewTaskStatus] = useState('todo');
  const [filterAssignee, setFilterAssignee] = useState('');
  const [filterPriority, setFilterPriority] = useState('');

  useEffect(() => {
    Promise.all([api.get(`/projects/${id}`), api.get(`/projects/${id}/tasks`)])
      .then(([p,t]) => { setProject(p.data.project); setMembers(p.data.members); setTasks(t.data.tasks); })
      .finally(() => setLoading(false));
  }, [id]);

  const isAdmin = user.role==='admin' || project?.owner_id===user.id || members.find(m=>m.id===user.id)?.role==='admin';
  const handleTaskUpdated = u => { setTasks(tasks.map(t => t.id===u.id ? u : t)); setSelectedTask(u); };
  const handleTaskDeleted = tid => { setTasks(tasks.filter(t => t.id!==tid)); setSelectedTask(null); };
  const handleDelete = async () => {
    if (!confirm(`Delete "${project.name}"?`)) return;
    await api.delete(`/projects/${id}`); navigate('/projects');
  };

  if (loading) return <div className="loading-page"><div className="spinner"/></div>;
  if (!project) return <div>Not found</div>;

  const filterTasks = (arr) => arr
    .filter(t => !filterAssignee || t.assignee_id == filterAssignee)
    .filter(t => !filterPriority || t.priority === filterPriority);

  const overdue = tasks.filter(t => t.deadline && new Date(t.deadline) < new Date() && t.status !== 'done');
  const progress = tasks.length > 0 ? Math.round((tasks.filter(t=>t.status==='done').length / tasks.length)*100) : 0;

  return (
    <div>
      {/* Header */}
      <div className="page-header">
        <div>
          <div className="breadcrumb">
            <Link to="/projects">Projects</Link>
            <span className="breadcrumb-sep">/</span>
            <span>{project.name}</span>
          </div>
          <div style={{ display:'flex', alignItems:'center', gap:10, flexWrap:'wrap' }}>
            <div className="page-title">{project.name}</div>
            <span className={`project-status-badge status-${project.status}`}>{project.status}</span>
          </div>
          {project.description && <div className="page-subtitle">{project.description}</div>}
          <div style={{ display:'flex', alignItems:'center', gap:12, marginTop:8 }}>
            <div style={{ flex:1, maxWidth:180 }}>
              <div className="progress-bar" style={{ height:4, margin:0 }}>
                <div className="progress-fill" style={{ width:`${progress}%` }}/>
              </div>
            </div>
            <span style={{ fontSize:12, color:'var(--text-muted)' }}>{progress}% · {tasks.filter(t=>t.status==='done').length}/{tasks.length} tasks</span>
            {project.deadline && <span style={{ fontSize:12, color:'var(--text-muted)' }}>Due {formatDateShort(project.deadline)}</span>}
          </div>
        </div>
        <div style={{ display:'flex', gap:8, flexWrap:'wrap' }}>
          {isAdmin && <button className="btn btn-secondary btn-sm" onClick={() => setShowAddMember(true)}><UserPlus size={13}/> Add member</button>}
          <button className="btn btn-primary btn-sm" onClick={() => setShowNewTask(true)}><Plus size={13}/> Create issue</button>
          {isAdmin && <button className="btn btn-danger btn-icon" onClick={handleDelete} title="Delete project" style={{ width:30, height:30 }}><Trash2 size={13}/></button>}
        </div>
      </div>

      {overdue.length > 0 && (
        <div className="alert alert-error" style={{ marginBottom:16 }}>
          ⚠️ <strong>{overdue.length} overdue issue{overdue.length>1?'s':''}</strong> — requires immediate attention
        </div>
      )}

      {/* Toolbar */}
      <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:16, flexWrap:'wrap' }}>
        <div className="tabs" style={{ marginBottom:0 }}>
          <button className={`tab ${tab==='board'?'active':''}`} onClick={() => setTab('board')}>
            <LayoutGrid size={13}/> Board
          </button>
          <button className={`tab ${tab==='list'?'active':''}`} onClick={() => setTab('list')}>
            <List size={13}/> Backlog
          </button>
          <button className={`tab ${tab==='members'?'active':''}`} onClick={() => setTab('members')}>
            <Users size={13}/> Team <span className="tab-count">{members.length}</span>
          </button>
        </div>

        {/* Filters */}
        <div style={{ display:'flex', gap:6, marginLeft:'auto' }}>
          <select className="form-select" style={{ width:'auto', padding:'5px 10px', fontSize:12 }}
            value={filterAssignee} onChange={e => setFilterAssignee(e.target.value)}>
            <option value="">All assignees</option>
            {members.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
          </select>
          <select className="form-select" style={{ width:'auto', padding:'5px 10px', fontSize:12 }}
            value={filterPriority} onChange={e => setFilterPriority(e.target.value)}>
            <option value="">All priorities</option>
            <option value="critical">Critical</option>
            <option value="high">High</option>
            <option value="medium">Medium</option>
            <option value="low">Low</option>
          </select>
        </div>
      </div>

      {/* BOARD */}
      {tab === 'board' && (
        <div className="board-wrapper">
          <div className="board">
            {COLS.map(col => {
              const colTasks = filterTasks(tasks.filter(t => t.status===col.key));
              return (
                <div key={col.key} className={`board-col ${col.cls}`}>
                  <div className="board-col-header">
                    <div className="col-dot"/>
                    <div className="board-col-title">{col.label}</div>
                    <div className="board-col-count">{colTasks.length}</div>
                  </div>
                  <div className="board-cards">
                    {colTasks.length === 0 && (
                      <div className="board-empty" onClick={() => { setNewTaskStatus(col.key); setShowNewTask(true); }}>
                        + Create issue
                      </div>
                    )}
                    {colTasks.map(task => (
                      <div key={task.id} className="task-card" onClick={() => setSelectedTask(task)}>
                        <div className="task-card-key">TF-{task.id}</div>
                        <div className="task-card-title">{task.title}</div>
                        <div className="task-card-footer">
                          <span className={`priority priority-${task.priority}`}>
                            {PRIORITY_ICONS[task.priority]} {task.priority}
                          </span>
                          {task.deadline && (
                            <span className={`deadline ${new Date(task.deadline)<new Date() && task.status!=='done'?'overdue':''}`}>
                              {formatDateShort(task.deadline)}
                            </span>
                          )}
                          {task.assignee_name && (
                            <div className="task-card-assignee">
                              <Avatar avatarData={task.assignee_avatar} name={task.assignee_name} size="avatar-sm" title={task.assignee_name}/>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                  <button className="board-add-btn" onClick={() => { setNewTaskStatus(col.key); setShowNewTask(true); }}>
                    <Plus size={13}/> Create issue
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* BACKLOG LIST */}
      {tab === 'list' && (
        <div className="table-wrap">
          <table>
            <thead>
              <tr><th>Key</th><th>Summary</th><th>Status</th><th>Priority</th><th>Assignee</th><th>Due date</th></tr>
            </thead>
            <tbody>
              {filterTasks(tasks).length === 0 ? (
                <tr><td colSpan={6} style={{ textAlign:'center', color:'var(--text-muted)', padding:48 }}>No issues found</td></tr>
              ) : filterTasks(tasks).map(task => (
                <tr key={task.id} onClick={() => setSelectedTask(task)}>
                  <td><span className="code-text">TF-{task.id}</span></td>
                  <td>
                    <div style={{ fontWeight:500 }}>{task.title}</div>
                    {task.description && <div style={{ fontSize:12, color:'var(--text-muted)', marginTop:2 }}>{task.description.slice(0,60)}{task.description.length>60?'…':''}</div>}
                  </td>
                  <td><span className={`status-badge status-${task.status}`}>{task.status.replace('_',' ')}</span></td>
                  <td><span className={`priority priority-${task.priority}`}>{PRIORITY_ICONS[task.priority]} {task.priority}</span></td>
                  <td>
                    {task.assignee_name ? (
                      <div style={{ display:'flex', alignItems:'center', gap:6 }}>
                        <Avatar avatarData={task.assignee_avatar} name={task.assignee_name} size="avatar-sm"/>
                        <span>{task.assignee_name}</span>
                      </div>
                    ) : <span style={{ color:'var(--text-muted)' }}>—</span>}
                  </td>
                  <td>
                    {task.deadline ? (
                      <span className={`deadline ${new Date(task.deadline)<new Date()&&task.status!=='done'?'overdue':''}`}>{formatDate(task.deadline)}</span>
                    ) : <span style={{ color:'var(--text-muted)' }}>—</span>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* TEAM */}
      {tab === 'members' && (
        <div className="card">
          <div className="section-header">
            <div className="section-title">Team Members</div>
            {isAdmin && <button className="btn btn-secondary btn-sm" onClick={() => setShowAddMember(true)}><UserPlus size={13}/> Add member</button>}
          </div>
          {members.map(m => (
            <div key={m.id} className="member-row">
              <Avatar avatarData={m.avatar} name={m.name} size="avatar-lg"/>
              <div style={{ flex:1 }}>
                <div style={{ fontWeight:600, fontSize:14 }}>{m.name}{m.id===user.id ? <span style={{ color:'var(--accent-hover)', fontSize:11, marginLeft:6, fontWeight:500 }}>(you)</span>:''}</div>
                <div style={{ fontSize:12, color:'var(--text-muted)' }}>{m.email}</div>
              </div>
              <span className={`role-badge ${m.role}`}>{m.role}</span>
              {isAdmin && m.id!==user.id && (
                <button className="btn btn-ghost btn-xs" style={{ color:'var(--red)' }}
                  onClick={async () => { await api.delete(`/projects/${id}/members/${m.id}`); setMembers(members.filter(x=>x.id!==m.id)); }}>
                  Remove
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Modals */}
      {selectedTask && (
        <TaskModal task={selectedTask} projectId={id} members={members}
          onClose={() => setSelectedTask(null)}
          onUpdated={handleTaskUpdated} onDeleted={handleTaskDeleted}
          canManage={isAdmin || selectedTask.creator_id===user.id || selectedTask.assignee_id===user.id}/>
      )}
      {showNewTask && (
        <NewTaskModal projectId={id} members={members} defaultStatus={newTaskStatus}
          onClose={() => setShowNewTask(false)}
          onCreated={task => { setTasks([...tasks,task]); setShowNewTask(false); }}/>
      )}
      {showAddMember && (
        <AddMemberModal projectId={id}
          onClose={() => setShowAddMember(false)}
          onAdded={m => { setMembers([...members,m]); setShowAddMember(false); }}/>
      )}
    </div>
  );
}

function NewTaskModal({ projectId, members, defaultStatus, onClose, onCreated }) {
  const [form, setForm] = useState({ title:'', description:'', priority:'medium', status:defaultStatus, assignee_id:'', deadline:'' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault(); setLoading(true); setError('');
    try {
      const payload = { ...form, assignee_id:form.assignee_id||undefined, deadline:form.deadline||undefined };
      const r = await api.post(`/projects/${projectId}/tasks`, payload);
      onCreated(r.data.task);
    } catch (err) { setError(err.response?.data?.error || 'Failed'); }
    finally { setLoading(false); }
  };

  return (
    <div className="modal-overlay" onClick={e => e.target===e.currentTarget && onClose()}>
      <div className="modal">
        <div className="modal-header">
          <div className="modal-title">Create issue</div>
          <button className="btn btn-ghost btn-icon" onClick={onClose}><X size={15}/></button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            {error && <div className="alert alert-error">{error}</div>}
            <div className="form-group">
              <label className="form-label">Summary *</label>
              <input className="form-input" placeholder="What needs to be done?" value={form.title}
                onChange={e => setForm({...form,title:e.target.value})} required autoFocus/>
            </div>
            <div className="form-group">
              <label className="form-label">Description</label>
              <textarea className="form-textarea" placeholder="Add details…" value={form.description}
                onChange={e => setForm({...form,description:e.target.value})}/>
            </div>
            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Issue type / Priority</label>
                <select className="form-select" value={form.priority} onChange={e => setForm({...form,priority:e.target.value})}>
                  <option value="low">🟢 Low</option><option value="medium">🟡 Medium</option>
                  <option value="high">🟠 High</option><option value="critical">🔴 Critical</option>
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Status</label>
                <select className="form-select" value={form.status} onChange={e => setForm({...form,status:e.target.value})}>
                  <option value="todo">To Do</option><option value="in_progress">In Progress</option>
                  <option value="review">In Review</option><option value="done">Done</option>
                </select>
              </div>
            </div>
            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Assignee</label>
                <select className="form-select" value={form.assignee_id} onChange={e => setForm({...form,assignee_id:e.target.value})}>
                  <option value="">Unassigned</option>
                  {members.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Due date</label>
                <input className="form-input" type="date" value={form.deadline} onChange={e => setForm({...form,deadline:e.target.value})}/>
              </div>
            </div>
          </div>
          <div className="modal-footer">
            <button type="button" className="btn btn-ghost" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? <span className="spinner"/> : 'Create issue'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function AddMemberModal({ projectId, onClose, onAdded }) {
  const [email, setEmail] = useState('');
  const [role, setRole] = useState('member');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault(); setLoading(true); setError('');
    try { const r = await api.post(`/projects/${projectId}/members`, { email, role }); onAdded({...r.data.user, role}); }
    catch (err) { setError(err.response?.data?.error || 'Failed'); }
    finally { setLoading(false); }
  };

  return (
    <div className="modal-overlay" onClick={e => e.target===e.currentTarget && onClose()}>
      <div className="modal">
        <div className="modal-header">
          <div className="modal-title">Add team member</div>
          <button className="btn btn-ghost btn-icon" onClick={onClose}><X size={15}/></button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            {error && <div className="alert alert-error">{error}</div>}
            <div className="form-group">
              <label className="form-label">Email address</label>
              <input className="form-input" type="email" placeholder="teammate@company.com"
                value={email} onChange={e => setEmail(e.target.value)} required autoFocus/>
              <div className="form-hint">They must already have a TaskFlow account</div>
            </div>
            <div className="form-group">
              <label className="form-label">Role</label>
              <select className="form-select" value={role} onChange={e => setRole(e.target.value)}>
                <option value="member">Member — can create and manage tasks</option>
                <option value="admin">Admin — full project control</option>
              </select>
            </div>
          </div>
          <div className="modal-footer">
            <button type="button" className="btn btn-ghost" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? <span className="spinner"/> : 'Add member'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
