'use client'
import { createClient } from '@/lib/supabaseClient'
import { useState } from 'react'


export default function SignUpPage(){
const supabase = createClient()
const [email, setEmail] = useState('')
const [password, setPassword] = useState('')
const [error, setError] = useState('')


const submit = async (e: React.FormEvent) => {
e.preventDefault()
const { error } = await supabase.auth.signUp({ email, password })
if (error) setError(error.message); else window.location.href = '/'
}


return (
<div className="max-w-sm mx-auto">
<h1 className="text-xl font-semibold mb-4">Registracija</h1>
<form onSubmit={submit} className="grid gap-3">
<input className="border rounded-xl px-3 py-2" placeholder="Email" value={email} onChange={e=>setEmail(e.target.value)} />
<input className="border rounded-xl px-3 py-2" placeholder="Lozinka" type="password" value={password} onChange={e=>setPassword(e.target.value)} />
{error && <p className="text-red-600 text-sm">{error}</p>}
<button className="rounded-xl border px-4 py-2">Kreiraj nalog</button>
</form>
</div>
)
}