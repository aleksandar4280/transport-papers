'use client'
import { useRouter } from 'next/navigation'

/** Minimal admin akcije za stranicu rada */
export default function AdminActions({ paperId }: { paperId: string }) {
  const router = useRouter()

  async function onDelete() {
    if (!confirm('Da li ste sigurni da želite da obrišete ovaj rad?')) return
    try {
      const res = await fetch(`/api/papers/${paperId}/delete`, { method: 'POST' })
      if (!res.ok) {
        const j = await res.json().catch(() => ({} as any))
        alert(`Brisanje nije uspelo: ${j?.error || res.status}`)
        return
      }
      router.push('/')
      router.refresh()
    } catch (e: any) {
      alert(`Greška: ${e?.message || e}`)
    }
  }

  return (
    <div className="flex gap-2">
      <a href={`/admin/papers/${paperId}/edit`} className="rounded-lg border px-3 py-1 text-sm">Izmeni</a>
      <button onClick={onDelete} className="rounded-lg border px-3 py-1 text-sm text-red-600">Obriši</button>
    </div>
  )
}
