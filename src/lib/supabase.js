import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY

export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseKey)

export function getSupabaseConfigError() {
  return 'Supabase is not configured yet. Add VITE_SUPABASE_URL and VITE_SUPABASE_PUBLISHABLE_KEY to your environment.'
}

export const supabase = isSupabaseConfigured
  ? createClient(supabaseUrl, supabaseKey)
  : null

function createEmptyResult(data = []) {
  return { data, error: null }
}

function createConfigErrorResult() {
  return {
    data: null,
    error: new Error(getSupabaseConfigError()),
  }
}

async function safeQuery(operation, fallbackData = []) {
  if (!isSupabaseConfigured || !supabase) {
    return createEmptyResult(fallbackData)
  }

  try {
    return await operation()
  } catch (error) {
    return {
      data: fallbackData,
      error,
    }
  }
}

export async function loadIdeas(filters = {}) {
  const { search = '' } = filters

  if (!isSupabaseConfigured || !supabase) {
    return createEmptyResult([])
  }

  let query = supabase
    .from('ideas')
    .select('*, profiles:creator_id (id, name, email, profile_image, account_type)')
    .order('created_at', { ascending: false })

  if (search) {
    query = query.or(`title.ilike.%${search}%,category.ilike.%${search}%,industry.ilike.%${search}%`)
  }

  return query
}

export async function loadIdeaBySlug(slug) {
  if (!isSupabaseConfigured || !supabase) {
    return createEmptyResult(null)
  }

  return supabase
    .from('ideas')
    .select('*, profiles:creator_id (id, name, email, profile_image, account_type)')
    .eq('slug', slug)
    .maybeSingle()
}

export async function loadProtectedIdea(ideaId) {
  if (!isSupabaseConfigured || !supabase) {
    return createEmptyResult(null)
  }

  return supabase
    .from('ideas')
    .select('id, protected_details, public_description, teaser, category, industry, stage, asking_price, purchase_type, creator_id, status, slug')
    .eq('id', ideaId)
    .maybeSingle()
}

export async function loadProfiles() {
  return safeQuery(() => supabase
    .from('profiles')
    .select('id, name, email, profile_image, account_type')
    .order('created_at', { ascending: false }), [])
}

export async function createIdea(payload) {
  if (!isSupabaseConfigured || !supabase) {
    return createConfigErrorResult()
  }

  return supabase.from('ideas').insert({
    creator_id: payload.creator_id,
    slug: payload.slug,
    title: payload.title,
    teaser: payload.teaser ?? '',
    public_description: payload.public_description ?? payload.teaser ?? '',
    protected_details: payload.protected_details ?? '',
    category: payload.category ?? '',
    industry: payload.industry ?? '',
    stage: payload.stage ?? 'Concept',
    asking_price: Number(payload.asking_price ?? 0),
    rights_type: payload.purchase_type ?? 'Full Ownership',
    purchase_type: payload.purchase_type ?? 'Full Ownership',
    status: 'available',
  }).select().single()
}

export async function purchaseIdea(ideaId) {
  if (!isSupabaseConfigured || !supabase) {
    return { error: new Error(getSupabaseConfigError()), alreadySold: false }
  }

  try {
    const { data, error } = await supabase.rpc('purchase_idea', { p_idea_id: ideaId })

    if (error) {
      return {
        data: null,
        error,
        alreadySold: error.message?.includes('IDEA_ALREADY_SOLD') || error.code === 'P0001',
      }
    }

    return { data, error: null, alreadySold: false }
  } catch (error) {
    return { data: null, error, alreadySold: false }
  }
}

export async function loadBuyerPurchases(userId) {
  if (!userId || !isSupabaseConfigured || !supabase) {
    return createEmptyResult([])
  }

  return supabase
    .from('idea_purchases')
    .select('*, ideas:idea_id (id, title, slug, category, status, asking_price, purchase_type)')
    .eq('buyer_id', userId)
    .order('purchased_at', { ascending: false })
}

export async function loadSavedIdeas(userId) {
  if (!userId || !isSupabaseConfigured || !supabase) {
    return createEmptyResult([])
  }

  return supabase
    .from('saved_ideas')
    .select('*, ideas:idea_id (id, title, category, stage, status, asking_price, purchase_type)')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
}

