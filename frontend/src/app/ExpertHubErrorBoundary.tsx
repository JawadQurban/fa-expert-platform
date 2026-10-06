import { Component } from 'react';
import type { ErrorInfo, ReactNode } from 'react';

/**
 * Expert Hub top-level error boundary — catches render errors below the router
 * and shows a minimal, self-contained, accessible fallback. **Expert-Hub-owned**
 * (does not reuse the Hackathon `@app/ErrorBoundary`, keeping the standalone
 * boundary intact). Deliberately dependency-light and token-styled so it renders
 * even if a provider below it is the thing that failed.
 */
interface State {
  readonly hasError: boolean;
}

export class ExpertHubErrorBoundary extends Component<{ readonly children: ReactNode }, State> {
  override state: State = { hasError: false };

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  override componentDidCatch(error: Error, info: ErrorInfo): void {
    // Surface for diagnostics; a real telemetry sink wires in here later.
    console.error('Expert Hub crashed:', error, info.componentStack);
  }

  override render(): ReactNode {
    if (this.state.hasError) {
      // Inline-styled so it renders with zero dependency on app CSS/providers.
      return (
        <div
          role="alert"
          style={{
            minHeight: '100vh',
            display: 'grid',
            placeItems: 'center',
            padding: '2rem',
            textAlign: 'center',
          }}
        >
          <div style={{ maxWidth: '32rem' }}>
            <h1 style={{ fontSize: '1.5rem', marginBottom: '0.75rem' }}>حدث خطأ غير متوقع</h1>
            <p style={{ marginBottom: '1.5rem', lineHeight: 1.7 }}>
              نعتذر، حدث خطأ أثناء تشغيل التطبيق. يُرجى تحديث الصفحة والمحاولة مرة أخرى.
              <br />
              Something went wrong. Please refresh the page and try again.
            </p>
            <button
              type="button"
              onClick={() => location.reload()}
              style={{
                padding: '0.625rem 1.25rem',
                borderRadius: '0.5rem',
                border: '1px solid currentColor',
                background: 'transparent',
                cursor: 'pointer',
                font: 'inherit',
              }}
            >
              تحديث الصفحة / Refresh
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
