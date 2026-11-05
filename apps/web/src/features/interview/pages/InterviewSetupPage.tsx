import {
  EXPERIENCE_LEVELS,
  startInterviewSchema,
  type ExperienceLevel,
} from '@tayyari/shared';
import { useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ApiError } from '../../../shared/api/client';
import { Button } from '../../../shared/ui/Button';
import { Field } from '../../../shared/ui/Field';
import { useAuth } from '../../auth/hooks/useAuth';
import { createInterview } from '../api/interviewsApi';

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

export function InterviewSetupPage() {
  const { accessToken } = useAuth();
  const navigate = useNavigate();
  const [role, setRole] = useState('');
  const [techStackText, setTechStackText] = useState('');
  const [experienceLevel, setExperienceLevel] =
    useState<ExperienceLevel>('junior');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    if (!accessToken) {
      setError('You need to be signed in');
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

    setSubmitting(true);
    try {
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
        Oral round
      </p>
      <h1 className="font-display mt-3 text-[clamp(2rem,4vw,2.8rem)] leading-none font-normal tracking-[-0.03em] text-ink">
        State the role
      </h1>
      <p className="mt-4 max-w-xl text-base leading-relaxed text-ink-soft">
        One seat. Your stack. Five questions, two minutes each. The interviewer
        listens, interprets the answer, and tells you how it landed before the
        next question.
      </p>

      <form className="mt-8" onSubmit={onSubmit}>
        {error ? (
          <p className="mb-4 rounded-[10px] bg-danger-soft px-3.5 py-3 text-[0.85rem] text-danger">
            {error}
          </p>
        ) : null}

        <Field
          label="Role you’re targeting"
          name="role"
          value={role}
          onChange={(event) => setRole(event.target.value)}
          placeholder="Backend Engineer"
          required
          autoComplete="organization-title"
        />

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

        <p className="mt-5 m-0 text-[0.85rem] leading-relaxed text-mute">
          Five questions, two minutes each. The local model scores what you said
          and explains it before the next question.
        </p>

        <div className="mt-6 border-t border-line pt-6">
          <Button
            type="submit"
            className="w-full max-w-64"
            disabled={submitting}
          >
            {submitting ? 'Opening the round…' : 'Begin interview'}
          </Button>
        </div>
      </form>
    </section>
  );
}
