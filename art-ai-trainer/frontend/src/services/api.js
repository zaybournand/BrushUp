// Shared by fetch and Axios callers; override in frontend/.env.local.
export const API_BASE_URL = (
  process.env.REACT_APP_API_BASE_URL || 'http://localhost:5001'
).replace(/\/+$/, '');
