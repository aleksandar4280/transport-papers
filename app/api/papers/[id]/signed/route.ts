import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabaseAdmin'
import { env } from '@/lib/env'


export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'


export async function GET(_req: Request, { params }: { params: { id: string } }) {
const { data: paper, error } = await supabaseAdmin
.from('papers')
.select('id, storage_path')
.eq('id', params.id)
.single()
if (error || !paper) {
return NextResponse.json({ ok: false, error: error?.message || 'not found' }, { status: 404 })
}
const { data: signed, error: signErr } = await supabaseAdmin
.storage
.from(env.bucket)
.createSignedUrl(paper.storage_path, 300)
if (signErr || !signed?.signedUrl) {
return NextResponse.json({ ok: false, error: signErr?.message || 'no signed url' }, { status: 500 })
}
return NextResponse.json({ ok: true, url: signed.signedUrl })
}