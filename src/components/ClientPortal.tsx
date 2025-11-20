import { useState, useEffect, useRef } from 'react'
import { Button } from './ui/button'
import { Input } from './ui/input'
import { Label } from './ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card'
import { Badge } from './ui/badge'
import { Separator } from './ui/separator'
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from './ui/dialog'
import { Calendar as CalendarComponent } from './ui/calendar'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select'
import { Textarea } from './ui/textarea'
import { ImageWithFallback } from './figma/ImageWithFallback'
import { PortugueseLicensePlate } from './PortugueseLicensePlate'
import { getVehicleImageUrl } from './vehicleDatabase'
import { AppointmentSchedulingDialog } from './AppointmentSchedulingDialog'
import { InstantQuoteResults } from './InstantQuoteResults'
import { projectId, publicAnonKey } from '../utils/supabase/info'
import { toast } from 'sonner@2.0.3'
import { 
  User, 
  LogOut, 
  FileText, 
  Car, 
  Clock, 
  Euro,
  Calendar,
  CheckCircle,
  XCircle,
  AlertCircle,
  Wrench,
  Plus,
  Search,
  MapPin,
  UserPlus,
  Building2,
  Phone,
  ClipboardList,
  Package,
  PlayCircle,
  CheckCircle2,
  Bell,
  History,
  MessageSquare,
  Send,
  Check,
  CheckCheck,
  X
} from 'lucide-react'

interface ClientPortalProps {
  accessToken: string
  user: any
  onLogout: () => void
}

interface WorkshopResponse {
  workshopId: string
  workshopName: string
  quotedPrice: number
  status: string
  updatedAt: string
  workshopAddress?: string
  workshopLogo?: string
  workshopPhone?: string
}

interface QuoteRequest {
  id: string
  licensePlate: string
  location: string
  serviceName: string
  basePrice: number
  clientName: string
  clientEmail: string
  clientPhone: string
  notes: string
  status: string
  createdAt: string
  respondedWorkshops?: WorkshopResponse[]
  updatedAt?: string
  selectedWorkshopId?: string
  approvedAt?: string
}

interface Service {
  id: string
  name: string
  basePrice: number
  duration: number
}

interface WorkOrder {
  id: string
  number: string
  budgetId: string
  clientId: string
  vehicleId: string
  status: 'pending' | 'in-progress' | 'paused' | 'completed'
  total?: number
  partsTotal?: number
  laborTotal?: number
  subtotal?: number
  tax?: number
  items?: any[]
  laborHours?: number
  laborRate?: number
  createdAt: string
  startedAt?: string
  completedAt?: string
  notes?: string
}

interface ServiceSheetStatus {
  id: string
  status: 'reception' | 'diagnosis' | 'ordering' | 'parts_arrival' | 'execution' | 'delivery' | 'completed' | 'cancelled'
  updatedAt: string
}

interface StatusHistoryEntry {
  id: string
  serviceSheetId: string
  workOrderId: string
  oldStatus: string
  newStatus: string
  timestamp: string
}

interface ClientNotification {
  id: string
  clientId: string
  workshopId: string
  workOrderId: string
  workOrderNumber: string
  type: string
  title: string
  message: string
  newStatus: string
  read: boolean
  timestamp: string
}

interface Vehicle {
  id: string
  licensePlate: string
  brand: string
  model: string
  year?: string
  color?: string
  fuelType?: string
}

