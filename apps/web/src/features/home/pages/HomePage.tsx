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
    <div
      className="relative flex min-h-screen flex-col overflow-hidden"
      style={{
        background:
          'linear-gradient(165deg, #f5f7fa 0%, #f1f3f7 42%, #e8ecf2 100%)',
      }}
    >
      {/* Steel Stage watermark — sized to sit quietly beside copy */}
      <div
        aria-hidden
        className="pointer-events-none absolute top-[52%] right-[-6%] hidden -translate-y-1/2 md:block lg:right-[4%] xl:right-[8%]"
      >
        <BrandMark
          decorative
          className="h-[min(42vw,26rem)] w-[min(42vw,26rem)] text-ink opacity-[0.08]"
        />
      </div>

      <header className="relative z-10 flex shrink-0 items-center justify-between gap-4 px-5 py-5 sm:px-8 sm:py-6 lg:px-12">
        <BrandLockup
          to="/"
          markClassName="h-8 w-8 shrink-0 text-ink"
          wordmarkClassName="font-display text-[1.35rem] tracking-[-0.02em] text-ink sm:text-[1.45rem]"
        />
        {isAuthenticated ? (
          <nav className="flex items-center gap-3">
            <Link
              to="/app"
              className="cursor-pointer no-underline hover:no-underline"
            >
              <Button className="px-3.5 py-2 text-sm">Open workspace</Button>
            </Link>
          </nav>
        ) : null}
      </header>

      <section className="ui-enter relative z-10 mx-auto flex w-full max-w-6xl flex-1 flex-col justify-center px-5 pb-[12vh] pt-6 sm:px-8 lg:px-12">
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
