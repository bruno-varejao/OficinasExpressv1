import { ReactNode } from 'react'

interface FullScreenGridProps {
  children: ReactNode
  className?: string
}

/**
 * Wrapper component that applies full-screen grid layout with 10px spacing from browser edges
 * This ensures better visibility and consistent layout across all platform grids
 */
export function FullScreenGrid({ children, className = '' }: FullScreenGridProps) {
  return (
    <div 
      className={`w-full ${className}`}
      style={{ 
        margin: '10px',
        width: 'calc(100% - 20px)',
        minHeight: 'calc(100vh - 20px)'
      }}
    >
      {children}
    </div>
  )
}
