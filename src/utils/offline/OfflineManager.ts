/**
 * Offline Manager - Modo Offline Completo
 * Permite trabalhar sem internet com sincronização automática
 */

export interface OfflineOperation {
  id: string
  type: 'create' | 'update' | 'delete'
  entity: string // 'client', 'vehicle', 'workorder', etc
  entityId?: string
  data: any
  timestamp: string
  synced: boolean
  retryCount: number
  error?: string
}

export interface SyncStatus {
  isOnline: boolean
  lastSync: string | null
  pendingOperations: number
  syncInProgress: boolean
  failedOperations: number
}

export class OfflineManager {
  private static readonly DB_NAME = 'OficinasExpressOffline'
  private static readonly DB_VERSION = 1
  private static readonly STORES = {
    operations: 'offline_operations',
    cache: 'offline_cache',
    config: 'offline_config'
  }

  private static db: IDBDatabase | null = null
  private static syncInterval: NodeJS.Timeout | null = null

  /**
   * Inicializar IndexedDB
   */
  static async initialize(): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.DB_NAME, this.DB_VERSION)

      request.onerror = () => reject(request.error)
      request.onsuccess = () => {
        this.db = request.result
        this.startAutoSync()
        resolve()
      }

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result

        // Store para operações offline
        if (!db.objectStoreNames.contains(this.STORES.operations)) {
          const operationsStore = db.createObjectStore(this.STORES.operations, {
            keyPath: 'id',
            autoIncrement: false
          })
          operationsStore.createIndex('synced', 'synced', { unique: false })
          operationsStore.createIndex('timestamp', 'timestamp', { unique: false })
          operationsStore.createIndex('entity', 'entity', { unique: false })
        }

        // Store para cache de dados
        if (!db.objectStoreNames.contains(this.STORES.cache)) {
          db.createObjectStore(this.STORES.cache, {
            keyPath: 'key'
          })
        }

        // Store para configurações
        if (!db.objectStoreNames.contains(this.STORES.config)) {
          db.createObjectStore(this.STORES.config, {
            keyPath: 'key'
          })
        }
      }
    })
  }

  /**
   * Salvar operação offline
   */
  static async saveOperation(operation: Omit<OfflineOperation, 'id' | 'timestamp' | 'synced' | 'retryCount'>): Promise<string> {
    if (!this.db) await this.initialize()

    const fullOperation: OfflineOperation = {
      ...operation,
      id: crypto.randomUUID(),
      timestamp: new Date().toISOString(),
      synced: false,
      retryCount: 0
    }

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([this.STORES.operations], 'readwrite')
      const store = transaction.objectStore(this.STORES.operations)
      const request = store.add(fullOperation)

      request.onsuccess = () => resolve(fullOperation.id)
      request.onerror = () => reject(request.error)
    })
  }

  /**
   * Obter operações pendentes
   */
  static async getPendingOperations(): Promise<OfflineOperation[]> {
    if (!this.db) await this.initialize()

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([this.STORES.operations], 'readonly')
      const store = transaction.objectStore(this.STORES.operations)
      const index = store.index('synced')
      const request = index.getAll(false)

      request.onsuccess = () => {
        const operations = request.result as OfflineOperation[]
        // Ordenar por timestamp
        operations.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime())
        resolve(operations)
      }
      request.onerror = () => reject(request.error)
    })
  }

  /**
   * Marcar operação como sincronizada
   */
  static async markAsSynced(operationId: string): Promise<void> {
    if (!this.db) await this.initialize()

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([this.STORES.operations], 'readwrite')
      const store = transaction.objectStore(this.STORES.operations)
      const getRequest = store.get(operationId)

      getRequest.onsuccess = () => {
        const operation = getRequest.result as OfflineOperation
        operation.synced = true
        
        const putRequest = store.put(operation)
        putRequest.onsuccess = () => resolve()
        putRequest.onerror = () => reject(putRequest.error)
      }
      getRequest.onerror = () => reject(getRequest.error)
    })
  }

  /**
   * Marcar operação como falha
   */
  static async markAsFailed(operationId: string, error: string): Promise<void> {
    if (!this.db) await this.initialize()

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([this.STORES.operations], 'readwrite')
      const store = transaction.objectStore(this.STORES.operations)
      const getRequest = store.get(operationId)

      getRequest.onsuccess = () => {
        const operation = getRequest.result as OfflineOperation
        operation.retryCount++
        operation.error = error
        
        const putRequest = store.put(operation)
        putRequest.onsuccess = () => resolve()
        putRequest.onerror = () => reject(putRequest.error)
      }
      getRequest.onerror = () => reject(getRequest.error)
    })
  }

  /**
   * Guardar em cache
   */
  static async cacheData(key: string, data: any, ttl?: number): Promise<void> {
    if (!this.db) await this.initialize()

    const cacheEntry = {
      key,
      data,
      timestamp: new Date().toISOString(),
      expiresAt: ttl ? new Date(Date.now() + ttl).toISOString() : null
    }

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([this.STORES.cache], 'readwrite')
      const store = transaction.objectStore(this.STORES.cache)
      const request = store.put(cacheEntry)

      request.onsuccess = () => resolve()
      request.onerror = () => reject(request.error)
    })
  }

  /**
   * Obter de cache
   */
  static async getCachedData(key: string): Promise<any | null> {
    if (!this.db) await this.initialize()

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([this.STORES.cache], 'readonly')
      const store = transaction.objectStore(this.STORES.cache)
      const request = store.get(key)

      request.onsuccess = () => {
        const entry = request.result

        if (!entry) {
          resolve(null)
          return
        }

        // Verificar expiração
        if (entry.expiresAt && new Date(entry.expiresAt) < new Date()) {
          // Expirado - remover
          this.removeCachedData(key)
          resolve(null)
          return
        }

        resolve(entry.data)
      }
      request.onerror = () => reject(request.error)
    })
  }

  /**
   * Remover de cache
   */
  static async removeCachedData(key: string): Promise<void> {
    if (!this.db) await this.initialize()

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([this.STORES.cache], 'readwrite')
      const store = transaction.objectStore(this.STORES.cache)
      const request = store.delete(key)

      request.onsuccess = () => resolve()
      request.onerror = () => reject(request.error)
    })
  }

  /**
   * Sincronizar operações pendentes
   */
  static async syncPendingOperations(
    apiEndpoint: string,
    authToken: string
  ): Promise<{ success: number; failed: number }> {
    const pending = await this.getPendingOperations()
    
    let success = 0
    let failed = 0

    for (const operation of pending) {
      // Não tentar mais de 3 vezes
      if (operation.retryCount >= 3) {
        failed++
        continue
      }

      try {
        // Determinar método HTTP
        const method = operation.type === 'create' ? 'POST' :
                      operation.type === 'update' ? 'PUT' :
                      'DELETE'

        // Construir URL
        const url = operation.entityId
          ? `${apiEndpoint}/${operation.entity}/${operation.entityId}`
          : `${apiEndpoint}/${operation.entity}`

        // Fazer request
        const response = await fetch(url, {
          method,
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${authToken}`
          },
          body: operation.type !== 'delete' ? JSON.stringify(operation.data) : undefined
        })

        if (response.ok) {
          await this.markAsSynced(operation.id)
          success++
        } else {
          const errorText = await response.text()
          await this.markAsFailed(operation.id, `HTTP ${response.status}: ${errorText}`)
          failed++
        }
      } catch (error: any) {
        await this.markAsFailed(operation.id, error.message)
        failed++
      }
    }

    // Atualizar última sincronização
    await this.saveConfig('lastSync', new Date().toISOString())

    return { success, failed }
  }

  /**
   * Obter status de sincronização
   */
  static async getSyncStatus(): Promise<SyncStatus> {
    const pending = await this.getPendingOperations()
    const failed = pending.filter(op => op.retryCount >= 3).length
    const lastSync = await this.getConfig('lastSync')

    return {
      isOnline: navigator.onLine,
      lastSync,
      pendingOperations: pending.length,
      syncInProgress: false,
      failedOperations: failed
    }
  }

  /**
   * Guardar configuração
   */
  static async saveConfig(key: string, value: any): Promise<void> {
    if (!this.db) await this.initialize()

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([this.STORES.config], 'readwrite')
      const store = transaction.objectStore(this.STORES.config)
      const request = store.put({ key, value })

      request.onsuccess = () => resolve()
      request.onerror = () => reject(request.error)
    })
  }

  /**
   * Obter configuração
   */
  static async getConfig(key: string): Promise<any | null> {
    if (!this.db) await this.initialize()

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([this.STORES.config], 'readonly')
      const store = transaction.objectStore(this.STORES.config)
      const request = store.get(key)

      request.onsuccess = () => {
        resolve(request.result?.value || null)
      }
      request.onerror = () => reject(request.error)
    })
  }

  /**
   * Limpar operações sincronizadas antigas
   */
  static async cleanupSyncedOperations(olderThanDays: number = 7): Promise<number> {
    if (!this.db) await this.initialize()

    const cutoffDate = new Date()
    cutoffDate.setDate(cutoffDate.getDate() - olderThanDays)

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([this.STORES.operations], 'readwrite')
      const store = transaction.objectStore(this.STORES.operations)
      const index = store.index('synced')
      const request = index.openCursor(true)

      let deletedCount = 0

      request.onsuccess = (event) => {
        const cursor = (event.target as IDBRequest).result as IDBCursorWithValue

        if (cursor) {
          const operation = cursor.value as OfflineOperation
          if (new Date(operation.timestamp) < cutoffDate) {
            cursor.delete()
            deletedCount++
          }
          cursor.continue()
        } else {
          resolve(deletedCount)
        }
      }

      request.onerror = () => reject(request.error)
    })
  }

  /**
   * Iniciar sincronização automática
   */
  static startAutoSync(intervalMinutes: number = 5, apiEndpoint?: string, authToken?: string): void {
    if (this.syncInterval) {
      clearInterval(this.syncInterval)
    }

    this.syncInterval = setInterval(async () => {
      if (navigator.onLine && apiEndpoint && authToken) {
        console.log('🔄 Auto-sync: Sincronizando operações pendentes...')
        const result = await this.syncPendingOperations(apiEndpoint, authToken)
        console.log(`✅ Auto-sync: ${result.success} sucesso, ${result.failed} falhas`)
      }
    }, intervalMinutes * 60 * 1000)
  }

  /**
   * Parar sincronização automática
   */
  static stopAutoSync(): void {
    if (this.syncInterval) {
      clearInterval(this.syncInterval)
      this.syncInterval = null
    }
  }

  /**
   * Limpar todos os dados offline
   */
  static async clearAllData(): Promise<void> {
    if (!this.db) await this.initialize()

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(
        [this.STORES.operations, this.STORES.cache, this.STORES.config],
        'readwrite'
      )

      transaction.objectStore(this.STORES.operations).clear()
      transaction.objectStore(this.STORES.cache).clear()
      transaction.objectStore(this.STORES.config).clear()

      transaction.oncomplete = () => resolve()
      transaction.onerror = () => reject(transaction.error)
    })
  }

  /**
   * Verificar se há conflitos
   */
  static async checkConflicts(entity: string, entityId: string, serverData: any): Promise<boolean> {
    const pending = await this.getPendingOperations()
    
    return pending.some(op => 
      op.entity === entity && 
      op.entityId === entityId && 
      !op.synced
    )
  }

  /**
   * Resolver conflito (última escrita ganha)
   */
  static async resolveConflict(operationId: string, resolution: 'local' | 'server'): Promise<void> {
    if (resolution === 'server') {
      // Marcar operação local como sincronizada (ignorar)
      await this.markAsSynced(operationId)
    } else {
      // Manter operação local (tentar sincronizar novamente)
      // Nada a fazer - a operação continuará pendente
    }
  }
}
