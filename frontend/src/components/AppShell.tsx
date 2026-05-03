import { ReactNode } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';

const navigation = [
  { label: 'Dashboard', to: '/dashboard' },
  { label: 'Projects', to: '/projects' },
  { label: 'Tasks', to: '/tasks' },
  { label: 'Team', to: '/teams' },
];

type AppShellProps = {
  title: string;
  subtitle?: string;
  actions?: ReactNode;
  children: ReactNode;
};

export default function AppShell({ title, subtitle, actions, children }: AppShellProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const user = useAuthStore((state) => state.user);
  const logout = useAuthStore((state) => state.logout);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="app-shell">
      <div className="app-shell__glow app-shell__glow--one" />
      <div className="app-shell__glow app-shell__glow--two" />

      <header className="topbar">
        <Link to="/dashboard" className="brand-lockup">
          <span className="brand-mark">TTM</span>
          <span>
            <strong>Team Task Manager</strong>
            <small>Projects, tasks, and team flow</small>
          </span>
        </Link>

        <nav className="topnav">
          {navigation.map((item) => {
            const active = location.pathname === item.to || location.pathname.startsWith(`${item.to}/`);
            return (
              <Link key={item.to} to={item.to} className={active ? 'topnav__link topnav__link--active' : 'topnav__link'}>
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="topbar__user">
          <div className="topbar__user-meta">
            <span>{user?.username}</span>
            <small>{user?.email}</small>
          </div>
          <button type="button" className="button button--ghost" onClick={handleLogout}>
            Logout
          </button>
        </div>
      </header>

      <main className="page-shell">
        <section className="page-hero">
          <div>
            <p className="eyebrow">Workspace</p>
            <h1>{title}</h1>
            {subtitle ? <p className="page-hero__subtitle">{subtitle}</p> : null}
          </div>
          {actions ? <div className="page-hero__actions">{actions}</div> : null}
        </section>

        {children}
      </main>
    </div>
  );
}