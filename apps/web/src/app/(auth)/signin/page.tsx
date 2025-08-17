"use client";

import { useState } from 'react';
import { authClient } from '@/lib/auth-client';
import { useRouter } from 'next/navigation';

export default function SignInPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSignup, setIsSignup] = useState(false);
  const router = useRouter();

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (isSignup) {
      const { data, error } = await authClient.signUp.email({ email, password, name: email, callbackURL: '/admin' });
      if (error) return setError(error.message || 'Sign-up failed');
      if (data?.user?.id) document.cookie = `ba_uid=${data.user.id}; path=/`;
      router.push('/admin');
      return;
    } else {
      const { data, error } = await authClient.signIn.email({ email, password, callbackURL: '/admin' });
      if (error) return setError(error.message || 'Sign-in failed');
      if (data?.user?.id) document.cookie = `ba_uid=${data.user.id}; path=/`;
      router.push('/admin');
    }
  }

  return (
    <main style={{ padding: 24 }}>
      <h1>{isSignup ? 'Create account' : 'Sign in'}</h1>
      <form onSubmit={submit} style={{ display: 'grid', gap: 12, maxWidth: 320 }}>
        <input placeholder="Email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
        <input placeholder="Password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
        {error && <div style={{ color: 'red' }}>{error}</div>}
        <button type="submit">{isSignup ? 'Sign up' : 'Sign in'}</button>
      </form>
      <div style={{ marginTop: 12 }}>
        <button onClick={() => setIsSignup((v) => !v)}>
          {isSignup ? 'Have an account? Sign in' : "New here? Create account"}
        </button>
      </div>
    </main>
  );
}


