'use client'
import { useState, useRef, useEffect } from 'react'

// Paleta Chiwawa
const C = {
  turquoise: '#4ecdc4',
  salmon: '#e8896a',
  pink: '#e8547a',
  black: '#0f0f0f',
  darkCard: '#161616',
  white: '#f5f0eb',
}

function wrapText(ctx, text, maxWidth) {
  const words = text.split(' ')
  const lines = []
  let current = ''
  for (const word of words) {
    const test = current ? current + ' ' + word : word
    if (ctx.measureText(test).width > maxWidth && current) {
      lines.push(current); current = word
    } else { current = test }
  }
  if (current) lines.push(current)
  return lines
}

function downloadPrizeImage({ rewardCode, rewardLabel, rewardText, deadlineMsg, validationId, timestamp }) {
  const W = 800, PAD = 50, INNER = W - PAD * 2
  const tmpCanvas = document.createElement('canvas')
  tmpCanvas.width = W; tmpCanvas.height = 100
  const tmpCtx = tmpCanvas.getContext('2d')
  tmpCtx.font = '900 40px Georgia, serif'
  const labelLines = rewardLabel ? wrapText(tmpCtx, rewardLabel.toUpperCase(), INNER - 80) : []
  tmpCtx.font = '400 22px Georgia, serif'
  const textLines = rewardText ? wrapText(tmpCtx, rewardText, INNER - 80) : []
  tmpCtx.font = '600 20px Georgia, serif'
  const deadlineLines = deadlineMsg ? wrapText(tmpCtx, deadlineMsg, INNER - 100) : []
  const logoH = 220
  let H = 80 + logoH + 50 + 30 + 50 + 70 + 50 + 40
  H += labelLines.length * 54 + (labelLines.length > 0 ? 28 : 0)
  H += textLines.length * 32 + (textLines.length > 0 ? 28 : 0)
  H += 24 + 20 + 110 + 28
  H += deadlineLines.length * 38 + (deadlineLines.length > 0 ? 28 : 0)
  H += 28 + 28 + 36 + 60 + 80

  const canvas = document.createElement('canvas')
  canvas.width = W; canvas.height = H
  const ctx = canvas.getContext('2d')

  // Fondo negro con textura simulada
  ctx.fillStyle = '#0f0f0f'; ctx.fillRect(0, 0, W, H)

  // Degradado turquesa arriba
  const gradTop = ctx.createLinearGradient(0, 0, W, 0)
  gradTop.addColorStop(0, 'rgba(78,205,196,0.15)')
  gradTop.addColorStop(0.5, 'rgba(78,205,196,0.05)')
  gradTop.addColorStop(1, 'rgba(232,137,106,0.15)')
  ctx.fillStyle = gradTop; ctx.fillRect(0, 0, W, H * 0.4)

  // Borde turquesa
  ctx.strokeStyle = '#4ecdc4'; ctx.lineWidth = 5
  ctx.strokeRect(25, 25, W-50, H-50)
  ctx.strokeStyle = '#e8896a'; ctx.lineWidth = 2
  ctx.strokeRect(32, 32, W-64, H-64)

  // Esquinas decorativas
  const corner = (x, y, dx, dy) => {
    ctx.beginPath(); ctx.moveTo(x, y + dy * 40); ctx.lineTo(x, y); ctx.lineTo(x + dx * 40, y)
    ctx.strokeStyle = '#e8547a'; ctx.lineWidth = 3; ctx.stroke()
  }
  corner(25, 25, 1, 1); corner(W-25, 25, -1, 1)
  corner(25, H-25, 1, -1); corner(W-25, H-25, -1, -1)

  const logoImg = new window.Image()
  logoImg.onload = () => {
    const lW = 240, lH = Math.round((logoImg.height / logoImg.width) * lW)
    ctx.drawImage(logoImg, (W - lW) / 2, 60, lW, lH)

    let y = 60 + lH + 40

    // Separador decorativo
    ctx.strokeStyle = '#4ecdc444'; ctx.lineWidth = 1
    ctx.beginPath(); ctx.moveTo(100, y); ctx.lineTo(W-100, y); ctx.stroke()
    ctx.fillStyle = '#4ecdc4'; ctx.font = '400 18px serif'
    ctx.textAlign = 'center'; ctx.fillText('✦ ZONA DE PREMIOS ✦', W/2, y + 22)
    y += 50

    // Headline
    ctx.fillStyle = '#f5f0eb'; ctx.font = '900 70px "Bebas Neue", sans-serif'
    ctx.textAlign = 'center'; ctx.fillText('¿HAS GANADO?', W/2, y + 60)
    y += 80

    // Caja premio
    const boxTop = y
    let innerH = 40
    innerH += labelLines.length * 54 + (labelLines.length > 0 ? 28 : 0)
    innerH += textLines.length * 32 + (textLines.length > 0 ? 28 : 0)
    innerH += 24 + 20 + 110 + 28
    innerH += deadlineLines.length * 38 + (deadlineLines.length > 0 ? 28 : 0)
    innerH += 28 + 28 + 40 + 60

    ctx.fillStyle = '#161616'; ctx.fillRect(PAD, boxTop, INNER, innerH)
    ctx.strokeStyle = '#4ecdc4'; ctx.lineWidth = 2
    ctx.strokeRect(PAD, boxTop, INNER, innerH)
    ctx.fillStyle = '#4ecdc4'; ctx.fillRect(PAD, boxTop, INNER, 6)

    y = boxTop + 44 + 48

    // Label
    ctx.fillStyle = '#f5f0eb'; ctx.font = '900 40px Georgia, serif'; ctx.textAlign = 'center'
    for (const line of labelLines) { ctx.fillText(line, W/2, y); y += 54 }
    if (labelLines.length > 0) y += 18

    // Text
    ctx.fillStyle = '#aaaaaa'; ctx.font = 'italic 400 22px Georgia, serif'
    for (const line of textLines) { ctx.fillText(line, W/2, y); y += 32 }
    if (textLines.length > 0) y += 18

    // Código label
    ctx.fillStyle = '#e8896a'; ctx.font = '400 18px monospace'; ctx.fillText('código de canje', W/2, y); y += 24

    // Caja código
    ctx.fillStyle = '#0f0f0f'; ctx.fillRect(PAD + 40, y, INNER - 80, 100)
    ctx.strokeStyle = '#4ecdc466'; ctx.lineWidth = 1
    ctx.strokeRect(PAD + 40, y, INNER - 80, 100)
    ctx.fillStyle = '#4ecdc4'; ctx.font = '900 58px monospace'
    ctx.fillText(rewardCode, W/2, y + 70); y += 128

    // Deadline
    if (deadlineLines.length > 0) {
      const dlH = deadlineLines.length * 38 + 20
      ctx.fillStyle = '#0f0f0f'; ctx.fillRect(PAD + 40, y, INNER - 80, dlH)
      ctx.strokeStyle = '#e8547a66'; ctx.lineWidth = 1
      ctx.strokeRect(PAD + 40, y, INNER - 80, dlH)
      ctx.fillStyle = '#e8547a'; ctx.font = '600 20px Georgia, serif'
      y += 32
      for (const line of deadlineLines) { ctx.fillText(line, W/2, y); y += 38 }
      y += 18
    }

    ctx.fillStyle = '#888'; ctx.font = '400 18px monospace'
    ctx.fillText('muestra esta pantalla', W/2, y); y += 30
    ctx.fillStyle = '#e8896a'; ctx.font = '600 18px monospace'
    ctx.fillText('en el mostrador', W/2, y); y += 44

    // Pie turquesa
    ctx.fillStyle = '#4ecdc4'; ctx.fillRect(PAD, y, INNER, 54)
    ctx.fillStyle = '#0f0f0f'; ctx.font = '400 18px monospace'
    ctx.textAlign = 'left'; ctx.fillText('premio ' + validationId, PAD + 20, y + 34)
    ctx.textAlign = 'right'; ctx.fillText(timestamp, PAD + INNER - 20, y + 34)
    y += 54 + 28

    // Legal
    const legalText = 'Presenta este cupón a nuestro personal antes de pedir. Para consumir en cualquiera de nuestros locales y no acumulable a otras ofertas o descuentos.'
    ctx.fillStyle = '#555'; ctx.font = 'italic 16px serif'; ctx.textAlign = 'center'
    const legalLines = wrapText(ctx, legalText, INNER - 40)
    for (const line of legalLines) { ctx.fillText(line, W/2, y); y += 24 }

    const link = document.createElement('a')
    link.download = `premio-chiwawa-${validationId}.png`
    link.href = canvas.toDataURL('image/png')
    link.click()
  }
  logoImg.src = '/logo.png'
}

