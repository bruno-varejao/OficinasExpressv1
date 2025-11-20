/**
 * Dashboard Builder - Sistema de Dashboards Personalizáveis
 * Permite criar dashboards completamente customizados com drag-and-drop
 */

export interface DashboardWidget {
  id: string
  type: 'kpi' | 'chart' | 'table' | 'list' | 'heatmap' | 'gauge' | 'stat' | 'progress' | 'timeline'
  title: string
  size: 'small' | 'medium' | 'large' | 'full'
  position: { x: number; y: number; w: number; h: number }
  dataSource: string
  config: WidgetConfig
  refreshInterval?: number // em segundos
}

export interface WidgetConfig {
  // KPI
  metric?: string
  value?: number | string
  change?: number
  changeType?: 'positive' | 'negative' | 'neutral'
  icon?: string
  color?: string
  
  // Chart
  chartType?: 'line' | 'bar' | 'pie' | 'donut' | 'area' | 'scatter'
  xAxis?: string
  yAxis?: string
  series?: Array<{ name: string; data: number[]; color?: string }>
  labels?: string[]
  
  // Table
  columns?: Array<{ key: string; label: string; sortable?: boolean }>
  data?: any[]
  pagination?: boolean
  
  // List
  items?: Array<{ id: string; title: string; subtitle?: string; icon?: string }>
  
  // Heatmap
  heatmapData?: Array<{ day: string; hour: number; value: number }>
  
  // Gauge
  gaugeValue?: number
  gaugeMax?: number
  gaugeMin?: number
  gaugeThresholds?: Array<{ value: number; color: string }>
  
  // Progress
  progressValue?: number
  progressMax?: number
  progressLabel?: string
  
  // Filtros
  dateRange?: { start: string; end: string }
  filters?: Record<string, any>
}

export interface Dashboard {
  id: string
  name: string
  description?: string
  workshopId: string
  userId?: string
  isPublic: boolean
  isDefault: boolean
  widgets: DashboardWidget[]
  layout: 'grid' | 'flex' | 'masonry'
  theme?: 'light' | 'dark' | 'auto'
  createdAt: string
  updatedAt: string
}

