'use client'
import Link from 'next/link'
import Image from 'next/image'
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
    <header style={{ background: '#085041' }} className="sticky top-0 z-40 shadow-md">
      <div className="max-w-5xl mx-auto px-4 flex items-center justify-between h-14">
        <div className="flex items-center gap-2">
          <Image src="/logo.png" alt="CoopGest Togo" width={32} height={32} className="rounded-md" />
          <div>
            <span className="font-bold text-white text-sm">CoopGest</span>
            <span style={{ color: '#EF9F27' }} className="font-bold text-sm"> Togo</span>
          </div>
        </div>
        <nav className="hidden sm:flex items-center gap-1">
          {LIENS.map(lien => (
            <Link key={lien.href} href={lien.href}
              className="px-3 py-1.5 rounded-lg text-sm transition-colors"
              style={{
                background: pathname === lien.href ? '#EF9F27' : 'transparent',
                color: pathname === lien.href ? '#fff' : '#A8D8C8',
                fontWeight: pathname === lien.href ? 600 : 400,
              }}>
              {lien.label}
            </Link>
          ))}
        </nav>
        <button onClick={handleLogout} className="text-sm transition-colors" style={{ color: '#A8D8C8' }}>
          Déconnexion
        </button>
      </div>
      <div className="sm:hidden border-t flex overflow-x-auto" style={{ borderColor: '#1D9E75' }}>
        {LIENS.map(lien => (
          <Link key={lien.href} href={lien.href}
            className="flex-1 text-center py-2 text-xs whitespace-nowrap transition-colors"
            style={{
              color: pathname === lien.href ? '#EF9F27' : '#A8D8C8',
              fontWeight: pathname === lien.href ? 600 : 400,
              borderBottom: pathname === lien.href ? '2px solid #EF9F27' : 'none',
            }}>
            {lien.label}
          </Link>
        ))}
      </div>
    </header>
  )
}
