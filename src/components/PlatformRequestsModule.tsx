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
  Image as ImageIcon, 
  Save, 
  Upload,
  Settings,
  Calendar,
  FileText,
  TrendingUp,
  Star,
  Smartphone,
  CheckCircle2,
  XCircle,
  Eye,
  Edit,
  Trash2,
  Plus,
  Percent,
  Tag,
  Users,
  Clock3,
  Check,
  X,
  UserPlus,
  Download
} from 'lucide-react'
import { toast } from 'sonner@2.0.3'
import { projectId, publicAnonKey } from '../utils/supabase/info'
import { useWorkshop } from './WorkshopContext'

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

const AVAILABLE_SERVICES: Omit<Service, 'id' | 'enabled' | 'price' | 'discountPrice'>[] = [
  { name: 'Mudança de Óleo e Filtros', category: 'Manutenção', description: 'Substituição de óleo motor e filtros', duration: 30 },
  { name: 'Revisão Geral', category: 'Manutenção', description: 'Inspeção completa do veículo', duration: 120 },
  { name: 'Alinhamento de Rodas', category: 'Pneus', description: 'Alinhamento e balanceamento', duration: 45 },
  { name: 'Substituição de Pastilhas de Travão', category: 'Travões', description: 'Troca de pastilhas dianteiras ou traseiras', duration: 60 },
  { name: 'Substituição de Discos de Travão', category: 'Travões', description: 'Troca de discos dianteiros ou traseiros', duration: 90 },
  { name: 'Diagnóstico Eletrónico', category: 'Eletrónica', description: 'Leitura e diagnóstico de falhas', duration: 30 },
  { name: 'Substituição de Bateria', category: 'Eletrónica', description: 'Troca de bateria do veículo', duration: 20 },
  { name: 'Carga de Ar Condicionado', category: 'Climatização', description: 'Recarga do sistema de A/C', duration: 45 },
  { name: 'Limpeza de Ar Condicionado', category: 'Climatização', description: 'Higienização do sistema', duration: 30 },
  { name: 'Substituição de Embraiagem', category: 'Transmissão', description: 'Troca do kit de embraiagem', duration: 240 },
  { name: 'Mudança de Pneus', category: 'Pneus', description: 'Substituição de pneus', duration: 30 },
  { name: 'Reparação de Suspensão', category: 'Suspensão', description: 'Reparação do sistema de suspensão', duration: 120 },
  { name: 'Substituição de Amortecedores', category: 'Suspensão', description: 'Troca de amortecedores', duration: 90 },
  { name: 'Inspeção Periódica Obrigatória', category: 'Inspeções', description: 'IPO completa', duration: 60 },
  { name: 'Mudança de Correia de Distribuição', category: 'Motor', description: 'Substituição da correia', duration: 180 },
  { name: 'Limpeza de Injetores', category: 'Motor', description: 'Limpeza do sistema de injeção', duration: 60 },
  { name: 'Substituição de Velas de Ignição', category: 'Motor', description: 'Troca de velas', duration: 30 },
  { name: 'Reparação de Sistema de Escape', category: 'Escape', description: 'Reparação ou substituição', duration: 90 },
  { name: 'Polimento de Faróis', category: 'Estética', description: 'Recuperação de faróis', duration: 45 },
  { name: 'Lavagem Completa', category: 'Estética', description: 'Lavagem exterior e interior', duration: 60 },
  { name: 'Polimento de Pintura', category: 'Estética', description: 'Polimento profissional', duration: 180 },
  { name: 'Aplicação de Cera Protetora', category: 'Estética', description: 'Proteção da pintura', duration: 90 },
  { name: 'Reparação de Para-brisas', category: 'Vidros', description: 'Reparação de impactos', duration: 45 },
  { name: 'Substituição de Para-brisas', category: 'Vidros', description: 'Troca completa', duration: 120 },
  { name: 'Substituição de Óleo de Caixa', category: 'Transmissão', description: 'Mudança de óleo da caixa', duration: 60 },
  { name: 'Substituição de Óleo de Diferencial', category: 'Transmissão', description: 'Mudança de óleo', duration: 45 },
  { name: 'Verificação de Geometria', category: 'Pneus', description: 'Análise da geometria das rodas', duration: 30 },
  { name: 'Substituição de Líquido de Travões', category: 'Travões', description: 'Troca do líquido', duration: 45 },
  { name: 'Substituição de Líquido de Refrigeração', category: 'Motor', description: 'Troca do líquido', duration: 30 },
  { name: 'Reparação de Alternador', category: 'Eletrónica', description: 'Reparação ou substituição', duration: 120 },
  { name: 'Reparação de Motor de Arranque', category: 'Eletrónica', description: 'Reparação ou substituição', duration: 90 },
  { name: 'Substituição de Filtro de Ar', category: 'Manutenção', description: 'Troca do filtro de ar', duration: 15 },
  { name: 'Substituição de Filtro de Combustível', category: 'Manutenção', description: 'Troca do filtro', duration: 30 },
  { name: 'Substituição de Filtro de Pólen', category: 'Manutenção', description: 'Troca do filtro do habitáculo', duration: 20 },
  { name: 'Reparação de Sistema de Direção', category: 'Direção', description: 'Reparação do sistema', duration: 120 },
  { name: 'Substituição de Bomba de Água', category: 'Motor', description: 'Troca da bomba', duration: 150 },
  { name: 'Reparação de Radiador', category: 'Motor', description: 'Reparação ou substituição', duration: 120 },
  { name: 'Teste de Compressão do Motor', category: 'Motor', description: 'Diagnóstico do motor', duration: 45 },
  { name: 'Limpeza de Válvula EGR', category: 'Motor', description: 'Limpeza do sistema EGR', duration: 60 },
  { name: 'Regeneração de Filtro de Partículas', category: 'Escape', description: 'Limpeza do DPF', duration: 90 },
]

