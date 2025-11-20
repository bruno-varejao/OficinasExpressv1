import React, { createContext, useContext, useState, useCallback, useMemo } from 'react'
import { projectId, publicAnonKey } from '../utils/supabase/info'
import { toast } from 'sonner@2.0.3'

interface BudgetItem {
  partNumber: string
  description: string
  quantity: number
  price: number
}

interface Budget {
  id: string
  number: string
  clientId: string
  vehicleId: string
  items: BudgetItem[]
  laborHours: number
  laborRate: number
  partsTotal: number
  laborTotal: number
  subtotal: number
  tax: number
  total: number
  status: 'pending' | 'approved' | 'rejected' | 'quoted' | 'canceled'
  notes?: string
  createdAt: string
  workOrderId?: string
}

interface WorkOrder {
  id: string
  number: string
  budgetId: string
  clientId: string
  vehicleId: string
  assignedTechnicianId?: string
  items: BudgetItem[]
  laborHours: number
  laborRate: number
  partsTotal?: number
  laborTotal?: number
  subtotal?: number
  tax?: number
  total?: number
  status: 'pending' | 'in-progress' | 'paused' | 'completed'
  startedAt?: string
  completedAt?: string
  notes?: string
  createdAt: string
  serviceSheetId?: string
}

interface ServiceItem {
  id: string
  type: 'labor' | 'part' | 'service'
  category: string
  description: string
  quantity: number
  unitPrice: number
  discount: number
  total: number
  status: 'pending' | 'approved' | 'completed'
}

interface ServiceSheet {
  id: string
  number: string
  workOrderId?: string
  budgetId?: string
  vehicleId: string
  clientId: string
  date: string
  symptoms: string
  clientObservations: string
  hasKey: boolean
  hasManual: boolean
  hasDocuments: boolean
  interventionNotes: string
  services: ServiceItem[]
  status: 'reception' | 'diagnosis' | 'ordering' | 'parts_arrival' | 'execution' | 'delivery' | 'completed' | 'cancelled'
  startTime?: string
  endTime?: string
  elapsedTime: number
  history: Array<{ date: string; value: number; description: string }>
}

interface ModulesIntegrationContextType {
  // Create relationships
  createWorkOrderFromBudget: (budgetId: string, accessToken: string, workshopId?: string) => Promise<WorkOrder | null>
  createServiceSheetFromWorkOrder: (workOrderId: string, accessToken: string, workshopId?: string) => Promise<ServiceSheet | null>
  createServiceSheetFromBudget: (budgetId: string, accessToken: string, workshopId?: string) => Promise<ServiceSheet | null>
  
  // Update and sync
  updateBudget: (budgetId: string, updates: Partial<Budget>, accessToken: string) => Promise<void>
  updateWorkOrder: (workOrderId: string, updates: Partial<WorkOrder>, accessToken: string) => Promise<void>
  updateServiceSheet: (serviceSheetId: string, updates: Partial<ServiceSheet>, accessToken: string) => Promise<void>
  
  // Get relationships
  getWorkOrderByBudgetId: (budgetId: string, accessToken: string) => Promise<WorkOrder | null>
  getServiceSheetByWorkOrderId: (workOrderId: string, accessToken: string) => Promise<ServiceSheet | null>
  getBudgetByWorkOrderId: (workOrderId: string, accessToken: string) => Promise<Budget | null>
  
  // Navigation
  openServiceSheet: (workOrderId: string) => void
  serviceSheetNavigationCallback?: (workOrderId: string) => void
  registerServiceSheetNavigation: (callback: (workOrderId: string) => void) => void
  pageNavigationCallback?: (page: string) => void
  registerPageNavigation: (callback: (page: string) => void) => void
  pendingWorkOrderId: string | null
  
  // Sync listeners
  refreshCallbacks: Map<string, () => void>
  registerRefreshCallback: (moduleId: string, callback: () => void) => void
  unregisterRefreshCallback: (moduleId: string) => void
  triggerRefresh: (excludeModule?: string) => void
}

const ModulesIntegrationContext = createContext<ModulesIntegrationContextType | undefined>(undefined)