function WinnerScreen({ rewardCode, rewardLabel, rewardText, deadlineMsg, validationId, timestamp }) {
  return (
    <div style={{ textAlign: 'center', animation: 'fadeUp .5s ease' }}>
      <div style={{ fontSize: 10, letterSpacing: 5, color: C.turquoise, marginBottom: 20, textTransform: 'uppercase', fontFamily: "'Special Elite', serif" }}>
        ✦ premio válido · {timestamp} ✦
      </div>
      <div style={{ border: `2px solid ${C.turquoise}`, outline: `1px solid ${C.salmon}`, outlineOffset: 4, overflow: 'hidden', marginBottom: 4 }}>
        {/* Barra superior turquesa */}
        <div style={{ background: C.turquoise, padding: '8px 20px', display: 'flex', justifyContent: 'space-between' }}>
          <span style={{ fontSize: 11, color: C.black, fontFamily: "'Special Elite', serif", letterSpacing: 2 }}>CHIWAWA · ZONA DE PREMIOS</span>
          <span style={{ fontSize: 11, color: C.black, fontFamily: 'monospace' }}>{validationId}</span>
        </div>
        <div style={{ background: C.darkCard, padding: '28px 24px 24px', textAlign: 'center' }}>
          {rewardLabel && (
            <div style={{ fontSize: 22, fontWeight: 900, color: C.white, letterSpacing: 1, marginBottom: 10, fontFamily: "'Crimson Text', serif", textTransform: 'uppercase', lineHeight: 1.2 }}>
              {rewardLabel}
            </div>
          )}
          {rewardText && (
            <div style={{ fontSize: 12, color: '#999', letterSpacing: 1, marginBottom: 18, fontFamily: "'Crimson Text', serif", fontStyle: 'italic' }}>
              {rewardText}
            </div>
          )}
          <div style={{ fontSize: 10, letterSpacing: 5, color: C.salmon, marginBottom: 8, fontFamily: "'Special Elite', serif" }}>
            código de canje
          </div>
          <div style={{ fontSize: 32, letterSpacing: 8, color: C.turquoise, fontWeight: 900, padding: '14px 16px', border: `1px solid ${C.turquoise}44`, background: '#4ecdc410', marginBottom: 18, fontFamily: 'monospace' }}>
            {rewardCode}
          </div>
          {deadlineMsg && (
            <div style={{ fontSize: 11, color: C.pink, fontWeight: 700, background: '#e8547a10', border: `1px solid ${C.pink}44`, padding: '8px 14px', marginBottom: 16, fontFamily: "'Crimson Text', serif" }}>
              {deadlineMsg}
            </div>
          )}
          <div style={{ fontSize: 11, color: '#666', letterSpacing: 2, lineHeight: 1.8, marginBottom: 14, fontFamily: "'Special Elite', serif" }}>
            muestra esta pantalla<br />
            <span style={{ color: C.salmon, fontWeight: 700 }}>en el mostrador</span>
          </div>
          <div style={{ fontSize: 10, color: '#333', letterSpacing: 1, lineHeight: 1.7, borderTop: `1px solid #2a2a2a`, paddingTop: 14, fontStyle: 'italic', fontFamily: "'Crimson Text', serif" }}>
            Presenta este cupón a nuestro personal antes de pedir. Para consumir en cualquiera de nuestros locales y no acumulable a otras ofertas o descuentos.
          </div>
        </div>
        <div style={{ background: C.turquoise, padding: '10px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontSize: 11, color: C.black, fontFamily: 'monospace', letterSpacing: 1 }}>premio {validationId}</span>
          <span style={{ fontSize: 10, color: '#00000066' }}>{timestamp}</span>
        </div>
      </div>
      <button onClick={() => downloadPrizeImage({ rewardCode, rewardLabel, rewardText, deadlineMsg, validationId, timestamp })}
        style={{ display: 'block', width: '100%', marginTop: 14, background: C.salmon, color: '#fff', border: 'none', padding: 14, fontFamily: "'Special Elite', serif", fontSize: 13, letterSpacing: 4, cursor: 'pointer', textTransform: 'uppercase' }}>
        ↓ descargar imagen del premio
      </button>
      <div style={{ marginTop: 10, fontSize: 10, color: '#444', letterSpacing: 3, fontFamily: "'Special Elite', serif" }}>código de un solo uso</div>
    </div>
  )
}

function LoserScreen() {
  return (
    <div style={{ textAlign: 'center', animation: 'fadeUp .4s ease' }}>
      <div style={{ fontSize: 80, lineHeight: 1, marginBottom: 16, filter: 'grayscale(1) opacity(0.15)' }}>💀</div>
      <div style={{ fontSize: 28, fontWeight: 900, color: '#2a2a2a', letterSpacing: 2, fontFamily: "'Bebas Neue', sans-serif", marginBottom: 10 }}>SIN PREMIO</div>
      <div style={{ fontSize: 12, letterSpacing: 3, color: '#444', fontFamily: "'Special Elite', serif" }}>este código no tiene premio</div>
      <div style={{ fontSize: 13, color: C.salmon + '55', letterSpacing: 2, marginTop: 12, fontFamily: "'Crimson Text', serif", fontStyle: 'italic' }}>— sigue intentándolo —</div>
    </div>
  )
}

function formatWhenUsed(assignedAt) {
  if (!assignedAt) return null
  const now = new Date(), then = new Date(assignedAt)
  const diffMin = Math.floor((now - then) / 60000)
  if (diffMin < 1) return 'hace menos de un minuto'
  if (diffMin < 60) return `hace ${diffMin} min`
  const todayStart = new Date(); todayStart.setHours(0,0,0,0)
  const thenDate = new Date(then); thenDate.setHours(0,0,0,0)
  const hh = String(then.getHours()).padStart(2,'0'), mm = String(then.getMinutes()).padStart(2,'0')
  if (thenDate.getTime() === todayStart.getTime()) return `hoy a las ${hh}:${mm}`
  const dd = String(then.getDate()).padStart(2,'0'), mo = String(then.getMonth()+1).padStart(2,'0')
  return `el día ${dd}/${mo}/${then.getFullYear()} a las ${hh}:${mm}`
}

function UsedScreen({ validationId, assignedAt }) {
  const when = formatWhenUsed(assignedAt)
  return (
    <div style={{ textAlign: 'center', animation: 'fadeUp .4s ease' }}>
      <div style={{ fontSize: 36, marginBottom: 14 }}>🔒</div>
      <div style={{ fontSize: 16, fontWeight: 900, color: C.salmon, letterSpacing: 2, marginBottom: 14, fontFamily: "'Bebas Neue', sans-serif" }}>CÓDIGO YA CANJEADO</div>
      {when && <div style={{ fontSize: 12, color: '#888', letterSpacing: 1, marginBottom: 8, background: '#1a1a1a', border: '1px solid #2a2a2a', padding: '10px 16px', fontFamily: "'Special Elite', serif" }}>canjeado {when}</div>}
      {validationId && <div style={{ fontSize: 10, color: '#444', marginTop: 8, letterSpacing: 2 }}>{validationId}</div>}
      <div style={{ fontSize: 10, color: '#555', marginTop: 14, letterSpacing: 2, fontFamily: "'Special Elite', serif" }}>cada código solo puede usarse una vez</div>
    </div>
  )
}

export default function WinPage() {
  const [code, setCode] = useState('')
  const [result, setResult] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [visits, setVisits] = useState(null)
  const inputRef = useRef()

  useEffect(() => {
    fetch('/api/visits', { method: 'POST' })
    fetch('/api/visits').then(r => r.json()).then(d => setVisits(d.visits))
  }, [])

  const handleSubmit = async () => {
    if (!code.trim() || loading) return
    setLoading(true); setError(''); setResult(null)
    try {
      const res = await fetch('/api/validate', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ code }) })
      setResult(await res.json())
    } catch { setError('Error de conexión. Inténtalo de nuevo.') }
    finally { setLoading(false) }
  }

  const handleReset = () => { setResult(null); setError(''); setCode(''); setTimeout(() => inputRef.current?.focus(), 100) }

  return (
    <>
      <style>{`
        @keyframes fadeUp { from { opacity:0; transform:translateY(14px); } to { opacity:1; transform:translateY(0); } }
        @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:.4} }
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { background: #0f0f0f; }
      `}</style>
      <div style={{
        minHeight: '100vh',
        background: `
          radial-gradient(ellipse 60% 30% at 0% 0%, #4ecdc422 0%, transparent 60%),
          radial-gradient(ellipse 60% 30% at 100% 100%, #e8896a22 0%, transparent 60%),
          #0f0f0f`,
        display: 'flex', flexDirection: 'column', alignItems: 'center',
        padding: '0 20px 80px',
        fontFamily: "'Special Elite', serif",
      }}>

        {/* Logo */}
        <div style={{ textAlign: 'center', padding: '36px 0 20px' }}>
          <img src="/logo.png" alt="Chiwawa" style={{ width: 180, maxWidth: '70%', filter: 'drop-shadow(0 4px 20px rgba(78,205,196,0.3))' }} />
        </div>

        <div style={{ width: '100%', maxWidth: 400 }}>

          {/* Eyebrow */}
          <div style={{ textAlign: 'center', marginBottom: 8 }}>
            <span style={{ fontSize: 10, letterSpacing: 5, color: C.turquoise }}>✦ zona de premios ✦</span>
          </div>
          {visits !== null && (
            <div style={{ textAlign: 'center', marginBottom: 14, fontSize: 9, letterSpacing: 3, color: '#2a2a2a' }}>
              {visits.toLocaleString('es-ES')} visitas
            </div>
          )}

          {/* Headline */}
          <div style={{ fontSize: 52, color: C.white, textAlign: 'center', lineHeight: 1, letterSpacing: 2, marginBottom: 28, fontFamily: "'Bebas Neue', sans-serif" }}>
            ¿HAS GANADO?
          </div>

          {/* Formulario */}
          {!result && (
            <div style={{ animation: 'fadeUp .6s ease' }}>
              <div style={{ background: C.darkCard, border: `1px solid #2a2a2a`, borderTop: `4px solid ${C.turquoise}`, padding: '28px 24px 24px', marginBottom: 12 }}>
                <div style={{ fontSize: 10, letterSpacing: 5, color: '#555', textAlign: 'center', marginBottom: 16 }}>
                  introduce tu código (10 caracteres)
                </div>
                <input
                  ref={inputRef}
                  value={code}
                  onChange={e => setCode(e.target.value.replace(/[^A-Z0-9]/gi,'').toUpperCase().slice(0,10))}
                  onKeyDown={e => e.key === 'Enter' && handleSubmit()}
                  placeholder="··········"
                  maxLength={10}
                  autoFocus autoComplete="off" spellCheck="false"
                  style={{ display: 'block', width: '100%', background: 'transparent', border: 'none', borderBottom: `2px solid #2a2a2a`, color: C.turquoise, fontFamily: 'monospace', fontSize: 32, fontWeight: 900, letterSpacing: 8, textAlign: 'center', textTransform: 'uppercase', padding: '6px 0 12px', outline: 'none', caretColor: C.turquoise, marginBottom: 8 }}
                />
                <div style={{ fontSize: 10, color: '#333', textAlign: 'center', letterSpacing: 2, marginBottom: 20 }}>{code.length}/10</div>
                <button onClick={handleSubmit} disabled={loading || code.length !== 10}
                  style={{ display: 'block', width: '100%', background: (loading || code.length !== 10) ? '#2a2a2a' : C.turquoise, color: (loading || code.length !== 10) ? '#555' : C.black, border: 'none', padding: 16, fontFamily: "'Bebas Neue', sans-serif", fontSize: 18, letterSpacing: 6, cursor: (loading || code.length !== 10) ? 'default' : 'pointer' }}>
                  {loading ? <span style={{ animation: 'pulse 1s infinite' }}>VERIFICANDO</span> : 'VALIDAR CÓDIGO →'}
                </button>
              </div>
              {error && <div style={{ fontSize: 12, color: C.salmon, textAlign: 'center', marginTop: 10 }}>{error}</div>}
              <div style={{ textAlign: 'center', marginTop: 20, fontSize: 10, letterSpacing: 3, color: '#333' }}>cada código solo puede usarse una vez</div>
            </div>
          )}

          {/* Resultado */}
          {result && (
            <div style={{ animation: 'fadeUp .5s ease' }}>
              {result.status === 'invalid' && (
                <div style={{ background: C.darkCard, border: '1px solid #2a2a2a', borderTop: `4px solid ${C.salmon}`, padding: '28px 24px', textAlign: 'center' }}>
                  <div style={{ fontSize: 40, color: '#222', marginBottom: 14 }}>⚠</div>
                  <div style={{ fontSize: 20, color: C.salmon, letterSpacing: 2, fontFamily: "'Bebas Neue', sans-serif" }}>CÓDIGO NO RECONOCIDO</div>
                </div>
              )}
              {result.status === 'loser' && <div style={{ background: C.darkCard, border: '1px solid #2a2a2a', borderTop: `4px solid #2a2a2a`, padding: '28px 24px' }}><LoserScreen /></div>}
              {result.status === 'used' && <div style={{ background: C.darkCard, border: '1px solid #2a2a2a', borderTop: `4px solid ${C.salmon}`, padding: '28px 24px' }}><UsedScreen validationId={result.validationId} assignedAt={result.assignedAt} /></div>}
              {result.status === 'winner' && <WinnerScreen rewardCode={result.rewardCode} rewardLabel={result.rewardLabel} rewardText={result.rewardText} deadlineMsg={result.deadlineMsg} validationId={result.validationId} timestamp={result.timestamp} />}
              <button onClick={handleReset} style={{ display: 'block', width: '100%', background: 'transparent', color: '#444', border: '1px solid #222', padding: 12, fontFamily: "'Special Elite', serif", fontSize: 11, letterSpacing: 4, cursor: 'pointer', marginTop: 14 }}>
                ← probar otro código
              </button>
            </div>
          )}
        </div>
      </div>
    </>
  )
}
