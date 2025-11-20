import { useState } from 'react'
import { Button } from './ui/button'
import { Input } from './ui/input'
import { Label } from './ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card'
import { Alert, AlertDescription, AlertTitle } from './ui/alert'
import { AlertCircle, CheckCircle2, XCircle, Loader2 } from 'lucide-react'
import { projectId, publicAnonKey } from '../utils/supabase/info'
import { toast } from 'sonner@2.0.3'

interface VinDecoderTestProps {
  accessToken: string
}

export function VinDecoderTest({ accessToken }: VinDecoderTestProps) {
  const [testVin, setTestVin] = useState('WVWZZZ3CZKE506421')
  const [testPlate, setTestPlate] = useState('AA-11-BB')
  const [loading, setLoading] = useState(false)
  const [apiConfigTest, setApiConfigTest] = useState<any>(null)
  const [vinDecodeTest, setVinDecodeTest] = useState<any>(null)
  const [plateSearchTest, setPlateSearchTest] = useState<any>(null)

  const testApiConfiguration = async () => {
    setLoading(true)
    setApiConfigTest(null)
    try {
      console.log('🧪 Testando configuração da API VIN Decoder...')
      
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-6971b43c/infomatricula/test-vin-decoder`,
        {
          headers: {
            'Authorization': `Bearer ${accessToken}`
          }
        }
      )
      
      const data = await response.json()
      console.log('📥 Resposta do teste de configuração:', data)
      setApiConfigTest(data)
      
      if (data.configured && response.ok) {
        toast.success('✅ API VIN Decoder configurada corretamente!')
      } else {
        toast.error('❌ API VIN Decoder não configurada', {
          description: data.message || 'Verifique a chave RAPIDAPI_VIN_DECODER_KEY'
        })
      }
    } catch (error) {
      console.error('❌ Erro ao testar configuração:', error)
      toast.error('Erro ao testar configuração')
      setApiConfigTest({ 
        error: error instanceof Error ? error.message : 'Erro desconhecido',
        configured: false
      })
    } finally {
      setLoading(false)
    }
  }

  const testVinDecode = async () => {
    if (!testVin) {
      toast.error('Por favor, insira um VIN para testar')
      return
    }
    
    setLoading(true)
    setVinDecodeTest(null)
    try {
      console.log('🧪 Testando descodificação VIN:', testVin)
      
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-6971b43c/infomatricula/decode-vin?vin=${encodeURIComponent(testVin)}`,
        {
          headers: {
            'Authorization': `Bearer ${accessToken}`
          }
        }
      )
      
      const data = await response.json()
      console.log('📥 Resposta da descodificação VIN:', data)
      setVinDecodeTest(data)
      
      if (response.ok && data.AWN_k_type) {
        toast.success('✅ VIN descodificado com sucesso!', {
          description: `K-Type: ${data.AWN_k_type}`
        })
      } else {
        toast.error('❌ Falha na descodificação VIN', {
          description: data.error || data.message || 'VIN não encontrado'
        })
      }
    } catch (error) {
      console.error('❌ Erro ao descodificar VIN:', error)
      toast.error('Erro ao descodificar VIN')
      setVinDecodeTest({ 
        error: error instanceof Error ? error.message : 'Erro desconhecido'
      })
    } finally {
      setLoading(false)
    }
  }

  const testPlateSearch = async () => {
    if (!testPlate) {
      toast.error('Por favor, insira uma matrícula para testar')
      return
    }
    
    setLoading(true)
    setPlateSearchTest(null)
    try {
      console.log('🧪 Testando busca de matrícula:', testPlate)
      
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-6971b43c/infomatricula/search?plate=${encodeURIComponent(testPlate)}`,
        {
          headers: {
            'Authorization': `Bearer ${accessToken}`
          }
        }
      )
      
      const data = await response.json()
      console.log('📥 Resposta da busca de matrícula:', data)
      setPlateSearchTest(data)
      
      if (response.ok && data.make) {
        const hasVinDecoder = data.AWN_k_type || data.AWN_code_moteur
        toast.success('✅ Matrícula encontrada!', {
          description: `${data.make} ${data.model}${hasVinDecoder ? ' (VIN Decoder: ✅)' : ' (VIN Decoder: ❌)'}`
        })
      } else {
        toast.error('❌ Matrícula não encontrada', {
          description: data.error || data.message || 'Dados não disponíveis'
        })
      }
    } catch (error) {
      console.error('❌ Erro ao buscar matrícula:', error)
      toast.error('Erro ao buscar matrícula')
      setPlateSearchTest({ 
        error: error instanceof Error ? error.message : 'Erro desconhecido'
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6 p-6">
      <div>
        <h2 className="text-2xl mb-2">🔬 Diagnóstico VIN Decoder</h2>
        <p className="text-gray-600">
          Use esta ferramenta para diagnosticar problemas com o VIN Decoder
        </p>
      </div>

      {/* Test 1: API Configuration */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertCircle className="w-5 h-5" />
            Teste 1: Configuração da API
          </CardTitle>
          <CardDescription>
            Verifica se a chave RAPIDAPI_VIN_DECODER_KEY está configurada
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Button 
            onClick={testApiConfiguration} 
            disabled={loading}
            className="w-full"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                A testar...
              </>
            ) : (
              'Testar Configuração da API'
            )}
          </Button>
          
          {apiConfigTest && (
            <Alert variant={apiConfigTest.success ? 'default' : 'destructive'}>
              {apiConfigTest.success ? (
                <CheckCircle2 className="h-4 w-4" />
              ) : (
                <XCircle className="h-4 w-4" />
              )}
              <AlertTitle>
                {apiConfigTest.success 
                  ? '✅ API Configurada Corretamente' 
                  : '❌ Problema na Configuração'}
              </AlertTitle>
              <AlertDescription>
                <div className="mt-2 space-y-2">
                  <p><strong>Mensagem:</strong> {apiConfigTest.message}</p>
                  {apiConfigTest.status && (
                    <p><strong>Status HTTP:</strong> {apiConfigTest.status}</p>
                  )}
                </div>
                <pre className="mt-2 p-2 bg-black/5 rounded text-xs overflow-auto max-h-64">
                  {JSON.stringify(apiConfigTest, null, 2)}
                </pre>
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* Test 2: VIN Decode */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertCircle className="w-5 h-5" />
            Teste 2: Descodificação VIN
          </CardTitle>
          <CardDescription>
            Testa a descodificação de um VIN específico
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="test-vin">VIN para Testar</Label>
            <Input
              id="test-vin"
              value={testVin}
              onChange={(e) => setTestVin(e.target.value)}
              placeholder="WVWZZZ3CZKE506421"
            />
            <p className="text-xs text-gray-500 mt-1">
              VIN de exemplo: WVWZZZ3CZKE506421 (VW Golf)
            </p>
          </div>
          
          <Button 
            onClick={testVinDecode} 
            disabled={loading || !testVin}
            className="w-full"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                A descodificar...
              </>
            ) : (
              'Descodificar VIN'
            )}
          </Button>
          
          {vinDecodeTest && (
            <Alert variant={vinDecodeTest.AWN_k_type ? 'default' : 'destructive'}>
              {vinDecodeTest.AWN_k_type ? (
                <CheckCircle2 className="h-4 w-4" />
              ) : (
                <XCircle className="h-4 w-4" />
              )}
              <AlertTitle>
                {vinDecodeTest.AWN_k_type 
                  ? '✅ VIN Descodificado' 
                  : '❌ Falha na Descodificação'}
              </AlertTitle>
              <AlertDescription>
                <pre className="mt-2 p-2 bg-black/5 rounded text-xs overflow-auto max-h-64">
                  {JSON.stringify(vinDecodeTest, null, 2)}
                </pre>
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* Test 3: Plate Search with VIN Decode */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertCircle className="w-5 h-5" />
            Teste 3: Busca de Matrícula + VIN Decoder
          </CardTitle>
          <CardDescription>
            Testa a busca de matrícula e descodificação automática do VIN
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="test-plate">Matrícula para Testar</Label>
            <Input
              id="test-plate"
              value={testPlate}
              onChange={(e) => setTestPlate(e.target.value)}
              placeholder="AA-11-BB"
            />
            <p className="text-xs text-gray-500 mt-1">
              Insira uma matrícula portuguesa real (ex: AA-11-BB)
            </p>
          </div>
          
          <Button 
            onClick={testPlateSearch} 
            disabled={loading || !testPlate}
            className="w-full"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                A buscar...
              </>
            ) : (
              'Buscar Matrícula'
            )}
          </Button>
          
          {plateSearchTest && (
            <Alert variant={plateSearchTest.make ? 'default' : 'destructive'}>
              {plateSearchTest.make ? (
                <CheckCircle2 className="h-4 w-4" />
              ) : (
                <XCircle className="h-4 w-4" />
              )}
              <AlertTitle>
                {plateSearchTest.make 
                  ? `✅ Matrícula Encontrada: ${plateSearchTest.make} ${plateSearchTest.model}` 
                  : '❌ Matrícula Não Encontrada'}
              </AlertTitle>
              <AlertDescription>
                {plateSearchTest.make && (
                  <div className="mb-2">
                    <strong>VIN:</strong> {plateSearchTest.vin || 'Não disponível'}
                    <br />
                    <strong>VIN Decoder:</strong> {
                      plateSearchTest.AWN_k_type 
                        ? `✅ K-Type: ${plateSearchTest.AWN_k_type}` 
                        : '❌ Não disponível'
                    }
                  </div>
                )}
                <pre className="mt-2 p-2 bg-black/5 rounded text-xs overflow-auto max-h-64">
                  {JSON.stringify(plateSearchTest, null, 2)}
                </pre>
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* Instructions */}
      <Card className="bg-blue-50 border-blue-200">
        <CardHeader>
          <CardTitle className="text-blue-900">📋 Como Interpretar os Resultados</CardTitle>
        </CardHeader>
        <CardContent className="text-blue-800 space-y-2">
          <p><strong>Teste 1 - Configuração da API:</strong></p>
          <ul className="list-disc list-inside ml-4 space-y-1">
            <li>Se <code>configured: true</code> e <code>status: 200</code> → API configurada ✅</li>
            <li>Se <code>configured: false</code> → Chave RAPIDAPI_VIN_DECODER_KEY não configurada ❌</li>
            <li>Se status ≠ 200 → Chave inválida ou quota excedida ❌</li>
          </ul>
          
          <p className="mt-4"><strong>Teste 2 - Descodificação VIN:</strong></p>
          <ul className="list-disc list-inside ml-4 space-y-1">
            <li>Se aparecer <code>AWN_k_type</code> → Descodificação funciona ✅</li>
            <li>Se aparecer erro 404 → VIN não encontrado na base de dados ⚠️</li>
            <li>Se aparecer erro → Problema com a API ❌</li>
          </ul>
          
          <p className="mt-4"><strong>Teste 3 - Busca de Matrícula:</strong></p>
          <ul className="list-disc list-inside ml-4 space-y-1">
            <li>Se aparecer <code>make</code> e <code>model</code> → InfoMatricula funciona ✅</li>
            <li>Se aparecer <code>vin</code> mas não <code>AWN_k_type</code> → VIN não foi descodificado ⚠️</li>
            <li>Se não aparecer <code>vin</code> → InfoMatricula não retornou VIN ⚠️</li>
          </ul>
        </CardContent>
      </Card>
    </div>
  )
}