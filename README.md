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
python manage.py makemigrations core
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

## Railway Deployment

This app is configured for production deployment on [Railway](https://railway.app) at https://team-task-managerfe-production.up.railway.app/ . Follow these steps:

### Prerequisites
- GitHub repository connected to Railway
- Railway project created

### 1. Deploy Backend (Web Service)

1. Create a new **Web Service** in Railway from your GitHub repo.
2. Set the build and deploy configuration:
   - **Root Directory**: `.` (repo root)
   - **Builder**: Dockerfile
   - **Dockerfile Path**: `backend/Dockerfile`
3. Add environment variables:
   - `SECRET_KEY`: Generate a strong key (e.g., `django-insecure-...`)
   - `DEBUG`: `0`
   - `DJANGO_ALLOWED_HOSTS`: `your-backend-domain.up.railway.app,.up.railway.app,localhost,127.0.0.1`
   - `CORS_ALLOWED_ORIGINS`: `https://your-frontend-domain.up.railway.app`
4. Add PostgreSQL plugin to the service (Railway will auto-set `DATABASE_URL`).
5. Deploy and wait for the service to be healthy.

### 2. Deploy Frontend (Static Site)

1. Create a new **Static Site** service in Railway from the same GitHub repo.
2. Set the build configuration:
   - **Root Directory**: `frontend`
   - **Builder**: Railpack (or default)
   - **Build Command**: `npm run build`
   - **Publish Directory**: `dist`
3. Add environment variable:
   - `VITE_API_BASE_URL`: `https://your-backend-domain.up.railway.app/api`
4. Deploy and wait for it to be healthy.

### 3. Verify Deployment

- Open the frontend Railway URL.
- Register a new account.
- Verify login and dashboard load.
- Check browser Network tab for successful API calls to your backend domain.

### Troubleshooting

**"Invalid HTTP_HOST header"** error:
- Ensure `DJANGO_ALLOWED_HOSTS` includes your backend domain exactly as shown in the error.
- Redeploy the backend after updating.

**"Relation does not exist"** error:
- Run migrations in your local backend: `python manage.py makemigrations core && python manage.py migrate`
- Commit and push migration files to GitHub.
- Redeploy the backend (migrations will run automatically).

**CORS errors on frontend**:
- Ensure `CORS_ALLOWED_ORIGINS` on the backend includes your frontend domain.
- Ensure `VITE_API_BASE_URL` on the frontend points to your backend domain (with `/api` suffix).
- Redeploy both services after changes.

**Login fails / JWT errors**:
- Verify `SECRET_KEY` is set on the backend (same value for all deployments).
- Check that `DATABASE_URL` is set and the Postgres service is healthy.

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

**Note**: Tests use SQLite in-memory DB. Migrations are applied automatically during test setup.

## Roadmap

- [ ] Task comments and activity log
- [ ] Task filters (by status, assignee, due date)
- [ ] Project templates
- [ ] Export tasks (CSV/PDF)
- [ ] Email notifications
- [ ] Mobile app
- [ ] WebSocket for real-time updates

## Production Ready Features

✅ Railway deployment (see [Railway Deployment](#railway-deployment) section)  
✅ Docker Compose setup with PostgreSQL  
✅ JWT authentication with token refresh  
✅ CORS configuration for multi-domain deployments  
✅ Static file serving with WhiteNoise  
✅ Gunicorn production server  
✅ Database migrations  

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