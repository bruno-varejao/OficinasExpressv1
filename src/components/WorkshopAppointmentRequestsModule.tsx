import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from './ui/card'
import { Button } from './ui/button'
import { Input } from './ui/input'
import { Label } from './ui/label'
import { Textarea } from './ui/textarea'
import { Badge } from './ui/badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from './ui/dialog'
import { Calendar } from './ui/calendar'
import { Popover, PopoverContent, PopoverTrigger } from './ui/popover'
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs'
import { toast } from 'sonner@2.0.3'
import { projectId } from '../utils/supabase/info'
import {
  Calendar as CalendarIcon,
  Clock,
  Car,
  User,
  Phone,
  Mail,
  MessageSquare,
  CheckCircle,
  XCircle,
  RefreshCw,
  AlertCircle,
  CalendarCheck,
  CalendarX
} from 'lucide-react'

interface AppointmentRequest {
  id: string
  quoteRequestId: string
  workshopId: string
  clientName: string
  clientEmail: string
  clientPhone: string
  licensePlate: string
  serviceName: string
  serviceId: string
  preferredDate: string
  preferredTime: string
  notes?: string
  status: 'pending_confirmation' | 'confirmed' | 'rescheduled' | 'rejected' | 'pending_reschedule'
  confirmedDate?: string
  confirmedTime?: string
  responseNotes?: string
  rescheduleRequest?: {
    requestedDate: string
    requestedTime: string
    notes?: string
    requestedAt: string
  }
  createdAt: string
  respondedAt?: string
  respondedBy?: string
}

interface WorkshopAppointmentRequestsModuleProps {
  accessToken: string
  initialTab?: string
}

