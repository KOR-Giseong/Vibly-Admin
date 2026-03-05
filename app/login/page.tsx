'use client';

import { useEffect, useRef, useState } from 'react';
import Script from 'next/script';
import { authApi } from '@/lib/services';
import { setAdminToken } from '@/lib/api';

const GOOGLE_CLIENT_ID = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID ?? '';
const KAKAO_JS_KEY = process.env.NEXT_PUBLIC_KAKAO_JS_KEY ?? '';

const MAX_ATTEMPTS = 5;
const LOCK_SECONDS = 30;

declare global {
  interface Window {
    google: {
      accounts: {
        id: {
          initialize: (config: {
            client_id: string;
            callback: (response: { credential: string }) => void;
          }) => void;
          renderButton: (
            element: HTMLElement,
            options: {
              theme?: string;
              size?: string;
              width?: number;
              text?: string;
              locale?: string;
            },
          ) => void;
        };
      };
    };
    Kakao: {
      isInitialized: () => boolean;
      init: (key: string) => void;
      Auth: {
        login: (options: {
          throughTalk?: boolean;
          scope?: string;
          success: (authObj: { access_token: string }) => void;
          fail: () => void;
        }) => void;
      };
    };
  }
}

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [failCount, setFailCount] = useState(0);
  const [lockRemaining, setLockRemaining] = useState(0);
  const lockTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const googleBtnRef = useRef<HTMLDivElement>(null);

  // 잠금 카운트다운
  useEffect(() => {
    if (lockRemaining <= 0) return;
    lockTimerRef.current = setInterval(() => {
      setLockRemaining((prev) => {
        if (prev <= 1) {
          clearInterval(lockTimerRef.current!);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(lockTimerRef.current!);
  }, [lockRemaining]);

  // Google GIS 버튼 초기화
  const initGoogle = () => {
    if (!GOOGLE_CLIENT_ID || !window.google) return;
    window.google.accounts.id.initialize({
      client_id: GOOGLE_CLIENT_ID,
      callback: handleGoogleCredential,
    });
    if (googleBtnRef.current) {
      window.google.accounts.id.renderButton(googleBtnRef.current, {
        theme: 'outline',
        size: 'large',
        width: googleBtnRef.current.offsetWidth,
        text: 'signin_with',
        locale: 'ko',
      });
    }
  };

  // Kakao SDK 초기화
  const initKakao = () => {
    if (!KAKAO_JS_KEY || !window.Kakao) return;
    if (!window.Kakao.isInitialized()) {
      window.Kakao.init(KAKAO_JS_KEY);
    }
  };

  const onLoginSuccess = (accessToken: string) => {
    setAdminToken(accessToken);
    window.location.href = '/dashboard';
  };

  const handleLoginError = (msg: string) => {
    const next = failCount + 1;
    setFailCount(next);
    if (next >= MAX_ATTEMPTS) {
      setFailCount(0);
      setLockRemaining(LOCK_SECONDS);
      setError(`로그인 ${MAX_ATTEMPTS}회 실패로 ${LOCK_SECONDS}초간 잠금됩니다.`);
    } else {
      setError(`${msg} (${next}/${MAX_ATTEMPTS}회)`);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (lockRemaining > 0) return;
    setError('');
    setLoading(true);
    try {
      const { accessToken } = await authApi.login(email, password);
      onLoginSuccess(accessToken);
    } catch {
      handleLoginError('이메일 또는 비밀번호가 올바르지 않습니다.');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleCredential = async (response: { credential: string }) => {
    if (lockRemaining > 0) return;
    setError('');
    setLoading(true);
    try {
      const { accessToken } = await authApi.googleLogin(response.credential);
      onLoginSuccess(accessToken);
    } catch {
      handleLoginError('Google 로그인에 실패했습니다. 관리자 계정을 확인해 주세요.');
    } finally {
      setLoading(false);
    }
  };

  const handleKakaoLogin = () => {
    if (lockRemaining > 0 || !window.Kakao?.Auth) return;
    setError('');
    window.Kakao.Auth.login({
      throughTalk: false, // 카카오톡 앱 대신 브라우저 팝업 사용
      scope: 'profile_nickname,account_email',
      success: async (authObj: { access_token: string }) => {
        setLoading(true);
        try {
          const { accessToken } = await authApi.kakaoLogin(authObj.access_token);
          onLoginSuccess(accessToken);
        } catch {
          handleLoginError('카카오 로그인에 실패했습니다. 관리자 계정을 확인해 주세요.');
        } finally {
          setLoading(false);
        }
      },
      fail: () => {
        handleLoginError('카카오 로그인에 실패했습니다.');
      },
    });
  };

  const isLocked = lockRemaining > 0;

  return (
    <>
      {GOOGLE_CLIENT_ID && (
        <Script
          src="https://accounts.google.com/gsi/client"
          onLoad={initGoogle}
          strategy="afterInteractive"
        />
      )}
      {KAKAO_JS_KEY && (
        <Script
          src="https://t1.kakaocdn.net/kakao_js_sdk/2.7.4/kakao.min.js"
          onLoad={initKakao}
          strategy="afterInteractive"
        />
      )}

      <div className="min-h-screen bg-gradient-to-br from-violet-50 to-pink-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-xl p-8 w-full max-w-sm">
          <div className="text-center mb-8">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/Logo.png" alt="Vibly" className="h-16 w-auto object-contain mx-auto mb-4" />
            <p className="text-gray-500 text-sm mt-1">관리자 전용 대시보드</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">이메일</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-violet-500 text-sm disabled:bg-gray-50"
                placeholder="admin@vibly.app"
                required
                disabled={isLocked}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">비밀번호</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-violet-500 text-sm disabled:bg-gray-50"
                placeholder="비밀번호 입력"
                required
                disabled={isLocked}
              />
            </div>

            {error && (
              <p className={`text-sm ${isLocked ? 'text-orange-500' : 'text-red-500'}`}>{error}</p>
            )}
            {isLocked && (
              <p className="text-orange-500 text-sm text-center font-medium">
                {lockRemaining}초 후 다시 시도할 수 있습니다.
              </p>
            )}

            <button
              type="submit"
              disabled={loading || isLocked}
              className="w-full py-2.5 bg-gradient-to-r from-violet-600 to-pink-600 text-white rounded-xl font-semibold text-sm hover:opacity-90 transition disabled:opacity-50"
            >
              {loading ? '로그인 중...' : '이메일 로그인'}
            </button>
          </form>

          {(GOOGLE_CLIENT_ID || KAKAO_JS_KEY) && (
            <>
              <div className="flex items-center gap-3 my-4">
                <div className="flex-1 h-px bg-gray-200" />
                <span className="text-xs text-gray-400">또는 소셜 로그인</span>
                <div className="flex-1 h-px bg-gray-200" />
              </div>

              <div className="space-y-2">
                {GOOGLE_CLIENT_ID && (
                  <div
                    ref={googleBtnRef}
                    className={`w-full overflow-hidden rounded-xl ${isLocked ? 'pointer-events-none opacity-50' : ''}`}
                  />
                )}

                {KAKAO_JS_KEY && (
                  <button
                    onClick={handleKakaoLogin}
                    disabled={loading || isLocked}
                    className="w-full py-2.5 bg-[#FEE500] text-[#3C1E1E] rounded-xl font-semibold text-sm hover:opacity-90 transition disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M12 3C6.48 3 2 6.48 2 10.8c0 2.76 1.72 5.19 4.32 6.68-.18.65-.65 2.38-.74 2.73-.12.44.16.43.34.31.14-.09 2.24-1.52 3.15-2.14.6.09 1.22.14 1.93.14 5.52 0 10-3.48 10-7.8S17.52 3 12 3z"/>
                    </svg>
                    카카오 로그인
                  </button>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </>
  );
}
