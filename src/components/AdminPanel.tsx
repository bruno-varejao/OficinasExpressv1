import { useState, useEffect } from 'react'
import { Button } from './ui/button'
import { Input } from './ui/input'
import { Label } from './ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from './ui/dialog'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table'
import { Badge } from './ui/badge'
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from './ui/alert-dialog'
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs'
import { projectId } from '../utils/supabase/info'
import { toast } from 'sonner@2.0.3'
import { ArrowLeft, Plus, Edit, Trash2, Ban, CheckCircle, Building2, Mail, User, Shield, Search, Upload, Image, Users, FileText, Settings, LogOut, RefreshCw, Database, Globe, Receipt, BookOpen } from 'lucide-react'
import { PlatformClientsModule } from './PlatformClientsModule'
import { BannerManagementModule } from './BannerManagementModule'
import { LogoManagementModule } from './LogoManagementModule'
import { WorkshopClientsDatabase } from './WorkshopClientsDatabase'
import { DecodificadorMatriculasModule } from './DecodificadorMatriculasModule'
import { VinDecoderTest } from './VinDecoderTest'
import { MoloniIntegrationModule } from './MoloniIntegrationModule'
import { ProductionDocumentation } from './ProductionDocumentation'
import { AuditLogsModule } from './AuditLogsModule'

interface AdminPanelProps {
  accessToken: string
  onBack: () => void
}

interface UserAccount {
  id: string
  email: string
  name: string
  role: string
  workshopName?: string
  workshopId?: string
  createdAt: string
  banned?: boolean
  lastSignIn?: string
}

interface Workshop {
  id: string
  name: string
  address?: string
  phone?: string
  email?: string
  nif?: string
  logoPath?: string
  logoUrl?: string
  isActive: boolean
  userCount?: number
  createdAt: string
}

interface PublicClient {
  id: string
  clientId: string
  name: string
  email: string
  phone?: string
  role: string
  isPublicClient: boolean
  lastLogin?: string
  emailConfirmed?: boolean
  createdAt: string
}

interface ModuleConfig {
  id: string
  name: string
  description: string
  icon: string
}

const AVAILABLE_MODULES: ModuleConfig[] = [
  { id: 'dashboard', name: 'Dashboard', description: 'Visão geral e KPIs', icon: 'LayoutDashboard' },
  { id: 'platform', name: 'Gestão de Plataforma Pública', description: 'Sistema completo: orçamentos instantâneos, orçamentos expressos, agendamentos públicos, serviços e promoções', icon: 'Globe' },
  { id: 'agenda', name: 'Agenda Avançada', description: 'Sistema avançado de agendamentos com gestão de slots', icon: 'Calendar' },
  { id: 'clients', name: 'Clientes', description: 'Gestão de clientes', icon: 'Users' },
  { id: 'vehicles', name: 'Veículos', description: 'Gestão de veículos', icon: 'Car' },
  { id: 'appointments', name: 'Agendamentos', description: 'Gestão de agendamentos simples', icon: 'Calendar' },
  { id: 'workorders', name: 'Ordens de Trabalho', description: 'Gestão de ordens de trabalho', icon: 'ClipboardList' },
  { id: 'servicesheet', name: 'Folha de Serviço', description: 'Gestão completa de serviços e intervenções', icon: 'FileCheck' },
  { id: 'budgets', name: 'Orçamentos', description: 'Gestão de orçamentos', icon: 'FileText' },
  { id: 'invoices', name: 'Faturas', description: 'Gestão de faturas', icon: 'Receipt' },
  { id: 'checkin', name: 'Check-in', description: 'Receção de veículos', icon: 'LogIn' },
  { id: 'courtesyvehicles', name: 'Viaturas de Cortesia', description: 'Gestão de viaturas de cortesia', icon: 'CarFront' },
  { id: 'bi', name: 'Business Intelligence', description: 'Análise e relatórios', icon: 'TrendingUp' },
  { id: 'supplierorders', name: 'Encomenda a Fornecedores', description: 'Pedidos de peças a fornecedores', icon: 'Package' },
  { id: 'stock', name: 'Stock', description: 'Gestão de stock de peças', icon: 'Warehouse' },
  { id: 'settings', name: 'Definições', description: 'Configurações da oficina e utilizadores', icon: 'Settings' },
  // 🚀 NOVOS MÓDULOS INOVADORES
  { id: 'loyalty', name: '🏆 Fidelização de Clientes', description: 'Sistema completo com 4 tiers, pontos e recompensas', icon: 'Trophy' },
  { id: 'whatsapp', name: '📲 WhatsApp Business', description: 'Integração com 8 templates automáticos (98% taxa de abertura)', icon: 'MessageCircle' },
  { id: 'custom-dashboard', name: '📊 Dashboards Personalizáveis', description: '9 tipos de widgets, drag-and-drop, exportar/importar', icon: 'LayoutDashboard' },
  { id: 'pricing-ai', name: '🤖 Pricing Dinâmico com IA', description: 'IA analisa 15+ fatores para otimizar preços (+15-25% margem)', icon: 'Brain' },
  { id: 'offline-mode', name: '✈️ Modo Offline', description: 'Trabalho sem internet com sincronização automática', icon: 'WifiOff' },
  { id: 'innovations', name: '✨ Inovações', description: 'Hub de funcionalidades inovadoras e tutoriais', icon: 'Sparkles' },
]

