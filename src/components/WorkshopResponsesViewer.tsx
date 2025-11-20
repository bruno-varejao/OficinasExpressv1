import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from './ui/card'
import { Button } from './ui/button'
import { Badge } from './ui/badge'
import { Input } from './ui/input'
import { Label } from './ui/label'
import { Textarea } from './ui/textarea'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from './ui/dialog'
import { Calendar } from './ui/calendar'
import {
  CheckCircle2,
  XCircle,
  Edit,
  Building2,
  MapPin,
  Phone,
  Mail,
  Euro,
  Clock,
  Calendar as CalendarIcon,
  AlertCircle,
  ChevronLeft,
  Loader2
} from 'lucide-react'
import { projectId, publicAnonKey } from '../utils/supabase/info'
import { toast } from 'sonner@2.0.3'

interface WorkshopResponse {
  workshopRequestId: string
  workshopId: string
  workshopName: string
  workshopPhone: string
  workshopEmail: string
  workshopAddress: string
  status: 'pending' | 'validated' | 'modified' | 'rejected'
  originalPrice?: number
  originalDuration?: number
  response?: {
    price: number
    duration: number
    notes?: string
    respondedAt: string
  }
  rejectReason?: string
}

interface WorkshopResponsesViewerProps {
  quoteRequestId: string
  clientEmail: string
  onBack: () => void
}