export function ClientPortal({ accessToken, user, onLogout }: ClientPortalProps) {
  const [quoteRequests, setQuoteRequests] = useState<QuoteRequest[]>([])
  const [loading, setLoading] = useState(true)
  const [profileData, setProfileData] = useState({
    name: user.user_metadata?.name || '',
    phone: user.user_metadata?.phone || '',
    address: user.user_metadata?.address || '',
    cp4: user.user_metadata?.cp4 || '',
    cp3: user.user_metadata?.cp3 || '',
    locality: user.user_metadata?.locality || '',
    country: user.user_metadata?.country || 'Portugal',
    nif: user.user_metadata?.nif || '',
    email1: user.email || '',
    email2: user.user_metadata?.email2 || '',
    phone1: user.user_metadata?.phone1 || user.user_metadata?.phone || '',
    phone2: user.user_metadata?.phone2 || '',
    phone3: user.user_metadata?.phone3 || '',
    vatRegime: user.user_metadata?.vatRegime || 'normal',
    clientType: user.user_metadata?.clientType || 'particular'
  })
  const [postalCode, setPostalCode] = useState(
    user.user_metadata?.cp4 && user.user_metadata?.cp3 
      ? `${user.user_metadata.cp4}-${user.user_metadata.cp3}` 
      : ''
  )
  
  // New quote request dialog state
  const [showNewQuoteDialog, setShowNewQuoteDialog] = useState(false)
  const [services, setServices] = useState<Service[]>([])
  const [submittingQuote, setSubmittingQuote] = useState(false)
  const [newQuoteForm, setNewQuoteForm] = useState({
    licensePlate: '',
    postalCode: '',
    serviceId: '',
    notes: ''
  })
  
  // Vehicle identification state for new quote
  const [vehicleData, setVehicleData] = useState<{
    plate: string
    make: string
    model: string
    plateDate?: string
    vin?: string
  } | null>(null)
  const [loadingVehicle, setLoadingVehicle] = useState(false)
  const [vehicleIdentified, setVehicleIdentified] = useState(false)
  
  // Instant quote flow states
  const [quoteStep, setQuoteStep] = useState<'form' | 'instant-results' | 'confirmation'>('form')
  const [instantQuoteResults, setInstantQuoteResults] = useState<{
    quoteRequestId: string
    service: any
    workshops: any[]
  } | null>(null)
  const [selectedWorkshops, setSelectedWorkshops] = useState<string[]>([])
  
  // Workshop approval state
  const [approvingWorkshop, setApprovingWorkshop] = useState<string | null>(null)
  const [updatingProfile, setUpdatingProfile] = useState(false)
  const [showAppointmentDialog, setShowAppointmentDialog] = useState(false)
  const [selectedWorkshopForAppointment, setSelectedWorkshopForAppointment] = useState<{
    publicQuoteRequestId: string
    workshopId: string
    workshopName: string
    serviceName: string
  } | null>(null)
  
  // Work orders and vehicles state
  const [workOrders, setWorkOrders] = useState<WorkOrder[]>([])
  const [vehicles, setVehicles] = useState<Vehicle[]>([])
  const [serviceSheetStatuses, setServiceSheetStatuses] = useState<Map<string, ServiceSheetStatus>>(new Map())
  const [loadingWorkOrders, setLoadingWorkOrders] = useState(true)
  
  // Notifications state
  const [notifications, setNotifications] = useState<ClientNotification[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [showNotifications, setShowNotifications] = useState(false)
  
  // Status history state
  const [statusHistory, setStatusHistory] = useState<Map<string, StatusHistoryEntry[]>>(new Map())
  
  // Messages state
  const [messageThreads, setMessageThreads] = useState<any[]>([])
  const [totalUnreadMessages, setTotalUnreadMessages] = useState(0)
  const [newMessage, setNewMessage] = useState('')
  const [workshopNames, setWorkshopNames] = useState<Map<string, string>>(new Map())
  const [selectedThread, setSelectedThread] = useState<string | null>(null)
  
  // Tabs state
  const [activeTab, setActiveTab] = useState('requests')
  
  // Appointments state
  const [appointments, setAppointments] = useState<any[]>([])
  const [loadingAppointments, setLoadingAppointments] = useState(false)
  const [showRescheduleDialog, setShowRescheduleDialog] = useState(false)
  const [selectedAppointment, setSelectedAppointment] = useState<any>(null)
  const [rescheduleDate, setRescheduleDate] = useState<Date | undefined>(undefined)
  const [rescheduleTime, setRescheduleTime] = useState('')
  const [rescheduleNotes, setRescheduleNotes] = useState('')
  
  // Cancel request state
  const [cancellingRequest, setCancellingRequest] = useState<string | null>(null)
  const [showCancelDialog, setShowCancelDialog] = useState(false)
  const [requestToCancel, setRequestToCancel] = useState<string | null>(null)
  
  // Budgets state
  const [budgets, setBudgets] = useState<any[]>([])
  const [loadingBudgets, setLoadingBudgets] = useState(true)
  const [pendingBudgetsCount, setPendingBudgetsCount] = useState(0)
  const [approvingBudget, setApprovingBudget] = useState<string | null>(null)
  
  // Refs for auto-scrolling messages to bottom
  const messageContainerRefs = useRef<Map<string, HTMLDivElement | null>>(new Map())

  useEffect(() => {
    fetchQuoteRequests()
    loadServices()
    fetchWorkOrders()
    fetchNotifications()
    fetchMessages()
    fetchAppointments()
    fetchBudgets()
    
    // Poll for new messages every 30 seconds
    const messagesInterval = setInterval(() => {
      fetchMessages()
    }, 30000)
    
    // Poll for notifications every 30 seconds
    const notificationsInterval = setInterval(() => {
      fetchNotifications()
    }, 30000)
    
    return () => {
      clearInterval(messagesInterval)
      clearInterval(notificationsInterval)
    }
  }, [])

  // Auto-scroll messages to bottom when they load or change
  useEffect(() => {
    // Scroll each message thread to bottom
    messageThreads.forEach((thread) => {
      const container = messageContainerRefs.current.get(thread.workOrderId)
      if (container) {
        container.scrollTop = container.scrollHeight
      }
    })
  }, [messageThreads])

  const fetchQuoteRequests = async () => {
    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-6971b43c/client/quote-requests`,
        {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
          },
        }
      )

      if (response.ok) {
        const data = await response.json()
        const requests = data.quoteRequests || []
        // Ordenar por data mais recente primeiro
        const sortedRequests = requests.sort((a: QuoteRequest, b: QuoteRequest) => {
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        })
        setQuoteRequests(sortedRequests)
      }
    } catch (error) {
      console.error('Error fetching quote requests:', error)
      toast.error('Erro ao carregar pedidos')
    } finally {
      setLoading(false)
    }
  }

  const loadServices = async () => {
    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-6971b43c/public/services`,
        {
          headers: {
            'Authorization': `Bearer ${publicAnonKey}`,
          },
        }
      )

      if (response.ok) {
        const data = await response.json()
        setServices(data.services || [])
      }
    } catch (error) {
      console.error('Error loading services:', error)
    }
  }
  
  // Format Portuguese license plate
  const formatLicensePlate = (value: string): string => {
    // Remove all non-alphanumeric characters
    const cleaned = value.toUpperCase().replace(/[^A-Z0-9]/g, '')
    
    // If empty, return empty
    if (!cleaned) return ''
    
    // Portuguese license plates can be:
    // Format 1 (current): XX-XX-XX (2 letters, 2 numbers, 2 letters) - e.g., AB-12-CD
    // Format 2 (old): XX-XX-XX (2 numbers, 2 letters, 2 numbers) - e.g., 12-AB-34
    
    // Detect format based on first characters
    const firstTwoAreLetters = /^[A-Z]{2}/.test(cleaned)
    const firstTwoAreNumbers = /^[0-9]{2}/.test(cleaned)
    
    let formatted = ''
    
    if (firstTwoAreLetters) {
      // Current format: XX-XX-XX (letters-numbers-letters)
      if (cleaned.length <= 2) {
        formatted = cleaned
      } else if (cleaned.length <= 4) {
        formatted = cleaned.slice(0, 2) + '-' + cleaned.slice(2)
      } else {
        formatted = cleaned.slice(0, 2) + '-' + cleaned.slice(2, 4) + '-' + cleaned.slice(4, 6)
      }
    } else if (firstTwoAreNumbers) {
      // Old format: XX-XX-XX (numbers-letters-numbers)
      if (cleaned.length <= 2) {
        formatted = cleaned
      } else if (cleaned.length <= 4) {
        formatted = cleaned.slice(0, 2) + '-' + cleaned.slice(2)
      } else {
        formatted = cleaned.slice(0, 2) + '-' + cleaned.slice(2, 4) + '-' + cleaned.slice(4, 6)
      }
    } else {
      // Mixed start or unknown - just add hyphens every 2 characters
      if (cleaned.length <= 2) {
        formatted = cleaned
      } else if (cleaned.length <= 4) {
        formatted = cleaned.slice(0, 2) + '-' + cleaned.slice(2)
      } else {
        formatted = cleaned.slice(0, 2) + '-' + cleaned.slice(2, 4) + '-' + cleaned.slice(4, 6)
      }
    }
    
    return formatted
  }
  
  // Identify vehicle by license plate
  const handleIdentifyVehicle = async () => {
    if (!newQuoteForm.licensePlate || newQuoteForm.licensePlate.length < 6) {
      toast.error('Por favor, insira uma matrícula válida')
      return
    }

    setLoadingVehicle(true)
    setVehicleData(null)
    setVehicleIdentified(false)

    try {
      const formattedPlate = formatLicensePlate(newQuoteForm.licensePlate)
      
      console.log(`🚗 CLIENT: Identifying vehicle for plate: ${formattedPlate}`)

      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-6971b43c/infomatricula/search?plate=${formattedPlate}`,
        {
          headers: {
            'Authorization': `Bearer ${publicAnonKey}`,
          },
        }
      )

      if (response.ok) {
        const data = await response.json()
        console.log('✅ CLIENT: Vehicle data retrieved:', data)
        
        setVehicleData({
          plate: data.plate,
          make: data.make,
          model: data.model,
          plateDate: data.plateDate,
          vin: data.vin
        })
        setVehicleIdentified(true)
        
        toast.success('Veículo identificado com sucesso!')
      } else {
        const errorData = await response.json()
        console.error('❌ CLIENT: Error response:', errorData)
        toast.error(errorData.error || 'Não foi possível identificar o veículo')
      }
    } catch (error) {
      console.error('❌ CLIENT: Error identifying vehicle:', error)
      toast.error('Erro ao consultar matrícula')
    } finally {
      setLoadingVehicle(false)
    }
  }

  const handleSubmitNewQuote = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmittingQuote(true)

    try {
      // Validate
      if (!newQuoteForm.licensePlate || !newQuoteForm.postalCode || !newQuoteForm.serviceId) {
        toast.error('Por favor, preencha todos os campos obrigatórios')
        setSubmittingQuote(false)
        return
      }
      
      // Validate postal code format
      if (!/^\d{4}$/.test(newQuoteForm.postalCode)) {
        toast.error('Código postal inválido. Insira apenas os 4 primeiros dígitos (ex: 1000)')
        setSubmittingQuote(false)
        return
      }
      
      // Check if vehicle has been identified
      if (!vehicleIdentified) {
        toast.error('Por favor, identifique o veículo antes de continuar')
        setSubmittingQuote(false)
        return
      }

      // Get client profile to populate data
      const profileResponse = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-6971b43c/client/profile`,
        {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
          },
        }
      )

      if (!profileResponse.ok) {
        toast.error('Erro ao obter dados do perfil')
        setSubmittingQuote(false)
        return
      }

      const profileData = await profileResponse.json()
      const clientProfile = profileData.profile

      console.log('📝 CLIENT: Generating instant quote:', newQuoteForm)

      // Generate instant quote with the new system
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-6971b43c/public/instant-quote`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${publicAnonKey}`,
          },
          body: JSON.stringify({
            ...newQuoteForm,
            clientName: clientProfile.name,
            clientEmail: clientProfile.email,
            clientPhone: clientProfile.phone || ''
          })
        }
      )

      const data = await response.json()

      if (!response.ok) {
        toast.error(data.error || 'Erro ao gerar orçamento instantâneo')
        
        if (data.availablePostalCodes) {
          toast.info('Códigos postais disponíveis: ' + data.availablePostalCodes.join(', '))
        }
        setSubmittingQuote(false)
        return
      }

      console.log('✅ CLIENT: Instant quote generated:', data)
      
      setInstantQuoteResults(data)
      setQuoteStep('instant-results')
      
      toast.success(`Encontrámos ${data.workshops.length} oficina(s) na sua zona!`)
    } catch (error) {
      console.error('Error generating instant quote:', error)
      toast.error('Erro ao gerar orçamento')
    } finally {
      setSubmittingQuote(false)
    }
  }
  
  const handleToggleWorkshopSelection = (workshopId: string) => {
    setSelectedWorkshops(prev => {
      if (prev.includes(workshopId)) {
        return prev.filter(id => id !== workshopId)
      } else {
        if (prev.length >= 3) {
          toast.warning('Pode selecionar no máximo 3 oficinas')
          return prev
        }
        return [...prev, workshopId]
      }
    })
  }
  
  const handleSendToSelectedWorkshops = async () => {
    if (selectedWorkshops.length === 0) {
      toast.error('Selecione pelo menos 1 oficina')
      return
    }
    
    setSubmittingQuote(true)
    try {
      console.log('📤 CLIENT: Sending request to selected workshops:', selectedWorkshops)
      
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-6971b43c/public/select-workshops`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${publicAnonKey}`,
          },
          body: JSON.stringify({
            quoteRequestId: instantQuoteResults?.quoteRequestId,
            selectedWorkshopIds: selectedWorkshops
          })
        }
      )
      
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to send to workshops')
      }
      
      const data = await response.json()
      console.log('✅ CLIENT: Sent to workshops successfully:', data)
      
      setQuoteStep('confirmation')
      toast.success('Pedido enviado com sucesso!')
    } catch (error) {
      console.error('Error sending to workshops:', error)
      toast.error('Erro ao enviar pedido às oficinas')
    } finally {
      setSubmittingQuote(false)
    }
  }
  
  const handleNewRequest = () => {
    setQuoteStep('form')
    setInstantQuoteResults(null)
    setSelectedWorkshops([])
    setVehicleData(null)
    setVehicleIdentified(false)
    setLoadingVehicle(false)
    setNewQuoteForm({
      licensePlate: '',
      postalCode: '',
      serviceId: '',
      notes: ''
    })
  }
  
  const handleCloseQuoteDialog = () => {
    setShowNewQuoteDialog(false)
    setQuoteStep('form')
    setInstantQuoteResults(null)
    setSelectedWorkshops([])
    setVehicleData(null)
    setVehicleIdentified(false)
    setLoadingVehicle(false)
    setNewQuoteForm({
      licensePlate: '',
      postalCode: '',
      serviceId: '',
      notes: ''
    })
    // Refresh quote requests
    fetchQuoteRequests()
  }

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault()
    setUpdatingProfile(true)

    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-6971b43c/client/profile`,
        {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${accessToken}`,
          },
          body: JSON.stringify(profileData)
        }
      )

      if (response.ok) {
        toast.success('Perfil atualizado com sucesso!')
        
        // Sync profile updates to workshop clients in real-time
        try {
          const syncResponse = await fetch(
            `https://${projectId}.supabase.co/functions/v1/make-server-6971b43c/client/sync-to-workshops`,
            {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${accessToken}`,
              },
            }
          )
          
          if (syncResponse.ok) {
            const syncData = await syncResponse.json()
            if (syncData.syncedClients > 0) {
              toast.success(`Dados sincronizados em ${syncData.syncedClients} oficina(s)`)
            }
          }
        } catch (syncError) {
          console.error('Error syncing to workshops:', syncError)
          // Don't show error to user - sync is a background operation
        }
      } else {
        toast.error('Erro ao atualizar perfil')
      }
    } catch (error) {
      console.error('Error updating profile:', error)
      toast.error('Erro ao atualizar perfil')
    } finally {
      setUpdatingProfile(false)
    }
  }

  const handleApproveBudget = async (budgetId: string) => {
    setApprovingBudget(budgetId)
    try {
      console.log('✅ CLIENT: Approving budget:', budgetId)
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-6971b43c/client/budgets/${budgetId}/approve`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ action: 'approve' })
        }
      )

      if (response.ok) {
        toast.success('Orçamento aprovado com sucesso!')
        await fetchBudgets() // Refresh budgets
      } else {
        const errorData = await response.json()
        toast.error(errorData.error || 'Erro ao aprovar orçamento')
      }
    } catch (error) {
      console.error('❌ Error approving budget:', error)
      toast.error('Erro ao aprovar orçamento')
    } finally {
      setApprovingBudget(null)
    }
  }

  const handleApproveWorkshop = async (publicQuoteRequestId: string, workshopId: string, workshopName: string, serviceName: string) => {
    console.log('🏭 CLIENT: Opening appointment dialog for workshop:', {
      publicQuoteRequestId,
      workshopId,
      workshopName,
      serviceName
    })
    
    // Open appointment scheduling dialog
    setSelectedWorkshopForAppointment({
      publicQuoteRequestId,
      workshopId,
      workshopName,
      serviceName
    })
    setShowAppointmentDialog(true)
  }

  const handleConfirmAppointment = async (preferredDate: string, preferredTime: string, notes: string) => {
    if (!selectedWorkshopForAppointment) return
    
    console.log('📅 CLIENT: Confirming appointment:', {
      workshop: selectedWorkshopForAppointment,
      preferredDate,
      preferredTime,
      notes
    })
    
    setApprovingWorkshop(selectedWorkshopForAppointment.workshopId)
    
    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-6971b43c/client/approve-workshop`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${accessToken}`,
          },
          body: JSON.stringify({
            publicQuoteRequestId: selectedWorkshopForAppointment.publicQuoteRequestId,
            workshopId: selectedWorkshopForAppointment.workshopId,
            preferredDate,
            preferredTime,
            notes
          })
        }
      )
      
      console.log('📡 CLIENT: Appointment response status:', response.status)

      const data = await response.json()

      if (response.ok) {
        toast.success(`Pedido de agendamento enviado para "${selectedWorkshopForAppointment.workshopName}"!`)
        setShowAppointmentDialog(false)
        setSelectedWorkshopForAppointment(null)
        // Refresh quote requests to show updated status
        fetchQuoteRequests()
      } else {
        toast.error(data.error || 'Erro ao enviar pedido')
      }
    } catch (error) {
      console.error('Error approving workshop:', error)
      toast.error('Erro ao enviar pedido de agendamento')
    } finally {
      setApprovingWorkshop(null)
    }
  }

  const handleCancelRequest = async (quoteRequestId: string) => {
    setRequestToCancel(quoteRequestId)
    setShowCancelDialog(true)
  }

  const confirmCancelRequest = async () => {
    if (!requestToCancel) return
    
    setCancellingRequest(requestToCancel)
    
    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-6971b43c/client/cancel-quote-request`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${accessToken}`,
          },
          body: JSON.stringify({
            quoteRequestId: requestToCancel
          })
        }
      )

      if (response.ok) {
        toast.success('Pedido cancelado com sucesso!')
        setShowCancelDialog(false)
        setRequestToCancel(null)
        // Refresh quote requests to remove cancelled one
        fetchQuoteRequests()
        fetchAppointments()
      } else {
        const data = await response.json()
        toast.error(data.error || 'Erro ao cancelar pedido')
      }
    } catch (error) {
      console.error('Error cancelling request:', error)
      toast.error('Erro ao cancelar pedido')
    } finally {
      setCancellingRequest(null)
    }
  }

  const debugClientData = async () => {
    try {
      console.log('🐛 ==================== CLIENT DEBUG START ====================')
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-6971b43c/client/debug-data`,
        {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
          },
        }
      )
      
      if (response.ok) {
        const data = await response.json()
        console.log('📊 SUMMARY:')
        console.log('   - Procurando email:', data.summary.searchingForEmail)
        console.log('   - Total clientes no sistema:', data.summary.totalClientsInSystem)
        console.log('   - Total folhas de obra no sistema:', data.summary.totalWorkOrdersInSystem)
        console.log('   - Clientes encontrados:', data.summary.matchingClientsFound)
        console.log('   - Folhas de obra encontradas:', data.summary.matchingWorkOrdersFound)
        console.log('')
        console.log('👤 CLIENT PROFILE:')
        console.log(data.clientProfile)
        console.log('')
        console.log('✅ MATCHING CLIENTS:')
        if (data.matchingClients.length > 0) {
          data.matchingClients.forEach((client: any) => {
            console.log(`   - ID: "${client.id}" | Email: ${client.email} | Name: ${client.name} | Workshop: ${client.workshopId}`)
          })
        } else {
          console.log('   (nenhum)')
        }
        console.log('')
        console.log('📋 MATCHING WORK ORDERS:')
        if (data.matchingWorkOrders.length > 0) {
          data.matchingWorkOrders.forEach((wo: any) => {
            console.log(`   - WO ${wo.number} | ClientID: "${wo.clientId}" | WorkshopID: ${wo.workshopId} | Status: ${wo.status}`)
          })
        } else {
          console.log('   (nenhuma)')
        }
        console.log('')
        console.log('📊 SAMPLES - First 5 clients in system:')
        if (data.samples.firstFiveClients.length > 0) {
          data.samples.firstFiveClients.forEach((client: any) => {
            console.log(`   - ID: "${client.id}" | Email: ${client.email} | Workshop: ${client.workshopId}`)
          })
        } else {
          console.log('   (nenhum)')
        }
        console.log('')
        console.log('📊 SAMPLES - First 10 work orders in system:')
        if (data.samples.firstTenWorkOrders.length > 0) {
          data.samples.firstTenWorkOrders.forEach((wo: any) => {
            console.log(`   - WO ${wo.number} | ClientID: "${wo.clientId}" | WorkshopID: ${wo.workshopId}`)
          })
        } else {
          console.log('   (nenhuma)')
        }
        console.log('🐛 ==================== CLIENT DEBUG END ====================')
        
        const message = `Debug completo! ${data.summary.matchingClientsFound} clientes encontrados, ${data.summary.matchingWorkOrdersFound} folhas de obra. Ver console (F12).`
        toast.success(message, { duration: 5000 })
      } else {
        const error = await response.json()
        console.error('❌ Debug error:', error)
        toast.error('Erro no debug: ' + error.error)
      }
    } catch (error) {
      console.error('❌ Debug error:', error)
      toast.error('Erro no debug')
    }
  }

  const fetchWorkOrders = async () => {
    setLoadingWorkOrders(true)
    try {
      console.log('🔍 CLIENT PORTAL: Fetching work orders...')
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-6971b43c/client/work-orders`,
        {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
          },
        }
      )

      console.log('📡 Response status:', response.status)
      
      if (response.ok) {
        const data = await response.json()
        console.log('✅ Data received:', {
          workOrders: data.workOrders?.length || 0,
          vehicles: data.vehicles?.length || 0
        })
        
        if (data.workOrders && data.workOrders.length > 0) {
          console.log('📋 Work Orders:', data.workOrders.map((wo: any) => ({
            number: wo.number,
            status: wo.status,
            total: wo.total
          })))
        }
        
        setWorkOrders(data.workOrders || [])
        setVehicles(data.vehicles || [])
        
        // Fetch service sheet statuses for each work order
        const statuses = new Map<string, ServiceSheetStatus>()
        console.log('🔍 CLIENT PORTAL: Fetching service sheet statuses for work orders:', data.workOrders?.length)
        for (const wo of data.workOrders || []) {
          try {
            console.log(`📡 Fetching service sheet status for WO: ${wo.id} (${wo.number})`)
            const statusResponse = await fetch(
              `https://${projectId}.supabase.co/functions/v1/make-server-6971b43c/client/service-sheet-status/${wo.id}`,
              {
                headers: {
                  'Authorization': `Bearer ${accessToken}`,
                },
              }
            )
            if (statusResponse.ok) {
              const statusData = await statusResponse.json()
              console.log(`📊 Service sheet data for WO ${wo.number}:`, statusData)
              if (statusData.serviceSheet) {
                statuses.set(wo.id, statusData.serviceSheet)
                console.log(`✅ Service sheet status stored: ${statusData.serviceSheet.status}`)
              } else {
                console.log(`⚠️ No service sheet found for WO ${wo.number}`)
              }
            } else {
              console.log(`❌ Failed to fetch service sheet status for WO ${wo.number}: ${statusResponse.status}`)
            }
          } catch (error) {
            console.error(`Error fetching service sheet status for ${wo.id}:`, error)
          }
        }
        console.log(`✅ Total service sheet statuses fetched: ${statuses.size}`)
        setServiceSheetStatuses(statuses)
        
        // Fetch status history for each service sheet
        const historyMap = new Map<string, StatusHistoryEntry[]>()
        console.log('📜 CLIENT PORTAL: Fetching status history...')
        for (const wo of data.workOrders || []) {
          const serviceSheetStatus = statuses.get(wo.id)
          if (serviceSheetStatus) {
            try {
              console.log(`📡 Fetching history for service sheet: ${serviceSheetStatus.id}`)
              const historyResponse = await fetch(
                `https://${projectId}.supabase.co/functions/v1/make-server-6971b43c/service-sheet-status-history/${serviceSheetStatus.id}`,
                {
                  headers: {
                    'Authorization': `Bearer ${accessToken}`,
                  },
                }
              )
              if (historyResponse.ok) {
                const historyData = await historyResponse.json()
                console.log(`📊 History data for SS ${serviceSheetStatus.id}:`, historyData)
                if (historyData.history && historyData.history.length > 0) {
                  historyMap.set(wo.id, historyData.history)
                  console.log(`✅ History stored: ${historyData.history.length} entries`)
                } else {
                  console.log(`ℹ️ No history entries for SS ${serviceSheetStatus.id}`)
                }
              } else {
                console.log(`❌ Failed to fetch history: ${historyResponse.status}`)
              }
            } catch (error) {
              console.error(`Error fetching history for SS ${serviceSheetStatus.id}:`, error)
            }
          } else {
            console.log(`⚠️ No service sheet status found for WO ${wo.number} - skipping history fetch`)
          }
        }
        console.log(`✅ Total history entries fetched: ${historyMap.size} work orders`)
        setStatusHistory(historyMap)
      } else {
        const errorData = await response.json()
        console.error('❌ Error response:', errorData)
        toast.error('Erro ao carregar serviços: ' + (errorData.error || 'Erro desconhecido'))
      }
    } catch (error) {
      console.error('❌ Error fetching work orders:', error)
      toast.error('Erro ao carregar serviços')
    } finally {
      setLoadingWorkOrders(false)
    }
  }

  const fetchBudgets = async () => {
    setLoadingBudgets(true)
    try {
      console.log('🔍 CLIENT PORTAL: Fetching budgets...')
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-6971b43c/client/budgets`,
        {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
          },
        }
      )

      if (response.ok) {
        const data = await response.json()
        console.log('✅ Budgets received:', data.budgets?.length || 0)
        setBudgets(data.budgets || [])
        
        // Count pending budgets
        const pending = (data.budgets || []).filter((b: any) => b.status === 'pending' || b.status === 'draft').length
        setPendingBudgetsCount(pending)
        console.log('📊 Pending budgets:', pending)
      } else {
        console.error('❌ Error fetching budgets')
        toast.error('Erro ao carregar orçamentos')
      }
    } catch (error) {
      console.error('❌ Error fetching budgets:', error)
      toast.error('Erro ao carregar orçamentos')
    } finally {
      setLoadingBudgets(false)
    }
  }

  const fetchNotifications = async () => {
    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-6971b43c/client/notifications`,
        {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
          },
        }
      )
      
      if (response.ok) {
        const data = await response.json()
        setNotifications(data.notifications || [])
        setUnreadCount(data.unreadCount || 0)
        console.log(`📬 Loaded ${data.notifications?.length || 0} notifications (${data.unreadCount} unread)`)
      }
    } catch (error) {
      console.error('❌ Error fetching notifications:', error)
    }
  }

  const markNotificationAsRead = async (notificationId: string) => {
    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-6971b43c/client/notifications/${notificationId}/read`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${accessToken}`,
          },
        }
      )
      
      if (response.ok) {
        // Update local state
        setNotifications(prev => prev.map(n => 
          n.id === notificationId ? { ...n, read: true } : n
        ))
        setUnreadCount(prev => Math.max(0, prev - 1))
      }
    } catch (error) {
      console.error('❌ Error marking notification as read:', error)
    }
  }

  const markAllNotificationsAsRead = async () => {
    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-6971b43c/client/notifications/read-all`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${accessToken}`,
          },
        }
      )
      
      if (response.ok) {
        setNotifications(prev => prev.map(n => ({ ...n, read: true })))
        setUnreadCount(0)
        toast.success('Todas as notificações marcadas como lidas')
      }
    } catch (error) {
      console.error('❌ Error marking all notifications as read:', error)
      toast.error('Erro ao marcar notificações como lidas')
    }
  }

  // ==================== BUDGET APPROVAL FUNCTIONS ====================
  
  const handleBudgetApproval = async (budgetId: string, action: 'approve' | 'reject') => {
    try {
      console.log(`📋 CLIENT: ${action}ing budget:`, budgetId)
      
      // Immediately update the notification locally to prevent double-clicking
      setNotifications(prev => prev.map(n =>
        n.budgetId === budgetId && n.type === 'budget_validation_required'
          ? { ...n, clientAction: action, read: true } as any
          : n
      ))
      
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-6971b43c/client/budgets/${budgetId}/approve`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${accessToken}`
          },
          body: JSON.stringify({ action })
        }
      )
      
      if (!response.ok) {
        // Revert the local change if the request failed
        setNotifications(prev => prev.map(n =>
          n.budgetId === budgetId && n.type === 'budget_validation_required'
            ? { ...n, clientAction: undefined, read: false } as any
            : n
        ))
        throw new Error('Erro ao processar aprovação')
      }
      
      const actionText = action === 'approve' ? 'aprovado' : 'rejeitado'
      toast.success(`Orçamento ${actionText} com sucesso!`)
      
      // Update unread count
      setUnreadCount(prev => Math.max(0, prev - 1))
      
      // Reload notifications to get any updates from server
      await fetchNotifications()
      
    } catch (error: any) {
      console.error('❌ CLIENT: Error approving/rejecting budget:', error)
      toast.error('Erro ao processar aprovação do orçamento')
    }
  }

  // ==================== APPOINTMENTS FUNCTIONS ====================
  
  const fetchAppointments = async () => {
    setLoadingAppointments(true)
    try {
      console.log('📅 CLIENT: Loading appointments...')
      
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-6971b43c/client/appointments`,
        {
          headers: {
            'Authorization': `Bearer ${accessToken}`
          }
        }
      )
      
      console.log('📡 CLIENT: Appointments response status:', response.status)
      
      if (!response.ok) {
        const errorData = await response.json()
        console.error('❌ CLIENT: Error response:', errorData)
        throw new Error('Erro ao carregar agendamentos')
      }
      
      const data = await response.json()
      console.log('✅ CLIENT: Loaded appointments:', data.appointments?.length || 0)
      setAppointments(data.appointments || [])
    } catch (error: any) {
      console.error('❌ CLIENT: Error loading appointments:', error)
      toast.error('Erro ao carregar agendamentos')
    } finally {
      setLoadingAppointments(false)
    }
  }
  
  const handleRequestReschedule = (appointment: any) => {
    setSelectedAppointment(appointment)
    setRescheduleDate(undefined)
    setRescheduleTime('')
    setRescheduleNotes('')
    setShowRescheduleDialog(true)
  }
  
  const submitRescheduleRequest = async () => {
    if (!selectedAppointment || !rescheduleDate || !rescheduleTime) {
      toast.error('Preencha a data e hora desejadas')
      return
    }
    
    try {
      console.log('📅 CLIENT: Requesting reschedule:', {
        appointmentId: selectedAppointment.id,
        requestedDate: rescheduleDate.toISOString().split('T')[0],
        requestedTime: rescheduleTime
      })
      
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-6971b43c/client/appointments/reschedule-request`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${accessToken}`
          },
          body: JSON.stringify({
            appointmentId: selectedAppointment.id,
            requestedDate: rescheduleDate.toISOString().split('T')[0],
            requestedTime: rescheduleTime,
            notes: rescheduleNotes
          })
        }
      )
      
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Erro ao solicitar reagendamento')
      }
      
      const data = await response.json()
      console.log('✅ CLIENT: Reschedule requested:', data)
      
      toast.success('✅ Pedido de reagendamento enviado! A oficina será notificada.')
      setShowRescheduleDialog(false)
      setSelectedAppointment(null)
      
      // Refresh appointments
      await fetchAppointments()
    } catch (error: any) {
      console.error('❌ CLIENT: Error requesting reschedule:', error)
      toast.error(error.message || 'Erro ao solicitar reagendamento')
    }
  }

  const fetchMessages = async () => {
    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-6971b43c/client/messages`,
        {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
          },
        }
      )
      
      if (response.ok) {
        const data = await response.json()
        setMessageThreads(data.threads || [])
        setTotalUnreadMessages(data.totalUnread || 0)
        console.log(`💬 Loaded ${data.threads?.length || 0} message threads (${data.totalUnread} unread)`)
        
        // Extract unique workshop IDs from messages and fetch workshop names
        const workshopIds = new Set<string>()
        data.threads?.forEach((thread: any) => {
          thread.messages?.forEach((msg: any) => {
            if (msg.workshopId) {
              workshopIds.add(msg.workshopId)
            }
          })
        })
        
        // Fetch workshop names
        const newWorkshopNames = new Map<string, string>()
        for (const workshopId of workshopIds) {
          try {
            const workshopResponse = await fetch(
              `https://${projectId}.supabase.co/functions/v1/make-server-6971b43c/public/workshop/${workshopId}`,
              {
                headers: {
                  'Authorization': `Bearer ${accessToken}`,
                },
              }
            )
            
            if (workshopResponse.ok) {
              const workshopData = await workshopResponse.json()
              if (workshopData.workshop?.name) {
                newWorkshopNames.set(workshopId, workshopData.workshop.name)
              }
            }
          } catch (error) {
            console.error(`Error fetching workshop ${workshopId}:`, error)
          }
        }
        
        setWorkshopNames(newWorkshopNames)
      }
    } catch (error) {
      console.error('❌ Error fetching messages:', error)
    }
  }

  const sendMessage = async (workOrderId: string, message: string) => {
    if (!message.trim()) {
      toast.error('Mensagem não pode estar vazia')
      return
    }

    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-6971b43c/client/messages`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${accessToken}`,
          },
          body: JSON.stringify({
            workOrderId,
            message: message.trim()
          })
        }
      )
      
      if (response.ok) {
        toast.success('Mensagem enviada com sucesso')
        setNewMessage('')
        // Refresh messages
        await fetchMessages()
        
        // Scroll to bottom after sending message
        setTimeout(() => {
          const container = messageContainerRefs.current.get(workOrderId)
          if (container) {
            container.scrollTop = container.scrollHeight
          }
        }, 100)
      } else {
        const error = await response.json()
        toast.error(error.error || 'Erro ao enviar mensagem')
      }
    } catch (error) {
      console.error('❌ Error sending message:', error)
      toast.error('Erro ao enviar mensagem')
    }
  }

  const markThreadAsRead = async (workOrderId: string) => {
    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-6971b43c/client/messages/thread/${workOrderId}/read-all`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${accessToken}`,
          },
        }
      )
      
      if (response.ok) {
        // Update local state
        setMessageThreads(prev => prev.map(thread => 
          thread.workOrderId === workOrderId 
            ? { ...thread, unreadCount: 0, messages: thread.messages.map((m: any) => ({ ...m, read: true })) }
            : thread
        ))
        // Recalculate total unread
        const newTotal = messageThreads.reduce((sum, thread) => 
          thread.workOrderId === workOrderId ? sum : sum + thread.unreadCount, 0
        )
        setTotalUnreadMessages(newTotal)
      }
    } catch (error) {
      console.error('❌ Error marking thread as read:', error)
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge variant="secondary"><AlertCircle className="h-3 w-3 mr-1" />Pendente</Badge>
      case 'awaiting_response':
        return <Badge variant="default" className="bg-yellow-600"><Clock className="h-3 w-3 mr-1" />Aguarda Resposta</Badge>
      case 'responded':
        return <Badge variant="default" className="bg-blue-600"><FileText className="h-3 w-3 mr-1" />Com Respostas</Badge>
      case 'quoted':
        return <Badge variant="default" className="bg-blue-600"><FileText className="h-3 w-3 mr-1" />Orçamentado</Badge>
      case 'approved':
        return <Badge variant="default" className="bg-green-600"><CheckCircle className="h-3 w-3 mr-1" />Aprovado</Badge>
      case 'rejected':
        return <Badge variant="destructive"><XCircle className="h-3 w-3 mr-1" />Rejeitado</Badge>
      default:
        return <Badge>{status}</Badge>
    }
  }

  const getWorkOrderStatusBadge = (status: 'pending' | 'in-progress' | 'paused' | 'completed') => {
    switch (status) {
      case 'pending':
        return <Badge variant="secondary" className="bg-yellow-100 text-yellow-800 hover:bg-yellow-100"><Clock className="h-3 w-3 mr-1" />Pendente</Badge>
      case 'in-progress':
        return <Badge variant="default" className="bg-blue-600"><PlayCircle className="h-3 w-3 mr-1" />Em Execução</Badge>
      case 'paused':
        return <Badge variant="secondary" className="bg-orange-100 text-orange-800 hover:bg-orange-100"><AlertCircle className="h-3 w-3 mr-1" />Pausado</Badge>
      case 'completed':
        return <Badge variant="default" className="bg-green-600"><CheckCircle2 className="h-3 w-3 mr-1" />Concluído</Badge>
      default:
        return <Badge>{status}</Badge>
    }
  }

  const getServiceSheetStatusBadge = (status: string) => {
    const statusMap: Record<string, { label: string; color: string; icon: any }> = {
      reception: { label: 'Receção', color: 'bg-slate-100 text-slate-800', icon: ClipboardList },
      diagnosis: { label: 'Diagnóstico', color: 'bg-blue-100 text-blue-800', icon: Search },
      budgeting: { label: 'Orçamentação', color: 'bg-cyan-100 text-cyan-800', icon: FileText },
      waiting_approval: { label: 'Aguarda Aprovação', color: 'bg-yellow-100 text-yellow-800', icon: Clock },
      waiting_parts: { label: 'Aguarda Peças', color: 'bg-purple-100 text-purple-800', icon: Package },
      ordering: { label: 'Encomenda', color: 'bg-purple-100 text-purple-800', icon: Package },
      parts_arrival: { label: 'Peças Chegaram', color: 'bg-indigo-100 text-indigo-800', icon: Package },
      execution: { label: 'Execução', color: 'bg-orange-100 text-orange-800', icon: Wrench },
      paused: { label: 'Pausado', color: 'bg-amber-100 text-amber-800', icon: AlertCircle },
      delivery: { label: 'Entrega', color: 'bg-teal-100 text-teal-800', icon: Car },
      completed: { label: 'Concluído', color: 'bg-green-100 text-green-800', icon: CheckCircle2 },
      cancelled: { label: 'Cancelado', color: 'bg-red-100 text-red-800', icon: XCircle },
    }
    
    const config = statusMap[status] || { label: status, color: 'bg-gray-100 text-gray-800', icon: AlertCircle }
    const Icon = config.icon
    
    return (
      <Badge variant="secondary" className={`${config.color} hover:${config.color}`}>
        <Icon className="h-3 w-3 mr-1" />
        {config.label}
      </Badge>
    )
  }

  const getEstimatedCompletion = (status: string, history: StatusHistoryEntry[] = []) => {
    // Tempo estimado por fase (em horas)
    const estimatedDurations: Record<string, number> = {
      reception: 0.5,           // 30 min
      diagnosis: 2,             // 2 horas
      budgeting: 1,             // 1 hora
      waiting_approval: 0,      // Indefinido (aguarda resposta cliente)
      waiting_parts: 4,         // 4 horas (aguarda peças)
      ordering: 24,             // 1 dia
      parts_arrival: 48,        // 2 dias
      execution: 4,             // 4 horas
      paused: 0,                // Indefinido
      delivery: 0.5,            // 30 min
    }
    
    // Get workflow from reception to current status
    const workflow = ['reception', 'diagnosis', 'budgeting', 'waiting_approval', 'waiting_parts', 'execution', 'delivery', 'completed']
    const currentIndex = workflow.indexOf(status)
    
    // Não mostra estimativa para estados concluídos, cancelados, pausados ou aguardando aprovação
    if (currentIndex === -1 || status === 'completed' || status === 'cancelled' || status === 'paused' || status === 'waiting_approval') {
      return null
    }
    
    // Calculate remaining time
    let remainingHours = 0
    for (let i = currentIndex + 1; i < workflow.length - 1; i++) {
      remainingHours += estimatedDurations[workflow[i]] || 0
    }
    
    if (remainingHours === 0) {
      return 'Pronto para levantamento'
    }
    
    // Calculate estimated date
    const now = new Date()
    const estimatedDate = new Date(now.getTime() + remainingHours * 60 * 60 * 1000)
    
    // Format output
    if (remainingHours < 24) {
      return `~${Math.ceil(remainingHours)} horas`
    } else {
      const days = Math.ceil(remainingHours / 24)
      return `~${days} ${days === 1 ? 'dia' : 'dias'}`
    }
  }

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp)
    
    // Format: dd/MM/yyyy HH:mm
    return date.toLocaleDateString('pt-PT', { 
      day: '2-digit', 
      month: '2-digit', 
      year: 'numeric',
      hour: '2-digit', 
      minute: '2-digit'
    })
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      {/* Header */}
      <header className="border-b bg-white/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="h-10 w-10 rounded-full bg-blue-600 flex items-center justify-center">
              <User className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="font-bold">Área de Cliente</h1>
              <p className="text-xs text-muted-foreground">{user.email}</p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" onClick={debugClientData} title="Debug - Ver dados no console">
              🐛 Debug
            </Button>
            
            {/* Notifications Button */}
            <Dialog open={showNotifications} onOpenChange={setShowNotifications}>
              <DialogTrigger asChild>
                <Button variant="ghost" size="icon" className="relative">
                  <Bell className="h-5 w-5" />
                  {(unreadCount + totalUnreadMessages + pendingBudgetsCount) > 0 && (
                    <span className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-red-500 text-white text-xs flex items-center justify-center">
                      {unreadCount + totalUnreadMessages + pendingBudgetsCount}
                    </span>
                  )}
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl max-h-[600px] overflow-y-auto">
                <DialogHeader>
                  <div className="flex items-center justify-between">
                    <DialogTitle>Notificações</DialogTitle>
                    {unreadCount > 0 && (
                      <Button variant="ghost" size="sm" onClick={markAllNotificationsAsRead}>
                        Marcar todas como lidas
                      </Button>
                    )}
                  </div>
                </DialogHeader>
                <div className="space-y-2 mt-4">
                  {/* Pending Budgets Alert */}
                  {pendingBudgetsCount > 0 && (
                    <div className="p-4 rounded-lg border-2 border-orange-300 bg-gradient-to-r from-orange-50 to-amber-50 mb-4">
                      <div className="flex items-start gap-3">
                        <div className="bg-orange-500 text-white rounded-full p-2">
                          <Euro className="h-5 w-5" />
                        </div>
                        <div className="flex-1">
                          <h4 className="font-semibold text-orange-900 mb-1">
                            {pendingBudgetsCount} {pendingBudgetsCount === 1 ? 'Orçamento Pendente' : 'Orçamentos Pendentes'}
                          </h4>
                          <p className="text-sm text-orange-800 mb-3">
                            {pendingBudgetsCount === 1 
                              ? 'Tem 1 orçamento aguardando a sua aprovação.' 
                              : `Tem ${pendingBudgetsCount} orçamentos aguardando a sua aprovação.`}
                          </p>
                          <Button 
                            size="sm" 
                            className="bg-orange-600 hover:bg-orange-700 text-white"
                            onClick={() => {
                              setShowNotifications(false)
                              setActiveTab('budgets')
                            }}
                          >
                            Ver Orçamentos
                          </Button>
                        </div>
                      </div>
                    </div>
                  )}
                  
                  {notifications.length === 0 && pendingBudgetsCount === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      <Bell className="h-12 w-12 mx-auto mb-2 opacity-20" />
                      <p>Sem notificações</p>
                    </div>
                  ) : (
                    notifications.map((notification) => (
                      <div
                        key={notification.id}
                        className={`p-4 rounded-lg border transition-colors ${
                          notification.read
                            ? 'bg-white'
                            : 'bg-blue-50 border-blue-200'
                        } ${notification.type !== 'budget_validation_required' ? 'cursor-pointer' : ''}`}
                        onClick={() => !notification.read && notification.type !== 'budget_validation_required' && markNotificationAsRead(notification.id)}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <h4 className="font-semibold text-sm">{notification.title}</h4>
                              {!notification.read && (
                                <div className="h-2 w-2 rounded-full bg-blue-600" />
                              )}
                            </div>
                            <p className="text-sm text-muted-foreground mb-2">{notification.message}</p>
                            
                            {/* Budget approval buttons */}
                            {notification.type === 'budget_validation_required' && notification.budgetId && (
                              <div className="flex gap-2 mt-3">
                                <Button
                                  size="sm"
                                  className="bg-green-600 hover:bg-green-700"
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    handleBudgetApproval(notification.budgetId, 'approve')
                                  }}
                                >
                                  <Check className="h-4 w-4 mr-1" />
                                  Aprovar Orçamento
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    handleBudgetApproval(notification.budgetId, 'reject')
                                  }}
                                >
                                  <X className="h-4 w-4 mr-1" />
                                  Rejeitar
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="border-blue-300 text-blue-700 hover:bg-blue-50"
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    setShowNotifications(false)
                                    setActiveTab('budgets')
                                  }}
                                >
                                  <FileText className="h-4 w-4 mr-1" />
                                  Ver Orçamento
                                </Button>
                              </div>
                            )}
                            
                            <div className="flex items-center gap-3 text-xs text-muted-foreground mt-2">
                              {notification.workOrderNumber && (
                                <span className="flex items-center gap-1">
                                  <FileText className="h-3 w-3" />
                                  {notification.workOrderNumber}
                                </span>
                              )}
                              {notification.serviceName && (
                                <span className="flex items-center gap-1">
                                  <FileText className="h-3 w-3" />
                                  {notification.serviceName}
                                </span>
                              )}
                              {notification.licensePlate && (
                                <span className="flex items-center gap-1">
                                  <Car className="h-3 w-3" />
                                  {notification.licensePlate}
                                </span>
                              )}
                              {notification.total && (
                                <span className="flex items-center gap-1 font-semibold text-green-600">
                                  €{notification.total}
                                </span>
                              )}
                              <span className="flex items-center gap-1">
                                <Clock className="h-3 w-3" />
                                {formatTimestamp(notification.timestamp || notification.createdAt)}
                              </span>
                            </div>
                          </div>
                          {notification.newStatus && getServiceSheetStatusBadge(notification.newStatus)}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </DialogContent>
            </Dialog>
            
            <Button variant="outline" onClick={onLogout}>
              <LogOut className="h-4 w-4 mr-2" />
              Sair
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="mb-6">
            <TabsTrigger value="requests" className="flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Meus Pedidos
            </TabsTrigger>
            <TabsTrigger value="budgets" className="flex items-center gap-2 relative">
              <Euro className="h-4 w-4" />
              Orçamentos
              {pendingBudgetsCount > 0 && (
                <span className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-orange-500 text-white text-xs flex items-center justify-center">
                  {pendingBudgetsCount}
                </span>
              )}
            </TabsTrigger>
            <TabsTrigger value="in-progress" className="flex items-center gap-2">
              <PlayCircle className="h-4 w-4" />
              Serviços em Execução
            </TabsTrigger>
            <TabsTrigger value="completed" className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4" />
              Serviços Terminados
            </TabsTrigger>
            <TabsTrigger value="messages" className="flex items-center gap-2 relative">
              <MessageSquare className="h-4 w-4" />
              Mensagens
              {totalUnreadMessages > 0 && (
                <span className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-red-500 text-white text-xs flex items-center justify-center">
                  {totalUnreadMessages}
                </span>
              )}
            </TabsTrigger>
            <TabsTrigger value="appointments" className="flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              Agendamentos
            </TabsTrigger>
            <TabsTrigger value="profile" className="flex items-center gap-2">
              <User className="h-4 w-4" />
              Perfil
            </TabsTrigger>
          </TabsList>

          <TabsContent value="requests">
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl">Pedidos de Orçamento</h2>
                  <p className="text-muted-foreground">
                    Histórico dos seus pedidos de serviços
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <Badge variant="secondary">
                    {quoteRequests.length} pedido{quoteRequests.length !== 1 ? 's' : ''}
                  </Badge>
                  
                  {/* New Quote Request Button */}
                  <Dialog open={showNewQuoteDialog} onOpenChange={setShowNewQuoteDialog}>
                    <DialogTrigger asChild>
                      <Button className="bg-gradient-to-r from-blue-600 to-orange-500 hover:from-blue-700 hover:to-orange-600">
                        <Plus className="h-4 w-4 mr-2" />
                        Pedir Orçamento
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="!max-w-[calc(100vw-20px)] !w-[calc(100vw-20px)] !h-[calc(100vh-20px)] !max-h-[calc(100vh-20px)] overflow-y-auto">
                      {quoteStep === 'form' && (
                        <>
                          <DialogHeader>
                            <DialogTitle className="flex items-center gap-2 text-2xl">
                              <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-blue-600 to-orange-500 flex items-center justify-center">
                                <Search className="h-5 w-5 text-white" />
                              </div>
                              Pedir Novo Orçamento
                            </DialogTitle>
                            <DialogDescription>
                              Preencha os dados e receba orçamentos instantâneos de oficinas na sua zona
                            </DialogDescription>
                          </DialogHeader>
                          
                          <form onSubmit={handleSubmitNewQuote} className="space-y-6 pt-4">
                            {/* Vehicle Info */}
                            <div className="space-y-4 p-4 rounded-xl bg-gradient-to-br from-blue-50 to-orange-50/30 border border-blue-100">
                              <h3 className="font-bold flex items-center gap-2 text-blue-900">
                                <div className="h-8 w-8 rounded-lg bg-blue-600 flex items-center justify-center">
                                  <Car className="h-4 w-4 text-white" />
                                </div>
                                Dados do Veículo
                              </h3>
                              
                              <div className="grid md:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                  <Label htmlFor="new-licensePlate" className="text-gray-700 font-semibold">
                                    Matrícula *
                                  </Label>
                                  <Input
                                    id="new-licensePlate"
                                    placeholder="XX-XX-XX"
                                    value={newQuoteForm.licensePlate}
                                    onChange={(e) => setNewQuoteForm({...newQuoteForm, licensePlate: formatLicensePlate(e.target.value)})}
                                    required
                                    disabled={submittingQuote}
                                    className="border-blue-200 focus:border-blue-500"
                                  />
                                  <Button
                                    type="button"
                                    onClick={handleIdentifyVehicle}
                                    size="sm"
                                    className="mt-2 bg-gradient-to-r from-blue-600 to-orange-500 hover:from-blue-700 hover:to-orange-600 text-white border-0 shadow-lg font-semibold w-full"
                                    disabled={loadingVehicle || submittingQuote}
                                  >
                                    {loadingVehicle ? (
                                      <span className="flex items-center">
                                        <span className="animate-spin mr-2">⚙️</span>
                                        A identificar veículo...
                                      </span>
                                    ) : (
                                      <>
                                        <Search className="h-4 w-4 mr-2" />
                                        Identificar Veículo
                                      </>
                                    )}
                                  </Button>
                                </div>
                                
                                <div className="space-y-2">
                                  <Label htmlFor="new-postalCode" className="text-gray-700 font-semibold">
                                    Código Postal (4 dígitos) *
                                  </Label>
                                  <Input
                                    id="new-postalCode"
                                    placeholder="1000"
                                    value={newQuoteForm.postalCode}
                                    onChange={(e) => setNewQuoteForm({...newQuoteForm, postalCode: e.target.value.replace(/\D/g, '').substring(0, 4)})}
                                    required
                                    maxLength={4}
                                    disabled={submittingQuote}
                                    className="border-blue-200 focus:border-blue-500"
                                  />
                                  <p className="text-xs text-gray-600">
                                    Apenas os 4 primeiros dígitos (ex: 1000 para Lisboa)
                                  </p>
                                </div>
                              </div>
                              
                              {vehicleIdentified && vehicleData && (
                                <div className="mt-6 p-4 rounded-xl bg-white border-2 border-green-200 shadow-lg animate-in slide-in-from-bottom duration-500">
                                  <div className="flex items-start gap-3 mb-3">
                                    <div className="h-10 w-10 rounded-lg bg-green-500 flex items-center justify-center">
                                      <CheckCircle className="h-6 w-6 text-white" />
                                    </div>
                                    <div className="flex-1">
                                      <h4 className="font-bold text-green-900 text-lg">Veículo Identificado!</h4>
                                      <p className="text-sm text-green-700">Dados obtidos com sucesso</p>
                                    </div>
                                  </div>
                                  
                                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-3 border-t border-green-200">
                                    <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-3 rounded-lg border border-blue-200">
                                      <div className="flex items-center gap-2 mb-1">
                                        <Car className="h-4 w-4 text-blue-600" />
                                        <p className="text-xs text-blue-700 font-medium">Matrícula</p>
                                      </div>
                                      <p className="text-lg font-black text-blue-900">{vehicleData.plate}</p>
                                    </div>
                                    
                                    <div className="bg-gradient-to-br from-orange-50 to-orange-100 p-3 rounded-lg border border-orange-200">
                                      <div className="flex items-center gap-2 mb-1">
                                        <Car className="h-4 w-4 text-orange-600" />
                                        <p className="text-xs text-orange-700 font-medium">Marca</p>
                                      </div>
                                      <p className="text-lg font-black text-orange-900">{vehicleData.make}</p>
                                    </div>
                                    
                                    <div className="bg-gradient-to-br from-purple-50 to-purple-100 p-3 rounded-lg border border-purple-200">
                                      <div className="flex items-center gap-2 mb-1">
                                        <Car className="h-4 w-4 text-purple-600" />
                                        <p className="text-xs text-purple-700 font-medium">Modelo</p>
                                      </div>
                                      <p className="text-lg font-black text-purple-900">{vehicleData.model}</p>
                                    </div>
                                  </div>
                                  
                                  {vehicleData.plateDate && (
                                    <div className="mt-3 flex items-center gap-2 text-sm text-gray-600">
                                      <Calendar className="h-4 w-4" />
                                      <span>Data de Matrícula: <span className="font-semibold">{vehicleData.plateDate}</span></span>
                                    </div>
                                  )}
                                  
                                  <div className="mt-3 flex items-center justify-between p-2 bg-green-50 rounded-lg border border-green-200">
                                    <p className="text-xs text-green-700 font-medium">✓ Dados guardados automaticamente</p>
                                    <Badge className="bg-green-600 text-white border-0">Verificado</Badge>
                                  </div>
                                </div>
                              )}
                            </div>

                            {/* Service Selection */}
                            <div className="space-y-4 p-4 rounded-xl bg-gradient-to-br from-orange-50 to-blue-50/30 border border-orange-100">
                              <h3 className="font-bold flex items-center gap-2 text-orange-900">
                                <div className="h-8 w-8 rounded-lg bg-orange-600 flex items-center justify-center">
                                  <Wrench className="h-4 w-4 text-white" />
                                </div>
                                Serviço Pretendido
                              </h3>
                              
                              <div className="space-y-2">
                                <Label htmlFor="new-service" className="text-gray-700 font-semibold">
                                  Tipo de Serviço *
                                </Label>
                                <select
                                  id="new-service"
                                  className="w-full rounded-lg border-2 border-orange-200 focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 bg-white px-3 py-2.5 font-medium"
                                  value={newQuoteForm.serviceId}
                                  onChange={(e) => setNewQuoteForm({...newQuoteForm, serviceId: e.target.value})}
                                  required
                                  disabled={submittingQuote}
                                >
                                  <option value="">Selecione o serviço...</option>
                                  {services.map(service => (
                                    <option key={service.id} value={service.id}>
                                      {service.name} - A partir de €{service.basePrice} ({service.duration}min)
                                    </option>
                                  ))}
                                </select>
                              </div>

                              <div className="space-y-2">
                                <Label htmlFor="new-notes" className="text-gray-700 font-semibold">
                                  Observações (opcional)
                                </Label>
                                <textarea
                                  id="new-notes"
                                  placeholder="Descreva o problema ou necessidades específicas..."
                                  value={newQuoteForm.notes}
                                  onChange={(e) => setNewQuoteForm({...newQuoteForm, notes: e.target.value})}
                                  disabled={submittingQuote}
                                  rows={3}
                                  className="w-full rounded-lg border-2 border-orange-200 focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 bg-white px-3 py-2 text-sm resize-none"
                                />
                              </div>
                            </div>

                            <div className="flex gap-3 justify-end pt-4">
                              <Button
                                type="button"
                                variant="outline"
                                onClick={handleCloseQuoteDialog}
                                disabled={submittingQuote}
                              >
                                Cancelar
                              </Button>
                              <Button
                                type="submit"
                                disabled={submittingQuote}
                                className="bg-gradient-to-r from-blue-600 to-orange-500 hover:from-blue-700 hover:to-orange-600"
                              >
                                {submittingQuote ? 'A gerar orçamentos...' : 'Ver Orçamentos Instantâneos'}
                              </Button>
                            </div>
                          </form>
                        </>
                      )}
                      
                      {quoteStep === 'instant-results' && instantQuoteResults && (
                        <InstantQuoteResults
                          service={instantQuoteResults.service}
                          workshops={instantQuoteResults.workshops}
                          selectedWorkshops={selectedWorkshops}
                          onToggleWorkshop={handleToggleWorkshopSelection}
                          onContinue={handleSendToSelectedWorkshops}
                          onBack={handleNewRequest}
                          loading={submittingQuote}
                        />
                      )}
                      
                      {quoteStep === 'confirmation' && instantQuoteResults && (
                        <div className="space-y-6 animate-in fade-in duration-500 p-6">
                          {/* Success Header */}
                          <div className="text-center">
                            <div className="relative inline-block mb-6">
                              <div className="absolute inset-0 bg-green-500 rounded-full blur-3xl opacity-40 animate-pulse"></div>
                              <div className="relative">
                                <div className="h-24 w-24 rounded-full bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center mx-auto shadow-2xl">
                                  <CheckCircle className="h-14 w-14 text-white" />
                                </div>
                              </div>
                            </div>
                            
                            <h2 className="text-4xl mb-4 bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">
                              Pedido Enviado com Sucesso!
                            </h2>
                            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
                              O seu pedido foi enviado para <span className="text-blue-600">{selectedWorkshops.length} oficina(s)</span>.
                              <br />
                              <span className="text-sm text-gray-500 mt-2 inline-block">
                                Será notificado quando as oficinas responderem.
                              </span>
                            </p>
                          </div>

                          {/* What Happens Next */}
                          <Card className="bg-gradient-to-br from-blue-50 to-orange-50 border-2 border-blue-200">
                            <CardHeader>
                              <CardTitle className="text-center flex items-center justify-center gap-3">
                                <Clock className="h-6 w-6 text-blue-600" />
                                O que acontece agora?
                              </CardTitle>
                            </CardHeader>
                            <CardContent>
                              <div className="space-y-4">
                                <div className="flex gap-4 p-4 bg-white rounded-xl shadow-sm border border-blue-100">
                                  <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-blue-600 to-blue-700 flex items-center justify-center flex-shrink-0">
                                    <span className="text-white">1</span>
                                  </div>
                                  <div className="flex-1">
                                    <h4 className="text-gray-900 mb-1">As oficinas irão analisar</h4>
                                    <p className="text-sm text-gray-600">
                                      As {selectedWorkshops.length} oficinas selecionadas receberão o seu pedido e irão analisar os detalhes.
                                    </p>
                                  </div>
                                </div>

                                <div className="flex gap-4 p-4 bg-white rounded-xl shadow-sm border border-orange-100">
                                  <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-orange-500 to-orange-600 flex items-center justify-center flex-shrink-0">
                                    <span className="text-white">2</span>
                                  </div>
                                  <div className="flex-1">
                                    <h4 className="text-gray-900 mb-1">Receberá as respostas</h4>
                                    <p className="text-sm text-gray-600">
                                      Será notificado aqui na sua área de cliente quando as oficinas responderem.
                                    </p>
                                  </div>
                                </div>

                                <div className="flex gap-4 p-4 bg-white rounded-xl shadow-sm border border-green-100">
                                  <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-green-500 to-green-600 flex items-center justify-center flex-shrink-0">
                                    <span className="text-white">3</span>
                                  </div>
                                  <div className="flex-1">
                                    <h4 className="text-gray-900 mb-1">Escolha e agende</h4>
                                    <p className="text-sm text-gray-600">
                                      Compare as respostas, escolha a melhor oficina e agende diretamente.
                                    </p>
                                  </div>
                                </div>
                              </div>
                            </CardContent>
                          </Card>

                          {/* Action Buttons */}
                          <div className="flex justify-center gap-4 pt-4">
                            <Button 
                              onClick={() => {
                                handleNewRequest()
                                setShowNewQuoteDialog(false)
                              }}
                              variant="outline"
                              size="lg"
                              className="border-2 border-blue-200 hover:bg-blue-50 hover:border-blue-300"
                            >
                              Fazer Novo Pedido
                            </Button>
                            <Button 
                              onClick={handleCloseQuoteDialog}
                              variant="default"
                              size="lg"
                              className="bg-gradient-to-r from-blue-600 to-orange-600 hover:from-blue-700 hover:to-orange-700"
                            >
                              Ver Meus Pedidos
                            </Button>
                          </div>
                        </div>
                      )}
                    </DialogContent>
                  </Dialog>
                </div>
              </div>

              {loading ? (
                <div className="grid gap-4">
                  {[1, 2, 3].map((i) => (
                    <Card key={i}>
                      <CardHeader>
                        <div className="h-6 w-48 bg-muted animate-pulse rounded" />
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-2">
                          <div className="h-4 w-full bg-muted animate-pulse rounded" />
                          <div className="h-4 w-2/3 bg-muted animate-pulse rounded" />
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : quoteRequests.length === 0 ? (
                <Card>
                  <CardContent className="flex flex-col items-center justify-center py-12">
                    <FileText className="h-16 w-16 text-muted-foreground mb-4 opacity-50" />
                    <h3 className="text-lg mb-2">Nenhum pedido encontrado</h3>
                    <p className="text-sm text-muted-foreground text-center max-w-md">
                      Ainda não fez nenhum pedido de orçamento. Volte à página inicial para criar o seu primeiro pedido.
                    </p>
                  </CardContent>
                </Card>
              ) : (
                <div className="grid gap-4">
                  {quoteRequests.map((request) => (
                    <Card key={request.id} className="hover:shadow-md transition-shadow">
                      <CardHeader>
                        <div className="flex items-start justify-between">
                          <div className="space-y-1">
                            <CardTitle className="flex items-center gap-2">
                              <Wrench className="h-5 w-5 text-primary" />
                              {request.serviceName}
                            </CardTitle>
                            <CardDescription className="flex items-center gap-4 text-xs">
                              <span className="flex items-center gap-1">
                                <Car className="h-3 w-3" />
                                {request.licensePlate}
                              </span>
                              <span className="flex items-center gap-1">
                                <Calendar className="h-3 w-3" />
                                {new Date(request.createdAt).toLocaleDateString('pt-PT', {
                                  day: '2-digit',
                                  month: 'long',
                                  year: 'numeric'
                                })}
                              </span>
                            </CardDescription>
                          </div>
                          {getStatusBadge(request.status)}
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        <div className="grid md:grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <div className="flex items-center gap-2 text-sm">
                              <span className="text-muted-foreground">Localidade:</span>
                              <span>{request.location}</span>
                            </div>
                            <div className="flex items-center gap-2 text-sm">
                              <Euro className="h-4 w-4 text-muted-foreground" />
                              <span className="text-muted-foreground">Preço Base:</span>
                              <span className="font-semibold">€{request.basePrice}</span>
                            </div>
                          </div>
                          
                          {request.notes && (
                            <div className="space-y-1">
                              <span className="text-sm text-muted-foreground">Observações:</span>
                              <p className="text-sm">{request.notes}</p>
                            </div>
                          )}
                        </div>

                        {/* Workshop Responses */}
                        {request.respondedWorkshops && request.respondedWorkshops.length > 0 && (
                          <div className="pt-3 border-t space-y-3">
                            <div className="flex items-center gap-2 text-sm">
                              <CheckCircle className="h-4 w-4 text-green-600" />
                              <span className="font-semibold">
                                {request.status === 'approved' ? 'Oficina Selecionada' : 'Respostas das Oficinas'}
                              </span>
                              <Badge variant="secondary" className="ml-auto">
                                {request.respondedWorkshops.length} oficina{request.respondedWorkshops.length !== 1 ? 's' : ''}
                              </Badge>
                            </div>
                            <div className="space-y-2">
                              {request.respondedWorkshops.map((workshop) => {
                                const isSelected = request.selectedWorkshopId === workshop.workshopId
                                const isWorkshopChosen = request.selectedWorkshopId && request.selectedWorkshopId !== workshop.workshopId
                                const canSelect = request.status !== 'approved' && !isWorkshopChosen
                                
                                return (
                                  <div 
                                    key={workshop.workshopId} 
                                    className={`p-4 rounded-lg border-2 transition-all ${
                                      isSelected 
                                        ? 'bg-green-50 border-green-500 shadow-md' 
                                        : isWorkshopChosen
                                          ? 'bg-muted border-border opacity-50'
                                          : 'bg-muted border-border hover:border-primary/30'
                                    }`}
                                  >
                                    <div className="flex items-start gap-4">
                                      {/* Workshop Logo */}
                                      <div className="flex-shrink-0">
                                        {workshop.workshopLogo ? (
                                          <ImageWithFallback
                                            src={workshop.workshopLogo} 
                                            alt={workshop.workshopName}
                                            className="w-16 h-16 rounded-lg object-cover border border-border"
                                          />
                                        ) : (
                                          <div className="w-16 h-16 rounded-lg bg-primary/10 flex items-center justify-center border border-border">
                                            <Building2 className="h-8 w-8 text-primary/50" />
                                          </div>
                                        )}
                                      </div>
                                      
                                      {/* Workshop Info */}
                                      <div className="flex-1 min-w-0">
                                        <div className="flex items-start justify-between gap-3 mb-2">
                                          <div className="flex-1">
                                            <div className="flex items-center gap-2 mb-1">
                                              <h4 className="font-semibold">{workshop.workshopName}</h4>
                                              {isSelected && (
                                                <Badge className="bg-green-600">
                                                  <CheckCircle className="h-3 w-3 mr-1" />
                                                  Escolhida
                                                </Badge>
                                              )}
                                            </div>
                                            
                                            {/* Workshop Address */}
                                            {workshop.workshopAddress && (
                                              <div className="flex items-start gap-1 text-xs text-muted-foreground mb-1">
                                                <MapPin className="h-3 w-3 mt-0.5 flex-shrink-0" />
                                                <span>{workshop.workshopAddress}</span>
                                              </div>
                                            )}
                                            
                                            {/* Workshop Phone */}
                                            {workshop.workshopPhone && (
                                              <a 
                                                href={`tel:${workshop.workshopPhone}`}
                                                className="flex items-center gap-1 text-xs text-muted-foreground hover:text-primary mb-1 transition-colors"
                                              >
                                                <Phone className="h-3 w-3" />
                                                <span className="underline">{workshop.workshopPhone}</span>
                                              </a>
                                            )}
                                            
                                            <p className="text-xs text-muted-foreground mt-1">
                                              Respondido em {new Date(workshop.updatedAt).toLocaleDateString('pt-PT', {
                                                day: '2-digit',
                                                month: 'short',
                                                hour: '2-digit',
                                                minute: '2-digit'
                                              })}
                                            </p>
                                          </div>
                                          
                                          {/* Price and Action */}
                                          <div className="text-right flex-shrink-0">
                                            <div className="flex items-center gap-1 mb-2">
                                              <Euro className="h-4 w-4 text-green-600" />
                                              <span className="text-xl font-bold text-green-600">
                                                €{workshop.quotedPrice.toFixed(2)}
                                              </span>
                                            </div>
                                            {canSelect && !isSelected && (
                                              <Button
                                                size="sm"
                                                onClick={() => handleApproveWorkshop(request.id, workshop.workshopId, workshop.workshopName, request.serviceName)}
                                                disabled={approvingWorkshop !== null}
                                                className="bg-blue-600 hover:bg-blue-700"
                                              >
                                                {approvingWorkshop === workshop.workshopId ? (
                                                  'A escolher...'
                                                ) : (
                                                  <>
                                                    <CheckCircle className="h-3 w-3 mr-1" />
                                                    Escolher
                                                  </>
                                                )}
                                              </Button>
                                            )}
                                            {isWorkshopChosen && !isSelected && (
                                              <Badge variant="secondary" className="text-xs">
                                                Outra oficina selecionada
                                              </Badge>
                                            )}
                                          </div>
                                        </div>
                                      </div>
                                    </div>
                                  </div>
                                )
                              })}
                            </div>
                            
                            {request.status === 'approved' && request.approvedAt && (
                              <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                                <div className="flex items-center gap-2 text-sm text-green-800">
                                  <CheckCircle className="h-4 w-4" />
                                  <span className="font-semibold">
                                    Pedido aprovado em {new Date(request.approvedAt).toLocaleDateString('pt-PT', {
                                      day: '2-digit',
                                      month: 'long',
                                      year: 'numeric',
                                      hour: '2-digit',
                                      minute: '2-digit'
                                    })}
                                  </span>
                                </div>
                                <p className="text-xs text-green-700 mt-1">
                                  A oficina selecionada irá entrar em contacto consigo em breve.
                                </p>
                              </div>
                            )}
                          </div>
                        )}

                        <div className="pt-3 border-t">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2 text-xs text-muted-foreground">
                              <Clock className="h-3 w-3" />
                              <span>ID: {request.id.substring(0, 8)}</span>
                              {request.updatedAt && (
                                <>
                                  <span>•</span>
                                  <span>Atualizado: {new Date(request.updatedAt).toLocaleDateString('pt-PT')}</span>
                                </>
                              )}
                            </div>
                            <Button
                              variant="destructive"
                              size="sm"
                              onClick={() => handleCancelRequest(request.id)}
                              disabled={cancellingRequest === request.id}
                              className="bg-red-600 hover:bg-red-700"
                            >
                              {cancellingRequest === request.id ? (
                                'A cancelar...'
                              ) : (
                                <>
                                  <X className="h-3 w-3 mr-1" />
                                  Anular Pedido
                                </>
                              )}
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          </TabsContent>

          <TabsContent value="budgets">
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl">Orçamentos</h2>
                  <p className="text-muted-foreground">
                    Consulte e aprove os seus orçamentos
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  {pendingBudgetsCount > 0 && (
                    <Badge variant="default" className="bg-orange-500">
                      {pendingBudgetsCount} por aprovar
                    </Badge>
                  )}
                  <Badge variant="secondary">
                    {budgets.length} orçamento{budgets.length !== 1 ? 's' : ''}
                  </Badge>
                </div>
              </div>

              {loadingBudgets ? (
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {[1, 2, 3].map((i) => (
                    <Card key={i}>
                      <CardHeader>
                        <div className="h-6 w-48 bg-muted animate-pulse rounded" />
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-2">
                          <div className="h-4 w-full bg-muted animate-pulse rounded" />
                          <div className="h-4 w-2/3 bg-muted animate-pulse rounded" />
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : budgets.length === 0 ? (
                <Card>
                  <CardContent className="flex flex-col items-center justify-center py-12">
                    <Euro className="h-16 w-16 text-muted-foreground mb-4 opacity-50" />
                    <h3 className="text-lg mb-2">Nenhum orçamento disponível</h3>
                    <p className="text-sm text-muted-foreground text-center max-w-md">
                      Ainda não tem orçamentos associados à sua conta.
                    </p>
                  </CardContent>
                </Card>
              ) : (
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {budgets
                    .sort((a, b) => {
                      // Sort pending first, then by date
                      if (a.status === 'pending' && b.status !== 'pending') return -1
                      if (a.status !== 'pending' && b.status === 'pending') return 1
                      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
                    })
                    .map((budget) => {
                      const vehicle = vehicles.find(v => v.id === budget.vehicleId)
                      const isPending = budget.status === 'pending' || budget.status === 'draft'
                      const isApproved = budget.status === 'approved'
                      
                      return (
                        <Card key={budget.id} className={`hover:shadow-lg transition-all border-2 ${isPending ? 'border-orange-200 bg-orange-50/30' : ''}`}>
                          <CardHeader className="pb-3">
                            <div className="flex items-start justify-between gap-2 mb-2">
                              <div className="space-y-1">
                                <div className="text-xs font-mono text-muted-foreground">
                                  ORC #{budget.number}
                                </div>
                                <CardTitle className="text-lg">
                                  {vehicle?.brand} {vehicle?.model}
                                </CardTitle>
                              </div>
                              <Badge 
                                variant={isPending ? 'default' : isApproved ? 'default' : 'secondary'}
                                className={isPending ? 'bg-orange-500' : isApproved ? 'bg-green-500' : ''}
                              >
                                {isPending ? 'Pendente' : isApproved ? 'Aprovado' : budget.status}
                              </Badge>
                            </div>
                            {vehicle && (
                              <div className="flex items-center justify-center py-2">
                                <PortugueseLicensePlate 
                                  licensePlate={vehicle.licensePlate || 'AA-00-AA'} 
                                  size="sm"
                                />
                              </div>
                            )}
                          </CardHeader>
                          <CardContent className="space-y-3">
                            {/* Vehicle Image */}
                            {vehicle && (
                              <div className="bg-gradient-to-b from-slate-50 to-slate-100 rounded p-3 flex items-center justify-center">
                                <ImageWithFallback 
                                  src={getVehicleImageUrl(vehicle.brand, vehicle.model)}
                                  alt={`${vehicle.brand} ${vehicle.model}`}
                                  className="h-20 object-contain"
                                />
                              </div>
                            )}
                            
                            {/* Budget Details */}
                            <div className="space-y-2 text-sm">
                              {budget.items && budget.items.length > 0 && (
                                <div className="flex items-center gap-2 text-muted-foreground">
                                  <Package className="h-3 w-3" />
                                  <span>{budget.items.length} {budget.items.length === 1 ? 'item' : 'itens'}</span>
                                </div>
                              )}
                              {vehicle?.year && (
                                <div className="flex items-center gap-2 text-muted-foreground">
                                  <Calendar className="h-3 w-3" />
                                  <span>{vehicle.year}</span>
                                </div>
                              )}
                            </div>

                            <Separator />

                            {/* Total */}
                            <div className={`rounded-lg p-3 text-center ${isPending ? 'bg-gradient-to-r from-orange-600 to-amber-600' : 'bg-gradient-to-r from-blue-600 to-indigo-600'} text-white`}>
                              <div className="text-[10px] uppercase tracking-wide opacity-90 mb-1">
                                Total do Orçamento
                              </div>
                              <div className="flex items-baseline justify-center gap-1">
                                <div className="text-2xl font-bold">
                                  {(budget.total || budget.estimatedPrice || 0).toFixed(2)}
                                </div>
                                <div className="text-sm font-medium">€</div>
                              </div>
                            </div>

                            <Separator />

                            {/* Dates */}
                            <div className="text-xs text-muted-foreground space-y-1">
                              <div className="flex items-center gap-2">
                                <Clock className="h-3 w-3" />
                                <span>
                                  Criado: {new Date(budget.createdAt).toLocaleDateString('pt-PT', {
                                    day: '2-digit',
                                    month: 'short',
                                    year: 'numeric'
                                  })}
                                </span>
                              </div>
                            </div>

                            {/* Action Buttons */}
                            {isPending && (
                              <>
                                <Separator />
                                <Button
                                  onClick={() => handleApproveBudget(budget.id)}
                                  disabled={approvingBudget === budget.id}
                                  className="w-full bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white"
                                >
                                  {approvingBudget === budget.id ? (
                                    'A aprovar...'
                                  ) : (
                                    <>
                                      <CheckCircle className="h-4 w-4 mr-2" />
                                      Aprovar Orçamento
                                    </>
                                  )}
                                </Button>
                              </>
                            )}
                          </CardContent>
                        </Card>
                      )
                    })}
                </div>
              )}
            </div>
          </TabsContent>

          <TabsContent value="in-progress">
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl">Serviços em Execução</h2>
                  <p className="text-muted-foreground">
                    Acompanhe o estado dos seus serviços em curso
                  </p>
                </div>
                <Badge variant="secondary">
                  {workOrders.filter(wo => wo.status !== 'completed').length} serviço{workOrders.filter(wo => wo.status !== 'completed').length !== 1 ? 's' : ''}
                </Badge>
              </div>

              {loadingWorkOrders ? (
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {[1, 2, 3].map((i) => (
                    <Card key={i}>
                      <CardHeader>
                        <div className="h-6 w-48 bg-muted animate-pulse rounded" />
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-2">
                          <div className="h-4 w-full bg-muted animate-pulse rounded" />
                          <div className="h-4 w-2/3 bg-muted animate-pulse rounded" />
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : workOrders.filter(wo => wo.status !== 'completed').length === 0 ? (
                <Card>
                  <CardContent className="flex flex-col items-center justify-center py-12">
                    <PlayCircle className="h-16 w-16 text-muted-foreground mb-4 opacity-50" />
                    <h3 className="text-lg mb-2">Nenhum serviço em execução</h3>
                    <p className="text-sm text-muted-foreground text-center max-w-md">
                      Não tem serviços a decorrer neste momento.
                    </p>
                  </CardContent>
                </Card>
              ) : (
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {workOrders
                    .filter(wo => wo.status !== 'completed')
                    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
                    .map((workOrder) => {
                      const vehicle = vehicles.find(v => v.id === workOrder.vehicleId)
                      const serviceSheetStatus = serviceSheetStatuses.get(workOrder.id)
                      const total = workOrder.total || (workOrder.partsTotal || 0) + (workOrder.laborTotal || 0)
                      
                      return (
                        <Card key={workOrder.id} className="hover:shadow-lg transition-all border-2">
                          <CardHeader className="pb-3">
                            <div className="flex items-start justify-between gap-2 mb-2">
                              <div className="space-y-1">
                                <div className="text-xs font-mono text-muted-foreground">
                                  FO #{workOrder.number}
                                </div>
                                <CardTitle className="text-lg">
                                  {vehicle?.brand} {vehicle?.model}
                                </CardTitle>
                              </div>
                            </div>
                            <div className="flex items-center justify-center py-2">
                              <PortugueseLicensePlate 
                                licensePlate={vehicle?.licensePlate || 'AA-00-AA'} 
                                size="sm"
                              />
                            </div>
                          </CardHeader>
                          <CardContent className="space-y-3">
                            {/* Vehicle Image */}
                            <div className="bg-gradient-to-b from-slate-50 to-slate-100 rounded p-3 flex items-center justify-center">
                              <ImageWithFallback 
                                src={vehicle ? getVehicleImageUrl(vehicle.brand, vehicle.model) : "https://images.unsplash.com/photo-1601815731648-7221909cdb00?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxjYXIlMjB2ZWhpY2xlJTIwc2lkZXxlbnwxfHx8fDE3NjE2MDEwNTB8MA&ixlib=rb-4.1.0&q=80&w=1080"}
                                alt={vehicle ? `${vehicle.brand} ${vehicle.model}` : 'Vehicle'}
                                className="h-20 object-contain"
                              />
                            </div>
                            
                            {/* Vehicle Info */}
                            <div className="space-y-1 text-sm">
                              {vehicle?.year && (
                                <div className="flex items-center gap-2 text-muted-foreground">
                                  <Calendar className="h-3 w-3" />
                                  <span>{vehicle.year}</span>
                                </div>
                              )}
                              {vehicle?.color && (
                                <div className="flex items-center gap-2 text-muted-foreground">
                                  <span className="text-xs">Cor: {vehicle.color}</span>
                                </div>
                              )}
                            </div>

                            <Separator />

                            {/* Total */}
                            <div className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg p-3 text-center">
                              <div className="text-[10px] uppercase tracking-wide opacity-90 mb-1">
                                Total do Serviço
                              </div>
                              <div className="flex items-baseline justify-center gap-1">
                                <div className="text-2xl font-bold">{total.toFixed(2)}</div>
                                <div className="text-sm font-medium">€</div>
                              </div>
                            </div>

                            {/* Status Badges */}
                            <div className="space-y-2">
                              {serviceSheetStatus && (
                                <>
                                  <div className="flex items-center justify-between text-xs">
                                    <span className="text-muted-foreground">Fluxo da Obra:</span>
                                    {getServiceSheetStatusBadge(serviceSheetStatus.status)}
                                  </div>
                                  
                                  {/* Estimated Completion */}
                                  {(() => {
                                    const history = statusHistory.get(workOrder.id) || []
                                    const estimate = getEstimatedCompletion(serviceSheetStatus.status, history)
                                    if (estimate && serviceSheetStatus.status !== 'completed' && serviceSheetStatus.status !== 'cancelled') {
                                      return (
                                        <div className="flex items-center justify-between text-xs">
                                          <span className="text-muted-foreground">Tempo estimado:</span>
                                          <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                                            <Clock className="h-3 w-3 mr-1" />
                                            {estimate}
                                          </Badge>
                                        </div>
                                      )
                                    }
                                    return null
                                  })()}
                                </>
                              )}
                            </div>
                            
                            {/* View Items Button */}
                            {workOrder.items && workOrder.items.length > 0 && (
                              <>
                                <Separator />
                                <Dialog>
                                  <DialogTrigger asChild>
                                    <Button variant="outline" size="sm" className="w-full">
                                      <Package className="h-3 w-3 mr-2" />
                                      Ver Artigos/Serviços ({workOrder.items.length})
                                    </Button>
                                  </DialogTrigger>
                                  <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
                                    <DialogHeader>
                                      <DialogTitle>Artigos e Serviços - FO #{workOrder.number}</DialogTitle>
                                      <DialogDescription>
                                        {vehicle?.brand} {vehicle?.model} • {vehicle?.licensePlate}
                                      </DialogDescription>
                                    </DialogHeader>
                                    
                                    <div className="space-y-4 mt-4">
                                      <div className="flex items-center gap-2 text-sm text-muted-foreground mb-4">
                                        <Package className="h-4 w-4" />
                                        <span>{workOrder.items.length} {workOrder.items.length === 1 ? 'item' : 'itens'}</span>
                                      </div>
                                      
                                      {/* Items List */}
                                      <div className="space-y-3">
                                        {workOrder.items.map((item: any, index: number) => (
                                          <div key={index} className="border rounded-lg p-4 bg-muted/30">
                                            <div className="flex items-start justify-between gap-4">
                                              <div className="flex-1 space-y-2">
                                                <div className="flex items-start justify-between">
                                                  <div>
                                                    <h4 className="font-semibold text-sm">{item.description || 'Sem descrição'}</h4>
                                                    {item.partNumber && (
                                                      <p className="text-xs text-muted-foreground font-mono">
                                                        Ref: {item.partNumber}
                                                      </p>
                                                    )}
                                                  </div>
                                                </div>
                                                
                                                <div className="grid grid-cols-3 gap-4 text-sm">
                                                  <div>
                                                    <p className="text-xs text-muted-foreground">Quantidade</p>
                                                    <p className="font-semibold">{item.quantity || 1}</p>
                                                  </div>
                                                  <div>
                                                    <p className="text-xs text-muted-foreground">Preço Unit.</p>
                                                    <p className="font-semibold">€{(item.price || 0).toFixed(2)}</p>
                                                  </div>
                                                  <div>
                                                    <p className="text-xs text-muted-foreground">Total</p>
                                                    <p className="font-semibold text-blue-600">
                                                      €{((item.quantity || 1) * (item.price || 0)).toFixed(2)}
                                                    </p>
                                                  </div>
                                                </div>
                                              </div>
                                            </div>
                                          </div>
                                        ))}
                                      </div>
                                      
                                      {/* Labor */}
                                      {workOrder.laborHours && workOrder.laborHours > 0 && (
                                        <>
                                          <Separator />
                                          <div className="border rounded-lg p-4 bg-blue-50/50">
                                            <div className="flex items-start justify-between gap-4">
                                              <div className="flex-1 space-y-2">
                                                <div className="flex items-center gap-2">
                                                  <Wrench className="h-4 w-4 text-blue-600" />
                                                  <h4 className="font-semibold text-sm">Mão de Obra</h4>
                                                </div>
                                                
                                                <div className="grid grid-cols-3 gap-4 text-sm">
                                                  <div>
                                                    <p className="text-xs text-muted-foreground">Horas</p>
                                                    <p className="font-semibold">{workOrder.laborHours}h</p>
                                                  </div>
                                                  <div>
                                                    <p className="text-xs text-muted-foreground">Taxa/Hora</p>
                                                    <p className="font-semibold">€{(workOrder.laborRate || 0).toFixed(2)}</p>
                                                  </div>
                                                  <div>
                                                    <p className="text-xs text-muted-foreground">Total</p>
                                                    <p className="font-semibold text-blue-600">
                                                      €{((workOrder.laborHours || 0) * (workOrder.laborRate || 0)).toFixed(2)}
                                                    </p>
                                                  </div>
                                                </div>
                                              </div>
                                            </div>
                                          </div>
                                        </>
                                      )}
                                      
                                      {/* Totals Summary */}
                                      <Separator />
                                      <div className="space-y-2 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg p-4">
                                        <div className="flex items-center justify-between text-sm">
                                          <span className="text-muted-foreground">Subtotal (Artigos)</span>
                                          <span className="font-semibold">€{(workOrder.partsTotal || 0).toFixed(2)}</span>
                                        </div>
                                        {workOrder.laborTotal && workOrder.laborTotal > 0 && (
                                          <div className="flex items-center justify-between text-sm">
                                            <span className="text-muted-foreground">Subtotal (Mão de Obra)</span>
                                            <span className="font-semibold">€{(workOrder.laborTotal || 0).toFixed(2)}</span>
                                          </div>
                                        )}
                                        {workOrder.tax && workOrder.tax > 0 && (
                                          <div className="flex items-center justify-between text-sm">
                                            <span className="text-muted-foreground">IVA (23%)</span>
                                            <span className="font-semibold">€{(workOrder.tax || 0).toFixed(2)}</span>
                                          </div>
                                        )}
                                        <Separator />
                                        <div className="flex items-center justify-between">
                                          <span className="font-semibold">Total</span>
                                          <span className="text-xl font-bold text-blue-600">
                                            €{total.toFixed(2)}
                                          </span>
                                        </div>
                                      </div>
                                    </div>
                                  </DialogContent>
                                </Dialog>
                              </>
                            )}
                            
                            {/* Timeline Visual */}
                            {serviceSheetStatus && statusHistory.get(workOrder.id) && statusHistory.get(workOrder.id)!.length > 0 && (
                              <>
                                <Separator />
                                <Dialog>
                                  <DialogTrigger asChild>
                                    <Button variant="outline" size="sm" className="w-full">
                                      <History className="h-3 w-3 mr-2" />
                                      Ver Histórico Completo
                                    </Button>
                                  </DialogTrigger>
                                  <DialogContent className="max-w-2xl">
                                    <DialogHeader>
                                      <DialogTitle>Histórico do Serviço - FO #{workOrder.number}</DialogTitle>
                                      <DialogDescription>
                                        {vehicle?.brand} {vehicle?.model} • {vehicle?.licensePlate}
                                      </DialogDescription>
                                    </DialogHeader>
                                    
                                    {/* Timeline */}
                                    <div className="space-y-4 mt-4">
                                      <div className="flex items-center gap-2 text-sm text-muted-foreground mb-4">
                                        <History className="h-4 w-4" />
                                        <span>{statusHistory.get(workOrder.id)!.length} mudanças de estado</span>
                                      </div>
                                      
                                      <div className="relative">
                                        {/* Timeline Line */}
                                        <div className="absolute left-[15px] top-[20px] bottom-[20px] w-0.5 bg-gradient-to-b from-blue-200 via-purple-200 to-green-200" />
                                        
                                        {/* Timeline Items */}
                                        <div className="space-y-6">
                                          {statusHistory.get(workOrder.id)!
                                            .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
                                            .map((entry, index) => (
                                              <div key={entry.id} className="relative flex gap-4 items-start">
                                                {/* Timeline Dot */}
                                                <div className="relative z-10 flex-shrink-0">
                                                  <div className="h-8 w-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center shadow-lg">
                                                    <History className="h-4 w-4 text-white" />
                                                  </div>
                                                </div>
                                                
                                                {/* Content */}
                                                <div className="flex-1 pt-0.5">
                                                  <div className="bg-white rounded-lg border-2 border-slate-100 p-4 shadow-sm hover:shadow-md transition-shadow">
                                                    <div className="flex items-start justify-between gap-2 mb-2">
                                                      <div className="flex-1">
                                                        <div className="flex items-center gap-2 mb-1">
                                                          <span className="text-sm text-muted-foreground">De:</span>
                                                          {getServiceSheetStatusBadge(entry.oldStatus)}
                                                          <span className="text-muted-foreground">→</span>
                                                          {getServiceSheetStatusBadge(entry.newStatus)}
                                                        </div>
                                                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                                          <Clock className="h-3 w-3" />
                                                          <span>{formatTimestamp(entry.timestamp)}</span>
                                                          <span className="text-muted-foreground/50">•</span>
                                                          <span>
                                                            {new Date(entry.timestamp).toLocaleDateString('pt-PT', {
                                                              day: '2-digit',
                                                              month: 'long',
                                                              year: 'numeric',
                                                              hour: '2-digit',
                                                              minute: '2-digit'
                                                            })}
                                                          </span>
                                                        </div>
                                                      </div>
                                                    </div>
                                                  </div>
                                                </div>
                                              </div>
                                            ))}
                                        </div>
                                      </div>
                                    </div>
                                  </DialogContent>
                                </Dialog>
                              </>
                            )}

                            <Separator />

                            {/* Dates */}
                            <div className="text-xs text-muted-foreground space-y-1">
                              <div className="flex items-center gap-2">
                                <Clock className="h-3 w-3" />
                                <span>
                                  Criado: {new Date(workOrder.createdAt).toLocaleDateString('pt-PT', {
                                    day: '2-digit',
                                    month: 'short',
                                    year: 'numeric'
                                  })}
                                </span>
                              </div>
                              {workOrder.startedAt && (
                                <div className="flex items-center gap-2">
                                  <PlayCircle className="h-3 w-3" />
                                  <span>
                                    Iniciado: {new Date(workOrder.startedAt).toLocaleDateString('pt-PT', {
                                      day: '2-digit',
                                      month: 'short'
                                    })}
                                  </span>
                                </div>
                              )}
                            </div>

                            {workOrder.notes && (
                              <>
                                <Separator />
                                <div className="text-xs">
                                  <span className="text-muted-foreground">Notas:</span>
                                  <p className="mt-1 text-foreground">{workOrder.notes}</p>
                                </div>
                              </>
                            )}
                          </CardContent>
                        </Card>
                      )
                    })}
                </div>
              )}
            </div>
          </TabsContent>

          <TabsContent value="completed">
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl">Serviços Terminados</h2>
                  <p className="text-muted-foreground">
                    Histórico dos seus serviços concluídos
                  </p>
                </div>
                <Badge variant="secondary" className="bg-green-100 text-green-800">
                  {workOrders.filter(wo => wo.status === 'completed').length} serviço{workOrders.filter(wo => wo.status === 'completed').length !== 1 ? 's' : ''}
                </Badge>
              </div>

              {loadingWorkOrders ? (
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {[1, 2, 3].map((i) => (
                    <Card key={i}>
                      <CardHeader>
                        <div className="h-6 w-48 bg-muted animate-pulse rounded" />
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-2">
                          <div className="h-4 w-full bg-muted animate-pulse rounded" />
                          <div className="h-4 w-2/3 bg-muted animate-pulse rounded" />
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : workOrders.filter(wo => wo.status === 'completed').length === 0 ? (
                <Card>
                  <CardContent className="flex flex-col items-center justify-center py-12">
                    <CheckCircle2 className="h-16 w-16 text-muted-foreground mb-4 opacity-50" />
                    <h3 className="text-lg mb-2">Nenhum serviço terminado</h3>
                    <p className="text-sm text-muted-foreground text-center max-w-md">
                      Ainda não tem serviços concluídos.
                    </p>
                  </CardContent>
                </Card>
              ) : (
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {workOrders
                    .filter(wo => wo.status === 'completed')
                    .sort((a, b) => {
                      const dateA = new Date(a.completedAt || a.createdAt).getTime()
                      const dateB = new Date(b.completedAt || b.createdAt).getTime()
                      return dateB - dateA
                    })
                    .map((workOrder) => {
                      const vehicle = vehicles.find(v => v.id === workOrder.vehicleId)
                      const serviceSheetStatus = serviceSheetStatuses.get(workOrder.id)
                      const total = workOrder.total || (workOrder.partsTotal || 0) + (workOrder.laborTotal || 0)
                      
                      return (
                        <Card key={workOrder.id} className="hover:shadow-lg transition-all border-2 border-green-200 bg-gradient-to-br from-white to-green-50/20">
                          <CardHeader className="pb-3">
                            <div className="flex items-start justify-between gap-2 mb-2">
                              <div className="space-y-1">
                                <div className="text-xs font-mono text-muted-foreground">
                                  FO #{workOrder.number}
                                </div>
                                <CardTitle className="text-lg">
                                  {vehicle?.brand} {vehicle?.model}
                                </CardTitle>
                              </div>
                              <Badge className="bg-green-600">
                                <CheckCircle2 className="h-3 w-3 mr-1" />
                                Concluído
                              </Badge>
                            </div>
                            <div className="flex items-center justify-center py-2">
                              <PortugueseLicensePlate 
                                licensePlate={vehicle?.licensePlate || 'AA-00-AA'} 
                                size="sm"
                              />
                            </div>
                          </CardHeader>
                          <CardContent className="space-y-3">
                            {/* Vehicle Image */}
                            <div className="bg-gradient-to-b from-slate-50 to-slate-100 rounded p-3 flex items-center justify-center">
                              <ImageWithFallback 
                                src={vehicle ? getVehicleImageUrl(vehicle.brand, vehicle.model) : "https://images.unsplash.com/photo-1601815731648-7221909cdb00?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxjYXIlMjB2ZWhpY2xlJTIwc2lkZXxlbnwxfHx8fDE3NjE2MDEwNTB8MA&ixlib=rb-4.1.0&q=80&w=1080"}
                                alt={vehicle ? `${vehicle.brand} ${vehicle.model}` : 'Vehicle'}
                                className="h-20 object-contain"
                              />
                            </div>
                            
                            {/* Vehicle Info */}
                            <div className="space-y-1 text-sm">
                              {vehicle?.year && (
                                <div className="flex items-center gap-2 text-muted-foreground">
                                  <Calendar className="h-3 w-3" />
                                  <span>{vehicle.year}</span>
                                </div>
                              )}
                              {vehicle?.color && (
                                <div className="flex items-center gap-2 text-muted-foreground">
                                  <span className="text-xs">Cor: {vehicle.color}</span>
                                </div>
                              )}
                            </div>

                            <Separator />

                            {/* Total */}
                            <div className="bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-lg p-3 text-center">
                              <div className="text-[10px] uppercase tracking-wide opacity-90 mb-1">
                                Total do Serviço
                              </div>
                              <div className="flex items-baseline justify-center gap-1">
                                <div className="text-2xl font-bold">{total.toFixed(2)}</div>
                                <div className="text-sm font-medium">€</div>
                              </div>
                            </div>

                            {/* Service Sheet Status */}
                            {serviceSheetStatus && (
                              <>
                                <Separator />
                                <div className="flex items-center justify-between text-xs">
                                  <span className="text-muted-foreground">Estado Final:</span>
                                  {getServiceSheetStatusBadge(serviceSheetStatus.status)}
                                </div>
                              </>
                            )}

                            <Separator />

                            {/* Dates */}
                            <div className="text-xs text-muted-foreground space-y-1">
                              <div className="flex items-center gap-2">
                                <Calendar className="h-3 w-3" />
                                <span>
                                  Criado: {new Date(workOrder.createdAt).toLocaleDateString('pt-PT', {
                                    day: '2-digit',
                                    month: 'short',
                                    year: 'numeric'
                                  })}
                                </span>
                              </div>
                              {workOrder.completedAt && (
                                <div className="flex items-center gap-2">
                                  <CheckCircle2 className="h-3 w-3 text-green-600" />
                                  <span className="text-green-700 font-medium">
                                    Concluído: {new Date(workOrder.completedAt).toLocaleDateString('pt-PT', {
                                      day: '2-digit',
                                      month: 'short',
                                      year: 'numeric'
                                    })}
                                  </span>
                                </div>
                              )}
                            </div>

                            {workOrder.notes && (
                              <>
                                <Separator />
                                <div className="text-xs">
                                  <span className="text-muted-foreground">Notas:</span>
                                  <p className="mt-1 text-foreground">{workOrder.notes}</p>
                                </div>
                              </>
                            )}
                          </CardContent>
                        </Card>
                      )
                    })}
                </div>
              )}
            </div>
          </TabsContent>

          <TabsContent value="messages">
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl">Mensagens</h2>
                  <p className="text-muted-foreground">
                    Conversas com as oficinas sobre os seus serviços
                  </p>
                </div>
                <Badge variant="secondary">
                  {messageThreads.length} conversa{messageThreads.length !== 1 ? 's' : ''}
                </Badge>
              </div>

              {messageThreads.length === 0 ? (
                <Card>
                  <CardContent className="flex flex-col items-center justify-center py-12">
                    <MessageSquare className="h-16 w-16 text-muted-foreground/20 mb-4" />
                    <h3 className="text-lg font-semibold mb-2">Sem mensagens</h3>
                    <p className="text-muted-foreground text-center">
                      Ainda não tem conversas com oficinas.
                    </p>
                  </CardContent>
                </Card>
              ) : (
                <div className="grid gap-4">
                  {messageThreads.map((thread) => (
                    <Card key={thread.workOrderId} className="overflow-hidden">
                      <CardHeader className="bg-gradient-to-r from-blue-50 to-orange-50/30">
                        <div className="flex items-center justify-between">
                          <CardTitle className="text-lg flex items-center gap-2">
                            <FileText className="h-5 w-5 text-blue-600" />
                            FO #{thread.workOrderNumber}
                          </CardTitle>
                          {thread.unreadCount > 0 && (
                            <Badge variant="destructive" className="animate-pulse">
                              {thread.unreadCount} nova{thread.unreadCount !== 1 ? 's' : ''}
                            </Badge>
                          )}
                        </div>
                        <CardDescription>
                          Última mensagem: {formatTimestamp(thread.lastMessage.timestamp)}
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="p-0">
                        {/* Messages List */}
                        <div 
                          ref={(el) => messageContainerRefs.current.set(thread.workOrderId, el)}
                          className="max-h-96 overflow-y-auto p-4 space-y-3"
                        >
                          {thread.messages.map((msg: any) => (
                            <div
                              key={msg.id}
                              className={`flex ${msg.from === 'client' ? 'justify-end' : 'justify-start'}`}
                            >
                              <div
                                className={`max-w-[70%] rounded-lg p-3 ${
                                  msg.from === 'client'
                                    ? 'bg-blue-600 text-white'
                                    : msg.read
                                    ? 'bg-gray-100'
                                    : 'bg-orange-50 border-2 border-orange-200'
                                }`}
                                onClick={() => {
                                  if (msg.from === 'workshop' && !msg.read) {
                                    markThreadAsRead(thread.workOrderId)
                                  }
                                }}
                              >
                                <div className="flex items-start gap-2 mb-1">
                                  {msg.from === 'workshop' ? (
                                    <Building2 className="h-4 w-4 mt-0.5 flex-shrink-0" />
                                  ) : (
                                    <User className="h-4 w-4 mt-0.5 flex-shrink-0" />
                                  )}
                                  <div className="flex-1">
                                    <p className="text-xs font-semibold mb-1">
                                      {msg.from === 'workshop' ? (workshopNames.get(msg.workshopId) || 'Oficina') : 'Você'}
                                    </p>
                                    <p className="text-sm whitespace-pre-wrap break-words">{msg.message}</p>
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
                                    <div className="flex items-center gap-1 mt-1">
                                      <p className={`text-xs ${msg.from === 'client' ? 'text-blue-100' : 'text-muted-foreground'}`}>
                                        {formatTimestamp(msg.timestamp)}
                                      </p>
                                      {msg.from === 'client' && (
                                        <span className="flex items-center ml-1">
                                          {msg.read ? (
                                            <CheckCheck className="h-3 w-3 text-green-500" title="Lido pela oficina" />
                                          ) : (
                                            <Check className="h-3 w-3 text-blue-100" title="Enviado" />
                                          )}
                                        </span>
                                      )}
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>

                        {/* Message Input */}
                        <div className="border-t p-4 bg-gray-50">
                          <form
                            onSubmit={(e) => {
                              e.preventDefault()
                              if (selectedThread === thread.workOrderId && newMessage.trim()) {
                                sendMessage(thread.workOrderId, newMessage)
                              }
                            }}
                            className="flex gap-2"
                          >
                            <Input
                              placeholder="Digite sua mensagem..."
                              value={selectedThread === thread.workOrderId ? newMessage : ''}
                              onChange={(e) => {
                                setSelectedThread(thread.workOrderId)
                                setNewMessage(e.target.value)
                              }}
                              onFocus={() => {
                                setSelectedThread(thread.workOrderId)
                                if (thread.unreadCount > 0) {
                                  markThreadAsRead(thread.workOrderId)
                                }
                                // Scroll to bottom when focusing input
                                setTimeout(() => {
                                  const container = messageContainerRefs.current.get(thread.workOrderId)
                                  if (container) {
                                    container.scrollTop = container.scrollHeight
                                  }
                                }, 100)
                              }}
                              className="flex-1"
                            />
                            <Button 
                              type="submit" 
                              size="icon"
                              disabled={!newMessage.trim() || selectedThread !== thread.workOrderId}
                            >
                              <Send className="h-4 w-4" />
                            </Button>
                          </form>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          </TabsContent>

          <TabsContent value="appointments">
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl">Meus Agendamentos</h2>
                  <p className="text-muted-foreground">
                    Visualize e gerencie seus agendamentos confirmados
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <Badge variant="secondary">
                    {appointments.length} agendamento{appointments.length !== 1 ? 's' : ''}
                  </Badge>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={fetchAppointments}
                    disabled={loadingAppointments}
                  >
                    <Clock className={`h-4 w-4 mr-2 ${loadingAppointments ? 'animate-spin' : ''}`} />
                    Atualizar
                  </Button>
                </div>
              </div>

              {loadingAppointments ? (
                <div className="text-center py-12">
                  <Clock className="h-12 w-12 mx-auto mb-4 animate-spin text-muted-foreground" />
                  <p className="text-muted-foreground">A carregar agendamentos...</p>
                </div>
              ) : appointments.length === 0 ? (
                <Card>
                  <CardContent className="py-12 text-center">
                    <Calendar className="h-16 w-16 mx-auto mb-4 text-muted-foreground opacity-20" />
                    <h3 className="font-semibold text-lg mb-2">Nenhum agendamento</h3>
                    <p className="text-muted-foreground">
                      Você ainda não tem agendamentos confirmados
                    </p>
                  </CardContent>
                </Card>
              ) : (
                <div className="grid lg:grid-cols-2 gap-4">
                  {appointments.map((appointment) => (
                    <Card key={appointment.id} className="overflow-hidden hover:shadow-lg transition-shadow">
                      <CardHeader className="bg-gradient-to-r from-blue-50 to-orange-50 pb-3">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <CardTitle className="flex items-center gap-2 text-base">
                              <Wrench className="h-4 w-4 text-blue-600" />
                              {appointment.serviceName}
                            </CardTitle>
                            <CardDescription className="flex items-center gap-1 mt-1 text-xs">
                              <Building2 className="h-3 w-3" />
                              {appointment.workshopName || 'Oficina'}
                            </CardDescription>
                          </div>
                          {appointment.status === 'scheduled' && (
                            <Badge className="bg-blue-600 text-xs">
                              <Calendar className="h-3 w-3 mr-1" />
                              Agendado
                            </Badge>
                          )}
                          {appointment.status === 'confirmed' && (
                            <Badge className="bg-green-600 text-xs">
                              <CheckCircle className="h-3 w-3 mr-1" />
                              Confirmado
                            </Badge>
                          )}
                          {appointment.status === 'rescheduled' && (
                            <Badge className="bg-orange-600 text-xs">
                              <Clock className="h-3 w-3 mr-1" />
                              Reagendado
                            </Badge>
                          )}
                          {appointment.status === 'pending_reschedule' && (
                            <Badge className="bg-yellow-600 text-xs">
                              <AlertCircle className="h-3 w-3 mr-1" />
                              Reagendamento Pendente
                            </Badge>
                          )}
                        </div>
                      </CardHeader>
                      <CardContent className="pt-4 space-y-3">
                        {/* Date and Time - Compact */}
                        <div className="flex items-center gap-4 text-sm">
                          <div className="flex items-center gap-2">
                            <Calendar className="h-4 w-4 text-blue-600" />
                            <span className="font-semibold">
                              {new Date(appointment.confirmedDate || appointment.date).toLocaleDateString('pt-PT', {
                                day: '2-digit',
                                month: 'short'
                              })}
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Clock className="h-4 w-4 text-orange-600" />
                            <span className="font-semibold">{appointment.confirmedTime || appointment.startTime}</span>
                          </div>
                          {appointment.licensePlate && (
                            <>
                              <span className="text-gray-300">•</span>
                              <div className="flex items-center gap-1">
                                <Car className="h-4 w-4 text-gray-600" />
                                <span className="font-semibold">{appointment.licensePlate}</span>
                              </div>
                            </>
                          )}
                        </div>

                        {/* Reschedule Request Info - Compact */}
                        {appointment.rescheduleRequest && (
                          <div className="p-2 bg-yellow-50 border border-yellow-200 rounded text-xs">
                            <p className="text-yellow-800 font-semibold">
                              ⏳ Reagendamento Solicitado: {new Date(appointment.rescheduleRequest.requestedDate).toLocaleDateString('pt-PT')} às {appointment.rescheduleRequest.requestedTime}
                            </p>
                          </div>
                        )}

                        {/* Actions */}
                        <div className="flex items-center gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setSelectedAppointment(appointment)
                              setShowRescheduleDialog(true)
                            }}
                            className="flex-1"
                          >
                            <FileText className="h-4 w-4 mr-2" />
                            Ver Detalhes
                          </Button>
                          {(appointment.status === 'scheduled' || appointment.status === 'confirmed') && !appointment.rescheduleRequest && (
                            <Button
                              variant="default"
                              size="sm"
                              onClick={() => handleRequestReschedule(appointment)}
                              className="flex-1 bg-gradient-to-r from-blue-600 to-orange-500"
                            >
                              <Clock className="h-4 w-4 mr-2" />
                              Reagendar
                            </Button>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          </TabsContent>

          <TabsContent value="profile">
            <div className="max-w-2xl">
              <Card>
                <CardHeader>
                  <CardTitle>Dados do Perfil</CardTitle>
                  <CardDescription>
                    Atualize as suas informações pessoais
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleUpdateProfile} className="space-y-6">
                    {/* Dados Pessoais */}
                    <div className="space-y-4">
                      <div className="flex items-center gap-2">
                        <User className="h-4 w-4 text-muted-foreground" />
                        <h4 className="font-medium">Dados Pessoais</h4>
                      </div>
                      <div className="grid grid-cols-1 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="name">Nome Completo *</Label>
                          <Input
                            id="name"
                            type="text"
                            value={profileData.name}
                            onChange={(e) => setProfileData({...profileData, name: e.target.value})}
                            disabled={updatingProfile}
                            required
                            placeholder="Nome completo"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="clientType">Tipo de Cliente</Label>
                          <Select 
                            value={profileData.clientType} 
                            onValueChange={(value) => setProfileData({...profileData, clientType: value})}
                            disabled={updatingProfile}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Tipo" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="particular">Particular</SelectItem>
                              <SelectItem value="empresa">Empresa</SelectItem>
                              <SelectItem value="profissional">Profissional Liberal</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                    </div>

                    <Separator />

                    {/* Morada */}
                    <div className="space-y-4">
                      <div className="flex items-center gap-2">
                        <MapPin className="h-4 w-4 text-muted-foreground" />
                        <h4 className="font-medium">Morada</h4>
                      </div>
                      <div className="grid grid-cols-1 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="address">Morada</Label>
                          <Input
                            id="address"
                            value={profileData.address}
                            onChange={(e) => setProfileData({...profileData, address: e.target.value})}
                            disabled={updatingProfile}
                            placeholder="Rua, Nº, Andar"
                          />
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          <div className="space-y-2">
                            <Label>Código Postal</Label>
                            <div className="flex gap-2 items-center">
                              <Input
                                placeholder="0000"
                                maxLength={4}
                                className="w-20"
                                value={profileData.cp4}
                                onChange={(e) => {
                                  const value = e.target.value.replace(/\D/g, '')
                                  setProfileData({...profileData, cp4: value})
                                  const newPostalCode = value && profileData.cp3 ? `${value}-${profileData.cp3}` : ''
                                  setPostalCode(newPostalCode)
                                }}
                                disabled={updatingProfile}
                              />
                              <span className="text-muted-foreground">-</span>
                              <Input
                                placeholder="000"
                                maxLength={3}
                                className="w-16"
                                value={profileData.cp3}
                                onChange={(e) => {
                                  const value = e.target.value.replace(/\D/g, '')
                                  setProfileData({...profileData, cp3: value})
                                  const newPostalCode = profileData.cp4 && value ? `${profileData.cp4}-${value}` : ''
                                  setPostalCode(newPostalCode)
                                }}
                                disabled={updatingProfile}
                              />
                            </div>
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="locality">Localidade</Label>
                            <Input
                              id="locality"
                              value={profileData.locality}
                              onChange={(e) => setProfileData({...profileData, locality: e.target.value})}
                              disabled={updatingProfile}
                              placeholder="Cidade"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="country">País</Label>
                            <Input
                              id="country"
                              value={profileData.country}
                              onChange={(e) => setProfileData({...profileData, country: e.target.value})}
                              disabled={updatingProfile}
                              placeholder="Portugal"
                            />
                          </div>
                        </div>
                      </div>
                    </div>

                    <Separator />

                    {/* Dados Fiscais */}
                    <div className="space-y-4">
                      <div className="flex items-center gap-2">
                        <Building2 className="h-4 w-4 text-muted-foreground" />
                        <h4 className="font-medium">Dados Fiscais</h4>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="nif">NIF</Label>
                          <Input
                            id="nif"
                            value={profileData.nif}
                            onChange={(e) => setProfileData({...profileData, nif: e.target.value})}
                            disabled={updatingProfile}
                            placeholder="000000000"
                            maxLength={9}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="vatRegime">Regime de IVA</Label>
                          <Select 
                            value={profileData.vatRegime} 
                            onValueChange={(value) => setProfileData({...profileData, vatRegime: value})}
                            disabled={updatingProfile}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Selecione o regime" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="normal">Normal</SelectItem>
                              <SelectItem value="isento">Isento</SelectItem>
                              <SelectItem value="regime-caixa">Regime de Caixa</SelectItem>
                              <SelectItem value="consumidor-final">Consumidor Final</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                    </div>

                    <Separator />

                    {/* Contactos */}
                    <div className="space-y-4">
                      <div className="flex items-center gap-2">
                        <Phone className="h-4 w-4 text-muted-foreground" />
                        <h4 className="font-medium">Contactos</h4>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="email1">E-mail Principal</Label>
                          <Input
                            id="email1"
                            type="email"
                            value={profileData.email1}
                            disabled
                            className="bg-muted"
                          />
                          <p className="text-xs text-muted-foreground">
                            O email principal não pode ser alterado
                          </p>
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="email2">E-mail Secundário</Label>
                          <Input
                            id="email2"
                            type="email"
                            value={profileData.email2}
                            onChange={(e) => setProfileData({...profileData, email2: e.target.value})}
                            disabled={updatingProfile}
                            placeholder="email2@exemplo.pt"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="phone1">Telefone 1 *</Label>
                          <Input
                            id="phone1"
                            type="tel"
                            value={profileData.phone1}
                            onChange={(e) => setProfileData({...profileData, phone1: e.target.value})}
                            disabled={updatingProfile}
                            required
                            placeholder="+351 000 000 000"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="phone2">Telefone 2</Label>
                          <Input
                            id="phone2"
                            type="tel"
                            value={profileData.phone2}
                            onChange={(e) => setProfileData({...profileData, phone2: e.target.value})}
                            disabled={updatingProfile}
                            placeholder="+351 000 000 000"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="phone3">Telefone 3</Label>
                          <Input
                            id="phone3"
                            type="tel"
                            value={profileData.phone3}
                            onChange={(e) => setProfileData({...profileData, phone3: e.target.value})}
                            disabled={updatingProfile}
                            placeholder="+351 000 000 000"
                          />
                        </div>
                      </div>
                    </div>

                    <Button type="submit" disabled={updatingProfile} className="w-full">
                      {updatingProfile ? 'A atualizar...' : 'Guardar Alterações'}
                    </Button>
                  </form>
                </CardContent>
              </Card>

              <Card className="mt-6 border-destructive/50">
                <CardHeader>
                  <CardTitle className="text-destructive">Zona de Perigo</CardTitle>
                  <CardDescription>
                    Ações irreversíveis da conta
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Button variant="destructive" onClick={onLogout}>
                    <LogOut className="h-4 w-4 mr-2" />
                    Terminar Sessão
                  </Button>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </main>
      
      {/* Cancel Request Confirmation Dialog */}
      <Dialog open={showCancelDialog} onOpenChange={setShowCancelDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-600">
              <AlertCircle className="h-5 w-5" />
              Confirmar Cancelamento
            </DialogTitle>
            <DialogDescription>
              Tem a certeza que pretende cancelar este pedido?
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-800">
                <strong>Atenção:</strong> Esta ação não pode ser desfeita. Ao cancelar:
              </p>
              <ul className="text-sm text-red-700 mt-2 space-y-1 ml-4 list-disc">
                <li>O pedido será eliminado da base de dados</li>
                <li>Todos os agendamentos associados serão cancelados</li>
                <li>As oficinas selecionadas serão notificadas</li>
              </ul>
            </div>
          </div>
          
          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              onClick={() => {
                setShowCancelDialog(false)
                setRequestToCancel(null)
              }}
              disabled={cancellingRequest !== null}
            >
              Não, Manter Pedido
            </Button>
            <Button
              variant="destructive"
              onClick={confirmCancelRequest}
              disabled={cancellingRequest !== null}
              className="bg-red-600 hover:bg-red-700"
            >
              {cancellingRequest ? (
                'A cancelar...'
              ) : (
                <>
                  <X className="h-4 w-4 mr-2" />
                  Sim, Cancelar Pedido
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Appointment Scheduling Dialog */}
      {selectedWorkshopForAppointment && (
        <AppointmentSchedulingDialog
          open={showAppointmentDialog}
          onOpenChange={setShowAppointmentDialog}
          workshopId={selectedWorkshopForAppointment.workshopId}
          workshopName={selectedWorkshopForAppointment.workshopName}
          serviceName={selectedWorkshopForAppointment.serviceName}
          onConfirm={handleConfirmAppointment}
          loading={approvingWorkshop !== null}
        />
      )}
      
      {/* Appointment Details Dialog */}
      <Dialog open={showRescheduleDialog} onOpenChange={(open) => {
        setShowRescheduleDialog(open)
        if (!open) {
          // Reset reschedule form when closing
          setRescheduleDate(undefined)
          setRescheduleTime('')
          setRescheduleNotes('')
        }
      }}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5 text-blue-600" />
              Detalhes do Agendamento
            </DialogTitle>
            <DialogDescription>
              Informações completas e opções de reagendamento
            </DialogDescription>
          </DialogHeader>
          
          {selectedAppointment && (
            <div className="space-y-4">
              {/* Summary Card */}
              <Card className="bg-gradient-to-r from-blue-50 to-orange-50">
                <CardContent className="pt-4 space-y-3">
                  <div className="flex items-start justify-between">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <Wrench className="h-5 w-5 text-blue-600" />
                        <h3 className="font-semibold text-lg">{selectedAppointment.serviceName}</h3>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <Building2 className="h-4 w-4" />
                        <span>{selectedAppointment.workshopName || 'Oficina'}</span>
                      </div>
                    </div>
                    {selectedAppointment.status === 'scheduled' && (
                      <Badge className="bg-blue-600">
                        <Calendar className="h-3 w-3 mr-1" />
                        Agendado
                      </Badge>
                    )}
                    {selectedAppointment.status === 'confirmed' && (
                      <Badge className="bg-green-600">
                        <CheckCircle className="h-3 w-3 mr-1" />
                        Confirmado
                      </Badge>
                    )}
                    {selectedAppointment.status === 'rescheduled' && (
                      <Badge className="bg-orange-600">
                        <Clock className="h-3 w-3 mr-1" />
                        Reagendado
                      </Badge>
                    )}
                    {selectedAppointment.status === 'pending_reschedule' && (
                      <Badge className="bg-yellow-600">
                        <AlertCircle className="h-3 w-3 mr-1" />
                        Reagendamento Pendente
                      </Badge>
                    )}
                  </div>
                  
                  <Separator />
                  
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-blue-600" />
                      <div>
                        <p className="text-xs text-gray-500">Data</p>
                        <p className="font-semibold">
                          {new Date(selectedAppointment.confirmedDate || selectedAppointment.date).toLocaleDateString('pt-PT', {
                            day: '2-digit',
                            month: 'long',
                            year: 'numeric'
                          })}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4 text-orange-600" />
                      <div>
                        <p className="text-xs text-gray-500">Hora</p>
                        <p className="font-semibold">{selectedAppointment.confirmedTime || selectedAppointment.startTime}</p>
                      </div>
                    </div>
                  </div>
                  
                  {selectedAppointment.licensePlate && (
                    <div className="flex items-center gap-2 text-sm">
                      <Car className="h-4 w-4 text-gray-600" />
                      <div>
                        <p className="text-xs text-gray-500">Veículo</p>
                        <p className="font-semibold">{selectedAppointment.licensePlate}</p>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Notes */}
              {selectedAppointment.notes && (
                <Card className="border-orange-200">
                  <CardContent className="pt-4">
                    <div className="flex items-start gap-2">
                      <FileText className="h-5 w-5 text-orange-600 mt-0.5" />
                      <div className="flex-1">
                        <p className="text-xs text-orange-800 font-semibold mb-1">Observações do Cliente</p>
                        <p className="text-sm text-gray-700">{selectedAppointment.notes}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Response Notes from Workshop */}
              {selectedAppointment.responseNotes && (
                <Card className="border-blue-200 bg-blue-50">
                  <CardContent className="pt-4">
                    <div className="flex items-start gap-2">
                      <AlertCircle className="h-5 w-5 text-blue-600 mt-0.5" />
                      <div className="flex-1">
                        <p className="text-xs text-blue-600 font-semibold mb-1">Mensagem da Oficina</p>
                        <p className="text-sm text-blue-800">{selectedAppointment.responseNotes}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Reschedule Request Info */}
              {selectedAppointment.rescheduleRequest && (
                <Card className="border-yellow-200 bg-yellow-50">
                  <CardContent className="pt-4">
                    <div className="flex items-start gap-2">
                      <Clock className="h-5 w-5 text-yellow-600 mt-0.5" />
                      <div className="flex-1">
                        <p className="text-xs text-yellow-800 font-semibold mb-2">
                          Pedido de Reagendamento Enviado
                        </p>
                        <p className="text-sm text-yellow-700 mb-2">
                          Nova data solicitada: <span className="font-semibold">{new Date(selectedAppointment.rescheduleRequest.requestedDate).toLocaleDateString('pt-PT')} às {selectedAppointment.rescheduleRequest.requestedTime}</span>
                        </p>
                        {selectedAppointment.rescheduleRequest.notes && (
                          <p className="text-xs text-yellow-600">
                            <strong>Motivo:</strong> {selectedAppointment.rescheduleRequest.notes}
                          </p>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Reschedule Form - Only show if no pending request */}
              {(selectedAppointment.status === 'scheduled' || selectedAppointment.status === 'confirmed') && !selectedAppointment.rescheduleRequest && (
                <>
                  <Separator />
                  
                  <div className="space-y-4">
                    <h3 className="font-semibold flex items-center gap-2">
                      <Clock className="h-5 w-5 text-blue-600" />
                      Solicitar Alteração de Data
                    </h3>

                    <div className="grid md:grid-cols-2 gap-4">
                      {/* New Date Selection */}
                      <div className="space-y-2">
                        <Label>Nova Data Desejada</Label>
                        <CalendarComponent
                          mode="single"
                          selected={rescheduleDate}
                          onSelect={setRescheduleDate}
                          disabled={(date) => date < new Date()}
                          className="rounded-md border"
                        />
                      </div>

                      {/* New Time Selection */}
                      <div className="space-y-2">
                        <Label htmlFor="reschedule-time">Nova Hora Desejada</Label>
                        <Select value={rescheduleTime} onValueChange={setRescheduleTime}>
                          <SelectTrigger id="reschedule-time">
                            <SelectValue placeholder="Selecione a hora" />
                          </SelectTrigger>
                          <SelectContent>
                            {Array.from({ length: 18 }, (_, i) => {
                              const hour = Math.floor(9 + i * 0.5)
                              const minute = (i % 2) * 30
                              const time = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`
                              return (
                                <SelectItem key={time} value={time}>
                                  {time}
                                </SelectItem>
                              )
                            })}
                          </SelectContent>
                        </Select>
                        
                        {/* Notes */}
                        <div className="space-y-2 mt-4">
                          <Label htmlFor="reschedule-notes">Motivo da Alteração (Opcional)</Label>
                          <Textarea
                            id="reschedule-notes"
                            placeholder="Ex: Tenho um compromisso nesse horário..."
                            value={rescheduleNotes}
                            onChange={(e) => setRescheduleNotes(e.target.value)}
                            rows={3}
                          />
                        </div>
                      </div>
                    </div>

                    <Card className="border-blue-200 bg-blue-50">
                      <CardContent className="pt-3 pb-3">
                        <p className="text-xs text-blue-800 flex items-start gap-2">
                          <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
                          <span>A oficina será notificada do seu pedido e entrará em contacto para confirmar a nova data.</span>
                        </p>
                      </CardContent>
                    </Card>
                  </div>
                </>
              )}

              {/* Metadata */}
              <div className="text-xs text-gray-500 pt-2 border-t">
                <p>ID do Agendamento: {selectedAppointment.id}</p>
                <p>Criado em: {new Date(selectedAppointment.createdAt).toLocaleString('pt-PT')}</p>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowRescheduleDialog(false)}
            >
              Fechar
            </Button>
            {selectedAppointment && (selectedAppointment.status === 'scheduled' || selectedAppointment.status === 'confirmed') && !selectedAppointment.rescheduleRequest && (
              <Button
                onClick={submitRescheduleRequest}
                disabled={!rescheduleDate || !rescheduleTime}
                className="bg-gradient-to-r from-blue-600 to-orange-500 hover:from-blue-700 hover:to-orange-600"
              >
                <Clock className="h-4 w-4 mr-2" />
                Enviar Pedido de Reagendamento
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
