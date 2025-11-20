// TecDoc API Integration Routes
// This file contains routes for integrating with TecAlliance TecDoc API
//
// SETUP INSTRUCTIONS:
// 1. Get TecDoc API credentials from TecAlliance (https://www.tecalliance.net/)
// 2. Set the TECDOC_API_KEY environment variable in Supabase dashboard
// 3. Update the tecdocUrl endpoint below to match your TecDoc subscription
// 4. Adapt the request/response structure based on your TecDoc API version
//
// IMPORTANT: The generic implementation below needs to be customized based on
// your specific TecDoc API subscription and endpoint configuration

export function addTecDocRoutes(app: any, requireAuth: any) {
  
  // Search part in TecDoc database
  app.post('/make-server-6971b43c/stock/tecdoc/search', requireAuth, async (c: any) => {
    try {
      const { reference } = await c.req.json()
      console.log('🔍 TecDoc: Searching for reference:', reference)
      
      if (!reference || reference.trim() === '') {
        return c.json({ error: 'Referência é obrigatória' }, 400)
      }
      
      const tecdocApiKey = Deno.env.get('TECDOC_API_KEY')
      if (!tecdocApiKey) {
        console.log('⚠️ TecDoc API key not configured')
        return c.json({ 
          error: 'TecDoc API não configurada. Por favor, contacte o administrador.',
          configured: false 
        }, 503)
      }
      
      console.log('🌐 TecDoc: Making API request...')
      
      // TecDoc API endpoint - TecAlliance uses different endpoints based on the service
      // This is a generic implementation that should be adapted to the specific TecDoc API being used
      const tecdocUrl = 'https://webservice.tecalliance.services/pegasus-3-0/services/TecdocToCatalog.jsonEndpoint'
      
      // Example request body for TecDoc API
      // This structure may vary depending on the specific TecDoc service and version
      const requestBody = {
        articleNumber: reference.trim(),
        provider: 3,  // TecAlliance provider ID
        lang: 'PT',   // Portuguese
        // Add more parameters as needed by your TecDoc API subscription
      }
      
      const response = await fetch(tecdocUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${tecdocApiKey}`,
          // Some TecDoc APIs use different auth headers:
          // 'X-API-Key': tecdocApiKey,
        },
        body: JSON.stringify(requestBody)
      })
      
      if (!response.ok) {
        console.log('❌ TecDoc API error:', response.status, response.statusText)
        const errorText = await response.text()
        console.log('Error response:', errorText)
        
        return c.json({ 
          error: `Erro ao consultar TecDoc (${response.status}). Verifique a referência e tente novamente.`,
          details: errorText
        }, response.status)
      }
      
      const tecdocData = await response.json()
      console.log('✅ TecDoc: Data received')
      
      // Parse TecDoc response and extract relevant data
      // The structure depends on the TecDoc API version and endpoint
      // This is a generic example that should be adapted
      
      // Check different possible response structures
      let articles = []
      
      if (tecdocData.articles && Array.isArray(tecdocData.articles)) {
        articles = tecdocData.articles
      } else if (tecdocData.data && Array.isArray(tecdocData.data)) {
        articles = tecdocData.data
      } else if (tecdocData.array && Array.isArray(tecdocData.array)) {
        articles = tecdocData.array
      } else if (Array.isArray(tecdocData)) {
        articles = tecdocData
      }
      
      if (articles.length === 0) {
        console.log('⚠️ TecDoc: No articles found for reference:', reference)
        return c.json({ 
          found: false,
          message: 'Nenhum artigo encontrado para esta referência'
        })
      }
      
      // Get the first article from results
      const article = articles[0]
      
      // Extract and normalize data - trying different field names
      const partData = {
        found: true,
        reference: article.articleNumber || article.partNumber || article.reference || reference,
        name: article.genericArticleName || article.articleName || article.description || article.name || '',
        description: article.articleDescription || article.genericArticleDescription || article.longDescription || article.desc || '',
        manufacturer: article.brandName || article.manufacturer || article.brand || article.supplierName || '',
        categoryName: article.genericArticleDescription || article.category || article.categoryName || '',
        eanCode: article.eanNumber || article.ean || article.barcode || '',
        images: article.images || article.pictures || [],
        imageUrl: '',
        technicalData: article.technicalData || article.specifications || [],
        // Prices from TecDoc (if available in your API subscription)
        recommendedPrice: article.recommendedRetailPrice || article.rrp || article.price || null,
        purchasePrice: article.tradePrice || article.costPrice || article.netPrice || null,
        salePrice: article.retailPrice || article.salePrice || null,
        // Additional data
        oem: article.oemNumbers || article.oem || [],
        crossReferences: article.crossReferences || article.alternatives || [],
        specifications: article.specifications || article.specs || {},
        stock: article.stock || article.quantity || null,
        weight: article.weight || null,
        dimensions: article.dimensions || null
      }
      
      // Extract image URL from different possible structures
      if (article.images && article.images.length > 0) {
        partData.imageUrl = article.images[0].url || article.images[0].imageURL || article.images[0].link || article.images[0]
      } else if (article.pictures && article.pictures.length > 0) {
        partData.imageUrl = article.pictures[0].url || article.pictures[0].imageURL || article.pictures[0]
      } else if (article.imageUrl || article.image) {
        partData.imageUrl = article.imageUrl || article.image
      }
      
      console.log('✅ TecDoc: Part data extracted:', partData.reference, partData.name)
      console.log('📦 TecDoc: Full part data:', JSON.stringify(partData, null, 2))
      return c.json(partData)
      
    } catch (error: any) {
      console.log('❌ TecDoc: Error searching part:', error)
      return c.json({ 
        error: 'Erro ao consultar TecDoc: ' + (error.message || 'Erro desconhecido'),
        details: error.message
      }, 500)
    }
  })
}
