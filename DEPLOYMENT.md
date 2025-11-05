# 블로그 배포 가이드

이 블로그는 Firebase를 사용하므로 정적 사이트로 export할 수 없습니다. 
다음 방법 중 하나를 선택하여 배포하세요:

## 방법 1: Vercel 배포 (추천)

1. [Vercel](https://vercel.com) 계정 생성
2. GitHub 저장소 연결
3. 환경 변수 설정 (Settings > Environment Variables):
   ```
   NEXT_PUBLIC_FIREBASE_API_KEY=your-api-key
   NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your-auth-domain
   NEXT_PUBLIC_FIREBASE_PROJECT_ID=your-project-id
   NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your-storage-bucket
   NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your-sender-id
   NEXT_PUBLIC_FIREBASE_APP_ID=your-app-id
   ```
4. Deploy 클릭

배포된 URL: https://your-project.vercel.app

## 방법 2: Netlify 배포

1. [Netlify](https://netlify.com) 계정 생성
2. GitHub 저장소 연결
3. Build settings:
   - Build command: `npm run build`
   - Publish directory: `.next`
4. 환경 변수 추가 (Site settings > Environment variables)

## 방법 3: Firebase Hosting

1. Firebase CLI 설치:
   ```bash
   npm install -g firebase-tools
   ```

2. Firebase 초기화:
   ```bash
   firebase init hosting
   ```

3. 빌드 및 배포:
   ```bash
   npm run build
   firebase deploy
   ```

## 로컬 테스트

```bash
npm run dev
```

http://localhost:3000 에서 확인

## Firebase 보안 규칙

배포 전에 Firebase Console에서 적절한 보안 규칙을 설정하세요.
`FIREBASE_RULES.md` 파일 참조