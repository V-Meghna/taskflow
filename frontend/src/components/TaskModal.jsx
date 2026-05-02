import { useState, useEffect } from "react";
import {
  X,
  MessageSquare,
  Send,
  Trash2,
  Edit2,
  Check,
  ArrowRight,
  AlertCircle,
  Lock,
} from "lucide-react";
import api from "../utils/api";
import { useAuth } from "../context/AuthContext";
import { Avatar, formatDate, relativeTime } from "./Avatar";

const PRIORITY_OPTIONS = ["low", "medium", "high", "critical"];

// ── Ticket Flow Rules ──────────────────────────────────────────
// todo → in_progress (must be assigned to someone)
// in_progress → review (work done, sent for review)
// review → done (approved) OR review → in_progress (needs rework)
// done → (terminal, admin can reopen to in_progress)

const FLOW = {
  todo: {
    next: ["in_progress"],
    label: "Start Progress",
    color: "var(--accent)",
  },
  in_progress: {
    next: ["review"],
    label: "Send for Review",
    color: "var(--yellow)",
  },
  review: { next: ["done", "in_progress"], label: null, color: null },
  done: { next: [], label: null, color: null },
};

const STATUS_META = {
  todo: {
    label: "To Do",
    color: "var(--text-muted)",
    bg: "var(--bg-elevated)",
  },
  in_progress: {
    label: "In Progress",
    color: "var(--accent-hover)",
    bg: "var(--accent-subtle)",
  },
  review: {
    label: "In Review",
    color: "var(--yellow)",
    bg: "var(--yellow-subtle)",
  },
  done: { label: "Done", color: "var(--green)", bg: "var(--green-subtle)" },
};

const FLOW_STEPS = ["todo", "in_progress", "review", "done"];

