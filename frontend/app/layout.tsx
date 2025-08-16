import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Navkar Service',
  description: 'Created by Preksha',
  generator: 'preksha',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
