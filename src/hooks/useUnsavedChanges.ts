import { useEffect } from 'react'

/**
 * Hook para avisar sobre alterações não guardadas
 * Mostra confirmação quando utilizador tenta sair da página com alterações pendentes
 * 
 * @example
 * const [hasChanges, setHasChanges] = useState(false)
 * useUnsavedChanges(hasChanges)
 */
export function useUnsavedChanges(hasChanges: boolean) {
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (hasChanges) {
        e.preventDefault()
        e.returnValue = 'Tem alterações não guardadas. Tem certeza que deseja sair?'
        return e.returnValue
      }
    }
    
    window.addEventListener('beforeunload', handleBeforeUnload)
    return () => window.removeEventListener('beforeunload', handleBeforeUnload)
  }, [hasChanges])
}
