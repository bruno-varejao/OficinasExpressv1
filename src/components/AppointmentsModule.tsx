import { useState, useEffect } from 'react'
import { Button } from './ui/button'
import { Input } from './ui/input'
import { Label } from './ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog'
import { Calendar, Clock, Plus, ChevronLeft, ChevronRight, X, CalendarDays } from 'lucide-react'
import { projectId } from '../utils/supabase/info'
import { toast } from 'sonner@2.0.3'
import { Badge } from './ui/badge'
import { Textarea } from './ui/textarea'

interface AppointmentsModuleProps {
  accessToken: string
}

interface Appointment {
  id: string
  clientId: string
  vehicleId: string
  budgetId?: string
  date: string
  startTime: string
  endTime?: string
  technicianId?: string
  boxNumber?: string
  notes?: string
  status: 'scheduled' | 'in-progress' | 'completed' | 'cancelled'
  createdAt: string
}

interface Client {
  id: string
  name: string
}

interface Vehicle {
  id: string
  licensePlate: string
  brand: string
  model: string
  clientId: string
}

interface Budget {
  id: string
  number: string
  items: any[]
}

export function AppointmentsModule({ accessToken }: AppointmentsModuleProps) {
  const [appointments, setAppointments] = useState<Appointment[]>([])
  const [clients, setClients] = useState<Client[]>([])
  const [vehicles, setVehicles] = useState<Vehicle[]>([])
  const [budgets, setBudgets] = useState<Budget[]>([])
  const [loading, setLoading] = useState(false)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [detailsDialogOpen, setDetailsDialogOpen] = useState(false)
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null)
  
  const [currentDate, setCurrentDate] = useState(new Date())
  const [viewMode, setViewMode] = useState<'week' | 'day' | 'month'>('week')
  
  // Form states
  const [selectedClientId, setSelectedClientId] = useState('')
  const [selectedVehicleId, setSelectedVehicleId] = useState('')
  const [appointmentDate, setAppointmentDate] = useState('')
  const [startTime, setStartTime] = useState('')
  const [endTime, setEndTime] = useState('')
  const [technician, setTechnician] = useState('')
  const [boxNumber, setBoxNumber] = useState('')
  const [notes, setNotes] = useState('')

  useEffect(() => {
    fetchAppointments()
    fetchClients()
    fetchVehicles()
    fetchBudgets()
  }, [])

  const fetchAppointments = async () => {
    setLoading(true)
    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-6971b43c/appointments`,
        {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
          },
        }
      )

      if (response.ok) {
        const data = await response.json()
        setAppointments(data.appointments || [])
      }
    } catch (error) {
      console.error('Error fetching appointments:', error)
      toast.error('Erro ao carregar agendamentos')
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

  const fetchBudgets = async () => {
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
        setBudgets(data.budgets || [])
      }
    } catch (error) {
      console.error('Error fetching budgets:', error)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!selectedClientId || !selectedVehicleId || !appointmentDate || !startTime) {
      toast.error('Preencha os campos obrigatórios')
      return
    }

    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-6971b43c/appointments`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            clientId: selectedClientId,
            vehicleId: selectedVehicleId,
            date: appointmentDate,
            startTime,
            endTime: endTime || undefined,
            technicianId: technician || undefined,
            boxNumber: boxNumber || undefined,
            notes: notes || undefined,
            status: 'scheduled',
          }),
        }
      )

      if (response.ok) {
        toast.success('Agendamento criado com sucesso')
        setDialogOpen(false)
        fetchAppointments()
        resetForm()
      } else {
        toast.error('Erro ao criar agendamento')
      }
    } catch (error) {
      console.error('Error creating appointment:', error)
      toast.error('Erro ao criar agendamento')
    }
  }

  const resetForm = () => {
    setSelectedClientId('')
    setSelectedVehicleId('')
    setAppointmentDate('')
    setStartTime('')
    setEndTime('')
    setTechnician('')
    setBoxNumber('')
    setNotes('')
  }

  const deleteAppointment = async (id: string) => {
    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-6971b43c/appointments/${id}`,
        {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${accessToken}`,
          },
        }
      )

      if (response.ok) {
        toast.success('Agendamento cancelado')
        setDetailsDialogOpen(false)
        fetchAppointments()
      } else {
        toast.error('Erro ao cancelar agendamento')
      }
    } catch (error) {
      console.error('Error deleting appointment:', error)
      toast.error('Erro ao cancelar agendamento')
    }
  }

  // Week navigation
  const getWeekDays = (date: Date) => {
    const days = []
    const startOfWeek = new Date(date)
    const dayOfWeek = startOfWeek.getDay()
    const diff = dayOfWeek === 0 ? -6 : 1 - dayOfWeek
    startOfWeek.setDate(startOfWeek.getDate() + diff)

    for (let i = 0; i < 7; i++) {
      const day = new Date(startOfWeek)
      day.setDate(startOfWeek.getDate() + i)
      days.push(day)
    }

    return days
  }

  const weekDays = getWeekDays(currentDate)

  const navigateWeek = (direction: 'prev' | 'next') => {
    const newDate = new Date(currentDate)
    newDate.setDate(currentDate.getDate() + (direction === 'next' ? 7 : -7))
    setCurrentDate(newDate)
  }

  const goToToday = () => {
    setCurrentDate(new Date())
  }

  // Time slots (08:00 to 18:00)
  const timeSlots = []
  for (let hour = 8; hour <= 18; hour++) {
    timeSlots.push(`${hour.toString().padStart(2, '0')}:00`)
    if (hour < 18) {
      timeSlots.push(`${hour.toString().padStart(2, '0')}:30`)
    }
  }

  // Filter appointments for current week
  const getAppointmentsForDay = (date: Date) => {
    const dateStr = date.toISOString().split('T')[0]
    return appointments.filter(apt => apt.date === dateStr)
  }

  const getAppointmentColor = (appointment: Appointment) => {
    const budget = budgets.find(b => b && b.id === appointment.budgetId)
    const items = budget?.items || []
    
    // Color based on service type
    if (items.some((item: any) => item.description?.toLowerCase().includes('estética'))) {
      return 'bg-yellow-200 border-yellow-400'
    }
    if (items.some((item: any) => item.description?.toLowerCase().includes('óleo'))) {
      return 'bg-green-200 border-green-400'
    }
    if (items.some((item: any) => item.description?.toLowerCase().includes('pneu'))) {
      return 'bg-orange-200 border-orange-400'
    }
    if (items.some((item: any) => item.description?.toLowerCase().includes('chapa'))) {
      return 'bg-pink-200 border-pink-400'
    }
    
    // Default colors based on status
    switch (appointment.status) {
      case 'scheduled':
        return 'bg-blue-200 border-blue-400'
      case 'in-progress':
        return 'bg-purple-200 border-purple-400'
      case 'completed':
        return 'bg-green-200 border-green-400'
      case 'cancelled':
        return 'bg-gray-200 border-gray-400'
      default:
        return 'bg-blue-200 border-blue-400'
    }
  }

  const getAppointmentPosition = (startTime: string, endTime?: string) => {
    const [startHour, startMin] = startTime.split(':').map(Number)
    const startMinutes = (startHour - 8) * 60 + startMin
    const top = (startMinutes / 30) * 48 // 48px per 30min slot
    
    let duration = 60 // default 1 hour
    if (endTime) {
      const [endHour, endMin] = endTime.split(':').map(Number)
      const endMinutes = (endHour - 8) * 60 + endMin
      duration = endMinutes - startMinutes
    }
    
    const height = (duration / 30) * 48
    
    return { top, height }
  }

  const getClientName = (clientId: string) => {
    const client = clients.find(c => c && c.id === clientId)
    return client?.name || 'N/A'
  }

  const getVehicleInfo = (vehicleId: string) => {
    const vehicle = vehicles.find(v => v && v.id === vehicleId)
    if (!vehicle) return 'N/A'
    return `${vehicle.brand} ${vehicle.model}`
  }

  const getServiceDescription = (appointment: Appointment) => {
    const budget = budgets.find(b => b && b.id === appointment.budgetId)
    const items = budget?.items || []
    
    if (items.length === 0) return 'Serviço geral'
    
    const firstItem = items[0]
    return firstItem.description || 'Serviço'
  }

  const formatMonthYear = (date: Date) => {
    return date.toLocaleDateString('pt-PT', { month: 'long', year: 'numeric' })
  }

  const formatDayHeader = (date: Date) => {
    const dayName = date.toLocaleDateString('pt-PT', { weekday: 'short' })
    const dayNumber = date.getDate()
    return `${dayName.charAt(0).toUpperCase() + dayName.slice(1)} ${dayNumber}`
  }

  const isToday = (date: Date) => {
    const today = new Date()
    return date.toDateString() === today.toDateString()
  }

  const getWeekNumber = (date: Date) => {
    const firstDayOfYear = new Date(date.getFullYear(), 0, 1)
    const pastDaysOfYear = (date.getTime() - firstDayOfYear.getTime()) / 86400000
    return Math.ceil((pastDaysOfYear + firstDayOfYear.getDay() + 1) / 7)
  }

  const availableVehicles = vehicles.filter(v => v.clientId === selectedClientId)

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <h2 className="text-2xl capitalize">{formatMonthYear(currentDate)}</h2>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => navigateWeek('prev')}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="text-sm text-muted-foreground">
              Semana {getWeekNumber(currentDate)}
            </span>
            <Button variant="outline" size="sm" onClick={() => navigateWeek('next')}>
              <ChevronRight className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="sm" onClick={goToToday}>
              Hoje
            </Button>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex gap-1 bg-muted rounded-md p-1">
            <Button
              variant={viewMode === 'day' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('day')}
            >
              Dia
            </Button>
            <Button
              variant={viewMode === 'week' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('week')}
            >
              Semana
            </Button>
            <Button
              variant={viewMode === 'month' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('month')}
            >
              Mês
            </Button>
          </div>

          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Novo Agendamento
              </Button>
            </DialogTrigger>
            <DialogContent className="dialog-fullscreen overflow-y-auto">
              <form onSubmit={handleSubmit}>
                <DialogHeader>
                  <DialogTitle>Criar Agendamento</DialogTitle>
                  <DialogDescription>
                    Agende um serviço para um cliente
                  </DialogDescription>
                </DialogHeader>
                
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label htmlFor="client">Cliente *</Label>
                    <select
                      id="client"
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
                    <Label htmlFor="vehicle">Veículo *</Label>
                    <select
                      id="vehicle"
                      className="w-full rounded-md border border-input bg-input-background px-3 py-2"
                      value={selectedVehicleId}
                      onChange={(e) => setSelectedVehicleId(e.target.value)}
                      required
                      disabled={!selectedClientId}
                    >
                      <option value="">Selecione um veículo</option>
                      {availableVehicles.filter(v => v).map((vehicle) => (
                        <option key={vehicle.id} value={vehicle.id}>
                          {vehicle.licensePlate} - {vehicle.brand} {vehicle.model}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="date">Data *</Label>
                      <Input
                        id="date"
                        type="date"
                        value={appointmentDate}
                        onChange={(e) => setAppointmentDate(e.target.value)}
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="startTime">Hora Início *</Label>
                      <Input
                        id="startTime"
                        type="time"
                        value={startTime}
                        onChange={(e) => setStartTime(e.target.value)}
                        required
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="endTime">Hora Fim</Label>
                      <Input
                        id="endTime"
                        type="time"
                        value={endTime}
                        onChange={(e) => setEndTime(e.target.value)}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="box">Caixa / Box</Label>
                      <Input
                        id="box"
                        placeholder="Ex: Box 1"
                        value={boxNumber}
                        onChange={(e) => setBoxNumber(e.target.value)}
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="technician">Técnico</Label>
                    <Input
                      id="technician"
                      placeholder="Nome do técnico"
                      value={technician}
                      onChange={(e) => setTechnician(e.target.value)}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="notes">Notas</Label>
                    <Textarea
                      id="notes"
                      placeholder="Observações sobre o agendamento..."
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      rows={3}
                    />
                  </div>
                </div>

                <DialogFooter>
                  <Button type="submit">Criar Agendamento</Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Calendar Grid */}
      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="text-center py-12 text-muted-foreground">A carregar...</div>
          ) : (
            <div className="overflow-x-auto">
              <div className="min-w-[900px]">
                {/* Week Header */}
                <div className="grid grid-cols-[60px_repeat(7,1fr)] border-b bg-muted/30">
                  <div className="p-2"></div>
                  {weekDays.map((day, idx) => (
                    <div
                      key={idx}
                      className={`p-3 text-center border-l ${
                        isToday(day) ? 'bg-primary/10' : ''
                      }`}
                    >
                      <div className="text-sm text-muted-foreground">
                        {formatDayHeader(day)}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Time Grid */}
                <div className="grid grid-cols-[60px_repeat(7,1fr)] relative">
                  {/* Time labels */}
                  <div className="border-r">
                    {timeSlots.map((time, idx) => (
                      <div
                        key={idx}
                        className="h-12 flex items-start justify-end pr-2 text-xs text-muted-foreground border-b"
                      >
                        {time}
                      </div>
                    ))}
                  </div>

                  {/* Day columns */}
                  {weekDays.map((day, dayIdx) => {
                    const dayAppointments = getAppointmentsForDay(day)
                    
                    return (
                      <div
                        key={dayIdx}
                        className={`relative border-l ${
                          isToday(day) ? 'bg-primary/5' : ''
                        }`}
                      >
                        {/* Time grid lines */}
                        {timeSlots.map((_, idx) => (
                          <div key={idx} className="h-12 border-b"></div>
                        ))}

                        {/* Appointments */}
                        <div className="absolute inset-0 pointer-events-none">
                          {dayAppointments.filter(a => a).map((appointment) => {
                            const { top, height } = getAppointmentPosition(
                              appointment.startTime,
                              appointment.endTime
                            )
                            const colorClass = getAppointmentColor(appointment)

                            return (
                              <div
                                key={appointment.id}
                                className={`absolute left-1 right-1 rounded border-l-4 p-1 cursor-pointer pointer-events-auto overflow-hidden ${colorClass}`}
                                style={{ top: `${top}px`, height: `${height}px` }}
                                onClick={() => {
                                  setSelectedAppointment(appointment)
                                  setDetailsDialogOpen(true)
                                }}
                              >
                                <div className="text-xs space-y-0.5">
                                  <div className="truncate">
                                    {getClientName(appointment.clientId)}
                                  </div>
                                  <div className="text-muted-foreground truncate text-[10px]">
                                    {getServiceDescription(appointment)}
                                  </div>
                                  <div className="text-muted-foreground text-[10px]">
                                    {appointment.startTime}
                                    {appointment.endTime && ` - ${appointment.endTime}`}
                                  </div>
                                </div>
                              </div>
                            )
                          })}
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Appointment Details Dialog */}
      {selectedAppointment && (
        <Dialog open={detailsDialogOpen} onOpenChange={setDetailsDialogOpen}>
          <DialogContent className="dialog-fullscreen overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{getClientName(selectedAppointment.clientId)}</DialogTitle>
              <DialogDescription>
                {new Date(selectedAppointment.date).toLocaleDateString('pt-PT', {
                  day: 'numeric',
                  month: 'long',
                  year: 'numeric'
                })}
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-4">
              <div className="flex items-start gap-3">
                <CalendarDays className="h-5 w-5 text-muted-foreground mt-0.5" />
                <div>
                  <div className="text-sm">
                    {selectedAppointment.startTime}
                    {selectedAppointment.endTime && ` - ${selectedAppointment.endTime}`}
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <div className="text-sm">
                  <span className="text-muted-foreground">Veículo:</span>{' '}
                  {getVehicleInfo(selectedAppointment.vehicleId)}
                </div>
                <div className="text-sm">
                  <span className="text-muted-foreground">Matrícula:</span>{' '}
                  {vehicles.find(v => v && v.id === selectedAppointment.vehicleId)?.licensePlate}
                </div>
              </div>

              {selectedAppointment.technicianId && (
                <div className="text-sm">
                  <span className="text-muted-foreground">Técnico:</span>{' '}
                  {selectedAppointment.technicianId}
                </div>
              )}

              {selectedAppointment.boxNumber && (
                <div className="text-sm">
                  <span className="text-muted-foreground">Box:</span>{' '}
                  {selectedAppointment.boxNumber}
                </div>
              )}

              {selectedAppointment.notes && (
                <div className="text-sm">
                  <span className="text-muted-foreground">Notas:</span>
                  <p className="mt-1 text-sm bg-muted p-2 rounded">
                    {selectedAppointment.notes}
                  </p>
                </div>
              )}

              <div className="flex items-center gap-2">
                <Badge
                  variant={
                    selectedAppointment.status === 'completed'
                      ? 'default'
                      : selectedAppointment.status === 'cancelled'
                      ? 'destructive'
                      : 'secondary'
                  }
                >
                  {selectedAppointment.status === 'scheduled' && 'Agendado'}
                  {selectedAppointment.status === 'in-progress' && 'Em Progresso'}
                  {selectedAppointment.status === 'completed' && 'Concluído'}
                  {selectedAppointment.status === 'cancelled' && 'Cancelado'}
                </Badge>
              </div>
            </div>

            <DialogFooter className="gap-2">
              <Button
                variant="destructive"
                onClick={() => deleteAppointment(selectedAppointment.id)}
              >
                Cancelar Agendamento
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  )
}
