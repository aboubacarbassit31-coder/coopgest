'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import Navbar from '@/components/Navbar'
import {
  BarChart, Bar, LineChart, Line, XAxis, YAxis,
  CartesianGrid, Tooltip, ResponsiveContainer
} from 'recharts'

export default function DashboardPage() {
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState({
    totalMembres: 0, membresActifs: 0,
    totalCotisations: 0, cotisationsEnRetard: 0,
    totalRecoltes: 0, valeurRecoltes: 0,
    totalCredits: 0, creditsEnRetard: 0,
  })
  const [alertes, setAlertes] = useState<any[]>([])
  const [cotisationsParMois, setCotisationsParMois] = useState<any[]>([])
  const [recoltesParSaison, setRecoltesParSaison] = useState<any[]>([])
  const router = useRouter()

  useEffect(() => { checkAuthEtCharger() }, [])

  async function checkAuthEtCharger() {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { router.push('/login'); return }
    await fetchStats(user.id)
    setLoading(false)
  }

  async function fetchStats(userId: string) {
    const [
      { data: membres },
      { data: cotisations },
      { data: recoltes },
      { data: credits },
    ] = await Promise.all([
      supabase.from('membres').select('*').eq('user_id', userId),
      supabase.from('cotisations').select('*').eq('user_id', userId),
      supabase.from('recoltes').select('*').eq('user_id', userId),
      supabase.from('credits').select('*').eq('user_id', userId),
    ])

    const m = membres || []
    const c = cotisations || []
    const r = recoltes || []
    const cr = credits || []

    setStats({
      totalMembres: m.length,
      membresActifs: m.filter((x: any) => x.statut === 'actif').length,
      totalCotisations: c.reduce((s: number, x: any) => s + x.montant, 0),
      cotisationsEnRetard: m.filter((x: any) => x.cotisation_statut === 'en_retard').length,
      totalRecoltes: r.reduce((s: number, x: any) => s + x.quantite_kg, 0),
      valeurRecoltes: r.reduce((s: number, x: any) => s + x.quantite_kg * x.prix_unitaire, 0),
      totalCredits: cr.reduce((s: number, x: any) => s + x.montant, 0),
      creditsEnRetard: cr.filter((x: any) => x.statut !== 'rembourse' && new Date(x.date_echeance) < new Date()).length,
    })

    const alertesList: any[] = []
    m.filter((x: any) => x.cotisation_statut === 'en_retard').forEach((mb: any) => {
      alertesList.push({ message: `${mb.prenom} ${mb.nom} — cotisation en retard`, color: 'red' })
    })
    cr.filter((x: any) => x.statut !== 'rembourse' && new Date(x.date_echeance) < new Date()).forEach((credit: any) => {
      alertesList.push({ message: `Crédit de ${credit.montant.toLocaleString()} FCFA — échéance dépassée`, color: 'orange' })
    })
    setAlertes(alertesList)

    const parMois: Record<string, number> = {}
    c.forEach((x: any) => {
      const mois = new Date(x.mois).toLocaleDateString('fr-FR', { month: 'short', year: '2-digit' })
      parMois[mois] = (parMois[mois] || 0) + x.montant
    })
    setCotisationsParMois(Object.entries(parMois).map(([mois, total]) => ({ mois, total })).slice(-6))

    const parSaison: Record<string, number> = {}
    r.forEach((x: any) => { parSaison[x.saison] = (parSaison[x.saison] || 0) + x.quantite_kg })
    setRecoltesParSaison(Object.entries(parSaison).map(([saison, kg]) => ({ saison, kg })).slice(-5))
  }

  if (loading) return (
    <>
      <Navbar />
      <div className="text-center py-24 text-gray-400">Chargement...</div>
    </>
  )

  const STATS = [
    { label: 'Membres actifs', val: `${stats.membresActifs}/${stats.totalMembres}`, color: 'text-emerald-600', bg: 'bg-emerald-50', border: 'border-emerald-200' },
    { label: 'Cotisations collectées', val: `${stats.totalCotisations.toLocaleString()} FCFA`, color: 'text-blue-600', bg: 'bg-blue-50', border: 'border-blue-200' },
    { label: 'Récoltes totales', val: `${stats.totalRecoltes.toLocaleString()} kg`, color: 'text-amber-600', bg: 'bg-amber-50', border: 'border-amber-200' },
    { label: 'Valeur récoltes', val: `${stats.valeurRecoltes.toLocaleString()} FCFA`, color: 'text-purple-600', bg: 'bg-purple-50', border: 'border-purple-200' },
    { label: 'Crédits accordés', val: `${stats.totalCredits.toLocaleString()} FCFA`, color: 'text-teal-600', bg: 'bg-teal-50', border: 'border-teal-200' },
    { label: 'Alertes actives', val: alertes.length, color: alertes.length > 0 ? 'text-red-600' : 'text-gray-500', bg: alertes.length > 0 ? 'bg-red-50' : 'bg-gray-50', border: alertes.length > 0 ? 'border-red-200' : 'border-gray-200' },
  ]

  return (
    <>
      <Navbar />
      <main className="max-w-5xl mx-auto px-4 py-6">
        <div className="mb-6">
          <p className="text-xs text-gray-400 uppercase tracking-widest mb-1">Vue d'ensemble</p>
          <h1 className="text-2xl font-semibold text-gray-900">Tableau de bord</h1>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-8">
          {STATS.map(s => (
            <div key={s.label} className={`rounded-xl p-4 border ${s.bg} ${s.border}`}>
              <p className={`text-xl font-bold ${s.color}`}>{s.val}</p>
              <p className="text-xs text-gray-500 mt-1">{s.label}</p>
            </div>
          ))}
        </div>

        {alertes.length > 0 && (
          <div className="mb-8">
            <h2 className="text-base font-semibold text-gray-900 mb-3">⚠️ Alertes ({alertes.length})</h2>
            <div className="bg-white rounded-xl border border-gray-200 divide-y divide-gray-100">
              {alertes.map((a, i) => (
                <div key={i} className="flex items-center gap-3 px-4 py-3">
                  <div className={`w-2 h-2 rounded-full flex-shrink-0 ${a.color === 'red' ? 'bg-red-500' : 'bg-amber-500'}`} />
                  <p className="text-sm text-gray-700">{a.message}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-8">
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <h2 className="text-sm font-semibold text-gray-900 mb-4">Cotisations par mois (FCFA)</h2>
            {cotisationsParMois.length === 0 ? (
              <p className="text-sm text-gray-400 text-center py-8">Aucune donnée</p>
            ) : (
              <ResponsiveContainer width="100%" height={180}>
                <BarChart data={cotisationsParMois}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#F0F0F0" />
                  <XAxis dataKey="mois" tick={{ fontSize: 11, fill: '#9CA3AF' }} />
                  <YAxis tick={{ fontSize: 11, fill: '#9CA3AF' }} />
                  <Tooltip formatter={(val: any) => [`${val.toLocaleString()} FCFA`, 'Total']}
                    contentStyle={{ borderRadius: 8, border: '1px solid #E5E7EB', fontSize: 12 }} />
                  <Bar dataKey="total" fill="#10B981" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>

          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <h2 className="text-sm font-semibold text-gray-900 mb-4">Récoltes par saison (kg)</h2>
            {recoltesParSaison.length === 0 ? (
              <p className="text-sm text-gray-400 text-center py-8">Aucune donnée</p>
            ) : (
              <ResponsiveContainer width="100%" height={180}>
                <LineChart data={recoltesParSaison}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#F0F0F0" />
                  <XAxis dataKey="saison" tick={{ fontSize: 11, fill: '#9CA3AF' }} />
                  <YAxis tick={{ fontSize: 11, fill: '#9CA3AF' }} />
                  <Tooltip formatter={(val: any) => [`${val.toLocaleString()} kg`, 'Récolte']}
                    contentStyle={{ borderRadius: 8, border: '1px solid #E5E7EB', fontSize: 12 }} />
                  <Line dataKey="kg" stroke="#F59E0B" strokeWidth={2} dot={{ fill: '#F59E0B', r: 4 }} />
                </LineChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <h2 className="text-sm font-semibold text-gray-900 mb-4">Résumé des crédits</h2>
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <p className="text-xl font-bold text-gray-900">{stats.totalCredits.toLocaleString()}</p>
              <p className="text-xs text-gray-500 mt-1">FCFA accordés</p>
            </div>
            <div>
              <p className="text-xl font-bold text-emerald-600">{stats.creditsEnRetard === 0 ? '✓' : stats.creditsEnRetard}</p>
              <p className="text-xs text-gray-500 mt-1">{stats.creditsEnRetard === 0 ? 'Tout à jour' : 'En retard'}</p>
            </div>
            <div>
              <p className={`text-xl font-bold ${stats.creditsEnRetard > 0 ? 'text-red-600' : 'text-gray-400'}`}>
                {stats.creditsEnRetard}
              </p>
              <p className="text-xs text-gray-500 mt-1">Crédits en retard</p>
            </div>
          </div>
        </div>
      </main>
    </>
  )
}
