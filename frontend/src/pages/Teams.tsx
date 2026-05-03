import { useEffect, useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import AppShell from '../components/AppShell';
import apiClient from '../services/api';

interface Project {
  id: number;
  name: string;
  description: string;
  owner: { id: number; username: string; email: string };
}

interface Membership {
  id: number;
  user: { id: number; username: string; email: string };
  project: number;
  role: 'admin' | 'member';
  joined_at: string;
}

export default function Teams() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [projects, setProjects] = useState<Project[]>([]);
  const [memberships, setMemberships] = useState<Membership[]>([]);
  const [loading, setLoading] = useState(true);
  const [membersLoading, setMembersLoading] = useState(false);
  const [error, setError] = useState('');
  const [memberError, setMemberError] = useState('');
  const [form, setForm] = useState({ username: '', role: 'member' });

  const activeProjectId = searchParams.get('project') || String(projects[0]?.id || '');

  const activeProject = useMemo(
    () => projects.find((project) => String(project.id) === String(activeProjectId)),
    [projects, activeProjectId],
  );

  const projectMemberships = useMemo(
    () => memberships.filter((membership) => String(membership.project) === String(activeProjectId)),
    [memberships, activeProjectId],
  );

  const loadProjects = async () => {
    setLoading(true);
    setError('');

    try {
      const response = await apiClient.get('/projects/');
      setProjects(response.data);

      if (!searchParams.get('project') && response.data.length > 0) {
        setSearchParams({ project: String(response.data[0].id) });
      }
    } catch (requestError) {
      console.error(requestError);
      setError('Unable to load projects.');
    } finally {
      setLoading(false);
    }
  };

  const loadMembers = async (projectId: string) => {
    if (!projectId) {
      setMemberships([]);
      return;
    }

    setMembersLoading(true);
    setMemberError('');

    try {
      const response = await apiClient.get(`/projects/${projectId}/members/`);
      setMemberships(response.data);
    } catch (requestError) {
      console.error(requestError);
      setMemberError('Unable to load team members.');
    } finally {
      setMembersLoading(false);
    }
  };

  useEffect(() => {
    loadProjects();
  }, []);

  useEffect(() => {
    if (activeProjectId) {
      loadMembers(activeProjectId);
    }
  }, [activeProjectId]);

  const handleAddMember = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!activeProjectId) {
      setMemberError('Select a project first.');
      return;
    }

    try {
      await apiClient.post(`/projects/${activeProjectId}/add_member/`, form);
      setForm({ username: '', role: 'member' });
      await loadMembers(activeProjectId);
    } catch (requestError: any) {
      console.error(requestError);
      setMemberError(requestError.response?.data?.error || 'Could not add member.');
    }
  };

  const handleRemoveMember = async (userId: number) => {
    try {
      await apiClient.delete(`/projects/${activeProjectId}/remove_member/`, { data: { user_id: userId } });
      await loadMembers(activeProjectId);
    } catch (requestError: any) {
      console.error(requestError);
      setMemberError(requestError.response?.data?.error || 'Could not remove member.');
    }
  };

  return (
    <AppShell
      title="Team management"
      subtitle="Invite people into a project, review their role, and remove members when the team changes."
      actions={<Link className="button button--primary" to="/projects">Back to projects</Link>}
    >
      <div className="page-grid page-grid--two">
        <section className="panel panel--hero">
          <div className="panel__header">
            <div>
              <p className="panel__label">Project picker</p>
              <h2>Choose a workspace</h2>
            </div>
            <span className="pill">{projects.length} projects</span>
          </div>

          <div className="stack">
            <label className="field">
              <span>Project</span>
              <select
                value={activeProjectId}
                onChange={(event) => setSearchParams({ project: event.target.value })}
              >
                {projects.map((project) => (
                  <option key={project.id} value={project.id}>
                    {project.name}
                  </option>
                ))}
              </select>
            </label>

            {activeProject ? (
              <div className="project-summary">
                <h3>{activeProject.name}</h3>
                <p>{activeProject.description || 'No description provided.'}</p>
                <p className="field__hint">Owner: {activeProject.owner.username}</p>
              </div>
            ) : (
              <div className="empty-state">Create a project first, then return here to manage the team.</div>
            )}
          </div>
        </section>

        <section className="panel panel--hero">
          <div className="panel__header">
            <div>
              <p className="panel__label">Add member</p>
              <h2>Invite by username</h2>
            </div>
            <span className="pill pill--accent">Admin access recommended</span>
          </div>

          <form className="stack" onSubmit={handleAddMember}>
            <label className="field">
              <span>Username</span>
              <input
                value={form.username}
                onChange={(event) => setForm((current) => ({ ...current, username: event.target.value }))}
                placeholder="jane.doe"
                required
              />
            </label>

            <label className="field">
              <span>Role</span>
              <select value={form.role} onChange={(event) => setForm((current) => ({ ...current, role: event.target.value }))}>
                <option value="member">Member</option>
                <option value="admin">Admin</option>
              </select>
            </label>

            {memberError ? <p className="inline-error">{memberError}</p> : <p className="field__hint">The backend checks whether you are allowed to manage the team.</p>}

            <button className="button button--secondary" type="submit" disabled={!activeProjectId}>
              Add member
            </button>
          </form>
        </section>
      </div>

      <section className="panel panel--list">
        <div className="panel__header">
          <div>
            <p className="panel__label">Team roster</p>
            <h2>{projectMemberships.length} members</h2>
          </div>
          <p className="panel__meta">{activeProject ? activeProject.name : 'No project selected'}</p>
        </div>

        {loading || membersLoading ? (
          <div className="empty-state">Loading team members…</div>
        ) : error ? (
          <div className="empty-state">{error}</div>
        ) : projectMemberships.length === 0 ? (
          <div className="empty-state">No team members found for this project.</div>
        ) : (
          <div className="task-stack">
            {projectMemberships.map((membership) => {
              const isOwner = activeProject?.owner.id === membership.user.id;

              return (
                <article key={membership.id} className="task-card task-card--member">
                  <div className="task-card__header">
                    <div>
                      <p className="task-card__eyebrow">User #{membership.user.id}</p>
                      <h3>{membership.user.username}</h3>
                    </div>
                    <span className={membership.role === 'admin' ? 'pill pill--accent' : 'pill'}>{membership.role}</span>
                  </div>

                  <p className="task-card__description">{membership.user.email}</p>

                  <div className="card-actions">
                    <button className="button button--ghost" type="button" onClick={() => handleRemoveMember(membership.user.id)} disabled={isOwner}>
                      {isOwner ? 'Project owner' : 'Remove'}
                    </button>
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