import Link from 'next/link'
import type { Paper } from '@/lib/types'


export default function PaperCard({ paper, categoryName }: { paper: Paper, categoryName?: string }) {
return (
<Link href={`/paper/${paper.id}`} className="block border rounded-2xl p-4 hover:shadow">
<h3 className="font-semibold mb-1">{paper.title}</h3>
<p className="text-sm text-gray-600">{categoryName || ''} {paper.year ? `• ${paper.year}`:''}</p>
{paper.authors_text && <p className="text-sm mt-2 line-clamp-1">{paper.authors_text}</p>}
{paper.keywords_text && <p className="text-xs text-gray-500 line-clamp-1">{paper.keywords_text}</p>}
</Link>
)
}