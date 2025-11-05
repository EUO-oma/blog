# Google 로그인 설정 가이드

블로그에서 Google 로그인을 사용하려면 다음 단계를 따르세요:

## 1. Google Cloud Console 설정

1. [Google Cloud Console](https://console.cloud.google.com/)에 접속
2. 새 프로젝트 생성 또는 기존 프로젝트 선택
3. "APIs & Services" > "Credentials"로 이동
4. "Create Credentials" > "OAuth client ID" 클릭

## 2. OAuth 2.0 클라이언트 ID 생성

1. Application type: "Web application" 선택
2. Name: "euo-oma" (원하는 이름)
3. Authorized JavaScript origins:
   - `http://localhost:3000` (개발용)
   - `https://euo-oma.github.io` (프로덕션용)
4. Authorized redirect URIs:
   - `http://localhost:3000/api/auth/callback/google` (개발용)
   - `https://euo-oma.github.io/blog/api/auth/callback/google` (프로덕션용)
5. "Create" 클릭

## 3. 환경 변수 설정

### 로컬 개발 환경

1. `.env.local` 파일 생성 (`.env.local.example` 참고)
2. 다음 내용 입력:

```
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your-secret-key-here
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
ADMIN_EMAIL=your-email@gmail.com
```

### GitHub 환경 변수 설정 (프로덕션)

1. GitHub 저장소 > Settings > Secrets and variables > Actions
2. "New repository secret" 클릭
3. 다음 시크릿 추가:
   - `NEXTAUTH_URL`: https://euo-oma.github.io/blog
   - `NEXTAUTH_SECRET`: 랜덤 문자열 (openssl rand -base64 32 명령으로 생성)
   - `GOOGLE_CLIENT_ID`: Google에서 받은 Client ID
   - `GOOGLE_CLIENT_SECRET`: Google에서 받은 Client Secret
   - `ADMIN_EMAIL`: 관리자 이메일 (로그인 허용할 이메일)

## 4. NextAuth Secret 생성 방법

터미널에서 다음 명령 실행:
```bash
openssl rand -base64 32
```

## 5. 주의사항

- `ADMIN_EMAIL`에 설정한 이메일로만 로그인 가능합니다
- `.env.local` 파일은 절대 Git에 커밋하지 마세요
- GitHub Pages는 서버 기능을 지원하지 않으므로, 실제 인증은 로컬 개발 환경에서만 작동합니다
- 프로덕션에서 인증 기능을 사용하려면 Vercel, Netlify 등의 서버리스 플랫폼을 사용하세요