import React, { useState, useEffect, useRef } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from './ui/card'
import { useWorkflowTimer } from './WorkflowTimerContext'
import { Button } from './ui/button'
import { Input } from './ui/input'
import { Label } from './ui/label'
import { Textarea } from './ui/textarea'
import { Badge } from './ui/badge'
import { Separator } from './ui/separator'
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from './ui/collapsible'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from './ui/dropdown-menu'
import { 
  Plus, 
  Save, 
  Printer, 
  Clock, 
  Car, 
  User, 
  FileText, 
  Wrench, 
  Package, 
  Trash2, 
  Edit, 
  ChevronRight,
  ChevronDown,
  Key,
  Book,
  FolderOpen,
  MessageSquare,
  Play,
  Pause,
  CheckCircle,
  Settings,
  ClipboardList,
  History,
  Calendar,
  Phone,
  Mail,
  UserCog,
  Check,
  Activity,
  XCircle,
  Download,
  Calculator,
  Receipt,
  Euro,
  Send,
  Image as ImageIcon,
  Paperclip,
  X,
  CheckCheck,
  Share2,
  DollarSign,
  FolderCheck,
  AlertCircle
} from 'lucide-react'
import { ImageWithFallback } from './figma/ImageWithFallback'
import { PortugueseLicensePlate } from './PortugueseLicensePlate'
import { toast } from 'sonner@2.0.3'
import { useWorkshop } from './WorkshopContext'
import { useModulesIntegration } from './ModulesIntegrationContext'
import { projectId, publicAnonKey } from '../utils/supabase/info'

interface ServiceItem {
  id: string
  reference: string
  designation: string
  quantity: number
  unitPrice: number
  discount: number
  total: number
  status: 'pending' | 'approved' | 'completed'
  laborTypeId?: string
  laborHours?: number
  isLabor?: boolean
}

interface LaborType {
  id: string
  name: string
  hourlyRate: number
  description?: string
  isActive: boolean
}

interface Employee {
  id: string
  name: string
  email?: string
  phone?: string
  position: string
  isActive: boolean
}

