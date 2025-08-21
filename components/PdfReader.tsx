'use client'
import { Document, Page, pdfjs } from 'react-pdf'
import { useState } from 'react'


// Why: set worker to avoid bundling issues and keep viewer lightweight
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