import { useState, useEffect } from 'react';
import { X, MessageSquare, Send, Trash2, Edit2, Check } from 'lucide-react';
import api from '../utils/api';
import { useAuth } from '../context/AuthContext';
import { Avatar, formatDate, relativeTime } from './Avatar';

const STATUS_OPTIONS = ['todo','in_progress','review','done'];
const PRIORITY_OPTIONS = ['low','medium','high','critical'];

export default function TaskModal({ task, projectId, members, onClose, onUpdated, onDeleted, canManage }) {
  const { user } = useAuth();
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({...task});
  const [comments, setComments] = useState([]);
  const [comment, setComment] = useState('');
  const [saving, setSaving] = useState(false);
  const [sending, setSending] = useState(false);

  useEffect(() => {
    api.get(`/projects/${projectId}/tasks/${task.id}/comments`).then(r => setComments(r.data.comments));
  }, [task.id]);

  const handleStatusChange = async (status) => {
    try {
      const r = await api.put(`/projects/${projectId}/tasks/${task.id}`, { status });
      onUpdated(r.data.task); setForm(r.data.task);
    } catch {}
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const r = await api.put(`/projects/${projectId}/tasks/${task.id}`, form);
      onUpdated(r.data.task); setEditing(false);
    } catch (err) { alert(err.response?.data?.error || 'Failed to update'); }
    finally { setSaving(false); }
  };

  const handleDelete = async () => {
    if (!confirm('Delete this task? This cannot be undone.')) return;
    try { await api.delete(`/projects/${projectId}/tasks/${task.id}`); onDeleted(task.id); }
    catch {}
  };

  const handleComment = async (e) => {
    e.preventDefault(); if (!comment.trim()) return;
    setSending(true);
    try {
      const r = await api.post(`/projects/${projectId}/tasks/${task.id}/comments`, { content: comment });
      setComments([...comments, r.data.comment]); setComment('');
    } finally { setSending(false); }
  };

  const isOverdue = task.deadline && new Date(task.deadline) < new Date() && task.status !== 'done';
  const taskKey = `TF-${task.id}`;

  return (
    <div className="modal-overlay" onClick={e => e.target===e.currentTarget && onClose()}>
      <div className="modal modal-xl">
        <div className="modal-header">
          <div style={{ display:'flex', alignItems:'center', gap:10, flex:1 }}>
            <span className="code-text">{taskKey}</span>
            {editing ? (
              <input className="form-input" value={form.title} onChange={e => setForm({...form,title:e.target.value})}
                style={{ fontSize:15, fontWeight:600, flex:1 }}/>
            ) : (
              <div style={{ fontSize:15, fontWeight:600, color:'var(--text-primary)', flex:1 }}>{task.title}</div>
            )}
          </div>
          <div style={{ display:'flex', gap:6, alignItems:'center' }}>
            {canManage && !editing && (
              <button className="btn btn-ghost btn-sm" onClick={() => setEditing(true)}><Edit2 size={13}/> Edit</button>
            )}
            {canManage && (
              <button className="btn btn-danger btn-sm" onClick={handleDelete}><Trash2 size={13}/></button>
            )}
            <button className="btn btn-ghost btn-icon" onClick={onClose}><X size={15}/></button>
          </div>
        </div>

        <div className="modal-body">
          <div className="task-detail-grid">
            {/* Main */}
            <div>
              {/* Description */}
              <div style={{ marginBottom:20 }}>
                <div className="detail-label">Description</div>
                {editing ? (
                  <textarea className="form-textarea" value={form.description||''} placeholder="Add a description…"
                    onChange={e => setForm({...form,description:e.target.value})}/>
                ) : (
                  <div style={{ fontSize:13.5, color: task.description?'var(--text-primary)':'var(--text-muted)', lineHeight:1.6, minHeight:60 }}>
                    {task.description || 'No description provided.'}
                  </div>
                )}
              </div>

              {/* Status quick change */}
              {!editing && (
                <div style={{ marginBottom:20 }}>
                  <div className="detail-label">Change Status</div>
                  <div style={{ display:'flex', gap:6, flexWrap:'wrap' }}>
                    {STATUS_OPTIONS.map(s => (
                      <button key={s} className={`status-badge status-${s}`}
                        style={{ cursor:'pointer', border: form.status===s ? '2px solid currentColor':'', opacity: form.status===s?1:0.6, padding:'5px 12px' }}
                        onClick={() => handleStatusChange(s)}>
                        {s.replace('_',' ')}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {editing && (
                <div className="form-row" style={{ marginBottom:16 }}>
                  <div className="form-group">
                    <label className="form-label">Status</label>
                    <select className="form-select" value={form.status} onChange={e => setForm({...form,status:e.target.value})}>
                      {STATUS_OPTIONS.map(s => <option key={s} value={s}>{s.replace('_',' ')}</option>)}
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Priority</label>
                    <select className="form-select" value={form.priority} onChange={e => setForm({...form,priority:e.target.value})}>
                      {PRIORITY_OPTIONS.map(p => <option key={p} value={p}>{p}</option>)}
                    </select>
                  </div>
                </div>
              )}

              {editing && (
                <div className="form-row" style={{ marginBottom:16 }}>
                  <div className="form-group">
                    <label className="form-label">Assignee</label>
                    <select className="form-select" value={form.assignee_id||''} onChange={e => setForm({...form,assignee_id:e.target.value||null})}>
                      <option value="">Unassigned</option>
                      {members.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Deadline</label>
                    <input className="form-input" type="date" value={form.deadline||''} onChange={e => setForm({...form,deadline:e.target.value})}/>
                  </div>
                </div>
              )}

              {editing && (
                <div style={{ display:'flex', gap:8, marginBottom:20 }}>
                  <button className="btn btn-primary btn-sm" onClick={handleSave} disabled={saving}>
                    {saving ? <span className="spinner"/> : <><Check size={13}/> Save changes</>}
                  </button>
                  <button className="btn btn-ghost btn-sm" onClick={() => { setEditing(false); setForm({...task}); }}>Cancel</button>
                </div>
              )}

              {/* Comments */}
              <div>
                <div className="detail-label" style={{ marginBottom:12 }}>
                  <MessageSquare size={12} style={{ display:'inline', marginRight:5 }}/>
                  Comments ({comments.length})
                </div>
                <div style={{ maxHeight:260, overflowY:'auto', marginBottom:12 }}>
                  {comments.length === 0 && (
                    <div style={{ fontSize:13, color:'var(--text-muted)', padding:'12px 0' }}>No comments yet. Be the first!</div>
                  )}
                  {comments.map(c => (
                    <div key={c.id} className="comment">
                      <Avatar avatarData={c.avatar} name={c.name} size="avatar-sm"/>
                      <div className="comment-body">
                        <div className="comment-meta">{c.name} · {relativeTime(c.created_at)}</div>
                        <div className="comment-content">{c.content}</div>
                      </div>
                    </div>
                  ))}
                </div>
                <form onSubmit={handleComment} style={{ display:'flex', gap:8 }}>
                  <input className="form-input" placeholder="Add a comment…" value={comment}
                    onChange={e => setComment(e.target.value)} style={{ flex:1 }}/>
                  <button type="submit" className="btn btn-primary btn-sm" disabled={sending||!comment.trim()}>
                    <Send size={13}/>
                  </button>
                </form>
              </div>
            </div>

            {/* Sidebar details */}
            <div className="task-detail-sidebar">
              <div className="detail-field">
                <div className="detail-label">Status</div>
                <span className={`status-badge status-${task.status}`}>{task.status.replace('_',' ')}</span>
              </div>
              <div className="detail-field">
                <div className="detail-label">Priority</div>
                <span className={`priority priority-${task.priority}`}>{task.priority}</span>
              </div>
              <div className="detail-field">
                <div className="detail-label">Assignee</div>
                {task.assignee_name ? (
                  <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                    <Avatar avatarData={task.assignee_avatar} name={task.assignee_name} size="avatar-sm"/>
                    <span style={{ fontSize:13 }}>{task.assignee_name}</span>
                  </div>
                ) : <span style={{ fontSize:13, color:'var(--text-muted)' }}>Unassigned</span>}
              </div>
              <div className="detail-field">
                <div className="detail-label">Reporter</div>
                <span style={{ fontSize:13, color:'var(--text-secondary)' }}>{task.creator_name}</span>
              </div>
              {task.deadline && (
                <div className="detail-field">
                  <div className="detail-label">Due date</div>
                  <span className={`deadline ${isOverdue ? 'overdue':''}`}>
                    {formatDate(task.deadline)} {isOverdue && '⚠️'}
                  </span>
                </div>
              )}
              <div className="detail-field">
                <div className="detail-label">Issue key</div>
                <span className="code-text">{taskKey}</span>
              </div>
              <div className="detail-field">
                <div className="detail-label">Created</div>
                <span style={{ fontSize:12, color:'var(--text-muted)' }}>{formatDate(task.created_at)}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
