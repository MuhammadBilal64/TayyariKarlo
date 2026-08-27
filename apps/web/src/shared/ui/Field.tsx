import type { InputHTMLAttributes, ReactNode } from 'react';

type FieldProps = InputHTMLAttributes<HTMLInputElement> & {
  label: string;
  hint?: ReactNode;
};

export function Field({ label, hint, id, className, ...props }: FieldProps) {
  const inputId = id ?? props.name;

  return (
    <label className="mb-3.5 block cursor-default">
      <span className="mb-1.5 block text-[0.8rem] font-medium text-ink-soft">
        {label}
      </span>
      <input
        id={inputId}
        className={`w-full cursor-text rounded-[6px] border border-line bg-surface px-3.5 py-3 text-[0.95rem] text-ink outline-none transition-[border-color,box-shadow,background-color] duration-200 ease-out placeholder:text-mute/70 hover:border-ink/25 focus:border-ink focus:bg-surface focus:shadow-[0_0_0_3px_rgb(11_15_20/0.12)] ${className ?? ''}`}
        {...props}
      />
      {hint ? (
        <span className="mt-1.5 block text-xs text-mute">{hint}</span>
      ) : null}
    </label>
  );
}
