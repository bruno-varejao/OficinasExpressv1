import { Hono } from 'npm:hono'
import * as kv from './kv_store.tsx'

// Predefined Services List (same as in index.tsx)
const PREDEFINED_SERVICES = [
  { id: 'oil-change', name: 'Mudança de Óleo', basePrice: 45, duration: 30 },
  { id: 'tire-change', name: 'Mudança de Pneus', basePrice: 80, duration: 60 },
  { id: 'brake-service', name: 'Revisão de Travões', basePrice: 120, duration: 90 },
  { id: 'air-conditioning', name: 'Ar Condicionado', basePrice: 60, duration: 45 },
  { id: 'battery-replacement', name: 'Substituição de Bateria', basePrice: 100, duration: 30 },
  { id: 'general-inspection', name: 'Inspeção Geral', basePrice: 35, duration: 45 },
  { id: 'alignment', name: 'Alinhamento de Rodas', basePrice: 40, duration: 45 },
  { id: 'timing-belt', name: 'Correia de Distribuição', basePrice: 250, duration: 180 },
  { id: 'diagnostic', name: 'Diagnóstico Eletrónico', basePrice: 50, duration: 60 },
  { id: 'filters', name: 'Mudança de Filtros', basePrice: 35, duration: 30 }
]

export function addQuoteAgendaRoutes(app: any, supabase: any) {
  
  // ==========================================
  // INSTANT QUOTE SYSTEM
  // ==========================================
  
  /**
   * POST /public/instant-quote
   * Step 1: Cliente insere dados e recebe orçamento instantâneo de todas as oficinas da zona (CP4)
   */
  app.post('/make-server-6971b43c/public/instant-quote', async (c: any) => {
    try {
      const { licensePlate, postalCode, serviceId, clientName, clientEmail, clientPhone, notes } = await c.req.json()
      
      console.log('📊 Generating instant quote for postal code (CP4):', postalCode)
      console.log('   - Service ID:', serviceId)
      
      // Validate required fields
      if (!licensePlate || !postalCode || !serviceId || !clientName || !clientEmail) {
        return c.json({ error: 'Campos obrigatórios em falta' }, 400)
      }
      
      // Validate postal code format (4 digits)
      if (!/^\d{4}$/.test(postalCode)) {
        return c.json({ error: 'Código postal inválido. Insira apenas os 4 primeiros dígitos.' }, 400)
      }
      
      // Get service details from PREDEFINED_SERVICES
      const service = PREDEFINED_SERVICES.find(s => s.id === serviceId)
      if (!service) {
        console.error('❌ Service not found:', serviceId)
        console.error('   - Available services:', PREDEFINED_SERVICES.map(s => s.id).join(', '))
        return c.json({ error: 'Serviço não encontrado' }, 404)
      }
      
      console.log('✅ Service found:', service.name)
      
      // Get all workshops matching this postal code (CP4)
      const allWorkshops = await kv.getByPrefix('workshop:')
      const workshopsInPostalCode = allWorkshops.filter((w: any) => {
        // Check if workshop has cp4 defined and matches
        return w.cp4 === postalCode
      })
      
      if (workshopsInPostalCode.length === 0) {
        // Get all available postal codes for better UX
        const allPostalCodes = new Set<string>()
        allWorkshops.forEach((w: any) => {
          if (w.cp4) {
            allPostalCodes.add(w.cp4)
          }
        })
        
        console.log('❌ No workshops found for CP4:', postalCode)
        console.log('   - Available CP4s:', Array.from(allPostalCodes).sort().join(', '))
        
        return c.json({ 
          error: 'Nenhuma oficina encontrada nesta zona',
          availablePostalCodes: Array.from(allPostalCodes).sort()
        }, 404)
      }
      
      console.log(`✅ Found ${workshopsInPostalCode.length} workshops in CP4 ${postalCode}`)
      
      // Generate instant quotes for all workshops
      const instantQuotes = await Promise.all(workshopsInPostalCode.map(async (workshop: any) => {
        // Base price from service
        let estimatedPrice = service.basePrice || 0
        
        // Add workshop-specific markup (between 0-20%)
        const workshopMarkup = Math.random() * 0.2
        estimatedPrice = estimatedPrice * (1 + workshopMarkup)
        
        // Round to nearest 5 euros for cleaner pricing
        estimatedPrice = Math.round(estimatedPrice / 5) * 5
        
        // Get next available date from Agenda
        let nextAvailableDate = null
        try {
          const agendaConfig = await kv.get(`agenda-config:${workshop.id}`)
          const agendaBookings = await kv.getByPrefix(`booking:${workshop.id}:`)
          
          if (agendaConfig?.dailySlots && agendaConfig.dailySlots > 0) {
            // Calculate next available date
            const today = new Date()
            let checkDate = new Date(today)
            let found = false
            
            // Check next 30 days
            for (let i = 0; i < 30 && !found; i++) {
              checkDate.setDate(today.getDate() + i)
              const dateStr = checkDate.toISOString().split('T')[0]
              
              // Check if workshop is open on this day
              const dayOfWeek = checkDate.getDay()
              const dayName = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'][dayOfWeek]
              
              if (agendaConfig.workingHours?.[dayName]?.enabled) {
                // Count bookings for this date
                const dayBookings = agendaBookings.filter((b: any) => 
                  b.date === dateStr && b.status !== 'cancelled'
                )
                
                const slotsUsed = dayBookings.length
                const slotsAvailable = agendaConfig.dailySlots - slotsUsed
                
                if (slotsAvailable > 0) {
                  nextAvailableDate = dateStr
                  found = true
                }
              }
            }
          }
        } catch (error) {
          console.log(`⚠️ Error calculating next availability for workshop ${workshop.id}:`, error)
        }
        
        // Get logo URL if exists
        let logoUrl = workshop.logoUrl || null
        if (workshop.logoPath) {
          try {
            const bucketName = 'make-6971b43c-workshop-logos'
            const { data: urlData } = await supabase.storage
              .from(bucketName)
              .createSignedUrl(workshop.logoPath, 31536000) // 1 year
            logoUrl = urlData?.signedUrl || null
          } catch (error) {
            console.log('⚠️ Error generating signed URL for logo:', error)
          }
        }
        
        // Get real reviews for this workshop
        const workshopReviews = await kv.getByPrefix(`review:workshop:${workshop.id}:`)
        const totalReviews = workshopReviews.length
        const averageRating = totalReviews > 0
          ? workshopReviews.reduce((sum: number, r: any) => sum + (r.rating || 0), 0) / totalReviews
          : 0
        
        return {
          workshopId: workshop.id,
          workshopName: workshop.name,
          workshopPhone: workshop.phone,
          workshopEmail: workshop.email,
          workshopAddress: workshop.address || '',
          workshopPostalCode: workshop.postalCode || '',
          workshopLocality: workshop.locality || '',
          workshopLogoUrl: logoUrl,
          estimatedPrice,
          estimatedDuration: service.duration || 60,
          rating: averageRating > 0 ? averageRating : (workshop.rating || 0),
          reviewsCount: totalReviews,
          responseTime: workshop.avgResponseTime || '2-4h',
          nextAvailableDate: nextAvailableDate
        }
      }))
      
      // Sort by price (ascending)
      instantQuotes.sort((a: any, b: any) => a.estimatedPrice - b.estimatedPrice)
      
      // Create quote request ID for tracking
      const quoteRequestId = `qr_${Date.now()}_${Math.random().toString(36).substring(7)}`
      
      // Store the initial quote request
      await kv.set(`quote_request:${quoteRequestId}`, {
        id: quoteRequestId,
        licensePlate,
        postalCode,
        serviceId,
        serviceName: service.name,
        clientName,
        clientEmail,
        clientPhone,
        notes,
        instantQuotes,
        selectedWorkshops: [], // Will be filled when client selects
        status: 'instant_quote_generated',
        createdAt: new Date().toISOString()
      })
      
      console.log('✅ Instant quote generated:', quoteRequestId)
      
      return c.json({
        quoteRequestId,
        service: {
          id: service.id,
          name: service.name,
          basePrice: service.basePrice,
          duration: service.duration
        },
        workshops: instantQuotes,
        message: `Encontrámos ${instantQuotes.length} oficinas na zona ${postalCode}`
      })
      
    } catch (error: any) {
      console.error('❌ Error generating instant quote:', error)
      return c.json({ error: 'Erro ao gerar orçamento instantâneo: ' + error.message }, 500)
    }
  })
  
  /**
   * POST /public/select-workshops
   * Step 2: Cliente seleciona até 3 oficinas para pedir validação/retificação
   */
  app.post('/make-server-6971b43c/public/select-workshops', async (c: any) => {
    try {
      const { quoteRequestId, selectedWorkshopIds } = await c.req.json()
      
      console.log('🎯 Client selecting workshops:', selectedWorkshopIds)
      
      // Validate
      if (!quoteRequestId || !selectedWorkshopIds || !Array.isArray(selectedWorkshopIds)) {
        return c.json({ error: 'Dados inválidos' }, 400)
      }
      
      if (selectedWorkshopIds.length === 0 || selectedWorkshopIds.length > 3) {
        return c.json({ error: 'Selecione entre 1 e 3 oficinas' }, 400)
      }
      
      // Get quote request
      const quoteRequest = await kv.get(`quote_request:${quoteRequestId}`)
      if (!quoteRequest) {
        return c.json({ error: 'Pedido de orçamento não encontrado' }, 404)
      }
      
      // Update with selected workshops
      quoteRequest.selectedWorkshops = selectedWorkshopIds
      quoteRequest.status = 'awaiting_workshop_response'
      quoteRequest.selectionDate = new Date().toISOString()
      await kv.set(`quote_request:${quoteRequestId}`, quoteRequest)
      
      // Create individual requests for each selected workshop
      const workshopRequests = []
      for (const workshopId of selectedWorkshopIds) {
        const requestId = `wr_${Date.now()}_${Math.random().toString(36).substring(7)}`
        
        const workshopRequest = {
          id: requestId,
          quoteRequestId,
          workshopId,
          licensePlate: quoteRequest.licensePlate,
          location: quoteRequest.location,
          serviceId: quoteRequest.serviceId,
          serviceName: quoteRequest.serviceName,
          clientName: quoteRequest.clientName,
          clientEmail: quoteRequest.clientEmail,
          clientPhone: quoteRequest.clientPhone,
          notes: quoteRequest.notes,
          status: 'pending', // pending, validated, modified, rejected
          createdAt: new Date().toISOString()
        }
        
        await kv.set(`workshop_request:${requestId}`, workshopRequest)
        
        // Add to workshop's pending requests list
        const workshopRequestsKey = `workshop_requests:${workshopId}`
        const existingRequests = await kv.get(workshopRequestsKey) || []
        existingRequests.push(requestId)
        await kv.set(workshopRequestsKey, existingRequests)
        
        // Create notification for workshop about new instant quote request
        const workshopNotifId = `notif_${Date.now()}_${Math.random().toString(36).substring(7)}`
        await kv.set(`notification:${workshopId}:${workshopNotifId}`, {
          id: workshopNotifId,
          type: 'new_instant_quote',
          workshopId,
          quoteRequestId,
          requestId,
          serviceName: quoteRequest.serviceName,
          licensePlate: quoteRequest.licensePlate,
          clientName: quoteRequest.clientName,
          clientEmail: quoteRequest.clientEmail,
          clientPhone: quoteRequest.clientPhone,
          title: '🎯 Novo Orçamento Instantâneo',
          message: `Cliente ${quoteRequest.clientName} solicitou orçamento para ${quoteRequest.serviceName} - ${quoteRequest.licensePlate}`,
          createdAt: new Date().toISOString(),
          read: false
        })
        console.log(`   🔔 Notification created for workshop ${workshopId}`)
        
        workshopRequests.push(workshopRequest)
      }
      
      console.log(`✅ Created ${workshopRequests.length} workshop requests`)
      
      return c.json({
        success: true,
        message: `Pedido enviado para ${selectedWorkshopIds.length} oficina(s)`,
        workshopRequests
      })
      
    } catch (error: any) {
      console.error('❌ Error selecting workshops:', error)
      return c.json({ error: 'Erro ao selecionar oficinas: ' + error.message }, 500)
    }
  })
  
  /**
   * GET /workshop-requests/pending
   * Get pending workshop requests for the authenticated workshop
   */
  app.get('/make-server-6971b43c/workshop-requests/pending', async (c: any) => {
    try {
      const accessToken = c.req.header('Authorization')?.split(' ')[1]
      if (!accessToken) {
        return c.json({ error: 'Unauthorized' }, 401)
      }
      
      const { data: { user }, error } = await supabase.auth.getUser(accessToken)
      if (!user || error) {
        return c.json({ error: 'Invalid token' }, 401)
      }
      
      const userProfile = await kv.get(`user:${user.id}`)
      if (!userProfile?.workshopId) {
        return c.json({ error: 'Workshop ID não encontrado' }, 404)
      }
      
      const workshopId = userProfile.workshopId
      
      // Get all pending requests for this workshop
      const requestIds = await kv.get(`workshop_requests:${workshopId}`) || []
      const requests = []
      
      for (const requestId of requestIds) {
        const request = await kv.get(`workshop_request:${requestId}`)
        // Only include pending requests that were NOT rejected by client
        if (request && request.status === 'pending' && request.status !== 'rejected_by_client') {
          requests.push(request)
        }
      }
      
      console.log(`✅ Found ${requests.length} pending requests for workshop ${workshopId}`)
      
      return c.json({ requests })
      
    } catch (error: any) {
      console.error('❌ Error fetching pending requests:', error)
      return c.json({ error: 'Erro ao carregar pedidos: ' + error.message }, 500)
    }
  })
  
  /**
   * GET /workshop-requests/all
   * Get ALL workshop requests (pending, validated, modified, rejected, chosen by client)
   */
  app.get('/make-server-6971b43c/workshop-requests/all', async (c: any) => {
    try {
      const accessToken = c.req.header('Authorization')?.split(' ')[1]
      if (!accessToken) {
        return c.json({ error: 'Unauthorized' }, 401)
      }
      
      const { data: { user }, error } = await supabase.auth.getUser(accessToken)
      if (!user || error) {
        return c.json({ error: 'Invalid token' }, 401)
      }
      
      const userProfile = await kv.get(`user:${user.id}`)
      if (!userProfile?.workshopId) {
        return c.json({ error: 'Workshop ID não encontrado' }, 404)
      }
      
      const workshopId = userProfile.workshopId
      
      // Get all requests for this workshop
      const requestIds = await kv.get(`workshop_requests:${workshopId}`) || []
      const allRequests = []
      
      for (const requestId of requestIds) {
        const request = await kv.get(`workshop_request:${requestId}`)
        if (request) {
          // Check if client chose this workshop
          const quoteRequest = await kv.get(`quote_request:${request.quoteRequestId}`)
          const isChosenByClient = quoteRequest?.selectedWorkshopForAppointment === workshopId
          
          allRequests.push({
            ...request,
            isChosenByClient,
            clientChosenAt: isChosenByClient ? quoteRequest?.appointmentScheduledAt : null
          })
        }
      }
      
      console.log(`✅ Found ${allRequests.length} total requests for workshop ${workshopId}`)
      
      // Separate by status
      const pending = allRequests.filter(r => r.status === 'pending')
      const responded = allRequests.filter(r => r.status === 'validated' || r.status === 'modified')
      const chosenByClient = allRequests.filter(r => r.isChosenByClient)
      const rejected = allRequests.filter(r => r.status === 'rejected')
      
      return c.json({ 
        requests: allRequests,
        summary: {
          total: allRequests.length,
          pending: pending.length,
          responded: responded.length,
          chosenByClient: chosenByClient.length,
          rejected: rejected.length
        }
      })
      
    } catch (error: any) {
      console.error('❌ Error fetching all requests:', error)
      return c.json({ error: 'Erro ao carregar pedidos: ' + error.message }, 500)
    }
  })
  
  /**
   * POST /workshop-requests/:requestId/respond
   * Workshop validates or modifies the quote
   */
  app.post('/make-server-6971b43c/workshop-requests/:requestId/respond', async (c: any) => {
    try {
      const requestId = c.req.param('requestId')
      const { action, price, duration, notes } = await c.req.json()
      
      console.log(`🏭 Workshop responding to request ${requestId}:`, action)
      
      const accessToken = c.req.header('Authorization')?.split(' ')[1]
      if (!accessToken) {
        return c.json({ error: 'Unauthorized' }, 401)
      }
      
      const { data: { user }, error } = await supabase.auth.getUser(accessToken)
      if (!user || error) {
        return c.json({ error: 'Invalid token' }, 401)
      }
      
      const userProfile = await kv.get(`user:${user.id}`)
      if (!userProfile?.workshopId) {
        return c.json({ error: 'Workshop ID não encontrado' }, 404)
      }
      
      // Get the request
      const request = await kv.get(`workshop_request:${requestId}`)
      if (!request) {
        return c.json({ error: 'Pedido não encontrado' }, 404)
      }
      
      // Verify this request belongs to this workshop
      if (request.workshopId !== userProfile.workshopId) {
        return c.json({ error: 'Não autorizado para este pedido' }, 403)
      }
      
      // Update request with workshop response
      request.status = action // 'validated', 'modified', 'rejected'
      request.workshopResponse = {
        price,
        duration,
        notes,
        respondedAt: new Date().toISOString(),
        respondedBy: user.email
      }
      
      await kv.set(`workshop_request:${requestId}`, request)
      
      // Update the main quote request status
      const quoteRequest = await kv.get(`quote_request:${request.quoteRequestId}`)
      if (quoteRequest) {
        quoteRequest.lastUpdate = new Date().toISOString()
        await kv.set(`quote_request:${request.quoteRequestId}`, quoteRequest)
      }
      
      // Create notification for client
      const notificationId = `notif_${Date.now()}_${Math.random().toString(36).substring(7)}`
      const clientNotification = {
        id: notificationId,
        type: 'quote_response',
        clientEmail: request.clientEmail,
        quoteRequestId: request.quoteRequestId,
        workshopId: request.workshopId,
        requestId,
        action,
        createdAt: new Date().toISOString(),
        read: false
      }
      await kv.set(`notification:${notificationId}`, clientNotification)
      console.log(`✅ CLIENT NOTIFICATION created: notification:${notificationId} for email: ${request.clientEmail}`, clientNotification)
      
      // Create notification for workshop about their action (for their records/bell)
      if (action === 'modified') {
        const workshopNotifId2 = `notif_${Date.now()}_${Math.random().toString(36).substring(7)}`
        await kv.set(`notification:${userProfile.workshopId}:${workshopNotifId2}`, {
          id: workshopNotifId2,
          type: 'quote_rectification',
          workshopId: userProfile.workshopId,
          quoteRequestId: request.quoteRequestId,
          requestId,
          serviceName: request.serviceName,
          licensePlate: request.licensePlate,
          clientName: request.clientName,
          price,
          duration,
          notes,
          title: '✏️ Orçamento Retificado',
          message: `Retificou o orçamento para ${request.serviceName} - ${request.licensePlate}: €${price} (${duration} min)`,
          createdAt: new Date().toISOString(),
          read: false
        })
        console.log(`   🔔 Rectification notification created for workshop`)
      }
      
      console.log('✅ Workshop response saved:', action)
      
      return c.json({
        success: true,
        message: 'Resposta enviada ao cliente',
        request
      })
      
    } catch (error: any) {
      console.error('❌ Error responding to request:', error)
      return c.json({ error: 'Erro ao responder pedido: ' + error.message }, 500)
    }
  })
  
  /**
   * POST /workshop/check-client-vehicle-existence
   * Check if client and vehicle already exist in workshop database
   */
  app.post('/make-server-6971b43c/workshop/check-client-vehicle-existence', async (c: any) => {
    try {
      const accessToken = c.req.header('Authorization')?.split(' ')[1]
      if (!accessToken) {
        return c.json({ error: 'Unauthorized' }, 401)
      }
      
      const { data: { user }, error } = await supabase.auth.getUser(accessToken)
      if (!user || error) {
        return c.json({ error: 'Invalid token' }, 401)
      }
      
      const userProfile = await kv.get(`user:${user.id}`)
      if (!userProfile?.workshopId) {
        return c.json({ error: 'Workshop ID não encontrado' }, 404)
      }
      
      const workshopId = userProfile.workshopId
      const { email, licensePlate } = await c.req.json()
      
      // Check if client exists
      const allClients = await kv.getByPrefix(`client:${workshopId}:`)
      const clientExists = allClients.some((client: any) => 
        client.email?.toLowerCase() === email?.toLowerCase()
      )
      
      // Check if vehicle exists
      const allVehicles = await kv.getByPrefix(`vehicle:${workshopId}:`)
      const vehicleExists = allVehicles.some((vehicle: any) => 
        vehicle.licensePlate?.toUpperCase() === licensePlate?.toUpperCase()
      )
      
      console.log(`🔍 Existence check for workshop ${workshopId}:`, {
        email,
        licensePlate,
        clientExists,
        vehicleExists
      })
      
      return c.json({
        clientExists,
        vehicleExists
      })
      
    } catch (error: any) {
      console.error('❌ Error checking existence:', error)
      return c.json({ error: 'Erro ao verificar existência: ' + error.message }, 500)
    }
  })
  
  /**
   * POST /workshop/import-client-vehicle
   * Import client and vehicle from quote request to workshop database
   */
  app.post('/make-server-6971b43c/workshop/import-client-vehicle', async (c: any) => {
    try {
      const accessToken = c.req.header('Authorization')?.split(' ')[1]
      if (!accessToken) {
        return c.json({ error: 'Unauthorized' }, 401)
      }
      
      const { data: { user }, error } = await supabase.auth.getUser(accessToken)
      if (!user || error) {
        return c.json({ error: 'Invalid token' }, 401)
      }
      
      const userProfile = await kv.get(`user:${user.id}`)
      if (!userProfile?.workshopId) {
        return c.json({ error: 'Workshop ID não encontrado' }, 404)
      }
      
      const workshopId = userProfile.workshopId
      const { clientName, clientEmail, clientPhone, licensePlate } = await c.req.json()
      
      // Check if already exists
      const allClients = await kv.getByPrefix(`client:${workshopId}:`)
      const clientExists = allClients.find((client: any) => 
        client.email?.toLowerCase() === clientEmail?.toLowerCase()
      )
      
      const allVehicles = await kv.getByPrefix(`vehicle:${workshopId}:`)
      const vehicleExists = allVehicles.find((vehicle: any) => 
        vehicle.licensePlate?.toUpperCase() === licensePlate?.toUpperCase()
      )
      
      let clientId = clientExists?.id
      let vehicleId = vehicleExists?.id
      
      // Create client if not exists
      if (!clientExists) {
        clientId = `client_${Date.now()}_${Math.random().toString(36).substring(7)}`
        await kv.set(`client:${workshopId}:${clientId}`, {
          id: clientId,
          workshopId,
          name: clientName,
          email: clientEmail,
          phone: clientPhone,
          createdAt: new Date().toISOString(),
          importedFrom: 'instant_quote'
        })
        console.log(`✅ Client imported: ${clientId}`)
      }
      
      // Create vehicle if not exists
      if (!vehicleExists) {
        vehicleId = `vehicle_${Date.now()}_${Math.random().toString(36).substring(7)}`
        await kv.set(`vehicle:${workshopId}:${vehicleId}`, {
          id: vehicleId,
          workshopId,
          licensePlate: licensePlate.toUpperCase(),
          clientId,
          createdAt: new Date().toISOString(),
          importedFrom: 'instant_quote'
        })
        console.log(`✅ Vehicle imported: ${vehicleId}`)
      }
      
      return c.json({
        success: true,
        clientId,
        vehicleId,
        clientCreated: !clientExists,
        vehicleCreated: !vehicleExists
      })
      
    } catch (error: any) {
      console.error('❌ Error importing:', error)
      return c.json({ error: 'Erro ao importar: ' + error.message }, 500)
    }
  })
  
  /**
   * GET /workshops/:workshopId/notifications
   * Get notifications for workshop
   */
  app.get('/make-server-6971b43c/workshops/:workshopId/notifications', async (c: any) => {
    try {
      const accessToken = c.req.header('Authorization')?.split(' ')[1]
      if (!accessToken) {
        return c.json({ error: 'Unauthorized' }, 401)
      }
      
      const { data: { user }, error } = await supabase.auth.getUser(accessToken)
      if (!user || error) {
        return c.json({ error: 'Invalid token' }, 401)
      }
      
      const workshopId = c.req.param('workshopId')
      
      // Get notifications for this workshop
      const allNotifications = await kv.getByPrefix(`notification:workshop:${workshopId}:`)
      
      // Sort by date (newest first)
      allNotifications.sort((a: any, b: any) => 
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      )
      
      const unreadCount = allNotifications.filter((n: any) => !n.read).length
      
      return c.json({
        notifications: allNotifications,
        unreadCount
      })
      
    } catch (error: any) {
      console.error('❌ Error fetching notifications:', error)
      return c.json({ error: 'Erro ao carregar notificações: ' + error.message }, 500)
    }
  })
  
  /**
   * POST /workshops/:workshopId/notifications/:notificationId/read
   * Mark notification as read
   */
  app.post('/make-server-6971b43c/workshops/:workshopId/notifications/:notificationId/read', async (c: any) => {
    try {
      const accessToken = c.req.header('Authorization')?.split(' ')[1]
      if (!accessToken) {
        return c.json({ error: 'Unauthorized' }, 401)
      }
      
      const { data: { user }, error } = await supabase.auth.getUser(accessToken)
      if (!user || error) {
        return c.json({ error: 'Invalid token' }, 401)
      }
      
      const workshopId = c.req.param('workshopId')
      const notificationId = c.req.param('notificationId')
      
      const notification = await kv.get(`notification:workshop:${workshopId}:${notificationId}`)
      if (notification) {
        notification.read = true
        await kv.set(`notification:workshop:${workshopId}:${notificationId}`, notification)
      }
      
      return c.json({ success: true })
      
    } catch (error: any) {
      console.error('❌ Error marking notification as read:', error)
      return c.json({ error: 'Erro ao marcar notificação: ' + error.message }, 500)
    }
  })
  
  /**
   * POST /workshops/:workshopId/notifications/read-all
   * Mark all notifications as read
   */
  app.post('/make-server-6971b43c/workshops/:workshopId/notifications/read-all', async (c: any) => {
    try {
      const accessToken = c.req.header('Authorization')?.split(' ')[1]
      if (!accessToken) {
        return c.json({ error: 'Unauthorized' }, 401)
      }
      
      const { data: { user }, error } = await supabase.auth.getUser(accessToken)
      if (!user || error) {
        return c.json({ error: 'Invalid token' }, 401)
      }
      
      const workshopId = c.req.param('workshopId')
      
      const allNotifications = await kv.getByPrefix(`notification:workshop:${workshopId}:`)
      
      for (const notification of allNotifications) {
        if (!notification.read) {
          notification.read = true
          await kv.set(`notification:workshop:${workshopId}:${notification.id}`, notification)
        }
      }
      
      return c.json({ success: true })
      
    } catch (error: any) {
      console.error('❌ Error marking all as read:', error)
      return c.json({ error: 'Erro ao marcar todas: ' + error.message }, 500)
    }
  })
  
  /**
   * GET /client/notifications
   * Get notifications for client
   */
  app.get('/make-server-6971b43c/client/notifications', async (c: any) => {
    try {
      const clientEmail = c.req.query('email')
      
      console.log('📬 CLIENT: Fetching notifications for email:', clientEmail)
      
      if (!clientEmail) {
        console.log('❌ CLIENT: No email provided')
        return c.json({ error: 'Email required' }, 400)
      }
      
      // Get all notifications for this client
      const allNotifications = await kv.getByPrefix('notification:')
      console.log(`📬 CLIENT: Found ${allNotifications.length} total notifications with prefix 'notification:'`)
      
      const clientNotifications = allNotifications.filter((n: any) => 
        n.clientEmail?.toLowerCase() === clientEmail.toLowerCase()
      )
      
      console.log(`📬 CLIENT: Found ${clientNotifications.length} notifications for email ${clientEmail}`)
      
      // Sort by date (newest first)
      clientNotifications.sort((a: any, b: any) => 
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      )
      
      const unreadCount = clientNotifications.filter((n: any) => !n.read).length
      
      console.log(`📬 CLIENT: Returning ${clientNotifications.length} notifications (${unreadCount} unread)`)
      
      return c.json({
        notifications: clientNotifications,
        unreadCount
      })
      
    } catch (error: any) {
      console.error('❌ Error fetching client notifications:', error)
      return c.json({ error: 'Erro ao carregar notificações: ' + error.message }, 500)
    }
  })
  
  /**
   * POST /client/notifications/:notificationId/read
   * Mark client notification as read
   */
  app.post('/make-server-6971b43c/client/notifications/:notificationId/read', async (c: any) => {
    try {
      const notificationId = c.req.param('notificationId')
      const { clientEmail } = await c.req.json()
      
      if (!clientEmail) {
        return c.json({ error: 'Email required' }, 400)
      }
      
      // Find the notification
      const allNotifications = await kv.getByPrefix('notification:')
      const notification = allNotifications.find((n: any) => n.id === notificationId)
      
      if (notification && notification.clientEmail?.toLowerCase() === clientEmail.toLowerCase()) {
        notification.read = true
        // Re-save with the same key it was found with
        const keys = await kv.getByPrefix('notification:')
        for (const key in keys) {
          const value = await kv.get(key)
          if (value && value.id === notificationId) {
            await kv.set(key, notification)
            break
          }
        }
      }
      
      return c.json({ success: true })
      
    } catch (error: any) {
      console.error('❌ Error marking client notification as read:', error)
      return c.json({ error: 'Erro ao marcar notificação: ' + error.message }, 500)
    }
  })
  
  /**
   * GET /workshop/appointment-requests
   * Get appointment requests for workshop
   */
  app.get('/make-server-6971b43c/workshop/appointment-requests', async (c: any) => {
    try {
      const accessToken = c.req.header('Authorization')?.split(' ')[1]
      if (!accessToken) {
        return c.json({ error: 'Unauthorized' }, 401)
      }
      
      const { data: { user }, error } = await supabase.auth.getUser(accessToken)
      if (!user || error) {
        return c.json({ error: 'Invalid token' }, 401)
      }
      
      const userProfile = await kv.get(`user:${user.id}`)
      if (!userProfile?.workshopId) {
        return c.json({ error: 'Workshop ID não encontrado' }, 404)
      }
      
      const workshopId = userProfile.workshopId
      
      // Get appointment request IDs
      const appointmentRequestIds = await kv.get(`workshop_appointment_requests:${workshopId}`) || []
      
      // Get full appointment requests
      const appointments = []
      for (const reqId of appointmentRequestIds) {
        const appointment = await kv.get(`appointment_request:${reqId}`)
        if (appointment) {
          appointments.push(appointment)
        }
      }
      
      // Sort by date (newest first)
      appointments.sort((a: any, b: any) => 
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      )
      
      return c.json({ appointments })
      
    } catch (error: any) {
      console.error('❌ Error fetching appointment requests:', error)
      return c.json({ error: 'Erro ao carregar pedidos: ' + error.message }, 500)
    }
  })
  
  /**
   * POST /workshop/appointment-requests/:requestId/respond
   * Workshop confirms, rejects or reschedules appointment
   */
  app.post('/make-server-6971b43c/workshop/appointment-requests/:requestId/respond', async (c: any) => {
    try {
      const accessToken = c.req.header('Authorization')?.split(' ')[1]
      if (!accessToken) {
        return c.json({ error: 'Unauthorized' }, 401)
      }
      
      const { data: { user }, error } = await supabase.auth.getUser(accessToken)
      if (!user || error) {
        return c.json({ error: 'Invalid token' }, 401)
      }
      
      const userProfile = await kv.get(`user:${user.id}`)
      if (!userProfile?.workshopId) {
        return c.json({ error: 'Workshop ID não encontrado' }, 404)
      }
      
      const requestId = c.req.param('requestId')
      const { action, confirmedDate, confirmedTime, notes } = await c.req.json()
      
      // action can be: 'confirm', 'reschedule', 'reject'
      if (!['confirm', 'reschedule', 'reject'].includes(action)) {
        return c.json({ error: 'Invalid action' }, 400)
      }
      
      const appointment = await kv.get(`appointment_request:${requestId}`)
      if (!appointment) {
        return c.json({ error: 'Appointment not found' }, 404)
      }
      
      // Update appointment
      appointment.respondedAt = new Date().toISOString()
      appointment.respondedBy = user.email
      
      if (action === 'confirm') {
        appointment.status = 'confirmed'
        appointment.confirmedDate = confirmedDate || appointment.preferredDate
        appointment.confirmedTime = confirmedTime || appointment.preferredTime
        appointment.responseNotes = notes
      } else if (action === 'reschedule') {
        if (!confirmedDate || !confirmedTime) {
          return c.json({ error: 'Data e hora são obrigatórias para reagendar' }, 400)
        }
        appointment.status = 'rescheduled'
        appointment.confirmedDate = confirmedDate
        appointment.confirmedTime = confirmedTime
        appointment.responseNotes = notes
      } else if (action === 'reject') {
        appointment.status = 'rejected'
        appointment.responseNotes = notes
      }
      
      await kv.set(`appointment_request:${requestId}`, appointment)
      
      // 🆕 CREATE CLIENT, VEHICLE, AND BUDGET when confirmed or rescheduled
      let clientId = null
      let vehicleId = null
      let budgetId = null
      
      if (action === 'confirm' || action === 'reschedule') {
        try {
          console.log('💼 Creating client, vehicle, and budget...')
          
          // Get the workshop request to get pricing info
          const allWorkshopRequests = await kv.getByPrefix('workshop_request:')
          const workshopRequest = allWorkshopRequests.find((wr: any) => 
            wr.quoteRequestId === appointment.quoteRequestId &&
            wr.workshopId === userProfile.workshopId
          )
          
          // STEP 1: Check if client exists, create if not
          console.log('🔍 Checking if client exists...')
          const allClients = await kv.getByPrefix(`client:${userProfile.workshopId}:`)
          let client = allClients.find((c: any) => 
            c.email?.toLowerCase() === appointment.clientEmail?.toLowerCase()
          )
          
          clientId = client?.id
          if (!client) {
            clientId = `client_${Date.now()}_${Math.random().toString(36).substring(7)}`
            const newClient = {
              id: clientId,
              workshopId: userProfile.workshopId,
              name: appointment.clientName,
              email: appointment.clientEmail,
              phone: appointment.clientPhone,
              createdAt: new Date().toISOString(),
              source: 'instant_quote'
            }
            await kv.set(`client:${userProfile.workshopId}:${clientId}`, newClient)
            console.log(`✅ Client created automatically: ${clientId}`)
          } else {
            console.log(`✅ Client already exists: ${clientId}`)
          }
          
          // STEP 2: Check if vehicle exists, create if not
          console.log('🔍 Checking if vehicle exists...')
          const allVehicles = await kv.getByPrefix(`vehicle:${userProfile.workshopId}:`)
          let vehicle = allVehicles.find((v: any) => 
            v.licensePlate?.toUpperCase() === appointment.licensePlate?.toUpperCase()
          )
          
          vehicleId = vehicle?.id
          if (!vehicle) {
            vehicleId = `vehicle_${Date.now()}_${Math.random().toString(36).substring(7)}`
            
            // 🚗 NEW: Fetch vehicle data from InfoMatricula decoder
            console.log('🔍 Fetching vehicle data from InfoMatricula decoder...')
            let vehicleData: any = null
            try {
              const formattedPlate = appointment.licensePlate.trim().toUpperCase().replace(/\s+/g, '-')
              
              // Check if vehicle data exists in decoder database
              const decoderVehicle = await kv.get(`infomatricula:${formattedPlate}`)
              
              if (decoderVehicle) {
                console.log('✅ Vehicle data found in decoder database:', decoderVehicle)
                vehicleData = decoderVehicle
              } else {
                console.log('⚠️ Vehicle data not found in decoder database for plate:', formattedPlate)
              }
            } catch (error) {
              console.error('❌ Error fetching vehicle data from decoder:', error)
            }
            
            const newVehicle = {
              id: vehicleId,
              workshopId: userProfile.workshopId,
              licensePlate: appointment.licensePlate.toUpperCase(),
              clientId: clientId,
              createdAt: new Date().toISOString(),
              source: 'instant_quote',
              // Use InfoMatricula data if available
              brand: vehicleData?.make || '',
              model: vehicleData?.model || '',
              year: vehicleData?.plateDate ? new Date(vehicleData.plateDate).getFullYear().toString() : '',
              vin: vehicleData?.vin || '',
              version: vehicleData?.version || '',
              plateDate: vehicleData?.plateDate || '',
              // Store full vehicle data for reference
              infoMatriculaData: vehicleData || null
            }
            await kv.set(`vehicle:${userProfile.workshopId}:${vehicleId}`, newVehicle)
            
            if (vehicleData) {
              console.log(`✅ Vehicle created automatically with InfoMatricula data: ${vehicleId}`)
              console.log(`   📋 Brand: ${vehicleData.make}, Model: ${vehicleData.model}, VIN: ${vehicleData.vin}`)
            } else {
              console.log(`✅ Vehicle created automatically (without InfoMatricula data): ${vehicleId}`)
            }
          } else {
            console.log(`✅ Vehicle already exists: ${vehicleId}`)
            
            // Update vehicle's clientId if not set
            if (!vehicle.clientId) {
              vehicle.clientId = clientId
              await kv.set(`vehicle:${userProfile.workshopId}:${vehicleId}`, vehicle)
              console.log(`✅ Vehicle linked to client: ${vehicleId} -> ${clientId}`)
            }
            
            // 🚗 NEW: Update vehicle with InfoMatricula data if not already populated
            if (!vehicle.brand || !vehicle.model || !vehicle.vin) {
              console.log('🔍 Vehicle missing data, checking InfoMatricula decoder...')
              try {
                const formattedPlate = appointment.licensePlate.trim().toUpperCase().replace(/\s+/g, '-')
                const decoderVehicle = await kv.get(`infomatricula:${formattedPlate}`)
                
                if (decoderVehicle) {
                  console.log('✅ Updating existing vehicle with InfoMatricula data')
                  vehicle.brand = vehicle.brand || decoderVehicle.make || ''
                  vehicle.model = vehicle.model || decoderVehicle.model || ''
                  vehicle.vin = vehicle.vin || decoderVehicle.vin || ''
                  vehicle.version = vehicle.version || decoderVehicle.version || ''
                  vehicle.year = vehicle.year || (decoderVehicle.plateDate ? new Date(decoderVehicle.plateDate).getFullYear().toString() : '')
                  vehicle.plateDate = vehicle.plateDate || decoderVehicle.plateDate || ''
                  vehicle.infoMatriculaData = decoderVehicle
                  
                  await kv.set(`vehicle:${userProfile.workshopId}:${vehicleId}`, vehicle)
                  console.log(`✅ Vehicle updated with InfoMatricula data: ${vehicleId}`)
                  console.log(`   📋 Brand: ${decoderVehicle.make}, Model: ${decoderVehicle.model}, VIN: ${decoderVehicle.vin}`)
                } else {
                  console.log('⚠️ No InfoMatricula data available for this vehicle')
                }
              } catch (error) {
                console.error('❌ Error updating vehicle with decoder data:', error)
              }
            }
          }
          
          // STEP 3: Create budget automatically
          console.log('💰 Creating budget automatically...')
          
          // Check if budget already exists for this appointment to avoid duplicates
          const existingBudgets = await kv.getByPrefix(`budget:`)
          const existingBudget = existingBudgets.find((b: any) => 
            b.publicQuoteRequestId === appointment.quoteRequestId &&
            b.workshopId === userProfile.workshopId
          )
          
          if (existingBudget) {
            console.log(`✅ Budget already exists for this request: ${existingBudget.id}`)
            budgetId = existingBudget.id
          } else {
            budgetId = `budget_${Date.now()}_${Math.random().toString(36).substring(7)}`
            
            // Get the price from workshop response (if validated/modified) or from instant quote
            const finalPrice = workshopRequest?.workshopResponse?.price || 0
            
            // Create budget item from service
            const budgetItems = [{
              partNumber: appointment.serviceId,
              description: appointment.serviceName,
              quantity: 1,
              price: finalPrice
            }]
            
            const partsTotal = finalPrice
            const laborHours = 0
            const laborRate = 0
            const laborTotal = 0
            const subtotal = partsTotal + laborTotal
            const tax = subtotal * 0.23 // IVA 23%
            const total = subtotal + tax
            
            const budget = {
              id: budgetId,
              number: `ORC-${Date.now()}`,
              workshopId: userProfile.workshopId,
              clientId: clientId,
              vehicleId: vehicleId,
              items: budgetItems,
              laborHours: laborHours,
              laborRate: laborRate,
              partsTotal: partsTotal,
              laborTotal: laborTotal,
              subtotal: subtotal,
              tax: tax,
              total: total,
              status: 'pending',
              notes: `Orçamento criado automaticamente a partir do pedido de orçamento público.\nServiço: ${appointment.serviceName}\nObservações: ${appointment.notes || 'N/A'}`,
              createdAt: new Date().toISOString(),
              publicQuoteRequestId: appointment.quoteRequestId,
              licensePlate: appointment.licensePlate,
              serviceName: appointment.serviceName,
              clientName: appointment.clientName,
              clientEmail: appointment.clientEmail,
              clientPhone: appointment.clientPhone,
              source: 'instant_quote'
            }
            
            await kv.set(`budget:${budgetId}`, budget)
            console.log(`✅ Budget created automatically: ${budgetId}`)
            
            // 🔔 Create notification for workshop about new auto-created budget
            const budgetNotifId = `notif_${Date.now()}_${Math.random().toString(36).substring(7)}`
            await kv.set(`notification:workshop:${userProfile.workshopId}:${budgetNotifId}`, {
              id: budgetNotifId,
              type: 'budget_auto_created',
              workshopId: userProfile.workshopId,
              budgetId: budgetId,
              clientName: appointment.clientName,
              licensePlate: appointment.licensePlate,
              serviceName: appointment.serviceName,
              total: total.toFixed(2),
              message: `Novo orçamento criado automaticamente: ${appointment.serviceName} - ${appointment.licensePlate}`,
              createdAt: new Date().toISOString(),
              read: false
            })
            console.log(`✅ Notification created for budget: ${budgetNotifId}`)
            
            // 🔔 Create notification for CLIENT to validate the budget
            const clientBudgetNotifId = `notif_${Date.now()}_${Math.random().toString(36).substring(7)}`
            await kv.set(`notification:${clientBudgetNotifId}`, {
              id: clientBudgetNotifId,
              type: 'budget_validation_required',
              workshopId: userProfile.workshopId,
              budgetId: budgetId,
              clientEmail: appointment.clientEmail,
              quoteRequestId: appointment.quoteRequestId,
              serviceName: appointment.serviceName,
              licensePlate: appointment.licensePlate,
              total: total.toFixed(2),
              createdAt: new Date().toISOString(),
              read: false
            })
            console.log(`✅ CLIENT NOTIFICATION created for budget validation: notification:${clientBudgetNotifId} for email: ${appointment.clientEmail}`)
            
            // Budget is now awaiting client approval (no specific status needed, will show as pending)
            await kv.set(`budget:${budgetId}`, budget)
            console.log(`   💰 Budget details:`, {
              budgetId,
              clientId,
              clientName: budget.clientName,
              clientEmail: budget.clientEmail,
              total: budget.total,
              status: budget.status,
              clientApprovalStatus: budget.clientApprovalStatus
            })
          }
          
          // Save references in appointment_request
          appointment.clientId = clientId
          appointment.vehicleId = vehicleId
          appointment.budgetId = budgetId
          await kv.set(`appointment_request:${requestId}`, appointment)
          
          console.log('✅ Integration complete - Client, Vehicle, and Budget created')
          
        } catch (integrationError: any) {
          console.error('❌ Error creating client/vehicle/budget (non-fatal):', integrationError)
          // Don't fail the whole request if integration fails
        }
      }
      
      // 🆕 CREATE APPOINTMENT IN AGENDA MODULE when confirmed or rescheduled
      let agendaAppointmentId = null
      if (action === 'confirm' || action === 'reschedule') {
        try {
          console.log('📅 Creating appointment in agenda module...')
          
          // Check if agenda config exists
          const agendaConfig = await kv.get(`agenda_config:${userProfile.workshopId}`)
          if (!agendaConfig) {
            console.warn('⚠️ Agenda config not found, skipping agenda creation')
          } else {
            // Check availability
            const allAppointments = await kv.getByPrefix('appointment:')
            const appointmentsOnDate = allAppointments.filter((apt: any) => 
              apt.workshopId === userProfile.workshopId &&
              apt.date === appointment.confirmedDate &&
              apt.status !== 'cancelled'
            )
            
            if (appointmentsOnDate.length >= agendaConfig.dailySlots) {
              console.warn('⚠️ No slots available, appointment confirmed but not added to agenda')
            } else {
              // Create appointment in agenda
              agendaAppointmentId = `apt_${Date.now()}_${Math.random().toString(36).substring(7)}`
              const agendaAppointment = {
                id: agendaAppointmentId,
                workshopId: userProfile.workshopId,
                appointmentRequestId: requestId,
                quoteRequestId: appointment.quoteRequestId,
                budgetId: budgetId, // Link to the auto-created budget
                clientId: clientId, // Link to the auto-created or existing client
                vehicleId: vehicleId, // Link to the auto-created or existing vehicle
                clientName: appointment.clientName,
                clientEmail: appointment.clientEmail,
                clientPhone: appointment.clientPhone,
                licensePlate: appointment.licensePlate,
                serviceId: appointment.serviceId,
                serviceName: appointment.serviceName,
                date: appointment.confirmedDate,
                startTime: appointment.confirmedTime,
                notes: appointment.notes || '',
                status: 'scheduled',
                createdAt: new Date().toISOString(),
                createdBy: 'instant_quote_system',
                source: 'instant_quote'
              }
              
              await kv.set(`appointment:${agendaAppointmentId}`, agendaAppointment)
              
              // Save reference in appointment_request
              appointment.agendaAppointmentId = agendaAppointmentId
              await kv.set(`appointment_request:${requestId}`, appointment)
              
              console.log('✅ Appointment created in agenda:', agendaAppointmentId)
            }
          }
        } catch (agendaError: any) {
          console.error('❌ Error creating in agenda (non-fatal):', agendaError)
          // Don't fail the whole request if agenda creation fails
        }
      }
      
      // Update quote request
      const quoteRequest = await kv.get(`quote_request:${appointment.quoteRequestId}`)
      if (quoteRequest) {
        quoteRequest.appointmentStatus = appointment.status
        quoteRequest.confirmedDate = appointment.confirmedDate
        quoteRequest.confirmedTime = appointment.confirmedTime
        await kv.set(`quote_request:${appointment.quoteRequestId}`, quoteRequest)
      }
      
      // Create notification for client
      const clientNotifId = `notif_${Date.now()}_${Math.random().toString(36).substring(7)}`
      await kv.set(`notification:${clientNotifId}`, {
        id: clientNotifId,
        type: 'appointment_response',
        clientEmail: appointment.clientEmail,
        quoteRequestId: appointment.quoteRequestId,
        appointmentRequestId: requestId,
        action,
        confirmedDate: appointment.confirmedDate,
        confirmedTime: appointment.confirmedTime,
        notes: appointment.responseNotes,
        createdAt: new Date().toISOString(),
        read: false
      })
      
      console.log(`✅ Appointment ${action}ed:`, requestId)
      if (agendaAppointmentId) {
        console.log(`✅ Also created in agenda module:`, agendaAppointmentId)
      }
      if (clientId && vehicleId && budgetId) {
        console.log(`✅ Integration complete - Client: ${clientId}, Vehicle: ${vehicleId}, Budget: ${budgetId}`)
      }
      
      return c.json({
        success: true,
        appointment,
        agendaAppointmentId,
        clientId,
        vehicleId,
        budgetId,
        message: (clientId && vehicleId && budgetId) 
          ? 'Agendamento confirmado e cliente, veículo e orçamento criados automaticamente'
          : 'Agendamento confirmado'
      })
      
    } catch (error: any) {
      console.error('❌ Error responding to appointment:', error)
      return c.json({ error: 'Erro ao responder: ' + error.message }, 500)
    }
  })
  
  /**
   * POST /client/budgets/:budgetId/approve
   * Client approves or rejects a budget
   */
  app.post('/make-server-6971b43c/client/budgets/:budgetId/approve', async (c: any) => {
    try {
      const accessToken = c.req.header('Authorization')?.split(' ')[1]
      if (!accessToken) {
        return c.json({ error: 'Unauthorized' }, 401)
      }
      
      const { data: { user }, error } = await supabase.auth.getUser(accessToken)
      if (!user || error) {
        return c.json({ error: 'Invalid token' }, 401)
      }
      
      const budgetId = c.req.param('budgetId')
      const { action } = await c.req.json() // 'approve' or 'reject'
      
      if (!['approve', 'reject'].includes(action)) {
        return c.json({ error: 'Invalid action' }, 400)
      }
      
      console.log(`📋 Client ${action}ing budget:`, budgetId)
      
      // Load budget
      const budget = await kv.get(`budget:${budgetId}`)
      if (!budget) {
        return c.json({ error: 'Budget not found' }, 404)
      }
      
      // Verify client owns this budget
      const clientProfile = await kv.get(`public_client:${user.id}`)
      if (!clientProfile || budget.clientEmail?.toLowerCase() !== clientProfile.email?.toLowerCase()) {
        return c.json({ error: 'Unauthorized - budget does not belong to this client' }, 403)
      }
      
      // Update budget approval status
      if (action === 'approve') {
        budget.clientApprovalStatus = 'approved'
        budget.clientApprovedAt = new Date().toISOString()
        budget.approvedByClient = true // Mark as approved by client
        budget.status = 'approved' // Also update main status
      } else {
        budget.clientApprovalStatus = 'rejected'
        budget.clientRejectedAt = new Date().toISOString()
        budget.approvedByClient = false
      }
      
      await kv.set(`budget:${budgetId}`, budget)
      console.log(`✅ Budget ${action}ed by client`)
      
      // Update the client notification to show the action taken
      const normalizedClientEmail = budget.clientEmail?.trim().toLowerCase()
      if (normalizedClientEmail) {
        const allNotifications = await kv.getByPrefix('notification:')
        const budgetNotification = allNotifications.find(n => 
          n && 
          n.budgetId === budgetId && 
          n.type === 'budget_validation_required' &&
          n.clientEmail?.toLowerCase() === normalizedClientEmail
        )
        
        if (budgetNotification) {
          // Update notification to show action taken
          budgetNotification.clientAction = action
          budgetNotification.read = true
          budgetNotification.readAt = new Date().toISOString()
          await kv.set(`notification:${budgetNotification.id}`, budgetNotification)
          console.log(`✅ Client notification updated with action: ${action}`)
        }
      }
      
      // Create notification for workshop
      const workshopNotifId = `notif_${Date.now()}_${Math.random().toString(36).substring(7)}`
      await kv.set(`notification:workshop:${budget.workshopId}:${workshopNotifId}`, {
        id: workshopNotifId,
        type: `budget_${action}d_by_client`,
        workshopId: budget.workshopId,
        budgetId: budgetId,
        clientName: budget.clientName,
        licensePlate: budget.licensePlate,
        serviceName: budget.serviceName,
        total: budget.total.toFixed(2),
        message: action === 'approve' 
          ? `Cliente aprovou o orçamento: ${budget.serviceName} - ${budget.licensePlate}`
          : `Cliente rejeitou o orçamento: ${budget.serviceName} - ${budget.licensePlate}`,
        createdAt: new Date().toISOString(),
        read: false
      })
      console.log(`✅ Workshop notification created: ${workshopNotifId}`)
      
      return c.json({
        success: true,
        message: action === 'approve' ? 'Orçamento aprovado com sucesso!' : 'Orçamento rejeitado'
      })
      
    } catch (error: any) {
      console.error('❌ Error approving/rejecting budget:', error)
      return c.json({ error: 'Erro ao processar aprovação: ' + error.message }, 500)
    }
  })
  
  /**
   * GET /workshop/statistics
   * Get performance statistics for workshop
   */
  app.get('/make-server-6971b43c/workshop/statistics', async (c: any) => {
    try {
      const accessToken = c.req.header('Authorization')?.split(' ')[1]
      if (!accessToken) {
        return c.json({ error: 'Unauthorized' }, 401)
      }
      
      const { data: { user }, error } = await supabase.auth.getUser(accessToken)
      if (!user || error) {
        return c.json({ error: 'Invalid token' }, 401)
      }
      
      const userProfile = await kv.get(`user:${user.id}`)
      if (!userProfile?.workshopId) {
        return c.json({ error: 'Workshop ID não encontrado' }, 404)
      }
      
      const workshopId = userProfile.workshopId
      const timeRange = c.req.query('timeRange') || 'month'
      
      // Calculate date filter
      const now = new Date()
      let startDate = new Date()
      
      if (timeRange === 'week') {
        startDate.setDate(now.getDate() - 7)
      } else if (timeRange === 'month') {
        startDate.setMonth(now.getMonth() - 1)
      } else if (timeRange === 'year') {
        startDate.setFullYear(now.getFullYear() - 1)
      }
      
      // Get all workshop requests
      const allRequests = await kv.getByPrefix('workshop_request:')
      const workshopRequests = allRequests.filter((r: any) => {
        if (r.workshopId !== workshopId) return false
        const createdAt = new Date(r.createdAt)
        return createdAt >= startDate
      })
      
      // Calculate statistics
      const totalRequests = workshopRequests.length
      const pendingRequests = workshopRequests.filter((r: any) => r.status === 'pending').length
      const respondedRequests = workshopRequests.filter((r: any) => 
        r.status === 'validated' || r.status === 'modified'
      ).length
      const chosenByClient = workshopRequests.filter((r: any) => r.isChosenByClient).length
      const rejectedRequests = workshopRequests.filter((r: any) => r.status === 'rejected').length
      
      const conversionRate = totalRequests > 0 ? (chosenByClient / totalRequests) * 100 : 0
      
      // Calculate average response time
      const respondedWithTime = workshopRequests.filter((r: any) => 
        r.workshopResponse?.respondedAt && r.createdAt
      )
      
      let averageResponseTime = 0
      if (respondedWithTime.length > 0) {
        const totalMinutes = respondedWithTime.reduce((sum: number, r: any) => {
          const created = new Date(r.createdAt).getTime()
          const responded = new Date(r.workshopResponse.respondedAt).getTime()
          return sum + ((responded - created) / (1000 * 60))
        }, 0)
        averageResponseTime = totalMinutes / respondedWithTime.length
      }
      
      // Calculate average prices
      const requestsWithPrice = workshopRequests.filter((r: any) => 
        r.workshopResponse?.price
      )
      
      let averagePrice = 0
      if (requestsWithPrice.length > 0) {
        averagePrice = requestsWithPrice.reduce((sum: number, r: any) => 
          sum + r.workshopResponse.price, 0
        ) / requestsWithPrice.length
      }
      
      // Get competitor prices (from same quote requests)
      const quoteRequestIds = [...new Set(workshopRequests.map((r: any) => r.quoteRequestId))]
      const competitorPrices: number[] = []
      
      for (const qrId of quoteRequestIds) {
        const allRequestsForQuote = allRequests.filter((r: any) => 
          r.quoteRequestId === qrId && r.workshopId !== workshopId && r.workshopResponse?.price
        )
        competitorPrices.push(...allRequestsForQuote.map((r: any) => r.workshopResponse.price))
      }
      
      const competitorAveragePrice = competitorPrices.length > 0
        ? competitorPrices.reduce((a, b) => a + b, 0) / competitorPrices.length
        : averagePrice
      
      const priceDifferencePercentage = competitorAveragePrice > 0
        ? ((averagePrice - competitorAveragePrice) / competitorAveragePrice) * 100
        : 0
      
      // Group by service
      const serviceGroups = workshopRequests.reduce((acc: any, r: any) => {
        const serviceName = r.serviceName || 'Outro'
        acc[serviceName] = (acc[serviceName] || 0) + 1
        return acc
      }, {})
      
      const requestsByService = Object.entries(serviceGroups).map(([serviceName, count]) => ({
        serviceName,
        count: count as number
      }))
      
      // Get workshop ratings
      const workshopReviews = await kv.getByPrefix(`review:workshop:${workshopId}:`)
      const totalReviews = workshopReviews.length
      const averageRating = totalReviews > 0
        ? workshopReviews.reduce((sum: number, r: any) => sum + (r.rating || 0), 0) / totalReviews
        : 0
      
      const statistics = {
        totalRequests,
        pendingRequests,
        respondedRequests,
        chosenByClient,
        rejectedRequests,
        conversionRate,
        averageResponseTime,
        averagePrice,
        competitorAveragePrice,
        priceDifferencePercentage,
        requestsByService,
        monthlyTrend: [], // Can be enhanced later
        averageRating,
        totalReviews
      }
      
      return c.json({ statistics })
      
    } catch (error: any) {
      console.error('❌ Error fetching statistics:', error)
      return c.json({ error: 'Erro ao carregar estatísticas: ' + error.message }, 500)
    }
  })
  
  /**
   * POST /client/submit-review
   * Client submits review for workshop
   */
  app.post('/make-server-6971b43c/client/submit-review', async (c: any) => {
    try {
      const { workshopId, clientName, clientEmail, rating, comment, appointmentId } = await c.req.json()
      
      if (!workshopId || !clientName || !clientEmail || !rating) {
        return c.json({ error: 'Campos obrigatórios em falta' }, 400)
      }
      
      if (rating < 1 || rating > 5) {
        return c.json({ error: 'Rating deve estar entre 1 e 5' }, 400)
      }
      
      // Check if client already reviewed this appointment
      if (appointmentId) {
        const existingReviews = await kv.getByPrefix(`review:workshop:${workshopId}:`)
        const alreadyReviewed = existingReviews.some((r: any) => 
          r.appointmentId === appointmentId && r.clientEmail === clientEmail
        )
        
        if (alreadyReviewed) {
          return c.json({ error: 'Já avaliou este agendamento' }, 400)
        }
      }
      
      const reviewId = `review_${Date.now()}_${Math.random().toString(36).substring(7)}`
      
      await kv.set(`review:workshop:${workshopId}:${reviewId}`, {
        id: reviewId,
        workshopId,
        clientName,
        clientEmail,
        appointmentId,
        rating,
        comment: comment || '',
        createdAt: new Date().toISOString()
      })
      
      console.log(`✅ Review submitted: ${reviewId} (${rating} stars)`)
      
      return c.json({
        success: true,
        reviewId
      })
      
    } catch (error: any) {
      console.error('❌ Error submitting review:', error)
      return c.json({ error: 'Erro ao submeter avaliação: ' + error.message }, 500)
    }
  })
  
  /**
   * GET /workshop/reviews
   * Get reviews for workshop
   */
  app.get('/make-server-6971b43c/workshop/reviews', async (c: any) => {
    try {
      const accessToken = c.req.header('Authorization')?.split(' ')[1]
      if (!accessToken) {
        return c.json({ error: 'Unauthorized' }, 401)
      }
      
      const { data: { user }, error } = await supabase.auth.getUser(accessToken)
      if (!user || error) {
        return c.json({ error: 'Invalid token' }, 401)
      }
      
      const userProfile = await kv.get(`user:${user.id}`)
      if (!userProfile?.workshopId) {
        return c.json({ error: 'Workshop ID não encontrado' }, 404)
      }
      
      const workshopId = userProfile.workshopId
      
      const reviews = await kv.getByPrefix(`review:workshop:${workshopId}:`)
      
      // Sort by date (newest first)
      reviews.sort((a: any, b: any) => 
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      )
      
      // Calculate stats
      const totalReviews = reviews.length
      const averageRating = totalReviews > 0
        ? reviews.reduce((sum: number, r: any) => sum + r.rating, 0) / totalReviews
        : 0
      
      const ratingDistribution = [0, 0, 0, 0, 0] // 1-5 stars
      reviews.forEach((r: any) => {
        if (r.rating >= 1 && r.rating <= 5) {
          ratingDistribution[r.rating - 1]++
        }
      })
      
      return c.json({
        reviews,
        stats: {
          averageRating,
          totalReviews,
          ratingDistribution
        }
      })
      
    } catch (error: any) {
      console.error('❌ Error fetching reviews:', error)
      return c.json({ error: 'Erro ao carregar avaliações: ' + error.message }, 500)
    }
  })
  
  /**
   * GET /public/workshop/:workshopId/reviews
   * Get public reviews for a workshop (for instant quotes)
   */
  app.get('/make-server-6971b43c/public/workshop/:workshopId/reviews', async (c: any) => {
    try {
      const workshopId = c.req.param('workshopId')
      
      const reviews = await kv.getByPrefix(`review:workshop:${workshopId}:`)
      
      // Sort by date (newest first)
      reviews.sort((a: any, b: any) => 
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      )
      
      // Calculate stats
      const totalReviews = reviews.length
      const averageRating = totalReviews > 0
        ? reviews.reduce((sum: number, r: any) => sum + r.rating, 0) / totalReviews
        : 0
      
      // Return only recent reviews (max 10) for public display
      const recentReviews = reviews.slice(0, 10)
      
      return c.json({
        averageRating,
        totalReviews,
        reviews: recentReviews
      })
      
    } catch (error: any) {
      console.error('❌ Error fetching public reviews:', error)
      return c.json({ error: 'Erro ao carregar avaliações: ' + error.message }, 500)
    }
  })
  
  /**
   * GET /public/quote-request/:quoteRequestId/responses
   * Client checks responses from selected workshops
   */
  app.get('/make-server-6971b43c/public/quote-request/:quoteRequestId/responses', async (c: any) => {
    try {
      const quoteRequestId = c.req.param('quoteRequestId')
      
      console.log('📬 Fetching responses for quote request:', quoteRequestId)
      
      const quoteRequest = await kv.get(`quote_request:${quoteRequestId}`)
      if (!quoteRequest) {
        return c.json({ error: 'Pedido não encontrado' }, 404)
      }
      
      // Get all workshop requests for this quote
      const allWorkshopRequests = await kv.getByPrefix('workshop_request:')
      const relatedRequests = allWorkshopRequests.filter((wr: any) => 
        wr.quoteRequestId === quoteRequestId
      )
      
      // Get workshop details for each request
      const responsesWithDetails = []
      for (const request of relatedRequests) {
        const workshop = await kv.get(`workshop:${request.workshopId}`)
        if (workshop) {
          responsesWithDetails.push({
            ...request,
            workshopName: workshop.workshopName,
            workshopPhone: workshop.workshopPhone,
            workshopEmail: workshop.workshopEmail,
            workshopAddress: workshop.workshopAddress,
            workshopLogoUrl: workshop.workshopLogoUrl
          })
        }
      }
      
      console.log(`✅ Found ${responsesWithDetails.length} responses`)
      
      return c.json({
        quoteRequest,
        responses: responsesWithDetails
      })
      
    } catch (error: any) {
      console.error('❌ Error fetching responses:', error)
      return c.json({ error: 'Erro ao carregar respostas: ' + error.message }, 500)
    }
  })
  
  // ==========================================
  // AGENDA CONFIGURATION & SLOT MANAGEMENT
  // ==========================================
  
  /**
   * GET /agenda/config
   * Get agenda configuration for workshop
   */
  app.get('/make-server-6971b43c/agenda/config', async (c: any) => {
    try {
      const accessToken = c.req.header('Authorization')?.split(' ')[1]
      if (!accessToken) {
        return c.json({ error: 'Unauthorized' }, 401)
      }
      
      const { data: { user }, error } = await supabase.auth.getUser(accessToken)
      if (!user || error) {
        return c.json({ error: 'Invalid token' }, 401)
      }
      
      const userProfile = await kv.get(`user:${user.id}`)
      if (!userProfile?.workshopId) {
        return c.json({ error: 'Workshop ID não encontrado' }, 404)
      }
      
      const workshopId = userProfile.workshopId
      
      // Get or create default config
      let config = await kv.get(`agenda_config:${workshopId}`)
      if (!config) {
        config = {
          workshopId,
          dailySlots: 8, // Default: 8 slots per day
          workingHours: {
            monday: { enabled: true, start: '09:00', end: '18:00' },
            tuesday: { enabled: true, start: '09:00', end: '18:00' },
            wednesday: { enabled: true, start: '09:00', end: '18:00' },
            thursday: { enabled: true, start: '09:00', end: '18:00' },
            friday: { enabled: true, start: '09:00', end: '18:00' },
            saturday: { enabled: false, start: '09:00', end: '13:00' },
            sunday: { enabled: false, start: '09:00', end: '13:00' }
          },
          slotDuration: 60, // minutes
          breakTime: { start: '13:00', end: '14:00' },
          advanceBookingDays: 30, // How many days in advance clients can book
          createdAt: new Date().toISOString()
        }
        await kv.set(`agenda_config:${workshopId}`, config)
      }
      
      console.log('✅ Agenda config loaded for workshop:', workshopId)
      
      return c.json({ config })
      
    } catch (error: any) {
      console.error('❌ Error fetching agenda config:', error)
      return c.json({ error: 'Erro ao carregar configuração: ' + error.message }, 500)
    }
  })
  
  /**
   * PUT /agenda/config
   * Update agenda configuration
   */
  app.put('/make-server-6971b43c/agenda/config', async (c: any) => {
    try {
      const updates = await c.req.json()
      
      const accessToken = c.req.header('Authorization')?.split(' ')[1]
      if (!accessToken) {
        return c.json({ error: 'Unauthorized' }, 401)
      }
      
      const { data: { user }, error } = await supabase.auth.getUser(accessToken)
      if (!user || error) {
        return c.json({ error: 'Invalid token' }, 401)
      }
      
      const userProfile = await kv.get(`user:${user.id}`)
      if (!userProfile?.workshopId) {
        return c.json({ error: 'Workshop ID não encontrado' }, 404)
      }
      
      const workshopId = userProfile.workshopId
      
      // Get existing config
      const config = await kv.get(`agenda_config:${workshopId}`)
      if (!config) {
        return c.json({ error: 'Configuração não encontrada' }, 404)
      }
      
      // Update config
      const updatedConfig = {
        ...config,
        ...updates,
        updatedAt: new Date().toISOString(),
        updatedBy: user.email
      }
      
      await kv.set(`agenda_config:${workshopId}`, updatedConfig)
      
      console.log('✅ Agenda config updated for workshop:', workshopId)
      
      return c.json({ config: updatedConfig })
      
    } catch (error: any) {
      console.error('❌ Error updating agenda config:', error)
      return c.json({ error: 'Erro ao atualizar configuração: ' + error.message }, 500)
    }
  })
  
  /**
   * GET /agenda/availability
   * Check slot availability for a date range
   */
  app.get('/make-server-6971b43c/agenda/availability', async (c: any) => {
    try {
      const workshopId = c.req.query('workshopId')
      const startDate = c.req.query('startDate')
      const endDate = c.req.query('endDate')
      
      if (!workshopId || !startDate || !endDate) {
        return c.json({ error: 'Parâmetros em falta' }, 400)
      }
      
      console.log(`📅 Checking availability for workshop ${workshopId} from ${startDate} to ${endDate}`)
      
      // Get agenda config
      const config = await kv.get(`agenda_config:${workshopId}`)
      if (!config) {
        return c.json({ error: 'Configuração de agenda não encontrada' }, 404)
      }
      
      // Get all appointments for this workshop
      const allAppointments = await kv.getByPrefix('appointment:')
      const workshopAppointments = allAppointments.filter((apt: any) => 
        apt.workshopId === workshopId &&
        apt.date >= startDate &&
        apt.date <= endDate &&
        apt.status !== 'cancelled'
      )
      
      // Calculate availability per day
      const start = new Date(startDate)
      const end = new Date(endDate)
      const availability = []
      
      for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
        const dateStr = d.toISOString().split('T')[0]
        const dayName = d.toLocaleDateString('en-US', { weekday: 'monday' }).toLowerCase()
        
        const dayConfig = config.workingHours[dayName]
        
        if (!dayConfig || !dayConfig.enabled) {
          availability.push({
            date: dateStr,
            available: false,
            reason: 'Dia não útil'
          })
          continue
        }
        
        // Count appointments on this day
        const appointmentsOnDay = workshopAppointments.filter((apt: any) => apt.date === dateStr)
        const usedSlots = appointmentsOnDay.length
        const availableSlots = config.dailySlots - usedSlots
        
        availability.push({
          date: dateStr,
          available: availableSlots > 0,
          totalSlots: config.dailySlots,
          usedSlots,
          availableSlots,
          workingHours: {
            start: dayConfig.start,
            end: dayConfig.end
          }
        })
      }
      
      console.log(`✅ Availability calculated for ${availability.length} days`)
      
      return c.json({ availability })
      
    } catch (error: any) {
      console.error('❌ Error checking availability:', error)
      return c.json({ error: 'Erro ao verificar disponibilidade: ' + error.message }, 500)
    }
  })
  
  /**
   * POST /public/book-appointment
   * Client books appointment after selecting workshop
   */
  app.post('/make-server-6971b43c/public/book-appointment', async (c: any) => {
    try {
      const { workshopRequestId, preferredDate, preferredTime, notes } = await c.req.json()
      
      console.log('📅 Booking appointment for request:', workshopRequestId)
      
      if (!workshopRequestId || !preferredDate) {
        return c.json({ error: 'Dados em falta' }, 400)
      }
      
      // Get workshop request
      const workshopRequest = await kv.get(`workshop_request:${workshopRequestId}`)
      if (!workshopRequest) {
        return c.json({ error: 'Pedido não encontrado' }, 404)
      }
      
      // Check availability
      const config = await kv.get(`agenda_config:${workshopRequest.workshopId}`)
      if (!config) {
        return c.json({ error: 'Configuração de agenda não disponível' }, 404)
      }
      
      // Get appointments on preferred date
      const allAppointments = await kv.getByPrefix('appointment:')
      const appointmentsOnDate = allAppointments.filter((apt: any) => 
        apt.workshopId === workshopRequest.workshopId &&
        apt.date === preferredDate &&
        apt.status !== 'cancelled'
      )
      
      if (appointmentsOnDate.length >= config.dailySlots) {
        return c.json({ error: 'Não há slots disponíveis nesta data' }, 400)
      }
      
      // 🆕 STEP 1: Check if client exists, create if not
      console.log('🔍 Checking if client exists...')
      const allClients = await kv.getByPrefix(`client:${workshopRequest.workshopId}:`)
      let client = allClients.find((c: any) => 
        c.email?.toLowerCase() === workshopRequest.clientEmail?.toLowerCase()
      )
      
      let clientId = client?.id
      if (!client) {
        clientId = `client_${Date.now()}_${Math.random().toString(36).substring(7)}`
        const newClient = {
          id: clientId,
          workshopId: workshopRequest.workshopId,
          name: workshopRequest.clientName,
          email: workshopRequest.clientEmail,
          phone: workshopRequest.clientPhone,
          createdAt: new Date().toISOString(),
          source: 'instant_quote'
        }
        await kv.set(`client:${workshopRequest.workshopId}:${clientId}`, newClient)
        console.log(`✅ Client created automatically: ${clientId}`)
      } else {
        console.log(`✅ Client already exists: ${clientId}`)
      }
      
      // 🆕 STEP 2: Check if vehicle exists, create if not
      console.log('🔍 Checking if vehicle exists...')
      const allVehicles = await kv.getByPrefix(`vehicle:${workshopRequest.workshopId}:`)
      let vehicle = allVehicles.find((v: any) => 
        v.licensePlate?.toUpperCase() === workshopRequest.licensePlate?.toUpperCase()
      )
      
      let vehicleId = vehicle?.id
      if (!vehicle) {
        vehicleId = `vehicle_${Date.now()}_${Math.random().toString(36).substring(7)}`
        const newVehicle = {
          id: vehicleId,
          workshopId: workshopRequest.workshopId,
          licensePlate: workshopRequest.licensePlate.toUpperCase(),
          clientId: clientId,
          createdAt: new Date().toISOString(),
          source: 'instant_quote',
          brand: '',
          model: '',
          year: ''
        }
        await kv.set(`vehicle:${workshopRequest.workshopId}:${vehicleId}`, newVehicle)
        console.log(`✅ Vehicle created automatically: ${vehicleId}`)
      } else {
        console.log(`✅ Vehicle already exists: ${vehicleId}`)
        // Update vehicle's clientId if not set
        if (!vehicle.clientId) {
          vehicle.clientId = clientId
          await kv.set(`vehicle:${workshopRequest.workshopId}:${vehicleId}`, vehicle)
          console.log(`✅ Vehicle linked to client: ${vehicleId} -> ${clientId}`)
        }
      }
      
      // 🆕 STEP 3: Create budget automatically
      console.log('💰 Creating budget automatically...')
      
      // Check if budget already exists for this workshop request to avoid duplicates
      const existingBudgets = await kv.getByPrefix(`budget:`)
      const existingBudget = existingBudgets.find((b: any) => 
        b.publicQuoteRequestId === workshopRequest.quoteRequestId &&
        b.workshopId === workshopRequest.workshopId
      )
      
      let budgetId: string
      let budget: any
      
      if (existingBudget) {
        console.log(`✅ Budget already exists for this request: ${existingBudget.id}`)
        budgetId = existingBudget.id
        budget = existingBudget
      } else {
        budgetId = `budget_${Date.now()}_${Math.random().toString(36).substring(7)}`
        
        // Get the price from workshop response (if validated/modified) or from instant quote
        const finalPrice = workshopRequest.workshopResponse?.price || 0
        
        // Create budget item from service
        const budgetItems = [{
          partNumber: workshopRequest.serviceId,
          description: workshopRequest.serviceName,
          quantity: 1,
          price: finalPrice
        }]
        
        const partsTotal = finalPrice
        const laborHours = 0
        const laborRate = 0
        const laborTotal = 0
        const subtotal = partsTotal + laborTotal
        const tax = subtotal * 0.23 // IVA 23%
        const total = subtotal + tax
        
        budget = {
          id: budgetId,
          number: `ORC-${Date.now()}`,
          workshopId: workshopRequest.workshopId,
          clientId: clientId,
          vehicleId: vehicleId,
          items: budgetItems,
          laborHours: laborHours,
          laborRate: laborRate,
          partsTotal: partsTotal,
          laborTotal: laborTotal,
          subtotal: subtotal,
          tax: tax,
          total: total,
          status: 'pending',
          notes: `Orçamento criado automaticamente a partir do pedido de orçamento público.\nServiço: ${workshopRequest.serviceName}\nObservações: ${notes || 'N/A'}`,
          createdAt: new Date().toISOString(),
          publicQuoteRequestId: workshopRequest.quoteRequestId,
          licensePlate: workshopRequest.licensePlate,
          serviceName: workshopRequest.serviceName,
          clientName: workshopRequest.clientName,
          clientEmail: workshopRequest.clientEmail,
          clientPhone: workshopRequest.clientPhone,
          source: 'instant_quote'
        }
        
        await kv.set(`budget:${budgetId}`, budget)
        console.log(`✅ Budget created automatically: ${budgetId}`)
        
        // 🔔 Create notification for workshop about new auto-created budget (only if newly created)
        const budgetNotifId = `notif_${Date.now()}_${Math.random().toString(36).substring(7)}`
        await kv.set(`notification:workshop:${workshopRequest.workshopId}:${budgetNotifId}`, {
          id: budgetNotifId,
          type: 'budget_auto_created',
          workshopId: workshopRequest.workshopId,
          budgetId: budgetId,
          clientName: workshopRequest.clientName,
          licensePlate: workshopRequest.licensePlate,
          serviceName: workshopRequest.serviceName,
          total: total.toFixed(2),
          message: `Novo orçamento criado automaticamente: ${workshopRequest.serviceName} - ${workshopRequest.licensePlate}`,
          createdAt: new Date().toISOString(),
          read: false
        })
        console.log(`✅ Notification created for budget: ${budgetNotifId}`)
        
        // 🔔 Create notification for CLIENT to validate the budget
        const clientBudgetNotifId = `notif_${Date.now()}_${Math.random().toString(36).substring(7)}`
        const clientBudgetNotification = {
          id: clientBudgetNotifId,
          type: 'budget_validation_required',
          clientEmail: workshopRequest.clientEmail,
          workshopId: workshopRequest.workshopId,
          budgetId: budgetId,
          quoteRequestId: workshopRequest.quoteRequestId,
          serviceName: workshopRequest.serviceName,
          licensePlate: workshopRequest.licensePlate,
          total: total.toFixed(2),
          createdAt: new Date().toISOString(),
          read: false
        }
        await kv.set(`notification:${clientBudgetNotifId}`, clientBudgetNotification)
        console.log(`✅ CLIENT NOTIFICATION created for budget validation: notification:${clientBudgetNotifId} for email: ${workshopRequest.clientEmail}`, clientBudgetNotification)
      }
      
      // Create appointment
      const appointmentId = `apt_${Date.now()}_${Math.random().toString(36).substring(7)}`
      
      const appointment = {
        id: appointmentId,
        workshopId: workshopRequest.workshopId,
        workshopRequestId,
        quoteRequestId: workshopRequest.quoteRequestId,
        budgetId: budgetId, // Link to the auto-created budget
        clientId: clientId,
        vehicleId: vehicleId,
        clientName: workshopRequest.clientName,
        clientEmail: workshopRequest.clientEmail,
        clientPhone: workshopRequest.clientPhone,
        licensePlate: workshopRequest.licensePlate,
        serviceId: workshopRequest.serviceId,
        serviceName: workshopRequest.serviceName,
        date: preferredDate,
        startTime: preferredTime || '09:00',
        notes,
        status: 'scheduled',
        createdAt: new Date().toISOString(),
        source: 'instant_quote'
      }
      
      await kv.set(`appointment:${appointmentId}`, appointment)
      
      // 🔔 Create notification for workshop about new appointment
      const appointmentNotifId = `notif_${Date.now()}_${Math.random().toString(36).substring(7)}`
      await kv.set(`notification:workshop:${workshopRequest.workshopId}:${appointmentNotifId}`, {
        id: appointmentNotifId,
        type: 'appointment_scheduled',
        workshopId: workshopRequest.workshopId,
        appointmentId: appointmentId,
        budgetId: budgetId,
        clientName: workshopRequest.clientName,
        licensePlate: workshopRequest.licensePlate,
        serviceName: workshopRequest.serviceName,
        date: preferredDate,
        time: preferredTime || '09:00',
        message: `Novo agendamento: ${workshopRequest.serviceName} - ${preferredDate} às ${preferredTime || '09:00'}`,
        createdAt: new Date().toISOString(),
        read: false
      })
      console.log(`✅ Notification created for appointment: ${appointmentNotifId}`)
      
      // Update workshop request status
      workshopRequest.status = 'appointment_booked'
      workshopRequest.appointmentId = appointmentId
      workshopRequest.budgetId = budgetId
      workshopRequest.clientId = clientId
      workshopRequest.vehicleId = vehicleId
      await kv.set(`workshop_request:${workshopRequestId}`, workshopRequest)
      
      console.log('✅ Appointment booked:', appointmentId)
      console.log('✅ Integration complete - Client, Vehicle, and Budget created')
      
      return c.json({
        success: true,
        appointment,
        budget,
        clientId,
        vehicleId,
        message: 'Agendamento confirmado e orçamento criado automaticamente'
      })
      
    } catch (error: any) {
      console.error('❌ Error booking appointment:', error)
      return c.json({ error: 'Erro ao agendar: ' + error.message }, 500)
    }
  })
  
  /**
   * GET /agenda/appointments
   * Get appointments for workshop (filtered by date range)
   */
  app.get('/make-server-6971b43c/agenda/appointments', async (c: any) => {
    try {
      const accessToken = c.req.header('Authorization')?.split(' ')[1]
      if (!accessToken) {
        return c.json({ error: 'Unauthorized' }, 401)
      }
      
      const { data: { user }, error } = await supabase.auth.getUser(accessToken)
      if (!user || error) {
        return c.json({ error: 'Invalid token' }, 401)
      }
      
      const userProfile = await kv.get(`user:${user.id}`)
      if (!userProfile?.workshopId) {
        return c.json({ error: 'Workshop ID não encontrado' }, 404)
      }
      
      const workshopId = userProfile.workshopId
      const startDate = c.req.query('startDate')
      const endDate = c.req.query('endDate')
      
      // Get all appointments
      const allAppointments = await kv.getByPrefix('appointment:')
      
      // Filter by workshop
      let appointments = allAppointments.filter((apt: any) => apt.workshopId === workshopId)
      
      // Filter by date range if provided
      if (startDate && endDate) {
        appointments = appointments.filter((apt: any) => 
          apt.date >= startDate && apt.date <= endDate
        )
      }
      
      // Sort by date and time
      appointments.sort((a: any, b: any) => {
        const dateCompare = a.date.localeCompare(b.date)
        if (dateCompare !== 0) return dateCompare
        return (a.startTime || '').localeCompare(b.startTime || '')
      })
      
      console.log(`✅ Found ${appointments.length} appointments for workshop ${workshopId}`)
      
      return c.json({ appointments })
      
    } catch (error: any) {
      console.error('❌ Error fetching appointments:', error)
      return c.json({ error: 'Erro ao carregar agendamentos: ' + error.message }, 500)
    }
  })
  
  /**
   * GET /public/check-availability
   * Check slot availability for a specific date (public endpoint for clients)
   */
  app.get('/make-server-6971b43c/public/check-availability', async (c: any) => {
    try {
      const workshopId = c.req.query('workshopId')
      const date = c.req.query('date')
      
      if (!workshopId || !date) {
        return c.json({ error: 'workshopId and date are required' }, 400)
      }
      
      // Get agenda config for this workshop
      const agendaConfig = await kv.get(`agenda_config:${workshopId}`)
      if (!agendaConfig) {
        return c.json({ 
          available: true, 
          usedSlots: 0, 
          totalSlots: 8,
          alternativeDates: []
        })
      }
      
      // Get all appointments for this workshop on this date
      const allAppointments = await kv.getByPrefix('appointment:')
      const appointmentsOnDate = allAppointments.filter((apt: any) => 
        apt.workshopId === workshopId &&
        apt.date === date &&
        apt.status !== 'cancelled'
      )
      
      const usedSlots = appointmentsOnDate.length
      const totalSlots = agendaConfig.dailySlots || 8
      const available = usedSlots < totalSlots
      
      // If not available, suggest alternative dates (next 14 days with availability)
      const alternativeDates: string[] = []
      if (!available) {
        const startDate = new Date(date)
        startDate.setDate(startDate.getDate() + 1) // Start from next day
        
        for (let i = 0; i < 14 && alternativeDates.length < 5; i++) {
          const checkDate = new Date(startDate)
          checkDate.setDate(checkDate.getDate() + i)
          
          // Skip Sundays
          if (checkDate.getDay() === 0) continue
          
          const checkDateStr = checkDate.toISOString().split('T')[0]
          const appointmentsOnCheckDate = allAppointments.filter((apt: any) => 
            apt.workshopId === workshopId &&
            apt.date === checkDateStr &&
            apt.status !== 'cancelled'
          )
          
          if (appointmentsOnCheckDate.length < totalSlots) {
            alternativeDates.push(checkDateStr)
          }
        }
      }
      
      return c.json({
        available,
        usedSlots,
        totalSlots,
        alternativeDates
      })
      
    } catch (error: any) {
      console.error('❌ Error checking availability:', error)
      return c.json({ error: 'Erro ao verificar disponibilidade: ' + error.message }, 500)
    }
  })
  
  /**
   * POST /agenda/appointments
   * Create new appointment (manual booking by workshop)
   */
  app.post('/make-server-6971b43c/agenda/appointments', async (c: any) => {
    try {
      const accessToken = c.req.header('Authorization')?.split(' ')[1]
      if (!accessToken) {
        return c.json({ error: 'Unauthorized' }, 401)
      }
      
      const { data: { user }, error } = await supabase.auth.getUser(accessToken)
      if (!user || error) {
        return c.json({ error: 'Invalid token' }, 401)
      }
      
      const userProfile = await kv.get(`user:${user.id}`)
      if (!userProfile?.workshopId) {
        return c.json({ error: 'Workshop ID não encontrado' }, 404)
      }
      
      const workshopId = userProfile.workshopId
      const data = await c.req.json()
      
      // Validate required fields
      if (!data.clientName || !data.clientEmail || !data.clientPhone || !data.date || !data.serviceId) {
        return c.json({ error: 'Campos obrigatórios em falta' }, 400)
      }
      
      // Check availability
      const config = await kv.get(`agenda_config:${workshopId}`)
      if (!config) {
        return c.json({ error: 'Configure a agenda primeiro' }, 400)
      }
      
      const allAppointments = await kv.getByPrefix('appointment:')
      const appointmentsOnDate = allAppointments.filter((apt: any) => 
        apt.workshopId === workshopId &&
        apt.date === data.date &&
        apt.status !== 'cancelled'
      )
      
      if (appointmentsOnDate.length >= config.dailySlots) {
        return c.json({ error: 'Não há slots disponíveis para esta data' }, 400)
      }
      
      // Create appointment
      const appointmentId = `apt_${Date.now()}_${Math.random().toString(36).substring(7)}`
      const appointment = {
        id: appointmentId,
        workshopId,
        clientName: data.clientName,
        clientEmail: data.clientEmail,
        clientPhone: data.clientPhone,
        licensePlate: data.licensePlate || '',
        serviceId: data.serviceId,
        serviceName: data.serviceName || '',
        date: data.date,
        startTime: data.startTime || '',
        notes: data.notes || '',
        status: 'scheduled',
        createdAt: new Date().toISOString(),
        createdBy: user.email
      }
      
      await kv.set(`appointment:${appointmentId}`, appointment)
      
      console.log('✅ Manual appointment created:', appointmentId)
      
      return c.json({ appointment })
      
    } catch (error: any) {
      console.error('❌ Error creating appointment:', error)
      return c.json({ error: 'Erro ao criar agendamento: ' + error.message }, 500)
    }
  })
  
  /**
   * PUT /agenda/appointments/:id/status
   * Update appointment status
   */
  app.put('/make-server-6971b43c/agenda/appointments/:id/status', async (c: any) => {
    try {
      const appointmentId = c.req.param('id')
      const { status } = await c.req.json()
      
      const accessToken = c.req.header('Authorization')?.split(' ')[1]
      if (!accessToken) {
        return c.json({ error: 'Unauthorized' }, 401)
      }
      
      const { data: { user }, error } = await supabase.auth.getUser(accessToken)
      if (!user || error) {
        return c.json({ error: 'Invalid token' }, 401)
      }
      
      const appointment = await kv.get(`appointment:${appointmentId}`)
      if (!appointment) {
        return c.json({ error: 'Agendamento não encontrado' }, 404)
      }
      
      const userProfile = await kv.get(`user:${user.id}`)
      if (appointment.workshopId !== userProfile?.workshopId) {
        return c.json({ error: 'Não autorizado' }, 403)
      }
      
      appointment.status = status
      appointment.updatedAt = new Date().toISOString()
      appointment.updatedBy = user.email
      
      await kv.set(`appointment:${appointmentId}`, appointment)
      
      console.log(`✅ Appointment ${appointmentId} status updated to ${status}`)
      
      return c.json({ appointment })
      
    } catch (error: any) {
      console.error('❌ Error updating appointment status:', error)
      return c.json({ error: 'Erro ao atualizar status: ' + error.message }, 500)
    }
  })
  
  /**
   * DELETE /agenda/appointments/:id
   * Delete appointment permanently
   */
  app.delete('/make-server-6971b43c/agenda/appointments/:id', async (c: any) => {
    try {
      const appointmentId = c.req.param('id')
      
      const accessToken = c.req.header('Authorization')?.split(' ')[1]
      if (!accessToken) {
        return c.json({ error: 'Unauthorized' }, 401)
      }
      
      const { data: { user }, error } = await supabase.auth.getUser(accessToken)
      if (!user || error) {
        return c.json({ error: 'Invalid token' }, 401)
      }
      
      const appointment = await kv.get(`appointment:${appointmentId}`)
      if (!appointment) {
        return c.json({ error: 'Agendamento não encontrado' }, 404)
      }
      
      const userProfile = await kv.get(`user:${user.id}`)
      if (appointment.workshopId !== userProfile?.workshopId) {
        return c.json({ error: 'Não autorizado a eliminar este agendamento' }, 403)
      }
      
      // Delete the appointment from KV store
      await kv.del(`appointment:${appointmentId}`)
      
      console.log(`✅ Appointment ${appointmentId} deleted by ${user.email}`)
      
      return c.json({ 
        success: true, 
        message: 'Agendamento eliminado com sucesso',
        appointmentId 
      })
      
    } catch (error: any) {
      console.error('❌ Error deleting appointment:', error)
      return c.json({ error: 'Erro ao eliminar agendamento: ' + error.message }, 500)
    }
  })
  
  /**
   * GET /public/check-availability
   * Public endpoint to check availability for a workshop (for client booking)
   */
  app.get('/make-server-6971b43c/public/check-availability', async (c: any) => {
    try {
      const workshopId = c.req.query('workshopId')
      const date = c.req.query('date')
      
      if (!workshopId || !date) {
        return c.json({ error: 'Parâmetros em falta' }, 400)
      }
      
      const config = await kv.get(`agenda_config:${workshopId}`)
      if (!config) {
        // Default availability if no config
        return c.json({ 
          available: true,
          slots: {
            total: 8,
            used: 0,
            available: 8
          }
        })
      }
      
      // Check if it's a working day
      const dateObj = new Date(date)
      const dayName = dateObj.toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase()
      const dayConfig = config.workingHours[dayName]
      
      if (!dayConfig || !dayConfig.enabled) {
        return c.json({ 
          available: false,
          reason: 'Dia não útil'
        })
      }
      
      // Count appointments on this date
      const allAppointments = await kv.getByPrefix('appointment:')
      const appointmentsOnDate = allAppointments.filter((apt: any) => 
        apt.workshopId === workshopId &&
        apt.date === date &&
        apt.status !== 'cancelled'
      )
      
      const usedSlots = appointmentsOnDate.length
      const availableSlots = config.dailySlots - usedSlots
      
      return c.json({
        available: availableSlots > 0,
        slots: {
          total: config.dailySlots,
          used: usedSlots,
          available: availableSlots
        },
        workingHours: {
          start: dayConfig.start,
          end: dayConfig.end
        }
      })
      
    } catch (error: any) {
      console.error('❌ Error checking public availability:', error)
      return c.json({ error: 'Erro ao verificar disponibilidade: ' + error.message }, 500)
    }
  })
  
  console.log('✅ Quote & Agenda routes configured')
}
