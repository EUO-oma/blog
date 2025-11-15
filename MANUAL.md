# EUO-OMA Blog 프로젝트 매뉴얼

## 목차
1. [프로젝트 개요](#프로젝트-개요)
2. [기술 스택](#기술-스택)
3. [주요 기능](#주요-기능)
4. [핵심 함수 및 컴포넌트](#핵심-함수-및-컴포넌트)
5. [오류 해결 과정](#오류-해결-과정)
6. [개발 및 배포](#개발-및-배포)
7. [주의사항](#주의사항)

## 프로젝트 개요

Next.js 기반의 개인 블로그 시스템으로 Firebase를 백엔드로 사용합니다.

### 주요 URL
- 프로덕션: https://euo-oma.github.io/blog
- GitHub: https://github.com/EUO-oma/blog
- Firebase Console: https://console.firebase.google.com (프로젝트: euo-oma-blog)

## 기술 스택

- **Frontend**: Next.js 14, React 18, TypeScript
- **Styling**: Tailwind CSS
- **Backend**: Firebase (Firestore, Authentication)
- **Deployment**: GitHub Pages, GitHub Actions
- **Authentication**: Firebase Auth (Google OAuth)

## 주요 기능

### 1. 블로그 포스트 관리
- 포스트 작성/수정/삭제
- 마크다운 지원
- 태그 기능
- 실시간 업데이트

### 2. 일정 관리
- 일정 추가/수정/삭제
- 오늘의 일정 하이라이트
- 모바일 최적화 뷰
- Excel/CSV 내보내기

### 3. YouTube 비디오 관리
- 비디오 URL 저장
- 제목/설명 관리
- 플레이어 통합

### 4. 인증 시스템
- Google 로그인
- 사용자별 권한 관리

## 핵심 함수 및 컴포넌트

### Firebase 관련

#### `lib/firebase.ts`
```typescript
// Firebase 초기화
const app = initializeApp(firebaseConfig)
export const db = getFirestore(app)
export const auth = getAuth(app)
```

#### `lib/firebase-posts.ts`
```typescript
// 포스트 가져오기
export async function getPosts(isAdmin = false): Promise<BlogPost[]> {
  const postsRef = collection(db, POSTS_COLLECTION)
  const snapshot = await getDocs(postsRef)
  // 클라이언트 사이드 정렬
  posts.sort((a, b) => {
    const aTime = a.createdAt?.toMillis() || 0
    const bTime = b.createdAt?.toMillis() || 0
    return bTime - aTime
  })
  return posts
}
```

#### `lib/firebase-schedules.ts`
```typescript
// 일정 가져오기 (에러 처리 강화)
export async function getSchedules(): Promise<Schedule[]> {
  try {
    const q = query(
      collection(db, 'schedules'),
      orderBy('startDate', 'asc')
    )
    const snapshot = await getDocs(q)
    // Timestamp 유효성 검증
    return snapshot.docs.map(doc => {
      const data = doc.data()
      if (data.startDate && typeof data.startDate.toDate !== 'function') {
        console.warn(`Invalid startDate for schedule ${doc.id}`)
      }
      return { id: doc.id, ...data } as Schedule
    })
  } catch (error) {
    console.error('Error fetching schedules:', error)
    throw error
  }
}
```

### 주요 컴포넌트

#### `app/page.tsx` - 메인 페이지
```typescript
export default function HomePage() {
  const [posts, setPosts] = useState<BlogPost[]>([])
  
  const loadPosts = async () => {
    const fetchedPosts = await getPosts()
    setPosts(fetchedPosts)
  }
  
  useEffect(() => {
    loadPosts()
  }, [])
}
```

#### `app/schedule/page.tsx` - 일정 페이지
```typescript
// 날짜 포맷팅 with 에러 처리
const formatDate = (timestamp: any) => {
  try {
    if (!timestamp) return '날짜 없음'
    if (typeof timestamp.toDate !== 'function') return '잘못된 날짜'
    const date = timestamp.toDate()
    if (isNaN(date.getTime())) return '유효하지 않은 날짜'
    return date.toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    })
  } catch (error) {
    console.error('Error formatting date:', error)
    return '날짜 오류'
  }
}
```

### 인증 컨텍스트

#### `contexts/AuthContext.tsx`
```typescript
export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null)
  
  const login = async () => {
    const provider = new GoogleAuthProvider()
    const result = await signInWithPopup(auth, provider)
    return result.user
  }
}
```

## 오류 해결 과정

### 1. 포스트가 표시되지 않는 문제 (2025-11-15)

**문제**: 메인 페이지에서 Firebase 포스트가 로드되지 않음

**원인**: 
- 복잡한 페이지네이션 로직과 복합 인덱스 문제
- `published` + `createdAt` 복합 쿼리에 대한 Firestore 인덱스 부재

**해결**:
1. `getPostsPaginated` → `getPosts`로 단순화
2. 클라이언트 사이드 정렬 적용
3. 복합 쿼리 제거

### 2. 일정 페이지 React Hook 오류

**문제**: "Invalid hook call" 에러 발생

**원인**: 
```typescript
// 잘못된 코드
if (loading) return <Loading />
const [isMobile, setIsMobile] = useState(false) // Hook이 조건문 뒤에 위치
```

**해결**:
```typescript
// 올바른 코드
const [isMobile, setIsMobile] = useState(false) // 모든 Hook을 최상단에
if (loading) return <Loading />
```

### 3. 일정 페이지 간헐적 오류

**문제**: 때때로 일정이 로드되지 않거나 에러 발생

**원인**:
- Timestamp 객체 유효성 검증 부재
- Firebase 초기화 타이밍 문제
- 날짜 형식 오류 미처리

**해결**:
1. 모든 날짜 처리에 try-catch 추가
2. Timestamp 유효성 검증 로직 추가
3. Firebase 초기화 대기 시간 추가 (100ms)
4. 에러 상태 관리 및 재시도 기능

### 4. YouTube 페이지 빌드 오류

**문제**: TypeScript 및 Suspense 관련 에러

**해결**:
```typescript
// Suspense boundary 추가
export default function YouTubePlayerPage() {
  return (
    <Suspense fallback={<Loading />}>
      <YouTubePlayer />
    </Suspense>
  )
}
```

## 개발 및 배포

### 개발 환경 실행
```bash
npm install
npm run dev  # http://localhost:3000
```

### 빌드
```bash
npm run build
```

### 배포 프로세스
1. `git add -A`
2. `git commit -m "커밋 메시지"`
3. `git push origin main`
4. GitHub Actions 자동 빌드/배포 (5-10분)
5. https://github.com/EUO-oma/blog/actions 에서 진행 상황 확인

### 환경 변수 (.env.local)
```
NEXT_PUBLIC_FIREBASE_API_KEY=
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=
NEXT_PUBLIC_FIREBASE_PROJECT_ID=
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=
NEXT_PUBLIC_FIREBASE_APP_ID=
```

## 주의사항

### 1. Firebase 관련
- Firestore 복합 인덱스는 첫 쿼리 시 자동으로 생성 링크 제공
- 보안 규칙은 `firestore.rules` 파일 참조
- Firebase 초기화는 한 번만 실행되도록 주의

### 2. React/Next.js 관련
- Hook은 항상 컴포넌트 최상단에 선언
- `useSearchParams`는 Suspense boundary 필요
- 클라이언트 컴포넌트는 `'use client'` 명시

### 3. 배포 관련
- GitHub Pages는 정적 사이트만 지원
- `next.config.js`의 `output: 'export'` 설정 필수
- 이미지는 public 폴더 또는 외부 URL 사용

### 4. 성능 최적화
- 대용량 목록은 페이지네이션 고려
- 이미지는 Next.js Image 컴포넌트 사용
- 불필요한 re-render 방지 (React.memo, useMemo)

## 추가 개발 시 참고사항

### 새로운 컬렉션 추가 시
1. TypeScript 인터페이스 정의 (`lib/firebase.ts`)
2. CRUD 함수 생성 (`lib/firebase-[collection].ts`)
3. Firestore 보안 규칙 업데이트
4. 필요시 인덱스 생성

### 에러 처리 패턴
```typescript
try {
  // Firebase 작업
} catch (error) {
  console.error('Detailed error:', error)
  if (error.code === 'permission-denied') {
    // 권한 오류 처리
  }
  throw error // 또는 기본값 반환
}
```

### 날짜 처리 패턴
```typescript
// 항상 유효성 검증 포함
if (timestamp && typeof timestamp.toDate === 'function') {
  const date = timestamp.toDate()
  if (!isNaN(date.getTime())) {
    return date.toLocaleDateString('ko-KR')
  }
}
return '날짜 없음'
```

---

작성일: 2025-11-15
작성자: Claude Code & EUO-oma