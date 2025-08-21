import { cookies } from 'next/headers'
import { createServerClient } from '@supabase/ssr'
import { env } from './env'


export function createServerSupabase() {
const cookieStore = cookies()
return createServerClient(env.supabaseUrl, env.supabaseAnonKey, {
cookies: {
get(name: string) { return cookieStore.get(name)?.value },
set() {},
remove() {},
},
})
}