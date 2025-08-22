import { supabaseAdmin } from '@/lib/supabaseAdmin'
import { createServerSupabase } from '@/lib/supabaseServer'

export const dynamic = 'force-dynamic'

export default async function EditPaperPage({ params }: { params: { id: string } }) {
  const supabase = createServerSupabase()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return <div>Prijavite se.</div>

  const { data: me } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()
  if (me?.role !== 'admin') return <div>Nemate admin privilegije.</div>

  const [{ data: paper }, { data: categories }] = await Promise.all([
    supabaseAdmin.from('papers').select('*').eq('id', params.id).single(),
    supabaseAdmin.from('categories').select('*').order('name'),
  ])
  if (!paper) return <div>Rad nije pronađen.</div>

  return (
    <div className="max-w-xl space-y-4">
      <h1 className="text-xl font-semibold">Izmena rada</h1>
      <form action={`/api/papers/${paper.id}/update`} method="post" encType="multipart/form-data" className="grid gap-3">
        <input type="hidden" name="id" value={paper.id} />

        <label className="grid gap-1 text-sm">
          <span>Naslov</span>
          <input name="title" defaultValue={paper.title||''} required className="border rounded-xl px-3 py-2" />
        </label>

        <label className="grid gap-1 text-sm">
          <span>Godina</span>
          <input name="year" defaultValue={paper.year||''} className="border rounded-xl px-3 py-2" />
        </label>

        <label className="grid gap-1 text-sm">
          <span>Autori (zarezom)</span>
          <input name="authors_csv" defaultValue={paper.authors_text||''} className="border rounded-xl px-3 py-2" />
        </label>

        <label className="grid gap-1 text-sm">
          <span>Ključne reči (zarezom)</span>
          <input name="keywords" defaultValue={paper.keywords_text||''} className="border rounded-xl px-3 py-2" />
        </label>

        <label className="grid gap-1 text-sm">
          <span>Kategorija</span>
          <select name="category_id" defaultValue={paper.category_id||''} className="border rounded-xl px-3 py-2">
            {(categories||[]).map((c:any)=> (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        </label>

        <label className="grid gap-1 text-sm">
          <span>Novi PDF (opciono)</span>
          <input type="file" name="file" accept="application/pdf" className="border rounded-xl px-3 py-2" />
        </label>

        <div className="flex gap-2">
          <button className="rounded-xl border px-4 py-2">Sačuvaj izmene</button>
          <a href={`/paper/${paper.id}`} className="rounded-xl border px-4 py-2">Otkaži</a>
        </div>
      </form>
    </div>
  )
}