interface ServiceSheet {
  id: string
  number: string
  vehicleId: string
  clientId: string
  date: string
  hasKey: boolean
  assignedEmployeeId?: string
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

interface ServiceSheetModuleProps {
  accessToken: string
}

export function ServiceSheetModule({ accessToken }: ServiceSheetModuleProps) {
  const { workshop } = useWorkshop()
  const integration = useModulesIntegration()
  const workflowTimer = useWorkflowTimer()
  const [loading, setLoading] = useState(false)
  const [serviceSheets, setServiceSheets] = useState<ServiceSheet[]>([])
  const [vehicles, setVehicles] = useState<any[]>([])
  const [clients, setClients] = useState<any[]>([])
  const [workOrders, setWorkOrders] = useState<any[]>([])
  const [selectedSheet, setSelectedSheet] = useState<ServiceSheet | null>(null)
  const [selectedWorkOrder, setSelectedWorkOrder] = useState<any | null>(null)
  const [laborTypes, setLaborTypes] = useState<LaborType[]>([])
  const [employees, setEmployees] = useState<Employee[]>([])
  
  // Form states
  const [selectedVehicleId, setSelectedVehicleId] = useState('')
  const [hasKey, setHasKey] = useState(false)
  const [hasManual, setHasManual] = useState(false)
  const [hasDocuments, setHasDocuments] = useState(false)
  const [interventionNotes, setInterventionNotes] = useState('')
  const [assignedEmployeeId, setAssignedEmployeeId] = useState('')
  const [services, setServices] = useState<ServiceItem[]>([])
  const [vatRate, setVatRate] = useState<number>(23) // Taxa de IVA padrão 23% (Portugal)
  
  // Workflow Status
  const [workflowStatus, setWorkflowStatus] = useState<string>('reception-complete')
  const [workflowStartTime, setWorkflowStartTime] = useState<number | null>(null)
  const [workflowAccumulatedTime, setWorkflowAccumulatedTime] = useState<number>(0)

  // Vehicle History
  const [vehicleHistory, setVehicleHistory] = useState<{
    budgets: any[]
    workOrders: any[]
    invoices: any[]
  }>({
    budgets: [],
    workOrders: [],
    invoices: []
  })
  const [loadingHistory, setLoadingHistory] = useState(false)
  const [selectedHistoryType, setSelectedHistoryType] = useState<'budgets' | 'workorders' | 'invoices' | null>(null)

  // Auto-save
  const [isSaving, setIsSaving] = useState(false)
  const saveTimeoutRef = useRef<any>(null)

  // Filter to show only vehicles with open work orders
  const [showOnlyWithWorkOrders, setShowOnlyWithWorkOrders] = useState(false)
  
  // Messages state
  const [messages, setMessages] = useState<any[]>([])
  const [newMessage, setNewMessage] = useState('')
  const [unreadMessagesCount, setUnreadMessagesCount] = useState(0)
  const [isMessagesOpen, setIsMessagesOpen] = useState(false)
  const [sendingMessage, setSendingMessage] = useState(false)
  const [showMessageHistory, setShowMessageHistory] = useState(false)
  const [selectedImage, setSelectedImage] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [uploadingImage, setUploadingImage] = useState(false)
  
  // Technical data from InfoMatricula
  const [technicalData, setTechnicalData] = useState<any>(null)
  const [loadingTechnicalData, setLoadingTechnicalData] = useState(false)

  useEffect(() => {
    loadData()
  }, [workshop?.id])
  
  // Check for pending work order navigation
  useEffect(() => {
    if (integration.pendingWorkOrderId) {
      console.log('🔔 ServiceSheetModule detected pending work order:', integration.pendingWorkOrderId)
      
      // Create a handler that will be called
      const openPendingWorkOrder = async () => {
        const workOrderId = integration.pendingWorkOrderId
        if (!workOrderId) return
        
        console.log('🔄 Attempting to open pending work order:', workOrderId)
        
        // Wait a bit for data to load
        await new Promise(resolve => setTimeout(resolve, 500))
        
        // Try to find and open the work order
        try {
          const response = await fetch(
            `https://${projectId}.supabase.co/functions/v1/make-server-6971b43c/workorders`,
            {
              headers: { 'Authorization': `Bearer ${accessToken}` }
            }
          )
          
          if (response.ok) {
            const data = await response.json()
            const workOrder = (data.workOrders || []).find((wo: any) => wo.id === workOrderId)
            
            if (workOrder) {
              console.log('✅ Found pending work order, loading...')
              
              // Find vehicle
              const vehiclesResponse = await fetch(
                `https://${projectId}.supabase.co/functions/v1/make-server-6971b43c/vehicles`,
                {
                  headers: { 'Authorization': `Bearer ${accessToken}` }
                }
              )
              
              if (vehiclesResponse.ok) {
                const vehiclesData = await vehiclesResponse.json()
                const vehicle = (vehiclesData.vehicles || []).find((v: any) => v.id === workOrder.vehicleId)
                
                if (vehicle) {
                  // Set selected vehicle and work order
                  setSelectedVehicleId(workOrder.vehicleId)
                  setSelectedWorkOrder(workOrder)
                  
                  // Load services
                  loadServicesFromWorkOrder(workOrder)
                  
                  // Load messages
                  const messagesResponse = await fetch(
                    `https://${projectId}.supabase.co/functions/v1/make-server-6971b43c/workshop/messages/${workOrder.id}`,
                    {
                      headers: { 'Authorization': `Bearer ${accessToken}` }
                    }
                  )
                  
                  if (messagesResponse.ok) {
                    const messagesData = await messagesResponse.json()
                    setMessages(messagesData.messages || [])
                    setUnreadMessagesCount(messagesData.unreadCount || 0)
                    
                    // Open messages section if unread
                    if (messagesData.unreadCount > 0) {
                      console.log('📬 Opening messages section (unread messages)')
                      setIsMessagesOpen(true)
                    }
                  }
                  
                  toast.success(`Folha de Serviço carregada para ${vehicle.licensePlate}`)
                }
              }
            } else {
              console.warn('⚠️ Pending work order not found:', workOrderId)
            }
          }
        } catch (error) {
          console.error('❌ Error loading pending work order:', error)
        }
      }
      
      openPendingWorkOrder()
    }
  }, [integration.pendingWorkOrderId])
  
  // Sincronizar tempo inicial quando seleciona work order
  useEffect(() => {
    if (!selectedWorkOrder) return
    
    // Obter tempo do contexto global
    const currentTime = workflowTimer.getTimerTime(selectedWorkOrder.id)
    console.log('🔄 Work Order selecionada. Sincronizando tempo:', {
      workOrderId: selectedWorkOrder.id,
      timeFromContext: currentTime,
      timeFromState: workflowAccumulatedTime
    })
    
    if (currentTime > 0) {
      setWorkflowAccumulatedTime(currentTime)
    }
  }, [selectedWorkOrder?.id])
  
  // Sincronizar display do tempo com o contexto global a cada segundo
  useEffect(() => {
    if (!selectedWorkOrder) return
    
    const interval = setInterval(() => {
      const currentTime = workflowTimer.getTimerTime(selectedWorkOrder.id)
      if (currentTime !== workflowAccumulatedTime) {
        setWorkflowAccumulatedTime(currentTime)
      }
    }, 1000)
    
    return () => clearInterval(interval)
  }, [selectedWorkOrder?.id, workflowTimer])
  
  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current)
      }
    }
  }, [])

  // Register refresh callback for integration
  useEffect(() => {
    const refreshCallback = () => {
      loadData()
    }
    
    integration.registerRefreshCallback('servicesheets', refreshCallback)
    
    return () => {
      integration.unregisterRefreshCallback('servicesheets')
    }
  }, []) // Empty deps - só regista uma vez

  // Register navigation callback for opening from work orders
  useEffect(() => {
    console.log('🔧 ServiceSheetModule: Registering navigation callback (re-render)', {
      workOrdersCount: workOrders.length,
      vehiclesCount: vehicles.length
    })
    
    const handleOpenWorkOrder = async (workOrderId: string) => {
      console.log('🔗 ServiceSheetModule: handleOpenWorkOrder called with workOrderId:', workOrderId)
      console.log('🔗 Current state:', {
        workOrdersCount: workOrders.length,
        vehiclesCount: vehicles.length,
        hasAccessToken: !!accessToken
      })
      
      try {
        // Ensure data is loaded first
        if (workOrders.length === 0 || vehicles.length === 0) {
          console.log('📥 Data not loaded yet, loading now...')
          await loadData()
        }
        
        // Small delay to ensure state is updated
        await new Promise(resolve => setTimeout(resolve, 200))
        
        // Fetch fresh work order data
        const workOrderResponse = await fetch(
          `https://${projectId}.supabase.co/functions/v1/make-server-6971b43c/workorders`,
          {
            headers: { 'Authorization': `Bearer ${accessToken}` }
          }
        )
        
        if (!workOrderResponse.ok) {
          throw new Error('Failed to load work orders')
        }
        
        const workOrderData = await workOrderResponse.json()
        const allWorkOrders = workOrderData.workOrders || []
        
        // Update work orders state
        const openWorkOrders = allWorkOrders.filter((wo: any) => 
          wo && (wo.status === 'pending' || wo.status === 'in-progress' || wo.status === 'paused')
        )
        setWorkOrders(openWorkOrders)
        
        // Find the specific work order
        const workOrder = allWorkOrders.find((wo: any) => wo.id === workOrderId)
        if (!workOrder) {
          console.error('❌ Work order not found:', workOrderId)
          toast.error('Folha de obra não encontrada')
          return
        }
        
        // Fetch vehicles, labor types and employees
        let vehiclesList = vehicles
        let laborTypesList = laborTypes
        let employeesList = employees
        
        if (vehiclesList.length === 0) {
          const vehiclesResponse = await fetch(
            `https://${projectId}.supabase.co/functions/v1/make-server-6971b43c/vehicles`,
            {
              headers: { 'Authorization': `Bearer ${accessToken}` }
            }
          )
          
          if (vehiclesResponse.ok) {
            const vehiclesData = await vehiclesResponse.json()
            vehiclesList = vehiclesData.vehicles || []
            setVehicles(vehiclesList)
          }
        }
        
        // Load labor types if needed
        if (laborTypesList.length === 0) {
          const laborTypesResponse = await fetch(
            `https://${projectId}.supabase.co/functions/v1/make-server-6971b43c/labor-types`,
            {
              headers: { 'Authorization': `Bearer ${accessToken}` }
            }
          )
          
          if (laborTypesResponse.ok) {
            const laborTypesData = await laborTypesResponse.json()
            const activeLaborTypes = (laborTypesData.laborTypes || []).filter((lt: any) => lt && lt.isActive)
            laborTypesList = activeLaborTypes
            setLaborTypes(activeLaborTypes)
          }
        }
        
        // Load employees if needed
        if (employeesList.length === 0) {
          const employeesResponse = await fetch(
            `https://${projectId}.supabase.co/functions/v1/make-server-6971b43c/employees`,
            {
              headers: { 'Authorization': `Bearer ${accessToken}` }
            }
          )
          
          if (employeesResponse.ok) {
            const employeesData = await employeesResponse.json()
            const activeEmployees = (employeesData.employees || []).filter((e: any) => e && e.isActive)
            employeesList = activeEmployees
            setEmployees(activeEmployees)
          }
        }
        
        // Find the vehicle
        const vehicle = vehiclesList.find((v: any) => v.id === workOrder.vehicleId)
        if (!vehicle) {
          console.error('❌ Vehicle not found for work order:', workOrderId)
          toast.error('Viatura não encontrada')
          return
        }
        
        console.log('✅ Found work order and vehicle:', {
          workOrderNumber: workOrder.number,
          vehiclePlate: vehicle.licensePlate,
          vehicleId: workOrder.vehicleId
        })
        
        // Update state with fresh data - use callback form to ensure state is updated
        setSelectedVehicleId(() => workOrder.vehicleId)
        setSelectedWorkOrder(() => workOrder)
        
        // Small delay to ensure state is propagated
        await new Promise(resolve => setTimeout(resolve, 100))
        
        // Load services from the work order
        console.log('📥 Loading services from work order...')
        loadServicesFromWorkOrder(workOrder)
        
        // Load vehicle history
        console.log('📋 Loading vehicle history...')
        await loadVehicleHistory(workOrder.vehicleId)
        
        // Load messages for this work order and check for unread
        console.log('💬 Loading messages...')
        try {
          const messagesResponse = await fetch(
            `https://${projectId}.supabase.co/functions/v1/make-server-6971b43c/workshop/messages/${workOrder.id}`,
            {
              headers: { 'Authorization': `Bearer ${accessToken}` }
            }
          )
          
          if (messagesResponse.ok) {
            const messagesData = await messagesResponse.json()
            setMessages(messagesData.messages || [])
            setUnreadMessagesCount(messagesData.unreadCount || 0)
            
            console.log('💬 Messages loaded:', {
              workOrderId: workOrder.id,
              messagesCount: messagesData.messages?.length || 0,
              unreadCount: messagesData.unreadCount || 0
            })
            
            // Open messages section if there are unread messages
            if (messagesData.unreadCount > 0) {
              console.log('📬 Opening messages section (unread messages detected)')
              setIsMessagesOpen(true)
            }
          }
        } catch (error) {
          console.error('Error loading messages:', error)
        }
        
        console.log('✅ Service sheet loaded successfully')
        toast.success(`Folha de Serviço carregada para ${vehicle.licensePlate}`)
        
        // After 3 seconds, update the filter to show only vehicles with open work orders
        setTimeout(() => {
          console.log('🔄 Ativando filtro para mostrar apenas viaturas com folhas de obra abertas')
          setShowOnlyWithWorkOrders(true)
        }, 3000)
      } catch (error) {
        console.error('❌ Error opening work order:', error)
        toast.error('Erro ao abrir folha de serviço')
      }
    }
    
    console.log('📝 ServiceSheetModule: Calling registerServiceSheetNavigation')
    integration.registerServiceSheetNavigation(handleOpenWorkOrder)
    
    return () => {
      console.log('🧹 ServiceSheetModule: Cleaning up navigation callback')
    }
  }, [workOrders, vehicles, accessToken]) // Re-register when data changes

  // Listen for work order updates from other modules
  // Only reload if not currently saving (to avoid conflicts)
  useEffect(() => {
    const workOrderRefreshCallback = async () => {
      if (!selectedWorkOrder || !selectedVehicleId || isSaving) {
        console.log('⏭️ Skipping work order refresh (saving in progress or no selection)')
        return
      }
      
      console.log('🔄 Work order updated externally, reloading services...')
      
      // Reload work orders
      try {
        const response = await fetch(
          `https://${projectId}.supabase.co/functions/v1/make-server-6971b43c/workorders`,
          {
            headers: { 'Authorization': `Bearer ${accessToken}` }
          }
        )
        
        if (response.ok) {
          const data = await response.json()
          const openWorkOrders = (data.workOrders || []).filter((wo: any) => 
            wo && (wo.status === 'pending' || wo.status === 'in-progress' || wo.status === 'paused')
          )
          setWorkOrders(openWorkOrders)
          
          // Find updated work order for current vehicle
          const updatedWorkOrder = openWorkOrders.find((wo: any) => wo.vehicleId === selectedVehicleId)
          if (updatedWorkOrder) {
            setSelectedWorkOrder(updatedWorkOrder)
            // Only reload services if items changed (to avoid losing focus)
            const itemsChanged = JSON.stringify(updatedWorkOrder.items) !== JSON.stringify(selectedWorkOrder.items)
            if (itemsChanged) {
              console.log('📝 Items changed, reloading services')
              loadServicesFromWorkOrder(updatedWorkOrder)
            } else {
              console.log('✓ Items unchanged, skipping reload')
            }
          }
        }
      } catch (error) {
        console.error('Error reloading work orders:', error)
      }
    }
    
    integration.registerRefreshCallback('workorders', workOrderRefreshCallback)
    
    return () => {
      integration.unregisterRefreshCallback('workorders')
    }
  }, [selectedWorkOrder, selectedVehicleId, isSaving]) // Re-register when selection or saving state changes
  
  // Load messages when work order changes and set up polling
  useEffect(() => {
    if (selectedWorkOrder?.id) {
      loadMessages(selectedWorkOrder.id)
      
      // Poll for new messages every 30 seconds
      const interval = setInterval(() => {
        loadMessages(selectedWorkOrder.id)
      }, 30000)
      
      return () => clearInterval(interval)
    } else {
      setMessages([])
      setUnreadMessagesCount(0)
    }
  }, [selectedWorkOrder?.id])

  const loadData = async () => {
    if (!workshop?.id) return
    setLoading(true)
    try {
      // Load vehicles, clients, and work orders
      const [vehiclesRes, clientsRes, workOrdersRes, laborTypesRes, employeesRes] = await Promise.all([
        fetch(`https://${projectId}.supabase.co/functions/v1/make-server-6971b43c/vehicles`, {
          headers: { 'Authorization': `Bearer ${accessToken}` }
        }),
        fetch(`https://${projectId}.supabase.co/functions/v1/make-server-6971b43c/clients`, {
          headers: { 'Authorization': `Bearer ${accessToken}` }
        }),
        fetch(`https://${projectId}.supabase.co/functions/v1/make-server-6971b43c/workorders`, {
          headers: { 'Authorization': `Bearer ${accessToken}` }
        }),
        fetch(`https://${projectId}.supabase.co/functions/v1/make-server-6971b43c/labor-types`, {
          headers: { 'Authorization': `Bearer ${accessToken}` }
        }),
        fetch(`https://${projectId}.supabase.co/functions/v1/make-server-6971b43c/employees`, {
          headers: { 'Authorization': `Bearer ${accessToken}` }
        })
      ])

      // Check for HTTP errors
      if (!vehiclesRes.ok) {
        const errorText = await vehiclesRes.text()
        console.error('❌ Failed to load vehicles:', errorText)
        throw new Error(`Failed to load vehicles: ${errorText}`)
      }
      
      if (!clientsRes.ok) {
        const errorText = await clientsRes.text()
        console.error('❌ Failed to load clients:', errorText)
        throw new Error(`Failed to load clients: ${errorText}`)
      }

      if (!workOrdersRes.ok) {
        const errorText = await workOrdersRes.text()
        console.error('❌ Failed to load work orders:', errorText)
        throw new Error(`Failed to load work orders: ${errorText}`)
      }

      const vehiclesData = await vehiclesRes.json()
      const clientsData = await clientsRes.json()
      const workOrdersData = await workOrdersRes.json()
      const laborTypesData = laborTypesRes.ok ? await laborTypesRes.json() : { laborTypes: [] }
      const employeesData = employeesRes.ok ? await employeesRes.json() : { employees: [] }

      // Filter only open work orders (status: pending, in-progress, paused)
      const openWorkOrders = (workOrdersData.workOrders || []).filter((wo: any) => 
        wo && (wo.status === 'pending' || wo.status === 'in-progress' || wo.status === 'paused')
      )

      // Filter only active labor types
      const activeLaborTypes = (laborTypesData.laborTypes || []).filter((lt: any) => lt && lt.isActive)

      // Filter only active employees
      const activeEmployees = (employeesData.employees || []).filter((emp: any) => emp && emp.isActive)

      console.log('📊 Loaded data:', { 
        vehiclesCount: vehiclesData.vehicles?.length || 0,
        clientsCount: clientsData.clients?.length || 0,
        openWorkOrdersCount: openWorkOrders.length,
        laborTypesCount: activeLaborTypes.length,
        employeesCount: activeEmployees.length
      })

      // API returns { vehicles: [...] } and { clients: [...] }
      const allVehicles = (vehiclesData.vehicles || []).filter((v: any) => v)
      
      // Filter vehicles to only show those with open work orders
      const vehiclesWithOpenWorkOrders = allVehicles.filter((vehicle: any) => 
        openWorkOrders.some((wo: any) => wo.vehicleId === vehicle.id)
      )

      setVehicles(vehiclesWithOpenWorkOrders)
      setClients((clientsData.clients || []).filter((c: any) => c))
      setWorkOrders(openWorkOrders)
      setLaborTypes(activeLaborTypes)
      setEmployees(activeEmployees)
    } catch (error: any) {
      console.error('Erro ao carregar dados:', error)
      toast.error('Erro ao carregar dados: ' + (error.message || 'Erro desconhecido'))
    } finally {
      setLoading(false)
    }
  }

  const loadVehicleHistory = async (vehicleId: string) => {
    if (!vehicleId) return
    
    setLoadingHistory(true)
    try {
      const [budgetsRes, workOrdersRes, invoicesRes] = await Promise.all([
        fetch(`https://${projectId}.supabase.co/functions/v1/make-server-6971b43c/budgets`, {
          headers: { 'Authorization': `Bearer ${accessToken}` }
        }),
        fetch(`https://${projectId}.supabase.co/functions/v1/make-server-6971b43c/workorders`, {
          headers: { 'Authorization': `Bearer ${accessToken}` }
        }),
        fetch(`https://${projectId}.supabase.co/functions/v1/make-server-6971b43c/invoices`, {
          headers: { 'Authorization': `Bearer ${accessToken}` }
        })
      ])

      let budgets: any[] = []
      let allWorkOrders: any[] = []
      let invoices: any[] = []

      if (budgetsRes.ok) {
        const data = await budgetsRes.json()
        budgets = (data.budgets || []).filter((b: any) => b && b.vehicleId === vehicleId)
      }

      if (workOrdersRes.ok) {
        const data = await workOrdersRes.json()
        allWorkOrders = (data.workOrders || []).filter((w: any) => w && w.vehicleId === vehicleId)
      }

      if (invoicesRes.ok) {
        const data = await invoicesRes.json()
        invoices = (data.invoices || []).filter((i: any) => i && i.vehicleId === vehicleId)
      }

      setVehicleHistory({
        budgets,
        workOrders: allWorkOrders,
        invoices
      })

      console.log('📋 Vehicle history loaded:', {
        vehicleId,
        budgetsCount: budgets.length,
        workOrdersCount: allWorkOrders.length,
        invoicesCount: invoices.length
      })
    } catch (error: any) {
      console.error('Erro ao carregar histórico:', error)
      toast.error('Erro ao carregar histórico do veículo')
    } finally {
      setLoadingHistory(false)
    }
  }
  
  const loadMessages = async (workOrderId: string) => {
    if (!workOrderId) {
      console.warn('⚠️ loadMessages called with empty workOrderId')
      return
    }
    
    console.log('🔍 Loading messages for workOrderId:', workOrderId)
    
    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-6971b43c/workshop/messages/${workOrderId}`,
        {
          headers: { 'Authorization': `Bearer ${accessToken}` }
        }
      )
      
      console.log('📡 Messages fetch response status:', response.status)
      
      if (response.ok) {
        const data = await response.json()
        setMessages(data.messages || [])
        setUnreadMessagesCount(data.unreadCount || 0)
        
        console.log('💬 Messages loaded successfully:', {
          workOrderId,
          messagesCount: data.messages?.length || 0,
          unreadCount: data.unreadCount || 0,
          messages: data.messages
        })
      } else {
        const errorText = await response.text()
        console.error('❌ Failed to load messages:', response.status, errorText)
      }
    } catch (error) {
      console.error('❌ Error loading messages:', error)
    }
  }
  
  const sendMessage = async () => {
    if (!selectedWorkOrder || (!newMessage.trim() && !selectedImage)) return
    
    setSendingMessage(true)
    setUploadingImage(!!selectedImage)
    
    try {
      let imageUrl: string | null = null
      
      // Upload image if selected
      if (selectedImage) {
        const formData = new FormData()
        formData.append('file', selectedImage)
        formData.append('workOrderId', selectedWorkOrder.id)
        
        const uploadResponse = await fetch(
          `https://${projectId}.supabase.co/functions/v1/make-server-6971b43c/workshop/messages/upload-image`,
          {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${accessToken}`
            },
            body: formData
          }
        )
        
        if (uploadResponse.ok) {
          const uploadData = await uploadResponse.json()
          imageUrl = uploadData.imageUrl
        } else {
          throw new Error('Failed to upload image')
        }
      }
      
      // Send message with optional image
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-6971b43c/workshop/messages`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            workOrderId: selectedWorkOrder.id,
            message: newMessage.trim() || (imageUrl ? 'Imagem enviada' : ''),
            imageUrl
          })
        }
      )
      
      if (response.ok) {
        setNewMessage('')
        setSelectedImage(null)
        setImagePreview(null)
        await loadMessages(selectedWorkOrder.id)
        toast.success(imageUrl ? 'Mensagem e imagem enviadas' : 'Mensagem enviada')
      } else {
        throw new Error('Failed to send message')
      }
    } catch (error) {
      console.error('Error sending message:', error)
      toast.error('Erro ao enviar mensagem')
    } finally {
      setSendingMessage(false)
      setUploadingImage(false)
    }
  }
  
  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        toast.error('Por favor selecione apenas ficheiros de imagem')
        return
      }
      
      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        toast.error('A imagem não pode exceder 5MB')
        return
      }
      
      setSelectedImage(file)
      
      // Create preview
      const reader = new FileReader()
      reader.onloadend = () => {
        setImagePreview(reader.result as string)
      }
      reader.readAsDataURL(file)
    }
  }
  
  const removeSelectedImage = () => {
    setSelectedImage(null)
    setImagePreview(null)
  }
  
  const markMessagesAsRead = async (workOrderId: string) => {
    if (!workOrderId) return
    
    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-6971b43c/workshop/messages/${workOrderId}/read-all`,
        {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${accessToken}` }
        }
      )
      
      if (response.ok) {
        setUnreadMessagesCount(0)
        await loadMessages(workOrderId)
      }
    } catch (error) {
      console.error('Error marking messages as read:', error)
    }
  }

  const getVehicleImageUrl = (vehicle?: any) => {
    if (!vehicle) return 'https://images.unsplash.com/photo-1542362567-b07e54358753?w=400&h=300&fit=crop'
    // Priority: VIN Decoder model image > VIN Decoder brand image > generic image
    if (vehicle.AWN_model_image) return vehicle.AWN_model_image
    if (vehicle.AWN_url_image) return vehicle.AWN_url_image
    return 'https://images.unsplash.com/photo-1542362567-b07e54358753?w=400&h=300&fit=crop'
  }

  const fetchTechnicalData = async (licensePlate: string) => {
    if (!licensePlate) return
    
    setLoadingTechnicalData(true)
    try {
      console.log(`🔍 Buscando dados técnicos para matrícula: ${licensePlate}`)
      
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-6971b43c/infomatricula/search?plate=${encodeURIComponent(licensePlate)}`,
        {
          headers: {
            'Authorization': `Bearer ${publicAnonKey}`,
          },
        }
      )

      if (response.ok) {
        const data = await response.json()
        console.log('✅ Dados técnicos carregados:', data)
        setTechnicalData(data)
      } else {
        console.log('⚠️ Matrícula não encontrada no InfoMatricula')
        setTechnicalData(null)
      }
    } catch (error) {
      console.error('❌ Erro ao buscar dados técnicos:', error)
      setTechnicalData(null)
    } finally {
      setLoadingTechnicalData(false)
    }
  }

  const addService = () => {
    const newService: ServiceItem = {
      id: Date.now().toString(),
      reference: '',
      designation: '',
      quantity: 1,
      unitPrice: 0,
      discount: 0,
      total: 0,
      status: 'pending',
      isLabor: false
    }
    const updatedServices = [...services, newService]
    setServices(updatedServices)
    // Trigger auto-save
    debouncedSave(updatedServices)
  }

  const addLaborService = () => {
    if (laborTypes.length === 0) {
      toast.error('Configure primeiro os tipos de mão de obra em Configurações')
      return
    }
    
    const firstLaborType = laborTypes[0]
    const newLaborService: ServiceItem = {
      id: Date.now().toString(),
      reference: 'MO',
      designation: firstLaborType.name,
      quantity: 1,
      unitPrice: firstLaborType.hourlyRate,
      discount: 0,
      total: firstLaborType.hourlyRate,
      status: 'pending',
      isLabor: true,
      laborTypeId: firstLaborType.id,
      laborHours: 1
    }
    const updatedServices = [...services, newLaborService]
    setServices(updatedServices)
    // Trigger auto-save
    debouncedSave(updatedServices)
    toast.success('Mão de obra adicionada')
  }

  const updateService = (id: string, field: string, value: any) => {
    const updatedServices = services.map(service => {
      if (service.id === id) {
        const updated = { ...service, [field]: value }
        
        // Special handling for labor type changes
        if (field === 'laborTypeId' && updated.isLabor) {
          const selectedLaborType = laborTypes.find(lt => lt.id === value)
          if (selectedLaborType) {
            updated.designation = selectedLaborType.name
            updated.unitPrice = selectedLaborType.hourlyRate
          }
        }
        
        // Calculate total based on whether it's labor or regular service
        if (updated.isLabor) {
          // For labor: hours * hourly rate * (1 - discount)
          const hours = updated.laborHours || 1
          const unitPrice = updated.unitPrice || 0
          const discount = updated.discount || 0
          updated.total = (hours * unitPrice) * (1 - discount / 100)
          
          // Debug logging for labor calculations
          if (field === 'laborHours' || field === 'unitPrice' || field === 'discount') {
            console.log('💼 Labor calculation:', {
              field,
              hours,
              unitPrice,
              discount,
              total: updated.total
            })
          }
        } else {
          // For regular service: quantity * unit price * (1 - discount)
          updated.total = (updated.quantity * updated.unitPrice) * (1 - updated.discount / 100)
        }
        
        return updated
      }
      return service
    })
    setServices(updatedServices)
    // Trigger auto-save
    debouncedSave(updatedServices)
  }

  const removeService = (id: string) => {
    const updatedServices = services.filter(s => s.id !== id)
    setServices(updatedServices)
    // Trigger auto-save
    debouncedSave(updatedServices)
  }
  
  const getCurrentTotalTime = (): number => {
    if (!selectedWorkOrder) return 0
    return workflowTimer.getTimerTime(selectedWorkOrder.id)
  }

  const formatWorkflowTime = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    const secs = seconds % 60
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }
  
  const updateWorkflowStatus = async (newStatus: string) => {
    // Status que fazem contagem de tempo
    const timedStatuses = ['diagnosis', 'execution']
    const isTimedStatus = timedStatuses.includes(newStatus)
    
    const oldStatus = workflowStatus
    
    // Auto-save to work order
    if (!selectedWorkOrder) return
    
    // Obter tempo consolidado atual do contexto
    const currentTotalTime = workflowTimer.getTimerTime(selectedWorkOrder.id)
    
    // Atualizar o status local
    setWorkflowStatus(newStatus)
    setWorkflowAccumulatedTime(currentTotalTime)
    
    // Atualizar timer no contexto global
    workflowTimer.updateTimerStatus(selectedWorkOrder.id, newStatus, currentTotalTime)
    
    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-6971b43c/workorders/${selectedWorkOrder.id}`,
        {
          method: 'PUT',
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            workflowStatus: newStatus,
            workflowAccumulatedTime: currentTotalTime,
            workflowStartTime: isTimedStatus ? Date.now() : null
          })
        }
      )
      
      if (!response.ok) {
        throw new Error('Failed to update workflow status')
      }
      
      // Map workflow status to service sheet status for client portal
      const statusMapping: Record<string, string> = {
        'reception-complete': 'reception',
        'diagnosis': 'diagnosis',
        'budgeting': 'budgeting',
        'waiting-approval': 'waiting_approval',
        'waiting-parts': 'waiting_parts',
        'execution': 'execution',
        'paused': 'paused',
        'delivery': 'delivery',
        'completed': 'completed'
      }
      
      const mappedOldStatus = statusMapping[oldStatus] || oldStatus
      const mappedNewStatus = statusMapping[newStatus] || newStatus
      
      console.log('🔄 WORKFLOW STATUS UPDATE:', {
        workOrderId: selectedWorkOrder.id,
        workOrderNumber: selectedWorkOrder.number,
        oldWorkflowStatus: oldStatus,
        newWorkflowStatus: newStatus,
        mappedOldStatus,
        mappedNewStatus,
        hasServiceSheetId: !!selectedWorkOrder.serviceSheetId,
        serviceSheetIdValue: selectedWorkOrder.serviceSheetId
      })
      
      // Update or create service sheet with new status
      let serviceSheetId = selectedWorkOrder.serviceSheetId
      
      // IMPORTANT: If no serviceSheetId in memory, try to find existing one in database
      if (!serviceSheetId) {
        console.log('⚠️ No serviceSheetId in selectedWorkOrder, searching database for existing service sheet...')
        try {
          const searchResponse = await fetch(
            `https://${projectId}.supabase.co/functions/v1/make-server-6971b43c/client/service-sheet-status/${selectedWorkOrder.id}`,
            {
              headers: {
                'Authorization': `Bearer ${accessToken}`,
              },
            }
          )
          if (searchResponse.ok) {
            const searchData = await searchResponse.json()
            if (searchData.serviceSheet && searchData.serviceSheet.id) {
              serviceSheetId = searchData.serviceSheet.id
              console.log('✅ Found existing service sheet in database:', serviceSheetId)
              // Update local state so we don't search again
              setSelectedWorkOrder(prev => prev ? { ...prev, serviceSheetId } : null)
            } else {
              console.log('ℹ️ No existing service sheet found in database')
            }
          }
        } catch (searchError) {
          console.error('⚠️ Error searching for existing service sheet:', searchError)
        }
      }
      
      if (!serviceSheetId) {
        // Create service sheet if it doesn't exist
        console.log('📝 Creating NEW service sheet for work order:', {
          workOrderId: selectedWorkOrder.id,
          workOrderNumber: selectedWorkOrder.number,
          vehicleId: selectedWorkOrder.vehicleId,
          clientId: selectedWorkOrder.clientId,
          initialStatus: mappedNewStatus
        })
        try {
          const createResponse = await fetch(
            `https://${projectId}.supabase.co/functions/v1/make-server-6971b43c/service-sheets`,
            {
              method: 'POST',
              headers: {
                'Authorization': `Bearer ${accessToken}`,
                'Content-Type': 'application/json'
              },
              body: JSON.stringify({
                workOrderId: selectedWorkOrder.id,
                vehicleId: selectedWorkOrder.vehicleId,
                clientId: selectedWorkOrder.clientId,
                status: mappedNewStatus,
                symptoms: symptoms || '',
                clientObservations: clientObservations || '',
                interventionNotes: interventionNotes || '',
                hasKey: hasKey,
                hasManual: hasManual,
                hasDocuments: hasDocuments,
                assignedEmployeeId: assignedEmployeeId || null
              })
            }
          )
          
          if (createResponse.ok) {
            const createData = await createResponse.json()
            serviceSheetId = createData.serviceSheet?.id
            console.log('✅ Service sheet created successfully:', serviceSheetId)
            
            // Update work order with service sheet ID
            console.log('🔗 Linking service sheet to work order...')
            const linkResponse = await fetch(
              `https://${projectId}.supabase.co/functions/v1/make-server-6971b43c/workorders/${selectedWorkOrder.id}`,
              {
                method: 'PUT',
                headers: {
                  'Authorization': `Bearer ${accessToken}`,
                  'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                  serviceSheetId: serviceSheetId
                })
              }
            )
            
            if (linkResponse.ok) {
              console.log('✅ Service sheet linked to work order successfully')
            } else {
              console.error('❌ Failed to link service sheet to work order:', await linkResponse.text())
            }
            
            // Update local state
            setSelectedWorkOrder(prev => prev ? { ...prev, serviceSheetId } : null)
          } else {
            const errorText = await createResponse.text()
            console.error('❌ Failed to create service sheet - Response not OK:', createResponse.status, errorText)
          }
        } catch (createError) {
          console.error('⚠️ Failed to create service sheet - Exception:', createError)
        }
      } else {
        // Update existing service sheet status
        console.log('🔄 Updating EXISTING service sheet:', {
          serviceSheetId,
          oldStatus: mappedOldStatus,
          newStatus: mappedNewStatus
        })
        try {
          const updateResponse = await fetch(
            `https://${projectId}.supabase.co/functions/v1/make-server-6971b43c/service-sheets/${serviceSheetId}`,
            {
              method: 'PUT',
              headers: {
                'Authorization': `Bearer ${accessToken}`,
                'Content-Type': 'application/json'
              },
              body: JSON.stringify({
                status: mappedNewStatus
              })
            }
          )
          
          if (updateResponse.ok) {
            console.log('✅ Service sheet status updated successfully:', mappedNewStatus)
          } else {
            const errorText = await updateResponse.text()
            console.error('❌ Failed to update service sheet - Response not OK:', updateResponse.status, errorText)
          }
        } catch (updateError) {
          console.error('⚠️ Failed to update service sheet - Exception:', updateError)
        }
      }
      
      // Register status change in history if status actually changed
      console.log('📜 Checking if should create history entry:', {
        workflowStatusChanged: oldStatus !== newStatus,
        hasServiceSheetId: !!serviceSheetId,
        mappedStatusChanged: mappedOldStatus !== mappedNewStatus,
        oldWorkflowStatus: oldStatus,
        newWorkflowStatus: newStatus,
        mappedOldStatus,
        mappedNewStatus
      })
      
      if (oldStatus !== newStatus && serviceSheetId && mappedOldStatus !== mappedNewStatus) {
        console.log('📝 Creating status history entry...')
        try {
          const historyPayload = {
            serviceSheetId: serviceSheetId,
            workOrderId: selectedWorkOrder.id,
            clientId: selectedWorkOrder.clientId,
            workshopId: workshop?.id,
            oldStatus: mappedOldStatus,
            newStatus: mappedNewStatus
          }
          console.log('📤 History payload:', historyPayload)
          
          const historyResponse = await fetch(
            `https://${projectId}.supabase.co/functions/v1/make-server-6971b43c/service-sheet-status-history`,
            {
              method: 'POST',
              headers: {
                'Authorization': `Bearer ${accessToken}`,
                'Content-Type': 'application/json'
              },
              body: JSON.stringify(historyPayload)
            }
          )
          
          if (!historyResponse.ok) {
            const errorText = await historyResponse.text()
            console.error('❌ Failed to record status history - Response not OK:', historyResponse.status, errorText)
          } else {
            const historyData = await historyResponse.json()
            console.log('✅ Status history recorded successfully:', { 
              workflowOldStatus: oldStatus, 
              workflowNewStatus: newStatus,
              mappedOldStatus, 
              mappedNewStatus,
              response: historyData
            })
          }
        } catch (historyError) {
          console.error('⚠️ Failed to record status history - Exception:', historyError)
          // Don't show error to user - this is non-critical
        }
      } else {
        console.log('ℹ️ Skipping history entry creation - conditions not met')
      }
      
      toast.success('Estado do fluxo atualizado')
    } catch (error) {
      console.error('Error updating workflow status:', error)
      toast.error('Erro ao atualizar estado do fluxo')
    }
  }

  const loadServicesFromWorkOrder = (workOrder: any) => {
    // Load assigned employee from work order
    if (workOrder.assignedEmployeeId) {
      setAssignedEmployeeId(workOrder.assignedEmployeeId)
      console.log('👤 Loaded assigned employee:', workOrder.assignedEmployeeId)
    } else {
      setAssignedEmployeeId('')
    }
    
    // Load workflow status from work order
    if (workOrder.workflowStatus) {
      console.log('📊 Carregando workflow da WO:', {
        workOrderId: workOrder.id,
        workOrderNumber: workOrder.number,
        workflowStatus: workOrder.workflowStatus,
        workflowAccumulatedTime: workOrder.workflowAccumulatedTime || 0,
        workflowStartTime: workOrder.workflowStartTime
      })
      
      setWorkflowStatus(workOrder.workflowStatus)
      setWorkflowAccumulatedTime(workOrder.workflowAccumulatedTime || 0)
      setWorkflowStartTime(workOrder.workflowStartTime || null)
      
      // Verificar se já existe timer no contexto global
      const existingTimerTime = workflowTimer.getTimerTime(workOrder.id)
      const hasExistingTimer = existingTimerTime > 0 || workflowTimer.isTimerActive(workOrder.id) || workflowTimer.isTimerPaused(workOrder.id)
      
      console.log('🔍 Verificando timer existente:', {
        workOrderId: workOrder.id,
        existingTimerTime,
        hasExistingTimer,
        isActive: workflowTimer.isTimerActive(workOrder.id),
        isPaused: workflowTimer.isTimerPaused(workOrder.id)
      })
      
      if (hasExistingTimer) {
        // JÁ EXISTE timer no contexto - NÃO recriar, usar o tempo do contexto
        console.log('✅ Timer já existe no contexto global. Usando tempo existente:', existingTimerTime)
        setWorkflowAccumulatedTime(existingTimerTime)
      } else {
        // Timer não existe no contexto, criar baseado no DB
        const timedStatuses = ['diagnosis', 'execution']
        if (timedStatuses.includes(workOrder.workflowStatus)) {
          console.log('⏱️ WO em status com timer. Iniciando timer global...')
          workflowTimer.startTimer(
            workOrder.id,
            workOrder.number,
            workOrder.workflowStatus,
            workOrder.workflowAccumulatedTime || 0
          )
        } else {
          console.log('ℹ️ Status não requer timer ativo.')
        }
      }
    } else {
      // Default to reception-complete
      setWorkflowStatus('reception-complete')
      setWorkflowAccumulatedTime(0)
      setWorkflowStartTime(null)
      
      // Não remover timer - deixar pausado se existir
      console.log('ℹ️ WO sem workflow status, defaulting to reception-complete')
    }

    if (!workOrder || !workOrder.items || workOrder.items.length === 0) {
      setServices([])
      if (workOrder) {
        toast.info(`Folha de Obra ${workOrder.number} não tem serviços`)
      }
      return
    }

    // Map work order items to services
    const mappedServices: ServiceItem[] = workOrder.items.map((item: any, index: number) => {
      const isLabor = item.isLabor || false
      const quantity = item.quantity || 1
      const price = item.price || 0
      const discount = item.discount || 0
      const laborHours = item.laborHours || 1
      
      // Calculate total correctly based on whether it's labor or regular service
      const total = isLabor 
        ? (laborHours * price) * (1 - discount / 100)
        : (quantity * price) * (1 - discount / 100)
      
      return {
        id: `${workOrder.id}-${index}`,
        reference: item.partNumber || item.reference || '',
        designation: item.description || '',
        quantity,
        unitPrice: price,
        discount,
        total,
        status: 'pending',
        isLabor,
        laborTypeId: item.laborTypeId,
        laborHours
      }
    })

    setServices(mappedServices)
    console.log('✅ Loaded services from work order:', {
      workOrderNumber: workOrder.number,
      servicesCount: mappedServices.length,
      assignedEmployeeId: workOrder.assignedEmployeeId
    })
    
    const employeeInfo = workOrder.assignedEmployeeId 
      ? employees.find(e => e.id === workOrder.assignedEmployeeId)
      : null
    
    if (employeeInfo) {
      toast.success(`${mappedServices.length} serviços carregados • Atribuído a ${employeeInfo.name}`)
    } else {
      toast.success(`${mappedServices.length} serviços carregados da Folha de Obra ${workOrder.number}`)
    }
  }

  const saveServicesToWorkOrder = async (updatedServices: ServiceItem[], employeeId?: string) => {
    if (!selectedWorkOrder || !selectedWorkOrder.id) {
      console.log('⚠️ No work order selected, skipping save')
      return
    }

    setIsSaving(true)
    try {
      // Convert services back to work order items format
      const items = updatedServices.map((service) => ({
        partNumber: service.reference,
        reference: service.reference,
        description: service.designation,
        quantity: service.quantity,
        price: service.unitPrice,
        discount: service.discount,
        isLabor: service.isLabor,
        laborTypeId: service.laborTypeId,
        laborHours: service.laborHours
      }))

      // Calculate totals
      const partsTotal = items.reduce((sum, item) => {
        // Calculate correctly based on whether it's labor or regular service
        const itemTotal = item.isLabor
          ? (item.laborHours || 1) * item.price * (1 - item.discount / 100)
          : item.quantity * item.price * (1 - item.discount / 100)
        return sum + itemTotal
      }, 0)

      const laborHours = selectedWorkOrder.laborHours || 0
      const laborRate = selectedWorkOrder.laborRate || 25
      const laborTotal = laborHours * laborRate
      const subtotal = partsTotal + laborTotal
      const tax = subtotal * 0.23
      const total = subtotal + tax

      // Prepare update data
      const updateData: any = {
        items,
        laborHours,
        laborRate,
        partsTotal,
        laborTotal,
        subtotal,
        tax,
        total
      }

      // Add assignedEmployeeId if provided
      if (employeeId !== undefined) {
        updateData.assignedEmployeeId = employeeId === 'none' ? null : employeeId
      }

      // Update work order with new items and totals
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-6971b43c/workorders/${selectedWorkOrder.id}`,
        {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${accessToken}`
          },
          body: JSON.stringify(updateData)
        }
      )

      if (!response.ok) {
        const errorText = await response.text()
        throw new Error(`Failed to save: ${errorText}`)
      }

      console.log('✅ Services auto-saved to work order:', selectedWorkOrder.number)
      
      // Trigger refresh in other modules (without reloading in this module)
      integration.triggerRefresh('workorders')
      
      // Show subtle success toast
      toast.success('Alterações guardadas automaticamente', { duration: 2000 })
    } catch (error: any) {
      console.error('❌ Error auto-saving services:', error)
      toast.error('Erro ao guardar alterações: ' + (error.message || 'Erro desconhecido'))
    } finally {
      setIsSaving(false)
    }
  }

  const debouncedSave = (updatedServices: ServiceItem[], employeeId?: string) => {
    // Clear existing timeout
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current)
    }

    // Set new timeout for auto-save (1 second after last change)
    saveTimeoutRef.current = setTimeout(() => {
      saveServicesToWorkOrder(updatedServices, employeeId)
    }, 1000)
  }

  const calculateTotals = () => {
    const pending = services.filter(s => s.status === 'pending').reduce((sum, s) => sum + s.total, 0)
    const approved = services.filter(s => s.status === 'approved').reduce((sum, s) => sum + s.total, 0)
    const total = services.reduce((sum, s) => sum + s.total, 0)
    
    // Calculate VAT amounts
    const vatAmount = total * (vatRate / 100)
    const totalWithVat = total + vatAmount
    const pendingWithVat = pending + (pending * (vatRate / 100))
    const approvedWithVat = approved + (approved * (vatRate / 100))
    
    return { 
      pending, 
      approved, 
      total, 
      vatAmount, 
      totalWithVat,
      pendingWithVat,
      approvedWithVat
    }
  }

  const selectedVehicle = vehicles.find(v => v.id === selectedVehicleId)
  const selectedClient = selectedVehicle ? clients.find(c => c.id === selectedVehicle.clientId) : null
  const totals = calculateTotals()

  // Fetch technical data when vehicle is selected
  useEffect(() => {
    if (selectedVehicle?.licensePlate) {
      fetchTechnicalData(selectedVehicle.licensePlate)
    } else {
      setTechnicalData(null)
    }
  }, [selectedVehicle?.id])

  // Print Service Sheet using default template
  const handlePrintServiceSheet = async () => {
    console.log('🖨️ Starting print service sheet...')
    console.log('📋 Data check:', {
      hasWorkOrder: !!selectedWorkOrder,
      hasVehicle: !!selectedVehicle,
      hasClient: !!selectedClient,
      hasWorkshop: !!workshop
    })

    if (!selectedWorkOrder || !selectedVehicle || !selectedClient) {
      toast.error('Selecione uma folha de obra primeiro')
      return
    }

    try {
      console.log('🔍 Fetching templates...')
      // Fetch default service-sheet template
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-6971b43c/templates`,
        {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
          },
        }
      )

      console.log('📡 Templates response status:', response.status)

      if (!response.ok) {
        const errorText = await response.text()
        console.error('❌ Templates fetch error:', errorText)
        toast.error('Erro ao carregar templates')
        return
      }

      const { templates } = await response.json()
      console.log('📄 Templates loaded:', templates?.length || 0)
      
      // Find default template for service-sheet PDF
      const defaultTemplate = templates.find(
        (t: any) => t.type === 'pdf' && t.category === 'service-sheet' && t.isDefault
      )

      console.log('🎯 Default template found:', !!defaultTemplate)
      if (defaultTemplate) {
        console.log('📋 Template details:', {
          name: defaultTemplate.name,
          type: defaultTemplate.type,
          category: defaultTemplate.category
        })
      }

      if (!defaultTemplate) {
        console.error('❌ No default template found. Templates:', templates.map((t: any) => ({
          name: t.name,
          type: t.type,
          category: t.category,
          isDefault: t.isDefault
        })))
        toast.error('Nenhum template padrão configurado para Folha de Serviço')
        return
      }

      // Prepare data for template
      const templateData = {
        workshopName: workshop?.name || '',
        workshopNif: workshop?.nif || '',
        workshopPhone: workshop?.phone || '',
        workshopEmail: workshop?.email || '',
        workshopAddress: workshop?.address || '',
        workshopPostalCode: workshop?.postalCode || '',
        workshopLocality: workshop?.locality || '',
        workshopWebsite: workshop?.website || '',
        clientName: selectedClient.name || '',
        clientNif: selectedClient.nif || '',
        clientPhone: selectedClient.phone || '',
        clientEmail: selectedClient.email || '',
        vehiclePlate: selectedVehicle.licensePlate || '',
        vehicleModel: selectedVehicle.model || '',
        vehicleMake: selectedVehicle.brand || '',
        vehicleYear: selectedVehicle.year || '',
        vehicleKm: selectedVehicle.mileage || '',
        totalPrice: totals.total.toFixed(2),
        vatRate: vatRate.toString(),
        vatAmount: totals.vatAmount.toFixed(2),
        totalWithVat: totals.totalWithVat.toFixed(2),
        serviceDate: new Date().toLocaleDateString('pt-PT'),
        budgetDate: new Date().toLocaleDateString('pt-PT'),
        mechanicName: employees.find(e => e.id === assignedEmployeeId)?.name || 'N/A',
        serviceSheetNumber: selectedWorkOrder.number || '',
        budgetNumber: selectedWorkOrder.number || '',
        observations: interventionNotes || '',
        servicesTable: services.map((s, i) => 
          `${i + 1}. ${s.designation} - ${s.quantity}x ${s.unitPrice.toFixed(2)}€ = ${s.total.toFixed(2)}€`
        ).join('\n'),
        servicesList: services.map(s => s.designation).join(', ')
      }

      // Process template content
      let content = defaultTemplate.content

      // Process conditional fields {{#if condition}}...{{/if}}
      content = content.replace(/\{\{#if\s+(\w+)\}\}([\s\S]*?)\{\{\/if\}\}/g, (match: string, condition: string, condContent: string) => {
        return templateData[condition as keyof typeof templateData] ? condContent : ''
      })

      // Process calculated fields {{= expression}}
      content = content.replace(/\{\{=\s*([^}]+)\}\}/g, (match: string, expression: string) => {
        try {
          let calc = expression
          Object.keys(templateData).forEach(key => {
            const value = templateData[key as keyof typeof templateData] || '0'
            calc = calc.replace(new RegExp(`\\b${key}\\b`, 'g'), value.toString())
          })
          console.log('🧮 Evaluating expression:', { original: expression, processed: calc })
          const result = eval(calc)
          const formatted = typeof result === 'number' ? result.toFixed(2) : result.toString()
          console.log('✅ Expression result:', formatted)
          return formatted
        } catch (e: any) {
          console.error('❌ Expression error:', expression, e.message)
          return `[Error: ${expression}]`
        }
      })

      // Replace regular fields
      Object.keys(templateData).forEach(key => {
        const regex = new RegExp(`\\{\\{${key}\\}\\}`, 'g')
        content = content.replace(regex, templateData[key as keyof typeof templateData]?.toString() || '')
      })

      console.log('📄 Template content processed successfully')
      console.log('📏 Content length:', content.length)
      
      // Open print window with processed content
      console.log('🪟 Opening print window...')
      const printWindow = window.open('', '_blank')
      if (printWindow) {
        printWindow.document.write(`
          <!DOCTYPE html>
          <html>
            <head>
              <title>Folha de Serviço - ${selectedWorkOrder.number}</title>
              <style>
                @page {
                  margin: 2cm;
                }
                body {
                  font-family: 'Courier New', monospace;
                  font-size: 12px;
                  line-height: 1.6;
                  white-space: pre-wrap;
                  margin: 0;
                  padding: 20px;
                }
                @media print {
                  body {
                    padding: 0;
                  }
                  .no-print {
                    display: none;
                  }
                }
              </style>
            </head>
            <body>
              ${content}
              <div class="no-print" style="margin-top: 20px; text-align: center;">
                <button onclick="window.print()" style="padding: 10px 20px; font-size: 14px; cursor: pointer;">
                  Imprimir
                </button>
                <button onclick="window.close()" style="padding: 10px 20px; font-size: 14px; cursor: pointer; margin-left: 10px;">
                  Fechar
                </button>
              </div>
            </body>
          </html>
        `)
        printWindow.document.close()
        toast.success('Folha de serviço gerada com sucesso!')
      } else {
        console.error('❌ Failed to open print window')
        toast.error('Erro ao abrir janela de impressão')
      }
    } catch (error: any) {
      console.error('❌ Error printing service sheet:', error)
      console.error('Error details:', {
        message: error?.message,
        stack: error?.stack
      })
      toast.error(`Erro ao gerar folha de serviço: ${error?.message || 'Erro desconhecido'}`)
    }
  }

  // Get work order for selected vehicle
  const vehicleWorkOrder = selectedVehicleId ? workOrders.find(wo => wo.vehicleId === selectedVehicleId) : null

  // Filter vehicles based on showOnlyWithWorkOrders state
  const filteredVehicles = showOnlyWithWorkOrders
    ? vehicles.filter(v => workOrders.some(wo => wo.vehicleId === v.id))
    : vehicles

  return (
    <div className="space-y-6 p-6 bg-background">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2>Folha de Serviço</h2>
          <p className="text-muted-foreground">Gestão completa de serviços e intervenções</p>
        </div>
        <div className="flex gap-2 items-center">
          {/* Auto-save indicator */}
          {isSaving && (
            <Badge variant="secondary" className="animate-pulse">
              <Save className="h-3 w-3 mr-1" />
              A guardar...
            </Badge>
          )}
          {!isSaving && selectedWorkOrder && (
            <Badge variant="outline" className="text-green-600 border-green-600">
              <Check className="h-3 w-3 mr-1" />
              Guardado
            </Badge>
          )}
          
          {/* Action Buttons - Only show when work order is selected */}
          {selectedWorkOrder && (
            <>
              <Separator orientation="vertical" className="h-8" />
              
              {/* Print Service Sheet */}
              <Button 
                variant="outline" 
                size="sm"
                className="gap-2"
                onClick={handlePrintServiceSheet}
                disabled={!selectedWorkOrder || !selectedVehicle || !selectedClient}
              >
                <FileText className="h-4 w-4" />
                Imprimir Folha
              </Button>
              
              {/* Print Budget */}
              <Button 
                variant="outline" 
                size="sm"
                className="gap-2"
              >
                <Calculator className="h-4 w-4" />
                Imprimir Orçamento
              </Button>
              
              {/* Share Dropdown */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button 
                    variant="outline" 
                    size="sm"
                    className="gap-2"
                  >
                    <Share2 className="h-4 w-4" />
                    Partilhar
                    <ChevronDown className="h-3 w-3 opacity-50" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                  <DropdownMenuItem className="gap-2 cursor-pointer">
                    <Mail className="h-4 w-4" />
                    <span>Email</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem className="gap-2 cursor-pointer">
                    <MessageSquare className="h-4 w-4" />
                    <span>WhatsApp</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem className="gap-2 cursor-pointer">
                    <Phone className="h-4 w-4" />
                    <span>SMS</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
              
              {/* Invoice Button */}
              <Button 
                variant="default" 
                size="sm"
                className="gap-2 bg-blue-600 hover:bg-blue-700"
              >
                <Receipt className="h-4 w-4" />
                Faturar
              </Button>
              
              {/* Close Process Button */}
              <Button 
                variant="default" 
                size="sm"
                className="gap-2 bg-green-600 hover:bg-green-700"
              >
                <FolderCheck className="h-4 w-4" />
                Fechar Processo
              </Button>
            </>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-10 gap-6">
        {/* Left Column - Main Form */}
        <div className="lg:col-span-7 space-y-6">
          {/* Client Messages/Communication Section */}
          {selectedWorkOrder && (
            <Collapsible open={isMessagesOpen} onOpenChange={setIsMessagesOpen}>
              <Card className="border-blue-200 bg-gradient-to-r from-blue-50/50 to-transparent">
                <CardHeader className="cursor-pointer hover:bg-blue-50/50 transition-colors select-none">
                  <CollapsibleTrigger asChild>
                    <div className="flex items-center justify-between w-full group">
                      <div className="flex-1">
                        <CardTitle className="flex items-center gap-2">
                          <MessageSquare className="h-5 w-5 text-blue-600" />
                          Mensagens/Comunicação Cliente
                        </CardTitle>
                        {!isMessagesOpen && messages.length > 0 && (
                          <p className="text-sm text-muted-foreground mt-1.5 line-clamp-1">
                            {messages[messages.length - 1]?.message || ''}
                          </p>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        {unreadMessagesCount > 0 && (
                          <Badge className="bg-red-500 text-white">
                            {unreadMessagesCount} nova{unreadMessagesCount > 1 ? 's' : ''}
                          </Badge>
                        )}
                        <Badge variant={messages.length > 0 ? 'default' : 'secondary'} className="text-xs">
                          {messages.length} mensagen{messages.length !== 1 ? 's' : 'm'}
                        </Badge>
                        <ChevronDown className={`h-5 w-5 text-muted-foreground transition-all duration-200 group-hover:text-blue-600 ${isMessagesOpen ? 'transform rotate-180' : ''}`} />
                      </div>
                    </div>
                  </CollapsibleTrigger>
                </CardHeader>
                
                <CollapsibleContent className="collapsible-content">
                  <Separator className="mb-4" />
                  <CardContent className="space-y-4 pt-0">
                    {/* Last Message Display */}
                    {messages.length > 0 && (
                      <div className="space-y-2">
                        <div className="flex items-center justify-between mb-2">
                          <Label className="text-sm">Última Mensagem</Label>
                          {!showMessageHistory && messages.length > 1 && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setShowMessageHistory(true)}
                              className="text-xs"
                            >
                              <History className="h-3 w-3 mr-1" />
                              Ver Histórico ({messages.length - 1} anterior{messages.length > 2 ? 'es' : ''})
                            </Button>
                          )}
                          {showMessageHistory && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setShowMessageHistory(false)}
                              className="text-xs"
                            >
                              Ocultar Histórico
                            </Button>
                          )}
                        </div>
                        
                        {/* Messages Display */}
                        <div className="space-y-3 max-h-[400px] overflow-y-auto border rounded-lg p-3 bg-white">
                          {(showMessageHistory ? messages : [messages[messages.length - 1]]).map((msg, index) => (
                            <div
                              key={msg.id || index}
                              className={`p-3 rounded-lg ${
                                msg.from === 'client'
                                  ? 'bg-blue-100 border-blue-200 border ml-0 mr-8'
                                  : 'bg-green-100 border-green-200 border ml-8 mr-0'
                              }`}
                            >
                              <div className="flex items-start justify-between gap-2 mb-1">
                                <span className={`text-xs font-medium ${
                                  msg.from === 'client' ? 'text-blue-900' : 'text-green-900'
                                }`}>
                                  {msg.from === 'client' ? `👤 ${selectedClient?.name || 'Cliente'}` : '🔧 Oficina'}
                                </span>
                                <div className="flex items-center gap-1">
                                  <span className="text-xs text-muted-foreground">
                                    {new Date(msg.timestamp).toLocaleString('pt-PT', {
                                      day: '2-digit',
                                      month: '2-digit',
                                      year: 'numeric',
                                      hour: '2-digit',
                                      minute: '2-digit'
                                    })}
                                  </span>
                                  {msg.from === 'workshop' && (
                                    <span className="flex items-center ml-1">
                                      {msg.read ? (
                                        <CheckCheck className="h-3 w-3 text-green-600" title="Lido pelo cliente" />
                                      ) : (
                                        <Check className="h-3 w-3 text-green-700" title="Enviado" />
                                      )}
                                    </span>
                                  )}
                                </div>
                              </div>
                              <p className={`text-sm ${
                                msg.from === 'client' ? 'text-blue-900' : 'text-green-900'
                              }`}>
                                {msg.message}
                              </p>
                              {msg.imageUrl && (
                                <div className="mt-2">
                                  <a 
                                    href={msg.imageUrl} 
                                    target="_blank" 
                                    rel="noopener noreferrer"
                                    className="block"
                                  >
                                    <ImageWithFallback
                                      src={msg.imageUrl}
                                      alt="Imagem da mensagem"
                                      className="max-w-full h-auto rounded-lg border-2 border-white shadow-sm hover:shadow-md transition-shadow cursor-pointer"
                                      style={{ maxHeight: '300px', objectFit: 'contain' }}
                                    />
                                  </a>
                                </div>
                              )}
                              {msg.from === 'client' && !msg.read && (
                                <Badge className="mt-2 text-xs bg-red-500 text-white">Nova</Badge>
                              )}
                            </div>
                          ))}
                        </div>
                        
                        {/* Mark as Read Button */}
                        {unreadMessagesCount > 0 && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => markMessagesAsRead(selectedWorkOrder.id)}
                            className="w-full text-blue-600 border-blue-200 hover:bg-blue-50"
                          >
                            <Check className="h-4 w-4 mr-2" />
                            Marcar {unreadMessagesCount} mensagen{unreadMessagesCount > 1 ? 's' : 'm'} como lida{unreadMessagesCount > 1 ? 's' : ''}
                          </Button>
                        )}
                      </div>
                    )}
                    
                    {messages.length === 0 && (
                      <div className="text-center py-8 text-muted-foreground border rounded-lg bg-muted/30">
                        <MessageSquare className="h-12 w-12 mx-auto mb-2 opacity-30" />
                        <p className="text-sm">Nenhuma mensagem ainda</p>
                        <p className="text-xs mt-1">Inicie uma conversa com o cliente sobre esta folha de obra</p>
                      </div>
                    )}
                    
                    {/* Send Message Section */}
                    <div className="space-y-2">
                      <Label className="text-sm">Enviar Mensagem ao Cliente</Label>
                      
                      {/* Image Preview */}
                      {imagePreview && (
                        <div className="relative inline-block">
                          <ImageWithFallback
                            src={imagePreview}
                            alt="Preview"
                            className="max-w-xs h-auto rounded-lg border-2 border-blue-200"
                            style={{ maxHeight: '200px', objectFit: 'contain' }}
                          />
                          <Button
                            variant="destructive"
                            size="icon"
                            className="absolute top-2 right-2 h-6 w-6 rounded-full"
                            onClick={removeSelectedImage}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      )}
                      
                      <div className="flex gap-2">
                        <Textarea
                          placeholder="Escreva a sua mensagem ao cliente..."
                          value={newMessage}
                          onChange={(e) => setNewMessage(e.target.value)}
                          rows={2}
                          className="resize-none flex-1"
                          onKeyDown={(e) => {
                            if (e.key === 'Enter' && e.ctrlKey) {
                              e.preventDefault()
                              sendMessage()
                            }
                          }}
                        />
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <input
                            type="file"
                            accept="image/*"
                            onChange={handleImageSelect}
                            className="hidden"
                            id="message-image-upload"
                          />
                          <label htmlFor="message-image-upload">
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              className="cursor-pointer"
                              asChild
                            >
                              <span>
                                <ImageIcon className="h-4 w-4 mr-2" />
                                Anexar Foto
                              </span>
                            </Button>
                          </label>
                          <span className="text-xs text-muted-foreground">
                            Ctrl+Enter para enviar
                          </span>
                        </div>
                        <Button
                          onClick={sendMessage}
                          disabled={(!newMessage.trim() && !selectedImage) || sendingMessage}
                          size="sm"
                          className="bg-blue-600 hover:bg-blue-700"
                        >
                          <Send className="h-4 w-4 mr-2" />
                          {uploadingImage ? 'A enviar foto...' : sendingMessage ? 'A enviar...' : 'Enviar'}
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </CollapsibleContent>
              </Card>
            </Collapsible>
          )}
          


          {/* Assigned Employee Section */}
          {selectedWorkOrder && (
            <Collapsible defaultOpen={false}>
              <Card>
                <CollapsibleTrigger asChild>
                  <CardHeader className="cursor-pointer hover:bg-accent/50 transition-colors">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <CardTitle className="flex items-center gap-2">
                          <UserCog className="h-5 w-5 text-primary" />
                          Serviço atribuído ao Funcionário
                        </CardTitle>
                        <Badge variant="outline" className="text-xs">
                          Sincronizado com FO {selectedWorkOrder.number}
                        </Badge>
                      </div>
                      <ChevronDown className="h-5 w-5 text-muted-foreground transition-transform duration-200" />
                    </div>
                  </CardHeader>
                </CollapsibleTrigger>
                <CollapsibleContent>
                  <CardContent>
                    <div className="space-y-2">
                      <Label htmlFor="assigned-employee">Selecionar Funcionário</Label>
                      <Select
                        value={assignedEmployeeId}
                        onValueChange={(value) => {
                          setAssignedEmployeeId(value)
                          // Trigger auto-save
                          debouncedSave(services, value)
                        }}
                      >
                        <SelectTrigger id="assigned-employee">
                          <SelectValue placeholder="Selecione um funcionário..." />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">
                            <span className="text-muted-foreground">Sem atribuição</span>
                          </SelectItem>
                          {employees.length === 0 ? (
                            <SelectItem value="no-employees" disabled>
                              <span className="text-muted-foreground">Nenhum funcionário disponível</span>
                            </SelectItem>
                          ) : (
                            employees.map((employee) => (
                              <SelectItem key={employee.id} value={employee.id}>
                                <div className="flex items-center gap-2">
                                  <UserCog className="h-4 w-4 text-muted-foreground" />
                                  <div>
                                    <span className="font-medium">{employee.name}</span>
                                    <span className="text-xs text-muted-foreground ml-2">
                                      ({employee.position})
                                    </span>
                                  </div>
                                </div>
                              </SelectItem>
                            ))
                          )}
                        </SelectContent>
                      </Select>
                      {assignedEmployeeId && assignedEmployeeId !== 'none' && (
                        <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                          {(() => {
                            const employee = employees.find(e => e.id === assignedEmployeeId)
                            if (!employee) return null
                            return (
                              <div className="flex items-start gap-3">
                                <UserCog className="h-5 w-5 text-blue-600 mt-0.5" />
                                <div className="flex-1">
                                  <p className="font-medium text-blue-900">{employee.name}</p>
                                  <p className="text-sm text-blue-700">{employee.position}</p>
                                  {employee.phone && (
                                    <p className="text-sm text-blue-600 mt-1 flex items-center gap-1">
                                      <Phone className="h-3 w-3" />
                                      {employee.phone}
                                    </p>
                                  )}
                                  {employee.email && (
                                    <p className="text-sm text-blue-600 mt-1 flex items-center gap-1">
                                      <Mail className="h-3 w-3" />
                                      {employee.email}
                                    </p>
                                  )}
                                </div>
                              </div>
                            )
                          })()}
                        </div>
                      )}
                      {employees.length === 0 && (
                        <div className="mt-3 p-3 bg-amber-50 border border-amber-200 rounded-lg">
                          <p className="text-sm text-amber-800">
                            <strong>Aviso:</strong> Nenhum funcionário foi configurado. 
                            Adicione funcionários em <strong>Configurações → Funcionários</strong>.
                          </p>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </CollapsibleContent>
              </Card>
            </Collapsible>
          )}

          {/* Tabs Container */}
          <Card>
            <Tabs defaultValue="services" className="w-full">
              <CardHeader className="pb-3">
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="services" className="flex items-center gap-2">
                    <ClipboardList className="h-4 w-4" />
                    Tabela de Serviços
                  </TabsTrigger>
                  <TabsTrigger value="catalogs" className="flex items-center gap-2">
                    <Book className="h-4 w-4" />
                    Catálogos TecRMI
                  </TabsTrigger>
                  <TabsTrigger value="technical" className="flex items-center gap-2">
                    <Settings className="h-4 w-4" />
                    Dados Técnicos
                  </TabsTrigger>
                </TabsList>
              </CardHeader>

              {/* Tab 1: Services Table */}
              <TabsContent value="services" className="mt-0">
                <CardContent className="space-y-4">
                  {/* Header Info */}
                  <div className="flex items-center justify-between flex-wrap gap-4">
                    <div className="flex items-center gap-3">
                      {selectedWorkOrder && (
                        <Badge variant="outline" className="text-xs">
                          Sincronizado com FO {selectedWorkOrder.number}
                        </Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-3 flex-wrap">
                      <div className="flex items-center gap-3 text-muted-foreground">
                        <div className="flex flex-col items-end">
                          <span className="text-sm">Total s/ IVA: <strong className="text-foreground">{totals.total.toFixed(2)}€</strong></span>
                          <span className="text-xs text-primary font-medium">
                            Total c/ IVA ({vatRate}%): <strong>{totals.totalWithVat.toFixed(2)}€</strong>
                          </span>
                        </div>
                        <Separator orientation="vertical" className="h-8" />
                        <span>Lucro + Marg. 0,00%</span>
                      </div>
                      {selectedWorkOrder && (
                        <div className="flex gap-2 ml-auto">
                          <Button size="sm" variant="outline" onClick={addService}>
                            <Plus className="h-3 w-3 mr-1" />
                            Serviço
                          </Button>
                          <Button size="sm" variant="outline" onClick={addLaborService}>
                            <Wrench className="h-3 w-3 mr-1" />
                            Mão de Obra
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>
              {/* Services Table - Single scroll container */}
              <div className="overflow-x-auto">
                {/* Services Table Header */}
                <div className="mb-4">
                  <div className="grid grid-cols-14 gap-3 text-muted-foreground min-w-[1200px] bg-muted rounded-lg p-3">
                    <div className="col-span-2 text-left">Referência</div>
                    <div className="col-span-3 text-left">Designação</div>
                    <div className="col-span-1 text-center">Qtd.</div>
                    <div className="col-span-2 text-right">Preço uni.</div>
                    <div className="col-span-1 text-center">Desc. %</div>
                    <div className="col-span-2 text-right">Total s/ IVA</div>
                    <div className="col-span-2 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <span>Total c/ IVA</span>
                        <Badge variant="secondary" className="text-[10px] px-1 py-0">
                          {vatRate}%
                        </Badge>
                      </div>
                    </div>
                    <div className="col-span-1 text-center">Ações</div>
                  </div>
                </div>

                {/* Services List */}
                <div>
                {!selectedWorkOrder ? (
                  <div className="text-center py-12 border-2 border-dashed rounded-lg border-border bg-muted/20">
                    <Car className="h-12 w-12 mx-auto mb-3 text-muted-foreground opacity-50" />
                    <p className="text-muted-foreground mb-2">Selecione uma viatura com folha de obra</p>
                    <p className="text-xs text-muted-foreground">Os serviços da folha de obra serão carregados automaticamente</p>
                  </div>
                ) : services.length === 0 ? (
                  <div className="text-center py-12 border-2 border-dashed rounded-lg border-border">
                    <ClipboardList className="h-12 w-12 mx-auto mb-3 text-muted-foreground opacity-50" />
                    <p className="text-muted-foreground mb-4">Nenhum serviço adicionado</p>
                    <div className="flex gap-2 justify-center">
                      <Button variant="outline" onClick={addService}>
                        <Plus className="h-4 w-4 mr-2" />
                        Adicionar Serviço/Artigo
                      </Button>
                      <Button variant="outline" onClick={addLaborService}>
                        <Wrench className="h-4 w-4 mr-2" />
                        Adicionar Mão de Obra
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {services.map((service, idx) => (
                      service.isLabor ? (
                        // Labor Service Row
                        <div key={service.id} className="grid grid-cols-14 gap-3 items-center p-3 border rounded-lg hover:bg-muted/50 transition-colors min-w-[1200px] bg-blue-50/50">
                          <div className="col-span-2">
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                              <Wrench className="h-4 w-4 text-blue-600" />
                              <span>MÃO OBRA</span>
                            </div>
                          </div>
                          <div className="col-span-3">
                            <Select
                              value={service.laborTypeId}
                              onValueChange={(value) => updateService(service.id, 'laborTypeId', value)}
                            >
                              <SelectTrigger>
                                <SelectValue placeholder="Tipo de mão de obra" />
                              </SelectTrigger>
                              <SelectContent>
                                {laborTypes.map((lt) => (
                                  <SelectItem key={lt.id} value={lt.id}>
                                    {lt.name} ({lt.hourlyRate.toFixed(2)}€/h)
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                          <div className="col-span-1">
                            <Input
                              type="number"
                              step="0.5"
                              min="0.5"
                              value={service.laborHours || 1}
                              onChange={(e) => updateService(service.id, 'laborHours', parseFloat(e.target.value) || 1)}
                              className="text-center"
                              placeholder="Horas"
                            />
                          </div>
                          <div className="col-span-2">
                            <Input
                              type="number"
                              step="0.01"
                              value={service.unitPrice}
                              onChange={(e) => updateService(service.id, 'unitPrice', parseFloat(e.target.value) || 0)}
                              className="text-right"
                            />
                          </div>
                          <div className="col-span-1">
                            <Input
                              type="number"
                              min="0"
                              max="100"
                              value={service.discount}
                              onChange={(e) => updateService(service.id, 'discount', parseFloat(e.target.value) || 0)}
                              className="text-center"
                            />
                          </div>
                          <div className="col-span-2 text-right">
                            <span className="text-sm">{service.total.toFixed(2)}€</span>
                          </div>
                          <div className="col-span-2 text-right">
                            <span className="font-medium text-primary">
                              {(service.total * (1 + vatRate / 100)).toFixed(2)}€
                            </span>
                          </div>
                          <div className="col-span-1 flex justify-center">
                            <Button 
                              variant="ghost" 
                              size="sm"
                              onClick={() => removeService(service.id)}
                            >
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                          </div>
                        </div>
                      ) : (
                        // Regular Service Row
                        <div key={service.id} className="grid grid-cols-14 gap-3 items-center p-3 border rounded-lg hover:bg-muted/50 transition-colors min-w-[1200px]">
                          <div className="col-span-2">
                            <Input
                              placeholder="Referência"
                              value={service.reference}
                              onChange={(e) => updateService(service.id, 'reference', e.target.value)}
                            />
                          </div>
                          <div className="col-span-3">
                            <Input
                              placeholder="Designação"
                              value={service.designation}
                              onChange={(e) => updateService(service.id, 'designation', e.target.value)}
                            />
                          </div>
                          <div className="col-span-1">
                            <Input
                              type="number"
                              min="1"
                              value={service.quantity}
                              onChange={(e) => updateService(service.id, 'quantity', parseFloat(e.target.value) || 1)}
                              className="text-center"
                            />
                          </div>
                          <div className="col-span-2">
                            <Input
                              type="number"
                              step="0.01"
                              value={service.unitPrice}
                              onChange={(e) => updateService(service.id, 'unitPrice', parseFloat(e.target.value) || 0)}
                              className="text-right"
                            />
                          </div>
                          <div className="col-span-1">
                            <Input
                              type="number"
                              min="0"
                              max="100"
                              value={service.discount}
                              onChange={(e) => updateService(service.id, 'discount', parseFloat(e.target.value) || 0)}
                              className="text-center"
                            />
                          </div>
                          <div className="col-span-2 text-right">
                            <span className="text-sm">{service.total.toFixed(2)}€</span>
                          </div>
                          <div className="col-span-2 text-right">
                            <span className="font-medium text-primary">
                              {(service.total * (1 + vatRate / 100)).toFixed(2)}€
                            </span>
                          </div>
                          <div className="col-span-1 flex justify-center">
                            <Button 
                              variant="ghost" 
                              size="sm"
                              onClick={() => removeService(service.id)}
                            >
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                          </div>
                        </div>
                      )
                    ))}
                    <div className="flex gap-2">
                      <Button variant="outline" onClick={addService} className="flex-1">
                        <Plus className="h-4 w-4 mr-2" />
                        Adicionar Serviço/Artigo
                      </Button>
                      <Button variant="outline" onClick={addLaborService} className="flex-1">
                        <Wrench className="h-4 w-4 mr-2" />
                        Adicionar Mão de Obra
                      </Button>
                    </div>
                  </div>
                )}
                </div>
              </div>

              {/* Totals Summary */}
              <Separator />
              <div className="flex items-center justify-between pt-4">
                <div className="flex gap-6 flex-wrap">
                  <div className="space-y-1">
                    <div className="text-sm text-muted-foreground">Por aprovar:</div>
                    <div className="flex flex-col">
                      <span className="text-sm">{totals.pending.toFixed(2)}€</span>
                      <span className="text-xs text-primary font-medium">
                        {totals.pendingWithVat.toFixed(2)}€ c/ IVA
                      </span>
                    </div>
                  </div>
                  <Separator orientation="vertical" className="h-12" />
                  <div className="space-y-1">
                    <div className="text-sm text-muted-foreground">Aprovado:</div>
                    <div className="flex flex-col">
                      <span className="text-sm font-medium text-green-600">{totals.approved.toFixed(2)}€</span>
                      <span className="text-xs text-green-700 font-medium">
                        {totals.approvedWithVat.toFixed(2)}€ c/ IVA
                      </span>
                    </div>
                  </div>
                  <Separator orientation="vertical" className="h-12" />
                  <div className="space-y-1">
                    <div className="text-sm text-muted-foreground">Total Geral:</div>
                    <div className="flex flex-col">
                      <span className="font-medium">{totals.total.toFixed(2)}€</span>
                      <span className="text-sm text-primary font-medium">
                        {totals.totalWithVat.toFixed(2)}€ c/ IVA
                      </span>
                    </div>
                  </div>
                  <Separator orientation="vertical" className="h-12" />
                  <div className="space-y-1">
                    <div className="text-sm text-muted-foreground">IVA ({vatRate}%):</div>
                    <div className="flex flex-col">
                      <span className="font-medium text-amber-600">{totals.vatAmount.toFixed(2)}€</span>
                    </div>
                  </div>
                </div>
                <Button variant="link">
                  Voltar ao topo
                </Button>
              </div>
              
              {/* Visual VAT Summary Card */}
              {services.length > 0 && (
                <div className="mt-6 bg-gradient-to-br from-primary/5 to-primary/10 border-2 border-primary/20 rounded-lg p-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <div className="p-3 bg-primary/10 rounded-full">
                        <Euro className="h-6 w-6 text-primary" />
                      </div>
                      <div>
                        <h4 className="font-medium flex items-center gap-2">
                          Resumo Financeiro
                          <Badge variant="outline" className="text-xs">
                            IVA {vatRate}%
                          </Badge>
                        </h4>
                        <p className="text-xs text-muted-foreground mt-1">
                          Valores totais incluindo impostos
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex gap-6">
                      <div className="text-right">
                        <div className="text-xs text-muted-foreground mb-1">Subtotal (s/ IVA)</div>
                        <div className="text-lg font-medium">{totals.total.toFixed(2)}€</div>
                      </div>
                      <Separator orientation="vertical" className="h-12" />
                      <div className="text-right">
                        <div className="text-xs text-muted-foreground mb-1">IVA ({vatRate}%)</div>
                        <div className="text-lg font-medium text-amber-600">+{totals.vatAmount.toFixed(2)}€</div>
                      </div>
                      <Separator orientation="vertical" className="h-12" />
                      <div className="text-right">
                        <div className="text-xs text-muted-foreground mb-1">Total a Pagar</div>
                        <div className="text-2xl font-bold text-primary">{totals.totalWithVat.toFixed(2)}€</div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
                </CardContent>
              </TabsContent>

              {/* Tab 2: TecRMI Catalogs */}
              <TabsContent value="catalogs" className="mt-0">
                <CardContent className="space-y-4">
                  {/* API Status Badge */}
                  <div className="flex items-center justify-end">
                    <Badge variant="outline" className="gap-1">
                      <span className="h-2 w-2 rounded-full bg-green-500"></span>
                      API Conectada
                    </Badge>
                  </div>
              {/* Search Section */}
              <div className="flex gap-2">
                <Input 
                  placeholder="Pesquisar nos catálogos TecRMI (ex: mudança de óleo, travões, filtros...)" 
                  className="flex-1"
                />
                <Button>
                  <FileText className="h-4 w-4 mr-2" />
                  Pesquisar
                </Button>
              </div>

              <Separator />

              {/* Catalogs Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {/* Tempos de Trabalho */}
                <Button variant="outline" className="h-auto py-4 flex-col items-start gap-2 hover:bg-primary/5">
                  <div className="flex items-center gap-2 w-full">
                    <Clock className="h-5 w-5 text-primary" />
                    <span>Tempos de Trabalho</span>
                  </div>
                  <p className="text-xs text-muted-foreground text-left">
                    Consultar tempos standard de reparação
                  </p>
                </Button>

                {/* Procedimentos de Reparação */}
                <Button variant="outline" className="h-auto py-4 flex-col items-start gap-2 hover:bg-primary/5">
                  <div className="flex items-center gap-2 w-full">
                    <Wrench className="h-5 w-5 text-primary" />
                    <span>Procedimentos Reparação</span>
                  </div>
                  <p className="text-xs text-muted-foreground text-left">
                    Guias passo-a-passo de reparação
                  </p>
                </Button>

                {/* Esquemas Elétricos */}
                <Button variant="outline" className="h-auto py-4 flex-col items-start gap-2 hover:bg-primary/5">
                  <div className="flex items-center gap-2 w-full">
                    <Settings className="h-5 w-5 text-primary" />
                    <span>Esquemas Elétricos</span>
                  </div>
                  <p className="text-xs text-muted-foreground text-left">
                    Diagramas e circuitos elétricos
                  </p>
                </Button>

                {/* Planos de Manutenção */}
                <Button variant="outline" className="h-auto py-4 flex-col items-start gap-2 hover:bg-primary/5">
                  <div className="flex items-center gap-2 w-full">
                    <Calendar className="h-5 w-5 text-primary" />
                    <span>Planos de Manutenção</span>
                  </div>
                  <p className="text-xs text-muted-foreground text-left">
                    Intervalos e revisões programadas
                  </p>
                </Button>

                {/* Especificações Técnicas */}
                <Button variant="outline" className="h-auto py-4 flex-col items-start gap-2 hover:bg-primary/5">
                  <div className="flex items-center gap-2 w-full">
                    <FileText className="h-5 w-5 text-primary" />
                    <span>Especificações Técnicas</span>
                  </div>
                  <p className="text-xs text-muted-foreground text-left">
                    Dados técnicos e capacidades
                  </p>
                </Button>

                {/* Torques de Aperto */}
                <Button variant="outline" className="h-auto py-4 flex-col items-start gap-2 hover:bg-primary/5">
                  <div className="flex items-center gap-2 w-full">
                    <Settings className="h-5 w-5 text-primary" />
                    <span>Torques de Aperto</span>
                  </div>
                  <p className="text-xs text-muted-foreground text-left">
                    Valores de torque para componentes
                  </p>
                </Button>

                {/* Fluidos e Lubrificantes */}
                <Button variant="outline" className="h-auto py-4 flex-col items-start gap-2 hover:bg-primary/5">
                  <div className="flex items-center gap-2 w-full">
                    <Package className="h-5 w-5 text-primary" />
                    <span>Fluidos e Lubrificantes</span>
                  </div>
                  <p className="text-xs text-muted-foreground text-left">
                    Especificações de óleos e fluidos
                  </p>
                </Button>

                {/* Códigos de Avaria */}
                <Button variant="outline" className="h-auto py-4 flex-col items-start gap-2 hover:bg-primary/5">
                  <div className="flex items-center gap-2 w-full">
                    <XCircle className="h-5 w-5 text-primary" />
                    <span>Códigos de Avaria</span>
                  </div>
                  <p className="text-xs text-muted-foreground text-left">
                    DTCs e diagnóstico de falhas
                  </p>
                </Button>

                {/* Diagramas de Componentes */}
                <Button variant="outline" className="h-auto py-4 flex-col items-start gap-2 hover:bg-primary/5">
                  <div className="flex items-center gap-2 w-full">
                    <ClipboardList className="h-5 w-5 text-primary" />
                    <span>Diagramas Componentes</span>
                  </div>
                  <p className="text-xs text-muted-foreground text-left">
                    Ilustrações técnicas explodidas
                  </p>
                </Button>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-2 flex-wrap">
                <Button>
                  <Book className="h-4 w-4 mr-2" />
                  Abrir Catálogos TecRMI
                </Button>
                <Button variant="outline">
                  <Download className="h-4 w-4 mr-2" />
                  Exportar Procedimento
                </Button>
                <Button variant="outline">
                  <Printer className="h-4 w-4 mr-2" />
                  Imprimir Esquema
                </Button>
              </div>

              {/* Info Alert */}
              <div className="flex items-start gap-3 p-3 rounded-lg bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800">
                <Book className="h-5 w-5 text-blue-600 dark:text-blue-400 mt-0.5" />
                <div className="space-y-1">
                  <p className="text-blue-900 dark:text-blue-100">
                    Os catálogos TecRMI fornecem informação técnica profissional para reparação e manutenção automóvel.
                  </p>
                  <p className="text-blue-700 dark:text-blue-300 text-sm">
                    Inclui tempos de trabalho, procedimentos, esquemas elétricos, especificações técnicas e muito mais.
                  </p>
                </div>
              </div>
                </CardContent>
              </TabsContent>

              {/* Tab 3: Technical Data */}
              <TabsContent value="technical" className="mt-0">
                <CardContent className="space-y-4">
                  {loadingTechnicalData ? (
                    <div className="flex items-center justify-center py-12">
                      <div className="text-center">
                        <div className="animate-spin h-8 w-8 border-4 border-blue-600 border-t-transparent rounded-full mx-auto mb-3"></div>
                        <p className="text-muted-foreground">A carregar dados técnicos...</p>
                      </div>
                    </div>
                  ) : !selectedVehicle ? (
                    <div className="text-center py-12 border-2 border-dashed rounded-lg border-border bg-muted/20">
                      <Car className="h-12 w-12 mx-auto mb-3 text-muted-foreground opacity-50" />
                      <p className="text-muted-foreground mb-2">Selecione uma viatura para ver os dados técnicos</p>
                    </div>
                  ) : !technicalData ? (
                    <div className="text-center py-12 border-2 border-dashed rounded-lg border-amber-300 bg-amber-50/20">
                      <AlertCircle className="h-12 w-12 mx-auto mb-3 text-amber-600 opacity-50" />
                      <p className="text-muted-foreground mb-2">Dados técnicos não disponíveis</p>
                      <p className="text-xs text-muted-foreground">A matrícula não foi encontrada na base de dados InfoMatricula</p>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="mt-4"
                        onClick={() => selectedVehicle && fetchTechnicalData(selectedVehicle.licensePlate)}
                      >
                        <Download className="h-4 w-4 mr-2" />
                        Tentar novamente
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {/* Header with Vehicle Info */}
                      <Card className="border-2 border-blue-200 bg-gradient-to-r from-blue-50 to-indigo-50">
                        <CardContent className="pt-4">
                          <div className="flex items-center justify-between">
                            <div>
                              <h3 className="text-xl font-bold">{technicalData.make} {technicalData.model}</h3>
                              <p className="text-muted-foreground">{technicalData.version || 'Versão não especificada'}</p>
                              <div className="flex items-center gap-2 mt-2">
                                <Badge variant="outline" className="border-blue-600 text-blue-600">
                                  {technicalData.plate}
                                </Badge>
                                {technicalData.vin && (
                                  <Badge variant="outline">VIN: {technicalData.vin}</Badge>
                                )}
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>

                      {/* Data Grid */}
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {/* Registration Info Card */}
                        <Card>
                          <CardHeader className="pb-3">
                            <CardTitle className="flex items-center gap-2 text-base">
                              <Calendar className="h-4 w-4 text-blue-600" />
                              Informação de Registo
                            </CardTitle>
                          </CardHeader>
                          <CardContent className="space-y-3 text-sm">
                            {technicalData.plateDate && (
                              <div>
                                <p className="text-xs text-muted-foreground">Data de Matrícula</p>
                                <p className="font-medium">{technicalData.plateDate}</p>
                              </div>
                            )}
                            {technicalData.markFrom && (
                              <div>
                                <p className="text-xs text-muted-foreground">Ano de Fabrico</p>
                                <p className="font-medium">{technicalData.markFrom}</p>
                              </div>
                            )}
                            {technicalData.color && (
                              <div>
                                <p className="text-xs text-muted-foreground">Cor</p>
                                <p className="font-medium">{technicalData.color}</p>
                              </div>
                            )}
                            {technicalData.ownerType && (
                              <div>
                                <p className="text-xs text-muted-foreground">Tipo de Proprietário</p>
                                <p className="font-medium">{technicalData.ownerType}</p>
                              </div>
                            )}
                            {technicalData.ownerCategory && (
                              <div>
                                <p className="text-xs text-muted-foreground">Categoria de Proprietário</p>
                                <p className="font-medium">{technicalData.ownerCategory}</p>
                              </div>
                            )}
                          </CardContent>
                        </Card>

                        {/* Engine Info Card */}
                        <Card>
                          <CardHeader className="pb-3">
                            <CardTitle className="flex items-center gap-2 text-base">
                              <Settings className="h-4 w-4 text-orange-600" />
                              Motor e Performance
                            </CardTitle>
                          </CardHeader>
                          <CardContent className="space-y-3 text-sm">
                            {technicalData.fuelType && (
                              <div>
                                <p className="text-xs text-muted-foreground">Tipo de Combustível</p>
                                <p className="font-medium">{technicalData.fuelType}</p>
                              </div>
                            )}
                            {technicalData.mixture && (
                              <div>
                                <p className="text-xs text-muted-foreground">Sistema de Injeção</p>
                                <p className="font-medium">{technicalData.mixture}</p>
                              </div>
                            )}
                            {technicalData.cubicCap && (
                              <div>
                                <p className="text-xs text-muted-foreground">Cilindrada (cm³)</p>
                                <p className="font-medium">{technicalData.cubicCap}</p>
                              </div>
                            )}
                            {technicalData.powercv && (
                              <div>
                                <p className="text-xs text-muted-foreground">Potência (cv)</p>
                                <p className="font-medium">{technicalData.powercv}</p>
                              </div>
                            )}
                            {technicalData.powerkw && (
                              <div>
                                <p className="text-xs text-muted-foreground">Potência (kW)</p>
                                <p className="font-medium">{technicalData.powerkw}</p>
                              </div>
                            )}
                            {technicalData.valves && (
                              <div>
                                <p className="text-xs text-muted-foreground">Válvulas</p>
                                <p className="font-medium">{technicalData.valves}</p>
                              </div>
                            )}
                          </CardContent>
                        </Card>

                        {/* Vehicle Type & Environmental Card */}
                        <Card>
                          <CardHeader className="pb-3">
                            <CardTitle className="flex items-center gap-2 text-base">
                              <Car className="h-4 w-4 text-green-600" />
                              Tipo e Ambiente
                            </CardTitle>
                          </CardHeader>
                          <CardContent className="space-y-3 text-sm">
                            {technicalData.bodyType && (
                              <div>
                                <p className="text-xs text-muted-foreground">Tipo de Carroçaria</p>
                                <p className="font-medium">{technicalData.bodyType}</p>
                              </div>
                            )}
                            {technicalData.driveType && (
                              <div>
                                <p className="text-xs text-muted-foreground">Tipo de Tração</p>
                                <p className="font-medium">{technicalData.driveType}</p>
                              </div>
                            )}
                            {technicalData.categoryType && (
                              <div>
                                <p className="text-xs text-muted-foreground">Categoria</p>
                                <p className="font-medium">{technicalData.categoryType}</p>
                              </div>
                            )}
                            {technicalData.categoryIUC && (
                              <div>
                                <p className="text-xs text-muted-foreground">Categoria IUC</p>
                                <p className="font-medium">{technicalData.categoryIUC}</p>
                              </div>
                            )}
                            {technicalData.co2 && (
                              <div>
                                <p className="text-xs text-muted-foreground">Emissões CO₂ (g/km)</p>
                                <p className="font-medium">{technicalData.co2}</p>
                              </div>
                            )}
                            {technicalData.isImported && (
                              <div>
                                <p className="text-xs text-muted-foreground">Importado</p>
                                <p className="font-medium">{technicalData.isImported}</p>
                              </div>
                            )}
                          </CardContent>
                        </Card>
                      </div>

                      {/* VIN Decoder Data */}
                      {(technicalData.AWN_k_type || technicalData.AWN_code_moteur || 
                        technicalData.AWN_annee_de_debut_modele || technicalData.AWN_annee_de_fin_modele) && (
                        <Card className="border-2 border-purple-200 bg-gradient-to-r from-purple-50 to-blue-50">
                          <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                              <Activity className="h-5 w-5 text-purple-600" />
                              Dados VIN Decoder (TECDOC)
                            </CardTitle>
                          </CardHeader>
                          <CardContent>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
                              {technicalData.AWN_k_type && (
                                <div>
                                  <p className="text-xs text-muted-foreground">K-Type / TECDOC</p>
                                  <p className="font-mono font-medium">{technicalData.AWN_k_type}</p>
                                </div>
                              )}
                              {technicalData.AWN_code_moteur && (
                                <div>
                                  <p className="text-xs text-muted-foreground">Código do Motor</p>
                                  <p className="font-medium">{technicalData.AWN_code_moteur}</p>
                                </div>
                              )}
                              {technicalData.AWN_annee_de_debut_modele && (
                                <div>
                                  <p className="text-xs text-muted-foreground">Ano de Início Produção</p>
                                  <p className="font-medium">{technicalData.AWN_annee_de_debut_modele}</p>
                                </div>
                              )}
                              {technicalData.AWN_annee_de_fin_modele && (
                                <div>
                                  <p className="text-xs text-muted-foreground">Ano de Fim Produção</p>
                                  <p className="font-medium">{technicalData.AWN_annee_de_fin_modele}</p>
                                </div>
                              )}
                            </div>
                            {(technicalData.AWN_url_image || technicalData.AWN_model_image) && (
                              <div className="mt-4 pt-4 border-t border-purple-200">
                                <div className="flex gap-4 items-start">
                                  {technicalData.AWN_url_image && (
                                    <div>
                                      <p className="text-xs text-muted-foreground mb-2">Imagem da Marca</p>
                                      <img 
                                        src={technicalData.AWN_url_image} 
                                        alt="Marca" 
                                        className="h-12 object-contain"
                                        onError={(e) => { e.currentTarget.style.display = 'none' }}
                                      />
                                    </div>
                                  )}
                                  {technicalData.AWN_model_image && (
                                    <div>
                                      <p className="text-xs text-muted-foreground mb-2">Imagem do Modelo</p>
                                      <img 
                                        src={technicalData.AWN_model_image} 
                                        alt="Modelo" 
                                        className="h-32 object-contain rounded-lg"
                                        onError={(e) => { e.currentTarget.style.display = 'none' }}
                                      />
                                    </div>
                                  )}
                                </div>
                              </div>
                            )}
                          </CardContent>
                        </Card>
                      )}

                      {/* Action Buttons */}
                      <div className="flex gap-2">
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => selectedVehicle && fetchTechnicalData(selectedVehicle.licensePlate)}
                        >
                          <Download className="h-4 w-4 mr-2" />
                          Atualizar Dados
                        </Button>
                      </div>
                    </div>
                  )}
                </CardContent>
              </TabsContent>
            </Tabs>
          </Card>

          {/* Workflow Status Card - Separate Card after Tabs */}
          {selectedWorkOrder && (
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <Activity className="h-5 w-5 text-primary" />
                    Fluxo da Obra
                  </CardTitle>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="text-xs">
                      Sincronizado com FO {selectedWorkOrder.number}
                    </Badge>
                    {(['diagnosis', 'execution'].includes(workflowStatus)) && (
                      <Badge className="bg-green-500 text-white text-xs flex items-center gap-1">
                        <Clock className="h-3 w-3 animate-pulse" />
                        Tempo a contar
                      </Badge>
                    )}
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Timer Display */}
                {getCurrentTotalTime() > 0 && (
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Clock className="h-5 w-5 text-blue-600" />
                        <span className="text-sm text-blue-900">Tempo Total Acumulado:</span>
                      </div>
                      <span className="font-mono text-2xl text-blue-900">{formatWorkflowTime(getCurrentTotalTime())}</span>
                    </div>
                  </div>
                )}
                
                {/* Status Buttons Grid */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  <Button
                    variant={workflowStatus === 'reception-complete' ? 'default' : 'outline'}
                    className="h-auto py-4 flex flex-col items-center gap-2"
                    onClick={() => updateWorkflowStatus('reception-complete')}
                  >
                    <Check className="h-5 w-5" />
                    <div className="text-xs text-center leading-tight">Recepção Realizada</div>
                  </Button>
                  
                  <Button
                    variant={workflowStatus === 'diagnosis' ? 'default' : 'outline'}
                    className="h-auto py-4 flex flex-col items-center gap-2"
                    onClick={() => updateWorkflowStatus('diagnosis')}
                  >
                    <Play className="h-5 w-5" />
                    <div className="text-xs text-center leading-tight">Em Diagnóstico</div>
                    {workflowStatus === 'diagnosis' && (
                      <Badge className="text-xs bg-green-500">⏱️ A contar</Badge>
                    )}
                  </Button>
                  
                  <Button
                    variant={workflowStatus === 'budgeting' ? 'default' : 'outline'}
                    className="h-auto py-4 flex flex-col items-center gap-2"
                    onClick={() => updateWorkflowStatus('budgeting')}
                  >
                    <FileText className="h-5 w-5" />
                    <div className="text-xs text-center leading-tight">Em Orçamentação</div>
                  </Button>
                  
                  <Button
                    variant={workflowStatus === 'waiting-approval' ? 'default' : 'outline'}
                    className="h-auto py-4 flex flex-col items-center gap-2"
                    onClick={() => updateWorkflowStatus('waiting-approval')}
                  >
                    <Clock className="h-5 w-5" />
                    <div className="text-xs text-center leading-tight">Espera Aprovação</div>
                  </Button>
                  
                  <Button
                    variant={workflowStatus === 'waiting-parts' ? 'default' : 'outline'}
                    className="h-auto py-4 flex flex-col items-center gap-2"
                    onClick={() => updateWorkflowStatus('waiting-parts')}
                  >
                    <Package className="h-5 w-5" />
                    <div className="text-xs text-center leading-tight">Espera de Peças</div>
                  </Button>
                  
                  <Button
                    variant={workflowStatus === 'execution' ? 'default' : 'outline'}
                    className="h-auto py-4 flex flex-col items-center gap-2"
                    onClick={() => updateWorkflowStatus('execution')}
                  >
                    <Wrench className="h-5 w-5" />
                    <div className="text-xs text-center leading-tight">Serviço em Execução</div>
                    {workflowStatus === 'execution' && (
                      <Badge className="text-xs bg-green-500">⏱️ A contar</Badge>
                    )}
                  </Button>
                  
                  <Button
                    variant={workflowStatus === 'paused' ? 'default' : 'outline'}
                    className="h-auto py-4 flex flex-col items-center gap-2"
                    onClick={() => updateWorkflowStatus('paused')}
                  >
                    <Pause className="h-5 w-5" />
                    <div className="text-xs text-center leading-tight">Serviço em Pausa</div>
                  </Button>
                  
                  <Button
                    variant={workflowStatus === 'delivery' ? 'default' : 'outline'}
                    className="h-auto py-4 flex flex-col items-center gap-2"
                    onClick={() => updateWorkflowStatus('delivery')}
                  >
                    <Car className="h-5 w-5" />
                    <div className="text-xs text-center leading-tight">Pronto p/ Entrega</div>
                  </Button>
                  
                  <Button
                    variant={workflowStatus === 'completed' ? 'default' : 'outline'}
                    className="h-auto py-4 flex flex-col items-center gap-2"
                    onClick={() => updateWorkflowStatus('completed')}
                  >
                    <CheckCircle className="h-5 w-5" />
                    <div className="text-xs text-center leading-tight">Entregue ao Cliente</div>
                  </Button>
                </div>
                
                {/* Status Description */}
                <div className="bg-muted/50 rounded-lg p-3 text-sm text-muted-foreground">
                  {workflowStatus === 'reception-complete' && '✓ Viatura recepcionada e registada no sistema'}
                  {workflowStatus === 'diagnosis' && '🔍 Diagnóstico em curso - Tempo a contar'}
                  {workflowStatus === 'budgeting' && '📋 Preparação de orçamento'}
                  {workflowStatus === 'waiting-approval' && '⏳ Aguarda aprovação do cliente'}
                  {workflowStatus === 'waiting-parts' && '📦 Aguarda chegada de peças'}
                  {workflowStatus === 'execution' && '🔧 Trabalho em execução - Tempo a contar'}
                  {workflowStatus === 'paused' && '⏸️ Trabalho pausado temporariamente'}
                  {workflowStatus === 'delivery' && '🚗 Serviço concluído e pronto para levantamento'}
                  {workflowStatus === 'completed' && '✅ Viatura entregue ao cliente - Serviço finalizado'}
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Right Column - Vehicle & Client Info */}
        <div className="lg:col-span-3 space-y-6">
          {/* Vehicle Selector - HIGHLIGHTED */}
          <Card className="border-2 border-primary/40 shadow-lg ring-4 ring-primary/10 bg-gradient-to-br from-primary/5 to-background relative overflow-hidden vehicle-selector-highlight">
            {/* Decorative corner accent */}
            <div className="absolute top-0 right-0 w-24 h-24 bg-primary/10 rounded-bl-full animate-pulse" style={{ animationDuration: '4s' }} />
            <div className="absolute bottom-0 left-0 w-16 h-16 bg-primary/5 rounded-tr-full" />
            
            <CardContent className="p-4 space-y-3 relative">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 rounded-full bg-primary/15 animate-pulse" style={{ animationDuration: '2s' }}>
                    <Car className="h-4 w-4 text-primary" />
                  </div>
                  <div className="flex items-center gap-2">
                    <Label className="block font-semibold text-primary">Selecionar Viatura</Label>
                    <Badge variant="default" className="text-[10px] px-1.5 py-0 h-4 bg-primary/90">
                      1º PASSO
                    </Badge>
                  </div>
                </div>
                {filteredVehicles.length > 0 && (
                  <Badge variant="default" className="text-xs">
                    {filteredVehicles.length} {filteredVehicles.length === 1 ? 'folha de obra' : 'folhas de obra'}
                  </Badge>
                )}
              </div>
              <select
                className="w-full rounded-md border-2 border-primary/30 bg-background px-3 py-2.5 text-sm font-medium shadow-sm focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all hover:border-primary/50"
                value={selectedVehicleId}
                onChange={(e) => {
                  const vehicleId = e.target.value
                  setSelectedVehicleId(vehicleId)
                  // Find and set the work order for this vehicle
                  const workOrder = workOrders.find(wo => wo.vehicleId === vehicleId)
                  setSelectedWorkOrder(workOrder || null)
                  
                  // Load services from work order
                  if (workOrder) {
                    loadServicesFromWorkOrder(workOrder)
                  } else {
                    setServices([])
                  }
                  
                  // Load vehicle history
                  if (vehicleId) {
                    loadVehicleHistory(vehicleId)
                  } else {
                    setVehicleHistory({ budgets: [], workOrders: [], invoices: [] })
                    setSelectedHistoryType(null)
                  }
                }}
              >
                <option value="">Selecione uma viatura com folha de obra em aberto</option>
                {filteredVehicles.map(vehicle => {
                  const workOrder = workOrders.find(wo => wo.vehicleId === vehicle.id)
                  const statusLabel = workOrder?.status === 'pending' ? 'Pendente' : 
                                     workOrder?.status === 'in-progress' ? 'Em Processamento' : 
                                     workOrder?.status === 'paused' ? 'Em Pausa' : ''
                  return (
                    <option key={vehicle.id} value={vehicle.id}>
                      {vehicle.licensePlate} - {vehicle.brand} {vehicle.model} {workOrder ? `[FO: ${workOrder.number} - ${statusLabel}]` : ''}
                    </option>
                  )
                })}
              </select>
              {vehicles.length === 0 && !loading && (
                <div className="flex items-start gap-2 p-3 bg-amber-50 border border-amber-200 rounded-lg mt-2">
                  <div className="p-1 rounded-full bg-amber-100">
                    <ClipboardList className="h-3.5 w-3.5 text-amber-600" />
                  </div>
                  <p className="text-xs text-amber-800 leading-relaxed">
                    Não há viaturas com folhas de obra em aberto. Crie uma folha de obra no módulo "Folhas de Obra" primeiro.
                  </p>
                </div>
              )}
              {vehicleWorkOrder && (
                <div className="pt-2 border-t space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-muted-foreground">Folha de Obra:</span>
                    <span className="font-medium">{vehicleWorkOrder.number}</span>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-muted-foreground">Estado:</span>
                    <Badge variant={
                      vehicleWorkOrder.status === 'pending' ? 'secondary' : 
                      vehicleWorkOrder.status === 'in_progress' ? 'default' : 
                      'outline'
                    } className="text-xs">
                      {vehicleWorkOrder.status === 'pending' ? 'Pendente' : 
                       vehicleWorkOrder.status === 'in_progress' ? 'Em Execução' : 
                       vehicleWorkOrder.status === 'awaiting_parts' ? 'Aguarda Peças' : 
                       vehicleWorkOrder.status}
                    </Badge>
                  </div>
                  {vehicleWorkOrder.createdAt && (
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-muted-foreground">Criada em:</span>
                      <span>{new Date(vehicleWorkOrder.createdAt).toLocaleDateString('pt-PT')}</span>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Work Order Info Alert */}
          {vehicleWorkOrder && (
            <Card className="border-blue-200 bg-blue-50/50">
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <div className="rounded-full bg-blue-100 p-2">
                    <FolderOpen className="h-4 w-4 text-blue-600" />
                  </div>
                  <div className="flex-1 space-y-1">
                    <p className="text-sm font-medium text-blue-900">
                      Folha de Obra: {vehicleWorkOrder.number}
                    </p>
                    <p className="text-xs text-blue-700">
                      Os dados desta folha de serviço estão vinculados à folha de obra em aberto.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Vehicle Details */}
          {selectedVehicle && (
            <>
              <Card>
                <CardContent className="p-0">
                  {/* License Plate */}
                  <div className="bg-muted p-4 flex justify-center">
                    <PortugueseLicensePlate 
                      licensePlate={selectedVehicle.licensePlate}
                      size="md"
                    />
                  </div>

                  {/* Vehicle Image */}
                  <div className="bg-background p-6 flex justify-center min-h-[120px] items-center border-y">
                    <ImageWithFallback 
                      src={getVehicleImageUrl(selectedVehicle)}
                      alt={`${selectedVehicle.brand} ${selectedVehicle.model}`}
                      className="h-24 object-contain"
                    />
                  </div>

                  {/* Vehicle Info */}
                  <div className="p-4 space-y-2">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Nº TECDOC</span>
                      <span className="font-mono text-sm">{selectedVehicle.AWN_k_type || 'N/A'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Marca</span>
                      <span>{selectedVehicle.brand}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Modelo</span>
                      <span>{selectedVehicle.model}</span>
                    </div>
                    {selectedVehicle.year && (
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Ano</span>
                        <span>{selectedVehicle.year}</span>
                      </div>
                    )}
                    {selectedVehicle.registrationDate && (
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Data Matrícula</span>
                        <span>
                          {new Date(selectedVehicle.registrationDate).toLocaleDateString('pt-PT')}
                        </span>
                      </div>
                    )}
                    {selectedVehicle.mileage && (
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Kms</span>
                        <span>{selectedVehicle.mileage.toLocaleString('pt-PT')}</span>
                      </div>
                    )}
                    {selectedVehicle.engineCapacity && (
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Motor</span>
                        <span>{selectedVehicle.engineCapacity}</span>
                      </div>
                    )}
                    {selectedVehicle.fuelType && (
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Combustível</span>
                        <span>{selectedVehicle.fuelType}</span>
                      </div>
                    )}
                  </div>

                  {/* Action Buttons */}
                  <div className="p-3 border-t flex gap-2">
                    <Button variant="ghost" size="sm" className="flex-1">
                      Galeria
                    </Button>
                    <Button variant="ghost" size="sm" className="flex-1">
                      Editar
                    </Button>
                    <Button variant="ghost" size="sm">
                      <Settings className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="sm">
                      <FileText className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* Client Info */}
              {selectedClient && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <User className="h-5 w-5 text-primary" />
                      Cliente
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div>
                      <div className="text-muted-foreground mb-1">Nome</div>
                      <div>{selectedClient.name}</div>
                    </div>
                    {selectedClient.email && (
                      <div className="flex items-center gap-2">
                        <Mail className="h-4 w-4 text-muted-foreground" />
                        <span>{selectedClient.email}</span>
                      </div>
                    )}
                    {selectedClient.phone && (
                      <div className="flex items-center gap-2">
                        <Phone className="h-4 w-4 text-muted-foreground" />
                        <span>{selectedClient.phone}</span>
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}

              {/* History */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <History className="h-5 w-5 text-primary" />
                      Histórico
                    </div>
                    {selectedVehicleId && !loadingHistory && (
                      <Badge variant="secondary" className="text-xs">
                        {vehicleHistory.budgets.length + vehicleHistory.workOrders.length + vehicleHistory.invoices.length} {vehicleHistory.budgets.length + vehicleHistory.workOrders.length + vehicleHistory.invoices.length === 1 ? 'documento' : 'documentos'}
                      </Badge>
                    )}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {!selectedVehicleId ? (
                    <div className="text-center py-8 text-muted-foreground">
                      <History className="h-12 w-12 mx-auto mb-2 opacity-30" />
                      <p className="text-sm">Selecione uma viatura para ver o histórico</p>
                    </div>
                  ) : loadingHistory ? (
                    <div className="text-center py-8 text-muted-foreground">
                      <div className="animate-pulse">A carregar histórico...</div>
                    </div>
                  ) : vehicleHistory.budgets.length === 0 && vehicleHistory.workOrders.length === 0 && vehicleHistory.invoices.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      <FileText className="h-12 w-12 mx-auto mb-2 opacity-30" />
                      <p className="text-sm">Nenhum histórico encontrado</p>
                      <p className="text-xs mt-1">Esta viatura ainda não tem orçamentos, folhas de obra ou faturas</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {/* Summary Cards - Now clickable */}
                      <div className="grid grid-cols-3 gap-2 mb-4">
                        <button
                          onClick={() => setSelectedHistoryType(selectedHistoryType === 'budgets' ? null : 'budgets')}
                          className={`text-center p-3 rounded-lg border transition-all ${
                            selectedHistoryType === 'budgets'
                              ? 'bg-blue-100 border-blue-300 ring-2 ring-blue-200 shadow-sm'
                              : 'bg-blue-50 border-blue-100 hover:bg-blue-100 hover:border-blue-200'
                          }`}
                        >
                          <FileText className="h-4 w-4 mx-auto mb-1 text-blue-600" />
                          <div className="text-xs text-blue-600">Orçamentos</div>
                          <div className="font-medium text-blue-900">{vehicleHistory.budgets.length}</div>
                        </button>
                        <button
                          onClick={() => setSelectedHistoryType(selectedHistoryType === 'workorders' ? null : 'workorders')}
                          className={`text-center p-3 rounded-lg border transition-all ${
                            selectedHistoryType === 'workorders'
                              ? 'bg-orange-100 border-orange-300 ring-2 ring-orange-200 shadow-sm'
                              : 'bg-orange-50 border-orange-100 hover:bg-orange-100 hover:border-orange-200'
                          }`}
                        >
                          <Wrench className="h-4 w-4 mx-auto mb-1 text-orange-600" />
                          <div className="text-xs text-orange-600">Folhas Obra</div>
                          <div className="font-medium text-orange-900">{vehicleHistory.workOrders.length}</div>
                        </button>
                        <button
                          onClick={() => setSelectedHistoryType(selectedHistoryType === 'invoices' ? null : 'invoices')}
                          className={`text-center p-3 rounded-lg border transition-all ${
                            selectedHistoryType === 'invoices'
                              ? 'bg-green-100 border-green-300 ring-2 ring-green-200 shadow-sm'
                              : 'bg-green-50 border-green-100 hover:bg-green-100 hover:border-green-200'
                          }`}
                        >
                          <FileText className="h-4 w-4 mx-auto mb-1 text-green-600" />
                          <div className="text-xs text-green-600">Faturas</div>
                          <div className="font-medium text-green-900">{vehicleHistory.invoices.length}</div>
                        </button>
                      </div>

                      {/* Helper text when no filter selected */}
                      {!selectedHistoryType && (
                        <div className="text-center py-4 text-muted-foreground bg-muted/30 rounded-lg border border-dashed">
                          <p className="text-sm">👆 Clique num dos cards acima para ver os documentos</p>
                        </div>
                      )}

                      {/* Timeline - Merge all items and sort by date */}
                      {selectedHistoryType && (
                        <div className="space-y-2 max-h-[400px] overflow-y-auto">
                          {(() => {
                            let items: any[] = []
                            
                            if (selectedHistoryType === 'budgets') {
                              items = vehicleHistory.budgets.map(b => ({ ...b, type: 'budget', date: b.createdAt }))
                            } else if (selectedHistoryType === 'workorders') {
                              items = vehicleHistory.workOrders.map(w => ({ ...w, type: 'workorder', date: w.createdAt }))
                            } else if (selectedHistoryType === 'invoices') {
                              items = vehicleHistory.invoices.map(i => ({ ...i, type: 'invoice', date: i.createdAt }))
                            }
                            
                            return items
                              .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                              .map((item: any, index) => {
                            const isOpen = item.type === 'workorder' && (item.status === 'pending' || item.status === 'in-progress' || item.status === 'paused')
                            const isClosed = item.type === 'workorder' && (item.status === 'completed' || item.status === 'cancelled')
                            
                            return (
                              <div 
                                key={`${item.type}-${item.id}-${index}`}
                                className="flex items-center justify-between p-3 bg-muted rounded-lg hover:bg-muted/80 transition-colors cursor-pointer"
                              >
                                <div className="flex items-center gap-3 flex-1">
                                  {/* Icon */}
                                  <div className={`rounded-full p-2 ${
                                    item.type === 'budget' ? 'bg-blue-100' :
                                    item.type === 'workorder' ? 'bg-orange-100' :
                                    'bg-green-100'
                                  }`}>
                                    {item.type === 'budget' ? (
                                      <FileText className="h-3 w-3 text-blue-600" />
                                    ) : item.type === 'workorder' ? (
                                      <Wrench className="h-3 w-3 text-orange-600" />
                                    ) : (
                                      <FileText className="h-3 w-3 text-green-600" />
                                    )}
                                  </div>
                                  
                                  {/* Content */}
                                  <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2">
                                      <span className="text-sm font-medium truncate">
                                        {item.type === 'budget' ? `Orçamento ${item.number}` :
                                         item.type === 'workorder' ? `Folha de Obra ${item.number}` :
                                         `Fatura ${item.number}`}
                                      </span>
                                      {item.type === 'workorder' && (
                                        <Badge 
                                          variant={isOpen ? 'default' : isClosed ? 'secondary' : 'outline'}
                                          className="text-xs"
                                        >
                                          {item.status === 'pending' ? 'Pendente' :
                                           item.status === 'in-progress' ? 'Em Execução' :
                                           item.status === 'paused' ? 'Pausada' :
                                           item.status === 'completed' ? 'Concluída' :
                                           item.status === 'cancelled' ? 'Cancelada' :
                                           item.status}
                                        </Badge>
                                      )}
                                      {item.type === 'budget' && item.status && (
                                        <Badge 
                                          variant={
                                            item.status === 'approved' ? 'default' :
                                            item.status === 'rejected' ? 'destructive' :
                                            'outline'
                                          }
                                          className="text-xs"
                                        >
                                          {item.status === 'draft' ? 'Rascunho' :
                                           item.status === 'sent' ? 'Enviado' :
                                           item.status === 'approved' ? 'Aprovado' :
                                           item.status === 'rejected' ? 'Rejeitado' :
                                           item.status}
                                        </Badge>
                                      )}
                                    </div>
                                    <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1">
                                      <Calendar className="h-3 w-3" />
                                      <span>{new Date(item.date).toLocaleDateString('pt-PT')}</span>
                                      {item.total !== undefined && (
                                        <>
                                          <span>•</span>
                                          <span className={item.type === 'invoice' ? 'text-green-600 font-medium' : ''}>
                                            {Number(item.total).toFixed(2)}€
                                          </span>
                                        </>
                                      )}
                                    </div>
                                  </div>
                                  
                                  {/* Arrow */}
                                  <ChevronRight className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                                </div>
                              </div>
                            )
                          })
                         })()}
                        </div>
                      )}

                      {/* Empty state for selected category */}
                      {selectedHistoryType && (
                        selectedHistoryType === 'budgets' && vehicleHistory.budgets.length === 0 ? (
                          <div className="text-center py-8 text-muted-foreground">
                            <FileText className="h-10 w-10 mx-auto mb-2 opacity-30 text-blue-600" />
                            <p className="text-sm">Nenhum orçamento encontrado</p>
                          </div>
                        ) : selectedHistoryType === 'workorders' && vehicleHistory.workOrders.length === 0 ? (
                          <div className="text-center py-8 text-muted-foreground">
                            <Wrench className="h-10 w-10 mx-auto mb-2 opacity-30 text-orange-600" />
                            <p className="text-sm">Nenhuma folha de obra encontrada</p>
                          </div>
                        ) : selectedHistoryType === 'invoices' && vehicleHistory.invoices.length === 0 ? (
                          <div className="text-center py-8 text-muted-foreground">
                            <FileText className="h-10 w-10 mx-auto mb-2 opacity-30 text-green-600" />
                            <p className="text-sm">Nenhuma fatura encontrada</p>
                          </div>
                        ) : null
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
