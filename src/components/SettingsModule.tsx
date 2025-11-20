import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card'
import { Button } from './ui/button'
import { Input } from './ui/input'
import { Label } from './ui/label'
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from './ui/dialog'
import { Badge } from './ui/badge'
import { Alert, AlertDescription } from './ui/alert'
import { Separator } from './ui/separator'
import { Textarea } from './ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select'
import { 
  Building2, 
  Users, 
  MapPin, 
  Phone, 
  Mail, 
  FileText, 
  Save,
  Plus,
  Edit,
  Trash2,
  Shield,
  User,
  AlertCircle,
  Wrench,
  Clock,
  Euro,
  UserCog,
  Server,
  Upload,
  Eye,
  EyeOff,
  Globe,
  CreditCard,
  Percent,
  Smartphone,
  MapPinned,
  MapPinCheck,
  Loader2,
  Key,
  Layout,
  Copy,
  CheckCircle2,
  Code,
  FilePlus,
  Eye,
  Download,
  Upload,
  Globe2,
  Calculator,
  GitBranch,
  Type,
  Bold,
  Italic,
  Underline,
  List,
  Link,
  Image,
  Library,
  Star,
  Scan,
  FileImage
} from 'lucide-react'
import { toast } from 'sonner@2.0.3'
import { projectId, publicAnonKey } from '../utils/supabase/info'
import { useWorkshop, Workshop } from './WorkshopContext'

interface SettingsModuleProps {
  accessToken: string
}

interface CttAddress {
  morada: string
  porta: string
  localidade: string
  freguesia: string
  concelho: string
  distrito: string
  latitude: string
  longitude: string
  'codigo-postal': string
  'info-local': string
  'codigo-arteria': string
  'concelho-codigo': number
  'distrito-codigo': number
}

interface WorkshopUser {
  id: string
  email: string
  name: string
  role: 'admin' | 'technician' | 'receptionist'
  isActive: boolean
  createdAt: string
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
  createdAt: string
}

interface Template {
  id: string
  name: string
  type: 'pdf' | 'email'
  category: 'service-sheet' | 'budget' | 'invoice' | 'general'
  subject?: string // For email templates
  content: string
  isDefault: boolean
  createdAt: string
}

