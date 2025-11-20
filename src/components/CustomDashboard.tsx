import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card'
import { Button } from './ui/button'
import { Input } from './ui/input'
import { Label } from './ui/label'
import { Textarea } from './ui/textarea'
import { Badge } from './ui/badge'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog'
import { LayoutDashboard, Plus, Trash2, Edit, Save, X, Grid3x3, BarChart3, TrendingUp, Users, DollarSign, Calendar, AlertCircle } from 'lucide-react'
import { toast } from 'sonner@2.0.3'
import { projectId, publicAnonKey } from '../utils/supabase/info'

interface CustomDashboardProps {
  workshopId: string
  userId: string
  accessToken: string
}

interface Widget {
  id: string
  type: string
  title: string
  size: 'small' | 'medium' | 'large'
  config: any
}

interface Dashboard {
  id: string
  name: string
  description: string
  widgets: Widget[]
  createdAt: string
  updatedAt: string
}

export function CustomDashboard({ workshopId, userId, accessToken }: CustomDashboardProps) {
  const [dashboards, setDashboards] = useState<Dashboard[]>([])
  const [currentDashboard, setCurrentDashboard] = useState<Dashboard | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [isEditMode, setIsEditMode] = useState(false)
  
  // Form states
  const [newDashboardName, setNewDashboardName] = useState('')
  const [newDashboardDesc, setNewDashboardDesc] = useState('')

  useEffect(() => {
    loadDashboards()
  }, [workshopId, userId])

  const loadDashboards = async () => {
    try {
      setLoading(true)
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-6971b43c/dashboards/${workshopId}/${userId}`,
        {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
          },
        }
      )

      if (response.ok) {
        const data = await response.json()
        setDashboards(data)
        
        // Select first dashboard if available
        if (data.length > 0 && !currentDashboard) {
          setCurrentDashboard(data[0])
        }
      } else {
        toast.error('Erro ao carregar dashboards')
      }
    } catch (error) {
      console.error('Error loading dashboards:', error)
      toast.error('Erro ao carregar dashboards')
    } finally {
      setLoading(false)
    }
  }

  const createDashboard = async () => {
    if (!newDashboardName.trim()) {
      toast.error('Nome do dashboard é obrigatório')
      return
    }

    try {
      setSaving(true)
      
      const newDashboard = {
        name: newDashboardName,
        description: newDashboardDesc,
        widgets: []
      }

      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-6971b43c/dashboards/${workshopId}/${userId}`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(newDashboard),
        }
      )

      if (response.ok) {
        const created = await response.json()
        setDashboards([...dashboards, created])
        setCurrentDashboard(created)
        setIsCreateOpen(false)
        setNewDashboardName('')
        setNewDashboardDesc('')
        toast.success('Dashboard criado com sucesso!')
      } else {
        const error = await response.json()
        toast.error(error.error || 'Erro ao criar dashboard')
      }
    } catch (error) {
      console.error('Error creating dashboard:', error)
      toast.error('Erro ao criar dashboard')
    } finally {
      setSaving(false)
    }
  }

  const updateDashboard = async (dashboard: Dashboard) => {
    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-6971b43c/dashboards/${workshopId}/${userId}/${dashboard.id}`,
        {
          method: 'PUT',
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(dashboard),
        }
      )

      if (response.ok) {
        const updated = await response.json()
        setDashboards(dashboards.map(d => d.id === updated.id ? updated : d))
        setCurrentDashboard(updated)
        toast.success('Dashboard atualizado!')
      } else {
        const error = await response.json()
        toast.error(error.error || 'Erro ao atualizar dashboard')
      }
    } catch (error) {
      console.error('Error updating dashboard:', error)
      toast.error('Erro ao atualizar dashboard')
    }
  }

  const deleteDashboard = async (dashboardId: string) => {
    if (!confirm('Tem certeza que deseja eliminar este dashboard?')) {
      return
    }

    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-6971b43c/dashboards/${workshopId}/${userId}/${dashboardId}`,
        {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${accessToken}`,
          },
        }
      )

      if (response.ok) {
        setDashboards(dashboards.filter(d => d.id !== dashboardId))
        if (currentDashboard?.id === dashboardId) {
          setCurrentDashboard(dashboards[0] || null)
        }
        toast.success('Dashboard eliminado!')
      } else {
        const error = await response.json()
        toast.error(error.error || 'Erro ao eliminar dashboard')
      }
    } catch (error) {
      console.error('Error deleting dashboard:', error)
      toast.error('Erro ao eliminar dashboard')
    }
  }

  const addWidget = (type: string) => {
    if (!currentDashboard) return

    const newWidget: Widget = {
      id: crypto.randomUUID(),
      type,
      title: getWidgetTitle(type),
      size: 'medium',
      config: {}
    }

    const updated = {
      ...currentDashboard,
      widgets: [...currentDashboard.widgets, newWidget]
    }

    setCurrentDashboard(updated)
    updateDashboard(updated)
  }

  const removeWidget = (widgetId: string) => {
    if (!currentDashboard) return

    const updated = {
      ...currentDashboard,
      widgets: currentDashboard.widgets.filter(w => w.id !== widgetId)
    }

    setCurrentDashboard(updated)
    updateDashboard(updated)
  }

  const getWidgetTitle = (type: string): string => {
    const titles: Record<string, string> = {
      'revenue': 'Receita Total',
      'clients': 'Total de Clientes',
      'appointments': 'Agendamentos',
      'revenue-chart': 'Gráfico de Receitas',
      'top-services': 'Top Serviços',
      'pending-budgets': 'Orçamentos Pendentes',
      'nps-score': 'Score NPS',
      'conversion-rate': 'Taxa de Conversão',
      'avg-ticket': 'Ticket Médio'
    }
    return titles[type] || 'Widget'
  }

  const renderWidget = (widget: Widget) => {
    const sizeClasses = {
      small: 'col-span-1',
      medium: 'col-span-2',
      large: 'col-span-3'
    }

    // Mock data for demonstration
    const mockData: Record<string, any> = {
      'revenue': { value: '€45.230', change: '+12%', icon: DollarSign, color: 'green' },
      'clients': { value: '342', change: '+8%', icon: Users, color: 'blue' },
      'appointments': { value: '28', change: '+15%', icon: Calendar, color: 'purple' },
      'nps-score': { value: '75', change: '+5', icon: TrendingUp, color: 'yellow' },
      'conversion-rate': { value: '68%', change: '+3%', icon: BarChart3, color: 'cyan' },
      'avg-ticket': { value: '€132', change: '+7%', icon: DollarSign, color: 'orange' }
    }

    const data = mockData[widget.type]

    return (
      <Card key={widget.id} className={`${sizeClasses[widget.size]} border-2 border-gray-200 relative group`}>
        {isEditMode && (
          <Button
            variant="destructive"
            size="sm"
            className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity z-10"
            onClick={() => removeWidget(widget.id)}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        )}
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            {data?.icon && <data.icon className="h-5 w-5" />}
            {widget.title}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {widget.type.includes('chart') ? (
            <div className="h-48 bg-gradient-to-br from-blue-50 to-purple-50 rounded-lg flex items-center justify-center">
              <BarChart3 className="h-16 w-16 text-gray-400" />
              <p className="text-sm text-gray-500 ml-4">Gráfico aqui</p>
            </div>
          ) : widget.type === 'top-services' ? (
            <div className="space-y-2">
              {['Revisão completa', 'Mudança de óleo', 'Alinhamento'].map((service, i) => (
                <div key={i} className="flex justify-between items-center p-2 bg-gray-50 rounded">
                  <span className="text-sm">{service}</span>
                  <Badge variant="outline">{i + 1}º</Badge>
                </div>
              ))}
            </div>
          ) : widget.type === 'pending-budgets' ? (
            <div className="space-y-2">
              <div className="text-center p-8 bg-orange-50 rounded-lg">
                <AlertCircle className="h-12 w-12 text-orange-600 mx-auto mb-2" />
                <p className="text-3xl font-bold text-orange-600">12</p>
                <p className="text-sm text-gray-600 mt-1">A aguardar aprovação</p>
              </div>
            </div>
          ) : data ? (
            <div>
              <p className="text-4xl font-bold text-gray-900 mb-2">{data.value}</p>
              <Badge variant="outline" className={`bg-${data.color}-50 text-${data.color}-700 border-${data.color}-200`}>
                {data.change} vs mês anterior
              </Badge>
            </div>
          ) : (
            <p className="text-sm text-gray-500">Dados não disponíveis</p>
          )}
        </CardContent>
      </Card>
    )
  }

  const widgetTypes = [
    { id: 'revenue', name: 'Receita Total', icon: DollarSign },
    { id: 'clients', name: 'Total Clientes', icon: Users },
    { id: 'appointments', name: 'Agendamentos', icon: Calendar },
    { id: 'revenue-chart', name: 'Gráfico Receitas', icon: BarChart3 },
    { id: 'top-services', name: 'Top Serviços', icon: TrendingUp },
    { id: 'pending-budgets', name: 'Orçamentos Pendentes', icon: AlertCircle },
    { id: 'nps-score', name: 'Score NPS', icon: TrendingUp },
    { id: 'conversion-rate', name: 'Taxa Conversão', icon: BarChart3 },
    { id: 'avg-ticket', name: 'Ticket Médio', icon: DollarSign },
  ]

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="inline-block h-12 w-12 rounded-xl bg-gradient-to-br from-purple-600 to-blue-500 animate-pulse mb-4"></div>
          <p className="text-gray-600">A carregar dashboards...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card className="border-2 border-purple-200 bg-gradient-to-br from-purple-50 to-blue-50">
        <CardHeader>
          <div className="flex items-start justify-between">
            <div className="space-y-1">
              <CardTitle className="flex items-center gap-2">
                <LayoutDashboard className="h-6 w-6 text-purple-600" />
                Dashboards Personalizáveis
              </CardTitle>
              <CardDescription>
                Crie dashboards personalizados com widgets drag-and-drop
              </CardDescription>
            </div>
            <div className="flex gap-2">
              <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
                <DialogTrigger asChild>
                  <Button className="bg-gradient-to-r from-purple-600 to-blue-600">
                    <Plus className="h-4 w-4 mr-2" />
                    Novo Dashboard
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Criar Novo Dashboard</DialogTitle>
                    <DialogDescription>
                      Dê um nome e descrição ao seu dashboard personalizado
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4 py-4">
                    <div className="space-y-2">
                      <Label htmlFor="name">Nome do Dashboard</Label>
                      <Input
                        id="name"
                        placeholder="Ex: Dashboard Executivo"
                        value={newDashboardName}
                        onChange={(e) => setNewDashboardName(e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="description">Descrição</Label>
                      <Textarea
                        id="description"
                        placeholder="Ex: Visão geral do negócio com KPIs principais"
                        value={newDashboardDesc}
                        onChange={(e) => setNewDashboardDesc(e.target.value)}
                      />
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button onClick={createDashboard} disabled={saving} className="flex-1">
                      {saving ? 'A criar...' : 'Criar Dashboard'}
                    </Button>
                    <Button variant="outline" onClick={() => setIsCreateOpen(false)}>
                      Cancelar
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Dashboard Selector */}
      {dashboards.length > 0 && (
        <div className="flex gap-2 flex-wrap">
          {dashboards.map((dashboard) => (
            <Button
              key={dashboard.id}
              variant={currentDashboard?.id === dashboard.id ? "default" : "outline"}
              onClick={() => setCurrentDashboard(dashboard)}
              className="relative group"
            >
              {dashboard.name}
              {currentDashboard?.id === dashboard.id && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="ml-2 h-5 w-5 p-0 hover:bg-white/20"
                  onClick={(e) => {
                    e.stopPropagation()
                    deleteDashboard(dashboard.id)
                  }}
                >
                  <Trash2 className="h-3 w-3" />
                </Button>
              )}
            </Button>
          ))}
        </div>
      )}

      {/* Current Dashboard */}
      {currentDashboard ? (
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>{currentDashboard.name}</CardTitle>
                  <CardDescription>{currentDashboard.description}</CardDescription>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant={isEditMode ? "default" : "outline"}
                    onClick={() => setIsEditMode(!isEditMode)}
                  >
                    {isEditMode ? (
                      <>
                        <Save className="h-4 w-4 mr-2" />
                        Concluir Edição
                      </>
                    ) : (
                      <>
                        <Edit className="h-4 w-4 mr-2" />
                        Editar
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {/* Widgets Grid */}
              {currentDashboard.widgets.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {currentDashboard.widgets.map(renderWidget)}
                </div>
              ) : (
                <div className="text-center py-12 bg-gray-50 rounded-lg">
                  <Grid3x3 className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600 font-semibold">Dashboard vazio</p>
                  <p className="text-sm text-gray-500 mt-2">
                    Adicione widgets abaixo para começar
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Add Widget Section */}
          {isEditMode && (
            <Card className="border-2 border-dashed border-blue-300 bg-blue-50/30">
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Plus className="h-5 w-5 text-blue-600" />
                  Adicionar Widget
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                  {widgetTypes.map((type) => (
                    <Button
                      key={type.id}
                      variant="outline"
                      className="h-auto py-4 flex flex-col items-center gap-2 hover:border-blue-500 hover:bg-blue-50"
                      onClick={() => addWidget(type.id)}
                    >
                      <type.icon className="h-6 w-6 text-blue-600" />
                      <span className="text-xs text-center">{type.name}</span>
                    </Button>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      ) : (
        <Card>
          <CardContent className="py-12 text-center">
            <LayoutDashboard className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600 font-semibold">Nenhum dashboard criado</p>
            <p className="text-sm text-gray-500 mt-2 mb-4">
              Crie o seu primeiro dashboard personalizado
            </p>
            <Button onClick={() => setIsCreateOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Criar Primeiro Dashboard
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
