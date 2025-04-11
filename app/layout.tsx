import React from 'react'
import './globals.css'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Next.js with Tailwind CSS',
  description: 'A Next.js application with Tailwind CSS',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
