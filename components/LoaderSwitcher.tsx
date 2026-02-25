'use client'

import { useEffect, useState } from 'react'
import WalterLineLoader from './WalterLineLoader'
import StarOutlineLoader from './StarOutlineLoader'
import TwinkleStarsLoader from './TwinkleStarsLoader'

export default function LoaderSwitcher({ label = '불러오는 중...' }: { label?: string }) {
  const [index, setIndex] = useState(0)

  useEffect(() => {
    setIndex(Math.floor(Math.random() * 3))
  }, [])

  if (index === 1) return <StarOutlineLoader label={label} />
  if (index === 2) return <TwinkleStarsLoader label={label} />
  return <WalterLineLoader label={label} />
}
