'use client'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'

const LIENS = [
  { href: '/membres',     label: 'Membres' },
  { href: '/cotisations', label: 'Cotisations' },
  { href: '/recoltes',    label: 'Récoltes' },
  { href: '/credits',     label: 'Crédits' },
]

export default function Navbar() {
  const pathname = usePathname()
  const router   = useRouter()

  async function handleLogout() {
    await supabase.auth.signOut()
    router.push('/login')
  }

  return (
    <header className="bg-white border-b border-gray-200 sticky top-0 z-40">
      <div className="max-w-5xl mx-auto px-4 flex items-center justify-between h-14">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 bg-emerald-600 rounded-md flex items-center justify-center">
            <span className="text-white text-xs font-bold">C</span>
          </div>
          <span className="font-semibold text-gray-900 text-sm">CoopGest</span>
        </div>
        <nav className="hidden sm:flex items-center gap-1">
          {LIENS.map(lien => (
            <Link key={lien.href} href={lien.href}
              className={`px-3 py-1.5 rounded-lg text-sm transition-colors
                ${pathname === lien.href
                  ? 'bg-emerald-50 text-emerald-700 font-medium'
                  : 'text-gray-500 hover:text-gray-800 hover:bg-gray-100'}`}>
              {lien.label}
            </Link>
          ))}
        </nav>
        <button onClick={handleLogout} className="text-sm text-gray-400 hover:text-gray-700">
          Déconnexion
        </button>
      </div>
      <div className="sm:hidden border-t border-gray-100 flex overflow-x-auto">
        {LIENS.map(lien => (
          <Link key={lien.href} href={lien.href}
            className={`flex-1 text-center py-2 text-xs whitespace-nowrap transition-colors
              ${pathname === lien.href
                ? 'text-emerald-700 font-medium border-b-2 border-emerald-600'
                : 'text-gray-500'}`}>
            {lien.label}
          </Link>
        ))}
      </div>
    </header>
  )
}
