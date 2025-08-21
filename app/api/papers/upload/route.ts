import { NextResponse } from 'next/server'


stage = 'pdf:parse'
let content_text: string | null = null
try {
const pdfParse = (await import('pdf-parse')).default
const parsed = await pdfParse(buffer)
content_text = parsed?.text || null
} catch (e) {
console.warn('pdf-parse failed, continuing without text', e)
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
console.error('storage upload error', upErr)
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
console.error('papers insert error', insErr)
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
} catch (e) {
console.warn('link author failed', name, e)
}
}
}


// 9) Done → redirect
stage = 'redirect'
return NextResponse.redirect(new URL(`/paper/${id}`, req.url))
} catch (e: any) {
console.error('upload fatal', { stage, error: e?.message, stack: e?.stack })
return NextResponse.json({ ok: false, stage, error: e?.message || 'Unknown error' }, { status: 500 })
}
}