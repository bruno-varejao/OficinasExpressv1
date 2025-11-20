import { ChevronRight, Home } from 'lucide-react'
import { Button } from '../ui/button'

export interface BreadcrumbItem {
  label: string
  onClick?: () => void
  icon?: React.ComponentType<{ className?: string }>
}

interface BreadcrumbsProps {
  items: BreadcrumbItem[]
  showHome?: boolean
  onHomeClick?: () => void
}

/**
 * Componente de breadcrumbs para navegação
 * Mostra o caminho atual na hierarquia da aplicação
 */
export function Breadcrumbs({ 
  items, 
  showHome = true,
  onHomeClick 
}: BreadcrumbsProps) {
  return (
    <div className="flex items-center gap-2 text-sm mb-6 flex-wrap">
      {showHome && (
        <>
          <Button
            variant="ghost"
            size="sm"
            onClick={onHomeClick}
            className="h-8 px-2 hover:bg-blue-50"
          >
            <Home className="h-4 w-4 text-blue-600" />
          </Button>
          {items.length > 0 && (
            <ChevronRight className="h-4 w-4 text-gray-400" />
          )}
        </>
      )}
      
      {items.map((item, index) => {
        const isLast = index === items.length - 1
        const Icon = item.icon
        
        return (
          <div key={index} className="flex items-center gap-2">
            {item.onClick ? (
              <Button
                variant="ghost"
                size="sm"
                onClick={item.onClick}
                className="h-8 px-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50"
              >
                {Icon && <Icon className="h-4 w-4 mr-1" />}
                {item.label}
              </Button>
            ) : (
              <span className="text-gray-900 font-semibold px-2 flex items-center gap-1">
                {Icon && <Icon className="h-4 w-4" />}
                {item.label}
              </span>
            )}
            
            {!isLast && (
              <ChevronRight className="h-4 w-4 text-gray-400" />
            )}
          </div>
        )
      })}
    </div>
  )
}
