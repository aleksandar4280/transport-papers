'use client'

/**
 * Force-inline PDF for all devices.
 * - Uklonjen je CTA koji otvara novu karticu (ne nudimo direktan link koji neki browseri odmah preuzmu).
 * - Uvek koristimo <iframe> na /api/papers/[id]/stream sa Content-Disposition: inline.
 * - Onemogućen context menu (ne sprečava 100%, ali skida neželjene UI opcije).
 */
export default function PdfViewer({ paperId }: { paperId: string }) {
  const src = `/api/papers/${paperId}/stream#toolbar=0&view=FitH`
  return (
    <div className="border rounded-2xl overflow-hidden" onContextMenu={(e)=>e.preventDefault()}>
      <iframe
        src={src}
        title="PDF"
        style={{ width: '100%', height: '80vh', border: 0 }}
      />
    </div>
  )
}

