'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import Navbar from '@/components/Navbar'

type Membre = { id: string; nom: string; prenom: string }
type Recolte = {
  id: string
  membre_id: string
  saison: string
  produit: string
  quantite_kg: number
  prix_unitaire: number
  date_recolte: string
  statut_paiement: 'paye' | 'en_attente'
  membres: { nom: string; prenom: string }
}

export default function RecoltesPage() {
  const [recoltes, setRecoltes] = useState<Recolte[]>([])
  const [membres, setMembres]   = useState<Membre[]>([])
  const [loading, setLoading]   = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({
    membre_id: '', saison: '', produit: '', quantite_kg: '', prix_unitaire: '', statut_paiement: 'en_attente'
  })
  const router = useRouter()

  useEffect(() => { checkAuth() }, [])

  async function checkAuth() {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { router.push('/login'); return }
    await Promise.all([fetchRecoltes(), fetchMembres()])
  }

  async function fetchRecoltes() {
    setLoading(true)
    const { data } = await supabase
      .from('recoltes')
      .select('*, membres(nom, prenom)')
      .order('date_recolte', { ascending: false })
    setRecoltes(data || [])
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
    await supabase.from('recoltes').insert({
      membre_id:       form.membre_id,
      saison:          form.saison,
      produit:         form.produit,
      quantite_kg:     parseFloat(form.quantite_kg),
      prix_unitaire:   parseFloat(form.prix_unitaire),
      statut_paiement: form.statut_paiement,
      user_id:         user.id,
    })
    setShowForm(false)
    setForm({ membre_id: '', saison: '', produit: '', quantite_kg: '', prix_unitaire: '', statut_paiement: 'en_attente' })
    fetchRecoltes()
  }

  const totalKg = recoltes.reduce((s, r) => s + r.quantite_kg, 0)
  const totalValeur = recoltes.reduce((s, r) => s + r.quantite_kg * r.prix_unitaire, 0)
  const enAttente = recoltes.filter(r => r.statut_paiement === 'en_attente').length

  return (
    <>
      <Navbar />
      <main className="max-w-5xl mx-auto px-4 py-6">
        <div className="grid grid-cols-3 gap-3 mb-6">
          <div className="bg-white rounded-xl p-4 border border-gray-200">
            <p className="text-2xl font-semibold text-gray-900">{totalKg.toLocaleString()} kg</p>
            <p className="text-xs text-gray-500 mt-0.5">Total récolté</p>
          </div>
          <div className="bg-white rounded-xl p-4 border border-gray-200">
            <p className="text-2xl font-semibold text-emerald-600">{totalValeur.toLocaleString()} FCFA</p>
            <p className="text-xs text-gray-500 mt-0.5">Valeur totale</p>
          </div>
          <div className="bg-white rounded-xl p-4 border border-gray-200">
            <p className="text-2xl font-semibold text-amber-600">{enAttente}</p>
            <p className="text-xs text-gray-500 mt-0.5">Paiements en attente</p>
          </div>
        </div>

        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-semibold text-gray-900">Récoltes</h2>
          <button onClick={() => setShowForm(true)}
            className="bg-emerald-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-emerald-700 transition-colors">
            + Nouvelle récolte
          </button>
        </div>

        {loading ? (
          <div className="text-center py-16 text-gray-400">Chargement...</div>
        ) : recoltes.length === 0 ? (
          <div className="text-center py-16 text-gray-400">Aucune récolte enregistrée</div>
        ) : (
          <div className="bg-white rounded-xl border border-gray-200 divide-y divide-gray-100">
            {recoltes.map(r => (
              <div key={r.id} className="flex items-center justify-between px-5 py-4">
                <div>
                  <p className="text-sm font-medium text-gray-900">{r.membres?.prenom} {r.membres?.nom}</p>
                  <p className="text-xs text-gray-400">{r.produit} · {r.saison} · {r.quantite_kg} kg</p>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-sm font-medium text-gray-900">
                    {(r.quantite_kg * r.prix_unitaire).toLocaleString()} FCFA
                  </span>
                  <span className={'text-xs px-2.5 py-1 rounded-full font-medium ' + (
                    r.statut_paiement === 'paye' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                  )}>
                    {r.statut_paiement === 'paye' ? 'Payé' : 'En attente'}
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
              <h2 className="text-lg font-semibold text-gray-900">Nouvelle récolte</h2>
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
                <label className="block text-sm font-medium text-gray-700 mb-1">Produit</label>
                <input type="text" value={form.produit} onChange={e => setForm(p => ({ ...p, produit: e.target.value }))}
                  placeholder="Ex: Maïs, Manioc, Igname"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500" required />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Saison</label>
                <input type="text" value={form.saison} onChange={e => setForm(p => ({ ...p, saison: e.target.value }))}
                  placeholder="Ex: Saison 2026 A"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500" required />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Quantité (kg)</label>
                  <input type="number" value={form.quantite_kg} onChange={e => setForm(p => ({ ...p, quantite_kg: e.target.value }))}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500" required min="0" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Prix/kg (FCFA)</label>
                  <input type="number" value={form.prix_unitaire} onChange={e => setForm(p => ({ ...p, prix_unitaire: e.target.value }))}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500" required min="0" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Statut paiement</label>
                <select value={form.statut_paiement} onChange={e => setForm(p => ({ ...p, statut_paiement: e.target.value }))}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500">
                  <option value="en_attente">En attente</option>
                  <option value="paye">Payé</option>
                </select>
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
