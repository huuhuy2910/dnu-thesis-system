// src/main.tsx
/* eslint-disable react-refresh/only-export-components */
import React, { useEffect, useState } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import App from "./App";
import "./index.css";
import { AuthProvider } from "./context/AuthContext";
import PageLoader from "./components/PageLoader";

function Root() {
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Hide loader after window loads or after a timeout as a fallback
    function onLoad() {
      // small delay to show the loader briefly for perceived performance
      setTimeout(() => setLoading(false), 300);
    }

    if (document.readyState === "complete") {
      onLoad();
    } else {
      window.addEventListener("load", onLoad, { once: true });
      // fallback: hide loader after 3s
      const t = setTimeout(() => setLoading(false), 3000);
      return () => {
        window.removeEventListener("load", onLoad);
        clearTimeout(t);
      };
    }
  }, []);

  return (
    <React.StrictMode>
      {loading && <PageLoader />}
      <AuthProvider>
        <BrowserRouter>
          <App />
        </BrowserRouter>
      </AuthProvider>
    </React.StrictMode>
  );
}

createRoot(document.getElementById("root")!).render(<Root />);
