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
        className={`ui-input focus:bg-surface ${className ?? ''}`}
        {...props}
      />
      {hint ? (
        <span className="mt-1.5 block text-xs text-mute">{hint}</span>
      ) : null}
    </label>
  );
}
