export function AuthLoading() {
  return (
    <main
      className="graph-bg flex min-h-screen flex-col items-center justify-center gap-3 px-5 text-ink-soft"
      role="status"
      aria-live="polite"
    >
      <span
        className="inline-block size-8 animate-spin rounded-full border-2 border-line border-t-signal"
        aria-hidden="true"
      />
      <p className="m-0 text-sm">Checking session…</p>
    </main>
  );
}
