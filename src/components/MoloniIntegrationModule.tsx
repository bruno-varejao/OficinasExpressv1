import { useState, useEffect } from 'react'
import { Button } from './ui/button'
import { Input } from './ui/input'
import { Label } from './ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table'
import { Badge } from './ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from './ui/dialog'
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from './ui/alert-dialog'
import { projectId } from '../utils/supabase/info'
import { toast } from 'sonner@2.0.3'
import { Building2, Key, CheckCircle, XCircle, Plus, Edit, Trash2, RefreshCw, ExternalLink, Copy, Eye, EyeOff, Settings, FileText, Users, Package, DollarSign, Send, TestTube } from 'lucide-react'

interface MoloniIntegrationModuleProps {
  accessToken: string
}

interface MoloniConfig {
  id: string
  workshopId: string
  workshopName: string
  clientId: string
  clientSecret: string
  username?: string
  password?: string
  isActive: boolean
  accessToken?: string
  refreshToken?: string
  tokenExpiresAt?: string
  lastSync?: string
  companyId?: string
  createdAt: string
  updatedAt: string
}

interface Workshop {
  id: string
  name: string
}

export function MoloniIntegrationModule({ accessToken }: MoloniIntegrationModuleProps) {
  const [configs, setConfigs] = useState<MoloniConfig[]>([])
  const [workshops, setWorkshops] = useState<Workshop[]>([])
  const [loading, setLoading] = useState(true)
  const [createDialogOpen, setCreateDialogOpen] = useState(false)
  const [editDialogOpen, setEditDialogOpen] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [testDialogOpen, setTestDialogOpen] = useState(false)
  const [selectedConfig, setSelectedConfig] = useState<MoloniConfig | null>(null)
  const [testResults, setTestResults] = useState<any>(null)
  const [testLoading, setTestLoading] = useState(false)
  
  const [showClientSecret, setShowClientSecret] = useState(false)
  const [showPassword, setShowPassword] = useState(false)

  const [formData, setFormData] = useState({
    workshopId: '',
    clientId: '',
    clientSecret: '',
    username: '',
    password: '',
    isActive: true
  })

  useEffect(() => {
    loadConfigs()
    loadWorkshops()
  }, [])

  const loadConfigs = async () => {
    try {
      setLoading(true)
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-6971b43c/admin/moloni/configs`,
        {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
          },
        }
      )
      
      if (response.ok) {
        const data = await response.json()
        setConfigs(data.configs || [])
      } else {
        const errorData = await response.json()
        toast.error(`Erro ao carregar configurações: ${errorData.error || 'Erro desconhecido'}`)
      }
    } catch (error) {
      console.error('Error loading configs:', error)
      toast.error('Erro ao carregar configurações MOLONI')
    } finally {
      setLoading(false)
    }
  }

  const loadWorkshops = async () => {
    try {
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
        setWorkshops(data.workshops || [])
      }
    } catch (error) {
      console.error('Error loading workshops:', error)
    }
  }

  const handleCreate = async () => {
    try {
      if (!formData.workshopId || !formData.clientId || !formData.clientSecret) {
        toast.error('Por favor, preencha todos os campos obrigatórios')
        return
      }

      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-6971b43c/admin/moloni/configs`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(formData)
        }
      )

      if (response.ok) {
        toast.success('Configuração MOLONI criada com sucesso!')
        setCreateDialogOpen(false)
        resetForm()
        loadConfigs()
      } else {
        const errorData = await response.json()
        toast.error(`Erro: ${errorData.error || 'Erro ao criar configuração'}`)
      }
    } catch (error) {
      console.error('Error creating config:', error)
      toast.error('Erro ao criar configuração MOLONI')
    }
  }

  const handleUpdate = async () => {
    try {
      if (!selectedConfig || !formData.workshopId || !formData.clientId || !formData.clientSecret) {
        toast.error('Por favor, preencha todos os campos obrigatórios')
        return
      }

      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-6971b43c/admin/moloni/configs/${selectedConfig.id}`,
        {
          method: 'PUT',
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(formData)
        }
      )

      if (response.ok) {
        toast.success('Configuração MOLONI atualizada com sucesso!')
        setEditDialogOpen(false)
        resetForm()
        loadConfigs()
      } else {
        const errorData = await response.json()
        toast.error(`Erro: ${errorData.error || 'Erro ao atualizar configuração'}`)
      }
    } catch (error) {
      console.error('Error updating config:', error)
      toast.error('Erro ao atualizar configuração MOLONI')
    }
  }

  const handleDelete = async () => {
    try {
      if (!selectedConfig) return

      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-6971b43c/admin/moloni/configs/${selectedConfig.id}`,
        {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${accessToken}`,
          },
        }
      )

      if (response.ok) {
        toast.success('Configuração MOLONI eliminada com sucesso!')
        setDeleteDialogOpen(false)
        setSelectedConfig(null)
        loadConfigs()
      } else {
        const errorData = await response.json()
        toast.error(`Erro: ${errorData.error || 'Erro ao eliminar configuração'}`)
      }
    } catch (error) {
      console.error('Error deleting config:', error)
      toast.error('Erro ao eliminar configuração MOLONI')
    }
  }

  const handleTestConnection = async (config: MoloniConfig) => {
    try {
      setTestLoading(true)
      setTestResults(null)
      setSelectedConfig(config)
      setTestDialogOpen(true)

      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-6971b43c/admin/moloni/test/${config.id}`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${accessToken}`,
          },
        }
      )

      const data = await response.json()

      if (response.ok) {
        setTestResults(data)
        toast.success('Teste de conexão realizado com sucesso!')
        loadConfigs() // Reload to get updated token info
      } else {
        setTestResults({ success: false, error: data.error || 'Erro desconhecido' })
        toast.error(`Erro no teste: ${data.error || 'Erro desconhecido'}`)
      }
    } catch (error) {
      console.error('Error testing connection:', error)
      setTestResults({ success: false, error: 'Erro de conexão' })
      toast.error('Erro ao testar conexão MOLONI')
    } finally {
      setTestLoading(false)
    }
  }

  const handleRefreshToken = async (config: MoloniConfig) => {
    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-6971b43c/admin/moloni/refresh/${config.id}`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${accessToken}`,
          },
        }
      )

      if (response.ok) {
        toast.success('Token renovado com sucesso!')
        loadConfigs()
      } else {
        const errorData = await response.json()
        toast.error(`Erro: ${errorData.error || 'Erro ao renovar token'}`)
      }
    } catch (error) {
      console.error('Error refreshing token:', error)
      toast.error('Erro ao renovar token MOLONI')
    }
  }

  const openEditDialog = (config: MoloniConfig) => {
    setSelectedConfig(config)
    setFormData({
      workshopId: config.workshopId,
      clientId: config.clientId,
      clientSecret: config.clientSecret,
      username: config.username || '',
      password: config.password || '',
      isActive: config.isActive
    })
    setEditDialogOpen(true)
  }

  const openDeleteDialog = (config: MoloniConfig) => {
    setSelectedConfig(config)
    setDeleteDialogOpen(true)
  }

  const resetForm = () => {
    setFormData({
      workshopId: '',
      clientId: '',
      clientSecret: '',
      username: '',
      password: '',
      isActive: true
    })
    setSelectedConfig(null)
    setShowClientSecret(false)
    setShowPassword(false)
  }

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text)
    toast.success(`${label} copiado para a área de transferência!`)
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-orange-600 bg-clip-text text-transparent">
            Integração MOLONI
          </h2>
          <p className="text-sm text-gray-600 mt-1">
            Configuração de integração com o sistema de faturação MOLONI para as oficinas
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            onClick={() => window.open('https://www.moloni.pt/dev/', '_blank')}
            className="border-blue-200 text-blue-700 hover:bg-blue-50"
          >
            <ExternalLink className="h-4 w-4 mr-2" />
            Documentação API
          </Button>
          <div className="relative group">
            <div className="absolute inset-0 bg-gradient-to-r from-blue-600 to-orange-500 rounded-lg blur opacity-50 group-hover:opacity-75 transition-opacity"></div>
            <Button 
              onClick={() => setCreateDialogOpen(true)}
              className="relative bg-gradient-to-r from-blue-600 to-orange-500 hover:from-blue-700 hover:to-orange-600 text-white border-0 shadow-lg"
            >
              <Plus className="h-4 w-4 mr-2" />
              Nova Configuração
            </Button>
          </div>
        </div>
      </div>

      {/* API Information Card */}
      <Card className="border-2 border-blue-100 bg-gradient-to-br from-blue-50/50 to-orange-50/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-blue-900">
            <Key className="h-5 w-5" />
            Informação da API MOLONI
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-sm font-semibold text-gray-700">Endpoint Base</Label>
              <div className="flex items-center gap-2">
                <code className="flex-1 text-xs bg-white px-3 py-2 rounded-lg border border-blue-200 font-mono">
                  https://api.moloni.pt/v1/
                </code>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => copyToClipboard('https://api.moloni.pt/v1/', 'Endpoint')}
                >
                  <Copy className="h-3 w-3" />
                </Button>
              </div>
            </div>
            <div className="space-y-2">
              <Label className="text-sm font-semibold text-gray-700">Método de Autenticação</Label>
              <Badge className="bg-green-100 text-green-700 border border-green-200">
                OAuth 2.0 (Client Credentials / Password Grant)
              </Badge>
            </div>
          </div>
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <p className="text-sm text-blue-900">
              <strong>Nota:</strong> Para obter as credenciais (Client ID e Client Secret), aceda ao painel MOLONI em 
              <a href="https://www.moloni.pt" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline ml-1">
                www.moloni.pt
              </a> → Configurações → Integrações → API
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Configurations List */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Building2 className="h-5 w-5 text-blue-600" />
              Configurações por Oficina
            </CardTitle>
            <Badge className="bg-gradient-to-r from-blue-600 to-orange-500 text-white border-0 px-4 py-1.5">
              {configs.length} configuração(ões)
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-12">
              <div className="inline-block h-12 w-12 rounded-xl bg-gradient-to-br from-blue-600 to-orange-500 animate-pulse mb-4"></div>
              <p className="text-gray-600">A carregar configurações...</p>
            </div>
          ) : configs.length === 0 ? (
            <div className="text-center py-12 px-4">
              <div className="inline-block h-16 w-16 rounded-2xl bg-gradient-to-br from-blue-100 to-orange-100 flex items-center justify-center mb-4">
                <Key className="h-8 w-8 text-blue-600" />
              </div>
              <p className="text-gray-600">Nenhuma configuração MOLONI criada</p>
              <p className="text-sm text-gray-500 mt-2">
                Crie a primeira configuração para integrar uma oficina com MOLONI
              </p>
            </div>
          ) : (
            <div className="rounded-xl border border-blue-100 overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow className="bg-gradient-to-r from-blue-50 to-orange-50 border-b-2 border-blue-200">
                    <TableHead className="font-bold text-blue-900">Oficina</TableHead>
                    <TableHead className="font-bold text-blue-900">Client ID</TableHead>
                    <TableHead className="font-bold text-blue-900">Estado</TableHead>
                    <TableHead className="font-bold text-blue-900">Token Expira</TableHead>
                    <TableHead className="font-bold text-blue-900">Última Sinc.</TableHead>
                    <TableHead className="font-bold text-blue-900">Empresa ID</TableHead>
                    <TableHead className="font-bold text-blue-900 text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {configs.map((config) => (
                    <TableRow key={config.id} className="hover:bg-blue-50/50 transition-colors border-b border-blue-100">
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-blue-500 to-orange-500 flex items-center justify-center">
                            <Building2 className="h-4 w-4 text-white" />
                          </div>
                          <span className="font-semibold text-gray-800">{config.workshopName}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <code className="text-xs bg-blue-50 px-2 py-1 rounded border border-blue-200 font-mono">
                          {config.clientId.substring(0, 12)}...
                        </code>
                      </TableCell>
                      <TableCell>
                        {config.isActive ? (
                          <Badge className="bg-green-500 text-white border-0">
                            <CheckCircle className="h-3 w-3 mr-1" />
                            Ativo
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="border-gray-300 text-gray-600">
                            <XCircle className="h-3 w-3 mr-1" />
                            Inativo
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        {config.tokenExpiresAt ? (
                          <Badge variant="outline" className={
                            new Date(config.tokenExpiresAt) > new Date()
                              ? 'border-green-200 text-green-700 bg-green-50'
                              : 'border-red-200 text-red-700 bg-red-50'
                          }>
                            {new Date(config.tokenExpiresAt).toLocaleDateString('pt-PT')}
                          </Badge>
                        ) : (
                          <span className="text-gray-400 text-sm">-</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {config.lastSync ? (
                          <span className="text-sm text-gray-600">
                            {new Date(config.lastSync).toLocaleDateString('pt-PT')}
                          </span>
                        ) : (
                          <span className="text-gray-400 text-sm">Nunca</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {config.companyId ? (
                          <code className="text-xs bg-green-50 px-2 py-1 rounded border border-green-200 font-mono text-green-700">
                            {config.companyId}
                          </code>
                        ) : (
                          <span className="text-gray-400 text-sm">-</span>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleTestConnection(config)}
                            className="border-blue-200 text-blue-700 hover:bg-blue-50"
                          >
                            <TestTube className="h-3 w-3" />
                          </Button>
                          {config.refreshToken && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleRefreshToken(config)}
                              className="border-green-200 text-green-700 hover:bg-green-50"
                            >
                              <RefreshCw className="h-3 w-3" />
                            </Button>
                          )}
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => openEditDialog(config)}
                            className="border-orange-200 text-orange-700 hover:bg-orange-50"
                          >
                            <Edit className="h-3 w-3" />
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => openDeleteDialog(config)}
                            className="border-red-200 text-red-700 hover:bg-red-50"
                          >
                            <Trash2 className="h-3 w-3" />
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

      {/* API Endpoints Reference */}
      <Card className="border-2 border-orange-100">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-orange-900">
            <FileText className="h-5 w-5" />
            Endpoints Principais Disponíveis
          </CardTitle>
          <CardDescription>
            Principais endpoints da API MOLONI utilizados no módulo de faturação
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="auth" className="w-full">
            <TabsList className="grid grid-cols-5 w-full">
              <TabsTrigger value="auth">Autenticação</TabsTrigger>
              <TabsTrigger value="companies">Empresas</TabsTrigger>
              <TabsTrigger value="customers">Clientes</TabsTrigger>
              <TabsTrigger value="documents">Documentos</TabsTrigger>
              <TabsTrigger value="products">Produtos</TabsTrigger>
            </TabsList>

            <TabsContent value="auth" className="space-y-3 mt-4">
              <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                <code className="text-sm font-mono text-gray-800">POST /grant</code>
                <p className="text-xs text-gray-600 mt-2">Obter access token (OAuth 2.0)</p>
              </div>
            </TabsContent>

            <TabsContent value="companies" className="space-y-3 mt-4">
              <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                <code className="text-sm font-mono text-gray-800">POST /companies/getAll</code>
                <p className="text-xs text-gray-600 mt-2">Listar todas as empresas</p>
              </div>
              <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                <code className="text-sm font-mono text-gray-800">POST /companies/getOne</code>
                <p className="text-xs text-gray-600 mt-2">Obter detalhes de uma empresa</p>
              </div>
            </TabsContent>

            <TabsContent value="customers" className="space-y-3 mt-4">
              <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                <code className="text-sm font-mono text-gray-800">POST /customers/getAll</code>
                <p className="text-xs text-gray-600 mt-2">Listar todos os clientes</p>
              </div>
              <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                <code className="text-sm font-mono text-gray-800">POST /customers/insert</code>
                <p className="text-xs text-gray-600 mt-2">Criar novo cliente</p>
              </div>
              <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                <code className="text-sm font-mono text-gray-800">POST /customers/update</code>
                <p className="text-xs text-gray-600 mt-2">Atualizar cliente existente</p>
              </div>
            </TabsContent>

            <TabsContent value="documents" className="space-y-3 mt-4">
              <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                <code className="text-sm font-mono text-gray-800">POST /invoices/getAll</code>
                <p className="text-xs text-gray-600 mt-2">Listar todas as faturas</p>
              </div>
              <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                <code className="text-sm font-mono text-gray-800">POST /invoices/insert</code>
                <p className="text-xs text-gray-600 mt-2">Criar nova fatura</p>
              </div>
              <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                <code className="text-sm font-mono text-gray-800">POST /invoices/getPDFLink</code>
                <p className="text-xs text-gray-600 mt-2">Obter PDF da fatura</p>
              </div>
              <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                <code className="text-sm font-mono text-gray-800">POST /estimates/insert</code>
                <p className="text-xs text-gray-600 mt-2">Criar orçamento/proforma</p>
              </div>
            </TabsContent>

            <TabsContent value="products" className="space-y-3 mt-4">
              <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                <code className="text-sm font-mono text-gray-800">POST /products/getAll</code>
                <p className="text-xs text-gray-600 mt-2">Listar todos os produtos/serviços</p>
              </div>
              <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                <code className="text-sm font-mono text-gray-800">POST /products/insert</code>
                <p className="text-xs text-gray-600 mt-2">Criar novo produto/serviço</p>
              </div>
              <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                <code className="text-sm font-mono text-gray-800">POST /taxes/getAll</code>
                <p className="text-xs text-gray-600 mt-2">Listar taxas de IVA</p>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Create Dialog */}
      <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="text-2xl bg-gradient-to-r from-blue-600 to-orange-600 bg-clip-text text-transparent">
              Nova Configuração MOLONI
            </DialogTitle>
            <DialogDescription>
              Configure a integração MOLONI para uma oficina
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="workshopId">
                Oficina <span className="text-red-500">*</span>
              </Label>
              <select
                id="workshopId"
                value={formData.workshopId}
                onChange={(e) => setFormData({...formData, workshopId: e.target.value})}
                className="w-full border-2 border-gray-200 rounded-lg px-3 py-2 focus:border-blue-500 focus:ring-blue-500"
              >
                <option value="">Selecione uma oficina</option>
                {workshops.map((workshop) => (
                  <option key={workshop.id} value={workshop.id}>
                    {workshop.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="clientId">
                Client ID <span className="text-red-500">*</span>
              </Label>
              <Input
                id="clientId"
                placeholder="Ex: your_client_id"
                value={formData.clientId}
                onChange={(e) => setFormData({...formData, clientId: e.target.value})}
                className="border-2 border-gray-200 focus:border-blue-500"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="clientSecret">
                Client Secret <span className="text-red-500">*</span>
              </Label>
              <div className="relative">
                <Input
                  id="clientSecret"
                  type={showClientSecret ? 'text' : 'password'}
                  placeholder="Ex: your_client_secret"
                  value={formData.clientSecret}
                  onChange={(e) => setFormData({...formData, clientSecret: e.target.value})}
                  className="border-2 border-gray-200 focus:border-blue-500 pr-10"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-0 top-0 h-full"
                  onClick={() => setShowClientSecret(!showClientSecret)}
                >
                  {showClientSecret ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </Button>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="username">
                  Username (opcional)
                </Label>
                <Input
                  id="username"
                  placeholder="Email MOLONI"
                  value={formData.username}
                  onChange={(e) => setFormData({...formData, username: e.target.value})}
                  className="border-2 border-gray-200 focus:border-blue-500"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">
                  Password (opcional)
                </Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Senha MOLONI"
                    value={formData.password}
                    onChange={(e) => setFormData({...formData, password: e.target.value})}
                    className="border-2 border-gray-200 focus:border-blue-500 pr-10"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </Button>
                </div>
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="isActive"
                checked={formData.isActive}
                onChange={(e) => setFormData({...formData, isActive: e.target.checked})}
                className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <Label htmlFor="isActive" className="cursor-pointer">
                Ativar configuração
              </Label>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setCreateDialogOpen(false)
                resetForm()
              }}
            >
              Cancelar
            </Button>
            <Button
              onClick={handleCreate}
              className="bg-gradient-to-r from-blue-600 to-orange-500 hover:from-blue-700 hover:to-orange-600 text-white"
            >
              Criar Configuração
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="text-2xl bg-gradient-to-r from-blue-600 to-orange-600 bg-clip-text text-transparent">
              Editar Configuração MOLONI
            </DialogTitle>
            <DialogDescription>
              Atualize as credenciais e configurações MOLONI
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="edit-workshopId">
                Oficina <span className="text-red-500">*</span>
              </Label>
              <select
                id="edit-workshopId"
                value={formData.workshopId}
                onChange={(e) => setFormData({...formData, workshopId: e.target.value})}
                className="w-full border-2 border-gray-200 rounded-lg px-3 py-2 focus:border-blue-500 focus:ring-blue-500"
              >
                <option value="">Selecione uma oficina</option>
                {workshops.map((workshop) => (
                  <option key={workshop.id} value={workshop.id}>
                    {workshop.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-clientId">
                Client ID <span className="text-red-500">*</span>
              </Label>
              <Input
                id="edit-clientId"
                placeholder="Ex: your_client_id"
                value={formData.clientId}
                onChange={(e) => setFormData({...formData, clientId: e.target.value})}
                className="border-2 border-gray-200 focus:border-blue-500"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-clientSecret">
                Client Secret <span className="text-red-500">*</span>
              </Label>
              <div className="relative">
                <Input
                  id="edit-clientSecret"
                  type={showClientSecret ? 'text' : 'password'}
                  placeholder="Ex: your_client_secret"
                  value={formData.clientSecret}
                  onChange={(e) => setFormData({...formData, clientSecret: e.target.value})}
                  className="border-2 border-gray-200 focus:border-blue-500 pr-10"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-0 top-0 h-full"
                  onClick={() => setShowClientSecret(!showClientSecret)}
                >
                  {showClientSecret ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </Button>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-username">
                  Username (opcional)
                </Label>
                <Input
                  id="edit-username"
                  placeholder="Email MOLONI"
                  value={formData.username}
                  onChange={(e) => setFormData({...formData, username: e.target.value})}
                  className="border-2 border-gray-200 focus:border-blue-500"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-password">
                  Password (opcional)
                </Label>
                <div className="relative">
                  <Input
                    id="edit-password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Senha MOLONI"
                    value={formData.password}
                    onChange={(e) => setFormData({...formData, password: e.target.value})}
                    className="border-2 border-gray-200 focus:border-blue-500 pr-10"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </Button>
                </div>
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="edit-isActive"
                checked={formData.isActive}
                onChange={(e) => setFormData({...formData, isActive: e.target.checked})}
                className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <Label htmlFor="edit-isActive" className="cursor-pointer">
                Ativar configuração
              </Label>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setEditDialogOpen(false)
                resetForm()
              }}
            >
              Cancelar
            </Button>
            <Button
              onClick={handleUpdate}
              className="bg-gradient-to-r from-blue-600 to-orange-500 hover:from-blue-700 hover:to-orange-600 text-white"
            >
              Guardar Alterações
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Eliminar Configuração MOLONI</AlertDialogTitle>
            <AlertDialogDescription>
              Tem a certeza que deseja eliminar a configuração MOLONI para <strong>{selectedConfig?.workshopName}</strong>?
              Esta ação não pode ser revertida e a integração deixará de funcionar para esta oficina.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Test Connection Dialog */}
      <Dialog open={testDialogOpen} onOpenChange={setTestDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="text-2xl bg-gradient-to-r from-blue-600 to-orange-600 bg-clip-text text-transparent">
              Teste de Conexão MOLONI
            </DialogTitle>
            <DialogDescription>
              Oficina: {selectedConfig?.workshopName}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            {testLoading ? (
              <div className="text-center py-12">
                <div className="inline-block h-12 w-12 rounded-xl bg-gradient-to-br from-blue-600 to-orange-500 animate-pulse mb-4"></div>
                <p className="text-gray-600">A testar conexão...</p>
              </div>
            ) : testResults ? (
              <div className="space-y-4">
                {testResults.success ? (
                  <div className="bg-green-50 border-2 border-green-200 rounded-lg p-4">
                    <div className="flex items-center gap-2 mb-3">
                      <CheckCircle className="h-6 w-6 text-green-600" />
                      <h3 className="font-bold text-green-900">Conexão Bem-Sucedida!</h3>
                    </div>
                    {testResults.companies && testResults.companies.length > 0 && (
                      <div className="space-y-2">
                        <p className="text-sm text-green-800">
                          <strong>Empresas encontradas:</strong>
                        </p>
                        {testResults.companies.map((company: any) => (
                          <div key={company.company_id} className="bg-white p-3 rounded border border-green-200">
                            <p className="font-semibold text-gray-800">{company.name}</p>
                            <p className="text-sm text-gray-600">NIF: {company.vat}</p>
                            <p className="text-xs text-gray-500">ID: {company.company_id}</p>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="bg-red-50 border-2 border-red-200 rounded-lg p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <XCircle className="h-6 w-6 text-red-600" />
                      <h3 className="font-bold text-red-900">Erro na Conexão</h3>
                    </div>
                    <p className="text-sm text-red-800">{testResults.error}</p>
                  </div>
                )}
              </div>
            ) : null}
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setTestDialogOpen(false)
                setTestResults(null)
              }}
            >
              Fechar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
