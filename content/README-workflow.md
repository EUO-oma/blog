# Content Workflow (Obsidian -> GitHub Blog)

## 폴더
- content/inbox: 초안 수집
- content/review: 검토/수정
- content/ready: 게시 준비 완료
- content/posts: 실제 게시 경로
- content/archive: 게시 후 보관
- content/templates: 템플릿

## 운영
1) Obsidian Publish/Ready 또는 blog/content/ready 에 md 배치
2) scripts/publish-sync.ps1 실행
3) ready -> posts 이동(동일 파일명 충돌 시 날짜 suffix)
4) git commit/push 하면 Pages 배포
