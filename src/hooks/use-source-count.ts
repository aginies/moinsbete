'use client'

import { useState, useCallback, useRef, useEffect } from 'react'

export function useSourceCount(serverCount: number): [number, () => void] {
  const [count, setCount] = useState(serverCount)
  const deltaRef = useRef(0)

  const handleRemove = useCallback(() => {
    setCount(prev => {
      deltaRef.current -= 1
      return Math.max(0, prev - 1)
    })
  }, [])

  useEffect(() => {
    setCount(serverCount + deltaRef.current)
  }, [serverCount])

  return [count, handleRemove]
}
