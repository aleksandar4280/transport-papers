import SearchBar from '@/components/SearchBar'
import PaperCard from '@/components/PaperCard'
import { supabaseAdmin } from '@/lib/supabaseAdmin'


export default async function Home({ searchParams }: { searchParams: Record<string,string|undefined> }) {
const { data: categories } = await supabaseAdmin.from('categories').select('*').order('name')


// Basic search across denormalized columns to keep it simple
const q = (searchParams.q || '').trim()
const category = searchParams.category
const year = searchParams.year
const author = (searchParams.author || '').trim()


let query = supabaseAdmin.from('papers').select('*, categories(name)').order('created_at', { ascending: false })
if (q) query = query.or(`title.ilike.%${q}%,keywords_text.ilike.%${q}%,content_text.ilike.%${q}%`)
if (category) query = query.eq('category_id', Number(category))
if (year) query = query.eq('year', Number(year))
if (author) query = query.ilike('authors_text', `%${author}%`)


const { data: papers } = await query.limit(50)


return (
<div className="space-y-6">
<h1 className="text-2xl font-semibold">Baza naučnih radova iz saobraćaja</h1>
<SearchBar categories={categories || []} />
<div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
{(papers || []).map(p => (
<PaperCard key={p.id} paper={p} categoryName={p.categories?.name ?? undefined} />
))}
</div>
</div>
)
}