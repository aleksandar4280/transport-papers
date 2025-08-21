import { createClient } from '@supabase/supabase-js'
import { env } from './env'


export const supabaseAdmin = createClient(env.supabaseUrl, env.supabaseServiceKey)