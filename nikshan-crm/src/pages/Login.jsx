import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../store/auth.js'
import toast from 'react-hot-toast'

const DEMO = [
  { role:'Admin',          email:'admin@nikshancrm.com',   pass:'Nikshan@2026' },
  { role:'Branch Manager', email:'manager@nikshancrm.com', pass:'Manager@2026' },
  { role:'Sales Exec',     email:'demo@nikshancrm.com',    pass:'NikshanDemo@2026' },
]

export default function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const { login, token } = useAuth()
  const navigate = useNavigate()

  useEffect(() => { if (token) navigate('/dashboard') }, [token])

  const handleSubmit = async e => {
    e.preventDefault()
    setLoading(true)
    try {
      await login(email, password)
      navigate('/dashboard')
    } catch (err) {
      toast.error(err?.error || 'Invalid credentials')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-primary-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-primary-600 rounded-2xl shadow-lg mb-4">
            <span className="text-white font-bold text-2xl">IX</span>
          </div>
          <h1 className="text-2xl font-bold text-slate-900">IPIX CRM</h1>
          <p className="text-slate-500 text-sm mt-1">Nikshan Electronics Management</p>
        </div>

        {/* Form */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-8">
          <h2 className="text-lg font-semibold text-slate-800 mb-6">Sign in to your account</h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="label">Email address</label>
              <input type="email" className="input" placeholder="you@nikshan.com" value={email} onChange={e=>setEmail(e.target.value)} required autoFocus />
            </div>
            <div>
              <label className="label">Password</label>
              <input type="password" className="input" placeholder="••••••••" value={password} onChange={e=>setPassword(e.target.value)} required />
            </div>
            <button type="submit" disabled={loading} className="btn-primary w-full py-2.5 text-center mt-2 disabled:opacity-60">
              {loading ? 'Signing in...' : 'Sign in'}
            </button>
          </form>

          {/* Demo creds */}
          <div className="mt-6 pt-5 border-t border-slate-100">
            <p className="text-xs font-medium text-slate-500 mb-3">Demo credentials:</p>
            <div className="space-y-1.5">
              {DEMO.map(d => (
                <button key={d.email} onClick={() => { setEmail(d.email); setPassword(d.pass) }}
                  className="w-full text-left px-3 py-2 rounded-lg hover:bg-slate-50 transition-colors group">
                  <span className="text-xs font-semibold text-primary-700 group-hover:text-primary-800">{d.role}</span>
                  <span className="text-xs text-slate-500 ml-2">{d.email}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
