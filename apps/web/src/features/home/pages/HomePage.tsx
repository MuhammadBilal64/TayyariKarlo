import { DIFFICULTIES, TOPICS } from '@tayyari/shared';

export function HomePage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-950 px-6">
      <div className="max-w-lg text-center">
        <p className="text-sm font-medium uppercase tracking-[0.2em] text-emerald-400">
          TayyariKarlo
        </p>
        <h1 className="mt-4 text-4xl font-semibold tracking-tight text-white">
          Interview prep platform
        </h1>
        <p className="mt-3 text-base text-slate-400">
          Web shell is ready. Shared package loaded with {TOPICS.length} topics
          and {DIFFICULTIES.length} difficulty levels.
        </p>
      </div>
    </main>
  );
}
