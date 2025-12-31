// API Key Rotation for higher throughput
const API_KEYS = [
  import.meta.env.VITE_API_KEY,
  import.meta.env.VITE_API_KEY_2,
  import.meta.env.VITE_API_KEY_3,
].filter(Boolean);

let currentKeyIndex = 0;
const keyUsage: Record<string, { count: number; resetTime: number }> = {};

export const getNextApiKey = (): string => {
  if (API_KEYS.length === 0) {
    throw new Error('No API keys configured');
  }
  
  // Simple round-robin rotation
  const key = API_KEYS[currentKeyIndex];
  currentKeyIndex = (currentKeyIndex + 1) % API_KEYS.length;
  
  return key || API_KEYS[0];
};

export const getApiKeyCount = (): number => API_KEYS.length;
