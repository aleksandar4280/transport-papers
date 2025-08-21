export const dynamic = 'force-dynamic'


import { createServerSupabase } from '@/lib/supabaseServer'
import { env } from '@/lib/env'
import { createClient as createSb } from '@supabase/supabase-js'


export default async function AdminPage() {
const supabase = createServerSupabase()
const { data: { user } } = await supabase.auth.getUser()
if (!user) return <div>Prijavite se kao admin.</div>


// Lazily create admin client at request-time (avoids build-time env usage)
const admin = createSb(env.supabaseUrl, env.supabaseServiceKey)


const { data: profile } = await admin
.from('profiles').select('*').eq('id', user.id).single()
if (profile?.role !== 'admin') return <div>Nemate admin privilegije.</div>


const { data: categories } = await admin.from('categories').select('*').order('name')


return (
<div className="space-y-6">
<h1 className="text-xl font-semibold">Admin dashboard</h1>
<form action="/api/papers/upload" method="post" encType="multipart/form-data" className="grid gap-2 max-w-xl">
<input required className="border rounded-xl px-3 py-2" placeholder="Naslov" name="title" />
<input className="border rounded-xl px-3 py-2" placeholder="Godina (npr 2024)" name="year" />
<input className="border rounded-xl px-3 py-2" placeholder="Autori (zarezom odvojeni)" name="authors_csv" />
<input className="border rounded-xl px-3 py-2" placeholder="Ključne reči (zarezom)" name="keywords" />
<select name="category_id" className="border rounded-xl px-3 py-2">
{(categories||[]).map((c:any)=> <option key={c.id} value={c.id}>{c.name}</option>)}
</select>
<input required type="file" accept="application/pdf" name="file" className="border rounded-xl px-3 py-2" />
<button className="rounded-xl border px-4 py-2">Otpremi</button>
</form>
</div>
)
}