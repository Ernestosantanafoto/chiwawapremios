import { supabase } from '../../../lib/supabase'

function makeValidationId() {
  return '#' + String(Math.floor(10000 + Math.random() * 90000))
}

// Formato de fecha límite para mostrar al usuario
function formatDeadlineMsg(dateStr) {
  if (!dateStr) return null
  const deadline = new Date(dateStr + 'T23:59:59')
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const deadlineDay = new Date(dateStr + 'T00:00:00')

  const dd = String(deadline.getDate()).padStart(2, '0')
  const mm = String(deadline.getMonth() + 1).padStart(2, '0')
  const yyyy = deadline.getFullYear()
  const formatted = `${dd}/${mm}/${yyyy}`

  if (deadlineDay.getTime() === today.getTime()) {
    return `Tienes solo hoy día ${formatted} para canjearlo`
  }
  return `Tienes hasta el ${formatted} para canjearlo`
}

export async function POST(req) {
  const body = await req.json().catch(() => ({}))
  const raw = (body.code || '').trim().toUpperCase().replace(/\s/g, '')

  // Validar formato: exactamente 10 caracteres alfanuméricos
  if (!raw || raw.length !== 10 || !/^[A-Z0-9]{10}$/.test(raw)) {
    return Response.json({ status: 'invalid' }, { status: 200 })
  }

  const { data: record, error } = await supabase
    .from('public_codes')
    .select('id, is_winner, used')
    .eq('code', raw)
    .single()

  if (error || !record) {
    return Response.json({ status: 'invalid' }, { status: 200 })
  }

  if (record.used) {
    const { data: prev } = await supabase
      .from('reward_assignments')
      .select('reward_code, reward_label, reward_text, reward_deadline, validation_id, assigned_at')
      .eq('public_code_id', record.id)
      .single()

    return Response.json({
      status: 'used',
      validationId: prev?.validation_id,
      assignedAt: prev?.assigned_at || null,
    })
  }

  if (!record.is_winner) {
    return Response.json({ status: 'loser' })
  }

  // Asignación atómica
  const { data: updated, error: updateErr } = await supabase
    .from('public_codes')
    .update({ used: true, used_at: new Date().toISOString() })
    .eq('id', record.id)
    .eq('used', false)
    .select('id, reward_code, reward_label, reward_text, reward_deadline')

  if (updateErr || !updated || updated.length === 0) {
    return Response.json({ status: 'used' })
  }

  const codeRecord = updated[0]
  const validationId = makeValidationId()
  const deadlineMsg = formatDeadlineMsg(codeRecord.reward_deadline)

  await supabase.from('reward_assignments').insert({
    public_code_id: record.id,
    reward_code: codeRecord.reward_code || '',
    reward_label: codeRecord.reward_label || 'Premio',
    reward_text: codeRecord.reward_text || '',
    reward_deadline: codeRecord.reward_deadline || null,
    validation_id: validationId,
    assigned_at: new Date().toISOString(),
  })

  return Response.json({
    status: 'winner',
    rewardCode: codeRecord.reward_code,
    rewardLabel: codeRecord.reward_label,
    rewardText: codeRecord.reward_text,
    deadlineMsg,
    validationId,
    timestamp: new Date().toLocaleString('es-ES'),
  })
}
