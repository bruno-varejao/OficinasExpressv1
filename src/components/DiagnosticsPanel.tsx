import { useState } from 'react'
import { Button } from './ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card'
import { Badge } from './ui/badge'
import { projectId } from '../utils/supabase/info'
import { toast } from 'sonner@2.0.3'
import { CheckCircle, XCircle, AlertCircle, Loader2 } from 'lucide-react'

interface DiagnosticsPanelProps {
  accessToken: string
  onClose: () => void
}

interface TestResult {
  name: string
  status: 'pending' | 'success' | 'error' | 'warning'
  message: string
  details?: any
}

export function DiagnosticsPanel({ accessToken, onClose }: DiagnosticsPanelProps) {
  const [testing, setTesting] = useState(false)
  const [results, setResults] = useState<TestResult[]>([])

  const runDiagnostics = async () => {
    setTesting(true)
    setResults([])
    const testResults: TestResult[] = []

    // Test 1: Health Check
    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-6971b43c/health`,
        { method: 'GET' }
      )
      
      if (response.ok) {
        const data = await response.json()
        testResults.push({
          name: 'Health Check (GET)',
          status: 'success',
          message: 'Servidor está online',
          details: data
        })
      } else {
        testResults.push({
          name: 'Health Check (GET)',
          status: 'error',
          message: `Servidor retornou status ${response.status}`
        })
      }
    } catch (error) {
      testResults.push({
        name: 'Health Check (GET)',
        status: 'error',
        message: 'Falha ao conectar: ' + error.message
      })
    }

    // Test 2: PATCH without auth
    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-6971b43c/test-patch`,
        { 
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' }
        }
      )
      
      if (response.ok) {
        const data = await response.json()
        testResults.push({
          name: 'PATCH Test (sem autenticação)',
          status: 'success',
          message: 'Método PATCH está funcionando',
          details: data
        })
      } else {
        testResults.push({
          name: 'PATCH Test (sem autenticação)',
          status: 'error',
          message: `Status ${response.status}: ${response.statusText}`
        })
      }
    } catch (error) {
      testResults.push({
        name: 'PATCH Test (sem autenticação)',
        status: 'error',
        message: 'CORS ou erro de rede: ' + error.message
      })
    }

    // Test 3: PATCH with auth
    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-6971b43c/test-patch-auth`,
        { 
          method: 'PATCH',
          headers: { 
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${accessToken}`
          }
        }
      )
      
      if (response.ok) {
        const data = await response.json()
        testResults.push({
          name: 'PATCH Test (com autenticação)',
          status: 'success',
          message: 'Autenticação está funcionando',
          details: data
        })
      } else {
        const errorData = await response.json().catch(() => ({}))
        testResults.push({
          name: 'PATCH Test (com autenticação)',
          status: 'error',
          message: `Status ${response.status}: ${errorData.error || response.statusText}`
        })
      }
    } catch (error) {
      testResults.push({
        name: 'PATCH Test (com autenticação)',
        status: 'error',
        message: 'Erro: ' + error.message
      })
    }

    // Test 4: Get budgets
    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-6971b43c/budgets`,
        { 
          method: 'GET',
          headers: { 
            'Authorization': `Bearer ${accessToken}`
          }
        }
      )
      
      if (response.ok) {
        const data = await response.json()
        testResults.push({
          name: 'GET Budgets',
          status: 'success',
          message: `Encontrados ${data.budgets?.length || 0} orçamentos`,
          details: { count: data.budgets?.length }
        })
      } else {
        testResults.push({
          name: 'GET Budgets',
          status: 'error',
          message: `Status ${response.status}`
        })
      }
    } catch (error) {
      testResults.push({
        name: 'GET Budgets',
        status: 'error',
        message: 'Erro: ' + error.message
      })
    }

    // Test 5: Access token check
    if (accessToken) {
      testResults.push({
        name: 'Token de Acesso',
        status: 'success',
        message: 'Token presente',
        details: { length: accessToken.length, preview: accessToken.substring(0, 20) + '...' }
      })
    } else {
      testResults.push({
        name: 'Token de Acesso',
        status: 'error',
        message: 'Token não encontrado'
      })
    }

    setResults(testResults)
    setTesting(false)

    const errorCount = testResults.filter(r => r.status === 'error').length
    if (errorCount === 0) {
      toast.success('Todos os testes passaram!')
    } else {
      toast.error(`${errorCount} teste(s) falharam`)
    }
  }

  const getStatusIcon = (status: TestResult['status']) => {
    switch (status) {
      case 'success':
        return <CheckCircle className="h-5 w-5 text-green-600" />
      case 'error':
        return <XCircle className="h-5 w-5 text-red-600" />
      case 'warning':
        return <AlertCircle className="h-5 w-5 text-yellow-600" />
      case 'pending':
        return <Loader2 className="h-5 w-5 text-gray-400 animate-spin" />
    }
  }

  const getStatusBadge = (status: TestResult['status']) => {
    switch (status) {
      case 'success':
        return <Badge variant="default" className="bg-green-600">Sucesso</Badge>
      case 'error':
        return <Badge variant="destructive">Erro</Badge>
      case 'warning':
        return <Badge variant="secondary" className="bg-yellow-600 text-white">Aviso</Badge>
      case 'pending':
        return <Badge variant="secondary">Pendente</Badge>
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-3xl max-h-[90vh] overflow-y-auto">
        <CardHeader>
          <CardTitle>Diagnóstico do Sistema</CardTitle>
          <CardDescription>
            Teste a conectividade e funcionalidade do servidor
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <Button 
              onClick={runDiagnostics} 
              disabled={testing}
              className="flex-1"
            >
              {testing ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  A executar testes...
                </>
              ) : (
                'Executar Diagnóstico'
              )}
            </Button>
            <Button 
              onClick={onClose} 
              variant="outline"
            >
              Fechar
            </Button>
          </div>

          {results.length > 0 && (
            <div className="space-y-3">
              <h3 className="font-medium">Resultados:</h3>
              {results.map((result, index) => (
                <div 
                  key={index} 
                  className="border rounded-lg p-4 space-y-2"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {getStatusIcon(result.status)}
                      <span className="font-medium">{result.name}</span>
                    </div>
                    {getStatusBadge(result.status)}
                  </div>
                  <p className="text-sm text-muted-foreground">{result.message}</p>
                  {result.details && (
                    <pre className="text-xs bg-slate-100 p-2 rounded overflow-x-auto">
                      {JSON.stringify(result.details, null, 2)}
                    </pre>
                  )}
                </div>
              ))}
            </div>
          )}

          {results.length === 0 && !testing && (
            <div className="text-center py-8 text-muted-foreground">
              Clique em "Executar Diagnóstico" para testar o sistema
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
