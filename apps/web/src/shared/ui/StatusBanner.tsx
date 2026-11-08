import type { ReactNode } from 'react';

type StatusTone = 'danger' | 'success' | 'info';

type StatusBannerProps = {
  tone?: StatusTone;
  children: ReactNode;
  className?: string;
};

const toneClass: Record<StatusTone, string> = {
  danger: 'bg-danger-soft text-danger',
  success: 'bg-signal-soft text-signal-hover',
  info: 'bg-paper text-ink-soft',
};

/** Inline alert for form/page feedback — error, success, or quiet info. */
export function StatusBanner({
  tone = 'danger',
  children,
  className,
}: StatusBannerProps) {
  return (
    <p
      role={tone === 'danger' ? 'alert' : 'status'}
      className={`m-0 rounded-[6px] px-3.5 py-3 text-[0.85rem] leading-relaxed ${toneClass[tone]} ${className ?? ''}`}
    >
      {children}
    </p>
  );
}
