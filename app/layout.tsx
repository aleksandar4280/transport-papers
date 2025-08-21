import './globals.css'
import Navbar from '@/components/Navbar'
import type { ReactNode } from 'react'


export default function RootLayout({ children }: { children: ReactNode }) {
return (
<html lang="sr">
<body className="min-h-screen bg-gray-50 text-gray-900">
<Navbar />
<main className="mx-auto max-w-6xl px-4 py-6">{children}</main>
<footer className="mx-auto max-w-6xl px-4 py-10 text-sm text-gray-500">© {new Date().getFullYear()} Transport Papers</footer>
</body>
</html>
)
}