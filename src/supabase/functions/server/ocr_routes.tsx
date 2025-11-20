import { Hono } from 'npm:hono'

export function addOcrRoutes(app: Hono) {
  
  // OCR Image Template - Extract text from image
  app.post('/make-server-6971b43c/ocr-template', async (c) => {
    try {
      console.log('🔍 OCR Template: Starting image processing...')
      
      const formData = await c.req.formData()
      const imageFile = formData.get('image') as File
      
      if (!imageFile) {
        console.log('❌ OCR Template: No image file provided')
        return c.json({ error: 'No image file provided' }, 400)
      }
      
      console.log('📸 OCR Template: Image received:', imageFile.name, `(${imageFile.size} bytes)`)
      
      // Check file size (OCR.space free tier has 1MB limit)
      if (imageFile.size > 1024 * 1024) {
        console.log('⚠️ OCR Template: Image file too large for OCR.space free tier')
        return c.json({ 
          error: 'Imagem demasiado grande. O limite é 1MB para processamento OCR. Por favor, comprima a imagem primeiro.',
          sizeLimit: true
        }, 400)
      }
      
      // Check if OCR API key is configured
      const ocrApiKey = Deno.env.get('OCR_API_KEY')
      if (!ocrApiKey) {
        console.log('❌ OCR Template: OCR_API_KEY not configured')
        return c.json({ 
          error: 'Serviço OCR não configurado',
          details: 'A chave da API OCR não está definida. Por favor, configure OCR_API_KEY nas variáveis de ambiente.',
          apiKeyError: true
        }, 500)
      }
      
      console.log('✅ OCR Template: API Key found (length:', ocrApiKey.length, ')')
      
      // Convert image to base64
      const arrayBuffer = await imageFile.arrayBuffer()
      const base64Image = btoa(
        new Uint8Array(arrayBuffer).reduce((data, byte) => data + String.fromCharCode(byte), '')
      )
      
      console.log('📤 OCR Template: Sending to OCR.space API...')
      
      // Call OCR.space API
      const ocrFormData = new FormData()
      ocrFormData.append('base64Image', `data:${imageFile.type};base64,${base64Image}`)
      ocrFormData.append('language', 'por') // Portuguese
      ocrFormData.append('isOverlayRequired', 'false')
      ocrFormData.append('detectOrientation', 'true')
      ocrFormData.append('scale', 'true')
      ocrFormData.append('OCREngine', '2') // Use OCR Engine 2 for better accuracy
      
      const ocrResponse = await fetch('https://api.ocr.space/parse/image', {
        method: 'POST',
        headers: {
          'apikey': ocrApiKey,
        },
        body: ocrFormData,
      })
      
      if (!ocrResponse.ok) {
        console.log('❌ OCR Template: OCR API error:', ocrResponse.status, ocrResponse.statusText)
        const errorText = await ocrResponse.text()
        console.log('   Error details:', errorText)
        
        // Handle specific error codes for invalid API key
        if (ocrResponse.status === 403 || errorText.toLowerCase().includes('invalid')) {
          console.log('🔑 OCR Template: API Key is invalid or expired')
          return c.json({ 
            error: 'Chave da API OCR inválida ou expirada',
            details: `A chave da API OCR.space não é válida. 

📝 Para obter uma nova chave GRATUITA:
1. Visite https://ocr.space/ocrapi
2. Registe-se gratuitamente
3. Copie a chave API fornecida
4. Configure a variável de ambiente OCR_API_KEY com a nova chave

Contacte o administrador do sistema para atualizar a chave.`,
            apiKeyError: true,
            needsNewKey: true
          }, 403)
        }
        
        // Try to parse error as JSON
        try {
          const errorJson = JSON.parse(errorText)
          return c.json({ 
            error: `Erro no serviço OCR (${ocrResponse.status}): ${errorJson.ErrorMessage || errorJson.error || 'Erro desconhecido'}`,
            details: errorJson
          }, 500)
        } catch {
          return c.json({ 
            error: `Erro no serviço OCR (${ocrResponse.status})`,
            details: errorText
          }, 500)
        }
      }
      
      const ocrResult = await ocrResponse.json()
      console.log('📥 OCR Template: Received OCR response:', JSON.stringify(ocrResult))
      
      if (ocrResult.IsErroredOnProcessing) {
        console.log('❌ OCR Template: OCR processing error:', ocrResult.ErrorMessage)
        console.log('   Full error details:', JSON.stringify(ocrResult.ErrorDetails || []))
        return c.json({ 
          error: ocrResult.ErrorMessage?.[0] || ocrResult.ErrorMessage || 'Error processing image',
          details: ocrResult.ErrorDetails || []
        }, 500)
      }
      
      const extractedText = ocrResult.ParsedResults?.[0]?.ParsedText || ''
      console.log('✅ OCR Template: Text extracted successfully')
      console.log(`   Length: ${extractedText.length} characters`)
      
      return c.json({
        success: true,
        text: extractedText,
        confidence: ocrResult.ParsedResults?.[0]?.TextOrientation || null
      })
      
    } catch (error: any) {
      console.log('❌ OCR Template: Error processing image:', error.message)
      console.error(error)
      return c.json({ error: `Error processing image: ${error.message}` }, 500)
    }
  })
  
  // OCR PDF Template - Extract text from PDF
  app.post('/make-server-6971b43c/ocr-pdf-template', async (c) => {
    try {
      console.log('📄 OCR PDF Template: Starting PDF processing...')
      
      const formData = await c.req.formData()
      const pdfFile = formData.get('pdf') as File
      
      if (!pdfFile) {
        console.log('❌ OCR PDF Template: No PDF file provided')
        return c.json({ error: 'No PDF file provided' }, 400)
      }
      
      console.log('📄 OCR PDF Template: PDF received:', pdfFile.name, `(${pdfFile.size} bytes)`)
      
      // Check file size (OCR.space free tier has 1MB limit)
      if (pdfFile.size > 1024 * 1024) {
        console.log('⚠️ OCR PDF Template: PDF file too large for OCR.space free tier')
        return c.json({ 
          error: 'PDF demasiado grande. O limite é 1MB para processamento OCR. Por favor, use um PDF mais pequeno ou converta-o para imagem.',
          sizeLimit: true
        }, 400)
      }
      
      // Check if OCR API key is configured
      const ocrApiKey = Deno.env.get('OCR_API_KEY')
      if (!ocrApiKey) {
        console.log('❌ OCR PDF Template: OCR_API_KEY not configured')
        return c.json({ 
          error: 'Serviço OCR não configurado',
          details: 'A chave da API OCR não está definida. Por favor, configure OCR_API_KEY nas variáveis de ambiente.',
          apiKeyError: true
        }, 500)
      }
      
      console.log('✅ OCR PDF Template: API Key found (length:', ocrApiKey.length, ')')
      
      // Convert PDF to base64
      const arrayBuffer = await pdfFile.arrayBuffer()
      const base64Pdf = btoa(
        new Uint8Array(arrayBuffer).reduce((data, byte) => data + String.fromCharCode(byte), '')
      )
      
      console.log('📤 OCR PDF Template: Sending to OCR.space API...')
      
      // Call OCR.space API with PDF
      const ocrFormData = new FormData()
      ocrFormData.append('base64Image', `data:application/pdf;base64,${base64Pdf}`)
      ocrFormData.append('language', 'por') // Portuguese
      ocrFormData.append('isOverlayRequired', 'false')
      ocrFormData.append('detectOrientation', 'true')
      ocrFormData.append('OCREngine', '2') // Use OCR Engine 2 for better accuracy
      ocrFormData.append('filetype', 'PDF')
      
      const ocrResponse = await fetch('https://api.ocr.space/parse/image', {
        method: 'POST',
        headers: {
          'apikey': ocrApiKey,
        },
        body: ocrFormData,
      })
      
      if (!ocrResponse.ok) {
        console.log('❌ OCR PDF Template: OCR API error:', ocrResponse.status, ocrResponse.statusText)
        const errorText = await ocrResponse.text()
        console.log('   Error details:', errorText)
        
        // Handle specific error codes for invalid API key
        if (ocrResponse.status === 403 || errorText.toLowerCase().includes('invalid')) {
          console.log('🔑 OCR PDF Template: API Key is invalid or expired')
          return c.json({ 
            error: 'Chave da API OCR inválida ou expirada',
            details: `A chave da API OCR.space não é válida. 

📝 Para obter uma nova chave GRATUITA:
1. Visite https://ocr.space/ocrapi
2. Registe-se gratuitamente
3. Copie a chave API fornecida
4. Configure a variável de ambiente OCR_API_KEY com a nova chave

Contacte o administrador do sistema para atualizar a chave.`,
            apiKeyError: true,
            needsNewKey: true
          }, 403)
        }
        
        // Try to parse error as JSON
        try {
          const errorJson = JSON.parse(errorText)
          return c.json({ 
            error: `Erro no serviço OCR (${ocrResponse.status}): ${errorJson.ErrorMessage || errorJson.error || 'Erro desconhecido'}`,
            details: errorJson
          }, 500)
        } catch {
          return c.json({ 
            error: `Erro no serviço OCR (${ocrResponse.status})`,
            details: errorText
          }, 500)
        }
      }
      
      const ocrResult = await ocrResponse.json()
      console.log('📥 OCR PDF Template: Received OCR response:', JSON.stringify(ocrResult))
      
      if (ocrResult.IsErroredOnProcessing) {
        console.log('❌ OCR PDF Template: OCR processing error:', ocrResult.ErrorMessage)
        console.log('   Full error details:', JSON.stringify(ocrResult.ErrorDetails || []))
        return c.json({ 
          error: ocrResult.ErrorMessage?.[0] || ocrResult.ErrorMessage || 'Error processing PDF',
          details: ocrResult.ErrorDetails || []
        }, 500)
      }
      
      // Combine text from all pages
      let extractedText = ''
      if (ocrResult.ParsedResults && Array.isArray(ocrResult.ParsedResults)) {
        extractedText = ocrResult.ParsedResults
          .map((result: any, index: number) => {
            const pageText = result.ParsedText || ''
            return index > 0 ? `\n\n--- Página ${index + 1} ---\n\n${pageText}` : pageText
          })
          .join('')
      }
      
      console.log('✅ OCR PDF Template: Text extracted successfully')
      console.log(`   Pages: ${ocrResult.ParsedResults?.length || 0}`)
      console.log(`   Total length: ${extractedText.length} characters`)
      
      return c.json({
        success: true,
        text: extractedText,
        pages: ocrResult.ParsedResults?.length || 0
      })
      
    } catch (error: any) {
      console.log('❌ OCR PDF Template: Error processing PDF:', error.message)
      console.error(error)
      return c.json({ error: `Error processing PDF: ${error.message}` }, 500)
    }
  })
}
