# Firestore 인덱스 설정 가이드

## schedules 컬렉션 인덱스 설정

Firebase Console에서 다음 단계를 따라 인덱스를 생성해주세요:

### 1. Firebase Console 접속
- https://console.firebase.google.com
- `euo-oma-blog` 프로젝트 선택
- Firestore Database 메뉴 클릭

### 2. 인덱스 탭으로 이동
- 상단의 "Indexes" 탭 클릭
- "Create Index" 버튼 클릭

### 3. schedules 컬렉션 인덱스 생성

#### 인덱스 1: startDate 정렬
- Collection ID: `schedules`
- Fields to index:
  - Field path: `startDate`
  - Order: Ascending
- Query scope: Collection
- "Create" 클릭

#### 인덱스 2: 날짜 범위 쿼리 (필요한 경우)
- Collection ID: `schedules`
- Fields to index:
  - Field path: `startDate`
  - Order: Ascending
  - Field path: `endDate`
  - Order: Ascending
- Query scope: Collection
- "Create" 클릭

### 4. 보안 규칙 업데이트
Firestore Rules 탭에서 다음 규칙이 적용되어 있는지 확인:

```
match /schedules/{scheduleId} {
  allow read: if true;
  allow create: if request.auth != null;
  allow update: if request.auth != null && 
    request.auth.token.email == resource.data.authorEmail;
  allow delete: if request.auth != null && 
    request.auth.token.email == resource.data.authorEmail;
}
```

### 5. 일반적인 오류 해결

#### "Missing or insufficient permissions" 오류
- Firebase Console에서 Rules 탭 확인
- 위의 보안 규칙이 제대로 적용되었는지 확인
- 규칙 게시 후 1-2분 기다리기

#### "The query requires an index" 오류
- Console에 표시된 인덱스 생성 링크 클릭
- 자동으로 필요한 인덱스 생성 화면으로 이동
- "Create" 클릭 후 5-10분 대기

### 6. 테스트
1. 로그인 후 일정 페이지로 이동
2. "새 일정 추가" 버튼 클릭
3. 테스트 일정 생성
4. 정상적으로 저장되는지 확인