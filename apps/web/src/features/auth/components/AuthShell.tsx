import type { ReactNode } from 'react';
import { BrandLockup } from '../../../shared/ui/BrandLockup';
import { HeroOrbitMark } from '../../home/components/HeroOrbitMark';

const pillars = [
  { label: 'Assessments', detail: 'Topic sets that expose weak spots' },
  { label: 'Progress', detail: 'Trends you can actually act on' },
  { label: 'Interviews', detail: 'Classic oral + Signal Integrity' },
] as const;

type AuthShellProps = {
  formEyebrow: string;
  title: string;
  subtitle: string;
  children: ReactNode;
  footer: ReactNode;
};

export function AuthShell({
  formEyebrow,
  title,
  subtitle,
  children,
  footer,
}: AuthShellProps) {
  return (
    <div className="home-steel-stage grid min-h-screen lg:grid-cols-[1.05fr_0.95fr]">
      <aside className="relative flex flex-col justify-between overflow-hidden px-6 py-6 sm:px-10 sm:py-8 lg:px-12">
        <div
          aria-hidden
          className="home-orbit-glow pointer-events-none absolute top-[38%] left-1/2 h-[22rem] w-[22rem] -translate-x-1/2 rounded-full lg:left-[58%] lg:top-[42%]"
        />
        <div
          aria-hidden
          className="pointer-events-none absolute top-[42%] left-1/2 hidden -translate-x-1/2 -translate-y-1/2 sm:block lg:left-[58%]"
        >
          <HeroOrbitMark className="h-[min(42vw,18rem)] w-[min(42vw,18rem)] opacity-80" />
        </div>

        <BrandLockup
          to="/"
          markClassName="h-8 w-8 shrink-0 text-ink"
          wordmarkClassName="font-display text-[1.35rem] tracking-[-0.02em] text-ink"
        />

        <div className="relative z-10 mt-10 max-w-md lg:mt-[8vh]">
          <p className="m-0 text-[0.72rem] font-semibold tracking-[0.16em] text-signal uppercase">
            Close the gap
          </p>
          <h2 className="font-display mt-4 m-0 text-[clamp(1.85rem,3.2vw,2.65rem)] leading-[1.1] font-bold tracking-[-0.03em] text-ink">
            Practice until the signal is clean.
          </h2>
          <p className="mt-4 text-base leading-relaxed text-ink-soft">
            See weak topics. Rehearse interviews. Handle messy evidence.
          </p>

          <ul className="mt-8 flex list-none flex-col gap-4 border-t border-line/80 p-0 pt-7">
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

        <p className="relative z-10 mt-10 hidden text-sm text-mute lg:mt-0 lg:block">
          TayyariKarlo — prepare with intent.
        </p>
      </aside>

      <main className="relative z-10 flex items-start justify-center px-6 py-10 sm:px-10 lg:items-center lg:py-12">
        <div className="ui-enter w-full max-w-96 rounded-[8px] border border-line/80 bg-surface px-6 py-8 shadow-[var(--shadow-panel)] sm:px-8">
          <p className="m-0 text-[0.72rem] font-semibold tracking-[0.16em] text-signal uppercase">
            {formEyebrow}
          </p>
          <h1 className="font-display mt-2 text-[2rem] leading-none font-bold tracking-[-0.03em] text-ink">
            {title}
          </h1>
          <p className="mt-3 max-w-md text-base leading-relaxed text-ink-soft">
            {subtitle}
          </p>
          <div className="mt-7">{children}</div>
          <p className="mt-5 text-[0.9rem] text-mute">{footer}</p>
        </div>
      </main>
    </div>
  );
}
