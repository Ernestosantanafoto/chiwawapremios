import { supabase } from '../../../lib/supabase'

export async function GET() {
  const { data, error } = await supabase
    .from('page_stats')
    .select('visits')
    .eq('id', 'win')
    .single()
  if (error) return Response.json({ visits: 0 })
  return Response.json({ visits: data.visits })
}

export async function POST() {
  await supabase.rpc('increment_visits', { page_id: 'win' })
  return Response.json({ ok: true })
}
