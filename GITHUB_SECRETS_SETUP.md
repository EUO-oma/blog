# GitHub Secrets 설정 가이드

GitHub Pages에서 Firebase가 작동하려면 환경 변수를 GitHub Secrets에 추가해야 합니다.

## 설정 방법

1. GitHub 저장소 페이지 접속: https://github.com/EUO-oma/blog

2. Settings → Secrets and variables → Actions

3. "New repository secret" 클릭

4. 다음 Secrets 추가 (`.env.local` 파일의 값 복사):

   - **NEXT_PUBLIC_FIREBASE_API_KEY**
     - Value: `AIzaSyAjO06gbmZrl6c4oHlG4FBfVDLZktcILyY`
   
   - **NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN**
     - Value: `euo-oma-blog.firebaseapp.com`
   
   - **NEXT_PUBLIC_FIREBASE_PROJECT_ID**
     - Value: `euo-oma-blog`
   
   - **NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET**
     - Value: `euo-oma-blog.firebasestorage.app`
   
   - **NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID**
     - Value: `571362546310`
   
   - **NEXT_PUBLIC_FIREBASE_APP_ID**
     - Value: `1:571362546310:web:33aa43eb0d11a9ee243707`

5. GitHub Pages 활성화:
   - Settings → Pages
   - Source: GitHub Actions 선택

## 배포 확인

1. Actions 탭에서 배포 상태 확인
2. 배포 완료 후: https://EUO-oma.github.io/blog 접속

## 주의사항

- Firebase 보안 규칙이 적절히 설정되어 있어야 합니다
- 첫 배포는 몇 분 정도 소요될 수 있습니다