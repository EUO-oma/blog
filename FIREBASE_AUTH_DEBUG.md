# Firebase Authentication 디버깅 가이드

## Google 로그인 오류 해결 방법

### 1. Firebase Console에서 확인사항

1. **Google 로그인 활성화 확인**
   - https://console.firebase.google.com 접속
   - `euo-oma-blog` 프로젝트 선택
   - Authentication > Sign-in method 탭
   - Google 제공업체가 "사용" 상태인지 확인
   - 프로젝트 지원 이메일이 설정되어 있는지 확인

2. **OAuth 동의 화면 설정**
   - Google Cloud Console (https://console.cloud.google.com) 접속
   - 동일한 프로젝트 선택
   - APIs & Services > OAuth consent screen
   - 애플리케이션 이름, 지원 이메일 등 필수 정보 입력

### 2. 환경 변수 확인

`.env.local` 파일에 다음 변수들이 올바르게 설정되어 있는지 확인:

```
NEXT_PUBLIC_FIREBASE_API_KEY=AIzaSyAjO06gbmZrl6c4oHlG4FBfVDLZktcILyY
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=euo-oma-blog.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=euo-oma-blog
```

### 3. 브라우저 콘솔 확인

개발자 도구(F12) > Console에서 다음 로그 확인:

- `🔥 Firebase Config Status`: Firebase 설정 상태
- `🔐 AuthContext`: 인증 상태 변화
- `🔐 Google Sign-in`: Google 로그인 프로세스

### 4. 일반적인 오류와 해결책

| 오류 코드 | 의미 | 해결 방법 |
|----------|------|-----------|
| auth/configuration-not-found | Google 제공업체 미설정 | Firebase Console에서 Google 활성화 |
| auth/operation-not-allowed | 로그인 방법 비활성화 | Firebase Console에서 해당 방법 활성화 |
| auth/unauthorized-domain | 도메인 미승인 | Firebase Console > Authentication > Settings > Authorized domains에 도메인 추가 |

### 5. GitHub Pages 배포 시 추가 설정

GitHub Pages URL을 Firebase 승인된 도메인에 추가:
1. Firebase Console > Authentication > Settings
2. Authorized domains 탭
3. `euo-oma.github.io` 추가

### 6. 테스트 방법

1. 로컬 환경에서 먼저 테스트 (`npm run dev`)
2. 정상 작동 확인 후 GitHub에 푸시
3. GitHub Actions 빌드 완료 후 배포된 사이트에서 테스트