export function WorkspacePage() {
  return (
    <section>
      <p className="m-0 text-[0.72rem] font-semibold tracking-[0.16em] text-signal uppercase">
        Workspace
      </p>
      <h1 className="font-display mt-3 text-[clamp(2rem,4vw,2.8rem)] leading-none font-normal tracking-[-0.03em] text-ink">
        Your prep space
      </h1>
      <p className="mt-4 max-w-xl text-base leading-relaxed text-ink-soft">
        You are signed in. Assessments, progress, interviews, and coding
        challenges will land here in later phases.
      </p>
      <ul className="mt-8 m-0 grid list-none gap-3 p-0">
        <li className="rounded-[10px] border border-line bg-paper-lift px-4 py-3 text-sm text-ink-soft">
          Assessments — coming next
        </li>
        <li className="rounded-[10px] border border-line bg-paper-lift px-4 py-3 text-sm text-ink-soft">
          Progress &amp; recommendations — later
        </li>
        <li className="rounded-[10px] border border-line bg-paper-lift px-4 py-3 text-sm text-ink-soft">
          AI interviews &amp; coding — later
        </li>
      </ul>
    </section>
  );
}
