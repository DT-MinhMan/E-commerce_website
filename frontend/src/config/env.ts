interface FrontendConfig {
  apiBaseUrl: string;
}

const apiBaseUrl = import.meta.env.VITE_API_BASE_URL;

if (!apiBaseUrl) {
  throw new Error("Missing VITE_API_BASE_URL");
}

export const config: FrontendConfig = {
  apiBaseUrl
};
