import { useEffect, useMemo, useState } from 'react'
import apiFetch from '../lib/api'
import { useLocation, useNavigate } from 'react-router-dom'

const Login = ({ onLogin, user }) => {
  const [form, setForm] = useState({ name: '', password: '' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()
  const location = useLocation()
  const redirectPath = useMemo(
    () => location.state?.from?.pathname || '/',
    [location.state],
  )

  useEffect(() => {
    if (user) {
      navigate(redirectPath, { replace: true })
    }
  }, [user, navigate, redirectPath])

  const handleChange = (event) => {
    const { name, value } = event.target
    setForm((prev) => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    if (!form.name.trim() || !form.password.trim()) {
      setError('Both fields are required.')
      return
    }

    try {
      setLoading(true)
      setError('')
      const response = await apiFetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: form.name.trim(),
          password: form.password.trim(),
        }),
      })

      const data = await response.json().catch(() => ({}))
      if (!response.ok) {
        throw new Error(data.message || 'Invalid credentials.')
      }

      onLogin({ id: data.user.id, name: data.user.name, role: data.user.role })
    } catch (err) {
      setError(err.message || 'Unable to login. Try again later.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-slate-950 px-4">
      <div className="w-full max-w-md rounded-3xl bg-white/95 p-10 shadow-2xl ring-1 ring-slate-100">
        <div className="space-y-2 text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.4em] text-orange-500">
            Valour Interior
          </p>
          <h1 className="text-2xl font-semibold text-slate-900">Studio Access</h1>
          <p className="text-sm text-slate-500">
            Enter your credentials to explore the project showcase.
          </p>
        </div>
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <label className="block text-sm font-semibold text-slate-900">
            Name
            <input
              type="text"
              name="name"
              value={form.name}
              onChange={handleChange}
              className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 text-base text-slate-900 focus:border-orange-400 focus:outline-none focus:ring-2 focus:ring-orange-100"
              placeholder="Harsh"
            />
          </label>
          <label className="block text-sm font-semibold text-slate-900">
            Password
            <input
              type="password"
              name="password"
              value={form.password}
              onChange={handleChange}
              className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 text-base text-slate-900 focus:border-orange-400 focus:outline-none focus:ring-2 focus:ring-orange-100"
              placeholder="••••••••"
            />
          </label>
          {error ? (
            <p className="text-sm font-medium text-red-500" role="alert">
              {error}
            </p>
          ) : (
            <p className="text-xs text-slate-400">
              Credentials validate against admin records stored in Mongo Atlas.
            </p>
          )}
          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-full bg-slate-900 py-3 text-sm font-semibold uppercase tracking-wide text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-70"
          >
            {loading ? 'Checking…' : 'Enter Studio'}
          </button>
        </form>
      </div>
      <p className="mt-6 text-xs uppercase tracking-[0.3em] text-slate-500">
        Confidential preview portal
      </p>
    </div>
  )
}

export default Login