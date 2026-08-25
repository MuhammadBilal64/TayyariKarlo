type InlineStatusProps = {
  message: string;
  className?: string;
};

/** Compact in-page loading / status line with spinner. */
export function InlineStatus({ message, className }: InlineStatusProps) {
  return (
    <p
      className={`m-0 flex items-center gap-2.5 text-sm text-ink-soft ${className ?? ''}`}
      role="status"
      aria-live="polite"
    >
      <span
        className="inline-block size-4 shrink-0 animate-spin rounded-full border-2 border-line border-t-signal"
        aria-hidden="true"
      />
      {message}
    </p>
  );
}
