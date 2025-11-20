import { useState, useEffect, useRef } from 'react'
import { Button } from './ui/button'
import { Input } from './ui/input'
import { Label } from './ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table'
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs'
import { Plus, FileText, Trash2, Check, X, Search, Edit, ClipboardList, Printer, Mail, MessageCircle, Send, Share2, Package, Warehouse, Database, Clock } from 'lucide-react'
import { projectId } from '../utils/supabase/info'
import { toast } from 'sonner@2.0.3'
import { Badge } from './ui/badge'
import { Textarea } from './ui/textarea'
import { BudgetPrintView } from './BudgetPrintView'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from './ui/dropdown-menu'
import { useWorkshop } from './WorkshopContext'
import { useModulesIntegration } from './ModulesIntegrationContext'

interface BudgetsModuleProps {
  accessToken: string
  initialTab?: string
}

interface BudgetItem {
  partNumber: string
  description: string
  quantity: number
  price: number
}

interface Budget {
  id: string
  number: string
  clientId: string
  vehicleId: string
  items: BudgetItem[]
  laborHours: number
  laborRate: number
  partsTotal: number
  laborTotal: number
  subtotal: number
  tax: number
  total: number
  status: 'pending' | 'approved' | 'rejected' | 'quoted' | 'canceled'
  notes?: string
  createdAt: string
  approvedByClient?: boolean
  clientApprovedAt?: string
  publicQuoteRequestId?: string
  licensePlate?: string
  serviceName?: string
  clientName?: string
  clientEmail?: string
  clientPhone?: string
  canceledByClient?: boolean
  canceledAt?: string
  cancelReason?: string
}

interface Client {
  id: string
  name: string
  email?: string
  phone?: string
  nif?: string
}

interface Vehicle {
  id: string
  licensePlate: string
  brand: string
  model: string
  clientId: string
}

interface StockItem {
  id: string
  reference: string
  name: string
  description: string
  quantity: number
  salePrice: number
  categoryName?: string
}

