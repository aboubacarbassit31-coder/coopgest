'use client'
import { useState } from 'react'
import { supabase } from '@/lib/supabase'

type Props = { onClose: () => void }

const CHAMPS = [
  { key: 'prenom',        label: 'Prénom',         type: 'text',   required: true  },
  { key: 'nom',           label: 'Nom',             type: 'text',   required: true  },
  { key: 'telephone',     label: 'Téléphone',       type: 'tel',    required: false },
  { key: 'superficie_ha', label: 'Superficie (ha)', type: 'number', required: false },
]

export default function AjoutMembreModal({ onClose }: Props) {
  const [form, setForm]     = useState({ prenom: '', nom: '', telephone: '', superficie_ha: '' })
  const [loading, setLoading] = useState(false)
  const [error, setError]   = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { setError('Session expirée.'); setLoading(false); return }
    const { error } = await supabase.from('membres').insert({
      prenom:        form.prenom.trim(),
      nom:           form.nom.trim(),
      telephone:     form.telephone.trim() || null,
      superficie_ha: form.superficie_ha ? parseFloat(form.superficie_ha) : null,
      user_id:       user.id,
    })
    if (error) { setError('Erreur lors de l\'ajout.'); setLoading(false); return }
    onClose()
  }

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 px-4">
      <div className="bg-white rounded-xl shadow-lg w-full max-w-md p-6">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-lg font-semibold text-gray-900">Nouveau membre</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl">×</button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          {CHAMPS.map(c => (
            <div key={c.key}>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {c.label}{c.required && <span className="text-red-500 ml-0.5">*</span>}
              </label>
              <input type={c.type} value={(form as any)[c.key]}
                onChange={e => setForm(p => ({ ...p, [c.key]: e.target.value }))}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                required={c.required} />
            </div>
          ))}
          {error && <p className="text-sm text-red-600">{error}</p>}
          <div className="flex gap-3 pt-1">
            <button type="button" onClick={onClose}
              className="flex-1 border border-gray-300 rounded-lg py-2.5 text-sm text-gray-600 hover:bg-gray-50">
              Annuler
            </button>
            <button type="submit" disabled={loading}
              className="flex-1 bg-emerald-600 text-white rounded-lg py-2.5 text-sm font-medium hover:bg-emerald-700 disabled:opacity-50">
              {loading ? 'Enregistrement...' : 'Ajouter'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
