import { Link } from 'react-router-dom';
import { AuthLoading } from '../../auth/components/AuthLoading';
import { useAuth } from '../../auth/hooks/useAuth';
import { Button } from '../../../shared/ui/Button';

export function HomePage() {
  const { user, isAuthenticated, isBootstrapping, logout } = useAuth();

  if (isBootstrapping) {
    return <AuthLoading />;
  }

  return (
    <div className="graph-bg flex min-h-screen flex-col px-5 py-5 sm:px-8 sm:py-6 lg:px-12">
      <header className="flex items-center justify-between gap-4">
        <Link
          to="/"
          className="font-display text-[1.65rem] tracking-[-0.02em] text-ink no-underline hover:no-underline"
        >
          TayyariKarlo
        </Link>
        {!isAuthenticated ? (
          <nav>
            <Link to="/login" className="text-sm font-medium">
              Sign in
            </Link>
          </nav>
        ) : null}
      </header>

      <section className="mx-auto flex w-full max-w-2xl flex-1 flex-col justify-center py-16 sm:py-20">
        <p className="m-0 text-[0.72rem] font-semibold tracking-[0.16em] text-signal uppercase">
          Technical interview prep
        </p>
        <h1 className="font-display mt-3 text-[clamp(2.8rem,7vw,4.6rem)] leading-none font-normal tracking-[-0.03em] text-ink">
          TayyariKarlo
        </h1>
        <p className="mt-4 max-w-md text-base leading-relaxed text-ink-soft">
          Practice assessments, see where you are weak, and rehearse interviews
          before the real round.
        </p>

        {isAuthenticated && user ? (
          <div className="mt-8 max-w-md border-t border-line pt-5">
            <p className="m-0 text-[0.95rem] text-ink-soft">
              Signed in as{' '}
              <strong className="font-semibold text-ink">{user.name}</strong> (
              {user.email})
            </p>
            <div className="mt-4 flex flex-wrap gap-3">
              <Link to="/app" className="no-underline hover:no-underline">
                <Button>Open workspace</Button>
              </Link>
              <Button
                variant="ghost"
                onClick={() => {
                  void logout();
                }}
              >
                Sign out
              </Button>
            </div>
          </div>
        ) : (
          <div className="mt-8 flex flex-wrap gap-3">
            <Link to="/register" className="no-underline hover:no-underline">
              <Button className="min-w-38">Create account</Button>
            </Link>
            <Link to="/login" className="no-underline hover:no-underline">
              <Button variant="ghost" className="min-w-38">
                Sign in
              </Button>
            </Link>
          </div>
        )}
      </section>
    </div>
  );
}
