'use client'

/**
 * Stabilan prikaz PDF-a:
 * - Desktop/veći ekrani: <iframe> na /api/papers/[id]/stream (inline, bez download UI)
 * - Telefon/tablet (manji ekrani): CTA dugme "Otvori PDF" koje otvara sistemski PDF prikaz
 *
 * Zašto ovako? Android/Chrome često ne renderuje pouzdano inline PDF unutar iframe-a,
 * ali otvaranje u novom tabu radi 100% (full-screen PDF viewer). Ovo je najrobustniji MVP.
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

      {/* Telefon/tablet (sm): pokaži veliko dugme umesto iframe-a */}
      <div className="md:hidden border rounded-2xl p-4 flex flex-col items-center gap-3 text-center">
        <p className="text-sm text-gray-600">Na mobilnim uređajima PDF se najbolje otvara u punom ekranu.</p>
        <a
          href={url}
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center justify-center rounded-xl border px-4 py-2 text-sm hover:bg-gray-50"
        >
          Otvori PDF
        </a>
        <p className="text-xs text-gray-500">Preporuka: klikni "Otvori" na ekranu pregledača.</p>
      </div>
    </div>
  )
}
