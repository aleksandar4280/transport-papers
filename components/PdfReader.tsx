'use client'
import { Document, Page, pdfjs } from 'react-pdf'
import { useEffect, useState } from 'react'


pdfjs.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.min.js`


export default function PdfReader({ fileUrl }: { fileUrl: string }) {
const [numPages, setNumPages] = useState<number | null>(null)
return (
<div className="border rounded-2xl p-2 select-text" onContextMenu={(e)=>e.preventDefault()}>
<Document file={fileUrl} onLoadSuccess={(info)=>setNumPages(info.numPages)} loading={<p>Učitavanje…</p>}>
{Array.from(new Array(numPages||0), (_el, index) => (
<Page key={`p_${index+1}`} pageNumber={index+1} renderAnnotationLayer={false} renderTextLayer={true} />
))}
</Document>
</div>
)
}


export function PdfReaderSigned({ paperId }: { paperId: string }) {
const [url, setUrl] = useState<string | null>(null)
const [err, setErr] = useState<string | null>(null)
useEffect(() => {
let cancelled = false
fetch(`/api/papers/${paperId}/signed`).then(async (r)=>{
const j = await r.json().catch(()=>({ ok:false, error:'invalid json' }))
if (!cancelled) {
if (j.ok && j.url) setUrl(j.url); else setErr(j.error || 'Nepoznata greška')
}
}).catch(e => { if (!cancelled) setErr(String(e?.message||e)) })
return () => { cancelled = true }
}, [paperId])
if (err) return <div className="text-sm text-red-600">Greška učitavanja PDF-a: {err}</div>
if (!url) return <p>Učitavanje…</p>
return <PdfReader fileUrl={url} />
}