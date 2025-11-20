import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card'
import { Button } from './ui/button'
import { Badge } from './ui/badge'
import { Progress } from './ui/progress'
import { WifiOff, Wifi, RefreshCw, Database, CheckCircle2, AlertCircle, Clock, Upload } from 'lucide-react'
import { toast } from 'sonner@2.0.3'
import { projectId, publicAnonKey } from '../utils/supabase/info'

interface OfflineStatusProps {
  apiEndpoint: string
  authToken: string
}

interface PendingOperation {
  id: string
  type: 'create' | 'update' | 'delete'
  entity: string
  entityId?: string
  data: any
  timestamp: string
  status: 'pending' | 'syncing' | 'synced' | 'error'
  error?: string
}

export function OfflineStatus({ apiEndpoint, authToken }: OfflineStatusProps) {
  const [isOnline, setIsOnline] = useState(navigator.onLine)
  const [pendingOps, setPendingOps] = useState<PendingOperation[]>([])
  const [syncing, setSyncing] = useState(false)
  const [syncProgress, setSyncProgress] = useState(0)
  const [lastSyncTime, setLastSyncTime] = useState<Date | null>(null)
  const [storageUsage, setStorageUsage] = useState({ used: 0, total: 0 })

  useEffect(() => {
    // Listen to online/offline events
    const handleOnline = () => {
      setIsOnline(true)
      toast.success('Conexão restaurada! A sincronizar...')
      syncPendingOperations()
    }

    const handleOffline = () => {
      setIsOnline(false)
      toast.error('Modo offline ativado. As alterações serão sincronizadas quando voltar online.')
    }

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    // Load pending operations from localStorage
    loadPendingOperations()
    calculateStorageUsage()

    // Auto-sync when online
    if (isOnline) {
      syncPendingOperations()
    }

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])

  const loadPendingOperations = () => {
    try {
      const stored = localStorage.getItem('offline_pending_ops')
      if (stored) {
        const ops = JSON.parse(stored)
        setPendingOps(ops)
      }
    } catch (error) {
      console.error('Error loading pending operations:', error)
    }
  }

  const savePendingOperations = (ops: PendingOperation[]) => {
    try {
      localStorage.setItem('offline_pending_ops', JSON.stringify(ops))
      setPendingOps(ops)
      calculateStorageUsage()
    } catch (error) {
      console.error('Error saving pending operations:', error)
      toast.error('Erro ao guardar operações pendentes')
    }
  }

  const calculateStorageUsage = () => {
    try {
      let used = 0
      for (let key in localStorage) {
        if (localStorage.hasOwnProperty(key)) {
          used += localStorage[key].length + key.length
        }
      }
      
      // LocalStorage limit is typically 5-10MB
      const total = 5 * 1024 * 1024 // 5MB in bytes
      setStorageUsage({ used, total })
    } catch (error) {
      console.error('Error calculating storage:', error)
    }
  }

  const syncPendingOperations = async () => {
    if (!isOnline || pendingOps.length === 0 || syncing) return

    try {
      setSyncing(true)
      setSyncProgress(0)

      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-6971b43c/offline/sync`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${authToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(pendingOps.filter(op => op.status === 'pending')),
        }
      )

      if (response.ok) {
        const { results } = await response.json()
        
        // Update operation statuses based on results
        const updatedOps = pendingOps.map(op => {
          const result = results.find((r: any) => r.operationId === op.id)
          if (result) {
            return {
              ...op,
              status: result.success ? 'synced' : 'error',
              error: result.error
            }
          }
          return op
        })

        // Remove synced operations
        const remainingOps = updatedOps.filter(op => op.status !== 'synced')
        savePendingOperations(remainingOps)

        setLastSyncTime(new Date())
        setSyncProgress(100)

        const syncedCount = results.filter((r: any) => r.success).length
        const failedCount = results.filter((r: any) => !r.success).length

        if (failedCount === 0) {
          toast.success(`${syncedCount} operações sincronizadas com sucesso!`)
        } else {
          toast.warning(`${syncedCount} sincronizadas, ${failedCount} falharam`)
        }
      } else {
        const error = await response.json()
        toast.error(error.error || 'Erro ao sincronizar')
      }
    } catch (error) {
      console.error('Error syncing operations:', error)
      toast.error('Erro ao sincronizar operações')
    } finally {
      setSyncing(false)
    }
  }

  const addMockOperation = () => {
    const newOp: PendingOperation = {
      id: crypto.randomUUID(),
      type: 'create',
      entity: 'client',
      data: {
        name: 'Cliente Teste',
        email: 'teste@example.com',
        phone: '+351912345678'
      },
      timestamp: new Date().toISOString(),
      status: 'pending'
    }

    const updated = [...pendingOps, newOp]
    savePendingOperations(updated)
    toast.info('Operação adicionada à fila de sincronização')
  }

  const clearSyncedOps = () => {
    const remaining = pendingOps.filter(op => op.status !== 'synced')
    savePendingOperations(remaining)
    toast.success('Operações sincronizadas removidas')
  }

  const retryFailedOps = async () => {
    const failedOps = pendingOps.map(op => 
      op.status === 'error' ? { ...op, status: 'pending' as const } : op
    )
    savePendingOperations(failedOps)
    await syncPendingOperations()
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending':
        return <Clock className="h-4 w-4 text-yellow-600" />
      case 'syncing':
        return <RefreshCw className="h-4 w-4 text-blue-600 animate-spin" />
      case 'synced':
        return <CheckCircle2 className="h-4 w-4 text-green-600" />
      case 'error':
        return <AlertCircle className="h-4 w-4 text-red-600" />
      default:
        return null
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      case 'syncing':
        return 'bg-blue-100 text-blue-800 border-blue-200'
      case 'synced':
        return 'bg-green-100 text-green-800 border-green-200'
      case 'error':
        return 'bg-red-100 text-red-800 border-red-200'
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  const storagePercentage = (storageUsage.used / storageUsage.total) * 100

  const pendingCount = pendingOps.filter(op => op.status === 'pending').length
  const syncedCount = pendingOps.filter(op => op.status === 'synced').length
  const errorCount = pendingOps.filter(op => op.status === 'error').length

  return (
    <div className="space-y-6">
      {/* Status Header */}
      <Card className={`border-2 ${isOnline ? 'border-green-200 bg-gradient-to-br from-green-50 to-emerald-50' : 'border-orange-200 bg-gradient-to-br from-orange-50 to-yellow-50'}`}>
        <CardHeader>
          <div className="flex items-start justify-between">
            <div className="space-y-1">
              <CardTitle className="flex items-center gap-2">
                {isOnline ? (
                  <Wifi className="h-6 w-6 text-green-600" />
                ) : (
                  <WifiOff className="h-6 w-6 text-orange-600" />
                )}
                Modo Offline
              </CardTitle>
              <CardDescription>
                {isOnline 
                  ? 'Conectado - Sincronização automática ativa'
                  : 'Desconectado - As alterações serão sincronizadas quando voltar online'
                }
              </CardDescription>
            </div>
            <Badge 
              className={isOnline ? 'bg-green-600' : 'bg-orange-600'}
            >
              {isOnline ? '✓ Online' : '○ Offline'}
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-4 gap-4">
            <div className="text-center p-4 bg-white rounded-lg">
              <Clock className="h-5 w-5 text-yellow-600 mx-auto mb-2" />
              <p className="text-2xl font-bold text-yellow-600">{pendingCount}</p>
              <p className="text-xs text-gray-600">Pendentes</p>
            </div>
            <div className="text-center p-4 bg-white rounded-lg">
              <CheckCircle2 className="h-5 w-5 text-green-600 mx-auto mb-2" />
              <p className="text-2xl font-bold text-green-600">{syncedCount}</p>
              <p className="text-xs text-gray-600">Sincronizadas</p>
            </div>
            <div className="text-center p-4 bg-white rounded-lg">
              <AlertCircle className="h-5 w-5 text-red-600 mx-auto mb-2" />
              <p className="text-2xl font-bold text-red-600">{errorCount}</p>
              <p className="text-xs text-gray-600">Com Erro</p>
            </div>
            <div className="text-center p-4 bg-white rounded-lg">
              <Database className="h-5 w-5 text-blue-600 mx-auto mb-2" />
              <p className="text-2xl font-bold text-blue-600">
                {(storageUsage.used / 1024).toFixed(0)}KB
              </p>
              <p className="text-xs text-gray-600">Armazenamento</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Actions */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Ações</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2 flex-wrap">
            <Button
              onClick={syncPendingOperations}
              disabled={!isOnline || syncing || pendingCount === 0}
              className="bg-gradient-to-r from-blue-600 to-blue-700"
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${syncing ? 'animate-spin' : ''}`} />
              {syncing ? 'A sincronizar...' : 'Sincronizar Agora'}
            </Button>

            <Button
              onClick={retryFailedOps}
              disabled={!isOnline || errorCount === 0}
              variant="outline"
              className="border-orange-200 text-orange-700"
            >
              <Upload className="h-4 w-4 mr-2" />
              Retentar Erros ({errorCount})
            </Button>

            <Button
              onClick={clearSyncedOps}
              disabled={syncedCount === 0}
              variant="outline"
            >
              <CheckCircle2 className="h-4 w-4 mr-2" />
              Limpar Sincronizadas ({syncedCount})
            </Button>

            <Button
              onClick={addMockOperation}
              variant="outline"
              className="border-purple-200 text-purple-700"
            >
              <Database className="h-4 w-4 mr-2" />
              Adicionar Teste
            </Button>
          </div>

          {lastSyncTime && (
            <p className="text-sm text-gray-600">
              Última sincronização: {lastSyncTime.toLocaleString('pt-PT')}
            </p>
          )}

          {syncing && (
            <div className="space-y-2">
              <Progress value={syncProgress} className="h-2" />
              <p className="text-xs text-gray-600 text-center">
                A sincronizar operações...
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Storage Usage */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Database className="h-5 w-5 text-blue-600" />
            Armazenamento Local
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Usado</span>
              <span className="font-semibold text-gray-900">
                {(storageUsage.used / 1024).toFixed(2)} KB / {(storageUsage.total / 1024 / 1024).toFixed(0)} MB
              </span>
            </div>
            <Progress value={storagePercentage} className="h-3" />
            <p className="text-xs text-gray-500">
              {storagePercentage.toFixed(1)}% do armazenamento disponível
            </p>
          </div>

          {storagePercentage > 80 && (
            <div className="p-3 bg-orange-50 border border-orange-200 rounded-lg">
              <p className="text-sm text-orange-800">
                ⚠️ Armazenamento quase cheio. Sincronize para libertar espaço.
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Pending Operations List */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">
            Operações Pendentes ({pendingOps.length})
          </CardTitle>
          <CardDescription>
            Lista de todas as operações offline à espera de sincronização
          </CardDescription>
        </CardHeader>
        <CardContent>
          {pendingOps.length > 0 ? (
            <div className="space-y-2">
              {pendingOps.map((op) => (
                <div
                  key={op.id}
                  className={`p-4 border-2 rounded-lg ${getStatusColor(op.status)}`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        {getStatusIcon(op.status)}
                        <p className="font-semibold text-sm">
                          {op.type.toUpperCase()} - {op.entity}
                        </p>
                        <Badge variant="outline" className="text-xs">
                          {op.status}
                        </Badge>
                      </div>
                      <p className="text-xs text-gray-600">
                        {new Date(op.timestamp).toLocaleString('pt-PT')}
                      </p>
                      {op.error && (
                        <p className="text-xs text-red-600 mt-1">
                          Erro: {op.error}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12 bg-gray-50 rounded-lg">
              <CheckCircle2 className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600 font-semibold">Nenhuma operação pendente</p>
              <p className="text-sm text-gray-500 mt-2">
                Todas as alterações estão sincronizadas
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Info Card */}
      <Card className="border-2 border-blue-200 bg-blue-50/50">
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <WifiOff className="h-5 w-5 text-blue-600" />
            Como Funciona o Modo Offline
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-start gap-3">
            <div className="bg-blue-600 text-white rounded-full w-6 h-6 flex items-center justify-center flex-shrink-0 text-sm font-bold">
              1
            </div>
            <div>
              <p className="font-semibold text-gray-900">Trabalhe sem conexão</p>
              <p className="text-sm text-gray-600">
                Todas as operações são guardadas localmente no seu browser
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <div className="bg-blue-600 text-white rounded-full w-6 h-6 flex items-center justify-center flex-shrink-0 text-sm font-bold">
              2
            </div>
            <div>
              <p className="font-semibold text-gray-900">Sincronização automática</p>
              <p className="text-sm text-gray-600">
                Quando voltar online, as operações são sincronizadas automaticamente
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <div className="bg-blue-600 text-white rounded-full w-6 h-6 flex items-center justify-center flex-shrink-0 text-sm font-bold">
              3
            </div>
            <div>
              <p className="font-semibold text-gray-900">Resolução de conflitos</p>
              <p className="text-sm text-gray-600">
                Operações com erro podem ser retentadas manualmente
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
