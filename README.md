# euo-oma

A modern blog built with Next.js 14, TypeScript, and Tailwind CSS.

## Features

- 🌗 Dark mode support
- 📱 Responsive design
- 🚀 Fast performance with Server Components
- 📝 Markdown support for blog posts
- 🏷️ Tag system
- 🎨 Beautiful UI with Tailwind CSS

## Getting Started

### Prerequisites

- Node.js 18+ 
- npm or yarn

### Installation

1. Clone the repository:
```bash
git clone https://github.com/EUO-oma/blog.git
cd blog
```

2. Install dependencies:
```bash
npm install
```

3. Run the development server:
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to view your blog.

## Writing Posts

Create markdown files in the `content/posts` directory:

```markdown
---
title: "Your Post Title"
date: "2024-01-01"
excerpt: "A brief description of your post"
tags: ["tag1", "tag2"]
---

Your post content here...
```

## Deployment

The easiest way to deploy is using [Vercel](https://vercel.com):

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/EUO-oma/blog)

## Tech Stack

- **Next.js 14** - React framework
- **TypeScript** - Type safety
- **Tailwind CSS** - Styling
- **React Markdown** - Markdown rendering
- **Gray Matter** - Frontmatter parsing

## Walter Board (Supabase)

`/walter-board` 페이지에서 `walter_commands` 데이터를 게시판 형태로 볼 수 있습니다.

필수 환경변수 (`.env.local`):

```bash
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_jwt_key
```

실행 후 접속:
- `http://localhost:3000/walter-board`

## IMG Board (Cloudflare R2)

`/img` 페이지에서 이미지 게시판을 사용할 수 있습니다.

필수 환경변수 (`.env.local`):

```bash
NEXT_PUBLIC_R2_SIGNER_URL=https://your-signer.example.workers.dev
NEXT_PUBLIC_R2_SIGNER_TOKEN=your_signer_bearer_token
```

업로드 흐름:
1. 앱이 signer API(`/sign`)에 파일 메타데이터 전송
2. signer가 presigned PUT URL + public URL + objectKey 반환
3. 브라우저가 R2로 직접 PUT 업로드
4. Firestore `images` 컬렉션에 메타데이터 저장

### Cloudflare Worker signer 배포

레포에 샘플 워커가 포함되어 있습니다:
- `cloudflare-r2-signer/worker.js`
- `cloudflare-r2-signer/wrangler.toml`

배포 예시:

```bash
cd cloudflare-r2-signer
npm i -g wrangler
wrangler login
wrangler secret put SIGNER_TOKEN
# wrangler.toml 의 bucket_name / PUBLIC_BASE_URL 수정 후
wrangler deploy
```

배포 후 앱 `.env.local` 예시:

```bash
NEXT_PUBLIC_R2_SIGNER_URL=https://euo-r2-signer.<your-subdomain>.workers.dev
NEXT_PUBLIC_R2_SIGNER_TOKEN=<SIGNER_TOKEN과 동일값>
```

## License

MIT