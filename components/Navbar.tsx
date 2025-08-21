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
        <div className="flex items-center gap-3">
          <Link href="/" className="font-semibold">Transport Papers</Link>
        </div>

        {/* Desktop nav */}
        <nav className="hidden md:flex items-center gap-3 text-sm">
          <Link href="/" className="hover:underline">Početna</Link>
          <Link href="/?q=" className="hover:underline">Pretraga</Link>
          {user ? (
            <>
              <Link href="/profile" className="hover:underline">Profile</Link>
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

        {/* Mobile menu */}
        <details className="md:hidden">
          <summary className="cursor-pointer rounded-lg border px-3 py-1 text-sm">Meni</summary>
          <div className="mt-2 flex flex-col gap-2 bg-white border rounded-lg p-3 shadow">
            <Link href="/" className="hover:underline">Početna</Link>
            <Link href="/?q=" className="hover:underline">Pretraga</Link>
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
        </details>
      </div>
    </header>
  )
}
