import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.75.1'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Create Supabase admin client with service role key
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    )

    // Get the authorization header
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      console.error('No authorization header')
      return new Response(
        JSON.stringify({ error: 'No autorizado' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Verify the user is authenticated
    const token = authHeader.replace('Bearer ', '')
    const { data: { user }, error: userError } = await supabaseAdmin.auth.getUser(token)
    
    if (userError || !user) {
      console.error('User verification failed:', userError)
      return new Response(
        JSON.stringify({ error: 'No autorizado' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    console.log('User authenticated:', user.id)

    // Check if user has HRBP role
    const { data: roleData, error: roleError } = await supabaseAdmin
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .eq('role', 'hrbp')
      .maybeSingle()

    if (roleError || !roleData) {
      console.error('User does not have HRBP role:', roleError)
      return new Response(
        JSON.stringify({ error: 'No tienes permiso para realizar esta acción' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    console.log('User has HRBP role, proceeding to revoke sessions')

    // Get all users
    const { data: { users }, error: listError } = await supabaseAdmin.auth.admin.listUsers()
    
    if (listError) {
      console.error('Error listing users:', listError)
      return new Response(
        JSON.stringify({ error: 'Error al obtener usuarios' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    console.log(`Found ${users?.length || 0} users`)

    // Sign out all users by invalidating their sessions
    let revokedCount = 0
    let errors = []

    for (const targetUser of users || []) {
      try {
        const { error: signOutError } = await supabaseAdmin.auth.admin.signOut(targetUser.id)
        if (signOutError) {
          console.error(`Error signing out user ${targetUser.id}:`, signOutError)
          errors.push({ userId: targetUser.id, error: signOutError.message })
        } else {
          revokedCount++
          console.log(`Successfully signed out user ${targetUser.id}`)
        }
      } catch (err) {
        console.error(`Exception signing out user ${targetUser.id}:`, err)
        const errorMessage = err instanceof Error ? err.message : 'Unknown error'
        errors.push({ userId: targetUser.id, error: errorMessage })
      }
    }

    console.log(`Revoked ${revokedCount} sessions, ${errors.length} errors`)

    return new Response(
      JSON.stringify({ 
        success: true,
        message: `Sesiones revocadas exitosamente`,
        revokedCount,
        totalUsers: users?.length || 0,
        errors: errors.length > 0 ? errors : undefined
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )

  } catch (error) {
    console.error('Unexpected error:', error)
    const errorMessage = error instanceof Error ? error.message : 'Error interno del servidor'
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
