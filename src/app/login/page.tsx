'use client'
import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'

export default function LoginPage() {
  const [email, setEmail]       = useState('')
  const [password, setPassword] = useState('')
  const [error, setError]       = useState('')
  const [loading, setLoading]   = useState(false)
  const [mode, setMode]         = useState<'login' | 'signup'>('login')
  const router = useRouter()

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')
    if (mode === 'login') {
      const { error } = await supabase.auth.signInWithPassword({ email, password })
      if (error) { setError('Email ou mot de passe incorrect'); setLoading(false); return }
    } else {
      const { error } = await supabase.auth.signUp({ email, password })
      if (error) { setError(error.message); setLoading(false); return }
    }
    router.push('/membres')
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="bg-white p-8 rounded-xl shadow-sm w-full max-w-sm border border-gray-200">
        <div className="flex items-center gap-2 mb-6">
          <div className="w-8 h-8 bg-emerald-600 rounded-lg flex items-center justify-center">
            <span className="text-white text-sm font-bold">C</span>
          </div>
          <span className="text-xl font-semibold text-gray-900">CoopGest</span>
        </div>
        <h2 className="text-lg font-semibold text-gray-900 mb-1">
          {mode === 'login' ? 'Connexion' : 'Créer un compte'}
        </h2>
        <p className="text-sm text-gray-500 mb-6">
          {mode === 'login' ? 'Accédez à votre coopérative' : 'Inscrivez votre coopérative'}
        </p>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
            <input type="email" value={email} onChange={e => setEmail(e.target.value)}
              placeholder="president@coop.tg"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
              required />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Mot de passe</label>
            <input type="password" value={password} onChange={e => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
              required minLength={6} />
          </div>
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg px-3 py-2">
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}
          <button type="submit" disabled={loading}
            className="w-full bg-emerald-600 text-white py-2.5 rounded-lg text-sm font-medium hover:bg-emerald-700 disabled:opacity-50 transition-colors">
            {loading ? 'Chargement...' : mode === 'login' ? 'Se connecter' : "S'inscrire"}
          </button>
        </form>
        <p className="text-center text-sm text-gray-500 mt-4">
          {mode === 'login' ? "Pas encore de compte ?" : "Déjà un compte ?"}{' '}
          <button onClick={() => { setMode(mode === 'login' ? 'signup' : 'login'); setError('') }}
            className="text-emerald-600 font-medium hover:underline">
            {mode === 'login' ? "S'inscrire" : 'Se connecter'}
          </button>
        </p>
      </div>
    </div>
  )
}
