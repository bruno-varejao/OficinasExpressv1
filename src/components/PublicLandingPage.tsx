import { useState, useEffect } from 'react'
import { Button } from './ui/button'
import { Input } from './ui/input'
import { Label } from './ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card'
import { Badge } from './ui/badge'
import { projectId, publicAnonKey } from '../utils/supabase/info'
import { toast } from 'sonner@2.0.3'
import { HomeBanner } from './HomeBanner'
import { InstantQuoteResults } from './InstantQuoteResults'
import { QuoteConfirmation } from './QuoteConfirmation'
import { WorkshopResponsesViewer } from './WorkshopResponsesViewer'
import { 
  Search, 
  MapPin, 
  Wrench, 
  Car, 
  Phone, 
  Mail, 
  Building2, 
  Clock,
  Euro,
  CheckCircle,
  ArrowRight,
  LogIn,
  X,
  UserPlus,
  Shield,
  ChevronLeft,
  ChevronRight,
  RefreshCw,
  Calendar
} from 'lucide-react'

interface Service {
  id: string
  name: string
  basePrice: number
  duration: number
}

interface Workshop {
  id: string
  workshopName: string
  workshopPhone: string
  workshopEmail: string
  workshopAddress: string
  workshopLogoUrl?: string
  interventionZone?: string
  estimatedPrice: number
  duration: number
}

interface PublicLandingPageProps {
  onWorkshopLogin: () => void
  onClientLogin: () => void
  onAdminAccess: () => void
}

