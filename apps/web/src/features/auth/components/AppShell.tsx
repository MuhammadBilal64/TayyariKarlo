import { Link, NavLink, Outlet } from 'react-router-dom';
import { Button } from '../../../shared/ui/Button';
import { useAuth } from '../hooks/useAuth';

const navClass = ({ isActive }: { isActive: boolean }) =>
  `cursor-pointer rounded-[8px] px-3 py-1.5 text-sm font-medium no-underline transition-[background-color,color,transform] duration-200 ease-out hover:no-underline active:translate-y-px ${
    isActive
      ? 'bg-signal-soft text-signal-hover shadow-[inset_0_0_0_1px_rgb(15_110_92/0.18)]'
      : 'text-ink-soft hover:bg-ink/5 hover:text-ink'
  }`;

export function AppShell() {
  const { user, logout } = useAuth();

  return (
    <div className="graph-bg flex min-h-screen flex-col">
      <header className="sticky top-0 z-20 border-b border-line/90 bg-paper-lift/85 px-5 py-3.5 backdrop-blur-md sm:px-8 lg:px-12">
        <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-3">
          <div className="flex min-w-0 flex-wrap items-center gap-x-4 gap-y-2">
            <Link
              to="/app"
              className="font-display shrink-0 cursor-pointer text-[1.45rem] tracking-[-0.02em] text-ink no-underline transition-opacity duration-200 hover:opacity-75 hover:no-underline"
            >
              TayyariKarlo
            </Link>
            <nav
              className="flex flex-wrap items-center gap-1"
              aria-label="Workspace"
            >
              <NavLink to="/app" end className={navClass}>
                Progress
              </NavLink>
              <NavLink to="/app/assessments" className={navClass}>
                Assessments
              </NavLink>
              <NavLink to="/app/interviews" className={navClass}>
                Interviews
              </NavLink>
            </nav>
          </div>
          <div className="flex items-center gap-3">
            {user ? (
              <p className="hidden m-0 max-w-[10rem] truncate text-sm text-ink-soft sm:block">
                {user.name}
              </p>
            ) : null}
            <Button
              variant="ghost"
              className="px-3 py-2 text-sm"
              onClick={() => {
                void logout();
              }}
            >
              Sign out
            </Button>
          </div>
        </div>
      </header>
      <main className="ui-enter mx-auto w-full max-w-3xl flex-1 px-5 py-10 sm:px-8 lg:px-12">
        <Outlet />
      </main>
    </div>
  );
}
