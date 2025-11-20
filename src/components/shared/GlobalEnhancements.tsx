import { ScrollToTop } from './ScrollToTop'
import { Toaster } from '../ui/sonner'

/**
 * Componente global que adiciona melhorias de UX em toda a aplicação
 * - Scroll to top button
 * - Toast notifications
 * - Outros melhoramentos globais
 */
export function GlobalEnhancements() {
  return (
    <>
      <ScrollToTop />
      <Toaster 
        position="top-right"
        expand={true}
        richColors
        closeButton
      />
    </>
  )
}
