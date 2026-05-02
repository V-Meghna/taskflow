import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import TopNav from './components/TopNav';
import Sidebar from './components/Sidebar';
import Login from './pages/Login';
import Signup from './pages/Signup';
import Dashboard from './pages/Dashboard';
import Projects from './pages/Projects';
import ProjectDetail from './pages/ProjectDetail';
import MyTasks from './pages/MyTasks';
import Team from './pages/Team';

function ProtectedLayout({ children }) {
  const { user, loading } = useAuth();
  if (loading) return (
    <div style={{ display:'flex', alignItems:'center', justifyContent:'center', height:'100vh', flexDirection:'column', gap:12, color:'var(--text-secondary)' }}>
      <div className="spinner" style={{ width:28, height:28, borderWidth:3 }} />
      <span style={{ fontSize:13 }}>Loading TaskFlow…</span>
    </div>
  );
  if (!user) return <Navigate to="/login" replace />;
  return (
    <div className="app-shell">
      <TopNav />
      <Sidebar />
      <main className="main-content">{children}</main>
    </div>
  );
}

function AdminOnly({ children }) {
  const { user } = useAuth();
  if (user?.role !== 'admin') return <Navigate to="/dashboard" replace />;
  return children;
}

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/login"  element={<Login />} />
            <Route path="/signup" element={<Signup />} />
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            <Route path="/dashboard"   element={<ProtectedLayout><Dashboard /></ProtectedLayout>} />
            <Route path="/projects"    element={<ProtectedLayout><Projects /></ProtectedLayout>} />
            <Route path="/projects/:id" element={<ProtectedLayout><ProjectDetail /></ProtectedLayout>} />
            <Route path="/my-tasks"    element={<ProtectedLayout><MyTasks /></ProtectedLayout>} />
            <Route path="/team"        element={<ProtectedLayout><AdminOnly><Team /></AdminOnly></ProtectedLayout>} />
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </ThemeProvider>
  );
}
