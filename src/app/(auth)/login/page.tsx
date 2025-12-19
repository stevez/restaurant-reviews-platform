import { LoginForm } from '@/components/auth/LoginForm';

export default function LoginPage() {
  return (
    <div className="flex min-h-full flex-col justify-center px-6 py-12 mb-48">
      <h2 className="mt-10 text-center text-2xl font-bold leading-9 tracking-tight text-gray-900">
        Sign in
      </h2>
      <LoginForm />
    </div>
  );
}
