import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabaseAdmin'
import { env } from '@/lib/env'


export const runtime = 'nodejs'


export async function GET(_req: Request, { params }: { params: { id: string } }) {
const { data: paper, error } = await supabaseAdmin.from('papers').select('*').eq('id', params.id).single()
if (error || !paper) return new NextResponse('Not found', { status: 404 })
const { data: signed } = await supabaseAdmin.storage.from(env.bucket).createSignedUrl(paper.storage_path, 60)
if (!signed) return new NextResponse('Storage error', { status: 500 })
const res = await fetch(signed.signedUrl)
const buf = Buffer.from(await res.arrayBuffer())
const headers = new Headers({
'Content-Type': 'application/pdf',
'Content-Disposition': `inline; filename="${paper.title.replace(/"/g,'')}.pdf"`,
'Cache-Control': 'no-store'
})
return new NextResponse(buf, { status: 200, headers })
}