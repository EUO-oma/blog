'use client'

import { useEffect, useMemo, useState } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import LoaderSwitcher from '@/components/LoaderSwitcher'
import {
  createTodo,
  deleteTodo,
  getTodos,
  setTodoCompleted,
  setTodoStarred,
  TodoItem,
  updateTodo,
} from '@/lib/firebase-todos'

export default function TodoPage() {
  const { user } = useAuth()
  const [items, setItems] = useState<TodoItem[]>([])
  const [loading, setLoading] = useState(true)
  const [newText, setNewText] = useState('')
  const [msg, setMsg] = useState('')

  const load = async () => {
    if (!user?.email) {
      setItems([])
      setLoading(false)
      return
    }
    setLoading(true)
    try {
      const rows = await getTodos(user.email)
      setItems(rows)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.email])

  const addTodo = async () => {
    if (!user?.email) return setMsg('濡쒓렇?????ъ슜 媛?ν빐??')
    const content = newText.trim()
    if (!content) return

    await createTodo({
      content,
      authorEmail: user.email,
      authorName: user.displayName || user.email,
    })
    setNewText('')
    setMsg('異붽? ?꾨즺')
    await load()
  }

  const saveOnBlur = async (id: string | undefined, content: string) => {
    if (!id) return
    const next = content.trim()
    if (!next) {
      await deleteTodo(id)
      await load()
      return
    }
    await updateTodo(id, { content: next })
    setItems((prev) => prev.map((it) => (it.id === id ? { ...it, content: next } : it)))
  }

  const copyTodo = async (content: string) => {
    await navigator.clipboard.writeText(content)
    setMsg('?대┰蹂대뱶??蹂듭궗?섏뿀?듬땲??)
    setTimeout(() => setMsg(''), 1200)
  }

  const shareTodo = async (content: string) => {
    const nav = navigator as Navigator & { share?: (data: ShareData) => Promise<void> }
    if (nav.share) {
      await nav.share({ text: content })
      return
    }
    await copyTodo(content)
  }

  const activeItems = useMemo(() => items.filter((i) => !i.completed), [items])
  const completedItems = useMemo(() => items.filter((i) => i.completed), [items])

  if (!user) return <p className="text-gray-500">濡쒓렇????Todo瑜??ъ슜?????덉뼱??</p>

  return (
    <main className="max-w-4xl mx-auto space-y-4">
      <h1 className="text-2xl sm:text-3xl font-bold">Todo List</h1>

      <section className="rounded-lg border border-gray-200 dark:border-gray-700 p-3 bg-white dark:bg-gray-800">
        <form
          className="flex items-center gap-2"
          onSubmit={(e) => {
            e.preventDefault()
            addTodo()
          }}
        >
          <input
            value={newText}
            onChange={(e) => setNewText(e.target.value)}
            onBlur={addTodo}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && (e.nativeEvent as KeyboardEvent).isComposing) return
            }}
            placeholder="?????낅젰 ??Enter ?먮뒗 ?ㅻⅨ ?곸뿭 ?대┃"
            className="flex-1 px-3 py-2 rounded border dark:bg-gray-900 dark:border-gray-700"
          />
          <button
            type="submit"
            className="p-2 rounded-md bg-indigo-600 text-white hover:bg-indigo-700"
            title="?깅줉?섍린"
            aria-label="?깅줉?섍린"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M22 2 11 13" />
              <path d="m22 2-7 20-4-9-9-4Z" />
            </svg>
          </button>
        </form>
        <p className="text-xs text-gray-500 mt-2">?낅젰 ???ъ빱?ㅺ? 踰쀬뼱?섎㈃ ?먮룞 ??λ뤌??</p>
      </section>

      {loading ? (
        <div className="py-8 flex justify-center"><LoaderSwitcher label="Todo 遺덈윭?ㅻ뒗 以?.." /></div>
      ) : (
        <>
          <section className="space-y-2">
            {activeItems.map((item) => (
              <article key={item.id} className="rounded-lg border border-gray-200 dark:border-gray-700 p-3 bg-white dark:bg-gray-800">
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={item.completed}
                    onChange={async (e) => {
                      await setTodoCompleted(item.id!, e.target.checked)
                      await load()
                    }}
                  />
                  <input
                    defaultValue={item.content}
                    onBlur={(e) => saveOnBlur(item.id, e.target.value)}
                    className="flex-1 bg-transparent outline-none"
                  />
                  <button onClick={() => copyTodo(item.content)} title="蹂듭궗" className="p-1.5 rounded border">
                    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="9" y="9" width="10" height="10" rx="2"/><rect x="5" y="5" width="10" height="10" rx="2"/></svg>
                  </button>
                  <button onClick={() => shareTodo(item.content)} title="怨듭쑀" className="p-1.5 rounded border">??/button>
                  <button
                    onClick={async () => {
                      await setTodoStarred(item.id!, !item.starred)
                      await load()
                    }}
                    title="以묒슂"
                    className="p-1.5 rounded border"
                  >
                    <svg className={`w-4 h-4 ${item.starred ? 'text-yellow-500 fill-yellow-400' : 'text-gray-400'}`} viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" fill={item.starred ? 'currentColor' : 'none'}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="m12 3 2.8 5.7 6.2.9-4.5 4.4 1.1 6.2L12 17.5 6.4 20.2l1.1-6.2L3 9.6l6.2-.9L12 3z" />
                    </svg>
                  </button>
                  <button
                    onClick={async () => {
                      if (!item.id) return
                      await deleteTodo(item.id)
                      await load()
                    }}
                    title="??젣"
                    className="p-1.5 rounded border text-red-500"
                  >
                    ?뿊
                  </button>
                </div>
              </article>
            ))}
          </section>

          <section className="pt-3 border-t border-gray-200 dark:border-gray-700">
            <h2 className="text-sm font-semibold text-gray-600 dark:text-gray-300 mb-2">?꾨즺 紐⑸줉</h2>
            <div className="space-y-2">
              {completedItems.map((item) => (
                <article key={item.id} className="rounded-lg border border-gray-200 dark:border-gray-700 p-3 bg-gray-50 dark:bg-gray-900/40 opacity-80">
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={item.completed}
                      onChange={async (e) => {
                        await setTodoCompleted(item.id!, e.target.checked)
                        await load()
                      }}
                    />
                    <input
                      defaultValue={item.content}
                      onBlur={(e) => saveOnBlur(item.id, e.target.value)}
                      className="flex-1 bg-transparent outline-none line-through text-gray-500"
                    />
                    {item.starred ? <span className="text-yellow-500">??/span> : null}
                  </div>
                </article>
              ))}
              {completedItems.length === 0 ? <p className="text-xs text-gray-500">?꾨즺????ぉ???놁뼱??</p> : null}
              <p className="text-xs text-gray-500">?꾨즺 ??ぉ? ?쇱젙 ?쒓컙??吏?섎㈃ ?먮룞 ??젣?쇱슂. (以묒슂 ?쒖떆????ぉ? ?좎?)</p>
            </div>
          </section>
        </>
      )}

      {msg ? <div className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-black/80 text-white text-xs px-3 py-2 rounded">{msg}</div> : null}
    </main>
  )
}
