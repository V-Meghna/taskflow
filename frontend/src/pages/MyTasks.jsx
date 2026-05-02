import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Calendar, CheckSquare, AlertTriangle, Clock, CheckCircle2, ExternalLink } from 'lucide-react';
import api from '../utils/api';
import { useAuth } from '../context/AuthContext';
import { formatDate } from '../components/Avatar';

const pColor = { low:'priority-low', medium:'priority-medium', high:'priority-high', critical:'priority-critical' };
const sColor = { todo:'status-todo', in_progress:'status-in_progress', review:'status-review', done:'status-done' };
const PICONS = { critical:'🔴', high:'🟠', medium:'🟡', low:'🟢' };

export default function MyTasks() {
  const { user } = useAuth();
  const [allTasks, setAllTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('active');
  const [sortBy, setSortBy] = useState('deadline');

  useEffect(() => {
    api.get('/projects').then(async res => {
      const projects = res.data.projects;
      const results = await Promise.all(projects.map(p =>
        api.get(`/projects/${p.id}/tasks`).then(r => r.data.tasks.map(t => ({...t, project_name:p.name, project_id:p.id})))
      ));
      setAllTasks(results.flat().filter(t => t.assignee_id===user.id || t.creator_id===user.id));
    }).finally(() => setLoading(false));
  }, []);

  const today = new Date();
  const filtered = allTasks.filter(t => {
    if (filter==='active') return t.status !== 'done';
    if (filter==='overdue') return t.deadline && new Date(t.deadline)<today && t.status!=='done';
    if (filter==='done') return t.status === 'done';
    return true;
  }).sort((a,b) => {
    if (sortBy==='deadline') return (a.deadline||'9999') > (b.deadline||'9999') ? 1 : -1;
    if (sortBy==='priority') {
      const order = { critical:0, high:1, medium:2, low:3 };
      return order[a.priority] - order[b.priority];
    }
    return 0;
  });

  const counts = {
    active: allTasks.filter(t=>t.status!=='done').length,
    overdue: allTasks.filter(t=>t.deadline&&new Date(t.deadline)<today&&t.status!=='done').length,
    done: allTasks.filter(t=>t.status==='done').length,
    all: allTasks.length,
  };

  if (loading) return <div className="loading-page"><div className="spinner"/></div>;

  return (
    <div>
      <div className="page-header">
        <div>
          <div className="page-title">My Issues</div>
          <div className="page-subtitle">All issues assigned to or reported by you</div>
        </div>
        <select className="form-select" style={{ width:'auto', fontSize:12 }} value={sortBy} onChange={e => setSortBy(e.target.value)}>
          <option value="deadline">Sort by due date</option>
          <option value="priority">Sort by priority</option>
        </select>
      </div>

      {/* Summary */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:10, marginBottom:20 }}>
        {[
          { key:'active', label:'Active', icon:<Clock size={14}/>, color:'yellow' },
          { key:'overdue', label:'Overdue', icon:<AlertTriangle size={14}/>, color:'red' },
          { key:'done', label:'Done', icon:<CheckCircle2 size={14}/>, color:'green' },
          { key:'all', label:'All Issues', icon:<CheckSquare size={14}/>, color:'blue' },
        ].map(s => (
          <div key={s.key} className="stat-card" style={{ cursor:'pointer', opacity: filter===s.key?1:0.65, outline: filter===s.key?`2px solid var(--accent)`:'none' }}
            onClick={() => setFilter(s.key)}>
            <div className="stat-card-top">
              <div className={`stat-icon ${s.color}`}>{s.icon}</div>
              <div className="stat-value" style={{ fontSize:22 }}>{counts[s.key]}</div>
            </div>
            <div className="stat-label">{s.label}</div>
          </div>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon"><CheckSquare size={22}/></div>
          <div className="empty-title">{filter==='overdue' ? "You're all caught up! 🎉" : "No issues here"}</div>
          <div className="empty-text">Nothing to show in this category</div>
        </div>
      ) : (
        <div className="table-wrap">
          <table>
            <thead>
              <tr><th>Key</th><th>Summary</th><th>Project</th><th>Status</th><th>Priority</th><th>Due date</th></tr>
            </thead>
            <tbody>
              {filtered.map(task => {
                const overdue = task.deadline && new Date(task.deadline)<today && task.status!=='done';
                return (
                  <tr key={`${task.project_id}-${task.id}`}>
                    <td><span className="code-text">TF-{task.id}</span></td>
                    <td>
                      <div style={{ fontWeight:500 }}>{task.title}</div>
                      {task.description && <div style={{ fontSize:11, color:'var(--text-muted)', marginTop:1 }}>{task.description.slice(0,50)}</div>}
                    </td>
                    <td>
                      <Link to={`/projects/${task.project_id}`} style={{ color:'var(--text-link)', textDecoration:'none', fontSize:12, display:'flex', alignItems:'center', gap:4 }}>
                        {task.project_name} <ExternalLink size={10}/>
                      </Link>
                    </td>
                    <td><span className={`status-badge ${sColor[task.status]}`}>{task.status.replace('_',' ')}</span></td>
                    <td><span className={`priority ${pColor[task.priority]}`}>{PICONS[task.priority]} {task.priority}</span></td>
                    <td>
                      {task.deadline ? (
                        <span className={`deadline ${overdue?'overdue':''}`}>
                          <Calendar size={10}/> {formatDate(task.deadline)} {overdue&&'⚠️'}
                        </span>
                      ) : <span style={{ color:'var(--text-muted)' }}>—</span>}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
