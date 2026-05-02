# TaskFlow — Team Task Manager

A full-stack web application for managing team projects and tasks with role-based access control.

## ✨ Features

- **Authentication** — JWT-based signup/login with role selection (Admin/Member)
- **Projects** — Create, manage, and track projects with deadlines and progress
- **Kanban Board** — Visual task board with 4 status columns (Todo, In Progress, Review, Done)
- **Task Management** — Create tasks with priority levels, assignees, deadlines, and comments
- **Role-Based Access** — Admins manage everything; Members work within their projects
- **Dashboard** — Overview with stats, completion rates, and activity feed
- **Team Management** — Admin view of all workspace members
- **Overdue Detection** — Automatic highlighting of overdue tasks

## 🛠️ Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18, React Router v6, Vite |
| Backend | Node.js, Express.js |
| Database | SQLite (via better-sqlite3) |
| Auth | JWT + bcryptjs |
| Validation | express-validator |
| Deployment | Railway |

## 🚀 Quick Start (VS Code)

### Prerequisites
- Node.js 18+
- VS Code

### 1. Install Dependencies

```bash
# Install all dependencies
npm install --prefix backend
npm install --prefix frontend
```

### 2. Configure Backend

```bash
cp backend/.env.example backend/.env
```

Edit `backend/.env`:
```env
PORT=5000
NODE_ENV=development
JWT_SECRET=your-super-secret-key-change-this
CLIENT_URL=http://localhost:5173
```

### 3. Run in VS Code (Recommended)

Press `Ctrl+Shift+P` → **Tasks: Run Task** → **🚀 Start TaskFlow (Full Stack)**

This opens two terminals — one for backend, one for frontend.

### 4. Or run manually

Terminal 1 (Backend):
```bash
cd backend
npm run dev
# Server runs on http://localhost:5000
```

Terminal 2 (Frontend):
```bash
cd frontend
npm run dev
# App runs on http://localhost:5173
```

Open **http://localhost:5173** in your browser.

## 📡 API Reference

### Auth
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/signup` | Register new user |
| POST | `/api/auth/login` | Login |
| GET | `/api/auth/me` | Get current user |
| GET | `/api/auth/users` | List all users |

### Projects
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/projects` | List user's projects |
| POST | `/api/projects` | Create project |
| GET | `/api/projects/:id` | Get project + members |
| PUT | `/api/projects/:id` | Update project (admin) |
| DELETE | `/api/projects/:id` | Delete project (admin) |
| POST | `/api/projects/:id/members` | Add member (admin) |
| DELETE | `/api/projects/:id/members/:uid` | Remove member (admin) |

### Tasks
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/projects/:id/tasks` | List project tasks |
| POST | `/api/projects/:id/tasks` | Create task |
| PUT | `/api/projects/:id/tasks/:tid` | Update task |
| DELETE | `/api/projects/:id/tasks/:tid` | Delete task (admin) |
| GET | `/api/projects/:id/tasks/:tid/comments` | Get comments |
| POST | `/api/projects/:id/tasks/:tid/comments` | Add comment |

### Dashboard
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/dashboard` | Get stats + recent tasks |

## 🌐 Deploy to Railway

1. **Push to GitHub**
```bash
git init
git add .
git commit -m "Initial commit"
git remote add origin https://github.com/YOUR_USERNAME/taskflow.git
git push -u origin main
```

2. **Create Railway Project**
   - Go to [railway.app](https://railway.app)
   - Click **New Project** → **Deploy from GitHub repo**
   - Select your repo

3. **Set Environment Variables** in Railway dashboard:
```
NODE_ENV=production
JWT_SECRET=your-production-secret-key-here-make-it-long
PORT=5000
```

4. **Deploy** — Railway auto-detects `nixpacks.toml` and builds/deploys automatically.

5. Get your live URL from **Settings → Domains**

## 👤 Role Permissions

| Feature | Admin | Member |
|---------|-------|--------|
| View own projects | ✅ | ✅ |
| Create projects | ✅ | ✅ |
| Delete any project | ✅ | ❌ |
| Add/remove members | ✅ | ❌ (project admins only) |
| Create tasks | ✅ | ✅ |
| Delete tasks | ✅ | ❌ |
| Update any task | ✅ | Own/assigned only |
| View all users | ✅ | ❌ |
| Team management page | ✅ | ❌ |

## 📁 Project Structure

```
taskflow/
├── backend/
│   ├── middleware/
│   │   └── auth.js          # JWT + role middleware
│   ├── models/
│   │   └── database.js      # SQLite schema + connection
│   ├── routes/
│   │   ├── auth.js          # Auth endpoints
│   │   ├── projects.js      # Project CRUD + members
│   │   ├── tasks.js         # Task CRUD + comments
│   │   └── dashboard.js     # Stats endpoint
│   ├── server.js            # Express app entry
│   ├── .env.example
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── Sidebar.jsx
│   │   │   ├── Avatar.jsx
│   │   │   └── TaskModal.jsx
│   │   ├── context/
│   │   │   └── AuthContext.jsx
│   │   ├── pages/
│   │   │   ├── Login.jsx
│   │   │   ├── Signup.jsx
│   │   │   ├── Dashboard.jsx
│   │   │   ├── Projects.jsx
│   │   │   ├── ProjectDetail.jsx
│   │   │   ├── MyTasks.jsx
│   │   │   └── Team.jsx
│   │   ├── utils/
│   │   │   └── api.js       # Axios instance
│   │   ├── App.jsx
│   │   ├── main.jsx
│   │   └── index.css        # Full design system
│   ├── index.html
│   ├── vite.config.js
│   └── package.json
├── .vscode/
│   ├── launch.json          # Debug config
│   └── tasks.json           # Run both servers task
├── railway.toml
├── nixpacks.toml
├── .gitignore
└── README.md
```

## 🎬 Demo Video Tips

1. Show signup as **Admin**, then signup as **Member** in incognito
2. As admin: create a project, add tasks with different priorities/statuses
3. Add the member to the project
4. As member: log in, view tasks, update status, add a comment
5. Show the Kanban board + dashboard stats
6. Show the overdue task warning
7. Show live Railway deployment URL

---

Built with ❤️ for the Full-Stack Assignment
