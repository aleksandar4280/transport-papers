export const env = {
supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL!,
supabaseAnonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
supabaseServiceKey: process.env.SUPABASE_SERVICE_ROLE_KEY!,
bucket: process.env.SUPABASE_STORAGE_BUCKET || 'papers',
adminEmail: process.env.ADMIN_EMAIL || ''
};