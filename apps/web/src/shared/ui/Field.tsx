import type { InputHTMLAttributes, ReactNode } from 'react';

type FieldProps = InputHTMLAttributes<HTMLInputElement> & {
  label: string;
  hint?: ReactNode;
};

export function Field({ label, hint, id, className, ...props }: FieldProps) {
  const inputId = id ?? props.name;

  return (
    <label className="mb-3.5 block">
      <span className="mb-1.5 block text-[0.8rem] font-medium text-ink-soft">
        {label}
      </span>
      <input
        id={inputId}
        className={`w-full rounded-[10px] border border-line bg-white px-3.5 py-3 text-[0.95rem] text-ink outline-none transition-[border-color,box-shadow] placeholder:text-mute/70 focus:border-focus focus:shadow-[0_0_0_3px_rgb(42_85_255/0.18)] ${className ?? ''}`}
        {...props}
      />
      {hint ? (
        <span className="mt-1.5 block text-xs text-mute">{hint}</span>
      ) : null}
    </label>
  );
}
