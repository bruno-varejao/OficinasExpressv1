import { useEffect } from 'react'

/**
 * Hook para atalhos de teclado
 * Suporta Ctrl/Cmd + tecla e teclas especiais como Escape
 * 
 * @example
 * useKeyboardShortcuts({
 *   'n': () => setDialogOpen(true),      // Ctrl+N
 *   'f': () => searchRef.current?.focus(), // Ctrl+F
 *   'escape': () => closeDialog()         // Esc
 * })
 */
export function useKeyboardShortcuts(shortcuts: Record<string, () => void>) {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const key = e.key.toLowerCase()
      const ctrl = e.ctrlKey || e.metaKey
      
      // Ctrl/Cmd + tecla
      if (ctrl && shortcuts[key]) {
        e.preventDefault()
        shortcuts[key]()
        return
      }
      
      // Teclas especiais sem Ctrl
      if (e.key === 'Escape' && shortcuts['escape']) {
        e.preventDefault()
        shortcuts['escape']()
        return
      }
      
      if (e.key === 'Enter' && shortcuts['enter']) {
        shortcuts['enter']()
        return
      }
    }
    
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [shortcuts])
}
