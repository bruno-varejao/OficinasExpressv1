import { useState, useEffect } from 'react'
import { Bell } from 'lucide-react'
import { Button } from './ui/button'
import { Badge } from './ui/badge'
import { Card, CardContent } from './ui/card'
import { ScrollArea } from './ui/scroll-area'
import { Popover, PopoverContent, PopoverTrigger } from './ui/popover'
import { projectId } from '../utils/supabase/info'
import { toast } from 'sonner@2.0.3'

export interface Notification {
  id: string
  type: 'new_quote_request' | 'quote_accepted' | 'client_message' | 'quote_response' | 'client_chose_workshop' | 'budget_auto_created' | 'appointment_scheduled' | 'new_instant_quote' | 'quote_rectification' | 'new_appointment_request' | 'appointment_reschedule_request' | 'quote_cancelled'
  title?: string
  message?: string
  budgetId?: string
  workOrderId?: string
  requestId?: string
  quoteRequestId?: string
  appointmentId?: string
  serviceName?: string
  licensePlate?: string
  action?: string
  clientEmail?: string
  clientName?: string
  clientPhone?: string
  date?: string
  time?: string
  total?: string
  read: boolean
  createdAt: string
}

interface NotificationBellProps {
  accessToken: string
  workshopId: string
  onNotificationClick?: (notification: Notification) => void
}

