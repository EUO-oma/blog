'use client'

import { useEffect, useState } from 'react'
import WalterLineLoader from './WalterLineLoader'
import StarOutlineLoader from './StarOutlineLoader'
import HeartOutlineLoader from './HeartOutlineLoader'

export default function LoaderSwitcher({ label = '불러오는 중...' }: { label?: string }) {
  const [index, setIndex] = useState(0)

  useEffect(() => {
    setIndex(Math.floor(Math.random() * 3))
  }, [])

  if (index === 1) return <StarOutlineLoader label={label} />
  if (index === 2) return <HeartOutlineLoader label={label} />
  return <WalterLineLoader label={label} />
}
