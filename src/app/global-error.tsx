'use client';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="it">
      <body style={{ margin: 0, fontFamily: 'system-ui, -apple-system, sans-serif', background: '#fff' }}>
        <div style={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '2rem',
        }}>
          <div style={{ maxWidth: 400, textAlign: 'center' }}>
            <div style={{
              width: 80,
              height: 80,
              borderRadius: 16,
              background: '#FEF2F2',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 1.5rem',
              fontSize: 32,
            }}>
              !
            </div>
            <h1 style={{ fontSize: 20, fontWeight: 700, color: '#0f172a', margin: '0 0 0.5rem' }}>
              Errore dell&apos;applicazione
            </h1>
            <p style={{ fontSize: 14, color: '#64748b', margin: '0 0 2rem' }}>
              Si è verificato un errore imprevisto. Riprova o torna alla homepage.
            </p>
            <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
              <button
                onClick={reset}
                style={{
                  padding: '10px 24px',
                  background: '#D4AF37',
                  color: '#fff',
                  border: 'none',
                  borderRadius: 8,
                  fontWeight: 700,
                  fontSize: 11,
                  letterSpacing: '0.1em',
                  textTransform: 'uppercase',
                  cursor: 'pointer',
                }}
              >
                Riprova
              </button>
              <a
                href="/"
                style={{
                  padding: '10px 24px',
                  background: 'transparent',
                  color: '#64748b',
                  border: '1px solid #e2e8f0',
                  borderRadius: 8,
                  fontWeight: 700,
                  fontSize: 11,
                  letterSpacing: '0.1em',
                  textTransform: 'uppercase',
                  textDecoration: 'none',
                  cursor: 'pointer',
                }}
              >
                Homepage
              </a>
            </div>
          </div>
        </div>
      </body>
    </html>
  );
}
