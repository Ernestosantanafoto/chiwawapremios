'use client'
import { useState, useEffect, useCallback } from 'react'

function basicAuth(user, pass) {
  return 'Basic ' + btoa(`${user}:${pass}`)
}

const S = {
  label: { fontSize: 10, letterSpacing: 4, color: '#555', textTransform: 'uppercase', marginBottom: 6, display: 'block' },
  input: { background: '#111', border: '1px solid #222', borderRadius: 6, color: '#ddd', fontFamily: "'DM Mono',monospace", fontSize: 13, padding: '9px 12px', width: '100%', outline: 'none' },
  btn: (c='#c8ff00') => ({ background: c, color: c==='#c8ff00'?'#000':'#fff', border: 'none', borderRadius: 6, padding: '10px 18px', fontFamily: "'DM Mono',monospace", fontSize: 11, letterSpacing: 3, cursor: 'pointer', textTransform: 'uppercase' }),
  card: { background: '#0f0f0f', border: '1px solid #1a1a1a', borderRadius: 12, padding: 20, marginBottom: 14 },
  hint: { fontSize: 10, color: '#444', letterSpacing: 1, marginTop: 5 },
}

function LoginScreen({ onLogin }) {
  const [user, setUser] = useState('')
  const [pass, setPass] = useState('')
  const [err, setErr] = useState('')

  const handleLogin = async () => {
    setErr('')
    const res = await fetch('/api/admin/codes', { headers: { Authorization: basicAuth(user, pass) } })
    if (res.ok) { onLogin(basicAuth(user, pass), user) } else { setErr('Credenciales incorrectas') }
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#080808', fontFamily: "'DM Mono',monospace" }}>
      <div style={{ ...S.card, width: '100%', maxWidth: 320, padding: 32 }}>
        <div style={{ fontSize: 10, letterSpacing: 5, color: '#444', marginBottom: 24, textAlign: 'center' }}>PANEL ADMIN</div>
        <div style={{ marginBottom: 14 }}><span style={S.label}>Usuario</span><input style={S.input} value={user} onChange={e=>setUser(e.target.value)} onKeyDown={e=>e.key==='Enter'&&handleLogin()} autoFocus /></div>
        <div style={{ marginBottom: 20 }}><span style={S.label}>Contraseña</span><input style={S.input} type="password" value={pass} onChange={e=>setPass(e.target.value)} onKeyDown={e=>e.key==='Enter'&&handleLogin()} /></div>
        {err && <div style={{ fontSize: 11, color: '#ff6b35', marginBottom: 14 }}>{err}</div>}
        <button style={{ ...S.btn(), width: '100%' }} onClick={handleLogin}>Entrar →</button>
      </div>
    </div>
  )
}

