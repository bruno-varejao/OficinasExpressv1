/**
 * VIN DECODER SERVICE
 * 
 * Serviço para descodificar VINs usando RapidAPI VIN Decoder
 * API: https://rapidapi.com/princeissar3-eUPZuI7ZA/api/vin-decoder-support-tecdoc-catalog
 * 
 * Endpoint: https://vin-decoder-support-tecdoc-catalog.p.rapidapi.com/
 * Método: GET
 * Parâmetro: vin (query string)
 * 
 * Headers necessários:
 * - X-RapidAPI-Key: {sua_chave}
 * - X-RapidAPI-Host: vin-decoder-support-tecdoc-catalog.p.rapidapi.com
 */

export interface VinDecoderData {
  AWN_k_type?: string
  AWN_code_moteur?: string
  AWN_url_image?: string
  AWN_annee_de_debut_modele?: string
  AWN_annee_de_fin_modele?: string
  AWN_model_image?: string
  [key: string]: any // Para campos adicionais
}

/**
 * Verifica se a API Key está configurada
 */
export function isVinDecoderConfigured(): boolean {
  const apiKey = Deno.env.get('RAPIDAPI_VIN_DECODER_KEY')
  const isConfigured = !!apiKey && apiKey.length > 0
  
  console.log('🔑 VIN Decoder API Key status:', isConfigured ? '✅ CONFIGURADA' : '❌ NÃO CONFIGURADA')
  
  return isConfigured
}

/**
 * Testa a configuração da API fazendo uma chamada real
 */
export async function testVinDecoderApi(): Promise<{
  success: boolean
  status?: number
  message: string
  data?: any
}> {
  console.log('\n🧪 ==========================================')
  console.log('🧪 TESTE DE CONFIGURAÇÃO VIN DECODER API')
  console.log('🧪 ==========================================\n')
  
  // Verifica se a chave existe
  const apiKey = Deno.env.get('RAPIDAPI_VIN_DECODER_KEY')
  
  if (!apiKey) {
    console.log('❌ ERRO: Variável RAPIDAPI_VIN_DECODER_KEY não encontrada')
    return {
      success: false,
      message: 'Chave RAPIDAPI_VIN_DECODER_KEY não configurada. Por favor, configure a chave nas variáveis de ambiente.'
    }
  }
  
  console.log('✅ Chave RAPIDAPI_VIN_DECODER_KEY encontrada')
  console.log('📏 Tamanho da chave:', apiKey.length, 'caracteres')
  console.log('🔤 Primeiros 10 caracteres:', apiKey.substring(0, 10) + '...')
  
  // VIN de teste (Volkswagen Golf)
  const testVin = 'WVWZZZ3CZKE506421'
  console.log('🚗 VIN de teste:', testVin)
  
  try {
    const url = `https://vin-decoder-support-tecdoc-catalog.p.rapidapi.com/?vin=${testVin}`
    console.log('🌐 URL:', url)
    
    console.log('\n📡 Enviando requisição...')
    console.log('📤 Headers:')
    console.log('   - X-RapidAPI-Key:', apiKey.substring(0, 10) + '...')
    console.log('   - X-RapidAPI-Host: vin-decoder-support-tecdoc-catalog.p.rapidapi.com')
    
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'X-RapidAPI-Key': apiKey,
        'X-RapidAPI-Host': 'vin-decoder-support-tecdoc-catalog.p.rapidapi.com'
      }
    })
    
    console.log('\n📥 Resposta recebida!')
    console.log('📊 Status:', response.status, response.statusText)
    
    const responseText = await response.text()
    console.log('📦 Tamanho da resposta:', responseText.length, 'bytes')
    
    // Tenta fazer parse do JSON
    let data: any = null
    try {
      data = JSON.parse(responseText)
      console.log('✅ JSON válido recebido')
      console.log('📋 Campos na resposta:', Object.keys(data).length)
      console.log('🔑 Campos:', Object.keys(data).join(', '))
    } catch (parseError) {
      console.log('⚠️ Resposta não é JSON válido')
      console.log('📄 Resposta bruta:', responseText.substring(0, 200))
    }
    
    // A resposta tem estrutura aninhada: { error, code, message, data: { AWN_k_type, ... } }
    const vinData = data?.data
    
    if (response.ok && vinData && vinData.AWN_k_type) {
      console.log('\n✅ ==========================================')
      console.log('✅ TESTE PASSOU - API FUNCIONA CORRETAMENTE!')
      console.log('✅ ==========================================\n')
      
      return {
        success: true,
        status: response.status,
        message: 'API VIN Decoder configurada e funcionando corretamente!',
        data: vinData
      }
    } else {
      console.log('\n⚠️ ==========================================')
      console.log('⚠️ TESTE FALHOU - API RETORNOU ERRO')
      console.log('⚠️ ==========================================\n')
      
      let errorMessage = 'Erro desconhecido'
      
      if (response.status === 401) {
        errorMessage = 'Chave de API inválida. Verifique se a chave RAPIDAPI_VIN_DECODER_KEY está correta.'
      } else if (response.status === 403) {
        errorMessage = 'Acesso negado. Verifique se a chave tem permissão para usar esta API.'
      } else if (response.status === 429) {
        errorMessage = 'Limite de requisições excedido. Sua quota da API RapidAPI pode ter sido atingida.'
      } else if (response.status === 404) {
        errorMessage = 'VIN não encontrado na base de dados da API.'
      } else {
        errorMessage = `Erro ${response.status}: ${responseText}`
      }
      
      return {
        success: false,
        status: response.status,
        message: errorMessage,
        data: data || responseText
      }
    }
    
  } catch (error) {
    console.log('\n❌ ==========================================')
    console.log('❌ ERRO DE CONEXÃO')
    console.log('❌ ==========================================\n')
    console.error('❌ Erro:', error)
    
    return {
      success: false,
      message: `Erro ao conectar à API: ${error instanceof Error ? error.message : 'Erro desconhecido'}`,
      data: error instanceof Error ? error.stack : undefined
    }
  }
}

