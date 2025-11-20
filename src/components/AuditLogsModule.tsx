import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table'
import { Badge } from './ui/badge'
import { Button } from './ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select'
import { Input } from './ui/input'
import { Label } from './ui/label'
import { projectId } from '../utils/supabase/info'
import { Shield, Eye, Edit, Trash2, Plus, FileText, Download, Calendar, User, Filter, Activity, TrendingUp, BarChart3 } from 'lucide-react'
import { toast } from 'sonner@2.0.3'
import { LoadingSkeleton } from './shared/LoadingSkeleton'
import { EmptyState } from './shared/EmptyState'

interface AuditLog {
  id: string
  workshopId: string
  userId: string
  userEmail: string
  action: string
  module: string
  entityType: string
  entityId: string
  changes?: any
  metadata?: any
  timestamp: string
}

interface AuditStats {
  totalActions: number
  actionsByType: Record<string, number>
  actionsByModule: Record<string, number>
  actionsByUser: Record<string, number>
  recentActivity: AuditLog[]
}

export function AuditLogsModule({ accessToken }: { accessToken: string }) {
  const [logs, setLogs] = useState<AuditLog[]>([])
  const [stats, setStats] = useState<AuditStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [statsLoading, setStatsLoading] = useState(true)
  
  // Filtros
  const [moduleFilter, setModuleFilter] = useState('all')
  const [actionFilter, setActionFilter] = useState('all')
  const [dateFilter, setDateFilter] = useState('30') // dias
  const [searchUser, setSearchUser] = useState('')
  
  useEffect(() => {
    fetchLogs()
  }, [moduleFilter, actionFilter, dateFilter])
  
  useEffect(() => {
    fetchStats()
  }, [dateFilter])
  
  const fetchLogs = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (moduleFilter !== 'all') params.append('module', moduleFilter)
      if (actionFilter !== 'all') params.append('action', actionFilter)
      if (dateFilter !== 'all') {
        const fromDate = new Date()
        fromDate.setDate(fromDate.getDate() - parseInt(dateFilter))
        params.append('dateFrom', fromDate.toISOString())
      }
      
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-6971b43c/admin/audit-logs?${params}`,
        {
          headers: { 'Authorization': `Bearer ${accessToken}` }
        }
      )
      
      if (response.ok) {
        const data = await response.json()
        setLogs(data.logs || [])
      }
    } catch (error) {
      console.error('Error fetching logs:', error)
      toast.error('Erro ao carregar logs de auditoria')
    } finally {
      setLoading(false)
    }
  }
  
  const fetchStats = async () => {
    setStatsLoading(true)
    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-6971b43c/admin/audit-stats?days=${dateFilter}`,
        {
          headers: { 'Authorization': `Bearer ${accessToken}` }
        }
      )
      
      if (response.ok) {
        const data = await response.json()
        setStats(data.stats)
      }
    } catch (error) {
      console.error('Error fetching stats:', error)
    } finally {
      setStatsLoading(false)
    }
  }
  
  const exportToCSV = () => {
    const headers = ['Data/Hora', 'Utilizador', 'Ação', 'Módulo', 'Tipo', 'ID Entidade']
    const rows = logs.map(log => [
      new Date(log.timestamp).toLocaleString('pt-PT'),
      log.userEmail,
      log.action,
      log.module,
      log.entityType,
      log.entityId
    ])
    
    const csv = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n')
    
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `audit-logs-${new Date().toISOString().split('T')[0]}.csv`
    a.click()
    
    toast.success('Logs exportados com sucesso!')
  }
  
  const getActionIcon = (action: string) => {
    switch (action) {
      case 'create': return <Plus className="h-4 w-4 text-green-600" />
      case 'update': return <Edit className="h-4 w-4 text-blue-600" />
      case 'delete': return <Trash2 className="h-4 w-4 text-red-600" />
      case 'view': return <Eye className="h-4 w-4 text-gray-600" />
      case 'export': return <FileText className="h-4 w-4 text-purple-600" />
      case 'approve': return <Shield className="h-4 w-4 text-green-600" />
      case 'reject': return <Shield className="h-4 w-4 text-red-600" />
      default: return <Activity className="h-4 w-4 text-gray-600" />
    }
  }
  
  const getActionBadge = (action: string) => {
    const colors: Record<string, string> = {
      create: 'bg-green-100 text-green-800 border-green-200',
      update: 'bg-blue-100 text-blue-800 border-blue-200',
      delete: 'bg-red-100 text-red-800 border-red-200',
      view: 'bg-gray-100 text-gray-800 border-gray-200',
      export: 'bg-purple-100 text-purple-800 border-purple-200',
      approve: 'bg-green-100 text-green-800 border-green-200',
      reject: 'bg-red-100 text-red-800 border-red-200'
    }
    
    return (
      <Badge className={`${colors[action] || 'bg-gray-100 text-gray-800 border-gray-200'} border`}>
        {action.toUpperCase()}
      </Badge>
    )
  }
  
  const filteredLogs = logs.filter(log => {
    if (searchUser && !log.userEmail.toLowerCase().includes(searchUser.toLowerCase())) {
      return false
    }
    return true
  })
  
  return (
    <div className="space-y-6">
      {/* Estatísticas */}
      {statsLoading ? (
        <LoadingSkeleton type="card" rows={3} />
      ) : stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card className="border-2 border-blue-200 bg-gradient-to-br from-blue-50 to-white">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-blue-600 flex items-center gap-2">
                <Activity className="h-4 w-4" />
                Total de Ações
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-blue-900">{stats.totalActions}</div>
              <p className="text-xs text-blue-600 mt-1">Últimos {dateFilter} dias</p>
            </CardContent>
          </Card>

          <Card className="border-2 border-green-200 bg-gradient-to-br from-green-50 to-white">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-green-600 flex items-center gap-2">
                <TrendingUp className="h-4 w-4" />
                Criações
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-green-900">
                {stats.actionsByType['create'] || 0}
              </div>
              <p className="text-xs text-green-600 mt-1">Novos registos</p>
            </CardContent>
          </Card>

          <Card className="border-2 border-orange-200 bg-gradient-to-br from-orange-50 to-white">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-orange-600 flex items-center gap-2">
                <Edit className="h-4 w-4" />
                Edições
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-orange-900">
                {stats.actionsByType['update'] || 0}
              </div>
              <p className="text-xs text-orange-600 mt-1">Atualizações</p>
            </CardContent>
          </Card>

          <Card className="border-2 border-purple-200 bg-gradient-to-br from-purple-50 to-white">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-purple-600 flex items-center gap-2">
                <User className="h-4 w-4" />
                Utilizadores Ativos
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-purple-900">
                {Object.keys(stats.actionsByUser).length}
              </div>
              <p className="text-xs text-purple-600 mt-1">Com atividade</p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Filtros e Logs */}
      <Card className="border-2 border-blue-200">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2 text-blue-900">
                <Shield className="h-6 w-6 text-blue-600" />
                Registos de Auditoria
              </CardTitle>
              <CardDescription className="mt-1">
                Rastreamento completo de todas as ações na plataforma
              </CardDescription>
            </div>
            <Button 
              onClick={exportToCSV}
              variant="outline"
              className="border-blue-200 hover:bg-blue-50"
              disabled={logs.length === 0}
            >
              <Download className="h-4 w-4 mr-2" />
              Exportar CSV
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {/* Filtros */}
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6 p-4 bg-gradient-to-r from-blue-50 to-orange-50 rounded-lg border-2 border-blue-200">
            <div className="space-y-2">
              <Label className="text-xs font-semibold text-gray-700 flex items-center gap-1">
                <Filter className="h-3 w-3" />
                Período
              </Label>
              <Select value={dateFilter} onValueChange={setDateFilter}>
                <SelectTrigger className="border-blue-200">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">Hoje</SelectItem>
                  <SelectItem value="7">Últimos 7 dias</SelectItem>
                  <SelectItem value="30">Últimos 30 dias</SelectItem>
                  <SelectItem value="90">Últimos 90 dias</SelectItem>
                  <SelectItem value="all">Todos</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label className="text-xs font-semibold text-gray-700">Módulo</Label>
              <Select value={moduleFilter} onValueChange={setModuleFilter}>
                <SelectTrigger className="border-blue-200">
                  <SelectValue placeholder="Todos" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="clients">Clientes</SelectItem>
                  <SelectItem value="vehicles">Veículos</SelectItem>
                  <SelectItem value="workorders">Ordens de Trabalho</SelectItem>
                  <SelectItem value="budgets">Orçamentos</SelectItem>
                  <SelectItem value="invoices">Faturas</SelectItem>
                  <SelectItem value="appointments">Agendamentos</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label className="text-xs font-semibold text-gray-700">Ação</Label>
              <Select value={actionFilter} onValueChange={setActionFilter}>
                <SelectTrigger className="border-blue-200">
                  <SelectValue placeholder="Todas" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas</SelectItem>
                  <SelectItem value="create">Criar</SelectItem>
                  <SelectItem value="update">Editar</SelectItem>
                  <SelectItem value="delete">Apagar</SelectItem>
                  <SelectItem value="view">Visualizar</SelectItem>
                  <SelectItem value="export">Exportar</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2 md:col-span-2">
              <Label className="text-xs font-semibold text-gray-700">Utilizador</Label>
              <Input
                placeholder="Pesquisar por email..."
                value={searchUser}
                onChange={(e) => setSearchUser(e.target.value)}
                className="border-blue-200"
              />
            </div>
          </div>

          {/* Tabela */}
          {loading ? (
            <LoadingSkeleton type="table" rows={10} />
          ) : filteredLogs.length === 0 ? (
            <EmptyState
              icon={Shield}
              title="Nenhum registo encontrado"
              description="Não há registos de auditoria para os filtros selecionados."
            />
          ) : (
            <div className="border-2 border-blue-100 rounded-lg overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow className="bg-gradient-to-r from-blue-50 to-orange-50 border-b-2 border-blue-200">
                    <TableHead className="font-bold text-blue-900">Ação</TableHead>
                    <TableHead className="font-bold text-blue-900">Módulo</TableHead>
                    <TableHead className="font-bold text-blue-900">Utilizador</TableHead>
                    <TableHead className="font-bold text-blue-900">Entidade</TableHead>
                    <TableHead className="font-bold text-blue-900">Data/Hora</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredLogs.map((log) => (
                    <TableRow key={log.id} className="hover:bg-blue-50/50">
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {getActionIcon(log.action)}
                          {getActionBadge(log.action)}
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className="font-semibold text-gray-800">{log.module}</span>
                      </TableCell>
                      <TableCell>
                        <div>
                          <div className="font-medium text-gray-900">{log.userEmail}</div>
                          <code className="text-xs text-gray-500 bg-gray-100 px-1 rounded">
                            {log.userId.slice(0, 8)}...
                          </code>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          <span className="text-gray-600">{log.entityType}</span>
                          <br />
                          <code className="text-xs bg-gray-100 px-1 rounded text-gray-700">
                            {log.entityId.slice(0, 12)}...
                          </code>
                        </div>
                      </TableCell>
                      <TableCell className="text-sm text-gray-700">
                        <div className="flex items-center gap-1">
                          <Calendar className="h-3 w-3 text-gray-400" />
                          {new Date(log.timestamp).toLocaleString('pt-PT', {
                            day: '2-digit',
                            month: '2-digit',
                            year: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
