import { registerSchema } from '@tayyari/shared';
import { useState, type FormEvent } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { ApiError } from '../../../shared/api/client';
import { Button } from '../../../shared/ui/Button';
import { Field } from '../../../shared/ui/Field';
import { StatusBanner } from '../../../shared/ui/StatusBanner';
import { AuthLoading } from '../components/AuthLoading';
import { AuthShell } from '../components/AuthShell';
import { useAuth } from '../hooks/useAuth';

export function RegisterPage() {
  const { register, isAuthenticated, isBootstrapping } = useAuth();
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  if (isBootstrapping) {
    return <AuthLoading />;
  }

  if (isAuthenticated) {
    return <Navigate to="/app" replace />;
  }

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    const parsed = registerSchema.safeParse({ name, email, password });
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? 'Invalid input');
      return;
    }

    setSubmitting(true);
    try {
      await register(parsed.data);
      navigate('/app', { replace: true });
    } catch (err) {
      setError(
        err instanceof ApiError
          ? err.message
          : 'Unable to create your account right now',
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <AuthShell
      eyebrow="Start preparing"
      quote="A quiet place to get interview-ready."
      brandBody={
        <ul className="m-0 grid list-none gap-2.5 p-0">
          <li className="flex items-start gap-2.5">
            <span className="mt-1.5 size-2 shrink-0 rounded-[2px] bg-signal" />
            Timed assessments by topic and difficulty
          </li>
          <li className="flex items-start gap-2.5">
            <span className="mt-1.5 size-2 shrink-0 rounded-[2px] bg-signal" />
            Clear progress on weak areas
          </li>
          <li className="flex items-start gap-2.5">
            <span className="mt-1.5 size-2 shrink-0 rounded-[2px] bg-signal" />
            Practice interviews when you are ready
          </li>
        </ul>
      }
      brandFooter="No clutter. Just the work that moves you forward."
      formEyebrow="New account"
      title="Create account"
      subtitle="Three fields. You can refine your profile later."
      footer={
        <>
          Already registered? <Link to="/login">Sign in</Link>
        </>
      }
    >
      <form onSubmit={onSubmit}>
        <Field
          label="Name"
          type="text"
          name="name"
          autoComplete="name"
          placeholder="Ayesha Khan"
          value={name}
          onChange={(event) => setName(event.target.value)}
          required
        />
        <Field
          label="Email"
          type="email"
          name="email"
          autoComplete="email"
          placeholder="you@university.edu"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          required
        />
        <Field
          label="Password"
          type="password"
          name="password"
          autoComplete="new-password"
          placeholder="At least 8 characters"
          minLength={8}
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          required
        />
        {error ? (
          <StatusBanner className="mb-3.5">{error}</StatusBanner>
        ) : null}
        <Button type="submit" className="mt-1 w-full" disabled={submitting}>
          {submitting ? 'Creating account…' : 'Create account'}
        </Button>
      </form>
    </AuthShell>
  );
}
