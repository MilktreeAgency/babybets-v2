import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform',
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {

    // Verify JWT token
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized - Missing token' }),
        {
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      )
    }

    // Verify JWT using anon client
    const supabaseAuth = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: authHeader },
        },
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      }
    )

    const { data: { user }, error: authError } = await supabaseAuth.auth.getUser()

    if (authError || !user) {
      console.error('JWT verification failed:', authError?.message)
      return new Response(
        JSON.stringify({ error: 'Unauthorized - Invalid token' }),
        {
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      )
    }


    // Get request body
    const { orderId } = await req.json()
    if (!orderId) {
      throw new Error('Order ID is required')
    }


    // Create service role client for all operations (bypasses RLS)
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      }
    )

    // Get order details (includes user_id)
    const { data: order, error: orderError } = await supabaseAdmin
      .from('orders')
      .select('id, user_id, status')
      .eq('id', orderId)
      .single()

    if (orderError || !order) {
      console.error('Order not found:', orderError)
      throw new Error('Order not found')
    }


    // Security check: Ensure authenticated user owns this order
    if (order.user_id !== user.id) {
      console.error(`User ${user.id} attempted to complete order ${orderId} owned by ${order.user_id}`)
      return new Response(
        JSON.stringify({ error: 'Unauthorized - Order does not belong to user' }),
        {
          status: 403,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      )
    }

    // Check if already completed
    if (order.status === 'paid') {
      return new Response(
        JSON.stringify({ success: true, message: 'Order already completed' }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      )
    }

    if (order.status !== 'pending') {
      throw new Error(`Cannot complete order with status: ${order.status}`)
    }

    // Update order to paid
    const { error: updateError } = await supabaseAdmin
      .from('orders')
      .update({
        status: 'paid',
        paid_at: new Date().toISOString(),
      })
      .eq('id', orderId)

    if (updateError) {
      console.error('Error updating order:', {
        error: updateError,
        message: updateError.message,
        details: updateError.details,
        hint: updateError.hint,
        code: updateError.code,
      })
      throw new Error(`Failed to update order status: ${updateError.message || JSON.stringify(updateError)}`)
    }


    // Get order items to allocate tickets
    const { data: orderItems, error: itemsError } = await supabaseAdmin
      .from('order_items')
      .select('*')
      .eq('order_id', orderId)

    if (itemsError) {
      console.error('Error fetching order items:', itemsError)
      throw new Error('Failed to fetch order items')
    }


    // Process each item - claim tickets from pre-generated pool
    for (const item of orderItems || []) {
      const ticketCount = item.ticket_count


      // Get competition details
      const { data: competition, error: compError } = await supabaseAdmin
        .from('competitions')
        .select('id, title, ticket_pool_locked, tickets_sold, max_tickets')
        .eq('id', item.competition_id)
        .single()

      if (compError || !competition) {
        console.error('Error fetching competition:', compError)
        throw new Error('Failed to fetch competition')
      }

      // Check if ticket pool is locked (required for claiming)


      if (!competition.ticket_pool_locked) {
        throw new Error(`Ticket pool not generated for competition: ${competition.title}`)
      }

      // Atomically claim tickets using database function with row-level locking
      // This prevents race conditions where two orders try to claim the same tickets

      const { data: claimedTickets, error: claimError } = await supabaseAdmin.rpc(
        'claim_tickets_atomic',
        {
          p_competition_id: item.competition_id,
          p_user_id: order.user_id,
          p_order_id: orderId,
          p_ticket_count: ticketCount,
        }
      )

      if (claimError) {
        console.error('Error claiming tickets atomically:', {
          error: claimError,
          message: claimError.message,
          details: claimError.details,
          hint: claimError.hint,
          code: claimError.code,
          competitionId: item.competition_id,
          requestedTickets: ticketCount,
        })
        throw new Error(`Failed to claim tickets: ${claimError.message || JSON.stringify(claimError)}`)
      }

      // Verify we claimed the correct number of tickets
      if (!claimedTickets || claimedTickets.length !== ticketCount) {
        throw new Error(
          `Failed to claim all requested tickets. Expected: ${ticketCount}, Got: ${claimedTickets?.length || 0}`
        )
      }


      // Update competition tickets_sold count
      const { error: updateCompError } = await supabaseAdmin
        .from('competitions')
        .update({
          tickets_sold: (competition.tickets_sold || 0) + ticketCount,
        })
        .eq('id', item.competition_id)

      if (updateCompError) {
        console.error('Error updating competition:', updateCompError)
        throw new Error('Failed to update competition tickets')
      }

    }

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Order completed and tickets allocated',
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    )
  } catch (error) {
    console.error('Error completing order:', error)
    return new Response(
      JSON.stringify({
        error: error.message || 'Failed to complete order',
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    )
  }
})
