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
    'inline-flex cursor-pointer items-center justify-center rounded-[6px] px-4 py-3 text-[0.95rem] font-semibold transition-[background-color,border-color,transform,box-shadow,opacity] duration-200 ease-out disabled:cursor-not-allowed disabled:opacity-55 disabled:shadow-none disabled:translate-y-0';

  const styles =
    variant === 'primary'
      ? 'bg-signal text-white shadow-[0_6px_16px_rgb(27_95_86/0.22)] hover:bg-signal-hover hover:shadow-[0_8px_20px_rgb(27_95_86/0.28)] hover:-translate-y-px active:translate-y-0 active:shadow-[0_3px_10px_rgb(27_95_86/0.18)]'
      : 'border border-line bg-surface text-ink hover:border-signal/35 hover:bg-signal-soft/60 hover:-translate-y-px hover:shadow-[0_6px_14px_rgb(11_15_20/0.05)] active:translate-y-0 active:shadow-none';

  return (
    <button
      type={type}
      className={`${base} ${styles} ${className ?? ''}`}
      {...props}
    />
  );
}