export function NotificationBell({ accessToken, workshopId, onNotificationClick }: NotificationBellProps) {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)

  // Fetch notifications
  const fetchNotifications = async () => {
    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-6971b43c/workshops/${workshopId}/notifications`,
        {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
          },
        }
      )

      if (response.ok) {
        const data = await response.json()
        setNotifications(data.notifications || [])
        setUnreadCount(data.unreadCount || 0)
      }
    } catch (error) {
      // Silently fail - notifications are not critical for app functionality
      // Only log in development
      if (process.env.NODE_ENV === 'development') {
        console.error('Error fetching notifications:', error)
      }
    }
  }

  // Mark notification as read
  const markAsRead = async (notificationId: string) => {
    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-6971b43c/workshops/${workshopId}/notifications/${notificationId}/read`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${accessToken}`,
          },
        }
      )

      if (response.ok) {
        // Update local state
        setNotifications(prev => 
          prev.map(n => n.id === notificationId ? { ...n, read: true } : n)
        )
        setUnreadCount(prev => Math.max(0, prev - 1))
      }
    } catch (error) {
      console.error('Error marking notification as read:', error)
    }
  }

  // Mark all as read
  const markAllAsRead = async () => {
    try {
      setLoading(true)
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-6971b43c/workshops/${workshopId}/notifications/read-all`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${accessToken}`,
          },
        }
      )

      if (response.ok) {
        setNotifications(prev => prev.map(n => ({ ...n, read: true })))
        setUnreadCount(0)
        toast.success('Todas as notificações foram marcadas como lidas')
      }
    } catch (error) {
      console.error('Error marking all as read:', error)
      toast.error('Erro ao marcar notificações como lidas')
    } finally {
      setLoading(false)
    }
  }

  // Handle notification click
  const handleNotificationClick = async (notification: Notification) => {
    if (!notification.read) {
      await markAsRead(notification.id)
    }
    
    if (onNotificationClick) {
      onNotificationClick(notification)
    }
    
    setOpen(false)
  }

  // Fetch notifications on mount and set up polling
  useEffect(() => {
    fetchNotifications()
    
    // Poll every 30 seconds
    const interval = setInterval(() => {
      fetchNotifications()
    }, 30000)

    return () => clearInterval(interval)
  }, [accessToken, workshopId])

  // Get notification title based on type
  const getNotificationTitle = (notification: Notification): string => {
    switch (notification.type) {
      case 'new_quote_request':
        return 'Novo Pedido de Orçamento'
      case 'client_chose_workshop':
        return '🎉 Cliente Escolheu a Sua Oficina!'
      case 'quote_response':
        return 'Resposta ao Seu Pedido'
      case 'quote_accepted':
        return 'Orçamento Aceite'
      case 'client_message':
        return 'Nova Mensagem de Cliente'
      case 'budget_auto_created':
        return '💰 Orçamento Criado Automaticamente'
      case 'appointment_scheduled':
        return '📅 Novo Agendamento'
      case 'new_instant_quote':
        return '🎯 Novo Orçamento Instantâneo'
      case 'quote_rectification':
        return '✏️ Orçamento Retificado'
      case 'new_appointment_request':
        return 'Novo Pedido de Agendamento'
      case 'appointment_reschedule_request':
        return 'Pedido de Reagendamento'
      case 'quote_cancelled':
        return '🚫 Pedido Cancelado pelo Cliente'
      default:
        return 'Notificação'
    }
  }

  // Get notification message based on type
  const getNotificationMessage = (notification: Notification): string => {
    switch (notification.type) {
      case 'new_quote_request':
        return `Pedido de ${notification.serviceName || 'serviço'} para ${notification.licensePlate || 'veículo'}`
      case 'client_chose_workshop':
        return `O cliente ${notification.clientName || ''} escolheu a sua oficina para ${notification.serviceName || 'o serviço'}. Entre em contacto para agendar.`
      case 'quote_response':
        const action = notification.action === 'validated' ? 'validou' : notification.action === 'modified' ? 'modificou' : 'respondeu ao'
        return `A oficina ${action} o seu pedido de orçamento`
      case 'budget_auto_created':
        return notification.message || `Orçamento criado para ${notification.serviceName || 'serviço'} - ${notification.licensePlate || 'veículo'}`
      case 'appointment_scheduled':
        return notification.message || `Novo agendamento para ${notification.serviceName || 'serviço'}`
      case 'new_instant_quote':
        return notification.message || `Pedido de ${notification.serviceName || 'serviço'} para ${notification.licensePlate || 'veículo'}`
      case 'quote_rectification':
        return notification.message || `Orçamento retificado para ${notification.serviceName || 'serviço'} - ${notification.licensePlate || 'veículo'}`
      case 'new_appointment_request':
        return notification.message || `Cliente solicitou agendamento para ${notification.serviceName || 'serviço'}`
      case 'appointment_reschedule_request':
        return notification.message || `Cliente solicitou reagendamento`
      case 'quote_cancelled':
        return notification.message || `O orçamento para ${notification.serviceName || 'serviço'} - ${notification.licensePlate || 'veículo'} foi cancelado`
      default:
        return notification.message || ''
    }
  }

  // Format date
  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diff = now.getTime() - date.getTime()
    const minutes = Math.floor(diff / 60000)
    const hours = Math.floor(diff / 3600000)
    const days = Math.floor(diff / 86400000)

    if (minutes < 1) return 'agora mesmo'
    if (minutes < 60) return `há ${minutes} min`
    if (hours < 24) return `há ${hours}h`
    if (days === 1) return 'ontem'
    if (days < 7) return `há ${days} dias`
    
    return date.toLocaleDateString('pt-PT', { 
      day: '2-digit', 
      month: '2-digit',
      year: 'numeric'
    })
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="relative hover:bg-blue-50"
        >
          <Bell className="h-5 w-5 text-gray-700" />
          {unreadCount > 0 && (
            <Badge 
              className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 bg-gradient-to-r from-red-500 to-orange-500 border-2 border-white text-white"
            >
              {unreadCount > 9 ? '9+' : unreadCount}
            </Badge>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-96 p-0" align="end">
        <div className="border-b bg-gradient-to-r from-blue-50 to-orange-50 px-4 py-3">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-gray-900">Notificações</h3>
            {unreadCount > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={markAllAsRead}
                disabled={loading}
                className="text-xs text-blue-600 hover:text-blue-700 hover:bg-blue-100"
              >
                Marcar todas como lidas
              </Button>
            )}
          </div>
        </div>
        
        <ScrollArea className="h-[400px]">
          {notifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 px-4">
              <div className="h-16 w-16 rounded-full bg-gradient-to-br from-blue-100 to-orange-100 flex items-center justify-center mb-3">
                <Bell className="h-8 w-8 text-blue-600" />
              </div>
              <p className="text-sm text-gray-500 text-center">
                Nenhuma notificação
              </p>
            </div>
          ) : (
            <div className="divide-y">
              {notifications.map((notification) => (
                <button
                  key={notification.id}
                  onClick={() => handleNotificationClick(notification)}
                  className={`w-full text-left p-4 transition-colors hover:bg-blue-50 ${
                    !notification.read ? 'bg-blue-50/50' : 'bg-white'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div className={`mt-1 h-2 w-2 rounded-full flex-shrink-0 ${
                      !notification.read ? 'bg-blue-600' : 'bg-gray-300'
                    }`} />
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm ${
                        !notification.read ? 'font-semibold text-gray-900' : 'font-medium text-gray-700'
                      }`}>
                        {notification.title || getNotificationTitle(notification)}
                      </p>
                      <p className="text-sm text-gray-600 mt-1">
                        {notification.message || getNotificationMessage(notification)}
                      </p>
                      <p className="text-xs text-gray-500 mt-2">
                        {formatDate(notification.createdAt)}
                      </p>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </ScrollArea>
      </PopoverContent>
    </Popover>
  )
}