# Firebase Firestore 보안 규칙 설정

Firebase Console에서 다음 보안 규칙을 설정해주세요:

1. [Firebase Console](https://console.firebase.google.com/project/euo-oma-blog/firestore/rules) 접속
2. 다음 규칙으로 업데이트:

```
rules_version = '2';

service cloud.firestore {
  match /databases/{database}/documents {
    // 모든 사용자가 읽기 가능
    match /posts/{document=**} {
      allow read: if true;
      
      // 로그인한 사용자만 쓰기 가능 (나중에 수정)
      // allow write: if request.auth != null;
      
      // 임시로 모든 사용자 쓰기 허용
      allow write: if true;
    }
  }
}
```

3. "게시" 버튼 클릭

## 프로덕션 환경용 보안 규칙 (나중에 적용)

```
rules_version = '2';

service cloud.firestore {
  match /databases/{database}/documents {
    match /posts/{document=**} {
      allow read: if resource.data.published == true || request.auth != null;
      allow create: if request.auth != null;
      allow update: if request.auth != null && request.auth.uid == resource.data.authorId;
      allow delete: if request.auth != null && request.auth.uid == resource.data.authorId;
    }
  }
}
```