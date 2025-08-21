export default function PdfIFrame({ paperId }: { paperId: string }) {
  // Zašto iframe: najstabilniji prikaz (byte-range, CORS, HEAD nisu problem)
  const src = `/api/papers/${paperId}/stream#toolbar=0&view=FitH`
  return (
    <div className="border rounded-2xl overflow-hidden">
      <iframe
        src={src}
        title="PDF"
        style={{ width: '100%', height: '80vh', border: '0' }}
        // Napomena: ne koristimo sandbox kako bismo dozvolili kopiranje teksta
      />
    </div>
  )
}