function ModulesConfig({ workshopId, accessToken }: { workshopId: string; accessToken: string }) {
  const [activeModules, setActiveModules] = useState<string[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    loadModules()
  }, [workshopId])

  const loadModules = async () => {
    try {
      setLoading(true)
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-6971b43c/admin/workshops/${workshopId}/modules`,
        {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
          },
        }
      )
      
      if (response.ok) {
        const data = await response.json()
        // Se não houver configuração de módulos (null), iniciar com array vazio
        // Isto garante que novos módulos adicionados ao AVAILABLE_MODULES aparecem sempre inativos
        setActiveModules(data.modules || [])
      } else {
        const errorData = await response.json()
        console.error('Error loading modules - Status:', response.status, 'Error:', errorData)
        toast.error(`Erro ao carregar módulos: ${errorData.error || 'Erro desconhecido'}`)
      }
    } catch (error) {
      console.error('Error loading modules:', error)
      toast.error('Erro ao carregar módulos')
    } finally {
      setLoading(false)
    }
  }

  const saveModules = async (modules: string[]) => {
    try {
      setSaving(true)
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-6971b43c/admin/workshops/${workshopId}/modules`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ modules }),
        }
      )
      
      if (response.ok) {
        toast.success('Módulos atualizados com sucesso!')
      } else {
        const errorData = await response.json()
        console.error('Error saving modules - Status:', response.status, 'Error:', errorData)
        toast.error(`Erro ao atualizar módulos: ${errorData.error || 'Erro desconhecido'}`)
      }
    } catch (error) {
      console.error('Error saving modules:', error)
      toast.error('Erro ao atualizar módulos')
    } finally {
      setSaving(false)
    }
  }

  const toggleModule = (moduleId: string) => {
    const newModules = activeModules.includes(moduleId)
      ? activeModules.filter(id => id !== moduleId)
      : [...activeModules, moduleId]
    
    setActiveModules(newModules)
    saveModules(newModules)
  }

  const selectAll = () => {
    const allModules = AVAILABLE_MODULES.map(m => m.id)
    setActiveModules(allModules)
    saveModules(allModules)
  }

  const deselectAll = () => {
    setActiveModules([])
    saveModules([])
  }

  if (loading) {
    return (
      <div className="text-center py-8">
        <div className="inline-block h-8 w-8 rounded-lg bg-gradient-to-br from-blue-600 to-orange-500 animate-pulse"></div>
        <p className="text-sm text-gray-600 mt-2">A carregar módulos...</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-600">
          {activeModules.length} de {AVAILABLE_MODULES.length} módulos ativos
        </p>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={selectAll}
            disabled={saving}
            className="border-green-200 text-green-700 hover:bg-green-50"
          >
            <CheckCircle className="h-3 w-3 mr-1" />
            Todos
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={deselectAll}
            disabled={saving}
            className="border-red-200 text-red-700 hover:bg-red-50"
          >
            <Ban className="h-3 w-3 mr-1" />
            Nenhum
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        {AVAILABLE_MODULES.map((module) => (
          <div
            key={module.id}
            onClick={() => toggleModule(module.id)}
            className={`
              p-4 rounded-lg border-2 cursor-pointer transition-all
              ${activeModules.includes(module.id)
                ? 'border-blue-500 bg-gradient-to-br from-blue-50 to-orange-50 shadow-md'
                : 'border-gray-200 bg-white hover:border-gray-300'
              }
              ${saving ? 'opacity-50 cursor-not-allowed' : ''}
            `}
          >
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <h4 className="font-semibold text-sm text-gray-900">{module.name}</h4>
                <p className="text-xs text-gray-500 mt-1">{module.description}</p>
              </div>
              <div className={`
                h-5 w-5 rounded flex items-center justify-center flex-shrink-0 ml-2
                ${activeModules.includes(module.id) 
                  ? 'bg-gradient-to-br from-blue-600 to-orange-500' 
                  : 'bg-gray-200'
                }
              `}>
                {activeModules.includes(module.id) && (
                  <CheckCircle className="h-3 w-3 text-white" />
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

export function AdminPanel({ accessToken, onBack }: AdminPanelProps) {
  const [users, setUsers] = useState<UserAccount[]>([])
  const [workshops, setWorkshops] = useState<Workshop[]>([])
  const [publicClients, setPublicClients] = useState<PublicClient[]>([])
  const [loading, setLoading] = useState(true)
  const [loadingClients, setLoadingClients] = useState(false)
  const [loadingWorkshops, setLoadingWorkshops] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [createDialogOpen, setCreateDialogOpen] = useState(false)
  const [editDialogOpen, setEditDialogOpen] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [editWorkshopDialogOpen, setEditWorkshopDialogOpen] = useState(false)
  const [selectedUser, setSelectedUser] = useState<UserAccount | null>(null)
  const [selectedWorkshop, setSelectedWorkshop] = useState<Workshop | null>(null)
  const [searchFilter, setSearchFilter] = useState('')
  const [workshopModulesFilter, setWorkshopModulesFilter] = useState('')
  const [uploadingLogo, setUploadingLogo] = useState(false)
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    name: '',
    role: 'rececionista',
    workshopId: '',
    workshopName: '',
    createNewWorkshop: false
  })
  const [workshopFormData, setWorkshopFormData] = useState({
    name: '',
    nif: '',
    address: '',
    phone: '',
    email: ''
  })

  useEffect(() => {
    fetchUsers()
    fetchWorkshops()
    fetchClients()
  }, [])

  const fetchUsers = async () => {
    try {
      setLoading(true)
      setError(null)
      console.log('📡 Fetching users with token:', accessToken?.substring(0, 20) + '...')
      
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-6971b43c/admin/users`,
        {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
          },
        }
      )

      console.log('📡 Response status:', response.status, response.statusText)

      if (response.ok) {
        const data = await response.json()
        console.log('✅ Users fetched successfully:', data.users?.length || 0, 'users')
        setUsers(data.users || [])
        setError(null)
      } else {
        const errorText = await response.text()
        console.error('❌ Error response:', errorText)
        
        let errorMessage = 'Erro desconhecido'
        try {
          const errorJson = JSON.parse(errorText)
          errorMessage = errorJson.error || errorMessage
        } catch {
          errorMessage = errorText
        }
        
        setError(errorMessage)
        toast.error('Erro ao carregar utilizadores: ' + errorMessage, {
          duration: 5000
        })
      }
    } catch (error: any) {
      console.error('❌ Error fetching users:', error)
      const errorMsg = error?.message || 'Erro de conexão. Verifique se o backend está ativo.'
      setError(errorMsg)
      toast.error(errorMsg, {
        duration: 5000
      })
    } finally {
      setLoading(false)
    }
  }

  const fetchWorkshops = async () => {
    try {
      setLoadingWorkshops(true)
      console.log('📡 Fetching workshops...')
      
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-6971b43c/admin/workshops`,
        {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
          },
        }
      )

      if (response.ok) {
        const data = await response.json()
        console.log('✅ Workshops fetched:', data.workshops?.length || 0)
        setWorkshops(data.workshops || [])
        toast.success(`${data.workshops?.length || 0} oficina(s) carregada(s)`)
      } else {
        console.error('❌ Error fetching workshops:', await response.text())
        toast.error('Erro ao carregar oficinas')
      }
    } catch (error: any) {
      console.error('❌ Error fetching workshops:', error)
      toast.error('Erro ao carregar oficinas')
    } finally {
      setLoadingWorkshops(false)
    }
  }

  const fetchClients = async () => {
    try {
      setLoadingClients(true)
      console.log('📡 Fetching all public platform clients...')
      
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-6971b43c/admin/clients`,
        {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
          },
        }
      )

      if (response.ok) {
        const data = await response.json()
        console.log('✅ Public clients fetched:', data.clients?.length || 0)
        setPublicClients(data.clients || [])
      } else {
        console.error('❌ Error fetching public clients:', await response.text())
        toast.error('Erro ao carregar clientes da plataforma')
      }
    } catch (error: any) {
      console.error('❌ Error fetching public clients:', error)
      toast.error('Erro ao carregar clientes da plataforma')
    } finally {
      setLoadingClients(false)
    }
  }

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault()
    
    try {
      let workshopIdToUse = formData.workshopId

      // Se escolheu criar nova oficina
      if (formData.createNewWorkshop) {
        if (!formData.workshopName.trim()) {
          toast.error('Nome da oficina é obrigatório')
          return
        }

        console.log('📝 Creating new workshop:', formData.workshopName)
        
        // Criar nova workshop
        const workshopResponse = await fetch(
          `https://${projectId}.supabase.co/functions/v1/make-server-6971b43c/admin/workshops`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${accessToken}`,
            },
            body: JSON.stringify({
              name: formData.workshopName
            }),
          }
        )

        const workshopData = await workshopResponse.json()

        if (!workshopResponse.ok) {
          toast.error('Erro ao criar oficina: ' + workshopData.error)
          return
        }

        workshopIdToUse = workshopData.workshop.id
        console.log('✅ Workshop created:', workshopIdToUse)
        
        // Atualizar lista de workshops
        await fetchWorkshops()
      } else {
        // Validar que selecionou uma workshop
        if (!workshopIdToUse) {
          toast.error('Selecione uma oficina ou crie uma nova')
          return
        }
      }

      console.log('📝 Creating user with workshopId:', workshopIdToUse)

      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-6971b43c/admin/users`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${accessToken}`,
          },
          body: JSON.stringify({
            email: formData.email,
            password: formData.password,
            name: formData.name,
            role: formData.role,
            workshopId: workshopIdToUse
          }),
        }
      )

      const data = await response.json()

      if (response.ok) {
        toast.success('Conta criada com sucesso!')
        setCreateDialogOpen(false)
        setFormData({
          email: '',
          password: '',
          name: '',
          role: 'rececionista',
          workshopId: '',
          workshopName: '',
          createNewWorkshop: false
        })
        fetchUsers()
      } else {
        toast.error('Erro ao criar conta: ' + data.error)
      }
    } catch (error) {
      console.error('Error creating user:', error)
      toast.error('Erro ao criar conta')
    }
  }

  const handleUpdateUser = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!selectedUser) return

    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-6971b43c/admin/users/${selectedUser.id}`,
        {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${accessToken}`,
          },
          body: JSON.stringify(formData),
        }
      )

      const data = await response.json()

      if (response.ok) {
        toast.success('Conta atualizada com sucesso!')
        setEditDialogOpen(false)
        setSelectedUser(null)
        setFormData({
          email: '',
          password: '',
          name: '',
          role: 'rececionista',
          workshopName: ''
        })
        fetchUsers()
      } else {
        toast.error('Erro ao atualizar conta: ' + data.error)
      }
    } catch (error) {
      console.error('Error updating user:', error)
      toast.error('Erro ao atualizar conta')
    }
  }

  const handleBlockUser = async (userId: string, block: boolean) => {
    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-6971b43c/admin/users/${userId}/block`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${accessToken}`,
          },
          body: JSON.stringify({ block }),
        }
      )

      const data = await response.json()

      if (response.ok) {
        toast.success(block ? 'Conta bloqueada!' : 'Conta desbloqueada!')
        fetchUsers()
      } else {
        toast.error('Erro ao atualizar estado: ' + data.error)
      }
    } catch (error) {
      console.error('Error blocking user:', error)
      toast.error('Erro ao atualizar estado')
    }
  }

  const handleDeleteUser = async () => {
    if (!selectedUser) return

    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-6971b43c/admin/users/${selectedUser.id}`,
        {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${accessToken}`,
          },
        }
      )

      const data = await response.json()

      if (response.ok) {
        toast.success('Conta eliminada com sucesso!')
        setDeleteDialogOpen(false)
        setSelectedUser(null)
        fetchUsers()
      } else {
        toast.error('Erro ao eliminar conta: ' + data.error)
      }
    } catch (error) {
      console.error('Error deleting user:', error)
      toast.error('Erro ao eliminar conta')
    }
  }

  const openEditDialog = (user: UserAccount) => {
    setSelectedUser(user)
    setFormData({
      email: user.email,
      password: '',
      name: user.name,
      role: user.role,
      workshopId: user.workshopId || '',
      workshopName: user.workshopName || '',
      createNewWorkshop: false
    })
    setEditDialogOpen(true)
  }

  const openDeleteDialog = (user: UserAccount) => {
    setSelectedUser(user)
    setDeleteDialogOpen(true)
  }

  const openEditWorkshopDialog = (workshop: Workshop) => {
    setSelectedWorkshop(workshop)
    setWorkshopFormData({
      name: workshop.name,
      nif: workshop.nif || '',
      address: workshop.address || '',
      phone: workshop.phone || '',
      email: workshop.email || ''
    })
    setEditWorkshopDialogOpen(true)
  }

  const handleUpdateWorkshop = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!selectedWorkshop) return

    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-6971b43c/admin/workshops/${selectedWorkshop.id}`,
        {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${accessToken}`,
          },
          body: JSON.stringify(workshopFormData),
        }
      )

      const data = await response.json()

      if (response.ok) {
        toast.success('Oficina atualizada com sucesso!')
        setEditWorkshopDialogOpen(false)
        setSelectedWorkshop(null)
        setWorkshopFormData({
          name: '',
          nif: '',
          address: '',
          phone: '',
          email: ''
        })
        fetchWorkshops()
        fetchUsers() // Refresh users to update workshop names
      } else {
        toast.error('Erro ao atualizar oficina: ' + data.error)
      }
    } catch (error) {
      console.error('Error updating workshop:', error)
      toast.error('Erro ao atualizar oficina')
    }
  }

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!selectedWorkshop || !e.target.files || e.target.files.length === 0) return

    const file = e.target.files[0]
    
    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/svg+xml']
    if (!allowedTypes.includes(file.type)) {
      toast.error('Tipo de ficheiro inválido. Apenas JPEG, PNG, WEBP e SVG são permitidos')
      return
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Ficheiro muito grande. Tamanho máximo é 5MB')
      return
    }

    setUploadingLogo(true)

    try {
      const formData = new FormData()
      formData.append('logo', file)

      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-6971b43c/admin/workshops/${selectedWorkshop.id}/logo`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${accessToken}`,
          },
          body: formData,
        }
      )

      const data = await response.json()

      if (response.ok) {
        toast.success('Logotipo carregado com sucesso!')
        // Update the workshop with the new logo URL
        setSelectedWorkshop({
          ...selectedWorkshop,
          logoUrl: data.logoUrl,
          logoPath: data.logoPath
        })
        fetchWorkshops()
      } else {
        toast.error('Erro ao carregar logotipo: ' + data.error)
      }
    } catch (error) {
      console.error('Error uploading logo:', error)
      toast.error('Erro ao carregar logotipo')
    } finally {
      setUploadingLogo(false)
    }
  }

  // Filtrar utilizadores baseado no campo de pesquisa
  const filteredUsers = users.filter(user => {
    if (!searchFilter.trim()) return true
    const searchLower = searchFilter.toLowerCase()
    return (
      user.workshopName?.toLowerCase().includes(searchLower) ||
      user.workshopId?.toLowerCase().includes(searchLower) ||
      user.name.toLowerCase().includes(searchLower) ||
      user.email.toLowerCase().includes(searchLower)
    )
  })

  return (
    <div className="min-h-screen bg-white relative overflow-hidden p-4">
      {/* Animated Background */}
      <div className="fixed inset-0 -z-10">
        <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-blue-50 via-white to-orange-50"></div>
        <div className="absolute top-20 right-0 w-[600px] h-[600px] bg-blue-400/20 rounded-full blur-3xl"></div>
        <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-orange-400/20 rounded-full blur-3xl"></div>
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] bg-blue-500/10 rounded-full blur-3xl"></div>
      </div>

      <div className="max-w-7xl mx-auto">
        <Card className="border-0 bg-white/80 backdrop-blur-xl shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-600 via-orange-500 to-blue-600"></div>
          <CardHeader className="pb-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="relative">
                  <div className="absolute inset-0 bg-gradient-to-br from-blue-500 to-orange-500 rounded-2xl blur opacity-40"></div>
                  <div className="relative h-14 w-14 rounded-2xl bg-gradient-to-br from-blue-600 to-orange-500 flex items-center justify-center shadow-lg">
                    <Shield className="h-7 w-7 text-white" />
                  </div>
                </div>
                <div>
                  <CardTitle className="text-2xl bg-gradient-to-r from-blue-600 to-orange-600 bg-clip-text text-transparent">
                    Plataforma Gestão Oficinal
                  </CardTitle>
                  <CardDescription className="text-base mt-1">
                    Gestão completa de oficinas, utilizadores e pedidos
                  </CardDescription>
                </div>
              </div>
              <div className="relative group">
                <div className="absolute inset-0 bg-gradient-to-r from-red-600 to-orange-500 rounded-lg blur opacity-50 group-hover:opacity-75 transition-opacity"></div>
                <Button 
                  onClick={onBack}
                  className="relative bg-gradient-to-r from-red-600 to-orange-500 hover:from-red-700 hover:to-orange-600 text-white border-0 shadow-lg"
                >
                  <LogOut className="h-4 w-4 mr-2" />
                  Terminar Sessão
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent className="relative">
            <Tabs defaultValue="users" className="w-full">
              <TabsList className="mb-8 p-1.5 bg-gradient-to-r from-blue-50 to-orange-50 border border-blue-100">
                <TabsTrigger 
                  value="users" 
                  className="flex items-center gap-2 data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-600 data-[state=active]:to-orange-500 data-[state=active]:text-white data-[state=active]:shadow-lg"
                >
                  <User className="h-4 w-4" />
                  Utilizadores
                </TabsTrigger>
                <TabsTrigger 
                  value="workshop-management" 
                  className="flex items-center gap-2 data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-600 data-[state=active]:to-orange-500 data-[state=active]:text-white data-[state=active]:shadow-lg"
                >
                  <Building2 className="h-4 w-4" />
                  Gestão de Oficinas
                </TabsTrigger>
                <TabsTrigger 
                  value="platform-public" 
                  className="flex items-center gap-2 data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-600 data-[state=active]:to-orange-500 data-[state=active]:text-white data-[state=active]:shadow-lg"
                >
                  <Globe className="h-4 w-4" />
                  Gestão Plataforma Pública
                </TabsTrigger>
                <TabsTrigger 
                  value="moloni" 
                  className="flex items-center gap-2 data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-600 data-[state=active]:to-orange-500 data-[state=active]:text-white data-[state=active]:shadow-lg"
                >
                  <Receipt className="h-4 w-4" />
                  API MOLONI
                </TabsTrigger>
                <TabsTrigger 
                  value="decoder" 
                  className="flex items-center gap-2 data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-600 data-[state=active]:to-orange-500 data-[state=active]:text-white data-[state=active]:shadow-lg"
                >
                  <Search className="h-4 w-4" />
                  Descodificador de Matrículas
                </TabsTrigger>
                <TabsTrigger 
                  value="vin-test" 
                  className="flex items-center gap-2 data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-600 data-[state=active]:to-orange-500 data-[state=active]:text-white data-[state=active]:shadow-lg"
                >
                  <Database className="h-4 w-4" />
                  Diagnóstico VIN Decoder
                </TabsTrigger>
                <TabsTrigger 
                  value="documentation" 
                  className="flex items-center gap-2 data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-600 data-[state=active]:to-orange-500 data-[state=active]:text-white data-[state=active]:shadow-lg"
                >
                  <BookOpen className="h-4 w-4" />
                  Documentação
                </TabsTrigger>
                <TabsTrigger 
                  value="audit" 
                  className="flex items-center gap-2 data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-600 data-[state=active]:to-orange-500 data-[state=active]:text-white data-[state=active]:shadow-lg"
                >
                  <Shield className="h-4 w-4" />
                  Auditoria
                </TabsTrigger>
              </TabsList>

              <TabsContent value="users">
                <div className="mb-8 flex items-center gap-4">
                  <div className="relative group">
                    <div className="absolute inset-0 bg-gradient-to-r from-blue-600 to-orange-500 rounded-lg blur opacity-50 group-hover:opacity-75 transition-opacity"></div>
                    <Button 
                      onClick={() => setCreateDialogOpen(true)}
                      className="relative bg-gradient-to-r from-blue-600 to-orange-500 hover:from-blue-700 hover:to-orange-600 text-white border-0 shadow-lg"
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Criar Nova Conta
                    </Button>
                  </div>
                  
                  <div className="flex-1 max-w-sm relative">
                    <div className="absolute left-3 top-1/2 transform -translate-y-1/2 h-8 w-8 rounded-lg bg-blue-600 flex items-center justify-center">
                      <Search className="h-4 w-4 text-white" />
                    </div>
                    <Input
                      placeholder="Pesquisar por oficina, ID ou utilizador..."
                      value={searchFilter}
                      onChange={(e) => setSearchFilter(e.target.value)}
                      className="pl-12 border-blue-200 focus:border-blue-500 focus:ring-blue-500"
                    />
                  </div>
                  
                  {searchFilter && (
                    <Badge className="bg-gradient-to-r from-blue-600 to-orange-500 text-white border-0 px-4 py-1.5">
                      {filteredUsers.length} resultado{filteredUsers.length !== 1 ? 's' : ''}
                    </Badge>
                  )}
                </div>

            {loading ? (
              <div className="text-center py-12">
                <div className="inline-block h-12 w-12 rounded-xl bg-gradient-to-br from-blue-600 to-orange-500 animate-pulse mb-4"></div>
                <p className="text-gray-600">A carregar contas...</p>
              </div>
            ) : error ? (
              <div className="text-center py-8 space-y-4">
                <div className="p-6 bg-gradient-to-br from-red-50 to-orange-50 border-2 border-red-200 rounded-xl shadow-lg">
                  <p className="font-bold text-red-800 mb-2 text-lg">❌ Erro ao Carregar Utilizadores</p>
                  <p className="text-sm text-red-700">{error}</p>
                </div>
                <div className="text-sm text-gray-600">
                  <p className="mb-3 font-semibold">Passos de diagnóstico:</p>
                  <ol className="text-left max-w-md mx-auto space-y-2">
                    <li className="p-2 bg-blue-50 rounded-lg">1. Verifique a consola do navegador (F12) para mais detalhes</li>
                    <li className="p-2 bg-orange-50 rounded-lg">2. Verifique se o token de acesso é válido</li>
                    <li className="p-2 bg-blue-50 rounded-lg">3. Verifique se o backend está ativo</li>
                  </ol>
                </div>
                <div className="flex gap-3 justify-center">
                  <Button 
                    onClick={fetchUsers} 
                    variant="outline"
                    className="border-blue-200 hover:bg-blue-50"
                  >
                    🔄 Tentar Novamente
                  </Button>
                  <Button 
                    onClick={onBack} 
                    className="bg-gradient-to-r from-blue-600 to-orange-500 hover:from-blue-700 hover:to-orange-600 text-white"
                  >
                    ← Voltar ao Login
                  </Button>
                </div>
              </div>
            ) : users.length === 0 ? (
              <div className="text-center py-12 px-4">
                <div className="inline-block h-16 w-16 rounded-2xl bg-gradient-to-br from-blue-100 to-orange-100 flex items-center justify-center mb-4">
                  <User className="h-8 w-8 text-blue-600" />
                </div>
                <p className="text-gray-600">Nenhuma conta encontrada</p>
              </div>
            ) : filteredUsers.length === 0 ? (
              <div className="text-center py-12 px-4">
                <div className="inline-block h-16 w-16 rounded-2xl bg-gradient-to-br from-blue-100 to-orange-100 flex items-center justify-center mb-4">
                  <Search className="h-8 w-8 text-orange-600" />
                </div>
                <p className="text-gray-600">Nenhum resultado encontrado para "{searchFilter}"</p>
              </div>
            ) : (
              <div className="rounded-xl border border-blue-100 overflow-hidden bg-white/60 backdrop-blur-xl shadow-lg">
              <Table>
                <TableHeader>
                  <TableRow className="bg-gradient-to-r from-blue-50 to-orange-50 border-b-2 border-blue-200">
                    <TableHead className="font-bold text-blue-900">Oficina</TableHead>
                    <TableHead className="font-bold text-blue-900">ID da Oficina</TableHead>
                    <TableHead className="font-bold text-blue-900">Nome</TableHead>
                    <TableHead className="font-bold text-blue-900">Email</TableHead>
                    <TableHead className="font-bold text-blue-900">Função</TableHead>
                    <TableHead className="font-bold text-blue-900">Estado</TableHead>
                    <TableHead className="font-bold text-blue-900">Data de Criação</TableHead>
                    <TableHead className="text-right font-bold text-blue-900">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredUsers.map((user) => (
                    <TableRow key={user.id} className="hover:bg-blue-50/50 transition-colors">
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <div className="h-6 w-6 rounded-lg bg-blue-600 flex items-center justify-center">
                            <Building2 className="h-3 w-3 text-white" />
                          </div>
                          <span className="max-w-[150px] truncate font-medium" title={user.workshopName || '-'}>
                            {user.workshopName || '-'}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <code className="text-xs bg-gradient-to-r from-blue-100 to-orange-100 px-2 py-1 rounded-lg font-mono border border-blue-200" title={user.workshopId || '-'}>
                          {user.workshopId ? user.workshopId.substring(0, 8) + '...' : '-'}
                        </code>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <div className="h-6 w-6 rounded-lg bg-orange-500 flex items-center justify-center">
                            <User className="h-3 w-3 text-white" />
                          </div>
                          <span className="font-medium">{user.name}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Mail className="h-4 w-4 text-blue-600" />
                          <span className="text-gray-700">{user.email}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge 
                          variant={user.role === 'admin' || user.role === 'administrador' ? 'default' : 'secondary'}
                          className={user.role === 'admin' || user.role === 'administrador' ? 'bg-gradient-to-r from-blue-600 to-orange-500 text-white border-0' : 'bg-blue-100 text-blue-700 border-blue-200'}
                        >
                          {user.role === 'admin' ? 'Admin' :
                           user.role === 'administrador' ? 'Administrador' :
                           user.role === 'tecnico' ? 'Técnico' :
                           'Rececionista'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge 
                          variant={user.banned ? 'destructive' : 'default'}
                          className={user.banned ? 'bg-red-500 text-white border-0' : 'bg-green-500 text-white border-0'}
                        >
                          {user.banned ? 'Bloqueado' : 'Ativo'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <span className="text-gray-600">{new Date(user.createdAt).toLocaleDateString('pt-PT')}</span>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => openEditDialog(user)}
                            className="hover:bg-blue-50 hover:text-blue-600"
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleBlockUser(user.id, !user.banned)}
                            className={user.banned ? 'hover:bg-green-50' : 'hover:bg-orange-50'}
                          >
                            {user.banned ? (
                              <CheckCircle className="h-4 w-4 text-green-600" />
                            ) : (
                              <Ban className="h-4 w-4 text-orange-600" />
                            )}
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => openDeleteDialog(user)}
                            className="hover:bg-red-50 hover:text-red-600"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              </div>
            )}
              </TabsContent>

              <TabsContent value="workshop-management">
                <Tabs defaultValue="workshops-list" className="w-full">
                  <TabsList className="mb-6 p-1 bg-gradient-to-r from-blue-100 to-orange-100 border border-blue-200">
                    <TabsTrigger 
                      value="workshops-list" 
                      className="flex items-center gap-2 data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-600 data-[state=active]:to-orange-500 data-[state=active]:text-white"
                    >
                      <Building2 className="h-4 w-4" />
                      Oficinas
                    </TabsTrigger>
                    <TabsTrigger 
                      value="workshop-clients-db" 
                      className="flex items-center gap-2 data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-600 data-[state=active]:to-orange-500 data-[state=active]:text-white"
                    >
                      <Users className="h-4 w-4" />
                      Clientes BD Oficinas
                    </TabsTrigger>
                    <TabsTrigger 
                      value="active-modules" 
                      className="flex items-center gap-2 data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-600 data-[state=active]:to-orange-500 data-[state=active]:text-white"
                    >
                      <Settings className="h-4 w-4" />
                      Módulos Ativos em Oficinas
                    </TabsTrigger>
                  </TabsList>

                  <TabsContent value="workshops-list">
                    <div className="space-y-6">
                      {/* Header com contador e botão de atualizar */}
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Building2 className="h-5 w-5 text-blue-600" />
                          <h3 className="font-semibold text-gray-900">
                            Total: {workshops.length} oficina{workshops.length !== 1 ? 's' : ''}
                          </h3>
                        </div>
                        <Button 
                          onClick={fetchWorkshops}
                          disabled={loadingWorkshops}
                          className="bg-gradient-to-r from-blue-600 to-orange-500 hover:from-blue-700 hover:to-orange-600 text-white border-0 shadow-lg"
                        >
                          <RefreshCw className={`h-4 w-4 mr-2 ${loadingWorkshops ? 'animate-spin' : ''}`} />
                          {loadingWorkshops ? 'A atualizar...' : 'Atualizar'}
                        </Button>
                      </div>
                  <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                    {workshops.map((workshop) => (
                      <Card key={workshop.id} className="hover:shadow-2xl transition-all hover:-translate-y-1 border-0 bg-white/80 backdrop-blur-xl relative overflow-hidden group">
                        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500 to-orange-500"></div>
                        <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-orange-500/5 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                        <CardHeader className="relative">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <CardTitle className="text-lg bg-gradient-to-r from-blue-600 to-orange-600 bg-clip-text text-transparent">{workshop.name}</CardTitle>
                              <CardDescription className="mt-2">
                                <code className="text-xs bg-gradient-to-r from-blue-100 to-orange-100 px-2 py-1 rounded-lg font-mono border border-blue-200">
                                  {workshop.id.substring(0, 8)}...
                                </code>
                              </CardDescription>
                            </div>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => openEditWorkshopDialog(workshop)}
                              className="hover:bg-blue-50 hover:text-blue-600"
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                          </div>
                        </CardHeader>
                        <CardContent className="space-y-3 relative">
                          {workshop.logoUrl && (
                            <div className="mb-4 flex justify-center p-3 bg-gradient-to-br from-blue-50 to-orange-50 rounded-xl border border-blue-100">
                              <img
                                src={workshop.logoUrl}
                                alt={`Logo ${workshop.name}`}
                                className="h-16 w-auto object-contain"
                              />
                            </div>
                          )}
                          <div className="text-sm space-y-2">
                            {workshop.nif && (
                              <div className="flex items-center gap-2 p-2 bg-blue-50 rounded-lg">
                                <span className="font-semibold text-blue-900">NIF:</span>
                                <span className="text-gray-700">{workshop.nif}</span>
                              </div>
                            )}
                            {workshop.phone && (
                              <div className="flex items-center gap-2 p-2 bg-orange-50 rounded-lg">
                                <span className="font-semibold text-orange-900">Telefone:</span>
                                <span className="text-gray-700">{workshop.phone}</span>
                              </div>
                            )}
                            {workshop.email && (
                              <div className="flex items-center gap-2 p-2 bg-blue-50 rounded-lg">
                                <span className="font-semibold text-blue-900">Email:</span>
                                <span className="text-gray-700">{workshop.email}</span>
                              </div>
                            )}
                            {workshop.address && (
                              <div className="flex items-start gap-2 p-2 bg-orange-50 rounded-lg">
                                <span className="font-semibold text-orange-900">Morada:</span>
                                <span className="text-gray-700 flex-1">{workshop.address}</span>
                              </div>
                            )}
                          </div>
                          <div className="pt-3 flex items-center justify-between border-t-2 border-blue-100">
                            <Badge 
                              variant={workshop.isActive ? 'default' : 'secondary'}
                              className={workshop.isActive ? 'bg-green-500 text-white border-0' : 'bg-gray-300 text-gray-700 border-0'}
                            >
                              {workshop.isActive ? 'Ativa' : 'Inativa'}
                            </Badge>
                            <span className="text-sm font-semibold text-blue-600">
                              {workshop.userCount || 0} utilizador{workshop.userCount !== 1 ? 'es' : ''}
                            </span>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                  
                  {workshops.length === 0 && (
                    <div className="text-center py-12">
                      <div className="inline-block h-20 w-20 rounded-2xl bg-gradient-to-br from-blue-100 to-orange-100 flex items-center justify-center mb-4">
                        <Building2 className="h-10 w-10 text-blue-600" />
                      </div>
                      <p className="text-gray-600">Nenhuma oficina encontrada</p>
                    </div>
                  )}
                </div>
              </TabsContent>

              <TabsContent value="workshop-clients-db">
                <WorkshopClientsDatabase accessToken={accessToken} />
              </TabsContent>

              <TabsContent value="active-modules">
                <div className="space-y-6">
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex-1">
                      <h3 className="text-xl font-bold bg-gradient-to-r from-blue-600 to-orange-600 bg-clip-text text-transparent">
                        Configuração de Módulos por Oficina
                      </h3>
                      <p className="text-sm text-gray-600 mt-1">
                        Configure quais módulos cada oficina pode aceder
                      </p>
                    </div>
                  </div>

                  <div className="mb-6">
                    <Label htmlFor="workshop-filter" className="text-base font-semibold text-gray-700 mb-2 block">
                      Filtrar por Oficina
                    </Label>
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                      <Input
                        id="workshop-filter"
                        type="text"
                        placeholder="Digite o nome ou ID da oficina..."
                        value={workshopModulesFilter}
                        onChange={(e) => setWorkshopModulesFilter(e.target.value)}
                        className="pl-9 border-blue-200 focus:border-blue-400 focus:ring-blue-400"
                      />
                    </div>
                  </div>

                  <div className="space-y-4">
                    {workshops
                      .filter(workshop => {
                        if (!workshopModulesFilter.trim()) return true
                        const filterLower = workshopModulesFilter.toLowerCase()
                        return (
                          workshop.name.toLowerCase().includes(filterLower) ||
                          workshop.id.toLowerCase().includes(filterLower)
                        )
                      })
                      .map((workshop) => (
                        <Card key={workshop.id} className="border-0 shadow-lg hover:shadow-2xl transition-all bg-white/80 backdrop-blur-xl">
                          <CardHeader>
                            <div className="flex items-center gap-3">
                              <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-blue-500 to-orange-500 flex items-center justify-center">
                                <Building2 className="h-5 w-5 text-white" />
                              </div>
                              <div className="flex-1">
                                <CardTitle className="text-lg bg-gradient-to-r from-blue-600 to-orange-600 bg-clip-text text-transparent">
                                  {workshop.name}
                                </CardTitle>
                                <CardDescription>
                                  <code className="text-xs bg-gradient-to-r from-blue-100 to-orange-100 px-2 py-1 rounded-lg font-mono border border-blue-200">
                                    {workshop.id}
                                  </code>
                                </CardDescription>
                              </div>
                            </div>
                          </CardHeader>
                          <CardContent>
                            <ModulesConfig workshopId={workshop.id} accessToken={accessToken} />
                          </CardContent>
                        </Card>
                      ))}
                  </div>

                  {workshops.filter(workshop => {
                    if (!workshopModulesFilter.trim()) return true
                    const filterLower = workshopModulesFilter.toLowerCase()
                    return (
                      workshop.name.toLowerCase().includes(filterLower) ||
                      workshop.id.toLowerCase().includes(filterLower)
                    )
                  }).length === 0 && (
                    <div className="text-center py-12">
                      <div className="inline-block h-20 w-20 rounded-2xl bg-gradient-to-br from-blue-100 to-orange-100 flex items-center justify-center mb-4">
                        <Search className="h-10 w-10 text-blue-600" />
                      </div>
                      <p className="text-gray-600">Nenhuma oficina encontrada com esse filtro</p>
                    </div>
                  )}
                </div>
              </TabsContent>
            </Tabs>
          </TabsContent>

              <TabsContent value="platform-public">
                <Tabs defaultValue="platform-clients-list" className="w-full">
                  <TabsList className="mb-6 p-1 bg-gradient-to-r from-blue-100 to-orange-100 border border-blue-200">
                    <TabsTrigger 
                      value="platform-clients-list" 
                      className="flex items-center gap-2 data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-600 data-[state=active]:to-orange-500 data-[state=active]:text-white"
                    >
                      <Users className="h-4 w-4" />
                      Clientes
                    </TabsTrigger>
                    <TabsTrigger 
                      value="platform-requests" 
                      className="flex items-center gap-2 data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-600 data-[state=active]:to-orange-500 data-[state=active]:text-white"
                    >
                      <FileText className="h-4 w-4" />
                      Pedidos Plataforma
                    </TabsTrigger>
                    <TabsTrigger 
                      value="platform-banners" 
                      className="flex items-center gap-2 data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-600 data-[state=active]:to-orange-500 data-[state=active]:text-white"
                    >
                      <Image className="h-4 w-4" />
                      Banners
                    </TabsTrigger>
                    <TabsTrigger 
                      value="platform-logos" 
                      className="flex items-center gap-2 data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-600 data-[state=active]:to-orange-500 data-[state=active]:text-white"
                    >
                      <Upload className="h-4 w-4" />
                      Gestão de Logotipos
                    </TabsTrigger>
                  </TabsList>

                  <TabsContent value="platform-clients-list">
                    <div className="space-y-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="text-xl font-bold bg-gradient-to-r from-blue-600 to-orange-600 bg-clip-text text-transparent">
                            Clientes da Plataforma Online
                          </h3>
                          <p className="text-sm text-gray-600 mt-1">
                            Lista de clientes registados no portal público com dados de acesso
                          </p>
                        </div>
                        <Badge className="bg-gradient-to-r from-blue-600 to-orange-500 text-white border-0 px-4 py-2">
                          {publicClients.length} cliente{publicClients.length !== 1 ? 's' : ''}
                        </Badge>
                      </div>

                      {loadingClients ? (
                        <div className="text-center py-12">
                          <div className="inline-block h-12 w-12 rounded-xl bg-gradient-to-br from-blue-600 to-orange-500 animate-pulse mb-4"></div>
                          <p className="text-gray-600">A carregar clientes...</p>
                        </div>
                      ) : publicClients.length === 0 ? (
                        <div className="text-center py-12 px-4">
                          <div className="inline-block h-16 w-16 rounded-2xl bg-gradient-to-br from-blue-100 to-orange-100 flex items-center justify-center mb-4">
                            <Users className="h-8 w-8 text-blue-600" />
                          </div>
                          <p className="text-gray-600">Nenhum cliente registado na plataforma</p>
                          <p className="text-sm text-gray-500 mt-2">
                            Os clientes podem se registar através do portal público
                          </p>
                        </div>
                      ) : (
                        <div className="rounded-xl border border-blue-100 overflow-hidden bg-white/60 backdrop-blur-xl shadow-lg">
                          <Table>
                            <TableHeader>
                              <TableRow className="bg-gradient-to-r from-blue-50 to-orange-50 border-b-2 border-blue-200">
                                <TableHead className="font-bold text-blue-900">ID Cliente</TableHead>
                                <TableHead className="font-bold text-blue-900">Nome</TableHead>
                                <TableHead className="font-bold text-blue-900">Email (Login)</TableHead>
                                <TableHead className="font-bold text-blue-900">Telefone</TableHead>
                                <TableHead className="font-bold text-blue-900">Estado</TableHead>
                                <TableHead className="font-bold text-blue-900">Último Acesso</TableHead>
                                <TableHead className="font-bold text-blue-900">Data Registo</TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {publicClients.map((client) => (
                                <TableRow key={client.id} className="hover:bg-blue-50/50 transition-colors border-b border-blue-100">
                                  <TableCell>
                                    <code className="text-xs bg-gradient-to-r from-blue-100 to-orange-100 px-2 py-1 rounded-lg font-mono border border-blue-200">
                                      {client.clientId.substring(0, 8)}...
                                    </code>
                                  </TableCell>
                                  <TableCell>
                                    <div className="flex items-center gap-2">
                                      <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-blue-500 to-orange-500 flex items-center justify-center">
                                        <User className="h-4 w-4 text-white" />
                                      </div>
                                      <span className="font-semibold text-gray-800">{client.name}</span>
                                    </div>
                                  </TableCell>
                                  <TableCell>
                                    <div className="flex items-center gap-2">
                                      <Mail className="h-4 w-4 text-blue-600" />
                                      <span className="text-gray-700">{client.email}</span>
                                    </div>
                                  </TableCell>
                                  <TableCell>
                                    <span className="text-gray-600">{client.phone || '-'}</span>
                                  </TableCell>
                                  <TableCell>
                                    {client.emailConfirmed ? (
                                      <Badge className="bg-green-500 text-white border-0">
                                        <CheckCircle className="h-3 w-3 mr-1" />
                                        Ativo
                                      </Badge>
                                    ) : (
                                      <Badge variant="outline" className="border-orange-200 text-orange-700 bg-orange-50">
                                        Pendente
                                      </Badge>
                                    )}
                                  </TableCell>
                                  <TableCell>
                                    {client.lastLogin ? (
                                      <div className="flex flex-col">
                                        <Badge variant="outline" className="border-green-200 text-green-700 bg-green-50 w-fit">
                                          {new Date(client.lastLogin).toLocaleDateString('pt-PT')}
                                        </Badge>
                                        <span className="text-xs text-gray-500 mt-1">
                                          {new Date(client.lastLogin).toLocaleTimeString('pt-PT', { hour: '2-digit', minute: '2-digit' })}
                                        </span>
                                      </div>
                                    ) : (
                                      <Badge variant="outline" className="border-gray-200 text-gray-500">
                                        Nunca
                                      </Badge>
                                    )}
                                  </TableCell>
                                  <TableCell>
                                    <span className="text-gray-600">{new Date(client.createdAt).toLocaleDateString('pt-PT')}</span>
                                  </TableCell>
                                </TableRow>
                              ))}
                            </TableBody>
                          </Table>
                        </div>
                      )}
                    </div>
                  </TabsContent>

                  <TabsContent value="platform-requests">
                    <PlatformClientsModule accessToken={accessToken} />
                  </TabsContent>

                  <TabsContent value="platform-banners">
                    <BannerManagementModule accessToken={accessToken} />
                  </TabsContent>

                  <TabsContent value="platform-logos">
                    <LogoManagementModule accessToken={accessToken} />
                  </TabsContent>
                </Tabs>
              </TabsContent>

              <TabsContent value="moloni">
                <MoloniIntegrationModule accessToken={accessToken} />
              </TabsContent>

              <TabsContent value="decoder">
                <DecodificadorMatriculasModule />
              </TabsContent>

              <TabsContent value="vin-test">
                <VinDecoderTest accessToken={accessToken} />
              </TabsContent>

              <TabsContent value="documentation">
                <ProductionDocumentation />
              </TabsContent>

              <TabsContent value="audit">
                <AuditLogsModule accessToken={accessToken} />
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>

      {/* Create User Dialog */}
      <Dialog 
        open={createDialogOpen} 
        onOpenChange={(open) => {
          setCreateDialogOpen(open)
          if (!open) {
            // Reset form when closing dialog
            setFormData({
              email: '',
              password: '',
              name: '',
              role: 'rececionista',
              workshopId: '',
              workshopName: '',
              createNewWorkshop: false
            })
          }
        }}
      >
        <DialogContent className="dialog-fullscreen overflow-y-auto border-0 bg-white/95 backdrop-blur-xl shadow-2xl">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-600 to-orange-500"></div>
          <form onSubmit={handleCreateUser}>
            <DialogHeader className="pb-4">
              <div className="flex items-center gap-3 mb-2">
                <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-blue-600 to-orange-500 flex items-center justify-center">
                  <Plus className="h-5 w-5 text-white" />
                </div>
                <DialogTitle className="text-xl bg-gradient-to-r from-blue-600 to-orange-600 bg-clip-text text-transparent">
                  Criar Nova Conta
                </DialogTitle>
              </div>
              <DialogDescription className="text-base">
                Adicione uma nova conta de oficina ao sistema
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label className="text-gray-700 font-semibold">Oficina *</Label>
                <div className="space-y-3 p-3 bg-gradient-to-br from-blue-50 to-orange-50 rounded-xl border border-blue-100">
                  <div className="flex items-center space-x-2">
                    <input
                      type="radio"
                      id="existing-workshop"
                      name="workshop-option"
                      checked={!formData.createNewWorkshop}
                      onChange={() => setFormData({ ...formData, createNewWorkshop: false, workshopName: '' })}
                      className="h-4 w-4 text-blue-600"
                    />
                    <Label htmlFor="existing-workshop" className="cursor-pointer font-medium">
                      Selecionar oficina existente
                    </Label>
                  </div>
                  
                  {!formData.createNewWorkshop && (
                    <select
                      className="w-full rounded-lg border-2 border-blue-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 bg-white px-3 py-2"
                      value={formData.workshopId}
                      onChange={(e) => setFormData({ ...formData, workshopId: e.target.value })}
                      required={!formData.createNewWorkshop}
                    >
                      <option value="">Selecione uma oficina</option>
                      {workshops.filter(w => w.isActive).map((workshop) => (
                        <option key={workshop.id} value={workshop.id}>
                          {workshop.name} ({workshop.userCount || 0} utilizadores)
                        </option>
                      ))}
                    </select>
                  )}

                  <div className="flex items-center space-x-2">
                    <input
                      type="radio"
                      id="new-workshop"
                      name="workshop-option"
                      checked={formData.createNewWorkshop}
                      onChange={() => setFormData({ ...formData, createNewWorkshop: true, workshopId: '' })}
                      className="h-4 w-4 text-orange-600"
                    />
                    <Label htmlFor="new-workshop" className="cursor-pointer font-medium">
                      Criar nova oficina
                    </Label>
                  </div>

                  {formData.createNewWorkshop && (
                    <Input
                      placeholder="Nome da nova oficina"
                      value={formData.workshopName}
                      onChange={(e) => setFormData({ ...formData, workshopName: e.target.value })}
                      required={formData.createNewWorkshop}
                      className="border-orange-200 focus:border-orange-500 focus:ring-orange-500"
                    />
                  )}
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="create-name" className="text-gray-700 font-semibold">Nome do Responsável *</Label>
                <Input
                  id="create-name"
                  placeholder="João Silva"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                  className="border-blue-200 focus:border-blue-500 focus:ring-blue-500"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="create-email" className="text-gray-700 font-semibold">Email *</Label>
                <Input
                  id="create-email"
                  type="email"
                  placeholder="exemplo@email.com"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  required
                  className="border-blue-200 focus:border-blue-500 focus:ring-blue-500"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="create-password" className="text-gray-700 font-semibold">Password *</Label>
                <Input
                  id="create-password"
                  type="password"
                  placeholder="••••••••"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  required
                  minLength={6}
                  className="border-blue-200 focus:border-blue-500 focus:ring-blue-500"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="create-role" className="text-gray-700 font-semibold">Função *</Label>
                <select
                  id="create-role"
                  className="w-full rounded-lg border-2 border-orange-200 focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 bg-white px-3 py-2.5 font-medium"
                  value={formData.role}
                  onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                  required
                >
                  <option value="rececionista">Rececionista</option>
                  <option value="tecnico">Técnico</option>
                  <option value="administrador">Administrador</option>
                  <option value="admin">Admin (Super Utilizador)</option>
                </select>
              </div>
            </div>

            <DialogFooter className="gap-2">
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => setCreateDialogOpen(false)}
                className="border-blue-200 hover:bg-blue-50"
              >
                Cancelar
              </Button>
              <div className="relative group">
                <div className="absolute inset-0 bg-gradient-to-r from-blue-600 to-orange-500 rounded-lg blur opacity-50 group-hover:opacity-75 transition-opacity"></div>
                <Button 
                  type="submit"
                  className="relative bg-gradient-to-r from-blue-600 to-orange-500 hover:from-blue-700 hover:to-orange-600 text-white border-0"
                >
                  Criar Conta
                </Button>
              </div>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Edit User Dialog */}
      <Dialog 
        open={editDialogOpen} 
        onOpenChange={(open) => {
          setEditDialogOpen(open)
          if (!open) {
            setSelectedUser(null)
            setFormData({
              email: '',
              password: '',
              name: '',
              role: 'rececionista',
              workshopId: '',
              workshopName: '',
              createNewWorkshop: false
            })
          }
        }}
      >
        <DialogContent className="dialog-fullscreen overflow-y-auto border-0 bg-white/95 backdrop-blur-xl shadow-2xl">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-600 to-orange-500"></div>
          <form onSubmit={handleUpdateUser}>
            <DialogHeader className="pb-4">
              <div className="flex items-center gap-3 mb-2">
                <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-blue-600 to-orange-500 flex items-center justify-center">
                  <Edit className="h-5 w-5 text-white" />
                </div>
                <DialogTitle className="text-xl bg-gradient-to-r from-blue-600 to-orange-600 bg-clip-text text-transparent">
                  Editar Conta
                </DialogTitle>
              </div>
              <DialogDescription className="text-base">
                Atualize os dados da conta
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="edit-workshopName">Nome da Oficina</Label>
                <Input
                  id="edit-workshopName"
                  placeholder="Ex: Oficina Central Porto"
                  value={formData.workshopName}
                  onChange={(e) => setFormData({ ...formData, workshopName: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-name">Nome do Responsável *</Label>
                <Input
                  id="edit-name"
                  placeholder="João Silva"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-email">Email *</Label>
                <Input
                  id="edit-email"
                  type="email"
                  placeholder="exemplo@email.com"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-password">Nova Password (deixe vazio para manter)</Label>
                <Input
                  id="edit-password"
                  type="password"
                  placeholder="••••••••"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  minLength={6}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-role">Função *</Label>
                <select
                  id="edit-role"
                  className="w-full rounded-md border border-input bg-input-background px-3 py-2"
                  value={formData.role}
                  onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                  required
                >
                  <option value="rececionista">Rececionista</option>
                  <option value="tecnico">Técnico</option>
                  <option value="administrador">Administrador</option>
                  <option value="admin">Admin (Super Utilizador)</option>
                </select>
              </div>
            </div>

            <DialogFooter className="gap-2">
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => setEditDialogOpen(false)}
                className="border-blue-200 hover:bg-blue-50"
              >
                Cancelar
              </Button>
              <div className="relative group">
                <div className="absolute inset-0 bg-gradient-to-r from-blue-600 to-orange-500 rounded-lg blur opacity-50 group-hover:opacity-75 transition-opacity"></div>
                <Button 
                  type="submit"
                  className="relative bg-gradient-to-r from-blue-600 to-orange-500 hover:from-blue-700 hover:to-orange-600 text-white border-0"
                >
                  Guardar Alterações
                </Button>
              </div>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent className="border-0 bg-white/95 backdrop-blur-xl shadow-2xl">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-red-600 to-orange-500"></div>
          <AlertDialogHeader>
            <div className="flex items-center gap-3 mb-2">
              <div className="h-10 w-10 rounded-xl bg-red-600 flex items-center justify-center">
                <Trash2 className="h-5 w-5 text-white" />
              </div>
              <AlertDialogTitle className="text-xl text-red-800">Eliminar Conta</AlertDialogTitle>
            </div>
            <AlertDialogDescription className="text-base">
              Tem a certeza que deseja eliminar a conta de <strong className="text-red-700">{selectedUser?.name}</strong>?
              Esta ação não pode ser revertida.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="gap-2">
            <AlertDialogCancel className="border-blue-200 hover:bg-blue-50">Cancelar</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDeleteUser} 
              className="bg-red-600 text-white hover:bg-red-700 border-0"
            >
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Edit Workshop Dialog */}
      <Dialog 
        open={editWorkshopDialogOpen} 
        onOpenChange={(open) => {
          setEditWorkshopDialogOpen(open)
          if (!open) {
            setSelectedWorkshop(null)
            setWorkshopFormData({
              name: '',
              nif: '',
              address: '',
              phone: '',
              email: ''
            })
          }
        }}
      >
        <DialogContent className="dialog-fullscreen overflow-y-auto border-0 bg-white/95 backdrop-blur-xl shadow-2xl">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-600 to-orange-500"></div>
          <form onSubmit={handleUpdateWorkshop}>
            <DialogHeader className="pb-4">
              <div className="flex items-center gap-3 mb-2">
                <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-blue-600 to-orange-500 flex items-center justify-center">
                  <Building2 className="h-5 w-5 text-white" />
                </div>
                <DialogTitle className="text-xl bg-gradient-to-r from-blue-600 to-orange-600 bg-clip-text text-transparent">
                  Editar Ficha da Oficina
                </DialogTitle>
              </div>
              <DialogDescription className="text-base">
                Atualize os dados completos da oficina
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-6 py-4">
              {/* Logo Upload Section */}
              <div className="space-y-3 p-4 rounded-xl bg-gradient-to-br from-blue-50 to-orange-50 border-2 border-blue-100">
                <Label className="text-base font-bold text-blue-900">Logotipo da Oficina</Label>
                <p className="text-sm text-gray-600">
                  O logotipo aparecerá no painel de gestão, orçamentos, faturas e folhas de obra
                </p>
                
                {selectedWorkshop?.logoUrl && (
                  <div className="flex justify-center p-4 bg-white rounded border">
                    <img
                      src={selectedWorkshop.logoUrl}
                      alt="Logo atual"
                      className="h-24 w-auto object-contain"
                    />
                  </div>
                )}
                
                <div className="flex items-center gap-2">
                  <Label htmlFor="logo-upload" className="cursor-pointer">
                    <div className="flex items-center gap-2 px-4 py-2 border rounded-md hover:bg-slate-100 transition-colors">
                      <Upload className="h-4 w-4" />
                      <span>{uploadingLogo ? 'A carregar...' : 'Carregar Logotipo'}</span>
                    </div>
                    <input
                      id="logo-upload"
                      type="file"
                      accept="image/jpeg,image/jpg,image/png,image/webp,image/svg+xml"
                      onChange={handleLogoUpload}
                      className="hidden"
                      disabled={uploadingLogo}
                    />
                  </Label>
                  {selectedWorkshop?.logoUrl && (
                    <Badge variant="secondary" className="flex items-center gap-1">
                      <Image className="h-3 w-3" />
                      Logo ativo
                    </Badge>
                  )}
                </div>
                <p className="text-xs text-muted-foreground">
                  Formatos suportados: JPEG, PNG, WEBP, SVG (máx. 5MB)
                </p>
              </div>

              {/* Workshop Details */}
              <div className="grid gap-4">
                <div className="space-y-2">
                  <Label htmlFor="workshop-name">Nome da Oficina *</Label>
                  <Input
                    id="workshop-name"
                    placeholder="Ex: Oficina Central Porto"
                    value={workshopFormData.name}
                    onChange={(e) => setWorkshopFormData({ ...workshopFormData, name: e.target.value })}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="workshop-nif">Contribuinte (NIF) *</Label>
                  <Input
                    id="workshop-nif"
                    placeholder="Ex: 123456789"
                    value={workshopFormData.nif}
                    onChange={(e) => setWorkshopFormData({ ...workshopFormData, nif: e.target.value })}
                    required
                    maxLength={9}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="workshop-address">Morada Completa</Label>
                  <Input
                    id="workshop-address"
                    placeholder="Ex: Rua Example, 123, 4000-000 Porto"
                    value={workshopFormData.address}
                    onChange={(e) => setWorkshopFormData({ ...workshopFormData, address: e.target.value })}
                  />
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="workshop-phone">Número de Contacto</Label>
                    <Input
                      id="workshop-phone"
                      placeholder="Ex: +351 912 345 678"
                      value={workshopFormData.phone}
                      onChange={(e) => setWorkshopFormData({ ...workshopFormData, phone: e.target.value })}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="workshop-email">Email</Label>
                    <Input
                      id="workshop-email"
                      type="email"
                      placeholder="Ex: oficina@exemplo.pt"
                      value={workshopFormData.email}
                      onChange={(e) => setWorkshopFormData({ ...workshopFormData, email: e.target.value })}
                    />
                  </div>
                </div>
              </div>

              {selectedWorkshop && (
                <div className="pt-3 border-t">
                  <p className="text-sm text-muted-foreground">
                    <strong>ID da Oficina:</strong>{' '}
                    <code className="text-xs bg-slate-100 px-2 py-1 rounded">
                      {selectedWorkshop.id}
                    </code>
                  </p>
                  <p className="text-sm text-muted-foreground mt-1">
                    <strong>Criada em:</strong>{' '}
                    {new Date(selectedWorkshop.createdAt).toLocaleDateString('pt-PT', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    })}
                  </p>
                </div>
              )}
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setEditWorkshopDialogOpen(false)}>
                Cancelar
              </Button>
              <Button type="submit">Guardar Alterações</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
