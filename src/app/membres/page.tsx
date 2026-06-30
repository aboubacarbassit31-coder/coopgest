'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { Membre } from '@/types'
import Navbar from '@/components/Navbar'
import Avatar from '@/components/Avatar'
import StatutBadge from '@/components/StatutBadge'
import AjoutMembreModal from '@/components/AjoutMembreModal'

export default function MembresPage() {
  const [membres, setMembres]   = useState<Membre[]>([])
  const [loading, setLoading]   = useState(true)
  const [search, setSearch]     = useState('')
  const [filtre, setFiltre]     = useState('tous')
  const [showForm, setShowForm] = useState(false)
  const router = useRouter()

  useEffect(() => { checkAuthEtCharger() }, [])

  async function checkAuthEtCharger() {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { router.push('/login'); return }
    await fetchMembres()
  }

  async function fetchMembres() {
    setLoading(true)
    const { data, error } = await supabase.from('membres').select('*').order('nom')
    if (!error) setMembres(data || [])
    setLoading(false)
  }

  const filtered = membres.filter(m => {
    const matchSearch = `${m.prenom} ${m.nom} ${m.telephone ?? ''}`.toLowerCase().includes(search.toLowerCase())
    const matchFiltre = filtre === 'tous' || m.cotisation_statut === filtre
    return matchSearch && matchFiltre
  })

  const stats = [
    { label: 'Total',     val: membres.length },
    { label: 'Actifs',    val: membres.filter(m => m.statut === 'actif').length },
    { label: 'À jour',    val: membres.filter(m => m.cotisation_statut === 'a_jour').length },
    { label: 'En retard', val: membres.filter(m => m.cotisation_statut === 'en_retard').length },
  ]

  const FILTRES = [
    { key: 'tous',       label: 'Tous' },
    { key: 'a_jour',     label: 'À jour' },
    { key: 'partiel',    label: 'Partiel' },
    { key: 'en_retard',  label: 'En retard' },
    { key: 'en_attente', label: 'En attente' },
  ]

  return (
    <>
      <Navbar />
      <main className="max-w-5xl mx-auto px-4 py-6">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
          {stats.map(s => (
            <div key={s.label} className="bg-white rounded-xl p-4 border border-gray-200">
              <p className="text-2xl font-semibold text-gray-900">{s.val}</p>
              <p className="text-xs text-gray-500 mt-0.5">{s.label}</p>
            </div>
          ))}
        </div>
        <div className="flex flex-col sm:flex-row gap-3 mb-4">
          <input value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Rechercher un membre..."
            className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500" />
          <button onClick={() => setShowForm(true)}
            className="bg-emerald-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-emerald-700 transition-colors whitespace-nowrap">
            + Nouveau membre
          </button>
        </div>
        <div className="flex gap-2 mb-4 overflow-x-auto pb-1">
          {FILTRES.map(f => (
            <button key={f.key} onClick={() => setFiltre(f.key)}
              className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-colors
                ${filtre === f.key ? 'bg-emerald-600 text-white' : 'bg-white border border-gray-200 text-gray-600 hover:border-gray-300'}`}>
              {f.label}
            </button>
          ))}
        </div>
        {loading ? (
          <div className="text-center py-16 text-gray-400">Chargement...</div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16 text-gray-400">
            {search ? 'Aucun résultat' : 'Aucun membre enregistré'}
          </div>
        ) : (
          <div className="bg-white rounded-xl border border-gray-200 divide-y divide-gray-100">
            {filtered.map(m => (
              <div key={m.id} className="flex items-center justify-between px-5 py-4">
                <div className="flex items-center gap-3">
                  <Avatar prenom={m.prenom} nom={m.nom} />
                  <div>
                    <p className="text-sm font-medium text-gray-900">{m.prenom} {m.nom}</p>
                    <p className="text-xs text-gray-400">
                      {m.telephone ?? 'Pas de téléphone'}{m.superficie_ha ? ` · ${m.superficie_ha} ha` : ''}
                    </p>
                  </div>
                </div>
                <StatutBadge statut={m.cotisation_statut} />
              </div>
            ))}
          </div>
        )}
      </main>
      {showForm && <AjoutMembreModal onClose={() => { setShowForm(false); fetchMembres() }} />}
    </>
  )
}
