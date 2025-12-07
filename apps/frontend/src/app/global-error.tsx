'use client'

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <html>
      <body style={{ margin: 0, padding: 0, backgroundColor: '#000' }}>
        <div style={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexDirection: 'column',
          fontFamily: 'system-ui, sans-serif',
          color: '#fff',
          padding: '20px',
        }}>
          <h1 style={{ fontSize: '3rem', margin: '0 0 1rem 0', color: '#f00' }}>
            500
          </h1>
          <p style={{ fontSize: '1.25rem', margin: '0 0 2rem 0', color: '#999' }}>
            Erro interno do servidor
          </p>
          <p style={{ fontSize: '0.875rem', margin: '0 0 2rem 0', color: '#666', maxWidth: '400px', textAlign: 'center' }}>
            {error?.message || 'Algo deu errado no servidor'}
          </p>
          <button
            onClick={() => reset()}
            style={{
              padding: '12px 24px',
              backgroundColor: '#f00',
              color: '#fff',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '1rem',
              fontWeight: 'bold',
            }}
          >
            Reiniciar
          </button>
        </div>
      </body>
    </html>
  )
}
