import { NextResponse } from 'next/server'
.eq('id', user.id)
.single()
if (profile?.role !== 'admin') {
return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
}


// Forma
const form = await req.formData()
const title = String(form.get('title') || '').trim()
const year = Number(String(form.get('year') || '').trim() || 0) || null
const authorsCsv = String(form.get('authors_csv') || '').trim()
const keywords = String(form.get('keywords') || '').trim()
const categoryId = Number(String(form.get('category_id') || '').trim() || 0) || null
const file = form.get('file') as File | null
if (!file || !title) {
return NextResponse.json({ error: 'Missing data' }, { status: 400 })
}


// PDF → Buffer + parsiranje teksta
const arrayBuffer = await file.arrayBuffer()
const buffer = Buffer.from(arrayBuffer)
const pdfParse = (await import('pdf-parse')).default
const parsed = await pdfParse(buffer).catch(() => ({ text: '' }))


// Upload u privatni bucket
const id = crypto.randomUUID()
const path = `${id}.pdf`
const { error: upErr } = await supabaseAdmin.storage
.from(env.bucket)
.upload(path, buffer, { contentType: 'application/pdf', upsert: false })
if (upErr) return NextResponse.json({ error: upErr.message }, { status: 500 })


// Insert meta
const authors_text = authorsCsv
const keywords_text = keywords
const { error: insErr } = await supabaseAdmin.from('papers').insert({
id,
title,
year,
authors_text,
keywords_text,
category_id: categoryId,
storage_path: path,
content_text: parsed.text || null,
created_by: user.id,
})
if (insErr) return NextResponse.json({ error: insErr.message }, { status: 500 })


// Autori (best-effort)
if (authorsCsv) {
const names = authorsCsv.split(',').map(s => s.trim()).filter(Boolean)
for (const name of names) {
const { data: a } = await supabaseAdmin
.from('authors')
.upsert({ full_name: name }, { onConflict: 'full_name' })
.select()
.single()
if (a) {
await supabaseAdmin.from('paper_authors').insert({ paper_id: id, author_id: a.id }).catch(() => {})
}
}
}


// Redirect na stranicu rada
return NextResponse.redirect(new URL(`/paper/${id}`, req.url))
}