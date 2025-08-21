'use client'
import Link from 'next/link'
import { useEffect, useState } from 'react'
import { usePathname } from 'next/navigation'

type Props = {
  signedIn: boolean
  isAdmin: boolean
}

export default function MobileMenu({ signedIn, isAdmin }: Props) {
  const [open, setOpen] = useState(false)
  const pathname = usePathname()

  // Auto-zatvori kada se promeni ruta (nakon klika na Link)
  useEffect(() => { setOpen(false) }, [pathname])

  return (
    <div className="relative md:hidden">
      <button
        type="button"
        aria-label={open ? 'Zatvori meni' : 'Otvori meni'}
        aria-expanded={open}
        onClick={() => setOpen(o => !o)}
        className="inline-flex items-center justify-center rounded-lg border px-3 py-2"
      >
        {/* Hamburger ikonica (3 linije) */}
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <line x1="3" y1="6" x2="21" y2="6" />
          <line x1="3" y1="12" x2="21" y2="12" />
          <line x1="3" y1="18" x2="21" y2="18" />
        </svg>
      </button>

      {open && (
        <div className="absolute right-0 mt-2 flex flex-col gap-2 bg-white border rounded-xl p-3 shadow-lg min-w-[180px] z-50">
          <Link href="/" onClick={() => setOpen(false)} className="hover:underline">Početna</Link>
          {signedIn ? (
            <>
              <Link href="/profile" onClick={() => setOpen(false)} className="hover:underline">Profil</Link>
              {isAdmin && (
                <Link href="/admin" onClick={() => setOpen(false)} className="hover:underline">Admin</Link>
              )}
              <Link href="/auth/sign-out" onClick={() => setOpen(false)} className="rounded-lg border px-3 py-1 text-center">Odjava</Link>
            </>
          ) : (
            <>
              <Link href="/auth/sign-in" onClick={() => setOpen(false)} className="rounded-lg border px-3 py-1 text-center">Prijava</Link>
              <Link href="/auth/sign-up" onClick={() => setOpen(false)} className="hover:underline">Registracija</Link>
            </>
          )}
        </div>
      )}
    </div>
  )
}

