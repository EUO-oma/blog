# Firebase Schedules 컬렉션 설정 가이드

## 1. Firebase Console에서 schedules 컬렉션 생성

### 단계별 설정 방법:

1. **Firebase Console 접속**
   - https://console.firebase.google.com
   - `euo-oma-blog` 프로젝트 선택

2. **Firestore Database로 이동**
   - 좌측 메뉴에서 "Firestore Database" 클릭

3. **컬렉션 생성**
   - "Start collection" 버튼 클릭 (또는 기존 컬렉션 옆의 + 버튼)
   - Collection ID: `schedules` 입력
   - "Next" 클릭

4. **첫 번째 문서 생성** (테스트용)
   - Document ID: "Auto-ID" 클릭하여 자동 생성
   - 필드 추가:
     ```
     title: "테스트 일정" (string)
     description: "테스트 설명입니다" (string)
     startDate: 현재 날짜/시간 선택 (timestamp)
     endDate: null 또는 미래 날짜 (timestamp)
     location: "회의실" (string)
     color: "#6366f1" (string)
     authorEmail: "test@example.com" (string)
     authorName: "테스트 사용자" (string)
     createdAt: 현재 날짜/시간 (timestamp)
     updatedAt: 현재 날짜/시간 (timestamp)
     ```
   - "Save" 클릭

5. **인덱스 생성** (필요한 경우)
   - "Indexes" 탭으로 이동
   - "Create Index" 클릭
   - Collection ID: `schedules`
   - Fields to index:
     - Field path: `startDate`
     - Order: Ascending
   - Query scope: Collection
   - "Create" 클릭

## 2. 보안 규칙 확인

"Rules" 탭에서 다음 규칙이 있는지 확인:

```javascript
match /schedules/{scheduleId} {
  allow read: if true;
  allow create: if request.auth != null;
  allow update: if request.auth != null && 
    request.auth.token.email == resource.data.authorEmail;
  allow delete: if request.auth != null && 
    request.auth.token.email == resource.data.authorEmail;
}
```

## 3. 테스트

1. 블로그에서 로그인
2. "일정" 메뉴 클릭
3. "새 일정 추가" 버튼 클릭
4. 일정 정보 입력 후 저장
5. 정상적으로 표시되는지 확인

## 문제 해결

### "Missing or insufficient permissions" 오류
- Rules 탭에서 보안 규칙 재확인
- 규칙 게시 후 1-2분 대기

### 일정이 표시되지 않을 때
- Console에서 schedules 컬렉션에 문서가 있는지 확인
- 브라우저 개발자 도구 콘솔에서 오류 확인
- Firebase 프로젝트 ID가 올바른지 확인