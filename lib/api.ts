import axios from 'axios';
import Cookies from 'js-cookie';

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3000';

export const apiClient = axios.create({
  baseURL: `${API_BASE}/api`,
  withCredentials: false,
});

// 토큰 저장: sessionStorage(탭 닫으면 만료) + Cookie(미들웨어 라우트 보호용)
export function setAdminToken(token: string) {
  if (typeof window === 'undefined') return;
  sessionStorage.setItem('adminToken', token);
  Cookies.set('adminToken', token, { expires: 1 / 3, sameSite: 'strict' }); // 8시간
}

// 토큰 삭제
export function clearAdminToken() {
  if (typeof window === 'undefined') return;
  sessionStorage.removeItem('adminToken');
  Cookies.remove('adminToken');
}

// 요청 인터셉터: sessionStorage에서 토큰 주입
apiClient.interceptors.request.use((config) => {
  if (typeof window !== 'undefined') {
    const token = sessionStorage.getItem('adminToken');
    if (token) config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// 응답 인터셉터: 401이면 토큰 삭제 후 로그인 페이지로
apiClient.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401 && typeof window !== 'undefined') {
      clearAdminToken();
      window.location.href = '/login';
    }
    return Promise.reject(err as Error);
  },
);

export default apiClient;
