import { useState, useEffect } from 'react'
import { Button } from './ui/button'
import { Input } from './ui/input'
import { Label } from './ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table'
import { Badge } from './ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from './ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select'
import { Textarea } from './ui/textarea'
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from './ui/alert-dialog'
import { projectId } from '../utils/supabase/info'
import { toast } from 'sonner@2.0.3'
import { 
  Receipt, Plus, Edit, Trash2, Send, Download, Eye, FileText, CreditCard, 
  TrendingUp, Users, Package, Settings, CheckCircle, Clock, XCircle, 
  AlertCircle, Search, Filter, Calendar, DollarSign, RefreshCw, ExternalLink,
  Zap, ShoppingCart, FileCheck, BarChart3, Printer
} from 'lucide-react'
import { MoloniAPI } from './MoloniHelper'

interface InvoicesModuleProps {
  accessToken: string
}

interface MoloniConfig {
  id: string
  hasToken: boolean
  tokenExpiresAt?: string
  companyId?: string
}

interface InvoiceStats {
  total: number
  paid: number
  pending: number
  overdue: number
  totalAmount: number
  paidAmount: number
  pendingAmount: number
}

interface Invoice {
  id: string
  moloniId?: number
  number: string
  clientName: string
  clientVat?: string
  date: string
  dueDate?: string
  total: number
  status: 'draft' | 'issued' | 'paid' | 'overdue' | 'canceled'
  paymentMethod?: string
  notes?: string
  pdfUrl?: string
  createdAt: string
}

interface Client {
  customer_id: number
  name: string
  vat: string
  email?: string
  phone?: string
  address?: string
  city?: string
  zip_code?: string
}

interface Product {
  product_id: number
  name: string
  reference?: string
  price: number
  type: number
  stock?: number
  tax_id?: number
}

