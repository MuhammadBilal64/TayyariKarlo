import { NavLink, Outlet, useLocation } from 'react-router-dom';
import { BrandLockup } from '../../../shared/ui/BrandLockup';
import { Button } from '../../../shared/ui/Button';
import { useAuth } from '../hooks/useAuth';

function WorkspaceNavLink({
  to,
  end,
  children,
}: {
  to: string;
  end?: boolean;
  children: string;
}) {
  return (
    <NavLink
      to={to}
      end={end}
      className={({ isActive }) =>
        `relative inline-flex cursor-pointer items-center border-b-2 px-2.5 py-2 text-[0.9375rem] no-underline transition-[color,border-color] duration-200 ease-out hover:no-underline ${
          isActive
            ? 'border-ink font-semibold text-ink'
            : 'border-transparent font-medium text-ink-soft hover:text-ink'
        }`
      }
    >
      {({ isActive }) => (
        <>
          {isActive ? (
            <span
              aria-hidden
              className="absolute top-0.5 left-1/2 size-1 -translate-x-1/2 rotate-45 bg-signal"
            />
          ) : null}
          {children}
        </>
      )}
    </NavLink>
  );
}

export function AppShell() {
  const { user, logout } = useAuth();
  const { pathname } = useLocation();
  const wideDesk = pathname.includes('/interviews/signal/');

  return (
    <div className="app-canvas flex min-h-screen flex-col">
      <header className="sticky top-0 z-20 border-b border-line bg-surface px-5 py-3 sm:px-8 lg:px-12">
        <div className="flex flex-wrap items-center justify-between gap-x-6 gap-y-3">
          <div className="flex min-w-0 flex-wrap items-center gap-x-7 gap-y-2">
            <BrandLockup
              to="/app"
              className="shrink-0"
              markClassName="h-7 w-7 shrink-0 text-ink"
              wordmarkClassName="font-display text-[1.35rem] tracking-[-0.02em] text-ink"
            />
            <nav
              className="flex flex-wrap items-center gap-1"
              aria-label="Workspace"
            >
              <WorkspaceNavLink to="/app" end>
                Progress
              </WorkspaceNavLink>
              <WorkspaceNavLink to="/app/assessments">
                Assessments
              </WorkspaceNavLink>
              <WorkspaceNavLink to="/app/interviews">
                Interviews
              </WorkspaceNavLink>
            </nav>
          </div>
          <div className="flex items-center gap-3.5">
            {user ? (
              <p className="m-0 hidden max-w-[11rem] truncate text-sm text-ink-soft sm:block">
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
      <main
        className={`ui-enter mx-auto w-full flex-1 px-5 py-9 sm:px-8 lg:px-10 lg:py-11 ${
          wideDesk ? 'max-w-[72rem]' : 'max-w-[48rem]'
        }`}
      >
        <Outlet />
      </main>
    </div>
  );
}
