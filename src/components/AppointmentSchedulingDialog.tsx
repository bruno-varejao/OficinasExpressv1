import { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from './ui/dialog'
import { Button } from './ui/button'
import { Input } from './ui/input'
import { Label } from './ui/label'
import { Textarea } from './ui/textarea'
import { Calendar as CalendarIcon, Clock, AlertCircle, CheckCircle, XCircle } from 'lucide-react'
import { Calendar } from './ui/calendar'
import { Popover, PopoverContent, PopoverTrigger } from './ui/popover'
import { Badge } from './ui/badge'
import { projectId, publicAnonKey } from '../utils/supabase/info'

interface AppointmentSchedulingDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  workshopId: string
  workshopName: string
  serviceName: string
  onConfirm: (preferredDate: string, preferredTime: string, notes: string) => void
  loading: boolean
}

export function AppointmentSchedulingDialog({
  open,
  onOpenChange,
  workshopId,
  workshopName,
  serviceName,
  onConfirm,
  loading
}: AppointmentSchedulingDialogProps) {
  const [selectedDate, setSelectedDate] = useState<Date>()
  const [selectedTime, setSelectedTime] = useState('')
  const [notes, setNotes] = useState('')
  const [checkingAvailability, setCheckingAvailability] = useState(false)
  const [availability, setAvailability] = useState<{
    available: boolean
    usedSlots: number
    totalSlots: number
    alternativeDates: string[]
  } | null>(null)
  
  console.log('📅 DIALOG: Appointment Dialog render:', {
    open,
    workshopName,
    serviceName,
    loading
  })

  // Check availability when date changes
  const checkAvailability = async (date: Date) => {
    if (!date) return
    
    setCheckingAvailability(true)
    try {
      const dateStr = date.toISOString().split('T')[0]
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-6971b43c/public/check-availability?workshopId=${workshopId}&date=${dateStr}`,
        {
          headers: {
            'Authorization': `Bearer ${publicAnonKey}`
          }
        }
      )
      
      if (response.ok) {
        const data = await response.json()
        setAvailability(data)
      }
    } catch (error) {
      console.error('Error checking availability:', error)
    } finally {
      setCheckingAvailability(false)
    }
  }
  
  const handleDateSelect = (date: Date | undefined) => {
    setSelectedDate(date)
    setAvailability(null)
    if (date) {
      checkAvailability(date)
    }
  }

  const handleConfirm = () => {
    console.log('📅 DIALOG: Confirm clicked:', {
      selectedDate,
      selectedTime,
      notes
    })
    
    if (!selectedDate || !selectedTime) {
      console.warn('⚠️ DIALOG: Missing date or time!')
      return
    }

    const dateStr = selectedDate.toISOString().split('T')[0]
    console.log('✅ DIALOG: Calling onConfirm with:', { dateStr, selectedTime, notes })
    onConfirm(dateStr, selectedTime, notes)
  }

  // Generate time slots (9:00 - 18:00 in 30 min intervals)
  const timeSlots = []
  for (let hour = 9; hour <= 18; hour++) {
    for (let min = 0; min < 60; min += 30) {
      if (hour === 18 && min > 0) break // Stop at 18:00
      const time = `${hour.toString().padStart(2, '0')}:${min.toString().padStart(2, '0')}`
      timeSlots.push(time)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="text-2xl">Agendar Serviço</DialogTitle>
          <DialogDescription>
            Solicite um agendamento com <strong>{workshopName}</strong> para <strong>{serviceName}</strong>
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Info Alert */}
          <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
            <div className="flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-blue-600 mt-0.5" />
              <div className="flex-1">
                <p className="text-sm text-blue-900 font-semibold mb-1">
                  Como funciona?
                </p>
                <p className="text-sm text-blue-700">
                  Indique a sua data e hora preferidas. A oficina receberá o seu pedido e
                  poderá confirmar ou propor uma alternativa. Será notificado da resposta.
                </p>
              </div>
            </div>
          </div>

          {/* Date Selection */}
          <div className="space-y-2">
            <Label htmlFor="date">Data Preferida *</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={`w-full justify-start text-left font-normal ${
                    !selectedDate && 'text-muted-foreground'
                  }`}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {selectedDate ? (
                    selectedDate.toLocaleDateString('pt-PT', {
                      day: '2-digit',
                      month: 'long',
                      year: 'numeric'
                    })
                  ) : (
                    'Selecione uma data'
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={selectedDate}
                  onSelect={handleDateSelect}
                  disabled={(date) => {
                    // Disable past dates and Sundays
                    const today = new Date()
                    today.setHours(0, 0, 0, 0)
                    return date < today || date.getDay() === 0
                  }}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>

          {/* Time Selection */}
          <div className="space-y-2">
            <Label htmlFor="time">Hora Preferida *</Label>
            <div className="relative">
              <Clock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <select
                id="time"
                value={selectedTime}
                onChange={(e) => setSelectedTime(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">Selecione uma hora</option>
                {timeSlots.map((time) => (
                  <option key={time} value={time}>
                    {time}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Availability Check */}
          {selectedDate && (
            <div className="space-y-3">
              {checkingAvailability ? (
                <div className="p-4 bg-gray-50 rounded-lg border border-gray-200 flex items-center gap-3">
                  <div className="animate-spin h-5 w-5 border-2 border-blue-600 border-t-transparent rounded-full"></div>
                  <span className="text-sm text-gray-700">A verificar disponibilidade...</span>
                </div>
              ) : availability ? (
                <>
                  {availability.available ? (
                    <div className="p-4 bg-green-50 rounded-lg border border-green-200">
                      <div className="flex items-start gap-3">
                        <CheckCircle className="h-5 w-5 text-green-600 mt-0.5" />
                        <div className="flex-1">
                          <p className="text-sm text-green-900 font-semibold mb-1">
                            ✅ Data Disponível
                          </p>
                          <p className="text-sm text-green-700">
                            Esta data tem vagas disponíveis! ({availability.totalSlots - availability.usedSlots} de {availability.totalSlots} vagas livres)
                          </p>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <div className="p-4 bg-red-50 rounded-lg border border-red-200">
                        <div className="flex items-start gap-3">
                          <XCircle className="h-5 w-5 text-red-600 mt-0.5" />
                          <div className="flex-1">
                            <p className="text-sm text-red-900 font-semibold mb-1">
                              ❌ Data Sem Disponibilidade
                            </p>
                            <p className="text-sm text-red-700">
                              Infelizmente esta data está totalmente preenchida ({availability.usedSlots}/{availability.totalSlots} vagas ocupadas).
                            </p>
                          </div>
                        </div>
                      </div>
                      
                      {availability.alternativeDates.length > 0 && (
                        <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                          <p className="text-sm text-blue-900 font-semibold mb-3">
                            📅 Datas Alternativas Disponíveis:
                          </p>
                          <div className="flex flex-wrap gap-2">
                            {availability.alternativeDates.map((altDate) => (
                              <Button
                                key={altDate}
                                size="sm"
                                variant="outline"
                                className="border-blue-300 text-blue-700 hover:bg-blue-100"
                                onClick={() => {
                                  const date = new Date(altDate + 'T00:00:00')
                                  handleDateSelect(date)
                                }}
                              >
                                <CalendarIcon className="h-3 w-3 mr-1" />
                                {new Date(altDate + 'T00:00:00').toLocaleDateString('pt-PT', {
                                  day: '2-digit',
                                  month: 'short',
                                  year: 'numeric'
                                })}
                              </Button>
                            ))}
                          </div>
                          <p className="text-xs text-blue-600 mt-3">
                            💡 Clique numa data alternativa para a selecionar automaticamente
                          </p>
                        </div>
                      )}
                    </div>
                  )}
                </>
              ) : null}
            </div>
          )}

          {/* Notes */}
          <div className="space-y-2">
            <Label htmlFor="notes">Notas Adicionais (Opcional)</Label>
            <Textarea
              id="notes"
              placeholder="Ex: Prefiro pela manhã, tenho disponibilidade até às 12h..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
            />
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={loading}
          >
            Cancelar
          </Button>
          <Button
            onClick={handleConfirm}
            disabled={!selectedDate || !selectedTime || loading}
            className="bg-gradient-to-r from-blue-600 to-orange-500"
          >
            {loading ? (
              <>
                <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full mr-2"></div>
                A enviar...
              </>
            ) : (
              <>
                <CalendarIcon className="h-4 w-4 mr-2" />
                Solicitar Agendamento
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}