export function InvoicesModule({ accessToken }: InvoicesModuleProps) {
  const [activeTab, setActiveTab] = useState('dashboard')
  const [loading, setLoading] = useState(true)
  const [moloniConfig, setMoloniConfig] = useState<MoloniConfig | null>(null)
  const [moloniAPI, setMoloniAPI] = useState<MoloniAPI | null>(null)
  const [companyId, setCompanyId] = useState<number | null>(null)
  
  // Stats
  const [stats, setStats] = useState<InvoiceStats>({
    total: 0,
    paid: 0,
    pending: 0,
    overdue: 0,
    totalAmount: 0,
    paidAmount: 0,
    pendingAmount: 0
  })

  // Invoices
  const [invoices, setInvoices] = useState<Invoice[]>([])
  const [filteredInvoices, setFilteredInvoices] = useState<Invoice[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')

  // Clients
  const [clients, setClients] = useState<Client[]>([])
  const [loadingClients, setLoadingClients] = useState(false)

  // Products
  const [products, setProducts] = useState<Product[]>([])
  const [loadingProducts, setLoadingProducts] = useState(false)

  // Dialogs
  const [createInvoiceDialogOpen, setCreateInvoiceDialogOpen] = useState(false)
  const [viewInvoiceDialogOpen, setViewInvoiceDialogOpen] = useState(false)
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null)

  // Form data
  const [invoiceForm, setInvoiceForm] = useState({
    customerId: '',
    documentSetId: '',
    date: new Date().toISOString().split('T')[0],
    dueDate: '',
    products: [] as Array<{
      productId: number
      name: string
      qty: number
      price: number
      discount: number
    }>,
    notes: '',
    paymentMethodId: ''
  })

  const [workshopId, setWorkshopId] = useState<string>('')

  useEffect(() => {
    loadWorkshopData()
  }, [])

  useEffect(() => {
    if (moloniAPI && companyId) {
      loadDashboardData()
    }
  }, [moloniAPI, companyId])

  useEffect(() => {
    filterInvoices()
  }, [searchTerm, statusFilter, invoices])

  const loadWorkshopData = async () => {
    try {
      setLoading(true)
      
      // Get current user to get workshopId
      const userResponse = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-6971b43c/me`,
        {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
          },
        }
      )

      if (userResponse.ok) {
        const userData = await userResponse.json()
        const wId = userData.user.workshopId
        setWorkshopId(wId)

        // Check if MOLONI is configured
        const moloniResponse = await fetch(
          `https://${projectId}.supabase.co/functions/v1/make-server-6971b43c/admin/moloni/workshop/${wId}`,
          {
            headers: {
              'Authorization': `Bearer ${accessToken}`,
            },
          }
        )

        if (moloniResponse.ok) {
          const moloniData = await moloniResponse.json()
          setMoloniConfig(moloniData.config)
          
          if (moloniData.config.hasToken && moloniData.config.companyId) {
            const api = new MoloniAPI(wId, accessToken)
            setMoloniAPI(api)
            setCompanyId(parseInt(moloniData.config.companyId))
          }
        }
      }
    } catch (error) {
      console.error('Error loading workshop data:', error)
      toast.error('Erro ao carregar dados da oficina')
    } finally {
      setLoading(false)
    }
  }

  const loadDashboardData = async () => {
    if (!moloniAPI || !companyId) return

    try {
      // Load invoices from MOLONI
      const invoicesData = await moloniAPI.getInvoices(companyId, { qty: 100 })
      
      // Transform MOLONI invoices to our format
      const transformedInvoices: Invoice[] = (invoicesData || []).map((inv: any) => ({
        id: inv.document_id.toString(),
        moloniId: inv.document_id,
        number: inv.document_number || inv.document_id.toString(),
        clientName: inv.entity_name || 'Cliente Desconhecido',
        clientVat: inv.entity_vat,
        date: inv.date,
        dueDate: inv.expiration_date,
        total: parseFloat(inv.net_value || inv.gross_value || 0),
        status: getInvoiceStatus(inv),
        paymentMethod: inv.payments?.[0]?.name || '',
        notes: inv.notes,
        createdAt: inv.date
      }))

      setInvoices(transformedInvoices)

      // Calculate stats
      const now = new Date()
      const stats: InvoiceStats = {
        total: transformedInvoices.length,
        paid: transformedInvoices.filter(i => i.status === 'paid').length,
        pending: transformedInvoices.filter(i => i.status === 'issued').length,
        overdue: transformedInvoices.filter(i => {
          if (i.status === 'paid' || i.status === 'canceled') return false
          if (!i.dueDate) return false
          return new Date(i.dueDate) < now
        }).length,
        totalAmount: transformedInvoices.reduce((sum, i) => sum + i.total, 0),
        paidAmount: transformedInvoices.filter(i => i.status === 'paid').reduce((sum, i) => sum + i.total, 0),
        pendingAmount: transformedInvoices.filter(i => i.status !== 'paid' && i.status !== 'canceled').reduce((sum, i) => sum + i.total, 0)
      }

      setStats(stats)
    } catch (error) {
      console.error('Error loading dashboard data:', error)
      toast.error('Erro ao carregar dados do dashboard')
    }
  }

  const getInvoiceStatus = (invoice: any): Invoice['status'] => {
    if (invoice.status === 2) return 'canceled'
    if (invoice.payments && invoice.payments.length > 0) {
      const totalPaid = invoice.payments.reduce((sum: number, p: any) => sum + parseFloat(p.value || 0), 0)
      if (totalPaid >= parseFloat(invoice.net_value || invoice.gross_value || 0)) {
        return 'paid'
      }
    }
    if (invoice.status === 0) return 'draft'
    if (invoice.status === 1) return 'issued'
    return 'issued'
  }

  const loadClients = async () => {
    if (!moloniAPI || !companyId) return

    try {
      setLoadingClients(true)
      const clientsData = await moloniAPI.getCustomers(companyId, { qty: 1000 })
      setClients(clientsData || [])
    } catch (error) {
      console.error('Error loading clients:', error)
      toast.error('Erro ao carregar clientes MOLONI')
    } finally {
      setLoadingClients(false)
    }
  }

  const loadProducts = async () => {
    if (!moloniAPI || !companyId) return

    try {
      setLoadingProducts(true)
      const productsData = await moloniAPI.getProducts(companyId, { qty: 1000 })
      setProducts(productsData || [])
    } catch (error) {
      console.error('Error loading products:', error)
      toast.error('Erro ao carregar produtos MOLONI')
    } finally {
      setLoadingProducts(false)
    }
  }

  const filterInvoices = () => {
    let filtered = [...invoices]

    if (searchTerm) {
      filtered = filtered.filter(inv => 
        inv.number.toLowerCase().includes(searchTerm.toLowerCase()) ||
        inv.clientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        inv.clientVat?.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    if (statusFilter && statusFilter !== 'all') {
      filtered = filtered.filter(inv => inv.status === statusFilter)
    }

    setFilteredInvoices(filtered)
  }

  const handleCreateInvoice = () => {
    if (!moloniConfig?.hasToken) {
      toast.error('MOLONI não configurado. Contacte o administrador.')
      return
    }
    
    loadClients()
    loadProducts()
    setCreateInvoiceDialogOpen(true)
  }

  const handleViewInvoice = async (invoice: Invoice) => {
    setSelectedInvoice(invoice)
    setViewInvoiceDialogOpen(true)
  }

  const handleDownloadPDF = async (invoice: Invoice) => {
    if (!moloniAPI || !companyId || !invoice.moloniId) return

    try {
      const pdfData = await moloniAPI.getInvoicePDF(companyId, invoice.moloniId)
      if (pdfData && pdfData.url) {
        window.open(pdfData.url, '_blank')
        toast.success('PDF da fatura aberto')
      } else {
        toast.error('PDF não disponível')
      }
    } catch (error) {
      console.error('Error downloading PDF:', error)
      toast.error('Erro ao obter PDF da fatura')
    }
  }

  const handleSendByEmail = async (invoice: Invoice) => {
    if (!moloniAPI || !companyId || !invoice.moloniId) return

    const email = prompt('Introduza o email do destinatário:')
    if (!email) return

    try {
      await moloniAPI.sendInvoiceByEmail(companyId, invoice.moloniId, email)
      toast.success(`Fatura enviada para ${email}`)
    } catch (error) {
      console.error('Error sending invoice:', error)
      toast.error('Erro ao enviar fatura por email')
    }
  }

  const getStatusBadge = (status: Invoice['status']) => {
    const statusConfig = {
      draft: { label: 'Rascunho', className: 'bg-gray-100 text-gray-700 border-gray-300' },
      issued: { label: 'Emitida', className: 'bg-blue-100 text-blue-700 border-blue-300' },
      paid: { label: 'Paga', className: 'bg-green-500 text-white border-0' },
      overdue: { label: 'Vencida', className: 'bg-red-100 text-red-700 border-red-300' },
      canceled: { label: 'Cancelada', className: 'bg-gray-400 text-white border-0' }
    }

    const config = statusConfig[status]
    return (
      <Badge variant="outline" className={config.className}>
        {config.label}
      </Badge>
    )
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="inline-block h-12 w-12 rounded-xl bg-gradient-to-br from-blue-600 to-orange-500 animate-pulse mb-4"></div>
          <p className="text-gray-600">A carregar módulo de faturação...</p>
        </div>
      </div>
    )
  }

  if (!moloniConfig) {
    return (
      <Card className="border-2 border-orange-200">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-orange-900">
            <AlertCircle className="h-6 w-6" />
            MOLONI Não Configurado
          </CardTitle>
          <CardDescription>
            O sistema de faturação MOLONI não está configurado para esta oficina
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="bg-orange-50 border border-orange-200 rounded-lg p-6 text-center">
            <Receipt className="h-16 w-16 text-orange-500 mx-auto mb-4" />
            <p className="text-gray-700 mb-4">
              Para utilizar o módulo de faturação, é necessário que o administrador configure a integração MOLONI.
            </p>
            <p className="text-sm text-gray-600">
              Contacte o administrador da plataforma para ativar o MOLONI para a sua oficina.
            </p>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (!moloniConfig.hasToken) {
    return (
      <Card className="border-2 border-orange-200">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-orange-900">
            <AlertCircle className="h-6 w-6" />
            Autenticação MOLONI Pendente
          </CardTitle>
          <CardDescription>
            A configuração MOLONI existe mas não está autenticada
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="bg-orange-50 border border-orange-200 rounded-lg p-6 text-center">
            <Zap className="h-16 w-16 text-orange-500 mx-auto mb-4" />
            <p className="text-gray-700 mb-4">
              A configuração MOLONI está criada mas o administrador ainda não testou a conexão.
            </p>
            <p className="text-sm text-gray-600">
              Solicite ao administrador que execute o teste de conexão no Painel ADMIN → API MOLONI.
            </p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6 p-6" style={{ margin: '0 10px' }}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-orange-600 bg-clip-text text-transparent">
            Faturação MOLONI
          </h1>
          <p className="text-sm text-gray-600 mt-1">
            Sistema completo de faturação integrado com MOLONI
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Badge className="bg-green-100 text-green-700 border border-green-300 px-4 py-2">
            <CheckCircle className="h-4 w-4 mr-2" />
            MOLONI Ativo
          </Badge>
          <Button
            onClick={() => loadDashboardData()}
            variant="outline"
            className="border-blue-200"
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Atualizar
          </Button>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid grid-cols-7 w-full bg-gradient-to-r from-blue-50 to-orange-50 border border-blue-100 p-1">
          <TabsTrigger value="dashboard" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-600 data-[state=active]:to-orange-500 data-[state=active]:text-white">
            <BarChart3 className="h-4 w-4 mr-2" />
            Dashboard
          </TabsTrigger>
          <TabsTrigger value="invoices" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-600 data-[state=active]:to-orange-500 data-[state=active]:text-white">
            <Receipt className="h-4 w-4 mr-2" />
            Faturas
          </TabsTrigger>
          <TabsTrigger value="estimates" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-600 data-[state=active]:to-orange-500 data-[state=active]:text-white">
            <FileText className="h-4 w-4 mr-2" />
            Orçamentos
          </TabsTrigger>
          <TabsTrigger value="receipts" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-600 data-[state=active]:to-orange-500 data-[state=active]:text-white">
            <FileCheck className="h-4 w-4 mr-2" />
            Faturas-Recibo
          </TabsTrigger>
          <TabsTrigger value="clients" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-600 data-[state=active]:to-orange-500 data-[state=active]:text-white">
            <Users className="h-4 w-4 mr-2" />
            Clientes
          </TabsTrigger>
          <TabsTrigger value="products" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-600 data-[state=active]:to-orange-500 data-[state=active]:text-white">
            <Package className="h-4 w-4 mr-2" />
            Produtos
          </TabsTrigger>
          <TabsTrigger value="settings" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-600 data-[state=active]:to-orange-500 data-[state=active]:text-white">
            <Settings className="h-4 w-4 mr-2" />
            Config
          </TabsTrigger>
        </TabsList>

        {/* Dashboard Tab */}
        <TabsContent value="dashboard" className="space-y-6 mt-6">
          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <Card className="border-2 border-blue-100 bg-gradient-to-br from-blue-50 to-white">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm text-blue-700 flex items-center gap-2">
                  <Receipt className="h-4 w-4" />
                  Total de Faturas
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-blue-900">{stats.total}</div>
                <p className="text-xs text-gray-600 mt-1">Todas as faturas</p>
              </CardContent>
            </Card>

            <Card className="border-2 border-green-100 bg-gradient-to-br from-green-50 to-white">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm text-green-700 flex items-center gap-2">
                  <CheckCircle className="h-4 w-4" />
                  Faturas Pagas
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-green-900">{stats.paid}</div>
                <p className="text-xs text-gray-600 mt-1">€ {stats.paidAmount.toFixed(2)}</p>
              </CardContent>
            </Card>

            <Card className="border-2 border-orange-100 bg-gradient-to-br from-orange-50 to-white">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm text-orange-700 flex items-center gap-2">
                  <Clock className="h-4 w-4" />
                  Pendentes
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-orange-900">{stats.pending}</div>
                <p className="text-xs text-gray-600 mt-1">€ {stats.pendingAmount.toFixed(2)}</p>
              </CardContent>
            </Card>

            <Card className="border-2 border-red-100 bg-gradient-to-br from-red-50 to-white">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm text-red-700 flex items-center gap-2">
                  <AlertCircle className="h-4 w-4" />
                  Vencidas
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-red-900">{stats.overdue}</div>
                <p className="text-xs text-gray-600 mt-1">Atenção necessária</p>
              </CardContent>
            </Card>
          </div>

          {/* Recent Invoices */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="h-5 w-5 text-blue-600" />
                    Faturas Recentes
                  </CardTitle>
                  <CardDescription>Últimas 10 faturas emitidas</CardDescription>
                </div>
                <Button
                  onClick={handleCreateInvoice}
                  className="bg-gradient-to-r from-blue-600 to-orange-500 hover:from-blue-700 hover:to-orange-600 text-white"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Nova Fatura
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {invoices.length === 0 ? (
                <div className="text-center py-12">
                  <Receipt className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500">Nenhuma fatura encontrada</p>
                  <p className="text-sm text-gray-400 mt-2">Comece criando a sua primeira fatura</p>
                </div>
              ) : (
                <div className="rounded-xl border border-blue-100 overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-gradient-to-r from-blue-50 to-orange-50">
                        <TableHead className="font-bold">Nº Fatura</TableHead>
                        <TableHead className="font-bold">Cliente</TableHead>
                        <TableHead className="font-bold">Data</TableHead>
                        <TableHead className="font-bold">Vencimento</TableHead>
                        <TableHead className="font-bold">Valor</TableHead>
                        <TableHead className="font-bold">Estado</TableHead>
                        <TableHead className="font-bold text-right">Ações</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {invoices.slice(0, 10).map((invoice) => (
                        <TableRow key={invoice.id} className="hover:bg-blue-50/50">
                          <TableCell>
                            <code className="text-xs bg-blue-50 px-2 py-1 rounded border border-blue-200">
                              {invoice.number}
                            </code>
                          </TableCell>
                          <TableCell>
                            <div>
                              <div className="font-semibold text-gray-800">{invoice.clientName}</div>
                              {invoice.clientVat && (
                                <div className="text-xs text-gray-500">NIF: {invoice.clientVat}</div>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>{new Date(invoice.date).toLocaleDateString('pt-PT')}</TableCell>
                          <TableCell>
                            {invoice.dueDate ? new Date(invoice.dueDate).toLocaleDateString('pt-PT') : '-'}
                          </TableCell>
                          <TableCell className="font-semibold">€ {invoice.total.toFixed(2)}</TableCell>
                          <TableCell>{getStatusBadge(invoice.status)}</TableCell>
                          <TableCell className="text-right">
                            <div className="flex items-center justify-end gap-2">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleViewInvoice(invoice)}
                                className="border-blue-200"
                              >
                                <Eye className="h-3 w-3" />
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleDownloadPDF(invoice)}
                                className="border-green-200"
                              >
                                <Download className="h-3 w-3" />
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleSendByEmail(invoice)}
                                className="border-orange-200"
                              >
                                <Send className="h-3 w-3" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Invoices Tab */}
        <TabsContent value="invoices" className="space-y-6 mt-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Gestão de Faturas</CardTitle>
                  <CardDescription>Todas as faturas emitidas através do MOLONI</CardDescription>
                </div>
                <Button
                  onClick={handleCreateInvoice}
                  className="bg-gradient-to-r from-blue-600 to-orange-500 hover:from-blue-700 hover:to-orange-600 text-white"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Nova Fatura
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {/* Filters */}
              <div className="flex items-center gap-4 mb-6">
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="Pesquisar por nº fatura, cliente ou NIF..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 border-blue-200"
                  />
                </div>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-48 border-blue-200">
                    <SelectValue placeholder="Filtrar por estado" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos os Estados</SelectItem>
                    <SelectItem value="draft">Rascunho</SelectItem>
                    <SelectItem value="issued">Emitida</SelectItem>
                    <SelectItem value="paid">Paga</SelectItem>
                    <SelectItem value="overdue">Vencida</SelectItem>
                    <SelectItem value="canceled">Cancelada</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Invoices Table */}
              {filteredInvoices.length === 0 ? (
                <div className="text-center py-12">
                  <Receipt className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500">
                    {searchTerm || statusFilter !== 'all' 
                      ? 'Nenhuma fatura encontrada com os filtros aplicados' 
                      : 'Nenhuma fatura encontrada'}
                  </p>
                </div>
              ) : (
                <div className="rounded-xl border border-blue-100 overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-gradient-to-r from-blue-50 to-orange-50">
                        <TableHead className="font-bold">Nº Fatura</TableHead>
                        <TableHead className="font-bold">Cliente</TableHead>
                        <TableHead className="font-bold">Data Emissão</TableHead>
                        <TableHead className="font-bold">Vencimento</TableHead>
                        <TableHead className="font-bold">Valor Total</TableHead>
                        <TableHead className="font-bold">Estado</TableHead>
                        <TableHead className="font-bold text-right">Ações</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredInvoices.map((invoice) => (
                        <TableRow key={invoice.id} className="hover:bg-blue-50/50">
                          <TableCell>
                            <code className="text-xs bg-blue-50 px-2 py-1 rounded border border-blue-200 font-mono">
                              {invoice.number}
                            </code>
                          </TableCell>
                          <TableCell>
                            <div>
                              <div className="font-semibold text-gray-800">{invoice.clientName}</div>
                              {invoice.clientVat && (
                                <div className="text-xs text-gray-500">NIF: {invoice.clientVat}</div>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="text-sm">{new Date(invoice.date).toLocaleDateString('pt-PT')}</div>
                          </TableCell>
                          <TableCell>
                            {invoice.dueDate ? (
                              <div className="text-sm">{new Date(invoice.dueDate).toLocaleDateString('pt-PT')}</div>
                            ) : (
                              <span className="text-gray-400">-</span>
                            )}
                          </TableCell>
                          <TableCell>
                            <span className="font-semibold text-gray-900">€ {invoice.total.toFixed(2)}</span>
                          </TableCell>
                          <TableCell>{getStatusBadge(invoice.status)}</TableCell>
                          <TableCell className="text-right">
                            <div className="flex items-center justify-end gap-2">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleViewInvoice(invoice)}
                                className="border-blue-200 hover:bg-blue-50"
                                title="Ver detalhes"
                              >
                                <Eye className="h-3 w-3" />
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleDownloadPDF(invoice)}
                                className="border-green-200 hover:bg-green-50"
                                title="Download PDF"
                              >
                                <Download className="h-3 w-3" />
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleSendByEmail(invoice)}
                                className="border-orange-200 hover:bg-orange-50"
                                title="Enviar por email"
                              >
                                <Send className="h-3 w-3" />
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                className="border-purple-200 hover:bg-purple-50"
                                title="Imprimir"
                              >
                                <Printer className="h-3 w-3" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Estimates Tab */}
        <TabsContent value="estimates" className="space-y-6 mt-6">
          <Card className="border-2 border-blue-100">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5 text-blue-600" />
                Orçamentos / Proformas
              </CardTitle>
              <CardDescription>
                Gestão de orçamentos que podem ser convertidos em faturas
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-12">
                <FileText className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500 mb-4">Funcionalidade de orçamentos em desenvolvimento</p>
                <Button variant="outline" disabled>
                  <Plus className="h-4 w-4 mr-2" />
                  Criar Orçamento
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Receipts Tab */}
        <TabsContent value="receipts" className="space-y-6 mt-6">
          <Card className="border-2 border-blue-100">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileCheck className="h-5 w-5 text-blue-600" />
                Faturas-Recibo
              </CardTitle>
              <CardDescription>
                Documentos que servem simultaneamente como fatura e recibo
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-12">
                <FileCheck className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500 mb-4">Funcionalidade de faturas-recibo em desenvolvimento</p>
                <Button variant="outline" disabled>
                  <Plus className="h-4 w-4 mr-2" />
                  Criar Fatura-Recibo
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Clients Tab */}
        <TabsContent value="clients" className="space-y-6 mt-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Users className="h-5 w-5 text-blue-600" />
                    Clientes MOLONI
                  </CardTitle>
                  <CardDescription>Gestão de clientes sincronizados com MOLONI</CardDescription>
                </div>
                <Button
                  onClick={loadClients}
                  className="bg-gradient-to-r from-blue-600 to-orange-500 hover:from-blue-700 hover:to-orange-600 text-white"
                >
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Sincronizar Clientes
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {loadingClients ? (
                <div className="text-center py-12">
                  <div className="inline-block h-12 w-12 rounded-xl bg-gradient-to-br from-blue-600 to-orange-500 animate-pulse mb-4"></div>
                  <p className="text-gray-600">A carregar clientes do MOLONI...</p>
                </div>
              ) : clients.length === 0 ? (
                <div className="text-center py-12">
                  <Users className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500">Nenhum cliente encontrado</p>
                  <p className="text-sm text-gray-400 mt-2">Clique em "Sincronizar Clientes" para carregar</p>
                </div>
              ) : (
                <div className="rounded-xl border border-blue-100 overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-gradient-to-r from-blue-50 to-orange-50">
                        <TableHead className="font-bold">Nome</TableHead>
                        <TableHead className="font-bold">NIF</TableHead>
                        <TableHead className="font-bold">Email</TableHead>
                        <TableHead className="font-bold">Telefone</TableHead>
                        <TableHead className="font-bold">Cidade</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {clients.slice(0, 50).map((client) => (
                        <TableRow key={client.customer_id} className="hover:bg-blue-50/50">
                          <TableCell className="font-semibold">{client.name}</TableCell>
                          <TableCell>
                            <code className="text-xs bg-blue-50 px-2 py-1 rounded">
                              {client.vat}
                            </code>
                          </TableCell>
                          <TableCell className="text-sm text-gray-600">{client.email || '-'}</TableCell>
                          <TableCell className="text-sm text-gray-600">{client.phone || '-'}</TableCell>
                          <TableCell className="text-sm text-gray-600">{client.city || '-'}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                  {clients.length > 50 && (
                    <div className="p-4 text-center text-sm text-gray-500 bg-gray-50">
                      A mostrar 50 de {clients.length} clientes
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Products Tab */}
        <TabsContent value="products" className="space-y-6 mt-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Package className="h-5 w-5 text-blue-600" />
                    Produtos e Serviços MOLONI
                  </CardTitle>
                  <CardDescription>Catálogo de produtos e serviços sincronizados com MOLONI</CardDescription>
                </div>
                <Button
                  onClick={loadProducts}
                  className="bg-gradient-to-r from-blue-600 to-orange-500 hover:from-blue-700 hover:to-orange-600 text-white"
                >
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Sincronizar Produtos
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {loadingProducts ? (
                <div className="text-center py-12">
                  <div className="inline-block h-12 w-12 rounded-xl bg-gradient-to-br from-blue-600 to-orange-500 animate-pulse mb-4"></div>
                  <p className="text-gray-600">A carregar produtos do MOLONI...</p>
                </div>
              ) : products.length === 0 ? (
                <div className="text-center py-12">
                  <Package className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500">Nenhum produto encontrado</p>
                  <p className="text-sm text-gray-400 mt-2">Clique em "Sincronizar Produtos" para carregar</p>
                </div>
              ) : (
                <div className="rounded-xl border border-blue-100 overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-gradient-to-r from-blue-50 to-orange-50">
                        <TableHead className="font-bold">Nome</TableHead>
                        <TableHead className="font-bold">Referência</TableHead>
                        <TableHead className="font-bold">Tipo</TableHead>
                        <TableHead className="font-bold">Preço</TableHead>
                        <TableHead className="font-bold">Stock</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {products.slice(0, 50).map((product) => (
                        <TableRow key={product.product_id} className="hover:bg-blue-50/50">
                          <TableCell className="font-semibold">{product.name}</TableCell>
                          <TableCell>
                            <code className="text-xs bg-blue-50 px-2 py-1 rounded">
                              {product.reference || '-'}
                            </code>
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline" className={product.type === 1 ? 'border-blue-200 text-blue-700' : 'border-green-200 text-green-700'}>
                              {product.type === 1 ? 'Produto' : 'Serviço'}
                            </Badge>
                          </TableCell>
                          <TableCell className="font-semibold">€ {product.price.toFixed(2)}</TableCell>
                          <TableCell className="text-sm text-gray-600">
                            {product.type === 1 ? (product.stock || 0) : 'N/A'}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                  {products.length > 50 && (
                    <div className="p-4 text-center text-sm text-gray-500 bg-gray-50">
                      A mostrar 50 de {products.length} produtos
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Settings Tab */}
        <TabsContent value="settings" className="space-y-6 mt-6">
          <Card className="border-2 border-blue-100">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5 text-blue-600" />
                Configurações MOLONI
              </CardTitle>
              <CardDescription>
                Informações e configurações da integração com MOLONI
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="bg-green-50 border-2 border-green-200 rounded-lg p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="h-12 w-12 rounded-xl bg-green-500 flex items-center justify-center">
                    <CheckCircle className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <h3 className="font-bold text-green-900">MOLONI Conectado</h3>
                    <p className="text-sm text-green-700">A integração está ativa e funcional</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 mt-4">
                  <div className="bg-white rounded-lg p-4 border border-green-200">
                    <Label className="text-xs text-gray-600">ID da Empresa</Label>
                    <p className="font-mono text-sm mt-1">{companyId || 'N/A'}</p>
                  </div>
                  <div className="bg-white rounded-lg p-4 border border-green-200">
                    <Label className="text-xs text-gray-600">Token Expira em</Label>
                    <p className="text-sm mt-1">
                      {moloniConfig.tokenExpiresAt 
                        ? new Date(moloniConfig.tokenExpiresAt).toLocaleDateString('pt-PT')
                        : 'N/A'}
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
                <h4 className="font-semibold text-blue-900 mb-3 flex items-center gap-2">
                  <ExternalLink className="h-4 w-4" />
                  Links Úteis
                </h4>
                <div className="space-y-2">
                  <Button
                    variant="outline"
                    className="w-full justify-start border-blue-200 hover:bg-blue-100"
                    onClick={() => window.open('https://www.moloni.pt', '_blank')}
                  >
                    <ExternalLink className="h-4 w-4 mr-2" />
                    Aceder ao MOLONI
                  </Button>
                  <Button
                    variant="outline"
                    className="w-full justify-start border-blue-200 hover:bg-blue-100"
                    onClick={() => window.open('https://www.moloni.pt/dev/', '_blank')}
                  >
                    <ExternalLink className="h-4 w-4 mr-2" />
                    Documentação API MOLONI
                  </Button>
                </div>
              </div>

              <div className="bg-orange-50 border border-orange-200 rounded-lg p-6">
                <h4 className="font-semibold text-orange-900 mb-2">Nota Importante</h4>
                <p className="text-sm text-orange-800">
                  Para alterar as configurações do MOLONI (credenciais, tokens, etc.), contacte o administrador da plataforma através do Painel ADMIN → API MOLONI.
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* View Invoice Dialog */}
      <Dialog open={viewInvoiceDialogOpen} onOpenChange={setViewInvoiceDialogOpen}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle className="text-2xl bg-gradient-to-r from-blue-600 to-orange-600 bg-clip-text text-transparent">
              Detalhes da Fatura
            </DialogTitle>
            <DialogDescription>
              Fatura Nº {selectedInvoice?.number}
            </DialogDescription>
          </DialogHeader>

          {selectedInvoice && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-xs text-gray-600">Cliente</Label>
                  <p className="font-semibold">{selectedInvoice.clientName}</p>
                  {selectedInvoice.clientVat && (
                    <p className="text-sm text-gray-600">NIF: {selectedInvoice.clientVat}</p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label className="text-xs text-gray-600">Estado</Label>
                  <div>{getStatusBadge(selectedInvoice.status)}</div>
                </div>
                <div className="space-y-2">
                  <Label className="text-xs text-gray-600">Data de Emissão</Label>
                  <p>{new Date(selectedInvoice.date).toLocaleDateString('pt-PT')}</p>
                </div>
                <div className="space-y-2">
                  <Label className="text-xs text-gray-600">Data de Vencimento</Label>
                  <p>{selectedInvoice.dueDate ? new Date(selectedInvoice.dueDate).toLocaleDateString('pt-PT') : '-'}</p>
                </div>
                <div className="space-y-2">
                  <Label className="text-xs text-gray-600">Valor Total</Label>
                  <p className="text-2xl font-bold text-blue-900">€ {selectedInvoice.total.toFixed(2)}</p>
                </div>
                <div className="space-y-2">
                  <Label className="text-xs text-gray-600">Método de Pagamento</Label>
                  <p>{selectedInvoice.paymentMethod || '-'}</p>
                </div>
              </div>

              {selectedInvoice.notes && (
                <div className="space-y-2">
                  <Label className="text-xs text-gray-600">Observações</Label>
                  <p className="text-sm bg-gray-50 p-3 rounded-lg border">{selectedInvoice.notes}</p>
                </div>
              )}
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setViewInvoiceDialogOpen(false)}>
              Fechar
            </Button>
            {selectedInvoice && (
              <>
                <Button
                  variant="outline"
                  onClick={() => handleDownloadPDF(selectedInvoice)}
                  className="border-green-200 text-green-700"
                >
                  <Download className="h-4 w-4 mr-2" />
                  Download PDF
                </Button>
                <Button
                  onClick={() => handleSendByEmail(selectedInvoice)}
                  className="bg-gradient-to-r from-blue-600 to-orange-500 hover:from-blue-700 hover:to-orange-600 text-white"
                >
                  <Send className="h-4 w-4 mr-2" />
                  Enviar por Email
                </Button>
              </>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
