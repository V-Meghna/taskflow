export function Avatar({ avatarData, name, size = '' }) {
  let initials = '??', color = '#1f6feb';
  try {
    if (avatarData) {
      const d = typeof avatarData === 'string' ? JSON.parse(avatarData) : avatarData;
      initials = d.initials || initials;
      color = d.color || color;
    } else if (name) {
      initials = name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0,2);
    }
  } catch {}
  return <div className={`avatar ${size}`} style={{ background: color }} title={name}>{initials}</div>;
}

export function formatDate(d) {
  if (!d) return null;
  return new Date(d).toLocaleDateString('en-US', { month:'short', day:'numeric', year:'numeric' });
}

export function formatDateShort(d) {
  if (!d) return null;
  return new Date(d).toLocaleDateString('en-US', { month:'short', day:'numeric' });
}

export function isOverdue(d) {
  if (!d) return false;
  return new Date(d) < new Date();
}

export function relativeTime(dateStr) {
  const date = new Date(dateStr);
  const now = new Date();
  const diff = now - date;
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 7) return `${days}d ago`;
  return formatDate(dateStr);
}
