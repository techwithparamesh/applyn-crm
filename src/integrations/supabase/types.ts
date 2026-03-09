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
    PostgrestVersion: "14.4"
  }
  public: {
    Tables: {
      api_keys: {
        Row: {
          api_key: string
          created_at: string
          id: string
          is_active: boolean
          key_name: string
          last_used_at: string | null
          tenant_id: string
        }
        Insert: {
          api_key?: string
          created_at?: string
          id?: string
          is_active?: boolean
          key_name: string
          last_used_at?: string | null
          tenant_id?: string
        }
        Update: {
          api_key?: string
          created_at?: string
          id?: string
          is_active?: boolean
          key_name?: string
          last_used_at?: string | null
          tenant_id?: string
        }
        Relationships: []
      }
      automation_actions: {
        Row: {
          action_config: Json
          action_type: string
          automation_id: string
          created_at: string
          id: string
          sort_order: number
        }
        Insert: {
          action_config?: Json
          action_type: string
          automation_id: string
          created_at?: string
          id?: string
          sort_order?: number
        }
        Update: {
          action_config?: Json
          action_type?: string
          automation_id?: string
          created_at?: string
          id?: string
          sort_order?: number
        }
        Relationships: [
          {
            foreignKeyName: "automation_actions_automation_id_fkey"
            columns: ["automation_id"]
            isOneToOne: false
            referencedRelation: "automations"
            referencedColumns: ["id"]
          },
        ]
      }
      automation_conditions: {
        Row: {
          automation_id: string
          created_at: string
          field_name: string
          id: string
          operator: string
          sort_order: number
          value: string
        }
        Insert: {
          automation_id: string
          created_at?: string
          field_name: string
          id?: string
          operator?: string
          sort_order?: number
          value?: string
        }
        Update: {
          automation_id?: string
          created_at?: string
          field_name?: string
          id?: string
          operator?: string
          sort_order?: number
          value?: string
        }
        Relationships: [
          {
            foreignKeyName: "automation_conditions_automation_id_fkey"
            columns: ["automation_id"]
            isOneToOne: false
            referencedRelation: "automations"
            referencedColumns: ["id"]
          },
        ]
      }
      automation_logs: {
        Row: {
          automation_id: string
          created_at: string
          details: Json
          id: string
          record_id: string | null
          status: string
          tenant_id: string
        }
        Insert: {
          automation_id: string
          created_at?: string
          details?: Json
          id?: string
          record_id?: string | null
          status?: string
          tenant_id?: string
        }
        Update: {
          automation_id?: string
          created_at?: string
          details?: Json
          id?: string
          record_id?: string | null
          status?: string
          tenant_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "automation_logs_automation_id_fkey"
            columns: ["automation_id"]
            isOneToOne: false
            referencedRelation: "automations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "automation_logs_record_id_fkey"
            columns: ["record_id"]
            isOneToOne: false
            referencedRelation: "crm_records"
            referencedColumns: ["id"]
          },
        ]
      }
      automations: {
        Row: {
          created_at: string
          id: string
          is_active: boolean
          module_id: string
          name: string
          tenant_id: string
          trigger_event: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_active?: boolean
          module_id: string
          name: string
          tenant_id?: string
          trigger_event?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          is_active?: boolean
          module_id?: string
          name?: string
          tenant_id?: string
          trigger_event?: string
          updated_at?: string
        }
        Relationships: []
      }
      crm_records: {
        Row: {
          created_at: string
          created_by: string
          deleted_at: string | null
          id: string
          module_id: string
          tenant_id: string
          updated_at: string
          values: Json
        }
        Insert: {
          created_at?: string
          created_by?: string
          deleted_at?: string | null
          id?: string
          module_id: string
          tenant_id?: string
          updated_at?: string
          values?: Json
        }
        Update: {
          created_at?: string
          created_by?: string
          deleted_at?: string | null
          id?: string
          module_id?: string
          tenant_id?: string
          updated_at?: string
          values?: Json
        }
        Relationships: []
      }
      dashboard_widgets: {
        Row: {
          col_span: number
          config_json: Json
          created_at: string
          dashboard_id: string
          id: string
          order_index: number
          widget_type: string
        }
        Insert: {
          col_span?: number
          config_json?: Json
          created_at?: string
          dashboard_id: string
          id?: string
          order_index?: number
          widget_type?: string
        }
        Update: {
          col_span?: number
          config_json?: Json
          created_at?: string
          dashboard_id?: string
          id?: string
          order_index?: number
          widget_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "dashboard_widgets_dashboard_id_fkey"
            columns: ["dashboard_id"]
            isOneToOne: false
            referencedRelation: "dashboards"
            referencedColumns: ["id"]
          },
        ]
      }
      dashboards: {
        Row: {
          created_at: string
          id: string
          name: string
          tenant_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
          tenant_id?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          tenant_id?: string
          updated_at?: string
        }
        Relationships: []
      }
      email_accounts: {
        Row: {
          access_token: string | null
          created_at: string
          email_address: string
          id: string
          is_active: boolean
          last_sync_at: string | null
          provider: string
          refresh_token: string | null
          tenant_id: string
          token_expiry: string | null
          user_id: string
        }
        Insert: {
          access_token?: string | null
          created_at?: string
          email_address: string
          id?: string
          is_active?: boolean
          last_sync_at?: string | null
          provider: string
          refresh_token?: string | null
          tenant_id?: string
          token_expiry?: string | null
          user_id: string
        }
        Update: {
          access_token?: string | null
          created_at?: string
          email_address?: string
          id?: string
          is_active?: boolean
          last_sync_at?: string | null
          provider?: string
          refresh_token?: string | null
          tenant_id?: string
          token_expiry?: string | null
          user_id?: string
        }
        Relationships: []
      }
      email_attachments: {
        Row: {
          content_type: string | null
          created_at: string
          email_id: string
          file_name: string
          file_url: string | null
          id: string
          size: number
        }
        Insert: {
          content_type?: string | null
          created_at?: string
          email_id: string
          file_name: string
          file_url?: string | null
          id?: string
          size?: number
        }
        Update: {
          content_type?: string | null
          created_at?: string
          email_id?: string
          file_name?: string
          file_url?: string | null
          id?: string
          size?: number
        }
        Relationships: [
          {
            foreignKeyName: "email_attachments_email_id_fkey"
            columns: ["email_id"]
            isOneToOne: false
            referencedRelation: "emails"
            referencedColumns: ["id"]
          },
        ]
      }
      email_record_links: {
        Row: {
          created_at: string
          email_id: string
          id: string
          module_name: string
          record_id: string
        }
        Insert: {
          created_at?: string
          email_id: string
          id?: string
          module_name: string
          record_id: string
        }
        Update: {
          created_at?: string
          email_id?: string
          id?: string
          module_name?: string
          record_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "email_record_links_email_id_fkey"
            columns: ["email_id"]
            isOneToOne: false
            referencedRelation: "emails"
            referencedColumns: ["id"]
          },
        ]
      }
      emails: {
        Row: {
          account_id: string
          bcc_emails: Json
          body_html: string | null
          body_text: string | null
          cc_emails: Json
          direction: string
          from_email: string
          id: string
          is_opened: boolean
          is_read: boolean
          is_starred: boolean
          opened_at: string | null
          provider_message_id: string | null
          sent_at: string
          subject: string
          synced_at: string
          tenant_id: string
          thread_id: string | null
          to_emails: Json
        }
        Insert: {
          account_id: string
          bcc_emails?: Json
          body_html?: string | null
          body_text?: string | null
          cc_emails?: Json
          direction?: string
          from_email: string
          id?: string
          is_opened?: boolean
          is_read?: boolean
          is_starred?: boolean
          opened_at?: string | null
          provider_message_id?: string | null
          sent_at?: string
          subject?: string
          synced_at?: string
          tenant_id?: string
          thread_id?: string | null
          to_emails?: Json
        }
        Update: {
          account_id?: string
          bcc_emails?: Json
          body_html?: string | null
          body_text?: string | null
          cc_emails?: Json
          direction?: string
          from_email?: string
          id?: string
          is_opened?: boolean
          is_read?: boolean
          is_starred?: boolean
          opened_at?: string | null
          provider_message_id?: string | null
          sent_at?: string
          subject?: string
          synced_at?: string
          tenant_id?: string
          thread_id?: string | null
          to_emails?: Json
        }
        Relationships: [
          {
            foreignKeyName: "emails_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "email_accounts"
            referencedColumns: ["id"]
          },
        ]
      }
      files: {
        Row: {
          created_at: string
          file_name: string
          file_size: number
          file_url: string
          id: string
          record_id: string
          tenant_id: string
          uploaded_by: string
        }
        Insert: {
          created_at?: string
          file_name: string
          file_size?: number
          file_url: string
          id?: string
          record_id: string
          tenant_id?: string
          uploaded_by?: string
        }
        Update: {
          created_at?: string
          file_name?: string
          file_size?: number
          file_url?: string
          id?: string
          record_id?: string
          tenant_id?: string
          uploaded_by?: string
        }
        Relationships: [
          {
            foreignKeyName: "files_record_id_fkey"
            columns: ["record_id"]
            isOneToOne: false
            referencedRelation: "crm_records"
            referencedColumns: ["id"]
          },
        ]
      }
      import_errors: {
        Row: {
          created_at: string
          error_message: string
          id: string
          job_id: string
          row_data: Json | null
          row_number: number
        }
        Insert: {
          created_at?: string
          error_message: string
          id?: string
          job_id: string
          row_data?: Json | null
          row_number: number
        }
        Update: {
          created_at?: string
          error_message?: string
          id?: string
          job_id?: string
          row_data?: Json | null
          row_number?: number
        }
        Relationships: [
          {
            foreignKeyName: "import_errors_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "import_jobs"
            referencedColumns: ["id"]
          },
        ]
      }
      import_jobs: {
        Row: {
          column_mapping: Json
          completed_at: string | null
          created_at: string
          failed_rows: number
          file_name: string
          id: string
          module_id: string
          processed_rows: number
          status: string
          success_rows: number
          tenant_id: string
          total_rows: number
        }
        Insert: {
          column_mapping?: Json
          completed_at?: string | null
          created_at?: string
          failed_rows?: number
          file_name?: string
          id?: string
          module_id: string
          processed_rows?: number
          status?: string
          success_rows?: number
          tenant_id?: string
          total_rows?: number
        }
        Update: {
          column_mapping?: Json
          completed_at?: string | null
          created_at?: string
          failed_rows?: number
          file_name?: string
          id?: string
          module_id?: string
          processed_rows?: number
          status?: string
          success_rows?: number
          tenant_id?: string
          total_rows?: number
        }
        Relationships: []
      }
      installed_templates: {
        Row: {
          id: string
          installed_at: string
          template_name: string
          template_slug: string
          tenant_id: string
        }
        Insert: {
          id?: string
          installed_at?: string
          template_name: string
          template_slug: string
          tenant_id?: string
        }
        Update: {
          id?: string
          installed_at?: string
          template_name?: string
          template_slug?: string
          tenant_id?: string
        }
        Relationships: []
      }
      invitations: {
        Row: {
          accepted: boolean
          created_at: string
          email: string
          expires_at: string
          id: string
          invited_by: string | null
          role_id: string | null
          tenant_id: string
          token: string
        }
        Insert: {
          accepted?: boolean
          created_at?: string
          email: string
          expires_at?: string
          id?: string
          invited_by?: string | null
          role_id?: string | null
          tenant_id?: string
          token?: string
        }
        Update: {
          accepted?: boolean
          created_at?: string
          email?: string
          expires_at?: string
          id?: string
          invited_by?: string | null
          role_id?: string | null
          tenant_id?: string
          token?: string
        }
        Relationships: [
          {
            foreignKeyName: "invitations_role_id_fkey"
            columns: ["role_id"]
            isOneToOne: false
            referencedRelation: "roles"
            referencedColumns: ["id"]
          },
        ]
      }
      module_fields: {
        Row: {
          created_at: string
          field_type: string
          id: string
          is_required: boolean
          label: string
          module_id: string
          name: string
          options_json: Json | null
          order_index: number
          tenant_id: string
        }
        Insert: {
          created_at?: string
          field_type?: string
          id?: string
          is_required?: boolean
          label: string
          module_id: string
          name: string
          options_json?: Json | null
          order_index?: number
          tenant_id?: string
        }
        Update: {
          created_at?: string
          field_type?: string
          id?: string
          is_required?: boolean
          label?: string
          module_id?: string
          name?: string
          options_json?: Json | null
          order_index?: number
          tenant_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "module_fields_module_id_fkey"
            columns: ["module_id"]
            isOneToOne: false
            referencedRelation: "modules"
            referencedColumns: ["id"]
          },
        ]
      }
      module_relationships: {
        Row: {
          created_at: string
          from_module_id: string
          id: string
          relationship_type: string
          tenant_id: string
          to_module_id: string
        }
        Insert: {
          created_at?: string
          from_module_id: string
          id?: string
          relationship_type?: string
          tenant_id?: string
          to_module_id: string
        }
        Update: {
          created_at?: string
          from_module_id?: string
          id?: string
          relationship_type?: string
          tenant_id?: string
          to_module_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "module_relationships_from_module_id_fkey"
            columns: ["from_module_id"]
            isOneToOne: false
            referencedRelation: "modules"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "module_relationships_to_module_id_fkey"
            columns: ["to_module_id"]
            isOneToOne: false
            referencedRelation: "modules"
            referencedColumns: ["id"]
          },
        ]
      }
      modules: {
        Row: {
          color: string
          created_at: string
          description: string
          icon: string
          id: string
          is_system: boolean
          name: string
          order_index: number
          slug: string
          tenant_id: string
        }
        Insert: {
          color?: string
          created_at?: string
          description?: string
          icon?: string
          id?: string
          is_system?: boolean
          name: string
          order_index?: number
          slug: string
          tenant_id?: string
        }
        Update: {
          color?: string
          created_at?: string
          description?: string
          icon?: string
          id?: string
          is_system?: boolean
          name?: string
          order_index?: number
          slug?: string
          tenant_id?: string
        }
        Relationships: []
      }
      notes: {
        Row: {
          content: string
          created_at: string
          created_by: string
          id: string
          record_id: string
          tenant_id: string
        }
        Insert: {
          content: string
          created_at?: string
          created_by?: string
          id?: string
          record_id: string
          tenant_id?: string
        }
        Update: {
          content?: string
          created_at?: string
          created_by?: string
          id?: string
          record_id?: string
          tenant_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "notes_record_id_fkey"
            columns: ["record_id"]
            isOneToOne: false
            referencedRelation: "crm_records"
            referencedColumns: ["id"]
          },
        ]
      }
      permissions: {
        Row: {
          action: string
          id: string
          module_name: string
        }
        Insert: {
          action: string
          id?: string
          module_name: string
        }
        Update: {
          action?: string
          id?: string
          module_name?: string
        }
        Relationships: []
      }
      pipeline_stages: {
        Row: {
          color: string
          created_at: string
          id: string
          name: string
          pipeline_id: string
          position: number
        }
        Insert: {
          color?: string
          created_at?: string
          id?: string
          name: string
          pipeline_id: string
          position?: number
        }
        Update: {
          color?: string
          created_at?: string
          id?: string
          name?: string
          pipeline_id?: string
          position?: number
        }
        Relationships: [
          {
            foreignKeyName: "pipeline_stages_pipeline_id_fkey"
            columns: ["pipeline_id"]
            isOneToOne: false
            referencedRelation: "pipelines"
            referencedColumns: ["id"]
          },
        ]
      }
      pipelines: {
        Row: {
          created_at: string
          id: string
          module_id: string
          name: string
          tenant_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          module_id: string
          name: string
          tenant_id?: string
        }
        Update: {
          created_at?: string
          id?: string
          module_id?: string
          name?: string
          tenant_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          email: string
          id: string
          name: string
          notifications_enabled: boolean | null
          phone: string | null
          status: string
          tenant_id: string
          timezone: string | null
          updated_at: string
          user_id: string | null
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          email: string
          id?: string
          name?: string
          notifications_enabled?: boolean | null
          phone?: string | null
          status?: string
          tenant_id?: string
          timezone?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          email?: string
          id?: string
          name?: string
          notifications_enabled?: boolean | null
          phone?: string | null
          status?: string
          tenant_id?: string
          timezone?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Relationships: []
      }
      record_tags: {
        Row: {
          color: string
          created_at: string
          id: string
          record_id: string
          tag: string
          tenant_id: string
        }
        Insert: {
          color?: string
          created_at?: string
          id?: string
          record_id: string
          tag: string
          tenant_id?: string
        }
        Update: {
          color?: string
          created_at?: string
          id?: string
          record_id?: string
          tag?: string
          tenant_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "record_tags_record_id_fkey"
            columns: ["record_id"]
            isOneToOne: false
            referencedRelation: "crm_records"
            referencedColumns: ["id"]
          },
        ]
      }
      reports: {
        Row: {
          chart_type: string
          created_at: string
          filters_json: Json
          group_by: string
          id: string
          is_dashboard_widget: boolean
          metrics: Json
          module_id: string
          name: string
          schedule_cron: string | null
          schedule_email: string | null
          tenant_id: string
          updated_at: string
        }
        Insert: {
          chart_type?: string
          created_at?: string
          filters_json?: Json
          group_by?: string
          id?: string
          is_dashboard_widget?: boolean
          metrics?: Json
          module_id: string
          name: string
          schedule_cron?: string | null
          schedule_email?: string | null
          tenant_id?: string
          updated_at?: string
        }
        Update: {
          chart_type?: string
          created_at?: string
          filters_json?: Json
          group_by?: string
          id?: string
          is_dashboard_widget?: boolean
          metrics?: Json
          module_id?: string
          name?: string
          schedule_cron?: string | null
          schedule_email?: string | null
          tenant_id?: string
          updated_at?: string
        }
        Relationships: []
      }
      role_permissions: {
        Row: {
          action: string
          id: string
          module_name: string
          role_id: string
        }
        Insert: {
          action: string
          id?: string
          module_name: string
          role_id: string
        }
        Update: {
          action?: string
          id?: string
          module_name?: string
          role_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "role_permissions_role_id_fkey"
            columns: ["role_id"]
            isOneToOne: false
            referencedRelation: "roles"
            referencedColumns: ["id"]
          },
        ]
      }
      roles: {
        Row: {
          created_at: string
          description: string | null
          id: string
          name: string
          tenant_id: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          name: string
          tenant_id?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          name?: string
          tenant_id?: string
        }
        Relationships: []
      }
      tasks: {
        Row: {
          assigned_to: string | null
          created_at: string
          created_by: string
          description: string
          due_date: string | null
          id: string
          priority: string
          record_id: string | null
          status: string
          tenant_id: string
          title: string
          updated_at: string
        }
        Insert: {
          assigned_to?: string | null
          created_at?: string
          created_by?: string
          description?: string
          due_date?: string | null
          id?: string
          priority?: string
          record_id?: string | null
          status?: string
          tenant_id?: string
          title: string
          updated_at?: string
        }
        Update: {
          assigned_to?: string | null
          created_at?: string
          created_by?: string
          description?: string
          due_date?: string | null
          id?: string
          priority?: string
          record_id?: string | null
          status?: string
          tenant_id?: string
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "tasks_record_id_fkey"
            columns: ["record_id"]
            isOneToOne: false
            referencedRelation: "crm_records"
            referencedColumns: ["id"]
          },
        ]
      }
      team_members: {
        Row: {
          created_at: string
          id: string
          profile_id: string
          team_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          profile_id: string
          team_id: string
        }
        Update: {
          created_at?: string
          id?: string
          profile_id?: string
          team_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "team_members_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "team_members_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
        ]
      }
      teams: {
        Row: {
          created_at: string
          description: string | null
          id: string
          name: string
          tenant_id: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          name: string
          tenant_id?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          name?: string
          tenant_id?: string
        }
        Relationships: []
      }
      tenants: {
        Row: {
          created_at: string
          id: string
          name: string
          owner_id: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          name?: string
          owner_id?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          owner_id?: string | null
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role_id: string
          tenant_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role_id: string
          tenant_id?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role_id?: string
          tenant_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_roles_role_id_fkey"
            columns: ["role_id"]
            isOneToOne: false
            referencedRelation: "roles"
            referencedColumns: ["id"]
          },
        ]
      }
      whatsapp_accounts: {
        Row: {
          access_token: string
          business_account_id: string
          created_at: string
          display_phone_number: string
          id: string
          is_active: boolean
          is_connected: boolean
          phone_number_id: string
          tenant_id: string
          webhook_verify_token: string
        }
        Insert: {
          access_token: string
          business_account_id: string
          created_at?: string
          display_phone_number: string
          id?: string
          is_active?: boolean
          is_connected?: boolean
          phone_number_id: string
          tenant_id?: string
          webhook_verify_token?: string
        }
        Update: {
          access_token?: string
          business_account_id?: string
          created_at?: string
          display_phone_number?: string
          id?: string
          is_active?: boolean
          is_connected?: boolean
          phone_number_id?: string
          tenant_id?: string
          webhook_verify_token?: string
        }
        Relationships: []
      }
      whatsapp_conversations: {
        Row: {
          account_id: string
          contact_id: string | null
          contact_name: string | null
          contact_phone: string
          created_at: string
          id: string
          last_message: string | null
          last_message_at: string
          module_name: string | null
          record_id: string | null
          tenant_id: string
          unread_count: number
        }
        Insert: {
          account_id: string
          contact_id?: string | null
          contact_name?: string | null
          contact_phone: string
          created_at?: string
          id?: string
          last_message?: string | null
          last_message_at?: string
          module_name?: string | null
          record_id?: string | null
          tenant_id?: string
          unread_count?: number
        }
        Update: {
          account_id?: string
          contact_id?: string | null
          contact_name?: string | null
          contact_phone?: string
          created_at?: string
          id?: string
          last_message?: string | null
          last_message_at?: string
          module_name?: string | null
          record_id?: string | null
          tenant_id?: string
          unread_count?: number
        }
        Relationships: [
          {
            foreignKeyName: "whatsapp_conversations_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "whatsapp_accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "whatsapp_conversations_record_id_fkey"
            columns: ["record_id"]
            isOneToOne: false
            referencedRelation: "crm_records"
            referencedColumns: ["id"]
          },
        ]
      }
      whatsapp_messages: {
        Row: {
          content: string
          conversation_id: string
          created_at: string
          delivered_at: string | null
          direction: string
          error_message: string | null
          id: string
          media_url: string | null
          message_type: string
          read_at: string | null
          sent_at: string
          status: string
          template_name: string | null
          tenant_id: string
          whatsapp_message_id: string | null
        }
        Insert: {
          content: string
          conversation_id: string
          created_at?: string
          delivered_at?: string | null
          direction?: string
          error_message?: string | null
          id?: string
          media_url?: string | null
          message_type?: string
          read_at?: string | null
          sent_at?: string
          status?: string
          template_name?: string | null
          tenant_id?: string
          whatsapp_message_id?: string | null
        }
        Update: {
          content?: string
          conversation_id?: string
          created_at?: string
          delivered_at?: string | null
          direction?: string
          error_message?: string | null
          id?: string
          media_url?: string | null
          message_type?: string
          read_at?: string | null
          sent_at?: string
          status?: string
          template_name?: string | null
          tenant_id?: string
          whatsapp_message_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "whatsapp_messages_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "whatsapp_conversations"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      check_permission: {
        Args: { _action: string; _module_name: string; _user_id: string }
        Returns: boolean
      }
      get_user_tenant_id: { Args: { _user_id: string }; Returns: string }
      search_records: {
        Args: {
          _filters?: Json
          _limit_val?: number
          _module_id?: string
          _offset_val?: number
          _tenant_id: string
          _text_query?: string
        }
        Returns: {
          out_created_at: string
          out_id: string
          out_module_id: string
          out_tenant_id: string
          out_updated_at: string
          out_values: Json
        }[]
      }
    }
    Enums: {
      [_ in never]: never
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
    Enums: {},
  },
} as const
