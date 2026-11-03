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
    'inline-flex cursor-pointer items-center justify-center rounded-[10px] px-4 py-3 text-[0.95rem] font-semibold transition-[background-color,border-color,transform,box-shadow,opacity] duration-200 ease-out disabled:cursor-not-allowed disabled:opacity-55 disabled:shadow-none disabled:translate-y-0';

  const styles =
    variant === 'primary'
      ? 'bg-signal text-white shadow-[0_8px_20px_rgb(15_110_92/0.22)] hover:bg-signal-hover hover:shadow-[0_10px_24px_rgb(15_110_92/0.28)] hover:-translate-y-px active:translate-y-0 active:shadow-[0_4px_12px_rgb(15_110_92/0.18)]'
      : 'border border-line bg-paper-lift/70 text-ink hover:border-ink/25 hover:bg-white hover:-translate-y-px hover:shadow-[0_8px_18px_rgb(18_21_28/0.06)] active:translate-y-0 active:shadow-none';

  return (
    <button
      type={type}
      className={`${base} ${styles} ${className ?? ''}`}
      {...props}
    />
  );
}
