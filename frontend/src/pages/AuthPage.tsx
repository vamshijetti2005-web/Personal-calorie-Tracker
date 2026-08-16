import { useState, type FormEvent } from 'react'
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom'
import { ApiError } from '../api'
import { Button, ErrorBanner, Input, Label } from '../components/UI'
import { useAuth } from '../context/authState'

export function AuthPage({ mode }: { mode: 'login' | 'register' }) {
  const { user, login, register } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [displayName, setDisplayName] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  if (user) return <Navigate to="/" replace />

  async function submit(event: FormEvent) {
    event.preventDefault()
    setSaving(true)
    setError(null)
    try {
      if (mode === 'login') await login(email, password)
      else await register(email, password, displayName)
      const destination =
        (location.state as { from?: string } | null)?.from ?? '/'
      navigate(destination, { replace: true })
    } catch (cause) {
      setError(
        cause instanceof ApiError
          ? cause.message
          : 'Authentication could not be completed',
      )
    } finally {
      setSaving(false)
    }
  }

  function useDemoAccount() {
    setEmail('demo@nourish.local')
    setPassword('DemoPass123!')
    setError(null)
  }

  return (
    <main className="grid min-h-screen bg-[#f6f3eb] lg:grid-cols-2">
      <section className="hidden overflow-hidden bg-emerald-950 p-12 text-white lg:flex lg:flex-col lg:justify-between">
        <div className="flex items-center gap-3">
          <div className="grid size-12 place-items-center rounded-2xl bg-amber-400 font-display text-2xl text-emerald-950">
            N
          </div>
          <div>
            <p className="font-display text-3xl">Nourish</p>
            <p className="text-xs uppercase tracking-[0.2em] text-emerald-100/55">
              Daily nutrition
            </p>
          </div>
        </div>
        <div>
          <p className="max-w-xl font-display text-5xl leading-tight">
            Your food. Your goals. Your private nutrition story.
          </p>
          <p className="mt-5 max-w-lg leading-7 text-emerald-100/60">
            Each account has an isolated diary, goal history, reports, and
            AI-assisted meal workflow.
          </p>
        </div>
        <p className="text-xs text-emerald-100/40">
          Personal Calorie Tracker · Java + React
        </p>
      </section>

      <section className="grid place-items-center px-5 py-10">
        <div className="w-full max-w-md">
          <div className="mb-8 flex items-center gap-3 lg:hidden">
            <div className="grid size-10 place-items-center rounded-2xl bg-emerald-950 font-display text-xl text-amber-300">
              N
            </div>
            <p className="font-display text-2xl text-emerald-950">Nourish</p>
          </div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-amber-700">
            {mode === 'login' ? 'Welcome back' : 'Create your account'}
          </p>
          <h1 className="mt-2 font-display text-4xl text-emerald-950">
            {mode === 'login' ? 'Sign in to your diary' : 'Start tracking'}
          </h1>
          <p className="mt-2 text-sm leading-6 text-stone-500">
            {mode === 'login'
              ? 'Use the demo account or your own credentials.'
              : 'Your meals, goals, and reports are isolated from every other account.'}
          </p>

          <form
            className="mt-7 space-y-4 rounded-3xl border border-stone-200 bg-white p-6 shadow-[0_20px_55px_-35px_rgba(23,63,53,.45)]"
            onSubmit={(event) => void submit(event)}
          >
            {mode === 'login' && (
              <div className="flex items-center justify-between gap-3 rounded-2xl bg-amber-50 px-4 py-3">
                <div>
                  <p className="text-sm font-semibold text-amber-900">
                    Evaluating the app?
                  </p>
                  <p className="text-xs text-amber-800/70">
                    Load the public demo account explicitly.
                  </p>
                </div>
                <Button
                  type="button"
                  variant="secondary"
                  onClick={useDemoAccount}
                >
                  Use demo
                </Button>
              </div>
            )}
            {mode === 'register' && (
              <div>
                <Label htmlFor="auth-display-name">Display name</Label>
                <Input
                  id="auth-display-name"
                  value={displayName}
                  maxLength={80}
                  onChange={(event) => setDisplayName(event.target.value)}
                  required
                />
              </div>
            )}
            <div>
              <Label htmlFor="auth-email">Email</Label>
              <Input
                id="auth-email"
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                required
              />
            </div>
            <div>
              <Label htmlFor="auth-password">Password</Label>
              <Input
                id="auth-password"
                type="password"
                value={password}
                minLength={8}
                maxLength={128}
                onChange={(event) => setPassword(event.target.value)}
                required
              />
            </div>
            <ErrorBanner error={error} />
            <Button type="submit" className="w-full" disabled={saving}>
              {saving
                ? 'Please wait…'
                : mode === 'login'
                  ? 'Sign in'
                  : 'Create account'}
            </Button>
          </form>

          <p className="mt-5 text-center text-sm text-stone-500">
            {mode === 'login' ? 'New to Nourish?' : 'Already have an account?'}{' '}
            <Link
              className="font-semibold text-emerald-800 hover:underline"
              to={mode === 'login' ? '/register' : '/login'}
            >
              {mode === 'login' ? 'Create an account' : 'Sign in'}
            </Link>
          </p>
        </div>
      </section>
    </main>
  )
}