export function WorkshopResponsesViewer({
  quoteRequestId,
  clientEmail,
  onBack
}: WorkshopResponsesViewerProps) {
  const [responses, setResponses] = useState<WorkshopResponse[]>([])
  const [loading, setLoading] = useState(true)
  const [showBookingDialog, setShowBookingDialog] = useState(false)
  const [selectedWorkshop, setSelectedWorkshop] = useState<WorkshopResponse | null>(null)
  const [bookingData, setBookingData] = useState({
    date: undefined as Date | undefined,
    time: '09:00',
    notes: ''
  })
  const [booking, setBooking] = useState(false)
  const [availableDates, setAvailableDates] = useState<Date[]>([])

  useEffect(() => {
    loadResponses()
    const interval = setInterval(loadResponses, 30000) // Refresh every 30 seconds
    return () => clearInterval(interval)
  }, [quoteRequestId])

  const loadResponses = async () => {
    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-6971b43c/public/quote-request/${quoteRequestId}/responses`,
        {
          headers: {
            'Authorization': `Bearer ${publicAnonKey}`
          }
        }
      )

      if (!response.ok) {
        throw new Error('Erro ao carregar respostas')
      }

      const data = await response.json()
      setResponses(data.responses || [])
    } catch (error: any) {
      console.error('Error loading responses:', error)
      toast.error('Erro ao carregar respostas das oficinas')
    } finally {
      setLoading(false)
    }
  }

  const handleOpenBooking = async (workshop: WorkshopResponse) => {
    setSelectedWorkshop(workshop)
    setShowBookingDialog(true)
    
    // Load available dates
    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-6971b43c/public/availability/${workshop.workshopId}`,
        {
          headers: {
            'Authorization': `Bearer ${publicAnonKey}`
          }
        }
      )
      
      if (response.ok) {
        const data = await response.json()
        setAvailableDates(data.availability?.availableDates?.map((d: string) => new Date(d)) || [])
      }
    } catch (error) {
      console.error('Error loading availability:', error)
    }
  }

  const handleConfirmBooking = async () => {
    if (!selectedWorkshop || !bookingData.date) {
      toast.error('Por favor selecione uma data')
      return
    }

    setBooking(true)
    
    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-6971b43c/public/book-appointment`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${publicAnonKey}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            workshopRequestId: selectedWorkshop.workshopRequestId,
            preferredDate: bookingData.date.toISOString().split('T')[0],
            preferredTime: bookingData.time,
            notes: bookingData.notes
          })
        }
      )

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Erro ao confirmar agendamento')
      }

      const data = await response.json()
      
      toast.success('🎉 Agendamento confirmado com sucesso!')
      toast.success('✅ Cliente, veículo e orçamento criados automaticamente na oficina')
      
      setShowBookingDialog(false)
      setSelectedWorkshop(null)
      
      // Reload responses to update status
      loadResponses()
      
    } catch (error: any) {
      console.error('Error booking appointment:', error)
      toast.error(error.message || 'Erro ao confirmar agendamento')
    } finally {
      setBooking(false)
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return (
          <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">
            ⏳ Aguardando Resposta
          </Badge>
        )
      case 'validated':
        return (
          <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
            ✅ Orçamento Validado
          </Badge>
        )
      case 'modified':
        return (
          <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
            ✏️ Orçamento Retificado
          </Badge>
        )
      case 'rejected':
        return (
          <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">
            ❌ Recusado
          </Badge>
        )
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  const pendingCount = responses.filter(r => r.status === 'pending').length
  const respondedCount = responses.filter(r => r.status !== 'pending').length

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-gray-600">A carregar respostas...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* Header */}
      <div className="text-center">
        <Button
          variant="ghost"
          onClick={onBack}
          className="mb-4"
        >
          <ChevronLeft className="h-4 w-4 mr-2" />
          Voltar
        </Button>
        
        <h2 className="text-3xl md:text-4xl mb-4 font-black bg-gradient-to-r from-blue-600 to-orange-600 bg-clip-text text-transparent">
          Respostas das Oficinas
        </h2>
        <p className="text-lg text-gray-600 mb-2">
          <span className="font-bold text-green-600">{respondedCount} oficina(s)</span> respondeu(responderam)
        </p>
        {pendingCount > 0 && (
          <p className="text-sm text-gray-500">
            {pendingCount} ainda aguardam resposta
          </p>
        )}
      </div>

      {/* Info Alert */}
      {pendingCount > 0 && (
        <Card className="max-w-4xl mx-auto bg-gradient-to-br from-blue-50 to-orange-50 border-2 border-blue-200">
          <CardContent className="pt-6">
            <div className="flex items-start gap-4">
              <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-blue-600 to-orange-500 flex items-center justify-center flex-shrink-0">
                <AlertCircle className="h-6 w-6 text-white" />
              </div>
              <div>
                <h3 className="font-bold text-lg text-gray-900 mb-2">
                  Aguarde as Respostas
                </h3>
                <p className="text-gray-600">
                  As oficinas têm até 24 horas para validar ou modificar o orçamento. 
                  Será notificado por email quando todas responderem.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Responses Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-7xl mx-auto">
        {responses.map((response) => (
          <Card 
            key={response.workshopRequestId}
            className={`hover:shadow-xl transition-all ${
              response.status === 'validated' || response.status === 'modified'
                ? 'border-2 border-green-200 bg-green-50/30'
                : ''
            }`}
          >
            <CardHeader>
              <div className="flex items-start justify-between mb-2">
                <div className="flex items-center gap-2">
                  <Building2 className="h-5 w-5 text-blue-600" />
                  <CardTitle className="text-lg">{response.workshopName}</CardTitle>
                </div>
                {getStatusBadge(response.status)}
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Contact Info */}
              <div className="space-y-2 text-sm">
                <div className="flex items-center gap-2 text-gray-600">
                  <MapPin className="h-4 w-4" />
                  <span className="text-xs">{response.workshopAddress}</span>
                </div>
                <div className="flex items-center gap-2 text-gray-600">
                  <Phone className="h-4 w-4" />
                  <span>{response.workshopPhone}</span>
                </div>
                <div className="flex items-center gap-2 text-gray-600">
                  <Mail className="h-4 w-4" />
                  <span className="text-xs">{response.workshopEmail}</span>
                </div>
              </div>

              {/* Response Details */}
              {response.status === 'validated' && response.response && (
                <div className="p-3 bg-green-50 rounded-lg border border-green-200">
                  <div className="flex items-center gap-2 mb-2 text-green-700">
                    <CheckCircle2 className="h-4 w-4" />
                    <span className="font-semibold">Orçamento Validado</span>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div>
                      <div className="flex items-center gap-1 text-gray-600">
                        <Euro className="h-3 w-3" />
                        <span>Preço</span>
                      </div>
                      <p className="font-bold text-green-700">€{response.response.price.toFixed(2)}</p>
                    </div>
                    <div>
                      <div className="flex items-center gap-1 text-gray-600">
                        <Clock className="h-3 w-3" />
                        <span>Duração</span>
                      </div>
                      <p className="font-bold text-green-700">{response.response.duration} min</p>
                    </div>
                  </div>
                  {response.response.notes && (
                    <p className="text-xs text-gray-600 mt-2">{response.response.notes}</p>
                  )}
                </div>
              )}

              {response.status === 'modified' && response.response && (
                <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
                  <div className="flex items-center gap-2 mb-2 text-blue-700">
                    <Edit className="h-4 w-4" />
                    <span className="font-semibold">Orçamento Retificado</span>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div>
                      <div className="flex items-center gap-1 text-gray-600">
                        <Euro className="h-3 w-3" />
                        <span>Novo Preço</span>
                      </div>
                      <p className="font-bold text-blue-700">€{response.response.price.toFixed(2)}</p>
                      {response.originalPrice && (
                        <p className="text-xs text-gray-500 line-through">€{response.originalPrice.toFixed(2)}</p>
                      )}
                    </div>
                    <div>
                      <div className="flex items-center gap-1 text-gray-600">
                        <Clock className="h-3 w-3" />
                        <span>Nova Duração</span>
                      </div>
                      <p className="font-bold text-blue-700">{response.response.duration} min</p>
                      {response.originalDuration && (
                        <p className="text-xs text-gray-500 line-through">{response.originalDuration} min</p>
                      )}
                    </div>
                  </div>
                  {response.response.notes && (
                    <p className="text-xs text-gray-600 mt-2">{response.response.notes}</p>
                  )}
                </div>
              )}

              {response.status === 'rejected' && (
                <div className="p-3 bg-red-50 rounded-lg border border-red-200">
                  <div className="flex items-center gap-2 mb-2 text-red-700">
                    <XCircle className="h-4 w-4" />
                    <span className="font-semibold">Pedido Recusado</span>
                  </div>
                  {response.rejectReason && (
                    <p className="text-sm text-gray-600">{response.rejectReason}</p>
                  )}
                </div>
              )}

              {/* Action Button */}
              {(response.status === 'validated' || response.status === 'modified') && (
                <Button
                  onClick={() => handleOpenBooking(response)}
                  className="w-full bg-gradient-to-r from-blue-600 to-orange-500 hover:from-blue-700 hover:to-orange-600"
                >
                  <CalendarIcon className="h-4 w-4 mr-2" />
                  Agendar Serviço
                </Button>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Booking Dialog */}
      <Dialog open={showBookingDialog} onOpenChange={setShowBookingDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Agendar Serviço</DialogTitle>
            <DialogDescription>
              {selectedWorkshop && (
                <>Oficina: {selectedWorkshop.workshopName}</>
              )}
            </DialogDescription>
          </DialogHeader>

          {selectedWorkshop && (
            <div className="space-y-4">
              {/* Summary */}
              <div className="p-4 bg-gray-50 rounded-lg">
                <h4 className="font-semibold mb-2">Resumo do Orçamento</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-600">Preço</p>
                    <p className="font-bold text-lg">€{selectedWorkshop.response?.price.toFixed(2)}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Duração</p>
                    <p className="font-bold text-lg">{selectedWorkshop.response?.duration} min</p>
                  </div>
                </div>
              </div>

              {/* Date Selection */}
              <div>
                <Label>Selecione a Data</Label>
                <Calendar
                  mode="single"
                  selected={bookingData.date}
                  onSelect={(date) => setBookingData({ ...bookingData, date })}
                  disabled={(date) => {
                    const today = new Date()
                    today.setHours(0, 0, 0, 0)
                    return date < today
                  }}
                  className="rounded-md border"
                />
              </div>

              {/* Time Selection */}
              <div>
                <Label>Hora Preferida</Label>
                <Input
                  type="time"
                  value={bookingData.time}
                  onChange={(e) => setBookingData({ ...bookingData, time: e.target.value })}
                />
              </div>

              {/* Notes */}
              <div>
                <Label>Observações (opcional)</Label>
                <Textarea
                  value={bookingData.notes}
                  onChange={(e) => setBookingData({ ...bookingData, notes: e.target.value })}
                  placeholder="Informações adicionais para a oficina..."
                  rows={3}
                />
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowBookingDialog(false)}>
              Cancelar
            </Button>
            <Button onClick={handleConfirmBooking} disabled={booking || !bookingData.date}>
              {booking ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  A confirmar...
                </>
              ) : (
                'Confirmar Agendamento'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
