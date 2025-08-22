'use client'

/**
 * Desktop: inline <iframe> na /stream (stabilno, bez download UI)
 * Mobile: veliko dugme "Otvori PDF" koje otvara prikaz u novoj kartici (full-screen)
 *
 * Napomena: ovo namerno NE koristi react-pdf; iskustveno je najstabilnije.
 */
export default function PdfViewer({ paperId }: { paperId: string }) {
  const url = `/api/papers/${paperId}/stream#toolbar=0&view=FitH`

  return (
    <div className="w-full">
      {/* Desktop (md i veće): inline iframe */}
      <div className="hidden md:block border rounded-2xl overflow-hidden" onContextMenu={(e)=>e.preventDefault()}>
        <iframe
          src={url}
          title="PDF"
          style={{ width: '100%', height: '80vh', border: 0 }}
        />
      </div>

      {/* Telefon/tablet (sm): CTA dugme koje otvara PDF u punom ekranu */}
      <div className="md:hidden border rounded-2xl p-4 flex flex-col items-center gap-3 text-center">
        <p className="text-sm text-gray-600">Za najbolje iskustvo na telefonu, otvori PDF u punom ekranu.</p>
        <a
          href={url}
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center justify-center rounded-xl border px-4 py-2 text-sm hover:bg-gray-50"
        >
          Otvori PDF
        </a>
        <p className="text-xs text-gray-500">Ako se pojavi dodatno dugme „Otvori“, klikni ga.</p>
      </div>
    </div>
  )
}
