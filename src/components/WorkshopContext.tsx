import { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { projectId } from '../utils/supabase/info'

export interface Workshop {
  id: string
  name: string
  address?: string
  postalCode?: string
  cp4?: string  // Código Postal - 4 dígitos
  cp3?: string  // Código Postal - 3 dígitos
  locality?: string
  country?: string
  phone?: string
  phone2?: string
  email?: string
  nif?: string
  iban?: string
  website?: string
  defaultVatRate?: number
  appDisplayName?: string
  nifApiKey?: string
  logoUrl?: string
  logoPath?: string
  isActive: boolean
  createdAt?: string
}

interface WorkshopContextType {
  workshop: Workshop | null
  loading: boolean
  refreshWorkshop: () => Promise<void>
  setWorkshop: (workshop: Workshop | null) => void
}

const WorkshopContext = createContext<WorkshopContextType | undefined>(undefined)

export function WorkshopProvider({ 
  children, 
  workshopId, 
  accessToken 
}: { 
  children: ReactNode
  workshopId: string
  accessToken: string
}) {
  const [workshop, setWorkshop] = useState<Workshop | null>(null)
  const [loading, setLoading] = useState(true)

  const fetchWorkshop = async () => {
    if (!workshopId || !accessToken) {
      setLoading(false)
      return
    }

    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-6971b43c/workshops/${workshopId}`,
        {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
          },
        }
      )

      if (response.ok) {
        const data = await response.json()
        setWorkshop(data.workshop)
      }
    } catch (error) {
      console.error('Error fetching workshop:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchWorkshop()
  }, [workshopId, accessToken])

  return (
    <WorkshopContext.Provider value={{ workshop, loading, refreshWorkshop: fetchWorkshop, setWorkshop }}>
      {children}
    </WorkshopContext.Provider>
  )
}

export function useWorkshop() {
  const context = useContext(WorkshopContext)
  if (context === undefined) {
    throw new Error('useWorkshop must be used within a WorkshopProvider')
  }
  return context
}
