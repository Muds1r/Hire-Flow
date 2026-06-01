import { Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { AuthFormCard } from '../components/auth/AuthFormCard';
import { useAuthMutation } from '../features/auth/useAuthMutation';
import { getLoginErrorMessage } from '../utils/authError';

const schema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

type Form = z.infer<typeof schema>;

export function LoginPage() {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<Form>({ resolver: zodResolver(schema) });

  const mutation = useAuthMutation('/auth/login');

  return (
    <AuthFormCard
      title="Welcome back"
      subtitle="Sign in to continue to your dashboard"
      footer={
        <p className="mt-6 text-center text-sm text-slate-600">
          New candidate?{' '}
          <Link className="font-semibold text-mint-dark hover:text-mint-dark" to="/register">
            Create an account
          </Link>
        </p>
      }
    >
      <form
        className="flex flex-col gap-4"
        onSubmit={handleSubmit((data) => mutation.mutate(data))}
      >
        <label className="app-label">
          Email
          <input
            className="app-input"
            type="email"
            autoComplete="email"
            placeholder="you@company.com"
            {...register('email')}
          />
          {errors.email && (
            <span className="mt-1 block text-xs font-medium text-red-600">
              {errors.email.message}
            </span>
          )}
        </label>
        <label className="app-label">
          Password
          <input
            className="app-input"
            type="password"
            autoComplete="current-password"
            placeholder="••••••••"
            {...register('password')}
          />
        </label>
        {mutation.isError && (
          <p
            className="rounded-lg bg-red-50 px-3 py-2 text-center text-sm font-medium text-red-700 ring-1 ring-red-200/80"
            role="alert"
          >
            {getLoginErrorMessage(mutation.error)}
          </p>
        )}
        <button
          type="submit"
          disabled={mutation.isPending}
          className="btn-primary mt-1 w-full py-3"
        >
          {mutation.isPending ? 'Signing in…' : 'Sign in'}
        </button>
      </form>
    </AuthFormCard>
  );
}
