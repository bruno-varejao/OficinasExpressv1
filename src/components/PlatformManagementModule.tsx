import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card'
import { Button } from './ui/button'
import { Input } from './ui/input'
import { Label } from './ui/label'
import { Textarea } from './ui/textarea'
import { Badge } from './ui/badge'
import { Switch } from './ui/switch'
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from './ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table'
import { ScrollArea } from './ui/scroll-area'
import { Separator } from './ui/separator'
import { Alert, AlertDescription } from './ui/alert'
import { 
  Globe, 
  Clock, 
  MapPin, 
  Phone, 
  Mail, 
  Save,
  Settings,
  Calendar,
  FileText,
  TrendingUp,
  Star,
  CheckCircle2,
  XCircle,
  Eye,
  Edit,
  Plus,
  Percent,
  Tag,
  Users,
  Check,
  X,
  UserPlus,
  Download,
  Car,
  User,
  MessageSquare,
  Euro,
  AlertCircle,
  RefreshCw,
  ClipboardCheck,
  DollarSign
} from 'lucide-react'
import { toast } from 'sonner@2.0.3'
import { projectId, publicAnonKey } from '../utils/supabase/info'
import { useWorkshop } from './WorkshopContext'

// ==================== INTERFACES ====================

interface WorkshopProfile {
  description: string
  address: string
  interventionZone: string
  phone: string
  email: string
  workingHours: {
    [key: string]: { open: string; close: string; closed: boolean }
  }
  photos: string[]
  specialties: string[]
  certifications: string[]
}

interface Service {
  id: string
  name: string
  category: string
  description: string
  duration: number
  enabled: boolean
  price: number
  discountPrice?: number
}

interface PublicAppointment {
  id: string
  clientName: string
  clientPhone: string
  clientEmail: string
  date: string
  time: string
  service: string
  vehiclePlate?: string
  vehicleModel?: string
  notes?: string
  status: 'pending' | 'confirmed' | 'cancelled'
  createdAt: string
}

interface ExpressQuote {
  id: string
  clientName: string
  clientPhone: string
  clientEmail: string
  vehiclePlate: string
  vehicleModel: string
  services: string[]
  description: string
  status: 'pending' | 'quoted' | 'approved' | 'rejected'
  quotedPrice?: number
  createdAt: string
}

interface WorkshopRequest {
  id: string
  quoteRequestId: string
  workshopId: string
  licensePlate: string
  location: string
  serviceId: string
  serviceName: string
  clientName: string
  clientEmail: string
  clientPhone: string
  notes?: string
  status: 'pending' | 'validated' | 'modified' | 'rejected'
  createdAt: string
  workshopResponse?: {
    price: number
    duration: number
    notes?: string
    respondedAt: string
    respondedBy: string
  }
}

interface Promotion {
  id: string
  title: string
  description: string
  discount: number
  discountType: 'percentage' | 'fixed'
  validFrom: string
  validTo: string
  active: boolean
  applicableServices: string[]
}

// ==================== CONSTANTS ====================

const AVAILABLE_SERVICES: Omit<Service, 'id' | 'enabled' | 'price' | 'discountPrice'>[] = [
  { name: 'Mudança de Óleo e Filtros', category: 'Manutenção', description: 'Substituição de óleo motor e filtros', duration: 30 },
  { name: 'Revisão Geral', category: 'Manutenção', description: 'Inspeção completa do veículo', duration: 120 },
  { name: 'Alinhamento de Rodas', category: 'Pneus', description: 'Alinhamento e balanceamento', duration: 45 },
  { name: 'Substituição de Pastilhas de Travão', category: 'Travões', description: 'Troca de pastilhas dianteiras ou traseiras', duration: 60 },
  { name: 'Diagnóstico Eletrónico', category: 'Eletrónica', description: 'Leitura e diagnóstico de falhas', duration: 30 },
  { name: 'Substituição de Bateria', category: 'Eletrónica', description: 'Troca de bateria do veículo', duration: 20 },
  { name: 'Carga de Ar Condicionado', category: 'Climatização', description: 'Recarga do sistema de A/C', duration: 45 },
  { name: 'Mudança de Pneus', category: 'Pneus', description: 'Substituição de pneus', duration: 30 },
  { name: 'Substituição de Amortecedores', category: 'Suspensão', description: 'Troca de amortecedores', duration: 90 },
  { name: 'Inspeção Periódica Obrigatória', category: 'Inspeções', description: 'IPO completa', duration: 60 },
  { name: 'Mudança de Correia de Distribuição', category: 'Motor', description: 'Substituição da correia', duration: 180 },
  { name: 'Substituição de Velas de Ignição', category: 'Motor', description: 'Troca de velas', duration: 30 },
]

const DAYS_PT = {
  monday: 'Segunda-feira',
  tuesday: 'Terça-feira',
  wednesday: 'Quarta-feira',
  thursday: 'Quinta-feira',
  friday: 'Sexta-feira',
  saturday: 'Sábado',
  sunday: 'Domingo'
}

// ==================== MAIN COMPONENT ====================