export async function toggleSavedIdea(userId, ideaId, saved) {
  if (!userId || !ideaId || !isSupabaseConfigured || !supabase) {
    return { error: null, data: null }
  }

  if (saved) {
    const { error } = await supabase.from('saved_ideas').delete().eq('user_id', userId).eq('idea_id', ideaId)
    return { error, data: null }
  }

  const { data, error } = await supabase.from('saved_ideas').insert({ user_id: userId, idea_id: ideaId }).select().single()
  return { error, data }
}

export async function loadOffers(userId) {
  if (!userId || !isSupabaseConfigured || !supabase) {
    return createEmptyResult([])
  }

  return supabase
    .from('offers')
    .select('*, ideas:idea_id (id, title, slug, category, status), buyer:buyer_id (id, name), creator:creator_id (id, name)')
    .or(`buyer_id.eq.${userId},creator_id.eq.${userId}`)
    .order('created_at', { ascending: false })
}

export async function createOffer({ ideaId, creatorId, buyerId, amount, purchaseType, message }) {
  if (!isSupabaseConfigured || !supabase) {
    return createConfigErrorResult()
  }

  return supabase.from('offers').insert({
    idea_id: ideaId,
    creator_id: creatorId,
    buyer_id: buyerId,
    amount: Number(amount ?? 0),
    purchase_type: purchaseType,
    message: message ?? '',
    status: 'pending',
  }).select().single()
}

export async function updateOfferStatus(offerId, status) {
  if (!isSupabaseConfigured || !supabase) {
    return createConfigErrorResult()
  }

  return supabase.from('offers').update({ status }).eq('id', offerId).select().single()
}

export async function loadLicenses(userId) {
  if (!userId || !isSupabaseConfigured || !supabase) {
    return createEmptyResult([])
  }

  return supabase
    .from('idea_licenses')
    .select('*, ideas:idea_id (id, title, category, status)')
    .or(`buyer_id.eq.${userId},creator_id.eq.${userId}`)
    .order('starts_at', { ascending: false })
}

export async function loadTransactions(userId) {
  if (!userId || !isSupabaseConfigured || !supabase) {
    return createEmptyResult([])
  }

  return supabase
    .from('transactions')
    .select('*, ideas:idea_id (id, title, category, status)')
    .or(`buyer_id.eq.${userId},seller_id.eq.${userId}`)
    .order('created_at', { ascending: false })
}

export async function loadMessages(userId) {
  if (!userId || !isSupabaseConfigured || !supabase) {
    return createEmptyResult([])
  }

  return supabase
    .from('messages')
    .select('*')
    .or(`sender_id.eq.${userId},recipient_id.eq.${userId}`)
    .order('created_at', { ascending: true })
}

export async function sendMessage({ senderId, recipientId, body }) {
  if (!senderId || !recipientId || !body || !isSupabaseConfigured || !supabase) {
    return createConfigErrorResult()
  }

  return supabase.from('messages').insert({
    sender_id: senderId,
    recipient_id: recipientId,
    body,
  }).select().single()
}

export async function loadCreatorCounts(userId) {
  if (!userId || !isSupabaseConfigured || !supabase) {
    return createEmptyResult({ available: 0, under_offer: 0, sold: 0 })
  }

  const { data, error } = await supabase
    .from('ideas')
    .select('status')
    .eq('creator_id', userId)

  if (error) {
    return { data: { available: 0, under_offer: 0, sold: 0 }, error }
  }

  const counts = { available: 0, under_offer: 0, sold: 0 }
  for (const idea of data ?? []) {
    counts[idea.status] = (counts[idea.status] ?? 0) + 1
  }
  return { data: counts, error: null }
}

export async function loadCreatorIdeas(userId) {
  if (!userId || !isSupabaseConfigured || !supabase) {
    return createEmptyResult([])
  }

  return supabase
    .from('ideas')
    .select('*')
    .eq('creator_id', userId)
    .order('created_at', { ascending: false })
}

export async function loadIdeaById(ideaId) {
  if (!ideaId || !isSupabaseConfigured || !supabase) {
    return createEmptyResult(null)
  }

  return supabase.from('ideas').select('*').eq('id', ideaId).maybeSingle()
}

export default supabase