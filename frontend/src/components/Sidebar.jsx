import { NavLink, useNavigate } from 'react-router-dom';
import { LayoutDashboard, FolderKanban, CheckSquare, Users, ChevronDown, Layers } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { Avatar } from './Avatar';

export default function Sidebar() {
  const { user } = useAuth();

  return (
    <aside className="sidebar">
      <nav className="nav-section" style={{ flex:1, paddingTop:12 }}>
        <div className="nav-label">Main</div>
        <NavLink to="/dashboard" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
          <LayoutDashboard size={15} /> Dashboard
        </NavLink>
        <NavLink to="/projects" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
          <FolderKanban size={15} /> Projects
        </NavLink>
        <NavLink to="/my-tasks" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
          <CheckSquare size={15} /> My Tasks
        </NavLink>

        {user?.role === 'admin' && (
          <>
            <div className="nav-label" style={{ marginTop:12 }}>Admin</div>
            <NavLink to="/team" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
              <Users size={15} /> Team Members
            </NavLink>
          </>
        )}
      </nav>

      <div className="sidebar-footer">
        <div style={{ display:'flex', alignItems:'center', gap:8, padding:'8px 10px', borderRadius:8 }}>
          <Avatar avatarData={user?.avatar} name={user?.name} />
          <div style={{ flex:1, minWidth:0 }}>
            <div className="user-name-text">{user?.name}</div>
            <div className="user-role-text" style={{ display:'flex', alignItems:'center', gap:4 }}>
              <span className={`role-badge ${user?.role}`}>{user?.role}</span>
            </div>
          </div>
        </div>
      </div>
    </aside>
  );
}
