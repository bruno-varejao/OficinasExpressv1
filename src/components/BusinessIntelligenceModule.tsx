import { useState, useEffect, useMemo } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card'
import { Button } from './ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table'
import { Badge } from './ui/badge'
import { 
  TrendingUp, 
  TrendingDown, 
  Users, 
  Euro, 
  Clock, 
  CheckCircle, 
  XCircle,
  BarChart3,
  Calendar,
  Download,
  Filter
} from 'lucide-react'
import { projectId } from '../utils/supabase/info'
import { toast } from 'sonner@2.0.3'
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Area,
  AreaChart
} from 'recharts'

interface BusinessIntelligenceModuleProps {
  accessToken: string
}

interface Budget {
  id: string
  number: string
  clientId: string
  vehicleId: string
  total: number
  status: 'pending' | 'approved' | 'rejected'
  createdAt: string
}

interface WorkOrder {
  id: string
  number: string
  clientId: string
  vehicleId: string
  technicianId?: string
  status: 'open' | 'completed'
  totalCost: number
  createdAt: string
  completedAt?: string
}

interface Invoice {
  id: string
  number: string
  clientId: string
  total: number
  status: 'pending' | 'paid' | 'cancelled'
  createdAt: string
  paidAt?: string
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
}

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#06b6d4']

