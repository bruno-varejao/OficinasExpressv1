import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from './ui/card'
import { Button } from './ui/button'
import { Input } from './ui/input'
import { Label } from './ui/label'
import { Textarea } from './ui/textarea'
import { Badge } from './ui/badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from './ui/dialog'
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs'
import { toast } from 'sonner@2.0.3'
import { projectId, publicAnonKey } from '../utils/supabase/info'
import {
  FileText,
  CheckCircle,
  XCircle,
  Edit,
  Clock,
  Car,
  User,
  Phone,
  Mail,
  MessageSquare,
  Euro,
  AlertCircle,
  RefreshCw,
  Star,
  Calendar,
  UserPlus,
  CarFront,
  Database
} from 'lucide-react'

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
  isChosenByClient?: boolean
  clientChosenAt?: string
  workshopResponse?: {
    price: number
    duration: number
    notes?: string
    respondedAt: string
    respondedBy: string
  }
}

interface WorkshopQuoteRequestsModuleProps {
  accessToken: string
}

// Helper component for checking and importing client/vehicle
function ClientVehicleImportCheck({ request, accessToken }: { request: WorkshopRequest, accessToken: string }) {
  const [checking, setChecking] = useState(false)
  const [importing, setImporting] = useState(false)
  const [clientExists, setClientExists] = useState<boolean | null>(null)
  const [vehicleExists, setVehicleExists] = useState<boolean | null>(null)
  
  useEffect(() => {
    checkExistence()
  }, [request.id])
  
  const checkExistence = async () => {
    setChecking(true)
    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-6971b43c/workshop/check-client-vehicle-existence`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${accessToken}`
          },
          body: JSON.stringify({
            email: request.clientEmail,
            licensePlate: request.licensePlate
          })
        }
      )
      
      if (response.ok) {
        const data = await response.json()
        setClientExists(data.clientExists)
        setVehicleExists(data.vehicleExists)
      }
    } catch (error) {
      console.error('Error checking existence:', error)
    } finally {
      setChecking(false)
    }
  }
  
  const handleImport = async () => {
    setImporting(true)
    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-6971b43c/workshop/import-client-vehicle`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${accessToken}`
          },
          body: JSON.stringify({
            clientName: request.clientName,
            clientEmail: request.clientEmail,
            clientPhone: request.clientPhone,
            licensePlate: request.licensePlate
          })
        }
      )
      
      if (response.ok) {
        const data = await response.json()
        toast.success(data.message || 'Importação concluída com sucesso!')
        // Recheck existence
        await checkExistence()
      } else {
        throw new Error('Erro ao importar')
      }
    } catch (error: any) {
      console.error('Error importing:', error)
      toast.error('Erro ao importar dados')
    } finally {
      setImporting(false)
    }
  }
  
  if (checking) {
    return (
      <div className="p-2 bg-gray-50 rounded border border-gray-200 flex items-center gap-2 text-xs text-gray-500">
        <RefreshCw className="h-3 w-3 animate-spin" />
        <span>A verificar...</span>
      </div>
    )
  }
  
  const bothExist = clientExists && vehicleExists
  const noneExist = clientExists === false && vehicleExists === false
  
  return (
    <div className="space-y-2">
      {/* Status Badges */}
      <div className="flex flex-wrap gap-2">
        {clientExists === true && (
          <Badge variant="secondary" className="bg-green-100 text-green-800 text-xs">
            <Database className="h-3 w-3 mr-1" />
            Cliente já Existente
          </Badge>
        )}
        {vehicleExists === true && (
          <Badge variant="secondary" className="bg-green-100 text-green-800 text-xs">
            <CarFront className="h-3 w-3 mr-1" />
            Veículo já Existente
          </Badge>
        )}
      </div>
      
      {/* Import Button - Only show if at least one doesn't exist */}
      {!bothExist && (clientExists === false || vehicleExists === false) && (
        <Button
          size="sm"
          variant="outline"
          onClick={handleImport}
          disabled={importing}
          className="w-full border-blue-300 text-blue-700 hover:bg-blue-50"
        >
          {importing ? (
            <>
              <RefreshCw className="h-3 w-3 mr-2 animate-spin" />
              A importar...
            </>
          ) : (
            <>
              <UserPlus className="h-3 w-3 mr-2" />
              Importar para Base de Dados
              {clientExists === false && vehicleExists === false && ' (Cliente + Veículo)'}
              {clientExists === true && vehicleExists === false && ' (Veículo)'}
              {clientExists === false && vehicleExists === true && ' (Cliente)'}
            </>
          )}
        </Button>
      )}
    </div>
  )
}

