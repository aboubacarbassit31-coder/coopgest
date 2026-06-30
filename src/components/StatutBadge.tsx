import { StatutCotisation } from '@/types'

const CONFIG: Record<StatutCotisation, { label: string; className: string }> = {
  a_jour:     { label: 'À jour',     className: 'bg-emerald-100 text-emerald-800' },
  partiel:    { label: 'Partiel',    className: 'bg-amber-100 text-amber-800' },
  en_retard:  { label: 'En retard',  className: 'bg-red-100 text-red-800' },
  en_attente: { label: 'En attente', className: 'bg-gray-100 text-gray-600' },
}

export default function StatutBadge({ statut }: { statut: StatutCotisation }) {
  const { label, className } = CONFIG[statut]
  return (
    <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${className}`}>
      {label}
    </span>
  )
}
