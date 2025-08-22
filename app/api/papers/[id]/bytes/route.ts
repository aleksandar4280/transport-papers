import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabaseAdmin'
import { env } from '@/lib/env'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET(_req: Request, { params }: { params: { id: string } }) {
  try {
    const { data: paper, error } = await supabaseAdmin
      .from('papers')
      .select('id, storage_path')
      .eq('id', params.id)
      .single()
    if (error || !paper) {
      return NextResponse.json({ ok: false, stage: 'db:paper', error: error?.message || 'not found' }, { status: 404 })
    }

    const { data: signed, error: signErr } = await supabaseAdmin
      .storage
      .from(env.bucket)
      .createSignedUrl(paper.storage_path, 60)
    if (signErr || !signed?.signedUrl) {
      return NextResponse.json({ ok: false, stage: 'storage:signed', error: signErr?.message || 'no signed url' }, { status: 500 })
    }

    const upstream = await fetch(signed.signedUrl, { cache: 'no-store' })
    if (!upstream.ok) {
      const t = await upstream.text().catch(()=>'')
      return NextResponse.json({ ok: false, stage: 'storage:fetch', status: upstream.status, error: t.slice(0,200) }, { status: 502 })
    }
    const buf = await upstream.arrayBuffer()

    // Important: we DO NOT set Content-Disposition; client fetches this via XHR, not navigation
    return new NextResponse(buf, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Cache-Control': 'no-store, max-age=0',
      },
    })
  } catch (e: any) {
    return NextResponse.json({ ok: false, stage: 'fatal', error: e?.message || 'unknown' }, { status: 500 })
  }
}