export function PlatformRequestsModule({ accessToken, initialTab }: { accessToken: string, initialTab?: string }) {
  const { workshop } = useWorkshop()
  const [activeTab, setActiveTab] = useState(initialTab || 'profile')
  
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

  // Express quotes state
  const [expressQuotes, setExpressQuotes] = useState<ExpressQuote[]>([])
  const [selectedQuote, setSelectedQuote] = useState<ExpressQuote | null>(null)
  const [quotePrice, setQuotePrice] = useState('')
  
  // Client import state
  const [existingClients, setExistingClients] = useState<{[email: string]: string}>({}) // email -> clientId
  const [importingClient, setImportingClient] = useState<string | null>(null) // email being imported

  // Promotions state
  const [promotions, setPromoions] = useState<Promotion[]>([])
  const [editingPromotion, setEditingPromotion] = useState<Promotion | null>(null)
  const [showPromotionDialog, setShowPromotionDialog] = useState(false)

  // Statistics
  const [stats, setStats] = useState({
    totalRequests: 0,
    pendingAppointments: 0,
    pendingQuotes: 0,
    activePromotions: 0,
    viewsThisMonth: 0,
  })

  useEffect(() => {
    loadProfile()
    loadServices()
    loadPublicAppointments()
    loadExpressQuotes()
    loadPromotions()
    loadStats()
    loadExistingClients()
  }, [])

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
        toast.success('Perfil público atualizado com sucesso')
      } else {
        toast.error('Erro ao guardar perfil')
      }
    } catch (error) {
      console.error('Error saving profile:', error)
      toast.error('Erro ao guardar perfil')
    }
  }

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
        toast.success('Serviço atualizado')
        loadServices()
        setShowServiceDialog(false)
        setEditingService(null)
      } else {
        toast.error('Erro ao guardar serviço')
      }
    } catch (error) {
      console.error('Error saving service:', error)
      toast.error('Erro ao guardar serviço')
    }
  }

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

  const updateAppointmentStatus = async (id: string, status: PublicAppointment['status']) => {
    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-6971b43c/platform/appointments/${id}`,
        {
          method: 'PATCH',
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ status }),
        }
      )
      
      if (response.ok) {
        toast.success('Estado do agendamento atualizado')
        loadPublicAppointments()
        setSelectedAppointment(null)
      } else {
        toast.error('Erro ao atualizar agendamento')
      }
    } catch (error) {
      console.error('Error updating appointment:', error)
      toast.error('Erro ao atualizar agendamento')
    }
  }

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

  const submitQuote = async (quoteId: string, price: number) => {
    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-6971b43c/platform/express-quotes/${quoteId}`,
        {
          method: 'PATCH',
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ status: 'quoted', quotedPrice: price }),
        }
      )
      
      if (response.ok) {
        toast.success('Orçamento enviado ao cliente')
        loadExpressQuotes()
        setSelectedQuote(null)
        setQuotePrice('')
      } else {
        toast.error('Erro ao enviar orçamento')
      }
    } catch (error) {
      console.error('Error submitting quote:', error)
      toast.error('Erro ao enviar orçamento')
    }
  }

  const loadExistingClients = async () => {
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
        const clientsMap: {[email: string]: string} = {}
        data.clients.forEach((client: any) => {
          if (client.email) {
            clientsMap[client.email.toLowerCase()] = client.id
          }
        })
        setExistingClients(clientsMap)
      }
    } catch (error) {
      console.error('Error loading existing clients:', error)
    }
  }

  const importClientFromPublic = async (
    clientEmail: string, 
    clientName: string, 
    clientPhone: string,
    vehiclePlate?: string,
    vehicleModel?: string
  ) => {
    setImportingClient(clientEmail)
    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-6971b43c/platform/import-client`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ 
            clientEmail,
            clientName,
            clientPhone,
            vehiclePlate,
            vehicleModel
          }),
        }
      )
      
      if (response.ok) {
        const data = await response.json()
        const successMessage = vehiclePlate 
          ? `Cliente e veículo (${vehiclePlate}) importados com sucesso!`
          : 'Cliente importado com sucesso!'
        toast.success(successMessage)
        // Update existing clients map
        setExistingClients(prev => ({
          ...prev,
          [clientEmail.toLowerCase()]: data.clientId
        }))
      } else {
        const data = await response.json()
        toast.error(data.error || 'Erro ao importar cliente')
      }
    } catch (error) {
      console.error('Error importing client:', error)
      toast.error('Erro ao importar cliente')
    } finally {
      setImportingClient(null)
    }
  }

  const clientExistsInWorkshop = (clientEmail: string): boolean => {
    return !!existingClients[clientEmail.toLowerCase()]
  }

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
        setPromoions(data.promotions || [])
      }
    } catch (error) {
      console.error('Error loading promotions:', error)
    }
  }

  const savePromotion = async (promotion: Promotion) => {
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
        toast.success('Promoção guardada')
        loadPromotions()
        setShowPromotionDialog(false)
        setEditingPromotion(null)
      } else {
        toast.error('Erro ao guardar promoção')
      }
    } catch (error) {
      console.error('Error saving promotion:', error)
      toast.error('Erro ao guardar promoção')
    }
  }

  const deletePromotion = async (id: string) => {
    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-6971b43c/platform/promotions/${id}`,
        {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${accessToken}`,
          },
        }
      )
      
      if (response.ok) {
        toast.success('Promoção eliminada')
        loadPromotions()
      } else {
        toast.error('Erro ao eliminar promoção')
      }
    } catch (error) {
      console.error('Error deleting promotion:', error)
      toast.error('Erro ao eliminar promoção')
    }
  }

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
        setStats(data.stats || stats)
      }
    } catch (error) {
      console.error('Error loading stats:', error)
    }
  }

  const weekDays = {
    monday: 'Segunda-feira',
    tuesday: 'Terça-feira',
    wednesday: 'Quarta-feira',
    thursday: 'Quinta-feira',
    friday: 'Sexta-feira',
    saturday: 'Sábado',
    sunday: 'Domingo',
  }

  return (
    <div className="space-y-6">
      {/* Header with Stats */}
      <div className="grid gap-4 md:grid-cols-5">
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Total de Pedidos</CardDescription>
            <CardTitle className="text-3xl">{stats.totalRequests}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <FileText className="h-3 w-3" />
              <span>Este mês</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Agendamentos Pendentes</CardDescription>
            <CardTitle className="text-3xl">{stats.pendingAppointments}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <Calendar className="h-3 w-3" />
              <span>A aguardar confirmação</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Orçamentos Pendentes</CardDescription>
            <CardTitle className="text-3xl">{stats.pendingQuotes}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <FileText className="h-3 w-3" />
              <span>A aguardar resposta</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Promoções Ativas</CardDescription>
            <CardTitle className="text-3xl">{stats.activePromotions}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <Tag className="h-3 w-3" />
              <span>Disponíveis online</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Visualizações</CardDescription>
            <CardTitle className="text-3xl">{stats.viewsThisMonth}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <Eye className="h-3 w-3" />
              <span>Este mês</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="profile">
            <Globe className="h-4 w-4 mr-2" />
            Perfil Público
          </TabsTrigger>
          <TabsTrigger value="services">
            <Settings className="h-4 w-4 mr-2" />
            Serviços (40)
          </TabsTrigger>
          <TabsTrigger value="appointments">
            <Calendar className="h-4 w-4 mr-2" />
            Agenda Pública
          </TabsTrigger>
          <TabsTrigger value="quotes">
            <FileText className="h-4 w-4 mr-2" />
            Orçamentos Expressos
          </TabsTrigger>
          <TabsTrigger value="promotions">
            <Tag className="h-4 w-4 mr-2" />
            Promoções
          </TabsTrigger>
        </TabsList>

        {/* Profile Tab */}
        <TabsContent value="profile" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Informações da Oficina</CardTitle>
              <CardDescription>
                Controle a sua página online: descrição, fotos, horários e contactos
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="description">Descrição da Oficina</Label>
                <Textarea
                  id="description"
                  placeholder="Descreva a sua oficina, especialidades, equipamentos, equipa..."
                  value={profile.description}
                  onChange={(e) => setProfile({ ...profile, description: e.target.value })}
                  rows={4}
                />
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="address">
                    <MapPin className="h-4 w-4 inline mr-1" />
                    Morada
                  </Label>
                  <Input
                    id="address"
                    placeholder="Rua, Número, Código Postal, Localidade"
                    value={profile.address}
                    onChange={(e) => setProfile({ ...profile, address: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="interventionZone">
                    <MapPin className="h-4 w-4 inline mr-1" />
                    Zona de Intervenção
                  </Label>
                  <Input
                    id="interventionZone"
                    placeholder="Ex: Lisboa, Porto, Coimbra, etc."
                    value={profile.interventionZone}
                    onChange={(e) => setProfile({ ...profile, interventionZone: e.target.value })}
                  />
                  <p className="text-xs text-muted-foreground">
                    Localidades onde presta serviço
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="phone">
                    <Phone className="h-4 w-4 inline mr-1" />
                    Telefone
                  </Label>
                  <Input
                    id="phone"
                    placeholder="+351 XXX XXX XXX"
                    value={profile.phone}
                    onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email">
                    <Mail className="h-4 w-4 inline mr-1" />
                    Email
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="geral@oficina.pt"
                    value={profile.email}
                    onChange={(e) => setProfile({ ...profile, email: e.target.value })}
                  />
                </div>
              </div>

              <Separator />

              <div className="space-y-3">
                <Label>
                  <Clock className="h-4 w-4 inline mr-1" />
                  Horário de Funcionamento
                </Label>
                <div className="space-y-2">
                  {Object.entries(weekDays).map(([key, label]) => (
                    <div key={key} className="flex items-center gap-4">
                      <div className="w-32 text-sm">{label}</div>
                      <Switch
                        checked={!profile.workingHours[key].closed}
                        onCheckedChange={(checked) =>
                          setProfile({
                            ...profile,
                            workingHours: {
                              ...profile.workingHours,
                              [key]: { ...profile.workingHours[key], closed: !checked },
                            },
                          })
                        }
                      />
                      {!profile.workingHours[key].closed && (
                        <>
                          <Input
                            type="time"
                            className="w-32"
                            value={profile.workingHours[key].open}
                            onChange={(e) =>
                              setProfile({
                                ...profile,
                                workingHours: {
                                  ...profile.workingHours,
                                  [key]: { ...profile.workingHours[key], open: e.target.value },
                                },
                              })
                            }
                          />
                          <span className="text-muted-foreground">às</span>
                          <Input
                            type="time"
                            className="w-32"
                            value={profile.workingHours[key].close}
                            onChange={(e) =>
                              setProfile({
                                ...profile,
                                workingHours: {
                                  ...profile.workingHours,
                                  [key]: { ...profile.workingHours[key], close: e.target.value },
                                },
                              })
                            }
                          />
                        </>
                      )}
                      {profile.workingHours[key].closed && (
                        <span className="text-muted-foreground text-sm">Encerrado</span>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              <Separator />

              <div className="space-y-3">
                <Label>
                  <ImageIcon className="h-4 w-4 inline mr-1" />
                  Fotos da Oficina
                </Label>
                <Alert>
                  <Upload className="h-4 w-4" />
                  <AlertDescription>
                    Carregue fotos das suas instalações, equipamentos e equipa para aumentar a confiança dos clientes
                  </AlertDescription>
                </Alert>
                <Button variant="outline" className="w-full">
                  <Upload className="h-4 w-4 mr-2" />
                  Carregar Fotos
                </Button>
              </div>

              <div className="flex justify-end gap-2">
                <Button onClick={saveProfile}>
                  <Save className="h-4 w-4 mr-2" />
                  Guardar Perfil Público
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>
                <Smartphone className="h-5 w-5 inline mr-2" />
                Aplicação Móvel para Reparadores
              </CardTitle>
              <CardDescription>
                Acompanhe os pedidos da plataforma em tempo real através da app móvel
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-start gap-4">
                <div className="flex-1 space-y-2">
                  <p className="text-sm">
                    A aplicação móvel OficinasExpress permite-lhe:
                  </p>
                  <ul className="text-sm space-y-1 list-disc list-inside text-muted-foreground">
                    <li>Receber notificações instantâneas de novos pedidos</li>
                    <li>Responder a orçamentos expressos em qualquer lugar</li>
                    <li>Confirmar ou reagendar agendamentos</li>
                    <li>Visualizar detalhes de clientes e veículos</li>
                    <li>Gerir promoções e atualizar horários</li>
                  </ul>
                </div>
                <div className="flex flex-col gap-2">
                  <Badge variant="outline" className="justify-center">
                    iOS
                  </Badge>
                  <Badge variant="outline" className="justify-center">
                    Android
                  </Badge>
                </div>
              </div>
              <Button variant="outline" className="w-full">
                <Smartphone className="h-4 w-4 mr-2" />
                Transferir App Móvel
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Services Tab */}
        <TabsContent value="services" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Serviços à La Carte</CardTitle>
              <CardDescription>
                40 serviços disponíveis - Ative e configure preços personalizáveis para cada um
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <Select>
                    <SelectTrigger className="w-48">
                      <SelectValue placeholder="Todas as categorias" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todas</SelectItem>
                      <SelectItem value="maintenance">Manutenção</SelectItem>
                      <SelectItem value="brakes">Travões</SelectItem>
                      <SelectItem value="tires">Pneus</SelectItem>
                      <SelectItem value="electronics">Eletrónica</SelectItem>
                      <SelectItem value="climate">Climatização</SelectItem>
                      <SelectItem value="transmission">Transmissão</SelectItem>
                      <SelectItem value="suspension">Suspensão</SelectItem>
                      <SelectItem value="motor">Motor</SelectItem>
                      <SelectItem value="exhaust">Escape</SelectItem>
                      <SelectItem value="aesthetics">Estética</SelectItem>
                    </SelectContent>
                  </Select>
                  <div className="flex-1" />
                  <Badge variant="secondary">
                    {services.filter(s => s.enabled).length} de 40 ativos
                  </Badge>
                </div>

                <ScrollArea className="h-[600px] rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Ativo</TableHead>
                        <TableHead>Serviço</TableHead>
                        <TableHead>Categoria</TableHead>
                        <TableHead>Duração</TableHead>
                        <TableHead>Preço</TableHead>
                        <TableHead>Promoção</TableHead>
                        <TableHead className="text-right">Ações</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {AVAILABLE_SERVICES.map((availableService, index) => {
                        const service = services.find(s => s.name === availableService.name) || {
                          id: `service-${index}`,
                          ...availableService,
                          enabled: false,
                          price: 0,
                        }
                        return (
                          <TableRow key={service.id}>
                            <TableCell>
                              <Switch
                                checked={service.enabled}
                                onCheckedChange={(checked) => {
                                  const updatedService = { ...service, enabled: checked }
                                  if (checked && service.price === 0) {
                                    setEditingService(updatedService)
                                    setShowServiceDialog(true)
                                  } else {
                                    saveService(updatedService)
                                  }
                                }}
                              />
                            </TableCell>
                            <TableCell>
                              <div>
                                <div>{service.name}</div>
                                <div className="text-xs text-muted-foreground">
                                  {service.description}
                                </div>
                              </div>
                            </TableCell>
                            <TableCell>
                              <Badge variant="outline">{service.category}</Badge>
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-1 text-sm text-muted-foreground">
                                <Clock3 className="h-3 w-3" />
                                {service.duration}min
                              </div>
                            </TableCell>
                            <TableCell>
                              {service.enabled ? (
                                <span>€{service.price.toFixed(2)}</span>
                              ) : (
                                <span className="text-muted-foreground">-</span>
                              )}
                            </TableCell>
                            <TableCell>
                              {service.discountPrice ? (
                                <Badge variant="destructive" className="gap-1">
                                  <Percent className="h-3 w-3" />
                                  €{service.discountPrice.toFixed(2)}
                                </Badge>
                              ) : (
                                <span className="text-muted-foreground">-</span>
                              )}
                            </TableCell>
                            <TableCell className="text-right">
                              <Button
                                variant="ghost"
                                size="sm"
                                disabled={!service.enabled}
                                onClick={() => {
                                  setEditingService(service)
                                  setShowServiceDialog(true)
                                }}
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                            </TableCell>
                          </TableRow>
                        )
                      })}
                    </TableBody>
                  </Table>
                </ScrollArea>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Appointments Tab */}
        <TabsContent value="appointments" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Agenda Digital Pública</CardTitle>
              <CardDescription>
                Agendamentos feitos diretamente pelos clientes através da plataforma (sem orçamento prévio)
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Data/Hora</TableHead>
                    <TableHead>Cliente</TableHead>
                    <TableHead>Contacto</TableHead>
                    <TableHead>Serviço</TableHead>
                    <TableHead>Veículo</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {publicAppointments.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center text-muted-foreground">
                        Sem agendamentos públicos pendentes
                      </TableCell>
                    </TableRow>
                  ) : (
                    publicAppointments.map((appointment) => (
                      <TableRow key={appointment.id}>
                        <TableCell>
                          <div>
                            <div>{new Date(appointment.date).toLocaleDateString('pt-PT')}</div>
                            <div className="text-xs text-muted-foreground">{appointment.time}</div>
                          </div>
                        </TableCell>
                        <TableCell>{appointment.clientName}</TableCell>
                        <TableCell>
                          <div className="text-sm space-y-1">
                            <div className="flex items-center gap-1">
                              <Phone className="h-3 w-3" />
                              {appointment.clientPhone}
                            </div>
                            <div className="flex items-center gap-1 text-muted-foreground">
                              <Mail className="h-3 w-3" />
                              {appointment.clientEmail}
                            </div>
                            {!clientExistsInWorkshop(appointment.clientEmail) && (
                              <Button
                                size="sm"
                                variant="outline"
                                className="h-6 text-xs mt-1"
                                onClick={() => importClientFromPublic(
                                  appointment.clientEmail, 
                                  appointment.clientName, 
                                  appointment.clientPhone,
                                  appointment.vehiclePlate,
                                  appointment.vehicleModel
                                )}
                                disabled={importingClient === appointment.clientEmail}
                              >
                                {importingClient === appointment.clientEmail ? (
                                  'A importar...'
                                ) : (
                                  <>
                                    <Download className="h-3 w-3 mr-1" />
                                    {appointment.vehiclePlate ? 'Importar Cliente + Veículo' : 'Importar Cliente'}
                                  </>
                                )}
                              </Button>
                            )}
                            {clientExistsInWorkshop(appointment.clientEmail) && (
                              <Badge variant="secondary" className="text-xs">
                                <CheckCircle2 className="h-3 w-3 mr-1" />
                                Cliente existente
                              </Badge>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>{appointment.service}</TableCell>
                        <TableCell>
                          {appointment.vehiclePlate && (
                            <div>
                              <div>{appointment.vehiclePlate}</div>
                              <div className="text-xs text-muted-foreground">
                                {appointment.vehicleModel}
                              </div>
                            </div>
                          )}
                        </TableCell>
                        <TableCell>
                          {appointment.status === 'pending' && (
                            <Badge variant="secondary">Pendente</Badge>
                          )}
                          {appointment.status === 'confirmed' && (
                            <Badge variant="default" className="bg-green-500">Confirmado</Badge>
                          )}
                          {appointment.status === 'cancelled' && (
                            <Badge variant="destructive">Cancelado</Badge>
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-1">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setSelectedAppointment(appointment)}
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                            {appointment.status === 'pending' && (
                              <>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => updateAppointmentStatus(appointment.id, 'confirmed')}
                                >
                                  <Check className="h-4 w-4 text-green-600" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => updateAppointmentStatus(appointment.id, 'cancelled')}
                                >
                                  <X className="h-4 w-4 text-red-600" />
                                </Button>
                              </>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Quotes Tab */}
        <TabsContent value="quotes" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Pedidos de Orçamento Expresso</CardTitle>
              <CardDescription>
                Orçamentos solicitados online pelos clientes - responda rapidamente para aumentar conversões
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Data</TableHead>
                    <TableHead>Cliente</TableHead>
                    <TableHead>Contacto</TableHead>
                    <TableHead>Veículo</TableHead>
                    <TableHead>Serviços</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {expressQuotes.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center text-muted-foreground">
                        Sem pedidos de orçamento pendentes
                      </TableCell>
                    </TableRow>
                  ) : (
                    expressQuotes
                      .sort((a, b) => {
                        // Primeiro, pedidos pendentes vêm primeiro
                        if (a.status === 'pending' && b.status !== 'pending') return -1;
                        if (a.status !== 'pending' && b.status === 'pending') return 1;
                        
                        // Depois ordena por data mais recente
                        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
                      })
                      .map((quote) => (
                      <TableRow key={quote.id}>
                        <TableCell>
                          {new Date(quote.createdAt).toLocaleDateString('pt-PT')}
                        </TableCell>
                        <TableCell>
                          {quote.status === 'approved' ? (
                            quote.clientName
                          ) : (
                            <div className="flex items-center gap-2 text-muted-foreground">
                              <Users className="h-4 w-4" />
                              <span className="text-sm italic">Disponível após aprovação</span>
                            </div>
                          )}
                        </TableCell>
                        <TableCell>
                          {quote.status === 'approved' ? (
                            <div className="text-sm space-y-1">
                              <div className="flex items-center gap-1">
                                <Phone className="h-3 w-3" />
                                {quote.clientPhone}
                              </div>
                              <div className="flex items-center gap-1 text-muted-foreground">
                                <Mail className="h-3 w-3" />
                                {quote.clientEmail}
                              </div>
                              {!clientExistsInWorkshop(quote.clientEmail) && (
                                <Button
                                size="sm"
                                variant="outline"
                                className="h-6 text-xs mt-1"
                                onClick={() => importClientFromPublic(
                                  quote.clientEmail, 
                                  quote.clientName, 
                                  quote.clientPhone,
                                  quote.vehiclePlate,
                                  quote.vehicleModel
                                )}
                                disabled={importingClient === quote.clientEmail}
                              >
                                {importingClient === quote.clientEmail ? (
                                  'A importar...'
                                ) : (
                                  <>
                                    <Download className="h-3 w-3 mr-1" />
                                    Importar Cliente + Veículo
                                  </>
                                )}
                              </Button>
                            )}
                            {clientExistsInWorkshop(quote.clientEmail) && (
                                <Badge variant="secondary" className="text-xs">
                                  <CheckCircle2 className="h-3 w-3 mr-1" />
                                  Cliente existente
                                </Badge>
                              )}
                            </div>
                          ) : (
                            <div className="flex items-center gap-2 text-muted-foreground">
                              <Mail className="h-4 w-4" />
                              <span className="text-sm italic">Disponível após aprovação</span>
                            </div>
                          )}
                        </TableCell>
                        <TableCell>
                          <div>
                            <div>{quote.vehiclePlate}</div>
                            <div className="text-xs text-muted-foreground">
                              {quote.vehicleModel}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-wrap gap-1">
                            {quote.services.slice(0, 2).map((service, idx) => (
                              <Badge key={idx} variant="outline" className="text-xs">
                                {service}
                              </Badge>
                            ))}
                            {quote.services.length > 2 && (
                              <Badge variant="secondary" className="text-xs">
                                +{quote.services.length - 2}
                              </Badge>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          {quote.status === 'pending' && (
                            <Badge variant="secondary">Pendente</Badge>
                          )}
                          {quote.status === 'quoted' && (
                            <Badge variant="default" className="bg-blue-500">Orçamentado</Badge>
                          )}
                          {quote.status === 'approved' && (
                            <Badge variant="default" className="bg-green-500">Aprovado</Badge>
                          )}
                          {quote.status === 'rejected' && (
                            <Badge variant="destructive">Rejeitado</Badge>
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setSelectedQuote(quote)}
                          >
                            {quote.status === 'pending' ? 'Responder' : 'Ver Detalhes'}
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Promotions Tab */}
        <TabsContent value="promotions" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Promoções e Novidades</CardTitle>
                  <CardDescription>
                    Atualize e partilhe as suas promoções para atrair mais clientes
                  </CardDescription>
                </div>
                <Button
                  onClick={() => {
                    setEditingPromotion({
                      id: `promo-${Date.now()}`,
                      title: '',
                      description: '',
                      discount: 0,
                      discountType: 'percentage',
                      validFrom: new Date().toISOString().split('T')[0],
                      validTo: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
                      active: true,
                      applicableServices: [],
                    })
                    setShowPromotionDialog(true)
                  }}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Nova Promoção
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4">
                {promotions.length === 0 ? (
                  <div className="text-center text-muted-foreground py-8">
                    Sem promoções criadas
                  </div>
                ) : (
                  promotions.map((promotion) => (
                    <Card key={promotion.id}>
                      <CardHeader>
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <CardTitle className="text-base">{promotion.title}</CardTitle>
                              {promotion.active ? (
                                <Badge variant="default" className="bg-green-500">Ativa</Badge>
                              ) : (
                                <Badge variant="secondary">Inativa</Badge>
                              )}
                            </div>
                            <CardDescription>{promotion.description}</CardDescription>
                          </div>
                          <div className="flex gap-1">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                setEditingPromotion(promotion)
                                setShowPromotionDialog(true)
                              }}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => deletePromotion(promotion.id)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="flex items-center gap-4 text-sm">
                          <div className="flex items-center gap-2">
                            <Percent className="h-4 w-4 text-muted-foreground" />
                            <span>
                              {promotion.discountType === 'percentage'
                                ? `${promotion.discount}% desconto`
                                : `€${promotion.discount} desconto`}
                            </span>
                          </div>
                          <Separator orientation="vertical" className="h-4" />
                          <div className="flex items-center gap-2">
                            <Calendar className="h-4 w-4 text-muted-foreground" />
                            <span>
                              {new Date(promotion.validFrom).toLocaleDateString('pt-PT')} -{' '}
                              {new Date(promotion.validTo).toLocaleDateString('pt-PT')}
                            </span>
                          </div>
                          {promotion.applicableServices.length > 0 && (
                            <>
                              <Separator orientation="vertical" className="h-4" />
                              <div className="flex items-center gap-2">
                                <Settings className="h-4 w-4 text-muted-foreground" />
                                <span>{promotion.applicableServices.length} serviços</span>
                              </div>
                            </>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Service Edit Dialog */}
      <Dialog open={showServiceDialog} onOpenChange={setShowServiceDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Configurar Serviço</DialogTitle>
            <DialogDescription>
              {editingService?.name}
            </DialogDescription>
          </DialogHeader>
          {editingService && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Preço Base</Label>
                <div className="flex items-center gap-2">
                  <span className="text-muted-foreground">€</span>
                  <Input
                    type="number"
                    step="0.01"
                    value={editingService.price}
                    onChange={(e) =>
                      setEditingService({ ...editingService, price: parseFloat(e.target.value) || 0 })
                    }
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Preço Promocional (opcional)</Label>
                <div className="flex items-center gap-2">
                  <span className="text-muted-foreground">€</span>
                  <Input
                    type="number"
                    step="0.01"
                    value={editingService.discountPrice || ''}
                    onChange={(e) =>
                      setEditingService({
                        ...editingService,
                        discountPrice: e.target.value ? parseFloat(e.target.value) : undefined,
                      })
                    }
                    placeholder="Deixe vazio se não aplicável"
                  />
                </div>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowServiceDialog(false)}>
              Cancelar
            </Button>
            <Button onClick={() => editingService && saveService(editingService)}>
              Guardar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Appointment Details Dialog */}
      <Dialog open={!!selectedAppointment} onOpenChange={() => setSelectedAppointment(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Detalhes do Agendamento</DialogTitle>
            <DialogDescription>
              Informações completas do pedido de agendamento
            </DialogDescription>
          </DialogHeader>
          {selectedAppointment && (
            <div className="space-y-4">
              <div className="grid gap-2">
                <Label>Cliente</Label>
                <div>{selectedAppointment.clientName}</div>
              </div>
              <div className="grid gap-2">
                <Label>Contacto</Label>
                <div className="text-sm space-y-1">
                  <div className="flex items-center gap-2">
                    <Phone className="h-4 w-4" />
                    {selectedAppointment.clientPhone}
                  </div>
                  <div className="flex items-center gap-2">
                    <Mail className="h-4 w-4" />
                    {selectedAppointment.clientEmail}
                  </div>
                </div>
              </div>
              <div className="grid gap-2">
                <Label>Data e Hora</Label>
                <div>
                  {new Date(selectedAppointment.date).toLocaleDateString('pt-PT')} às{' '}
                  {selectedAppointment.time}
                </div>
              </div>
              <div className="grid gap-2">
                <Label>Serviço</Label>
                <div>{selectedAppointment.service}</div>
              </div>
              {selectedAppointment.vehiclePlate && (
                <div className="grid gap-2">
                  <Label>Veículo</Label>
                  <div>
                    <div>{selectedAppointment.vehiclePlate}</div>
                    <div className="text-sm text-muted-foreground">
                      {selectedAppointment.vehicleModel}
                    </div>
                  </div>
                </div>
              )}
              {selectedAppointment.notes && (
                <div className="grid gap-2">
                  <Label>Observações</Label>
                  <div className="text-sm">{selectedAppointment.notes}</div>
                </div>
              )}
            </div>
          )}
          <DialogFooter>
            {selectedAppointment?.status === 'pending' && (
              <>
                <Button
                  variant="outline"
                  onClick={() => {
                    updateAppointmentStatus(selectedAppointment.id, 'cancelled')
                  }}
                >
                  Cancelar Agendamento
                </Button>
                <Button
                  onClick={() => {
                    updateAppointmentStatus(selectedAppointment.id, 'confirmed')
                  }}
                >
                  Confirmar
                </Button>
              </>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Quote Response Dialog */}
      <Dialog open={!!selectedQuote} onOpenChange={() => setSelectedQuote(null)}>
        <DialogContent className="dialog-fullscreen overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Orçamento Expresso</DialogTitle>
            <DialogDescription>
              Responda ao pedido do cliente
            </DialogDescription>
          </DialogHeader>
          {selectedQuote && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Cliente</Label>
                  {selectedQuote.status === 'approved' ? (
                    <div>{selectedQuote.clientName}</div>
                  ) : (
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Users className="h-4 w-4" />
                      <span className="text-sm italic">Disponível após aprovação</span>
                    </div>
                  )}
                </div>
                <div className="space-y-2">
                  <Label>Veículo</Label>
                  <div>
                    <div>{selectedQuote.vehiclePlate}</div>
                    <div className="text-sm text-muted-foreground">{selectedQuote.vehicleModel}</div>
                  </div>
                </div>
              </div>
              <div className="space-y-2">
                <Label>Serviços Solicitados</Label>
                <div className="flex flex-wrap gap-2">
                  {selectedQuote.services.map((service, idx) => (
                    <Badge key={idx} variant="outline">
                      {service}
                    </Badge>
                  ))}
                </div>
              </div>
              <div className="space-y-2">
                <Label>Descrição do Cliente</Label>
                <div className="text-sm p-3 bg-muted rounded-md">{selectedQuote.description}</div>
              </div>
              
              {selectedQuote.status === 'approved' ? (
                <div className="space-y-2">
                  <Label>Dados de Contacto</Label>
                  <div className="p-3 bg-muted rounded-md space-y-2">
                    <div className="flex items-center gap-2">
                      <Phone className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm">{selectedQuote.clientPhone}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Mail className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm">{selectedQuote.clientEmail}</span>
                    </div>
                  </div>
                </div>
              ) : (
                <Alert>
                  <Mail className="h-4 w-4" />
                  <AlertDescription>
                    Os dados de contacto do cliente estarão disponíveis após a aprovação do orçamento.
                  </AlertDescription>
                </Alert>
              )}
              
              {selectedQuote.status === 'pending' && (
                <div className="space-y-2">
                  <Label>Valor do Orçamento</Label>
                  <div className="flex items-center gap-2">
                    <span className="text-muted-foreground">€</span>
                    <Input
                      type="number"
                      step="0.01"
                      placeholder="0.00"
                      value={quotePrice}
                      onChange={(e) => setQuotePrice(e.target.value)}
                    />
                  </div>
                </div>
              )}
              {selectedQuote.quotedPrice && (
                <div className="space-y-2">
                  <Label>Valor Orçamentado</Label>
                  <div className="text-2xl">€{selectedQuote.quotedPrice.toFixed(2)}</div>
                </div>
              )}
            </div>
          )}
          <DialogFooter>
            {selectedQuote?.status === 'pending' && (
              <Button
                onClick={() => {
                  const price = parseFloat(quotePrice)
                  if (price > 0) {
                    submitQuote(selectedQuote.id, price)
                  } else {
                    toast.error('Insira um valor válido')
                  }
                }}
              >
                Enviar Orçamento ao Cliente
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Promotion Edit Dialog */}
      <Dialog open={showPromotionDialog} onOpenChange={setShowPromotionDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {editingPromotion?.id.startsWith('promo-') ? 'Nova Promoção' : 'Editar Promoção'}
            </DialogTitle>
            <DialogDescription>
              Configure os detalhes da promoção
            </DialogDescription>
          </DialogHeader>
          {editingPromotion && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Título da Promoção</Label>
                <Input
                  placeholder="Ex: Desconto de Verão"
                  value={editingPromotion.title}
                  onChange={(e) =>
                    setEditingPromotion({ ...editingPromotion, title: e.target.value })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label>Descrição</Label>
                <Textarea
                  placeholder="Descreva a promoção..."
                  value={editingPromotion.description}
                  onChange={(e) =>
                    setEditingPromotion({ ...editingPromotion, description: e.target.value })
                  }
                  rows={3}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Tipo de Desconto</Label>
                  <Select
                    value={editingPromotion.discountType}
                    onValueChange={(value: 'percentage' | 'fixed') =>
                      setEditingPromotion({ ...editingPromotion, discountType: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="percentage">Percentagem (%)</SelectItem>
                      <SelectItem value="fixed">Valor Fixo (€)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Valor do Desconto</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={editingPromotion.discount}
                    onChange={(e) =>
                      setEditingPromotion({
                        ...editingPromotion,
                        discount: parseFloat(e.target.value) || 0,
                      })
                    }
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Válida de</Label>
                  <Input
                    type="date"
                    value={editingPromotion.validFrom}
                    onChange={(e) =>
                      setEditingPromotion({ ...editingPromotion, validFrom: e.target.value })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label>Válida até</Label>
                  <Input
                    type="date"
                    value={editingPromotion.validTo}
                    onChange={(e) =>
                      setEditingPromotion({ ...editingPromotion, validTo: e.target.value })
                    }
                  />
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Switch
                  checked={editingPromotion.active}
                  onCheckedChange={(checked) =>
                    setEditingPromotion({ ...editingPromotion, active: checked })
                  }
                />
                <Label>Promoção ativa</Label>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowPromotionDialog(false)}>
              Cancelar
            </Button>
            <Button onClick={() => editingPromotion && savePromotion(editingPromotion)}>
              Guardar Promoção
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
