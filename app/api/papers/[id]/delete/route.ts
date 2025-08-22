import { NextResponse } from 'next/server'
import { createServerSupabase } from '@/lib/supabaseServer'
import { supabaseAdmin } from '@/lib/supabaseAdmin'
import { env } from '@/lib/env'

export const runtime = 'nodejs'

export async function POST(_req: Request, { params }: { params: { id: string } }) {
  const supabase = createServerSupabase()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: me } = await supabaseAdmin.from('profiles').select('role').eq('id', user.id).single()
  if (me?.role !== 'admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { data: paper } = await supabaseAdmin.from('papers').select('*').eq('id', params.id).single()
  if (!paper) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  // Clean relations (favorites + authors) pre delete
  await supabaseAdmin.from('favorites').delete().eq('paper_id', params.id)
  await supabaseAdmin.from('paper_authors').delete().eq('paper_id', params.id)

  const { error: delErr } = await supabaseAdmin.from('papers').delete().eq('id', params.id)
  if (delErr) return NextResponse.json({ error: delErr.message }, { status: 500 })

  if (paper.storage_path) {
    await supabaseAdmin.storage.from(env.bucket).remove([paper.storage_path])
  }

  return NextResponse.json({ ok: true })
}
