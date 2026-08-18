import { loginSchema } from '@tayyari/shared';
import { useState, type FormEvent } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { ApiError } from '../../../shared/api/client';
import { Button } from '../../../shared/ui/Button';
import { Field } from '../../../shared/ui/Field';
import { AuthLoading } from '../components/AuthLoading';
import { AuthShell } from '../components/AuthShell';
import { useAuth } from '../hooks/useAuth';

export function LoginPage() {
  const { login, isAuthenticated, isBootstrapping } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  if (isBootstrapping) {
    return <AuthLoading />;
  }

  if (isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    const parsed = loginSchema.safeParse({ email, password });
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? 'Invalid input');
      return;
    }

    setSubmitting(true);
    try {
      await login(parsed.data);
      navigate('/', { replace: true });
    } catch (err) {
      setError(
        err instanceof ApiError ? err.message : 'Unable to sign in right now',
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <AuthShell
      eyebrow="Interview prep"
      quote="Come back to the problem set. One session closer."
      brandBody="Sign in to continue assessments, track weak topics, and practice under real interview pressure."
      brandFooter={
        <div className="flex flex-wrap gap-5">
          <span className="inline-flex items-center gap-2">
            <i className="inline-block size-1.5 rounded-full bg-signal" />
            Assessments
          </span>
          <span className="inline-flex items-center gap-2">
            <i className="inline-block size-1.5 rounded-full bg-signal" />
            Progress
          </span>
          <span className="inline-flex items-center gap-2">
            <i className="inline-block size-1.5 rounded-full bg-signal" />
            Mock interviews
          </span>
        </div>
      }
      formEyebrow="Welcome back"
      title="Sign in"
      subtitle="Use the email you registered with."
      footer={
        <>
          New here? <Link to="/register">Create an account</Link>
        </>
      }
    >
      <form onSubmit={onSubmit}>
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
          autoComplete="current-password"
          placeholder="••••••••"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          required
        />
        {error ? (
          <p className="mb-3.5 rounded-[10px] bg-danger-soft px-3.5 py-2.5 text-[0.85rem] text-danger">
            {error}
          </p>
        ) : null}
        <Button type="submit" className="mt-1 w-full" disabled={submitting}>
          {submitting ? 'Signing in…' : 'Sign in'}
        </Button>
      </form>
    </AuthShell>
  );
}
