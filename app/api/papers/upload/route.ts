import { NextResponse } from 'next/server'
return NextResponse.json({ error: 'Missing data' }, { status: 400 })
}


// PDF buffer + text extraction
const arrayBuffer = await file.arrayBuffer()
const buffer = Buffer.from(arrayBuffer)
const pdfParse = (await import('pdf-parse')).default
const parsed = await pdfParse(buffer).catch(() => ({ text: '' }))


// Upload to private storage
const id = crypto.randomUUID()
const path = `${id}.pdf`
const { error: upErr } = await supabaseAdmin.storage
.from(env.bucket)
.upload(path, buffer, { contentType: 'application/pdf', upsert: false })
if (upErr) {
return NextResponse.json({ error: upErr.message }, { status: 500 })
}


// Insert metadata
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
if (insErr) {
return NextResponse.json({ error: insErr.message }, { status: 500 })
}


// Upsert authors (best-effort; ignorišemo greške pojedinačnih upisa)
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
} catch (_e) {
// ignoriši pojedinačne greške pri povezivanju autora
}
}
}


// Redirect to paper page
return NextResponse.redirect(new URL(`/paper/${id}`, req.url))
}