export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      booking_addresses: {
        Row: {
          address: string
          address_type: string
          booking_id: string
          created_at: string
          id: string
          lat: number | null
          lng: number | null
          notes: string | null
        }
        Insert: {
          address: string
          address_type: string
          booking_id: string
          created_at?: string
          id?: string
          lat?: number | null
          lng?: number | null
          notes?: string | null
        }
        Update: {
          address?: string
          address_type?: string
          booking_id?: string
          created_at?: string
          id?: string
          lat?: number | null
          lng?: number | null
          notes?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "booking_addresses_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
        ]
      }
      booking_items: {
        Row: {
          booking_id: string
          created_at: string
          id: string
          item_id: string | null
          item_name: string | null
          item_type: string
          quantity: number | null
          subtotal: number | null
          unit_price: number | null
        }
        Insert: {
          booking_id: string
          created_at?: string
          id?: string
          item_id?: string | null
          item_name?: string | null
          item_type: string
          quantity?: number | null
          subtotal?: number | null
          unit_price?: number | null
        }
        Update: {
          booking_id?: string
          created_at?: string
          id?: string
          item_id?: string | null
          item_name?: string | null
          item_type?: string
          quantity?: number | null
          subtotal?: number | null
          unit_price?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "booking_items_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
        ]
      }
      booking_messages: {
        Row: {
          booking_id: string
          created_at: string
          id: string
          is_read: boolean | null
          message: string
          sender_id: string | null
        }
        Insert: {
          booking_id: string
          created_at?: string
          id?: string
          is_read?: boolean | null
          message: string
          sender_id?: string | null
        }
        Update: {
          booking_id?: string
          created_at?: string
          id?: string
          is_read?: boolean | null
          message?: string
          sender_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "booking_messages_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
        ]
      }
      booking_participants: {
        Row: {
          booking_id: string
          created_at: string
          email: string | null
          id: string
          is_primary: boolean | null
          name: string
          phone: string | null
        }
        Insert: {
          booking_id: string
          created_at?: string
          email?: string | null
          id?: string
          is_primary?: boolean | null
          name: string
          phone?: string | null
        }
        Update: {
          booking_id?: string
          created_at?: string
          email?: string | null
          id?: string
          is_primary?: boolean | null
          name?: string
          phone?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "booking_participants_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
        ]
      }
      booking_payments: {
        Row: {
          amount: number
          booking_id: string
          created_at: string
          currency: string | null
          id: string
          paid_at: string | null
          payment_method: string | null
          status: Database["public"]["Enums"]["payment_status"]
        }
        Insert: {
          amount: number
          booking_id: string
          created_at?: string
          currency?: string | null
          id?: string
          paid_at?: string | null
          payment_method?: string | null
          status?: Database["public"]["Enums"]["payment_status"]
        }
        Update: {
          amount?: number
          booking_id?: string
          created_at?: string
          currency?: string | null
          id?: string
          paid_at?: string | null
          payment_method?: string | null
          status?: Database["public"]["Enums"]["payment_status"]
        }
        Relationships: [
          {
            foreignKeyName: "booking_payments_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
        ]
      }
      booking_status_history: {
        Row: {
          booking_id: string
          changed_by: string | null
          created_at: string
          from_status: Database["public"]["Enums"]["booking_status"] | null
          id: string
          notes: string | null
          to_status: Database["public"]["Enums"]["booking_status"]
        }
        Insert: {
          booking_id: string
          changed_by?: string | null
          created_at?: string
          from_status?: Database["public"]["Enums"]["booking_status"] | null
          id?: string
          notes?: string | null
          to_status: Database["public"]["Enums"]["booking_status"]
        }
        Update: {
          booking_id?: string
          changed_by?: string | null
          created_at?: string
          from_status?: Database["public"]["Enums"]["booking_status"] | null
          id?: string
          notes?: string | null
          to_status?: Database["public"]["Enums"]["booking_status"]
        }
        Relationships: [
          {
            foreignKeyName: "booking_status_history_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
        ]
      }
      bookings: {
        Row: {
          booking_type: Database["public"]["Enums"]["booking_type"]
          created_at: string
          currency: string | null
          id: string
          notes: string | null
          provider_id: string | null
          scheduled_at: string | null
          service_id: string | null
          status: Database["public"]["Enums"]["booking_status"]
          total_amount: number | null
          updated_at: string
          user_id: string
        }
        Insert: {
          booking_type?: Database["public"]["Enums"]["booking_type"]
          created_at?: string
          currency?: string | null
          id?: string
          notes?: string | null
          provider_id?: string | null
          scheduled_at?: string | null
          service_id?: string | null
          status?: Database["public"]["Enums"]["booking_status"]
          total_amount?: number | null
          updated_at?: string
          user_id: string
        }
        Update: {
          booking_type?: Database["public"]["Enums"]["booking_type"]
          created_at?: string
          currency?: string | null
          id?: string
          notes?: string | null
          provider_id?: string | null
          scheduled_at?: string | null
          service_id?: string | null
          status?: Database["public"]["Enums"]["booking_status"]
          total_amount?: number | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "bookings_provider_id_fkey"
            columns: ["provider_id"]
            isOneToOne: false
            referencedRelation: "providers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bookings_service_id_fkey"
            columns: ["service_id"]
            isOneToOne: false
            referencedRelation: "services"
            referencedColumns: ["id"]
          },
        ]
      }
      bouquets: {
        Row: {
          category: string | null
          colors: string[] | null
          created_at: string
          currency: string | null
          description_en: string | null
          description_ru: string | null
          flowers: string[] | null
          id: string
          image: string | null
          images: string[] | null
          is_active: boolean | null
          is_popular: boolean | null
          name_en: string
          name_ru: string
          price: number
          shop_id: string
          size: string | null
          stock_quantity: number | null
        }
        Insert: {
          category?: string | null
          colors?: string[] | null
          created_at?: string
          currency?: string | null
          description_en?: string | null
          description_ru?: string | null
          flowers?: string[] | null
          id?: string
          image?: string | null
          images?: string[] | null
          is_active?: boolean | null
          is_popular?: boolean | null
          name_en: string
          name_ru: string
          price: number
          shop_id: string
          size?: string | null
          stock_quantity?: number | null
        }
        Update: {
          category?: string | null
          colors?: string[] | null
          created_at?: string
          currency?: string | null
          description_en?: string | null
          description_ru?: string | null
          flowers?: string[] | null
          id?: string
          image?: string | null
          images?: string[] | null
          is_active?: boolean | null
          is_popular?: boolean | null
          name_en?: string
          name_ru?: string
          price?: number
          shop_id?: string
          size?: string | null
          stock_quantity?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "bouquets_shop_id_fkey"
            columns: ["shop_id"]
            isOneToOne: false
            referencedRelation: "flower_shops"
            referencedColumns: ["id"]
          },
        ]
      }
      cart_items: {
        Row: {
          created_at: string
          currency: string
          id: string
          image: string | null
          item_id: string
          item_type: string
          name: string
          name_ru: string | null
          options: Json | null
          price: number
          provider_id: string | null
          provider_name: string | null
          provider_name_ru: string | null
          quantity: number
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          currency?: string
          id?: string
          image?: string | null
          item_id: string
          item_type: string
          name: string
          name_ru?: string | null
          options?: Json | null
          price: number
          provider_id?: string | null
          provider_name?: string | null
          provider_name_ru?: string | null
          quantity?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          currency?: string
          id?: string
          image?: string | null
          item_id?: string
          item_type?: string
          name?: string
          name_ru?: string | null
          options?: Json | null
          price?: number
          provider_id?: string | null
          provider_name?: string | null
          provider_name_ru?: string | null
          quantity?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      cashback_settings: {
        Row: {
          category: string
          created_at: string
          id: string
          is_active: boolean
          max_cashback_amount: number | null
          min_order_amount: number | null
          percentage: number
          updated_at: string
        }
        Insert: {
          category?: string
          created_at?: string
          id?: string
          is_active?: boolean
          max_cashback_amount?: number | null
          min_order_amount?: number | null
          percentage?: number
          updated_at?: string
        }
        Update: {
          category?: string
          created_at?: string
          id?: string
          is_active?: boolean
          max_cashback_amount?: number | null
          min_order_amount?: number | null
          percentage?: number
          updated_at?: string
        }
        Relationships: []
      }
      categories: {
        Row: {
          color: string | null
          created_at: string
          group_id: string | null
          icon: string | null
          id: string
          is_active: boolean | null
          is_hot: boolean | null
          is_new: boolean | null
          mini_app_type: string | null
          name_en: string
          name_ru: string
          parent_id: string | null
          slug: string
          sort_order: number | null
        }
        Insert: {
          color?: string | null
          created_at?: string
          group_id?: string | null
          icon?: string | null
          id?: string
          is_active?: boolean | null
          is_hot?: boolean | null
          is_new?: boolean | null
          mini_app_type?: string | null
          name_en: string
          name_ru: string
          parent_id?: string | null
          slug: string
          sort_order?: number | null
        }
        Update: {
          color?: string | null
          created_at?: string
          group_id?: string | null
          icon?: string | null
          id?: string
          is_active?: boolean | null
          is_hot?: boolean | null
          is_new?: boolean | null
          mini_app_type?: string | null
          name_en?: string
          name_ru?: string
          parent_id?: string | null
          slug?: string
          sort_order?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "categories_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "category_groups"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "categories_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
        ]
      }
      category_groups: {
        Row: {
          created_at: string
          icon: string | null
          id: string
          is_active: boolean | null
          name_en: string
          name_ru: string
          slug: string
          sort_order: number | null
        }
        Insert: {
          created_at?: string
          icon?: string | null
          id?: string
          is_active?: boolean | null
          name_en: string
          name_ru: string
          slug: string
          sort_order?: number | null
        }
        Update: {
          created_at?: string
          icon?: string | null
          id?: string
          is_active?: boolean | null
          name_en?: string
          name_ru?: string
          slug?: string
          sort_order?: number | null
        }
        Relationships: []
      }
      currencies: {
        Row: {
          code: string
          is_active: boolean | null
          name: string
          symbol: string
        }
        Insert: {
          code: string
          is_active?: boolean | null
          name: string
          symbol: string
        }
        Update: {
          code?: string
          is_active?: boolean | null
          name?: string
          symbol?: string
        }
        Relationships: []
      }
      event_bookings: {
        Row: {
          contact_email: string | null
          contact_name: string | null
          contact_phone: string | null
          created_at: string
          currency: string | null
          event_id: string
          id: string
          notes: string | null
          pickup_hotel: string | null
          pickup_room: string | null
          status: string | null
          tickets: number
          total_amount: number
          updated_at: string
          user_id: string
        }
        Insert: {
          contact_email?: string | null
          contact_name?: string | null
          contact_phone?: string | null
          created_at?: string
          currency?: string | null
          event_id: string
          id?: string
          notes?: string | null
          pickup_hotel?: string | null
          pickup_room?: string | null
          status?: string | null
          tickets?: number
          total_amount: number
          updated_at?: string
          user_id: string
        }
        Update: {
          contact_email?: string | null
          contact_name?: string | null
          contact_phone?: string | null
          created_at?: string
          currency?: string | null
          event_id?: string
          id?: string
          notes?: string | null
          pickup_hotel?: string | null
          pickup_room?: string | null
          status?: string | null
          tickets?: number
          total_amount?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "event_bookings_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
        ]
      }
      events: {
        Row: {
          address: string | null
          category: string
          cover_image: string | null
          created_at: string
          currency: string | null
          description_en: string | null
          description_ru: string | null
          duration_hours: number | null
          event_date: string | null
          event_time: string | null
          excludes: Json | null
          id: string
          images: string[] | null
          includes: Json | null
          is_active: boolean | null
          is_featured: boolean | null
          is_hot: boolean | null
          itinerary: Json | null
          lat: number | null
          lng: number | null
          location_name: string | null
          location_ru: string | null
          max_spots: number | null
          original_price: number | null
          price: number | null
          provider_id: string | null
          rating: number | null
          review_count: number | null
          spots_left: number | null
          title_en: string
          title_ru: string
          updated_at: string
        }
        Insert: {
          address?: string | null
          category?: string
          cover_image?: string | null
          created_at?: string
          currency?: string | null
          description_en?: string | null
          description_ru?: string | null
          duration_hours?: number | null
          event_date?: string | null
          event_time?: string | null
          excludes?: Json | null
          id?: string
          images?: string[] | null
          includes?: Json | null
          is_active?: boolean | null
          is_featured?: boolean | null
          is_hot?: boolean | null
          itinerary?: Json | null
          lat?: number | null
          lng?: number | null
          location_name?: string | null
          location_ru?: string | null
          max_spots?: number | null
          original_price?: number | null
          price?: number | null
          provider_id?: string | null
          rating?: number | null
          review_count?: number | null
          spots_left?: number | null
          title_en: string
          title_ru: string
          updated_at?: string
        }
        Update: {
          address?: string | null
          category?: string
          cover_image?: string | null
          created_at?: string
          currency?: string | null
          description_en?: string | null
          description_ru?: string | null
          duration_hours?: number | null
          event_date?: string | null
          event_time?: string | null
          excludes?: Json | null
          id?: string
          images?: string[] | null
          includes?: Json | null
          is_active?: boolean | null
          is_featured?: boolean | null
          is_hot?: boolean | null
          itinerary?: Json | null
          lat?: number | null
          lng?: number | null
          location_name?: string | null
          location_ru?: string | null
          max_spots?: number | null
          original_price?: number | null
          price?: number | null
          provider_id?: string | null
          rating?: number | null
          review_count?: number | null
          spots_left?: number | null
          title_en?: string
          title_ru?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "events_provider_id_fkey"
            columns: ["provider_id"]
            isOneToOne: false
            referencedRelation: "providers"
            referencedColumns: ["id"]
          },
        ]
      }
      favorites: {
        Row: {
          created_at: string
          id: string
          item_data: Json | null
          item_id: string
          item_type: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          item_data?: Json | null
          item_id: string
          item_type: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          item_data?: Json | null
          item_id?: string
          item_type?: string
          user_id?: string
        }
        Relationships: []
      }
      flower_shops: {
        Row: {
          address: string | null
          approval_status: string | null
          cover_image: string | null
          created_at: string
          delivery_available: boolean | null
          delivery_fee: number | null
          description_en: string | null
          description_ru: string | null
          email: string | null
          id: string
          images: string[] | null
          is_active: boolean | null
          is_featured: boolean | null
          is_verified: boolean | null
          lat: number | null
          lng: number | null
          min_order_amount: number | null
          name_en: string
          name_ru: string
          phone: string | null
          provider_id: string | null
          rating: number | null
          review_count: number | null
          updated_at: string
          working_hours: Json | null
        }
        Insert: {
          address?: string | null
          approval_status?: string | null
          cover_image?: string | null
          created_at?: string
          delivery_available?: boolean | null
          delivery_fee?: number | null
          description_en?: string | null
          description_ru?: string | null
          email?: string | null
          id?: string
          images?: string[] | null
          is_active?: boolean | null
          is_featured?: boolean | null
          is_verified?: boolean | null
          lat?: number | null
          lng?: number | null
          min_order_amount?: number | null
          name_en: string
          name_ru: string
          phone?: string | null
          provider_id?: string | null
          rating?: number | null
          review_count?: number | null
          updated_at?: string
          working_hours?: Json | null
        }
        Update: {
          address?: string | null
          approval_status?: string | null
          cover_image?: string | null
          created_at?: string
          delivery_available?: boolean | null
          delivery_fee?: number | null
          description_en?: string | null
          description_ru?: string | null
          email?: string | null
          id?: string
          images?: string[] | null
          is_active?: boolean | null
          is_featured?: boolean | null
          is_verified?: boolean | null
          lat?: number | null
          lng?: number | null
          min_order_amount?: number | null
          name_en?: string
          name_ru?: string
          phone?: string | null
          provider_id?: string | null
          rating?: number | null
          review_count?: number | null
          updated_at?: string
          working_hours?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "flower_shops_provider_id_fkey"
            columns: ["provider_id"]
            isOneToOne: false
            referencedRelation: "providers"
            referencedColumns: ["id"]
          },
        ]
      }
      locations: {
        Row: {
          address: string | null
          city: string | null
          country: string | null
          created_at: string
          district: string | null
          id: string
          lat: number | null
          lng: number | null
          name_en: string | null
          name_ru: string | null
        }
        Insert: {
          address?: string | null
          city?: string | null
          country?: string | null
          created_at?: string
          district?: string | null
          id?: string
          lat?: number | null
          lng?: number | null
          name_en?: string | null
          name_ru?: string | null
        }
        Update: {
          address?: string | null
          city?: string | null
          country?: string | null
          created_at?: string
          district?: string | null
          id?: string
          lat?: number | null
          lng?: number | null
          name_en?: string | null
          name_ru?: string | null
        }
        Relationships: []
      }
      notification_preferences: {
        Row: {
          booking_reminders: boolean
          created_at: string
          id: string
          promotions: boolean
          status_updates: boolean
          updated_at: string
          user_id: string
        }
        Insert: {
          booking_reminders?: boolean
          created_at?: string
          id?: string
          promotions?: boolean
          status_updates?: boolean
          updated_at?: string
          user_id: string
        }
        Update: {
          booking_reminders?: boolean
          created_at?: string
          id?: string
          promotions?: boolean
          status_updates?: boolean
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      notifications: {
        Row: {
          body: string
          created_at: string
          data: Json | null
          id: string
          is_read: boolean
          title: string
          type: string
          user_id: string
        }
        Insert: {
          body: string
          created_at?: string
          data?: Json | null
          id?: string
          is_read?: boolean
          title: string
          type?: string
          user_id: string
        }
        Update: {
          body?: string
          created_at?: string
          data?: Json | null
          id?: string
          is_read?: boolean
          title?: string
          type?: string
          user_id?: string
        }
        Relationships: []
      }
      owner_properties: {
        Row: {
          address: string
          area_sqm: number | null
          bathrooms: number | null
          bedrooms: number | null
          cover_image: string | null
          created_at: string
          description: string | null
          description_ru: string | null
          district: string | null
          id: string
          images: string[] | null
          is_rented: boolean | null
          management_type: string | null
          notes: string | null
          owner_id: string
          property_type: string
          rental_platform: string | null
          status: string | null
          title: string
          title_ru: string | null
          updated_at: string
          verified_at: string | null
          verified_by: string | null
        }
        Insert: {
          address: string
          area_sqm?: number | null
          bathrooms?: number | null
          bedrooms?: number | null
          cover_image?: string | null
          created_at?: string
          description?: string | null
          description_ru?: string | null
          district?: string | null
          id?: string
          images?: string[] | null
          is_rented?: boolean | null
          management_type?: string | null
          notes?: string | null
          owner_id: string
          property_type?: string
          rental_platform?: string | null
          status?: string | null
          title: string
          title_ru?: string | null
          updated_at?: string
          verified_at?: string | null
          verified_by?: string | null
        }
        Update: {
          address?: string
          area_sqm?: number | null
          bathrooms?: number | null
          bedrooms?: number | null
          cover_image?: string | null
          created_at?: string
          description?: string | null
          description_ru?: string | null
          district?: string | null
          id?: string
          images?: string[] | null
          is_rented?: boolean | null
          management_type?: string | null
          notes?: string | null
          owner_id?: string
          property_type?: string
          rental_platform?: string | null
          status?: string | null
          title?: string
          title_ru?: string | null
          updated_at?: string
          verified_at?: string | null
          verified_by?: string | null
        }
        Relationships: []
      }
      partner_applications: {
        Row: {
          address: string | null
          business_category: string
          business_description: string | null
          business_name: string
          city: string | null
          contact_email: string
          contact_name: string
          contact_phone: string | null
          created_at: string
          documents: Json | null
          id: string
          license_number: string | null
          metadata: Json | null
          notes: string | null
          rejection_reason: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          status: string
          tax_id: string | null
          updated_at: string
          user_id: string | null
          website: string | null
        }
        Insert: {
          address?: string | null
          business_category: string
          business_description?: string | null
          business_name: string
          city?: string | null
          contact_email: string
          contact_name: string
          contact_phone?: string | null
          created_at?: string
          documents?: Json | null
          id?: string
          license_number?: string | null
          metadata?: Json | null
          notes?: string | null
          rejection_reason?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
          tax_id?: string | null
          updated_at?: string
          user_id?: string | null
          website?: string | null
        }
        Update: {
          address?: string | null
          business_category?: string
          business_description?: string | null
          business_name?: string
          city?: string | null
          contact_email?: string
          contact_name?: string
          contact_phone?: string | null
          created_at?: string
          documents?: Json | null
          id?: string
          license_number?: string | null
          metadata?: Json | null
          notes?: string | null
          rejection_reason?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
          tax_id?: string | null
          updated_at?: string
          user_id?: string | null
          website?: string | null
        }
        Relationships: []
      }
      pharmacies: {
        Row: {
          address: string | null
          cover_image: string | null
          created_at: string
          delivery_available: boolean | null
          delivery_fee: number | null
          delivery_radius_km: number | null
          description_en: string | null
          description_ru: string | null
          email: string | null
          has_pharmacist: boolean | null
          id: string
          images: string[] | null
          is_24h: boolean | null
          is_active: boolean | null
          is_verified: boolean | null
          lat: number | null
          license_number: string | null
          lng: number | null
          min_order_amount: number | null
          name_en: string
          name_ru: string
          phone: string | null
          provider_id: string | null
          rating: number | null
          review_count: number | null
          updated_at: string
          website: string | null
          working_hours: Json | null
        }
        Insert: {
          address?: string | null
          cover_image?: string | null
          created_at?: string
          delivery_available?: boolean | null
          delivery_fee?: number | null
          delivery_radius_km?: number | null
          description_en?: string | null
          description_ru?: string | null
          email?: string | null
          has_pharmacist?: boolean | null
          id?: string
          images?: string[] | null
          is_24h?: boolean | null
          is_active?: boolean | null
          is_verified?: boolean | null
          lat?: number | null
          license_number?: string | null
          lng?: number | null
          min_order_amount?: number | null
          name_en: string
          name_ru: string
          phone?: string | null
          provider_id?: string | null
          rating?: number | null
          review_count?: number | null
          updated_at?: string
          website?: string | null
          working_hours?: Json | null
        }
        Update: {
          address?: string | null
          cover_image?: string | null
          created_at?: string
          delivery_available?: boolean | null
          delivery_fee?: number | null
          delivery_radius_km?: number | null
          description_en?: string | null
          description_ru?: string | null
          email?: string | null
          has_pharmacist?: boolean | null
          id?: string
          images?: string[] | null
          is_24h?: boolean | null
          is_active?: boolean | null
          is_verified?: boolean | null
          lat?: number | null
          license_number?: string | null
          lng?: number | null
          min_order_amount?: number | null
          name_en?: string
          name_ru?: string
          phone?: string | null
          provider_id?: string | null
          rating?: number | null
          review_count?: number | null
          updated_at?: string
          website?: string | null
          working_hours?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "pharmacies_provider_id_fkey"
            columns: ["provider_id"]
            isOneToOne: false
            referencedRelation: "providers"
            referencedColumns: ["id"]
          },
        ]
      }
      pharmacy_orders: {
        Row: {
          contact_name: string | null
          contact_phone: string | null
          created_at: string
          currency: string | null
          delivery_address: string | null
          delivery_fee: number | null
          delivery_lat: number | null
          delivery_lng: number | null
          estimated_delivery: string | null
          id: string
          items: Json
          notes: string | null
          pharmacy_id: string
          prescription_images: string[] | null
          status: string | null
          subtotal: number
          total_amount: number
          updated_at: string
          user_id: string
        }
        Insert: {
          contact_name?: string | null
          contact_phone?: string | null
          created_at?: string
          currency?: string | null
          delivery_address?: string | null
          delivery_fee?: number | null
          delivery_lat?: number | null
          delivery_lng?: number | null
          estimated_delivery?: string | null
          id?: string
          items?: Json
          notes?: string | null
          pharmacy_id: string
          prescription_images?: string[] | null
          status?: string | null
          subtotal: number
          total_amount: number
          updated_at?: string
          user_id: string
        }
        Update: {
          contact_name?: string | null
          contact_phone?: string | null
          created_at?: string
          currency?: string | null
          delivery_address?: string | null
          delivery_fee?: number | null
          delivery_lat?: number | null
          delivery_lng?: number | null
          estimated_delivery?: string | null
          id?: string
          items?: Json
          notes?: string | null
          pharmacy_id?: string
          prescription_images?: string[] | null
          status?: string | null
          subtotal?: number
          total_amount?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "pharmacy_orders_pharmacy_id_fkey"
            columns: ["pharmacy_id"]
            isOneToOne: false
            referencedRelation: "pharmacies"
            referencedColumns: ["id"]
          },
        ]
      }
      pharmacy_products: {
        Row: {
          active_ingredients: string | null
          category: string
          created_at: string
          currency: string | null
          description_en: string | null
          description_ru: string | null
          dosage: string | null
          id: string
          image: string | null
          is_active: boolean | null
          manufacturer: string | null
          name_en: string
          name_ru: string
          pharmacy_id: string
          price: number
          requires_prescription: boolean | null
          stock_quantity: number | null
        }
        Insert: {
          active_ingredients?: string | null
          category?: string
          created_at?: string
          currency?: string | null
          description_en?: string | null
          description_ru?: string | null
          dosage?: string | null
          id?: string
          image?: string | null
          is_active?: boolean | null
          manufacturer?: string | null
          name_en: string
          name_ru: string
          pharmacy_id: string
          price: number
          requires_prescription?: boolean | null
          stock_quantity?: number | null
        }
        Update: {
          active_ingredients?: string | null
          category?: string
          created_at?: string
          currency?: string | null
          description_en?: string | null
          description_ru?: string | null
          dosage?: string | null
          id?: string
          image?: string | null
          is_active?: boolean | null
          manufacturer?: string | null
          name_en?: string
          name_ru?: string
          pharmacy_id?: string
          price?: number
          requires_prescription?: boolean | null
          stock_quantity?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "pharmacy_products_pharmacy_id_fkey"
            columns: ["pharmacy_id"]
            isOneToOne: false
            referencedRelation: "pharmacies"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          email: string | null
          full_name: string | null
          id: string
          phone: string | null
          preferred_language: string | null
          updated_at: string
          user_type: Database["public"]["Enums"]["user_type"] | null
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          email?: string | null
          full_name?: string | null
          id: string
          phone?: string | null
          preferred_language?: string | null
          updated_at?: string
          user_type?: Database["public"]["Enums"]["user_type"] | null
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          email?: string | null
          full_name?: string | null
          id?: string
          phone?: string | null
          preferred_language?: string | null
          updated_at?: string
          user_type?: Database["public"]["Enums"]["user_type"] | null
        }
        Relationships: []
      }
      properties: {
        Row: {
          address: string | null
          amenities: string[] | null
          area_sqm: number | null
          available_from: string | null
          bathrooms: number | null
          bedrooms: number | null
          cover_image: string | null
          created_at: string
          currency: string | null
          description_en: string | null
          description_ru: string | null
          district: string | null
          id: string
          images: string[] | null
          is_active: boolean | null
          is_featured: boolean | null
          is_verified: boolean | null
          lat: number | null
          listing_type: string
          lng: number | null
          location_id: string | null
          max_guests: number | null
          min_stay_nights: number | null
          price: number | null
          price_period: string | null
          property_type: string
          provider_id: string | null
          rating: number | null
          review_count: number | null
          title_en: string
          title_ru: string
          updated_at: string
        }
        Insert: {
          address?: string | null
          amenities?: string[] | null
          area_sqm?: number | null
          available_from?: string | null
          bathrooms?: number | null
          bedrooms?: number | null
          cover_image?: string | null
          created_at?: string
          currency?: string | null
          description_en?: string | null
          description_ru?: string | null
          district?: string | null
          id?: string
          images?: string[] | null
          is_active?: boolean | null
          is_featured?: boolean | null
          is_verified?: boolean | null
          lat?: number | null
          listing_type: string
          lng?: number | null
          location_id?: string | null
          max_guests?: number | null
          min_stay_nights?: number | null
          price?: number | null
          price_period?: string | null
          property_type: string
          provider_id?: string | null
          rating?: number | null
          review_count?: number | null
          title_en: string
          title_ru: string
          updated_at?: string
        }
        Update: {
          address?: string | null
          amenities?: string[] | null
          area_sqm?: number | null
          available_from?: string | null
          bathrooms?: number | null
          bedrooms?: number | null
          cover_image?: string | null
          created_at?: string
          currency?: string | null
          description_en?: string | null
          description_ru?: string | null
          district?: string | null
          id?: string
          images?: string[] | null
          is_active?: boolean | null
          is_featured?: boolean | null
          is_verified?: boolean | null
          lat?: number | null
          listing_type?: string
          lng?: number | null
          location_id?: string | null
          max_guests?: number | null
          min_stay_nights?: number | null
          price?: number | null
          price_period?: string | null
          property_type?: string
          provider_id?: string | null
          rating?: number | null
          review_count?: number | null
          title_en?: string
          title_ru?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "properties_location_id_fkey"
            columns: ["location_id"]
            isOneToOne: false
            referencedRelation: "locations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "properties_provider_id_fkey"
            columns: ["provider_id"]
            isOneToOne: false
            referencedRelation: "providers"
            referencedColumns: ["id"]
          },
        ]
      }
      property_financials: {
        Row: {
          amount: number
          category: string | null
          created_at: string
          currency: string | null
          description: string | null
          description_ru: string | null
          id: string
          owner_id: string
          property_id: string
          receipt_url: string | null
          reference_id: string | null
          reference_type: string | null
          transaction_date: string
          transaction_type: string
        }
        Insert: {
          amount: number
          category?: string | null
          created_at?: string
          currency?: string | null
          description?: string | null
          description_ru?: string | null
          id?: string
          owner_id: string
          property_id: string
          receipt_url?: string | null
          reference_id?: string | null
          reference_type?: string | null
          transaction_date?: string
          transaction_type: string
        }
        Update: {
          amount?: number
          category?: string | null
          created_at?: string
          currency?: string | null
          description?: string | null
          description_ru?: string | null
          id?: string
          owner_id?: string
          property_id?: string
          receipt_url?: string | null
          reference_id?: string | null
          reference_type?: string | null
          transaction_date?: string
          transaction_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "property_financials_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "owner_properties"
            referencedColumns: ["id"]
          },
        ]
      }
      property_inquiries: {
        Row: {
          check_in: string | null
          check_out: string | null
          created_at: string
          email: string | null
          guests: number | null
          id: string
          message: string | null
          name: string
          phone: string | null
          property_id: string
          status: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          check_in?: string | null
          check_out?: string | null
          created_at?: string
          email?: string | null
          guests?: number | null
          id?: string
          message?: string | null
          name: string
          phone?: string | null
          property_id: string
          status?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          check_in?: string | null
          check_out?: string | null
          created_at?: string
          email?: string | null
          guests?: number | null
          id?: string
          message?: string | null
          name?: string
          phone?: string | null
          property_id?: string
          status?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "property_inquiries_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
        ]
      }
      property_inspections: {
        Row: {
          checklist_results: Json | null
          completed_at: string | null
          cost: number | null
          created_at: string
          currency: string | null
          id: string
          inspection_type: string
          inspector_id: string | null
          issues_found: Json | null
          notes: string | null
          owner_id: string
          photos: string[] | null
          property_id: string
          report_summary: string | null
          report_summary_ru: string | null
          scheduled_at: string
          status: string | null
          updated_at: string
          video_url: string | null
        }
        Insert: {
          checklist_results?: Json | null
          completed_at?: string | null
          cost?: number | null
          created_at?: string
          currency?: string | null
          id?: string
          inspection_type?: string
          inspector_id?: string | null
          issues_found?: Json | null
          notes?: string | null
          owner_id: string
          photos?: string[] | null
          property_id: string
          report_summary?: string | null
          report_summary_ru?: string | null
          scheduled_at: string
          status?: string | null
          updated_at?: string
          video_url?: string | null
        }
        Update: {
          checklist_results?: Json | null
          completed_at?: string | null
          cost?: number | null
          created_at?: string
          currency?: string | null
          id?: string
          inspection_type?: string
          inspector_id?: string | null
          issues_found?: Json | null
          notes?: string | null
          owner_id?: string
          photos?: string[] | null
          property_id?: string
          report_summary?: string | null
          report_summary_ru?: string | null
          scheduled_at?: string
          status?: string | null
          updated_at?: string
          video_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "property_inspections_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "owner_properties"
            referencedColumns: ["id"]
          },
        ]
      }
      property_service_requests: {
        Row: {
          assigned_to: string | null
          completed_at: string | null
          completion_notes: string | null
          completion_photos: string[] | null
          created_at: string
          currency: string | null
          deposit_amount: number | null
          deposit_collected: boolean | null
          deposit_returned: boolean | null
          description: string | null
          description_ru: string | null
          guest_count: number | null
          guest_name: string | null
          guest_phone: string | null
          id: string
          owner_id: string
          priority: string | null
          property_id: string
          scheduled_at: string | null
          service_cost: number | null
          service_type: string
          special_instructions: string | null
          status: string | null
          updated_at: string
        }
        Insert: {
          assigned_to?: string | null
          completed_at?: string | null
          completion_notes?: string | null
          completion_photos?: string[] | null
          created_at?: string
          currency?: string | null
          deposit_amount?: number | null
          deposit_collected?: boolean | null
          deposit_returned?: boolean | null
          description?: string | null
          description_ru?: string | null
          guest_count?: number | null
          guest_name?: string | null
          guest_phone?: string | null
          id?: string
          owner_id: string
          priority?: string | null
          property_id: string
          scheduled_at?: string | null
          service_cost?: number | null
          service_type: string
          special_instructions?: string | null
          status?: string | null
          updated_at?: string
        }
        Update: {
          assigned_to?: string | null
          completed_at?: string | null
          completion_notes?: string | null
          completion_photos?: string[] | null
          created_at?: string
          currency?: string | null
          deposit_amount?: number | null
          deposit_collected?: boolean | null
          deposit_returned?: boolean | null
          description?: string | null
          description_ru?: string | null
          guest_count?: number | null
          guest_name?: string | null
          guest_phone?: string | null
          id?: string
          owner_id?: string
          priority?: string | null
          property_id?: string
          scheduled_at?: string | null
          service_cost?: number | null
          service_type?: string
          special_instructions?: string | null
          status?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "property_service_requests_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "owner_properties"
            referencedColumns: ["id"]
          },
        ]
      }
      provider_badges: {
        Row: {
          awarded_at: string
          awarded_by: string | null
          badge_id: string
          expires_at: string | null
          id: string
          notes: string | null
          provider_id: string
        }
        Insert: {
          awarded_at?: string
          awarded_by?: string | null
          badge_id: string
          expires_at?: string | null
          id?: string
          notes?: string | null
          provider_id: string
        }
        Update: {
          awarded_at?: string
          awarded_by?: string | null
          badge_id?: string
          expires_at?: string | null
          id?: string
          notes?: string | null
          provider_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "provider_badges_badge_id_fkey"
            columns: ["badge_id"]
            isOneToOne: false
            referencedRelation: "trust_badges"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "provider_badges_provider_id_fkey"
            columns: ["provider_id"]
            isOneToOne: false
            referencedRelation: "providers"
            referencedColumns: ["id"]
          },
        ]
      }
      providers: {
        Row: {
          address: string | null
          business_category: string | null
          commission_rate: number | null
          cover_image: string | null
          created_at: string
          description_en: string | null
          description_ru: string | null
          email: string | null
          id: string
          is_active: boolean | null
          is_verified: boolean | null
          lat: number | null
          lng: number | null
          logo_url: string | null
          name: string
          pending_payout: number | null
          phone: string | null
          rating: number | null
          review_count: number | null
          total_earnings: number | null
          trust_score: number | null
          updated_at: string
          user_id: string | null
          website: string | null
        }
        Insert: {
          address?: string | null
          business_category?: string | null
          commission_rate?: number | null
          cover_image?: string | null
          created_at?: string
          description_en?: string | null
          description_ru?: string | null
          email?: string | null
          id?: string
          is_active?: boolean | null
          is_verified?: boolean | null
          lat?: number | null
          lng?: number | null
          logo_url?: string | null
          name: string
          pending_payout?: number | null
          phone?: string | null
          rating?: number | null
          review_count?: number | null
          total_earnings?: number | null
          trust_score?: number | null
          updated_at?: string
          user_id?: string | null
          website?: string | null
        }
        Update: {
          address?: string | null
          business_category?: string | null
          commission_rate?: number | null
          cover_image?: string | null
          created_at?: string
          description_en?: string | null
          description_ru?: string | null
          email?: string | null
          id?: string
          is_active?: boolean | null
          is_verified?: boolean | null
          lat?: number | null
          lng?: number | null
          logo_url?: string | null
          name?: string
          pending_payout?: number | null
          phone?: string | null
          rating?: number | null
          review_count?: number | null
          total_earnings?: number | null
          trust_score?: number | null
          updated_at?: string
          user_id?: string | null
          website?: string | null
        }
        Relationships: []
      }
      push_subscriptions: {
        Row: {
          created_at: string
          endpoint: string
          id: string
          keys: Json
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          endpoint: string
          id?: string
          keys: Json
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          endpoint?: string
          id?: string
          keys?: Json
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      referral_codes: {
        Row: {
          code: string
          created_at: string
          id: string
          is_active: boolean
          user_id: string
        }
        Insert: {
          code: string
          created_at?: string
          id?: string
          is_active?: boolean
          user_id: string
        }
        Update: {
          code?: string
          created_at?: string
          id?: string
          is_active?: boolean
          user_id?: string
        }
        Relationships: []
      }
      referral_settings: {
        Row: {
          created_at: string
          id: string
          is_active: boolean
          min_booking_amount: number | null
          referred_bonus: number
          referrer_bonus: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_active?: boolean
          min_booking_amount?: number | null
          referred_bonus?: number
          referrer_bonus?: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          is_active?: boolean
          min_booking_amount?: number | null
          referred_bonus?: number
          referrer_bonus?: number
          updated_at?: string
        }
        Relationships: []
      }
      referrals: {
        Row: {
          bonus_paid_at: string | null
          created_at: string
          id: string
          referred_bonus: number
          referred_id: string
          referrer_bonus: number
          referrer_id: string
          status: string
        }
        Insert: {
          bonus_paid_at?: string | null
          created_at?: string
          id?: string
          referred_bonus?: number
          referred_id: string
          referrer_bonus?: number
          referrer_id: string
          status?: string
        }
        Update: {
          bonus_paid_at?: string | null
          created_at?: string
          id?: string
          referred_bonus?: number
          referred_id?: string
          referrer_bonus?: number
          referrer_id?: string
          status?: string
        }
        Relationships: []
      }
      restaurant_menu_categories: {
        Row: {
          created_at: string
          id: string
          is_active: boolean | null
          name_en: string
          name_ru: string
          restaurant_id: string
          sort_order: number | null
        }
        Insert: {
          created_at?: string
          id?: string
          is_active?: boolean | null
          name_en: string
          name_ru: string
          restaurant_id: string
          sort_order?: number | null
        }
        Update: {
          created_at?: string
          id?: string
          is_active?: boolean | null
          name_en?: string
          name_ru?: string
          restaurant_id?: string
          sort_order?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "restaurant_menu_categories_restaurant_id_fkey"
            columns: ["restaurant_id"]
            isOneToOne: false
            referencedRelation: "restaurants"
            referencedColumns: ["id"]
          },
        ]
      }
      restaurant_menu_items: {
        Row: {
          calories: number | null
          category_id: string | null
          created_at: string
          currency: string | null
          description_en: string | null
          description_ru: string | null
          id: string
          image: string | null
          is_active: boolean | null
          is_popular: boolean | null
          is_spicy: boolean | null
          is_vegetarian: boolean | null
          name_en: string
          name_ru: string
          prep_time_minutes: number | null
          price: number
          restaurant_id: string
          updated_at: string
        }
        Insert: {
          calories?: number | null
          category_id?: string | null
          created_at?: string
          currency?: string | null
          description_en?: string | null
          description_ru?: string | null
          id?: string
          image?: string | null
          is_active?: boolean | null
          is_popular?: boolean | null
          is_spicy?: boolean | null
          is_vegetarian?: boolean | null
          name_en: string
          name_ru: string
          prep_time_minutes?: number | null
          price: number
          restaurant_id: string
          updated_at?: string
        }
        Update: {
          calories?: number | null
          category_id?: string | null
          created_at?: string
          currency?: string | null
          description_en?: string | null
          description_ru?: string | null
          id?: string
          image?: string | null
          is_active?: boolean | null
          is_popular?: boolean | null
          is_spicy?: boolean | null
          is_vegetarian?: boolean | null
          name_en?: string
          name_ru?: string
          prep_time_minutes?: number | null
          price?: number
          restaurant_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "restaurant_menu_items_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "restaurant_menu_categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "restaurant_menu_items_restaurant_id_fkey"
            columns: ["restaurant_id"]
            isOneToOne: false
            referencedRelation: "restaurants"
            referencedColumns: ["id"]
          },
        ]
      }
      restaurants: {
        Row: {
          address: string | null
          cover_image: string | null
          created_at: string
          cuisine: string
          delivery_available: boolean | null
          delivery_fee: number | null
          delivery_time: string | null
          description_en: string | null
          description_ru: string | null
          district: string | null
          email: string | null
          features: string[] | null
          id: string
          images: string[] | null
          is_active: boolean | null
          is_featured: boolean | null
          is_verified: boolean | null
          lat: number | null
          lng: number | null
          min_order_amount: number | null
          name_en: string
          name_ru: string
          phone: string | null
          price_range: number | null
          provider_id: string | null
          rating: number | null
          review_count: number | null
          updated_at: string
          website: string | null
          working_hours: Json | null
        }
        Insert: {
          address?: string | null
          cover_image?: string | null
          created_at?: string
          cuisine?: string
          delivery_available?: boolean | null
          delivery_fee?: number | null
          delivery_time?: string | null
          description_en?: string | null
          description_ru?: string | null
          district?: string | null
          email?: string | null
          features?: string[] | null
          id?: string
          images?: string[] | null
          is_active?: boolean | null
          is_featured?: boolean | null
          is_verified?: boolean | null
          lat?: number | null
          lng?: number | null
          min_order_amount?: number | null
          name_en: string
          name_ru: string
          phone?: string | null
          price_range?: number | null
          provider_id?: string | null
          rating?: number | null
          review_count?: number | null
          updated_at?: string
          website?: string | null
          working_hours?: Json | null
        }
        Update: {
          address?: string | null
          cover_image?: string | null
          created_at?: string
          cuisine?: string
          delivery_available?: boolean | null
          delivery_fee?: number | null
          delivery_time?: string | null
          description_en?: string | null
          description_ru?: string | null
          district?: string | null
          email?: string | null
          features?: string[] | null
          id?: string
          images?: string[] | null
          is_active?: boolean | null
          is_featured?: boolean | null
          is_verified?: boolean | null
          lat?: number | null
          lng?: number | null
          min_order_amount?: number | null
          name_en?: string
          name_ru?: string
          phone?: string | null
          price_range?: number | null
          provider_id?: string | null
          rating?: number | null
          review_count?: number | null
          updated_at?: string
          website?: string | null
          working_hours?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "restaurants_provider_id_fkey"
            columns: ["provider_id"]
            isOneToOne: false
            referencedRelation: "providers"
            referencedColumns: ["id"]
          },
        ]
      }
      review_helpful: {
        Row: {
          created_at: string
          id: string
          is_helpful: boolean
          review_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_helpful: boolean
          review_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          is_helpful?: boolean
          review_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "review_helpful_review_id_fkey"
            columns: ["review_id"]
            isOneToOne: false
            referencedRelation: "reviews"
            referencedColumns: ["id"]
          },
        ]
      }
      reviews: {
        Row: {
          cons: string | null
          content: string | null
          created_at: string
          helpful_count: number | null
          id: string
          images: string[] | null
          is_approved: boolean | null
          is_featured: boolean | null
          is_verified_purchase: boolean | null
          item_id: string
          item_type: string
          pros: string | null
          rating: number
          response: string | null
          response_at: string | null
          title: string | null
          updated_at: string
          user_id: string
          visit_date: string | null
        }
        Insert: {
          cons?: string | null
          content?: string | null
          created_at?: string
          helpful_count?: number | null
          id?: string
          images?: string[] | null
          is_approved?: boolean | null
          is_featured?: boolean | null
          is_verified_purchase?: boolean | null
          item_id: string
          item_type: string
          pros?: string | null
          rating: number
          response?: string | null
          response_at?: string | null
          title?: string | null
          updated_at?: string
          user_id: string
          visit_date?: string | null
        }
        Update: {
          cons?: string | null
          content?: string | null
          created_at?: string
          helpful_count?: number | null
          id?: string
          images?: string[] | null
          is_approved?: boolean | null
          is_featured?: boolean | null
          is_verified_purchase?: boolean | null
          item_id?: string
          item_type?: string
          pros?: string | null
          rating?: number
          response?: string | null
          response_at?: string | null
          title?: string | null
          updated_at?: string
          user_id?: string
          visit_date?: string | null
        }
        Relationships: []
      }
      services: {
        Row: {
          category_id: string | null
          created_at: string
          currency: string | null
          description_en: string | null
          description_ru: string | null
          duration_minutes: number | null
          id: string
          images: string[] | null
          is_active: boolean | null
          location_id: string | null
          name_en: string
          name_ru: string
          price: number | null
          provider_id: string
          tags: string[] | null
          updated_at: string
        }
        Insert: {
          category_id?: string | null
          created_at?: string
          currency?: string | null
          description_en?: string | null
          description_ru?: string | null
          duration_minutes?: number | null
          id?: string
          images?: string[] | null
          is_active?: boolean | null
          location_id?: string | null
          name_en: string
          name_ru: string
          price?: number | null
          provider_id: string
          tags?: string[] | null
          updated_at?: string
        }
        Update: {
          category_id?: string | null
          created_at?: string
          currency?: string | null
          description_en?: string | null
          description_ru?: string | null
          duration_minutes?: number | null
          id?: string
          images?: string[] | null
          is_active?: boolean | null
          location_id?: string | null
          name_en?: string
          name_ru?: string
          price?: number | null
          provider_id?: string
          tags?: string[] | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "services_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "services_location_id_fkey"
            columns: ["location_id"]
            isOneToOne: false
            referencedRelation: "locations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "services_provider_id_fkey"
            columns: ["provider_id"]
            isOneToOne: false
            referencedRelation: "providers"
            referencedColumns: ["id"]
          },
        ]
      }
      store_products: {
        Row: {
          category: string | null
          created_at: string
          currency: string | null
          description_en: string | null
          description_ru: string | null
          id: string
          image: string | null
          is_active: boolean | null
          is_popular: boolean | null
          name_en: string
          name_ru: string
          price: number
          stock_quantity: number | null
          store_id: string
          unit: string | null
        }
        Insert: {
          category?: string | null
          created_at?: string
          currency?: string | null
          description_en?: string | null
          description_ru?: string | null
          id?: string
          image?: string | null
          is_active?: boolean | null
          is_popular?: boolean | null
          name_en: string
          name_ru: string
          price: number
          stock_quantity?: number | null
          store_id: string
          unit?: string | null
        }
        Update: {
          category?: string | null
          created_at?: string
          currency?: string | null
          description_en?: string | null
          description_ru?: string | null
          id?: string
          image?: string | null
          is_active?: boolean | null
          is_popular?: boolean | null
          name_en?: string
          name_ru?: string
          price?: number
          stock_quantity?: number | null
          store_id?: string
          unit?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "store_products_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
        ]
      }
      stores: {
        Row: {
          address: string | null
          approval_status: string | null
          category: string | null
          cover_image: string | null
          created_at: string
          delivery_available: boolean | null
          delivery_fee: number | null
          description_en: string | null
          description_ru: string | null
          id: string
          images: string[] | null
          is_active: boolean | null
          is_featured: boolean | null
          is_verified: boolean | null
          lat: number | null
          lng: number | null
          min_order_amount: number | null
          name_en: string
          name_ru: string
          phone: string | null
          provider_id: string | null
          rating: number | null
          review_count: number | null
          updated_at: string
          working_hours: Json | null
        }
        Insert: {
          address?: string | null
          approval_status?: string | null
          category?: string | null
          cover_image?: string | null
          created_at?: string
          delivery_available?: boolean | null
          delivery_fee?: number | null
          description_en?: string | null
          description_ru?: string | null
          id?: string
          images?: string[] | null
          is_active?: boolean | null
          is_featured?: boolean | null
          is_verified?: boolean | null
          lat?: number | null
          lng?: number | null
          min_order_amount?: number | null
          name_en: string
          name_ru: string
          phone?: string | null
          provider_id?: string | null
          rating?: number | null
          review_count?: number | null
          updated_at?: string
          working_hours?: Json | null
        }
        Update: {
          address?: string | null
          approval_status?: string | null
          category?: string | null
          cover_image?: string | null
          created_at?: string
          delivery_available?: boolean | null
          delivery_fee?: number | null
          description_en?: string | null
          description_ru?: string | null
          id?: string
          images?: string[] | null
          is_active?: boolean | null
          is_featured?: boolean | null
          is_verified?: boolean | null
          lat?: number | null
          lng?: number | null
          min_order_amount?: number | null
          name_en?: string
          name_ru?: string
          phone?: string | null
          provider_id?: string | null
          rating?: number | null
          review_count?: number | null
          updated_at?: string
          working_hours?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "stores_provider_id_fkey"
            columns: ["provider_id"]
            isOneToOne: false
            referencedRelation: "providers"
            referencedColumns: ["id"]
          },
        ]
      }
      tags: {
        Row: {
          category: string | null
          created_at: string
          id: string
          name_en: string
          name_ru: string
        }
        Insert: {
          category?: string | null
          created_at?: string
          id?: string
          name_en: string
          name_ru: string
        }
        Update: {
          category?: string | null
          created_at?: string
          id?: string
          name_en?: string
          name_ru?: string
        }
        Relationships: []
      }
      tour_bookings: {
        Row: {
          booking_date: string
          contact_email: string | null
          contact_name: string | null
          contact_phone: string | null
          created_at: string
          currency: string | null
          id: string
          notes: string | null
          participants: number
          start_time: string
          status: string | null
          total_amount: number
          tour_id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          booking_date: string
          contact_email?: string | null
          contact_name?: string | null
          contact_phone?: string | null
          created_at?: string
          currency?: string | null
          id?: string
          notes?: string | null
          participants?: number
          start_time: string
          status?: string | null
          total_amount: number
          tour_id: string
          updated_at?: string
          user_id: string
        }
        Update: {
          booking_date?: string
          contact_email?: string | null
          contact_name?: string | null
          contact_phone?: string | null
          created_at?: string
          currency?: string | null
          id?: string
          notes?: string | null
          participants?: number
          start_time?: string
          status?: string | null
          total_amount?: number
          tour_id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "tour_bookings_tour_id_fkey"
            columns: ["tour_id"]
            isOneToOne: false
            referencedRelation: "tours"
            referencedColumns: ["id"]
          },
        ]
      }
      tours: {
        Row: {
          available_days: string[] | null
          category: string | null
          cover_image: string | null
          created_at: string
          currency: string | null
          description_en: string | null
          description_ru: string | null
          difficulty: string | null
          duration_hours: number | null
          excludes: string[] | null
          highlights: string[] | null
          id: string
          images: string[] | null
          includes: string[] | null
          is_active: boolean | null
          is_featured: boolean | null
          itinerary: Json | null
          max_participants: number | null
          meeting_point: string | null
          meeting_point_lat: number | null
          meeting_point_lng: number | null
          price: number | null
          provider_id: string | null
          rating: number | null
          review_count: number | null
          start_times: string[] | null
          title_en: string
          title_ru: string
          updated_at: string
        }
        Insert: {
          available_days?: string[] | null
          category?: string | null
          cover_image?: string | null
          created_at?: string
          currency?: string | null
          description_en?: string | null
          description_ru?: string | null
          difficulty?: string | null
          duration_hours?: number | null
          excludes?: string[] | null
          highlights?: string[] | null
          id?: string
          images?: string[] | null
          includes?: string[] | null
          is_active?: boolean | null
          is_featured?: boolean | null
          itinerary?: Json | null
          max_participants?: number | null
          meeting_point?: string | null
          meeting_point_lat?: number | null
          meeting_point_lng?: number | null
          price?: number | null
          provider_id?: string | null
          rating?: number | null
          review_count?: number | null
          start_times?: string[] | null
          title_en: string
          title_ru: string
          updated_at?: string
        }
        Update: {
          available_days?: string[] | null
          category?: string | null
          cover_image?: string | null
          created_at?: string
          currency?: string | null
          description_en?: string | null
          description_ru?: string | null
          difficulty?: string | null
          duration_hours?: number | null
          excludes?: string[] | null
          highlights?: string[] | null
          id?: string
          images?: string[] | null
          includes?: string[] | null
          is_active?: boolean | null
          is_featured?: boolean | null
          itinerary?: Json | null
          max_participants?: number | null
          meeting_point?: string | null
          meeting_point_lat?: number | null
          meeting_point_lng?: number | null
          price?: number | null
          provider_id?: string | null
          rating?: number | null
          review_count?: number | null
          start_times?: string[] | null
          title_en?: string
          title_ru?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "tours_provider_id_fkey"
            columns: ["provider_id"]
            isOneToOne: false
            referencedRelation: "providers"
            referencedColumns: ["id"]
          },
        ]
      }
      transport_destinations: {
        Row: {
          base_price: number
          created_at: string
          duration_minutes: number | null
          id: string
          is_active: boolean | null
          is_popular: boolean | null
          lat: number | null
          lng: number | null
          name_en: string
          name_ru: string
          sort_order: number | null
          type: string
        }
        Insert: {
          base_price: number
          created_at?: string
          duration_minutes?: number | null
          id?: string
          is_active?: boolean | null
          is_popular?: boolean | null
          lat?: number | null
          lng?: number | null
          name_en: string
          name_ru: string
          sort_order?: number | null
          type?: string
        }
        Update: {
          base_price?: number
          created_at?: string
          duration_minutes?: number | null
          id?: string
          is_active?: boolean | null
          is_popular?: boolean | null
          lat?: number | null
          lng?: number | null
          name_en?: string
          name_ru?: string
          sort_order?: number | null
          type?: string
        }
        Relationships: []
      }
      transport_vehicle_types: {
        Row: {
          base_price: number | null
          created_at: string
          description_en: string | null
          description_ru: string | null
          eta_minutes: number | null
          features: string[] | null
          icon: string | null
          id: string
          is_active: boolean | null
          max_passengers: number | null
          name_en: string
          name_ru: string
          price_multiplier: number | null
          price_per_km: number | null
          sort_order: number | null
          type: string
        }
        Insert: {
          base_price?: number | null
          created_at?: string
          description_en?: string | null
          description_ru?: string | null
          eta_minutes?: number | null
          features?: string[] | null
          icon?: string | null
          id?: string
          is_active?: boolean | null
          max_passengers?: number | null
          name_en: string
          name_ru: string
          price_multiplier?: number | null
          price_per_km?: number | null
          sort_order?: number | null
          type: string
        }
        Update: {
          base_price?: number | null
          created_at?: string
          description_en?: string | null
          description_ru?: string | null
          eta_minutes?: number | null
          features?: string[] | null
          icon?: string | null
          id?: string
          is_active?: boolean | null
          max_passengers?: number | null
          name_en?: string
          name_ru?: string
          price_multiplier?: number | null
          price_per_km?: number | null
          sort_order?: number | null
          type?: string
        }
        Relationships: []
      }
      trust_badges: {
        Row: {
          color: string | null
          created_at: string
          criteria: Json | null
          description_en: string | null
          description_ru: string | null
          icon: string
          id: string
          is_active: boolean | null
          name_en: string
          name_ru: string
          sort_order: number | null
        }
        Insert: {
          color?: string | null
          created_at?: string
          criteria?: Json | null
          description_en?: string | null
          description_ru?: string | null
          icon: string
          id?: string
          is_active?: boolean | null
          name_en: string
          name_ru: string
          sort_order?: number | null
        }
        Update: {
          color?: string | null
          created_at?: string
          criteria?: Json | null
          description_en?: string | null
          description_ru?: string | null
          icon?: string
          id?: string
          is_active?: boolean | null
          name_en?: string
          name_ru?: string
          sort_order?: number | null
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      vendor_analytics: {
        Row: {
          avg_rating: number | null
          cancelled_bookings: number | null
          commission: number | null
          completed_bookings: number | null
          created_at: string
          date: string
          id: string
          net_revenue: number | null
          new_customers: number | null
          provider_id: string
          revenue: number | null
          total_bookings: number | null
        }
        Insert: {
          avg_rating?: number | null
          cancelled_bookings?: number | null
          commission?: number | null
          completed_bookings?: number | null
          created_at?: string
          date: string
          id?: string
          net_revenue?: number | null
          new_customers?: number | null
          provider_id: string
          revenue?: number | null
          total_bookings?: number | null
        }
        Update: {
          avg_rating?: number | null
          cancelled_bookings?: number | null
          commission?: number | null
          completed_bookings?: number | null
          created_at?: string
          date?: string
          id?: string
          net_revenue?: number | null
          new_customers?: number | null
          provider_id?: string
          revenue?: number | null
          total_bookings?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "vendor_analytics_provider_id_fkey"
            columns: ["provider_id"]
            isOneToOne: false
            referencedRelation: "providers"
            referencedColumns: ["id"]
          },
        ]
      }
      vendor_bookings: {
        Row: {
          amount: number
          booking_id: string | null
          commission_amount: number
          created_at: string
          customer_email: string | null
          customer_name: string | null
          customer_phone: string | null
          duration_minutes: number | null
          id: string
          net_amount: number
          notes: string | null
          provider_id: string
          scheduled_at: string | null
          service_id: string | null
          status: string | null
          updated_at: string
        }
        Insert: {
          amount?: number
          booking_id?: string | null
          commission_amount?: number
          created_at?: string
          customer_email?: string | null
          customer_name?: string | null
          customer_phone?: string | null
          duration_minutes?: number | null
          id?: string
          net_amount?: number
          notes?: string | null
          provider_id: string
          scheduled_at?: string | null
          service_id?: string | null
          status?: string | null
          updated_at?: string
        }
        Update: {
          amount?: number
          booking_id?: string | null
          commission_amount?: number
          created_at?: string
          customer_email?: string | null
          customer_name?: string | null
          customer_phone?: string | null
          duration_minutes?: number | null
          id?: string
          net_amount?: number
          notes?: string | null
          provider_id?: string
          scheduled_at?: string | null
          service_id?: string | null
          status?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "vendor_bookings_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "vendor_bookings_provider_id_fkey"
            columns: ["provider_id"]
            isOneToOne: false
            referencedRelation: "providers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "vendor_bookings_service_id_fkey"
            columns: ["service_id"]
            isOneToOne: false
            referencedRelation: "vendor_services"
            referencedColumns: ["id"]
          },
        ]
      }
      vendor_payouts: {
        Row: {
          amount: number
          created_at: string
          currency: string | null
          id: string
          notes: string | null
          payment_details: Json | null
          payment_method: string | null
          processed_at: string | null
          provider_id: string
          status: string | null
        }
        Insert: {
          amount: number
          created_at?: string
          currency?: string | null
          id?: string
          notes?: string | null
          payment_details?: Json | null
          payment_method?: string | null
          processed_at?: string | null
          provider_id: string
          status?: string | null
        }
        Update: {
          amount?: number
          created_at?: string
          currency?: string | null
          id?: string
          notes?: string | null
          payment_details?: Json | null
          payment_method?: string | null
          processed_at?: string | null
          provider_id?: string
          status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "vendor_payouts_provider_id_fkey"
            columns: ["provider_id"]
            isOneToOne: false
            referencedRelation: "providers"
            referencedColumns: ["id"]
          },
        ]
      }
      vendor_services: {
        Row: {
          category: string | null
          created_at: string
          currency: string | null
          description: string | null
          description_ru: string | null
          duration_minutes: number | null
          id: string
          images: string[] | null
          is_active: boolean | null
          max_capacity: number | null
          name: string
          name_ru: string | null
          price: number
          provider_id: string
          updated_at: string
        }
        Insert: {
          category?: string | null
          created_at?: string
          currency?: string | null
          description?: string | null
          description_ru?: string | null
          duration_minutes?: number | null
          id?: string
          images?: string[] | null
          is_active?: boolean | null
          max_capacity?: number | null
          name: string
          name_ru?: string | null
          price?: number
          provider_id: string
          updated_at?: string
        }
        Update: {
          category?: string | null
          created_at?: string
          currency?: string | null
          description?: string | null
          description_ru?: string | null
          duration_minutes?: number | null
          id?: string
          images?: string[] | null
          is_active?: boolean | null
          max_capacity?: number | null
          name?: string
          name_ru?: string | null
          price?: number
          provider_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "vendor_services_provider_id_fkey"
            columns: ["provider_id"]
            isOneToOne: false
            referencedRelation: "providers"
            referencedColumns: ["id"]
          },
        ]
      }
      view_history: {
        Row: {
          id: string
          item_data: Json | null
          item_id: string
          item_type: string
          user_id: string
          view_count: number
          viewed_at: string
        }
        Insert: {
          id?: string
          item_data?: Json | null
          item_id: string
          item_type: string
          user_id: string
          view_count?: number
          viewed_at?: string
        }
        Update: {
          id?: string
          item_data?: Json | null
          item_id?: string
          item_type?: string
          user_id?: string
          view_count?: number
          viewed_at?: string
        }
        Relationships: []
      }
      wallet_transactions: {
        Row: {
          amount: number
          created_at: string
          currency: string
          description: string | null
          description_ru: string | null
          id: string
          reference_id: string | null
          reference_type: string | null
          status: string
          type: string
          user_id: string
          wallet_id: string
        }
        Insert: {
          amount: number
          created_at?: string
          currency?: string
          description?: string | null
          description_ru?: string | null
          id?: string
          reference_id?: string | null
          reference_type?: string | null
          status?: string
          type: string
          user_id: string
          wallet_id: string
        }
        Update: {
          amount?: number
          created_at?: string
          currency?: string
          description?: string | null
          description_ru?: string | null
          id?: string
          reference_id?: string | null
          reference_type?: string | null
          status?: string
          type?: string
          user_id?: string
          wallet_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "wallet_transactions_wallet_id_fkey"
            columns: ["wallet_id"]
            isOneToOne: false
            referencedRelation: "wallets"
            referencedColumns: ["id"]
          },
        ]
      }
      wallets: {
        Row: {
          balance: number
          created_at: string
          currency: string
          id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          balance?: number
          created_at?: string
          currency?: string
          id?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          balance?: number
          created_at?: string
          currency?: string
          id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      water_activities: {
        Row: {
          age_restriction: number | null
          available_days: string[] | null
          available_times: string[] | null
          category: string
          certification_details: string | null
          cover_image: string | null
          created_at: string
          currency: string | null
          description_en: string | null
          description_ru: string | null
          difficulty: string | null
          duration_minutes: number | null
          equipment_included: boolean | null
          id: string
          images: string[] | null
          includes: string[] | null
          is_active: boolean | null
          is_certified: boolean | null
          is_featured: boolean | null
          location_name: string | null
          max_participants: number | null
          meeting_point: string | null
          meeting_point_lat: number | null
          meeting_point_lng: number | null
          min_participants: number | null
          price: number | null
          price_per: string | null
          provider_id: string | null
          rating: number | null
          requirements: string[] | null
          review_count: number | null
          safety_briefing_required: boolean | null
          title_en: string
          title_ru: string
          updated_at: string
        }
        Insert: {
          age_restriction?: number | null
          available_days?: string[] | null
          available_times?: string[] | null
          category?: string
          certification_details?: string | null
          cover_image?: string | null
          created_at?: string
          currency?: string | null
          description_en?: string | null
          description_ru?: string | null
          difficulty?: string | null
          duration_minutes?: number | null
          equipment_included?: boolean | null
          id?: string
          images?: string[] | null
          includes?: string[] | null
          is_active?: boolean | null
          is_certified?: boolean | null
          is_featured?: boolean | null
          location_name?: string | null
          max_participants?: number | null
          meeting_point?: string | null
          meeting_point_lat?: number | null
          meeting_point_lng?: number | null
          min_participants?: number | null
          price?: number | null
          price_per?: string | null
          provider_id?: string | null
          rating?: number | null
          requirements?: string[] | null
          review_count?: number | null
          safety_briefing_required?: boolean | null
          title_en: string
          title_ru: string
          updated_at?: string
        }
        Update: {
          age_restriction?: number | null
          available_days?: string[] | null
          available_times?: string[] | null
          category?: string
          certification_details?: string | null
          cover_image?: string | null
          created_at?: string
          currency?: string | null
          description_en?: string | null
          description_ru?: string | null
          difficulty?: string | null
          duration_minutes?: number | null
          equipment_included?: boolean | null
          id?: string
          images?: string[] | null
          includes?: string[] | null
          is_active?: boolean | null
          is_certified?: boolean | null
          is_featured?: boolean | null
          location_name?: string | null
          max_participants?: number | null
          meeting_point?: string | null
          meeting_point_lat?: number | null
          meeting_point_lng?: number | null
          min_participants?: number | null
          price?: number | null
          price_per?: string | null
          provider_id?: string | null
          rating?: number | null
          requirements?: string[] | null
          review_count?: number | null
          safety_briefing_required?: boolean | null
          title_en?: string
          title_ru?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "water_activities_provider_id_fkey"
            columns: ["provider_id"]
            isOneToOne: false
            referencedRelation: "providers"
            referencedColumns: ["id"]
          },
        ]
      }
      water_activity_bookings: {
        Row: {
          activity_id: string
          booking_date: string
          contact_email: string | null
          contact_name: string | null
          contact_phone: string | null
          created_at: string
          currency: string | null
          equipment_rental: Json | null
          id: string
          notes: string | null
          participants: number
          start_time: string
          status: string | null
          total_amount: number
          updated_at: string
          user_id: string
        }
        Insert: {
          activity_id: string
          booking_date: string
          contact_email?: string | null
          contact_name?: string | null
          contact_phone?: string | null
          created_at?: string
          currency?: string | null
          equipment_rental?: Json | null
          id?: string
          notes?: string | null
          participants?: number
          start_time: string
          status?: string | null
          total_amount: number
          updated_at?: string
          user_id: string
        }
        Update: {
          activity_id?: string
          booking_date?: string
          contact_email?: string | null
          contact_name?: string | null
          contact_phone?: string | null
          created_at?: string
          currency?: string | null
          equipment_rental?: Json | null
          id?: string
          notes?: string | null
          participants?: number
          start_time?: string
          status?: string | null
          total_amount?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "water_activity_bookings_activity_id_fkey"
            columns: ["activity_id"]
            isOneToOne: false
            referencedRelation: "water_activities"
            referencedColumns: ["id"]
          },
        ]
      }
      yachts: {
        Row: {
          approval_status: string | null
          bathrooms: number | null
          beam: string | null
          cabins: number | null
          capacity: number | null
          cover_image: string | null
          created_at: string
          cruising_speed: string | null
          currency: string | null
          description_en: string | null
          description_ru: string | null
          draft: string | null
          engines: string | null
          features_en: string[] | null
          features_ru: string[] | null
          fuel_capacity: string | null
          has_catering: boolean | null
          has_crew: boolean | null
          id: string
          images: string[] | null
          is_active: boolean | null
          is_featured: boolean | null
          is_verified: boolean | null
          lat: number | null
          length_meters: number | null
          lng: number | null
          location_name: string | null
          location_ru: string | null
          max_speed: string | null
          name_en: string
          name_ru: string
          price_full_day: number | null
          price_half_day: number | null
          provider_id: string | null
          rating: number | null
          review_count: number | null
          updated_at: string
          yacht_type: string | null
          year_built: number | null
        }
        Insert: {
          approval_status?: string | null
          bathrooms?: number | null
          beam?: string | null
          cabins?: number | null
          capacity?: number | null
          cover_image?: string | null
          created_at?: string
          cruising_speed?: string | null
          currency?: string | null
          description_en?: string | null
          description_ru?: string | null
          draft?: string | null
          engines?: string | null
          features_en?: string[] | null
          features_ru?: string[] | null
          fuel_capacity?: string | null
          has_catering?: boolean | null
          has_crew?: boolean | null
          id?: string
          images?: string[] | null
          is_active?: boolean | null
          is_featured?: boolean | null
          is_verified?: boolean | null
          lat?: number | null
          length_meters?: number | null
          lng?: number | null
          location_name?: string | null
          location_ru?: string | null
          max_speed?: string | null
          name_en: string
          name_ru: string
          price_full_day?: number | null
          price_half_day?: number | null
          provider_id?: string | null
          rating?: number | null
          review_count?: number | null
          updated_at?: string
          yacht_type?: string | null
          year_built?: number | null
        }
        Update: {
          approval_status?: string | null
          bathrooms?: number | null
          beam?: string | null
          cabins?: number | null
          capacity?: number | null
          cover_image?: string | null
          created_at?: string
          cruising_speed?: string | null
          currency?: string | null
          description_en?: string | null
          description_ru?: string | null
          draft?: string | null
          engines?: string | null
          features_en?: string[] | null
          features_ru?: string[] | null
          fuel_capacity?: string | null
          has_catering?: boolean | null
          has_crew?: boolean | null
          id?: string
          images?: string[] | null
          is_active?: boolean | null
          is_featured?: boolean | null
          is_verified?: boolean | null
          lat?: number | null
          length_meters?: number | null
          lng?: number | null
          location_name?: string | null
          location_ru?: string | null
          max_speed?: string | null
          name_en?: string
          name_ru?: string
          price_full_day?: number | null
          price_half_day?: number | null
          provider_id?: string | null
          rating?: number | null
          review_count?: number | null
          updated_at?: string
          yacht_type?: string | null
          year_built?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "yachts_provider_id_fkey"
            columns: ["provider_id"]
            isOneToOne: false
            referencedRelation: "providers"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      apply_referral_code: {
        Args: { p_code: string; p_referred_id: string }
        Returns: boolean
      }
      generate_referral_code: { Args: { p_user_id: string }; Returns: string }
      get_or_create_wallet: {
        Args: { p_user_id: string }
        Returns: {
          balance: number
          created_at: string
          currency: string
          id: string
          updated_at: string
          user_id: string
        }
        SetofOptions: {
          from: "*"
          to: "wallets"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      increment_helpful_count: {
        Args: { review_id_param: string }
        Returns: undefined
      }
    }
    Enums: {
      app_role:
        | "guest"
        | "user"
        | "tourist"
        | "resident"
        | "partner"
        | "owner"
        | "staff"
        | "admin"
        | "ombudsman"
        | "vendor"
        | "property_owner"
      booking_status:
        | "draft"
        | "submitted"
        | "confirmed"
        | "in_progress"
        | "completed"
        | "cancelled_by_user"
        | "cancelled_by_provider"
        | "expired"
      booking_type:
        | "service"
        | "product"
        | "property"
        | "event"
        | "transport"
        | "food"
      payment_status:
        | "pending"
        | "processing"
        | "completed"
        | "failed"
        | "refunded"
        | "cancelled"
      user_type: "tourist" | "resident"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: [
        "guest",
        "user",
        "tourist",
        "resident",
        "partner",
        "owner",
        "staff",
        "admin",
        "ombudsman",
        "vendor",
        "property_owner",
      ],
      booking_status: [
        "draft",
        "submitted",
        "confirmed",
        "in_progress",
        "completed",
        "cancelled_by_user",
        "cancelled_by_provider",
        "expired",
      ],
      booking_type: [
        "service",
        "product",
        "property",
        "event",
        "transport",
        "food",
      ],
      payment_status: [
        "pending",
        "processing",
        "completed",
        "failed",
        "refunded",
        "cancelled",
      ],
      user_type: ["tourist", "resident"],
    },
  },
} as const