/**
 * Descodifica um VIN usando a API RapidAPI
 */
export async function decodeVin(vin: string): Promise<VinDecoderData | null> {
  console.log('\n🔍 ==========================================')
  console.log('🔍 DESCODIFICAÇÃO DE VIN')
  console.log('🔍 ==========================================')
  console.log('🚗 VIN:', vin)
  
  // Valida o VIN
  if (!vin || vin.length < 17) {
    console.log('❌ VIN inválido: deve ter 17 caracteres')
    return null
  }
  
  // Verifica se a API está configurada
  if (!isVinDecoderConfigured()) {
    console.log('⚠️ VIN Decoder não configurado, pulando descodificação')
    return null
  }
  
  const apiKey = Deno.env.get('RAPIDAPI_VIN_DECODER_KEY')!
  
  try {
    const url = `https://vin-decoder-support-tecdoc-catalog.p.rapidapi.com/?vin=${vin}`
    console.log('🌐 Chamando API:', url)
    
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'X-RapidAPI-Key': apiKey,
        'X-RapidAPI-Host': 'vin-decoder-support-tecdoc-catalog.p.rapidapi.com'
      }
    })
    
    console.log('📥 Status da resposta:', response.status)
    
    if (!response.ok) {
      const errorText = await response.text()
      console.log('⚠️ API retornou erro:', response.status, errorText)
      
      if (response.status === 404) {
        console.log('ℹ️ VIN não encontrado na base de dados da API')
      } else if (response.status === 401 || response.status === 403) {
        console.log('❌ Problema de autenticação com a API')
      } else if (response.status === 429) {
        console.log('⚠️ Limite de requisições da API excedido')
      }
      
      return null
    }
    
    const data = await response.json()
    console.log('📦 Dados recebidos:', Object.keys(data).length, 'campos')
    
    // A resposta tem estrutura aninhada: { error, code, message, data: { AWN_k_type, ... } }
    const responseData = data?.data
    
    if (!responseData) {
      console.log('⚠️ Estrutura de resposta inválida')
      console.log('📄 Resposta completa:', JSON.stringify(data, null, 2))
      return null
    }
    
    // Extrai apenas os campos que queremos salvar
    const vinData: VinDecoderData = {}
    
    if (responseData.AWN_k_type) {
      vinData.AWN_k_type = responseData.AWN_k_type
      console.log('  ✅ K-Type:', responseData.AWN_k_type)
    }
    
    if (responseData.AWN_code_moteur) {
      vinData.AWN_code_moteur = responseData.AWN_code_moteur
      console.log('  ✅ Código Motor:', responseData.AWN_code_moteur)
    }
    
    if (responseData.AWN_url_image) {
      vinData.AWN_url_image = responseData.AWN_url_image
      console.log('  ✅ URL Imagem:', responseData.AWN_url_image)
    }
    
    if (responseData.AWN_annee_de_debut_modele) {
      vinData.AWN_annee_de_debut_modele = responseData.AWN_annee_de_debut_modele
      console.log('  ✅ Ano Início:', responseData.AWN_annee_de_debut_modele)
    }
    
    if (responseData.AWN_annee_de_fin_modele) {
      vinData.AWN_annee_de_fin_modele = responseData.AWN_annee_de_fin_modele
      console.log('  ✅ Ano Fim:', responseData.AWN_annee_de_fin_modele)
    }
    
    if (responseData.AWN_model_image) {
      vinData.AWN_model_image = responseData.AWN_model_image
      console.log('  ✅ Imagem Modelo:', responseData.AWN_model_image)
    }
    
    const fieldCount = Object.keys(vinData).length
    
    if (fieldCount === 0) {
      console.log('⚠️ Nenhum campo VIN Decoder encontrado na resposta')
      console.log('📄 Resposta completa:', JSON.stringify(data, null, 2))
      return null
    }
    
    console.log(`✅ VIN descodificado com sucesso! ${fieldCount} campos extraídos`)
    console.log('✅ ==========================================\n')
    
    return vinData
    
  } catch (error) {
    console.log('❌ Erro ao descodificar VIN:', error)
    console.log('❌ ==========================================\n')
    return null
  }
}