export default function AdminPage() {
  const [auth, setAuth] = useState(null)
  const [currentUser, setCurrentUser] = useState('')
  const [visits, setVisits] = useState(null)
  const [codes, setCodes] = useState([])
  const [loading, setLoading] = useState(false)
  const [msg, setMsg] = useState({ text: '', type: 'ok' })

  // Nuevo código
  const [newCode, setNewCode] = useState('')
  const [newWinner, setNewWinner] = useState(false)
  const [newRewardCode, setNewRewardCode] = useState('')
  const [newRewardLabel, setNewRewardLabel] = useState('')
  const [newRewardText, setNewRewardText] = useState('')
  const [newDeadline, setNewDeadline] = useState('')

  // Edición
  const [editId, setEditId] = useState(null)
  const [editCode, setEditCode] = useState('')
  const [editWinner, setEditWinner] = useState(false)
  const [editRewardCode, setEditRewardCode] = useState('')
  const [editRewardLabel, setEditRewardLabel] = useState('')
  const [editRewardText, setEditRewardText] = useState('')
  const [editDeadline, setEditDeadline] = useState('')

  const [filter, setFilter] = useState('all')
  const [csvPreview, setCsvPreview] = useState(null)  // { rows, errors }
  const [csvImporting, setCsvImporting] = useState(false)

  const fetchCodes = useCallback(async (token) => {
    setLoading(true)
    const res = await fetch('/api/admin/codes', { headers: { Authorization: token } })
    const data = await res.json()
    setCodes(data.codes || [])
    setLoading(false)
  }, [])

  useEffect(() => {
    if (auth) {
      fetchCodes(auth)
      fetch('/api/visits').then(r => r.json()).then(d => setVisits(d.visits))
    }
  }, [auth, fetchCodes])

  const flash = (text, type='ok') => { setMsg({ text, type }); setTimeout(() => setMsg({ text:'', type:'ok' }), 3500) }

  const handleCreate = async () => {
    const c = newCode.trim().toUpperCase()
    if (!/^[A-Z0-9]{10}$/.test(c)) return flash('El código público debe tener exactamente 10 caracteres alfanuméricos (letras y números)', 'err')
    if (newWinner) {
      const rc = newRewardCode.trim().toUpperCase()
      if (!/^[A-Z]{8}$/.test(rc)) return flash('El código de premio debe tener exactamente 8 letras mayúsculas', 'err')
      if (!newRewardLabel.trim()) return flash('El texto del premio no puede estar vacío', 'err')
      if (!newDeadline) return flash('Debes indicar una fecha límite de canje', 'err')
    }
    const body = {
      code: c, is_winner: newWinner,
      reward_code: newRewardCode.trim().toUpperCase(),
      reward_label: newRewardLabel.trim(),
      reward_text: newRewardText.trim(),
      reward_deadline: newDeadline || null,
    }
    const res = await fetch('/api/admin/codes', { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: auth }, body: JSON.stringify(body) })
    const data = await res.json()
    if (data.error) return flash(data.error, 'err')
    setNewCode(''); setNewWinner(false); setNewRewardCode(''); setNewRewardLabel(''); setNewRewardText(''); setNewDeadline('')
    flash('Código creado ✓')
    fetchCodes(auth)
  }

  const handleSaveEdit = async (id) => {
    const c = editCode.trim().toUpperCase()
    if (!/^[A-Z0-9]{10}$/.test(c)) return flash('El código público debe tener exactamente 10 caracteres alfanuméricos', 'err')
    if (editWinner) {
      const rc = editRewardCode.trim().toUpperCase()
      if (!/^[A-Z]{8}$/.test(rc)) return flash('El código de premio debe tener exactamente 8 letras mayúsculas', 'err')
      if (!editRewardLabel.trim()) return flash('El texto del premio no puede estar vacío', 'err')
      if (!editDeadline) return flash('Debes indicar una fecha límite de canje', 'err')
    }
    const res = await fetch('/api/admin/codes', {
      method: 'PATCH', headers: { 'Content-Type': 'application/json', Authorization: auth },
      body: JSON.stringify({ id, code: c, is_winner: editWinner, reward_code: editRewardCode.trim().toUpperCase(), reward_label: editRewardLabel.trim(), reward_text: editRewardText.trim(), reward_deadline: editDeadline || null }),
    })
    const data = await res.json()
    if (data.error) return flash(data.error, 'err')
    setEditId(null); flash('Guardado ✓'); fetchCodes(auth)
  }

  const handleDelete = async (id, code) => {
    if (!confirm(`¿Eliminar "${code}"?`)) return
    const res = await fetch(`/api/admin/codes?id=${id}`, { method: 'DELETE', headers: { Authorization: auth } })
    const data = await res.json()
    if (data.error) return flash(data.error, 'err')
    flash('Eliminado ✓'); fetchCodes(auth)
  }

  const handleCSVFile = (e) => {
    const file = e.target.files[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = (ev) => {
      const text = ev.target.result
      const lines = text.split(/\r?\n/).filter(l => l.trim())
      if (lines.length < 2) return setCsvPreview({ rows: [], errors: ['El archivo está vacío o no tiene datos'] })
      // Skip header line
      const dataLines = lines.slice(1)
      const rows = []
      const errors = []
      dataLines.forEach((line, i) => {
        // Parse CSV respetando comas dentro de comillas
        const cols = line.match(/(".*?"|[^,]+|(?<=,)(?=,)|^(?=,)|(?<=,)$)/g) || []
        const clean = cols.map(c => c.replace(/^"|"$/g, '').trim())
        const [code, is_winner, reward_code, reward_label, reward_text, reward_deadline] = clean
        const rowNum = i + 2
        if (!code) return errors.push(`Fila ${rowNum}: código vacío`)
        const c = code.toUpperCase()
        if (!/^[A-Z0-9]{10}$/.test(c)) return errors.push(`Fila ${rowNum}: "${c}" no tiene 10 caracteres alfanuméricos`)
        const winner = is_winner?.toLowerCase() === 'true'
        if (winner) {
          const rc = (reward_code || '').trim().toUpperCase()
          if (!/^[A-Z]{8}$/.test(rc)) return errors.push(`Fila ${rowNum}: código de premio "${rc}" debe tener 8 letras mayúsculas`)
          if (!reward_label?.trim()) return errors.push(`Fila ${rowNum}: falta el texto del premio`)
          if (!reward_deadline?.trim()) return errors.push(`Fila ${rowNum}: falta la fecha límite`)
        }
        rows.push({ code: c, is_winner: winner, reward_code: (reward_code||'').toUpperCase().trim(), reward_label: (reward_label||'').trim(), reward_text: (reward_text||'').trim(), reward_deadline: reward_deadline?.trim() || null })
      })
      setCsvPreview({ rows, errors })
    }
    reader.readAsText(file)
    e.target.value = ''
  }

  const handleCSVImport = async () => {
    if (!csvPreview?.rows?.length) return
    setCsvImporting(true)
    // Split in batches of 20
    const batches = []
    for (let i = 0; i < csvPreview.rows.length; i += 20) batches.push(csvPreview.rows.slice(i, i + 20))
    let totalOk = 0, totalErr = 0
    for (const batch of batches) {
      const res = await fetch('/api/admin/codes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: auth },
        body: JSON.stringify(batch),
      })
      const data = await res.json()
      if (data.error) totalErr += batch.length
      else totalOk += data.created?.length || 0
    }
    setCsvImporting(false)
    setCsvPreview(null)
    flash(`Importados ${totalOk} códigos${totalErr > 0 ? ` · ${totalErr} errores` : ''} ✓`)
    fetchCodes(auth)
  }

  if (!auth) return <LoginScreen onLogin={(token, user) => { setAuth(token); setCurrentUser(user) }} />

  const filtered = codes.filter(c =>
    filter==='all' ? true :
    filter==='winner' ? c.is_winner && !c.used :
    filter==='used' ? c.used :
    !c.is_winner && !c.used
  )
  const stats = {
    total: codes.length,
    winners: codes.filter(c=>c.is_winner&&!c.used).length,
    used: codes.filter(c=>c.used).length,
    losers: codes.filter(c=>!c.is_winner&&!c.used).length,
  }

  return (
    <>
      <style>{`
        *{box-sizing:border-box;margin:0;padding:0}
        body{background:#080808;color:#ddd;font-family:'DM Mono',monospace}
        input,select{transition:border-color .2s}
        input:focus,select:focus{border-color:#c8ff00!important;outline:none}
        table{border-collapse:collapse;width:100%;font-size:12px}
        th{font-weight:400;color:#444;font-size:9px;letter-spacing:3px;text-transform:uppercase;padding:8px 10px;text-align:left;border-bottom:1px solid #1a1a1a;white-space:nowrap}
        td{padding:10px;border-bottom:1px solid #111;vertical-align:top}
        tr:hover td{background:#0a0a0a}
        .pill{display:inline-block;padding:2px 8px;border-radius:4px;font-size:9px;letter-spacing:2px;border:1px solid}
        .pill-green{color:#c8ff00;border-color:#c8ff0033}
        .pill-red{color:#ff6b35;border-color:#ff6b3533}
        .pill-gray{color:#444;border-color:#2a2a2a}
        .fb{background:none;border:1px solid #1a1a1a;color:#444;padding:5px 12px;border-radius:5px;cursor:pointer;font-family:monospace;font-size:10px;letter-spacing:2px}
        .fb.active{border-color:#c8ff0044;color:#c8ff00;background:#c8ff0008}
        .ib{background:none;border:1px solid #1a1a1a;color:#555;padding:4px 9px;border-radius:5px;cursor:pointer;font-family:monospace;font-size:10px}
        .ib:hover{border-color:#333;color:#aaa}
        .db{background:none;border:1px solid #ff6b3522;color:#ff6b3566;padding:4px 9px;border-radius:5px;cursor:pointer;font-size:10px}
        .db:hover{border-color:#ff6b3588;color:#ff6b35}
        .edit-input{background:#111;border:1px solid #333;border-radius:4px;color:#ddd;font-family:monospace;font-size:11px;padding:5px 8px;width:100%;outline:none}
      `}</style>

      <div style={{ minHeight: '100vh', padding: '28px 20px', maxWidth: 1000, margin: '0 auto' }}>

        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
          <div>
            <div style={{ fontSize: 9, letterSpacing: 5, color: '#444' }}>
              PANEL ADMIN · <span style={{ color: '#c8ff00' }}>{currentUser}</span>
              {visits !== null && <span style={{ color: '#444', marginLeft: 12 }}>· {visits.toLocaleString('es-ES')} visitas /win</span>}
            </div>
            <div style={{ fontSize: 20, color: '#fff', fontWeight: 300, marginTop: 4 }}>Gestión de códigos</div>
          </div>
          {msg.text && (
            <div style={{ fontSize: 11, color: msg.type==='err' ? '#ff6b35' : '#c8ff00', border: `1px solid ${msg.type==='err'?'#ff6b3533':'#c8ff0033'}`, padding: '7px 14px', borderRadius: 6 }}>
              {msg.text}
            </div>
          )}
        </div>

        {/* Stats */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 10, marginBottom: 24 }}>
          {[
            { label: 'Total', value: stats.total, color: '#888' },
            { label: 'Ganadores disponibles', value: stats.winners, color: '#c8ff00' },
            { label: 'Usados', value: stats.used, color: '#ff6b35' },
            { label: 'No ganadores', value: stats.losers, color: '#444' },
          ].map(s => (
            <div key={s.label} style={{ ...S.card, padding: 16, textAlign: 'center', marginBottom: 0 }}>
              <div style={{ fontSize: 26, color: s.color, fontWeight: 500 }}>{s.value}</div>
              <div style={{ fontSize: 9, color: '#444', letterSpacing: 2, marginTop: 4 }}>{s.label.toUpperCase()}</div>
            </div>
          ))}
        </div>

        {/* Crear código */}
        <div style={{ ...S.card, marginBottom: 20 }}>
          <div style={{ fontSize: 9, letterSpacing: 4, color: '#555', marginBottom: 14, textTransform: 'uppercase' }}>Crear nuevo código</div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: 10, alignItems: 'end', marginBottom: 14 }}>
            <div>
              <span style={S.label}>Código público (10 caracteres: letras y números)</span>
              <input style={{ ...S.input, textTransform: 'uppercase', letterSpacing: 4, fontSize: 15 }}
                placeholder="PREMIOS123" value={newCode} maxLength={10}
                onChange={e=>setNewCode(e.target.value.replace(/[^A-Z0-9]/gi,'').toUpperCase())}
                onKeyDown={e=>e.key==='Enter'&&handleCreate()} />
              <div style={S.hint}>Exactamente 10 caracteres — letras mayúsculas y/o números</div>
            </div>
            <label style={{ display:'flex',alignItems:'center',gap:8,cursor:'pointer',fontSize:12,color:'#888',paddingBottom:22,whiteSpace:'nowrap' }}>
              <input type="checkbox" checked={newWinner} onChange={e=>setNewWinner(e.target.checked)} style={{ accentColor:'#c8ff00',width:16,height:16 }} />
              Es ganador
            </label>
          </div>

          {newWinner && (
            <div style={{ borderTop: '1px solid #1a1a1a', paddingTop: 14, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div>
                <span style={S.label}>Código de premio (8 letras mayúsculas)</span>
                <input style={{ ...S.input, textTransform: 'uppercase', letterSpacing: 4, fontSize: 15 }}
                  placeholder="BURGERFR" value={newRewardCode} maxLength={8}
                  onChange={e=>setNewRewardCode(e.target.value.replace(/[^A-Z]/gi,'').toUpperCase())} />
                <div style={S.hint}>Exactamente 8 letras — sin números</div>
              </div>
              <div>
                <span style={S.label}>Texto del premio (qué gana)</span>
                <input style={S.input} placeholder="Burger gratis" value={newRewardLabel}
                  onChange={e=>setNewRewardLabel(e.target.value)} />
              </div>
              <div>
                <span style={S.label}>Descripción adicional (opcional)</span>
                <input style={S.input} placeholder="Válido en cualquier local" value={newRewardText}
                  onChange={e=>setNewRewardText(e.target.value)} />
              </div>
              <div>
                <span style={S.label}>Fecha límite de canje</span>
                <input style={S.input} type="date" value={newDeadline}
                  onChange={e=>setNewDeadline(e.target.value)} />
                <div style={S.hint}>Se mostrará "Tienes hasta el DD/MM/AAAA para canjearlo"</div>
              </div>
            </div>
          )}

          <div style={{ marginTop: 16 }}>
            <button style={S.btn()} onClick={handleCreate}>+ Crear código</button>
          </div>
        </div>

        {/* Importar CSV */}
        <div style={{ ...S.card, marginBottom: 20, borderColor: '#1a2a1a' }}>
          <div style={{ fontSize: 9, letterSpacing: 4, color: '#555', marginBottom: 14, textTransform: 'uppercase' }}>Importar códigos desde CSV</div>
          <div style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap', marginBottom: 10 }}>
            <label style={{ ...S.btn('#1a1a1a'), border: '1px solid #333', color: '#aaa', cursor: 'pointer', display: 'inline-block' }}>
              📂 Seleccionar archivo CSV
              <input type="file" accept=".csv" onChange={handleCSVFile} style={{ display: 'none' }} />
            </label>
            <a href="data:text/csv;charset=utf-8,code%2Cis_winner%2Creward_code%2Creward_label%2Creward_text%2Creward_deadline%0APREMIOS123%2Cfalse%2C%2C%2C%2C%0ABURGER2025%2Ctrue%2CBURGERFR%2CBurger%20gratis%2CVálido%20en%20cualquier%20local%2C2025-12-31"
              download="plantilla-codigos.csv"
              style={{ ...S.btn('#111'), border: '1px solid #222', color: '#555', textDecoration: 'none', display: 'inline-block', fontSize: 10 }}>
              ↓ Descargar plantilla
            </a>
          </div>
          <div style={{ fontSize: 10, color: '#444', letterSpacing: 1, lineHeight: 1.8 }}>
            Formato: <span style={{ color: '#666' }}>code, is_winner, reward_code, reward_label, reward_text, reward_deadline</span>
          </div>

          {/* Preview */}
          {csvPreview && (
            <div style={{ marginTop: 16, borderTop: '1px solid #1a1a1a', paddingTop: 16 }}>
              {csvPreview.errors.length > 0 && (
                <div style={{ marginBottom: 12 }}>
                  <div style={{ fontSize: 10, color: '#ff6b35', letterSpacing: 2, marginBottom: 8 }}>ERRORES DETECTADOS</div>
                  {csvPreview.errors.map((e, i) => <div key={i} style={{ fontSize: 11, color: '#ff6b3588', marginBottom: 4 }}>⚠ {e}</div>)}
                </div>
              )}
              {csvPreview.rows.length > 0 && (
                <div>
                  <div style={{ display: 'flex', gap: 16, marginBottom: 12, flexWrap: 'wrap' }}>
                    <span style={{ fontSize: 11, color: '#888' }}>Total: <strong style={{ color: '#fff' }}>{csvPreview.rows.length}</strong></span>
                    <span style={{ fontSize: 11, color: '#c8ff00' }}>Ganadores: <strong>{csvPreview.rows.filter(r=>r.is_winner).length}</strong></span>
                    <span style={{ fontSize: 11, color: '#444' }}>No ganadores: <strong style={{ color: '#666' }}>{csvPreview.rows.filter(r=>!r.is_winner).length}</strong></span>
                  </div>
                  <div style={{ maxHeight: 180, overflowY: 'auto', marginBottom: 12, border: '1px solid #1a1a1a', borderRadius: 6 }}>
                    <table style={{ width: '100%', fontSize: 11 }}>
                      <thead><tr style={{ background: '#111' }}>
                        <th style={{ padding: '6px 10px', color: '#555', textAlign: 'left', fontWeight: 400 }}>Código</th>
                        <th style={{ padding: '6px 10px', color: '#555', textAlign: 'left', fontWeight: 400 }}>Tipo</th>
                        <th style={{ padding: '6px 10px', color: '#555', textAlign: 'left', fontWeight: 400 }}>Premio</th>
                        <th style={{ padding: '6px 10px', color: '#555', textAlign: 'left', fontWeight: 400 }}>Fecha límite</th>
                      </tr></thead>
                      <tbody>
                        {csvPreview.rows.map((r, i) => (
                          <tr key={i} style={{ borderTop: '1px solid #111' }}>
                            <td style={{ padding: '5px 10px', letterSpacing: 3, color: '#c8ff00' }}>{r.code}</td>
                            <td style={{ padding: '5px 10px' }}>{r.is_winner ? <span style={{ color: '#c8ff00', fontSize: 9 }}>GANADOR</span> : <span style={{ color: '#444', fontSize: 9 }}>NO GANADOR</span>}</td>
                            <td style={{ padding: '5px 10px', color: '#888' }}>{r.reward_label || '—'}</td>
                            <td style={{ padding: '5px 10px', color: '#555', fontSize: 10 }}>{r.reward_deadline || '—'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  <div style={{ display: 'flex', gap: 10 }}>
                    <button style={S.btn()} onClick={handleCSVImport} disabled={csvImporting}>
                      {csvImporting ? 'Importando...' : `↑ Importar ${csvPreview.rows.length} códigos`}
                    </button>
                    <button style={{ ...S.btn('#1a1a1a'), border: '1px solid #333', color: '#666' }} onClick={() => setCsvPreview(null)}>
                      Cancelar
                    </button>
                  </div>
                </div>
              )}
              {csvPreview.rows.length === 0 && csvPreview.errors.length > 0 && (
                <button style={{ ...S.btn('#1a1a1a'), border: '1px solid #333', color: '#666', marginTop: 8 }} onClick={() => setCsvPreview(null)}>Cerrar</button>
              )}
            </div>
          )}
        </div>

        {/* Filtros */}
        <div style={{ display: 'flex', gap: 6, marginBottom: 14, flexWrap: 'wrap' }}>
          {[{id:'all',label:'Todos'},{id:'winner',label:'Ganadores'},{id:'used',label:'Usados'},{id:'loser',label:'No ganadores'}].map(f=>(
            <button key={f.id} className={`fb ${filter===f.id?'active':''}`} onClick={()=>setFilter(f.id)}>{f.label}</button>
          ))}
          <button className="ib" onClick={()=>fetchCodes(auth)}>↻ Recargar</button>
        </div>

        {/* Tabla */}
        <div style={{ ...S.card, padding: 0, overflow: 'hidden' }}>
          {loading ? (
            <div style={{ padding: 28, textAlign: 'center', color: '#444', fontSize: 11 }}>Cargando...</div>
          ) : filtered.length === 0 ? (
            <div style={{ padding: 28, textAlign: 'center', color: '#333', fontSize: 11 }}>Sin resultados</div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table>
                <thead>
                  <tr>
                    <th>Código público</th>
                    <th>Estado</th>
                    <th>Premio</th>
                    <th>Cód. premio</th>
                    <th>Fecha límite</th>
                    <th>Canjeado</th>
                    <th>Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map(c => (
                    <tr key={c.id}>
                      {/* Código público */}
                      <td>
                        {editId===c.id
                          ? <input className="edit-input" style={{ letterSpacing: 3 }} value={editCode} onChange={e=>setEditCode(e.target.value.replace(/[^A-Z0-9]/gi,'').toUpperCase())} maxLength={10} />
                          : <span style={{ letterSpacing: 3, color: '#c8ff00', fontSize: 13 }}>{c.code}</span>}
                      </td>

                      {/* Estado */}
                      <td>
                        {editId===c.id
                          ? <label style={{ display:'flex',alignItems:'center',gap:6,cursor:'pointer',fontSize:11,color:'#888' }}><input type="checkbox" checked={editWinner} onChange={e=>setEditWinner(e.target.checked)} style={{ accentColor:'#c8ff00' }} /> Ganador</label>
                          : c.used ? <span className="pill pill-red">USADO</span>
                          : c.is_winner ? <span className="pill pill-green">GANADOR</span>
                          : <span className="pill pill-gray">NO GANADOR</span>}
                      </td>

                      {/* Premio */}
                      <td style={{ color: '#888', fontSize: 11 }}>
                        {editId===c.id
                          ? <input className="edit-input" placeholder="Burger gratis" value={editRewardLabel} onChange={e=>setEditRewardLabel(e.target.value)} />
                          : c.reward_label || '—'}
                      </td>

                      {/* Código premio */}
                      <td>
                        {editId===c.id
                          ? <input className="edit-input" style={{ letterSpacing: 3 }} placeholder="BURGERFR" value={editRewardCode} onChange={e=>setEditRewardCode(e.target.value.replace(/[^A-Z]/gi,'').toUpperCase())} maxLength={8} />
                          : c.reward_code
                            ? <span style={{ fontFamily:'monospace',letterSpacing:3,color:'#aaa',fontSize:12 }}>{c.reward_code}</span>
                            : <span style={{ color:'#333' }}>—</span>}
                      </td>

                      {/* Fecha límite */}
                      <td style={{ color: '#888', fontSize: 11 }}>
                        {editId===c.id
                          ? <input className="edit-input" type="date" value={editDeadline} onChange={e=>setEditDeadline(e.target.value)} />
                          : c.reward_deadline
                            ? new Date(c.reward_deadline+'T00:00:00').toLocaleDateString('es-ES')
                            : <span style={{ color:'#333' }}>—</span>}
                      </td>

                      {/* Creado por */}
                      <td style={{ color: '#666', fontSize: 11, letterSpacing: 1 }}>
                        {c.created_by || <span style={{ color:'#333' }}>—</span>}
                      </td>

                      {/* Canjeado */}
                      <td style={{ color: '#444', fontSize: 10 }}>
                        {c.used_at ? c.used_at.slice(0,16).replace('T',' ') : '—'}
                      </td>

                      {/* Acciones */}
                      <td>
                        <div style={{ display:'flex',gap:5 }}>
                          {editId===c.id ? (
                            <>
                              <button className="ib" style={{ color:'#c8ff00',borderColor:'#c8ff0033' }} onClick={()=>handleSaveEdit(c.id)}>✓</button>
                              <button className="ib" onClick={()=>setEditId(null)}>✕</button>
                            </>
                          ) : (
                            <>
                              {!c.used && (
                                <button className="ib" onClick={()=>{
                                  setEditId(c.id); setEditCode(c.code); setEditWinner(c.is_winner)
                                  setEditRewardCode(c.reward_code||''); setEditRewardLabel(c.reward_label||'')
                                  setEditRewardText(c.reward_text||''); setEditDeadline(c.reward_deadline||'')
                                }}>Editar</button>
                              )}
                              {!c.used && <button className="db" onClick={()=>handleDelete(c.id,c.code)}>✕</button>}
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <div style={{ marginTop: 20, fontSize: 10, color: '#333', textAlign: 'center' }}>
          Página pública: <a href="/win" target="_blank" style={{ color:'#555',textDecoration:'underline' }}>/win</a>
        </div>
      </div>
    </>
  )
}
