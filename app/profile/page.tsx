import { createServerSupabase } from '@/lib/supabaseServer'
import Link from 'next/link'


export default async function ProfilePage(){
const supabase = createServerSupabase()
const { data: { user } } = await supabase.auth.getUser()
if (!user) return <div>Morate se <Link href="/auth/sign-in" className="underline">prijaviti</Link> da biste videli omiljene.</div>


const { data: favs } = await supabase.from('favorites').select('papers(*)').eq('user_id', user.id)


return (
<div className="space-y-4">
<h1 className="text-xl font-semibold">Vaši omiljeni radovi</h1>
<div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
{(favs||[]).map((f:any)=> (
<Link key={f.papers.id} className="border rounded-2xl p-4 hover:shadow" href={`/paper/${f.papers.id}`}>{f.papers.title}</Link>
))}
</div>
</div>
)
}