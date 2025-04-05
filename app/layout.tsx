import { Inter } from 'next/font/google'
import './globals.css'
import OfflineStatusWrapper from './components/OfflineStatusWrapper'

const inter = Inter({ subsets: ['latin'] })

export const metadata = {
  title: 'Faust Scrolls',
  description: 'Browse academic papers',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <OfflineStatusWrapper />
        {children}
      </body>
    </html>
  )
}