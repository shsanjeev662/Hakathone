import './globals.css'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Dhukuti - Smart Cooperative Manager',
  description: 'Digital community savings group management system',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>
        {children}
      </body>
    </html>
  )
}
