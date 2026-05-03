# Team Task Manager — API Reference

Complete REST API documentation with endpoint details, request/response examples.

## Base URL

```
http://127.0.0.1:8000/api
```

All requests (except auth) require JWT Bearer token:
```
Authorization: Bearer <access_token>
```

---

## Authentication Endpoints

### Register User

**POST** `/auth/register/`

Create a new user account.

**Request:**
```json
{
  "username": "john_doe",
  "email": "john@example.com",
  "password": "SecurePass123!"
}
```

**Response (201 Created):**
```json
{
  "id": 1,
  "username": "john_doe",
  "email": "john@example.com"
}
```

**Errors:**
- `400`: Missing required fields or password too short
- `400`: Username or email already exists

---

### Get JWT Tokens

**POST** `/auth/token/`

Authenticate and receive access + refresh tokens.

**Request:**
```json
{
  "username": "john_doe",
  "password": "SecurePass123!"
}
```

**Response (200 OK):**
```json
{
  "access": "eyJ0eXAiOiJKV1QiLCJhbGc...",
  "refresh": "eyJ0eXAiOiJKV1QiLCJhbGc..."
}
```

**Errors:**
- `401`: Invalid username or password

---

### Refresh Access Token

**POST** `/auth/token/refresh/`

Obtain a new access token using the refresh token.

**Request:**
```json
{
  "refresh": "<refresh_token>"
}
```

**Response (200 OK):**
```json
{
  "access": "<new_access_token>"
}
```

---

### Get Current User Info

**GET** `/auth/user/`

Get the authenticated user's profile.

**Response (200 OK):**
```json
{
  "id": 1,
  "username": "john_doe",
  "email": "john@example.com"
}
```

---

## Projects Endpoints

### List Projects

**GET** `/projects/`

Returns projects the user owns or is a member of.

**Query Parameters:**
- `page`: Page number (default: 1)
- `page_size`: Items per page (default: 10)

**Response (200 OK):**
```json
{
  "count": 2,
  "next": null,
  "previous": null,
  "results": [
    {
      "id": 1,
      "name": "Website Redesign",
      "description": "Redesign company website",
      "owner": {
        "id": 1,
        "username": "john_doe",
        "email": "john@example.com"
      },
      "is_private": true,
      "created_at": "2026-05-03T10:15:00Z"
    }
  ]
}
```

---

### Create Project

**POST** `/projects/`

Create a new project (owner = current user).

**Request:**
```json
{
  "name": "Mobile App",
  "description": "New iOS app",
  "is_private": true
}
```

**Response (201 Created):**
```json
{
  "id": 2,
  "name": "Mobile App",
  "description": "New iOS app",
  "owner": { "id": 1, "username": "john_doe", "email": "john@example.com" },
  "is_private": true,
  "created_at": "2026-05-03T10:20:00Z"
}
```

---

### Get Project Detail

**GET** `/projects/{id}/`

**Response (200 OK):**
```json
{
  "id": 1,
  "name": "Website Redesign",
  "description": "Redesign company website",
  "owner": { "id": 1, "username": "john_doe", "email": "john@example.com" },
  "is_private": true,
  "created_at": "2026-05-03T10:15:00Z"
}
```

---

### Update Project

**PUT** `/projects/{id}/`

Update project details (project owner only).

**Request:**
```json
{
  "name": "Website Redesign v2",
  "description": "Updated description",
  "is_private": false
}
```

---

### Delete Project

**DELETE** `/projects/{id}/`

Delete a project (owner only).

**Response (204 No Content)**

---

### Add Project Member

**POST** `/projects/{id}/add_member/`

Add a user to the project (project admin only).

**Request:**
```json
{
  "username": "jane_smith",
  "role": "member"
}
```

**Response (200 OK):**
```json
{
  "id": 1,
  "user": { "id": 2, "username": "jane_smith", "email": "jane@example.com" },
  "project": 1,
  "role": "member",
  "joined_at": "2026-05-03T10:25:00Z"
}
```

---

### Remove Project Member

**DELETE** `/projects/{id}/remove_member/`

Remove a user from the project (admin only).

**Request:**
```json
{
  "user_id": 2
}
```

**Response (204 No Content)**

---

## Tasks Endpoints

### List Tasks

**GET** `/tasks/`

Returns tasks in projects the user is a member of.

**Query Parameters:**
- `status`: Filter by status (todo, in_progress, done)
- `assignee`: Filter by assignee user ID
- `project`: Filter by project ID
- `page`, `page_size`: Pagination

**Response (200 OK):**
```json
{
  "count": 5,
  "next": null,
  "previous": null,
  "results": [
    {
      "id": 1,
      "title": "Design homepage",
      "description": "Create mockups and designs",
      "project": 1,
      "assignee": { "id": 2, "username": "jane_smith", "email": "jane@example.com" },
      "status": "in_progress",
      "priority": 1,
      "due_date": "2026-05-15",
      "created_by": { "id": 1, "username": "john_doe", "email": "john@example.com" },
      "created_at": "2026-05-03T10:30:00Z"
    }
  ]
}
```

---

### Create Task

**POST** `/tasks/`

