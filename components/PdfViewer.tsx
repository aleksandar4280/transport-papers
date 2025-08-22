'use client'
import { useEffect, useRef, useState } from 'react'
import { Document, Page, pdfjs } from 'react-pdf'

// Use local ESM worker (no CDN/CORS issues on mobile)
if (typeof window !== 'undefined') {
  try {
    // @ts-ignore -- workerPort is supported by pdf.js runtime even if not in types
    pdfjs.GlobalWorkerOptions.workerPort = new Worker('/pdf.worker.min.mjs', { type: 'module' })
  } catch {
    // Fallback: direct src (still ESM). Keep file in /public
    pdfjs.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.mjs'
  }
}

function isMobile(): boolean {
  if (typeof navigator === 'undefined') return false
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini|Mobile/i.test(navigator.userAgent)
}

export default function PdfViewer({ paperId }: { paperId: string }) {
  const mobile = isMobile()

  // Desktop → iframe to our proxy stream (inline, no download UI)
  if (!mobile) {
    const src = `/api/papers/${paperId}/stream#toolbar=0&view=FitH`
    return (
      <div className="border rounded-2xl overflow-hidden" onContextMenu={(e)=>e.preventDefault()}>
        <iframe src={src} title="PDF" style={{ width: '100%', height: '80vh', border: 0 }} />
      </div>
    )
  }

  // Mobile → fetch bytes and render in-memory (no navigation → no download prompt)
  return <PdfMobile paperId={paperId} />
}

function PdfMobile({ paperId }: { paperId: string }) {
  const [data, setData] = useState<Uint8Array | null>(null)
  const [err, setErr] = useState<string | null>(null)
  const [numPages, setNumPages] = useState<number | null>(null)
  const wrapRef = useRef<HTMLDivElement | null>(null)
  const [width, setWidth] = useState<number>(360)

  useEffect(() => {
    const onResize = () => setWidth(wrapRef.current?.clientWidth || 360)
    onResize()
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [])

  useEffect(() => {
    let cancelled = false
    fetch(`/api/papers/${paperId}/bytes`, { cache: 'no-store' })
      .then(async (r) => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`)
        const buf = await r.arrayBuffer()
        if (!cancelled) setData(new Uint8Array(buf))
      })
      .catch((e) => { if (!cancelled) setErr(String(e?.message || e)) })
    return () => { cancelled = true }
  }, [paperId])

  if (err) return <p className="text-sm text-red-600">Greška učitavanja PDF-a: {err}</p>
  if (!data) return <p>Učitavanje…</p>

  return (
    <div ref={wrapRef} className="border rounded-2xl p-2 select-text" onContextMenu={(e)=>e.preventDefault()}>
      <Document
        file={{ data }}
        loading={<p>Učitavanje…</p>}
        onLoadSuccess={(info) => setNumPages(info.numPages)}
        onLoadError={(e) => setErr(String((e as any)?.message || e))}
      >
        {Array.from({ length: numPages || 0 }, (_, i) => (
          <Page
            key={i + 1}
            pageNumber={i + 1}
            width={width}
            renderAnnotationLayer={false}
            renderTextLayer={true}
          />
        ))}
      </Document>
    </div>
  )
}
