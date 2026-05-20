import { Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { AuthFormCard } from '../components/auth/AuthFormCard';
import { useAuthMutation } from '../features/auth/useAuthMutation';

const schema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  name: z.string().optional(),
});

type Form = z.infer<typeof schema>;

export function RegisterPage() {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<Form>({ resolver: zodResolver(schema) });

  const mutation = useAuthMutation('/auth/register');

  return (
    <AuthFormCard
      title="Candidate sign up"
      subtitle="One account to browse roles, apply, and take assessments"
      footer={
        <p className="mt-6 text-center text-sm text-slate-600">
          Already have an account?{' '}
          <Link className="font-semibold text-mint-dark hover:text-mint-dark" to="/login">
            Sign in
          </Link>
        </p>
      }
    >
      <form
        className="flex flex-col gap-4"
        onSubmit={handleSubmit((data) => mutation.mutate(data))}
      >
        <label className="app-label">
          Name <span className="font-normal text-slate-400">(optional)</span>
          <input className="app-input" placeholder="Jane Doe" {...register('name')} />
        </label>
        <label className="app-label">
          Email
          <input
            className="app-input"
            type="email"
            autoComplete="email"
            placeholder="you@email.com"
            {...register('email')}
          />
          {errors.email && (
            <span className="mt-1 block text-xs font-medium text-red-600">
              {errors.email.message}
            </span>
          )}
        </label>
        <label className="app-label">
          Password <span className="font-normal text-slate-400">(min 8)</span>
          <input
            className="app-input"
            type="password"
            autoComplete="new-password"
            placeholder="••••••••"
            {...register('password')}
          />
          {errors.password && (
            <span className="mt-1 block text-xs font-medium text-red-600">
              {errors.password.message}
            </span>
          )}
        </label>
        {mutation.isError && (
          <p
            className="rounded-lg bg-red-50 px-3 py-2 text-center text-sm font-medium text-red-700 ring-1 ring-red-200/80"
            role="alert"
          >
            Could not register — try a different email.
          </p>
        )}
        <button
          type="submit"
          disabled={mutation.isPending}
          className="btn-primary mt-1 w-full py-3"
        >
          {mutation.isPending ? 'Creating account…' : 'Create account'}
        </button>
      </form>
    </AuthFormCard>
  );
}
