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
      categories: {
        Row: {
          created_at: string
          icon: string | null
          id: string
          is_active: boolean | null
          mini_app_type: string | null
          name_en: string
          name_ru: string
          parent_id: string | null
          slug: string
          sort_order: number | null
        }
        Insert: {
          created_at?: string
          icon?: string | null
          id?: string
          is_active?: boolean | null
          mini_app_type?: string | null
          name_en: string
          name_ru: string
          parent_id?: string | null
          slug: string
          sort_order?: number | null
        }
        Update: {
          created_at?: string
          icon?: string | null
          id?: string
          is_active?: boolean | null
          mini_app_type?: string | null
          name_en?: string
          name_ru?: string
          parent_id?: string | null
          slug?: string
          sort_order?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "categories_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
        ]
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
      providers: {
        Row: {
          cover_image: string | null
          created_at: string
          description_en: string | null
          description_ru: string | null
          email: string | null
          id: string
          is_active: boolean | null
          is_verified: boolean | null
          logo_url: string | null
          name: string
          phone: string | null
          trust_score: number | null
          updated_at: string
          user_id: string | null
          website: string | null
        }
        Insert: {
          cover_image?: string | null
          created_at?: string
          description_en?: string | null
          description_ru?: string | null
          email?: string | null
          id?: string
          is_active?: boolean | null
          is_verified?: boolean | null
          logo_url?: string | null
          name: string
          phone?: string | null
          trust_score?: number | null
          updated_at?: string
          user_id?: string | null
          website?: string | null
        }
        Update: {
          cover_image?: string | null
          created_at?: string
          description_en?: string | null
          description_ru?: string | null
          email?: string | null
          id?: string
          is_active?: boolean | null
          is_verified?: boolean | null
          logo_url?: string | null
          name?: string
          phone?: string | null
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
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
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