/**
 * Descodifica VIN de forma silenciosa (sem logs excessivos)
 */
export async function decodeVinQuiet(vin: string): Promise<VinDecoderData | null> {
  if (!vin || vin.length < 17 || !isVinDecoderConfigured()) {
    return null
  }
  
  const apiKey = Deno.env.get('RAPIDAPI_VIN_DECODER_KEY')!
  
  try {
    const response = await fetch(
      `https://vin-decoder-support-tecdoc-catalog.p.rapidapi.com/?vin=${vin}`,
      {
        method: 'GET',
        headers: {
          'X-RapidAPI-Key': apiKey,
          'X-RapidAPI-Host': 'vin-decoder-support-tecdoc-catalog.p.rapidapi.com'
        }
      }
    )
    
    if (!response.ok) {
      return null
    }
    
    const data = await response.json()
    
    // A resposta tem estrutura aninhada: { error, code, message, data: { AWN_k_type, ... } }
    const responseData = data?.data
    
    if (!responseData) {
      return null
    }
    
    const vinData: VinDecoderData = {}
    if (responseData.AWN_k_type) vinData.AWN_k_type = responseData.AWN_k_type
    if (responseData.AWN_code_moteur) vinData.AWN_code_moteur = responseData.AWN_code_moteur
    if (responseData.AWN_url_image) vinData.AWN_url_image = responseData.AWN_url_image
    if (responseData.AWN_annee_de_debut_modele) vinData.AWN_annee_de_debut_modele = responseData.AWN_annee_de_debut_modele
    if (responseData.AWN_annee_de_fin_modele) vinData.AWN_annee_de_fin_modele = responseData.AWN_annee_de_fin_modele
    if (responseData.AWN_model_image) vinData.AWN_model_image = responseData.AWN_model_image
    
    return Object.keys(vinData).length > 0 ? vinData : null
    
  } catch (error) {
    return null
  }
}