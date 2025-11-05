# Obsidian과 GitHub 블로그 연동 가이드

## 방법 1: Obsidian Git 플러그인 사용 (추천)

### 1. Obsidian Git 플러그인 설치
1. Obsidian 설정 → 커뮤니티 플러그인 → 검색: "Git"
2. "Obsidian Git" 설치 및 활성화

### 2. GitHub 저장소 설정
```bash
# Obsidian 보관함 폴더에서
git init
git remote add origin https://github.com/EUO-oma/blog.git
git pull origin main
```

### 3. 자동 동기화 설정
- 설정 → Obsidian Git
- Auto backup after file change: 5분
- Auto pull interval: 10분

### 4. 블로그 글 작성 워크플로우
1. Obsidian에서 `content/posts/` 폴더에 `.md` 파일 작성
2. 자동으로 GitHub에 push
3. 블로그가 자동으로 업데이트

## 방법 2: 별도 Obsidian 보관함 + 동기화 스크립트

### 1. 폴더 구조
```
/Users/iuo/Documents/
├── ObsidianVault/          # Obsidian 보관함
│   └── Blog/               # 블로그 글
│       ├── 2024-01-01-첫글.md
│       └── 2024-01-02-둘째글.md
└── EUOvaultSYNC/1 Project/blog/  # GitHub 블로그
    └── content/posts/      # 블로그 포스트
```

### 2. 동기화 스크립트 생성
`sync-obsidian-to-blog.sh`:
```bash
#!/bin/bash
OBSIDIAN_BLOG="/Users/iuo/Documents/ObsidianVault/Blog"
GITHUB_BLOG="/Users/iuo/Documents/EUOvaultSYNC/1 Project/blog/content/posts"

# Obsidian의 md 파일을 블로그로 복사
cp "$OBSIDIAN_BLOG"/*.md "$GITHUB_BLOG/"

# Git 커밋 및 푸시
cd "/Users/iuo/Documents/EUOvaultSYNC/1 Project/blog"
git add -A
git commit -m "Update blog posts from Obsidian"
git push origin main
```

## 방법 3: Obsidian 파일을 직접 GitHub Pages로 배포

### Jekyll 사용 (GitHub Pages 기본)
1. Obsidian 보관함을 GitHub 저장소로 만들기
2. `_config.yml` 추가:
```yaml
title: My Obsidian Blog
theme: minima
markdown: kramdown
```

3. GitHub Pages 활성화
4. https://username.github.io/repository-name 에서 확인

## 현재 블로그와 Obsidian 연동하기

### 옵션 1: 로컬 마크다운 파일 사용
1. Firebase 대신 로컬 마크다운 파일 읽기
2. `content/posts/` 폴더의 `.md` 파일을 자동으로 블로그 포스트로 변환

### 옵션 2: 하이브리드 방식
1. Obsidian → GitHub (마크다운 파일)
2. 블로그에서 마크다운 파일 읽기
3. Firebase는 댓글, 조회수 등 동적 데이터만 저장

## 추천 설정

1. **Obsidian 템플릿** 만들기:
```markdown
---
title: "제목"
date: {{date}}
tags: []
excerpt: "요약"
published: true
---

# {{title}}

내용...
```

2. **자동화 도구**:
- macOS: Automator 또는 launchd
- Windows: Task Scheduler
- 크로스 플랫폼: Node.js 스크립트

이렇게 하면 Obsidian에서 편하게 글을 쓰고, 자동으로 블로그에 게시할 수 있습니다!