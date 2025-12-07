export default function NotFound() {
  return (
    <html>
      <body style={{ margin: 0, padding: 0 }}>
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '100vh',
          backgroundColor: '#000',
          color: '#fff',
          fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
        }}>
          <h1 style={{ fontSize: '4rem', margin: '0 0 1rem 0' }}>404</h1>
          <p style={{ fontSize: '1.25rem', margin: '0 0 2rem 0', color: '#999' }}>
            Página não encontrada
          </p>
          <a href="/" style={{
            backgroundColor: '#3b82f6',
            color: '#fff',
            padding: '0.75rem 1.5rem',
            borderRadius: '0.375rem',
            textDecoration: 'none',
            fontSize: '1rem',
          }}>
            Voltar para Home
          </a>
        </div>
      </body>
    </html>
  );
}