Create a new task (in a project you're a member of).

**Request:**
```json
{
  "title": "Setup database",
  "description": "Configure PostgreSQL",
  "project": 1,
  "status": "todo",
  "priority": 2,
  "due_date": "2026-05-20"
}
```

**Response (201 Created):**
```json
{
  "id": 2,
  "title": "Setup database",
  "description": "Configure PostgreSQL",
  "project": 1,
  "assignee": null,
  "status": "todo",
  "priority": 2,
  "due_date": "2026-05-20",
  "created_by": { "id": 1, "username": "john_doe", "email": "john@example.com" },
  "created_at": "2026-05-03T10:35:00Z"
}
```

---

### Get Task Detail

**GET** `/tasks/{id}/`

**Response (200 OK):** Same as list item

---

### Update Task

**PUT** `/tasks/{id}/`

**Request:**
```json
{
  "title": "Updated title",
  "description": "Updated description",
  "priority": 3,
  "due_date": "2026-05-25"
}
```

---

### Delete Task

**DELETE** `/tasks/{id}/`

**Response (204 No Content)**

---

### Assign Task

**POST** `/tasks/{id}/assign/`

Assign task to a user.

**Request:**
```json
{
  "user_id": 2
}
```

**Response (200 OK):**
```json
{
  "id": 1,
  "title": "Design homepage",
  "...": "...",
  "assignee": { "id": 2, "username": "jane_smith", "email": "jane@example.com" },
  "..."": "..."
}
```

---

### Update Task Status

**POST** `/tasks/{id}/update_status/`

Change task status.

**Request:**
```json
{
  "status": "in_progress"
}
```

**Valid statuses:** `todo`, `in_progress`, `done`

**Response (200 OK):** Updated task object

---

## Dashboard Endpoints

### Get Dashboard Summary

**GET** `/dashboard/summary/`

Get task statistics for the current user.

**Response (200 OK):**
```json
{
  "total_tasks": 10,
  "completed": 3,
  "in_progress": 4,
  "todo": 3,
  "overdue": 1
}
```

---

### Get Overdue Tasks

**GET** `/dashboard/overdue/`

Get tasks assigned to user with due date in the past.

**Response (200 OK):**
```json
[
  {
    "id": 5,
    "title": "Fix login bug",
    "description": "...",
    "project": 1,
    "assignee": { "id": 1, "username": "john_doe", "email": "john@example.com" },
    "status": "todo",
    "priority": 1,
    "due_date": "2026-04-30",
    "created_by": { "id": 1, "username": "john_doe", "email": "john@example.com" },
    "created_at": "2026-04-25T10:00:00Z"
  }
]
```

---

### Get Upcoming Tasks

**GET** `/dashboard/upcoming/`

Get tasks assigned to user due in the next 7 days.

**Response (200 OK):** Same format as overdue tasks

---

## Memberships Endpoints

### List Memberships

**GET** `/memberships/`

List all project memberships (admin only).

**Response (200 OK):**
```json
{
  "count": 3,
  "next": null,
  "previous": null,
  "results": [
    {
      "id": 1,
      "user": { "id": 1, "username": "john_doe", "email": "john@example.com" },
      "project": 1,
      "role": "admin",
      "joined_at": "2026-05-03T10:15:00Z"
    }
  ]
}
```

---

### Update Membership Role

**PUT** `/memberships/{id}/`

Change user's role in project (admin only).

**Request:**
```json
{
  "role": "admin"
}
```

**Valid roles:** `member`, `admin`

---

## Error Responses

All errors follow this format:

**400 Bad Request:**
```json
{
  "field_name": ["Error message"],
  "another_field": ["Another error"]
}
```

**401 Unauthorized:**
```json
{
  "detail": "Authentication credentials were not provided."
}
```

**403 Forbidden:**
```json
{
  "detail": "You do not have permission to perform this action."
}
```

**404 Not Found:**
```json
{
  "detail": "Not found."
}
```

**500 Server Error:**
```json
{
  "detail": "Internal server error"
}
```

---

## Rate Limiting (To Be Implemented)

- 100 requests per hour for authenticated users
- 20 requests per hour for auth endpoints (per IP)

---

## Status Codes Reference

| Code | Meaning |
|------|---------|
| 200 | OK |
| 201 | Created |
| 204 | No Content |
| 400 | Bad Request |
| 401 | Unauthorized |
| 403 | Forbidden |
| 404 | Not Found |
| 500 | Server Error |

---

## Example cURL Commands

**Register:**
```bash
curl -X POST http://127.0.0.1:8000/api/auth/register/ \
  -H "Content-Type: application/json" \
  -d '{"username":"john","email":"john@example.com","password":"SecurePass123"}'
```

**Login:**
```bash
curl -X POST http://127.0.0.1:8000/api/auth/token/ \
  -H "Content-Type: application/json" \
  -d '{"username":"john","password":"SecurePass123"}'
```

**List projects (with token):**
```bash
curl -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  http://127.0.0.1:8000/api/projects/
```

**Create project:**
```bash
curl -X POST http://127.0.0.1:8000/api/projects/ \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"name":"My Project","description":"Test","is_private":true}'
```
