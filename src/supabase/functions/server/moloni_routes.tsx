import { Hono } from 'npm:hono'
import * as kv from './kv_store.tsx'

const moloniRoutes = new Hono()

// Helper function to make MOLONI API requests
async function moloniRequest(endpoint: string, body: any, accessToken?: string) {
  const baseUrl = 'https://api.moloni.pt/v1'
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  }
  
  if (accessToken) {
    headers['Authorization'] = `Bearer ${accessToken}`
  }

  const response = await fetch(`${baseUrl}${endpoint}`, {
    method: 'POST',
    headers,
    body: JSON.stringify(body)
  })

  if (!response.ok) {
    const errorText = await response.text()
    throw new Error(`MOLONI API Error: ${response.status} - ${errorText}`)
  }

  return await response.json()
}

// Get all MOLONI configurations
moloniRoutes.get('/moloni/configs', async (c) => {
  try {
    const configs = await kv.getByPrefix('moloni_config_')
    
    // Enrich with workshop names
    const enrichedConfigs = await Promise.all(
      configs.map(async (config: any) => {
        const workshop = await kv.get(`workshop_${config.value.workshopId}`)
        return {
          ...config.value,
          workshopName: workshop?.value?.name || 'Oficina Desconhecida'
        }
      })
    )

    return c.json({ configs: enrichedConfigs })
  } catch (error: any) {
    console.error('Error fetching MOLONI configs:', error)
    return c.json({ error: error.message }, 500)
  }
})

// Create new MOLONI configuration
moloniRoutes.post('/moloni/configs', async (c) => {
  try {
    const body = await c.req.json()
    const { workshopId, clientId, clientSecret, username, password, isActive } = body

    if (!workshopId || !clientId || !clientSecret) {
      return c.json({ error: 'Campos obrigatórios em falta' }, 400)
    }

    // Check if config already exists for this workshop
    const existingConfigs = await kv.getByPrefix('moloni_config_')
    const existingConfig = existingConfigs.find((c: any) => c.value.workshopId === workshopId)
    
    if (existingConfig) {
      return c.json({ error: 'Já existe uma configuração MOLONI para esta oficina' }, 400)
    }

    const configId = `moloni_config_${crypto.randomUUID()}`
    const config = {
      id: configId,
      workshopId,
      clientId,
      clientSecret,
      username: username || null,
      password: password || null,
      isActive: isActive !== undefined ? isActive : true,
      accessToken: null,
      refreshToken: null,
      tokenExpiresAt: null,
      lastSync: null,
      companyId: null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }

    await kv.set(configId, config)

    return c.json({ config })
  } catch (error: any) {
    console.error('Error creating MOLONI config:', error)
    return c.json({ error: error.message }, 500)
  }
})

// Update MOLONI configuration
moloniRoutes.put('/moloni/configs/:id', async (c) => {
  try {
    const configId = c.req.param('id')
    const body = await c.req.json()
    const { workshopId, clientId, clientSecret, username, password, isActive } = body

    if (!workshopId || !clientId || !clientSecret) {
      return c.json({ error: 'Campos obrigatórios em falta' }, 400)
    }

    const existingConfig = await kv.get(configId)
    if (!existingConfig) {
      return c.json({ error: 'Configuração não encontrada' }, 404)
    }

    const updatedConfig = {
      ...existingConfig.value,
      workshopId,
      clientId,
      clientSecret,
      username: username || null,
      password: password || null,
      isActive: isActive !== undefined ? isActive : existingConfig.value.isActive,
      updatedAt: new Date().toISOString()
    }

    await kv.set(configId, updatedConfig)

    return c.json({ config: updatedConfig })
  } catch (error: any) {
    console.error('Error updating MOLONI config:', error)
    return c.json({ error: error.message }, 500)
  }
})

// Delete MOLONI configuration
moloniRoutes.delete('/moloni/configs/:id', async (c) => {
  try {
    const configId = c.req.param('id')

    const existingConfig = await kv.get(configId)
    if (!existingConfig) {
      return c.json({ error: 'Configuração não encontrada' }, 404)
    }

    await kv.del(configId)

    return c.json({ success: true })
  } catch (error: any) {
    console.error('Error deleting MOLONI config:', error)
    return c.json({ error: error.message }, 500)
  }
})

