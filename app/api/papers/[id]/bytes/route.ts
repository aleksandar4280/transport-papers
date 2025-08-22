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

    // Direktan download preko admin API-ja (ne koristi potpisan URL) → nema InvalidJWT
    const dl = await supabaseAdmin.storage.from(env.bucket).download(paper.storage_path)
    if (dl.error || !dl.data) {
      return NextResponse.json({ ok: false, stage: 'storage:download', error: dl.error?.message || 'download failed' }, { status: 500 })
    }
    const ab = await dl.data.arrayBuffer()

    return new NextResponse(ab, {
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