export function ModulesIntegrationProvider({ children }: { children: React.ReactNode }) {
  const [refreshCallbacks, setRefreshCallbacks] = useState<Map<string, () => void>>(new Map())
  const [serviceSheetNavigationCallback, setServiceSheetNavigationCallback] = useState<((workOrderId: string) => void) | undefined>(undefined)
  const [pageNavigationCallback, setPageNavigationCallback] = useState<((page: string) => void) | undefined>(undefined)
  const [pendingWorkOrderId, setPendingWorkOrderId] = useState<string | null>(null)

  const registerRefreshCallback = useCallback((moduleId: string, callback: () => void) => {
    setRefreshCallbacks(prev => {
      const next = new Map(prev)
      next.set(moduleId, callback)
      return next
    })
  }, [])

  const unregisterRefreshCallback = useCallback((moduleId: string) => {
    setRefreshCallbacks(prev => {
      const next = new Map(prev)
      next.delete(moduleId)
      return next
    })
  }, [])

  const triggerRefresh = useCallback((excludeModule?: string) => {
    refreshCallbacks.forEach((callback, moduleId) => {
      if (moduleId !== excludeModule) {
        callback()
      }
    })
  }, [refreshCallbacks])

  const registerServiceSheetNavigation = useCallback((callback: (workOrderId: string) => void) => {
    console.log('🔧 Registering service sheet navigation callback')
    setServiceSheetNavigationCallback(() => callback)
    
    // Check if there's a pending work order to process
    if (pendingWorkOrderId) {
      console.log('🔄 Processing pending work order:', pendingWorkOrderId)
      // Call the callback with the pending work order ID
      setTimeout(() => {
        callback(pendingWorkOrderId)
        setPendingWorkOrderId(null)
      }, 100)
    }
  }, [pendingWorkOrderId])

  const registerPageNavigation = useCallback((callback: (page: string) => void) => {
    setPageNavigationCallback(() => callback)
  }, [])

  const openServiceSheet = useCallback((workOrderId: string) => {
    console.log('🚀 Opening service sheet for work order:', workOrderId)
    
    // Store the pending work order ID first
    setPendingWorkOrderId(workOrderId)
    
    // First navigate to service sheet page
    if (pageNavigationCallback) {
      console.log('📄 Navigating to service sheet page')
      pageNavigationCallback('servicesheet')
      
      // Then trigger the service sheet to load the specific work order
      // Use setTimeout to ensure page navigation completes first
      setTimeout(() => {
        if (serviceSheetNavigationCallback) {
          console.log('✅ Calling service sheet navigation callback with workOrderId:', workOrderId)
          serviceSheetNavigationCallback(workOrderId)
          setPendingWorkOrderId(null)
        } else {
          console.log('⏳ Service sheet callback not ready yet, work order ID stored as pending:', workOrderId)
        }
      }, 500)
    } else {
      console.warn('⚠️ Page navigation callback not registered')
    }
  }, [serviceSheetNavigationCallback, pageNavigationCallback])

  const createWorkOrderFromBudget = useCallback(async (
    budgetId: string, 
    accessToken: string,
    workshopId?: string
  ): Promise<WorkOrder | null> => {
    try {
      console.log('🔗 Integration: Creating work order from budget', budgetId)
      
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-6971b43c/integration/budget-to-workorder`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ budgetId, workshopId }),
        }
      )

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }))
        console.error('❌ Integration error response:', errorData)
        const errorMessage = errorData.error || 'Erro ao criar folha de obra'
        throw new Error(errorMessage)
      }

      const workOrder = await response.json()
      console.log('✅ Integration: Work order created successfully', workOrder.id)
      triggerRefresh()
      return workOrder
    } catch (error: any) {
      console.error('❌ Integration: Error creating work order:', error)
      // Re-throw so the caller can handle the error message
      throw error
    }
  }, [triggerRefresh])

  const createServiceSheetFromWorkOrder = useCallback(async (
    workOrderId: string,
    accessToken: string,
    workshopId?: string
  ): Promise<ServiceSheet | null> => {
    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-6971b43c/integration/workorder-to-servicesheet`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ workOrderId, workshopId }),
        }
      )

      if (!response.ok) {
        const error = await response.text()
        throw new Error(error)
      }

      const serviceSheet = await response.json()
      toast.success('Folha de Serviço criada com sucesso!')
      triggerRefresh()
      return serviceSheet
    } catch (error) {
      console.error('Erro ao criar folha de serviço:', error)
      toast.error('Erro ao criar folha de serviço a partir da folha de obra')
      return null
    }
  }, [triggerRefresh])

  const createServiceSheetFromBudget = useCallback(async (
    budgetId: string,
    accessToken: string,
    workshopId?: string
  ): Promise<ServiceSheet | null> => {
    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-6971b43c/integration/budget-to-servicesheet`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ budgetId, workshopId }),
        }
      )

      if (!response.ok) {
        const error = await response.text()
        throw new Error(error)
      }

      const serviceSheet = await response.json()
      toast.success('Folha de Serviço criada com sucesso!')
      triggerRefresh()
      return serviceSheet
    } catch (error) {
      console.error('Erro ao criar folha de serviço:', error)
      toast.error('Erro ao criar folha de serviço a partir do orçamento')
      return null
    }
  }, [triggerRefresh])

  const updateBudget = useCallback(async (
    budgetId: string,
    updates: Partial<Budget>,
    accessToken: string
  ) => {
    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-6971b43c/budgets/${budgetId}`,
        {
          method: 'PUT',
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(updates),
        }
      )

      if (!response.ok) {
        throw new Error('Erro ao atualizar orçamento')
      }

      triggerRefresh('budgets')
    } catch (error) {
      console.error('Erro ao atualizar orçamento:', error)
      throw error
    }
  }, [triggerRefresh])

  const updateWorkOrder = useCallback(async (
    workOrderId: string,
    updates: Partial<WorkOrder>,
    accessToken: string
  ) => {
    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-6971b43c/workorders/${workOrderId}`,
        {
          method: 'PUT',
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(updates),
        }
      )

      if (!response.ok) {
        throw new Error('Erro ao atualizar folha de obra')
      }

      triggerRefresh('workorders')
    } catch (error) {
      console.error('Erro ao atualizar folha de obra:', error)
      throw error
    }
  }, [triggerRefresh])

  const updateServiceSheet = useCallback(async (
    serviceSheetId: string,
    updates: Partial<ServiceSheet>,
    accessToken: string
  ) => {
    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-6971b43c/servicesheets/${serviceSheetId}`,
        {
          method: 'PUT',
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(updates),
        }
      )

      if (!response.ok) {
        throw new Error('Erro ao atualizar folha de serviço')
      }

      triggerRefresh('servicesheets')
    } catch (error) {
      console.error('Erro ao atualizar folha de serviço:', error)
      throw error
    }
  }, [triggerRefresh])

  const getWorkOrderByBudgetId = useCallback(async (
    budgetId: string,
    accessToken: string
  ): Promise<WorkOrder | null> => {
    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-6971b43c/integration/workorder-by-budget/${budgetId}`,
        {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
          },
        }
      )

      if (!response.ok) {
        return null
      }

      return await response.json()
    } catch (error) {
      console.error('Erro ao buscar folha de obra:', error)
      return null
    }
  }, [])

  const getServiceSheetByWorkOrderId = useCallback(async (
    workOrderId: string,
    accessToken: string
  ): Promise<ServiceSheet | null> => {
    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-6971b43c/integration/servicesheet-by-workorder/${workOrderId}`,
        {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
          },
        }
      )

      if (!response.ok) {
        return null
      }

      return await response.json()
    } catch (error) {
      console.error('Erro ao buscar folha de serviço:', error)
      return null
    }
  }, [])

  const getBudgetByWorkOrderId = useCallback(async (
    workOrderId: string,
    accessToken: string
  ): Promise<Budget | null> => {
    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-6971b43c/integration/budget-by-workorder/${workOrderId}`,
        {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
          },
        }
      )

      if (!response.ok) {
        return null
      }

      return await response.json()
    } catch (error) {
      console.error('Erro ao buscar orçamento:', error)
      return null
    }
  }, [])

  const value = useMemo(() => ({
    createWorkOrderFromBudget,
    createServiceSheetFromWorkOrder,
    createServiceSheetFromBudget,
    updateBudget,
    updateWorkOrder,
    updateServiceSheet,
    getWorkOrderByBudgetId,
    getServiceSheetByWorkOrderId,
    getBudgetByWorkOrderId,
    openServiceSheet,
    serviceSheetNavigationCallback,
    registerServiceSheetNavigation,
    pageNavigationCallback,
    registerPageNavigation,
    pendingWorkOrderId,
    refreshCallbacks,
    registerRefreshCallback,
    unregisterRefreshCallback,
    triggerRefresh,
  }), [
    createWorkOrderFromBudget,
    createServiceSheetFromWorkOrder,
    createServiceSheetFromBudget,
    updateBudget,
    updateWorkOrder,
    updateServiceSheet,
    getWorkOrderByBudgetId,
    getServiceSheetByWorkOrderId,
    getBudgetByWorkOrderId,
    openServiceSheet,
    serviceSheetNavigationCallback,
    registerServiceSheetNavigation,
    pageNavigationCallback,
    registerPageNavigation,
    pendingWorkOrderId,
    refreshCallbacks,
    registerRefreshCallback,
    unregisterRefreshCallback,
    triggerRefresh,
  ])

  return (
    <ModulesIntegrationContext.Provider value={value}>
      {children}
    </ModulesIntegrationContext.Provider>
  )
}

export function useModulesIntegration() {
  const context = useContext(ModulesIntegrationContext)
  if (!context) {
    throw new Error('useModulesIntegration must be used within ModulesIntegrationProvider')
  }
  return context
}
