import './globals.css'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Bad Choices - 2026',
  description: 'Cyber-Glass Multiplayer Game',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="fr">
      <body>
        <div className="mesh-bg" />
        {children}
      </body>
    </html>
  )
}
