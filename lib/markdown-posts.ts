import fs from 'fs'
import path from 'path'
import matter from 'gray-matter'
import { BlogPost } from './firebase'
import { Timestamp } from 'firebase/firestore'

const postsDirectory = path.join(process.cwd(), 'content/posts')

export interface MarkdownPost {
  slug: string
  frontmatter: {
    title: string
    date: string
    excerpt: string
    tags: string[]
    published?: boolean
  }
  content: string
}

export function getMarkdownPosts(): MarkdownPost[] {
  try {
    // content/posts 디렉토리가 없으면 빈 배열 반환
    if (!fs.existsSync(postsDirectory)) {
      return []
    }

    const fileNames = fs.readdirSync(postsDirectory)
    const allPostsData = fileNames
      .filter(fileName => fileName.endsWith('.md'))
      .map(fileName => {
        const slug = fileName.replace(/\.md$/, '')
        const fullPath = path.join(postsDirectory, fileName)
        const fileContents = fs.readFileSync(fullPath, 'utf8')
        const { data, content } = matter(fileContents)

        return {
          slug,
          frontmatter: {
            title: data.title || slug,
            date: data.date || new Date().toISOString(),
            excerpt: data.excerpt || '',
            tags: data.tags || [],
            published: data.published !== false
          },
          content
        }
      })
      .filter(post => post.frontmatter.published)
      .sort((a, b) => {
        return new Date(b.frontmatter.date).getTime() - new Date(a.frontmatter.date).getTime()
      })

    return allPostsData
  } catch (error) {
    console.error('Error reading markdown posts:', error)
    return []
  }
}

export function getMarkdownPost(slug: string): MarkdownPost | null {
  try {
    const fullPath = path.join(postsDirectory, `${slug}.md`)
    
    if (!fs.existsSync(fullPath)) {
      return null
    }

    const fileContents = fs.readFileSync(fullPath, 'utf8')
    const { data, content } = matter(fileContents)

    return {
      slug,
      frontmatter: {
        title: data.title || slug,
        date: data.date || new Date().toISOString(),
        excerpt: data.excerpt || '',
        tags: data.tags || [],
        published: data.published !== false
      },
      content
    }
  } catch (error) {
    console.error('Error reading markdown post:', error)
    return null
  }
}

// 마크다운 포스트를 BlogPost 형식으로 변환
export function convertMarkdownToBlogPost(mdPost: MarkdownPost): BlogPost {
  return {
    id: mdPost.slug,
    title: mdPost.frontmatter.title,
    slug: mdPost.slug,
    excerpt: mdPost.frontmatter.excerpt,
    content: mdPost.content,
    tags: mdPost.frontmatter.tags,
    authorEmail: 'obsidian@local',
    authorName: 'Obsidian User',
    createdAt: Timestamp.fromDate(new Date(mdPost.frontmatter.date)),
    updatedAt: Timestamp.fromDate(new Date(mdPost.frontmatter.date)),
    published: mdPost.frontmatter.published || true
  }
}