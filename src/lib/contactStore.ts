import { supabase } from './supabase'

export type ContactMessageInput = {
  full_name: string
  email?: string
  message: string
}

export async function submitContactMessage(
  input: ContactMessageInput,
): Promise<{ ok: boolean; error?: string }> {
  if (!supabase) {
    return { ok: false, error: 'no_supabase' }
  }

  const { error } = await supabase.from('contact_messages').insert({
    full_name: input.full_name.trim(),
    email: input.email?.trim() || null,
    message: input.message.trim(),
  })

  return error ? { ok: false, error: error.message } : { ok: true }
}

export type ContactMessageRow = {
  id: string
  full_name: string
  email: string | null
  message: string
  created_at: string | null
}

export async function fetchContactMessagesAdmin(): Promise<ContactMessageRow[]> {
  if (!supabase) return []

  const { data, error } = await supabase
    .from('contact_messages')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(100)

  if (error || !data) return []
  return data as ContactMessageRow[]
}
