type InlineStatusProps = {
  message: string;
};

/** Compact in-page loading / status line with spinner. */
export function InlineStatus({ message }: InlineStatusProps) {
  return (
    <p
      className="m-0 flex items-center gap-2.5 text-sm text-ink-soft"
      role="status"
      aria-live="polite"
    >
      <span
        className="inline-block h-4 w-4 shrink-0 animate-spin rounded-full border-2 border-line border-t-signal"
        aria-hidden="true"
      />
      {message}
    </p>
  );
}