export function WorkshopQuoteRequestsModule({ accessToken }: WorkshopQuoteRequestsModuleProps) {
  const [loading, setLoading] = useState(false)
  const [requests, setRequests] = useState<WorkshopRequest[]>([])
  const [selectedRequest, setSelectedRequest] = useState<WorkshopRequest | null>(null)
  const [showResponseDialog, setShowResponseDialog] = useState(false)
  const [activeTab, setActiveTab] = useState('pending')
  const [checkingExistence, setCheckingExistence] = useState<string | null>(null)
  const [existingData, setExistingData] = useState<{[key: string]: {clientExists: boolean, vehicleExists: boolean}}>({})
  const [responseData, setResponseData] = useState({
    action: 'validated' as 'validated' | 'modified' | 'rejected',
    price: 0,
    duration: 60,
    notes: ''
  })

  useEffect(() => {
    loadAllRequests()
  }, [])

  const loadAllRequests = async () => {
    setLoading(true)
    try {
      console.log('📥 Loading ALL quote requests...')
      
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-6971b43c/workshop-requests/all`,
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
      setRequests(data.requests || [])
      
      console.log(`✅ Loaded ${data.requests?.length || 0} total requests`)
      console.log('   Summary:', data.summary)
      
      if (data.summary?.chosenByClient > 0) {
        toast.success(`${data.summary.chosenByClient} pedido(s) escolhido(s) pelo cliente!`, {
          duration: 5000
        })
      }

      // Check existence for chosen requests
      const chosenReqs = (data.requests || []).filter((r: WorkshopRequest) => r.isChosenByClient)
      for (const req of chosenReqs) {
        await checkClientAndVehicleExistence(req.id, req.clientEmail, req.licensePlate)
      }
    } catch (error: any) {
      console.error('Error loading requests:', error)
      toast.error('Erro ao carregar pedidos de orçamento')
    } finally {
      setLoading(false)
    }
  }

  const checkClientAndVehicleExistence = async (requestId: string, email: string, licensePlate: string) => {
    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-6971b43c/workshop/check-client-vehicle-existence`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${accessToken}`
          },
          body: JSON.stringify({ email, licensePlate })
        }
      )

      if (response.ok) {
        const data = await response.json()
        setExistingData(prev => ({
          ...prev,
          [requestId]: {
            clientExists: data.clientExists,
            vehicleExists: data.vehicleExists
          }
        }))
      }
    } catch (error) {
      console.error('Error checking existence:', error)
    }
  }

  const handleImportClientAndVehicle = async (request: WorkshopRequest) => {
    setCheckingExistence(request.id)
    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-6971b43c/workshop/import-client-vehicle`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${accessToken}`
          },
          body: JSON.stringify({
            clientName: request.clientName,
            clientEmail: request.clientEmail,
            clientPhone: request.clientPhone,
            licensePlate: request.licensePlate
          })
        }
      )

      const data = await response.json()

      if (response.ok) {
        toast.success('Cliente e veículo importados com sucesso!')
        // Refresh existence check
        await checkClientAndVehicleExistence(request.id, request.clientEmail, request.licensePlate)
      } else {
        toast.error(data.error || 'Erro ao importar')
      }
    } catch (error) {
      console.error('Error importing:', error)
      toast.error('Erro ao importar cliente e veículo')
    } finally {
      setCheckingExistence(null)
    }
  }
  
  // Filter requests by category
  const pendingRequests = requests.filter(r => r.status === 'pending')
  const respondedRequests = requests.filter(r => r.status === 'validated' || r.status === 'modified')
  const chosenRequests = requests.filter(r => r.isChosenByClient)
  const rejectedRequests = requests.filter(r => r.status === 'rejected')

  const handleOpenResponse = (request: WorkshopRequest) => {
    setSelectedRequest(request)
    
    // Pre-fill with estimated values if available
    setResponseData({
      action: 'validated',
      price: 0,
      duration: 60,
      notes: ''
    })
    
    setShowResponseDialog(true)
  }

  const handleSubmitResponse = async () => {
    if (!selectedRequest) return

    if (responseData.action !== 'rejected' && (!responseData.price || responseData.price <= 0)) {
      toast.error('Por favor, insira um preço válido')
      return
    }

    setLoading(true)
    try {
      console.log('📤 Submitting response for request:', selectedRequest.id)
      
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-6971b43c/workshop-requests/${selectedRequest.id}/respond`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${accessToken}`
          },
          body: JSON.stringify(responseData)
        }
      )

      if (!response.ok) {
        throw new Error('Erro ao enviar resposta')
      }

      const data = await response.json()
      console.log('✅ Response submitted successfully:', data)
      
      toast.success('Resposta enviada ao cliente!')
      setShowResponseDialog(false)
      setSelectedRequest(null)
      
      // Reload requests
      await loadAllRequests()
      
    } catch (error: any) {
      console.error('Error submitting response:', error)
      toast.error('Erro ao enviar resposta')
    } finally {
      setLoading(false)
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">
          <Clock className="h-3 w-3 mr-1" />
          Pendente
        </Badge>
      case 'validated':
        return <Badge variant="default" className="bg-green-100 text-green-800">
          <CheckCircle className="h-3 w-3 mr-1" />
          Validado
        </Badge>
      case 'modified':
        return <Badge variant="default" className="bg-blue-100 text-blue-800">
          <Edit className="h-3 w-3 mr-1" />
          Modificado
        </Badge>
      case 'rejected':
        return <Badge variant="destructive">
          <XCircle className="h-3 w-3 mr-1" />
          Rejeitado
        </Badge>
      default:
        return <Badge variant="secondary">{status}</Badge>
    }
  }

  const renderRequestCard = (request: WorkshopRequest) => (
    <Card key={request.id} className="hover:shadow-lg transition-all border-2 border-gray-200">
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              {getStatusBadge(request.status)}
              <span className="text-xs text-gray-500">
                {new Date(request.createdAt).toLocaleDateString('pt-PT', {
                  day: 'numeric',
                  month: 'short',
                  hour: '2-digit',
                  minute: '2-digit'
                })}
              </span>
            </div>
            <CardTitle className="text-lg text-gray-900">
              {request.serviceName}
            </CardTitle>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Vehicle Info */}
        <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
          <div className="h-10 w-10 rounded-lg bg-blue-600 flex items-center justify-center">
            <Car className="h-5 w-5 text-white" />
          </div>
          <div>
            <p className="text-xs text-gray-500">Matrícula</p>
            <p className="font-bold text-gray-900">{request.licensePlate}</p>
          </div>
        </div>

        {/* Client Info - Only show if chosen by client */}
        {request.isChosenByClient ? (
          <div className="space-y-3">
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm">
                <User className="h-4 w-4 text-gray-400" />
                <span className="text-gray-700">{request.clientName}</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <Phone className="h-4 w-4 text-gray-400" />
                <a href={`tel:${request.clientPhone}`} className="text-blue-600 hover:underline">
                  {request.clientPhone}
                </a>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <Mail className="h-4 w-4 text-gray-400" />
                <a href={`mailto:${request.clientEmail}`} className="text-blue-600 hover:underline">
                  {request.clientEmail}
                </a>
              </div>
            </div>
            
            {/* Import Check & Button */}
            <ClientVehicleImportCheck 
              request={request}
              accessToken={accessToken}
            />
          </div>
        ) : (
          <div className="p-3 bg-gray-100 rounded-lg border border-gray-200">
            <div className="flex items-center gap-2 text-sm text-gray-500">
              <AlertCircle className="h-4 w-4" />
              <span>Dados do cliente ocultos por privacidade</span>
            </div>
          </div>
        )}

        {/* Notes */}
        {request.notes && (
          <div className="p-3 bg-orange-50 rounded-lg border border-orange-200">
            <div className="flex items-start gap-2">
              <MessageSquare className="h-4 w-4 text-orange-600 mt-0.5" />
              <div className="flex-1">
                <p className="text-xs text-orange-800 font-semibold mb-1">
                  Notas do Cliente
                </p>
                <p className="text-sm text-gray-700">{request.notes}</p>
              </div>
            </div>
          </div>
        )}

        {/* Workshop Response */}
        {request.workshopResponse && (
          <div className="p-3 bg-green-50 rounded-lg border border-green-200">
            <p className="text-xs text-green-800 font-semibold mb-2">
              Sua Resposta
            </p>
            <div className="space-y-1 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Preço:</span>
                <span className="font-bold text-gray-900">
                  €{request.workshopResponse.price.toFixed(2)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Duração:</span>
                <span className="font-bold text-gray-900">
                  {request.workshopResponse.duration} min
                </span>
              </div>
              {request.workshopResponse.notes && (
                <p className="text-gray-700 mt-2 pt-2 border-t border-green-200">
                  {request.workshopResponse.notes}
                </p>
              )}
            </div>
          </div>
        )}

        {/* Action Button */}
        {request.status === 'pending' && (
          <Button
            onClick={() => handleOpenResponse(request)}
            className="w-full bg-gradient-to-r from-blue-600 to-orange-500"
          >
            <Edit className="h-4 w-4 mr-2" />
            Responder ao Pedido
          </Button>
        )}
      </CardContent>
    </Card>
  )

  // Filter requests by status and chosen state
  const pendingRequests = requests.filter(r => r.status === 'pending')
  const chosenRequests = requests.filter(r => r.isChosenByClient === true)
  const respondedRequests = requests.filter(r => 
    (r.status === 'validated' || r.status === 'modified') && !r.isChosenByClient
  )
  const rejectedRequests = requests.filter(r => r.status === 'rejected')

  return (
    <div className="space-y-6 p-4" style={{ margin: '10px' }}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-black bg-gradient-to-r from-blue-600 to-orange-600 bg-clip-text text-transparent">
            Pedidos de Orçamento
          </h1>
          <p className="text-gray-500 mt-1">
            Gestão de pedidos de orçamento instantâneo
          </p>
        </div>
        <div className="flex gap-3">
          {chosenRequests.length > 0 && (
            <Badge className="text-sm bg-green-600">
              <Star className="h-4 w-4 mr-2" />
              {chosenRequests.length} escolhido(s)
            </Badge>
          )}
          <Badge variant="secondary" className="text-sm">
            <FileText className="h-4 w-4 mr-2" />
            {requests.length} total
          </Badge>
          <Button
            variant="outline"
            size="sm"
            onClick={loadAllRequests}
            disabled={loading}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Atualizar
          </Button>
        </div>
      </div>

      {/* Info Card */}
      <Card className="bg-gradient-to-br from-blue-50 to-orange-50 border-2 border-blue-200">
        <CardContent className="pt-6">
          <div className="flex items-start gap-4">
            <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-blue-600 to-orange-500 flex items-center justify-center flex-shrink-0 shadow-lg">
              <AlertCircle className="h-6 w-6 text-white" />
            </div>
            <div className="flex-1">
              <h3 className="font-bold text-lg text-gray-900 mb-2">
                Como funciona?
              </h3>
              <div className="text-sm text-gray-600 space-y-1">
                <p>• Clientes solicitam orçamentos através do portal público</p>
                <p>• Pode <strong>validar</strong> o orçamento estimado, <strong>modificar</strong> com novos valores, ou <strong>rejeitar</strong></p>
                <p>• Dados do cliente só ficam visíveis quando ele escolher a sua oficina (privacidade)</p>
                <p>• Quando escolhido, pode importar cliente e veículo para a sua base de dados</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tabs for organizing requests */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-4 mb-6">
          <TabsTrigger value="pending" className="relative">
            Pendentes
            {pendingRequests.length > 0 && (
              <Badge className="ml-2 bg-yellow-500 text-xs px-1.5 py-0">
                {pendingRequests.length}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="chosen" className="relative">
            Escolhidos
            {chosenRequests.length > 0 && (
              <Badge className="ml-2 bg-green-500 text-xs px-1.5 py-0">
                {chosenRequests.length}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="responded">
            Respondidos
            {respondedRequests.length > 0 && (
              <Badge variant="secondary" className="ml-2 text-xs px-1.5 py-0">
                {respondedRequests.length}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="rejected">
            Rejeitados
            {rejectedRequests.length > 0 && (
              <Badge variant="secondary" className="ml-2 text-xs px-1.5 py-0">
                {rejectedRequests.length}
              </Badge>
            )}
          </TabsTrigger>
        </TabsList>

        {loading ? (
          <Card>
            <CardContent className="py-12 text-center">
              <div className="animate-spin h-8 w-8 border-4 border-blue-600 border-t-transparent rounded-full mx-auto mb-4"></div>
              <p className="text-gray-500">A carregar pedidos...</p>
            </CardContent>
          </Card>
        ) : (
          <>
            {/* PENDING TAB */}
            <TabsContent value="pending">
              {pendingRequests.length === 0 ? (
                <Card>
                  <CardContent className="py-12 text-center">
                    <Clock className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                    <h3 className="font-semibold text-gray-900 mb-2">
                      Nenhum pedido pendente
                    </h3>
                    <p className="text-sm text-gray-500">
                      Não há pedidos aguardando resposta
                    </p>
                  </CardContent>
                </Card>
              ) : (
                <div className="grid lg:grid-cols-2 gap-6">
                  {pendingRequests.map((request) => renderRequestCard(request))}
                </div>
              )}
            </TabsContent>

            {/* CHOSEN BY CLIENT TAB */}
            <TabsContent value="chosen">
              {chosenRequests.length === 0 ? (
                <Card>
                  <CardContent className="py-12 text-center">
                    <Star className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                    <h3 className="font-semibold text-gray-900 mb-2">
                      Nenhum pedido escolhido
                    </h3>
                    <p className="text-sm text-gray-500">
                      Ainda não foi escolhido por nenhum cliente
                    </p>
                  </CardContent>
                </Card>
              ) : (
                <div className="grid lg:grid-cols-2 gap-6">
                  {chosenRequests.map((request) => (
                    <Card key={request.id} className="hover:shadow-lg transition-all border-2 border-green-500 bg-green-50">
                      <CardHeader>
                        <Badge className="bg-green-600 w-fit">
                          <Star className="h-3 w-3 mr-1" />
                          Escolhido pelo Cliente
                        </Badge>
                        <CardTitle className="text-lg mt-2">{request.serviceName}</CardTitle>
                        <span className="text-xs text-gray-500">
                          Escolhido em {new Date(request.clientChosenAt!).toLocaleDateString('pt-PT', {
                            day: 'numeric',
                            month: 'short',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </span>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        {/* Vehicle Info */}
                        <div className="flex items-center gap-3 p-3 bg-white rounded-lg">
                          <div className="h-10 w-10 rounded-lg bg-green-600 flex items-center justify-center">
                            <Car className="h-5 w-5 text-white" />
                          </div>
                          <div>
                            <p className="text-xs text-gray-500">Matrícula</p>
                            <p className="font-bold text-gray-900">{request.licensePlate}</p>
                          </div>
                        </div>

                        {/* Client Info */}
                        <div className="space-y-2 p-3 bg-white rounded-lg">
                          <div className="flex items-center gap-2 text-sm">
                            <User className="h-4 w-4 text-gray-400" />
                            <span className="text-gray-700">{request.clientName}</span>
                          </div>
                          <div className="flex items-center gap-2 text-sm">
                            <Phone className="h-4 w-4 text-gray-400" />
                            <a href={`tel:${request.clientPhone}`} className="text-blue-600 hover:underline">
                              {request.clientPhone}
                            </a>
                          </div>
                          <div className="flex items-center gap-2 text-sm">
                            <Mail className="h-4 w-4 text-gray-400" />
                            <a href={`mailto:${request.clientEmail}`} className="text-blue-600 hover:underline">
                              {request.clientEmail}
                            </a>
                          </div>
                        </div>

                        {/* Workshop Response */}
                        {request.workshopResponse && (
                          <div className="p-3 bg-white rounded border border-green-300">
                            <p className="text-xs text-green-800 font-semibold mb-2">
                              Orçamento Aprovado
                            </p>
                            <div className="space-y-1 text-sm">
                              <div className="flex justify-between">
                                <span className="text-gray-600">Preço:</span>
                                <span className="font-bold text-gray-900">
                                  €{request.workshopResponse.price.toFixed(2)}
                                </span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-gray-600">Duração:</span>
                                <span className="font-bold text-gray-900">
                                  {request.workshopResponse.duration} min
                                </span>
                              </div>
                            </div>
                          </div>
                        )}

                        {/* Database Check */}
                        {existingData[request.id] && (
                          <div className="space-y-2">
                            {existingData[request.id].clientExists && (
                              <Badge variant="secondary" className="w-full justify-center bg-blue-100 text-blue-800">
                                <Database className="h-3 w-3 mr-1" />
                                Cliente já existe na base de dados
                              </Badge>
                            )}
                            {existingData[request.id].vehicleExists && (
                              <Badge variant="secondary" className="w-full justify-center bg-blue-100 text-blue-800">
                                <Database className="h-3 w-3 mr-1" />
                                Veículo já existe na base de dados
                              </Badge>
                            )}
                            {(!existingData[request.id].clientExists || !existingData[request.id].vehicleExists) && (
                              <Button
                                onClick={() => handleImportClientAndVehicle(request)}
                                disabled={checkingExistence === request.id}
                                variant="outline"
                                className="w-full"
                              >
                                {checkingExistence === request.id ? (
                                  <>
                                    <div className="animate-spin h-4 w-4 border-2 border-blue-600 border-t-transparent rounded-full mr-2"></div>
                                    A importar...
                                  </>
                                ) : (
                                  <>
                                    <UserPlus className="h-4 w-4 mr-2" />
                                    Importar para Base de Dados
                                  </>
                                )}
                              </Button>
                            )}
                          </div>
                        )}

                        {/* Action to contact client */}
                        <div className="p-4 bg-gradient-to-r from-green-600 to-green-500 text-white rounded-lg">
                          <div className="flex items-start gap-3">
                            <Calendar className="h-5 w-5 mt-0.5" />
                            <div>
                              <p className="font-semibold mb-1">Próximo Passo</p>
                              <p className="text-sm text-green-100">
                                Entre em contacto com o cliente para agendar o serviço
                              </p>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>

            {/* RESPONDED TAB */}
            <TabsContent value="responded">
              {respondedRequests.length === 0 ? (
                <Card>
                  <CardContent className="py-12 text-center">
                    <CheckCircle className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                    <h3 className="font-semibold text-gray-900 mb-2">Nenhum pedido respondido</h3>
                    <p className="text-sm text-gray-500">Não há pedidos com resposta enviada</p>
                  </CardContent>
                </Card>
              ) : (
                <div className="grid lg:grid-cols-2 gap-6">
                  {respondedRequests.map((request) => (
                    <Card key={request.id} className="border-2 border-blue-200">
                      <CardHeader>
                        <div className="flex items-center gap-2">
                          {getStatusBadge(request.status)}
                          <span className="text-xs text-gray-500">
                            {new Date(request.workshopResponse!.respondedAt).toLocaleDateString('pt-PT', {
                              day: 'numeric',
                              month: 'short',
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </span>
                        </div>
                        <CardTitle className="text-lg mt-2">{request.serviceName}</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                          <Car className="h-5 w-5 text-blue-600" />
                          <span className="font-bold">{request.licensePlate}</span>
                        </div>
                        {request.workshopResponse && (
                          <div className="p-3 bg-blue-50 rounded border border-blue-200">
                            <p className="text-xs text-blue-800 font-semibold mb-2">Sua Resposta</p>
                            <div className="space-y-1 text-sm">
                              <div className="flex justify-between">
                                <span className="text-gray-600">Preço:</span>
                                <span className="font-bold text-gray-900">€{request.workshopResponse.price.toFixed(2)}</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-gray-600">Duração:</span>
                                <span className="font-bold text-gray-900">{request.workshopResponse.duration} min</span>
                              </div>
                            </div>
                          </div>
                        )}
                        <p className="text-xs text-gray-500 text-center">Aguardando escolha do cliente</p>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>

            {/* REJECTED TAB */}
            <TabsContent value="rejected">
              {rejectedRequests.length === 0 ? (
                <Card>
                  <CardContent className="py-12 text-center">
                    <XCircle className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                    <h3 className="font-semibold text-gray-900 mb-2">Nenhum pedido rejeitado</h3>
                  </CardContent>
                </Card>
              ) : (
                <div className="grid lg:grid-cols-2 gap-6">
                  {rejectedRequests.map((request) => (
                    <Card key={request.id} className="border-2 border-red-200 opacity-75">
                      <CardHeader>
                        {getStatusBadge(request.status)}
                        <CardTitle className="text-lg mt-2 text-gray-500">{request.serviceName}</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="flex items-center gap-2 text-sm text-gray-500 mb-2">
                          <Car className="h-4 w-4" />
                          {request.licensePlate}
                        </div>
                        {request.workshopResponse?.notes && (
                          <div className="p-2 bg-red-50 rounded border border-red-200 text-sm">
                            <p className="text-xs text-red-800 font-semibold mb-1">Motivo:</p>
                            <p className="text-gray-600">{request.workshopResponse.notes}</p>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>
          </>
        )}
      </Tabs>

      {/* Response Dialog */}
      <Dialog open={showResponseDialog} onOpenChange={setShowResponseDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Responder ao Pedido de Orçamento</DialogTitle>
          </DialogHeader>

          {selectedRequest && (
            <div className="space-y-4">
              {/* Request Summary */}
              <Card className="bg-gray-50">
                <CardContent className="pt-4 space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Matrícula:</span>
                    <span className="font-semibold">{selectedRequest.licensePlate}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Serviço:</span>
                    <span className="font-semibold">{selectedRequest.serviceName}</span>
                  </div>
                  <div className="p-2 bg-yellow-50 rounded border border-yellow-200 mt-2">
                    <p className="text-xs text-yellow-800">
                      <AlertCircle className="h-3 w-3 inline mr-1" />
                      Dados do cliente ficarão visíveis apenas se ele escolher a sua oficina
                    </p>
                  </div>
                </CardContent>
              </Card>

              {/* Response Action */}
              <div className="space-y-2">
                <Label>Ação</Label>
                <div className="grid grid-cols-3 gap-3">
                  <Button
                    type="button"
                    variant={responseData.action === 'validated' ? 'default' : 'outline'}
                    onClick={() => setResponseData({ ...responseData, action: 'validated' })}
                    className={responseData.action === 'validated' ? 'bg-green-600' : ''}
                  >
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Validar
                  </Button>
                  <Button
                    type="button"
                    variant={responseData.action === 'modified' ? 'default' : 'outline'}
                    onClick={() => setResponseData({ ...responseData, action: 'modified' })}
                    className={responseData.action === 'modified' ? 'bg-blue-600' : ''}
                  >
                    <Edit className="h-4 w-4 mr-2" />
                    Modificar
                  </Button>
                  <Button
                    type="button"
                    variant={responseData.action === 'rejected' ? 'destructive' : 'outline'}
                    onClick={() => setResponseData({ ...responseData, action: 'rejected' })}
                  >
                    <XCircle className="h-4 w-4 mr-2" />
                    Rejeitar
                  </Button>
                </div>
              </div>

              {/* Price and Duration (if not rejected) */}
              {responseData.action !== 'rejected' && (
                <>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="price">Preço Final (€) *</Label>
                      <div className="relative">
                        <Euro className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                        <Input
                          id="price"
                          type="number"
                          min="0"
                          step="0.01"
                          placeholder="0.00"
                          value={responseData.price || ''}
                          onChange={(e) => setResponseData({
                            ...responseData,
                            price: parseFloat(e.target.value) || 0
                          })}
                          className="pl-10"
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="duration">Duração (minutos) *</Label>
                      <div className="relative">
                        <Clock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                        <Input
                          id="duration"
                          type="number"
                          min="15"
                          step="15"
                          placeholder="60"
                          value={responseData.duration || ''}
                          onChange={(e) => setResponseData({
                            ...responseData,
                            duration: parseInt(e.target.value) || 60
                          })}
                          className="pl-10"
                        />
                      </div>
                    </div>
                  </div>
                </>
              )}

              {/* Notes */}
              <div className="space-y-2">
                <Label htmlFor="notes">
                  Notas Adicionais {responseData.action === 'rejected' && '(Motivo da Rejeição)'}
                </Label>
                <Textarea
                  id="notes"
                  placeholder={
                    responseData.action === 'rejected'
                      ? 'Explique o motivo da rejeição...'
                      : 'Informações adicionais para o cliente...'
                  }
                  value={responseData.notes}
                  onChange={(e) => setResponseData({
                    ...responseData,
                    notes: e.target.value
                  })}
                  rows={4}
                />
              </div>
            </div>
          )}

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowResponseDialog(false)}
              disabled={loading}
            >
              Cancelar
            </Button>
            <Button
              onClick={handleSubmitResponse}
              disabled={loading}
              className="bg-gradient-to-r from-blue-600 to-orange-500"
            >
              {loading ? (
                <>
                  <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full mr-2"></div>
                  A enviar...
                </>
              ) : (
                <>
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Enviar Resposta
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
