import { Link } from 'react-router-dom';
import { AuthLoading } from '../../auth/components/AuthLoading';
import { useAuth } from '../../auth/hooks/useAuth';
import { BrandLockup } from '../../../shared/ui/BrandLockup';
import { Button } from '../../../shared/ui/Button';
import { HeroOrbitMark } from '../components/HeroOrbitMark';

const pillars = [
  { label: 'Assessments', detail: 'Topic sets that expose weak spots' },
  { label: 'Progress', detail: 'Trends you can actually act on' },
  { label: 'Interviews', detail: 'Classic oral + Signal Integrity' },
] as const;

export function HomePage() {
  const { user, isAuthenticated, isBootstrapping, logout } = useAuth();

  if (isBootstrapping) {
    return <AuthLoading />;
  }

  return (
    <div className="home-steel-stage relative flex min-h-screen flex-col overflow-hidden">
      {/* Ambient signal wash behind the orbit */}
      <div
        aria-hidden
        className="home-orbit-glow pointer-events-none absolute top-[46%] right-[6%] hidden h-[22rem] w-[22rem] -translate-y-1/2 rounded-full md:block lg:right-[10%] xl:right-[12%]"
      />

      <div
        aria-hidden
        className="pointer-events-none absolute top-[52%] right-[6%] hidden -translate-y-1/2 md:block lg:right-[10%] xl:right-[12%]"
      >
        {/* ~18rem / ≤28vw keeps mark ~25–30% of desktop width at 100% and 80% zoom */}
        <HeroOrbitMark className="h-[min(28vw,18rem)] w-[min(28vw,18rem)] opacity-75" />
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

      <section className="relative z-10 mx-auto flex w-full max-w-6xl flex-1 flex-col justify-center px-5 pb-[10vh] pt-6 sm:px-8 lg:px-12">
        <div className="max-w-xl">
          <p className="home-enter home-enter-1 m-0 text-[0.72rem] font-semibold tracking-[0.16em] text-signal uppercase">
            Close the gap
          </p>
          <h1 className="home-enter home-enter-2 font-display mt-5 m-0 text-[clamp(2.35rem,6vw,3.75rem)] leading-[1.05] font-bold tracking-[-0.03em] text-ink">
            Practice until the signal is clean.
          </h1>
          <p className="home-enter home-enter-3 mt-5 max-w-md text-base leading-relaxed text-ink-soft sm:text-[1.05rem]">
            See weak topics. Rehearse interviews. Handle messy evidence.
          </p>

          {isAuthenticated && user ? (
            <div className="home-enter home-enter-4 mt-9">
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
            <div className="home-enter home-enter-4 mt-9 flex flex-wrap items-center gap-3">
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

          <ul className="home-enter home-enter-5 mt-12 flex list-none flex-col gap-4 border-t border-line/80 p-0 pt-8 sm:mt-14 sm:max-w-md">
            {pillars.map((item) => (
              <li key={item.label} className="flex gap-3">
                <span
                  aria-hidden
                  className="mt-1.5 h-2 w-2 shrink-0 rotate-45 bg-signal"
                />
                <div>
                  <p className="m-0 text-sm font-semibold text-ink">
                    {item.label}
                  </p>
                  <p className="m-0 mt-0.5 text-sm text-ink-soft">
                    {item.detail}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </section>
    </div>
  );
}
