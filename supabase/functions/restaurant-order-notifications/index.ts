import { createClient } from '../_shared/supabase.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': 'https://myuno.app',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface OrderStatusPayload {
  booking_id: string;
  new_status: 'confirmed' | 'preparing' | 'on_the_way' | 'delivered' | 'cancelled';
  estimated_time?: number; // in minutes
}

const statusMessages: Record<string, { en: string; ru: string; emoji: string }> = {
  confirmed: {
    en: 'Your order has been confirmed!',
    ru: 'Ваш заказ подтверждён!',
    emoji: '✅'
  },
  preparing: {
    en: 'Your order is being prepared',
    ru: 'Ваш заказ готовится',
    emoji: '👨‍🍳'
  },
  on_the_way: {
    en: 'Your order is on the way!',
    ru: 'Ваш заказ в пути!',
    emoji: '🚗'
  },
  delivered: {
    en: 'Your order has been delivered',
    ru: 'Ваш заказ доставлен',
    emoji: '🎉'
  },
  cancelled: {
    en: 'Your order has been cancelled',
    ru: 'Ваш заказ отменён',
    emoji: '❌'
  }
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    const { booking_id, new_status, estimated_time }: OrderStatusPayload = await req.json()

    if (!booking_id || !new_status) {
      throw new Error('Missing required fields: booking_id and new_status')
    }

    console.log(`Processing order status update: ${booking_id} -> ${new_status}`)

    // Get booking details
    const { data: booking, error: bookingError } = await supabase
      .from('bookings')
      .select('id, user_id, booking_type, notes, total_amount, currency')
      .eq('id', booking_id)
      .single()

    if (bookingError || !booking) {
      throw new Error(`Booking not found: ${booking_id}`)
    }

    // Check if user wants status updates
    const { data: preferences } = await supabase
      .from('notification_preferences')
      .select('status_updates')
      .eq('user_id', booking.user_id)
      .single()

    if (preferences && preferences.status_updates === false) {
      console.log(`User ${booking.user_id} has disabled status updates`)
      return new Response(
        JSON.stringify({ message: 'User has disabled status updates', sent: false }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Update booking status
    const { error: updateError } = await supabase
      .from('bookings')
      .update({ status: new_status === 'on_the_way' ? 'confirmed' : new_status })
      .eq('id', booking_id)

    if (updateError) {
      console.error('Error updating booking status:', updateError)
    }

    // Add to status history
    await supabase
      .from('booking_status_history')
      .insert({
        booking_id,
        to_status: new_status === 'on_the_way' ? 'confirmed' : new_status,
        notes: new_status === 'on_the_way' ? 'Order is on the way' : undefined
      })

    // Get status message
    const statusMsg = statusMessages[new_status]
    if (!statusMsg) {
      throw new Error(`Unknown status: ${new_status}`)
    }

    // Build notification body
    let bodyRu = statusMsg.ru
    let bodyEn = statusMsg.en

    if (estimated_time && (new_status === 'preparing' || new_status === 'on_the_way')) {
      bodyRu += `. Примерное время: ${estimated_time} мин.`
      bodyEn += `. Estimated time: ${estimated_time} min.`
    }

    // Create notification
    const { error: notifError } = await supabase
      .from('notifications')
      .insert({
        user_id: booking.user_id,
        title: `${statusMsg.emoji} ${statusMsg.ru}`,
        body: bodyRu,
        type: 'order_status',
        data: {
          booking_id,
          status: new_status,
          estimated_time,
          booking_type: booking.booking_type
        }
      })

    if (notifError) {
      console.error('Error creating notification:', notifError)
      throw notifError
    }

    console.log(`Notification sent for booking ${booking_id}`)

    return new Response(
      JSON.stringify({ 
        message: 'Order status notification sent',
        booking_id,
        status: new_status,
        sent: true
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    console.error('Error in restaurant-order-notifications:', error)
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