export function WorkshopAppointmentRequestsModule({ accessToken, initialTab }: WorkshopAppointmentRequestsModuleProps) {
  const [loading, setLoading] = useState(false)
  const [appointments, setAppointments] = useState<AppointmentRequest[]>([])
  const [selectedAppointment, setSelectedAppointment] = useState<AppointmentRequest | null>(null)
  const [showResponseDialog, setShowResponseDialog] = useState(false)
  const [activeTab, setActiveTab] = useState(initialTab || 'pending')
  const [responseAction, setResponseAction] = useState<'confirm' | 'reschedule' | 'reject'>('confirm')
  const [selectedDate, setSelectedDate] = useState<Date>()
  const [selectedTime, setSelectedTime] = useState('')
  const [responseNotes, setResponseNotes] = useState('')
  const [vehicleDataCache, setVehicleDataCache] = useState<Record<string, any>>({})
  const [loadingVehicleData, setLoadingVehicleData] = useState<Record<string, boolean>>({})

  // Update activeTab when initialTab prop changes
  useEffect(() => {
    if (initialTab) {
      setActiveTab(initialTab)
    }
  }, [initialTab])

  useEffect(() => {
    loadAppointments()
  }, [])

  const loadAppointments = async () => {
    setLoading(true)
    try {
      console.log('📅 WORKSHOP: Loading appointment requests...')
      
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-6971b43c/workshop/appointment-requests`,
        {
          headers: {
            'Authorization': `Bearer ${accessToken}`
          }
        }
      )

      console.log('📡 WORKSHOP: Response status:', response.status)

      if (!response.ok) {
        const errorData = await response.json()
        console.error('❌ WORKSHOP: Error response:', errorData)
        throw new Error('Erro ao carregar pedidos')
      }

      const data = await response.json()
      console.log('✅ WORKSHOP: Loaded appointments:', data.appointments?.length || 0)
      if (data.appointments && data.appointments.length > 0) {
        console.log('📋 WORKSHOP: First appointment:', data.appointments[0])
      }
      setAppointments(data.appointments || [])
    } catch (error: any) {
      console.error('❌ WORKSHOP: Error loading appointments:', error)
      toast.error('Erro ao carregar pedidos de agendamento')
    } finally {
      setLoading(false)
    }
  }
  
  const loadVehicleData = async (licensePlate: string) => {
    if (vehicleDataCache[licensePlate]) {
      return vehicleDataCache[licensePlate]
    }
    
    if (loadingVehicleData[licensePlate]) {
      return null
    }
    
    setLoadingVehicleData(prev => ({ ...prev, [licensePlate]: true }))
    
    try {
      // Send plate as-is, backend will format it correctly
      const plateParam = encodeURIComponent(licensePlate.trim())
      console.log(`🚗 Loading vehicle data for plate: ${licensePlate}`)
      
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-6971b43c/infomatricula/search?plate=${plateParam}`,
        {
          headers: {
            'Authorization': `Bearer ${accessToken}`
          }
        }
      )
      
      if (response.ok) {
        const data = await response.json()
        console.log('✅ Vehicle data retrieved:', data)
        
        // Check if data has actual vehicle information (not just error message)
        if (data.make && data.model) {
          setVehicleDataCache(prev => ({ ...prev, [licensePlate]: data }))
          return data
        } else {
          console.log('⚠️ Vehicle data not available from InfoMatricula')
          return null
        }
      } else {
        const errorData = await response.json()
        console.log('⚠️ Vehicle data not available:', errorData.message || errorData.error)
        return null
      }
    } catch (error) {
      console.error('❌ Error loading vehicle data:', error)
      return null
    } finally {
      setLoadingVehicleData(prev => ({ ...prev, [licensePlate]: false }))
    }
  }
  
  // Auto-load vehicle data when appointments are loaded
  useEffect(() => {
    appointments.forEach(appointment => {
      if (appointment.licensePlate && !vehicleDataCache[appointment.licensePlate]) {
        loadVehicleData(appointment.licensePlate)
      }
    })
  }, [appointments])
  
  const debugData = async () => {
    console.log('🐛 ==================== DEBUG START ====================')
    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-6971b43c/debug/workshop-appointments`,
        {
          headers: {
            'Authorization': `Bearer ${accessToken}`
          }
        }
      )
      
      if (response.ok) {
        const data = await response.json()
        console.log('🔍 DEBUG DATA:', data)
      } else {
        console.error('❌ Debug endpoint error:', response.status)
      }
    } catch (error) {
      console.error('❌ Debug error:', error)
    }
    console.log('🐛 ==================== DEBUG END ====================')
  }

  const handleOpenResponse = (appointment: AppointmentRequest) => {
    setSelectedAppointment(appointment)
    setResponseAction('confirm')
    
    // Pre-fill with requested date
    // For reschedule requests, use the new requested date
    // For initial requests, use the preferred date
    if (appointment.status === 'pending_reschedule' && appointment.rescheduleRequest) {
      setSelectedDate(new Date(appointment.rescheduleRequest.requestedDate))
      setSelectedTime(appointment.rescheduleRequest.requestedTime)
    } else {
      setSelectedDate(new Date(appointment.preferredDate))
      setSelectedTime(appointment.preferredTime)
    }
    
    setResponseNotes('')
    setShowResponseDialog(true)
  }

  const handleSubmitResponse = async () => {
    if (!selectedAppointment) return

    if (responseAction === 'reschedule' && (!selectedDate || !selectedTime)) {
      toast.error('Por favor, selecione data e hora para reagendar')
      return
    }

    if (responseAction === 'reject' && !responseNotes) {
      toast.error('Por favor, indique o motivo da rejeição')
      return
    }

    setLoading(true)
    try {
      const payload: any = {
        action: responseAction,
        notes: responseNotes
      }

      if (responseAction === 'confirm' || responseAction === 'reschedule') {
        payload.confirmedDate = selectedDate!.toISOString().split('T')[0]
        payload.confirmedTime = selectedTime
      }

      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-6971b43c/workshop/appointment-requests/${selectedAppointment.id}/respond`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${accessToken}`
          },
          body: JSON.stringify(payload)
        }
      )

      if (!response.ok) {
        throw new Error('Erro ao responder')
      }

      const data = await response.json()
      const actionText = responseAction === 'confirm' ? 'confirmado' : 
                        responseAction === 'reschedule' ? 'reagendado' : 'rejeitado'
      
      // Show success with integration info if applicable
      if (data.clientId && data.vehicleId && data.budgetId) {
        toast.success(`🎉 Agendamento ${actionText} com sucesso!`)
        toast.success(`✅ Cliente, Veículo e Orçamento criados automaticamente`)
        if (data.agendaAppointmentId) {
          toast.success(`📅 Adicionado à Agenda`)
        }
      } else if (data.agendaAppointmentId) {
        toast.success(`Agendamento ${actionText} e adicionado à Agenda com sucesso! 📅`)
      } else {
        toast.success(`Agendamento ${actionText} com sucesso!`)
      }
      
      setShowResponseDialog(false)
      setSelectedAppointment(null)
      await loadAppointments()
    } catch (error: any) {
      console.error('Error responding:', error)
      toast.error('Erro ao responder ao pedido')
    } finally {
      setLoading(false)
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending_confirmation':
        return <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">
          <Clock className="h-3 w-3 mr-1" />
          Pendente
        </Badge>
      case 'pending_reschedule':
        return <Badge variant="secondary" className="bg-orange-100 text-orange-800">
          <RefreshCw className="h-3 w-3 mr-1" />
          Pedido de Reagendamento
        </Badge>
      case 'confirmed':
        return <Badge className="bg-green-600">
          <CheckCircle className="h-3 w-3 mr-1" />
          Confirmado
        </Badge>
      case 'rescheduled':
        return <Badge className="bg-blue-600">
          <CalendarCheck className="h-3 w-3 mr-1" />
          Reagendado
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

  // Generate time slots
  const timeSlots = []
  for (let hour = 9; hour <= 18; hour++) {
    for (let min = 0; min < 60; min += 30) {
      if (hour === 18 && min > 0) break
      const time = `${hour.toString().padStart(2, '0')}:${min.toString().padStart(2, '0')}`
      timeSlots.push(time)
    }
  }

  const pendingAppointments = appointments.filter(a => a.status === 'pending_confirmation' || a.status === 'pending_reschedule')
  const confirmedAppointments = appointments.filter(a => a.status === 'confirmed' || a.status === 'rescheduled')
  const rejectedAppointments = appointments.filter(a => a.status === 'rejected')

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr)
    return date.toLocaleDateString('pt-PT', {
      day: '2-digit',
      month: 'long',
      year: 'numeric'
    })
  }

  return (
    <div className="space-y-6 p-4" style={{ margin: '10px' }}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-black bg-gradient-to-r from-blue-600 to-orange-600 bg-clip-text text-transparent">
            Pedidos de Agendamento
          </h1>
          <p className="text-gray-500 mt-1">
            Gerir pedidos de agendamento de clientes
          </p>
        </div>
        <div className="flex gap-3">
          {pendingAppointments.length > 0 && (
            <Badge className="text-sm bg-yellow-600">
              <CalendarIcon className="h-4 w-4 mr-2" />
              {pendingAppointments.length} pendente(s)
            </Badge>
          )}
          <Button
            variant="secondary"
            size="sm"
            onClick={debugData}
          >
            <AlertCircle className="h-4 w-4 mr-2" />
            Debug
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={loadAppointments}
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
                <p>• Clientes escolhem a sua oficina e propõem data/hora de agendamento</p>
                <p>• Pode <strong>confirmar</strong> a data proposta, <strong>reagendar</strong> para outra data/hora, ou <strong>rejeitar</strong></p>
                <p>• Cliente será notificado automaticamente da sua resposta</p>
                <p>• Agendamentos confirmados podem ser sincronizados com a agenda</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-3 mb-6">
          <TabsTrigger value="pending">
            Pendentes
            {pendingAppointments.length > 0 && (
              <Badge className="ml-2 bg-yellow-500 text-xs px-1.5 py-0">
                {pendingAppointments.length}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="confirmed">
            Confirmados
            {confirmedAppointments.length > 0 && (
              <Badge variant="secondary" className="ml-2 text-xs px-1.5 py-0">
                {confirmedAppointments.length}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="rejected">
            Rejeitados
            {rejectedAppointments.length > 0 && (
              <Badge variant="secondary" className="ml-2 text-xs px-1.5 py-0">
                {rejectedAppointments.length}
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
              {pendingAppointments.length === 0 ? (
                <Card>
                  <CardContent className="py-12 text-center">
                    <Clock className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                    <h3 className="font-semibold text-gray-900 mb-2">
                      Nenhum pedido pendente
                    </h3>
                    <p className="text-sm text-gray-500">
                      Não há pedidos de agendamento aguardando resposta
                    </p>
                  </CardContent>
                </Card>
              ) : (
                <div className="grid lg:grid-cols-2 gap-6">
                  {pendingAppointments.map((appointment) => (
                    <Card key={appointment.id} className="border-2 border-yellow-200 bg-yellow-50">
                      <CardHeader>
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              {getStatusBadge(appointment.status)}
                              <span className="text-xs text-gray-500">
                                {new Date(appointment.createdAt).toLocaleDateString('pt-PT', {
                                  day: 'numeric',
                                  month: 'short',
                                  hour: '2-digit',
                                  minute: '2-digit'
                                })}
                              </span>
                            </div>
                            <CardTitle className="text-lg text-gray-900">
                              {appointment.serviceName}
                            </CardTitle>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        {/* Vehicle Info */}
                        <div className="flex items-center gap-3 p-3 bg-white rounded-lg">
                          <div className="h-10 w-10 rounded-lg bg-blue-600 flex items-center justify-center">
                            <Car className="h-5 w-5 text-white" />
                          </div>
                          <div>
                            <p className="text-xs text-gray-500">Matrícula</p>
                            <p className="font-bold text-gray-900">{appointment.licensePlate}</p>
                          </div>
                        </div>

                        {/* Vehicle Details from InfoMatricula */}
                        {vehicleDataCache[appointment.licensePlate] && (
                          <div className="p-3 bg-gradient-to-br from-green-50 to-blue-50 rounded-lg border-2 border-green-200">
                            <div className="flex items-center gap-2 mb-3">
                              <CheckCircle className="h-4 w-4 text-green-600" />
                              <p className="text-xs text-green-800 font-semibold">Dados do Veículo (InfoMatricula)</p>
                            </div>
                            <div className="grid grid-cols-2 gap-2 text-sm">
                              <div>
                                <p className="text-xs text-gray-600">Marca</p>
                                <p className="font-semibold text-gray-900">{vehicleDataCache[appointment.licensePlate].make}</p>
                              </div>
                              <div>
                                <p className="text-xs text-gray-600">Modelo</p>
                                <p className="font-semibold text-gray-900">{vehicleDataCache[appointment.licensePlate].model}</p>
                              </div>
                              {vehicleDataCache[appointment.licensePlate].version && (
                                <div className="col-span-2">
                                  <p className="text-xs text-gray-600">Versão</p>
                                  <p className="font-semibold text-gray-900 text-xs">{vehicleDataCache[appointment.licensePlate].version}</p>
                                </div>
                              )}
                              {vehicleDataCache[appointment.licensePlate].plateDate && (
                                <div>
                                  <p className="text-xs text-gray-600">Data Matrícula</p>
                                  <p className="font-semibold text-gray-900">{vehicleDataCache[appointment.licensePlate].plateDate}</p>
                                </div>
                              )}
                              {vehicleDataCache[appointment.licensePlate].vin && (
                                <div>
                                  <p className="text-xs text-gray-600">VIN</p>
                                  <p className="font-semibold text-gray-900 text-xs">{vehicleDataCache[appointment.licensePlate].vin.substring(0, 10)}...</p>
                                </div>
                              )}
                            </div>
                          </div>
                        )}
                        {loadingVehicleData[appointment.licensePlate] && (
                          <div className="p-3 bg-blue-50 rounded-lg border border-blue-200 flex items-center gap-2">
                            <div className="animate-spin h-4 w-4 border-2 border-blue-600 border-t-transparent rounded-full"></div>
                            <p className="text-xs text-blue-700">A carregar dados do veículo...</p>
                          </div>
                        )}

                        {/* Client Info */}
                        <div className="space-y-2 p-3 bg-white rounded-lg">
                          <div className="flex items-center gap-2 text-sm">
                            <User className="h-4 w-4 text-gray-400" />
                            <span className="text-gray-700">{appointment.clientName}</span>
                          </div>
                          <div className="flex items-center gap-2 text-sm">
                            <Phone className="h-4 w-4 text-gray-400" />
                            <a href={`tel:${appointment.clientPhone}`} className="text-blue-600 hover:underline">
                              {appointment.clientPhone}
                            </a>
                          </div>
                          <div className="flex items-center gap-2 text-sm">
                            <Mail className="h-4 w-4 text-gray-400" />
                            <a href={`mailto:${appointment.clientEmail}`} className="text-blue-600 hover:underline">
                              {appointment.clientEmail}
                            </a>
                          </div>
                        </div>

                        {/* Preferred Date/Time OR Reschedule Info */}
                        {appointment.status === 'pending_reschedule' && appointment.rescheduleRequest ? (
                          <>
                            {/* Original Confirmed Date */}
                            <div className="p-3 bg-gray-100 rounded-lg border border-gray-300">
                              <p className="text-xs text-gray-600 font-semibold mb-2">
                                📅 Data Atual (Confirmada anteriormente)
                              </p>
                              <div className="flex items-center gap-4 text-sm">
                                <div className="flex items-center gap-2">
                                  <CalendarIcon className="h-4 w-4 text-gray-600" />
                                  <span className="font-bold">{formatDate(appointment.confirmedDate || appointment.preferredDate)}</span>
                                </div>
                                <div className="flex items-center gap-2">
                                  <Clock className="h-4 w-4 text-gray-600" />
                                  <span className="font-bold">{appointment.confirmedTime || appointment.preferredTime}</span>
                                </div>
                              </div>
                            </div>

                            {/* New Requested Date */}
                            <div className="p-3 bg-orange-50 rounded-lg border-2 border-orange-400">
                              <p className="text-xs text-orange-800 font-semibold mb-2">
                                🔄 Nova Data Solicitada pelo Cliente
                              </p>
                              <div className="flex items-center gap-4 text-sm">
                                <div className="flex items-center gap-2">
                                  <CalendarIcon className="h-4 w-4 text-orange-600" />
                                  <span className="font-bold text-orange-900">{formatDate(appointment.rescheduleRequest.requestedDate)}</span>
                                </div>
                                <div className="flex items-center gap-2">
                                  <Clock className="h-4 w-4 text-orange-600" />
                                  <span className="font-bold text-orange-900">{appointment.rescheduleRequest.requestedTime}</span>
                                </div>
                              </div>
                              {appointment.rescheduleRequest.notes && (
                                <div className="mt-2 pt-2 border-t border-orange-200">
                                  <p className="text-xs text-orange-700">
                                    <strong>Motivo:</strong> {appointment.rescheduleRequest.notes}
                                  </p>
                                </div>
                              )}
                            </div>
                          </>
                        ) : (
                          <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
                            <p className="text-xs text-blue-800 font-semibold mb-2">
                              Data/Hora Solicitada
                            </p>
                            <div className="flex items-center gap-4 text-sm">
                              <div className="flex items-center gap-2">
                                <CalendarIcon className="h-4 w-4 text-blue-600" />
                                <span className="font-bold">{formatDate(appointment.preferredDate)}</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <Clock className="h-4 w-4 text-blue-600" />
                                <span className="font-bold">{appointment.preferredTime}</span>
                              </div>
                            </div>
                          </div>
                        )}

                        {/* Notes */}
                        {appointment.notes && (
                          <div className="p-3 bg-orange-50 rounded-lg border border-orange-200">
                            <div className="flex items-start gap-2">
                              <MessageSquare className="h-4 w-4 text-orange-600 mt-0.5" />
                              <div className="flex-1">
                                <p className="text-xs text-orange-800 font-semibold mb-1">
                                  Notas do Cliente
                                </p>
                                <p className="text-sm text-gray-700">{appointment.notes}</p>
                              </div>
                            </div>
                          </div>
                        )}

                        {/* Action Button */}
                        <Button
                          onClick={() => handleOpenResponse(appointment)}
                          className="w-full bg-gradient-to-r from-blue-600 to-orange-500"
                        >
                          <CalendarCheck className="h-4 w-4 mr-2" />
                          Responder ao Pedido
                        </Button>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>

            {/* CONFIRMED TAB */}
            <TabsContent value="confirmed">
              {confirmedAppointments.length === 0 ? (
                <Card>
                  <CardContent className="py-12 text-center">
                    <CheckCircle className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                    <h3 className="font-semibold text-gray-900 mb-2">
                      Nenhum agendamento confirmado
                    </h3>
                  </CardContent>
                </Card>
              ) : (
                <div className="grid lg:grid-cols-2 gap-6">
                  {confirmedAppointments.map((appointment) => (
                    <Card key={appointment.id} className="border-2 border-green-200 bg-green-50">
                      <CardHeader>
                        {getStatusBadge(appointment.status)}
                        <CardTitle className="text-lg mt-2">{appointment.serviceName}</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        <div className="flex items-center gap-3 p-3 bg-white rounded-lg">
                          <Car className="h-5 w-5 text-green-600" />
                          <span className="font-bold">{appointment.licensePlate}</span>
                          <span className="text-gray-400">•</span>
                          <span className="text-sm">{appointment.clientName}</span>
                        </div>

                        {/* Confirmed Date/Time */}
                        <div className="p-3 bg-green-100 rounded-lg border border-green-300">
                          <p className="text-xs text-green-800 font-semibold mb-2">
                            Agendado Para
                          </p>
                          <div className="flex items-center gap-4 text-sm">
                            <div className="flex items-center gap-2">
                              <CalendarIcon className="h-4 w-4 text-green-700" />
                              <span className="font-bold">{formatDate(appointment.confirmedDate!)}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <Clock className="h-4 w-4 text-green-700" />
                              <span className="font-bold">{appointment.confirmedTime}</span>
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 text-sm">
                          <Phone className="h-4 w-4 text-gray-400" />
                          <a href={`tel:${appointment.clientPhone}`} className="text-blue-600 hover:underline">
                            {appointment.clientPhone}
                          </a>
                        </div>

                        {/* Badge if added to agenda */}
                        {(appointment as any).agendaAppointmentId && (
                          <div className="p-2 bg-blue-50 rounded border border-blue-200 flex items-center gap-2 text-xs">
                            <CalendarCheck className="h-3 w-3 text-blue-600" />
                            <span className="text-blue-800 font-semibold">✓ Adicionado à Agenda</span>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>

            {/* REJECTED TAB */}
            <TabsContent value="rejected">
              {rejectedAppointments.length === 0 ? (
                <Card>
                  <CardContent className="py-12 text-center">
                    <CalendarX className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                    <h3 className="font-semibold text-gray-900 mb-2">
                      Nenhum agendamento rejeitado
                    </h3>
                  </CardContent>
                </Card>
              ) : (
                <div className="grid lg:grid-cols-2 gap-6">
                  {rejectedAppointments.map((appointment) => (
                    <Card key={appointment.id} className="border-2 border-red-200 opacity-75">
                      <CardHeader>
                        {getStatusBadge(appointment.status)}
                        <CardTitle className="text-lg mt-2 text-gray-500">{appointment.serviceName}</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="flex items-center gap-2 text-sm text-gray-500 mb-2">
                          <Car className="h-4 w-4" />
                          {appointment.licensePlate} • {appointment.clientName}
                        </div>
                        {appointment.responseNotes && (
                          <div className="p-2 bg-red-50 rounded border border-red-200 text-sm">
                            <p className="text-xs text-red-800 font-semibold mb-1">Motivo:</p>
                            <p className="text-gray-600">{appointment.responseNotes}</p>
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
            <DialogTitle className="flex items-center gap-2">
              {selectedAppointment?.status === 'pending_reschedule' ? (
                <>
                  <RefreshCw className="h-5 w-5 text-orange-600" />
                  Pedido de Reagendamento
                </>
              ) : (
                <>
                  <CalendarCheck className="h-5 w-5 text-blue-600" />
                  Responder ao Pedido de Agendamento
                </>
              )}
            </DialogTitle>
          </DialogHeader>

          {selectedAppointment && (
            <div className="space-y-4">
              {/* Request Summary */}
              <Card className="bg-gray-50">
                <CardContent className="pt-4 space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Cliente:</span>
                    <span className="font-semibold">{selectedAppointment.clientName}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Matrícula:</span>
                    <span className="font-semibold">{selectedAppointment.licensePlate}</span>
                  </div>
                  
                  {/* Vehicle Details from InfoMatricula */}
                  {vehicleDataCache[selectedAppointment.licensePlate] && (
                    <div className="pt-2 pb-2 px-3 -mx-4 bg-gradient-to-br from-green-50 to-blue-50 border-t-2 border-b-2 border-green-200">
                      <div className="flex items-center gap-2 mb-2">
                        <CheckCircle className="h-4 w-4 text-green-600" />
                        <p className="text-xs text-green-800 font-semibold">Dados do Veículo</p>
                      </div>
                      <div className="grid grid-cols-2 gap-2 text-xs">
                        <div>
                          <p className="text-gray-600">Marca:</p>
                          <p className="font-semibold text-gray-900">{vehicleDataCache[selectedAppointment.licensePlate].make}</p>
                        </div>
                        <div>
                          <p className="text-gray-600">Modelo:</p>
                          <p className="font-semibold text-gray-900">{vehicleDataCache[selectedAppointment.licensePlate].model}</p>
                        </div>
                        {vehicleDataCache[selectedAppointment.licensePlate].plateDate && (
                          <div>
                            <p className="text-gray-600">Data Matrícula:</p>
                            <p className="font-semibold text-gray-900">{vehicleDataCache[selectedAppointment.licensePlate].plateDate}</p>
                          </div>
                        )}
                        {vehicleDataCache[selectedAppointment.licensePlate].vin && (
                          <div>
                            <p className="text-gray-600">VIN:</p>
                            <p className="font-semibold text-gray-900 text-xs">{vehicleDataCache[selectedAppointment.licensePlate].vin.substring(0, 12)}...</p>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                  
                  <div className="flex justify-between">
                    <span className="text-gray-600">Serviço:</span>
                    <span className="font-semibold">{selectedAppointment.serviceName}</span>
                  </div>
                  {selectedAppointment.status === 'pending_reschedule' && selectedAppointment.rescheduleRequest ? (
                    <>
                      <div className="pt-2 border-t border-gray-300">
                        <p className="text-xs text-gray-500 mb-2">📅 Data Atual (Confirmada):</p>
                        <p className="font-semibold text-gray-700">
                          {formatDate(selectedAppointment.confirmedDate || selectedAppointment.preferredDate)} às {selectedAppointment.confirmedTime || selectedAppointment.preferredTime}
                        </p>
                      </div>
                      <div className="pt-2 border-t border-orange-300 bg-orange-50 -mx-4 -mb-4 px-4 pb-4 mt-2">
                        <p className="text-xs text-orange-700 font-semibold mb-2 mt-2">🔄 Nova Data Solicitada pelo Cliente:</p>
                        <p className="font-semibold text-orange-900">
                          {formatDate(selectedAppointment.rescheduleRequest.requestedDate)} às {selectedAppointment.rescheduleRequest.requestedTime}
                        </p>
                        {selectedAppointment.rescheduleRequest.notes && (
                          <p className="text-xs text-orange-600 mt-2">
                            <strong>Motivo:</strong> {selectedAppointment.rescheduleRequest.notes}
                          </p>
                        )}
                      </div>
                    </>
                  ) : (
                    <div className="flex justify-between">
                      <span className="text-gray-600">Data Solicitada:</span>
                      <span className="font-semibold">
                        {formatDate(selectedAppointment.preferredDate)} às {selectedAppointment.preferredTime}
                      </span>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Action Selection */}
              <div className="space-y-2">
                <Label>Ação</Label>
                <div className="grid grid-cols-3 gap-3">
                  <Button
                    type="button"
                    variant={responseAction === 'confirm' ? 'default' : 'outline'}
                    onClick={() => setResponseAction('confirm')}
                    className={responseAction === 'confirm' ? 'bg-green-600' : ''}
                  >
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Confirmar
                  </Button>
                  <Button
                    type="button"
                    variant={responseAction === 'reschedule' ? 'default' : 'outline'}
                    onClick={() => setResponseAction('reschedule')}
                    className={responseAction === 'reschedule' ? 'bg-blue-600' : ''}
                  >
                    <CalendarCheck className="h-4 w-4 mr-2" />
                    Reagendar
                  </Button>
                  <Button
                    type="button"
                    variant={responseAction === 'reject' ? 'destructive' : 'outline'}
                    onClick={() => setResponseAction('reject')}
                  >
                    <XCircle className="h-4 w-4 mr-2" />
                    Rejeitar
                  </Button>
                </div>
              </div>

              {/* Date/Time Selection (for confirm or reschedule) */}
              {(responseAction === 'confirm' || responseAction === 'reschedule') && (
                <>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Data</Label>
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button
                            variant="outline"
                            className="w-full justify-start text-left"
                          >
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            {selectedDate ? formatDate(selectedDate.toISOString().split('T')[0]) : 'Selecione'}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar
                            mode="single"
                            selected={selectedDate}
                            onSelect={setSelectedDate}
                            disabled={(date) => {
                              const today = new Date()
                              today.setHours(0, 0, 0, 0)
                              return date < today || date.getDay() === 0
                            }}
                          />
                        </PopoverContent>
                      </Popover>
                    </div>

                    <div className="space-y-2">
                      <Label>Hora</Label>
                      <select
                        value={selectedTime}
                        onChange={(e) => setSelectedTime(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md"
                      >
                        {timeSlots.map((time) => (
                          <option key={time} value={time}>{time}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {responseAction === 'reschedule' && (
                    <div className="p-3 bg-blue-50 rounded border border-blue-200 text-sm text-blue-700">
                      <AlertCircle className="h-4 w-4 inline mr-1" />
                      O cliente será notificado da nova data/hora proposta
                    </div>
                  )}
                </>
              )}

              {/* Notes */}
              <div className="space-y-2">
                <Label>
                  {responseAction === 'reject' ? 'Motivo da Rejeição *' : 'Notas Adicionais (Opcional)'}
                </Label>
                <Textarea
                  placeholder={
                    responseAction === 'reject'
                      ? 'Explique o motivo da rejeição...'
                      : 'Informações adicionais para o cliente...'
                  }
                  value={responseNotes}
                  onChange={(e) => setResponseNotes(e.target.value)}
                  rows={3}
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