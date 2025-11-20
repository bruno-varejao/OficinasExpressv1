import { Hono } from 'npm:hono'
import * as kv from './kv_store.tsx'

export function setupIntegrationRoutes(app: any, requireAuth: any) {
  // ==================== INTEGRATION ROUTES ====================
  // Routes to integrate Budgets, Work Orders, and Service Sheets
  
  // Create Work Order from Budget
  app.post('/make-server-6971b43c/integration/budget-to-workorder', requireAuth, async (c: any) => {
    try {
      console.log('🔗 Creating Work Order from Budget')
      const { budgetId, workshopId: requestWorkshopId } = await c.req.json()
      const workshopId = requestWorkshopId || c.get('workshopId')
      
      if (!budgetId) {
        return c.json({ error: 'Budget ID is required' }, 400)
      }
      
      // Get budget
      const budget = await kv.get(`budget:${budgetId}`)
      if (!budget) {
        console.error('❌ Budget not found:', budgetId)
        return c.json({ error: 'Budget not found' }, 404)
      }
      
      console.log('📋 Budget found:', {
        id: budget.id,
        clientId: budget.clientId,
        vehicleId: budget.vehicleId,
        status: budget.status,
        publicQuoteRequestId: budget.publicQuoteRequestId,
        clientName: budget.clientName,
        clientEmail: budget.clientEmail,
        clientPhone: budget.clientPhone,
        licensePlate: budget.licensePlate,
        vehicleBrand: budget.vehicleBrand,
        vehicleModel: budget.vehicleModel
      })
      
      // Handle budgets from public portal - they need client and vehicle created
      let finalClientId = budget.clientId
      let finalVehicleId = budget.vehicleId
      
      if (budget.publicQuoteRequestId && (!budget.clientId || !budget.vehicleId)) {
        console.log('📋 Budget from public portal - need to create client and/or vehicle')
        console.log('📊 Current budget state:', {
          hasClientId: !!budget.clientId,
          hasVehicleId: !!budget.vehicleId,
          hasClientName: !!budget.clientName,
          hasLicensePlate: !!budget.licensePlate
        })
        
        // If budget doesn't have client/vehicle data, fetch from public_quote
        if ((!budget.clientName || !budget.licensePlate) && budget.publicQuoteRequestId) {
          console.log('📋 Fetching data from public_quote:', budget.publicQuoteRequestId)
          const publicQuote = await kv.get(`public_quote:${budget.publicQuoteRequestId}`)
          
          if (publicQuote) {
            console.log('📋 Public quote found:', {
              clientName: publicQuote.clientName,
              clientEmail: publicQuote.clientEmail,
              clientPhone: publicQuote.clientPhone,
              licensePlate: publicQuote.licensePlate
            })
            
            // Copy data from public quote to budget for processing
            if (!budget.clientName) budget.clientName = publicQuote.clientName
            if (!budget.clientEmail) budget.clientEmail = publicQuote.clientEmail
            if (!budget.clientPhone) budget.clientPhone = publicQuote.clientPhone
            if (!budget.licensePlate) budget.licensePlate = publicQuote.licensePlate
            if (!budget.vehicleBrand) budget.vehicleBrand = publicQuote.vehicleBrand
            if (!budget.vehicleModel) budget.vehicleModel = publicQuote.vehicleModel
            if (!budget.vehicleYear) budget.vehicleYear = publicQuote.vehicleYear
          } else {
            console.error('❌ Public quote not found:', budget.publicQuoteRequestId)
            return c.json({ 
              error: 'Public quote request not found. Cannot create client/vehicle without source data.',
              publicQuoteRequestId: budget.publicQuoteRequestId
            }, 404)
          }
        }
        
        // Create client if not exists
        if (!budget.clientId) {
          if (!budget.clientName) {
            console.error('❌ Cannot create client: clientName is missing from budget')
            return c.json({ 
              error: 'Budget is missing client information (clientName)',
              budgetData: {
                hasClientName: !!budget.clientName,
                hasClientEmail: !!budget.clientEmail,
                hasClientPhone: !!budget.clientPhone
              }
            }, 400)
          }
          
          // Check if client already exists in workshop by email or phone
          const allWorkshopClients = await kv.getByPrefix(`client:${workshopId}:`)
          const existingClient = allWorkshopClients.find(c => 
            c && (
              (budget.clientEmail && c.email && c.email.toLowerCase() === budget.clientEmail.toLowerCase()) ||
              (budget.clientPhone && c.phone === budget.clientPhone)
            )
          )
          
          if (existingClient) {
            console.log('✅ Client already exists in workshop:', existingClient.id)
            finalClientId = existingClient.id
            budget.clientId = existingClient.id
          } else {
            const clientId = `client-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`
            const client = {
              id: clientId,
              name: budget.clientName,
              email: budget.clientEmail || '',
              phone: budget.clientPhone || '',
              nif: '',
              address: '',
              workshopId: workshopId,
              createdAt: new Date().toISOString(),
              createdBy: c.get('userId'),
              fromPublicPortal: true
            }
            
            await kv.set(`client:${workshopId}:${clientId}`, client)
            console.log('✅ Client created:', clientId)
            finalClientId = clientId
            
            // Update budget with clientId
            budget.clientId = clientId
          }
        } else {
          console.log('ℹ️  Budget already has clientId:', budget.clientId)
          finalClientId = budget.clientId
        }
        
        // Create vehicle if not exists
        if (!budget.vehicleId) {
          if (!budget.licensePlate) {
            console.error('❌ Cannot create vehicle: licensePlate is missing from budget')
            return c.json({ 
              error: 'Budget is missing vehicle information (licensePlate)',
              budgetData: {
                hasLicensePlate: !!budget.licensePlate,
                hasVehicleBrand: !!budget.vehicleBrand,
                hasVehicleModel: !!budget.vehicleModel
              }
            }, 400)
          }
          
          // Check if vehicle already exists in workshop by license plate
          const allWorkshopVehicles = await kv.getByPrefix(`vehicle:${workshopId}:`)
          const existingVehicle = allWorkshopVehicles.find(v => 
            v && v.licensePlate && v.licensePlate.toUpperCase() === budget.licensePlate.toUpperCase()
          )
          
          if (existingVehicle) {
            console.log('✅ Vehicle already exists in workshop:', existingVehicle.id)
            finalVehicleId = existingVehicle.id
            budget.vehicleId = existingVehicle.id
            
            // Update vehicle's clientId if it's not set or different
            if (!existingVehicle.clientId || existingVehicle.clientId !== finalClientId) {
              existingVehicle.clientId = finalClientId
              existingVehicle.updatedAt = new Date().toISOString()
              await kv.set(`vehicle:${workshopId}:${existingVehicle.id}`, existingVehicle)
              console.log('✅ Vehicle updated with new client association')
            }
          } else {
            const vehicleId = `vehicle-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`
            const vehicle = {
              id: vehicleId,
              clientId: finalClientId,
              workshopId: workshopId,
              licensePlate: budget.licensePlate.toUpperCase(),
              brand: budget.vehicleBrand || 'N/A',
              model: budget.vehicleModel || 'N/A',
              year: budget.vehicleYear || null,
              vin: '',
              engine: '',
              fuel: '',
              color: '',
              mileage: null,
              registrationDate: null,
              notes: 'Criado automaticamente a partir de orçamento do portal público',
              createdAt: new Date().toISOString(),
              createdBy: c.get('userId'),
              fromPublicPortal: true
            }
            
            await kv.set(`vehicle:${workshopId}:${vehicleId}`, vehicle)
            console.log('✅ Vehicle created:', vehicleId)
            finalVehicleId = vehicleId
            
            // Update budget with vehicleId
            budget.vehicleId = vehicleId
          }
        } else {
          console.log('ℹ️  Budget already has vehicleId:', budget.vehicleId)
          finalVehicleId = budget.vehicleId
        }
        
        // Save updated budget
        await kv.set(`budget:${budgetId}`, budget)
        console.log('✅ Budget updated with clientId and vehicleId')
      }
      
      // Final validation
      if (!finalClientId || !finalVehicleId) {
        console.error('❌ Budget missing required fields after processing:', {
          finalClientId: finalClientId,
          finalVehicleId: finalVehicleId,
          budgetClientId: budget.clientId,
          budgetVehicleId: budget.vehicleId,
          budgetHasPublicQuoteRequestId: !!budget.publicQuoteRequestId,
          budgetClientName: budget.clientName,
          budgetLicensePlate: budget.licensePlate
        })
        return c.json({ 
          error: 'Could not create client or vehicle for this budget. Budget may be missing required data (clientName or licensePlate).',
          details: {
            hasClientId: !!finalClientId,
            hasVehicleId: !!finalVehicleId,
            budgetHasClientName: !!budget.clientName,
            budgetHasLicensePlate: !!budget.licensePlate,
            budgetHasPublicQuoteRequestId: !!budget.publicQuoteRequestId
          }
        }, 400)
      }
      
      // Check if budget is approved
      if (budget.status !== 'approved') {
        return c.json({ error: 'Budget must be approved before creating work order' }, 400)
      }
      
      // Check if work order already exists for this budget
      const allWorkOrders = await kv.getByPrefix('workorder:')
      const existingWorkOrder = allWorkOrders.find((wo: any) => wo.budgetId === budgetId)
      if (existingWorkOrder) {
        console.log('✅ Work Order already exists for budget:', budgetId)
        return c.json(existingWorkOrder)
      }
      
      // Create work order
      const workOrderId = crypto.randomUUID()
      const workOrder = {
        id: workOrderId,
        number: `FO-${Date.now()}`,
        budgetId: budgetId,
        clientId: finalClientId,
        vehicleId: finalVehicleId,
        workshopId: workshopId,
        items: budget.items || [],
        laborHours: budget.laborHours || 0,
        laborRate: budget.laborRate || 25,
        partsTotal: budget.partsTotal || 0,
        laborTotal: budget.laborTotal || 0,
        subtotal: budget.subtotal || 0,
        tax: budget.tax || 0,
        total: budget.total || 0,
        status: 'pending',
        notes: budget.notes || '',
        createdAt: new Date().toISOString(),
        createdBy: c.get('userId'),
        createdFrom: 'budget'
      }
      
      await kv.set(`workorder:${workOrderId}`, workOrder)
      
      // Update budget with work order reference
      await kv.set(`budget:${budgetId}`, {
        ...budget,
        workOrderId: workOrderId,
        updatedAt: new Date().toISOString()
      })
      
      console.log('✅ Work Order created successfully:', workOrderId)
      return c.json(workOrder)
    } catch (error: any) {
      console.error('❌ Error creating work order from budget:', error)
      return c.json({ error: 'Error creating work order: ' + error.message }, 500)
    }
  })
  
  // Create Service Sheet from Work Order
  app.post('/make-server-6971b43c/integration/workorder-to-servicesheet', requireAuth, async (c: any) => {
    try {
      console.log('🔗 Creating Service Sheet from Work Order')
      const { workOrderId, workshopId: requestWorkshopId } = await c.req.json()
      const workshopId = requestWorkshopId || c.get('workshopId')
      
      if (!workOrderId) {
        return c.json({ error: 'Work Order ID is required' }, 400)
      }
      
      // Get work order
      const workOrder = await kv.get(`workorder:${workOrderId}`)
      if (!workOrder) {
        return c.json({ error: 'Work Order not found' }, 404)
      }
      
      // Check if service sheet already exists for this work order
      const allServiceSheets = await kv.getByPrefix('servicesheet:')
      const existingServiceSheet = allServiceSheets.find((ss: any) => ss.workOrderId === workOrderId)
      if (existingServiceSheet) {
        console.log('✅ Service Sheet already exists for work order:', workOrderId)
        return c.json(existingServiceSheet)
      }
      
      // Create service sheet
      const serviceSheetId = crypto.randomUUID()
      
      // Convert work order items to services
      const services = (workOrder.items || []).map((item: any, index: number) => ({
        id: `${serviceSheetId}-${index}`,
        type: 'part' as const,
        category: 'parts',
        description: item.description || '',
        quantity: item.quantity || 1,
        unitPrice: item.price || 0,
        discount: 0,
        total: (item.quantity || 1) * (item.price || 0),
        status: 'pending' as const
      }))
      
      // Add labor as a service if it exists
      if (workOrder.laborHours && workOrder.laborHours > 0) {
        services.push({
          id: `${serviceSheetId}-labor`,
          type: 'labor' as const,
          category: 'labor',
          description: 'Mão de obra',
          quantity: workOrder.laborHours,
          unitPrice: workOrder.laborRate || 25,
          discount: 0,
          total: workOrder.laborHours * (workOrder.laborRate || 25),
          status: 'pending' as const
        })
      }
      
      const serviceSheet = {
        id: serviceSheetId,
        number: `FS-${Date.now()}`,
        workOrderId: workOrderId,
        budgetId: workOrder.budgetId,
        clientId: workOrder.clientId,
        vehicleId: workOrder.vehicleId,
        workshopId: workshopId,
        date: new Date().toISOString(),
        symptoms: '',
        clientObservations: '',
        hasKey: false,
        hasManual: false,
        hasDocuments: false,
        interventionNotes: workOrder.notes || '',
        services: services,
        status: 'reception',
        elapsedTime: 0,
        history: [],
        createdAt: new Date().toISOString(),
        createdBy: c.get('userId'),
        createdFrom: 'workorder'
      }
      
      await kv.set(`servicesheet:${serviceSheetId}`, serviceSheet)
      
      // Update work order with service sheet reference
      await kv.set(`workorder:${workOrderId}`, {
        ...workOrder,
        serviceSheetId: serviceSheetId,
        updatedAt: new Date().toISOString()
      })
      
      console.log('✅ Service Sheet created successfully:', serviceSheetId)
      return c.json(serviceSheet)
    } catch (error: any) {
      console.error('❌ Error creating service sheet from work order:', error)
      return c.json({ error: 'Error creating service sheet: ' + error.message }, 500)
    }
  })
  
  // Create Service Sheet directly from Budget
  app.post('/make-server-6971b43c/integration/budget-to-servicesheet', requireAuth, async (c: any) => {
    try {
      console.log('🔗 Creating Service Sheet from Budget')
      const { budgetId, workshopId: requestWorkshopId } = await c.req.json()
      const workshopId = requestWorkshopId || c.get('workshopId')
      
      if (!budgetId) {
        return c.json({ error: 'Budget ID is required' }, 400)
      }
      
      // Get budget
      const budget = await kv.get(`budget:${budgetId}`)
      if (!budget) {
        return c.json({ error: 'Budget not found' }, 404)
      }
      
      // Create service sheet
      const serviceSheetId = crypto.randomUUID()
      
      // Convert budget items to services
      const services = (budget.items || []).map((item: any, index: number) => ({
        id: `${serviceSheetId}-${index}`,
        type: 'part' as const,
        category: 'parts',
        description: item.description || '',
        quantity: item.quantity || 1,
        unitPrice: item.price || 0,
        discount: 0,
        total: (item.quantity || 1) * (item.price || 0),
        status: 'pending' as const
      }))
      
      // Add labor as a service if it exists
      if (budget.laborHours && budget.laborHours > 0) {
        services.push({
          id: `${serviceSheetId}-labor`,
          type: 'labor' as const,
          category: 'labor',
          description: 'Mão de obra',
          quantity: budget.laborHours,
          unitPrice: budget.laborRate || 25,
          discount: 0,
          total: budget.laborHours * (budget.laborRate || 25),
          status: 'pending' as const
        })
      }
      
      const serviceSheet = {
        id: serviceSheetId,
        number: `FS-${Date.now()}`,
        budgetId: budgetId,
        clientId: budget.clientId,
        vehicleId: budget.vehicleId,
        workshopId: workshopId,
        date: new Date().toISOString(),
        symptoms: '',
        clientObservations: '',
        hasKey: false,
        hasManual: false,
        hasDocuments: false,
        interventionNotes: budget.notes || '',
        services: services,
        status: 'reception',
        elapsedTime: 0,
        history: [],
        createdAt: new Date().toISOString(),
        createdBy: c.get('userId'),
        createdFrom: 'budget'
      }
      
      await kv.set(`servicesheet:${serviceSheetId}`, serviceSheet)
      
      // Update budget with service sheet reference
      await kv.set(`budget:${budgetId}`, {
        ...budget,
        serviceSheetId: serviceSheetId,
        updatedAt: new Date().toISOString()
      })
      
      console.log('✅ Service Sheet created successfully:', serviceSheetId)
      return c.json(serviceSheet)
    } catch (error: any) {
      console.error('❌ Error creating service sheet from budget:', error)
      return c.json({ error: 'Error creating service sheet: ' + error.message }, 500)
    }
  })
  
  // Get Work Order by Budget ID
  app.get('/make-server-6971b43c/integration/workorder-by-budget/:budgetId', requireAuth, async (c: any) => {
    try {
      const budgetId = c.req.param('budgetId')
      const allWorkOrders = await kv.getByPrefix('workorder:')
      const workOrder = allWorkOrders.find((wo: any) => wo.budgetId === budgetId)
      
      if (!workOrder) {
        return c.json({ error: 'Work Order not found' }, 404)
      }
      
      return c.json(workOrder)
    } catch (error: any) {
      console.error('❌ Error fetching work order:', error)
      return c.json({ error: 'Error fetching work order: ' + error.message }, 500)
    }
  })
  
  // Get Service Sheet by Work Order ID
  app.get('/make-server-6971b43c/integration/servicesheet-by-workorder/:workOrderId', requireAuth, async (c: any) => {
    try {
      const workOrderId = c.req.param('workOrderId')
      const allServiceSheets = await kv.getByPrefix('servicesheet:')
      const serviceSheet = allServiceSheets.find((ss: any) => ss.workOrderId === workOrderId)
      
      if (!serviceSheet) {
        return c.json({ error: 'Service Sheet not found' }, 404)
      }
      
      return c.json(serviceSheet)
    } catch (error: any) {
      console.error('❌ Error fetching service sheet:', error)
      return c.json({ error: 'Error fetching service sheet: ' + error.message }, 500)
    }
  })
  
  // Get Budget by Work Order ID
  app.get('/make-server-6971b43c/integration/budget-by-workorder/:workOrderId', requireAuth, async (c: any) => {
    try {
      const workOrderId = c.req.param('workOrderId')
      const workOrder = await kv.get(`workorder:${workOrderId}`)
      
      if (!workOrder || !workOrder.budgetId) {
        return c.json({ error: 'Budget not found' }, 404)
      }
      
      const budget = await kv.get(`budget:${workOrder.budgetId}`)
      if (!budget) {
        return c.json({ error: 'Budget not found' }, 404)
      }
      
      return c.json(budget)
    } catch (error: any) {
      console.error('❌ Error fetching budget:', error)
      return c.json({ error: 'Error fetching budget: ' + error.message }, 500)
    }
  })
  
  // ==================== SERVICE SHEETS CRUD ROUTES ====================
  
  // Get All Service Sheets
  app.get('/make-server-6971b43c/servicesheets', requireAuth, async (c: any) => {
    try {
      const workshopId = c.get('workshopId')
      const allServiceSheets = await kv.getByPrefix('servicesheet:')
      const serviceSheets = allServiceSheets.filter((item: any) => item && item.workshopId === workshopId)
      return c.json({ serviceSheets })
    } catch (error: any) {
      console.error('Error fetching service sheets:', error)
      return c.json({ error: 'Error fetching service sheets' }, 500)
    }
  })
  
  // Create Service Sheet
  app.post('/make-server-6971b43c/servicesheets', requireAuth, async (c: any) => {
    try {
      const data = await c.req.json()
      const workshopId = c.get('workshopId')
      
      if (!data.vehicleId || !data.clientId) {
        return c.json({ error: 'Vehicle ID and Client ID are required' }, 400)
      }
      
      const serviceSheetId = crypto.randomUUID()
      const serviceSheet = {
        id: serviceSheetId,
        number: `FS-${Date.now()}`,
        ...data,
        workshopId,
        createdAt: new Date().toISOString(),
        createdBy: c.get('userId')
      }
      
      await kv.set(`servicesheet:${serviceSheetId}`, serviceSheet)
      return c.json({ success: true, serviceSheet })
    } catch (error: any) {
      console.error('Error creating service sheet:', error)
      return c.json({ error: 'Error creating service sheet' }, 500)
    }
  })
  
  // Update Service Sheet
  app.put('/make-server-6971b43c/servicesheets/:id', requireAuth, async (c: any) => {
    try {
      const serviceSheetId = c.req.param('id')
      const updates = await c.req.json()
      
      const existingServiceSheet = await kv.get(`servicesheet:${serviceSheetId}`)
      if (!existingServiceSheet) {
        return c.json({ error: 'Service Sheet not found' }, 404)
      }
      
      const updatedServiceSheet = {
        ...existingServiceSheet,
        ...updates,
        updatedAt: new Date().toISOString(),
        updatedBy: c.get('userId')
      }
      
      await kv.set(`servicesheet:${serviceSheetId}`, updatedServiceSheet)
      return c.json({ success: true, serviceSheet: updatedServiceSheet })
    } catch (error: any) {
      console.error('Error updating service sheet:', error)
      return c.json({ error: 'Error updating service sheet' }, 500)
    }
  })
  
  // Delete Service Sheet
  app.delete('/make-server-6971b43c/servicesheets/:id', requireAuth, async (c: any) => {
    try {
      const serviceSheetId = c.req.param('id')
      
      const serviceSheet = await kv.get(`servicesheet:${serviceSheetId}`)
      if (!serviceSheet) {
        return c.json({ error: 'Service Sheet not found' }, 404)
      }
      
      await kv.del(`servicesheet:${serviceSheetId}`)
      return c.json({ success: true })
    } catch (error: any) {
      console.error('Error deleting service sheet:', error)
      return c.json({ error: 'Error deleting service sheet' }, 500)
    }
  })
  
  // ==================== WORK ORDERS CRUD ROUTES ====================
  
  // Get All Work Orders
  app.get('/make-server-6971b43c/workorders', requireAuth, async (c: any) => {
    try {
      const workshopId = c.get('workshopId')
      const allWorkOrders = await kv.getByPrefix('workorder:')
      const workOrders = allWorkOrders.filter((item: any) => item && item.workshopId === workshopId)
      return c.json({ workOrders })
    } catch (error: any) {
      console.error('Error fetching work orders:', error)
      return c.json({ error: 'Error fetching work orders' }, 500)
    }
  })
  
  // Create Work Order
  app.post('/make-server-6971b43c/workorders', requireAuth, async (c: any) => {
    try {
      const data = await c.req.json()
      const workshopId = c.get('workshopId')
      
      if (!data.vehicleId || !data.clientId) {
        return c.json({ error: 'Vehicle ID and Client ID are required' }, 400)
      }
      
      const workOrderId = crypto.randomUUID()
      const workOrder = {
        id: workOrderId,
        number: `FO-${Date.now()}`,
        ...data,
        workshopId,
        status: data.status || 'pending',
        createdAt: new Date().toISOString(),
        createdBy: c.get('userId')
      }
      
      await kv.set(`workorder:${workOrderId}`, workOrder)
      return c.json({ success: true, workOrder })
    } catch (error: any) {
      console.error('Error creating work order:', error)
      return c.json({ error: 'Error creating work order' }, 500)
    }
  })
  
  // Update Work Order
  app.put('/make-server-6971b43c/workorders/:id', requireAuth, async (c: any) => {
    try {
      const workOrderId = c.req.param('id')
      const updates = await c.req.json()
      
      const existingWorkOrder = await kv.get(`workorder:${workOrderId}`)
      if (!existingWorkOrder) {
        return c.json({ error: 'Work Order not found' }, 404)
      }
      
      const updatedWorkOrder = {
        ...existingWorkOrder,
        ...updates,
        updatedAt: new Date().toISOString(),
        updatedBy: c.get('userId')
      }
      
      await kv.set(`workorder:${workOrderId}`, updatedWorkOrder)
      
      // Sync items with associated Budget if exists and items were updated
      if (existingWorkOrder.budgetId && updates.items) {
        console.log('🔄 Syncing WorkOrder items to Budget:', existingWorkOrder.budgetId)
        try {
          const budget = await kv.get(`budget:${existingWorkOrder.budgetId}`)
          if (budget) {
            const updatedBudget = {
              ...budget,
              items: updates.items,
              subtotal: updates.subtotal,
              tax: updates.tax,
              total: updates.total,
              updatedAt: new Date().toISOString(),
              syncedFromWorkOrder: true
            }
            await kv.set(`budget:${existingWorkOrder.budgetId}`, updatedBudget)
            console.log('✅ Budget synced successfully')
          }
        } catch (syncError: any) {
          console.error('⚠️ Error syncing to budget:', syncError)
          // Don't fail the request if sync fails
        }
      }
      
      return c.json({ success: true, workOrder: updatedWorkOrder })
    } catch (error: any) {
      console.error('Error updating work order:', error)
      return c.json({ error: 'Error updating work order' }, 500)
    }
  })
  
  // Delete Work Order
  app.delete('/make-server-6971b43c/workorders/:id', requireAuth, async (c: any) => {
    try {
      const workOrderId = c.req.param('id')
      
      const workOrder = await kv.get(`workorder:${workOrderId}`)
      if (!workOrder) {
        return c.json({ error: 'Work Order not found' }, 404)
      }
      
      await kv.del(`workorder:${workOrderId}`)
      return c.json({ success: true })
    } catch (error: any) {
      console.error('Error deleting work order:', error)
      return c.json({ error: 'Error deleting work order' }, 500)
    }
  })
  
  // ==================== LABOR TYPES ROUTES ====================
  
  // Get All Labor Types
  app.get('/make-server-6971b43c/labor-types', requireAuth, async (c: any) => {
    try {
      const workshopId = c.get('workshopId')
      const allLaborTypes = await kv.getByPrefix('labortype:')
      const laborTypes = allLaborTypes.filter((item: any) => item && item.workshopId === workshopId)
      return c.json({ laborTypes })
    } catch (error: any) {
      console.error('Error fetching labor types:', error)
      return c.json({ error: 'Error fetching labor types' }, 500)
    }
  })
  
  // Create Labor Type
  app.post('/make-server-6971b43c/labor-types', requireAuth, async (c: any) => {
    try {
      const data = await c.req.json()
      const workshopId = c.get('workshopId')
      
      if (!data.name || !data.hourlyRate) {
        return c.json({ error: 'Name and hourly rate are required' }, 400)
      }
      
      const laborTypeId = crypto.randomUUID()
      const laborType = {
        id: laborTypeId,
        ...data,
        workshopId,
        isActive: true,
        createdAt: new Date().toISOString(),
        createdBy: c.get('userId')
      }
      
      await kv.set(`labortype:${laborTypeId}`, laborType)
      return c.json({ success: true, laborType })
    } catch (error: any) {
      console.error('Error creating labor type:', error)
      return c.json({ error: 'Error creating labor type' }, 500)
    }
  })
  
  // Update Labor Type
  app.put('/make-server-6971b43c/labor-types/:id', requireAuth, async (c: any) => {
    try {
      const laborTypeId = c.req.param('id')
      const updates = await c.req.json()
      
      const existingLaborType = await kv.get(`labortype:${laborTypeId}`)
      if (!existingLaborType) {
        return c.json({ error: 'Labor type not found' }, 404)
      }
      
      const updatedLaborType = {
        ...existingLaborType,
        ...updates,
        updatedAt: new Date().toISOString(),
        updatedBy: c.get('userId')
      }
      
      await kv.set(`labortype:${laborTypeId}`, updatedLaborType)
      return c.json({ success: true, laborType: updatedLaborType })
    } catch (error: any) {
      console.error('Error updating labor type:', error)
      return c.json({ error: 'Error updating labor type' }, 500)
    }
  })
  
  // Delete Labor Type
  app.delete('/make-server-6971b43c/labor-types/:id', requireAuth, async (c: any) => {
    try {
      const laborTypeId = c.req.param('id')
      
      const laborType = await kv.get(`labortype:${laborTypeId}`)
      if (!laborType) {
        return c.json({ error: 'Labor type not found' }, 404)
      }
      
      await kv.del(`labortype:${laborTypeId}`)
      return c.json({ success: true })
    } catch (error: any) {
      console.error('Error deleting labor type:', error)
      return c.json({ error: 'Error deleting labor type' }, 500)
    }
  })
  
  // ==================== EMPLOYEES ROUTES ====================
  
  // Get All Employees
  app.get('/make-server-6971b43c/employees', requireAuth, async (c: any) => {
    try {
      const workshopId = c.get('workshopId')
      const allEmployees = await kv.getByPrefix('employee:')
      const employees = allEmployees.filter((item: any) => item && item.workshopId === workshopId)
      return c.json({ employees })
    } catch (error: any) {
      console.error('Error fetching employees:', error)
      return c.json({ error: 'Error fetching employees' }, 500)
    }
  })
  
  // Create Employee
  app.post('/make-server-6971b43c/employees', requireAuth, async (c: any) => {
    try {
      const data = await c.req.json()
      const workshopId = c.get('workshopId')
      
      if (!data.name || !data.position) {
        return c.json({ error: 'Name and position are required' }, 400)
      }
      
      const employeeId = crypto.randomUUID()
      const employee = {
        id: employeeId,
        ...data,
        workshopId,
        isActive: true,
        createdAt: new Date().toISOString(),
        createdBy: c.get('userId')
      }
      
      await kv.set(`employee:${employeeId}`, employee)
      return c.json({ success: true, employee })
    } catch (error: any) {
      console.error('Error creating employee:', error)
      return c.json({ error: 'Error creating employee' }, 500)
    }
  })
  
  // Update Employee
  app.put('/make-server-6971b43c/employees/:id', requireAuth, async (c: any) => {
    try {
      const employeeId = c.req.param('id')
      const updates = await c.req.json()
      
      const existingEmployee = await kv.get(`employee:${employeeId}`)
      if (!existingEmployee) {
        return c.json({ error: 'Employee not found' }, 404)
      }
      
      const updatedEmployee = {
        ...existingEmployee,
        ...updates,
        updatedAt: new Date().toISOString(),
        updatedBy: c.get('userId')
      }
      
      await kv.set(`employee:${employeeId}`, updatedEmployee)
      return c.json({ success: true, employee: updatedEmployee })
    } catch (error: any) {
      console.error('Error updating employee:', error)
      return c.json({ error: 'Error updating employee' }, 500)
    }
  })
  
  // Delete Employee
  app.delete('/make-server-6971b43c/employees/:id', requireAuth, async (c: any) => {
    try {
      const employeeId = c.req.param('id')
      
      const employee = await kv.get(`employee:${employeeId}`)
      if (!employee) {
        return c.json({ error: 'Employee not found' }, 404)
      }
      
      await kv.del(`employee:${employeeId}`)
      return c.json({ success: true })
    } catch (error: any) {
      console.error('Error deleting employee:', error)
      return c.json({ error: 'Error deleting employee' }, 500)
    }
  })
  
  // ==================== ALIAS ROUTES FOR service-sheets (with hyphen) ====================
  // These routes are aliases to maintain compatibility with frontend code that uses hyphens
  
  // Create Service Sheet (with hyphen)
  app.post('/make-server-6971b43c/service-sheets', requireAuth, async (c: any) => {
    try {
      const data = await c.req.json()
      const workshopId = c.get('workshopId')
      
      console.log('📝 Creating service sheet (hyphen route):', {
        workOrderId: data.workOrderId,
        vehicleId: data.vehicleId,
        clientId: data.clientId,
        status: data.status
      })
      
      if (!data.vehicleId || !data.clientId) {
        return c.json({ error: 'Vehicle ID and Client ID are required' }, 400)
      }
      
      const serviceSheetId = crypto.randomUUID()
      const serviceSheet = {
        id: serviceSheetId,
        number: `FS-${Date.now()}`,
        ...data,
        workshopId,
        services: data.services || [],
        history: [],
        createdAt: new Date().toISOString(),
        createdBy: c.get('userId')
      }
      
      await kv.set(`servicesheet:${serviceSheetId}`, serviceSheet)
      console.log('✅ Service sheet created:', serviceSheetId)
      return c.json({ success: true, serviceSheet })
    } catch (error: any) {
      console.error('Error creating service sheet:', error)
      return c.json({ error: 'Error creating service sheet: ' + error.message }, 500)
    }
  })
  
  // Update Service Sheet (with hyphen)
  app.put('/make-server-6971b43c/service-sheets/:id', requireAuth, async (c: any) => {
    try {
      const serviceSheetId = c.req.param('id')
      const updates = await c.req.json()
      
      console.log('🔄 Updating service sheet (hyphen route):', {
        serviceSheetId,
        updates
      })
      
      const existingServiceSheet = await kv.get(`servicesheet:${serviceSheetId}`)
      if (!existingServiceSheet) {
        console.error('❌ Service Sheet not found:', serviceSheetId)
        return c.json({ error: 'Service Sheet not found' }, 404)
      }
      
      const updatedServiceSheet = {
        ...existingServiceSheet,
        ...updates,
        updatedAt: new Date().toISOString(),
        updatedBy: c.get('userId')
      }
      
      await kv.set(`servicesheet:${serviceSheetId}`, updatedServiceSheet)
      console.log('✅ Service sheet updated:', serviceSheetId)
      return c.json({ success: true, serviceSheet: updatedServiceSheet })
    } catch (error: any) {
      console.error('Error updating service sheet:', error)
      return c.json({ error: 'Error updating service sheet: ' + error.message }, 500)
    }
  })
  
  // Get Service Sheet by ID (with hyphen)
  app.get('/make-server-6971b43c/service-sheets/:id', requireAuth, async (c: any) => {
    try {
      const serviceSheetId = c.req.param('id')
      
      const serviceSheet = await kv.get(`servicesheet:${serviceSheetId}`)
      if (!serviceSheet) {
        return c.json({ error: 'Service Sheet not found' }, 404)
      }
      
      return c.json({ serviceSheet })
    } catch (error: any) {
      console.error('Error fetching service sheet:', error)
      return c.json({ error: 'Error fetching service sheet: ' + error.message }, 500)
    }
  })
}