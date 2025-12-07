'use client';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      flexDirection: 'column',
      fontFamily: 'system-ui, sans-serif',
      padding: '20px',
    }}>
      <h1 style={{ fontSize: '2rem', margin: '0 0 1rem 0' }}>
        Erro
      </h1>
      <p style={{ fontSize: '1rem', margin: '0 0 2rem 0', color: '#666' }}>
        {error?.message || 'Algo deu errado'}
      </p>
      <button
        onClick={() => reset()}
        style={{
          padding: '12px 24px',
          backgroundColor: '#3b82f6',
          color: '#fff',
          border: 'none',
          borderRadius: '6px',
          cursor: 'pointer',
          fontSize: '1rem',
        }}
      >
        Tentar novamente
      </button>
    </div>
  );
}
