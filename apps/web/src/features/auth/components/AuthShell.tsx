import type { ReactNode } from 'react';
import { BrandLockup } from '../../../shared/ui/BrandLockup';

type AuthShellProps = {
  eyebrow: string;
  quote: string;
  brandBody: ReactNode;
  brandFooter?: ReactNode;
  formEyebrow: string;
  title: string;
  subtitle: string;
  children: ReactNode;
  footer: ReactNode;
};

export function AuthShell({
  eyebrow,
  quote,
  brandBody,
  brandFooter,
  formEyebrow,
  title,
  subtitle,
  children,
  footer,
}: AuthShellProps) {
  return (
    <div className="grid min-h-screen lg:grid-cols-[1.05fr_0.95fr]">
      <aside className="graph-bg relative flex flex-col justify-between overflow-hidden px-6 py-6 sm:px-10 sm:py-8 lg:px-12">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-x-[-10%] bottom-[-20%] left-[35%] h-[70%] rounded-full border border-ink/8"
        />
        <BrandLockup
          to="/"
          markClassName="h-8 w-8 shrink-0 text-ink"
          wordmarkClassName="font-display text-[1.65rem] tracking-[-0.02em] text-ink"
        />

        <div className="relative mt-10 max-w-md lg:mt-[12vh]">
          <p className="m-0 text-[0.72rem] font-semibold tracking-[0.16em] text-signal uppercase">
            {eyebrow}
          </p>
          <p className="font-display mt-6 text-[clamp(1.8rem,3.4vw,2.55rem)] leading-[1.15] tracking-[-0.02em] text-ink italic">
            {quote}
          </p>
          <div className="mt-3.5 text-base leading-relaxed text-ink-soft">
            {brandBody}
          </div>
        </div>

        <div className="relative mt-10 text-sm text-ink-soft lg:mt-0">
          {brandFooter}
        </div>
      </aside>

      <main className="flex items-start justify-center border-t border-line bg-paper-lift px-6 py-10 shadow-[var(--shadow-panel)] sm:px-10 lg:items-center lg:border-t-0 lg:border-l lg:py-12">
        <div className="ui-enter w-full max-w-96">
          <p className="m-0 text-[0.72rem] font-semibold tracking-[0.16em] text-signal uppercase">
            {formEyebrow}
          </p>
          <h1 className="font-display mt-2 text-[2.2rem] leading-none font-normal tracking-[-0.03em] text-ink">
            {title}
          </h1>
          <p className="mt-3.5 max-w-md text-base leading-relaxed text-ink-soft">
            {subtitle}
          </p>
          <div className="mt-7">{children}</div>
          <p className="mt-5 text-[0.9rem] text-mute">{footer}</p>
        </div>
      </main>
    </div>
  );
}
