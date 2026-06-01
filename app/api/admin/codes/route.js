import { supabase } from '../../../../lib/supabase'
import { checkAdminAuth } from '../../../../lib/auth'

export async function GET(req) {
  if (!checkAdminAuth(req)) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const { data, error } = await supabase
    .from('public_codes')
    .select(`id, code, is_winner, reward_code, reward_label, reward_text, reward_deadline, used, used_at, created_at, created_by,
             reward_assignments ( reward_code, reward_label, validation_id, assigned_at )`)
    .order('created_at', { ascending: false })

  if (error) return Response.json({ error: error.message }, { status: 500 })
  return Response.json({ codes: data })
}

export async function POST(req) {
  const username = checkAdminAuth(req)
  if (!username) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()
  const entries = Array.isArray(body) ? body : [body]

  const rows = entries.map(e => {
    const code = (e.code || '').trim().toUpperCase()
    if (!/^[A-Z0-9]{10}$/.test(code)) return null
    const row = { code, is_winner: !!e.is_winner, created_by: username }

    if (e.is_winner) {
      const rewardCode = (e.reward_code || '').trim().toUpperCase()
      if (!/^[A-Z]{8}$/.test(rewardCode)) return null
      row.reward_code = rewardCode
      row.reward_label = (e.reward_label || '').trim()
      row.reward_text = (e.reward_text || '').trim()
      row.reward_deadline = e.reward_deadline || null
    }
    return row
  }).filter(Boolean)

  if (rows.length === 0) return Response.json({ error: 'Formato incorrecto. Código público: 10 caracteres alfanuméricos. Código premio: 8 letras mayúsculas.' }, { status: 400 })

  const { data, error } = await supabase.from('public_codes').insert(rows).select()
  if (error) return Response.json({ error: error.message }, { status: 500 })
  return Response.json({ created: data })
}

export async function PATCH(req) {
  const username = checkAdminAuth(req)
  if (!username) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const { id, code, is_winner, reward_code, reward_label, reward_text, reward_deadline } = await req.json()
  if (!id) return Response.json({ error: 'id required' }, { status: 400 })

  const updates = {}
  if (code !== undefined) {
    const c = code.trim().toUpperCase()
    if (!/^[A-Z0-9]{10}$/.test(c)) return Response.json({ error: 'El código público debe tener exactamente 10 caracteres alfanuméricos' }, { status: 400 })
    updates.code = c
  }
  if (is_winner !== undefined) updates.is_winner = !!is_winner
  if (reward_code !== undefined) {
    const rc = reward_code.trim().toUpperCase()
    if (rc && !/^[A-Z]{8}$/.test(rc)) return Response.json({ error: 'El código de premio debe tener exactamente 8 letras mayúsculas' }, { status: 400 })
    updates.reward_code = rc
  }
  if (reward_label !== undefined) updates.reward_label = reward_label.trim()
  if (reward_text !== undefined) updates.reward_text = reward_text.trim()
  if (reward_deadline !== undefined) updates.reward_deadline = reward_deadline || null

  const { data, error } = await supabase.from('public_codes').update(updates).eq('id', id).select()
  if (error) return Response.json({ error: error.message }, { status: 500 })
  return Response.json({ updated: data })
}

export async function DELETE(req) {
  const username = checkAdminAuth(req)
  if (!username) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const id = searchParams.get('id')
  if (!id) return Response.json({ error: 'id required' }, { status: 400 })

  const { data, error } = await supabase.from('public_codes').delete().eq('id', id).eq('used', false).select()
  if (error) return Response.json({ error: error.message }, { status: 500 })
  if (!data.length) return Response.json({ error: 'Código ya usado — no se puede eliminar' }, { status: 409 })
  return Response.json({ deleted: true })
}
