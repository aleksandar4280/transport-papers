import { NextResponse } from 'next/server'
import { createServerSupabase } from '@/lib/supabaseServer'


export async function POST() {
const supabase = createServerSupabase()
await supabase.auth.signOut()
return NextResponse.redirect(new URL('/', process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'))
}