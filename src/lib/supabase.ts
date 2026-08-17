import { createClient } from '@supabase/supabase-js'

export const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://xrwsgrulzlwnljsczlbo.supabase.co'
export const supabasePublishableKey =
  import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY || 'sb_publishable_QavxFFdvSFAX0A4VWFunwg_VuHaaQGk'

export const supabase = createClient(supabaseUrl, supabasePublishableKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  },
})
