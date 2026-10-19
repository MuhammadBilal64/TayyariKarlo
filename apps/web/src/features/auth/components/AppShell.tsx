import { Link, Outlet } from 'react-router-dom';
import { Button } from '../../../shared/ui/Button';
import { useAuth } from '../hooks/useAuth';

export function AppShell() {
  const { user, logout } = useAuth();

  return (
    <div className="graph-bg flex min-h-screen flex-col">
      <header className="flex items-center justify-between gap-4 border-b border-line bg-paper-lift/80 px-5 py-4 backdrop-blur-sm sm:px-8 lg:px-12">
        <Link
          to="/app"
          className="font-display text-[1.45rem] tracking-[-0.02em] text-ink no-underline hover:no-underline"
        >
          TayyariKarlo
        </Link>
        <div className="flex items-center gap-3">
          {user ? (
            <p className="hidden m-0 text-sm text-ink-soft sm:block">
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
      </header>
      <main className="mx-auto w-full max-w-3xl flex-1 px-5 py-10 sm:px-8 lg:px-12">
        <Outlet />
      </main>
    </div>
  );
}
