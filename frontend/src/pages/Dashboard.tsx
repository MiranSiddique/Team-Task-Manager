import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import AppShell from '../components/AppShell';
import apiClient from '../services/api';

interface DashboardSummary {
  total_tasks: number;
  completed: number;
  in_progress: number;
  todo: number;
  overdue: number;
}

export default function Dashboard() {
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSummary();
  }, []);

  const fetchSummary = async () => {
    try {
      const response = await apiClient.get('/dashboard/summary/');
      setSummary(response.data);
    } catch (error) {
      console.error('Failed to fetch dashboard summary:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="loading-screen">Loading dashboard…</div>;
  }

  return (
    <AppShell
      title="Dashboard"
      subtitle="A compact view of your task health, progress, and overdue work."
      actions={
        <div className="inline-list">
          <Link className="button button--primary" to="/projects">Projects</Link>
          <Link className="button button--secondary" to="/tasks">Tasks</Link>
        </div>
      }
    >
      <div className="summary-grid">
        <div className="stat-card">
          <h3>Total Tasks</h3>
          <p className="metric">{summary?.total_tasks || 0}</p>
        </div>
        <div className="stat-card">
          <h3>Completed</h3>
          <p className="metric metric--green">{summary?.completed || 0}</p>
        </div>
        <div className="stat-card">
          <h3>In Progress</h3>
          <p className="metric metric--blue">{summary?.in_progress || 0}</p>
        </div>
        <div className="stat-card">
          <h3>To Do</h3>
          <p className="metric metric--amber">{summary?.todo || 0}</p>
        </div>
        <div className="stat-card">
          <h3>Overdue</h3>
          <p className="metric metric--red">{summary?.overdue || 0}</p>
        </div>
      </div>

      <div className="page-grid page-grid--three">
        <section className="panel">
          <p className="panel__label">Start here</p>
          <h2>Create or join a project</h2>
          <p className="panel__copy">Use the projects page to make a new workspace or join one by ID.</p>
          <Link className="button button--ghost" to="/projects">Open projects</Link>
        </section>

        <section className="panel">
          <p className="panel__label">Work queue</p>
          <h2>Plan tasks</h2>
          <p className="panel__copy">Create tasks, filter by project, and push status changes from the task board.</p>
          <Link className="button button--ghost" to="/tasks">Open tasks</Link>
        </section>

        <section className="panel">
          <p className="panel__label">Team</p>
          <h2>Invite members</h2>
          <p className="panel__copy">Add teammates to a project and manage their role from the team screen.</p>
          <Link className="button button--ghost" to="/teams">Open team</Link>
        </section>
      </div>
    </AppShell>
  );
}
