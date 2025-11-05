# Firebase 설정 가이드

## 1. Firebase 프로젝트 생성

1. [Firebase Console](https://console.firebase.google.com/)에 접속
2. "프로젝트 만들기" 클릭
3. 프로젝트 이름 입력 (예: euo-oma-blog)
4. Google Analytics 설정 (선택사항)
5. 프로젝트 생성 완료

## 2. Firebase 웹 앱 추가

1. Firebase Console에서 프로젝트 선택
2. 프로젝트 설정 > 일반 > 내 앱 > 웹 아이콘 클릭
3. 앱 닉네임 입력 (예: euo-oma-blog-web)
4. Firebase SDK 구성 정보 복사

## 3. Firestore Database 설정

1. Firebase Console > Firestore Database
2. "데이터베이스 만들기" 클릭
3. 프로덕션 모드로 시작
4. 위치 선택 (asia-northeast3 - Seoul 권장)

## 4. Firestore 보안 규칙 설정

Firebase Console > Firestore Database > 규칙 탭에서 다음 규칙 설정:

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // 모든 사용자가 발행된 포스트 읽기 가능
    match /posts/{postId} {
      allow read: if resource.data.published == true;
      
      // 인증된 관리자만 쓰기 가능
      allow write: if request.auth != null && 
        request.auth.token.email == "your-email@gmail.com";
    }
  }
}
```

## 5. 환경 변수 설정

`.env.local` 파일에 Firebase 구성 추가:

```
NEXT_PUBLIC_FIREBASE_API_KEY=your-api-key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your-auth-domain.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your-project-id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your-storage-bucket.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your-sender-id
NEXT_PUBLIC_FIREBASE_APP_ID=your-app-id
```

## 6. GitHub Secrets 설정 (프로덕션)

GitHub 저장소 > Settings > Secrets and variables > Actions에서 다음 추가:

- NEXT_PUBLIC_FIREBASE_API_KEY
- NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN
- NEXT_PUBLIC_FIREBASE_PROJECT_ID
- NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET
- NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID
- NEXT_PUBLIC_FIREBASE_APP_ID

## 7. Firestore 인덱스

필요시 Firebase Console에서 복합 인덱스 생성:
- Collection: posts
- Fields: published (Ascending), createdAt (Descending)

## 주의사항

- Firebase 무료 요금제: 일일 읽기 50,000회, 쓰기 20,000회
- 보안 규칙에서 관리자 이메일을 정확히 설정
- API 키는 클라이언트에 노출되지만, 보안 규칙으로 보호됨