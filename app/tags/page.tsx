import { getPosts } from '@/lib/posts';
import Link from 'next/link';

export default async function TagsPage() {
  const posts = await getPosts();

  // Extract all unique tags
  const tagsCount = posts.reduce(
    (acc, post) => {
      post.tags?.forEach((tag) => {
        acc[tag] = (acc[tag] || 0) + 1;
      });
      return acc;
    },
    {} as Record<string, number>
  );

  const sortedTags = Object.entries(tagsCount).sort((a, b) => b[1] - a[1]);

  return (
    <div className="max-w-3xl mx-auto">
      <h1 className="text-4xl font-bold mb-8">Tags</h1>

      {sortedTags.length === 0 ? (
        <p className="text-gray-600 dark:text-gray-400">No tags yet.</p>
      ) : (
        <div className="flex flex-wrap gap-4">
          {sortedTags.map(([tag, count]) => (
            <Link
              key={tag}
              href={`/tags/${tag}`}
              className="group px-4 py-2 bg-gray-100 dark:bg-gray-800 rounded-lg hover:bg-indigo-100 dark:hover:bg-indigo-900/30 transition-colors"
            >
              <span className="text-lg font-medium group-hover:text-indigo-600 dark:group-hover:text-indigo-400">
                #{tag}
              </span>
              <span className="ml-2 text-sm text-gray-600 dark:text-gray-400">
                ({count})
              </span>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
