'use client';

import Link from 'next/link';
import { useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { registerSchema, type RegisterInput } from '@/lib/validators';
import { registerAction } from '@/app/actions/auth';

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

export function RegisterForm() {
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  const {
    register,
    handleSubmit,
    formState: { errors },
    setError,
  } = useForm<RegisterInput>({
    resolver: zodResolver(registerSchema),
    mode: 'onBlur',
    reValidateMode: 'onChange',
    defaultValues: {
      name: '',
      email: '',
      password: '',
      role: 'REVIEWER',
    },
  });

  const onSubmit = (data: RegisterInput) => {
    startTransition(async () => {
      const result = await registerAction(data.email, data.password, data.name, data.role);

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
          <label htmlFor="name" className="block text-gray-800 text-sm font-semibold">
            Name
          </label>
          <div className="mt-2">
            <input
              id="name"
              type="text"
              autoComplete="name"
              disabled={isPending}
              {...register('name')}
              className="block w-full rounded-md border-0 px-3 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-blue-600"
            />
            <FieldError message={errors.name?.message} />
          </div>
        </div>

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
              autoComplete="new-password"
              disabled={isPending}
              {...register('password')}
              className="block w-full rounded-md border-0 px-3 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-blue-600"
            />
            <FieldError message={errors.password?.message} />
            <p className="mt-1 text-xs text-gray-500">
              Must be at least 8 characters with uppercase, lowercase, and number
            </p>
          </div>
        </div>

        <div>
          <label htmlFor="role" className="block text-gray-800 text-sm font-semibold">
            Role
          </label>
          <div className="mt-2">
            <select
              id="role"
              disabled={isPending}
              {...register('role')}
              className="block w-full rounded-md border-0 px-3 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-inset focus:ring-blue-600"
            >
              <option value="REVIEWER">Reviewer</option>
              <option value="OWNER">Restaurant Owner</option>
            </select>
            <FieldError message={errors.role?.message} />
          </div>
        </div>

        <div>
          <button
            type="submit"
            disabled={isPending}
            className="flex w-full justify-center rounded-md bg-blue-600 px-3 py-1.5 text-sm font-semibold leading-6 text-white disabled:opacity-50 hover:bg-blue-500 transition-colors"
          >
            {isPending ? 'Registering...' : 'Register'}
          </button>
        </div>
      </form>

      <p className="mt-10 text-center text-sm text-gray-500">
        Already have an account?{' '}
        <Link
          href="/login"
          className="font-semibold leading-6 text-blue-600 hover:text-blue-500"
        >
          Sign in
        </Link>
      </p>
    </div>
  );
}
