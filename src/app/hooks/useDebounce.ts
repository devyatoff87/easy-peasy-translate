'use client'

// src/hooks/useDebounce.ts
import { useState, useEffect } from 'react'

/**
 * Custom hook for debouncing a value.
 *
 * @param value The value to debounce.
 * @param delay The delay in milliseconds for debouncing.
 * @returns The debounced value.
 */
export function useDebounce<T>(value: T, delay: number): T {
  // State to store the debounced value
  const [debouncedValue, setDebouncedValue] = useState<T>(value)

  useEffect(() => {
    // Set up a timer to update the debounced value after the specified delay
    const handler = setTimeout(() => {
      setDebouncedValue(value)
    }, delay)

    // Clean up the timer if the value or delay changes, or if the component unmounts
    // This is crucial to prevent memory leaks and ensure that the previous timeout is cleared
    // before a new one is set, ensuring only the last value after the delay is used.
    return () => {
      clearTimeout(handler)
    }
  }, [value, delay]) // Re-run effect if value or delay changes

  return debouncedValue
}

export default useDebounce
