'use client';

import { useEffect, useRef, useState } from 'react';
import Script from 'next/script';
import { authApi } from '@/lib/services';
import { setAdminToken } from '@/lib/api';

const GOOGLE_CLIENT_ID = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID ?? '';
const KAKAO_JS_KEY = process.env.NEXT_PUBLIC_KAKAO_JS_KEY ?? '';
const APPLE_CLIENT_ID = process.env.NEXT_PUBLIC_APPLE_CLIENT_ID ?? '';
const APPLE_REDIRECT_URI = process.env.NEXT_PUBLIC_APPLE_REDIRECT_URI ?? (typeof window !== 'undefined' ? window.location.origin + '/login' : '');

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
    AppleID: {
      auth: {
        init: (config: {
          clientId: string;
          scope: string;
          redirectURI: string;
          usePopup: boolean;
        }) => void;
        signIn: () => Promise<{
          authorization: { id_token: string; code: string };
          user?: { name?: { firstName?: string; lastName?: string }; email?: string };
        }>;
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

  // Apple SDK 초기화
  const initApple = () => {
    if (!APPLE_CLIENT_ID || !window.AppleID) return;
    window.AppleID.auth.init({
      clientId: APPLE_CLIENT_ID,
      scope: 'email name',
      redirectURI: APPLE_REDIRECT_URI || window.location.origin + '/login',
      usePopup: true,
    });
  };

  // Apple SDK 직접 로드 (Script onLoad 신뢰성 문제 방지)
  useEffect(() => {
    if (!APPLE_CLIENT_ID) return;
    if (window.AppleID) { initApple(); return; }
    const script = document.createElement('script');
    script.src = 'https://appleid.cdn-apple.com/appleauth/static/jsapi/appleid/1/en_US/appleid.auth.js';
    script.async = true;
    script.onload = () => initApple();
    script.onerror = () => console.error('Apple SDK 스크립트 로드 실패');
    document.head.appendChild(script);
    return () => { document.head.removeChild(script); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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
    if (lockRemaining > 0) return;
    if (!window.Kakao || !window.Kakao.Auth) {
      setError('카카오 SDK가 아직 로드되지 않았습니다. 잠시 후 다시 시도해 주세요.');
      return;
    }
    if (!window.Kakao.isInitialized()) {
      window.Kakao.init(KAKAO_JS_KEY);
    }
    setError('');
    try {
      window.Kakao.Auth.login({
        throughTalk: false,
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
          handleLoginError('카카오 로그인에 실패했습니다. 도메인이 등록되지 않았을 수 있습니다.');
        },
      });
    } catch (e) {
      console.error('Kakao.Auth.login error:', e);
      setError('카카오 오류: ' + (e instanceof Error ? e.message : String(e)));
    }
  };

  const handleAppleLogin = async () => {
    if (lockRemaining > 0) return;
    if (!window.AppleID) {
      setError('Apple SDK가 아직 로드되지 않았습니다. 잠시 후 다시 시도해 주세요.');
      return;
    }
    setError('');
    setLoading(true);
    try {
      const result = await window.AppleID.auth.signIn();
      const { accessToken } = await authApi.appleLogin(result.authorization.id_token);
      onLoginSuccess(accessToken);
    } catch (e) {
      if ((e as { error?: string })?.error === 'popup_closed_by_user') return; // 사용자가 팝업 닫음
      handleLoginError('Apple 로그인에 실패했습니다. 관리자 계정을 확인해 주세요.');
    } finally {
      setLoading(false);
    }
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
      {/* Apple SDK는 useEffect에서 직접 로드 */}

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

          {(GOOGLE_CLIENT_ID || KAKAO_JS_KEY || APPLE_CLIENT_ID) && (
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

                {APPLE_CLIENT_ID && (
                  <button
                    onClick={handleAppleLogin}
                    disabled={loading || isLocked}
                    className="w-full py-2.5 bg-black text-white rounded-xl font-semibold text-sm hover:bg-gray-900 transition disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    <svg width="17" height="17" viewBox="0 0 814 1000" fill="currentColor">
                      <path d="M788.1 340.9c-5.8 4.5-108.2 62.2-108.2 190.5 0 148.4 130.3 200.9 134.2 202.2-.6 3.2-20.7 71.9-68.7 141.9-42.8 61.6-87.5 123.1-155.5 123.1s-85.5-39.5-164-39.5c-76 0-103.7 40.8-165.9 40.8s-105-37.3-155.5-127.2C46.7 790.7 0 663 0 541.8c0-207.8 135.6-318.3 269.6-318.3 71.2 0 130.3 46.7 175.1 46.7 43.5 0 111.7-49.3 193.5-49.3zM498.4 92.3c-.6 0-1.2 0-2 .1C490 36.7 420.3 0 360.4 0c-52.8 0-106.7 33.1-144.2 84.5-32.4 45.6-55.9 118.3-28.5 183.7 6.7 16.3 14.8 22.5 22.6 22.5 8.4 0 18.2-7.2 25.3-14.5 33-34.5 66.6-91.6 66.6-152.2l.6-7.3c10-2 20.1-2.7 29.7-2.7 55.7 0 117.3 30.9 148 75.3z"/>
                    </svg>
                    Apple로 로그인
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
