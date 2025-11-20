import { useState } from 'react'
import { Button } from './ui/button'
import { Input } from './ui/input'
import { Label } from './ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs'
import { createClient } from '../utils/supabase/client'
import { projectId, publicAnonKey } from '../utils/supabase/info'
import { toast } from 'sonner@2.0.3'
import { User, ArrowLeft, UserPlus } from 'lucide-react'

interface ClientLoginProps {
  onLoginSuccess: (accessToken: string, user: any) => void
  onBack: () => void
}

export function ClientLogin({ onLoginSuccess, onBack }: ClientLoginProps) {
  const [loading, setLoading] = useState(false)

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
        // Verify this is a client account
        const response = await fetch(
          `https://${projectId}.supabase.co/functions/v1/make-server-6971b43c/client/profile`,
          {
            headers: {
              'Authorization': `Bearer ${data.session.access_token}`,
            },
          }
        )

        if (response.ok) {
          toast.success('Login efetuado com sucesso!')
          onLoginSuccess(data.session.access_token, data.user)
        } else {
          toast.error('Esta conta não é de cliente')
          await supabase.auth.signOut()
        }
      }
    } catch (error) {
      console.error('Login error:', error)
      toast.error('Erro ao fazer login')
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
    const phone = formData.get('phone') as string

    console.log('👤 Registando novo cliente:', { email, name })

    try {
      // Validate
      if (!name?.trim() || !email?.trim() || !password) {
        toast.error('Por favor, preencha todos os campos obrigatórios')
        setLoading(false)
        return
      }

      if (password.length < 6) {
        toast.error('Password deve ter pelo menos 6 caracteres')
        setLoading(false)
        return
      }

      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-6971b43c/public/client-signup`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${publicAnonKey}`,
          },
          body: JSON.stringify({ name, email, password, phone }),
        }
      )

      const data = await response.json()

      if (!response.ok) {
        toast.error(data.error || 'Erro ao criar conta')
        return
      }

      toast.success('Conta criada! A fazer login...')

      // Auto login
      const supabase = createClient()
      const { data: loginData, error: loginError } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (!loginError && loginData.session) {
        onLoginSuccess(loginData.session.access_token, loginData.user)
      } else {
        toast.warning('Conta criada mas erro no login. Por favor, faça login manualmente.')
      }
    } catch (error: any) {
      console.error('Signup error:', error)
      toast.error('Erro ao criar conta')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center">
            <User className="w-8 h-8 text-white" />
          </div>
          <CardTitle>Área de Cliente</CardTitle>
          <CardDescription>
            Acompanhe os seus pedidos de orçamento e serviços
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="signin">
            <TabsList className="grid w-full grid-cols-2 mb-6">
              <TabsTrigger value="signin">Entrar</TabsTrigger>
              <TabsTrigger value="signup">Registar</TabsTrigger>
            </TabsList>

            <TabsContent value="signin">
              <form onSubmit={handleSignIn} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="signin-email">Email</Label>
                  <Input
                    id="signin-email"
                    name="email"
                    type="email"
                    placeholder="seu@email.com"
                    required
                    disabled={loading}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="signin-password">Password</Label>
                  <Input
                    id="signin-password"
                    name="password"
                    type="password"
                    placeholder="••••••••"
                    required
                    disabled={loading}
                  />
                </div>
                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? 'A entrar...' : 'Entrar'}
                </Button>
              </form>
            </TabsContent>

            <TabsContent value="signup">
              <form onSubmit={handleSignUp} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="signup-name">Nome Completo *</Label>
                  <Input
                    id="signup-name"
                    name="name"
                    type="text"
                    placeholder="João Silva"
                    required
                    disabled={loading}
                    minLength={3}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="signup-email">Email *</Label>
                  <Input
                    id="signup-email"
                    name="email"
                    type="email"
                    placeholder="seu@email.com"
                    required
                    disabled={loading}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="signup-phone">Telefone</Label>
                  <Input
                    id="signup-phone"
                    name="phone"
                    type="tel"
                    placeholder="912 345 678"
                    disabled={loading}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="signup-password">Password *</Label>
                  <Input
                    id="signup-password"
                    name="password"
                    type="password"
                    placeholder="Mínimo 6 caracteres"
                    required
                    disabled={loading}
                    minLength={6}
                  />
                  <p className="text-xs text-muted-foreground">
                    Mínimo de 6 caracteres
                  </p>
                </div>
                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? 'A criar conta...' : (
                    <>
                      <UserPlus className="h-4 w-4 mr-2" />
                      Criar Conta
                    </>
                  )}
                </Button>
              </form>
            </TabsContent>
          </Tabs>

          <div className="mt-6">
            <Button
              variant="ghost"
              className="w-full"
              onClick={onBack}
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Voltar à Página Inicial
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
