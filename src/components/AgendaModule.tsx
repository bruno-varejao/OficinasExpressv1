import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from './ui/card'
import { Button } from './ui/button'
import { Input } from './ui/input'
import { Label } from './ui/label'
import { Textarea } from './ui/textarea'
import { Badge } from './ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs'
import { Calendar } from './ui/calendar'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from './ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select'
import { toast } from 'sonner@2.0.3'
import { projectId, publicAnonKey } from '../utils/supabase/info'
import {
  Calendar as CalendarIcon,
  Clock,
  Settings,
  CheckCircle,
  Save,
  X,
  Plus,
  Search,
  User,
  Phone,
  Mail,
  Car,
  Edit,
  Trash2,
  AlertCircle,
  Info
} from 'lucide-react'

interface AgendaConfig {
  workshopId: string
  dailySlots: number
  workingHours: {
    [key: string]: {
      enabled: boolean
      start: string
      end: string
    }
  }
  slotDuration: number
  breakTime: {
    start: string
    end: string
  }
  advanceBookingDays: number
}

interface Appointment {
  id: string
  workshopId: string
  clientName: string
  clientEmail: string
  clientPhone: string
  licensePlate: string
  serviceId: string
  serviceName: string
  date: string
  startTime: string
  notes?: string
  status: 'scheduled' | 'in-progress' | 'completed' | 'cancelled'
  createdAt: string
}

interface AgendaModuleProps {
  accessToken: string
}

const weekDays = [
  { key: 'monday', label: 'Segunda' },
  { key: 'tuesday', label: 'Terça' },
  { key: 'wednesday', label: 'Quarta' },
  { key: 'thursday', label: 'Quinta' },
  { key: 'friday', label: 'Sexta' },
  { key: 'saturday', label: 'Sábado' },
  { key: 'sunday', label: 'Domingo' }
]

const statusColors = {
  scheduled: 'bg-blue-100 text-blue-800 border-blue-300',
  'in-progress': 'bg-orange-100 text-orange-800 border-orange-300',
  completed: 'bg-green-100 text-green-800 border-green-300',
  cancelled: 'bg-gray-100 text-gray-600 border-gray-300'
}

const statusLabels = {
  scheduled: 'Agendado',
  'in-progress': 'Em Progresso',
  completed: 'Concluído',
  cancelled: 'Cancelado'
}

