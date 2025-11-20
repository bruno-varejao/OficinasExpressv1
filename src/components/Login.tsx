import { useState, useEffect } from 'react'
import { Button } from './ui/button'
import { Input } from './ui/input'
import { Label } from './ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from './ui/dialog'
import { Alert, AlertDescription } from './ui/alert'
import { createClient } from '../utils/supabase/client'
import { projectId, publicAnonKey } from '../utils/supabase/info'
import { Wrench, Shield, CheckCircle2, XCircle, AlertCircle, ArrowLeft } from 'lucide-react'
import { toast } from 'sonner@2.0.3'

interface LoginProps {
  onLoginSuccess: (accessToken: string, user: any) => void
  onAdminAccess: (accessToken: string, user: any) => void
  onBack?: () => void
}

export function Login({ onLoginSuccess, onAdminAccess, onBack }: LoginProps) {
  const [loading, setLoading] = useState(false)
  const [showAdminLogin, setShowAdminLogin] = useState(false)
  const [showDebugDialog, setShowDebugDialog] = useState(false)
  const [debugInfo, setDebugInfo] = useState<any>(null)
  const [platformLogos, setPlatformLogos] = useState<{
    logo?: string
    icon?: string
    favicon?: string
  }>({})

  // Load platform logos on mount
  useEffect(() => {
    const loadPlatformLogos = async () => {
      try {
        console.log('🎨 [Login] Loading platform logos...')
        console.log('🔑 [Login] Using projectId:', projectId)
        console.log('🔐 [Login] Using publicAnonKey:', publicAnonKey ? 'Present' : 'Missing')
        
        const response = await fetch(
          `https://${projectId}.supabase.co/functions/v1/make-server-6971b43c/public/platform-logos`,
          {
            headers: {
              'Authorization': `Bearer ${publicAnonKey}`,
            },
          }
        )
        
        console.log('📡 [Login] Response status:', response.status)
        
        if (response.ok) {
          const data = await response.json()
          console.log('✅ [Login] Platform logos loaded:', data)
          console.log('🖼️ [Login] Logo URL:', data.logo)
          console.log('🔷 [Login] Icon URL:', data.icon)
          console.log('🌐 [Login] Favicon URL:', data.favicon)
          setPlatformLogos(data)
          console.log('💾 [Login] State updated with logos')
        } else {
          const errorText = await response.text()
          console.warn('⚠️ [Login] Failed to load platform logos:', response.status, errorText)
        }
      } catch (error) {
        console.error('❌ [Login] Error loading platform logos:', error)
      }
    }
    
    loadPlatformLogos()
  }, [])

  const handleSignIn = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setLoading(true)

    const formData = new FormData(e.currentTarget)
    const email = formData.get('email') as string
    const password = formData.get('password') as string

    try {
      const supabase = createClient()
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (error) {
        toast.error('Erro ao iniciar sessão: ' + error.message)
        return
      }

      if (data.session) {
        toast.success('Login efetuado com sucesso!')
        onLoginSuccess(data.session.access_token, data.user)
      }
    } catch (error) {
      console.error('Login error:', error)
      toast.error('Erro ao fazer login')
    } finally {
      setLoading(false)
    }
  }

  const handleAdminSignIn = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setLoading(true)

    const formData = new FormData(e.currentTarget)
    const email = formData.get('admin-email') as string
    const password = formData.get('admin-password') as string

    try {
      const supabase = createClient()
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (error) {
        toast.error('Erro ao iniciar sessão: ' + error.message)
        return
      }

      if (data.session) {
        // Verify user is admin
        const response = await fetch(
          `https://${projectId}.supabase.co/functions/v1/make-server-6971b43c/me`,
          {
            headers: {
              'Authorization': `Bearer ${data.session.access_token}`,
            },
          }
        )

        if (response.ok) {
          const userData = await response.json()
          console.log('👤 User data from /me:', userData)
          
          // Check for both 'admin' (platform admin) and 'administrador' (workshop admin)
          const isAdmin = userData.user.role === 'admin' || userData.user.role === 'administrador'
          
          if (isAdmin) {
            console.log('✅ User is admin, granting access')
            toast.success('Acesso de administrador concedido!')
            
            // Store token for admin panel
            sessionStorage.setItem('adminToken', data.session.access_token)
            console.log('💾 Token saved to sessionStorage')
            
            console.log('📞 Calling onAdminAccess with token and user')
            onAdminAccess(data.session.access_token, data.user)
          } else {
            console.log('❌ User is not admin, role:', userData.user.role)
            toast.error('Acesso negado: Esta conta não tem privilégios de administrador')
            await supabase.auth.signOut()
          }
        } else {
          console.log('❌ Error response from /me:', response.status)
          toast.error('Erro ao verificar permissões')
          await supabase.auth.signOut()
        }
      }
    } catch (error) {
      console.error('Admin login error:', error)
      toast.error('Erro ao fazer login de administrador')
    } finally {
      setLoading(false)
    }
  }

  const checkAdminStatus = async () => {
    try {
      setLoading(true)
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-6971b43c/debug/admin-status`,
        {
          headers: {
            'Authorization': `Bearer ${publicAnonKey}`,
          },
        }
      )
      
      if (response.ok) {
        const data = await response.json()
        console.log('📊 Admin Status:', data)
        setDebugInfo(data)
        setShowDebugDialog(true)
        
        if (!data.existsInKV || !data.existsInAuth) {
          toast.warning('⚠️ Conta de administrador não encontrada completamente')
        } else {
          toast.success('✅ Conta de administrador encontrada')
        }
      } else {
        toast.error('Erro ao verificar status')
      }
    } catch (error) {
      console.error('Error checking admin status:', error)
      toast.error('Erro ao verificar status do admin')
    } finally {
      setLoading(false)
    }
  }

  const forceInitAdmin = async () => {
    try {
      setLoading(true)
      toast.info('Criando/verificando conta de administrador...')
      
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-6971b43c/init-admin`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${publicAnonKey}`,
          },
        }
      )
      
      const data = await response.json()
      console.log('Init Admin Response:', data)
      
      if (response.ok && data.success) {
        toast.success('✅ Conta de admin pronta! Pode fazer login agora.', {
          duration: 5000
        })
        // Refresh status
        setTimeout(() => checkAdminStatus(), 1000)
      } else {
        toast.error('❌ Erro: ' + (data.error || 'Erro desconhecido'), {
          duration: 5000
        })
      }
    } catch (error) {
      console.error('Error initializing admin:', error)
      toast.error('Erro ao criar admin')
    } finally {
      setLoading(false)
    }
  }

  const handleSignUp = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setLoading(true)

    const formData = new FormData(e.currentTarget)
    const name = formData.get('name') as string
    const email = formData.get('email') as string
    const password = formData.get('password') as string
    const role = formData.get('role') as string
    const workshopName = formData.get('workshopName') as string

    console.log('📝 Iniciando criação de conta:', { email, name, role, workshopName })

    try {
      // Validate form data
      if (!name?.trim()) {
        toast.error('Por favor, insira o seu nome')
        setLoading(false)
        return
      }

      if (!email?.trim()) {
        toast.error('Por favor, insira o seu email')
        setLoading(false)
        return
      }

      if (!password || password.length < 6) {
        toast.error('Password deve ter pelo menos 6 caracteres')
        setLoading(false)
        return
      }

      console.log('✅ Validação local OK, enviando para servidor...')

      const response = await fetch(`https://${projectId}.supabase.co/functions/v1/make-server-6971b43c/signup`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${publicAnonKey}`,
        },
        body: JSON.stringify({ name, email, password, role, workshopName }),
      })

      console.log('📡 Resposta do servidor:', response.status, response.statusText)

      const data = await response.json()
      console.log('📦 Dados da resposta:', data)

      if (!response.ok) {
        console.error('❌ Erro do servidor:', data.error)
        toast.error(data.error || 'Erro ao criar conta', {
          duration: 5000
        })
        return
      }

      console.log('✅ Conta criada com sucesso!')
      toast.success('Conta criada! A fazer login...', {
        duration: 3000
      })
      
      // Auto login
      console.log('🔐 A fazer login automático...')
      const supabase = createClient()
      const { data: loginData, error: loginError } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (loginError) {
        console.error('❌ Erro no login automático:', loginError)
        toast.error('Conta criada mas erro ao fazer login. Por favor, faça login manualmente.')
      } else if (loginData.session) {
        console.log('✅ Login automático bem-sucedido!')
        toast.success('Login efetuado com sucesso!')
        onLoginSuccess(loginData.session.access_token, loginData.user)
      }
    } catch (error: any) {
      console.error('❌ Erro na criação de conta:', error)
      toast.error('Erro de conexão. Verifique a sua internet e tente novamente.', {
        duration: 5000
      })
    } finally {
      setLoading(false)
    }
  }

  // Debug render
  console.log('🎬 [Login] Rendering with platformLogos:', platformLogos)
  console.log('🖼️ [Login] Has logo?', !!platformLogos.logo)
  console.log('🔷 [Login] Has icon?', !!platformLogos.icon)

  return (
    <div className="min-h-screen flex items-center justify-center bg-white relative overflow-hidden p-4">
      {/* Animated Background */}
      <div className="fixed inset-0 -z-10">
        <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-blue-50 via-white to-orange-50"></div>
        <div className="absolute top-20 right-0 w-[600px] h-[600px] bg-blue-400/20 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-orange-400/20 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }}></div>
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] bg-blue-500/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '2s' }}></div>
      </div>

      <Card className="w-full max-w-md border-0 bg-white/80 backdrop-blur-xl shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-600 via-orange-500 to-blue-600"></div>
        <CardHeader className="text-center pb-6">
          {/* Platform Logo/Icon */}
          <div className="flex justify-center mb-6">
            {platformLogos.logo ? (
              <img 
                src={platformLogos.logo} 
                alt="Logo" 
                className="h-20 object-contain transition-all hover:scale-105"
                onError={(e) => console.error('❌ [Login] Error loading logo image:', platformLogos.logo)}
                onLoad={() => console.log('✅ [Login] Logo image loaded successfully')}
              />
            ) : platformLogos.icon ? (
              <img 
                src={platformLogos.icon} 
                alt="Icon" 
                className="h-20 w-auto object-contain transition-all hover:scale-105"
                onError={(e) => console.error('❌ [Login] Error loading icon image:', platformLogos.icon)}
                onLoad={() => console.log('✅ [Login] Icon image loaded successfully')}
              />
            ) : (
              <div className="relative mx-auto">
                <div className="absolute inset-0 bg-gradient-to-br from-blue-500 to-orange-500 rounded-3xl blur-xl opacity-40"></div>
                <div className="relative w-20 h-20 bg-gradient-to-br from-blue-600 to-orange-500 rounded-3xl flex items-center justify-center shadow-2xl hover:shadow-3xl transition-all">
                  {showAdminLogin ? (
                    <Shield className="w-10 h-10 text-white" />
                  ) : (
                    <Wrench className="w-10 h-10 text-white" />
                  )}
                </div>
              </div>
            )}
          </div>
          
          <CardDescription className="text-base text-gray-600">
            {showAdminLogin ? 'Painel de Administração' : 'Plataforma integrada para gestão de oficinas'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {showAdminLogin ? (
            // Admin Login Form
            <>
              <div className="mb-4 p-4 bg-gradient-to-br from-blue-50 to-orange-50 rounded-xl border-2 border-blue-100">
                <p className="text-xs font-bold text-blue-900 mb-2">
                  Credenciais de Administrador Padrão:
                </p>
                <p className="text-xs font-mono text-gray-700 bg-white p-2 rounded-lg">
                  Email: inscricoes@oficinasexpress.com<br />
                  Password: 123456789
                </p>
              </div>
              
              <form onSubmit={handleAdminSignIn} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="admin-email" className="text-gray-700 font-semibold">Email de Administrador</Label>
                  <Input
                    id="admin-email"
                    name="admin-email"
                    type="email"
                    placeholder="inscricoes@oficinasexpress.com"
                    required
                    className="border-blue-200 focus:border-blue-500 focus:ring-blue-500"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="admin-password" className="text-gray-700 font-semibold">Password</Label>
                  <Input
                    id="admin-password"
                    name="admin-password"
                    type="password"
                    placeholder="••••••••"
                    required
                    className="border-blue-200 focus:border-blue-500 focus:ring-blue-500"
                  />
                </div>
                <div className="relative group">
                  <div className="absolute inset-0 bg-gradient-to-r from-blue-600 to-orange-500 rounded-lg blur opacity-50 group-hover:opacity-75 transition-opacity"></div>
                  <Button 
                    type="submit" 
                    className="relative w-full bg-gradient-to-r from-blue-600 to-orange-500 hover:from-blue-700 hover:to-orange-600 text-white border-0" 
                    disabled={loading}
                  >
                    {loading ? 'A entrar...' : 'Aceder ao Painel Admin'}
                  </Button>
                </div>
                
                {/* Debug Tools */}
                <div className="space-y-2">
                  <Button 
                    type="button" 
                    variant="secondary" 
                    size="sm"
                    className="w-full" 
                    onClick={checkAdminStatus}
                  >
                    🔍 Verificar Status do Admin
                  </Button>
                  <Button 
                    type="button" 
                    variant="secondary" 
                    size="sm"
                    className="w-full" 
                    onClick={forceInitAdmin}
                  >
                    🔧 Forçar Criação do Admin
                  </Button>
                </div>
                
                <Button 
                  type="button" 
                  variant="outline" 
                  className="w-full" 
                  onClick={() => setShowAdminLogin(false)}
                >
                  Voltar ao Login Normal
                </Button>
              </form>
            </>
          ) : (
            // Regular Login Only
            <>
              <form onSubmit={handleSignIn} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="signin-email" className="text-gray-700 font-semibold">Email</Label>
                  <Input
                    id="signin-email"
                    name="email"
                    type="email"
                    placeholder="seu@email.com"
                    required
                    className="border-blue-200 focus:border-blue-500 focus:ring-blue-500"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="signin-password" className="text-gray-700 font-semibold">Password</Label>
                  <Input
                    id="signin-password"
                    name="password"
                    type="password"
                    placeholder="••••••••"
                    required
                    className="border-blue-200 focus:border-blue-500 focus:ring-blue-500"
                  />
                </div>
                <div className="relative group">
                  <div className="absolute inset-0 bg-gradient-to-r from-blue-600 to-orange-500 rounded-lg blur opacity-50 group-hover:opacity-75 transition-opacity"></div>
                  <Button 
                    type="submit" 
                    className="relative w-full bg-gradient-to-r from-blue-600 to-orange-500 hover:from-blue-700 hover:to-orange-600 text-white border-0" 
                    disabled={loading}
                  >
                    {loading ? 'A entrar...' : 'Entrar'}
                  </Button>
                </div>
              </form>
          
          {/* Admin Access Button */}
          <div className="mt-6 text-center">
            <Button 
              variant="ghost" 
              size="sm"
              onClick={() => setShowAdminLogin(true)}
              className="text-xs text-blue-600 hover:text-blue-800 hover:bg-blue-50"
            >
              <Shield className="h-3 w-3 mr-2" />
              Acesso de Administração
            </Button>
          </div>
          
          {/* Back to Home Button */}
          {onBack && (
            <div className="mt-3">
              <Button
                variant="ghost"
                className="w-full border border-orange-200 hover:bg-orange-50 hover:border-orange-300"
                onClick={onBack}
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Voltar à Página Inicial
              </Button>
            </div>
          )}
        </>
          )}
        </CardContent>
      </Card>

      {/* Debug Dialog */}
      <Dialog open={showDebugDialog} onOpenChange={setShowDebugDialog}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>🔍 Status da Conta de Administrador</DialogTitle>
            <DialogDescription>
              Diagnóstico detalhado da conta inscricoes@oficinasexpress.com
            </DialogDescription>
          </DialogHeader>
          
          {debugInfo && (
            <div className="space-y-4">
              {/* Status Geral */}
              <div className="grid grid-cols-2 gap-4">
                <Alert className={debugInfo.existsInAuth ? 'border-green-500' : 'border-red-500'}>
                  <div className="flex items-center gap-2">
                    {debugInfo.existsInAuth ? (
                      <CheckCircle2 className="h-4 w-4 text-green-600" />
                    ) : (
                      <XCircle className="h-4 w-4 text-red-600" />
                    )}
                    <AlertDescription>
                      <strong>Autenticação:</strong><br />
                      {debugInfo.existsInAuth ? '✅ Existe' : '❌ Não existe'}
                    </AlertDescription>
                  </div>
                </Alert>
                
                <Alert className={debugInfo.existsInKV ? 'border-green-500' : 'border-red-500'}>
                  <div className="flex items-center gap-2">
                    {debugInfo.existsInKV ? (
                      <CheckCircle2 className="h-4 w-4 text-green-600" />
                    ) : (
                      <XCircle className="h-4 w-4 text-red-600" />
                    )}
                    <AlertDescription>
                      <strong>Perfil KV:</strong><br />
                      {debugInfo.existsInKV ? '✅ Existe' : '❌ Não existe'}
                    </AlertDescription>
                  </div>
                </Alert>
              </div>

              {/* Recomendação */}
              {(!debugInfo.existsInAuth || !debugInfo.existsInKV) && (
                <Alert className="border-amber-500 bg-amber-50">
                  <AlertCircle className="h-4 w-4 text-amber-600" />
                  <AlertDescription>
                    <strong>Ação Recomendada:</strong><br />
                    A conta não está completamente configurada. Clique no botão "Forçar Criação do Admin" abaixo para resolver.
                  </AlertDescription>
                </Alert>
              )}

              {(debugInfo.existsInAuth && debugInfo.existsInKV) && (
                <Alert className="border-green-500 bg-green-50">
                  <CheckCircle2 className="h-4 w-4 text-green-600" />
                  <AlertDescription>
                    <strong>Status:</strong> Conta configurada corretamente!<br />
                    Pode fazer login com as credenciais padrão.
                  </AlertDescription>
                </Alert>
              )}

              {/* Detalhes da Autenticação */}
              {debugInfo.authData && (
                <div className="bg-slate-50 p-4 rounded-lg">
                  <h4 className="font-semibold mb-2">📋 Dados de Autenticação</h4>
                  <div className="space-y-1 text-sm font-mono">
                    <div><strong>ID:</strong> {debugInfo.authData.id}</div>
                    <div><strong>Email:</strong> {debugInfo.authData.email}</div>
                    <div><strong>Criado:</strong> {new Date(debugInfo.authData.created_at).toLocaleString('pt-PT')}</div>
                    <div><strong>Email Confirmado:</strong> {debugInfo.authData.email_confirmed ? '✅ Sim' : '❌ Não'}</div>
                  </div>
                </div>
              )}

              {/* Detalhes do Perfil KV */}
              {debugInfo.kvData && (
                <div className="bg-slate-50 p-4 rounded-lg">
                  <h4 className="font-semibold mb-2">📋 Dados do Perfil</h4>
                  <div className="space-y-1 text-sm font-mono">
                    <div><strong>Nome:</strong> {debugInfo.kvData.name}</div>
                    <div><strong>Role:</strong> <span className={(debugInfo.kvData.role === 'admin' || debugInfo.kvData.role === 'administrador') ? 'text-green-600' : 'text-red-600'}>{debugInfo.kvData.role}</span></div>
                    <div><strong>Oficina:</strong> {debugInfo.kvData.workshopName}</div>
                    <div><strong>Criado:</strong> {new Date(debugInfo.kvData.createdAt).toLocaleString('pt-PT')}</div>
                  </div>
                </div>
              )}

              {/* Estatísticas */}
              <div className="bg-slate-50 p-4 rounded-lg">
                <h4 className="font-semibold mb-2">📊 Estatísticas do Sistema</h4>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <strong>Total de Utilizadores (KV):</strong><br />
                    {debugInfo.totalUsersInKV}
                  </div>
                  <div>
                    <strong>Total de Utilizadores (Auth):</strong><br />
                    {debugInfo.totalUsersInAuth}
                  </div>
                </div>
              </div>

              {/* Ações */}
              <div className="flex gap-2 pt-4">
                <Button 
                  onClick={forceInitAdmin}
                  className="flex-1"
                  disabled={loading}
                >
                  🔧 Forçar Criação/Sincronização
                </Button>
                <Button 
                  onClick={() => {
                    setShowDebugDialog(false)
                    checkAdminStatus()
                  }}
                  variant="outline"
                  disabled={loading}
                >
                  🔄 Atualizar
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
