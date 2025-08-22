import { NextResponse } from 'next/server'
import { createServerSupabase } from '@/lib/supabaseServer'
import { supabaseAdmin } from '@/lib/supabaseAdmin'
import { env } from '@/lib/env'

export const runtime = 'nodejs'

export async function POST(req: Request, { params }: { params: { id: string } }) {
  const supabase = createServerSupabase()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: me } = await supabaseAdmin
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()
  if (me?.role !== 'admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const form = await req.formData()
  const title = String(form.get('title') ?? '').trim()
  const year = Number(String(form.get('year') ?? '').trim() || 0) || null
  const authorsCsv = String(form.get('authors_csv') ?? '').trim()
  const keywords = String(form.get('keywords') ?? '').trim()
  const categoryId = Number(String(form.get('category_id') ?? '').trim() || 0) || null
  const file = form.get('file') as File | null

  if (!title) return NextResponse.json({ error: 'Missing title' }, { status: 400 })

  const { data: paper } = await supabaseAdmin
    .from('papers')
    .select('*')
    .eq('id', params.id)
    .single()
  if (!paper) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  let storage_path: string = paper.storage_path
  let content_text: string | null = paper.content_text

  if (file && (file as any).size) {
    const arrayBuffer = await file.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)

    try {
      const pdfParse = (await import('pdf-parse')).default
      const parsed = await pdfParse(buffer)
      content_text = parsed?.text || null
    } catch {
      // best-effort parsing; ako padne, nastavi bez teksta
      content_text = null
    }

    const { error: upErr } = await supabaseAdmin.storage
      .from(env.bucket)
      .upload(storage_path, buffer, {
        contentType: 'application/pdf',
        upsert: true,
      })
    if (upErr) return NextResponse.json({ error: upErr.message }, { status: 500 })
  }

  const { error: updErr } = await supabaseAdmin
    .from('papers')
    .update({
      title,
      year,
      authors_text: authorsCsv,
      keywords_text: keywords,
      category_id: categoryId,
      content_text,
      storage_path,
    })
    .eq('id', params.id)
  if (updErr) return NextResponse.json({ error: updErr.message }, { status: 500 })

  // Veze autora (pojednostavljeno: obriši pa ponovo upiši)
  await supabaseAdmin.from('paper_authors').delete().eq('paper_id', params.id)
  if (authorsCsv) {
    const names = authorsCsv.split(',').map(s => s.trim()).filter(Boolean)
    for (const name of names) {
      const { data: a } = await supabaseAdmin
        .from('authors')
        .upsert({ full_name: name }, { onConflict: 'full_name' })
        .select()
        .single()
      if (a) {
        await supabaseAdmin
          .from('paper_authors')
          .insert({ paper_id: params.id, author_id: a.id })
      }
    }
  }

  return NextResponse.redirect(new URL(`/paper/${params.id}`, req.url))
}
