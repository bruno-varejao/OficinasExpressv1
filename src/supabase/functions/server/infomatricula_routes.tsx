import { Hono } from 'npm:hono'
import * as kv from './kv_store.tsx'
import { decodeVin, testVinDecoderApi, isVinDecoderConfigured, VinDecoderData } from './vin_decoder.tsx'

const app = new Hono()

// Firebase configuration for InfoMatricula.pt
const FIREBASE_API_KEY = 'AIzaSyC0ToM3KDiIgN_cvvRQNmS_0v9a3_oZM9Q'
const FIREBASE_PROJECT_ID = 'infomatricula-login'
const INFOMATRICULA_API = 'https://api.infomatricula.pt/informacao/fetch'

interface FirebaseAuthResponse {
  idToken: string
  refreshToken: string
  expiresIn: string
}

interface VehicleData {
  plate: string
  vin: string
  make: string
  model: string
  version?: string
  plateDate?: string
  color?: string
  mixture?: string
  driveType?: string
  bodyType?: string
  valves?: string
  markFrom?: string
  fuelType?: string
  powercv?: string
  powerkw?: string
  cubicCap?: string
  categoryType?: string
  co2?: string
  ownerType?: string
  ownerCategory?: string
  categoryIUC?: string
  isImported?: string
  searchedAt?: string
  // VIN Decoder fields
  AWN_k_type?: string
  AWN_code_moteur?: string
  AWN_url_image?: string
  AWN_annee_de_debut_modele?: string
  AWN_annee_de_fin_modele?: string
  AWN_model_image?: string
}

/**
 * Format Portuguese license plate to correct format
 * Examples:
 * - AA00BB -> AA-00-BB
 * - AA 00 BB -> AA-00-BB
 * - aa00bb -> AA-00-BB
 * - 00-00-XX -> 00-00-XX
 */
function formatPlate(plate: string): string {
  // Remove all spaces, hyphens, and convert to uppercase
  let cleaned = plate.trim().toUpperCase().replace(/[\s\-]/g, '')
  
  // Portuguese plates are 6 characters (without hyphens)
  if (cleaned.length !== 6) {
    console.log(`⚠️ Invalid plate length: ${cleaned.length} (expected 6)`)
    return plate // Return original if invalid length
  }
  
  // Format as XX-XX-XX (2-2-2 pattern)
  const formatted = `${cleaned.substring(0, 2)}-${cleaned.substring(2, 4)}-${cleaned.substring(4, 6)}`
  console.log(`📝 Formatted plate: ${plate} -> ${formatted}`)
  
  return formatted
}

/**
 * Get Firebase Anonymous Authentication Token
 */
