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
      admin_audit_logs: {
        Row: {
          action: string
          admin_id: string
          created_at: string
          entity_id: string | null
          entity_type: string | null
          id: string
          ip_address: string | null
          new_data: Json | null
          old_data: Json | null
          user_agent: string | null
        }
        Insert: {
          action: string
          admin_id: string
          created_at?: string
          entity_id?: string | null
          entity_type?: string | null
          id?: string
          ip_address?: string | null
          new_data?: Json | null
          old_data?: Json | null
          user_agent?: string | null
        }
        Update: {
          action?: string
          admin_id?: string
          created_at?: string
          entity_id?: string | null
          entity_type?: string | null
          id?: string
          ip_address?: string | null
          new_data?: Json | null
          old_data?: Json | null
          user_agent?: string | null
        }
        Relationships: []
      }
      babysitters: {
        Row: {
          age_groups: string[] | null
          approval_status: string | null
          availability: Json | null
          background_checked: boolean | null
          bio_en: string | null
          bio_ru: string | null
          can_cook: boolean | null
          can_drive: boolean | null
          certifications: string[] | null
          created_at: string | null
          created_by_uno_team: boolean | null
          currency: string | null
          experience_years: number | null
          first_aid_certified: boolean | null
          id: string
          images: string[] | null
          is_active: boolean | null
          is_featured: boolean | null
          is_verified: boolean | null
          languages: string[] | null
          name_en: string
          name_ru: string
          photo: string | null
          price_per_day: number | null
          price_per_hour: number | null
          provider_id: string | null
          rating: number | null
          rejection_reason: string | null
          review_count: number | null
          reviewed_at: string | null
          reviewed_by: string | null
          uno_team_creator_id: string | null
          updated_at: string | null
        }
        Insert: {
          age_groups?: string[] | null
          approval_status?: string | null
          availability?: Json | null
          background_checked?: boolean | null
          bio_en?: string | null
          bio_ru?: string | null
          can_cook?: boolean | null
          can_drive?: boolean | null
          certifications?: string[] | null
          created_at?: string | null
          created_by_uno_team?: boolean | null
          currency?: string | null
          experience_years?: number | null
          first_aid_certified?: boolean | null
          id?: string
          images?: string[] | null
          is_active?: boolean | null
          is_featured?: boolean | null
          is_verified?: boolean | null
          languages?: string[] | null
          name_en: string
          name_ru: string
          photo?: string | null
          price_per_day?: number | null
          price_per_hour?: number | null
          provider_id?: string | null
          rating?: number | null
          rejection_reason?: string | null
          review_count?: number | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          uno_team_creator_id?: string | null
          updated_at?: string | null
        }
        Update: {
          age_groups?: string[] | null
          approval_status?: string | null
          availability?: Json | null
          background_checked?: boolean | null
          bio_en?: string | null
          bio_ru?: string | null
          can_cook?: boolean | null
          can_drive?: boolean | null
          certifications?: string[] | null
          created_at?: string | null
          created_by_uno_team?: boolean | null
          currency?: string | null
          experience_years?: number | null
          first_aid_certified?: boolean | null
          id?: string
          images?: string[] | null
          is_active?: boolean | null
          is_featured?: boolean | null
          is_verified?: boolean | null
          languages?: string[] | null
          name_en?: string
          name_ru?: string
          photo?: string | null
          price_per_day?: number | null
          price_per_hour?: number | null
          provider_id?: string | null
          rating?: number | null
          rejection_reason?: string | null
          review_count?: number | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          uno_team_creator_id?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "babysitters_provider_id_fkey"
            columns: ["provider_id"]
            isOneToOne: false
            referencedRelation: "providers"
            referencedColumns: ["id"]
          },
        ]
      }
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
      booking_notifications_log: {
        Row: {
          body: string | null
          booking_id: string | null
          channel: string
          created_at: string | null
          delivered_at: string | null
          error: string | null
          id: string
          metadata: Json | null
          notification_type: string
          read_at: string | null
          sent_at: string | null
          subject: string | null
        }
        Insert: {
          body?: string | null
          booking_id?: string | null
          channel: string
          created_at?: string | null
          delivered_at?: string | null
          error?: string | null
          id?: string
          metadata?: Json | null
          notification_type: string
          read_at?: string | null
          sent_at?: string | null
          subject?: string | null
        }
        Update: {
          body?: string | null
          booking_id?: string | null
          channel?: string
          created_at?: string | null
          delivered_at?: string | null
          error?: string | null
          id?: string
          metadata?: Json | null
          notification_type?: string
          read_at?: string | null
          sent_at?: string | null
          subject?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "booking_notifications_log_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "property_bookings"
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
      cleaning_services: {
        Row: {
          approval_status: string | null
          areas_served: string[] | null
          cover_image: string | null
          created_at: string | null
          created_by_uno_team: boolean | null
          currency: string | null
          description_en: string | null
          description_ru: string | null
          duration_hours: number | null
          features: string[] | null
          id: string
          images: string[] | null
          is_active: boolean | null
          is_featured: boolean | null
          is_verified: boolean | null
          name_en: string
          name_ru: string
          price_fixed: number | null
          price_per_hour: number | null
          provider_id: string | null
          rating: number | null
          rejection_reason: string | null
          review_count: number | null
          reviewed_at: string | null
          reviewed_by: string | null
          service_type: string | null
          uno_team_creator_id: string | null
          updated_at: string | null
        }
        Insert: {
          approval_status?: string | null
          areas_served?: string[] | null
          cover_image?: string | null
          created_at?: string | null
          created_by_uno_team?: boolean | null
          currency?: string | null
          description_en?: string | null
          description_ru?: string | null
          duration_hours?: number | null
          features?: string[] | null
          id?: string
          images?: string[] | null
          is_active?: boolean | null
          is_featured?: boolean | null
          is_verified?: boolean | null
          name_en: string
          name_ru: string
          price_fixed?: number | null
          price_per_hour?: number | null
          provider_id?: string | null
          rating?: number | null
          rejection_reason?: string | null
          review_count?: number | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          service_type?: string | null
          uno_team_creator_id?: string | null
          updated_at?: string | null
        }
        Update: {
          approval_status?: string | null
          areas_served?: string[] | null
          cover_image?: string | null
          created_at?: string | null
          created_by_uno_team?: boolean | null
          currency?: string | null
          description_en?: string | null
          description_ru?: string | null
          duration_hours?: number | null
          features?: string[] | null
          id?: string
          images?: string[] | null
          is_active?: boolean | null
          is_featured?: boolean | null
          is_verified?: boolean | null
          name_en?: string
          name_ru?: string
          price_fixed?: number | null
          price_per_hour?: number | null
          provider_id?: string | null
          rating?: number | null
          rejection_reason?: string | null
          review_count?: number | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          service_type?: string | null
          uno_team_creator_id?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "cleaning_services_provider_id_fkey"
            columns: ["provider_id"]
            isOneToOne: false
            referencedRelation: "providers"
            referencedColumns: ["id"]
          },
        ]
      }
      clinics: {
        Row: {
          address: string | null
          approval_status: string | null
          clinic_type: string
          consultation_price: number | null
          cover_image: string | null
          created_at: string
          created_by_uno_team: boolean | null
          currency: string | null
          description_en: string | null
          description_ru: string | null
          district: string | null
          email: string | null
          id: string
          images: string[] | null
          is_24h: boolean | null
          is_active: boolean | null
          is_featured: boolean | null
          is_verified: boolean | null
          languages: string[] | null
          lat: number | null
          lng: number | null
          name_en: string
          name_ru: string
          phone: string | null
          provider_id: string | null
          rating: number | null
          rejection_reason: string | null
          review_count: number | null
          reviewed_at: string | null
          reviewed_by: string | null
          specialty: string[] | null
          uno_team_creator_id: string | null
          updated_at: string
          website: string | null
          working_hours: Json | null
        }
        Insert: {
          address?: string | null
          approval_status?: string | null
          clinic_type?: string
          consultation_price?: number | null
          cover_image?: string | null
          created_at?: string
          created_by_uno_team?: boolean | null
          currency?: string | null
          description_en?: string | null
          description_ru?: string | null
          district?: string | null
          email?: string | null
          id?: string
          images?: string[] | null
          is_24h?: boolean | null
          is_active?: boolean | null
          is_featured?: boolean | null
          is_verified?: boolean | null
          languages?: string[] | null
          lat?: number | null
          lng?: number | null
          name_en: string
          name_ru: string
          phone?: string | null
          provider_id?: string | null
          rating?: number | null
          rejection_reason?: string | null
          review_count?: number | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          specialty?: string[] | null
          uno_team_creator_id?: string | null
          updated_at?: string
          website?: string | null
          working_hours?: Json | null
        }
        Update: {
          address?: string | null
          approval_status?: string | null
          clinic_type?: string
          consultation_price?: number | null
          cover_image?: string | null
          created_at?: string
          created_by_uno_team?: boolean | null
          currency?: string | null
          description_en?: string | null
          description_ru?: string | null
          district?: string | null
          email?: string | null
          id?: string
          images?: string[] | null
          is_24h?: boolean | null
          is_active?: boolean | null
          is_featured?: boolean | null
          is_verified?: boolean | null
          languages?: string[] | null
          lat?: number | null
          lng?: number | null
          name_en?: string
          name_ru?: string
          phone?: string | null
          provider_id?: string | null
          rating?: number | null
          rejection_reason?: string | null
          review_count?: number | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          specialty?: string[] | null
          uno_team_creator_id?: string | null
          updated_at?: string
          website?: string | null
          working_hours?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "clinics_provider_id_fkey"
            columns: ["provider_id"]
            isOneToOne: false
            referencedRelation: "providers"
            referencedColumns: ["id"]
          },
        ]
      }
      cohort_metrics: {
        Row: {
          cohort_date: string
          cohort_size: number
          created_at: string | null
          d1_retained: number | null
          d1_retention_rate: number | null
          d30_retained: number | null
          d30_retention_rate: number | null
          d7_retained: number | null
          d7_retention_rate: number | null
          d90_retained: number | null
          d90_retention_rate: number | null
          id: string
          updated_at: string | null
        }
        Insert: {
          cohort_date: string
          cohort_size?: number
          created_at?: string | null
          d1_retained?: number | null
          d1_retention_rate?: number | null
          d30_retained?: number | null
          d30_retention_rate?: number | null
          d7_retained?: number | null
          d7_retention_rate?: number | null
          d90_retained?: number | null
          d90_retention_rate?: number | null
          id?: string
          updated_at?: string | null
        }
        Update: {
          cohort_date?: string
          cohort_size?: number
          created_at?: string | null
          d1_retained?: number | null
          d1_retention_rate?: number | null
          d30_retained?: number | null
          d30_retention_rate?: number | null
          d7_retained?: number | null
          d7_retention_rate?: number | null
          d90_retained?: number | null
          d90_retention_rate?: number | null
          id?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      consultation_requests: {
        Row: {
          admin_notes: string | null
          assigned_to: string | null
          bedrooms_max: number | null
          bedrooms_min: number | null
          budget_max: number | null
          budget_min: number | null
          children_count: number | null
          contact_attempts: number | null
          conversion_order_id: string | null
          created_at: string
          currency: string | null
          current_occupancy: string | null
          districts: string[] | null
          email: string | null
          first_contact_at: string | null
          follow_up_date: string | null
          guests_count: number | null
          id: string
          last_contact_at: string | null
          lead_source: string | null
          name: string
          notes: string | null
          outcome: string | null
          owner_property_id: string | null
          phone: string
          preferred_contact_method: string | null
          preferred_dates: Json | null
          preferred_language: string | null
          priority: string | null
          property_ids: string[] | null
          property_types: string[] | null
          purpose: string | null
          request_type: string
          services_requested: string[] | null
          sla_deadline: string | null
          status: string | null
          updated_at: string
          user_id: string | null
        }
        Insert: {
          admin_notes?: string | null
          assigned_to?: string | null
          bedrooms_max?: number | null
          bedrooms_min?: number | null
          budget_max?: number | null
          budget_min?: number | null
          children_count?: number | null
          contact_attempts?: number | null
          conversion_order_id?: string | null
          created_at?: string
          currency?: string | null
          current_occupancy?: string | null
          districts?: string[] | null
          email?: string | null
          first_contact_at?: string | null
          follow_up_date?: string | null
          guests_count?: number | null
          id?: string
          last_contact_at?: string | null
          lead_source?: string | null
          name: string
          notes?: string | null
          outcome?: string | null
          owner_property_id?: string | null
          phone: string
          preferred_contact_method?: string | null
          preferred_dates?: Json | null
          preferred_language?: string | null
          priority?: string | null
          property_ids?: string[] | null
          property_types?: string[] | null
          purpose?: string | null
          request_type: string
          services_requested?: string[] | null
          sla_deadline?: string | null
          status?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          admin_notes?: string | null
          assigned_to?: string | null
          bedrooms_max?: number | null
          bedrooms_min?: number | null
          budget_max?: number | null
          budget_min?: number | null
          children_count?: number | null
          contact_attempts?: number | null
          conversion_order_id?: string | null
          created_at?: string
          currency?: string | null
          current_occupancy?: string | null
          districts?: string[] | null
          email?: string | null
          first_contact_at?: string | null
          follow_up_date?: string | null
          guests_count?: number | null
          id?: string
          last_contact_at?: string | null
          lead_source?: string | null
          name?: string
          notes?: string | null
          outcome?: string | null
          owner_property_id?: string | null
          phone?: string
          preferred_contact_method?: string | null
          preferred_dates?: Json | null
          preferred_language?: string | null
          priority?: string | null
          property_ids?: string[] | null
          property_types?: string[] | null
          purpose?: string | null
          request_type?: string
          services_requested?: string[] | null
          sla_deadline?: string | null
          status?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "consultation_requests_conversion_order_id_fkey"
            columns: ["conversion_order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
        ]
      }
      cross_sell_metrics: {
        Row: {
          conversion_rate: number | null
          created_at: string | null
          date: string
          from_vertical: string
          id: string
          to_vertical: string
          users_count: number | null
        }
        Insert: {
          conversion_rate?: number | null
          created_at?: string | null
          date: string
          from_vertical: string
          id?: string
          to_vertical: string
          users_count?: number | null
        }
        Update: {
          conversion_rate?: number | null
          created_at?: string | null
          date?: string
          from_vertical?: string
          id?: string
          to_vertical?: string
          users_count?: number | null
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
      doctors: {
        Row: {
          available_days: string[] | null
          available_times: Json | null
          clinic_id: string
          consultation_price: number | null
          created_at: string
          currency: string | null
          experience_years: number | null
          id: string
          is_active: boolean | null
          is_available: boolean | null
          languages: string[] | null
          name_en: string
          name_ru: string
          photo: string | null
          qualification: string | null
          qualification_ru: string | null
          rating: number | null
          review_count: number | null
          specialty: string
          specialty_ru: string | null
          updated_at: string
        }
        Insert: {
          available_days?: string[] | null
          available_times?: Json | null
          clinic_id: string
          consultation_price?: number | null
          created_at?: string
          currency?: string | null
          experience_years?: number | null
          id?: string
          is_active?: boolean | null
          is_available?: boolean | null
          languages?: string[] | null
          name_en: string
          name_ru: string
          photo?: string | null
          qualification?: string | null
          qualification_ru?: string | null
          rating?: number | null
          review_count?: number | null
          specialty: string
          specialty_ru?: string | null
          updated_at?: string
        }
        Update: {
          available_days?: string[] | null
          available_times?: Json | null
          clinic_id?: string
          consultation_price?: number | null
          created_at?: string
          currency?: string | null
          experience_years?: number | null
          id?: string
          is_active?: boolean | null
          is_available?: boolean | null
          languages?: string[] | null
          name_en?: string
          name_ru?: string
          photo?: string | null
          qualification?: string | null
          qualification_ru?: string | null
          rating?: number | null
          review_count?: number | null
          specialty?: string
          specialty_ru?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "doctors_clinic_id_fkey"
            columns: ["clinic_id"]
            isOneToOne: false
            referencedRelation: "clinics"
            referencedColumns: ["id"]
          },
        ]
      }
      education_providers: {
        Row: {
          address: string | null
          age_groups: string[] | null
          approval_status: string | null
          cover_image: string | null
          created_at: string | null
          created_by_uno_team: boolean | null
          currency: string | null
          description_en: string | null
          description_ru: string | null
          district: string | null
          email: string | null
          id: string
          images: string[] | null
          is_active: boolean | null
          is_featured: boolean | null
          is_online: boolean | null
          is_verified: boolean | null
          languages: string[] | null
          lat: number | null
          lng: number | null
          name_en: string
          name_ru: string
          phone: string | null
          price_per_course: number | null
          price_per_hour: number | null
          provider_id: string | null
          provider_type: string | null
          qualifications: string[] | null
          rating: number | null
          rejection_reason: string | null
          review_count: number | null
          reviewed_at: string | null
          reviewed_by: string | null
          subjects: string[] | null
          uno_team_creator_id: string | null
          updated_at: string | null
          website: string | null
        }
        Insert: {
          address?: string | null
          age_groups?: string[] | null
          approval_status?: string | null
          cover_image?: string | null
          created_at?: string | null
          created_by_uno_team?: boolean | null
          currency?: string | null
          description_en?: string | null
          description_ru?: string | null
          district?: string | null
          email?: string | null
          id?: string
          images?: string[] | null
          is_active?: boolean | null
          is_featured?: boolean | null
          is_online?: boolean | null
          is_verified?: boolean | null
          languages?: string[] | null
          lat?: number | null
          lng?: number | null
          name_en: string
          name_ru: string
          phone?: string | null
          price_per_course?: number | null
          price_per_hour?: number | null
          provider_id?: string | null
          provider_type?: string | null
          qualifications?: string[] | null
          rating?: number | null
          rejection_reason?: string | null
          review_count?: number | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          subjects?: string[] | null
          uno_team_creator_id?: string | null
          updated_at?: string | null
          website?: string | null
        }
        Update: {
          address?: string | null
          age_groups?: string[] | null
          approval_status?: string | null
          cover_image?: string | null
          created_at?: string | null
          created_by_uno_team?: boolean | null
          currency?: string | null
          description_en?: string | null
          description_ru?: string | null
          district?: string | null
          email?: string | null
          id?: string
          images?: string[] | null
          is_active?: boolean | null
          is_featured?: boolean | null
          is_online?: boolean | null
          is_verified?: boolean | null
          languages?: string[] | null
          lat?: number | null
          lng?: number | null
          name_en?: string
          name_ru?: string
          phone?: string | null
          price_per_course?: number | null
          price_per_hour?: number | null
          provider_id?: string | null
          provider_type?: string | null
          qualifications?: string[] | null
          rating?: number | null
          rejection_reason?: string | null
          review_count?: number | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          subjects?: string[] | null
          uno_team_creator_id?: string | null
          updated_at?: string | null
          website?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "education_providers_provider_id_fkey"
            columns: ["provider_id"]
            isOneToOne: false
            referencedRelation: "providers"
            referencedColumns: ["id"]
          },
        ]
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
          approval_status: string | null
          category: string
          cover_image: string | null
          created_at: string
          created_by_uno_team: boolean | null
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
          is_global: boolean | null
          is_hot: boolean | null
          is_last_minute: boolean | null
          is_recurring: boolean | null
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
          rejection_reason: string | null
          review_count: number | null
          reviewed_at: string | null
          reviewed_by: string | null
          spots_left: number | null
          title_en: string
          title_ru: string
          uno_team_creator_id: string | null
          updated_at: string
          venue_id: string | null
        }
        Insert: {
          address?: string | null
          approval_status?: string | null
          category?: string
          cover_image?: string | null
          created_at?: string
          created_by_uno_team?: boolean | null
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
          is_global?: boolean | null
          is_hot?: boolean | null
          is_last_minute?: boolean | null
          is_recurring?: boolean | null
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
          rejection_reason?: string | null
          review_count?: number | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          spots_left?: number | null
          title_en: string
          title_ru: string
          uno_team_creator_id?: string | null
          updated_at?: string
          venue_id?: string | null
        }
        Update: {
          address?: string | null
          approval_status?: string | null
          category?: string
          cover_image?: string | null
          created_at?: string
          created_by_uno_team?: boolean | null
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
          is_global?: boolean | null
          is_hot?: boolean | null
          is_last_minute?: boolean | null
          is_recurring?: boolean | null
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
          rejection_reason?: string | null
          review_count?: number | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          spots_left?: number | null
          title_en?: string
          title_ru?: string
          uno_team_creator_id?: string | null
          updated_at?: string
          venue_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "events_provider_id_fkey"
            columns: ["provider_id"]
            isOneToOne: false
            referencedRelation: "providers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "events_venue_id_fkey"
            columns: ["venue_id"]
            isOneToOne: false
            referencedRelation: "venues"
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
      featured_listings: {
        Row: {
          created_at: string
          currency: string | null
          ends_at: string
          entity_id: string
          entity_type: string
          id: string
          is_active: boolean | null
          package_type: string
          price_paid: number
          provider_id: string
          starts_at: string
          stripe_payment_id: string | null
        }
        Insert: {
          created_at?: string
          currency?: string | null
          ends_at: string
          entity_id: string
          entity_type: string
          id?: string
          is_active?: boolean | null
          package_type: string
          price_paid: number
          provider_id: string
          starts_at?: string
          stripe_payment_id?: string | null
        }
        Update: {
          created_at?: string
          currency?: string | null
          ends_at?: string
          entity_id?: string
          entity_type?: string
          id?: string
          is_active?: boolean | null
          package_type?: string
          price_paid?: number
          provider_id?: string
          starts_at?: string
          stripe_payment_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "featured_listings_provider_id_fkey"
            columns: ["provider_id"]
            isOneToOne: false
            referencedRelation: "providers"
            referencedColumns: ["id"]
          },
        ]
      }
      flower_shops: {
        Row: {
          address: string | null
          approval_status: string | null
          cover_image: string | null
          created_at: string
          created_by_uno_team: boolean | null
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
          rejection_reason: string | null
          review_count: number | null
          reviewed_at: string | null
          reviewed_by: string | null
          uno_team_creator_id: string | null
          updated_at: string
          working_hours: Json | null
        }
        Insert: {
          address?: string | null
          approval_status?: string | null
          cover_image?: string | null
          created_at?: string
          created_by_uno_team?: boolean | null
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
          rejection_reason?: string | null
          review_count?: number | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          uno_team_creator_id?: string | null
          updated_at?: string
          working_hours?: Json | null
        }
        Update: {
          address?: string | null
          approval_status?: string | null
          cover_image?: string | null
          created_at?: string
          created_by_uno_team?: boolean | null
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
          rejection_reason?: string | null
          review_count?: number | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          uno_team_creator_id?: string | null
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
      geographic_metrics: {
        Row: {
          avg_order_value: number | null
          bookings_count: number | null
          created_at: string | null
          date: string
          gmv: number | null
          id: string
          lat: number | null
          lng: number | null
          location_name: string
          providers_count: number | null
          top_vertical: string | null
          users_count: number | null
        }
        Insert: {
          avg_order_value?: number | null
          bookings_count?: number | null
          created_at?: string | null
          date: string
          gmv?: number | null
          id?: string
          lat?: number | null
          lng?: number | null
          location_name: string
          providers_count?: number | null
          top_vertical?: string | null
          users_count?: number | null
        }
        Update: {
          avg_order_value?: number | null
          bookings_count?: number | null
          created_at?: string | null
          date?: string
          gmv?: number | null
          id?: string
          lat?: number | null
          lng?: number | null
          location_name?: string
          providers_count?: number | null
          top_vertical?: string | null
          users_count?: number | null
        }
        Relationships: []
      }
      guest_check_in_data: {
        Row: {
          arrival_flight: string | null
          arrival_time: string | null
          booking_id: string | null
          created_at: string | null
          email: string | null
          emergency_contact_name: string | null
          emergency_contact_phone: string | null
          full_name: string | null
          id: string
          needs_transfer: boolean | null
          passport_country: string | null
          passport_expiry: string | null
          passport_number: string | null
          passport_photo_url: string | null
          phone: string | null
          rules_accepted: boolean | null
          rules_accepted_at: string | null
          signature_url: string | null
          status: string | null
          submitted_at: string | null
          updated_at: string | null
          user_id: string | null
          verified_at: string | null
          verified_by: string | null
        }
        Insert: {
          arrival_flight?: string | null
          arrival_time?: string | null
          booking_id?: string | null
          created_at?: string | null
          email?: string | null
          emergency_contact_name?: string | null
          emergency_contact_phone?: string | null
          full_name?: string | null
          id?: string
          needs_transfer?: boolean | null
          passport_country?: string | null
          passport_expiry?: string | null
          passport_number?: string | null
          passport_photo_url?: string | null
          phone?: string | null
          rules_accepted?: boolean | null
          rules_accepted_at?: string | null
          signature_url?: string | null
          status?: string | null
          submitted_at?: string | null
          updated_at?: string | null
          user_id?: string | null
          verified_at?: string | null
          verified_by?: string | null
        }
        Update: {
          arrival_flight?: string | null
          arrival_time?: string | null
          booking_id?: string | null
          created_at?: string | null
          email?: string | null
          emergency_contact_name?: string | null
          emergency_contact_phone?: string | null
          full_name?: string | null
          id?: string
          needs_transfer?: boolean | null
          passport_country?: string | null
          passport_expiry?: string | null
          passport_number?: string | null
          passport_photo_url?: string | null
          phone?: string | null
          rules_accepted?: boolean | null
          rules_accepted_at?: string | null
          signature_url?: string | null
          status?: string | null
          submitted_at?: string | null
          updated_at?: string | null
          user_id?: string | null
          verified_at?: string | null
          verified_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "guest_check_in_data_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "property_bookings"
            referencedColumns: ["id"]
          },
        ]
      }
      gyms: {
        Row: {
          address: string | null
          amenities: string[] | null
          approval_status: string | null
          classes: string[] | null
          cover_image: string | null
          created_at: string | null
          created_by_uno_team: boolean | null
          currency: string | null
          description_en: string | null
          description_ru: string | null
          district: string | null
          email: string | null
          gym_type: string | null
          id: string
          images: string[] | null
          is_active: boolean | null
          is_featured: boolean | null
          is_verified: boolean | null
          lat: number | null
          lng: number | null
          name_en: string
          name_ru: string
          phone: string | null
          price_day_pass: number | null
          price_month_pass: number | null
          price_week_pass: number | null
          provider_id: string | null
          rating: number | null
          rejection_reason: string | null
          review_count: number | null
          reviewed_at: string | null
          reviewed_by: string | null
          uno_team_creator_id: string | null
          updated_at: string | null
          website: string | null
          working_hours: Json | null
        }
        Insert: {
          address?: string | null
          amenities?: string[] | null
          approval_status?: string | null
          classes?: string[] | null
          cover_image?: string | null
          created_at?: string | null
          created_by_uno_team?: boolean | null
          currency?: string | null
          description_en?: string | null
          description_ru?: string | null
          district?: string | null
          email?: string | null
          gym_type?: string | null
          id?: string
          images?: string[] | null
          is_active?: boolean | null
          is_featured?: boolean | null
          is_verified?: boolean | null
          lat?: number | null
          lng?: number | null
          name_en: string
          name_ru: string
          phone?: string | null
          price_day_pass?: number | null
          price_month_pass?: number | null
          price_week_pass?: number | null
          provider_id?: string | null
          rating?: number | null
          rejection_reason?: string | null
          review_count?: number | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          uno_team_creator_id?: string | null
          updated_at?: string | null
          website?: string | null
          working_hours?: Json | null
        }
        Update: {
          address?: string | null
          amenities?: string[] | null
          approval_status?: string | null
          classes?: string[] | null
          cover_image?: string | null
          created_at?: string | null
          created_by_uno_team?: boolean | null
          currency?: string | null
          description_en?: string | null
          description_ru?: string | null
          district?: string | null
          email?: string | null
          gym_type?: string | null
          id?: string
          images?: string[] | null
          is_active?: boolean | null
          is_featured?: boolean | null
          is_verified?: boolean | null
          lat?: number | null
          lng?: number | null
          name_en?: string
          name_ru?: string
          phone?: string | null
          price_day_pass?: number | null
          price_month_pass?: number | null
          price_week_pass?: number | null
          provider_id?: string | null
          rating?: number | null
          rejection_reason?: string | null
          review_count?: number | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          uno_team_creator_id?: string | null
          updated_at?: string | null
          website?: string | null
          working_hours?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "gyms_provider_id_fkey"
            columns: ["provider_id"]
            isOneToOne: false
            referencedRelation: "providers"
            referencedColumns: ["id"]
          },
        ]
      }
      insurance_plans: {
        Row: {
          coverage_amount: number | null
          created_at: string | null
          currency: string | null
          deductible: number | null
          description_en: string | null
          description_ru: string | null
          exclusions: Json | null
          features: Json | null
          id: string
          insurance_type: string
          is_active: boolean | null
          is_popular: boolean | null
          max_age: number | null
          min_age: number | null
          name_en: string
          name_ru: string
          plan_tier: string | null
          price_monthly: number | null
          price_yearly: number | null
          provider_id: string
          requires_medical_exam: boolean | null
          updated_at: string | null
        }
        Insert: {
          coverage_amount?: number | null
          created_at?: string | null
          currency?: string | null
          deductible?: number | null
          description_en?: string | null
          description_ru?: string | null
          exclusions?: Json | null
          features?: Json | null
          id?: string
          insurance_type: string
          is_active?: boolean | null
          is_popular?: boolean | null
          max_age?: number | null
          min_age?: number | null
          name_en: string
          name_ru: string
          plan_tier?: string | null
          price_monthly?: number | null
          price_yearly?: number | null
          provider_id: string
          requires_medical_exam?: boolean | null
          updated_at?: string | null
        }
        Update: {
          coverage_amount?: number | null
          created_at?: string | null
          currency?: string | null
          deductible?: number | null
          description_en?: string | null
          description_ru?: string | null
          exclusions?: Json | null
          features?: Json | null
          id?: string
          insurance_type?: string
          is_active?: boolean | null
          is_popular?: boolean | null
          max_age?: number | null
          min_age?: number | null
          name_en?: string
          name_ru?: string
          plan_tier?: string | null
          price_monthly?: number | null
          price_yearly?: number | null
          provider_id?: string
          requires_medical_exam?: boolean | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "insurance_plans_provider_id_fkey"
            columns: ["provider_id"]
            isOneToOne: false
            referencedRelation: "insurance_providers"
            referencedColumns: ["id"]
          },
        ]
      }
      insurance_providers: {
        Row: {
          address: string | null
          approval_status: string | null
          cover_image: string | null
          created_at: string | null
          created_by_uno_team: boolean | null
          currency: string | null
          description_en: string | null
          description_ru: string | null
          district: string | null
          email: string | null
          has_24h_support: boolean | null
          has_online_claims: boolean | null
          id: string
          images: string[] | null
          insurance_types: string[] | null
          is_active: boolean | null
          is_featured: boolean | null
          is_verified: boolean | null
          languages: string[] | null
          lat: number | null
          license_number: string | null
          lng: number | null
          max_coverage_amount: number | null
          min_coverage_amount: number | null
          name_en: string
          name_ru: string
          phone: string | null
          provider_id: string | null
          rating: number | null
          rejection_reason: string | null
          review_count: number | null
          reviewed_at: string | null
          reviewed_by: string | null
          uno_team_creator_id: string | null
          updated_at: string | null
          website: string | null
          working_hours: Json | null
        }
        Insert: {
          address?: string | null
          approval_status?: string | null
          cover_image?: string | null
          created_at?: string | null
          created_by_uno_team?: boolean | null
          currency?: string | null
          description_en?: string | null
          description_ru?: string | null
          district?: string | null
          email?: string | null
          has_24h_support?: boolean | null
          has_online_claims?: boolean | null
          id?: string
          images?: string[] | null
          insurance_types?: string[] | null
          is_active?: boolean | null
          is_featured?: boolean | null
          is_verified?: boolean | null
          languages?: string[] | null
          lat?: number | null
          license_number?: string | null
          lng?: number | null
          max_coverage_amount?: number | null
          min_coverage_amount?: number | null
          name_en: string
          name_ru: string
          phone?: string | null
          provider_id?: string | null
          rating?: number | null
          rejection_reason?: string | null
          review_count?: number | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          uno_team_creator_id?: string | null
          updated_at?: string | null
          website?: string | null
          working_hours?: Json | null
        }
        Update: {
          address?: string | null
          approval_status?: string | null
          cover_image?: string | null
          created_at?: string | null
          created_by_uno_team?: boolean | null
          currency?: string | null
          description_en?: string | null
          description_ru?: string | null
          district?: string | null
          email?: string | null
          has_24h_support?: boolean | null
          has_online_claims?: boolean | null
          id?: string
          images?: string[] | null
          insurance_types?: string[] | null
          is_active?: boolean | null
          is_featured?: boolean | null
          is_verified?: boolean | null
          languages?: string[] | null
          lat?: number | null
          license_number?: string | null
          lng?: number | null
          max_coverage_amount?: number | null
          min_coverage_amount?: number | null
          name_en?: string
          name_ru?: string
          phone?: string | null
          provider_id?: string | null
          rating?: number | null
          rejection_reason?: string | null
          review_count?: number | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          uno_team_creator_id?: string | null
          updated_at?: string | null
          website?: string | null
          working_hours?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "insurance_providers_provider_id_fkey"
            columns: ["provider_id"]
            isOneToOne: false
            referencedRelation: "providers"
            referencedColumns: ["id"]
          },
        ]
      }
      lead_activity_log: {
        Row: {
          activity_type: string
          call_duration_seconds: number | null
          call_result: string | null
          created_at: string
          id: string
          lead_id: string
          notes: string | null
          status_from: string | null
          status_to: string | null
          user_id: string | null
        }
        Insert: {
          activity_type: string
          call_duration_seconds?: number | null
          call_result?: string | null
          created_at?: string
          id?: string
          lead_id: string
          notes?: string | null
          status_from?: string | null
          status_to?: string | null
          user_id?: string | null
        }
        Update: {
          activity_type?: string
          call_duration_seconds?: number | null
          call_result?: string | null
          created_at?: string
          id?: string
          lead_id?: string
          notes?: string | null
          status_from?: string | null
          status_to?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "lead_activity_log_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "consultation_requests"
            referencedColumns: ["id"]
          },
        ]
      }
      ledger_accounts: {
        Row: {
          account_type: string
          balance: number | null
          created_at: string | null
          currency: string | null
          id: string
          is_active: boolean | null
          owner_org_id: string | null
          owner_user_id: string | null
          updated_at: string | null
        }
        Insert: {
          account_type: string
          balance?: number | null
          created_at?: string | null
          currency?: string | null
          id?: string
          is_active?: boolean | null
          owner_org_id?: string | null
          owner_user_id?: string | null
          updated_at?: string | null
        }
        Update: {
          account_type?: string
          balance?: number | null
          created_at?: string | null
          currency?: string | null
          id?: string
          is_active?: boolean | null
          owner_org_id?: string | null
          owner_user_id?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ledger_accounts_owner_org_id_fkey"
            columns: ["owner_org_id"]
            isOneToOne: false
            referencedRelation: "orgs"
            referencedColumns: ["id"]
          },
        ]
      }
      ledger_entries: {
        Row: {
          amount: number
          created_at: string | null
          credit_account_id: string
          currency: string | null
          debit_account_id: string
          description: string | null
          entry_type: string
          id: string
          order_id: string | null
          payment_intent_id: string | null
        }
        Insert: {
          amount: number
          created_at?: string | null
          credit_account_id: string
          currency?: string | null
          debit_account_id: string
          description?: string | null
          entry_type: string
          id?: string
          order_id?: string | null
          payment_intent_id?: string | null
        }
        Update: {
          amount?: number
          created_at?: string | null
          credit_account_id?: string
          currency?: string | null
          debit_account_id?: string
          description?: string | null
          entry_type?: string
          id?: string
          order_id?: string | null
          payment_intent_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ledger_entries_credit_account_id_fkey"
            columns: ["credit_account_id"]
            isOneToOne: false
            referencedRelation: "ledger_accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ledger_entries_debit_account_id_fkey"
            columns: ["debit_account_id"]
            isOneToOne: false
            referencedRelation: "ledger_accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ledger_entries_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ledger_entries_payment_intent_id_fkey"
            columns: ["payment_intent_id"]
            isOneToOne: false
            referencedRelation: "payment_intents"
            referencedColumns: ["id"]
          },
        ]
      }
      legal_services: {
        Row: {
          address: string | null
          approval_status: string | null
          cover_image: string | null
          created_at: string | null
          currency: string | null
          description_en: string | null
          description_ru: string | null
          district: string | null
          email: string | null
          id: string
          images: string[] | null
          is_active: boolean | null
          is_featured: boolean | null
          is_verified: boolean | null
          languages: string[] | null
          lat: number | null
          lng: number | null
          name_en: string
          name_ru: string
          phone: string | null
          price_consultation: number | null
          provider_id: string | null
          rating: number | null
          rejection_reason: string | null
          review_count: number | null
          reviewed_at: string | null
          reviewed_by: string | null
          service_type: string | null
          specializations: string[] | null
          updated_at: string | null
          website: string | null
          working_hours: Json | null
        }
        Insert: {
          address?: string | null
          approval_status?: string | null
          cover_image?: string | null
          created_at?: string | null
          currency?: string | null
          description_en?: string | null
          description_ru?: string | null
          district?: string | null
          email?: string | null
          id?: string
          images?: string[] | null
          is_active?: boolean | null
          is_featured?: boolean | null
          is_verified?: boolean | null
          languages?: string[] | null
          lat?: number | null
          lng?: number | null
          name_en: string
          name_ru: string
          phone?: string | null
          price_consultation?: number | null
          provider_id?: string | null
          rating?: number | null
          rejection_reason?: string | null
          review_count?: number | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          service_type?: string | null
          specializations?: string[] | null
          updated_at?: string | null
          website?: string | null
          working_hours?: Json | null
        }
        Update: {
          address?: string | null
          approval_status?: string | null
          cover_image?: string | null
          created_at?: string | null
          currency?: string | null
          description_en?: string | null
          description_ru?: string | null
          district?: string | null
          email?: string | null
          id?: string
          images?: string[] | null
          is_active?: boolean | null
          is_featured?: boolean | null
          is_verified?: boolean | null
          languages?: string[] | null
          lat?: number | null
          lng?: number | null
          name_en?: string
          name_ru?: string
          phone?: string | null
          price_consultation?: number | null
          provider_id?: string | null
          rating?: number | null
          rejection_reason?: string | null
          review_count?: number | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          service_type?: string | null
          specializations?: string[] | null
          updated_at?: string | null
          website?: string | null
          working_hours?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "legal_services_provider_id_fkey"
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
      lookup_values: {
        Row: {
          color: string | null
          created_at: string
          icon: string | null
          id: string
          is_active: boolean | null
          lookup_type: string
          metadata: Json | null
          parent_id: string | null
          sort_order: number | null
          updated_at: string
          value_en: string
          value_key: string
          value_ru: string | null
        }
        Insert: {
          color?: string | null
          created_at?: string
          icon?: string | null
          id?: string
          is_active?: boolean | null
          lookup_type: string
          metadata?: Json | null
          parent_id?: string | null
          sort_order?: number | null
          updated_at?: string
          value_en: string
          value_key: string
          value_ru?: string | null
        }
        Update: {
          color?: string | null
          created_at?: string
          icon?: string | null
          id?: string
          is_active?: boolean | null
          lookup_type?: string
          metadata?: Json | null
          parent_id?: string | null
          sort_order?: number | null
          updated_at?: string
          value_en?: string
          value_key?: string
          value_ru?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "lookup_values_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "lookup_values"
            referencedColumns: ["id"]
          },
        ]
      }
      marketplace_categories: {
        Row: {
          created_at: string | null
          description_en: string | null
          description_ru: string | null
          gradient: string | null
          icon: string | null
          id: string
          image_url: string | null
          is_active: boolean | null
          name_en: string
          name_ru: string
          slug: string
          sort_order: number | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          description_en?: string | null
          description_ru?: string | null
          gradient?: string | null
          icon?: string | null
          id?: string
          image_url?: string | null
          is_active?: boolean | null
          name_en: string
          name_ru: string
          slug: string
          sort_order?: number | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          description_en?: string | null
          description_ru?: string | null
          gradient?: string | null
          icon?: string | null
          id?: string
          image_url?: string | null
          is_active?: boolean | null
          name_en?: string
          name_ru?: string
          slug?: string
          sort_order?: number | null
          updated_at?: string | null
        }
        Relationships: []
      }
      marketplace_delivery_settings: {
        Row: {
          base_fee: number
          created_at: string | null
          estimated_time_minutes: number | null
          free_delivery_threshold: number | null
          id: string
          is_active: boolean | null
          is_default: boolean | null
          min_order_amount: number | null
          updated_at: string | null
          zone_name_en: string
          zone_name_ru: string
        }
        Insert: {
          base_fee?: number
          created_at?: string | null
          estimated_time_minutes?: number | null
          free_delivery_threshold?: number | null
          id?: string
          is_active?: boolean | null
          is_default?: boolean | null
          min_order_amount?: number | null
          updated_at?: string | null
          zone_name_en: string
          zone_name_ru: string
        }
        Update: {
          base_fee?: number
          created_at?: string | null
          estimated_time_minutes?: number | null
          free_delivery_threshold?: number | null
          id?: string
          is_active?: boolean | null
          is_default?: boolean | null
          min_order_amount?: number | null
          updated_at?: string | null
          zone_name_en?: string
          zone_name_ru?: string
        }
        Relationships: []
      }
      marketplace_products: {
        Row: {
          category_slug: string
          cover_image: string | null
          created_at: string | null
          currency: string | null
          description_en: string | null
          description_ru: string | null
          id: string
          images: string[] | null
          in_stock: boolean | null
          is_active: boolean | null
          is_new: boolean | null
          is_popular: boolean | null
          name_en: string
          name_ru: string
          original_price: number | null
          price: number
          rating: number | null
          review_count: number | null
          sort_order: number | null
          subcategory: string | null
          tags: string[] | null
          unit: string | null
          unit_ru: string | null
          updated_at: string | null
          vendor_name: string | null
          vendor_name_ru: string | null
        }
        Insert: {
          category_slug: string
          cover_image?: string | null
          created_at?: string | null
          currency?: string | null
          description_en?: string | null
          description_ru?: string | null
          id?: string
          images?: string[] | null
          in_stock?: boolean | null
          is_active?: boolean | null
          is_new?: boolean | null
          is_popular?: boolean | null
          name_en: string
          name_ru: string
          original_price?: number | null
          price: number
          rating?: number | null
          review_count?: number | null
          sort_order?: number | null
          subcategory?: string | null
          tags?: string[] | null
          unit?: string | null
          unit_ru?: string | null
          updated_at?: string | null
          vendor_name?: string | null
          vendor_name_ru?: string | null
        }
        Update: {
          category_slug?: string
          cover_image?: string | null
          created_at?: string | null
          currency?: string | null
          description_en?: string | null
          description_ru?: string | null
          id?: string
          images?: string[] | null
          in_stock?: boolean | null
          is_active?: boolean | null
          is_new?: boolean | null
          is_popular?: boolean | null
          name_en?: string
          name_ru?: string
          original_price?: number | null
          price?: number
          rating?: number | null
          review_count?: number | null
          sort_order?: number | null
          subcategory?: string | null
          tags?: string[] | null
          unit?: string | null
          unit_ru?: string | null
          updated_at?: string | null
          vendor_name?: string | null
          vendor_name_ru?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "marketplace_products_category_slug_fkey"
            columns: ["category_slug"]
            isOneToOne: false
            referencedRelation: "marketplace_categories"
            referencedColumns: ["slug"]
          },
        ]
      }
      marketplace_subcategories: {
        Row: {
          category_slug: string
          created_at: string | null
          icon: string | null
          id: string
          is_active: boolean | null
          name_en: string
          name_ru: string
          slug: string
          sort_order: number | null
        }
        Insert: {
          category_slug: string
          created_at?: string | null
          icon?: string | null
          id?: string
          is_active?: boolean | null
          name_en: string
          name_ru: string
          slug: string
          sort_order?: number | null
        }
        Update: {
          category_slug?: string
          created_at?: string | null
          icon?: string | null
          id?: string
          is_active?: boolean | null
          name_en?: string
          name_ru?: string
          slug?: string
          sort_order?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "marketplace_subcategories_category_slug_fkey"
            columns: ["category_slug"]
            isOneToOne: false
            referencedRelation: "marketplace_categories"
            referencedColumns: ["slug"]
          },
        ]
      }
      medical_services: {
        Row: {
          category: string
          clinic_id: string
          created_at: string
          currency: string | null
          description_en: string | null
          description_ru: string | null
          duration_minutes: number | null
          id: string
          is_active: boolean | null
          name_en: string
          name_ru: string
          price: number
          specialty: string | null
        }
        Insert: {
          category: string
          clinic_id: string
          created_at?: string
          currency?: string | null
          description_en?: string | null
          description_ru?: string | null
          duration_minutes?: number | null
          id?: string
          is_active?: boolean | null
          name_en: string
          name_ru: string
          price: number
          specialty?: string | null
        }
        Update: {
          category?: string
          clinic_id?: string
          created_at?: string
          currency?: string | null
          description_en?: string | null
          description_ru?: string | null
          duration_minutes?: number | null
          id?: string
          is_active?: boolean | null
          name_en?: string
          name_ru?: string
          price?: number
          specialty?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "medical_services_clinic_id_fkey"
            columns: ["clinic_id"]
            isOneToOne: false
            referencedRelation: "clinics"
            referencedColumns: ["id"]
          },
        ]
      }
      message_templates: {
        Row: {
          body: string
          body_ru: string | null
          category: string
          created_at: string | null
          id: string
          is_active: boolean | null
          is_default: boolean | null
          name: string
          owner_id: string
          subject: string | null
          subject_ru: string | null
          updated_at: string | null
        }
        Insert: {
          body: string
          body_ru?: string | null
          category: string
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          is_default?: boolean | null
          name: string
          owner_id: string
          subject?: string | null
          subject_ru?: string | null
          updated_at?: string | null
        }
        Update: {
          body?: string
          body_ru?: string | null
          category?: string
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          is_default?: boolean | null
          name?: string
          owner_id?: string
          subject?: string | null
          subject_ru?: string | null
          updated_at?: string | null
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
      order_addresses: {
        Row: {
          address_text: string
          address_type: string
          created_at: string | null
          id: string
          lat: number | null
          lng: number | null
          notes: string | null
          order_id: string
        }
        Insert: {
          address_text: string
          address_type: string
          created_at?: string | null
          id?: string
          lat?: number | null
          lng?: number | null
          notes?: string | null
          order_id: string
        }
        Update: {
          address_text?: string
          address_type?: string
          created_at?: string | null
          id?: string
          lat?: number | null
          lng?: number | null
          notes?: string | null
          order_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "order_addresses_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
        ]
      }
      order_item_property_details: {
        Row: {
          check_in_date: string | null
          check_out_date: string | null
          created_at: string | null
          guests_count: number | null
          id: string
          order_item_id: string
          rooms_count: number | null
          special_requests: string | null
        }
        Insert: {
          check_in_date?: string | null
          check_out_date?: string | null
          created_at?: string | null
          guests_count?: number | null
          id?: string
          order_item_id: string
          rooms_count?: number | null
          special_requests?: string | null
        }
        Update: {
          check_in_date?: string | null
          check_out_date?: string | null
          created_at?: string | null
          guests_count?: number | null
          id?: string
          order_item_id?: string
          rooms_count?: number | null
          special_requests?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "order_item_property_details_order_item_id_fkey"
            columns: ["order_item_id"]
            isOneToOne: true
            referencedRelation: "order_items"
            referencedColumns: ["id"]
          },
        ]
      }
      order_item_transport_details: {
        Row: {
          created_at: string | null
          flight_number: string | null
          id: string
          is_round_trip: boolean | null
          luggage_count: number | null
          order_item_id: string
          passenger_count: number | null
          pickup_time: string | null
          vehicle_type: string | null
        }
        Insert: {
          created_at?: string | null
          flight_number?: string | null
          id?: string
          is_round_trip?: boolean | null
          luggage_count?: number | null
          order_item_id: string
          passenger_count?: number | null
          pickup_time?: string | null
          vehicle_type?: string | null
        }
        Update: {
          created_at?: string | null
          flight_number?: string | null
          id?: string
          is_round_trip?: boolean | null
          luggage_count?: number | null
          order_item_id?: string
          passenger_count?: number | null
          pickup_time?: string | null
          vehicle_type?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "order_item_transport_details_order_item_id_fkey"
            columns: ["order_item_id"]
            isOneToOne: true
            referencedRelation: "order_items"
            referencedColumns: ["id"]
          },
        ]
      }
      order_item_yacht_details: {
        Row: {
          catering_included: boolean | null
          charter_type: string | null
          created_at: string | null
          crew_included: boolean | null
          guests_count: number | null
          id: string
          order_item_id: string
        }
        Insert: {
          catering_included?: boolean | null
          charter_type?: string | null
          created_at?: string | null
          crew_included?: boolean | null
          guests_count?: number | null
          id?: string
          order_item_id: string
        }
        Update: {
          catering_included?: boolean | null
          charter_type?: string | null
          created_at?: string | null
          crew_included?: boolean | null
          guests_count?: number | null
          id?: string
          order_item_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "order_item_yacht_details_order_item_id_fkey"
            columns: ["order_item_id"]
            isOneToOne: true
            referencedRelation: "order_items"
            referencedColumns: ["id"]
          },
        ]
      }
      order_items: {
        Row: {
          amount: number
          created_at: string | null
          end_at: string | null
          id: string
          item_name: string
          item_type: string
          metadata: Json | null
          order_id: string
          product_id: string | null
          provider_org_id: string | null
          qty: number | null
          resource_id: string | null
          start_at: string | null
          status: Database["public"]["Enums"]["order_item_status"] | null
          unit_price: number
        }
        Insert: {
          amount: number
          created_at?: string | null
          end_at?: string | null
          id?: string
          item_name: string
          item_type: string
          metadata?: Json | null
          order_id: string
          product_id?: string | null
          provider_org_id?: string | null
          qty?: number | null
          resource_id?: string | null
          start_at?: string | null
          status?: Database["public"]["Enums"]["order_item_status"] | null
          unit_price: number
        }
        Update: {
          amount?: number
          created_at?: string | null
          end_at?: string | null
          id?: string
          item_name?: string
          item_type?: string
          metadata?: Json | null
          order_id?: string
          product_id?: string | null
          provider_org_id?: string | null
          qty?: number | null
          resource_id?: string | null
          start_at?: string | null
          status?: Database["public"]["Enums"]["order_item_status"] | null
          unit_price?: number
        }
        Relationships: [
          {
            foreignKeyName: "order_items_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "order_items_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "order_items_provider_org_id_fkey"
            columns: ["provider_org_id"]
            isOneToOne: false
            referencedRelation: "orgs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "order_items_resource_id_fkey"
            columns: ["resource_id"]
            isOneToOne: false
            referencedRelation: "resources"
            referencedColumns: ["id"]
          },
        ]
      }
      order_participants: {
        Row: {
          created_at: string | null
          email: string | null
          id: string
          metadata: Json | null
          name: string
          order_id: string
          phone: string | null
          role: string
        }
        Insert: {
          created_at?: string | null
          email?: string | null
          id?: string
          metadata?: Json | null
          name: string
          order_id: string
          phone?: string | null
          role: string
        }
        Update: {
          created_at?: string | null
          email?: string | null
          id?: string
          metadata?: Json | null
          name?: string
          order_id?: string
          phone?: string | null
          role?: string
        }
        Relationships: [
          {
            foreignKeyName: "order_participants_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
        ]
      }
      order_status_history: {
        Row: {
          actor_user_id: string | null
          created_at: string | null
          from_status: Database["public"]["Enums"]["order_status"] | null
          id: string
          order_id: string
          reason: string | null
          to_status: Database["public"]["Enums"]["order_status"]
        }
        Insert: {
          actor_user_id?: string | null
          created_at?: string | null
          from_status?: Database["public"]["Enums"]["order_status"] | null
          id?: string
          order_id: string
          reason?: string | null
          to_status: Database["public"]["Enums"]["order_status"]
        }
        Update: {
          actor_user_id?: string | null
          created_at?: string | null
          from_status?: Database["public"]["Enums"]["order_status"] | null
          id?: string
          order_id?: string
          reason?: string | null
          to_status?: Database["public"]["Enums"]["order_status"]
        }
        Relationships: [
          {
            foreignKeyName: "order_status_history_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
        ]
      }
      orders: {
        Row: {
          commission_rate_applied: number | null
          created_at: string | null
          currency: string | null
          customer_user_id: string
          discount_amount: number | null
          end_at: string | null
          id: string
          metadata: Json | null
          notes: string | null
          order_number: string | null
          order_type: string
          platform_fee_amount: number | null
          provider_org_id: string | null
          start_at: string | null
          status: Database["public"]["Enums"]["order_status"] | null
          subtotal: number | null
          tax_amount: number | null
          total_amount: number
          updated_at: string | null
          vendor_payout_amount: number | null
          vertical: string | null
        }
        Insert: {
          commission_rate_applied?: number | null
          created_at?: string | null
          currency?: string | null
          customer_user_id: string
          discount_amount?: number | null
          end_at?: string | null
          id?: string
          metadata?: Json | null
          notes?: string | null
          order_number?: string | null
          order_type: string
          platform_fee_amount?: number | null
          provider_org_id?: string | null
          start_at?: string | null
          status?: Database["public"]["Enums"]["order_status"] | null
          subtotal?: number | null
          tax_amount?: number | null
          total_amount: number
          updated_at?: string | null
          vendor_payout_amount?: number | null
          vertical?: string | null
        }
        Update: {
          commission_rate_applied?: number | null
          created_at?: string | null
          currency?: string | null
          customer_user_id?: string
          discount_amount?: number | null
          end_at?: string | null
          id?: string
          metadata?: Json | null
          notes?: string | null
          order_number?: string | null
          order_type?: string
          platform_fee_amount?: number | null
          provider_org_id?: string | null
          start_at?: string | null
          status?: Database["public"]["Enums"]["order_status"] | null
          subtotal?: number | null
          tax_amount?: number | null
          total_amount?: number
          updated_at?: string | null
          vendor_payout_amount?: number | null
          vertical?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "orders_provider_org_id_fkey"
            columns: ["provider_org_id"]
            isOneToOne: false
            referencedRelation: "orgs"
            referencedColumns: ["id"]
          },
        ]
      }
      org_members: {
        Row: {
          created_at: string | null
          id: string
          is_active: boolean | null
          org_id: string
          role: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          org_id: string
          role: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          org_id?: string
          role?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "org_members_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "orgs"
            referencedColumns: ["id"]
          },
        ]
      }
      orgs: {
        Row: {
          address: string | null
          created_at: string | null
          email: string | null
          id: string
          is_active: boolean | null
          is_verified: boolean | null
          logo_url: string | null
          metadata: Json | null
          name: string
          name_ru: string | null
          org_type: string
          phone: string | null
          updated_at: string | null
        }
        Insert: {
          address?: string | null
          created_at?: string | null
          email?: string | null
          id?: string
          is_active?: boolean | null
          is_verified?: boolean | null
          logo_url?: string | null
          metadata?: Json | null
          name: string
          name_ru?: string | null
          org_type: string
          phone?: string | null
          updated_at?: string | null
        }
        Update: {
          address?: string | null
          created_at?: string | null
          email?: string | null
          id?: string
          is_active?: boolean | null
          is_verified?: boolean | null
          logo_url?: string | null
          metadata?: Json | null
          name?: string
          name_ru?: string | null
          org_type?: string
          phone?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      owner_properties: {
        Row: {
          accessibility_features: string[] | null
          actual_owner_email: string | null
          actual_owner_name: string | null
          actual_owner_phone: string | null
          address: string
          area_sqm: number | null
          bathrooms: number | null
          bedrooms: number | null
          cancellation_policy: string | null
          check_in_instructions: string | null
          check_in_instructions_ru: string | null
          check_in_time: string | null
          check_out_time: string | null
          children_friendly: boolean | null
          cleaning_frequency: string | null
          cleaning_included: boolean | null
          cover_image: string | null
          created_at: string
          created_on_behalf: boolean | null
          deposit_amount: number | null
          deposit_currency: string | null
          deposit_type: string | null
          description: string | null
          description_ru: string | null
          district: string | null
          early_checkin_price: number | null
          electricity_included: boolean | null
          electricity_metering: string | null
          electricity_notes: string | null
          electricity_notes_ru: string | null
          electricity_provider: string | null
          electricity_unit_price: number | null
          emergency_contact_name: string | null
          emergency_contact_phone: string | null
          equipment: string[] | null
          extra_cleaning_price: number | null
          extra_guest_price: number | null
          extra_guest_threshold: number | null
          extra_services: Json | null
          floor: number | null
          furnishing_level: string | null
          has_crib: boolean | null
          has_high_chair: boolean | null
          highlights: string[] | null
          host_languages: string[] | null
          house_rules: string | null
          house_rules_ru: string | null
          ical_token: string | null
          id: string
          images: string[] | null
          included_services: Json | null
          instant_booking: boolean | null
          internet_provider: string | null
          internet_speed: string | null
          is_rented: boolean | null
          key_handover: string | null
          lat: number | null
          late_checkout_penalty: number | null
          late_checkout_price: number | null
          linen_change_frequency: string | null
          linen_change_price: number | null
          lng: number | null
          managed_by: string | null
          managed_by_org_id: string | null
          management_type: string | null
          manager_line_id: string | null
          manager_name: string | null
          manager_phone: string | null
          marketplace_property_id: string | null
          max_guests: number | null
          max_party_guests: number | null
          min_stay_nights: number | null
          monthly_discount: number | null
          nearby_places: Json | null
          notes: string | null
          owner_id: string
          ownership_transferred_at: string | null
          ownership_type: string | null
          parking_included: boolean | null
          parking_notes: string | null
          parking_spaces: number | null
          parties_allowed: boolean | null
          pet_deposit: number | null
          pet_notes: string | null
          pet_notes_ru: string | null
          pets_allowed: boolean | null
          price_per_night: number | null
          project_id: string | null
          property_type: string
          quiet_hours_end: string | null
          quiet_hours_start: string | null
          rental_platform: string | null
          rooms: Json | null
          safety_features: string[] | null
          seasonal_pricing: Json | null
          smoking_penalty: number | null
          status: string | null
          title: string
          title_ru: string | null
          transfer_airport_price: number | null
          transfer_available: boolean | null
          transfer_notes: string | null
          transfer_notes_ru: string | null
          unit_number: string | null
          updated_at: string
          verified_at: string | null
          verified_by: string | null
          view_type: string | null
          water_included: boolean | null
          water_notes: string | null
          water_notes_ru: string | null
          water_unit_price: number | null
          weekly_discount: number | null
        }
        Insert: {
          accessibility_features?: string[] | null
          actual_owner_email?: string | null
          actual_owner_name?: string | null
          actual_owner_phone?: string | null
          address: string
          area_sqm?: number | null
          bathrooms?: number | null
          bedrooms?: number | null
          cancellation_policy?: string | null
          check_in_instructions?: string | null
          check_in_instructions_ru?: string | null
          check_in_time?: string | null
          check_out_time?: string | null
          children_friendly?: boolean | null
          cleaning_frequency?: string | null
          cleaning_included?: boolean | null
          cover_image?: string | null
          created_at?: string
          created_on_behalf?: boolean | null
          deposit_amount?: number | null
          deposit_currency?: string | null
          deposit_type?: string | null
          description?: string | null
          description_ru?: string | null
          district?: string | null
          early_checkin_price?: number | null
          electricity_included?: boolean | null
          electricity_metering?: string | null
          electricity_notes?: string | null
          electricity_notes_ru?: string | null
          electricity_provider?: string | null
          electricity_unit_price?: number | null
          emergency_contact_name?: string | null
          emergency_contact_phone?: string | null
          equipment?: string[] | null
          extra_cleaning_price?: number | null
          extra_guest_price?: number | null
          extra_guest_threshold?: number | null
          extra_services?: Json | null
          floor?: number | null
          furnishing_level?: string | null
          has_crib?: boolean | null
          has_high_chair?: boolean | null
          highlights?: string[] | null
          host_languages?: string[] | null
          house_rules?: string | null
          house_rules_ru?: string | null
          ical_token?: string | null
          id?: string
          images?: string[] | null
          included_services?: Json | null
          instant_booking?: boolean | null
          internet_provider?: string | null
          internet_speed?: string | null
          is_rented?: boolean | null
          key_handover?: string | null
          lat?: number | null
          late_checkout_penalty?: number | null
          late_checkout_price?: number | null
          linen_change_frequency?: string | null
          linen_change_price?: number | null
          lng?: number | null
          managed_by?: string | null
          managed_by_org_id?: string | null
          management_type?: string | null
          manager_line_id?: string | null
          manager_name?: string | null
          manager_phone?: string | null
          marketplace_property_id?: string | null
          max_guests?: number | null
          max_party_guests?: number | null
          min_stay_nights?: number | null
          monthly_discount?: number | null
          nearby_places?: Json | null
          notes?: string | null
          owner_id: string
          ownership_transferred_at?: string | null
          ownership_type?: string | null
          parking_included?: boolean | null
          parking_notes?: string | null
          parking_spaces?: number | null
          parties_allowed?: boolean | null
          pet_deposit?: number | null
          pet_notes?: string | null
          pet_notes_ru?: string | null
          pets_allowed?: boolean | null
          price_per_night?: number | null
          project_id?: string | null
          property_type?: string
          quiet_hours_end?: string | null
          quiet_hours_start?: string | null
          rental_platform?: string | null
          rooms?: Json | null
          safety_features?: string[] | null
          seasonal_pricing?: Json | null
          smoking_penalty?: number | null
          status?: string | null
          title: string
          title_ru?: string | null
          transfer_airport_price?: number | null
          transfer_available?: boolean | null
          transfer_notes?: string | null
          transfer_notes_ru?: string | null
          unit_number?: string | null
          updated_at?: string
          verified_at?: string | null
          verified_by?: string | null
          view_type?: string | null
          water_included?: boolean | null
          water_notes?: string | null
          water_notes_ru?: string | null
          water_unit_price?: number | null
          weekly_discount?: number | null
        }
        Update: {
          accessibility_features?: string[] | null
          actual_owner_email?: string | null
          actual_owner_name?: string | null
          actual_owner_phone?: string | null
          address?: string
          area_sqm?: number | null
          bathrooms?: number | null
          bedrooms?: number | null
          cancellation_policy?: string | null
          check_in_instructions?: string | null
          check_in_instructions_ru?: string | null
          check_in_time?: string | null
          check_out_time?: string | null
          children_friendly?: boolean | null
          cleaning_frequency?: string | null
          cleaning_included?: boolean | null
          cover_image?: string | null
          created_at?: string
          created_on_behalf?: boolean | null
          deposit_amount?: number | null
          deposit_currency?: string | null
          deposit_type?: string | null
          description?: string | null
          description_ru?: string | null
          district?: string | null
          early_checkin_price?: number | null
          electricity_included?: boolean | null
          electricity_metering?: string | null
          electricity_notes?: string | null
          electricity_notes_ru?: string | null
          electricity_provider?: string | null
          electricity_unit_price?: number | null
          emergency_contact_name?: string | null
          emergency_contact_phone?: string | null
          equipment?: string[] | null
          extra_cleaning_price?: number | null
          extra_guest_price?: number | null
          extra_guest_threshold?: number | null
          extra_services?: Json | null
          floor?: number | null
          furnishing_level?: string | null
          has_crib?: boolean | null
          has_high_chair?: boolean | null
          highlights?: string[] | null
          host_languages?: string[] | null
          house_rules?: string | null
          house_rules_ru?: string | null
          ical_token?: string | null
          id?: string
          images?: string[] | null
          included_services?: Json | null
          instant_booking?: boolean | null
          internet_provider?: string | null
          internet_speed?: string | null
          is_rented?: boolean | null
          key_handover?: string | null
          lat?: number | null
          late_checkout_penalty?: number | null
          late_checkout_price?: number | null
          linen_change_frequency?: string | null
          linen_change_price?: number | null
          lng?: number | null
          managed_by?: string | null
          managed_by_org_id?: string | null
          management_type?: string | null
          manager_line_id?: string | null
          manager_name?: string | null
          manager_phone?: string | null
          marketplace_property_id?: string | null
          max_guests?: number | null
          max_party_guests?: number | null
          min_stay_nights?: number | null
          monthly_discount?: number | null
          nearby_places?: Json | null
          notes?: string | null
          owner_id?: string
          ownership_transferred_at?: string | null
          ownership_type?: string | null
          parking_included?: boolean | null
          parking_notes?: string | null
          parking_spaces?: number | null
          parties_allowed?: boolean | null
          pet_deposit?: number | null
          pet_notes?: string | null
          pet_notes_ru?: string | null
          pets_allowed?: boolean | null
          price_per_night?: number | null
          project_id?: string | null
          property_type?: string
          quiet_hours_end?: string | null
          quiet_hours_start?: string | null
          rental_platform?: string | null
          rooms?: Json | null
          safety_features?: string[] | null
          seasonal_pricing?: Json | null
          smoking_penalty?: number | null
          status?: string | null
          title?: string
          title_ru?: string | null
          transfer_airport_price?: number | null
          transfer_available?: boolean | null
          transfer_notes?: string | null
          transfer_notes_ru?: string | null
          unit_number?: string | null
          updated_at?: string
          verified_at?: string | null
          verified_by?: string | null
          view_type?: string | null
          water_included?: boolean | null
          water_notes?: string | null
          water_notes_ru?: string | null
          water_unit_price?: number | null
          weekly_discount?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_owner_properties_project"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "property_projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "owner_properties_managed_by_org_id_fkey"
            columns: ["managed_by_org_id"]
            isOneToOne: false
            referencedRelation: "orgs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "owner_properties_marketplace_property_id_fkey"
            columns: ["marketplace_property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
        ]
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
      payment_intents: {
        Row: {
          amount: number
          created_at: string | null
          currency: string | null
          id: string
          metadata: Json | null
          method: Database["public"]["Enums"]["payment_method"]
          order_id: string
          provider_ref: string | null
          provider_session_id: string | null
          status: Database["public"]["Enums"]["intent_status"] | null
          updated_at: string | null
        }
        Insert: {
          amount: number
          created_at?: string | null
          currency?: string | null
          id?: string
          metadata?: Json | null
          method: Database["public"]["Enums"]["payment_method"]
          order_id: string
          provider_ref?: string | null
          provider_session_id?: string | null
          status?: Database["public"]["Enums"]["intent_status"] | null
          updated_at?: string | null
        }
        Update: {
          amount?: number
          created_at?: string | null
          currency?: string | null
          id?: string
          metadata?: Json | null
          method?: Database["public"]["Enums"]["payment_method"]
          order_id?: string
          provider_ref?: string | null
          provider_session_id?: string | null
          status?: Database["public"]["Enums"]["intent_status"] | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "payment_intents_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
        ]
      }
      pet_services: {
        Row: {
          address: string | null
          approval_status: string | null
          cover_image: string | null
          created_at: string | null
          created_by_uno_team: boolean | null
          currency: string | null
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
          name_en: string
          name_ru: string
          pet_types: string[] | null
          phone: string | null
          price_from: number | null
          provider_id: string | null
          rating: number | null
          rejection_reason: string | null
          review_count: number | null
          reviewed_at: string | null
          reviewed_by: string | null
          service_type: string | null
          uno_team_creator_id: string | null
          updated_at: string | null
          working_hours: Json | null
        }
        Insert: {
          address?: string | null
          approval_status?: string | null
          cover_image?: string | null
          created_at?: string | null
          created_by_uno_team?: boolean | null
          currency?: string | null
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
          name_en: string
          name_ru: string
          pet_types?: string[] | null
          phone?: string | null
          price_from?: number | null
          provider_id?: string | null
          rating?: number | null
          rejection_reason?: string | null
          review_count?: number | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          service_type?: string | null
          uno_team_creator_id?: string | null
          updated_at?: string | null
          working_hours?: Json | null
        }
        Update: {
          address?: string | null
          approval_status?: string | null
          cover_image?: string | null
          created_at?: string | null
          created_by_uno_team?: boolean | null
          currency?: string | null
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
          name_en?: string
          name_ru?: string
          pet_types?: string[] | null
          phone?: string | null
          price_from?: number | null
          provider_id?: string | null
          rating?: number | null
          rejection_reason?: string | null
          review_count?: number | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          service_type?: string | null
          uno_team_creator_id?: string | null
          updated_at?: string | null
          working_hours?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "pet_services_provider_id_fkey"
            columns: ["provider_id"]
            isOneToOne: false
            referencedRelation: "providers"
            referencedColumns: ["id"]
          },
        ]
      }
      pharmacies: {
        Row: {
          address: string | null
          approval_status: string | null
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
          rejection_reason: string | null
          review_count: number | null
          reviewed_at: string | null
          reviewed_by: string | null
          updated_at: string
          website: string | null
          working_hours: Json | null
        }
        Insert: {
          address?: string | null
          approval_status?: string | null
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
          rejection_reason?: string | null
          review_count?: number | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          updated_at?: string
          website?: string | null
          working_hours?: Json | null
        }
        Update: {
          address?: string | null
          approval_status?: string | null
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
          rejection_reason?: string | null
          review_count?: number | null
          reviewed_at?: string | null
          reviewed_by?: string | null
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
      platform_fees: {
        Row: {
          applies_to: string[] | null
          created_at: string
          fee_type: string
          fee_value: number
          id: string
          is_active: boolean | null
          max_fee: number | null
          min_fee: number | null
          plan_id: string | null
        }
        Insert: {
          applies_to?: string[] | null
          created_at?: string
          fee_type: string
          fee_value?: number
          id?: string
          is_active?: boolean | null
          max_fee?: number | null
          min_fee?: number | null
          plan_id?: string | null
        }
        Update: {
          applies_to?: string[] | null
          created_at?: string
          fee_type?: string
          fee_value?: number
          id?: string
          is_active?: boolean | null
          max_fee?: number | null
          min_fee?: number | null
          plan_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "platform_fees_plan_id_fkey"
            columns: ["plan_id"]
            isOneToOne: false
            referencedRelation: "subscription_plans"
            referencedColumns: ["id"]
          },
        ]
      }
      platform_metrics: {
        Row: {
          active_providers: number | null
          active_users: number | null
          avg_order_value: number | null
          avg_session_duration_seconds: number | null
          avg_take_rate: number | null
          cac: number | null
          cancelled_bookings: number | null
          completed_bookings: number | null
          created_at: string
          cross_sell_rate: number | null
          d30_retention: number | null
          d7_retention: number | null
          date: string
          dau: number | null
          gmv: number | null
          gross_margin: number | null
          id: string
          ltv: number | null
          ltv_cac_ratio: number | null
          mau: number | null
          new_bookings: number | null
          new_providers: number | null
          new_users: number | null
          page_views: number | null
          platform_revenue: number | null
          property_adr: number | null
          property_gmv: number | null
          property_listings_count: number | null
          property_occupancy_rate: number | null
          repeat_purchase_rate: number | null
          session_count: number | null
          subscription_revenue: number | null
          total_bookings: number | null
          total_providers: number | null
          total_users: number | null
          tours_avg_rating: number | null
          tours_count: number | null
          tours_gmv: number | null
          unique_visitors: number | null
          updated_at: string
          yachts_count: number | null
          yachts_gmv: number | null
        }
        Insert: {
          active_providers?: number | null
          active_users?: number | null
          avg_order_value?: number | null
          avg_session_duration_seconds?: number | null
          avg_take_rate?: number | null
          cac?: number | null
          cancelled_bookings?: number | null
          completed_bookings?: number | null
          created_at?: string
          cross_sell_rate?: number | null
          d30_retention?: number | null
          d7_retention?: number | null
          date: string
          dau?: number | null
          gmv?: number | null
          gross_margin?: number | null
          id?: string
          ltv?: number | null
          ltv_cac_ratio?: number | null
          mau?: number | null
          new_bookings?: number | null
          new_providers?: number | null
          new_users?: number | null
          page_views?: number | null
          platform_revenue?: number | null
          property_adr?: number | null
          property_gmv?: number | null
          property_listings_count?: number | null
          property_occupancy_rate?: number | null
          repeat_purchase_rate?: number | null
          session_count?: number | null
          subscription_revenue?: number | null
          total_bookings?: number | null
          total_providers?: number | null
          total_users?: number | null
          tours_avg_rating?: number | null
          tours_count?: number | null
          tours_gmv?: number | null
          unique_visitors?: number | null
          updated_at?: string
          yachts_count?: number | null
          yachts_gmv?: number | null
        }
        Update: {
          active_providers?: number | null
          active_users?: number | null
          avg_order_value?: number | null
          avg_session_duration_seconds?: number | null
          avg_take_rate?: number | null
          cac?: number | null
          cancelled_bookings?: number | null
          completed_bookings?: number | null
          created_at?: string
          cross_sell_rate?: number | null
          d30_retention?: number | null
          d7_retention?: number | null
          date?: string
          dau?: number | null
          gmv?: number | null
          gross_margin?: number | null
          id?: string
          ltv?: number | null
          ltv_cac_ratio?: number | null
          mau?: number | null
          new_bookings?: number | null
          new_providers?: number | null
          new_users?: number | null
          page_views?: number | null
          platform_revenue?: number | null
          property_adr?: number | null
          property_gmv?: number | null
          property_listings_count?: number | null
          property_occupancy_rate?: number | null
          repeat_purchase_rate?: number | null
          session_count?: number | null
          subscription_revenue?: number | null
          total_bookings?: number | null
          total_providers?: number | null
          total_users?: number | null
          tours_avg_rating?: number | null
          tours_count?: number | null
          tours_gmv?: number | null
          unique_visitors?: number | null
          updated_at?: string
          yachts_count?: number | null
          yachts_gmv?: number | null
        }
        Relationships: []
      }
      product_availability: {
        Row: {
          block_reason: string | null
          created_at: string | null
          date: string
          end_time: string | null
          id: string
          is_blocked: boolean | null
          product_id: string
          resource_id: string | null
          slots_available: number | null
          start_time: string | null
        }
        Insert: {
          block_reason?: string | null
          created_at?: string | null
          date: string
          end_time?: string | null
          id?: string
          is_blocked?: boolean | null
          product_id: string
          resource_id?: string | null
          slots_available?: number | null
          start_time?: string | null
        }
        Update: {
          block_reason?: string | null
          created_at?: string | null
          date?: string
          end_time?: string | null
          id?: string
          is_blocked?: boolean | null
          product_id?: string
          resource_id?: string | null
          slots_available?: number | null
          start_time?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "product_availability_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "product_availability_resource_id_fkey"
            columns: ["resource_id"]
            isOneToOne: false
            referencedRelation: "resources"
            referencedColumns: ["id"]
          },
        ]
      }
      product_resource_links: {
        Row: {
          created_at: string | null
          id: string
          is_primary: boolean | null
          product_id: string
          resource_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          is_primary?: boolean | null
          product_id: string
          resource_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          is_primary?: boolean | null
          product_id?: string
          resource_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "product_resource_links_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "product_resource_links_resource_id_fkey"
            columns: ["resource_id"]
            isOneToOne: false
            referencedRelation: "resources"
            referencedColumns: ["id"]
          },
        ]
      }
      products: {
        Row: {
          base_price: number | null
          category_id: string | null
          cover_image: string | null
          created_at: string | null
          currency: string | null
          description_en: string | null
          description_ru: string | null
          duration_minutes: number | null
          id: string
          images: string[] | null
          is_active: boolean | null
          is_featured: boolean | null
          max_capacity: number | null
          metadata: Json | null
          name_en: string
          name_ru: string | null
          org_id: string | null
          product_type: string
          rating: number | null
          review_count: number | null
          updated_at: string | null
        }
        Insert: {
          base_price?: number | null
          category_id?: string | null
          cover_image?: string | null
          created_at?: string | null
          currency?: string | null
          description_en?: string | null
          description_ru?: string | null
          duration_minutes?: number | null
          id?: string
          images?: string[] | null
          is_active?: boolean | null
          is_featured?: boolean | null
          max_capacity?: number | null
          metadata?: Json | null
          name_en: string
          name_ru?: string | null
          org_id?: string | null
          product_type: string
          rating?: number | null
          review_count?: number | null
          updated_at?: string | null
        }
        Update: {
          base_price?: number | null
          category_id?: string | null
          cover_image?: string | null
          created_at?: string | null
          currency?: string | null
          description_en?: string | null
          description_ru?: string | null
          duration_minutes?: number | null
          id?: string
          images?: string[] | null
          is_active?: boolean | null
          is_featured?: boolean | null
          max_capacity?: number | null
          metadata?: Json | null
          name_en?: string
          name_ru?: string | null
          org_id?: string | null
          product_type?: string
          rating?: number | null
          review_count?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "products_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "products_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "orgs"
            referencedColumns: ["id"]
          },
        ]
      }
      profile_details: {
        Row: {
          address_line1: string | null
          address_line2: string | null
          city: string | null
          country: string | null
          created_at: string
          date_of_birth: string | null
          dietary_restrictions: string[] | null
          emergency_contact_name: string | null
          emergency_contact_phone: string | null
          emergency_contact_relation: string | null
          gender: string | null
          id: string
          medical_conditions: string | null
          nationality: string | null
          postal_code: string | null
          state_province: string | null
          travel_preferences: Json | null
          updated_at: string
          user_id: string
        }
        Insert: {
          address_line1?: string | null
          address_line2?: string | null
          city?: string | null
          country?: string | null
          created_at?: string
          date_of_birth?: string | null
          dietary_restrictions?: string[] | null
          emergency_contact_name?: string | null
          emergency_contact_phone?: string | null
          emergency_contact_relation?: string | null
          gender?: string | null
          id?: string
          medical_conditions?: string | null
          nationality?: string | null
          postal_code?: string | null
          state_province?: string | null
          travel_preferences?: Json | null
          updated_at?: string
          user_id: string
        }
        Update: {
          address_line1?: string | null
          address_line2?: string | null
          city?: string | null
          country?: string | null
          created_at?: string
          date_of_birth?: string | null
          dietary_restrictions?: string[] | null
          emergency_contact_name?: string | null
          emergency_contact_phone?: string | null
          emergency_contact_relation?: string | null
          gender?: string | null
          id?: string
          medical_conditions?: string | null
          nationality?: string | null
          postal_code?: string | null
          state_province?: string | null
          travel_preferences?: Json | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
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
          approval_status: string | null
          area_sqm: number | null
          available_from: string | null
          bathrooms: number | null
          bedrooms: number | null
          cover_image: string | null
          created_at: string
          created_by_uno_team: boolean | null
          currency: string | null
          description_en: string | null
          description_ru: string | null
          district: string | null
          equipment: string[] | null
          floor: number | null
          furnishing_level: string | null
          id: string
          images: string[] | null
          instant_booking: boolean | null
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
          project_id: string | null
          property_type: string
          provider_id: string | null
          rating: number | null
          rejection_reason: string | null
          review_count: number | null
          reviewed_at: string | null
          reviewed_by: string | null
          title_en: string
          title_ru: string
          unit_number: string | null
          uno_team_creator_id: string | null
          updated_at: string
          view_type: string | null
        }
        Insert: {
          address?: string | null
          amenities?: string[] | null
          approval_status?: string | null
          area_sqm?: number | null
          available_from?: string | null
          bathrooms?: number | null
          bedrooms?: number | null
          cover_image?: string | null
          created_at?: string
          created_by_uno_team?: boolean | null
          currency?: string | null
          description_en?: string | null
          description_ru?: string | null
          district?: string | null
          equipment?: string[] | null
          floor?: number | null
          furnishing_level?: string | null
          id?: string
          images?: string[] | null
          instant_booking?: boolean | null
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
          project_id?: string | null
          property_type: string
          provider_id?: string | null
          rating?: number | null
          rejection_reason?: string | null
          review_count?: number | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          title_en: string
          title_ru: string
          unit_number?: string | null
          uno_team_creator_id?: string | null
          updated_at?: string
          view_type?: string | null
        }
        Update: {
          address?: string | null
          amenities?: string[] | null
          approval_status?: string | null
          area_sqm?: number | null
          available_from?: string | null
          bathrooms?: number | null
          bedrooms?: number | null
          cover_image?: string | null
          created_at?: string
          created_by_uno_team?: boolean | null
          currency?: string | null
          description_en?: string | null
          description_ru?: string | null
          district?: string | null
          equipment?: string[] | null
          floor?: number | null
          furnishing_level?: string | null
          id?: string
          images?: string[] | null
          instant_booking?: boolean | null
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
          project_id?: string | null
          property_type?: string
          provider_id?: string | null
          rating?: number | null
          rejection_reason?: string | null
          review_count?: number | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          title_en?: string
          title_ru?: string
          unit_number?: string | null
          uno_team_creator_id?: string | null
          updated_at?: string
          view_type?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_properties_project"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "property_projects"
            referencedColumns: ["id"]
          },
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
      property_activity_log: {
        Row: {
          action: string
          actor_id: string | null
          actor_role: string | null
          created_at: string | null
          details: Json | null
          entity_id: string | null
          entity_type: string | null
          id: string
          ip_address: string | null
          property_id: string
        }
        Insert: {
          action: string
          actor_id?: string | null
          actor_role?: string | null
          created_at?: string | null
          details?: Json | null
          entity_id?: string | null
          entity_type?: string | null
          id?: string
          ip_address?: string | null
          property_id: string
        }
        Update: {
          action?: string
          actor_id?: string | null
          actor_role?: string | null
          created_at?: string | null
          details?: Json | null
          entity_id?: string | null
          entity_type?: string | null
          id?: string
          ip_address?: string | null
          property_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "property_activity_log_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "owner_properties"
            referencedColumns: ["id"]
          },
        ]
      }
      property_availability: {
        Row: {
          booking_id: string | null
          created_at: string | null
          date: string
          id: string
          min_nights_override: number | null
          note: string | null
          price_override: number | null
          property_id: string
          status: string
          updated_at: string | null
        }
        Insert: {
          booking_id?: string | null
          created_at?: string | null
          date: string
          id?: string
          min_nights_override?: number | null
          note?: string | null
          price_override?: number | null
          property_id: string
          status?: string
          updated_at?: string | null
        }
        Update: {
          booking_id?: string | null
          created_at?: string | null
          date?: string
          id?: string
          min_nights_override?: number | null
          note?: string | null
          price_override?: number | null
          property_id?: string
          status?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "property_availability_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "property_bookings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "property_availability_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "owner_properties"
            referencedColumns: ["id"]
          },
        ]
      }
      property_bookings: {
        Row: {
          check_in: string
          check_out: string
          created_at: string
          currency: string | null
          external_id: string | null
          guest_email: string | null
          guest_name: string | null
          guest_phone: string | null
          guests_count: number | null
          id: string
          marketplace_booking_id: string | null
          notes: string | null
          owner_id: string
          property_id: string
          source: string | null
          source_calendar_id: string | null
          status: string | null
          total_amount: number | null
          updated_at: string
        }
        Insert: {
          check_in: string
          check_out: string
          created_at?: string
          currency?: string | null
          external_id?: string | null
          guest_email?: string | null
          guest_name?: string | null
          guest_phone?: string | null
          guests_count?: number | null
          id?: string
          marketplace_booking_id?: string | null
          notes?: string | null
          owner_id: string
          property_id: string
          source?: string | null
          source_calendar_id?: string | null
          status?: string | null
          total_amount?: number | null
          updated_at?: string
        }
        Update: {
          check_in?: string
          check_out?: string
          created_at?: string
          currency?: string | null
          external_id?: string | null
          guest_email?: string | null
          guest_name?: string | null
          guest_phone?: string | null
          guests_count?: number | null
          id?: string
          marketplace_booking_id?: string | null
          notes?: string | null
          owner_id?: string
          property_id?: string
          source?: string | null
          source_calendar_id?: string | null
          status?: string | null
          total_amount?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "property_bookings_marketplace_booking_id_fkey"
            columns: ["marketplace_booking_id"]
            isOneToOne: false
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "property_bookings_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "owner_properties"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "property_bookings_source_calendar_id_fkey"
            columns: ["source_calendar_id"]
            isOneToOne: false
            referencedRelation: "property_external_calendars"
            referencedColumns: ["id"]
          },
        ]
      }
      property_chat_messages: {
        Row: {
          attachments: Json | null
          booking_id: string | null
          created_at: string
          id: string
          is_read: boolean | null
          message: string
          property_id: string | null
          sender_id: string
          sender_name: string | null
          sender_type: string
        }
        Insert: {
          attachments?: Json | null
          booking_id?: string | null
          created_at?: string
          id?: string
          is_read?: boolean | null
          message: string
          property_id?: string | null
          sender_id: string
          sender_name?: string | null
          sender_type?: string
        }
        Update: {
          attachments?: Json | null
          booking_id?: string | null
          created_at?: string
          id?: string
          is_read?: boolean | null
          message?: string
          property_id?: string | null
          sender_id?: string
          sender_name?: string | null
          sender_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "property_chat_messages_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "property_bookings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "property_chat_messages_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "owner_properties"
            referencedColumns: ["id"]
          },
        ]
      }
      property_delegates: {
        Row: {
          accepted_at: string | null
          created_at: string | null
          expires_at: string | null
          id: string
          invited_by: string | null
          invited_email: string | null
          invited_name: string | null
          notes: string | null
          permissions: Json | null
          property_id: string
          role: string
          status: string | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          accepted_at?: string | null
          created_at?: string | null
          expires_at?: string | null
          id?: string
          invited_by?: string | null
          invited_email?: string | null
          invited_name?: string | null
          notes?: string | null
          permissions?: Json | null
          property_id: string
          role: string
          status?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          accepted_at?: string | null
          created_at?: string | null
          expires_at?: string | null
          id?: string
          invited_by?: string | null
          invited_email?: string | null
          invited_name?: string | null
          notes?: string | null
          permissions?: Json | null
          property_id?: string
          role?: string
          status?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "property_delegates_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "owner_properties"
            referencedColumns: ["id"]
          },
        ]
      }
      property_external_calendars: {
        Row: {
          created_at: string
          ical_url: string
          id: string
          is_active: boolean | null
          last_synced_at: string | null
          name: string
          owner_id: string
          property_id: string
          sync_error: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          ical_url: string
          id?: string
          is_active?: boolean | null
          last_synced_at?: string | null
          name: string
          owner_id: string
          property_id: string
          sync_error?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          ical_url?: string
          id?: string
          is_active?: boolean | null
          last_synced_at?: string | null
          name?: string
          owner_id?: string
          property_id?: string
          sync_error?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "property_external_calendars_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "owner_properties"
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
          due_date: string | null
          id: string
          invoice_number: string | null
          notes: string | null
          owner_id: string
          paid_date: string | null
          payment_method: string | null
          property_id: string
          receipt_url: string | null
          recurring: boolean | null
          recurring_interval: string | null
          reference_id: string | null
          reference_type: string | null
          status: string | null
          tax_deductible: boolean | null
          transaction_date: string
          transaction_type: string
          vendor_name: string | null
        }
        Insert: {
          amount: number
          category?: string | null
          created_at?: string
          currency?: string | null
          description?: string | null
          description_ru?: string | null
          due_date?: string | null
          id?: string
          invoice_number?: string | null
          notes?: string | null
          owner_id: string
          paid_date?: string | null
          payment_method?: string | null
          property_id: string
          receipt_url?: string | null
          recurring?: boolean | null
          recurring_interval?: string | null
          reference_id?: string | null
          reference_type?: string | null
          status?: string | null
          tax_deductible?: boolean | null
          transaction_date?: string
          transaction_type: string
          vendor_name?: string | null
        }
        Update: {
          amount?: number
          category?: string | null
          created_at?: string
          currency?: string | null
          description?: string | null
          description_ru?: string | null
          due_date?: string | null
          id?: string
          invoice_number?: string | null
          notes?: string | null
          owner_id?: string
          paid_date?: string | null
          payment_method?: string | null
          property_id?: string
          receipt_url?: string | null
          recurring?: boolean | null
          recurring_interval?: string | null
          reference_id?: string | null
          reference_type?: string | null
          status?: string | null
          tax_deductible?: boolean | null
          transaction_date?: string
          transaction_type?: string
          vendor_name?: string | null
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
      property_guidebook: {
        Row: {
          appliance_guides: Json | null
          checkout_instructions: string | null
          checkout_instructions_ru: string | null
          created_at: string | null
          door_code: string | null
          emergency_contacts: Json | null
          gate_code: string | null
          house_manual_url: string | null
          id: string
          local_tips: Json | null
          lockbox_code: string | null
          lockbox_location: string | null
          parking_instructions: string | null
          parking_instructions_ru: string | null
          property_id: string | null
          trash_instructions: string | null
          trash_instructions_ru: string | null
          updated_at: string | null
          wifi_name: string | null
          wifi_password: string | null
        }
        Insert: {
          appliance_guides?: Json | null
          checkout_instructions?: string | null
          checkout_instructions_ru?: string | null
          created_at?: string | null
          door_code?: string | null
          emergency_contacts?: Json | null
          gate_code?: string | null
          house_manual_url?: string | null
          id?: string
          local_tips?: Json | null
          lockbox_code?: string | null
          lockbox_location?: string | null
          parking_instructions?: string | null
          parking_instructions_ru?: string | null
          property_id?: string | null
          trash_instructions?: string | null
          trash_instructions_ru?: string | null
          updated_at?: string | null
          wifi_name?: string | null
          wifi_password?: string | null
        }
        Update: {
          appliance_guides?: Json | null
          checkout_instructions?: string | null
          checkout_instructions_ru?: string | null
          created_at?: string | null
          door_code?: string | null
          emergency_contacts?: Json | null
          gate_code?: string | null
          house_manual_url?: string | null
          id?: string
          local_tips?: Json | null
          lockbox_code?: string | null
          lockbox_location?: string | null
          parking_instructions?: string | null
          parking_instructions_ru?: string | null
          property_id?: string | null
          trash_instructions?: string | null
          trash_instructions_ru?: string | null
          updated_at?: string | null
          wifi_name?: string | null
          wifi_password?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "property_guidebook_property_id_fkey"
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
      property_ownership_invites: {
        Row: {
          accepted_at: string | null
          created_at: string
          delegate_role: string | null
          expires_at: string | null
          id: string
          invite_type: string
          invitee_email: string
          invitee_name: string | null
          inviter_id: string
          message: string | null
          property_id: string
          status: string
        }
        Insert: {
          accepted_at?: string | null
          created_at?: string
          delegate_role?: string | null
          expires_at?: string | null
          id?: string
          invite_type: string
          invitee_email: string
          invitee_name?: string | null
          inviter_id: string
          message?: string | null
          property_id: string
          status?: string
        }
        Update: {
          accepted_at?: string | null
          created_at?: string
          delegate_role?: string | null
          expires_at?: string | null
          id?: string
          invite_type?: string
          invitee_email?: string
          invitee_name?: string | null
          inviter_id?: string
          message?: string | null
          property_id?: string
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "property_ownership_invites_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "owner_properties"
            referencedColumns: ["id"]
          },
        ]
      }
      property_projects: {
        Row: {
          address: string | null
          amenities: string[] | null
          cover_image: string | null
          created_at: string | null
          created_by: string | null
          description_en: string | null
          description_ru: string | null
          developer_name: string | null
          district: string | null
          id: string
          images: string[] | null
          infrastructure: string[] | null
          is_active: boolean | null
          is_featured: boolean | null
          lat: number | null
          lng: number | null
          name_en: string
          name_ru: string
          total_units: number | null
          updated_at: string | null
          video_url: string | null
          year_built: number | null
        }
        Insert: {
          address?: string | null
          amenities?: string[] | null
          cover_image?: string | null
          created_at?: string | null
          created_by?: string | null
          description_en?: string | null
          description_ru?: string | null
          developer_name?: string | null
          district?: string | null
          id?: string
          images?: string[] | null
          infrastructure?: string[] | null
          is_active?: boolean | null
          is_featured?: boolean | null
          lat?: number | null
          lng?: number | null
          name_en: string
          name_ru: string
          total_units?: number | null
          updated_at?: string | null
          video_url?: string | null
          year_built?: number | null
        }
        Update: {
          address?: string | null
          amenities?: string[] | null
          cover_image?: string | null
          created_at?: string | null
          created_by?: string | null
          description_en?: string | null
          description_ru?: string | null
          developer_name?: string | null
          district?: string | null
          id?: string
          images?: string[] | null
          infrastructure?: string[] | null
          is_active?: boolean | null
          is_featured?: boolean | null
          lat?: number | null
          lng?: number | null
          name_en?: string
          name_ru?: string
          total_units?: number | null
          updated_at?: string | null
          video_url?: string | null
          year_built?: number | null
        }
        Relationships: []
      }
      property_service_requests: {
        Row: {
          assigned_at: string | null
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
          rating: number | null
          review: string | null
          scheduled_at: string | null
          service_cost: number | null
          service_type: string
          special_instructions: string | null
          started_at: string | null
          status: string | null
          updated_at: string
        }
        Insert: {
          assigned_at?: string | null
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
          rating?: number | null
          review?: string | null
          scheduled_at?: string | null
          service_cost?: number | null
          service_type: string
          special_instructions?: string | null
          started_at?: string | null
          status?: string | null
          updated_at?: string
        }
        Update: {
          assigned_at?: string | null
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
          rating?: number | null
          review?: string | null
          scheduled_at?: string | null
          service_cost?: number | null
          service_type?: string
          special_instructions?: string | null
          started_at?: string | null
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
      quick_listings: {
        Row: {
          admin_notes: string | null
          category: string
          contact_email: string | null
          contact_name: string | null
          contact_phone: string | null
          converted_to_id: string | null
          converted_to_type: string | null
          created_at: string | null
          currency: string | null
          description: string | null
          id: string
          images: string[] | null
          location: string | null
          price: number | null
          rejection_reason: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          status: string | null
          subcategory: string | null
          title: string
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          admin_notes?: string | null
          category: string
          contact_email?: string | null
          contact_name?: string | null
          contact_phone?: string | null
          converted_to_id?: string | null
          converted_to_type?: string | null
          created_at?: string | null
          currency?: string | null
          description?: string | null
          id?: string
          images?: string[] | null
          location?: string | null
          price?: number | null
          rejection_reason?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string | null
          subcategory?: string | null
          title: string
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          admin_notes?: string | null
          category?: string
          contact_email?: string | null
          contact_name?: string | null
          contact_phone?: string | null
          converted_to_id?: string | null
          converted_to_type?: string | null
          created_at?: string | null
          currency?: string | null
          description?: string | null
          id?: string
          images?: string[] | null
          location?: string | null
          price?: number | null
          rejection_reason?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string | null
          subcategory?: string | null
          title?: string
          updated_at?: string | null
          user_id?: string | null
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
      resources: {
        Row: {
          capacity: number | null
          created_at: string | null
          id: string
          is_available: boolean | null
          lat: number | null
          lng: number | null
          location: string | null
          metadata: Json | null
          name_en: string
          name_ru: string | null
          org_id: string | null
          resource_type: string
          updated_at: string | null
        }
        Insert: {
          capacity?: number | null
          created_at?: string | null
          id?: string
          is_available?: boolean | null
          lat?: number | null
          lng?: number | null
          location?: string | null
          metadata?: Json | null
          name_en: string
          name_ru?: string | null
          org_id?: string | null
          resource_type: string
          updated_at?: string | null
        }
        Update: {
          capacity?: number | null
          created_at?: string | null
          id?: string
          is_available?: boolean | null
          lat?: number | null
          lng?: number | null
          location?: string | null
          metadata?: Json | null
          name_en?: string
          name_ru?: string | null
          org_id?: string | null
          resource_type?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "resources_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "orgs"
            referencedColumns: ["id"]
          },
        ]
      }
      restaurant_availability: {
        Row: {
          booked_covers: number
          created_at: string | null
          date: string
          id: string
          is_blocked: boolean | null
          max_covers: number
          notes: string | null
          restaurant_id: string
          time_slot: string
          updated_at: string | null
        }
        Insert: {
          booked_covers?: number
          created_at?: string | null
          date: string
          id?: string
          is_blocked?: boolean | null
          max_covers?: number
          notes?: string | null
          restaurant_id: string
          time_slot: string
          updated_at?: string | null
        }
        Update: {
          booked_covers?: number
          created_at?: string | null
          date?: string
          id?: string
          is_blocked?: boolean | null
          max_covers?: number
          notes?: string | null
          restaurant_id?: string
          time_slot?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "restaurant_availability_restaurant_id_fkey"
            columns: ["restaurant_id"]
            isOneToOne: false
            referencedRelation: "restaurants"
            referencedColumns: ["id"]
          },
        ]
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
          approval_status: string | null
          cover_image: string | null
          created_at: string
          created_by_uno_team: boolean | null
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
          rejection_reason: string | null
          review_count: number | null
          reviewed_at: string | null
          reviewed_by: string | null
          uno_team_creator_id: string | null
          updated_at: string
          website: string | null
          working_hours: Json | null
        }
        Insert: {
          address?: string | null
          approval_status?: string | null
          cover_image?: string | null
          created_at?: string
          created_by_uno_team?: boolean | null
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
          rejection_reason?: string | null
          review_count?: number | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          uno_team_creator_id?: string | null
          updated_at?: string
          website?: string | null
          working_hours?: Json | null
        }
        Update: {
          address?: string | null
          approval_status?: string | null
          cover_image?: string | null
          created_at?: string
          created_by_uno_team?: boolean | null
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
          rejection_reason?: string | null
          review_count?: number | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          uno_team_creator_id?: string | null
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
      salon_services: {
        Row: {
          category: string | null
          created_at: string | null
          currency: string | null
          description_en: string | null
          description_ru: string | null
          duration_minutes: number | null
          id: string
          is_active: boolean | null
          is_popular: boolean | null
          name_en: string
          name_ru: string
          price: number
          salon_id: string
        }
        Insert: {
          category?: string | null
          created_at?: string | null
          currency?: string | null
          description_en?: string | null
          description_ru?: string | null
          duration_minutes?: number | null
          id?: string
          is_active?: boolean | null
          is_popular?: boolean | null
          name_en: string
          name_ru: string
          price: number
          salon_id: string
        }
        Update: {
          category?: string | null
          created_at?: string | null
          currency?: string | null
          description_en?: string | null
          description_ru?: string | null
          duration_minutes?: number | null
          id?: string
          is_active?: boolean | null
          is_popular?: boolean | null
          name_en?: string
          name_ru?: string
          price?: number
          salon_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "salon_services_salon_id_fkey"
            columns: ["salon_id"]
            isOneToOne: false
            referencedRelation: "salons"
            referencedColumns: ["id"]
          },
        ]
      }
      salons: {
        Row: {
          address: string | null
          amenities: string[] | null
          approval_status: string | null
          cover_image: string | null
          created_at: string | null
          created_by_uno_team: boolean | null
          currency: string | null
          description_en: string | null
          description_ru: string | null
          district: string | null
          email: string | null
          id: string
          images: string[] | null
          is_active: boolean | null
          is_featured: boolean | null
          is_verified: boolean | null
          languages: string[] | null
          lat: number | null
          lng: number | null
          name_en: string
          name_ru: string
          phone: string | null
          price_from: number | null
          provider_id: string | null
          rating: number | null
          rejection_reason: string | null
          review_count: number | null
          reviewed_at: string | null
          reviewed_by: string | null
          salon_type: string | null
          services: string[] | null
          uno_team_creator_id: string | null
          updated_at: string | null
          website: string | null
          working_hours: Json | null
        }
        Insert: {
          address?: string | null
          amenities?: string[] | null
          approval_status?: string | null
          cover_image?: string | null
          created_at?: string | null
          created_by_uno_team?: boolean | null
          currency?: string | null
          description_en?: string | null
          description_ru?: string | null
          district?: string | null
          email?: string | null
          id?: string
          images?: string[] | null
          is_active?: boolean | null
          is_featured?: boolean | null
          is_verified?: boolean | null
          languages?: string[] | null
          lat?: number | null
          lng?: number | null
          name_en: string
          name_ru: string
          phone?: string | null
          price_from?: number | null
          provider_id?: string | null
          rating?: number | null
          rejection_reason?: string | null
          review_count?: number | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          salon_type?: string | null
          services?: string[] | null
          uno_team_creator_id?: string | null
          updated_at?: string | null
          website?: string | null
          working_hours?: Json | null
        }
        Update: {
          address?: string | null
          amenities?: string[] | null
          approval_status?: string | null
          cover_image?: string | null
          created_at?: string | null
          created_by_uno_team?: boolean | null
          currency?: string | null
          description_en?: string | null
          description_ru?: string | null
          district?: string | null
          email?: string | null
          id?: string
          images?: string[] | null
          is_active?: boolean | null
          is_featured?: boolean | null
          is_verified?: boolean | null
          languages?: string[] | null
          lat?: number | null
          lng?: number | null
          name_en?: string
          name_ru?: string
          phone?: string | null
          price_from?: number | null
          provider_id?: string | null
          rating?: number | null
          rejection_reason?: string | null
          review_count?: number | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          salon_type?: string | null
          services?: string[] | null
          uno_team_creator_id?: string | null
          updated_at?: string | null
          website?: string | null
          working_hours?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "salons_provider_id_fkey"
            columns: ["provider_id"]
            isOneToOne: false
            referencedRelation: "providers"
            referencedColumns: ["id"]
          },
        ]
      }
      service_order_status_history: {
        Row: {
          changed_by: string | null
          created_at: string
          from_status: string | null
          id: string
          notes: string | null
          order_id: string
          to_status: string
        }
        Insert: {
          changed_by?: string | null
          created_at?: string
          from_status?: string | null
          id?: string
          notes?: string | null
          order_id: string
          to_status: string
        }
        Update: {
          changed_by?: string | null
          created_at?: string
          from_status?: string | null
          id?: string
          notes?: string | null
          order_id?: string
          to_status?: string
        }
        Relationships: [
          {
            foreignKeyName: "service_order_status_history_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "service_orders"
            referencedColumns: ["id"]
          },
        ]
      }
      service_orders: {
        Row: {
          amount: number | null
          assigned_to: string | null
          booking_id: string | null
          completed_at: string | null
          completion_notes: string | null
          completion_photos: string[] | null
          created_at: string
          currency: string | null
          description: string | null
          guest_id: string
          id: string
          notes: string | null
          order_number: string | null
          payment_status: string | null
          priority: string | null
          property_id: string | null
          provider_id: string | null
          rating: number | null
          review: string | null
          scheduled_at: string | null
          service_name: string
          service_name_ru: string | null
          service_type: string
          started_at: string | null
          status: string
          updated_at: string
        }
        Insert: {
          amount?: number | null
          assigned_to?: string | null
          booking_id?: string | null
          completed_at?: string | null
          completion_notes?: string | null
          completion_photos?: string[] | null
          created_at?: string
          currency?: string | null
          description?: string | null
          guest_id: string
          id?: string
          notes?: string | null
          order_number?: string | null
          payment_status?: string | null
          priority?: string | null
          property_id?: string | null
          provider_id?: string | null
          rating?: number | null
          review?: string | null
          scheduled_at?: string | null
          service_name: string
          service_name_ru?: string | null
          service_type: string
          started_at?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          amount?: number | null
          assigned_to?: string | null
          booking_id?: string | null
          completed_at?: string | null
          completion_notes?: string | null
          completion_photos?: string[] | null
          created_at?: string
          currency?: string | null
          description?: string | null
          guest_id?: string
          id?: string
          notes?: string | null
          order_number?: string | null
          payment_status?: string | null
          priority?: string | null
          property_id?: string | null
          provider_id?: string | null
          rating?: number | null
          review?: string | null
          scheduled_at?: string | null
          service_name?: string
          service_name_ru?: string | null
          service_type?: string
          started_at?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "service_orders_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "service_orders_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "service_orders_provider_id_fkey"
            columns: ["provider_id"]
            isOneToOne: false
            referencedRelation: "providers"
            referencedColumns: ["id"]
          },
        ]
      }
      services: {
        Row: {
          approval_status: string | null
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
          rejection_reason: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          tags: string[] | null
          updated_at: string
        }
        Insert: {
          approval_status?: string | null
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
          rejection_reason?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          tags?: string[] | null
          updated_at?: string
        }
        Update: {
          approval_status?: string | null
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
          rejection_reason?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
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
      staff_profiles: {
        Row: {
          avg_rating: number | null
          bio: string | null
          completed_tasks: number | null
          created_at: string
          display_name: string
          id: string
          is_active: boolean | null
          is_available: boolean | null
          languages: string[] | null
          phone: string | null
          photo: string | null
          service_types: string[] | null
          total_reviews: number | null
          updated_at: string
          user_id: string
          working_hours: Json | null
        }
        Insert: {
          avg_rating?: number | null
          bio?: string | null
          completed_tasks?: number | null
          created_at?: string
          display_name: string
          id?: string
          is_active?: boolean | null
          is_available?: boolean | null
          languages?: string[] | null
          phone?: string | null
          photo?: string | null
          service_types?: string[] | null
          total_reviews?: number | null
          updated_at?: string
          user_id: string
          working_hours?: Json | null
        }
        Update: {
          avg_rating?: number | null
          bio?: string | null
          completed_tasks?: number | null
          created_at?: string
          display_name?: string
          id?: string
          is_active?: boolean | null
          is_available?: boolean | null
          languages?: string[] | null
          phone?: string | null
          photo?: string | null
          service_types?: string[] | null
          total_reviews?: number | null
          updated_at?: string
          user_id?: string
          working_hours?: Json | null
        }
        Relationships: []
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
          rejection_reason: string | null
          review_count: number | null
          reviewed_at: string | null
          reviewed_by: string | null
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
          rejection_reason?: string | null
          review_count?: number | null
          reviewed_at?: string | null
          reviewed_by?: string | null
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
          rejection_reason?: string | null
          review_count?: number | null
          reviewed_at?: string | null
          reviewed_by?: string | null
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
      subscription_plans: {
        Row: {
          created_at: string
          currency: string
          description: string | null
          description_ru: string | null
          features: Json | null
          id: string
          is_active: boolean | null
          is_popular: boolean | null
          limits: Json | null
          name: string
          name_ru: string
          price_monthly: number
          price_yearly: number | null
          slug: string
          sort_order: number | null
          stripe_price_id_monthly: string | null
          stripe_price_id_yearly: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          currency?: string
          description?: string | null
          description_ru?: string | null
          features?: Json | null
          id?: string
          is_active?: boolean | null
          is_popular?: boolean | null
          limits?: Json | null
          name: string
          name_ru: string
          price_monthly?: number
          price_yearly?: number | null
          slug: string
          sort_order?: number | null
          stripe_price_id_monthly?: string | null
          stripe_price_id_yearly?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          currency?: string
          description?: string | null
          description_ru?: string | null
          features?: Json | null
          id?: string
          is_active?: boolean | null
          is_popular?: boolean | null
          limits?: Json | null
          name?: string
          name_ru?: string
          price_monthly?: number
          price_yearly?: number | null
          slug?: string
          sort_order?: number | null
          stripe_price_id_monthly?: string | null
          stripe_price_id_yearly?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      support_tickets: {
        Row: {
          assigned_to: string | null
          attachments: Json | null
          booking_id: string | null
          category: string
          closed_at: string | null
          created_at: string | null
          description: string
          id: string
          order_id: string | null
          priority: string | null
          property_id: string | null
          provider_id: string | null
          refund_amount: number | null
          reporter_email: string | null
          reporter_name: string | null
          reporter_phone: string | null
          reporter_type: string
          resolution: string | null
          resolution_type: string | null
          resolved_at: string | null
          sla_deadline: string | null
          status: string | null
          subject: string
          ticket_number: string
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          assigned_to?: string | null
          attachments?: Json | null
          booking_id?: string | null
          category: string
          closed_at?: string | null
          created_at?: string | null
          description: string
          id?: string
          order_id?: string | null
          priority?: string | null
          property_id?: string | null
          provider_id?: string | null
          refund_amount?: number | null
          reporter_email?: string | null
          reporter_name?: string | null
          reporter_phone?: string | null
          reporter_type: string
          resolution?: string | null
          resolution_type?: string | null
          resolved_at?: string | null
          sla_deadline?: string | null
          status?: string | null
          subject: string
          ticket_number: string
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          assigned_to?: string | null
          attachments?: Json | null
          booking_id?: string | null
          category?: string
          closed_at?: string | null
          created_at?: string | null
          description?: string
          id?: string
          order_id?: string | null
          priority?: string | null
          property_id?: string | null
          provider_id?: string | null
          refund_amount?: number | null
          reporter_email?: string | null
          reporter_name?: string | null
          reporter_phone?: string | null
          reporter_type?: string
          resolution?: string | null
          resolution_type?: string | null
          resolved_at?: string | null
          sla_deadline?: string | null
          status?: string | null
          subject?: string
          ticket_number?: string
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "support_tickets_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "support_tickets_provider_id_fkey"
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
      ticket_messages: {
        Row: {
          attachments: Json | null
          created_at: string | null
          id: string
          is_internal: boolean | null
          message: string
          sender_id: string | null
          sender_name: string | null
          sender_type: string
          ticket_id: string
        }
        Insert: {
          attachments?: Json | null
          created_at?: string | null
          id?: string
          is_internal?: boolean | null
          message: string
          sender_id?: string | null
          sender_name?: string | null
          sender_type: string
          ticket_id: string
        }
        Update: {
          attachments?: Json | null
          created_at?: string | null
          id?: string
          is_internal?: boolean | null
          message?: string
          sender_id?: string | null
          sender_name?: string | null
          sender_type?: string
          ticket_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "ticket_messages_ticket_id_fkey"
            columns: ["ticket_id"]
            isOneToOne: false
            referencedRelation: "support_tickets"
            referencedColumns: ["id"]
          },
        ]
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
          approval_status: string | null
          available_days: string[] | null
          category: string | null
          cover_image: string | null
          created_at: string
          created_by_uno_team: boolean | null
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
          rejection_reason: string | null
          review_count: number | null
          reviewed_at: string | null
          reviewed_by: string | null
          start_times: string[] | null
          title_en: string
          title_ru: string
          uno_team_creator_id: string | null
          updated_at: string
        }
        Insert: {
          approval_status?: string | null
          available_days?: string[] | null
          category?: string | null
          cover_image?: string | null
          created_at?: string
          created_by_uno_team?: boolean | null
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
          rejection_reason?: string | null
          review_count?: number | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          start_times?: string[] | null
          title_en: string
          title_ru: string
          uno_team_creator_id?: string | null
          updated_at?: string
        }
        Update: {
          approval_status?: string | null
          available_days?: string[] | null
          category?: string | null
          cover_image?: string | null
          created_at?: string
          created_by_uno_team?: boolean | null
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
          rejection_reason?: string | null
          review_count?: number | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          start_times?: string[] | null
          title_en?: string
          title_ru?: string
          uno_team_creator_id?: string | null
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
      uno_team_permissions: {
        Row: {
          can_create: boolean | null
          can_delete: boolean | null
          can_edit: boolean | null
          can_submit_for_review: boolean | null
          created_at: string
          granted_by: string | null
          id: string
          updated_at: string
          user_id: string
          vertical: string
        }
        Insert: {
          can_create?: boolean | null
          can_delete?: boolean | null
          can_edit?: boolean | null
          can_submit_for_review?: boolean | null
          created_at?: string
          granted_by?: string | null
          id?: string
          updated_at?: string
          user_id: string
          vertical: string
        }
        Update: {
          can_create?: boolean | null
          can_delete?: boolean | null
          can_edit?: boolean | null
          can_submit_for_review?: boolean | null
          created_at?: string
          granted_by?: string | null
          id?: string
          updated_at?: string
          user_id?: string
          vertical?: string
        }
        Relationships: []
      }
      user_active_context: {
        Row: {
          active_org_id: string | null
          active_role: string
          id: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          active_org_id?: string | null
          active_role?: string
          id?: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          active_org_id?: string | null
          active_role?: string
          id?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_active_context_active_org_id_fkey"
            columns: ["active_org_id"]
            isOneToOne: false
            referencedRelation: "orgs"
            referencedColumns: ["id"]
          },
        ]
      }
      user_documents: {
        Row: {
          country: string | null
          created_at: string
          document_number: string | null
          document_type: string
          expiry_date: string | null
          file_name: string | null
          file_url: string | null
          id: string
          is_verified: boolean | null
          issue_date: string | null
          notes: string | null
          updated_at: string
          user_id: string
          verified_at: string | null
        }
        Insert: {
          country?: string | null
          created_at?: string
          document_number?: string | null
          document_type: string
          expiry_date?: string | null
          file_name?: string | null
          file_url?: string | null
          id?: string
          is_verified?: boolean | null
          issue_date?: string | null
          notes?: string | null
          updated_at?: string
          user_id: string
          verified_at?: string | null
        }
        Update: {
          country?: string | null
          created_at?: string
          document_number?: string | null
          document_type?: string
          expiry_date?: string | null
          file_name?: string | null
          file_url?: string | null
          id?: string
          is_verified?: boolean | null
          issue_date?: string | null
          notes?: string | null
          updated_at?: string
          user_id?: string
          verified_at?: string | null
        }
        Relationships: []
      }
      user_pins: {
        Row: {
          created_at: string
          device_id: string | null
          id: string
          pin_hash: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          device_id?: string | null
          id?: string
          pin_hash: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          device_id?: string | null
          id?: string
          pin_hash?: string
          updated_at?: string
          user_id?: string
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
      vehicles: {
        Row: {
          approval_status: string | null
          capacity: number | null
          color: string | null
          cover_image: string | null
          created_at: string | null
          created_by_uno_team: boolean | null
          currency: string | null
          deposit_amount: number | null
          description_en: string | null
          description_ru: string | null
          doors: number | null
          engine_size: string | null
          extra_km_price: number | null
          features: string[] | null
          free_km_per_day: number | null
          fuel_type: string | null
          id: string
          images: string[] | null
          is_active: boolean | null
          is_available: boolean | null
          is_featured: boolean | null
          is_verified: boolean | null
          license_plate: string | null
          location_name: string | null
          location_ru: string | null
          luggage_capacity: number | null
          min_rental_days: number | null
          name_en: string
          name_ru: string
          price_airport_transfer: number | null
          price_per_day: number | null
          price_per_hour: number | null
          provider_id: string | null
          rating: number | null
          rejection_reason: string | null
          review_count: number | null
          reviewed_at: string | null
          reviewed_by: string | null
          transmission: string | null
          uno_team_creator_id: string | null
          updated_at: string | null
          vehicle_type: string | null
          year_built: number | null
        }
        Insert: {
          approval_status?: string | null
          capacity?: number | null
          color?: string | null
          cover_image?: string | null
          created_at?: string | null
          created_by_uno_team?: boolean | null
          currency?: string | null
          deposit_amount?: number | null
          description_en?: string | null
          description_ru?: string | null
          doors?: number | null
          engine_size?: string | null
          extra_km_price?: number | null
          features?: string[] | null
          free_km_per_day?: number | null
          fuel_type?: string | null
          id?: string
          images?: string[] | null
          is_active?: boolean | null
          is_available?: boolean | null
          is_featured?: boolean | null
          is_verified?: boolean | null
          license_plate?: string | null
          location_name?: string | null
          location_ru?: string | null
          luggage_capacity?: number | null
          min_rental_days?: number | null
          name_en: string
          name_ru: string
          price_airport_transfer?: number | null
          price_per_day?: number | null
          price_per_hour?: number | null
          provider_id?: string | null
          rating?: number | null
          rejection_reason?: string | null
          review_count?: number | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          transmission?: string | null
          uno_team_creator_id?: string | null
          updated_at?: string | null
          vehicle_type?: string | null
          year_built?: number | null
        }
        Update: {
          approval_status?: string | null
          capacity?: number | null
          color?: string | null
          cover_image?: string | null
          created_at?: string | null
          created_by_uno_team?: boolean | null
          currency?: string | null
          deposit_amount?: number | null
          description_en?: string | null
          description_ru?: string | null
          doors?: number | null
          engine_size?: string | null
          extra_km_price?: number | null
          features?: string[] | null
          free_km_per_day?: number | null
          fuel_type?: string | null
          id?: string
          images?: string[] | null
          is_active?: boolean | null
          is_available?: boolean | null
          is_featured?: boolean | null
          is_verified?: boolean | null
          license_plate?: string | null
          location_name?: string | null
          location_ru?: string | null
          luggage_capacity?: number | null
          min_rental_days?: number | null
          name_en?: string
          name_ru?: string
          price_airport_transfer?: number | null
          price_per_day?: number | null
          price_per_hour?: number | null
          provider_id?: string | null
          rating?: number | null
          rejection_reason?: string | null
          review_count?: number | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          transmission?: string | null
          uno_team_creator_id?: string | null
          updated_at?: string | null
          vehicle_type?: string | null
          year_built?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "vehicles_provider_id_fkey"
            columns: ["provider_id"]
            isOneToOne: false
            referencedRelation: "providers"
            referencedColumns: ["id"]
          },
        ]
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
      vendor_subscriptions: {
        Row: {
          billing_cycle: string | null
          cancel_at_period_end: boolean | null
          cancelled_at: string | null
          created_at: string
          current_period_end: string | null
          current_period_start: string | null
          id: string
          plan_id: string
          provider_id: string
          status: string
          stripe_customer_id: string | null
          stripe_subscription_id: string | null
          updated_at: string
        }
        Insert: {
          billing_cycle?: string | null
          cancel_at_period_end?: boolean | null
          cancelled_at?: string | null
          created_at?: string
          current_period_end?: string | null
          current_period_start?: string | null
          id?: string
          plan_id: string
          provider_id: string
          status?: string
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          updated_at?: string
        }
        Update: {
          billing_cycle?: string | null
          cancel_at_period_end?: boolean | null
          cancelled_at?: string | null
          created_at?: string
          current_period_end?: string | null
          current_period_start?: string | null
          id?: string
          plan_id?: string
          provider_id?: string
          status?: string
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "vendor_subscriptions_plan_id_fkey"
            columns: ["plan_id"]
            isOneToOne: false
            referencedRelation: "subscription_plans"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "vendor_subscriptions_provider_id_fkey"
            columns: ["provider_id"]
            isOneToOne: true
            referencedRelation: "providers"
            referencedColumns: ["id"]
          },
        ]
      }
      venues: {
        Row: {
          address: string | null
          address_ru: string | null
          amenities: Json | null
          capacity: number | null
          cover_image: string | null
          created_at: string
          description_en: string | null
          description_ru: string | null
          email: string | null
          id: string
          images: string[] | null
          is_active: boolean | null
          is_featured: boolean | null
          lat: number | null
          lng: number | null
          name_en: string
          name_ru: string
          opening_hours: Json | null
          phone: string | null
          rating: number | null
          review_count: number | null
          updated_at: string
          venue_type: string
          website: string | null
        }
        Insert: {
          address?: string | null
          address_ru?: string | null
          amenities?: Json | null
          capacity?: number | null
          cover_image?: string | null
          created_at?: string
          description_en?: string | null
          description_ru?: string | null
          email?: string | null
          id?: string
          images?: string[] | null
          is_active?: boolean | null
          is_featured?: boolean | null
          lat?: number | null
          lng?: number | null
          name_en: string
          name_ru: string
          opening_hours?: Json | null
          phone?: string | null
          rating?: number | null
          review_count?: number | null
          updated_at?: string
          venue_type?: string
          website?: string | null
        }
        Update: {
          address?: string | null
          address_ru?: string | null
          amenities?: Json | null
          capacity?: number | null
          cover_image?: string | null
          created_at?: string
          description_en?: string | null
          description_ru?: string | null
          email?: string | null
          id?: string
          images?: string[] | null
          is_active?: boolean | null
          is_featured?: boolean | null
          lat?: number | null
          lng?: number | null
          name_en?: string
          name_ru?: string
          opening_hours?: Json | null
          phone?: string | null
          rating?: number | null
          review_count?: number | null
          updated_at?: string
          venue_type?: string
          website?: string | null
        }
        Relationships: []
      }
      vertical_commission_rules: {
        Row: {
          base_commission: number
          created_at: string | null
          id: string
          is_active: boolean | null
          max_commission_amount: number | null
          min_commission_amount: number | null
          notes: string | null
          tiered_rates: Json | null
          updated_at: string | null
          vertical: string
        }
        Insert: {
          base_commission?: number
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          max_commission_amount?: number | null
          min_commission_amount?: number | null
          notes?: string | null
          tiered_rates?: Json | null
          updated_at?: string | null
          vertical: string
        }
        Update: {
          base_commission?: number
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          max_commission_amount?: number | null
          min_commission_amount?: number | null
          notes?: string | null
          tiered_rates?: Json | null
          updated_at?: string | null
          vertical?: string
        }
        Relationships: []
      }
      vertical_metrics: {
        Row: {
          active_listings: number | null
          avg_order_value: number | null
          avg_rating: number | null
          bookings_count: number | null
          created_at: string | null
          date: string
          gmv: number | null
          id: string
          listings_count: number | null
          providers_count: number | null
          revenue: number | null
          take_rate: number | null
          updated_at: string | null
          vertical: string
        }
        Insert: {
          active_listings?: number | null
          avg_order_value?: number | null
          avg_rating?: number | null
          bookings_count?: number | null
          created_at?: string | null
          date: string
          gmv?: number | null
          id?: string
          listings_count?: number | null
          providers_count?: number | null
          revenue?: number | null
          take_rate?: number | null
          updated_at?: string | null
          vertical: string
        }
        Update: {
          active_listings?: number | null
          avg_order_value?: number | null
          avg_rating?: number | null
          bookings_count?: number | null
          created_at?: string | null
          date?: string
          gmv?: number | null
          id?: string
          listings_count?: number | null
          providers_count?: number | null
          revenue?: number | null
          take_rate?: number | null
          updated_at?: string | null
          vertical?: string
        }
        Relationships: []
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
      visa_services: {
        Row: {
          created_at: string | null
          currency: string | null
          description_en: string | null
          description_ru: string | null
          documents_required: Json | null
          eligible_nationalities: string[] | null
          government_fee: number | null
          id: string
          is_active: boolean | null
          is_popular: boolean | null
          max_age: number | null
          min_age: number | null
          name_en: string
          name_ru: string
          processing_days: number | null
          provider_id: string | null
          requirements: Json | null
          service_fee: number
          total_price: number | null
          updated_at: string | null
          validity_months: number | null
          visa_type: string
        }
        Insert: {
          created_at?: string | null
          currency?: string | null
          description_en?: string | null
          description_ru?: string | null
          documents_required?: Json | null
          eligible_nationalities?: string[] | null
          government_fee?: number | null
          id?: string
          is_active?: boolean | null
          is_popular?: boolean | null
          max_age?: number | null
          min_age?: number | null
          name_en: string
          name_ru: string
          processing_days?: number | null
          provider_id?: string | null
          requirements?: Json | null
          service_fee: number
          total_price?: number | null
          updated_at?: string | null
          validity_months?: number | null
          visa_type: string
        }
        Update: {
          created_at?: string | null
          currency?: string | null
          description_en?: string | null
          description_ru?: string | null
          documents_required?: Json | null
          eligible_nationalities?: string[] | null
          government_fee?: number | null
          id?: string
          is_active?: boolean | null
          is_popular?: boolean | null
          max_age?: number | null
          min_age?: number | null
          name_en?: string
          name_ru?: string
          processing_days?: number | null
          provider_id?: string | null
          requirements?: Json | null
          service_fee?: number
          total_price?: number | null
          updated_at?: string | null
          validity_months?: number | null
          visa_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "visa_services_provider_id_fkey"
            columns: ["provider_id"]
            isOneToOne: false
            referencedRelation: "legal_services"
            referencedColumns: ["id"]
          },
        ]
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
          approval_status: string | null
          available_days: string[] | null
          available_times: string[] | null
          category: string
          certification_details: string | null
          cover_image: string | null
          created_at: string
          created_by_uno_team: boolean | null
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
          rejection_reason: string | null
          requirements: string[] | null
          review_count: number | null
          reviewed_at: string | null
          reviewed_by: string | null
          safety_briefing_required: boolean | null
          title_en: string
          title_ru: string
          uno_team_creator_id: string | null
          updated_at: string
        }
        Insert: {
          age_restriction?: number | null
          approval_status?: string | null
          available_days?: string[] | null
          available_times?: string[] | null
          category?: string
          certification_details?: string | null
          cover_image?: string | null
          created_at?: string
          created_by_uno_team?: boolean | null
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
          rejection_reason?: string | null
          requirements?: string[] | null
          review_count?: number | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          safety_briefing_required?: boolean | null
          title_en: string
          title_ru: string
          uno_team_creator_id?: string | null
          updated_at?: string
        }
        Update: {
          age_restriction?: number | null
          approval_status?: string | null
          available_days?: string[] | null
          available_times?: string[] | null
          category?: string
          certification_details?: string | null
          cover_image?: string | null
          created_at?: string
          created_by_uno_team?: boolean | null
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
          rejection_reason?: string | null
          requirements?: string[] | null
          review_count?: number | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          safety_briefing_required?: boolean | null
          title_en?: string
          title_ru?: string
          uno_team_creator_id?: string | null
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
          created_by_uno_team: boolean | null
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
          rejection_reason: string | null
          review_count: number | null
          reviewed_at: string | null
          reviewed_by: string | null
          uno_team_creator_id: string | null
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
          created_by_uno_team?: boolean | null
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
          rejection_reason?: string | null
          review_count?: number | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          uno_team_creator_id?: string | null
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
          created_by_uno_team?: boolean | null
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
          rejection_reason?: string | null
          review_count?: number | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          uno_team_creator_id?: string | null
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
      calculate_daily_metrics: { Args: { p_date?: string }; Returns: undefined }
      calculate_distance_km: {
        Args: { lat1: number; lat2: number; lng1: number; lng2: number }
        Returns: number
      }
      calculate_order_cashback: {
        Args: { p_category?: string; p_order_id: string }
        Returns: number
      }
      calculate_order_totals: {
        Args: {
          p_base_amount: number
          p_provider_id?: string
          p_vertical?: string
        }
        Returns: Json
      }
      calculate_sla_deadline: {
        Args: { created_at: string; request_type: string }
        Returns: string
      }
      check_availability: {
        Args: {
          p_end_datetime?: string
          p_entity_id: string
          p_exclude_order_id?: string
          p_participants?: number
          p_provider_id: string
          p_start_datetime: string
          p_vertical: string
        }
        Returns: Json
      }
      check_property_availability: {
        Args: {
          p_check_in: string
          p_check_out: string
          p_marketplace_property_id: string
        }
        Returns: boolean
      }
      check_property_permission: {
        Args: { p_permission: string; p_property_id: string; p_user_id: string }
        Returns: boolean
      }
      check_restaurant_availability: {
        Args: {
          p_covers?: number
          p_date: string
          p_restaurant_id: string
          p_time: string
        }
        Returns: Json
      }
      check_service_slot_availability: {
        Args: {
          p_datetime: string
          p_duration_minutes?: number
          p_exclude_order_id?: string
          p_provider_id: string
          p_service_id: string
        }
        Returns: boolean
      }
      check_tour_availability: {
        Args: {
          p_date: string
          p_exclude_order_id?: string
          p_participants: number
          p_tour_id: string
        }
        Returns: {
          available: boolean
          spots_remaining: number
        }[]
      }
      check_yacht_availability: {
        Args: {
          p_end_date: string
          p_exclude_order_id?: string
          p_start_date: string
          p_yacht_id: string
        }
        Returns: boolean
      }
      create_booking_with_wallet_payment: {
        Args: {
          p_booking_type: string
          p_currency: string
          p_notes?: string
          p_provider_id?: string
          p_scheduled_at: string
          p_service_id?: string
          p_total_amount: number
          p_user_id: string
        }
        Returns: string
      }
      credit_cashback: { Args: { p_order_id: string }; Returns: Json }
      find_nearby_clinics: {
        Args: { radius_km?: number; user_lat: number; user_lng: number }
        Returns: {
          distance_km: number
          id: string
          lat: number
          lng: number
          name_en: string
          name_ru: string
        }[]
      }
      find_nearby_flower_shops: {
        Args: { radius_km?: number; user_lat: number; user_lng: number }
        Returns: {
          distance_km: number
          id: string
          lat: number
          lng: number
          name_en: string
          name_ru: string
        }[]
      }
      find_nearby_gyms: {
        Args: { radius_km?: number; user_lat: number; user_lng: number }
        Returns: {
          distance_km: number
          id: string
          lat: number
          lng: number
          name_en: string
          name_ru: string
        }[]
      }
      find_nearby_restaurants: {
        Args: { radius_km?: number; user_lat: number; user_lng: number }
        Returns: {
          distance_km: number
          id: string
          lat: number
          lng: number
          name_en: string
          name_ru: string
        }[]
      }
      find_nearby_salons: {
        Args: { radius_km?: number; user_lat: number; user_lng: number }
        Returns: {
          distance_km: number
          id: string
          lat: number
          lng: number
          name_en: string
          name_ru: string
        }[]
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
      get_order_timeline: {
        Args: { p_order_id: string }
        Returns: {
          actor_name: string
          created_at: string
          reason: string
          status: string
        }[]
      }
      get_order_vertical: {
        Args: { p_metadata: Json; p_order_type: string }
        Returns: string
      }
      get_property_user_role: {
        Args: { p_property_id: string; p_user_id: string }
        Returns: string
      }
      get_subscription_revenue: {
        Args: { p_days?: number }
        Returns: {
          active_count: number
          monthly_count: number
          total_revenue: number
          yearly_count: number
        }[]
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
      is_org_owner: { Args: { check_org_id: string }; Returns: boolean }
      is_verified_purchase: {
        Args: { p_item_id: string; p_item_type: string; p_user_id: string }
        Returns: boolean
      }
      pay_from_wallet_atomic: {
        Args: {
          p_amount: number
          p_description: string
          p_description_ru: string
          p_reference_id?: string
          p_reference_type?: string
          p_user_id: string
        }
        Returns: Json
      }
      process_payout: {
        Args: {
          p_new_status: string
          p_payment_reference?: string
          p_payout_id: string
        }
        Returns: Json
      }
      refund_wallet_booking: {
        Args: { p_booking_id: string; p_user_id: string }
        Returns: boolean
      }
      set_user_pin: {
        Args: { p_device_id?: string; p_pin: string; p_user_id: string }
        Returns: boolean
      }
      uno_team_can: {
        Args: { _action: string; _user_id: string; _vertical: string }
        Returns: boolean
      }
      verify_user_pin: {
        Args: { p_pin: string; p_user_id: string }
        Returns: boolean
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
        | "uno_team"
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
        | "tour"
        | "medical"
      intent_status:
        | "pending"
        | "processing"
        | "succeeded"
        | "failed"
        | "cancelled"
        | "refunded"
      order_item_status:
        | "pending"
        | "confirmed"
        | "in_progress"
        | "completed"
        | "cancelled"
      order_status:
        | "draft"
        | "pending"
        | "confirmed"
        | "in_progress"
        | "completed"
        | "cancelled"
        | "refunded"
        | "disputed"
      payment_method: "cash" | "wallet" | "stripe" | "bank_transfer"
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
        "uno_team",
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
        "tour",
        "medical",
      ],
      intent_status: [
        "pending",
        "processing",
        "succeeded",
        "failed",
        "cancelled",
        "refunded",
      ],
      order_item_status: [
        "pending",
        "confirmed",
        "in_progress",
        "completed",
        "cancelled",
      ],
      order_status: [
        "draft",
        "pending",
        "confirmed",
        "in_progress",
        "completed",
        "cancelled",
        "refunded",
        "disputed",
      ],
      payment_method: ["cash", "wallet", "stripe", "bank_transfer"],
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
