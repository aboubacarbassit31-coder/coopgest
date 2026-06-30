'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import Navbar from '@/components/Navbar'

type Membre = { id: string; nom: string; prenom: string }
type Credit = {
  id: string
  membre_id: string
  montant: number
  objet: string
  date_octroi: string
  date_echeance: string
  montant_rembourse: number
  statut: 'en_cours' | 'rembourse' | 'en_retard'
  membres: { nom: string; prenom: string }
}

export default function CreditsPage() {
  const [credits, setCredits] = useState<Credit[]>([])
  const [membres, setMembres] = useState<Membre[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ membre_id: '', montant: '', objet: '', date_echeance: '' })
  const router = useRouter()

  useEffect(() => { checkAuth() }, [])

  async function checkAuth() {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { router.push('/login'); return }
    await Promise.all([fetchCredits(), fetchMembres()])
  }

  async function fetchCredits() {
    setLoading(true)
    const { data } = await supabase
      .from('credits')
      .select('*, membres(nom, prenom)')
      .order('date_echeance', { ascending: true })
    setCredits(data || [])
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
    await supabase.from('credits').insert({
      membre_id:     form.membre_id,
      montant:       parseFloat(form.montant),
      objet:         form.objet,
      date_echeance: form.date_echeance,
      user_id:       user.id,
    })
    setShowForm(false)
    setForm({ membre_id: '', montant: '', objet: '', date_echeance: '' })
    fetchCredits()
  }

  async function marquerRembourse(id: string, montant: number) {
    await supabase.from('credits').update({ montant_rembourse: montant, statut: 'rembourse' }).eq('id', id)
    fetchCredits()
  }

  const totalPrete = credits.reduce((s, c) => s + c.montant, 0)
  const totalRembourse = credits.reduce((s, c) => s + c.montant_rembourse, 0)
  const enRetard = credits.filter(c => c.statut !== 'rembourse' && new Date(c.date_echeance) < new Date()).length

  function progressPct(c: Credit) {
    return Math.min(100, Math.round((c.montant_rembourse / c.montant) * 100))
  }

  function isEnRetard(c: Credit) {
    return c.statut !== 'rembourse' && new Date(c.date_echeance) < new Date()
  }

  return (
    <>
      <Navbar />
      <main className="max-w-5xl mx-auto px-4 py-6">
        <div className="grid grid-cols-3 gap-3 mb-6">
          <div className="bg-white rounded-xl p-4 border border-gray-200">
            <p className="text-2xl font-semibold text-gray-900">{totalPrete.toLocaleString()} FCFA</p>
            <p className="text-xs text-gray-500 mt-0.5">Total prêté</p>
          </div>
          <div className="bg-white rounded-xl p-4 border border-gray-200">
            <p className="text-2xl font-semibold text-emerald-600">{totalRembourse.toLocaleString()} FCFA</p>
            <p className="text-xs text-gray-500 mt-0.5">Total remboursé</p>
          </div>
          <div className="bg-white rounded-xl p-4 border border-gray-200">
            <p className="text-2xl font-semibold text-red-600">{enRetard}</p>
            <p className="text-xs text-gray-500 mt-0.5">Crédits en retard</p>
          </div>
        </div>
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-semibold text-gray-900">Crédits groupés</h2>
          <button onClick={() => setShowForm(true)}
            className="bg-emerald-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-emerald-700 transition-colors">
            + Nouveau crédit
          </button>
        </div>
        {loading ? (
          <div className="text-center py-16 text-gray-400">Chargement...</div>
        ) : credits.length === 0 ? (
          <div className="text-center py-16 text-gray-400">Aucun crédit enregistré</div>
        ) : (
          <div className="bg-white rounded-xl border border-gray-200 divide-y divide-gray-100">
            {credits.map(c => {
              const retard = isEnRetard(c)
              return (
                <div key={c.id} className="px-5 py-4">
                  <div className="flex items-center justify-between mb-2">
                    <div>
                      <p className="text-sm font-medium text-gray-900">{c.membres?.prenom} {c.membres?.nom}</p>
                      <p className="text-xs text-gray-400">{c.objet} · Échéance {new Date(c.date_echeance).toLocaleDateString('fr-FR')}</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-sm font-medium text-gray-900">
                        {c.montant_rembourse.toLocaleString()} / {c.montant.toLocaleString()} FCFA
                      </span>
                      <span className={'text-xs px-2.5 py-1 rounded-full font-medium ' + (
                        c.statut === 'rembourse' ? 'bg-emerald-100 text-emerald-800' :
                        retard ? 'bg-red-100 text-red-800' : 'bg-amber-100 text-amber-800'
                      )}>
                        {c.statut === 'rembourse' ? 'Remboursé' : retard ? 'En retard' : 'En cours'}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="flex-1 bg-gray-100 rounded-full h-2">
                      <div className={'h-2 rounded-full ' + (retard ? 'bg-red-500' : 'bg-emerald-500')} style={{ width: progressPct(c) + '%' }} />
                    </div>
                    {c.statut !== 'rembourse' && (
                      <button onClick={() => marquerRembourse(c.id, c.montant)}
                        className="text-xs text-emerald-600 font-medium hover:underline whitespace-nowrap">
                        Marquer remboursé
                      </button>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </main>
      {showForm && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 px-4">
          <div className="bg-white rounded-xl shadow-lg w-full max-w-md p-6">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-semibold text-gray-900">Nouveau crédit</h2>
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
                <label className="block text-sm font-medium text-gray-700 mb-1">Objet du crédit</label>
                <input type="text" value={form.objet} onChange={e => setForm(p => ({ ...p, objet: e.target.value }))}
                  placeholder="Ex: Intrants agricoles, Matériel"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500" required />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Date d'échéance</label>
                <input type="date" value={form.date_echeance} onChange={e => setForm(p => ({ ...p, date_echeance: e.target.value }))}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500" required />
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
