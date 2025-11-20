import { Hono } from 'npm:hono'
import * as kv from './kv_store.tsx'

export function setupInnovationsRoutes(app: any, supabase: any) {
  
  // ============================================
  // 🏆 LOYALTY SYSTEM ROUTES
  // ============================================
  
  // Get loyalty points for a client
  app.get('/make-server-6971b43c/loyalty/:workshopId/:clientId', async (c: any) => {
    try {
      const { workshopId, clientId } = c.req.param()
      
      const loyaltyData = await kv.get(`loyalty:${workshopId}:${clientId}`)
      
      if (!loyaltyData) {
        // Initialize new loyalty account
        const newLoyalty = {
          clientId,
          workshopId,
          points: 0,
          tier: 'bronze',
          totalSpent: 0,
          visitsCount: 0,
          joinedDate: new Date().toISOString(),
          lastActivity: new Date().toISOString(),
          redeemedRewards: []
        }
        
        await kv.set(`loyalty:${workshopId}:${clientId}`, newLoyalty)
        return c.json(newLoyalty)
      }
      
      return c.json(loyaltyData)
    } catch (error) {
      console.error('Error fetching loyalty data:', error)
      return c.json({ error: 'Failed to fetch loyalty data' }, 500)
    }
  })
  
  // Add points to client
  app.post('/make-server-6971b43c/loyalty/:workshopId/:clientId/add-points', async (c: any) => {
    try {
      const { workshopId, clientId } = c.req.param()
      const { points, reason, amount } = await c.req.json()
      
      let loyaltyData = await kv.get(`loyalty:${workshopId}:${clientId}`)
      
      if (!loyaltyData) {
        loyaltyData = {
          clientId,
          workshopId,
          points: 0,
          tier: 'bronze',
          totalSpent: 0,
          visitsCount: 0,
          joinedDate: new Date().toISOString(),
          lastActivity: new Date().toISOString(),
          redeemedRewards: []
        }
      }
      
      // Add points
      loyaltyData.points += points
      loyaltyData.lastActivity = new Date().toISOString()
      
      // Update spent/visits if applicable
      if (amount) loyaltyData.totalSpent += amount
      if (reason === 'visit') loyaltyData.visitsCount += 1
      
      // Calculate tier based on points
      if (loyaltyData.points >= 5000) loyaltyData.tier = 'platinum'
      else if (loyaltyData.points >= 2500) loyaltyData.tier = 'gold'
      else if (loyaltyData.points >= 1000) loyaltyData.tier = 'silver'
      else loyaltyData.tier = 'bronze'
      
      // Save transaction history
      const transaction = {
        id: crypto.randomUUID(),
        date: new Date().toISOString(),
        type: 'earn',
        points,
        reason,
        amount
      }
      
      if (!loyaltyData.transactions) loyaltyData.transactions = []
      loyaltyData.transactions.unshift(transaction)
      
      await kv.set(`loyalty:${workshopId}:${clientId}`, loyaltyData)
      
      return c.json(loyaltyData)
    } catch (error) {
      console.error('Error adding loyalty points:', error)
      return c.json({ error: 'Failed to add points' }, 500)
    }
  })
  
  // Redeem reward
  app.post('/make-server-6971b43c/loyalty/:workshopId/:clientId/redeem', async (c: any) => {
    try {
      const { workshopId, clientId } = c.req.param()
      const { rewardId, pointsCost } = await c.req.json()
      
      const loyaltyData = await kv.get(`loyalty:${workshopId}:${clientId}`)
      
      if (!loyaltyData) {
        return c.json({ error: 'Loyalty account not found' }, 404)
      }
      
      if (loyaltyData.points < pointsCost) {
        return c.json({ error: 'Insufficient points' }, 400)
      }
      
      // Deduct points
      loyaltyData.points -= pointsCost
      loyaltyData.lastActivity = new Date().toISOString()
      
      // Add to redeemed rewards
      if (!loyaltyData.redeemedRewards) loyaltyData.redeemedRewards = []
      loyaltyData.redeemedRewards.push({
        id: rewardId,
        date: new Date().toISOString(),
        pointsCost
      })
      
      // Save transaction
      const transaction = {
        id: crypto.randomUUID(),
        date: new Date().toISOString(),
        type: 'redeem',
        points: -pointsCost,
        reason: `Resgate de recompensa #${rewardId}`
      }
      
      if (!loyaltyData.transactions) loyaltyData.transactions = []
      loyaltyData.transactions.unshift(transaction)
      
      await kv.set(`loyalty:${workshopId}:${clientId}`, loyaltyData)
      
      return c.json(loyaltyData)
    } catch (error) {
      console.error('Error redeeming reward:', error)
      return c.json({ error: 'Failed to redeem reward' }, 500)
    }
  })
  
  // ============================================
  // 📲 WHATSAPP INTEGRATION ROUTES
  // ============================================
  
  // Get WhatsApp config for workshop
  app.get('/make-server-6971b43c/whatsapp/:workshopId/config', async (c: any) => {
    try {
      const { workshopId } = c.req.param()
      
      const config = await kv.get(`whatsapp:config:${workshopId}`)
      
      if (!config) {
        return c.json({
          workshopId,
          enabled: false,
          phoneNumberId: null,
          accessToken: null,
          businessAccountId: null
        })
      }
      
      return c.json(config)
    } catch (error) {
      console.error('Error fetching WhatsApp config:', error)
      return c.json({ error: 'Failed to fetch config' }, 500)
    }
  })
  
  // Save WhatsApp config
  app.post('/make-server-6971b43c/whatsapp/:workshopId/config', async (c: any) => {
    try {
      const { workshopId } = c.req.param()
      const config = await c.req.json()
      
      await kv.set(`whatsapp:config:${workshopId}`, {
        ...config,
        workshopId,
        updatedAt: new Date().toISOString()
      })
      
      return c.json({ success: true })
    } catch (error) {
      console.error('Error saving WhatsApp config:', error)
      return c.json({ error: 'Failed to save config' }, 500)
    }
  })
  
  // Send WhatsApp message
  app.post('/make-server-6971b43c/whatsapp/:workshopId/send', async (c: any) => {
    try {
      const { workshopId } = c.req.param()
      const { phoneNumber, templateName, variables } = await c.req.json()
      
      const config = await kv.get(`whatsapp:config:${workshopId}`)
      
      if (!config || !config.enabled) {
        return c.json({ error: 'WhatsApp not configured' }, 400)
      }
      
      // Save to sent messages history
      const messageId = crypto.randomUUID()
      const message = {
        id: messageId,
        workshopId,
        phoneNumber,
        templateName,
        variables,
        status: 'sent',
        sentAt: new Date().toISOString()
      }
      
      await kv.set(`whatsapp:message:${workshopId}:${messageId}`, message)
      
      // Update statistics
      let stats = await kv.get(`whatsapp:stats:${workshopId}`)
      if (!stats) {
        stats = { sent: 0, delivered: 0, read: 0, failed: 0 }
      }
      stats.sent += 1
      await kv.set(`whatsapp:stats:${workshopId}`, stats)
      
      return c.json({ success: true, messageId })
    } catch (error) {
      console.error('Error sending WhatsApp message:', error)
      return c.json({ error: 'Failed to send message' }, 500)
    }
  })
  
  // Get WhatsApp statistics
  app.get('/make-server-6971b43c/whatsapp/:workshopId/stats', async (c: any) => {
    try {
      const { workshopId } = c.req.param()
      
      let stats = await kv.get(`whatsapp:stats:${workshopId}`)
      
      if (!stats) {
        stats = { sent: 0, delivered: 0, read: 0, failed: 0 }
      }
      
      return c.json(stats)
    } catch (error) {
      console.error('Error fetching WhatsApp stats:', error)
      return c.json({ error: 'Failed to fetch stats' }, 500)
    }
  })
  
  // ============================================
  // 📊 CUSTOM DASHBOARDS ROUTES
  // ============================================
  
  // Get all dashboards for user
  app.get('/make-server-6971b43c/dashboards/:workshopId/:userId', async (c: any) => {
    try {
      const { workshopId, userId } = c.req.param()
      
      const dashboards = await kv.getByPrefix(`dashboard:${workshopId}:${userId}:`)
      
      return c.json(dashboards || [])
    } catch (error) {
      console.error('Error fetching dashboards:', error)
      return c.json({ error: 'Failed to fetch dashboards' }, 500)
    }
  })
  
  // Create new dashboard
  app.post('/make-server-6971b43c/dashboards/:workshopId/:userId', async (c: any) => {
    try {
      const { workshopId, userId } = c.req.param()
      const dashboard = await c.req.json()
      
      const dashboardId = dashboard.id || crypto.randomUUID()
      
      const newDashboard = {
        ...dashboard,
        id: dashboardId,
        workshopId,
        userId,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }
      
      await kv.set(`dashboard:${workshopId}:${userId}:${dashboardId}`, newDashboard)
      
      return c.json(newDashboard)
    } catch (error) {
      console.error('Error creating dashboard:', error)
      return c.json({ error: 'Failed to create dashboard' }, 500)
    }
  })
  
  // Update dashboard
  app.put('/make-server-6971b43c/dashboards/:workshopId/:userId/:dashboardId', async (c: any) => {
    try {
      const { workshopId, userId, dashboardId } = c.req.param()
      const updates = await c.req.json()
      
      const existing = await kv.get(`dashboard:${workshopId}:${userId}:${dashboardId}`)
      
      if (!existing) {
        return c.json({ error: 'Dashboard not found' }, 404)
      }
      
      const updated = {
        ...existing,
        ...updates,
        updatedAt: new Date().toISOString()
      }
      
      await kv.set(`dashboard:${workshopId}:${userId}:${dashboardId}`, updated)
      
      return c.json(updated)
    } catch (error) {
      console.error('Error updating dashboard:', error)
      return c.json({ error: 'Failed to update dashboard' }, 500)
    }
  })
  
  // Delete dashboard
  app.delete('/make-server-6971b43c/dashboards/:workshopId/:userId/:dashboardId', async (c: any) => {
    try {
      const { workshopId, userId, dashboardId } = c.req.param()
      
      await kv.del(`dashboard:${workshopId}:${userId}:${dashboardId}`)
      
      return c.json({ success: true })
    } catch (error) {
      console.error('Error deleting dashboard:', error)
      return c.json({ error: 'Failed to delete dashboard' }, 500)
    }
  })
  
  // ============================================
  // ✈️ OFFLINE SYNC ROUTES
  // ============================================
  
  // Sync pending operations
  app.post('/make-server-6971b43c/offline/sync', async (c: any) => {
    try {
      const operations = await c.req.json()
      
      const results = []
      
      for (const op of operations) {
        try {
          // Execute the operation based on type
          if (op.type === 'create') {
            const id = crypto.randomUUID()
            await kv.set(`${op.entity}:${id}`, { ...op.data, id })
            results.push({ operationId: op.id, success: true, id })
          } else if (op.type === 'update') {
            const existing = await kv.get(`${op.entity}:${op.entityId}`)
            if (existing) {
              await kv.set(`${op.entity}:${op.entityId}`, { ...existing, ...op.data })
              results.push({ operationId: op.id, success: true })
            } else {
              results.push({ operationId: op.id, success: false, error: 'Not found' })
            }
          } else if (op.type === 'delete') {
            await kv.del(`${op.entity}:${op.entityId}`)
            results.push({ operationId: op.id, success: true })
          }
        } catch (error) {
          console.error('Error executing operation:', op, error)
          results.push({ operationId: op.id, success: false, error: error.message })
        }
      }
      
      return c.json({ results })
    } catch (error) {
      console.error('Error syncing offline operations:', error)
      return c.json({ error: 'Failed to sync' }, 500)
    }
  })
  
  console.log('✅ Innovations routes configured')
}
