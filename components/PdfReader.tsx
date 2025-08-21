'use client'
const [loadErr, setLoadErr] = useState<string | null>(null)
useEffect(() => {
if (!wantsReactPdf) return
let cancelled = false
fetch(`/api/papers/${paperId}/signed`)
.then((r) => r.json())
.then((j) => {
if (!cancelled) {
if (j?.ok && j?.url) setSignedUrl(j.url)
else setLoadErr(j?.error || 'Greška pri dobijanju URL-a')
}
})
.catch((e) => { if (!cancelled) setLoadErr(String(e?.message || e)) })
return () => { cancelled = true }
}, [paperId, wantsReactPdf])


if (!wantsReactPdf) {
return (
<div className="border rounded-2xl overflow-hidden" onContextMenu={(e)=>e.preventDefault()}>
<iframe src={iframeSrc} title="PDF" style={{ width: '100%', height: '80vh', border: 0 }} />
</div>
)
}


return <PdfReact url={signedUrl} err={loadErr} paperId={paperId} />
}


function PdfReact({ url, err, paperId }: { url: string | null; err: string | null; paperId: string }) {
const wrapRef = useRef<HTMLDivElement | null>(null)
const [numPages, setNumPages] = useState<number | null>(null)
const [width, setWidth] = useState<number>(800)


useEffect(() => {
const handler = () => {
const w = wrapRef.current?.clientWidth || 800
setWidth(w)
}
handler()
window.addEventListener('resize', handler)
return () => window.removeEventListener('resize', handler)
}, [])


if (err) {
return (
<div className="text-sm text-red-600">
Greška učitavanja PDF-a: {err} —
<a className="underline ml-1" href={`/api/papers/${paperId}/stream`} target="_blank" rel="noreferrer">otvori u novom tabu</a>
</div>
)
}
if (!url) return <p>Učitavanje…</p>


return (
<div ref={wrapRef} className="border rounded-2xl p-2 select-text" onContextMenu={(e)=>e.preventDefault()}>
<Document file={url} onLoadSuccess={(info)=>setNumPages(info.numPages)} loading={<p>Učitavanje…</p>}>
{Array.from(new Array(numPages||0), (_el, index) => (
<Page key={`p_${index+1}`} pageNumber={index+1} width={width} renderAnnotationLayer={false} renderTextLayer={true} />
))}
</Document>
</div>
)
}