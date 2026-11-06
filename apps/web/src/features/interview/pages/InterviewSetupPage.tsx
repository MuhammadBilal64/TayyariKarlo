import {
  EXPERIENCE_LEVELS,
  SIGNAL_VARIANTS,
  startInterviewSchema,
  type ExperienceLevel,
  type SignalVariant,
} from '@tayyari/shared';
import { useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ApiError } from '../../../shared/api/client';
import { Button } from '../../../shared/ui/Button';
import { Field } from '../../../shared/ui/Field';
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
    <section>
      <Link
        to="/app"
        className="mb-5 inline-block cursor-pointer text-sm font-semibold text-signal"
      >
        ← Workspace
      </Link>
      <p className="m-0 text-[0.72rem] font-semibold tracking-[0.16em] text-signal uppercase">
        Interviews
      </p>
      <h1 className="font-display mt-3 text-[clamp(2rem,4vw,2.8rem)] leading-none font-normal tracking-[-0.03em] text-ink">
        Choose the round
      </h1>
      <p className="mt-4 max-w-xl text-base leading-relaxed text-ink-soft">
        Signal Integrity is an investigation with imperfect evidence. Classic
        oral is five timed questions with feedback after each answer.
      </p>

      <form className="mt-8" onSubmit={onSubmit}>
        {error ? (
          <p className="mb-4 rounded-[10px] bg-danger-soft px-3.5 py-3 text-[0.85rem] text-danger">
            {error}
          </p>
        ) : null}

        <p className="mt-2 mb-2.5 text-[0.8rem] font-semibold text-ink-soft">
          Mode
        </p>
        <div className="grid gap-2 sm:grid-cols-2">
          {(
            [
              [
                'signal',
                'Signal Integrity',
                'Investigate checkout latency when traces may be delayed, partial, or conflicting.',
              ],
              [
                'classic',
                'Classic oral',
                'Five questions, two minutes each. Local model scores each answer.',
              ],
            ] as const
          ).map(([value, title, copy]) => (
            <label
              key={value}
              className={`cursor-pointer rounded-[12px] border px-4 py-4 ${
                mode === value
                  ? 'border-signal bg-signal-soft shadow-[0_8px_18px_rgb(15_110_92/0.1)]'
                  : 'border-line bg-white hover:border-signal/40'
              }`}
            >
              <input
                type="radio"
                name="mode"
                className="sr-only"
                checked={mode === value}
                onChange={() => setMode(value)}
              />
              <p className="m-0 text-[0.95rem] font-semibold text-ink">
                {title}
              </p>
              <p className="mt-1 mb-0 text-[0.8rem] leading-relaxed text-mute">
                {copy}
              </p>
            </label>
          ))}
        </div>

        <Field
          label="Role you’re targeting"
          name="role"
          value={role}
          onChange={(event) => setRole(event.target.value)}
          placeholder="Backend Engineer"
          required
          autoComplete="organization-title"
        />

        {mode === 'classic' ? (
          <label className="mb-3.5 block">
            <span className="mb-1.5 block text-[0.8rem] font-medium text-ink-soft">
              Technologies to press on
            </span>
            <textarea
              name="techStack"
              value={techStackText}
              onChange={(event) => setTechStackText(event.target.value)}
              placeholder="Node.js, PostgreSQL, NestJS"
              rows={3}
              required
              className="w-full cursor-text resize-y rounded-[10px] border border-line bg-white px-3.5 py-3 text-[0.95rem] text-ink outline-none transition-[border-color,box-shadow,background-color] duration-200 placeholder:text-mute/70 hover:border-ink/30 focus:border-focus focus:bg-paper-lift focus:shadow-[0_0_0_3px_rgb(42_85_255/0.18)]"
            />
            <span className="mt-1.5 block text-xs text-mute">
              Comma-separated. Only what you want tested.
            </span>
          </label>
        ) : null}

        <p className="mt-2 mb-2.5 text-[0.8rem] font-semibold text-ink-soft">
          Level
        </p>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          {EXPERIENCE_LEVELS.map((level) => (
            <label
              key={level}
              className={`ui-chip cursor-pointer rounded-[10px] border px-2 py-3 text-center text-[0.85rem] font-medium ${
                experienceLevel === level
                  ? 'border-signal bg-signal-soft font-semibold text-signal-hover shadow-[0_8px_18px_rgb(15_110_92/0.1)]'
                  : 'border-line bg-white text-ink hover:border-signal/40'
              }`}
            >
              <input
                type="radio"
                name="experienceLevel"
                className="sr-only"
                checked={experienceLevel === level}
                onChange={() => setExperienceLevel(level)}
              />
              {levelLabel(level)}
            </label>
          ))}
        </div>

        {mode === 'signal' ? (
          <>
            <p className="mt-5 mb-2.5 text-[0.8rem] font-semibold text-ink-soft">
              Evidence condition
            </p>
            <div className="grid gap-2 sm:grid-cols-3">
              {SIGNAL_VARIANTS.map((item) => (
                <label
                  key={item}
                  className={`cursor-pointer rounded-[10px] border px-3 py-3 text-center text-[0.85rem] font-medium ${
                    variant === item
                      ? 'border-signal bg-signal-soft font-semibold text-signal-hover'
                      : 'border-line bg-white text-ink hover:border-signal/40'
                  }`}
                >
                  <input
                    type="radio"
                    name="variant"
                    className="sr-only"
                    checked={variant === item}
                    onChange={() => setVariant(item)}
                  />
                  {variantLabel(item)}
                </label>
              ))}
            </div>
          </>
        ) : null}

        <p className="mt-5 m-0 text-[0.85rem] leading-relaxed text-mute">
          {mode === 'signal'
            ? 'You choose what to examine. Evidence can be delayed, partial, or conflicting. Scores cite what you did, not a guessed root cause alone.'
            : 'Five questions, two minutes each. The local model scores what you said and explains it before the next question.'}
        </p>

        <div className="mt-6 border-t border-line pt-6">
          <Button
            type="submit"
            className="w-full max-w-64"
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
