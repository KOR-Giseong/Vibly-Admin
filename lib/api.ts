import axios from 'axios';

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3000';

export const apiClient = axios.create({
  baseURL: `${API_BASE}/api`,
  withCredentials: false,
});

// 요청 인터셉터: sessionStorage에서 토큰 주입 (탭 닫으면 자동 만료)
apiClient.interceptors.request.use((config) => {
  if (typeof window !== 'undefined') {
    const token = sessionStorage.getItem('adminToken');
    if (token) config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// 응답 인터셉터: 401이면 로그인 페이지로
apiClient.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401 && typeof window !== 'undefined') {
      sessionStorage.removeItem('adminToken');
      window.location.href = '/login';
    }
    return Promise.reject(err as Error);
  },
);

export default apiClient;
