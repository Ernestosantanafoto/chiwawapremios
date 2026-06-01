// Devuelve el nombre del usuario si las credenciales son válidas, o null si no
export function checkAdminAuth(req) {
  const authHeader = req.headers.get('authorization') || ''
  if (!authHeader.startsWith('Basic ')) return null

  const base64 = authHeader.slice(6)
  const decoded = Buffer.from(base64, 'base64').toString('utf-8')
  const [user, pass] = decoded.split(':')

  // Comprobamos todos los usuarios definidos en .env
  // ADMIN_USER / ADMIN_PASS, ADMIN_USER_2 / ADMIN_PASS_2, etc.
  let i = 1
  while (true) {
    const suffix = i === 1 ? '' : `_${i}`
    const envUser = process.env[`ADMIN_USER${suffix}`]
    const envPass = process.env[`ADMIN_PASS${suffix}`]
    if (!envUser) break  // no hay más usuarios definidos
    if (user === envUser && pass === envPass) return envUser
    i++
  }
  return null
}
