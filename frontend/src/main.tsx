import { StrictMode } from "react";
import { QueryClientProvider } from "@tanstack/react-query";
import { GoogleOAuthProvider } from "@react-oauth/google";
import { createRoot } from "react-dom/client";
import { App } from "./App.js";
import { config } from "./config/env.js";
import { queryClient } from "./lib/queryClient.js";
import "./styles.css";

const RootApp = () => (
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      {config.googleClientId ? (
        <GoogleOAuthProvider clientId={config.googleClientId}>
          <App />
        </GoogleOAuthProvider>
      ) : (
        <App />
      )}
    </QueryClientProvider>
  </StrictMode>
);

createRoot(document.getElementById("root") as HTMLElement).render(<RootApp />);
