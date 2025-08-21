import { NextResponse } from 'next/server'
import { createServerSupabase } from '@/lib/supabaseServer'
import { supabaseAdmin } from '@/lib/supabaseAdmin'
import { env } from '@/lib/env'

export const runtime = 'nodejs'

const MAX_BYTES = 20 * 1024 * 1024 // 20 MB

export async function POST(req: Request) {
  const supabase = createServerSupabase()
  let stage = 'start'

  try {
    // 1) Auth
    stage = 'auth:getUser'
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ ok: false, stage, error: 'Unauthorized' }, { status: 401 })
    }

    // 2) Admin check
    stage = 'auth:checkAdmin'
    const { data: profile } = await supabaseAdmin
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single()
    if (profile?.role !== 'admin') {
      return NextResponse.json({ ok: false, stage, error: 'Forbidden (not admin)' }, { status: 403 })
    }

    // 3) Parse form
    stage = 'form:parse'
    const form = await req.formData()
    const title = String(form.get('title') ?? '').trim()
    const year = Number(String(form.get('year') ?? '').trim() || 0) || null
    const authorsCsv = String(form.get('authors_csv') ?? '').trim()
    const keywords = String(form.get('keywords') ?? '').trim()
    const categoryId = Number(String(form.get('category_id') ?? '').trim() || 0) || null
    const file = form.get('file') as File | null

    if (!file || !title) {
      return NextResponse.json({ ok: false, stage, error: 'Missing data (file/title)' }, { status: 400 })
    }

    // 4) Validate file
    stage = 'file:validate'
    const mime = (file as any).type || 'application/octet-stream'
    if (mime !== 'application/pdf') {
      return NextResponse.json({ ok: false, stage, error: `Invalid mime: ${mime}` }, { status: 415 })
    }
    const size = (file as any).size ?? 0
    if (size > MAX_BYTES) {
      return NextResponse.json({ ok: false, stage, error: `File too large: ${size} bytes` }, { status: 413 })
    }

    // 5) Buffer + parse text (best-effort)
    stage = 'pdf:read'
    const arrayBuffer = await file.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)

    stage = 'pdf:parse'
    let content_text: string | null = null
    try {
      const pdfParse = (await import('pdf-parse')).default
      const parsed = await pdfParse(buffer)
      content_text = parsed?.text || null
    } catch {
      content_text = null
    }

    // 6) Upload to Storage
    stage = 'storage:upload'
    const id = crypto.randomUUID()
    const path = `${id}.pdf`
    const { error: upErr } = await supabaseAdmin.storage
      .from(env.bucket)
      .upload(path, buffer, { contentType: 'application/pdf', upsert: false })
    if (upErr) {
      return NextResponse.json({ ok: false, stage, error: upErr.message }, { status: 500 })
    }

    // 7) Insert metadata
    stage = 'db:insertPaper'
    const { error: insErr } = await supabaseAdmin.from('papers').insert({
      id,
      title,
      year,
      authors_text: authorsCsv,
      keywords_text: keywords,
      category_id: categoryId,
      storage_path: path,
      content_text,
      created_by: user.id,
    })
    if (insErr) {
      return NextResponse.json({ ok: false, stage, error: insErr.message }, { status: 500 })
    }

    // 8) Upsert authors (best-effort)
    stage = 'db:authors'
    if (authorsCsv) {
      const names = authorsCsv.split(',').map(s => s.trim()).filter(Boolean)
      for (const name of names) {
        try {
          const { data: a } = await supabaseAdmin
            .from('authors')
            .upsert({ full_name: name }, { onConflict: 'full_name' })
            .select()
            .single()
          if (a) {
            await supabaseAdmin
              .from('paper_authors')
              .insert({ paper_id: id, author_id: a.id })
          }
        } catch {
          // ignore per-author errors
        }
      }
    }

    // 9) Redirect to paper page
    stage = 'redirect'
    return NextResponse.redirect(new URL(`/paper/${id}`, req.url))
  } catch (e: any) {
    return NextResponse.json({ ok: false, stage, error: e?.message || 'Unknown error' }, { status: 500 })
  }
}
