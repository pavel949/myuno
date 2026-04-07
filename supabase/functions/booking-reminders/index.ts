import { createClient } from '../_shared/supabase.ts'
import { requireInternalSecret } from '../_shared/internal-secret.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': 'https://myuno.app',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-internal-secret',
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    // Internal/cron guard: require X-Internal-Secret header
    const guardResponse = requireInternalSecret(req, corsHeaders);
    if (guardResponse) return guardResponse;
    
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    console.log('Starting booking reminders check...')

    const now = new Date()
    const oneHourLater = new Date(now.getTime() + 60 * 60 * 1000)
    const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000)
    
    // Get all bookings scheduled in the next 24 hours
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
        JSON.stringify({ message: 'No upcoming bookings found', processed: 0, sent: 0 }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    let notificationsSent = 0

    for (const booking of upcomingBookings) {
      const scheduledDate = new Date(booking.scheduled_at)
      const timeUntilBooking = scheduledDate.getTime() - now.getTime()
      const hoursUntil = timeUntilBooking / (60 * 60 * 1000)
      
      // Determine reminder type: 1-hour or 24-hour
      let reminderType: '1hour' | '24hour' | null = null
      if (hoursUntil <= 1) {
        reminderType = '1hour'
      } else if (hoursUntil <= 24) {
        reminderType = '24hour'
      }
      
      if (!reminderType) continue

      // Check if user wants booking reminders
      const { data: preferences } = await supabase
        .from('notification_preferences')
        .select('booking_reminders')
        .eq('user_id', booking.user_id)
        .single()

      if (preferences && preferences.booking_reminders === false) {
        console.log(`User ${booking.user_id} has disabled booking reminders`)
        continue
      }

      // Check if we already sent this type of reminder for this booking
      const { data: existingNotification } = await supabase
        .from('notifications')
        .select('id')
        .eq('user_id', booking.user_id)
        .eq('type', `booking_reminder_${reminderType}`)
        .like('body', `%${booking.id}%`)
        .single()

      if (existingNotification) {
        console.log(`${reminderType} reminder already sent for booking ${booking.id}`)
        continue
      }

      // Format the scheduled time (reuse scheduledDate from above)
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

      // Create notification with appropriate urgency
      const isUrgent = reminderType === '1hour'
      const title = isUrgent 
        ? `⏰ Скоро: ${typeLabel}` 
        : `Напоминание: ${typeLabel}`
      const timeInfo = isUrgent 
        ? `через 1 час (${timeStr})` 
        : `${dateStr} в ${timeStr}`

      // Create notification
      const { error: notifError } = await supabase
        .from('notifications')
        .insert({
          user_id: booking.user_id,
          title: title,
          body: `Ваше бронирование запланировано ${timeInfo}. ID: ${booking.id}`,
          type: `booking_reminder_${reminderType}`,
          data: {
            booking_id: booking.id,
            scheduled_at: booking.scheduled_at,
            booking_type: booking.booking_type,
            amount: booking.total_amount,
            currency: booking.currency,
            reminder_type: reminderType
          }
        })

      if (notifError) {
        console.error(`Error creating ${reminderType} notification for booking ${booking.id}:`, notifError)
      } else {
        notificationsSent++
        console.log(`${reminderType} reminder sent for booking ${booking.id}`)
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
