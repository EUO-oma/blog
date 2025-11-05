# Firebase Google 로그인 설정 가이드

## "auth/configuration-not-found" 오류 해결 방법

이 오류는 Firebase Console에서 Google 로그인 제공업체가 제대로 설정되지 않았을 때 발생합니다.

### Firebase Console에서 확인해야 할 사항:

1. **Google 로그인 제공업체 활성화**
   - [Firebase Console](https://console.firebase.google.com/)에 로그인
   - 프로젝트 선택 (`euo-oma-blog`)
   - 좌측 메뉴에서 "Authentication" 클릭
   - "Sign-in method" 탭 클릭
   - "Google" 제공업체를 찾아서 활성화
   - 프로젝트 지원 이메일 설정 (필수)
   - "저장" 클릭

2. **Authorized Domains 확인**
   - Authentication > Settings > Authorized domains 탭
   - 다음 도메인들이 추가되어 있는지 확인:
     - `localhost`
     - `euo-oma-blog.firebaseapp.com`
     - 배포할 실제 도메인 (예: `yourdomain.com`)

3. **OAuth 2.0 클라이언트 ID 확인**
   - Google Cloud Console에서 프로젝트 확인
   - API 및 서비스 > 사용자 인증 정보
   - OAuth 2.0 클라이언트 ID가 생성되어 있는지 확인

### 로컬 환경 설정 확인:

1. **환경 변수 확인** (.env.local)
   ```
   NEXT_PUBLIC_FIREBASE_API_KEY=AIzaSyAjO06gbmZrl6c4oHlG4FBfVDLZktcILyY
   NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=euo-oma-blog.firebaseapp.com
   NEXT_PUBLIC_FIREBASE_PROJECT_ID=euo-oma-blog
   ```

2. **authDomain 형식 확인**
   - 형식: `{PROJECT_ID}.firebaseapp.com`
   - 귀하의 경우: `euo-oma-blog.firebaseapp.com` ✅

### 테스트 방법:

1. 브라우저 개발자 도구 콘솔을 열고 다음 로그 확인:
   - "🔥 Firebase Config Status" - 모든 설정이 'configured'인지 확인
   - "✅ Firebase initialized successfully" - Firebase 초기화 성공 확인

2. Google 로그인 버튼 클릭 시:
   - "🔐 Google Sign-in: Starting authentication process" 로그 확인
   - 오류 발생 시 구체적인 오류 코드 확인

### 추가 트러블슈팅:

1. **브라우저 캐시 삭제**
   - 하드 리프레시: Cmd+Shift+R (Mac) / Ctrl+Shift+R (Windows)

2. **Firebase SDK 버전 확인**
   - 현재 버전: ^12.5.0 ✅

3. **네트워크 탭 확인**
   - 개발자 도구 > Network 탭
   - Google 로그인 시도 시 실패하는 요청 확인

4. **시크릿 모드에서 테스트**
   - 브라우저 확장 프로그램 등의 간섭 배제

### 여전히 문제가 있다면:

1. Firebase Console에서 프로젝트를 다시 생성하거나
2. 기존 프로젝트의 Google 제공업체를 비활성화 후 다시 활성화
3. Firebase SDK를 다운그레이드 시도: `npm install firebase@10.12.2`