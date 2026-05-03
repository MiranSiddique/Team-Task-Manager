# Team Task Manager — Full-Stack App

A full-stack web application for team task management with role-based access control (RBAC), built with Django (backend) and React (frontend).

## Features

✅ **Authentication**: User signup/login with JWT tokens  
✅ **Project Management**: Create and manage projects  
✅ **Task Management**: Create, assign, and track task status  
✅ **Team Management**: Add members to projects with admin/member roles  
✅ **Dashboard**: View task summary, overdue tasks, and upcoming tasks  
✅ **Role-Based Access Control**: Admin and Member roles with permission enforcement  
✅ **REST API**: Fully documented REST endpoints with pagination and filtering  

## Tech Stack

**Backend:**
- Django 4.2
- Django REST Framework
- Simple JWT (token auth)
- PostgreSQL (or SQLite for dev)

**Frontend:**
- React 18 with TypeScript
- Vite (build tool)
- Zustand (state management)
- Axios (HTTP client)
- React Router (navigation)

## Quick Start

### Backend Setup (Local Dev with SQLite)

```bash
cd backend
python -m venv .venv
source .venv/Scripts/activate  # or on Linux/Mac: source .venv/bin/activate
pip install -r ../requirements.txt
python manage.py migrate
python manage.py runserver 127.0.0.1:8000
```

### Frontend Setup

```bash
cd frontend
npm install
npm run dev
```

Frontend will be available at `http://localhost:5173` (Vite dev server proxies `/api` to backend).

## Docker Setup (With PostgreSQL)

```bash
cd ..
cp .env.example .env
docker-compose up --build
```

This starts:
- Django backend at `http://localhost:8000`
- PostgreSQL at `localhost:5432`

## API Endpoints

### Authentication
- `POST /api/auth/register/` — Create new user
- `POST /api/auth/token/` — Get JWT tokens (username + password)
- `POST /api/auth/token/refresh/` — Refresh access token
- `GET /api/auth/user/` — Get current user info

### Projects
- `GET /api/projects/` — List user's projects
- `POST /api/projects/` — Create project
- `GET /api/projects/{id}/` — Get project detail
- `PUT /api/projects/{id}/` — Update project
- `DELETE /api/projects/{id}/` — Delete project
- `POST /api/projects/{id}/add_member/` — Add user to project
- `DELETE /api/projects/{id}/remove_member/` — Remove user from project

### Tasks
- `GET /api/tasks/` — List tasks in user's projects
- `POST /api/tasks/` — Create task
- `GET /api/tasks/{id}/` — Get task detail
- `PUT /api/tasks/{id}/` — Update task
- `DELETE /api/tasks/{id}/` — Delete task
- `POST /api/tasks/{id}/assign/` — Assign task to user
- `POST /api/tasks/{id}/update_status/` — Update task status (todo/in_progress/done)

### Dashboard
- `GET /api/dashboard/summary/` — Get task statistics
- `GET /api/dashboard/overdue/` — Get overdue tasks
- `GET /api/dashboard/upcoming/` — Get upcoming tasks (next 7 days)

### Memberships
- `GET /api/memberships/` — List project memberships (admin only)
- `POST /api/memberships/` — Create membership
- `PUT /api/memberships/{id}/` — Update membership role
- `DELETE /api/memberships/{id}/` — Remove membership

## Database Schema

**User** (Django built-in)
- id, username, email, password

**Project**
- id, name, description, owner (FK), is_private, created_at

**Membership**
- id, user (FK), project (FK), role (admin|member), joined_at

**Task**
- id, title, description, project (FK), assignee (FK, nullable), status (todo|in_progress|done), priority, due_date, created_by (FK), created_at

## Testing

Run backend tests:

```bash
cd backend
python manage.py test core.tests --verbosity 2
```

Current test coverage:
- User registration validation
- JWT token generation
- Token refresh
- Short password validation
- Duplicate username handling

## Roadmap

- [ ] Task comments and activity log
- [ ] Task filters (by status, assignee, due date)
- [ ] Project templates
- [ ] Export tasks (CSV/PDF)
- [ ] Email notifications
- [ ] Mobile app
- [ ] WebSocket for real-time updates

## Deployment

### On Heroku/Cloud

1. Set environment variables in `.env`
2. Configure database (PostgreSQL)
3. Run migrations: `python manage.py migrate`
4. Collect static files: `python manage.py collectstatic`
5. Start server

### Docker

```bash
docker-compose up -d
```

## Development Notes

- Backend runs on port 8000
- Frontend (dev) runs on port 5173
- Frontend proxies `/api` requests to backend (configured in `vite.config.ts`)
- Tokens are stored in localStorage on the frontend
- All API routes require authentication except signup and login

## Project Structure

```
.
├── backend/
│   ├── manage.py
│   ├── backend/
│   │   ├── settings.py
│   │   ├── urls.py
│   │   └── wsgi.py
│   └── core/
│       ├── models.py
│       ├── serializers.py
│       ├── views.py
│       ├── auth_views.py
│       ├── dashboard_views.py
│       ├── permissions.py
│       └── tests.py
├── frontend/
│   ├── src/
│   │   ├── pages/
│   │   │   ├── Login.tsx
│   │   │   ├── Register.tsx
│   │   │   └── Dashboard.tsx
│   │   ├── services/
│   │   │   └── api.ts
│   │   ├── store/
│   │   │   └── authStore.ts
│   │   ├── App.tsx
│   │   ├── main.tsx
│   │   └── index.css
│   ├── vite.config.ts
│   ├── tsconfig.json
│   └── package.json
├── docker-compose.yml
├── .env.example
└── requirements.txt
```