import React, { useState, useEffect } from 'react'
import { Button } from './ui/button'
import { Input } from './ui/input'
import { Label } from './ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog'
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from './ui/alert-dialog'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table'
import { Alert, AlertDescription } from './ui/alert'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select'
import { Separator } from './ui/separator'
import { Checkbox } from './ui/checkbox'
import { Plus, Search, Edit, Phone, Mail, Trash2, CreditCard, Loader2, CheckCircle2, AlertCircle, User, MapPin, Globe, Receipt, Calendar, Percent, MapPinned, Info, HelpCircle, MapPinCheck, Upload, FileSpreadsheet, Download, X, Check, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react'
import { projectId } from '../utils/supabase/info'
import { toast } from 'sonner@2.0.3'

interface ClientsModuleProps {
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

interface Client {
  id: string
  clientNumber?: string
  cardNumber?: string
  name: string
  address?: string
  postalCode?: string
  cp4?: string  // Código Postal - 4 dígitos
  cp3?: string  // Código Postal - 3 dígitos
  locality?: string
  country?: string
  nif?: string
  email1?: string
  email2?: string
  phone1: string
  phone2?: string
  phone3?: string
  discount?: number
  creditDays?: number
  vatRegime?: string
  // Contact preferences
  email1Active?: boolean
  email2Active?: boolean
  phone1Active?: boolean
  phone2Active?: boolean
  phone3Active?: boolean
  createdAt: string
  // Legacy fields for backwards compatibility
  email?: string
  phone?: string
}

export function ClientsModule({ accessToken }: ClientsModuleProps) {
  const [clients, setClients] = useState<Client[]>([])
  const [filteredClients, setFilteredClients] = useState<Client[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [loading, setLoading] = useState(false)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingClient, setEditingClient] = useState<Client | null>(null)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [clientToDelete, setClientToDelete] = useState<Client | null>(null)
  
  // Card reader states
  const [cardReaderDialogOpen, setCardReaderDialogOpen] = useState(false)
  const [cardReading, setCardReading] = useState(false)
  const [cardData, setCardData] = useState<Client | null>(null)
  const [cardReadStatus, setCardReadStatus] = useState<'idle' | 'reading' | 'success' | 'error'>('idle')
  const [middlewareDetected, setMiddlewareDetected] = useState<boolean | null>(null)
  const [testingMiddleware, setTestingMiddleware] = useState(false)
  const [middlewareTestResult, setMiddlewareTestResult] = useState<string>('')
  
  // Contact preferences states
  const [email1Active, setEmail1Active] = useState(false)
  const [email2Active, setEmail2Active] = useState(false)
  const [phone1Active, setPhone1Active] = useState(false)
  const [phone2Active, setPhone2Active] = useState(false)
  const [phone3Active, setPhone3Active] = useState(false)
  
  // Postal code search state
  const [searchingPostalCode, setSearchingPostalCode] = useState(false)
  const [addressSelectionDialogOpen, setAddressSelectionDialogOpen] = useState(false)
  const [availableAddresses, setAvailableAddresses] = useState<CttAddress[]>([])
  
  // NIF search state
  const [searchingNIF, setSearchingNIF] = useState(false)
  const [nifApiKey, setNifApiKey] = useState<string>('')
  
  // Import states
  const [importDialogOpen, setImportDialogOpen] = useState(false)
  const [importFile, setImportFile] = useState<File | null>(null)
  const [importData, setImportData] = useState<any[]>([])
  const [importColumns, setImportColumns] = useState<string[]>([])
  const [fieldMapping, setFieldMapping] = useState<Record<string, string>>({})
  const [importStep, setImportStep] = useState<'upload' | 'mapping' | 'preview' | 'importing'>('upload')
  const [importing, setImporting] = useState(false)
  const [importProgress, setImportProgress] = useState(0)
  const [importResults, setImportResults] = useState<{ 
    success: number; 
    failed: number; 
    skipped?: number;
    errors: string[];
    duplicates?: Array<{ nif: string; name: string; existingName: string; reason: string }>
  }>({ success: 0, failed: 0, errors: [] })
  
  // Postal code fields state
  const [cp4, setCp4] = useState('')
  const [cp3, setCp3] = useState('')
  const [postalCode, setPostalCode] = useState('')
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1)
  const clientsPerPage = 12

  useEffect(() => {
    fetchClients()
    checkUserProfile()
  }, [])
  
  // Fetch NIF API Key separately after accessToken is confirmed
  useEffect(() => {
    if (accessToken) {
      fetchNifApiKey()
    }
  }, [accessToken])

  // Update contact preferences and postal code when editing client
  useEffect(() => {
    if (editingClient) {
      // Se já existe valor definido (true/false), use-o; caso contrário, ative se houver dados
      setEmail1Active(editingClient.email1Active ?? (!!editingClient.email1 || !!editingClient.email))
      setEmail2Active(editingClient.email2Active ?? !!editingClient.email2)
      setPhone1Active(editingClient.phone1Active ?? (!!editingClient.phone1 || !!editingClient.phone))
      setPhone2Active(editingClient.phone2Active ?? !!editingClient.phone2)
      setPhone3Active(editingClient.phone3Active ?? !!editingClient.phone3)
      
      // Split postalCode into cp4 and cp3 if it exists
      let clientCp4 = editingClient.cp4 || ''
      let clientCp3 = editingClient.cp3 || ''
      
      // If cp4 and cp3 don't exist but postalCode does, split it
      if (!clientCp4 && !clientCp3 && editingClient.postalCode) {
        const parts = editingClient.postalCode.split('-')
        if (parts.length === 2) {
          clientCp4 = parts[0]
          clientCp3 = parts[1]
        }
      }
      
      setCp4(clientCp4)
      setCp3(clientCp3)
      setPostalCode(editingClient.postalCode || '')
    } else {
      // Defaults for new client - desativados por padrão
      setEmail1Active(false)
      setEmail2Active(false)
      setPhone1Active(false)
      setPhone2Active(false)
      setPhone3Active(false)
      setCp4('')
      setCp3('')
      setPostalCode('')
    }
  }, [editingClient])

  const checkUserProfile = async () => {
    try {
      console.log('🔍 Verificando perfil do utilizador...')
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-6971b43c/debug/check-profile`,
        {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
          },
        }
      )
      
      if (response.ok) {
        const data = await response.json()
        console.log('📊 Diagnóstico do perfil:', data)
        
        if (!data.profileInKV) {
          console.error('❌ PROBLEMA ENCONTRADO: Perfil do utilizador não existe no sistema!')
          console.log('💡 O utilizador precisa fazer signup novamente ou contactar o suporte.')
          toast.error('Perfil não encontrado! Por favor, contacte o suporte ou faça novo registo.', {
            duration: 10000
          })
        }
      }
    } catch (error) {
      console.error('Erro ao verificar perfil:', error)
    }
  }

  useEffect(() => {
    const filtered = clients.filter(client => {
      if (!client) return false
      const term = searchTerm.toLowerCase()
      return (
        (client.name && client.name.toLowerCase().includes(term)) ||
        (client.phone1 && client.phone1.includes(searchTerm)) ||
        (client.phone && client.phone.includes(searchTerm)) ||
        (client.phone2 && client.phone2.includes(searchTerm)) ||
        (client.phone3 && client.phone3.includes(searchTerm)) ||
        (client.email1 && client.email1.toLowerCase().includes(term)) ||
        (client.email && client.email.toLowerCase().includes(term)) ||
        (client.email2 && client.email2.toLowerCase().includes(term)) ||
        (client.nif && client.nif.includes(searchTerm)) ||
        (client.clientNumber && client.clientNumber.includes(searchTerm)) ||
        (client.cardNumber && client.cardNumber.toLowerCase().includes(term))
      )
    })
    setFilteredClients(filtered)
    // Reset para primeira página quando mudar a pesquisa
    setCurrentPage(1)
  }, [searchTerm, clients])

  const fetchClients = async () => {
    setLoading(true)
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
      toast.error('Erro ao carregar clientes')
    } finally {
      setLoading(false)
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
            applyAddressToForm(data.addresses[0])
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
  
  const applyAddressToForm = (address: CttAddress) => {
    console.log('📍 Aplicando morada ao formulário:', address)
    
    // Construir a morada completa
    let fullAddress = address.morada
    if (address['info-local']) {
      fullAddress += `, ${address['info-local']}`
    }
    if (address.porta) {
      fullAddress += `, ${address.porta}`
    }
    
    // Update the form fields
    const addressInput = document.getElementById('address') as HTMLInputElement
    const localityInput = document.getElementById('locality') as HTMLInputElement
    const countryInput = document.getElementById('country') as HTMLInputElement
    
    if (addressInput) addressInput.value = fullAddress.trim()
    if (localityInput) localityInput.value = address.localidade
    if (countryInput) countryInput.value = 'Portugal'
    
    console.log('✅ Campos preenchidos:', {
      address: fullAddress.trim(),
      locality: address.localidade,
      country: 'Portugal'
    })
    
    // Fechar diálogo de seleção se estiver aberto
    setAddressSelectionDialogOpen(false)
    
    toast.success(`Morada preenchida: ${address.localidade}`)
  }

  const fetchNifApiKey = async () => {
    try {
      console.log('🔑 A buscar chave API NIF.PT das configurações...')
      console.log('🔐 AccessToken presente:', !!accessToken)
      
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-6971b43c/workshop/profile`,
        {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
          },
        }
      )

      console.log('📡 Resposta recebida - Status:', response.status)

      if (response.ok) {
        const data = await response.json()
        console.log('📦 Dados da oficina recebidos:', data)
        console.log('🔍 nifApiKey encontrado:', data.workshop?.nifApiKey ? '***' + data.workshop.nifApiKey.slice(-4) : 'NÃO ENCONTRADO')
        
        if (data.workshop?.nifApiKey) {
          setNifApiKey(data.workshop.nifApiKey)
          console.log('✅ Chave API NIF.PT carregada com sucesso')
          toast.success('Chave API NIF.PT carregada com sucesso!', { duration: 2000 })
        } else {
          console.log('⚠️ Chave API NIF.PT não configurada nas definições da oficina')
          console.log('💡 Configure em: Configurações → Gestão Dados Oficina → Integrações API')
        }
      } else {
        const errorText = await response.text()
        console.error('❌ Erro na resposta do servidor:', response.status, errorText)
      }
    } catch (error) {
      console.error('❌ Erro ao buscar chave API NIF.PT:', error)
    }
  }

  const searchNIF = async (nif: string) => {
    if (!nif || nif.length !== 9) {
      toast.error('Por favor, insira um NIF válido (9 dígitos)')
      return
    }

    setSearchingNIF(true)
    try {
      console.log('🔍 Pesquisando NIF via servidor backend:', nif)
      
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-6971b43c/nif-search/${nif}`,
        {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
          },
        }
      )

      console.log('📡 Status da resposta:', response.status)

      if (response.ok) {
        const data = await response.json()
        console.log('✅ Resposta da API NIF.PT:', data)
        
        if (data.result === 'success' && data.records && data.records[nif]) {
          const record = data.records[nif]
          
          // Preencher os campos do formulário
          const nameInput = document.getElementById('name') as HTMLInputElement
          const addressInput = document.getElementById('address') as HTMLInputElement
          const cp4Input = document.getElementById('cp4') as HTMLInputElement
          const cp3Input = document.getElementById('cp3') as HTMLInputElement
          const localityInput = document.getElementById('locality') as HTMLInputElement
          const email1Input = document.getElementById('email1') as HTMLInputElement
          const phone1Input = document.getElementById('phone1') as HTMLInputElement
          
          if (nameInput && record.title) nameInput.value = record.title
          if (addressInput && record.address) addressInput.value = record.address
          
          if (cp4Input && record.pc4) {
            cp4Input.value = record.pc4
            setCp4(record.pc4)
          }
          if (cp3Input && record.pc3) {
            cp3Input.value = record.pc3
            setCp3(record.pc3)
          }
          
          // Atualizar o postalCode combinado
          if (record.pc4 && record.pc3) {
            const newPostalCode = `${record.pc4}-${record.pc3}`
            setPostalCode(newPostalCode)
          }
          
          if (localityInput && record.city) localityInput.value = record.city
          
          // Preencher contactos se disponíveis
          if (email1Input && record.contacts?.email) email1Input.value = record.contacts.email
          if (phone1Input && record.contacts?.phone) phone1Input.value = record.contacts.phone
          
          console.log('✅ Dados preenchidos:', {
            name: record.title,
            address: record.address,
            postalCode: `${record.pc4}-${record.pc3}`,
            locality: record.city,
            email: record.contacts?.email,
            phone: record.contacts?.phone
          })
          
          toast.success(`Dados encontrados e preenchidos: ${record.title}`)
        } else if (data.result === 'error') {
          console.error('❌ API retornou erro:', data.message)
          toast.error(`Erro da API: ${data.message || 'NIF não encontrado'}`)
        } else {
          console.log('⚠️ Resposta inesperada da API:', data)
          toast.error('NIF não encontrado na base de dados')
        }
      } else {
        const errorText = await response.text()
        console.error('❌ Resposta com erro:', response.status, errorText)
        toast.error(`Erro ao pesquisar NIF (Status: ${response.status}). Verifique a chave API.`)
      }
    } catch (error) {
      console.error('❌ Erro ao pesquisar NIF:', error)
      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido'
      console.error('💥 Detalhes do erro:', errorMessage)
      toast.error(`Erro ao pesquisar NIF: ${errorMessage}`)
    } finally {
      setSearchingNIF(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const formData = new FormData(e.currentTarget)
    
    const clientData = {
      clientNumber: formData.get('clientNumber') as string,
      cardNumber: formData.get('cardNumber') as string,
      name: formData.get('name') as string,
      address: formData.get('address') as string,
      postalCode: formData.get('postalCode') as string,
      cp4: formData.get('cp4') as string,
      cp3: formData.get('cp3') as string,
      locality: formData.get('locality') as string,
      country: formData.get('country') as string,
      nif: formData.get('nif') as string,
      email1: formData.get('email1') as string,
      email2: formData.get('email2') as string,
      phone1: formData.get('phone1') as string,
      phone2: formData.get('phone2') as string,
      phone3: formData.get('phone3') as string,
      discount: parseFloat(formData.get('discount') as string) || 0,
      creditDays: parseInt(formData.get('creditDays') as string) || 0,
      vatRegime: formData.get('vatRegime') as string,
      clientType: formData.get('clientType') as string,
      // Contact preferences
      email1Active,
      email2Active,
      phone1Active,
      phone2Active,
      phone3Active,
    }

    console.log('='.repeat(60))
    console.log('📝 Operação:', editingClient ? 'ATUALIZAR' : 'CRIAR')
    console.log('📋 Dados do cliente:', clientData)
    console.log('🔑 Access Token presente:', !!accessToken)
    console.log('👤 Editing Client:', editingClient ? { id: editingClient.id, name: editingClient.name } : 'null')

    try {
      const isEditing = editingClient && editingClient.id
      
      // Validação extra: Se editingClient está definido mas sem ID, algo está errado
      if (editingClient && !editingClient.id) {
        console.error('⚠️ ERRO: editingClient está definido mas não tem ID!')
        console.error('   editingClient:', editingClient)
        toast.error('Erro: Cliente sem ID. Por favor, recarregue a página e tente novamente.')
        return
      }
      
      const url = isEditing
        ? `https://${projectId}.supabase.co/functions/v1/make-server-6971b43c/clients/${editingClient.id}`
        : `https://${projectId}.supabase.co/functions/v1/make-server-6971b43c/clients`
      
      const method = isEditing ? 'PUT' : 'POST'

      console.log('🌐 Método HTTP:', method)
      console.log('🌐 URL:', url)

      const response = await fetch(url, {
        method: method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`,
        },
        body: JSON.stringify(clientData),
      })

      console.log('📡 Resposta recebida - Status:', response.status, response.statusText)

      if (response.ok) {
        const data = await response.json()
        console.log('✅ Cliente criado com sucesso:', data)
        toast.success(editingClient ? 'Cliente atualizado!' : 'Cliente criado!')
        setDialogOpen(false)
        setEditingClient(null)
        fetchClients()
      } else {
        const data = await response.json().catch(() => ({ error: 'Resposta inválida do servidor' }))
        console.error('❌ Erro ao criar cliente:', {
          status: response.status,
          statusText: response.statusText,
          error: data.error,
          data
        })
        toast.error(data.error || `Erro ao guardar cliente (${response.status})`)
      }
    } catch (error) {
      console.error('❌ Erro crítico ao guardar cliente:', error)
      toast.error('Erro ao guardar cliente: ' + (error instanceof Error ? error.message : 'Erro desconhecido'))
    }
  }

  const handleDelete = async () => {
    if (!clientToDelete) return

    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-6971b43c/clients/${clientToDelete.id}`,
        {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${accessToken}`,
          },
        }
      )

      if (response.ok) {
        toast.success('Cliente eliminado com sucesso!')
        setDeleteDialogOpen(false)
        setClientToDelete(null)
        fetchClients()
      } else {
        const data = await response.json()
        toast.error(data.error || 'Erro ao eliminar cliente')
      }
    } catch (error) {
      console.error('Error deleting client:', error)
      toast.error('Erro ao eliminar cliente')
    }
  }

  const readCitizenCard = async () => {
    setCardReading(true)
    setCardReadStatus('reading')
    
    try {
      console.log('🔍 Iniciando leitura do Cartão de Cidadão...')
      console.log('📡 Tentando conectar ao middleware Autenticação.Gov local...')
      
      // Try to connect to local middleware first (Autenticação.Gov)
      // The middleware runs locally at http://localhost:38000 or similar
      const localMiddlewareUrls = [
        'http://localhost:38000/read',
        'http://localhost:8080/read',
        'http://127.0.0.1:38000/read',
        'http://127.0.0.1:8080/read'
      ]
      
      let cardDataFromMiddleware = null
      let middlewareConnected = false
      
      // Try each middleware URL
      for (const url of localMiddlewareUrls) {
        try {
          console.log(`🔌 Tentando conectar a: ${url}`)
          const response = await fetch(url, {
            method: 'GET',
            headers: {
              'Accept': 'application/json',
            },
            signal: AbortSignal.timeout(5000) // 5 second timeout
          })
          
          if (response.ok) {
            cardDataFromMiddleware = await response.json()
            middlewareConnected = true
            console.log('✅ Conectado ao middleware local:', url)
            console.log('📄 Dados recebidos:', cardDataFromMiddleware)
            break
          }
        } catch (err) {
          console.log(`⚠️ Falha ao conectar a ${url}:`, err instanceof Error ? err.message : 'Unknown error')
          continue
        }
      }
      
      // If local middleware didn't work, fall back to backend simulation
      if (!middlewareConnected) {
        console.log('⚠️ Middleware local não encontrado, usando modo de simulação...')
        console.log('💡 Para usar o leitor real, instale o middleware Autenticação.Gov de https://www.autenticacao.gov.pt')
        setMiddlewareDetected(false)
        toast.info('Middleware local não encontrado. A usar modo de demonstração.', { duration: 3000 })
        
        const response = await fetch(
          `https://${projectId}.supabase.co/functions/v1/make-server-6971b43c/read-citizen-card`,
          {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${accessToken}`,
              'Content-Type': 'application/json',
            },
          }
        )

        if (response.ok) {
          cardDataFromMiddleware = await response.json()
        } else {
          throw new Error('Falha ao ler dados do cartão')
        }
      } else {
        setMiddlewareDetected(true)
      }
      
      // Process card data
      if (cardDataFromMiddleware) {
        console.log('✅ Dados do cartão processados:', cardDataFromMiddleware)
        console.log('📊 Modo:', middlewareConnected ? 'PRODUÇÃO (Leitor Real)' : 'DEMONSTRAÇÃO (Dados Simulados)')
        
        const clientData: Client = {
          id: `client-${Date.now()}`,
          name: cardDataFromMiddleware.name || cardDataFromMiddleware.fullName || '',
          email1: '',
          phone1: cardDataFromMiddleware.phone || '',
          nif: cardDataFromMiddleware.nif || cardDataFromMiddleware.taxNumber || '',
          address: cardDataFromMiddleware.address || '',
          createdAt: new Date().toISOString(),
        }
        
        setCardData(clientData)
        setCardReadStatus('success')
        toast.success(middlewareConnected ? 'Cartão lido com sucesso!' : 'Dados de demonstração carregados!')
      } else {
        throw new Error('Nenhum dado recebido do cartão')
      }
      
    } catch (error) {
      console.error('❌ Erro crítico ao ler cartão:', error)
      setCardReadStatus('error')
      
      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido'
      
      console.log('\n' + '='.repeat(60))
      console.log('❌ ERRO NA LEITURA DO CARTÃO')
      console.log('='.repeat(60))
      console.log('Erro:', errorMessage)
      console.log('\n🎯 SOLUÇÃO RÁPIDA:')
      console.log('1. Use o botão "🔧 Testar Conexão ao Middleware" abaixo')
      console.log('2. Veja os resultados no painel')
      console.log('3. Consulte o guia visual: QUICK_FIX_VISUAL.md')
      console.log('\n📖 GUIAS COMPLETOS:')
      console.log('• LEIA-ME_PRIMEIRO.md ← COMECE AQUI')
      console.log('• QUICK_FIX_VISUAL.md - Fluxograma e soluções visuais')
      console.log('• CARD_READER_TROUBLESHOOTING.md - Resolução detalhada')
      console.log('• BRIDGE_SERVER_README.md - Setup de servidor bridge')
      console.log('• MIDDLEWARE_HTTP_SETUP.md - Configuração avançada')
      console.log('\n💡 MODO DEMONSTRAÇÃO:')
      console.log('O sistema continuará a funcionar com dados simulados automaticamente.')
      console.log('Nenhuma ação necessária para testar o sistema.')
      console.log('='.repeat(60))
      
      if (errorMessage.includes('fetch') || errorMessage.includes('network') || errorMessage.includes('Failed')) {
        toast.error('Middleware não encontrado. Clique em "Testar Conexão" para diagnosticar o problema.', 
                    { duration: 8000 })
      } else {
        toast.error('Erro ao comunicar com o leitor de cartões: ' + errorMessage)
      }
    } finally {
      setCardReading(false)
    }
  }

  const createClientFromCard = async () => {
    if (!cardData) return

    // Validar campos obrigatórios
    if (!cardData.name || !cardData.name.trim()) {
      toast.error('O nome é obrigatório')
      return
    }

    if (!cardData.phone || !cardData.phone.trim()) {
      toast.error('O telefone é obrigatório. Por favor, preencha o campo de telefone.')
      return
    }

    try {
      console.log('📝 Criando cliente a partir dos dados do cartão:', cardData)

      // Dividir código postal em cp4 e cp3 se disponível
      let cp4 = ''
      let cp3 = ''
      let postalCodeFull = ''
      
      if (cardData.postalCode) {
        const postalCodeMatch = cardData.postalCode.match(/^(\d{4})-?(\d{3})$/)
        if (postalCodeMatch) {
          cp4 = postalCodeMatch[1]
          cp3 = postalCodeMatch[2]
          postalCodeFull = `${cp4}-${cp3}`
          console.log('📮 Código postal dividido:', { cp4, cp3, postalCodeFull })
        }
      }

      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-6971b43c/clients`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${accessToken}`,
          },
          body: JSON.stringify({
            name: cardData.name.trim(),
            email1: cardData.email?.trim() || '',
            phone1: cardData.phone.trim(),
            nif: cardData.nif?.trim() || '',
            address: cardData.address?.trim() || '',
            postalCode: postalCodeFull,
            cp4: cp4,
            cp3: cp3,
            locality: cardData.locality?.trim() || '',
            country: 'Portugal',
            vatRegime: 'normal'
          }),
        }
      )

      if (response.ok) {
        const data = await response.json()
        console.log('✅ Cliente criado com sucesso:', data)
        toast.success('Cliente criado a partir do Cartão de Cidadão!')
        setCardReaderDialogOpen(false)
        setCardData(null)
        setCardReadStatus('idle')
        fetchClients()
      } else {
        const data = await response.json()
        console.error('❌ Erro ao criar cliente:', data)
        toast.error(data.error || 'Erro ao criar cliente')
      }
    } catch (error) {
      console.error('❌ Erro ao criar cliente:', error)
      toast.error('Erro ao criar cliente')
    }
  }

  const testMiddlewareConnection = async () => {
    setTestingMiddleware(true)
    setMiddlewareTestResult('')
    
    const urlsToTest = [
      // URLs padrão do Autenticação.Gov
      { url: 'http://localhost:38000', method: 'GET', desc: 'Porta padrão 38000' },
      { url: 'http://127.0.0.1:38000', method: 'GET', desc: 'Porta padrão 38000 (127.0.0.1)' },
      { url: 'http://localhost:8080', method: 'GET', desc: 'Porta alternativa 8080' },
      { url: 'http://127.0.0.1:8080', method: 'GET', desc: 'Porta alternativa 8080 (127.0.0.1)' },
      // Outras portas comuns
      { url: 'http://localhost:9876', method: 'GET', desc: 'Porta 9876' },
      { url: 'http://localhost:35963', method: 'GET', desc: 'Porta 35963' },
      { url: 'http://localhost:39901', method: 'GET', desc: 'Porta 39901' },
    ]
    
    let results: string[] = []
    
    console.log('🔍 TESTE DE CONEXÃO AO MIDDLEWARE AUTENTICAÇÃO.GOV')
    console.log('='.repeat(60))
    
    for (const { url, method, desc } of urlsToTest) {
      try {
        console.log(`\n🔌 Testando: ${desc} (${url})`)
        
        const response = await fetch(url, {
          method,
          headers: {
            'Accept': 'application/json',
          },
          signal: AbortSignal.timeout(3000)
        })
        
        console.log(`   Status: ${response.status} ${response.statusText}`)
        
        if (response.ok || response.status === 404 || response.status === 500) {
          const text = await response.text()
          console.log(`   ✅ Middleware ENCONTRADO em ${url}`)
          console.log(`   Resposta: ${text.substring(0, 200)}`)
          results.push(`✅ ENCONTRADO: ${desc}\n   URL: ${url}\n   Status: ${response.status}\n   Resposta: ${text.substring(0, 100)}`)
          
          // Se encontrou, tenta ler os dados
          await tryReadCardFromUrl(url)
        } else {
          console.log(`   ⚠️ Respondeu mas com status ${response.status}`)
          results.push(`⚠️ ${desc}: Status ${response.status}`)
        }
      } catch (error) {
        const errorMsg = error instanceof Error ? error.message : 'Erro desconhecido'
        console.log(`   ❌ Falha: ${errorMsg}`)
        results.push(`❌ ${desc}: ${errorMsg}`)
      }
    }
    
    console.log('\n' + '='.repeat(60))
    console.log('📊 RESUMO DO TESTE:')
    console.log(results.join('\n\n'))
    console.log('\n' + '='.repeat(60))
    
    // Análise dos resultados
    const found = results.some(r => r.startsWith('✅'))
    
    if (found) {
      console.log('\n✅ MIDDLEWARE ENCONTRADO!')
      console.log('O middleware está em execução. Se ainda não consegue ler o cartão,')
      console.log('verifique se o Cartão de Cidadão está inserido no leitor.')
    } else {
      console.log('\n❌ MIDDLEWARE NÃO ENCONTRADO!')
      console.log('\n📋 PRÓXIMOS PASSOS:')
      console.log('1. Verifique se a aplicação Autenticação.Gov está em execução')
      console.log('2. Tente iniciar a aplicação manualmente')
      console.log('3. Verifique o Gestor de Tarefas (Windows) ou Monitor de Atividade (Mac)')
      console.log('4. Consulte o guia: CARD_READER_TROUBLESHOOTING.md')
      console.log('\n💡 DICA: O middleware pode estar em execução numa porta diferente.')
      console.log('Use este comando no terminal para descobrir:')
      console.log('   Windows: netstat -ano | findstr "pteid"')
      console.log('   Mac/Linux: lsof -i -P | grep pteid')
    }
    
    setMiddlewareTestResult(results.join('\n\n'))
    setTestingMiddleware(false)
    
    // Mostrar toast com resultado
    if (found) {
      toast.success('Middleware encontrado! Consulte o console para detalhes.', { duration: 5000 })
    } else {
      toast.error('Middleware não encontrado. Consulte o console e o guia CARD_READER_TROUBLESHOOTING.md', { duration: 8000 })
    }
  }
  
  const tryReadCardFromUrl = async (baseUrl: string) => {
    const endpoints = [
      '/read',
      '/card/read',
      '/api/read',
      '/v1/read',
      '/pteid/read',
      '/cc/read',
      '/citizen-card/read',
      ''
    ]
    
    console.log(`\n   🔍 Tentando endpoints de leitura em ${baseUrl}:`)
    
    for (const endpoint of endpoints) {
      try {
        const url = `${baseUrl}${endpoint}`
        console.log(`      Tentando: ${url}`)
        
        const response = await fetch(url, {
          method: 'GET',
          signal: AbortSignal.timeout(2000)
        })
        
        if (response.ok) {
          const data = await response.text()
          console.log(`      ✅ SUCESSO em ${endpoint}`)
          console.log(`      Dados: ${data.substring(0, 100)}`)
          return { url, data }
        }
      } catch (error) {
        // Continue tentando
      }
    }
    
    return null
  }

  const resetCardReader = () => {
    setCardData(null)
    setCardReadStatus('idle')
    setCardReading(false)
    setMiddlewareDetected(null)
    setMiddlewareTestResult('')
  }

  // Import functions
  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    setImportFile(file)
    setImportStep('mapping')

    const fileExtension = file.name.split('.').pop()?.toLowerCase()

    try {
      if (fileExtension === 'csv') {
        // Parse CSV
        const Papa = await import('papaparse')
        const text = await file.text()
        
        Papa.parse(text, {
          header: true,
          skipEmptyLines: true,
          complete: (results) => {
            console.log('📄 CSV parsed:', results)
            setImportData(results.data)
            setImportColumns(results.meta.fields || [])
            autoMapFields(results.meta.fields || [])
          },
          error: (error) => {
            console.error('❌ CSV parse error:', error)
            toast.error('Erro ao ler ficheiro CSV')
          }
        })
      } else if (fileExtension === 'xlsx' || fileExtension === 'xls') {
        // Parse Excel
        const XLSX = await import('xlsx')
        const data = await file.arrayBuffer()
        const workbook = XLSX.read(data, { type: 'array' })
        const firstSheet = workbook.Sheets[workbook.SheetNames[0]]
        const jsonData = XLSX.utils.sheet_to_json(firstSheet, { header: 1 })
        
        if (jsonData.length > 0) {
          const headers = jsonData[0] as string[]
          const rows = jsonData.slice(1).map((row: any) => {
            const obj: any = {}
            headers.forEach((header, index) => {
              obj[header] = row[index]
            })
            return obj
          })
          
          console.log('📊 Excel parsed:', { headers, rows })
          setImportData(rows)
          setImportColumns(headers)
          autoMapFields(headers)
        }
      } else {
        toast.error('Formato de ficheiro não suportado. Use CSV ou Excel.')
      }
    } catch (error) {
      console.error('❌ Error parsing file:', error)
      toast.error('Erro ao processar ficheiro')
    }
  }

  const autoMapFields = (columns: string[]) => {
    const mapping: Record<string, string> = {}
    
    // Common field name mappings (Portuguese and English)
    const fieldPatterns: Record<string, string[]> = {
      name: ['nome', 'name', 'cliente', 'client', 'razão social', 'razao social'],
      nif: ['nif', 'contribuinte', 'tax id', 'vat', 'nipc'],
      email1: ['email', 'e-mail', 'mail', 'email1', 'email 1', 'correio'],
      phone1: ['telefone', 'phone', 'telemovel', 'telemóvel', 'contacto', 'phone1', 'tel', 'mobile'],
      address: ['morada', 'address', 'rua', 'street', 'endereço', 'endereco'],
      postalCode: ['código postal', 'codigo postal', 'postal code', 'cp', 'zip'],
      locality: ['localidade', 'city', 'cidade', 'locality', 'local'],
      country: ['país', 'pais', 'country'],
      discount: ['desconto', 'discount'],
      creditDays: ['dias crédito', 'dias credito', 'credit days', 'prazo'],
      vatRegime: ['regime iva', 'vat regime', 'iva']
    }

    columns.forEach(col => {
      const colLower = col.toLowerCase().trim()
      
      for (const [field, patterns] of Object.entries(fieldPatterns)) {
        if (patterns.some(pattern => colLower.includes(pattern))) {
          mapping[col] = field
          break
        }
      }
    })

    console.log('🔄 Auto-mapped fields:', mapping)
    setFieldMapping(mapping)
  }

  const handleImport = async () => {
    setImportStep('importing')
    setImporting(true)
    setImportProgress(0)
    
    try {
      // Preparar dados para importação em lote
      const clientsToImport = []

      for (let i = 0; i < importData.length; i++) {
        const row = importData[i]
        
        // Map row data to client fields
        const clientData: any = {}
        
        Object.entries(fieldMapping).forEach(([csvCol, clientField]) => {
          const value = row[csvCol]
          if (value !== undefined && value !== null && value !== '') {
            clientData[clientField] = String(value).trim()
          }
        })

        // Validar se há pelo menos algum dado útil
        const hasData = Object.keys(clientData).some(key => 
          clientData[key] && clientData[key].trim() !== ''
        )
        
        if (!hasData) {
          // Linha vazia, ignorar silenciosamente
          continue
        }

        // Dividir código postal se necessário
        if (clientData.postalCode) {
          const postalCodeMatch = clientData.postalCode.match(/^(\d{4})-?(\d{3})$/)
          if (postalCodeMatch) {
            clientData.cp4 = postalCodeMatch[1]
            clientData.cp3 = postalCodeMatch[2]
          }
        }

        // Definir valores padrão
        clientData.country = clientData.country || 'Portugal'
        clientData.vatRegime = clientData.vatRegime || 'normal'

        clientsToImport.push(clientData)
      }

      console.log(`📝 Preparados ${clientsToImport.length} clientes para importação`)

      // Importar em lote com verificação de NIF
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-6971b43c/clients/import`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${accessToken}`,
          },
          body: JSON.stringify({ clients: clientsToImport }),
        }
      )

      setImportProgress(100)

      if (response.ok) {
        const data = await response.json()
        const results = data.results
        
        console.log('✅ Importação concluída:', results)
        
        setImportResults({
          success: results.success,
          failed: results.failed,
          skipped: results.skipped || 0,
          errors: results.errors || [],
          duplicates: results.duplicates || []
        })
        
        // Show summary messages
        if (results.success > 0) {
          toast.success(`✅ ${results.success} cliente(s) importado(s) com sucesso!`)
        }
        
        if (results.skipped > 0) {
          const duplicateNames = results.duplicates
            .map((d: any) => `${d.name} (NIF: ${d.nif})`)
            .slice(0, 5)
            .join(', ')
          
          const moreText = results.duplicates.length > 5 ? ` e ${results.duplicates.length - 5} mais` : ''
          
          toast.warning(
            `⚠️ ${results.skipped} cliente(s) não importado(s) por NIF duplicado:\n${duplicateNames}${moreText}`,
            { duration: 8000 }
          )
          
          console.log('📋 Clientes duplicados:', results.duplicates)
        }
        
        if (results.failed > 0) {
          toast.error(`❌ ${results.failed} cliente(s) falharam na importação`)
        }
        
        fetchClients()
      } else {
        const errorData = await response.json()
        setImportResults({
          success: 0,
          failed: clientsToImport.length,
          errors: [errorData.error || 'Erro desconhecido']
        })
        toast.error(`Erro na importação: ${errorData.error || 'Erro desconhecido'}`)
      }
      
    } catch (error) {
      console.error('❌ Error during import:', error)
      setImportResults({
        success: 0,
        failed: importData.length,
        errors: [(error as Error).message]
      })
      toast.error('Erro ao importar clientes: ' + (error as Error).message)
    } finally {
      setImporting(false)
    }
  }

  const resetImport = () => {
    setImportFile(null)
    setImportData([])
    setImportColumns([])
    setFieldMapping({})
    setImportStep('upload')
    setImporting(false)
    setImportProgress(0)
    setImportResults({ success: 0, failed: 0, skipped: 0, errors: [], duplicates: [] })
    setImportDialogOpen(false)
  }

  const downloadTemplate = () => {
    const csv = `nome,telefone,email,nif,morada,codigo postal,localidade,pais,desconto,dias credito,regime iva
João Silva,+351 912345678,joao@exemplo.pt,123456789,Rua Exemplo 123,1000-001,Lisboa,Portugal,5,30,normal
Maria Santos,+351 987654321,maria@exemplo.pt,987654321,Av. Liberdade 456,4000-123,Porto,Portugal,10,15,normal
António Costa,+351 933444555,antonio@exemplo.pt,111222333,Praça Central 789,3000-456,Coimbra,Portugal,0,0,isento`
    
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    link.href = URL.createObjectURL(blob)
    link.download = 'template_clientes.csv'
    link.click()
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex-1 max-w-sm">
          <div className="relative">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Procurar clientes..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-8"
            />
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={downloadTemplate}>
            <Download className="mr-2 h-4 w-4" />
            Template
          </Button>
          
          <Dialog open={importDialogOpen} onOpenChange={(open) => {
            setImportDialogOpen(open)
            if (!open) resetImport()
          }}>
            <DialogTrigger asChild>
              <Button variant="outline">
                <Upload className="mr-2 h-4 w-4" />
                Importar
              </Button>
            </DialogTrigger>
            <DialogContent className="dialog-fullscreen overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Importar Clientes</DialogTitle>
                <DialogDescription>
                  Importe múltiplos clientes a partir de um ficheiro CSV ou Excel
                </DialogDescription>
              </DialogHeader>

              {importStep === 'upload' && (
                <div className="space-y-4 py-4">
                  <Alert>
                    <FileSpreadsheet className="h-4 w-4" />
                    <AlertDescription>
                      <p className="font-medium">Formatos suportados</p>
                      <p className="text-sm mt-1">CSV (.csv) ou Excel (.xlsx, .xls)</p>
                      <p className="text-sm mt-2">
                        <strong>Campos disponíveis:</strong> Nome, Telefone, Email, NIF, Morada, Código Postal, Localidade, País, Desconto, Dias Crédito, Regime IVA, etc.
                      </p>
                      <p className="text-sm mt-1 text-muted-foreground">
                        💡 O número de cliente será atribuído automaticamente
                      </p>
                    </AlertDescription>
                  </Alert>

                  <div className="border-2 border-dashed rounded-lg p-8 text-center">
                    <FileSpreadsheet className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                    <p className="text-sm font-medium mb-2">
                      Arraste um ficheiro ou clique para selecionar
                    </p>
                    <input
                      type="file"
                      accept=".csv,.xlsx,.xls"
                      onChange={handleFileUpload}
                      className="hidden"
                      id="file-upload"
                    />
                    <Button asChild variant="outline">
                      <label htmlFor="file-upload" className="cursor-pointer">
                        Selecionar Ficheiro
                      </label>
                    </Button>
                  </div>
                </div>
              )}

              {importStep === 'mapping' && (
                <div className="space-y-4 py-4">
                  <Alert>
                    <Info className="h-4 w-4" />
                    <AlertDescription>
                      <p className="font-medium">Mapeamento Automático Aplicado</p>
                      <p className="text-sm mt-1">
                        Os campos foram mapeados automaticamente. Verifique e ajuste se necessário.
                      </p>
                    </AlertDescription>
                  </Alert>

                  <div className="space-y-2">
                    <Label>Ficheiro: {importFile?.name}</Label>
                    <p className="text-sm text-muted-foreground">
                      {importData.length} linha(s) encontrada(s)
                    </p>
                  </div>

                  <Separator />

                  <div className="space-y-3">
                    <Label>Mapear Colunas do Ficheiro para Campos do Cliente</Label>
                    
                    <div className="space-y-2 max-h-96 overflow-y-auto">
                      {importColumns.map(col => (
                        <div key={col} className="grid grid-cols-2 gap-3 items-center p-2 border rounded">
                          <div className="text-sm font-medium truncate" title={col}>
                            {col}
                          </div>
                          <Select
                            value={fieldMapping[col] || 'ignore'}
                            onValueChange={(value) => {
                              setFieldMapping(prev => {
                                if (value === 'ignore') {
                                  const newMapping = { ...prev }
                                  delete newMapping[col]
                                  return newMapping
                                }
                                return {
                                  ...prev,
                                  [col]: value
                                }
                              })
                            }}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Ignorar campo" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="ignore">Ignorar</SelectItem>
                              <SelectItem value="name">Nome</SelectItem>
                              <SelectItem value="nif">NIF</SelectItem>
                              <SelectItem value="email1">Email 1</SelectItem>
                              <SelectItem value="email2">Email 2</SelectItem>
                              <SelectItem value="phone1">Telefone 1</SelectItem>
                              <SelectItem value="phone2">Telefone 2</SelectItem>
                              <SelectItem value="phone3">Telefone 3</SelectItem>
                              <SelectItem value="address">Morada</SelectItem>
                              <SelectItem value="postalCode">Código Postal</SelectItem>
                              <SelectItem value="locality">Localidade</SelectItem>
                              <SelectItem value="country">País</SelectItem>
                              <SelectItem value="discount">Desconto (%)</SelectItem>
                              <SelectItem value="creditDays">Dias Crédito</SelectItem>
                              <SelectItem value="vatRegime">Regime IVA</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      ))}
                    </div>
                  </div>

                  <Alert>
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription className="text-xs">
                      O número de cliente será atribuído automaticamente pelo sistema. Linhas vazias serão ignoradas.
                    </AlertDescription>
                  </Alert>
                </div>
              )}

              {importStep === 'importing' && (
                <div className="space-y-4 py-8">
                  <div className="text-center">
                    <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto mb-4" />
                    <p className="font-medium">A importar clientes...</p>
                    <p className="text-sm text-muted-foreground mt-2">
                      {importProgress}% concluído
                    </p>
                  </div>

                  <div className="w-full bg-secondary rounded-full h-2">
                    <div 
                      className="bg-primary h-2 rounded-full transition-all duration-300"
                      style={{ width: `${importProgress}%` }}
                    />
                  </div>

                  {importResults.success > 0 && (
                    <div className="text-center text-sm">
                      <CheckCircle2 className="h-5 w-5 text-green-600 inline mr-2" />
                      {importResults.success} cliente(s) importado(s)
                    </div>
                  )}

                  {importResults.failed > 0 && (
                    <div className="text-center text-sm">
                      <AlertCircle className="h-5 w-5 text-destructive inline mr-2" />
                      {importResults.failed} falha(s)
                    </div>
                  )}
                </div>
              )}

              {!importing && importResults.success + importResults.failed > 0 && (
                <div className="space-y-4 py-4">
                  <Alert className="border-green-200 bg-green-50">
                    <CheckCircle2 className="h-4 w-4 text-green-600" />
                    <AlertDescription className="text-green-800">
                      <p className="font-medium">Importação Concluída!</p>
                      <p className="text-sm mt-1">
                        {importResults.success} cliente(s) importado(s) com sucesso
                      </p>
                      {importResults.failed > 0 && (
                        <p className="text-sm mt-1">
                          {importResults.failed} linha(s) falharam
                        </p>
                      )}
                    </AlertDescription>
                  </Alert>

                  {importResults.errors.length > 0 && (
                    <div>
                      <Label className="text-sm font-medium">Erros:</Label>
                      <div className="mt-2 max-h-40 overflow-y-auto border rounded p-3 bg-destructive/5 space-y-1">
                        {importResults.errors.slice(0, 10).map((error, index) => (
                          <p key={index} className="text-xs text-destructive">
                            • {error}
                          </p>
                        ))}
                        {importResults.errors.length > 10 && (
                          <p className="text-xs text-muted-foreground mt-2">
                            ... e {importResults.errors.length - 10} erro(s) adicionais
                          </p>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )}

              <DialogFooter>
                {importStep === 'upload' && (
                  <Button variant="outline" onClick={resetImport}>
                    Cancelar
                  </Button>
                )}

                {importStep === 'mapping' && (
                  <>
                    <Button variant="outline" onClick={() => setImportStep('upload')}>
                      Voltar
                    </Button>
                    <Button onClick={handleImport}>
                      <Upload className="mr-2 h-4 w-4" />
                      Importar {importData.length} Cliente(s)
                    </Button>
                  </>
                )}

                {!importing && importResults.success + importResults.failed > 0 && (
                  <Button onClick={resetImport}>
                    Fechar
                  </Button>
                )}
              </DialogFooter>
            </DialogContent>
          </Dialog>
          
          <Dialog open={cardReaderDialogOpen} onOpenChange={(open) => {
            setCardReaderDialogOpen(open)
            if (!open) resetCardReader()
          }}>
            <DialogTrigger asChild>
              <Button variant="outline">
                <CreditCard className="mr-2 h-4 w-4" />
                Leitor de Cartão
              </Button>
            </DialogTrigger>
            <DialogContent className="dialog-fullscreen overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Leitor de Cartão de Cidadão</DialogTitle>
                <DialogDescription>
                  Crie um cliente automaticamente através da leitura do Cartão de Cidadão
                </DialogDescription>
              </DialogHeader>
              
              <div className="space-y-4 py-4">
                {cardReadStatus === 'idle' && (
                  <>
                    <Alert>
                      <CreditCard className="h-4 w-4" />
                      <AlertDescription>
                        <p className="font-medium">Sistema de Leitura de Cartão de Cidadão</p>
                        <p className="text-sm mt-2">
                          Este sistema conecta-se ao seu leitor de cartões através do middleware Autenticação.Gov.
                        </p>
                        <div className="mt-3 text-xs">
                          <strong>✅ Requisitos:</strong>
                          <ul className="list-disc list-inside mt-1 space-y-1">
                            <li>Leitor de cartões USB conectado ao computador</li>
                            <li>Middleware Autenticação.Gov instalado e em execução</li>
                            <li>Cartão de Cidadão inserido no leitor</li>
                          </ul>
                        </div>
                        <div className="mt-3 p-2 bg-blue-50 rounded text-xs">
                          <strong>ℹ️ Modo de Funcionamento:</strong><br/>
                          Se o middleware não estiver disponível, o sistema funcionará em modo de demonstração com dados simulados.
                        </div>
                        <div className="mt-2 text-xs text-muted-foreground">
                          <strong>📥 Download:</strong>{' '}
                          <a 
                            href="https://www.autenticacao.gov.pt" 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="underline hover:no-underline text-blue-600"
                          >
                            www.autenticacao.gov.pt
                          </a>
                        </div>
                      </AlertDescription>
                    </Alert>
                    
                    <div className="border rounded-lg p-4 bg-slate-50">
                      <div className="flex items-start gap-3">
                        <HelpCircle className="h-5 w-5 text-blue-600 mt-0.5" />
                        <div className="flex-1">
                          <p className="font-medium text-sm">Problemas de conexão?</p>
                          <p className="text-xs text-muted-foreground mt-1">
                            Se já tem o middleware instalado mas não consegue ler, clique no botão abaixo para testar a conexão.
                          </p>
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={testMiddlewareConnection}
                            disabled={testingMiddleware}
                            className="mt-2"
                          >
                            {testingMiddleware && <Loader2 className="mr-2 h-3 w-3 animate-spin" />}
                            {testingMiddleware ? 'A testar conexão...' : '🔧 Testar Conexão ao Middleware'}
                          </Button>
                        </div>
                      </div>
                      
                      {middlewareTestResult && (
                        <>
                          <div className="mt-3 p-3 bg-white border rounded text-xs font-mono whitespace-pre-wrap max-h-60 overflow-y-auto">
                            {middlewareTestResult}
                          </div>
                          <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded">
                            <p className="text-xs font-medium text-blue-900 mb-2">
                              📚 Consulte os guias de troubleshooting:
                            </p>
                            <div className="flex flex-wrap gap-2">
                              <a
                                href="https://github.com/yourusername/oficinasexpress/blob/main/LEIA-ME_PRIMEIRO.md"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-xs px-2 py-1 bg-white border border-blue-300 rounded hover:bg-blue-50"
                              >
                                🚨 LEIA-ME PRIMEIRO
                              </a>
                              <a
                                href="https://github.com/yourusername/oficinasexpress/blob/main/CARD_READER_TROUBLESHOOTING.md"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-xs px-2 py-1 bg-white border border-blue-300 rounded hover:bg-blue-50"
                              >
                                🔧 Troubleshooting
                              </a>
                              <a
                                href="https://github.com/yourusername/oficinasexpress/blob/main/MIDDLEWARE_HTTP_SETUP.md"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-xs px-2 py-1 bg-white border border-blue-300 rounded hover:bg-blue-50"
                              >
                                ⚙️ Setup Avançado
                              </a>
                            </div>
                            <p className="text-xs text-blue-700 mt-2">
                              💡 Abra a Consola do Browser (F12) para ver logs detalhados
                            </p>
                          </div>
                        </>
                      )}
                    </div>
                  </>
                )}

                {cardReadStatus === 'reading' && (
                  <div className="flex flex-col items-center justify-center py-8 space-y-4">
                    <Loader2 className="h-12 w-12 animate-spin text-primary" />
                    <div className="text-center">
                      <p className="font-medium">A ler Cartão de Cidadão...</p>
                      <p className="text-sm text-muted-foreground">Por favor, aguarde</p>
                    </div>
                  </div>
                )}

                {cardReadStatus === 'error' && (
                  <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>
                      <p className="font-medium">Erro ao ler o cartão</p>
                      <p className="text-sm mt-2">
                        <strong>Verifique se:</strong>
                      </p>
                      <ul className="text-sm list-disc list-inside mt-1 space-y-1">
                        <li>O leitor de cartões USB está conectado</li>
                        <li>O Cartão de Cidadão está inserido no leitor</li>
                        <li>O middleware Autenticação.Gov está instalado</li>
                        <li>O serviço do middleware está em execução</li>
                      </ul>
                      <div className="mt-3 p-2 bg-destructive/10 rounded text-xs">
                        <strong>📥 Download do Middleware:</strong><br/>
                        <a 
                          href="https://www.autenticacao.gov.pt" 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="underline hover:no-underline"
                        >
                          www.autenticacao.gov.pt
                        </a>
                      </div>
                    </AlertDescription>
                  </Alert>
                )}

                {cardReadStatus === 'success' && cardData && (
                  <div className="space-y-4">
                    <Alert className={middlewareDetected === false ? "border-blue-200 bg-blue-50" : "border-green-200 bg-green-50"}>
                      <CheckCircle2 className={middlewareDetected === false ? "h-4 w-4 text-blue-600" : "h-4 w-4 text-green-600"} />
                      <AlertDescription className={middlewareDetected === false ? "text-blue-800" : "text-green-800"}>
                        <p className="font-medium">
                          {middlewareDetected === false ? '🔵 Modo de Demonstração' : '✅ Cartão Lido com Sucesso!'}
                        </p>
                        <p className="text-sm mt-1">
                          {middlewareDetected === false 
                            ? 'Dados simulados carregados. Para usar o leitor real, instale o middleware Autenticação.Gov.' 
                            : 'Dados lidos do Cartão de Cidadão através do leitor físico.'}
                        </p>
                        <p className="text-sm mt-2 font-medium">⚠️ Por favor, adicione o número de telefone antes de criar o cliente.</p>
                      </AlertDescription>
                    </Alert>

                    <div className="space-y-3 rounded-lg border p-4">
                      <div className="grid gap-2">
                        <Label className="text-xs text-muted-foreground">Nome Completo *</Label>
                        <Input
                          value={cardData.name}
                          onChange={(e) => setCardData({ ...cardData, name: e.target.value })}
                          required
                        />
                      </div>
                      <div className="grid gap-2">
                        <Label className="text-xs text-muted-foreground">NIF</Label>
                        <Input
                          value={cardData.nif || ''}
                          onChange={(e) => setCardData({ ...cardData, nif: e.target.value })}
                        />
                      </div>
                      <div className="grid gap-2">
                        <Label className="text-xs text-muted-foreground">Morada</Label>
                        <Input
                          value={cardData.address || ''}
                          onChange={(e) => setCardData({ ...cardData, address: e.target.value })}
                        />
                      </div>
                      <div className="grid gap-2">
                        <Label className="text-xs text-muted-foreground">
                          Telefone * 
                          <span className="ml-2 text-orange-600">(não está no cartão - preencher manualmente)</span>
                        </Label>
                        <Input
                          value={cardData.phone1 || ''}
                          onChange={(e) => setCardData({ ...cardData, phone1: e.target.value })}
                          placeholder="+351 XXX XXX XXX"
                          required
                          className={!cardData.phone1?.trim() ? 'border-orange-300 bg-orange-50' : ''}
                        />
                        {!cardData.phone1?.trim() && (
                          <p className="text-xs text-orange-600">⚠️ Campo obrigatório</p>
                        )}
                      </div>
                      <div className="grid gap-2">
                        <Label className="text-xs text-muted-foreground">Email (opcional)</Label>
                        <Input
                          type="email"
                          value={cardData.email || ''}
                          onChange={(e) => setCardData({ ...cardData, email: e.target.value })}
                          placeholder="email@exemplo.pt"
                        />
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <DialogFooter>
                {cardReadStatus === 'idle' && (
                  <Button onClick={readCitizenCard} disabled={cardReading}>
                    {cardReading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Ler Cartão
                  </Button>
                )}
                {cardReadStatus === 'error' && (
                  <Button onClick={readCitizenCard} disabled={cardReading}>
                    Tentar Novamente
                  </Button>
                )}
                {cardReadStatus === 'success' && (
                  <>
                    <Button variant="outline" onClick={resetCardReader}>
                      Ler Outro Cartão
                    </Button>
                    <Button 
                      onClick={createClientFromCard}
                      disabled={!cardData?.name?.trim() || !cardData?.phone?.trim()}
                      title={!cardData?.phone?.trim() ? 'Por favor, preencha o telefone' : ''}
                    >
                      Criar Cliente
                    </Button>
                  </>
                )}
              </DialogFooter>
            </DialogContent>
          </Dialog>

          {/* Diálogo de Seleção de Morada */}
          <Dialog open={addressSelectionDialogOpen} onOpenChange={setAddressSelectionDialogOpen}>
            <DialogContent className="dialog-fullscreen overflow-y-auto">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <MapPinCheck className="h-5 w-5" />
                  Selecione a Morada
                </DialogTitle>
                <DialogDescription>
                  Foram encontradas {availableAddresses.length} moradas para o código postal {postalCode}. Selecione a morada correta.
                </DialogDescription>
              </DialogHeader>
              
              <div className="space-y-3 py-4">
                {availableAddresses.map((address, index) => (
                  <Card 
                    key={index} 
                    className="cursor-pointer hover:border-primary hover:bg-accent/50 transition-all"
                    onClick={() => applyAddressToForm(address)}
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

          <Dialog open={dialogOpen} onOpenChange={(open) => {
            setDialogOpen(open)
            if (!open) setEditingClient(null)
          }}>
            <DialogTrigger asChild>
              <Button onClick={() => {
                console.log('🆕 Novo Cliente - Limpando estado de edição')
                setEditingClient(null)
              }}>
                <Plus className="mr-2 h-4 w-4" />
                Novo Cliente
              </Button>
            </DialogTrigger>
          <DialogContent className="dialog-fullscreen overflow-y-auto">
            <form onSubmit={handleSubmit}>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <User className="h-5 w-5" />
                  {editingClient ? 'Editar Cliente' : 'Novo Cliente'}
                </DialogTitle>
                <DialogDescription>
                  {editingClient ? 'Atualize os dados do cliente' : 'Adicione um novo cliente ao sistema'}
                </DialogDescription>
              </DialogHeader>
              
              <div className="space-y-6 py-6 px-1">
                {/* Identificação */}
                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    <User className="h-4 w-4 text-muted-foreground" />
                    <h4 className="font-medium">Identificação</h4>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="clientNumber">Nº Cliente</Label>
                      <Input
                        id="clientNumber"
                        name="clientNumber"
                        placeholder="Auto-gerado"
                        defaultValue={editingClient?.clientNumber || editingClient?.id}
                        disabled
                        className="bg-muted"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="cardNumber">Nº Cartão Cliente</Label>
                      <Input
                        id="cardNumber"
                        name="cardNumber"
                        placeholder="Ex: CC-00001"
                        defaultValue={editingClient?.cardNumber}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="name">Nome *</Label>
                      <Input
                        id="name"
                        name="name"
                        placeholder="Nome completo"
                        defaultValue={editingClient?.name}
                        required
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
                  <div className="grid grid-cols-1 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="address">Morada</Label>
                      <Input
                        id="address"
                        name="address"
                        placeholder="Rua, Nº, Andar"
                        defaultValue={editingClient?.address}
                      />
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                      <div className="space-y-2 md:col-span-2">
                        <Label htmlFor="cp4">Código Postal</Label>
                        <div className="flex gap-2 items-center">
                          <Input
                            id="cp4"
                            name="cp4"
                            placeholder="0000"
                            maxLength={4}
                            className="w-24"
                            value={cp4}
                            onChange={(e) => {
                              const value = e.target.value.replace(/\D/g, '')
                              setCp4(value)
                              const newPostalCode = value && cp3 ? `${value}-${cp3}` : ''
                              setPostalCode(newPostalCode)
                            }}
                          />
                          <span className="text-muted-foreground">-</span>
                          <Input
                            id="cp3"
                            name="cp3"
                            placeholder="000"
                            maxLength={3}
                            className="w-20"
                            value={cp3}
                            onChange={(e) => {
                              const value = e.target.value.replace(/\D/g, '')
                              setCp3(value)
                              const newPostalCode = cp4 && value ? `${cp4}-${value}` : ''
                              setPostalCode(newPostalCode)
                            }}
                          />
                          <input type="hidden" name="postalCode" value={postalCode} />
                          <Button
                            type="button"
                            variant="outline"
                            size="icon"
                            onClick={() => {
                              if (postalCode) {
                                searchPostalCode(postalCode)
                              }
                            }}
                            disabled={searchingPostalCode || !postalCode}
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
                        <Label htmlFor="locality">Localidade</Label>
                        <Input
                          id="locality"
                          name="locality"
                          placeholder="Cidade"
                          defaultValue={editingClient?.locality}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="country">País</Label>
                        <Input
                          id="country"
                          name="country"
                          placeholder="Portugal"
                          defaultValue={editingClient?.country || 'Portugal'}
                        />
                      </div>
                    </div>
                  </div>
                </div>

                <Separator />

                {/* Dados Fiscais */}
                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    <Receipt className="h-4 w-4 text-muted-foreground" />
                    <h4 className="font-medium">Dados Fiscais</h4>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="nif" className="flex items-center gap-2">
                        NIF
                        {nifApiKey && (
                          <span className="text-xs text-green-600 flex items-center gap-1">
                            <CheckCircle2 className="h-3 w-3" />
                            API Configurada
                          </span>
                        )}
                      </Label>
                      <div className="flex gap-2">
                        <Input
                          id="nif"
                          name="nif"
                          placeholder="000000000"
                          defaultValue={editingClient?.nif}
                          maxLength={9}
                          className="flex-1"
                        />
                        <Button
                          type="button"
                          variant="outline"
                          size="icon"
                          onClick={() => {
                            const nifInput = document.getElementById('nif') as HTMLInputElement
                            if (nifInput?.value) {
                              searchNIF(nifInput.value)
                            }
                          }}
                          disabled={searchingNIF}
                          title="Pesquisar dados por NIF"
                        >
                          {searchingNIF ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <Search className="h-4 w-4" />
                          )}
                        </Button>
                      </div>
                      <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                        <Info className="h-3 w-3" />
                        {nifApiKey ? 'API NIF.PT configurada e pronta a usar' : 'Configure a chave API NIF.PT em Configurações para ativar a pesquisa automática'}
                      </p>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="vatRegime">Regime de IVA</Label>
                      <Select name="vatRegime" defaultValue={editingClient?.vatRegime || 'normal'}>
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
                    <div className="space-y-2">
                      <Label htmlFor="clientType">Tipo de Cliente</Label>
                      <Select name="clientType" defaultValue={editingClient?.clientType || 'particular'}>
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

                {/* Contactos */}
                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    <Phone className="h-4 w-4 text-muted-foreground" />
                    <h4 className="font-medium">Contactos</h4>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="email1">E-mail 1</Label>
                      <div className="flex items-center gap-2">
                        <Input
                          id="email1"
                          name="email1"
                          type="email"
                          placeholder="email@exemplo.pt"
                          defaultValue={editingClient?.email1 || editingClient?.email}
                          className="flex-1"
                          onChange={(e) => {
                            // Ativar checkbox automaticamente se o campo tiver dados (só se estava false)
                            if (e.target.value.trim() && !email1Active) {
                              setEmail1Active(true)
                            }
                          }}
                        />
                        <div className="flex items-center space-x-2">
                          <Checkbox
                            id="email1Active"
                            checked={email1Active}
                            onCheckedChange={(checked) => setEmail1Active(checked as boolean)}
                          />
                          <Label
                            htmlFor="email1Active"
                            className="text-sm font-normal cursor-pointer whitespace-nowrap"
                          >
                            Enviar Email
                          </Label>
                        </div>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="email2">E-mail 2</Label>
                      <div className="flex items-center gap-2">
                        <Input
                          id="email2"
                          name="email2"
                          type="email"
                          placeholder="email2@exemplo.pt"
                          defaultValue={editingClient?.email2}
                          className="flex-1"
                          onChange={(e) => {
                            // Ativar checkbox automaticamente se o campo tiver dados (só se estava false)
                            if (e.target.value.trim() && !email2Active) {
                              setEmail2Active(true)
                            }
                          }}
                        />
                        <div className="flex items-center space-x-2">
                          <Checkbox
                            id="email2Active"
                            checked={email2Active}
                            onCheckedChange={(checked) => setEmail2Active(checked as boolean)}
                          />
                          <Label
                            htmlFor="email2Active"
                            className="text-sm font-normal cursor-pointer whitespace-nowrap"
                          >
                            Enviar Email
                          </Label>
                        </div>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="phone1">Telefone 1 *</Label>
                      <div className="flex items-center gap-2">
                        <Input
                          id="phone1"
                          name="phone1"
                          type="tel"
                          placeholder="+351 000 000 000"
                          defaultValue={editingClient?.phone1 || editingClient?.phone}
                          required
                          className="flex-1"
                          onChange={(e) => {
                            // Ativar checkbox automaticamente se o campo tiver dados (só se estava false)
                            if (e.target.value.trim() && !phone1Active) {
                              setPhone1Active(true)
                            }
                          }}
                        />
                        <div className="flex items-center space-x-2">
                          <Checkbox
                            id="phone1Active"
                            checked={phone1Active}
                            onCheckedChange={(checked) => setPhone1Active(checked as boolean)}
                          />
                          <Label
                            htmlFor="phone1Active"
                            className="text-sm font-normal cursor-pointer whitespace-nowrap"
                          >
                            Enviar SMS
                          </Label>
                        </div>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="phone2">Telefone 2</Label>
                      <div className="flex items-center gap-2">
                        <Input
                          id="phone2"
                          name="phone2"
                          type="tel"
                          placeholder="+351 000 000 000"
                          defaultValue={editingClient?.phone2}
                          className="flex-1"
                          onChange={(e) => {
                            // Ativar checkbox automaticamente se o campo tiver dados (só se estava false)
                            if (e.target.value.trim() && !phone2Active) {
                              setPhone2Active(true)
                            }
                          }}
                        />
                        <div className="flex items-center space-x-2">
                          <Checkbox
                            id="phone2Active"
                            checked={phone2Active}
                            onCheckedChange={(checked) => setPhone2Active(checked as boolean)}
                          />
                          <Label
                            htmlFor="phone2Active"
                            className="text-sm font-normal cursor-pointer whitespace-nowrap"
                          >
                            Enviar SMS
                          </Label>
                        </div>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="phone3">Telefone 3</Label>
                      <div className="flex items-center gap-2">
                        <Input
                          id="phone3"
                          name="phone3"
                          type="tel"
                          placeholder="+351 000 000 000"
                          defaultValue={editingClient?.phone3}
                          className="flex-1"
                          onChange={(e) => {
                            // Ativar checkbox automaticamente se o campo tiver dados (só se estava false)
                            if (e.target.value.trim() && !phone3Active) {
                              setPhone3Active(true)
                            }
                          }}
                        />
                        <div className="flex items-center space-x-2">
                          <Checkbox
                            id="phone3Active"
                            checked={phone3Active}
                            onCheckedChange={(checked) => setPhone3Active(checked as boolean)}
                          />
                          <Label
                            htmlFor="phone3Active"
                            className="text-sm font-normal cursor-pointer whitespace-nowrap"
                          >
                            Enviar SMS
                          </Label>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <Separator />

                {/* Condições Comerciais */}
                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    <Percent className="h-4 w-4 text-muted-foreground" />
                    <h4 className="font-medium">Condições Comerciais</h4>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div className="space-y-2 md:col-span-2">
                      <Label htmlFor="discount">Desconto (%)</Label>
                      <Input
                        id="discount"
                        name="discount"
                        type="number"
                        min="0"
                        max="100"
                        step="0.01"
                        placeholder="0.00"
                        defaultValue={editingClient?.discount}
                      />
                    </div>
                    <div className="space-y-2 md:col-span-2">
                      <Label htmlFor="creditDays">
                        <Calendar className="h-4 w-4 inline mr-1" />
                        Dias de Crédito
                      </Label>
                      <Input
                        id="creditDays"
                        name="creditDays"
                        type="number"
                        min="0"
                        placeholder="0"
                        defaultValue={editingClient?.creditDays}
                      />
                    </div>
                  </div>
                </div>
              </div>

              <DialogFooter className="gap-2">
                <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                  Cancelar
                </Button>
                <Button type="submit">
                  {editingClient ? 'Atualizar Cliente' : 'Criar Cliente'}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
          </Dialog>
          
          {/* Card Reader Dialog */}
          <Dialog open={cardReaderDialogOpen} onOpenChange={setCardReaderDialogOpen}>
            <DialogContent className="dialog-fullscreen overflow-y-auto">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <CreditCard className="h-5 w-5" />
                  Leitor de Cartão de Cidadão
                </DialogTitle>
                <DialogDescription>
                  Leia os dados do Cartão de Cidadão automaticamente
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-4">
                {cardReadStatus === 'idle' && (
                  <>
                    <Alert>
                      <CreditCard className="h-4 w-4" />
                      <AlertDescription>
                        <p className="font-medium">Sistema de Leitura de Cartão de Cidadão</p>
                        <p className="text-sm mt-2">
                          Este sistema conecta-se ao seu leitor de cartões através do middleware Autenticação.Gov.
                        </p>
                        <div className="mt-3 text-xs">
                          <strong>✅ Requisitos:</strong>
                          <ul className="list-disc list-inside mt-1 space-y-1">
                            <li>Leitor de cartões USB conectado ao computador</li>
                            <li>Middleware Autenticação.Gov instalado e em execução</li>
                            <li>Cartão de Cidadão inserido no leitor</li>
                          </ul>
                        </div>
                        <div className="mt-3 p-2 bg-blue-50 rounded text-xs">
                          <strong>ℹ️ Modo de Funcionamento:</strong><br/>
                          Se o middleware não estiver disponível, o sistema funcionará em modo de demonstração com dados simulados.
                        </div>
                        <div className="mt-2 text-xs text-muted-foreground">
                          <strong>📥 Download:</strong>{' '}
                          <a 
                            href="https://www.autenticacao.gov.pt" 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="underline hover:no-underline text-blue-600"
                          >
                            www.autenticacao.gov.pt
                          </a>
                        </div>
                      </AlertDescription>
                    </Alert>
                    
                    <div className="border rounded-lg p-4 bg-slate-50">
                      <div className="flex items-start gap-3">
                        <HelpCircle className="h-5 w-5 text-blue-600 mt-0.5" />
                        <div className="flex-1">
                          <p className="font-medium text-sm">Problemas de conexão?</p>
                          <p className="text-xs text-muted-foreground mt-1">
                            Se já tem o middleware instalado mas não consegue ler, clique no botão abaixo para testar a conexão.
                          </p>
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={testMiddlewareConnection}
                            disabled={testingMiddleware}
                            className="mt-2"
                          >
                            {testingMiddleware && <Loader2 className="mr-2 h-3 w-3 animate-spin" />}
                            {testingMiddleware ? 'A testar conexão...' : '🔧 Testar Conexão ao Middleware'}
                          </Button>
                        </div>
                      </div>
                      
                      {middlewareTestResult && (
                        <>
                          <div className="mt-3 p-3 bg-white border rounded text-xs font-mono whitespace-pre-wrap max-h-60 overflow-y-auto">
                            {middlewareTestResult}
                          </div>
                          <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded">
                            <p className="text-xs font-medium text-blue-900 mb-2">
                              📚 Consulte os guias de troubleshooting no repositório do projeto
                            </p>
                            <p className="text-xs text-blue-700 mt-2">
                              💡 Abra a Consola do Browser (F12) para ver logs detalhados
                            </p>
                          </div>
                        </>
                      )}
                    </div>
                  </>
                )}

                {cardReadStatus === 'reading' && (
                  <Alert>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <AlertDescription>
                      <p className="font-medium">A ler cartão...</p>
                      <p className="text-sm mt-2">
                        Por favor, aguarde enquanto os dados do cartão são lidos.
                        {middlewareDetected === false && (
                          <span className="block mt-1 text-muted-foreground">
                            Modo de demonstração ativado.
                          </span>
                        )}
                      </p>
                    </AlertDescription>
                  </Alert>
                )}

                {cardReadStatus === 'success' && cardData && (
                  <Alert className="border-green-200 bg-green-50">
                    <CheckCircle2 className="h-4 w-4 text-green-600" />
                    <AlertDescription>
                      <p className="font-medium text-green-900">Cartão lido com sucesso!</p>
                      <p className="text-sm mt-2 text-green-800">
                        {middlewareDetected === false && (
                          <span className="block mb-2 font-medium">
                            ⚠️ Modo de Demonstração - Dados simulados
                          </span>
                        )}
                        Verifique os dados abaixo e preencha o telefone (obrigatório).
                      </p>
                    </AlertDescription>
                  </Alert>
                )}

                {cardReadStatus === 'error' && (
                  <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>
                      <p className="font-medium">Erro na leitura do cartão</p>
                      <p className="text-sm mt-2">
                        Não foi possível ler o cartão. Verifique:
                      </p>
                      <ul className="list-disc list-inside mt-2 text-sm space-y-1">
                        <li>O middleware está instalado e em execução</li>
                        <li>O leitor está conectado</li>
                        <li>O cartão está corretamente inserido</li>
                      </ul>
                      <p className="text-sm mt-2">
                        Use o botão "Testar Conexão" acima para diagnosticar o problema.
                      </p>
                    </AlertDescription>
                  </Alert>
                )}

                {cardReadStatus === 'success' && cardData && (
                  <div className="space-y-4 p-4 border rounded-lg bg-slate-50">
                    <h4 className="font-medium flex items-center gap-2">
                      <User className="h-4 w-4" />
                      Dados do Cartão
                    </h4>
                    <div className="grid gap-3">
                      <div>
                        <Label>Nome Completo</Label>
                        <Input
                          value={cardData.name}
                          onChange={(e) => setCardData({ ...cardData, name: e.target.value })}
                          className="font-medium"
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <Label>NIF</Label>
                          <Input
                            value={cardData.nif || ''}
                            onChange={(e) => setCardData({ ...cardData, nif: e.target.value })}
                          />
                        </div>
                        <div>
                          <Label>Telefone *</Label>
                          <Input
                            value={cardData.phone1 || ''}
                            onChange={(e) => setCardData({ ...cardData, phone1: e.target.value })}
                            placeholder="+351 000 000 000"
                            required
                          />
                        </div>
                      </div>
                      <div>
                        <Label>Morada</Label>
                        <Input
                          value={cardData.address || ''}
                          onChange={(e) => setCardData({ ...cardData, address: e.target.value })}
                        />
                      </div>
                      <div>
                        <Label>Email (opcional)</Label>
                        <Input
                          type="email"
                          value={cardData.email1 || ''}
                          onChange={(e) => setCardData({ ...cardData, email1: e.target.value })}
                          placeholder="exemplo@email.com"
                        />
                      </div>
                      <div className="text-xs text-muted-foreground">
                        * Campo obrigatório
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <DialogFooter className="gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={resetCardReader}
                >
                  {cardReadStatus === 'success' ? 'Cancelar' : 'Fechar'}
                </Button>
                
                {cardReadStatus === 'idle' && (
                  <Button
                    onClick={readCitizenCard}
                    disabled={cardReading}
                  >
                    {cardReading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        A ler...
                      </>
                    ) : (
                      <>
                        <CreditCard className="mr-2 h-4 w-4" />
                        Ler Cartão
                      </>
                    )}
                  </Button>
                )}
                
                {cardReadStatus === 'success' && (
                  <Button
                    onClick={createClientFromCard}
                    disabled={!cardData?.name || !cardData?.phone1}
                  >
                    <CheckCircle2 className="mr-2 h-4 w-4" />
                    Criar Cliente
                  </Button>
                )}
                
                {cardReadStatus === 'error' && (
                  <Button
                    onClick={readCitizenCard}
                    disabled={cardReading}
                  >
                    <CreditCard className="mr-2 h-4 w-4" />
                    Tentar Novamente
                  </Button>
                )}
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Clientes</CardTitle>
          <CardDescription>
            {filteredClients.length} cliente{filteredClients.length !== 1 ? 's' : ''} registado{filteredClients.length !== 1 ? 's' : ''}{filteredClients.length > clientsPerPage ? ` • Página ${currentPage} de ${Math.ceil(filteredClients.length / clientsPerPage)}` : ''}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8 text-muted-foreground">A carregar...</div>
          ) : filteredClients.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              {searchTerm ? 'Nenhum cliente encontrado' : 'Nenhum cliente registado'}
            </div>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nº Cliente</TableHead>
                    <TableHead>Nome</TableHead>
                    <TableHead>Contacto</TableHead>
                    <TableHead>NIF</TableHead>
                    <TableHead>Localidade</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredClients
                    .filter(c => c)
                    .slice((currentPage - 1) * clientsPerPage, currentPage * clientsPerPage)
                    .map((client) => (
                  <TableRow key={client.id}>
                    <TableCell className="font-mono text-sm">
                      {client.clientNumber || client.id.slice(0, 8)}
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        <div className="font-medium">{client.name}</div>
                        {client.cardNumber && (
                          <div className="text-xs text-muted-foreground">
                            {client.cardNumber}
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        {(client.phone1 || client.phone) && (
                          <div key={`${client.id}-phone1`} className="flex items-center text-sm">
                            <Phone className="mr-2 h-3 w-3 text-muted-foreground" />
                            {client.phone1 || client.phone}
                          </div>
                        )}
                        {client.phone2 && (
                          <div key={`${client.id}-phone2`} className="flex items-center text-sm text-muted-foreground">
                            <Phone className="mr-2 h-3 w-3" />
                            {client.phone2}
                          </div>
                        )}
                        {(client.email1 || client.email) && (
                          <div key={`${client.id}-email1`} className="flex items-center text-sm text-muted-foreground">
                            <Mail className="mr-2 h-3 w-3" />
                            {client.email1 || client.email}
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>{client.nif || '-'}</TableCell>
                    <TableCell className="text-muted-foreground text-sm">
                      {client.locality || '-'}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setEditingClient(client)
                            setDialogOpen(true)
                          }}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setClientToDelete(client)
                            setDeleteDialogOpen(true)
                          }}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
                </TableBody>
              </Table>
              
              {/* Paginação */}
              {filteredClients.length > clientsPerPage && (
                <div className="flex items-center justify-between mt-6 pt-4 border-t">
                  <div className="text-sm text-muted-foreground">
                    A mostrar {((currentPage - 1) * clientsPerPage) + 1} a {Math.min(currentPage * clientsPerPage, filteredClients.length)} de {filteredClients.length} cliente{filteredClients.length !== 1 ? 's' : ''}
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage(1)}
                      disabled={currentPage === 1}
                    >
                      <ChevronsLeft className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                      disabled={currentPage === 1}
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </Button>
                    
                    <div className="flex items-center gap-1">
                      {Array.from({ length: Math.ceil(filteredClients.length / clientsPerPage) }, (_, i) => i + 1)
                        .filter(page => {
                          // Mostrar sempre primeira, última e 2 páginas ao redor da atual
                          const totalPages = Math.ceil(filteredClients.length / clientsPerPage)
                          return page === 1 || 
                                 page === totalPages || 
                                 Math.abs(page - currentPage) <= 1
                        })
                        .map((page, index, array) => {
                          // Adicionar "..." entre páginas não consecutivas
                          const showEllipsis = index > 0 && page - array[index - 1] > 1
                          return (
                            <React.Fragment key={page}>
                              {showEllipsis && (
                                <span className="px-2 text-muted-foreground">
                                  ...
                                </span>
                              )}
                              <Button
                                variant={currentPage === page ? "default" : "outline"}
                                size="sm"
                                onClick={() => setCurrentPage(page)}
                                className="w-10"
                              >
                                {page}
                              </Button>
                            </React.Fragment>
                          )
                        })}
                    </div>
                    
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage(prev => Math.min(Math.ceil(filteredClients.length / clientsPerPage), prev + 1))}
                      disabled={currentPage >= Math.ceil(filteredClients.length / clientsPerPage)}
                    >
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage(Math.ceil(filteredClients.length / clientsPerPage))}
                      disabled={currentPage >= Math.ceil(filteredClients.length / clientsPerPage)}
                    >
                      <ChevronsRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Eliminar Cliente</AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div>
                <p>
                  Tem a certeza que deseja eliminar o cliente <strong>{clientToDelete?.name}</strong>?
                  Esta ação não pode ser revertida.
                </p>
                {clientToDelete && (
                  <div className="mt-2 text-sm">
                    <div>Telefone: {clientToDelete.phone}</div>
                    {clientToDelete.email && <div>Email: {clientToDelete.email}</div>}
                  </div>
                )}
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setClientToDelete(null)}>
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
