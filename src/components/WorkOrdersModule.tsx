import { useState, useEffect } from 'react'
import { Button } from './ui/button'
import { Input } from './ui/input'
import { Label } from './ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog'
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from './ui/alert-dialog'
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs'
import { Plus, ClipboardList, Play, Pause, CheckCircle, Clock, Wrench, Droplet, Zap, Calendar, Search, X, Edit, Trash2, Car, Info, ChevronDown, ChevronUp, Gauge, Fuel, Settings, FileText, User, AlertCircle, Calendar as CalendarIcon, ClipboardCheck } from 'lucide-react'
import { projectId } from '../utils/supabase/info'
import { toast } from 'sonner@2.0.3'
import { Badge } from './ui/badge'
import { Textarea } from './ui/textarea'
import { ImageWithFallback } from './figma/ImageWithFallback'
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from './ui/sheet'
import { Separator } from './ui/separator'
import { getVehicleImageUrl } from './vehicleDatabase'
import { PortugueseLicensePlate } from './PortugueseLicensePlate'
import { useModulesIntegration } from './ModulesIntegrationContext'
import { useWorkflowTimer } from './WorkflowTimerContext'

interface WorkOrdersModuleProps {
  accessToken: string
}

interface BudgetItem {
  partNumber: string
  description: string
  quantity: number
  price: number
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
  workflowStatus?: string
  workflowAccumulatedTime?: number
  workflowStartTime?: number | null
  startedAt?: string
  completedAt?: string
  notes?: string
  createdAt: string
  workshopId?: string
  serviceSheetId?: string
}

interface Budget {
  id: string
  number: string
  status: string
  total?: number
  estimatedPrice?: number
  clientId: string
  vehicleId: string
  items: any[]
  publicQuoteRequestId?: string
  clientName?: string
  clientEmail?: string
  clientPhone?: string
  licensePlate?: string
}

interface Client {
  id: string
  name: string
}

interface Vehicle {
  id: string
  licensePlate: string
  brand: string
  model: string
  year?: string
  vin?: string
  color?: string
  fuelType?: string
  engineCapacity?: string
  transmission?: string
  mileage?: number
  registrationDate?: string
  nextInspection?: string
  nextOilChange?: number
  nextTiming?: number
  tireSize?: string
  notes?: string
  clientId: string
  // VIN Decoder fields
  AWN_k_type?: string
  AWN_code_moteur?: string
  AWN_url_image?: string
  AWN_model_image?: string
  AWN_annee_de_debut_modele?: string
  AWN_annee_de_fin_modele?: string
}

