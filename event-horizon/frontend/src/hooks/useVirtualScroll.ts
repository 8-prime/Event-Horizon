import { useEffect, useRef, useState } from 'react'

const OVERSCAN = 5

export interface VirtualScrollResult {
  startIndex: number
  endIndex: number
  offsetY: number
  totalHeight: number
}

/**
 * Variable-height virtual scroll hook.
 * getItemHeight(i) should return the estimated/known height of item i.
 */
export function useVirtualScroll(
  containerRef: React.RefObject<HTMLElement | null>,
  itemCount: number,
  getItemHeight: (i: number) => number
): VirtualScrollResult {
  const [scrollTop, setScrollTop] = useState(0)
  const [containerHeight, setContainerHeight] = useState(600)
  const rafRef = useRef<number>(0)

  useEffect(() => {
    const el = containerRef.current
    if (!el) return

    const onScroll = () => {
      cancelAnimationFrame(rafRef.current)
      rafRef.current = requestAnimationFrame(() => setScrollTop(el.scrollTop))
    }

    el.addEventListener('scroll', onScroll, { passive: true })

    const ro = new ResizeObserver((entries) => {
      for (const entry of entries) {
        setContainerHeight(entry.contentRect.height)
      }
    })
    ro.observe(el)

    setContainerHeight(el.clientHeight)

    return () => {
      el.removeEventListener('scroll', onScroll)
      ro.disconnect()
      cancelAnimationFrame(rafRef.current)
    }
  }, [containerRef])

  // Compute cumulative heights
  let totalHeight = 0
  const offsets: number[] = []
  for (let i = 0; i < itemCount; i++) {
    offsets.push(totalHeight)
    totalHeight += getItemHeight(i)
  }

  // Binary search for startIndex
  let startIndex = 0
  let lo = 0,
    hi = itemCount - 1
  while (lo <= hi) {
    const mid = (lo + hi) >> 1
    if (offsets[mid] < scrollTop) {
      lo = mid + 1
      startIndex = mid
    } else hi = mid - 1
  }

  startIndex = Math.max(0, startIndex - OVERSCAN)

  let endIndex = startIndex
  let visibleHeight = 0
  while (
    endIndex < itemCount &&
    visibleHeight < containerHeight + getItemHeight(endIndex) * OVERSCAN
  ) {
    visibleHeight += getItemHeight(endIndex)
    endIndex++
  }
  endIndex = Math.min(itemCount, endIndex + OVERSCAN)

  const offsetY = offsets[startIndex] ?? 0

  return { startIndex, endIndex, offsetY, totalHeight }
}
