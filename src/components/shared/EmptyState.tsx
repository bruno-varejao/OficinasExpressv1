import { Button } from '../ui/button'
import { LucideIcon } from 'lucide-react'

interface EmptyStateProps {
  icon: LucideIcon
  title: string
  description: string
  actionLabel?: string
  onAction?: () => void
  iconColor?: string
  iconBgColor?: string
}

/**
 * Componente para estados vazios
 * Mostra uma mensagem amigável quando não há dados para exibir
 */
export function EmptyState({
  icon: Icon,
  title,
  description,
  actionLabel,
  onAction,
  iconColor = 'text-blue-600',
  iconBgColor = 'from-blue-100 to-orange-100'
}: EmptyStateProps) {
  return (
    <div className="text-center py-16">
      <div className={`mx-auto h-24 w-24 rounded-full bg-gradient-to-br ${iconBgColor} flex items-center justify-center mb-6`}>
        <Icon className={`h-12 w-12 ${iconColor}`} />
      </div>
      <h3 className="text-xl font-semibold text-gray-800 mb-2">
        {title}
      </h3>
      <p className="text-gray-600 mb-6 max-w-md mx-auto">
        {description}
      </p>
      {actionLabel && onAction && (
        <Button 
          onClick={onAction}
          className="bg-gradient-to-r from-blue-600 to-orange-500 text-white hover:from-blue-700 hover:to-orange-600"
        >
          {actionLabel}
        </Button>
      )}
    </div>
  )
}
