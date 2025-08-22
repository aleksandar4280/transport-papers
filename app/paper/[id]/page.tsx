import { createServerSupabase } from '@/lib/supabaseServer'
import { supabaseAdmin } from '@/lib/supabaseAdmin'
import FavoriteButton from './save-favorite'
import PdfViewer from '@/components/PdfViewer'
import AdminActions from './admin-actions'

export default async function PaperPage({ params }: { params: { id: string } }) {
  const supabase = createServerSupabase()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: paper } = await supabaseAdmin
    .from('papers')
    .select('*, categories(name)')
    .eq('id', params.id)
    .single()

  if (!paper) return <div>Rad nije pronađen.</div>

  let isAdmin = false
  if (user) {
    const { data: me } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()
    isAdmin = me?.role === 'admin'
  }

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-semibold">{paper.title}</h1>
        <p className="text-sm text-gray-600">
          {paper.categories?.name} {paper.year ? `• ${paper.year}` : ''}
        </p>
        {paper.authors_text && <p className="text-sm">{paper.authors_text}</p>}
        {paper.keywords_text && (
          <p className="text-xs text-gray-500">{paper.keywords_text}</p>
        )}
      </div>

      <div className="flex flex-wrap gap-2 items-center">
        <FavoriteButton paperId={paper.id} />
        {isAdmin && <AdminActions paperId={paper.id} />}
      </div>

      <PdfViewer paperId={paper.id} />

      <p className="text-xs text-gray-500">
        Pregled bez direktnog preuzimanja.
      </p>
    </div>
  )
}
