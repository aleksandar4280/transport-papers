import Link from 'next/link'
import { createServerSupabase } from '@/lib/supabaseServer'

export default async function Navbar() {
  const supabase = createServerSupabase()
  const { data: { user } } = await supabase.auth.getUser()

  let role: 'admin' | 'user' | null = null
  if (user) {
    const { data: me } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()
    role = (me?.role as any) || 'user'
  }
  const isAdmin = role === 'admin'

  return (
    <header className="sticky top-0 z-50 bg-white/90 backdrop-blur border-b">
      <div className="mx-auto max-w-6xl px-3 py-2 flex items-center justify-between gap-3">
        {/* Brand */}
        <div className="flex items-center gap-3">
          <Link href="/" className="font-semibold">Transport Papers</Link>
        </div>

        {/* Desktop nav (bez Pretrage) */}
        <nav className="hidden md:flex items-center gap-3 text-sm">
          <Link href="/" className="hover:underline">Početna</Link>
          {user ? (
            <>
              <Link href="/profile" className="hover:underline">Profil</Link>
              {isAdmin && <Link href="/admin" className="hover:underline">Admin</Link>}
              <Link href="/auth/sign-out" className="rounded-lg border px-3 py-1">Odjava</Link>
            </>
          ) : (
            <>
              <Link href="/auth/sign-in" className="rounded-lg border px-3 py-1">Prijava</Link>
              <Link href="/auth/sign-up" className="hover:underline">Registracija</Link>
            </>
          )}
        </nav>

        {/* Mobile nav: hamburger bez trougla/teksta (checkbox + label, bez JS) */}
        <div className="relative md:hidden">
          <input id="mnav" type="checkbox" className="peer hidden" aria-hidden="true" />
          <label htmlFor="mnav" className="inline-flex items-center justify-center rounded-lg border px-3 py-2" aria-label="Otvori meni">
            {/* Hamburger ikonica (3 linije) */}
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <line x1="3" y1="6" x2="21" y2="6" />
              <line x1="3" y1="12" x2="21" y2="12" />
              <line x1="3" y1="18" x2="21" y2="18" />
            </svg>
          </label>
          <div className="absolute right-0 mt-2 hidden peer-checked:flex flex-col gap-2 bg-white border rounded-xl p-3 shadow-lg min-w-[180px]">
            <Link href="/" className="hover:underline">Početna</Link>
            {user ? (
              <>
                <Link href="/profile" className="hover:underline">Profile</Link>
                {isAdmin && <Link href="/admin" className="hover:underline">Admin</Link>}
                <Link href="/auth/sign-out" className="rounded-lg border px-3 py-1 text-center">Odjava</Link>
              </>
            ) : (
              <>
                <Link href="/auth/sign-in" className="rounded-lg border px-3 py-1 text-center">Prijava</Link>
                <Link href="/auth/sign-up" className="hover:underline">Registracija</Link>
              </>
            )}
          </div>
        </div>
      </div>
    </header>
  )
}