export function SettingsModule({ accessToken }: SettingsModuleProps) {
  const { workshop: currentWorkshop, setWorkshop, refreshWorkshop } = useWorkshop()
  const [activeTab, setActiveTab] = useState('workshop')
  const [userRole, setUserRole] = useState<string>('')
  
  // Workshop data state
  const [workshopData, setWorkshopData] = useState<Workshop>({
    id: '',
    name: '',
    address: '',
    postalCode: '',
    cp4: '',
    cp3: '',
    locality: '',
    country: 'Portugal',
    phone: '',
    phone2: '',
    email: '',
    nif: '',
    iban: '',
    website: '',
    defaultVatRate: 23,
    appDisplayName: '',
    nifApiKey: '',
    logoUrl: '',
    isActive: true
  })
  const [savingWorkshop, setSavingWorkshop] = useState(false)
  const [searchingPostalCode, setSearchingPostalCode] = useState(false)
  const [addressSelectionDialogOpen, setAddressSelectionDialogOpen] = useState(false)
  const [availableAddresses, setAvailableAddresses] = useState<CttAddress[]>([])

  // Users state
  const [users, setUsers] = useState<WorkshopUser[]>([])
  const [showUserDialog, setShowUserDialog] = useState(false)
  const [editingUser, setEditingUser] = useState<WorkshopUser | null>(null)
  const [userForm, setUserForm] = useState({
    name: '',
    email: '',
    password: '',
    role: 'receptionist' as 'admin' | 'technician' | 'receptionist'
  })
  const [savingUser, setSavingUser] = useState(false)

  // Labor Types state
  const [laborTypes, setLaborTypes] = useState<LaborType[]>([])
  const [showLaborDialog, setShowLaborDialog] = useState(false)
  const [editingLabor, setEditingLabor] = useState<LaborType | null>(null)
  const [laborForm, setLaborForm] = useState({
    name: '',
    hourlyRate: 0,
    description: ''
  })
  const [savingLabor, setSavingLabor] = useState(false)

  // Employees state
  const [employees, setEmployees] = useState<Employee[]>([])
  const [showEmployeeDialog, setShowEmployeeDialog] = useState(false)
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null)
  const [employeeForm, setEmployeeForm] = useState({
    name: '',
    email: '',
    phone: '',
    position: ''
  })
  const [savingEmployee, setSavingEmployee] = useState(false)

  // Email Server state
  const [emailServerData, setEmailServerData] = useState({
    description: '',
    email: '',
    smtpServer: '',
    smtpPort: '465',
    imapServer: '',
    imapPort: '993',
    username: '',
    password: '',
    confirmPassword: '',
    signatureUrl: ''
  })
  const [savingEmailServer, setSavingEmailServer] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [uploadingSignature, setUploadingSignature] = useState(false)

  // Templates state
  const [templates, setTemplates] = useState<Template[]>([])
  const [showTemplateDialog, setShowTemplateDialog] = useState(false)
  const [editingTemplate, setEditingTemplate] = useState<Template | null>(null)
  const [templateForm, setTemplateForm] = useState({
    name: '',
    type: 'pdf' as 'pdf' | 'email',
    category: 'service-sheet' as 'service-sheet' | 'budget' | 'invoice' | 'general',
    subject: '',
    content: '',
    language: 'pt' as 'pt' | 'en' | 'es' | 'fr'
  })
  const [savingTemplate, setSavingTemplate] = useState(false)
  const [showPreview, setShowPreview] = useState(false)
  const [previewContent, setPreviewContent] = useState('')
  const [editorMode, setEditorMode] = useState<'text' | 'wysiwyg'>('text')
  const [showLibrary, setShowLibrary] = useState(false)
  
  // OCR Template Generation
  const [showOcrDialog, setShowOcrDialog] = useState(false)
  const [ocrImage, setOcrImage] = useState<File | null>(null)
  const [ocrImagePreview, setOcrImagePreview] = useState<string | null>(null)
  const [processingOcr, setProcessingOcr] = useState(false)
  const [ocrResult, setOcrResult] = useState<string>('')
  
  // PDF OCR Template Generation
  const [showPdfDialog, setShowPdfDialog] = useState(false)
  const [pdfFile, setPdfFile] = useState<File | null>(null)
  const [processingPdf, setProcessingPdf] = useState(false)
  const [pdfResult, setPdfResult] = useState<string>('')

  useEffect(() => {
    loadUserProfile()
    loadWorkshopData()
    loadUsers()
    loadLaborTypes()
    loadTemplates()
    loadEmployees()
    loadEmailServerData()
  }, [])

  // Update local state when workshop context changes
  useEffect(() => {
    if (currentWorkshop) {
      // Split postalCode into cp4 and cp3 if it exists
      let cp4 = currentWorkshop.cp4 || ''
      let cp3 = currentWorkshop.cp3 || ''
      
      // If cp4 and cp3 don't exist but postalCode does, split it
      if (!cp4 && !cp3 && currentWorkshop.postalCode) {
        const parts = currentWorkshop.postalCode.split('-')
        if (parts.length === 2) {
          cp4 = parts[0]
          cp3 = parts[1]
        }
      }
      
      setWorkshopData({
        id: currentWorkshop.id,
        name: currentWorkshop.name,
        address: currentWorkshop.address || '',
        postalCode: currentWorkshop.postalCode || '',
        cp4: cp4,
        cp3: cp3,
        locality: currentWorkshop.locality || '',
        country: currentWorkshop.country || 'Portugal',
        phone: currentWorkshop.phone || '',
        phone2: currentWorkshop.phone2 || '',
        email: currentWorkshop.email || '',
        nif: currentWorkshop.nif || '',
        iban: currentWorkshop.iban || '',
        website: currentWorkshop.website || '',
        defaultVatRate: currentWorkshop.defaultVatRate || 23,
        appDisplayName: currentWorkshop.appDisplayName || '',
        nifApiKey: currentWorkshop.nifApiKey || '',
        logoUrl: currentWorkshop.logoUrl || '',
        isActive: currentWorkshop.isActive
      })
    }
  }, [currentWorkshop])

  const loadUserProfile = async () => {
    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-6971b43c/profile`,
        {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
          },
        }
      )
      
      if (response.ok) {
        const data = await response.json()
        console.log('👤 User profile loaded:', data)
        if (data.profile?.role) {
          setUserRole(data.profile.role)
        }
      }
    } catch (error) {
      console.error('❌ Error loading user profile:', error)
    }
  }

  const loadWorkshopData = async () => {
    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-6971b43c/workshop/profile`,
        {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
          },
        }
      )
      
      if (response.ok) {
        const data = await response.json()
        console.log('✅ Workshop data loaded:', data)
        if (data.workshop) {
          setWorkshopData(data.workshop)
        }
      } else {
        const errorData = await response.json()
        console.error('❌ Error response from server:', errorData)
        toast.error(errorData.error || 'Erro ao carregar dados da oficina')
      }
    } catch (error) {
      console.error('❌ Error loading workshop data:', error)
      toast.error('Erro ao carregar dados da oficina')
    }
  }

  const saveWorkshopData = async () => {
    if (!workshopData.name || !workshopData.email) {
      toast.error('Preencha pelo menos o nome e email da oficina')
      return
    }

    setSavingWorkshop(true)
    try {
      console.log('💾 Saving workshop data:', workshopData)
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-6971b43c/workshop/profile`,
        {
          method: 'PUT',
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(workshopData),
        }
      )
      
      console.log('📡 Response status:', response.status)
      
      if (response.ok) {
        const data = await response.json()
        console.log('✅ Workshop data saved successfully:', data)
        toast.success('Dados da oficina atualizados com sucesso!')
        // Update workshop context with the saved data
        if (data.workshop) {
          setWorkshop(data.workshop)
          setWorkshopData(data.workshop)
        }
        // Refresh workshop data from server
        await refreshWorkshop()
      } else {
        const errorText = await response.text()
        let errorData
        try {
          errorData = JSON.parse(errorText)
        } catch (e) {
          errorData = { error: errorText }
        }
        console.error('❌ Error response from server:', errorData)
        console.error('❌ Response status:', response.status)
        
        if (response.status === 403) {
          toast.error('Apenas administradores podem atualizar os dados da oficina')
        } else if (response.status === 404) {
          toast.error('Oficina não encontrada')
        } else {
          toast.error(errorData.error || 'Erro ao atualizar dados')
        }
      }
    } catch (error) {
      console.error('❌ Error saving workshop data:', error)
      toast.error('Erro ao guardar dados da oficina: ' + (error as Error).message)
    } finally {
      setSavingWorkshop(false)
    }
  }

  const searchPostalCode = async (postalCode: string) => {
    if (!postalCode || postalCode.length < 8) {
      toast.error('Por favor, insira um código postal válido (XXXX-XXX)')
      return
    }

    setSearchingPostalCode(true)
    try {
      console.log('🔍 Pesquisando código postal CTT:', postalCode)
      
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-6971b43c/postal-code/${encodeURIComponent(postalCode)}`,
        {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
          },
        }
      )

      if (response.ok) {
        const data = await response.json()
        console.log('✅ Resposta da API CTT:', data)
        
        if (data.addresses && data.addresses.length > 0) {
          setAvailableAddresses(data.addresses)
          
          // Se houver apenas uma morada, preencher automaticamente
          if (data.addresses.length === 1) {
            applyAddressToWorkshop(data.addresses[0])
            toast.success('Morada encontrada e preenchida automaticamente!')
          } else {
            // Se houver múltiplas moradas, mostrar diálogo de seleção
            setAddressSelectionDialogOpen(true)
            toast.info(`Encontradas ${data.addresses.length} moradas. Por favor, selecione uma.`)
          }
        } else {
          toast.error('Código postal não encontrado na base de dados CTT')
        }
      } else {
        const errorData = await response.json()
        console.error('❌ Erro da API:', errorData)
        toast.error(errorData.error || 'Erro ao pesquisar código postal')
      }
    } catch (error) {
      console.error('❌ Erro ao pesquisar código postal:', error)
      toast.error('Erro ao pesquisar código postal. Verifique a conexão.')
    } finally {
      setSearchingPostalCode(false)
    }
  }
  
  const applyAddressToWorkshop = (address: CttAddress) => {
    console.log('📍 Aplicando morada aos dados da oficina:', address)
    
    // Construir a morada completa
    let fullAddress = address.morada
    if (address['info-local']) {
      fullAddress += `, ${address['info-local']}`
    }
    if (address.porta) {
      fullAddress += `, ${address.porta}`
    }
    
    // Update workshop data
    setWorkshopData({
      ...workshopData,
      address: fullAddress.trim(),
      locality: address.localidade,
      country: 'Portugal'
    })
    
    console.log('✅ Dados da oficina atualizados:', {
      address: fullAddress.trim(),
      locality: address.localidade,
      country: 'Portugal'
    })
    
    // Fechar diálogo de seleção se estiver aberto
    setAddressSelectionDialogOpen(false)
    
    toast.success(`Morada preenchida: ${address.localidade}`)
  }

  const loadUsers = async () => {
    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-6971b43c/workshop/users`,
        {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
          },
        }
      )
      
      if (response.ok) {
        const data = await response.json()
        setUsers(data.users || [])
      }
    } catch (error) {
      console.error('Error loading users:', error)
      toast.error('Erro ao carregar utilizadores')
    }
  }

  const handleAddUser = () => {
    setEditingUser(null)
    setUserForm({
      name: '',
      email: '',
      password: '',
      role: 'receptionist'
    })
    setShowUserDialog(true)
  }

  const handleEditUser = (user: WorkshopUser) => {
    setEditingUser(user)
    setUserForm({
      name: user.name,
      email: user.email,
      password: '',
      role: user.role
    })
    setShowUserDialog(true)
  }

  const saveUser = async () => {
    if (!userForm.name || !userForm.email) {
      toast.error('Preencha o nome e email do utilizador')
      return
    }

    if (!editingUser && !userForm.password) {
      toast.error('Defina uma senha para o novo utilizador')
      return
    }

    setSavingUser(true)
    try {
      const url = editingUser
        ? `https://${projectId}.supabase.co/functions/v1/make-server-6971b43c/workshop/users/${editingUser.id}`
        : `https://${projectId}.supabase.co/functions/v1/make-server-6971b43c/workshop/users`

      const response = await fetch(url, {
        method: editingUser ? 'PUT' : 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(userForm),
      })
      
      if (response.ok) {
        toast.success(editingUser ? 'Utilizador atualizado!' : 'Utilizador criado com sucesso!')
        setShowUserDialog(false)
        loadUsers()
      } else {
        const error = await response.json()
        toast.error(error.error || 'Erro ao guardar utilizador')
      }
    } catch (error) {
      console.error('Error saving user:', error)
      toast.error('Erro ao guardar utilizador')
    } finally {
      setSavingUser(false)
    }
  }

  const deleteUser = async (userId: string) => {
    if (!confirm('Tem a certeza que deseja eliminar este utilizador?')) {
      return
    }

    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-6971b43c/workshop/users/${userId}`,
        {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${accessToken}`,
          },
        }
      )
      
      if (response.ok) {
        toast.success('Utilizador eliminado!')
        loadUsers()
      } else {
        const error = await response.json()
        toast.error(error.error || 'Erro ao eliminar utilizador')
      }
    } catch (error) {
      console.error('Error deleting user:', error)
      toast.error('Erro ao eliminar utilizador')
    }
  }

  const getRoleBadge = (role: string) => {
    switch (role) {
      case 'admin':
        return <Badge variant="default" className="bg-red-600">Administrador</Badge>
      case 'technician':
        return <Badge variant="default" className="bg-blue-600">Técnico</Badge>
      case 'receptionist':
        return <Badge variant="secondary">Rececionista</Badge>
      default:
        return <Badge variant="outline">{role}</Badge>
    }
  }

  // Labor Types Functions
  const loadLaborTypes = async () => {
    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-6971b43c/labor-types`,
        {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
          },
        }
      )
      
      if (response.ok) {
        const data = await response.json()
        setLaborTypes(data.laborTypes || [])
      }
    } catch (error) {
      console.error('Error loading labor types:', error)
    }
  }

  const handleAddLabor = () => {
    setEditingLabor(null)
    setLaborForm({
      name: '',
      hourlyRate: 0,
      description: ''
    })
    setShowLaborDialog(true)
  }

  const handleEditLabor = (labor: LaborType) => {
    setEditingLabor(labor)
    setLaborForm({
      name: labor.name,
      hourlyRate: labor.hourlyRate,
      description: labor.description || ''
    })
    setShowLaborDialog(true)
  }

  const saveLabor = async () => {
    if (!laborForm.name || laborForm.hourlyRate <= 0) {
      toast.error('Preencha o nome e preço por hora')
      return
    }

    setSavingLabor(true)
    try {
      const url = editingLabor
        ? `https://${projectId}.supabase.co/functions/v1/make-server-6971b43c/labor-types/${editingLabor.id}`
        : `https://${projectId}.supabase.co/functions/v1/make-server-6971b43c/labor-types`

      const response = await fetch(url, {
        method: editingLabor ? 'PUT' : 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(laborForm),
      })
      
      if (response.ok) {
        toast.success(editingLabor ? 'Tipo de mão de obra atualizado!' : 'Tipo de mão de obra criado!')
        setShowLaborDialog(false)
        loadLaborTypes()
      } else {
        const error = await response.json()
        toast.error(error.error || 'Erro ao guardar tipo de mão de obra')
      }
    } catch (error) {
      console.error('Error saving labor type:', error)
      toast.error('Erro ao guardar tipo de mão de obra')
    } finally {
      setSavingLabor(false)
    }
  }

  const deleteLabor = async (laborId: string) => {
    if (!confirm('Tem a certeza que deseja eliminar este tipo de mão de obra?')) {
      return
    }

    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-6971b43c/labor-types/${laborId}`,
        {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${accessToken}`,
          },
        }
      )
      
      if (response.ok) {
        toast.success('Tipo de mão de obra eliminado!')
        loadLaborTypes()
      } else {
        const error = await response.json()
        toast.error(error.error || 'Erro ao eliminar')
      }
    } catch (error) {
      console.error('Error deleting labor type:', error)
      toast.error('Erro ao eliminar')
    }
  }

  // Employees Functions
  const loadEmployees = async () => {
    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-6971b43c/employees`,
        {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
          },
        }
      )
      
      if (response.ok) {
        const data = await response.json()
        setEmployees(data.employees || [])
      }
    } catch (error) {
      console.error('Error loading employees:', error)
    }
  }

  const handleAddEmployee = () => {
    setEditingEmployee(null)
    setEmployeeForm({
      name: '',
      email: '',
      phone: '',
      position: ''
    })
    setShowEmployeeDialog(true)
  }

  const handleEditEmployee = (employee: Employee) => {
    setEditingEmployee(employee)
    setEmployeeForm({
      name: employee.name,
      email: employee.email || '',
      phone: employee.phone || '',
      position: employee.position
    })
    setShowEmployeeDialog(true)
  }

  const saveEmployee = async () => {
    if (!employeeForm.name || !employeeForm.position) {
      toast.error('Preencha o nome e cargo do funcionário')
      return
    }

    setSavingEmployee(true)
    try {
      const url = editingEmployee
        ? `https://${projectId}.supabase.co/functions/v1/make-server-6971b43c/employees/${editingEmployee.id}`
        : `https://${projectId}.supabase.co/functions/v1/make-server-6971b43c/employees`

      const response = await fetch(url, {
        method: editingEmployee ? 'PUT' : 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(employeeForm),
      })
      
      if (response.ok) {
        toast.success(editingEmployee ? 'Funcionário atualizado!' : 'Funcionário criado!')
        setShowEmployeeDialog(false)
        loadEmployees()
      } else {
        const error = await response.json()
        toast.error(error.error || 'Erro ao guardar funcionário')
      }
    } catch (error) {
      console.error('Error saving employee:', error)
      toast.error('Erro ao guardar funcionário')
    } finally {
      setSavingEmployee(false)
    }
  }

  const deleteEmployee = async (employeeId: string) => {
    if (!confirm('Tem a certeza que deseja eliminar este funcionário?')) {
      return
    }

    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-6971b43c/employees/${employeeId}`,
        {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${accessToken}`,
          },
        }
      )
      
      if (response.ok) {
        toast.success('Funcionário eliminado!')
        loadEmployees()
      } else {
        const error = await response.json()
        toast.error(error.error || 'Erro ao eliminar')
      }
    } catch (error) {
      console.error('Error deleting employee:', error)
      toast.error('Erro ao eliminar')
    }
  }

  const loadEmailServerData = async () => {
    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-6971b43c/email-server`,
        {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
          }
        }
      )
      
      if (response.ok) {
        const data = await response.json()
        if (data.emailServer) {
          setEmailServerData({
            description: data.emailServer.description || '',
            email: data.emailServer.email || '',
            smtpServer: data.emailServer.smtpServer || '',
            smtpPort: data.emailServer.smtpPort || '465',
            imapServer: data.emailServer.imapServer || '',
            imapPort: data.emailServer.imapPort || '993',
            username: data.emailServer.username || '',
            password: '', // Never load password
            confirmPassword: '',
            signatureUrl: data.emailServer.signatureUrl || ''
          })
        }
      }
    } catch (error) {
      console.error('Error loading email server:', error)
    }
  }

  const saveEmailServerData = async () => {
    if (!emailServerData.email || !emailServerData.smtpServer) {
      toast.error('Preencha pelo menos o email e servidor SMTP')
      return
    }

    if (emailServerData.password && emailServerData.password !== emailServerData.confirmPassword) {
      toast.error('As palavras-chave não coincidem')
      return
    }

    setSavingEmailServer(true)
    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-6971b43c/email-server`,
        {
          method: 'PUT',
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            description: emailServerData.description,
            email: emailServerData.email,
            smtpServer: emailServerData.smtpServer,
            smtpPort: emailServerData.smtpPort,
            imapServer: emailServerData.imapServer,
            imapPort: emailServerData.imapPort,
            username: emailServerData.username,
            password: emailServerData.password || undefined,
            signatureUrl: emailServerData.signatureUrl
          }),
        }
      )
      
      if (response.ok) {
        toast.success('Configurações de email guardadas!')
        loadEmailServerData()
      } else {
        const error = await response.json()
        toast.error(error.error || 'Erro ao guardar configurações')
      }
    } catch (error) {
      console.error('Error saving email server:', error)
      toast.error('Erro ao guardar configurações')
    } finally {
      setSavingEmailServer(false)
    }
  }

  const handleSignatureUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    if (!file.type.startsWith('image/')) {
      toast.error('Por favor selecione uma imagem')
      return
    }

    setUploadingSignature(true)
    try {
      const formData = new FormData()
      formData.append('file', file)

      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-6971b43c/upload-signature`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${accessToken}`,
          },
          body: formData,
        }
      )
      
      if (response.ok) {
        const data = await response.json()
        setEmailServerData({ ...emailServerData, signatureUrl: data.url })
        toast.success('Assinatura carregada!')
      } else {
        toast.error('Erro ao carregar assinatura')
      }
    } catch (error) {
      console.error('Error uploading signature:', error)
      toast.error('Erro ao carregar assinatura')
    } finally {
      setUploadingSignature(false)
    }
  }

  // OCR Template Generation Functions
  const handleOcrImageSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    if (!file.type.startsWith('image/')) {
      toast.error('Por favor selecione uma imagem')
      return
    }

    setOcrImage(file)
    const reader = new FileReader()
    reader.onload = (e) => {
      setOcrImagePreview(e.target?.result as string)
    }
    reader.readAsDataURL(file)
    setShowOcrDialog(true)
  }

  const processImageWithOcr = async () => {
    if (!ocrImage) {
      toast.error('Selecione uma imagem primeiro')
      return
    }

    setProcessingOcr(true)
    try {
      console.log('🔍 Processing image with OCR...')
      
      const formData = new FormData()
      formData.append('image', ocrImage)

      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-6971b43c/ocr-template`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${accessToken}`,
          },
          body: formData,
        }
      )

      if (response.ok) {
        const data = await response.json()
        console.log('✅ OCR result:', data)
        
        setOcrResult(data.text || '')
        
        // Create template with OCR result
        setTemplateForm({
          name: `Template Gerado - ${new Date().toLocaleDateString('pt-PT')}`,
          type: 'pdf',
          category: 'service-sheet',
          subject: '',
          content: data.text || '',
          language: 'pt'
        })
        
        toast.success('Texto extraído com sucesso! Revise e edite o template.')
        
        // Close OCR dialog and open template editor
        setShowOcrDialog(false)
        setShowTemplateDialog(true)
      } else {
        const error = await response.json()
        console.error('❌ OCR error:', error)
        
        // Show detailed error message
        let errorMessage = error.error || 'Erro ao processar imagem'
        
        // Special handling for API key errors
        if (error.apiKeyError) {
          errorMessage = `🔑 ${error.error}\n\n${error.details}`
          toast.error(errorMessage, { 
            duration: 10000,
            description: 'Contacte o administrador do sistema para atualizar a chave da API OCR.'
          })
        } else {
          if (error.details) {
            console.error('   Error details:', error.details)
            if (typeof error.details === 'string') {
              errorMessage += ` - ${error.details}`
            }
          }
          toast.error(errorMessage, { duration: 6000 })
        }
      }
    } catch (error: any) {
      console.error('❌ Error processing OCR:', error)
      toast.error(`Erro ao processar imagem: ${error.message}`)
    } finally {
      setProcessingOcr(false)
    }
  }

  const cancelOcrDialog = () => {
    setShowOcrDialog(false)
    setOcrImage(null)
    setOcrImagePreview(null)
    setOcrResult('')
  }

  // PDF OCR Template Generation Functions
  const handlePdfSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    if (file.type !== 'application/pdf') {
      toast.error('Por favor selecione um ficheiro PDF')
      return
    }

    setPdfFile(file)
    setShowPdfDialog(true)
  }

  const processPdfWithOcr = async () => {
    if (!pdfFile) {
      toast.error('Selecione um ficheiro PDF primeiro')
      return
    }

    setProcessingPdf(true)
    try {
      console.log('📄 Processing PDF with OCR...')
      
      const formData = new FormData()
      formData.append('pdf', pdfFile)

      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-6971b43c/ocr-pdf-template`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${accessToken}`,
          },
          body: formData,
        }
      )

      if (response.ok) {
        const data = await response.json()
        console.log('✅ PDF OCR result:', data)
        
        setPdfResult(data.text || '')
        
        // Create template with PDF OCR result
        setTemplateForm({
          name: `Template PDF - ${new Date().toLocaleDateString('pt-PT')}`,
          type: 'pdf',
          category: 'service-sheet',
          subject: '',
          content: data.text || '',
          language: 'pt'
        })
        
        toast.success('Texto extraído do PDF com sucesso! Revise e edite o template.')
        
        // Close PDF dialog and open template editor
        setShowPdfDialog(false)
        setShowTemplateDialog(true)
      } else {
        const error = await response.json()
        console.error('❌ PDF OCR error:', error)
        
        // Show detailed error message
        let errorMessage = error.error || 'Erro ao processar PDF'
        
        // Special handling for API key errors
        if (error.apiKeyError) {
          errorMessage = `🔑 ${error.error}\n\n${error.details}`
          toast.error(errorMessage, { 
            duration: 10000,
            description: 'Contacte o administrador do sistema para atualizar a chave da API OCR.'
          })
        } else {
          if (error.details) {
            console.error('   Error details:', error.details)
            if (typeof error.details === 'string') {
              errorMessage += ` - ${error.details}`
            }
          }
          toast.error(errorMessage, { duration: 6000 })
        }
      }
    } catch (error: any) {
      console.error('❌ Error processing PDF OCR:', error)
      toast.error(`Erro ao processar PDF: ${error.message}`)
    } finally {
      setProcessingPdf(false)
    }
  }

  const cancelPdfDialog = () => {
    setShowPdfDialog(false)
    setPdfFile(null)
    setPdfResult('')
  }

  // Templates Functions
  const loadTemplates = async () => {
    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-6971b43c/templates`,
        {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
          },
        }
      )
      
      if (response.ok) {
        const data = await response.json()
        setTemplates(data.templates || [])
      }
    } catch (error) {
      console.error('Error loading templates:', error)
    }
  }

  const handleAddTemplate = () => {
    setEditingTemplate(null)
    setTemplateForm({
      name: '',
      type: 'pdf',
      category: 'service-sheet',
      subject: '',
      content: ''
    })
    setShowTemplateDialog(true)
  }

  const handleEditTemplate = (template: Template) => {
    setEditingTemplate(template)
    setTemplateForm({
      name: template.name,
      type: template.type,
      category: template.category,
      subject: template.subject || '',
      content: template.content
    })
    setShowTemplateDialog(true)
  }

  const saveTemplate = async () => {
    if (!templateForm.name || !templateForm.content) {
      toast.error('Preencha o nome e conteúdo do template')
      return
    }

    if (templateForm.type === 'email' && !templateForm.subject) {
      toast.error('Preencha o assunto do email')
      return
    }

    setSavingTemplate(true)
    try {
      const url = editingTemplate
        ? `https://${projectId}.supabase.co/functions/v1/make-server-6971b43c/templates/${editingTemplate.id}`
        : `https://${projectId}.supabase.co/functions/v1/make-server-6971b43c/templates`

      const response = await fetch(url, {
        method: editingTemplate ? 'PUT' : 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(templateForm),
      })
      
      if (response.ok) {
        toast.success(editingTemplate ? 'Template atualizado!' : 'Template criado!')
        setShowTemplateDialog(false)
        loadTemplates()
      } else {
        const error = await response.json()
        toast.error(error.error || 'Erro ao guardar template')
      }
    } catch (error) {
      console.error('Error saving template:', error)
      toast.error('Erro ao guardar template')
    } finally {
      setSavingTemplate(false)
    }
  }

  const deleteTemplate = async (templateId: string) => {
    if (!confirm('Tem a certeza que deseja eliminar este template?')) {
      return
    }

    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-6971b43c/templates/${templateId}`,
        {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${accessToken}`,
          },
        }
      )
      
      if (response.ok) {
        toast.success('Template eliminado!')
        loadTemplates()
      } else {
        const error = await response.json()
        toast.error(error.error || 'Erro ao eliminar')
      }
    } catch (error) {
      console.error('Error deleting template:', error)
      toast.error('Erro ao eliminar')
    }
  }

  const setTemplateAsDefault = async (templateId: string) => {
    const workshopId = currentWorkshop?.id
    if (!workshopId) return

    try {
      const template = templates.find(t => t.id === templateId)
      if (!template) return

      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-6971b43c/templates/${templateId}/set-default`,
        {
          method: 'PUT',
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            type: template.type,
            category: template.category
          })
        }
      )

      if (response.ok) {
        toast.success('Template definido como padrão')
        loadTemplates()
      } else {
        const error = await response.json()
        toast.error(error.error || 'Erro ao definir como padrão')
      }
    } catch (error) {
      console.error('Error setting template as default:', error)
      toast.error('Erro ao definir como padrão')
    }
  }

  const insertField = (field: string) => {
    const newContent = templateForm.content + `{{${field}}}`
    setTemplateForm({ ...templateForm, content: newContent })
  }

  const loadDefaultTemplate = (type: 'pdf' | 'email', category: string) => {
    const defaultTemplates: Record<string, any> = {
      'pdf-service-sheet': {
        name: 'Folha de Serviço - Padrão',
        type: 'pdf',
        category: 'service-sheet',
        content: `FOLHA DE SERVIÇO Nº {{serviceSheetNumber}}

DADOS DA OFICINA
{{workshopName}}
{{workshopAddress}}
{{workshopPostalCode}} {{workshopLocality}}
NIF: {{workshopNif}}
Tel: {{workshopPhone}}
Email: {{workshopEmail}}

DADOS DO CLIENTE
Nome: {{clientName}}
NIF: {{clientNif}}
Telefone: {{clientPhone}}
Email: {{clientEmail}}

DADOS DO VEÍCULO
Matrícula: {{vehiclePlate}}
Marca/Modelo: {{vehicleMake}} {{vehicleModel}}
Ano: {{vehicleYear}}
Quilómetros: {{vehicleKm}} km

SERVIÇOS
{{servicesTable}}

OBSERVAÇÕES
{{observations}}

TOTAL: {{totalPrice}}€ (IVA incluído)

Data: {{serviceDate}}
Mecânico: {{mechanicName}}`
      },
      'pdf-budget': {
        name: 'Orçamento - Padrão',
        type: 'pdf',
        category: 'budget',
        content: `ORÇAMENTO Nº {{budgetNumber}}

DADOS DA OFICINA
{{workshopName}}
{{workshopAddress}}
NIF: {{workshopNif}}
Tel: {{workshopPhone}}

DADOS DO CLIENTE
Nome: {{clientName}}
Telefone: {{clientPhone}}
Email: {{clientEmail}}

VEÍCULO
Matrícula: {{vehiclePlate}}
Modelo: {{vehicleModel}}

SERVIÇOS ORÇAMENTADOS
{{servicesTable}}

VALOR TOTAL: {{totalPrice}}€
IVA ({{vatRate}}%): {{vatAmount}}€
TOTAL COM IVA: {{totalWithVat}}€

Validade: {{validityDays}} dias
Data: {{budgetDate}}

Este orçamento é válido por {{validityDays}} dias a partir da data de emissão.`
      },
      'email-service-sheet': {
        name: 'Email - Folha de Serviço',
        type: 'email',
        category: 'service-sheet',
        subject: 'Folha de Serviço - {{vehiclePlate}}',
        content: `Caro(a) {{clientName}},

A sua viatura {{vehiclePlate}} ({{vehicleModel}}) foi intervencionada na nossa oficina.

Segue em anexo a folha de serviço com o detalhe dos trabalhos realizados.

RESUMO:
- Serviços: {{servicesList}}
- Valor Total: {{totalPrice}}€

Caso tenha alguma dúvida, não hesite em contactar-nos.

Obrigado pela preferência!

{{workshopName}}
Tel: {{workshopPhone}}
Email: {{workshopEmail}}
{{workshopWebsite}}`
      },
      'email-budget': {
        name: 'Email - Orçamento',
        type: 'email',
        category: 'budget',
        subject: 'Orçamento para {{vehiclePlate}} - {{workshopName}}',
        content: `Caro(a) {{clientName}},

Conforme solicitado, segue o orçamento para a intervenção na viatura {{vehiclePlate}}.

VALOR ORÇAMENTADO: {{totalPrice}}€ (IVA incluído)

Serviços incluídos:
{{servicesList}}

Este orçamento é válido por {{validityDays}} dias.

Para confirmar a reparação, responda a este email ou contacte-nos através do telefone {{workshopPhone}}.

Ficamos ao dispor para qualquer esclarecimento.

Cumprimentos,
{{workshopName}}
{{workshopPhone}} | {{workshopEmail}}`
      },
      'email-general': {
        name: 'Email - Comunicação Geral',
        type: 'email',
        category: 'general',
        subject: 'Informação sobre {{vehiclePlate}}',
        content: `Caro(a) {{clientName}},

Entramos em contacto relativamente à sua viatura {{vehiclePlate}}.

{{messageContent}}

Para mais informações, contacte-nos:
Tel: {{workshopPhone}}
Email: {{workshopEmail}}

Cumprimentos,
{{workshopName}}`
      }
    }

    const key = `${type}-${category}`
    const template = defaultTemplates[key]
    
    if (template) {
      setTemplateForm({
        name: template.name,
        type: template.type,
        category: template.category,
        subject: template.subject || '',
        content: template.content,
        language: 'pt'
      })
    }
  }

  // Advanced Features
  
  // 1. Preview Template with mock data
  const previewTemplate = () => {
    const mockData = {
      workshopName: workshopData.name || 'AutoRepair Lda',
      workshopNif: workshopData.nif || '123456789',
      workshopPhone: workshopData.phone || '+351 220 000 000',
      workshopEmail: workshopData.email || 'geral@autorepair.pt',
      workshopAddress: workshopData.address || 'Rua Principal, 123',
      workshopPostalCode: workshopData.postalCode || '4450-123',
      workshopLocality: workshopData.locality || 'Matosinhos',
      workshopWebsite: workshopData.website || 'www.autorepair.pt',
      clientName: 'João Silva',
      clientNif: '987654321',
      clientPhone: '+351 960 000 000',
      clientEmail: 'joao.silva@email.pt',
      vehiclePlate: 'AB-12-CD',
      vehicleModel: 'Golf',
      vehicleMake: 'Volkswagen',
      vehicleYear: '2020',
      vehicleKm: '50000',
      totalPrice: '250.00',
      vatRate: '23',
      vatAmount: '57.50',
      totalWithVat: '307.50',
      serviceDate: new Date().toLocaleDateString('pt-PT'),
      budgetDate: new Date().toLocaleDateString('pt-PT'),
      mechanicName: 'Carlos Costa',
      serviceSheetNumber: '2024-001',
      budgetNumber: 'ORC-2024-001',
      servicesTable: '1. Mudança de óleo - 45€\n2. Filtros - 35€\n3. Revisão geral - 170€',
      servicesList: 'Mudança de óleo, Filtros, Revisão geral',
      observations: 'Veículo em bom estado geral',
      validityDays: '30',
      messageContent: 'O seu veículo está pronto para levantamento.'
    }

    let rendered = templateForm.content

    // Process conditional fields {{#if condition}}...{{/if}}
    rendered = rendered.replace(/\{\{#if\s+(\w+)\}\}([\s\S]*?)\{\{\/if\}\}/g, (match, condition, content) => {
      // Check if condition variable exists and is truthy
      return mockData[condition as keyof typeof mockData] ? content : ''
    })

    // Process calculated fields {{= expression}}
    rendered = rendered.replace(/\{\{=\s*([^}]+)\}\}/g, (match, expression) => {
      try {
        // Replace variables in expression
        let calc = expression
        Object.keys(mockData).forEach(key => {
          calc = calc.replace(new RegExp(`\\b${key}\\b`, 'g'), mockData[key as keyof typeof mockData] || '0')
        })
        // Evaluate the expression
        const result = eval(calc)
        return result.toString()
      } catch (e) {
        return `[Error: ${expression}]`
      }
    })

    // Replace regular fields
    Object.keys(mockData).forEach(key => {
      const regex = new RegExp(`\\{\\{${key}\\}\\}`, 'g')
      rendered = rendered.replace(regex, mockData[key as keyof typeof mockData] || '')
    })

    setPreviewContent(rendered)
    setShowPreview(true)
  }

  // 2. Export Templates to JSON
  const exportTemplates = () => {
    const dataStr = JSON.stringify(templates, null, 2)
    const dataBlob = new Blob([dataStr], { type: 'application/json' })
    const url = URL.createObjectURL(dataBlob)
    const link = document.createElement('a')
    link.href = url
    link.download = `templates-${workshopData.name || 'oficina'}-${Date.now()}.json`
    link.click()
    URL.revokeObjectURL(url)
    toast.success('Templates exportados com sucesso!')
  }

  // 3. Import Templates from JSON
  const importTemplates = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    try {
      const text = await file.text()
      const imported = JSON.parse(text)
      
      if (!Array.isArray(imported)) {
        toast.error('Formato de ficheiro inválido')
        return
      }

      // Add imported templates
      const workshopId = currentWorkshop?.id
      if (!workshopId) return

      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-6971b43c/templates/import`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ templates: imported }),
        }
      )

      if (response.ok) {
        toast.success(`${imported.length} templates importados!`)
        loadTemplates()
      } else {
        toast.error('Erro ao importar templates')
      }
    } catch (error) {
      console.error('Error importing templates:', error)
      toast.error('Erro ao ler ficheiro')
    }
  }

  // 4. Insert WYSIWYG formatting
  const insertWysiwygFormat = (format: string, value?: string) => {
    const textarea = document.getElementById('template-content') as HTMLTextAreaElement
    if (!textarea) return

    const start = textarea.selectionStart
    const end = textarea.selectionEnd
    const selectedText = templateForm.content.substring(start, end)
    let replacement = ''

    switch (format) {
      case 'bold':
        replacement = `<strong>${selectedText || 'texto'}</strong>`
        break
      case 'italic':
        replacement = `<em>${selectedText || 'texto'}</em>`
        break
      case 'underline':
        replacement = `<u>${selectedText || 'texto'}</u>`
        break
      case 'link':
        replacement = `<a href="${value || 'https://'}">${selectedText || 'link'}</a>`
        break
      case 'image':
        replacement = `<img src="${value || 'url'}" alt="${selectedText || 'imagem'}" />`
        break
      case 'list':
        replacement = `<ul>\n  <li>${selectedText || 'item'}</li>\n</ul>`
        break
      case 'conditional':
        replacement = `{{#if ${value || 'condition'}}}\n${selectedText || 'conteúdo'}\n{{/if}}`
        break
      case 'calculated':
        replacement = `{{= ${value || 'totalPrice * 1.23'}}}`
        break
    }

    const newContent = 
      templateForm.content.substring(0, start) + 
      replacement + 
      templateForm.content.substring(end)
    
    setTemplateForm({ ...templateForm, content: newContent })
  }

  // 5. Community Template Library
  const communityTemplates = [
    {
      id: 'community-1',
      name: 'Folha de Serviço Premium (PT)',
      type: 'pdf' as const,
      category: 'service-sheet' as const,
      language: 'pt',
      content: `╔════════════════════════════════════════╗
║     FOLHA DE SERVIÇO Nº {{serviceSheetNumber}}     ║
╚════════════════════════════════════════╝

📍 {{workshopName}}
   {{workshopAddress}}
   {{workshopPostalCode}} {{workshopLocality}}
   NIF: {{workshopNif}}
   ☎ {{workshopPhone}} | ✉ {{workshopEmail}}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

👤 CLIENTE
   Nome: {{clientName}}
   NIF: {{clientNif}}
   Tel: {{clientPhone}}
   Email: {{clientEmail}}

🚗 VEÍCULO
   Matrícula: {{vehiclePlate}}
   Marca/Modelo: {{vehicleMake}} {{vehicleModel}}
   Ano: {{vehicleYear}} | Km: {{vehicleKm}}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

📋 SERVIÇOS EXECUTADOS

{{servicesTable}}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

💰 VALORES
   Subtotal: {{totalPrice}}€
   IVA ({{vatRate}}%): {{= totalPrice * vatRate / 100}}€
   TOTAL: {{= totalPrice * (1 + vatRate / 100)}}€

{{#if observations}}
📝 OBSERVAÇÕES
{{observations}}
{{/if}}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

📅 Data: {{serviceDate}}
🔧 Mecânico: {{mechanicName}}

Obrigado pela confiança!`
    },
    {
      id: 'community-2',
      name: 'Budget Professional (EN)',
      type: 'pdf' as const,
      category: 'budget' as const,
      language: 'en',
      content: `BUDGET #{{budgetNumber}}

FROM: {{workshopName}}
      {{workshopAddress}}
      {{workshopPostalCode}} {{workshopLocality}}
      VAT: {{workshopNif}}
      Phone: {{workshopPhone}}

TO: {{clientName}}
    {{clientPhone}}
    {{clientEmail}}

VEHICLE: {{vehiclePlate}} - {{vehicleMake}} {{vehicleModel}}

SERVICES:
{{servicesTable}}

TOTAL: €{{totalPrice}}
VAT ({{vatRate}}%): €{{= totalPrice * vatRate / 100}}
TOTAL WITH VAT: €{{= totalPrice * (1 + vatRate / 100)}}

Valid for {{validityDays}} days
Date: {{budgetDate}}

{{#if observations}}
Notes: {{observations}}
{{/if}}`
    },
    {
      id: 'community-3',
      name: 'Email Promocional Multilingue',
      type: 'email' as const,
      category: 'general' as const,
      language: 'pt',
      subject: '🔧 Promoção Especial - {{workshopName}}',
      content: `<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
  <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center;">
    <h1>🎉 Promoção Especial!</h1>
  </div>
  
  <div style="padding: 30px; background: #f7f7f7;">
    <p>Olá <strong>{{clientName}}</strong>,</p>
    
    <p>Temos uma promoção especial para o seu <strong>{{vehiclePlate}}</strong>!</p>
    
    <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0;">
      <h2 style="color: #667eea;">💰 Desconto de 15%</h2>
      <p>Em todos os serviços de manutenção</p>
      <p style="color: #999; font-size: 0.9em;">Válido até 31/12/2024</p>
    </div>
    
    {{#if observations}}
    <div style="background: #fff3cd; padding: 15px; border-left: 4px solid #ffc107; margin: 20px 0;">
      <strong>Nota:</strong> {{observations}}
    </div>
    {{/if}}
    
    <p style="text-align: center; margin-top: 30px;">
      <a href="tel:{{workshopPhone}}" style="background: #667eea; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block;">
        📞 Marcar Já
      </a>
    </p>
  </div>
  
  <div style="background: #333; color: white; padding: 20px; text-align: center; font-size: 0.9em;">
    <p>{{workshopName}}</p>
    <p>{{workshopPhone}} | {{workshopEmail}}</p>
    <p>{{workshopWebsite}}</p>
  </div>
</div>`
    }
  ]

  const loadCommunityTemplate = (template: any) => {
    setTemplateForm({
      name: template.name,
      type: template.type,
      category: template.category,
      subject: template.subject || '',
      content: template.content,
      language: template.language || 'pt'
    })
    setShowLibrary(false)
    toast.success('Template carregado da biblioteca!')
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-3xl tracking-tight">Configurações</h2>
        <p className="text-muted-foreground">
          Gerir dados da oficina e utilizadores do sistema
        </p>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-6 max-w-7xl">
          <TabsTrigger value="workshop">
            <Building2 className="h-4 w-4 mr-2" />
            Dados Oficina
          </TabsTrigger>
          <TabsTrigger value="users">
            <Users className="h-4 w-4 mr-2" />
            Utilizadores
          </TabsTrigger>
          <TabsTrigger value="labor">
            <Wrench className="h-4 w-4 mr-2" />
            Mão de Obra
          </TabsTrigger>
          <TabsTrigger value="employees">
            <UserCog className="h-4 w-4 mr-2" />
            Funcionários
          </TabsTrigger>
          <TabsTrigger value="email-server">
            <Server className="h-4 w-4 mr-2" />
            Servidor Email
          </TabsTrigger>
          <TabsTrigger value="templates">
            <Layout className="h-4 w-4 mr-2" />
            Templates
          </TabsTrigger>
        </TabsList>

        {/* Workshop Data Tab */}
        <TabsContent value="workshop" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Gestão Dados Oficina</CardTitle>
              <CardDescription>
                Configure os dados principais da sua oficina
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              
              {/* Identificação */}
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <Building2 className="h-4 w-4 text-muted-foreground" />
                  <h4 className="font-medium">Identificação</h4>
                </div>
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="workshop-name">Nome da Oficina *</Label>
                    <Input
                      id="workshop-name"
                      placeholder="Ex: AutoRepair Lda"
                      value={workshopData.name}
                      onChange={(e) => setWorkshopData({ ...workshopData, name: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="workshop-app-name">Nome a aparecer na APP</Label>
                    <Input
                      id="workshop-app-name"
                      placeholder="Nome curto para a app"
                      value={workshopData.appDisplayName || ''}
                      onChange={(e) => setWorkshopData({ ...workshopData, appDisplayName: e.target.value })}
                    />
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
                <div className="grid gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="workshop-address">Morada</Label>
                    <Input
                      id="workshop-address"
                      placeholder="Rua, Nº, Andar"
                      value={workshopData.address || ''}
                      onChange={(e) => setWorkshopData({ ...workshopData, address: e.target.value })}
                    />
                  </div>
                  <div className="grid gap-4 md:grid-cols-3">
                    <div className="space-y-2">
                      <Label htmlFor="workshop-postal-code-4">Código Postal</Label>
                      <div className="flex gap-2 items-center">
                        <Input
                          id="workshop-postal-code-4"
                          placeholder="0000"
                          maxLength={4}
                          className="w-24"
                          value={workshopData.cp4 || ''}
                          onChange={(e) => {
                            const value = e.target.value.replace(/\D/g, '')
                            setWorkshopData({ 
                              ...workshopData, 
                              cp4: value,
                              postalCode: value && workshopData.cp3 ? `${value}-${workshopData.cp3}` : ''
                            })
                          }}
                        />
                        <span className="text-muted-foreground">-</span>
                        <Input
                          id="workshop-postal-code-3"
                          placeholder="000"
                          maxLength={3}
                          className="w-20"
                          value={workshopData.cp3 || ''}
                          onChange={(e) => {
                            const value = e.target.value.replace(/\D/g, '')
                            setWorkshopData({ 
                              ...workshopData, 
                              cp3: value,
                              postalCode: workshopData.cp4 && value ? `${workshopData.cp4}-${value}` : ''
                            })
                          }}
                        />
                        <Button
                          type="button"
                          variant="outline"
                          size="icon"
                          onClick={() => {
                            if (workshopData.postalCode) {
                              searchPostalCode(workshopData.postalCode)
                            }
                          }}
                          disabled={searchingPostalCode || !workshopData.postalCode}
                          title="Pesquisar morada"
                        >
                          {searchingPostalCode ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <MapPinned className="h-4 w-4" />
                          )}
                        </Button>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="workshop-locality">Localidade</Label>
                      <Input
                        id="workshop-locality"
                        placeholder="Cidade"
                        value={workshopData.locality || ''}
                        onChange={(e) => setWorkshopData({ ...workshopData, locality: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="workshop-country">País</Label>
                      <Input
                        id="workshop-country"
                        placeholder="Portugal"
                        value={workshopData.country || 'Portugal'}
                        onChange={(e) => setWorkshopData({ ...workshopData, country: e.target.value })}
                      />
                    </div>
                  </div>
                </div>
              </div>

              <Separator />

              {/* Dados Fiscais */}
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <FileText className="h-4 w-4 text-muted-foreground" />
                  <h4 className="font-medium">Dados Fiscais</h4>
                </div>
                <div className="grid gap-4 md:grid-cols-3">
                  <div className="space-y-2">
                    <Label htmlFor="workshop-nif">NIF</Label>
                    <Input
                      id="workshop-nif"
                      placeholder="000000000"
                      value={workshopData.nif || ''}
                      onChange={(e) => setWorkshopData({ ...workshopData, nif: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="workshop-vat-rate">
                      <Percent className="h-4 w-4 inline mr-1" />
                      Taxa IVA Padrão (%)
                    </Label>
                    <Input
                      id="workshop-vat-rate"
                      type="number"
                      min="0"
                      max="100"
                      step="1"
                      placeholder="23"
                      value={workshopData.defaultVatRate || ''}
                      onChange={(e) => setWorkshopData({ ...workshopData, defaultVatRate: parseFloat(e.target.value) || 0 })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="workshop-iban">
                      <CreditCard className="h-4 w-4 inline mr-1" />
                      IBAN
                    </Label>
                    <Input
                      id="workshop-iban"
                      placeholder="PT50 0000 0000 0000 0000 0000 0"
                      value={workshopData.iban || ''}
                      onChange={(e) => setWorkshopData({ ...workshopData, iban: e.target.value })}
                    />
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
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="workshop-email">
                      <Mail className="h-4 w-4 inline mr-1" />
                      E-mail *
                    </Label>
                    <Input
                      id="workshop-email"
                      type="email"
                      placeholder="geral@oficina.pt"
                      value={workshopData.email || ''}
                      onChange={(e) => setWorkshopData({ ...workshopData, email: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="workshop-website">
                      <Globe className="h-4 w-4 inline mr-1" />
                      Website
                    </Label>
                    <Input
                      id="workshop-website"
                      placeholder="https://www.oficina.pt"
                      value={workshopData.website || ''}
                      onChange={(e) => setWorkshopData({ ...workshopData, website: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="workshop-phone">
                      <Phone className="h-4 w-4 inline mr-1" />
                      Telefone 1
                    </Label>
                    <Input
                      id="workshop-phone"
                      placeholder="+351 000 000 000"
                      value={workshopData.phone || ''}
                      onChange={(e) => setWorkshopData({ ...workshopData, phone: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="workshop-phone2">
                      <Smartphone className="h-4 w-4 inline mr-1" />
                      Telefone 2
                    </Label>
                    <Input
                      id="workshop-phone2"
                      placeholder="+351 000 000 000"
                      value={workshopData.phone2 || ''}
                      onChange={(e) => setWorkshopData({ ...workshopData, phone2: e.target.value })}
                    />
                  </div>
                </div>
              </div>

              <Separator />

              {/* Integrações */}
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <Key className="h-4 w-4 text-muted-foreground" />
                  <h4 className="font-medium">Integrações API</h4>
                </div>
                <div className="grid gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="workshop-nif-api">Chave Secreta API NIF.PT</Label>
                    <Input
                      id="workshop-nif-api"
                      type="password"
                      placeholder="Chave de API do www.nif.pt"
                      value={workshopData.nifApiKey || ''}
                      onChange={(e) => setWorkshopData({ ...workshopData, nifApiKey: e.target.value })}
                    />
                    <p className="text-xs text-muted-foreground">
                      Obtenha a sua chave em: <a href="https://www.nif.pt/contactos/api/" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">www.nif.pt/contactos/api/</a>
                    </p>
                  </div>
                </div>
              </div>

              <Separator />

              {/* Logotipo */}
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="workshop-logo">URL do Logotipo</Label>
                  <Input
                    id="workshop-logo"
                    placeholder="https://exemplo.com/logo.png"
                    value={workshopData.logoUrl || ''}
                    onChange={(e) => setWorkshopData({ ...workshopData, logoUrl: e.target.value })}
                  />
                  <p className="text-xs text-muted-foreground">
                    O logotipo será exibido em orçamentos e documentos
                  </p>
                </div>
              </div>

              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  Estes dados serão utilizados em orçamentos, faturas e documentos oficiais da oficina.
                </AlertDescription>
              </Alert>

              {userRole && userRole !== 'administrador' && userRole !== 'admin' && (
                <Alert className="border-orange-200 bg-orange-50">
                  <AlertCircle className="h-4 w-4 text-orange-600" />
                  <AlertDescription className="text-orange-800">
                    Apenas administradores podem guardar alterações aos dados da oficina. A sua função atual é: <strong>{userRole}</strong>
                  </AlertDescription>
                </Alert>
              )}

              <div className="flex justify-end">
                <Button 
                  onClick={saveWorkshopData} 
                  disabled={savingWorkshop || (userRole && userRole !== 'administrador' && userRole !== 'admin')}
                >
                  <Save className="h-4 w-4 mr-2" />
                  {savingWorkshop ? 'A guardar...' : 'Guardar Alterações'}
                </Button>
              </div>
            </CardContent>
          </Card>
          
          {/* Diálogo de Seleção de Morada - Workshop */}
          <Dialog open={addressSelectionDialogOpen} onOpenChange={setAddressSelectionDialogOpen}>
            <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <MapPinCheck className="h-5 w-5" />
                  Selecione a Morada
                </DialogTitle>
                <DialogDescription>
                  Foram encontradas {availableAddresses.length} moradas para o código postal {workshopData.postalCode}. Selecione a morada correta.
                </DialogDescription>
              </DialogHeader>
              
              <div className="space-y-3 py-4">
                {availableAddresses.map((address, index) => (
                  <Card 
                    key={index} 
                    className="cursor-pointer hover:border-primary hover:bg-accent/50 transition-all"
                    onClick={() => applyAddressToWorkshop(address)}
                  >
                    <CardHeader className="pb-3">
                      <CardTitle className="text-base flex items-start gap-2">
                        <MapPin className="h-4 w-4 mt-1 text-primary flex-shrink-0" />
                        <div className="flex-1">
                          <div>{address.morada}</div>
                          {address['info-local'] && (
                            <div className="text-sm text-muted-foreground font-normal mt-1">
                              {address['info-local']}
                            </div>
                          )}
                        </div>
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="pt-0">
                      <div className="grid grid-cols-2 gap-2 text-sm">
                        <div>
                          <span className="text-muted-foreground">Localidade:</span>{' '}
                          <span className="font-medium">{address.localidade}</span>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Freguesia:</span>{' '}
                          <span>{address.freguesia}</span>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Concelho:</span>{' '}
                          <span>{address.concelho}</span>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Distrito:</span>{' '}
                          <span>{address.distrito}</span>
                        </div>
                        {address.porta && (
                          <div className="col-span-2">
                            <span className="text-muted-foreground">Porta:</span>{' '}
                            <span>{address.porta}</span>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
              
              <DialogFooter>
                <Button variant="outline" onClick={() => setAddressSelectionDialogOpen(false)}>
                  Cancelar
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </TabsContent>

        {/* Users Tab */}
        <TabsContent value="users" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Gestão de Utilizadores</CardTitle>
                  <CardDescription>
                    Gerir utilizadores com acesso à plataforma
                  </CardDescription>
                </div>
                <Button 
                  onClick={handleAddUser}
                  disabled={userRole && userRole !== 'administrador' && userRole !== 'admin'}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Novo Utilizador
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {userRole && userRole !== 'administrador' && userRole !== 'admin' && (
                <Alert className="border-orange-200 bg-orange-50 mb-4">
                  <AlertCircle className="h-4 w-4 text-orange-600" />
                  <AlertDescription className="text-orange-800">
                    Apenas administradores podem gerir utilizadores. A sua função atual é: <strong>{userRole}</strong>
                  </AlertDescription>
                </Alert>
              )}
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nome</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Função</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {users.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center text-muted-foreground">
                        Sem utilizadores registados
                      </TableCell>
                    </TableRow>
                  ) : (
                    users.map((user) => (
                      <TableRow key={user.id}>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <User className="h-4 w-4 text-muted-foreground" />
                            {user.name}
                          </div>
                        </TableCell>
                        <TableCell>{user.email}</TableCell>
                        <TableCell>{getRoleBadge(user.role)}</TableCell>
                        <TableCell>
                          {user.isActive ? (
                            <Badge variant="outline" className="bg-green-50 text-green-700 border-green-300">
                              Ativo
                            </Badge>
                          ) : (
                            <Badge variant="outline" className="bg-gray-50 text-gray-700 border-gray-300">
                              Inativo
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex gap-2 justify-end">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleEditUser(user)}
                              disabled={userRole && userRole !== 'administrador' && userRole !== 'admin'}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => deleteUser(user.id)}
                              disabled={userRole && userRole !== 'administrador' && userRole !== 'admin'}
                            >
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
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

        {/* Labor Types Tab */}
        <TabsContent value="labor" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Tipos de Mão de Obra</CardTitle>
                  <CardDescription>
                    Configure os tipos de mão de obra e preços por hora
                  </CardDescription>
                </div>
                <Button onClick={handleAddLabor}>
                  <Plus className="h-4 w-4 mr-2" />
                  Novo Tipo
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nome</TableHead>
                    <TableHead>Descrição</TableHead>
                    <TableHead className="text-right">Preço/Hora</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {laborTypes.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center text-muted-foreground">
                        Nenhum tipo de mão de obra registado
                      </TableCell>
                    </TableRow>
                  ) : (
                    laborTypes.map((labor) => (
                      <TableRow key={labor.id}>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Wrench className="h-4 w-4 text-muted-foreground" />
                            {labor.name}
                          </div>
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {labor.description || '—'}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center gap-1 justify-end">
                            <Euro className="h-4 w-4 text-muted-foreground" />
                            <span>{labor.hourlyRate.toFixed(2)}</span>
                            <span className="text-muted-foreground text-xs">/h</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          {labor.isActive ? (
                            <Badge variant="outline" className="bg-green-50 text-green-700 border-green-300">
                              Ativo
                            </Badge>
                          ) : (
                            <Badge variant="outline" className="bg-gray-50 text-gray-700 border-gray-300">
                              Inativo
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex gap-2 justify-end">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleEditLabor(labor)}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => deleteLabor(labor.id)}
                            >
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
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

        {/* Employees Tab */}
        <TabsContent value="employees" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Gestão de Funcionários</CardTitle>
                  <CardDescription>
                    Gerir funcionários da oficina para controles futuros
                  </CardDescription>
                </div>
                <Button onClick={handleAddEmployee}>
                  <Plus className="h-4 w-4 mr-2" />
                  Novo Funcionário
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nome</TableHead>
                    <TableHead>Cargo</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Telefone</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {employees.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center text-muted-foreground">
                        Nenhum funcionário registado
                      </TableCell>
                    </TableRow>
                  ) : (
                    employees.map((employee) => (
                      <TableRow key={employee.id}>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <UserCog className="h-4 w-4 text-muted-foreground" />
                            {employee.name}
                          </div>
                        </TableCell>
                        <TableCell>{employee.position}</TableCell>
                        <TableCell className="text-muted-foreground">
                          {employee.email || '—'}
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {employee.phone || '—'}
                        </TableCell>
                        <TableCell>
                          {employee.isActive ? (
                            <Badge variant="outline" className="bg-green-50 text-green-700 border-green-300">
                              Ativo
                            </Badge>
                          ) : (
                            <Badge variant="outline" className="bg-gray-50 text-gray-700 border-gray-300">
                              Inativo
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex gap-2 justify-end">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleEditEmployee(employee)}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => deleteEmployee(employee.id)}
                            >
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
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

        {/* Email Server Tab */}
        <TabsContent value="email-server" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Configurações do Email Principal da Empresa</CardTitle>
              <CardDescription>
                E-mail default utilizado, também, para Utilizador Receção sem e-mail configurado
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid gap-6 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="email-description">
                    Descrição e mail (ex: nome completo)
                  </Label>
                  <Input
                    id="email-description"
                    placeholder="Nome da Oficina"
                    value={emailServerData.description}
                    onChange={(e) => setEmailServerData({ ...emailServerData, description: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email-address">
                    <Mail className="h-4 w-4 inline mr-1" />
                    Endereço de correio eletrônico (ex: exemplo@gmail.com) *
                  </Label>
                  <Input
                    id="email-address"
                    type="email"
                    placeholder="sua@oficina.pt"
                    value={emailServerData.email}
                    onChange={(e) => setEmailServerData({ ...emailServerData, email: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="smtp-server">
                    <Server className="h-4 w-4 inline mr-1" />
                    Servidor de Envio de Correio (SMTP) *
                  </Label>
                  <Input
                    id="smtp-server"
                    placeholder="smtp.oficina.pt"
                    value={emailServerData.smtpServer}
                    onChange={(e) => setEmailServerData({ ...emailServerData, smtpServer: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="smtp-port">
                    Porta (SMTP)
                  </Label>
                  <Input
                    id="smtp-port"
                    placeholder="465"
                    value={emailServerData.smtpPort}
                    onChange={(e) => setEmailServerData({ ...emailServerData, smtpPort: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="imap-server">
                    Servidor de Receção de Correio (IMAP)
                  </Label>
                  <Input
                    id="imap-server"
                    placeholder="imap.oficina.pt"
                    value={emailServerData.imapServer}
                    onChange={(e) => setEmailServerData({ ...emailServerData, imapServer: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="imap-port">
                    Porta (IMAP)
                  </Label>
                  <Input
                    id="imap-port"
                    placeholder="993"
                    value={emailServerData.imapPort}
                    onChange={(e) => setEmailServerData({ ...emailServerData, imapPort: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email-username">
                    Utilizador/E-mail de Login
                  </Label>
                  <Input
                    id="email-username"
                    placeholder="sua@oficina.pt"
                    value={emailServerData.username}
                    onChange={(e) => setEmailServerData({ ...emailServerData, username: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email-password">
                    Palavra-chave de Login
                  </Label>
                  <div className="relative">
                    <Input
                      id="email-password"
                      type={showPassword ? 'text' : 'password'}
                      placeholder="••••••••••••••"
                      value={emailServerData.password}
                      onChange={(e) => setEmailServerData({ ...emailServerData, password: e.target.value })}
                      className="pr-10"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? (
                        <EyeOff className="h-4 w-4 text-muted-foreground" />
                      ) : (
                        <Eye className="h-4 w-4 text-muted-foreground" />
                      )}
                    </Button>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email-confirm-password">
                    Confirmar Palavra-chave de Login
                  </Label>
                  <div className="relative">
                    <Input
                      id="email-confirm-password"
                      type={showConfirmPassword ? 'text' : 'password'}
                      placeholder="••••••••••••••"
                      value={emailServerData.confirmPassword}
                      onChange={(e) => setEmailServerData({ ...emailServerData, confirmPassword: e.target.value })}
                      className="pr-10"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    >
                      {showConfirmPassword ? (
                        <EyeOff className="h-4 w-4 text-muted-foreground" />
                      ) : (
                        <Eye className="h-4 w-4 text-muted-foreground" />
                      )}
                    </Button>
                  </div>
                </div>
              </div>

              {/* Signature Upload Section */}
              <div className="space-y-4 pt-4 border-t">
                <div>
                  <Label className="text-base">Assinatura de E-mail (pré-definida ou carregue aqui)</Label>
                  <p className="text-sm text-muted-foreground mt-1">
                    Arraste um ficheiro de imagem com a sua assinatura pré-definida ou carregue aqui
                  </p>
                </div>
                
                <div className="border-2 border-dashed rounded-lg p-8 text-center hover:border-primary/50 transition-colors">
                  <input
                    type="file"
                    id="signature-upload"
                    accept="image/*"
                    onChange={handleSignatureUpload}
                    className="hidden"
                  />
                  
                  {emailServerData.signatureUrl ? (
                    <div className="space-y-4">
                      <div className="mx-auto max-w-md">
                        <img 
                          src={emailServerData.signatureUrl} 
                          alt="Assinatura" 
                          className="w-full h-auto rounded border"
                        />
                      </div>
                      <div className="flex gap-2 justify-center">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => document.getElementById('signature-upload')?.click()}
                          disabled={uploadingSignature}
                        >
                          <Upload className="h-4 w-4 mr-2" />
                          Alterar Assinatura
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setEmailServerData({ ...emailServerData, signatureUrl: '' })}
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          Remover
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <Upload className="h-12 w-12 mx-auto text-muted-foreground" />
                      <div>
                        <Button
                          variant="outline"
                          onClick={() => document.getElementById('signature-upload')?.click()}
                          disabled={uploadingSignature}
                        >
                          <Upload className="h-4 w-4 mr-2" />
                          {uploadingSignature ? 'A carregar...' : 'Carregar Assinatura'}
                        </Button>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        Formatos aceites: PNG, JPG, GIF
                      </p>
                    </div>
                  )}
                </div>
              </div>

              <div className="flex justify-between items-center pt-4 border-t">
                <Button variant="outline" size="sm">
                  Inserir Manualmente
                </Button>
                
                <Button 
                  onClick={saveEmailServerData} 
                  disabled={savingEmailServer}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  <Save className="h-4 w-4 mr-2" />
                  {savingEmailServer ? 'A guardar...' : 'Guardar Configurações'}
                </Button>
              </div>

              {emailServerData.email && (
                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    <div className="flex items-center justify-between">
                      <span>Tenho uma conta @gmail</span>
                      <Button variant="link" size="sm" className="h-auto p-0">
                        Saiba mais →
                      </Button>
                    </div>
                  </AlertDescription>
                </Alert>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Templates Tab */}
        <TabsContent value="templates" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Gestão de Templates</CardTitle>
                  <CardDescription>
                    Crie e gerir templates para PDFs e Emails com funcionalidades avançadas
                  </CardDescription>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => document.getElementById('template-import')?.click()}
                  >
                    <Upload className="h-4 w-4 mr-2" />
                    Importar
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={exportTemplates}
                    disabled={templates.length === 0}
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Exportar
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => document.getElementById('ocr-image-upload')?.click()}
                  >
                    <Scan className="h-4 w-4 mr-2" />
                    Gerar por Imagem
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => document.getElementById('pdf-upload')?.click()}
                  >
                    <FileText className="h-4 w-4 mr-2" />
                    Gerar por PDF
                  </Button>
                  <Button onClick={handleAddTemplate}>
                    <Plus className="h-4 w-4 mr-2" />
                    Novo Template
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {/* OCR API Status Info */}
              <Alert className="mb-4 border-purple-200 bg-purple-50">
                <Key className="h-4 w-4 text-purple-600" />
                <AlertDescription>
                  <div className="text-sm text-purple-900 space-y-1">
                    <p>
                      <strong>🔍 Geração por OCR (Imagem/PDF):</strong> Utilize os botões "Gerar por Imagem" ou "Gerar por PDF" 
                      para extrair automaticamente texto de documentos existentes.
                    </p>
                    <p className="text-xs text-purple-700">
                      <strong>Importante:</strong> Esta funcionalidade requer uma chave API OCR válida (gratuita em{' '}
                      <a 
                        href="https://ocr.space/ocrapi" 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="underline hover:text-purple-900"
                      >
                        ocr.space/ocrapi
                      </a>
                      ). Se encontrar erros, contacte o administrador para atualizar a chave nas variáveis de ambiente.
                    </p>
                  </div>
                </AlertDescription>
              </Alert>

              {/* Template Padrão Info */}
              <Alert className="mb-4 border-blue-200 bg-blue-50">
                <Star className="h-4 w-4 text-blue-600" />
                <AlertDescription>
                  <p className="text-sm text-blue-900">
                    <strong>Templates Padrão:</strong> Marque um template como padrão para ser usado automaticamente 
                    ao imprimir folhas de serviço ou orçamentos. Pode ter apenas um template padrão por tipo e categoria.
                  </p>
                </AlertDescription>
              </Alert>

              {/* Available Fields Info */}
              <Alert className="mb-6">
                <Code className="h-4 w-4" />
                <AlertDescription>
                  <div className="space-y-2">
                    <p className="font-medium">Campos Disponíveis para Templates:</p>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-sm">
                      <span className="font-mono text-xs">{'{{workshopName}}'}</span>
                      <span className="font-mono text-xs">{'{{workshopNif}}'}</span>
                      <span className="font-mono text-xs">{'{{workshopPhone}}'}</span>
                      <span className="font-mono text-xs">{'{{workshopEmail}}'}</span>
                      <span className="font-mono text-xs">{'{{clientName}}'}</span>
                      <span className="font-mono text-xs">{'{{clientPhone}}'}</span>
                      <span className="font-mono text-xs">{'{{clientEmail}}'}</span>
                      <span className="font-mono text-xs">{'{{clientNif}}'}</span>
                      <span className="font-mono text-xs">{'{{vehiclePlate}}'}</span>
                      <span className="font-mono text-xs">{'{{vehicleModel}}'}</span>
                      <span className="font-mono text-xs">{'{{totalPrice}}'}</span>
                      <span className="font-mono text-xs">{'{{serviceDate}}'}</span>
                    </div>
                  </div>
                </AlertDescription>
              </Alert>

              {/* Templates List */}
              {templates.length === 0 ? (
                <div className="text-center py-12">
                  <FilePlus className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <h3 className="font-medium mb-2">Nenhum template criado</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    Comece por criar um novo template ou carregar um modelo pré-definido
                  </p>
                  <Button onClick={handleAddTemplate}>
                    <Plus className="h-4 w-4 mr-2" />
                    Criar Primeiro Template
                  </Button>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Nome</TableHead>
                      <TableHead>Tipo</TableHead>
                      <TableHead>Categoria</TableHead>
                      <TableHead>Padrão</TableHead>
                      <TableHead className="text-right">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {templates.map((template) => (
                      <TableRow key={template.id}>
                        <TableCell className="font-medium">
                          <div className="flex items-center gap-2">
                            {template.name}
                            {template.isDefault && (
                              <Badge className="bg-green-600 text-white text-xs">
                                PADRÃO
                              </Badge>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant={template.type === 'pdf' ? 'default' : 'secondary'}>
                            {template.type === 'pdf' ? 'PDF' : 'Email'}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">
                            {template.category === 'service-sheet' && 'Folha de Serviço'}
                            {template.category === 'budget' && 'Orçamento'}
                            {template.category === 'invoice' && 'Fatura'}
                            {template.category === 'general' && 'Geral'}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Button
                              variant={template.isDefault ? 'default' : 'outline'}
                              size="sm"
                              onClick={() => setTemplateAsDefault(template.id)}
                              disabled={template.isDefault}
                              className={template.isDefault ? 'gap-2 bg-green-600 hover:bg-green-700 cursor-default' : 'gap-2'}
                              title={template.isDefault ? 'Este template é o padrão' : 'Definir como template padrão'}
                            >
                              {template.isDefault ? (
                                <>
                                  <Star className="h-3 w-3 fill-white" />
                                  Padrão
                                </>
                              ) : (
                                <>
                                  <Star className="h-3 w-3" />
                                  Definir como Padrão
                                </>
                              )}
                            </Button>
                          </div>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleEditTemplate(template)}
                              title="Editar template"
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => deleteTemplate(template.id)}
                              disabled={template.isDefault}
                              title={template.isDefault ? 'Não pode eliminar template padrão' : 'Eliminar template'}
                            >
                              <Trash2 className={`h-4 w-4 ${template.isDefault ? 'text-muted-foreground' : 'text-destructive'}`} />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* User Dialog */}
      <Dialog open={showUserDialog} onOpenChange={setShowUserDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingUser ? 'Editar Utilizador' : 'Novo Utilizador'}
            </DialogTitle>
            <DialogDescription>
              {editingUser 
                ? 'Atualize os dados do utilizador' 
                : 'Criar um novo utilizador com acesso à plataforma'}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="user-name">Nome Completo *</Label>
              <Input
                id="user-name"
                placeholder="João Silva"
                value={userForm.name}
                onChange={(e) => setUserForm({ ...userForm, name: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="user-email">Email *</Label>
              <Input
                id="user-email"
                type="email"
                placeholder="joao@exemplo.com"
                value={userForm.email}
                onChange={(e) => setUserForm({ ...userForm, email: e.target.value })}
                disabled={!!editingUser}
              />
              {editingUser && (
                <p className="text-xs text-muted-foreground">
                  O email não pode ser alterado
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="user-password">
                Senha {!editingUser && '*'}
              </Label>
              <Input
                id="user-password"
                type="password"
                placeholder={editingUser ? 'Deixe em branco para manter' : 'Senha do utilizador'}
                value={userForm.password}
                onChange={(e) => setUserForm({ ...userForm, password: e.target.value })}
              />
              {editingUser && (
                <p className="text-xs text-muted-foreground">
                  Preencha apenas se pretender alterar a senha
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="user-role">
                <Shield className="h-4 w-4 inline mr-1" />
                Função *
              </Label>
              <div className="grid grid-cols-3 gap-2">
                <Button
                  type="button"
                  variant={userForm.role === 'admin' ? 'default' : 'outline'}
                  className={userForm.role === 'admin' ? 'bg-red-600' : ''}
                  onClick={() => setUserForm({ ...userForm, role: 'admin' })}
                >
                  Admin
                </Button>
                <Button
                  type="button"
                  variant={userForm.role === 'technician' ? 'default' : 'outline'}
                  className={userForm.role === 'technician' ? 'bg-blue-600' : ''}
                  onClick={() => setUserForm({ ...userForm, role: 'technician' })}
                >
                  Técnico
                </Button>
                <Button
                  type="button"
                  variant={userForm.role === 'receptionist' ? 'default' : 'outline'}
                  onClick={() => setUserForm({ ...userForm, role: 'receptionist' })}
                >
                  Rececionista
                </Button>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowUserDialog(false)}>
              Cancelar
            </Button>
            <Button onClick={saveUser} disabled={savingUser}>
              {savingUser ? 'A guardar...' : 'Guardar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Labor Type Dialog */}
      <Dialog open={showLaborDialog} onOpenChange={setShowLaborDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingLabor ? 'Editar Tipo de Mão de Obra' : 'Novo Tipo de Mão de Obra'}
            </DialogTitle>
            <DialogDescription>
              {editingLabor 
                ? 'Atualize os dados do tipo de mão de obra' 
                : 'Criar um novo tipo de mão de obra com preço por hora'}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="labor-name">
                <Wrench className="h-4 w-4 inline mr-1" />
                Nome do Tipo *
              </Label>
              <Input
                id="labor-name"
                placeholder="Ex: Mecânica Geral, Electricidade, Chapa"
                value={laborForm.name}
                onChange={(e) => setLaborForm({ ...laborForm, name: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="labor-rate">
                <Clock className="h-4 w-4 inline mr-1" />
                Preço por Hora (€) *
              </Label>
              <Input
                id="labor-rate"
                type="number"
                step="0.01"
                min="0"
                placeholder="25.00"
                value={laborForm.hourlyRate || ''}
                onChange={(e) => setLaborForm({ ...laborForm, hourlyRate: parseFloat(e.target.value) || 0 })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="labor-description">Descrição (opcional)</Label>
              <Input
                id="labor-description"
                placeholder="Descrição do tipo de mão de obra"
                value={laborForm.description}
                onChange={(e) => setLaborForm({ ...laborForm, description: e.target.value })}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowLaborDialog(false)}>
              Cancelar
            </Button>
            <Button onClick={saveLabor} disabled={savingLabor}>
              {savingLabor ? 'A guardar...' : 'Guardar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Employee Dialog */}
      <Dialog open={showEmployeeDialog} onOpenChange={setShowEmployeeDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingEmployee ? 'Editar Funcionário' : 'Novo Funcionário'}
            </DialogTitle>
            <DialogDescription>
              {editingEmployee 
                ? 'Atualize os dados do funcionário' 
                : 'Adicionar um novo funcionário à oficina'}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="employee-name">Nome Completo *</Label>
              <Input
                id="employee-name"
                placeholder="João Silva"
                value={employeeForm.name}
                onChange={(e) => setEmployeeForm({ ...employeeForm, name: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="employee-position">Cargo/Função *</Label>
              <Input
                id="employee-position"
                placeholder="Ex: Mecânico, Pintor, Administrativo"
                value={employeeForm.position}
                onChange={(e) => setEmployeeForm({ ...employeeForm, position: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="employee-email">Email (opcional)</Label>
              <Input
                id="employee-email"
                type="email"
                placeholder="joao@exemplo.com"
                value={employeeForm.email}
                onChange={(e) => setEmployeeForm({ ...employeeForm, email: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="employee-phone">Telefone (opcional)</Label>
              <Input
                id="employee-phone"
                placeholder="+351 XXX XXX XXX"
                value={employeeForm.phone}
                onChange={(e) => setEmployeeForm({ ...employeeForm, phone: e.target.value })}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowEmployeeDialog(false)}>
              Cancelar
            </Button>
            <Button onClick={saveEmployee} disabled={savingEmployee}>
              {savingEmployee ? 'A guardar...' : 'Guardar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Template Dialog - ADVANCED VERSION */}
      <Dialog open={showTemplateDialog} onOpenChange={setShowTemplateDialog}>
        <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <div className="flex items-center justify-between">
              <div>
                <DialogTitle>
                  {editingTemplate ? 'Editar Template' : 'Novo Template'}
                </DialogTitle>
                <DialogDescription>
                  {editingTemplate 
                    ? 'Atualize o template com funcionalidades avançadas' 
                    : 'Crie um template profissional com campos dinâmicos'}
                </DialogDescription>
              </div>
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setShowLibrary(true)}
                >
                  <Library className="h-4 w-4 mr-2" />
                  Biblioteca
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={previewTemplate}
                >
                  <Eye className="h-4 w-4 mr-2" />
                  Preview
                </Button>
              </div>
            </div>
          </DialogHeader>

          <div className="space-y-6 py-4">
            {/* Template Info */}
            <div className="grid gap-4 md:grid-cols-4">
              <div className="space-y-2">
                <Label htmlFor="template-name">Nome do Template *</Label>
                <Input
                  id="template-name"
                  placeholder="Ex: Folha de Serviço - Oficial"
                  value={templateForm.name}
                  onChange={(e) => setTemplateForm({ ...templateForm, name: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="template-type">Tipo *</Label>
                <Select 
                  value={templateForm.type} 
                  onValueChange={(value: 'pdf' | 'email') => setTemplateForm({ ...templateForm, type: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pdf">📄 PDF</SelectItem>
                    <SelectItem value="email">📧 Email</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="template-category">Categoria *</Label>
                <Select 
                  value={templateForm.category} 
                  onValueChange={(value: any) => setTemplateForm({ ...templateForm, category: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="service-sheet">Folha de Serviço</SelectItem>
                    <SelectItem value="budget">Orçamento</SelectItem>
                    <SelectItem value="invoice">Fatura</SelectItem>
                    <SelectItem value="general">Geral</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="template-language">
                  <Globe2 className="h-4 w-4 inline mr-1" />
                  Idioma
                </Label>
                <Select 
                  value={templateForm.language} 
                  onValueChange={(value: any) => setTemplateForm({ ...templateForm, language: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pt">🇵🇹 Português</SelectItem>
                    <SelectItem value="en">🇬🇧 English</SelectItem>
                    <SelectItem value="es">🇪🇸 Español</SelectItem>
                    <SelectItem value="fr">🇫🇷 Français</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => loadDefaultTemplate(templateForm.type, templateForm.category)}
              >
                <FilePlus className="h-4 w-4 mr-2" />
                Modelo Base
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setShowLibrary(true)}
              >
                <Library className="h-4 w-4 mr-2" />
                Biblioteca Comunitária
              </Button>
            </div>

            {/* Email Subject (only for email templates) */}
            {templateForm.type === 'email' && (
              <div className="space-y-2">
                <Label htmlFor="template-subject">Assunto do Email *</Label>
                <Input
                  id="template-subject"
                  placeholder="Ex: Orçamento para {{vehiclePlate}}"
                  value={templateForm.subject}
                  onChange={(e) => setTemplateForm({ ...templateForm, subject: e.target.value })}
                />
              </div>
            )}

            <Separator />

            {/* Quick Insert Fields */}
            <div className="space-y-3">
              <Label>Inserir Campos Rápidos</Label>
              <div className="grid grid-cols-3 md:grid-cols-6 gap-2">
                {[
                  'workshopName', 'workshopNif', 'workshopPhone', 'workshopEmail',
                  'clientName', 'clientPhone', 'clientEmail', 'clientNif',
                  'vehiclePlate', 'vehicleModel', 'vehicleMake', 'vehicleYear',
                  'totalPrice', 'vatRate', 'vatAmount', 'totalWithVat',
                  'serviceDate', 'budgetDate', 'mechanicName', 'serviceSheetNumber',
                  'budgetNumber', 'servicesTable', 'servicesList', 'observations'
                ].map(field => (
                  <Button
                    key={field}
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => insertField(field)}
                    className="text-xs"
                  >
                    <Copy className="h-3 w-3 mr-1" />
                    {field}
                  </Button>
                ))}
              </div>
              <p className="text-xs text-muted-foreground">
                Clique para inserir o campo no conteúdo. Os campos são substituídos automaticamente pelos dados reais.
              </p>
            </div>

            <Separator />

            {/* WYSIWYG Toolbar for Email Templates */}
            {templateForm.type === 'email' && (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label>Ferramentas de Formatação</Label>
                  <div className="flex gap-1">
                    <Button
                      type="button"
                      variant={editorMode === 'text' ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setEditorMode('text')}
                    >
                      <Code className="h-4 w-4 mr-1" />
                      Texto
                    </Button>
                    <Button
                      type="button"
                      variant={editorMode === 'wysiwyg' ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setEditorMode('wysiwyg')}
                    >
                      <Type className="h-4 w-4 mr-1" />
                      WYSIWYG
                    </Button>
                  </div>
                </div>
                
                {editorMode === 'wysiwyg' && (
                  <div className="flex flex-wrap gap-1 p-2 bg-muted rounded-md">
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => insertWysiwygFormat('bold')}
                      title="Negrito"
                    >
                      <Bold className="h-4 w-4" />
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => insertWysiwygFormat('italic')}
                      title="Itálico"
                    >
                      <Italic className="h-4 w-4" />
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => insertWysiwygFormat('underline')}
                      title="Sublinhado"
                    >
                      <Underline className="h-4 w-4" />
                    </Button>
                    <Separator orientation="vertical" className="h-8 mx-1" />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => insertWysiwygFormat('list')}
                      title="Lista"
                    >
                      <List className="h-4 w-4" />
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        const url = prompt('URL do link:')
                        if (url) insertWysiwygFormat('link', url)
                      }}
                      title="Link"
                    >
                      <Link className="h-4 w-4" />
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        const url = prompt('URL da imagem:')
                        if (url) insertWysiwygFormat('image', url)
                      }}
                      title="Imagem"
                    >
                      <Image className="h-4 w-4" />
                    </Button>
                    <Separator orientation="vertical" className="h-8 mx-1" />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        const condition = prompt('Condição (ex: clientEmail):')
                        if (condition) insertWysiwygFormat('conditional', condition)
                      }}
                      title="Campo Condicional"
                    >
                      <GitBranch className="h-4 w-4" />
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        const expr = prompt('Expressão (ex: totalPrice * 1.23):')
                        if (expr) insertWysiwygFormat('calculated', expr)
                      }}
                      title="Campo Calculado"
                    >
                      <Calculator className="h-4 w-4" />
                    </Button>
                  </div>
                )}
              </div>
            )}

            {/* Template Content */}
            <div className="space-y-2">
              <Label htmlFor="template-content">Conteúdo do Template *</Label>
              <Textarea
                id="template-content"
                placeholder={templateForm.type === 'pdf' 
                  ? "Digite o conteúdo do template PDF aqui...\n\nUse campos como {{clientName}}, {{vehiclePlate}}, etc." 
                  : "Digite o conteúdo do email aqui...\n\nUse campos como {{clientName}}, {{vehiclePlate}}, etc."}
                value={templateForm.content}
                onChange={(e) => setTemplateForm({ ...templateForm, content: e.target.value })}
                className="min-h-[400px] font-mono text-sm"
              />
              <p className="text-xs text-muted-foreground">
                {templateForm.content.length} caracteres
              </p>
            </div>

            {/* Advanced Features Info */}
            <Alert>
              <Code className="h-4 w-4" />
              <AlertDescription>
                <div className="space-y-2 text-sm">
                  <p><strong>Funcionalidades Avançadas:</strong></p>
                  <ul className="list-disc list-inside space-y-1">
                    <li><strong>Campos Simples:</strong> {'{{clientName}}'} - Substituído pelo valor</li>
                    <li><strong>Campos Condicionais:</strong> {'{{#if clientEmail}}'}...{'{{/if}}'} - Mostra apenas se existir</li>
                    <li><strong>Campos Calculados:</strong> {'{{= totalPrice * 1.23}}'} - Cálculos automáticos</li>
                    <li><strong>HTML (Emails):</strong> Use tags HTML para formatação rica</li>
                  </ul>
                </div>
              </AlertDescription>
            </Alert>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowTemplateDialog(false)}>
              Cancelar
            </Button>
            <Button onClick={saveTemplate} disabled={savingTemplate}>
              <Save className="h-4 w-4 mr-2" />
              {savingTemplate ? 'A guardar...' : 'Guardar Template'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Preview Dialog */}
      <Dialog open={showPreview} onOpenChange={setShowPreview}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              <Eye className="h-5 w-5 inline mr-2" />
              Preview do Template
            </DialogTitle>
            <DialogDescription>
              Visualização com dados de exemplo
            </DialogDescription>
          </DialogHeader>
          
          <div className="py-4">
            {templateForm.type === 'email' && templateForm.subject && (
              <div className="mb-4 p-3 bg-muted rounded-md">
                <p className="text-sm font-medium mb-1">Assunto:</p>
                <p className="text-sm">{templateForm.subject.replace(/\{\{(\w+)\}\}/g, (_, key) => {
                  const mockValues: Record<string, string> = {
                    vehiclePlate: 'AB-12-CD',
                    workshopName: workshopData.name || 'AutoRepair Lda'
                  }
                  return mockValues[key] || `{{${key}}}`
                })}</p>
              </div>
            )}
            
            <Card>
              <CardContent className="p-6">
                {templateForm.type === 'email' ? (
                  <div 
                    dangerouslySetInnerHTML={{ __html: previewContent }}
                    className="prose max-w-none"
                  />
                ) : (
                  <pre className="whitespace-pre-wrap font-mono text-sm">
                    {previewContent}
                  </pre>
                )}
              </CardContent>
            </Card>
          </div>

          <DialogFooter>
            <Button onClick={() => setShowPreview(false)}>
              Fechar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Community Library Dialog */}
      <Dialog open={showLibrary} onOpenChange={setShowLibrary}>
        <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              <Library className="h-5 w-5 inline mr-2" />
              Biblioteca Comunitária de Templates
            </DialogTitle>
            <DialogDescription>
              Templates profissionais prontos a usar
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {communityTemplates.map((template) => (
              <Card key={template.id} className="overflow-hidden">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="space-y-1">
                      <CardTitle className="text-lg">{template.name}</CardTitle>
                      <div className="flex gap-2">
                        <Badge variant={template.type === 'pdf' ? 'default' : 'secondary'}>
                          {template.type === 'pdf' ? '📄 PDF' : '📧 Email'}
                        </Badge>
                        <Badge variant="outline">
                          {template.category === 'service-sheet' && 'Folha de Serviço'}
                          {template.category === 'budget' && 'Orçamento'}
                          {template.category === 'general' && 'Geral'}
                        </Badge>
                        <Badge variant="outline">
                          {template.language === 'pt' && '🇵🇹 PT'}
                          {template.language === 'en' && '🇬🇧 EN'}
                          {template.language === 'es' && '🇪🇸 ES'}
                        </Badge>
                      </div>
                    </div>
                    <Button
                      size="sm"
                      onClick={() => loadCommunityTemplate(template)}
                    >
                      <Download className="h-4 w-4 mr-2" />
                      Usar Este
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="relative">
                    <pre className="text-xs bg-muted p-3 rounded-md max-h-32 overflow-hidden">
                      {template.content.substring(0, 300)}...
                    </pre>
                    <div className="absolute bottom-0 left-0 right-0 h-12 bg-gradient-to-t from-muted to-transparent" />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowLibrary(false)}>
              Fechar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Hidden file input for import */}
      <input
        type="file"
        id="template-import"
        accept=".json"
        className="hidden"
        onChange={importTemplates}
      />

      {/* Hidden file input for OCR image */}
      <input
        type="file"
        id="ocr-image-upload"
        accept="image/*"
        className="hidden"
        onChange={handleOcrImageSelect}
      />

      {/* Hidden file input for PDF */}
      <input
        type="file"
        id="pdf-upload"
        accept=".pdf,application/pdf"
        className="hidden"
        onChange={handlePdfSelect}
      />

      {/* OCR Image Dialog */}
      <Dialog open={showOcrDialog} onOpenChange={setShowOcrDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Scan className="h-5 w-5" />
              Gerar Template a partir de Imagem
            </DialogTitle>
            <DialogDescription>
              Carregue uma imagem de um template existente e o sistema irá extrair o texto automaticamente
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {ocrImagePreview ? (
              <div className="space-y-4">
                {/* Image Preview */}
                <div className="border-2 border-dashed rounded-lg p-4">
                  <div className="relative">
                    <img
                      src={ocrImagePreview}
                      alt="Template preview"
                      className="w-full h-auto max-h-96 object-contain rounded"
                    />
                    {processingOcr && (
                      <div className="absolute inset-0 bg-black/50 flex items-center justify-center rounded">
                        <div className="bg-white rounded-lg p-4 flex flex-col items-center gap-2">
                          <Loader2 className="h-8 w-8 animate-spin text-primary" />
                          <p className="text-sm">A processar imagem...</p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Image Info */}
                <Alert>
                  <FileImage className="h-4 w-4" />
                  <AlertDescription>
                    <div className="space-y-1">
                      <p className="text-sm">
                        <strong>Ficheiro:</strong> {ocrImage?.name}
                      </p>
                      <p className="text-sm">
                        <strong>Tamanho:</strong> {((ocrImage?.size || 0) / 1024).toFixed(2)} KB
                      </p>
                    </div>
                  </AlertDescription>
                </Alert>

                {/* Instructions */}
                <Alert className="border-blue-200 bg-blue-50">
                  <AlertCircle className="h-4 w-4 text-blue-600" />
                  <AlertDescription className="text-blue-900">
                    <p className="text-sm mb-2">
                      <strong>Como funciona:</strong>
                    </p>
                    <ul className="text-sm space-y-1 list-disc list-inside">
                      <li>O sistema irá extrair todo o texto visível da imagem</li>
                      <li>Pode editar e ajustar o texto após a extração</li>
                      <li>Adicione variáveis como {'{{workshopName}}'}, {'{{clientName}}'}, etc.</li>
                      <li>Melhores resultados com imagens de alta qualidade e texto legível</li>
                      <li><strong>Limite:</strong> Máximo 1MB por ficheiro</li>
                    </ul>
                  </AlertDescription>
                </Alert>
                
                {/* Size Warning if file is too large */}
                {ocrImage && ocrImage.size > 1024 * 1024 && (
                  <Alert className="border-amber-200 bg-amber-50">
                    <AlertCircle className="h-4 w-4 text-amber-600" />
                    <AlertDescription className="text-amber-900">
                      <p className="text-sm">
                        <strong>⚠️ Atenção:</strong> A imagem selecionada ({((ocrImage.size || 0) / 1024).toFixed(2)} KB) excede o limite de 1MB. 
                        Por favor, comprima a imagem antes de processar.
                      </p>
                    </AlertDescription>
                  </Alert>
                )}
              </div>
            ) : (
              <div className="border-2 border-dashed rounded-lg p-12 text-center">
                <FileImage className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-sm text-muted-foreground">
                  Nenhuma imagem selecionada
                </p>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={cancelOcrDialog}
              disabled={processingOcr}
            >
              Cancelar
            </Button>
            <Button
              onClick={() => {
                // Change image
                document.getElementById('ocr-image-upload')?.click()
              }}
              variant="outline"
              disabled={processingOcr}
            >
              <Upload className="h-4 w-4 mr-2" />
              Alterar Imagem
            </Button>
            <Button
              onClick={processImageWithOcr}
              disabled={!ocrImage || processingOcr || (ocrImage && ocrImage.size > 1024 * 1024)}
            >
              {processingOcr ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  A Processar...
                </>
              ) : (
                <>
                  <Scan className="h-4 w-4 mr-2" />
                  Extrair Texto
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* PDF OCR Dialog */}
      <Dialog open={showPdfDialog} onOpenChange={setShowPdfDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Gerar Template a partir de PDF
            </DialogTitle>
            <DialogDescription>
              Carregue um ficheiro PDF e o sistema irá extrair o texto automaticamente
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {pdfFile ? (
              <div className="space-y-4">
                {/* PDF Info Card */}
                <div className="border-2 border-dashed rounded-lg p-6">
                  <div className="flex items-start gap-4">
                    <div className="p-3 bg-red-50 rounded-lg">
                      <FileText className="h-8 w-8 text-red-600" />
                    </div>
                    <div className="flex-1">
                      <h4 className="font-medium mb-1">{pdfFile.name}</h4>
                      <div className="space-y-1 text-sm text-muted-foreground">
                        <p>
                          <strong>Tamanho:</strong> {((pdfFile.size || 0) / 1024).toFixed(2)} KB
                        </p>
                        <p>
                          <strong>Tipo:</strong> {pdfFile.type || 'application/pdf'}
                        </p>
                      </div>
                    </div>
                    {processingPdf && (
                      <div className="flex items-center gap-2 text-sm text-primary">
                        <Loader2 className="h-4 w-4 animate-spin" />
                        A processar...
                      </div>
                    )}
                  </div>
                </div>

                {/* Instructions */}
                <Alert className="border-blue-200 bg-blue-50">
                  <AlertCircle className="h-4 w-4 text-blue-600" />
                  <AlertDescription className="text-blue-900">
                    <p className="text-sm mb-2">
                      <strong>Como funciona:</strong>
                    </p>
                    <ul className="text-sm space-y-1 list-disc list-inside">
                      <li>O sistema irá extrair todo o texto do PDF (todas as páginas)</li>
                      <li>Pode editar e ajustar o texto após a extração</li>
                      <li>Adicione variáveis como {'{{workshopName}}'}, {'{{clientName}}'}, etc.</li>
                      <li>Funciona melhor com PDFs que contêm texto selecionável (não escaneados)</li>
                      <li>PDFs escaneados serão processados com OCR automático</li>
                      <li><strong>Limite:</strong> Máximo 1MB por ficheiro</li>
                    </ul>
                  </AlertDescription>
                </Alert>

                {/* Size Warning if file is too large */}
                {pdfFile && pdfFile.size > 1024 * 1024 && (
                  <Alert className="border-amber-200 bg-amber-50">
                    <AlertCircle className="h-4 w-4 text-amber-600" />
                    <AlertDescription className="text-amber-900">
                      <p className="text-sm">
                        <strong>⚠️ Atenção:</strong> O PDF selecionado ({((pdfFile.size || 0) / 1024).toFixed(2)} KB) excede o limite de 1MB. 
                        Por favor, use um PDF mais pequeno ou comprima-o antes de processar.
                      </p>
                    </AlertDescription>
                  </Alert>
                )}

                {/* Tips */}
                <Alert>
                  <Star className="h-4 w-4" />
                  <AlertDescription>
                    <div className="text-sm space-y-1">
                      <p>
                        <strong>Dica:</strong> Para melhores resultados, use PDFs com texto limpo e bem formatado.
                        O sistema preservará a estrutura do documento o máximo possível.
                      </p>
                      <p className="text-muted-foreground">
                        <strong>Alternativa para PDFs grandes:</strong> Converta o PDF para imagem (PNG/JPG) e comprima antes de processar, 
                        ou divida o PDF em ficheiros menores.
                      </p>
                    </div>
                  </AlertDescription>
                </Alert>
              </div>
            ) : (
              <div className="border-2 border-dashed rounded-lg p-12 text-center">
                <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-sm text-muted-foreground">
                  Nenhum PDF selecionado
                </p>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={cancelPdfDialog}
              disabled={processingPdf}
            >
              Cancelar
            </Button>
            <Button
              onClick={() => {
                // Change PDF
                document.getElementById('pdf-upload')?.click()
              }}
              variant="outline"
              disabled={processingPdf}
            >
              <Upload className="h-4 w-4 mr-2" />
              Alterar PDF
            </Button>
            <Button
              onClick={processPdfWithOcr}
              disabled={!pdfFile || processingPdf || (pdfFile && pdfFile.size > 1024 * 1024)}
            >
              {processingPdf ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  A Processar...
                </>
              ) : (
                <>
                  <FileText className="h-4 w-4 mr-2" />
                  Extrair Texto
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