export function PlatformManagementModule({ accessToken, initialTab }: { accessToken: string, initialTab?: string }) {
  const { workshop } = useWorkshop()
  const [activeTab, setActiveTab] = useState(initialTab || 'instant-quotes')
  
  // Update activeTab when initialTab prop changes
  useEffect(() => {
    if (initialTab) {
      setActiveTab(initialTab)
    }
  }, [initialTab])
  
  // Profile state
  const [profile, setProfile] = useState<WorkshopProfile>({
    description: '',
    address: '',
    interventionZone: '',
    phone: '',
    email: '',
    workingHours: {
      monday: { open: '09:00', close: '18:00', closed: false },
      tuesday: { open: '09:00', close: '18:00', closed: false },
      wednesday: { open: '09:00', close: '18:00', closed: false },
      thursday: { open: '09:00', close: '18:00', closed: false },
      friday: { open: '09:00', close: '18:00', closed: false },
      saturday: { open: '09:00', close: '13:00', closed: false },
      sunday: { open: '09:00', close: '18:00', closed: true },
    },
    photos: [],
    specialties: [],
    certifications: [],
  })

  // Services state
  const [services, setServices] = useState<Service[]>([])
  const [editingService, setEditingService] = useState<Service | null>(null)
  const [showServiceDialog, setShowServiceDialog] = useState(false)

  // Appointments state
  const [publicAppointments, setPublicAppointments] = useState<PublicAppointment[]>([])
  const [selectedAppointment, setSelectedAppointment] = useState<PublicAppointment | null>(null)

  // Express quotes state (old system)
  const [expressQuotes, setExpressQuotes] = useState<ExpressQuote[]>([])
  const [selectedQuote, setSelectedQuote] = useState<ExpressQuote | null>(null)
  const [quotePrice, setQuotePrice] = useState('')
  
  // Instant quote requests (new system)
  const [instantQuoteRequests, setInstantQuoteRequests] = useState<WorkshopRequest[]>([])
  const [selectedInstantRequest, setSelectedInstantRequest] = useState<WorkshopRequest | null>(null)
  const [showResponseDialog, setShowResponseDialog] = useState(false)
  const [responseData, setResponseData] = useState({
    action: 'validated' as 'validated' | 'modified' | 'rejected',
    price: 0,
    duration: 60,
    notes: ''
  })

  // Promotions state
  const [promotions, setPromotions] = useState<Promotion[]>([])
  const [editingPromotion, setEditingPromotion] = useState<Promotion | null>(null)
  const [showPromotionDialog, setShowPromotionDialog] = useState(false)

  // Loading state
  const [loading, setLoading] = useState(false)

  // Statistics
  const [stats, setStats] = useState({
    totalRequests: 0,
    pendingAppointments: 0,
    pendingQuotes: 0,
    pendingInstantQuotes: 0,
    activePromotions: 0,
  })

  useEffect(() => {
    loadAllData()
  }, [])

  const loadAllData = async () => {
    setLoading(true)
    try {
      await Promise.all([
        loadProfile(),
        loadServices(),
        loadPublicAppointments(),
        loadExpressQuotes(),
        loadInstantQuoteRequests(),
        loadPromotions(),
        loadStats()
      ])
    } catch (error) {
      console.error('Error loading data:', error)
    } finally {
      setLoading(false)
    }
  }

  // ==================== PROFILE FUNCTIONS ====================

  const loadProfile = async () => {
    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-6971b43c/platform/profile`,
        {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
          },
        }
      )
      if (response.ok) {
        const data = await response.json()
        if (data.profile) {
          setProfile(data.profile)
        }
      }
    } catch (error) {
      console.error('Error loading profile:', error)
    }
  }

  const saveProfile = async () => {
    setLoading(true)
    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-6971b43c/platform/profile`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ profile }),
        }
      )
      if (response.ok) {
        toast.success('Perfil guardado com sucesso!')
      } else {
        toast.error('Erro ao guardar perfil')
      }
    } catch (error) {
      console.error('Error saving profile:', error)
      toast.error('Erro ao guardar perfil')
    } finally {
      setLoading(false)
    }
  }

  // ==================== SERVICES FUNCTIONS ====================

  const loadServices = async () => {
    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-6971b43c/platform/services`,
        {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
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

  const saveService = async (service: Service) => {
    setLoading(true)
    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-6971b43c/platform/services`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ service }),
        }
      )
      if (response.ok) {
        toast.success('Serviço guardado!')
        loadServices()
        setShowServiceDialog(false)
        setEditingService(null)
      } else {
        toast.error('Erro ao guardar serviço')
      }
    } catch (error) {
      console.error('Error saving service:', error)
      toast.error('Erro ao guardar serviço')
    } finally {
      setLoading(false)
    }
  }

  // ==================== APPOINTMENTS FUNCTIONS ====================

  const loadPublicAppointments = async () => {
    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-6971b43c/platform/appointments`,
        {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
          },
        }
      )
      if (response.ok) {
        const data = await response.json()
        setPublicAppointments(data.appointments || [])
      }
    } catch (error) {
      console.error('Error loading appointments:', error)
    }
  }

  const updateAppointmentStatus = async (appointmentId: string, status: 'confirmed' | 'cancelled') => {
    setLoading(true)
    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-6971b43c/platform/appointments/${appointmentId}/status`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ status }),
        }
      )
      if (response.ok) {
        toast.success(`Agendamento ${status === 'confirmed' ? 'confirmado' : 'cancelado'}!`)
        loadPublicAppointments()
        loadStats()
      } else {
        toast.error('Erro ao atualizar agendamento')
      }
    } catch (error) {
      console.error('Error updating appointment:', error)
      toast.error('Erro ao atualizar agendamento')
    } finally {
      setLoading(false)
    }
  }

  // ==================== EXPRESS QUOTES FUNCTIONS (OLD SYSTEM) ====================

  const loadExpressQuotes = async () => {
    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-6971b43c/platform/express-quotes`,
        {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
          },
        }
      )
      if (response.ok) {
        const data = await response.json()
        setExpressQuotes(data.quotes || [])
      }
    } catch (error) {
      console.error('Error loading express quotes:', error)
    }
  }

  const submitExpressQuote = async (quoteId: string, price: number) => {
    setLoading(true)
    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-6971b43c/platform/express-quotes/${quoteId}/submit`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ price }),
        }
      )
      if (response.ok) {
        toast.success('Orçamento enviado ao cliente!')
        loadExpressQuotes()
        loadStats()
        setSelectedQuote(null)
        setQuotePrice('')
      } else {
        toast.error('Erro ao enviar orçamento')
      }
    } catch (error) {
      console.error('Error submitting quote:', error)
      toast.error('Erro ao enviar orçamento')
    } finally {
      setLoading(false)
    }
  }

  // ==================== INSTANT QUOTE REQUESTS (NEW SYSTEM) ====================

  const loadInstantQuoteRequests = async () => {
    setLoading(true)
    try {
      console.log('📥 Loading instant quote requests...')
      
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-6971b43c/workshop-requests/pending`,
        {
          headers: {
            'Authorization': `Bearer ${accessToken}`
          }
        }
      )

      if (!response.ok) {
        throw new Error('Erro ao carregar pedidos')
      }

      const data = await response.json()
      setInstantQuoteRequests(data.requests || [])
      
      console.log(`✅ Loaded ${data.requests?.length || 0} instant quote requests`)
      
    } catch (error: any) {
      console.error('Error loading instant quote requests:', error)
      toast.error('Erro ao carregar pedidos de orçamento instantâneo')
    } finally {
      setLoading(false)
    }
  }

  const handleRespondToInstantQuote = (request: WorkshopRequest) => {
    setSelectedInstantRequest(request)
    setResponseData({
      action: 'validated',
      price: 0,
      duration: 60,
      notes: ''
    })
    setShowResponseDialog(true)
  }

  const submitInstantQuoteResponse = async () => {
    if (!selectedInstantRequest) return

    setLoading(true)
    try {
      console.log('📤 Submitting response to instant quote:', selectedInstantRequest.id)
      
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-6971b43c/workshop-requests/${selectedInstantRequest.id}/respond`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(responseData)
        }
      )

      if (!response.ok) {
        throw new Error('Erro ao enviar resposta')
      }

      const data = await response.json()
      
      toast.success(
        responseData.action === 'validated' 
          ? 'Orçamento validado!' 
          : responseData.action === 'modified'
          ? 'Orçamento retificado!'
          : 'Orçamento recusado'
      )
      
      setShowResponseDialog(false)
      setSelectedInstantRequest(null)
      loadInstantQuoteRequests()
      loadStats()
      
    } catch (error: any) {
      console.error('Error submitting response:', error)
      toast.error('Erro ao enviar resposta')
    } finally {
      setLoading(false)
    }
  }

  // ==================== PROMOTIONS FUNCTIONS ====================

  const loadPromotions = async () => {
    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-6971b43c/platform/promotions`,
        {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
          },
        }
      )
      if (response.ok) {
        const data = await response.json()
        setPromotions(data.promotions || [])
      }
    } catch (error) {
      console.error('Error loading promotions:', error)
    }
  }

  const savePromotion = async (promotion: Promotion) => {
    setLoading(true)
    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-6971b43c/platform/promotions`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ promotion }),
        }
      )
      if (response.ok) {
        toast.success('Promoção guardada!')
        loadPromotions()
        setShowPromotionDialog(false)
        setEditingPromotion(null)
      } else {
        toast.error('Erro ao guardar promoção')
      }
    } catch (error) {
      console.error('Error saving promotion:', error)
      toast.error('Erro ao guardar promoção')
    } finally {
      setLoading(false)
    }
  }

  // ==================== STATISTICS ====================

  const loadStats = async () => {
    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-6971b43c/platform/stats`,
        {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
          },
        }
      )
      if (response.ok) {
        const data = await response.json()
        setStats({
          totalRequests: (data.stats?.appointments || 0) + (data.stats?.quotes || 0),
          pendingAppointments: publicAppointments.filter(a => a.status === 'pending').length,
          pendingQuotes: expressQuotes.filter(q => q.status === 'pending').length,
          pendingInstantQuotes: instantQuoteRequests.filter(r => r.status === 'pending').length,
          activePromotions: promotions.filter(p => p.active).length,
        })
      }
    } catch (error) {
      console.error('Error loading stats:', error)
    }
  }

  // ==================== RENDER ====================

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">Pendente</Badge>
      case 'validated':
      case 'confirmed':
      case 'quoted':
        return <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">Confirmado</Badge>
      case 'modified':
        return <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">Retificado</Badge>
      case 'rejected':
      case 'cancelled':
        return <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">Recusado</Badge>
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  return (
    <div className="h-full flex flex-col" style={{ padding: '10px' }}>
      {/* Header */}
      <div className="mb-4 flex-shrink-0">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-gray-900">Gestão de Plataforma Pública</h1>
            <p className="text-gray-600">
              Gerir pedidos do portal público, perfil da oficina e promoções
            </p>
          </div>
          <Button onClick={loadAllData} variant="outline" disabled={loading}>
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Atualizar
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-600">Orçamentos Instantâneos</p>
                  <p className="text-gray-900 mt-1">{stats.pendingInstantQuotes}</p>
                </div>
                <div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center">
                  <FileText className="h-5 w-5 text-blue-600" />
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-600">Orçamentos Expressos</p>
                  <p className="text-gray-900 mt-1">{stats.pendingQuotes}</p>
                </div>
                <div className="w-10 h-10 bg-orange-50 rounded-lg flex items-center justify-center">
                  <ClipboardCheck className="h-5 w-5 text-orange-600" />
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-600">Agendamentos</p>
                  <p className="text-gray-900 mt-1">{stats.pendingAppointments}</p>
                </div>
                <div className="w-10 h-10 bg-green-50 rounded-lg flex items-center justify-center">
                  <Calendar className="h-5 w-5 text-green-600" />
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-600">Promoções Ativas</p>
                  <p className="text-gray-900 mt-1">{stats.activePromotions}</p>
                </div>
                <div className="w-10 h-10 bg-purple-50 rounded-lg flex items-center justify-center">
                  <Tag className="h-5 w-5 text-purple-600" />
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-600">Total Pedidos</p>
                  <p className="text-gray-900 mt-1">{stats.totalRequests}</p>
                </div>
                <div className="w-10 h-10 bg-indigo-50 rounded-lg flex items-center justify-center">
                  <TrendingUp className="h-5 w-5 text-indigo-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Tabs */}
      <Card className="flex-1 flex flex-col min-h-0">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col min-h-0">
          <CardHeader className="pb-4 flex-shrink-0">
            <TabsList className="grid w-full grid-cols-6 h-auto">
              <TabsTrigger value="instant-quotes" className="flex items-center gap-2">
                <FileText className="h-4 w-4" />
                <span className="hidden sm:inline">Orçamentos Instantâneos</span>
                <span className="sm:hidden">Instant.</span>
                {stats.pendingInstantQuotes > 0 && (
                  <Badge className="ml-1 h-5 min-w-5 px-1">{stats.pendingInstantQuotes}</Badge>
                )}
              </TabsTrigger>
              <TabsTrigger value="express-quotes" className="flex items-center gap-2">
                <ClipboardCheck className="h-4 w-4" />
                <span className="hidden sm:inline">Orçamentos Expressos</span>
                <span className="sm:hidden">Express.</span>
                {stats.pendingQuotes > 0 && (
                  <Badge className="ml-1 h-5 min-w-5 px-1">{stats.pendingQuotes}</Badge>
                )}
              </TabsTrigger>
              <TabsTrigger value="appointments" className="flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                <span className="hidden sm:inline">Agendamentos</span>
                <span className="sm:hidden">Agenda</span>
              </TabsTrigger>
              <TabsTrigger value="services" className="flex items-center gap-2">
                <Settings className="h-4 w-4" />
                <span className="hidden sm:inline">Serviços</span>
                <span className="sm:hidden">Serv.</span>
              </TabsTrigger>
              <TabsTrigger value="promotions" className="flex items-center gap-2">
                <Tag className="h-4 w-4" />
                <span className="hidden sm:inline">Promoções</span>
                <span className="sm:hidden">Promo.</span>
              </TabsTrigger>
              <TabsTrigger value="profile" className="flex items-center gap-2">
                <Globe className="h-4 w-4" />
                <span className="hidden sm:inline">Perfil Público</span>
                <span className="sm:hidden">Perfil</span>
              </TabsTrigger>
            </TabsList>
          </CardHeader>

          <CardContent className="flex-1 overflow-auto p-6 min-h-0">
            {/* ==================== INSTANT QUOTES TAB (NEW SYSTEM) ==================== */}
            <TabsContent value="instant-quotes" className="m-0 h-full">
              <div className="space-y-4 pb-4">
                  <Alert className="bg-blue-50 border-blue-200">
                    <FileText className="h-4 w-4 text-blue-600" />
                    <AlertDescription className="text-blue-800">
                      Sistema de orçamentos instantâneos: clientes pedem, você valida ou retifica
                    </AlertDescription>
                  </Alert>

                  {instantQuoteRequests.length === 0 ? (
                    <Card>
                      <CardContent className="py-12 text-center">
                        <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                        <p className="text-gray-600">Nenhum pedido de orçamento instantâneo pendente</p>
                      </CardContent>
                    </Card>
                  ) : (
                    <div className="space-y-3">
                      {instantQuoteRequests.map((request) => (
                        <Card key={request.id} className="hover:shadow-md transition-shadow">
                          <CardContent className="p-4">
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <div className="flex items-center gap-3 mb-3">
                                  {getStatusBadge(request.status)}
                                  <span className="text-gray-500">
                                    {new Date(request.createdAt).toLocaleString('pt-PT')}
                                  </span>
                                </div>
                                
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                  <div>
                                    <div className="flex items-center gap-2 text-gray-600 mb-1">
                                      <User className="h-4 w-4" />
                                      <span>Cliente</span>
                                    </div>
                                    {request.status === 'pending' ? (
                                      <>
                                        <p className="text-gray-500 italic">Dados confidenciais</p>
                                        <p className="text-xs text-gray-400">Visível após resposta</p>
                                      </>
                                    ) : (
                                      <>
                                        <p className="text-gray-900">{request.clientName}</p>
                                        <p className="text-gray-600">{request.clientEmail}</p>
                                        <p className="text-gray-600">{request.clientPhone}</p>
                                      </>
                                    )}
                                  </div>
                                  
                                  <div>
                                    <div className="flex items-center gap-2 text-gray-600 mb-1">
                                      <Car className="h-4 w-4" />
                                      <span>Veículo</span>
                                    </div>
                                    <p className="text-gray-900">{request.licensePlate}</p>
                                    <div className="flex items-center gap-2 text-gray-600 mt-1">
                                      <MapPin className="h-4 w-4" />
                                      <span>{request.location}</span>
                                    </div>
                                  </div>
                                  
                                  <div>
                                    <div className="flex items-center gap-2 text-gray-600 mb-1">
                                      <FileText className="h-4 w-4" />
                                      <span>Serviço</span>
                                    </div>
                                    <p className="text-gray-900">{request.serviceName}</p>
                                    {request.notes && (
                                      <p className="text-gray-600 mt-1">
                                        <MessageSquare className="h-4 w-4 inline mr-1" />
                                        {request.notes}
                                      </p>
                                    )}
                                  </div>
                                </div>

                                {request.workshopResponse && (
                                  <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                                    <p className="text-gray-600 mb-2">Resposta enviada:</p>
                                    <div className="grid grid-cols-3 gap-4">
                                      <div>
                                        <p className="text-gray-600">Preço</p>
                                        <p className="text-gray-900">{request.workshopResponse.price}€</p>
                                      </div>
                                      <div>
                                        <p className="text-gray-600">Duração</p>
                                        <p className="text-gray-900">{request.workshopResponse.duration} min</p>
                                      </div>
                                      <div>
                                        <p className="text-gray-600">Respondido em</p>
                                        <p className="text-gray-900">
                                          {new Date(request.workshopResponse.respondedAt).toLocaleString('pt-PT')}
                                        </p>
                                      </div>
                                    </div>
                                    {request.workshopResponse.notes && (
                                      <p className="text-gray-600 mt-2">{request.workshopResponse.notes}</p>
                                    )}
                                  </div>
                                )}
                              </div>

                              {request.status === 'pending' && (
                                <Button
                                  onClick={() => handleRespondToInstantQuote(request)}
                                  className="ml-4"
                                >
                                  <Edit className="h-4 w-4 mr-2" />
                                  Responder
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

            {/* ==================== EXPRESS QUOTES TAB (OLD SYSTEM) ==================== */}
            <TabsContent value="express-quotes" className="m-0 h-full">
              <div className="space-y-4 pb-4">
                  <Alert>
                    <ClipboardCheck className="h-4 w-4" />
                    <AlertDescription>
                      Orçamentos expressos submetidos por clientes através do portal público
                    </AlertDescription>
                  </Alert>

                  {expressQuotes.length === 0 ? (
                    <Card>
                      <CardContent className="py-12 text-center">
                        <ClipboardCheck className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                        <p className="text-gray-600">Nenhum pedido de orçamento expresso pendente</p>
                      </CardContent>
                    </Card>
                  ) : (
                    <div className="space-y-3">
                      {expressQuotes.map((quote) => (
                        <Card key={quote.id} className="hover:shadow-md transition-shadow">
                          <CardContent className="p-4">
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <div className="flex items-center gap-3 mb-3">
                                  {getStatusBadge(quote.status)}
                                  <span className="text-gray-500">
                                    {new Date(quote.createdAt).toLocaleString('pt-PT')}
                                  </span>
                                </div>
                                
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                  <div>
                                    <p className="text-gray-600">Cliente</p>
                                    <p className="text-gray-900">{quote.clientName}</p>
                                    <p className="text-gray-600">{quote.clientEmail}</p>
                                    <p className="text-gray-600">{quote.clientPhone}</p>
                                  </div>
                                  
                                  <div>
                                    <p className="text-gray-600">Veículo</p>
                                    <p className="text-gray-900">{quote.vehiclePlate}</p>
                                    <p className="text-gray-600">{quote.vehicleModel}</p>
                                  </div>
                                </div>

                                <div className="mt-3">
                                  <p className="text-gray-600">Serviços solicitados:</p>
                                  <div className="flex flex-wrap gap-2 mt-1">
                                    {quote.services.map((service, idx) => (
                                      <Badge key={idx} variant="outline">{service}</Badge>
                                    ))}
                                  </div>
                                </div>

                                {quote.description && (
                                  <div className="mt-3">
                                    <p className="text-gray-600">Descrição:</p>
                                    <p className="text-gray-900 mt-1">{quote.description}</p>
                                  </div>
                                )}

                                {quote.quotedPrice && (
                                  <div className="mt-3 p-3 bg-green-50 rounded-lg">
                                    <p className="text-gray-600">Orçamento enviado:</p>
                                    <p className="text-gray-900 mt-1">{quote.quotedPrice}€</p>
                                  </div>
                                )}
                              </div>

                              {quote.status === 'pending' && (
                                <div className="ml-4 flex flex-col gap-2">
                                  <Dialog>
                                    <DialogTrigger asChild>
                                      <Button onClick={() => setSelectedQuote(quote)}>
                                        <DollarSign className="h-4 w-4 mr-2" />
                                        Enviar Orçamento
                                      </Button>
                                    </DialogTrigger>
                                    <DialogContent>
                                      <DialogHeader>
                                        <DialogTitle>Enviar Orçamento</DialogTitle>
                                        <DialogDescription>
                                          Cliente: {quote.clientName} - {quote.vehiclePlate}
                                        </DialogDescription>
                                      </DialogHeader>
                                      <div className="space-y-4">
                                        <div>
                                          <Label>Preço do Orçamento (€)</Label>
                                          <Input
                                            type="number"
                                            value={quotePrice}
                                            onChange={(e) => setQuotePrice(e.target.value)}
                                            placeholder="Ex: 150.00"
                                          />
                                        </div>
                                      </div>
                                      <DialogFooter>
                                        <Button
                                          onClick={() => submitExpressQuote(quote.id, parseFloat(quotePrice))}
                                          disabled={!quotePrice || loading}
                                        >
                                          Enviar ao Cliente
                                        </Button>
                                      </DialogFooter>
                                    </DialogContent>
                                  </Dialog>
                                </div>
                              )}
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  )}
                </div>
            </TabsContent>

            {/* ==================== APPOINTMENTS TAB ==================== */}
            <TabsContent value="appointments" className="m-0 h-full">
              <div className="space-y-4 pb-4">
                  <Alert>
                    <Calendar className="h-4 w-4" />
                    <AlertDescription>
                      Agendamentos feitos por clientes através do portal público
                    </AlertDescription>
                  </Alert>

                  {publicAppointments.length === 0 ? (
                    <Card>
                      <CardContent className="py-12 text-center">
                        <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                        <p className="text-gray-600">Nenhum agendamento público pendente</p>
                      </CardContent>
                    </Card>
                  ) : (
                    <div className="space-y-3">
                      {publicAppointments.map((appointment) => (
                        <Card key={appointment.id} className="hover:shadow-md transition-shadow">
                          <CardContent className="p-4">
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <div className="flex items-center gap-3 mb-3">
                                  {getStatusBadge(appointment.status)}
                                  <span className="text-gray-500">
                                    Criado em {new Date(appointment.createdAt).toLocaleString('pt-PT')}
                                  </span>
                                </div>
                                
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                  <div>
                                    <p className="text-gray-600">Cliente</p>
                                    <p className="text-gray-900">{appointment.clientName}</p>
                                    <p className="text-gray-600">{appointment.clientEmail}</p>
                                    <p className="text-gray-600">{appointment.clientPhone}</p>
                                  </div>
                                  
                                  <div>
                                    <p className="text-gray-600">Data e Hora</p>
                                    <p className="text-gray-900">
                                      {new Date(appointment.date).toLocaleDateString('pt-PT')}
                                    </p>
                                    <p className="text-gray-600">{appointment.time}</p>
                                  </div>
                                  
                                  <div>
                                    <p className="text-gray-600">Serviço</p>
                                    <p className="text-gray-900">{appointment.service}</p>
                                    {appointment.vehiclePlate && (
                                      <p className="text-gray-600">{appointment.vehiclePlate}</p>
                                    )}
                                  </div>
                                </div>

                                {appointment.notes && (
                                  <div className="mt-3">
                                    <p className="text-gray-600">Notas:</p>
                                    <p className="text-gray-900 mt-1">{appointment.notes}</p>
                                  </div>
                                )}
                              </div>

                              {appointment.status === 'pending' && (
                                <div className="ml-4 flex flex-col gap-2">
                                  <Button
                                    onClick={() => updateAppointmentStatus(appointment.id, 'confirmed')}
                                    disabled={loading}
                                    className="bg-green-600 hover:bg-green-700"
                                  >
                                    <CheckCircle2 className="h-4 w-4 mr-2" />
                                    Confirmar
                                  </Button>
                                  <Button
                                    onClick={() => updateAppointmentStatus(appointment.id, 'cancelled')}
                                    disabled={loading}
                                    variant="destructive"
                                  >
                                    <XCircle className="h-4 w-4 mr-2" />
                                    Cancelar
                                  </Button>
                                </div>
                              )}
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  )}
                </div>
            </TabsContent>

            {/* ==================== SERVICES TAB ==================== */}
            <TabsContent value="services" className="m-0 h-full">
              <div className="space-y-4 pb-4">
                  <div className="flex justify-between items-center">
                    <Alert>
                      <Settings className="h-4 w-4" />
                      <AlertDescription>
                        Configure os serviços disponíveis no portal público
                      </AlertDescription>
                    </Alert>
                    <Button onClick={() => { setEditingService(null); setShowServiceDialog(true) }}>
                      <Plus className="h-4 w-4 mr-2" />
                      Novo Serviço
                    </Button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {services.map((service) => (
                      <Card key={service.id} className="hover:shadow-md transition-shadow">
                        <CardContent className="p-4">
                          <div className="flex items-start justify-between mb-3">
                            <div>
                              <Badge variant="outline" className="mb-2">{service.category}</Badge>
                              <h3 className="text-gray-900">{service.name}</h3>
                              <p className="text-gray-600 mt-1">{service.description}</p>
                            </div>
                            <Switch
                              checked={service.enabled}
                              onCheckedChange={(enabled) => {
                                const updated = { ...service, enabled }
                                saveService(updated)
                              }}
                            />
                          </div>
                          <div className="flex items-center justify-between mt-3 pt-3 border-t">
                            <div>
                              <p className="text-gray-600">Preço</p>
                              <p className="text-gray-900">{service.price}€</p>
                              {service.discountPrice && (
                                <p className="text-green-600">{service.discountPrice}€ (promoção)</p>
                              )}
                            </div>
                            <div className="text-right">
                              <p className="text-gray-600">Duração</p>
                              <p className="text-gray-900">{service.duration} min</p>
                            </div>
                          </div>
                          <Button
                            variant="outline"
                            size="sm"
                            className="w-full mt-3"
                            onClick={() => { setEditingService(service); setShowServiceDialog(true) }}
                          >
                            <Edit className="h-4 w-4 mr-2" />
                            Editar
                          </Button>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
            </TabsContent>

            {/* ==================== PROMOTIONS TAB ==================== */}
            <TabsContent value="promotions" className="m-0 h-full">
              <div className="space-y-4 pb-4">
                  <div className="flex justify-between items-center">
                    <Alert>
                      <Tag className="h-4 w-4" />
                      <AlertDescription>
                        Gerir promoções visíveis no portal público
                      </AlertDescription>
                    </Alert>
                    <Button onClick={() => { setEditingPromotion(null); setShowPromotionDialog(true) }}>
                      <Plus className="h-4 w-4 mr-2" />
                      Nova Promoção
                    </Button>
                  </div>

                  <div className="space-y-3">
                    {promotions.map((promo) => (
                      <Card key={promo.id} className="hover:shadow-md transition-shadow">
                        <CardContent className="p-4">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-3 mb-2">
                                <h3 className="text-gray-900">{promo.title}</h3>
                                <Switch checked={promo.active} />
                                <Badge variant="outline" className="bg-purple-50 text-purple-700">
                                  {promo.discountType === 'percentage' ? `${promo.discount}%` : `${promo.discount}€`}
                                </Badge>
                              </div>
                              <p className="text-gray-600 mb-3">{promo.description}</p>
                              <div className="flex items-center gap-4 text-gray-600">
                                <span>De {new Date(promo.validFrom).toLocaleDateString('pt-PT')}</span>
                                <span>até {new Date(promo.validTo).toLocaleDateString('pt-PT')}</span>
                              </div>
                            </div>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => { setEditingPromotion(promo); setShowPromotionDialog(true) }}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
            </TabsContent>

            {/* ==================== PROFILE TAB ==================== */}
            <TabsContent value="profile" className="m-0 h-full">
              <div className="space-y-6 pb-4">
                  <Alert>
                    <Globe className="h-4 w-4" />
                    <AlertDescription>
                      Configure o perfil público da sua oficina visível para clientes
                    </AlertDescription>
                  </Alert>

                  <Card>
                    <CardHeader>
                      <CardTitle>Informação Básica</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div>
                        <Label>Descrição da Oficina</Label>
                        <Textarea
                          value={profile.description}
                          onChange={(e) => setProfile({ ...profile, description: e.target.value })}
                          placeholder="Descreva a sua oficina..."
                          rows={4}
                        />
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <Label>Morada Completa</Label>
                          <Input
                            value={profile.address}
                            onChange={(e) => setProfile({ ...profile, address: e.target.value })}
                            placeholder="Rua, número, código postal, cidade"
                          />
                        </div>
                        <div>
                          <Label>Zona de Intervenção</Label>
                          <Input
                            value={profile.interventionZone}
                            onChange={(e) => setProfile({ ...profile, interventionZone: e.target.value })}
                            placeholder="Ex: Lisboa, Porto, Coimbra"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <Label>Telefone</Label>
                          <Input
                            value={profile.phone}
                            onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
                            placeholder="Ex: 21 234 5678"
                          />
                        </div>
                        <div>
                          <Label>Email</Label>
                          <Input
                            type="email"
                            value={profile.email}
                            onChange={(e) => setProfile({ ...profile, email: e.target.value })}
                            placeholder="oficina@exemplo.com"
                          />
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle>Horário de Funcionamento</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      {Object.entries(DAYS_PT).map(([key, label]) => (
                        <div key={key} className="flex items-center gap-4">
                          <div className="w-32">
                            <Label>{label}</Label>
                          </div>
                          <Switch
                            checked={!profile.workingHours[key]?.closed}
                            onCheckedChange={(checked) => {
                              setProfile({
                                ...profile,
                                workingHours: {
                                  ...profile.workingHours,
                                  [key]: { ...profile.workingHours[key], closed: !checked }
                                }
                              })
                            }}
                          />
                          {!profile.workingHours[key]?.closed && (
                            <div className="flex items-center gap-2">
                              <Input
                                type="time"
                                value={profile.workingHours[key]?.open || '09:00'}
                                onChange={(e) => {
                                  setProfile({
                                    ...profile,
                                    workingHours: {
                                      ...profile.workingHours,
                                      [key]: { ...profile.workingHours[key], open: e.target.value }
                                    }
                                  })
                                }}
                                className="w-32"
                              />
                              <span>às</span>
                              <Input
                                type="time"
                                value={profile.workingHours[key]?.close || '18:00'}
                                onChange={(e) => {
                                  setProfile({
                                    ...profile,
                                    workingHours: {
                                      ...profile.workingHours,
                                      [key]: { ...profile.workingHours[key], close: e.target.value }
                                    }
                                  })
                                }}
                                className="w-32"
                              />
                            </div>
                          )}
                        </div>
                      ))}
                    </CardContent>
                  </Card>

                  <div className="flex justify-end">
                    <Button onClick={saveProfile} disabled={loading}>
                      <Save className="h-4 w-4 mr-2" />
                      Guardar Perfil
                    </Button>
                  </div>
                </div>
            </TabsContent>
          </CardContent>
        </Tabs>
      </Card>

      {/* ==================== INSTANT QUOTE RESPONSE DIALOG ==================== */}
      <Dialog open={showResponseDialog} onOpenChange={setShowResponseDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Responder a Pedido de Orçamento</DialogTitle>
            <DialogDescription>
              {selectedInstantRequest && (
                <>Veículo: {selectedInstantRequest.licensePlate} - {selectedInstantRequest.serviceName}</>
              )}
            </DialogDescription>
          </DialogHeader>

          {selectedInstantRequest && (
            <div className="space-y-4">
              <div className="p-4 bg-gray-50 rounded-lg">
                <h4 className="text-gray-900 mb-2">Detalhes do Pedido</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-gray-600">Serviço</p>
                    <p className="text-gray-900">{selectedInstantRequest.serviceName}</p>
                  </div>
                  <div>
                    <p className="text-gray-600">Localidade</p>
                    <p className="text-gray-900">{selectedInstantRequest.location}</p>
                  </div>
                </div>
                {selectedInstantRequest.notes && (
                  <div className="mt-3">
                    <p className="text-gray-600">Notas do Cliente</p>
                    <p className="text-gray-900">{selectedInstantRequest.notes}</p>
                  </div>
                )}
              </div>

              <div>
                <Label>Ação</Label>
                <Select
                  value={responseData.action}
                  onValueChange={(value: any) => setResponseData({ ...responseData, action: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="validated">
                      <div className="flex items-center gap-2">
                        <CheckCircle2 className="h-4 w-4 text-green-600" />
                        <span>Validar Orçamento</span>
                      </div>
                    </SelectItem>
                    <SelectItem value="modified">
                      <div className="flex items-center gap-2">
                        <Edit className="h-4 w-4 text-blue-600" />
                        <span>Retificar Orçamento</span>
                      </div>
                    </SelectItem>
                    <SelectItem value="rejected">
                      <div className="flex items-center gap-2">
                        <XCircle className="h-4 w-4 text-red-600" />
                        <span>Recusar Pedido</span>
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {responseData.action !== 'rejected' && (
                <>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>Preço (€)</Label>
                      <Input
                        type="number"
                        value={responseData.price}
                        onChange={(e) => setResponseData({ ...responseData, price: parseFloat(e.target.value) })}
                        placeholder="Ex: 150.00"
                      />
                    </div>
                    <div>
                      <Label>Duração (minutos)</Label>
                      <Input
                        type="number"
                        value={responseData.duration}
                        onChange={(e) => setResponseData({ ...responseData, duration: parseInt(e.target.value) })}
                        placeholder="Ex: 60"
                      />
                    </div>
                  </div>

                  <div>
                    <Label>Notas (opcional)</Label>
                    <Textarea
                      value={responseData.notes}
                      onChange={(e) => setResponseData({ ...responseData, notes: e.target.value })}
                      placeholder="Informações adicionais para o cliente..."
                      rows={3}
                    />
                  </div>
                </>
              )}
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowResponseDialog(false)}>
              Cancelar
            </Button>
            <Button onClick={submitInstantQuoteResponse} disabled={loading}>
              {loading ? 'A enviar...' : 'Enviar Resposta'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
