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
    <div className="app-canvas relative flex min-h-screen flex-col overflow-hidden">
      {/* Steel Stage watermark — approved hero-v3-steel-stage */}
      <div
        aria-hidden
        className="pointer-events-none absolute top-[48%] right-[-28%] hidden -translate-y-1/2 sm:right-[-16%] md:block lg:right-[-4%] xl:right-[4%]"
      >
        <BrandMark
          decorative
          className="h-[min(58vw,36rem)] w-[min(58vw,36rem)] text-ink opacity-[0.09]"
        />
      </div>

      <header className="relative z-10 flex items-center justify-between gap-4 px-5 py-5 sm:px-8 sm:py-6 lg:px-12">
        <BrandLockup
          to="/"
          markClassName="h-8 w-8 shrink-0 text-ink"
          wordmarkClassName="font-display text-[1.35rem] tracking-[-0.02em] text-ink sm:text-[1.45rem]"
        />
        {!isAuthenticated ? (
          <nav className="flex items-center gap-4">
            <Link
              to="/login"
              className="cursor-pointer text-sm font-medium text-ink no-underline transition-colors duration-200 hover:text-signal hover:underline"
            >
              Sign in
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

      <section className="ui-enter relative z-10 mx-auto flex w-full max-w-6xl flex-1 flex-col justify-center px-5 py-16 sm:px-8 sm:py-20 lg:px-12">
        <div className="max-w-xl">
          <p className="m-0 text-[0.72rem] font-semibold tracking-[0.16em] text-signal uppercase">
            Close the gap
          </p>
          <h1 className="font-display mt-5 m-0 text-[clamp(2.35rem,6vw,3.75rem)] leading-[1.05] font-bold tracking-[-0.03em] text-ink">
            Practice until the signal is clean.
          </h1>
          <p className="mt-5 max-w-md text-base leading-relaxed text-ink-soft sm:text-[1.05rem]">
            See weak topics. Rehearse interviews. Handle messy evidence.
          </p>

          {isAuthenticated && user ? (
            <div className="mt-9">
              <p className="m-0 text-[0.95rem] text-ink-soft">
                Signed in as{' '}
                <strong className="font-semibold text-ink">{user.name}</strong>
              </p>
              <div className="mt-5 flex flex-wrap gap-3">
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
            <div className="mt-9 flex flex-wrap items-center gap-3">
              <Link
                to="/register"
                className="cursor-pointer no-underline hover:no-underline"
              >
                <Button className="min-w-40">Create account</Button>
              </Link>
              <Link
                to="/login"
                className="cursor-pointer no-underline hover:no-underline"
              >
                <Button variant="ghost" className="min-w-32">
                  Sign in
                </Button>
              </Link>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
