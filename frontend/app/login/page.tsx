'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { authService } from '@/services';
import { sendResetRequestEmail } from '@/lib/emailjs';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [forgotEmail, setForgotEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [forgotLoading, setForgotLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [forgotMessage, setForgotMessage] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);

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

  const handleForgotPassword = async (event: React.FormEvent) => {
    event.preventDefault();
    setForgotLoading(true);
    setForgotMessage(null);
    setError(null);

    try {
      const response = await authService.forgotPassword(forgotEmail);
      const emailResult = await sendResetRequestEmail(forgotEmail).catch(() => ({ sent: false }));
      setForgotMessage(response.message);
      if (!emailResult.sent) {
        setForgotMessage(`${response.message} EmailJS notification was skipped because it is not configured yet.`);
      }
      setForgotEmail('');
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to submit forgot password request');
    } finally {
      setForgotLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#f5f7fb] px-4 py-10">
      <div className="mx-auto grid min-h-[calc(100vh-5rem)] max-w-6xl gap-6 lg:grid-cols-[1.15fr_0.85fr]">
        <section className="rounded-[2rem] border border-slate-200 bg-white p-8 shadow-[0_24px_60px_rgba(15,23,42,0.06)]">
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-950 shadow-[0_12px_24px_rgba(15,23,42,0.18)]">
              <div className="relative h-7 w-7 rounded-xl border-2 border-white/90">
                <div className="absolute inset-y-1 left-1.5 w-1.5 rounded-full bg-white/90" />
                <div className="absolute bottom-1 right-1 h-3 w-3 rounded-md border-2 border-white/90" />
              </div>
            </div>
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.18em] text-slate-500">SMART DHUKUTI</p>
              <p className="text-sm text-slate-400">Digital Cooperative Operations</p>
            </div>
          </div>

          <h1 className="mt-10 max-w-3xl text-[3.25rem] font-semibold leading-[1.05] tracking-[-0.05em] text-slate-900">
            Clean, reliable operations for community savings groups.
          </h1>
          <p className="mt-6 max-w-2xl text-base leading-7 text-slate-500">
            Community savings groups such as Dhikuti and Dharma in Nepal often manage contributions and loans through handwritten records. This platform replaces that with a professional digital workflow for member registration, monthly deposits, loan scheduling, overdue alerts, repayment tracking, and transparent member access.
          </p>

          <div className="mt-10 grid gap-4 sm:grid-cols-2">
            {[
              ['Member Administration', 'Register members, assign real credentials, and maintain structured cooperative records.'],
              ['Contribution Monitoring', 'Record monthly contributions, track missed payments, and reduce disputes with a clear ledger.'],
              ['Loan Oversight', 'Issue loans with instalment schedules, follow repayments, and identify overdue balances quickly.'],
              ['Decision Support', 'Trust score, risk insight, reports, alerts, and focused dashboards for better decisions.'],
            ].map(([title, copy]) => (
              <div key={title} className="rounded-[1.75rem] border border-slate-200 bg-slate-50/70 p-5">
                <p className="text-base font-semibold text-slate-900">{title}</p>
                <p className="mt-2 text-sm leading-6 text-slate-500">{copy}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="rounded-[2rem] border border-slate-200 bg-white p-8 shadow-[0_24px_60px_rgba(15,23,42,0.06)]">
          <div className="mb-6">
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-slate-500">Secure Access</p>
            <h2 className="mt-3 text-3xl font-semibold tracking-[-0.04em] text-slate-900">Welcome back</h2>
            <p className="mt-2 text-sm text-slate-600">Sign in with the admin account first. Member accounts are created by the admin and then used by each member to log in.</p>
          </div>

          {error ? <div className="mb-4 rounded-2xl bg-rose-50 p-4 text-sm text-rose-700">{error}</div> : null}
          {forgotMessage ? <div className="mb-4 rounded-2xl bg-teal-50 p-4 text-sm text-teal-700">{forgotMessage}</div> : null}

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700">Email</label>
              <input value={email} onChange={(e) => setEmail(e.target.value)} type="email" required />
            </div>
            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700">Password</label>
              <div className="flex gap-2">
                <input
                  className="flex-1"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  type={showPassword ? 'text' : 'password'}
                  required
                />
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setShowPassword((value) => !value)}
                >
                  {showPassword ? 'Hide' : 'Show'}
                </button>
              </div>
            </div>
            <button type="submit" disabled={loading} className="btn btn-primary w-full">
              {loading ? 'Signing In...' : 'Open Dashboard'}
            </button>
          </form>

          <div className="mt-6 rounded-[1.5rem] border border-slate-200 bg-slate-50 p-5">
            <p className="text-sm font-semibold text-slate-900">Forgot password?</p>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              Members can request help here. Only an admin can reset a member password and unlock a locked member account.
            </p>
            <form onSubmit={handleForgotPassword} className="mt-4 space-y-3">
              <input
                value={forgotEmail}
                onChange={(e) => setForgotEmail(e.target.value)}
                type="email"
                placeholder="member@dhukuti.com"
                required
              />
              <button type="submit" disabled={forgotLoading} className="btn btn-secondary w-full">
                {forgotLoading ? 'Sending Request...' : 'Request Admin Reset'}
              </button>
            </form>
          </div>

        </section>
      </div>
    </div>
  );
}
