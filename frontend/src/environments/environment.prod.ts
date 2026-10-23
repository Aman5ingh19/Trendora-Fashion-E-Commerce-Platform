export const environment = {
  production: true,
  // Set your Render backend service URL here (or override via window.__TRENDORA_API_URL__)
  apiUrl: (typeof window !== 'undefined' && (window as any).__TRENDORA_API_URL__)
    || 'https://trendora-fashion-e-commerce-platform.onrender.com/api'
};
