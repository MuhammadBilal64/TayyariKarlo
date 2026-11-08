import type { ButtonHTMLAttributes } from 'react';

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: 'primary' | 'ghost';
  /** `md` = page actions (48px). `sm` = header/chrome. */
  size?: 'md' | 'sm';
};

export function Button({
  variant = 'primary',
  size = 'md',
  className,
  type = 'button',
  ...props
}: ButtonProps) {
  const base =
    'inline-flex cursor-pointer items-center justify-center rounded-[6px] font-semibold transition-[background-color,border-color,transform,box-shadow,opacity] duration-200 ease-out focus-visible:outline-none focus-visible:shadow-focus disabled:cursor-not-allowed disabled:opacity-55 disabled:shadow-none disabled:translate-y-0';

  const sizing =
    size === 'sm' ? 'h-9 px-3.5 text-sm' : 'h-12 px-4 text-[0.95rem]';

  const styles =
    variant === 'primary'
      ? 'bg-signal text-white shadow-signal hover:bg-signal-hover hover:shadow-signal-hover hover:-translate-y-px active:translate-y-0 active:shadow-signal-press disabled:hover:bg-signal disabled:hover:shadow-signal disabled:hover:translate-y-0'
      : size === 'sm'
        ? 'border border-line bg-surface text-ink-soft hover:border-ink/25 hover:bg-paper hover:text-ink active:bg-paper disabled:hover:border-line disabled:hover:bg-surface disabled:hover:text-ink-soft'
        : 'border border-line bg-surface text-ink hover:border-signal/40 hover:bg-signal-soft/70 hover:-translate-y-px hover:shadow-lift active:translate-y-0 active:shadow-none disabled:hover:border-line disabled:hover:bg-surface disabled:hover:shadow-none disabled:hover:translate-y-0';

  return (
    <button
      type={type}
      className={`${base} ${sizing} ${styles} ${className ?? ''}`}
      {...props}
    />
  );
}
