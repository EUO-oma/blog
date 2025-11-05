const { initializeApp } = require('firebase/app');
const { getFirestore, collection, addDoc, Timestamp } = require('firebase/firestore');

// Firebase 설정
const firebaseConfig = {
  apiKey: "AIzaSyAjO06gbmZrl6c4oHlG4FBfVDLZktcILyY",
  authDomain: "euo-oma-blog.firebaseapp.com",
  projectId: "euo-oma-blog",
  storageBucket: "euo-oma-blog.firebasestorage.app",
  messagingSenderId: "571362546310",
  appId: "1:571362546310:web:33aa43eb0d11a9ee243707"
};

// Firebase 초기화
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// 테스트 포스트 추가
async function addTestPost() {
  try {
    const testPost = {
      title: "Firebase 연동 테스트",
      slug: "firebase-test",
      excerpt: "Firebase와 블로그가 성공적으로 연동되었습니다!",
      content: `# Firebase 연동 테스트

안녕하세요! 이것은 Firebase Firestore에 저장된 첫 번째 테스트 포스트입니다.

## 주요 기능

- **실시간 데이터베이스**: Firebase Firestore 사용
- **인증**: Google OAuth를 통한 관리자 인증
- **보안**: Firestore 보안 규칙으로 보호

## 테스트 완료

Firebase와 블로그가 성공적으로 연동되었습니다. 이제 클라우드 기반으로 블로그를 운영할 수 있습니다!

### 마크다운 지원

- **굵은 글씨**
- *이탤릭*
- \`코드\`

\`\`\`javascript
console.log('Hello Firebase!');
\`\`\`

이제 블로그에서 글을 작성하고 관리할 수 있습니다.`,
      tags: ["Firebase", "테스트", "블로그"],
      authorEmail: "icandoit13579@gmail.com",
      authorName: "EUO-oma",
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
      published: true
    };

    const docRef = await addDoc(collection(db, 'posts'), testPost);
    console.log("테스트 포스트가 추가되었습니다. ID:", docRef.id);
    console.log("블로그에서 확인하세요: https://euo-oma.github.io/blog");
    process.exit(0);
  } catch (error) {
    console.error("Error adding document:", error);
    process.exit(1);
  }
}

addTestPost();