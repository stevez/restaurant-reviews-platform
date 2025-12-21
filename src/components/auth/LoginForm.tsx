'use client';

import Link from 'next/link';
import { useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { loginSchema, type LoginInput } from '@/lib/validators';
import { loginAction } from '@/app/actions/auth';

function FormError({ message }: { message?: string }) {
  if (!message) {
    return null;
  }
  return <div className="text-red-600 text-sm text-center">{message}</div>;
}

function FieldError({ message }: { message?: string }) {
  if (!message) {
    return null;
  }
  return <p className="mt-1 text-sm text-red-600">{message}</p>;
}

export function LoginForm() {
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  const {
    register,
    handleSubmit,
    formState: { errors },
    setError,
  } = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
    mode: 'onBlur',
    reValidateMode: 'onChange',
    defaultValues: {
      email: '',
      password: '',
    },
  });

  const onSubmit = (data: LoginInput) => {
    startTransition(async () => {
      const result = await loginAction(data.email, data.password);

      if ('error' in result) {
        setError('root', { message: result.error });
      } else {
        router.push('/');
        router.refresh();
      }
    });
  };

  return (
    <div className="mt-10 max-w-md mx-auto w-full shadow-2xl p-6 rounded-lg">
      <form className="space-y-6" onSubmit={handleSubmit(onSubmit)}>
        <FormError message={errors.root?.message} />

        <div>
          <label htmlFor="email" className="block text-gray-800 text-sm font-semibold">
            Email
          </label>
          <div className="mt-2">
            <input
              id="email"
              type="email"
              autoComplete="email"
              disabled={isPending}
              {...register('email')}
              className="block w-full rounded-md border-0 px-3 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-blue-600"
            />
            <FieldError message={errors.email?.message} />
          </div>
        </div>

        <div>
          <label htmlFor="password" className="block text-gray-800 text-sm font-semibold">
            Password
          </label>
          <div className="mt-2">
            <input
              id="password"
              type="password"
              autoComplete="current-password"
              disabled={isPending}
              {...register('password')}
              className="block w-full rounded-md border-0 px-3 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-blue-600"
            />
            <FieldError message={errors.password?.message} />
          </div>
        </div>

        <div>
          <button
            type="submit"
            disabled={isPending}
            className="flex w-full justify-center rounded-md bg-blue-600 px-3 py-1.5 text-sm font-semibold leading-6 text-white disabled:opacity-50 hover:bg-blue-500 transition-colors"
          >
            {isPending ? 'Signing in...' : 'Sign in'}
          </button>
        </div>
      </form>

      <p className="mt-10 text-center text-sm text-gray-500">
        Don&apos;t have an account?{' '}
        <Link
          href="/register"
          className="font-semibold leading-6 text-blue-600 hover:text-blue-500"
        >
          Register
        </Link>
      </p>
    </div>
  );
}
