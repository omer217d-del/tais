import { Component, ReactNode } from "react";

interface Props {
  children: ReactNode;
}

interface State {
  error: Error | null;
}

/**
 * ErrorBoundary — top-level safety net.
 *
 * Without this, an uncaught error anywhere in the render tree unmounts the
 * entire React app (React 18 behaviour). Since the app's dark theme sets
 * `--background: 240 10% 4%` (near-black) on <body>, the result is a blank
 * near-black screen with zero indication of what went wrong — exactly the
 * "opens for a couple seconds then goes black" symptom.
 *
 * With this boundary in place, the same error instead renders a visible
 * message + stack trace so the real problem can be diagnosed on-device.
 */
export class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: { componentStack: string }) {
    // Also visible via `adb logcat` under the chromium/console tag.
    console.error("TAIS render crash:", error, info.componentStack);
  }

  render() {
    const { error } = this.state;

    if (error) {
      return (
        <div
          style={{
            minHeight: "100dvh",
            background: "#0a0a0f",
            color: "#ff6b6b",
            fontFamily: "monospace",
            padding: "24px",
            overflow: "auto",
          }}
        >
          <div style={{ fontSize: 20, fontWeight: 700, marginBottom: 12 }}>
            TAIS_CRASH
          </div>
          <div style={{ color: "#f5f5f5", marginBottom: 16 }}>
            {error.message || String(error)}
          </div>
          <pre style={{ fontSize: 11, color: "#888", whiteSpace: "pre-wrap" }}>
            {error.stack}
          </pre>
        </div>
      );
    }

    return this.props.children;
  }
}
