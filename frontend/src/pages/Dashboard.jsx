import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { FolderKanban, CheckCircle2, Clock, AlertTriangle, Users, ArrowRight, Calendar, Activity, TrendingUp } from 'lucide-react';
import api from '../utils/api';
import { useAuth } from '../context/AuthContext';
import { Avatar, formatDateShort, isOverdue } from '../components/Avatar';

const priorityColor = { low:'priority-low', medium:'priority-medium', high:'priority-high', critical:'priority-critical' };
const statusColor   = { todo:'status-todo', in_progress:'status-in_progress', review:'status-review', done:'status-done' };

export default function Dashboard() {
  const { user } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => { api.get('/dashboard').then(r => setData(r.data)).finally(() => setLoading(false)); }, []);

  if (loading) return <div className="loading-page"><div className="spinner"/><span>Loading…</span></div>;
  if (!data) return null;

  const { stats, recentTasks, myTasks } = data;
  const completionRate = stats.total_tasks > 0 ? Math.round((stats.completed_tasks / stats.total_tasks) * 100) : 0;
  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';

  return (
    <div>
      {/* Header */}
      <div className="page-header">
        <div>
          <div style={{ fontSize:12, color:'var(--text-muted)', marginBottom:4, fontWeight:500 }}>
            {new Date().toLocaleDateString('en-US', { weekday:'long', month:'long', day:'numeric' })}
          </div>
          <div className="page-title">{greeting}, {user.name.split(' ')[0]}</div>
          <div className="page-subtitle">Here's what's happening in your workspace today</div>
        </div>
        <Link to="/projects" className="btn btn-primary"><FolderKanban size={14}/> Go to Projects</Link>
      </div>

      {/* Stats */}
      <div className="stats-grid">
        {[
          { label:'Projects', value: stats.total_projects||0, icon:<FolderKanban size={16}/>, color:'blue' },
          { label:'Completed', value: stats.completed_tasks||0, icon:<CheckCircle2 size={16}/>, color:'green' },
          { label:'In Progress', value: stats.in_progress_tasks||0, icon:<Clock size={16}/>, color:'yellow' },
          { label:'Overdue', value: stats.overdue_tasks||0, icon:<AlertTriangle size={16}/>, color:'red' },
          ...(user.role==='admin' ? [{ label:'Team Members', value: stats.total_users||0, icon:<Users size={16}/>, color:'purple' }] : []),
        ].map((s,i) => (
          <div key={i} className="stat-card">
            <div className="stat-card-top">
              <div className={`stat-icon ${s.color}`}>{s.icon}</div>
              <div className="stat-value">{s.value}</div>
            </div>
            <div className="stat-label">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Two column layout */}
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:16, marginBottom:16 }}>
        {/* My Tasks */}
        <div className="card animate-in">
          <div className="section-header">
            <div className="section-title" style={{ display:'flex', alignItems:'center', gap:8 }}>
              <Activity size={15} style={{ color:'var(--accent-hover)' }}/> My Tasks
            </div>
            <Link to="/my-tasks" className="btn btn-ghost btn-sm" style={{ gap:4 }}>
              View all <ArrowRight size={12}/>
            </Link>
          </div>

          {myTasks.length === 0 ? (
            <div style={{ textAlign:'center', padding:'24px 0', color:'var(--text-muted)', fontSize:13 }}>
              <CheckCircle2 size={24} style={{ margin:'0 auto 8px', display:'block', opacity:0.3 }}/>
              All caught up!
            </div>
          ) : myTasks.map((task, i) => (
            <div key={task.id} style={{ display:'flex', alignItems:'flex-start', gap:10, padding:'10px 0', borderBottom: i<myTasks.length-1 ? '1px solid var(--border-muted)' : 'none' }}>
              <div style={{ flex:1 }}>
                <div style={{ fontSize:13, fontWeight:500, color:'var(--text-primary)', marginBottom:3 }}>{task.title}</div>
                <div style={{ fontSize:11, color:'var(--text-muted)' }}>{task.project_name}</div>
              </div>
              <div style={{ display:'flex', flexDirection:'column', alignItems:'flex-end', gap:3 }}>
                <span className={`priority ${priorityColor[task.priority]}`}>{task.priority}</span>
                {task.deadline && (
                  <span className={`deadline ${isOverdue(task.deadline) && task.status!=='done' ? 'overdue':''}`}>
                    <Calendar size={10}/> {formatDateShort(task.deadline)}
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Recent Activity */}
        <div className="card animate-in">
          <div className="section-header">
            <div className="section-title" style={{ display:'flex', alignItems:'center', gap:8 }}>
              <TrendingUp size={15} style={{ color:'var(--green)' }}/> Recent Activity
            </div>
          </div>

          {recentTasks.length === 0 ? (
            <div style={{ textAlign:'center', padding:'24px 0', color:'var(--text-muted)', fontSize:13 }}>No activity yet</div>
          ) : recentTasks.slice(0,8).map((task,i) => (
            <div key={task.id} style={{ display:'flex', alignItems:'center', gap:10, padding:'9px 0', borderBottom: i<7 ? '1px solid var(--border-muted)' : 'none' }}>
              <div style={{ flex:1 }}>
                <div style={{ fontSize:13, fontWeight:500, color:'var(--text-primary)' }}>{task.title}</div>
                <div style={{ fontSize:11, color:'var(--text-muted)', marginTop:1 }}>{task.project_name}</div>
              </div>
              <span className={`status-badge ${statusColor[task.status]}`}>{task.status.replace('_',' ')}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Completion rate */}
      <div className="card animate-in">
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:12 }}>
          <div>
            <div className="section-title">Overall Progress</div>
            <div style={{ fontSize:12, color:'var(--text-secondary)', marginTop:2 }}>
              {stats.completed_tasks||0} of {stats.total_tasks||0} tasks completed
            </div>
          </div>
          <div style={{ fontSize:28, fontWeight:800, letterSpacing:'-0.04em', color: completionRate>60?'var(--green)': completionRate>30?'var(--yellow)':'var(--accent-hover)' }}>
            {completionRate}%
          </div>
        </div>
        <div className="progress-bar" style={{ height:6, marginBottom:12 }}>
          <div className="progress-fill" style={{ width:`${completionRate}%` }}/>
        </div>
        <div style={{ display:'flex', gap:20, fontSize:12, color:'var(--text-muted)' }}>
          <span>📋 {stats.todo_tasks||0} todo</span>
          <span>⚡ {stats.in_progress_tasks||0} in progress</span>
          <span>✅ {stats.completed_tasks||0} done</span>
          {(stats.overdue_tasks||0) > 0 && <span style={{ color:'var(--red)' }}>⚠️ {stats.overdue_tasks} overdue</span>}
        </div>
      </div>
    </div>
  );
}
