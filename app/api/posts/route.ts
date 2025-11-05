import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'
import fs from 'fs'
import path from 'path'

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { title, excerpt, content, tags } = await request.json()

    // 슬러그 생성 (한글 지원)
    const slug = title
      .toLowerCase()
      .replace(/[^\wㄱ-ㅎㅏ-ㅣ가-힣\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim()

    const date = new Date().toISOString()

    // 프론트매터 생성
    const frontMatter = `---
title: "${title}"
date: "${date}"
excerpt: "${excerpt}"
tags: [${tags.map((tag: string) => `"${tag}"`).join(', ')}]
---

${content}`

    // 파일 저장
    const postsDir = path.join(process.cwd(), 'content/posts')
    if (!fs.existsSync(postsDir)) {
      fs.mkdirSync(postsDir, { recursive: true })
    }

    const filePath = path.join(postsDir, `${slug}.md`)
    
    // 파일이 이미 존재하는 경우 숫자 추가
    let finalSlug = slug
    let counter = 1
    while (fs.existsSync(path.join(postsDir, `${finalSlug}.md`))) {
      finalSlug = `${slug}-${counter}`
      counter++
    }

    fs.writeFileSync(path.join(postsDir, `${finalSlug}.md`), frontMatter)

    return NextResponse.json({ slug: finalSlug })
  } catch (error) {
    console.error('Error creating post:', error)
    return NextResponse.json({ error: 'Failed to create post' }, { status: 500 })
  }
}