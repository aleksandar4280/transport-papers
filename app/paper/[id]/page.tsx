import { supabaseAdmin } from '@/lib/supabaseAdmin'
import FavoriteButton from './save-favorite'
import PdfViewer from '@/components/PdfViewer'

export default async function PaperPage({ params }: { params: { id: string } }) {
  const { data: paper } = await supabaseAdmin
    .from('papers')
    .select('*, categories(name)')
    .eq('id', params.id)
    .single()

  if (!paper) return <div>Rad nije pronađen.</div>

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-semibold">{paper.title}</h1>
        <p className="text-sm text-gray-600">{paper.categories?.name} {paper.year ? `• ${paper.year}` : ''}</p>
        {paper.authors_text && <p className="text-sm">{paper.authors_text}</p>}
        {paper.keywords_text && <p className="text-xs text-gray-500">{paper.keywords_text}</p>}
      </div>

      <div className="flex gap-2">
        <FavoriteButton paperId={paper.id} />
      </div>

      <PdfViewer paperId={paper.id} />

      <p className="text-xs text-gray-500">
        Napomena: na webu nije moguće 100% sprečiti preuzimanje, ali nudimo samo inline prikaz bez direktnih linkova.
      </p>
    </div>
  )
}