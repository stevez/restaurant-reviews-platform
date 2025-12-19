import type { Metadata } from 'next'
import './globals.css'
import { Navigation } from '@/components/Navigation'

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Restaurant Reviews',
  description: 'Browse and review restaurants with our community',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <head>
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200&display=optional"
        />
      </head>
      <body className="antialiased">
        <Navigation />
        {children}

        <footer className="bg-gray-800 mt-10 py-8 md:py-10">
          <div className="mx-auto max-w-6xl w-full px-4">
            <div className="text-white text-sm md:text-base mb-3 md:mb-4">Restaurant Reviews Platform</div>
            <div className="text-white text-xs md:text-sm text-gray-300">Discover and share great dining experiences</div>
          </div>
        </footer>
      </body>
    </html>
  )
}
