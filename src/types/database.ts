export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          email: string
          full_name: string | null
          avatar_url: string | null
          credits: number
          stripe_customer_id: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          email: string
          full_name?: string | null
          avatar_url?: string | null
          credits?: number
          stripe_customer_id?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string
          full_name?: string | null
          avatar_url?: string | null
          credits?: number
          stripe_customer_id?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      generations: {
        Row: {
          id: string
          user_id: string
          product_title: string
          product_description: string | null
          features: string[] | null
          target_audience: string | null
          brand_name: string | null
          status: 'pending' | 'analyzing' | 'generating' | 'completed' | 'failed'
          framework_data: Json | null
          selected_framework: Json | null
          image_prompts: Json | null
          color_mode: string | null
          locked_colors: string[] | null
          style_reference_path: string | null
          global_note: string | null
          credits_used: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          product_title: string
          product_description?: string | null
          features?: string[] | null
          target_audience?: string | null
          brand_name?: string | null
          status?: 'pending' | 'analyzing' | 'generating' | 'completed' | 'failed'
          framework_data?: Json | null
          selected_framework?: Json | null
          image_prompts?: Json | null
          color_mode?: string | null
          locked_colors?: string[] | null
          style_reference_path?: string | null
          global_note?: string | null
          credits_used?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          product_title?: string
          product_description?: string | null
          features?: string[] | null
          target_audience?: string | null
          brand_name?: string | null
          status?: 'pending' | 'analyzing' | 'generating' | 'completed' | 'failed'
          framework_data?: Json | null
          selected_framework?: Json | null
          image_prompts?: Json | null
          color_mode?: string | null
          locked_colors?: string[] | null
          style_reference_path?: string | null
          global_note?: string | null
          credits_used?: number
          created_at?: string
          updated_at?: string
        }
      }
      generated_images: {
        Row: {
          id: string
          generation_id: string
          image_type: 'main' | 'infographic_1' | 'infographic_2' | 'lifestyle' | 'comparison' | 'framework_preview'
          storage_path: string
          prompt_used: string | null
          version: number
          created_at: string
        }
        Insert: {
          id?: string
          generation_id: string
          image_type: 'main' | 'infographic_1' | 'infographic_2' | 'lifestyle' | 'comparison' | 'framework_preview'
          storage_path: string
          prompt_used?: string | null
          version?: number
          created_at?: string
        }
        Update: {
          id?: string
          generation_id?: string
          image_type?: 'main' | 'infographic_1' | 'infographic_2' | 'lifestyle' | 'comparison' | 'framework_preview'
          storage_path?: string
          prompt_used?: string | null
          version?: number
          created_at?: string
        }
      }
      credit_transactions: {
        Row: {
          id: string
          user_id: string
          amount: number
          type: 'purchase' | 'usage' | 'refund' | 'bonus'
          description: string | null
          stripe_payment_id: string | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          amount: number
          type: 'purchase' | 'usage' | 'refund' | 'bonus'
          description?: string | null
          stripe_payment_id?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          amount?: number
          type?: 'purchase' | 'usage' | 'refund' | 'bonus'
          description?: string | null
          stripe_payment_id?: string | null
          created_at?: string
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      generation_status: 'pending' | 'analyzing' | 'generating' | 'completed' | 'failed'
      image_type: 'main' | 'infographic_1' | 'infographic_2' | 'lifestyle' | 'comparison' | 'framework_preview'
      transaction_type: 'purchase' | 'usage' | 'refund' | 'bonus'
    }
  }
}

// Helper types
export type Profile = Database['public']['Tables']['profiles']['Row']
export type Generation = Database['public']['Tables']['generations']['Row']
export type GeneratedImage = Database['public']['Tables']['generated_images']['Row']
export type CreditTransaction = Database['public']['Tables']['credit_transactions']['Row']
