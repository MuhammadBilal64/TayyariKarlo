import type { ButtonHTMLAttributes } from 'react';

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: 'primary' | 'ghost';
};

export function Button({
  variant = 'primary',
  className,
  type = 'button',
  ...props
}: ButtonProps) {
  const base =
    'inline-flex items-center justify-center rounded-[10px] px-4 py-3 text-[0.95rem] font-semibold transition-[background,transform,opacity] disabled:cursor-not-allowed disabled:opacity-60';

  const styles =
    variant === 'primary'
      ? 'bg-signal text-white hover:bg-signal-hover active:translate-y-px'
      : 'border border-line bg-transparent text-ink hover:bg-ink/5 active:translate-y-px';

  return (
    <button
      type={type}
      className={`${base} ${styles} ${className ?? ''}`}
      {...props}
    />
  );
}
