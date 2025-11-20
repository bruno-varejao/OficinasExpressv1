import { useState, useEffect, useRef } from 'react'
import { Button } from './ui/button'
import { Input } from './ui/input'
import { Label } from './ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table'
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs'
import { Alert, AlertDescription, AlertTitle } from './ui/alert'
import { 
  Plus, 
  Search, 
  Car, 
  Scan, 
  Edit, 
  Eye,
  Wrench,
  Droplets,
  MapPin,
  Zap,
  RotateCcw,
  Clock,
  AlertCircle,
  Bookmark,
  FileText,
  History,
  Calendar,
  Euro,
  Camera
} from 'lucide-react'
import { projectId, publicAnonKey } from '../utils/supabase/info'
import { toast } from 'sonner@2.0.3'
import { Badge } from './ui/badge'
import { ImageWithFallback } from './figma/ImageWithFallback'
import { getVehicleImageUrl } from './vehicleDatabase'
import { PortugueseLicensePlate } from './PortugueseLicensePlate'

interface VehiclesModuleProps {
  accessToken: string
}

interface Vehicle {
  id: string
  clientId: string
  licensePlate: string
  brand: string
  model: string
  version?: string
  vin?: string
  plateDate?: string
  color?: string
  mixture?: string
  driveType?: string
  bodyType?: string
  valves?: string
  markFrom?: string
  fuelType?: string
  powercv?: string
  powerkw?: string
  cubicCap?: string
  categoryType?: string
  co2?: string
  ownerType?: string
  ownerCategory?: string
  categoryIUC?: string
  isImported?: string
  mileage?: string
  createdAt: string
  // VIN Decoder fields
  AWN_k_type?: string
  AWN_code_moteur?: string
  AWN_url_image?: string
  AWN_annee_de_debut_modele?: string
  AWN_annee_de_fin_modele?: string
  AWN_model_image?: string
}

interface Client {
  id: string
  name: string
}

interface Budget {
  id: string
  number: string
  clientId: string
  vehicleId: string
  total: number
  status: string
  createdAt: string
}

interface WorkOrder {
  id: string
  number: string
  vehicleId: string
  budgetId: string
  status: string
  total?: number
  createdAt: string
}

interface Invoice {
  id: string
  number: string
  vehicleId: string
  total: number
  paymentStatus: string
  createdAt: string
}

interface VehicleHistory {
  budgets: Budget[]
  workOrders: WorkOrder[]
  invoices: Invoice[]
}

