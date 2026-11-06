import { Link } from 'react-router-dom';
import { AuthLoading } from '../../auth/components/AuthLoading';
import { useAuth } from '../../auth/hooks/useAuth';
import { BrandLockup } from '../../../shared/ui/BrandLockup';
import { BrandMark } from '../../../shared/ui/BrandMark';
import { Button } from '../../../shared/ui/Button';

export function HomePage() {
  const { user, isAuthenticated, isBootstrapping, logout } = useAuth();

  if (isBootstrapping) {
    return <AuthLoading />;
  }

  return (
    <div className="graph-bg flex min-h-screen flex-col px-5 py-5 sm:px-8 sm:py-6 lg:px-12">
      <header className="flex items-center justify-between gap-4">
        <BrandLockup
          to="/"
          markClassName="h-8 w-8 shrink-0 text-ink"
          wordmarkClassName="font-display text-[1.65rem] tracking-[-0.02em] text-ink"
        />
        {!isAuthenticated ? (
          <nav className="flex items-center gap-3">
            <Link
              to="/login"
              className="cursor-pointer text-sm font-medium text-ink no-underline transition-colors duration-200 hover:text-signal hover:underline"
            >
              Sign in
            </Link>
            <Link
              to="/register"
              className="cursor-pointer no-underline hover:no-underline"
            >
              <Button className="px-3.5 py-2 text-sm">Create account</Button>
            </Link>
          </nav>
        ) : (
          <nav className="flex items-center gap-3">
            <Link
              to="/app"
              className="cursor-pointer no-underline hover:no-underline"
            >
              <Button className="px-3.5 py-2 text-sm">Open workspace</Button>
            </Link>
          </nav>
        )}
      </header>

      <section className="ui-enter mx-auto flex w-full max-w-2xl flex-1 flex-col justify-center py-16 sm:py-20">
        <p className="m-0 text-[0.72rem] font-semibold tracking-[0.16em] text-signal uppercase">
          Technical interview prep
        </p>
        <div className="mt-5 flex items-center gap-4 sm:gap-5">
          <BrandMark className="h-14 w-14 shrink-0 text-ink sm:h-16 sm:w-16" />
          <h1 className="font-display m-0 text-[clamp(2.4rem,6.5vw,4.2rem)] leading-none font-normal tracking-[-0.03em] text-ink">
            TayyariKarlo
          </h1>
        </div>
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
              <Link
                to="/app"
                className="cursor-pointer no-underline hover:no-underline"
              >
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
            <Link
              to="/register"
              className="cursor-pointer no-underline hover:no-underline"
            >
              <Button className="min-w-38">Create account</Button>
            </Link>
            <Link
              to="/login"
              className="cursor-pointer no-underline hover:no-underline"
            >
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