export function WorkOrdersModule({ accessToken }: WorkOrdersModuleProps) {
  // Helper function to get vehicle image with VIN Decoder priority
  const getVehicleImage = (vehicle: Vehicle | null) => {
    if (!vehicle) return "https://images.unsplash.com/photo-1601815731648-7221909cdb00?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxjYXIlMjB2ZWhpY2xlJTIwc2lkZXxlbnwxfHx8fDE3NjE2MDEwNTB8MA&ixlib=rb-4.1.0&q=80&w=1080"
    // Priority: VIN Decoder model image > VIN Decoder brand image > generic vehicle database
    if (vehicle.AWN_model_image) return vehicle.AWN_model_image
    if (vehicle.AWN_url_image) return vehicle.AWN_url_image
    return getVehicleImageUrl(vehicle.brand, vehicle.model)
  }

  const integration = useModulesIntegration()
  const workflowTimer = useWorkflowTimer()
  const [workOrders, setWorkOrders] = useState<WorkOrder[]>([])
  const [budgets, setBudgets] = useState<Budget[]>([])
  const [clients, setClients] = useState<Client[]>([])
  const [vehicles, setVehicles] = useState<Vehicle[]>([])
  const [loading, setLoading] = useState(false)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editDialogOpen, setEditDialogOpen] = useState(false)
  const [editingWorkOrder, setEditingWorkOrder] = useState<WorkOrder | null>(null)
  const [selectedBudgetId, setSelectedBudgetId] = useState('')
  const [assignedTechnicianId, setAssignedTechnicianId] = useState('')
  const [vehicleDetailsSidebarOpen, setVehicleDetailsSidebarOpen] = useState(false)
  const [selectedVehicleId, setSelectedVehicleId] = useState<string | null>(null)
  const [notes, setNotes] = useState('')
  const [searchFilter, setSearchFilter] = useState('')
  const [expandedWorkOrders, setExpandedWorkOrders] = useState<Set<string>>(new Set())
  
  // Edit form states
  const [editItems, setEditItems] = useState<BudgetItem[]>([])
  const [editLaborHours, setEditLaborHours] = useState('0')
  const [editLaborRate, setEditLaborRate] = useState('25')
  const [editNotes, setEditNotes] = useState('')
  const [editTechnician, setEditTechnician] = useState('')
  
  // Delete confirmation states
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [workOrderToDelete, setWorkOrderToDelete] = useState<WorkOrder | null>(null)
  const [deleting, setDeleting] = useState(false)

  useEffect(() => {
    fetchWorkOrders()
    fetchBudgets()
    fetchClients()
    fetchVehicles()
  }, [])

  // Register refresh callback for integration
  useEffect(() => {
    const refreshCallback = () => {
      fetchWorkOrders()
      fetchBudgets()
    }
    
    integration.registerRefreshCallback('workorders', refreshCallback)
    
    return () => {
      integration.unregisterRefreshCallback('workorders')
    }
  }, []) // Empty deps - só regista uma vez

  const fetchWorkOrders = async () => {
    setLoading(true)
    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-6971b43c/workorders`,
        {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
          },
        }
      )

      if (response.ok) {
        const data = await response.json()
        console.log('📋 Work Orders carregadas:', data.workOrders?.map((wo: any) => ({
          id: wo.id,
          number: wo.number,
          status: wo.status,
          workflowStatus: wo.workflowStatus
        })))
        setWorkOrders(data.workOrders || [])
      }
    } catch (error) {
      console.error('Error fetching work orders:', error)
      toast.error('Erro ao carregar folhas de obra')
    } finally {
      setLoading(false)
    }
  }

  const fetchBudgets = async () => {
    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-6971b43c/budgets`,
        {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
          },
        }
      )

      if (response.ok) {
        const data = await response.json()
        setBudgets(data.budgets || [])
      }
    } catch (error) {
      console.error('Error fetching budgets:', error)
    }
  }

  const fetchClients = async () => {
    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-6971b43c/clients`,
        {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
          },
        }
      )

      if (response.ok) {
        const data = await response.json()
        setClients(data.clients || [])
      }
    } catch (error) {
      console.error('Error fetching clients:', error)
    }
  }

  const fetchVehicles = async () => {
    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-6971b43c/vehicles`,
        {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
          },
        }
      )

      if (response.ok) {
        const data = await response.json()
        setVehicles(data.vehicles || [])
      }
    } catch (error) {
      console.error('Error fetching vehicles:', error)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!selectedBudgetId) {
      toast.error('Selecione um orçamento')
      return
    }

    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-6971b43c/workorders`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${accessToken}`,
          },
          body: JSON.stringify({
            budgetId: selectedBudgetId,
            assignedTechnicianId: assignedTechnicianId || undefined,
            notes,
          }),
        }
      )

      if (response.ok) {
        toast.success('Folha de obra criada!')
        setDialogOpen(false)
        setSelectedBudgetId('')
        setAssignedTechnicianId('')
        setNotes('')
        fetchWorkOrders()
      } else {
        const data = await response.json()
        toast.error(data.error || 'Erro ao criar folha de obra')
      }
    } catch (error) {
      console.error('Error creating work order:', error)
      toast.error('Erro ao criar folha de obra')
    }
  }

  const updateWorkOrderStatus = async (workOrderId: string, status: WorkOrder['status']) => {
    try {
      const updateData: any = { status }
      
      // Set timestamps based on status
      if (status === 'in-progress' && !workOrders.find(wo => wo.id === workOrderId)?.startedAt) {
        updateData.startedAt = new Date().toISOString()
      }
      if (status === 'completed') {
        updateData.completedAt = new Date().toISOString()
      }

      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-6971b43c/workorders/${workOrderId}/status`,
        {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${accessToken}`,
          },
          body: JSON.stringify(updateData),
        }
      )

      if (response.ok) {
        toast.success('Estado atualizado!')
        fetchWorkOrders()
      }
    } catch (error) {
      console.error('Error updating work order status:', error)
      toast.error('Erro ao atualizar estado')
    }
  }

  const handleDeleteWorkOrder = (workOrder: WorkOrder) => {
    setWorkOrderToDelete(workOrder)
    setDeleteDialogOpen(true)
  }

  const confirmDeleteWorkOrder = async () => {
    if (!workOrderToDelete) return
    
    setDeleting(true)
    try {
      // First, get the work order to find associated budget
      const workOrder = workOrderToDelete
      
      // Delete the work order
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-6971b43c/workorders/${workOrder.id}`,
        {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${accessToken}`,
          },
        }
      )

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Erro ao eliminar folha de obra')
      }

      // If there's an associated budget, delete it too
      if (workOrder.budgetId) {
        console.log('🔄 Deleting associated budget:', workOrder.budgetId)
        try {
          const budgetResponse = await fetch(
            `https://${projectId}.supabase.co/functions/v1/make-server-6971b43c/budgets/${workOrder.budgetId}`,
            {
              method: 'DELETE',
              headers: {
                'Authorization': `Bearer ${accessToken}`,
              },
            }
          )
          
          if (budgetResponse.ok) {
            console.log('✅ Associated budget deleted successfully')
          } else {
            console.log('⚠️ Could not delete associated budget (may not exist)')
          }
        } catch (budgetError) {
          console.error('⚠️ Error deleting associated budget:', budgetError)
          // Don't fail the whole operation if budget deletion fails
        }
      }

      toast.success('Folha de obra eliminada com sucesso!')
      setDeleteDialogOpen(false)
      setWorkOrderToDelete(null)
      fetchWorkOrders()
      fetchBudgets()
    } catch (error: any) {
      console.error('Error deleting work order:', error)
      toast.error(error.message || 'Erro ao eliminar folha de obra')
    } finally {
      setDeleting(false)
    }
  }

  const handleEditWorkOrder = (workOrder: WorkOrder) => {
    setEditingWorkOrder(workOrder)
    setEditItems(workOrder.items || [])
    setEditLaborHours(workOrder.laborHours?.toString() || '0')
    setEditLaborRate(workOrder.laborRate?.toString() || '25')
    setEditNotes(workOrder.notes || '')
    setEditTechnician(workOrder.assignedTechnicianId || '')
    setEditDialogOpen(true)
  }

  const addEditItem = () => {
    setEditItems([...editItems, { partNumber: '', description: '', quantity: 1, price: 0 }])
  }

  const removeEditItem = (index: number) => {
    setEditItems(editItems.filter((_, i) => i !== index))
  }

  const updateEditItem = (index: number, field: keyof BudgetItem, value: any) => {
    const newItems = [...editItems]
    newItems[index] = { ...newItems[index], [field]: value }
    setEditItems(newItems)
  }

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!editingWorkOrder) return

    if (editItems.length === 0) {
      toast.error('Adicione pelo menos um artigo')
      return
    }

    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-6971b43c/workorders/${editingWorkOrder.id}`,
        {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${accessToken}`,
          },
          body: JSON.stringify({
            items: editItems,
            laborHours: parseFloat(editLaborHours),
            laborRate: parseFloat(editLaborRate),
            notes: editNotes,
            assignedTechnicianId: editTechnician,
          }),
        }
      )

      if (response.ok) {
        toast.success('Folha de obra atualizada!')
        setEditDialogOpen(false)
        setEditingWorkOrder(null)
        fetchWorkOrders()
      } else {
        const data = await response.json()
        toast.error(data.error || 'Erro ao atualizar folha de obra')
      }
    } catch (error) {
      console.error('Error updating work order:', error)
      toast.error('Erro ao atualizar folha de obra')
    }
  }

  const getClientName = (clientId: string, budgetId?: string, vehicleId?: string) => {
    // Always get the current vehicle owner if vehicleId is provided
    if (vehicleId) {
      const vehicle = vehicles.find(v => v && v.id === vehicleId)
      if (vehicle?.clientId) {
        const currentOwner = clients.find(c => c && c.id === vehicle.clientId)
        if (currentOwner) {
          return currentOwner.name
        }
      }
    }
    
    // If budgetId is provided, check if it's from public portal
    if (budgetId) {
      const budget = budgets.find(b => b && b.id === budgetId)
      if (budget?.publicQuoteRequestId && budget.clientName) {
        return budget.clientName
      }
    }
    
    // Fallback: find client by ID
    const client = clients.find(c => c && c.id === clientId)
    return client?.name || 'N/A'
  }

  const getVehicleInfo = (vehicleId: string) => {
    const vehicle = vehicles.find(v => v && v.id === vehicleId)
    return vehicle ? `${vehicle.brand} ${vehicle.model} (${vehicle.licensePlate})` : 'N/A'
  }

  const getBudgetNumber = (budgetId: string) => {
    const budget = budgets.find(b => b.id === budgetId)
    return budget?.number || 'N/A'
  }

  // Only show approved budgets that don't have work orders yet
  const workOrderBudgetIds = workOrders.filter(wo => wo).map(wo => wo.budgetId)
  const availableBudgets = budgets.filter(
    b => b && b.status === 'approved' && !workOrderBudgetIds.includes(b.id)
  )

  const getStatusColor = (status: WorkOrder['status']) => {
    switch (status) {
      case 'completed':
        return 'default'
      case 'in-progress':
        return 'secondary'
      case 'paused':
        return 'outline'
      default:
        return 'outline'
    }
  }

  const getStatusLabel = (status: WorkOrder['status']) => {
    switch (status) {
      case 'pending':
        return 'Pendente'
      case 'in-progress':
        return 'Em Progresso'
      case 'paused':
        return 'Pausado'
      case 'completed':
        return 'Concluído'
      default:
        return status
    }
  }

  const calculateDuration = (startedAt?: string, completedAt?: string) => {
    if (!startedAt) return 'N/A'
    
    const start = new Date(startedAt)
    const end = completedAt ? new Date(completedAt) : new Date()
    const diffMs = end.getTime() - start.getTime()
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60))
    const diffMinutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60))
    
    if (diffHours > 0) {
      return `${diffHours}h ${diffMinutes}m`
    }
    return `${diffMinutes}m`
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('pt-PT')
  }

  const formatDateTime = (dateString: string) => {
    const date = new Date(dateString)
    return `${date.toLocaleDateString('pt-PT')} ${date.toLocaleTimeString('pt-PT', { hour: '2-digit', minute: '2-digit' })}`
  }

  const getBudgetTotal = (budgetId: string) => {
    const budget = budgets.find(b => b.id === budgetId)
    return budget?.total ?? budget?.estimatedPrice ?? 0
  }

  const getServiceIcons = (workOrder: WorkOrder) => {
    // Use work order items if available, otherwise fallback to budget items
    const items = workOrder.items || []
    
    // Simulate service icons based on items
    const icons = []
    if (items.some((item: any) => item.description?.toLowerCase().includes('óleo') || item.description?.toLowerCase().includes('filtro'))) {
      icons.push(<Droplet key="oil" className="h-5 w-5 text-blue-500" />)
    }
    if (items.some((item: any) => item.description?.toLowerCase().includes('pneu') || item.description?.toLowerCase().includes('roda'))) {
      icons.push(<Wrench key="tire" className="h-5 w-5 text-orange-500" />)
    }
    if (items.some((item: any) => item.description?.toLowerCase().includes('travão') || item.description?.toLowerCase().includes('brake'))) {
      icons.push(<Zap key="brake" className="h-5 w-5 text-red-500" />)
    }
    
    return icons.length > 0 ? icons : [<Wrench key="default" className="h-5 w-5 text-gray-500" />]
  }

  const filterWorkOrders = (workOrdersList: WorkOrder[]) => {
    if (!searchFilter.trim()) return workOrdersList
    
    const searchLower = searchFilter.toLowerCase().trim()
    
    return workOrdersList.filter(wo => {
      if (!wo) return false
      const vehicle = vehicles.find(v => v && v.id === wo.vehicleId)
      const clientName = getClientName(wo.clientId, wo.budgetId, wo.vehicleId)
      
      const matchesLicensePlate = vehicle?.licensePlate?.toLowerCase().includes(searchLower)
      const matchesClientName = clientName?.toLowerCase().includes(searchLower)
      
      return matchesLicensePlate || matchesClientName
    })
  }

  const openWorkOrders = filterWorkOrders(workOrders.filter(wo => wo.status !== 'completed'))
  const completedWorkOrders = filterWorkOrders(workOrders.filter(wo => wo.status === 'completed'))

  const handleShowVehicleDetails = (vehicleId: string, event: React.MouseEvent) => {
    event.stopPropagation()
    setSelectedVehicleId(vehicleId)
    setVehicleDetailsSidebarOpen(true)
  }

  const getWorkflowStatusLabel = (workflowStatus?: string) => {
    switch (workflowStatus) {
      case 'reception-complete':
        return '✓ Receção Completa'
      case 'diagnosis':
        return '🔍 Em Diagnóstico'
      case 'budgeting':
        return '📋 Em Orçamentação'
      case 'waiting-approval':
        return '⏳ Aguarda Aprovação'
      case 'waiting-parts':
        return '📦 Aguarda Peças'
      case 'execution':
        return '🔧 Em Execução'
      case 'paused':
        return '⏸️ Em Pausa'
      case 'delivery':
        return '🚗 Pronto p/ Entrega'
      case 'completed':
        return '✅ Entregue ao Cliente'
      default:
        return '⏳ Pendente'
    }
  }

  const getWorkflowStatusColor = (workflowStatus?: string) => {
    switch (workflowStatus) {
      case 'completed':
        return 'from-green-500 to-green-600'
      case 'delivery':
        return 'from-emerald-500 to-emerald-600'
      case 'execution':
        return 'from-blue-500 to-blue-600'
      case 'diagnosis':
        return 'from-indigo-500 to-indigo-600'
      case 'waiting-parts':
      case 'waiting-approval':
        return 'from-amber-500 to-amber-600'
      case 'paused':
        return 'from-orange-500 to-orange-600'
      case 'budgeting':
        return 'from-purple-500 to-purple-600'
      case 'reception-complete':
        return 'from-teal-500 to-teal-600'
      default:
        return 'from-gray-500 to-gray-600'
    }
  }

  const renderWorkOrderCard = (workOrder: WorkOrder) => {
    const vehicle = vehicles.find(v => v && v.id === workOrder.vehicleId)
    const clientName = getClientName(workOrder.clientId, workOrder.budgetId, workOrder.vehicleId)
    const total = workOrder.total ?? getBudgetTotal(workOrder.budgetId)
    const serviceIcons = getServiceIcons(workOrder)
    const isCompleted = workOrder.status === 'completed'
    const duration = calculateDuration(workOrder.startedAt, workOrder.completedAt)
    const isExpanded = expandedWorkOrders.has(workOrder.id)
    
    // Calculate progress percentage
    const getProgressPercentage = () => {
      if (workOrder.status === 'completed') return 100
      if (workOrder.status === 'in-progress') return 50
      if (workOrder.status === 'paused') return 50
      return 0
    }
    
    return (
      <Card 
        key={workOrder.id} 
        className="hover:shadow-2xl transition-all hover:-translate-y-1 border-0 bg-white/80 backdrop-blur-xl relative overflow-hidden group"
      >
        <div className={`absolute top-0 left-0 w-full h-1 bg-gradient-to-r ${getWorkflowStatusColor(workOrder.workflowStatus)}`}></div>
        <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-orange-500/5 opacity-0 group-hover:opacity-100 transition-opacity"></div>
        <CardContent className="p-0 relative">
          <div className="p-2.5 space-y-2">
            {/* Header com Número */}
            <div className="flex items-start justify-between gap-1.5 pb-1.5 border-b border-blue-100">
              <div className="space-y-0.5 flex-1">
                <div className="flex items-center gap-1.5">
                  <div className="text-[11px] font-mono font-semibold text-gray-700">
                    FO #{workOrder.number}
                  </div>
                  {workflowTimer.isTimerActive(workOrder.id) && (
                    <Badge className="text-[8px] px-1 py-0 h-4 bg-green-500 text-white animate-pulse">
                      ⏱️ A contar
                    </Badge>
                  )}
                  {workflowTimer.isTimerPaused(workOrder.id) && (
                    <Badge className="text-[8px] px-1 py-0 h-4 bg-amber-500 text-white">
                      ⏸️ Pausado
                    </Badge>
                  )}
                </div>
                <div className="text-[9px] text-muted-foreground">
                  {getWorkflowStatusLabel(workOrder.workflowStatus)}
                </div>
              </div>
              <div className="flex gap-1">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={(e) => workOrder.vehicleId && handleShowVehicleDetails(workOrder.vehicleId, e)}
                  title="Ver detalhes da viatura"
                  className="h-6 w-6 p-0 flex-shrink-0 hover:bg-blue-100 rounded-lg"
                >
                  <Info className="h-3 w-3 text-blue-600" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation()
                    handleDeleteWorkOrder(workOrder)
                  }}
                  title="Eliminar folha de obra"
                  className="h-6 w-6 p-0 flex-shrink-0 hover:bg-red-100 rounded-lg"
                >
                  <Trash2 className="h-3 w-3 text-red-600" />
                </Button>
              </div>
            </div>

            {/* Cliente */}
            <div className="bg-gradient-to-r from-blue-50 to-orange-50 rounded-lg p-1.5 border border-blue-100">
              <div className="text-[9px] text-gray-600 mb-0.5 font-medium">Cliente</div>
              <div className="text-xs font-semibold text-gray-800 truncate">{clientName}</div>
            </div>

            {/* Matrícula em destaque */}
            <div className="text-center py-1">
              <PortugueseLicensePlate 
                licensePlate={vehicle?.licensePlate || 'AA-00-AA'} 
                size="sm"
              />
            </div>

            {/* Modelo do Veículo */}
            <div className="text-center">
              <div className="text-xs font-semibold bg-gradient-to-r from-blue-600 to-orange-600 bg-clip-text text-transparent truncate px-1">
                {vehicle?.brand || 'N/A'} {vehicle?.model || ''}
              </div>
              {vehicle?.year && (
                <div className="text-[10px] text-muted-foreground font-medium">{vehicle.year}</div>
              )}
            </div>

            {/* Imagem do Veículo */}
            <div className="bg-gradient-to-b from-slate-50 to-slate-100 rounded p-2 flex items-center justify-center">
              <ImageWithFallback 
                src={getVehicleImage(vehicle)}
                alt={vehicle ? `${vehicle.brand} ${vehicle.model}` : 'Vehicle'}
                className="h-16 object-contain"
              />
            </div>

            {/* Total em destaque */}
            <div className="bg-gradient-to-br from-blue-50 via-white to-orange-50 rounded-lg p-2 text-center border border-blue-100 shadow-sm">
              <div className="text-[9px] uppercase tracking-wide text-gray-600 mb-0.5 font-medium">Total</div>
              <div className="text-xl font-bold bg-gradient-to-r from-blue-600 to-orange-600 bg-clip-text text-transparent">
                €{total.toFixed(2)}
              </div>
            </div>

            {/* Informação de Data/Tempo - Resumida */}
            <div className="text-[9px] text-muted-foreground text-center">
              {workOrder.startedAt 
                ? `Iniciado: ${formatDate(workOrder.startedAt)}`
                : `Criado: ${formatDate(workOrder.createdAt)}`}
            </div>

            {/* Botão Folha de Serviço */}
            <div className="pt-1.5 border-t border-blue-100">
              <Button
                variant="default"
                size="sm"
                onClick={async () => {
                  console.log('🖱️ Folha de Serviço button clicked for work order:', workOrder.id)
                  
                  if (!integration?.openServiceSheet || !integration?.getServiceSheetByWorkOrderId || !integration?.createServiceSheetFromWorkOrder) {
                    console.error('❌ Integration methods not available')
                    toast.error('Erro: Métodos de integração não disponíveis')
                    return
                  }
                  
                  try {
                    // Check if service sheet already exists
                    console.log('🔍 Checking if service sheet exists for work order:', workOrder.id)
                    const existingServiceSheet = await integration.getServiceSheetByWorkOrderId(workOrder.id, accessToken)
                    
                    if (!existingServiceSheet) {
                      console.log('➕ Service sheet does not exist, creating...')
                      // Create service sheet if it doesn't exist
                      const newServiceSheet = await integration.createServiceSheetFromWorkOrder(
                        workOrder.id, 
                        accessToken,
                        workOrder.workshopId
                      )
                      
                      if (!newServiceSheet) {
                        console.error('❌ Failed to create service sheet')
                        toast.error('Erro ao criar folha de serviço')
                        return
                      }
                      
                      console.log('✅ Service sheet created:', newServiceSheet.id)
                    } else {
                      console.log('✅ Service sheet already exists:', existingServiceSheet.id)
                    }
                    
                    // Open service sheet
                    console.log('📄 Opening service sheet page')
                    integration.openServiceSheet(workOrder.id)
                  } catch (error) {
                    console.error('❌ Error handling service sheet:', error)
                    toast.error('Erro ao abrir folha de serviço')
                  }
                }}
                className="w-full bg-gradient-to-r from-blue-600 to-orange-500 hover:from-blue-700 hover:to-orange-600 text-white h-8 text-xs shadow-md hover:shadow-lg transition-all"
              >
                <ClipboardCheck className="h-3.5 w-3.5 mr-1.5" />
                Folha de Serviço
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div className="flex-1 max-w-md">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Filtrar por matrícula ou cliente..."
              value={searchFilter}
              onChange={(e) => setSearchFilter(e.target.value)}
              className="pl-9 pr-9"
            />
            {searchFilter && (
              <button
                onClick={() => setSearchFilter('')}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Nova Folha de Obra
            </Button>
          </DialogTrigger>
          <DialogContent>
            <form onSubmit={handleSubmit}>
              <DialogHeader>
                <DialogTitle>Criar Folha de Obra</DialogTitle>
                <DialogDescription>
                  Crie uma folha de obra a partir de um orçamento aprovado
                </DialogDescription>
              </DialogHeader>
              
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="budgetId">Orçamento Aprovado *</Label>
                  <select
                    id="budgetId"
                    className="w-full rounded-md border border-input bg-input-background px-3 py-2"
                    value={selectedBudgetId}
                    onChange={(e) => setSelectedBudgetId(e.target.value)}
                    required
                  >
                    <option value="">Selecione um orçamento</option>
                    {availableBudgets.filter(b => b).map((budget) => {
                      // Get client name from budget (for public quotes) or clients list
                      const clientName = budget.publicQuoteRequestId && budget.clientName
                        ? budget.clientName
                        : clients.find(c => c && c.id === budget.clientId)?.name
                      const vehicle = vehicles.find(v => v && v.id === budget.vehicleId)
                      return (
                        <option key={budget.id} value={budget.id}>
                          {budget.number} - {clientName} - {vehicle?.brand} {vehicle?.model}
                        </option>
                      )
                    })}
                  </select>
                  {availableBudgets.length === 0 && (
                    <p className="text-sm text-muted-foreground">
                      Não há orçamentos aprovados disponíveis
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="technician">Técnico Responsável</Label>
                  <Input
                    id="technician"
                    placeholder="Nome do técnico"
                    value={assignedTechnicianId}
                    onChange={(e) => setAssignedTechnicianId(e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="notes">Notas / Observações</Label>
                  <Textarea
                    id="notes"
                    placeholder="Detalhes técnicos, instruções especiais..."
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    rows={4}
                  />
                </div>
              </div>

              <DialogFooter>
                <Button type="submit" disabled={availableBudgets.length === 0}>
                  Criar Folha de Obra
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Tabs defaultValue="open" className="space-y-4">
        <TabsList>
          <TabsTrigger value="open" className="gap-2">
            <ClipboardList className="h-4 w-4" />
            Em Aberto ({openWorkOrders.length})
          </TabsTrigger>
          <TabsTrigger value="completed" className="gap-2">
            <CheckCircle className="h-4 w-4" />
            Finalizadas ({completedWorkOrders.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="open" className="space-y-4">
          {loading ? (
            <div className="text-center py-12 text-muted-foreground">A carregar...</div>
          ) : openWorkOrders.length === 0 ? (
            <Card>
              <CardContent className="py-12">
                <div className="text-center text-muted-foreground">
                  <ClipboardList className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>Nenhuma folha de obra em aberto</p>
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-6 gap-3">
              {openWorkOrders.map(renderWorkOrderCard)}
            </div>
          )}
        </TabsContent>

        <TabsContent value="completed" className="space-y-4">
          {loading ? (
            <div className="text-center py-12 text-muted-foreground">A carregar...</div>
          ) : completedWorkOrders.length === 0 ? (
            <Card>
              <CardContent className="py-12">
                <div className="text-center text-muted-foreground">
                  <CheckCircle className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>Nenhuma folha de obra finalizada</p>
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-6 gap-3">
              {completedWorkOrders.map(renderWorkOrderCard)}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Edit Work Order Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={(open) => {
        setEditDialogOpen(open)
        if (!open) setEditingWorkOrder(null)
      }}>
        <DialogContent className="dialog-fullscreen overflow-y-auto">
          <form onSubmit={handleEditSubmit}>
            <DialogHeader>
              <DialogTitle>Editar Folha de Obra</DialogTitle>
              <DialogDescription>
                Edite os artigos e detalhes da folha de obra
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label>Artigos / Peças</Label>
                  <Button type="button" variant="outline" size="sm" onClick={addEditItem}>
                    <Plus className="h-4 w-4 mr-1" />
                    Adicionar Artigo
                  </Button>
                </div>
                
                {editItems.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground border border-dashed rounded-lg">
                    Nenhum artigo adicionado
                  </div>
                ) : (
                  <div className="space-y-2">
                    {editItems.map((item, index) => (
                      <div key={index} className="grid grid-cols-12 gap-2 items-start p-2 border rounded-lg">
                        <div className="col-span-2">
                          <Input
                            placeholder="Ref."
                            value={item.partNumber}
                            onChange={(e) => updateEditItem(index, 'partNumber', e.target.value)}
                          />
                        </div>
                        <div className="col-span-4">
                          <Input
                            placeholder="Descrição"
                            value={item.description}
                            onChange={(e) => updateEditItem(index, 'description', e.target.value)}
                            required
                          />
                        </div>
                        <div className="col-span-2">
                          <Input
                            type="number"
                            placeholder="Qtd"
                            min="1"
                            value={item.quantity}
                            onChange={(e) => updateEditItem(index, 'quantity', parseInt(e.target.value) || 1)}
                            required
                          />
                        </div>
                        <div className="col-span-3">
                          <Input
                            type="number"
                            step="0.01"
                            placeholder="Preço (€)"
                            min="0"
                            value={item.price}
                            onChange={(e) => updateEditItem(index, 'price', parseFloat(e.target.value) || 0)}
                            required
                          />
                        </div>
                        <div className="col-span-1 flex items-center justify-center">
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => removeEditItem(index)}
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="editLaborHours">Horas de Mão de Obra</Label>
                  <Input
                    id="editLaborHours"
                    type="number"
                    step="0.5"
                    min="0"
                    value={editLaborHours}
                    onChange={(e) => setEditLaborHours(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="editLaborRate">Taxa Horária (€/h)</Label>
                  <Input
                    id="editLaborRate"
                    type="number"
                    step="0.01"
                    min="0"
                    value={editLaborRate}
                    onChange={(e) => setEditLaborRate(e.target.value)}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="editTechnician">Técnico Responsável</Label>
                <Input
                  id="editTechnician"
                  placeholder="Nome do técnico"
                  value={editTechnician}
                  onChange={(e) => setEditTechnician(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="editNotes">Notas / Observações</Label>
                <Textarea
                  id="editNotes"
                  placeholder="Informações adicionais..."
                  value={editNotes}
                  onChange={(e) => setEditNotes(e.target.value)}
                  rows={3}
                />
              </div>
            </div>

            <DialogFooter>
              <Button type="submit">Atualizar Folha de Obra</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Vehicle Details Sidebar - Redesigned */}
      <Sheet open={vehicleDetailsSidebarOpen} onOpenChange={setVehicleDetailsSidebarOpen}>
        <SheetContent side="right" className="w-full sm:w-[550px] overflow-y-auto">
          <SheetHeader>
            <SheetTitle className="flex items-center gap-2 text-xl">
              <div className="bg-gradient-to-br from-blue-500 to-indigo-600 p-2 rounded-lg">
                <Car className="h-5 w-5 text-white" />
              </div>
              Detalhes da Viatura
            </SheetTitle>
            <SheetDescription>
              Informações completas e histórico de manutenção
            </SheetDescription>
          </SheetHeader>

          {selectedVehicleId && (() => {
            const vehicle = vehicles.find(v => v && v.id === selectedVehicleId)
            const client = vehicle ? clients.find(c => c && c.id === vehicle.clientId) : null

            if (!vehicle) {
              return (
                <div className="py-8 text-center text-muted-foreground">
                  <Car className="h-16 w-16 mx-auto mb-4 opacity-20" />
                  <p>Veículo não encontrado</p>
                </div>
              )
            }

            // Check if maintenance is due
            const isInspectionDue = vehicle.nextInspection && new Date(vehicle.nextInspection) < new Date()
            const isOilChangeDue = vehicle.nextOilChange && vehicle.mileage && vehicle.mileage >= vehicle.nextOilChange
            const isTimingDue = vehicle.nextTiming && vehicle.mileage && vehicle.mileage >= vehicle.nextTiming

            return (
              <div className="mt-6 space-y-4">
                {/* License Plate Display */}
                <div className="flex justify-center py-2">
                  <PortugueseLicensePlate 
                    licensePlate={vehicle.licensePlate} 
                    size="lg"
                  />
                </div>

                {/* Vehicle Image with Brand/Model */}
                <Card className="overflow-hidden border-2">
                  <CardContent className="p-0">
                    <div className="bg-gradient-to-br from-slate-50 to-slate-100 p-6 flex items-center justify-center min-h-[180px]">
                      <ImageWithFallback 
                        src={getVehicleImage(vehicle)}
                        alt={`${vehicle.brand} ${vehicle.model}`}
                        className="h-32 object-contain drop-shadow-xl"
                      />
                    </div>
                    <div className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white p-3 text-center">
                      <div className="font-semibold">{vehicle.brand} {vehicle.model}</div>
                      {vehicle.year && (
                        <div className="text-sm opacity-90">{vehicle.year}</div>
                      )}
                    </div>
                  </CardContent>
                </Card>

                {/* Maintenance Alerts */}
                {(isInspectionDue || isOilChangeDue || isTimingDue) && (
                  <Card className="border-2 border-amber-300 bg-amber-50">
                    <CardContent className="p-3">
                      <div className="flex items-start gap-2">
                        <AlertCircle className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
                        <div className="flex-1 space-y-1">
                          <div className="font-medium text-amber-900">Atenção: Manutenção Pendente</div>
                          <div className="text-xs text-amber-800 space-y-0.5">
                            {isInspectionDue && <div>• Inspeção vencida</div>}
                            {isOilChangeDue && <div>• Mudança de óleo necessária</div>}
                            {isTimingDue && <div>• Correia de distribuição necessária</div>}
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Basic Information Card */}
                <Card className="border-2 border-blue-100">
                  <CardHeader className="pb-3 bg-gradient-to-r from-blue-50 to-indigo-50">
                    <CardTitle className="flex items-center gap-2 text-base">
                      <FileText className="h-4 w-4 text-blue-600" />
                      Informação Básica
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="pt-3 space-y-2">
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      {vehicle.color && (
                        <div className="flex items-center gap-2 bg-slate-50 p-2 rounded">
                          <div 
                            className="w-4 h-4 rounded-full border-2 border-gray-300 flex-shrink-0"
                            style={{ backgroundColor: vehicle.color.toLowerCase() }}
                          />
                          <div className="flex-1 min-w-0">
                            <div className="text-[10px] text-muted-foreground">Cor</div>
                            <div className="font-medium truncate">{vehicle.color}</div>
                          </div>
                        </div>
                      )}
                      {vehicle.vin && (
                        <div className="col-span-2 bg-slate-50 p-2 rounded">
                          <div className="text-[10px] text-muted-foreground mb-0.5">VIN/Chassis</div>
                          <div className="font-mono text-xs break-all">{vehicle.vin}</div>
                        </div>
                      )}
                      {vehicle.registrationDate && (
                        <div className="bg-slate-50 p-2 rounded col-span-2">
                          <div className="flex items-center gap-2">
                            <CalendarIcon className="h-4 w-4 text-blue-600" />
                            <div className="flex-1">
                              <div className="text-[10px] text-muted-foreground">Data de Registo</div>
                              <div className="font-medium">{new Date(vehicle.registrationDate).toLocaleDateString('pt-PT')}</div>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>

                {/* Technical Specifications Card */}
                <Card className="border-2 border-purple-100">
                  <CardHeader className="pb-3 bg-gradient-to-r from-purple-50 to-pink-50">
                    <CardTitle className="flex items-center gap-2 text-base">
                      <Settings className="h-4 w-4 text-purple-600" />
                      Especificações Técnicas
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="pt-3 space-y-2">
                    <div className="grid grid-cols-2 gap-2">
                      {vehicle.fuelType && (
                        <div className="bg-gradient-to-br from-purple-50 to-purple-100 p-2.5 rounded-lg border border-purple-200">
                          <div className="flex items-center gap-2 mb-1">
                            <Fuel className="h-3.5 w-3.5 text-purple-600" />
                            <span className="text-[10px] text-purple-700 font-medium">Combustível</span>
                          </div>
                          <p className="font-semibold text-sm">{vehicle.fuelType}</p>
                        </div>
                      )}
                      {vehicle.engineCapacity && (
                        <div className="bg-gradient-to-br from-purple-50 to-purple-100 p-2.5 rounded-lg border border-purple-200">
                          <div className="flex items-center gap-2 mb-1">
                            <Gauge className="h-3.5 w-3.5 text-purple-600" />
                            <span className="text-[10px] text-purple-700 font-medium">Cilindrada</span>
                          </div>
                          <p className="font-semibold text-sm">{vehicle.engineCapacity}</p>
                        </div>
                      )}
                      {vehicle.transmission && (
                        <div className="bg-gradient-to-br from-purple-50 to-purple-100 p-2.5 rounded-lg border border-purple-200">
                          <div className="flex items-center gap-2 mb-1">
                            <Settings className="h-3.5 w-3.5 text-purple-600" />
                            <span className="text-[10px] text-purple-700 font-medium">Transmissão</span>
                          </div>
                          <p className="font-semibold text-sm">{vehicle.transmission}</p>
                        </div>
                      )}
                      {vehicle.tireSize && (
                        <div className="bg-gradient-to-br from-purple-50 to-purple-100 p-2.5 rounded-lg border border-purple-200">
                          <div className="flex items-center gap-2 mb-1">
                            <Wrench className="h-3.5 w-3.5 text-purple-600" />
                            <span className="text-[10px] text-purple-700 font-medium">Pneus</span>
                          </div>
                          <p className="font-semibold text-sm">{vehicle.tireSize}</p>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>

                {/* Maintenance Status Card */}
                <Card className="border-2 border-green-100">
                  <CardHeader className="pb-3 bg-gradient-to-r from-green-50 to-emerald-50">
                    <CardTitle className="flex items-center gap-2 text-base">
                      <ClipboardCheck className="h-4 w-4 text-green-600" />
                      Estado de Manutenção
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="pt-3 space-y-2.5">
                    {/* Current Mileage */}
                    {vehicle.mileage !== undefined && vehicle.mileage !== null && (
                      <div className="bg-gradient-to-r from-blue-500 to-indigo-600 text-white p-3 rounded-lg">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Gauge className="h-5 w-5" />
                            <span className="text-sm font-medium">Quilometragem Atual</span>
                          </div>
                          <div className="text-xl font-bold">
                            {vehicle.mileage.toLocaleString('pt-PT')} km
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Inspection */}
                    {vehicle.nextInspection && (
                      <div className={`p-2.5 rounded-lg border-2 ${
                        isInspectionDue 
                          ? 'bg-red-50 border-red-200' 
                          : 'bg-green-50 border-green-200'
                      }`}>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <ClipboardCheck className={`h-4 w-4 ${
                              isInspectionDue ? 'text-red-600' : 'text-green-600'
                            }`} />
                            <div>
                              <div className="text-[10px] font-medium text-muted-foreground">Próxima Inspeção</div>
                              <div className={`text-sm font-semibold ${
                                isInspectionDue ? 'text-red-700' : 'text-green-700'
                              }`}>
                                {new Date(vehicle.nextInspection).toLocaleDateString('pt-PT')}
                              </div>
                            </div>
                          </div>
                          {isInspectionDue && (
                            <Badge variant="destructive" className="text-[10px]">Vencida</Badge>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Oil Change */}
                    {vehicle.nextOilChange && (
                      <div className={`p-2.5 rounded-lg border-2 ${
                        isOilChangeDue 
                          ? 'bg-amber-50 border-amber-200' 
                          : 'bg-green-50 border-green-200'
                      }`}>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Droplet className={`h-4 w-4 ${
                              isOilChangeDue ? 'text-amber-600' : 'text-green-600'
                            }`} />
                            <div>
                              <div className="text-[10px] font-medium text-muted-foreground">Mudança de Óleo</div>
                              <div className={`text-sm font-semibold ${
                                isOilChangeDue ? 'text-amber-700' : 'text-green-700'
                              }`}>
                                {vehicle.nextOilChange.toLocaleString('pt-PT')} km
                              </div>
                            </div>
                          </div>
                          {isOilChangeDue && (
                            <Badge variant="outline" className="text-[10px] border-amber-400 text-amber-700 bg-amber-100">
                              Necessário
                            </Badge>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Timing Belt */}
                    {vehicle.nextTiming && (
                      <div className={`p-2.5 rounded-lg border-2 ${
                        isTimingDue 
                          ? 'bg-amber-50 border-amber-200' 
                          : 'bg-green-50 border-green-200'
                      }`}>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Settings className={`h-4 w-4 ${
                              isTimingDue ? 'text-amber-600' : 'text-green-600'
                            }`} />
                            <div>
                              <div className="text-[10px] font-medium text-muted-foreground">Correia Distribuição</div>
                              <div className={`text-sm font-semibold ${
                                isTimingDue ? 'text-amber-700' : 'text-green-700'
                              }`}>
                                {vehicle.nextTiming.toLocaleString('pt-PT')} km
                              </div>
                            </div>
                          </div>
                          {isTimingDue && (
                            <Badge variant="outline" className="text-[10px] border-amber-400 text-amber-700 bg-amber-100">
                              Necessário
                            </Badge>
                          )}
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Owner Information Card */}
                {client && (
                  <Card className="border-2 border-slate-100">
                    <CardHeader className="pb-3 bg-gradient-to-r from-slate-50 to-gray-50">
                      <CardTitle className="flex items-center gap-2 text-base">
                        <User className="h-4 w-4 text-slate-600" />
                        Proprietário
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="pt-3">
                      <div className="flex items-center gap-3 bg-slate-50 p-3 rounded-lg">
                        <div className="bg-gradient-to-br from-slate-600 to-slate-700 text-white rounded-full h-10 w-10 flex items-center justify-center font-semibold flex-shrink-0">
                          {client.name.charAt(0).toUpperCase()}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="font-semibold truncate">{client.name}</div>
                          <div className="text-xs text-muted-foreground">Cliente</div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Notes Card */}
                {vehicle.notes && (
                  <Card className="border-2 border-amber-100">
                    <CardHeader className="pb-3 bg-gradient-to-r from-amber-50 to-yellow-50">
                      <CardTitle className="flex items-center gap-2 text-base">
                        <FileText className="h-4 w-4 text-amber-600" />
                        Notas & Observações
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="pt-3">
                      <div className="bg-amber-50 p-3 rounded-lg border border-amber-100">
                        <p className="text-sm text-amber-900 whitespace-pre-wrap">
                          {vehicle.notes}
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Close Button */}
                <div className="pt-2 sticky bottom-0 bg-white/95 backdrop-blur-sm border-t">
                  <Button 
                    variant="outline" 
                    className="w-full h-11 font-medium"
                    onClick={() => setVehicleDetailsSidebarOpen(false)}
                  >
                    Fechar
                  </Button>
                </div>
              </div>
            )
          })()}
        </SheetContent>
      </Sheet>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar Eliminação</AlertDialogTitle>
            <AlertDialogDescription>
              Tem a certeza que pretende eliminar a folha de obra <strong>{workOrderToDelete?.number}</strong>?
              <br />
              <br />
              Esta ação irá:
              <ul className="list-disc list-inside mt-2 space-y-1">
                <li>Eliminar a folha de obra permanentemente</li>
                {workOrderToDelete?.budgetId && (
                  <li>Eliminar o orçamento associado</li>
                )}
              </ul>
              <br />
              <span className="text-red-600 font-semibold">Esta ação não pode ser revertida.</span>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDeleteWorkOrder}
              disabled={deleting}
              className="bg-red-600 hover:bg-red-700 focus:ring-red-600"
            >
              {deleting ? 'A eliminar...' : 'Eliminar'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
