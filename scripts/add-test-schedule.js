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

// 테스트 일정 추가
async function addTestSchedules() {
  try {
    console.log('🚀 Starting to add test schedules...');
    
    // 오늘 날짜 기준으로 일정 생성
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    // 테스트 일정 데이터 배열
    const testSchedules = [
      {
        title: "팀 미팅",
        description: "주간 프로젝트 진행 상황 공유 및 다음 주 계획 논의",
        startDate: Timestamp.fromDate(new Date(today.getTime() + 2 * 24 * 60 * 60 * 1000)), // 2일 후
        endDate: Timestamp.fromDate(new Date(today.getTime() + 2 * 24 * 60 * 60 * 1000 + 2 * 60 * 60 * 1000)), // 2시간 후
        location: "회의실 A",
        color: "#3B82F6", // blue
        authorEmail: "icandoit13579@gmail.com",
        authorName: "EUO-oma",
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now()
      },
      {
        title: "프로젝트 마감일",
        description: "블로그 개발 1차 완료 및 배포",
        startDate: Timestamp.fromDate(new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000)), // 1주일 후
        location: "온라인",
        color: "#EF4444", // red
        authorEmail: "icandoit13579@gmail.com",
        authorName: "EUO-oma",
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now()
      },
      {
        title: "코드 리뷰",
        description: "Firebase 통합 및 일정 관리 기능 코드 리뷰",
        startDate: Timestamp.fromDate(new Date(today.getTime() + 3 * 24 * 60 * 60 * 1000)), // 3일 후
        endDate: Timestamp.fromDate(new Date(today.getTime() + 3 * 24 * 60 * 60 * 1000 + 1 * 60 * 60 * 1000)), // 1시간 후
        location: "Zoom",
        color: "#10B981", // green
        authorEmail: "icandoit13579@gmail.com",
        authorName: "EUO-oma",
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now()
      },
      {
        title: "기술 스터디",
        description: "Next.js 14 새로운 기능 학습 및 적용 방안 논의",
        startDate: Timestamp.fromDate(new Date(today.getTime() + 5 * 24 * 60 * 60 * 1000)), // 5일 후
        endDate: Timestamp.fromDate(new Date(today.getTime() + 5 * 24 * 60 * 60 * 1000 + 3 * 60 * 60 * 1000)), // 3시간 후
        location: "스터디룸 B",
        color: "#8B5CF6", // purple
        authorEmail: "icandoit13579@gmail.com",
        authorName: "EUO-oma",
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now()
      },
      {
        title: "휴가",
        description: "연차 휴가",
        startDate: Timestamp.fromDate(new Date(today.getTime() + 14 * 24 * 60 * 60 * 1000)), // 2주 후
        endDate: Timestamp.fromDate(new Date(today.getTime() + 16 * 24 * 60 * 60 * 1000)), // 3일간
        color: "#F59E0B", // amber
        authorEmail: "icandoit13579@gmail.com",
        authorName: "EUO-oma",
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now()
      }
    ];

    // 각 일정을 Firebase에 추가
    for (const schedule of testSchedules) {
      const docRef = await addDoc(collection(db, 'schedules'), schedule);
      console.log(`✅ 일정 추가됨: "${schedule.title}" (ID: ${docRef.id})`);
    }

    console.log(`\n🎉 총 ${testSchedules.length}개의 테스트 일정이 추가되었습니다.`);
    console.log("📅 블로그에서 확인하세요: https://euo-oma.github.io/blog/schedule");
    process.exit(0);
  } catch (error) {
    console.error("❌ Error adding schedules:", error);
    console.error("Error details:", error.message);
    process.exit(1);
  }
}

// 스크립트 실행
addTestSchedules();