import { useEffect, useState } from 'react'

/**
 * Hook para debounce de valores
 * Útil para pesquisas em tempo real sem fazer chamadas excessivas à API
 * 
 * @param value Valor a fazer debounce
 * @param delay Delay em milissegundos (padrão: 300ms)
 * @returns Valor com debounce aplicado
 * 
 * @example
 * const [search, setSearch] = useState('')
 * const debouncedSearch = useDebounce(search, 300)
 * 
 * useEffect(() => {
 *   if (debouncedSearch) {
 *     performSearch(debouncedSearch)
 *   }
 * }, [debouncedSearch])
 */
export function useDebounce<T>(value: T, delay: number = 300): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value)

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedValue(value)
    }, delay)

    return () => {
      clearTimeout(timer)
    }
  }, [value, delay])

  return debouncedValue
}
