import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    console.log('Starting booking reminders check...')

    // Get bookings scheduled in the next 24 hours that haven't been reminded
    const now = new Date()
    const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000)
    
    const { data: upcomingBookings, error: bookingsError } = await supabase
      .from('bookings')
      .select('id, user_id, scheduled_at, notes, total_amount, currency, booking_type')
      .gte('scheduled_at', now.toISOString())
      .lte('scheduled_at', tomorrow.toISOString())
      .in('status', ['confirmed', 'submitted'])
    
    if (bookingsError) {
      console.error('Error fetching bookings:', bookingsError)
      throw bookingsError
    }

    console.log(`Found ${upcomingBookings?.length || 0} upcoming bookings`)

    if (!upcomingBookings || upcomingBookings.length === 0) {
      return new Response(
        JSON.stringify({ message: 'No upcoming bookings found', processed: 0 }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    let notificationsSent = 0

    for (const booking of upcomingBookings) {
      // Check if user wants booking reminders
      const { data: preferences } = await supabase
        .from('notification_preferences')
        .select('booking_reminders')
        .eq('user_id', booking.user_id)
        .single()

      // Skip if user disabled booking reminders
      if (preferences && preferences.booking_reminders === false) {
        console.log(`User ${booking.user_id} has disabled booking reminders`)
        continue
      }

      // Check if we already sent a reminder for this booking
      const { data: existingNotification } = await supabase
        .from('notifications')
        .select('id')
        .eq('user_id', booking.user_id)
        .eq('type', 'booking_reminder')
        .like('body', `%${booking.id}%`)
        .single()

      if (existingNotification) {
        console.log(`Reminder already sent for booking ${booking.id}`)
        continue
      }

      // Format the scheduled time
      const scheduledDate = new Date(booking.scheduled_at)
      const timeStr = scheduledDate.toLocaleTimeString('ru-RU', { 
        hour: '2-digit', 
        minute: '2-digit' 
      })
      const dateStr = scheduledDate.toLocaleDateString('ru-RU', {
        day: 'numeric',
        month: 'long'
      })

      // Get booking type label
      const typeLabels: Record<string, string> = {
        service: 'Услуга',
        product: 'Заказ',
        property: 'Недвижимость',
        event: 'Мероприятие',
        transport: 'Транспорт',
        food: 'Еда'
      }
      const typeLabel = typeLabels[booking.booking_type] || 'Бронирование'

      // Create notification
      const { error: notifError } = await supabase
        .from('notifications')
        .insert({
          user_id: booking.user_id,
          title: `Напоминание: ${typeLabel}`,
          body: `Ваше бронирование запланировано на ${dateStr} в ${timeStr}. ID: ${booking.id}`,
          type: 'booking_reminder',
          data: {
            booking_id: booking.id,
            scheduled_at: booking.scheduled_at,
            booking_type: booking.booking_type,
            amount: booking.total_amount,
            currency: booking.currency
          }
        })

      if (notifError) {
        console.error(`Error creating notification for booking ${booking.id}:`, notifError)
      } else {
        notificationsSent++
        console.log(`Reminder sent for booking ${booking.id}`)
      }
    }

    console.log(`Booking reminders completed. Sent ${notificationsSent} notifications`)

    return new Response(
      JSON.stringify({ 
        message: 'Booking reminders processed', 
        processed: upcomingBookings.length,
        sent: notificationsSent 
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    console.error('Error in booking-reminders function:', error)
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
