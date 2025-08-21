'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { createClient } from '@/lib/supabaseClient'
import { useEffect, useState } from 'react'


export default function Navbar() {
const pathname = usePathname()
const [email, setEmail] = useState<string | null>(null)
useEffect(() => {
const supabase = createClient()
supabase.auth.getUser().then(({ data }) => setEmail(data.user?.email ?? null))
}, [])
return (
<header className="sticky top-0 z-20 bg-white/80 backdrop-blur border-b">
<nav className="mx-auto max-w-6xl px-4 py-3 flex items-center gap-4">
<Link href="/" className="font-semibold">Transport Papers</Link>
<div className="hidden sm:flex gap-3 text-sm">
<Link href="/" className={pathname==='/'? 'font-medium':''}>Početna</Link>
<Link href="/profile" className={pathname.startsWith('/profile')? 'font-medium':''}>Profil</Link>
<Link href="/admin" className={pathname.startsWith('/admin')? 'font-medium':''}>Admin</Link>
</div>
<div className="ml-auto text-sm flex items-center gap-3">
{email ? (
<>
<span className="hidden sm:inline text-gray-600">{email}</span>
<form action="/auth/sign-out" method="post">
<button className="rounded-xl border px-3 py-1">Odjava</button>
</form>
</>
) : (
<>
<Link href="/auth/sign-in" className="rounded-xl border px-3 py-1">Prijava</Link>
<Link href="/auth/sign-up" className="rounded-xl border px-3 py-1">Registracija</Link>
</>
)}
</div>
</nav>
</header>
)
}