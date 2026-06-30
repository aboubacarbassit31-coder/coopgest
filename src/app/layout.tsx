import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'CoopGest',
  description: 'Gestion numérique des coopératives agricoles togolaises',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr">
      <body className="bg-gray-50 text-gray-900 antialiased">
        {children}
      </body>
    </html>
  )
}
