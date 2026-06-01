'use client'
import { useState, useRef, useEffect } from 'react'

const C = {
  pink: '#e8547a',
  darkPink: '#c43460',
  black: '#1a0a0a',
  white: '#fff8f0',
  turquoise: '#4ecdc4',
  salmon: '#e8896a',
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
  const W = 800, PAD = 60, INNER = W - PAD * 2
  const tmpCanvas = document.createElement('canvas')
  tmpCanvas.width = W; tmpCanvas.height = 100
  const tmpCtx = tmpCanvas.getContext('2d')
  tmpCtx.font = 'bold 40px Georgia, serif'
  const labelLines = rewardLabel ? wrapText(tmpCtx, rewardLabel.toUpperCase(), INNER - 80) : []
  tmpCtx.font = 'italic 22px Georgia, serif'
  const textLines = rewardText ? wrapText(tmpCtx, rewardText, INNER - 80) : []
  tmpCtx.font = '600 20px Georgia, serif'
  const deadlineLines = deadlineMsg ? wrapText(tmpCtx, deadlineMsg, INNER - 100) : []

  const logoH = 200
  let H = 80 + logoH + 50 + 80 + 50 + 40
  H += labelLines.length * 54 + (labelLines.length > 0 ? 24 : 0)
  H += textLines.length * 32 + (textLines.length > 0 ? 24 : 0)
  H += 24 + 20 + 110 + 24
  H += deadlineLines.length * 38 + (deadlineLines.length > 0 ? 24 : 0)
  H += 28 + 28 + 36 + 60 + 80

  const canvas = document.createElement('canvas')
  canvas.width = W; canvas.height = H
  const ctx = canvas.getContext('2d')

  const bgImg = new window.Image()
  bgImg.onload = () => {
    // Fondo de papel rosa
    ctx.drawImage(bgImg, 0, 0, W, H)

    // Overlay para oscurecer ligeramente
    ctx.fillStyle = 'rgba(0,0,0,0.08)'
    ctx.fillRect(0, 0, W, H)

    // Borde negro doble
    ctx.strokeStyle = C.black; ctx.lineWidth = 4
    ctx.strokeRect(24, 24, W-48, H-48)
    ctx.strokeStyle = C.black; ctx.lineWidth = 1.5
    ctx.strokeRect(32, 32, W-64, H-64)

    const logoImg = new window.Image()
    logoImg.onload = () => {
      const lW = 260, lH = Math.round((logoImg.height / logoImg.width) * lW)
      ctx.drawImage(logoImg, (W - lW) / 2, 60, lW, lH)

      let y = 60 + lH + 36

      // Separador con calavera
      ctx.strokeStyle = C.black + '88'; ctx.lineWidth = 1
      ctx.beginPath(); ctx.moveTo(100, y); ctx.lineTo(W-100, y); ctx.stroke()
      ctx.fillStyle = C.black; ctx.font = 'bold 22px serif'; ctx.textAlign = 'center'
      ctx.fillText('✦ zona de premios ✦', W/2, y + 22)
      y += 50

      // Headline
      ctx.fillStyle = C.black
      ctx.font = 'bold 72px "Georgia", serif'
      ctx.textAlign = 'center'
      ctx.fillText('¿HAS GANADO?', W/2, y + 56)
      y += 80

      // Caja negra del formulario
      const boxTop = y
      let innerH = 40
      innerH += labelLines.length * 54 + (labelLines.length > 0 ? 24 : 0)
      innerH += textLines.length * 32 + (textLines.length > 0 ? 24 : 0)
      innerH += 24 + 20 + 110 + 24
      innerH += deadlineLines.length * 38 + (deadlineLines.length > 0 ? 24 : 0)
      innerH += 28 + 28 + 40 + 60

      // Sombra de la caja
      ctx.shadowColor = 'rgba(0,0,0,0.4)'
      ctx.shadowBlur = 20
      ctx.fillStyle = C.black
      ctx.fillRect(PAD, boxTop, INNER, innerH)
      ctx.shadowBlur = 0

      ctx.strokeStyle = C.black; ctx.lineWidth = 2
      ctx.strokeRect(PAD, boxTop, INNER, innerH)
      ctx.strokeRect(PAD + 6, boxTop + 6, INNER - 12, innerH - 12)

      y = boxTop + 44 + 48

      // Label
      ctx.fillStyle = C.white; ctx.font = 'bold 40px Georgia, serif'; ctx.textAlign = 'center'
      for (const line of labelLines) { ctx.fillText(line, W/2, y); y += 54 }
      if (labelLines.length > 0) y += 16

      // Text
      ctx.fillStyle = '#aaaaaa'; ctx.font = 'italic 22px Georgia, serif'
      for (const line of textLines) { ctx.fillText(line, W/2, y); y += 32 }
      if (textLines.length > 0) y += 16

      // Código label
      ctx.fillStyle = C.salmon; ctx.font = '400 18px monospace'
      ctx.fillText('código de canje', W/2, y); y += 24

      // Caja código
      ctx.fillStyle = '#2a2a2a'; ctx.fillRect(PAD + 40, y, INNER - 80, 100)
      ctx.strokeStyle = C.turquoise + '88'; ctx.lineWidth = 1
      ctx.strokeRect(PAD + 40, y, INNER - 80, 100)
      ctx.fillStyle = C.turquoise; ctx.font = 'bold 58px monospace'
      ctx.fillText(rewardCode, W/2, y + 70); y += 124

      // Deadline
      if (deadlineLines.length > 0) {
        const dlH = deadlineLines.length * 38 + 20
        ctx.fillStyle = '#2a0a0a'; ctx.fillRect(PAD + 40, y, INNER - 80, dlH)
        ctx.strokeStyle = C.pink + '66'; ctx.lineWidth = 1
        ctx.strokeRect(PAD + 40, y, INNER - 80, dlH)
        ctx.fillStyle = C.pink; ctx.font = '600 20px Georgia, serif'
        y += 32
        for (const line of deadlineLines) { ctx.fillText(line, W/2, y); y += 38 }
        y += 16
      }

      ctx.fillStyle = '#888'; ctx.font = '400 18px monospace'
      ctx.fillText('muestra esta pantalla', W/2, y); y += 30
      ctx.fillStyle = C.salmon; ctx.font = 'bold 18px monospace'
      ctx.fillText('en el mostrador', W/2, y); y += 44

      // Pie
      ctx.fillStyle = C.pink; ctx.fillRect(PAD, y, INNER, 54)
      ctx.fillStyle = C.white; ctx.font = '400 18px monospace'
      ctx.textAlign = 'left'; ctx.fillText('premio ' + validationId, PAD + 20, y + 34)
      ctx.textAlign = 'right'; ctx.fillText(timestamp, PAD + INNER - 20, y + 34)
      y += 54 + 24

      // Legal
      const legalText = 'Presenta este cupón a nuestro personal antes de pedir. Para consumir en cualquiera de nuestros locales y no acumulable a otras ofertas o descuentos.'
      ctx.fillStyle = C.black + 'aa'; ctx.font = 'italic 15px serif'; ctx.textAlign = 'center'
      const legalLines = wrapText(ctx, legalText, INNER - 40)
      for (const line of legalLines) { ctx.fillText(line, W/2, y); y += 22 }

      const link = document.createElement('a')
      link.download = `premio-chiwawa-${validationId}.png`
      link.href = canvas.toDataURL('image/png')
      link.click()
    }
    logoImg.src = '/logo.png'
  }
  bgImg.src = '/bg.png'
}

