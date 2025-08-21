'use client'
import { useRouter, useSearchParams } from 'next/navigation'
import { useState, useEffect } from 'react'


export default function SearchBar({ categories }: { categories: {id:number; name:string}[] }) {
const router = useRouter()
const sp = useSearchParams()
const [q, setQ] = useState(sp.get('q') || '')
const [category, setCategory] = useState(sp.get('category') || '')
const [year, setYear] = useState(sp.get('year') || '')
const [author, setAuthor] = useState(sp.get('author') || '')


useEffect(()=>{ setQ(sp.get('q')||'') },[sp])


const submit = (e: React.FormEvent) => {
e.preventDefault()
const p = new URLSearchParams()
if (q) p.set('q', q)
if (category) p.set('category', category)
if (year) p.set('year', year)
if (author) p.set('author', author)
router.push('/?'+p.toString())
}
return (
<form onSubmit={submit} className="grid gap-2 sm:grid-cols-4 items-end">
<label className="flex flex-col text-sm">Ključne reči
<input value={q} onChange={e=>setQ(e.target.value)} className="border rounded-xl px-3 py-2" placeholder="npr. bezbednost, parking..."/>
</label>
<label className="flex flex-col text-sm">Kategorija
<select value={category} onChange={e=>setCategory(e.target.value)} className="border rounded-xl px-3 py-2">
<option value="">Sve</option>
{categories.map(c=> <option key={c.id} value={String(c.id)}>{c.name}</option>)}
</select>
</label>
<label className="flex flex-col text-sm">Godina
<input value={year} onChange={e=>setYear(e.target.value)} className="border rounded-xl px-3 py-2" placeholder="npr. 2022"/>
</label>
<label className="flex flex-col text-sm">Autor
<input value={author} onChange={e=>setAuthor(e.target.value)} className="border rounded-xl px-3 py-2" placeholder="npr. Petrović"/>
</label>
<div className="sm:col-span-4 flex gap-2">
<button className="rounded-xl border px-4 py-2">Pretraži</button>
<button type="button" className="rounded-xl border px-4 py-2" onClick={()=>{ setQ(''); setCategory(''); setYear(''); setAuthor(''); router.push('/') }}>Reset</button>
</div>
</form>
)
}