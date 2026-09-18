import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey)

export const supabase = isSupabaseConfigured
  ? createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
      },
    })
  : null

export function getSupabaseConfigError() {
  return 'Authentication is not configured yet. Add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY to the environment before signing in.'
}

export async function loadIdeaStatuses() {
  if (!supabase) return { data: [], error: null }
  return supabase.from('ideas').select('id, slug, status, sold_at, allows_transfer_resale, rights_type')
}

export async function purchaseIdea(ideaId) {
  if (!supabase) return { data: null, error: new Error(getSupabaseConfigError()) }
  const result = await supabase.rpc('purchase_idea', { p_idea_id: ideaId })
  if (result.error?.message?.includes('IDEA_ALREADY_SOLD')) {
    return { data: null, error: new Error('This idea has already been sold.'), alreadySold: true }
  }
  return result
}

export async function loadBuyerPurchases(userId) {
  if (!supabase || !userId) return { data: [], error: null }
  return supabase
    .from('idea_purchases')
    .select('id, idea_id, amount, rights_type, purchased_at, ideas(slug, title, allows_transfer_resale)')
    .eq('buyer_id', userId)
    .order('purchased_at', { ascending: false })
}

export async function loadCreatorCounts(userId) {
  if (!supabase || !userId) return { data: null, error: null }
  const result = await supabase.from('ideas').select('status').eq('creator_id', userId)
  if (result.error) return result
  return {
    data: (result.data ?? []).reduce((counts, idea) => ({ ...counts, [idea.status]: (counts[idea.status] ?? 0) + 1 }), { available: 0, under_offer: 0, sold: 0 }),
    error: null,
  }
}