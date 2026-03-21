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
      audit_log: {
        Row: {
          action: string
          created_at: string
          detail: string | null
          id: string
          level: string
          organisation_id: string | null
          user_id: string | null
        }
        Insert: {
          action: string
          created_at?: string
          detail?: string | null
          id?: string
          level?: string
          organisation_id?: string | null
          user_id?: string | null
        }
        Update: {
          action?: string
          created_at?: string
          detail?: string | null
          id?: string
          level?: string
          organisation_id?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "audit_log_organisation_id_fkey"
            columns: ["organisation_id"]
            isOneToOne: false
            referencedRelation: "organisations"
            referencedColumns: ["id"]
          },
        ]
      }
      campaign_contacts: {
        Row: {
          campaign_id: string
          clicked_at: string | null
          company_name: string | null
          created_at: string
          email: string
          error_message: string | null
          first_name: string | null
          id: string
          last_name: string | null
          opened_at: string | null
          sent_at: string | null
          status: string
        }
        Insert: {
          campaign_id: string
          clicked_at?: string | null
          company_name?: string | null
          created_at?: string
          email: string
          error_message?: string | null
          first_name?: string | null
          id?: string
          last_name?: string | null
          opened_at?: string | null
          sent_at?: string | null
          status?: string
        }
        Update: {
          campaign_id?: string
          clicked_at?: string | null
          company_name?: string | null
          created_at?: string
          email?: string
          error_message?: string | null
          first_name?: string | null
          id?: string
          last_name?: string | null
          opened_at?: string | null
          sent_at?: string | null
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "campaign_contacts_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "campaigns"
            referencedColumns: ["id"]
          },
        ]
      }
      campaigns: {
        Row: {
          attachment_url: string | null
          body_html: string
          body_text: string
          bounce_count: number
          click_count: number
          contacts_processed: number
          created_at: string
          created_by: string | null
          id: string
          last_batch_at: string | null
          name: string
          open_count: number
          sent_count: number
          sequence_id: string | null
          status: string
          subject: string
          total_contacts: number
          unsub_count: number
        }
        Insert: {
          attachment_url?: string | null
          body_html?: string
          body_text?: string
          bounce_count?: number
          click_count?: number
          contacts_processed?: number
          created_at?: string
          created_by?: string | null
          id?: string
          last_batch_at?: string | null
          name: string
          open_count?: number
          sent_count?: number
          sequence_id?: string | null
          status?: string
          subject?: string
          total_contacts?: number
          unsub_count?: number
        }
        Update: {
          attachment_url?: string | null
          body_html?: string
          body_text?: string
          bounce_count?: number
          click_count?: number
          contacts_processed?: number
          created_at?: string
          created_by?: string | null
          id?: string
          last_batch_at?: string | null
          name?: string
          open_count?: number
          sent_count?: number
          sequence_id?: string | null
          status?: string
          subject?: string
          total_contacts?: number
          unsub_count?: number
        }
        Relationships: []
      }
      clients: {
        Row: {
          created_at: string
          email: string | null
          id: string
          name: string
          organisation_id: string
          phone: string | null
          reminders_paused: boolean
          updated_at: string
        }
        Insert: {
          created_at?: string
          email?: string | null
          id?: string
          name: string
          organisation_id: string
          phone?: string | null
          reminders_paused?: boolean
          updated_at?: string
        }
        Update: {
          created_at?: string
          email?: string | null
          id?: string
          name?: string
          organisation_id?: string
          phone?: string | null
          reminders_paused?: boolean
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "clients_organisation_id_fkey"
            columns: ["organisation_id"]
            isOneToOne: false
            referencedRelation: "organisations"
            referencedColumns: ["id"]
          },
        ]
      }
      gmail_oauth_states: {
        Row: {
          created_at: string
          id: string
          state_token: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          state_token: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          state_token?: string
          user_id?: string
        }
        Relationships: []
      }
      invoices: {
        Row: {
          amount: number
          client_id: string | null
          created_at: string
          currency: string
          due_date: string | null
          id: string
          invoice_number: string | null
          issue_date: string | null
          organisation_id: string
          payment_url: string | null
          status: Database["public"]["Enums"]["invoice_status"]
          updated_at: string
          xero_invoice_id: string | null
        }
        Insert: {
          amount?: number
          client_id?: string | null
          created_at?: string
          currency?: string
          due_date?: string | null
          id?: string
          invoice_number?: string | null
          issue_date?: string | null
          organisation_id: string
          payment_url?: string | null
          status?: Database["public"]["Enums"]["invoice_status"]
          updated_at?: string
          xero_invoice_id?: string | null
        }
        Update: {
          amount?: number
          client_id?: string | null
          created_at?: string
          currency?: string
          due_date?: string | null
          id?: string
          invoice_number?: string | null
          issue_date?: string | null
          organisation_id?: string
          payment_url?: string | null
          status?: Database["public"]["Enums"]["invoice_status"]
          updated_at?: string
          xero_invoice_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "invoices_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invoices_organisation_id_fkey"
            columns: ["organisation_id"]
            isOneToOne: false
            referencedRelation: "organisations"
            referencedColumns: ["id"]
          },
        ]
      }
      notification_preferences: {
        Row: {
          client_no_contact_info: boolean
          created_at: string
          email_opened: boolean
          id: string
          integration_issues: boolean
          invoice_paid: boolean
          new_invoice_synced: boolean
          plan_limits: boolean
          reminder_digest: boolean
          reminder_failed: boolean
          reminder_sent: boolean
          updated_at: string
          user_id: string
        }
        Insert: {
          client_no_contact_info?: boolean
          created_at?: string
          email_opened?: boolean
          id?: string
          integration_issues?: boolean
          invoice_paid?: boolean
          new_invoice_synced?: boolean
          plan_limits?: boolean
          reminder_digest?: boolean
          reminder_failed?: boolean
          reminder_sent?: boolean
          updated_at?: string
          user_id: string
        }
        Update: {
          client_no_contact_info?: boolean
          created_at?: string
          email_opened?: boolean
          id?: string
          integration_issues?: boolean
          invoice_paid?: boolean
          new_invoice_synced?: boolean
          plan_limits?: boolean
          reminder_digest?: boolean
          reminder_failed?: boolean
          reminder_sent?: boolean
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      organisations: {
        Row: {
          company_name: string
          country_code: string | null
          created_at: string
          default_currency: string
          default_phone_prefix: string | null
          gmail_access_token: string | null
          gmail_email: string | null
          gmail_refresh_token: string | null
          gmail_token_expiry: string | null
          id: string
          logo_url: string | null
          timezone: string
          updated_at: string
          user_id: string
          xero_access_token: string | null
          xero_refresh_token: string | null
          xero_tenant_id: string | null
          xero_token_expiry: string | null
        }
        Insert: {
          company_name: string
          country_code?: string | null
          created_at?: string
          default_currency?: string
          default_phone_prefix?: string | null
          gmail_access_token?: string | null
          gmail_email?: string | null
          gmail_refresh_token?: string | null
          gmail_token_expiry?: string | null
          id?: string
          logo_url?: string | null
          timezone?: string
          updated_at?: string
          user_id: string
          xero_access_token?: string | null
          xero_refresh_token?: string | null
          xero_tenant_id?: string | null
          xero_token_expiry?: string | null
        }
        Update: {
          company_name?: string
          country_code?: string | null
          created_at?: string
          default_currency?: string
          default_phone_prefix?: string | null
          gmail_access_token?: string | null
          gmail_email?: string | null
          gmail_refresh_token?: string | null
          gmail_token_expiry?: string | null
          id?: string
          logo_url?: string | null
          timezone?: string
          updated_at?: string
          user_id?: string
          xero_access_token?: string | null
          xero_refresh_token?: string | null
          xero_tenant_id?: string | null
          xero_token_expiry?: string | null
        }
        Relationships: []
      }
      page_views: {
        Row: {
          country: string | null
          created_at: string
          id: string
          path: string
          referrer: string | null
          source: string | null
          user_agent: string | null
          visitor_id: string
        }
        Insert: {
          country?: string | null
          created_at?: string
          id?: string
          path: string
          referrer?: string | null
          source?: string | null
          user_agent?: string | null
          visitor_id: string
        }
        Update: {
          country?: string | null
          created_at?: string
          id?: string
          path?: string
          referrer?: string | null
          source?: string | null
          user_agent?: string | null
          visitor_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          created_at: string
          email: string
          full_name: string | null
          id: string
          stripe_customer_id: string | null
          subscription_end: string | null
          subscription_status: Database["public"]["Enums"]["subscription_status"]
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          email: string
          full_name?: string | null
          id?: string
          stripe_customer_id?: string | null
          subscription_end?: string | null
          subscription_status?: Database["public"]["Enums"]["subscription_status"]
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          email?: string
          full_name?: string | null
          id?: string
          stripe_customer_id?: string | null
          subscription_end?: string | null
          subscription_status?: Database["public"]["Enums"]["subscription_status"]
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      reminder_rules: {
        Row: {
          created_at: string
          days_after_due: number
          id: string
          is_active: boolean
          message_template: string
          method: Database["public"]["Enums"]["reminder_method"]
          organisation_id: string
          subject_line: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          days_after_due: number
          id?: string
          is_active?: boolean
          message_template?: string
          method?: Database["public"]["Enums"]["reminder_method"]
          organisation_id: string
          subject_line?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          days_after_due?: number
          id?: string
          is_active?: boolean
          message_template?: string
          method?: Database["public"]["Enums"]["reminder_method"]
          organisation_id?: string
          subject_line?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "reminder_rules_organisation_id_fkey"
            columns: ["organisation_id"]
            isOneToOne: false
            referencedRelation: "organisations"
            referencedColumns: ["id"]
          },
        ]
      }
      reminders: {
        Row: {
          created_at: string
          id: string
          invoice_id: string
          method: Database["public"]["Enums"]["reminder_method"]
          opened_at: string | null
          reminder_number: number
          sent_at: string
          status: string
        }
        Insert: {
          created_at?: string
          id?: string
          invoice_id: string
          method: Database["public"]["Enums"]["reminder_method"]
          opened_at?: string | null
          reminder_number?: number
          sent_at?: string
          status?: string
        }
        Update: {
          created_at?: string
          id?: string
          invoice_id?: string
          method?: Database["public"]["Enums"]["reminder_method"]
          opened_at?: string | null
          reminder_number?: number
          sent_at?: string
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "reminders_invoice_id_fkey"
            columns: ["invoice_id"]
            isOneToOne: false
            referencedRelation: "invoices"
            referencedColumns: ["id"]
          },
        ]
      }
      unsubscribes: {
        Row: {
          campaign_id: string | null
          email: string
          id: string
          unsubscribed_at: string
        }
        Insert: {
          campaign_id?: string | null
          email: string
          id?: string
          unsubscribed_at?: string
        }
        Update: {
          campaign_id?: string | null
          email?: string
          id?: string
          unsubscribed_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "unsubscribes_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "campaigns"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      xero_oauth_states: {
        Row: {
          created_at: string
          id: string
          state_token: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          state_token: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          state_token?: string
          user_id?: string
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
      invoke_edge_function: { Args: { function_name: string }; Returns: number }
    }
    Enums: {
      app_role: "admin" | "user"
      invoice_status: "draft" | "sent" | "overdue" | "paid" | "voided"
      reminder_method: "sms" | "email"
      subscription_status: "free" | "active" | "past_due" | "cancelled"
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
      app_role: ["admin", "user"],
      invoice_status: ["draft", "sent", "overdue", "paid", "voided"],
      reminder_method: ["sms", "email"],
      subscription_status: ["free", "active", "past_due", "cancelled"],
    },
  },
} as const
