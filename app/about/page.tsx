export default function AboutPage() {
  return (
    <div className="max-w-3xl mx-auto">
      <h1 className="text-4xl font-bold mb-8">About Me</h1>
      
      <div className="prose dark:prose-dark max-w-none">
        <p className="text-lg leading-relaxed mb-6">
          안녕하세요! 저는 개발자이자 블로거입니다. 이 블로그에서는 기술, 개발, 
          그리고 일상에 대한 이야기를 공유합니다.
        </p>
        
        <h2 className="text-2xl font-semibold mt-8 mb-4">기술 스택</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 not-prose">
          {['React', 'Next.js', 'TypeScript', 'Node.js', 'Tailwind CSS', 'Git'].map((tech) => (
            <div
              key={tech}
              className="px-4 py-2 bg-gray-100 dark:bg-gray-800 rounded-lg text-center"
            >
              {tech}
            </div>
          ))}
        </div>
        
        <h2 className="text-2xl font-semibold mt-8 mb-4">연락처</h2>
        <ul>
          <li>
            Email: <a href="mailto:your@email.com" className="text-indigo-600 dark:text-indigo-400 hover:underline">
              your@email.com
            </a>
          </li>
          <li>
            GitHub: <a href="https://github.com/yourusername" target="_blank" rel="noopener noreferrer" className="text-indigo-600 dark:text-indigo-400 hover:underline">
              @yourusername
            </a>
          </li>
        </ul>
      </div>
    </div>
  )
}