import { Skeleton } from '../ui/skeleton'

interface LoadingSkeletonProps {
  type?: 'table' | 'card' | 'list' | 'form'
  rows?: number
  className?: string
}

/**
 * Componente de loading com skeletons
 * Mostra placeholders animados enquanto os dados carregam
 */
export function LoadingSkeleton({ 
  type = 'table', 
  rows = 5,
  className = ''
}: LoadingSkeletonProps) {
  
  if (type === 'table') {
    return (
      <div className={`space-y-3 ${className}`}>
        {/* Header */}
        <Skeleton className="h-12 w-full" />
        {/* Rows */}
        {Array.from({ length: rows }).map((_, i) => (
          <Skeleton key={i} className="h-16 w-full" />
        ))}
      </div>
    )
  }

  if (type === 'card') {
    return (
      <div className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 ${className}`}>
        {Array.from({ length: rows }).map((_, i) => (
          <div key={i} className="space-y-3">
            <Skeleton className="h-48 w-full rounded-lg" />
            <Skeleton className="h-6 w-3/4" />
            <Skeleton className="h-4 w-1/2" />
          </div>
        ))}
      </div>
    )
  }

  if (type === 'list') {
    return (
      <div className={`space-y-4 ${className}`}>
        {Array.from({ length: rows }).map((_, i) => (
          <div key={i} className="flex items-center gap-4">
            <Skeleton className="h-12 w-12 rounded-full" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-4 w-1/3" />
              <Skeleton className="h-3 w-1/2" />
            </div>
          </div>
        ))}
      </div>
    )
  }

  if (type === 'form') {
    return (
      <div className={`space-y-6 ${className}`}>
        {Array.from({ length: rows }).map((_, i) => (
          <div key={i} className="space-y-2">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-10 w-full" />
          </div>
        ))}
      </div>
    )
  }

  return null
}
