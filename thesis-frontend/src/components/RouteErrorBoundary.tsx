import React from "react";

type Props = {
  children: React.ReactNode;
  pageTitle?: string;
};

type State = {
  hasError: boolean;
  message: string;
};

class RouteErrorBoundary extends React.Component<Props, State> {
  state: State = { hasError: false, message: "" };

  static getDerivedStateFromError(): State {
    return { hasError: true, message: "" };
  }

  componentDidCatch(error: unknown) {
    // Keep route-level failures from crashing the whole app.
    console.error("Route render error:", error);
    const message = error instanceof Error ? error.message : "Unknown route error";
    this.setState({ message });
  }

  handleRetry = () => {
    this.setState({ hasError: false, message: "" });
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div
          style={{
            minHeight: 320,
            border: "1px solid #dde3ec",
            borderRadius: 16,
            background: "#ffffff",
            padding: 20,
            display: "grid",
            gap: 10,
            alignContent: "start",
            fontFamily: '"Be Vietnam Pro", "Segoe UI", sans-serif',
          }}
        >
          <h2 style={{ margin: 0, fontSize: 28, color: "#ea580c", fontWeight: 700 }}>
            {this.props.pageTitle ?? "Trang đang tạm lỗi"}
          </h2>
          <div style={{ color: "#475569", fontSize: 14 }}>
            Vui lòng tải lại trang.
          </div>
          {this.state.message ? (
            <div
              style={{
                color: "#b91c1c",
                fontSize: 13,
                border: "1px solid #fecaca",
                background: "#fff1f2",
                borderRadius: 10,
                padding: "8px 10px",
                width: "fit-content",
                maxWidth: "100%",
              }}
            >
              {this.state.message}
            </div>
          ) : null}
          <button
            type="button"
            onClick={this.handleRetry}
            style={{
              width: "fit-content",
              minHeight: 40,
              border: "1px solid #ea580c",
              background: "#f97316",
              color: "#fff",
              borderRadius: 10,
              padding: "8px 14px",
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            Tải lại
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

export default RouteErrorBoundary;