export default function TaskModal({
  task,
  projectId,
  members,
  onClose,
  onUpdated,
  onDeleted,
  canManage,
}) {
  const { user } = useAuth();
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({ ...task });
  const [comments, setComments] = useState([]);
  const [comment, setComment] = useState("");
  const [saving, setSaving] = useState(false);
  const [sending, setSending] = useState(false);
  const [flowError, setFlowError] = useState("");
  const [transitioning, setTransitioning] = useState(false);

  useEffect(() => {
    api
      .get(`/projects/${projectId}/tasks/${task.id}/comments`)
      .then((r) => setComments(r.data.comments));
  }, [task.id]);

  // ── Validate if a status transition is allowed ──
  const canTransitionTo = (from, to) => {
    return FLOW[from]?.next.includes(to);
  };

  // ── Get the rule message for a blocked transition ──
  const getBlockReason = (from, to) => {
    if (from === "todo" && to === "in_progress" && !task.assignee_id) {
      return "Assign this task to someone before starting progress";
    }
    if (!canTransitionTo(from, to)) {
      return `Cannot move from "${STATUS_META[from].label}" to "${STATUS_META[to].label}" — follow the workflow`;
    }
    return null;
  };

  const handleStatusTransition = async (newStatus) => {
    const reason = getBlockReason(task.status, newStatus);
    if (reason) {
      setFlowError(reason);
      return;
    }
    setFlowError("");
    setTransitioning(true);
    try {
      const r = await api.put(`/projects/${projectId}/tasks/${task.id}`, {
        status: newStatus,
      });
      onUpdated(r.data.task);
    } catch (err) {
      setFlowError(err.response?.data?.error || "Failed to update status");
    } finally {
      setTransitioning(false);
    }
  };

  // Admin can force any status (override flow)
  const isAdmin = user.role === "admin";

  const handleSave = async () => {
    setSaving(true);
    try {
      const r = await api.put(`/projects/${projectId}/tasks/${task.id}`, form);
      onUpdated(r.data.task);
      setEditing(false);
    } catch (err) {
      alert(err.response?.data?.error || "Failed");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm("Delete this task?")) return;
    try {
      await api.delete(`/projects/${projectId}/tasks/${task.id}`);
      onDeleted(task.id);
    } catch {}
  };

  const handleComment = async (e) => {
    e.preventDefault();
    if (!comment.trim()) return;
    setSending(true);
    try {
      const r = await api.post(
        `/projects/${projectId}/tasks/${task.id}/comments`,
        { content: comment },
      );
      setComments([...comments, r.data.comment]);
      setComment("");
    } finally {
      setSending(false);
    }
  };

  const isOverdue =
    task.deadline &&
    new Date(task.deadline) < new Date() &&
    task.status !== "done";
  const currentStepIndex = FLOW_STEPS.indexOf(task.status);
  const flowConfig = FLOW[task.status];

  return (
    <div
      className="modal-overlay"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="modal modal-xl">
        <div className="modal-header">
          <div
            style={{ display: "flex", alignItems: "center", gap: 10, flex: 1 }}
          >
            <span className="code-text">TF-{task.id}</span>
            {editing ? (
              <input
                className="form-input"
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                style={{ fontSize: 15, fontWeight: 600, flex: 1 }}
              />
            ) : (
              <div
                style={{
                  fontSize: 15,
                  fontWeight: 600,
                  color: "var(--text-primary)",
                  flex: 1,
                }}
              >
                {task.title}
              </div>
            )}
          </div>
          <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
            {canManage && !editing && (
              <button
                className="btn btn-ghost btn-sm"
                onClick={() => setEditing(true)}
              >
                <Edit2 size={13} /> Edit
              </button>
            )}
            {canManage && (
              <button className="btn btn-danger btn-sm" onClick={handleDelete}>
                <Trash2 size={13} />
              </button>
            )}
            <button className="btn btn-ghost btn-icon" onClick={onClose}>
              <X size={15} />
            </button>
          </div>
        </div>

        <div className="modal-body">
          {/* ── Ticket Flow Progress Bar ── */}
          <div
            style={{
              marginBottom: 20,
              padding: "14px 16px",
              background: "var(--bg-elevated)",
              borderRadius: 8,
              border: "1px solid var(--border)",
            }}
          >
            <div
              style={{
                fontSize: 11,
                fontWeight: 600,
                color: "var(--text-muted)",
                textTransform: "uppercase",
                letterSpacing: "0.06em",
                marginBottom: 12,
              }}
            >
              Ticket Workflow
            </div>

            {/* Steps */}
            <div style={{ display: "flex", alignItems: "center", gap: 0 }}>
              {FLOW_STEPS.map((step, i) => {
                const meta = STATUS_META[step];
                const isDone = i < currentStepIndex;
                const isCurrent = i === currentStepIndex;
                const isFuture = i > currentStepIndex;
                return (
                  <div
                    key={step}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      flex: i < FLOW_STEPS.length - 1 ? 1 : "none",
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "center",
                        gap: 5,
                      }}
                    >
                      <div
                        style={{
                          width: 28,
                          height: 28,
                          borderRadius: "50%",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          background: isDone
                            ? "var(--green)"
                            : isCurrent
                              ? meta.bg
                              : "var(--bg-card)",
                          border: `2px solid ${isDone ? "var(--green)" : isCurrent ? meta.color : "var(--border)"}`,
                          transition: "all 0.3s",
                          fontSize: 11,
                          fontWeight: 700,
                          color: isDone
                            ? "white"
                            : isCurrent
                              ? meta.color
                              : "var(--text-muted)",
                        }}
                      >
                        {isDone ? <Check size={13} /> : i + 1}
                      </div>
                      <div
                        style={{
                          fontSize: 10,
                          fontWeight: isCurrent ? 700 : 500,
                          color: isDone
                            ? "var(--green)"
                            : isCurrent
                              ? meta.color
                              : "var(--text-muted)",
                          whiteSpace: "nowrap",
                        }}
                      >
                        {meta.label}
                      </div>
                    </div>
                    {i < FLOW_STEPS.length - 1 && (
                      <div
                        style={{
                          flex: 1,
                          height: 2,
                          margin: "0 4px",
                          marginBottom: 16,
                          background: isDone ? "var(--green)" : "var(--border)",
                          transition: "background 0.3s",
                        }}
                      />
                    )}
                  </div>
                );
              })}
            </div>

            {/* Flow error */}
            {flowError && (
              <div
                style={{
                  marginTop: 10,
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                  fontSize: 12,
                  color: "var(--red)",
                  background: "var(--red-subtle)",
                  padding: "7px 10px",
                  borderRadius: 6,
                  border: "1px solid var(--red-border)",
                }}
              >
                <AlertCircle size={13} style={{ flexShrink: 0 }} /> {flowError}
              </div>
            )}

            {/* Action buttons */}
            <div
              style={{
                marginTop: 12,
                display: "flex",
                gap: 8,
                flexWrap: "wrap",
              }}
            >
              {/* Primary flow button */}
              {task.status === "todo" && (
                <button
                  className="btn btn-primary btn-sm"
                  disabled={transitioning}
                  onClick={() => handleStatusTransition("in_progress")}
                  style={{ gap: 6 }}
                >
                  {transitioning ? (
                    <span className="spinner" />
                  ) : (
                    <>
                      <ArrowRight size={13} /> Start Progress
                    </>
                  )}
                </button>
              )}

              {task.status === "in_progress" && (
                <button
                  className="btn btn-sm"
                  disabled={transitioning}
                  onClick={() => handleStatusTransition("review")}
                  style={{
                    background: "var(--yellow-subtle)",
                    color: "var(--yellow)",
                    border: "1px solid var(--yellow-border)",
                    gap: 6,
                  }}
                >
                  {transitioning ? (
                    <span className="spinner" />
                  ) : (
                    <>
                      <ArrowRight size={13} /> Send for Review
                    </>
                  )}
                </button>
              )}

              {task.status === "review" && (
                <>
                  <button
                    className="btn btn-sm"
                    disabled={transitioning}
                    onClick={() => handleStatusTransition("done")}
                    style={{
                      background: "var(--green-subtle)",
                      color: "var(--green)",
                      border: "1px solid var(--green-border)",
                      gap: 6,
                    }}
                  >
                    {transitioning ? (
                      <span className="spinner" />
                    ) : (
                      <>
                        <Check size={13} /> Approve & Close
                      </>
                    )}
                  </button>
                  <button
                    className="btn btn-sm"
                    disabled={transitioning}
                    onClick={() => handleStatusTransition("in_progress")}
                    style={{
                      background: "var(--red-subtle)",
                      color: "var(--red)",
                      border: "1px solid var(--red-border)",
                      gap: 6,
                    }}
                  >
                    {transitioning ? (
                      <span className="spinner" />
                    ) : (
                      <>
                        <ArrowRight
                          size={13}
                          style={{ transform: "rotate(180deg)" }}
                        />{" "}
                        Request Changes
                      </>
                    )}
                  </button>
                </>
              )}

              {task.status === "done" && (
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 6,
                    fontSize: 12,
                    color: "var(--green)",
                    fontWeight: 600,
                  }}
                >
                  <Check size={14} /> Completed
                </div>
              )}

              {/* Admin override */}
              {isAdmin && task.status === "done" && (
                <button
                  className="btn btn-ghost btn-sm"
                  onClick={() => handleStatusTransition("in_progress")}
                  style={{ fontSize: 11, color: "var(--text-muted)" }}
                >
                  Reopen
                </button>
              )}

              {/* Admin force-status override */}
              {isAdmin && editing && (
                <div
                  style={{
                    marginLeft: "auto",
                    display: "flex",
                    alignItems: "center",
                    gap: 6,
                    fontSize: 11,
                    color: "var(--text-muted)",
                  }}
                >
                  <Lock size={11} /> Admin: force status via Edit
                </div>
              )}
            </div>

            {/* Info tip */}
            {!isAdmin && task.status !== "done" && (
              <div
                style={{
                  marginTop: 8,
                  fontSize: 10,
                  color: "var(--text-muted)",
                  display: "flex",
                  alignItems: "center",
                  gap: 4,
                }}
              >
                <Lock size={10} /> Tickets must follow the workflow: To Do → In
                Progress → Review → Done
              </div>
            )}
            {isAdmin && (
              <div
                style={{
                  marginTop: 8,
                  fontSize: 10,
                  color: "var(--purple)",
                  display: "flex",
                  alignItems: "center",
                  gap: 4,
                }}
              >
                <Shield size={10} /> Admin: you can override workflow via Edit
                mode
              </div>
            )}
          </div>

          <div className="task-detail-grid">
            {/* Main */}
            <div>
              <div style={{ marginBottom: 20 }}>
                <div className="detail-label">Description</div>
                {editing ? (
                  <textarea
                    className="form-textarea"
                    value={form.description || ""}
                    placeholder="Add a description…"
                    onChange={(e) =>
                      setForm({ ...form, description: e.target.value })
                    }
                  />
                ) : (
                  <div
                    style={{
                      fontSize: 13.5,
                      color: task.description
                        ? "var(--text-primary)"
                        : "var(--text-muted)",
                      lineHeight: 1.6,
                      minHeight: 60,
                    }}
                  >
                    {task.description || "No description provided."}
                  </div>
                )}
              </div>

              {editing && (
                <>
                  <div className="form-row" style={{ marginBottom: 14 }}>
                    <div className="form-group">
                      <label className="form-label">Priority</label>
                      <select
                        className="form-select"
                        value={form.priority}
                        onChange={(e) =>
                          setForm({ ...form, priority: e.target.value })
                        }
                      >
                        {PRIORITY_OPTIONS.map((p) => (
                          <option key={p} value={p}>
                            {p}
                          </option>
                        ))}
                      </select>
                    </div>
                    {isAdmin && (
                      <div className="form-group">
                        <label className="form-label">
                          Status (Admin Override)
                        </label>
                        <select
                          className="form-select"
                          value={form.status}
                          onChange={(e) =>
                            setForm({ ...form, status: e.target.value })
                          }
                        >
                          <option value="todo">To Do</option>
                          <option value="in_progress">In Progress</option>
                          <option value="review">In Review</option>
                          <option value="done">Done</option>
                        </select>
                      </div>
                    )}
                  </div>
                  <div className="form-row" style={{ marginBottom: 14 }}>
                    <div className="form-group">
                      <label className="form-label">Assignee</label>
                      <select
                        className="form-select"
                        value={form.assignee_id || ""}
                        onChange={(e) =>
                          setForm({
                            ...form,
                            assignee_id: e.target.value || null,
                          })
                        }
                      >
                        <option value="">Unassigned</option>
                        {members.map((m) => (
                          <option key={m.id} value={m.id}>
                            {m.name}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="form-group">
                      <label className="form-label">Deadline</label>
                      <input
                        className="form-input"
                        type="date"
                        value={form.deadline || ""}
                        onChange={(e) =>
                          setForm({ ...form, deadline: e.target.value })
                        }
                      />
                    </div>
                  </div>
                  <div style={{ display: "flex", gap: 8, marginBottom: 20 }}>
                    <button
                      className="btn btn-primary btn-sm"
                      onClick={handleSave}
                      disabled={saving}
                    >
                      {saving ? (
                        <span className="spinner" />
                      ) : (
                        <>
                          <Check size={13} /> Save
                        </>
                      )}
                    </button>
                    <button
                      className="btn btn-ghost btn-sm"
                      onClick={() => {
                        setEditing(false);
                        setForm({ ...task });
                      }}
                    >
                      Cancel
                    </button>
                  </div>
                </>
              )}

              {/* Comments */}
              <div>
                <div className="detail-label" style={{ marginBottom: 12 }}>
                  <MessageSquare
                    size={12}
                    style={{ display: "inline", marginRight: 5 }}
                  />
                  Comments ({comments.length})
                </div>
                <div
                  style={{
                    maxHeight: 240,
                    overflowY: "auto",
                    marginBottom: 12,
                  }}
                >
                  {comments.length === 0 && (
                    <div
                      style={{
                        fontSize: 13,
                        color: "var(--text-muted)",
                        padding: "12px 0",
                      }}
                    >
                      No comments yet.
                    </div>
                  )}
                  {comments.map((c) => (
                    <div key={c.id} className="comment">
                      <Avatar
                        avatarData={c.avatar}
                        name={c.name}
                        size="avatar-sm"
                      />
                      <div className="comment-body">
                        <div className="comment-meta">
                          {c.name} · {relativeTime(c.created_at)}
                        </div>
                        <div className="comment-content">{c.content}</div>
                      </div>
                    </div>
                  ))}
                </div>
                <form
                  onSubmit={handleComment}
                  style={{ display: "flex", gap: 8 }}
                >
                  <input
                    className="form-input"
                    placeholder="Add a comment…"
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    style={{ flex: 1 }}
                  />
                  <button
                    type="submit"
                    className="btn btn-primary btn-sm"
                    disabled={sending || !comment.trim()}
                  >
                    <Send size={13} />
                  </button>
                </form>
              </div>
            </div>

            {/* Sidebar */}
            <div className="task-detail-sidebar">
              <div className="detail-field">
                <div className="detail-label">Current Status</div>
                <span className={`status-badge status-${task.status}`}>
                  {task.status.replace("_", " ")}
                </span>
              </div>
              <div className="detail-field">
                <div className="detail-label">Priority</div>
                <span className={`priority priority-${task.priority}`}>
                  {task.priority}
                </span>
              </div>
              <div className="detail-field">
                <div className="detail-label">Assignee</div>
                {task.assignee_name ? (
                  <div
                    style={{ display: "flex", alignItems: "center", gap: 8 }}
                  >
                    <Avatar
                      avatarData={task.assignee_avatar}
                      name={task.assignee_name}
                      size="avatar-sm"
                    />
                    <span style={{ fontSize: 13 }}>{task.assignee_name}</span>
                  </div>
                ) : (
                  <div
                    style={{
                      fontSize: 13,
                      color: "var(--red)",
                      display: "flex",
                      alignItems: "center",
                      gap: 5,
                    }}
                  >
                    <AlertCircle size={12} /> Unassigned
                    {task.status === "todo" && (
                      <span
                        style={{ fontSize: 10, color: "var(--text-muted)" }}
                      >
                        (required to start)
                      </span>
                    )}
                  </div>
                )}
              </div>
              <div className="detail-field">
                <div className="detail-label">Reporter</div>
                <span style={{ fontSize: 13, color: "var(--text-secondary)" }}>
                  {task.creator_name}
                </span>
              </div>
              {task.deadline && (
                <div className="detail-field">
                  <div className="detail-label">Due date</div>
                  <span className={`deadline ${isOverdue ? "overdue" : ""}`}>
                    {formatDate(task.deadline)} {isOverdue && "⚠️"}
                  </span>
                </div>
              )}
              <div className="detail-field">
                <div className="detail-label">Issue key</div>
                <span className="code-text">TF-{task.id}</span>
              </div>
              <div className="detail-field">
                <div className="detail-label">Created</div>
                <span style={{ fontSize: 12, color: "var(--text-muted)" }}>
                  {formatDate(task.created_at)}
                </span>
              </div>

              {/* Flow guide */}
              <div
                style={{
                  marginTop: 16,
                  padding: "10px 12px",
                  background: "var(--bg-app)",
                  borderRadius: 6,
                  border: "1px solid var(--border-muted)",
                }}
              >
                <div
                  style={{
                    fontSize: 10,
                    fontWeight: 700,
                    color: "var(--text-muted)",
                    textTransform: "uppercase",
                    letterSpacing: "0.05em",
                    marginBottom: 8,
                  }}
                >
                  Workflow Guide
                </div>
                {FLOW_STEPS.map((step, i) => (
                  <div
                    key={step}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 6,
                      marginBottom: i < FLOW_STEPS.length - 1 ? 4 : 0,
                    }}
                  >
                    <div
                      style={{
                        width: 6,
                        height: 6,
                        borderRadius: "50%",
                        background:
                          i <= currentStepIndex
                            ? STATUS_META[step].color
                            : "var(--border)",
                        flexShrink: 0,
                      }}
                    />
                    <span
                      style={{
                        fontSize: 11,
                        color:
                          i === currentStepIndex
                            ? STATUS_META[step].color
                            : i < currentStepIndex
                              ? "var(--green)"
                              : "var(--text-muted)",
                        fontWeight: i === currentStepIndex ? 700 : 400,
                      }}
                    >
                      {STATUS_META[step].label}
                    </span>
                    {i === currentStepIndex && (
                      <span
                        style={{
                          fontSize: 9,
                          color: "var(--text-muted)",
                          marginLeft: "auto",
                        }}
                      >
                        ← current
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
