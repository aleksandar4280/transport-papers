'use client'
import { createClient } from '@/lib/supabaseClient'
import { useState, useEffect } from 'react'


export default function FavoriteButton({ paperId }: { paperId: string }) {
const supabase = createClient()
const [isAuthed, setAuthed] = useState(false)
const [saved, setSaved] = useState(false)


useEffect(()=>{
supabase.auth.getUser().then(async ({ data }) => {
const user = data.user
setAuthed(!!user)
if (user) {
const { data: fav } = await supabase.from('favorites').select('*').eq('user_id', user.id).eq('paper_id', paperId).maybeSingle()
setSaved(!!fav)
}
})
},[paperId])


const toggle = async () => {
const { data } = await supabase.auth.getUser()
if (!data.user) { window.location.href = '/auth/sign-in'; return }
if (saved) {
await supabase.from('favorites').delete().eq('user_id', data.user.id).eq('paper_id', paperId)
setSaved(false)
} else {
await supabase.from('favorites').insert({ user_id: data.user.id, paper_id: paperId })
setSaved(true)
}
}


return (
<button onClick={toggle} className={`rounded-xl border px-3 py-1 ${saved? 'bg-green-50':''}`}>
{saved? 'U omiljenim' : isAuthed? 'Sačuvaj u omiljene' : 'Prijavi se za Omiljene'}
</button>
)
}