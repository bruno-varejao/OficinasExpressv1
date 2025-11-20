import { Copy, Check } from 'lucide-react'
import { useState } from 'react'
import { Button } from '../ui/button'
import { toast } from 'sonner@2.0.3'

interface CopyButtonProps {
  text: string
  label?: string
  variant?: 'default' | 'outline' | 'ghost'
  size?: 'default' | 'sm' | 'lg' | 'icon'
  className?: string
}

/**
 * Botão para copiar texto para clipboard
 * Mostra feedback visual e toast ao copiar
 */
export function CopyButton({ 
  text, 
  label,
  variant = 'outline',
  size = 'sm',
  className = ''
}: CopyButtonProps) {
  const [copied, setCopied] = useState(false)
  
  const handleCopy = () => {
    try {
      // Método compatível com todos os browsers
      const textarea = document.createElement('textarea')
      textarea.value = text
      textarea.style.position = 'fixed'
      textarea.style.opacity = '0'
      document.body.appendChild(textarea)
      textarea.select()
      
      const successful = document.execCommand('copy')
      document.body.removeChild(textarea)
      
      if (successful) {
        setCopied(true)
        toast.success('Copiado!', {
          description: label ? `${label} copiado para a área de transferência` : undefined,
          duration: 2000
        })
        setTimeout(() => setCopied(false), 2000)
      } else {
        toast.error('Erro ao copiar', {
          description: 'Por favor, copie manualmente'
        })
      }
    } catch (error) {
      console.error('Error copying to clipboard:', error)
      toast.error('Erro ao copiar')
    }
  }
  
  return (
    <Button
      variant={variant}
      size={size}
      onClick={handleCopy}
      className={`gap-2 ${className}`}
    >
      {copied ? (
        <>
          <Check className="h-3 w-3 text-green-600" />
          {label && 'Copiado!'}
        </>
      ) : (
        <>
          <Copy className="h-3 w-3" />
          {label}
        </>
      )}
    </Button>
  )
}
