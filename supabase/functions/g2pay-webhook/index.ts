import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Create Supabase client with service role key for admin access
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Get webhook payload
    const payload = await req.json()
    console.log('G2Pay webhook received:', payload)

    const {
      transactionStatus,
      transactionId,
      clientUniqueId, // This will be our order ID
      totalAmount,
      currency,
      userTokenId, // User ID
    } = payload

    // Verify required fields
    if (!clientUniqueId || !transactionStatus) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields' }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      )
    }

    // Update order based on transaction status
    if (transactionStatus === 'APPROVED') {
      // Update order to paid
      const { error: orderError } = await supabaseClient
        .from('orders')
        .update({
          status: 'paid',
          paid_at: new Date().toISOString(),
          stripe_payment_intent_id: transactionId,
        })
        .eq('id', clientUniqueId)

      if (orderError) {
        console.error('Error updating order:', orderError)
        throw orderError
      }

      // Get order items to allocate tickets
      const { data: orderItems, error: itemsError } = await supabaseClient
        .from('order_items')
        .select('*, orders!inner(user_id)')
        .eq('order_id', clientUniqueId)

      if (itemsError) throw itemsError

      // Process each item
      for (const item of orderItems || []) {
        const userId = item.orders.user_id

        // Update competition tickets_sold count
        const { data: competition } = await supabaseClient
          .from('competitions')
          .select('tickets_sold')
          .eq('id', item.competition_id)
          .single()

        if (competition) {
          await supabaseClient
            .from('competitions')
            .update({
              tickets_sold: (competition.tickets_sold || 0) + item.ticket_count,
            })
            .eq('id', item.competition_id)
        }

        // Create ticket allocations
        const ticketAllocations = Array.from({ length: item.ticket_count }, (_, i) => ({
          competition_id: item.competition_id,
          order_id: clientUniqueId,
          sold_to_user_id: userId,
          ticket_number: `${Date.now()}-${i + 1}`,
          is_sold: true,
          sold_at: new Date().toISOString(),
        }))

        await supabaseClient.from('ticket_allocations').insert(ticketAllocations)
      }

      console.log(`Order ${clientUniqueId} marked as paid and tickets allocated`)
    } else if (transactionStatus === 'DECLINED' || transactionStatus === 'ERROR') {
      // Update order to failed
      await supabaseClient
        .from('orders')
        .update({
          status: 'failed',
        })
        .eq('id', clientUniqueId)

      console.log(`Order ${clientUniqueId} marked as failed`)
    }

    return new Response(
      JSON.stringify({ success: true }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    )
  } catch (error) {
    console.error('Error processing webhook:', error)
    return new Response(
      JSON.stringify({
        error: error.message || 'Failed to process webhook',
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    )
  }
})
