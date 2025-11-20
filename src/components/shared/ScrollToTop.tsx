import { ArrowUp } from 'lucide-react'
import { useState, useEffect } from 'react'
import { Button } from '../ui/button'

/**
 * Botão flutuante para voltar ao topo da página
 * Aparece automaticamente quando o utilizador faz scroll para baixo
 */
export function ScrollToTop() {
  const [show, setShow] = useState(false)

  useEffect(() => {
    const handleScroll = () => {
      setShow(window.scrollY > 300)
    }
    
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  if (!show) return null

  return (
    <Button
      onClick={scrollToTop}
      className="fixed bottom-8 right-8 h-12 w-12 rounded-full bg-gradient-to-r from-blue-600 to-orange-500 hover:from-blue-700 hover:to-orange-600 shadow-lg z-50 p-0"
      title="Voltar ao topo"
    >
      <ArrowUp className="h-5 w-5 text-white" />
    </Button>
  )
}