// Test connection and get access token
moloniRoutes.post('/moloni/test/:id', async (c) => {
  try {
    const configId = c.req.param('id')
    
    const configData = await kv.get(configId)
    if (!configData) {
      return c.json({ error: 'Configuração não encontrada' }, 404)
    }

    const config = configData.value

    // Try to get access token using client credentials
    let tokenData
    try {
      if (config.username && config.password) {
        // Use password grant
        tokenData = await moloniRequest('/grant', {
          grant_type: 'password',
          client_id: config.clientId,
          client_secret: config.clientSecret,
          username: config.username,
          password: config.password
        })
      } else {
        // Use client credentials grant
        tokenData = await moloniRequest('/grant', {
          grant_type: 'client_credentials',
          client_id: config.clientId,
          client_secret: config.clientSecret
        })
      }
    } catch (error: any) {
      return c.json({
        success: false,
        error: `Falha na autenticação: ${error.message}`
      }, 400)
    }

    // Save tokens
    const updatedConfig = {
      ...config,
      accessToken: tokenData.access_token,
      refreshToken: tokenData.refresh_token || null,
      tokenExpiresAt: tokenData.expires_in 
        ? new Date(Date.now() + tokenData.expires_in * 1000).toISOString()
        : null,
      lastSync: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }

    await kv.set(configId, updatedConfig)

    // Try to get companies list
    let companies = []
    try {
      const companiesData = await moloniRequest('/companies/getAll', {
        access_token: tokenData.access_token
      }, tokenData.access_token)
      
      companies = companiesData || []

      // If we got companies, save the first one as default
      if (companies.length > 0) {
        updatedConfig.companyId = companies[0].company_id
        await kv.set(configId, updatedConfig)
      }
    } catch (error: any) {
      console.error('Error fetching companies:', error)
    }

    return c.json({
      success: true,
      accessToken: tokenData.access_token,
      expiresIn: tokenData.expires_in,
      companies: companies
    })
  } catch (error: any) {
    console.error('Error testing MOLONI connection:', error)
    return c.json({
      success: false,
      error: error.message
    }, 500)
  }
})

// Refresh access token
moloniRoutes.post('/moloni/refresh/:id', async (c) => {
  try {
    const configId = c.req.param('id')
    
    const configData = await kv.get(configId)
    if (!configData) {
      return c.json({ error: 'Configuração não encontrada' }, 404)
    }

    const config = configData.value

    if (!config.refreshToken) {
      return c.json({ error: 'Refresh token não disponível' }, 400)
    }

    // Refresh token
    const tokenData = await moloniRequest('/grant', {
      grant_type: 'refresh_token',
      client_id: config.clientId,
      client_secret: config.clientSecret,
      refresh_token: config.refreshToken
    })

    // Update config with new tokens
    const updatedConfig = {
      ...config,
      accessToken: tokenData.access_token,
      refreshToken: tokenData.refresh_token || config.refreshToken,
      tokenExpiresAt: tokenData.expires_in 
        ? new Date(Date.now() + tokenData.expires_in * 1000).toISOString()
        : null,
      updatedAt: new Date().toISOString()
    }

    await kv.set(configId, updatedConfig)

    return c.json({
      success: true,
      accessToken: tokenData.access_token,
      expiresIn: tokenData.expires_in
    })
  } catch (error: any) {
    console.error('Error refreshing MOLONI token:', error)
    return c.json({ error: error.message }, 500)
  }
})

// Get MOLONI config for a specific workshop (for use in workshop app)
moloniRoutes.get('/moloni/workshop/:workshopId', async (c) => {
  try {
    const workshopId = c.req.param('workshopId')
    
    const configs = await kv.getByPrefix('moloni_config_')
    const config = configs.find((c: any) => c.value.workshopId === workshopId && c.value.isActive)

    if (!config) {
      return c.json({ error: 'Configuração MOLONI não encontrada para esta oficina' }, 404)
    }

    // Don't expose sensitive data
    const safeConfig = {
      id: config.value.id,
      workshopId: config.value.workshopId,
      isActive: config.value.isActive,
      hasToken: !!config.value.accessToken,
      tokenExpiresAt: config.value.tokenExpiresAt,
      companyId: config.value.companyId
    }

    return c.json({ config: safeConfig })
  } catch (error: any) {
    console.error('Error fetching workshop MOLONI config:', error)
    return c.json({ error: error.message }, 500)
  }
})

// Proxy MOLONI API requests (for workshop use)
moloniRoutes.post('/moloni/proxy/:workshopId/:endpoint(*)', async (c) => {
  try {
    const workshopId = c.req.param('workshopId')
    const endpoint = c.req.param('endpoint')
    const body = await c.req.json()

    // Get workshop config
    const configs = await kv.getByPrefix('moloni_config_')
    const configData = configs.find((c: any) => c.value.workshopId === workshopId && c.value.isActive)

    if (!configData) {
      return c.json({ error: 'Configuração MOLONI não encontrada' }, 404)
    }

    const config = configData.value

    if (!config.accessToken) {
      return c.json({ error: 'Token de acesso não disponível. Execute o teste de conexão primeiro.' }, 400)
    }

    // Check if token is expired
    if (config.tokenExpiresAt && new Date(config.tokenExpiresAt) < new Date()) {
      return c.json({ error: 'Token expirado. Renove o token primeiro.' }, 401)
    }

    // Add access token to body
    const requestBody = {
      ...body,
      access_token: config.accessToken
    }

    // Make request to MOLONI API
    const result = await moloniRequest(`/${endpoint}`, requestBody, config.accessToken)

    return c.json(result)
  } catch (error: any) {
    console.error('Error proxying MOLONI request:', error)
    return c.json({ error: error.message }, 500)
  }
})

export default moloniRoutes
