import React from "react";

export class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error) {
    // Update state so the next render will show the fallback UI.
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    this.setState({ hasError: true })
  }

  render() {
    if (this.state.hasError) {
      // You can render any custom fallback UI
      return <div>
        <h1>Something went wrong :/</h1>
        <p>Try refreshing the page or contact us if the problem persists. You can try wiping your local storage.</p>
        <button onClick={() => window.location.reload()}>Refresh</button>
        <button onClick={() => {
          localStorage.removeItem('settings')
          localStorage.removeItem('session')
          window.location.reload()
        }}>Clear settings and session</button>
        <button onClick={() => window.localStorage.clear() && window.location.reload()}>Clear entire local storage (including saved data)</button>
      </div>
    }

    return this.props.children;
  }
}