import { useState, useEffect } from 'react'
import { Button } from './components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './components/ui/card'
import { Login } from './components/Login'
import { ClientLogin } from './components/ClientLogin'
import { ClientPortal } from './components/ClientPortal'
import { PublicLandingPage } from './components/PublicLandingPage'
import { AdminPanel } from './components/AdminPanel'
import { DiagnosticsPanel } from './components/DiagnosticsPanel'
import { DashboardKPIs } from './components/DashboardKPIs'
import { ClientsModule } from './components/ClientsModule'
import { VehiclesModule } from './components/VehiclesModule'
import { CheckInModule } from './components/CheckInModule'
import { BudgetsModule } from './components/BudgetsModule'
import { WorkOrdersModule } from './components/WorkOrdersModule'
import { ServiceSheetModule } from './components/ServiceSheetModule'
import { AppointmentsModule } from './components/AppointmentsModule'
import { AgendaModule } from './components/AgendaModule'
import { WorkshopAppointmentRequestsModule } from './components/WorkshopAppointmentRequestsModule'
import { InvoicesModule } from './components/InvoicesModule'
import { BusinessIntelligenceModule } from './components/BusinessIntelligenceModule'
import CourtesyVehiclesModule from './components/CourtesyVehiclesModule'
import { PlatformManagementModule } from './components/PlatformManagementModule'
import { SupplierOrdersModule } from './components/SupplierOrdersModule'
import { StockModule } from './components/StockModule'
import { SettingsModule } from './components/SettingsModule'
import { WorkshopProvider, useWorkshop } from './components/WorkshopContext'
import { ModulesIntegrationProvider, useModulesIntegration } from './components/ModulesIntegrationContext'
import { WorkflowTimerProvider } from './components/WorkflowTimerContext'
import { createClient } from './utils/supabase/client'
import { projectId, publicAnonKey } from './utils/supabase/info'
import { Wrench, LayoutDashboard, Users, Car, FileText, ClipboardList, Calendar, Receipt, LogOut, ChevronRight, TrendingUp, CarFront, Activity, ClipboardCheck, Globe, Package, Warehouse, Settings, CalendarCheck, ChevronDown } from 'lucide-react'
import { Toaster } from './components/ui/sonner'
import { toast } from 'sonner@2.0.3'
import { NotificationBell } from './components/NotificationBell'
// Novos componentes inovadores
import { LoyaltyDashboard } from './components/LoyaltyDashboard'
import { WhatsAppIntegration } from './components/WhatsAppIntegration'
import { CustomDashboard } from './components/CustomDashboard'
import { DynamicPricingAssistant } from './components/DynamicPricingAssistant'
import { OfflineStatus } from './components/OfflineStatus'
// Ícones para novos módulos
import { Trophy, MessageCircle, LayoutDashboard as LayoutDashboardIcon, Brain, WifiOff, Sparkles } from 'lucide-react'
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarTrigger,
} from './components/ui/sidebar'

