import * as kv from './kv_store.tsx'

export interface AuditLog {
  id: string
  workshopId: string
  userId: string
  userEmail: string
  action: 'create' | 'update' | 'delete' | 'view' | 'export' | 'login' | 'logout' | 'approve' | 'reject'
  module: string
  entityType: string
  entityId: string
  changes?: {
    before?: any
    after?: any
  }
  metadata?: any
  ipAddress?: string
  userAgent?: string
  timestamp: string
}

/**
 * Registar uma ação de auditoria
 * Guarda todos os detalhes da ação para rastreabilidade e compliance
 */
export async function logAudit(log: Omit<AuditLog, 'id' | 'timestamp'>) {
  const auditLog: AuditLog = {
    ...log,
    id: crypto.randomUUID(),
    timestamp: new Date().toISOString()
  }
  
  // Guardar com timestamp no key para facilitar ordenação e queries
  const timestamp = Date.now()
  const key = `audit:${log.workshopId}:${timestamp}:${auditLog.id}`
  
  await kv.set(key, auditLog)
  
  console.log(`📝 Audit [${auditLog.action.toUpperCase()}]: ${auditLog.module}/${auditLog.entityType} by ${auditLog.userEmail}`)
  
  return auditLog
}

/**
 * Obter logs de auditoria com filtros
 */
export async function getAuditLogs(
  workshopId: string,
  filters?: {
    module?: string
    action?: string
    userId?: string
    entityType?: string
    dateFrom?: string
    dateTo?: string
  },
  limit: number = 100
): Promise<AuditLog[]> {
  const prefix = `audit:${workshopId}:`
  const allLogs = await kv.getByPrefix(prefix)
  
  let logs = allLogs
    .map(item => item.value as AuditLog)
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
  
  // Aplicar filtros
  if (filters?.module) {
    logs = logs.filter(log => log.module === filters.module)
  }
  
  if (filters?.action) {
    logs = logs.filter(log => log.action === filters.action)
  }
  
  if (filters?.userId) {
    logs = logs.filter(log => log.userId === filters.userId)
  }
  
  if (filters?.entityType) {
    logs = logs.filter(log => log.entityType === filters.entityType)
  }
  
  if (filters?.dateFrom) {
    const fromDate = new Date(filters.dateFrom).getTime()
    logs = logs.filter(log => new Date(log.timestamp).getTime() >= fromDate)
  }
  
  if (filters?.dateTo) {
    const toDate = new Date(filters.dateTo).getTime()
    logs = logs.filter(log => new Date(log.timestamp).getTime() <= toDate)
  }
  
  return logs.slice(0, limit)
}

/**
 * Obter estatísticas de auditoria
 */
export async function getAuditStats(workshopId: string, days: number = 30): Promise<{
  totalActions: number
  actionsByType: Record<string, number>
  actionsByModule: Record<string, number>
  actionsByUser: Record<string, number>
  recentActivity: AuditLog[]
}> {
  const fromDate = new Date()
  fromDate.setDate(fromDate.getDate() - days)
  
  const logs = await getAuditLogs(workshopId, {
    dateFrom: fromDate.toISOString()
  }, 10000)
  
  const actionsByType: Record<string, number> = {}
  const actionsByModule: Record<string, number> = {}
  const actionsByUser: Record<string, number> = {}
  
  logs.forEach(log => {
    actionsByType[log.action] = (actionsByType[log.action] || 0) + 1
    actionsByModule[log.module] = (actionsByModule[log.module] || 0) + 1
    actionsByUser[log.userEmail] = (actionsByUser[log.userEmail] || 0) + 1
  })
  
  return {
    totalActions: logs.length,
    actionsByType,
    actionsByModule,
    actionsByUser,
    recentActivity: logs.slice(0, 10)
  }
}

/**
 * Exportar logs de auditoria para CSV
 */
export function exportAuditLogsToCSV(logs: AuditLog[]): string {
  const headers = ['Timestamp', 'User', 'Action', 'Module', 'Entity Type', 'Entity ID', 'Metadata']
  const rows = logs.map(log => [
    log.timestamp,
    log.userEmail,
    log.action,
    log.module,
    log.entityType,
    log.entityId,
    JSON.stringify(log.metadata || {})
  ])
  
  const csv = [
    headers.join(','),
    ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
  ].join('\n')
  
  return csv
}
