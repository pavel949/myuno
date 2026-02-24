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
      achievement_definitions: {
        Row: {
          bonus_amount: number | null
          category: string | null
          code: string
          created_at: string | null
          description_en: string | null
          description_ru: string | null
          icon: string | null
          id: string
          is_active: boolean | null
          name_en: string
          name_ru: string
          sort_order: number | null
        }
        Insert: {
          bonus_amount?: number | null
          category?: string | null
          code: string
          created_at?: string | null
          description_en?: string | null
          description_ru?: string | null
          icon?: string | null
          id?: string
          is_active?: boolean | null
          name_en: string
          name_ru: string
          sort_order?: number | null
        }
        Update: {
          bonus_amount?: number | null
          category?: string | null
          code?: string
          created_at?: string | null
          description_en?: string | null
          description_ru?: string | null
          icon?: string | null
          id?: string
          is_active?: boolean | null
          name_en?: string
          name_ru?: string
          sort_order?: number | null
        }
        Relationships: []
      }
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
      agent_deal_activities: {
        Row: {
          activity_type: string
          created_at: string
          deal_id: string
          description: string | null
          id: string
          stage_from: string | null
          stage_to: string | null
          user_id: string
        }
        Insert: {
          activity_type?: string
          created_at?: string
          deal_id: string
          description?: string | null
          id?: string
          stage_from?: string | null
          stage_to?: string | null
          user_id: string
        }
        Update: {
          activity_type?: string
          created_at?: string
          deal_id?: string
          description?: string | null
          id?: string
          stage_from?: string | null
          stage_to?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "agent_deal_activities_deal_id_fkey"
            columns: ["deal_id"]
            isOneToOne: false
            referencedRelation: "agent_deals"
            referencedColumns: ["id"]
          },
        ]
      }
      agent_deals: {
        Row: {
          agent_id: string
          bedrooms_min: number | null
          budget_max: number | null
          budget_min: number | null
          client_email: string | null
          client_name: string
          client_phone: string | null
          client_source: string | null
          closed_at: string | null
          commission_amount: number | null
          commission_percent: number | null
          company_id: string
          contact_id: string | null
          created_at: string
          currency: string | null
          deal_status: string
          deal_type: string
          deal_value: number | null
          id: string
          lost_reason: string | null
          next_action: string | null
          next_action_date: string | null
          notes: string | null
          preferred_districts: string[] | null
          preferred_types: string[] | null
          priority: number | null
          property_id: string | null
          stage: string
          tags: string[] | null
          updated_at: string
        }
        Insert: {
          agent_id: string
          bedrooms_min?: number | null
          budget_max?: number | null
          budget_min?: number | null
          client_email?: string | null
          client_name: string
          client_phone?: string | null
          client_source?: string | null
          closed_at?: string | null
          commission_amount?: number | null
          commission_percent?: number | null
          company_id: string
          contact_id?: string | null
          created_at?: string
          currency?: string | null
          deal_status?: string
          deal_type?: string
          deal_value?: number | null
          id?: string
          lost_reason?: string | null
          next_action?: string | null
          next_action_date?: string | null
          notes?: string | null
          preferred_districts?: string[] | null
          preferred_types?: string[] | null
          priority?: number | null
          property_id?: string | null
          stage?: string
          tags?: string[] | null
          updated_at?: string
        }
        Update: {
          agent_id?: string
          bedrooms_min?: number | null
          budget_max?: number | null
          budget_min?: number | null
          client_email?: string | null
          client_name?: string
          client_phone?: string | null
          client_source?: string | null
          closed_at?: string | null
          commission_amount?: number | null
          commission_percent?: number | null
          company_id?: string
          contact_id?: string | null
          created_at?: string
          currency?: string | null
          deal_status?: string
          deal_type?: string
          deal_value?: number | null
          id?: string
          lost_reason?: string | null
          next_action?: string | null
          next_action_date?: string | null
          notes?: string | null
          preferred_districts?: string[] | null
          preferred_types?: string[] | null
          priority?: number | null
          property_id?: string | null
          stage?: string
          tags?: string[] | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "agent_deals_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "management_companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "agent_deals_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "crm_contacts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "agent_deals_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "agent_deals_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "v_marketplace_listings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "agent_deals_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "v_owner_properties"
            referencedColumns: ["id"]
          },
        ]
      }
      ai_agent_knowledge: {
        Row: {
          agent_id: string
          created_at: string
          created_by: string | null
          id: string
          is_published: boolean
          knowledge_base: string | null
          published_at: string | null
          system_prompt: string
          version: number
        }
        Insert: {
          agent_id: string
          created_at?: string
          created_by?: string | null
          id?: string
          is_published?: boolean
          knowledge_base?: string | null
          published_at?: string | null
          system_prompt: string
          version?: number
        }
        Update: {
          agent_id?: string
          created_at?: string
          created_by?: string | null
          id?: string
          is_published?: boolean
          knowledge_base?: string | null
          published_at?: string | null
          system_prompt?: string
          version?: number
        }
        Relationships: [
          {
            foreignKeyName: "ai_agent_knowledge_agent_id_fkey"
            columns: ["agent_id"]
            isOneToOne: false
            referencedRelation: "ai_agents"
            referencedColumns: ["id"]
          },
        ]
      }
      ai_agent_logs: {
        Row: {
          agent_id: string
          created_at: string
          feedback: string | null
          id: string
          messages_count: number | null
          response_time_ms: number | null
          session_id: string | null
          tokens_used: number | null
          user_id: string | null
          user_rating: number | null
        }
        Insert: {
          agent_id: string
          created_at?: string
          feedback?: string | null
          id?: string
          messages_count?: number | null
          response_time_ms?: number | null
          session_id?: string | null
          tokens_used?: number | null
          user_id?: string | null
          user_rating?: number | null
        }
        Update: {
          agent_id?: string
          created_at?: string
          feedback?: string | null
          id?: string
          messages_count?: number | null
          response_time_ms?: number | null
          session_id?: string | null
          tokens_used?: number | null
          user_id?: string | null
          user_rating?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "ai_agent_logs_agent_id_fkey"
            columns: ["agent_id"]
            isOneToOne: false
            referencedRelation: "ai_agents"
            referencedColumns: ["id"]
          },
        ]
      }
      ai_agents: {
        Row: {
          agent_type: string | null
          created_at: string
          description_en: string | null
          description_ru: string | null
          icon: string | null
          id: string
          is_active: boolean
          is_public: boolean
          max_tokens: number
          model: string
          name_en: string
          name_ru: string
          slug: string
          target_audience: string[] | null
          temperature: number
          tone: string | null
          updated_at: string
        }
        Insert: {
          agent_type?: string | null
          created_at?: string
          description_en?: string | null
          description_ru?: string | null
          icon?: string | null
          id?: string
          is_active?: boolean
          is_public?: boolean
          max_tokens?: number
          model?: string
          name_en: string
          name_ru: string
          slug: string
          target_audience?: string[] | null
          temperature?: number
          tone?: string | null
          updated_at?: string
        }
        Update: {
          agent_type?: string | null
          created_at?: string
          description_en?: string | null
          description_ru?: string | null
          icon?: string | null
          id?: string
          is_active?: boolean
          is_public?: boolean
          max_tokens?: number
          model?: string
          name_en?: string
          name_ru?: string
          slug?: string
          target_audience?: string[] | null
          temperature?: number
          tone?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      ai_artifacts: {
        Row: {
          admin_action: string | null
          admin_notes: string | null
          agent_id: string | null
          agent_slug: string
          artifact_type: string
          correlation_id: string | null
          created_at: string
          data: Json
          entity_id: string
          entity_type: string
          expires_at: string | null
          feedback_at: string | null
          feedback_comment: string | null
          feedback_rating: number | null
          id: string
          is_reviewed: boolean | null
          primary_score: number | null
          reviewed_at: string | null
          reviewed_by: string | null
          verdict: string | null
        }
        Insert: {
          admin_action?: string | null
          admin_notes?: string | null
          agent_id?: string | null
          agent_slug: string
          artifact_type: string
          correlation_id?: string | null
          created_at?: string
          data: Json
          entity_id: string
          entity_type: string
          expires_at?: string | null
          feedback_at?: string | null
          feedback_comment?: string | null
          feedback_rating?: number | null
          id?: string
          is_reviewed?: boolean | null
          primary_score?: number | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          verdict?: string | null
        }
        Update: {
          admin_action?: string | null
          admin_notes?: string | null
          agent_id?: string | null
          agent_slug?: string
          artifact_type?: string
          correlation_id?: string | null
          created_at?: string
          data?: Json
          entity_id?: string
          entity_type?: string
          expires_at?: string | null
          feedback_at?: string | null
          feedback_comment?: string | null
          feedback_rating?: number | null
          id?: string
          is_reviewed?: boolean | null
          primary_score?: number | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          verdict?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ai_artifacts_agent_id_fkey"
            columns: ["agent_id"]
            isOneToOne: false
            referencedRelation: "ai_agents"
            referencedColumns: ["id"]
          },
        ]
      }
      ai_intake_sessions: {
        Row: {
          admin_id: string
          approved_count: number | null
          created_at: string | null
          discarded_count: number | null
          file_name: string | null
          id: string
          input_mode: string
          items: Json | null
          items_count: number | null
          processed_count: number | null
          raw_input: string | null
          status: string | null
          updated_at: string | null
          uploaded_images: string[] | null
        }
        Insert: {
          admin_id: string
          approved_count?: number | null
          created_at?: string | null
          discarded_count?: number | null
          file_name?: string | null
          id?: string
          input_mode: string
          items?: Json | null
          items_count?: number | null
          processed_count?: number | null
          raw_input?: string | null
          status?: string | null
          updated_at?: string | null
          uploaded_images?: string[] | null
        }
        Update: {
          admin_id?: string
          approved_count?: number | null
          created_at?: string | null
          discarded_count?: number | null
          file_name?: string | null
          id?: string
          input_mode?: string
          items?: Json | null
          items_count?: number | null
          processed_count?: number | null
          raw_input?: string | null
          status?: string | null
          updated_at?: string | null
          uploaded_images?: string[] | null
        }
        Relationships: []
      }
      airport_booking_addons: {
        Row: {
          addon_service_id: string
          booking_id: string
          created_at: string | null
          id: string
          quantity: number | null
          total_price: number
          unit_price: number
        }
        Insert: {
          addon_service_id: string
          booking_id: string
          created_at?: string | null
          id?: string
          quantity?: number | null
          total_price: number
          unit_price: number
        }
        Update: {
          addon_service_id?: string
          booking_id?: string
          created_at?: string | null
          id?: string
          quantity?: number | null
          total_price?: number
          unit_price?: number
        }
        Relationships: [
          {
            foreignKeyName: "airport_booking_addons_addon_service_id_fkey"
            columns: ["addon_service_id"]
            isOneToOne: false
            referencedRelation: "airport_services"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "airport_booking_addons_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "airport_bookings"
            referencedColumns: ["id"]
          },
        ]
      }
      airport_bookings: {
        Row: {
          addons_total: number | null
          airline: string | null
          airport_code: string
          assigned_at: string | null
          base_price: number
          cancellation_reason: string | null
          cancelled_at: string | null
          completed_at: string | null
          contact_email: string | null
          contact_whatsapp: string | null
          created_at: string | null
          currency: string | null
          direction: string
          flight_date: string
          flight_number: string
          flight_time: string
          id: string
          is_night_flight: boolean | null
          linked_transfer_booking_id: string | null
          night_surcharge: number | null
          order_id: string | null
          preferred_language: string | null
          service_id: string
          special_notes: string | null
          status: string
          supplier_id: string | null
          total_price: number
          updated_at: string | null
          user_id: string
        }
        Insert: {
          addons_total?: number | null
          airline?: string | null
          airport_code?: string
          assigned_at?: string | null
          base_price: number
          cancellation_reason?: string | null
          cancelled_at?: string | null
          completed_at?: string | null
          contact_email?: string | null
          contact_whatsapp?: string | null
          created_at?: string | null
          currency?: string | null
          direction: string
          flight_date: string
          flight_number: string
          flight_time: string
          id?: string
          is_night_flight?: boolean | null
          linked_transfer_booking_id?: string | null
          night_surcharge?: number | null
          order_id?: string | null
          preferred_language?: string | null
          service_id: string
          special_notes?: string | null
          status?: string
          supplier_id?: string | null
          total_price: number
          updated_at?: string | null
          user_id: string
        }
        Update: {
          addons_total?: number | null
          airline?: string | null
          airport_code?: string
          assigned_at?: string | null
          base_price?: number
          cancellation_reason?: string | null
          cancelled_at?: string | null
          completed_at?: string | null
          contact_email?: string | null
          contact_whatsapp?: string | null
          created_at?: string | null
          currency?: string | null
          direction?: string
          flight_date?: string
          flight_number?: string
          flight_time?: string
          id?: string
          is_night_flight?: boolean | null
          linked_transfer_booking_id?: string | null
          night_surcharge?: number | null
          order_id?: string | null
          preferred_language?: string | null
          service_id?: string
          special_notes?: string | null
          status?: string
          supplier_id?: string | null
          total_price?: number
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "airport_bookings_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "airport_bookings_service_id_fkey"
            columns: ["service_id"]
            isOneToOne: false
            referencedRelation: "airport_services"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "airport_bookings_supplier_id_fkey"
            columns: ["supplier_id"]
            isOneToOne: false
            referencedRelation: "airport_suppliers"
            referencedColumns: ["id"]
          },
        ]
      }
      airport_passengers: {
        Row: {
          booking_id: string
          created_at: string | null
          date_of_birth: string
          first_name: string
          id: string
          is_primary: boolean | null
          last_name: string
          nationality: string
          passport_number: string
          sort_order: number | null
        }
        Insert: {
          booking_id: string
          created_at?: string | null
          date_of_birth: string
          first_name: string
          id?: string
          is_primary?: boolean | null
          last_name: string
          nationality: string
          passport_number: string
          sort_order?: number | null
        }
        Update: {
          booking_id?: string
          created_at?: string | null
          date_of_birth?: string
          first_name?: string
          id?: string
          is_primary?: boolean | null
          last_name?: string
          nationality?: string
          passport_number?: string
          sort_order?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "airport_passengers_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "airport_bookings"
            referencedColumns: ["id"]
          },
        ]
      }
      airport_services: {
        Row: {
          airport_code: string
          base_price: number
          bundle_components: Json | null
          bundle_savings_text_en: string | null
          bundle_savings_text_ru: string | null
          created_at: string | null
          currency: string
          cutoff_hours: number | null
          description_en: string | null
          description_ru: string | null
          description_th: string | null
          direction: string | null
          icon: string | null
          id: string
          includes_items: string[] | null
          is_active: boolean | null
          max_passengers: number | null
          name_en: string
          name_ru: string
          name_th: string | null
          night_end: string | null
          night_start: string | null
          night_surcharge: number | null
          service_type: string
          sku: string
          sort_order: number | null
          supplier_id: string | null
          updated_at: string | null
        }
        Insert: {
          airport_code?: string
          base_price?: number
          bundle_components?: Json | null
          bundle_savings_text_en?: string | null
          bundle_savings_text_ru?: string | null
          created_at?: string | null
          currency?: string
          cutoff_hours?: number | null
          description_en?: string | null
          description_ru?: string | null
          description_th?: string | null
          direction?: string | null
          icon?: string | null
          id?: string
          includes_items?: string[] | null
          is_active?: boolean | null
          max_passengers?: number | null
          name_en: string
          name_ru: string
          name_th?: string | null
          night_end?: string | null
          night_start?: string | null
          night_surcharge?: number | null
          service_type: string
          sku: string
          sort_order?: number | null
          supplier_id?: string | null
          updated_at?: string | null
        }
        Update: {
          airport_code?: string
          base_price?: number
          bundle_components?: Json | null
          bundle_savings_text_en?: string | null
          bundle_savings_text_ru?: string | null
          created_at?: string | null
          currency?: string
          cutoff_hours?: number | null
          description_en?: string | null
          description_ru?: string | null
          description_th?: string | null
          direction?: string | null
          icon?: string | null
          id?: string
          includes_items?: string[] | null
          is_active?: boolean | null
          max_passengers?: number | null
          name_en?: string
          name_ru?: string
          name_th?: string | null
          night_end?: string | null
          night_start?: string | null
          night_surcharge?: number | null
          service_type?: string
          sku?: string
          sort_order?: number | null
          supplier_id?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "airport_services_supplier_id_fkey"
            columns: ["supplier_id"]
            isOneToOne: false
            referencedRelation: "airport_suppliers"
            referencedColumns: ["id"]
          },
        ]
      }
      airport_suppliers: {
        Row: {
          airport_code: string
          commission_percent: number | null
          contact_email: string | null
          contact_phone: string | null
          contact_whatsapp: string | null
          created_at: string | null
          id: string
          is_active: boolean | null
          max_concurrent_jobs: number | null
          name_en: string
          name_ru: string | null
          priority: number | null
          sla_minutes: number | null
          updated_at: string | null
        }
        Insert: {
          airport_code?: string
          commission_percent?: number | null
          contact_email?: string | null
          contact_phone?: string | null
          contact_whatsapp?: string | null
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          max_concurrent_jobs?: number | null
          name_en: string
          name_ru?: string | null
          priority?: number | null
          sla_minutes?: number | null
          updated_at?: string | null
        }
        Update: {
          airport_code?: string
          commission_percent?: number | null
          contact_email?: string | null
          contact_phone?: string | null
          contact_whatsapp?: string | null
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          max_concurrent_jobs?: number | null
          name_en?: string
          name_ru?: string | null
          priority?: number | null
          sla_minutes?: number | null
          updated_at?: string | null
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
      banks: {
        Row: {
          accepts_foreigners: boolean | null
          bank_type: string | null
          cover_image: string | null
          created_at: string | null
          currency: string | null
          description_en: string | null
          description_ru: string | null
          email: string | null
          features: string[] | null
          id: string
          is_active: boolean | null
          is_featured: boolean | null
          languages: string[] | null
          logo: string | null
          min_deposit: number | null
          mobile_app: boolean | null
          name_en: string
          name_ru: string
          online_banking: boolean | null
          phone: string | null
          provider_id: string | null
          rating: number | null
          review_count: number | null
          services: string[] | null
          swift_code: string | null
          updated_at: string | null
          website: string | null
        }
        Insert: {
          accepts_foreigners?: boolean | null
          bank_type?: string | null
          cover_image?: string | null
          created_at?: string | null
          currency?: string | null
          description_en?: string | null
          description_ru?: string | null
          email?: string | null
          features?: string[] | null
          id?: string
          is_active?: boolean | null
          is_featured?: boolean | null
          languages?: string[] | null
          logo?: string | null
          min_deposit?: number | null
          mobile_app?: boolean | null
          name_en: string
          name_ru: string
          online_banking?: boolean | null
          phone?: string | null
          provider_id?: string | null
          rating?: number | null
          review_count?: number | null
          services?: string[] | null
          swift_code?: string | null
          updated_at?: string | null
          website?: string | null
        }
        Update: {
          accepts_foreigners?: boolean | null
          bank_type?: string | null
          cover_image?: string | null
          created_at?: string | null
          currency?: string | null
          description_en?: string | null
          description_ru?: string | null
          email?: string | null
          features?: string[] | null
          id?: string
          is_active?: boolean | null
          is_featured?: boolean | null
          languages?: string[] | null
          logo?: string | null
          min_deposit?: number | null
          mobile_app?: boolean | null
          name_en?: string
          name_ru?: string
          online_banking?: boolean | null
          phone?: string | null
          provider_id?: string | null
          rating?: number | null
          review_count?: number | null
          services?: string[] | null
          swift_code?: string | null
          updated_at?: string | null
          website?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "banks_provider_id_fkey"
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
      booking_cross_sell_offers: {
        Row: {
          booking_id: string
          created_at: string
          currency: string | null
          discount_percent: number | null
          id: string
          reasoning: string | null
          service_id: string | null
          service_name: string
          service_type: string
          status: string
          suggested_price: number | null
          updated_at: string
        }
        Insert: {
          booking_id: string
          created_at?: string
          currency?: string | null
          discount_percent?: number | null
          id?: string
          reasoning?: string | null
          service_id?: string | null
          service_name: string
          service_type: string
          status?: string
          suggested_price?: number | null
          updated_at?: string
        }
        Update: {
          booking_id?: string
          created_at?: string
          currency?: string | null
          discount_percent?: number | null
          id?: string
          reasoning?: string | null
          service_id?: string | null
          service_name?: string
          service_type?: string
          status?: string
          suggested_price?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "booking_cross_sell_offers_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "property_bookings"
            referencedColumns: ["id"]
          },
        ]
      }
      booking_inventory_reports: {
        Row: {
          booking_id: string
          created_at: string | null
          currency: string | null
          current_condition: string
          damage_description: string | null
          estimated_damage_cost: number | null
          id: string
          inventory_item_id: string
          linked_to_deposit: boolean | null
          photos: string[] | null
          previous_condition: string | null
          report_type: string
          reported_at: string | null
          reported_by: string | null
          resolution_notes: string | null
          resolved_at: string | null
        }
        Insert: {
          booking_id: string
          created_at?: string | null
          currency?: string | null
          current_condition: string
          damage_description?: string | null
          estimated_damage_cost?: number | null
          id?: string
          inventory_item_id: string
          linked_to_deposit?: boolean | null
          photos?: string[] | null
          previous_condition?: string | null
          report_type: string
          reported_at?: string | null
          reported_by?: string | null
          resolution_notes?: string | null
          resolved_at?: string | null
        }
        Update: {
          booking_id?: string
          created_at?: string | null
          currency?: string | null
          current_condition?: string
          damage_description?: string | null
          estimated_damage_cost?: number | null
          id?: string
          inventory_item_id?: string
          linked_to_deposit?: boolean | null
          photos?: string[] | null
          previous_condition?: string | null
          report_type?: string
          reported_at?: string | null
          reported_by?: string | null
          resolution_notes?: string | null
          resolved_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "booking_inventory_reports_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "property_bookings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "booking_inventory_reports_inventory_item_id_fkey"
            columns: ["inventory_item_id"]
            isOneToOne: false
            referencedRelation: "property_inventory_items"
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
      booking_message_rules: {
        Row: {
          channel: string
          created_at: string
          custom_body: string | null
          custom_body_ru: string | null
          custom_subject: string | null
          custom_subject_ru: string | null
          delay_hours: number
          id: string
          is_active: boolean
          owner_id: string
          property_id: string | null
          sort_order: number | null
          template_id: string | null
          trigger_event: string
          updated_at: string
        }
        Insert: {
          channel?: string
          created_at?: string
          custom_body?: string | null
          custom_body_ru?: string | null
          custom_subject?: string | null
          custom_subject_ru?: string | null
          delay_hours?: number
          id?: string
          is_active?: boolean
          owner_id: string
          property_id?: string | null
          sort_order?: number | null
          template_id?: string | null
          trigger_event: string
          updated_at?: string
        }
        Update: {
          channel?: string
          created_at?: string
          custom_body?: string | null
          custom_body_ru?: string | null
          custom_subject?: string | null
          custom_subject_ru?: string | null
          delay_hours?: number
          id?: string
          is_active?: boolean
          owner_id?: string
          property_id?: string | null
          sort_order?: number | null
          template_id?: string | null
          trigger_event?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "booking_message_rules_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "booking_message_rules_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "v_marketplace_listings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "booking_message_rules_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "v_owner_properties"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "booking_message_rules_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "message_templates"
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
      booking_meter_readings: {
        Row: {
          booking_id: string
          created_at: string | null
          id: string
          meter_id: string
          notes: string | null
          photo_url: string | null
          reading_date: string | null
          reading_type: string
          reading_value: number
          recorded_by: string | null
        }
        Insert: {
          booking_id: string
          created_at?: string | null
          id?: string
          meter_id: string
          notes?: string | null
          photo_url?: string | null
          reading_date?: string | null
          reading_type: string
          reading_value: number
          recorded_by?: string | null
        }
        Update: {
          booking_id?: string
          created_at?: string | null
          id?: string
          meter_id?: string
          notes?: string | null
          photo_url?: string | null
          reading_date?: string | null
          reading_type?: string
          reading_value?: number
          recorded_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "booking_meter_readings_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "property_bookings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "booking_meter_readings_meter_id_fkey"
            columns: ["meter_id"]
            isOneToOne: false
            referencedRelation: "property_meters"
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
      booking_operations: {
        Row: {
          actual_check_in_at: string | null
          actual_check_out_at: string | null
          booking_id: string
          check_in_notes: string | null
          check_in_photos: string[] | null
          check_out_notes: string | null
          check_out_photos: string[] | null
          checked_in_by: string | null
          checked_out_by: string | null
          cleaning_completed_at: string | null
          cleaning_notes: string | null
          cleaning_required: boolean | null
          created_at: string | null
          deposit_amount: number | null
          deposit_currency: string | null
          deposit_deduction_amount: number | null
          deposit_deduction_photos: string[] | null
          deposit_deduction_reason: string | null
          deposit_method: string | null
          deposit_receipt_url: string | null
          deposit_received_at: string | null
          deposit_received_by: string | null
          deposit_return_status: string | null
          deposit_returned_amount: number | null
          deposit_returned_at: string | null
          deposit_returned_by: string | null
          id: string
          updated_at: string | null
        }
        Insert: {
          actual_check_in_at?: string | null
          actual_check_out_at?: string | null
          booking_id: string
          check_in_notes?: string | null
          check_in_photos?: string[] | null
          check_out_notes?: string | null
          check_out_photos?: string[] | null
          checked_in_by?: string | null
          checked_out_by?: string | null
          cleaning_completed_at?: string | null
          cleaning_notes?: string | null
          cleaning_required?: boolean | null
          created_at?: string | null
          deposit_amount?: number | null
          deposit_currency?: string | null
          deposit_deduction_amount?: number | null
          deposit_deduction_photos?: string[] | null
          deposit_deduction_reason?: string | null
          deposit_method?: string | null
          deposit_receipt_url?: string | null
          deposit_received_at?: string | null
          deposit_received_by?: string | null
          deposit_return_status?: string | null
          deposit_returned_amount?: number | null
          deposit_returned_at?: string | null
          deposit_returned_by?: string | null
          id?: string
          updated_at?: string | null
        }
        Update: {
          actual_check_in_at?: string | null
          actual_check_out_at?: string | null
          booking_id?: string
          check_in_notes?: string | null
          check_in_photos?: string[] | null
          check_out_notes?: string | null
          check_out_photos?: string[] | null
          checked_in_by?: string | null
          checked_out_by?: string | null
          cleaning_completed_at?: string | null
          cleaning_notes?: string | null
          cleaning_required?: boolean | null
          created_at?: string | null
          deposit_amount?: number | null
          deposit_currency?: string | null
          deposit_deduction_amount?: number | null
          deposit_deduction_photos?: string[] | null
          deposit_deduction_reason?: string | null
          deposit_method?: string | null
          deposit_receipt_url?: string | null
          deposit_received_at?: string | null
          deposit_received_by?: string | null
          deposit_return_status?: string | null
          deposit_returned_amount?: number | null
          deposit_returned_at?: string | null
          deposit_returned_by?: string | null
          id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "booking_operations_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: true
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
      booking_scheduled_messages: {
        Row: {
          body: string
          booking_id: string
          channel: string
          created_at: string
          error_message: string | null
          guest_user_id: string
          id: string
          metadata: Json | null
          owner_id: string
          property_id: string
          rule_id: string | null
          scheduled_at: string
          sent_at: string | null
          status: string
          subject: string | null
        }
        Insert: {
          body: string
          booking_id: string
          channel?: string
          created_at?: string
          error_message?: string | null
          guest_user_id: string
          id?: string
          metadata?: Json | null
          owner_id: string
          property_id: string
          rule_id?: string | null
          scheduled_at: string
          sent_at?: string | null
          status?: string
          subject?: string | null
        }
        Update: {
          body?: string
          booking_id?: string
          channel?: string
          created_at?: string
          error_message?: string | null
          guest_user_id?: string
          id?: string
          metadata?: Json | null
          owner_id?: string
          property_id?: string
          rule_id?: string | null
          scheduled_at?: string
          sent_at?: string | null
          status?: string
          subject?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "booking_scheduled_messages_rule_id_fkey"
            columns: ["rule_id"]
            isOneToOne: false
            referencedRelation: "booking_message_rules"
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
      booking_vouchers: {
        Row: {
          booking_id: string | null
          booking_type: string
          created_at: string
          id: string
          is_used: boolean | null
          metadata: Json | null
          order_id: string | null
          pdf_url: string | null
          qr_code_data: string
          status: string | null
          updated_at: string
          used_at: string | null
          used_by: string | null
          user_id: string
          valid_from: string
          valid_until: string | null
          voucher_number: string
        }
        Insert: {
          booking_id?: string | null
          booking_type: string
          created_at?: string
          id?: string
          is_used?: boolean | null
          metadata?: Json | null
          order_id?: string | null
          pdf_url?: string | null
          qr_code_data: string
          status?: string | null
          updated_at?: string
          used_at?: string | null
          used_by?: string | null
          user_id: string
          valid_from?: string
          valid_until?: string | null
          voucher_number: string
        }
        Update: {
          booking_id?: string | null
          booking_type?: string
          created_at?: string
          id?: string
          is_used?: boolean | null
          metadata?: Json | null
          order_id?: string | null
          pdf_url?: string | null
          qr_code_data?: string
          status?: string | null
          updated_at?: string
          used_at?: string | null
          used_by?: string | null
          user_id?: string
          valid_from?: string
          valid_until?: string | null
          voucher_number?: string
        }
        Relationships: [
          {
            foreignKeyName: "booking_vouchers_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
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
          staff_id: string | null
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
          staff_id?: string | null
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
          staff_id?: string | null
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
          {
            foreignKeyName: "bookings_staff_id_fkey"
            columns: ["staff_id"]
            isOneToOne: false
            referencedRelation: "salon_staff"
            referencedColumns: ["id"]
          },
        ]
      }
      bouquets: {
        Row: {
          approval_status: string | null
          availability_note: string | null
          bestseller_rank: number | null
          box_type: string | null
          category: string | null
          collection_slug: string | null
          color_palette: string | null
          colors: string[] | null
          composition_en: string | null
          composition_ru: string | null
          cost_thb: number | null
          created_at: string
          created_by_uno_team: boolean | null
          currency: string | null
          description_en: string | null
          description_ru: string | null
          emotional_trigger_tag: string | null
          flowers: string[] | null
          id: string
          image: string | null
          images: string[] | null
          is_active: boolean | null
          is_popular: boolean | null
          is_verified: boolean | null
          lifeos_tags: string[] | null
          margin_percent: number | null
          name_en: string
          name_ru: string
          occasion_tags: string[] | null
          preparation_time_minutes: number | null
          price: number
          scarcity_level: string | null
          seo_slug: string | null
          shop_id: string
          short_description_en: string | null
          short_description_ru: string | null
          size: string | null
          size_variants: Json | null
          sku: string | null
          social_proof_badge: string | null
          stock_quantity: number | null
          style: string | null
          uno_team_creator_id: string | null
          urgency_badge: string | null
        }
        Insert: {
          approval_status?: string | null
          availability_note?: string | null
          bestseller_rank?: number | null
          box_type?: string | null
          category?: string | null
          collection_slug?: string | null
          color_palette?: string | null
          colors?: string[] | null
          composition_en?: string | null
          composition_ru?: string | null
          cost_thb?: number | null
          created_at?: string
          created_by_uno_team?: boolean | null
          currency?: string | null
          description_en?: string | null
          description_ru?: string | null
          emotional_trigger_tag?: string | null
          flowers?: string[] | null
          id?: string
          image?: string | null
          images?: string[] | null
          is_active?: boolean | null
          is_popular?: boolean | null
          is_verified?: boolean | null
          lifeos_tags?: string[] | null
          margin_percent?: number | null
          name_en: string
          name_ru: string
          occasion_tags?: string[] | null
          preparation_time_minutes?: number | null
          price: number
          scarcity_level?: string | null
          seo_slug?: string | null
          shop_id: string
          short_description_en?: string | null
          short_description_ru?: string | null
          size?: string | null
          size_variants?: Json | null
          sku?: string | null
          social_proof_badge?: string | null
          stock_quantity?: number | null
          style?: string | null
          uno_team_creator_id?: string | null
          urgency_badge?: string | null
        }
        Update: {
          approval_status?: string | null
          availability_note?: string | null
          bestseller_rank?: number | null
          box_type?: string | null
          category?: string | null
          collection_slug?: string | null
          color_palette?: string | null
          colors?: string[] | null
          composition_en?: string | null
          composition_ru?: string | null
          cost_thb?: number | null
          created_at?: string
          created_by_uno_team?: boolean | null
          currency?: string | null
          description_en?: string | null
          description_ru?: string | null
          emotional_trigger_tag?: string | null
          flowers?: string[] | null
          id?: string
          image?: string | null
          images?: string[] | null
          is_active?: boolean | null
          is_popular?: boolean | null
          is_verified?: boolean | null
          lifeos_tags?: string[] | null
          margin_percent?: number | null
          name_en?: string
          name_ru?: string
          occasion_tags?: string[] | null
          preparation_time_minutes?: number | null
          price?: number
          scarcity_level?: string | null
          seo_slug?: string | null
          shop_id?: string
          short_description_en?: string | null
          short_description_ru?: string | null
          size?: string | null
          size_variants?: Json | null
          sku?: string | null
          social_proof_badge?: string | null
          stock_quantity?: number | null
          style?: string | null
          uno_team_creator_id?: string | null
          urgency_badge?: string | null
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
      bundle_offers: {
        Row: {
          cover_image: string | null
          created_at: string
          currency: string | null
          current_purchases: number | null
          description_en: string | null
          description_ru: string | null
          discount_fixed: number | null
          discount_percent: number | null
          final_price: number | null
          id: string
          images: string[] | null
          is_active: boolean | null
          is_featured: boolean | null
          items: Json
          max_purchases: number | null
          name_en: string
          name_ru: string
          original_total: number | null
          tags: string[] | null
          updated_at: string
          valid_from: string | null
          valid_until: string | null
        }
        Insert: {
          cover_image?: string | null
          created_at?: string
          currency?: string | null
          current_purchases?: number | null
          description_en?: string | null
          description_ru?: string | null
          discount_fixed?: number | null
          discount_percent?: number | null
          final_price?: number | null
          id?: string
          images?: string[] | null
          is_active?: boolean | null
          is_featured?: boolean | null
          items?: Json
          max_purchases?: number | null
          name_en: string
          name_ru: string
          original_total?: number | null
          tags?: string[] | null
          updated_at?: string
          valid_from?: string | null
          valid_until?: string | null
        }
        Update: {
          cover_image?: string | null
          created_at?: string
          currency?: string | null
          current_purchases?: number | null
          description_en?: string | null
          description_ru?: string | null
          discount_fixed?: number | null
          discount_percent?: number | null
          final_price?: number | null
          id?: string
          images?: string[] | null
          is_active?: boolean | null
          is_featured?: boolean | null
          items?: Json
          max_purchases?: number | null
          name_en?: string
          name_ru?: string
          original_total?: number | null
          tags?: string[] | null
          updated_at?: string
          valid_from?: string | null
          valid_until?: string | null
        }
        Relationships: []
      }
      calendar_sync_logs: {
        Row: {
          calendar_id: string | null
          created_at: string | null
          error: string | null
          events_added: number | null
          events_found: number | null
          events_removed: number | null
          events_updated: number | null
          id: string
          owner_id: string
          property_id: string | null
          sync_duration_ms: number | null
          sync_type: string | null
          synced_at: string | null
        }
        Insert: {
          calendar_id?: string | null
          created_at?: string | null
          error?: string | null
          events_added?: number | null
          events_found?: number | null
          events_removed?: number | null
          events_updated?: number | null
          id?: string
          owner_id: string
          property_id?: string | null
          sync_duration_ms?: number | null
          sync_type?: string | null
          synced_at?: string | null
        }
        Update: {
          calendar_id?: string | null
          created_at?: string | null
          error?: string | null
          events_added?: number | null
          events_found?: number | null
          events_removed?: number | null
          events_updated?: number | null
          id?: string
          owner_id?: string
          property_id?: string | null
          sync_duration_ms?: number | null
          sync_type?: string | null
          synced_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "calendar_sync_logs_calendar_id_fkey"
            columns: ["calendar_id"]
            isOneToOne: false
            referencedRelation: "property_external_calendars"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "calendar_sync_logs_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "owner_properties"
            referencedColumns: ["id"]
          },
        ]
      }
      cancellation_policies: {
        Row: {
          code: string
          created_at: string
          description_en: string | null
          description_ru: string | null
          full_refund_hours: number | null
          id: string
          is_active: boolean | null
          name_en: string
          name_ru: string
          no_refund_hours: number | null
          partial_refund_hours: number | null
          partial_refund_percent: number | null
          sort_order: number | null
        }
        Insert: {
          code: string
          created_at?: string
          description_en?: string | null
          description_ru?: string | null
          full_refund_hours?: number | null
          id?: string
          is_active?: boolean | null
          name_en: string
          name_ru: string
          no_refund_hours?: number | null
          partial_refund_hours?: number | null
          partial_refund_percent?: number | null
          sort_order?: number | null
        }
        Update: {
          code?: string
          created_at?: string
          description_en?: string | null
          description_ru?: string | null
          full_refund_hours?: number | null
          id?: string
          is_active?: boolean | null
          name_en?: string
          name_ru?: string
          no_refund_hours?: number | null
          partial_refund_hours?: number | null
          partial_refund_percent?: number | null
          sort_order?: number | null
        }
        Relationships: []
      }
      cancellation_policy_rules: {
        Row: {
          created_at: string | null
          deposit_refundable: boolean | null
          description_en: string | null
          description_ru: string | null
          full_refund_hours: number | null
          id: string
          is_active: boolean | null
          name_en: string
          name_ru: string
          no_refund_hours: number | null
          non_refundable_discount: number | null
          partial_refund_hours: number | null
          partial_refund_percent: number | null
          policy_code: string
          sort_order: number | null
        }
        Insert: {
          created_at?: string | null
          deposit_refundable?: boolean | null
          description_en?: string | null
          description_ru?: string | null
          full_refund_hours?: number | null
          id?: string
          is_active?: boolean | null
          name_en: string
          name_ru: string
          no_refund_hours?: number | null
          non_refundable_discount?: number | null
          partial_refund_hours?: number | null
          partial_refund_percent?: number | null
          policy_code: string
          sort_order?: number | null
        }
        Update: {
          created_at?: string | null
          deposit_refundable?: boolean | null
          description_en?: string | null
          description_ru?: string | null
          full_refund_hours?: number | null
          id?: string
          is_active?: boolean | null
          name_en?: string
          name_ru?: string
          no_refund_hours?: number | null
          non_refundable_discount?: number | null
          partial_refund_hours?: number | null
          partial_refund_percent?: number | null
          policy_code?: string
          sort_order?: number | null
        }
        Relationships: []
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
      catalog_facet_definitions: {
        Row: {
          created_at: string
          entity_type: string
          facet_key: string
          facet_label_en: string
          facet_label_ru: string | null
          facet_type: string
          id: string
          is_active: boolean
          sort_order: number
          source_field: string
        }
        Insert: {
          created_at?: string
          entity_type: string
          facet_key: string
          facet_label_en: string
          facet_label_ru?: string | null
          facet_type?: string
          id?: string
          is_active?: boolean
          sort_order?: number
          source_field: string
        }
        Update: {
          created_at?: string
          entity_type?: string
          facet_key?: string
          facet_label_en?: string
          facet_label_ru?: string | null
          facet_type?: string
          id?: string
          is_active?: boolean
          sort_order?: number
          source_field?: string
        }
        Relationships: []
      }
      catalog_hygiene_log: {
        Row: {
          created_at: string
          details: Json
          entity_id: string | null
          entity_type: string | null
          id: string
          operation_type: string
          performed_by: string
        }
        Insert: {
          created_at?: string
          details?: Json
          entity_id?: string | null
          entity_type?: string | null
          id?: string
          operation_type: string
          performed_by?: string
        }
        Update: {
          created_at?: string
          details?: Json
          entity_id?: string | null
          entity_type?: string | null
          id?: string
          operation_type?: string
          performed_by?: string
        }
        Relationships: []
      }
      catalog_life_map: {
        Row: {
          created_at: string | null
          entity_id: string
          entity_type: string
          id: string
          life_situation_id: string | null
          role_scope: string[] | null
          rules: Json | null
          updated_at: string | null
          weight: number | null
        }
        Insert: {
          created_at?: string | null
          entity_id: string
          entity_type: string
          id?: string
          life_situation_id?: string | null
          role_scope?: string[] | null
          rules?: Json | null
          updated_at?: string | null
          weight?: number | null
        }
        Update: {
          created_at?: string | null
          entity_id?: string
          entity_type?: string
          id?: string
          life_situation_id?: string | null
          role_scope?: string[] | null
          rules?: Json | null
          updated_at?: string | null
          weight?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "catalog_life_map_life_situation_id_fkey"
            columns: ["life_situation_id"]
            isOneToOne: false
            referencedRelation: "catalog_life_map_v2"
            referencedColumns: ["life_situation_id"]
          },
          {
            foreignKeyName: "catalog_life_map_life_situation_id_fkey"
            columns: ["life_situation_id"]
            isOneToOne: false
            referencedRelation: "life_situations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "catalog_life_map_life_situation_id_fkey"
            columns: ["life_situation_id"]
            isOneToOne: false
            referencedRelation: "lifeos_health_view"
            referencedColumns: ["situation_id"]
          },
        ]
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
      category_suggestions: {
        Row: {
          admin_notes: string | null
          category_name_en: string
          category_name_ru: string | null
          created_at: string
          description: string | null
          example_items: string | null
          id: string
          merged_to_category_id: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          status: string
          suggestion_type: string
          updated_at: string
          user_id: string | null
        }
        Insert: {
          admin_notes?: string | null
          category_name_en: string
          category_name_ru?: string | null
          created_at?: string
          description?: string | null
          example_items?: string | null
          id?: string
          merged_to_category_id?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
          suggestion_type?: string
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          admin_notes?: string | null
          category_name_en?: string
          category_name_ru?: string | null
          created_at?: string
          description?: string | null
          example_items?: string | null
          id?: string
          merged_to_category_id?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
          suggestion_type?: string
          updated_at?: string
          user_id?: string | null
        }
        Relationships: []
      }
      chat_message_flags: {
        Row: {
          action_taken: string | null
          auto_detected: boolean | null
          booking_id: string | null
          confidence_score: number | null
          created_at: string
          detected_pattern: string | null
          flag_type: string
          id: string
          message_id: string | null
          property_id: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          severity: string
          status: string
          warning_acknowledged_at: string | null
          warning_shown_to_sender: boolean | null
        }
        Insert: {
          action_taken?: string | null
          auto_detected?: boolean | null
          booking_id?: string | null
          confidence_score?: number | null
          created_at?: string
          detected_pattern?: string | null
          flag_type: string
          id?: string
          message_id?: string | null
          property_id?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          severity?: string
          status?: string
          warning_acknowledged_at?: string | null
          warning_shown_to_sender?: boolean | null
        }
        Update: {
          action_taken?: string | null
          auto_detected?: boolean | null
          booking_id?: string | null
          confidence_score?: number | null
          created_at?: string
          detected_pattern?: string | null
          flag_type?: string
          id?: string
          message_id?: string | null
          property_id?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          severity?: string
          status?: string
          warning_acknowledged_at?: string | null
          warning_shown_to_sender?: boolean | null
        }
        Relationships: [
          {
            foreignKeyName: "chat_message_flags_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "property_bookings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "chat_message_flags_message_id_fkey"
            columns: ["message_id"]
            isOneToOne: false
            referencedRelation: "property_chat_messages"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "chat_message_flags_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "owner_properties"
            referencedColumns: ["id"]
          },
        ]
      }
      chat_violation_history: {
        Row: {
          created_at: string
          id: string
          is_restricted: boolean | null
          last_violation_at: string
          notes: string | null
          restricted_until: string | null
          updated_at: string
          user_id: string
          violation_count: number
          violation_type: string
          warning_level: number
        }
        Insert: {
          created_at?: string
          id?: string
          is_restricted?: boolean | null
          last_violation_at?: string
          notes?: string | null
          restricted_until?: string | null
          updated_at?: string
          user_id: string
          violation_count?: number
          violation_type: string
          warning_level?: number
        }
        Update: {
          created_at?: string
          id?: string
          is_restricted?: boolean | null
          last_violation_at?: string
          notes?: string | null
          restricted_until?: string | null
          updated_at?: string
          user_id?: string
          violation_count?: number
          violation_type?: string
          warning_level?: number
        }
        Relationships: []
      }
      cities: {
        Row: {
          country_code: string
          country_en: string
          country_ru: string | null
          created_at: string | null
          default_currency: string | null
          flag: string
          id: string
          is_active: boolean | null
          is_coming_soon: boolean | null
          lat: number
          launch_date: string | null
          lng: number
          mapbox_bounds: Json | null
          name_en: string
          name_ru: string | null
          name_th: string | null
          slug: string
          sort_order: number | null
          timezone: string | null
          updated_at: string | null
        }
        Insert: {
          country_code: string
          country_en: string
          country_ru?: string | null
          created_at?: string | null
          default_currency?: string | null
          flag: string
          id?: string
          is_active?: boolean | null
          is_coming_soon?: boolean | null
          lat: number
          launch_date?: string | null
          lng: number
          mapbox_bounds?: Json | null
          name_en: string
          name_ru?: string | null
          name_th?: string | null
          slug: string
          sort_order?: number | null
          timezone?: string | null
          updated_at?: string | null
        }
        Update: {
          country_code?: string
          country_en?: string
          country_ru?: string | null
          created_at?: string | null
          default_currency?: string | null
          flag?: string
          id?: string
          is_active?: boolean | null
          is_coming_soon?: boolean | null
          lat?: number
          launch_date?: string | null
          lng?: number
          mapbox_bounds?: Json | null
          name_en?: string
          name_ru?: string | null
          name_th?: string | null
          slug?: string
          sort_order?: number | null
          timezone?: string | null
          updated_at?: string | null
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
      cohort_analytics: {
        Row: {
          active_users: number | null
          avg_revenue_per_user: number | null
          cohort_month: string
          created_at: string | null
          id: string
          paying_users: number | null
          period_month: string
          period_number: number
          retention_rate: number | null
          total_revenue: number | null
          total_users: number | null
        }
        Insert: {
          active_users?: number | null
          avg_revenue_per_user?: number | null
          cohort_month: string
          created_at?: string | null
          id?: string
          paying_users?: number | null
          period_month: string
          period_number: number
          retention_rate?: number | null
          total_revenue?: number | null
          total_users?: number | null
        }
        Update: {
          active_users?: number | null
          avg_revenue_per_user?: number | null
          cohort_month?: string
          created_at?: string | null
          id?: string
          paying_users?: number | null
          period_month?: string
          period_number?: number
          retention_rate?: number | null
          total_revenue?: number | null
          total_users?: number | null
        }
        Relationships: []
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
          ai_analysis_at: string | null
          ai_priority: string | null
          ai_reasoning: string | null
          ai_recommended_action: string | null
          ai_score: number | null
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
          entry_point: string | null
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
          vertical_id: string | null
          vertical_metadata: Json | null
        }
        Insert: {
          admin_notes?: string | null
          ai_analysis_at?: string | null
          ai_priority?: string | null
          ai_reasoning?: string | null
          ai_recommended_action?: string | null
          ai_score?: number | null
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
          entry_point?: string | null
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
          vertical_id?: string | null
          vertical_metadata?: Json | null
        }
        Update: {
          admin_notes?: string | null
          ai_analysis_at?: string | null
          ai_priority?: string | null
          ai_reasoning?: string | null
          ai_recommended_action?: string | null
          ai_score?: number | null
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
          entry_point?: string | null
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
          vertical_id?: string | null
          vertical_metadata?: Json | null
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
      crm_access_log: {
        Row: {
          action: string
          company_id: string
          created_at: string
          entity_ids: string[] | null
          entity_type: string
          id: string
          metadata: Json | null
          user_id: string
        }
        Insert: {
          action: string
          company_id: string
          created_at?: string
          entity_ids?: string[] | null
          entity_type?: string
          id?: string
          metadata?: Json | null
          user_id: string
        }
        Update: {
          action?: string
          company_id?: string
          created_at?: string
          entity_ids?: string[] | null
          entity_type?: string
          id?: string
          metadata?: Json | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "crm_access_log_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "management_companies"
            referencedColumns: ["id"]
          },
        ]
      }
      crm_contact_notes: {
        Row: {
          contact_id: string
          content: string
          created_at: string
          id: string
          note_type: string
          user_id: string
        }
        Insert: {
          contact_id: string
          content?: string
          created_at?: string
          id?: string
          note_type?: string
          user_id: string
        }
        Update: {
          contact_id?: string
          content?: string
          created_at?: string
          id?: string
          note_type?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "crm_contact_notes_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "crm_contacts"
            referencedColumns: ["id"]
          },
        ]
      }
      crm_contacts: {
        Row: {
          avatar_url: string | null
          bedrooms_min: number | null
          birthday: string | null
          budget_max: number | null
          budget_min: number | null
          company_id: string
          company_name: string | null
          contact_type: string | null
          created_at: string
          created_by: string | null
          currency: string | null
          email: string | null
          family_info: string | null
          first_name: string
          id: string
          interests: string[] | null
          is_archived: boolean
          job_title: string | null
          language: string | null
          last_name: string
          line_id: string | null
          nationality: string | null
          notes: string | null
          phone: string | null
          phone2: string | null
          preferred_districts: string[] | null
          preferred_types: string[] | null
          scoring: number | null
          source: string | null
          tags: string[] | null
          telegram: string | null
          updated_at: string
          whatsapp: string | null
        }
        Insert: {
          avatar_url?: string | null
          bedrooms_min?: number | null
          birthday?: string | null
          budget_max?: number | null
          budget_min?: number | null
          company_id: string
          company_name?: string | null
          contact_type?: string | null
          created_at?: string
          created_by?: string | null
          currency?: string | null
          email?: string | null
          family_info?: string | null
          first_name?: string
          id?: string
          interests?: string[] | null
          is_archived?: boolean
          job_title?: string | null
          language?: string | null
          last_name?: string
          line_id?: string | null
          nationality?: string | null
          notes?: string | null
          phone?: string | null
          phone2?: string | null
          preferred_districts?: string[] | null
          preferred_types?: string[] | null
          scoring?: number | null
          source?: string | null
          tags?: string[] | null
          telegram?: string | null
          updated_at?: string
          whatsapp?: string | null
        }
        Update: {
          avatar_url?: string | null
          bedrooms_min?: number | null
          birthday?: string | null
          budget_max?: number | null
          budget_min?: number | null
          company_id?: string
          company_name?: string | null
          contact_type?: string | null
          created_at?: string
          created_by?: string | null
          currency?: string | null
          email?: string | null
          family_info?: string | null
          first_name?: string
          id?: string
          interests?: string[] | null
          is_archived?: boolean
          job_title?: string | null
          language?: string | null
          last_name?: string
          line_id?: string | null
          nationality?: string | null
          notes?: string | null
          phone?: string | null
          phone2?: string | null
          preferred_districts?: string[] | null
          preferred_types?: string[] | null
          scoring?: number | null
          source?: string | null
          tags?: string[] | null
          telegram?: string | null
          updated_at?: string
          whatsapp?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "crm_contacts_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "management_companies"
            referencedColumns: ["id"]
          },
        ]
      }
      crm_tasks: {
        Row: {
          assigned_to: string | null
          company_id: string
          completed_at: string | null
          contact_id: string | null
          created_at: string
          created_by: string
          deal_id: string | null
          description: string | null
          due_date: string | null
          id: string
          priority: string
          property_id: string | null
          reminder_at: string | null
          status: string
          task_type: string
          title: string
          updated_at: string
        }
        Insert: {
          assigned_to?: string | null
          company_id: string
          completed_at?: string | null
          contact_id?: string | null
          created_at?: string
          created_by: string
          deal_id?: string | null
          description?: string | null
          due_date?: string | null
          id?: string
          priority?: string
          property_id?: string | null
          reminder_at?: string | null
          status?: string
          task_type?: string
          title: string
          updated_at?: string
        }
        Update: {
          assigned_to?: string | null
          company_id?: string
          completed_at?: string | null
          contact_id?: string | null
          created_at?: string
          created_by?: string
          deal_id?: string | null
          description?: string | null
          due_date?: string | null
          id?: string
          priority?: string
          property_id?: string | null
          reminder_at?: string | null
          status?: string
          task_type?: string
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "crm_tasks_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "management_companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "crm_tasks_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "crm_contacts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "crm_tasks_deal_id_fkey"
            columns: ["deal_id"]
            isOneToOne: false
            referencedRelation: "agent_deals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "crm_tasks_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "crm_tasks_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "v_marketplace_listings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "crm_tasks_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "v_owner_properties"
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
      currency_rates: {
        Row: {
          base_currency: string
          id: string
          rate: number
          source: string | null
          target_currency: string
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          base_currency?: string
          id?: string
          rate: number
          source?: string | null
          target_currency: string
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          base_currency?: string
          id?: string
          rate?: number
          source?: string | null
          target_currency?: string
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: []
      }
      damage_reports: {
        Row: {
          actual_cost: number | null
          booking_id: string | null
          created_at: string
          currency: string | null
          damage_type: string | null
          deducted_from_deposit: boolean | null
          description: string | null
          estimated_cost: number | null
          id: string
          inventory_item_id: string | null
          notes: string | null
          owner_id: string
          photos: string[] | null
          property_id: string
          reported_at: string
          resolved_at: string | null
          severity: string | null
          status: string | null
          title: string
          updated_at: string
        }
        Insert: {
          actual_cost?: number | null
          booking_id?: string | null
          created_at?: string
          currency?: string | null
          damage_type?: string | null
          deducted_from_deposit?: boolean | null
          description?: string | null
          estimated_cost?: number | null
          id?: string
          inventory_item_id?: string | null
          notes?: string | null
          owner_id: string
          photos?: string[] | null
          property_id: string
          reported_at?: string
          resolved_at?: string | null
          severity?: string | null
          status?: string | null
          title: string
          updated_at?: string
        }
        Update: {
          actual_cost?: number | null
          booking_id?: string | null
          created_at?: string
          currency?: string | null
          damage_type?: string | null
          deducted_from_deposit?: boolean | null
          description?: string | null
          estimated_cost?: number | null
          id?: string
          inventory_item_id?: string | null
          notes?: string | null
          owner_id?: string
          photos?: string[] | null
          property_id?: string
          reported_at?: string
          resolved_at?: string | null
          severity?: string | null
          status?: string | null
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "damage_reports_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "property_bookings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "damage_reports_inventory_item_id_fkey"
            columns: ["inventory_item_id"]
            isOneToOne: false
            referencedRelation: "property_inventory_items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "damage_reports_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "owner_properties"
            referencedColumns: ["id"]
          },
        ]
      }
      data_provenance: {
        Row: {
          created_at: string
          entity_id: string
          entity_type: string
          field_name: string
          field_value: string | null
          id: string
          scraped_at: string
          source_type: string | null
          source_url: string
        }
        Insert: {
          created_at?: string
          entity_id: string
          entity_type: string
          field_name: string
          field_value?: string | null
          id?: string
          scraped_at?: string
          source_type?: string | null
          source_url: string
        }
        Update: {
          created_at?: string
          entity_id?: string
          entity_type?: string
          field_name?: string
          field_value?: string | null
          id?: string
          scraped_at?: string
          source_type?: string | null
          source_url?: string
        }
        Relationships: []
      }
      data_quality_issues: {
        Row: {
          detected_at: string
          entity_id: string
          entity_type: string
          id: string
          issue_code: string
          message: string
          resolved_at: string | null
          resolved_by: string | null
          severity: string
        }
        Insert: {
          detected_at?: string
          entity_id: string
          entity_type: string
          id?: string
          issue_code: string
          message: string
          resolved_at?: string | null
          resolved_by?: string | null
          severity: string
        }
        Update: {
          detected_at?: string
          entity_id?: string
          entity_type?: string
          id?: string
          issue_code?: string
          message?: string
          resolved_at?: string | null
          resolved_by?: string | null
          severity?: string
        }
        Relationships: []
      }
      deal_field_changes: {
        Row: {
          created_at: string
          deal_id: string
          field_name: string
          id: string
          new_value: string | null
          old_value: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          deal_id: string
          field_name: string
          id?: string
          new_value?: string | null
          old_value?: string | null
          user_id: string
        }
        Update: {
          created_at?: string
          deal_id?: string
          field_name?: string
          id?: string
          new_value?: string | null
          old_value?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "deal_field_changes_deal_id_fkey"
            columns: ["deal_id"]
            isOneToOne: false
            referencedRelation: "agent_deals"
            referencedColumns: ["id"]
          },
        ]
      }
      deal_pipeline_stages: {
        Row: {
          color: string
          company_id: string
          created_at: string
          deal_type: string
          id: string
          is_active: boolean
          is_system: boolean
          name_en: string
          name_ru: string
          probability: number
          short_label: string
          sort_order: number
          stage_key: string
          updated_at: string
        }
        Insert: {
          color?: string
          company_id: string
          created_at?: string
          deal_type?: string
          id?: string
          is_active?: boolean
          is_system?: boolean
          name_en: string
          name_ru: string
          probability?: number
          short_label?: string
          sort_order?: number
          stage_key: string
          updated_at?: string
        }
        Update: {
          color?: string
          company_id?: string
          created_at?: string
          deal_type?: string
          id?: string
          is_active?: boolean
          is_system?: boolean
          name_en?: string
          name_ru?: string
          probability?: number
          short_label?: string
          sort_order?: number
          stage_key?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "deal_pipeline_stages_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "management_companies"
            referencedColumns: ["id"]
          },
        ]
      }
      deal_scheduled_activities: {
        Row: {
          activity_type: string
          assigned_to: string
          cancelled_at: string | null
          company_id: string
          completed_at: string | null
          contact_id: string | null
          created_at: string
          created_by: string
          deal_id: string
          due_date: string
          due_time: string | null
          id: string
          note: string | null
          summary: string
          updated_at: string
        }
        Insert: {
          activity_type?: string
          assigned_to: string
          cancelled_at?: string | null
          company_id: string
          completed_at?: string | null
          contact_id?: string | null
          created_at?: string
          created_by: string
          deal_id: string
          due_date: string
          due_time?: string | null
          id?: string
          note?: string | null
          summary: string
          updated_at?: string
        }
        Update: {
          activity_type?: string
          assigned_to?: string
          cancelled_at?: string | null
          company_id?: string
          completed_at?: string | null
          contact_id?: string | null
          created_at?: string
          created_by?: string
          deal_id?: string
          due_date?: string
          due_time?: string | null
          id?: string
          note?: string | null
          summary?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "deal_scheduled_activities_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "management_companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "deal_scheduled_activities_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "crm_contacts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "deal_scheduled_activities_deal_id_fkey"
            columns: ["deal_id"]
            isOneToOne: false
            referencedRelation: "agent_deals"
            referencedColumns: ["id"]
          },
        ]
      }
      developers: {
        Row: {
          address: string | null
          average_rating: number | null
          cover_image: string | null
          created_at: string | null
          description_en: string | null
          description_ru: string | null
          email: string | null
          founded_year: number | null
          id: string
          is_active: boolean | null
          is_featured: boolean | null
          is_verified: boolean | null
          logo_url: string | null
          muuno_score: number | null
          name_en: string
          name_ru: string
          phone: string | null
          projects_completed: number | null
          slug: string | null
          total_units_sold: number | null
          updated_at: string | null
          website: string | null
        }
        Insert: {
          address?: string | null
          average_rating?: number | null
          cover_image?: string | null
          created_at?: string | null
          description_en?: string | null
          description_ru?: string | null
          email?: string | null
          founded_year?: number | null
          id?: string
          is_active?: boolean | null
          is_featured?: boolean | null
          is_verified?: boolean | null
          logo_url?: string | null
          muuno_score?: number | null
          name_en: string
          name_ru: string
          phone?: string | null
          projects_completed?: number | null
          slug?: string | null
          total_units_sold?: number | null
          updated_at?: string | null
          website?: string | null
        }
        Update: {
          address?: string | null
          average_rating?: number | null
          cover_image?: string | null
          created_at?: string | null
          description_en?: string | null
          description_ru?: string | null
          email?: string | null
          founded_year?: number | null
          id?: string
          is_active?: boolean | null
          is_featured?: boolean | null
          is_verified?: boolean | null
          logo_url?: string | null
          muuno_score?: number | null
          name_en?: string
          name_ru?: string
          phone?: string | null
          projects_completed?: number | null
          slug?: string | null
          total_units_sold?: number | null
          updated_at?: string | null
          website?: string | null
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
      document_reminders: {
        Row: {
          created_at: string
          document_name: string
          expires_at: string
          id: string
          is_active: boolean | null
          last_notified_at: string | null
          owner_id: string
          property_id: string | null
          reminder_days_before: number[] | null
          updated_at: string
          vault_file_id: string | null
        }
        Insert: {
          created_at?: string
          document_name: string
          expires_at: string
          id?: string
          is_active?: boolean | null
          last_notified_at?: string | null
          owner_id: string
          property_id?: string | null
          reminder_days_before?: number[] | null
          updated_at?: string
          vault_file_id?: string | null
        }
        Update: {
          created_at?: string
          document_name?: string
          expires_at?: string
          id?: string
          is_active?: boolean | null
          last_notified_at?: string | null
          owner_id?: string
          property_id?: string | null
          reminder_days_before?: number[] | null
          updated_at?: string
          vault_file_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "document_reminders_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "document_reminders_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "v_marketplace_listings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "document_reminders_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "v_owner_properties"
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
          entity_type: string | null
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
          entity_type?: string | null
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
          entity_type?: string | null
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
      entity_classification_hints: {
        Row: {
          admin_notes: string | null
          classification: string
          confidence: string
          created_at: string
          entity_id: string
          entity_type: string
          id: string
          updated_at: string
        }
        Insert: {
          admin_notes?: string | null
          classification: string
          confidence?: string
          created_at?: string
          entity_id: string
          entity_type: string
          id?: string
          updated_at?: string
        }
        Update: {
          admin_notes?: string | null
          classification?: string
          confidence?: string
          created_at?: string
          entity_id?: string
          entity_type?: string
          id?: string
          updated_at?: string
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
      event_occurrences: {
        Row: {
          created_at: string | null
          ends_at: string | null
          event_id: string
          id: string
          is_cancelled: boolean | null
          notes: string | null
          source_urls: string[] | null
          starts_at: string
          timezone: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          ends_at?: string | null
          event_id: string
          id?: string
          is_cancelled?: boolean | null
          notes?: string | null
          source_urls?: string[] | null
          starts_at: string
          timezone?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          ends_at?: string | null
          event_id?: string
          id?: string
          is_cancelled?: boolean | null
          notes?: string | null
          source_urls?: string[] | null
          starts_at?: string
          timezone?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "event_occurrences_event_id_fkey"
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
          age_policy: string | null
          approval_status: string | null
          booking_flow: string | null
          category: string
          cover_image: string | null
          created_at: string
          created_by_uno_team: boolean | null
          currency: string | null
          description_en: string | null
          description_ru: string | null
          dress_code: string | null
          duration_hours: number | null
          ends_at: string | null
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
          lifeos_context: string | null
          lng: number | null
          location_name: string | null
          location_ru: string | null
          marketing_tags: string[] | null
          max_spots: number | null
          organizer_type: string | null
          original_price: number | null
          price: number | null
          provider_id: string | null
          rating: number | null
          rejection_reason: string | null
          review_count: number | null
          reviewed_at: string | null
          reviewed_by: string | null
          slug: string | null
          source_urls: string[] | null
          spots_left: number | null
          starts_at: string | null
          ticket_url: string | null
          title_en: string
          title_ru: string
          uno_team_creator_id: string | null
          updated_at: string
          venue_id: string | null
        }
        Insert: {
          address?: string | null
          age_policy?: string | null
          approval_status?: string | null
          booking_flow?: string | null
          category?: string
          cover_image?: string | null
          created_at?: string
          created_by_uno_team?: boolean | null
          currency?: string | null
          description_en?: string | null
          description_ru?: string | null
          dress_code?: string | null
          duration_hours?: number | null
          ends_at?: string | null
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
          lifeos_context?: string | null
          lng?: number | null
          location_name?: string | null
          location_ru?: string | null
          marketing_tags?: string[] | null
          max_spots?: number | null
          organizer_type?: string | null
          original_price?: number | null
          price?: number | null
          provider_id?: string | null
          rating?: number | null
          rejection_reason?: string | null
          review_count?: number | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          slug?: string | null
          source_urls?: string[] | null
          spots_left?: number | null
          starts_at?: string | null
          ticket_url?: string | null
          title_en: string
          title_ru: string
          uno_team_creator_id?: string | null
          updated_at?: string
          venue_id?: string | null
        }
        Update: {
          address?: string | null
          age_policy?: string | null
          approval_status?: string | null
          booking_flow?: string | null
          category?: string
          cover_image?: string | null
          created_at?: string
          created_by_uno_team?: boolean | null
          currency?: string | null
          description_en?: string | null
          description_ru?: string | null
          dress_code?: string | null
          duration_hours?: number | null
          ends_at?: string | null
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
          lifeos_context?: string | null
          lng?: number | null
          location_name?: string | null
          location_ru?: string | null
          marketing_tags?: string[] | null
          max_spots?: number | null
          organizer_type?: string | null
          original_price?: number | null
          price?: number | null
          provider_id?: string | null
          rating?: number | null
          rejection_reason?: string | null
          review_count?: number | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          slug?: string | null
          source_urls?: string[] | null
          spots_left?: number | null
          starts_at?: string | null
          ticket_url?: string | null
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
      experience_categories: {
        Row: {
          created_at: string | null
          experience_type: string | null
          icon: string | null
          id: string
          is_active: boolean | null
          name_en: string
          name_ru: string
          slug: string
          sort_order: number | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          experience_type?: string | null
          icon?: string | null
          id?: string
          is_active?: boolean | null
          name_en: string
          name_ru: string
          slug: string
          sort_order?: number | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          experience_type?: string | null
          icon?: string | null
          id?: string
          is_active?: boolean | null
          name_en?: string
          name_ru?: string
          slug?: string
          sort_order?: number | null
          updated_at?: string | null
        }
        Relationships: []
      }
      experience_media: {
        Row: {
          alt_text: string | null
          created_at: string
          experience_id: string
          id: string
          media_type: string
          sort_order: number
          source_image_url: string | null
          stored_path: string | null
        }
        Insert: {
          alt_text?: string | null
          created_at?: string
          experience_id: string
          id?: string
          media_type?: string
          sort_order?: number
          source_image_url?: string | null
          stored_path?: string | null
        }
        Update: {
          alt_text?: string | null
          created_at?: string
          experience_id?: string
          id?: string
          media_type?: string
          sort_order?: number
          source_image_url?: string | null
          stored_path?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "experience_media_experience_id_fkey"
            columns: ["experience_id"]
            isOneToOne: false
            referencedRelation: "experiences"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "experience_media_experience_id_fkey"
            columns: ["experience_id"]
            isOneToOne: false
            referencedRelation: "experiences_normalized"
            referencedColumns: ["id"]
          },
        ]
      }
      experience_pricing: {
        Row: {
          created_at: string
          experience_id: string
          id: string
          max_pax: number | null
          min_pax: number | null
          price_name: string
          price_notes: string | null
          price_thb: number
          price_type: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          experience_id: string
          id?: string
          max_pax?: number | null
          min_pax?: number | null
          price_name: string
          price_notes?: string | null
          price_thb: number
          price_type?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          experience_id?: string
          id?: string
          max_pax?: number | null
          min_pax?: number | null
          price_name?: string
          price_notes?: string | null
          price_thb?: number
          price_type?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "experience_pricing_experience_id_fkey"
            columns: ["experience_id"]
            isOneToOne: false
            referencedRelation: "experiences"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "experience_pricing_experience_id_fkey"
            columns: ["experience_id"]
            isOneToOne: false
            referencedRelation: "experiences_normalized"
            referencedColumns: ["id"]
          },
        ]
      }
      experiences: {
        Row: {
          age_restriction: number | null
          approval_status: string | null
          available_days: string[] | null
          booking_model: string | null
          booking_url: string | null
          category: string | null
          certification_details: string | null
          commission_rate: number | null
          cover_image: string | null
          created_at: string | null
          created_by_uno_team: boolean | null
          currency: string | null
          description_en: string | null
          description_ru: string | null
          difficulty: string | null
          duration_minutes: number | null
          equipment_included: boolean | null
          excludes: Json | null
          exclusions: Json | null
          experience_type: string
          external_link: string | null
          highlights: Json | null
          id: string
          images: string[] | null
          includes: Json | null
          inclusions: Json | null
          is_active: boolean | null
          is_certified: boolean | null
          is_featured: boolean | null
          itinerary: Json | null
          location_name: string | null
          long_description: string | null
          max_participants: number | null
          meeting_point: string | null
          meeting_point_lat: number | null
          meeting_point_lng: number | null
          min_participants: number | null
          notes: Json | null
          partner_id: string | null
          pickup_included: boolean | null
          price: number | null
          price_per: string | null
          provider_id: string | null
          rating: number | null
          rejection_reason: string | null
          requirements: Json | null
          review_count: number | null
          reviewed_at: string | null
          reviewed_by: string | null
          safety_briefing_required: boolean | null
          short_description: string | null
          slug: string | null
          source_page_url: string | null
          source_type: string | null
          start_times: string[] | null
          status: string | null
          tags: string[] | null
          title_en: string
          title_ru: string
          uno_team_creator_id: string | null
          updated_at: string | null
        }
        Insert: {
          age_restriction?: number | null
          approval_status?: string | null
          available_days?: string[] | null
          booking_model?: string | null
          booking_url?: string | null
          category?: string | null
          certification_details?: string | null
          commission_rate?: number | null
          cover_image?: string | null
          created_at?: string | null
          created_by_uno_team?: boolean | null
          currency?: string | null
          description_en?: string | null
          description_ru?: string | null
          difficulty?: string | null
          duration_minutes?: number | null
          equipment_included?: boolean | null
          excludes?: Json | null
          exclusions?: Json | null
          experience_type?: string
          external_link?: string | null
          highlights?: Json | null
          id?: string
          images?: string[] | null
          includes?: Json | null
          inclusions?: Json | null
          is_active?: boolean | null
          is_certified?: boolean | null
          is_featured?: boolean | null
          itinerary?: Json | null
          location_name?: string | null
          long_description?: string | null
          max_participants?: number | null
          meeting_point?: string | null
          meeting_point_lat?: number | null
          meeting_point_lng?: number | null
          min_participants?: number | null
          notes?: Json | null
          partner_id?: string | null
          pickup_included?: boolean | null
          price?: number | null
          price_per?: string | null
          provider_id?: string | null
          rating?: number | null
          rejection_reason?: string | null
          requirements?: Json | null
          review_count?: number | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          safety_briefing_required?: boolean | null
          short_description?: string | null
          slug?: string | null
          source_page_url?: string | null
          source_type?: string | null
          start_times?: string[] | null
          status?: string | null
          tags?: string[] | null
          title_en: string
          title_ru: string
          uno_team_creator_id?: string | null
          updated_at?: string | null
        }
        Update: {
          age_restriction?: number | null
          approval_status?: string | null
          available_days?: string[] | null
          booking_model?: string | null
          booking_url?: string | null
          category?: string | null
          certification_details?: string | null
          commission_rate?: number | null
          cover_image?: string | null
          created_at?: string | null
          created_by_uno_team?: boolean | null
          currency?: string | null
          description_en?: string | null
          description_ru?: string | null
          difficulty?: string | null
          duration_minutes?: number | null
          equipment_included?: boolean | null
          excludes?: Json | null
          exclusions?: Json | null
          experience_type?: string
          external_link?: string | null
          highlights?: Json | null
          id?: string
          images?: string[] | null
          includes?: Json | null
          inclusions?: Json | null
          is_active?: boolean | null
          is_certified?: boolean | null
          is_featured?: boolean | null
          itinerary?: Json | null
          location_name?: string | null
          long_description?: string | null
          max_participants?: number | null
          meeting_point?: string | null
          meeting_point_lat?: number | null
          meeting_point_lng?: number | null
          min_participants?: number | null
          notes?: Json | null
          partner_id?: string | null
          pickup_included?: boolean | null
          price?: number | null
          price_per?: string | null
          provider_id?: string | null
          rating?: number | null
          rejection_reason?: string | null
          requirements?: Json | null
          review_count?: number | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          safety_briefing_required?: boolean | null
          short_description?: string | null
          slug?: string | null
          source_page_url?: string | null
          source_type?: string | null
          start_times?: string[] | null
          status?: string | null
          tags?: string[] | null
          title_en?: string
          title_ru?: string
          uno_team_creator_id?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "experiences_provider_id_fkey"
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
      flower_addons: {
        Row: {
          created_at: string
          id: string
          image_url: string | null
          is_active: boolean | null
          name_en: string
          name_ru: string
          price_thb: number
          sort_order: number | null
          type: string
        }
        Insert: {
          created_at?: string
          id?: string
          image_url?: string | null
          is_active?: boolean | null
          name_en: string
          name_ru: string
          price_thb?: number
          sort_order?: number | null
          type?: string
        }
        Update: {
          created_at?: string
          id?: string
          image_url?: string | null
          is_active?: boolean | null
          name_en?: string
          name_ru?: string
          price_thb?: number
          sort_order?: number | null
          type?: string
        }
        Relationships: []
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
      funnel_analytics: {
        Row: {
          conversion_1_2: number | null
          conversion_2_3: number | null
          conversion_3_4: number | null
          conversion_4_5: number | null
          created_at: string | null
          date: string
          funnel_name: string
          id: string
          overall_conversion: number | null
          step_1_count: number | null
          step_2_count: number | null
          step_3_count: number | null
          step_4_count: number | null
          step_5_count: number | null
        }
        Insert: {
          conversion_1_2?: number | null
          conversion_2_3?: number | null
          conversion_3_4?: number | null
          conversion_4_5?: number | null
          created_at?: string | null
          date: string
          funnel_name: string
          id?: string
          overall_conversion?: number | null
          step_1_count?: number | null
          step_2_count?: number | null
          step_3_count?: number | null
          step_4_count?: number | null
          step_5_count?: number | null
        }
        Update: {
          conversion_1_2?: number | null
          conversion_2_3?: number | null
          conversion_3_4?: number | null
          conversion_4_5?: number | null
          created_at?: string | null
          date?: string
          funnel_name?: string
          id?: string
          overall_conversion?: number | null
          step_1_count?: number | null
          step_2_count?: number | null
          step_3_count?: number | null
          step_4_count?: number | null
          step_5_count?: number | null
        }
        Relationships: []
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
      guest_loyalty_tiers: {
        Row: {
          benefits: Json | null
          cashback_percent: number
          color: string | null
          created_at: string | null
          icon: string | null
          id: string
          is_active: boolean | null
          min_gmv_thb: number
          tier_name: string
          tier_order: number
          updated_at: string | null
        }
        Insert: {
          benefits?: Json | null
          cashback_percent?: number
          color?: string | null
          created_at?: string | null
          icon?: string | null
          id?: string
          is_active?: boolean | null
          min_gmv_thb?: number
          tier_name: string
          tier_order: number
          updated_at?: string | null
        }
        Update: {
          benefits?: Json | null
          cashback_percent?: number
          color?: string | null
          created_at?: string | null
          icon?: string | null
          id?: string
          is_active?: boolean | null
          min_gmv_thb?: number
          tier_name?: string
          tier_order?: number
          updated_at?: string | null
        }
        Relationships: []
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
      inventory_inspections: {
        Row: {
          created_at: string
          id: string
          inspection_type: string
          inspector_id: string
          items: Json
          notes: string | null
          property_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          inspection_type: string
          inspector_id: string
          items?: Json
          notes?: string | null
          property_id: string
        }
        Update: {
          created_at?: string
          id?: string
          inspection_type?: string
          inspector_id?: string
          items?: Json
          notes?: string | null
          property_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "inventory_inspections_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "owner_properties"
            referencedColumns: ["id"]
          },
        ]
      }
      investment_documents: {
        Row: {
          created_at: string
          document_type: string
          download_count: number | null
          file_size: number | null
          file_type: string | null
          file_url: string
          id: string
          is_public: boolean | null
          name_en: string
          name_ru: string | null
          project_id: string
          requires_interest: boolean | null
          requires_nda: boolean | null
          sort_order: number | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          document_type?: string
          download_count?: number | null
          file_size?: number | null
          file_type?: string | null
          file_url: string
          id?: string
          is_public?: boolean | null
          name_en: string
          name_ru?: string | null
          project_id: string
          requires_interest?: boolean | null
          requires_nda?: boolean | null
          sort_order?: number | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          document_type?: string
          download_count?: number | null
          file_size?: number | null
          file_type?: string | null
          file_url?: string
          id?: string
          is_public?: boolean | null
          name_en?: string
          name_ru?: string | null
          project_id?: string
          requires_interest?: boolean | null
          requires_nda?: boolean | null
          sort_order?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "investment_documents_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "investment_projects"
            referencedColumns: ["id"]
          },
        ]
      }
      investment_interests: {
        Row: {
          admin_notes: string | null
          contact_email: string | null
          contact_name: string | null
          contact_phone: string | null
          contacted_at: string | null
          converted_at: string | null
          created_at: string
          id: string
          interest_type: string
          notes: string | null
          preferred_amount: number | null
          preferred_currency: string | null
          priority: string | null
          project_id: string
          source: string | null
          status: string
          updated_at: string
          user_id: string
          utm_campaign: string | null
          utm_source: string | null
        }
        Insert: {
          admin_notes?: string | null
          contact_email?: string | null
          contact_name?: string | null
          contact_phone?: string | null
          contacted_at?: string | null
          converted_at?: string | null
          created_at?: string
          id?: string
          interest_type?: string
          notes?: string | null
          preferred_amount?: number | null
          preferred_currency?: string | null
          priority?: string | null
          project_id: string
          source?: string | null
          status?: string
          updated_at?: string
          user_id: string
          utm_campaign?: string | null
          utm_source?: string | null
        }
        Update: {
          admin_notes?: string | null
          contact_email?: string | null
          contact_name?: string | null
          contact_phone?: string | null
          contacted_at?: string | null
          converted_at?: string | null
          created_at?: string
          id?: string
          interest_type?: string
          notes?: string | null
          preferred_amount?: number | null
          preferred_currency?: string | null
          priority?: string | null
          project_id?: string
          source?: string | null
          status?: string
          updated_at?: string
          user_id?: string
          utm_campaign?: string | null
          utm_source?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "investment_interests_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "investment_projects"
            referencedColumns: ["id"]
          },
        ]
      }
      investment_projects: {
        Row: {
          address: string | null
          amount_raised: number | null
          closed_at: string | null
          cover_image: string | null
          created_at: string
          currency: string
          description_en: string | null
          description_ru: string | null
          developer_id: string | null
          district: string | null
          exit_strategy: string | null
          founder_id: string | null
          funded_at: string | null
          funding_goal: number | null
          id: string
          images: string[] | null
          industry: string | null
          investment_term_months: number | null
          investors_count: number | null
          is_featured: boolean | null
          is_hot: boolean | null
          is_verified: boolean | null
          lat: number | null
          lng: number | null
          max_investment: number | null
          min_investment: number | null
          muuno_score: number | null
          project_type: string
          property_project_id: string | null
          published_at: string | null
          risk_factors: string[] | null
          risk_level: string | null
          roi_projected: number | null
          score_breakdown: Json | null
          slug: string | null
          status: string
          title_en: string
          title_ru: string
          updated_at: string
          views_count: number | null
        }
        Insert: {
          address?: string | null
          amount_raised?: number | null
          closed_at?: string | null
          cover_image?: string | null
          created_at?: string
          currency?: string
          description_en?: string | null
          description_ru?: string | null
          developer_id?: string | null
          district?: string | null
          exit_strategy?: string | null
          founder_id?: string | null
          funded_at?: string | null
          funding_goal?: number | null
          id?: string
          images?: string[] | null
          industry?: string | null
          investment_term_months?: number | null
          investors_count?: number | null
          is_featured?: boolean | null
          is_hot?: boolean | null
          is_verified?: boolean | null
          lat?: number | null
          lng?: number | null
          max_investment?: number | null
          min_investment?: number | null
          muuno_score?: number | null
          project_type?: string
          property_project_id?: string | null
          published_at?: string | null
          risk_factors?: string[] | null
          risk_level?: string | null
          roi_projected?: number | null
          score_breakdown?: Json | null
          slug?: string | null
          status?: string
          title_en: string
          title_ru: string
          updated_at?: string
          views_count?: number | null
        }
        Update: {
          address?: string | null
          amount_raised?: number | null
          closed_at?: string | null
          cover_image?: string | null
          created_at?: string
          currency?: string
          description_en?: string | null
          description_ru?: string | null
          developer_id?: string | null
          district?: string | null
          exit_strategy?: string | null
          founder_id?: string | null
          funded_at?: string | null
          funding_goal?: number | null
          id?: string
          images?: string[] | null
          industry?: string | null
          investment_term_months?: number | null
          investors_count?: number | null
          is_featured?: boolean | null
          is_hot?: boolean | null
          is_verified?: boolean | null
          lat?: number | null
          lng?: number | null
          max_investment?: number | null
          min_investment?: number | null
          muuno_score?: number | null
          project_type?: string
          property_project_id?: string | null
          published_at?: string | null
          risk_factors?: string[] | null
          risk_level?: string | null
          roi_projected?: number | null
          score_breakdown?: Json | null
          slug?: string | null
          status?: string
          title_en?: string
          title_ru?: string
          updated_at?: string
          views_count?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "investment_projects_property_project_id_fkey"
            columns: ["property_project_id"]
            isOneToOne: false
            referencedRelation: "property_projects"
            referencedColumns: ["id"]
          },
        ]
      }
      investment_team_members: {
        Row: {
          bio_en: string | null
          bio_ru: string | null
          created_at: string
          id: string
          is_primary: boolean | null
          linkedin_url: string | null
          name: string
          photo: string | null
          project_id: string
          role: string
          sort_order: number | null
          website_url: string | null
        }
        Insert: {
          bio_en?: string | null
          bio_ru?: string | null
          created_at?: string
          id?: string
          is_primary?: boolean | null
          linkedin_url?: string | null
          name: string
          photo?: string | null
          project_id: string
          role: string
          sort_order?: number | null
          website_url?: string | null
        }
        Update: {
          bio_en?: string | null
          bio_ru?: string | null
          created_at?: string
          id?: string
          is_primary?: boolean | null
          linkedin_url?: string | null
          name?: string
          photo?: string | null
          project_id?: string
          role?: string
          sort_order?: number | null
          website_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "investment_team_members_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "investment_projects"
            referencedColumns: ["id"]
          },
        ]
      }
      juristic_contacts: {
        Row: {
          contact_type: string
          created_at: string | null
          email: string | null
          id: string
          is_primary: boolean | null
          line_id: string | null
          name: string
          name_ru: string | null
          notes: string | null
          phone: string | null
          position: string | null
          position_ru: string | null
          project_id: string | null
          property_id: string | null
          updated_at: string | null
          whatsapp: string | null
        }
        Insert: {
          contact_type: string
          created_at?: string | null
          email?: string | null
          id?: string
          is_primary?: boolean | null
          line_id?: string | null
          name: string
          name_ru?: string | null
          notes?: string | null
          phone?: string | null
          position?: string | null
          position_ru?: string | null
          project_id?: string | null
          property_id?: string | null
          updated_at?: string | null
          whatsapp?: string | null
        }
        Update: {
          contact_type?: string
          created_at?: string | null
          email?: string | null
          id?: string
          is_primary?: boolean | null
          line_id?: string | null
          name?: string
          name_ru?: string | null
          notes?: string | null
          phone?: string | null
          position?: string | null
          position_ru?: string | null
          project_id?: string | null
          property_id?: string | null
          updated_at?: string | null
          whatsapp?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "juristic_contacts_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "property_projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "juristic_contacts_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "owner_properties"
            referencedColumns: ["id"]
          },
        ]
      }
      juristic_requests: {
        Row: {
          assigned_to: string | null
          attachments: string[] | null
          completed_at: string | null
          completion_notes: string | null
          completion_photos: string[] | null
          created_at: string | null
          description: string
          description_ru: string | null
          feedback: string | null
          id: string
          juristic_response: string | null
          juristic_response_at: string | null
          owner_id: string
          paid_at: string | null
          payment_amount: number | null
          payment_id: string | null
          payment_period_end: string | null
          payment_period_start: string | null
          payment_receipt_url: string | null
          payment_status: string | null
          priority: string | null
          project_id: string | null
          property_id: string
          rating: number | null
          request_category: string
          request_number: string | null
          request_type: string
          requires_payment: boolean | null
          service_fee: number | null
          service_fee_percent: number | null
          status: string | null
          subject: string
          subject_ru: string | null
          submitted_at: string | null
          submitted_by: string
          total_amount: number | null
          updated_at: string | null
        }
        Insert: {
          assigned_to?: string | null
          attachments?: string[] | null
          completed_at?: string | null
          completion_notes?: string | null
          completion_photos?: string[] | null
          created_at?: string | null
          description: string
          description_ru?: string | null
          feedback?: string | null
          id?: string
          juristic_response?: string | null
          juristic_response_at?: string | null
          owner_id: string
          paid_at?: string | null
          payment_amount?: number | null
          payment_id?: string | null
          payment_period_end?: string | null
          payment_period_start?: string | null
          payment_receipt_url?: string | null
          payment_status?: string | null
          priority?: string | null
          project_id?: string | null
          property_id: string
          rating?: number | null
          request_category: string
          request_number?: string | null
          request_type: string
          requires_payment?: boolean | null
          service_fee?: number | null
          service_fee_percent?: number | null
          status?: string | null
          subject: string
          subject_ru?: string | null
          submitted_at?: string | null
          submitted_by: string
          total_amount?: number | null
          updated_at?: string | null
        }
        Update: {
          assigned_to?: string | null
          attachments?: string[] | null
          completed_at?: string | null
          completion_notes?: string | null
          completion_photos?: string[] | null
          created_at?: string | null
          description?: string
          description_ru?: string | null
          feedback?: string | null
          id?: string
          juristic_response?: string | null
          juristic_response_at?: string | null
          owner_id?: string
          paid_at?: string | null
          payment_amount?: number | null
          payment_id?: string | null
          payment_period_end?: string | null
          payment_period_start?: string | null
          payment_receipt_url?: string | null
          payment_status?: string | null
          priority?: string | null
          project_id?: string | null
          property_id?: string
          rating?: number | null
          request_category?: string
          request_number?: string | null
          request_type?: string
          requires_payment?: boolean | null
          service_fee?: number | null
          service_fee_percent?: number | null
          status?: string | null
          subject?: string
          subject_ru?: string | null
          submitted_at?: string | null
          submitted_by?: string
          total_amount?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "juristic_requests_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "property_projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "juristic_requests_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "owner_properties"
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
      life_scenarios: {
        Row: {
          code: string
          created_at: string
          description_en: string | null
          description_ru: string | null
          icon: string | null
          id: string
          is_active: boolean
          life_situation_id: string
          priority: number
          title_en: string
          title_ru: string
          updated_at: string
          urgency_level: string
        }
        Insert: {
          code: string
          created_at?: string
          description_en?: string | null
          description_ru?: string | null
          icon?: string | null
          id?: string
          is_active?: boolean
          life_situation_id: string
          priority?: number
          title_en: string
          title_ru: string
          updated_at?: string
          urgency_level?: string
        }
        Update: {
          code?: string
          created_at?: string
          description_en?: string | null
          description_ru?: string | null
          icon?: string | null
          id?: string
          is_active?: boolean
          life_situation_id?: string
          priority?: number
          title_en?: string
          title_ru?: string
          updated_at?: string
          urgency_level?: string
        }
        Relationships: [
          {
            foreignKeyName: "life_scenarios_life_situation_id_fkey"
            columns: ["life_situation_id"]
            isOneToOne: false
            referencedRelation: "catalog_life_map_v2"
            referencedColumns: ["life_situation_id"]
          },
          {
            foreignKeyName: "life_scenarios_life_situation_id_fkey"
            columns: ["life_situation_id"]
            isOneToOne: false
            referencedRelation: "life_situations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "life_scenarios_life_situation_id_fkey"
            columns: ["life_situation_id"]
            isOneToOne: false
            referencedRelation: "lifeos_health_view"
            referencedColumns: ["situation_id"]
          },
        ]
      }
      life_situations: {
        Row: {
          code: string
          color: string | null
          created_at: string | null
          description_en: string | null
          description_ru: string | null
          icon: string | null
          id: string
          is_active: boolean | null
          priority: number | null
          title_en: string
          title_ru: string
          updated_at: string | null
        }
        Insert: {
          code: string
          color?: string | null
          created_at?: string | null
          description_en?: string | null
          description_ru?: string | null
          icon?: string | null
          id?: string
          is_active?: boolean | null
          priority?: number | null
          title_en: string
          title_ru: string
          updated_at?: string | null
        }
        Update: {
          code?: string
          color?: string | null
          created_at?: string | null
          description_en?: string | null
          description_ru?: string | null
          icon?: string | null
          id?: string
          is_active?: boolean | null
          priority?: number | null
          title_en?: string
          title_ru?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      life_tasks: {
        Row: {
          code: string
          created_at: string
          id: string
          is_active: boolean
          life_scenario_id: string
          priority: number
          task_type: string
          title_en: string
          title_ru: string
          updated_at: string
        }
        Insert: {
          code: string
          created_at?: string
          id?: string
          is_active?: boolean
          life_scenario_id: string
          priority?: number
          task_type?: string
          title_en: string
          title_ru: string
          updated_at?: string
        }
        Update: {
          code?: string
          created_at?: string
          id?: string
          is_active?: boolean
          life_scenario_id?: string
          priority?: number
          task_type?: string
          title_en?: string
          title_ru?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "life_tasks_life_scenario_id_fkey"
            columns: ["life_scenario_id"]
            isOneToOne: false
            referencedRelation: "life_scenarios"
            referencedColumns: ["id"]
          },
        ]
      }
      lifecycle_templates: {
        Row: {
          body_en: string
          body_ru: string
          channel: string
          created_at: string
          discount_percent: number | null
          id: string
          is_active: boolean
          promo_code: string | null
          title_en: string
          title_ru: string
          trigger_type: string
          updated_at: string
        }
        Insert: {
          body_en?: string
          body_ru?: string
          channel?: string
          created_at?: string
          discount_percent?: number | null
          id?: string
          is_active?: boolean
          promo_code?: string | null
          title_en?: string
          title_ru?: string
          trigger_type: string
          updated_at?: string
        }
        Update: {
          body_en?: string
          body_ru?: string
          channel?: string
          created_at?: string
          discount_percent?: number | null
          id?: string
          is_active?: boolean
          promo_code?: string | null
          title_en?: string
          title_ru?: string
          trigger_type?: string
          updated_at?: string
        }
        Relationships: []
      }
      lifeos_governance: {
        Row: {
          description: string | null
          id: string
          is_readonly: boolean | null
          key: string
          updated_at: string | null
          updated_by: string | null
          value: Json
        }
        Insert: {
          description?: string | null
          id?: string
          is_readonly?: boolean | null
          key: string
          updated_at?: string | null
          updated_by?: string | null
          value: Json
        }
        Update: {
          description?: string | null
          id?: string
          is_readonly?: boolean | null
          key?: string
          updated_at?: string | null
          updated_by?: string | null
          value?: Json
        }
        Relationships: []
      }
      lifeos_routes: {
        Row: {
          alternative_entity_ids: string[] | null
          created_at: string
          cta_target: string | null
          cta_text_en: string
          cta_text_ru: string
          cta_type: string
          emotional_state: string
          id: string
          is_active: boolean
          life_scenario_id: string | null
          life_situation_id: string
          next_routes: string[] | null
          next_routes_labels_en: string[] | null
          next_routes_labels_ru: string[] | null
          pain_type: string
          reassurance_en: string
          reassurance_ru: string
          recognition_en: string
          recognition_ru: string
          recommended_entity_id: string | null
          recommended_entity_type: string | null
          recommended_title_en: string
          recommended_title_ru: string
          recommended_why_en: string
          recommended_why_ru: string
          risk_level: string
          updated_at: string
          what_matters_en: string[]
          what_matters_ru: string[]
        }
        Insert: {
          alternative_entity_ids?: string[] | null
          created_at?: string
          cta_target?: string | null
          cta_text_en?: string
          cta_text_ru?: string
          cta_type?: string
          emotional_state?: string
          id?: string
          is_active?: boolean
          life_scenario_id?: string | null
          life_situation_id: string
          next_routes?: string[] | null
          next_routes_labels_en?: string[] | null
          next_routes_labels_ru?: string[] | null
          pain_type?: string
          reassurance_en: string
          reassurance_ru: string
          recognition_en: string
          recognition_ru: string
          recommended_entity_id?: string | null
          recommended_entity_type?: string | null
          recommended_title_en: string
          recommended_title_ru: string
          recommended_why_en: string
          recommended_why_ru: string
          risk_level?: string
          updated_at?: string
          what_matters_en?: string[]
          what_matters_ru?: string[]
        }
        Update: {
          alternative_entity_ids?: string[] | null
          created_at?: string
          cta_target?: string | null
          cta_text_en?: string
          cta_text_ru?: string
          cta_type?: string
          emotional_state?: string
          id?: string
          is_active?: boolean
          life_scenario_id?: string | null
          life_situation_id?: string
          next_routes?: string[] | null
          next_routes_labels_en?: string[] | null
          next_routes_labels_ru?: string[] | null
          pain_type?: string
          reassurance_en?: string
          reassurance_ru?: string
          recognition_en?: string
          recognition_ru?: string
          recommended_entity_id?: string | null
          recommended_entity_type?: string | null
          recommended_title_en?: string
          recommended_title_ru?: string
          recommended_why_en?: string
          recommended_why_ru?: string
          risk_level?: string
          updated_at?: string
          what_matters_en?: string[]
          what_matters_ru?: string[]
        }
        Relationships: [
          {
            foreignKeyName: "lifeos_routes_life_scenario_id_fkey"
            columns: ["life_scenario_id"]
            isOneToOne: false
            referencedRelation: "life_scenarios"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lifeos_routes_life_situation_id_fkey"
            columns: ["life_situation_id"]
            isOneToOne: true
            referencedRelation: "catalog_life_map_v2"
            referencedColumns: ["life_situation_id"]
          },
          {
            foreignKeyName: "lifeos_routes_life_situation_id_fkey"
            columns: ["life_situation_id"]
            isOneToOne: true
            referencedRelation: "life_situations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lifeos_routes_life_situation_id_fkey"
            columns: ["life_situation_id"]
            isOneToOne: true
            referencedRelation: "lifeos_health_view"
            referencedColumns: ["situation_id"]
          },
        ]
      }
      listing_applications: {
        Row: {
          address: string | null
          admin_notes: string | null
          applicant_email: string | null
          applicant_name: string | null
          applicant_phone: string | null
          city: string | null
          cover_image: string | null
          created_at: string
          created_property_id: string | null
          created_provider_id: string | null
          created_vendor_id: string | null
          currency: string | null
          district: string | null
          draft_data: Json
          estimated_price: number | null
          id: string
          listing_type: Database["public"]["Enums"]["listing_type"]
          product_category: string | null
          property_type: string | null
          rejection_reason: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          service_category: string | null
          status: Database["public"]["Enums"]["listing_application_status"]
          submitted_at: string | null
          updated_at: string
          user_id: string | null
        }
        Insert: {
          address?: string | null
          admin_notes?: string | null
          applicant_email?: string | null
          applicant_name?: string | null
          applicant_phone?: string | null
          city?: string | null
          cover_image?: string | null
          created_at?: string
          created_property_id?: string | null
          created_provider_id?: string | null
          created_vendor_id?: string | null
          currency?: string | null
          district?: string | null
          draft_data?: Json
          estimated_price?: number | null
          id?: string
          listing_type: Database["public"]["Enums"]["listing_type"]
          product_category?: string | null
          property_type?: string | null
          rejection_reason?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          service_category?: string | null
          status?: Database["public"]["Enums"]["listing_application_status"]
          submitted_at?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          address?: string | null
          admin_notes?: string | null
          applicant_email?: string | null
          applicant_name?: string | null
          applicant_phone?: string | null
          city?: string | null
          cover_image?: string | null
          created_at?: string
          created_property_id?: string | null
          created_provider_id?: string | null
          created_vendor_id?: string | null
          currency?: string | null
          district?: string | null
          draft_data?: Json
          estimated_price?: number | null
          id?: string
          listing_type?: Database["public"]["Enums"]["listing_type"]
          product_category?: string | null
          property_type?: string | null
          rejection_reason?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          service_category?: string | null
          status?: Database["public"]["Enums"]["listing_application_status"]
          submitted_at?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Relationships: []
      }
      location_knowledge: {
        Row: {
          city_id: string
          content_en: string | null
          content_ru: string | null
          created_at: string
          icon: string | null
          id: string
          is_published: boolean | null
          section: string
          slug: string
          sort_order: number | null
          summary_en: string | null
          summary_ru: string | null
          title_en: string
          title_ru: string
          updated_at: string
        }
        Insert: {
          city_id: string
          content_en?: string | null
          content_ru?: string | null
          created_at?: string
          icon?: string | null
          id?: string
          is_published?: boolean | null
          section: string
          slug: string
          sort_order?: number | null
          summary_en?: string | null
          summary_ru?: string | null
          title_en: string
          title_ru: string
          updated_at?: string
        }
        Update: {
          city_id?: string
          content_en?: string | null
          content_ru?: string | null
          created_at?: string
          icon?: string | null
          id?: string
          is_published?: boolean | null
          section?: string
          slug?: string
          sort_order?: number | null
          summary_en?: string | null
          summary_ru?: string | null
          title_en?: string
          title_ru?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "location_knowledge_city_id_fkey"
            columns: ["city_id"]
            isOneToOne: false
            referencedRelation: "cities"
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
          city_id: string | null
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
          value_th: string | null
        }
        Insert: {
          city_id?: string | null
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
          value_th?: string | null
        }
        Update: {
          city_id?: string | null
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
          value_th?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "lookup_values_city_id_fkey"
            columns: ["city_id"]
            isOneToOne: false
            referencedRelation: "cities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lookup_values_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "lookup_values"
            referencedColumns: ["id"]
          },
        ]
      }
      management_companies: {
        Row: {
          address: string | null
          cover_image: string | null
          created_at: string
          description_en: string | null
          description_ru: string | null
          district: string | null
          email: string | null
          founded_year: number | null
          id: string
          is_active: boolean | null
          is_featured: boolean | null
          is_verified: boolean | null
          languages: string[] | null
          logo: string | null
          name_en: string
          name_ru: string
          phone: string | null
          properties_count: number | null
          provider_id: string | null
          rating: number | null
          review_count: number | null
          services: string[] | null
          slug: string
          updated_at: string
          website: string | null
          whatsapp: string | null
        }
        Insert: {
          address?: string | null
          cover_image?: string | null
          created_at?: string
          description_en?: string | null
          description_ru?: string | null
          district?: string | null
          email?: string | null
          founded_year?: number | null
          id?: string
          is_active?: boolean | null
          is_featured?: boolean | null
          is_verified?: boolean | null
          languages?: string[] | null
          logo?: string | null
          name_en: string
          name_ru: string
          phone?: string | null
          properties_count?: number | null
          provider_id?: string | null
          rating?: number | null
          review_count?: number | null
          services?: string[] | null
          slug: string
          updated_at?: string
          website?: string | null
          whatsapp?: string | null
        }
        Update: {
          address?: string | null
          cover_image?: string | null
          created_at?: string
          description_en?: string | null
          description_ru?: string | null
          district?: string | null
          email?: string | null
          founded_year?: number | null
          id?: string
          is_active?: boolean | null
          is_featured?: boolean | null
          is_verified?: boolean | null
          languages?: string[] | null
          logo?: string | null
          name_en?: string
          name_ru?: string
          phone?: string | null
          properties_count?: number | null
          provider_id?: string | null
          rating?: number | null
          review_count?: number | null
          services?: string[] | null
          slug?: string
          updated_at?: string
          website?: string | null
          whatsapp?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "management_companies_provider_id_fkey"
            columns: ["provider_id"]
            isOneToOne: true
            referencedRelation: "providers"
            referencedColumns: ["id"]
          },
        ]
      }
      management_company_members: {
        Row: {
          company_id: string
          created_at: string
          id: string
          is_active: boolean | null
          role: string
          user_id: string
        }
        Insert: {
          company_id: string
          created_at?: string
          id?: string
          is_active?: boolean | null
          role?: string
          user_id: string
        }
        Update: {
          company_id?: string
          created_at?: string
          id?: string
          is_active?: boolean | null
          role?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "management_company_members_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "management_companies"
            referencedColumns: ["id"]
          },
        ]
      }
      management_terms_activity: {
        Row: {
          action: string
          created_at: string
          field_name: string | null
          id: string
          new_value: string | null
          note: string | null
          old_value: string | null
          terms_id: string
          user_id: string
        }
        Insert: {
          action: string
          created_at?: string
          field_name?: string | null
          id?: string
          new_value?: string | null
          note?: string | null
          old_value?: string | null
          terms_id: string
          user_id: string
        }
        Update: {
          action?: string
          created_at?: string
          field_name?: string | null
          id?: string
          new_value?: string | null
          note?: string | null
          old_value?: string | null
          terms_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "management_terms_activity_terms_id_fkey"
            columns: ["terms_id"]
            isOneToOne: false
            referencedRelation: "property_management_terms"
            referencedColumns: ["id"]
          },
        ]
      }
      marketplace_categories: {
        Row: {
          category_group: string | null
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
          category_group?: string | null
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
          category_group?: string | null
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
      marketplace_international_shipping: {
        Row: {
          base_fee: number
          created_at: string
          estimated_days_max: number
          estimated_days_min: number
          id: string
          is_active: boolean
          min_order_amount: number
          per_kg_fee: number
          sort_order: number | null
          zone_code: string
          zone_name_en: string
          zone_name_ru: string
        }
        Insert: {
          base_fee?: number
          created_at?: string
          estimated_days_max?: number
          estimated_days_min?: number
          id?: string
          is_active?: boolean
          min_order_amount?: number
          per_kg_fee?: number
          sort_order?: number | null
          zone_code: string
          zone_name_en: string
          zone_name_ru: string
        }
        Update: {
          base_fee?: number
          created_at?: string
          estimated_days_max?: number
          estimated_days_min?: number
          id?: string
          is_active?: boolean
          min_order_amount?: number
          per_kg_fee?: number
          sort_order?: number | null
          zone_code?: string
          zone_name_en?: string
          zone_name_ru?: string
        }
        Relationships: []
      }
      marketplace_order_status_history: {
        Row: {
          changed_by: string | null
          created_at: string
          id: string
          location: string | null
          notes: string | null
          order_id: string
          status: string
          status_ru: string | null
        }
        Insert: {
          changed_by?: string | null
          created_at?: string
          id?: string
          location?: string | null
          notes?: string | null
          order_id: string
          status: string
          status_ru?: string | null
        }
        Update: {
          changed_by?: string | null
          created_at?: string
          id?: string
          location?: string | null
          notes?: string | null
          order_id?: string
          status?: string
          status_ru?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "marketplace_order_status_history_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
        ]
      }
      marketplace_product_attributes: {
        Row: {
          attribute_key: string
          attribute_value: string
          attribute_value_ru: string | null
          created_at: string | null
          id: string
          product_id: string | null
          sort_order: number | null
        }
        Insert: {
          attribute_key: string
          attribute_value: string
          attribute_value_ru?: string | null
          created_at?: string | null
          id?: string
          product_id?: string | null
          sort_order?: number | null
        }
        Update: {
          attribute_key?: string
          attribute_value?: string
          attribute_value_ru?: string | null
          created_at?: string | null
          id?: string
          product_id?: string | null
          sort_order?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "marketplace_product_attributes_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "marketplace_products"
            referencedColumns: ["id"]
          },
        ]
      }
      marketplace_products: {
        Row: {
          approval_status: string | null
          category_slug: string
          commission_rate: number | null
          condition: string | null
          contact_phone: string | null
          contact_whatsapp: string | null
          cover_image: string | null
          created_at: string | null
          created_by_uno_team: boolean | null
          currency: string | null
          description_en: string | null
          description_ru: string | null
          expires_at: string | null
          flash_deal_ends_at: string | null
          id: string
          images: string[] | null
          in_stock: boolean | null
          is_active: boolean | null
          is_flash_deal: boolean | null
          is_negotiable: boolean | null
          is_new: boolean | null
          is_popular: boolean | null
          is_shippable_international: boolean | null
          is_verified: boolean | null
          location: string | null
          markup_amount: number | null
          name_en: string
          name_ru: string
          original_price: number | null
          pack_quantity: number | null
          price: number
          pricing_type: string | null
          purchase_count: number | null
          rating: number | null
          recipe: Json | null
          review_count: number | null
          seller_id: string | null
          seller_type: string | null
          sort_order: number | null
          subcategory: string | null
          tags: string[] | null
          unit: string | null
          unit_measure: string | null
          unit_ru: string | null
          unit_value: number | null
          uno_team_creator_id: string | null
          updated_at: string | null
          vendor_id: string | null
          vendor_name: string | null
          vendor_name_ru: string | null
          views_count: number | null
          weight_kg: number | null
        }
        Insert: {
          approval_status?: string | null
          category_slug: string
          commission_rate?: number | null
          condition?: string | null
          contact_phone?: string | null
          contact_whatsapp?: string | null
          cover_image?: string | null
          created_at?: string | null
          created_by_uno_team?: boolean | null
          currency?: string | null
          description_en?: string | null
          description_ru?: string | null
          expires_at?: string | null
          flash_deal_ends_at?: string | null
          id?: string
          images?: string[] | null
          in_stock?: boolean | null
          is_active?: boolean | null
          is_flash_deal?: boolean | null
          is_negotiable?: boolean | null
          is_new?: boolean | null
          is_popular?: boolean | null
          is_shippable_international?: boolean | null
          is_verified?: boolean | null
          location?: string | null
          markup_amount?: number | null
          name_en: string
          name_ru: string
          original_price?: number | null
          pack_quantity?: number | null
          price: number
          pricing_type?: string | null
          purchase_count?: number | null
          rating?: number | null
          recipe?: Json | null
          review_count?: number | null
          seller_id?: string | null
          seller_type?: string | null
          sort_order?: number | null
          subcategory?: string | null
          tags?: string[] | null
          unit?: string | null
          unit_measure?: string | null
          unit_ru?: string | null
          unit_value?: number | null
          uno_team_creator_id?: string | null
          updated_at?: string | null
          vendor_id?: string | null
          vendor_name?: string | null
          vendor_name_ru?: string | null
          views_count?: number | null
          weight_kg?: number | null
        }
        Update: {
          approval_status?: string | null
          category_slug?: string
          commission_rate?: number | null
          condition?: string | null
          contact_phone?: string | null
          contact_whatsapp?: string | null
          cover_image?: string | null
          created_at?: string | null
          created_by_uno_team?: boolean | null
          currency?: string | null
          description_en?: string | null
          description_ru?: string | null
          expires_at?: string | null
          flash_deal_ends_at?: string | null
          id?: string
          images?: string[] | null
          in_stock?: boolean | null
          is_active?: boolean | null
          is_flash_deal?: boolean | null
          is_negotiable?: boolean | null
          is_new?: boolean | null
          is_popular?: boolean | null
          is_shippable_international?: boolean | null
          is_verified?: boolean | null
          location?: string | null
          markup_amount?: number | null
          name_en?: string
          name_ru?: string
          original_price?: number | null
          pack_quantity?: number | null
          price?: number
          pricing_type?: string | null
          purchase_count?: number | null
          rating?: number | null
          recipe?: Json | null
          review_count?: number | null
          seller_id?: string | null
          seller_type?: string | null
          sort_order?: number | null
          subcategory?: string | null
          tags?: string[] | null
          unit?: string | null
          unit_measure?: string | null
          unit_ru?: string | null
          unit_value?: number | null
          uno_team_creator_id?: string | null
          updated_at?: string | null
          vendor_id?: string | null
          vendor_name?: string | null
          vendor_name_ru?: string | null
          views_count?: number | null
          weight_kg?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "marketplace_products_category_slug_fkey"
            columns: ["category_slug"]
            isOneToOne: false
            referencedRelation: "marketplace_categories"
            referencedColumns: ["slug"]
          },
          {
            foreignKeyName: "marketplace_products_vendor_id_fkey"
            columns: ["vendor_id"]
            isOneToOne: false
            referencedRelation: "marketplace_vendors"
            referencedColumns: ["id"]
          },
        ]
      }
      marketplace_promo_codes: {
        Row: {
          code: string
          created_at: string
          description_en: string | null
          description_ru: string | null
          discount_type: string
          discount_value: number
          id: string
          is_active: boolean | null
          max_discount_amount: number | null
          min_order_amount: number | null
          usage_limit: number | null
          used_count: number | null
          valid_from: string | null
          valid_until: string | null
        }
        Insert: {
          code: string
          created_at?: string
          description_en?: string | null
          description_ru?: string | null
          discount_type: string
          discount_value: number
          id?: string
          is_active?: boolean | null
          max_discount_amount?: number | null
          min_order_amount?: number | null
          usage_limit?: number | null
          used_count?: number | null
          valid_from?: string | null
          valid_until?: string | null
        }
        Update: {
          code?: string
          created_at?: string
          description_en?: string | null
          description_ru?: string | null
          discount_type?: string
          discount_value?: number
          id?: string
          is_active?: boolean | null
          max_discount_amount?: number | null
          min_order_amount?: number | null
          usage_limit?: number | null
          used_count?: number | null
          valid_from?: string | null
          valid_until?: string | null
        }
        Relationships: []
      }
      marketplace_promo_usage: {
        Row: {
          discount_applied: number
          id: string
          order_id: string | null
          promo_code_id: string
          used_at: string
          user_id: string
        }
        Insert: {
          discount_applied: number
          id?: string
          order_id?: string | null
          promo_code_id: string
          used_at?: string
          user_id: string
        }
        Update: {
          discount_applied?: number
          id?: string
          order_id?: string | null
          promo_code_id?: string
          used_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "marketplace_promo_usage_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "marketplace_promo_usage_promo_code_id_fkey"
            columns: ["promo_code_id"]
            isOneToOne: false
            referencedRelation: "marketplace_promo_codes"
            referencedColumns: ["id"]
          },
        ]
      }
      marketplace_promotions: {
        Row: {
          badge_en: string | null
          badge_ru: string | null
          created_at: string | null
          ends_at: string | null
          gradient: string | null
          icon: string | null
          id: string
          image_url: string | null
          is_active: boolean | null
          link_path: string
          sort_order: number | null
          starts_at: string | null
          subtitle_en: string | null
          subtitle_ru: string | null
          title_en: string
          title_ru: string
        }
        Insert: {
          badge_en?: string | null
          badge_ru?: string | null
          created_at?: string | null
          ends_at?: string | null
          gradient?: string | null
          icon?: string | null
          id?: string
          image_url?: string | null
          is_active?: boolean | null
          link_path: string
          sort_order?: number | null
          starts_at?: string | null
          subtitle_en?: string | null
          subtitle_ru?: string | null
          title_en: string
          title_ru: string
        }
        Update: {
          badge_en?: string | null
          badge_ru?: string | null
          created_at?: string | null
          ends_at?: string | null
          gradient?: string | null
          icon?: string | null
          id?: string
          image_url?: string | null
          is_active?: boolean | null
          link_path?: string
          sort_order?: number | null
          starts_at?: string | null
          subtitle_en?: string | null
          subtitle_ru?: string | null
          title_en?: string
          title_ru?: string
        }
        Relationships: []
      }
      marketplace_reviews: {
        Row: {
          cons: string | null
          content: string | null
          created_at: string
          helpful_count: number | null
          id: string
          is_approved: boolean | null
          is_verified_purchase: boolean | null
          photos: string[] | null
          product_id: string
          pros: string | null
          rating: number
          title: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          cons?: string | null
          content?: string | null
          created_at?: string
          helpful_count?: number | null
          id?: string
          is_approved?: boolean | null
          is_verified_purchase?: boolean | null
          photos?: string[] | null
          product_id: string
          pros?: string | null
          rating: number
          title?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          cons?: string | null
          content?: string | null
          created_at?: string
          helpful_count?: number | null
          id?: string
          is_approved?: boolean | null
          is_verified_purchase?: boolean | null
          photos?: string[] | null
          product_id?: string
          pros?: string | null
          rating?: number
          title?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "marketplace_reviews_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "marketplace_products"
            referencedColumns: ["id"]
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
      marketplace_vendors: {
        Row: {
          address: string | null
          address_ru: string | null
          approval_status: string | null
          cover_image: string | null
          created_at: string
          created_by_uno_team: boolean | null
          description_en: string | null
          description_ru: string | null
          email: string | null
          id: string
          is_active: boolean
          is_verified: boolean | null
          logo_url: string | null
          name_en: string
          name_ru: string
          phone: string | null
          rating: number | null
          review_count: number
          slug: string
          uno_team_creator_id: string | null
          updated_at: string
          verified: boolean
          website: string | null
        }
        Insert: {
          address?: string | null
          address_ru?: string | null
          approval_status?: string | null
          cover_image?: string | null
          created_at?: string
          created_by_uno_team?: boolean | null
          description_en?: string | null
          description_ru?: string | null
          email?: string | null
          id?: string
          is_active?: boolean
          is_verified?: boolean | null
          logo_url?: string | null
          name_en: string
          name_ru: string
          phone?: string | null
          rating?: number | null
          review_count?: number
          slug: string
          uno_team_creator_id?: string | null
          updated_at?: string
          verified?: boolean
          website?: string | null
        }
        Update: {
          address?: string | null
          address_ru?: string | null
          approval_status?: string | null
          cover_image?: string | null
          created_at?: string
          created_by_uno_team?: boolean | null
          description_en?: string | null
          description_ru?: string | null
          email?: string | null
          id?: string
          is_active?: boolean
          is_verified?: boolean | null
          logo_url?: string | null
          name_en?: string
          name_ru?: string
          phone?: string | null
          rating?: number | null
          review_count?: number
          slug?: string
          uno_team_creator_id?: string | null
          updated_at?: string
          verified?: boolean
          website?: string | null
        }
        Relationships: []
      }
      marketplace_wishlist: {
        Row: {
          created_at: string
          id: string
          product_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          product_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          product_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "marketplace_wishlist_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "marketplace_products"
            referencedColumns: ["id"]
          },
        ]
      }
      mcc_ab_tests: {
        Row: {
          conversions_a: number | null
          conversions_b: number | null
          created_at: string
          ended_at: string | null
          id: string
          impressions_a: number | null
          impressions_b: number | null
          is_active: boolean | null
          landing_id: string
          started_at: string | null
          test_type: string
          traffic_split: number | null
          updated_at: string
          variant_a: Json
          variant_b: Json
          winner: string | null
        }
        Insert: {
          conversions_a?: number | null
          conversions_b?: number | null
          created_at?: string
          ended_at?: string | null
          id?: string
          impressions_a?: number | null
          impressions_b?: number | null
          is_active?: boolean | null
          landing_id: string
          started_at?: string | null
          test_type: string
          traffic_split?: number | null
          updated_at?: string
          variant_a: Json
          variant_b: Json
          winner?: string | null
        }
        Update: {
          conversions_a?: number | null
          conversions_b?: number | null
          created_at?: string
          ended_at?: string | null
          id?: string
          impressions_a?: number | null
          impressions_b?: number | null
          is_active?: boolean | null
          landing_id?: string
          started_at?: string | null
          test_type?: string
          traffic_split?: number | null
          updated_at?: string
          variant_a?: Json
          variant_b?: Json
          winner?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "mcc_ab_tests_landing_id_fkey"
            columns: ["landing_id"]
            isOneToOne: false
            referencedRelation: "mcc_landing_registry"
            referencedColumns: ["landing_id"]
          },
        ]
      }
      mcc_ai_recommendations: {
        Row: {
          applied_at: string | null
          applied_by: string | null
          confidence: number
          created_at: string | null
          data_points: Json | null
          dismissed_at: string | null
          dismissed_reason: string | null
          expected_impact: string | null
          expires_at: string | null
          id: string
          recommendation_type: string
          status: string | null
          target_entity: string | null
          what_happened: string
          what_to_do: string
          why_it_matters: string
        }
        Insert: {
          applied_at?: string | null
          applied_by?: string | null
          confidence?: number
          created_at?: string | null
          data_points?: Json | null
          dismissed_at?: string | null
          dismissed_reason?: string | null
          expected_impact?: string | null
          expires_at?: string | null
          id?: string
          recommendation_type: string
          status?: string | null
          target_entity?: string | null
          what_happened: string
          what_to_do: string
          why_it_matters: string
        }
        Update: {
          applied_at?: string | null
          applied_by?: string | null
          confidence?: number
          created_at?: string | null
          data_points?: Json | null
          dismissed_at?: string | null
          dismissed_reason?: string | null
          expected_impact?: string | null
          expires_at?: string | null
          id?: string
          recommendation_type?: string
          status?: string | null
          target_entity?: string | null
          what_happened?: string
          what_to_do?: string
          why_it_matters?: string
        }
        Relationships: []
      }
      mcc_automation_rules: {
        Row: {
          actions: Json
          created_at: string | null
          created_by: string | null
          description: string | null
          executions_count: number | null
          id: string
          is_active: boolean | null
          landing_filter: string[] | null
          last_executed_at: string | null
          name: string
          trigger_conditions: Json
          trigger_type: string
          updated_at: string | null
          user_state_filter: string[] | null
        }
        Insert: {
          actions: Json
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          executions_count?: number | null
          id?: string
          is_active?: boolean | null
          landing_filter?: string[] | null
          last_executed_at?: string | null
          name: string
          trigger_conditions: Json
          trigger_type: string
          updated_at?: string | null
          user_state_filter?: string[] | null
        }
        Update: {
          actions?: Json
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          executions_count?: number | null
          id?: string
          is_active?: boolean | null
          landing_filter?: string[] | null
          last_executed_at?: string | null
          name?: string
          trigger_conditions?: Json
          trigger_type?: string
          updated_at?: string | null
          user_state_filter?: string[] | null
        }
        Relationships: []
      }
      mcc_campaign_rules: {
        Row: {
          campaign_id: string
          channel: string | null
          cooldown_hours: number | null
          created_at: string | null
          id: string
          is_active: boolean | null
          max_sends_per_day: number | null
          message_template: Json | null
          quiet_hours_end: number | null
          quiet_hours_start: number | null
          target_state: string | null
          trigger_event: string
          updated_at: string | null
        }
        Insert: {
          campaign_id: string
          channel?: string | null
          cooldown_hours?: number | null
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          max_sends_per_day?: number | null
          message_template?: Json | null
          quiet_hours_end?: number | null
          quiet_hours_start?: number | null
          target_state?: string | null
          trigger_event: string
          updated_at?: string | null
        }
        Update: {
          campaign_id?: string
          channel?: string | null
          cooldown_hours?: number | null
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          max_sends_per_day?: number | null
          message_template?: Json | null
          quiet_hours_end?: number | null
          quiet_hours_start?: number | null
          target_state?: string | null
          trigger_event?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      mcc_campaigns: {
        Row: {
          ab_variants: Json | null
          budget: Json | null
          channels: Json | null
          created_at: string | null
          created_by: string | null
          description: string | null
          goal: string
          id: string
          kpi_targets: Json | null
          landing_id: string | null
          name: string
          performance_data: Json | null
          schedule: Json | null
          status: string | null
          target_segment: string | null
          updated_at: string | null
        }
        Insert: {
          ab_variants?: Json | null
          budget?: Json | null
          channels?: Json | null
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          goal: string
          id?: string
          kpi_targets?: Json | null
          landing_id?: string | null
          name: string
          performance_data?: Json | null
          schedule?: Json | null
          status?: string | null
          target_segment?: string | null
          updated_at?: string | null
        }
        Update: {
          ab_variants?: Json | null
          budget?: Json | null
          channels?: Json | null
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          goal?: string
          id?: string
          kpi_targets?: Json | null
          landing_id?: string | null
          name?: string
          performance_data?: Json | null
          schedule?: Json | null
          status?: string | null
          target_segment?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      mcc_channel_metrics: {
        Row: {
          cac: number | null
          campaign_id: string | null
          channel: string
          clicks: number | null
          conversions: number | null
          cpc: number | null
          cpl: number | null
          created_at: string | null
          ctr: number | null
          cvr: number | null
          date: string
          id: string
          impressions: number | null
          leads: number | null
          revenue: number | null
          roas: number | null
          signups: number | null
          source: string | null
          spend: number | null
        }
        Insert: {
          cac?: number | null
          campaign_id?: string | null
          channel: string
          clicks?: number | null
          conversions?: number | null
          cpc?: number | null
          cpl?: number | null
          created_at?: string | null
          ctr?: number | null
          cvr?: number | null
          date?: string
          id?: string
          impressions?: number | null
          leads?: number | null
          revenue?: number | null
          roas?: number | null
          signups?: number | null
          source?: string | null
          spend?: number | null
        }
        Update: {
          cac?: number | null
          campaign_id?: string | null
          channel?: string
          clicks?: number | null
          conversions?: number | null
          cpc?: number | null
          cpl?: number | null
          created_at?: string | null
          ctr?: number | null
          cvr?: number | null
          date?: string
          id?: string
          impressions?: number | null
          leads?: number | null
          revenue?: number | null
          roas?: number | null
          signups?: number | null
          source?: string | null
          spend?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "mcc_channel_metrics_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "mcc_campaigns"
            referencedColumns: ["id"]
          },
        ]
      }
      mcc_creatives: {
        Row: {
          campaign_id: string | null
          clicks: number | null
          content: Json
          conversions: number | null
          created_at: string | null
          creative_type: string
          id: string
          impressions: number | null
          is_active: boolean | null
          is_control: boolean | null
          language: string | null
          name: string
          performance: Json | null
          spend: number | null
          updated_at: string | null
          variant_name: string | null
        }
        Insert: {
          campaign_id?: string | null
          clicks?: number | null
          content: Json
          conversions?: number | null
          created_at?: string | null
          creative_type: string
          id?: string
          impressions?: number | null
          is_active?: boolean | null
          is_control?: boolean | null
          language?: string | null
          name: string
          performance?: Json | null
          spend?: number | null
          updated_at?: string | null
          variant_name?: string | null
        }
        Update: {
          campaign_id?: string | null
          clicks?: number | null
          content?: Json
          conversions?: number | null
          created_at?: string | null
          creative_type?: string
          id?: string
          impressions?: number | null
          is_active?: boolean | null
          is_control?: boolean | null
          language?: string | null
          name?: string
          performance?: Json | null
          spend?: number | null
          updated_at?: string | null
          variant_name?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "mcc_creatives_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "mcc_campaigns"
            referencedColumns: ["id"]
          },
        ]
      }
      mcc_events: {
        Row: {
          campaign_id: string | null
          channel: string | null
          created_at: string | null
          creative_id: string | null
          event_type: string
          funnel_id: string | null
          id: string
          lead_id: string | null
          properties: Json | null
          revenue: number | null
          source: string | null
          user_id: string | null
        }
        Insert: {
          campaign_id?: string | null
          channel?: string | null
          created_at?: string | null
          creative_id?: string | null
          event_type: string
          funnel_id?: string | null
          id?: string
          lead_id?: string | null
          properties?: Json | null
          revenue?: number | null
          source?: string | null
          user_id?: string | null
        }
        Update: {
          campaign_id?: string | null
          channel?: string | null
          created_at?: string | null
          creative_id?: string | null
          event_type?: string
          funnel_id?: string | null
          id?: string
          lead_id?: string | null
          properties?: Json | null
          revenue?: number | null
          source?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "mcc_events_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "mcc_campaigns"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "mcc_events_creative_id_fkey"
            columns: ["creative_id"]
            isOneToOne: false
            referencedRelation: "mcc_creatives"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "mcc_events_funnel_id_fkey"
            columns: ["funnel_id"]
            isOneToOne: false
            referencedRelation: "mcc_funnels"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "mcc_events_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "mcc_leads"
            referencedColumns: ["id"]
          },
        ]
      }
      mcc_funnel_events: {
        Row: {
          entered_at: string | null
          exit_reason: string | null
          exited_at: string | null
          funnel_id: string | null
          id: string
          lead_id: string | null
          metadata: Json | null
          stage_id: string
          stage_name: string | null
          time_in_stage: unknown
        }
        Insert: {
          entered_at?: string | null
          exit_reason?: string | null
          exited_at?: string | null
          funnel_id?: string | null
          id?: string
          lead_id?: string | null
          metadata?: Json | null
          stage_id: string
          stage_name?: string | null
          time_in_stage?: unknown
        }
        Update: {
          entered_at?: string | null
          exit_reason?: string | null
          exited_at?: string | null
          funnel_id?: string | null
          id?: string
          lead_id?: string | null
          metadata?: Json | null
          stage_id?: string
          stage_name?: string | null
          time_in_stage?: unknown
        }
        Relationships: [
          {
            foreignKeyName: "mcc_funnel_events_funnel_id_fkey"
            columns: ["funnel_id"]
            isOneToOne: false
            referencedRelation: "mcc_funnels"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "mcc_funnel_events_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "mcc_leads"
            referencedColumns: ["id"]
          },
        ]
      }
      mcc_funnels: {
        Row: {
          avg_time_to_convert: unknown
          conversion_rate: number | null
          created_at: string | null
          created_by: string | null
          description: string | null
          funnel_type: string
          id: string
          is_active: boolean | null
          name: string
          stages: Json
          target_segment: string | null
          triggers: Json | null
          updated_at: string | null
        }
        Insert: {
          avg_time_to_convert?: unknown
          conversion_rate?: number | null
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          funnel_type: string
          id?: string
          is_active?: boolean | null
          name: string
          stages?: Json
          target_segment?: string | null
          triggers?: Json | null
          updated_at?: string | null
        }
        Update: {
          avg_time_to_convert?: unknown
          conversion_rate?: number | null
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          funnel_type?: string
          id?: string
          is_active?: boolean | null
          name?: string
          stages?: Json
          target_segment?: string | null
          triggers?: Json | null
          updated_at?: string | null
        }
        Relationships: []
      }
      mcc_landing_events: {
        Row: {
          ab_variant: string | null
          campaign_id: string | null
          created_at: string
          event_name: string
          id: string
          landing_id: string | null
          payload: Json | null
          session_id: string
          temp_id: string | null
          user_id: string | null
          vertical: string | null
        }
        Insert: {
          ab_variant?: string | null
          campaign_id?: string | null
          created_at?: string
          event_name: string
          id?: string
          landing_id?: string | null
          payload?: Json | null
          session_id: string
          temp_id?: string | null
          user_id?: string | null
          vertical?: string | null
        }
        Update: {
          ab_variant?: string | null
          campaign_id?: string | null
          created_at?: string
          event_name?: string
          id?: string
          landing_id?: string | null
          payload?: Json | null
          session_id?: string
          temp_id?: string | null
          user_id?: string | null
          vertical?: string | null
        }
        Relationships: []
      }
      mcc_landing_registry: {
        Row: {
          created_at: string
          cta_label_en: string | null
          cta_label_ru: string | null
          cta_variant: string | null
          forbidden_elements: string[] | null
          hero_variant: string | null
          id: string
          is_active: boolean | null
          landing_id: string
          name_en: string
          name_ru: string | null
          next_actions: Json | null
          route_path: string
          target_path: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          cta_label_en?: string | null
          cta_label_ru?: string | null
          cta_variant?: string | null
          forbidden_elements?: string[] | null
          hero_variant?: string | null
          id?: string
          is_active?: boolean | null
          landing_id: string
          name_en: string
          name_ru?: string | null
          next_actions?: Json | null
          route_path: string
          target_path: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          cta_label_en?: string | null
          cta_label_ru?: string | null
          cta_variant?: string | null
          forbidden_elements?: string[] | null
          hero_variant?: string | null
          id?: string
          is_active?: boolean | null
          landing_id?: string
          name_en?: string
          name_ru?: string | null
          next_actions?: Json | null
          route_path?: string
          target_path?: string
          updated_at?: string
        }
        Relationships: []
      }
      mcc_leads: {
        Row: {
          ai_insights: Json | null
          app_opens: number | null
          campaign: string | null
          churn_risk: number | null
          content: string | null
          conversion_value: number | null
          converted_at: string | null
          converted_to: string | null
          created_at: string | null
          device_info: Json | null
          email: string | null
          emails_opened: number | null
          emails_sent: number | null
          first_touch_at: string | null
          geo_info: Json | null
          id: string
          landing_page: string | null
          last_touch_at: string | null
          medium: string | null
          messages_replied: number | null
          messages_sent: number | null
          name: string | null
          pages_viewed: number | null
          phone: string | null
          predicted_ltv: number | null
          priority: string | null
          referrer_url: string | null
          score: number | null
          segment: string | null
          source: string
          status: string | null
          substatus: string | null
          tags: string[] | null
          term: string | null
          touchpoints: Json | null
          updated_at: string | null
        }
        Insert: {
          ai_insights?: Json | null
          app_opens?: number | null
          campaign?: string | null
          churn_risk?: number | null
          content?: string | null
          conversion_value?: number | null
          converted_at?: string | null
          converted_to?: string | null
          created_at?: string | null
          device_info?: Json | null
          email?: string | null
          emails_opened?: number | null
          emails_sent?: number | null
          first_touch_at?: string | null
          geo_info?: Json | null
          id?: string
          landing_page?: string | null
          last_touch_at?: string | null
          medium?: string | null
          messages_replied?: number | null
          messages_sent?: number | null
          name?: string | null
          pages_viewed?: number | null
          phone?: string | null
          predicted_ltv?: number | null
          priority?: string | null
          referrer_url?: string | null
          score?: number | null
          segment?: string | null
          source: string
          status?: string | null
          substatus?: string | null
          tags?: string[] | null
          term?: string | null
          touchpoints?: Json | null
          updated_at?: string | null
        }
        Update: {
          ai_insights?: Json | null
          app_opens?: number | null
          campaign?: string | null
          churn_risk?: number | null
          content?: string | null
          conversion_value?: number | null
          converted_at?: string | null
          converted_to?: string | null
          created_at?: string | null
          device_info?: Json | null
          email?: string | null
          emails_opened?: number | null
          emails_sent?: number | null
          first_touch_at?: string | null
          geo_info?: Json | null
          id?: string
          landing_page?: string | null
          last_touch_at?: string | null
          medium?: string | null
          messages_replied?: number | null
          messages_sent?: number | null
          name?: string | null
          pages_viewed?: number | null
          phone?: string | null
          predicted_ltv?: number | null
          priority?: string | null
          referrer_url?: string | null
          score?: number | null
          segment?: string | null
          source?: string
          status?: string | null
          substatus?: string | null
          tags?: string[] | null
          term?: string | null
          touchpoints?: Json | null
          updated_at?: string | null
        }
        Relationships: []
      }
      mcc_message_log: {
        Row: {
          campaign_id: string | null
          channel: string
          clicked_at: string | null
          content_hash: string | null
          created_at: string | null
          delivered_at: string | null
          error: string | null
          id: string
          opened_at: string | null
          priority: string
          sent_at: string | null
          status: string | null
          template_id: string | null
          user_id: string
        }
        Insert: {
          campaign_id?: string | null
          channel: string
          clicked_at?: string | null
          content_hash?: string | null
          created_at?: string | null
          delivered_at?: string | null
          error?: string | null
          id?: string
          opened_at?: string | null
          priority?: string
          sent_at?: string | null
          status?: string | null
          template_id?: string | null
          user_id: string
        }
        Update: {
          campaign_id?: string | null
          channel?: string
          clicked_at?: string | null
          content_hash?: string | null
          created_at?: string | null
          delivered_at?: string | null
          error?: string | null
          id?: string
          opened_at?: string | null
          priority?: string
          sent_at?: string | null
          status?: string | null
          template_id?: string | null
          user_id?: string
        }
        Relationships: []
      }
      mcc_sessions: {
        Row: {
          anon_id: string | null
          campaign_id: string | null
          country: string | null
          created_at: string | null
          device: string | null
          events_count: number | null
          id: string
          landing_id: string | null
          last_activity_at: string | null
          locale: string | null
          page_views: number | null
          referrer: string | null
          session_id: string
          started_at: string | null
          user_id: string | null
          utm_campaign: string | null
          utm_content: string | null
          utm_medium: string | null
          utm_source: string | null
          utm_term: string | null
        }
        Insert: {
          anon_id?: string | null
          campaign_id?: string | null
          country?: string | null
          created_at?: string | null
          device?: string | null
          events_count?: number | null
          id?: string
          landing_id?: string | null
          last_activity_at?: string | null
          locale?: string | null
          page_views?: number | null
          referrer?: string | null
          session_id: string
          started_at?: string | null
          user_id?: string | null
          utm_campaign?: string | null
          utm_content?: string | null
          utm_medium?: string | null
          utm_source?: string | null
          utm_term?: string | null
        }
        Update: {
          anon_id?: string | null
          campaign_id?: string | null
          country?: string | null
          created_at?: string | null
          device?: string | null
          events_count?: number | null
          id?: string
          landing_id?: string | null
          last_activity_at?: string | null
          locale?: string | null
          page_views?: number | null
          referrer?: string | null
          session_id?: string
          started_at?: string | null
          user_id?: string | null
          utm_campaign?: string | null
          utm_content?: string | null
          utm_medium?: string | null
          utm_source?: string | null
          utm_term?: string | null
        }
        Relationships: []
      }
      mcc_state_history: {
        Row: {
          created_at: string | null
          from_state: string | null
          id: string
          landing_id: string | null
          metadata: Json | null
          to_state: string
          trigger_event: string | null
          trigger_event_id: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          from_state?: string | null
          id?: string
          landing_id?: string | null
          metadata?: Json | null
          to_state: string
          trigger_event?: string | null
          trigger_event_id?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          from_state?: string | null
          id?: string
          landing_id?: string | null
          metadata?: Json | null
          to_state?: string
          trigger_event?: string | null
          trigger_event_id?: string | null
          user_id?: string
        }
        Relationships: []
      }
      mcc_user_states: {
        Row: {
          created_at: string
          first_vertical: string | null
          id: string
          previous_state: string | null
          source_landing: string | null
          state: string
          transitioned_at: string | null
          updated_at: string
          user_id: string
          verticals_used: string[] | null
        }
        Insert: {
          created_at?: string
          first_vertical?: string | null
          id?: string
          previous_state?: string | null
          source_landing?: string | null
          state?: string
          transitioned_at?: string | null
          updated_at?: string
          user_id: string
          verticals_used?: string[] | null
        }
        Update: {
          created_at?: string
          first_vertical?: string | null
          id?: string
          previous_state?: string | null
          source_landing?: string | null
          state?: string
          transitioned_at?: string | null
          updated_at?: string
          user_id?: string
          verticals_used?: string[] | null
        }
        Relationships: []
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
      meter_readings: {
        Row: {
          booking_id: string
          created_at: string
          electricity_photo_url: string | null
          electricity_reading: number | null
          gas_photo_url: string | null
          gas_reading: number | null
          id: string
          notes: string | null
          owner_id: string
          property_id: string
          reading_type: string
          recorded_at: string
          recorded_by: string | null
          water_photo_url: string | null
          water_reading: number | null
        }
        Insert: {
          booking_id: string
          created_at?: string
          electricity_photo_url?: string | null
          electricity_reading?: number | null
          gas_photo_url?: string | null
          gas_reading?: number | null
          id?: string
          notes?: string | null
          owner_id: string
          property_id: string
          reading_type: string
          recorded_at?: string
          recorded_by?: string | null
          water_photo_url?: string | null
          water_reading?: number | null
        }
        Update: {
          booking_id?: string
          created_at?: string
          electricity_photo_url?: string | null
          electricity_reading?: number | null
          gas_photo_url?: string | null
          gas_reading?: number | null
          id?: string
          notes?: string | null
          owner_id?: string
          property_id?: string
          reading_type?: string
          recorded_at?: string
          recorded_by?: string | null
          water_photo_url?: string | null
          water_reading?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "meter_readings_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "property_bookings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "meter_readings_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "owner_properties"
            referencedColumns: ["id"]
          },
        ]
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
      order_item_flower_details: {
        Row: {
          created_at: string | null
          delivery_address: string | null
          delivery_slot: string | null
          gift_wrap: boolean | null
          id: string
          message_card: string | null
          order_item_id: string
          recipient_name: string | null
          recipient_phone: string | null
          special_instructions: string | null
        }
        Insert: {
          created_at?: string | null
          delivery_address?: string | null
          delivery_slot?: string | null
          gift_wrap?: boolean | null
          id?: string
          message_card?: string | null
          order_item_id: string
          recipient_name?: string | null
          recipient_phone?: string | null
          special_instructions?: string | null
        }
        Update: {
          created_at?: string | null
          delivery_address?: string | null
          delivery_slot?: string | null
          gift_wrap?: boolean | null
          id?: string
          message_card?: string | null
          order_item_id?: string
          recipient_name?: string | null
          recipient_phone?: string | null
          special_instructions?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "order_item_flower_details_order_item_id_fkey"
            columns: ["order_item_id"]
            isOneToOne: true
            referencedRelation: "order_items"
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
          balance_due_at: string | null
          balance_paid_at: string | null
          catering_included: boolean | null
          charter_type: string | null
          created_at: string | null
          crew_included: boolean | null
          deposit_amount: number | null
          deposit_paid_at: string | null
          deposit_percent: number | null
          guests_count: number | null
          id: string
          order_item_id: string
        }
        Insert: {
          balance_due_at?: string | null
          balance_paid_at?: string | null
          catering_included?: boolean | null
          charter_type?: string | null
          created_at?: string | null
          crew_included?: boolean | null
          deposit_amount?: number | null
          deposit_paid_at?: string | null
          deposit_percent?: number | null
          guests_count?: number | null
          id?: string
          order_item_id: string
        }
        Update: {
          balance_due_at?: string | null
          balance_paid_at?: string | null
          catering_included?: boolean | null
          charter_type?: string | null
          created_at?: string | null
          crew_included?: boolean | null
          deposit_amount?: number | null
          deposit_paid_at?: string | null
          deposit_percent?: number | null
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
      order_payment_stages: {
        Row: {
          amount: number
          created_at: string | null
          currency: string | null
          due_date: string | null
          id: string
          notes: string | null
          order_id: string
          paid_at: string | null
          payment_intent_id: string | null
          refund_amount: number | null
          refunded_at: string | null
          reminder_sent_at: string | null
          stage_type: string
          status: string | null
          updated_at: string | null
        }
        Insert: {
          amount: number
          created_at?: string | null
          currency?: string | null
          due_date?: string | null
          id?: string
          notes?: string | null
          order_id: string
          paid_at?: string | null
          payment_intent_id?: string | null
          refund_amount?: number | null
          refunded_at?: string | null
          reminder_sent_at?: string | null
          stage_type: string
          status?: string | null
          updated_at?: string | null
        }
        Update: {
          amount?: number
          created_at?: string | null
          currency?: string | null
          due_date?: string | null
          id?: string
          notes?: string | null
          order_id?: string
          paid_at?: string | null
          payment_intent_id?: string | null
          refund_amount?: number | null
          refunded_at?: string | null
          reminder_sent_at?: string | null
          stage_type?: string
          status?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "order_payment_stages_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "order_payment_stages_payment_intent_id_fkey"
            columns: ["payment_intent_id"]
            isOneToOne: false
            referencedRelation: "payment_intents"
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
          concierge_fee_amount: number | null
          created_at: string | null
          currency: string | null
          customer_user_id: string | null
          deleted_at: string | null
          deleted_by: string | null
          discount_amount: number | null
          end_at: string | null
          id: string
          is_reorder: boolean | null
          metadata: Json | null
          notes: string | null
          order_number: string | null
          order_type: string
          original_order_id: string | null
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
          concierge_fee_amount?: number | null
          created_at?: string | null
          currency?: string | null
          customer_user_id?: string | null
          deleted_at?: string | null
          deleted_by?: string | null
          discount_amount?: number | null
          end_at?: string | null
          id?: string
          is_reorder?: boolean | null
          metadata?: Json | null
          notes?: string | null
          order_number?: string | null
          order_type: string
          original_order_id?: string | null
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
          concierge_fee_amount?: number | null
          created_at?: string | null
          currency?: string | null
          customer_user_id?: string | null
          deleted_at?: string | null
          deleted_by?: string | null
          discount_amount?: number | null
          end_at?: string | null
          id?: string
          is_reorder?: boolean | null
          metadata?: Json | null
          notes?: string | null
          order_number?: string | null
          order_type?: string
          original_order_id?: string | null
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
            foreignKeyName: "orders_original_order_id_fkey"
            columns: ["original_order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
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
      ota_listing_connections: {
        Row: {
          auto_sync_enabled: boolean | null
          created_at: string
          id: string
          is_active: boolean | null
          last_sync_at: string | null
          last_sync_status: string | null
          listing_id: string | null
          listing_url: string
          owner_id: string
          platform: string
          property_id: string | null
          sync_error: string | null
          sync_interval_hours: number | null
          updated_at: string
        }
        Insert: {
          auto_sync_enabled?: boolean | null
          created_at?: string
          id?: string
          is_active?: boolean | null
          last_sync_at?: string | null
          last_sync_status?: string | null
          listing_id?: string | null
          listing_url: string
          owner_id: string
          platform: string
          property_id?: string | null
          sync_error?: string | null
          sync_interval_hours?: number | null
          updated_at?: string
        }
        Update: {
          auto_sync_enabled?: boolean | null
          created_at?: string
          id?: string
          is_active?: boolean | null
          last_sync_at?: string | null
          last_sync_status?: string | null
          listing_id?: string | null
          listing_url?: string
          owner_id?: string
          platform?: string
          property_id?: string | null
          sync_error?: string | null
          sync_interval_hours?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "ota_listing_connections_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "owner_properties"
            referencedColumns: ["id"]
          },
        ]
      }
      ota_sync_logs: {
        Row: {
          completed_at: string | null
          connection_id: string
          duration_ms: number | null
          error_message: string | null
          id: string
          items_synced: Json | null
          started_at: string
          status: string
          sync_type: string
        }
        Insert: {
          completed_at?: string | null
          connection_id: string
          duration_ms?: number | null
          error_message?: string | null
          id?: string
          items_synced?: Json | null
          started_at?: string
          status: string
          sync_type: string
        }
        Update: {
          completed_at?: string | null
          connection_id?: string
          duration_ms?: number | null
          error_message?: string | null
          id?: string
          items_synced?: Json | null
          started_at?: string
          status?: string
          sync_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "ota_sync_logs_connection_id_fkey"
            columns: ["connection_id"]
            isOneToOne: false
            referencedRelation: "ota_listing_connections"
            referencedColumns: ["id"]
          },
        ]
      }
      ota_synced_listings: {
        Row: {
          address: string | null
          amenities: string[] | null
          bathrooms: number | null
          bedrooms: number | null
          blocked_dates: Json | null
          cleaning_fee: number | null
          connection_id: string
          cover_photo: string | null
          currency: string | null
          description: string | null
          house_rules: string | null
          ical_url: string | null
          id: string
          lat: number | null
          lng: number | null
          max_guests: number | null
          parsed_at: string | null
          photos: Json | null
          price_per_night: number | null
          property_type: string | null
          rating: number | null
          raw_data: Json | null
          review_count: number | null
          synced_at: string
          title: string | null
        }
        Insert: {
          address?: string | null
          amenities?: string[] | null
          bathrooms?: number | null
          bedrooms?: number | null
          blocked_dates?: Json | null
          cleaning_fee?: number | null
          connection_id: string
          cover_photo?: string | null
          currency?: string | null
          description?: string | null
          house_rules?: string | null
          ical_url?: string | null
          id?: string
          lat?: number | null
          lng?: number | null
          max_guests?: number | null
          parsed_at?: string | null
          photos?: Json | null
          price_per_night?: number | null
          property_type?: string | null
          rating?: number | null
          raw_data?: Json | null
          review_count?: number | null
          synced_at?: string
          title?: string | null
        }
        Update: {
          address?: string | null
          amenities?: string[] | null
          bathrooms?: number | null
          bedrooms?: number | null
          blocked_dates?: Json | null
          cleaning_fee?: number | null
          connection_id?: string
          cover_photo?: string | null
          currency?: string | null
          description?: string | null
          house_rules?: string | null
          ical_url?: string | null
          id?: string
          lat?: number | null
          lng?: number | null
          max_guests?: number | null
          parsed_at?: string | null
          photos?: Json | null
          price_per_night?: number | null
          property_type?: string | null
          rating?: number | null
          raw_data?: Json | null
          review_count?: number | null
          synced_at?: string
          title?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ota_synced_listings_connection_id_fkey"
            columns: ["connection_id"]
            isOneToOne: true
            referencedRelation: "ota_listing_connections"
            referencedColumns: ["id"]
          },
        ]
      }
      owner_commission_tiers: {
        Row: {
          benefits: Json | null
          commission_percent: number
          created_at: string | null
          id: string
          is_active: boolean | null
          min_gmv_thb: number
          tier_name: string
          tier_order: number
        }
        Insert: {
          benefits?: Json | null
          commission_percent?: number
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          min_gmv_thb?: number
          tier_name: string
          tier_order: number
        }
        Update: {
          benefits?: Json | null
          commission_percent?: number
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          min_gmv_thb?: number
          tier_name?: string
          tier_order?: number
        }
        Relationships: []
      }
      owner_invoices: {
        Row: {
          company_id: string
          created_at: string
          created_by: string
          currency: string
          due_date: string | null
          id: string
          invoice_number: string
          invoice_type: Database["public"]["Enums"]["invoice_type"]
          issued_date: string
          items: Json
          notes: string | null
          paid_date: string | null
          pdf_url: string | null
          property_id: string | null
          recipient_email: string | null
          recipient_name: string
          status: Database["public"]["Enums"]["invoice_status"]
          subtotal: number
          tax_amount: number
          tax_rate: number
          total: number
          updated_at: string
        }
        Insert: {
          company_id: string
          created_at?: string
          created_by: string
          currency?: string
          due_date?: string | null
          id?: string
          invoice_number: string
          invoice_type?: Database["public"]["Enums"]["invoice_type"]
          issued_date?: string
          items?: Json
          notes?: string | null
          paid_date?: string | null
          pdf_url?: string | null
          property_id?: string | null
          recipient_email?: string | null
          recipient_name: string
          status?: Database["public"]["Enums"]["invoice_status"]
          subtotal?: number
          tax_amount?: number
          tax_rate?: number
          total?: number
          updated_at?: string
        }
        Update: {
          company_id?: string
          created_at?: string
          created_by?: string
          currency?: string
          due_date?: string | null
          id?: string
          invoice_number?: string
          invoice_type?: Database["public"]["Enums"]["invoice_type"]
          issued_date?: string
          items?: Json
          notes?: string | null
          paid_date?: string | null
          pdf_url?: string | null
          property_id?: string | null
          recipient_email?: string | null
          recipient_name?: string
          status?: Database["public"]["Enums"]["invoice_status"]
          subtotal?: number
          tax_amount?: number
          tax_rate?: number
          total?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "owner_invoices_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "management_companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "owner_invoices_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "owner_invoices_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "v_marketplace_listings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "owner_invoices_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "v_owner_properties"
            referencedColumns: ["id"]
          },
        ]
      }
      owner_performance_metrics: {
        Row: {
          avg_rating: number | null
          avg_response_time_minutes: number | null
          cancellation_rate: number | null
          completed_bookings: number | null
          created_at: string | null
          id: string
          is_superhost: boolean | null
          last_evaluated_at: string | null
          owner_id: string
          response_rate: number | null
          review_reply_rate: number | null
          superhost_since: string | null
          total_bookings: number | null
          total_reviews: number | null
          updated_at: string | null
        }
        Insert: {
          avg_rating?: number | null
          avg_response_time_minutes?: number | null
          cancellation_rate?: number | null
          completed_bookings?: number | null
          created_at?: string | null
          id?: string
          is_superhost?: boolean | null
          last_evaluated_at?: string | null
          owner_id: string
          response_rate?: number | null
          review_reply_rate?: number | null
          superhost_since?: string | null
          total_bookings?: number | null
          total_reviews?: number | null
          updated_at?: string | null
        }
        Update: {
          avg_rating?: number | null
          avg_response_time_minutes?: number | null
          cancellation_rate?: number | null
          completed_bookings?: number | null
          created_at?: string | null
          id?: string
          is_superhost?: boolean | null
          last_evaluated_at?: string | null
          owner_id?: string
          response_rate?: number | null
          review_reply_rate?: number | null
          superhost_since?: string | null
          total_bookings?: number | null
          total_reviews?: number | null
          updated_at?: string | null
        }
        Relationships: []
      }
      owner_properties: {
        Row: {
          accessibility_features: string[] | null
          acquisition_costs: number | null
          actual_owner_email: string | null
          actual_owner_name: string | null
          actual_owner_phone: string | null
          address: string
          approval_status: string | null
          approved_at: string | null
          approved_by: string | null
          area_sqm: number | null
          auto_report_enabled: boolean | null
          balance_due_days: number | null
          bathrooms: number | null
          bedrooms: number | null
          cancellation_policy: string | null
          chat_delegated_to_platform: boolean | null
          check_in_instructions: string | null
          check_in_instructions_ru: string | null
          check_in_time: string | null
          check_out_time: string | null
          children_friendly: boolean | null
          cleaning_frequency: string | null
          cleaning_included: boolean | null
          commercial_terms_redacted: boolean | null
          complex_id: string | null
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
          garden_type: string | null
          has_crib: boolean | null
          has_elevator: boolean | null
          has_high_chair: boolean | null
          highlights: string[] | null
          host_languages: string[] | null
          house_rules: string | null
          house_rules_ru: string | null
          ical_token: string | null
          ical_token_expires_at: string | null
          ical_token_refreshed_at: string | null
          id: string
          images: string[] | null
          included_services: Json | null
          instant_booking: boolean | null
          instant_booking_enabled_at: string | null
          internal_name: string | null
          internet_provider: string | null
          internet_speed: string | null
          is_for_sale: boolean | null
          is_rented: boolean | null
          key_handover: string | null
          lat: number | null
          late_checkout_penalty: number | null
          late_checkout_price: number | null
          linen_change_frequency: string | null
          linen_change_price: number | null
          listing_modes: string[] | null
          lng: number | null
          managed_by: string | null
          managed_by_org_id: string | null
          management_document_name: string | null
          management_document_url: string | null
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
          ownership_form: string | null
          ownership_transferred_at: string | null
          ownership_type: string | null
          ownership_verification_notes: string | null
          ownership_verification_status: string | null
          ownership_verified_at: string | null
          ownership_verified_by: string | null
          parking_included: boolean | null
          parking_notes: string | null
          parking_spaces: number | null
          parking_type: string | null
          parties_allowed: boolean | null
          payment_model: string | null
          pet_deposit: number | null
          pet_notes: string | null
          pet_notes_ru: string | null
          pets_allowed: boolean | null
          plot_size_sqm: number | null
          pm_company_id: string | null
          pool_type: string | null
          prepay_percent: number | null
          price_per_night: number | null
          project_id: string | null
          property_type: string
          purchase_date: string | null
          purchase_price: number | null
          quiet_hours_end: string | null
          quiet_hours_start: string | null
          rejection_reason: string | null
          renovation_costs: number | null
          rental_platform: string | null
          report_frequency: string | null
          report_recipients: string[] | null
          rooms: Json | null
          safety_features: string[] | null
          sale_currency: string | null
          sale_price: number | null
          seasonal_pricing: Json | null
          security_deposit_collection: string | null
          security_deposit_required: boolean | null
          smoking_penalty: number | null
          status: string | null
          title: string
          title_ru: string | null
          total_floors: number | null
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
          acquisition_costs?: number | null
          actual_owner_email?: string | null
          actual_owner_name?: string | null
          actual_owner_phone?: string | null
          address: string
          approval_status?: string | null
          approved_at?: string | null
          approved_by?: string | null
          area_sqm?: number | null
          auto_report_enabled?: boolean | null
          balance_due_days?: number | null
          bathrooms?: number | null
          bedrooms?: number | null
          cancellation_policy?: string | null
          chat_delegated_to_platform?: boolean | null
          check_in_instructions?: string | null
          check_in_instructions_ru?: string | null
          check_in_time?: string | null
          check_out_time?: string | null
          children_friendly?: boolean | null
          cleaning_frequency?: string | null
          cleaning_included?: boolean | null
          commercial_terms_redacted?: boolean | null
          complex_id?: string | null
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
          garden_type?: string | null
          has_crib?: boolean | null
          has_elevator?: boolean | null
          has_high_chair?: boolean | null
          highlights?: string[] | null
          host_languages?: string[] | null
          house_rules?: string | null
          house_rules_ru?: string | null
          ical_token?: string | null
          ical_token_expires_at?: string | null
          ical_token_refreshed_at?: string | null
          id?: string
          images?: string[] | null
          included_services?: Json | null
          instant_booking?: boolean | null
          instant_booking_enabled_at?: string | null
          internal_name?: string | null
          internet_provider?: string | null
          internet_speed?: string | null
          is_for_sale?: boolean | null
          is_rented?: boolean | null
          key_handover?: string | null
          lat?: number | null
          late_checkout_penalty?: number | null
          late_checkout_price?: number | null
          linen_change_frequency?: string | null
          linen_change_price?: number | null
          listing_modes?: string[] | null
          lng?: number | null
          managed_by?: string | null
          managed_by_org_id?: string | null
          management_document_name?: string | null
          management_document_url?: string | null
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
          ownership_form?: string | null
          ownership_transferred_at?: string | null
          ownership_type?: string | null
          ownership_verification_notes?: string | null
          ownership_verification_status?: string | null
          ownership_verified_at?: string | null
          ownership_verified_by?: string | null
          parking_included?: boolean | null
          parking_notes?: string | null
          parking_spaces?: number | null
          parking_type?: string | null
          parties_allowed?: boolean | null
          payment_model?: string | null
          pet_deposit?: number | null
          pet_notes?: string | null
          pet_notes_ru?: string | null
          pets_allowed?: boolean | null
          plot_size_sqm?: number | null
          pm_company_id?: string | null
          pool_type?: string | null
          prepay_percent?: number | null
          price_per_night?: number | null
          project_id?: string | null
          property_type?: string
          purchase_date?: string | null
          purchase_price?: number | null
          quiet_hours_end?: string | null
          quiet_hours_start?: string | null
          rejection_reason?: string | null
          renovation_costs?: number | null
          rental_platform?: string | null
          report_frequency?: string | null
          report_recipients?: string[] | null
          rooms?: Json | null
          safety_features?: string[] | null
          sale_currency?: string | null
          sale_price?: number | null
          seasonal_pricing?: Json | null
          security_deposit_collection?: string | null
          security_deposit_required?: boolean | null
          smoking_penalty?: number | null
          status?: string | null
          title: string
          title_ru?: string | null
          total_floors?: number | null
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
          acquisition_costs?: number | null
          actual_owner_email?: string | null
          actual_owner_name?: string | null
          actual_owner_phone?: string | null
          address?: string
          approval_status?: string | null
          approved_at?: string | null
          approved_by?: string | null
          area_sqm?: number | null
          auto_report_enabled?: boolean | null
          balance_due_days?: number | null
          bathrooms?: number | null
          bedrooms?: number | null
          cancellation_policy?: string | null
          chat_delegated_to_platform?: boolean | null
          check_in_instructions?: string | null
          check_in_instructions_ru?: string | null
          check_in_time?: string | null
          check_out_time?: string | null
          children_friendly?: boolean | null
          cleaning_frequency?: string | null
          cleaning_included?: boolean | null
          commercial_terms_redacted?: boolean | null
          complex_id?: string | null
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
          garden_type?: string | null
          has_crib?: boolean | null
          has_elevator?: boolean | null
          has_high_chair?: boolean | null
          highlights?: string[] | null
          host_languages?: string[] | null
          house_rules?: string | null
          house_rules_ru?: string | null
          ical_token?: string | null
          ical_token_expires_at?: string | null
          ical_token_refreshed_at?: string | null
          id?: string
          images?: string[] | null
          included_services?: Json | null
          instant_booking?: boolean | null
          instant_booking_enabled_at?: string | null
          internal_name?: string | null
          internet_provider?: string | null
          internet_speed?: string | null
          is_for_sale?: boolean | null
          is_rented?: boolean | null
          key_handover?: string | null
          lat?: number | null
          late_checkout_penalty?: number | null
          late_checkout_price?: number | null
          linen_change_frequency?: string | null
          linen_change_price?: number | null
          listing_modes?: string[] | null
          lng?: number | null
          managed_by?: string | null
          managed_by_org_id?: string | null
          management_document_name?: string | null
          management_document_url?: string | null
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
          ownership_form?: string | null
          ownership_transferred_at?: string | null
          ownership_type?: string | null
          ownership_verification_notes?: string | null
          ownership_verification_status?: string | null
          ownership_verified_at?: string | null
          ownership_verified_by?: string | null
          parking_included?: boolean | null
          parking_notes?: string | null
          parking_spaces?: number | null
          parking_type?: string | null
          parties_allowed?: boolean | null
          payment_model?: string | null
          pet_deposit?: number | null
          pet_notes?: string | null
          pet_notes_ru?: string | null
          pets_allowed?: boolean | null
          plot_size_sqm?: number | null
          pm_company_id?: string | null
          pool_type?: string | null
          prepay_percent?: number | null
          price_per_night?: number | null
          project_id?: string | null
          property_type?: string
          purchase_date?: string | null
          purchase_price?: number | null
          quiet_hours_end?: string | null
          quiet_hours_start?: string | null
          rejection_reason?: string | null
          renovation_costs?: number | null
          rental_platform?: string | null
          report_frequency?: string | null
          report_recipients?: string[] | null
          rooms?: Json | null
          safety_features?: string[] | null
          sale_currency?: string | null
          sale_price?: number | null
          seasonal_pricing?: Json | null
          security_deposit_collection?: string | null
          security_deposit_required?: boolean | null
          smoking_penalty?: number | null
          status?: string | null
          title?: string
          title_ru?: string | null
          total_floors?: number | null
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
            foreignKeyName: "owner_properties_complex_id_fkey"
            columns: ["complex_id"]
            isOneToOne: false
            referencedRelation: "property_complexes"
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
          {
            foreignKeyName: "owner_properties_marketplace_property_id_fkey"
            columns: ["marketplace_property_id"]
            isOneToOne: false
            referencedRelation: "v_marketplace_listings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "owner_properties_marketplace_property_id_fkey"
            columns: ["marketplace_property_id"]
            isOneToOne: false
            referencedRelation: "v_owner_properties"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "owner_properties_pm_company_id_fkey"
            columns: ["pm_company_id"]
            isOneToOne: false
            referencedRelation: "property_management_companies"
            referencedColumns: ["id"]
          },
        ]
      }
      owner_vault_files: {
        Row: {
          created_at: string
          description: string | null
          doc_type: string
          file_name: string
          file_path: string
          file_size: number | null
          id: string
          mime_type: string | null
          owner_id: string
          property_id: string | null
          share_expires_at: string | null
          share_token: string | null
          tags: string[] | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          doc_type?: string
          file_name: string
          file_path: string
          file_size?: number | null
          id?: string
          mime_type?: string | null
          owner_id: string
          property_id?: string | null
          share_expires_at?: string | null
          share_token?: string | null
          tags?: string[] | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          doc_type?: string
          file_name?: string
          file_path?: string
          file_size?: number | null
          id?: string
          mime_type?: string | null
          owner_id?: string
          property_id?: string | null
          share_expires_at?: string | null
          share_token?: string | null
          tags?: string[] | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "owner_vault_files_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "owner_vault_files_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "v_marketplace_listings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "owner_vault_files_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "v_owner_properties"
            referencedColumns: ["id"]
          },
        ]
      }
      page_views: {
        Row: {
          id: string
          page_path: string
          page_title: string | null
          referrer_path: string | null
          scroll_depth: number | null
          session_id: string | null
          time_on_page: number | null
          user_id: string | null
          viewed_at: string
        }
        Insert: {
          id?: string
          page_path: string
          page_title?: string | null
          referrer_path?: string | null
          scroll_depth?: number | null
          session_id?: string | null
          time_on_page?: number | null
          user_id?: string | null
          viewed_at?: string
        }
        Update: {
          id?: string
          page_path?: string
          page_title?: string | null
          referrer_path?: string | null
          scroll_depth?: number | null
          session_id?: string | null
          time_on_page?: number | null
          user_id?: string | null
          viewed_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "page_views_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "user_sessions"
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
      partners: {
        Row: {
          api_endpoint: string | null
          api_key_encrypted: string | null
          categories: string[] | null
          commission_default: number | null
          contact_email: string | null
          contact_phone: string | null
          created_at: string
          description: string | null
          id: string
          is_active: boolean | null
          is_verified: boolean | null
          logo: string | null
          name: string
          name_ru: string | null
          payment_terms: string | null
          updated_at: string
          webhook_url: string | null
        }
        Insert: {
          api_endpoint?: string | null
          api_key_encrypted?: string | null
          categories?: string[] | null
          commission_default?: number | null
          contact_email?: string | null
          contact_phone?: string | null
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean | null
          is_verified?: boolean | null
          logo?: string | null
          name: string
          name_ru?: string | null
          payment_terms?: string | null
          updated_at?: string
          webhook_url?: string | null
        }
        Update: {
          api_endpoint?: string | null
          api_key_encrypted?: string | null
          categories?: string[] | null
          commission_default?: number | null
          contact_email?: string | null
          contact_phone?: string | null
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean | null
          is_verified?: boolean | null
          logo?: string | null
          name?: string
          name_ru?: string | null
          payment_terms?: string | null
          updated_at?: string
          webhook_url?: string | null
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
      pet_profiles: {
        Row: {
          age_months: number | null
          age_years: number | null
          allergies: string[] | null
          breed: string | null
          created_at: string
          dietary_notes: string | null
          gender: string | null
          id: string
          is_active: boolean | null
          is_neutered: boolean | null
          medical_notes: string | null
          microchip_id: string | null
          name: string
          photo: string | null
          species: string
          updated_at: string
          user_id: string
          vaccinations: Json | null
          weight_kg: number | null
        }
        Insert: {
          age_months?: number | null
          age_years?: number | null
          allergies?: string[] | null
          breed?: string | null
          created_at?: string
          dietary_notes?: string | null
          gender?: string | null
          id?: string
          is_active?: boolean | null
          is_neutered?: boolean | null
          medical_notes?: string | null
          microchip_id?: string | null
          name: string
          photo?: string | null
          species?: string
          updated_at?: string
          user_id: string
          vaccinations?: Json | null
          weight_kg?: number | null
        }
        Update: {
          age_months?: number | null
          age_years?: number | null
          allergies?: string[] | null
          breed?: string | null
          created_at?: string
          dietary_notes?: string | null
          gender?: string | null
          id?: string
          is_active?: boolean | null
          is_neutered?: boolean | null
          medical_notes?: string | null
          microchip_id?: string | null
          name?: string
          photo?: string | null
          species?: string
          updated_at?: string
          user_id?: string
          vaccinations?: Json | null
          weight_kg?: number | null
        }
        Relationships: []
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
      pricing_recommendations: {
        Row: {
          confidence: number | null
          created_at: string
          currency: string | null
          current_price: number | null
          date_from: string
          date_to: string
          factors: Json | null
          id: string
          property_id: string
          reasoning: string | null
          recommended_price: number
          status: string
          updated_at: string
        }
        Insert: {
          confidence?: number | null
          created_at?: string
          currency?: string | null
          current_price?: number | null
          date_from: string
          date_to: string
          factors?: Json | null
          id?: string
          property_id: string
          reasoning?: string | null
          recommended_price: number
          status?: string
          updated_at?: string
        }
        Update: {
          confidence?: number | null
          created_at?: string
          currency?: string | null
          current_price?: number | null
          date_from?: string
          date_to?: string
          factors?: Json | null
          id?: string
          property_id?: string
          reasoning?: string | null
          recommended_price?: number
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "pricing_recommendations_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pricing_recommendations_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "v_marketplace_listings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pricing_recommendations_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "v_owner_properties"
            referencedColumns: ["id"]
          },
        ]
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
      profiles: {
        Row: {
          address_line1: string | null
          address_line2: string | null
          avatar_url: string | null
          city: string | null
          country: string | null
          created_at: string
          date_of_birth: string | null
          dietary_restrictions: string[] | null
          email: string | null
          emergency_contact_name: string | null
          emergency_contact_phone: string | null
          emergency_contact_relationship: string | null
          full_name: string | null
          gender: string | null
          id: string
          medical_conditions: string | null
          nationality: string | null
          phone: string | null
          postal_code: string | null
          preferred_language: string | null
          referral_balance: number
          referral_code: string | null
          referred_by: string | null
          state_province: string | null
          travel_preferences: Json | null
          updated_at: string
          user_type: Database["public"]["Enums"]["user_type"] | null
        }
        Insert: {
          address_line1?: string | null
          address_line2?: string | null
          avatar_url?: string | null
          city?: string | null
          country?: string | null
          created_at?: string
          date_of_birth?: string | null
          dietary_restrictions?: string[] | null
          email?: string | null
          emergency_contact_name?: string | null
          emergency_contact_phone?: string | null
          emergency_contact_relationship?: string | null
          full_name?: string | null
          gender?: string | null
          id: string
          medical_conditions?: string | null
          nationality?: string | null
          phone?: string | null
          postal_code?: string | null
          preferred_language?: string | null
          referral_balance?: number
          referral_code?: string | null
          referred_by?: string | null
          state_province?: string | null
          travel_preferences?: Json | null
          updated_at?: string
          user_type?: Database["public"]["Enums"]["user_type"] | null
        }
        Update: {
          address_line1?: string | null
          address_line2?: string | null
          avatar_url?: string | null
          city?: string | null
          country?: string | null
          created_at?: string
          date_of_birth?: string | null
          dietary_restrictions?: string[] | null
          email?: string | null
          emergency_contact_name?: string | null
          emergency_contact_phone?: string | null
          emergency_contact_relationship?: string | null
          full_name?: string | null
          gender?: string | null
          id?: string
          medical_conditions?: string | null
          nationality?: string | null
          phone?: string | null
          postal_code?: string | null
          preferred_language?: string | null
          referral_balance?: number
          referral_code?: string | null
          referred_by?: string | null
          state_province?: string | null
          travel_preferences?: Json | null
          updated_at?: string
          user_type?: Database["public"]["Enums"]["user_type"] | null
        }
        Relationships: []
      }
      properties: {
        Row: {
          accessibility_features: string[] | null
          acquisition_costs: number | null
          actual_owner_email: string | null
          actual_owner_name: string | null
          actual_owner_phone: string | null
          address: string | null
          amenities: string[] | null
          approval_status: string | null
          area_sqm: number | null
          available_from: string | null
          balance_due_days: number | null
          bathrooms: number | null
          bedrooms: number | null
          beds: Json | null
          building_management_contact: string | null
          building_name: string | null
          building_year: number | null
          cancellation_policy: string | null
          chanote_number: string | null
          check_in_instructions: string | null
          check_in_instructions_ru: string | null
          check_in_time: string | null
          check_out_time: string | null
          children_friendly: boolean | null
          cleaning_frequency: string | null
          cleaning_included: boolean | null
          commercial_terms_redacted: boolean | null
          commission_rate: number | null
          complex_id: string | null
          cover_image: string | null
          created_at: string
          created_by_uno_team: boolean | null
          created_on_behalf: boolean | null
          currency: string | null
          deposit_amount: number | null
          deposit_currency: string | null
          deposit_type: string | null
          description_en: string | null
          description_ru: string | null
          district: string | null
          early_checkin_price: number | null
          electricity_included: boolean | null
          electricity_meter_id: string | null
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
          ical_export_enabled: boolean | null
          ical_last_sync: string | null
          ical_token: string | null
          id: string
          images: string[] | null
          included_services: Json | null
          instant_booking: boolean | null
          internal_name: string | null
          internet_provider: string | null
          internet_speed: string | null
          is_active: boolean | null
          is_featured: boolean | null
          is_rented: boolean | null
          is_verified: boolean | null
          juristic_office_contact: string | null
          key_handover: string | null
          lat: number | null
          late_checkout_penalty: number | null
          late_checkout_price: number | null
          legacy_owner_property_id: string | null
          linen_change_frequency: string | null
          linen_change_price: number | null
          listing_modes: string[] | null
          listing_type: string
          lng: number | null
          location_id: string | null
          managed_by_org_id: string | null
          management_company_id: string | null
          management_document_name: string | null
          management_document_url: string | null
          management_type: string | null
          manager_line_id: string | null
          manager_name: string | null
          manager_phone: string | null
          max_guests: number | null
          max_party_guests: number | null
          min_stay_nights: number | null
          monthly_discount: number | null
          mortgage_amount: number | null
          mortgage_bank: string | null
          mortgage_interest_rate: number | null
          mortgage_monthly_payment: number | null
          nearby_places: Json | null
          notes: string | null
          owner_id: string | null
          ownership_form: string | null
          ownership_transferred_at: string | null
          ownership_type: string | null
          ownership_verification_notes: string | null
          ownership_verification_status: string | null
          ownership_verified_at: string | null
          ownership_verified_by: string | null
          parking_included: boolean | null
          parking_notes: string | null
          parking_spaces: number | null
          parking_type: string | null
          parties_allowed: boolean | null
          payment_model: string | null
          pet_deposit: number | null
          pet_monthly_fee: number | null
          pet_notes: string | null
          pet_notes_ru: string | null
          pet_policy: string | null
          pets_allowed: boolean | null
          pool_size: string | null
          prepay_percent: number | null
          price: number | null
          price_per_night: number | null
          price_period: string | null
          project_id: string | null
          property_type: string
          provider_id: string | null
          purchase_currency: string | null
          purchase_date: string | null
          purchase_price: number | null
          quiet_hours_end: string | null
          quiet_hours_start: string | null
          rating: number | null
          rejection_reason: string | null
          renovation_costs: number | null
          rental_platform: string | null
          review_count: number | null
          reviewed_at: string | null
          reviewed_by: string | null
          rooms: Json | null
          safety_features: string[] | null
          sale_price: number | null
          seasonal_pricing: Json | null
          security_deposit_required: boolean | null
          smoking_penalty: number | null
          smoking_policy: string | null
          status: string | null
          tabien_baan: string | null
          title: string | null
          title_en: string
          title_ru: string
          total_floors: number | null
          transfer_airport_price: number | null
          transfer_available: boolean | null
          transfer_notes: string | null
          transfer_notes_ru: string | null
          unit_number: string | null
          uno_team_creator_id: string | null
          updated_at: string
          verified_at: string | null
          verified_by: string | null
          view_type: string | null
          water_included: boolean | null
          water_meter_id: string | null
          water_notes: string | null
          water_notes_ru: string | null
          water_unit_price: number | null
          weekly_discount: number | null
          wifi_included: boolean | null
          wifi_provider: string | null
          wifi_speed: string | null
        }
        Insert: {
          accessibility_features?: string[] | null
          acquisition_costs?: number | null
          actual_owner_email?: string | null
          actual_owner_name?: string | null
          actual_owner_phone?: string | null
          address?: string | null
          amenities?: string[] | null
          approval_status?: string | null
          area_sqm?: number | null
          available_from?: string | null
          balance_due_days?: number | null
          bathrooms?: number | null
          bedrooms?: number | null
          beds?: Json | null
          building_management_contact?: string | null
          building_name?: string | null
          building_year?: number | null
          cancellation_policy?: string | null
          chanote_number?: string | null
          check_in_instructions?: string | null
          check_in_instructions_ru?: string | null
          check_in_time?: string | null
          check_out_time?: string | null
          children_friendly?: boolean | null
          cleaning_frequency?: string | null
          cleaning_included?: boolean | null
          commercial_terms_redacted?: boolean | null
          commission_rate?: number | null
          complex_id?: string | null
          cover_image?: string | null
          created_at?: string
          created_by_uno_team?: boolean | null
          created_on_behalf?: boolean | null
          currency?: string | null
          deposit_amount?: number | null
          deposit_currency?: string | null
          deposit_type?: string | null
          description_en?: string | null
          description_ru?: string | null
          district?: string | null
          early_checkin_price?: number | null
          electricity_included?: boolean | null
          electricity_meter_id?: string | null
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
          ical_export_enabled?: boolean | null
          ical_last_sync?: string | null
          ical_token?: string | null
          id?: string
          images?: string[] | null
          included_services?: Json | null
          instant_booking?: boolean | null
          internal_name?: string | null
          internet_provider?: string | null
          internet_speed?: string | null
          is_active?: boolean | null
          is_featured?: boolean | null
          is_rented?: boolean | null
          is_verified?: boolean | null
          juristic_office_contact?: string | null
          key_handover?: string | null
          lat?: number | null
          late_checkout_penalty?: number | null
          late_checkout_price?: number | null
          legacy_owner_property_id?: string | null
          linen_change_frequency?: string | null
          linen_change_price?: number | null
          listing_modes?: string[] | null
          listing_type: string
          lng?: number | null
          location_id?: string | null
          managed_by_org_id?: string | null
          management_company_id?: string | null
          management_document_name?: string | null
          management_document_url?: string | null
          management_type?: string | null
          manager_line_id?: string | null
          manager_name?: string | null
          manager_phone?: string | null
          max_guests?: number | null
          max_party_guests?: number | null
          min_stay_nights?: number | null
          monthly_discount?: number | null
          mortgage_amount?: number | null
          mortgage_bank?: string | null
          mortgage_interest_rate?: number | null
          mortgage_monthly_payment?: number | null
          nearby_places?: Json | null
          notes?: string | null
          owner_id?: string | null
          ownership_form?: string | null
          ownership_transferred_at?: string | null
          ownership_type?: string | null
          ownership_verification_notes?: string | null
          ownership_verification_status?: string | null
          ownership_verified_at?: string | null
          ownership_verified_by?: string | null
          parking_included?: boolean | null
          parking_notes?: string | null
          parking_spaces?: number | null
          parking_type?: string | null
          parties_allowed?: boolean | null
          payment_model?: string | null
          pet_deposit?: number | null
          pet_monthly_fee?: number | null
          pet_notes?: string | null
          pet_notes_ru?: string | null
          pet_policy?: string | null
          pets_allowed?: boolean | null
          pool_size?: string | null
          prepay_percent?: number | null
          price?: number | null
          price_per_night?: number | null
          price_period?: string | null
          project_id?: string | null
          property_type: string
          provider_id?: string | null
          purchase_currency?: string | null
          purchase_date?: string | null
          purchase_price?: number | null
          quiet_hours_end?: string | null
          quiet_hours_start?: string | null
          rating?: number | null
          rejection_reason?: string | null
          renovation_costs?: number | null
          rental_platform?: string | null
          review_count?: number | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          rooms?: Json | null
          safety_features?: string[] | null
          sale_price?: number | null
          seasonal_pricing?: Json | null
          security_deposit_required?: boolean | null
          smoking_penalty?: number | null
          smoking_policy?: string | null
          status?: string | null
          tabien_baan?: string | null
          title?: string | null
          title_en: string
          title_ru: string
          total_floors?: number | null
          transfer_airport_price?: number | null
          transfer_available?: boolean | null
          transfer_notes?: string | null
          transfer_notes_ru?: string | null
          unit_number?: string | null
          uno_team_creator_id?: string | null
          updated_at?: string
          verified_at?: string | null
          verified_by?: string | null
          view_type?: string | null
          water_included?: boolean | null
          water_meter_id?: string | null
          water_notes?: string | null
          water_notes_ru?: string | null
          water_unit_price?: number | null
          weekly_discount?: number | null
          wifi_included?: boolean | null
          wifi_provider?: string | null
          wifi_speed?: string | null
        }
        Update: {
          accessibility_features?: string[] | null
          acquisition_costs?: number | null
          actual_owner_email?: string | null
          actual_owner_name?: string | null
          actual_owner_phone?: string | null
          address?: string | null
          amenities?: string[] | null
          approval_status?: string | null
          area_sqm?: number | null
          available_from?: string | null
          balance_due_days?: number | null
          bathrooms?: number | null
          bedrooms?: number | null
          beds?: Json | null
          building_management_contact?: string | null
          building_name?: string | null
          building_year?: number | null
          cancellation_policy?: string | null
          chanote_number?: string | null
          check_in_instructions?: string | null
          check_in_instructions_ru?: string | null
          check_in_time?: string | null
          check_out_time?: string | null
          children_friendly?: boolean | null
          cleaning_frequency?: string | null
          cleaning_included?: boolean | null
          commercial_terms_redacted?: boolean | null
          commission_rate?: number | null
          complex_id?: string | null
          cover_image?: string | null
          created_at?: string
          created_by_uno_team?: boolean | null
          created_on_behalf?: boolean | null
          currency?: string | null
          deposit_amount?: number | null
          deposit_currency?: string | null
          deposit_type?: string | null
          description_en?: string | null
          description_ru?: string | null
          district?: string | null
          early_checkin_price?: number | null
          electricity_included?: boolean | null
          electricity_meter_id?: string | null
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
          ical_export_enabled?: boolean | null
          ical_last_sync?: string | null
          ical_token?: string | null
          id?: string
          images?: string[] | null
          included_services?: Json | null
          instant_booking?: boolean | null
          internal_name?: string | null
          internet_provider?: string | null
          internet_speed?: string | null
          is_active?: boolean | null
          is_featured?: boolean | null
          is_rented?: boolean | null
          is_verified?: boolean | null
          juristic_office_contact?: string | null
          key_handover?: string | null
          lat?: number | null
          late_checkout_penalty?: number | null
          late_checkout_price?: number | null
          legacy_owner_property_id?: string | null
          linen_change_frequency?: string | null
          linen_change_price?: number | null
          listing_modes?: string[] | null
          listing_type?: string
          lng?: number | null
          location_id?: string | null
          managed_by_org_id?: string | null
          management_company_id?: string | null
          management_document_name?: string | null
          management_document_url?: string | null
          management_type?: string | null
          manager_line_id?: string | null
          manager_name?: string | null
          manager_phone?: string | null
          max_guests?: number | null
          max_party_guests?: number | null
          min_stay_nights?: number | null
          monthly_discount?: number | null
          mortgage_amount?: number | null
          mortgage_bank?: string | null
          mortgage_interest_rate?: number | null
          mortgage_monthly_payment?: number | null
          nearby_places?: Json | null
          notes?: string | null
          owner_id?: string | null
          ownership_form?: string | null
          ownership_transferred_at?: string | null
          ownership_type?: string | null
          ownership_verification_notes?: string | null
          ownership_verification_status?: string | null
          ownership_verified_at?: string | null
          ownership_verified_by?: string | null
          parking_included?: boolean | null
          parking_notes?: string | null
          parking_spaces?: number | null
          parking_type?: string | null
          parties_allowed?: boolean | null
          payment_model?: string | null
          pet_deposit?: number | null
          pet_monthly_fee?: number | null
          pet_notes?: string | null
          pet_notes_ru?: string | null
          pet_policy?: string | null
          pets_allowed?: boolean | null
          pool_size?: string | null
          prepay_percent?: number | null
          price?: number | null
          price_per_night?: number | null
          price_period?: string | null
          project_id?: string | null
          property_type?: string
          provider_id?: string | null
          purchase_currency?: string | null
          purchase_date?: string | null
          purchase_price?: number | null
          quiet_hours_end?: string | null
          quiet_hours_start?: string | null
          rating?: number | null
          rejection_reason?: string | null
          renovation_costs?: number | null
          rental_platform?: string | null
          review_count?: number | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          rooms?: Json | null
          safety_features?: string[] | null
          sale_price?: number | null
          seasonal_pricing?: Json | null
          security_deposit_required?: boolean | null
          smoking_penalty?: number | null
          smoking_policy?: string | null
          status?: string | null
          tabien_baan?: string | null
          title?: string | null
          title_en?: string
          title_ru?: string
          total_floors?: number | null
          transfer_airport_price?: number | null
          transfer_available?: boolean | null
          transfer_notes?: string | null
          transfer_notes_ru?: string | null
          unit_number?: string | null
          uno_team_creator_id?: string | null
          updated_at?: string
          verified_at?: string | null
          verified_by?: string | null
          view_type?: string | null
          water_included?: boolean | null
          water_meter_id?: string | null
          water_notes?: string | null
          water_notes_ru?: string | null
          water_unit_price?: number | null
          weekly_discount?: number | null
          wifi_included?: boolean | null
          wifi_provider?: string | null
          wifi_speed?: string | null
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
            foreignKeyName: "properties_complex_id_fkey"
            columns: ["complex_id"]
            isOneToOne: false
            referencedRelation: "property_complexes"
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
            foreignKeyName: "properties_management_company_id_fkey"
            columns: ["management_company_id"]
            isOneToOne: false
            referencedRelation: "management_companies"
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
      property_analytics: {
        Row: {
          bookings: number | null
          clicks: number | null
          created_at: string | null
          date: string
          favorites: number | null
          id: string
          inquiries: number | null
          property_id: string
          search_impressions: number | null
          shares: number | null
          source: string | null
          views: number | null
        }
        Insert: {
          bookings?: number | null
          clicks?: number | null
          created_at?: string | null
          date: string
          favorites?: number | null
          id?: string
          inquiries?: number | null
          property_id: string
          search_impressions?: number | null
          shares?: number | null
          source?: string | null
          views?: number | null
        }
        Update: {
          bookings?: number | null
          clicks?: number | null
          created_at?: string | null
          date?: string
          favorites?: number | null
          id?: string
          inquiries?: number | null
          property_id?: string
          search_impressions?: number | null
          shares?: number | null
          source?: string | null
          views?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "property_analytics_property_id_fkey"
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
      property_booking_status_log: {
        Row: {
          booking_id: string
          changed_by: string | null
          created_at: string | null
          from_status: string | null
          id: string
          metadata: Json | null
          reason: string | null
          to_status: string
        }
        Insert: {
          booking_id: string
          changed_by?: string | null
          created_at?: string | null
          from_status?: string | null
          id?: string
          metadata?: Json | null
          reason?: string | null
          to_status: string
        }
        Update: {
          booking_id?: string
          changed_by?: string | null
          created_at?: string | null
          from_status?: string | null
          id?: string
          metadata?: Json | null
          reason?: string | null
          to_status?: string
        }
        Relationships: [
          {
            foreignKeyName: "property_booking_status_log_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "property_bookings"
            referencedColumns: ["id"]
          },
        ]
      }
      property_bookings: {
        Row: {
          cancellation_policy: string | null
          cancellation_reason: string | null
          cancelled_at: string | null
          cancelled_by: string | null
          check_in: string
          check_out: string
          cleaning_fee: number | null
          confirmed_at: string | null
          confirmed_by: string | null
          conflict_detected_at: string | null
          conflict_with_booking_id: string | null
          created_at: string
          currency: string | null
          deposit_amount: number | null
          deposit_paid_at: string | null
          deposit_payment_method: string | null
          deposit_stripe_session_id: string | null
          external_id: string | null
          guest_email: string | null
          guest_id: string | null
          guest_name: string | null
          guest_phone: string | null
          guests_count: number | null
          id: string
          marketplace_booking_id: string | null
          notes: string | null
          owner_id: string
          platform_commission: number | null
          property_id: string
          refund_amount: number | null
          refund_processed_at: string | null
          refund_status: string | null
          service_fee: number | null
          source: string | null
          source_calendar_id: string | null
          status: string | null
          sync_priority: number | null
          total_amount: number | null
          updated_at: string
        }
        Insert: {
          cancellation_policy?: string | null
          cancellation_reason?: string | null
          cancelled_at?: string | null
          cancelled_by?: string | null
          check_in: string
          check_out: string
          cleaning_fee?: number | null
          confirmed_at?: string | null
          confirmed_by?: string | null
          conflict_detected_at?: string | null
          conflict_with_booking_id?: string | null
          created_at?: string
          currency?: string | null
          deposit_amount?: number | null
          deposit_paid_at?: string | null
          deposit_payment_method?: string | null
          deposit_stripe_session_id?: string | null
          external_id?: string | null
          guest_email?: string | null
          guest_id?: string | null
          guest_name?: string | null
          guest_phone?: string | null
          guests_count?: number | null
          id?: string
          marketplace_booking_id?: string | null
          notes?: string | null
          owner_id: string
          platform_commission?: number | null
          property_id: string
          refund_amount?: number | null
          refund_processed_at?: string | null
          refund_status?: string | null
          service_fee?: number | null
          source?: string | null
          source_calendar_id?: string | null
          status?: string | null
          sync_priority?: number | null
          total_amount?: number | null
          updated_at?: string
        }
        Update: {
          cancellation_policy?: string | null
          cancellation_reason?: string | null
          cancelled_at?: string | null
          cancelled_by?: string | null
          check_in?: string
          check_out?: string
          cleaning_fee?: number | null
          confirmed_at?: string | null
          confirmed_by?: string | null
          conflict_detected_at?: string | null
          conflict_with_booking_id?: string | null
          created_at?: string
          currency?: string | null
          deposit_amount?: number | null
          deposit_paid_at?: string | null
          deposit_payment_method?: string | null
          deposit_stripe_session_id?: string | null
          external_id?: string | null
          guest_email?: string | null
          guest_id?: string | null
          guest_name?: string | null
          guest_phone?: string | null
          guests_count?: number | null
          id?: string
          marketplace_booking_id?: string | null
          notes?: string | null
          owner_id?: string
          platform_commission?: number | null
          property_id?: string
          refund_amount?: number | null
          refund_processed_at?: string | null
          refund_status?: string | null
          service_fee?: number | null
          source?: string | null
          source_calendar_id?: string | null
          status?: string | null
          sync_priority?: number | null
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
      property_budgets: {
        Row: {
          budget_month: string
          category: string
          created_at: string
          currency: string
          id: string
          notes: string | null
          owner_id: string
          planned_amount: number
          property_id: string
          transaction_type: string
          updated_at: string
        }
        Insert: {
          budget_month: string
          category: string
          created_at?: string
          currency?: string
          id?: string
          notes?: string | null
          owner_id: string
          planned_amount?: number
          property_id: string
          transaction_type?: string
          updated_at?: string
        }
        Update: {
          budget_month?: string
          category?: string
          created_at?: string
          currency?: string
          id?: string
          notes?: string | null
          owner_id?: string
          planned_amount?: number
          property_id?: string
          transaction_type?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "property_budgets_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "owner_properties"
            referencedColumns: ["id"]
          },
        ]
      }
      property_chat_messages: {
        Row: {
          attachments: Json | null
          booking_id: string | null
          created_at: string
          hidden_reason: string | null
          id: string
          is_hidden: boolean | null
          is_read: boolean | null
          message: string
          moderation_metadata: Json | null
          property_id: string | null
          sender_id: string
          sender_name: string | null
          sender_type: string
        }
        Insert: {
          attachments?: Json | null
          booking_id?: string | null
          created_at?: string
          hidden_reason?: string | null
          id?: string
          is_hidden?: boolean | null
          is_read?: boolean | null
          message: string
          moderation_metadata?: Json | null
          property_id?: string | null
          sender_id: string
          sender_name?: string | null
          sender_type?: string
        }
        Update: {
          attachments?: Json | null
          booking_id?: string | null
          created_at?: string
          hidden_reason?: string | null
          id?: string
          is_hidden?: boolean | null
          is_read?: boolean | null
          message?: string
          moderation_metadata?: Json | null
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
      property_complexes: {
        Row: {
          address: string | null
          created_at: string
          description: string | null
          district: string | null
          id: string
          name: string
          name_ru: string | null
          owner_id: string
          updated_at: string
        }
        Insert: {
          address?: string | null
          created_at?: string
          description?: string | null
          district?: string | null
          id?: string
          name: string
          name_ru?: string | null
          owner_id: string
          updated_at?: string
        }
        Update: {
          address?: string | null
          created_at?: string
          description?: string | null
          district?: string | null
          id?: string
          name?: string
          name_ru?: string | null
          owner_id?: string
          updated_at?: string
        }
        Relationships: []
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
          notification_preferences: Json | null
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
          notification_preferences?: Json | null
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
          notification_preferences?: Json | null
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
      property_deposits: {
        Row: {
          amount: number
          booking_id: string
          collected_at: string | null
          collected_by: string | null
          created_at: string
          currency: string | null
          deduction_amount: number | null
          deduction_reason: string | null
          id: string
          notes: string | null
          owner_id: string
          payment_method: string | null
          property_id: string
          returned_amount: number | null
          returned_at: string | null
          status: string
          updated_at: string
        }
        Insert: {
          amount: number
          booking_id: string
          collected_at?: string | null
          collected_by?: string | null
          created_at?: string
          currency?: string | null
          deduction_amount?: number | null
          deduction_reason?: string | null
          id?: string
          notes?: string | null
          owner_id: string
          payment_method?: string | null
          property_id: string
          returned_amount?: number | null
          returned_at?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          amount?: number
          booking_id?: string
          collected_at?: string | null
          collected_by?: string | null
          created_at?: string
          currency?: string | null
          deduction_amount?: number | null
          deduction_reason?: string | null
          id?: string
          notes?: string | null
          owner_id?: string
          payment_method?: string | null
          property_id?: string
          returned_amount?: number | null
          returned_at?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "property_deposits_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "property_bookings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "property_deposits_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "owner_properties"
            referencedColumns: ["id"]
          },
        ]
      }
      property_documents: {
        Row: {
          access_code: string | null
          access_instructions: string | null
          access_instructions_ru: string | null
          created_at: string | null
          description: string | null
          description_ru: string | null
          document_type: string
          expiry_date: string | null
          file_name: string | null
          file_url: string | null
          id: string
          is_sensitive: boolean | null
          is_verified: boolean | null
          issue_date: string | null
          property_id: string
          title: string
          title_ru: string | null
          updated_at: string | null
          uploaded_by: string | null
          verified_at: string | null
          verified_by: string | null
        }
        Insert: {
          access_code?: string | null
          access_instructions?: string | null
          access_instructions_ru?: string | null
          created_at?: string | null
          description?: string | null
          description_ru?: string | null
          document_type: string
          expiry_date?: string | null
          file_name?: string | null
          file_url?: string | null
          id?: string
          is_sensitive?: boolean | null
          is_verified?: boolean | null
          issue_date?: string | null
          property_id: string
          title: string
          title_ru?: string | null
          updated_at?: string | null
          uploaded_by?: string | null
          verified_at?: string | null
          verified_by?: string | null
        }
        Update: {
          access_code?: string | null
          access_instructions?: string | null
          access_instructions_ru?: string | null
          created_at?: string | null
          description?: string | null
          description_ru?: string | null
          document_type?: string
          expiry_date?: string | null
          file_name?: string | null
          file_url?: string | null
          id?: string
          is_sensitive?: boolean | null
          is_verified?: boolean | null
          issue_date?: string | null
          property_id?: string
          title?: string
          title_ru?: string | null
          updated_at?: string | null
          uploaded_by?: string | null
          verified_at?: string | null
          verified_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "property_documents_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "owner_properties"
            referencedColumns: ["id"]
          },
        ]
      }
      property_external_calendars: {
        Row: {
          auto_sync: boolean | null
          channel_type: string | null
          created_at: string
          ical_url: string
          id: string
          is_active: boolean | null
          last_synced_at: string | null
          name: string
          owner_id: string
          priority: number | null
          property_id: string
          sync_error: string | null
          sync_interval_minutes: number | null
          updated_at: string
        }
        Insert: {
          auto_sync?: boolean | null
          channel_type?: string | null
          created_at?: string
          ical_url: string
          id?: string
          is_active?: boolean | null
          last_synced_at?: string | null
          name: string
          owner_id: string
          priority?: number | null
          property_id: string
          sync_error?: string | null
          sync_interval_minutes?: number | null
          updated_at?: string
        }
        Update: {
          auto_sync?: boolean | null
          channel_type?: string | null
          created_at?: string
          ical_url?: string
          id?: string
          is_active?: boolean | null
          last_synced_at?: string | null
          name?: string
          owner_id?: string
          priority?: number | null
          property_id?: string
          sync_error?: string | null
          sync_interval_minutes?: number | null
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
          cost_source: string | null
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
          receipt_metadata: Json | null
          receipt_url: string | null
          recurring: boolean | null
          recurring_interval: string | null
          reference_id: string | null
          reference_type: string | null
          staff_member_id: string | null
          status: string | null
          tax_deductible: boolean | null
          transaction_date: string
          transaction_type: string
          vendor_name: string | null
          verification_status: string | null
          verified_at: string | null
          verified_by: string | null
        }
        Insert: {
          amount: number
          category?: string | null
          cost_source?: string | null
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
          receipt_metadata?: Json | null
          receipt_url?: string | null
          recurring?: boolean | null
          recurring_interval?: string | null
          reference_id?: string | null
          reference_type?: string | null
          staff_member_id?: string | null
          status?: string | null
          tax_deductible?: boolean | null
          transaction_date?: string
          transaction_type: string
          vendor_name?: string | null
          verification_status?: string | null
          verified_at?: string | null
          verified_by?: string | null
        }
        Update: {
          amount?: number
          category?: string | null
          cost_source?: string | null
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
          receipt_metadata?: Json | null
          receipt_url?: string | null
          recurring?: boolean | null
          recurring_interval?: string | null
          reference_id?: string | null
          reference_type?: string | null
          staff_member_id?: string | null
          status?: string | null
          tax_deductible?: boolean | null
          transaction_date?: string
          transaction_type?: string
          vendor_name?: string | null
          verification_status?: string | null
          verified_at?: string | null
          verified_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "property_financials_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "owner_properties"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "property_financials_staff_member_id_fkey"
            columns: ["staff_member_id"]
            isOneToOne: false
            referencedRelation: "staff_members"
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
          directions: Json | null
          door_code: string | null
          emergency_contacts: Json | null
          gate_code: string | null
          house_manual_url: string | null
          id: string
          is_public: boolean | null
          local_tips: Json | null
          lockbox_code: string | null
          lockbox_location: string | null
          parking_instructions: string | null
          parking_instructions_ru: string | null
          property_id: string | null
          property_photos: string[] | null
          share_token: string | null
          trash_instructions: string | null
          trash_instructions_ru: string | null
          updated_at: string | null
          welcome_message: string | null
          welcome_message_ru: string | null
          wifi_name: string | null
          wifi_password: string | null
        }
        Insert: {
          appliance_guides?: Json | null
          checkout_instructions?: string | null
          checkout_instructions_ru?: string | null
          created_at?: string | null
          directions?: Json | null
          door_code?: string | null
          emergency_contacts?: Json | null
          gate_code?: string | null
          house_manual_url?: string | null
          id?: string
          is_public?: boolean | null
          local_tips?: Json | null
          lockbox_code?: string | null
          lockbox_location?: string | null
          parking_instructions?: string | null
          parking_instructions_ru?: string | null
          property_id?: string | null
          property_photos?: string[] | null
          share_token?: string | null
          trash_instructions?: string | null
          trash_instructions_ru?: string | null
          updated_at?: string | null
          welcome_message?: string | null
          welcome_message_ru?: string | null
          wifi_name?: string | null
          wifi_password?: string | null
        }
        Update: {
          appliance_guides?: Json | null
          checkout_instructions?: string | null
          checkout_instructions_ru?: string | null
          created_at?: string | null
          directions?: Json | null
          door_code?: string | null
          emergency_contacts?: Json | null
          gate_code?: string | null
          house_manual_url?: string | null
          id?: string
          is_public?: boolean | null
          local_tips?: Json | null
          lockbox_code?: string | null
          lockbox_location?: string | null
          parking_instructions?: string | null
          parking_instructions_ru?: string | null
          property_id?: string | null
          property_photos?: string[] | null
          share_token?: string | null
          trash_instructions?: string | null
          trash_instructions_ru?: string | null
          updated_at?: string | null
          welcome_message?: string | null
          welcome_message_ru?: string | null
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
          {
            foreignKeyName: "property_inquiries_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "v_marketplace_listings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "property_inquiries_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "v_owner_properties"
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
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "property_inspections_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "v_marketplace_listings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "property_inspections_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "v_owner_properties"
            referencedColumns: ["id"]
          },
        ]
      }
      property_inventory_items: {
        Row: {
          category: string
          condition: string | null
          created_at: string
          currency: string | null
          description: string | null
          estimated_value: number | null
          id: string
          is_active: boolean | null
          location_in_property: string | null
          min_quantity: number | null
          name: string
          name_ru: string | null
          owner_id: string
          photos: string[] | null
          property_id: string
          purchase_date: string | null
          quantity: number | null
          reorder_note: string | null
          updated_at: string
        }
        Insert: {
          category: string
          condition?: string | null
          created_at?: string
          currency?: string | null
          description?: string | null
          estimated_value?: number | null
          id?: string
          is_active?: boolean | null
          location_in_property?: string | null
          min_quantity?: number | null
          name: string
          name_ru?: string | null
          owner_id: string
          photos?: string[] | null
          property_id: string
          purchase_date?: string | null
          quantity?: number | null
          reorder_note?: string | null
          updated_at?: string
        }
        Update: {
          category?: string
          condition?: string | null
          created_at?: string
          currency?: string | null
          description?: string | null
          estimated_value?: number | null
          id?: string
          is_active?: boolean | null
          location_in_property?: string | null
          min_quantity?: number | null
          name?: string
          name_ru?: string | null
          owner_id?: string
          photos?: string[] | null
          property_id?: string
          purchase_date?: string | null
          quantity?: number | null
          reorder_note?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "property_inventory_items_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "owner_properties"
            referencedColumns: ["id"]
          },
        ]
      }
      property_listing_scores: {
        Row: {
          amenities_score: number | null
          created_at: string | null
          description_score: number | null
          id: string
          improvement_tips: Json | null
          last_calculated_at: string | null
          missing_fields: string[] | null
          overall_score: number | null
          photos_score: number | null
          pricing_score: number | null
          property_id: string
          response_score: number | null
          reviews_score: number | null
          updated_at: string | null
        }
        Insert: {
          amenities_score?: number | null
          created_at?: string | null
          description_score?: number | null
          id?: string
          improvement_tips?: Json | null
          last_calculated_at?: string | null
          missing_fields?: string[] | null
          overall_score?: number | null
          photos_score?: number | null
          pricing_score?: number | null
          property_id: string
          response_score?: number | null
          reviews_score?: number | null
          updated_at?: string | null
        }
        Update: {
          amenities_score?: number | null
          created_at?: string | null
          description_score?: number | null
          id?: string
          improvement_tips?: Json | null
          last_calculated_at?: string | null
          missing_fields?: string[] | null
          overall_score?: number | null
          photos_score?: number | null
          pricing_score?: number | null
          property_id?: string
          response_score?: number | null
          reviews_score?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "property_listing_scores_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: true
            referencedRelation: "owner_properties"
            referencedColumns: ["id"]
          },
        ]
      }
      property_management_companies: {
        Row: {
          address: string | null
          cover_image: string | null
          created_at: string
          created_by: string | null
          default_commission_rate: number | null
          description: string | null
          description_ru: string | null
          director_name: string | null
          email: string | null
          established_year: number | null
          has_24_7_support: boolean | null
          has_emergency_service: boolean | null
          id: string
          is_active: boolean | null
          is_verified: boolean | null
          languages: string[] | null
          license_number: string | null
          logo_url: string | null
          min_contract_months: number | null
          name: string
          name_ru: string | null
          phone: string | null
          properties_managed: number | null
          rating: number | null
          review_count: number | null
          service_districts: string[] | null
          service_types: string[] | null
          tax_id: string | null
          updated_at: string
          verified_at: string | null
          verified_by: string | null
          website: string | null
        }
        Insert: {
          address?: string | null
          cover_image?: string | null
          created_at?: string
          created_by?: string | null
          default_commission_rate?: number | null
          description?: string | null
          description_ru?: string | null
          director_name?: string | null
          email?: string | null
          established_year?: number | null
          has_24_7_support?: boolean | null
          has_emergency_service?: boolean | null
          id?: string
          is_active?: boolean | null
          is_verified?: boolean | null
          languages?: string[] | null
          license_number?: string | null
          logo_url?: string | null
          min_contract_months?: number | null
          name: string
          name_ru?: string | null
          phone?: string | null
          properties_managed?: number | null
          rating?: number | null
          review_count?: number | null
          service_districts?: string[] | null
          service_types?: string[] | null
          tax_id?: string | null
          updated_at?: string
          verified_at?: string | null
          verified_by?: string | null
          website?: string | null
        }
        Update: {
          address?: string | null
          cover_image?: string | null
          created_at?: string
          created_by?: string | null
          default_commission_rate?: number | null
          description?: string | null
          description_ru?: string | null
          director_name?: string | null
          email?: string | null
          established_year?: number | null
          has_24_7_support?: boolean | null
          has_emergency_service?: boolean | null
          id?: string
          is_active?: boolean | null
          is_verified?: boolean | null
          languages?: string[] | null
          license_number?: string | null
          logo_url?: string | null
          min_contract_months?: number | null
          name?: string
          name_ru?: string | null
          phone?: string | null
          properties_managed?: number | null
          rating?: number | null
          review_count?: number | null
          service_districts?: string[] | null
          service_types?: string[] | null
          tax_id?: string | null
          updated_at?: string
          verified_at?: string | null
          verified_by?: string | null
          website?: string | null
        }
        Relationships: []
      }
      property_management_requests: {
        Row: {
          created_at: string
          expires_at: string | null
          id: string
          message: string | null
          property_id: string | null
          proposed_permissions: Json | null
          proposed_role: string | null
          proposed_terms: Json | null
          request_type: string
          requester_id: string
          requester_type: string
          responded_at: string | null
          response_message: string | null
          status: string
          target_email: string
          target_user_id: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          expires_at?: string | null
          id?: string
          message?: string | null
          property_id?: string | null
          proposed_permissions?: Json | null
          proposed_role?: string | null
          proposed_terms?: Json | null
          request_type: string
          requester_id: string
          requester_type: string
          responded_at?: string | null
          response_message?: string | null
          status?: string
          target_email: string
          target_user_id?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          expires_at?: string | null
          id?: string
          message?: string | null
          property_id?: string | null
          proposed_permissions?: Json | null
          proposed_role?: string | null
          proposed_terms?: Json | null
          request_type?: string
          requester_id?: string
          requester_type?: string
          responded_at?: string | null
          response_message?: string | null
          status?: string
          target_email?: string
          target_user_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "property_management_requests_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "owner_properties"
            referencedColumns: ["id"]
          },
        ]
      }
      property_management_terms: {
        Row: {
          commission_amount: number | null
          commission_base: string
          commission_rate: number | null
          commission_type: string
          created_at: string
          expense_responsibility: Json
          id: string
          manager_user_id: string
          notes: string | null
          payment_currency: string
          payment_day: number | null
          property_id: string
          revenue_split_manager: number | null
          revenue_split_owner: number | null
          status: string
          updated_at: string
          valid_from: string | null
          valid_until: string | null
        }
        Insert: {
          commission_amount?: number | null
          commission_base?: string
          commission_rate?: number | null
          commission_type?: string
          created_at?: string
          expense_responsibility?: Json
          id?: string
          manager_user_id: string
          notes?: string | null
          payment_currency?: string
          payment_day?: number | null
          property_id: string
          revenue_split_manager?: number | null
          revenue_split_owner?: number | null
          status?: string
          updated_at?: string
          valid_from?: string | null
          valid_until?: string | null
        }
        Update: {
          commission_amount?: number | null
          commission_base?: string
          commission_rate?: number | null
          commission_type?: string
          created_at?: string
          expense_responsibility?: Json
          id?: string
          manager_user_id?: string
          notes?: string | null
          payment_currency?: string
          payment_day?: number | null
          property_id?: string
          revenue_split_manager?: number | null
          revenue_split_owner?: number | null
          status?: string
          updated_at?: string
          valid_from?: string | null
          valid_until?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "property_management_terms_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "owner_properties"
            referencedColumns: ["id"]
          },
        ]
      }
      property_manager_assignments: {
        Row: {
          assigned_by: string | null
          created_at: string | null
          id: string
          is_active: boolean | null
          manager_user_id: string
          notes: string | null
          permissions: Json | null
          property_id: string
          updated_at: string | null
        }
        Insert: {
          assigned_by?: string | null
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          manager_user_id: string
          notes?: string | null
          permissions?: Json | null
          property_id: string
          updated_at?: string | null
        }
        Update: {
          assigned_by?: string | null
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          manager_user_id?: string
          notes?: string | null
          permissions?: Json | null
          property_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "property_manager_assignments_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "property_manager_assignments_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "v_marketplace_listings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "property_manager_assignments_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "v_owner_properties"
            referencedColumns: ["id"]
          },
        ]
      }
      property_meters: {
        Row: {
          created_at: string | null
          currency: string | null
          id: string
          is_active: boolean | null
          location: string | null
          meter_name: string
          meter_name_ru: string | null
          meter_type: string
          property_id: string
          rate_per_unit: number | null
          unit: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          currency?: string | null
          id?: string
          is_active?: boolean | null
          location?: string | null
          meter_name: string
          meter_name_ru?: string | null
          meter_type: string
          property_id: string
          rate_per_unit?: number | null
          unit?: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          currency?: string | null
          id?: string
          is_active?: boolean | null
          location?: string | null
          meter_name?: string
          meter_name_ru?: string | null
          meter_type?: string
          property_id?: string
          rate_per_unit?: number | null
          unit?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "property_meters_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "owner_properties"
            referencedColumns: ["id"]
          },
        ]
      }
      property_operational_tasks: {
        Row: {
          assigned_to: string | null
          booking_id: string | null
          completed_at: string | null
          completed_by: string | null
          created_at: string | null
          description: string | null
          id: string
          notes: string | null
          priority: string | null
          property_id: string
          scheduled_date: string
          scheduled_time: string | null
          status: string | null
          task_type: string
          title: string
          title_ru: string | null
          updated_at: string | null
        }
        Insert: {
          assigned_to?: string | null
          booking_id?: string | null
          completed_at?: string | null
          completed_by?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          notes?: string | null
          priority?: string | null
          property_id: string
          scheduled_date: string
          scheduled_time?: string | null
          status?: string | null
          task_type: string
          title: string
          title_ru?: string | null
          updated_at?: string | null
        }
        Update: {
          assigned_to?: string | null
          booking_id?: string | null
          completed_at?: string | null
          completed_by?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          notes?: string | null
          priority?: string | null
          property_id?: string
          scheduled_date?: string
          scheduled_time?: string | null
          status?: string | null
          task_type?: string
          title?: string
          title_ru?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "property_operational_tasks_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "property_bookings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "property_operational_tasks_property_id_fkey"
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
      property_passport_events: {
        Row: {
          created_at: string
          created_by: string | null
          description: string | null
          document_ids: string[] | null
          event_date: string
          event_type: string
          id: string
          metadata: Json | null
          property_id: string
          title: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          description?: string | null
          document_ids?: string[] | null
          event_date: string
          event_type: string
          id?: string
          metadata?: Json | null
          property_id: string
          title: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          description?: string | null
          document_ids?: string[] | null
          event_date?: string
          event_type?: string
          id?: string
          metadata?: Json | null
          property_id?: string
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "property_passport_events_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "property_passport_events_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "v_marketplace_listings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "property_passport_events_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "v_owner_properties"
            referencedColumns: ["id"]
          },
        ]
      }
      property_projects: {
        Row: {
          address: string | null
          amenities: string[] | null
          cam_fee_per_sqm: number | null
          cam_includes: string[] | null
          cam_payment_day: number | null
          completion_date: string | null
          construction_progress: number | null
          cover_image: string | null
          created_at: string | null
          created_by: string | null
          description_en: string | null
          description_ru: string | null
          developer_id: string | null
          developer_name: string | null
          district: string | null
          funding_goal: number | null
          id: string
          images: string[] | null
          infrastructure: string[] | null
          investment_enabled: boolean | null
          is_active: boolean | null
          is_featured: boolean | null
          juristic_address: string | null
          juristic_bank_account_name: string | null
          juristic_bank_account_number: string | null
          juristic_bank_name: string | null
          juristic_contact_person: string | null
          juristic_contact_position: string | null
          juristic_email: string | null
          juristic_line_id: string | null
          juristic_office_hours: string | null
          juristic_person_name: string | null
          juristic_person_name_ru: string | null
          juristic_phone: string | null
          juristic_promptpay_id: string | null
          juristic_whatsapp: string | null
          lat: number | null
          lng: number | null
          min_investment: number | null
          muuno_score: number | null
          name_en: string
          name_ru: string
          price_from: number | null
          price_to: number | null
          project_status: string | null
          risk_level: string | null
          roi_projected: number | null
          total_units: number | null
          units_available: number | null
          units_sold: number | null
          updated_at: string | null
          video_url: string | null
          year_built: number | null
        }
        Insert: {
          address?: string | null
          amenities?: string[] | null
          cam_fee_per_sqm?: number | null
          cam_includes?: string[] | null
          cam_payment_day?: number | null
          completion_date?: string | null
          construction_progress?: number | null
          cover_image?: string | null
          created_at?: string | null
          created_by?: string | null
          description_en?: string | null
          description_ru?: string | null
          developer_id?: string | null
          developer_name?: string | null
          district?: string | null
          funding_goal?: number | null
          id?: string
          images?: string[] | null
          infrastructure?: string[] | null
          investment_enabled?: boolean | null
          is_active?: boolean | null
          is_featured?: boolean | null
          juristic_address?: string | null
          juristic_bank_account_name?: string | null
          juristic_bank_account_number?: string | null
          juristic_bank_name?: string | null
          juristic_contact_person?: string | null
          juristic_contact_position?: string | null
          juristic_email?: string | null
          juristic_line_id?: string | null
          juristic_office_hours?: string | null
          juristic_person_name?: string | null
          juristic_person_name_ru?: string | null
          juristic_phone?: string | null
          juristic_promptpay_id?: string | null
          juristic_whatsapp?: string | null
          lat?: number | null
          lng?: number | null
          min_investment?: number | null
          muuno_score?: number | null
          name_en: string
          name_ru: string
          price_from?: number | null
          price_to?: number | null
          project_status?: string | null
          risk_level?: string | null
          roi_projected?: number | null
          total_units?: number | null
          units_available?: number | null
          units_sold?: number | null
          updated_at?: string | null
          video_url?: string | null
          year_built?: number | null
        }
        Update: {
          address?: string | null
          amenities?: string[] | null
          cam_fee_per_sqm?: number | null
          cam_includes?: string[] | null
          cam_payment_day?: number | null
          completion_date?: string | null
          construction_progress?: number | null
          cover_image?: string | null
          created_at?: string | null
          created_by?: string | null
          description_en?: string | null
          description_ru?: string | null
          developer_id?: string | null
          developer_name?: string | null
          district?: string | null
          funding_goal?: number | null
          id?: string
          images?: string[] | null
          infrastructure?: string[] | null
          investment_enabled?: boolean | null
          is_active?: boolean | null
          is_featured?: boolean | null
          juristic_address?: string | null
          juristic_bank_account_name?: string | null
          juristic_bank_account_number?: string | null
          juristic_bank_name?: string | null
          juristic_contact_person?: string | null
          juristic_contact_position?: string | null
          juristic_email?: string | null
          juristic_line_id?: string | null
          juristic_office_hours?: string | null
          juristic_person_name?: string | null
          juristic_person_name_ru?: string | null
          juristic_phone?: string | null
          juristic_promptpay_id?: string | null
          juristic_whatsapp?: string | null
          lat?: number | null
          lng?: number | null
          min_investment?: number | null
          muuno_score?: number | null
          name_en?: string
          name_ru?: string
          price_from?: number | null
          price_to?: number | null
          project_status?: string | null
          risk_level?: string | null
          roi_projected?: number | null
          total_units?: number | null
          units_available?: number | null
          units_sold?: number | null
          updated_at?: string | null
          video_url?: string | null
          year_built?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "property_projects_developer_id_fkey"
            columns: ["developer_id"]
            isOneToOne: false
            referencedRelation: "developers"
            referencedColumns: ["id"]
          },
        ]
      }
      property_promotions: {
        Row: {
          clicks_delivered: number | null
          cost: number | null
          created_at: string | null
          currency: string | null
          ends_at: string
          id: string
          impressions_delivered: number | null
          owner_id: string
          promotion_type: string
          property_id: string
          starts_at: string
          status: string | null
          updated_at: string | null
        }
        Insert: {
          clicks_delivered?: number | null
          cost?: number | null
          created_at?: string | null
          currency?: string | null
          ends_at: string
          id?: string
          impressions_delivered?: number | null
          owner_id: string
          promotion_type: string
          property_id: string
          starts_at: string
          status?: string | null
          updated_at?: string | null
        }
        Update: {
          clicks_delivered?: number | null
          cost?: number | null
          created_at?: string | null
          currency?: string | null
          ends_at?: string
          id?: string
          impressions_delivered?: number | null
          owner_id?: string
          promotion_type?: string
          property_id?: string
          starts_at?: string
          status?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "property_promotions_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "owner_properties"
            referencedColumns: ["id"]
          },
        ]
      }
      property_reports: {
        Row: {
          created_at: string
          data: Json
          error_message: string | null
          generated_by: string | null
          id: string
          owner_id: string
          pdf_url: string | null
          period_end: string
          period_start: string
          property_id: string
          report_type: string
          sent_at: string | null
          sent_to: string[] | null
          status: string
          summary_text: string | null
          summary_text_ru: string | null
          updated_at: string
          viewed_at: string | null
        }
        Insert: {
          created_at?: string
          data?: Json
          error_message?: string | null
          generated_by?: string | null
          id?: string
          owner_id: string
          pdf_url?: string | null
          period_end: string
          period_start: string
          property_id: string
          report_type: string
          sent_at?: string | null
          sent_to?: string[] | null
          status?: string
          summary_text?: string | null
          summary_text_ru?: string | null
          updated_at?: string
          viewed_at?: string | null
        }
        Update: {
          created_at?: string
          data?: Json
          error_message?: string | null
          generated_by?: string | null
          id?: string
          owner_id?: string
          pdf_url?: string | null
          period_end?: string
          period_start?: string
          property_id?: string
          report_type?: string
          sent_at?: string | null
          sent_to?: string[] | null
          status?: string
          summary_text?: string | null
          summary_text_ru?: string | null
          updated_at?: string
          viewed_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "property_reports_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "owner_properties"
            referencedColumns: ["id"]
          },
        ]
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
      provider_contracts: {
        Row: {
          approved_at: string | null
          approved_by: string | null
          auto_renew: boolean | null
          bank_account_name: string | null
          bank_account_number: string | null
          bank_name: string | null
          commission_rate: number
          commission_type: string | null
          contract_document_url: string | null
          contract_number: string | null
          contract_type: string | null
          created_at: string
          created_by: string | null
          entity_id: string
          entity_type: string
          id: string
          max_commission_amount: number | null
          min_commission_amount: number | null
          notes: string | null
          notice_period_days: number | null
          payment_method: string | null
          payment_terms: string | null
          special_terms: string | null
          status: string | null
          terminated_at: string | null
          terminated_by: string | null
          termination_reason: string | null
          tiered_rates: Json | null
          updated_at: string
          valid_from: string
          valid_until: string | null
        }
        Insert: {
          approved_at?: string | null
          approved_by?: string | null
          auto_renew?: boolean | null
          bank_account_name?: string | null
          bank_account_number?: string | null
          bank_name?: string | null
          commission_rate?: number
          commission_type?: string | null
          contract_document_url?: string | null
          contract_number?: string | null
          contract_type?: string | null
          created_at?: string
          created_by?: string | null
          entity_id: string
          entity_type: string
          id?: string
          max_commission_amount?: number | null
          min_commission_amount?: number | null
          notes?: string | null
          notice_period_days?: number | null
          payment_method?: string | null
          payment_terms?: string | null
          special_terms?: string | null
          status?: string | null
          terminated_at?: string | null
          terminated_by?: string | null
          termination_reason?: string | null
          tiered_rates?: Json | null
          updated_at?: string
          valid_from?: string
          valid_until?: string | null
        }
        Update: {
          approved_at?: string | null
          approved_by?: string | null
          auto_renew?: boolean | null
          bank_account_name?: string | null
          bank_account_number?: string | null
          bank_name?: string | null
          commission_rate?: number
          commission_type?: string | null
          contract_document_url?: string | null
          contract_number?: string | null
          contract_type?: string | null
          created_at?: string
          created_by?: string | null
          entity_id?: string
          entity_type?: string
          id?: string
          max_commission_amount?: number | null
          min_commission_amount?: number | null
          notes?: string | null
          notice_period_days?: number | null
          payment_method?: string | null
          payment_terms?: string | null
          special_terms?: string | null
          status?: string | null
          terminated_at?: string | null
          terminated_by?: string | null
          termination_reason?: string | null
          tiered_rates?: Json | null
          updated_at?: string
          valid_from?: string
          valid_until?: string | null
        }
        Relationships: []
      }
      provider_input_rules: {
        Row: {
          created_at: string
          entity_type: string
          field_name: string
          id: string
          is_active: boolean
          message_en: string
          message_ru: string | null
          rule_config: Json
          rule_type: string
          severity: string
        }
        Insert: {
          created_at?: string
          entity_type: string
          field_name: string
          id?: string
          is_active?: boolean
          message_en: string
          message_ru?: string | null
          rule_config?: Json
          rule_type: string
          severity?: string
        }
        Update: {
          created_at?: string
          entity_type?: string
          field_name?: string
          id?: string
          is_active?: boolean
          message_en?: string
          message_ru?: string | null
          rule_config?: Json
          rule_type?: string
          severity?: string
        }
        Relationships: []
      }
      provider_payout_methods: {
        Row: {
          account_holder_name: string | null
          account_number: string | null
          bank_code: string | null
          bank_name: string | null
          created_at: string
          id: string
          is_default: boolean | null
          is_verified: boolean | null
          provider_id: string
          type: string
          updated_at: string
        }
        Insert: {
          account_holder_name?: string | null
          account_number?: string | null
          bank_code?: string | null
          bank_name?: string | null
          created_at?: string
          id?: string
          is_default?: boolean | null
          is_verified?: boolean | null
          provider_id: string
          type?: string
          updated_at?: string
        }
        Update: {
          account_holder_name?: string | null
          account_number?: string | null
          bank_code?: string | null
          bank_name?: string | null
          created_at?: string
          id?: string
          is_default?: boolean | null
          is_verified?: boolean | null
          provider_id?: string
          type?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "provider_payout_methods_provider_id_fkey"
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
          approval_status: string | null
          booking_flow: string | null
          business_category: string | null
          commission_rate: number | null
          cover_image: string | null
          coverage_areas: string[] | null
          created_at: string
          created_by_uno_team: boolean | null
          description_en: string | null
          description_ru: string | null
          email: string | null
          has_guarantee: boolean | null
          has_insurance: boolean | null
          has_machine_translation: boolean | null
          id: string
          is_active: boolean | null
          is_verified: boolean | null
          languages: string[] | null
          lat: number | null
          lng: number | null
          logo_url: string | null
          marketplace_vendor_id: string | null
          name: string
          pending_payout: number | null
          phone: string | null
          provider_type: string | null
          rating: number | null
          response_time_minutes: number | null
          review_count: number | null
          service_domains: string[] | null
          source_urls: string[] | null
          total_earnings: number | null
          trust_score: number | null
          uno_team_creator_id: string | null
          updated_at: string
          user_id: string | null
          website: string | null
        }
        Insert: {
          address?: string | null
          approval_status?: string | null
          booking_flow?: string | null
          business_category?: string | null
          commission_rate?: number | null
          cover_image?: string | null
          coverage_areas?: string[] | null
          created_at?: string
          created_by_uno_team?: boolean | null
          description_en?: string | null
          description_ru?: string | null
          email?: string | null
          has_guarantee?: boolean | null
          has_insurance?: boolean | null
          has_machine_translation?: boolean | null
          id?: string
          is_active?: boolean | null
          is_verified?: boolean | null
          languages?: string[] | null
          lat?: number | null
          lng?: number | null
          logo_url?: string | null
          marketplace_vendor_id?: string | null
          name: string
          pending_payout?: number | null
          phone?: string | null
          provider_type?: string | null
          rating?: number | null
          response_time_minutes?: number | null
          review_count?: number | null
          service_domains?: string[] | null
          source_urls?: string[] | null
          total_earnings?: number | null
          trust_score?: number | null
          uno_team_creator_id?: string | null
          updated_at?: string
          user_id?: string | null
          website?: string | null
        }
        Update: {
          address?: string | null
          approval_status?: string | null
          booking_flow?: string | null
          business_category?: string | null
          commission_rate?: number | null
          cover_image?: string | null
          coverage_areas?: string[] | null
          created_at?: string
          created_by_uno_team?: boolean | null
          description_en?: string | null
          description_ru?: string | null
          email?: string | null
          has_guarantee?: boolean | null
          has_insurance?: boolean | null
          has_machine_translation?: boolean | null
          id?: string
          is_active?: boolean | null
          is_verified?: boolean | null
          languages?: string[] | null
          lat?: number | null
          lng?: number | null
          logo_url?: string | null
          marketplace_vendor_id?: string | null
          name?: string
          pending_payout?: number | null
          phone?: string | null
          provider_type?: string | null
          rating?: number | null
          response_time_minutes?: number | null
          review_count?: number | null
          service_domains?: string[] | null
          source_urls?: string[] | null
          total_earnings?: number | null
          trust_score?: number | null
          uno_team_creator_id?: string | null
          updated_at?: string
          user_id?: string | null
          website?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "providers_marketplace_vendor_id_fkey"
            columns: ["marketplace_vendor_id"]
            isOneToOne: false
            referencedRelation: "marketplace_vendors"
            referencedColumns: ["id"]
          },
        ]
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
      pwa_installs: {
        Row: {
          browser: string | null
          device_info: Json | null
          id: string
          installed_at: string
          ip_hash: string | null
          platform: string
          source: string | null
          user_id: string | null
        }
        Insert: {
          browser?: string | null
          device_info?: Json | null
          id?: string
          installed_at?: string
          ip_hash?: string | null
          platform: string
          source?: string | null
          user_id?: string | null
        }
        Update: {
          browser?: string | null
          device_info?: Json | null
          id?: string
          installed_at?: string
          ip_hash?: string | null
          platform?: string
          source?: string | null
          user_id?: string | null
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
      rate_limit_log: {
        Row: {
          created_at: string | null
          endpoint: string
          id: string
          identifier: string
          request_count: number | null
          window_start: string | null
        }
        Insert: {
          created_at?: string | null
          endpoint: string
          id?: string
          identifier: string
          request_count?: number | null
          window_start?: string | null
        }
        Update: {
          created_at?: string | null
          endpoint?: string
          id?: string
          identifier?: string
          request_count?: number | null
          window_start?: string | null
        }
        Relationships: []
      }
      realtime_stats: {
        Row: {
          active_sessions: number | null
          id: string
          new_users_today: number | null
          online_users: number | null
          orders_today: number | null
          page_views_today: number | null
          revenue_today: number | null
          updated_at: string | null
        }
        Insert: {
          active_sessions?: number | null
          id?: string
          new_users_today?: number | null
          online_users?: number | null
          orders_today?: number | null
          page_views_today?: number | null
          revenue_today?: number | null
          updated_at?: string | null
        }
        Update: {
          active_sessions?: number | null
          id?: string
          new_users_today?: number | null
          online_users?: number | null
          orders_today?: number | null
          page_views_today?: number | null
          revenue_today?: number | null
          updated_at?: string | null
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
      restaurant_hours: {
        Row: {
          close_time: string
          created_at: string
          day_of_week: number
          id: string
          notes: string | null
          open_time: string
          restaurant_id: string
        }
        Insert: {
          close_time: string
          created_at?: string
          day_of_week: number
          id?: string
          notes?: string | null
          open_time: string
          restaurant_id: string
        }
        Update: {
          close_time?: string
          created_at?: string
          day_of_week?: number
          id?: string
          notes?: string | null
          open_time?: string
          restaurant_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "restaurant_hours_restaurant_id_fkey"
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
      restaurant_menus: {
        Row: {
          created_at: string
          currency: string | null
          external_url: string | null
          file_url: string | null
          id: string
          is_active: boolean | null
          menu_type: string
          restaurant_id: string
          scraped_at: string | null
          source_url: string | null
          title: string
        }
        Insert: {
          created_at?: string
          currency?: string | null
          external_url?: string | null
          file_url?: string | null
          id?: string
          is_active?: boolean | null
          menu_type?: string
          restaurant_id: string
          scraped_at?: string | null
          source_url?: string | null
          title: string
        }
        Update: {
          created_at?: string
          currency?: string | null
          external_url?: string | null
          file_url?: string | null
          id?: string
          is_active?: boolean | null
          menu_type?: string
          restaurant_id?: string
          scraped_at?: string | null
          source_url?: string | null
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "restaurant_menus_restaurant_id_fkey"
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
          area: string | null
          avg_check_thb: number | null
          canonical_description_source: string | null
          city: string | null
          cover_image: string | null
          created_at: string
          created_by_uno_team: boolean | null
          cuisine: string
          cuisine_tags: string[] | null
          data_sources: Json | null
          delivery_available: boolean | null
          delivery_fee: number | null
          delivery_provider: string | null
          delivery_time: string | null
          description_en: string | null
          description_ru: string | null
          description_short: string | null
          district: string | null
          email: string | null
          features: string[] | null
          gallery_image_urls: string[] | null
          grabfood_search_query: string | null
          hero_image_url: string | null
          id: string
          images: string[] | null
          is_active: boolean | null
          is_featured: boolean | null
          is_verified: boolean | null
          last_verified_at: string | null
          lat: number | null
          lng: number | null
          menu_last_updated_note: string | null
          menu_url: string | null
          min_order_amount: number | null
          name_en: string
          name_ru: string
          needs_manual_verification: boolean | null
          order_url: string | null
          phone: string | null
          price_band: string | null
          price_level: string | null
          price_range: number | null
          provider_id: string | null
          rating: number | null
          rejection_reason: string | null
          reservation_policy: string | null
          reservation_provider: string | null
          reservation_supported: boolean | null
          reservation_url: string | null
          review_count: number | null
          reviewed_at: string | null
          reviewed_by: string | null
          seo_description: string | null
          seo_title: string | null
          slug: string | null
          uno_team_creator_id: string | null
          updated_at: string
          verification_notes: string | null
          website: string | null
          working_hours: Json | null
        }
        Insert: {
          address?: string | null
          approval_status?: string | null
          area?: string | null
          avg_check_thb?: number | null
          canonical_description_source?: string | null
          city?: string | null
          cover_image?: string | null
          created_at?: string
          created_by_uno_team?: boolean | null
          cuisine?: string
          cuisine_tags?: string[] | null
          data_sources?: Json | null
          delivery_available?: boolean | null
          delivery_fee?: number | null
          delivery_provider?: string | null
          delivery_time?: string | null
          description_en?: string | null
          description_ru?: string | null
          description_short?: string | null
          district?: string | null
          email?: string | null
          features?: string[] | null
          gallery_image_urls?: string[] | null
          grabfood_search_query?: string | null
          hero_image_url?: string | null
          id?: string
          images?: string[] | null
          is_active?: boolean | null
          is_featured?: boolean | null
          is_verified?: boolean | null
          last_verified_at?: string | null
          lat?: number | null
          lng?: number | null
          menu_last_updated_note?: string | null
          menu_url?: string | null
          min_order_amount?: number | null
          name_en: string
          name_ru: string
          needs_manual_verification?: boolean | null
          order_url?: string | null
          phone?: string | null
          price_band?: string | null
          price_level?: string | null
          price_range?: number | null
          provider_id?: string | null
          rating?: number | null
          rejection_reason?: string | null
          reservation_policy?: string | null
          reservation_provider?: string | null
          reservation_supported?: boolean | null
          reservation_url?: string | null
          review_count?: number | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          seo_description?: string | null
          seo_title?: string | null
          slug?: string | null
          uno_team_creator_id?: string | null
          updated_at?: string
          verification_notes?: string | null
          website?: string | null
          working_hours?: Json | null
        }
        Update: {
          address?: string | null
          approval_status?: string | null
          area?: string | null
          avg_check_thb?: number | null
          canonical_description_source?: string | null
          city?: string | null
          cover_image?: string | null
          created_at?: string
          created_by_uno_team?: boolean | null
          cuisine?: string
          cuisine_tags?: string[] | null
          data_sources?: Json | null
          delivery_available?: boolean | null
          delivery_fee?: number | null
          delivery_provider?: string | null
          delivery_time?: string | null
          description_en?: string | null
          description_ru?: string | null
          description_short?: string | null
          district?: string | null
          email?: string | null
          features?: string[] | null
          gallery_image_urls?: string[] | null
          grabfood_search_query?: string | null
          hero_image_url?: string | null
          id?: string
          images?: string[] | null
          is_active?: boolean | null
          is_featured?: boolean | null
          is_verified?: boolean | null
          last_verified_at?: string | null
          lat?: number | null
          lng?: number | null
          menu_last_updated_note?: string | null
          menu_url?: string | null
          min_order_amount?: number | null
          name_en?: string
          name_ru?: string
          needs_manual_verification?: boolean | null
          order_url?: string | null
          phone?: string | null
          price_band?: string | null
          price_level?: string | null
          price_range?: number | null
          provider_id?: string | null
          rating?: number | null
          rejection_reason?: string | null
          reservation_policy?: string | null
          reservation_provider?: string | null
          reservation_supported?: boolean | null
          reservation_url?: string | null
          review_count?: number | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          seo_description?: string | null
          seo_title?: string | null
          slug?: string | null
          uno_team_creator_id?: string | null
          updated_at?: string
          verification_notes?: string | null
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
      returning_guests: {
        Row: {
          booking_count: number | null
          created_at: string | null
          first_booking_at: string | null
          guest_id: string
          id: string
          last_booking_at: string | null
          notes: string | null
          owner_id: string
          personal_discount_percent: number | null
          total_spent: number | null
          updated_at: string | null
        }
        Insert: {
          booking_count?: number | null
          created_at?: string | null
          first_booking_at?: string | null
          guest_id: string
          id?: string
          last_booking_at?: string | null
          notes?: string | null
          owner_id: string
          personal_discount_percent?: number | null
          total_spent?: number | null
          updated_at?: string | null
        }
        Update: {
          booking_count?: number | null
          created_at?: string | null
          first_booking_at?: string | null
          guest_id?: string
          id?: string
          last_booking_at?: string | null
          notes?: string | null
          owner_id?: string
          personal_discount_percent?: number | null
          total_spent?: number | null
          updated_at?: string | null
        }
        Relationships: []
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
          entity_id: string | null
          entity_type: string | null
          helpful_count: number | null
          id: string
          images: string[] | null
          is_approved: boolean | null
          is_featured: boolean | null
          is_verified_purchase: boolean | null
          item_id: string
          item_type: string
          language: string | null
          moderation_status: string | null
          order_id: string | null
          photos: string[] | null
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
          entity_id?: string | null
          entity_type?: string | null
          helpful_count?: number | null
          id?: string
          images?: string[] | null
          is_approved?: boolean | null
          is_featured?: boolean | null
          is_verified_purchase?: boolean | null
          item_id: string
          item_type: string
          language?: string | null
          moderation_status?: string | null
          order_id?: string | null
          photos?: string[] | null
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
          entity_id?: string | null
          entity_type?: string | null
          helpful_count?: number | null
          id?: string
          images?: string[] | null
          is_approved?: boolean | null
          is_featured?: boolean | null
          is_verified_purchase?: boolean | null
          item_id?: string
          item_type?: string
          language?: string | null
          moderation_status?: string | null
          order_id?: string | null
          photos?: string[] | null
          pros?: string | null
          rating?: number
          response?: string | null
          response_at?: string | null
          title?: string | null
          updated_at?: string
          user_id?: string
          visit_date?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "reviews_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
        ]
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
      salon_staff: {
        Row: {
          bio_en: string | null
          bio_ru: string | null
          certifications: string[] | null
          created_at: string
          experience_years: number | null
          id: string
          is_active: boolean | null
          is_featured: boolean | null
          name_en: string
          name_ru: string
          photo: string | null
          portfolio_images: string[] | null
          rating: number | null
          review_count: number | null
          salon_id: string
          sort_order: number | null
          specializations: string[] | null
          updated_at: string
          working_days: string[] | null
          working_hours: Json | null
        }
        Insert: {
          bio_en?: string | null
          bio_ru?: string | null
          certifications?: string[] | null
          created_at?: string
          experience_years?: number | null
          id?: string
          is_active?: boolean | null
          is_featured?: boolean | null
          name_en: string
          name_ru: string
          photo?: string | null
          portfolio_images?: string[] | null
          rating?: number | null
          review_count?: number | null
          salon_id: string
          sort_order?: number | null
          specializations?: string[] | null
          updated_at?: string
          working_days?: string[] | null
          working_hours?: Json | null
        }
        Update: {
          bio_en?: string | null
          bio_ru?: string | null
          certifications?: string[] | null
          created_at?: string
          experience_years?: number | null
          id?: string
          is_active?: boolean | null
          is_featured?: boolean | null
          name_en?: string
          name_ru?: string
          photo?: string | null
          portfolio_images?: string[] | null
          rating?: number | null
          review_count?: number | null
          salon_id?: string
          sort_order?: number | null
          specializations?: string[] | null
          updated_at?: string
          working_days?: string[] | null
          working_hours?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "salon_staff_salon_id_fkey"
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
      security_audit_log: {
        Row: {
          created_at: string
          details: Json | null
          event_type: string
          id: string
          ip_address: string | null
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string
          details?: Json | null
          event_type: string
          id?: string
          ip_address?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string
          details?: Json | null
          event_type?: string
          id?: string
          ip_address?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: []
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
            foreignKeyName: "service_orders_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "v_marketplace_listings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "service_orders_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "v_owner_properties"
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
      service_promotions: {
        Row: {
          category_slug: string | null
          created_at: string | null
          ends_at: string | null
          gradient: string | null
          id: string
          image_url: string
          is_active: boolean | null
          link_path: string
          sort_order: number | null
          starts_at: string | null
          subtitle_en: string | null
          subtitle_ru: string | null
          title_en: string
          title_ru: string
        }
        Insert: {
          category_slug?: string | null
          created_at?: string | null
          ends_at?: string | null
          gradient?: string | null
          id?: string
          image_url: string
          is_active?: boolean | null
          link_path: string
          sort_order?: number | null
          starts_at?: string | null
          subtitle_en?: string | null
          subtitle_ru?: string | null
          title_en: string
          title_ru: string
        }
        Update: {
          category_slug?: string | null
          created_at?: string | null
          ends_at?: string | null
          gradient?: string | null
          id?: string
          image_url?: string
          is_active?: boolean | null
          link_path?: string
          sort_order?: number | null
          starts_at?: string | null
          subtitle_en?: string | null
          subtitle_ru?: string | null
          title_en?: string
          title_ru?: string
        }
        Relationships: []
      }
      services: {
        Row: {
          approval_status: string | null
          availability_mode: string | null
          booking_flow: string | null
          category_id: string | null
          commission_rate: number | null
          created_at: string
          created_by_uno_team: boolean | null
          currency: string | null
          description_en: string | null
          description_ru: string | null
          duration_minutes: number | null
          high_risk_service: boolean | null
          id: string
          images: string[] | null
          is_active: boolean | null
          is_verified: boolean | null
          languages: string[] | null
          lead_time_hours: number | null
          location_id: string | null
          name_en: string
          name_ru: string
          price: number | null
          pricing_model: string | null
          provider_id: string
          rejection_reason: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          source_url: string | null
          tags: string[] | null
          unit: string | null
          uno_team_creator_id: string | null
          updated_at: string
        }
        Insert: {
          approval_status?: string | null
          availability_mode?: string | null
          booking_flow?: string | null
          category_id?: string | null
          commission_rate?: number | null
          created_at?: string
          created_by_uno_team?: boolean | null
          currency?: string | null
          description_en?: string | null
          description_ru?: string | null
          duration_minutes?: number | null
          high_risk_service?: boolean | null
          id?: string
          images?: string[] | null
          is_active?: boolean | null
          is_verified?: boolean | null
          languages?: string[] | null
          lead_time_hours?: number | null
          location_id?: string | null
          name_en: string
          name_ru: string
          price?: number | null
          pricing_model?: string | null
          provider_id: string
          rejection_reason?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          source_url?: string | null
          tags?: string[] | null
          unit?: string | null
          uno_team_creator_id?: string | null
          updated_at?: string
        }
        Update: {
          approval_status?: string | null
          availability_mode?: string | null
          booking_flow?: string | null
          category_id?: string | null
          commission_rate?: number | null
          created_at?: string
          created_by_uno_team?: boolean | null
          currency?: string | null
          description_en?: string | null
          description_ru?: string | null
          duration_minutes?: number | null
          high_risk_service?: boolean | null
          id?: string
          images?: string[] | null
          is_active?: boolean | null
          is_verified?: boolean | null
          languages?: string[] | null
          lead_time_hours?: number | null
          location_id?: string | null
          name_en?: string
          name_ru?: string
          price?: number | null
          pricing_model?: string | null
          provider_id?: string
          rejection_reason?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          source_url?: string | null
          tags?: string[] | null
          unit?: string | null
          uno_team_creator_id?: string | null
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
      simulation_entity_links: {
        Row: {
          created_at: string
          entity_id: string
          entity_type: string
          id: string
          run_id: string
        }
        Insert: {
          created_at?: string
          entity_id: string
          entity_type: string
          id?: string
          run_id: string
        }
        Update: {
          created_at?: string
          entity_id?: string
          entity_type?: string
          id?: string
          run_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "simulation_entity_links_run_id_fkey"
            columns: ["run_id"]
            isOneToOne: false
            referencedRelation: "simulation_runs"
            referencedColumns: ["id"]
          },
        ]
      }
      simulation_events: {
        Row: {
          actor_role: string | null
          actor_user_id: string | null
          duration_ms: number | null
          entity_id: string | null
          entity_type: string | null
          error: string | null
          event_type: string
          id: string
          payload: Json | null
          run_id: string
          ts: string
        }
        Insert: {
          actor_role?: string | null
          actor_user_id?: string | null
          duration_ms?: number | null
          entity_id?: string | null
          entity_type?: string | null
          error?: string | null
          event_type: string
          id?: string
          payload?: Json | null
          run_id: string
          ts?: string
        }
        Update: {
          actor_role?: string | null
          actor_user_id?: string | null
          duration_ms?: number | null
          entity_id?: string | null
          entity_type?: string | null
          error?: string | null
          event_type?: string
          id?: string
          payload?: Json | null
          run_id?: string
          ts?: string
        }
        Relationships: [
          {
            foreignKeyName: "simulation_events_run_id_fkey"
            columns: ["run_id"]
            isOneToOne: false
            referencedRelation: "simulation_runs"
            referencedColumns: ["id"]
          },
        ]
      }
      simulation_runs: {
        Row: {
          completed_at: string | null
          config: Json | null
          created_at: string
          created_by: string | null
          id: string
          label: string
          notes: Json | null
          purged_at: string | null
          status: string
        }
        Insert: {
          completed_at?: string | null
          config?: Json | null
          created_at?: string
          created_by?: string | null
          id?: string
          label: string
          notes?: Json | null
          purged_at?: string | null
          status?: string
        }
        Update: {
          completed_at?: string | null
          config?: Json | null
          created_at?: string
          created_by?: string | null
          id?: string
          label?: string
          notes?: Json | null
          purged_at?: string | null
          status?: string
        }
        Relationships: []
      }
      staff_members: {
        Row: {
          created_at: string
          daily_rate: number | null
          email: string | null
          hourly_rate: number | null
          id: string
          is_active: boolean
          monthly_salary: number | null
          name: string
          notes: string | null
          owner_id: string
          pay_type: string
          phone: string | null
          role: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          daily_rate?: number | null
          email?: string | null
          hourly_rate?: number | null
          id?: string
          is_active?: boolean
          monthly_salary?: number | null
          name: string
          notes?: string | null
          owner_id: string
          pay_type?: string
          phone?: string | null
          role?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          daily_rate?: number | null
          email?: string | null
          hourly_rate?: number | null
          id?: string
          is_active?: boolean
          monthly_salary?: number | null
          name?: string
          notes?: string | null
          owner_id?: string
          pay_type?: string
          phone?: string | null
          role?: string
          updated_at?: string
        }
        Relationships: []
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
      staff_property_assignments: {
        Row: {
          assigned_at: string
          id: string
          is_primary: boolean
          owner_id: string
          property_id: string
          role_at_property: string | null
          staff_id: string
        }
        Insert: {
          assigned_at?: string
          id?: string
          is_primary?: boolean
          owner_id: string
          property_id: string
          role_at_property?: string | null
          staff_id: string
        }
        Update: {
          assigned_at?: string
          id?: string
          is_primary?: boolean
          owner_id?: string
          property_id?: string
          role_at_property?: string | null
          staff_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "staff_property_assignments_staff_id_fkey"
            columns: ["staff_id"]
            isOneToOne: false
            referencedRelation: "staff_members"
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
      subscription_user_passes: {
        Row: {
          benefits_used: Json | null
          billing_cycle: string | null
          cancelled_at: string | null
          created_at: string
          current_period_end: string | null
          current_period_start: string | null
          expires_at: string | null
          id: string
          pause_end: string | null
          pause_start: string | null
          plan_id: string
          started_at: string
          status: string | null
          stripe_subscription_id: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          benefits_used?: Json | null
          billing_cycle?: string | null
          cancelled_at?: string | null
          created_at?: string
          current_period_end?: string | null
          current_period_start?: string | null
          expires_at?: string | null
          id?: string
          pause_end?: string | null
          pause_start?: string | null
          plan_id: string
          started_at?: string
          status?: string | null
          stripe_subscription_id?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          benefits_used?: Json | null
          billing_cycle?: string | null
          cancelled_at?: string | null
          created_at?: string
          current_period_end?: string | null
          current_period_start?: string | null
          expires_at?: string | null
          id?: string
          pause_end?: string | null
          pause_start?: string | null
          plan_id?: string
          started_at?: string
          status?: string | null
          stripe_subscription_id?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "subscription_user_passes_plan_id_fkey"
            columns: ["plan_id"]
            isOneToOne: false
            referencedRelation: "subscription_plans"
            referencedColumns: ["id"]
          },
        ]
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
      sys_intake_configs: {
        Row: {
          created_at: string | null
          field_labels: Json
          icon: string | null
          id: string
          is_active: boolean | null
          keywords: string[]
          name_en: string
          name_ru: string
          optional_fields: string[]
          required_fields: string[]
          sort_order: number | null
          target_table: string
          updated_at: string | null
          vertical_id: string
        }
        Insert: {
          created_at?: string | null
          field_labels?: Json
          icon?: string | null
          id?: string
          is_active?: boolean | null
          keywords?: string[]
          name_en: string
          name_ru: string
          optional_fields?: string[]
          required_fields?: string[]
          sort_order?: number | null
          target_table: string
          updated_at?: string | null
          vertical_id: string
        }
        Update: {
          created_at?: string | null
          field_labels?: Json
          icon?: string | null
          id?: string
          is_active?: boolean | null
          keywords?: string[]
          name_en?: string
          name_ru?: string
          optional_fields?: string[]
          required_fields?: string[]
          sort_order?: number | null
          target_table?: string
          updated_at?: string | null
          vertical_id?: string
        }
        Relationships: []
      }
      sys_lead_configs: {
        Row: {
          created_at: string | null
          cta_text_en: string | null
          cta_text_ru: string | null
          fields: Json
          icon: string | null
          id: string
          is_active: boolean | null
          name_en: string
          name_ru: string
          popularity_score: number | null
          request_types: Json
          short_desc_en: string | null
          short_desc_ru: string | null
          sort_order: number | null
          updated_at: string | null
          vertical_id: string
        }
        Insert: {
          created_at?: string | null
          cta_text_en?: string | null
          cta_text_ru?: string | null
          fields?: Json
          icon?: string | null
          id?: string
          is_active?: boolean | null
          name_en: string
          name_ru: string
          popularity_score?: number | null
          request_types?: Json
          short_desc_en?: string | null
          short_desc_ru?: string | null
          sort_order?: number | null
          updated_at?: string | null
          vertical_id: string
        }
        Update: {
          created_at?: string | null
          cta_text_en?: string | null
          cta_text_ru?: string | null
          fields?: Json
          icon?: string | null
          id?: string
          is_active?: boolean | null
          name_en?: string
          name_ru?: string
          popularity_score?: number | null
          request_types?: Json
          short_desc_en?: string | null
          short_desc_ru?: string | null
          sort_order?: number | null
          updated_at?: string | null
          vertical_id?: string
        }
        Relationships: []
      }
      system_settings: {
        Row: {
          description: string | null
          id: string
          key: string
          updated_at: string
          updated_by: string | null
          value: Json
        }
        Insert: {
          description?: string | null
          id?: string
          key: string
          updated_at?: string
          updated_by?: string | null
          value: Json
        }
        Update: {
          description?: string | null
          id?: string
          key?: string
          updated_at?: string
          updated_by?: string | null
          value?: Json
        }
        Relationships: []
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
      task_entity_map: {
        Row: {
          created_at: string
          entity_id: string
          entity_type: string
          id: string
          is_active: boolean
          life_task_id: string
          relevance_weight: number
          role_scope: string[] | null
          rules: Json | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          entity_id: string
          entity_type: string
          id?: string
          is_active?: boolean
          life_task_id: string
          relevance_weight?: number
          role_scope?: string[] | null
          rules?: Json | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          entity_id?: string
          entity_type?: string
          id?: string
          is_active?: boolean
          life_task_id?: string
          relevance_weight?: number
          role_scope?: string[] | null
          rules?: Json | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "task_entity_map_life_task_id_fkey"
            columns: ["life_task_id"]
            isOneToOne: false
            referencedRelation: "life_tasks"
            referencedColumns: ["id"]
          },
        ]
      }
      taxonomy_definitions: {
        Row: {
          created_at: string | null
          icon: string | null
          id: string
          is_active: boolean | null
          is_system: boolean | null
          metadata_schema: Json | null
          name_en: string
          name_ru: string | null
          sort_order: number | null
          supports_hierarchy: boolean | null
          type_key: string
          updated_at: string | null
          vertical: string | null
        }
        Insert: {
          created_at?: string | null
          icon?: string | null
          id?: string
          is_active?: boolean | null
          is_system?: boolean | null
          metadata_schema?: Json | null
          name_en: string
          name_ru?: string | null
          sort_order?: number | null
          supports_hierarchy?: boolean | null
          type_key: string
          updated_at?: string | null
          vertical?: string | null
        }
        Update: {
          created_at?: string | null
          icon?: string | null
          id?: string
          is_active?: boolean | null
          is_system?: boolean | null
          metadata_schema?: Json | null
          name_en?: string
          name_ru?: string | null
          sort_order?: number | null
          supports_hierarchy?: boolean | null
          type_key?: string
          updated_at?: string | null
          vertical?: string | null
        }
        Relationships: []
      }
      taxonomy_normalization: {
        Row: {
          created_at: string
          entity_type: string
          field_name: string
          id: string
          is_active: boolean
          normalization_type: string
          normalized_value: string
          original_value: string
        }
        Insert: {
          created_at?: string
          entity_type: string
          field_name: string
          id?: string
          is_active?: boolean
          normalization_type?: string
          normalized_value: string
          original_value: string
        }
        Update: {
          created_at?: string
          entity_type?: string
          field_name?: string
          id?: string
          is_active?: boolean
          normalization_type?: string
          normalized_value?: string
          original_value?: string
        }
        Relationships: []
      }
      team_achievements: {
        Row: {
          category: string | null
          created_at: string | null
          description_en: string | null
          description_ru: string | null
          icon: string | null
          id: string
          is_active: boolean | null
          is_secret: boolean | null
          key: string
          name_en: string
          name_ru: string
          points_required: number | null
          sort_order: number | null
          unlock_condition: Json | null
        }
        Insert: {
          category?: string | null
          created_at?: string | null
          description_en?: string | null
          description_ru?: string | null
          icon?: string | null
          id?: string
          is_active?: boolean | null
          is_secret?: boolean | null
          key: string
          name_en: string
          name_ru: string
          points_required?: number | null
          sort_order?: number | null
          unlock_condition?: Json | null
        }
        Update: {
          category?: string | null
          created_at?: string | null
          description_en?: string | null
          description_ru?: string | null
          icon?: string | null
          id?: string
          is_active?: boolean | null
          is_secret?: boolean | null
          key?: string
          name_en?: string
          name_ru?: string
          points_required?: number | null
          sort_order?: number | null
          unlock_condition?: Json | null
        }
        Relationships: []
      }
      team_activity_log: {
        Row: {
          action_type: string
          created_at: string | null
          entity_id: string | null
          entity_type: string | null
          id: string
          metadata: Json | null
          points_earned: number | null
          user_id: string
        }
        Insert: {
          action_type: string
          created_at?: string | null
          entity_id?: string | null
          entity_type?: string | null
          id?: string
          metadata?: Json | null
          points_earned?: number | null
          user_id: string
        }
        Update: {
          action_type?: string
          created_at?: string | null
          entity_id?: string | null
          entity_type?: string | null
          id?: string
          metadata?: Json | null
          points_earned?: number | null
          user_id?: string
        }
        Relationships: []
      }
      team_channels: {
        Row: {
          allowed_specializations: string[] | null
          created_at: string | null
          created_by: string | null
          description: string | null
          icon: string | null
          id: string
          is_announcements_only: boolean | null
          is_private: boolean | null
          name_en: string
          name_ru: string
          slug: string
        }
        Insert: {
          allowed_specializations?: string[] | null
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          icon?: string | null
          id?: string
          is_announcements_only?: boolean | null
          is_private?: boolean | null
          name_en: string
          name_ru: string
          slug: string
        }
        Update: {
          allowed_specializations?: string[] | null
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          icon?: string | null
          id?: string
          is_announcements_only?: boolean | null
          is_private?: boolean | null
          name_en?: string
          name_ru?: string
          slug?: string
        }
        Relationships: []
      }
      team_entity_notes: {
        Row: {
          content: string
          created_at: string | null
          entity_id: string
          entity_type: string
          id: string
          is_important: boolean | null
          mentioned_users: string[] | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          content: string
          created_at?: string | null
          entity_id: string
          entity_type: string
          id?: string
          is_important?: boolean | null
          mentioned_users?: string[] | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          content?: string
          created_at?: string | null
          entity_id?: string
          entity_type?: string
          id?: string
          is_important?: boolean | null
          mentioned_users?: string[] | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      team_gamification: {
        Row: {
          badges: string[] | null
          created_at: string | null
          id: string
          last_activity_date: string | null
          level: number | null
          monthly_points: number | null
          streak_days: number | null
          total_points: number | null
          updated_at: string | null
          user_id: string
          weekly_points: number | null
        }
        Insert: {
          badges?: string[] | null
          created_at?: string | null
          id?: string
          last_activity_date?: string | null
          level?: number | null
          monthly_points?: number | null
          streak_days?: number | null
          total_points?: number | null
          updated_at?: string | null
          user_id: string
          weekly_points?: number | null
        }
        Update: {
          badges?: string[] | null
          created_at?: string | null
          id?: string
          last_activity_date?: string | null
          level?: number | null
          monthly_points?: number | null
          streak_days?: number | null
          total_points?: number | null
          updated_at?: string | null
          user_id?: string
          weekly_points?: number | null
        }
        Relationships: []
      }
      team_members: {
        Row: {
          avatar_url: string | null
          bio: string | null
          created_at: string | null
          display_name: string | null
          hired_at: string | null
          id: string
          is_active: boolean | null
          phone: string | null
          shift_schedule: Json | null
          specializations: string[] | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          avatar_url?: string | null
          bio?: string | null
          created_at?: string | null
          display_name?: string | null
          hired_at?: string | null
          id?: string
          is_active?: boolean | null
          phone?: string | null
          shift_schedule?: Json | null
          specializations?: string[] | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          avatar_url?: string | null
          bio?: string | null
          created_at?: string | null
          display_name?: string | null
          hired_at?: string | null
          id?: string
          is_active?: boolean | null
          phone?: string | null
          shift_schedule?: Json | null
          specializations?: string[] | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      team_messages: {
        Row: {
          attachments: Json | null
          channel: string
          content: string
          created_at: string | null
          id: string
          is_deleted: boolean | null
          is_pinned: boolean | null
          mentioned_users: string[] | null
          reactions: Json | null
          reply_to: string | null
          sender_id: string
          updated_at: string | null
        }
        Insert: {
          attachments?: Json | null
          channel?: string
          content: string
          created_at?: string | null
          id?: string
          is_deleted?: boolean | null
          is_pinned?: boolean | null
          mentioned_users?: string[] | null
          reactions?: Json | null
          reply_to?: string | null
          sender_id: string
          updated_at?: string | null
        }
        Update: {
          attachments?: Json | null
          channel?: string
          content?: string
          created_at?: string | null
          id?: string
          is_deleted?: boolean | null
          is_pinned?: boolean | null
          mentioned_users?: string[] | null
          reactions?: Json | null
          reply_to?: string | null
          sender_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "team_messages_reply_to_fkey"
            columns: ["reply_to"]
            isOneToOne: false
            referencedRelation: "team_messages"
            referencedColumns: ["id"]
          },
        ]
      }
      team_user_achievements: {
        Row: {
          achievement_id: string
          id: string
          unlocked_at: string | null
          user_id: string
        }
        Insert: {
          achievement_id: string
          id?: string
          unlocked_at?: string | null
          user_id: string
        }
        Update: {
          achievement_id?: string
          id?: string
          unlocked_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "team_user_achievements_achievement_id_fkey"
            columns: ["achievement_id"]
            isOneToOne: false
            referencedRelation: "team_achievements"
            referencedColumns: ["id"]
          },
        ]
      }
      terms_acceptances: {
        Row: {
          accepted_at: string
          document_type: string
          document_version: string
          id: string
          ip_address: string | null
          user_id: string
        }
        Insert: {
          accepted_at?: string
          document_type: string
          document_version?: string
          id?: string
          ip_address?: string | null
          user_id: string
        }
        Update: {
          accepted_at?: string
          document_type?: string
          document_version?: string
          id?: string
          ip_address?: string | null
          user_id?: string
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
          commission_rate: number | null
          cover_image: string | null
          created_at: string
          created_by_uno_team: boolean | null
          currency: string | null
          description_en: string | null
          description_ru: string | null
          difficulty: string | null
          duration_hours: number | null
          excludes: string[] | null
          external_link: string | null
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
          partner_id: string | null
          price: number | null
          provider_id: string | null
          rating: number | null
          rejection_reason: string | null
          review_count: number | null
          reviewed_at: string | null
          reviewed_by: string | null
          source_type: string | null
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
          commission_rate?: number | null
          cover_image?: string | null
          created_at?: string
          created_by_uno_team?: boolean | null
          currency?: string | null
          description_en?: string | null
          description_ru?: string | null
          difficulty?: string | null
          duration_hours?: number | null
          excludes?: string[] | null
          external_link?: string | null
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
          partner_id?: string | null
          price?: number | null
          provider_id?: string | null
          rating?: number | null
          rejection_reason?: string | null
          review_count?: number | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          source_type?: string | null
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
          commission_rate?: number | null
          cover_image?: string | null
          created_at?: string
          created_by_uno_team?: boolean | null
          currency?: string | null
          description_en?: string | null
          description_ru?: string | null
          difficulty?: string | null
          duration_hours?: number | null
          excludes?: string[] | null
          external_link?: string | null
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
          partner_id?: string | null
          price?: number | null
          provider_id?: string | null
          rating?: number | null
          rejection_reason?: string | null
          review_count?: number | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          source_type?: string | null
          start_times?: string[] | null
          title_en?: string
          title_ru?: string
          uno_team_creator_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "tours_partner_id_fkey"
            columns: ["partner_id"]
            isOneToOne: false
            referencedRelation: "partners"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tours_provider_id_fkey"
            columns: ["provider_id"]
            isOneToOne: false
            referencedRelation: "providers"
            referencedColumns: ["id"]
          },
        ]
      }
      transfers: {
        Row: {
          availability_note: string | null
          booking_flow: string | null
          child_seat_available: boolean | null
          comfort_level: string
          cover_image: string | null
          created_at: string | null
          created_by_uno_team: boolean | null
          currency: string
          destination_en: string
          destination_ru: string
          distance_km: number | null
          duration_minutes: number | null
          flight_tracking: boolean | null
          full_description_en: string | null
          full_description_ru: string | null
          hourly_rate: number | null
          id: string
          images: string[] | null
          is_active: boolean | null
          is_available: boolean | null
          is_featured: boolean | null
          lifeos_tags: string[] | null
          luggage_max: number
          marketing_tags: string[] | null
          meet_and_greet: boolean | null
          minimum_hours: number | null
          name_en: string
          name_ru: string
          night_service: boolean | null
          one_way_price: number
          operating_hours: string | null
          origin_en: string
          origin_ru: string
          passengers_max: number
          provider_id: string | null
          rating: number | null
          review_count: number | null
          round_trip_price: number | null
          short_description_en: string | null
          short_description_ru: string | null
          sku: string
          slug: string | null
          source_urls: string[] | null
          transfer_type: string
          uno_team_creator_id: string | null
          updated_at: string | null
          vehicle_type: string
          waiting_time_included: number | null
          wheelchair_access: boolean | null
        }
        Insert: {
          availability_note?: string | null
          booking_flow?: string | null
          child_seat_available?: boolean | null
          comfort_level?: string
          cover_image?: string | null
          created_at?: string | null
          created_by_uno_team?: boolean | null
          currency?: string
          destination_en: string
          destination_ru: string
          distance_km?: number | null
          duration_minutes?: number | null
          flight_tracking?: boolean | null
          full_description_en?: string | null
          full_description_ru?: string | null
          hourly_rate?: number | null
          id?: string
          images?: string[] | null
          is_active?: boolean | null
          is_available?: boolean | null
          is_featured?: boolean | null
          lifeos_tags?: string[] | null
          luggage_max?: number
          marketing_tags?: string[] | null
          meet_and_greet?: boolean | null
          minimum_hours?: number | null
          name_en: string
          name_ru: string
          night_service?: boolean | null
          one_way_price: number
          operating_hours?: string | null
          origin_en: string
          origin_ru: string
          passengers_max?: number
          provider_id?: string | null
          rating?: number | null
          review_count?: number | null
          round_trip_price?: number | null
          short_description_en?: string | null
          short_description_ru?: string | null
          sku: string
          slug?: string | null
          source_urls?: string[] | null
          transfer_type?: string
          uno_team_creator_id?: string | null
          updated_at?: string | null
          vehicle_type?: string
          waiting_time_included?: number | null
          wheelchair_access?: boolean | null
        }
        Update: {
          availability_note?: string | null
          booking_flow?: string | null
          child_seat_available?: boolean | null
          comfort_level?: string
          cover_image?: string | null
          created_at?: string | null
          created_by_uno_team?: boolean | null
          currency?: string
          destination_en?: string
          destination_ru?: string
          distance_km?: number | null
          duration_minutes?: number | null
          flight_tracking?: boolean | null
          full_description_en?: string | null
          full_description_ru?: string | null
          hourly_rate?: number | null
          id?: string
          images?: string[] | null
          is_active?: boolean | null
          is_available?: boolean | null
          is_featured?: boolean | null
          lifeos_tags?: string[] | null
          luggage_max?: number
          marketing_tags?: string[] | null
          meet_and_greet?: boolean | null
          minimum_hours?: number | null
          name_en?: string
          name_ru?: string
          night_service?: boolean | null
          one_way_price?: number
          operating_hours?: string | null
          origin_en?: string
          origin_ru?: string
          passengers_max?: number
          provider_id?: string | null
          rating?: number | null
          review_count?: number | null
          round_trip_price?: number | null
          short_description_en?: string | null
          short_description_ru?: string | null
          sku?: string
          slug?: string | null
          source_urls?: string[] | null
          transfer_type?: string
          uno_team_creator_id?: string | null
          updated_at?: string | null
          vehicle_type?: string
          waiting_time_included?: number | null
          wheelchair_access?: boolean | null
        }
        Relationships: [
          {
            foreignKeyName: "transfers_provider_id_fkey"
            columns: ["provider_id"]
            isOneToOne: false
            referencedRelation: "providers"
            referencedColumns: ["id"]
          },
        ]
      }
      translations: {
        Row: {
          category: string | null
          created_at: string | null
          id: string
          is_custom: boolean | null
          key: string
          updated_at: string | null
          updated_by: string | null
          value_en: string
          value_ru: string
          value_th: string | null
        }
        Insert: {
          category?: string | null
          created_at?: string | null
          id?: string
          is_custom?: boolean | null
          key: string
          updated_at?: string | null
          updated_by?: string | null
          value_en: string
          value_ru: string
          value_th?: string | null
        }
        Update: {
          category?: string | null
          created_at?: string | null
          id?: string
          is_custom?: boolean | null
          key?: string
          updated_at?: string | null
          updated_by?: string | null
          value_en?: string
          value_ru?: string
          value_th?: string | null
        }
        Relationships: []
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
      user_achievements: {
        Row: {
          achieved_at: string | null
          achievement_code: string
          bonus_awarded: number | null
          id: string
          metadata: Json | null
          user_id: string
        }
        Insert: {
          achieved_at?: string | null
          achievement_code: string
          bonus_awarded?: number | null
          id?: string
          metadata?: Json | null
          user_id: string
        }
        Update: {
          achieved_at?: string | null
          achievement_code?: string
          bonus_awarded?: number | null
          id?: string
          metadata?: Json | null
          user_id?: string
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
      user_addresses: {
        Row: {
          address_text: string
          city: string | null
          country: string | null
          created_at: string | null
          id: string
          is_default: boolean | null
          label: string
          phone: string
          postal_code: string | null
          recipient_name: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          address_text: string
          city?: string | null
          country?: string | null
          created_at?: string | null
          id?: string
          is_default?: boolean | null
          label?: string
          phone: string
          postal_code?: string | null
          recipient_name: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          address_text?: string
          city?: string | null
          country?: string | null
          created_at?: string | null
          id?: string
          is_default?: boolean | null
          label?: string
          phone?: string
          postal_code?: string | null
          recipient_name?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      user_analytics_daily: {
        Row: {
          created_at: string | null
          date: string
          events: number | null
          id: string
          orders: number | null
          page_views: number | null
          revenue: number | null
          sessions: number | null
          time_spent: number | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          date: string
          events?: number | null
          id?: string
          orders?: number | null
          page_views?: number | null
          revenue?: number | null
          sessions?: number | null
          time_spent?: number | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          date?: string
          events?: number | null
          id?: string
          orders?: number | null
          page_views?: number | null
          revenue?: number | null
          sessions?: number | null
          time_spent?: number | null
          user_id?: string
        }
        Relationships: []
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
          last_reminded_at: string | null
          notes: string | null
          reminder_days: number[] | null
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
          last_reminded_at?: string | null
          notes?: string | null
          reminder_days?: number[] | null
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
          last_reminded_at?: string | null
          notes?: string | null
          reminder_days?: number[] | null
          updated_at?: string
          user_id?: string
          verified_at?: string | null
        }
        Relationships: []
      }
      user_events: {
        Row: {
          created_at: string
          event_category: string | null
          event_data: Json | null
          event_name: string
          event_type: string
          id: string
          page_path: string | null
          session_id: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string
          event_category?: string | null
          event_data?: Json | null
          event_name: string
          event_type: string
          id?: string
          page_path?: string | null
          session_id?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string
          event_category?: string | null
          event_data?: Json | null
          event_name?: string
          event_type?: string
          id?: string
          page_path?: string | null
          session_id?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "user_events_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "user_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      user_listings: {
        Row: {
          category_slug: string | null
          condition: string | null
          contact_phone: string | null
          contact_whatsapp: string | null
          cover_image: string | null
          created_at: string | null
          currency: string | null
          description_en: string | null
          description_ru: string | null
          expires_at: string | null
          favorites_count: number | null
          id: string
          images: string[] | null
          is_negotiable: boolean | null
          location: string | null
          moderation_status: string | null
          original_price: number | null
          price: number
          published_at: string | null
          rejection_reason: string | null
          show_phone: boolean | null
          sold_at: string | null
          status: string | null
          subcategory: string | null
          title_en: string
          title_ru: string | null
          updated_at: string | null
          user_id: string
          views_count: number | null
        }
        Insert: {
          category_slug?: string | null
          condition?: string | null
          contact_phone?: string | null
          contact_whatsapp?: string | null
          cover_image?: string | null
          created_at?: string | null
          currency?: string | null
          description_en?: string | null
          description_ru?: string | null
          expires_at?: string | null
          favorites_count?: number | null
          id?: string
          images?: string[] | null
          is_negotiable?: boolean | null
          location?: string | null
          moderation_status?: string | null
          original_price?: number | null
          price: number
          published_at?: string | null
          rejection_reason?: string | null
          show_phone?: boolean | null
          sold_at?: string | null
          status?: string | null
          subcategory?: string | null
          title_en: string
          title_ru?: string | null
          updated_at?: string | null
          user_id: string
          views_count?: number | null
        }
        Update: {
          category_slug?: string | null
          condition?: string | null
          contact_phone?: string | null
          contact_whatsapp?: string | null
          cover_image?: string | null
          created_at?: string | null
          currency?: string | null
          description_en?: string | null
          description_ru?: string | null
          expires_at?: string | null
          favorites_count?: number | null
          id?: string
          images?: string[] | null
          is_negotiable?: boolean | null
          location?: string | null
          moderation_status?: string | null
          original_price?: number | null
          price?: number
          published_at?: string | null
          rejection_reason?: string | null
          show_phone?: boolean | null
          sold_at?: string | null
          status?: string | null
          subcategory?: string | null
          title_en?: string
          title_ru?: string | null
          updated_at?: string | null
          user_id?: string
          views_count?: number | null
        }
        Relationships: []
      }
      user_loyalty_status: {
        Row: {
          bookings_this_year: number | null
          created_at: string | null
          current_tier_id: string | null
          gmv_this_year: number | null
          id: string
          tier_updated_at: string | null
          total_bookings: number | null
          total_gmv_thb: number | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          bookings_this_year?: number | null
          created_at?: string | null
          current_tier_id?: string | null
          gmv_this_year?: number | null
          id?: string
          tier_updated_at?: string | null
          total_bookings?: number | null
          total_gmv_thb?: number | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          bookings_this_year?: number | null
          created_at?: string | null
          current_tier_id?: string | null
          gmv_this_year?: number | null
          id?: string
          tier_updated_at?: string | null
          total_bookings?: number | null
          total_gmv_thb?: number | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_loyalty_status_current_tier_id_fkey"
            columns: ["current_tier_id"]
            isOneToOne: false
            referencedRelation: "guest_loyalty_tiers"
            referencedColumns: ["id"]
          },
        ]
      }
      user_payment_methods: {
        Row: {
          brand: string | null
          created_at: string
          exp_month: number | null
          exp_year: number | null
          holder_name: string | null
          id: string
          is_default: boolean | null
          last4: string
          stripe_payment_method_id: string | null
          type: string
          updated_at: string
          user_id: string
        }
        Insert: {
          brand?: string | null
          created_at?: string
          exp_month?: number | null
          exp_year?: number | null
          holder_name?: string | null
          id?: string
          is_default?: boolean | null
          last4: string
          stripe_payment_method_id?: string | null
          type: string
          updated_at?: string
          user_id: string
        }
        Update: {
          brand?: string | null
          created_at?: string
          exp_month?: number | null
          exp_year?: number | null
          holder_name?: string | null
          id?: string
          is_default?: boolean | null
          last4?: string
          stripe_payment_method_id?: string | null
          type?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_personas: {
        Row: {
          created_at: string | null
          id: string
          is_active: boolean | null
          persona: Database["public"]["Enums"]["user_persona"]
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          persona: Database["public"]["Enums"]["user_persona"]
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          persona?: Database["public"]["Enums"]["user_persona"]
          user_id?: string
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
      user_referrals: {
        Row: {
          created_at: string
          id: string
          qualified_at: string | null
          qualifying_order_id: string | null
          referral_code: string
          referred_id: string
          referrer_id: string
          reward_amount: number
          reward_currency: string
          rewarded_at: string | null
          status: string
        }
        Insert: {
          created_at?: string
          id?: string
          qualified_at?: string | null
          qualifying_order_id?: string | null
          referral_code: string
          referred_id: string
          referrer_id: string
          reward_amount?: number
          reward_currency?: string
          rewarded_at?: string | null
          status?: string
        }
        Update: {
          created_at?: string
          id?: string
          qualified_at?: string | null
          qualifying_order_id?: string | null
          referral_code?: string
          referred_id?: string
          referrer_id?: string
          reward_amount?: number
          reward_currency?: string
          rewarded_at?: string | null
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_referrals_qualifying_order_id_fkey"
            columns: ["qualifying_order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
        ]
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
      user_segments: {
        Row: {
          acquisition_cohort: string | null
          acquisition_source: string | null
          avg_order_value: number | null
          avg_session_duration: number | null
          created_at: string | null
          days_since_last_order: number | null
          days_since_last_visit: number | null
          engagement_level: string | null
          first_order_at: string | null
          first_seen_at: string | null
          id: string
          is_at_risk: boolean | null
          is_vip: boolean | null
          last_order_at: string | null
          last_seen_at: string | null
          lifecycle_stage: string | null
          lifetime_value: number | null
          preferred_device: string | null
          preferred_vertical: string | null
          total_orders: number | null
          total_page_views: number | null
          total_sessions: number | null
          total_spent: number | null
          updated_at: string | null
          user_id: string
          value_segment: string | null
        }
        Insert: {
          acquisition_cohort?: string | null
          acquisition_source?: string | null
          avg_order_value?: number | null
          avg_session_duration?: number | null
          created_at?: string | null
          days_since_last_order?: number | null
          days_since_last_visit?: number | null
          engagement_level?: string | null
          first_order_at?: string | null
          first_seen_at?: string | null
          id?: string
          is_at_risk?: boolean | null
          is_vip?: boolean | null
          last_order_at?: string | null
          last_seen_at?: string | null
          lifecycle_stage?: string | null
          lifetime_value?: number | null
          preferred_device?: string | null
          preferred_vertical?: string | null
          total_orders?: number | null
          total_page_views?: number | null
          total_sessions?: number | null
          total_spent?: number | null
          updated_at?: string | null
          user_id: string
          value_segment?: string | null
        }
        Update: {
          acquisition_cohort?: string | null
          acquisition_source?: string | null
          avg_order_value?: number | null
          avg_session_duration?: number | null
          created_at?: string | null
          days_since_last_order?: number | null
          days_since_last_visit?: number | null
          engagement_level?: string | null
          first_order_at?: string | null
          first_seen_at?: string | null
          id?: string
          is_at_risk?: boolean | null
          is_vip?: boolean | null
          last_order_at?: string | null
          last_seen_at?: string | null
          lifecycle_stage?: string | null
          lifetime_value?: number | null
          preferred_device?: string | null
          preferred_vertical?: string | null
          total_orders?: number | null
          total_page_views?: number | null
          total_sessions?: number | null
          total_spent?: number | null
          updated_at?: string | null
          user_id?: string
          value_segment?: string | null
        }
        Relationships: []
      }
      user_sessions: {
        Row: {
          browser: string | null
          city: string | null
          country: string | null
          device_type: string | null
          ended_at: string | null
          id: string
          ip_address: unknown
          is_active: boolean | null
          last_activity_at: string
          os: string | null
          pages_viewed: number | null
          referrer: string | null
          session_token: string
          started_at: string
          user_id: string | null
          utm_campaign: string | null
          utm_medium: string | null
          utm_source: string | null
        }
        Insert: {
          browser?: string | null
          city?: string | null
          country?: string | null
          device_type?: string | null
          ended_at?: string | null
          id?: string
          ip_address?: unknown
          is_active?: boolean | null
          last_activity_at?: string
          os?: string | null
          pages_viewed?: number | null
          referrer?: string | null
          session_token: string
          started_at?: string
          user_id?: string | null
          utm_campaign?: string | null
          utm_medium?: string | null
          utm_source?: string | null
        }
        Update: {
          browser?: string | null
          city?: string | null
          country?: string | null
          device_type?: string | null
          ended_at?: string | null
          id?: string
          ip_address?: unknown
          is_active?: boolean | null
          last_activity_at?: string
          os?: string | null
          pages_viewed?: number | null
          referrer?: string | null
          session_token?: string
          started_at?: string
          user_id?: string | null
          utm_campaign?: string | null
          utm_medium?: string | null
          utm_source?: string | null
        }
        Relationships: []
      }
      vehicles: {
        Row: {
          approval_status: string | null
          brand: string | null
          capacity: number | null
          class_label: string | null
          color: string | null
          commission_rate: number | null
          cover_image: string | null
          created_at: string | null
          created_by_uno_team: boolean | null
          currency: string | null
          delivery_available: boolean | null
          deposit_amount: number | null
          description_en: string | null
          description_ru: string | null
          doors: number | null
          engine_size: string | null
          extra_km_price: number | null
          features: string[] | null
          free_km_per_day: number | null
          fuel_type: string | null
          helmet_included: boolean | null
          id: string
          images: string[] | null
          insurance_note: string | null
          is_active: boolean | null
          is_available: boolean | null
          is_featured: boolean | null
          is_verified: boolean | null
          license_plate: string | null
          location_name: string | null
          location_ru: string | null
          luggage_capacity: number | null
          mileage_policy: string | null
          min_rental_days: number | null
          name_en: string
          name_ru: string
          price_airport_transfer: number | null
          price_per_day: number | null
          price_per_hour: number | null
          price_per_month: number | null
          price_per_week: number | null
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
          with_driver_available: boolean | null
          year_built: number | null
        }
        Insert: {
          approval_status?: string | null
          brand?: string | null
          capacity?: number | null
          class_label?: string | null
          color?: string | null
          commission_rate?: number | null
          cover_image?: string | null
          created_at?: string | null
          created_by_uno_team?: boolean | null
          currency?: string | null
          delivery_available?: boolean | null
          deposit_amount?: number | null
          description_en?: string | null
          description_ru?: string | null
          doors?: number | null
          engine_size?: string | null
          extra_km_price?: number | null
          features?: string[] | null
          free_km_per_day?: number | null
          fuel_type?: string | null
          helmet_included?: boolean | null
          id?: string
          images?: string[] | null
          insurance_note?: string | null
          is_active?: boolean | null
          is_available?: boolean | null
          is_featured?: boolean | null
          is_verified?: boolean | null
          license_plate?: string | null
          location_name?: string | null
          location_ru?: string | null
          luggage_capacity?: number | null
          mileage_policy?: string | null
          min_rental_days?: number | null
          name_en: string
          name_ru: string
          price_airport_transfer?: number | null
          price_per_day?: number | null
          price_per_hour?: number | null
          price_per_month?: number | null
          price_per_week?: number | null
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
          with_driver_available?: boolean | null
          year_built?: number | null
        }
        Update: {
          approval_status?: string | null
          brand?: string | null
          capacity?: number | null
          class_label?: string | null
          color?: string | null
          commission_rate?: number | null
          cover_image?: string | null
          created_at?: string | null
          created_by_uno_team?: boolean | null
          currency?: string | null
          delivery_available?: boolean | null
          deposit_amount?: number | null
          description_en?: string | null
          description_ru?: string | null
          doors?: number | null
          engine_size?: string | null
          extra_km_price?: number | null
          features?: string[] | null
          free_km_per_day?: number | null
          fuel_type?: string | null
          helmet_included?: boolean | null
          id?: string
          images?: string[] | null
          insurance_note?: string | null
          is_active?: boolean | null
          is_available?: boolean | null
          is_featured?: boolean | null
          is_verified?: boolean | null
          license_plate?: string | null
          location_name?: string | null
          location_ru?: string | null
          luggage_capacity?: number | null
          mileage_policy?: string | null
          min_rental_days?: number | null
          name_en?: string
          name_ru?: string
          price_airport_transfer?: number | null
          price_per_day?: number | null
          price_per_hour?: number | null
          price_per_month?: number | null
          price_per_week?: number | null
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
          with_driver_available?: boolean | null
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
      vendor_location_services: {
        Row: {
          created_at: string
          currency_override: string | null
          duration_override: number | null
          id: string
          is_active: boolean | null
          location_id: string
          price_override: number | null
          service_id: string
        }
        Insert: {
          created_at?: string
          currency_override?: string | null
          duration_override?: number | null
          id?: string
          is_active?: boolean | null
          location_id: string
          price_override?: number | null
          service_id: string
        }
        Update: {
          created_at?: string
          currency_override?: string | null
          duration_override?: number | null
          id?: string
          is_active?: boolean | null
          location_id?: string
          price_override?: number | null
          service_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "vendor_location_services_location_id_fkey"
            columns: ["location_id"]
            isOneToOne: false
            referencedRelation: "vendor_locations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "vendor_location_services_service_id_fkey"
            columns: ["service_id"]
            isOneToOne: false
            referencedRelation: "services"
            referencedColumns: ["id"]
          },
        ]
      }
      vendor_locations: {
        Row: {
          address: string
          address_ru: string | null
          approval_status: string | null
          city_id: string | null
          cover_image: string | null
          created_at: string
          description: string | null
          description_ru: string | null
          district: string | null
          email: string | null
          id: string
          images: string[] | null
          is_active: boolean | null
          lat: number | null
          lng: number | null
          name: string
          name_ru: string | null
          org_id: string
          phone: string | null
          rating: number | null
          rejection_reason: string | null
          review_count: number | null
          reviewed_at: string | null
          reviewed_by: string | null
          updated_at: string
          working_hours: Json | null
        }
        Insert: {
          address: string
          address_ru?: string | null
          approval_status?: string | null
          city_id?: string | null
          cover_image?: string | null
          created_at?: string
          description?: string | null
          description_ru?: string | null
          district?: string | null
          email?: string | null
          id?: string
          images?: string[] | null
          is_active?: boolean | null
          lat?: number | null
          lng?: number | null
          name: string
          name_ru?: string | null
          org_id: string
          phone?: string | null
          rating?: number | null
          rejection_reason?: string | null
          review_count?: number | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          updated_at?: string
          working_hours?: Json | null
        }
        Update: {
          address?: string
          address_ru?: string | null
          approval_status?: string | null
          city_id?: string | null
          cover_image?: string | null
          created_at?: string
          description?: string | null
          description_ru?: string | null
          district?: string | null
          email?: string | null
          id?: string
          images?: string[] | null
          is_active?: boolean | null
          lat?: number | null
          lng?: number | null
          name?: string
          name_ru?: string | null
          org_id?: string
          phone?: string | null
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
            foreignKeyName: "vendor_locations_city_id_fkey"
            columns: ["city_id"]
            isOneToOne: false
            referencedRelation: "cities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "vendor_locations_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "orgs"
            referencedColumns: ["id"]
          },
        ]
      }
      vendor_outreach_templates: {
        Row: {
          business_type: string | null
          channel: string
          created_at: string | null
          created_by: string | null
          id: string
          is_active: boolean | null
          language: string
          name: string
          stage: string
          subject: string | null
          template: string
          variables: string[] | null
        }
        Insert: {
          business_type?: string | null
          channel: string
          created_at?: string | null
          created_by?: string | null
          id?: string
          is_active?: boolean | null
          language?: string
          name: string
          stage: string
          subject?: string | null
          template: string
          variables?: string[] | null
        }
        Update: {
          business_type?: string | null
          channel?: string
          created_at?: string | null
          created_by?: string | null
          id?: string
          is_active?: boolean | null
          language?: string
          name?: string
          stage?: string
          subject?: string | null
          template?: string
          variables?: string[] | null
        }
        Relationships: []
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
      vendor_performance_reviews: {
        Row: {
          communication_score: number
          company_id: string
          created_at: string
          id: string
          notes: string | null
          overall_score: number | null
          property_id: string | null
          quality_score: number
          reviewed_by: string
          speed_score: number
          task_id: string | null
          vendor_id: string
        }
        Insert: {
          communication_score: number
          company_id: string
          created_at?: string
          id?: string
          notes?: string | null
          overall_score?: number | null
          property_id?: string | null
          quality_score: number
          reviewed_by: string
          speed_score: number
          task_id?: string | null
          vendor_id: string
        }
        Update: {
          communication_score?: number
          company_id?: string
          created_at?: string
          id?: string
          notes?: string | null
          overall_score?: number | null
          property_id?: string | null
          quality_score?: number
          reviewed_by?: string
          speed_score?: number
          task_id?: string | null
          vendor_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "vendor_performance_reviews_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "management_companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "vendor_performance_reviews_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "vendor_performance_reviews_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "v_marketplace_listings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "vendor_performance_reviews_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "v_owner_properties"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "vendor_performance_reviews_vendor_id_fkey"
            columns: ["vendor_id"]
            isOneToOne: false
            referencedRelation: "providers"
            referencedColumns: ["id"]
          },
        ]
      }
      vendor_prospect_activity: {
        Row: {
          activity_type: string
          created_at: string | null
          id: string
          message_channel: string | null
          message_content: string | null
          new_value: string | null
          old_value: string | null
          performed_by: string | null
          prospect_id: string
        }
        Insert: {
          activity_type: string
          created_at?: string | null
          id?: string
          message_channel?: string | null
          message_content?: string | null
          new_value?: string | null
          old_value?: string | null
          performed_by?: string | null
          prospect_id: string
        }
        Update: {
          activity_type?: string
          created_at?: string | null
          id?: string
          message_channel?: string | null
          message_content?: string | null
          new_value?: string | null
          old_value?: string | null
          performed_by?: string | null
          prospect_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "vendor_prospect_activity_prospect_id_fkey"
            columns: ["prospect_id"]
            isOneToOne: false
            referencedRelation: "vendor_prospects"
            referencedColumns: ["id"]
          },
        ]
      }
      vendor_prospects: {
        Row: {
          address: string | null
          ai_analyzed_at: string | null
          ai_priority: string | null
          ai_reasoning: string | null
          ai_recommended_plan: string | null
          ai_score: number | null
          ai_talking_points: string[] | null
          assigned_to: string | null
          business_name: string
          business_name_ru: string | null
          business_type: string | null
          category: string | null
          city: string | null
          contact_count: number | null
          contact_name: string | null
          converted_at: string | null
          converted_provider_id: string | null
          created_at: string | null
          created_by: string | null
          district: string | null
          email: string | null
          engagement_rate: number | null
          facebook: string | null
          first_contact_at: string | null
          followers_count: number | null
          id: string
          instagram: string | null
          last_contact_at: string | null
          last_post_at: string | null
          lat: number | null
          lng: number | null
          next_followup_at: string | null
          notes: string | null
          outreach_channel: string | null
          phone: string | null
          posts_count: number | null
          rejection_reason: string | null
          source_data: Json | null
          source_type: string
          source_url: string | null
          status: string
          updated_at: string | null
          website: string | null
          whatsapp: string | null
        }
        Insert: {
          address?: string | null
          ai_analyzed_at?: string | null
          ai_priority?: string | null
          ai_reasoning?: string | null
          ai_recommended_plan?: string | null
          ai_score?: number | null
          ai_talking_points?: string[] | null
          assigned_to?: string | null
          business_name: string
          business_name_ru?: string | null
          business_type?: string | null
          category?: string | null
          city?: string | null
          contact_count?: number | null
          contact_name?: string | null
          converted_at?: string | null
          converted_provider_id?: string | null
          created_at?: string | null
          created_by?: string | null
          district?: string | null
          email?: string | null
          engagement_rate?: number | null
          facebook?: string | null
          first_contact_at?: string | null
          followers_count?: number | null
          id?: string
          instagram?: string | null
          last_contact_at?: string | null
          last_post_at?: string | null
          lat?: number | null
          lng?: number | null
          next_followup_at?: string | null
          notes?: string | null
          outreach_channel?: string | null
          phone?: string | null
          posts_count?: number | null
          rejection_reason?: string | null
          source_data?: Json | null
          source_type: string
          source_url?: string | null
          status?: string
          updated_at?: string | null
          website?: string | null
          whatsapp?: string | null
        }
        Update: {
          address?: string | null
          ai_analyzed_at?: string | null
          ai_priority?: string | null
          ai_reasoning?: string | null
          ai_recommended_plan?: string | null
          ai_score?: number | null
          ai_talking_points?: string[] | null
          assigned_to?: string | null
          business_name?: string
          business_name_ru?: string | null
          business_type?: string | null
          category?: string | null
          city?: string | null
          contact_count?: number | null
          contact_name?: string | null
          converted_at?: string | null
          converted_provider_id?: string | null
          created_at?: string | null
          created_by?: string | null
          district?: string | null
          email?: string | null
          engagement_rate?: number | null
          facebook?: string | null
          first_contact_at?: string | null
          followers_count?: number | null
          id?: string
          instagram?: string | null
          last_contact_at?: string | null
          last_post_at?: string | null
          lat?: number | null
          lng?: number | null
          next_followup_at?: string | null
          notes?: string | null
          outreach_channel?: string | null
          phone?: string | null
          posts_count?: number | null
          rejection_reason?: string | null
          source_data?: Json | null
          source_type?: string
          source_url?: string | null
          status?: string
          updated_at?: string | null
          website?: string | null
          whatsapp?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "vendor_prospects_converted_provider_id_fkey"
            columns: ["converted_provider_id"]
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
      vertical_life_tasks: {
        Row: {
          context_notes: string | null
          created_at: string
          id: string
          is_active: boolean
          life_task_id: string
          priority_weight: number
          updated_at: string
          vertical_code: string
        }
        Insert: {
          context_notes?: string | null
          created_at?: string
          id?: string
          is_active?: boolean
          life_task_id: string
          priority_weight?: number
          updated_at?: string
          vertical_code: string
        }
        Update: {
          context_notes?: string | null
          created_at?: string
          id?: string
          is_active?: boolean
          life_task_id?: string
          priority_weight?: number
          updated_at?: string
          vertical_code?: string
        }
        Relationships: [
          {
            foreignKeyName: "vertical_life_tasks_life_task_id_fkey"
            columns: ["life_task_id"]
            isOneToOne: false
            referencedRelation: "life_tasks"
            referencedColumns: ["id"]
          },
        ]
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
      vertical_subscriptions: {
        Row: {
          created_at: string
          id: string
          notify_email: boolean
          notify_push: boolean
          updated_at: string
          user_id: string
          vertical_slug: string
        }
        Insert: {
          created_at?: string
          id?: string
          notify_email?: boolean
          notify_push?: boolean
          updated_at?: string
          user_id: string
          vertical_slug: string
        }
        Update: {
          created_at?: string
          id?: string
          notify_email?: boolean
          notify_push?: boolean
          updated_at?: string
          user_id?: string
          vertical_slug?: string
        }
        Relationships: []
      }
      veterinary_clinics: {
        Row: {
          address: string | null
          cover_image: string | null
          created_at: string | null
          currency: string | null
          description_en: string | null
          description_ru: string | null
          district: string | null
          email: string | null
          has_emergency: boolean | null
          home_visits: boolean | null
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
          price_consultation: number | null
          provider_id: string | null
          rating: number | null
          review_count: number | null
          services: string[] | null
          specializations: string[] | null
          updated_at: string | null
          website: string | null
          working_hours: Json | null
        }
        Insert: {
          address?: string | null
          cover_image?: string | null
          created_at?: string | null
          currency?: string | null
          description_en?: string | null
          description_ru?: string | null
          district?: string | null
          email?: string | null
          has_emergency?: boolean | null
          home_visits?: boolean | null
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
          price_consultation?: number | null
          provider_id?: string | null
          rating?: number | null
          review_count?: number | null
          services?: string[] | null
          specializations?: string[] | null
          updated_at?: string | null
          website?: string | null
          working_hours?: Json | null
        }
        Update: {
          address?: string | null
          cover_image?: string | null
          created_at?: string | null
          currency?: string | null
          description_en?: string | null
          description_ru?: string | null
          district?: string | null
          email?: string | null
          has_emergency?: boolean | null
          home_visits?: boolean | null
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
          price_consultation?: number | null
          provider_id?: string | null
          rating?: number | null
          review_count?: number | null
          services?: string[] | null
          specializations?: string[] | null
          updated_at?: string | null
          website?: string | null
          working_hours?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "veterinary_clinics_provider_id_fkey"
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
      yacht_availability: {
        Row: {
          booking_id: string | null
          created_at: string
          date: string
          id: string
          note: string | null
          price_override: number | null
          status: string
          updated_at: string
          yacht_id: string
        }
        Insert: {
          booking_id?: string | null
          created_at?: string
          date: string
          id?: string
          note?: string | null
          price_override?: number | null
          status?: string
          updated_at?: string
          yacht_id: string
        }
        Update: {
          booking_id?: string | null
          created_at?: string
          date?: string
          id?: string
          note?: string | null
          price_override?: number | null
          status?: string
          updated_at?: string
          yacht_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "yacht_availability_yacht_id_fkey"
            columns: ["yacht_id"]
            isOneToOne: false
            referencedRelation: "yachts"
            referencedColumns: ["id"]
          },
        ]
      }
      yacht_external_calendars: {
        Row: {
          created_at: string
          ical_url: string
          id: string
          is_active: boolean | null
          last_synced_at: string | null
          name: string
          owner_id: string
          sync_error: string | null
          updated_at: string
          yacht_id: string
        }
        Insert: {
          created_at?: string
          ical_url: string
          id?: string
          is_active?: boolean | null
          last_synced_at?: string | null
          name: string
          owner_id: string
          sync_error?: string | null
          updated_at?: string
          yacht_id: string
        }
        Update: {
          created_at?: string
          ical_url?: string
          id?: string
          is_active?: boolean | null
          last_synced_at?: string | null
          name?: string
          owner_id?: string
          sync_error?: string | null
          updated_at?: string
          yacht_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "yacht_external_calendars_yacht_id_fkey"
            columns: ["yacht_id"]
            isOneToOne: false
            referencedRelation: "yachts"
            referencedColumns: ["id"]
          },
        ]
      }
      yacht_pricing_rules: {
        Row: {
          created_at: string
          days_of_week: number[] | null
          end_date: string | null
          id: string
          is_active: boolean | null
          name_en: string
          name_ru: string | null
          price_modifier_percent: number | null
          price_override_full_day: number | null
          price_override_half_day: number | null
          priority: number | null
          rule_type: string
          start_date: string | null
          updated_at: string
          yacht_id: string
        }
        Insert: {
          created_at?: string
          days_of_week?: number[] | null
          end_date?: string | null
          id?: string
          is_active?: boolean | null
          name_en: string
          name_ru?: string | null
          price_modifier_percent?: number | null
          price_override_full_day?: number | null
          price_override_half_day?: number | null
          priority?: number | null
          rule_type: string
          start_date?: string | null
          updated_at?: string
          yacht_id: string
        }
        Update: {
          created_at?: string
          days_of_week?: number[] | null
          end_date?: string | null
          id?: string
          is_active?: boolean | null
          name_en?: string
          name_ru?: string | null
          price_modifier_percent?: number | null
          price_override_full_day?: number | null
          price_override_half_day?: number | null
          priority?: number | null
          rule_type?: string
          start_date?: string | null
          updated_at?: string
          yacht_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "yacht_pricing_rules_yacht_id_fkey"
            columns: ["yacht_id"]
            isOneToOne: false
            referencedRelation: "yachts"
            referencedColumns: ["id"]
          },
        ]
      }
      yachts: {
        Row: {
          addons: string[] | null
          approval_status: string | null
          balance_due_hours: number | null
          bathrooms: number | null
          beam: string | null
          booking_flow: string | null
          cabins: number | null
          cancellation_policy: string | null
          capacity: number | null
          charter_options: string[] | null
          cover_image: string | null
          created_at: string
          created_by_uno_team: boolean | null
          cruising_speed: string | null
          currency: string | null
          departure_times: string[] | null
          deposit_percent: number | null
          description_en: string | null
          description_ru: string | null
          draft: string | null
          engines: string | null
          exclusions_en: string[] | null
          exclusions_ru: string[] | null
          features_en: string[] | null
          features_ru: string[] | null
          fuel_capacity: string | null
          fuel_policy: string | null
          has_catering: boolean | null
          has_crew: boolean | null
          ical_token: string | null
          ical_token_expires_at: string | null
          ical_token_refreshed_at: string | null
          id: string
          images: string[] | null
          insurance_included: string | null
          insurance_notes: string | null
          is_active: boolean | null
          is_featured: boolean | null
          is_verified: boolean | null
          lat: number | null
          length_meters: number | null
          lifeos_context: string | null
          lng: number | null
          location_name: string | null
          location_ru: string | null
          marketing_tags: string[] | null
          max_speed: string | null
          name_en: string
          name_ru: string
          price_full_day: number | null
          price_half_day: number | null
          price_overnight: number | null
          price_sunset: number | null
          provider_id: string | null
          rating: number | null
          rejection_reason: string | null
          review_count: number | null
          reviewed_at: string | null
          reviewed_by: string | null
          skipper_included: string | null
          slug: string | null
          source_urls: string[] | null
          uno_team_creator_id: string | null
          updated_at: string
          weather_dependency: string | null
          yacht_type: string | null
          year_built: number | null
        }
        Insert: {
          addons?: string[] | null
          approval_status?: string | null
          balance_due_hours?: number | null
          bathrooms?: number | null
          beam?: string | null
          booking_flow?: string | null
          cabins?: number | null
          cancellation_policy?: string | null
          capacity?: number | null
          charter_options?: string[] | null
          cover_image?: string | null
          created_at?: string
          created_by_uno_team?: boolean | null
          cruising_speed?: string | null
          currency?: string | null
          departure_times?: string[] | null
          deposit_percent?: number | null
          description_en?: string | null
          description_ru?: string | null
          draft?: string | null
          engines?: string | null
          exclusions_en?: string[] | null
          exclusions_ru?: string[] | null
          features_en?: string[] | null
          features_ru?: string[] | null
          fuel_capacity?: string | null
          fuel_policy?: string | null
          has_catering?: boolean | null
          has_crew?: boolean | null
          ical_token?: string | null
          ical_token_expires_at?: string | null
          ical_token_refreshed_at?: string | null
          id?: string
          images?: string[] | null
          insurance_included?: string | null
          insurance_notes?: string | null
          is_active?: boolean | null
          is_featured?: boolean | null
          is_verified?: boolean | null
          lat?: number | null
          length_meters?: number | null
          lifeos_context?: string | null
          lng?: number | null
          location_name?: string | null
          location_ru?: string | null
          marketing_tags?: string[] | null
          max_speed?: string | null
          name_en: string
          name_ru: string
          price_full_day?: number | null
          price_half_day?: number | null
          price_overnight?: number | null
          price_sunset?: number | null
          provider_id?: string | null
          rating?: number | null
          rejection_reason?: string | null
          review_count?: number | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          skipper_included?: string | null
          slug?: string | null
          source_urls?: string[] | null
          uno_team_creator_id?: string | null
          updated_at?: string
          weather_dependency?: string | null
          yacht_type?: string | null
          year_built?: number | null
        }
        Update: {
          addons?: string[] | null
          approval_status?: string | null
          balance_due_hours?: number | null
          bathrooms?: number | null
          beam?: string | null
          booking_flow?: string | null
          cabins?: number | null
          cancellation_policy?: string | null
          capacity?: number | null
          charter_options?: string[] | null
          cover_image?: string | null
          created_at?: string
          created_by_uno_team?: boolean | null
          cruising_speed?: string | null
          currency?: string | null
          departure_times?: string[] | null
          deposit_percent?: number | null
          description_en?: string | null
          description_ru?: string | null
          draft?: string | null
          engines?: string | null
          exclusions_en?: string[] | null
          exclusions_ru?: string[] | null
          features_en?: string[] | null
          features_ru?: string[] | null
          fuel_capacity?: string | null
          fuel_policy?: string | null
          has_catering?: boolean | null
          has_crew?: boolean | null
          ical_token?: string | null
          ical_token_expires_at?: string | null
          ical_token_refreshed_at?: string | null
          id?: string
          images?: string[] | null
          insurance_included?: string | null
          insurance_notes?: string | null
          is_active?: boolean | null
          is_featured?: boolean | null
          is_verified?: boolean | null
          lat?: number | null
          length_meters?: number | null
          lifeos_context?: string | null
          lng?: number | null
          location_name?: string | null
          location_ru?: string | null
          marketing_tags?: string[] | null
          max_speed?: string | null
          name_en?: string
          name_ru?: string
          price_full_day?: number | null
          price_half_day?: number | null
          price_overnight?: number | null
          price_sunset?: number | null
          provider_id?: string | null
          rating?: number | null
          rejection_reason?: string | null
          review_count?: number | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          skipper_included?: string | null
          slug?: string | null
          source_urls?: string[] | null
          uno_team_creator_id?: string | null
          updated_at?: string
          weather_dependency?: string | null
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
      catalog_life_map_v2: {
        Row: {
          entity_id: string | null
          entity_type: string | null
          id: string | null
          life_situation_id: string | null
          role_scope: string[] | null
          rules: Json | null
          scenario_code: string | null
          task_code: string | null
          task_type: string | null
          urgency_level: string | null
          weight: number | null
        }
        Relationships: []
      }
      experiences_normalized: {
        Row: {
          age_restriction: number | null
          approval_status: string | null
          available_days: string[] | null
          category: string | null
          category_normalized: string | null
          certification_details: string | null
          commission_rate: number | null
          cover_image: string | null
          created_at: string | null
          created_by_uno_team: boolean | null
          currency: string | null
          description_en: string | null
          description_ru: string | null
          difficulty: string | null
          difficulty_normalized: string | null
          duration_minutes: number | null
          equipment_included: boolean | null
          excludes: Json | null
          experience_type: string | null
          external_link: string | null
          highlights: Json | null
          id: string | null
          images: string[] | null
          includes: Json | null
          inferred_classification: string | null
          is_active: boolean | null
          is_certified: boolean | null
          is_featured: boolean | null
          itinerary: Json | null
          location_name: string | null
          max_participants: number | null
          meeting_point: string | null
          meeting_point_lat: number | null
          meeting_point_lng: number | null
          min_participants: number | null
          partner_id: string | null
          price: number | null
          price_per: string | null
          provider_id: string | null
          rating: number | null
          rejection_reason: string | null
          requirements: Json | null
          review_count: number | null
          reviewed_at: string | null
          reviewed_by: string | null
          safety_briefing_required: boolean | null
          source_type: string | null
          start_times: string[] | null
          tags: string[] | null
          title_en: string | null
          title_ru: string | null
          uno_team_creator_id: string | null
          updated_at: string | null
        }
        Relationships: [
          {
            foreignKeyName: "experiences_provider_id_fkey"
            columns: ["provider_id"]
            isOneToOne: false
            referencedRelation: "providers"
            referencedColumns: ["id"]
          },
        ]
      }
      life_os_catalog: {
        Row: {
          currency: string | null
          entity_id: string | null
          entity_type: string | null
          location: string | null
          price: number | null
          provider_id: string | null
          title: string | null
          title_ru: string | null
          trust_level: string | null
        }
        Relationships: []
      }
      lifeos_health_view: {
        Row: {
          entity_overuse_count: number | null
          flag_no_entities: boolean | null
          flag_no_scenarios: boolean | null
          flag_no_tasks: boolean | null
          health_score: number | null
          is_active: boolean | null
          legacy_entity_count: number | null
          new_entity_count: number | null
          orphan_scenario_count: number | null
          orphan_task_count: number | null
          scenario_count: number | null
          situation_code: string | null
          situation_id: string | null
          task_count: number | null
          title_en: string | null
          title_ru: string | null
        }
        Relationships: []
      }
      v_marketplace_listings: {
        Row: {
          amenities: string[] | null
          area_sqm: number | null
          available_from: string | null
          bathrooms: number | null
          bedrooms: number | null
          cancellation_policy: string | null
          children_friendly: boolean | null
          cover_image: string | null
          created_at: string | null
          currency: string | null
          description_en: string | null
          description_ru: string | null
          district: string | null
          floor: number | null
          furnishing_level: string | null
          highlights: string[] | null
          id: string | null
          images: string[] | null
          instant_booking: boolean | null
          is_active: boolean | null
          is_featured: boolean | null
          is_verified: boolean | null
          lat: number | null
          listing_modes: string[] | null
          listing_type: string | null
          lng: number | null
          max_guests: number | null
          min_stay_nights: number | null
          ownership_form: string | null
          parking_included: boolean | null
          pets_allowed: boolean | null
          price: number | null
          price_period: string | null
          project_id: string | null
          property_type: string | null
          provider_id: string | null
          rating: number | null
          review_count: number | null
          sale_price: number | null
          title_en: string | null
          title_ru: string | null
          unit_number: string | null
          view_type: string | null
        }
        Insert: {
          amenities?: string[] | null
          area_sqm?: number | null
          available_from?: string | null
          bathrooms?: number | null
          bedrooms?: number | null
          cancellation_policy?: string | null
          children_friendly?: boolean | null
          cover_image?: string | null
          created_at?: string | null
          currency?: string | null
          description_en?: string | null
          description_ru?: string | null
          district?: string | null
          floor?: number | null
          furnishing_level?: string | null
          highlights?: string[] | null
          id?: string | null
          images?: string[] | null
          instant_booking?: boolean | null
          is_active?: boolean | null
          is_featured?: boolean | null
          is_verified?: boolean | null
          lat?: number | null
          listing_modes?: string[] | null
          listing_type?: string | null
          lng?: number | null
          max_guests?: number | null
          min_stay_nights?: number | null
          ownership_form?: string | null
          parking_included?: boolean | null
          pets_allowed?: boolean | null
          price?: number | null
          price_period?: string | null
          project_id?: string | null
          property_type?: string | null
          provider_id?: string | null
          rating?: number | null
          review_count?: number | null
          sale_price?: number | null
          title_en?: string | null
          title_ru?: string | null
          unit_number?: string | null
          view_type?: string | null
        }
        Update: {
          amenities?: string[] | null
          area_sqm?: number | null
          available_from?: string | null
          bathrooms?: number | null
          bedrooms?: number | null
          cancellation_policy?: string | null
          children_friendly?: boolean | null
          cover_image?: string | null
          created_at?: string | null
          currency?: string | null
          description_en?: string | null
          description_ru?: string | null
          district?: string | null
          floor?: number | null
          furnishing_level?: string | null
          highlights?: string[] | null
          id?: string | null
          images?: string[] | null
          instant_booking?: boolean | null
          is_active?: boolean | null
          is_featured?: boolean | null
          is_verified?: boolean | null
          lat?: number | null
          listing_modes?: string[] | null
          listing_type?: string | null
          lng?: number | null
          max_guests?: number | null
          min_stay_nights?: number | null
          ownership_form?: string | null
          parking_included?: boolean | null
          pets_allowed?: boolean | null
          price?: number | null
          price_period?: string | null
          project_id?: string | null
          property_type?: string | null
          provider_id?: string | null
          rating?: number | null
          review_count?: number | null
          sale_price?: number | null
          title_en?: string | null
          title_ru?: string | null
          unit_number?: string | null
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
            foreignKeyName: "properties_provider_id_fkey"
            columns: ["provider_id"]
            isOneToOne: false
            referencedRelation: "providers"
            referencedColumns: ["id"]
          },
        ]
      }
      v_owner_properties: {
        Row: {
          accessibility_features: string[] | null
          acquisition_costs: number | null
          actual_owner_email: string | null
          actual_owner_name: string | null
          actual_owner_phone: string | null
          address: string | null
          amenities: string[] | null
          approval_status: string | null
          area_sqm: number | null
          available_from: string | null
          balance_due_days: number | null
          bathrooms: number | null
          bedrooms: number | null
          beds: Json | null
          building_management_contact: string | null
          building_name: string | null
          building_year: number | null
          cancellation_policy: string | null
          chanote_number: string | null
          check_in_instructions: string | null
          check_in_instructions_ru: string | null
          check_in_time: string | null
          check_out_time: string | null
          children_friendly: boolean | null
          cleaning_frequency: string | null
          cleaning_included: boolean | null
          commercial_terms_redacted: boolean | null
          commission_rate: number | null
          cover_image: string | null
          created_at: string | null
          created_by_uno_team: boolean | null
          created_on_behalf: boolean | null
          currency: string | null
          deposit_amount: number | null
          deposit_currency: string | null
          deposit_type: string | null
          description_en: string | null
          description_ru: string | null
          district: string | null
          early_checkin_price: number | null
          electricity_included: boolean | null
          electricity_meter_id: string | null
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
          ical_export_enabled: boolean | null
          ical_last_sync: string | null
          ical_token: string | null
          id: string | null
          images: string[] | null
          included_services: Json | null
          instant_booking: boolean | null
          internal_name: string | null
          internet_provider: string | null
          internet_speed: string | null
          is_active: boolean | null
          is_featured: boolean | null
          is_rented: boolean | null
          is_verified: boolean | null
          juristic_office_contact: string | null
          key_handover: string | null
          lat: number | null
          late_checkout_penalty: number | null
          late_checkout_price: number | null
          legacy_owner_property_id: string | null
          linen_change_frequency: string | null
          linen_change_price: number | null
          listing_modes: string[] | null
          listing_type: string | null
          lng: number | null
          location_id: string | null
          managed_by_org_id: string | null
          management_document_name: string | null
          management_document_url: string | null
          management_type: string | null
          manager_line_id: string | null
          manager_name: string | null
          manager_phone: string | null
          max_guests: number | null
          max_party_guests: number | null
          min_stay_nights: number | null
          monthly_discount: number | null
          mortgage_amount: number | null
          mortgage_bank: string | null
          mortgage_interest_rate: number | null
          mortgage_monthly_payment: number | null
          nearby_places: Json | null
          notes: string | null
          owner_id: string | null
          ownership_form: string | null
          ownership_transferred_at: string | null
          ownership_type: string | null
          ownership_verification_notes: string | null
          ownership_verification_status: string | null
          ownership_verified_at: string | null
          ownership_verified_by: string | null
          parking_included: boolean | null
          parking_notes: string | null
          parking_spaces: number | null
          parking_type: string | null
          parties_allowed: boolean | null
          payment_model: string | null
          pet_deposit: number | null
          pet_monthly_fee: number | null
          pet_notes: string | null
          pet_notes_ru: string | null
          pet_policy: string | null
          pets_allowed: boolean | null
          pool_size: string | null
          prepay_percent: number | null
          price: number | null
          price_per_night: number | null
          price_period: string | null
          project_id: string | null
          property_type: string | null
          provider_id: string | null
          purchase_currency: string | null
          purchase_date: string | null
          purchase_price: number | null
          quiet_hours_end: string | null
          quiet_hours_start: string | null
          rating: number | null
          rejection_reason: string | null
          renovation_costs: number | null
          rental_platform: string | null
          review_count: number | null
          reviewed_at: string | null
          reviewed_by: string | null
          rooms: Json | null
          safety_features: string[] | null
          sale_price: number | null
          seasonal_pricing: Json | null
          security_deposit_required: boolean | null
          smoking_penalty: number | null
          smoking_policy: string | null
          status: string | null
          tabien_baan: string | null
          title: string | null
          title_en: string | null
          title_ru: string | null
          total_floors: number | null
          transfer_airport_price: number | null
          transfer_available: boolean | null
          transfer_notes: string | null
          transfer_notes_ru: string | null
          unit_number: string | null
          uno_team_creator_id: string | null
          updated_at: string | null
          verified_at: string | null
          verified_by: string | null
          view_type: string | null
          water_included: boolean | null
          water_meter_id: string | null
          water_notes: string | null
          water_notes_ru: string | null
          water_unit_price: number | null
          weekly_discount: number | null
          wifi_included: boolean | null
          wifi_provider: string | null
          wifi_speed: string | null
        }
        Insert: {
          accessibility_features?: string[] | null
          acquisition_costs?: number | null
          actual_owner_email?: string | null
          actual_owner_name?: string | null
          actual_owner_phone?: string | null
          address?: string | null
          amenities?: string[] | null
          approval_status?: string | null
          area_sqm?: number | null
          available_from?: string | null
          balance_due_days?: number | null
          bathrooms?: number | null
          bedrooms?: number | null
          beds?: Json | null
          building_management_contact?: string | null
          building_name?: string | null
          building_year?: number | null
          cancellation_policy?: string | null
          chanote_number?: string | null
          check_in_instructions?: string | null
          check_in_instructions_ru?: string | null
          check_in_time?: string | null
          check_out_time?: string | null
          children_friendly?: boolean | null
          cleaning_frequency?: string | null
          cleaning_included?: boolean | null
          commercial_terms_redacted?: boolean | null
          commission_rate?: number | null
          cover_image?: string | null
          created_at?: string | null
          created_by_uno_team?: boolean | null
          created_on_behalf?: boolean | null
          currency?: string | null
          deposit_amount?: number | null
          deposit_currency?: string | null
          deposit_type?: string | null
          description_en?: string | null
          description_ru?: string | null
          district?: string | null
          early_checkin_price?: number | null
          electricity_included?: boolean | null
          electricity_meter_id?: string | null
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
          ical_export_enabled?: boolean | null
          ical_last_sync?: string | null
          ical_token?: string | null
          id?: string | null
          images?: string[] | null
          included_services?: Json | null
          instant_booking?: boolean | null
          internal_name?: string | null
          internet_provider?: string | null
          internet_speed?: string | null
          is_active?: boolean | null
          is_featured?: boolean | null
          is_rented?: boolean | null
          is_verified?: boolean | null
          juristic_office_contact?: string | null
          key_handover?: string | null
          lat?: number | null
          late_checkout_penalty?: number | null
          late_checkout_price?: number | null
          legacy_owner_property_id?: string | null
          linen_change_frequency?: string | null
          linen_change_price?: number | null
          listing_modes?: string[] | null
          listing_type?: string | null
          lng?: number | null
          location_id?: string | null
          managed_by_org_id?: string | null
          management_document_name?: string | null
          management_document_url?: string | null
          management_type?: string | null
          manager_line_id?: string | null
          manager_name?: string | null
          manager_phone?: string | null
          max_guests?: number | null
          max_party_guests?: number | null
          min_stay_nights?: number | null
          monthly_discount?: number | null
          mortgage_amount?: number | null
          mortgage_bank?: string | null
          mortgage_interest_rate?: number | null
          mortgage_monthly_payment?: number | null
          nearby_places?: Json | null
          notes?: string | null
          owner_id?: string | null
          ownership_form?: string | null
          ownership_transferred_at?: string | null
          ownership_type?: string | null
          ownership_verification_notes?: string | null
          ownership_verification_status?: string | null
          ownership_verified_at?: string | null
          ownership_verified_by?: string | null
          parking_included?: boolean | null
          parking_notes?: string | null
          parking_spaces?: number | null
          parking_type?: string | null
          parties_allowed?: boolean | null
          payment_model?: string | null
          pet_deposit?: number | null
          pet_monthly_fee?: number | null
          pet_notes?: string | null
          pet_notes_ru?: string | null
          pet_policy?: string | null
          pets_allowed?: boolean | null
          pool_size?: string | null
          prepay_percent?: number | null
          price?: number | null
          price_per_night?: number | null
          price_period?: string | null
          project_id?: string | null
          property_type?: string | null
          provider_id?: string | null
          purchase_currency?: string | null
          purchase_date?: string | null
          purchase_price?: number | null
          quiet_hours_end?: string | null
          quiet_hours_start?: string | null
          rating?: number | null
          rejection_reason?: string | null
          renovation_costs?: number | null
          rental_platform?: string | null
          review_count?: number | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          rooms?: Json | null
          safety_features?: string[] | null
          sale_price?: number | null
          seasonal_pricing?: Json | null
          security_deposit_required?: boolean | null
          smoking_penalty?: number | null
          smoking_policy?: string | null
          status?: string | null
          tabien_baan?: string | null
          title?: string | null
          title_en?: string | null
          title_ru?: string | null
          total_floors?: number | null
          transfer_airport_price?: number | null
          transfer_available?: boolean | null
          transfer_notes?: string | null
          transfer_notes_ru?: string | null
          unit_number?: string | null
          uno_team_creator_id?: string | null
          updated_at?: string | null
          verified_at?: string | null
          verified_by?: string | null
          view_type?: string | null
          water_included?: boolean | null
          water_meter_id?: string | null
          water_notes?: string | null
          water_notes_ru?: string | null
          water_unit_price?: number | null
          weekly_discount?: number | null
          wifi_included?: boolean | null
          wifi_provider?: string | null
          wifi_speed?: string | null
        }
        Update: {
          accessibility_features?: string[] | null
          acquisition_costs?: number | null
          actual_owner_email?: string | null
          actual_owner_name?: string | null
          actual_owner_phone?: string | null
          address?: string | null
          amenities?: string[] | null
          approval_status?: string | null
          area_sqm?: number | null
          available_from?: string | null
          balance_due_days?: number | null
          bathrooms?: number | null
          bedrooms?: number | null
          beds?: Json | null
          building_management_contact?: string | null
          building_name?: string | null
          building_year?: number | null
          cancellation_policy?: string | null
          chanote_number?: string | null
          check_in_instructions?: string | null
          check_in_instructions_ru?: string | null
          check_in_time?: string | null
          check_out_time?: string | null
          children_friendly?: boolean | null
          cleaning_frequency?: string | null
          cleaning_included?: boolean | null
          commercial_terms_redacted?: boolean | null
          commission_rate?: number | null
          cover_image?: string | null
          created_at?: string | null
          created_by_uno_team?: boolean | null
          created_on_behalf?: boolean | null
          currency?: string | null
          deposit_amount?: number | null
          deposit_currency?: string | null
          deposit_type?: string | null
          description_en?: string | null
          description_ru?: string | null
          district?: string | null
          early_checkin_price?: number | null
          electricity_included?: boolean | null
          electricity_meter_id?: string | null
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
          ical_export_enabled?: boolean | null
          ical_last_sync?: string | null
          ical_token?: string | null
          id?: string | null
          images?: string[] | null
          included_services?: Json | null
          instant_booking?: boolean | null
          internal_name?: string | null
          internet_provider?: string | null
          internet_speed?: string | null
          is_active?: boolean | null
          is_featured?: boolean | null
          is_rented?: boolean | null
          is_verified?: boolean | null
          juristic_office_contact?: string | null
          key_handover?: string | null
          lat?: number | null
          late_checkout_penalty?: number | null
          late_checkout_price?: number | null
          legacy_owner_property_id?: string | null
          linen_change_frequency?: string | null
          linen_change_price?: number | null
          listing_modes?: string[] | null
          listing_type?: string | null
          lng?: number | null
          location_id?: string | null
          managed_by_org_id?: string | null
          management_document_name?: string | null
          management_document_url?: string | null
          management_type?: string | null
          manager_line_id?: string | null
          manager_name?: string | null
          manager_phone?: string | null
          max_guests?: number | null
          max_party_guests?: number | null
          min_stay_nights?: number | null
          monthly_discount?: number | null
          mortgage_amount?: number | null
          mortgage_bank?: string | null
          mortgage_interest_rate?: number | null
          mortgage_monthly_payment?: number | null
          nearby_places?: Json | null
          notes?: string | null
          owner_id?: string | null
          ownership_form?: string | null
          ownership_transferred_at?: string | null
          ownership_type?: string | null
          ownership_verification_notes?: string | null
          ownership_verification_status?: string | null
          ownership_verified_at?: string | null
          ownership_verified_by?: string | null
          parking_included?: boolean | null
          parking_notes?: string | null
          parking_spaces?: number | null
          parking_type?: string | null
          parties_allowed?: boolean | null
          payment_model?: string | null
          pet_deposit?: number | null
          pet_monthly_fee?: number | null
          pet_notes?: string | null
          pet_notes_ru?: string | null
          pet_policy?: string | null
          pets_allowed?: boolean | null
          pool_size?: string | null
          prepay_percent?: number | null
          price?: number | null
          price_per_night?: number | null
          price_period?: string | null
          project_id?: string | null
          property_type?: string | null
          provider_id?: string | null
          purchase_currency?: string | null
          purchase_date?: string | null
          purchase_price?: number | null
          quiet_hours_end?: string | null
          quiet_hours_start?: string | null
          rating?: number | null
          rejection_reason?: string | null
          renovation_costs?: number | null
          rental_platform?: string | null
          review_count?: number | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          rooms?: Json | null
          safety_features?: string[] | null
          sale_price?: number | null
          seasonal_pricing?: Json | null
          security_deposit_required?: boolean | null
          smoking_penalty?: number | null
          smoking_policy?: string | null
          status?: string | null
          tabien_baan?: string | null
          title?: string | null
          title_en?: string | null
          title_ru?: string | null
          total_floors?: number | null
          transfer_airport_price?: number | null
          transfer_available?: boolean | null
          transfer_notes?: string | null
          transfer_notes_ru?: string | null
          unit_number?: string | null
          uno_team_creator_id?: string | null
          updated_at?: string | null
          verified_at?: string | null
          verified_by?: string | null
          view_type?: string | null
          water_included?: boolean | null
          water_meter_id?: string | null
          water_notes?: string | null
          water_notes_ru?: string | null
          water_unit_price?: number | null
          weekly_discount?: number | null
          wifi_included?: boolean | null
          wifi_provider?: string | null
          wifi_speed?: string | null
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
      vertical_task_coverage: {
        Row: {
          contextual_tasks: number | null
          core_tasks: number | null
          support_tasks: number | null
          task_codes: string[] | null
          task_count: number | null
          vertical_code: string | null
        }
        Relationships: []
      }
    }
    Functions: {
      add_team_points: {
        Args: {
          p_action_type: string
          p_entity_id?: string
          p_entity_type?: string
          p_metadata?: Json
          p_points: number
          p_user_id: string
        }
        Returns: number
      }
      apply_referral_code: {
        Args: { p_code: string; p_referred_id: string }
        Returns: boolean
      }
      award_achievement: {
        Args: { p_achievement_code: string; p_user_id: string }
        Returns: Json
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
      calculate_order_totals:
        | {
            Args: {
              p_base_amount: number
              p_provider_id?: string
              p_vertical?: string
            }
            Returns: Json
          }
        | {
            Args: {
              p_base_amount: number
              p_product_id?: string
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
      check_rate_limit: {
        Args: {
          p_endpoint: string
          p_identifier: string
          p_max_requests?: number
          p_window_seconds?: number
        }
        Returns: Json
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
      check_yacht_availability:
        | {
            Args: {
              p_end_date: string
              p_start_date: string
              p_yacht_id: string
            }
            Returns: boolean
          }
        | {
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
      create_order_atomic: {
        Args: {
          p_addresses?: Json
          p_currency?: string
          p_customer_user_id: string
          p_end_at?: string
          p_items?: Json
          p_metadata?: Json
          p_notes?: string
          p_order_type: string
          p_participants?: Json
          p_payment_amount?: number
          p_payment_method?: string
          p_provider_org_id?: string
          p_start_at?: string
          p_total_amount?: number
        }
        Returns: Json
      }
      credit_cashback: { Args: { p_order_id: string }; Returns: Json }
      detect_booking_conflicts: {
        Args: { p_property_id: string }
        Returns: {
          booking_id_1: string
          booking_id_2: string
          check_in_1: string
          check_in_2: string
          check_out_1: string
          check_out_2: string
          guest_name_1: string
          guest_name_2: string
          overlap_days: number
          source_1: string
          source_2: string
        }[]
      }
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
      get_all_currency_rates: { Args: never; Returns: Json }
      get_company_member_role: {
        Args: { _company_id: string; _user_id: string }
        Returns: string
      }
      get_currency_rate: {
        Args: { p_base?: string; p_target?: string }
        Returns: number
      }
      get_latest_ai_artifact: {
        Args: {
          p_artifact_type?: string
          p_entity_id: string
          p_entity_type: string
        }
        Returns: Json
      }
      get_or_create_loyalty_status: {
        Args: { p_user_id: string }
        Returns: Json
      }
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
      get_platform_fee_percent: { Args: never; Returns: number }
      get_product_commission: {
        Args: { p_product_id: string; p_vertical: string }
        Returns: number
      }
      get_property_user_role: {
        Args: { p_property_id: string; p_user_id: string }
        Returns: string
      }
      get_simulation_report: { Args: { p_run_id: string }; Returns: Json }
      get_subscription_revenue: {
        Args: { p_days?: number }
        Returns: {
          active_count: number
          monthly_count: number
          total_revenue: number
          yearly_count: number
        }[]
      }
      get_system_setting: { Args: { p_key: string }; Returns: Json }
      get_user_analytics_summary: { Args: { p_days?: number }; Returns: Json }
      get_yacht_availability: {
        Args: { p_month?: string; p_yacht_id: string }
        Returns: {
          date: string
          note: string
          price_override: number
          status: string
        }[]
      }
      get_yacht_price_for_date: {
        Args: { p_charter_type?: string; p_date: string; p_yacht_id: string }
        Returns: number
      }
      has_elevated_access: {
        Args: { p_required_roles?: string[] }
        Returns: boolean
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      has_specialization: {
        Args: { check_user_id: string; spec: string }
        Returns: boolean
      }
      increment_helpful_count: {
        Args: { review_id_param: string }
        Returns: undefined
      }
      is_admin_or_uno_team: { Args: never; Returns: boolean }
      is_assigned_manager: {
        Args: { _property_id: string; _user_id: string }
        Returns: boolean
      }
      is_company_admin: { Args: { p_company_id: string }; Returns: boolean }
      is_company_member: {
        Args: { _company_id: string; _user_id: string }
        Returns: boolean
      }
      is_mcc_admin: { Args: never; Returns: boolean }
      is_org_owner: { Args: { check_org_id: string }; Returns: boolean }
      is_property_owner: {
        Args: { _property_id: string; _user_id: string }
        Returns: boolean
      }
      is_simulation_entity: {
        Args: { p_entity_id: string; p_entity_type: string }
        Returns: boolean
      }
      is_team_member: { Args: { check_user_id: string }; Returns: boolean }
      is_verified_purchase: {
        Args: { p_item_id: string; p_item_type: string; p_user_id: string }
        Returns: boolean
      }
      link_simulation_entity: {
        Args: { p_entity_id: string; p_entity_type: string; p_run_id: string }
        Returns: undefined
      }
      log_security_event: {
        Args: {
          p_details?: Json
          p_event_type: string
          p_ip_address?: string
          p_user_agent?: string
          p_user_id?: string
        }
        Returns: string
      }
      log_simulation_event: {
        Args: {
          p_actor_role?: string
          p_duration_ms?: number
          p_entity_id?: string
          p_entity_type?: string
          p_error?: string
          p_event_type: string
          p_payload?: Json
          p_run_id: string
        }
        Returns: string
      }
      mcc_check_inactivity: { Args: never; Returns: undefined }
      mcc_derive_user_state: {
        Args: { p_event_name: string; p_landing_id?: string; p_user_id: string }
        Returns: string
      }
      mcc_transition_user_state: {
        Args: {
          p_new_state: string
          p_source_landing?: string
          p_user_id: string
          p_vertical?: string
        }
        Returns: undefined
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
      publish_property_to_marketplace: {
        Args: { p_owner_property_id: string }
        Returns: string
      }
      purge_simulation_run: { Args: { p_run_id: string }; Returns: Json }
      recalculate_user_segment: {
        Args: { p_user_id: string }
        Returns: undefined
      }
      recalculate_user_tier: { Args: { p_user_id: string }; Returns: Json }
      refund_wallet_booking: {
        Args: { p_booking_id: string; p_user_id: string }
        Returns: boolean
      }
      resolve_catalog_by_life_situation: {
        Args: { p_life_code: string; p_limit?: number }
        Returns: {
          entity_id: string
          entity_type: string
          rules: Json
          weight: number
        }[]
      }
      resolve_life_os_context: {
        Args: {
          p_life_code: string
          p_limit?: number
          p_locale?: string
          p_user_role?: string
        }
        Returns: {
          currency: string
          entity_id: string
          entity_type: string
          location: string
          price: number
          provider_id: string
          role_scope: string[]
          rules: Json
          title: string
          title_localized: string
          trust_level: string
          weight: number
        }[]
      }
      resolve_life_scenarios: {
        Args: { p_locale?: string; p_situation_code: string }
        Returns: {
          code: string
          description: string
          icon: string
          id: string
          priority: number
          task_count: number
          title: string
          urgency_level: string
        }[]
      }
      resolve_life_tasks: {
        Args: { p_locale?: string; p_scenario_code: string }
        Returns: {
          code: string
          entity_count: number
          id: string
          priority: number
          task_type: string
          title: string
        }[]
      }
      resolve_task_entities: {
        Args: {
          p_limit?: number
          p_locale?: string
          p_task_code: string
          p_user_role?: string
        }
        Returns: {
          currency: string
          entity_id: string
          entity_type: string
          location: string
          price: number
          provider_id: string
          relevance_weight: number
          role_scope: string[]
          rules: Json
          title: string
          title_localized: string
          trust_level: string
        }[]
      }
      resolve_tasks_for_vertical: {
        Args: { p_vertical_code: string }
        Returns: {
          priority_weight: number
          scenario_code: string
          situation_code: string
          task_code: string
          task_title_en: string
          task_type: string
        }[]
      }
      resolve_verticals_for_situation: {
        Args: { p_situation_code: string }
        Returns: {
          max_priority: number
          task_count: number
          tasks: string[]
          vertical_code: string
        }[]
      }
      resolve_verticals_for_task: {
        Args: { p_task_code: string }
        Returns: {
          context_notes: string
          priority_weight: number
          vertical_code: string
        }[]
      }
      rotate_ical_token: { Args: { p_property_id: string }; Returns: string }
      set_user_pin: {
        Args: { p_device_id?: string; p_pin: string; p_user_id: string }
        Returns: boolean
      }
      soft_delete_order: { Args: { p_order_id: string }; Returns: boolean }
      start_simulation_run: {
        Args: { p_config?: Json; p_label: string }
        Returns: string
      }
      topup_wallet_atomic: {
        Args: {
          p_amount: number
          p_reference_id: string
          p_reference_type: string
          p_user_id: string
        }
        Returns: Json
      }
      uno_team_can: {
        Args: { _action: string; _user_id: string; _vertical: string }
        Returns: boolean
      }
      update_realtime_stats: { Args: never; Returns: undefined }
      user_has_org_property_access: {
        Args: { org_uuid: string }
        Returns: boolean
      }
      user_has_property_delegate_access: {
        Args: { property_uuid: string }
        Returns: boolean
      }
      validate_ical_token: {
        Args: { p_property_id: string; p_token: string }
        Returns: Json
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
        | "finance"
        | "support"
        | "sales"
        | "investor"
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
      education_entity_type: "institution" | "individual"
      intent_status:
        | "pending"
        | "processing"
        | "succeeded"
        | "failed"
        | "cancelled"
        | "refunded"
      invoice_status: "draft" | "sent" | "paid" | "overdue" | "cancelled"
      invoice_type: "tenant_billing" | "owner_report" | "service_fee"
      item_condition: "new" | "like_new" | "good" | "fair" | "for_parts"
      listing_application_status:
        | "draft"
        | "pending"
        | "under_review"
        | "approved"
        | "rejected"
        | "revision_requested"
      listing_type: "property" | "service" | "product"
      marketplace_seller_type: "business" | "individual"
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
        | "pending_advance"
        | "awaiting_client_payment"
        | "checked_in"
        | "checked_out"
        | "no_show"
        | "pending_deposit"
        | "deposit_paid"
      payment_method: "cash" | "wallet" | "stripe" | "bank_transfer"
      payment_status:
        | "pending"
        | "processing"
        | "completed"
        | "failed"
        | "refunded"
        | "cancelled"
      team_specialization:
        | "content_manager"
        | "support_operator"
        | "sales_manager"
        | "moderation_officer"
        | "team_lead"
      user_persona: "tourist" | "resident" | "property_owner"
      user_type:
        | "tourist"
        | "resident"
        | "admin"
        | "uno_team"
        | "vendor"
        | "owner"
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
        "finance",
        "support",
        "sales",
        "investor",
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
      education_entity_type: ["institution", "individual"],
      intent_status: [
        "pending",
        "processing",
        "succeeded",
        "failed",
        "cancelled",
        "refunded",
      ],
      invoice_status: ["draft", "sent", "paid", "overdue", "cancelled"],
      invoice_type: ["tenant_billing", "owner_report", "service_fee"],
      item_condition: ["new", "like_new", "good", "fair", "for_parts"],
      listing_application_status: [
        "draft",
        "pending",
        "under_review",
        "approved",
        "rejected",
        "revision_requested",
      ],
      listing_type: ["property", "service", "product"],
      marketplace_seller_type: ["business", "individual"],
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
        "pending_advance",
        "awaiting_client_payment",
        "checked_in",
        "checked_out",
        "no_show",
        "pending_deposit",
        "deposit_paid",
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
      team_specialization: [
        "content_manager",
        "support_operator",
        "sales_manager",
        "moderation_officer",
        "team_lead",
      ],
      user_persona: ["tourist", "resident", "property_owner"],
      user_type: [
        "tourist",
        "resident",
        "admin",
        "uno_team",
        "vendor",
        "owner",
      ],
    },
  },
} as const
