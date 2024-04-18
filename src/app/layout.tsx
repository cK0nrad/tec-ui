import type { Metadata, Viewport } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'LIVE TEC NETWORK',
  description: 'Unofficial LETEC map',
}

export const viewport: Viewport = {
  width:'device-width',
  initialScale: 1,
  userScalable: false,
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {

  return (
    <html lang="en" >
      {children}
    </html>
  )
}
