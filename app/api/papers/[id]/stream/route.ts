import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabaseAdmin'
import { env } from '@/lib/env'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

// Why: HTTP header values must be ASCII; add RFC 5987 filename* with UTF‑8 percent-encoding
function asciiFallbackPdf(name: string): string {
  const base = name.replace(/\.pdf$/i, '')
  const stripped = base.normalize('NFD').replace(/[\u0300-\u036f]/g, '') // remove diacritics
  const ascii = stripped.replace(/[^\w\-., ()]/g, '').trim().slice(0, 120) || 'document'
  return `${ascii}.pdf`
}
function contentDispositionInline(name: string): string {
  const original = /\.pdf$/i.test(name) ? name : `${name}.pdf`
  const fallback = asciiFallbackPdf(original).replace(/"/g, '')
  const encoded = encodeURIComponent(original)
  return `inline; filename="${fallback}"; filename*=UTF-8''${encoded}`
}

export async function GET(_req: Request, { params }: { params: { id: string } }) {
  try {
    // 1) Fetch paper meta
    const { data: paper, error } = await supabaseAdmin
      .from('papers')
      .select('id, title, storage_path')
      .eq('id', params.id)
      .single()
    if (error || !paper) {
      return NextResponse.json({ ok: false, stage: 'db:paper', error: error?.message || 'not found' }, { status: 404 })
    }

    // 2) Signed URL from private bucket
    const { data: signed, error: signErr } = await supabaseAdmin
      .storage
      .from(env.bucket)
      .createSignedUrl(paper.storage_path, 60)
    if (signErr || !signed?.signedUrl) {
      return NextResponse.json({ ok: false, stage: 'storage:signed', error: signErr?.message || 'no signed url' }, { status: 500 })
    }

    // 3) Fetch PDF and proxy it inline
    const res = await fetch(signed.signedUrl, { cache: 'no-store' })
    if (!res.ok) {
      const text = await res.text().catch(()=>'')
      return NextResponse.json({ ok: false, stage: 'storage:fetch', status: res.status, error: text?.slice(0,200) }, { status: 502 })
    }
    const buf = await res.arrayBuffer()

    const headers = new Headers()
    headers.set('Content-Type', 'application/pdf')
    headers.set('Cache-Control', 'no-store, max-age=0')
    try { headers.set('Content-Disposition', contentDispositionInline(paper.title)) } catch {}

    return new NextResponse(buf, { status: 200, headers })
  } catch (e: any) {
    return NextResponse.json({ ok: false, stage: 'fatal', error: e?.message || 'unknown' }, { status: 500 })
  }
}