export function AgendaModule({ accessToken }: AgendaModuleProps) {
  const [loading, setLoading] = useState(false)
  const [initialLoading, setInitialLoading] = useState(true)
  const [config, setConfig] = useState<AgendaConfig | null>(null)
  const [appointments, setAppointments] = useState<Appointment[]>([])
  const [selectedDate, setSelectedDate] = useState<Date>(new Date())
  const [searchTerm, setSearchTerm] = useState('')
  const [showNewAppointmentDialog, setShowNewAppointmentDialog] = useState(false)
  const [newAppointment, setNewAppointment] = useState({
    clientName: '',
    clientEmail: '',
    clientPhone: '',
    licensePlate: '',
    serviceId: '',
    serviceName: '',
    date: new Date().toISOString().split('T')[0],
    startTime: '09:00',
    notes: ''
  })

  useEffect(() => {
    const initializeModule = async () => {
      setInitialLoading(true)
      await loadConfig()
      await loadAppointments()
      setInitialLoading(false)
    }
    initializeModule()
  }, [])

  useEffect(() => {
    if (selectedDate) {
      loadAppointments()
    }
  }, [selectedDate])

  const loadConfig = async () => {
    try {
      console.log('🔄 Loading agenda config...')
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-6971b43c/agenda/config`,
        {
          headers: {
            'Authorization': `Bearer ${accessToken}`
          }
        }
      )

      if (!response.ok) {
        const errorData = await response.json()
        console.error('❌ Error response:', errorData)
        throw new Error(errorData.error || 'Erro ao carregar configuração')
      }

      const data = await response.json()
      console.log('✅ Config loaded:', data.config)
      setConfig(data.config)
    } catch (error: any) {
      console.error('❌ Error loading config:', error)
      toast.error('Erro ao carregar configuração: ' + error.message)
      
      // Set default config if loading fails
      const defaultConfig: AgendaConfig = {
        workshopId: 'temp',
        dailySlots: 8,
        workingHours: {
          monday: { enabled: true, start: '09:00', end: '18:00' },
          tuesday: { enabled: true, start: '09:00', end: '18:00' },
          wednesday: { enabled: true, start: '09:00', end: '18:00' },
          thursday: { enabled: true, start: '09:00', end: '18:00' },
          friday: { enabled: true, start: '09:00', end: '18:00' },
          saturday: { enabled: false, start: '09:00', end: '13:00' },
          sunday: { enabled: false, start: '09:00', end: '13:00' }
        },
        slotDuration: 60,
        breakTime: { start: '13:00', end: '14:00' },
        advanceBookingDays: 30
      }
      setConfig(defaultConfig)
    }
  }

  const loadAppointments = async () => {
    setLoading(true)
    try {
      // Calculate date range (week view)
      const startDate = new Date(selectedDate)
      startDate.setDate(startDate.getDate() - 7)
      const endDate = new Date(selectedDate)
      endDate.setDate(endDate.getDate() + 30)
      
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-6971b43c/agenda/appointments?startDate=${startDate.toISOString().split('T')[0]}&endDate=${endDate.toISOString().split('T')[0]}`,
        {
          headers: {
            'Authorization': `Bearer ${accessToken}`
          }
        }
      )

      if (!response.ok) {
        throw new Error('Erro ao carregar agendamentos')
      }

      const data = await response.json()
      setAppointments(data.appointments || [])
      
    } catch (error: any) {
      console.error('Error loading appointments:', error)
      toast.error('Erro ao carregar agendamentos')
    } finally {
      setLoading(false)
    }
  }

  const saveConfig = async () => {
    if (!config) return

    setLoading(true)
    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-6971b43c/agenda/config`,
        {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${accessToken}`
          },
          body: JSON.stringify(config)
        }
      )

      if (!response.ok) {
        throw new Error('Erro ao guardar configuração')
      }

      toast.success('✅ Configuração guardada com sucesso!')
    } catch (error: any) {
      console.error('Error saving config:', error)
      toast.error('Erro ao guardar configuração')
    } finally {
      setLoading(false)
    }
  }

  const updateWorkingHours = (day: string, field: string, value: any) => {
    if (!config) return

    setConfig({
      ...config,
      workingHours: {
        ...config.workingHours,
        [day]: {
          ...config.workingHours[day],
          [field]: value
        }
      }
    })
  }

  const handleCreateAppointment = async () => {
    if (!newAppointment.clientName || !newAppointment.clientEmail || !newAppointment.date || !newAppointment.serviceId) {
      toast.error('Preencha todos os campos obrigatórios')
      return
    }

    setLoading(true)
    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-6971b43c/agenda/appointments`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${accessToken}`
          },
          body: JSON.stringify(newAppointment)
        }
      )

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Erro ao criar agendamento')
      }

      toast.success('✅ Agendamento criado com sucesso!')
      setShowNewAppointmentDialog(false)
      setNewAppointment({
        clientName: '',
        clientEmail: '',
        clientPhone: '',
        licensePlate: '',
        serviceId: '',
        serviceName: '',
        date: new Date().toISOString().split('T')[0],
        startTime: '09:00',
        notes: ''
      })
      await loadAppointments()
    } catch (error: any) {
      console.error('Error creating appointment:', error)
      toast.error(error.message || 'Erro ao criar agendamento')
    } finally {
      setLoading(false)
    }
  }

  const updateAppointmentStatus = async (appointmentId: string, status: string) => {
    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-6971b43c/agenda/appointments/${appointmentId}/status`,
        {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${accessToken}`
          },
          body: JSON.stringify({ status })
        }
      )

      if (!response.ok) {
        throw new Error('Erro ao atualizar status')
      }

      toast.success('Status atualizado!')
      await loadAppointments()
    } catch (error: any) {
      console.error('Error updating status:', error)
      toast.error('Erro ao atualizar status')
    }
  }

  const deleteAppointment = async (appointmentId: string, clientName: string) => {
    if (!confirm(`Tem a certeza que deseja eliminar o agendamento de "${clientName}"?\n\nEsta ação não pode ser revertida.`)) {
      return
    }

    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-6971b43c/agenda/appointments/${appointmentId}`,
        {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${accessToken}`
          }
        }
      )

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Erro ao eliminar agendamento')
      }

      toast.success('Agendamento eliminado com sucesso!')
      await loadAppointments()
    } catch (error: any) {
      console.error('Error deleting appointment:', error)
      toast.error(error.message || 'Erro ao eliminar agendamento')
    }
  }

  const filteredAppointments = appointments.filter(apt => {
    if (!searchTerm) return true
    const term = searchTerm.toLowerCase()
    return (
      apt.clientName.toLowerCase().includes(term) ||
      apt.licensePlate.toLowerCase().includes(term) ||
      apt.serviceName.toLowerCase().includes(term) ||
      apt.clientEmail.toLowerCase().includes(term)
    )
  })

  const dateStr = selectedDate.toISOString().split('T')[0]
  const appointmentsOnDate = filteredAppointments.filter(apt => apt.date === dateStr)

  // Calculate slots usage for selected date
  const slotsUsed = appointmentsOnDate.filter(apt => apt.status !== 'cancelled').length
  const slotsAvailable = config ? config.dailySlots - slotsUsed : 0

  // Show initial loading state
  if (initialLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <div className="animate-spin h-12 w-12 border-4 border-blue-600 border-t-transparent rounded-full mx-auto mb-4"></div>
          <h3 className="font-semibold text-gray-900 mb-2">A carregar módulo de Agenda...</h3>
          <p className="text-sm text-gray-500">Por favor aguarde</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6" style={{ margin: '10px', width: 'calc(100% - 20px)' }}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-black bg-gradient-to-r from-blue-600 to-orange-600 bg-clip-text text-transparent">
            📅 Agenda
          </h1>
          <p className="text-gray-500 mt-1">
            Gerir agendamentos e configurar horários da oficina
          </p>
        </div>
        <div className="flex gap-3">
          {config && (
            <div className="flex gap-2">
              <Badge variant="outline" className="text-sm bg-blue-50 border-blue-200">
                <Clock className="h-4 w-4 mr-2 text-blue-600" />
                {config.dailySlots} slots/dia
              </Badge>
              <Badge 
                variant="outline" 
                className={`text-sm ${slotsAvailable > 0 ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}
              >
                {slotsAvailable > 0 ? (
                  <CheckCircle className="h-4 w-4 mr-2 text-green-600" />
                ) : (
                  <AlertCircle className="h-4 w-4 mr-2 text-red-600" />
                )}
                {slotsAvailable} disponíveis hoje
              </Badge>
            </div>
          )}
        </div>
      </div>

      <Tabs defaultValue="calendar" className="w-full">
        <TabsList className="grid w-full grid-cols-2 max-w-md">
          <TabsTrigger value="calendar">
            <CalendarIcon className="h-4 w-4 mr-2" />
            Calendário
          </TabsTrigger>
          <TabsTrigger value="settings">
            <Settings className="h-4 w-4 mr-2" />
            Configurações
          </TabsTrigger>
        </TabsList>

        {/* ==================== CALENDAR TAB ==================== */}
        <TabsContent value="calendar" className="space-y-6 mt-6">
          <div className="grid lg:grid-cols-12 gap-6">
            {/* Left: Calendar Picker */}
            <Card className="lg:col-span-4">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg">Selecionar Data</CardTitle>
                <CardDescription className="text-sm">
                  Clique numa data para ver os agendamentos
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Calendar
                  mode="single"
                  selected={selectedDate}
                  onSelect={(date) => date && setSelectedDate(date)}
                  className="rounded-md border"
                />
                
                {/* Slots Summary */}
                {config && (
                  <div className="mt-4 p-4 bg-gradient-to-br from-blue-50 to-orange-50 rounded-lg border-2 border-blue-200">
                    <div className="text-sm space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="text-gray-600 font-medium">Total de Slots:</span>
                        <span className="font-bold text-blue-600 text-lg">{config.dailySlots}</span>
                      </div>
                      <div className="h-px bg-blue-200"></div>
                      <div className="flex justify-between items-center">
                        <span className="text-gray-600">Ocupados:</span>
                        <span className="font-bold text-orange-600">{slotsUsed}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-gray-600">Disponíveis:</span>
                        <span className="font-bold text-green-600">{slotsAvailable}</span>
                      </div>
                      
                      {/* Visual Progress Bar */}
                      <div className="pt-2">
                        <div className="h-3 bg-gray-200 rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-gradient-to-r from-blue-500 to-orange-500 transition-all duration-300"
                            style={{ width: `${(slotsUsed / config.dailySlots) * 100}%` }}
                          />
                        </div>
                        <p className="text-xs text-center text-gray-500 mt-1">
                          {Math.round((slotsUsed / config.dailySlots) * 100)}% ocupação
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Info Box */}
                <div className="mt-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
                  <div className="flex items-start gap-2">
                    <Info className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
                    <p className="text-xs text-blue-800">
                      Configure os slots diários e horários de funcionamento em <strong>Configurações</strong> para gerir a capacidade da oficina.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Right: Appointments List */}
            <Card className="lg:col-span-8">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-lg">
                      {selectedDate.toLocaleDateString('pt-PT', {
                        weekday: 'long',
                        day: 'numeric',
                        month: 'long',
                        year: 'numeric'
                      })}
                    </CardTitle>
                    <CardDescription className="text-sm mt-1">
                      {appointmentsOnDate.length} agendamento(s) nesta data
                    </CardDescription>
                  </div>
                  <Button 
                    size="sm" 
                    onClick={() => {
                      setNewAppointment({
                        ...newAppointment,
                        date: selectedDate.toISOString().split('T')[0]
                      })
                      setShowNewAppointmentDialog(true)
                    }}
                    className="bg-gradient-to-r from-blue-600 to-orange-500"
                    disabled={config && slotsAvailable <= 0}
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Novo Agendamento
                  </Button>
                </div>
                
                {/* Search Bar */}
                <div className="mt-4">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                      placeholder="Procurar por cliente, matrícula, serviço ou email..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10 pr-10"
                    />
                    {searchTerm && (
                      <button
                        onClick={() => setSearchTerm('')}
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="text-center py-12">
                    <div className="animate-spin h-8 w-8 border-4 border-blue-600 border-t-transparent rounded-full mx-auto mb-4"></div>
                    <p className="text-gray-500">A carregar agendamentos...</p>
                  </div>
                ) : appointmentsOnDate.length === 0 ? (
                  <div className="text-center py-12">
                    <CalendarIcon className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                    <h3 className="font-semibold text-gray-900 mb-2">
                      Nenhum agendamento
                    </h3>
                    <p className="text-sm text-gray-500 mb-4">
                      Não há agendamentos para esta data
                    </p>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        setNewAppointment({
                          ...newAppointment,
                          date: selectedDate.toISOString().split('T')[0]
                        })
                        setShowNewAppointmentDialog(true)
                      }}
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Criar Primeiro Agendamento
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {appointmentsOnDate.map((appointment) => (
                      <Card key={appointment.id} className="border-l-4 border-blue-500 hover:shadow-md transition-shadow">
                        <CardContent className="p-4">
                          <div className="flex items-start justify-between gap-4">
                            <div className="flex-1 space-y-3">
                              {/* Time & Status */}
                              <div className="flex items-center gap-3">
                                <div className="flex items-center gap-2 bg-blue-50 px-3 py-1.5 rounded-lg">
                                  <Clock className="h-4 w-4 text-blue-600" />
                                  <span className="font-bold text-blue-900">
                                    {appointment.startTime || 'Hora não definida'}
                                  </span>
                                </div>
                                <Badge 
                                  variant="outline"
                                  className={statusColors[appointment.status]}
                                >
                                  {statusLabels[appointment.status]}
                                </Badge>
                              </div>
                              
                              {/* Client Info */}
                              <div className="space-y-1.5">
                                <div className="flex items-center gap-2">
                                  <User className="h-4 w-4 text-gray-400" />
                                  <span className="font-semibold text-gray-900">
                                    {appointment.clientName}
                                  </span>
                                </div>
                                <div className="flex items-center gap-2 text-sm text-gray-600">
                                  <Mail className="h-4 w-4 text-gray-400" />
                                  <a href={`mailto:${appointment.clientEmail}`} className="hover:text-blue-600">
                                    {appointment.clientEmail}
                                  </a>
                                </div>
                                {appointment.clientPhone && (
                                  <div className="flex items-center gap-2 text-sm text-gray-600">
                                    <Phone className="h-4 w-4 text-gray-400" />
                                    <a href={`tel:${appointment.clientPhone}`} className="hover:text-blue-600">
                                      {appointment.clientPhone}
                                    </a>
                                  </div>
                                )}
                              </div>
                              
                              {/* Service & Vehicle */}
                              <div className="p-3 bg-gray-50 rounded-lg">
                                <div className="flex items-center gap-2 mb-1">
                                  <Car className="h-4 w-4 text-gray-400" />
                                  <span className="font-semibold text-gray-900">
                                    {appointment.licensePlate || 'Sem matrícula'}
                                  </span>
                                </div>
                                <p className="text-sm text-gray-600">
                                  {appointment.serviceName || 'Serviço não especificado'}
                                </p>
                              </div>
                              
                              {/* Notes */}
                              {appointment.notes && (
                                <div className="p-3 bg-orange-50 rounded-lg border border-orange-200">
                                  <p className="text-sm text-gray-700">
                                    <strong className="text-orange-800">Notas:</strong> {appointment.notes}
                                  </p>
                                </div>
                              )}
                            </div>
                            
                            {/* Actions */}
                            <div className="flex flex-col gap-2">
                              {appointment.status === 'scheduled' && (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => updateAppointmentStatus(appointment.id, 'in-progress')}
                                  className="whitespace-nowrap"
                                >
                                  Iniciar
                                </Button>
                              )}
                              {appointment.status === 'in-progress' && (
                                <Button
                                  size="sm"
                                  onClick={() => updateAppointmentStatus(appointment.id, 'completed')}
                                  className="bg-green-600 hover:bg-green-700 whitespace-nowrap"
                                >
                                  Concluir
                                </Button>
                              )}
                              {appointment.status !== 'cancelled' && appointment.status !== 'completed' && (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => updateAppointmentStatus(appointment.id, 'cancelled')}
                                  className="text-red-600 hover:bg-red-50 whitespace-nowrap"
                                >
                                  Cancelar
                                </Button>
                              )}
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => deleteAppointment(appointment.id, appointment.clientName)}
                                className="text-red-600 hover:bg-red-50 hover:border-red-300 whitespace-nowrap"
                              >
                                <Trash2 className="h-4 w-4 mr-1" />
                                Eliminar
                              </Button>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* ==================== SETTINGS TAB ==================== */}
        <TabsContent value="settings" className="space-y-6 mt-6">
          {!config ? (
            <Card>
              <CardContent className="py-12 text-center">
                <Settings className="h-16 w-16 text-gray-300 mx-auto mb-4 animate-pulse" />
                <h3 className="font-semibold text-gray-900 mb-2">A inicializar configurações...</h3>
                <p className="text-sm text-gray-500 mb-4">
                  A criar configuração padrão da agenda
                </p>
                <Button
                  onClick={loadConfig}
                  variant="outline"
                  className="mt-2"
                >
                  Tentar Novamente
                </Button>
              </CardContent>
            </Card>
          ) : (
            <>
              {/* General Settings */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">⚙️ Configurações Gerais</CardTitle>
                  <CardDescription>
                    Defina a capacidade e duração dos agendamentos
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid md:grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="dailySlots">
                        Slots Diários *
                      </Label>
                      <Input
                        id="dailySlots"
                        type="number"
                        min="1"
                        max="50"
                        value={config.dailySlots}
                        onChange={(e) => setConfig({
                          ...config,
                          dailySlots: parseInt(e.target.value) || 1
                        })}
                      />
                      <p className="text-xs text-gray-500">
                        Número máximo de agendamentos por dia
                      </p>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="slotDuration">
                        Duração Padrão (min) *
                      </Label>
                      <Input
                        id="slotDuration"
                        type="number"
                        min="15"
                        max="480"
                        step="15"
                        value={config.slotDuration}
                        onChange={(e) => setConfig({
                          ...config,
                          slotDuration: parseInt(e.target.value) || 60
                        })}
                      />
                      <p className="text-xs text-gray-500">
                        Tempo estimado por agendamento
                      </p>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="advanceBookingDays">
                        Antecedência (dias)
                      </Label>
                      <Input
                        id="advanceBookingDays"
                        type="number"
                        min="1"
                        max="90"
                        value={config.advanceBookingDays}
                        onChange={(e) => setConfig({
                          ...config,
                          advanceBookingDays: parseInt(e.target.value) || 30
                        })}
                      />
                      <p className="text-xs text-gray-500">
                        Até quantos dias podem agendar
                      </p>
                    </div>
                  </div>

                  {/* Break Time */}
                  <div className="pt-4 border-t">
                    <h4 className="font-semibold mb-3 flex items-center gap-2">
                      <Clock className="h-4 w-4 text-orange-600" />
                      Intervalo de Almoço
                    </h4>
                    <div className="grid md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="breakStart">Início</Label>
                        <Input
                          id="breakStart"
                          type="time"
                          value={config.breakTime.start}
                          onChange={(e) => setConfig({
                            ...config,
                            breakTime: {
                              ...config.breakTime,
                              start: e.target.value
                            }
                          })}
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="breakEnd">Fim</Label>
                        <Input
                          id="breakEnd"
                          type="time"
                          value={config.breakTime.end}
                          onChange={(e) => setConfig({
                            ...config,
                            breakTime: {
                              ...config.breakTime,
                              end: e.target.value
                            }
                          })}
                        />
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Working Hours */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">🕐 Horário de Funcionamento</CardTitle>
                  <CardDescription>
                    Configure os dias e horários em que aceita agendamentos
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {weekDays.map((day) => (
                      <div key={day.key} className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg border hover:border-blue-300 transition-colors">
                        <div className="flex items-center gap-3 w-32">
                          <input
                            type="checkbox"
                            checked={config.workingHours[day.key]?.enabled || false}
                            onChange={(e) => updateWorkingHours(day.key, 'enabled', e.target.checked)}
                            className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                          />
                          <Label className="cursor-pointer font-medium">
                            {day.label}
                          </Label>
                        </div>

                        {config.workingHours[day.key]?.enabled && (
                          <div className="flex-1 grid grid-cols-2 gap-4">
                            <div className="space-y-1">
                              <Label className="text-xs text-gray-500">Abertura</Label>
                              <Input
                                type="time"
                                value={config.workingHours[day.key]?.start || '09:00'}
                                onChange={(e) => updateWorkingHours(day.key, 'start', e.target.value)}
                                className="h-9"
                              />
                            </div>
                            <div className="space-y-1">
                              <Label className="text-xs text-gray-500">Fecho</Label>
                              <Input
                                type="time"
                                value={config.workingHours[day.key]?.end || '18:00'}
                                onChange={(e) => updateWorkingHours(day.key, 'end', e.target.value)}
                                className="h-9"
                              />
                            </div>
                          </div>
                        )}
                        
                        {!config.workingHours[day.key]?.enabled && (
                          <span className="flex-1 text-sm text-gray-400 italic">
                            Fechado
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Save Button */}
              <div className="flex justify-end gap-3 sticky bottom-4 bg-white p-4 rounded-lg shadow-lg border">
                <Button
                  variant="outline"
                  onClick={loadConfig}
                  disabled={loading}
                >
                  <X className="h-4 w-4 mr-2" />
                  Cancelar
                </Button>
                <Button
                  onClick={saveConfig}
                  disabled={loading}
                  className="bg-gradient-to-r from-blue-600 to-orange-500 shadow-lg"
                >
                  {loading ? (
                    <>
                      <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full mr-2"></div>
                      A guardar...
                    </>
                  ) : (
                    <>
                      <Save className="h-4 w-4 mr-2" />
                      Guardar Configurações
                    </>
                  )}
                </Button>
              </div>
            </>
          )}
        </TabsContent>
      </Tabs>

      {/* New Appointment Dialog */}
      <Dialog open={showNewAppointmentDialog} onOpenChange={setShowNewAppointmentDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Novo Agendamento</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            {/* Date & Time */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="apt-date">Data *</Label>
                <Input
                  id="apt-date"
                  type="date"
                  value={newAppointment.date}
                  onChange={(e) => setNewAppointment({ ...newAppointment, date: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="apt-time">Hora</Label>
                <Input
                  id="apt-time"
                  type="time"
                  value={newAppointment.startTime}
                  onChange={(e) => setNewAppointment({ ...newAppointment, startTime: e.target.value })}
                />
              </div>
            </div>

            {/* Client Info */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="apt-name">Nome do Cliente *</Label>
                <Input
                  id="apt-name"
                  placeholder="João Silva"
                  value={newAppointment.clientName}
                  onChange={(e) => setNewAppointment({ ...newAppointment, clientName: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="apt-phone">Telefone</Label>
                <Input
                  id="apt-phone"
                  placeholder="+351 912 345 678"
                  value={newAppointment.clientPhone}
                  onChange={(e) => setNewAppointment({ ...newAppointment, clientPhone: e.target.value })}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="apt-email">Email *</Label>
              <Input
                id="apt-email"
                type="email"
                placeholder="cliente@email.com"
                value={newAppointment.clientEmail}
                onChange={(e) => setNewAppointment({ ...newAppointment, clientEmail: e.target.value })}
              />
            </div>

            {/* Service Info */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="apt-plate">Matrícula</Label>
                <Input
                  id="apt-plate"
                  placeholder="XX-00-XX"
                  value={newAppointment.licensePlate}
                  onChange={(e) => setNewAppointment({ ...newAppointment, licensePlate: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="apt-service-id">ID do Serviço *</Label>
                <Input
                  id="apt-service-id"
                  placeholder="service-123"
                  value={newAppointment.serviceId}
                  onChange={(e) => setNewAppointment({ ...newAppointment, serviceId: e.target.value })}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="apt-service-name">Nome do Serviço</Label>
              <Input
                id="apt-service-name"
                placeholder="Ex: Revisão Geral"
                value={newAppointment.serviceName}
                onChange={(e) => setNewAppointment({ ...newAppointment, serviceName: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="apt-notes">Notas</Label>
              <Textarea
                id="apt-notes"
                placeholder="Observações adicionais..."
                value={newAppointment.notes}
                onChange={(e) => setNewAppointment({ ...newAppointment, notes: e.target.value })}
                rows={3}
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowNewAppointmentDialog(false)}
              disabled={loading}
            >
              Cancelar
            </Button>
            <Button
              onClick={handleCreateAppointment}
              disabled={loading}
              className="bg-gradient-to-r from-blue-600 to-orange-500"
            >
              {loading ? (
                <>
                  <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full mr-2"></div>
                  A criar...
                </>
              ) : (
                <>
                  <Plus className="h-4 w-4 mr-2" />
                  Criar Agendamento
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}