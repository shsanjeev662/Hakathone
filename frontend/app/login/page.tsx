'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { authService } from '@/services';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('admin@dhukuti.com');
  const [password, setPassword] = useState('admin@123');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (localStorage.getItem('token')) router.push('/');
  }, [router]);

  const handleLogin = async (event: React.FormEvent) => {
    event.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const user = await authService.login(email, password);
      localStorage.setItem('token', user.token || '');
      localStorage.setItem('user', JSON.stringify(user));
      router.push(user.role === 'ADMIN' ? '/admin/dashboard' : '/member/dashboard');
    } catch (err: any) {
      setError(err.response?.data?.error || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[linear-gradient(135deg,#123524_0%,#205b43_45%,#d9b760_100%)] px-4 py-10">
      <div className="mx-auto grid min-h-[calc(100vh-5rem)] max-w-6xl gap-6 lg:grid-cols-[1.1fr_0.9fr]">
        <section className="rounded-[2rem] border border-white/20 bg-white/10 p-8 text-white shadow-[0_40px_120px_rgba(0,0,0,0.25)] backdrop-blur">
          <p className="text-sm font-semibold uppercase tracking-[0.35em] text-amber-200">Hackathon Demo</p>
          <h1 className="mt-4 font-serif text-5xl leading-tight">Smart Digital Cooperative System</h1>
          <p className="mt-6 max-w-xl text-base text-white/82">
            Built for Dhukuti groups in Nepal to improve transparency, trust, repayment discipline, and fast decision-making for low-tech users.
          </p>
          <div className="mt-10 grid gap-4 sm:grid-cols-2">
            {[
              'Admin dashboard with risk alerts',
              'Member portal with trust score',
              'Repayment schedule and overdue tracking',
              'Reports, voice assist, and offline drafts',
            ].map((item) => (
              <div key={item} className="rounded-[1.5rem] bg-white/12 p-4">
                <p className="text-sm font-medium">{item}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="rounded-[2rem] bg-white p-8 shadow-[0_40px_120px_rgba(0,0,0,0.18)]">
          <div className="mb-6">
            <p className="text-sm font-semibold uppercase tracking-[0.28em] text-emerald-700">Secure Access</p>
            <h2 className="mt-3 font-serif text-3xl text-slate-900">Welcome back</h2>
            <p className="mt-2 text-sm text-slate-600">Sign in with the admin account first. Member accounts are created by the admin and then used by each member to log in.</p>
          </div>

          {error ? <div className="mb-4 rounded-2xl bg-rose-50 p-4 text-sm text-rose-700">{error}</div> : null}

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700">Email</label>
              <input value={email} onChange={(e) => setEmail(e.target.value)} type="email" required />
            </div>
            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700">Password</label>
              <input value={password} onChange={(e) => setPassword(e.target.value)} type="password" required />
            </div>
            <button type="submit" disabled={loading} className="btn btn-primary w-full">
              {loading ? 'Signing In...' : 'Open Dashboard'}
            </button>
          </form>

          <div className="mt-6 rounded-[1.5rem] bg-slate-50 p-5 text-sm text-slate-700">
            <p className="font-semibold text-slate-900">Admin account</p>
            <p className="mt-2">Email: `admin@dhukuti.com`</p>
            <p>Password: `admin@123`</p>
            <p className="mt-3 text-slate-600">Members use the email and password set for them by the admin during account creation.</p>
          </div>
        </section>
      </div>
    </div>
  );
}
