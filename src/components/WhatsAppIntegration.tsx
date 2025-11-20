import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card'
import { Button } from './ui/button'
import { Input } from './ui/input'
import { Label } from './ui/label'
import { Badge } from './ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs'
import { MessageCircle, Send, CheckCircle2, Clock, XCircle, Settings, BarChart3, Zap } from 'lucide-react'
import { toast } from 'sonner@2.0.3'
import { projectId, publicAnonKey } from '../utils/supabase/info'

interface WhatsAppIntegrationProps {
  workshopId: string
  accessToken: string
}

export function WhatsAppIntegration({ workshopId, accessToken }: WhatsAppIntegrationProps) {
  const [config, setConfig] = useState<any>(null)
  const [stats, setStats] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [sending, setSending] = useState(false)
  
  // Form states
  const [phoneNumberId, setPhoneNumberId] = useState('')
  const [accessTokenInput, setAccessTokenInput] = useState('')
  const [businessAccountId, setBusinessAccountId] = useState('')
  const [enabled, setEnabled] = useState(false)
  
  // Send message form
  const [recipientPhone, setRecipientPhone] = useState('')
  const [selectedTemplate, setSelectedTemplate] = useState('appointment_confirmation')

  useEffect(() => {
    loadConfig()
    loadStats()
  }, [workshopId])

  const loadConfig = async () => {
    try {
      setLoading(true)
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-6971b43c/whatsapp/${workshopId}/config`,
        {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
          },
        }
      )

      if (response.ok) {
        const data = await response.json()
        setConfig(data)
        setPhoneNumberId(data.phoneNumberId || '')
        setAccessTokenInput(data.accessToken || '')
        setBusinessAccountId(data.businessAccountId || '')
        setEnabled(data.enabled || false)
      } else {
        toast.error('Erro ao carregar configuração WhatsApp')
      }
    } catch (error) {
      console.error('Error loading WhatsApp config:', error)
      toast.error('Erro ao carregar configuração')
    } finally {
      setLoading(false)
    }
  }

  const loadStats = async () => {
    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-6971b43c/whatsapp/${workshopId}/stats`,
        {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
          },
        }
      )

      if (response.ok) {
        const data = await response.json()
        setStats(data)
      }
    } catch (error) {
      console.error('Error loading WhatsApp stats:', error)
    }
  }

  const saveConfig = async () => {
    try {
      setSaving(true)
      
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-6971b43c/whatsapp/${workshopId}/config`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            enabled,
            phoneNumberId,
            accessToken: accessTokenInput,
            businessAccountId,
          }),
        }
      )

      if (response.ok) {
        toast.success('Configuração guardada com sucesso!')
        loadConfig()
      } else {
        const error = await response.json()
        toast.error(error.error || 'Erro ao guardar configuração')
      }
    } catch (error) {
      console.error('Error saving WhatsApp config:', error)
      toast.error('Erro ao guardar configuração')
    } finally {
      setSaving(false)
    }
  }

  const sendMessage = async () => {
    if (!recipientPhone || !selectedTemplate) {
      toast.error('Preencha todos os campos')
      return
    }

    if (!enabled) {
      toast.error('WhatsApp não está ativado')
      return
    }

    try {
      setSending(true)
      
      // Mock variables for demo - in production these would come from context
      const variables = {
        clientName: 'João Silva',
        date: new Date().toLocaleDateString('pt-PT'),
        time: '14:00',
        workshopName: 'OficinasExpress',
        vehiclePlate: '00-AA-00',
        serviceType: 'Revisão',
        estimatedCost: '150€'
      }

      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-6971b43c/whatsapp/${workshopId}/send`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            phoneNumber: recipientPhone,
            templateName: selectedTemplate,
            variables,
          }),
        }
      )

      if (response.ok) {
        const result = await response.json()
        toast.success('Mensagem enviada com sucesso!')
        setRecipientPhone('')
        loadStats() // Refresh stats
      } else {
        const error = await response.json()
        toast.error(error.error || 'Erro ao enviar mensagem')
      }
    } catch (error) {
      console.error('Error sending WhatsApp message:', error)
      toast.error('Erro ao enviar mensagem')
    } finally {
      setSending(false)
    }
  }

  const templates = [
    { 
      id: 'appointment_confirmation', 
      name: 'Confirmação de Agendamento',
      description: 'Confirma agendamento com data e hora',
      icon: '📅'
    },
    { 
      id: 'appointment_reminder', 
      name: 'Lembrete de Agendamento',
      description: 'Lembra cliente 24h antes',
      icon: '⏰'
    },
    { 
      id: 'service_ready', 
      name: 'Viatura Pronta',
      description: 'Notifica que veículo está pronto',
      icon: '✅'
    },
    { 
      id: 'budget_approved', 
      name: 'Orçamento Aprovado',
      description: 'Confirma aprovação de orçamento',
      icon: '💰'
    },
    { 
      id: 'payment_reminder', 
      name: 'Lembrete de Pagamento',
      description: 'Lembra pagamento pendente',
      icon: '💳'
    },
    { 
      id: 'service_complete', 
      name: 'Serviço Concluído',
      description: 'Notifica conclusão com pedido de avaliação',
      icon: '🎉'
    },
    { 
      id: 'marketing_promo', 
      name: 'Promoção',
      description: 'Envia campanha promocional',
      icon: '🎁'
    },
    { 
      id: 'birthday', 
      name: 'Aniversário',
      description: 'Felicita cliente no aniversário',
      icon: '🎂'
    },
  ]

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="inline-block h-12 w-12 rounded-xl bg-gradient-to-br from-green-600 to-green-700 animate-pulse mb-4"></div>
          <p className="text-gray-600">A carregar WhatsApp Business...</p>
        </div>
      </div>
    )
  }

  const deliveryRate = stats && stats.sent > 0 ? ((stats.delivered / stats.sent) * 100).toFixed(1) : '0.0'
  const readRate = stats && stats.delivered > 0 ? ((stats.read / stats.delivered) * 100).toFixed(1) : '0.0'

  return (
    <div className="space-y-6">
      {/* Header Card */}
      <Card className="border-2 border-green-200 bg-gradient-to-br from-green-50 to-emerald-50">
        <CardHeader>
          <div className="flex items-start justify-between">
            <div className="space-y-1">
              <CardTitle className="flex items-center gap-2">
                <MessageCircle className="h-6 w-6 text-green-600" />
                WhatsApp Business API
              </CardTitle>
              <CardDescription>
                Comunicação automática com taxa de abertura de 98%
              </CardDescription>
            </div>
            <Badge 
              variant={enabled ? "default" : "outline"}
              className={enabled ? "bg-green-600" : ""}
            >
              {enabled ? '✓ Ativo' : '○ Inativo'}
            </Badge>
          </div>
        </CardHeader>
        {stats && (
          <CardContent>
            <div className="grid grid-cols-4 gap-4">
              <div className="text-center p-4 bg-white rounded-lg">
                <Send className="h-5 w-5 text-blue-600 mx-auto mb-2" />
                <p className="text-2xl font-bold text-blue-600">{stats.sent || 0}</p>
                <p className="text-xs text-gray-600">Enviadas</p>
              </div>
              <div className="text-center p-4 bg-white rounded-lg">
                <CheckCircle2 className="h-5 w-5 text-green-600 mx-auto mb-2" />
                <p className="text-2xl font-bold text-green-600">{stats.delivered || 0}</p>
                <p className="text-xs text-gray-600">Entregues ({deliveryRate}%)</p>
              </div>
              <div className="text-center p-4 bg-white rounded-lg">
                <Clock className="h-5 w-5 text-purple-600 mx-auto mb-2" />
                <p className="text-2xl font-bold text-purple-600">{stats.read || 0}</p>
                <p className="text-xs text-gray-600">Lidas ({readRate}%)</p>
              </div>
              <div className="text-center p-4 bg-white rounded-lg">
                <XCircle className="h-5 w-5 text-red-600 mx-auto mb-2" />
                <p className="text-2xl font-bold text-red-600">{stats.failed || 0}</p>
                <p className="text-xs text-gray-600">Falhadas</p>
              </div>
            </div>
          </CardContent>
        )}
      </Card>

      {/* Tabs */}
      <Tabs defaultValue="send" className="space-y-4">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="send">Enviar Mensagem</TabsTrigger>
          <TabsTrigger value="templates">Templates</TabsTrigger>
          <TabsTrigger value="config">Configuração</TabsTrigger>
        </TabsList>

        {/* Send Message Tab */}
        <TabsContent value="send" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Send className="h-5 w-5 text-green-600" />
                Enviar Mensagem WhatsApp
              </CardTitle>
              <CardDescription>
                Envie mensagens usando templates pré-aprovados
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="phone">Número de Telefone</Label>
                <Input
                  id="phone"
                  placeholder="+351 912 345 678"
                  value={recipientPhone}
                  onChange={(e) => setRecipientPhone(e.target.value)}
                />
                <p className="text-xs text-gray-500">
                  Formato: +351 seguido de 9 dígitos
                </p>
              </div>

              <div className="space-y-2">
                <Label>Template</Label>
                <div className="grid md:grid-cols-2 gap-3">
                  {templates.map((template) => (
                    <div
                      key={template.id}
                      onClick={() => setSelectedTemplate(template.id)}
                      className={`
                        p-4 border-2 rounded-lg cursor-pointer transition-all
                        ${selectedTemplate === template.id 
                          ? 'border-green-500 bg-green-50' 
                          : 'border-gray-200 hover:border-gray-300'
                        }
                      `}
                    >
                      <div className="flex items-start gap-3">
                        <span className="text-2xl">{template.icon}</span>
                        <div className="flex-1">
                          <p className="font-semibold text-sm text-gray-900">
                            {template.name}
                          </p>
                          <p className="text-xs text-gray-600 mt-1">
                            {template.description}
                          </p>
                        </div>
                        {selectedTemplate === template.id && (
                          <CheckCircle2 className="h-5 w-5 text-green-600 flex-shrink-0" />
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <Button
                onClick={sendMessage}
                disabled={!enabled || sending || !recipientPhone}
                className="w-full bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800"
                size="lg"
              >
                <Send className="h-5 w-5 mr-2" />
                {sending ? 'A enviar...' : 'Enviar Mensagem WhatsApp'}
              </Button>

              {!enabled && (
                <div className="p-4 bg-orange-50 border border-orange-200 rounded-lg">
                  <p className="text-sm text-orange-800">
                    ⚠️ WhatsApp não está ativo. Configure primeiro na tab "Configuração".
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Templates Tab */}
        <TabsContent value="templates" className="space-y-4">
          <div className="grid md:grid-cols-2 gap-4">
            {templates.map((template) => (
              <Card key={template.id} className="border-2 border-gray-200">
                <CardHeader>
                  <div className="flex items-start gap-3">
                    <span className="text-3xl">{template.icon}</span>
                    <div className="flex-1">
                      <CardTitle className="text-base">{template.name}</CardTitle>
                      <CardDescription className="mt-1">
                        {template.description}
                      </CardDescription>
                    </div>
                    <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                      Ativo
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <p className="text-sm font-semibold text-gray-700">Variáveis disponíveis:</p>
                    <div className="flex flex-wrap gap-2">
                      <Badge variant="outline" className="text-xs">clientName</Badge>
                      <Badge variant="outline" className="text-xs">date</Badge>
                      <Badge variant="outline" className="text-xs">time</Badge>
                      <Badge variant="outline" className="text-xs">workshopName</Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Config Tab */}
        <TabsContent value="config" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5 text-blue-600" />
                Configuração WhatsApp Business API
              </CardTitle>
              <CardDescription>
                Configure as credenciais da Meta (Facebook) Business
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <div className="space-y-1">
                  <p className="font-semibold text-blue-900">Estado da Integração</p>
                  <p className="text-sm text-blue-700">
                    {enabled ? 'WhatsApp está ativo e pronto a enviar' : 'WhatsApp está inativo'}
                  </p>
                </div>
                <Button
                  variant={enabled ? "outline" : "default"}
                  onClick={() => setEnabled(!enabled)}
                  className={enabled ? "border-blue-500 text-blue-700" : "bg-green-600 hover:bg-green-700"}
                >
                  {enabled ? 'Desativar' : 'Ativar'}
                </Button>
              </div>

              <div className="space-y-2">
                <Label htmlFor="phoneNumberId">Phone Number ID</Label>
                <Input
                  id="phoneNumberId"
                  placeholder="123456789012345"
                  value={phoneNumberId}
                  onChange={(e) => setPhoneNumberId(e.target.value)}
                />
                <p className="text-xs text-gray-500">
                  Obtenha no WhatsApp Business Manager → API Setup
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="accessToken">Access Token</Label>
                <Input
                  id="accessToken"
                  type="password"
                  placeholder="EAAxxxxxxxxxxxxxx"
                  value={accessTokenInput}
                  onChange={(e) => setAccessTokenInput(e.target.value)}
                />
                <p className="text-xs text-gray-500">
                  Token permanente gerado no Meta Developer Console
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="businessAccountId">Business Account ID</Label>
                <Input
                  id="businessAccountId"
                  placeholder="987654321098765"
                  value={businessAccountId}
                  onChange={(e) => setBusinessAccountId(e.target.value)}
                />
                <p className="text-xs text-gray-500">
                  ID da sua conta WhatsApp Business
                </p>
              </div>

              <Button
                onClick={saveConfig}
                disabled={saving}
                className="w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800"
                size="lg"
              >
                <Settings className="h-5 w-5 mr-2" />
                {saving ? 'A guardar...' : 'Guardar Configuração'}
              </Button>

              <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg space-y-2">
                <p className="text-sm font-semibold text-yellow-900 flex items-center gap-2">
                  <Zap className="h-4 w-4" />
                  Como configurar WhatsApp Business API:
                </p>
                <ol className="text-sm text-yellow-800 space-y-1 ml-6 list-decimal">
                  <li>Aceda ao <strong>Meta Business Suite</strong></li>
                  <li>Crie uma <strong>App Business</strong> no Developer Console</li>
                  <li>Adicione o produto <strong>WhatsApp</strong></li>
                  <li>Configure um <strong>número de telefone</strong></li>
                  <li>Gere um <strong>Access Token permanente</strong></li>
                  <li>Cole as credenciais acima e ative</li>
                </ol>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