export function BusinessIntelligenceModule({ accessToken }: BusinessIntelligenceModuleProps) {
  const [budgets, setBudgets] = useState<Budget[]>([])
  const [workOrders, setWorkOrders] = useState<WorkOrder[]>([])
  const [invoices, setInvoices] = useState<Invoice[]>([])
  const [clients, setClients] = useState<Client[]>([])
  const [vehicles, setVehicles] = useState<Vehicle[]>([])
  const [loading, setLoading] = useState(false)
  const [timeRange, setTimeRange] = useState<'week' | 'month' | 'year' | 'all'>('month')

  useEffect(() => {
    fetchAllData()
  }, [])

  const fetchAllData = async () => {
    setLoading(true)
    try {
      await Promise.all([
        fetchBudgets(),
        fetchWorkOrders(),
        fetchInvoices(),
        fetchClients(),
        fetchVehicles()
      ])
    } catch (error) {
      console.error('Error fetching data:', error)
      toast.error('Erro ao carregar dados')
    } finally {
      setLoading(false)
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

  const fetchWorkOrders = async () => {
    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-6971b43c/work-orders`,
        {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
          },
        }
      )
      if (response.ok) {
        const data = await response.json()
        setWorkOrders(data.workOrders || [])
      }
    } catch (error) {
      console.error('Error fetching work orders:', error)
    }
  }

  const fetchInvoices = async () => {
    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-6971b43c/invoices`,
        {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
          },
        }
      )
      if (response.ok) {
        const data = await response.json()
        setInvoices(data.invoices || [])
      }
    } catch (error) {
      console.error('Error fetching invoices:', error)
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

  // Filter data by time range
  const filterByTimeRange = (date: string) => {
    const itemDate = new Date(date)
    const now = new Date()
    const diff = now.getTime() - itemDate.getTime()
    const days = diff / (1000 * 60 * 60 * 24)

    switch (timeRange) {
      case 'week':
        return days <= 7
      case 'month':
        return days <= 30
      case 'year':
        return days <= 365
      case 'all':
      default:
        return true
    }
  }

  // Calculate KPIs
  const kpis = useMemo(() => {
    const filteredInvoices = invoices.filter(inv => filterByTimeRange(inv.createdAt))
    const filteredBudgets = budgets.filter(b => filterByTimeRange(b.createdAt))
    const filteredWorkOrders = workOrders.filter(wo => filterByTimeRange(wo.createdAt))

    const totalRevenue = filteredInvoices
      .filter(inv => inv.status === 'paid')
      .reduce((sum, inv) => sum + inv.total, 0)

    const totalBudgetValue = filteredBudgets.reduce((sum, b) => sum + b.total, 0)
    
    const approvedBudgets = filteredBudgets.filter(b => b.status === 'approved').length
    const approvalRate = filteredBudgets.length > 0 
      ? (approvedBudgets / filteredBudgets.length) * 100 
      : 0

    const completedOrders = filteredWorkOrders.filter(wo => wo.status === 'completed')
    
    const averageServiceTime = completedOrders.length > 0
      ? completedOrders.reduce((sum, wo) => {
          if (wo.completedAt) {
            const start = new Date(wo.createdAt)
            const end = new Date(wo.completedAt)
            const hours = (end.getTime() - start.getTime()) / (1000 * 60 * 60)
            return sum + hours
          }
          return sum
        }, 0) / completedOrders.length
      : 0

    const averageOrderValue = completedOrders.length > 0
      ? completedOrders.reduce((sum, wo) => sum + wo.totalCost, 0) / completedOrders.length
      : 0

    return {
      totalRevenue,
      totalBudgetValue,
      approvalRate,
      averageServiceTime,
      averageOrderValue,
      totalOrders: filteredWorkOrders.length,
      completedOrders: completedOrders.length,
      totalBudgets: filteredBudgets.length
    }
  }, [invoices, budgets, workOrders, timeRange])

  // Revenue over time
  const revenueOverTime = useMemo(() => {
    const filteredInvoices = invoices.filter(inv => 
      inv.status === 'paid' && filterByTimeRange(inv.createdAt)
    )

    const groupedData: { [key: string]: number } = {}
    
    filteredInvoices.forEach(invoice => {
      const date = new Date(invoice.paidAt || invoice.createdAt)
      let key = ''
      
      if (timeRange === 'week') {
        key = date.toLocaleDateString('pt-PT', { weekday: 'short', day: 'numeric' })
      } else if (timeRange === 'month') {
        key = date.toLocaleDateString('pt-PT', { day: 'numeric', month: 'short' })
      } else {
        key = date.toLocaleDateString('pt-PT', { month: 'short', year: 'numeric' })
      }
      
      groupedData[key] = (groupedData[key] || 0) + invoice.total
    })

    return Object.entries(groupedData).map(([date, revenue]) => ({
      date,
      revenue
    }))
  }, [invoices, timeRange])

  // Technician performance
  const technicianPerformance = useMemo(() => {
    const filteredOrders = workOrders.filter(wo => 
      wo.status === 'completed' && filterByTimeRange(wo.createdAt)
    )

    const techData: { [key: string]: { count: number, revenue: number, totalTime: number } } = {}

    filteredOrders.forEach(order => {
      const tech = order.technicianId || 'Não Atribuído'
      
      if (!techData[tech]) {
        techData[tech] = { count: 0, revenue: 0, totalTime: 0 }
      }
      
      techData[tech].count += 1
      techData[tech].revenue += order.totalCost

      if (order.completedAt) {
        const start = new Date(order.createdAt)
        const end = new Date(order.completedAt)
        const hours = (end.getTime() - start.getTime()) / (1000 * 60 * 60)
        techData[tech].totalTime += hours
      }
    })

    return Object.entries(techData).map(([name, data]) => ({
      name,
      servicos: data.count,
      receita: data.revenue,
      tempoMedio: data.count > 0 ? data.totalTime / data.count : 0
    }))
  }, [workOrders, timeRange])

  // Budget status distribution
  const budgetStatusData = useMemo(() => {
    const filteredBudgets = budgets.filter(b => filterByTimeRange(b.createdAt))
    
    const statusCount = {
      approved: filteredBudgets.filter(b => b.status === 'approved').length,
      pending: filteredBudgets.filter(b => b.status === 'pending').length,
      rejected: filteredBudgets.filter(b => b.status === 'rejected').length
    }

    return [
      { name: 'Aprovados', value: statusCount.approved },
      { name: 'Pendentes', value: statusCount.pending },
      { name: 'Rejeitados', value: statusCount.rejected }
    ].filter(item => item.value > 0)
  }, [budgets, timeRange])

  // Top clients by revenue
  const topClients = useMemo(() => {
    const filteredInvoices = invoices.filter(inv => 
      inv.status === 'paid' && filterByTimeRange(inv.createdAt)
    )

    const clientRevenue: { [key: string]: number } = {}

    filteredInvoices.forEach(invoice => {
      clientRevenue[invoice.clientId] = (clientRevenue[invoice.clientId] || 0) + invoice.total
    })

    return Object.entries(clientRevenue)
      .map(([clientId, revenue]) => ({
        clientId,
        clientName: clients.find(c => c && c.id === clientId)?.name || 'N/A',
        revenue
      }))
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 10)
  }, [invoices, clients, timeRange])

  // Service efficiency
  const serviceEfficiency = useMemo(() => {
    const completed = workOrders.filter(wo => 
      wo.status === 'completed' && filterByTimeRange(wo.createdAt)
    )

    return completed.map(wo => {
      const start = new Date(wo.createdAt)
      const end = wo.completedAt ? new Date(wo.completedAt) : new Date()
      const hours = (end.getTime() - start.getTime()) / (1000 * 60 * 60)
      
      return {
        number: wo.number,
        clientId: wo.clientId,
        technicianId: wo.technicianId || 'N/A',
        revenue: wo.totalCost,
        hours: parseFloat(hours.toFixed(2)),
        efficiency: wo.totalCost / (hours || 1) // Revenue per hour
      }
    }).sort((a, b) => b.efficiency - a.efficiency)
  }, [workOrders, timeRange])

  const getClientName = (clientId: string) => {
    return clients.find(c => c && c.id === clientId)?.name || 'N/A'
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl">Inteligência de Negócio</h2>
          <p className="text-muted-foreground mt-1">
            Analise e otimize o desempenho operacional da oficina
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex gap-1 bg-muted rounded-md p-1">
            <Button
              variant={timeRange === 'week' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setTimeRange('week')}
            >
              Semana
            </Button>
            <Button
              variant={timeRange === 'month' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setTimeRange('month')}
            >
              Mês
            </Button>
            <Button
              variant={timeRange === 'year' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setTimeRange('year')}
            >
              Ano
            </Button>
            <Button
              variant={timeRange === 'all' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setTimeRange('all')}
            >
              Tudo
            </Button>
          </div>

          <Button variant="outline">
            <Download className="mr-2 h-4 w-4" />
            Exportar Relatório
          </Button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm">Receita Total</CardTitle>
            <Euro className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl">€{kpis.totalRevenue.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {kpis.completedOrders} serviços concluídos
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm">Taxa de Aprovação</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl">{kpis.approvalRate.toFixed(1)}%</div>
            <p className="text-xs text-muted-foreground mt-1">
              {budgets.filter(b => b.status === 'approved').length} de {kpis.totalBudgets} orçamentos
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm">Tempo Médio Serviço</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl">{kpis.averageServiceTime.toFixed(1)}h</div>
            <p className="text-xs text-muted-foreground mt-1">
              Por serviço concluído
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm">Valor Médio Serviço</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl">€{kpis.averageOrderValue.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Ticket médio
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main Analytics */}
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Visão Geral</TabsTrigger>
          <TabsTrigger value="performance">Performance</TabsTrigger>
          <TabsTrigger value="efficiency">Eficiência</TabsTrigger>
          <TabsTrigger value="clients">Clientes</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-4">
          <div className="grid gap-4 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Evolução da Receita</CardTitle>
                <CardDescription>
                  Receita ao longo do tempo
                </CardDescription>
              </CardHeader>
              <CardContent>
                {revenueOverTime.length > 0 ? (
                  <ResponsiveContainer width="100%" height={300}>
                    <AreaChart data={revenueOverTime}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="date" />
                      <YAxis />
                      <Tooltip 
                        formatter={(value: number) => `€${value.toFixed(2)}`}
                      />
                      <Area 
                        type="monotone" 
                        dataKey="revenue" 
                        stroke="#3b82f6" 
                        fill="#3b82f6" 
                        fillOpacity={0.3}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                    Sem dados disponíveis
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Estado dos Orçamentos</CardTitle>
                <CardDescription>
                  Distribuição por status
                </CardDescription>
              </CardHeader>
              <CardContent>
                {budgetStatusData.length > 0 ? (
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={budgetStatusData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={(entry) => `${entry.name}: ${entry.value}`}
                        outerRadius={100}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {budgetStatusData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                    Sem dados disponíveis
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Performance Tab */}
        <TabsContent value="performance" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Desempenho por Técnico</CardTitle>
              <CardDescription>
                Produtividade e receita gerada por colaborador
              </CardDescription>
            </CardHeader>
            <CardContent>
              {technicianPerformance.length > 0 ? (
                <ResponsiveContainer width="100%" height={400}>
                  <BarChart data={technicianPerformance}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis yAxisId="left" />
                    <YAxis yAxisId="right" orientation="right" />
                    <Tooltip />
                    <Legend />
                    <Bar yAxisId="left" dataKey="servicos" fill="#3b82f6" name="Serviços" />
                    <Bar 
                      yAxisId="right" 
                      dataKey="receita" 
                      fill="#10b981" 
                      name="Receita (€)" 
                    />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-[400px] flex items-center justify-center text-muted-foreground">
                  Sem dados disponíveis
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Tempo Médio por Técnico</CardTitle>
              <CardDescription>
                Média de horas por serviço
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Técnico</TableHead>
                    <TableHead className="text-right">Serviços</TableHead>
                    <TableHead className="text-right">Tempo Médio</TableHead>
                    <TableHead className="text-right">Receita Total</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {technicianPerformance.map((tech, idx) => (
                    <TableRow key={idx}>
                      <TableCell>{tech.name}</TableCell>
                      <TableCell className="text-right">{tech.servicos}</TableCell>
                      <TableCell className="text-right">
                        {tech.tempoMedio.toFixed(1)}h
                      </TableCell>
                      <TableCell className="text-right">
                        €{tech.receita.toFixed(2)}
                      </TableCell>
                    </TableRow>
                  ))}
                  {technicianPerformance.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center text-muted-foreground">
                        Sem dados disponíveis
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Efficiency Tab */}
        <TabsContent value="efficiency" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Análise de Eficiência Operacional</CardTitle>
              <CardDescription>
                Serviços ordenados por eficiência (Receita/Hora)
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Folha de Obra</TableHead>
                    <TableHead>Cliente</TableHead>
                    <TableHead>Técnico</TableHead>
                    <TableHead className="text-right">Horas</TableHead>
                    <TableHead className="text-right">Receita</TableHead>
                    <TableHead className="text-right">€/Hora</TableHead>
                    <TableHead className="text-right">Eficiência</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {serviceEfficiency.slice(0, 15).map((service, idx) => (
                    <TableRow key={idx}>
                      <TableCell>{service.number}</TableCell>
                      <TableCell>{getClientName(service.clientId)}</TableCell>
                      <TableCell>{service.technicianId}</TableCell>
                      <TableCell className="text-right">{service.hours}h</TableCell>
                      <TableCell className="text-right">€{service.revenue.toFixed(2)}</TableCell>
                      <TableCell className="text-right">
                        €{service.efficiency.toFixed(2)}
                      </TableCell>
                      <TableCell className="text-right">
                        <Badge variant={service.efficiency > 50 ? 'default' : service.efficiency > 25 ? 'secondary' : 'destructive'}>
                          {service.efficiency > 50 ? 'Excelente' : service.efficiency > 25 ? 'Bom' : 'Baixo'}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                  {serviceEfficiency.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center text-muted-foreground">
                        Sem dados disponíveis
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Clients Tab */}
        <TabsContent value="clients" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Top Clientes por Receita</CardTitle>
              <CardDescription>
                Clientes mais valiosos do período
              </CardDescription>
            </CardHeader>
            <CardContent>
              {topClients.length > 0 ? (
                <>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={topClients.slice(0, 10)}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="clientName" />
                      <YAxis />
                      <Tooltip 
                        formatter={(value: number) => `€${value.toFixed(2)}`}
                      />
                      <Bar dataKey="revenue" fill="#3b82f6" name="Receita" />
                    </BarChart>
                  </ResponsiveContainer>

                  <div className="mt-6">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Posição</TableHead>
                          <TableHead>Cliente</TableHead>
                          <TableHead className="text-right">Receita Total</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {topClients.map((client, idx) => (
                          <TableRow key={idx}>
                            <TableCell>
                              <Badge variant={idx < 3 ? 'default' : 'secondary'}>
                                #{idx + 1}
                              </Badge>
                            </TableCell>
                            <TableCell>{client.clientName}</TableCell>
                            <TableCell className="text-right">
                              €{client.revenue.toFixed(2)}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </>
              ) : (
                <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                  Sem dados disponíveis
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
