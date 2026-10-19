import { Link } from 'react-router-dom';

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
        Start a topic assessment, then review score and weak spots. Progress,
        interviews, and coding land in later phases.
      </p>
      <ul className="mt-8 m-0 grid list-none gap-3 p-0">
        <li>
          <Link
            to="/app/assessments"
            className="block rounded-[10px] border border-line bg-paper-lift px-4 py-3 text-sm text-ink no-underline transition-[border-color,background] hover:border-signal/45 hover:bg-signal-soft hover:no-underline"
          >
            <span className="font-semibold text-ink">Assessments</span>
            <span className="mt-1 block text-ink-soft">
              Topic × difficulty MCQs with scored results
            </span>
          </Link>
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
