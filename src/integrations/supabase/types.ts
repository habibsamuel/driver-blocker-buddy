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
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      driver_documents: {
        Row: {
          document_type: Database["public"]["Enums"]["driver_document_type"]
          driver_id: string
          file_url: string
          id: string
          rejection_reason: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          status: Database["public"]["Enums"]["driver_document_status"]
          uploaded_at: string
        }
        Insert: {
          document_type: Database["public"]["Enums"]["driver_document_type"]
          driver_id: string
          file_url: string
          id?: string
          rejection_reason?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: Database["public"]["Enums"]["driver_document_status"]
          uploaded_at?: string
        }
        Update: {
          document_type?: Database["public"]["Enums"]["driver_document_type"]
          driver_id?: string
          file_url?: string
          id?: string
          rejection_reason?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: Database["public"]["Enums"]["driver_document_status"]
          uploaded_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "driver_documents_driver_id_fkey"
            columns: ["driver_id"]
            isOneToOne: false
            referencedRelation: "drivers"
            referencedColumns: ["user_id"]
          },
        ]
      }
      driver_positions: {
        Row: {
          driver_id: string
          heading: number | null
          is_online: boolean
          lat: number
          lng: number
          updated_at: string
        }
        Insert: {
          driver_id: string
          heading?: number | null
          is_online?: boolean
          lat: number
          lng: number
          updated_at?: string
        }
        Update: {
          driver_id?: string
          heading?: number | null
          is_online?: boolean
          lat?: number
          lng?: number
          updated_at?: string
        }
        Relationships: []
      }
      driver_ratings: {
        Row: {
          client_id: string
          comment: string | null
          created_at: string
          driver_id: string
          id: string
          stars: number
        }
        Insert: {
          client_id?: string
          comment?: string | null
          created_at?: string
          driver_id: string
          id?: string
          stars: number
        }
        Update: {
          client_id?: string
          comment?: string | null
          created_at?: string
          driver_id?: string
          id?: string
          stars?: number
        }
        Relationships: []
      }
      driver_subscriptions: {
        Row: {
          created_at: string
          driver_id: string
          end_date: string
          id: string
          plan_id: string
          start_date: string
          status: Database["public"]["Enums"]["driver_subscription_status"]
          updated_at: string
        }
        Insert: {
          created_at?: string
          driver_id: string
          end_date: string
          id?: string
          plan_id: string
          start_date?: string
          status?: Database["public"]["Enums"]["driver_subscription_status"]
          updated_at?: string
        }
        Update: {
          created_at?: string
          driver_id?: string
          end_date?: string
          id?: string
          plan_id?: string
          start_date?: string
          status?: Database["public"]["Enums"]["driver_subscription_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "driver_subscriptions_plan_id_fkey"
            columns: ["plan_id"]
            isOneToOne: false
            referencedRelation: "subscription_plans"
            referencedColumns: ["id"]
          },
        ]
      }
      drivers: {
        Row: {
          access_pin_hash: string | null
          blocked: boolean
          created_at: string
          free_rides_remaining: number
          is_online: boolean
          name: string
          phone: string
          plate: string
          rating: number
          review_count: number
          subscription_status: Database["public"]["Enums"]["driver_sub_state"]
          updated_at: string
          user_id: string
          vehicle: string
          vehicle_class: Database["public"]["Enums"]["driver_vehicle_class"]
          verification_status: Database["public"]["Enums"]["driver_verification_status"]
          zone: string
        }
        Insert: {
          access_pin_hash?: string | null
          blocked?: boolean
          created_at?: string
          free_rides_remaining?: number
          is_online?: boolean
          name?: string
          phone?: string
          plate?: string
          rating?: number
          review_count?: number
          subscription_status?: Database["public"]["Enums"]["driver_sub_state"]
          updated_at?: string
          user_id: string
          vehicle?: string
          vehicle_class?: Database["public"]["Enums"]["driver_vehicle_class"]
          verification_status?: Database["public"]["Enums"]["driver_verification_status"]
          zone?: string
        }
        Update: {
          access_pin_hash?: string | null
          blocked?: boolean
          created_at?: string
          free_rides_remaining?: number
          is_online?: boolean
          name?: string
          phone?: string
          plate?: string
          rating?: number
          review_count?: number
          subscription_status?: Database["public"]["Enums"]["driver_sub_state"]
          updated_at?: string
          user_id?: string
          vehicle?: string
          vehicle_class?: Database["public"]["Enums"]["driver_vehicle_class"]
          verification_status?: Database["public"]["Enums"]["driver_verification_status"]
          zone?: string
        }
        Relationships: []
      }
      payment_settings: {
        Row: {
          created_at: string
          id: string
          instructions: string
          orange_money_number: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          instructions?: string
          orange_money_number: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          instructions?: string
          orange_money_number?: string
          updated_at?: string
        }
        Relationships: []
      }
      pricing_rules: {
        Row: {
          id: string
          minimum_fare: number
          price_per_km: number
          price_per_min: number
          updated_at: string
          vehicle_category: Database["public"]["Enums"]["pricing_vehicle_category"]
        }
        Insert: {
          id?: string
          minimum_fare: number
          price_per_km: number
          price_per_min: number
          updated_at?: string
          vehicle_category: Database["public"]["Enums"]["pricing_vehicle_category"]
        }
        Update: {
          id?: string
          minimum_fare?: number
          price_per_km?: number
          price_per_min?: number
          updated_at?: string
          vehicle_category?: Database["public"]["Enums"]["pricing_vehicle_category"]
        }
        Relationships: []
      }
      profiles: {
        Row: {
          created_at: string
          name: string
          phone: string
          quartier: string
          referral_code: string | null
          referral_credit: number
          referred_by: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          name?: string
          phone?: string
          quartier?: string
          referral_code?: string | null
          referral_credit?: number
          referred_by?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          name?: string
          phone?: string
          quartier?: string
          referral_code?: string | null
          referral_credit?: number
          referred_by?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      referrals: {
        Row: {
          code_used: string
          created_at: string
          id: string
          referee_id: string
          referrer_id: string
          reward_amount: number
        }
        Insert: {
          code_used: string
          created_at?: string
          id?: string
          referee_id: string
          referrer_id: string
          reward_amount?: number
        }
        Update: {
          code_used?: string
          created_at?: string
          id?: string
          referee_id?: string
          referrer_id?: string
          reward_amount?: number
        }
        Relationships: []
      }
      ride_request_offers: {
        Row: {
          created_at: string
          distance_km: number
          driver_id: string
          request_id: string
          responded_at: string | null
          status: Database["public"]["Enums"]["ride_offer_status"]
        }
        Insert: {
          created_at?: string
          distance_km?: number
          driver_id: string
          request_id: string
          responded_at?: string | null
          status?: Database["public"]["Enums"]["ride_offer_status"]
        }
        Update: {
          created_at?: string
          distance_km?: number
          driver_id?: string
          request_id?: string
          responded_at?: string | null
          status?: Database["public"]["Enums"]["ride_offer_status"]
        }
        Relationships: [
          {
            foreignKeyName: "ride_request_offers_request_id_fkey"
            columns: ["request_id"]
            isOneToOne: false
            referencedRelation: "ride_requests"
            referencedColumns: ["id"]
          },
        ]
      }
      ride_requests: {
        Row: {
          accepted_at: string | null
          client_id: string
          client_name: string
          client_phone: string
          created_at: string
          destination: string
          distance_km: number
          driver_id: string | null
          duration_min: number
          expires_at: string
          fare: number
          id: string
          origin_lat: number
          origin_lng: number
          status: Database["public"]["Enums"]["ride_request_status"]
          vehicle_class: Database["public"]["Enums"]["driver_vehicle_class"]
        }
        Insert: {
          accepted_at?: string | null
          client_id?: string
          client_name?: string
          client_phone?: string
          created_at?: string
          destination: string
          distance_km?: number
          driver_id?: string | null
          duration_min?: number
          expires_at?: string
          fare?: number
          id?: string
          origin_lat: number
          origin_lng: number
          status?: Database["public"]["Enums"]["ride_request_status"]
          vehicle_class?: Database["public"]["Enums"]["driver_vehicle_class"]
        }
        Update: {
          accepted_at?: string | null
          client_id?: string
          client_name?: string
          client_phone?: string
          created_at?: string
          destination?: string
          distance_km?: number
          driver_id?: string | null
          duration_min?: number
          expires_at?: string
          fare?: number
          id?: string
          origin_lat?: number
          origin_lng?: number
          status?: Database["public"]["Enums"]["ride_request_status"]
          vehicle_class?: Database["public"]["Enums"]["driver_vehicle_class"]
        }
        Relationships: []
      }
      subscription_payments: {
        Row: {
          amount_xaf: number
          created_at: string
          driver_id: string
          id: string
          payment_method: string
          plan_id: string
          proof_screenshot_url: string | null
          status: Database["public"]["Enums"]["subscription_payment_status"]
          submitted_at: string
          transaction_reference: string
          updated_at: string
          verified_at: string | null
          verified_by: string | null
        }
        Insert: {
          amount_xaf: number
          created_at?: string
          driver_id: string
          id?: string
          payment_method?: string
          plan_id: string
          proof_screenshot_url?: string | null
          status?: Database["public"]["Enums"]["subscription_payment_status"]
          submitted_at?: string
          transaction_reference: string
          updated_at?: string
          verified_at?: string | null
          verified_by?: string | null
        }
        Update: {
          amount_xaf?: number
          created_at?: string
          driver_id?: string
          id?: string
          payment_method?: string
          plan_id?: string
          proof_screenshot_url?: string | null
          status?: Database["public"]["Enums"]["subscription_payment_status"]
          submitted_at?: string
          transaction_reference?: string
          updated_at?: string
          verified_at?: string | null
          verified_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "subscription_payments_plan_id_fkey"
            columns: ["plan_id"]
            isOneToOne: false
            referencedRelation: "subscription_plans"
            referencedColumns: ["id"]
          },
        ]
      }
      subscription_plans: {
        Row: {
          active: boolean
          created_at: string
          description: string
          duration_days: number
          id: string
          name: string
          price_xaf: number
          updated_at: string
        }
        Insert: {
          active?: boolean
          created_at?: string
          description?: string
          duration_days?: number
          id?: string
          name: string
          price_xaf: number
          updated_at?: string
        }
        Update: {
          active?: boolean
          created_at?: string
          description?: string
          duration_days?: number
          id?: string
          name?: string
          price_xaf?: number
          updated_at?: string
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
          role: Database["public"]["Enums"]["app_role"]
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
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      approve_subscription_payment: {
        Args: { _payment_id: string }
        Returns: string
      }
      consume_free_ride: { Args: { _driver_id: string }; Returns: number }
      dispatch_ride_request: { Args: { _request_id: string }; Returns: number }
      expire_driver_subscriptions: { Args: never; Returns: undefined }
      generate_referral_code: { Args: never; Returns: string }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      referral_code_exists: { Args: { _code: string }; Returns: boolean }
      reject_subscription_payment: {
        Args: { _payment_id: string }
        Returns: undefined
      }
      respond_ride_request: {
        Args: { _accept: boolean; _request_id: string }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "chauffeur" | "client"
      driver_document_status: "en_attente" | "approuve" | "rejete"
      driver_document_type:
        | "cni"
        | "permis_conduire"
        | "carte_grise"
        | "assurance"
        | "photo_vehicule"
      driver_sub_state: "essai_gratuit" | "active" | "expiree"
      driver_subscription_status:
        | "active"
        | "expiree"
        | "en_attente_verification"
      driver_vehicle_class: "moto" | "eco" | "confort"
      driver_verification_status:
        | "incomplet"
        | "en_attente"
        | "verifie"
        | "rejete"
      pricing_vehicle_category: "bend_skin" | "eco" | "confort"
      ride_offer_status: "ringing" | "accepted" | "declined" | "expired"
      ride_request_status: "searching" | "accepted" | "expired" | "cancelled"
      subscription_payment_status: "en_attente" | "approuve" | "rejete"
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
      app_role: ["admin", "chauffeur", "client"],
      driver_document_status: ["en_attente", "approuve", "rejete"],
      driver_document_type: [
        "cni",
        "permis_conduire",
        "carte_grise",
        "assurance",
        "photo_vehicule",
      ],
      driver_sub_state: ["essai_gratuit", "active", "expiree"],
      driver_subscription_status: [
        "active",
        "expiree",
        "en_attente_verification",
      ],
      driver_vehicle_class: ["moto", "eco", "confort"],
      driver_verification_status: [
        "incomplet",
        "en_attente",
        "verifie",
        "rejete",
      ],
      pricing_vehicle_category: ["bend_skin", "eco", "confort"],
      ride_offer_status: ["ringing", "accepted", "declined", "expired"],
      ride_request_status: ["searching", "accepted", "expired", "cancelled"],
      subscription_payment_status: ["en_attente", "approuve", "rejete"],
    },
  },
} as const