export class DashboardBuilder {
  /**
   * Templates de dashboards pré-configurados
   */
  static readonly TEMPLATES = {
    executive: {
      name: 'Visão Executiva',
      description: 'KPIs principais e métricas de negócio',
      widgets: [
        {
          type: 'kpi',
          title: 'Receita Mensal',
          size: 'small',
          dataSource: 'revenue',
          config: {
            metric: 'revenue',
            icon: 'euro',
            color: 'green'
          }
        },
        {
          type: 'kpi',
          title: 'Novos Clientes',
          size: 'small',
          dataSource: 'clients',
          config: {
            metric: 'new_clients',
            icon: 'users',
            color: 'blue'
          }
        },
        {
          type: 'kpi',
          title: 'Serviços Concluídos',
          size: 'small',
          dataSource: 'services',
          config: {
            metric: 'completed_services',
            icon: 'check',
            color: 'purple'
          }
        },
        {
          type: 'kpi',
          title: 'NPS Score',
          size: 'small',
          dataSource: 'satisfaction',
          config: {
            metric: 'nps',
            icon: 'star',
            color: 'orange'
          }
        },
        {
          type: 'chart',
          title: 'Receita por Mês',
          size: 'large',
          dataSource: 'revenue_trend',
          config: {
            chartType: 'line',
            xAxis: 'month',
            yAxis: 'revenue'
          }
        },
        {
          type: 'chart',
          title: 'Top 5 Serviços',
          size: 'medium',
          dataSource: 'top_services',
          config: {
            chartType: 'bar',
            xAxis: 'service',
            yAxis: 'count'
          }
        }
      ]
    },
    
    operational: {
      name: 'Dashboard Operacional',
      description: 'Dia-a-dia da oficina',
      widgets: [
        {
          type: 'stat',
          title: 'Hoje',
          size: 'medium',
          dataSource: 'today_stats',
          config: {}
        },
        {
          type: 'timeline',
          title: 'Agendamentos Hoje',
          size: 'large',
          dataSource: 'today_appointments',
          config: {}
        },
        {
          type: 'list',
          title: 'Ordens em Andamento',
          size: 'medium',
          dataSource: 'active_orders',
          config: {}
        },
        {
          type: 'heatmap',
          title: 'Horários de Pico',
          size: 'large',
          dataSource: 'busy_hours',
          config: {}
        }
      ]
    },
    
    financial: {
      name: 'Dashboard Financeiro',
      description: 'Análise financeira completa',
      widgets: [
        {
          type: 'kpi',
          title: 'Receita Total',
          size: 'small',
          dataSource: 'total_revenue',
          config: {
            metric: 'revenue',
            icon: 'euro',
            color: 'green'
          }
        },
        {
          type: 'kpi',
          title: 'Ticket Médio',
          size: 'small',
          dataSource: 'avg_ticket',
          config: {
            metric: 'average',
            icon: 'trending-up',
            color: 'blue'
          }
        },
        {
          type: 'kpi',
          title: 'Margem',
          size: 'small',
          dataSource: 'margin',
          config: {
            metric: 'margin',
            icon: 'percent',
            color: 'purple'
          }
        },
        {
          type: 'kpi',
          title: 'Pendente',
          size: 'small',
          dataSource: 'pending_payment',
          config: {
            metric: 'pending',
            icon: 'clock',
            color: 'orange'
          }
        },
        {
          type: 'chart',
          title: 'Receita vs Custos',
          size: 'large',
          dataSource: 'revenue_vs_costs',
          config: {
            chartType: 'area',
            xAxis: 'month',
            yAxis: 'value'
          }
        },
        {
          type: 'chart',
          title: 'Distribuição por Forma de Pagamento',
          size: 'medium',
          dataSource: 'payment_methods',
          config: {
            chartType: 'donut'
          }
        }
      ]
    },
    
    customer: {
      name: 'Análise de Clientes',
      description: 'Insights sobre clientes',
      widgets: [
        {
          type: 'kpi',
          title: 'Total Clientes',
          size: 'small',
          dataSource: 'total_clients',
          config: {
            metric: 'count',
            icon: 'users',
            color: 'blue'
          }
        },
        {
          type: 'kpi',
          title: 'Taxa de Retenção',
          size: 'small',
          dataSource: 'retention_rate',
          config: {
            metric: 'percentage',
            icon: 'heart',
            color: 'red'
          }
        },
        {
          type: 'kpi',
          title: 'Lifetime Value',
          size: 'small',
          dataSource: 'ltv',
          config: {
            metric: 'currency',
            icon: 'trophy',
            color: 'gold'
          }
        },
        {
          type: 'gauge',
          title: 'NPS',
          size: 'small',
          dataSource: 'nps_score',
          config: {
            gaugeMin: -100,
            gaugeMax: 100,
            gaugeThresholds: [
              { value: 0, color: 'red' },
              { value: 50, color: 'yellow' },
              { value: 70, color: 'green' }
            ]
          }
        },
        {
          type: 'chart',
          title: 'Novos Clientes por Mês',
          size: 'large',
          dataSource: 'new_clients_trend',
          config: {
            chartType: 'bar'
          }
        },
        {
          type: 'table',
          title: 'Top 10 Clientes (Valor)',
          size: 'medium',
          dataSource: 'top_clients',
          config: {
            pagination: false
          }
        }
      ]
    }
  }

  /**
   * Criar dashboard a partir de template
   */
  static createFromTemplate(
    templateKey: keyof typeof DashboardBuilder.TEMPLATES,
    workshopId: string,
    userId?: string
  ): Dashboard {
    const template = this.TEMPLATES[templateKey]
    
    // Calcular posições automáticas
    const widgets: DashboardWidget[] = template.widgets.map((widget, index) => {
      const sizeMap = {
        small: { w: 3, h: 2 },
        medium: { w: 6, h: 3 },
        large: { w: 12, h: 4 },
        full: { w: 12, h: 6 }
      }
      
      const size = sizeMap[widget.size]
      const row = Math.floor(index / 4)
      const col = (index % 4) * 3
      
      return {
        id: crypto.randomUUID(),
        ...widget,
        position: { x: col, y: row * size.h, w: size.w, h: size.h }
      } as DashboardWidget
    })

    return {
      id: crypto.randomUUID(),
      name: template.name,
      description: template.description,
      workshopId,
      userId,
      isPublic: false,
      isDefault: false,
      widgets,
      layout: 'grid',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }
  }

  /**
   * Criar widget vazio
   */
  static createWidget(type: DashboardWidget['type']): DashboardWidget {
    return {
      id: crypto.randomUUID(),
      type,
      title: `Novo ${type}`,
      size: 'medium',
      position: { x: 0, y: 0, w: 6, h: 3 },
      dataSource: '',
      config: {}
    }
  }