function MainApp({ accessToken, currentUser, onLogout }: { accessToken: string, currentUser: any, onLogout: () => void }) {
  const [activePage, setActivePage] = useState('dashboard')
  const [showDiagnostics, setShowDiagnostics] = useState(false)
  const [activeModules, setActiveModules] = useState<string[]>([])
  const [modulesLoaded, setModulesLoaded] = useState(false)
  const [budgetsInitialTab, setBudgetsInitialTab] = useState<string | undefined>(undefined)
  const [platformInitialTab, setPlatformInitialTab] = useState<string | undefined>(undefined)
  const [appointmentRequestsInitialTab, setAppointmentRequestsInitialTab] = useState<string | undefined>(undefined)
  const [expandedMenus, setExpandedMenus] = useState<Record<string, boolean>>({}) // Submenus collapsed by default
  const [platformLogos, setPlatformLogos] = useState<{
    logo?: string
    icon?: string
    favicon?: string
  }>({})
  const { workshop } = useWorkshop()
  const integration = useModulesIntegration()

  // Load platform logos on mount
  useEffect(() => {
    const loadPlatformLogos = async () => {
      try {
        const response = await fetch(
          `https://${projectId}.supabase.co/functions/v1/make-server-6971b43c/public/platform-logos`,
          {
            headers: {
              'Authorization': `Bearer ${publicAnonKey}`,
            },
          }
        )
        
        if (response.ok) {
          const data = await response.json()
          setPlatformLogos(data)
        }
      } catch (error) {
        console.error('Error loading platform logos:', error)
      }
    }
    
    loadPlatformLogos()
  }, [])

  // Register page navigation callback for module integration
  useEffect(() => {
    integration.registerPageNavigation((page: string) => {
      console.log('🔗 Navigation requested to page:', page)
      setActivePage(page)
    })
  }, [])

  // Handle notification click - navigate to appropriate page
  const handleNotificationClick = (notification: any) => {
    console.log('📬 Notification clicked:', notification)
    
    // Navigate to appropriate page depending on type
    if (notification.type === 'new_quote_request') {
      setActivePage('platform-management')
      toast.info('A redirecionar para gestão de plataforma...')
    } else if (notification.type === 'new_instant_quote') {
      // Navigate to platform management and open instant quotes tab
      setPlatformInitialTab('instant-quotes')
      setActivePage('platform-management')
      toast.info('A abrir Orçamentos Instantâneos...')
    } else if (notification.type === 'new_appointment_request') {
      // Navigate to appointment requests and open pending tab
      setAppointmentRequestsInitialTab('pending')
      setActivePage('appointment-requests')
      toast.info('A abrir Pedidos de Agendamento...')
    } else if (notification.type === 'quote_accepted') {
      setBudgetsInitialTab('client-approved')
      setActivePage('budgets')
      toast.info('A redirecionar para orçamentos aprovados...')
    } else if (notification.type === 'client_chose_workshop') {
      setActivePage('appointment-requests')
      toast.info('A redirecionar para pedidos de agendamento...')
    } else if (notification.type === 'budget_auto_created') {
      // Navigate to budgets module
      setActivePage('budgets')
      toast.info('A redirecionar para módulo de orçamentos...')
    } else if (notification.type === 'appointment_scheduled') {
      // Navigate to agenda module
      setActivePage('agenda')
      toast.info('A redirecionar para agenda...')
    } else if (notification.type === 'client_message') {
      // Navigate to service sheet and open the work order
      const workOrderId = notification.workOrderId || notification.budgetId // Fallback for old notifications
      
      if (workOrderId) {
        console.log('🔔 Opening service sheet for client message, workOrderId:', workOrderId)
        toast.info('A abrir Folha de Serviço...')
        
        // Use the integration system to trigger service sheet navigation
        integration.openServiceSheet(workOrderId)
      } else {
        console.warn('⚠️ No workOrderId found in notification:', notification)
        toast.error('ID da folha de obra não encontrado')
      }
    }
  }

  // Reset budget tab when navigating away
  useEffect(() => {
    if (activePage !== 'budgets') {
      setBudgetsInitialTab(undefined)
    }
    if (activePage !== 'platform-management') {
      setPlatformInitialTab(undefined)
    }
    if (activePage !== 'appointment-requests') {
      setAppointmentRequestsInitialTab(undefined)
    }
  }, [activePage])

  // Load active modules configuration for this workshop
  useEffect(() => {
    const loadActiveModules = async () => {
      if (!workshop?.id) return
      
      try {
        const response = await fetch(
          `https://${projectId}.supabase.co/functions/v1/make-server-6971b43c/workshops/${workshop.id}/active-modules`,
          {
            headers: {
              'Authorization': `Bearer ${accessToken}`,
            },
          }
        )
        
        if (response.ok) {
          const data = await response.json()
          const modules = data.modules || [
            'dashboard', 'platform', 'agenda', 'clients', 'vehicles', 'appointments', 
            'workorders', 'servicesheet', 'budgets', 'invoices', 'checkin', 
            'courtesyvehicles', 'bi', 'supplierorders', 'stock',
            // 🚀 Novos módulos inovadores
            'loyalty', 'whatsapp', 'custom-dashboard', 'pricing-ai', 'offline-mode', 'innovations'
          ]
          // Always include settings module
          if (!modules.includes('settings')) {
            modules.push('settings')
          }
          console.log(`✅ Active modules loaded for workshop ${workshop.id}:`, modules)
          setActiveModules(modules)
          
          // Show info toast if some modules are restricted
          if (data.modules && data.modules.length < 15) {
            const restrictedCount = 15 - data.modules.length
            console.log(`ℹ️ ${restrictedCount} módulos foram desativados pelo administrador`)
          }
        } else {
          console.warn('⚠️ Failed to load modules, allowing all modules by default')
          // On error, allow all modules by default
          setActiveModules([
            'dashboard', 'platform', 'agenda', 'clients', 'vehicles', 'appointments', 
            'workorders', 'servicesheet', 'budgets', 'invoices', 'checkin', 
            'courtesyvehicles', 'bi', 'supplierorders', 'stock', 'settings',
            // 🚀 Novos módulos inovadores
            'loyalty', 'whatsapp', 'custom-dashboard', 'pricing-ai', 'offline-mode', 'innovations'
          ])
        }
      } catch (error) {
        console.error('Error loading active modules:', error)
        // On error, allow all modules by default
        setActiveModules([
          'dashboard', 'platform', 'agenda', 'clients', 'vehicles', 'appointments', 
          'workorders', 'servicesheet', 'budgets', 'invoices', 'checkin', 
          'courtesyvehicles', 'bi', 'supplierorders', 'stock', 'settings',
          // 🚀 Novos módulos inovadores
          'loyalty', 'whatsapp', 'custom-dashboard', 'pricing-ai', 'offline-mode', 'innovations'
        ])
      } finally {
        setModulesLoaded(true)
      }
    }
    
    loadActiveModules()
  }, [workshop?.id, accessToken])

  const handleLogout = async () => {
    try {
      const supabase = createClient()
      await supabase.auth.signOut()
      onLogout()
      toast.success('Sessão terminada')
    } catch (error) {
      console.error('Error logging out:', error)
    }
  }

  // Mapping between admin module IDs and page IDs
  const moduleToPageMap: Record<string, string> = {
    'dashboard': 'dashboard',
    'clients': 'clients',
    'vehicles': 'vehicles',
    'appointments': 'appointments',
    'agenda': 'agenda',
    'appointmentrequests': 'appointment-requests',
    'quoterequests': 'platform-management',
    'workorders': 'workorders',
    'servicesheet': 'servicesheet',
    'budgets': 'budgets',
    'invoices': 'invoices',
    'checkin': 'checkin',
    'courtesyvehicles': 'courtesy',
    'bi': 'business-intelligence',
    'platform': 'platform-management',
    'supplierorders': 'supplier-orders',
    'stock': 'stock',
    'settings': 'settings',
  }

  const allMenuItems = [
    {
      title: 'Dashboard',
      icon: LayoutDashboard,
      page: 'dashboard',
      moduleId: 'dashboard',
    },
    {
      title: 'Gestão de Plataforma Pública',
      icon: Globe,
      page: 'platform-management',
      moduleId: 'platform',
    },
    {
      title: 'Agenda Avançada',
      icon: Calendar,
      page: 'agenda',
      moduleId: 'agenda',
      submenu: [
        {
          title: 'Pedidos de Agendamento',
          icon: CalendarCheck,
          page: 'appointment-requests',
          moduleId: 'appointmentrequests',
          alwaysVisible: true,
        }
      ]
    },
    {
      title: 'Inteligência de Negócio',
      icon: TrendingUp,
      page: 'business-intelligence',
      moduleId: 'bi',
    },
    {
      title: 'Check-in de Viaturas',
      icon: ClipboardCheck,
      page: 'checkin',
      moduleId: 'checkin',
    },
    {
      title: 'Orçamentos',
      icon: FileText,
      page: 'budgets',
      moduleId: 'budgets',
    },
    {
      title: 'Agendamentos',
      icon: Calendar,
      page: 'appointments',
      moduleId: 'appointments',
    },
    {
      title: 'Folha de Obra',
      icon: ClipboardList,
      page: 'workorders',
      moduleId: 'workorders',
      submenu: [
        {
          title: 'Folha de Serviço',
          icon: Activity,
          page: 'servicesheet',
          moduleId: 'servicesheet',
        }
      ]
    },
    {
      title: 'Faturação',
      icon: Receipt,
      page: 'invoices',
      moduleId: 'invoices',
    },
    {
      title: 'Clientes',
      icon: Users,
      page: 'clients',
      moduleId: 'clients',
    },
    {
      title: 'Veículos',
      icon: Car,
      page: 'vehicles',
      moduleId: 'vehicles',
    },
    {
      title: 'Viaturas de Cortesia',
      icon: CarFront,
      page: 'courtesy',
      moduleId: 'courtesyvehicles',
    },
    {
      title: 'Encomenda a Fornecedores',
      icon: Package,
      page: 'supplier-orders',
      moduleId: 'supplierorders',
    },
    {
      title: 'Stock',
      icon: Warehouse,
      page: 'stock',
      moduleId: 'stock',
    },
    {
      title: 'Configurações',
      icon: Settings,
      page: 'settings',
      moduleId: 'settings',
      alwaysVisible: true, // Always show settings regardless of module configuration
    },
    // 🚀 NOVOS MÓDULOS INOVADORES
    {
      title: 'Fidelização de Clientes',
      icon: Trophy,
      page: 'loyalty',
      moduleId: 'loyalty',
    },
    {
      title: 'Integração WhatsApp',
      icon: MessageCircle,
      page: 'whatsapp',
      moduleId: 'whatsapp',
    },
    {
      title: 'Painel Personalizado',
      icon: LayoutDashboardIcon,
      page: 'custom-dashboard',
      moduleId: 'custom-dashboard',
    },
    {
      title: 'Assistente de Preços Dinâmicos',
      icon: Brain,
      page: 'pricing-ai',
      moduleId: 'pricing-ai',
    },
    {
      title: 'Modo Offline',
      icon: WifiOff,
      page: 'offline-mode',
      moduleId: 'offline-mode',
    },
    {
      title: 'Inovações',
      icon: Sparkles,
      page: 'innovations',
      moduleId: 'innovations',
    },
  ]

  // Filter menu items based on active modules
  const menuItems = modulesLoaded 
    ? allMenuItems.filter(item => (item as any).alwaysVisible || activeModules.includes(item.moduleId))
    : allMenuItems // Show all items while loading

  // Redirect to first available module if current page is not in active modules
  useEffect(() => {
    if (modulesLoaded && menuItems.length > 0) {
      const currentMenuItem = allMenuItems.find(item => item.page === activePage)
      if (currentMenuItem && !(currentMenuItem as any).alwaysVisible && !activeModules.includes(currentMenuItem.moduleId)) {
        console.log(`⚠️ Current page "${activePage}" is not an active module, redirecting to first available module`)
        setActivePage(menuItems[0].page)
        toast.info(`Módulo "${currentMenuItem.title}" não está ativo para esta oficina`)
      }
    }
  }, [modulesLoaded, activeModules, activePage])

  const renderPage = () => {
    // Show loading state while modules are being loaded
    if (!modulesLoaded) {
      return (
        <div className="flex items-center justify-center h-full">
          <Card className="max-w-md border-2 border-blue-100">
            <CardHeader className="text-center">
              <div className="mx-auto mb-4 h-12 w-12 rounded-xl bg-gradient-to-br from-blue-600 to-orange-500 animate-pulse"></div>
              <CardTitle className="bg-gradient-to-r from-blue-600 to-orange-600 bg-clip-text text-transparent">
                A carregar módulos
              </CardTitle>
              <CardDescription>
                Por favor aguarde...
              </CardDescription>
            </CardHeader>
          </Card>
        </div>
      )
    }

    // Show message if no modules are active
    if (menuItems.length === 0) {
      return (
        <div className="flex items-center justify-center h-full">
          <Card className="max-w-md border-2 border-orange-200">
            <CardHeader className="text-center">
              <div className="mx-auto mb-4 h-12 w-12 rounded-xl bg-gradient-to-br from-orange-100 to-red-100 flex items-center justify-center">
                <Activity className="h-6 w-6 text-orange-600" />
              </div>
              <CardTitle className="text-orange-900">Nenhum Módulo Ativo</CardTitle>
              <CardDescription>
                Não existem módulos ativos para a sua oficina. Por favor, contacte o administrador da plataforma.
              </CardDescription>
            </CardHeader>
          </Card>
        </div>
      )
    }

    // Check if current page module is active
    const currentMenuItem = allMenuItems.find(item => item.page === activePage)
    if (currentMenuItem && !(currentMenuItem as any).alwaysVisible && !activeModules.includes(currentMenuItem.moduleId)) {
      return (
        <div className="flex items-center justify-center h-full">
          <Card className="max-w-md border-2 border-red-200">
            <CardHeader className="text-center">
              <div className="mx-auto mb-4 h-12 w-12 rounded-xl bg-gradient-to-br from-red-100 to-orange-100 flex items-center justify-center">
                <Activity className="h-6 w-6 text-red-600" />
              </div>
              <CardTitle className="text-red-900">Módulo Não Disponível</CardTitle>
              <CardDescription>
                O módulo "{currentMenuItem.title}" não está ativo para a sua oficina. Por favor, contacte o administrador.
              </CardDescription>
            </CardHeader>
            <CardContent className="text-center">
              <Button 
                onClick={() => setActivePage(menuItems[0].page)}
                className="bg-gradient-to-r from-blue-600 to-orange-500 hover:from-blue-700 hover:to-orange-600"
              >
                Voltar ao {menuItems[0].title}
              </Button>
            </CardContent>
          </Card>
        </div>
      )
    }

    switch (activePage) {
      case 'dashboard':
        return <DashboardKPIs accessToken={accessToken} />
      case 'business-intelligence':
        return <BusinessIntelligenceModule accessToken={accessToken} />
      case 'checkin':
        return <CheckInModule accessToken={accessToken} />
      case 'budgets':
        return <BudgetsModule accessToken={accessToken} initialTab={budgetsInitialTab} />
      case 'appointments':
        return <AppointmentsModule accessToken={accessToken} />
      case 'agenda':
        return <AgendaModule accessToken={accessToken} />
      case 'appointment-requests':
        return <WorkshopAppointmentRequestsModule accessToken={accessToken} initialTab={appointmentRequestsInitialTab} />
      case 'workorders':
        return <WorkOrdersModule accessToken={accessToken} />
      case 'servicesheet':
        return <ServiceSheetModule accessToken={accessToken} />
      case 'invoices':
        return <InvoicesModule accessToken={accessToken} />
      case 'clients':
        return <ClientsModule accessToken={accessToken} />
      case 'vehicles':
        return <VehiclesModule accessToken={accessToken} />
      case 'courtesy':
        return <CourtesyVehiclesModule accessToken={accessToken} />
      case 'platform-management':
        return <PlatformManagementModule accessToken={accessToken} initialTab={platformInitialTab} />
      case 'supplier-orders':
        return <SupplierOrdersModule accessToken={accessToken} />
      case 'stock':
        return <StockModule accessToken={accessToken} />
      case 'settings':
        return <SettingsModule accessToken={accessToken} />
      // 🚀 NOVOS MÓDULOS INOVADORES
      case 'loyalty':
        return <LoyaltyDashboard clientId={currentUser?.id || ''} workshopId={workshop?.id || ''} accessToken={accessToken} />
      case 'whatsapp':
        return <WhatsAppIntegration workshopId={workshop?.id || ''} />
      case 'custom-dashboard':
        return <CustomDashboard workshopId={workshop?.id || ''} userId={currentUser?.id} />
      case 'pricing-ai':
        return <DynamicPricingAssistant />
      case 'offline-mode':
        return <OfflineStatus apiEndpoint={`https://${projectId}.supabase.co/functions/v1/make-server-6971b43c`} authToken={accessToken} />
      default:
        return <DashboardKPIs accessToken={accessToken} />
    }
  }

  if (showDiagnostics) {
    return <DiagnosticsPanel accessToken={accessToken} onClose={() => setShowDiagnostics(false)} />
  }

  return (
    <SidebarProvider>
      <div className="flex w-full min-h-screen">
        <Sidebar>
          <SidebarHeader className="border-b-2 border-blue-100 bg-gradient-to-br from-blue-50 to-orange-50">
            <div className="flex items-center gap-3 px-4 py-3">
              {workshop?.logoUrl ? (
                <div className="p-2 bg-white rounded-xl shadow-md">
                  <img 
                    src={workshop.logoUrl} 
                    alt={workshop.name}
                    className="h-10 w-auto max-w-[120px] object-contain"
                  />
                </div>
              ) : (
                <>
                  <div className="relative">
                    <div className="absolute inset-0 bg-gradient-to-br from-blue-500 to-orange-500 rounded-2xl blur opacity-40"></div>
                    <div className="relative h-12 w-12 rounded-2xl bg-gradient-to-br from-blue-600 to-orange-500 flex items-center justify-center shadow-lg">
                      <Wrench className="h-6 w-6 text-white" />
                    </div>
                  </div>
                  <div>
                    <h1 className="font-bold text-base bg-gradient-to-r from-blue-600 to-orange-600 bg-clip-text text-transparent">
                      OficinasExpress
                    </h1>
                    {workshop && (
                      <p className="text-xs text-gray-600 truncate max-w-[150px]">
                        {workshop.name}
                      </p>
                    )}
                  </div>
                </>
              )}
            </div>
          </SidebarHeader>

          <SidebarContent className="bg-gradient-to-b from-blue-50/30 to-orange-50/30">
            <SidebarGroup>
              <SidebarGroupLabel className="text-blue-900 font-bold">Menu Principal</SidebarGroupLabel>
              <SidebarGroupContent>
                {!modulesLoaded ? (
                  <div className="px-4 py-8 text-center">
                    <div className="inline-block h-6 w-6 rounded-lg bg-gradient-to-br from-blue-600 to-orange-500 animate-pulse mb-2"></div>
                    <p className="text-xs text-gray-500">A carregar módulos...</p>
                  </div>
                ) : menuItems.length === 0 ? (
                  <div className="px-4 py-8 text-center">
                    <p className="text-xs text-gray-600">Nenhum módulo ativo</p>
                    <p className="text-xs text-gray-500 mt-1">Contacte o administrador</p>
                  </div>
                ) : (
                  <SidebarMenu>
                    {menuItems.map((item: any) => (
                      <div key={item.page}>
                        <SidebarMenuItem>
                          <SidebarMenuButton
                            onClick={() => {
                              setActivePage(item.page)
                              if (item.submenu) {
                                setExpandedMenus(prev => ({ ...prev, [item.page]: !prev[item.page] }))
                              }
                            }}
                            isActive={activePage === item.page}
                            className={activePage === item.page ? 'bg-gradient-to-r from-blue-600 to-orange-500 text-white hover:from-blue-700 hover:to-orange-600' : 'hover:bg-blue-50'}
                          >
                            <item.icon className="h-4 w-4" />
                            <span className="flex-1">{item.title}</span>
                            {item.submenu && (
                              <ChevronDown className={`h-4 w-4 transition-transform ${expandedMenus[item.page] ? 'rotate-180' : ''}`} />
                            )}
                          </SidebarMenuButton>
                        </SidebarMenuItem>
                        {item.submenu && expandedMenus[item.page] && (
                          <div className="ml-4 mt-1 space-y-1">
                            {item.submenu.filter((subItem: any) => subItem.alwaysVisible || activeModules.includes(subItem.moduleId)).map((subItem: any) => (
                              <SidebarMenuItem key={subItem.page}>
                                <SidebarMenuButton
                                  onClick={() => setActivePage(subItem.page)}
                                  isActive={activePage === subItem.page}
                                  className={`pl-2 ${activePage === subItem.page ? 'bg-gradient-to-r from-blue-500 to-orange-400 text-white hover:from-blue-600 hover:to-orange-500' : 'hover:bg-blue-50'}`}
                                >
                                  <subItem.icon className="h-3.5 w-3.5" />
                                  <span className="text-sm">{subItem.title}</span>
                                </SidebarMenuButton>
                              </SidebarMenuItem>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                  </SidebarMenu>
                )}
              </SidebarGroupContent>
            </SidebarGroup>
          </SidebarContent>

          <SidebarFooter className="border-t-2 border-blue-100 bg-gradient-to-br from-blue-50 to-orange-50">
            <div className="px-4 py-3 space-y-3">
              <div className="text-xs p-2 bg-white rounded-lg shadow-sm">
                <p className="truncate font-semibold text-gray-700">{currentUser?.email}</p>
                <p className="capitalize text-blue-600 font-medium">{currentUser?.user_metadata?.role || 'utilizador'}</p>
              </div>
              <div className="flex gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  className="flex-1 bg-blue-50 hover:bg-blue-100 text-blue-700"
                  onClick={() => setShowDiagnostics(true)}
                >
                  <Activity className="h-4 w-4 mr-2" />
                  Debug
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="flex-1 border-orange-200 hover:bg-orange-50 text-orange-700"
                  onClick={handleLogout}
                >
                  <LogOut className="h-4 w-4 mr-2" />
                  Sair
                </Button>
              </div>
              
              {/* Powered By Platform Logo */}
              {(platformLogos.logo || platformLogos.icon) && (
                <div className="pt-2 pb-1 border-t border-blue-100">
                  <div className="flex flex-col items-center justify-center gap-1.5">
                    <span className="text-[10px] text-gray-500 uppercase tracking-wider font-medium">
                      Powered by
                    </span>
                    <img 
                      src={platformLogos.logo || platformLogos.icon} 
                      alt="Platform Logo" 
                      className="h-6 object-contain opacity-70 hover:opacity-100 transition-opacity"
                    />
                  </div>
                </div>
              )}
            </div>
          </SidebarFooter>
        </Sidebar>

        <main className="flex-1 overflow-auto bg-white relative">
          {/* Animated Background */}
          <div className="fixed inset-0 -z-10 pointer-events-none">
            <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-blue-50 via-white to-orange-50"></div>
            <div className="absolute top-20 right-0 w-[600px] h-[600px] bg-blue-400/20 rounded-full blur-3xl"></div>
            <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-orange-400/20 rounded-full blur-3xl"></div>
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] bg-blue-500/10 rounded-full blur-3xl"></div>
          </div>
          
          <div className="border-b bg-white/80 backdrop-blur-xl shadow-sm sticky top-0 z-10">
            <div className="flex h-14 items-center gap-4 px-4 border-b-2 border-transparent bg-gradient-to-r from-blue-600/10 via-transparent to-orange-600/10">
              <SidebarTrigger className="hover:bg-blue-50" />
              <div className="flex items-center gap-2 flex-1">
                <ChevronRight className="h-4 w-4 text-blue-600" />
                <span className="font-bold bg-gradient-to-r from-blue-600 to-orange-600 bg-clip-text text-transparent">
                  {menuItems.find((item) => item.page === activePage)?.title || 'Dashboard'}
                </span>
              </div>
              {workshop?.id && (
                <NotificationBell 
                  accessToken={accessToken}
                  workshopId={workshop.id}
                  onNotificationClick={handleNotificationClick}
                />
              )}
            </div>
          </div>
          <div className="p-6">{renderPage()}</div>
        </main>
      </div>
      <Toaster />
    </SidebarProvider>
  )
}

export default function App() {
  const [view, setView] = useState<'public' | 'workshop-login' | 'workshop-app' | 'client-login' | 'client-portal' | 'admin'>('public')
  const [accessToken, setAccessToken] = useState<string | null>(null)
  const [currentUser, setCurrentUser] = useState<any>(null)
  const [workshopId, setWorkshopId] = useState<string | null>(null)

  // Load platform logos and apply favicon
  useEffect(() => {
    const loadPlatformLogos = async () => {
      try {
        const response = await fetch(
          `https://${projectId}.supabase.co/functions/v1/make-server-6971b43c/public/platform-logos`
        )

        if (response.ok) {
          const data = await response.json()
          const logos = data.logos || {}
          
          // Apply favicon if available
          if (logos.favicon) {
            let link = document.querySelector("link[rel~='icon']") as HTMLLinkElement
            if (!link) {
              link = document.createElement('link')
              link.rel = 'icon'
              document.head.appendChild(link)
            }
            link.href = logos.favicon
          }
        }
      } catch (error) {
        console.error('Error loading platform logos:', error)
      }
    }

    loadPlatformLogos()
  }, [])

  // Check for existing session on mount
  useEffect(() => {
    const checkSession = async () => {
      try {
        const supabase = createClient()
        const { data: { session } } = await supabase.auth.getSession()

        if (session) {
          // Check if it's a workshop/admin user or client
          const response = await fetch(
            `https://${projectId}.supabase.co/functions/v1/make-server-6971b43c/me`,
            {
              headers: {
                'Authorization': `Bearer ${session.access_token}`,
              },
            }
          )

          if (response.ok) {
            const userData = await response.json()
            // Check for both 'admin' (platform admin) and 'administrador' (workshop admin)
            const isAdmin = userData.user.role === 'admin' || userData.user.role === 'administrador'
            
            if (isAdmin) {
              setView('admin')
              setAccessToken(session.access_token)
              setCurrentUser(session.user)
            } else {
              // Workshop user
              setView('workshop-app')
              setAccessToken(session.access_token)
              setCurrentUser(session.user)
              setWorkshopId(userData.user.workshopId)
            }
          } else {
            // Try client profile
            const clientResponse = await fetch(
              `https://${projectId}.supabase.co/functions/v1/make-server-6971b43c/client/profile`,
              {
                headers: {
                  'Authorization': `Bearer ${session.access_token}`,
                },
              }
            )

            if (clientResponse.ok) {
              setView('client-portal')
              setAccessToken(session.access_token)
              setCurrentUser(session.user)
            }
          }
        }
      } catch (error) {
        console.error('Error checking session:', error)
      }
    }

    checkSession()
  }, [])

  const handleWorkshopLoginSuccess = (token: string, user: any) => {
    setAccessToken(token)
    setCurrentUser(user)
    
    // Fetch user profile to get workshopId
    fetch(`https://${projectId}.supabase.co/functions/v1/make-server-6971b43c/me`, {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    })
      .then(response => response.json())
      .then(data => {
        if (data.user) {
          setWorkshopId(data.user.workshopId)
          setView('workshop-app')
        }
      })
      .catch(error => {
        console.error('Error fetching user profile:', error)
        toast.error('Erro ao carregar perfil de utilizador')
      })
  }

  const handleClientLoginSuccess = (token: string, user: any) => {
    setAccessToken(token)
    setCurrentUser(user)
    setView('client-portal')
  }

  const handleAdminAccess = (token?: string, user?: any) => {
    console.log('🔑 handleAdminAccess called with token:', token ? 'Yes' : 'No')
    console.log('🔑 handleAdminAccess called with user:', user ? 'Yes' : 'No')
    
    if (token && user) {
      console.log('✅ Setting admin token and user in state')
      setAccessToken(token)
      setCurrentUser(user)
    } else {
      console.log('ℹ️ No token/user provided, will prompt for login')
    }
    
    console.log('🎯 Setting view to: admin')
    setView('admin')
  }

  const handleLogout = () => {
    setAccessToken(null)
    setCurrentUser(null)
    setWorkshopId(null)
    setView('public')
  }

  // Render based on view
  if (view === 'public') {
    return (
      <>
        <PublicLandingPage 
          onWorkshopLogin={() => setView('workshop-login')}
          onClientLogin={() => setView('client-login')}
          onAdminAccess={handleAdminAccess}
        />
        <Toaster />
      </>
    )
  }

  if (view === 'workshop-login') {
    return (
      <>
        <Login 
          onLoginSuccess={handleWorkshopLoginSuccess}
          onAdminAccess={handleAdminAccess}
          onBack={() => setView('public')}
        />
        <Toaster />
      </>
    )
  }

  if (view === 'client-login') {
    return (
      <>
        <ClientLogin 
          onLoginSuccess={handleClientLoginSuccess}
          onBack={() => setView('public')}
        />
        <Toaster />
      </>
    )
  }

  if (view === 'client-portal' && accessToken && currentUser) {
    return (
      <>
        <ClientPortal 
          accessToken={accessToken}
          user={currentUser}
          onLogout={handleLogout}
        />
        <Toaster />
      </>
    )
  }

  if (view === 'admin') {
    // Get token from state or sessionStorage
    const token = accessToken || sessionStorage.getItem('adminToken')
    
    console.log('🔐 Admin view - Token:', token ? 'Exists' : 'Missing')
    console.log('🔐 Admin view - AccessToken state:', accessToken ? 'Set' : 'Not set')
    
    if (token) {
      // Has token, show admin panel
      console.log('✅ Showing AdminPanel')
      return (
        <>
          <AdminPanel 
            accessToken={token}
            onBack={() => {
              sessionStorage.removeItem('adminToken')
              setAccessToken(null)
              setCurrentUser(null)
              setView('public')
            }}
          />
          <Toaster />
        </>
      )
    }
    
    // No token, show login with admin mode
    console.log('⚠️ No token, showing Login for admin')
    return (
      <>
        <Login 
          onLoginSuccess={handleWorkshopLoginSuccess}
          onAdminAccess={handleAdminAccess}
          onBack={() => setView('public')}
        />
        <Toaster />
      </>
    )
  }

  if (view === 'workshop-app' && accessToken && currentUser && workshopId) {
    return (
      <WorkshopProvider workshopId={workshopId} accessToken={accessToken}>
        <WorkflowTimerProvider accessToken={accessToken}>
          <ModulesIntegrationProvider>
            <MainApp accessToken={accessToken} currentUser={currentUser} onLogout={handleLogout} />
          </ModulesIntegrationProvider>
        </WorkflowTimerProvider>
      </WorkshopProvider>
    )
  }

  // Default fallback
  return (
    <>
      <PublicLandingPage 
        onWorkshopLogin={() => setView('workshop-login')}
        onClientLogin={() => setView('client-login')}
        onAdminAccess={handleAdminAccess}
      />
      <Toaster />
    </>
  )
}