export function BudgetsModule({ accessToken, initialTab }: BudgetsModuleProps) {
  const { workshop } = useWorkshop()
  const integration = useModulesIntegration()
  const [budgets, setBudgets] = useState<Budget[]>([])
  const [clients, setClients] = useState<Client[]>([])
  const [vehicles, setVehicles] = useState<Vehicle[]>([])
  const [stockItems, setStockItems] = useState<StockItem[]>([])
  const [workOrderBudgetIds, setWorkOrderBudgetIds] = useState<string[]>([])
  const [loading, setLoading] = useState(false)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingBudget, setEditingBudget] = useState<Budget | null>(null)
  const [creatingWorkOrder, setCreatingWorkOrder] = useState(false)
  
  // Stock integration dialogs
  const [showStockSelector, setShowStockSelector] = useState(false)
  const [showQuickAddStock, setShowQuickAddStock] = useState(false)
  const [stockSearchTerm, setStockSearchTerm] = useState('')
  const [quickStockForm, setQuickStockForm] = useState({
    reference: '',
    name: '',
    quantity: 1,
    purchasePrice: 0,
    salePrice: 0
  })
  
  // TecDoc integration
  const [tecdocLoading, setTecdocLoading] = useState<number | null>(null)
  
  const [selectedClientId, setSelectedClientId] = useState('')
  const [selectedVehicleId, setSelectedVehicleId] = useState('')
  const [items, setItems] = useState<BudgetItem[]>([])
  const [laborHours, setLaborHours] = useState('0')
  const [laborRate, setLaborRate] = useState('25')
  const [notes, setNotes] = useState('')
  const [searchFilter, setSearchFilter] = useState('')

  // Print and Send states
  const [printDialogOpen, setPrintDialogOpen] = useState(false)
  const [sendEmailDialogOpen, setSendEmailDialogOpen] = useState(false)
  const [selectedBudgetForAction, setSelectedBudgetForAction] = useState<Budget | null>(null)
  const [emailRecipient, setEmailRecipient] = useState('')
  const [emailSubject, setEmailSubject] = useState('')
  const [emailMessage, setEmailMessage] = useState('')
  const [sendingSMS, setSendingSMS] = useState(false)
  const printRef = useRef<HTMLDivElement>(null)
  
  // Delete confirmation state
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [budgetToDelete, setBudgetToDelete] = useState<Budget | null>(null)
  const [deleting, setDeleting] = useState(false)

  useEffect(() => {
    fetchBudgets()
    fetchClients()
    fetchVehicles()
    fetchWorkOrders()
    fetchStockItems()
  }, [])

  // Register refresh callback for integration
  useEffect(() => {
    const refreshCallback = () => {
      fetchBudgets()
      fetchWorkOrders()
    }
    
    integration.registerRefreshCallback('budgets', refreshCallback)
    
    return () => {
      integration.unregisterRefreshCallback('budgets')
    }
  }, []) // Empty deps - só regista uma vez

  const fetchBudgets = async () => {
    setLoading(true)
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
        // Ensure all budgets have required numeric fields
        const budgetsWithDefaults = (data.budgets || []).map((budget: Budget) => ({
          ...budget,
          partsTotal: budget.partsTotal ?? 0,
          laborTotal: budget.laborTotal ?? 0,
          subtotal: budget.subtotal ?? 0,
          tax: budget.tax ?? 0,
          total: budget.total ?? 0,
          laborHours: budget.laborHours ?? 0,
          laborRate: budget.laborRate ?? 0,
        }))
        setBudgets(budgetsWithDefaults)
      }
    } catch (error) {
      console.error('Error fetching budgets:', error)
      toast.error('Erro ao carregar orçamentos')
    } finally {
      setLoading(false)
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

  const fetchWorkOrders = async () => {
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
        const budgetIds = (data.workOrders || []).map((wo: any) => wo.budgetId)
        setWorkOrderBudgetIds(budgetIds)
      }
    } catch (error) {
      console.error('Error fetching work orders:', error)
    }
  }

  const fetchStockItems = async () => {
    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-6971b43c/stock/items`,
        {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
          },
        }
      )

      if (response.ok) {
        const data = await response.json()
        setStockItems(data.items || [])
      }
    } catch (error) {
      console.error('Error fetching stock items:', error)
    }
  }

  const addItem = () => {
    setItems([...items, { partNumber: '', description: '', quantity: 1, price: 0 }])
  }

  const removeItem = (index: number) => {
    setItems(items.filter((_, i) => i !== index))
  }

  const updateItem = (index: number, field: keyof BudgetItem, value: any) => {
    const newItems = [...items]
    newItems[index] = { ...newItems[index], [field]: value }
    setItems(newItems)
  }

  const addItemFromStock = (stockItem: StockItem) => {
    const newItem: BudgetItem = {
      partNumber: stockItem.reference,
      description: stockItem.name,
      quantity: 1,
      price: stockItem.salePrice
    }
    setItems([...items, newItem])
    setShowStockSelector(false)
    setStockSearchTerm('')
    toast.success(`Peça "${stockItem.name}" adicionada ao orçamento`)
  }

  // TecDoc Search Handler
  const handleTecDocSearchForItem = async (index: number) => {
    const reference = items[index].partNumber.trim()
    
    if (!reference) {
      toast.error('Por favor, insira uma referência primeiro')
      return
    }

    try {
      setTecdocLoading(index)
      toast.info('A consultar TecDoc...')
      
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-6971b43c/stock/tecdoc/search`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${accessToken}`,
          },
          body: JSON.stringify({ reference }),
        }
      )

      const data = await response.json()

      if (!response.ok) {
        if (data.configured === false) {
          toast.error('API TecDoc não está configurada. Por favor, contacte o administrador.')
        } else if (data.found === false) {
          toast.warning('Nenhum resultado encontrado no TecDoc para esta referência')
        } else {
          toast.error(data.error || 'Erro ao consultar TecDoc')
        }
        return
      }

      if (data.found === false) {
        toast.warning('Nenhum resultado encontrado no TecDoc para esta referência')
        return
      }

      // Auto-fill item with TecDoc data
      const newItems = [...items]
      newItems[index] = {
        ...newItems[index],
        description: data.name || newItems[index].description,
        price: data.salePrice || newItems[index].price,
      }
      setItems(newItems)

      toast.success('Dados importados do TecDoc com sucesso!')
      console.log('✅ TecDoc data imported:', data)

    } catch (error) {
      console.error('Error fetching TecDoc data:', error)
      toast.error('Erro ao conectar ao TecDoc')
    } finally {
      setTecdocLoading(null)
    }
  }

  const handleQuickAddStock = async (e: React.FormEvent) => {
    e.preventDefault()
    
    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-6971b43c/stock/items`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${accessToken}`,
          },
          body: JSON.stringify(quickStockForm),
        }
      )

      if (response.ok) {
        const data = await response.json()
        toast.success('Item adicionado ao stock!')
        
        // Add the new item to the budget
        const newItem: BudgetItem = {
          partNumber: quickStockForm.reference,
          description: quickStockForm.name,
          quantity: 1,
          price: quickStockForm.salePrice
        }
        setItems([...items, newItem])
        
        // Refresh stock items
        fetchStockItems()
        
        // Close dialog and reset form
        setShowQuickAddStock(false)
        setQuickStockForm({
          reference: '',
          name: '',
          quantity: 1,
          purchasePrice: 0,
          salePrice: 0
        })
      } else {
        const data = await response.json()
        toast.error(data.error || 'Erro ao adicionar item ao stock')
      }
    } catch (error) {
      console.error('Error adding stock item:', error)
      toast.error('Erro ao adicionar item ao stock')
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!selectedClientId || !selectedVehicleId) {
      toast.error('Selecione um cliente e veículo')
      return
    }

    if (items.length === 0) {
      toast.error('Adicione pelo menos uma peça')
      return
    }

    try {
      const url = editingBudget
        ? `https://${projectId}.supabase.co/functions/v1/make-server-6971b43c/budgets/${editingBudget.id}`
        : `https://${projectId}.supabase.co/functions/v1/make-server-6971b43c/budgets`

      const response = await fetch(url, {
        method: editingBudget ? 'PUT' : 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`,
        },
        body: JSON.stringify({
          clientId: selectedClientId,
          vehicleId: selectedVehicleId,
          items,
          laborHours: parseFloat(laborHours),
          laborRate: parseFloat(laborRate),
          notes,
        }),
      })

      if (response.ok) {
        toast.success(editingBudget ? 'Orçamento atualizado!' : 'Orçamento criado!')
        setDialogOpen(false)
        resetForm()
        fetchBudgets()
      } else {
        const data = await response.json()
        toast.error(data.error || `Erro ao ${editingBudget ? 'atualizar' : 'criar'} orçamento`)
      }
    } catch (error) {
      console.error(`Error ${editingBudget ? 'updating' : 'creating'} budget:`, error)
      toast.error(`Erro ao ${editingBudget ? 'atualizar' : 'criar'} orçamento`)
    }
  }

  const handleCreateWorkOrder = async (budget: Budget) => {
    if (creatingWorkOrder) return
    
    console.log('🔄 Creating work order from budget:', {
      budgetId: budget.id,
      clientId: budget.clientId,
      vehicleId: budget.vehicleId,
      status: budget.status,
      publicQuoteRequestId: budget.publicQuoteRequestId,
      hasClientName: !!budget.clientName,
      hasLicensePlate: !!budget.licensePlate
    })
    
    // For regular budgets (not from public portal), validate required fields
    // For public budgets, the integration route will create client/vehicle if needed
    if (!budget.publicQuoteRequestId && (!budget.clientId || !budget.vehicleId)) {
      toast.error('Este orçamento não tem cliente ou veículo associado')
      console.error('❌ Budget missing required fields:', { 
        hasClientId: !!budget.clientId, 
        hasVehicleId: !!budget.vehicleId 
      })
      return
    }
    
    setCreatingWorkOrder(true)
    try {
      const workOrder = await integration.createWorkOrderFromBudget(
        budget.id,
        accessToken,
        workshop?.id
      )
      
      if (workOrder) {
        console.log('✅ Work order created:', workOrder.id)
        fetchWorkOrders()
        // Refresh budgets to get updated clientId and vehicleId
        fetchBudgets()
      } else {
        toast.error('Erro ao criar Folha de Obra')
      }
    } catch (error: any) {
      console.error('❌ Error creating work order:', error)
      toast.error(error.message || 'Erro ao criar Folha de Obra')
    } finally {
      setCreatingWorkOrder(false)
    }
  }

  const resetForm = () => {
    setEditingBudget(null)
    setSelectedClientId('')
    setSelectedVehicleId('')
    setItems([])
    setLaborHours('0')
    setLaborRate('25')
    setNotes('')
  }

  const handleEditBudget = (budget: Budget) => {
    setEditingBudget(budget)
    setSelectedClientId(budget.clientId)
    setSelectedVehicleId(budget.vehicleId)
    setItems(budget.items || [])
    setLaborHours((budget.laborHours ?? 0).toString())
    setLaborRate((budget.laborRate ?? 25).toString())
    setNotes(budget.notes || '')
    setDialogOpen(true)
  }

  const updateBudgetStatus = async (budgetId: string, status: 'approved' | 'rejected') => {
    try {
      const url = `https://${projectId}.supabase.co/functions/v1/make-server-6971b43c/budgets/${budgetId}/status`
      console.log('🔄 Updating budget status:', { budgetId, status, url })
      console.log('🔑 Access token:', accessToken ? 'Present' : 'Missing')
      
      const response = await fetch(url, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`,
        },
        body: JSON.stringify({ status }),
      })

      console.log('📡 Response received:', { 
        ok: response.ok, 
        status: response.status, 
        statusText: response.statusText 
      })

      if (response.ok) {
        const data = await response.json()
        console.log('✅ Budget status updated successfully:', data)
        toast.success(`Orçamento ${status === 'approved' ? 'aprovado' : 'rejeitado'}!`)
        fetchBudgets()
      } else {
        const errorData = await response.json()
        console.error('❌ Error response from server:', errorData)
        toast.error(errorData.error || 'Erro ao atualizar orçamento')
      }
    } catch (error) {
      console.error('❌ Network or fetch error:', error)
      console.error('Error type:', error.constructor.name)
      console.error('Error message:', error.message)
      toast.error('Erro de conexão ao atualizar orçamento. Verifique se o servidor está ativo.')
    }
  }

  // Print and Send functions
  const handlePrintBudget = (budget: Budget) => {
    // Block printing for public quotes not yet approved
    if (budget.publicQuoteRequestId && !budget.approvedByClient) {
      toast.error('A impressão estará disponível após o cliente aprovar o orçamento')
      return
    }
    
    setSelectedBudgetForAction(budget)
    setPrintDialogOpen(true)
    
    // Trigger print after dialog opens
    setTimeout(() => {
      window.print()
    }, 100)
  }

  const handleSendEmail = (budget: Budget) => {
    // Block sending email for public quotes not yet approved
    if (budget.publicQuoteRequestId && !budget.approvedByClient) {
      toast.error('Os dados de contacto estarão disponíveis após o cliente aprovar o orçamento')
      return
    }
    
    setSelectedBudgetForAction(budget)
    const client = clients.find(c => c.id === budget.clientId)
    setEmailRecipient(client?.email || budget.clientEmail || '')
    setEmailSubject(`Orçamento ${budget.number} - OficinasExpress`)
    setEmailMessage(`Exmo(a) Sr(a) ${client?.name || budget.clientName || ''},\n\nEnviamos em anexo o orçamento ${budget.number} no valor de €${budget.total.toFixed(2)}.\n\nFicamos ao dispor para qualquer esclarecimento.\n\nCumprimentos,\nOficinasExpress`)
    setSendEmailDialogOpen(true)
  }

  const sendBudgetEmail = async () => {
    if (!selectedBudgetForAction || !emailRecipient) {
      toast.error('Preencha todos os campos obrigatórios')
      return
    }

    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-6971b43c/budgets/${selectedBudgetForAction.id}/send-email`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${accessToken}`,
          },
          body: JSON.stringify({
            to: emailRecipient,
            subject: emailSubject,
            message: emailMessage
          }),
        }
      )

      if (response.ok) {
        toast.success('Email enviado com sucesso!')
        setSendEmailDialogOpen(false)
        setEmailRecipient('')
        setEmailSubject('')
        setEmailMessage('')
      } else {
        const error = await response.json()
        toast.error(error.error || 'Erro ao enviar email')
      }
    } catch (error) {
      console.error('Error sending email:', error)
      toast.error('Erro ao enviar email')
    }
  }

  const handleSendWhatsApp = (budget: Budget) => {
    // Block sending WhatsApp for public quotes not yet approved
    if (budget.publicQuoteRequestId && !budget.approvedByClient) {
      toast.error('Os dados de contacto estarão disponíveis após o cliente aprovar o orçamento')
      return
    }
    
    const client = clients.find(c => c.id === budget.clientId)
    const vehicle = getVehicleInfo(budget.vehicleId)
    
    const message = `Olá ${client?.name || budget.clientName || ''},\n\nSegue o orçamento ${budget.number} para o veículo ${vehicle}:\n\nTotal: €${budget.total.toFixed(2)}\n\nOficinasExpress`
    
    const phone = (client?.phone || budget.clientPhone || '').replace(/\s/g, '')
    const whatsappUrl = `https://wa.me/${phone}?text=${encodeURIComponent(message)}`
    
    if (phone) {
      window.open(whatsappUrl, '_blank')
      toast.success('A abrir WhatsApp...')
    } else {
      toast.error('Cliente não tem número de telefone registado')
    }
  }

  const handleSendSMS = async (budget: Budget) => {
    // Block sending SMS for public quotes not yet approved
    if (budget.publicQuoteRequestId && !budget.approvedByClient) {
      toast.error('Os dados de contacto estarão disponíveis após o cliente aprovar o orçamento')
      return
    }
    
    const client = clients.find(c => c.id === budget.clientId)
    const phone = client?.phone || budget.clientPhone
    
    if (!phone) {
      toast.error('Cliente não tem número de telefone registado')
      return
    }

    setSendingSMS(true)
    try {
      const message = `OficinasExpress: Orçamento ${budget.number} disponível. Total: €${budget.total.toFixed(2)}. Consulte o seu email para mais detalhes.`
      
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-6971b43c/budgets/${budget.id}/send-sms`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${accessToken}`,
          },
          body: JSON.stringify({
            phone: phone,
            message
          }),
        }
      )

      if (response.ok) {
        toast.success('SMS enviado com sucesso!')
      } else {
        const error = await response.json()
        toast.error(error.error || 'Erro ao enviar SMS')
      }
    } catch (error) {
      console.error('Error sending SMS:', error)
      toast.error('Erro ao enviar SMS')
    } finally {
      setSendingSMS(false)
    }
  }

  const handleDeleteBudget = async () => {
    if (!budgetToDelete) return
    
    setDeleting(true)
    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-6971b43c/budgets/${budgetToDelete.id}`,
        {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${accessToken}`,
          },
        }
      )

      if (response.ok) {
        toast.success('Orçamento eliminado com sucesso!')
        setDeleteDialogOpen(false)
        setBudgetToDelete(null)
        fetchBudgets() // Refresh the list
      } else {
        const error = await response.json()
        toast.error(error.error || 'Erro ao eliminar orçamento')
      }
    } catch (error) {
      console.error('Error deleting budget:', error)
      toast.error('Erro ao eliminar orçamento')
    } finally {
      setDeleting(false)
    }
  }

  const convertToWorkOrder = async (budgetId: string) => {
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
            budgetId,
          }),
        }
      )

      if (response.ok) {
        toast.success('Folha de obra criada com sucesso!')
        fetchWorkOrders() // Update the list of work orders
      } else {
        const data = await response.json()
        toast.error(data.error || 'Erro ao criar folha de obra')
      }
    } catch (error) {
      console.error('Error converting to work order:', error)
      toast.error('Erro ao criar folha de obra')
    }
  }

  const getClientName = (budget: Budget) => {
    // For budgets from instant quote with clientId, show the client name
    if (budget.publicQuoteRequestId && budget.clientId) {
      // Client was added to database, show the name from budget or find in clients list
      if ((budget as any).clientName) {
        return (budget as any).clientName
      }
      const client = clients.find(c => c && c.id === budget.clientId)
      return client?.name || 'N/A'
    }
    
    // For budgets from public portal without client, hide until approved
    if (budget.publicQuoteRequestId && !budget.clientId) {
      if (budget.approvedByClient) {
        return (budget as any).clientName || 'N/A'
      }
      return null // Will be handled in the render to show message
    }
    
    // For regular budgets, find client by ID
    const client = clients.find(c => c && c.id === budget.clientId)
    return client?.name || 'N/A'
  }

  const getVehicleInfo = (vehicleId: string) => {
    const vehicle = vehicles.find(v => v && v.id === vehicleId)
    return vehicle ? `${vehicle.brand} ${vehicle.model} (${vehicle.licensePlate})` : 'N/A'
  }

  const filterBudgets = (budgetsList: Budget[]) => {
    if (!searchFilter.trim()) return budgetsList
    
    const searchLower = searchFilter.toLowerCase().trim()
    
    return budgetsList.filter(budget => {
      if (!budget) return false
      const vehicle = vehicles.find(v => v && v.id === budget.vehicleId)
      const client = clients.find(c => c && c.id === budget.clientId)
      
      // Check license plate from vehicle or budget itself (for public quotes)
      const matchesLicensePlate = vehicle?.licensePlate?.toLowerCase().includes(searchLower) ||
                                  budget.licensePlate?.toLowerCase().includes(searchLower)
      
      // Check client name from clients list or budget itself (for public quotes)
      const matchesClientName = client?.name?.toLowerCase().includes(searchLower) ||
                                budget.clientName?.toLowerCase().includes(searchLower)
      
      return matchesLicensePlate || matchesClientName
    })
  }

  const filteredBudgets = filterBudgets(budgets)
  const clientVehicles = vehicles.filter(v => v.clientId === selectedClientId)

  const pendingBudgets = filteredBudgets.filter(b => b && b.status === 'pending')
  const validatedBudgets = filteredBudgets.filter(b => b && (b.status === 'approved' || b.status === 'rejected'))
  const clientApprovedBudgets = filteredBudgets.filter(b => b && b.approvedByClient === true)
  const quotedBudgets = filteredBudgets.filter(b => b && b.status === 'quoted')
  const canceledBudgets = filteredBudgets.filter(b => b && b.status === 'canceled')

  const renderBudgetsTable = (budgetsList: Budget[]) => {
    if (budgetsList.length === 0) {
      return (
        <div className="text-center py-8 text-muted-foreground">
          {searchFilter ? 'Nenhum orçamento encontrado' : 'Nenhum orçamento nesta categoria'}
        </div>
      )
    }

    return (
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Número</TableHead>
            <TableHead>Cliente</TableHead>
            <TableHead>Veículo</TableHead>
            <TableHead>Total</TableHead>
            <TableHead>Estado</TableHead>
            <TableHead className="text-right">Ações</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {budgetsList.map((budget) => (
            <TableRow key={budget.id}>
              <TableCell>
                <div className="flex items-center">
                  <FileText className="mr-2 h-4 w-4 text-muted-foreground" />
                  {budget.number}
                </div>
              </TableCell>
              <TableCell>
                <div>
                  {budget.publicQuoteRequestId && !budget.approvedByClient && !budget.clientId ? (
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <span className="text-sm italic">Disponível após aprovação</span>
                    </div>
                  ) : (
                    <>
                      {getClientName(budget)}
                    </>
                  )}
                </div>
                {budget.serviceName && (
                  <p className="text-xs text-muted-foreground mt-1">
                    {budget.serviceName}
                  </p>
                )}
              </TableCell>
              <TableCell className="text-sm">
                {budget.licensePlate || getVehicleInfo(budget.vehicleId)}
              </TableCell>
              <TableCell>€{(budget.total ?? 0).toFixed(2)}</TableCell>
              <TableCell>
                <div className="flex flex-col gap-1">
                  <Badge
                    variant={
                      budget.status === 'approved' ? 'default' :
                      budget.status === 'rejected' ? 'destructive' :
                      budget.status === 'quoted' ? 'default' :
                      budget.status === 'canceled' ? 'secondary' :
                      'secondary'
                    }
                    className={
                      budget.status === 'quoted' ? 'bg-blue-600' : 
                      budget.status === 'canceled' ? 'bg-gray-500' : ''
                    }
                  >
                    {budget.status === 'approved' ? 'Aprovado' :
                     budget.status === 'rejected' ? 'Rejeitado' :
                     budget.status === 'quoted' ? 'Orçamentado' :
                     budget.status === 'canceled' ? 'Anulado' :
                     'Pendente'}
                  </Badge>
                  {/* Client approval status - only show when there's an explicit action */}
                  {budget.canceledByClient ? (
                    <Badge variant="outline" className="bg-gray-50 text-gray-700 border-gray-300 text-xs">
                      <X className="h-3 w-3 mr-1" />
                      {budget.cancelReason || 'Anulado pelo cliente'}
                    </Badge>
                  ) : (budget.approvedByClient || budget.clientApprovalStatus === 'approved') ? (
                    <Badge variant="outline" className="bg-green-50 text-green-700 border-green-300 text-xs">
                      <Check className="h-3 w-3 mr-1" />
                      Cliente validou
                    </Badge>
                  ) : budget.clientApprovalStatus === 'rejected' ? (
                    <Badge variant="outline" className="bg-red-50 text-red-700 border-red-300 text-xs">
                      <X className="h-3 w-3 mr-1" />
                      Cliente rejeitou
                    </Badge>
                  ) : null}
                </div>
              </TableCell>
              <TableCell className="text-right">
                <div className="flex gap-2 justify-end">
                  {/* Share/Send Dropdown */}
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm" title="Imprimir ou enviar">
                        <Share2 className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => handlePrintBudget(budget)}>
                        <Printer className="h-4 w-4 mr-2" />
                        Imprimir PDF
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleSendEmail(budget)}>
                        <Mail className="h-4 w-4 mr-2" />
                        Enviar por Email
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem onClick={() => handleSendWhatsApp(budget)}>
                        <MessageCircle className="h-4 w-4 mr-2" />
                        Enviar por WhatsApp
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleSendSMS(budget)} disabled={sendingSMS}>
                        <Send className="h-4 w-4 mr-2" />
                        Enviar por SMS
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>

                  {budget.status === 'pending' && (
                    <>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleEditBudget(budget)}
                        title="Editar orçamento"
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => updateBudgetStatus(budget.id, 'approved')}
                        title="Aprovar orçamento"
                      >
                        <Check className="h-4 w-4 text-green-600" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => updateBudgetStatus(budget.id, 'rejected')}
                        title="Rejeitar orçamento"
                      >
                        <X className="h-4 w-4 text-destructive" />
                      </Button>
                    </>
                  )}
                  {budget.status === 'approved' && (
                    <>
                      {workOrderBudgetIds.includes(budget.id) ? (
                        <Badge variant="outline" className="text-xs">
                          Folha de obra já criada
                        </Badge>
                      ) : (
                        <Button
                          variant="default"
                          size="sm"
                          onClick={() => handleCreateWorkOrder(budget)}
                          disabled={creatingWorkOrder}
                          title="Converter em folha de obra"
                        >
                          <ClipboardList className="h-4 w-4 mr-1" />
                          {creatingWorkOrder ? 'A criar...' : 'Criar Folha de Obra'}
                        </Button>
                      )}
                    </>
                  )}
                  
                  {/* Delete button - available for all statuses */}
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setBudgetToDelete(budget)
                      setDeleteDialogOpen(true)
                    }}
                    title="Eliminar orçamento"
                    className="text-destructive hover:text-destructive"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    )
  }

  return (
    <div className="space-y-4" style={{ margin: '10px', width: 'calc(100% - 20px)' }}>
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
        <Dialog open={dialogOpen} onOpenChange={(open) => {
          setDialogOpen(open)
          if (!open) resetForm()
        }}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Novo Orçamento
            </Button>
          </DialogTrigger>
          <DialogContent className="dialog-fullscreen overflow-y-auto">
            <form onSubmit={handleSubmit}>
              <DialogHeader>
                <DialogTitle>{editingBudget ? 'Editar Orçamento' : 'Criar Orçamento'}</DialogTitle>
                <DialogDescription>
                  {editingBudget ? 'Edite os detalhes do orçamento' : 'Crie um orçamento detalhado para o cliente'}
                </DialogDescription>
              </DialogHeader>
              
              <div className="space-y-4 py-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="clientId">Cliente *</Label>
                    <select
                      id="clientId"
                      className="w-full rounded-md border border-input bg-input-background px-3 py-2"
                      value={selectedClientId}
                      onChange={(e) => {
                        setSelectedClientId(e.target.value)
                        setSelectedVehicleId('')
                      }}
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
                    <Label htmlFor="vehicleId">Veículo *</Label>
                    <select
                      id="vehicleId"
                      className="w-full rounded-md border border-input bg-input-background px-3 py-2"
                      value={selectedVehicleId}
                      onChange={(e) => setSelectedVehicleId(e.target.value)}
                      required
                      disabled={!selectedClientId}
                    >
                      <option value="">Selecione um veículo</option>
                      {clientVehicles.filter(v => v).map((vehicle) => (
                        <option key={vehicle.id} value={vehicle.id}>
                          {vehicle.brand} {vehicle.model} ({vehicle.licensePlate})
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label>Peças / Materiais</Label>
                    <div className="flex gap-2">
                      <Button 
                        type="button" 
                        variant="outline" 
                        size="sm" 
                        onClick={() => setShowStockSelector(true)}
                      >
                        <Package className="h-4 w-4 mr-1" />
                        Do Stock
                      </Button>
                      <Button type="button" variant="outline" size="sm" onClick={addItem}>
                        <Plus className="h-4 w-4 mr-1" />
                        Manual
                      </Button>
                    </div>
                  </div>
                  
                  {items.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground border border-dashed rounded-lg">
                      Nenhuma peça adicionada
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {items.map((item, index) => (
                        <div key={index} className="p-2 border rounded-lg space-y-2">
                          <div className="flex gap-2 items-start">
                            <div className="flex-1 grid grid-cols-12 gap-2">
                              <div className="col-span-3">
                                <Input
                                  placeholder="Ref."
                                  value={item.partNumber}
                                  onChange={(e) => updateItem(index, 'partNumber', e.target.value)}
                                />
                              </div>
                              <div className="col-span-5">
                                <Input
                                  placeholder="Descrição"
                                  value={item.description}
                                  onChange={(e) => updateItem(index, 'description', e.target.value)}
                                  required
                                />
                              </div>
                              <div className="col-span-2">
                                <Input
                                  type="number"
                                  placeholder="Qtd"
                                  min="1"
                                  value={item.quantity}
                                  onChange={(e) => updateItem(index, 'quantity', parseInt(e.target.value) || 1)}
                                  required
                                />
                              </div>
                              <div className="col-span-2">
                                <Input
                                  type="number"
                                  step="0.01"
                                  placeholder="Preço (€)"
                                  min="0"
                                  value={item.price}
                                  onChange={(e) => updateItem(index, 'price', parseFloat(e.target.value) || 0)}
                                  required
                                />
                              </div>
                            </div>
                            <div className="flex gap-1">
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() => handleTecDocSearchForItem(index)}
                                disabled={tecdocLoading === index}
                                title="Buscar dados no TecDoc"
                              >
                                {tecdocLoading === index ? (
                                  <span className="animate-spin">⏳</span>
                                ) : (
                                  <Database className="h-4 w-4" />
                                )}
                              </Button>
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={() => removeItem(index)}
                              >
                                <Trash2 className="h-4 w-4 text-destructive" />
                              </Button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="laborHours">Horas de Mão de Obra</Label>
                    <Input
                      id="laborHours"
                      type="number"
                      step="0.5"
                      min="0"
                      value={laborHours}
                      onChange={(e) => setLaborHours(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="laborRate">Taxa Horária (€/h)</Label>
                    <Input
                      id="laborRate"
                      type="number"
                      step="0.01"
                      min="0"
                      value={laborRate}
                      onChange={(e) => setLaborRate(e.target.value)}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="notes">Notas / Observações</Label>
                  <Textarea
                    id="notes"
                    placeholder="Informações adicionais..."
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    rows={3}
                  />
                </div>
              </div>

              <DialogFooter>
                <Button type="submit">{editingBudget ? 'Atualizar Orçamento' : 'Criar Orçamento'}</Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Orçamentos</CardTitle>
          <CardDescription>
            {budgets.length} orçamento{budgets.length !== 1 ? 's' : ''} criado{budgets.length !== 1 ? 's' : ''}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8 text-muted-foreground">A carregar...</div>
          ) : (
            <Tabs defaultValue={initialTab || "pending"} className="w-full">
              <TabsList className="grid w-full grid-cols-5 mb-4">
                <TabsTrigger value="pending">
                  Pendentes ({pendingBudgets.length})
                </TabsTrigger>
                <TabsTrigger value="quoted">
                  Orçamentados ({quotedBudgets.length})
                </TabsTrigger>
                <TabsTrigger value="client-approved">
                  <Check className="h-3 w-3 mr-1" />
                  Aprovados Cliente ({clientApprovedBudgets.length})
                </TabsTrigger>
                <TabsTrigger value="validated">
                  Validados ({validatedBudgets.length})
                </TabsTrigger>
                <TabsTrigger value="canceled">
                  <X className="h-3 w-3 mr-1" />
                  Anulados ({canceledBudgets.length})
                </TabsTrigger>
              </TabsList>
              
              <TabsContent value="pending">
                {renderBudgetsTable(pendingBudgets)}
              </TabsContent>
              
              <TabsContent value="quoted">
                {renderBudgetsTable(quotedBudgets)}
              </TabsContent>
              
              <TabsContent value="client-approved">
                <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg">
                  <div className="flex items-center gap-2 text-sm text-green-800">
                    <Check className="h-4 w-4" />
                    <span className="font-semibold">
                      Orçamentos aprovados pelos clientes através do portal público
                    </span>
                  </div>
                  <p className="text-xs text-green-700 mt-1">
                    Estes clientes já escolheram a sua oficina e aguardam contacto.
                  </p>
                </div>
                {renderBudgetsTable(clientApprovedBudgets)}
              </TabsContent>
              
              <TabsContent value="validated">
                {renderBudgetsTable(validatedBudgets)}
              </TabsContent>
              
              <TabsContent value="canceled">
                <div className="mb-4 p-3 bg-gray-50 border border-gray-200 rounded-lg">
                  <div className="flex items-center gap-2 text-sm text-gray-800">
                    <X className="h-4 w-4" />
                    <span className="font-semibold">
                      Orçamentos anulados
                    </span>
                  </div>
                  <p className="text-xs text-gray-700 mt-1">
                    Orçamentos que foram cancelados porque o cliente escolheu outra oficina.
                  </p>
                </div>
                {renderBudgetsTable(canceledBudgets)}
              </TabsContent>
            </Tabs>
          )}
        </CardContent>
      </Card>

      {/* Print Dialog */}
      <Dialog open={printDialogOpen} onOpenChange={setPrintDialogOpen}>
        <DialogContent className="dialog-fullscreen overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Imprimir Orçamento</DialogTitle>
            <DialogDescription>
              Pré-visualização do orçamento para impressão
            </DialogDescription>
          </DialogHeader>
          {selectedBudgetForAction && (() => {
            // Get client info from budget directly (for public quotes) or from clients list
            const client = selectedBudgetForAction.publicQuoteRequestId 
              ? {
                  name: selectedBudgetForAction.clientName || 'N/A',
                  email: selectedBudgetForAction.clientEmail,
                  phone: selectedBudgetForAction.clientPhone,
                  nif: undefined
                }
              : clients.find(c => c.id === selectedBudgetForAction.clientId)
            
            return (
              <BudgetPrintView
                ref={printRef}
                budget={selectedBudgetForAction}
                clientName={client?.name || 'N/A'}
                clientEmail={client?.email}
                clientPhone={client?.phone}
                clientNIF={client?.nif}
                vehicleInfo={getVehicleInfo(selectedBudgetForAction.vehicleId)}
                workshop={workshop}
              />
            )
          })()}
          <DialogFooter>
            <Button variant="outline" onClick={() => setPrintDialogOpen(false)}>
              Fechar
            </Button>
            <Button onClick={() => window.print()}>
              <Printer className="h-4 w-4 mr-2" />
              Imprimir
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Send Email Dialog */}
      <Dialog open={sendEmailDialogOpen} onOpenChange={setSendEmailDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Enviar Orçamento por Email</DialogTitle>
            <DialogDescription>
              Envie o orçamento diretamente para o email do cliente
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="emailRecipient">Para (Email) *</Label>
              <Input
                id="emailRecipient"
                type="email"
                placeholder="cliente@example.com"
                value={emailRecipient}
                onChange={(e) => setEmailRecipient(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="emailSubject">Assunto *</Label>
              <Input
                id="emailSubject"
                placeholder="Assunto do email"
                value={emailSubject}
                onChange={(e) => setEmailSubject(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="emailMessage">Mensagem</Label>
              <Textarea
                id="emailMessage"
                placeholder="Mensagem do email..."
                value={emailMessage}
                onChange={(e) => setEmailMessage(e.target.value)}
                rows={6}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setSendEmailDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={sendBudgetEmail}>
              <Mail className="h-4 w-4 mr-2" />
              Enviar Email
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Stock Selector Dialog */}
      <Dialog open={showStockSelector} onOpenChange={setShowStockSelector}>
        <DialogContent className="dialog-fullscreen overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Selecionar Peça do Stock</DialogTitle>
            <DialogDescription>
              Escolha uma peça do inventário para adicionar ao orçamento
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Procurar por referência ou nome..."
                  value={stockSearchTerm}
                  onChange={(e) => setStockSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Button
                variant="outline"
                onClick={() => {
                  setShowStockSelector(false)
                  setShowQuickAddStock(true)
                }}
              >
                <Plus className="h-4 w-4 mr-2" />
                Nova Peça
              </Button>
            </div>

            <div className="border rounded-lg max-h-[400px] overflow-y-auto">
              {stockItems
                .filter(item => 
                  item.reference.toLowerCase().includes(stockSearchTerm.toLowerCase()) ||
                  item.name.toLowerCase().includes(stockSearchTerm.toLowerCase())
                )
                .length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <Package className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>
                    {stockSearchTerm ? 'Nenhuma peça encontrada' : 'Sem peças em stock'}
                  </p>
                  <Button
                    variant="outline"
                    size="sm"
                    className="mt-4"
                    onClick={() => {
                      setShowStockSelector(false)
                      setShowQuickAddStock(true)
                    }}
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Adicionar ao Stock
                  </Button>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Referência</TableHead>
                      <TableHead>Nome</TableHead>
                      <TableHead>Categoria</TableHead>
                      <TableHead className="text-right">Stock</TableHead>
                      <TableHead className="text-right">Preço</TableHead>
                      <TableHead className="text-right">Ação</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {stockItems
                      .filter(item => 
                        item.reference.toLowerCase().includes(stockSearchTerm.toLowerCase()) ||
                        item.name.toLowerCase().includes(stockSearchTerm.toLowerCase())
                      )
                      .slice(0, 20)
                      .map((item) => (
                        <TableRow key={item.id}>
                          <TableCell className="font-mono font-semibold">{item.reference}</TableCell>
                          <TableCell>
                            <div>
                              <div className="font-medium">{item.name}</div>
                              {item.description && (
                                <div className="text-xs text-muted-foreground">{item.description}</div>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline">{item.categoryName || '-'}</Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            <span className={item.quantity === 0 ? 'text-red-600' : ''}>
                              {item.quantity}
                            </span>
                          </TableCell>
                          <TableCell className="text-right">€{item.salePrice.toFixed(2)}</TableCell>
                          <TableCell className="text-right">
                            <Button
                              size="sm"
                              onClick={() => addItemFromStock(item)}
                              disabled={item.quantity === 0}
                            >
                              <Plus className="h-4 w-4 mr-1" />
                              Adicionar
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                  </TableBody>
                </Table>
              )}
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => {
              setShowStockSelector(false)
              setStockSearchTerm('')
            }}>
              Fechar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Quick Add Stock Dialog */}
      <Dialog open={showQuickAddStock} onOpenChange={setShowQuickAddStock}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Adicionar Peça ao Stock</DialogTitle>
            <DialogDescription>
              Crie uma nova peça no stock e adicione ao orçamento
            </DialogDescription>
          </DialogHeader>
          
          <form onSubmit={handleQuickAddStock} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="quickReference">Referência *</Label>
              <Input
                id="quickReference"
                value={quickStockForm.reference}
                onChange={(e) => setQuickStockForm({...quickStockForm, reference: e.target.value})}
                placeholder="Ex: FO-123"
                required
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="quickName">Nome *</Label>
              <Input
                id="quickName"
                value={quickStockForm.name}
                onChange={(e) => setQuickStockForm({...quickStockForm, name: e.target.value})}
                placeholder="Ex: Filtro de óleo"
                required
              />
            </div>
            
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="quickQuantity">Quantidade *</Label>
                <Input
                  id="quickQuantity"
                  type="number"
                  min="0"
                  value={quickStockForm.quantity}
                  onChange={(e) => setQuickStockForm({...quickStockForm, quantity: parseInt(e.target.value) || 0})}
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="quickPurchasePrice">Preço Compra (€)</Label>
                <Input
                  id="quickPurchasePrice"
                  type="number"
                  step="0.01"
                  min="0"
                  value={quickStockForm.purchasePrice}
                  onChange={(e) => setQuickStockForm({...quickStockForm, purchasePrice: parseFloat(e.target.value) || 0})}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="quickSalePrice">Preço Venda (€) *</Label>
                <Input
                  id="quickSalePrice"
                  type="number"
                  step="0.01"
                  min="0"
                  value={quickStockForm.salePrice}
                  onChange={(e) => setQuickStockForm({...quickStockForm, salePrice: parseFloat(e.target.value) || 0})}
                  required
                />
              </div>
            </div>
            
            <div className="rounded-lg bg-blue-50 p-3 text-sm text-blue-900">
              <div className="flex gap-2">
                <Warehouse className="h-4 w-4 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold">A peça será adicionada ao stock e ao orçamento</p>
                  <p className="text-xs mt-1">Pode completar os outros dados no módulo de Stock depois</p>
                </div>
              </div>
            </div>
            
            <DialogFooter>
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => {
                  setShowQuickAddStock(false)
                  setQuickStockForm({
                    reference: '',
                    name: '',
                    quantity: 1,
                    purchasePrice: 0,
                    salePrice: 0
                  })
                }}
              >
                Cancelar
              </Button>
              <Button type="submit">
                <Plus className="h-4 w-4 mr-2" />
                Adicionar ao Stock
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Eliminar Orçamento</DialogTitle>
            <DialogDescription>
              Quer mesmo eliminar este Orçamento? - Irá ser excluído da base de dados.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setDeleteDialogOpen(false)
                setBudgetToDelete(null)
              }}
              disabled={deleting}
            >
              Cancelar
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeleteBudget}
              disabled={deleting}
            >
              <Trash2 className="h-4 w-4 mr-2" />
              {deleting ? 'A eliminar...' : 'Eliminar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
