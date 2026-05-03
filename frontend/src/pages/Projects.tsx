import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import AppShell from '../components/AppShell';
import apiClient from '../services/api';
import { useAuthStore } from '../store/authStore';

interface Project {
  id: number;
  name: string;
  description: string;
  owner: { id: number; username: string; email: string };
  is_private: boolean;
  created_at: string;
}

interface Membership {
  id: number;
  user: { id: number; username: string; email: string };
  project: number;
  role: 'admin' | 'member';
  joined_at: string;
}

export default function Projects() {
  const user = useAuthStore((state) => state.user);
  const [projects, setProjects] = useState<Project[]>([]);
  const [memberships, setMemberships] = useState<Membership[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [joinError, setJoinError] = useState('');
  const [joiningProjectId, setJoiningProjectId] = useState('');
  const [form, setForm] = useState({ name: '', description: '', is_private: true });
  const [submitting, setSubmitting] = useState(false);

  const membershipMap = useMemo(() => {
    return new Map(memberships.map((membership) => [membership.project, membership]));
  }, [memberships]);

  const loadData = async () => {
    setLoading(true);
    setError('');

    try {
      const [projectsResponse, membershipsResponse] = await Promise.all([
        apiClient.get('/projects/'),
        apiClient.get('/memberships/'),
      ]);

      setProjects(projectsResponse.data);
      setMemberships(membershipsResponse.data);
    } catch (requestError) {
      console.error(requestError);
      setError('Unable to load projects right now.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleCreateProject = async (event: React.FormEvent) => {
    event.preventDefault();
    setSubmitting(true);
    setError('');

    try {
      await apiClient.post('/projects/', form);
      setForm({ name: '', description: '', is_private: true });
      await loadData();
    } catch (requestError: any) {
      console.error(requestError);
      setError(requestError.response?.data?.detail || 'Could not create project.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleJoinProject = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!joiningProjectId) {
      setJoinError('Enter a project ID first.');
      return;
    }

    setJoinError('');
    try {
      await apiClient.post(`/projects/${joiningProjectId}/join/`);
      setJoiningProjectId('');
      await loadData();
    } catch (requestError: any) {
      console.error(requestError);
      setJoinError(requestError.response?.data?.error || 'Could not join project.');
    }
  };

  const handleLeaveProject = async (projectId: number) => {
    try {
      await apiClient.post(`/projects/${projectId}/leave/`);
      await loadData();
    } catch (requestError: any) {
      console.error(requestError);
      setError(requestError.response?.data?.error || 'Could not leave project.');
    }
  };

  return (
    <AppShell
      title="Projects"
      subtitle="Create a workspace, join one by ID, and manage your active projects from a single screen."
      actions={<Link className="button button--primary" to="/teams">Manage team members</Link>}
    >
      <div className="page-grid page-grid--two">
        <section className="panel panel--hero">
          <div className="panel__header">
            <div>
              <p className="panel__label">Create project</p>
              <h2>Start a new workspace</h2>
            </div>
            <span className="pill pill--accent">Owner becomes admin</span>
          </div>

          <form className="stack" onSubmit={handleCreateProject}>
            <label className="field">
              <span>Name</span>
              <input
                value={form.name}
                onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))}
                placeholder="Product launch"
                required
              />
            </label>

            <label className="field">
              <span>Description</span>
              <textarea
                value={form.description}
                onChange={(event) => setForm((current) => ({ ...current, description: event.target.value }))}
                placeholder="Track milestones, owners, and deliverables"
                rows={4}
              />
            </label>

            <label className="toggle-row">
              <input
                type="checkbox"
                checked={form.is_private}
                onChange={(event) => setForm((current) => ({ ...current, is_private: event.target.checked }))}
              />
              <span>Private project</span>
            </label>

            {error ? <p className="inline-error">{error}</p> : null}

            <button className="button button--primary" type="submit" disabled={submitting}>
              {submitting ? 'Creating…' : 'Create project'}
            </button>
          </form>
        </section>

        <section className="panel panel--hero">
          <div className="panel__header">
            <div>
              <p className="panel__label">Join project</p>
              <h2>Enter a project ID</h2>
            </div>
            <span className="pill">Self-service join</span>
          </div>

          <form className="stack" onSubmit={handleJoinProject}>
            <label className="field">
              <span>Project ID</span>
              <input
                value={joiningProjectId}
                onChange={(event) => setJoiningProjectId(event.target.value)}
                placeholder="e.g. 1"
              />
            </label>

            {joinError ? <p className="inline-error">{joinError}</p> : <p className="field__hint">Use the numeric ID shared by the project owner.</p>}

            <button className="button button--secondary" type="submit">
              Join project
            </button>
          </form>
        </section>
      </div>

      <section className="panel panel--list">
        <div className="panel__header">
          <div>
            <p className="panel__label">Your projects</p>
            <h2>{projects.length} active workspaces</h2>
          </div>
          <p className="panel__meta">Logged in as {user?.username}</p>
        </div>

        {loading ? (
          <div className="empty-state">Loading projects…</div>
        ) : projects.length === 0 ? (
          <div className="empty-state">No projects yet. Create one above to get started.</div>
        ) : (
          <div className="card-grid">
            {projects.map((project) => {
              const membership = membershipMap.get(project.id);
              const isOwner = project.owner.id === user?.id;

              return (
                <article key={project.id} className="project-card">
                  <div className="project-card__header">
                    <div>
                      <p className="project-card__eyebrow">#{project.id}</p>
                      <h3>{project.name}</h3>
                    </div>
                    <span className={project.is_private ? 'pill pill--muted' : 'pill pill--accent'}>{project.is_private ? 'Private' : 'Public'}</span>
                  </div>

                  <p className="project-card__description">{project.description || 'No description provided.'}</p>

                  <dl className="project-card__meta">
                    <div>
                      <dt>Owner</dt>
                      <dd>{project.owner.username}</dd>
                    </div>
                    <div>
                      <dt>Your role</dt>
                      <dd>{membership?.role || (isOwner ? 'admin' : 'viewer')}</dd>
                    </div>
                  </dl>

                  <div className="card-actions">
                    <Link className="button button--ghost" to={`/teams?project=${project.id}`}>
                      Team
                    </Link>
                    <Link className="button button--ghost" to={`/tasks?project=${project.id}`}>
                      Tasks
                    </Link>
                    {membership && !isOwner ? (
                      <button className="button button--secondary" type="button" onClick={() => handleLeaveProject(project.id)}>
                        Leave
                      </button>
                    ) : null}
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </section>
    </AppShell>
  );
}