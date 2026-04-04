'use client';

import { useSearchParams } from 'next/navigation';
import AuthPage from '@/screens/AuthPage';

export default function SignInPage() {
  const searchParams = useSearchParams();
  const mode = searchParams.get('mode') === 'signup' ? 'signup' : 'login';

  return <AuthPage initialMode={mode} />;
}
