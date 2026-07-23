import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App.jsx";
import "./index.css";

// Catches any crash in the app and prints it on screen instead of
// leaving a blank white page.
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { error: null };
  }
  static getDerivedStateFromError(error) {
    return { error };
  }
  componentDidCatch(error, info) {
    console.error("App crashed:", error, info);
  }
  render() {
    if (this.state.error) {
      return (
        <div style={{ fontFamily: "system-ui, sans-serif", padding: "24px", maxWidth: "640px", margin: "40px auto", background: "#fff", border: "2px solid #d33", borderRadius: "8px" }}>
          <h1 style={{ fontSize: "18px", margin: "0 0 8px" }}>The app hit an error</h1>
          <p style={{ fontSize: "14px", color: "#444", margin: "0 0 12px" }}>
            Screenshot this message and send it over — it names the exact problem.
          </p>
          <pre style={{ fontSize: "12px", background: "#f6f6f6", padding: "12px", borderRadius: "4px", whiteSpace: "pre-wrap", wordBreak: "break-word", margin: 0 }}>
            {String(this.state.error && this.state.error.message ? this.state.error.message : this.state.error)}
          </pre>
        </div>
      );
    }
    return this.props.children;
  }
}

const rootEl = document.getElementById("root");

try {
  ReactDOM.createRoot(rootEl).render(
    <React.StrictMode>
      <ErrorBoundary>
        <App />
      </ErrorBoundary>
    </React.StrictMode>
  );
} catch (e) {
  // If React itself fails to start, write the error straight into the page.
  rootEl.innerHTML =
    '<div style="font-family:system-ui,sans-serif;padding:24px;max-width:640px;margin:40px auto;background:#fff;border:2px solid #d33;border-radius:8px">' +
    '<h1 style="font-size:18px;margin:0 0 8px">Startup error</h1>' +
    '<pre style="font-size:12px;background:#f6f6f6;padding:12px;border-radius:4px;white-space:pre-wrap;word-break:break-word;margin:0">' +
    String(e && e.message ? e.message : e) +
    "</pre></div>";
}
