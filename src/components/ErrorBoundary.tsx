import { Component, ReactNode } from 'react';

interface State { error: Error | null; }

export default class ErrorBoundary extends Component<{ children: ReactNode }, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: any) {
    console.error('Uncaught error:', error, info);
  }

  render() {
    if (this.state.error) {
      return (
        <div style={{ padding: 24, fontFamily: 'system-ui, sans-serif', maxWidth: 720, margin: '40px auto' }}>
          <h1 style={{ color: '#d42a3c', fontSize: 28, marginBottom: 8 }}>Greška u aplikaciji</h1>
          <p style={{ color: '#555', marginBottom: 16 }}>{String(this.state.error.message ?? this.state.error)}</p>
          <details style={{ background: '#f5f5f8', padding: 12, borderRadius: 8, fontSize: 13 }}>
            <summary>Detalji</summary>
            <pre style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
              {String(this.state.error.stack ?? '')}
            </pre>
          </details>
          <button
            onClick={() => location.reload()}
            style={{ marginTop: 16, padding: '10px 16px', background: '#1d4e9e', color: '#fff', border: 0, borderRadius: 8, cursor: 'pointer' }}
          >
            Osvježi
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}
