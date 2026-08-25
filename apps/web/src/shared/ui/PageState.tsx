import type { ReactNode } from 'react';
import { StatusBanner } from './StatusBanner';

type PageStateProps = {
  /** Optional small signal eyebrow */
  eyebrow?: string;
  title: string;
  description?: string;
  /** Prefer StatusBanner message for errors; plain description for empty. */
  error?: string | null;
  action?: ReactNode;
};

/**
 * Full-section empty / not-found / hard-error layout.
 * Keeps Score Stage eyebrow + hairline rhythm without cards.
 */
export function PageState({
  eyebrow,
  title,
  description,
  error,
  action,
}: PageStateProps) {
  return (
    <section className="w-full">
      {eyebrow ? (
        <p className="m-0 text-[0.7rem] font-semibold tracking-[0.18em] text-signal uppercase">
          {eyebrow}
        </p>
      ) : null}
      <h1
        className={`font-display m-0 text-[clamp(1.7rem,3.2vw,2.2rem)] leading-[1.15] font-semibold tracking-[-0.02em] text-ink ${
          eyebrow ? 'mt-3' : ''
        }`}
      >
        {title}
      </h1>
      {error ? (
        <StatusBanner className="mt-5 max-w-xl">{error}</StatusBanner>
      ) : description ? (
        <p className="mt-3 m-0 max-w-xl text-base leading-relaxed text-ink-soft">
          {description}
        </p>
      ) : null}
      {action ? <div className="mt-6">{action}</div> : null}
    </section>
  );
}
