import React, { type ErrorInfo, useEffect } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import './index.css';

type ErrorState = { error: Error | null; info: ErrorInfo | null };

function DesktopErrorScreen({ title, detail }: { title: string; detail: string }) {
  return (
    <main data-desktop-error className="min-h-screen bg-[#06080d] p-6 text-slate-100">
      <section className="mx-auto mt-24 max-w-3xl rounded-2xl border border-slate-700 bg-slate-950 p-8 shadow-2xl">
        <p className="text-xs font-bold uppercase tracking-[0.24em] text-cyan-300">Desktop startup error</p>
        <h1 className="mt-3 text-3xl font-black text-white">{title}</h1>
        <p className="mt-3 text-slate-400">The Electron shell is running, but the React interface hit an error. This screen is shown instead of a blank black window.</p>
        <pre className="mt-5 max-h-80 overflow-auto rounded-xl border border-red-400/30 bg-black p-4 text-sm text-red-200">{detail}</pre>
      </section>
    </main>
  );
}

class RootErrorBoundary extends React.Component<{ children: React.ReactNode }, ErrorState> {
  state: ErrorState = { error: null, info: null };

  static getDerivedStateFromError(error: Error): ErrorState {
    return { error, info: null };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    this.setState({ error, info });
    console.error('React desktop renderer failed', error, info);
  }

  render() {
    if (this.state.error) {
      return <DesktopErrorScreen title="React failed to start" detail={`${this.state.error.stack || this.state.error.message}\n\n${this.state.info?.componentStack || ''}`} />;
    }
    return this.props.children;
  }
}

function MountedApp() {
  useEffect(() => {
    document.body.dataset.reactMounted = 'true';
  }, []);

  return <App />;
}

window.addEventListener('error', (event) => {
  document.body.dataset.reactBootError = event.message;
});

window.addEventListener('unhandledrejection', (event) => {
  document.body.dataset.reactBootError = event.reason instanceof Error ? event.reason.message : String(event.reason);
});

const root = document.getElementById('root');
if (!root) {
  document.body.innerHTML = '<main style="min-height:100vh;display:grid;place-items:center;background:#06080d;color:#fecaca;font-family:Segoe UI,Arial,sans-serif;padding:24px"><section style="max-width:720px;border:1px solid #7f1d1d;background:#111827;padding:28px;border-radius:16px"><h1>Desktop startup error</h1><p>Missing #root element in packaged index.html.</p></section></main>';
  throw new Error('Missing #root element in packaged index.html');
}

createRoot(root).render(
  <React.StrictMode>
    <RootErrorBoundary>
      <MountedApp />
    </RootErrorBoundary>
  </React.StrictMode>
);