export function VehiclesModule({ accessToken }: VehiclesModuleProps) {
  // Helper function to get vehicle image with VIN Decoder priority
  const getVehicleImage = (vehicle: Vehicle) => {
    // Priority: VIN Decoder model image > VIN Decoder brand image > generic vehicle database
    if (vehicle.AWN_model_image) return vehicle.AWN_model_image
    if (vehicle.AWN_url_image) return vehicle.AWN_url_image
    return getVehicleImageUrl(vehicle.brand, vehicle.model)
  }

  // Format Portuguese license plate with automatic hyphens
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

  const [vehicles, setVehicles] = useState<Vehicle[]>([])
  const [clients, setClients] = useState<Client[]>([])
  const [filteredVehicles, setFilteredVehicles] = useState<Vehicle[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [loading, setLoading] = useState(false)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [detailsDialogOpen, setDetailsDialogOpen] = useState(false)
  const [editDialogOpen, setEditDialogOpen] = useState(false)
  const [identifyDialogOpen, setIdentifyDialogOpen] = useState(false)
  const [selectedVehicle, setSelectedVehicle] = useState<Vehicle | null>(null)
  const [vehicleHistory, setVehicleHistory] = useState<VehicleHistory>({
    budgets: [],
    workOrders: [],
    invoices: []
  })
  const [loadingHistory, setLoadingHistory] = useState(false)
  
  // Detail dialogs states
  const [budgetDetailsOpen, setBudgetDetailsOpen] = useState(false)
  const [workOrderDetailsOpen, setWorkOrderDetailsOpen] = useState(false)
  const [invoiceDetailsOpen, setInvoiceDetailsOpen] = useState(false)
  const [selectedBudgetDetails, setSelectedBudgetDetails] = useState<any>(null)
  const [selectedWorkOrderDetails, setSelectedWorkOrderDetails] = useState<any>(null)
  const [selectedInvoiceDetails, setSelectedInvoiceDetails] = useState<any>(null)
  
  // Form states
  const [licensePlateInput, setLicensePlateInput] = useState('')
  const [selectedClientId, setSelectedClientId] = useState('')
  const [brand, setBrand] = useState('')
  const [model, setModel] = useState('')
  const [version, setVersion] = useState('')
  const [vin, setVin] = useState('')
  const [plateDate, setPlateDate] = useState('')
  const [color, setColor] = useState('')
  const [mixture, setMixture] = useState('')
  const [driveType, setDriveType] = useState('')
  const [bodyType, setBodyType] = useState('')
  const [valves, setValves] = useState('')
  const [markFrom, setMarkFrom] = useState('')
  const [fuelType, setFuelType] = useState('')
  const [powercv, setPowercv] = useState('')
  const [powerkw, setPowerkw] = useState('')
  const [cubicCap, setCubicCap] = useState('')
  const [categoryType, setCategoryType] = useState('')
  const [co2, setCo2] = useState('')
  const [ownerType, setOwnerType] = useState('')
  const [ownerCategory, setOwnerCategory] = useState('')
  const [categoryIUC, setCategoryIUC] = useState('')
  const [isImported, setIsImported] = useState('')
  const [mileage, setMileage] = useState('')
  
  // VIN Decoder states
  const [AWN_k_type, setAWN_k_type] = useState('')
  const [AWN_code_moteur, setAWN_code_moteur] = useState('')
  const [AWN_url_image, setAWN_url_image] = useState('')
  const [AWN_annee_de_debut_modele, setAWN_annee_de_debut_modele] = useState('')
  const [AWN_annee_de_fin_modele, setAWN_annee_de_fin_modele] = useState('')
  const [AWN_model_image, setAWN_model_image] = useState('')
  
  // Camera OCR states
  const [cameraDialogOpen, setCameraDialogOpen] = useState(false)
  const [cameraStream, setCameraStream] = useState<MediaStream | null>(null)
  const [capturedImage, setCapturedImage] = useState<string | null>(null)
  const [processingOCR, setProcessingOCR] = useState(false)
  const [useFileUpload, setUseFileUpload] = useState(false)
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  
  // InfoMatricula integration states
  const [loadingVehicleInfo, setLoadingVehicleInfo] = useState(false)
  const [vehicleInfoData, setVehicleInfoData] = useState<any>(null)

  useEffect(() => {
    fetchVehicles()
    fetchClients()
  }, [])

  useEffect(() => {
    if (detailsDialogOpen && selectedVehicle) {
      fetchVehicleHistory(selectedVehicle.id)
    }
  }, [detailsDialogOpen, selectedVehicle])

  useEffect(() => {
    if (cameraDialogOpen && !capturedImage && !useFileUpload) {
      console.log('🎥 Tentando iniciar câmara...')
      console.log('   cameraDialogOpen:', cameraDialogOpen)
      console.log('   capturedImage:', capturedImage)
      console.log('   useFileUpload:', useFileUpload)
      startCamera()
    }
    return () => {
      if (!cameraDialogOpen) {
        stopCamera()
      }
    }
  }, [cameraDialogOpen, capturedImage, useFileUpload])

  useEffect(() => {
    const filtered = vehicles.filter(vehicle => {
      if (!vehicle) return false
      return (
        (vehicle.licensePlate && vehicle.licensePlate.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (vehicle.brand && vehicle.brand.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (vehicle.model && vehicle.model.toLowerCase().includes(searchTerm.toLowerCase()))
      )
    })
    setFilteredVehicles(filtered)
  }, [searchTerm, vehicles])

  const fetchVehicles = async () => {
    setLoading(true)
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
        const vehiclesList = data.vehicles || []
        
        // Check if any vehicles were migrated
        const hasMigratedVehicles = vehiclesList.some((v: Vehicle) => v.id)
        
        setVehicles(vehiclesList)
        
        // Log for debugging
        if (vehiclesList.length > 0) {
          console.log('📋 Loaded vehicles:', vehiclesList.length)
          console.log('   Sample vehicle:', vehiclesList[0])
        }
      }
    } catch (error) {
      console.error('Error fetching vehicles:', error)
      toast.error('Erro ao carregar veículos')
    } finally {
      setLoading(false)
    }
  }

  const fetchClients = async () => {
    try {
      console.log('🔍 Fetching clients...')
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
        console.log('✅ Clients loaded:', data.clients?.length || 0)
        console.log('   Sample client:', data.clients?.[0])
        setClients(data.clients || [])
      } else {
        console.error('❌ Failed to fetch clients:', response.status)
      }
    } catch (error) {
      console.error('Error fetching clients:', error)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!selectedClientId || !licensePlateInput || !brand || !model) {
      toast.error('Preencha todos os campos obrigatórios')
      return
    }

    console.log('🚗 Creating vehicle...')
    console.log('   selectedClientId:', selectedClientId)
    console.log('   clients array length:', clients.length)
    console.log('   clients:', clients.map(c => ({ id: c?.id, name: c?.name })))

    // Verificar se o cliente selecionado existe na lista
    const clientExists = clients.some(c => c && c.id === selectedClientId)
    console.log('   clientExists check:', clientExists)
    
    if (!clientExists) {
      toast.error('O cliente selecionado não é válido. Por favor, selecione um cliente da lista.')
      return
    }

    try {
      console.log('📤 Sending POST request to create vehicle...')
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-6971b43c/vehicles`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            clientId: selectedClientId,
            licensePlate: licensePlateInput,
            brand,
            model,
            version: version || undefined,
            vin: vin || undefined,
            plateDate: plateDate || undefined,
            color: color || undefined,
            mixture: mixture || undefined,
            driveType: driveType || undefined,
            bodyType: bodyType || undefined,
            valves: valves || undefined,
            markFrom: markFrom || undefined,
            fuelType: fuelType || undefined,
            powercv: powercv || undefined,
            powerkw: powerkw || undefined,
            cubicCap: cubicCap || undefined,
            categoryType: categoryType || undefined,
            co2: co2 || undefined,
            ownerType: ownerType || undefined,
            ownerCategory: ownerCategory || undefined,
            categoryIUC: categoryIUC || undefined,
            isImported: isImported || undefined,
            mileage: mileage || undefined,
            // VIN Decoder fields
            AWN_k_type: AWN_k_type || undefined,
            AWN_code_moteur: AWN_code_moteur || undefined,
            AWN_url_image: AWN_url_image || undefined,
            AWN_annee_de_debut_modele: AWN_annee_de_debut_modele || undefined,
            AWN_annee_de_fin_modele: AWN_annee_de_fin_modele || undefined,
            AWN_model_image: AWN_model_image || undefined,
          }),
        }
      )

      if (response.ok) {
        toast.success('Veículo registado com sucesso')
        setDialogOpen(false)
        fetchVehicles()
        resetForm()
      } else {
        toast.error('Erro ao registar veículo')
      }
    } catch (error) {
      console.error('Error creating vehicle:', error)
      toast.error('Erro ao registar veículo')
    }
  }

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!selectedVehicle) {
      toast.error('Nenhum veículo selecionado')
      return
    }

    // Validação manual
    if (!selectedClientId || !licensePlateInput || !brand || !model) {
      toast.error('Preencha todos os campos obrigatórios (proprietário, matrícula, marca e modelo)')
      return
    }

    // Verificar se o cliente selecionado existe na lista
    const clientExists = clients.some(c => c && c.id === selectedClientId)
    if (!clientExists) {
      toast.error('O cliente selecionado não é válido. Por favor, selecione um cliente da lista.')
      return
    }

    try {
      console.log('🔄 Atualizando veículo:', selectedVehicle)
      console.log('   ID:', selectedVehicle.id)
      console.log('   Matrícula:', selectedVehicle.licensePlate)
      console.log('   Proprietário:', selectedClientId)
      console.log('   Cliente existe?', clientExists)
      
      if (!selectedVehicle.id) {
        console.error('❌ Vehicle ID is missing!')
        toast.error('Erro: ID do veículo não encontrado. Tente recarregar a página.')
        return
      }
      
      const url = `https://${projectId}.supabase.co/functions/v1/make-server-6971b43c/vehicles/${selectedVehicle.id}`
      console.log('   URL da requisição:', url)
      
      const response = await fetch(
        url,
        {
          method: 'PUT',
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            clientId: selectedClientId,
            licensePlate: licensePlateInput,
            brand,
            model,
            version: version || undefined,
            vin: vin || undefined,
            plateDate: plateDate || undefined,
            color: color || undefined,
            mixture: mixture || undefined,
            driveType: driveType || undefined,
            bodyType: bodyType || undefined,
            valves: valves || undefined,
            markFrom: markFrom || undefined,
            fuelType: fuelType || undefined,
            powercv: powercv || undefined,
            powerkw: powerkw || undefined,
            cubicCap: cubicCap || undefined,
            categoryType: categoryType || undefined,
            co2: co2 || undefined,
            ownerType: ownerType || undefined,
            ownerCategory: ownerCategory || undefined,
            categoryIUC: categoryIUC || undefined,
            isImported: isImported || undefined,
            mileage: mileage || undefined,
            // VIN Decoder fields
            AWN_k_type: AWN_k_type || undefined,
            AWN_code_moteur: AWN_code_moteur || undefined,
            AWN_url_image: AWN_url_image || undefined,
            AWN_annee_de_debut_modele: AWN_annee_de_debut_modele || undefined,
            AWN_annee_de_fin_modele: AWN_annee_de_fin_modele || undefined,
            AWN_model_image: AWN_model_image || undefined,
          }),
        }
      )

      if (response.ok) {
        toast.success('Veículo atualizado com sucesso')
        setEditDialogOpen(false)
        setDetailsDialogOpen(false)
        fetchVehicles()
        resetForm()
      } else {
        const errorData = await response.json().catch(() => ({ error: 'Erro desconhecido' }))
        console.error('❌ Error response from server:', errorData)
        toast.error('Erro ao atualizar veículo: ' + (errorData.error || 'Erro desconhecido'))
      }
    } catch (error) {
      console.error('❌ Error updating vehicle:', error)
      toast.error('Erro ao atualizar veículo: ' + error.message)
    }
  }

  const resetForm = () => {
    setSelectedClientId('')
    setLicensePlateInput('')
    setBrand('')
    setModel('')
    setVersion('')
    setVin('')
    setPlateDate('')
    setColor('')
    setMixture('')
    setDriveType('')
    setBodyType('')
    setValves('')
    setMarkFrom('')
    setFuelType('')
    setPowercv('')
    setPowerkw('')
    setCubicCap('')
    setCategoryType('')
    setCo2('')
    setOwnerType('')
    setOwnerCategory('')
    setCategoryIUC('')
    setIsImported('')
    setMileage('')
    // VIN Decoder fields
    setAWN_k_type('')
    setAWN_code_moteur('')
    setAWN_url_image('')
    setAWN_annee_de_debut_modele('')
    setAWN_annee_de_fin_modele('')
    setAWN_model_image('')
    setVehicleInfoData(null)
  }

  const loadVehicleForEdit = (vehicle: Vehicle) => {
    setSelectedVehicle(vehicle)
    
    // Verificar se o cliente existe na lista de clientes
    const clientExists = vehicle.clientId && clients.some(c => c && c.id === vehicle.clientId)
    if (!clientExists && vehicle.clientId) {
      console.warn('⚠️ Cliente do veículo não encontrado:', vehicle.clientId)
      toast.warning('Atenção: O proprietário original deste veículo não foi encontrado. Selecione um novo proprietário.', {
        duration: 5000
      })
      setSelectedClientId('') // Resetar para forçar seleção de um cliente válido
    } else {
      setSelectedClientId(vehicle.clientId || '')
    }
    
    setLicensePlateInput(vehicle.licensePlate)
    setBrand(vehicle.brand)
    setModel(vehicle.model)
    setVersion(vehicle.version || '')
    setVin(vehicle.vin || '')
    setPlateDate(vehicle.plateDate || '')
    setColor(vehicle.color || '')
    setMixture(vehicle.mixture || '')
    setDriveType(vehicle.driveType || '')
    setBodyType(vehicle.bodyType || '')
    setValves(vehicle.valves || '')
    setMarkFrom(vehicle.markFrom || '')
    setFuelType(vehicle.fuelType || '')
    setPowercv(vehicle.powercv || '')
    setPowerkw(vehicle.powerkw || '')
    setCubicCap(vehicle.cubicCap || '')
    setCategoryType(vehicle.categoryType || '')
    setCo2(vehicle.co2 || '')
    setOwnerType(vehicle.ownerType || '')
    setOwnerCategory(vehicle.ownerCategory || '')
    setCategoryIUC(vehicle.categoryIUC || '')
    setIsImported(vehicle.isImported || '')
    setMileage(vehicle.mileage || '')
    // VIN Decoder fields
    setAWN_k_type(vehicle.AWN_k_type || '')
    setAWN_code_moteur(vehicle.AWN_code_moteur || '')
    setAWN_url_image(vehicle.AWN_url_image || '')
    setAWN_annee_de_debut_modele(vehicle.AWN_annee_de_debut_modele || '')
    setAWN_annee_de_fin_modele(vehicle.AWN_annee_de_fin_modele || '')
    setAWN_model_image(vehicle.AWN_model_image || '')
    setVehicleInfoData(null) // Limpar dados do InfoMatricula ao editar
    setEditDialogOpen(true)
  }

  const fetchVehicleInfoFromMatricula = async (plate: string) => {
    if (!plate || plate.length < 6) {
      return null
    }

    setLoadingVehicleInfo(true)
    try {
      console.log(`🚗 Buscando dados do veículo para matrícula: ${plate}`)
      
      // Backend irá formatar a matrícula automaticamente
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-6971b43c/infomatricula/search?plate=${encodeURIComponent(plate)}`,
        {
          headers: {
            'Authorization': `Bearer ${accessToken}`
          }
        }
      )
      
      if (response.ok) {
        const data = await response.json()
        console.log('✅ Dados do veículo obtidos:', data)
        
        // Check if data has actual vehicle information
        if (data.make && data.model) {
          setVehicleInfoData(data)
          
          // Auto-fill form fields with InfoMatricula data
          setBrand(data.make || '')
          setModel(data.model || '')
          setVersion(data.version || '')
          setVin(data.vin || '')
          setPlateDate(data.plateDate || '')
          setColor(data.color || '')
          setMixture(data.mixture || '')
          setDriveType(data.driveType || '')
          setBodyType(data.bodyType || '')
          setValves(data.valves || '')
          setMarkFrom(data.markFrom || '')
          setFuelType(data.fuelType || '')
          setPowercv(data.powercv || '')
          setPowerkw(data.powerkw || '')
          setCubicCap(data.cubicCap || '')
          setCategoryType(data.categoryType || '')
          setCo2(data.co2 || '')
          setOwnerType(data.ownerType || '')
          setOwnerCategory(data.ownerCategory || '')
          setCategoryIUC(data.categoryIUC || '')
          setIsImported(data.isImported || '')
          
          // VIN Decoder fields
          console.log('🔍 Verificando dados VIN Decoder:', {
            AWN_k_type: data.AWN_k_type,
            AWN_code_moteur: data.AWN_code_moteur,
            AWN_url_image: data.AWN_url_image,
            AWN_annee_de_debut_modele: data.AWN_annee_de_debut_modele,
            AWN_annee_de_fin_modele: data.AWN_annee_de_fin_modele,
            AWN_model_image: data.AWN_model_image
          })
          
          setAWN_k_type(data.AWN_k_type || '')
          setAWN_code_moteur(data.AWN_code_moteur || '')
          setAWN_url_image(data.AWN_url_image || '')
          setAWN_annee_de_debut_modele(data.AWN_annee_de_debut_modele || '')
          setAWN_annee_de_fin_modele(data.AWN_annee_de_fin_modele || '')
          setAWN_model_image(data.AWN_model_image || '')
          
          // Show different message if VIN Decoder data is available
          const vinDecoderAvailable = data.AWN_k_type || data.AWN_code_moteur
          const vinMessage = vinDecoderAvailable 
            ? `✅ Dados VIN Decoder incluídos (K-Type: ${data.AWN_k_type || 'N/A'})`
            : data.vin 
              ? '⚠️ VIN encontrado mas dados VIN Decoder não disponíveis'
              : ''
          
          toast.success(`✅ Dados do veículo carregados automaticamente!`, {
            description: `${data.make} ${data.model}${data.version ? ' - ' + data.version : ''}${vinMessage ? '\n' + vinMessage : ''}`
          })
          
          return data
        } else {
          console.log('⚠️ Dados do veículo não disponíveis no InfoMatricula')
          setVehicleInfoData(null)
          return null
        }
      } else {
        console.log('⚠️ Matrícula não encontrada no InfoMatricula')
        const errorData = await response.json().catch(() => ({}))
        console.log('Detalhes do erro:', errorData)
        
        // Show user-friendly error message
        if (response.status === 404) {
          toast.error('Matrícula não encontrada', {
            description: 'A matrícula não foi encontrada na base de dados InfoMatricula.'
          })
        } else {
          toast.warning('Dados não disponíveis', {
            description: errorData.message || 'Não foi possível obter os dados automáticos. Preencha manualmente.'
          })
        }
        
        setVehicleInfoData(null)
        return null
      }
    } catch (error) {
      console.error('❌ Erro ao buscar dados do veículo:', error)
      toast.error('Erro ao consultar matrícula', {
        description: error instanceof Error ? error.message : 'Erro desconhecido'
      })
      setVehicleInfoData(null)
      return null
    } finally {
      setLoadingVehicleInfo(false)
    }
  }

  const handleIdentifyVehicle = async () => {
    if (!licensePlateInput) {
      toast.error('Introduza uma matrícula')
      return
    }

    setLoading(true)
    try {
      toast.info('A identificar veículo pela matrícula...')
      
      // Call InfoMatricula API via backend
      const data = await fetchVehicleInfoFromMatricula(licensePlateInput)
      
      if (data) {
        setIdentifyDialogOpen(false)
        toast.success('Veículo identificado com sucesso!')
      } else {
        toast.error('Não foi possível identificar o veículo. Introduza os dados manualmente.', {
          description: 'A matrícula pode não estar disponível na base de dados InfoMatricula.'
        })
      }
    } catch (error) {
      console.error('Error identifying vehicle:', error)
      toast.error('Erro ao identificar veículo')
    } finally {
      setLoading(false)
    }
  }

  const startCamera = async () => {
    console.log('🎬 startCamera() chamada')
    console.log('🌐 URL atual:', window.location.href)
    console.log('🔒 Protocolo:', window.location.protocol)
    console.log('🏠 Hostname:', window.location.hostname)
    
    // Check if running inside an iframe
    const isInIframe = window.self !== window.top
    console.log('🖼️ Em iframe?', isInIframe)
    
    if (isInIframe) {
      console.log('⚠️ DETECTADO: Aplicação em iframe (Figma Make Preview)')
      console.log('ℹ️ Navegadores bloqueiam câmara em iframes por segurança')
      toast.error('Câmara não disponível em preview. A usar modo Upload.', {
        description: 'Em produção (fora do Figma Make), a câmara funcionará normalmente.',
        duration: 7000
      })
      setUseFileUpload(true)
      return
    }
    
    try {
      // Check if mediaDevices is available
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        console.log('❌ navigator.mediaDevices não disponível')
        toast.error('A câmara não está disponível neste dispositivo. Use o upload de ficheiro.')
        return
      }

      console.log('✅ navigator.mediaDevices disponível')
      
      // Check if secure context
      if (!window.isSecureContext && window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1') {
        console.log('⚠️ AVISO: Não está em contexto seguro (HTTPS)')
        toast.error('Para usar a câmara, é necessário HTTPS ou localhost. Use o upload de ficheiro.', {
          duration: 6000
        })
        setUseFileUpload(true)
        return
      }
      
      console.log('🔐 Pedindo permissão de câmara ao utilizador...')
      
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { 
          facingMode: 'environment', // Prefer rear camera on mobile
          width: { ideal: 1920 },
          height: { ideal: 1080 }
        } 
      })
      
      console.log('✅ Permissão concedida! Stream obtido:', stream)
      console.log('📹 Tracks:', stream.getTracks())
      
      setCameraStream(stream)
      if (videoRef.current) {
        videoRef.current.srcObject = stream
        console.log('✅ Stream atribuído ao elemento <video>')
      } else {
        console.log('⚠️ videoRef.current é null')
      }
    } catch (error: any) {
      console.log('❌ Erro ao aceder à câmara')
      console.log('   Nome do erro:', error.name)
      console.log('   Mensagem:', error.message)
      console.log('   Erro completo:', error)
      
      // Don't log NotAllowedError as it's a user choice (already logged above)
      
      // Provide specific error messages
      if (error.name === 'NotAllowedError') {
        // Automatically switch to file upload mode when permission is denied
        setUseFileUpload(true)
        toast.error('Permissão de câmara negada. Pode usar o upload de ficheiro para continuar.', {
          duration: 6000,
          description: 'Se pretende usar a câmara, clique no ícone de câmara na barra de endereços e permita o acesso.'
        })
        // Don't close the dialog, just switch to upload mode
      } else if (error.name === 'NotFoundError') {
        toast.error('Nenhuma câmara encontrada. Use o upload de ficheiro.', {
          duration: 4000
        })
        setCameraDialogOpen(false)
      } else if (error.name === 'NotReadableError') {
        toast.error('A câmara está a ser usada por outra aplicação. Feche outras aplicações e tente novamente.', {
          duration: 4000
        })
      } else {
        toast.error('Erro ao aceder à câmara. Use o upload de ficheiro como alternativa.', {
          duration: 4000
        })
        setCameraDialogOpen(false)
      }
    }
  }

  const stopCamera = () => {
    if (cameraStream) {
      cameraStream.getTracks().forEach(track => track.stop())
      setCameraStream(null)
    }
  }

  const capturePhoto = () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current
      const canvas = canvasRef.current
      canvas.width = video.videoWidth
      canvas.height = video.videoHeight
      const ctx = canvas.getContext('2d')
      if (ctx) {
        ctx.drawImage(video, 0, 0)
        const imageData = canvas.toDataURL('image/jpeg', 0.8)
        setCapturedImage(imageData)
        stopCamera()
      }
    }
  }

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        toast.error('Por favor, selecione um ficheiro de imagem.')
        return
      }

      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        toast.error('O ficheiro é muito grande. Máximo: 5MB')
        return
      }

      const reader = new FileReader()
      reader.onload = (e) => {
        const imageData = e.target?.result as string
        setCapturedImage(imageData)
        stopCamera()
      }
      reader.onerror = () => {
        toast.error('Erro ao ler o ficheiro')
      }
      reader.readAsDataURL(file)
    }
  }

  const processLicensePlate = async () => {
    if (!capturedImage) return

    setProcessingOCR(true)
    try {
      toast.info('A processar imagem...')

      // Call backend OCR endpoint
      const response = await fetch(`https://${projectId}.supabase.co/functions/v1/make-server-6971b43c/ocr/license-plate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`,
        },
        body: JSON.stringify({
          imageBase64: capturedImage
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        console.error('OCR API error:', errorData)
        toast.error(errorData.error || 'Erro ao processar imagem')
        return
      }

      const result = await response.json()
      
      if (result.success && result.licensePlate) {
        const formattedPlate = formatLicensePlate(result.licensePlate)
        setLicensePlateInput(formattedPlate)
        toast.success(`Matrícula detectada: ${formattedPlate}`)
        setCameraDialogOpen(false)
        setCapturedImage(null)
      } else {
        toast.error(result.error || 'Não foi possível detectar uma matrícula válida. Tente novamente com melhor iluminação.')
        
        // Show the raw text if available for debugging
        if (result.fullText) {
          console.log('OCR text detected:', result.fullText)
        }
      }
    } catch (error: any) {
      console.error('Error processing OCR:', error)
      toast.error('Erro ao processar imagem: ' + error.message)
    } finally {
      setProcessingOCR(false)
    }
  }

  const resetCameraDialog = () => {
    stopCamera()
    setCapturedImage(null)
    setProcessingOCR(false)
    setUseFileUpload(false)
  }

  const getClientName = (clientId: string) => {
    if (!clientId) {
      return 'N/A'
    }
    const client = clients.find(c => c && c.id === clientId)
    return client?.name || 'N/A'
  }
  
  const hasInvalidClient = (clientId: string) => {
    if (!clientId) return true
    const client = clients.find(c => c && c.id === clientId)
    return !client
  }

  const fetchBudgetDetails = async (budgetId: string) => {
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
        const budget = data.budgets.find((b: any) => b.id === budgetId)
        if (budget) {
          setSelectedBudgetDetails(budget)
          setBudgetDetailsOpen(true)
        }
      }
    } catch (error) {
      console.error('Error fetching budget details:', error)
      toast.error('Erro ao carregar detalhes do orçamento')
    }
  }

  const fetchWorkOrderDetails = async (workOrderId: string) => {
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
        const workOrder = data.workOrders.find((w: any) => w.id === workOrderId)
        if (workOrder) {
          setSelectedWorkOrderDetails(workOrder)
          setWorkOrderDetailsOpen(true)
        }
      }
    } catch (error) {
      console.error('Error fetching work order details:', error)
      toast.error('Erro ao carregar detalhes da folha de obra')
    }
  }

  const fetchInvoiceDetails = async (invoiceId: string) => {
    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-6971b43c/invoices`,
        {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
          },
        }
      )

      if (response.ok) {
        const data = await response.json()
        const invoice = data.invoices.find((i: any) => i.id === invoiceId)
        if (invoice) {
          setSelectedInvoiceDetails(invoice)
          setInvoiceDetailsOpen(true)
        }
      }
    } catch (error) {
      console.error('Error fetching invoice details:', error)
      toast.error('Erro ao carregar detalhes da fatura')
    }
  }

  const fetchVehicleHistory = async (vehicleId: string) => {
    setLoadingHistory(true)
    try {
      // Fetch budgets
      const budgetsResponse = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-6971b43c/budgets`,
        {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
          },
        }
      )

      // Fetch work orders
      const workOrdersResponse = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-6971b43c/workorders`,
        {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
          },
        }
      )

      // Fetch invoices
      const invoicesResponse = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-6971b43c/invoices`,
        {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
          },
        }
      )

      let budgets: Budget[] = []
      let workOrders: WorkOrder[] = []
      let invoices: Invoice[] = []

      if (budgetsResponse.ok) {
        const data = await budgetsResponse.json()
        budgets = (data.budgets || []).filter((b: Budget) => b && b.vehicleId === vehicleId)
      }

      if (workOrdersResponse.ok) {
        const data = await workOrdersResponse.json()
        workOrders = (data.workOrders || []).filter((w: WorkOrder) => w && w.vehicleId === vehicleId)
      }

      if (invoicesResponse.ok) {
        const data = await invoicesResponse.json()
        invoices = (data.invoices || []).filter((i: Invoice) => i && i.vehicleId === vehicleId)
      }

      setVehicleHistory({
        budgets,
        workOrders,
        invoices
      })
    } catch (error) {
      console.error('Error fetching vehicle history:', error)
      toast.error('Erro ao carregar histórico do veículo')
    } finally {
      setLoadingHistory(false)
    }
  }



  const technicalDataCards = [
    { icon: Wrench, title: 'Torques de aperto', color: 'text-blue-500' },
    { icon: Droplets, title: 'Lubrificantes e fluidos', color: 'text-purple-500' },
    { icon: MapPin, title: 'Localização dos componentes', color: 'text-pink-500' },
    { icon: Zap, title: 'Fusíveis e relés', color: 'text-yellow-500' },
    { icon: RotateCcw, title: 'Reinicializações', color: 'text-green-500' },
    { icon: Clock, title: 'Tempos de mão de obra', color: 'text-orange-500' },
    { icon: AlertCircle, title: 'Procurar código de erro', color: 'text-red-500' },
    { icon: Bookmark, title: 'Etiquetas de identificação', color: 'text-indigo-500' },
  ]

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex-1 max-w-md relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Procurar por matrícula, marca ou modelo..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9"
          />
        </div>

        <div className="flex gap-2">
          <Dialog open={identifyDialogOpen} onOpenChange={setIdentifyDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline">
                <Scan className="mr-2 h-4 w-4" />
                Identificar Matrícula
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Identificar Veículo por Matrícula</DialogTitle>
                <DialogDescription>
                  Introduza a matrícula para obter automaticamente os dados do veículo
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="identify-plate">Matrícula</Label>
                  <Input
                    id="identify-plate"
                    placeholder="Ex: AB-12-CD"
                    value={licensePlateInput}
                    onChange={(e) => setLicensePlateInput(e.target.value.toUpperCase())}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button onClick={handleIdentifyVehicle} disabled={loading}>
                  {loading ? 'A identificar...' : 'Identificar'}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          <Dialog open={cameraDialogOpen} onOpenChange={(open) => {
            console.log('📷 Dialog estado mudou para:', open)
            setCameraDialogOpen(open)
            if (!open) {
              resetCameraDialog()
            } else {
              // Quando abre o dialog, garantir que começa em modo câmara
              console.log('🔄 Dialog aberto - resetando para modo câmara')
              setUseFileUpload(false)
              setCapturedImage(null)
            }
          }}>
            <DialogTrigger asChild>
              <Button variant="outline">
                <Camera className="mr-2 h-4 w-4" />
                Capturar Matrícula
              </Button>
            </DialogTrigger>
            <DialogContent className="dialog-fullscreen overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Capturar Matrícula por Foto</DialogTitle>
                <DialogDescription>
                  Tire uma foto da matrícula do veículo ou faça upload de uma imagem.
                  {!useFileUpload && ' O navegador pedirá permissão para aceder à câmara.'}
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                {!capturedImage ? (
                  <>
                    {/* Info alert for camera permissions */}
                    {!useFileUpload && !cameraStream && (
                      <Alert className="bg-blue-50 border-blue-200">
                        <AlertCircle className="h-4 w-4 text-blue-600" />
                        <AlertTitle className="text-blue-900">Permissão de Câmara</AlertTitle>
                        <AlertDescription className="text-blue-800 text-sm">
                          O navegador irá pedir permissão para aceder à câmara.
                          Clique em <strong>"Permitir"</strong> para continuar.
                          Se preferir, pode usar o <strong>"Upload Ficheiro"</strong> abaixo.
                        </AlertDescription>
                      </Alert>
                    )}
                    
                    {/* Toggle between camera and file upload */}
                    <div className="flex gap-2 justify-center">
                      <Button
                        type="button"
                        variant={!useFileUpload ? "default" : "outline"}
                        size="sm"
                        onClick={() => {
                          setUseFileUpload(false)
                          startCamera()
                        }}
                      >
                        <Camera className="mr-2 h-4 w-4" />
                        Usar Câmara
                      </Button>
                      <Button
                        type="button"
                        variant={useFileUpload ? "default" : "outline"}
                        size="sm"
                        onClick={() => {
                          setUseFileUpload(true)
                          stopCamera()
                        }}
                      >
                        <FileText className="mr-2 h-4 w-4" />
                        Upload Ficheiro
                      </Button>
                    </div>

                    {!useFileUpload ? (
                      <div className="relative bg-black rounded-lg overflow-hidden aspect-video">
                        <video
                          ref={videoRef}
                          autoPlay
                          playsInline
                          muted
                          className="w-full h-full object-cover"
                        />
                        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                          <div className="border-2 border-white/50 rounded-lg w-3/4 h-1/3">
                            <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-black/70 text-white px-3 py-1 rounded text-sm whitespace-nowrap">
                              Posicione a matrícula aqui
                            </div>
                          </div>
                        </div>
                        {!cameraStream && (
                          <div className="absolute inset-0 flex items-center justify-center bg-gray-900">
                            <div className="text-center text-white p-4">
                              <Camera className="h-12 w-12 mx-auto mb-2 opacity-50" />
                              <p className="text-sm">A iniciar câmara...</p>
                              <p className="text-xs mt-2 opacity-70">
                                Se a câmara não iniciar, use "Upload Ficheiro"
                              </p>
                            </div>
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="relative bg-gray-100 rounded-lg overflow-hidden aspect-video flex items-center justify-center border-2 border-dashed border-gray-300">
                        <div className="text-center p-8">
                          <FileText className="h-16 w-16 mx-auto mb-4 text-gray-400" />
                          <p className="mb-2 font-medium">Selecione uma imagem da matrícula</p>
                          <p className="text-sm text-gray-500 mb-4">
                            Formatos aceites: JPG, PNG (máx. 10MB)
                          </p>
                          <input
                            ref={fileInputRef}
                            type="file"
                            accept="image/*"
                            onChange={handleFileUpload}
                            className="hidden"
                          />
                          <Button
                            type="button"
                            onClick={() => fileInputRef.current?.click()}
                          >
                            Escolher Ficheiro
                          </Button>
                          <p className="text-xs text-gray-500 mt-2">
                            JPG, PNG ou HEIC (máx. 5MB)
                          </p>
                        </div>
                      </div>
                    )}
                  </>
                ) : (
                  <div className="relative bg-black rounded-lg overflow-hidden aspect-video">
                    <img
                      src={capturedImage}
                      alt="Captured"
                      className="w-full h-full object-contain"
                    />
                  </div>
                )}
                <canvas ref={canvasRef} className="hidden" />
              </div>
              <DialogFooter className="flex gap-2">
                {!capturedImage ? (
                  <>
                    <Button variant="outline" onClick={() => setCameraDialogOpen(false)}>
                      Cancelar
                    </Button>
                    {!useFileUpload && (
                      <Button onClick={capturePhoto} disabled={!cameraStream}>
                        <Camera className="mr-2 h-4 w-4" />
                        Capturar
                      </Button>
                    )}
                  </>
                ) : (
                  <>
                    <Button 
                      variant="outline" 
                      onClick={() => {
                        setCapturedImage(null)
                        if (!useFileUpload) {
                          startCamera()
                        }
                      }}
                    >
                      Tentar Novamente
                    </Button>
                    <Button onClick={processLicensePlate} disabled={processingOCR}>
                      {processingOCR ? 'A processar...' : 'Processar Matrícula'}
                    </Button>
                  </>
                )}
              </DialogFooter>
            </DialogContent>
          </Dialog>

          <Dialog open={dialogOpen} onOpenChange={(open) => {
            setDialogOpen(open)
            if (!open) resetForm()
          }}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Novo Veículo
              </Button>
            </DialogTrigger>
            <DialogContent className="dialog-fullscreen overflow-y-auto">
              <form onSubmit={handleSubmit}>
                <DialogHeader>
                  <DialogTitle>Registar Novo Veículo</DialogTitle>
                  <DialogDescription>
                    Adicione um novo veículo ao sistema
                  </DialogDescription>
                </DialogHeader>
                
                <div className="space-y-4 py-4">
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="clientId">Proprietário *</Label>
                      <select
                        id="clientId"
                        className="w-full rounded-md border border-input bg-input-background px-3 py-2"
                        value={selectedClientId}
                        onChange={(e) => setSelectedClientId(e.target.value)}
                        required
                      >
                        <option value="">Selecione um cliente</option>
                        {clients.filter(c => c).map((client) => (
                          <option key={client.id} value={client.id}>
                            {client.name}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="licensePlate">Matrícula *</Label>
                      <div className="flex gap-2">
                        <Input
                          id="licensePlate"
                          placeholder="AB-12-CD"
                          value={licensePlateInput}
                          onChange={(e) => setLicensePlateInput(formatLicensePlate(e.target.value))}
                          required
                        />
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => fetchVehicleInfoFromMatricula(licensePlateInput)}
                          disabled={loadingVehicleInfo || !licensePlateInput || licensePlateInput.length < 6}
                          className="shrink-0"
                        >
                          {loadingVehicleInfo ? (
                            <>
                              <div className="animate-spin h-4 w-4 border-2 border-current border-t-transparent rounded-full mr-2"></div>
                              A buscar...
                            </>
                          ) : (
                            <>
                              <Search className="h-4 w-4 mr-2" />
                              Buscar
                            </>
                          )}
                        </Button>
                      </div>
                      {vehicleInfoData && (
                        <div className="p-2 bg-gradient-to-br from-green-50 to-blue-50 rounded border-2 border-green-200 text-xs">
                          <div className="flex items-center gap-1 text-green-700 font-semibold mb-1">
                            <AlertCircle className="h-3 w-3" />
                            Dados carregados do InfoMatricula
                          </div>
                          <p className="text-gray-600">
                            {vehicleInfoData.make} {vehicleInfoData.model}
                            {vehicleInfoData.version && ` - ${vehicleInfoData.version}`}
                          </p>
                          {vehicleInfoData.AWN_k_type && (
                            <div className="mt-2 pt-2 border-t border-green-300">
                              <div className="flex items-center gap-1 text-purple-700 font-semibold mb-1">
                                <AlertCircle className="h-3 w-3" />
                                Dados VIN Decoder
                              </div>
                              <div className="text-gray-700 space-y-0.5">
                                {vehicleInfoData.AWN_k_type && (
                                  <p><span className="font-medium">K-Type:</span> {vehicleInfoData.AWN_k_type}</p>
                                )}
                                {vehicleInfoData.AWN_code_moteur && (
                                  <p><span className="font-medium">Código Motor:</span> {vehicleInfoData.AWN_code_moteur}</p>
                                )}
                                {vehicleInfoData.AWN_annee_de_debut_modele && vehicleInfoData.AWN_annee_de_fin_modele && (
                                  <p><span className="font-medium">Anos:</span> {vehicleInfoData.AWN_annee_de_debut_modele} - {vehicleInfoData.AWN_annee_de_fin_modele}</p>
                                )}
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="brand">Marca *</Label>
                      <Input
                        id="brand"
                        placeholder="Ex: BMW"
                        value={brand}
                        onChange={(e) => setBrand(e.target.value)}
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="model">Modelo *</Label>
                      <Input
                        id="model"
                        placeholder="Ex: Série 3"
                        value={model}
                        onChange={(e) => setModel(e.target.value)}
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="version">Versão</Label>
                      <Input
                        id="version"
                        placeholder="Ex: 320d xDrive"
                        value={version}
                        onChange={(e) => setVersion(e.target.value)}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="vin">VIN / Número de Chassis</Label>
                      <div className="flex gap-2">
                        <Input
                          id="vin"
                          placeholder="Ex: WBAXXXXXXXXXXXXXX"
                          value={vin}
                          onChange={(e) => setVin(e.target.value.toUpperCase())}
                          className="flex-1"
                        />
                        <Button
                          type="button"
                          variant="outline"
                          onClick={async () => {
                            if (!vin || vin.length < 17) {
                              toast.error('Por favor, insira um VIN válido (17 caracteres)')
                              return
                            }
                            setLoadingVehicleInfo(true)
                            try {
                              const response = await fetch(
                                `https://${projectId}.supabase.co/functions/v1/make-server-6971b43c/infomatricula/decode-vin?vin=${vin}`,
                                {
                                  headers: {
                                    'Authorization': `Bearer ${accessToken}`
                                  }
                                }
                              )
                              if (response.ok) {
                                const data = await response.json()
                                setVehicleInfoData({ ...vehicleInfoData, ...data })
                                // Update VIN Decoder states
                                if (data.AWN_k_type) setAWN_k_type(data.AWN_k_type)
                                if (data.AWN_code_moteur) setAWN_code_moteur(data.AWN_code_moteur)
                                if (data.AWN_url_image) setAWN_url_image(data.AWN_url_image)
                                if (data.AWN_annee_de_debut_modele) setAWN_annee_de_debut_modele(data.AWN_annee_de_debut_modele)
                                if (data.AWN_annee_de_fin_modele) setAWN_annee_de_fin_modele(data.AWN_annee_de_fin_modele)
                                if (data.AWN_model_image) setAWN_model_image(data.AWN_model_image)
                                toast.success('VIN descodificado com sucesso!')
                              } else {
                                toast.error('Não foi possível descodificar o VIN')
                              }
                            } catch (error) {
                              console.error('Error decoding VIN:', error)
                              toast.error('Erro ao descodificar VIN')
                            } finally {
                              setLoadingVehicleInfo(false)
                            }
                          }}
                          disabled={loadingVehicleInfo || !vin || vin.length < 17}
                          className="shrink-0"
                        >
                          {loadingVehicleInfo ? '...' : '🔍 VIN'}
                        </Button>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="plateDate">Data de Matrícula</Label>
                      <Input
                        id="plateDate"
                        placeholder="Ex: 2020-01-15"
                        value={plateDate}
                        onChange={(e) => setPlateDate(e.target.value)}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="markFrom">Ano de Fabrico</Label>
                      <Input
                        id="markFrom"
                        placeholder="Ex: 2020"
                        value={markFrom}
                        onChange={(e) => setMarkFrom(e.target.value)}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="color">Cor</Label>
                      <Input
                        id="color"
                        placeholder="Ex: Preto"
                        value={color}
                        onChange={(e) => setColor(e.target.value)}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="fuelType">Tipo de Combustível</Label>
                      <Input
                        id="fuelType"
                        placeholder="Ex: Diesel, Gasolina"
                        value={fuelType}
                        onChange={(e) => setFuelType(e.target.value)}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="mixture">Sistema de Injeção</Label>
                      <Input
                        id="mixture"
                        placeholder="Ex: Injeção Direta"
                        value={mixture}
                        onChange={(e) => setMixture(e.target.value)}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="valves">Válvulas</Label>
                      <Input
                        id="valves"
                        placeholder="Ex: 16V"
                        value={valves}
                        onChange={(e) => setValves(e.target.value)}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="cubicCap">Cilindrada (cm³)</Label>
                      <Input
                        id="cubicCap"
                        placeholder="Ex: 1995"
                        value={cubicCap}
                        onChange={(e) => setCubicCap(e.target.value)}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="powercv">Potência (cv)</Label>
                      <Input
                        id="powercv"
                        placeholder="Ex: 190"
                        value={powercv}
                        onChange={(e) => setPowercv(e.target.value)}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="powerkw">Potência (kW)</Label>
                      <Input
                        id="powerkw"
                        placeholder="Ex: 140"
                        value={powerkw}
                        onChange={(e) => setPowerkw(e.target.value)}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="driveType">Tipo de Tração</Label>
                      <Input
                        id="driveType"
                        placeholder="Ex: Tração às 4 rodas"
                        value={driveType}
                        onChange={(e) => setDriveType(e.target.value)}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="bodyType">Tipo de Carroçaria</Label>
                      <Input
                        id="bodyType"
                        placeholder="Ex: Berlina"
                        value={bodyType}
                        onChange={(e) => setBodyType(e.target.value)}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="categoryType">Categoria</Label>
                      <Input
                        id="categoryType"
                        placeholder="Ex: Ligeiro de passageiros"
                        value={categoryType}
                        onChange={(e) => setCategoryType(e.target.value)}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="categoryIUC">Categoria IUC</Label>
                      <Input
                        id="categoryIUC"
                        placeholder="Ex: 1400"
                        value={categoryIUC}
                        onChange={(e) => setCategoryIUC(e.target.value)}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="co2">Emissões CO₂ (g/km)</Label>
                      <Input
                        id="co2"
                        placeholder="Ex: 120"
                        value={co2}
                        onChange={(e) => setCo2(e.target.value)}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="ownerType">Tipo de Proprietário</Label>
                      <Input
                        id="ownerType"
                        placeholder="Ex: Particular"
                        value={ownerType}
                        onChange={(e) => setOwnerType(e.target.value)}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="ownerCategory">Categoria de Proprietário</Label>
                      <Input
                        id="ownerCategory"
                        placeholder="Ex: Pessoa Singular"
                        value={ownerCategory}
                        onChange={(e) => setOwnerCategory(e.target.value)}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="isImported">Veículo Importado</Label>
                      <Input
                        id="isImported"
                        placeholder="Ex: Não"
                        value={isImported}
                        onChange={(e) => setIsImported(e.target.value)}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="mileage">Quilometragem</Label>
                      <Input
                        id="mileage"
                        placeholder="Ex: 50000 km"
                        value={mileage}
                        onChange={(e) => setMileage(e.target.value)}
                      />
                    </div>
                  </div>
                  
                  {/* InfoMatricula Detailed Data Card */}
                  {vehicleInfoData && (
                    <Card className="bg-gradient-to-br from-blue-50 to-green-50 border-2 border-blue-300">
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-lg">
                          <Car className="h-5 w-5 text-blue-600" />
                          Dados Completos do InfoMatricula
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
                          {vehicleInfoData.make && (
                            <div>
                              <p className="text-xs text-gray-600">Marca</p>
                              <p className="font-semibold text-gray-900">{vehicleInfoData.make}</p>
                            </div>
                          )}
                          {vehicleInfoData.model && (
                            <div>
                              <p className="text-xs text-gray-600">Modelo</p>
                              <p className="font-semibold text-gray-900">{vehicleInfoData.model}</p>
                            </div>
                          )}
                          {vehicleInfoData.version && (
                            <div className="col-span-2 md:col-span-1">
                              <p className="text-xs text-gray-600">Versão</p>
                              <p className="font-semibold text-gray-900 text-xs">{vehicleInfoData.version}</p>
                            </div>
                          )}
                          {vehicleInfoData.vin && (
                            <div className="col-span-2">
                              <p className="text-xs text-gray-600">VIN</p>
                              <p className="font-semibold text-gray-900 text-xs font-mono">{vehicleInfoData.vin}</p>
                            </div>
                          )}
                          {vehicleInfoData.plateDate && (
                            <div>
                              <p className="text-xs text-gray-600">Data de Matrícula</p>
                              <p className="font-semibold text-gray-900">{vehicleInfoData.plateDate}</p>
                            </div>
                          )}
                          {vehicleInfoData.markFrom && (
                            <div>
                              <p className="text-xs text-gray-600">Ano</p>
                              <p className="font-semibold text-gray-900">{vehicleInfoData.markFrom}</p>
                            </div>
                          )}
                          {vehicleInfoData.fuelType && (
                            <div>
                              <p className="text-xs text-gray-600">Combustível</p>
                              <p className="font-semibold text-gray-900">{vehicleInfoData.fuelType}</p>
                            </div>
                          )}
                          {vehicleInfoData.powercv && (
                            <div>
                              <p className="text-xs text-gray-600">Potência</p>
                              <p className="font-semibold text-gray-900">{vehicleInfoData.powercv} cv</p>
                            </div>
                          )}
                          {vehicleInfoData.powerkw && (
                            <div>
                              <p className="text-xs text-gray-600">Potência (kW)</p>
                              <p className="font-semibold text-gray-900">{vehicleInfoData.powerkw} kW</p>
                            </div>
                          )}
                          {vehicleInfoData.cubicCap && (
                            <div>
                              <p className="text-xs text-gray-600">Cilindrada</p>
                              <p className="font-semibold text-gray-900">{vehicleInfoData.cubicCap}</p>
                            </div>
                          )}
                          {vehicleInfoData.color && (
                            <div>
                              <p className="text-xs text-gray-600">Cor</p>
                              <p className="font-semibold text-gray-900">{vehicleInfoData.color}</p>
                            </div>
                          )}
                          {vehicleInfoData.bodyType && (
                            <div>
                              <p className="text-xs text-gray-600">Tipo de Carroçaria</p>
                              <p className="font-semibold text-gray-900">{vehicleInfoData.bodyType}</p>
                            </div>
                          )}
                          {vehicleInfoData.mixture && (
                            <div>
                              <p className="text-xs text-gray-600">Mistura</p>
                              <p className="font-semibold text-gray-900">{vehicleInfoData.mixture}</p>
                            </div>
                          )}
                          {vehicleInfoData.valves && (
                            <div>
                              <p className="text-xs text-gray-600">Válvulas</p>
                              <p className="font-semibold text-gray-900">{vehicleInfoData.valves}</p>
                            </div>
                          )}
                          {vehicleInfoData.driveType && (
                            <div>
                              <p className="text-xs text-gray-600">Tipo de Tração</p>
                              <p className="font-semibold text-gray-900">{vehicleInfoData.driveType}</p>
                            </div>
                          )}
                          {vehicleInfoData.co2 && (
                            <div>
                              <p className="text-xs text-gray-600">Emissões CO₂</p>
                              <p className="font-semibold text-gray-900">{vehicleInfoData.co2}</p>
                            </div>
                          )}
                          {vehicleInfoData.categoryType && (
                            <div>
                              <p className="text-xs text-gray-600">Categoria</p>
                              <p className="font-semibold text-gray-900">{vehicleInfoData.categoryType}</p>
                            </div>
                          )}
                          {vehicleInfoData.categoryIUC && (
                            <div>
                              <p className="text-xs text-gray-600">Categoria IUC</p>
                              <p className="font-semibold text-gray-900">{vehicleInfoData.categoryIUC}</p>
                            </div>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  )}
                </div>

                <DialogFooter>
                  <Button type="submit">Registar Veículo</Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Vehicles Table */}
      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="text-center py-8 text-muted-foreground">A carregar...</div>
          ) : filteredVehicles.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              {searchTerm ? 'Nenhum veículo encontrado' : 'Nenhum veículo registado'}
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-20"></TableHead>
                  <TableHead>Matrícula</TableHead>
                  <TableHead>Marca / Modelo</TableHead>
                  <TableHead>Ano</TableHead>
                  <TableHead>Proprietário</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredVehicles.filter(v => v).map((vehicle) => (
                  <TableRow key={vehicle.id}>
                    <TableCell>
                      <div className="w-16 h-12 bg-slate-100 rounded overflow-hidden">
                        <ImageWithFallback
                          src={getVehicleImage(vehicle)}
                          alt={`${vehicle.brand} ${vehicle.model}`}
                          className="w-full h-full object-cover"
                        />
                      </div>
                    </TableCell>
                    <TableCell>
                      <PortugueseLicensePlate licensePlate={vehicle.licensePlate} size="sm" />
                    </TableCell>
                    <TableCell>
                      <div>
                        <p className="font-medium">{vehicle.brand}</p>
                        <p className="text-sm text-muted-foreground">{vehicle.model}</p>
                        {vehicle.motorization && (
                          <p className="text-xs text-muted-foreground">{vehicle.motorization}</p>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>{vehicle.year || '-'}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {getClientName(vehicle.clientId)}
                        {hasInvalidClient(vehicle.clientId) && (
                          <Badge variant="destructive" className="text-xs">
                            <AlertCircle className="h-3 w-3 mr-1" />
                            Sem proprietário
                          </Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex gap-2 justify-end">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setSelectedVehicle(vehicle)
                            setDetailsDialogOpen(true)
                          }}
                          title="Ver detalhes"
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => loadVehicleForEdit(vehicle)}
                          title="Editar"
                        >
                          <Edit className="h-4 w-4" />
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

      {/* Vehicle Details Dialog */}
      {selectedVehicle && (
        <Dialog open={detailsDialogOpen} onOpenChange={setDetailsDialogOpen}>
          <DialogContent className="dialog-fullscreen overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Dados Técnicos do Veículo</DialogTitle>
              <DialogDescription>
                {selectedVehicle.brand} {selectedVehicle.model} - {selectedVehicle.licensePlate}
              </DialogDescription>
            </DialogHeader>

            <Tabs defaultValue="info" className="mt-4">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="info">Informações</TabsTrigger>
                <TabsTrigger value="technical">Dados Técnicos</TabsTrigger>
                <TabsTrigger value="history">Histórico</TabsTrigger>
              </TabsList>

              <TabsContent value="info" className="space-y-4">
                <div className="grid gap-6 lg:grid-cols-3">
                  {/* Vehicle Image */}
                  <div className="lg:col-span-1">
                    <div className="relative rounded-lg overflow-hidden bg-muted aspect-[4/3]">
                      <ImageWithFallback
                        src={getVehicleImage(selectedVehicle)}
                        alt={`${selectedVehicle.brand} ${selectedVehicle.model}`}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  </div>

                  {/* Vehicle Details */}
                  <div className="lg:col-span-2 space-y-4">
                    <div className="grid gap-3 sm:grid-cols-2">
                      <div className="space-y-1">
                        <p className="text-sm text-muted-foreground">Quilometragem</p>
                        <p className="text-sm">{selectedVehicle.mileage || '-'}</p>
                      </div>
                      <div className="space-y-1">
                        <p className="text-sm text-muted-foreground">Matrícula</p>
                        <PortugueseLicensePlate licensePlate={selectedVehicle.licensePlate} size="sm" />
                      </div>
                      <div className="space-y-1">
                        <p className="text-sm text-muted-foreground">País</p>
                        <p className="text-sm">{selectedVehicle.country || 'Portugal'}</p>
                      </div>
                      <div className="space-y-1">
                        <p className="text-sm text-muted-foreground">Marca</p>
                        <p className="text-sm">{selectedVehicle.brand}</p>
                      </div>
                      <div className="space-y-1">
                        <p className="text-sm text-muted-foreground">Modelo</p>
                        <p className="text-sm">{selectedVehicle.model}</p>
                      </div>
                      <div className="space-y-1">
                        <p className="text-sm text-muted-foreground">Motorização</p>
                        <p className="text-sm">{selectedVehicle.motorization || '-'}</p>
                      </div>
                      <div className="space-y-1">
                        <p className="text-sm text-muted-foreground">Versão</p>
                        <p className="text-sm">{selectedVehicle.version || '-'}</p>
                      </div>
                      <div className="space-y-1">
                        <p className="text-sm text-muted-foreground">Alimentação</p>
                        <p className="text-sm">{selectedVehicle.fuel || '-'}</p>
                      </div>
                      <div className="space-y-1">
                        <p className="text-sm text-muted-foreground">Data de matrícula</p>
                        <p className="text-sm">
                          {selectedVehicle.registrationDate 
                            ? new Date(selectedVehicle.registrationDate).toLocaleDateString('pt-PT')
                            : '-'}
                        </p>
                      </div>
                      <div className="space-y-1">
                        <p className="text-sm text-muted-foreground">Motor</p>
                        <p className="text-sm">{selectedVehicle.engine || '-'}</p>
                      </div>
                      <div className="space-y-1">
                        <p className="text-sm text-muted-foreground">Potência</p>
                        <p className="text-sm">{selectedVehicle.power || '-'}</p>
                      </div>
                      <div className="space-y-1">
                        <p className="text-sm text-muted-foreground">Transmissão</p>
                        <p className="text-sm">{selectedVehicle.transmission || '-'}</p>
                      </div>
                      <div className="space-y-1">
                        <p className="text-sm text-muted-foreground">Cor</p>
                        <p className="text-sm">{selectedVehicle.color || '-'}</p>
                      </div>
                      <div className="space-y-1">
                        <p className="text-sm text-muted-foreground">VIN</p>
                        <p className="text-sm text-xs">{selectedVehicle.vin || '-'}</p>
                      </div>
                      <div className="space-y-1">
                        <p className="text-sm text-muted-foreground">Proprietário</p>
                        <p className="text-sm">{getClientName(selectedVehicle.clientId)}</p>
                      </div>
                    </div>

                    {/* VIN Decoder Data Section */}
                    {(selectedVehicle.AWN_k_type || selectedVehicle.AWN_code_moteur || 
                      selectedVehicle.AWN_annee_de_debut_modele || selectedVehicle.AWN_annee_de_fin_modele) && (
                      <div className="bg-blue-50 dark:bg-blue-950 rounded-lg p-4 border border-blue-200 dark:border-blue-800">
                        <h3 className="font-medium text-blue-900 dark:text-blue-100 mb-3 flex items-center gap-2">
                          <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                          </svg>
                          Informações VIN Decoder
                        </h3>
                        <div className="grid gap-3 sm:grid-cols-2">
                          {selectedVehicle.AWN_k_type && (
                            <div className="space-y-1">
                              <p className="text-sm text-blue-700 dark:text-blue-300 font-medium">K-Type / TECDOC</p>
                              <p className="text-sm text-blue-900 dark:text-blue-100">{selectedVehicle.AWN_k_type}</p>
                            </div>
                          )}
                          {selectedVehicle.AWN_code_moteur && (
                            <div className="space-y-1">
                              <p className="text-sm text-blue-700 dark:text-blue-300 font-medium">Código do Motor</p>
                              <p className="text-sm text-blue-900 dark:text-blue-100">{selectedVehicle.AWN_code_moteur}</p>
                            </div>
                          )}
                          {selectedVehicle.AWN_annee_de_debut_modele && (
                            <div className="space-y-1">
                              <p className="text-sm text-blue-700 dark:text-blue-300 font-medium">Ano de Início Produção</p>
                              <p className="text-sm text-blue-900 dark:text-blue-100">{selectedVehicle.AWN_annee_de_debut_modele}</p>
                            </div>
                          )}
                          {selectedVehicle.AWN_annee_de_fin_modele && (
                            <div className="space-y-1">
                              <p className="text-sm text-blue-700 dark:text-blue-300 font-medium">Ano de Fim Produção</p>
                              <p className="text-sm text-blue-900 dark:text-blue-100">{selectedVehicle.AWN_annee_de_fin_modele}</p>
                            </div>
                          )}
                          {selectedVehicle.AWN_url_image && (
                            <div className="space-y-1 col-span-full">
                              <p className="text-sm text-blue-700 dark:text-blue-300 font-medium">Imagem da Marca</p>
                              <img 
                                src={selectedVehicle.AWN_url_image} 
                                alt="Marca" 
                                className="h-12 object-contain"
                                onError={(e) => { e.currentTarget.style.display = 'none' }}
                              />
                            </div>
                          )}
                          {selectedVehicle.AWN_model_image && (
                            <div className="space-y-1 col-span-full">
                              <p className="text-sm text-blue-700 dark:text-blue-300 font-medium">Imagem do Modelo</p>
                              <img 
                                src={selectedVehicle.AWN_model_image} 
                                alt="Modelo" 
                                className="h-32 object-contain rounded-lg"
                                onError={(e) => { e.currentTarget.style.display = 'none' }}
                              />
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    <div className="flex gap-2 pt-2">
                      <Button
                        variant="outline"
                        onClick={() => {
                          setDetailsDialogOpen(false)
                          loadVehicleForEdit(selectedVehicle)
                        }}
                      >
                        <Edit className="mr-2 h-4 w-4" />
                        Editar
                      </Button>
                    </div>
                  </div>
                </div>

                {/* VIN Decoder Information */}
                {selectedVehicle.AWN_k_type && (
                  <Card className="border-purple-200 bg-purple-50">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2 text-purple-900">
                        <Zap className="h-5 w-5" />
                        Dados VIN Decoder
                      </CardTitle>
                      <CardDescription className="text-purple-700">
                        Informações técnicas obtidas através da descodificação VIN
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="grid gap-3 sm:grid-cols-2">
                      {selectedVehicle.AWN_k_type && (
                        <div className="space-y-1">
                          <p className="text-sm text-purple-700">K-Type / TECDOC</p>
                          <p className="font-medium text-purple-900">{selectedVehicle.AWN_k_type}</p>
                        </div>
                      )}
                      {selectedVehicle.AWN_code_moteur && (
                        <div className="space-y-1">
                          <p className="text-sm text-purple-700">Código do Motor</p>
                          <p className="font-medium text-purple-900">{selectedVehicle.AWN_code_moteur}</p>
                        </div>
                      )}
                      {selectedVehicle.AWN_annee_de_debut_modele && (
                        <div className="space-y-1">
                          <p className="text-sm text-purple-700">Ano de Início Produção</p>
                          <p className="font-medium text-purple-900">{selectedVehicle.AWN_annee_de_debut_modele}</p>
                        </div>
                      )}
                      {selectedVehicle.AWN_annee_de_fin_modele && (
                        <div className="space-y-1">
                          <p className="text-sm text-purple-700">Ano de Fim Produção</p>
                          <p className="font-medium text-purple-900">{selectedVehicle.AWN_annee_de_fin_modele}</p>
                        </div>
                      )}
                      {selectedVehicle.AWN_url_image && (
                        <div className="space-y-1 col-span-full">
                          <p className="text-sm text-purple-700">Imagem da Marca</p>
                          <img 
                            src={selectedVehicle.AWN_url_image} 
                            alt="Marca" 
                            className="h-12 object-contain"
                            onError={(e) => { e.currentTarget.style.display = 'none' }}
                          />
                        </div>
                      )}
                      {selectedVehicle.AWN_model_image && (
                        <div className="space-y-1 col-span-full">
                          <p className="text-sm text-purple-700">Imagem do Modelo</p>
                          <img 
                            src={selectedVehicle.AWN_model_image} 
                            alt="Modelo" 
                            className="h-32 object-contain rounded-lg"
                            onError={(e) => { e.currentTarget.style.display = 'none' }}
                          />
                        </div>
                      )}
                    </CardContent>
                  </Card>
                )}
              </TabsContent>

              <TabsContent value="technical" className="space-y-4">
                {/* Quick Access Cards */}
                <div>
                  <h3 className="mb-3">Acesso rápido aos dados</h3>
                  <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                    {technicalDataCards.map((card, idx) => (
                      <Card 
                        key={idx}
                        className="cursor-pointer hover:bg-muted/50 transition-colors"
                      >
                        <CardContent className="flex items-center gap-3 p-4">
                          <card.icon className={`h-5 w-5 ${card.color}`} />
                          <p className="text-sm">{card.title}</p>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>

                {/* Repair Methods */}
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <h3>Meus métodos de reparo favoritos</h3>
                    <Button variant="outline" size="sm">
                      EDITAR
                    </Button>
                  </div>
                  <Card>
                    <CardContent className="p-6 text-center text-muted-foreground">
                      <FileText className="h-12 w-12 mx-auto mb-2 opacity-50" />
                      <p>Nenhum método de reparo favorito guardado</p>
                      <p className="text-sm mt-1">Adicione métodos personalizados para acesso rápido</p>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>

              <TabsContent value="history" className="space-y-4">
                {loadingHistory ? (
                  <div className="text-center py-8 text-muted-foreground">
                    A carregar histórico...
                  </div>
                ) : (
                  <div className="space-y-6">
                    {/* Summary Cards */}
                    <div className="grid gap-4 sm:grid-cols-3">
                      <Card>
                        <CardContent className="pt-6">
                          <div className="flex items-center gap-3">
                            <FileText className="h-8 w-8 text-blue-500" />
                            <div>
                              <p className="text-muted-foreground text-sm">Orçamentos</p>
                              <p className="text-2xl">{vehicleHistory.budgets.length}</p>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                      <Card>
                        <CardContent className="pt-6">
                          <div className="flex items-center gap-3">
                            <Wrench className="h-8 w-8 text-orange-500" />
                            <div>
                              <p className="text-muted-foreground text-sm">Folhas de Obra</p>
                              <p className="text-2xl">{vehicleHistory.workOrders.length}</p>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                      <Card>
                        <CardContent className="pt-6">
                          <div className="flex items-center gap-3">
                            <Euro className="h-8 w-8 text-green-500" />
                            <div>
                              <p className="text-muted-foreground text-sm">Faturas</p>
                              <p className="text-2xl">{vehicleHistory.invoices.length}</p>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </div>

                    {/* Timeline */}
                    {vehicleHistory.budgets.length === 0 && 
                     vehicleHistory.workOrders.length === 0 && 
                     vehicleHistory.invoices.length === 0 ? (
                      <Card>
                        <CardContent className="p-6 text-center text-muted-foreground">
                          <History className="h-12 w-12 mx-auto mb-2 opacity-50" />
                          <p>Nenhum serviço registado para este veículo</p>
                        </CardContent>
                      </Card>
                    ) : (
                      <div className="space-y-4">
                        <h3 className="flex items-center gap-2">
                          <History className="h-5 w-5" />
                          Histórico de Serviços
                        </h3>

                        {/* Budgets Section */}
                        {vehicleHistory.budgets.length > 0 && (
                          <div className="space-y-2">
                            <h4 className="text-sm text-muted-foreground">Orçamentos</h4>
                            <div className="space-y-2">
                              {vehicleHistory.budgets
                                .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
                                .map(budget => (
                                  <Card 
                                    key={budget.id}
                                    className="cursor-pointer hover:bg-muted/50 transition-colors"
                                    onClick={() => fetchBudgetDetails(budget.id)}
                                  >
                                    <CardContent className="p-4">
                                      <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                          <FileText className="h-5 w-5 text-blue-500" />
                                          <div>
                                            <p className="text-sm">{budget.number}</p>
                                            <div className="flex items-center gap-2 mt-1">
                                              <Calendar className="h-3 w-3 text-muted-foreground" />
                                              <p className="text-xs text-muted-foreground">
                                                {new Date(budget.createdAt).toLocaleDateString('pt-PT', {
                                                  day: '2-digit',
                                                  month: '2-digit',
                                                  year: 'numeric'
                                                })}
                                              </p>
                                            </div>
                                          </div>
                                        </div>
                                        <div className="text-right">
                                          <p className="text-sm">€{(budget.total || budget.estimatedPrice || 0).toFixed(2)}</p>
                                          <Badge 
                                            variant={
                                              budget.status === 'approved' ? 'default' : 
                                              budget.status === 'rejected' ? 'destructive' : 
                                              'secondary'
                                            }
                                            className="mt-1"
                                          >
                                            {budget.status === 'approved' ? 'Aprovado' : 
                                             budget.status === 'rejected' ? 'Rejeitado' : 
                                             'Pendente'}
                                          </Badge>
                                        </div>
                                      </div>
                                    </CardContent>
                                  </Card>
                                ))}
                            </div>
                          </div>
                        )}

                        {/* Work Orders Section */}
                        {vehicleHistory.workOrders.length > 0 && (
                          <div className="space-y-2">
                            <h4 className="text-sm text-muted-foreground">Folhas de Obra</h4>
                            <div className="space-y-2">
                              {vehicleHistory.workOrders
                                .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
                                .map(workOrder => (
                                  <Card 
                                    key={workOrder.id}
                                    className="cursor-pointer hover:bg-muted/50 transition-colors"
                                    onClick={() => fetchWorkOrderDetails(workOrder.id)}
                                  >
                                    <CardContent className="p-4">
                                      <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                          <Wrench className="h-5 w-5 text-orange-500" />
                                          <div>
                                            <p className="text-sm">{workOrder.number}</p>
                                            <div className="flex items-center gap-2 mt-1">
                                              <Calendar className="h-3 w-3 text-muted-foreground" />
                                              <p className="text-xs text-muted-foreground">
                                                {new Date(workOrder.createdAt).toLocaleDateString('pt-PT', {
                                                  day: '2-digit',
                                                  month: '2-digit',
                                                  year: 'numeric'
                                                })}
                                              </p>
                                            </div>
                                          </div>
                                        </div>
                                        <div className="text-right">
                                          {workOrder.total && (
                                            <p className="text-sm">€{workOrder.total.toFixed(2)}</p>
                                          )}
                                          <Badge 
                                            variant={
                                              workOrder.status === 'completed' ? 'default' : 
                                              workOrder.status === 'in_progress' ? 'secondary' : 
                                              'outline'
                                            }
                                            className="mt-1"
                                          >
                                            {workOrder.status === 'completed' ? 'Concluído' : 
                                             workOrder.status === 'in_progress' ? 'Em Progresso' : 
                                             workOrder.status === 'scheduled' ? 'Agendado' :
                                             'Pendente'}
                                          </Badge>
                                        </div>
                                      </div>
                                    </CardContent>
                                  </Card>
                                ))}
                            </div>
                          </div>
                        )}

                        {/* Invoices Section */}
                        {vehicleHistory.invoices.length > 0 && (
                          <div className="space-y-2">
                            <h4 className="text-sm text-muted-foreground">Faturas</h4>
                            <div className="space-y-2">
                              {vehicleHistory.invoices
                                .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
                                .map(invoice => (
                                  <Card 
                                    key={invoice.id}
                                    className="cursor-pointer hover:bg-muted/50 transition-colors"
                                    onClick={() => fetchInvoiceDetails(invoice.id)}
                                  >
                                    <CardContent className="p-4">
                                      <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                          <Euro className="h-5 w-5 text-green-500" />
                                          <div>
                                            <p className="text-sm">{invoice.number}</p>
                                            <div className="flex items-center gap-2 mt-1">
                                              <Calendar className="h-3 w-3 text-muted-foreground" />
                                              <p className="text-xs text-muted-foreground">
                                                {new Date(invoice.createdAt).toLocaleDateString('pt-PT', {
                                                  day: '2-digit',
                                                  month: '2-digit',
                                                  year: 'numeric'
                                                })}
                                              </p>
                                            </div>
                                          </div>
                                        </div>
                                        <div className="text-right">
                                          <p className="text-sm">€{(invoice.total || 0).toFixed(2)}</p>
                                          <Badge 
                                            variant={
                                              invoice.paymentStatus === 'paid' ? 'default' : 
                                              invoice.paymentStatus === 'overdue' ? 'destructive' : 
                                              'secondary'
                                            }
                                            className="mt-1"
                                          >
                                            {invoice.paymentStatus === 'paid' ? 'Pago' : 
                                             invoice.paymentStatus === 'overdue' ? 'Atrasado' : 
                                             'Pendente'}
                                          </Badge>
                                        </div>
                                      </div>
                                    </CardContent>
                                  </Card>
                                ))}
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </TabsContent>
            </Tabs>
          </DialogContent>
        </Dialog>
      )}

      {/* Edit Vehicle Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="dialog-fullscreen overflow-y-auto">
          <form onSubmit={handleUpdate}>
            <DialogHeader>
              <DialogTitle>Editar Veículo</DialogTitle>
              <DialogDescription>
                Atualize as características do veículo
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4 py-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="edit-clientId">
                    Proprietário *
                    {selectedVehicle && hasInvalidClient(selectedVehicle.clientId) && (
                      <Badge variant="destructive" className="ml-2 text-xs">
                        <AlertCircle className="h-3 w-3 mr-1" />
                        Sem proprietário
                      </Badge>
                    )}
                  </Label>
                  <select
                    id="edit-clientId"
                    className="w-full rounded-md border border-input bg-input-background px-3 py-2"
                    value={selectedClientId}
                    onChange={(e) => setSelectedClientId(e.target.value)}
                    required
                  >
                    <option value="">Selecione um cliente</option>
                    {clients.filter(c => c).map((client) => (
                      <option key={client.id} value={client.id}>
                        {client.name}
                      </option>
                    ))}
                  </select>
                </div>
              
                <div className="space-y-2">
                  <Label htmlFor="edit-licensePlate">Matrícula *</Label>
                  <div className="flex gap-2">
                    <Input
                      id="edit-licensePlate"
                      value={licensePlateInput}
                      onChange={(e) => setLicensePlateInput(formatLicensePlate(e.target.value))}
                      required
                    />
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => fetchVehicleInfoFromMatricula(licensePlateInput)}
                      disabled={loadingVehicleInfo || !licensePlateInput || licensePlateInput.length < 6}
                      className="shrink-0"
                    >
                      {loadingVehicleInfo ? (
                        <>
                          <div className="animate-spin h-4 w-4 border-2 border-current border-t-transparent rounded-full mr-2"></div>
                          A buscar...
                        </>
                      ) : (
                        <>
                          <Search className="h-4 w-4 mr-2" />
                          Buscar
                        </>
                      )}
                    </Button>
                  </div>
                  {vehicleInfoData && (
                    <div className="p-2 bg-gradient-to-br from-green-50 to-blue-50 rounded border-2 border-green-200 text-xs">
                      <div className="flex items-center gap-1 text-green-700 font-semibold mb-1">
                        <AlertCircle className="h-3 w-3" />
                        Dados carregados do InfoMatricula
                      </div>
                      <p className="text-gray-600">
                        {vehicleInfoData.make} {vehicleInfoData.model}
                        {vehicleInfoData.version && ` - ${vehicleInfoData.version}`}
                      </p>
                      {vehicleInfoData.AWN_k_type && (
                        <div className="mt-2 pt-2 border-t border-green-300">
                          <div className="flex items-center gap-1 text-purple-700 font-semibold mb-1">
                            <AlertCircle className="h-3 w-3" />
                            Dados VIN Decoder
                          </div>
                          <div className="text-gray-700 space-y-0.5">
                            {vehicleInfoData.AWN_k_type && (
                              <p><span className="font-medium">K-Type:</span> {vehicleInfoData.AWN_k_type}</p>
                            )}
                            {vehicleInfoData.AWN_code_moteur && (
                              <p><span className="font-medium">Código Motor:</span> {vehicleInfoData.AWN_code_moteur}</p>
                            )}
                            {vehicleInfoData.AWN_annee_de_debut_modele && vehicleInfoData.AWN_annee_de_fin_modele && (
                              <p><span className="font-medium">Anos:</span> {vehicleInfoData.AWN_annee_de_debut_modele} - {vehicleInfoData.AWN_annee_de_fin_modele}</p>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="edit-brand">Marca *</Label>
                  <Input
                    id="edit-brand"
                    placeholder="Ex: BMW"
                    value={brand}
                    onChange={(e) => setBrand(e.target.value)}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="edit-model">Modelo *</Label>
                  <Input
                    id="edit-model"
                    placeholder="Ex: Série 3"
                    value={model}
                    onChange={(e) => setModel(e.target.value)}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="edit-version">Versão</Label>
                  <Input
                    id="edit-version"
                    placeholder="Ex: 320d xDrive"
                    value={version}
                    onChange={(e) => setVersion(e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="edit-vin">VIN / Número de Chassis</Label>
                  <Input
                    id="edit-vin"
                    placeholder="Ex: WBAXXXXXXXXXXXXXX"
                    value={vin}
                    onChange={(e) => setVin(e.target.value.toUpperCase())}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="edit-plateDate">Data de Matrícula</Label>
                  <Input
                    id="edit-plateDate"
                    placeholder="Ex: 2020-01-15"
                    value={plateDate}
                    onChange={(e) => setPlateDate(e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="edit-markFrom">Ano de Fabrico</Label>
                  <Input
                    id="edit-markFrom"
                    placeholder="Ex: 2020"
                    value={markFrom}
                    onChange={(e) => setMarkFrom(e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="edit-color">Cor</Label>
                  <Input
                    id="edit-color"
                    placeholder="Ex: Preto"
                    value={color}
                    onChange={(e) => setColor(e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="edit-fuelType">Tipo de Combustível</Label>
                  <Input
                    id="edit-fuelType"
                    placeholder="Ex: Diesel, Gasolina"
                    value={fuelType}
                    onChange={(e) => setFuelType(e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="edit-mixture">Sistema de Injeção</Label>
                  <Input
                    id="edit-mixture"
                    placeholder="Ex: Injeção Direta"
                    value={mixture}
                    onChange={(e) => setMixture(e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="edit-valves">Válvulas</Label>
                  <Input
                    id="edit-valves"
                    placeholder="Ex: 16V"
                    value={valves}
                    onChange={(e) => setValves(e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="edit-cubicCap">Cilindrada (cm³)</Label>
                  <Input
                    id="edit-cubicCap"
                    placeholder="Ex: 1995"
                    value={cubicCap}
                    onChange={(e) => setCubicCap(e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="edit-powercv">Potência (cv)</Label>
                  <Input
                    id="edit-powercv"
                    placeholder="Ex: 190"
                    value={powercv}
                    onChange={(e) => setPowercv(e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="edit-powerkw">Potência (kW)</Label>
                  <Input
                    id="edit-powerkw"
                    placeholder="Ex: 140"
                    value={powerkw}
                    onChange={(e) => setPowerkw(e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="edit-driveType">Tipo de Tração</Label>
                  <Input
                    id="edit-driveType"
                    placeholder="Ex: Tração às 4 rodas"
                    value={driveType}
                    onChange={(e) => setDriveType(e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="edit-bodyType">Tipo de Carroçaria</Label>
                  <Input
                    id="edit-bodyType"
                    placeholder="Ex: Berlina"
                    value={bodyType}
                    onChange={(e) => setBodyType(e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="edit-categoryType">Categoria</Label>
                  <Input
                    id="edit-categoryType"
                    placeholder="Ex: Ligeiro de passageiros"
                    value={categoryType}
                    onChange={(e) => setCategoryType(e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="edit-categoryIUC">Categoria IUC</Label>
                  <Input
                    id="edit-categoryIUC"
                    placeholder="Ex: 1400"
                    value={categoryIUC}
                    onChange={(e) => setCategoryIUC(e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="edit-co2">Emissões CO₂ (g/km)</Label>
                  <Input
                    id="edit-co2"
                    placeholder="Ex: 120"
                    value={co2}
                    onChange={(e) => setCo2(e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="edit-ownerType">Tipo de Proprietário</Label>
                  <Input
                    id="edit-ownerType"
                    placeholder="Ex: Particular"
                    value={ownerType}
                    onChange={(e) => setOwnerType(e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="edit-ownerCategory">Categoria de Proprietário</Label>
                  <Input
                    id="edit-ownerCategory"
                    placeholder="Ex: Pessoa Singular"
                    value={ownerCategory}
                    onChange={(e) => setOwnerCategory(e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="edit-isImported">Veículo Importado</Label>
                  <Input
                    id="edit-isImported"
                    placeholder="Ex: Não"
                    value={isImported}
                    onChange={(e) => setIsImported(e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="edit-mileage">Quilometragem</Label>
                  <Input
                    id="edit-mileage"
                    placeholder="Ex: 50000 km"
                    value={mileage}
                    onChange={(e) => setMileage(e.target.value)}
                  />
                </div>
              </div>
              
              {/* InfoMatricula Detailed Data Card */}
              {vehicleInfoData && (
                <Card className="bg-gradient-to-br from-blue-50 to-green-50 border-2 border-blue-300">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-lg">
                      <Car className="h-5 w-5 text-blue-600" />
                      Dados Completos do InfoMatricula
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
                      {vehicleInfoData.make && (
                        <div>
                          <p className="text-xs text-gray-600">Marca</p>
                          <p className="font-semibold text-gray-900">{vehicleInfoData.make}</p>
                        </div>
                      )}
                      {vehicleInfoData.model && (
                        <div>
                          <p className="text-xs text-gray-600">Modelo</p>
                          <p className="font-semibold text-gray-900">{vehicleInfoData.model}</p>
                        </div>
                      )}
                      {vehicleInfoData.version && (
                        <div className="col-span-2 md:col-span-1">
                          <p className="text-xs text-gray-600">Versão</p>
                          <p className="font-semibold text-gray-900 text-xs">{vehicleInfoData.version}</p>
                        </div>
                      )}
                      {vehicleInfoData.vin && (
                        <div className="col-span-2">
                          <p className="text-xs text-gray-600">VIN</p>
                          <p className="font-semibold text-gray-900 text-xs font-mono">{vehicleInfoData.vin}</p>
                        </div>
                      )}
                      {vehicleInfoData.plateDate && (
                        <div>
                          <p className="text-xs text-gray-600">Data de Matrícula</p>
                          <p className="font-semibold text-gray-900">{vehicleInfoData.plateDate}</p>
                        </div>
                      )}
                      {vehicleInfoData.markFrom && (
                        <div>
                          <p className="text-xs text-gray-600">Ano</p>
                          <p className="font-semibold text-gray-900">{vehicleInfoData.markFrom}</p>
                        </div>
                      )}
                      {vehicleInfoData.fuelType && (
                        <div>
                          <p className="text-xs text-gray-600">Combustível</p>
                          <p className="font-semibold text-gray-900">{vehicleInfoData.fuelType}</p>
                        </div>
                      )}
                      {vehicleInfoData.powercv && (
                        <div>
                          <p className="text-xs text-gray-600">Potência</p>
                          <p className="font-semibold text-gray-900">{vehicleInfoData.powercv} cv</p>
                        </div>
                      )}
                      {vehicleInfoData.powerkw && (
                        <div>
                          <p className="text-xs text-gray-600">Potência (kW)</p>
                          <p className="font-semibold text-gray-900">{vehicleInfoData.powerkw} kW</p>
                        </div>
                      )}
                      {vehicleInfoData.cubicCap && (
                        <div>
                          <p className="text-xs text-gray-600">Cilindrada</p>
                          <p className="font-semibold text-gray-900">{vehicleInfoData.cubicCap}</p>
                        </div>
                      )}
                      {vehicleInfoData.color && (
                        <div>
                          <p className="text-xs text-gray-600">Cor</p>
                          <p className="font-semibold text-gray-900">{vehicleInfoData.color}</p>
                        </div>
                      )}
                      {vehicleInfoData.bodyType && (
                        <div>
                          <p className="text-xs text-gray-600">Tipo de Carroçaria</p>
                          <p className="font-semibold text-gray-900">{vehicleInfoData.bodyType}</p>
                        </div>
                      )}
                      {vehicleInfoData.mixture && (
                        <div>
                          <p className="text-xs text-gray-600">Mistura</p>
                          <p className="font-semibold text-gray-900">{vehicleInfoData.mixture}</p>
                        </div>
                      )}
                      {vehicleInfoData.valves && (
                        <div>
                          <p className="text-xs text-gray-600">Válvulas</p>
                          <p className="font-semibold text-gray-900">{vehicleInfoData.valves}</p>
                        </div>
                      )}
                      {vehicleInfoData.driveType && (
                        <div>
                          <p className="text-xs text-gray-600">Tipo de Tração</p>
                          <p className="font-semibold text-gray-900">{vehicleInfoData.driveType}</p>
                        </div>
                      )}
                      {vehicleInfoData.co2 && (
                        <div>
                          <p className="text-xs text-gray-600">Emissões CO₂</p>
                          <p className="font-semibold text-gray-900">{vehicleInfoData.co2}</p>
                        </div>
                      )}
                      {vehicleInfoData.categoryType && (
                        <div>
                          <p className="text-xs text-gray-600">Categoria</p>
                          <p className="font-semibold text-gray-900">{vehicleInfoData.categoryType}</p>
                        </div>
                      )}
                      {vehicleInfoData.categoryIUC && (
                        <div>
                          <p className="text-xs text-gray-600">Categoria IUC</p>
                          <p className="font-semibold text-gray-900">{vehicleInfoData.categoryIUC}</p>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setEditDialogOpen(false)}>
                Cancelar
              </Button>
              <Button type="submit">Guardar Alterações</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Budget Details Dialog */}
      {selectedBudgetDetails && (
        <Dialog open={budgetDetailsOpen} onOpenChange={setBudgetDetailsOpen}>
          <DialogContent className="dialog-fullscreen overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Detalhes do Orçamento {selectedBudgetDetails.number}</DialogTitle>
              <DialogDescription>
                Criado em {new Date(selectedBudgetDetails.createdAt).toLocaleDateString('pt-PT')}
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-6 py-4">
              {/* Client and Vehicle Info */}
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <h3 className="text-sm mb-2">Cliente</h3>
                  <p className="text-sm">{getClientName(selectedBudgetDetails.clientId)}</p>
                </div>
                <div>
                  <h3 className="text-sm mb-2">Estado</h3>
                  <Badge 
                    variant={
                      selectedBudgetDetails.status === 'approved' ? 'default' : 
                      selectedBudgetDetails.status === 'rejected' ? 'destructive' : 
                      'secondary'
                    }
                  >
                    {selectedBudgetDetails.status === 'approved' ? 'Aprovado' : 
                     selectedBudgetDetails.status === 'rejected' ? 'Rejeitado' : 
                     'Pendente'}
                  </Badge>
                </div>
              </div>

              {/* Items */}
              {selectedBudgetDetails.items && selectedBudgetDetails.items.length > 0 && (
                <div>
                  <h3 className="text-sm mb-3">Peças e Materiais</h3>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Ref.</TableHead>
                        <TableHead>Descrição</TableHead>
                        <TableHead className="text-right">Qtd.</TableHead>
                        <TableHead className="text-right">Preço Unit.</TableHead>
                        <TableHead className="text-right">Total</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {selectedBudgetDetails.items.map((item: any, index: number) => (
                        <TableRow key={index}>
                          <TableCell>{item.partNumber || '-'}</TableCell>
                          <TableCell>{item.description}</TableCell>
                          <TableCell className="text-right">{item.quantity}</TableCell>
                          <TableCell className="text-right">€{item.price.toFixed(2)}</TableCell>
                          <TableCell className="text-right">€{(item.quantity * item.price).toFixed(2)}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}

              {/* Labor */}
              {selectedBudgetDetails.laborHours > 0 && (
                <div>
                  <h3 className="text-sm mb-3">Mão de Obra</h3>
                  <div className="grid gap-2 sm:grid-cols-3 text-sm">
                    <div>
                      <p className="text-muted-foreground">Horas</p>
                      <p>{selectedBudgetDetails.laborHours}h</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Taxa/Hora</p>
                      <p>€{selectedBudgetDetails.laborRate.toFixed(2)}/h</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Total</p>
                      <p>€{selectedBudgetDetails.laborTotal.toFixed(2)}</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Notes */}
              {selectedBudgetDetails.notes && (
                <div>
                  <h3 className="text-sm mb-2">Observações</h3>
                  <p className="text-sm text-muted-foreground whitespace-pre-wrap">{selectedBudgetDetails.notes}</p>
                </div>
              )}

              {/* Totals */}
              <div className="border-t pt-4">
                <div className="space-y-2 max-w-xs ml-auto">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Subtotal:</span>
                    <span>€{(selectedBudgetDetails.subtotal || 0).toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">IVA (23%):</span>
                    <span>€{(selectedBudgetDetails.tax || 0).toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between border-t pt-2">
                    <span>Total:</span>
                    <span>€{(selectedBudgetDetails.total || selectedBudgetDetails.estimatedPrice || 0).toFixed(2)}</span>
                  </div>
                </div>
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setBudgetDetailsOpen(false)}>
                Fechar
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {/* Work Order Details Dialog */}
      {selectedWorkOrderDetails && (
        <Dialog open={workOrderDetailsOpen} onOpenChange={setWorkOrderDetailsOpen}>
          <DialogContent className="dialog-fullscreen overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Detalhes da Folha de Obra {selectedWorkOrderDetails.number}</DialogTitle>
              <DialogDescription>
                Criada em {new Date(selectedWorkOrderDetails.createdAt).toLocaleDateString('pt-PT')}
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-6 py-4">
              {/* Status Info */}
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <h3 className="text-sm mb-2">Estado</h3>
                  <Badge 
                    variant={
                      selectedWorkOrderDetails.status === 'completed' ? 'default' : 
                      selectedWorkOrderDetails.status === 'in_progress' ? 'secondary' : 
                      'outline'
                    }
                  >
                    {selectedWorkOrderDetails.status === 'completed' ? 'Concluído' : 
                     selectedWorkOrderDetails.status === 'in_progress' ? 'Em Progresso' : 
                     selectedWorkOrderDetails.status === 'scheduled' ? 'Agendado' :
                     'Pendente'}
                  </Badge>
                </div>
                {selectedWorkOrderDetails.scheduledDate && (
                  <div>
                    <h3 className="text-sm mb-2">Data Agendada</h3>
                    <p className="text-sm">
                      {new Date(selectedWorkOrderDetails.scheduledDate).toLocaleDateString('pt-PT')}
                    </p>
                  </div>
                )}
              </div>

              {/* Items */}
              {selectedWorkOrderDetails.items && selectedWorkOrderDetails.items.length > 0 && (
                <div>
                  <h3 className="text-sm mb-3">Peças e Materiais</h3>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Ref.</TableHead>
                        <TableHead>Descrição</TableHead>
                        <TableHead className="text-right">Qtd.</TableHead>
                        <TableHead className="text-right">Preço Unit.</TableHead>
                        <TableHead className="text-right">Total</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {selectedWorkOrderDetails.items.map((item: any, index: number) => (
                        <TableRow key={index}>
                          <TableCell>{item.partNumber || '-'}</TableCell>
                          <TableCell>{item.description}</TableCell>
                          <TableCell className="text-right">{item.quantity}</TableCell>
                          <TableCell className="text-right">€{item.price.toFixed(2)}</TableCell>
                          <TableCell className="text-right">€{(item.quantity * item.price).toFixed(2)}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}

              {/* Labor */}
              {selectedWorkOrderDetails.laborHours > 0 && (
                <div>
                  <h3 className="text-sm mb-3">Mão de Obra</h3>
                  <div className="grid gap-2 sm:grid-cols-3 text-sm">
                    <div>
                      <p className="text-muted-foreground">Horas</p>
                      <p>{selectedWorkOrderDetails.laborHours}h</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Taxa/Hora</p>
                      <p>€{selectedWorkOrderDetails.laborRate.toFixed(2)}/h</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Total</p>
                      <p>€{selectedWorkOrderDetails.laborTotal.toFixed(2)}</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Notes */}
              {selectedWorkOrderDetails.notes && (
                <div>
                  <h3 className="text-sm mb-2">Observações</h3>
                  <p className="text-sm text-muted-foreground whitespace-pre-wrap">{selectedWorkOrderDetails.notes}</p>
                </div>
              )}

              {/* Totals */}
              {selectedWorkOrderDetails.total && (
                <div className="border-t pt-4">
                  <div className="space-y-2 max-w-xs ml-auto">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Subtotal:</span>
                      <span>€{selectedWorkOrderDetails.subtotal?.toFixed(2) || '0.00'}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">IVA (23%):</span>
                      <span>€{selectedWorkOrderDetails.tax?.toFixed(2) || '0.00'}</span>
                    </div>
                    <div className="flex justify-between border-t pt-2">
                      <span>Total:</span>
                      <span>€{(selectedWorkOrderDetails.total || 0).toFixed(2)}</span>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setWorkOrderDetailsOpen(false)}>
                Fechar
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {/* Invoice Details Dialog */}
      {selectedInvoiceDetails && (
        <Dialog open={invoiceDetailsOpen} onOpenChange={setInvoiceDetailsOpen}>
          <DialogContent className="dialog-fullscreen overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Detalhes da Fatura {selectedInvoiceDetails.number}</DialogTitle>
              <DialogDescription>
                Emitida em {new Date(selectedInvoiceDetails.createdAt).toLocaleDateString('pt-PT')}
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-6 py-4">
              {/* Payment Info */}
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <h3 className="text-sm mb-2">Estado de Pagamento</h3>
                  <Badge 
                    variant={
                      selectedInvoiceDetails.paymentStatus === 'paid' ? 'default' : 
                      selectedInvoiceDetails.paymentStatus === 'overdue' ? 'destructive' : 
                      'secondary'
                    }
                  >
                    {selectedInvoiceDetails.paymentStatus === 'paid' ? 'Pago' : 
                     selectedInvoiceDetails.paymentStatus === 'overdue' ? 'Atrasado' : 
                     'Pendente'}
                  </Badge>
                </div>
                {selectedInvoiceDetails.dueDate && (
                  <div>
                    <h3 className="text-sm mb-2">Data de Vencimento</h3>
                    <p className="text-sm">
                      {new Date(selectedInvoiceDetails.dueDate).toLocaleDateString('pt-PT')}
                    </p>
                  </div>
                )}
              </div>

              {/* Client Info */}
              {selectedInvoiceDetails.clientId && (
                <div>
                  <h3 className="text-sm mb-2">Cliente</h3>
                  <p className="text-sm">{getClientName(selectedInvoiceDetails.clientId)}</p>
                </div>
              )}

              {/* Items */}
              {selectedInvoiceDetails.items && selectedInvoiceDetails.items.length > 0 && (
                <div>
                  <h3 className="text-sm mb-3">Itens</h3>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Descrição</TableHead>
                        <TableHead className="text-right">Qtd.</TableHead>
                        <TableHead className="text-right">Preço Unit.</TableHead>
                        <TableHead className="text-right">Total</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {selectedInvoiceDetails.items.map((item: any, index: number) => (
                        <TableRow key={index}>
                          <TableCell>{item.description}</TableCell>
                          <TableCell className="text-right">{item.quantity}</TableCell>
                          <TableCell className="text-right">€{item.price.toFixed(2)}</TableCell>
                          <TableCell className="text-right">€{(item.quantity * item.price).toFixed(2)}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}

              {/* Notes */}
              {selectedInvoiceDetails.notes && (
                <div>
                  <h3 className="text-sm mb-2">Observações</h3>
                  <p className="text-sm text-muted-foreground whitespace-pre-wrap">{selectedInvoiceDetails.notes}</p>
                </div>
              )}

              {/* Totals */}
              <div className="border-t pt-4">
                <div className="space-y-2 max-w-xs ml-auto">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Subtotal:</span>
                    <span>€{selectedInvoiceDetails.subtotal?.toFixed(2) || '0.00'}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">IVA (23%):</span>
                    <span>€{selectedInvoiceDetails.tax?.toFixed(2) || '0.00'}</span>
                  </div>
                  <div className="flex justify-between border-t pt-2">
                    <span>Total:</span>
                    <span>€{(selectedInvoiceDetails.total || 0).toFixed(2)}</span>
                  </div>
                </div>
              </div>

              {/* Payment Info */}
              {selectedInvoiceDetails.paymentMethod && (
                <div>
                  <h3 className="text-sm mb-2">Método de Pagamento</h3>
                  <p className="text-sm">{selectedInvoiceDetails.paymentMethod}</p>
                </div>
              )}
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setInvoiceDetailsOpen(false)}>
                Fechar
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  )
}