export function PublicLandingPage({ onWorkshopLogin, onClientLogin, onAdminAccess }: PublicLandingPageProps) {
  const [services, setServices] = useState<Service[]>([])
  const [loading, setLoading] = useState(false)
  const [step, setStep] = useState<'form' | 'instant-results' | 'selection' | 'confirmation' | 'responses'>('form')
  const [formStep, setFormStep] = useState<1 | 2 | 3>(1)
  const [platformLogos, setPlatformLogos] = useState<{
    logo?: string
    icon?: string
    favicon?: string
  }>({})
  
  const [formData, setFormData] = useState({
    licensePlate: '',
    postalCode: '',
    serviceId: '',
    clientName: '',
    clientEmail: '',
    clientPhone: '',
    notes: ''
  })
  
  const [quoteResults, setQuoteResults] = useState<{
    quoteRequestId: string
    service: any
    workshops: Workshop[]
  } | null>(null)
  
  const [selectedWorkshops, setSelectedWorkshops] = useState<string[]>([])

  // Vehicle identification state
  const [vehicleData, setVehicleData] = useState<{
    plate: string
    make: string
    model: string
    plateDate?: string
    vin?: string
  } | null>(null)
  const [loadingVehicle, setLoadingVehicle] = useState(false)
  const [vehicleIdentified, setVehicleIdentified] = useState(false)

  // Quick quote form state
  const [quickFormData, setQuickFormData] = useState({
    licensePlate: '',
    postalCode: '',
    serviceIds: [] as string[], // Changed to array for multi-service
    clientEmail: ''
  })
  const [quickLoading, setQuickLoading] = useState(false)

  // Service search autocomplete state
  const [serviceSearchText, setServiceSearchText] = useState('')
  const [filteredServices, setFilteredServices] = useState<Service[]>([])
  const [showServiceDropdown, setShowServiceDropdown] = useState(false)
  const [selectedServices, setSelectedServices] = useState<Service[]>([])

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

  // Normalize text by removing accents and special characters
  const normalizeText = (text: string): string => {
    return text
      .normalize('NFD') // Decompose characters with accents
      .replace(/[\u0300-\u036f]/g, '') // Remove diacritical marks
      .replace(/[^a-zA-Z0-9\s]/g, '') // Remove special characters except spaces
      .toLowerCase()
      .trim()
  }

  // Load services and logos on mount
  useEffect(() => {
    loadServices()
    loadPlatformLogos()
  }, [])

  // Filter services based on search text (ignoring accents and special characters)
  useEffect(() => {
    if (serviceSearchText.trim() === '') {
      setFilteredServices([])
      setShowServiceDropdown(false)
    } else {
      const normalizedSearch = normalizeText(serviceSearchText)
      // Filter out already selected services
      const filtered = services.filter(service =>
        normalizeText(service.name).includes(normalizedSearch) &&
        !selectedServices.find(s => s.id === service.id)
      )
      setFilteredServices(filtered)
      setShowServiceDropdown(filtered.length > 0)
    }
  }, [serviceSearchText, services, selectedServices])

  const loadPlatformLogos = async () => {
    try {
      console.log('🎨 Loading platform logos...')
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-6971b43c/public/platform-logos`,
        {
          headers: {
            'Authorization': `Bearer ${publicAnonKey}`,
          },
        }
      )

      console.log('📡 Platform logos response status:', response.status)

      if (response.ok) {
        const data = await response.json()
        console.log('✅ Platform logos loaded:', data)
        setPlatformLogos(data || {})
      } else {
        console.error('❌ Error response:', await response.text())
      }
    } catch (error) {
      console.error('❌ Error loading platform logos:', error)
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
        setServices(data.services)
      }
    } catch (error) {
      console.error('Error loading services:', error)
    }
  }

  // Identify vehicle by license plate
  const handleIdentifyVehicle = async () => {
    if (!formData.licensePlate || formData.licensePlate.length < 6) {
      toast.error('Por favor, insira uma matrícula válida')
      return
    }

    setLoadingVehicle(true)
    setVehicleData(null)
    setVehicleIdentified(false)

    try {
      const formattedPlate = formatLicensePlate(formData.licensePlate)
      
      console.log(`🚗 Identifying vehicle for plate: ${formattedPlate}`)

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
        console.log('✅ Vehicle data retrieved:', data)
        
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
        console.error('❌ Error response:', errorData)
        toast.error(errorData.error || 'Não foi possível identificar o veículo')
      }
    } catch (error) {
      console.error('❌ Error identifying vehicle:', error)
      toast.error('Erro ao consultar matrícula')
    } finally {
      setLoadingVehicle(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      // Validate
      if (!formData.licensePlate || !formData.postalCode || !formData.serviceId || 
          !formData.clientName || !formData.clientEmail) {
        toast.error('Por favor, preencha todos os campos obrigatórios')
        setLoading(false)
        return
      }
      
      // Validate postal code format
      if (!/^\d{4}$/.test(formData.postalCode)) {
        toast.error('Código postal inválido. Insira apenas os 4 primeiros dígitos (ex: 1000)')
        setLoading(false)
        return
      }

      console.log('📝 Generating instant quote:', formData)

      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-6971b43c/public/instant-quote`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${publicAnonKey}`,
          },
          body: JSON.stringify(formData)
        }
      )

      const data = await response.json()

      if (!response.ok) {
        toast.error(data.error || 'Erro ao gerar orçamento instantâneo')
        
        // Show available postal codes if no workshops found
        if (data.availablePostalCodes) {
          toast.info('Códigos postais disponíveis: ' + data.availablePostalCodes.join(', '))
        }
        return
      }

      console.log('✅ Instant quote generated:', data)
      
      setQuoteResults(data)
      setStep('instant-results')
      
      toast.success(`Encontrámos ${data.workshops.length} oficina(s) na sua zona!`)
    } catch (error) {
      console.error('Error generating instant quote:', error)
      toast.error('Erro ao gerar orçamento')
    } finally {
      setLoading(false)
    }
  }

  const handleNewRequest = () => {
    setStep('form')
    setFormStep(1)
    setQuoteResults(null)
    setSelectedWorkshops([])
    setVehicleData(null)
    setVehicleIdentified(false)
    setFormData({
      licensePlate: '',
      postalCode: '',
      serviceId: '',
      clientName: '',
      clientEmail: '',
      clientPhone: '',
      notes: ''
    })
    // Reset quick form
    setQuickFormData({
      licensePlate: '',
      postalCode: '',
      serviceIds: [],
      clientEmail: ''
    })
    // Reset service search
    setServiceSearchText('')
    setSelectedServices([])
    setShowServiceDropdown(false)
  }
  
  const handleToggleWorkshopSelection = (workshopId: string) => {
    console.log('🔄 Toggle workshop selection:', workshopId)
    setSelectedWorkshops(prev => {
      console.log('   Previous selection:', prev)
      if (prev.includes(workshopId)) {
        console.log('   ➖ Removing workshop')
        return prev.filter(id => id !== workshopId)
      } else {
        if (prev.length >= 3) {
          console.log('   ⚠️ Maximum 3 workshops reached')
          toast.warning('Pode selecionar no máximo 3 oficinas')
          return prev
        }
        console.log('   ➕ Adding workshop')
        return [...prev, workshopId]
      }
    })
  }
  
  const handleSendToSelectedWorkshops = async () => {
    if (selectedWorkshops.length === 0) {
      toast.error('Selecione pelo menos 1 oficina')
      return
    }
    
    setLoading(true)
    try {
      console.log('📤 Sending request to selected workshops:', selectedWorkshops)
      
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-6971b43c/public/select-workshops`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${publicAnonKey}`,
          },
          body: JSON.stringify({
            quoteRequestId: quoteResults?.quoteRequestId,
            selectedWorkshopIds: selectedWorkshops
          })
        }
      )
      
      const data = await response.json()
      
      if (!response.ok) {
        toast.error(data.error || 'Erro ao enviar pedido')
        return
      }
      
      console.log('✅ Request sent to workshops:', data)
      setStep('confirmation')
      toast.success(`Pedido enviado para ${selectedWorkshops.length} oficina(s)!`)
      
    } catch (error) {
      console.error('Error sending to workshops:', error)
      toast.error('Erro ao enviar pedido')
    } finally {
      setLoading(false)
    }
  }

  const handleNextStep = () => {
    // Validate current step
    if (formStep === 1) {
      if (!formData.licensePlate || !formData.postalCode) {
        toast.error('Por favor, preencha a matrícula e código postal')
        return
      }
      // Validate postal code format (4 digits)
      if (!/^\d{4}$/.test(formData.postalCode)) {
        toast.error('Código postal inválido. Insira apenas os 4 primeiros dígitos (ex: 1000)')
        return
      }
      // Check if vehicle has been identified
      if (!vehicleIdentified) {
        toast.error('Por favor, identifique o veículo antes de continuar')
        return
      }
    } else if (formStep === 2) {
      if (!formData.serviceId) {
        toast.error('Por favor, selecione um serviço')
        return
      }
    }
    
    if (formStep < 3) {
      setFormStep((formStep + 1) as 1 | 2 | 3)
    }
  }

  const handlePreviousStep = () => {
    if (formStep > 1) {
      setFormStep((formStep - 1) as 1 | 2 | 3)
    }
  }

  // Handle service selection from autocomplete (multi-select)
  const handleSelectService = (service: Service) => {
    // Check if service is already selected
    if (!selectedServices.find(s => s.id === service.id)) {
      const newSelectedServices = [...selectedServices, service]
      setSelectedServices(newSelectedServices)
      setQuickFormData({
        ...quickFormData, 
        serviceIds: newSelectedServices.map(s => s.id)
      })
    }
    // Clear search text to allow adding more services
    setServiceSearchText('')
    setShowServiceDropdown(false)
  }

  // Handle removing a selected service
  const handleRemoveService = (serviceId: string) => {
    const newSelectedServices = selectedServices.filter(s => s.id !== serviceId)
    setSelectedServices(newSelectedServices)
    setQuickFormData({
      ...quickFormData,
      serviceIds: newSelectedServices.map(s => s.id)
    })
  }

  // Quick quote form submission handler
  const handleQuickQuote = async () => {
    // Validate all fields
    if (!quickFormData.licensePlate || !quickFormData.postalCode || quickFormData.serviceIds.length === 0 || !quickFormData.clientEmail) {
      toast.error('Por favor, preencha todos os campos')
      return
    }

    // Validate postal code format (4 digits)
    if (!/^\d{4}$/.test(quickFormData.postalCode)) {
      toast.error('Código postal inválido. Insira apenas os 4 primeiros dígitos (ex: 1000)')
      return
    }

    // Validate license plate format (at least 6 characters)
    if (quickFormData.licensePlate.length < 6) {
      toast.error('Por favor, insira uma matrícula válida')
      return
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(quickFormData.clientEmail)) {
      toast.error('Por favor, insira um e-mail válido')
      return
    }

    setQuickLoading(true)

    try {
      const formattedPlate = formatLicensePlate(quickFormData.licensePlate)
      
      console.log(`🚗 Quick Quote: Identifying vehicle for plate: ${formattedPlate}`)

      // First, identify the vehicle
      const vehicleResponse = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-6971b43c/infomatricula/search?plate=${formattedPlate}`,
        {
          headers: {
            'Authorization': `Bearer ${publicAnonKey}`,
          },
        }
      )

      if (!vehicleResponse.ok) {
        const errorData = await vehicleResponse.json()
        toast.error(errorData.error || 'Não foi possível identificar o veículo')
        setQuickLoading(false)
        return
      }

      const vehicleData = await vehicleResponse.json()
      console.log('✅ Vehicle data retrieved:', vehicleData)

      // Create client data for instant quote with real email
      const tempClientData = {
        licensePlate: formattedPlate,
        postalCode: quickFormData.postalCode,
        serviceIds: quickFormData.serviceIds, // Send array of service IDs
        clientName: quickFormData.clientEmail.split('@')[0], // Use email username as name
        clientEmail: quickFormData.clientEmail,
        clientPhone: '',
        notes: 'Orçamento rápido solicitado via formulário expresso'
      }

      console.log('📝 Generating instant quote with quick form:', tempClientData)

      // Generate instant quote
      const quoteResponse = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-6971b43c/public/instant-quote`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${publicAnonKey}`,
          },
          body: JSON.stringify(tempClientData)
        }
      )

      const quoteData = await quoteResponse.json()

      if (!quoteResponse.ok) {
        toast.error(quoteData.error || 'Erro ao gerar orçamento instantâneo')
        
        // Show available postal codes if no workshops found
        if (quoteData.availablePostalCodes) {
          toast.info('Códigos postais disponíveis: ' + quoteData.availablePostalCodes.join(', '))
        }
        setQuickLoading(false)
        return
      }

      console.log('✅ Quick quote generated:', quoteData)
      
      // Set the vehicle data
      setVehicleData({
        plate: vehicleData.plate,
        make: vehicleData.make,
        model: vehicleData.model,
        plateDate: vehicleData.plateDate,
        vin: vehicleData.vin
      })
      setVehicleIdentified(true)

      // Set form data to match quick form (in case user wants to go back)
      setFormData({
        ...formData,
        licensePlate: formattedPlate,
        postalCode: quickFormData.postalCode,
        serviceId: quickFormData.serviceId,
        clientEmail: quickFormData.clientEmail,
        clientName: quickFormData.clientEmail.split('@')[0]
      })

      // Set quote results and move to instant results screen
      setQuoteResults(quoteData)
      setStep('instant-results')
      
      toast.success(`Encontrámos ${quoteData.workshops.length} oficina(s) na sua zona!`)
    } catch (error) {
      console.error('Error in quick quote:', error)
      toast.error('Erro ao processar pedido')
    } finally {
      setQuickLoading(false)
    }
  }

  // Debug: log when platformLogos changes
  useEffect(() => {
    console.log('🖼️ Platform logos state updated:', platformLogos)
    console.log('  - Logo:', platformLogos.logo)
    console.log('  - Icon:', platformLogos.icon)
    console.log('  - Favicon:', platformLogos.favicon)
  }, [platformLogos])

  return (
    <div className="min-h-screen bg-white relative overflow-hidden">
      {/* Animated Background */}
      <div className="fixed inset-0 -z-10">
        <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-blue-50 via-white to-orange-50"></div>
        <div className="absolute top-20 right-0 w-[600px] h-[600px] bg-blue-400/20 rounded-full blur-3xl"></div>
        <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-orange-400/20 rounded-full blur-3xl"></div>
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] bg-blue-500/10 rounded-full blur-3xl"></div>
      </div>

      {/* Header - Clean & Minimalist */}
      <header className="border-b border-blue-100 bg-white/90 backdrop-blur-xl sticky top-0 z-50 shadow-sm">
        <div className="max-w-7xl mx-auto px-6 py-6 flex items-center justify-between">
          {/* Logo - Increased Size */}
          <div className="flex items-center">
            {platformLogos.logo ? (
              <img 
                src={platformLogos.logo} 
                alt="Logo" 
                className="h-16 md:h-20 object-contain transition-all hover:scale-105"
                onError={(e) => console.error('❌ Error loading logo image:', platformLogos.logo)}
                onLoad={() => console.log('✅ Logo image loaded successfully')}
              />
            ) : platformLogos.icon ? (
              <img 
                src={platformLogos.icon} 
                alt="Icon" 
                className="h-16 md:h-20 w-auto object-contain transition-all hover:scale-105"
                onError={(e) => console.error('❌ Error loading icon image:', platformLogos.icon)}
                onLoad={() => console.log('✅ Icon image loaded successfully')}
              />
            ) : (
              <div className="relative group">
                <div className="absolute inset-0 bg-gradient-to-br from-blue-500 to-orange-500 rounded-2xl blur opacity-40 group-hover:opacity-60 transition-opacity"></div>
                <div className="relative h-16 w-16 rounded-2xl bg-gradient-to-br from-blue-600 to-orange-500 flex items-center justify-center shadow-lg group-hover:shadow-xl transition-all">
                  <Wrench className="h-8 w-8 text-white" />
                </div>
              </div>
            )}
          </div>
          
          {/* Action Buttons */}
          <div className="flex items-center gap-3">
            <Button 
              variant="ghost" 
              size="default"
              onClick={onClientLogin}
              className="hover:bg-blue-50 hover:text-blue-600 transition-all hidden sm:inline-flex"
            >
              <LogIn className="h-4 w-4 mr-2" />
              Área de Cliente
            </Button>
            <Button 
              variant="outline" 
              size="default"
              onClick={onWorkshopLogin}
              className="border-blue-200 hover:bg-blue-50 hover:border-blue-400 transition-all"
            >
              <Building2 className="h-4 w-4 mr-2" />
              <span className="hidden sm:inline">Área Reservada </span>Oficinas
            </Button>
          </div>
        </div>
      </header>

      <main className="p-[10px]">
        {step === 'form' ? (
          <>
            {/* Banner Carousel */}
            <div className="mb-12">
              <HomeBanner />
            </div>

            {/* Quick Quote Section - Single Line Form */}
            <div className="mb-8">
              <Card className="shadow-2xl border-2 border-blue-200 bg-white/95 backdrop-blur-xl relative overflow-visible">
               {/* <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-blue-600 via-orange-500 to-blue-600"></div>*/}
                
                <CardContent className="p-8 overflow-visible">
                  <div className="space-y-4">
                    {/* First Row: Matrícula, Código Postal, E-mail, Button */}
                    <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 items-end">
                    {/* Matrícula */}
                    <div className="space-y-2">
                      <Label htmlFor="quickLicensePlate" className="text-gray-700 font-semibold">
                        Matrícula
                      </Label>
                      <Input
                        id="quickLicensePlate"
                        placeholder="XX-XX-XX"
                        value={quickFormData.licensePlate}
                        onChange={(e) => setQuickFormData({...quickFormData, licensePlate: formatLicensePlate(e.target.value)})}
                        disabled={quickLoading}
                        className="border-2 border-blue-200 focus:border-blue-500 focus:ring-blue-500 h-12 text-center font-bold text-lg"
                      />
                    </div>

                    {/* Código Postal */}
                    <div className="space-y-2">
                      <Label htmlFor="quickPostalCode" className="text-gray-700 font-semibold">
                        Código Postal (CP4)
                      </Label>
                      <Input
                        id="quickPostalCode"
                        type="text"
                        inputMode="numeric"
                        maxLength={4}
                        placeholder="1000"
                        value={quickFormData.postalCode}
                        onChange={(e) => {
                          const value = e.target.value.replace(/\D/g, '').slice(0, 4)
                          setQuickFormData({...quickFormData, postalCode: value})
                        }}
                        disabled={quickLoading}
                        className="border-2 border-orange-200 focus:border-orange-500 focus:ring-orange-500 h-12 text-center font-bold text-lg"
                      />
                    </div>

                    {/* E-mail */}
                    <div className="space-y-2">
                      <Label htmlFor="quickEmail" className="text-gray-700 font-semibold">
                        E-mail
                      </Label>
                      <Input
                        id="quickEmail"
                        type="email"
                        placeholder="seuemail@exemplo.com"
                        value={quickFormData.clientEmail}
                        onChange={(e) => setQuickFormData({...quickFormData, clientEmail: e.target.value})}
                        disabled={quickLoading}
                        className="border-2 border-blue-200 focus:border-blue-500 focus:ring-blue-500 h-12"
                      />
                    </div>

                    {/* Continuar Button */}
                    <div className="relative group">
                      <div className="absolute inset-0 bg-gradient-to-r from-blue-600 to-orange-500 rounded-xl blur-xl opacity-50 group-hover:opacity-75 transition-opacity"></div>
                      <Button
                        onClick={handleQuickQuote}
                        disabled={quickLoading}
                        size="lg"
                        className="w-full relative bg-gradient-to-r from-blue-600 to-orange-500 hover:from-blue-700 hover:to-orange-600 text-white border-0 shadow-2xl font-bold text-lg h-12"
                      >
                        {quickLoading ? (
                          <span className="flex items-center justify-center">
                            <RefreshCw className="h-5 w-5 mr-2 animate-spin" />
                            A processar...
                          </span>
                        ) : (
                          <>
                            Solicitar Orçamento
                            <ArrowRight className="h-5 w-5 ml-2" />
                          </>
                        )}
                      </Button>
                    </div>
                  </div>

                  {/* Second Row: Tipo de Intervenção - Autocomplete */}
                  <div className="space-y-2 relative">
                      <Label htmlFor="quickService" className="text-gray-700 font-semibold">
                        Tipo de Intervenção
                      </Label>
                      <div className="relative">
                        <Input
                          id="quickService"
                          type="text"
                          placeholder={selectedServices.length > 0 ? "Adicionar mais serviços..." : "Pesquisar serviço..."}
                          value={serviceSearchText}
                          onChange={(e) => setServiceSearchText(e.target.value)}
                          onFocus={() => {
                            if (serviceSearchText && filteredServices.length > 0) {
                              setShowServiceDropdown(true)
                            }
                          }}
                          disabled={quickLoading}
                          className="border-2 border-purple-200 focus:border-purple-500 focus:ring-purple-500 h-12 font-semibold"
                        />
                        <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400 pointer-events-none" />
                        
                        {/* Autocomplete Dropdown */}
                        {showServiceDropdown && filteredServices.length > 0 && (
                          <div className="absolute z-[9999] w-full mt-1 bg-white border-2 border-purple-200 rounded-lg shadow-2xl max-h-60 overflow-y-auto">
                            {filteredServices.map((service) => (
                              <button
                                key={service.id}
                                type="button"
                                onClick={() => handleSelectService(service)}
                                className="w-full text-left px-4 py-3 hover:bg-purple-50 transition-colors border-b border-purple-100 last:border-b-0 font-semibold text-gray-700 hover:text-purple-700 flex items-center gap-2"
                              >
                                <Wrench className="h-4 w-4 text-purple-600" />
                                {service.name}
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                      
                      {/* Info text */}
                      <p className="text-xs text-gray-500 mt-1">
                        {selectedServices.length === 0 ? 'Pesquise e selecione os serviços desejados' : `${selectedServices.length} serviço(s) selecionado(s) - Pode adicionar mais`}
                      </p>
                    </div>

                    {/* Third Row: Selected services badges */}
                    {selectedServices.length > 0 && (
                      <div className="flex flex-wrap gap-2">
                        {selectedServices.map((service) => (
                          <div
                            key={service.id}
                            className="inline-flex items-center gap-2 bg-purple-100 text-purple-700 px-3 py-1.5 rounded-full text-sm font-semibold border border-purple-300"
                          >
                            <Wrench className="h-3 w-3" />
                            <span>{service.name}</span>
                            <button
                              type="button"
                              onClick={() => handleRemoveService(service.id)}
                              className="hover:bg-purple-200 rounded-full p-0.5 transition-colors"
                              disabled={quickLoading}
                            >
                              <X className="h-3 w-3" />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* FORMULÁRIO COMPLETO REMOVIDO - Mantendo apenas o formulário rápido simplificado */}

            {/* Benefits Section */}
            <div className="grid md:grid-cols-3 gap-8 mt-24">
              <Card className="border-0 bg-white/60 backdrop-blur-xl shadow-xl hover:shadow-2xl transition-all hover:-translate-y-1 relative overflow-hidden group">
                <div className="absolute inset-0 bg-gradient-to-br from-green-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                <CardHeader className="relative">
                  <div className="inline-flex h-14 w-14 rounded-2xl bg-gradient-to-br from-green-500 to-emerald-600 items-center justify-center mb-4 shadow-lg">
                    <CheckCircle className="h-7 w-7 text-white" />
                  </div>
                  <CardTitle className="text-xl text-gray-900">Rápido e Fácil</CardTitle>
                </CardHeader>
                <CardContent className="relative">
                  <p className="text-gray-600 leading-relaxed">
                    Receba orçamentos de várias oficinas em menos de 30 segundos
                  </p>
                </CardContent>
              </Card>
              
              <Card className="border-0 bg-white/60 backdrop-blur-xl shadow-xl hover:shadow-2xl transition-all hover:-translate-y-1 relative overflow-hidden group">
                <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                <CardHeader className="relative">
                  <div className="inline-flex h-14 w-14 rounded-2xl bg-gradient-to-br from-blue-600 to-blue-700 items-center justify-center mb-4 shadow-lg">
                    <MapPin className="h-7 w-7 text-white" />
                  </div>
                  <CardTitle className="text-xl text-gray-900">Oficinas Locais</CardTitle>
                </CardHeader>
                <CardContent className="relative">
                  <p className="text-gray-600 leading-relaxed">
                    Encontre oficinas certificadas e de confiança próximas de si
                  </p>
                </CardContent>
              </Card>
              
              <Card className="border-0 bg-white/60 backdrop-blur-xl shadow-xl hover:shadow-2xl transition-all hover:-translate-y-1 relative overflow-hidden group">
                <div className="absolute inset-0 bg-gradient-to-br from-orange-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                <CardHeader className="relative">
                  <div className="inline-flex h-14 w-14 rounded-2xl bg-gradient-to-br from-orange-500 to-orange-600 items-center justify-center mb-4 shadow-lg">
                    <Euro className="h-7 w-7 text-white" />
                  </div>
                  <CardTitle className="text-xl text-gray-900">Compare Preços</CardTitle>
                </CardHeader>
                <CardContent className="relative">
                  <p className="text-gray-600 leading-relaxed">
                    Compare orçamentos lado a lado e escolha a melhor opção
                  </p>
                </CardContent>
              </Card>
            </div>
          </>
        ) : step === 'instant-results' ? (
          <>
            {/* Instant Quote Results - Select up to 3 workshops */}
            {quoteResults && (
              <InstantQuoteResults
                workshops={quoteResults.workshops}
                serviceName={quoteResults.service.name}
                location={formData.postalCode}
                selectedWorkshops={selectedWorkshops}
                onToggleWorkshop={handleToggleWorkshopSelection}
                onContinue={handleSendToSelectedWorkshops}
                onBack={handleNewRequest}
                loading={loading}
              />
            )}
          </>
        ) : step === 'confirmation' ? (
          <>
            {/* Confirmation - Request sent successfully */}
            {quoteResults && (
              <QuoteConfirmation
                selectedWorkshops={quoteResults.workshops.filter(w => 
                  selectedWorkshops.includes(w.workshopId)
                )}
                clientEmail={formData.clientEmail}
                quoteRequestId={quoteResults.quoteRequestId}
                onNewRequest={handleNewRequest}
                onClientLogin={onClientLogin}
                onViewResponses={() => setStep('responses')}
              />
            )}
          </>
        ) : step === 'responses' ? (
          <>
            {/* Workshop Responses Viewer */}
            {quoteResults && (
              <WorkshopResponsesViewer
                quoteRequestId={quoteResults.quoteRequestId}
                clientEmail={formData.clientEmail}
                onBack={() => setStep('confirmation')}
              />
            )}
          </>
        ) : (
          <>
            {/* Old Results Section - DEPRECATED - Kept for fallback */}
            {quoteResults && (
              <div className="space-y-8">
                <div className="text-center">
                  <div className="relative inline-block mb-6">
                    <div className="absolute inset-0 bg-green-500 rounded-full blur-2xl opacity-30 animate-pulse"></div>
                    <div className="relative h-20 w-20 rounded-full bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center mx-auto shadow-2xl">
                      <CheckCircle className="h-12 w-12 text-white" />
                    </div>
                  </div>
                  <h2 className="text-4xl md:text-5xl mb-4 font-black bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">
                    Pedido Enviado com Sucesso!
                  </h2>
                  <p className="text-xl text-gray-600">
                    Encontrámos <span className="font-bold text-blue-600">{quoteResults.workshops.length} oficina(s)</span> para o serviço{' '}
                    <span className="font-bold text-orange-600">{quoteResults.quoteRequest.serviceName}</span>
                  </p>
                </div>

                <Card className="max-w-2xl mx-auto bg-gradient-to-br from-blue-50 to-orange-50 border-2 border-blue-200 shadow-2xl">
                  <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-600 to-orange-500"></div>
                  <CardHeader>
                    <CardTitle className="text-center text-2xl bg-gradient-to-r from-blue-600 to-orange-600 bg-clip-text text-transparent">
                      Resumo do Pedido
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex justify-between items-center p-3 bg-white/80 rounded-lg">
                      <span className="text-gray-600">Matrícula:</span>
                      <span className="font-bold text-blue-600">{quoteResults.quoteRequest.licensePlate}</span>
                    </div>
                    <div className="flex justify-between items-center p-3 bg-white/80 rounded-lg">
                      <span className="text-gray-600">Serviço:</span>
                      <span className="font-bold text-gray-900">{quoteResults.quoteRequest.serviceName}</span>
                    </div>
                    <div className="flex justify-between items-center p-3 bg-white/80 rounded-lg">
                      <span className="text-gray-600">Preço Base:</span>
                      <span className="font-bold text-orange-600 text-xl">€{quoteResults.quoteRequest.basePrice}</span>
                    </div>
                    <p className="text-sm text-center text-gray-500 pt-2">
                      ID do Pedido: <span className="font-mono">{quoteResults.quoteRequest.id.substring(0, 8)}</span>
                    </p>
                  </CardContent>
                </Card>

                <div>
                  <h3 className="text-3xl mb-8 text-center font-black bg-gradient-to-r from-blue-600 to-orange-600 bg-clip-text text-transparent">
                    Oficinas Disponíveis
                  </h3>
                  
                  <div className="grid md:grid-cols-2 gap-6">
                    {quoteResults.workshops.map((workshop, index) => (
                      <Card key={index} className="hover:shadow-2xl transition-all hover:-translate-y-1 border-0 bg-white/80 backdrop-blur-xl relative overflow-hidden group">
                        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500 to-orange-500"></div>
                        <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-orange-500/5 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                        <CardHeader className="relative">
                          <div className="flex items-start justify-between">
                            <div className="flex items-center gap-3">
                              {workshop.workshopLogoUrl ? (
                                <img 
                                  src={workshop.workshopLogoUrl} 
                                  alt={workshop.workshopName}
                                  className="h-12 w-auto object-contain"
                                />
                              ) : (
                                <div className="h-14 w-14 rounded-xl bg-gradient-to-br from-blue-500 to-orange-500 flex items-center justify-center shadow-lg">
                                  <Building2 className="h-7 w-7 text-white" />
                                </div>
                              )}
                              <div>
                                <CardTitle className="text-lg text-gray-900">{workshop.workshopName}</CardTitle>
                                <CardDescription className="text-xs text-gray-600">
                                  {workshop.workshopAddress}
                                </CardDescription>
                              </div>
                            </div>
                          </div>
                        </CardHeader>
                        <CardContent className="space-y-3 relative">
                          {workshop.interventionZone && (
                            <div className="flex items-center gap-2 text-sm bg-gradient-to-r from-blue-50 to-orange-50 p-3 rounded-xl border border-blue-100">
                              <div className="h-6 w-6 rounded-lg bg-blue-600 flex items-center justify-center">
                                <MapPin className="h-3 w-3 text-white" />
                              </div>
                              <span className="text-blue-700 font-semibold">
                                Atende em: {workshop.interventionZone}
                              </span>
                            </div>
                          )}
                          
                          <div className="flex items-center justify-between p-4 bg-gradient-to-r from-orange-50 to-orange-100 rounded-xl border-2 border-orange-200 shadow-md">
                            <span className="text-sm text-gray-700 font-semibold">Preço Estimado:</span>
                            <span className="text-2xl font-black text-orange-600">€{workshop.estimatedPrice}</span>
                          </div>
                          
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <Clock className="h-4 w-4" />
                            <span>Duração estimada: {workshop.duration} minutos</span>
                          </div>
                          
                          <div className="space-y-2 pt-2">
                            {workshop.workshopPhone && (
                              <div className="flex items-center gap-2 text-sm">
                                <Phone className="h-4 w-4 text-muted-foreground" />
                                <a href={`tel:${workshop.workshopPhone}`} className="hover:text-primary">
                                  {workshop.workshopPhone}
                                </a>
                              </div>
                            )}
                            {workshop.workshopEmail && (
                              <div className="flex items-center gap-2 text-sm">
                                <Mail className="h-4 w-4 text-muted-foreground" />
                                <a href={`mailto:${workshop.workshopEmail}`} className="hover:text-primary">
                                  {workshop.workshopEmail}
                                </a>
                              </div>
                            )}
                          </div>
                          
                          <div className="relative group/btn">
                            <div className="absolute inset-0 bg-gradient-to-r from-blue-600 to-orange-500 rounded-lg blur opacity-25 group-hover/btn:opacity-50 transition-opacity"></div>
                            <Button className="w-full mt-4 relative bg-gradient-to-r from-blue-600 to-orange-500 hover:from-blue-700 hover:to-orange-600 text-white border-0 shadow-lg font-semibold">
                              <Phone className="h-4 w-4 mr-2" />
                              Contactar Oficina
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>

                <div className="flex justify-center gap-4 pt-8">
                  <Button 
                    onClick={handleNewRequest} 
                    variant="outline" 
                    size="lg"
                    className="border-2 border-blue-200 hover:bg-blue-50 hover:border-blue-300 font-semibold"
                  >
                    Fazer Novo Pedido
                  </Button>
                  <div className="relative group">
                    <div className="absolute inset-0 bg-gradient-to-r from-blue-600 to-orange-500 rounded-lg blur opacity-50 group-hover:opacity-75 transition-opacity"></div>
                    <Button 
                      onClick={onClientLogin} 
                      size="lg"
                      className="relative bg-gradient-to-r from-blue-600 to-orange-500 hover:from-blue-700 hover:to-orange-600 text-white border-0 shadow-xl font-semibold"
                    >
                      Criar Conta para Acompanhar
                      <ArrowRight className="h-4 w-4 ml-2" />
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </main>

      {/* Footer - Clean Design */}
      <footer className="relative border-t border-blue-100 bg-white mt-24">
        <div className="max-w-7xl mx-auto px-6 py-12">
          <div className="grid md:grid-cols-3 gap-12 mb-8">
            <div>
              <div className="flex items-center gap-3 mb-4">
                {platformLogos.logo ? (
                  <img 
                    src={platformLogos.logo} 
                    alt="Logo" 
                    className="h-12 object-contain"
                  />
                ) : platformLogos.icon ? (
                  <img 
                    src={platformLogos.icon} 
                    alt="Icon" 
                    className="h-12 w-auto object-contain"
                  />
                ) : (
                  <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-blue-600 to-orange-500 flex items-center justify-center shadow-lg">
                    <Wrench className="h-6 w-6 text-white" />
                  </div>
                )}
              </div>
              <p className="text-sm text-gray-600 leading-relaxed">
                A plataforma mais rápida para comparar e contratar serviços automóveis em Portugal.
              </p>
            </div>
            <div>
              <h3 className="font-bold mb-4 text-gray-900">Oficinas</h3>
              <div className="space-y-3 text-sm">
                <button 
                  onClick={onWorkshopLogin} 
                  className="block text-gray-600 hover:text-blue-600 transition-colors font-medium"
                >
                  Login Oficinas
                </button>
                <button 
                  onClick={onAdminAccess} 
                  className="block text-gray-600 hover:text-orange-600 transition-colors font-medium"
                >
                  Registar Oficina
                </button>
              </div>
            </div>
            <div>
              <h3 className="font-bold mb-4 text-gray-900">Clientes</h3>
              <div className="space-y-3 text-sm">
                <button 
                  onClick={onClientLogin} 
                  className="block text-gray-600 hover:text-blue-600 transition-colors font-medium"
                >
                  Área de Cliente
                </button>
                <button 
                  onClick={onClientLogin} 
                  className="block text-gray-600 hover:text-orange-600 transition-colors font-medium"
                >
                  Criar Conta
                </button>
              </div>
            </div>
          </div>
          <div className="pt-8 border-t border-blue-100 text-center">
            <p className="text-sm text-gray-500">
              © 2025 • Todos os direitos reservados
            </p>
          </div>
        </div>
      </footer>
    </div>
  )
}