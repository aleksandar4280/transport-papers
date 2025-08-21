'use client'
import { useEffect, useRef, useState } from 'react'
import { Document, Page, pdfjs } from 'react-pdf'

pdfjs.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.min.js`

function isMobileUA(): boolean {
  if (typeof navigator === 'undefined') return false
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini|Mobile/i.test(navigator.userAgent)
}

export default function PdfViewer({ paperId }: { paperId: string }) {
  const mobile = isMobileUA()
  const [signedUrl, setSignedUrl] = useState<string | null>(null)
  const [err, setErr] = useState<string | null>(null)

  // Za mobilne – pribavi signed URL
  useEffect(() => {
    if (!mobile) return
    let canceled = false
    fetch(`/api/papers/${paperId}/signed`)
      .then(r => r.json())
      .then(j => {
        if (!canceled) {
          if (j?.ok && j?.url) setSignedUrl(j.url)
          else setErr(j?.error || 'Greška pri dobijanju URL-a')
        }
      })
      .catch(e => { if (!canceled) setErr(String(e?.message || e)) })
    return () => { canceled = true }
  }, [paperId, mobile])

  // Desktop: stabilni iframe ka proxy /stream
  if (!mobile) {
    const src = `/api/papers/${paperId}/stream#toolbar=0&view=FitH`
    return (
      <div className="border rounded-2xl overflow-hidden" onContextMenu={(e)=>e.preventDefault()}>
        <iframe src={src} title="PDF" style={{ width: '100%', height: '80vh', border: 0 }} />
      </div>
    )
  }

  // Mobilni: react-pdf
  return <PdfReact url={signedUrl} err={err} paperId={paperId} />
}

function PdfReact({ url, err, paperId }: { url: string | null; err: string | null; paperId: string }) {
  const ref = useRef<HTMLDivElement | null>(null)
  const [numPages, setNumPages] = useState<number | null>(null)
  const [width, setWidth] = useState<number>(800)

  useEffect(() => {
    const handler = () => setWidth(ref.current?.clientWidth || 800)
    handler()
    window.addEventListener('resize', handler)
    return () => window.removeEventListener('resize', handler)
  }, [])

  if (err) {
    return (
      <div className="text-sm text-red-600">
        Greška učitavanja PDF-a: {err}
        {' '}<a className="underline ml-1" href={`/api/papers/${paperId}/stream`} target="_blank" rel="noreferrer">otvori u novom tabu</a>
      </div>
    )
  }
  if (!url) return <p>Učitavanje…</p>

  return (
    <div ref={ref} className="border rounded-2xl p-2 select-text" onContextMenu={(e)=>e.preventDefault()}>
      <Document file={url} onLoadSuccess={(info)=>setNumPages(info.numPages)} loading={<p>Učitavanje…</p>}>
        {Array.from({ length: numPages || 0 }, (_, i) => (
          <Page key={i+1} pageNumber={i+1} width={width} renderAnnotationLayer={false} renderTextLayer={true} />
        ))}
      </Document>
    </div>
  )
}
