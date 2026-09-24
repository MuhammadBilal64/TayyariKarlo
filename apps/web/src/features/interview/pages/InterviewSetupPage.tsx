import {
  EXPERIENCE_LEVELS,
  SIGNAL_VARIANTS,
  startInterviewSchema,
  type ExperienceLevel,
  type SignalVariant,
} from '@tayyari/shared';
import { useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { ApiError } from '../../../shared/api/client';
import { Button } from '../../../shared/ui/Button';
import { useAuth } from '../../auth/hooks/useAuth';
import { createInterview } from '../api/interviewsApi';
import { createSignalInterview } from '../api/signalInterviewsApi';

function levelLabel(level: ExperienceLevel) {
  switch (level) {
    case 'intern':
      return 'Intern';
    case 'junior':
      return 'Junior';
    case 'mid':
      return 'Mid';
    case 'senior':
      return 'Senior';
  }
}

function variantLabel(variant: SignalVariant) {
  switch (variant) {
    case 'full':
      return 'Full evidence';
    case 'delayed_incomplete':
      return 'Delayed / incomplete';
    case 'conflicting':
      return 'Conflicting evidence';
  }
}

type InterviewMode = 'classic' | 'signal';

const underlineSelect =
  'cursor-pointer border-0 border-b-2 bg-transparent px-0 pb-1 text-[0.9rem] transition-[color,border-color] duration-200';

export function InterviewSetupPage() {
  const { accessToken } = useAuth();
  const navigate = useNavigate();
  const [mode, setMode] = useState<InterviewMode>('signal');
  const [role, setRole] = useState('Backend Engineer');
  const [techStackText, setTechStackText] = useState('Node.js, PostgreSQL');
  const [experienceLevel, setExperienceLevel] =
    useState<ExperienceLevel>('junior');
  const [variant, setVariant] = useState<SignalVariant>('delayed_incomplete');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    if (!accessToken) {
      setError('You need to be signed in');
      return;
    }

    setSubmitting(true);
    try {
      if (mode === 'signal') {
        const session = await createSignalInterview(
          {
            role: role.trim() || 'Backend Engineer',
            experienceLevel,
            scenarioId: 'checkout-latency',
            variant,
          },
          accessToken,
        );
        navigate(`/app/interviews/signal/${session.id}`, { replace: true });
        return;
      }

      const techStack = techStackText
        .split(',')
        .map((part) => part.trim())
        .filter(Boolean);

      const parsed = startInterviewSchema.safeParse({
        role,
        techStack,
        experienceLevel,
      });

      if (!parsed.success) {
        setError(parsed.error.issues[0]?.message ?? 'Check your inputs');
        return;
      }

      const session = await createInterview(parsed.data, accessToken);
      navigate(`/app/interviews/${session.id}`, { replace: true });
    } catch (err) {
      setError(
        err instanceof ApiError
          ? err.message
          : 'Unable to start the interview right now',
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <section className="w-full">
      <p className="m-0 text-[0.7rem] font-semibold tracking-[0.18em] text-signal uppercase">
        Interview
      </p>
      <h1 className="font-display mt-3 text-[clamp(2.15rem,4.2vw,3rem)] leading-[1.06] font-semibold tracking-[-0.03em] text-ink">
        Choose the round
      </h1>
      <p className="mt-3 max-w-xl text-base leading-relaxed text-ink-soft">
        Signal Integrity or classic oral — pick mode, role, and level.
      </p>

      <form className="mt-8" onSubmit={onSubmit}>
        {error ? (
          <p className="mb-4 rounded-[6px] bg-danger-soft px-3.5 py-3 text-[0.85rem] text-danger">
            {error}
          </p>
        ) : null}

        <ul className="m-0 list-none border-t border-line p-0">
          <li className="border-b border-line">
            <div className="ui-row grid grid-cols-1 items-center gap-x-6 gap-y-3 py-[1.05rem] sm:grid-cols-[minmax(8rem,auto)_minmax(0,1fr)]">
              <p className="m-0 text-[0.9rem] font-semibold text-ink">Mode</p>
              <div
                className="flex flex-wrap items-center gap-x-5 gap-y-2 sm:justify-end"
                role="group"
                aria-label="Interview mode"
              >
                {(
                  [
                    ['signal', 'Signal Integrity'],
                    ['classic', 'Classic oral'],
                  ] as const
                ).map(([value, label]) => {
                  const active = mode === value;
                  return (
                    <button
                      key={value}
                      type="button"
                      className={`${underlineSelect} ${
                        active
                          ? 'border-ink font-semibold text-ink'
                          : 'border-transparent font-medium text-ink-soft hover:text-ink'
                      }`}
                      onClick={() => setMode(value)}
                    >
                      {label}
                    </button>
                  );
                })}
              </div>
            </div>
          </li>

          <li className="border-b border-line">
            <div className="ui-row grid grid-cols-1 items-center gap-x-6 gap-y-3 py-[1.05rem] sm:grid-cols-[minmax(8rem,auto)_minmax(0,1fr)]">
              <label
                htmlFor="interview-role"
                className="m-0 text-[0.9rem] font-semibold text-ink"
              >
                Role
              </label>
              <input
                id="interview-role"
                name="role"
                value={role}
                onChange={(event) => setRole(event.target.value)}
                placeholder="Backend Engineer"
                required
                autoComplete="organization-title"
                className="h-10 w-full max-w-md cursor-text border-0 border-b border-line bg-transparent px-0 text-right text-[0.95rem] text-ink outline-none transition-[border-color] duration-200 placeholder:text-mute/70 hover:border-ink/30 focus:border-ink sm:ml-auto sm:text-right"
              />
            </div>
          </li>

          {mode === 'classic' ? (
            <li className="border-b border-line">
              <div className="ui-row grid grid-cols-1 items-start gap-x-6 gap-y-3 py-[1.05rem] sm:grid-cols-[minmax(8rem,auto)_minmax(0,1fr)]">
                <label
                  htmlFor="interview-stack"
                  className="m-0 pt-2 text-[0.9rem] font-semibold text-ink"
                >
                  Press on
                </label>
                <div className="sm:text-right">
                  <textarea
                    id="interview-stack"
                    name="techStack"
                    value={techStackText}
                    onChange={(event) => setTechStackText(event.target.value)}
                    placeholder="Node.js, PostgreSQL, NestJS"
                    rows={2}
                    required
                    className="w-full max-w-md cursor-text resize-y rounded-[6px] border border-line bg-surface px-3.5 py-2.5 text-[0.95rem] text-ink outline-none transition-[border-color,box-shadow] duration-200 placeholder:text-mute/70 hover:border-ink/25 focus:border-ink focus:shadow-[0_0_0_3px_rgb(11_15_20/0.12)] sm:ml-auto"
                  />
                  <p className="mt-2 m-0 text-[0.8rem] text-mute sm:text-right">
                    Comma-separated. Only what you want tested.
                  </p>
                </div>
              </div>
            </li>
          ) : null}

          <li className="border-b border-line">
            <div className="ui-row grid grid-cols-1 items-center gap-x-6 gap-y-3 py-[1.05rem] sm:grid-cols-[minmax(8rem,auto)_minmax(0,1fr)]">
              <p className="m-0 text-[0.9rem] font-semibold text-ink">Level</p>
              <div
                className="flex flex-wrap items-center gap-x-5 gap-y-2 sm:justify-end"
                role="group"
                aria-label="Experience level"
              >
                {EXPERIENCE_LEVELS.map((level) => {
                  const active = experienceLevel === level;
                  return (
                    <button
                      key={level}
                      type="button"
                      className={`${underlineSelect} ${
                        active
                          ? 'border-ink font-semibold text-ink'
                          : 'border-transparent font-medium text-ink-soft hover:text-ink'
                      }`}
                      onClick={() => setExperienceLevel(level)}
                    >
                      {levelLabel(level)}
                    </button>
                  );
                })}
              </div>
            </div>
          </li>

          {mode === 'signal' ? (
            <li className="border-b border-line">
              <div className="ui-row grid grid-cols-1 items-center gap-x-6 gap-y-3 py-[1.05rem] sm:grid-cols-[minmax(8rem,auto)_minmax(0,1fr)]">
                <p className="m-0 text-[0.9rem] font-semibold text-ink">
                  Evidence condition
                </p>
                <div
                  className="flex flex-wrap items-center gap-x-5 gap-y-2 sm:justify-end"
                  role="group"
                  aria-label="Evidence condition"
                >
                  {SIGNAL_VARIANTS.map((item) => {
                    const active = variant === item;
                    return (
                      <button
                        key={item}
                        type="button"
                        className={`${underlineSelect} ${
                          active
                            ? 'border-ink font-semibold text-ink'
                            : 'border-transparent font-medium text-ink-soft hover:text-ink'
                        }`}
                        onClick={() => setVariant(item)}
                      >
                        {variantLabel(item)}
                      </button>
                    );
                  })}
                </div>
              </div>
            </li>
          ) : null}
        </ul>

        <p className="mt-5 m-0 max-w-2xl text-[0.85rem] leading-relaxed text-mute">
          {mode === 'signal'
            ? 'You choose what to examine. Evidence can be delayed, partial, or conflicting. Scores cite what you did, not a guessed root cause alone.'
            : 'Five questions, two minutes each. The local model scores what you said and explains it before the next question.'}
        </p>

        <div className="mt-8">
          <Button
            type="submit"
            className="h-12 min-w-[11rem] px-5"
            disabled={submitting}
          >
            {submitting
              ? 'Opening…'
              : mode === 'signal'
                ? 'Begin investigation'
                : 'Begin oral round'}
          </Button>
        </div>
      </form>
    </section>
  );
}
