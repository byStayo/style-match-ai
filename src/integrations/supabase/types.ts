export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      product_matches: {
        Row: {
          created_at: string
          id: string
          is_favorite: boolean | null
          match_explanation: string | null
          match_score: number
          product_image: string
          product_price: number
          product_title: string
          product_url: string
          store_name: string
          user_id: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          is_favorite?: boolean | null
          match_explanation?: string | null
          match_score: number
          product_image: string
          product_price: number
          product_title: string
          product_url: string
          store_name: string
          user_id?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          is_favorite?: boolean | null
          match_explanation?: string | null
          match_score?: number
          product_image?: string
          product_price?: number
          product_title?: string
          product_url?: string
          store_name?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "product_matches_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      products: {
        Row: {
          created_at: string | null
          id: string
          product_description: string | null
          product_image: string
          product_price: number
          product_title: string
          product_url: string
          store_name: string
          style_embedding: string | null
          style_tags: string[] | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          product_description?: string | null
          product_image: string
          product_price: number
          product_title: string
          product_url: string
          store_name: string
          style_embedding?: string | null
          style_tags?: string[] | null
        }
        Update: {
          created_at?: string | null
          id?: string
          product_description?: string | null
          product_image?: string
          product_price?: number
          product_title?: string
          product_url?: string
          store_name?: string
          style_embedding?: string | null
          style_tags?: string[] | null
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          full_name: string | null
          id: string
          openai_api_key: string | null
          preferences: Json | null
          subscription_status: string | null
          subscription_tier: string | null
          updated_at: string
          upload_count: number | null
          username: string | null
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          full_name?: string | null
          id: string
          openai_api_key?: string | null
          preferences?: Json | null
          subscription_status?: string | null
          subscription_tier?: string | null
          updated_at?: string
          upload_count?: number | null
          username?: string | null
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          full_name?: string | null
          id?: string
          openai_api_key?: string | null
          preferences?: Json | null
          subscription_status?: string | null
          subscription_tier?: string | null
          updated_at?: string
          upload_count?: number | null
          username?: string | null
        }
        Relationships: []
      }
      social_connections: {
        Row: {
          access_token: string | null
          connected_at: string | null
          id: string
          last_sync: string | null
          platform: Database["public"]["Enums"]["social_platform"]
          platform_user_id: string
          refresh_token: string | null
          user_id: string | null
        }
        Insert: {
          access_token?: string | null
          connected_at?: string | null
          id?: string
          last_sync?: string | null
          platform: Database["public"]["Enums"]["social_platform"]
          platform_user_id: string
          refresh_token?: string | null
          user_id?: string | null
        }
        Update: {
          access_token?: string | null
          connected_at?: string | null
          id?: string
          last_sync?: string | null
          platform?: Database["public"]["Enums"]["social_platform"]
          platform_user_id?: string
          refresh_token?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "social_connections_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      social_style_profiles: {
        Row: {
          created_at: string | null
          embedding: string | null
          id: string
          metadata: Json | null
          owner_user_id: string
          subject_identifier: string
        }
        Insert: {
          created_at?: string | null
          embedding?: string | null
          id?: string
          metadata?: Json | null
          owner_user_id: string
          subject_identifier: string
        }
        Update: {
          created_at?: string | null
          embedding?: string | null
          id?: string
          metadata?: Json | null
          owner_user_id?: string
          subject_identifier?: string
        }
        Relationships: [
          {
            foreignKeyName: "social_style_profiles_owner_user_id_fkey"
            columns: ["owner_user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      store_requests: {
        Row: {
          created_at: string | null
          id: string
          notes: string | null
          status: Database["public"]["Enums"]["store_request_status"]
          store_name: string
          store_url: string
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          notes?: string | null
          status?: Database["public"]["Enums"]["store_request_status"]
          store_name: string
          store_url: string
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          notes?: string | null
          status?: Database["public"]["Enums"]["store_request_status"]
          store_name?: string
          store_url?: string
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "store_requests_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      store_scrape_logs: {
        Row: {
          created_at: string | null
          error_message: string | null
          id: string
          status: string
          store_id: string | null
        }
        Insert: {
          created_at?: string | null
          error_message?: string | null
          id?: string
          status: string
          store_id?: string | null
        }
        Update: {
          created_at?: string | null
          error_message?: string | null
          id?: string
          status?: string
          store_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "store_scrape_logs_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
        ]
      }
      stores: {
        Row: {
          api_key: string | null
          created_at: string
          id: string
          integration_type: Database["public"]["Enums"]["store_type"]
          is_active: boolean | null
          is_official: boolean | null
          logo_url: string | null
          name: string
          owner_id: string | null
          url: string
        }
        Insert: {
          api_key?: string | null
          created_at?: string
          id?: string
          integration_type: Database["public"]["Enums"]["store_type"]
          is_active?: boolean | null
          is_official?: boolean | null
          logo_url?: string | null
          name: string
          owner_id?: string | null
          url: string
        }
        Update: {
          api_key?: string | null
          created_at?: string
          id?: string
          integration_type?: Database["public"]["Enums"]["store_type"]
          is_active?: boolean | null
          is_official?: boolean | null
          logo_url?: string | null
          name?: string
          owner_id?: string | null
          url?: string
        }
        Relationships: [
          {
            foreignKeyName: "stores_owner_id_fkey"
            columns: ["owner_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      style_matches: {
        Row: {
          created_at: string | null
          id: string
          is_favorite: boolean | null
          match_explanation: string | null
          match_score: number
          product_id: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          is_favorite?: boolean | null
          match_explanation?: string | null
          match_score: number
          product_id?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          is_favorite?: boolean | null
          match_explanation?: string | null
          match_score?: number
          product_id?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "style_matches_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "style_matches_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      style_uploads: {
        Row: {
          created_at: string
          embedding: string | null
          id: string
          image_type: string | null
          image_url: string
          metadata: Json | null
          upload_type: string
          user_id: string
        }
        Insert: {
          created_at?: string
          embedding?: string | null
          id?: string
          image_type?: string | null
          image_url: string
          metadata?: Json | null
          upload_type: string
          user_id: string
        }
        Update: {
          created_at?: string
          embedding?: string | null
          id?: string
          image_type?: string | null
          image_url?: string
          metadata?: Json | null
          upload_type?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "style_uploads_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      system_health: {
        Row: {
          component: string
          error_message: string | null
          id: string
          last_check: string | null
          metadata: Json | null
          status: string
        }
        Insert: {
          component: string
          error_message?: string | null
          id?: string
          last_check?: string | null
          metadata?: Json | null
          status: string
        }
        Update: {
          component?: string
          error_message?: string | null
          id?: string
          last_check?: string | null
          metadata?: Json | null
          status?: string
        }
        Relationships: []
      }
      user_store_preferences: {
        Row: {
          created_at: string
          id: string
          is_favorite: boolean | null
          store_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_favorite?: boolean | null
          store_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          is_favorite?: boolean | null
          store_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_store_preferences_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_store_preferences_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      binary_quantize:
        | {
            Args: {
              "": string
            }
            Returns: unknown
          }
        | {
            Args: {
              "": unknown
            }
            Returns: unknown
          }
      check_system_health: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      halfvec_avg: {
        Args: {
          "": number[]
        }
        Returns: unknown
      }
      halfvec_out: {
        Args: {
          "": unknown
        }
        Returns: unknown
      }
      halfvec_send: {
        Args: {
          "": unknown
        }
        Returns: string
      }
      halfvec_typmod_in: {
        Args: {
          "": unknown[]
        }
        Returns: number
      }
      hnsw_bit_support: {
        Args: {
          "": unknown
        }
        Returns: unknown
      }
      hnsw_halfvec_support: {
        Args: {
          "": unknown
        }
        Returns: unknown
      }
      hnsw_sparsevec_support: {
        Args: {
          "": unknown
        }
        Returns: unknown
      }
      hnswhandler: {
        Args: {
          "": unknown
        }
        Returns: unknown
      }
      ivfflat_bit_support: {
        Args: {
          "": unknown
        }
        Returns: unknown
      }
      ivfflat_halfvec_support: {
        Args: {
          "": unknown
        }
        Returns: unknown
      }
      ivfflathandler: {
        Args: {
          "": unknown
        }
        Returns: unknown
      }
      l2_norm:
        | {
            Args: {
              "": unknown
            }
            Returns: number
          }
        | {
            Args: {
              "": unknown
            }
            Returns: number
          }
      l2_normalize:
        | {
            Args: {
              "": string
            }
            Returns: string
          }
        | {
            Args: {
              "": unknown
            }
            Returns: unknown
          }
        | {
            Args: {
              "": unknown
            }
            Returns: unknown
          }
      match_products: {
        Args: {
          query_embedding: string
          similarity_threshold: number
          match_count: number
          store_filter: string[]
        }
        Returns: {
          id: string
          product_url: string
          product_image: string
          product_title: string
          product_price: number
          store_name: string
          similarity: number
        }[]
      }
      sparsevec_out: {
        Args: {
          "": unknown
        }
        Returns: unknown
      }
      sparsevec_send: {
        Args: {
          "": unknown
        }
        Returns: string
      }
      sparsevec_typmod_in: {
        Args: {
          "": unknown[]
        }
        Returns: number
      }
      vector_avg: {
        Args: {
          "": number[]
        }
        Returns: string
      }
      vector_dims:
        | {
            Args: {
              "": string
            }
            Returns: number
          }
        | {
            Args: {
              "": unknown
            }
            Returns: number
          }
      vector_norm: {
        Args: {
          "": string
        }
        Returns: number
      }
      vector_out: {
        Args: {
          "": string
        }
        Returns: unknown
      }
      vector_send: {
        Args: {
          "": string
        }
        Returns: string
      }
      vector_typmod_in: {
        Args: {
          "": unknown[]
        }
        Returns: number
      }
    }
    Enums: {
      social_platform: "instagram" | "facebook" | "tiktok"
      store_request_status: "pending" | "approved" | "rejected"
      store_type: "api" | "scrape"
      subscription_tier: "free" | "premium"
      upload_type: "clothing" | "selfie" | "inspiration" | "social"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type PublicSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  PublicTableNameOrOptions extends
    | keyof (PublicSchema["Tables"] & PublicSchema["Views"])
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
        Database[PublicTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
      Database[PublicTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : PublicTableNameOrOptions extends keyof (PublicSchema["Tables"] &
        PublicSchema["Views"])
    ? (PublicSchema["Tables"] &
        PublicSchema["Views"])[PublicTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  PublicTableNameOrOptions extends
    | keyof PublicSchema["Tables"]
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : PublicTableNameOrOptions extends keyof PublicSchema["Tables"]
    ? PublicSchema["Tables"][PublicTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  PublicTableNameOrOptions extends
    | keyof PublicSchema["Tables"]
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : PublicTableNameOrOptions extends keyof PublicSchema["Tables"]
    ? PublicSchema["Tables"][PublicTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  PublicEnumNameOrOptions extends
    | keyof PublicSchema["Enums"]
    | { schema: keyof Database },
  EnumName extends PublicEnumNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = PublicEnumNameOrOptions extends { schema: keyof Database }
  ? Database[PublicEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : PublicEnumNameOrOptions extends keyof PublicSchema["Enums"]
    ? PublicSchema["Enums"][PublicEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof PublicSchema["CompositeTypes"]
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof PublicSchema["CompositeTypes"]
    ? PublicSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never
