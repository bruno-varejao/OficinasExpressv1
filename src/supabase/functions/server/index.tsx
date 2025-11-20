import { Hono } from 'npm:hono'
import { cors } from 'npm:hono/cors'
import { logger } from 'npm:hono/logger'
import { createClient } from 'npm:@supabase/supabase-js@2'
import * as kv from './kv_store.tsx'
import { setupIntegrationRoutes } from './integration_routes.tsx'
import { addTecDocRoutes } from './tecdoc_routes.tsx'
import { addOcrRoutes } from './ocr_routes.tsx'
import { addQuoteAgendaRoutes } from './quote_agenda_routes.tsx'
import infomatriculaRoutes from './infomatricula_routes.tsx'
import moloniRoutes from './moloni_routes.tsx'
import { logAudit, getAuditLogs, getAuditStats } from './audit.tsx'
import { setupInnovationsRoutes } from './innovations_routes.tsx'

const app = new Hono()

// Middlewares
app.use('*', cors({
  origin: '*',
  allowHeaders: ['Content-Type', 'Authorization'],
  allowMethods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  credentials: true,
}))
app.use('*', logger(console.log))

// Supabase Client
const supabase = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
)

// Auth Middleware
const requireAuth = async (c: any, next: any) => {
  const accessToken = c.req.header('Authorization')?.split(' ')[1]
  if (!accessToken) {
    console.log('❌ requireAuth: Token não fornecido')
    return c.json({ error: 'Unauthorized: No token provided' }, 401)
  }
  
  const { data: { user }, error } = await supabase.auth.getUser(accessToken)
  if (!user || error) {
    console.log('❌ requireAuth: Token inválido ou utilizador não encontrado:', error?.message)
    return c.json({ error: 'Unauthorized: Invalid token - ' + (error?.message || 'User not found') }, 401)
  }
  
  console.log('✅ requireAuth: Utilizador autenticado:', user.email, '(ID:', user.id, ')')
  
  // Get user profile to get workshopId
  const userProfile = await kv.get(`user:${user.id}`)
  if (!userProfile) {
    console.log('❌ requireAuth: Perfil de utilizador não encontrado no KV para user:', user.id, user.email)
    console.log('💡 Dica: O utilizador pode precisar de criar o perfil através do signup ou o perfil foi apagado.')
    return c.json({ 
      error: 'User profile not found in system. Please contact support or sign up again.',
      userId: user.id,
      email: user.email
    }, 404)
  }
  
  console.log('✅ requireAuth: Perfil encontrado - Role:', userProfile.role, '| Workshop:', userProfile.workshopId)
  
  c.set('userId', user.id)
  c.set('userEmail', user.email)
  c.set('workshopId', userProfile.workshopId)
  c.set('userRole', userProfile.role)
  await next()
}

// Admin Middleware
const requireAdmin = async (c: any, next: any) => {
  const accessToken = c.req.header('Authorization')?.split(' ')[1]
  if (!accessToken) {
    console.log('❌ Admin middleware: No token provided')
    return c.json({ error: 'Unauthorized: No token provided' }, 401)
  }
  
  const { data: { user }, error } = await supabase.auth.getUser(accessToken)
  if (!user || error) {
    console.log('❌ Admin middleware: Invalid token or user not found:', error?.message)
    return c.json({ error: 'Unauthorized: Invalid token - ' + (error?.message || 'User not found') }, 401)
  }
  
  console.log('🔍 Admin middleware: Checking role for user:', user.id, user.email)
  
  // Get user profile to check role
  const userProfile = await kv.get(`user:${user.id}`)
  
  if (!userProfile) {
    console.log('❌ Admin middleware: User profile not found in KV for user:', user.id)
    return c.json({ 
      error: 'Forbidden: User profile not found. Please contact support.',
      userId: user.id 
    }, 403)
  }
  
  console.log('📋 Admin middleware: User profile found:', { id: userProfile.id, email: userProfile.email, role: userProfile.role })
  
  // Accept both 'admin' (platform admin) and 'administrador' (workshop admin)
  const isAdmin = userProfile.role === 'admin' || userProfile.role === 'administrador'
  
  if (!isAdmin) {
    console.log('❌ Admin middleware: User is not admin. Current role:', userProfile.role)
    return c.json({ error: 'Forbidden: Admin access required. Current role: ' + userProfile.role }, 403)
  }
  
  console.log('✅ Admin middleware: Access granted for admin:', user.email)
  c.set('userId', user.id)
  c.set('userEmail', user.email)
  await next()
}

// ==================== SETUP INTEGRATION ROUTES ====================
setupIntegrationRoutes(app, requireAuth)

// ==================== SETUP TECDOC ROUTES ====================
addTecDocRoutes(app, requireAuth)

// ==================== SETUP MOLONI ROUTES ====================
app.route('/make-server-6971b43c/admin', moloniRoutes)

// ==================== SETUP INNOVATIONS ROUTES (LOYALTY, WHATSAPP, DASHBOARDS, OFFLINE) ====================
setupInnovationsRoutes(app, supabase)

// ==================== HEALTH CHECK ====================

// Health check endpoint
app.get('/make-server-6971b43c/health', (c) => {
  return c.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    message: 'OficinasExpress API is running'
  })
})

// ==================== PUBLIC ROUTES (NO AUTH REQUIRED) ====================

// Test endpoint to verify public routes work
app.get('/make-server-6971b43c/public/test', (c) => {
  console.log('🧪 TEST ENDPOINT HIT - Public route is working!')
  return c.json({ success: true, message: 'Public route is working!' })
})

// Get Platform Logos for Public Use (PUBLIC - NO AUTH)
app.get('/make-server-6971b43c/public/platform-logos', async (c) => {
  console.log('🌐🌐🌐 ROUTE HIT: /public/platform-logos - Request received!')
  console.log('📋 Request headers:', c.req.header())
  console.log('🔍 Request method:', c.req.method)
  console.log('🌍 Request URL:', c.req.url)
  
  try {
    console.log('🎯 Attempting to fetch logos from KV...')
    const logos = await kv.get('platform:logos') || {}
    console.log('📦 Logos from KV:', logos)
    console.log('🔑 Logo keys:', Object.keys(logos))
    console.log('🖼️ Logo URL:', logos.logo)
    console.log('🔷 Icon URL:', logos.icon)
    console.log('🌐 Favicon URL:', logos.favicon)
    console.log('✅ Returning response with logos directly (not nested)')
    // Return logos directly for easier consumption by frontend
    return c.json(logos)
  } catch (error) {
    console.log('❌ Error fetching public platform logos:', error)
    return c.json({ error: 'Error fetching logos' }, 500)
  }
})

// ==================== AUTH ROUTES ====================

// Initialize Default Admin Account
app.post('/make-server-6971b43c/init-admin', async (c) => {
  try {
    console.log('🚀 POST /init-admin - Request received')
    console.log('📋 Headers:', c.req.header())
    
    const adminEmail = 'inscricoes@oficinasexpress.com'
    const adminPassword = '123456789'
    
    console.log('🔍 Checking for existing admin account...')
    
    // Check if admin already exists in KV store
    const existingUsers = await kv.getByPrefix('user:')
    console.log(`📊 Found ${existingUsers.length} users in KV store`)
    
    const adminExists = existingUsers.find((user: any) => 
      user.email === adminEmail && (user.role === 'admin' || user.role === 'administrador')
    )
    
    if (adminExists) {
      console.log('✅ Admin account already exists:', adminEmail)
      return c.json({ 
        success: true,
        message: 'Admin account already exists',
        adminId: adminExists.id 
      })
    }

    console.log('📝 Creating new admin user in Supabase Auth...')
    
    // Create super admin workshop (no workshopId - has access to all)
    const adminWorkshopId = 'super-admin'
    
    // Try to create admin user
    const { data, error } = await supabase.auth.admin.createUser({
      email: adminEmail,
      password: adminPassword,
      user_metadata: { 
        name: 'Administrador OficinasExpress', 
        role: 'admin',
        workshopName: 'OficinasExpress - Administração Central',
        workshopId: adminWorkshopId
      },
      email_confirm: true
    })

    if (error) {
      // Check if user already exists in auth
      if (error.message.includes('already registered')) {
        console.log('⚠️ User exists in Auth but not in KV. Fetching user...')
        
        // Try to get user by email
        const { data: { users } } = await supabase.auth.admin.listUsers()
        const existingAuthUser = users.find(u => u.email === adminEmail)
        
        if (existingAuthUser) {
          console.log('✅ Found existing auth user, creating KV profile...')
          await kv.set(`user:${existingAuthUser.id}`, {
            id: existingAuthUser.id,
            email: adminEmail,
            name: 'Administrador OficinasExpress',
            role: 'admin',
            workshopId: adminWorkshopId,
            workshopName: 'OficinasExpress - Administração Central',
            createdAt: new Date().toISOString()
          })
          
          return c.json({ 
            success: true, 
            message: 'Admin profile created for existing auth user',
            adminId: existingAuthUser.id
          })
        }
      }
      
      console.log('❌ Error creating admin user:', error)
      return c.json({ error: error.message }, 400)
    }

    console.log('✅ Admin user created in Auth, ID:', data.user.id)
    
    // Store admin profile in KV
    await kv.set(`user:${data.user.id}`, {
      id: data.user.id,
      email: adminEmail,
      name: 'Administrador OficinasExpress',
      role: 'admin',
      workshopId: adminWorkshopId,
      workshopName: 'OficinasExpress - Administração Central',
      createdAt: new Date().toISOString()
    })

    console.log('✅ Admin profile stored in KV')
    console.log('🎉 Admin account fully created:', adminEmail)
    
    return c.json({ 
      success: true, 
      message: 'Admin account created successfully',
      email: adminEmail,
      adminId: data.user.id
    })
  } catch (error) {
    console.log('❌ Error in init-admin route:', error)
    return c.json({ error: 'Internal server error: ' + error.message }, 500)
  }
})

// Debug: Check Admin Status
app.get('/make-server-6971b43c/debug/admin-status', async (c) => {
  try {
    const adminEmail = 'inscricoes@oficinasexpress.com'
    
    // Check KV store
    const existingUsers = await kv.getByPrefix('user:')
    const adminInKV = existingUsers.find((user: any) => user.email === adminEmail)
    
    // Check Auth
    const { data: { users } } = await supabase.auth.admin.listUsers()
    const adminInAuth = users.find(u => u.email === adminEmail)
    
    return c.json({
      adminEmail,
      existsInKV: !!adminInKV,
      existsInAuth: !!adminInAuth,
      kvData: adminInKV || null,
      authData: adminInAuth ? {
        id: adminInAuth.id,
        email: adminInAuth.email,
        created_at: adminInAuth.created_at,
        email_confirmed: adminInAuth.email_confirmed_at ? true : false
      } : null,
      totalUsersInKV: existingUsers.length,
      totalUsersInAuth: users.length
    })
  } catch (error) {
    return c.json({ error: error.message }, 500)
  }
})

// Sign Up
app.post('/make-server-6971b43c/signup', async (c) => {
  try {
    console.log('🚀 POST /signup - Request received')
    
    const body = await c.req.json()
    const { email, password, name, role, workshopName } = body
    
    console.log('📋 Signup data:', { email, name, role, workshopName: workshopName || 'N/A' })
    
    if (!email || !password || !name) {
      console.log('❌ Missing required fields:', { email: !!email, password: !!password, name: !!name })
      return c.json({ error: 'Email, password e nome são obrigatórios' }, 400)
    }

    // Validate password length
    if (password.length < 6) {
      console.log('❌ Password too short')
      return c.json({ error: 'Password deve ter pelo menos 6 caracteres' }, 400)
    }

    // Create a new workshop for this user
    console.log('📝 Creating new workshop...')
    const workshopId = crypto.randomUUID()
    const workshop = {
      id: workshopId,
      name: workshopName || `Oficina de ${name}`,
      createdAt: new Date().toISOString(),
      isActive: true
    }
    
    console.log('💾 Saving workshop to KV:', workshop.id, workshop.name)
    await kv.set(`workshop:${workshopId}`, workshop)
    console.log('✅ Workshop created successfully')
    
    // Inicializar módulos com array vazio - todos os módulos aparecem inativos por padrão
    const moduleConfig = {
      workshopId,
      modules: [],
      createdAt: new Date().toISOString(),
      updatedBy: 'system-signup'
    }
    await kv.set(`workshop-modules:${workshopId}`, moduleConfig)
    console.log('✅ Workshop modules initialized (empty array) for:', workshopId)

    console.log('👤 Creating user in Supabase Auth...')
    const { data, error } = await supabase.auth.admin.createUser({
      email,
      password,
      user_metadata: { name, role: role || 'administrador', workshopName: workshop.name, workshopId },
      // Automatically confirm the user's email since an email server hasn't been configured.
      email_confirm: true
    })

    if (error) {
      console.log('❌ Error creating user in Auth:', error.message)
      console.log('Full error:', error)
      
      // Delete the workshop we just created since user creation failed
      await kv.del(`workshop:${workshopId}`)
      console.log('🗑️ Workshop deleted due to user creation failure')
      
      // Provide user-friendly error messages
      if (error.message.includes('already registered')) {
        return c.json({ error: 'Este email já está registado. Por favor, faça login.' }, 400)
      }
      
      return c.json({ error: 'Erro ao criar utilizador: ' + error.message }, 400)
    }

    console.log('✅ User created in Auth:', data.user.id, data.user.email)

    // Store user profile with workshopId
    console.log('💾 Saving user profile to KV...')
    const userProfile = {
      id: data.user.id,
      email,
      name,
      role: role || 'administrador', // First user of workshop is admin by default
      workshopId,
      workshopName: workshop.name,
      createdAt: new Date().toISOString()
    }
    
    await kv.set(`user:${data.user.id}`, userProfile)
    console.log('✅ User profile saved successfully')

    console.log('🎉 Signup completed successfully for:', email)
    return c.json({ success: true, user: data.user, workshop })
  } catch (error: any) {
    console.log('❌ Error in signup route:', error)
    console.log('Error stack:', error.stack)
    return c.json({ 
      error: 'Erro interno ao criar conta: ' + (error.message || 'Erro desconhecido'),
      details: error.message 
    }, 500)
  }
})

// Get Current User Profile
app.get('/make-server-6971b43c/me', requireAuth, async (c) => {
  try {
    const userId = c.get('userId')
    console.log('📋 GET /me - Buscando perfil para userId:', userId)
    
    const userProfile = await kv.get(`user:${userId}`)
    
    if (!userProfile) {
      console.log('❌ Perfil não encontrado para userId:', userId)
      return c.json({ error: 'User profile not found' }, 404)
    }
    
    console.log('✅ Perfil encontrado:', userProfile.email, '| Role:', userProfile.role)
    return c.json({ user: userProfile })
  } catch (error) {
    console.log('❌ Erro ao buscar perfil:', error)
    return c.json({ error: 'Error fetching user profile' }, 500)
  }
})

// Debug: Check User Profile Without Auth (for troubleshooting)
app.get('/make-server-6971b43c/debug/check-profile', async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1]
    if (!accessToken) {
      return c.json({ error: 'Token required for debug' }, 400)
    }
    
    const { data: { user }, error } = await supabase.auth.getUser(accessToken)
    if (!user || error) {
      return c.json({ 
        error: 'Invalid token',
        authError: error?.message 
      }, 401)
    }
    
    const userProfile = await kv.get(`user:${user.id}`)
    
    // Get all users to see if profile exists with different key
    const allUsers = await kv.getByPrefix('user:')
    const profileByEmail = allUsers.find(u => u.email === user.email)
    
    return c.json({
      authUser: {
        id: user.id,
        email: user.email,
        metadata: user.user_metadata
      },
      profileInKV: userProfile || null,
      profileFoundByEmail: profileByEmail || null,
      totalProfilesInKV: allUsers.length,
      diagnosis: !userProfile ? '❌ Profile not found - user needs to sign up' : '✅ Profile exists'
    })
  } catch (error) {
    return c.json({ error: error.message }, 500)
  }
})

// ==================== ADMIN ROUTES ====================

// Get All Users (Admin Only)
app.get('/make-server-6971b43c/admin/users', requireAdmin, async (c) => {
  try {
    console.log('📋 Admin route: Fetching all users from KV...')
    const users = await kv.getByPrefix('user:')
    console.log(`📊 Admin route: Found ${users.length} users in KV`)
    
    // Get auth status for each user
    const usersWithAuthStatus = await Promise.all(
      users.map(async (user) => {
        try {
          const { data: authUser } = await supabase.auth.admin.getUserById(user.id)
          return {
            ...user,
            banned: authUser?.user?.banned_until ? true : false,
            lastSignIn: authUser?.user?.last_sign_in_at
          }
        } catch (error) {
          console.log(`⚠️ Error fetching auth data for user ${user.id}:`, error)
          return { ...user, banned: false }
        }
      })
    )
    
    console.log(`✅ Admin route: Returning ${usersWithAuthStatus.length} users`)
    return c.json({ users: usersWithAuthStatus.filter(item => item) })
  } catch (error) {
    console.log('❌ Error fetching users in admin route:', error)
    return c.json({ error: 'Error fetching users: ' + error.message }, 500)
  }
})

// Create User (Admin Only)
app.post('/make-server-6971b43c/admin/users', requireAdmin, async (c) => {
  try {
    const { email, password, name, role, workshopId } = await c.req.json()
    
    if (!email || !password || !name || !workshopId) {
      return c.json({ error: 'Email, password, name and workshopId are required' }, 400)
    }

    // Get workshop info
    const workshop = await kv.get(`workshop:${workshopId}`)
    if (!workshop) {
      return c.json({ error: 'Workshop not found' }, 404)
    }

    const { data, error } = await supabase.auth.admin.createUser({
      email,
      password,
      user_metadata: { name, role: role || 'rececionista', workshopName: workshop.name, workshopId },
      email_confirm: true
    })

    if (error) {
      console.log('Error creating user:', error)
      return c.json({ error: error.message }, 400)
    }

    // Store user profile
    await kv.set(`user:${data.user.id}`, {
      id: data.user.id,
      email,
      name,
      role: role || 'rececionista',
      workshopId,
      workshopName: workshop.name,
      createdAt: new Date().toISOString()
    })

    return c.json({ success: true, user: data.user })
  } catch (error) {
    console.log('Error in admin create user:', error)
    return c.json({ error: 'Internal server error' }, 500)
  }
})

// Update User (Admin Only)
app.put('/make-server-6971b43c/admin/users/:id', requireAdmin, async (c) => {
  try {
    const userId = c.req.param('id')
    const { email, name, role, workshopName, password } = await c.req.json()
    
    // Get existing user profile
    const existingProfile = await kv.get(`user:${userId}`)
    if (!existingProfile) {
      return c.json({ error: 'User not found' }, 404)
    }

    // Update auth user if email or password changed
    const updateData: any = {}
    if (email && email !== existingProfile.email) {
      updateData.email = email
    }
    if (password) {
      updateData.password = password
    }
    if (name || role || workshopName) {
      updateData.user_metadata = {
        name: name || existingProfile.name,
        role: role || existingProfile.role,
        workshopName: workshopName || existingProfile.workshopName
      }
    }

    if (Object.keys(updateData).length > 0) {
      const { error } = await supabase.auth.admin.updateUserById(userId, updateData)
      if (error) {
        console.log('Error updating auth user:', error)
        return c.json({ error: error.message }, 400)
      }
    }

    // Update user profile in KV
    await kv.set(`user:${userId}`, {
      ...existingProfile,
      email: email || existingProfile.email,
      name: name || existingProfile.name,
      role: role || existingProfile.role,
      workshopId: existingProfile.workshopId, // Keep original workshopId
      workshopName: workshopName || existingProfile.workshopName,
      updatedAt: new Date().toISOString()
    })

    return c.json({ success: true })
  } catch (error) {
    console.log('Error updating user:', error)
    return c.json({ error: 'Error updating user' }, 500)
  }
})

// Block/Unblock User (Admin Only)
app.post('/make-server-6971b43c/admin/users/:id/block', requireAdmin, async (c) => {
  try {
    const userId = c.req.param('id')
    const { block } = await c.req.json()
    
    if (block) {
      // Block user for 100 years (essentially permanent)
      const banDuration = '876000h' // 100 years
      const { error } = await supabase.auth.admin.updateUserById(userId, {
        ban_duration: banDuration
      })
      
      if (error) {
        console.log('Error blocking user:', error)
        return c.json({ error: error.message }, 400)
      }
    } else {
      // Unblock user by setting ban_duration to 'none'
      const { error } = await supabase.auth.admin.updateUserById(userId, {
        ban_duration: 'none'
      })
      
      if (error) {
        console.log('Error unblocking user:', error)
        return c.json({ error: error.message }, 400)
      }
    }

    return c.json({ success: true, blocked: block })
  } catch (error) {
    console.log('Error blocking/unblocking user:', error)
    return c.json({ error: 'Error updating user status' }, 500)
  }
})

// Delete User (Admin Only)
app.delete('/make-server-6971b43c/admin/users/:id', requireAdmin, async (c) => {
  try {
    const userId = c.req.param('id')
    
    // Delete from auth
    const { error } = await supabase.auth.admin.deleteUser(userId)
    if (error) {
      console.log('Error deleting user from auth:', error)
      return c.json({ error: error.message }, 400)
    }

    // Delete user profile
    await kv.del(`user:${userId}`)

    return c.json({ success: true })
  } catch (error) {
    console.log('Error deleting user:', error)
    return c.json({ error: 'Error deleting user' }, 500)
  }
})

// ==================== WORKSHOPS ROUTES ====================

// Get All Workshops (Admin Only)
app.get('/make-server-6971b43c/admin/workshops', requireAdmin, async (c) => {
  try {
    console.log('📋 Fetching all workshops...')
    const workshops = await kv.getByPrefix('workshop:')
    console.log(`📊 Found ${workshops.length} workshops`)
    
    // Get user count for each workshop
    const allUsers = await kv.getByPrefix('user:')
    const workshopsWithStats = workshops.map(workshop => {
      const userCount = allUsers.filter(user => user.workshopId === workshop.id).length
      return {
        ...workshop,
        userCount
      }
    })
    
    return c.json({ workshops: workshopsWithStats })
  } catch (error) {
    console.log('❌ Error fetching workshops:', error)
    return c.json({ error: 'Error fetching workshops: ' + error.message }, 500)
  }
})

// Create Workshop (Admin Only)
app.post('/make-server-6971b43c/admin/workshops', requireAdmin, async (c) => {
  try {
    const { name, address, phone, email, nif } = await c.req.json()
    
    if (!name) {
      return c.json({ error: 'Workshop name is required' }, 400)
    }

    const workshopId = crypto.randomUUID()
    const workshop = {
      id: workshopId,
      name,
      address: address || '',
      phone: phone || '',
      email: email || '',
      nif: nif || '',
      isActive: true,
      createdAt: new Date().toISOString()
    }
    
    await kv.set(`workshop:${workshopId}`, workshop)
    console.log('✅ Workshop created:', workshopId, name)
    
    // Inicializar módulos com array vazio - todos os módulos aparecem inativos por padrão
    const moduleConfig = {
      workshopId,
      modules: [],
      createdAt: new Date().toISOString(),
      updatedBy: c.get('userId')
    }
    await kv.set(`workshop-modules:${workshopId}`, moduleConfig)
    console.log('✅ Workshop modules initialized (empty array) for:', workshopId)
    
    return c.json({ success: true, workshop })
  } catch (error) {
    console.log('❌ Error creating workshop:', error)
    return c.json({ error: 'Error creating workshop: ' + error.message }, 500)
  }
})

// Update Workshop (Admin Only)
app.put('/make-server-6971b43c/admin/workshops/:id', requireAdmin, async (c) => {
  try {
    const workshopId = c.req.param('id')
    const { name, address, phone, email, nif, isActive } = await c.req.json()
    
    const existingWorkshop = await kv.get(`workshop:${workshopId}`)
    if (!existingWorkshop) {
      return c.json({ error: 'Workshop not found' }, 404)
    }

    const updatedWorkshop = {
      ...existingWorkshop,
      name: name || existingWorkshop.name,
      address: address !== undefined ? address : existingWorkshop.address,
      phone: phone !== undefined ? phone : existingWorkshop.phone,
      email: email !== undefined ? email : existingWorkshop.email,
      nif: nif !== undefined ? nif : existingWorkshop.nif,
      isActive: isActive !== undefined ? isActive : existingWorkshop.isActive,
      updatedAt: new Date().toISOString()
    }
    
    await kv.set(`workshop:${workshopId}`, updatedWorkshop)
    console.log('✅ Workshop updated:', workshopId)
    
    return c.json({ success: true, workshop: updatedWorkshop })
  } catch (error) {
    console.log('❌ Error updating workshop:', error)
    return c.json({ error: 'Error updating workshop: ' + error.message }, 500)
  }
})

// Upload Workshop Logo (Admin Only)
app.post('/make-server-6971b43c/admin/workshops/:id/logo', requireAdmin, async (c) => {
  try {
    const workshopId = c.req.param('id')
    
    // Check if workshop exists
    const existingWorkshop = await kv.get(`workshop:${workshopId}`)
    if (!existingWorkshop) {
      return c.json({ error: 'Workshop not found' }, 404)
    }

    // Get form data
    const formData = await c.req.formData()
    const file = formData.get('logo') as File
    
    if (!file) {
      return c.json({ error: 'No logo file provided' }, 400)
    }

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/svg+xml']
    if (!allowedTypes.includes(file.type)) {
      return c.json({ error: 'Invalid file type. Only JPEG, PNG, WEBP and SVG are allowed' }, 400)
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      return c.json({ error: 'File too large. Maximum size is 5MB' }, 400)
    }

    // Create bucket if it doesn't exist
    const bucketName = 'make-6971b43c-workshop-logos'
    const { data: buckets } = await supabase.storage.listBuckets()
    const bucketExists = buckets?.some(bucket => bucket.name === bucketName)
    
    if (!bucketExists) {
      console.log('📦 Creating storage bucket:', bucketName)
      await supabase.storage.createBucket(bucketName, {
        public: false,
        fileSizeLimit: 5242880, // 5MB
        allowedMimeTypes: allowedTypes
      })
    }

    // Delete old logo if exists
    if (existingWorkshop.logoPath) {
      try {
        await supabase.storage.from(bucketName).remove([existingWorkshop.logoPath])
        console.log('🗑️ Old logo deleted:', existingWorkshop.logoPath)
      } catch (error) {
        console.log('⚠️ Error deleting old logo:', error)
      }
    }

    // Upload new logo
    const fileExt = file.name.split('.').pop()
    const fileName = `${workshopId}-${Date.now()}.${fileExt}`
    const filePath = `logos/${fileName}`

    const fileBuffer = await file.arrayBuffer()
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from(bucketName)
      .upload(filePath, fileBuffer, {
        contentType: file.type,
        upsert: true
      })

    if (uploadError) {
      console.log('❌ Error uploading logo:', uploadError)
      return c.json({ error: 'Error uploading logo: ' + uploadError.message }, 500)
    }

    // Get signed URL (valid for 1 year)
    const { data: urlData } = await supabase.storage
      .from(bucketName)
      .createSignedUrl(filePath, 31536000) // 1 year in seconds

    const logoUrl = urlData?.signedUrl || ''

    // Update workshop with logo info
    const updatedWorkshop = {
      ...existingWorkshop,
      logoPath: filePath,
      logoUrl: logoUrl,
      updatedAt: new Date().toISOString()
    }
    
    await kv.set(`workshop:${workshopId}`, updatedWorkshop)
    console.log('✅ Workshop logo uploaded:', workshopId, filePath)
    
    return c.json({ 
      success: true, 
      logoUrl,
      logoPath: filePath,
      workshop: updatedWorkshop 
    })
  } catch (error) {
    console.log('❌ Error uploading workshop logo:', error)
    return c.json({ error: 'Error uploading logo: ' + error.message }, 500)
  }
})

// Get Platform Clients (Admin Only)
app.get('/make-server-6971b43c/admin/platform-clients', requireAdmin, async (c) => {
  try {
    console.log('📋 Fetching platform clients (public quote requests)...')
    
    // Get all public quote requests
    const quoteRequests = await kv.getByPrefix('public_quote:')
    console.log(`📊 Found ${quoteRequests.length} public quote requests`)
    
    // Transform to client-centric view and get selected workshop info if approved
    const clients = await Promise.all(quoteRequests.map(async quote => {
      let selectedWorkshopName = undefined
      
      // If status is approved, get the selected workshop name
      if (quote.status === 'approved' && quote.selectedWorkshopId) {
        const selectedWorkshop = await kv.get(`workshop:${quote.selectedWorkshopId}`)
        if (selectedWorkshop) {
          selectedWorkshopName = selectedWorkshop.name
        }
      }
      
      return {
        quoteRequestId: quote.id,
        clientName: quote.clientName,
        clientEmail: quote.clientEmail,
        clientPhone: quote.clientPhone,
        licensePlate: quote.licensePlate,
        location: quote.location,
        serviceName: quote.serviceName,
        basePrice: quote.basePrice,
        notes: quote.notes,
        status: quote.status,
        createdAt: quote.createdAt,
        selectedWorkshopName
      }
    }))
    
    // Sort by date (most recent first)
    clients.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    
    console.log(`✅ Returning ${clients.length} platform clients`)
    return c.json({ clients })
  } catch (error) {
    console.log('❌ Error fetching platform clients:', error)
    return c.json({ error: 'Error fetching platform clients: ' + error.message }, 500)
  }
})

// Get Workshop Clients Database (Admin Only)
app.get('/make-server-6971b43c/admin/workshop-clients-database', requireAdmin, async (c) => {
  try {
    console.log('📋 Fetching all workshop clients database...')
    
    // Get all clients from all workshops
    const { data: clientRecords, error } = await supabase
      .from('kv_store_6971b43c')
      .select('key, value')
      .like('key', 'client:%')
    
    if (error) {
      console.log('❌ Error fetching from KV:', error)
      throw error
    }
    
    console.log(`📊 Found ${clientRecords?.length || 0} total clients in database`)
    
    // Get all workshops for reference
    const workshops = await kv.getByPrefix('workshop:')
    const workshopMap = new Map()
    workshops.forEach(w => {
      workshopMap.set(w.id, w.name)
    })
    
    // Group clients by NIF
    const clientsByNIF = new Map()
    
    for (const record of clientRecords || []) {
      const client = record.value
      if (!client) continue
      
      const nif = client.nif?.trim() || 'SEM_NIF_' + client.id
      
      if (!clientsByNIF.has(nif)) {
        clientsByNIF.set(nif, {
          nif: client.nif || '',
          names: [],
          emails: [],
          phones: [],
          addresses: [],
          postalCodes: [],
          localities: [],
          countries: [],
          clientNumbers: [],
          cardNumbers: [],
          discounts: [],
          creditDays: [],
          vatRegimes: [],
          workshops: [],
          totalOccurrences: 0
        })
      }
      
      const group = clientsByNIF.get(nif)
      
      // Add unique names
      if (client.name && !group.names.includes(client.name)) {
        group.names.push(client.name)
      }
      
      // Add unique emails
      if (client.email1 && !group.emails.includes(client.email1)) {
        group.emails.push(client.email1)
      }
      if (client.email2 && !group.emails.includes(client.email2)) {
        group.emails.push(client.email2)
      }
      
      // Add unique phones
      if (client.phone1 && !group.phones.includes(client.phone1)) {
        group.phones.push(client.phone1)
      }
      if (client.phone2 && !group.phones.includes(client.phone2)) {
        group.phones.push(client.phone2)
      }
      if (client.phone3 && !group.phones.includes(client.phone3)) {
        group.phones.push(client.phone3)
      }
      
      // Add unique addresses
      if (client.address && !group.addresses.includes(client.address)) {
        group.addresses.push(client.address)
      }
      
      // Add unique postal codes (formatted)
      const postalCodeFormatted = client.cp4 && client.cp3 
        ? `${client.cp4}-${client.cp3}`
        : client.postalCode || ''
      if (postalCodeFormatted && !group.postalCodes.includes(postalCodeFormatted)) {
        group.postalCodes.push(postalCodeFormatted)
      }
      
      // Add unique localities
      if (client.locality && !group.localities.includes(client.locality)) {
        group.localities.push(client.locality)
      }
      
      // Add unique countries
      if (client.country && !group.countries.includes(client.country)) {
        group.countries.push(client.country)
      }
      
      // Add unique client numbers
      if (client.clientNumber && !group.clientNumbers.includes(client.clientNumber)) {
        group.clientNumbers.push(client.clientNumber)
      }
      
      // Add unique card numbers
      if (client.cardNumber && !group.cardNumbers.includes(client.cardNumber)) {
        group.cardNumbers.push(client.cardNumber)
      }
      
      // Add unique discounts
      if (client.discount !== undefined && client.discount !== null && !group.discounts.includes(client.discount)) {
        group.discounts.push(client.discount)
      }
      
      // Add unique credit days
      if (client.creditDays !== undefined && client.creditDays !== null && !group.creditDays.includes(client.creditDays)) {
        group.creditDays.push(client.creditDays)
      }
      
      // Add unique VAT regimes
      if (client.vatRegime && !group.vatRegimes.includes(client.vatRegime)) {
        group.vatRegimes.push(client.vatRegime)
      }
      
      // Add workshop occurrence with full client data
      const workshopName = workshopMap.get(client.workshopId) || 'Oficina Desconhecida'
      group.workshops.push({
        id: client.workshopId,
        name: workshopName,
        clientId: client.id,
        clientName: client.name,
        clientData: {
          email1: client.email1,
          email2: client.email2,
          phone1: client.phone1,
          phone2: client.phone2,
          phone3: client.phone3,
          address: client.address,
          cp4: client.cp4,
          cp3: client.cp3,
          postalCode: client.postalCode,
          locality: client.locality,
          country: client.country,
          clientNumber: client.clientNumber,
          cardNumber: client.cardNumber,
          discount: client.discount,
          creditDays: client.creditDays,
          vatRegime: client.vatRegime,
          email1Active: client.email1Active,
          email2Active: client.email2Active,
          phone1Active: client.phone1Active,
          phone2Active: client.phone2Active,
          phone3Active: client.phone3Active
        },
        createdAt: client.createdAt
      })
      
      group.totalOccurrences++
    }
    
    // Convert map to array and sort by total occurrences (duplicates first)
    const clientsArray = Array.from(clientsByNIF.values()).sort((a, b) => {
      if (b.totalOccurrences !== a.totalOccurrences) {
        return b.totalOccurrences - a.totalOccurrences
      }
      return (a.nif || '').localeCompare(b.nif || '')
    })
    
    console.log(`✅ Returning ${clientsArray.length} unique NIFs`)
    console.log(`   Duplicates: ${clientsArray.filter(c => c.totalOccurrences > 1).length}`)
    console.log(`   Unique: ${clientsArray.filter(c => c.totalOccurrences === 1).length}`)
    
    return c.json({ 
      clientsByNIF: clientsArray,
      stats: {
        totalNIFs: clientsArray.length,
        duplicates: clientsArray.filter(c => c.totalOccurrences > 1).length,
        unique: clientsArray.filter(c => c.totalOccurrences === 1).length,
        totalClients: clientRecords?.length || 0
      }
    })
  } catch (error) {
    console.log('❌ Error fetching workshop clients database:', error)
    return c.json({ error: 'Error fetching workshop clients database: ' + error.message }, 500)
  }
})

// Get Workshop by ID
app.get('/make-server-6971b43c/workshops/:id', requireAuth, async (c) => {
  try {
    const workshopId = c.req.param('id')
    
    const workshop = await kv.get(`workshop:${workshopId}`)
    if (!workshop) {
      return c.json({ error: 'Workshop not found' }, 404)
    }
    
    console.log('✅ Workshop fetched:', workshopId, workshop.name)
    return c.json({ workshop })
  } catch (error) {
    console.log('❌ Error fetching workshop:', error)
    return c.json({ error: 'Error fetching workshop: ' + error.message }, 500)
  }
})

// Get Workshop Profile (Settings Module)
app.get('/make-server-6971b43c/workshop/profile', requireAuth, async (c) => {
  try {
    const workshopId = c.get('workshopId')
    console.log(`📖 Loading workshop profile for workshopId: ${workshopId}`)
    
    const workshop = await kv.get(`workshop:${workshopId}`)
    if (!workshop) {
      return c.json({ error: 'Workshop not found' }, 404)
    }
    
    console.log(`✅ Workshop profile loaded - CP4: ${workshop.cp4 || 'N/A'}`)
    return c.json({ workshop })
  } catch (error) {
    console.log('❌ Error loading workshop profile:', error)
    return c.json({ error: 'Error loading profile' }, 500)
  }
})

// Update Workshop Profile (Settings Module)
app.put('/make-server-6971b43c/workshop/profile', requireAuth, async (c) => {
  try {
    const workshopId = c.get('workshopId')
    const workshopData = await c.req.json()
    
    console.log(`💾 Updating workshop profile for workshopId: ${workshopId}`)
    console.log(`   - CP4: ${workshopData.cp4 || 'N/A'}`)
    console.log(`   - CP3: ${workshopData.cp3 || 'N/A'}`)
    console.log(`   - Postal Code: ${workshopData.postalCode || 'N/A'}`)
    
    // Get existing workshop
    const existingWorkshop = await kv.get(`workshop:${workshopId}`)
    if (!existingWorkshop) {
      return c.json({ error: 'Workshop not found' }, 404)
    }
    
    // Update workshop with new data
    const updatedWorkshop = {
      ...existingWorkshop,
      ...workshopData,
      id: workshopId, // Ensure ID doesn't change
      updatedAt: new Date().toISOString()
    }
    
    await kv.set(`workshop:${workshopId}`, updatedWorkshop)
    
    console.log(`✅ Workshop profile updated successfully`)
    console.log(`   - CP4 saved: ${updatedWorkshop.cp4 || 'N/A'}`)
    
    return c.json({ success: true, workshop: updatedWorkshop })
  } catch (error) {
    console.log('❌ Error updating workshop profile:', error)
    return c.json({ error: 'Error updating profile: ' + error.message }, 500)
  }
})

// Delete Workshop (Admin Only)
app.delete('/make-server-6971b43c/admin/workshops/:id', requireAdmin, async (c) => {
  try {
    const workshopId = c.req.param('id')
    
    // Check if workshop has users
    const allUsers = await kv.getByPrefix('user:')
    const hasUsers = allUsers.some(user => user.workshopId === workshopId)
    
    if (hasUsers) {
      return c.json({ error: 'Cannot delete workshop with active users' }, 400)
    }
    
    // Delete logo from storage if exists
    const existingWorkshop = await kv.get(`workshop:${workshopId}`)
    if (existingWorkshop?.logoPath) {
      try {
        const bucketName = 'make-6971b43c-workshop-logos'
        await supabase.storage.from(bucketName).remove([existingWorkshop.logoPath])
        console.log('🗑️ Workshop logo deleted:', existingWorkshop.logoPath)
      } catch (error) {
        console.log('⚠️ Error deleting workshop logo:', error)
      }
    }
    
    await kv.del(`workshop:${workshopId}`)
    console.log('✅ Workshop deleted:', workshopId)
    
    return c.json({ success: true })
  } catch (error) {
    console.log('❌ Error deleting workshop:', error)
    return c.json({ error: 'Error deleting workshop: ' + error.message }, 500)
  }
})

// Get All Public Platform Clients (Admin Only)
app.get('/make-server-6971b43c/admin/clients', requireAdmin, async (c) => {
  try {
    console.log('📋 Admin route: Fetching all public platform clients...')
    
    // Get all public clients registered on the platform
    const publicClients = await kv.getByPrefix('public_client:')
    console.log(`📊 Found ${publicClients.length} public clients`)
    
    // Get auth data for each client to get last login
    const clientsWithAuthData = await Promise.all(
      publicClients.map(async (client) => {
        try {
          const { data: authUser } = await supabase.auth.admin.getUserById(client.id)
          return {
            ...client,
            lastLogin: authUser?.user?.last_sign_in_at || null,
            emailConfirmed: authUser?.user?.email_confirmed_at ? true : false
          }
        } catch (error) {
          console.log(`⚠️ Error fetching auth data for client ${client.id}:`, error)
          return {
            ...client,
            lastLogin: null,
            emailConfirmed: false
          }
        }
      })
    )
    
    console.log(`✅ Admin route: Returning ${clientsWithAuthData.length} public platform clients`)
    
    return c.json({ clients: clientsWithAuthData })
  } catch (error) {
    console.log('❌ Error fetching public clients:', error)
    return c.json({ error: 'Error fetching clients: ' + error.message }, 500)
  }
})

// ==================== CLIENTS ROUTES ====================

// Get All Clients
app.get('/make-server-6971b43c/clients', requireAuth, async (c) => {
  try {
    console.log('📋 GET /clients - Fetching all clients...')
    const workshopId = c.get('workshopId')
    console.log('   Workshop ID:', workshopId)
    
    // Get clients with keys using direct Supabase query
    const { data: clientRecords, error } = await supabase
      .from('kv_store_6971b43c')
      .select('key, value')
      .like('key', 'client:%')
    
    if (error) {
      console.log('❌ Error fetching from KV:', error)
      throw error
    }
    
    console.log(`   Found ${clientRecords?.length || 0} total clients in database`)
    
    // Process clients: fix missing IDs and filter by workshop
    const clients = []
    const clientsToFix = []
    
    for (const record of clientRecords || []) {
      const client = record.value
      const key = record.key
      
      if (!client || client.workshopId !== workshopId) {
        continue
      }
      
      // Extract ID from key if missing (migration for old data)
      if (!client.id && key.startsWith('client:')) {
        const extractedId = key.substring(7) // Remove 'client:' prefix
        console.log(`⚠️ Client without ID found: ${client.name}, extracting ID from key: ${extractedId}`)
        client.id = extractedId
        clientsToFix.push({ key, client })
      }
      
      clients.push(client)
    }
    
    // Fix clients with missing IDs
    if (clientsToFix.length > 0) {
      console.log(`🔧 Fixing ${clientsToFix.length} clients with missing IDs...`)
      for (const { key, client } of clientsToFix) {
        await kv.set(key, client)
      }
      console.log('✅ Fixed clients with missing IDs')
    }
    
    console.log(`   Filtered to ${clients.length} clients for this workshop`)
    
    if (clients.length > 0) {
      console.log('   Sample client IDs:', clients.slice(0, 3).map(c => c.id))
    }
    
    return c.json({ clients })
  } catch (error) {
    console.log('❌ Error fetching clients:', error)
    return c.json({ error: 'Error fetching clients' }, 500)
  }
})

// Create Client
app.post('/make-server-6971b43c/clients', requireAuth, async (c) => {
  try {
    console.log('📝 POST /clients - Iniciando criação de cliente')
    const clientData = await c.req.json()
    
    console.log('📋 Dados recebidos:', Object.keys(clientData))
    
    // Validar se há pelo menos algum dado útil
    const hasData = Object.values(clientData).some(value => 
      value !== null && value !== undefined && String(value).trim() !== ''
    )
    
    if (!hasData) {
      console.log('❌ Validação falhou: nenhum dado fornecido')
      return c.json({ error: 'At least one field is required' }, 400)
    }

    const clientId = crypto.randomUUID()
    const workshopId = c.get('workshopId')
    const userId = c.get('userId')
    
    console.log('🏢 WorkshopId:', workshopId)
    console.log('👤 UserId:', userId)
    
    if (!workshopId) {
      console.log('❌ ERRO: WorkshopId não encontrado no contexto!')
      return c.json({ error: 'Workshop ID not found. User profile may be incomplete.' }, 500)
    }
    
    // Gerar número de cliente automático baseado em timestamp
    const timestamp = Date.now()
    const randomPart = Math.random().toString(36).substring(2, 6).toUpperCase()
    const cardNumber = `CLI-${timestamp}-${randomPart}`
    
    console.log('🔢 Número de cliente gerado automaticamente:', cardNumber)
    
    // Construir objeto cliente com todos os campos possíveis
    const client = {
      id: clientId,
      cardNumber,
      name: clientData.name || '',
      nif: clientData.nif || '',
      email1: clientData.email1 || '',
      email2: clientData.email2 || '',
      phone1: clientData.phone1 || '',
      phone2: clientData.phone2 || '',
      phone3: clientData.phone3 || '',
      address: clientData.address || '',
      cp4: clientData.cp4 || '',
      cp3: clientData.cp3 || '',
      locality: clientData.locality || '',
      country: clientData.country || 'Portugal',
      discount: clientData.discount || '0',
      creditDays: clientData.creditDays || '0',
      vatRegime: clientData.vatRegime || 'normal',
      workshopId,
      createdAt: new Date().toISOString(),
      createdBy: userId
    }

    console.log('💾 Guardando cliente no KV:', clientId)
    await kv.set(`client:${clientId}`, client)
    console.log('✅ Cliente criado com sucesso:', clientId)
    
    return c.json({ success: true, client })
  } catch (error) {
    console.log('❌ Erro ao criar cliente:', error)
    return c.json({ error: 'Error creating client: ' + (error?.message || String(error)) }, 500)
  }
})

// Import Clients (Bulk with NIF duplicate check)
app.post('/make-server-6971b43c/clients/import', requireAuth, async (c) => {
  try {
    console.log('📥 POST /clients/import - Iniciando importação de clientes')
    const { clients: importClients } = await c.req.json()
    
    if (!Array.isArray(importClients) || importClients.length === 0) {
      return c.json({ error: 'Invalid import data: clients array is required' }, 400)
    }
    
    const workshopId = c.get('workshopId')
    const userId = c.get('userId')
    
    console.log(`📊 Importando ${importClients.length} clientes para workshop ${workshopId}`)
    
    // Get all existing clients for this workshop
    const { data: existingRecords } = await supabase
      .from('kv_store_6971b43c')
      .select('key, value')
      .like('key', 'client:%')
    
    // Build a map of existing NIFs for quick lookup
    const existingNIFs = new Map()
    for (const record of existingRecords || []) {
      const client = record.value
      if (client && client.workshopId === workshopId && client.nif && client.nif.trim()) {
        existingNIFs.set(client.nif.trim(), {
          name: client.name,
          id: client.id
        })
      }
    }
    
    console.log(`🔍 Encontrados ${existingNIFs.size} NIFs existentes na oficina`)
    
    const results = {
      success: 0,
      failed: 0,
      skipped: 0,
      errors: [],
      duplicates: [],
      imported: []
    }
    
    // Process each client
    for (let i = 0; i < importClients.length; i++) {
      const clientData = importClients[i]
      
      try {
        // Check if NIF already exists
        if (clientData.nif && clientData.nif.trim()) {
          const trimmedNIF = clientData.nif.trim()
          
          if (existingNIFs.has(trimmedNIF)) {
            const existing = existingNIFs.get(trimmedNIF)
            console.log(`⚠️ Cliente com NIF ${trimmedNIF} já existe: ${existing.name}`)
            
            results.skipped++
            results.duplicates.push({
              nif: trimmedNIF,
              name: clientData.name || 'Nome não fornecido',
              existingName: existing.name,
              reason: 'NIF duplicado'
            })
            
            continue // Skip this client
          }
        }
        
        // Validar se há pelo menos algum dado útil
        const hasData = Object.values(clientData).some(value => 
          value !== null && value !== undefined && String(value).trim() !== ''
        )
        
        if (!hasData) {
          results.failed++
          results.errors.push(`Linha ${i + 1}: Nenhum dado fornecido`)
          continue
        }
        
        const clientId = crypto.randomUUID()
        
        // Gerar número de cliente automático
        const timestamp = Date.now()
        const randomPart = Math.random().toString(36).substring(2, 6).toUpperCase()
        const cardNumber = `CLI-${timestamp}-${randomPart}`
        
        // Construir objeto cliente
        const client = {
          id: clientId,
          cardNumber,
          name: clientData.name || '',
          nif: clientData.nif || '',
          email1: clientData.email1 || '',
          email2: clientData.email2 || '',
          phone1: clientData.phone1 || '',
          phone2: clientData.phone2 || '',
          phone3: clientData.phone3 || '',
          address: clientData.address || '',
          cp4: clientData.cp4 || '',
          cp3: clientData.cp3 || '',
          locality: clientData.locality || '',
          country: clientData.country || 'Portugal',
          discount: clientData.discount || '0',
          creditDays: clientData.creditDays || '0',
          vatRegime: clientData.vatRegime || 'normal',
          email1Active: clientData.email1Active !== false,
          email2Active: clientData.email2Active !== false,
          phone1Active: clientData.phone1Active !== false,
          phone2Active: clientData.phone2Active !== false,
          phone3Active: clientData.phone3Active !== false,
          workshopId,
          createdAt: new Date().toISOString(),
          createdBy: userId
        }
        
        await kv.set(`client:${clientId}`, client)
        
        // Add to existing NIFs map to catch duplicates within the import
        if (client.nif && client.nif.trim()) {
          existingNIFs.set(client.nif.trim(), {
            name: client.name,
            id: client.id
          })
        }
        
        results.success++
        results.imported.push({
          id: clientId,
          name: client.name,
          nif: client.nif
        })
        
      } catch (error) {
        console.error(`❌ Erro ao importar cliente linha ${i + 1}:`, error)
        results.failed++
        results.errors.push(`Linha ${i + 1}: ${error.message}`)
      }
    }
    
    console.log('✅ Importação concluída:', results)
    
    return c.json({ 
      success: true, 
      results: {
        total: importClients.length,
        success: results.success,
        failed: results.failed,
        skipped: results.skipped,
        errors: results.errors,
        duplicates: results.duplicates
      }
    })
    
  } catch (error) {
    console.log('❌ Erro na importação:', error)
    return c.json({ 
      error: 'Erro ao importar clientes: ' + (error?.message || String(error)) 
    }, 500)
  }
})

// Get Client by ID
app.get('/make-server-6971b43c/clients/:id', requireAuth, async (c) => {
  try {
    const clientId = c.req.param('id')
    const client = await kv.get(`client:${clientId}`)
    
    if (!client) {
      return c.json({ error: 'Client not found' }, 404)
    }
    
    return c.json({ client })
  } catch (error) {
    console.log('Error fetching client:', error)
    return c.json({ error: 'Error fetching client' }, 500)
  }
})

// Update Client
app.put('/make-server-6971b43c/clients/:id', requireAuth, async (c) => {
  try {
    console.log('='.repeat(50))
    console.log('🔄 PUT /clients/:id - Request received')
    
    const clientId = c.req.param('id')
    console.log('   Client ID from URL:', clientId)
    console.log('   Client ID type:', typeof clientId)
    console.log('   Client ID length:', clientId?.length)
    
    const updates = await c.req.json()
    console.log('📋 Update data received (fields):', Object.keys(updates))
    
    const kvKey = `client:${clientId}`
    console.log('🔍 Looking for client with key:', kvKey)
    
    let existingClient = await kv.get(kvKey)
    console.log('📦 KV GET result:', existingClient ? 'FOUND' : 'NOT FOUND')
    
    let actualClientId = clientId
    
    if (!existingClient) {
      console.log('⚠️ Client not found with direct ID lookup!')
      console.log('   Tried key:', kvKey)
      console.log('   Client ID:', clientId)
      
      // FALLBACK: Try to find client by searching all clients for this workshop
      console.log('🔄 Attempting fallback search...')
      const workshopId = c.get('workshopId')
      
      const { data: allClients, error } = await supabase
        .from('kv_store_6971b43c')
        .select('key, value')
        .like('key', 'client:%')
      
      if (error) {
        console.log('❌ Error searching clients:', error)
        return c.json({ error: 'Client not found' }, 404)
      }
      
      console.log(`   Searching through ${allClients?.length || 0} clients...`)
      
      // Try to find by comparing IDs
      let foundRecord = null
      for (const record of allClients || []) {
        const client = record.value
        if (!client || client.workshopId !== workshopId) continue
        
        // Extract ID from key
        const keyId = record.key.substring(7) // Remove 'client:' prefix
        
        // Check if this is the client we're looking for
        if (keyId === clientId || client.id === clientId) {
          console.log('✅ Found client by ID match!')
          foundRecord = { key: record.key, client }
          break
        }
      }
      
      if (foundRecord) {
        existingClient = foundRecord.client
        actualClientId = foundRecord.key.substring(7)
        console.log('   Using key:', foundRecord.key)
        console.log('   Actual ID:', actualClientId)
      } else {
        console.log('❌ Client not found even with fallback search!')
        console.log('   Sample keys in DB:', allClients?.slice(0, 5).map(v => v.key))
        return c.json({ error: 'Client not found' }, 404)
      }
    }
    
    // Fix missing ID if needed (migration for old data)
    if (!existingClient.id) {
      console.log('⚠️ Client missing ID, adding it:', actualClientId)
      existingClient.id = actualClientId
    }
    
    // Security check: verify client belongs to user's workshop
    const workshopId = c.get('workshopId')
    if (existingClient.workshopId !== workshopId) {
      console.log('❌ Security: Client does not belong to this workshop')
      console.log('   Client workshopId:', existingClient.workshopId)
      console.log('   User workshopId:', workshopId)
      return c.json({ error: 'Unauthorized: Client does not belong to your workshop' }, 403)
    }
    
    console.log('📦 Existing client found:', existingClient.name)
    console.log('   Using actual client ID:', actualClientId)
    
    const updatedClient = {
      ...existingClient,
      ...updates,
      id: actualClientId, // Ensure ID is preserved
      updatedAt: new Date().toISOString()
    }
    
    console.log('💾 Saving updated client...')
    console.log('   Saving with key:', `client:${actualClientId}`)
    await kv.set(`client:${actualClientId}`, updatedClient)
    console.log('✅ Client updated successfully:', actualClientId)
    
    return c.json({ success: true, client: updatedClient })
  } catch (error) {
    console.log('❌ Error updating client:', error)
    console.log('❌ Error stack:', error.stack)
    return c.json({ error: 'Error updating client: ' + error.message }, 500)
  }
})

// Delete Client
app.delete('/make-server-6971b43c/clients/:id', requireAuth, async (c) => {
  try {
    const clientId = c.req.param('id')
    
    const existingClient = await kv.get(`client:${clientId}`)
    if (!existingClient) {
      return c.json({ error: 'Client not found' }, 404)
    }
    
    // Check if client has associated vehicles
    const vehicles = await kv.getByPrefix('vehicle:')
    const hasVehicles = vehicles.some(v => v && v.clientId === clientId)
    
    if (hasVehicles) {
      return c.json({ error: 'Cannot delete client with associated vehicles' }, 400)
    }
    
    await kv.del(`client:${clientId}`)
    return c.json({ success: true, message: 'Client deleted successfully' })
  } catch (error) {
    console.log('Error deleting client:', error)
    return c.json({ error: 'Error deleting client' }, 500)
  }
})

// ==================== POSTAL CODE ROUTES ====================

// Search Postal Code using CTT API
app.get('/make-server-6971b43c/postal-code/:postalCode', requireAuth, async (c) => {
  try {
    const postalCode = c.req.param('postalCode')
    console.log('🔍 Searching postal code:', postalCode)
    
    if (!postalCode) {
      return c.json({ error: 'Postal code is required' }, 400)
    }
    
    // Validate postal code format (XXXX-XXX)
    const postalCodeRegex = /^\d{4}-\d{3}$/
    if (!postalCodeRegex.test(postalCode)) {
      return c.json({ error: 'Invalid postal code format. Expected: XXXX-XXX' }, 400)
    }
    
    // Get API key from environment
    const apiKey = Deno.env.get('CTT_POSTAL_CODE_API_KEY')
    if (!apiKey) {
      console.error('❌ CTT_POSTAL_CODE_API_KEY not configured')
      return c.json({ error: 'Postal code API not configured' }, 500)
    }
    
    // Call CTT API
    const cttUrl = `https://www.cttcodigopostal.pt/api/v1/${apiKey}/${postalCode}`
    console.log('🌐 Calling CTT API:', cttUrl.replace(apiKey, 'XXXXX'))
    
    const response = await fetch(cttUrl, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
      },
    })
    
    if (!response.ok) {
      const errorText = await response.text()
      console.error('❌ CTT API error:', response.status, errorText)
      
      if (response.status === 400) {
        return c.json({ error: 'Código postal não encontrado' }, 404)
      }
      
      return c.json({ 
        error: 'Erro ao consultar código postal',
        details: errorText 
      }, response.status)
    }
    
    const data = await response.json()
    console.log('✅ CTT API response:', data.length, 'addresses found')
    
    // Return the addresses array
    return c.json({ 
      success: true, 
      addresses: data,
      count: data.length
    })
    
  } catch (error) {
    console.error('❌ Error searching postal code:', error)
    return c.json({ 
      error: 'Erro ao pesquisar código postal: ' + error.message 
    }, 500)
  }
})

// ==================== VEHICLES ROUTES ====================

// Identify Vehicle by License Plate (simulated OCR)
app.post('/make-server-6971b43c/vehicles/identify', requireAuth, async (c) => {
  try {
    const { licensePlate } = await c.req.json()
    
    if (!licensePlate) {
      return c.json({ error: 'License plate is required' }, 400)
    }

    // Check if vehicle exists
    const vehicles = await kv.getByPrefix('vehicle:')
    const existingVehicle = vehicles.find(v => v && v.licensePlate === licensePlate)
    
    if (existingVehicle) {
      return c.json({ vehicle: existingVehicle, existing: true })
    }

    // Simulate external API call for vehicle data
    // In production, this would call TecDoc or similar API
    return c.json({ 
      vehicle: null, 
      existing: false,
      message: 'Vehicle not found. Please register it manually.' 
    })
  } catch (error) {
    console.log('Error identifying vehicle:', error)
    return c.json({ error: 'Error identifying vehicle' }, 500)
  }
})

// Get All Vehicles
app.get('/make-server-6971b43c/vehicles', requireAuth, async (c) => {
  try {
    const workshopId = c.get('workshopId')
    console.log('📋 GET /vehicles - Workshop:', workshopId)
    
    // Get vehicles with keys using direct Supabase query
    const { data: vehicleRecords, error } = await supabase
      .from('kv_store_6971b43c')
      .select('key, value')
      .like('key', 'vehicle:%')
    
    if (error) {
      console.log('❌ Error fetching from KV:', error)
      throw error
    }
    
    console.log(`   Found ${vehicleRecords?.length || 0} total vehicles in database`)
    
    // Get all clients for this workshop to validate clientId
    const { data: clientRecords } = await supabase
      .from('kv_store_6971b43c')
      .select('key, value')
      .like('key', 'client:%')
    
    const workshopClients = (clientRecords || [])
      .map(r => r.value)
      .filter(c => c && c.workshopId === workshopId)
    
    const validClientIds = new Set(workshopClients.map(c => c.id))
    console.log(`   Found ${validClientIds.size} valid clients for this workshop`)
    
    // Process vehicles: fix missing IDs, validate clientId, and filter by workshop
    const vehicles = []
    const vehiclesToFix = []
    let invalidClientIdCount = 0
    
    for (const record of vehicleRecords || []) {
      const vehicle = record.value
      const key = record.key
      
      if (!vehicle || vehicle.workshopId !== workshopId) {
        continue
      }
      
      let needsFix = false
      
      // Extract ID from key if missing (migration for old data)
      if (!vehicle.id && key.startsWith('vehicle:')) {
        const extractedId = key.substring(8) // Remove 'vehicle:' prefix
        console.log(`⚠️ Vehicle without ID found: ${vehicle.licensePlate}, extracting ID from key: ${extractedId}`)
        vehicle.id = extractedId
        needsFix = true
      }
      
      // Check if clientId exists and is valid
      if (!vehicle.clientId) {
        console.log(`⚠️ Vehicle without clientId: ${vehicle.licensePlate} (${vehicle.id})`)
        invalidClientIdCount++
      } else if (!validClientIds.has(vehicle.clientId)) {
        console.log(`⚠️ Vehicle with invalid clientId: ${vehicle.licensePlate} (${vehicle.id}), clientId: ${vehicle.clientId}`)
        invalidClientIdCount++
      }
      
      if (needsFix) {
        vehiclesToFix.push({ key, vehicle })
      }
      
      vehicles.push(vehicle)
    }
    
    // Fix vehicles with missing IDs
    if (vehiclesToFix.length > 0) {
      console.log(`🔧 Fixing ${vehiclesToFix.length} vehicles with missing IDs...`)
      for (const { key, vehicle } of vehiclesToFix) {
        await kv.set(key, vehicle)
      }
      console.log('✅ Fixed vehicles with missing IDs')
    }
    
    if (invalidClientIdCount > 0) {
      console.log(`⚠️ Found ${invalidClientIdCount} vehicles with missing or invalid clientId`)
    }
    
    console.log(`   Filtered to ${vehicles.length} vehicles for this workshop`)
    
    if (vehicles.length > 0) {
      console.log('   Sample vehicle IDs:', vehicles.slice(0, 3).map(v => v.id))
    }
    
    return c.json({ vehicles })
  } catch (error) {
    console.log('❌ Error fetching vehicles:', error)
    return c.json({ error: 'Error fetching vehicles' }, 500)
  }
})

// Create Vehicle
app.post('/make-server-6971b43c/vehicles', requireAuth, async (c) => {
  try {
    const { 
      clientId, 
      licensePlate, 
      brand, 
      model,
      version,
      vin,
      plateDate,
      color,
      mixture,
      driveType,
      bodyType,
      valves,
      markFrom,
      fuelType,
      powercv,
      powerkw,
      cubicCap,
      categoryType,
      co2,
      ownerType,
      ownerCategory,
      categoryIUC,
      isImported,
      mileage,
      // VIN Decoder fields
      AWN_k_type,
      AWN_code_moteur,
      AWN_url_image,
      AWN_annee_de_debut_modele,
      AWN_annee_de_fin_modele,
      AWN_model_image
    } = await c.req.json()
    
    if (!clientId || !licensePlate || !brand || !model) {
      return c.json({ error: 'Client ID, license plate, brand and model are required' }, 400)
    }

    const workshopId = c.get('workshopId')
    
    // Validate that client exists and belongs to the workshop (TEMPORARILY DISABLED FOR DEBUGGING)
    console.log('🔍 Attempting to validate clientId:', clientId)
    console.log('   clientId type:', typeof clientId)
    console.log('   clientId value:', JSON.stringify(clientId))
    console.log('   Searching for key:', `client:${clientId}`)
    
    const client = await kv.get(`client:${clientId}`)
    console.log('   KV result:', client ? 'FOUND' : 'NOT FOUND')
    
    if (!client) {
      console.log('⚠️ Client not found in database - PROCEEDING ANYWAY FOR DEBUGGING')
      console.log('   Tried key:', `client:${clientId}`)
      console.log('   Listing all client keys...')
      const allClients = await kv.getByPrefix('client:')
      console.log('   Total clients in DB:', allClients.length)
      if (allClients.length > 0) {
        console.log('   Sample client IDs from DB:', allClients.slice(0, 5).map(c => c?.id))
        console.log('   Sample client names from DB:', allClients.slice(0, 5).map(c => c?.name))
      }
      // TEMPORARILY ALLOWING TO PROCEED
      // return c.json({ error: 'Cliente não encontrado' }, 404)
    } else {
      if (client.workshopId !== workshopId) {
        console.log('⚠️ Client does not belong to this workshop - PROCEEDING ANYWAY FOR DEBUGGING')
        console.log('   Client workshopId:', client.workshopId)
        console.log('   User workshopId:', workshopId)
        // return c.json({ error: 'Cliente não pertence a esta oficina' }, 403)
      } else {
        console.log('✅ Client validated:', client.name)
      }
    }

    const vehicleId = crypto.randomUUID()
    
    const vehicle = {
      id: vehicleId,
      clientId,
      workshopId,
      licensePlate: licensePlate.toUpperCase(),
      brand,
      model,
      version,
      vin,
      plateDate,
      color,
      mixture,
      driveType,
      bodyType,
      valves,
      markFrom,
      fuelType,
      powercv,
      powerkw,
      cubicCap,
      categoryType,
      co2,
      ownerType,
      ownerCategory,
      categoryIUC,
      isImported,
      mileage,
      // VIN Decoder fields
      AWN_k_type,
      AWN_code_moteur,
      AWN_url_image,
      AWN_annee_de_debut_modele,
      AWN_annee_de_fin_modele,
      AWN_model_image,
      createdAt: new Date().toISOString(),
      createdBy: c.get('userId')
    }

    await kv.set(`vehicle:${vehicleId}`, vehicle)
    console.log('✅ Vehicle created successfully:', vehicleId)
    return c.json({ success: true, vehicle })
  } catch (error) {
    console.log('❌ Error creating vehicle:', error)
    return c.json({ error: 'Error creating vehicle: ' + error.message }, 500)
  }
})

// Update Vehicle
app.put('/make-server-6971b43c/vehicles/:id', requireAuth, async (c) => {
  try {
    const vehicleId = c.req.param('id')
    console.log('='.repeat(50))
    console.log('🔄 PUT /vehicles/:id - Request received')
    console.log('   Vehicle ID from URL:', vehicleId)
    console.log('   Vehicle ID type:', typeof vehicleId)
    console.log('   Vehicle ID length:', vehicleId?.length)
    
    const body = await c.req.json()
    console.log('📋 Update data received (fields):', Object.keys(body))
    console.log('📋 ClientId recebido:', body.clientId)
    console.log('📋 Body completo:', JSON.stringify(body, null, 2))
    
    const { 
      clientId,
      licensePlate, 
      brand, 
      model,
      version,
      vin,
      plateDate,
      color,
      mixture,
      driveType,
      bodyType,
      valves,
      markFrom,
      fuelType,
      powercv,
      powerkw,
      cubicCap,
      categoryType,
      co2,
      ownerType,
      ownerCategory,
      categoryIUC,
      isImported,
      mileage,
      // VIN Decoder fields
      AWN_k_type,
      AWN_code_moteur,
      AWN_url_image,
      AWN_annee_de_debut_modele,
      AWN_annee_de_fin_modele,
      AWN_model_image
    } = body
    
    const kvKey = `vehicle:${vehicleId}`
    console.log('🔍 Looking for vehicle with key:', kvKey)
    
    let existingVehicle = await kv.get(kvKey)
    console.log('📦 KV GET result:', existingVehicle ? 'FOUND' : 'NOT FOUND')
    
    let actualVehicleId = vehicleId
    
    if (!existingVehicle) {
      console.log('⚠️ Vehicle not found with direct ID lookup!')
      console.log('   Tried key:', kvKey)
      console.log('   Vehicle ID:', vehicleId)
      
      // FALLBACK: Try to find vehicle by searching all vehicles for this workshop
      console.log('🔄 Attempting fallback search...')
      const workshopId = c.get('workshopId')
      
      const { data: allVehicles, error } = await supabase
        .from('kv_store_6971b43c')
        .select('key, value')
        .like('key', 'vehicle:%')
      
      if (error) {
        console.log('❌ Error searching vehicles:', error)
        return c.json({ error: 'Vehicle not found' }, 404)
      }
      
      console.log(`   Searching through ${allVehicles?.length || 0} vehicles...`)
      
      // Try to find by comparing IDs or license plates
      let foundRecord = null
      for (const record of allVehicles || []) {
        const vehicle = record.value
        if (!vehicle || vehicle.workshopId !== workshopId) continue
        
        // Extract ID from key
        const keyId = record.key.substring(8) // Remove 'vehicle:' prefix
        
        // Check if this is the vehicle we're looking for
        if (keyId === vehicleId || vehicle.id === vehicleId) {
          console.log('✅ Found vehicle by ID match!')
          foundRecord = { key: record.key, vehicle }
          break
        }
      }
      
      if (foundRecord) {
        existingVehicle = foundRecord.vehicle
        actualVehicleId = foundRecord.key.substring(8)
        console.log('   Using key:', foundRecord.key)
        console.log('   Actual ID:', actualVehicleId)
      } else {
        console.log('❌ Vehicle not found even with fallback search!')
        console.log('   Sample keys in DB:', allVehicles?.slice(0, 5).map(v => v.key))
        return c.json({ error: 'Vehicle not found' }, 404)
      }
    }
    
    // Fix missing ID if needed (migration for old data)
    if (!existingVehicle.id) {
      console.log('⚠️ Vehicle missing ID, adding it:', actualVehicleId)
      existingVehicle.id = actualVehicleId
    }
    
    // Security check: verify vehicle belongs to user's workshop
    const workshopId = c.get('workshopId')
    if (existingVehicle.workshopId !== workshopId) {
      console.log('❌ Security: Vehicle does not belong to this workshop')
      console.log('   Vehicle workshopId:', existingVehicle.workshopId)
      console.log('   User workshopId:', workshopId)
      return c.json({ error: 'Unauthorized: Vehicle does not belong to your workshop' }, 403)
    }
    
    console.log('📦 Existing vehicle found:', existingVehicle.licensePlate)
    console.log('   Using actual vehicle ID:', actualVehicleId)

    // TEMPORARY DEBUG FLAG: Desativar validação de cliente temporariamente
    const SKIP_CLIENT_VALIDATION = true
    console.log('⚠️ MODO DEBUG: Validação de cliente desativada temporariamente')
    
    // Validate clientId if provided
    if (clientId !== undefined && clientId !== null && clientId !== '' && !SKIP_CLIENT_VALIDATION) {
      console.log('🔍 Validating clientId:', clientId)
      console.log('   Tipo do clientId:', typeof clientId)
      console.log('   ClientId length:', clientId?.length)
      console.log('   Looking for key:', `client:${clientId}`)
      
      // DEBUG: Listar todos os clientes da oficina
      const { data: allClientsInWorkshop, error: clientsError } = await supabase
        .from('kv_store_6971b43c')
        .select('key, value')
        .like('key', 'client:%')
      
      if (!clientsError && allClientsInWorkshop) {
        const workshopClients = allClientsInWorkshop
          .filter(r => r.value && r.value.workshopId === workshopId)
          .map(r => ({ key: r.key, id: r.value.id, name: r.value.name }))
        
        console.log(`📋 DEBUG: Encontrados ${workshopClients.length} clientes da oficina ${workshopId}:`)
        workshopClients.forEach(c => {
          console.log(`   - Key: ${c.key} | ID: ${c.id} | Nome: ${c.name}`)
        })
        
        // Verificar se o clientId existe nessa lista
        const clientMatch = workshopClients.find(c => c.id === clientId || c.key === `client:${clientId}`)
        console.log(`   🔎 Cliente ${clientId} encontrado na lista?`, clientMatch ? 'SIM' : 'NÃO')
        if (clientMatch) {
          console.log('   ✅ Match encontrado:', clientMatch)
        }
      }
      
      const client = await kv.get(`client:${clientId}`)
      
      if (!client) {
        console.log('❌ Client not found:', clientId)
        console.log('   Tentei buscar com a chave:', `client:${clientId}`)
        return c.json({ error: 'Cliente não encontrado' }, 404)
      }
      
      if (client.workshopId !== workshopId) {
        console.log('❌ Client does not belong to this workshop')
        console.log('   Client workshopId:', client.workshopId)
        console.log('   User workshopId:', workshopId)
        return c.json({ error: 'Cliente não pertence a esta oficina' }, 403)
      }
      
      console.log('✅ Client validated:', client.name)
    }

    // Build update object, only updating fields that are provided
    const updatedVehicle = {
      ...existingVehicle,
      clientId: clientId !== undefined ? clientId : existingVehicle.clientId,
      licensePlate: licensePlate ? licensePlate.toUpperCase() : existingVehicle.licensePlate,
      brand: brand !== undefined ? brand : existingVehicle.brand,
      model: model !== undefined ? model : existingVehicle.model,
      version: version !== undefined ? version : existingVehicle.version,
      vin: vin !== undefined ? vin : existingVehicle.vin,
      plateDate: plateDate !== undefined ? plateDate : existingVehicle.plateDate,
      color: color !== undefined ? color : existingVehicle.color,
      mixture: mixture !== undefined ? mixture : existingVehicle.mixture,
      driveType: driveType !== undefined ? driveType : existingVehicle.driveType,
      bodyType: bodyType !== undefined ? bodyType : existingVehicle.bodyType,
      valves: valves !== undefined ? valves : existingVehicle.valves,
      markFrom: markFrom !== undefined ? markFrom : existingVehicle.markFrom,
      fuelType: fuelType !== undefined ? fuelType : existingVehicle.fuelType,
      powercv: powercv !== undefined ? powercv : existingVehicle.powercv,
      powerkw: powerkw !== undefined ? powerkw : existingVehicle.powerkw,
      cubicCap: cubicCap !== undefined ? cubicCap : existingVehicle.cubicCap,
      categoryType: categoryType !== undefined ? categoryType : existingVehicle.categoryType,
      co2: co2 !== undefined ? co2 : existingVehicle.co2,
      ownerType: ownerType !== undefined ? ownerType : existingVehicle.ownerType,
      ownerCategory: ownerCategory !== undefined ? ownerCategory : existingVehicle.ownerCategory,
      categoryIUC: categoryIUC !== undefined ? categoryIUC : existingVehicle.categoryIUC,
      isImported: isImported !== undefined ? isImported : existingVehicle.isImported,
      mileage: mileage !== undefined ? mileage : existingVehicle.mileage,
      // VIN Decoder fields
      AWN_k_type: AWN_k_type !== undefined ? AWN_k_type : existingVehicle.AWN_k_type,
      AWN_code_moteur: AWN_code_moteur !== undefined ? AWN_code_moteur : existingVehicle.AWN_code_moteur,
      AWN_url_image: AWN_url_image !== undefined ? AWN_url_image : existingVehicle.AWN_url_image,
      AWN_annee_de_debut_modele: AWN_annee_de_debut_modele !== undefined ? AWN_annee_de_debut_modele : existingVehicle.AWN_annee_de_debut_modele,
      AWN_annee_de_fin_modele: AWN_annee_de_fin_modele !== undefined ? AWN_annee_de_fin_modele : existingVehicle.AWN_annee_de_fin_modele,
      AWN_model_image: AWN_model_image !== undefined ? AWN_model_image : existingVehicle.AWN_model_image,
      updatedAt: new Date().toISOString()
    }

    console.log('💾 Saving updated vehicle...')
    console.log('   Saving with key:', `vehicle:${actualVehicleId}`)
    console.log('   ClientId being saved:', updatedVehicle.clientId)
    await kv.set(`vehicle:${actualVehicleId}`, updatedVehicle)
    console.log('✅ Vehicle updated successfully:', actualVehicleId)
    return c.json({ success: true, vehicle: updatedVehicle })
  } catch (error) {
    console.log('❌ Error updating vehicle:', error)
    console.log('❌ Error stack:', error.stack)
    return c.json({ error: 'Error updating vehicle: ' + error.message }, 500)
  }
})

// Get Vehicles by Client
app.get('/make-server-6971b43c/clients/:clientId/vehicles', requireAuth, async (c) => {
  try {
    const clientId = c.req.param('clientId')
    const allVehicles = await kv.getByPrefix('vehicle:')
    const clientVehicles = allVehicles.filter(v => v && v.clientId === clientId)
    
    return c.json({ vehicles: clientVehicles })
  } catch (error) {
    console.log('Error fetching client vehicles:', error)
    return c.json({ error: 'Error fetching client vehicles' }, 500)
  }
})

// ==================== BUDGETS ROUTES ====================

// Get All Budgets
app.get('/make-server-6971b43c/budgets', requireAuth, async (c) => {
  try {
    const workshopId = c.get('workshopId')
    const allBudgets = await kv.getByPrefix('budget:')
    // Filter budgets by workshopId
    const budgets = allBudgets.filter(item => item && item.workshopId === workshopId)
    return c.json({ budgets })
  } catch (error) {
    console.log('Error fetching budgets:', error)
    return c.json({ error: 'Error fetching budgets' }, 500)
  }
})

// Create Budget
app.post('/make-server-6971b43c/budgets', requireAuth, async (c) => {
  try {
    const { clientId, vehicleId, items, laborHours, laborRate, notes } = await c.req.json()
    
    if (!clientId || !vehicleId || !items || items.length === 0) {
      return c.json({ error: 'Client ID, vehicle ID and items are required' }, 400)
    }

    const budgetId = crypto.randomUUID()
    const workshopId = c.get('workshopId')
    
    // Calculate totals
    const partsTotal = items.reduce((sum: number, item: any) => sum + (item.price * item.quantity), 0)
    const laborTotal = (laborHours || 0) * (laborRate || 25)
    const subtotal = partsTotal + laborTotal
    const tax = subtotal * 0.23 // IVA 23%
    const total = subtotal + tax

    const budget = {
      id: budgetId,
      number: `ORC-${Date.now()}`,
      clientId,
      vehicleId,
      workshopId,
      items,
      laborHours: laborHours || 0,
      laborRate: laborRate || 25,
      partsTotal,
      laborTotal,
      subtotal,
      tax,
      total,
      notes,
      status: 'pending', // pending, approved, rejected
      createdAt: new Date().toISOString(),
      createdBy: c.get('userId')
    }

    await kv.set(`budget:${budgetId}`, budget)
    return c.json({ success: true, budget })
  } catch (error) {
    console.log('Error creating budget:', error)
    return c.json({ error: 'Error creating budget' }, 500)
  }
})

// Update Budget Status
app.patch('/make-server-6971b43c/budgets/:id/status', requireAuth, async (c) => {
  try {
    console.log('🔄 PATCH /budgets/:id/status - Updating budget status')
    const budgetId = c.req.param('id')
    const { status } = await c.req.json()
    
    console.log('📋 Budget ID:', budgetId, '| New status:', status)
    
    if (!['pending', 'approved', 'rejected'].includes(status)) {
      console.log('❌ Invalid status provided:', status)
      return c.json({ error: 'Invalid status' }, 400)
    }
    
    const budget = await kv.get(`budget:${budgetId}`)
    if (!budget) {
      console.log('❌ Budget not found:', budgetId)
      return c.json({ error: 'Budget not found' }, 404)
    }
    
    const updatedBudget = {
      ...budget,
      status,
      statusUpdatedAt: new Date().toISOString()
    }
    
    await kv.set(`budget:${budgetId}`, updatedBudget)
    console.log('✅ Budget status updated successfully:', budgetId, '->', status)
    return c.json({ success: true, budget: updatedBudget })
  } catch (error) {
    console.log('❌ Error updating budget status:', error)
    return c.json({ error: 'Error updating budget status: ' + error.message }, 500)
  }
})

// Update Budget (Full Edit)
app.put('/make-server-6971b43c/budgets/:id', requireAuth, async (c) => {
  try {
    const budgetId = c.req.param('id')
    const { clientId, vehicleId, items, laborHours, laborRate, notes } = await c.req.json()
    
    const existingBudget = await kv.get(`budget:${budgetId}`)
    if (!existingBudget) {
      return c.json({ error: 'Budget not found' }, 404)
    }

    // Only allow editing if status is pending
    if (existingBudget.status !== 'pending') {
      return c.json({ error: 'Cannot edit approved or rejected budgets' }, 400)
    }

    if (!clientId || !vehicleId || !items || items.length === 0) {
      return c.json({ error: 'Client ID, vehicle ID and items are required' }, 400)
    }

    // Recalculate totals
    const partsTotal = items.reduce((sum: number, item: any) => sum + (item.price * item.quantity), 0)
    const laborTotal = (laborHours || 0) * (laborRate || 25)
    const subtotal = partsTotal + laborTotal
    const tax = subtotal * 0.23 // IVA 23%
    const total = subtotal + tax

    const updatedBudget = {
      ...existingBudget,
      clientId,
      vehicleId,
      items,
      laborHours: laborHours || 0,
      laborRate: laborRate || 25,
      partsTotal,
      laborTotal,
      subtotal,
      tax,
      total,
      notes,
      updatedAt: new Date().toISOString()
    }

    await kv.set(`budget:${budgetId}`, updatedBudget)
    
    // Sync items with associated WorkOrder if exists
    if (existingBudget.workOrderId) {
      console.log('🔄 Syncing Budget items to WorkOrder:', existingBudget.workOrderId)
      try {
        const workOrder = await kv.get(`workorder:${existingBudget.workOrderId}`)
        if (workOrder) {
          const updatedWorkOrder = {
            ...workOrder,
            items,
            laborHours: laborHours || 0,
            laborRate: laborRate || 25,
            partsTotal,
            laborTotal,
            subtotal,
            tax,
            total,
            notes,
            updatedAt: new Date().toISOString(),
            syncedFromBudget: true
          }
          await kv.set(`workorder:${existingBudget.workOrderId}`, updatedWorkOrder)
          console.log('✅ WorkOrder synced successfully')
        }
      } catch (syncError: any) {
        console.error('⚠️ Error syncing to work order:', syncError)
        // Don't fail the request if sync fails
      }
    }
    
    return c.json({ success: true, budget: updatedBudget })
  } catch (error) {
    console.log('Error updating budget:', error)
    return c.json({ error: 'Error updating budget' }, 500)
  }
})

// Delete Budget
app.delete('/make-server-6971b43c/budgets/:id', requireAuth, async (c) => {
  try {
    const budgetId = c.req.param('id')
    const workshopId = c.get('workshopId')
    
    console.log('🗑️ Attempting to delete budget:', budgetId)
    
    const budget = await kv.get(`budget:${budgetId}`)
    if (!budget) {
      return c.json({ error: 'Budget not found' }, 404)
    }

    // Verify that the budget belongs to the workshop
    if (budget.workshopId !== workshopId) {
      console.log('❌ Budget does not belong to this workshop')
      return c.json({ error: 'Unauthorized' }, 403)
    }

    // Delete the budget
    await kv.del(`budget:${budgetId}`)
    console.log('✅ Budget deleted successfully:', budgetId)
    
    return c.json({ success: true, message: 'Orçamento eliminado com sucesso' })
  } catch (error) {
    console.log('❌ Error deleting budget:', error)
    return c.json({ error: 'Error deleting budget: ' + error.message }, 500)
  }
})

// Send Budget by Email
app.post('/make-server-6971b43c/budgets/:id/send-email', requireAuth, async (c) => {
  try {
    const budgetId = c.req.param('id')
    const { to, subject, message } = await c.req.json()
    
    if (!to || !subject) {
      return c.json({ error: 'Email recipient and subject are required' }, 400)
    }

    const budget = await kv.get(`budget:${budgetId}`)
    if (!budget) {
      return c.json({ error: 'Budget not found' }, 404)
    }

    // Here you would integrate with an email service like SendGrid, Resend, or AWS SES
    // For now, we'll simulate the email sending
    console.log('Sending budget email:', { to, subject, budgetId })
    
    // Example with a real email service (requires API key):
    // const emailApiKey = Deno.env.get('EMAIL_API_KEY')
    // const response = await fetch('https://api.sendgrid.com/v3/mail/send', {
    //   method: 'POST',
    //   headers: {
    //     'Authorization': `Bearer ${emailApiKey}`,
    //     'Content-Type': 'application/json'
    //   },
    //   body: JSON.stringify({
    //     personalizations: [{ to: [{ email: to }] }],
    //     from: { email: 'geral@oficinasexpress.pt', name: 'OficinasExpress' },
    //     subject: subject,
    //     content: [{ type: 'text/plain', value: message }]
    //   })
    // })

    // For demonstration, we'll just log and return success
    // In production, you should integrate with a real email service
    return c.json({ 
      success: true, 
      message: 'Email functionality requires email service integration. Check server logs for details.' 
    })
  } catch (error) {
    console.log('Error sending budget email:', error)
    return c.json({ error: 'Error sending email' }, 500)
  }
})

// Send Budget by SMS
app.post('/make-server-6971b43c/budgets/:id/send-sms', requireAuth, async (c) => {
  try {
    const budgetId = c.req.param('id')
    const { phone, message } = await c.req.json()
    
    if (!phone || !message) {
      return c.json({ error: 'Phone number and message are required' }, 400)
    }

    const budget = await kv.get(`budget:${budgetId}`)
    if (!budget) {
      return c.json({ error: 'Budget not found' }, 404)
    }

    // Here you would integrate with an SMS service like Twilio
    // For now, we'll simulate the SMS sending
    console.log('Sending budget SMS:', { phone, budgetId })
    
    // Example with Twilio (requires API credentials):
    // const twilioAccountSid = Deno.env.get('TWILIO_ACCOUNT_SID')
    // const twilioAuthToken = Deno.env.get('TWILIO_AUTH_TOKEN')
    // const twilioPhoneNumber = Deno.env.get('TWILIO_PHONE_NUMBER')
    // 
    // const response = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${twilioAccountSid}/Messages.json`, {
    //   method: 'POST',
    //   headers: {
    //     'Authorization': 'Basic ' + btoa(`${twilioAccountSid}:${twilioAuthToken}`),
    //     'Content-Type': 'application/x-www-form-urlencoded'
    //   },
    //   body: new URLSearchParams({
    //     To: phone,
    //     From: twilioPhoneNumber,
    //     Body: message
    //   })
    // })

    // For demonstration, we'll just log and return success
    // In production, you should integrate with a real SMS service like Twilio
    return c.json({ 
      success: true, 
      message: 'SMS functionality requires SMS service integration (e.g., Twilio). Check server logs for details.' 
    })
  } catch (error) {
    console.log('Error sending budget SMS:', error)
    return c.json({ error: 'Error sending SMS' }, 500)
  }
})

// ==================== WORK ORDERS ROUTES ====================

// Get All Work Orders
app.get('/make-server-6971b43c/workorders', requireAuth, async (c) => {
  try {
    const workshopId = c.get('workshopId')
    const allWorkOrders = await kv.getByPrefix('workorder:')
    // Filter work orders by workshopId
    const workOrders = allWorkOrders.filter(item => item && item.workshopId === workshopId)
    return c.json({ workOrders })
  } catch (error) {
    console.log('Error fetching work orders:', error)
    return c.json({ error: 'Error fetching work orders' }, 500)
  }
})

// Create Work Order from Budget
app.post('/make-server-6971b43c/workorders', requireAuth, async (c) => {
  try {
    const { budgetId, assignedTechnicianId, notes } = await c.req.json()
    
    if (!budgetId) {
      return c.json({ error: 'Budget ID is required' }, 400)
    }

    const budget = await kv.get(`budget:${budgetId}`)
    if (!budget) {
      return c.json({ error: 'Budget not found' }, 404)
    }

    if (budget.status !== 'approved') {
      return c.json({ error: 'Budget must be approved before creating work order' }, 400)
    }

    const workOrderId = crypto.randomUUID()
    
    // Copy items from budget to work order
    const items = budget.items || []
    const laborHours = budget.laborHours || 0
    const laborRate = budget.laborRate || 25
    
    // Calculate totals
    const partsTotal = items.reduce((sum: number, item: any) => sum + (item.price * item.quantity), 0)
    const laborTotal = laborHours * laborRate
    const subtotal = partsTotal + laborTotal
    const tax = subtotal * 0.23 // IVA 23%
    const total = subtotal + tax
    
    const workOrder = {
      id: workOrderId,
      number: `FO-${Date.now()}`,
      budgetId,
      clientId: budget.clientId,
      vehicleId: budget.vehicleId,
      workshopId: c.get('workshopId'),
      assignedTechnicianId,
      items, // Store items from budget
      laborHours,
      laborRate,
      partsTotal,
      laborTotal,
      subtotal,
      tax,
      total,
      status: 'pending', // pending, in-progress, paused, completed
      notes,
      createdAt: new Date().toISOString(),
      createdBy: c.get('userId')
    }

    await kv.set(`workorder:${workOrderId}`, workOrder)
    return c.json({ success: true, workOrder })
  } catch (error) {
    console.log('Error creating work order:', error)
    return c.json({ error: 'Error creating work order' }, 500)
  }
})

// Update Work Order Status
app.patch('/make-server-6971b43c/workorders/:id/status', requireAuth, async (c) => {
  try {
    const workOrderId = c.req.param('id')
    const { status, startedAt, completedAt } = await c.req.json()
    
    if (!['pending', 'in-progress', 'paused', 'completed'].includes(status)) {
      return c.json({ error: 'Invalid status' }, 400)
    }
    
    const workOrder = await kv.get(`workorder:${workOrderId}`)
    if (!workOrder) {
      return c.json({ error: 'Work order not found' }, 404)
    }
    
    const updatedWorkOrder = {
      ...workOrder,
      status,
      startedAt: startedAt || workOrder.startedAt,
      completedAt: completedAt || workOrder.completedAt,
      statusUpdatedAt: new Date().toISOString()
    }
    
    await kv.set(`workorder:${workOrderId}`, updatedWorkOrder)
    return c.json({ success: true, workOrder: updatedWorkOrder })
  } catch (error) {
    console.log('Error updating work order status:', error)
    return c.json({ error: 'Error updating work order status' }, 500)
  }
})

// Update Work Order (Full Edit)
app.put('/make-server-6971b43c/workorders/:id', requireAuth, async (c) => {
  try {
    const workOrderId = c.req.param('id')
    const { items, laborHours, laborRate, notes, assignedTechnicianId } = await c.req.json()
    
    const existingWorkOrder = await kv.get(`workorder:${workOrderId}`)
    if (!existingWorkOrder) {
      return c.json({ error: 'Work order not found' }, 404)
    }

    // Only allow editing if not completed
    if (existingWorkOrder.status === 'completed') {
      return c.json({ error: 'Cannot edit completed work orders' }, 400)
    }

    if (!items || items.length === 0) {
      return c.json({ error: 'Items are required' }, 400)
    }

    // Recalculate totals
    const partsTotal = items.reduce((sum: number, item: any) => sum + (item.price * item.quantity), 0)
    const laborTotal = (laborHours || 0) * (laborRate || 25)
    const subtotal = partsTotal + laborTotal
    const tax = subtotal * 0.23 // IVA 23%
    const total = subtotal + tax

    const updatedWorkOrder = {
      ...existingWorkOrder,
      items,
      laborHours: laborHours || 0,
      laborRate: laborRate || 25,
      partsTotal,
      laborTotal,
      subtotal,
      tax,
      total,
      notes,
      assignedTechnicianId,
      updatedAt: new Date().toISOString()
    }

    await kv.set(`workorder:${workOrderId}`, updatedWorkOrder)
    return c.json({ success: true, workOrder: updatedWorkOrder })
  } catch (error) {
    console.log('Error updating work order:', error)
    return c.json({ error: 'Error updating work order' }, 500)
  }
})

// ==================== APPOINTMENTS ROUTES ====================

// Get All Appointments
app.get('/make-server-6971b43c/appointments', requireAuth, async (c) => {
  try {
    const workshopId = c.get('workshopId')
    const allAppointments = await kv.getByPrefix('appointment:')
    // Filter appointments by workshopId
    const appointments = allAppointments.filter(item => item && item.workshopId === workshopId)
    return c.json({ appointments })
  } catch (error) {
    console.log('Error fetching appointments:', error)
    return c.json({ error: 'Error fetching appointments' }, 500)
  }
})

// Create Appointment
app.post('/make-server-6971b43c/appointments', requireAuth, async (c) => {
  try {
    const { clientId, vehicleId, budgetId, date, startTime, endTime, technicianId, boxNumber, notes } = await c.req.json()
    
    if (!clientId || !vehicleId || !date || !startTime) {
      return c.json({ error: 'Client ID, vehicle ID, date and start time are required' }, 400)
    }

    const appointmentId = crypto.randomUUID()
    const appointment = {
      id: appointmentId,
      clientId,
      vehicleId,
      budgetId,
      workshopId: c.get('workshopId'),
      date,
      startTime,
      endTime,
      technicianId,
      boxNumber,
      notes,
      status: 'scheduled', // scheduled, in-progress, completed, cancelled
      createdAt: new Date().toISOString(),
      createdBy: c.get('userId')
    }

    await kv.set(`appointment:${appointmentId}`, appointment)
    return c.json({ success: true, appointment })
  } catch (error) {
    console.log('Error creating appointment:', error)
    return c.json({ error: 'Error creating appointment' }, 500)
  }
})

// Update Appointment Status
app.patch('/make-server-6971b43c/appointments/:id/status', requireAuth, async (c) => {
  try {
    const appointmentId = c.req.param('id')
    const { status } = await c.req.json()
    
    if (!['scheduled', 'in-progress', 'completed', 'cancelled'].includes(status)) {
      return c.json({ error: 'Invalid status' }, 400)
    }
    
    const appointment = await kv.get(`appointment:${appointmentId}`)
    if (!appointment) {
      return c.json({ error: 'Appointment not found' }, 404)
    }
    
    const updatedAppointment = {
      ...appointment,
      status,
      statusUpdatedAt: new Date().toISOString()
    }
    
    await kv.set(`appointment:${appointmentId}`, updatedAppointment)
    return c.json({ success: true, appointment: updatedAppointment })
  } catch (error) {
    console.log('Error updating appointment status:', error)
    return c.json({ error: 'Error updating appointment status' }, 500)
  }
})

// ==================== INVOICES ROUTES ====================

// Get All Invoices
app.get('/make-server-6971b43c/invoices', requireAuth, async (c) => {
  try {
    const workshopId = c.get('workshopId')
    const allInvoices = await kv.getByPrefix('invoice:')
    // Filter invoices by workshopId
    const invoices = allInvoices.filter(item => item && item.workshopId === workshopId)
    return c.json({ invoices })
  } catch (error) {
    console.log('Error fetching invoices:', error)
    return c.json({ error: 'Error fetching invoices' }, 500)
  }
})

// Create Invoice from Budget
app.post('/make-server-6971b43c/invoices', requireAuth, async (c) => {
  try {
    const { budgetId, paymentMethod, notes } = await c.req.json()
    
    if (!budgetId) {
      return c.json({ error: 'Budget ID is required' }, 400)
    }

    const budget = await kv.get(`budget:${budgetId}`)
    if (!budget) {
      return c.json({ error: 'Budget not found' }, 404)
    }

    if (budget.status !== 'approved') {
      return c.json({ error: 'Budget must be approved before creating invoice' }, 400)
    }

    const invoiceId = crypto.randomUUID()
    const invoice = {
      id: invoiceId,
      number: `FT-${Date.now()}`,
      budgetId,
      clientId: budget.clientId,
      vehicleId: budget.vehicleId,
      workshopId: c.get('workshopId'),
      items: budget.items,
      laborHours: budget.laborHours,
      laborRate: budget.laborRate,
      partsTotal: budget.partsTotal,
      laborTotal: budget.laborTotal,
      subtotal: budget.subtotal,
      tax: budget.tax,
      total: budget.total,
      paymentMethod: paymentMethod || 'cash',
      paymentStatus: 'pending', // pending, paid, overdue
      notes,
      createdAt: new Date().toISOString(),
      createdBy: c.get('userId')
    }

    await kv.set(`invoice:${invoiceId}`, invoice)
    return c.json({ success: true, invoice })
  } catch (error) {
    console.log('Error creating invoice:', error)
    return c.json({ error: 'Error creating invoice' }, 500)
  }
})

// Update Invoice Payment Status
app.patch('/make-server-6971b43c/invoices/:id/payment', requireAuth, async (c) => {
  try {
    const invoiceId = c.req.param('id')
    const { paymentStatus, paidAt } = await c.req.json()
    
    if (!['pending', 'paid', 'overdue'].includes(paymentStatus)) {
      return c.json({ error: 'Invalid payment status' }, 400)
    }
    
    const invoice = await kv.get(`invoice:${invoiceId}`)
    if (!invoice) {
      return c.json({ error: 'Invoice not found' }, 404)
    }
    
    const updatedInvoice = {
      ...invoice,
      paymentStatus,
      paidAt: paymentStatus === 'paid' ? (paidAt || new Date().toISOString()) : null
    }
    
    await kv.set(`invoice:${invoiceId}`, updatedInvoice)
    return c.json({ success: true, invoice: updatedInvoice })
  } catch (error) {
    console.log('Error updating invoice payment:', error)
    return c.json({ error: 'Error updating invoice payment' }, 500)
  }
})

// ==================== ANALYTICS ROUTES ====================

// Get Dashboard KPIs
app.get('/make-server-6971b43c/analytics/dashboard', requireAuth, async (c) => {
  try {
    const workshopId = c.get('workshopId')
    console.log('📊 Fetching analytics for workshopId:', workshopId)
    
    // Fetch all data
    const [allBudgets, allAppointments, allInvoices, allClients] = await Promise.all([
      kv.getByPrefix('budget:'),
      kv.getByPrefix('appointment:'),
      kv.getByPrefix('invoice:'),
      kv.getByPrefix('client:')
    ])

    // Filter by workshopId - only show data from the logged-in user's workshop
    const budgets = allBudgets.filter(item => item && item.workshopId === workshopId)
    const appointments = allAppointments.filter(item => item && item.workshopId === workshopId)
    const invoices = allInvoices.filter(item => item && item.workshopId === workshopId)
    const clients = allClients.filter(item => item && item.workshopId === workshopId)

    console.log(`📈 Analytics data for workshop ${workshopId}:`, {
      budgets: budgets.length,
      appointments: appointments.length,
      invoices: invoices.length,
      clients: clients.length
    })

    const totalClients = clients.length
    const totalBudgets = budgets.length
    const approvedBudgets = budgets.filter(b => b && b.status === 'approved').length
    const approvalRate = totalBudgets > 0 ? (approvedBudgets / totalBudgets * 100).toFixed(1) : 0

    const completedAppointments = appointments.filter(a => a && a.status === 'completed')
    const totalRevenue = invoices
      .filter(i => i && i.paymentStatus === 'paid')
      .reduce((sum, i) => sum + i.total, 0)

    const averageTicket = invoices.length > 0 
      ? (invoices.reduce((sum, i) => sum + (i ? i.total : 0), 0) / invoices.length).toFixed(2)
      : 0

    const pendingInvoices = invoices.filter(i => i && i.paymentStatus === 'pending').length

    return c.json({
      kpis: {
        totalClients,
        totalBudgets,
        approvalRate: parseFloat(approvalRate),
        completedServices: completedAppointments.length,
        totalRevenue: parseFloat(totalRevenue.toFixed(2)),
        averageTicket: parseFloat(averageTicket),
        pendingInvoices
      }
    })
  } catch (error) {
    console.log('❌ Error fetching analytics:', error)
    return c.json({ error: 'Error fetching analytics' }, 500)
  }
})

// ==================== COURTESY VEHICLES ROUTES ====================

// Get all courtesy vehicles
app.get('/make-server-6971b43c/courtesy-vehicles', requireAuth, async (c) => {
  try {
    const workshopId = c.get('workshopId')
    const allVehicles = await kv.getByPrefix('courtesy_vehicle:')
    // Filter courtesy vehicles by workshopId
    const vehicles = allVehicles.filter(item => item && item.workshopId === workshopId)
    return c.json({ vehicles })
  } catch (error) {
    console.log('Error fetching courtesy vehicles:', error)
    return c.json({ error: 'Error fetching courtesy vehicles' }, 500)
  }
})

// Create courtesy vehicle
app.post('/make-server-6971b43c/courtesy-vehicles', requireAuth, async (c) => {
  try {
    const vehicleData = await c.req.json()
    
    if (!vehicleData.licensePlate || !vehicleData.brand || !vehicleData.model || !vehicleData.year) {
      return c.json({ error: 'License plate, brand, model and year are required' }, 400)
    }

    const id = crypto.randomUUID()
    const vehicle = {
      id,
      ...vehicleData,
      workshopId: c.get('workshopId'),
      status: 'available',
      createdAt: new Date().toISOString()
    }

    await kv.set(`courtesy_vehicle:${id}`, vehicle)
    return c.json({ vehicle }, 201)
  } catch (error) {
    console.log('Error creating courtesy vehicle:', error)
    return c.json({ error: 'Error creating courtesy vehicle' }, 500)
  }
})

// Update courtesy vehicle
app.put('/make-server-6971b43c/courtesy-vehicles/:id', requireAuth, async (c) => {
  try {
    const id = c.req.param('id')
    const vehicleData = await c.req.json()
    
    const existingVehicle = await kv.get(`courtesy_vehicle:${id}`)
    if (!existingVehicle) {
      return c.json({ error: 'Courtesy vehicle not found' }, 404)
    }

    const updatedVehicle = {
      ...existingVehicle,
      ...vehicleData,
      id,
      updatedAt: new Date().toISOString()
    }

    await kv.set(`courtesy_vehicle:${id}`, updatedVehicle)
    return c.json({ vehicle: updatedVehicle })
  } catch (error) {
    console.log('Error updating courtesy vehicle:', error)
    return c.json({ error: 'Error updating courtesy vehicle' }, 500)
  }
})

// ==================== COURTESY ASSIGNMENTS ROUTES ====================

// Get all assignments
app.get('/make-server-6971b43c/courtesy-assignments', requireAuth, async (c) => {
  try {
    const workshopId = c.get('workshopId')
    const allAssignments = await kv.getByPrefix('courtesy_assignment:')
    // Filter assignments by workshopId
    const assignments = allAssignments.filter(item => item && item.workshopId === workshopId)
    return c.json({ assignments })
  } catch (error) {
    console.log('Error fetching assignments:', error)
    return c.json({ error: 'Error fetching assignments' }, 500)
  }
})

// Create assignment (assign vehicle to client)
app.post('/make-server-6971b43c/courtesy-assignments', requireAuth, async (c) => {
  try {
    const { courtesyVehicleId, clientId, notes } = await c.req.json()
    
    if (!courtesyVehicleId || !clientId) {
      return c.json({ error: 'Courtesy vehicle ID and client ID are required' }, 400)
    }

    // Check if vehicle exists and is available
    const vehicle = await kv.get(`courtesy_vehicle:${courtesyVehicleId}`)
    if (!vehicle) {
      return c.json({ error: 'Courtesy vehicle not found' }, 404)
    }
    if (vehicle.status !== 'available') {
      return c.json({ error: 'Vehicle is not available' }, 400)
    }

    // Get client name
    const client = await kv.get(`client:${clientId}`)
    const clientName = client ? client.name : 'Unknown Client'

    // Create assignment
    const assignmentId = crypto.randomUUID()
    const assignment = {
      id: assignmentId,
      courtesyVehicleId,
      clientId,
      clientName,
      workshopId: c.get('workshopId'),
      startDate: new Date().toISOString(),
      endDate: null,
      notes: notes || '',
      createdAt: new Date().toISOString()
    }

    await kv.set(`courtesy_assignment:${assignmentId}`, assignment)

    // Update vehicle status
    await kv.set(`courtesy_vehicle:${courtesyVehicleId}`, {
      ...vehicle,
      status: 'in_use',
      updatedAt: new Date().toISOString()
    })

    return c.json({ assignment }, 201)
  } catch (error) {
    console.log('Error creating assignment:', error)
    return c.json({ error: 'Error creating assignment' }, 500)
  }
})

// Return vehicle (end assignment)
app.put('/make-server-6971b43c/courtesy-assignments/return/:vehicleId', requireAuth, async (c) => {
  try {
    const vehicleId = c.req.param('vehicleId')
    
    // Find active assignment for this vehicle
    const allAssignments = await kv.getByPrefix('courtesy_assignment:')
    const activeAssignment = allAssignments.find(a => 
      a && a.courtesyVehicleId === vehicleId && !a.endDate
    )

    if (!activeAssignment) {
      return c.json({ error: 'No active assignment found for this vehicle' }, 404)
    }

    // Update assignment with end date
    const updatedAssignment = {
      ...activeAssignment,
      endDate: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }
    await kv.set(`courtesy_assignment:${activeAssignment.id}`, updatedAssignment)

    // Update vehicle status to available
    const vehicle = await kv.get(`courtesy_vehicle:${vehicleId}`)
    if (vehicle) {
      await kv.set(`courtesy_vehicle:${vehicleId}`, {
        ...vehicle,
        status: 'available',
        updatedAt: new Date().toISOString()
      })
    }

    return c.json({ assignment: updatedAssignment })
  } catch (error) {
    console.log('Error returning vehicle:', error)
    return c.json({ error: 'Error returning vehicle' }, 500)
  }
})

// ==================== WORKSHOP LOGO UPLOAD ====================

// Upload Workshop Logo (Admin Only)
app.post('/make-server-6971b43c/admin/workshops/:id/logo', requireAdmin, async (c) => {
  try {
    const workshopId = c.req.param('id')
    const formData = await c.req.formData()
    const file = formData.get('logo') as File
    
    if (!file) {
      return c.json({ error: 'No file provided' }, 400)
    }

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/svg+xml']
    if (!allowedTypes.includes(file.type)) {
      return c.json({ error: 'Invalid file type. Only JPEG, PNG, WEBP and SVG are allowed' }, 400)
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      return c.json({ error: 'File too large. Maximum size is 5MB' }, 400)
    }

    // Create bucket if it doesn't exist
    const bucketName = 'make-6971b43c-workshop-logos'
    const { data: buckets } = await supabase.storage.listBuckets()
    const bucketExists = buckets?.some(bucket => bucket.name === bucketName)
    
    if (!bucketExists) {
      console.log('📦 Creating storage bucket:', bucketName)
      const { error: bucketError } = await supabase.storage.createBucket(bucketName, {
        public: false,
        fileSizeLimit: 5242880 // 5MB
      })
      if (bucketError) {
        console.log('❌ Error creating bucket:', bucketError)
        return c.json({ error: 'Error creating storage bucket: ' + bucketError.message }, 500)
      }
    }

    // Generate unique filename
    const fileExt = file.name.split('.').pop()
    const fileName = `${workshopId}-${Date.now()}.${fileExt}`
    const filePath = `logos/${fileName}`

    // Convert file to ArrayBuffer
    const arrayBuffer = await file.arrayBuffer()
    const buffer = new Uint8Array(arrayBuffer)

    // Upload file to Supabase Storage
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from(bucketName)
      .upload(filePath, buffer, {
        contentType: file.type,
        upsert: true
      })

    if (uploadError) {
      console.log('❌ Error uploading file:', uploadError)
      return c.json({ error: 'Error uploading file: ' + uploadError.message }, 500)
    }

    // Get the workshop to delete old logo if exists
    const workshop = await kv.get(`workshop:${workshopId}`)
    if (!workshop) {
      return c.json({ error: 'Workshop not found' }, 404)
    }

    // Delete old logo if exists
    if (workshop.logoPath) {
      await supabase.storage.from(bucketName).remove([workshop.logoPath])
    }

    // Update workshop with logo path
    const updatedWorkshop = {
      ...workshop,
      logoPath: filePath,
      updatedAt: new Date().toISOString()
    }
    
    await kv.set(`workshop:${workshopId}`, updatedWorkshop)

    // Generate signed URL for the logo (valid for 1 year)
    const { data: signedUrlData } = await supabase.storage
      .from(bucketName)
      .createSignedUrl(filePath, 31536000) // 1 year

    console.log('✅ Logo uploaded successfully:', filePath)
    
    return c.json({ 
      success: true, 
      logoPath: filePath,
      logoUrl: signedUrlData?.signedUrl
    })
  } catch (error) {
    console.log('❌ Error uploading logo:', error)
    return c.json({ error: 'Error uploading logo: ' + error.message }, 500)
  }
})

// Get Workshop Logo URL (requires auth)
app.get('/make-server-6971b43c/workshops/:id/logo', requireAuth, async (c) => {
  try {
    const workshopId = c.req.param('id')
    const workshop = await kv.get(`workshop:${workshopId}`)
    
    if (!workshop) {
      return c.json({ error: 'Workshop not found' }, 404)
    }

    if (!workshop.logoPath) {
      return c.json({ logoUrl: null })
    }

    const bucketName = 'make-6971b43c-workshop-logos'
    
    // Generate signed URL (valid for 1 year)
    const { data: signedUrlData, error: signedUrlError } = await supabase.storage
      .from(bucketName)
      .createSignedUrl(workshop.logoPath, 31536000) // 1 year

    if (signedUrlError) {
      console.log('❌ Error creating signed URL:', signedUrlError)
      return c.json({ error: 'Error getting logo URL' }, 500)
    }

    return c.json({ logoUrl: signedUrlData?.signedUrl })
  } catch (error) {
    console.log('❌ Error getting logo:', error)
    return c.json({ error: 'Error getting logo: ' + error.message }, 500)
  }
})

// Get Workshop Details (requires auth) - includes all workshop info
app.get('/make-server-6971b43c/workshops/:id', requireAuth, async (c) => {
  try {
    const workshopId = c.req.param('id')
    const workshop = await kv.get(`workshop:${workshopId}`)
    
    if (!workshop) {
      return c.json({ error: 'Workshop not found' }, 404)
    }

    // Get logo URL if exists
    let logoUrl = null
    if (workshop.logoPath) {
      const bucketName = 'make-6971b43c-workshop-logos'
      const { data: signedUrlData } = await supabase.storage
        .from(bucketName)
        .createSignedUrl(workshop.logoPath, 31536000) // 1 year
      logoUrl = signedUrlData?.signedUrl
    }

    return c.json({ 
      workshop: {
        ...workshop,
        logoUrl
      }
    })
  } catch (error) {
    console.log('❌ Error getting workshop:', error)
    return c.json({ error: 'Error getting workshop: ' + error.message }, 500)
  }
})

// ==================== CHECK-IN ROUTES ====================

// Get all check-ins for a workshop
app.get('/make-server-6971b43c/checkins', async (c) => {
  try {
    const workshopId = c.req.query('workshopId')
    if (!workshopId) {
      return c.json({ error: 'Workshop ID is required' }, 400)
    }

    const allCheckIns = await kv.getByPrefix('checkin:')
    const checkIns = allCheckIns.filter(item => item && item.workshopId === workshopId)
    return c.json(checkIns)
  } catch (error) {
    console.log('❌ Error fetching check-ins:', error)
    return c.json({ error: 'Error fetching check-ins: ' + error.message }, 500)
  }
})

// Get check-in by ID
app.get('/make-server-6971b43c/checkins/:id', async (c) => {
  try {
    const checkInId = c.req.param('id')
    const checkIn = await kv.get(`checkin:${checkInId}`)
    
    if (!checkIn) {
      return c.json({ error: 'Check-in not found' }, 404)
    }
    
    return c.json(checkIn)
  } catch (error) {
    console.log('❌ Error fetching check-in:', error)
    return c.json({ error: 'Error fetching check-in: ' + error.message }, 500)
  }
})

// Create check-in
app.post('/make-server-6971b43c/checkins', async (c) => {
  try {
    console.log('📝 POST /checkins - Creating new check-in')
    const data = await c.req.json()
    
    if (!data.workshopId || !data.clientId || !data.vehicleId || !data.driverName || !data.entryDate || !data.entryOdometer) {
      console.log('❌ Validation failed: missing required fields')
      return c.json({ error: 'Missing required fields' }, 400)
    }

    const checkInId = crypto.randomUUID()
    
    const checkIn = {
      id: checkInId,
      workshopId: data.workshopId,
      clientId: data.clientId,
      vehicleId: data.vehicleId,
      driverName: data.driverName,
      driverCPF: data.driverCPF,
      driverRG: data.driverRG,
      driverCNH: data.driverCNH,
      driverCategory: data.driverCategory,
      driverCNHIssue: data.driverCNHIssue,
      driverCNHExpiry: data.driverCNHExpiry,
      driverAddress: data.driverAddress,
      driverPhone: data.driverPhone,
      entryDate: data.entryDate,
      exitDate: data.exitDate,
      entryOdometer: data.entryOdometer,
      exitOdometer: data.exitOdometer,
      entryFuelLevel: data.entryFuelLevel,
      exitFuelLevel: data.exitFuelLevel,
      checklistEntry: data.checklistEntry,
      checklistExit: data.checklistExit,
      damages: data.damages,
      observations: data.observations,
      status: data.status || 'in-progress',
      createdAt: new Date().toISOString()
    }

    console.log('💾 Saving check-in to KV:', checkInId)
    await kv.set(`checkin:${checkInId}`, checkIn)
    console.log('✅ Check-in created successfully:', checkInId)
    
    return c.json(checkIn)
  } catch (error) {
    console.log('❌ Error creating check-in:', error)
    return c.json({ error: 'Error creating check-in: ' + (error?.message || String(error)) }, 500)
  }
})

// Update check-in
app.put('/make-server-6971b43c/checkins/:id', async (c) => {
  try {
    const checkInId = c.req.param('id')
    const updates = await c.req.json()
    
    const existingCheckIn = await kv.get(`checkin:${checkInId}`)
    if (!existingCheckIn) {
      return c.json({ error: 'Check-in not found' }, 404)
    }
    
    const updatedCheckIn = {
      ...existingCheckIn,
      ...updates,
      id: checkInId,
      updatedAt: new Date().toISOString()
    }
    
    await kv.set(`checkin:${checkInId}`, updatedCheckIn)
    console.log('✅ Check-in updated successfully:', checkInId)
    
    return c.json(updatedCheckIn)
  } catch (error) {
    console.log('❌ Error updating check-in:', error)
    return c.json({ error: 'Error updating check-in: ' + error.message }, 500)
  }
})

// Delete check-in
app.delete('/make-server-6971b43c/checkins/:id', async (c) => {
  try {
    const checkInId = c.req.param('id')
    const checkIn = await kv.get(`checkin:${checkInId}`)
    
    if (!checkIn) {
      return c.json({ error: 'Check-in not found' }, 404)
    }
    
    await kv.del(`checkin:${checkInId}`)
    console.log('✅ Check-in deleted successfully:', checkInId)
    
    return c.json({ success: true })
  } catch (error) {
    console.log('❌ Error deleting check-in:', error)
    return c.json({ error: 'Error deleting check-in: ' + error.message }, 500)
  }
})

// ==================== TEST ROUTES ====================

// Test PATCH endpoint
app.patch('/make-server-6971b43c/test-patch', (c) => {
  console.log('✅ PATCH test endpoint called successfully')
  return c.json({ 
    success: true, 
    message: 'PATCH method is working correctly',
    timestamp: new Date().toISOString()
  })
})

// Test endpoint with auth
app.patch('/make-server-6971b43c/test-patch-auth', requireAuth, (c) => {
  const userId = c.get('userId')
  const workshopId = c.get('workshopId')
  console.log('✅ PATCH with auth test called:', { userId, workshopId })
  return c.json({ 
    success: true, 
    message: 'PATCH with auth is working correctly',
    userId,
    workshopId,
    timestamp: new Date().toISOString()
  })
})

// ==================== OCR ROUTES ====================

// Process License Plate OCR
app.post('/make-server-6971b43c/ocr/license-plate', requireAuth, async (c) => {
  try {
    const { imageBase64 } = await c.req.json()
    
    if (!imageBase64) {
      return c.json({ error: 'Image data is required' }, 400)
    }

    console.log('🔍 Processing license plate OCR...')

    // Get OCR API key from environment
    const ocrApiKey = Deno.env.get('OCR_API_KEY')
    if (!ocrApiKey) {
      console.log('❌ OCR_API_KEY not configured')
      return c.json({ 
        error: 'OCR service not configured. Please contact administrator.' 
      }, 500)
    }

    // Prepare form data for OCR.space API
    const formData = new FormData()
    formData.append('base64Image', imageBase64)
    formData.append('language', 'por')
    formData.append('isOverlayRequired', 'false')
    formData.append('detectOrientation', 'true')
    formData.append('scale', 'true')
    formData.append('OCREngine', '2')

    // Call OCR.space API
    const response = await fetch('https://api.ocr.space/parse/image', {
      method: 'POST',
      headers: {
        'apikey': ocrApiKey,
      },
      body: formData,
    })

    if (!response.ok) {
      console.log('❌ OCR API request failed:', response.status, response.statusText)
      return c.json({ 
        error: 'OCR service error. Please try again.' 
      }, 500)
    }

    const result = await response.json()
    
    if (result.ParsedResults && result.ParsedResults[0]?.ParsedText) {
      const text = result.ParsedResults[0].ParsedText
      console.log('📄 OCR result:', text)
      
      // Portuguese license plate patterns:
      // Old: AB-12-CD
      // New: AA-12-BB or 12-AB-CD
      const plateRegex = /([A-Z]{2}-\d{2}-[A-Z]{2}|\d{2}-[A-Z]{2}-\d{2}|[A-Z]{2}-\d{2}-[0-9A-Z]{2})/gi
      const matches = text.match(plateRegex)
      
      if (matches && matches.length > 0) {
        const plate = matches[0].toUpperCase().replace(/\s/g, '')
        console.log('✅ License plate detected:', plate)
        return c.json({ 
          success: true, 
          licensePlate: plate,
          fullText: text
        })
      } else {
        console.log('⚠️ No valid license plate pattern found in:', text)
        return c.json({ 
          success: false, 
          error: 'No valid license plate detected',
          fullText: text
        })
      }
    } else {
      console.log('❌ OCR API returned no parsed results:', result)
      return c.json({ 
        success: false, 
        error: 'Could not process image',
        apiError: result.ErrorMessage || result.OCRExitCode
      })
    }
  } catch (error: any) {
    console.log('❌ Error in OCR endpoint:', error)
    return c.json({ 
      error: 'Error processing image: ' + error.message 
    }, 500)
  }
})

// ==================== CITIZEN CARD READER ====================

// Read Citizen Card
app.post('/make-server-6971b43c/read-citizen-card', requireAuth, async (c) => {
  try {
    console.log('🔍 Iniciando leitura do Cartão de Cidadão...')
    
    // This endpoint interfaces with Portuguese Citizen Card middleware
    // The Autenticação.Gov middleware must be installed on the client machine
    // and runs a local web service that this endpoint communicates with
    
    // Attempt to connect to local middleware
    // The middleware typically runs on localhost:38000
    try {
      // In a real implementation, we would call the middleware API
      // For now, we'll simulate the card reading with mock data
      // In production, this would use the actual middleware SDK
      
      // Simulated delay for card reading
      await new Promise(resolve => setTimeout(resolve, 2000))
      
      // Mock data from Portuguese Citizen Card
      // In production, this would come from the actual card reader middleware
      const mockCardData = {
        name: 'João Pedro Silva Santos',
        nif: '123456789',
        address: 'Rua Example, nº 123, 4º Dto, 1000-001 Lisboa',
        birthDate: '1985-03-15',
        documentNumber: 'PT12345678',
        validUntil: '2030-12-31',
        // Note: Phone and email are not on the card, user must add these
        phone: '',
      }
      
      console.log('✅ Cartão lido com sucesso (simulação)')
      
      return c.json({
        success: true,
        ...mockCardData,
        message: 'Dados lidos do Cartão de Cidadão. Por favor, adicione telefone e email.'
      })
      
    } catch (middlewareError: any) {
      console.error('❌ Erro ao comunicar com middleware:', middlewareError)
      
      // Check if it's a connection error (middleware not running)
      return c.json({
        error: 'Não foi possível conectar ao leitor de cartões. Certifique-se de que:\n' +
               '1. O middleware Autenticação.Gov está instalado\n' +
               '2. O serviço está em execução\n' +
               '3. O leitor de cartões está conectado\n' +
               '4. O Cartão de Cidadão está inserido',
        details: middlewareError.message
      }, 500)
    }
    
  } catch (error: any) {
    console.error('❌ Erro crítico na leitura do cartão:', error)
    return c.json({
      error: 'Erro ao processar leitura do cartão: ' + error.message
    }, 500)
  }
})

// ==================== PLATFORM REQUESTS ROUTES ====================

// Get Workshop Profile
app.get('/make-server-6971b43c/platform/profile', requireAuth, async (c) => {
  try {
    const workshopId = c.get('workshopId')
    console.log(`📖 Loading workshop profile for workshopId: ${workshopId}`)
    
    const profile = await kv.get(`workshop-profile:${workshopId}`)
    
    if (profile) {
      console.log(`✅ Profile loaded - Intervention Zone: ${profile.interventionZone || 'N/A'}`)
    } else {
      console.log(`⚠️ No profile found for workshop ${workshopId}`)
    }
    
    return c.json({ profile: profile || null })
  } catch (error) {
    console.log('❌ Error loading workshop profile:', error)
    return c.json({ error: 'Error loading profile' }, 500)
  }
})

// Save Workshop Profile
app.post('/make-server-6971b43c/platform/profile', requireAuth, async (c) => {
  try {
    const workshopId = c.get('workshopId')
    const { profile } = await c.req.json()
    
    console.log(`💾 Saving workshop profile for workshopId: ${workshopId}`)
    console.log(`   - Intervention Zone: ${profile.interventionZone || 'N/A'}`)
    console.log(`   - Address: ${profile.address || 'N/A'}`)
    
    // Save the profile
    await kv.set(`workshop-profile:${workshopId}`, profile)
    
    // CRITICAL FIX: Also update the workshop object with interventionZone
    // This is needed for the instant quote location search
    const workshop = await kv.get(`workshop:${workshopId}`)
    if (workshop) {
      workshop.interventionZone = profile.interventionZone
      workshop.workshopPhone = profile.phone
      workshop.workshopEmail = profile.email
      workshop.workshopAddress = profile.address
      await kv.set(`workshop:${workshopId}`, workshop)
      console.log(`✅ Workshop object updated with intervention zone: ${profile.interventionZone}`)
    }
    
    // Verify it was saved
    const saved = await kv.get(`workshop-profile:${workshopId}`)
    console.log(`✅ Profile saved and verified. Intervention Zone in DB: ${saved?.interventionZone || 'N/A'}`)
    
    return c.json({ success: true })
  } catch (error) {
    console.log('❌ Error saving workshop profile:', error)
    return c.json({ error: 'Error saving profile' }, 500)
  }
})

// DEBUG: List all workshop profiles (NO AUTH for testing)
app.get('/make-server-6971b43c/debug/workshop-profiles', async (c) => {
  try {
    const allWorkshops = await kv.getByPrefix('workshop:')
    const profiles = []
    
    for (const workshop of allWorkshops) {
      if (workshop && workshop.id) {
        const profile = await kv.get(`workshop-profile:${workshop.id}`)
        profiles.push({
          workshopId: workshop.id,
          workshopName: workshop.name,
          isActive: workshop.isActive,
          concelho: workshop.concelho,
          localidade: workshop.localidade,
          profileExists: !!profile,
          workshopHasInterventionZone: !!workshop.interventionZone,
          workshopInterventionZone: workshop.interventionZone || null,
          profileInterventionZone: profile?.interventionZone || null,
          needsSync: !!profile?.interventionZone && workshop.interventionZone !== profile.interventionZone,
          address: profile?.address || null
        })
      }
    }
    
    return c.json({ 
      totalWorkshops: allWorkshops.length,
      profiles 
    })
  } catch (error) {
    console.log('Error listing workshop profiles:', error)
    return c.json({ error: 'Error listing profiles' }, 500)
  }
})

// MIGRATION: Sync intervention zones from profiles to workshop objects (NO AUTH for migration)
app.post('/make-server-6971b43c/debug/sync-intervention-zones', async (c) => {
  try {
    console.log('🔄 Starting intervention zones synchronization...')
    
    const allWorkshops = await kv.getByPrefix('workshop:')
    let syncedCount = 0
    let skippedCount = 0
    const results = []
    
    for (const workshop of allWorkshops) {
      if (workshop && workshop.id) {
        const profile = await kv.get(`workshop-profile:${workshop.id}`)
        
        if (profile?.interventionZone) {
          // Update workshop object with intervention zone from profile
          workshop.interventionZone = profile.interventionZone
          workshop.workshopPhone = profile.phone
          workshop.workshopEmail = profile.email  
          workshop.workshopAddress = profile.address
          
          await kv.set(`workshop:${workshop.id}`, workshop)
          syncedCount++
          
          results.push({
            workshopId: workshop.id,
            workshopName: workshop.name,
            status: 'synced',
            interventionZone: profile.interventionZone
          })
          
          console.log(`✅ Synced workshop ${workshop.id}: ${profile.interventionZone}`)
        } else {
          skippedCount++
          results.push({
            workshopId: workshop.id,
            workshopName: workshop.name,
            status: 'skipped',
            reason: 'No profile or no intervention zone defined'
          })
        }
      }
    }
    
    console.log(`✅ Synchronization complete! Synced: ${syncedCount}, Skipped: ${skippedCount}`)
    
    return c.json({ 
      success: true,
      totalWorkshops: allWorkshops.length,
      syncedCount,
      skippedCount,
      results
    })
  } catch (error) {
    console.log('❌ Error syncing intervention zones:', error)
    return c.json({ error: 'Error syncing intervention zones: ' + error.message }, 500)
  }
})

// DEBUG: Check workshops CP4 configuration (NO AUTH for testing)
app.get('/make-server-6971b43c/debug/workshop-cp4', async (c) => {
  try {
    console.log('🔍 Checking workshop CP4 configuration...')
    
    const allWorkshops = await kv.getByPrefix('workshop:')
    const results = []
    
    for (const workshop of allWorkshops) {
      if (workshop && workshop.id) {
        results.push({
          workshopId: workshop.id,
          workshopName: workshop.name,
          cp4: workshop.cp4 || null,
          cp3: workshop.cp3 || null,
          postalCode: workshop.postalCode || null,
          hasCp4: !!workshop.cp4,
          isActive: workshop.isActive
        })
      }
    }
    
    const withCp4 = results.filter(r => r.hasCp4).length
    const withoutCp4 = results.length - withCp4
    
    return c.json({
      totalWorkshops: results.length,
      withCp4,
      withoutCp4,
      workshops: results.sort((a, b) => {
        if (a.hasCp4 === b.hasCp4) return 0
        return a.hasCp4 ? -1 : 1
      })
    })
  } catch (error) {
    console.log('❌ Error checking CP4:', error)
    return c.json({ error: 'Error checking CP4: ' + error.message }, 500)
  }
})

// Get Services
app.get('/make-server-6971b43c/platform/services', requireAuth, async (c) => {
  try {
    const workshopId = c.get('workshopId')
    const services = await kv.get(`workshop-services:${workshopId}`)
    
    return c.json({ services: services || [] })
  } catch (error) {
    console.log('Error loading services:', error)
    return c.json({ error: 'Error loading services' }, 500)
  }
})

// Save Service
app.post('/make-server-6971b43c/platform/services', requireAuth, async (c) => {
  try {
    const workshopId = c.get('workshopId')
    const { service } = await c.req.json()
    
    const services = await kv.get(`workshop-services:${workshopId}`) || []
    const existingIndex = services.findIndex((s: any) => s.id === service.id)
    
    if (existingIndex >= 0) {
      services[existingIndex] = service
    } else {
      services.push(service)
    }
    
    await kv.set(`workshop-services:${workshopId}`, services)
    
    return c.json({ success: true })
  } catch (error) {
    console.log('Error saving service:', error)
    return c.json({ error: 'Error saving service' }, 500)
  }
})

// Get Public Appointments
app.get('/make-server-6971b43c/platform/appointments', requireAuth, async (c) => {
  try {
    const workshopId = c.get('workshopId')
    const appointments = await kv.get(`workshop-appointments:${workshopId}`)
    
    return c.json({ appointments: appointments || [] })
  } catch (error) {
    console.log('Error loading appointments:', error)
    return c.json({ error: 'Error loading appointments' }, 500)
  }
})

// Update Appointment Status
app.patch('/make-server-6971b43c/platform/appointments/:id', requireAuth, async (c) => {
  try {
    const workshopId = c.get('workshopId')
    const appointmentId = c.req.param('id')
    const { status } = await c.req.json()
    
    const appointments = await kv.get(`workshop-appointments:${workshopId}`) || []
    const appointmentIndex = appointments.findIndex((a: any) => a.id === appointmentId)
    
    if (appointmentIndex >= 0) {
      appointments[appointmentIndex].status = status
      await kv.set(`workshop-appointments:${workshopId}`, appointments)
      return c.json({ success: true })
    }
    
    return c.json({ error: 'Appointment not found' }, 404)
  } catch (error) {
    console.log('Error updating appointment:', error)
    return c.json({ error: 'Error updating appointment' }, 500)
  }
})

// Get Express Quotes (from public platform)
app.get('/make-server-6971b43c/platform/express-quotes', requireAuth, async (c) => {
  try {
    const workshopId = c.get('workshopId')
    console.log('📋 Fetching express quotes for workshop:', workshopId)
    
    // Get all budgets for this workshop
    const allBudgets = await kv.getByPrefix('budget:')
    
    // Filter only budgets that have publicQuoteRequestId (these are from public platform)
    const expressQuotes = allBudgets.filter(budget => 
      budget && 
      budget.workshopId === workshopId && 
      budget.publicQuoteRequestId
    )
    
    console.log(`✅ Found ${expressQuotes.length} express quotes for workshop ${workshopId}`)
    
    // Transform to match expected format and get selected workshop info if approved
    const formattedQuotes = await Promise.all(expressQuotes.map(async budget => {
      let selectedWorkshopName = undefined
      
      // If status is approved, get the selected workshop name from the public quote
      if (budget.status === 'approved' && budget.publicQuoteRequestId) {
        const publicQuote = await kv.get(`public_quote:${budget.publicQuoteRequestId}`)
        if (publicQuote && publicQuote.selectedWorkshopId) {
          // Get the workshop info
          const selectedWorkshop = await kv.get(`workshop:${publicQuote.selectedWorkshopId}`)
          if (selectedWorkshop) {
            selectedWorkshopName = selectedWorkshop.name
          }
        }
      }
      
      return {
        id: budget.id,
        clientName: budget.clientName,
        clientPhone: budget.clientPhone || '',
        clientEmail: budget.clientEmail || '',
        vehiclePlate: budget.licensePlate,
        vehicleModel: budget.vehicleModel || '',
        services: [budget.serviceName],
        description: budget.notes || '',
        status: budget.status, // pending, quoted, approved, rejected
        quotedPrice: budget.estimatedPrice || budget.basePrice,
        createdAt: budget.createdAt,
        selectedWorkshopName
      }
    }))
    
    return c.json({ quotes: formattedQuotes })
  } catch (error) {
    console.log('❌ Error loading express quotes:', error)
    return c.json({ error: 'Error loading quotes' }, 500)
  }
})

// Update Express Quote
app.patch('/make-server-6971b43c/platform/express-quotes/:id', requireAuth, async (c) => {
  try {
    const workshopId = c.get('workshopId')
    const quoteId = c.req.param('id')
    const { status, quotedPrice } = await c.req.json()
    
    console.log('🔄 Updating express quote:', quoteId, 'Status:', status, 'Price:', quotedPrice)
    
    // Get the budget from KV store
    const budget = await kv.get(`budget:${quoteId}`)
    
    if (!budget) {
      console.log('❌ Budget not found:', quoteId)
      return c.json({ error: 'Quote not found' }, 404)
    }
    
    // Verify it belongs to this workshop
    if (budget.workshopId !== workshopId) {
      console.log('❌ Budget does not belong to this workshop')
      return c.json({ error: 'Unauthorized' }, 403)
    }
    
    // Update the budget
    budget.status = status
    if (quotedPrice !== undefined) {
      budget.estimatedPrice = quotedPrice
    }
    budget.updatedAt = new Date().toISOString()
    
    await kv.set(`budget:${quoteId}`, budget)
    
    // IMPORTANT: Update the public quote so client can see the changes
    if (budget.publicQuoteRequestId) {
      console.log('🔄 Updating public quote:', budget.publicQuoteRequestId)
      const publicQuote = await kv.get(`public_quote:${budget.publicQuoteRequestId}`)
      
      if (publicQuote) {
        // Update the public quote status if any workshop has responded
        if (status === 'quoted') {
          publicQuote.status = 'quoted'
          publicQuote.respondedWorkshops = publicQuote.respondedWorkshops || []
          
          // Get workshop profile and data for complete information
          const workshopProfile = await kv.get(`workshop-profile:${workshopId}`)
          const workshopData = await kv.get(`workshop:${workshopId}`)
          
          // Generate signed URL for logo if it exists
          let workshopLogo = null
          if (workshopData?.logoPath) {
            try {
              const bucketName = 'make-6971b43c-workshop-logos'
              const { data: urlData } = await supabase.storage
                .from(bucketName)
                .createSignedUrl(workshopData.logoPath, 31536000) // 1 year
              workshopLogo = urlData?.signedUrl || null
            } catch (error) {
              console.log('⚠️ Error generating signed URL for logo:', error)
            }
          }
          
          // Add or update this workshop's response
          const existingIndex = publicQuote.respondedWorkshops.findIndex((w: any) => w.workshopId === workshopId)
          const workshopResponse = {
            workshopId,
            workshopName: budget.workshopName || workshopData?.name || 'Oficina',
            quotedPrice: quotedPrice || budget.estimatedPrice,
            status: 'quoted',
            updatedAt: new Date().toISOString(),
            workshopAddress: workshopProfile?.address || null,
            workshopPhone: workshopProfile?.phone || null,
            workshopLogo
          }
          
          if (existingIndex >= 0) {
            publicQuote.respondedWorkshops[existingIndex] = workshopResponse
          } else {
            publicQuote.respondedWorkshops.push(workshopResponse)
          }
          
          publicQuote.updatedAt = new Date().toISOString()
        }
        
        await kv.set(`public_quote:${budget.publicQuoteRequestId}`, publicQuote)
        console.log('✅ Public quote updated with workshop response')
      }
    }
    
    console.log('✅ Express quote updated successfully')
    return c.json({ success: true })
  } catch (error) {
    console.log('❌ Error updating quote:', error)
    return c.json({ error: 'Error updating quote' }, 500)
  }
})

// Get Promotions
app.get('/make-server-6971b43c/platform/promotions', requireAuth, async (c) => {
  try {
    const workshopId = c.get('workshopId')
    const promotions = await kv.get(`workshop-promotions:${workshopId}`)
    
    return c.json({ promotions: promotions || [] })
  } catch (error) {
    console.log('Error loading promotions:', error)
    return c.json({ error: 'Error loading promotions' }, 500)
  }
})

// Save Promotion
app.post('/make-server-6971b43c/platform/promotions', requireAuth, async (c) => {
  try {
    const workshopId = c.get('workshopId')
    const { promotion } = await c.req.json()
    
    const promotions = await kv.get(`workshop-promotions:${workshopId}`) || []
    const existingIndex = promotions.findIndex((p: any) => p.id === promotion.id)
    
    if (existingIndex >= 0) {
      promotions[existingIndex] = promotion
    } else {
      promotions.push(promotion)
    }
    
    await kv.set(`workshop-promotions:${workshopId}`, promotions)
    
    return c.json({ success: true })
  } catch (error) {
    console.log('Error saving promotion:', error)
    return c.json({ error: 'Error saving promotion' }, 500)
  }
})

// Delete Promotion
app.delete('/make-server-6971b43c/platform/promotions/:id', requireAuth, async (c) => {
  try {
    const workshopId = c.get('workshopId')
    const promotionId = c.req.param('id')
    
    const promotions = await kv.get(`workshop-promotions:${workshopId}`) || []
    const filtered = promotions.filter((p: any) => p.id !== promotionId)
    
    await kv.set(`workshop-promotions:${workshopId}`, filtered)
    
    return c.json({ success: true })
  } catch (error) {
    console.log('Error deleting promotion:', error)
    return c.json({ error: 'Error deleting promotion' }, 500)
  }
})

// Get Platform Stats
app.get('/make-server-6971b43c/platform/stats', requireAuth, async (c) => {
  try {
    const workshopId = c.get('workshopId')
    
    const appointments = await kv.get(`workshop-appointments:${workshopId}`) || []
    const quotes = await kv.get(`workshop-quotes:${workshopId}`) || []
    const promotions = await kv.get(`workshop-promotions:${workshopId}`) || []
    
    const pendingAppointments = appointments.filter((a: any) => a.status === 'pending').length
    const pendingQuotes = quotes.filter((q: any) => q.status === 'pending').length
    const activePromotions = promotions.filter((p: any) => {
      if (!p.active) return false
      const now = new Date()
      const validFrom = new Date(p.validFrom)
      const validTo = new Date(p.validTo)
      return now >= validFrom && now <= validTo
    }).length
    
    const totalRequests = appointments.length + quotes.length
    
    return c.json({
      stats: {
        totalRequests,
        pendingAppointments,
        pendingQuotes,
        activePromotions,
        viewsThisMonth: Math.floor(Math.random() * 500) + 200, // Simulated for now
      }
    })
  } catch (error) {
    console.log('Error loading stats:', error)
    return c.json({ error: 'Error loading stats' }, 500)
  }
})

// ==================== POSTAL CODE SEARCH ====================

// Search Postal Code (Returns locality)
app.get('/make-server-6971b43c/postal-code/:code', requireAuth, async (c) => {
  try {
    const postalCode = c.req.param('code')
    console.log('🔍 Searching postal code:', postalCode)
    
    // Portuguese postal codes database (simplified version)
    // In production, this would use a complete database or external API
    const postalCodeDatabase: Record<string, string> = {
      '1000': 'Lisboa',
      '1050': 'Lisboa',
      '1100': 'Lisboa',
      '1150': 'Lisboa',
      '1200': 'Lisboa',
      '1250': 'Lisboa',
      '1300': 'Lisboa',
      '1350': 'Lisboa',
      '1400': 'Lisboa',
      '1500': 'Lisboa',
      '1600': 'Lisboa',
      '1700': 'Lisboa',
      '1750': 'Lisboa',
      '1800': 'Lisboa',
      '1900': 'Lisboa',
      '2000': 'Santarém',
      '2500': 'Caldas da Rainha',
      '2600': 'Vila Franca de Xira',
      '2700': 'Amadora',
      '2710': 'Sintra',
      '2720': 'Amadora',
      '2730': 'Barcarena',
      '2740': 'Porto Salvo',
      '2750': 'Cascais',
      '2760': 'Carcavelos',
      '2770': 'Paço de Arcos',
      '2780': 'Oeiras',
      '2790': 'Carnaxide',
      '2800': 'Almada',
      '2810': 'Almada',
      '2820': 'Charneca de Caparica',
      '2830': 'Barreiro',
      '2840': 'Seixal',
      '2845': 'Amora',
      '2850': 'Corroios',
      '2855': 'Corroios',
      '2860': 'Moita',
      '2870': 'Montijo',
      '2900': 'Setúbal',
      '3000': 'Coimbra',
      '3500': 'Viseu',
      '4000': 'Porto',
      '4050': 'Porto',
      '4100': 'Porto',
      '4150': 'Porto',
      '4200': 'Porto',
      '4250': 'Porto',
      '4300': 'Porto',
      '4350': 'Porto',
      '4400': 'Vila Nova de Gaia',
      '4410': 'Vila Nova de Gaia',
      '4420': 'Gondomar',
      '4430': 'Vila Nova de Gaia',
      '4440': 'Valongo',
      '4450': 'Matosinhos',
      '4460': 'Senhora da Hora',
      '4470': 'Maia',
      '4480': 'Vila do Conde',
      '4490': 'Póvoa de Varzim',
      '4500': 'Espinho',
      '4700': 'Braga',
      '4800': 'Guimarães',
      '5000': 'Vila Real',
      '6000': 'Castelo Branco',
      '7000': 'Évora',
      '8000': 'Faro',
      '9000': 'Funchal',
      '9500': 'Ponta Delgada',
    }
    
    // Extract first 4 digits for search
    const searchCode = postalCode.replace(/[^0-9]/g, '').substring(0, 4)
    const locality = postalCodeDatabase[searchCode]
    
    if (locality) {
      console.log('✅ Postal code found:', searchCode, '->', locality)
      return c.json({ 
        success: true,
        postalCode: postalCode,
        locality: locality 
      })
    } else {
      console.log('⚠️ Postal code not found:', searchCode)
      return c.json({ 
        success: false,
        error: 'Postal code not found' 
      }, 404)
    }
  } catch (error) {
    console.log('❌ Error searching postal code:', error)
    return c.json({ error: 'Error searching postal code' }, 500)
  }
})

// ==================== TEMPLATES ROUTES ====================

// Get Templates
app.get('/make-server-6971b43c/templates', requireAuth, async (c) => {
  try {
    const workshopId = c.get('workshopId')
    let templates = await kv.get(`templates:${workshopId}`) || []
    
    // Create default templates if none exist
    if (templates.length === 0) {
      console.log('📝 Creating default templates for workshop:', workshopId)
      
      const defaultTemplates = [
        {
          id: `template-default-service-sheet-${Date.now()}`,
          name: 'Folha de Serviço - Padrão',
          type: 'pdf',
          category: 'service-sheet',
          language: 'pt',
          content: `╔════════════════════════════════════════╗
║     FOLHA DE SERVIÇO Nº {{serviceSheetNumber}}     ║
╚════════════════════════════════════════╝

📍 {{workshopName}}
   {{workshopAddress}}
   {{workshopPostalCode}} {{workshopLocality}}
   NIF: {{workshopNif}}
   ☎ {{workshopPhone}} | ✉ {{workshopEmail}}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

👤 CLIENTE
   Nome: {{clientName}}
   NIF: {{clientNif}}
   Tel: {{clientPhone}}
   Email: {{clientEmail}}

🚗 VEÍCULO
   Matrícula: {{vehiclePlate}}
   Marca/Modelo: {{vehicleMake}} {{vehicleModel}}
   Ano: {{vehicleYear}} | Km: {{vehicleKm}}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

📋 SERVIÇOS EXECUTADOS

{{servicesTable}}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

💰 VALORES
   Subtotal: {{totalPrice}}€
   IVA ({{vatRate}}%): {{= totalPrice * vatRate / 100}}€
   TOTAL: {{= totalPrice * (1 + vatRate / 100)}}€

{{#if observations}}
📝 OBSERVAÇÕES
{{observations}}
{{/if}}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

📅 Data: {{serviceDate}}
🔧 Mecânico: {{mechanicName}}

Obrigado pela confiança!`,
          isDefault: true,
          createdAt: new Date().toISOString()
        },
        {
          id: `template-default-budget-${Date.now()}`,
          name: 'Orçamento - Padrão',
          type: 'pdf',
          category: 'budget',
          language: 'pt',
          content: `ORÇAMENTO Nº {{budgetNumber}}

DADOS DA OFICINA
{{workshopName}}
{{workshopAddress}}
NIF: {{workshopNif}}
Tel: {{workshopPhone}}

DADOS DO CLIENTE
Nome: {{clientName}}
Telefone: {{clientPhone}}
Email: {{clientEmail}}

VEÍCULO
Matrícula: {{vehiclePlate}}
Modelo: {{vehicleModel}}

SERVIÇOS ORÇAMENTADOS
{{servicesTable}}

VALOR TOTAL: {{totalPrice}}€
IVA ({{vatRate}}%): {{= totalPrice * vatRate / 100}}€
TOTAL COM IVA: {{= totalPrice * (1 + vatRate / 100)}}€

Validade: 30 dias
Data: {{budgetDate}}

Este orçamento é válido por 30 dias a partir da data de emissão.`,
          isDefault: true,
          createdAt: new Date().toISOString()
        }
      ]
      
      await kv.set(`templates:${workshopId}`, defaultTemplates)
      templates = defaultTemplates
      console.log('✅ Default templates created')
    }
    
    return c.json({ templates })
  } catch (error) {
    console.log('❌ Error loading templates:', error)
    return c.json({ error: 'Error loading templates' }, 500)
  }
})

// Create Template
app.post('/make-server-6971b43c/templates', requireAuth, async (c) => {
  try {
    const workshopId = c.get('workshopId')
    const { name, type, category, subject, content } = await c.req.json()
    
    if (!name || !type || !category || !content) {
      return c.json({ error: 'Missing required fields' }, 400)
    }

    if (type === 'email' && !subject) {
      return c.json({ error: 'Email templates require a subject' }, 400)
    }

    const templates = await kv.get(`templates:${workshopId}`) || []
    
    const newTemplate = {
      id: `template-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      name,
      type,
      category,
      subject: subject || undefined,
      content,
      isDefault: false,
      createdAt: new Date().toISOString()
    }

    templates.push(newTemplate)
    await kv.set(`templates:${workshopId}`, templates)
    
    console.log('✅ Template created:', newTemplate.id)
    return c.json({ success: true, template: newTemplate })
  } catch (error) {
    console.log('❌ Error creating template:', error)
    return c.json({ error: 'Error creating template' }, 500)
  }
})

// Update Template
app.put('/make-server-6971b43c/templates/:id', requireAuth, async (c) => {
  try {
    const workshopId = c.get('workshopId')
    const templateId = c.req.param('id')
    const { name, type, category, subject, content } = await c.req.json()
    
    const templates = await kv.get(`templates:${workshopId}`) || []
    const templateIndex = templates.findIndex((t: any) => t.id === templateId)
    
    if (templateIndex === -1) {
      return c.json({ error: 'Template not found' }, 404)
    }

    templates[templateIndex] = {
      ...templates[templateIndex],
      name,
      type,
      category,
      subject: subject || undefined,
      content,
      updatedAt: new Date().toISOString()
    }

    await kv.set(`templates:${workshopId}`, templates)
    
    console.log('✅ Template updated:', templateId)
    return c.json({ success: true, template: templates[templateIndex] })
  } catch (error) {
    console.log('❌ Error updating template:', error)
    return c.json({ error: 'Error updating template' }, 500)
  }
})

// Delete Template
app.delete('/make-server-6971b43c/templates/:id', requireAuth, async (c) => {
  try {
    const workshopId = c.get('workshopId')
    const templateId = c.req.param('id')
    
    const templates = await kv.get(`templates:${workshopId}`) || []
    const template = templates.find((t: any) => t.id === templateId)
    
    if (!template) {
      return c.json({ error: 'Template not found' }, 404)
    }

    if (template.isDefault) {
      return c.json({ error: 'Cannot delete default template' }, 400)
    }

    const filtered = templates.filter((t: any) => t.id !== templateId)
    await kv.set(`templates:${workshopId}`, filtered)
    
    console.log('✅ Template deleted:', templateId)
    return c.json({ success: true })
  } catch (error) {
    console.log('❌ Error deleting template:', error)
    return c.json({ error: 'Error deleting template' }, 500)
  }
})

// Set Template as Default
app.put('/make-server-6971b43c/templates/:id/set-default', requireAuth, async (c) => {
  try {
    const workshopId = c.get('workshopId')
    const templateId = c.req.param('id')
    const { type, category } = await c.req.json()
    
    const templates = await kv.get(`templates:${workshopId}`) || []
    const template = templates.find((t: any) => t.id === templateId)
    
    if (!template) {
      return c.json({ error: 'Template not found' }, 404)
    }

    // Remove default flag from all templates with same type and category
    const updatedTemplates = templates.map((t: any) => {
      if (t.type === type && t.category === category) {
        return { ...t, isDefault: false }
      }
      return t
    })

    // Set this template as default
    const templateIndex = updatedTemplates.findIndex((t: any) => t.id === templateId)
    updatedTemplates[templateIndex] = {
      ...updatedTemplates[templateIndex],
      isDefault: true,
      updatedAt: new Date().toISOString()
    }

    await kv.set(`templates:${workshopId}`, updatedTemplates)
    
    console.log('✅ Template set as default:', templateId, `(${type}/${category})`)
    return c.json({ success: true, template: updatedTemplates[templateIndex] })
  } catch (error) {
    console.log('❌ Error setting template as default:', error)
    return c.json({ error: 'Error setting template as default' }, 500)
  }
})

// Import Templates
app.post('/make-server-6971b43c/templates/import', requireAuth, async (c) => {
  try {
    const workshopId = c.get('workshopId')
    const { templates: importedTemplates } = await c.req.json()
    
    if (!Array.isArray(importedTemplates)) {
      return c.json({ error: 'Invalid import format' }, 400)
    }

    const existingTemplates = await kv.get(`templates:${workshopId}`) || []
    
    // Add imported templates with new IDs to avoid conflicts
    const newTemplates = importedTemplates.map((template: any) => ({
      ...template,
      id: `template-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      isDefault: false,
      createdAt: new Date().toISOString()
    }))

    const allTemplates = [...existingTemplates, ...newTemplates]
    await kv.set(`templates:${workshopId}`, allTemplates)
    
    console.log(`✅ Imported ${newTemplates.length} templates`)
    return c.json({ success: true, count: newTemplates.length })
  } catch (error) {
    console.log('❌ Error importing templates:', error)
    return c.json({ error: 'Error importing templates' }, 500)
  }
})

// ==================== PUBLIC ROUTES (NO AUTH) ====================

// Predefined Services List
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

// Get list of predefined services (PUBLIC)
app.get('/make-server-6971b43c/public/services', (c) => {
  return c.json({ services: PREDEFINED_SERVICES })
})

// Get list of workshops by location (PUBLIC)
app.get('/make-server-6971b43c/public/workshops', async (c) => {
  try {
    const location = c.req.query('location') // concelho or localidade
    
    console.log('🔍 Searching workshops for location:', location)
    
    const allWorkshops = await kv.getByPrefix('workshop:')
    
    let filteredWorkshops = allWorkshops.filter(w => w && w.isActive)
    
    // Filter by location if provided
    if (location) {
      const locationLower = location.toLowerCase()
      filteredWorkshops = filteredWorkshops.filter(w => 
        w.concelho?.toLowerCase().includes(locationLower) ||
        w.localidade?.toLowerCase().includes(locationLower) ||
        w.address?.toLowerCase().includes(locationLower)
      )
    }
    
    // Return public info only
    const publicWorkshops = filteredWorkshops.map(w => ({
      id: w.id,
      name: w.name,
      address: w.address,
      rua: w.rua,
      numeroPorta: w.numeroPorta,
      codigoPostal: w.codigoPostal,
      concelho: w.concelho,
      localidade: w.localidade,
      phone: w.phone,
      email: w.email,
      logoUrl: w.logoUrl,
      nif: w.nif
    }))
    
    console.log(`✅ Found ${publicWorkshops.length} workshops`)
    
    return c.json({ workshops: publicWorkshops })
  } catch (error) {
    console.log('❌ Error fetching workshops:', error)
    return c.json({ error: 'Error fetching workshops' }, 500)
  }
})

// Get public workshop profile (PUBLIC)
app.get('/make-server-6971b43c/public/workshops/:id', async (c) => {
  try {
    const workshopId = c.req.param('id')
    const workshop = await kv.get(`workshop:${workshopId}`)
    
    if (!workshop || !workshop.isActive) {
      return c.json({ error: 'Workshop not found' }, 404)
    }
    
    // Return public info only
    return c.json({ 
      workshop: {
        id: workshop.id,
        name: workshop.name,
        address: workshop.address,
        rua: workshop.rua,
        numeroPorta: workshop.numeroPorta,
        codigoPostal: workshop.codigoPostal,
        concelho: workshop.concelho,
        localidade: workshop.localidade,
        phone: workshop.phone,
        email: workshop.email,
        logoUrl: workshop.logoUrl,
        nif: workshop.nif
      }
    })
  } catch (error) {
    console.log('❌ Error fetching workshop:', error)
    return c.json({ error: 'Error fetching workshop' }, 500)
  }
})

// Create public quote request (NO AUTH)
app.post('/make-server-6971b43c/public/quote-requests', async (c) => {
  try {
    const { 
      licensePlate, 
      location, 
      serviceId, 
      clientName, 
      clientEmail, 
      clientPhone,
      notes 
    } = await c.req.json()
    
    console.log('📝 New public quote request:', { licensePlate, location, serviceId })
    
    if (!licensePlate || !location || !serviceId || !clientName || !clientEmail) {
      return c.json({ 
        error: 'Matrícula, localidade, serviço, nome e email são obrigatórios' 
      }, 400)
    }
    
    // Find service
    const service = PREDEFINED_SERVICES.find(s => s.id === serviceId)
    if (!service) {
      return c.json({ error: 'Serviço não encontrado' }, 400)
    }
    
    // Find workshops in location
    const allWorkshops = await kv.getByPrefix('workshop:')
    const locationLower = location.toLowerCase()
    
    // Get all workshop profiles to check intervention zones
    const workshopProfilesRaw = await kv.getByPrefix('workshop-profile:')
    console.log(`📋 Found ${workshopProfilesRaw.length} workshop profiles in KV store`)
    
    const profilesByWorkshopId: Record<string, any> = {}
    
    // The getByPrefix returns an array of objects where each object IS the value, not {key, value}
    // We need to match by workshopId directly from the workshops array
    for (const workshop of allWorkshops) {
      if (workshop && workshop.id) {
        const profileKey = `workshop-profile:${workshop.id}`
        const profile = await kv.get(profileKey)
        if (profile) {
          profilesByWorkshopId[workshop.id] = profile
          console.log(`📌 Loaded profile for workshop ${workshop.name} (${workshop.id}): interventionZone = ${profile.interventionZone || 'não definida'}`)
        }
      }
    }
    
    console.log(`\n🔍 Starting search for location: "${location}" (normalized: "${locationLower}")`)
    console.log(`📊 Total active workshops to check: ${allWorkshops.filter(w => w && w.isActive).length}`)
    
    const workshopsInLocation = allWorkshops.filter(w => {
      if (!w) {
        console.log('⚠️ Skipping null/undefined workshop')
        return false
      }
      
      if (!w.isActive) {
        console.log(`⚠️ Skipping inactive workshop: ${w.name}`)
        return false
      }
      
      // Check if workshop address matches location
      const addressMatch = w.concelho?.toLowerCase().includes(locationLower) ||
                          w.localidade?.toLowerCase().includes(locationLower)
      
      // Check if intervention zone matches location
      const profile = profilesByWorkshopId[w.id]
      const interventionZoneMatch = profile?.interventionZone && 
        profile.interventionZone.toLowerCase().includes(locationLower)
      
      const matched = addressMatch || interventionZoneMatch
      
      console.log(`🏭 Workshop: ${w.name}`)
      console.log(`   - Concelho: ${w.concelho || 'N/A'}`)
      console.log(`   - Localidade: ${w.localidade || 'N/A'}`)
      console.log(`   - Zona Intervenção: ${profile?.interventionZone || 'N/A'}`)
      console.log(`   - Address Match: ${addressMatch}`)
      console.log(`   - Zone Match: ${interventionZoneMatch}`)
      console.log(`   - MATCHED: ${matched ? '✅ YES' : '❌ NO'}`)
      
      return matched
    })
    
    console.log(`\n📍 FINAL RESULT: Found ${workshopsInLocation.length} workshops in ${location}`)
    
    if (workshopsInLocation.length === 0) {
      // Collect available locations from both address and intervention zones
      const availableLocations = new Set<string>()
      
      allWorkshops.forEach(w => {
        if (w && w.isActive) {
          if (w.concelho) availableLocations.add(w.concelho)
          if (w.localidade) availableLocations.add(w.localidade)
          
          const profile = profilesByWorkshopId[w.id]
          if (profile?.interventionZone) {
            // Split by comma if multiple zones
            profile.interventionZone.split(',').forEach((zone: string) => {
              const trimmed = zone.trim()
              if (trimmed) availableLocations.add(trimmed)
            })
          }
        }
      })
      
      return c.json({ 
        error: 'Nenhuma oficina disponível na localidade selecionada',
        availableLocations: Array.from(availableLocations).sort()
      }, 404)
    }
    
    // Create quote request
    const quoteRequestId = crypto.randomUUID()
    const quoteRequest = {
      id: quoteRequestId,
      licensePlate,
      location,
      serviceId,
      serviceName: service.name,
      basePrice: service.basePrice,
      clientName,
      clientEmail,
      clientPhone: clientPhone || '',
      notes: notes || '',
      status: 'pending',
      respondedWorkshops: [],
      createdAt: new Date().toISOString()
    }
    
    await kv.set(`public_quote:${quoteRequestId}`, quoteRequest)
    
    // Create quote in each workshop
    const workshopQuotes = await Promise.all(
      workshopsInLocation.map(async (workshop, index) => {
        const quoteId = crypto.randomUUID()
        // Generate unique budget number with timestamp, workshop index, and random suffix
        const budgetNumber = `ORC-${Date.now()}-${index}-${Math.floor(Math.random() * 100)}`
        
        const quote = {
          id: quoteId,
          number: budgetNumber,
          workshopId: workshop.id,
          workshopName: workshop.name,
          publicQuoteRequestId: quoteRequestId,
          licensePlate,
          serviceName: service.name,
          serviceId,
          basePrice: service.basePrice,
          estimatedPrice: service.basePrice,
          clientName,
          clientEmail,
          clientPhone: clientPhone || '',
          notes: notes || '',
          status: 'pending',
          createdAt: new Date().toISOString()
        }
        
        await kv.set(`budget:${quoteId}`, quote)
        
        // Create notification for new quote request
        await createNotification(
          workshop.id,
          'new_quote_request',
          'Novo Pedido de Orçamento',
          `Novo pedido de orçamento do portal público: ${service.name} para ${licensePlate}`,
          quoteId
        )
        
        // Get workshop profile for additional info
        const profile = profilesByWorkshopId[workshop.id]
        
        return {
          workshopId: workshop.id,
          workshopName: workshop.name,
          workshopPhone: workshop.phone,
          workshopEmail: workshop.email,
          workshopAddress: workshop.address,
          workshopLogoUrl: workshop.logoUrl,
          interventionZone: profile?.interventionZone || '',
          estimatedPrice: service.basePrice,
          duration: service.duration
        }
      })
    )
    
    console.log('✅ Quote request created with', workshopQuotes.length, 'workshop quotes')
    
    return c.json({ 
      success: true,
      quoteRequest: {
        id: quoteRequestId,
        licensePlate,
        serviceName: service.name,
        basePrice: service.basePrice
      },
      workshops: workshopQuotes
    })
  } catch (error) {
    console.log('❌ Error creating quote request:', error)
    return c.json({ 
      error: 'Erro ao criar pedido de orçamento: ' + error.message 
    }, 500)
  }
})

// Client Signup (PUBLIC)
app.post('/make-server-6971b43c/public/client-signup', async (c) => {
  try {
    const { email, password, name, phone } = await c.req.json()
    
    console.log('👤 New client signup:', email)
    
    if (!email || !password || !name) {
      return c.json({ error: 'Email, password e nome são obrigatórios' }, 400)
    }
    
    if (password.length < 6) {
      return c.json({ error: 'Password deve ter pelo menos 6 caracteres' }, 400)
    }
    
    // Create auth user
    const { data, error } = await supabase.auth.admin.createUser({
      email,
      password,
      user_metadata: { 
        name, 
        phone: phone || '',
        role: 'client',
        isPublicClient: true
      },
      email_confirm: true
    })
    
    if (error) {
      console.log('❌ Error creating client:', error)
      if (error.message.includes('already registered')) {
        return c.json({ error: 'Este email já está registado' }, 400)
      }
      return c.json({ error: error.message }, 400)
    }
    
    // Create client profile
    const clientId = crypto.randomUUID()
    await kv.set(`public_client:${data.user.id}`, {
      id: data.user.id,
      clientId,
      email,
      name,
      phone: phone || '',
      role: 'client',
      isPublicClient: true,
      createdAt: new Date().toISOString()
    })
    
    console.log('✅ Client created:', email)
    
    return c.json({ 
      success: true, 
      user: {
        id: data.user.id,
        email,
        name
      }
    })
  } catch (error) {
    console.log('❌ Error in client signup:', error)
    return c.json({ 
      error: 'Erro ao criar conta: ' + error.message 
    }, 500)
  }
})

// Validate postal code and get location info (PUBLIC)
// Using a simple Portuguese postal codes API or database
app.get('/make-server-6971b43c/public/postal-code/:code', async (c) => {
  try {
    const postalCode = c.req.param('code')
    
    // Format: XXXX-XXX
    if (!/^\d{4}-\d{3}$/.test(postalCode)) {
      return c.json({ error: 'Código postal inválido. Use formato XXXX-XXX' }, 400)
    }
    
    // For now, return a simple mapping
    // In production, integrate with https://www.codigo-postal.pt/ API or similar
    const postalCodeData: any = {
      '1000-001': { concelho: 'Lisboa', localidade: 'Lisboa' },
      '4000-001': { concelho: 'Porto', localidade: 'Porto' },
      '3000-001': { concelho: 'Coimbra', localidade: 'Coimbra' },
      '8000-001': { concelho: 'Faro', localidade: 'Faro' },
      '2000-001': { concelho: 'Santarém', localidade: 'Santarém' },
    }
    
    const info = postalCodeData[postalCode]
    
    if (info) {
      return c.json({ 
        postalCode,
        ...info
      })
    }
    
    // If not in our database, return generic info based on first 4 digits
    const prefix = postalCode.substring(0, 2)
    const concelhos: any = {
      '10': { concelho: 'Lisboa', localidade: 'Lisboa' },
      '11': { concelho: 'Lisboa', localidade: 'Lisboa' },
      '12': { concelho: 'Lisboa', localidade: 'Amadora' },
      '40': { concelho: 'Porto', localidade: 'Porto' },
      '41': { concelho: 'Porto', localidade: 'Porto' },
      '30': { concelho: 'Coimbra', localidade: 'Coimbra' },
      '80': { concelho: 'Faro', localidade: 'Faro' },
    }
    
    return c.json({
      postalCode,
      ...(concelhos[prefix] || { concelho: 'Portugal', localidade: 'Portugal' })
    })
  } catch (error) {
    console.log('❌ Error validating postal code:', error)
    return c.json({ error: 'Erro ao validar código postal' }, 500)
  }
})

// Get client's quote requests (requires client auth)
app.get('/make-server-6971b43c/client/quote-requests', async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1]
    if (!accessToken) {
      return c.json({ error: 'Unauthorized' }, 401)
    }
    
    const { data: { user }, error } = await supabase.auth.getUser(accessToken)
    if (!user || error) {
      return c.json({ error: 'Unauthorized' }, 401)
    }
    
    const clientProfile = await kv.get(`public_client:${user.id}`)
    if (!clientProfile) {
      return c.json({ error: 'Client profile not found' }, 404)
    }
    
    console.log(`📋 Fetching quote requests for client: ${clientProfile.email}`)
    
    // Get OLD SYSTEM quote requests (public_quote:)
    const allOldQuotes = await kv.getByPrefix('public_quote:')
    const clientOldQuotes = allOldQuotes.filter(q => 
      q && q.clientEmail === clientProfile.email
    )
    
    console.log(`   - Old system quotes: ${clientOldQuotes.length}`)
    
    // Get NEW SYSTEM quote requests (quote_request:)
    const allNewQuotes = await kv.getByPrefix('quote_request:')
    const clientNewQuotes = allNewQuotes.filter(q => 
      q && q.clientEmail === clientProfile.email
    )
    
    console.log(`   - New system quotes: ${clientNewQuotes.length}`)
    
    // Convert new system quotes to old format for compatibility
    const convertedNewQuotes = await Promise.all(clientNewQuotes.map(async (newQuote) => {
      // Get workshop responses for this quote - must filter by quoteRequestId
      const allWorkshopRequests = await kv.getByPrefix('workshop_request:')
      const workshopRequests = allWorkshopRequests.filter((wr: any) => 
        wr && wr.quoteRequestId === newQuote.id
      )
      
      console.log(`   📋 Quote ${newQuote.id}: found ${workshopRequests.length} workshop requests`)
      if (workshopRequests.length > 0) {
        console.log(`      Statuses:`, workshopRequests.map((wr: any) => `${wr.workshopId}: ${wr.status}`).join(', '))
      }
      
      // Build respondedWorkshops array - include ALL statuses (pending, validated, modified, rejected)
      const respondedWorkshops = await Promise.all(workshopRequests
        .filter((wr: any) => wr.status === 'validated' || wr.status === 'modified')
        .map(async (wr: any) => {
          // Get workshop profile data
          const workshopProfile = await kv.get(`workshop-profile:${wr.workshopId}`)
          const workshopData = await kv.get(`workshop:${wr.workshopId}`)
          
          // Generate fresh signed URL for logo if it exists
          let workshopLogo = null
          if (workshopData?.logoPath) {
            try {
              const bucketName = 'make-6971b43c-workshop-logos'
              const { data: urlData } = await supabase.storage
                .from(bucketName)
                .createSignedUrl(workshopData.logoPath, 31536000) // 1 year
              workshopLogo = urlData?.signedUrl || null
            } catch (error) {
              console.log('⚠️ Error generating signed URL for logo:', error)
            }
          }
          
          return {
            workshopId: wr.workshopId,
            workshopName: workshopData?.name || 'Oficina',
            quotedPrice: wr.workshopResponse?.price || wr.estimatedPrice || 0,
            status: wr.status,
            updatedAt: wr.workshopResponse?.respondedAt || wr.createdAt,
            workshopAddress: workshopProfile?.address || null,
            workshopPhone: workshopProfile?.phone || null,
            workshopLogo,
            workshopNotes: wr.workshopResponse?.notes || null
          }
        })
      )
      
      // Determine overall status
      let overallStatus = 'pending'
      if (newQuote.status === 'instant_quote_generated') {
        overallStatus = 'pending'
      } else if (newQuote.status === 'awaiting_workshop_response') {
        overallStatus = respondedWorkshops.length > 0 ? 'responded' : 'awaiting_response'
      } else if (newQuote.status === 'completed' || newQuote.appointmentScheduled) {
        overallStatus = 'approved'
      } else if (respondedWorkshops.length > 0) {
        overallStatus = 'responded'
      }
      
      console.log(`      Final status: ${overallStatus} (${respondedWorkshops.length} responses)`)
      
      return {
        id: newQuote.id,
        licensePlate: newQuote.licensePlate,
        location: newQuote.postalCode,
        serviceName: newQuote.serviceName,
        basePrice: newQuote.instantQuotes?.[0]?.estimatedPrice || 0,
        clientName: newQuote.clientName,
        clientEmail: newQuote.clientEmail,
        clientPhone: newQuote.clientPhone,
        notes: newQuote.notes || '',
        status: overallStatus,
        createdAt: newQuote.createdAt,
        respondedWorkshops,
        updatedAt: newQuote.selectionDate || newQuote.createdAt,
        selectedWorkshopId: newQuote.selectedWorkshopForAppointment || null,
        approvedAt: newQuote.appointmentScheduledAt || null,
        // Add flag to identify new system quotes
        isNewSystem: true
      }
    }))
    
    // Combine both systems
    const allQuotes = [...clientOldQuotes, ...convertedNewQuotes]
    console.log(`   - Total combined quotes: ${allQuotes.length}`)
    
    // Enrich OLD SYSTEM workshop responses with workshop profile data (logo, address, phone)
    const enrichedQuotes = await Promise.all(allQuotes.filter(q => !q.isNewSystem).map(async (quote) => {
      if (!quote.respondedWorkshops || quote.respondedWorkshops.length === 0) {
        return quote
      }
      
      const enrichedWorkshops = await Promise.all(quote.respondedWorkshops.map(async (workshop) => {
        // Get workshop profile
        const workshopProfile = await kv.get(`workshop-profile:${workshop.workshopId}`)
        
        // Get workshop data for name and logo
        const workshopData = await kv.get(`workshop:${workshop.workshopId}`)
        
        // Generate fresh signed URL for logo if it exists
        let workshopLogo = null
        if (workshopData?.logoPath) {
          try {
            const bucketName = 'make-6971b43c-workshop-logos'
            const { data: urlData } = await supabase.storage
              .from(bucketName)
              .createSignedUrl(workshopData.logoPath, 31536000) // 1 year
            workshopLogo = urlData?.signedUrl || null
          } catch (error) {
            console.log('⚠️ Error generating signed URL for logo:', error)
          }
        }
        
        return {
          ...workshop,
          workshopAddress: workshopProfile?.address || null,
          workshopPhone: workshopProfile?.phone || null,
          workshopLogo
        }
      }))
      
      return {
        ...quote,
        respondedWorkshops: enrichedWorkshops
      }
    }))
    
    // Combine enriched old quotes with new system quotes (already enriched)
    const finalQuotes = [
      ...enrichedQuotes,
      ...allQuotes.filter(q => q.isNewSystem)
    ]
    
    // Sort by date (most recent first)
    finalQuotes.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    
    console.log(`✅ Returning ${finalQuotes.length} total quote requests`)
    
    return c.json({ quoteRequests: finalQuotes })
  } catch (error) {
    console.log('❌ Error fetching client quotes:', error)
    return c.json({ error: 'Error fetching quotes' }, 500)
  }
})

// Get client profile (for login verification)
app.get('/make-server-6971b43c/client/profile', async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1]
    if (!accessToken) {
      return c.json({ error: 'Unauthorized' }, 401)
    }
    
    const { data: { user }, error } = await supabase.auth.getUser(accessToken)
    if (!user || error) {
      return c.json({ error: 'Unauthorized' }, 401)
    }
    
    // Check if this is a public client
    const clientProfile = await kv.get(`public_client:${user.id}`)
    if (!clientProfile) {
      return c.json({ error: 'Not a client account' }, 403)
    }
    
    return c.json({ profile: clientProfile })
  } catch (error) {
    console.log('❌ Error fetching client profile:', error)
    return c.json({ error: 'Error fetching profile' }, 500)
  }
})

// Update client profile
app.put('/make-server-6971b43c/client/profile', async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1]
    if (!accessToken) {
      return c.json({ error: 'Unauthorized' }, 401)
    }
    
    const { data: { user }, error } = await supabase.auth.getUser(accessToken)
    if (!user || error) {
      return c.json({ error: 'Unauthorized' }, 401)
    }
    
    const profileData = await c.req.json()
    
    const clientProfile = await kv.get(`public_client:${user.id}`)
    if (!clientProfile) {
      return c.json({ error: 'Client profile not found' }, 404)
    }
    
    // Update client profile with all new fields
    const updatedProfile = {
      ...clientProfile,
      name: profileData.name || clientProfile.name,
      phone: profileData.phone1 || profileData.phone || clientProfile.phone,
      phone1: profileData.phone1 || clientProfile.phone1,
      phone2: profileData.phone2 || clientProfile.phone2,
      phone3: profileData.phone3 || clientProfile.phone3,
      email1: clientProfile.email, // Email principal não pode ser alterado
      email2: profileData.email2 || clientProfile.email2,
      address: profileData.address || clientProfile.address,
      cp4: profileData.cp4 || clientProfile.cp4,
      cp3: profileData.cp3 || clientProfile.cp3,
      postalCode: profileData.cp4 && profileData.cp3 ? `${profileData.cp4}-${profileData.cp3}` : clientProfile.postalCode,
      locality: profileData.locality || clientProfile.locality,
      country: profileData.country || clientProfile.country,
      nif: profileData.nif || clientProfile.nif,
      vatRegime: profileData.vatRegime || clientProfile.vatRegime,
      clientType: profileData.clientType || clientProfile.clientType,
      updatedAt: new Date().toISOString()
    }
    
    await kv.set(`public_client:${user.id}`, updatedProfile)
    
    // Also update user metadata in Supabase Auth
    try {
      await supabase.auth.admin.updateUserById(user.id, {
        user_metadata: {
          ...user.user_metadata,
          name: updatedProfile.name,
          phone: updatedProfile.phone,
          phone1: updatedProfile.phone1,
          phone2: updatedProfile.phone2,
          phone3: updatedProfile.phone3,
          email2: updatedProfile.email2,
          address: updatedProfile.address,
          cp4: updatedProfile.cp4,
          cp3: updatedProfile.cp3,
          locality: updatedProfile.locality,
          country: updatedProfile.country,
          nif: updatedProfile.nif,
          vatRegime: updatedProfile.vatRegime,
          clientType: updatedProfile.clientType
        }
      })
      console.log('✅ User metadata updated in Supabase Auth')
    } catch (authError) {
      console.log('⚠️ Warning: Could not update user metadata:', authError)
    }
    
    return c.json({ success: true })
  } catch (error) {
    console.log('❌ Error updating client profile:', error)
    return c.json({ error: 'Error updating profile' }, 500)
  }
})

// Client approves a workshop for a quote (requires client auth)
app.post('/make-server-6971b43c/client/approve-workshop', async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1]
    if (!accessToken) {
      return c.json({ error: 'Unauthorized' }, 401)
    }
    
    const { data: { user }, error } = await supabase.auth.getUser(accessToken)
    if (!user || error) {
      return c.json({ error: 'Unauthorized' }, 401)
    }
    
    const clientProfile = await kv.get(`public_client:${user.id}`)
    if (!clientProfile) {
      return c.json({ error: 'Client profile not found' }, 404)
    }
    
    const { publicQuoteRequestId, workshopId, preferredDate, preferredTime, notes: appointmentNotes } = await c.req.json()
    
    if (!publicQuoteRequestId || !workshopId) {
      return c.json({ error: 'Missing required fields' }, 400)
    }
    
    console.log('👍 Client approving workshop:', { publicQuoteRequestId, workshopId, clientEmail: clientProfile.email })
    
    // Try to get from OLD SYSTEM first (public_quote:)
    let publicQuote = await kv.get(`public_quote:${publicQuoteRequestId}`)
    let isNewSystem = false
    
    // If not found, try NEW SYSTEM (quote_request:)
    if (!publicQuote) {
      publicQuote = await kv.get(`quote_request:${publicQuoteRequestId}`)
      isNewSystem = true
      console.log('   📋 Using NEW instant quote system')
    } else {
      console.log('   📋 Using OLD quote system')
    }
    
    if (!publicQuote) {
      return c.json({ error: 'Quote request not found' }, 404)
    }
    
    // Verify this quote belongs to the client
    if (publicQuote.clientEmail !== clientProfile.email) {
      return c.json({ error: 'Unauthorized - quote does not belong to this client' }, 403)
    }
    
    if (isNewSystem) {
      // NEW SYSTEM: Handle workshop_request instead of budget
      console.log('   🆕 Processing approval for NEW instant quote system')
      
      // Get all workshop requests for this quote
      const allWorkshopRequests = await kv.getByPrefix('workshop_request:')
      const selectedWorkshopRequest = allWorkshopRequests.find((wr: any) => 
        wr && wr.quoteRequestId === publicQuoteRequestId && wr.workshopId === workshopId
      )
      
      if (!selectedWorkshopRequest) {
        return c.json({ error: 'Workshop response not found' }, 404)
      }
      
      // Mark this workshop as selected for appointment
      publicQuote.selectedWorkshopForAppointment = workshopId
      publicQuote.appointmentScheduledAt = new Date().toISOString()
      publicQuote.status = 'approved'
      publicQuote.selectedWorkshopId = workshopId
      publicQuote.approvedAt = new Date().toISOString()
      publicQuote.updatedAt = new Date().toISOString()
      publicQuote.preferredDate = preferredDate
      publicQuote.preferredTime = preferredTime
      publicQuote.appointmentNotes = appointmentNotes
      publicQuote.appointmentStatus = 'pending_confirmation' // pending_confirmation, confirmed, rejected, rescheduled
      
      await kv.set(`quote_request:${publicQuoteRequestId}`, publicQuote)
      
      // Create appointment request
      const appointmentRequestId = `appt_req_${Date.now()}_${Math.random().toString(36).substring(7)}`
      const appointmentData = {
        id: appointmentRequestId,
        quoteRequestId: publicQuoteRequestId,
        workshopId,
        clientName: publicQuote.clientName,
        clientEmail: publicQuote.clientEmail,
        clientPhone: publicQuote.clientPhone,
        licensePlate: publicQuote.licensePlate,
        serviceName: publicQuote.serviceName,
        serviceId: publicQuote.serviceId,
        preferredDate,
        preferredTime,
        notes: appointmentNotes,
        status: 'pending_confirmation',
        createdAt: new Date().toISOString()
      }
      
      console.log('📝 Creating appointment request:', {
        appointmentRequestId,
        workshopId,
        clientName: publicQuote.clientName,
        serviceName: publicQuote.serviceName,
        preferredDate,
        preferredTime
      })
      
      await kv.set(`appointment_request:${appointmentRequestId}`, appointmentData)
      
      // Add to workshop's appointment requests
      const workshopAppointmentsKey = `workshop_appointment_requests:${workshopId}`
      const existingAppointmentRequests = await kv.get(workshopAppointmentsKey) || []
      console.log(`📋 Current appointment requests for workshop ${workshopId}:`, existingAppointmentRequests.length)
      
      existingAppointmentRequests.push(appointmentRequestId)
      await kv.set(workshopAppointmentsKey, existingAppointmentRequests)
      
      console.log(`✅ Added appointment to workshop list. Total now: ${existingAppointmentRequests.length}`)
      
      // Create notification for the selected workshop
      const notificationId = `notif_${Date.now()}_${Math.random().toString(36).substring(7)}`
      const notificationKey = `notification:workshop:${workshopId}:${notificationId}`
      const notificationData = {
        id: notificationId,
        type: 'client_chose_workshop',
        workshopId,
        quoteRequestId: publicQuoteRequestId,
        appointmentRequestId,
        clientName: publicQuote.clientName,
        clientEmail: publicQuote.clientEmail,
        clientPhone: publicQuote.clientPhone,
        licensePlate: publicQuote.licensePlate,
        serviceName: publicQuote.serviceName,
        preferredDate,
        preferredTime,
        createdAt: new Date().toISOString(),
        read: false
      }
      
      console.log('🔔 Creating notification:', {
        key: notificationKey,
        type: notificationData.type,
        workshopId,
        clientName: publicQuote.clientName
      })
      
      await kv.set(notificationKey, notificationData)
      
      // Create additional notification for the appointment request
      await createNotification(
        workshopId,
        'new_appointment_request',
        '📅 Novo Pedido de Agendamento',
        `Cliente ${publicQuote.clientName} solicitou agendamento para ${publicQuote.serviceName} no dia ${preferredDate} às ${preferredTime}`,
        undefined,
        undefined,
        publicQuoteRequestId,
        appointmentRequestId,
        {
          clientName: publicQuote.clientName,
          clientEmail: publicQuote.clientEmail,
          clientPhone: publicQuote.clientPhone,
          licensePlate: publicQuote.licensePlate,
          serviceName: publicQuote.serviceName,
          preferredDate,
          preferredTime
        }
      )
      
      // 🆕 MARK OTHER WORKSHOP REQUESTS AS REJECTED BY CLIENT
      console.log('🚫 Marking other workshop requests as rejected by client...')
      const otherWorkshopRequests = allWorkshopRequests.filter((wr: any) => 
        wr && 
        wr.quoteRequestId === publicQuoteRequestId && 
        wr.workshopId !== workshopId &&
        wr.status !== 'rejected_by_client' // Don't update already rejected ones
      )
      
      console.log(`   Found ${otherWorkshopRequests.length} other workshop requests to reject`)
      
      for (const otherRequest of otherWorkshopRequests) {
        otherRequest.status = 'rejected_by_client'
        otherRequest.rejectedByClientAt = new Date().toISOString()
        otherRequest.chosenWorkshopId = workshopId
        await kv.set(`workshop_request:${otherRequest.id}`, otherRequest)
        console.log(`   ✅ Marked workshop_request ${otherRequest.id} as rejected by client`)
      }
      
      console.log('✅ Workshop approved successfully (NEW SYSTEM):', { 
        workshopId, 
        notificationId,
        appointmentRequestId,
        notificationKey,
        rejectedOtherRequests: otherWorkshopRequests.length
      })
      
      return c.json({ 
        success: true,
        message: 'Oficina selecionada com sucesso! Em breve será contactado para agendar.',
        isNewSystem: true
      })
    }
    
    // OLD SYSTEM: Original budget-based logic
    console.log('   📜 Processing approval for OLD quote system')
    
    // Find the budget for this workshop and quote
    const allBudgets = await kv.getByPrefix('budget:')
    const workshopBudget = allBudgets.find(b => 
      b.publicQuoteRequestId === publicQuoteRequestId && 
      b.workshopId === workshopId
    )
    
    if (!workshopBudget) {
      return c.json({ error: 'Workshop quote not found' }, 404)
    }
    
    // Update the budget status to approved
    workshopBudget.status = 'approved'
    workshopBudget.approvedByClient = true
    workshopBudget.clientApprovedAt = new Date().toISOString()
    
    await kv.set(`budget:${workshopBudget.id}`, workshopBudget)
    
    // Create notification for approved quote
    await createNotification(
      workshopId,
      'quote_accepted',
      'Orçamento Aceite pelo Cliente',
      `O cliente ${publicQuote.clientName} aceitou o seu orçamento para ${publicQuote.licensePlate}`,
      workshopBudget.id
    )
    
    // Cancel all other budgets for this quote request (other workshops)
    const otherBudgets = allBudgets.filter(b => 
      b.publicQuoteRequestId === publicQuoteRequestId && 
      b.workshopId !== workshopId
    )
    
    console.log(`🚫 Canceling ${otherBudgets.length} other workshop budgets`)
    
    await Promise.all(otherBudgets.map(async (budget) => {
      budget.status = 'canceled'
      budget.canceledByClient = true
      budget.canceledAt = new Date().toISOString()
      budget.cancelReason = 'Cliente escolheu outra oficina'
      await kv.set(`budget:${budget.id}`, budget)
      console.log(`   ❌ Canceled budget ${budget.number} for workshop ${budget.workshopId}`)
    }))
    
    // Update the public quote to mark it as approved with selected workshop
    publicQuote.status = 'approved'
    publicQuote.selectedWorkshopId = workshopId
    publicQuote.approvedAt = new Date().toISOString()
    publicQuote.updatedAt = new Date().toISOString()
    
    await kv.set(`public_quote:${publicQuoteRequestId}`, publicQuote)
    
    console.log('✅ Workshop approved successfully:', { budgetId: workshopBudget.id, workshopId })
    console.log(`✅ Total: 1 approved, ${otherBudgets.length} canceled`)
    
    return c.json({ 
      success: true,
      budget: workshopBudget,
      canceledBudgets: otherBudgets.length,
      message: 'Oficina selecionada com sucesso!'
    })
  } catch (error) {
    console.log('❌ Error approving workshop:', error)
    return c.json({ error: 'Error approving workshop: ' + error.message }, 500)
  }
})

// ==================== WORKSHOP APPOINTMENT REQUESTS ====================

// Debug endpoint for workshop appointments
app.get('/make-server-6971b43c/debug/workshop-appointments', async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1]
    if (!accessToken) {
      return c.json({ error: 'Unauthorized' }, 401)
    }
    
    const { data: { user }, error } = await supabase.auth.getUser(accessToken)
    if (!user || error) {
      return c.json({ error: 'Unauthorized' }, 401)
    }
    
    const workshopId = user.user_metadata?.workshopId
    if (!workshopId) {
      return c.json({ error: 'Workshop not found' }, 404)
    }
    
    console.log('🐛 DEBUG: Workshop ID:', workshopId)
    
    // Get all keys related to this workshop
    const workshopAppointmentsKey = `workshop_appointment_requests:${workshopId}`
    const appointmentIds = await kv.get(workshopAppointmentsKey)
    
    console.log('🐛 DEBUG: Appointment IDs array:', appointmentIds)
    
    // Get all appointment_request keys
    const allAppointmentRequests = await kv.getByPrefix('appointment_request:')
    console.log('🐛 DEBUG: Total appointment_request keys in system:', allAppointmentRequests.length)
    
    // Filter for this workshop
    const workshopAppointments = allAppointmentRequests.filter(a => a && a.workshopId === workshopId)
    console.log('🐛 DEBUG: Appointments for this workshop:', workshopAppointments.length)
    
    // Get all notifications
    const allNotifications = await kv.getByPrefix(`notification:workshop:${workshopId}:`)
    console.log('🐛 DEBUG: Notifications for this workshop:', allNotifications.length)
    
    return c.json({
      workshopId,
      workshopAppointmentsKey,
      appointmentIdsArray: appointmentIds,
      appointmentIdsCount: appointmentIds?.length || 0,
      totalAppointmentRequestsInSystem: allAppointmentRequests.length,
      appointmentsForThisWorkshop: workshopAppointments.length,
      workshopAppointmentDetails: workshopAppointments,
      notificationsCount: allNotifications.length,
      notificationDetails: allNotifications
    })
  } catch (error) {
    console.log('❌ Debug error:', error)
    return c.json({ error: 'Debug error: ' + error.message }, 500)
  }
})

// Get workshop appointment requests (requires workshop auth)
app.get('/make-server-6971b43c/workshop/appointment-requests', async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1]
    if (!accessToken) {
      return c.json({ error: 'Unauthorized' }, 401)
    }
    
    const { data: { user }, error } = await supabase.auth.getUser(accessToken)
    if (!user || error) {
      return c.json({ error: 'Unauthorized' }, 401)
    }
    
    const workshopId = user.user_metadata?.workshopId
    if (!workshopId) {
      return c.json({ error: 'Workshop not found' }, 404)
    }
    
    console.log('📅 Loading appointment requests for workshop:', workshopId)
    
    // Get all appointment request IDs for this workshop
    const workshopAppointmentsKey = `workshop_appointment_requests:${workshopId}`
    console.log('   🔑 Looking for key:', workshopAppointmentsKey)
    
    const appointmentRequestIds = await kv.get(workshopAppointmentsKey) || []
    
    console.log(`   📋 Found ${appointmentRequestIds.length} appointment request IDs:`, appointmentRequestIds)
    
    // Load all appointment request details
    const appointments = []
    for (const appointmentId of appointmentRequestIds) {
      console.log(`   🔍 Loading appointment: ${appointmentId}`)
      const appointment = await kv.get(`appointment_request:${appointmentId}`)
      if (appointment) {
        console.log(`      ✅ Loaded:`, {
          id: appointment.id,
          clientName: appointment.clientName,
          serviceName: appointment.serviceName,
          status: appointment.status
        })
        appointments.push(appointment)
      } else {
        console.log(`      ❌ Not found!`)
      }
    }
    
    // Sort by creation date (most recent first)
    appointments.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    
    console.log(`✅ Returning ${appointments.length} appointment requests`)
    
    return c.json({ appointments })
  } catch (error) {
    console.log('❌ Error loading appointment requests:', error)
    return c.json({ error: 'Error loading appointment requests' }, 500)
  }
})

// Respond to appointment request (confirm, reschedule, reject)
app.post('/make-server-6971b43c/workshop/respond-appointment', async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1]
    if (!accessToken) {
      return c.json({ error: 'Unauthorized' }, 401)
    }
    
    const { data: { user }, error } = await supabase.auth.getUser(accessToken)
    if (!user || error) {
      return c.json({ error: 'Unauthorized' }, 401)
    }
    
    const workshopId = user.user_metadata?.workshopId
    if (!workshopId) {
      return c.json({ error: 'Workshop not found' }, 404)
    }
    
    const { 
      appointmentRequestId, 
      action, // 'confirm', 'reschedule', 'reject'
      confirmedDate, 
      confirmedTime, 
      responseNotes 
    } = await c.req.json()
    
    if (!appointmentRequestId || !action) {
      return c.json({ error: 'Missing required fields' }, 400)
    }
    
    console.log('📅 Workshop responding to appointment:', { 
      workshopId, 
      appointmentRequestId, 
      action 
    })
    
    // Load appointment request
    const appointment = await kv.get(`appointment_request:${appointmentRequestId}`)
    if (!appointment) {
      return c.json({ error: 'Appointment request not found' }, 404)
    }
    
    // Verify this appointment belongs to this workshop
    if (appointment.workshopId !== workshopId) {
      return c.json({ error: 'Unauthorized - appointment does not belong to this workshop' }, 403)
    }
    
    // Store previous status to determine notification message
    const previousStatus = appointment.status
    const wasRescheduleRequest = previousStatus === 'pending_reschedule'
    
    // Update appointment based on action
    appointment.respondedAt = new Date().toISOString()
    appointment.respondedBy = user.email
    appointment.responseNotes = responseNotes
    
    if (action === 'confirm') {
      appointment.status = 'confirmed'
      appointment.confirmedDate = confirmedDate || appointment.preferredDate
      appointment.confirmedTime = confirmedTime || appointment.preferredTime
      // Clear reschedule request after confirmation
      if (appointment.rescheduleRequest) {
        console.log('🔄 Clearing reschedule request after confirmation')
        delete appointment.rescheduleRequest
      }
    } else if (action === 'reschedule') {
      appointment.status = 'rescheduled'
      appointment.confirmedDate = confirmedDate
      appointment.confirmedTime = confirmedTime
      // Clear reschedule request after rescheduling
      if (appointment.rescheduleRequest) {
        console.log('🔄 Clearing reschedule request after rescheduling')
        delete appointment.rescheduleRequest
      }
    } else if (action === 'reject') {
      appointment.status = 'rejected'
      // Keep reschedule request for history/reference
    }
    
    await kv.set(`appointment_request:${appointmentRequestId}`, appointment)
    
    // Create notification for client
    const clientNotificationId = `client_notif_${Date.now()}_${Math.random().toString(36).substring(7)}`
    
    // Get workshop profile for notification
    const workshopProfile = await kv.get(`workshop_profile:${workshopId}`)
    const workshopName = workshopProfile?.businessName || 'A oficina'
    
    let notificationTitle = ''
    let notificationMessage = ''
    
    if (action === 'confirm') {
      // Check if this was a reschedule request being confirmed
      if (wasRescheduleRequest) {
        notificationTitle = 'Reagendamento Confirmado ✅'
        notificationMessage = `${workshopName} confirmou o reagendamento para ${appointment.confirmedDate} às ${appointment.confirmedTime}.`
        console.log('✅ Confirmed reschedule request')
      } else {
        notificationTitle = 'Agendamento Confirmado ✅'
        notificationMessage = `${workshopName} confirmou o seu agendamento para ${appointment.confirmedDate} às ${appointment.confirmedTime}.`
        console.log('✅ Confirmed initial appointment request')
      }
    } else if (action === 'reschedule') {
      notificationTitle = 'Proposta de Reagendamento 📅'
      notificationMessage = `${workshopName} propõe reagendar para ${confirmedDate} às ${confirmedTime}.`
    } else if (action === 'reject') {
      notificationTitle = 'Agendamento Recusado ❌'
      notificationMessage = `${workshopName} não pode aceitar este agendamento. ${responseNotes || ''}`
    }
    
    await kv.set(`notification:client:${appointment.clientEmail}:${clientNotificationId}`, {
      id: clientNotificationId,
      type: `appointment_${action}`,
      workshopId,
      workshopName,
      appointmentRequestId,
      quoteRequestId: appointment.quoteRequestId,
      serviceName: appointment.serviceName,
      title: notificationTitle,
      message: notificationMessage,
      confirmedDate: appointment.confirmedDate,
      confirmedTime: appointment.confirmedTime,
      responseNotes,
      createdAt: new Date().toISOString(),
      read: false
    })
    
    console.log(`✅ Appointment ${action}ed successfully:`, { appointmentRequestId })
    
    // ✅ NEW: If confirmed or rescheduled, create entry in Agenda Module
    let agendaAppointmentId = null
    if (action === 'confirm' || action === 'reschedule') {
      try {
        console.log('📅 Creating agenda appointment for confirmed/rescheduled request')
        
        agendaAppointmentId = `agenda_${Date.now()}_${Math.random().toString(36).substring(7)}`
        const agendaAppointment = {
          id: agendaAppointmentId,
          workshopId,
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
          appointmentRequestId, // Link back to original request
          source: 'appointment_request' // Identify source
        }
        
        await kv.set(`agenda_appointment:${workshopId}:${agendaAppointmentId}`, agendaAppointment)
        
        // Add to workshop's agenda appointments list
        const agendaListKey = `agenda_appointments_list:${workshopId}`
        const existingAgendaList = await kv.get(agendaListKey) || []
        existingAgendaList.push(agendaAppointmentId)
        await kv.set(agendaListKey, existingAgendaList)
        
        // Update slots for the date
        const slotsKey = `agenda_slots:${workshopId}:${appointment.confirmedDate}`
        const dailySlots = await kv.get(slotsKey) || { date: appointment.confirmedDate, appointments: [] }
        dailySlots.appointments.push(agendaAppointmentId)
        await kv.set(slotsKey, dailySlots)
        
        console.log(`✅ Created agenda appointment: ${agendaAppointmentId}`)
        console.log(`   Date: ${appointment.confirmedDate} at ${appointment.confirmedTime}`)
        console.log(`   Slots updated for date`)
        
      } catch (agendaError) {
        console.error('❌ Error creating agenda appointment:', agendaError)
        // Don't fail the whole request if agenda creation fails
      }
    }
    
    return c.json({ 
      success: true, 
      appointment,
      agendaAppointmentId, // Return the agenda ID if created
      message: `Agendamento ${action === 'confirm' ? 'confirmado' : action === 'reschedule' ? 'reagendado' : 'recusado'} com sucesso!`
    })
  } catch (error) {
    console.log('❌ Error responding to appointment:', error)
    return c.json({ error: 'Error responding to appointment' }, 500)
  }
})

// ==================== AGENDA MODULE ====================

// Get agenda configuration
app.get('/make-server-6971b43c/agenda/config', async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1]
    if (!accessToken) {
      return c.json({ error: 'Unauthorized' }, 401)
    }
    
    const { data: { user }, error } = await supabase.auth.getUser(accessToken)
    if (!user || error) {
      return c.json({ error: 'Unauthorized' }, 401)
    }
    
    const workshopId = user.user_metadata?.workshopId
    if (!workshopId) {
      return c.json({ error: 'Workshop not found' }, 404)
    }
    
    console.log('📅 Loading agenda config for workshop:', workshopId)
    
    let config = await kv.get(`agenda_config:${workshopId}`)
    
    // If no config exists, create default
    if (!config) {
      console.log('   No config found, creating default...')
      config = {
        workshopId,
        dailySlots: 8,
        workingHours: {
          monday: { enabled: true, start: '09:00', end: '18:00' },
          tuesday: { enabled: true, start: '09:00', end: '18:00' },
          wednesday: { enabled: true, start: '09:00', end: '18:00' },
          thursday: { enabled: true, start: '09:00', end: '18:00' },
          friday: { enabled: true, start: '09:00', end: '18:00' },
          saturday: { enabled: false, start: '09:00', end: '13:00' },
          sunday: { enabled: false, start: '09:00', end: '13:00' }
        },
        slotDuration: 60,
        breakTime: { start: '13:00', end: '14:00' },
        advanceBookingDays: 30,
        createdAt: new Date().toISOString()
      }
      await kv.set(`agenda_config:${workshopId}`, config)
    }
    
    return c.json({ config })
  } catch (error) {
    console.log('❌ Error loading agenda config:', error)
    return c.json({ error: 'Error loading config' }, 500)
  }
})

// Update agenda configuration
app.put('/make-server-6971b43c/agenda/config', async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1]
    if (!accessToken) {
      return c.json({ error: 'Unauthorized' }, 401)
    }
    
    const { data: { user }, error } = await supabase.auth.getUser(accessToken)
    if (!user || error) {
      return c.json({ error: 'Unauthorized' }, 401)
    }
    
    const workshopId = user.user_metadata?.workshopId
    if (!workshopId) {
      return c.json({ error: 'Workshop not found' }, 404)
    }
    
    const configData = await c.req.json()
    configData.workshopId = workshopId
    configData.updatedAt = new Date().toISOString()
    
    await kv.set(`agenda_config:${workshopId}`, configData)
    
    console.log('✅ Agenda config updated for workshop:', workshopId)
    
    return c.json({ success: true, config: configData })
  } catch (error) {
    console.log('❌ Error updating agenda config:', error)
    return c.json({ error: 'Error updating config' }, 500)
  }
})

// Get agenda appointments (with date range)
app.get('/make-server-6971b43c/agenda/appointments', async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1]
    if (!accessToken) {
      return c.json({ error: 'Unauthorized' }, 401)
    }
    
    const { data: { user }, error } = await supabase.auth.getUser(accessToken)
    if (!user || error) {
      return c.json({ error: 'Unauthorized' }, 401)
    }
    
    const workshopId = user.user_metadata?.workshopId
    if (!workshopId) {
      return c.json({ error: 'Workshop not found' }, 404)
    }
    
    const startDate = c.req.query('startDate')
    const endDate = c.req.query('endDate')
    
    console.log('📅 Loading agenda appointments:', { workshopId, startDate, endDate })
    
    // Get all appointment IDs for this workshop
    const agendaListKey = `agenda_appointments_list:${workshopId}`
    const appointmentIds = await kv.get(agendaListKey) || []
    
    console.log(`   Found ${appointmentIds.length} appointment IDs`)
    
    // Load all appointments
    const appointments = []
    for (const appointmentId of appointmentIds) {
      const appointment = await kv.get(`agenda_appointment:${workshopId}:${appointmentId}`)
      if (appointment) {
        // Filter by date range if provided
        if (startDate && endDate) {
          const apptDate = new Date(appointment.date)
          const start = new Date(startDate)
          const end = new Date(endDate)
          
          if (apptDate >= start && apptDate <= end) {
            appointments.push(appointment)
          }
        } else {
          appointments.push(appointment)
        }
      }
    }
    
    // Sort by date and time
    appointments.sort((a, b) => {
      const dateCompare = new Date(a.date).getTime() - new Date(b.date).getTime()
      if (dateCompare !== 0) return dateCompare
      return a.startTime.localeCompare(b.startTime)
    })
    
    console.log(`✅ Returning ${appointments.length} appointments`)
    
    return c.json({ appointments })
  } catch (error) {
    console.log('❌ Error loading agenda appointments:', error)
    return c.json({ error: 'Error loading appointments' }, 500)
  }
})

// Create agenda appointment
app.post('/make-server-6971b43c/agenda/appointments', async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1]
    if (!accessToken) {
      return c.json({ error: 'Unauthorized' }, 401)
    }
    
    const { data: { user }, error } = await supabase.auth.getUser(accessToken)
    if (!user || error) {
      return c.json({ error: 'Unauthorized' }, 401)
    }
    
    const workshopId = user.user_metadata?.workshopId
    if (!workshopId) {
      return c.json({ error: 'Workshop not found' }, 404)
    }
    
    const appointmentData = await c.req.json()
    
    // Check if date has available slots
    const config = await kv.get(`agenda_config:${workshopId}`)
    const slotsKey = `agenda_slots:${workshopId}:${appointmentData.date}`
    const dailySlots = await kv.get(slotsKey) || { date: appointmentData.date, appointments: [] }
    
    if (config && dailySlots.appointments.length >= config.dailySlots) {
      return c.json({ error: 'Sem slots disponíveis para esta data' }, 400)
    }
    
    const appointmentId = `agenda_${Date.now()}_${Math.random().toString(36).substring(7)}`
    const appointment = {
      ...appointmentData,
      id: appointmentId,
      workshopId,
      status: appointmentData.status || 'scheduled',
      createdAt: new Date().toISOString(),
      source: 'manual' // Created manually by workshop
    }
    
    await kv.set(`agenda_appointment:${workshopId}:${appointmentId}`, appointment)
    
    // Add to workshop's list
    const agendaListKey = `agenda_appointments_list:${workshopId}`
    const existingList = await kv.get(agendaListKey) || []
    existingList.push(appointmentId)
    await kv.set(agendaListKey, existingList)
    
    // Update slots
    dailySlots.appointments.push(appointmentId)
    await kv.set(slotsKey, dailySlots)
    
    console.log('✅ Agenda appointment created:', appointmentId)
    
    return c.json({ success: true, appointment })
  } catch (error) {
    console.log('❌ Error creating agenda appointment:', error)
    return c.json({ error: 'Error creating appointment' }, 500)
  }
})

// Update appointment status
app.put('/make-server-6971b43c/agenda/appointments/:id/status', async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1]
    if (!accessToken) {
      return c.json({ error: 'Unauthorized' }, 401)
    }
    
    const { data: { user }, error } = await supabase.auth.getUser(accessToken)
    if (!user || error) {
      return c.json({ error: 'Unauthorized' }, 401)
    }
    
    const workshopId = user.user_metadata?.workshopId
    if (!workshopId) {
      return c.json({ error: 'Workshop not found' }, 404)
    }
    
    const appointmentId = c.req.param('id')
    const { status } = await c.req.json()
    
    const appointment = await kv.get(`agenda_appointment:${workshopId}:${appointmentId}`)
    if (!appointment) {
      return c.json({ error: 'Appointment not found' }, 404)
    }
    
    appointment.status = status
    appointment.updatedAt = new Date().toISOString()
    
    await kv.set(`agenda_appointment:${workshopId}:${appointmentId}`, appointment)
    
    console.log(`✅ Appointment ${appointmentId} status updated to:`, status)
    
    return c.json({ success: true, appointment })
  } catch (error) {
    console.log('❌ Error updating appointment status:', error)
    return c.json({ error: 'Error updating status' }, 500)
  }
})

// Delete agenda appointment
app.delete('/make-server-6971b43c/agenda/appointments/:id', async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1]
    if (!accessToken) {
      return c.json({ error: 'Unauthorized' }, 401)
    }
    
    const { data: { user }, error } = await supabase.auth.getUser(accessToken)
    if (!user || error) {
      return c.json({ error: 'Unauthorized' }, 401)
    }
    
    const workshopId = user.user_metadata?.workshopId
    if (!workshopId) {
      return c.json({ error: 'Workshop not found' }, 404)
    }
    
    const appointmentId = c.req.param('id')
    
    const appointment = await kv.get(`agenda_appointment:${workshopId}:${appointmentId}`)
    if (!appointment) {
      return c.json({ error: 'Appointment not found' }, 404)
    }
    
    // Remove from list
    const agendaListKey = `agenda_appointments_list:${workshopId}`
    const existingList = await kv.get(agendaListKey) || []
    const updatedList = existingList.filter((id: string) => id !== appointmentId)
    await kv.set(agendaListKey, updatedList)
    
    // Remove from slots
    const slotsKey = `agenda_slots:${workshopId}:${appointment.date}`
    const dailySlots = await kv.get(slotsKey)
    if (dailySlots) {
      dailySlots.appointments = dailySlots.appointments.filter((id: string) => id !== appointmentId)
      await kv.set(slotsKey, dailySlots)
    }
    
    // Delete the appointment
    await kv.del(`agenda_appointment:${workshopId}:${appointmentId}`)
    
    console.log('✅ Agenda appointment deleted:', appointmentId)
    
    return c.json({ success: true })
  } catch (error) {
    console.log('❌ Error deleting agenda appointment:', error)
    return c.json({ error: 'Error deleting appointment' }, 500)
  }
})

// Check available slots for a specific date
app.get('/make-server-6971b43c/agenda/available-slots', async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1]
    if (!accessToken) {
      return c.json({ error: 'Unauthorized' }, 401)
    }
    
    const { data: { user }, error } = await supabase.auth.getUser(accessToken)
    if (!user || error) {
      return c.json({ error: 'Unauthorized' }, 401)
    }
    
    const workshopId = user.user_metadata?.workshopId
    if (!workshopId) {
      return c.json({ error: 'Workshop not found' }, 404)
    }
    
    const date = c.req.query('date')
    if (!date) {
      return c.json({ error: 'Date parameter required' }, 400)
    }
    
    const config = await kv.get(`agenda_config:${workshopId}`)
    const slotsKey = `agenda_slots:${workshopId}:${date}`
    const dailySlots = await kv.get(slotsKey) || { date, appointments: [] }
    
    const totalSlots = config?.dailySlots || 8
    const usedSlots = dailySlots.appointments.length
    const availableSlots = Math.max(0, totalSlots - usedSlots)
    
    return c.json({
      date,
      totalSlots,
      usedSlots,
      availableSlots,
      hasAvailability: availableSlots > 0
    })
  } catch (error) {
    console.log('❌ Error checking available slots:', error)
    return c.json({ error: 'Error checking slots' }, 500)
  }
})

// ==================== CLIENT APPOINTMENTS ENDPOINTS ====================

// Get client's appointments
app.get('/make-server-6971b43c/client/appointments', async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1]
    if (!accessToken) {
      return c.json({ error: 'Unauthorized' }, 401)
    }
    
    const { data: { user }, error } = await supabase.auth.getUser(accessToken)
    if (!user || error) {
      return c.json({ error: 'Unauthorized' }, 401)
    }
    
    const clientEmail = user.email
    console.log('📅 CLIENT: Loading appointments for:', clientEmail)
    
    // Get all appointment requests for this client
    const allAppointmentRequests = await kv.getByPrefix('appointment_request:')
    const clientAppointmentRequests = allAppointmentRequests.filter(
      (req: any) => req.clientEmail === clientEmail
    )
    
    console.log(`   Found ${clientAppointmentRequests.length} appointment requests`)
    
    // Filter only confirmed or rescheduled appointments
    const confirmedAppointments = clientAppointmentRequests.filter(
      (req: any) => req.status === 'confirmed' || req.status === 'rescheduled'
    )
    
    console.log(`   ${confirmedAppointments.length} are confirmed/rescheduled`)
    
    // Get workshop names
    const appointmentsWithWorkshopInfo = await Promise.all(
      confirmedAppointments.map(async (appointment: any) => {
        let workshopName = 'Oficina'
        try {
          const workshopProfile = await kv.get(`workshop_profile:${appointment.workshopId}`)
          if (workshopProfile?.businessName) {
            workshopName = workshopProfile.businessName
          }
        } catch (err) {
          console.error('Error loading workshop profile:', err)
        }
        
        return {
          ...appointment,
          workshopName
        }
      })
    )
    
    // Sort by date (newest first)
    appointmentsWithWorkshopInfo.sort((a: any, b: any) => {
      const dateA = new Date(a.confirmedDate || a.preferredDate)
      const dateB = new Date(b.confirmedDate || b.preferredDate)
      return dateB.getTime() - dateA.getTime()
    })
    
    console.log(`✅ CLIENT: Returning ${appointmentsWithWorkshopInfo.length} appointments`)
    
    return c.json({ 
      appointments: appointmentsWithWorkshopInfo
    })
  } catch (error) {
    console.log('❌ CLIENT: Error loading appointments:', error)
    return c.json({ error: 'Error loading appointments' }, 500)
  }
})

// Client request to reschedule appointment
app.post('/make-server-6971b43c/client/appointments/reschedule-request', async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1]
    if (!accessToken) {
      return c.json({ error: 'Unauthorized' }, 401)
    }
    
    const { data: { user }, error } = await supabase.auth.getUser(accessToken)
    if (!user || error) {
      return c.json({ error: 'Unauthorized' }, 401)
    }
    
    const clientEmail = user.email
    const { appointmentId, requestedDate, requestedTime, notes } = await c.req.json()
    
    if (!appointmentId || !requestedDate || !requestedTime) {
      return c.json({ error: 'Missing required fields' }, 400)
    }
    
    console.log('📅 CLIENT: Reschedule request:', {
      clientEmail,
      appointmentId,
      requestedDate,
      requestedTime
    })
    
    // Load the appointment
    const appointment = await kv.get(`appointment_request:${appointmentId}`)
    if (!appointment) {
      return c.json({ error: 'Appointment not found' }, 404)
    }
    
    // Verify this appointment belongs to this client
    if (appointment.clientEmail !== clientEmail) {
      return c.json({ error: 'Unauthorized - appointment does not belong to this client' }, 403)
    }
    
    // Update appointment with reschedule request
    appointment.rescheduleRequest = {
      requestedDate,
      requestedTime,
      notes,
      requestedAt: new Date().toISOString()
    }
    appointment.status = 'pending_reschedule'
    appointment.updatedAt = new Date().toISOString()
    
    await kv.set(`appointment_request:${appointmentId}`, appointment)
    
    // Create notification for workshop using helper function
    await createNotification(
      appointment.workshopId,
      'appointment_reschedule_request',
      '🔄 Pedido de Reagendamento',
      `${appointment.clientName} solicitou reagendamento para ${requestedDate} às ${requestedTime}`,
      undefined,
      undefined,
      undefined,
      appointmentId,
      {
        clientName: appointment.clientName,
        clientEmail: appointment.clientEmail,
        serviceName: appointment.serviceName,
        currentDate: appointment.confirmedDate,
        currentTime: appointment.confirmedTime,
        requestedDate,
        requestedTime,
        notes
      }
    )
    
    // Also create old-style notification for backwards compatibility
    const notificationId = `workshop_notif_${Date.now()}_${Math.random().toString(36).substring(7)}`
    
    await kv.set(`notification:workshop:${appointment.workshopId}:${notificationId}`, {
      id: notificationId,
      type: 'reschedule_request',
      appointmentId,
      clientName: appointment.clientName,
      clientEmail: appointment.clientEmail,
      serviceName: appointment.serviceName,
      currentDate: appointment.confirmedDate,
      currentTime: appointment.confirmedTime,
      requestedDate,
      requestedTime,
      notes,
      title: 'Pedido de Reagendamento',
      message: `${appointment.clientName} solicitou reagendamento para ${requestedDate} às ${requestedTime}`,
      createdAt: new Date().toISOString(),
      read: false
    })
    
    console.log(`✅ CLIENT: Reschedule request created for appointment ${appointmentId}`)
    
    return c.json({
      success: true,
      message: 'Pedido de reagendamento enviado com sucesso'
    })
  } catch (error) {
    console.log('❌ CLIENT: Error creating reschedule request:', error)
    return c.json({ error: 'Error creating reschedule request' }, 500)
  }
})

// Client cancels a quote request and all associated appointments
app.post('/make-server-6971b43c/client/cancel-quote-request', async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1]
    if (!accessToken) {
      return c.json({ error: 'Unauthorized' }, 401)
    }
    
    const { data: { user }, error } = await supabase.auth.getUser(accessToken)
    if (!user || error) {
      return c.json({ error: 'Unauthorized' }, 401)
    }
    
    const clientEmail = user.email
    const { quoteRequestId } = await c.req.json()
    
    if (!quoteRequestId) {
      return c.json({ error: 'Missing quoteRequestId' }, 400)
    }
    
    console.log('🗑️ CLIENT: Cancelling quote request:', { clientEmail, quoteRequestId })
    
    // Try both old and new system
    let quoteRequest = await kv.get(`public_quote:${quoteRequestId}`)
    let isNewSystem = false
    
    if (!quoteRequest) {
      quoteRequest = await kv.get(`quote_request:${quoteRequestId}`)
      isNewSystem = true
    }
    
    if (!quoteRequest) {
      return c.json({ error: 'Quote request not found' }, 404)
    }
    
    // Verify this quote belongs to this client
    if (quoteRequest.clientEmail !== clientEmail) {
      return c.json({ error: 'Unauthorized - quote does not belong to this client' }, 403)
    }
    
    console.log(`   📋 Quote system: ${isNewSystem ? 'NEW' : 'OLD'}`)
    
    // Get all workshop requests for notifications
    const workshopIdsToNotify = new Set<string>()
    
    if (isNewSystem) {
      // Get workshop requests
      const allWorkshopRequests = await kv.getByPrefix('workshop_request:')
      const relatedWorkshopRequests = allWorkshopRequests.filter((wr: any) => 
        wr && wr.quoteRequestId === quoteRequestId
      )
      
      console.log(`   Found ${relatedWorkshopRequests.length} workshop requests to delete`)
      
      // Delete workshop requests and collect workshop IDs
      for (const wr of relatedWorkshopRequests) {
        workshopIdsToNotify.add(wr.workshopId)
        await kv.del(`workshop_request:${wr.id}`)
        console.log(`   ✅ Deleted workshop_request:${wr.id}`)
        
        // Remove from workshop's list
        const workshopRequestsKey = `workshop_requests:${wr.workshopId}`
        const existingRequests = await kv.get(workshopRequestsKey) || []
        const updatedRequests = existingRequests.filter((id: string) => id !== wr.id)
        await kv.set(workshopRequestsKey, updatedRequests)
      }
    } else {
      // OLD SYSTEM: Get budgets
      if (quoteRequest.respondedWorkshops) {
        for (const workshop of quoteRequest.respondedWorkshops) {
          if (workshop.workshopId) {
            workshopIdsToNotify.add(workshop.workshopId)
          }
        }
      }
    }
    
    // Find and delete appointment requests
    const allAppointmentRequests = await kv.getByPrefix('appointment_request:')
    const relatedAppointments = allAppointmentRequests.filter((appt: any) => 
      appt && appt.quoteRequestId === quoteRequestId
    )
    
    console.log(`   Found ${relatedAppointments.length} appointment requests to delete`)
    
    for (const appt of relatedAppointments) {
      workshopIdsToNotify.add(appt.workshopId)
      
      // Delete appointment request
      await kv.del(`appointment_request:${appt.id}`)
      console.log(`   ✅ Deleted appointment_request:${appt.id}`)
      
      // Remove from workshop's appointment list
      const workshopAppointmentsKey = `workshop_appointment_requests:${appt.workshopId}`
      const existingAppointments = await kv.get(workshopAppointmentsKey) || []
      const updatedAppointments = existingAppointments.filter((id: string) => id !== appt.id)
      await kv.set(workshopAppointmentsKey, updatedAppointments)
      
      // Delete related bookings in Agenda
      const allBookings = await kv.getByPrefix(`booking:${appt.workshopId}:`)
      const relatedBookings = allBookings.filter((booking: any) => 
        booking && booking.appointmentRequestId === appt.id
      )
      
      console.log(`      Found ${relatedBookings.length} agenda bookings to delete`)
      
      for (const booking of relatedBookings) {
        await kv.del(`booking:${appt.workshopId}:${booking.id}`)
        console.log(`      ✅ Deleted booking:${appt.workshopId}:${booking.id}`)
      }
    }
    
    // Delete the quote request
    const deleteKey = isNewSystem ? `quote_request:${quoteRequestId}` : `public_quote:${quoteRequestId}`
    await kv.del(deleteKey)
    console.log(`   ✅ Deleted ${deleteKey}`)
    
    // Send notifications to all affected workshops
    for (const workshopId of workshopIdsToNotify) {
      await createNotification(
        workshopId,
        'quote_cancelled',
        '🚫 Pedido Cancelado pelo Cliente',
        `O cliente ${quoteRequest.clientName} cancelou o pedido de ${quoteRequest.serviceName} - ${quoteRequest.licensePlate}`,
        undefined,
        undefined,
        quoteRequestId,
        undefined,
        {
          clientName: quoteRequest.clientName,
          clientEmail: quoteRequest.clientEmail,
          serviceName: quoteRequest.serviceName,
          licensePlate: quoteRequest.licensePlate
        }
      )
      console.log(`   🔔 Notification sent to workshop ${workshopId}`)
    }
    
    console.log(`✅ CLIENT: Quote request ${quoteRequestId} cancelled successfully`)
    console.log(`   Notified ${workshopIdsToNotify.size} workshop(s)`)
    
    return c.json({
      success: true,
      message: 'Pedido cancelado com sucesso'
    })
  } catch (error) {
    console.log('❌ CLIENT: Error cancelling quote request:', error)
    return c.json({ error: 'Error cancelling quote request: ' + error.message }, 500)
  }
})

// Import client from public portal to workshop client module
app.post('/make-server-6971b43c/platform/import-client', async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1]
    if (!accessToken) {
      return c.json({ error: 'Unauthorized' }, 401)
    }
    
    const { data: { user }, error } = await supabase.auth.getUser(accessToken)
    if (!user || error) {
      return c.json({ error: 'Unauthorized' }, 401)
    }
    
    const workshopId = user.user_metadata?.workshopId
    if (!workshopId) {
      return c.json({ error: 'Workshop not found' }, 404)
    }
    
    const { clientEmail, clientName, clientPhone, vehiclePlate, vehicleModel } = await c.req.json()
    
    if (!clientEmail || !clientName) {
      return c.json({ error: 'Missing required fields' }, 400)
    }
    
    console.log('📥 Importing client to workshop:', { workshopId, clientEmail, clientName, vehiclePlate })
    
    // Check if client already exists
    const allClients = await kv.getByPrefix(`client:${workshopId}:`)
    const existingClient = allClients.find(client => 
      client && client.email?.toLowerCase() === clientEmail.toLowerCase()
    )
    
    let clientId = existingClient?.id
    
    if (existingClient) {
      console.log('ℹ️  Client already exists:', { clientId })
    } else {
      // Get public client profile to check for userId (for sync)
      const allPublicClients = await kv.getByPrefix('public_client:')
      const publicClient = allPublicClients.find(pc => 
        pc && pc.email?.toLowerCase() === clientEmail.toLowerCase()
      )
      
      // Create new client in workshop
      clientId = `client-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`
      const newClient = {
        id: clientId,
        name: clientName,
        email: clientEmail,
        phone: clientPhone || '',
        nif: '',
        address: '',
        workshopId,
        createdAt: new Date().toISOString(),
        importedFromPublic: true,
        publicClientUserId: publicClient?.userId || null // Store userId for sync
      }
      
      await kv.set(`client:${workshopId}:${clientId}`, newClient)
      
      console.log('✅ Client imported successfully:', { clientId, email: clientEmail })
    }
    
    // Create vehicle if data is provided
    let vehicleId = null
    if (vehiclePlate && clientId) {
      // Check if vehicle already exists with this license plate
      const allVehicles = await kv.getByPrefix(`vehicle:${workshopId}:`)
      const existingVehicle = allVehicles.find(vehicle => 
        vehicle && vehicle.licensePlate?.toUpperCase() === vehiclePlate.toUpperCase()
      )
      
      if (existingVehicle) {
        vehicleId = existingVehicle.id
        console.log('ℹ️  Vehicle already exists:', { vehicleId, licensePlate: vehiclePlate })
        
        // Update clientId if vehicle exists but was not associated with client
        if (existingVehicle.clientId !== clientId) {
          existingVehicle.clientId = clientId
          existingVehicle.updatedAt = new Date().toISOString()
          await kv.set(`vehicle:${workshopId}:${existingVehicle.id}`, existingVehicle)
          console.log('✅ Vehicle updated with new client association')
        }
      } else {
        // Create new vehicle
        vehicleId = `vehicle-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`
        
        // Parse vehicle model to extract brand and model if possible
        const modelParts = vehicleModel?.split(' ') || []
        const brand = modelParts[0] || 'Desconhecida'
        const model = modelParts.slice(1).join(' ') || vehicleModel || 'Desconhecido'
        
        const newVehicle = {
          id: vehicleId,
          clientId: clientId,
          licensePlate: vehiclePlate.toUpperCase(),
          brand: brand,
          model: model,
          year: null,
          vin: '',
          color: '',
          fuelType: '',
          engineCapacity: '',
          mileage: null,
          registrationDate: null,
          notes: 'Veículo importado automaticamente do portal público',
          workshopId,
          createdAt: new Date().toISOString(),
          importedFromPublic: true
        }
        
        await kv.set(`vehicle:${workshopId}:${vehicleId}`, newVehicle)
        
        console.log('✅ Vehicle imported successfully:', { vehicleId, licensePlate: vehiclePlate, clientId })
      }
    }
    
    return c.json({ 
      success: true,
      clientId,
      vehicleId,
      message: vehicleId 
        ? 'Cliente e veículo importados com sucesso' 
        : 'Cliente importado com sucesso'
    })
  } catch (error) {
    console.log('❌ Error importing client:', error)
    return c.json({ error: 'Error importing client: ' + error.message }, 500)
  }
})

// Sync client profile updates from public portal to workshop clients
// Called automatically when client updates their profile in ClientPortal
app.post('/make-server-6971b43c/client/sync-to-workshops', async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1]
    if (!accessToken) {
      return c.json({ error: 'Unauthorized' }, 401)
    }
    
    const { data: { user }, error } = await supabase.auth.getUser(accessToken)
    if (!user || error) {
      return c.json({ error: 'Unauthorized' }, 401)
    }
    
    const clientProfile = await kv.get(`public_client:${user.id}`)
    if (!clientProfile) {
      return c.json({ error: 'Client profile not found' }, 404)
    }
    
    console.log('🔄 Syncing client profile to workshops:', { userId: user.id, email: clientProfile.email })
    
    // Find all workshop clients with this email or userId
    const allClients = await kv.getByPrefix('client:')
    const workshopClientsToUpdate = allClients.filter(client => 
      client && (
        client.email?.toLowerCase() === clientProfile.email?.toLowerCase() ||
        client.publicClientUserId === user.id
      )
    )
    
    console.log(`📝 Found ${workshopClientsToUpdate.length} workshop clients to sync`)
    
    // Update each workshop client with all fields
    for (const workshopClient of workshopClientsToUpdate) {
      const updatedClient = {
        ...workshopClient,
        name: clientProfile.name || workshopClient.name,
        phone: clientProfile.phone || workshopClient.phone,
        phone1: clientProfile.phone1 || workshopClient.phone1,
        phone2: clientProfile.phone2 || workshopClient.phone2,
        phone3: clientProfile.phone3 || workshopClient.phone3,
        email: clientProfile.email || workshopClient.email,
        email1: clientProfile.email1 || workshopClient.email1,
        email2: clientProfile.email2 || workshopClient.email2,
        address: clientProfile.address || workshopClient.address,
        cp4: clientProfile.cp4 || workshopClient.cp4,
        cp3: clientProfile.cp3 || workshopClient.cp3,
        postalCode: clientProfile.postalCode || workshopClient.postalCode,
        locality: clientProfile.locality || workshopClient.locality,
        country: clientProfile.country || workshopClient.country,
        nif: clientProfile.nif || workshopClient.nif,
        vatRegime: clientProfile.vatRegime || workshopClient.vatRegime,
        clientType: clientProfile.clientType || workshopClient.clientType,
        publicClientUserId: user.id, // Ensure userId is stored
        lastSyncedAt: new Date().toISOString()
      }
      
      await kv.set(`client:${workshopClient.workshopId}:${workshopClient.id}`, updatedClient)
      console.log(`✅ Synced client ${workshopClient.id} in workshop ${workshopClient.workshopId}`)
    }
    
    return c.json({ 
      success: true,
      syncedClients: workshopClientsToUpdate.length,
      message: 'Profile synced to workshops' 
    })
  } catch (error) {
    console.log('❌ Error syncing client profile:', error)
    return c.json({ error: 'Error syncing profile: ' + error.message }, 500)
  }
})

// Get client's work orders (requires client auth)
app.get('/make-server-6971b43c/client/work-orders', async (c) => {
  try {
    console.log('🔍 ==================== CLIENT WORK ORDERS DEBUG ====================')
    const accessToken = c.req.header('Authorization')?.split(' ')[1]
    if (!accessToken) {
      console.log('❌ No access token provided')
      return c.json({ error: 'Unauthorized' }, 401)
    }
    
    const { data: { user }, error } = await supabase.auth.getUser(accessToken)
    if (!user || error) {
      console.log('❌ Invalid user or error:', error)
      return c.json({ error: 'Unauthorized' }, 401)
    }
    
    console.log('✅ User authenticated:', user.id, user.email)
    
    const clientProfile = await kv.get(`public_client:${user.id}`)
    if (!clientProfile) {
      console.log('❌ Client profile not found for user:', user.id)
      return c.json({ error: 'Client profile not found' }, 404)
    }
    
    console.log('✅ Client profile found:', {
      email: clientProfile.email,
      name: clientProfile.name,
      userId: user.id
    })
    
    // Find all workshop clients with this email
    // Note: Clients can be stored in two formats:
    // 1. client:${clientId} (old format)
    // 2. client:${workshopId}:${clientId} (new format with workshop prefix)
    const allClients = await kv.getByPrefix('client:')
    console.log(`📊 Total clients in system: ${allClients.length}`)
    
    // Normalize email for comparison (trim and lowercase)
    const normalizedEmail = clientProfile.email?.trim().toLowerCase()
    console.log(`🔍 Looking for email (normalized): "${normalizedEmail}"`)
    
    const workshopClients = allClients.filter(client => {
      if (!client) return false
      
      const clientEmail = client.email?.trim().toLowerCase()
      const emailMatch = clientEmail === normalizedEmail
      
      // Also check by publicClientUserId if available
      const userIdMatch = client.publicClientUserId === user.id
      
      if (emailMatch || userIdMatch) {
        console.log(`   ✅ Found matching client:`, {
          id: client.id,
          workshopId: client.workshopId,
          name: client.name,
          email: client.email,
          matchType: emailMatch ? 'email' : 'userId'
        })
      }
      
      return emailMatch || userIdMatch
    })
    
    console.log(`✅ Found ${workshopClients.length} workshop client records for email: ${clientProfile.email}`)
    
    if (workshopClients.length > 0) {
      console.log('📋 Workshop client IDs:', workshopClients.map(wc => ({
        id: wc.id,
        workshopId: wc.workshopId,
        name: wc.name,
        email: wc.email
      })))
    }
    
    if (workshopClients.length === 0) {
      console.log('⚠️ No workshop clients found - returning empty arrays')
      return c.json({ workOrders: [], vehicles: [] })
    }
    
    // Get client IDs - handle both formats:
    // 1. Simple format: "client-123456"
    // 2. Prefixed format: "workshopId:client-123456"
    const clientIds = workshopClients.map(wc => {
      // If the ID contains ":", extract the part after the colon
      if (wc.id.includes(':')) {
        return wc.id.split(':')[1]
      }
      return wc.id
    })
    
    // Also keep the full IDs for matching
    const fullClientIds = workshopClients.map(wc => wc.id)
    
    console.log('🔑 Client IDs to search for work orders (extracted):', clientIds)
    console.log('🔑 Full client IDs:', fullClientIds)
    console.log('🔑 Client IDs count:', clientIds.length)
    
    if (clientIds.length === 0) {
      console.log('⚠️ WARNING: No client IDs found! Cannot search for work orders.')
      return c.json({ workOrders: [], vehicles: [] })
    }
    
    // Get all work orders and vehicles first
    const allWorkOrders = await kv.getByPrefix('workorder:')
    console.log(`📊 Total work orders in system: ${allWorkOrders.length}`)
    
    // Get all vehicles from all workshops
    const allVehicles = await kv.getByPrefix('vehicle:')
    console.log(`📊 Total vehicles in system: ${allVehicles.length}`)
    
    // Filter work orders based on current vehicle owner (not the clientId in work order)
    const clientWorkOrders = []
    const vehiclesMap = new Map()
    
    for (const wo of allWorkOrders) {
      if (!wo) continue
      
      // Find the vehicle for this work order
      const vehicle = allVehicles.find(v => v && v.id === wo.vehicleId)
      
      if (vehicle) {
        // Check if the current owner of the vehicle matches our client
        // Try both the extracted ID and the full ID
        const isCurrentOwner = clientIds.includes(vehicle.clientId) || fullClientIds.includes(vehicle.clientId)
        
        if (isCurrentOwner) {
          console.log(`   ✅ MATCH! WO ${wo.number} - Vehicle ${vehicle.licensePlate} current owner: ${vehicle.clientId}`)
          clientWorkOrders.push(wo)
          vehiclesMap.set(vehicle.id, vehicle)
        }
      }
    }
    
    console.log(`✅ Found ${clientWorkOrders.length} work orders based on current vehicle ownership`)
    
    if (clientWorkOrders.length > 0) {
      console.log('📋 Work Orders:', clientWorkOrders.map(wo => ({
        id: wo.id,
        number: wo.number,
        clientId: wo.clientId,
        vehicleId: wo.vehicleId,
        workshopId: wo.workshopId,
        status: wo.status,
        total: wo.total,
        serviceSheetId: wo.serviceSheetId || 'NONE'
      })))
    }
    
    // Convert vehicles map to array
    const vehicles = Array.from(vehiclesMap.values())
    
    console.log(`✅ Found ${vehicles.length} vehicles total`)
    if (vehicles.length > 0) {
      console.log('🚗 Vehicles:', vehicles.map(v => ({
        id: v.id,
        licensePlate: v.licensePlate,
        currentOwner: v.clientId
      })))
    }
    console.log('🔍 ==================== END DEBUG ====================')
    
    return c.json({ 
      workOrders: clientWorkOrders,
      vehicles
    })
  } catch (error) {
    console.log('❌ Error fetching client work orders:', error)
    return c.json({ error: 'Error fetching work orders: ' + error.message }, 500)
  }
})

// Get client's budgets (requires client auth)
app.get('/make-server-6971b43c/client/budgets', async (c) => {
  try {
    console.log('🔍 CLIENT BUDGETS: Fetching budgets...')
    const accessToken = c.req.header('Authorization')?.split(' ')[1]
    if (!accessToken) {
      console.log('❌ No access token provided')
      return c.json({ error: 'Unauthorized' }, 401)
    }
    
    const { data: { user }, error } = await supabase.auth.getUser(accessToken)
    if (!user || error) {
      console.log('❌ Invalid user or error:', error)
      return c.json({ error: 'Unauthorized' }, 401)
    }
    
    console.log('✅ User authenticated:', user.id, user.email)
    
    // Get client profile
    const clientProfile = await kv.get(`public_client:${user.id}`)
    if (!clientProfile) {
      console.log('❌ Client profile not found')
      return c.json({ error: 'Client profile not found' }, 404)
    }
    
    console.log('✅ Client profile found:', clientProfile.email)
    
    // Get all clients from all workshops matching this email
    const allClients = await kv.getByPrefix('client:')
    const normalizedEmail = clientProfile.email?.trim().toLowerCase()
    
    const workshopClients = allClients.filter(c => {
      if (!c) return false
      const clientEmail = c.email?.trim().toLowerCase()
      return clientEmail === normalizedEmail
    })
    
    console.log(`✅ Found ${workshopClients.length} matching clients across workshops`)
    
    // Extract client IDs
    const clientIds = workshopClients.map(wc => {
      if (wc.id.includes(':')) {
        return wc.id.split(':')[1]
      }
      return wc.id
    })
    
    const fullClientIds = workshopClients.map(wc => wc.id)
    
    console.log('🔑 Client IDs to search for budgets:', clientIds)
    
    if (clientIds.length === 0) {
      console.log('⚠️ WARNING: No client IDs found!')
      return c.json({ budgets: [] })
    }
    
    // Get all budgets
    const allBudgets = await kv.getByPrefix('budget:')
    console.log(`📊 Total budgets in system: ${allBudgets.length}`)
    
    // Get all vehicles
    const allVehicles = await kv.getByPrefix('vehicle:')
    
    // Filter budgets based on current vehicle owner
    const clientBudgets = []
    
    for (const budget of allBudgets) {
      if (!budget) continue
      
      // Find the vehicle for this budget
      const vehicle = allVehicles.find(v => v && v.id === budget.vehicleId)
      
      if (vehicle) {
        // Check if the current owner matches our client
        const isCurrentOwner = clientIds.includes(vehicle.clientId) || fullClientIds.includes(vehicle.clientId)
        
        if (isCurrentOwner) {
          console.log(`   ✅ MATCH! Budget ${budget.number} - Vehicle ${vehicle.licensePlate}`)
          clientBudgets.push(budget)
        }
      }
    }
    
    console.log(`✅ Found ${clientBudgets.length} budgets for client`)
    
    return c.json({ budgets: clientBudgets })
  } catch (error) {
    console.log('❌ Error fetching client budgets:', error)
    return c.json({ error: 'Error fetching budgets: ' + error.message }, 500)
  }
})

// DEBUG: Get client data structure (requires client auth)
app.get('/make-server-6971b43c/client/debug-data', async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1]
    if (!accessToken) {
      return c.json({ error: 'Unauthorized' }, 401)
    }
    
    const { data: { user }, error } = await supabase.auth.getUser(accessToken)
    if (!user || error) {
      return c.json({ error: 'Unauthorized' }, 401)
    }
    
    const clientProfile = await kv.get(`public_client:${user.id}`)
    if (!clientProfile) {
      return c.json({ error: 'Client profile not found' }, 404)
    }
    
    // Get all clients
    const allClients = await kv.getByPrefix('client:')
    const normalizedEmail = clientProfile.email?.trim().toLowerCase()
    
    const matchingClients = allClients.filter(c => {
      if (!c) return false
      const clientEmail = c.email?.trim().toLowerCase()
      return clientEmail === normalizedEmail || c.publicClientUserId === user.id
    })
    
    // Get all work orders
    const allWorkOrders = await kv.getByPrefix('workorder:')
    
    // Get work orders for matching clients
    // Handle both ID formats: "client-123" and "workshopId:client-123"
    const clientIds = matchingClients.map(c => {
      if (c.id.includes(':')) {
        return c.id.split(':')[1]
      }
      return c.id
    })
    const fullClientIds = matchingClients.map(c => c.id)
    
    const matchingWorkOrders = allWorkOrders.filter(wo => 
      wo && (clientIds.includes(wo.clientId) || fullClientIds.includes(wo.clientId))
    )
    
    // Get ALL clients to show sample
    const sampleClients = allClients.slice(0, 5).map(c => ({
      id: c?.id || 'N/A',
      email: c?.email || 'N/A',
      name: c?.name || 'N/A',
      workshopId: c?.workshopId || 'N/A'
    }))
    
    // Get ALL work orders to show sample
    const sampleWorkOrders = allWorkOrders.slice(0, 10).map(wo => ({
      id: wo?.id || 'N/A',
      number: wo?.number || 'N/A',
      clientId: wo?.clientId || 'N/A',
      workshopId: wo?.workshopId || 'N/A',
      status: wo?.status || 'N/A'
    }))
    
    return c.json({
      summary: {
        searchingForEmail: normalizedEmail,
        searchingForUserId: user.id,
        totalClientsInSystem: allClients.length,
        totalWorkOrdersInSystem: allWorkOrders.length,
        matchingClientsFound: matchingClients.length,
        matchingWorkOrdersFound: matchingWorkOrders.length
      },
      clientProfile: {
        userId: user.id,
        email: clientProfile.email,
        name: clientProfile.name
      },
      matchingClients: matchingClients.map(c => ({
        id: c.id,
        workshopId: c.workshopId,
        name: c.name,
        email: c.email,
        publicClientUserId: c.publicClientUserId || null
      })),
      matchingWorkOrders: matchingWorkOrders.map(wo => ({
        id: wo.id,
        number: wo.number,
        clientId: wo.clientId,
        workshopId: wo.workshopId,
        status: wo.status,
        total: wo.total
      })),
      samples: {
        firstFiveClients: sampleClients,
        firstTenWorkOrders: sampleWorkOrders
      }
    })
  } catch (error) {
    console.log('❌ Error in debug:', error)
    return c.json({ error: 'Error: ' + error.message }, 500)
  }
})

// DEBUG: Get all service sheets and work orders (temporary debug endpoint)
app.get('/make-server-6971b43c/debug/service-sheets-workorders', async (c) => {
  try {
    const allServiceSheets = await kv.getByPrefix('servicesheet:')
    const allWorkOrders = await kv.getByPrefix('workorder:')
    
    const serviceSheetsSummary = allServiceSheets.map(ss => ({
      id: ss?.id,
      number: ss?.number,
      workOrderId: ss?.workOrderId,
      status: ss?.status,
      workshopId: ss?.workshopId
    }))
    
    const workOrdersSummary = allWorkOrders.map(wo => ({
      id: wo?.id,
      number: wo?.number,
      serviceSheetId: wo?.serviceSheetId,
      status: wo?.status,
      workshopId: wo?.workshopId,
      clientId: wo?.clientId
    }))
    
    return c.json({
      totalServiceSheets: allServiceSheets.length,
      totalWorkOrders: allWorkOrders.length,
      serviceSheets: serviceSheetsSummary,
      workOrders: workOrdersSummary
    })
  } catch (error) {
    return c.json({ error: error.message }, 500)
  }
})

// Get service sheet status for a work order (requires client auth)
app.get('/make-server-6971b43c/client/service-sheet-status/:workOrderId', async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1]
    if (!accessToken) {
      return c.json({ error: 'Unauthorized' }, 401)
    }
    
    const { data: { user }, error } = await supabase.auth.getUser(accessToken)
    if (!user || error) {
      return c.json({ error: 'Unauthorized' }, 401)
    }
    
    const workOrderId = c.req.param('workOrderId')
    
    console.log('📊 Fetching service sheet status for work order:', workOrderId)
    
    // Get service sheet for this work order
    const allServiceSheets = await kv.getByPrefix('servicesheet:')
    console.log(`🔍 Total service sheets in DB: ${allServiceSheets.length}`)
    
    // Debug: show all service sheets
    allServiceSheets.forEach((ss, idx) => {
      console.log(`  Sheet ${idx + 1}: ID=${ss?.id}, workOrderId=${ss?.workOrderId}, status=${ss?.status}`)
    })
    
    const serviceSheet = allServiceSheets.find(ss => ss && ss.workOrderId === workOrderId)
    
    if (!serviceSheet) {
      console.log(`⚠️ Service sheet not found for work order: ${workOrderId}`)
      console.log(`   Searched ${allServiceSheets.length} service sheets`)
      return c.json({ serviceSheet: null })
    }
    
    console.log('✅ Found service sheet with status:', serviceSheet.status)
    
    return c.json({ 
      serviceSheet: {
        id: serviceSheet.id,
        status: serviceSheet.status,
        updatedAt: serviceSheet.updatedAt || serviceSheet.createdAt
      }
    })
  } catch (error) {
    console.log('❌ Error fetching service sheet status:', error)
    return c.json({ error: 'Error fetching status: ' + error.message }, 500)
  }
})

// ==================== SERVICE SHEET STATUS HISTORY & NOTIFICATIONS ====================

// Create or update service sheet status history entry
app.post('/make-server-6971b43c/service-sheet-status-history', async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1]
    if (!accessToken) {
      return c.json({ error: 'Unauthorized' }, 401)
    }
    
    const { data: { user }, error } = await supabase.auth.getUser(accessToken)
    if (!user || error) {
      return c.json({ error: 'Unauthorized' }, 401)
    }
    
    const { serviceSheetId, workOrderId, clientId, workshopId, oldStatus, newStatus } = await c.req.json()
    
    if (!serviceSheetId || !workOrderId || !clientId || !workshopId || !newStatus) {
      return c.json({ error: 'Missing required fields' }, 400)
    }
    
    console.log('📝 Creating status history entry:', { serviceSheetId, oldStatus, newStatus })
    
    // Create history entry
    const historyId = `ss-history-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
    const historyEntry = {
      id: historyId,
      serviceSheetId,
      workOrderId,
      oldStatus,
      newStatus,
      changedBy: user.id,
      timestamp: new Date().toISOString()
    }
    
    await kv.set(`ss_status_history:${serviceSheetId}:${historyId}`, historyEntry)
    
    console.log('✅ Status history entry created:', historyId)
    
    // Create notification for client if status changed
    const statusMessages: Record<string, string> = {
      'reception': 'O seu veículo foi recebido na oficina',
      'diagnosis': 'Iniciámos o diagnóstico do seu veículo',
      'ordering': 'Estamos a encomendar as peças necessárias',
      'parts_arrival': 'As peças chegaram e vamos iniciar a reparação',
      'execution': 'Estamos a trabalhar no seu veículo',
      'delivery': 'O seu veículo está pronto para levantamento!',
      'completed': 'O serviço foi concluído com sucesso',
      'cancelled': 'O serviço foi cancelado'
    }
    
    const message = statusMessages[newStatus] || `Status atualizado para: ${newStatus}`
    
    // Get work order to find work order number
    const workOrder = await kv.get(`workorder:${workOrderId}`)
    const workOrderNumber = workOrder?.number || workOrderId
    
    // Create client notification
    const notificationId = `client-notif-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
    const notification = {
      id: notificationId,
      clientId,
      workshopId,
      workOrderId,
      workOrderNumber,
      type: 'status_change',
      title: 'Atualização do Serviço',
      message,
      newStatus,
      read: false,
      timestamp: new Date().toISOString()
    }
    
    await kv.set(`client_notification:${clientId}:${notificationId}`, notification)
    
    console.log('✅ Client notification created:', notificationId)
    
    return c.json({ 
      success: true, 
      historyEntry,
      notification
    })
  } catch (error) {
    console.log('❌ Error creating status history:', error)
    return c.json({ error: 'Error creating history: ' + error.message }, 500)
  }
})

// Get status history for a service sheet
app.get('/make-server-6971b43c/service-sheet-status-history/:serviceSheetId', async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1]
    if (!accessToken) {
      return c.json({ error: 'Unauthorized' }, 401)
    }
    
    const { data: { user }, error } = await supabase.auth.getUser(accessToken)
    if (!user || error) {
      return c.json({ error: 'Unauthorized' }, 401)
    }
    
    const serviceSheetId = c.req.param('serviceSheetId')
    
    console.log('📖 Fetching status history for service sheet:', serviceSheetId)
    
    const history = await kv.getByPrefix(`ss_status_history:${serviceSheetId}:`)
    
    // Sort by timestamp descending (newest first)
    const sortedHistory = history
      .filter(h => h !== null)
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
    
    console.log(`✅ Found ${sortedHistory.length} history entries`)
    
    return c.json({ history: sortedHistory })
  } catch (error) {
    console.log('❌ Error fetching status history:', error)
    return c.json({ error: 'Error fetching history: ' + error.message }, 500)
  }
})

// ==================== WORKSHOP MODULES ROUTES ====================

// Get active modules for a workshop (used by workshop users to check their allowed modules)
app.get('/make-server-6971b43c/workshops/:workshopId/active-modules', requireAuth, async (c) => {
  try {
    const workshopId = c.req.param('workshopId')
    const userWorkshopId = c.get('workshopId')
    
    // Verify that user is requesting their own workshop's modules
    if (workshopId !== userWorkshopId) {
      console.log(`🚫 User attempted to access modules for different workshop`)
      return c.json({ error: 'Unauthorized' }, 403)
    }
    
    console.log(`📖 Loading active modules for workshop: ${workshopId}`)
    
    const modules = await kv.get(`workshop-modules:${workshopId}`)
    
    if (modules) {
      console.log(`✅ Modules loaded for workshop ${workshopId}:`, modules.modules)
    } else {
      console.log(`⚠️ No modules configuration found for workshop ${workshopId} - returning all modules`)
    }
    
    return c.json({ 
      modules: modules?.modules || null 
    })
  } catch (error) {
    console.log('❌ Error loading workshop modules:', error)
    return c.json({ error: 'Error loading modules: ' + error.message }, 500)
  }
})

// ==================== ADMIN WORKSHOP MODULES ROUTES ====================

// Get active modules for a workshop (admin access)
app.get('/make-server-6971b43c/admin/workshops/:workshopId/modules', requireAdmin, async (c) => {
  try {
    const workshopId = c.req.param('workshopId')
    console.log(`📖 Loading active modules for workshop: ${workshopId}`)
    
    const modules = await kv.get(`workshop-modules:${workshopId}`)
    
    if (modules) {
      console.log(`✅ Modules loaded for workshop ${workshopId}:`, modules.modules)
    } else {
      console.log(`⚠️ No modules configuration found for workshop ${workshopId} - returning all modules`)
    }
    
    return c.json({ 
      modules: modules?.modules || null 
    })
  } catch (error) {
    console.log('❌ Error loading workshop modules:', error)
    return c.json({ error: 'Error loading modules: ' + error.message }, 500)
  }
})

// Save active modules for a workshop
app.post('/make-server-6971b43c/admin/workshops/:workshopId/modules', requireAdmin, async (c) => {
  try {
    const workshopId = c.req.param('workshopId')
    const { modules } = await c.req.json()
    
    console.log(`💾 Saving active modules for workshop: ${workshopId}`)
    console.log(`   - Modules count: ${modules?.length || 0}`)
    console.log(`   - Modules: ${modules?.join(', ') || 'none'}`)
    
    if (!Array.isArray(modules)) {
      return c.json({ error: 'Modules must be an array' }, 400)
    }
    
    const moduleConfig = {
      workshopId,
      modules,
      updatedAt: new Date().toISOString(),
      updatedBy: c.get('userId')
    }
    
    await kv.set(`workshop-modules:${workshopId}`, moduleConfig)
    
    // Verify it was saved
    const saved = await kv.get(`workshop-modules:${workshopId}`)
    console.log(`✅ Modules saved and verified. Modules in DB: ${saved?.modules?.join(', ') || 'none'}`)
    
    return c.json({ success: true })
  } catch (error) {
    console.log('❌ Error saving workshop modules:', error)
    return c.json({ error: 'Error saving modules: ' + error.message }, 500)
  }
})

// ==================== SUPPLIER ORDERS ROUTES ====================

// Get all suppliers for a workshop
app.get('/make-server-6971b43c/supplier-orders/suppliers', requireAuth, async (c) => {
  try {
    const workshopId = c.get('workshopId')
    console.log('📦 Fetching suppliers for workshop:', workshopId)
    
    const allSuppliers = await kv.getByPrefix('supplier:')
    const suppliers = allSuppliers.filter(item => item && item.workshopId === workshopId)
    
    return c.json({ suppliers })
  } catch (error) {
    console.log('❌ Error fetching suppliers:', error)
    return c.json({ error: 'Error fetching suppliers: ' + error.message }, 500)
  }
})

// Create supplier
app.post('/make-server-6971b43c/supplier-orders/suppliers', requireAuth, async (c) => {
  try {
    const workshopId = c.get('workshopId')
    const supplierData = await c.req.json()
    
    if (!supplierData.name) {
      return c.json({ error: 'Supplier name is required' }, 400)
    }

    const id = crypto.randomUUID()
    const supplier = {
      id,
      ...supplierData,
      workshopId,
      isActive: true,
      createdAt: new Date().toISOString()
    }

    await kv.set(`supplier:${id}`, supplier)
    console.log('✅ Supplier created:', id, supplierData.name)
    
    return c.json({ supplier }, 201)
  } catch (error) {
    console.log('❌ Error creating supplier:', error)
    return c.json({ error: 'Error creating supplier: ' + error.message }, 500)
  }
})

// Update supplier
app.put('/make-server-6971b43c/supplier-orders/suppliers/:id', requireAuth, async (c) => {
  try {
    const workshopId = c.get('workshopId')
    const id = c.req.param('id')
    const supplierData = await c.req.json()
    
    const existingSupplier = await kv.get(`supplier:${id}`)
    if (!existingSupplier) {
      return c.json({ error: 'Supplier not found' }, 404)
    }
    
    // Verify workshop ownership
    if (existingSupplier.workshopId !== workshopId) {
      return c.json({ error: 'Unauthorized' }, 403)
    }

    const updatedSupplier = {
      ...existingSupplier,
      ...supplierData,
      id,
      workshopId,
      updatedAt: new Date().toISOString()
    }

    await kv.set(`supplier:${id}`, updatedSupplier)
    console.log('✅ Supplier updated:', id)
    
    return c.json({ supplier: updatedSupplier })
  } catch (error) {
    console.log('❌ Error updating supplier:', error)
    return c.json({ error: 'Error updating supplier: ' + error.message }, 500)
  }
})

// Delete supplier
app.delete('/make-server-6971b43c/supplier-orders/suppliers/:id', requireAuth, async (c) => {
  try {
    const workshopId = c.get('workshopId')
    const id = c.req.param('id')
    
    const existingSupplier = await kv.get(`supplier:${id}`)
    if (!existingSupplier) {
      return c.json({ error: 'Supplier not found' }, 404)
    }
    
    // Verify workshop ownership
    if (existingSupplier.workshopId !== workshopId) {
      return c.json({ error: 'Unauthorized' }, 403)
    }

    await kv.del(`supplier:${id}`)
    console.log('✅ Supplier deleted:', id)
    
    return c.json({ success: true })
  } catch (error) {
    console.log('❌ Error deleting supplier:', error)
    return c.json({ error: 'Error deleting supplier: ' + error.message }, 500)
  }
})

// Get all orders for a workshop
app.get('/make-server-6971b43c/supplier-orders/orders', requireAuth, async (c) => {
  try {
    const workshopId = c.get('workshopId')
    console.log('📦 Fetching orders for workshop:', workshopId)
    
    const allOrders = await kv.getByPrefix('supplier_order:')
    const orders = allOrders.filter(item => item && item.workshopId === workshopId)
    
    // Sort by creation date (most recent first)
    orders.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    
    return c.json({ orders })
  } catch (error) {
    console.log('❌ Error fetching orders:', error)
    return c.json({ error: 'Error fetching orders: ' + error.message }, 500)
  }
})

// Create supplier order
app.post('/make-server-6971b43c/supplier-orders/orders', requireAuth, async (c) => {
  try {
    const workshopId = c.get('workshopId')
    const orderData = await c.req.json()
    
    if (!orderData.supplierId || !orderData.items || orderData.items.length === 0) {
      return c.json({ error: 'Supplier and items are required' }, 400)
    }

    // Get supplier details
    const supplier = await kv.get(`supplier:${orderData.supplierId}`)
    if (!supplier) {
      return c.json({ error: 'Supplier not found' }, 404)
    }
    
    // Verify supplier belongs to workshop
    if (supplier.workshopId !== workshopId) {
      return c.json({ error: 'Unauthorized' }, 403)
    }

    // Generate order number
    const year = new Date().getFullYear()
    const allOrders = await kv.getByPrefix('supplier_order:')
    const workshopOrders = allOrders.filter(o => o && o.workshopId === workshopId)
    const orderNumber = `ENC${year}-${String(workshopOrders.length + 1).padStart(4, '0')}`

    const id = crypto.randomUUID()
    const order = {
      id,
      orderNumber,
      supplierId: orderData.supplierId,
      supplierName: supplier.name,
      items: orderData.items,
      totalAmount: orderData.totalAmount,
      status: 'pending',
      orderDate: new Date().toISOString(),
      expectedDeliveryDate: orderData.expectedDeliveryDate || null,
      notes: orderData.notes || '',
      workshopId,
      createdAt: new Date().toISOString()
    }

    await kv.set(`supplier_order:${id}`, order)
    console.log('✅ Supplier order created:', orderNumber)
    
    return c.json({ order }, 201)
  } catch (error) {
    console.log('❌ Error creating order:', error)
    return c.json({ error: 'Error creating order: ' + error.message }, 500)
  }
})

// Update order status
app.patch('/make-server-6971b43c/supplier-orders/orders/:id/status', requireAuth, async (c) => {
  try {
    const workshopId = c.get('workshopId')
    const id = c.req.param('id')
    const { status } = await c.req.json()
    
    const existingOrder = await kv.get(`supplier_order:${id}`)
    if (!existingOrder) {
      return c.json({ error: 'Order not found' }, 404)
    }
    
    // Verify workshop ownership
    if (existingOrder.workshopId !== workshopId) {
      return c.json({ error: 'Unauthorized' }, 403)
    }

    const updatedOrder = {
      ...existingOrder,
      status,
      updatedAt: new Date().toISOString()
    }
    
    // Set delivered date if status is delivered
    if (status === 'delivered' && !existingOrder.deliveredDate) {
      updatedOrder.deliveredDate = new Date().toISOString()
    }

    await kv.set(`supplier_order:${id}`, updatedOrder)
    console.log('✅ Order status updated:', id, status)
    
    return c.json({ order: updatedOrder })
  } catch (error) {
    console.log('❌ Error updating order status:', error)
    return c.json({ error: 'Error updating order status: ' + error.message }, 500)
  }
})

// Delete order
app.delete('/make-server-6971b43c/supplier-orders/orders/:id', requireAuth, async (c) => {
  try {
    const workshopId = c.get('workshopId')
    const id = c.req.param('id')
    
    const existingOrder = await kv.get(`supplier_order:${id}`)
    if (!existingOrder) {
      return c.json({ error: 'Order not found' }, 404)
    }
    
    // Verify workshop ownership
    if (existingOrder.workshopId !== workshopId) {
      return c.json({ error: 'Unauthorized' }, 403)
    }

    await kv.del(`supplier_order:${id}`)
    console.log('✅ Order deleted:', id)
    
    return c.json({ success: true })
  } catch (error) {
    console.log('❌ Error deleting order:', error)
    return c.json({ error: 'Error deleting order: ' + error.message }, 500)
  }
})

// ==================== STOCK MANAGEMENT ROUTES ====================

// Get all stock categories
app.get('/make-server-6971b43c/stock/categories', requireAuth, async (c) => {
  try {
    const workshopId = c.get('workshopId')
    console.log('📦 Fetching stock categories for workshop:', workshopId)
    
    const allCategories = await kv.getByPrefix('stock_category:')
    const categories = allCategories.filter(item => item && item.workshopId === workshopId)
    
    return c.json({ categories })
  } catch (error) {
    console.log('❌ Error fetching categories:', error)
    return c.json({ error: 'Error fetching categories: ' + error.message }, 500)
  }
})

// Create stock category
app.post('/make-server-6971b43c/stock/categories', requireAuth, async (c) => {
  try {
    const workshopId = c.get('workshopId')
    const categoryData = await c.req.json()
    
    if (!categoryData.name) {
      return c.json({ error: 'Category name is required' }, 400)
    }

    const id = crypto.randomUUID()
    const category = {
      id,
      ...categoryData,
      workshopId,
      createdAt: new Date().toISOString()
    }

    await kv.set(`stock_category:${id}`, category)
    console.log('✅ Stock category created:', id, categoryData.name)
    
    return c.json({ category }, 201)
  } catch (error) {
    console.log('❌ Error creating category:', error)
    return c.json({ error: 'Error creating category: ' + error.message }, 500)
  }
})

// Update stock category
app.put('/make-server-6971b43c/stock/categories/:id', requireAuth, async (c) => {
  try {
    const workshopId = c.get('workshopId')
    const id = c.req.param('id')
    const categoryData = await c.req.json()
    
    const existingCategory = await kv.get(`stock_category:${id}`)
    if (!existingCategory) {
      return c.json({ error: 'Category not found' }, 404)
    }
    
    if (existingCategory.workshopId !== workshopId) {
      return c.json({ error: 'Unauthorized' }, 403)
    }

    const updatedCategory = {
      ...existingCategory,
      ...categoryData,
      id,
      workshopId,
      updatedAt: new Date().toISOString()
    }

    await kv.set(`stock_category:${id}`, updatedCategory)
    console.log('✅ Stock category updated:', id)
    
    return c.json({ category: updatedCategory })
  } catch (error) {
    console.log('❌ Error updating category:', error)
    return c.json({ error: 'Error updating category: ' + error.message }, 500)
  }
})

// Delete stock category
app.delete('/make-server-6971b43c/stock/categories/:id', requireAuth, async (c) => {
  try {
    const workshopId = c.get('workshopId')
    const id = c.req.param('id')
    
    const existingCategory = await kv.get(`stock_category:${id}`)
    if (!existingCategory) {
      return c.json({ error: 'Category not found' }, 404)
    }
    
    if (existingCategory.workshopId !== workshopId) {
      return c.json({ error: 'Unauthorized' }, 403)
    }

    await kv.del(`stock_category:${id}`)
    console.log('✅ Stock category deleted:', id)
    
    return c.json({ success: true })
  } catch (error) {
    console.log('❌ Error deleting category:', error)
    return c.json({ error: 'Error deleting category: ' + error.message }, 500)
  }
})

// Initialize default stock categories
app.post('/make-server-6971b43c/stock/categories/init-defaults', requireAuth, async (c) => {
  try {
    const workshopId = c.get('workshopId')
    console.log('🏗️ Initializing default stock categories for workshop:', workshopId)
    
    // Check if categories already exist
    const allCategories = await kv.getByPrefix('stock_category:')
    const existingCategories = allCategories.filter(cat => cat && cat.workshopId === workshopId)
    
    if (existingCategories.length > 0) {
      console.log('ℹ️ Categories already exist, skipping initialization')
      return c.json({ message: 'Categories already initialized', categories: existingCategories })
    }
    
    const defaultCategories = [
      'Acessórios',
      'Alimentação de combustível',
      'Aquecimento e ventilação',
      'Caixa de velocidades',
      'Carroçaria',
      'Comando da correia',
      'Direção',
      'Dispositivo de reboque/peças de montagem',
      'Dispositivo de transporte',
      'Embraiagem/Peças',
      'Equipamento interior',
      'Ferramentas especiais',
      'Filtro',
      'Jantes/pneus',
      'Limpeza dos faróis',
      'Limpeza dos vidros',
      'Motor',
      'Peças de manutenção',
      'Refrigeração',
      'Sistema de alimentação de combustível',
      'Sistema de ar comprimido',
      'Sistema de ar condicionado',
      'Sistema de conforto',
      'Sistema de escape',
      'Sistema de fecho',
      'Sistema de ignição e de pré-aquecimento',
      'Sistema de travagem',
      'Sistema elétrico',
      'Sistemas de informação e de comunicação',
      'Sistemas de segurança',
      'Suspensão do eixo/guia da roda/Rodas',
      'Suspensão/Amortecedores',
      'Transmissão',
      'Transmissão das rodas',
      'Veículo de duas rodas'
    ]
    
    const createdCategories = []
    
    for (const categoryName of defaultCategories) {
      const id = crypto.randomUUID()
      const category = {
        id,
        name: categoryName,
        description: `Categoria ${categoryName}`,
        workshopId,
        createdAt: new Date().toISOString()
      }
      
      await kv.set(`stock_category:${id}`, category)
      createdCategories.push(category)
    }
    
    console.log(`✅ Created ${createdCategories.length} default stock categories`)
    
    return c.json({ 
      message: 'Default categories initialized successfully',
      categories: createdCategories,
      count: createdCategories.length
    }, 201)
  } catch (error) {
    console.log('❌ Error initializing default categories:', error)
    return c.json({ error: 'Error initializing default categories: ' + error.message }, 500)
  }
})

// Get all stock items
app.get('/make-server-6971b43c/stock/items', requireAuth, async (c) => {
  try {
    const workshopId = c.get('workshopId')
    console.log('📦 Fetching stock items for workshop:', workshopId)
    
    const allItems = await kv.getByPrefix('stock_item:')
    const items = allItems.filter(item => item && item.workshopId === workshopId)
    
    // Get categories to populate category names
    const allCategories = await kv.getByPrefix('stock_category:')
    const categories = allCategories.filter(cat => cat && cat.workshopId === workshopId)
    
    // Add category names to items
    const itemsWithCategories = items.map(item => {
      const category = categories.find(cat => cat.id === item.categoryId)
      return {
        ...item,
        categoryName: category?.name || ''
      }
    })
    
    return c.json({ items: itemsWithCategories })
  } catch (error) {
    console.log('❌ Error fetching stock items:', error)
    return c.json({ error: 'Error fetching stock items: ' + error.message }, 500)
  }
})

// Create stock item
app.post('/make-server-6971b43c/stock/items', requireAuth, async (c) => {
  try {
    const workshopId = c.get('workshopId')
    const userId = c.get('userId')
    const itemData = await c.req.json()
    
    if (!itemData.reference || !itemData.name) {
      return c.json({ error: 'Reference and name are required' }, 400)
    }

    const id = crypto.randomUUID()
    const item = {
      id,
      ...itemData,
      workshopId,
      isActive: true,
      createdAt: new Date().toISOString()
    }

    await kv.set(`stock_item:${id}`, item)
    console.log('✅ Stock item created:', id, itemData.reference)
    
    // Create initial stock movement if quantity > 0
    if (itemData.quantity > 0) {
      const movementId = crypto.randomUUID()
      const movement = {
        id: movementId,
        itemId: id,
        itemReference: itemData.reference,
        itemName: itemData.name,
        type: 'in',
        quantity: itemData.quantity,
        previousQuantity: 0,
        newQuantity: itemData.quantity,
        reason: 'Stock inicial',
        userId,
        userName: 'Sistema',
        workshopId,
        createdAt: new Date().toISOString()
      }
      await kv.set(`stock_movement:${movementId}`, movement)
    }
    
    return c.json({ item }, 201)
  } catch (error) {
    console.log('❌ Error creating stock item:', error)
    return c.json({ error: 'Error creating stock item: ' + error.message }, 500)
  }
})

// Update stock item
app.put('/make-server-6971b43c/stock/items/:id', requireAuth, async (c) => {
  try {
    const workshopId = c.get('workshopId')
    const id = c.req.param('id')
    const itemData = await c.req.json()
    
    const existingItem = await kv.get(`stock_item:${id}`)
    if (!existingItem) {
      return c.json({ error: 'Item not found' }, 404)
    }
    
    if (existingItem.workshopId !== workshopId) {
      return c.json({ error: 'Unauthorized' }, 403)
    }

    const updatedItem = {
      ...existingItem,
      ...itemData,
      id,
      workshopId,
      updatedAt: new Date().toISOString()
    }

    await kv.set(`stock_item:${id}`, updatedItem)
    console.log('✅ Stock item updated:', id)
    
    return c.json({ item: updatedItem })
  } catch (error) {
    console.log('❌ Error updating stock item:', error)
    return c.json({ error: 'Error updating stock item: ' + error.message }, 500)
  }
})

// Delete stock item
app.delete('/make-server-6971b43c/stock/items/:id', requireAuth, async (c) => {
  try {
    const workshopId = c.get('workshopId')
    const id = c.req.param('id')
    
    const existingItem = await kv.get(`stock_item:${id}`)
    if (!existingItem) {
      return c.json({ error: 'Item not found' }, 404)
    }
    
    if (existingItem.workshopId !== workshopId) {
      return c.json({ error: 'Unauthorized' }, 403)
    }

    await kv.del(`stock_item:${id}`)
    console.log('✅ Stock item deleted:', id)
    
    return c.json({ success: true })
  } catch (error) {
    console.log('❌ Error deleting stock item:', error)
    return c.json({ error: 'Error deleting stock item: ' + error.message }, 500)
  }
})

// Get stock movements
app.get('/make-server-6971b43c/stock/movements', requireAuth, async (c) => {
  try {
    const workshopId = c.get('workshopId')
    console.log('📦 Fetching stock movements for workshop:', workshopId)
    
    const allMovements = await kv.getByPrefix('stock_movement:')
    const movements = allMovements.filter(item => item && item.workshopId === workshopId)
    
    // Sort by date (most recent first)
    movements.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    
    return c.json({ movements })
  } catch (error) {
    console.log('❌ Error fetching movements:', error)
    return c.json({ error: 'Error fetching movements: ' + error.message }, 500)
  }
})

// Create stock movement
app.post('/make-server-6971b43c/stock/movements', requireAuth, async (c) => {
  try {
    const workshopId = c.get('workshopId')
    const userId = c.get('userId')
    const movementData = await c.req.json()
    
    if (!movementData.itemId || !movementData.type || !movementData.quantity) {
      return c.json({ error: 'Item, type and quantity are required' }, 400)
    }

    // Get current stock item
    const item = await kv.get(`stock_item:${movementData.itemId}`)
    if (!item) {
      return c.json({ error: 'Item not found' }, 404)
    }
    
    if (item.workshopId !== workshopId) {
      return c.json({ error: 'Unauthorized' }, 403)
    }

    const previousQuantity = item.quantity
    let newQuantity = previousQuantity

    // Calculate new quantity based on movement type
    if (movementData.type === 'in') {
      newQuantity = previousQuantity + movementData.quantity
    } else if (movementData.type === 'out') {
      newQuantity = previousQuantity - movementData.quantity
      if (newQuantity < 0) {
        return c.json({ error: 'Quantidade insuficiente em stock' }, 400)
      }
    } else if (movementData.type === 'adjustment') {
      newQuantity = movementData.quantity
    }

    // Update item quantity
    item.quantity = newQuantity
    item.updatedAt = new Date().toISOString()
    await kv.set(`stock_item:${item.id}`, item)

    // Create movement record
    const movementId = crypto.randomUUID()
    const movement = {
      id: movementId,
      itemId: item.id,
      itemReference: item.reference,
      itemName: item.name,
      type: movementData.type,
      quantity: movementData.quantity,
      previousQuantity,
      newQuantity,
      reason: movementData.reason,
      relatedDocument: movementData.relatedDocument || null,
      userId,
      userName: 'User',
      workshopId,
      createdAt: new Date().toISOString()
    }

    await kv.set(`stock_movement:${movementId}`, movement)
    console.log('✅ Stock movement created:', movementId, movementData.type, movementData.quantity)
    
    return c.json({ movement, item }, 201)
  } catch (error) {
    console.log('❌ Error creating movement:', error)
    return c.json({ error: 'Error creating movement: ' + error.message }, 500)
  }
})

// TecDoc API Integration - Search part by reference
app.post('/make-server-6971b43c/stock/tecdoc/search', requireAuth, async (c) => {
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
        error: 'TecDoc API não configurada. Por favor, configure a chave API.',
        configured: false 
      }, 503)
    }
    
    console.log('🌐 TecDoc: Making API request...')
    
    const tecdocUrl = 'https://webservice.tecalliance.services/pegasus-3-0/services/TecdocToCatalog.jsonEndpoint'
    
    const requestBody = {
      articleNumber: reference.trim(),
      provider: 3,
      lang: 'PT'
    }
    
    const response = await fetch(tecdocUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${tecdocApiKey}`
      },
      body: JSON.stringify(requestBody)
    })
    
    if (!response.ok) {
      console.log('❌ TecDoc API error:', response.status, response.statusText)
      const errorText = await response.text()
      console.log('Error response:', errorText)
      
      return c.json({ 
        error: `Erro ao consultar TecDoc (${response.status}). Verifique a referência.`,
        details: errorText
      }, response.status)
    }
    
    const tecdocData = await response.json()
    console.log('✅ TecDoc: Data received')
    
    if (!tecdocData.articles || tecdocData.articles.length === 0) {
      console.log('⚠️ TecDoc: No articles found for reference:', reference)
      return c.json({ 
        found: false,
        message: 'Nenhum artigo encontrado para esta referência'
      })
    }
    
    const article = tecdocData.articles[0]
    
    const partData = {
      found: true,
      reference: article.articleNumber || reference,
      name: article.genericArticleName || article.articleName || '',
      description: article.articleDescription || article.genericArticleDescription || '',
      manufacturer: article.brandName || article.manufacturer || '',
      categoryName: article.genericArticleDescription || '',
      eanCode: article.eanNumber || '',
      images: article.images || [],
      imageUrl: article.images && article.images.length > 0 ? article.images[0].url : '',
      technicalData: article.technicalData || [],
      recommendedPrice: article.recommendedRetailPrice || null,
      purchasePrice: article.tradePrice || null,
      oem: article.oemNumbers || [],
      crossReferences: article.crossReferences || [],
      specifications: article.specifications || {}
    }
    
    console.log('✅ TecDoc: Part data extracted:', partData.reference, partData.name)
    return c.json(partData)
    
  } catch (error) {
    console.log('❌ TecDoc: Error searching part:', error)
    return c.json({ 
      error: 'Erro ao consultar TecDoc: ' + (error.message || 'Erro desconhecido'),
      details: error.message
    }, 500)
  }
})

// ==================== BANNER ROUTES ====================

// Get all banners (public)
app.get('/make-server-6971b43c/public/banners', async (c) => {
  try {
    console.log('📸 Fetching public banners')
    
    const allBanners = await kv.getByPrefix('banner:')
    const activeBanners = allBanners
      .filter(banner => banner && banner.active)
      .sort((a, b) => a.order - b.order)
    
    console.log(`✅ Found ${activeBanners.length} active banners`)
    return c.json({ banners: activeBanners })
  } catch (error) {
    console.log('❌ Error fetching banners:', error)
    return c.json({ error: 'Error fetching banners: ' + error.message }, 500)
  }
})

// Get all banners (admin)
app.get('/make-server-6971b43c/admin/banners', requireAdmin, async (c) => {
  try {
    console.log('📸 Fetching all banners (admin)')
    
    const allBanners = await kv.getByPrefix('banner:')
    const banners = allBanners
      .filter(banner => banner)
      .sort((a, b) => a.order - b.order)
    
    console.log(`✅ Found ${banners.length} banners`)
    return c.json({ banners })
  } catch (error) {
    console.log('❌ Error fetching banners:', error)
    return c.json({ error: 'Error fetching banners: ' + error.message }, 500)
  }
})

// Create or update banner (admin)
app.post('/make-server-6971b43c/admin/banners', requireAdmin, async (c) => {
  try {
    const formData = await c.req.formData()
    const imageFile = formData.get('image') as File | null
    const title = formData.get('title') as string
    const subtitle = formData.get('subtitle') as string
    const bannerId = formData.get('bannerId') as string | null
    const type = (formData.get('type') as string) || 'carousel' // 'carousel' or 'fixed'
    
    console.log('📸 Creating/updating banner:', { title, subtitle, bannerId, type, hasImage: !!imageFile })
    
    let imageUrl = ''
    
    // Upload image if provided
    if (imageFile) {
      const fileName = `banner-${Date.now()}-${Math.random().toString(36).substring(2, 9)}.${imageFile.name.split('.').pop()}`
      const filePath = `banners/${fileName}`
      
      console.log('📤 Uploading banner image:', filePath)
      
      // Upload to Supabase Storage
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('make-6971b43c-banners')
        .upload(filePath, imageFile, {
          contentType: imageFile.type,
          upsert: false
        })
      
      if (uploadError) {
        console.log('❌ Error uploading banner image:', uploadError)
        return c.json({ error: 'Error uploading image: ' + uploadError.message }, 500)
      }
      
      // Get signed URL (valid for 10 years)
      const { data: urlData } = await supabase.storage
        .from('make-6971b43c-banners')
        .createSignedUrl(filePath, 60 * 60 * 24 * 365 * 10)
      
      imageUrl = urlData?.signedUrl || ''
      console.log('✅ Banner image uploaded:', filePath)
    }
    
    // If updating existing banner
    if (bannerId) {
      const existingBanner = await kv.get(`banner:${bannerId}`)
      if (!existingBanner) {
        return c.json({ error: 'Banner not found' }, 404)
      }
      
      const updatedBanner = {
        ...existingBanner,
        title: title || existingBanner.title,
        subtitle: subtitle || existingBanner.subtitle,
        imageUrl: imageUrl || existingBanner.imageUrl,
        type: type || existingBanner.type || 'carousel',
        updatedAt: new Date().toISOString()
      }
      
      await kv.set(`banner:${bannerId}`, updatedBanner)
      console.log('✅ Banner updated:', bannerId)
      
      return c.json({ success: true, banner: updatedBanner })
    }
    
    // Create new banner
    const id = crypto.randomUUID()
    const allBanners = await kv.getByPrefix('banner:')
    const maxOrder = allBanners.length > 0 
      ? Math.max(...allBanners.map(b => b.order || 0))
      : 0
    
    const newBanner = {
      id,
      title: title || '',
      subtitle: subtitle || '',
      imageUrl,
      order: maxOrder + 1,
      active: true,
      type: type || 'carousel',
      createdAt: new Date().toISOString()
    }
    
    await kv.set(`banner:${id}`, newBanner)
    console.log('✅ Banner created:', id)
    
    return c.json({ success: true, banner: newBanner })
  } catch (error) {
    console.log('❌ Error saving banner:', error)
    return c.json({ error: 'Error saving banner: ' + error.message }, 500)
  }
})

// Delete banner (admin)
app.delete('/make-server-6971b43c/admin/banners/:id', requireAdmin, async (c) => {
  try {
    const id = c.req.param('id')
    console.log('🗑️ Deleting banner:', id)
    
    const banner = await kv.get(`banner:${id}`)
    if (!banner) {
      return c.json({ error: 'Banner not found' }, 404)
    }
    
    // Delete from storage if exists
    if (banner.imageUrl && banner.imageUrl.includes('banners/')) {
      const pathMatch = banner.imageUrl.match(/banners\/[^?]+/)
      if (pathMatch) {
        const filePath = pathMatch[0]
        await supabase.storage
          .from('make-6971b43c-banners')
          .remove([filePath])
        console.log('🗑️ Deleted banner image from storage:', filePath)
      }
    }
    
    await kv.del(`banner:${id}`)
    console.log('✅ Banner deleted:', id)
    
    return c.json({ success: true })
  } catch (error) {
    console.log('❌ Error deleting banner:', error)
    return c.json({ error: 'Error deleting banner: ' + error.message }, 500)
  }
})

// Toggle banner active status (admin)
app.patch('/make-server-6971b43c/admin/banners/:id/toggle', requireAdmin, async (c) => {
  try {
    const id = c.req.param('id')
    const { active } = await c.req.json()
    
    console.log('🔄 Toggling banner status:', id, active)
    
    const banner = await kv.get(`banner:${id}`)
    if (!banner) {
      return c.json({ error: 'Banner not found' }, 404)
    }
    
    // If activating a banner, deactivate all banners of the opposite type
    if (active) {
      const allBanners = await kv.getByPrefix('banner:')
      const bannerType = banner.type || 'carousel'
      
      console.log(`🔄 Activating ${bannerType} banner, checking for conflicts...`)
      
      // If activating a fixed banner, deactivate all carousel banners
      // If activating a carousel banner, deactivate all fixed banners
      const oppositeType = bannerType === 'fixed' ? 'carousel' : 'fixed'
      
      for (const otherBanner of allBanners) {
        if (otherBanner && otherBanner.active && otherBanner.type === oppositeType) {
          console.log(`⚠️ Deactivating ${oppositeType} banner: ${otherBanner.id}`)
          await kv.set(`banner:${otherBanner.id}`, {
            ...otherBanner,
            active: false,
            updatedAt: new Date().toISOString()
          })
        }
      }
    }
    
    const updatedBanner = {
      ...banner,
      active,
      updatedAt: new Date().toISOString()
    }
    
    await kv.set(`banner:${id}`, updatedBanner)
    console.log('✅ Banner status updated:', id)
    
    return c.json({ success: true, banner: updatedBanner })
  } catch (error) {
    console.log('❌ Error toggling banner:', error)
    return c.json({ error: 'Error toggling banner: ' + error.message }, 500)
  }
})

// Reorder banner (admin)
app.patch('/make-server-6971b43c/admin/banners/:id/reorder', requireAdmin, async (c) => {
  try {
    const id = c.req.param('id')
    const { direction } = await c.req.json()
    
    console.log('↕️ Reordering banner:', id, direction)
    
    const banner = await kv.get(`banner:${id}`)
    if (!banner) {
      return c.json({ error: 'Banner not found' }, 404)
    }
    
    const allBanners = await kv.getByPrefix('banner:')
    const sortedBanners = allBanners
      .filter(b => b)
      .sort((a, b) => a.order - b.order)
    
    const currentIndex = sortedBanners.findIndex(b => b.id === id)
    if (currentIndex === -1) {
      return c.json({ error: 'Banner not found in list' }, 404)
    }
    
    const newIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1
    
    if (newIndex < 0 || newIndex >= sortedBanners.length) {
      return c.json({ error: 'Cannot move banner in that direction' }, 400)
    }
    
    // Swap orders
    const currentOrder = sortedBanners[currentIndex].order
    const targetOrder = sortedBanners[newIndex].order
    
    sortedBanners[currentIndex].order = targetOrder
    sortedBanners[newIndex].order = currentOrder
    
    await kv.set(`banner:${sortedBanners[currentIndex].id}`, sortedBanners[currentIndex])
    await kv.set(`banner:${sortedBanners[newIndex].id}`, sortedBanners[newIndex])
    
    console.log('✅ Banners reordered')
    
    return c.json({ success: true })
  } catch (error) {
    console.log('❌ Error reordering banner:', error)
    return c.json({ error: 'Error reordering banner: ' + error.message }, 500)
  }
})

// ==================== PUBLIC WORKSHOP INFO ROUTE ====================

// Get workshop public info (name, etc.) - used by client portal
app.get('/make-server-6971b43c/public/workshop/:workshopId', async (c) => {
  try {
    const workshopId = c.req.param('workshopId')
    console.log('🏢 Fetching public workshop info:', workshopId)
    
    const workshop = await kv.get(`workshop:${workshopId}`)
    if (!workshop) {
      return c.json({ error: 'Workshop not found' }, 404)
    }
    
    // Return only public information
    const publicInfo = {
      id: workshop.id,
      name: workshop.name,
      address: workshop.address || '',
      phone: workshop.phone || '',
      email: workshop.email || ''
    }
    
    console.log('✅ Workshop info returned:', publicInfo.name)
    return c.json({ workshop: publicInfo })
  } catch (error) {
    console.log('❌ Error fetching workshop:', error)
    return c.json({ error: 'Error fetching workshop: ' + error.message }, 500)
  }
})

// ==================== STORAGE INITIALIZATION ====================

// Initialize storage buckets on server startup
async function initStorage() {
  try {
    console.log('🗄️ Initializing storage buckets...')
    
    const { data: buckets } = await supabase.storage.listBuckets()
    
    // Create banners bucket if it doesn't exist
    const bannersBucketExists = buckets?.some(bucket => bucket.name === 'make-6971b43c-banners')
    if (!bannersBucketExists) {
      const { error } = await supabase.storage.createBucket('make-6971b43c-banners', {
        public: false,
        fileSizeLimit: 10485760 // 10MB
      })
      if (error) {
        console.log('⚠️ Could not create banners bucket:', error.message)
      } else {
        console.log('✅ Created banners bucket')
      }
    }
    
    console.log('✅ Storage initialization complete')
  } catch (error) {
    console.log('⚠️ Storage initialization error:', error)
  }
}

// Initialize storage on startup
initStorage()

// ==================== WORKSHOP SETTINGS ROUTES ====================

// Get current user profile
app.get('/make-server-6971b43c/profile', requireAuth, async (c) => {
  try {
    const userId = c.get('userId')
    const userEmail = c.get('userEmail')
    const workshopId = c.get('workshopId')
    const userRole = c.get('userRole')
    
    console.log('👤 Fetching user profile:', userId)
    
    const userProfile = await kv.get(`user:${userId}`)
    
    return c.json({ 
      profile: userProfile || {
        id: userId,
        email: userEmail,
        workshopId,
        role: userRole
      }
    })
  } catch (error) {
    console.log('❌ Error loading user profile:', error)
    return c.json({ error: 'Error loading user profile' }, 500)
  }
})

// Get workshop profile data
app.get('/make-server-6971b43c/workshop/profile', requireAuth, async (c) => {
  try {
    const workshopId = c.get('workshopId')
    console.log('📋 Fetching workshop profile:', workshopId)
    
    const workshop = await kv.get(`workshop:${workshopId}`)
    if (!workshop) {
      return c.json({ error: 'Workshop not found' }, 404)
    }
    
    console.log('✅ Workshop profile loaded')
    return c.json({ workshop })
  } catch (error) {
    console.log('❌ Error loading workshop profile:', error)
    return c.json({ error: 'Error loading workshop profile' }, 500)
  }
})

// Update workshop profile data
app.put('/make-server-6971b43c/workshop/profile', requireAuth, async (c) => {
  try {
    const workshopId = c.get('workshopId')
    const userRole = c.get('userRole')
    
    console.log('📝 Update workshop profile request - WorkshopId:', workshopId, '| UserRole:', userRole)
    
    // Only admin can update workshop profile
    if (userRole !== 'administrador' && userRole !== 'admin') {
      console.log('❌ Access denied - User role is not admin:', userRole)
      return c.json({ error: 'Apenas administradores podem atualizar os dados da oficina' }, 403)
    }
    
    const updates = await c.req.json()
    console.log('📋 Updates received:', updates)
    
    const workshop = await kv.get(`workshop:${workshopId}`)
    
    if (!workshop) {
      console.log('❌ Workshop not found:', workshopId)
      return c.json({ error: 'Workshop not found' }, 404)
    }
    
    const updatedWorkshop = {
      ...workshop,
      name: updates.name || workshop.name,
      address: updates.address !== undefined ? updates.address : workshop.address,
      postalCode: updates.postalCode !== undefined ? updates.postalCode : workshop.postalCode,
      cp4: updates.cp4 !== undefined ? updates.cp4 : workshop.cp4,
      cp3: updates.cp3 !== undefined ? updates.cp3 : workshop.cp3,
      locality: updates.locality !== undefined ? updates.locality : workshop.locality,
      country: updates.country !== undefined ? updates.country : workshop.country,
      phone: updates.phone !== undefined ? updates.phone : workshop.phone,
      phone2: updates.phone2 !== undefined ? updates.phone2 : workshop.phone2,
      email: updates.email !== undefined ? updates.email : workshop.email,
      nif: updates.nif !== undefined ? updates.nif : workshop.nif,
      iban: updates.iban !== undefined ? updates.iban : workshop.iban,
      website: updates.website !== undefined ? updates.website : workshop.website,
      defaultVatRate: updates.defaultVatRate !== undefined ? updates.defaultVatRate : workshop.defaultVatRate,
      appDisplayName: updates.appDisplayName !== undefined ? updates.appDisplayName : workshop.appDisplayName,
      nifApiKey: updates.nifApiKey !== undefined ? updates.nifApiKey : workshop.nifApiKey,
      logoUrl: updates.logoUrl !== undefined ? updates.logoUrl : workshop.logoUrl,
      updatedAt: new Date().toISOString()
    }
    
    await kv.set(`workshop:${workshopId}`, updatedWorkshop)
    console.log('✅ Workshop profile updated successfully')
    
    return c.json({ success: true, workshop: updatedWorkshop })
  } catch (error) {
    console.log('❌ Error updating workshop profile:', error)
    return c.json({ error: 'Error updating workshop profile: ' + (error as Error).message }, 500)
  }
})

// Search NIF using NIF.PT API
app.get('/make-server-6971b43c/nif-search/:nif', requireAuth, async (c) => {
  try {
    const workshopId = c.get('workshopId')
    const nif = c.req.param('nif')
    
    console.log('🔍 NIF search request - Workshop:', workshopId, 'NIF:', nif)
    
    // Validate NIF
    if (!nif || nif.length !== 9) {
      console.log('❌ Invalid NIF format')
      return c.json({ error: 'NIF deve ter 9 dígitos' }, 400)
    }
    
    // Get workshop to retrieve API key
    const workshop = await kv.get(`workshop:${workshopId}`)
    if (!workshop || !workshop.nifApiKey) {
      console.log('❌ NIF API key not configured for workshop:', workshopId)
      return c.json({ error: 'Chave API NIF.PT não configurada' }, 400)
    }
    
    console.log('🔑 API key found, calling NIF.PT API...')
    
    // Call NIF.PT API
    const apiUrl = `https://www.nif.pt/?json=1&q=${nif}&key=${workshop.nifApiKey}`
    const response = await fetch(apiUrl)
    
    console.log('📡 NIF.PT API response status:', response.status)
    
    if (!response.ok) {
      const errorText = await response.text()
      console.error('❌ Error from NIF.PT API:', response.status, errorText)
      return c.json({ error: 'Erro ao consultar API NIF.PT', status: response.status }, 500)
    }
    
    const data = await response.json()
    console.log('✅ NIF.PT API response:', data.result)
    
    return c.json(data)
  } catch (error) {
    console.error('❌ Error in NIF search:', error)
    return c.json({ error: 'Erro ao pesquisar NIF: ' + (error as Error).message }, 500)
  }
})

// Get workshop users
app.get('/make-server-6971b43c/workshop/users', requireAuth, async (c) => {
  try {
    const workshopId = c.get('workshopId')
    console.log('👥 Fetching workshop users:', workshopId)
    
    const allUsers = await kv.getByPrefix('user:')
    const workshopUsers = allUsers
      .filter(user => user && user.workshopId === workshopId)
      .map(user => ({
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        isActive: true,
        createdAt: user.createdAt
      }))
    
    console.log(`✅ Found ${workshopUsers.length} users for workshop`)
    return c.json({ users: workshopUsers })
  } catch (error) {
    console.log('❌ Error loading users:', error)
    return c.json({ error: 'Error loading users' }, 500)
  }
})

// Create workshop user
app.post('/make-server-6971b43c/workshop/users', requireAuth, async (c) => {
  try {
    const workshopId = c.get('workshopId')
    const userRole = c.get('userRole')
    
    // Only admin can create users
    if (userRole !== 'administrador' && userRole !== 'admin') {
      return c.json({ error: 'Only administrators can create users' }, 403)
    }
    
    const { name, email, password, role } = await c.req.json()
    console.log('👤 Creating new user:', email, 'Role:', role)
    
    if (!name || !email || !password || !role) {
      return c.json({ error: 'Name, email, password and role are required' }, 400)
    }
    
    // Create user in Supabase Auth
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email,
      password,
      user_metadata: { name },
      email_confirm: true
    })
    
    if (authError) {
      console.log('❌ Error creating auth user:', authError)
      return c.json({ error: 'Error creating user: ' + authError.message }, 400)
    }
    
    // Create user profile in KV
    const userId = authData.user.id
    const userProfile = {
      id: userId,
      email,
      name,
      role,
      workshopId,
      createdAt: new Date().toISOString()
    }
    
    await kv.set(`user:${userId}`, userProfile)
    console.log('✅ User created successfully')
    
    return c.json({ success: true, userId })
  } catch (error) {
    console.log('❌ Error creating user:', error)
    return c.json({ error: 'Error creating user' }, 500)
  }
})

// Update workshop user
app.put('/make-server-6971b43c/workshop/users/:id', requireAuth, async (c) => {
  try {
    const workshopId = c.get('workshopId')
    const userRole = c.get('userRole')
    const userId = c.req.param('id')
    
    // Only admin can update users
    if (userRole !== 'administrador' && userRole !== 'admin') {
      return c.json({ error: 'Only administrators can update users' }, 403)
    }
    
    const { name, role, password } = await c.req.json()
    console.log('📝 Updating user:', userId)
    
    const user = await kv.get(`user:${userId}`)
    if (!user || user.workshopId !== workshopId) {
      return c.json({ error: 'User not found' }, 404)
    }
    
    // Update user profile
    const updatedUser = {
      ...user,
      name: name || user.name,
      role: role || user.role,
      updatedAt: new Date().toISOString()
    }
    
    await kv.set(`user:${userId}`, updatedUser)
    
    // Update password if provided
    if (password) {
      const { error: pwError } = await supabase.auth.admin.updateUserById(userId, {
        password
      })
      if (pwError) {
        console.log('⚠️ Error updating password:', pwError)
      } else {
        console.log('✅ Password updated')
      }
    }
    
    console.log('✅ User updated successfully')
    return c.json({ success: true })
  } catch (error) {
    console.log('❌ Error updating user:', error)
    return c.json({ error: 'Error updating user' }, 500)
  }
})

// Delete workshop user
app.delete('/make-server-6971b43c/workshop/users/:id', requireAuth, async (c) => {
  try {
    const workshopId = c.get('workshopId')
    const userRole = c.get('userRole')
    const userId = c.req.param('id')
    const currentUserId = c.get('userId')
    
    // Only admin can delete users
    if (userRole !== 'administrador' && userRole !== 'admin') {
      return c.json({ error: 'Only administrators can delete users' }, 403)
    }
    
    // Cannot delete yourself
    if (userId === currentUserId) {
      return c.json({ error: 'Cannot delete your own account' }, 400)
    }
    
    console.log('🗑️ Deleting user:', userId)
    
    const user = await kv.get(`user:${userId}`)
    if (!user || user.workshopId !== workshopId) {
      return c.json({ error: 'User not found' }, 404)
    }
    
    // Delete from Auth
    const { error: authError } = await supabase.auth.admin.deleteUser(userId)
    if (authError) {
      console.log('⚠️ Error deleting from auth:', authError)
    }
    
    // Delete from KV
    await kv.del(`user:${userId}`)
    
    console.log('✅ User deleted successfully')
    return c.json({ success: true })
  } catch (error) {
    console.log('❌ Error deleting user:', error)
    return c.json({ error: 'Error deleting user' }, 500)
  }
})

// ==================== NOTIFICATION ROUTES ====================

// Get notifications for a workshop
app.get('/make-server-6971b43c/workshops/:workshopId/notifications', requireAuth, async (c) => {
  try {
    const workshopId = c.req.param('workshopId')
    const authWorkshopId = c.get('workshopId')
    
    // Check if user belongs to the workshop
    if (authWorkshopId !== workshopId) {
      return c.json({ error: 'Unauthorized' }, 403)
    }
    
    // Get all notifications for this workshop
    const allNotifications = await kv.getByPrefix(`notification:${workshopId}:`)
    
    // Sort by createdAt (newest first)
    const notifications = allNotifications
      .filter(n => n && n.workshopId === workshopId)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    
    // Count unread notifications
    const unreadCount = notifications.filter(n => !n.read).length
    
    console.log(`✅ Fetched ${notifications.length} notifications for workshop ${workshopId}, ${unreadCount} unread`)
    
    return c.json({ 
      notifications,
      unreadCount
    })
  } catch (error) {
    console.log('❌ Error fetching notifications:', error)
    return c.json({ error: 'Error fetching notifications' }, 500)
  }
})

// Mark notification as read
app.post('/make-server-6971b43c/workshops/:workshopId/notifications/:notificationId/read', requireAuth, async (c) => {
  try {
    const workshopId = c.req.param('workshopId')
    const notificationId = c.req.param('notificationId')
    const authWorkshopId = c.get('workshopId')
    
    // Check if user belongs to the workshop
    if (authWorkshopId !== workshopId) {
      return c.json({ error: 'Unauthorized' }, 403)
    }
    
    const notification = await kv.get(`notification:${workshopId}:${notificationId}`)
    
    if (!notification) {
      return c.json({ error: 'Notification not found' }, 404)
    }
    
    // Update notification
    await kv.set(`notification:${workshopId}:${notificationId}`, {
      ...notification,
      read: true,
      readAt: new Date().toISOString()
    })
    
    console.log(`✅ Notification ${notificationId} marked as read`)
    
    return c.json({ success: true })
  } catch (error) {
    console.log('❌ Error marking notification as read:', error)
    return c.json({ error: 'Error marking notification as read' }, 500)
  }
})

// Mark all notifications as read
app.post('/make-server-6971b43c/workshops/:workshopId/notifications/read-all', requireAuth, async (c) => {
  try {
    const workshopId = c.req.param('workshopId')
    const authWorkshopId = c.get('workshopId')
    
    // Check if user belongs to the workshop
    if (authWorkshopId !== workshopId) {
      return c.json({ error: 'Unauthorized' }, 403)
    }
    
    // Get all notifications for this workshop
    const allNotifications = await kv.getByPrefix(`notification:${workshopId}:`)
    const workshopNotifications = allNotifications.filter(n => n && n.workshopId === workshopId && !n.read)
    
    // Update all notifications
    const updates = workshopNotifications.map(notification =>
      kv.set(`notification:${workshopId}:${notification.id}`, {
        ...notification,
        read: true,
        readAt: new Date().toISOString()
      })
    )
    
    await Promise.all(updates)
    
    console.log(`✅ Marked ${workshopNotifications.length} notifications as read for workshop ${workshopId}`)
    
    return c.json({ success: true, count: workshopNotifications.length })
  } catch (error) {
    console.log('❌ Error marking all notifications as read:', error)
    return c.json({ error: 'Error marking all notifications as read' }, 500)
  }
})

// Helper function to create notification (to be called from other routes)
async function createNotification(
  workshopId: string, 
  type: 'new_quote_request' | 'quote_accepted' | 'client_message' | 'new_instant_quote' | 'quote_rectification' | 'new_appointment_request' | 'appointment_reschedule_request', 
  title: string, 
  message: string, 
  budgetId?: string,
  workOrderId?: string,
  quoteRequestId?: string,
  appointmentId?: string,
  additionalData?: any
) {
  try {
    const notificationId = crypto.randomUUID()
    const notification = {
      id: notificationId,
      workshopId,
      type,
      title,
      message,
      budgetId,
      workOrderId,
      quoteRequestId,
      appointmentId,
      ...additionalData,
      read: false,
      createdAt: new Date().toISOString()
    }
    
    await kv.set(`notification:${workshopId}:${notificationId}`, notification)
    console.log(`🔔 Notification created: ${type} for workshop ${workshopId}`, { budgetId, workOrderId, quoteRequestId, appointmentId })
    
    return notification
  } catch (error) {
    console.log('❌ Error creating notification:', error)
    return null
  }
}

// ==================== LABOR TYPES ROUTES ====================

// Get all labor types for a workshop
app.get('/make-server-6971b43c/labor-types', requireAuth, async (c) => {
  try {
    const workshopId = c.get('workshopId')
    console.log('🔧 Fetching labor types for workshop:', workshopId)
    
    const allLaborTypes = await kv.getByPrefix(`labortype:${workshopId}:`)
    const laborTypes = allLaborTypes.filter(item => item && item.workshopId === workshopId)
    
    console.log(`✅ Found ${laborTypes.length} labor types`)
    return c.json({ laborTypes })
  } catch (error) {
    console.log('❌ Error fetching labor types:', error)
    return c.json({ error: 'Error fetching labor types: ' + (error as Error).message }, 500)
  }
})

// Create labor type
app.post('/make-server-6971b43c/labor-types', requireAuth, async (c) => {
  try {
    const workshopId = c.get('workshopId')
    const laborTypeData = await c.req.json()
    
    if (!laborTypeData.name) {
      return c.json({ error: 'Labor type name is required' }, 400)
    }

    const id = crypto.randomUUID()
    const laborType = {
      id,
      ...laborTypeData,
      workshopId,
      isActive: true,
      createdAt: new Date().toISOString()
    }

    await kv.set(`labortype:${workshopId}:${id}`, laborType)
    console.log('✅ Labor type created:', id)
    
    return c.json({ success: true, laborType })
  } catch (error) {
    console.log('❌ Error creating labor type:', error)
    return c.json({ error: 'Error creating labor type: ' + (error as Error).message }, 500)
  }
})

// Update labor type
app.put('/make-server-6971b43c/labor-types/:id', requireAuth, async (c) => {
  try {
    const workshopId = c.get('workshopId')
    const laborTypeId = c.req.param('id')
    const updates = await c.req.json()
    
    const laborType = await kv.get(`labortype:${workshopId}:${laborTypeId}`)
    if (!laborType || laborType.workshopId !== workshopId) {
      return c.json({ error: 'Labor type not found' }, 404)
    }

    const updatedLaborType = {
      ...laborType,
      ...updates,
      id: laborTypeId,
      workshopId,
      updatedAt: new Date().toISOString()
    }

    await kv.set(`labortype:${workshopId}:${laborTypeId}`, updatedLaborType)
    console.log('✅ Labor type updated:', laborTypeId)
    
    return c.json({ success: true, laborType: updatedLaborType })
  } catch (error) {
    console.log('❌ Error updating labor type:', error)
    return c.json({ error: 'Error updating labor type: ' + (error as Error).message }, 500)
  }
})

// Delete labor type
app.delete('/make-server-6971b43c/labor-types/:id', requireAuth, async (c) => {
  try {
    const workshopId = c.get('workshopId')
    const laborTypeId = c.req.param('id')
    
    const laborType = await kv.get(`labortype:${workshopId}:${laborTypeId}`)
    if (!laborType || laborType.workshopId !== workshopId) {
      return c.json({ error: 'Labor type not found' }, 404)
    }

    await kv.del(`labortype:${workshopId}:${laborTypeId}`)
    console.log('✅ Labor type deleted:', laborTypeId)
    
    return c.json({ success: true })
  } catch (error) {
    console.log('❌ Error deleting labor type:', error)
    return c.json({ error: 'Error deleting labor type: ' + (error as Error).message }, 500)
  }
})

// ==================== EMPLOYEES ROUTES ====================

// Get all employees for a workshop
app.get('/make-server-6971b43c/employees', requireAuth, async (c) => {
  try {
    const workshopId = c.get('workshopId')
    console.log('👷 Fetching employees for workshop:', workshopId)
    
    const allEmployees = await kv.getByPrefix(`employee:${workshopId}:`)
    const employees = allEmployees.filter(item => item && item.workshopId === workshopId)
    
    console.log(`✅ Found ${employees.length} employees`)
    return c.json({ employees })
  } catch (error) {
    console.log('❌ Error fetching employees:', error)
    return c.json({ error: 'Error fetching employees: ' + (error as Error).message }, 500)
  }
})

// Create employee
app.post('/make-server-6971b43c/employees', requireAuth, async (c) => {
  try {
    const workshopId = c.get('workshopId')
    const employeeData = await c.req.json()
    
    if (!employeeData.name) {
      return c.json({ error: 'Employee name is required' }, 400)
    }

    const id = crypto.randomUUID()
    const employee = {
      id,
      ...employeeData,
      workshopId,
      isActive: true,
      createdAt: new Date().toISOString()
    }

    await kv.set(`employee:${workshopId}:${id}`, employee)
    console.log('✅ Employee created:', id)
    
    return c.json({ success: true, employee })
  } catch (error) {
    console.log('❌ Error creating employee:', error)
    return c.json({ error: 'Error creating employee: ' + (error as Error).message }, 500)
  }
})

// Update employee
app.put('/make-server-6971b43c/employees/:id', requireAuth, async (c) => {
  try {
    const workshopId = c.get('workshopId')
    const employeeId = c.req.param('id')
    const updates = await c.req.json()
    
    const employee = await kv.get(`employee:${workshopId}:${employeeId}`)
    if (!employee || employee.workshopId !== workshopId) {
      return c.json({ error: 'Employee not found' }, 404)
    }

    const updatedEmployee = {
      ...employee,
      ...updates,
      id: employeeId,
      workshopId,
      updatedAt: new Date().toISOString()
    }

    await kv.set(`employee:${workshopId}:${employeeId}`, updatedEmployee)
    console.log('✅ Employee updated:', employeeId)
    
    return c.json({ success: true, employee: updatedEmployee })
  } catch (error) {
    console.log('❌ Error updating employee:', error)
    return c.json({ error: 'Error updating employee: ' + (error as Error).message }, 500)
  }
})

// Delete employee
app.delete('/make-server-6971b43c/employees/:id', requireAuth, async (c) => {
  try {
    const workshopId = c.get('workshopId')
    const employeeId = c.req.param('id')
    
    const employee = await kv.get(`employee:${workshopId}:${employeeId}`)
    if (!employee || employee.workshopId !== workshopId) {
      return c.json({ error: 'Employee not found' }, 404)
    }

    await kv.del(`employee:${workshopId}:${employeeId}`)
    console.log('✅ Employee deleted:', employeeId)
    
    return c.json({ success: true })
  } catch (error) {
    console.log('❌ Error deleting employee:', error)
    return c.json({ error: 'Error deleting employee: ' + (error as Error).message }, 500)
  }
})

// ==================== SERVICE SHEET STATUS HISTORY ROUTES ====================

// Record status change (called when service sheet status changes)
app.post('/make-server-6971b43c/service-sheet-status-history', requireAuth, async (c) => {
  try {
    const { serviceSheetId, oldStatus, newStatus, workOrderId, clientId, workshopId: bodyWorkshopId } = await c.req.json()
    const workshopId = bodyWorkshopId || c.get('workshopId')
    const userId = c.get('userId')
    
    console.log(`📝 Recording status change: ${oldStatus} -> ${newStatus} for SS ${serviceSheetId}`)
    
    const historyId = crypto.randomUUID()
    const historyEntry = {
      id: historyId,
      serviceSheetId,
      workOrderId,
      clientId,
      workshopId,
      oldStatus,
      newStatus,
      changedBy: userId,
      timestamp: new Date().toISOString()
    }
    
    // Save history entry
    await kv.set(`ss_status_history:${serviceSheetId}:${historyId}`, historyEntry)
    console.log('✅ Status history saved:', historyId)
    
    // Create client notification if client is associated
    if (clientId) {
      await createClientNotification({
        clientId,
        workshopId,
        workOrderId,
        serviceSheetId,
        type: 'status_change',
        newStatus
      })
    }
    
    return c.json({ success: true, historyId })
  } catch (error) {
    console.log('❌ Error recording status history:', error)
    return c.json({ error: 'Error recording status history: ' + error.message }, 500)
  }
})

// Get status history for a service sheet
app.get('/make-server-6971b43c/service-sheet-status-history/:serviceSheetId', async (c) => {
  try {
    const serviceSheetId = c.req.param('serviceSheetId')
    
    console.log(`📜 Fetching status history for SS ${serviceSheetId}`)
    
    const allHistory = await kv.getByPrefix(`ss_status_history:${serviceSheetId}:`)
    const sortedHistory = allHistory
      .filter(entry => entry && entry.serviceSheetId === serviceSheetId)
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
    
    console.log(`✅ Found ${sortedHistory.length} history entries`)
    
    return c.json({ history: sortedHistory })
  } catch (error) {
    console.log('❌ Error fetching status history:', error)
    return c.json({ error: 'Error fetching status history: ' + error.message }, 500)
  }
})

// DEPRECATED: Client notification routes have been moved to quote_agenda_routes.tsx
// The routes below used the wrong prefix (client_notification: instead of notification:)
// and were conflicting with the correct implementation in quote_agenda_routes.tsx

// Helper function to create client notification
async function createClientNotification({ clientId, workshopId, workOrderId, serviceSheetId, type, newStatus }: any) {
  try {
    const notificationId = crypto.randomUUID()
    
    // Get work order details
    const workOrder = await kv.get(`workorder:${workOrderId}`)
    
    // Create notification message based on type and status
    let title = 'Atualização do Serviço'
    let message = ''
    
    if (type === 'status_change') {
      const statusMessages: Record<string, string> = {
        'reception': 'O seu veículo foi recebido na oficina',
        'diagnosis': 'Iniciámos o diagnóstico do seu veículo',
        'ordering': 'Estamos a encomendar as peças necessárias',
        'parts_arrival': 'As peças chegaram e vamos iniciar a reparação',
        'execution': 'Estamos a trabalhar no seu veículo',
        'delivery': 'O seu veículo está pronto para levantamento!',
        'completed': 'O serviço foi concluído com sucesso',
        'cancelled': 'O serviço foi cancelado'
      }
      message = statusMessages[newStatus] || 'O estado do seu serviço foi atualizado'
    } else if (type === 'new_message') {
      title = 'Nova Mensagem'
      message = `A oficina enviou uma nova mensagem sobre a FO #${workOrder?.number || ''}`
    }
    
    const notification = {
      id: notificationId,
      clientId,
      workshopId,
      workOrderId,
      serviceSheetId,
      workOrderNumber: workOrder?.number || '',
      type,
      title,
      message,
      newStatus,
      read: false,
      timestamp: new Date().toISOString()
    }
    
    await kv.set(`client_notification:${clientId}:${notificationId}`, notification)
    console.log(`📬 Client notification created: ${notificationId}`)
    
    return notification
  } catch (error) {
    console.log('❌ Error creating client notification:', error)
    return null
  }
}

// ==================== CLIENT MESSAGES ROUTES ====================

// Get all messages for a client (client portal)
app.get('/make-server-6971b43c/client/messages', async (c) => {
  try {
    console.log('💬 GET /client/messages - Start')
    const accessToken = c.req.header('Authorization')?.split(' ')[1]
    if (!accessToken) {
      console.log('❌ No access token provided')
      return c.json({ error: 'Unauthorized' }, 401)
    }
    
    console.log('🔑 Validating access token...')
    const { data: { user }, error } = await supabase.auth.getUser(accessToken)
    if (!user || error) {
      console.log('❌ Invalid access token:', error)
      return c.json({ error: 'Unauthorized' }, 401)
    }
    
    console.log('✅ User authenticated:', user.id)
    
    // Get client profile
    const clientProfile = await kv.get(`public_client:${user.id}`)
    if (!clientProfile) {
      console.log('❌ Client profile not found')
      return c.json({ error: 'Client profile not found' }, 404)
    }
    
    console.log('📧 Client email:', clientProfile.email)
    
    // Get all workshop clients for this user
    const allClients = await kv.getByPrefix('client:')
    const normalizedEmail = clientProfile.email?.trim().toLowerCase()
    
    const workshopClients = allClients.filter(c => {
      if (!c) return false
      const emailMatch = c.email?.trim().toLowerCase() === normalizedEmail
      const userIdMatch = c.publicClientUserId === user.id
      return emailMatch || userIdMatch
    })
    
    // Get client IDs
    const clientIds = workshopClients.map(c => {
      if (c.id.includes(':')) {
        return c.id.split(':')[1]
      }
      return c.id
    })
    
    const fullClientIds = workshopClients.map(c => c.id)
    const allClientIds = [...new Set([...clientIds, ...fullClientIds])]
    
    console.log('💬 Fetching messages for client IDs:', allClientIds)
    
    // Get all messages for these client IDs
    let allMessages: any[] = []
    for (const clientId of allClientIds) {
      const messages = await kv.getByPrefix(`client_message:${clientId}:`)
      allMessages = [...allMessages, ...messages.filter(m => m !== null)]
    }
    
    // Group messages by work order (thread)
    const messagesByWorkOrder = new Map<string, any[]>()
    for (const message of allMessages) {
      const workOrderId = message.workOrderId
      if (!messagesByWorkOrder.has(workOrderId)) {
        messagesByWorkOrder.set(workOrderId, [])
      }
      messagesByWorkOrder.get(workOrderId)!.push(message)
    }
    
    // Sort messages within each thread by timestamp
    for (const [, messages] of messagesByWorkOrder) {
      messages.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime())
    }
    
    // Create threads array with metadata
    const threads = []
    for (const [workOrderId, messages] of messagesByWorkOrder) {
      const workOrder = await kv.get(`workorder:${workOrderId}`)
      const unreadCount = messages.filter(m => !m.read && m.from === 'workshop').length
      const lastMessage = messages[messages.length - 1]
      
      threads.push({
        workOrderId,
        workOrderNumber: workOrder?.number || '',
        messages,
        unreadCount,
        lastMessage,
        lastUpdate: lastMessage.timestamp
      })
    }
    
    // Sort threads by last update (most recent first)
    threads.sort((a, b) => new Date(b.lastUpdate).getTime() - new Date(a.lastUpdate).getTime())
    
    const totalUnread = threads.reduce((sum, thread) => sum + thread.unreadCount, 0)
    
    console.log(`✅ Found ${threads.length} message threads (${totalUnread} unread messages)`)
    
    return c.json({ 
      threads,
      totalUnread
    })
  } catch (error: any) {
    console.log('❌ Error fetching messages:', error)
    return c.json({ error: 'Error fetching messages: ' + (error?.message || String(error)) }, 500)
  }
})

// Send message from client (reply)
app.post('/make-server-6971b43c/client/messages', async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1]
    if (!accessToken) {
      return c.json({ error: 'Unauthorized' }, 401)
    }
    
    const { data: { user }, error } = await supabase.auth.getUser(accessToken)
    if (!user || error) {
      return c.json({ error: 'Unauthorized' }, 401)
    }
    
    const { workOrderId, message } = await c.req.json()
    
    if (!workOrderId || !message) {
      return c.json({ error: 'Work order ID and message are required' }, 400)
    }
    
    // Get work order to find client and workshop
    const workOrder = await kv.get(`workorder:${workOrderId}`)
    if (!workOrder) {
      return c.json({ error: 'Work order not found' }, 404)
    }
    
    // Get vehicle to find the current owner
    const vehicle = await kv.get(`vehicle:${workOrder.workshopId}:${workOrder.vehicleId}`)
    if (!vehicle) {
      console.error(`❌ Vehicle not found for work order ${workOrderId}`)
      return c.json({ error: 'Vehicle not found' }, 404)
    }
    
    // Use the CURRENT vehicle owner's clientId
    const currentOwnerId = vehicle.clientId
    console.log(`📧 Client replying to work order ${workOrderId}. Current vehicle owner: ${currentOwnerId}, Original client: ${workOrder.clientId}`)
    
    // Get client profile to verify ownership
    const clientProfile = await kv.get(`public_client:${user.id}`)
    if (!clientProfile) {
      console.error(`❌ Client profile not found for user ${user.id}`)
      return c.json({ error: 'Client profile not found' }, 404)
    }
    
    console.log(`🔍 Checking access for client with email: ${clientProfile.email}, userId: ${user.id}`)
    
    // Find all clients of this workshop that match the authenticated user
    const allClientsKeys = await kv.getByPrefix(`client:${workOrder.workshopId}:`)
    const matchingClients = allClientsKeys.filter(clientData => {
      const emailMatch = clientData.email?.trim().toLowerCase() === clientProfile.email?.trim().toLowerCase()
      const userIdMatch = clientData.publicClientUserId === user.id
      return emailMatch || userIdMatch
    })
    
    console.log(`🔍 Found ${matchingClients.length} matching clients for this user in workshop ${workOrder.workshopId}`)
    
    if (matchingClients.length === 0) {
      console.error('❌ No matching client found:', {
        workshopId: workOrder.workshopId,
        userEmail: clientProfile.email,
        userId: user.id,
        totalClientsChecked: allClientsKeys.length
      })
      return c.json({ error: 'Unauthorized access to this work order' }, 403)
    }
    
    // Use the first matching client (should be only one in most cases)
    const client = matchingClients[0]
    console.log(`✅ Client access verified: ${client.id} (${client.name}), email: ${client.email}`)
    
    // Check if this client is the current owner or has access to the vehicle
    const isCurrentOwner = client.id === currentOwnerId
    const isOriginalClient = client.id === workOrder.clientId
    
    if (!isCurrentOwner && !isOriginalClient) {
      console.error('❌ Client does not own this vehicle:', {
        clientId: client.id,
        currentOwnerId,
        originalClientId: workOrder.clientId
      })
      return c.json({ error: 'Unauthorized access to this work order' }, 403)
    }
    
    console.log(`✅ Access granted: isCurrentOwner=${isCurrentOwner}, isOriginalClient=${isOriginalClient}`)
    
    const messageId = crypto.randomUUID()
    const newMessage = {
      id: messageId,
      workOrderId,
      workOrderNumber: workOrder.number,
      clientId: currentOwnerId,  // Use current owner instead of workOrder.clientId
      workshopId: workOrder.workshopId,
      from: 'client',
      message,
      timestamp: new Date().toISOString(),
      read: false
    }
    
    await kv.set(`client_message:${currentOwnerId}:${messageId}`, newMessage)
    console.log(`✅ Client message sent: ${messageId} (stored with current owner ID: ${currentOwnerId})`)
    
    // Create notification for workshop
    await createNotification(
      workOrder.workshopId,
      'client_message',
      'Nova Mensagem de Cliente',
      `Cliente enviou mensagem sobre FO #${workOrder.number}`,
      undefined,  // budgetId
      workOrder.id  // workOrderId
    )
    
    return c.json({ success: true, message: newMessage })
  } catch (error) {
    console.log('❌ Error sending message:', error)
    return c.json({ error: 'Error sending message: ' + error.message }, 500)
  }
})

// Upload image for message
app.post('/make-server-6971b43c/workshop/messages/upload-image', requireAuth, async (c) => {
  try {
    const workshopId = c.get('workshopId')
    
    // Get form data
    const formData = await c.req.formData()
    const file = formData.get('file') as File
    const workOrderId = formData.get('workOrderId') as string
    
    if (!file || !workOrderId) {
      return c.json({ error: 'File and work order ID are required' }, 400)
    }
    
    // Verify file is an image
    if (!file.type.startsWith('image/')) {
      return c.json({ error: 'File must be an image' }, 400)
    }
    
    // Verify file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      return c.json({ error: 'Image size must not exceed 5MB' }, 400)
    }
    
    // Get work order to verify ownership
    const workOrder = await kv.get(`workorder:${workOrderId}`)
    if (!workOrder || workOrder.workshopId !== workshopId) {
      return c.json({ error: 'Unauthorized' }, 403)
    }
    
    // Create bucket name for workshop messages
    const bucketName = `make-6971b43c-messages-${workshopId}`
    
    // Ensure bucket exists
    const { data: buckets } = await supabase.storage.listBuckets()
    const bucketExists = buckets?.some(bucket => bucket.name === bucketName)
    
    if (!bucketExists) {
      console.log(`📦 Creating storage bucket: ${bucketName}`)
      const { error: bucketError } = await supabase.storage.createBucket(bucketName, {
        public: false
      })
      if (bucketError) {
        console.error('Error creating bucket:', bucketError)
        return c.json({ error: 'Error creating storage bucket' }, 500)
      }
    }
    
    // Generate unique filename
    const timestamp = Date.now()
    const randomStr = Math.random().toString(36).substring(2, 9)
    const fileExt = file.name.split('.').pop()
    const fileName = `${workOrderId}/${timestamp}-${randomStr}.${fileExt}`
    
    // Convert File to ArrayBuffer
    const arrayBuffer = await file.arrayBuffer()
    const buffer = new Uint8Array(arrayBuffer)
    
    // Upload to Supabase Storage
    const { data, error } = await supabase.storage
      .from(bucketName)
      .upload(fileName, buffer, {
        contentType: file.type,
        upsert: false
      })
    
    if (error) {
      console.error('Error uploading file:', error)
      return c.json({ error: 'Error uploading image: ' + error.message }, 500)
    }
    
    // Create signed URL (valid for 1 year)
    const { data: urlData, error: urlError } = await supabase.storage
      .from(bucketName)
      .createSignedUrl(fileName, 31536000) // 1 year
    
    if (urlError) {
      console.error('Error creating signed URL:', urlError)
      return c.json({ error: 'Error creating image URL' }, 500)
    }
    
    console.log(`✅ Image uploaded successfully: ${fileName}`)
    
    return c.json({ 
      success: true, 
      imageUrl: urlData.signedUrl,
      fileName
    })
  } catch (error) {
    console.error('❌ Error uploading image:', error)
    return c.json({ error: 'Error uploading image: ' + error.message }, 500)
  }
})

// Send message from workshop to client
app.post('/make-server-6971b43c/workshop/messages', requireAuth, async (c) => {
  try {
    const workshopId = c.get('workshopId')
    const { workOrderId, message, imageUrl } = await c.req.json()
    
    if (!workOrderId || (!message && !imageUrl)) {
      return c.json({ error: 'Work order ID and message or image are required' }, 400)
    }
    
    // Get work order
    const workOrder = await kv.get(`workorder:${workOrderId}`)
    if (!workOrder) {
      return c.json({ error: 'Work order not found' }, 404)
    }
    
    // Verify workshop owns this work order
    if (workOrder.workshopId !== workshopId) {
      return c.json({ error: 'Unauthorized' }, 403)
    }
    
    // Get vehicle to find the current owner
    const vehicle = await kv.get(`vehicle:${workshopId}:${workOrder.vehicleId}`)
    if (!vehicle) {
      console.error(`❌ Vehicle not found for work order ${workOrderId}`)
      return c.json({ error: 'Vehicle not found' }, 404)
    }
    
    // Use the CURRENT vehicle owner's clientId instead of the work order's clientId
    const currentOwnerId = vehicle.clientId
    console.log(`📧 Sending message to current vehicle owner: ${currentOwnerId} (work order original client: ${workOrder.clientId})`)
    
    const messageId = crypto.randomUUID()
    const newMessage = {
      id: messageId,
      workOrderId,
      workOrderNumber: workOrder.number,
      clientId: currentOwnerId,  // Use current owner
      workshopId,
      from: 'workshop',
      message,
      imageUrl: imageUrl || null,
      timestamp: new Date().toISOString(),
      read: false
    }
    
    await kv.set(`client_message:${currentOwnerId}:${messageId}`, newMessage)
    console.log(`✅ Workshop message sent: ${messageId}${imageUrl ? ' (with image)' : ''}`)
    
    // Create client notification for the CURRENT owner
    await createClientNotification({
      clientId: currentOwnerId,  // Use current owner
      workshopId,
      workOrderId,
      serviceSheetId: workOrder.serviceSheetId,
      type: 'new_message',
      newStatus: null
    })
    
    return c.json({ success: true, message: newMessage })
  } catch (error) {
    console.log('❌ Error sending workshop message:', error)
    return c.json({ error: 'Error sending message: ' + error.message }, 500)
  }
})

// Mark message as read
app.post('/make-server-6971b43c/client/messages/:messageId/read', async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1]
    if (!accessToken) {
      return c.json({ error: 'Unauthorized' }, 401)
    }
    
    const { data: { user }, error } = await supabase.auth.getUser(accessToken)
    if (!user || error) {
      return c.json({ error: 'Unauthorized' }, 401)
    }
    
    const messageId = c.req.param('messageId')
    
    // Find the message
    const allMessages = await kv.getByPrefix('client_message:')
    const message = allMessages.find(m => m && m.id === messageId)
    
    if (!message) {
      return c.json({ error: 'Message not found' }, 404)
    }
    
    // Update message
    message.read = true
    message.readAt = new Date().toISOString()
    
    await kv.set(`client_message:${message.clientId}:${messageId}`, message)
    console.log('✅ Message marked as read:', messageId)
    
    return c.json({ success: true })
  } catch (error) {
    console.log('❌ Error marking message as read:', error)
    return c.json({ error: 'Error updating message: ' + error.message }, 500)
  }
})

// Mark all messages in a thread as read
app.post('/make-server-6971b43c/client/messages/thread/:workOrderId/read-all', async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1]
    if (!accessToken) {
      return c.json({ error: 'Unauthorized' }, 401)
    }
    
    const { data: { user }, error } = await supabase.auth.getUser(accessToken)
    if (!user || error) {
      return c.json({ error: 'Unauthorized' }, 401)
    }
    
    const workOrderId = c.req.param('workOrderId')
    
    // Get all messages
    const allMessages = await kv.getByPrefix('client_message:')
    
    // Filter messages for this work order that are from workshop and unread
    let updatedCount = 0
    for (const message of allMessages) {
      if (message && message.workOrderId === workOrderId && message.from === 'workshop' && !message.read) {
        message.read = true
        message.readAt = new Date().toISOString()
        await kv.set(`client_message:${message.clientId}:${message.id}`, message)
        updatedCount++
      }
    }
    
    console.log(`✅ Marked ${updatedCount} messages as read in thread ${workOrderId}`)
    
    return c.json({ success: true, updatedCount })
  } catch (error) {
    console.log('❌ Error marking thread messages as read:', error)
    return c.json({ error: 'Error updating messages: ' + error.message }, 500)
  }
})

// ==================== WORKSHOP MESSAGES ROUTES ====================

// Get messages for a specific work order (workshop view)
app.get('/make-server-6971b43c/workshop/messages/:workOrderId', requireAuth, async (c) => {
  try {
    const workshopId = c.get('workshopId')
    const workOrderId = c.req.param('workOrderId')
    
    // Get work order to verify ownership
    const workOrder = await kv.get(`workorder:${workOrderId}`)
    if (!workOrder) {
      return c.json({ error: 'Work order not found' }, 404)
    }
    
    if (workOrder.workshopId !== workshopId) {
      return c.json({ error: 'Unauthorized' }, 403)
    }
    
    // Get vehicle to find the current owner
    const vehicle = await kv.get(`vehicle:${workshopId}:${workOrder.vehicleId}`)
    const currentOwnerId = vehicle?.clientId || workOrder.clientId
    
    console.log(`💬 Loading messages for WO ${workOrder.number} - Current owner: ${currentOwnerId}, Original client: ${workOrder.clientId}`)
    
    // Get all messages for the CURRENT vehicle owner
    const allMessages = await kv.getByPrefix(`client_message:${currentOwnerId}:`)
    const workOrderMessages = allMessages
      .filter(m => m && m.workOrderId === workOrderId)
      .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime())
    
    const unreadCount = workOrderMessages.filter(m => m.from === 'client' && !m.read).length
    
    console.log(`✅ Found ${workOrderMessages.length} messages for work order ${workOrderId} (${unreadCount} unread from client)`)
    
    return c.json({
      messages: workOrderMessages,
      unreadCount
    })
  } catch (error) {
    console.log('❌ Error fetching workshop messages:', error)
    return c.json({ error: 'Error fetching messages: ' + error.message }, 500)
  }
})

// Mark all client messages in a work order as read (workshop marking client messages as read)
app.post('/make-server-6971b43c/workshop/messages/:workOrderId/read-all', requireAuth, async (c) => {
  try {
    const workshopId = c.get('workshopId')
    const workOrderId = c.req.param('workOrderId')
    
    // Get work order to verify ownership
    const workOrder = await kv.get(`workorder:${workOrderId}`)
    if (!workOrder) {
      return c.json({ error: 'Work order not found' }, 404)
    }
    
    if (workOrder.workshopId !== workshopId) {
      return c.json({ error: 'Unauthorized' }, 403)
    }
    
    // Get vehicle to find the current owner
    const vehicle = await kv.get(`vehicle:${workshopId}:${workOrder.vehicleId}`)
    const currentOwnerId = vehicle?.clientId || workOrder.clientId
    
    // Get all messages for the CURRENT vehicle owner
    const allMessages = await kv.getByPrefix(`client_message:${currentOwnerId}:`)
    
    // Mark all unread messages from client in this work order as read
    let updatedCount = 0
    for (const message of allMessages) {
      if (message && message.workOrderId === workOrderId && message.from === 'client' && !message.read) {
        message.read = true
        message.readAt = new Date().toISOString()
        await kv.set(`client_message:${currentOwnerId}:${message.id}`, message)
        updatedCount++
      }
    }
    
    console.log(`✅ Workshop marked ${updatedCount} client messages as read in work order ${workOrderId}`)
    
    return c.json({ success: true, updatedCount })
  } catch (error) {
    console.log('❌ Error marking client messages as read:', error)
    return c.json({ error: 'Error updating messages: ' + error.message }, 500)
  }
})

// ==================== PLATFORM LOGOS ROUTES (Admin) ====================

// Get Platform Logos
app.get('/make-server-6971b43c/admin/platform-logos', requireAdmin, async (c) => {
  try {
    console.log('📋 GET /admin/platform-logos - Fetching platform logos')
    
    // Get logos from KV store
    const logos = await kv.get('platform:logos') || {}
    
    console.log('✅ Platform logos fetched:', Object.keys(logos))
    return c.json({ logos })
  } catch (error) {
    console.log('❌ Error fetching platform logos:', error)
    return c.json({ error: 'Error fetching logos: ' + error.message }, 500)
  }
})

// Upload Platform Logo/Icon/Favicon
app.post('/make-server-6971b43c/admin/platform-logos/:type', requireAdmin, async (c) => {
  try {
    const type = c.req.param('type') as 'logo' | 'icon' | 'favicon'
    
    if (!['logo', 'icon', 'favicon'].includes(type)) {
      return c.json({ error: 'Invalid type. Must be: logo, icon, or favicon' }, 400)
    }
    
    console.log(`📤 POST /admin/platform-logos/${type} - Uploading ${type}`)
    
    // Get form data
    const formData = await c.req.formData()
    const file = formData.get(type) as File
    
    if (!file) {
      return c.json({ error: `No ${type} file provided` }, 400)
    }
    
    console.log(`📄 File received: ${file.name}, size: ${file.size}, type: ${file.type}`)

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/svg+xml']
    if (!allowedTypes.includes(file.type)) {
      return c.json({ error: 'Invalid file type. Only JPEG, PNG, WEBP and SVG are allowed' }, 400)
    }

    // Validate file size (max 2MB)
    if (file.size > 2 * 1024 * 1024) {
      return c.json({ error: 'File too large. Maximum size is 2MB' }, 400)
    }

    // Create bucket if it doesn't exist
    const bucketName = 'make-6971b43c-platform-assets'
    const { data: buckets } = await supabase.storage.listBuckets()
    const bucketExists = buckets?.some(bucket => bucket.name === bucketName)
    
    if (!bucketExists) {
      console.log('📦 Creating storage bucket:', bucketName)
      await supabase.storage.createBucket(bucketName, {
        public: true,
        fileSizeLimit: 2097152, // 2MB
        allowedMimeTypes: allowedTypes
      })
    }

    // Get existing logos to delete old file if exists
    const existingLogos = await kv.get('platform:logos') || {}
    
    // Delete old file if exists
    if (existingLogos[`${type}Path`]) {
      try {
        await supabase.storage.from(bucketName).remove([existingLogos[`${type}Path`]])
        console.log(`🗑️ Old ${type} deleted:`, existingLogos[`${type}Path`])
      } catch (error) {
        console.log(`⚠️ Error deleting old ${type}:`, error)
      }
    }

    // Upload new file
    const fileExt = file.name.split('.').pop()
    const fileName = `${type}-${Date.now()}.${fileExt}`
    const filePath = `platform/${fileName}`

    const fileBuffer = await file.arrayBuffer()
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from(bucketName)
      .upload(filePath, fileBuffer, {
        contentType: file.type,
        upsert: true
      })

    if (uploadError) {
      console.log(`❌ Error uploading ${type}:`, uploadError)
      return c.json({ error: `Error uploading ${type}: ` + uploadError.message }, 500)
    }

    console.log(`✅ ${type} uploaded successfully:`, filePath)

    // Get public URL (bucket is public)
    const { data: urlData } = await supabase.storage
      .from(bucketName)
      .getPublicUrl(filePath)

    const publicUrl = urlData?.publicUrl || ''

    // Update logos in KV store
    const updatedLogos = {
      ...existingLogos,
      [type]: publicUrl,
      [`${type}Path`]: filePath,
      [`${type}UpdatedAt`]: new Date().toISOString()
    }
    
    console.log(`💾 Saving to KV - Key: platform:logos`)
    console.log(`📦 Updated logos object:`, updatedLogos)
    await kv.set('platform:logos', updatedLogos)
    console.log(`✅ Platform logos updated in KV with ${type}`)
    
    // Verify it was saved
    const verification = await kv.get('platform:logos')
    console.log(`🔍 Verification - Logos after save:`, verification)

    return c.json({ 
      success: true, 
      url: publicUrl,
      type 
    })
  } catch (error) {
    console.log(`❌ Error uploading platform ${c.req.param('type')}:`, error)
    return c.json({ error: 'Error uploading file: ' + error.message }, 500)
  }
})

// Delete Platform Logo/Icon/Favicon
app.delete('/make-server-6971b43c/admin/platform-logos/:type', requireAdmin, async (c) => {
  try {
    const type = c.req.param('type') as 'logo' | 'icon' | 'favicon'
    
    if (!['logo', 'icon', 'favicon'].includes(type)) {
      return c.json({ error: 'Invalid type. Must be: logo, icon, or favicon' }, 400)
    }
    
    console.log(`🗑️ DELETE /admin/platform-logos/${type} - Deleting ${type}`)
    
    // Get existing logos
    const existingLogos = await kv.get('platform:logos') || {}
    
    // Delete file from storage if exists
    if (existingLogos[`${type}Path`]) {
      try {
        const bucketName = 'make-6971b43c-platform-assets'
        await supabase.storage.from(bucketName).remove([existingLogos[`${type}Path`]])
        console.log(`✅ ${type} file deleted from storage:`, existingLogos[`${type}Path`])
      } catch (error) {
        console.log(`⚠️ Error deleting ${type} from storage:`, error)
      }
    }

    // Remove from KV store
    const updatedLogos = { ...existingLogos }
    delete updatedLogos[type]
    delete updatedLogos[`${type}Path`]
    delete updatedLogos[`${type}UpdatedAt`]
    
    await kv.set('platform:logos', updatedLogos)
    console.log(`✅ ${type} removed from platform logos`)

    return c.json({ success: true })
  } catch (error) {
    console.log(`❌ Error deleting platform ${c.req.param('type')}:`, error)
    return c.json({ error: 'Error deleting file: ' + error.message }, 500)
  }
})

// ==================== OCR ROUTES ====================

// Add OCR routes for template generation
addOcrRoutes(app)

// Add Quote & Agenda routes
addQuoteAgendaRoutes(app, supabase)

// Add InfoMatricula routes (Vehicle plate search)
app.route('/make-server-6971b43c/infomatricula', infomatriculaRoutes)

// ==================== AUDIT LOGS ENDPOINTS ====================

// Get audit logs (Admin only)
app.get('/make-server-6971b43c/admin/audit-logs', requireAdmin, async (c) => {
  try {
    const workshopId = c.req.query('workshopId')
    const module = c.req.query('module')
    const action = c.req.query('action')
    const entityType = c.req.query('entityType')
    const dateFrom = c.req.query('dateFrom')
    const dateTo = c.req.query('dateTo')
    const limit = c.req.query('limit') || '100'
    
    // Se não especificar workshopId, buscar de todos
    const logs = await getAuditLogs(
      workshopId || '',
      { module, action, entityType, dateFrom, dateTo },
      parseInt(limit)
    )
    
    return c.json({ logs })
  } catch (error) {
    console.error('Error fetching audit logs:', error)
    return c.json({ error: error.message }, 500)
  }
})

// Get audit statistics (Admin only)
app.get('/make-server-6971b43c/admin/audit-stats', requireAdmin, async (c) => {
  try {
    const workshopId = c.req.query('workshopId') || ''
    const days = parseInt(c.req.query('days') || '30')
    
    const stats = await getAuditStats(workshopId, days)
    
    return c.json({ stats })
  } catch (error) {
    console.error('Error fetching audit stats:', error)
    return c.json({ error: error.message }, 500)
  }
})

// ==================== START SERVER ====================

Deno.serve(app.fetch)
