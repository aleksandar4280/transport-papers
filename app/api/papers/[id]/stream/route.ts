import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabaseAdmin'
import { env } from '@/lib/env'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

function asciiFallbackPdf(name: string): string {
  const base = name.replace(/\.pdf$/i, '')
  const stripped = base.normalize('NFD').replace(/[\u0300-\u036f]/g, '')
  const ascii = stripped.replace(/[^\w\-., ()]/g, '').trim().slice(0, 120) || 'document'
  return `${ascii}.pdf`
}
function contentDispositionInline(name: string): string {
  const original = /\.pdf$/i.test(name) ? name : `${name}.pdf`
  const fallback = asciiFallbackPdf(original).replace(/"/g, '')
  const encoded = encodeURIComponent(original)
  return `inline; filename="${fallback}"; filename*=UTF-8''${encoded}`
}

async function proxyFromSignedUrl(signedUrl: string, req: Request, filename: string) {
  const range = req.headers.get('range') || undefined
  const upstream = await fetch(signedUrl, {
    method: 'GET',
    headers: range ? { Range: range } : undefined,
    cache: 'no-store',
  })

  if (!(upstream.ok || upstream.status === 206)) {
    const text = await upstream.text().catch(() => '')
    return NextResponse.json(
      { ok: false, stage: 'storage:fetch', status: upstream.status, error: text.slice(0, 200) },
      { status: 502 },
    )
  }

  const headers = new Headers()
  headers.set('Content-Type', 'application/pdf')
  headers.set('Cache-Control', 'no-store, max-age=0')
  headers.set('Accept-Ranges', 'bytes')
  const len = upstream.headers.get('Content-Length')
  const cr = upstream.headers.get('Content-Range')
  if (len) headers.set('Content-Length', len)
  if (cr) headers.set('Content-Range', cr)
  try { headers.set('Content-Disposition', contentDispositionInline(filename)) } catch {}

  return new NextResponse(upstream.body, { status: upstream.status, headers })
}

export async function GET(req: Request, { params }: { params: { id: string } }) {
  try {
    const { data: paper, error } = await supabaseAdmin
      .from('papers')
      .select('id, title, storage_path')
      .eq('id', params.id)
      .single()
    if (error || !paper) {
      return NextResponse.json({ ok: false, stage: 'db:paper', error: error?.message || 'not found' }, { status: 404 })
    }

    // 1) Pokušaj preko signed URL sa dužim rokom (1h)
    const { data: signed, error: signErr } = await supabaseAdmin
      .storage
      .from(env.bucket)
      .createSignedUrl(paper.storage_path, 3600)
    if (!signErr && signed?.signedUrl) {
      const res = await proxyFromSignedUrl(signed.signedUrl, req, paper.title)
      // Ako storage vratio 400 InvalidJWT (časovnik/istek), probaj direktan download kao fallback
      if (!(res as any)?.body && (res as any)?.status === 502) {
        const json = await (res as Response).clone().json().catch(() => ({} as any))
        if (json?.error?.includes('InvalidJWT') || json?.status === 400) {
          // fallback ispod
        } else {
          return res
        }
      } else {
        return res
      }
    }

    // 2) Fallback: direktan download preko admin ključa (bez potpisanog URL-a)
    const dl = await supabaseAdmin.storage.from(env.bucket).download(paper.storage_path)
    if (dl.error || !dl.data) {
      return NextResponse.json({ ok: false, stage: 'storage:download', error: dl.error?.message || 'download failed' }, { status: 500 })
    }
    const ab = await dl.data.arrayBuffer()
    const headers = new Headers()
    headers.set('Content-Type', 'application/pdf')
    headers.set('Cache-Control', 'no-store, max-age=0')
    try { headers.set('Content-Disposition', contentDispositionInline(paper.title)) } catch {}
    return new NextResponse(ab, { status: 200, headers })
  } catch (e: any) {
    return NextResponse.json({ ok: false, stage: 'fatal', error: e?.message || 'unknown' }, { status: 500 })
  }
}

export async function HEAD(_req: Request, { params }: { params: { id: string } }) {
  try {
    const { data: paper } = await supabaseAdmin
      .from('papers')
      .select('id, title, storage_path')
      .eq('id', params.id)
      .single()
    if (!paper) return new NextResponse(null, { status: 404 })

    const { data: signed } = await supabaseAdmin
      .storage
      .from(env.bucket)
      .createSignedUrl(paper.storage_path, 3600)
    if (!signed?.signedUrl) return new NextResponse(null, { status: 500 })

    const upstream = await fetch(signed.signedUrl, { method: 'HEAD', cache: 'no-store' })
    const headers = new Headers()
    headers.set('Content-Type', 'application/pdf')
    headers.set('Cache-Control', 'no-store, max-age=0')
    headers.set('Accept-Ranges', 'bytes')
    const len = upstream.headers.get('Content-Length')
    if (len) headers.set('Content-Length', len)
    try { headers.set('Content-Disposition', contentDispositionInline(paper.title)) } catch {}

    return new NextResponse(null, { status: upstream.status, headers })
  } catch {
    return new NextResponse(null, { status: 500 })
  }
}
