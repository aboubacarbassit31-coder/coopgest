'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import Navbar from '@/components/Navbar'

type Membre = { id: string; nom: string; prenom: string }
type Cotisation = {
  id: string
  membre_id: string
  montant: number
  mois: string
  statut: 'paye' | 'partiel' | 'impaye'
  note: string | null
  membres: { nom: string; prenom: string }
}

const STATUT_CONFIG = {
  paye:    { label: 'Payé',    className: 'bg-emerald-100 text-emerald-800' },
  partiel: { label: 'Partiel', className: 'bg-amber-100 text-amber-800' },
  impaye:  { label: 'Impayé',  className: 'bg-red-100 text-red-800' },
}

export default function CotisationsPage() {
  const [cotisations, setCotisations] = useState<Cotisation[]>([])
  const [membres, setMembres]         = useState<Membre[]>([])
  const [loading, setLoading]         = useState(true)
  const [showForm, setShowForm]       = useState(false)
  const [form, setForm] = useState({ membre_id: '', montant: '', mois: '', statut: 'paye', note: '' })
  const router = useRouter()

  useEffect(() => { checkAuth() }, [])

  async function checkAuth() {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { router.push('/login'); return }
    await Promise.all([fetchCotisations(), fetchMembres()])
  }

  async function fetchCotisations() {
    setLoading(true)
    const { data } = await supabase
      .from('cotisations')
      .select('*, membres(nom, prenom)')
      .order('mois', { ascending: false })
    setCotisations(data || [])
    setLoading(false)
  }

  async function fetchMembres() {
    const { data } = await supabase.from('membres').select('id, nom, prenom').order('nom')
    setMembres(data || [])
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    await supabase.from('cotisations').insert({
      membre_id: form.membre_id,
      montant:   parseFloat(form.montant),
      mois:      form.mois + '-01',
      statut:    form.statut,
      note:      form.note || null,
      user_id:   user.id,
    })
    setShowForm(false)
    setForm({ membre_id: '', montant: '', mois: '', statut: 'paye', note: '' })
    fetchCotisations()
  }

  const total = cotisations.reduce((s, c) => s + c.montant, 0)
  const payes = cotisations.filter(c => c.statut === 'paye').length
  const impayes = cotisations.filter(c => c.statut === 'impaye').length

  return (
    <>
      <Navbar />
      <main className="max-w-5xl mx-auto px-4 py-6">
        <div className="grid grid-cols-3 gap-3 mb-6">
          <div className="bg-white rounded-xl p-4 border border-gray-200">
            <p className="text-2xl font-semibold text-gray-900">{total.toLocaleString()} FCFA</p>
            <p className="text-xs text-gray-500 mt-0.5">Total collecté</p>
          </div>
          <div className="bg-white rounded-xl p-4 border border-gray-200">
            <p className="text-2xl font-semibold text-emerald-600">{payes}</p>
            <p className="text-xs text-gray-500 mt-0.5">Payés</p>
          </div>
          <div className="bg-white rounded-xl p-4 border border-gray-200">
            <p className="text-2xl font-semibold text-red-600">{impayes}</p>
            <p className="text-xs text-gray-500 mt-0.5">Impayés</p>
          </div>
        </div>
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-semibold text-gray-900">Cotisations</h2>
          <button onClick={() => setShowForm(true)}
            className="bg-emerald-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-emerald-700 transition-colors">
            + Nouvelle cotisation
          </button>
        </div>
        {loading ? (
          <div className="text-center py-16 text-gray-400">Chargement...</div>
        ) : cotisations.length === 0 ? (
          <div className="text-center py-16 text-gray-400">Aucune cotisation enregistrée</div>
        ) : (
          <div className="bg-white rounded-xl border border-gray-200 divide-y divide-gray-100">
            {cotisations.map(c => (
              <div key={c.id} className="flex items-center justify-between px-5 py-4">
                <div>
                  <p className="text-sm font-medium text-gray-900">{c.membres?.prenom} {c.membres?.nom}</p>
                  <p className="text-xs text-gray-400">
                    {new Date(c.mois).toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })}
                    {c.note ? ' · ' + c.note : ''}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-sm font-medium text-gray-900">{c.montant.toLocaleString()} FCFA</span>
                  <span className={'text-xs px-2.5 py-1 rounded-full font-medium ' + STATUT_CONFIG[c.statut].className}>
                    {STATUT_CONFIG[c.statut].label}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
      {showForm && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 px-4">
          <div className="bg-white rounded-xl shadow-lg w-full max-w-md p-6">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-semibold text-gray-900">Nouvelle cotisation</h2>
              <button onClick={() => setShowForm(false)} className="text-gray-400 hover:text-gray-600 text-xl">x</button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Membre</label>
                <select value={form.membre_id} onChange={e => setForm(p => ({ ...p, membre_id: e.target.value }))}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500" required>
                  <option value="">Sélectionner un membre</option>
                  {membres.map(m => <option key={m.id} value={m.id}>{m.prenom} {m.nom}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Montant (FCFA)</label>
                <input type="number" value={form.montant} onChange={e => setForm(p => ({ ...p, montant: e.target.value }))}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500" required min="0" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Mois</label>
                <input type="month" value={form.mois} onChange={e => setForm(p => ({ ...p, mois: e.target.value }))}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500" required />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Statut</label>
                <select value={form.statut} onChange={e => setForm(p => ({ ...p, statut: e.target.value }))}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500">
                  <option value="paye">Payé</option>
                  <option value="partiel">Partiel</option>
                  <option value="impaye">Impayé</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Note (optionnel)</label>
                <input type="text" value={form.note} onChange={e => setForm(p => ({ ...p, note: e.target.value }))}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500" placeholder="Ex: cotisation semences" />
              </div>
              <div className="flex gap-3 pt-1">
                <button type="button" onClick={() => setShowForm(false)}
                  className="flex-1 border border-gray-300 rounded-lg py-2.5 text-sm text-gray-600 hover:bg-gray-50">Annuler</button>
                <button type="submit"
                  className="flex-1 bg-emerald-600 text-white rounded-lg py-2.5 text-sm font-medium hover:bg-emerald-700">Enregistrer</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  )
}
