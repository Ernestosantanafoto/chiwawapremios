export const metadata = {
  title: 'Chiwawa — Zona de Premios',
  description: '¿Has ganado? Descúbrelo aquí',
}

export default function RootLayout({ children }) {
  return (
    <html lang="es">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link href="https://fonts.googleapis.com/css2?family=Bebas+Neue&family=Crimson+Text:ital,wght@0,400;0,600;1,400&family=Special+Elite&display=swap" rel="stylesheet" />
      </head>
      <body style={{ margin: 0, background: '#0a0a0a' }}>{children}</body>
    </html>
  )
}
