'use client';

import { useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { Suspense } from 'react';

function KakaoCallbackInner() {
  const searchParams = useSearchParams();

  useEffect(() => {
    const code = searchParams.get('code');
    const error = searchParams.get('error');

    if (window.opener) {
      if (code) {
        window.opener.postMessage({ type: 'KAKAO_CODE', code }, window.location.origin);
      } else {
        window.opener.postMessage({ type: 'KAKAO_ERROR', error: error ?? 'unknown' }, window.location.origin);
      }
      window.close();
    } else {
      // 팝업이 아니라 리다이렉트로 온 경우 (혹시 모를 폴백)
      if (code) {
        window.location.href = `/login?kakao_code=${code}`;
      } else {
        window.location.href = '/login';
      }
    }
  }, [searchParams]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <p className="text-gray-500 text-sm">카카오 로그인 처리 중...</p>
    </div>
  );
}

export default function KakaoCallbackPage() {
  return (
    <Suspense>
      <KakaoCallbackInner />
    </Suspense>
  );
}