  /**
   * Validar dashboard
   */
  static validateDashboard(dashboard: Dashboard): { valid: boolean; errors: string[] } {
    const errors: string[] = []

    if (!dashboard.name) {
      errors.push('Nome do dashboard é obrigatório')
    }

    if (!dashboard.workshopId) {
      errors.push('Workshop ID é obrigatório')
    }

    if (dashboard.widgets.length === 0) {
      errors.push('Dashboard deve ter pelo menos 1 widget')
    }

    // Verificar sobreposições
    const positions = dashboard.widgets.map(w => w.position)
    for (let i = 0; i < positions.length; i++) {
      for (let j = i + 1; j < positions.length; j++) {
        if (this.checkOverlap(positions[i], positions[j])) {
          errors.push(`Widgets ${i} e ${j} estão sobrepostos`)
        }
      }
    }

    return {
      valid: errors.length === 0,
      errors
    }
  }

  private static checkOverlap(
    pos1: { x: number; y: number; w: number; h: number },
    pos2: { x: number; y: number; w: number; h: number }
  ): boolean {
    return !(
      pos1.x + pos1.w <= pos2.x ||
      pos2.x + pos2.w <= pos1.x ||
      pos1.y + pos1.h <= pos2.y ||
      pos2.y + pos2.h <= pos1.y
    )
  }

  /**
   * Exportar dashboard
   */
  static exportDashboard(dashboard: Dashboard): string {
    return JSON.stringify(dashboard, null, 2)
  }

  /**
   * Importar dashboard
   */
  static importDashboard(json: string): Dashboard {
    const dashboard = JSON.parse(json)
    
    // Regenerar IDs
    dashboard.id = crypto.randomUUID()
    dashboard.widgets = dashboard.widgets.map((w: DashboardWidget) => ({
      ...w,
      id: crypto.randomUUID()
    }))
    
    return dashboard
  }

  /**
   * Clonar dashboard
   */
  static cloneDashboard(dashboard: Dashboard, newName?: string): Dashboard {
    return {
      ...dashboard,
      id: crypto.randomUUID(),
      name: newName || `${dashboard.name} (cópia)`,
      widgets: dashboard.widgets.map(w => ({
        ...w,
        id: crypto.randomUUID()
      })),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }
  }

  /**
   * Atualizar widget
   */
  static updateWidget(
    dashboard: Dashboard,
    widgetId: string,
    updates: Partial<DashboardWidget>
  ): Dashboard {
    return {
      ...dashboard,
      widgets: dashboard.widgets.map(w =>
        w.id === widgetId ? { ...w, ...updates } : w
      ),
      updatedAt: new Date().toISOString()
    }
  }

  /**
   * Remover widget
   */
  static removeWidget(dashboard: Dashboard, widgetId: string): Dashboard {
    return {
      ...dashboard,
      widgets: dashboard.widgets.filter(w => w.id !== widgetId),
      updatedAt: new Date().toISOString()
    }
  }

  /**
   * Adicionar widget
   */
  static addWidget(dashboard: Dashboard, widget: DashboardWidget): Dashboard {
    return {
      ...dashboard,
      widgets: [...dashboard.widgets, widget],
      updatedAt: new Date().toISOString()
    }
  }

  /**
   * Auto-organizar widgets (sem sobreposição)
   */
  static autoLayout(dashboard: Dashboard): Dashboard {
    const sortedWidgets = [...dashboard.widgets].sort((a, b) => {
      if (a.position.y === b.position.y) {
        return a.position.x - b.position.x
      }
      return a.position.y - b.position.y
    })

    let currentY = 0
    let currentX = 0
    const gridWidth = 12

    const layoutedWidgets = sortedWidgets.map(widget => {
      // Se não cabe na linha atual, vai para a próxima
      if (currentX + widget.position.w > gridWidth) {
        currentY += widget.position.h
        currentX = 0
      }

      const newPosition = {
        x: currentX,
        y: currentY,
        w: widget.position.w,
        h: widget.position.h
      }

      currentX += widget.position.w

      return {
        ...widget,
        position: newPosition
      }
    })

    return {
      ...dashboard,
      widgets: layoutedWidgets,
      updatedAt: new Date().toISOString()
    }
  }

  /**
   * Calcular altura total do dashboard
   */
  static getTotalHeight(dashboard: Dashboard): number {
    if (dashboard.widgets.length === 0) return 0
    
    return Math.max(...dashboard.widgets.map(w => w.position.y + w.position.h))
  }

  /**
   * Obter estatísticas do dashboard
   */
  static getDashboardStats(dashboard: Dashboard) {
    const widgetTypes = dashboard.widgets.reduce((acc, w) => {
      acc[w.type] = (acc[w.type] || 0) + 1
      return acc
    }, {} as Record<string, number>)

    return {
      totalWidgets: dashboard.widgets.length,
      widgetTypes,
      height: this.getTotalHeight(dashboard),
      lastUpdated: dashboard.updatedAt
    }
  }
}
