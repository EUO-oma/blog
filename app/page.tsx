import Link from 'next/link'
import { getPosts } from '@/lib/posts'

export default async function HomePage() {
  const posts = await getPosts()

  return (
    <div className="space-y-8">
      <section className="text-center py-16">
        <h1 className="text-5xl font-bold mb-4 bg-gradient-to-r from-indigo-500 to-purple-600 bg-clip-text text-transparent">
          Welcome to euo-oma
        </h1>
        <p className="text-xl text-gray-600 dark:text-gray-400">
          Thoughts, stories, and ideas
        </p>
      </section>

      <section className="grid gap-6">
        {posts.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-gray-600 dark:text-gray-400">No posts yet. Check back later!</p>
          </div>
        ) : (
          posts.map((post) => (
            <article
              key={post.slug}
              className="p-6 bg-white dark:bg-gray-900 rounded-lg shadow-sm hover:shadow-md transition-shadow"
            >
              <Link href={`/posts/${post.slug}`} className="space-y-3">
                <div>
                  <h2 className="text-2xl font-semibold hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">
                    {post.title}
                  </h2>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                    {new Date(post.date).toLocaleDateString('ko-KR', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    })}
                  </p>
                </div>
                <p className="text-gray-600 dark:text-gray-300 line-clamp-2">
                  {post.excerpt}
                </p>
                <div className="flex gap-2">
                  {post.tags?.map((tag) => (
                    <span
                      key={tag}
                      className="text-xs px-2 py-1 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 rounded-full"
                    >
                      #{tag}
                    </span>
                  ))}
                </div>
              </Link>
            </article>
          ))
        )}
      </section>
    </div>
  )
}