function WinnerScreen({ rewardCode, rewardLabel, rewardText, deadlineMsg, validationId, timestamp }) {
  return (
    <div style={{ textAlign: 'center', animation: 'fadeUp .5s ease' }}>
      <div style={{ fontSize: 10, letterSpacing: 4, color: C.black, marginBottom: 16, fontFamily: "'Special Elite', serif" }}>
        ✦ premio válido · {timestamp} ✦
      </div>
      {/* Caja negra del premio */}
      <div style={{ border: `2px solid ${C.black}`, boxShadow: `4px 4px 0 ${C.black}`, overflow: 'hidden', marginBottom: 4 }}>
        <div style={{ background: C.pink, padding: '8px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontSize: 11, color: C.white, fontFamily: "'Special Elite', serif", letterSpacing: 2 }}>CHIWAWA · PREMIOS</span>
          <span style={{ fontSize: 11, color: C.white, fontFamily: 'monospace' }}>{validationId}</span>
        </div>
        <div style={{ background: C.black, padding: '28px 24px 20px', textAlign: 'center' }}>
          {rewardLabel && (
            <div style={{ fontSize: 20, fontWeight: 900, color: C.white, marginBottom: 8, fontFamily: "'Special Elite', serif", textTransform: 'uppercase', lineHeight: 1.3 }}>
              {rewardLabel}
            </div>
          )}
          {rewardText && (
            <div style={{ fontSize: 12, color: '#888', marginBottom: 16, fontStyle: 'italic', fontFamily: "'Crimson Text', serif" }}>
              {rewardText}
            </div>
          )}
          <div style={{ fontSize: 10, letterSpacing: 5, color: C.salmon, marginBottom: 8, fontFamily: "'Special Elite', serif" }}>
            código de canje
          </div>
          <div style={{ fontSize: 32, letterSpacing: 8, color: C.turquoise, fontWeight: 900, padding: '14px 16px', border: `1px solid ${C.turquoise}44`, background: '#4ecdc410', marginBottom: 16, fontFamily: 'monospace' }}>
            {rewardCode}
          </div>
          {deadlineMsg && (
            <div style={{ fontSize: 11, color: C.pink, fontWeight: 700, background: '#e8547a15', border: `1px solid ${C.pink}44`, padding: '8px 14px', marginBottom: 14, fontFamily: "'Special Elite', serif" }}>
              {deadlineMsg}
            </div>
          )}
          <div style={{ fontSize: 11, color: '#666', letterSpacing: 2, lineHeight: 1.8, marginBottom: 14, fontFamily: "'Special Elite', serif" }}>
            muestra esta pantalla<br />
            <span style={{ color: C.salmon, fontWeight: 700 }}>en el mostrador</span>
          </div>
          <div style={{ fontSize: 10, color: '#333', letterSpacing: 1, lineHeight: 1.7, borderTop: '1px solid #2a2a2a', paddingTop: 14, fontStyle: 'italic', fontFamily: "'Crimson Text', serif" }}>
            Presenta este cupón a nuestro personal antes de pedir. Para consumir en cualquiera de nuestros locales y no acumulable a otras ofertas o descuentos.
          </div>
        </div>
        <div style={{ background: C.pink, padding: '10px 20px', display: 'flex', justifyContent: 'space-between' }}>
          <span style={{ fontSize: 11, color: C.white, fontFamily: 'monospace' }}>premio {validationId}</span>
          <span style={{ fontSize: 10, color: C.white + '88' }}>{timestamp}</span>
        </div>
      </div>
      <button onClick={() => downloadPrizeImage({ rewardCode, rewardLabel, rewardText, deadlineMsg, validationId, timestamp })}
        style={{ display: 'block', width: '100%', marginTop: 12, background: C.black, color: C.white, border: `2px solid ${C.black}`, padding: '14px 0', fontFamily: "'Special Elite', serif", fontSize: 13, letterSpacing: 4, cursor: 'pointer', textTransform: 'uppercase', boxShadow: `3px 3px 0 ${C.pink}` }}>
        ✦ ↓ descargar imagen del premio ✦
      </button>
      <div style={{ marginTop: 10, fontSize: 10, color: C.black + '88', letterSpacing: 3, fontFamily: "'Special Elite', serif" }}>código de un solo uso</div>
    </div>
  )
}

function LoserScreen() {
  return (
    <div style={{ textAlign: 'center', animation: 'fadeUp .4s ease', padding: '10px 0' }}>
      <img src="/skull.svg" alt="" style={{ width: 70, opacity: 0.15, marginBottom: 16 }} />
      <div style={{ fontSize: 28, fontWeight: 900, color: C.black, opacity: 0.3, letterSpacing: 2, fontFamily: "'Special Elite', serif", marginBottom: 10 }}>SIN PREMIO</div>
      <div style={{ fontSize: 12, letterSpacing: 3, color: C.black, opacity: 0.4, fontFamily: "'Special Elite', serif" }}>este código no tiene premio</div>
      <div style={{ fontSize: 13, color: C.darkPink, opacity: 0.5, letterSpacing: 2, marginTop: 12, fontStyle: 'italic', fontFamily: "'Crimson Text', serif" }}>— sigue intentándolo —</div>
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
    <div style={{ textAlign: 'center', animation: 'fadeUp .4s ease', padding: '10px 0' }}>
      <div style={{ fontSize: 32, marginBottom: 14 }}>🔒</div>
      <div style={{ fontSize: 18, fontWeight: 900, color: C.black, letterSpacing: 2, marginBottom: 14, fontFamily: "'Special Elite', serif" }}>CÓDIGO YA CANJEADO</div>
      {when && <div style={{ fontSize: 12, color: C.black, letterSpacing: 1, marginBottom: 8, background: 'rgba(0,0,0,0.08)', border: `1px solid ${C.black}22`, padding: '10px 16px', fontFamily: "'Special Elite', serif" }}>canjeado {when}</div>}
      {validationId && <div style={{ fontSize: 10, color: C.black, opacity: 0.4, marginTop: 8, letterSpacing: 2 }}>{validationId}</div>}
      <div style={{ fontSize: 10, color: C.black, opacity: 0.4, marginTop: 14, letterSpacing: 2, fontFamily: "'Special Elite', serif" }}>cada código solo puede usarse una vez</div>
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
        @import url('https://fonts.googleapis.com/css2?family=Special+Elite&family=Crimson+Text:ital,wght@0,400;0,600;1,400&display=swap');
        @keyframes fadeUp { from { opacity:0; transform:translateY(14px); } to { opacity:1; transform:translateY(0); } }
        @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:.4} }
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { background: #e8547a; }
        input::placeholder { color: rgba(26,10,10,0.2) !important; }
      `}</style>

      <div style={{
        minHeight: '100vh',
        backgroundImage: 'url(/bg.png)',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundAttachment: 'fixed',
        display: 'flex', flexDirection: 'column', alignItems: 'center',
        padding: '0 20px 80px',
        fontFamily: "'Special Elite', serif",
      }}>

        {/* Logo */}
        <div style={{ textAlign: 'center', padding: '40px 0 16px' }}>
          <img src="/logo.png" alt="Chiwawa" style={{ width: 200, maxWidth: '75%' }} />
        </div>

        <div style={{ width: '100%', maxWidth: 420 }}>

          {/* Eyebrow */}
          <div style={{ textAlign: 'center', marginBottom: 4 }}>
            <span style={{ fontSize: 11, letterSpacing: 5, color: C.black, fontFamily: "'Special Elite', serif" }}>✦ zona de premios ✦</span>
          </div>
          {visits !== null && (
            <div style={{ textAlign: 'center', marginBottom: 10, fontSize: 9, letterSpacing: 3, color: C.black, opacity: 0.35 }}>
              {visits.toLocaleString('es-ES')} visitas
            </div>
          )}

          {/* Calavera decorativa */}
          <div style={{ textAlign: 'center', marginBottom: 4 }}>
            <img src="/skull.svg" alt="" style={{ width: 48, opacity: 0.5 }} />
          </div>

          {/* Headline */}
          <div style={{ fontSize: 38, color: C.black, textAlign: 'center', lineHeight: 1, letterSpacing: 1, marginBottom: 20, fontFamily: "'Special Elite', serif", textShadow: `2px 2px 0 rgba(255,255,255,0.2)` }}>
            ¿HAS GANADO?
          </div>

          {/* Formulario */}
          {!result && (
            <div style={{ animation: 'fadeUp .6s ease' }}>
              <div style={{
                background: 'rgba(255,248,240,0.12)',
                border: `2px solid ${C.black}`,
                boxShadow: `4px 4px 0 ${C.black}`,
                padding: '24px 20px 20px',
                marginBottom: 12,
              }}>
                <div style={{ fontSize: 10, letterSpacing: 4, color: C.black, textAlign: 'center', marginBottom: 16, opacity: 0.6 }}>
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
                  style={{ display: 'block', width: '100%', background: 'transparent', border: 'none', borderBottom: `2px solid ${C.black}`, color: C.black, fontFamily: "'Special Elite', serif", fontSize: 28, fontWeight: 900, letterSpacing: 8, textAlign: 'center', textTransform: 'uppercase', padding: '6px 0 12px', outline: 'none', caretColor: C.black, marginBottom: 8 }}
                />
                <div style={{ fontSize: 10, color: C.black, opacity: 0.4, textAlign: 'center', letterSpacing: 2, marginBottom: 18 }}>{code.length}/10</div>
                <button onClick={handleSubmit} disabled={loading || code.length !== 10}
                  style={{
                    display: 'block', width: '100%', position: 'relative',
                    background: 'none', border: 'none', padding: 0,
                    cursor: (loading || code.length !== 10) ? 'default' : 'pointer',
                    transition: 'transform .1s',
                  }}>
                  <img
                    src={code.length === 10 ? '/boton_on.png' : '/boton_off.png'}
                    alt="validar"
                    style={{ width: '100%', display: 'block', transition: 'opacity .2s' }}
                  />
                  <span style={{
                    position: 'absolute', top: '50%', left: '50%',
                    transform: 'translate(-50%, -50%)',
                    fontFamily: "'Special Elite', serif",
                    fontSize: 15, letterSpacing: 5,
                    color: code.length === 10 ? C.white : 'rgba(255,255,255,0.35)',
                    whiteSpace: 'nowrap', pointerEvents: 'none',
                    textShadow: code.length === 10 ? '0 1px 3px rgba(0,0,0,0.5)' : 'none',
                  }}>
                    {loading ? <span style={{ animation: 'pulse 1s infinite' }}>VERIFICANDO</span> : 'VALIDAR CÓDIGO →'}
                  </span>
                </button>
              </div>
              {error && <div style={{ fontSize: 12, color: C.black, textAlign: 'center', marginTop: 10, opacity: 0.7 }}>{error}</div>}
              <div style={{ textAlign: 'center', marginTop: 16, fontSize: 10, letterSpacing: 3, color: C.black, opacity: 0.45 }}>
                ✦ cada código solo puede usarse una vez ✦
              </div>
            </div>
          )}

          {/* Resultado */}
          {result && (
            <div style={{ animation: 'fadeUp .5s ease' }}>
              {result.status === 'invalid' && (
                <div style={{ background: 'rgba(255,248,240,0.15)', border: `2px solid ${C.black}`, boxShadow: `4px 4px 0 ${C.black}`, padding: '28px 24px', textAlign: 'center' }}>
                  <div style={{ fontSize: 36, marginBottom: 12, opacity: 0.3 }}>⚠</div>
                  <div style={{ fontSize: 18, color: C.black, letterSpacing: 2, fontFamily: "'Special Elite', serif" }}>CÓDIGO NO RECONOCIDO</div>
                </div>
              )}
              {result.status === 'loser' && (
                <div style={{ background: 'rgba(255,248,240,0.15)', border: `2px solid ${C.black}`, boxShadow: `4px 4px 0 ${C.black}`, padding: '28px 24px' }}>
                  <LoserScreen />
                </div>
              )}
              {result.status === 'used' && (
                <div style={{ background: 'rgba(255,248,240,0.15)', border: `2px solid ${C.black}`, boxShadow: `4px 4px 0 ${C.black}`, padding: '28px 24px' }}>
                  <UsedScreen validationId={result.validationId} assignedAt={result.assignedAt} />
                </div>
              )}
              {result.status === 'winner' && (
                <WinnerScreen rewardCode={result.rewardCode} rewardLabel={result.rewardLabel} rewardText={result.rewardText} deadlineMsg={result.deadlineMsg} validationId={result.validationId} timestamp={result.timestamp} />
              )}
              <button onClick={handleReset} style={{ display: 'block', width: '100%', background: 'transparent', color: C.black, border: `1px solid ${C.black}44`, padding: 12, fontFamily: "'Special Elite', serif", fontSize: 11, letterSpacing: 4, cursor: 'pointer', marginTop: 14, opacity: 0.6 }}>
                ← probar otro código
              </button>
            </div>
          )}
        </div>
      </div>
    </>
  )
}