async function getFirebaseToken(): Promise<string> {
  console.log('🔑 Obtaining Firebase anonymous token...')
  
  try {
    const response = await fetch(
      `https://identitytoolkit.googleapis.com/v1/accounts:signUp?key=${FIREBASE_API_KEY}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          returnSecureToken: true,
        }),
      }
    )

    if (!response.ok) {
      const errorText = await response.text()
      console.error('❌ Firebase auth error:', errorText)
      throw new Error(`Firebase authentication failed: ${errorText}`)
    }

    const data: FirebaseAuthResponse = await response.json()
    console.log('✅ Firebase token obtained successfully')
    return data.idToken
  } catch (error) {
    console.error('❌ Error getting Firebase token:', error)
    throw error
  }
}

/**
 * Search vehicle by plate using InfoMatricula API
 */
async function searchVehicleByPlate(plate: string): Promise<VehicleData> {
  console.log(`🔍 Searching vehicle for plate: ${plate}`)
  console.log(`   Plate length: ${plate.length}`)
  console.log(`   Plate format check: ${/^[A-Z0-9]{2}-[A-Z0-9]{2}-[A-Z0-9]{2,4}$/.test(plate) ? 'VALID' : 'INVALID'}`)
  
  // Get Firebase token
  const firebaseToken = await getFirebaseToken()
  
  // Build the request URL
  const requestUrl = `${INFOMATRICULA_API}?plate=${plate}`
  console.log(`📡 Request URL: ${requestUrl}`)
  
  // Call InfoMatricula API
  const response = await fetch(
    requestUrl,
    {
      headers: {
        'Authorization': `Bearer ${firebaseToken}`,
        'Accept': 'application/json',
        'Origin': 'https://infomatricula.pt',
      },
    }
  )

  console.log(`📥 Response status: ${response.status}`)
  const responseText = await response.text()
  console.log(`📥 Response body: ${responseText}`)

  if (!response.ok) {
    console.error('❌ InfoMatricula API error:', responseText)
    
    if (response.status === 404) {
      throw new Error('Matrícula não encontrada')
    }
    
    throw new Error(`Erro ao consultar matrícula: ${response.status} - ${responseText}`)
  }

  const vehicleData: VehicleData = JSON.parse(responseText)
  console.log('✅ Vehicle data retrieved:', vehicleData)
  
  // Decode VIN if available
  if (vehicleData.vin) {
    console.log('🔍 VIN encontrado, iniciando descodificação automática:', vehicleData.vin)
    const vinData = await decodeVin(vehicleData.vin)
    console.log('📦 Dados VIN Decoder recebidos:', vinData)
    Object.assign(vehicleData, vinData)
    console.log('✅ Dados VIN Decoder adicionados ao veículo')
  } else {
    console.log('⚠️ Nenhum VIN disponível para descodificação')
  }
  
  return vehicleData
}

/**
 * Save vehicle data to database
 */
async function saveVehicleToDatabase(vehicleData: VehicleData): Promise<void> {
  console.log(`💾 Saving vehicle to database: ${vehicleData.plate}`)
  
  // Add timestamp
  const dataWithTimestamp = {
    ...vehicleData,
    searchedAt: new Date().toISOString(),
  }
  
  // Save to KV store with key: vehicle:plate:{plate}
  const key = `vehicle:plate:${vehicleData.plate}`
  await kv.set(key, dataWithTimestamp)
  
  // Update history list (store list of plates searched)
  const historyKey = 'vehicle:history'
  const existingHistory = await kv.get(historyKey) || []
  
  // Add plate to history if not already present
  if (!existingHistory.includes(vehicleData.plate)) {
    existingHistory.unshift(vehicleData.plate) // Add to beginning
    await kv.set(historyKey, existingHistory)
  }
  
  console.log('✅ Vehicle saved to database')
}

/**
 * Route: Search vehicle by plate
 * GET /infomatricula/search?plate=AA-00-BB
 */
app.get('/search', async (c) => {
  const plate = c.req.query('plate')
  
  if (!plate) {
    return c.json({ error: 'Parâmetro "plate" é obrigatório' }, 400)
  }

  try {
    console.log(`\n🚗 === Search Request for Plate: ${plate} ===`)
    
    // Format the plate to ensure correct format
    const formattedPlate = formatPlate(plate)
    console.log(`📝 Using formatted plate: ${formattedPlate}`)
    
    // Check if vehicle already exists in database
    const existingKey = `vehicle:plate:${formattedPlate}`
    const existingData = await kv.get(existingKey)
    
    if (existingData) {
      console.log('✅ Vehicle found in database cache')
      return c.json(existingData)
    }
    
    // If not in cache, search via InfoMatricula API
    console.log('🌐 Vehicle not in cache, searching via InfoMatricula API...')
    
    try {
      const vehicleData = await searchVehicleByPlate(formattedPlate)
      
      // Save to database
      await saveVehicleToDatabase(vehicleData)
      
      console.log('✅ === Search completed successfully ===\n')
      return c.json(vehicleData)
    } catch (apiError) {
      // If API returns error, return a graceful response
      // This allows the system to continue working even if InfoMatricula API fails
      console.log('⚠️ InfoMatricula API returned error, returning minimal data')
      
      const minimalData = {
        plate: formattedPlate,
        error: 'Dados não disponíveis',
        message: apiError instanceof Error ? apiError.message : 'Erro ao consultar InfoMatricula'
      }
      
      return c.json(minimalData, 404)
    }
    
  } catch (error) {
    console.error('❌ Error in search route:', error)
    return c.json({ 
      error: error instanceof Error ? error.message : 'Erro ao consultar matrícula'
    }, 500)
  }
})

/**
 * Route: Get search history
 * GET /infomatricula/history
 */
app.get('/history', async (c) => {
  try {
    console.log('📜 Retrieving search history...')
    
    // Get list of searched plates
    const historyKey = 'vehicle:history'
    const plateList: string[] = await kv.get(historyKey) || []
    
    if (plateList.length === 0) {
      return c.json({ history: [] })
    }
    
    // Get full data for each plate
    const vehicleKeys = plateList.map(plate => `vehicle:plate:${plate}`)
    const vehiclesData = await kv.mget(vehicleKeys)
    
    // Filter out any null values and sort by searchedAt (most recent first)
    const history = vehiclesData
      .filter((v): v is VehicleData => v !== null)
      .sort((a, b) => {
        const dateA = a.searchedAt ? new Date(a.searchedAt).getTime() : 0
        const dateB = b.searchedAt ? new Date(b.searchedAt).getTime() : 0
        return dateB - dateA
      })
    
    console.log(`✅ Retrieved ${history.length} vehicles from history`)
    return c.json({ history })
    
  } catch (error) {
    console.error('❌ Error retrieving history:', error)
    return c.json({ 
      error: 'Erro ao obter histórico',
      history: []
    }, 500)
  }
})

/**
 * Route: Delete vehicle from history
 * DELETE /infomatricula/history/:plate
 */
app.delete('/history/:plate', async (c) => {
  const plate = c.req.param('plate')
  
  try {
    console.log(`🗑️ Deleting vehicle from history: ${plate}`)
    
    // Delete vehicle data
    const vehicleKey = `vehicle:plate:${plate}`
    await kv.del(vehicleKey)
    
    // Remove from history list
    const historyKey = 'vehicle:history'
    const plateList: string[] = await kv.get(historyKey) || []
    const updatedList = plateList.filter(p => p !== plate)
    await kv.set(historyKey, updatedList)
    
    console.log('✅ Vehicle deleted from history')
    return c.json({ success: true, message: 'Veículo eliminado com sucesso' })
    
  } catch (error) {
    console.error('❌ Error deleting vehicle:', error)
    return c.json({ 
      error: 'Erro ao eliminar veículo'
    }, 500)
  }
})

/**
 * Route: Get vehicle details by plate
 * GET /infomatricula/vehicle/:plate
 */
app.get('/vehicle/:plate', async (c) => {
  const plate = c.req.param('plate')
  
  try {
    const vehicleKey = `vehicle:plate:${plate}`
    const vehicleData = await kv.get(vehicleKey)
    
    if (!vehicleData) {
      return c.json({ error: 'Veículo não encontrado na base de dados' }, 404)
    }
    
    return c.json(vehicleData)
    
  } catch (error) {
    console.error('❌ Error getting vehicle:', error)
    return c.json({ 
      error: 'Erro ao obter dados do veículo'
    }, 500)
  }
})

/**
 * Route: Clear all history (admin only)
 * DELETE /infomatricula/history
 */
app.delete('/history', async (c) => {
  try {
    console.log('🗑️ Clearing all vehicle history...')
    
    // Get all plates
    const historyKey = 'vehicle:history'
    const plateList: string[] = await kv.get(historyKey) || []
    
    // Delete all vehicle data
    const vehicleKeys = plateList.map(plate => `vehicle:plate:${plate}`)
    if (vehicleKeys.length > 0) {
      await kv.mdel(vehicleKeys)
    }
    
    // Clear history list
    await kv.del(historyKey)
    
    console.log(`✅ Cleared ${plateList.length} vehicles from history`)
    return c.json({ 
      success: true, 
      message: `${plateList.length} veículos eliminados com sucesso` 
    })
    
  } catch (error) {
    console.error('❌ Error clearing history:', error)
    return c.json({ 
      error: 'Erro ao limpar histórico'
    }, 500)
  }
})

/**
 * Route: Get statistics
 * GET /infomatricula/stats
 */
app.get('/stats', async (c) => {
  try {
    const historyKey = 'vehicle:history'
    const plateList: string[] = await kv.get(historyKey) || []
    
    // Get all vehicle data
    if (plateList.length === 0) {
      return c.json({
        totalSearches: 0,
        uniqueVehicles: 0,
        byMake: {},
        byFuelType: {},
        byYear: {},
      })
    }
    
    const vehicleKeys = plateList.map(plate => `vehicle:plate:${plate}`)
    const vehicles = await kv.mget(vehicleKeys)
    const validVehicles = vehicles.filter((v): v is VehicleData => v !== null)
    
    // Calculate statistics
    const byMake: Record<string, number> = {}
    const byFuelType: Record<string, number> = {}
    const byYear: Record<string, number> = {}
    
    validVehicles.forEach(vehicle => {
      // By make
      if (vehicle.make) {
        byMake[vehicle.make] = (byMake[vehicle.make] || 0) + 1
      }
      
      // By fuel type
      if (vehicle.fuelType) {
        byFuelType[vehicle.fuelType] = (byFuelType[vehicle.fuelType] || 0) + 1
      }
      
      // By year
      if (vehicle.markFrom) {
        byYear[vehicle.markFrom] = (byYear[vehicle.markFrom] || 0) + 1
      }
    })
    
    return c.json({
      totalSearches: validVehicles.length,
      uniqueVehicles: plateList.length,
      byMake,
      byFuelType,
      byYear,
    })
    
  } catch (error) {
    console.error('❌ Error getting stats:', error)
    return c.json({ 
      error: 'Erro ao obter estatísticas'
    }, 500)
  }
})

/**
 * Route: Test with a known valid plate
 * GET /infomatricula/test
 */
app.get('/test', async (c) => {
  try {
    console.log('🧪 Testing InfoMatricula API with known valid plate...')
    
    // Test with a commonly used test plate format
    const testPlate = '00-AA-00'
    console.log(`Testing with plate: ${testPlate}`)
    
    const firebaseToken = await getFirebaseToken()
    console.log('✅ Firebase token obtained')
    
    const requestUrl = `${INFOMATRICULA_API}?plate=${testPlate}`
    console.log(`📡 Request URL: ${requestUrl}`)
    
    const response = await fetch(requestUrl, {
      headers: {
        'Authorization': `Bearer ${firebaseToken}`,
        'Accept': 'application/json',
        'Origin': 'https://infomatricula.pt',
      },
    })
    
    const responseText = await response.text()
    
    return c.json({
      testPlate,
      status: response.status,
      statusText: response.statusText,
      headers: Object.fromEntries(response.headers.entries()),
      body: responseText,
      parsedBody: response.ok ? JSON.parse(responseText) : null
    })
    
  } catch (error) {
    console.error('❌ Test error:', error)
    return c.json({ 
      error: error instanceof Error ? error.message : 'Test failed',
      stack: error instanceof Error ? error.stack : undefined
    }, 500)
  }
})

/**
 * Route: Decode VIN independently
 * GET /infomatricula/decode-vin?vin=WVWZZZ3BZXP012345
 */
app.get('/decode-vin', async (c) => {
  const vin = c.req.query('vin')
  
  if (!vin) {
    return c.json({ error: 'Parâmetro "vin" é obrigatório' }, 400)
  }
  
  try {
    console.log(`\n🔍 === VIN Decode Request: ${vin} ===`)
    
    const vinData = await decodeVin(vin)
    
    if (Object.keys(vinData).length === 0) {
      return c.json({ 
        error: 'Não foi possível descodificar o VIN',
        message: 'O serviço de descodificação VIN pode não estar configurado ou o VIN não foi encontrado'
      }, 404)
    }
    
    console.log('✅ === VIN decode completed successfully ===\n')
    return c.json(vinData)
    
  } catch (error) {
    console.error('❌ Error in decode-vin route:', error)
    return c.json({ 
      error: error instanceof Error ? error.message : 'Erro ao descodificar VIN'
    }, 500)
  }
})

/**
 * Route: Test VIN Decoder API configuration
 * GET /infomatricula/test-vin-decoder
 */
app.get('/test-vin-decoder', async (c) => {
  try {
    const result = await testVinDecoderApi()
    
    if (result.success) {
      return c.json(result, 200)
    } else {
      return c.json(result, result.status || 500)
    }
    
  } catch (error) {
    console.error('❌ Test VIN Decoder error:', error)
    return c.json({ 
      success: false,
      configured: false,
      error: error instanceof Error ? error.message : 'Test failed',
      stack: error instanceof Error ? error.stack : undefined
    }, 500)
  }
})

export default app