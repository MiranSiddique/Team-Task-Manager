import { useEffect, useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import AppShell from '../components/AppShell';
import apiClient from '../services/api';

interface Project {
  id: number;
  name: string;
}

interface Task {
  id: number;
  title: string;
  description: string;
  project: number;
  assignee: { id: number; username: string; email: string } | null;
  status: 'todo' | 'in_progress' | 'done';
  priority: number;
  due_date: string | null;
  created_by: { id: number; username: string; email: string } | null;
  created_at: string;
}

const statusLabels: Record<Task['status'], string> = {
  todo: 'To do',
  in_progress: 'In progress',
  done: 'Done',
};

export default function Tasks() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [projects, setProjects] = useState<Project[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | Task['status']>('all');
  const [form, setForm] = useState({ title: '', description: '', project: '', priority: '3', due_date: '' });
  const [submitting, setSubmitting] = useState(false);

  const activeProjectId = searchParams.get('project') || form.project;

  const projectMap = useMemo(() => new Map(projects.map((project) => [project.id, project.name])), [projects]);

  const loadData = async () => {
    setLoading(true);
    setError('');

    try {
      const [projectsResponse, tasksResponse] = await Promise.all([
        apiClient.get('/projects/'),
        apiClient.get('/tasks/'),
      ]);

      setProjects(projectsResponse.data);
      setTasks(tasksResponse.data);

      if (!form.project && projectsResponse.data.length > 0) {
        const firstProjectId = String(projectsResponse.data[0].id);
        setForm((current) => ({ ...current, project: firstProjectId }));
        if (!searchParams.get('project')) {
          setSearchParams({ project: firstProjectId });
        }
      }
    } catch (requestError) {
      console.error(requestError);
      setError('Unable to load tasks right now.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    if (searchParams.get('project') && searchParams.get('project') !== form.project) {
      setForm((current) => ({ ...current, project: searchParams.get('project') || current.project }));
    }
  }, [searchParams, form.project]);

  const filteredTasks = tasks.filter((task) => {
    if (statusFilter !== 'all' && task.status !== statusFilter) {
      return false;
    }

    if (activeProjectId && String(task.project) !== String(activeProjectId)) {
      return false;
    }

    return true;
  });

  const handleCreateTask = async (event: React.FormEvent) => {
    event.preventDefault();
    setSubmitting(true);
    setError('');

    try {
      await apiClient.post('/tasks/', {
        title: form.title,
        description: form.description,
        project: Number(form.project),
        priority: Number(form.priority),
        due_date: form.due_date || null,
      });
      setForm((current) => ({ ...current, title: '', description: '', priority: '3', due_date: '' }));
      await loadData();
    } catch (requestError: any) {
      console.error(requestError);
      setError(requestError.response?.data?.detail || 'Could not create task.');
    } finally {
      setSubmitting(false);
    }
  };

  const updateStatus = async (taskId: number, status: Task['status']) => {
    try {
      await apiClient.post(`/tasks/${taskId}/update_status/`, { status });
      await loadData();
    } catch (requestError: any) {
      console.error(requestError);
      setError(requestError.response?.data?.error || 'Could not update task status.');
    }
  };

  return (
    <AppShell
      title="Tasks"
      subtitle="Create work items, filter them by project, and move status with one click."
      actions={<Link className="button button--primary" to="/projects">Back to projects</Link>}
    >
      <div className="page-grid page-grid--two">
        <section className="panel panel--hero">
          <div className="panel__header">
            <div>
              <p className="panel__label">New task</p>
              <h2>Capture work</h2>
            </div>
            <span className="pill pill--accent">Saved to selected project</span>
          </div>

          <form className="stack" onSubmit={handleCreateTask}>
            <label className="field">
              <span>Title</span>
              <input
                value={form.title}
                onChange={(event) => setForm((current) => ({ ...current, title: event.target.value }))}
                placeholder="Design homepage banner"
                required
              />
            </label>

            <label className="field">
              <span>Description</span>
              <textarea
                value={form.description}
                onChange={(event) => setForm((current) => ({ ...current, description: event.target.value }))}
                placeholder="Add acceptance criteria, links, or context"
                rows={4}
              />
            </label>

            <div className="field-row">
              <label className="field">
                <span>Project</span>
                <select
                  value={form.project}
                  onChange={(event) => {
                    setForm((current) => ({ ...current, project: event.target.value }));
                    setSearchParams({ project: event.target.value });
                  }}
                  required
                >
                  <option value="">Select project</option>
                  {projects.map((project) => (
                    <option key={project.id} value={project.id}>
                      {project.name}
                    </option>
                  ))}
                </select>
              </label>

              <label className="field">
                <span>Priority</span>
                <select
                  value={form.priority}
                  onChange={(event) => setForm((current) => ({ ...current, priority: event.target.value }))}
                >
                  <option value="1">1 - Highest</option>
                  <option value="2">2 - High</option>
                  <option value="3">3 - Normal</option>
                  <option value="4">4 - Low</option>
                  <option value="5">5 - Backlog</option>
                </select>
              </label>
            </div>

            <label className="field">
              <span>Due date</span>
              <input
                type="date"
                value={form.due_date}
                onChange={(event) => setForm((current) => ({ ...current, due_date: event.target.value }))}
              />
            </label>

            {error ? <p className="inline-error">{error}</p> : null}

            <button className="button button--primary" type="submit" disabled={submitting || projects.length === 0}>
              {submitting ? 'Creating…' : 'Create task'}
            </button>
          </form>
        </section>

        <section className="panel panel--hero">
          <div className="panel__header">
            <div>
              <p className="panel__label">Filters</p>
              <h2>Focus the backlog</h2>
            </div>
            <span className="pill">{filteredTasks.length} visible</span>
          </div>

          <div className="stack">
            <label className="field">
              <span>Status</span>
              <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value as 'all' | Task['status'])}>
                <option value="all">All statuses</option>
                <option value="todo">To do</option>
                <option value="in_progress">In progress</option>
                <option value="done">Done</option>
              </select>
            </label>

            <div className="inline-list">
              <button className="button button--ghost" type="button" onClick={() => setStatusFilter('all')}>Reset</button>
              {projects.map((project) => (
                <button
                  key={project.id}
                  className={String(activeProjectId) === String(project.id) ? 'button button--secondary' : 'button button--ghost'}
                  type="button"
                  onClick={() => {
                    setForm((current) => ({ ...current, project: String(project.id) }));
                    setSearchParams({ project: String(project.id) });
                  }}
                >
                  {project.name}
                </button>
              ))}
            </div>

            <p className="field__hint">Showing tasks from the selected project. Switch projects to update the list.</p>
          </div>
        </section>
      </div>

      <section className="panel panel--list">
        <div className="panel__header">
          <div>
            <p className="panel__label">Task board</p>
            <h2>{filteredTasks.length} tasks</h2>
          </div>
          <p className="panel__meta">Project: {projectMap.get(Number(activeProjectId)) || 'All projects'}</p>
        </div>

        {loading ? (
          <div className="empty-state">Loading tasks…</div>
        ) : filteredTasks.length === 0 ? (
          <div className="empty-state">No tasks match the current filters.</div>
        ) : (
          <div className="task-stack">
            {filteredTasks.map((task) => (
              <article key={task.id} className="task-card">
                <div className="task-card__header">
                  <div>
                    <p className="task-card__eyebrow">#{task.id} · {projectMap.get(task.project) || `Project ${task.project}`}</p>
                    <h3>{task.title}</h3>
                  </div>
                  <span className={`pill pill--status pill--status-${task.status}`}>{statusLabels[task.status]}</span>
                </div>

                <p className="task-card__description">{task.description || 'No description provided.'}</p>

                <dl className="task-card__meta">
                  <div>
                    <dt>Priority</dt>
                    <dd>{task.priority}</dd>
                  </div>
                  <div>
                    <dt>Due</dt>
                    <dd>{task.due_date || 'None'}</dd>
                  </div>
                  <div>
                    <dt>Assignee</dt>
                    <dd>{task.assignee?.username || 'Unassigned'}</dd>
                  </div>
                </dl>

                <div className="card-actions">
                  <button className="button button--ghost" type="button" onClick={() => updateStatus(task.id, 'todo')}>To do</button>
                  <button className="button button--ghost" type="button" onClick={() => updateStatus(task.id, 'in_progress')}>In progress</button>
                  <button className="button button--secondary" type="button" onClick={() => updateStatus(task.id, 'done')}>Done</button>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>
    </AppShell>
  );
}