import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from './ui/card'
import { Users, FileText, CheckCircle, Euro, Receipt, TrendingUp, Building2 } from 'lucide-react'
import { projectId } from '../utils/supabase/info'
import { useWorkshop } from './WorkshopContext'

interface DashboardKPIsProps {
  accessToken: string
}

interface KPIData {
  totalClients: number
  totalBudgets: number
  approvalRate: number
  completedServices: number
  totalRevenue: number
  averageTicket: number
  pendingInvoices: number
}

export function DashboardKPIs({ accessToken }: DashboardKPIsProps) {
  const [kpis, setKpis] = useState<KPIData | null>(null)
  const [loading, setLoading] = useState(true)
  const { workshop, loading: workshopLoading } = useWorkshop()

  useEffect(() => {
    if (!workshopLoading) {
      fetchKPIs()
    }
  }, [workshopLoading])

  const fetchKPIs = async () => {
    try {
      console.log('📊 Fetching KPIs for workshop:', workshop?.name)
      
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-6971b43c/analytics/dashboard`,
        {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
          },
        }
      )

      if (response.ok) {
        const data = await response.json()
        console.log('✅ KPIs received:', data.kpis)
        setKpis(data.kpis)
      } else {
        console.error('❌ Error fetching KPIs:', await response.text())
      }
    } catch (error) {
      console.error('❌ Error fetching KPIs:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading || workshopLoading) {
    return (
      <div className="space-y-4">
        <div className="h-24 bg-gradient-to-r from-blue-100 to-orange-100 animate-pulse rounded-xl" />
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Card key={i} className="border-0 bg-white/80 backdrop-blur-xl shadow-lg">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <div className="h-4 w-24 bg-gradient-to-r from-blue-200 to-orange-200 animate-pulse rounded" />
              </CardHeader>
              <CardContent>
                <div className="h-8 w-16 bg-gradient-to-r from-blue-200 to-orange-200 animate-pulse rounded" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    )
  }

  if (!kpis) return null

  const kpiCards = [
    {
      title: 'Total Clientes',
      value: kpis.totalClients,
      icon: Users,
      color: 'text-blue-600',
      description: 'Clientes registados'
    },
    {
      title: 'Taxa Aprovação',
      value: `${kpis.approvalRate}%`,
      icon: CheckCircle,
      color: 'text-green-600',
      description: 'Orçamentos aprovados'
    },
    {
      title: 'Serviços Completos',
      value: kpis.completedServices,
      icon: FileText,
      color: 'text-purple-600',
      description: 'Serviços finalizados'
    },
    {
      title: 'Receita Total',
      value: `€${kpis.totalRevenue.toLocaleString('pt-PT', { minimumFractionDigits: 2 })}`,
      icon: Euro,
      color: 'text-emerald-600',
      description: 'Faturas pagas'
    },
    {
      title: 'Ticket Médio',
      value: `€${kpis.averageTicket}`,
      icon: TrendingUp,
      color: 'text-orange-600',
      description: 'Valor médio por serviço'
    },
    {
      title: 'Faturas Pendentes',
      value: kpis.pendingInvoices,
      icon: Receipt,
      color: 'text-red-600',
      description: 'A aguardar pagamento'
    },
  ]

  return (
    <div className="space-y-6">
      {/* Workshop Header */}
      {workshop && (
        <Card className="border-0 bg-gradient-to-br from-blue-50 via-white to-orange-50 backdrop-blur-xl shadow-xl relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-600 via-orange-500 to-blue-600"></div>
          <CardHeader className="pb-3">
            <div className="flex items-center gap-4">
              {workshop.logoUrl ? (
                <div className="p-2 bg-white rounded-xl shadow-md">
                  <img 
                    src={workshop.logoUrl} 
                    alt={workshop.name}
                    className="h-12 w-auto object-contain"
                  />
                </div>
              ) : (
                <div className="relative">
                  <div className="absolute inset-0 bg-gradient-to-br from-blue-500 to-orange-500 rounded-2xl blur opacity-40"></div>
                  <div className="relative h-14 w-14 rounded-2xl bg-gradient-to-br from-blue-600 to-orange-500 flex items-center justify-center shadow-lg">
                    <Building2 className="h-7 w-7 text-white" />
                  </div>
                </div>
              )}
              <div>
                <CardTitle className="text-xl bg-gradient-to-r from-blue-600 to-orange-600 bg-clip-text text-transparent">
                  {workshop.name}
                </CardTitle>
                <CardDescription className="text-sm text-gray-600 mt-1">
                  Dados da sua oficina • Atualizados em tempo real
                </CardDescription>
              </div>
            </div>
          </CardHeader>
        </Card>
      )}

      {/* KPI Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {kpiCards.map((kpi, index) => (
          <Card 
            key={index} 
            className="hover:shadow-2xl transition-all hover:-translate-y-1 border-0 bg-white/80 backdrop-blur-xl relative overflow-hidden group"
          >
            <div className={`absolute top-0 left-0 w-full h-1 bg-gradient-to-r ${
              index === 0 ? 'from-blue-500 to-blue-600' :
              index === 1 ? 'from-green-500 to-green-600' :
              index === 2 ? 'from-purple-500 to-purple-600' :
              index === 3 ? 'from-emerald-500 to-emerald-600' :
              index === 4 ? 'from-orange-500 to-orange-600' :
              'from-red-500 to-red-600'
            }`}></div>
            <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-orange-500/5 opacity-0 group-hover:opacity-100 transition-opacity"></div>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 relative">
              <div>
                <CardTitle className="text-sm font-bold text-gray-700">{kpi.title}</CardTitle>
                <CardDescription className="text-xs mt-1">
                  {kpi.description}
                </CardDescription>
              </div>
              <div className={`h-10 w-10 rounded-xl bg-gradient-to-br ${
                index === 0 ? 'from-blue-500 to-blue-600' :
                index === 1 ? 'from-green-500 to-green-600' :
                index === 2 ? 'from-purple-500 to-purple-600' :
                index === 3 ? 'from-emerald-500 to-emerald-600' :
                index === 4 ? 'from-orange-500 to-orange-600' :
                'from-red-500 to-red-600'
              } flex items-center justify-center shadow-lg`}>
                <kpi.icon className="h-5 w-5 text-white" />
              </div>
            </CardHeader>
            <CardContent className="relative">
              <div className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-orange-600 bg-clip-text text-transparent">
                {kpi.value}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
