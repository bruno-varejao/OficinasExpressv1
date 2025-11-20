import { useState, useEffect } from 'react'
import { Bell } from 'lucide-react'
import { Button } from './ui/button'
import { Badge } from './ui/badge'
import { ScrollArea } from './ui/scroll-area'
import { Popover, PopoverContent, PopoverTrigger } from './ui/popover'
import { projectId } from '../utils/supabase/info'

export interface ClientNotification {
  id: string
  type: 'quote_response' | 'quote_accepted' | 'budget_validation_required'
  clientEmail: string
  quoteRequestId?: string
  workshopId?: string
  requestId?: string
  budgetId?: string
  action?: string
  serviceName?: string
  licensePlate?: string
  total?: string
  read: boolean
  createdAt: string
}

interface ClientNotificationBellProps {
  clientEmail: string
  onNotificationClick?: (notification: ClientNotification) => void
}

export function ClientNotificationBell({ clientEmail, onNotificationClick }: ClientNotificationBellProps) {
  const [notifications, setNotifications] = useState<ClientNotification[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [open, setOpen] = useState(false)

  // Fetch notifications
  const fetchNotifications = async () => {
    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-6971b43c/client/notifications?email=${encodeURIComponent(clientEmail)}`,
        {
          headers: {
            'Content-Type': 'application/json',
          },
        }
      )

      if (response.ok) {
        const data = await response.json()
        setNotifications(data.notifications || [])
        setUnreadCount(data.unreadCount || 0)
      }
    } catch (error) {
      // Silently fail
      console.error('Error fetching client notifications:', error)
    }
  }

  // Mark notification as read
  const markAsRead = async (notificationId: string) => {
    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-6971b43c/client/notifications/${notificationId}/read`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ clientEmail })
        }
      )

      if (response.ok) {
        setNotifications(prev => 
          prev.map(n => n.id === notificationId ? { ...n, read: true } : n)
        )
        setUnreadCount(prev => Math.max(0, prev - 1))
      }
    } catch (error) {
      console.error('Error marking notification as read:', error)
    }
  }

  // Handle notification click
  const handleNotificationClick = async (notification: ClientNotification) => {
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
    if (clientEmail) {
      fetchNotifications()
      
      // Poll every 30 seconds
      const interval = setInterval(() => {
        fetchNotifications()
      }, 30000)

      return () => clearInterval(interval)
    }
  }, [clientEmail])

  // Get notification title based on type
  const getNotificationTitle = (notification: ClientNotification): string => {
    switch (notification.type) {
      case 'quote_response':
        const action = notification.action === 'validated' ? 'Validado' : notification.action === 'modified' ? 'Modificado' : 'Respondido'
        return `Orçamento ${action}`
      case 'quote_accepted':
        return 'Orçamento Aceite pela Oficina'
      case 'budget_validation_required':
        return 'Validação de Orçamento Requerida'
      default:
        return 'Notificação'
    }
  }

  // Get notification message based on type
  const getNotificationMessage = (notification: ClientNotification): string => {
    switch (notification.type) {
      case 'quote_response':
        const action = notification.action === 'validated' ? 'validou' : notification.action === 'modified' ? 'modificou' : 'respondeu'
        return `Uma oficina ${action} o seu pedido de orçamento`
      case 'quote_accepted':
        return 'A oficina aceitou o seu orçamento e entrará em contacto em breve'
      case 'budget_validation_required':
        return `Orçamento de ${notification.total || 'N/A'}€ para ${notification.serviceName || 'serviço'} - ${notification.licensePlate || 'veículo'}. Por favor valide.`
      default:
        return ''
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
              <Badge variant="secondary" className="text-xs">
                {unreadCount} nova(s)
              </Badge>
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
                        {getNotificationTitle(notification)}
                      </p>
                      <p className="text-sm text-gray-600 mt-1">
                        {getNotificationMessage(notification)}
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